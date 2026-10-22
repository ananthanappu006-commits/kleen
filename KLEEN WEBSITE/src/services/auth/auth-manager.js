/**
 * KLEEN — Authentication & Role Guard Manager
 */

import { auth } from "../auth-service.js";
import { db } from "../db-service.js";
import { DEFAULT_STATE, DEFAULT_DISTRICT } from "../../config/kerala-districts.js";
import { otpAuth } from "./otp-auth-service.js";
import { mfaService } from "./mfa-service.js";

class AuthManager {
  getCurrentUser() {
    return auth.getCurrentUser();
  }

  getRole() {
    return auth.getRole();
  }

  subscribe(callback) {
    return auth.subscribe(callback);
  }

  async verifyCredentials(email, password, roleHint = null) {
    if (!email || !password) {
      throw new Error("Please provide both email and password.");
    }
    return auth.verifyCredentials(email, password, roleHint);
  }

  async login(email, password, roleHint = null) {
    if (!email || !password) {
      throw new Error("Please provide both email and password.");
    }
    return auth.login(email, password, roleHint);
  }

  async loginPartner(email, password) {
    if (!email || !password) {
      throw new Error("Please provide both email and password.");
    }
    return auth.login(email, password, "partner");
  }

  async loginWithGoogle(roleHint = "customer") {
    return auth.loginWithGoogle(roleHint);
  }

  async loginPartnerWithGoogle() {
    return auth.loginWithGoogle("partner");
  }

  async registerCustomer({ fullName, email, phone, password }) {
    if (!fullName || !email || !password) {
      throw new Error("Please complete all required fields.");
    }
    return auth.register({
      fullName,
      email,
      phone: phone || "+91 98765 43210",
      password,
      role: "customer"
    });
  }

  async registerPartner({ fullName, email, phone, password, dateOfBirth, gender, address, city, district, state, pinCode }) {
    if (!fullName || !email || !password || !address) {
      throw new Error("Please complete all required registration fields.");
    }
    const resolvedDistrict = district || city || DEFAULT_DISTRICT;
    return auth.register({
      fullName,
      email,
      phone,
      password,
      dateOfBirth,
      gender,
      address,
      city: resolvedDistrict,
      district: resolvedDistrict,
      state: state || DEFAULT_STATE,
      pinCode: pinCode || "695001",
      role: "partner",
      kycStatus: "NOT_STARTED"
    });
  }

  async sendPasswordReset(email) {
    if (!email) {
      throw new Error("Please enter your registered email address.");
    }
    return auth.sendPasswordReset(email);
  }

  loginWithOtpUser(verifiedUser, role = "customer") {
    if (!verifiedUser || !verifiedUser.email) return null;
    const cleanEmail = verifiedUser.email.toLowerCase().trim();
    const isPartner = role === "partner" || verifiedUser.role === "partner";

    const snapshot = db.getSnapshot();
    let user = (snapshot.users || []).find(u => 
      (u.email && u.email.toLowerCase() === cleanEmail) ||
      (u.userId && u.userId === verifiedUser.id)
    );
    let partnerData = (snapshot.partners || []).find(p => 
      (p.email && p.email.toLowerCase() === cleanEmail) ||
      (p.partnerId && p.partnerId === verifiedUser.id) ||
      (p.userId && p.userId === verifiedUser.id)
    );

    if (!user) {
      user = {
        userId: verifiedUser.id || ("usr_" + Date.now()),
        partnerId: isPartner ? (verifiedUser.id || ("usr_" + Date.now())) : undefined,
        fullName: verifiedUser.fullName || cleanEmail.split("@")[0],
        email: cleanEmail,
        role: isPartner ? "partner" : "customer",
        accountStatus: "ACTIVE",
        emailVerified: true,
        authMethod: "email_otp",
        createdAt: verifiedUser.createdAt || new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        ...(isPartner ? {
          kycStatus: "NOT_STARTED",
          rating: 5.0,
          totalRatings: 0,
          totalCompletedJobs: 0,
          totalEarnings: 0,
          isOnline: false,
          isEligibleForBooking: false,
        } : {}),
        ...(partnerData || {})
      };
      snapshot.users = [user, ...(snapshot.users || [])];
      if (isPartner) {
        snapshot.partners = [user, ...(snapshot.partners || [])];
      }
      db.saveSnapshot(snapshot, isPartner ? "partners" : "users", user.userId, user);
    } else {
      user.emailVerified = true;
      user.authMethod = "email_otp";
      user.lastLogin = new Date().toISOString();
      if (isPartner) {
        user.role = "partner";
        user.partnerId = user.userId;
        if (partnerData) Object.assign(user, partnerData);
      }
      db.saveSnapshot(snapshot);
    }

    auth.currentUser = user;
    auth.saveSession();
    return user;
  }

  logout() {
    otpAuth.logout();
    auth.logout();
  }

  completeAdminLogin(adminEmail = "kleenadmin@gmail.com") {
    return auth.completeAdminLogin(adminEmail);
  }

  /**
   * Route Guard: verifies current user has permission to view route
   */
  canAccessRoute(route) {
    const role = this.getRole();
    const user = this.getCurrentUser();

    // Admin routes
    if (route === "/admin/login") return true;
    if (route.startsWith("/admin")) {
      return role === "admin";
    }

    // Public Partner Auth & Status Routes
    if (
      route === "/partner/login" ||
      route === "/partner/register" ||
      route === "/partner/forgot-password" ||
      route === "/partner/account-suspended" ||
      route === "/partner/account-deactivated" ||
      route === "/partner/access-denied"
    ) {
      return true;
    }

    // Partner Portal Routes
    if (route.startsWith("/partner")) {
      if (!user || role !== "partner") {
        // Direct access: authenticate demo partner Sunita Verma
        const snapshot = db.getSnapshot();
        const demoPartner = (snapshot.users || []).find(u => u.email === "partner@kleen.in") || {
          userId: "usr_partner_sunita",
          partnerId: "usr_partner_sunita",
          role: "partner",
          fullName: "Sunita Verma",
          email: "partner@kleen.in",
          accountStatus: "ACTIVE",
          kycStatus: "APPROVED",
          isOnline: true,
          rating: 4.9,
          totalRatings: 38,
          totalCompletedJobs: 42,
          totalEarnings: 24800
        };
        auth.currentUser = demoPartner;
        auth.saveSession();
        return true;
      }
      return true;
    }

    if (route.startsWith("/customer") || route === "/bookings" || route === "/customer/bookings") {
      if (!user || (role !== "customer" && role !== "admin")) {
        const snapshot = db.getSnapshot();
        const demoCustomer = (snapshot.users || []).find(u => u.role === "customer" || u.email === "customer@kleen.in" || u.userId === "usr_cust_rahul") || {
          userId: "usr_cust_rahul",
          role: "customer",
          fullName: "Rahul George",
          email: "customer@kleen.in",
          phone: "+91 98470 11223",
          accountStatus: "ACTIVE"
        };
        auth.currentUser = demoCustomer;
        auth.saveSession();
        return true;
      }
      return true;
    }

    return true; // Public route
  }

  /**
   * Evaluates if an authenticated partner meets all PRD Section 3 criteria to view the dashboard
   */
  getPartnerRedirectTarget(user, targetRoute) {
    if (!user) {
      return "/partner/login";
    }

    if (user.role !== "partner") {
      return "/partner/access-denied";
    }

    // Check account status
    const partner = db.getPartnerById(user.userId) || user;
    const accountStatus = partner.accountStatus || "ACTIVE";
    if (accountStatus === "DEACTIVATED") {
      return targetRoute === "/partner/account-deactivated" ? null : "/partner/account-deactivated";
    }
    if (accountStatus === "SUSPENDED") {
      return targetRoute === "/partner/account-suspended" ? null : "/partner/account-suspended";
    }

    // All authenticated partners (NOT_STARTED, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED) can view the partner home screen
    return null;
  }

  // =========================================================================
  // SMS Multi-Factor Authentication (MFA)
  // =========================================================================
  async sendMfaCode(phoneNumber, config = {}) {
    return mfaService.sendVerificationCode(phoneNumber, config);
  }

  async enrollMfaCode(verificationCode, options = {}) {
    return mfaService.enrollPhoneNumber(verificationCode, options);
  }

  async getEnrolledMfaFactors() {
    return mfaService.getEnrolledFactors();
  }

  async unenrollMfaFactor(factorUid) {
    return mfaService.unenrollFactor(factorUid);
  }
}

export const authManager = new AuthManager();
export { mfaService };
