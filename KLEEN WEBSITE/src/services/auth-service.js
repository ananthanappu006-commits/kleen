/**
 * KLEEN — Authentication & Role-Based Access Control Service
 */

import { SEED_USERS } from "../config/seed-data.js";
import { db } from "./db-service.js";
import { firebaseClient } from "./firebase/firebase-client.js";

class AuthService {
  constructor() {
    this.storageKey = "kleen_auth_session_v2";
    this.currentUser = null;
    this.authListeners = new Set();
    this.initSession();
    this.setupFirebaseListener();
  }

  setupFirebaseListener() {
    firebaseClient.onAuthStateChanged(async (fbUser) => {
      if (fbUser) {
        const snapshot = db.getSnapshot();
        let user = (snapshot.users || []).find(u => 
          (u.email && u.email.toLowerCase() === fbUser.email?.toLowerCase()) ||
          (u.userId && u.userId === fbUser.uid)
        );
        let partnerData = (snapshot.partners || []).find(p =>
          (p.email && p.email.toLowerCase() === fbUser.email?.toLowerCase()) ||
          (p.partnerId && p.partnerId === fbUser.uid) ||
          (p.userId && p.userId === fbUser.uid)
        );

        if (firebaseClient.getDoc && (!user || !partnerData)) {
          try {
            const remotePartner = await firebaseClient.getDoc("partners", fbUser.uid);
            if (remotePartner) {
              partnerData = { ...(partnerData || {}), ...remotePartner };
            }
          } catch (e) {
            console.warn("Firestore partner restore:", e);
          }
        }

        const isAdmin = fbUser.email && fbUser.email.toLowerCase().includes("admin");
        const isPartner = partnerData != null || (user && user.role === "partner") || (fbUser.email && fbUser.email.toLowerCase().includes("partner"));
        const role = isAdmin ? "admin" : (isPartner ? "partner" : "customer");

        if (!user) {
          user = {
            userId: fbUser.uid || ("usr_" + Date.now()),
            partnerId: isPartner ? (fbUser.uid || ("usr_" + Date.now())) : undefined,
            fullName: fbUser.displayName || (partnerData?.fullName) || (fbUser.email ? fbUser.email.split("@")[0] : "KLEEN User"),
            email: fbUser.email || "",
            photoURL: fbUser.photoURL || "",
            role,
            accountStatus: "ACTIVE",
            ...(isPartner ? {
              kycStatus: partnerData?.kycStatus || "NOT_STARTED",
              rating: partnerData?.rating || 5.0,
              totalRatings: partnerData?.totalRatings || 0,
              totalCompletedJobs: partnerData?.totalCompletedJobs || 0,
              totalEarnings: partnerData?.totalEarnings || 0,
              isOnline: false,
              isEligibleForBooking: false
            } : {}),
            ...(partnerData || {})
          };
          snapshot.users = [user, ...(snapshot.users || [])];
          if (role === "partner") {
            snapshot.partners = [user, ...(snapshot.partners || [])];
          }
          db.saveSnapshot(snapshot);
        } else if (isPartner && user.role !== "partner") {
          user.role = "partner";
          user.partnerId = user.userId;
          if (partnerData) Object.assign(user, partnerData);
          db.saveSnapshot(snapshot);
        }

        this.currentUser = user;
        this.saveSession();
      }
    });
  }

  initSession() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.currentUser = JSON.parse(stored);
        if (this.currentUser && this.currentUser.role === "partner") {
          const partnerKey = this.currentUser.partnerId || this.currentUser.userId;
          const fresh = db.getPartnerById(partnerKey) || db.getPartnerById(this.currentUser.userId);
          if (fresh) {
            this.currentUser = { ...this.currentUser, ...fresh };
          }
        }
      } else {
        this.currentUser = null;
      }
    } catch (e) {
      this.currentUser = null;
    }
  }

  saveSession() {
    if (this.currentUser) {
      localStorage.setItem(this.storageKey, JSON.stringify(this.currentUser));
    } else {
      localStorage.removeItem(this.storageKey);
    }
    this.notifySubscribers();
  }

  subscribe(callback) {
    this.authListeners.add(callback);
    callback(this.currentUser);
    return () => this.authListeners.delete(callback);
  }

  notifySubscribers() {
    this.authListeners.forEach(cb => {
      try { cb(this.currentUser); } catch (err) { console.error(err); }
    });
  }

  getCurrentUser() {
    // If the current user is a partner, refresh their live status from the database
    if (this.currentUser && this.currentUser.role === "partner") {
      const partnerKey = this.currentUser.partnerId || this.currentUser.userId;
      const freshPartner = db.getPartnerById(partnerKey) || db.getPartnerById(this.currentUser.userId);
      if (freshPartner) {
        this.currentUser = { ...this.currentUser, ...freshPartner };
      }
    }
    return this.currentUser;
  }

  getRole() {
    return this.currentUser ? this.currentUser.role : "public";
  }

  async verifyCredentials(email, password, roleHint = null) {
    const cleanIdentifier = (email || "").toLowerCase().trim();
    if (!cleanIdentifier || !password) {
      throw new Error("Please enter both email and password.");
    }

    // 1. Check for administrator credentials
    const isAdminLogin = cleanIdentifier === "kleenadmin" || 
                         cleanIdentifier === "kleenadmin@gmail.com" || 
                         cleanIdentifier === "admin@kleen.in" || 
                         (cleanIdentifier.includes("admin") && !roleHint);
    if (isAdminLogin) {
      if ((cleanIdentifier === "kleenadmin" || cleanIdentifier === "kleenadmin@gmail.com") && password === "kleenadmin@123") {
        return { success: true, isAdmin: true, email: "kleenadmin@gmail.com" };
      }
      throw new Error("Invalid administrator username or password. Access denied.");
    }

    // 2. Firebase live authentication if configured
    if (firebaseClient.isLive) {
      try {
        const fbUser = await firebaseClient.loginWithFirebase(email, password);
        return { success: true, user: fbUser };
      } catch (err) {
        // Fallback to local user if in database
        const snapshot = db.getSnapshot();
        const localUser = (snapshot.users || []).find(u => 
          (u.email && u.email.toLowerCase() === cleanIdentifier) ||
          (u.username && u.username.toLowerCase() === cleanIdentifier)
        );
        if (localUser) {
          if (localUser.password && localUser.password !== password) {
            throw new Error("Incorrect password. Please try again.");
          }
          return { success: true, user: localUser };
        }
        throw err;
      }
    }

    // 3. Local reactive database authentication
    const snapshot = db.getSnapshot();
    const user = (snapshot.users || []).find(u => 
      (u.email && u.email.toLowerCase() === cleanIdentifier) ||
      (u.username && u.username.toLowerCase() === cleanIdentifier)
    );
    if (user && user.password && user.password !== password) {
      throw new Error("Incorrect password. Please try again.");
    }
    return { success: true, user: user || null };
  }

  completeAdminLogin(adminEmail = "kleenadmin@gmail.com") {
    const snapshot = db.getSnapshot();
    let adminUser = (snapshot.users || []).find(u => u.role === "admin" || u.email === adminEmail || u.username === "kleenadmin") || {
      userId: "usr_admin_kleen",
      role: "admin",
      fullName: "KLEEN Executive Admin",
      email: adminEmail,
      username: "kleenadmin",
      accountStatus: "ACTIVE"
    };
    this.currentUser = adminUser;
    this.saveSession();
    return adminUser;
  }

  async login(email, password, roleHint = null) {
    const cleanIdentifier = (email || "").toLowerCase().trim();

    // 1. Administrator credentials check (requires kleenadmin & kleenadmin@123)
    const isAdminLogin = cleanIdentifier === "kleenadmin" || 
                         cleanIdentifier === "kleenadmin@gmail.com" || 
                         cleanIdentifier === "admin@kleen.in" || 
                         (cleanIdentifier.includes("admin") && !roleHint);

    if (isAdminLogin) {
      if ((cleanIdentifier === "kleenadmin" || cleanIdentifier === "kleenadmin@gmail.com") && password === "kleenadmin@123") {
        const adminUser = this.completeAdminLogin("kleenadmin@gmail.com");
        return { success: true, user: adminUser };
      }
      throw new Error("Invalid administrator username or password. Access denied.");
    }

    // 2. Firebase live authentication if configured
    if (firebaseClient.isLive) {
      try {
        const fbUser = await firebaseClient.loginWithFirebase(email, password);
        const snapshot = db.getSnapshot();
        let user = (snapshot.users || []).find(u => 
          (u.email && u.email.toLowerCase() === email.toLowerCase()) ||
          (u.userId && u.userId === fbUser.uid)
        );
        let partnerData = (snapshot.partners || []).find(p => 
          (p.email && p.email.toLowerCase() === email.toLowerCase()) ||
          (p.partnerId && p.partnerId === fbUser.uid) ||
          (p.userId && p.userId === fbUser.uid)
        );

        if (firebaseClient.getDoc) {
          try {
            const remotePartner = await firebaseClient.getDoc("partners", fbUser.uid);
            if (remotePartner) {
              partnerData = { ...(partnerData || {}), ...remotePartner };
            }
          } catch (e) {
            console.warn("Firestore partner fetch:", e);
          }
        }

        const isPartner = roleHint === "partner" || partnerData != null || (user && user.role === "partner") || cleanIdentifier.includes("partner");

        if (!user) {
          user = {
            userId: fbUser.uid,
            partnerId: isPartner ? fbUser.uid : undefined,
            fullName: fbUser.displayName || (partnerData?.fullName) || email.split("@")[0],
            email: fbUser.email,
            role: isPartner ? "partner" : "customer",
            accountStatus: "ACTIVE",
            ...(isPartner ? {
              kycStatus: partnerData?.kycStatus || "NOT_STARTED",
              rating: partnerData?.rating || 5.0,
              totalRatings: partnerData?.totalRatings || 0,
              totalCompletedJobs: partnerData?.totalCompletedJobs || 0,
              totalEarnings: partnerData?.totalEarnings || 0,
              isOnline: false,
              isEligibleForBooking: false
            } : {}),
            ...(partnerData || {})
          };
          snapshot.users = [user, ...(snapshot.users || [])];
          if (isPartner) {
            snapshot.partners = [user, ...(snapshot.partners || [])];
          }
          db.saveSnapshot(snapshot);
        } else {
          if (isPartner && user.role !== "partner") {
            user.role = "partner";
            user.partnerId = user.userId;
            if (partnerData) Object.assign(user, partnerData);
            db.saveSnapshot(snapshot);
          } else if (partnerData) {
            Object.assign(user, partnerData);
            db.saveSnapshot(snapshot);
          }
        }

        this.currentUser = user;
        this.saveSession();

        if (isPartner) {
          firebaseClient.saveDoc("users", user.userId, { role: "partner", email: user.email, fullName: user.fullName });
          firebaseClient.saveDoc("partners", user.userId, user);
        }

        return { success: true, user };
      } catch (err) {
        console.warn("Firebase Auth login attempt:", err.message);
        // Fallback to local user if registered in local database (e.g. offline or demo seed)
        const snapshot = db.getSnapshot();
        const localUser = (snapshot.users || []).find(u => 
          (u.email && u.email.toLowerCase() === cleanIdentifier) ||
          (u.username && u.username.toLowerCase() === cleanIdentifier)
        );
        if (localUser) {
          if (roleHint === "partner") {
            localUser.role = "partner";
            localUser.partnerId = localUser.partnerId || localUser.userId;
          }
          this.currentUser = localUser;
          this.saveSession();
          return { success: true, user: localUser };
        }
        throw err;
      }
    }

    // 3. Local reactive database authentication (offline fallback)
    const snapshot = db.getSnapshot();
    const isPartnerTarget = roleHint === "partner" || cleanIdentifier.includes("partner");
    let user = (snapshot.users || []).find(u => 
      (u.email && u.email.toLowerCase() === cleanIdentifier) ||
      (u.username && u.username.toLowerCase() === cleanIdentifier)
    );

    if (user) {
      if (isPartnerTarget && user.role !== "partner") {
        user.role = "partner";
        user.partnerId = user.userId;
      }
      this.currentUser = user;
      this.saveSession();
      return { success: true, user };
    }

    // Auto-create local user session if not found in offline mode
    const newUser = {
      userId: "usr_" + Date.now(),
      partnerId: isPartnerTarget ? "usr_" + Date.now() : undefined,
      fullName: cleanIdentifier.split("@")[0].toUpperCase(),
      email: cleanIdentifier.includes("@") ? cleanIdentifier : `${cleanIdentifier}@kleen.in`,
      role: isPartnerTarget ? "partner" : "customer",
      accountStatus: "ACTIVE",
      ...(isPartnerTarget ? {
        kycStatus: "NOT_STARTED",
        rating: 5.0,
        totalCompletedJobs: 0,
        totalEarnings: 0,
        isOnline: false,
        isEligibleForBooking: false
      } : {})
    };
    snapshot.users = [newUser, ...(snapshot.users || [])];
    if (isPartnerTarget) {
      snapshot.partners = [newUser, ...(snapshot.partners || [])];
    }
    db.saveSnapshot(snapshot);
    this.currentUser = newUser;
    this.saveSession();
    return { success: true, user: newUser };
  }

  async loginWithGoogle(roleHint = "customer") {
    if (firebaseClient.isLive) {
      const fbUser = await firebaseClient.loginWithGoogle();
      const snapshot = db.getSnapshot();
      let user = (snapshot.users || []).find(u => 
        (u.email && u.email.toLowerCase() === fbUser.email?.toLowerCase()) ||
        (u.userId && u.userId === fbUser.uid)
      );
      let partnerData = (snapshot.partners || []).find(p => 
        (p.email && p.email.toLowerCase() === fbUser.email?.toLowerCase()) ||
        (p.partnerId && p.partnerId === fbUser.uid) ||
        (p.userId && p.userId === fbUser.uid)
      );

      if (firebaseClient.getDoc) {
        try {
          const remotePartner = await firebaseClient.getDoc("partners", fbUser.uid);
          if (remotePartner) {
            partnerData = { ...(partnerData || {}), ...remotePartner };
          }
        } catch (e) {
          console.warn("Firestore partner fetch:", e);
        }
      }

      const isPartner = roleHint === "partner" || partnerData != null || (user && user.role === "partner");

      if (!user) {
        user = {
          userId: fbUser.uid,
          partnerId: isPartner ? fbUser.uid : undefined,
          fullName: fbUser.displayName || (partnerData?.fullName) || (fbUser.email ? fbUser.email.split("@")[0] : "Google User"),
          email: fbUser.email || "",
          phone: fbUser.phoneNumber || (isPartner ? "+91 98765 43210" : "+91 98000 12345"),
          photoURL: fbUser.photoURL || "",
          role: isPartner ? "partner" : "customer",
          accountStatus: "ACTIVE",
          ...(isPartner ? {
            kycStatus: partnerData?.kycStatus || "NOT_STARTED",
            rating: partnerData?.rating || 5.0,
            totalRatings: partnerData?.totalRatings || 0,
            totalCompletedJobs: partnerData?.totalCompletedJobs || 0,
            totalEarnings: partnerData?.totalEarnings || 0,
            isOnline: false,
            isEligibleForBooking: false
          } : {}),
          ...(partnerData || {})
        };
        snapshot.users = [user, ...(snapshot.users || [])];
        if (isPartner) {
          snapshot.partners = [user, ...(snapshot.partners || [])];
        }
        db.saveSnapshot(snapshot);
      } else if (isPartner && user.role !== "partner") {
        user.role = "partner";
        user.partnerId = user.userId;
        if (partnerData) Object.assign(user, partnerData);
        db.saveSnapshot(snapshot);
      }

      this.currentUser = user;
      this.saveSession();

      if (isPartner) {
        firebaseClient.saveDoc("users", user.userId, { role: "partner", email: user.email, fullName: user.fullName });
        firebaseClient.saveDoc("partners", user.userId, user);
      }

      return { success: true, user };
    }
  }

  async register(userData) {
    let firebaseUid = null;
    if (firebaseClient.isLive && userData.email && userData.password) {
      try {
        const fbUser = await firebaseClient.registerWithFirebase(userData.email, userData.password, userData.fullName);
        firebaseUid = fbUser.uid;
      } catch (err) {
        console.warn("Firebase Auth registration:", err.message);
        throw err;
      }
    }

    const newUser = {
      userId: firebaseUid || ("usr_" + Date.now()),
      accountStatus: "ACTIVE",
      createdAt: new Date().toISOString(),
      ...userData
    };

    if (newUser.role === "partner") {
      newUser.partnerId = newUser.userId;
      newUser.kycStatus = "NOT_STARTED";
      newUser.isEligibleForBooking = false;
      newUser.isOnline = false;
      newUser.rating = 5.0;
      newUser.totalRatings = 0;
      newUser.totalCompletedJobs = 0;
      newUser.totalEarnings = 0;
    }

    const snapshot = db.getSnapshot();
    snapshot.users = [newUser, ...(snapshot.users || [])];
    if (newUser.role === "partner") {
      snapshot.partners = [newUser, ...(snapshot.partners || [])];
    }
    db.saveSnapshot(snapshot, newUser.role === "partner" ? "partners" : "users", newUser.userId, newUser);

    if (firebaseClient.isLive) {
      firebaseClient.saveDoc("users", newUser.userId, {
        userId: newUser.userId,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone || "",
        role: newUser.role,
        createdAt: newUser.createdAt
      });
      if (newUser.role === "partner") {
        firebaseClient.saveDoc("partners", newUser.userId, newUser);
      }
    }

    this.currentUser = newUser;
    this.saveSession();
    return { success: true, user: newUser };
  }

  async sendPasswordReset(email) {
    if (firebaseClient.isLive) {
      await firebaseClient.sendPasswordResetEmail(email);
    }
    return { success: true, message: `Password reset link sent to ${email}. Check your inbox.` };
  }


  async logout() {
    if (firebaseClient.isLive) {
      await firebaseClient.logoutFirebase();
    }
    this.currentUser = null;
    this.saveSession();
  }
}

export const auth = new AuthService();
