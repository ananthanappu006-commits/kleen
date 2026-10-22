/**
 * KLEEN — Cloud Functions OTP Handlers
 */

const crypto = require("crypto");
const { sendBrevoOtpEmail, maskEmail } = require("./brevoEmailService");

function hashOTP(otp, salt) {
  return crypto.createHash("sha256").update(`${salt}:${otp}:kleen_secret_salt_v1`).digest("hex");
}

async function handleSendOtp(db, req, res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { email, role } = req.body || {};
  const normalizedEmail = (email || "").toLowerCase().trim();

  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return res.status(400).json({ success: false, message: "Please enter a valid email address." });
  }

  const roleClean = (role || "").toLowerCase() === "partner" ? "partner" : "customer";
  const now = new Date();

  // Check rate limit: max 5 sends per hour
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const recentSnaps = await db.collection("otp_verifications")
    .where("email", "==", normalizedEmail)
    .where("created_at", ">=", oneHourAgo)
    .get();

  if (recentSnaps.size >= 5) {
    return res.status(429).json({ success: false, message: "Too many verification requests. Please try again in an hour." });
  }

  // Check 60s cooldown
  const latestSnaps = await db.collection("otp_verifications")
    .where("email", "==", normalizedEmail)
    .orderBy("created_at", "desc")
    .limit(1)
    .get();

  if (!latestSnaps.empty) {
    const latestDoc = latestSnaps.docs[0].data();
    if (!latestDoc.used && latestDoc.resend_available_at && latestDoc.resend_available_at.toDate() > now) {
      const rem = Math.ceil((latestDoc.resend_available_at.toDate().getTime() - now.getTime()) / 1000);
      return res.status(429).json({ success: false, message: `Please wait ${rem} seconds before requesting another code.` });
    }
  }

  // Invalidate previous OTPs
  const batch = db.batch();
  recentSnaps.forEach((doc) => {
    if (!doc.data().used) {
      batch.update(doc.ref, { used: true });
    }
  });

  const otp = crypto.randomInt(100000, 999999).toString();
  const salt = crypto.randomBytes(16).toString("hex");
  const otpHash = hashOTP(otp, salt);

  const otpRef = db.collection("otp_verifications").doc();
  batch.set(otpRef, {
    id: otpRef.id,
    email: normalizedEmail,
    otp_hash: otpHash,
    salt,
    expires_at: new Date(now.getTime() + 5 * 60 * 1000),
    attempts: 0,
    max_attempts: 5,
    resend_available_at: new Date(now.getTime() + 60 * 1000),
    used: false,
    created_at: now,
    role: roleClean,
  });

  await batch.commit();

  try {
    await sendBrevoOtpEmail(normalizedEmail, otp, roleClean);
    return res.status(200).json({ success: true, message: "Verification code sent to your email." });
  } catch (err) {
    return res.status(503).json({ success: false, message: "We couldn't send the verification code. Please try again." });
  }
}

async function handleVerifyOtp(admin, db, req, res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { email, otp, role } = req.body || {};
  const normalizedEmail = (email || "").toLowerCase().trim();
  const cleanOtp = (otp || "").trim();

  if (!normalizedEmail || cleanOtp.length !== 6) {
    return res.status(400).json({ success: false, message: "Please enter a valid 6-digit code." });
  }

  const snaps = await db.collection("otp_verifications")
    .where("email", "==", normalizedEmail)
    .orderBy("created_at", "desc")
    .limit(1)
    .get();

  if (snaps.empty) {
    return res.status(400).json({ success: false, message: "No verification code was sent to this email." });
  }

  const docSnap = snaps.docs[0];
  const doc = docSnap.data();
  const now = new Date();

  if (doc.used) {
    return res.status(400).json({ success: false, message: "This verification code has already been used. Please request a new code." });
  }
  if (doc.attempts >= doc.max_attempts) {
    return res.status(429).json({ success: false, message: "Too many attempts. Please request a new code." });
  }
  if (now > doc.expires_at.toDate()) {
    return res.status(400).json({ success: false, message: "This verification code has expired. Please request a new code." });
  }

  const computedHash = hashOTP(cleanOtp, doc.salt);
  if (computedHash !== doc.otp_hash) {
    const updatedAttempts = (doc.attempts || 0) + 1;
    await docSnap.ref.update({ attempts: updatedAttempts });
    const rem = doc.max_attempts - updatedAttempts;
    if (rem <= 0) {
      return res.status(429).json({ success: false, message: "Too many attempts. Please request a new code." });
    }
    return res.status(400).json({ success: false, message: `Incorrect verification code. ${rem} attempts remaining.` });
  }

  await docSnap.ref.update({ used: true, verified_at: now });

  // Resolve or create user in Firebase / Firestore
  let firebaseUser;
  try {
    firebaseUser = await admin.auth().getUserByEmail(normalizedEmail);
  } catch (e) {
    firebaseUser = await admin.auth().createUser({
      email: normalizedEmail,
      emailVerified: true,
      displayName: normalizedEmail.split("@")[0],
    });
  }

  const targetRole = role === "partner" || doc.role === "partner" ? "partner" : "customer";
  const userRef = db.collection("users").doc(firebaseUser.uid);
  const userSnap = await userRef.get();

  let userData;
  if (!userSnap.exists) {
    userData = {
      userId: firebaseUser.uid,
      id: firebaseUser.uid,
      email: normalizedEmail,
      fullName: firebaseUser.displayName || normalizedEmail.split("@")[0],
      role: targetRole,
      accountStatus: "ACTIVE",
      emailVerified: true,
      authMethod: "email_otp",
      createdAt: now.toISOString(),
      lastLogin: now.toISOString(),
    };
    await userRef.set(userData);
    if (targetRole === "partner") {
      await db.collection("partners").doc(firebaseUser.uid).set({
        ...userData,
        partnerId: firebaseUser.uid,
        kycStatus: "NOT_STARTED",
        isEligibleForBooking: false,
        rating: 5.0,
        totalCompletedJobs: 0,
        totalEarnings: 0,
      });
    }
  } else {
    userData = userSnap.data();
    await userRef.update({ lastLogin: now.toISOString(), emailVerified: true });
  }

  const customToken = await admin.auth().createCustomToken(firebaseUser.uid, { role: userData.role });

  return res.status(200).json({
    success: true,
    verified: true,
    message: "Email verified successfully.",
    token: customToken,
    user: userData,
  });
}

module.exports = {
  handleSendOtp,
  handleVerifyOtp,
};
