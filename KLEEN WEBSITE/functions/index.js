const functions = require("firebase-functions");
const admin = require("firebase-admin");
const Razorpay = require("razorpay");
const { verifySignature } = require("./src/payments/razorpay");
const { atomicAssignPartner } = require("./src/bookings/dispatch");
const { processKycDecision } = require("./src/partners/kyc");
const { sendInAppNotification } = require("./src/notifications/sender");
const { logAdminAction } = require("./src/admin/audit");
const { handleSendOtp, handleVerifyOtp } = require("./src/auth/otpHandler");

admin.initializeApp();
const db = admin.firestore();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || (functions.config().razorpay && functions.config().razorpay.key_id) || "rzp_test_TbrOTwP7wGgfOG",
  key_secret: process.env.RAZORPAY_KEY_SECRET || (functions.config().razorpay && functions.config().razorpay.key_secret) || "PkmI51s3HZ1gVBDqM1NybEpV"
});

/**
 * 1. Create Razorpay Order
 */
exports.createRazorpayOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }
  const { serviceId, addressId, bookingDate, startTime, notes } = data;
  const serviceSnap = await db.collection("services").doc(serviceId).get();
  if (!serviceSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Service not found.");
  }
  const service = serviceSnap.data();

  const basePrice = Number(service.price) || 499;
  const platformFee = 49;
  const tax = Math.round(basePrice * 0.18);
  const totalAmount = basePrice + platformFee + tax;

  const bookingRef = db.collection("bookings").doc();
  await bookingRef.set({
    bookingId: bookingRef.id,
    customerId: context.auth.uid,
    serviceId: service.serviceId,
    serviceName: service.name,
    serviceImage: service.image || "",
    duration: service.duration,
    basePrice,
    platformFee,
    tax,
    totalAmount,
    bookingDate,
    startTime,
    addressId: addressId || "default",
    customerNotes: notes || "",
    paymentStatus: "PENDING",
    bookingStatus: "PAYMENT_PENDING",
    partnerId: null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  const order = await razorpay.orders.create({
    amount: totalAmount * 100,
    currency: "INR",
    receipt: `rcpt_${bookingRef.id.slice(0, 18)}`
  });

  return {
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    bookingId: bookingRef.id,
    keyId: razorpay.key_id
  };
});

/**
 * 2. Verify Razorpay Payment Signature
 */
exports.verifyRazorpayPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingId } = data;
  const isValid = verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, razorpay.key_secret);

  if (!isValid) {
    throw new functions.https.HttpsError("permission-denied", "Signature verification failed.");
  }

  const batch = db.batch();
  const bRef = db.collection("bookings").doc(bookingId);
  batch.update(bRef, {
    paymentStatus: "SUCCESS",
    bookingStatus: "CONFIRMED",
    confirmedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });

  await batch.commit();
  await sendInAppNotification(db, {
    userId: context.auth.uid,
    type: "BOOKING_CONFIRMED",
    title: "Booking Confirmed! 🎉",
    message: "Your payment was verified. Finding verified maid...",
    bookingId
  });

  return { success: true, bookingId };
});

/**
 * 3. Atomic Partner Assignment (Double Booking Concurrency Protection)
 */
exports.assignPartner = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "Authentication required.");
  }
  const { bookingId, partnerId, partnerName } = data;
  return await atomicAssignPartner(db, bookingId, partnerId, partnerName);
});

/**
 * 4. Admin KYC Review
 */
exports.adminReviewKyc = functions.https.onCall(async (data, context) => {
  const { partnerId, decision, rejectionReason } = data;
  const res = await processKycDecision(db, partnerId, decision, rejectionReason, (context.auth && context.auth.uid) || "admin");
  await logAdminAction(db, {
    adminId: (context.auth && context.auth.uid) || "admin",
    action: `KYC_${decision}`,
    targetType: "PARTNER",
    targetId: partnerId,
    description: `Partner KYC ${decision}. ${rejectionReason ? 'Reason: ' + rejectionReason : ''}`
  });
  return res;
});

/**
 * 5. Brevo Email OTP Authentication Endpoints
 */
exports.sendOtp = functions.https.onRequest(async (req, res) => {
  return handleSendOtp(db, req, res);
});

exports.verifyOtp = functions.https.onRequest(async (req, res) => {
  return handleVerifyOtp(admin, db, req, res);
});

exports.resendOtp = functions.https.onRequest(async (req, res) => {
  return handleSendOtp(db, req, res);
});
