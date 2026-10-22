/**
 * KLEEN — Dedicated Admin Console Login (/admin/login)
 * 2-Step Brevo OTP Security:
 * Step 1: Admin Credentials (username: kleenadmin, password: kleenadmin@123)
 * Step 2: Confidential 6-digit Brevo OTP verification dispatched to kleenadmin@gmail.com
 */

import { authManager } from "../../services/auth/auth-manager.js";
import { otpAuth } from "../../services/auth/otp-auth-service.js";
import { toast } from "../../components/toast.js";
import { icon } from "../../components/icons.js";
import { renderOtpVerificationView, attachOtpVerificationEvents } from "../../components/otp-input.js";

const ADMIN_TARGET_EMAIL = "kleenadmin@gmail.com";

export function renderAdminLoginPage() {
  return `
    <div style="min-height: 100vh; background: #09281E; display: flex; align-items: center; justify-content: center; padding: 2rem 1rem;">
      <div id="admin-auth-card" class="solid-card" style="max-width: 440px; width: 100%; padding: 2.5rem; background: #FFFFFF; border-radius: var(--radius-xl); box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
        ${renderAdminCredentialsFormHtml()}
      </div>
    </div>
  `;
}

function renderAdminCredentialsFormHtml(errorMsg = "") {
  return `
    <div id="admin-credentials-step">
      <div style="text-align: center; margin-bottom: 1.75rem;">
        <img src="assets/kleen-logo.png" alt="KLEEN" style="height: 48px; width: auto; max-width: 175px; margin: 0 auto 1rem; display: block; object-fit: contain;" />
        <span class="badge badge-success" style="margin-bottom: 0.5rem; font-size: 0.75rem; letter-spacing: 0.05em; text-transform: uppercase;">Platform Operations</span>
        <h2 style="font-size: 1.65rem; color: #09281E; margin-bottom: 0.25rem; font-weight: 800;">KLEEN Admin Console</h2>
        <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;">Authorized Administrator Access Only</p>
      </div>

      ${errorMsg ? `
        <div id="admin-login-error" style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: var(--radius-md); padding: 0.85rem 1rem; margin-bottom: 1.25rem; font-size: 0.85rem; color: #991B1B; line-height: 1.4; display: flex; align-items: flex-start; gap: 0.6rem;">
          <span style="flex-shrink: 0; margin-top: 2px;">${icon('alert-circle', { size: 16, stroke: '#DC2626' })}</span>
          <div>${errorMsg}</div>
        </div>
      ` : `
        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: var(--radius-md); padding: 0.75rem 1rem; margin-bottom: 1.5rem; font-size: 0.825rem; color: #475569; display: flex; align-items: center; gap: 0.6rem;">
          <span style="flex-shrink: 0; color: #0F4C3A; display: flex; align-items: center;">${icon('shield', { size: 16, stroke: '#0F4C3A' })}</span>
          <span>Protected by 2-Step Brevo OTP verification.</span>
        </div>
      `}

      <form id="form-admin-login">
        <div class="form-group">
          <label class="form-label" for="admin-login-user">Administrator Username / Email</label>
          <div style="position: relative;">
            <input type="text" id="admin-login-user" class="form-input" placeholder="Enter administrator username" required autocomplete="username" autofocus style="padding-left: 2.5rem;">
            <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); display: flex; align-items: center; pointer-events: none;">
              ${icon('user', { size: 16 })}
            </span>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="admin-login-pwd">Secure Password</label>
          <div style="position: relative;">
            <input type="password" id="admin-login-pwd" class="form-input" placeholder="Enter secure password" required autocomplete="current-password" style="padding-left: 2.5rem; padding-right: 2.5rem;">
            <span style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); display: flex; align-items: center; pointer-events: none;">
              ${icon('lock', { size: 16 })}
            </span>
            <button type="button" id="btn-toggle-admin-pwd" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center;">
              ${icon('eye', { size: 16 })}
            </button>
          </div>
        </div>

        <button type="submit" id="btn-submit-admin-login" class="btn btn-primary btn-md" style="width: 100%; margin-top: 0.75rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.5rem; height: 46px;">
          <span>Sign In to Admin Console</span>
          ${icon('arrow-right', { size: 16 })}
        </button>
      </form>

      <div style="text-align: center; margin-top: 1.75rem; padding-top: 1.25rem; border-top: 1px solid #E5E7EB;">
        <a href="#/" style="font-size: 0.85rem; color: var(--text-secondary); text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem; transition: color 0.15s;" onmouseover="this.style.color='#09281E'" onmouseout="this.style.color='var(--text-secondary)'">
          ${icon('arrow-left', { size: 14 })}
          <span>Return to KLEEN Public Website</span>
        </a>
      </div>
    </div>
  `;
}

function attachCredentialsEvents() {
  const togglePwdBtn = document.getElementById("btn-toggle-admin-pwd");
  if (togglePwdBtn) {
    togglePwdBtn.onclick = () => {
      const pwdInput = document.getElementById("admin-login-pwd");
      if (pwdInput) {
        const isPassword = pwdInput.type === "password";
        pwdInput.type = isPassword ? "text" : "password";
        togglePwdBtn.innerHTML = icon(isPassword ? 'eye-off' : 'eye', { size: 16 });
      }
    };
  }

  const form = document.getElementById("form-admin-login");
  if (form) {
    form.onsubmit = async (e) => {
      e.preventDefault();
      const userInput = (document.getElementById("admin-login-user")?.value || "").trim().toLowerCase();
      const pwdInput = document.getElementById("admin-login-pwd")?.value || "";
      const submitBtn = document.getElementById("btn-submit-admin-login");

      // Verify default admin credentials:
      // Username: kleenadmin (or kleenadmin@gmail.com)
      // Password: kleenadmin@123
      const isValidUser = userInput === "kleenadmin" || userInput === "kleenadmin@gmail.com";
      const isValidPassword = pwdInput === "kleenadmin@123";

      if (!isValidUser || !isValidPassword) {
        toast.error("Access Denied", "Invalid administrator credentials. Access denied.");
        const card = document.getElementById("admin-auth-card");
        if (card) {
          card.innerHTML = renderAdminCredentialsFormHtml("Invalid administrator credentials. Access denied.");
          attachCredentialsEvents();
          const userField = document.getElementById("admin-login-user");
          const pwdField = document.getElementById("admin-login-pwd");
          if (userField) {
            userField.value = userInput;
            userField.style.borderColor = "#EF4444";
          }
          if (pwdField) {
            pwdField.style.borderColor = "#EF4444";
          }
        }
        return;
      }

      // Valid credentials! Proceed to Step 2: Brevo OTP to kleenadmin@gmail.com
      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `
            <span class="spinner" style="width: 16px; height: 16px; border: 2px solid #FFF; border-top-color: transparent; border-radius: 50%; display: inline-block; animation: spin 0.6s linear infinite;"></span>
            <span>Dispatching Brevo 2-Step OTP...</span>
          `;
        }

        const res = await otpAuth.sendOtp(ADMIN_TARGET_EMAIL, "admin");
        if (res.devNotice) {
          toast.warning("Brevo Notice", "Brevo IP not yet authorized. Developer auto-fill enabled.");
        } else {
          toast.info("Verification Code Dispatched", `A 6-digit verification code has been dispatched to ${ADMIN_TARGET_EMAIL}.`);
        }

        // Mount Step 2: 6-Digit OTP Verification View
        const card = document.getElementById("admin-auth-card");
        if (card) {
          card.innerHTML = renderOtpVerificationView(ADMIN_TARGET_EMAIL, "admin");
          attachOtpVerificationEvents({
            email: ADMIN_TARGET_EMAIL,
            role: "admin",
            initialNotice: res.devNotice,
            initialOtp: res.otp,
            onVerified: () => {
              authManager.completeAdminLogin(ADMIN_TARGET_EMAIL);
              toast.success("Admin Authenticated", "Welcome to KLEEN Operations Console.");
              window.location.hash = "#/admin";
            },
            onChangeEmail: () => {
              card.innerHTML = renderAdminCredentialsFormHtml();
              attachCredentialsEvents();
            }
          });
        }
      } catch (err) {
        toast.error("OTP Dispatch Failed", err.message || "Failed to send verification code. Please try again.");
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Sign In to Admin Console</span> ${icon('arrow-right', { size: 16 })}`;
        }
      }
    };
  }
}

export function attachAdminLoginEvents() {
  attachCredentialsEvents();
}
