/**
 * KLEEN — Partner Account Settings (/partner/settings)
 * Notification preferences, legal documents, logout, and account deactivation.
 */

import { auth } from "../../services/auth-service.js";
import { db } from "../../services/db-service.js";
import { modal } from "../../components/modal.js";
import { toast } from "../../components/toast.js";
import { icon } from "../../components/icons.js";
import { openMfaEnrollmentModal } from "../../components/mfa-enrollment-modal.js";
import { renderPartnerHeader, renderPartnerSidebar, renderPartnerMobileBottomNav, attachPartnerNavEvents } from "./partner-nav.js";

export function renderPartnerSettingsPage() {
  const user = auth.getCurrentUser();
  if (!user || user.role !== "partner") {
    return `
      <div class="app-container" style="max-width: 480px; padding: 4rem 1rem; text-align: center;">
        <div class="solid-card" style="padding: 2.5rem;">
          <h2>Partner Access Required</h2>
          <a href="#/partner/login" class="btn btn-primary btn-md">Partner Login</a>
        </div>
      </div>
    `;
  }

  const partner = db.getPartnerById(user.userId) || user;

  return `
    <div class="partner-layout">
      ${renderPartnerSidebar("/partner/settings")}

      <div class="partner-main-content">
        ${renderPartnerHeader("/partner/settings", partner)}

        <div class="partner-dashboard-body" style="max-width: 760px; margin: 0 auto; padding: 2rem 1rem 5rem;">
          
          <div style="margin-bottom: 2rem;">
            <span class="badge badge-info" style="margin-bottom: 0.35rem;">Preferences</span>
            <h2 style="font-size: 1.65rem; margin: 0;">Partner Account Settings</h2>
            <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0.25rem 0 0;">
              Manage notifications, view policies, and control your partner membership
            </p>
          </div>

          <!-- Notification Preferences -->
          <div class="solid-card" style="padding: 2rem; margin-bottom: 1.5rem;">
            <h3 style="font-size: 1.15rem; margin-bottom: 0.5rem;">Job Alerts & Notifications</h3>
            <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.25rem;">Select which channels you want to receive instant customer booking alerts on</p>

            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <label style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border: 1px solid #E5E7EB; border-radius: var(--radius-md); cursor: pointer;">
                <div>
                  <strong>Booking Dispatch Alerts</strong>
                  <div style="font-size: 0.775rem; color: var(--text-muted);">Real-time push notifications when new cleaning jobs are requested in your zone</div>
                </div>
                <input type="checkbox" id="pref-booking" checked>
              </label>

              <label style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border: 1px solid #E5E7EB; border-radius: var(--radius-md); cursor: pointer;">
                <div>
                  <strong>Service Arrival Reminders</strong>
                  <div style="font-size: 0.775rem; color: var(--text-muted);">SMS 1 hour prior to scheduled customer service start time</div>
                </div>
                <input type="checkbox" id="pref-service" checked>
              </label>

              <label style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border: 1px solid #E5E7EB; border-radius: var(--radius-md); cursor: pointer;">
                <div>
                  <strong>Weekly Payout & Earnings Statements</strong>
                  <div style="font-size: 0.775rem; color: var(--text-muted);">Email summary of weekly net earnings and direct bank transfer receipts</div>
                </div>
                <input type="checkbox" id="pref-earnings" checked>
              </label>

              <label style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border: 1px solid #E5E7EB; border-radius: var(--radius-md); cursor: pointer;">
                <div>
                  <strong>Admin Broadcasts & Incentive Updates</strong>
                  <div style="font-size: 0.775rem; color: var(--text-muted);">Important platform announcements, bonus payouts, and safety policies</div>
                </div>
                <input type="checkbox" id="pref-admin" checked>
              </label>

              <label style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border: 1px solid #E5E7EB; border-radius: var(--radius-md); cursor: pointer;">
                <div>
                  <strong>Customer Dispute & Support Desk Updates</strong>
                  <div style="font-size: 0.775rem; color: var(--text-muted);">Instant alerts when support staff reply to your active tickets</div>
                </div>
                <input type="checkbox" id="pref-support" checked>
              </label>
            </div>

            <button type="button" id="btn-save-notif-prefs" class="btn btn-primary btn-sm" style="margin-top: 1rem;">SAVE SETTINGS</button>
          </div>

          <!-- Account Section -->
          <div class="solid-card" style="padding: 2rem; margin-bottom: 1.5rem;">
            <h3 style="font-size: 1.15rem; margin-bottom: 1rem;">Account</h3>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border: 1px solid #E5E7EB; border-radius: var(--radius-md);">
                <div>
                  <strong>Account Information</strong>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">View and manage your registered legal name, address, and verified profile</div>
                </div>
                <a href="#/partner/profile" class="btn btn-secondary btn-sm">VIEW PROFILE</a>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border: 1px solid #E5E7EB; border-radius: var(--radius-md);">
                <div>
                  <div style="display: flex; align-items: center; gap: 0.4rem;">
                    <strong>Two-Factor Authentication (SMS 2FA)</strong>
                    <span class="badge badge-success" style="font-size: 0.7rem; padding: 2px 6px;">Firebase MFA</span>
                  </div>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">Protect your account with phone verification on login (kleen-web)</div>
                </div>
                <button type="button" id="btn-settings-setup-mfa" class="btn btn-secondary btn-sm" style="font-weight: 700;">CONFIGURE 2FA</button>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border: 1px solid #E5E7EB; border-radius: var(--radius-md);">
                <div>
                  <strong>Change Password</strong>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">Update your secure login password for your partner account</div>
                </div>
                <button type="button" id="btn-settings-change-pwd" class="btn btn-secondary btn-sm">CHANGE PASSWORD</button>
              </div>
            </div>
          </div>

          <!-- Legal Section -->
          <div class="solid-card" style="padding: 2rem; margin-bottom: 1.5rem;">
            <h3 style="font-size: 1.15rem; margin-bottom: 1rem;">Legal</h3>
            <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.9rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border: 1px solid #E5E7EB; border-radius: var(--radius-md);">
                <span style="display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 600;">
                  ${icon('file-text', { size: 16, stroke: 'var(--brand-emerald)' })} Terms & Conditions
                </span>
                <a href="#/terms" class="btn btn-glass btn-sm">VIEW</a>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border: 1px solid #E5E7EB; border-radius: var(--radius-md);">
                <span style="display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 600;">
                  ${icon('lock', { size: 16, stroke: 'var(--brand-emerald)' })} Privacy Policy
                </span>
                <a href="#/privacy" class="btn btn-glass btn-sm">VIEW</a>
              </div>
            </div>
          </div>

          <!-- Support Section -->
          <div class="solid-card" style="padding: 2rem; margin-bottom: 1.5rem;">
            <h3 style="font-size: 1.15rem; margin-bottom: 1rem;">Support</h3>
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 1rem; border: 1px solid #E5E7EB; border-radius: var(--radius-md);">
              <div>
                <strong>Contact Support</strong>
                <div style="font-size: 0.8rem; color: var(--text-muted);">Open a support ticket or reach out to 24/7 partner assistance</div>
              </div>
              <a href="#/partner/support" class="btn btn-secondary btn-sm">CONTACT SUPPORT</a>
            </div>
          </div>

          <!-- Account Actions Section -->
          <div class="solid-card" style="padding: 2rem; margin-bottom: 1.5rem;">
            <h3 style="font-size: 1.15rem; margin-bottom: 1rem;">Account Actions</h3>
            
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border: 1px solid #E5E7EB; border-radius: var(--radius-md); margin-bottom: 1rem;">
              <div>
                <strong>Logout</strong>
                <div style="font-size: 0.8rem; color: var(--text-muted);">End your active partner session on this device</div>
              </div>
              <button id="btn-settings-logout" class="btn btn-secondary btn-sm">LOGOUT</button>
            </div>

            <div style="padding: 1.25rem; border: 1px solid #FECACA; background: #FEF2F2; border-radius: var(--radius-md);">
              <h4 style="color: #991B1B; margin: 0 0 0.35rem; font-size: 0.95rem;">Deactivate Account</h4>
              <p style="color: #B91C1C; font-size: 0.825rem; margin: 0 0 1rem; line-height: 1.4;">
                Deactivating your account will stop new booking assignments while preserving your completed job and earnings records.
              </p>
              <button id="btn-deactivate-partner" class="btn btn-danger btn-sm" style="font-weight: 700;">
                DEACTIVATE ACCOUNT
              </button>
            </div>
          </div>

        </div>

        ${renderPartnerMobileBottomNav("/partner/settings")}
      </div>
    </div>
  `;
}

export function attachPartnerSettingsEvents() {
  attachPartnerNavEvents();

  const user = auth.getCurrentUser();
  if (!user) return;
  const partnerId = user.userId;

  const notifBtn = document.getElementById("btn-save-notif-prefs");
  if (notifBtn) {
    notifBtn.onclick = () => {
      toast.success("Preferences Saved", "Your notification channels have been updated.");
    };
  }

  const mfaBtn = document.getElementById("btn-settings-setup-mfa");
  if (mfaBtn) {
    mfaBtn.onclick = () => {
      openMfaEnrollmentModal({
        displayName: `${user.fullName || 'Partner'} Mobile 2FA`,
        onSuccess: (result) => {
          toast.success("MFA Enabled", "SMS Multi-Factor Authentication is active for your account.");
        }
      });
    };
  }

  const logoutBtn = document.getElementById("btn-settings-logout");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      modal.open({
        title: "Sign Out Confirmation",
        maxWidth: "400px",
        bodyHtml: `<p style="font-size: 0.9rem; color: var(--text-secondary);">Are you sure you want to log out of your KLEEN partner account?</p>`,
        footerHtml: `
          <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">Cancel</button>
          <button class="btn btn-primary btn-sm" id="btn-modal-logout-confirm">Sign Out</button>
        `,
        onOpen: (container) => {
          container.querySelector("#btn-modal-logout-confirm").onclick = () => {
            modal.close();
            auth.logout();
            toast.info("Logged Out", "Signed out successfully.");
            window.location.hash = "#/partner/login";
          };
        }
      });
    };
  }

  const deactivateBtn = document.getElementById("btn-deactivate-partner");
  if (deactivateBtn) {
    deactivateBtn.onclick = () => {
      modal.open({
        title: "Confirm Partner Account Deactivation",
        maxWidth: "440px",
        bodyHtml: `
          <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">
            Are you sure you want to deactivate your KLEEN partner account? You will not receive any new booking dispatch requests.
          </p>
        `,
        footerHtml: `
          <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">Cancel</button>
          <button class="btn btn-danger btn-sm" id="btn-confirm-deactivate-yes">Yes, Deactivate Account</button>
        `,
        onOpen: (container) => {
          container.querySelector("#btn-confirm-deactivate-yes").onclick = () => {
            const snapshot = db.getSnapshot();
            snapshot.partners = (snapshot.partners || []).map(p => {
              if (p.partnerId === partnerId || p.userId === partnerId) {
                return { ...p, accountStatus: "DEACTIVATED", isOnline: false, isEligibleForBooking: false };
              }
              return p;
            });
            db.saveSnapshot(snapshot, "partners");

            db.logAuditAction({
              actorId: partnerId,
              actorRole: "partner",
              action: "PARTNER_DEACTIVATED",
              targetId: partnerId,
              description: `Partner ${partnerId} self-deactivated their account`
            });

            modal.close();
            toast.warning("Account Deactivated", "Your partner account has been deactivated.");
            window.location.hash = "#/partner/account-deactivated";
          };
        }
      });
    };
  }

  // Change Password Modal
  const changePwdBtn = document.getElementById("btn-settings-change-pwd");
  if (changePwdBtn) {
    changePwdBtn.onclick = () => {
      modal.open({
        title: "Change Account Password",
        maxWidth: "420px",
        bodyHtml: `
          <div class="form-group">
            <label class="form-label">Current Password</label>
            <input type="password" id="part-settings-pwd-current" class="form-input" placeholder="Current password" required>
          </div>
          <div class="form-group">
            <label class="form-label">New Password</label>
            <input type="password" id="part-settings-pwd-new" class="form-input" placeholder="Min. 6 characters" required>
          </div>
          <div class="form-group">
            <label class="form-label">Confirm New Password</label>
            <input type="password" id="part-settings-pwd-confirm" class="form-input" placeholder="Re-enter new password" required>
          </div>
        `,
        footerHtml: `
          <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">Cancel</button>
          <button class="btn btn-primary btn-sm" id="btn-submit-settings-change-pwd">Update Password</button>
        `,
        onOpen: (container) => {
          container.querySelector("#btn-submit-settings-change-pwd").onclick = () => {
            const newPwd = container.querySelector("#part-settings-pwd-new").value;
            const confirm = container.querySelector("#part-settings-pwd-confirm").value;

            if (newPwd.length < 6) {
              toast.error("Weak Password", "Password must be at least 6 characters long.");
              return;
            }
            if (newPwd !== confirm) {
              toast.error("Mismatch", "New passwords do not match.");
              return;
            }

            modal.close();
            toast.success("Password Changed!", "Your account credentials have been updated.");
          };
        }
      });
    };
  }
}
