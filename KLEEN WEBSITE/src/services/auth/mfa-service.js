/**
 * KLEEN — SMS Multi-Factor Authentication (MFA) Service
 * 
 * Supports Firebase Web SDK v10 modular API for SMS MFA Enrollment:
 * 1. Invisible RecaptchaVerifier initialization & lifecycle management.
 * 2. Multi-factor session acquisition for the currentUser.
 * 3. SMS verification code dispatch to an E.164 phone number.
 * 4. Verification & completion using PhoneMultiFactorGenerator.assertion.
 * 
 * Project: kleen-web
 */

import { firebaseClient } from "../firebase/firebase-client.js";

class MfaService {
  constructor() {
    this.recaptchaVerifier = null;
    this.defaultContainerId = "mfa-recaptcha-container";
    this.activeVerificationId = null;
    this.pendingPhoneNumber = null;
  }

  /**
   * Helper to ensure a DOM container exists for invisible reCAPTCHA.
   * Creates an off-screen container if none exists.
   * @param {string} containerId 
   * @returns {HTMLElement}
   */
  ensureRecaptchaContainer(containerId = this.defaultContainerId) {
    if (typeof document === "undefined") {
      throw new Error("MFA Service requires a browser DOM environment.");
    }
    let container = document.getElementById(containerId);
    if (!container) {
      container = document.createElement("div");
      container.id = containerId;
      container.setAttribute("aria-hidden", "true");
      container.style.position = "fixed";
      container.style.bottom = "0";
      container.style.right = "0";
      container.style.zIndex = "-1";
      container.style.opacity = "0";
      container.style.pointerEvents = "none";
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * Translate Firebase MFA errors into human-readable messages.
   * @param {any} err 
   * @returns {string}
   */
  formatMfaError(err) {
    const code = err?.code || "";
    switch (code) {
      case "auth/invalid-verification-code":
        return "The 6-digit SMS verification code is incorrect. Please check the SMS and try again.";
      case "auth/code-expired":
        return "The SMS verification code has expired. Please request a new code.";
      case "auth/invalid-phone-number":
        return "Invalid phone number. Please provide a valid phone number in E.164 format (e.g., +919876543210).";
      case "auth/missing-phone-number":
        return "Phone number is required.";
      case "auth/quota-exceeded":
        return "SMS quota for this project has been exceeded. Please try again later.";
      case "auth/captcha-check-failed":
        return "reCAPTCHA verification failed. Please refresh the page and try again.";
      case "auth/second-factor-already-enrolled":
        return "This phone number is already enrolled as a second factor for your account.";
      case "auth/maximum-second-factor-count-exceeded":
        return "You have reached the maximum number of second factors allowed for this account.";
      case "auth/unsupported-first-factor":
        return "Multi-factor authentication is not supported for this sign-in method.";
      case "auth/unverified-email":
        return "Your email address must be verified before enrolling in multi-factor authentication.";
      case "auth/requires-recent-login":
        return "This operation is sensitive and requires a recent login. Please log out and sign in again before enrolling in MFA.";
      case "auth/too-many-requests":
        return "Too many requests sent. Please wait a few minutes before trying again.";
      default:
        return (err?.message || "An error occurred during multi-factor authentication.")
          .replace(/^Firebase:\s*/, "")
          .replace(/\s*\(auth\/[^)]+\)\.?$/, "");
    }
  }

  /**
   * Step 1: Create an invisible RecaptchaVerifier.
   * Reuses existing verifier or clears old one to avoid duplicate widget exceptions.
   * 
   * @param {string|HTMLElement} [container=this.defaultContainerId] - ID or element for recaptcha
   * @param {Object} [options={}] - Optional callbacks (callback, 'expired-callback')
   * @returns {Promise<any>} The initialized RecaptchaVerifier instance
   */
  async initRecaptcha(container = this.defaultContainerId, options = {}) {
    const auth = await firebaseClient.getAuth();
    const authSDK = await firebaseClient.getAuthSDK();

    if (!auth || !authSDK || !authSDK.RecaptchaVerifier) {
      throw new Error("Firebase Auth SDK is not available. Ensure Firebase is initialized.");
    }

    // Clean up existing verifier if previously registered
    if (this.recaptchaVerifier) {
      try {
        this.recaptchaVerifier.clear();
      } catch (e) {
        console.warn("MFA: Clearing existing reCAPTCHA instance:", e);
      }
      this.recaptchaVerifier = null;
    }

    const targetContainer = typeof container === "string" 
      ? this.ensureRecaptchaContainer(container) 
      : container;

    this.recaptchaVerifier = new authSDK.RecaptchaVerifier(auth, targetContainer, {
      size: "invisible",
      callback: (response) => {
        if (typeof options.callback === "function") {
          options.callback(response);
        }
      },
      "expired-callback": () => {
        if (typeof options.onExpired === "function") {
          options.onExpired();
        }
      }
    });

    // Warm-up / render the verifier widget
    await this.recaptchaVerifier.render();
    return this.recaptchaVerifier;
  }

  /**
   * Step 2: Obtain a multi-factor session from currentUser.
   * 
   * @param {any} [targetUser] - Optional Firebase User; defaults to auth.currentUser
   * @returns {Promise<any>} The MultiFactorSession object
   */
  async getMultiFactorSession(targetUser = null) {
    const auth = await firebaseClient.getAuth();
    const authSDK = await firebaseClient.getAuthSDK();

    const user = targetUser || auth?.currentUser;
    if (!user) {
      throw new Error("No authenticated user found. User must be signed in to enroll in MFA.");
    }

    if (!authSDK.multiFactor) {
      throw new Error("Firebase multiFactor is not available in the current SDK bundle.");
    }

    try {
      const mfUser = authSDK.multiFactor(user);
      const session = await mfUser.getSession();
      return session;
    } catch (err) {
      throw new Error(this.formatMfaError(err));
    }
  }

  /**
   * Step 3: Send a verification code to a phone number.
   * Formats the phone number, gets the session, uses invisible reCAPTCHA,
   * and invokes PhoneAuthProvider.verifyPhoneNumber.
   * 
   * @param {string} phoneNumber - E.164 formatted phone number (e.g., +919876543210)
   * @param {Object} [config={}]
   * @param {string} [config.containerId] - Container for invisible reCAPTCHA
   * @param {any} [config.user] - Optional specific user
   * @returns {Promise<{ verificationId: string, phoneNumber: string }>}
   */
  async sendVerificationCode(phoneNumber, config = {}) {
    if (!phoneNumber || typeof phoneNumber !== "string") {
      throw new Error("Please enter a valid phone number.");
    }

    const cleanPhone = phoneNumber.trim().replace(/[\s-]/g, "");
    if (!cleanPhone.startsWith("+")) {
      throw new Error("Phone number must include international country code (e.g., +919876543210).");
    }

    const auth = await firebaseClient.getAuth();
    const authSDK = await firebaseClient.getAuthSDK();

    if (!auth || !authSDK || !authSDK.PhoneAuthProvider) {
      throw new Error("Firebase PhoneAuthProvider is not available.");
    }

    try {
      // 1. Ensure RecaptchaVerifier is initialized
      const verifier = await this.initRecaptcha(config.containerId || this.defaultContainerId);

      // 2. Obtain MultiFactorSession from currentUser
      const session = await this.getMultiFactorSession(config.user);

      // 3. Initiate phone verification with PhoneAuthProvider
      const phoneAuthProvider = new authSDK.PhoneAuthProvider(auth);
      const phoneInfoOptions = {
        phoneNumber: cleanPhone,
        session: session
      };

      const verificationId = await phoneAuthProvider.verifyPhoneNumber(phoneInfoOptions, verifier);

      this.activeVerificationId = verificationId;
      this.pendingPhoneNumber = cleanPhone;

      return {
        verificationId,
        phoneNumber: cleanPhone
      };
    } catch (err) {
      // If reCAPTCHA error, reset verifier
      if (this.recaptchaVerifier) {
        try {
          this.recaptchaVerifier.clear();
        } catch (_) {}
        this.recaptchaVerifier = null;
      }
      throw new Error(this.formatMfaError(err));
    }
  }

  /**
   * Step 4: Accept a verification code and complete enrollment using PhoneMultiFactorGenerator.assertion.
   * 
   * @param {string} verificationCode - 6-digit SMS OTP
   * @param {Object} [options={}]
   * @param {string} [options.verificationId] - Verification ID from sendVerificationCode (optional if stored)
   * @param {string} [options.displayName="Primary Mobile"] - Friendly name for this enrolled second factor
   * @param {any} [options.user] - Optional specific user
   * @returns {Promise<{ success: boolean, enrolledFactors: Array<any>, message: string }>}
   */
  async enrollPhoneNumber(verificationCode, options = {}) {
    const code = (verificationCode || "").trim().replace(/\D/g, "");
    if (code.length !== 6) {
      throw new Error("Please enter the complete 6-digit SMS verification code.");
    }

    const verificationId = options.verificationId || this.activeVerificationId;
    if (!verificationId) {
      throw new Error("No active verification session. Please request a new verification code.");
    }

    const auth = await firebaseClient.getAuth();
    const authSDK = await firebaseClient.getAuthSDK();

    const user = options.user || auth?.currentUser;
    if (!user) {
      throw new Error("User session expired. Please sign in again.");
    }

    if (!authSDK.PhoneAuthProvider || !authSDK.PhoneMultiFactorGenerator) {
      throw new Error("Firebase MultiFactor generators are not available in this build.");
    }

    try {
      // 1. Build PhoneAuthCredential from verificationId and verificationCode
      const phoneAuthCredential = authSDK.PhoneAuthProvider.credential(verificationId, code);

      // 2. Generate multi-factor assertion using PhoneMultiFactorGenerator.assertion
      const multiFactorAssertion = authSDK.PhoneMultiFactorGenerator.assertion(phoneAuthCredential);

      // 3. Complete enrollment on the currentUser's multiFactor object
      const mfUser = authSDK.multiFactor(user);
      const factorDisplayName = options.displayName || `Mobile (${this.pendingPhoneNumber || "SMS"})`;

      await mfUser.enroll(multiFactorAssertion, factorDisplayName);

      // Reset active pending session
      this.activeVerificationId = null;
      const enrolledFactors = mfUser.enrolledFactors || [];

      return {
        success: true,
        enrolledFactors,
        message: `Phone number ${this.pendingPhoneNumber || ""} enrolled in Multi-Factor Authentication successfully.`
      };
    } catch (err) {
      throw new Error(this.formatMfaError(err));
    }
  }

  /**
   * List enrolled second factors for the currentUser.
   * @param {any} [targetUser] 
   * @returns {Promise<Array<{ uid: string, displayName: string, phoneNumber?: string, enrolledAt: string }>>}
   */
  async getEnrolledFactors(targetUser = null) {
    const auth = await firebaseClient.getAuth();
    const authSDK = await firebaseClient.getAuthSDK();

    const user = targetUser || auth?.currentUser;
    if (!user) return [];

    try {
      const mfUser = authSDK.multiFactor(user);
      return (mfUser.enrolledFactors || []).map(f => ({
        uid: f.uid,
        factorId: f.factorId,
        displayName: f.displayName || "SMS Factor",
        phoneNumber: f.phoneNumber,
        enrollmentTime: f.enrollmentTime
      }));
    } catch (err) {
      console.warn("MFA: Failed to retrieve enrolled factors:", err);
      return [];
    }
  }

  /**
   * Unenroll an enrolled MFA factor.
   * @param {string} factorUid 
   * @param {any} [targetUser] 
   * @returns {Promise<boolean>}
   */
  async unenrollFactor(factorUid, targetUser = null) {
    const auth = await firebaseClient.getAuth();
    const authSDK = await firebaseClient.getAuthSDK();

    const user = targetUser || auth?.currentUser;
    if (!user) {
      throw new Error("No authenticated user found.");
    }

    try {
      const mfUser = authSDK.multiFactor(user);
      const factorToUnenroll = (mfUser.enrolledFactors || []).find(f => f.uid === factorUid);
      if (!factorToUnenroll) {
        throw new Error("Factor not found for this user account.");
      }

      await mfUser.unenroll(factorToUnenroll);
      return true;
    } catch (err) {
      throw new Error(this.formatMfaError(err));
    }
  }
}

export const mfaService = new MfaService();
