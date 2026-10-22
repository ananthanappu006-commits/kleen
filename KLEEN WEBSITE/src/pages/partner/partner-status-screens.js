/**
 * KLEEN — Partner Status Screens (/partner/account-suspended, /partner/account-deactivated, /partner/access-denied)
 */

import { auth } from "../../services/auth-service.js";
import { db } from "../../services/db-service.js";
import { toast } from "../../components/toast.js";
import { icon } from "../../components/icons.js";

export function renderPartnerAccountSuspendedPage() {
  const user = auth.getCurrentUser();
  const partner = user ? (db.getPartnerById(user.userId) || user) : null;
  const reason = partner?.rejectionReason || partner?.suspensionReason || "Administrative compliance review or service policy inquiry.";

  return `
    <div class="app-container" style="max-width: 540px; padding: 5rem 1rem 6rem; text-align: center;">
      <div class="solid-card" style="padding: 3rem 2rem; border-top: 5px solid var(--color-danger);">
        <div class="icon-box icon-box-lg icon-box-rose" style="margin: 0 auto 1.25rem;">
          ${icon('alert-octagon', { size: 36 })}
        </div>
        <span class="badge badge-danger" style="margin-bottom: 0.5rem;">Account Suspended</span>
        <h2 style="font-size: 1.75rem; margin-bottom: 0.5rem; font-weight: 800;">Partner Account Suspended</h2>
        <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; margin-bottom: 1.5rem;">
          Your KLEEN service partner account has been temporarily suspended. During suspension, online dispatch and booking acceptance are strictly paused.
        </p>

        <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 2rem; text-align: left; font-size: 0.875rem;">
          <strong style="color: #991B1B;">Reason:</strong>
          <p style="margin: 0.25rem 0 0.75rem; color: #B91C1C;">${reason}</p>
          <strong style="color: #991B1B;">Support Assistance:</strong>
          <ul style="padding-left: 1.25rem; margin: 0.25rem 0 0; color: #991B1B;">
            <li>Email: <a href="mailto:partner-support@kleen.in" style="font-weight: 700; color: #B91C1C;">partner-support@kleen.in</a></li>
            <li>Partner Helpdesk: <strong>1800-419-KLEEN</strong></li>
          </ul>
        </div>

        <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
          <a href="#/contact" class="btn btn-primary btn-md">CONTACT SUPPORT</a>
          <button type="button" class="btn btn-secondary btn-md btn-status-screen-logout">LOGOUT</button>
        </div>
      </div>
    </div>
  `;
}

export function renderPartnerAccountDeactivatedPage() {
  return `
    <div class="app-container" style="max-width: 540px; padding: 5rem 1rem 6rem; text-align: center;">
      <div class="solid-card" style="padding: 3rem 2rem; border-top: 5px solid #64748B;">
        <div class="icon-box icon-box-lg icon-box-slate" style="margin: 0 auto 1.25rem;">
          ${icon('lock', { size: 36 })}
        </div>
        <span class="badge badge-neutral" style="margin-bottom: 0.5rem;">Account Deactivated</span>
        <h2 style="font-size: 1.75rem; margin-bottom: 0.5rem; font-weight: 800;">Account Deactivated</h2>
        <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; margin-bottom: 2rem;">
          Your KLEEN partner account has been deactivated upon request. New booking dispatch is halted, while all your historical completed service and earnings records remain safely preserved.
        </p>

        <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 2rem; text-align: left; font-size: 0.875rem; color: var(--text-secondary);">
          <p style="margin: 0 0 0.5rem;">If you wish to reactivate your partner profile or have questions regarding your previous payout records:</p>
          <p style="margin: 0;">Contact Support: <strong>partner-support@kleen.in</strong></p>
        </div>

        <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap;">
          <a href="#/contact" class="btn btn-primary btn-md">CONTACT SUPPORT</a>
          <button type="button" class="btn btn-secondary btn-md btn-status-screen-logout">LOGOUT</button>
        </div>
      </div>
    </div>
  `;
}

export function renderPartnerAccessDeniedPage() {
  return `
    <div class="app-container" style="max-width: 520px; padding: 5rem 1rem 6rem; text-align: center;">
      <div class="solid-card" style="padding: 3rem 2rem;">
        <div class="icon-box icon-box-lg icon-box-amber" style="margin: 0 auto 1.25rem;">
          ${icon('shield', { size: 36 })}
        </div>
        <span class="badge badge-warning" style="margin-bottom: 0.5rem;">Access Restricted</span>
        <h2 style="font-size: 1.75rem; margin-bottom: 0.5rem; font-weight: 800;">Partner Portal Access Denied</h2>
        <p style="color: var(--text-secondary); font-size: 0.95rem; line-height: 1.6; margin-bottom: 2rem;">
          The page you requested is exclusively accessible to verified KLEEN Service Partners. You must be signed in with a partner account that has completed KYC onboarding.
        </p>

        <div style="display: flex; flex-direction: column; gap: 0.75rem; max-width: 320px; margin: 0 auto;">
          <a href="#/partner/login" class="btn btn-primary btn-md">Sign In as Service Partner</a>
          <a href="#/partner/register" class="btn btn-secondary btn-md">Register as New Partner</a>
          <a href="#/" class="btn btn-glass btn-sm" style="margin-top: 0.5rem;">← Return to KLEEN Home</a>
        </div>
      </div>
    </div>
  `;
}

export function attachPartnerStatusScreensEvents() {
  document.querySelectorAll(".btn-status-screen-logout").forEach(btn => {
    btn.onclick = () => {
      auth.logout();
      toast.info("Signed Out", "You have been signed out.");
      window.location.hash = "#/partner/login";
    };
  });
}
