/**
 * KLEEN — Brevo Email OTP Authentication Service (Client)
 * Interfaces with backend endpoints:
 *   POST /api/auth/send-otp
 *   POST /api/auth/verify-otp
 *   POST /api/auth/resend-otp
 *   POST /api/auth/logout
 *   GET  /api/auth/me
 */

class OtpAuthService {
  constructor() {
    this.baseUrl = "/api/auth";
    this.emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  }

  validateEmail(email) {
    const clean = (email || "").trim().toLowerCase();
    return clean.length > 3 && this.emailRegex.test(clean);
  }

  async sendOtp(email, role = "customer") {
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!this.validateEmail(cleanEmail)) {
      throw new Error("Please enter a valid email address.");
    }

    try {
      const resp = await fetch(`${this.baseUrl}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, role }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.success) {
        throw new Error(data.message || "We couldn't send the verification code. Please try again.");
      }

      return {
        success: true,
        otp: data.otp || null,
        message: data.message || "Verification code sent to your email.",
        devNotice: data.devNotice || null,
        detectedIP: data.detectedIP || null,
      };
    } catch (err) {
      if (err.message && !err.message.includes("fetch")) {
        throw err;
      }
      throw new Error("We couldn't send the verification code. Please try again.");
    }
  }

  async verifyOtp(email, otp, role = "customer") {
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanOtp = (otp || "").trim().replace(/\D/g, "");

    if (!this.validateEmail(cleanEmail)) {
      throw new Error("Please enter a valid email address.");
    }
    if (cleanOtp.length !== 6) {
      throw new Error("Please enter a complete 6-digit code.");
    }

    try {
      const resp = await fetch(`${this.baseUrl}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, otp: cleanOtp, role }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.success) {
        throw new Error(data.message || "Incorrect verification code. Please try again.");
      }

      return {
        success: true,
        verified: true,
        message: data.message || "Email verified successfully.",
        user: data.user,
        token: data.token,
      };
    } catch (err) {
      if (err.message && !err.message.includes("fetch")) {
        throw err;
      }
      throw new Error("Incorrect verification code. Please try again.");
    }
  }

  async resendOtp(email) {
    const cleanEmail = (email || "").trim().toLowerCase();
    if (!this.validateEmail(cleanEmail)) {
      throw new Error("Please enter a valid email address.");
    }

    try {
      const resp = await fetch(`${this.baseUrl}/resend-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await resp.json().catch(() => ({}));
      if (!resp.ok || !data.success) {
        throw new Error(data.message || "Please wait before requesting another code.");
      }

      return {
        success: true,
        otp: data.otp || null,
        message: data.message || "Verification code resent successfully.",
        devNotice: data.devNotice || null,
        detectedIP: data.detectedIP || null,
      };
    } catch (err) {
      if (err.message && !err.message.includes("fetch")) {
        throw err;
      }
      throw new Error("We couldn't send the verification code. Please try again.");
    }
  }

  async logout() {
    try {
      await fetch(`${this.baseUrl}/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
    } catch (e) {
      // Ignore network failures on logout
    }
  }

  async getMe() {
    try {
      const resp = await fetch(`${this.baseUrl}/me`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.user || null;
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}

export const otpAuth = new OtpAuthService();
