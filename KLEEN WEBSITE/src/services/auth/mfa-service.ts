/**
 * KLEEN — SMS Multi-Factor Authentication (MFA) TypeScript Module
 * 
 * Target Project: kleen-web
 * Firebase Modular SDK (v10)
 * 
 * Features:
 * 1. Initialize invisible RecaptchaVerifier
 * 2. Obtain MultiFactorSession from currentUser
 * 3. Send SMS verification code to an E.164 phone number
 * 4. Complete enrollment using PhoneMultiFactorGenerator.assertion
 */

import {
  Auth,
  User,
  RecaptchaVerifier,
  multiFactor,
  MultiFactorUser,
  MultiFactorSession,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  PhoneAuthCredential,
  MultiFactorAssertion,
  MultiFactorInfo
} from "firebase/auth";

export interface MfaSendVerificationOptions {
  containerOrButtonId?: string | HTMLElement;
  user?: User | null;
}

export interface MfaVerificationSession {
  verificationId: string;
  phoneNumber: string;
}

export interface MfaEnrollmentOptions {
  verificationId?: string;
  displayName?: string;
  user?: User | null;
}

export interface MfaEnrollmentResult {
  success: boolean;
  enrolledFactors: MultiFactorInfo[];
  message: string;
}

export class SmsMfaManager {
  private auth: Auth;
  private recaptchaVerifier: RecaptchaVerifier | null = null;
  private defaultContainerId: string = "mfa-recaptcha-container";
  private activeVerificationId: string | null = null;
  private pendingPhoneNumber: string | null = null;

  constructor(auth: Auth) {
    this.auth = auth;
  }

  /**
   * Helper to ensure an invisible DOM element exists for reCAPTCHA
   */
  private ensureContainer(containerId: string): HTMLElement {
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
   * Format Firebase MFA errors into friendly messages
   */
  public formatError(err: any): string {
    const code = err?.code || "";
    switch (code) {
      case "auth/invalid-verification-code":
        return "The 6-digit SMS verification code is incorrect.";
      case "auth/code-expired":
        return "The SMS verification code has expired. Please request a new code.";
      case "auth/invalid-phone-number":
        return "Invalid phone number format. Please provide E.164 format (+919876543210).";
      case "auth/second-factor-already-enrolled":
        return "This phone number is already registered as an MFA factor.";
      case "auth/requires-recent-login":
        return "This sensitive operation requires a recent sign-in. Please log in again.";
      default:
        return err?.message || "An authentication error occurred.";
    }
  }

  /**
   * 1. Create an invisible RecaptchaVerifier
   */
  public async initRecaptchaVerifier(
    container: string | HTMLElement = this.defaultContainerId,
    callback?: (response: any) => void
  ): Promise<RecaptchaVerifier> {
    if (this.recaptchaVerifier) {
      try {
        this.recaptchaVerifier.clear();
      } catch (e) {
        console.warn("Cleared existing RecaptchaVerifier:", e);
      }
      this.recaptchaVerifier = null;
    }

    const target = typeof container === "string" 
      ? this.ensureContainer(container) 
      : container;

    this.recaptchaVerifier = new RecaptchaVerifier(this.auth, target, {
      size: "invisible",
      callback: (token: any) => {
        if (callback) callback(token);
      }
    });

    await this.recaptchaVerifier.render();
    return this.recaptchaVerifier;
  }

  /**
   * 2. Obtain a multi-factor session from the currentUser
   */
  public async getMultiFactorSession(targetUser?: User | null): Promise<MultiFactorSession> {
    const user = targetUser || this.auth.currentUser;
    if (!user) {
      throw new Error("No authenticated user found. Must be signed in to enroll in MFA.");
    }

    const mfUser: MultiFactorUser = multiFactor(user);
    const session: MultiFactorSession = await mfUser.getSession();
    return session;
  }

  /**
   * 3. Send a verification code to a phone number
   */
  public async sendVerificationCode(
    phoneNumber: string,
    options: MfaSendVerificationOptions = {}
  ): Promise<MfaVerificationSession> {
    const cleanPhone = phoneNumber.trim().replace(/[\s-]/g, "");
    if (!cleanPhone.startsWith("+")) {
      throw new Error("Phone number must include country code in E.164 format (e.g. +919876543210)");
    }

    // 1. Invisible reCAPTCHA verifier
    const verifier = await this.initRecaptchaVerifier(options.containerOrButtonId || this.defaultContainerId);

    // 2. Multi-factor session
    const session = await this.getMultiFactorSession(options.user);

    // 3. Send verification code via PhoneAuthProvider
    const phoneAuthProvider = new PhoneAuthProvider(this.auth);
    const verificationId = await phoneAuthProvider.verifyPhoneNumber(
      {
        phoneNumber: cleanPhone,
        session
      },
      verifier
    );

    this.activeVerificationId = verificationId;
    this.pendingPhoneNumber = cleanPhone;

    return {
      verificationId,
      phoneNumber: cleanPhone
    };
  }

  /**
   * 4. Accept a verification code and complete enrollment using PhoneMultiFactorGenerator.assertion
   */
  public async enrollWithCode(
    verificationCode: string,
    options: MfaEnrollmentOptions = {}
  ): Promise<MfaEnrollmentResult> {
    const code = (verificationCode || "").trim().replace(/\D/g, "");
    if (code.length !== 6) {
      throw new Error("Please enter a valid 6-digit verification code.");
    }

    const verificationId = options.verificationId || this.activeVerificationId;
    if (!verificationId) {
      throw new Error("No active verification session. Please request a new verification code.");
    }

    const user = options.user || this.auth.currentUser;
    if (!user) {
      throw new Error("User session expired. Please sign in again.");
    }

    // Build PhoneAuthCredential
    const phoneCredential: PhoneAuthCredential = PhoneAuthProvider.credential(
      verificationId,
      code
    );

    // Generate assertion via PhoneMultiFactorGenerator.assertion
    const assertion: MultiFactorAssertion = PhoneMultiFactorGenerator.assertion(phoneCredential);

    // Enroll on multiFactor(user)
    const mfUser: MultiFactorUser = multiFactor(user);
    const displayName = options.displayName || `Mobile (${this.pendingPhoneNumber || "SMS"})`;

    await mfUser.enroll(assertion, displayName);

    this.activeVerificationId = null;

    return {
      success: true,
      enrolledFactors: mfUser.enrolledFactors,
      message: "SMS Multi-Factor Authentication successfully enrolled."
    };
  }

  /**
   * List all enrolled factors for currentUser
   */
  public getEnrolledFactors(targetUser?: User | null): MultiFactorInfo[] {
    const user = targetUser || this.auth.currentUser;
    if (!user) return [];
    return multiFactor(user).enrolledFactors;
  }

  /**
   * Unenroll an existing MFA factor
   */
  public async unenroll(factorInfoOrUid: MultiFactorInfo | string, targetUser?: User | null): Promise<void> {
    const user = targetUser || this.auth.currentUser;
    if (!user) throw new Error("No user signed in.");

    const mfUser = multiFactor(user);
    let factorToUnenroll: MultiFactorInfo | undefined;

    if (typeof factorInfoOrUid === "string") {
      factorToUnenroll = mfUser.enrolledFactors.find(f => f.uid === factorInfoOrUid);
      if (!factorToUnenroll) {
        throw new Error("Factor not found.");
      }
    } else {
      factorToUnenroll = factorInfoOrUid;
    }

    await mfUser.unenroll(factorToUnenroll);
  }
}
