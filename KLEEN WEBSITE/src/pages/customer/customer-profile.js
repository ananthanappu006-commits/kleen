/**
 * KLEEN — Customer Profile Page (/customer/profile)
 */

import { auth } from "../../services/auth-service.js";
import { db } from "../../services/db-service.js";
import { toast } from "../../components/toast.js";
import { icon } from "../../components/icons.js";
import { openMfaEnrollmentModal } from "../../components/mfa-enrollment-modal.js";

export function renderCustomerProfilePage() {
  const user = auth.getCurrentUser();
  if (!user) {
    return `
      <div class="app-container" style="max-width: 480px; padding: 4rem 1rem 6rem; text-align: center;">
        <div class="solid-card" style="padding: 3rem 2rem;">
          <div style="margin-bottom: 0.75rem;">${icon('lock', { size: 44, stroke: 'var(--brand-emerald)' })}</div>
          <h2>Please Sign In</h2>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0.5rem 0 1.5rem;">You must sign in to view your profile settings.</p>
          <a href="#/login" class="btn btn-primary btn-md">Go to Sign In</a>
        </div>
      </div>
    `;
  }

  return `
    <div class="app-container" style="max-width: 600px; padding: 3rem 1rem 6rem;">
      <div class="solid-card" style="padding: 2.25rem;">
        <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem;">
          <img src="${user.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}" alt="Profile Photo" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid var(--brand-emerald-light);">
          <div>
            <h2 style="font-size: 1.45rem;">${user.fullName}</h2>
            <p style="color: var(--text-muted); font-size: 0.85rem;">Customer Account • Verified Homeowner</p>
          </div>
        </div>

        <form id="form-customer-profile">
          <div class="form-group">
            <label class="form-label">Full Name</label>
            <input type="text" id="prof-name" class="form-input" value="${user.fullName}" required>
          </div>

          <div class="form-group">
            <label class="form-label">Email Address</label>
            <input type="email" id="prof-email" class="form-input" value="${user.email}" required>
          </div>

          <div class="form-group">
            <label class="form-label">Phone Number</label>
            <input type="tel" id="prof-phone" class="form-input" value="${user.phone || '+91 98765 43210'}" required>
          </div>

          <button type="submit" class="btn btn-primary btn-md" style="width: 100%; margin-top: 0.75rem;">
            Save Profile Changes
          </button>
        </form>

        <!-- Security & MFA Section -->
        <div style="margin-top: 1.75rem; padding: 1.25rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.4rem; font-weight: 700; font-size: 0.95rem; color: #0F172A;">
                <span>Two-Factor Authentication (SMS 2FA)</span>
                <span class="badge badge-success" style="font-size: 0.7rem; padding: 2px 6px;">Firebase MFA</span>
              </div>
              <p style="color: var(--text-muted); font-size: 0.8rem; margin: 0.25rem 0 0;">
                Require a one-time SMS verification code on your phone when signing in.
              </p>
            </div>
            <button type="button" id="btn-customer-setup-mfa" class="btn btn-secondary btn-sm" style="font-weight: 700; white-space: nowrap; margin-left: 0.75rem;">
              CONFIGURE 2FA
            </button>
          </div>
        </div>

        <div style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #E5E7EB; display: flex; justify-content: space-between;">
          <a href="#/customer/addresses" class="btn btn-secondary btn-sm">Manage Addresses</a>
          <a href="#/bookings" class="btn btn-glass btn-sm">My Bookings</a>
        </div>
      </div>
    </div>
  `;
}

export function attachCustomerProfileEvents() {
  const form = document.getElementById("form-customer-profile");
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const user = auth.getCurrentUser();
      const name = document.getElementById("prof-name").value;
      const email = document.getElementById("prof-email").value;
      const phone = document.getElementById("prof-phone").value;

      if (user) {
        user.fullName = name;
        user.email = email;
        user.phone = phone;
        auth.saveSession();
        toast.success("Profile Updated", "Your contact details have been updated.");
      }
    };
  }

  const mfaBtn = document.getElementById("btn-customer-setup-mfa");
  if (mfaBtn) {
    mfaBtn.onclick = () => {
      const user = auth.getCurrentUser();
      openMfaEnrollmentModal({
        displayName: `${user?.fullName || 'Customer'} Mobile 2FA`,
        onSuccess: (result) => {
          toast.success("MFA Enabled", "SMS Multi-Factor Authentication is active for your account.");
        }
      });
    };
  }
}
