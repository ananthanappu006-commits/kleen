/**
 * Type declarations for KLEEN SMS Multi-Factor Authentication Service
 */

import type { User, MultiFactorSession, MultiFactorInfo } from "firebase/auth";

export interface MfaSendCodeOptions {
  containerId?: string;
  user?: User | null;
}

export interface MfaSendCodeResult {
  verificationId: string;
  phoneNumber: string;
}

export interface MfaEnrollOptions {
  verificationId?: string;
  displayName?: string;
  user?: User | null;
}

export interface MfaEnrollResult {
  success: boolean;
  enrolledFactors: MultiFactorInfo[];
  message: string;
}

export interface EnrolledFactorDisplay {
  uid: string;
  factorId: string;
  displayName: string;
  phoneNumber?: string;
  enrollmentTime?: string;
}

export declare class MfaService {
  /**
   * 1. Initializes the invisible RecaptchaVerifier on the specified container.
   */
  initRecaptcha(container?: string | HTMLElement, options?: { callback?: (response: any) => void, onExpired?: () => void }): Promise<any>;

  /**
   * 2. Obtains a MultiFactorSession from the currentUser or target user.
   */
  getMultiFactorSession(targetUser?: User | null): Promise<MultiFactorSession>;

  /**
   * 3. Sends an SMS verification code to an E.164 phone number.
   */
  sendVerificationCode(phoneNumber: string, config?: MfaSendCodeOptions): Promise<MfaSendCodeResult>;

  /**
   * 4. Accepts a 6-digit verification code and completes enrollment using PhoneMultiFactorGenerator.assertion.
   */
  enrollPhoneNumber(verificationCode: string, options?: MfaEnrollOptions): Promise<MfaEnrollResult>;

  /**
   * Lists all enrolled second factors for the user.
   */
  getEnrolledFactors(targetUser?: User | null): Promise<EnrolledFactorDisplay[]>;

  /**
   * Unenrolls an existing second factor.
   */
  unenrollFactor(factorUid: string, targetUser?: User | null): Promise<boolean>;

  /**
   * Translates Firebase MFA error codes to user-friendly messages.
   */
  formatMfaError(err: any): string;
}

export declare const mfaService: MfaService;
