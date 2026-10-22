/**
 * KLEEN — 6-Digit Email OTP Verification Component
 * Supports:
 * - 6 individual auto-advancing input boxes
 * - Keyboard navigation (Backspace, Arrow keys)
 * - 6-digit clipboard paste support
 * - 60-second resend cooldown timer
 * - 5-minute code expiration timer
 * - Interactive states: IDLE, SENDING_OTP, OTP_SENT, VERIFYING_OTP, VERIFIED, ERROR, RESENDING_OTP, COOLDOWN
 * - Change email callback
 */

import { otpAuth } from "../services/auth/otp-auth-service.js";
import { icon } from "./icons.js";

export function renderOtpVerificationView(email, role = "customer") {
  let roleBadge = "Customer Verification";
  if (role === "partner") {
    roleBadge = "Partner Verification";
  } else if (role === "admin") {
    roleBadge = "Administrator 2-Step Verification";
  }

  return `
    <div class="otp-verification-wrapper" style="animation: fadeIn 0.25s ease;">
      <div style="text-align: center; margin-bottom: 1.75rem;">
        <div style="display: flex; justify-content: center; margin-bottom: 0.75rem;">
          <div class="icon-box icon-box-lg icon-box-emerald" style="width: 54px; height: 54px; border-radius: 50%; background: #ECFDF5; color: #047857; display: flex; align-items: center; justify-content: center;">
            ${icon('mail', { size: 26 })}
          </div>
        </div>
        <span class="badge badge-success" style="margin-bottom: 0.5rem; font-size: 0.75rem;">${roleBadge}</span>
        <h2 style="font-size: 1.6rem; margin-bottom: 0.35rem; font-weight: 800; color: var(--text-primary);">Verify your email</h2>
        <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 0.25rem;">We've sent a confidential 6-digit verification code to</p>
        <div style="font-weight: 700; color: var(--brand-emerald-dark); font-size: 0.95rem; word-break: break-all;" id="otp-display-email">${email}</div>
      </div>

      <!-- Alert / Status Banner -->
      <div id="otp-alert-area" style="margin-bottom: 1.25rem; display: none;"></div>

      <!-- 6-Digit Input Row -->
      <div style="display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 1.5rem;" id="otp-boxes-container">
        <input type="text" class="otp-box" maxlength="1" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" data-index="0" style="width: 46px; height: 54px; text-align: center; font-size: 1.45rem; font-weight: 800; border-radius: 10px; border: 1.5px solid #CBD5E1; background: #FFFFFF; transition: all 0.15s; outline: none; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
        <input type="text" class="otp-box" maxlength="1" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" data-index="1" style="width: 46px; height: 54px; text-align: center; font-size: 1.45rem; font-weight: 800; border-radius: 10px; border: 1.5px solid #CBD5E1; background: #FFFFFF; transition: all 0.15s; outline: none; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
        <input type="text" class="otp-box" maxlength="1" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" data-index="2" style="width: 46px; height: 54px; text-align: center; font-size: 1.45rem; font-weight: 800; border-radius: 10px; border: 1.5px solid #CBD5E1; background: #FFFFFF; transition: all 0.15s; outline: none; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
        <input type="text" class="otp-box" maxlength="1" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" data-index="3" style="width: 46px; height: 54px; text-align: center; font-size: 1.45rem; font-weight: 800; border-radius: 10px; border: 1.5px solid #CBD5E1; background: #FFFFFF; transition: all 0.15s; outline: none; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
        <input type="text" class="otp-box" maxlength="1" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" data-index="4" style="width: 46px; height: 54px; text-align: center; font-size: 1.45rem; font-weight: 800; border-radius: 10px; border: 1.5px solid #CBD5E1; background: #FFFFFF; transition: all 0.15s; outline: none; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
        <input type="text" class="otp-box" maxlength="1" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" data-index="5" style="width: 46px; height: 54px; text-align: center; font-size: 1.45rem; font-weight: 800; border-radius: 10px; border: 1.5px solid #CBD5E1; background: #FFFFFF; transition: all 0.15s; outline: none; box-shadow: 0 1px 2px rgba(0,0,0,0.04);">
      </div>

      <!-- Expiry Countdown -->
      <div style="text-align: center; font-size: 0.8rem; color: var(--text-muted); margin-bottom: 1.5rem;">
        Code expires in <span id="otp-expiry-countdown" style="font-weight: 700; color: #0F172A;">05:00</span>
      </div>

      <!-- Action Buttons -->
      <button type="button" id="btn-verify-otp" class="btn btn-primary btn-md" disabled style="width: 100%; font-weight: 700; padding: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; margin-bottom: 0.85rem;">
        <span>Verify OTP</span>
        ${icon('check-circle', { size: 16 })}
      </button>

      <div style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #E2E8F0; font-size: 0.85rem;">
        <button type="button" id="btn-change-email" style="background: none; border: none; color: var(--text-muted); font-size: 0.85rem; font-weight: 600; cursor: pointer; padding: 4px 6px; display: inline-flex; align-items: center; gap: 0.35rem; transition: color 0.15s;" onmouseover="this.style.color='#0F172A'" onmouseout="this.style.color='var(--text-muted)'">
          ${icon('arrow-left', { size: 14 })}
          <span>Change Email</span>
        </button>

        <button type="button" id="btn-resend-otp" disabled style="background: none; border: none; color: var(--brand-emerald-dark); font-size: 0.85rem; font-weight: 700; cursor: not-allowed; opacity: 0.6; padding: 4px 6px; display: inline-flex; align-items: center; gap: 0.35rem;">
          ${icon('refresh-cw', { size: 14 })}
          <span id="btn-resend-text">Resend in 60s</span>
        </button>
      </div>

      <div style="text-align: center; margin-top: 1.25rem;">
        <div style="display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; color: #64748B;">
          <span style="display: inline-flex; align-items: center;">${icon("lock", { size: 13, stroke: "#64748B" })}</span>
          <span>Delivered securely via Brevo Transactional Email</span>
        </div>
      </div>
    </div>
  `;
}

export function attachOtpVerificationEvents({
  email,
  role = "customer",
  onVerified,
  onChangeEmail,
  initialNotice = null,
  initialOtp = null,
}) {
  const boxes = document.querySelectorAll(".otp-box");
  const verifyBtn = document.getElementById("btn-verify-otp");
  const resendBtn = document.getElementById("btn-resend-otp");
  const resendText = document.getElementById("btn-resend-text");
  const changeEmailBtn = document.getElementById("btn-change-email");
  const alertArea = document.getElementById("otp-alert-area");
  const expiryEl = document.getElementById("otp-expiry-countdown");

  let resendSeconds = 60;
  let expirySeconds = 300; // 5 minutes
  let resendInterval = null;
  let expiryInterval = null;
  let isSubmitting = false;

  function showAlert(message, type = "error") {
    if (!alertArea) return;
    const isErr = type === "error";
    const isInfo = type === "info";
    alertArea.style.display = "block";
    let bg = "#ECFDF5";
    let border = "#6EE7B7";
    let color = "#065F46";
    let iconHtml = icon("check-circle", { size: 16, stroke: "#065F46" });

    if (isErr) {
      bg = "#FEF2F2";
      border = "#FCA5A5";
      color = "#991B1B";
      iconHtml = icon("alert-triangle", { size: 16, stroke: "#991B1B" });
    } else if (isInfo) {
      bg = "#EFF6FF";
      border = "#93C5FD";
      color = "#1E40AF";
      iconHtml = icon("info", { size: 16, stroke: "#1E40AF" });
    }

    alertArea.innerHTML = `
      <div style="padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.825rem; display: flex; align-items: flex-start; gap: 0.5rem; background: ${bg}; border: 1px solid ${border}; color: ${color};">
        <span style="display: inline-flex; align-items: center; margin-top: 2px;">${iconHtml}</span>
        <span style="line-height: 1.4; word-break: break-word;">${message}</span>
      </div>
    `;
  }

  function clearAlert() {
    if (alertArea) {
      alertArea.style.display = "none";
      alertArea.innerHTML = "";
    }
  }

  function getEnteredOtp() {
    let code = "";
    boxes.forEach((b) => (code += b.value));
    return code;
  }

  function updateVerifyButtonState() {
    const code = getEnteredOtp();
    if (verifyBtn) {
      if (code.length === 6 && /^[0-9]{6}$/.test(code) && !isSubmitting) {
        verifyBtn.disabled = false;
        verifyBtn.style.opacity = "1";
        verifyBtn.style.cursor = "pointer";
      } else {
        verifyBtn.disabled = true;
        verifyBtn.style.opacity = "0.6";
        verifyBtn.style.cursor = "not-allowed";
      }
    }
  }

  // Focus and input styling
  boxes.forEach((box, idx) => {
    box.addEventListener("focus", () => {
      box.style.borderColor = "var(--brand-emerald)";
      box.style.boxShadow = "0 0 0 3px rgba(16, 185, 129, 0.2)";
    });

    box.addEventListener("blur", () => {
      box.style.borderColor = "#CBD5E1";
      box.style.boxShadow = "0 1px 2px rgba(0,0,0,0.04)";
    });

    box.addEventListener("input", (e) => {
      clearAlert();
      const val = e.target.value.replace(/\D/g, "");
      e.target.value = val ? val[0] : "";

      if (val && idx < boxes.length - 1) {
        boxes[idx + 1].focus();
        boxes[idx + 1].select();
      }

      updateVerifyButtonState();

      // Auto-submit if all 6 filled
      if (getEnteredOtp().length === 6) {
        doVerify();
      }
    });

    box.addEventListener("keydown", (e) => {
      if (e.key === "Backspace") {
        if (!box.value && idx > 0) {
          boxes[idx - 1].focus();
          boxes[idx - 1].value = "";
        }
        updateVerifyButtonState();
      } else if (e.key === "ArrowLeft" && idx > 0) {
        boxes[idx - 1].focus();
      } else if (e.key === "ArrowRight" && idx < boxes.length - 1) {
        boxes[idx + 1].focus();
      }
    });

    box.addEventListener("paste", (e) => {
      e.preventDefault();
      clearAlert();
      const pasted = (e.clipboardData || window.clipboardData).getData("text").trim();
      const digits = pasted.replace(/\D/g, "").slice(0, 6);
      if (digits) {
        for (let i = 0; i < digits.length; i++) {
          if (boxes[i]) boxes[i].value = digits[i];
        }
        const nextIdx = Math.min(digits.length, 5);
        boxes[nextIdx].focus();
        updateVerifyButtonState();
        if (digits.length === 6) {
          doVerify();
        }
      }
    });
  });

  // Auto focus first box
  if (boxes[0]) {
    setTimeout(() => boxes[0].focus(), 150);
  }

  // Resend Countdown
  function startResendCountdown() {
    if (resendInterval) clearInterval(resendInterval);
    resendSeconds = 60;
    if (resendBtn) {
      resendBtn.disabled = true;
      resendBtn.style.opacity = "0.6";
      resendBtn.style.cursor = "not-allowed";
    }

    resendInterval = setInterval(() => {
      resendSeconds--;
      if (resendText) {
        resendText.textContent = `Resend in ${resendSeconds}s`;
      }
      if (resendSeconds <= 0) {
        clearInterval(resendInterval);
        if (resendBtn) {
          resendBtn.disabled = false;
          resendBtn.style.opacity = "1";
          resendBtn.style.cursor = "pointer";
        }
        if (resendText) {
          resendText.textContent = "Resend Code";
        }
      }
    }, 1000);
  }

  // Expiry Countdown (5 minutes)
  function startExpiryCountdown() {
    if (expiryInterval) clearInterval(expiryInterval);
    expirySeconds = 300;
    expiryInterval = setInterval(() => {
      expirySeconds--;
      if (expiryEl) {
        const m = String(Math.floor(expirySeconds / 60)).padStart(2, "0");
        const s = String(expirySeconds % 60).padStart(2, "0");
        expiryEl.textContent = `${m}:${s}`;
      }
      if (expirySeconds <= 0) {
        clearInterval(expiryInterval);
        showAlert("This verification code has expired. Please request a new code.", "error");
        if (verifyBtn) verifyBtn.disabled = true;
      }
    }, 1000);
  }

  startResendCountdown();
  startExpiryCountdown();

  if (initialNotice) {
    showAlert(initialNotice, "info");
    if (initialOtp) {
      setTimeout(() => {
        initialOtp.split("").forEach((digit, i) => {
          if (boxes[i]) boxes[i].value = digit;
        });
        updateVerifyButtonState();
      }, 150);
    }
  }

  // Verification action
  async function doVerify() {
    if (isSubmitting) return;
    const otp = getEnteredOtp();
    if (otp.length !== 6) return;

    isSubmitting = true;
    clearAlert();

    if (verifyBtn) {
      verifyBtn.disabled = true;
      verifyBtn.innerHTML = `
        <span class="spinner" style="width: 16px; height: 16px; border: 2px solid #FFF; border-top-color: transparent; border-radius: 50%; display: inline-block; animation: spin 0.6s linear infinite;"></span>
        <span>Verifying...</span>
      `;
    }

    try {
      const result = await otpAuth.verifyOtp(email, otp, role);
      showAlert("Email verified successfully!", "success");

      // Cleanup timers
      if (resendInterval) clearInterval(resendInterval);
      if (expiryInterval) clearInterval(expiryInterval);

      setTimeout(() => {
        if (typeof onVerified === "function") {
          onVerified(result);
        }
      }, 500);
    } catch (err) {
      showAlert(err.message || "Incorrect verification code. Please try again.", "error");
      boxes.forEach((b) => {
        b.style.borderColor = "#EF4444";
        b.value = "";
      });
      if (boxes[0]) boxes[0].focus();
    } finally {
      isSubmitting = false;
      if (verifyBtn) {
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = `<span>Verify OTP</span> ${icon('check-circle', { size: 16 })}`;
      }
      updateVerifyButtonState();
    }
  }

  if (verifyBtn) {
    verifyBtn.onclick = (e) => {
      e.preventDefault();
      doVerify();
    };
  }

  // Resend action
  if (resendBtn) {
    resendBtn.onclick = async (e) => {
      e.preventDefault();
      if (resendSeconds > 0) return;

      clearAlert();
      resendBtn.disabled = true;
      resendText.textContent = "Sending...";

      try {
        const res = await otpAuth.resendOtp(email);
        if (res.devNotice && res.otp) {
          showAlert(res.devNotice, "info");
          res.otp.split("").forEach((digit, i) => {
            if (boxes[i]) boxes[i].value = digit;
          });
        } else {
          showAlert(res.message || "Verification code resent successfully.", "success");
          boxes.forEach((b) => (b.value = ""));
        }
        if (boxes[0]) boxes[0].focus();
        updateVerifyButtonState();
        startResendCountdown();
        startExpiryCountdown();
      } catch (err) {
        showAlert(err.message || "Please wait before requesting another code.", "error");
        resendBtn.disabled = false;
        resendText.textContent = "Resend Code";
      }
    };
  }

  // Change email action
  if (changeEmailBtn) {
    changeEmailBtn.onclick = (e) => {
      e.preventDefault();
      if (resendInterval) clearInterval(resendInterval);
      if (expiryInterval) clearInterval(expiryInterval);
      if (typeof onChangeEmail === "function") {
        onChangeEmail();
      }
    };
  }

  // Return teardown function if needed
  return () => {
    if (resendInterval) clearInterval(resendInterval);
    if (expiryInterval) clearInterval(expiryInterval);
  };
}
