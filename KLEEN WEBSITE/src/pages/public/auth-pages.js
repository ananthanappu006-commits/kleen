/**
 * KLEEN — Authentication Pages (Login, Register Customer, Register Partner, Forgot Password)
 */

import { authManager } from "../../services/auth/auth-manager.js";
import { db } from "../../services/db-service.js";
import { toast } from "../../components/toast.js";
import { renderDistrictOptions, DEFAULT_STATE, DEFAULT_DISTRICT } from "../../config/kerala-districts.js";
import { otpAuth } from "../../services/auth/otp-auth-service.js";
import { renderOtpVerificationView, attachOtpVerificationEvents } from "../../components/otp-input.js";
import { icon } from "../../components/icons.js";

export function renderLoginPage() {
  const pendingServiceId = sessionStorage.getItem("kleen_pending_booking_service");
  const pendingService = pendingServiceId ? db.getServiceById(pendingServiceId) : null;
  const pendingBannerHtml = pendingService ? `
    <div style="background: rgba(20, 92, 71, 0.08); border: 1.5px solid rgba(20, 92, 71, 0.2); border-radius: var(--radius-md); padding: 0.85rem 1rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
      <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--brand-emerald); color: #FFFFFF; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        ${icon("lock", { size: 18, stroke: "#FFFFFF" })}
      </div>
      <div>
        <div style="font-size: 0.825rem; font-weight: 700; color: var(--brand-emerald-dark);">Sign in required to book</div>
        <div style="font-size: 0.775rem; color: #475569;">Sign in to proceed with your booking for <strong>${pendingService.name}</strong>.</div>
      </div>
    </div>
  ` : "";

  return `
    <div class="app-container" style="max-width: 460px; padding: 4rem 1rem 6rem;">
      <div class="solid-card" style="padding: 2.25rem;">
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.75rem; font-weight: 800; margin-bottom: 0.35rem;">Welcome to KLEEN</h2>
          <p style="color: var(--text-muted); font-size: 0.875rem;">Sign in to your customer account</p>
        </div>

        ${pendingBannerHtml}

        <!-- Unified Login Container: Step 1 (Email + Password) -> Step 2 (Brevo OTP) -->
        <div id="customer-login-step-container">
          <form id="form-customer-login">
            <div class="form-group" style="margin-bottom: 1.25rem;">
              <label class="form-label" for="cust-login-email" style="font-weight: 600; margin-bottom: 0.35rem; display: block;">Email Address</label>
              <input type="email" id="cust-login-email" class="form-input" placeholder="name@example.com" required autocomplete="email">
            </div>

            <div class="form-group" style="margin-bottom: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.35rem;">
                <label class="form-label" for="cust-login-password" style="font-weight: 600; margin-bottom: 0;">Password</label>
                <a href="#/forgot-password" style="font-size: 0.775rem; color: var(--brand-emerald-dark); font-weight: 600;">Forgot Password?</a>
              </div>
              <div style="position: relative;">
                <input type="password" id="cust-login-password" class="form-input" placeholder="••••••••" required autocomplete="current-password">
                <button type="button" id="btn-toggle-cust-pwd" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 0.85rem; cursor: pointer; color: var(--text-muted); font-weight: 600;">
                  Show
                </button>
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">
                A confidential 6-digit Brevo OTP verification code will be sent to your email.
              </div>
            </div>

            <div id="cust-login-error-box" style="display: none; padding: 0.65rem 0.85rem; border-radius: 8px; background: #FEF2F2; border: 1px solid #FCA5A5; color: #991B1B; font-size: 0.8rem; margin-bottom: 1rem;"></div>

            <button type="submit" id="btn-submit-cust-login" class="btn btn-primary btn-md" style="width: 100%; font-weight: 700; padding: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
              <span>Sign In with Verification</span>
              ${icon('arrow-right', { size: 16 })}
            </button>
          </form>

          <div style="margin: 1.5rem 0; display: flex; align-items: center; gap: 0.75rem;">
            <div style="flex: 1; height: 1px; background: #E5E7EB;"></div>
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">or</span>
            <div style="flex: 1; height: 1px; background: #E5E7EB;"></div>
          </div>

          <button type="button" id="btn-google-login" class="btn btn-glass btn-md" style="width: 100%; border-color: #D1D5DB; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 600;">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width: 18px; height: 18px;" alt="Google">
            Continue with Google
          </button>

          <div style="text-align: center; margin-top: 1.25rem;">
            <div style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.65rem; border-radius: 9999px; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); font-size: 0.725rem; font-weight: 600; color: #047857;">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10B981;"></span>
              <span>Delivered securely via Brevo Transactional Email</span>
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 1.5rem; font-size: 0.85rem; color: var(--text-muted);">
          New to KLEEN? <a href="#/register" style="color: var(--brand-emerald-dark); font-weight: 700;">Create an Account</a>
        </div>

        <div style="text-align: center; margin-top: 0.75rem; font-size: 0.825rem;">
          Are you a maid or service partner? <a href="#/partner/login" style="color: var(--brand-emerald); font-weight: 600;">Partner Portal Sign In →</a>
        </div>
      </div>
    </div>
  `;
}

export function renderRegisterCustomerPage() {
  const pendingServiceId = sessionStorage.getItem("kleen_pending_booking_service");
  const pendingService = pendingServiceId ? db.getServiceById(pendingServiceId) : null;
  const pendingBannerHtml = pendingService ? `
    <div style="background: rgba(20, 92, 71, 0.08); border: 1.5px solid rgba(20, 92, 71, 0.2); border-radius: var(--radius-md); padding: 0.85rem 1rem; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.75rem;">
      <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--brand-emerald); color: #FFFFFF; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
        ${icon("sparkles", { size: 18, stroke: "#FFFFFF" })}
      </div>
      <div>
        <div style="font-size: 0.825rem; font-weight: 700; color: var(--brand-emerald-dark);">Account required to book</div>
        <div style="font-size: 0.775rem; color: #475569;">Create your customer account to complete your booking for <strong>${pendingService.name}</strong>.</div>
      </div>
    </div>
  ` : "";

  return `
    <div class="app-container" style="max-width: 480px; padding: 3.5rem 1rem 6rem;">
      <div class="solid-card" style="padding: 2.25rem;">
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <span class="badge badge-info" style="margin-bottom: 0.5rem;">Customer Registration</span>
          <h2 style="font-size: 1.65rem;">Create Your KLEEN Account</h2>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.25rem;">Schedule verified home care in seconds</p>
        </div>

        ${pendingBannerHtml}

        <form id="form-register-customer">
          <div class="form-group">
            <label class="form-label">Full Name *</label>
            <input type="text" id="reg-name" class="form-input" placeholder="Your Full Name" required>
          </div>

          <div class="form-group">
            <label class="form-label">Email Address *</label>
            <input type="email" id="reg-email" class="form-input" placeholder="you@example.com" required>
          </div>

          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="tel" id="reg-phone" class="form-input" placeholder="10-digit mobile number" required>
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <input type="password" id="reg-password" class="form-input" placeholder="Minimum 6 characters" required>
          </div>

          <div class="form-group">
            <label class="form-label">Confirm Password</label>
            <input type="password" id="reg-confirm-password" class="form-input" placeholder="Re-enter password" required>
          </div>

          <div style="margin: 1.25rem 0; display: flex; align-items: flex-start; gap: 0.6rem;">
            <input type="checkbox" id="reg-terms" checked required style="margin-top: 4px;">
            <label for="reg-terms" style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">
              I agree to the KLEEN Terms of Service and Privacy Policy.
            </label>
          </div>

          <button type="submit" class="btn btn-primary btn-md" style="width: 100%;">
            Create Customer Account
          </button>
        </form>

        <div style="text-align: center; margin-top: 1.5rem; font-size: 0.85rem; color: var(--text-muted);">
          Already registered? <a href="#/login" style="color: var(--brand-emerald-dark); font-weight: 700;">Sign In</a>
        </div>
      </div>
    </div>
  `;
}

export function renderRegisterPartnerPage() {
  return `
    <div class="app-container" style="max-width: 540px; padding: 3rem 1rem 6rem;">
      <div class="solid-card" style="padding: 2.25rem;">
        <div style="text-align: center; margin-bottom: 2rem;">
          <span class="badge badge-success" style="margin-bottom: 0.5rem;">Earn with Dignity</span>
          <h2 style="font-size: 1.65rem;">Register as a Service Partner</h2>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 0.25rem;">Keep 80% of earnings with guaranteed safety & direct bank payouts</p>
        </div>

        <form id="form-register-partner">
          <div class="form-group">
            <label class="form-label">Full Name (as on Aadhaar Card)</label>
            <input type="text" id="part-reg-name" class="form-input" required>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" id="part-reg-email" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="tel" id="part-reg-phone" class="form-input" required>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">Date of Birth</label>
              <input type="date" id="part-reg-dob" class="form-input" value="1992-06-15" required>
            </div>
            <div class="form-group">
              <label class="form-label">Gender</label>
              <select id="part-reg-gender" class="form-select">
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Residential Address</label>
            <input type="text" id="part-reg-address" class="form-input" placeholder="Door No, Street, Locality" required>
          </div>

          <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">District (Kerala) *</label>
              <select id="part-reg-district" class="form-select" required>
                ${renderDistrictOptions(DEFAULT_DISTRICT)}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">State</label>
              <input type="text" id="part-reg-state" class="form-input" value="${DEFAULT_STATE}" readonly style="background: #F1F5F9; cursor: not-allowed;">
            </div>
            <div class="form-group">
              <label class="form-label">PIN Code *</label>
              <input type="text" id="part-reg-pin" class="form-input" placeholder="695001" value="695001" required pattern="[0-9]{6}">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Create Password</label>
            <input type="password" id="part-reg-pwd" class="form-input" required>
          </div>

          <button type="submit" class="btn btn-primary btn-md" style="width: 100%; margin-top: 0.5rem;">
            Proceed to KYC Document Upload →
          </button>
        </form>

        <div style="text-align: center; margin-top: 1.5rem; font-size: 0.85rem; color: var(--text-muted);">
          Already a partner? <a href="#/login" style="color: var(--brand-emerald-dark); font-weight: 700;">Partner Login</a>
        </div>
      </div>
    </div>
  `;
}

export function renderForgotPasswordPage() {
  return `
    <div class="app-container" style="max-width: 440px; padding: 4rem 1rem 6rem;">
      <div class="solid-card" style="padding: 2.25rem;">
        <h2 style="font-size: 1.6rem; margin-bottom: 0.5rem;">Reset Password</h2>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem;">
          Enter your registered email address and we'll send you a password reset link.
        </p>

        <form id="form-forgot-pwd">
          <div class="form-group">
            <label class="form-label">Registered Email</label>
            <input type="email" id="forgot-email" class="form-input" required>
          </div>
          <button type="submit" class="btn btn-primary btn-md" style="width: 100%;">
            Send Reset Instructions
          </button>
        </form>

        <div style="text-align: center; margin-top: 1.5rem;">
          <a href="#/login" style="font-size: 0.85rem; color: var(--brand-emerald); font-weight: 600;">← Back to Sign In</a>
        </div>
      </div>
    </div>
  `;
}

export function attachAuthPagesEvents() {
  function setupCustomerLoginFlow(prefillEmail = "") {
    const loginForm = document.getElementById("form-customer-login");
    const emailInput = document.getElementById("cust-login-email");
    const pwdInput = document.getElementById("cust-login-password");
    const toggleBtn = document.getElementById("btn-toggle-cust-pwd");
    const submitBtn = document.getElementById("btn-submit-cust-login");
    const errorBox = document.getElementById("cust-login-error-box");
    const stepContainer = document.getElementById("customer-login-step-container");
    const googleBtn = document.getElementById("btn-google-login");

    if (prefillEmail && emailInput) {
      emailInput.value = prefillEmail;
    }

    if (toggleBtn && pwdInput) {
      toggleBtn.onclick = () => {
        if (pwdInput.type === "password") {
          pwdInput.type = "text";
          toggleBtn.textContent = "Hide";
        } else {
          pwdInput.type = "password";
          toggleBtn.textContent = "Show";
        }
      };
    }

    if (googleBtn) {
      googleBtn.onclick = async () => {
        try {
          const res = await authManager.loginWithGoogle();
          if (res && res.user) {
            toast.success("Google Connected", `Welcome, ${res.user.fullName}!`);
            const pendingService = sessionStorage.getItem("kleen_pending_booking_service");
            if (pendingService) {
              sessionStorage.removeItem("kleen_pending_booking_service");
              window.location.hash = "#/";
              setTimeout(async () => {
                const { openBookingFlow } = await import("../customer/customer-view.js");
                openBookingFlow(pendingService);
              }, 300);
            } else {
              window.location.hash = "#/";
            }
          }
        } catch (err) {
          toast.error("Google Auth", err.message || "Could not sign in with Google.");
        }
      };
    }

    if (!loginForm || !stepContainer) return;

    loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = (emailInput?.value || "").trim().toLowerCase();
      const password = pwdInput?.value || "";

      if (errorBox) {
        errorBox.style.display = "none";
        errorBox.textContent = "";
      }

      if (!otpAuth.validateEmail(email)) {
        if (errorBox) {
          errorBox.style.display = "block";
          errorBox.textContent = "Please enter a valid email address.";
        }
        return;
      }

      if (!password || password.length < 4) {
        if (errorBox) {
          errorBox.style.display = "block";
          errorBox.textContent = "Please enter your password (minimum 4 characters).";
        }
        return;
      }

      try {
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = `<span>Verifying credentials...</span>`;
        }

        // 1. Verify credentials first
        const credResult = await authManager.verifyCredentials(email, password, "customer");

        // If admin credentials, redirect to dedicated admin console for 2-step OTP verification
        if (credResult?.isAdmin || email === "admin@kleen.in" || email === "kleenadmin" || email === "kleenadmin@gmail.com") {
          toast.info("Admin Portal", "Administrator accounts require 2-step OTP verification. Redirecting to admin console...");
          window.location.hash = "#/admin/login";
          return;
        }

        if (submitBtn) {
          submitBtn.innerHTML = `<span>Sending Brevo Verification Code...</span>`;
        }

        // 2. Dispatch Brevo OTP to user's email
        const res = await otpAuth.sendOtp(email, "customer");
        if (res.devNotice) {
          toast.warning("Brevo Notice", "Brevo IP not yet authorized. Developer auto-fill enabled.");
        } else {
          toast.info("Verification Code Dispatched", "A 6-digit code has been sent to your email. Please check your inbox.");
        }

        // 3. Mount 6-digit OTP Verification View
        stepContainer.innerHTML = renderOtpVerificationView(email, "customer");

        attachOtpVerificationEvents({
          email,
          role: "customer",
          initialNotice: res.devNotice,
          initialOtp: res.otp,
          onVerified: (res) => {
            const user = authManager.loginWithOtpUser(res.user, "customer");
            toast.success("Welcome to KLEEN", `Signed in as ${user.fullName || "Customer"}`);

            const pendingService = sessionStorage.getItem("kleen_pending_booking_service");
            if (pendingService) {
              sessionStorage.removeItem("kleen_pending_booking_service");
              window.location.hash = "#/";
              setTimeout(async () => {
                const { openBookingFlow } = await import("../customer/customer-view.js");
                openBookingFlow(pendingService);
              }, 300);
            } else {
              window.location.hash = "#/";
            }
          },
          onChangeEmail: () => {
            // Restore Email + Password form with email prefilled
            stepContainer.innerHTML = `
              <form id="form-customer-login">
                <div class="form-group" style="margin-bottom: 1.25rem;">
                  <label class="form-label" for="cust-login-email" style="font-weight: 600; margin-bottom: 0.35rem; display: block;">Email Address</label>
                  <input type="email" id="cust-login-email" class="form-input" value="${email}" placeholder="name@example.com" required autocomplete="email">
                </div>

                <div class="form-group" style="margin-bottom: 1.25rem;">
                  <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.35rem;">
                    <label class="form-label" for="cust-login-password" style="font-weight: 600; margin-bottom: 0;">Password</label>
                    <a href="#/forgot-password" style="font-size: 0.775rem; color: var(--brand-emerald-dark); font-weight: 600;">Forgot Password?</a>
                  </div>
                  <div style="position: relative;">
                    <input type="password" id="cust-login-password" class="form-input" placeholder="••••••••" required autocomplete="current-password">
                    <button type="button" id="btn-toggle-cust-pwd" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 0.85rem; cursor: pointer; color: var(--text-muted); font-weight: 600;">
                      Show
                    </button>
                  </div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">
                    A confidential 6-digit Brevo OTP verification code will be sent to your email.
                  </div>
                </div>

                <div id="cust-login-error-box" style="display: none; padding: 0.65rem 0.85rem; border-radius: 8px; background: #FEF2F2; border: 1px solid #FCA5A5; color: #991B1B; font-size: 0.8rem; margin-bottom: 1rem;"></div>

                <button type="submit" id="btn-submit-cust-login" class="btn btn-primary btn-md" style="width: 100%; font-weight: 700; padding: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                  <span>Sign In with Verification</span>
                  ${icon('arrow-right', { size: 16 })}
                </button>
              </form>

              <div style="margin: 1.5rem 0; display: flex; align-items: center; gap: 0.75rem;">
                <div style="flex: 1; height: 1px; background: #E5E7EB;"></div>
                <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">or</span>
                <div style="flex: 1; height: 1px; background: #E5E7EB;"></div>
              </div>

              <button type="button" id="btn-google-login" class="btn btn-glass btn-md" style="width: 100%; border-color: #D1D5DB; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 600;">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width: 18px; height: 18px;" alt="Google">
                Continue with Google
              </button>

              <div style="text-align: center; margin-top: 1.25rem;">
                <div style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.65rem; border-radius: 9999px; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); font-size: 0.725rem; font-weight: 600; color: #047857;">
                  <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10B981;"></span>
                  <span>Delivered securely via Brevo Transactional Email</span>
                </div>
              </div>
            `;
            setupCustomerLoginFlow(email);
            const pwdField = document.getElementById("cust-login-password");
            if (pwdField) pwdField.focus();
          },
        });
      } catch (err) {
        if (errorBox) {
          errorBox.style.display = "block";
          errorBox.textContent = err.message || "Sign in failed. Please check your credentials.";
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Sign In with Verification</span> ${icon('arrow-right', { size: 16 })}`;
        }
      }
    };
  }

  setupCustomerLoginFlow();

  // Customer Register
  const regCustForm = document.getElementById("form-register-customer");
  if (regCustForm) {
    regCustForm.onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById("reg-name").value;
      const email = document.getElementById("reg-email").value;
      const phone = document.getElementById("reg-phone").value;
      const pwd = document.getElementById("reg-password").value;
      const confirmPwd = document.getElementById("reg-confirm-password").value;

      if (pwd !== confirmPwd) {
        toast.error("Validation Error", "Passwords do not match.");
        return;
      }

      try {
        await authManager.registerCustomer({ fullName: name, email, phone, password: pwd });
        toast.success("Account Created", "Welcome to KLEEN.");
        
        const pendingService = sessionStorage.getItem("kleen_pending_booking_service");
        if (pendingService) {
          sessionStorage.removeItem("kleen_pending_booking_service");
          window.location.hash = "#/";
          setTimeout(async () => {
            const { openBookingFlow } = await import("../customer/customer-view.js");
            openBookingFlow(pendingService);
          }, 350);
        } else {
          window.location.hash = "#/";
        }
      } catch (err) {
        toast.error("Registration Error", err.message);
      }
    };
  }

  // Partner Register
  const regPartForm = document.getElementById("form-register-partner");
  if (regPartForm) {
    regPartForm.onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById("part-reg-name").value;
      const email = document.getElementById("part-reg-email").value;
      const phone = document.getElementById("part-reg-phone").value;
      const dob = document.getElementById("part-reg-dob").value;
      const gender = document.getElementById("part-reg-gender").value;
      const address = document.getElementById("part-reg-address").value;
      const district = document.getElementById("part-reg-district")?.value || DEFAULT_DISTRICT;
      const pinCode = document.getElementById("part-reg-pin")?.value || "695001";
      const pwd = document.getElementById("part-reg-pwd").value;

      try {
        await authManager.registerPartner({
          fullName: name,
          email,
          phone,
          dateOfBirth: dob,
          gender,
          address,
          city: district,
          district,
          state: DEFAULT_STATE,
          pinCode,
          password: pwd
        });
        toast.success("Partner Account Created", "Please complete your KYC documentation.");
        window.location.hash = "#/partner/kyc";
      } catch (err) {
        toast.error("Registration Error", err.message);
      }
    };
  }

  // Forgot Password
  const forgotForm = document.getElementById("form-forgot-pwd");
  if (forgotForm) {
    forgotForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById("forgot-email").value;
      try {
        const res = await authManager.sendPasswordReset(email);
        toast.success("Link Dispatched", res.message);
        setTimeout(() => { window.location.hash = "#/login"; }, 2000);
      } catch (err) {
        toast.error("Reset Error", err.message);
      }
    };
  }
}
