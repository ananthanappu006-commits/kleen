/**
 * KLEEN — Dedicated Partner Authentication Pages (/partner/login, /partner/register, /partner/forgot-password)
 */

import { auth } from "../../services/auth-service.js";
import { authManager } from "../../services/auth/auth-manager.js";
import { db } from "../../services/db-service.js";
import { toast } from "../../components/toast.js";
import { modal } from "../../components/modal.js";
import { icon } from "../../components/icons.js";
import { renderDistrictOptions, DEFAULT_STATE, DEFAULT_DISTRICT } from "../../config/kerala-districts.js";
import { otpAuth } from "../../services/auth/otp-auth-service.js";
import { renderOtpVerificationView, attachOtpVerificationEvents } from "../../components/otp-input.js";

export function renderPartnerLoginPage() {
  return `
    <div class="app-container" style="max-width: 460px; padding: 4rem 1rem 6rem;">
      <div class="solid-card" style="padding: 2.5rem 2rem;">
        <div style="text-align: center; margin-bottom: 1.5rem;">
          <div style="display: flex; justify-content: center; margin-bottom: 0.75rem;">
            <div class="icon-box icon-box-lg icon-box-emerald">
              ${icon('sparkles', { size: 28 })}
            </div>
          </div>
          <span class="badge badge-success" style="margin-bottom: 0.5rem;">Service Professional Portal</span>
          <h2 style="font-size: 1.65rem; margin-bottom: 0.25rem;">Partner Sign In</h2>
          <p style="color: var(--text-muted); font-size: 0.875rem;">Access your jobs, live earnings, and daily cleaning schedule</p>
        </div>

        <!-- Unified Partner Login Flow: Step 1 (Credentials) -> Step 2 (Brevo OTP) -->
        <div id="partner-login-step-container">
          <form id="form-partner-login-verify">
            <div class="form-group" style="margin-bottom: 1.25rem;">
              <label class="form-label" for="part-login-email" style="font-weight: 600; margin-bottom: 0.35rem; display: block;">Registered Email Address</label>
              <input type="email" id="part-login-email" class="form-input" placeholder="e.g. partner@kleen.in" required autocomplete="email">
            </div>

            <div class="form-group" style="margin-bottom: 1.25rem;">
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.35rem;">
                <label class="form-label" for="part-login-password" style="font-weight: 600; margin-bottom: 0;">Password</label>
                <a href="#/partner/forgot-password" style="font-size: 0.775rem; color: var(--brand-emerald-dark); font-weight: 600; text-decoration: none;">Forgot Password?</a>
              </div>
              <div style="position: relative;">
                <input type="password" id="part-login-password" class="form-input" placeholder="Enter your password" required autocomplete="current-password">
                <button type="button" id="btn-toggle-part-pwd" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 0.85rem; cursor: pointer; color: var(--text-muted); font-weight: 600;">
                  Show
                </button>
              </div>
              <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">
                Email will be verified with a confidential 6-digit Brevo OTP.
              </div>
            </div>

            <div id="part-login-error-box" style="display: none; padding: 0.65rem 0.85rem; border-radius: 8px; background: #FEF2F2; border: 1px solid #FCA5A5; color: #991B1B; font-size: 0.8rem; margin-bottom: 1rem;"></div>

            <button type="submit" id="btn-submit-part-login-verify" class="btn btn-primary btn-md" style="width: 100%; font-weight: 700; padding: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
              <span>Sign In with Verification</span>
              ${icon('arrow-right', { size: 16 })}
            </button>

            <button type="button" id="btn-quick-fill-demo-partner" class="btn btn-secondary btn-md" style="width: 100%; margin-top: 0.75rem; font-weight: 700; border: 1.5px dashed var(--brand-emerald); background: #F0FDF4; color: #166534; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;">
              ${icon('zap', { size: 16 })}
              <span>Fill Demo Partner (Sunita Verma)</span>
            </button>
          </form>

          <div style="margin: 1.5rem 0; display: flex; align-items: center; gap: 0.75rem;">
            <div style="flex: 1; height: 1px; background: #E5E7EB;"></div>
            <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">or</span>
            <div style="flex: 1; height: 1px; background: #E5E7EB;"></div>
          </div>

          <button type="button" id="btn-partner-google-login" class="btn btn-glass btn-md" style="width: 100%; border-color: #D1D5DB; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 600;">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width: 18px; height: 18px;" alt="Google">
            <span>Sign In with Google</span>
          </button>

          <div style="text-align: center; margin-top: 1.25rem;">
            <div style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.65rem; border-radius: 9999px; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); font-size: 0.725rem; font-weight: 600; color: #047857;">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10B981;"></span>
              <span>Protected by Brevo Transactional Email Service</span>
            </div>
          </div>
        </div>

        <div style="margin-top: 1.75rem; padding-top: 1.5rem; border-top: 1px solid #E5E7EB; text-align: center; font-size: 0.85rem;">
          <p style="color: var(--text-secondary); margin-bottom: 0.5rem;">New to KLEEN platform?</p>
          <a href="#/partner/register" class="btn btn-secondary btn-sm" style="width: 100%;">
            Create Partner Account
          </a>
        </div>

        <div style="text-align: center; margin-top: 1.25rem; font-size: 0.8rem; color: var(--text-muted);">
          Looking for cleaning services? <a href="#/login" style="color: var(--brand-emerald-dark); font-weight: 600;">Customer Sign In</a>
        </div>
      </div>
    </div>
  `;
}

export function renderPartnerRegisterPage() {
  return `
    <div class="app-container" style="max-width: 620px; padding: 3rem 1rem 6rem;">
      <div class="solid-card" style="padding: 2.5rem 2rem;">
        <div style="text-align: center; margin-bottom: 2rem;">
          <span class="badge badge-success" style="margin-bottom: 0.5rem;">Join Verified Professionals</span>
          <h2 style="font-size: 1.65rem; margin-bottom: 0.25rem;">Register as a KLEEN Partner</h2>
          <p style="color: var(--text-muted); font-size: 0.875rem;">Keep 80% of earnings with guaranteed safety, transparent tips & direct payouts</p>
        </div>

        <form id="form-partner-register">
          <div class="form-group">
            <label class="form-label" for="part-reg-name">Full Legal Name (as on Government ID) *</label>
            <input type="text" id="part-reg-name" class="form-input" placeholder="e.g. Ramesh Chandra" required minlength="3">
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label" for="part-reg-email">Email Address *</label>
              <input type="email" id="part-reg-email" class="form-input" placeholder="e.g. partner@example.com" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="part-reg-phone">Phone Number *</label>
              <input type="tel" id="part-reg-phone" class="form-input" placeholder="10-digit mobile number" required pattern="[0-9]{10}">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label" for="part-reg-dob">Date of Birth *</label>
              <input type="date" id="part-reg-dob" class="form-input" required max="2006-01-01">
            </div>
            <div class="form-group">
              <label class="form-label" for="part-reg-gender">Gender *</label>
              <select id="part-reg-gender" class="form-select" required>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="part-reg-address">Residential Address (Door No. & Street) *</label>
            <input type="text" id="part-reg-address" class="form-input" placeholder="e.g. #14, 2nd Cross, Near Temple" required>
          </div>

          <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label" for="part-reg-district">District (Kerala) *</label>
              <select id="part-reg-district" class="form-select" required>
                ${renderDistrictOptions(DEFAULT_DISTRICT)}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" for="part-reg-state">State</label>
              <input type="text" id="part-reg-state" class="form-input" value="${DEFAULT_STATE}" readonly style="background: #F1F5F9; cursor: not-allowed;">
            </div>
            <div class="form-group">
              <label class="form-label" for="part-reg-pin">PIN Code *</label>
              <input type="text" id="part-reg-pin" class="form-input" placeholder="695001" required pattern="[0-9]{6}">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label" for="part-reg-pwd">Create Password *</label>
              <input type="password" id="part-reg-pwd" class="form-input" placeholder="Min. 6 characters" required minlength="6">
            </div>
            <div class="form-group">
              <label class="form-label" for="part-reg-confirm-pwd">Confirm Password *</label>
              <input type="password" id="part-reg-confirm-pwd" class="form-input" placeholder="Re-enter password" required minlength="6">
            </div>
          </div>

          <div style="margin-bottom: 1.5rem; font-size: 0.85rem; color: var(--text-secondary); display: flex; align-items: flex-start; gap: 0.5rem;">
            <input type="checkbox" id="part-terms-agree" required style="margin-top: 0.2rem;">
            <label for="part-terms-agree" style="margin: 0; line-height: 1.4;">
              I agree to the <a href="#/terms" style="color: var(--brand-emerald-dark);">KLEEN Partner Service Agreement</a>, Code of Conduct, and mandatory Police Verification Policy.
            </label>
          </div>

          <button type="submit" id="btn-submit-part-reg" class="btn btn-primary btn-md" style="width: 100%; font-weight: 700;">
            Create Partner Account & Start KYC →
          </button>
        </form>

        <div style="text-align: center; margin-top: 1.5rem; font-size: 0.85rem; color: var(--text-muted);">
          Already registered as a partner? <a href="#/partner/login" style="color: var(--brand-emerald-dark); font-weight: 700;">Sign In</a>
        </div>
      </div>
    </div>
  `;
}

export function renderPartnerForgotPasswordPage() {
  return `
    <div class="app-container" style="max-width: 440px; padding: 4rem 1rem 6rem; text-align: center;">
      <div class="solid-card" style="padding: 2.5rem 2rem;">
        <div style="display: flex; justify-content: center; margin-bottom: 1rem;">
          <div class="icon-box icon-box-lg icon-box-emerald">
            ${icon('lock', { size: 28 })}
          </div>
        </div>
        <h2 style="font-size: 1.5rem; margin-bottom: 0.35rem;">Reset Partner Password</h2>
        <p style="color: var(--text-muted); font-size: 0.875rem; margin-bottom: 1.5rem;">
          Enter your registered partner email address. We will generate and send a secure password reset link.
        </p>

        <form id="form-partner-forgot-pwd">
          <div class="form-group" style="text-align: left;">
            <label class="form-label" for="part-reset-email">Email Address</label>
            <input type="email" id="part-reset-email" class="form-input" placeholder="e.g. partner@kleen.in" required>
          </div>

          <button type="submit" id="btn-part-send-reset" class="btn btn-primary btn-md" style="width: 100%;">
            Send Reset Link
          </button>
        </form>

        <div style="margin-top: 1.5rem; font-size: 0.85rem;">
          <a href="#/partner/login" style="color: var(--brand-emerald-dark); font-weight: 600; text-decoration: none;">
            ← Back to Partner Login
          </a>
        </div>
      </div>
    </div>
  `;
}

export function attachPartnerAuthEvents() {
  function setupPartnerLoginFlow(prefillEmail = "") {
    const loginForm = document.getElementById("form-partner-login-verify");
    const emailInput = document.getElementById("part-login-email");
    const pwdInput = document.getElementById("part-login-password");
    const toggleBtn = document.getElementById("btn-toggle-part-pwd");
    const submitBtn = document.getElementById("btn-submit-part-login-verify");
    const demoFillBtn = document.getElementById("btn-quick-fill-demo-partner");
    const errorBox = document.getElementById("part-login-error-box");
    const stepContainer = document.getElementById("partner-login-step-container");
    const googleBtn = document.getElementById("btn-partner-google-login");

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

    if (demoFillBtn) {
      demoFillBtn.onclick = () => {
        if (emailInput) emailInput.value = "partner@kleen.in";
        if (pwdInput) pwdInput.value = "partner123";
        toast.info("Demo Partner Filled", "Click 'Sign In with Verification' to test the Brevo verification code flow.");
      };
    }

    if (googleBtn) {
      googleBtn.onclick = async () => {
        try {
          googleBtn.disabled = true;
          googleBtn.innerHTML = `<span>Connecting to Google...</span>`;
          const authRes = await auth.loginWithGoogle("partner");
          const user = authRes?.user || authRes;
          if (user) {
            toast.success("Google Connected", `Welcome, ${user.fullName || "Partner"}!`);
            const partner = db.getPartnerById(user.userId) || user;
            const kycStatus = partner.kycStatus || "NOT_STARTED";
            if (kycStatus === "NOT_STARTED" || kycStatus === "DRAFT") {
              toast.info("KYC Required", "Please complete your KYC documentation to activate your partner profile.");
              window.location.hash = "#/partner/kyc";
            } else {
              window.location.hash = "#/partner";
            }
          }
        } catch (err) {
          toast.error("Google Sign In", err.message || "Could not sign in with Google.");
        } finally {
          googleBtn.disabled = false;
          googleBtn.innerHTML = `
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width: 18px; height: 18px;" alt="Google">
            <span>Sign In with Google</span>
          `;
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

        // 1. Verify partner credentials
        await authManager.verifyCredentials(email, password, "partner");

        if (submitBtn) {
          submitBtn.innerHTML = `<span>Sending Brevo Verification Code...</span>`;
        }

        // 2. Dispatch Brevo OTP to partner's email
        const res = await otpAuth.sendOtp(email, "partner");
        if (res.devNotice) {
          toast.warning("Brevo Notice", "Brevo IP not yet authorized. Developer auto-fill enabled.");
        } else {
          toast.info("Verification Code Dispatched", "A 6-digit code has been sent to your email. Please check your inbox.");
        }

        // 3. Mount 6-digit OTP Verification View
        stepContainer.innerHTML = renderOtpVerificationView(email, "partner");

        attachOtpVerificationEvents({
          email,
          role: "partner",
          initialNotice: res.devNotice,
          initialOtp: res.otp,
          onVerified: (res) => {
            const user = authManager.loginWithOtpUser(res.user, "partner");
            const partner = db.getPartnerById(user.userId) || user;

            // Check account suspension
            if (partner.accountStatus === "SUSPENDED" || partner.accountStatus === "DEACTIVATED") {
              window.location.hash = "#/partner/account-suspended";
              return;
            }

            const kycStatus = partner.kycStatus || "NOT_STARTED";
            if (kycStatus === "NOT_STARTED" || kycStatus === "DRAFT") {
              toast.info("KYC Required", "Please complete your KYC documentation to activate your partner profile.");
              window.location.hash = "#/partner/kyc";
            } else {
              toast.success("Welcome Back", `Signed in as ${partner.fullName || "Partner"}. Opening dashboard.`);
              window.location.hash = "#/partner";
            }
          },
          onChangeEmail: () => {
            // Restore Email + Password form with email prefilled
            stepContainer.innerHTML = `
              <form id="form-partner-login-verify">
                <div class="form-group" style="margin-bottom: 1.25rem;">
                  <label class="form-label" for="part-login-email" style="font-weight: 600; margin-bottom: 0.35rem; display: block;">Registered Email Address</label>
                  <input type="email" id="part-login-email" class="form-input" value="${email}" placeholder="e.g. partner@kleen.in" required autocomplete="email">
                </div>

                <div class="form-group" style="margin-bottom: 1.25rem;">
                  <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.35rem;">
                    <label class="form-label" for="part-login-password" style="font-weight: 600; margin-bottom: 0;">Password</label>
                    <a href="#/partner/forgot-password" style="font-size: 0.775rem; color: var(--brand-emerald-dark); font-weight: 600; text-decoration: none;">Forgot Password?</a>
                  </div>
                  <div style="position: relative;">
                    <input type="password" id="part-login-password" class="form-input" placeholder="Enter your password" required autocomplete="current-password">
                    <button type="button" id="btn-toggle-part-pwd" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); background: none; border: none; font-size: 0.85rem; cursor: pointer; color: var(--text-muted); font-weight: 600;">
                      Show
                    </button>
                  </div>
                  <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.35rem;">
                    Email will be verified with a confidential 6-digit Brevo OTP.
                  </div>
                </div>

                <div id="part-login-error-box" style="display: none; padding: 0.65rem 0.85rem; border-radius: 8px; background: #FEF2F2; border: 1px solid #FCA5A5; color: #991B1B; font-size: 0.8rem; margin-bottom: 1rem;"></div>

                <button type="submit" id="btn-submit-part-login-verify" class="btn btn-primary btn-md" style="width: 100%; font-weight: 700; padding: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                  <span>Sign In with Verification</span>
                  ${icon('arrow-right', { size: 16 })}
                </button>

                <button type="button" id="btn-quick-fill-demo-partner" class="btn btn-secondary btn-md" style="width: 100%; margin-top: 0.75rem; font-weight: 700; border: 1.5px dashed var(--brand-emerald); background: #F0FDF4; color: #166534; display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;">
                  ${icon('zap', { size: 16 })}
                  <span>Fill Demo Partner (Sunita Verma)</span>
                </button>
              </form>

              <div style="margin: 1.5rem 0; display: flex; align-items: center; gap: 0.75rem;">
                <div style="flex: 1; height: 1px; background: #E5E7EB;"></div>
                <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">or</span>
                <div style="flex: 1; height: 1px; background: #E5E7EB;"></div>
              </div>

              <button type="button" id="btn-partner-google-login" class="btn btn-glass btn-md" style="width: 100%; border-color: #D1D5DB; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-weight: 600;">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width: 18px; height: 18px;" alt="Google">
                <span>Sign In with Google</span>
              </button>

              <div style="text-align: center; margin-top: 1.25rem;">
                <div style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0.65rem; border-radius: 9999px; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); font-size: 0.725rem; font-weight: 600; color: #047857;">
                  <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #10B981;"></span>
                  <span>Protected by Brevo Transactional Email Service</span>
                </div>
              </div>
            `;
            setupPartnerLoginFlow(email);
            const pwdField = document.getElementById("part-login-password");
            if (pwdField) pwdField.focus();
          },
        });
      } catch (err) {
        if (errorBox) {
          errorBox.style.display = "block";
          errorBox.textContent = err.message || "Partner sign in failed. Please check your credentials.";
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `<span>Sign In with Verification</span> ${icon('arrow-right', { size: 16 })}`;
        }
      }
    };
  }

  setupPartnerLoginFlow();

  // Partner Registration Form
  const regForm = document.getElementById("form-partner-register");
  if (regForm) {
    try {
      const rawLead = sessionStorage.getItem("kleen_partner_lead");
      if (rawLead) {
        const lead = JSON.parse(rawLead);
        if (lead.fullName && document.getElementById("part-reg-name")) document.getElementById("part-reg-name").value = lead.fullName;
        if (lead.phone && document.getElementById("part-reg-phone")) document.getElementById("part-reg-phone").value = lead.phone;
        const leadDist = lead.district || lead.city;
        if (leadDist && document.getElementById("part-reg-district")) {
          document.getElementById("part-reg-district").value = leadDist;
        }
        sessionStorage.removeItem("kleen_partner_lead");
      }
    } catch (err) {
      console.warn("Could not prefill partner lead:", err);
    }

    regForm.onsubmit = async (e) => {
      e.preventDefault();
      const name = document.getElementById("part-reg-name").value.trim();
      const email = document.getElementById("part-reg-email").value.trim();
      const phone = document.getElementById("part-reg-phone").value.trim();
      const dob = document.getElementById("part-reg-dob").value;
      const gender = document.getElementById("part-reg-gender").value;
      const address = document.getElementById("part-reg-address").value.trim();
      const districtEl = document.getElementById("part-reg-district");
      const district = districtEl ? districtEl.value.trim() : DEFAULT_DISTRICT;
      const city = district;
      const state = (document.getElementById("part-reg-state")?.value || DEFAULT_STATE).trim();
      const pinCode = document.getElementById("part-reg-pin").value.trim();
      const pwd = document.getElementById("part-reg-pwd").value;
      const confirmPwd = document.getElementById("part-reg-confirm-pwd").value;
      const submitBtn = document.getElementById("btn-submit-part-reg");

      if (pwd !== confirmPwd) {
        toast.error("Password Mismatch", "Passwords do not match. Please re-enter.");
        return;
      }

      try {
        submitBtn.textContent = "Creating Partner Account...";
        submitBtn.disabled = true;

        const partnerPayload = {
          fullName: name,
          email,
          phone: "+91 " + phone.replace(/^\+91\s*/, ""),
          password: pwd,
          dateOfBirth: dob,
          gender,
          address: `${address}, ${district}, ${state} - ${pinCode}`,
          city,
          district,
          state,
          pinCode,
          role: "partner",
          kycStatus: "NOT_STARTED",
          accountStatus: "ACTIVE",
          isEligibleForBooking: false,
          isOnline: false,
          rating: 5.0,
          totalCompletedJobs: 0,
          totalEarnings: 0
        };

        await auth.register(partnerPayload);

        toast.success("Account Created!", "Welcome to KLEEN! Please complete your KYC verification.");
        window.location.hash = "#/partner/kyc";
      } catch (err) {
        toast.error("Registration Error", err.message || "Failed to create partner account.");
        submitBtn.textContent = "Create Partner Account & Start KYC →";
        submitBtn.disabled = false;
      }
    };
  }

  // Forgot Password Form
  const forgotForm = document.getElementById("form-partner-forgot-pwd");
  if (forgotForm) {
    forgotForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById("part-reset-email").value.trim();
      const submitBtn = document.getElementById("btn-part-send-reset");

      try {
        submitBtn.textContent = "Sending...";
        submitBtn.disabled = true;
      } catch (err) {
        // no-op
      }

      try {
        await authManager.sendPasswordReset(email);
        toast.success("Reset Link Sent!", `Password reset instructions sent to ${email}.`);
        submitBtn.textContent = "Reset Link Dispatched";
      } catch (err) {
        toast.error("Notice", err.message || "Failed to process request.");
        submitBtn.textContent = "Send Reset Link";
        submitBtn.disabled = false;
      }
    };
  }
}
