/**
 * KLEEN — SMS Multi-Factor Authentication (MFA) Enrollment Modal
 * 
 * Walkthrough UI Component for SMS MFA Enrollment:
 * 1. Phone number collection with international country code selection.
 * 2. Invisible reCAPTCHA verification & multi-factor session initiation.
 * 3. 6-digit SMS OTP verification code entry with auto-advance and paste support.
 * 4. Completion of enrollment via PhoneMultiFactorGenerator.assertion.
 */

import { mfaService } from "../services/auth/mfa-service.js";
import { modal } from "./modal.js";
import { toast } from "./toast.js";
import { icon } from "./icons.js";

export function openMfaEnrollmentModal({ onSuccess = null, onCancel = null, displayName = "Primary Mobile" } = {}) {
  let currentStep = 1; // 1: Phone Input, 2: OTP Verification, 3: Success
  let activeVerificationId = null;
  let targetPhoneNumber = "";
  let resendCountdownTimer = null;
  let expiryCountdownTimer = null;
  let resendSecondsRemaining = 60;
  let expirySecondsRemaining = 300; // 5 minutes

  const modalBackdrop = modal.open({
    title: "Two-Factor Authentication",
    maxWidth: "480px",
    bodyHtml: `
      <div id="mfa-modal-container" style="font-family: inherit; color: var(--text-primary, #0F172A);">
        <!-- Off-screen Invisible reCAPTCHA Anchor -->
        <div id="mfa-recaptcha-anchor" style="position: fixed; bottom: 0; right: 0; opacity: 0; pointer-events: none; z-index: -1;"></div>

        <!-- Dynamic Body Container -->
        <div id="mfa-step-content"></div>
      </div>
    `,
    onOpen: (backdrop) => {
      renderStep1(backdrop);
    }
  });

  // ---------------------------------------------------------------------------
  // STEP 1: Phone Number Input
  // ---------------------------------------------------------------------------
  function renderStep1(backdrop) {
    currentStep = 1;
    const content = backdrop.querySelector("#mfa-step-content");
    if (!content) return;

    content.innerHTML = `
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div style="width: 54px; height: 54px; border-radius: 50%; background: #ECFDF5; color: #047857; margin: 0 auto 0.85rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);">
          ${icon('shield', { size: 28 })}
        </div>
        <h3 style="font-size: 1.35rem; font-weight: 800; margin-bottom: 0.35rem;">Secure with SMS 2FA</h3>
        <p style="font-size: 0.875rem; color: #64748B; margin: 0 auto; max-width: 360px; line-height: 1.45;">
          Enhance your KLEEN account security. We will send a one-time verification code via SMS to your mobile phone.
        </p>
      </div>

      <!-- Alert Box -->
      <div id="mfa-alert-box" style="display: none; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1rem; line-height: 1.4;"></div>

      <form id="mfa-phone-form" style="margin-bottom: 1rem;">
        <label style="display: block; font-size: 0.825rem; font-weight: 700; color: #334155; margin-bottom: 0.4rem;">
          Mobile Phone Number
        </label>
        <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
          <select id="mfa-country-code" style="width: 110px; padding: 0.75rem 0.6rem; border: 1.5px solid #CBD5E1; border-radius: 10px; font-size: 0.9rem; font-weight: 600; background: #F8FAFC; color: #0F172A; outline: none; cursor: pointer;">
            <option value="+91" selected>🇮🇳 +91</option>
            <option value="+1">🇺🇸 +1</option>
            <option value="+44">🇬🇧 +44</option>
            <option value="+971">🇦🇪 +971</option>
            <option value="+65">🇸🇬 +65</option>
            <option value="+61">🇦🇺 +61</option>
          </select>
          <input 
            type="tel" 
            id="mfa-phone-input" 
            placeholder="98765 43210" 
            maxlength="15" 
            required 
            style="flex: 1; padding: 0.75rem 1rem; border: 1.5px solid #CBD5E1; border-radius: 10px; font-size: 1rem; font-weight: 600; color: #0F172A; outline: none; transition: border-color 0.2s;"
            onfocus="this.style.borderColor='#10B981'"
            onblur="this.style.borderColor='#CBD5E1'"
          />
        </div>
        <p style="font-size: 0.75rem; color: #94A3B8; margin-bottom: 1.5rem;">
          Protected by Google reCAPTCHA. Standard carrier SMS & data charges may apply.
        </p>

        <button 
          type="submit" 
          id="btn-mfa-send-code" 
          class="btn btn-primary btn-md" 
          style="width: 100%; font-weight: 700; padding: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; border-radius: 10px;"
        >
          <span>Send SMS Code</span>
          ${icon('arrow-right', { size: 16 })}
        </button>
      </form>
    `;

    const form = content.querySelector("#mfa-phone-form");
    const phoneInput = content.querySelector("#mfa-phone-input");
    const countryCodeSelect = content.querySelector("#mfa-country-code");
    const sendBtn = content.querySelector("#btn-mfa-send-code");
    const alertBox = content.querySelector("#mfa-alert-box");

    setTimeout(() => phoneInput?.focus(), 100);

    form.onsubmit = async (e) => {
      e.preventDefault();
      const rawPhone = (phoneInput.value || "").trim().replace(/\D/g, "");
      if (rawPhone.length < 7 || rawPhone.length > 13) {
        showAlert(alertBox, "Please enter a valid phone number.", "error");
        return;
      }

      const fullPhone = `${countryCodeSelect.value}${rawPhone}`;
      targetPhoneNumber = fullPhone;

      // Loading State
      sendBtn.disabled = true;
      sendBtn.innerHTML = `
        <span style="display:inline-block; width: 14px; height: 14px; border: 2px solid #FFFFFF; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite;"></span>
        <span>Sending verification code...</span>
      `;
      hideAlert(alertBox);

      try {
        const result = await mfaService.sendVerificationCode(fullPhone, {
          containerId: "mfa-recaptcha-anchor"
        });

        activeVerificationId = result.verificationId;
        renderStep2(backdrop);
      } catch (err) {
        console.error("MFA Send Error:", err);
        showAlert(alertBox, err.message || "Failed to send SMS code. Please try again.", "error");
        sendBtn.disabled = false;
        sendBtn.innerHTML = `
          <span>Send SMS Code</span>
          ${icon('arrow-right', { size: 16 })}
        `;
      }
    };
  }

  // ---------------------------------------------------------------------------
  // STEP 2: 6-Digit Verification Code Entry
  // ---------------------------------------------------------------------------
  function renderStep2(backdrop) {
    currentStep = 2;
    const content = backdrop.querySelector("#mfa-step-content");
    if (!content) return;

    content.innerHTML = `
      <div style="text-align: center; margin-bottom: 1.5rem;">
        <div style="width: 54px; height: 54px; border-radius: 50%; background: #EFF6FF; color: #2563EB; margin: 0 auto 0.85rem; display: flex; align-items: center; justify-content: center;">
          ${icon('mail', { size: 26 })}
        </div>
        <h3 style="font-size: 1.35rem; font-weight: 800; margin-bottom: 0.35rem;">Enter 6-Digit Code</h3>
        <p style="font-size: 0.875rem; color: #64748B; margin-bottom: 0.25rem;">
          We sent a verification SMS to
        </p>
        <div style="font-weight: 700; color: #047857; font-size: 0.95rem;">${targetPhoneNumber}</div>
      </div>

      <!-- Alert Box -->
      <div id="mfa-step2-alert" style="display: none; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.85rem; margin-bottom: 1.25rem; line-height: 1.4;"></div>

      <!-- 6 Boxes -->
      <div id="mfa-otp-boxes" style="display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 1.25rem;">
        <input type="text" class="mfa-digit-box" maxlength="1" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" data-idx="0" style="width: 45px; height: 52px; text-align: center; font-size: 1.4rem; font-weight: 800; border-radius: 10px; border: 1.5px solid #CBD5E1; background: #FFFFFF; outline: none;" />
        <input type="text" class="mfa-digit-box" maxlength="1" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" data-idx="1" style="width: 45px; height: 52px; text-align: center; font-size: 1.4rem; font-weight: 800; border-radius: 10px; border: 1.5px solid #CBD5E1; background: #FFFFFF; outline: none;" />
        <input type="text" class="mfa-digit-box" maxlength="1" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" data-idx="2" style="width: 45px; height: 52px; text-align: center; font-size: 1.4rem; font-weight: 800; border-radius: 10px; border: 1.5px solid #CBD5E1; background: #FFFFFF; outline: none;" />
        <input type="text" class="mfa-digit-box" maxlength="1" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" data-idx="3" style="width: 45px; height: 52px; text-align: center; font-size: 1.4rem; font-weight: 800; border-radius: 10px; border: 1.5px solid #CBD5E1; background: #FFFFFF; outline: none;" />
        <input type="text" class="mfa-digit-box" maxlength="1" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" data-idx="4" style="width: 45px; height: 52px; text-align: center; font-size: 1.4rem; font-weight: 800; border-radius: 10px; border: 1.5px solid #CBD5E1; background: #FFFFFF; outline: none;" />
        <input type="text" class="mfa-digit-box" maxlength="1" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" data-idx="5" style="width: 45px; height: 52px; text-align: center; font-size: 1.4rem; font-weight: 800; border-radius: 10px; border: 1.5px solid #CBD5E1; background: #FFFFFF; outline: none;" />
      </div>

      <!-- Expiry info -->
      <div style="text-align: center; font-size: 0.8rem; color: #64748B; margin-bottom: 1.5rem;">
        Code expires in <span id="mfa-expiry-timer" style="font-weight: 700; color: #0F172A;">05:00</span>
      </div>

      <!-- Action Button -->
      <button 
        type="button" 
        id="btn-mfa-verify" 
        class="btn btn-primary btn-md" 
        disabled 
        style="width: 100%; font-weight: 700; padding: 0.85rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; border-radius: 10px; margin-bottom: 1rem;"
      >
        <span>Complete Enrollment</span>
        ${icon('check-circle', { size: 16 })}
      </button>

      <!-- Bottom controls -->
      <div style="display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #E2E8F0; padding-top: 0.85rem; font-size: 0.85rem;">
        <button type="button" id="btn-mfa-back" style="background: none; border: none; color: #64748B; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem;">
          ${icon('arrow-left', { size: 14 })}
          <span>Change Number</span>
        </button>
        <button type="button" id="btn-mfa-resend" disabled style="background: none; border: none; color: #94A3B8; font-weight: 600; cursor: not-allowed;">
          Resend code (60s)
        </button>
      </div>
    `;

    const alertBox = content.querySelector("#mfa-step2-alert");
    const verifyBtn = content.querySelector("#btn-mfa-verify");
    const backBtn = content.querySelector("#btn-mfa-back");
    const resendBtn = content.querySelector("#btn-mfa-resend");
    const boxes = Array.from(content.querySelectorAll(".mfa-digit-box"));

    // Focus first box
    setTimeout(() => boxes[0]?.focus(), 100);

    // Box inputs wiring
    boxes.forEach((box, i) => {
      box.oninput = (e) => {
        const val = box.value.replace(/\D/g, "");
        box.value = val ? val[val.length - 1] : "";
        if (box.value && i < 5) {
          boxes[i + 1].focus();
        }
        checkVerifyReady();
      };

      box.onkeydown = (e) => {
        if (e.key === "Backspace" && !box.value && i > 0) {
          boxes[i - 1].focus();
        } else if (e.key === "ArrowLeft" && i > 0) {
          boxes[i - 1].focus();
        } else if (e.key === "ArrowRight" && i < 5) {
          boxes[i + 1].focus();
        }
      };

      box.onpaste = (e) => {
        e.preventDefault();
        const text = (e.clipboardData?.getData("text") || "").replace(/\D/g, "").slice(0, 6);
        if (text) {
          text.split("").forEach((char, idx) => {
            if (boxes[idx]) boxes[idx].value = char;
          });
          const nextIdx = Math.min(text.length, 5);
          boxes[nextIdx].focus();
          checkVerifyReady();
        }
      };
    });

    function getEnteredCode() {
      return boxes.map(b => b.value).join("");
    }

    function checkVerifyReady() {
      const code = getEnteredCode();
      if (code.length === 6) {
        verifyBtn.disabled = false;
        boxes.forEach(b => b.style.borderColor = "#10B981");
      } else {
        verifyBtn.disabled = true;
        boxes.forEach(b => b.style.borderColor = "#CBD5E1");
      }
    }

    // Timers setup
    clearInterval(resendCountdownTimer);
    clearInterval(expiryCountdownTimer);
    resendSecondsRemaining = 60;
    expirySecondsRemaining = 300;

    resendCountdownTimer = setInterval(() => {
      resendSecondsRemaining--;
      if (resendSecondsRemaining <= 0) {
        clearInterval(resendCountdownTimer);
        resendBtn.disabled = false;
        resendBtn.style.color = "#047857";
        resendBtn.style.cursor = "pointer";
        resendBtn.innerText = "Resend SMS";
      } else {
        resendBtn.innerText = `Resend code (${resendSecondsRemaining}s)`;
      }
    }, 1000);

    const expiryDisplay = content.querySelector("#mfa-expiry-timer");
    expiryCountdownTimer = setInterval(() => {
      expirySecondsRemaining--;
      if (expirySecondsRemaining <= 0) {
        clearInterval(expiryCountdownTimer);
        expiryDisplay.innerText = "Expired";
        showAlert(alertBox, "Verification code expired. Please request a new code.", "error");
        verifyBtn.disabled = true;
      } else {
        const m = Math.floor(expirySecondsRemaining / 60).toString().padStart(2, "0");
        const s = (expirySecondsRemaining % 60).toString().padStart(2, "0");
        expiryDisplay.innerText = `${m}:${s}`;
      }
    }, 1000);

    backBtn.onclick = () => {
      clearInterval(resendCountdownTimer);
      clearInterval(expiryCountdownTimer);
      renderStep1(backdrop);
    };

    resendBtn.onclick = async () => {
      if (resendSecondsRemaining > 0) return;
      resendBtn.disabled = true;
      resendBtn.innerText = "Sending...";
      try {
        const res = await mfaService.sendVerificationCode(targetPhoneNumber, {
          containerId: "mfa-recaptcha-anchor"
        });
        activeVerificationId = res.verificationId;
        showAlert(alertBox, "New verification code sent via SMS!", "success");
        renderStep2(backdrop);
      } catch (err) {
        showAlert(alertBox, err.message || "Failed to resend SMS.", "error");
        resendBtn.disabled = false;
        resendBtn.innerText = "Resend SMS";
      }
    };

    verifyBtn.onclick = async () => {
      const code = getEnteredCode();
      if (code.length !== 6) return;

      verifyBtn.disabled = true;
      verifyBtn.innerHTML = `
        <span style="display:inline-block; width: 14px; height: 14px; border: 2px solid #FFFFFF; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite;"></span>
        <span>Enrolling MFA...</span>
      `;
      hideAlert(alertBox);

      try {
        const enrollResult = await mfaService.enrollPhoneNumber(code, {
          verificationId: activeVerificationId,
          displayName: displayName || `Mobile (${targetPhoneNumber})`
        });

        clearInterval(resendCountdownTimer);
        clearInterval(expiryCountdownTimer);

        renderStep3(backdrop, enrollResult);

        if (typeof onSuccess === "function") {
          onSuccess(enrollResult);
        }
      } catch (err) {
        console.error("MFA Enrollment Error:", err);
        showAlert(alertBox, err.message || "Enrollment failed. Please check the code and try again.", "error");
        verifyBtn.disabled = false;
        verifyBtn.innerHTML = `
          <span>Complete Enrollment</span>
          ${icon('check-circle', { size: 16 })}
        `;
      }
    };
  }

  // ---------------------------------------------------------------------------
  // STEP 3: Success Confirmation
  // ---------------------------------------------------------------------------
  function renderStep3(backdrop, result) {
    currentStep = 3;
    const content = backdrop.querySelector("#mfa-step-content");
    if (!content) return;

    content.innerHTML = `
      <div style="text-align: center; padding: 1rem 0;">
        <div style="width: 64px; height: 64px; border-radius: 50%; background: #ECFDF5; color: #047857; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 16px rgba(16, 185, 129, 0.2);">
          ${icon('check', { size: 36 })}
        </div>
        <h3 style="font-size: 1.4rem; font-weight: 800; margin-bottom: 0.5rem; color: #0F172A;">MFA Enrollment Complete</h3>
        <p style="font-size: 0.9rem; color: #64748B; margin: 0 auto 1.5rem; max-width: 380px; line-height: 1.5;">
          Your mobile phone <strong style="color: #047857;">${targetPhoneNumber}</strong> has been successfully enrolled as a second factor for SMS authentication.
        </p>

        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1rem; text-align: left; margin-bottom: 1.5rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; font-weight: 700; color: #334155; margin-bottom: 0.35rem;">
            ${icon('lock', { size: 16 })}
            <span>Account Security Upgraded</span>
          </div>
          <p style="font-size: 0.775rem; color: #64748B; margin: 0;">
            Next time you sign in, Firebase will prompt you for an SMS verification code sent to this device.
          </p>
        </div>

        <button 
          type="button" 
          id="btn-mfa-done" 
          class="btn btn-primary btn-md" 
          style="width: 100%; font-weight: 700; padding: 0.85rem; border-radius: 10px;"
        >
          Done
        </button>
      </div>
    `;

    const doneBtn = content.querySelector("#btn-mfa-done");
    doneBtn.onclick = () => {
      modal.close();
      toast.success("Security Updated", "SMS Multi-Factor Authentication is now active.");
    };
  }

  // ---------------------------------------------------------------------------
  // Alert Helpers
  // ---------------------------------------------------------------------------
  function showAlert(box, msg, type = "error") {
    if (!box) return;
    box.style.display = "block";
    box.style.background = type === "error" ? "#FEF2F2" : "#ECFDF5";
    box.style.color = type === "error" ? "#991B1B" : "#065F46";
    box.style.border = type === "error" ? "1px solid #FCA5A5" : "1px solid #A7F3D0";
    box.innerText = msg;
  }

  function hideAlert(box) {
    if (!box) return;
    box.style.display = "none";
  }
}
