/**
 * KLEEN — Partner KYC Status Page (/partner/kyc/status)
 * Visual status tracker for NOT_STARTED, SUBMITTED, UNDER_REVIEW, APPROVED, REJECTED, SUSPENDED
 * Aesthetic, premium executive design with full partner navigation and ergonomic button layouts.
 */

import { auth } from "../../services/auth-service.js";
import { db } from "../../services/db-service.js";
import { modal } from "../../components/modal.js";
import { toast } from "../../components/toast.js";
import { icon } from "../../components/icons.js";
import { renderPartnerHeader, renderPartnerSidebar, renderPartnerMobileBottomNav, attachPartnerNavEvents } from "./partner-nav.js";

export function renderPartnerKycStatusPage() {
  const user = auth.getCurrentUser();
  if (!user || user.role !== "partner") {
    return `
      <div class="app-container" style="max-width: 480px; padding: 4rem 1rem 6rem; text-align: center;">
        <div class="solid-card" style="padding: 3rem 2rem; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.04); border: 1px solid #E5E7EB;">
          <div class="icon-box icon-box-lg icon-box-slate" style="margin: 0 auto 1.25rem; width: 56px; height: 56px; border-radius: 16px; background: #F3F4F6; display: flex; align-items: center; justify-content: center;">
            ${icon('lock', { size: 28, stroke: '#4B5563' })}
          </div>
          <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin: 0 0 0.5rem;">Partner Sign In Required</h2>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0 0 1.5rem; line-height: 1.5;">
            Please sign in with your registered partner credentials to view your verification audit status.
          </p>
          <a href="#/partner/login" class="btn btn-primary btn-md" style="font-weight: 700; width: 100%; border-radius: 10px;">Partner Login</a>
        </div>
      </div>
    `;
  }

  const partnerKey = user.partnerId || user.userId;
  const partner = db.getPartnerById(partnerKey) || db.getPartnerById(user.userId) || user;
  const kyc = db.getPartnerKyc(partnerKey) || db.getPartnerKyc(user.userId) || {};
  const status = partner.kycStatus || kyc.status || "NOT_STARTED";

  const isApproved = status === "APPROVED";
  const isPending = status === "SUBMITTED" || status === "UNDER_REVIEW";
  const isRejected = status === "REJECTED";
  const isSuspended = status === "SUSPENDED";
  const isNotStarted = status === "NOT_STARTED" || !status;

  // Stepper state calculation
  let activeStep = 1;
  if (isPending) activeStep = 2;
  if (isApproved) activeStep = 3;

  const submittedDate = partner.submittedAt || kyc.submittedAt;
  const formattedSubmission = submittedDate 
    ? new Date(submittedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) 
    : "Recently Submitted";

  const approvedDate = partner.approvedAt || kyc.approvedAt;
  const formattedApproval = approvedDate 
    ? new Date(approvedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) 
    : new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return `
    <div class="partner-layout">
      ${renderPartnerSidebar("/partner/kyc/status")}

      <div class="partner-main-content">
        ${renderPartnerHeader("/partner/kyc/status", partner)}

        <div class="partner-dashboard-body" style="padding: 1.5rem 1rem 5rem; max-width: 920px; margin: 0 auto;">
          
          <!-- Header Banner -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
                <span class="badge ${isApproved ? 'badge-success' : (isRejected ? 'badge-danger' : 'badge-warning')}" style="font-size: 0.7rem; letter-spacing: 0.05em; text-transform: uppercase;">
                  ${status.replace('_', ' ')}
                </span>
                <span style="font-size: 0.75rem; color: var(--text-muted);">Fleet Compliance & Audit</span>
              </div>
              <h2 style="font-size: 1.65rem; margin: 0; font-weight: 800; color: var(--text-primary);">KYC Verification Status</h2>
              <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0.25rem 0 0;">
                Official government compliance, police background records, and identity auditing ledger.
              </p>
            </div>

            <div>
              <button type="button" id="btn-refresh-kyc-status" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 0.4rem; font-weight: 600; border-radius: 8px;">
                ${icon('refresh-cw', { size: 13 })} Refresh Live Status
              </button>
            </div>
          </div>

          <!-- Modern Sleek Stepper (if in verification cycle) -->
          ${!isNotStarted && !isSuspended ? `
            <div class="solid-card" style="padding: 1.5rem 1.75rem; margin-bottom: 1.75rem; border-radius: 14px; background: #FFFFFF; border: 1px solid #E5E7EB; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
              <div style="display: flex; justify-content: space-between; position: relative;">
                
                <!-- Connector Line -->
                <div style="position: absolute; top: 18px; left: 10%; right: 10%; height: 3px; background: #E5E7EB; z-index: 1;">
                  <div style="height: 100%; width: ${activeStep === 1 ? '15%' : (activeStep === 2 ? '50%' : '100%')}; background: var(--brand-emerald); transition: width 0.4s ease;"></div>
                </div>

                <!-- Step 1 -->
                <div style="position: relative; z-index: 2; text-align: center; flex: 1;">
                  <div style="width: 36px; height: 36px; border-radius: 50%; margin: 0 auto 0.5rem; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; background: ${activeStep >= 1 ? 'var(--brand-emerald)' : '#E5E7EB'}; color: #FFF; box-shadow: ${activeStep === 1 ? '0 0 0 4px rgba(5,150,105,0.15)' : 'none'};">
                    ${activeStep > 1 ? icon('check', { size: 15, stroke: '#FFF' }) : '1'}
                  </div>
                  <div style="font-size: 0.8rem; font-weight: 700; color: ${activeStep >= 1 ? 'var(--text-primary)' : 'var(--text-muted)'};">Documents Submitted</div>
                  <div style="font-size: 0.7rem; color: var(--text-muted);">Aadhaar, Address & Photo</div>
                </div>

                <!-- Step 2 -->
                <div style="position: relative; z-index: 2; text-align: center; flex: 1;">
                  <div style="width: 36px; height: 36px; border-radius: 50%; margin: 0 auto 0.5rem; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; background: ${activeStep >= 2 ? (isRejected ? '#DC2626' : 'var(--brand-emerald)') : '#E5E7EB'}; color: #FFF; box-shadow: ${activeStep === 2 ? '0 0 0 4px rgba(245,158,11,0.2)' : 'none'};">
                    ${activeStep > 2 ? icon('check', { size: 15, stroke: '#FFF' }) : (isRejected ? icon('x', { size: 15, stroke: '#FFF' }) : '2')}
                  </div>
                  <div style="font-size: 0.8rem; font-weight: 700; color: ${activeStep >= 2 ? 'var(--text-primary)' : 'var(--text-muted)'};">Compliance Audit</div>
                  <div style="font-size: 0.7rem; color: var(--text-muted);">${isPending ? 'Under Review by Admin' : (isRejected ? 'Action Required' : 'Audit Passed')}</div>
                </div>

                <!-- Step 3 -->
                <div style="position: relative; z-index: 2; text-align: center; flex: 1;">
                  <div style="width: 36px; height: 36px; border-radius: 50%; margin: 0 auto 0.5rem; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.85rem; background: ${activeStep === 3 ? 'var(--brand-emerald)' : '#E5E7EB'}; color: ${activeStep === 3 ? '#FFF' : 'var(--text-muted)'};">
                    ${activeStep === 3 ? icon('check', { size: 15, stroke: '#FFF' }) : '3'}
                  </div>
                  <div style="font-size: 0.8rem; font-weight: 700; color: ${activeStep === 3 ? 'var(--brand-emerald-dark)' : 'var(--text-muted)'};">Fleet Activation</div>
                  <div style="font-size: 0.7rem; color: var(--text-muted);">${isApproved ? 'Ready for Bookings' : 'Locked until approval'}</div>
                </div>

              </div>
            </div>
          ` : ''}

          <!-- ===================================================================== -->
          <!-- 1. APPROVED STATE: LUXURY EMERALD CARD -->
          <!-- ===================================================================== -->
          ${isApproved ? `
            <div class="solid-card" style="padding: 2.25rem 2rem; border-radius: 18px; background: linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 80%); border: 1px solid #A7F3D0; box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.08); margin-bottom: 1.75rem;">
              
              <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                <div style="width: 60px; height: 60px; border-radius: 16px; background: #D1FAE5; border: 2px solid #34D399; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 14px rgba(5,150,105,0.2);">
                  ${icon('shield-check', { size: 32, stroke: '#059669' })}
                </div>
                <div>
                  <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <h3 style="font-size: 1.35rem; margin: 0; font-weight: 800; color: #065F46;">Verification Approved & Certified</h3>
                    <span class="badge badge-success" style="font-size: 0.7rem; padding: 0.25rem 0.6rem;">FLEET ACTIVE</span>
                  </div>
                  <p style="color: #047857; font-size: 0.9rem; margin: 0.35rem 0 0; line-height: 1.5;">
                    Your government identification documents and background records have been verified and approved by KLEEN administration. You are authorized to go ONLINE and accept service bookings across Kerala.
                  </p>
                </div>
              </div>

              <!-- Metadata Grid -->
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; background: #FFFFFF; border: 1px solid #D1FAE5; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.75rem;">
                <div>
                  <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Approval Date</span>
                  <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin-top: 0.2rem;">${formattedApproval}</div>
                </div>
                <div>
                  <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Account Status</span>
                  <div style="font-size: 0.95rem; font-weight: 800; color: #059669; margin-top: 0.2rem; display: flex; align-items: center; gap: 0.35rem;">
                    <span style="width: 8px; height: 8px; border-radius: 50%; background: #10B981;"></span> ACTIVE
                  </div>
                </div>
                <div>
                  <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Dispatch Rights</span>
                  <div style="font-size: 0.95rem; font-weight: 700; color: #059669; margin-top: 0.2rem;">Eligible for Live Bookings</div>
                </div>
                <div>
                  <span style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Verified Partner ID</span>
                  <div style="font-size: 0.95rem; font-weight: 700; color: var(--text-primary); margin-top: 0.2rem;"><code>${partnerKey}</code></div>
                </div>
              </div>

              <!-- Unlocked Capabilities Banner -->
              <div style="background: rgba(255,255,255,0.7); border: 1px solid #A7F3D0; border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 2rem;">
                <div style="font-size: 0.75rem; font-weight: 800; color: #065F46; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.6rem;">
                  Unlocked Partner Privileges
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem; font-size: 0.825rem; color: #047857;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    ${icon('check', { size: 14, stroke: '#059669' })} Guaranteed 80% Partner Net Share
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    ${icon('check', { size: 14, stroke: '#059669' })} On-Demand Quick Settle & Weekly Payouts
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    ${icon('check', { size: 14, stroke: '#059669' })} Flexible Shift Gigs & Self-Scheduling
                  </div>
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    ${icon('check', { size: 14, stroke: '#059669' })} Comprehensive Damage Protection Coverage
                  </div>
                </div>
              </div>

              <!-- Perfectly Arranged Action Buttons -->
              <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                <a href="#/partner" class="btn btn-primary btn-md" style="display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 800; background: linear-gradient(135deg, #059669 0%, #047857 100%); box-shadow: 0 4px 14px rgba(5, 150, 105, 0.35); border-radius: 10px; padding: 0.75rem 1.5rem;">
                  ${icon('home', { size: 16 })} Go to Partner Hub ${icon('arrow-right', { size: 14 })}
                </a>
                <a href="#/partner/earnings" class="btn btn-secondary btn-md" style="display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 700; border-radius: 10px; padding: 0.75rem 1.25rem;">
                  ${icon('credit-card', { size: 16 })} Earnings & Payouts
                </a>
                <button type="button" id="btn-view-submitted-info" class="btn btn-glass btn-md" style="display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 600; border-radius: 10px; padding: 0.75rem 1.25rem;">
                  ${icon('file-text', { size: 16 })} View Verified Documents
                </button>
              </div>

            </div>
          ` : ''}

          <!-- ===================================================================== -->
          <!-- 2. UNDER REVIEW / SUBMITTED STATE: EXECUTIVE AMBER CARD -->
          <!-- ===================================================================== -->
          ${isPending ? `
            <div class="solid-card" style="padding: 2.25rem 2rem; border-radius: 18px; background: linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 80%); border: 1px solid #FDE68A; box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.08); margin-bottom: 1.75rem;">
              
              <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                <div style="width: 60px; height: 60px; border-radius: 16px; background: #FEF3C7; border: 2px solid #FBBF24; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 14px rgba(245,158,11,0.2);">
                  ${icon('clock', { size: 30, stroke: '#D97706' })}
                </div>
                <div>
                  <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <h3 style="font-size: 1.35rem; margin: 0; font-weight: 800; color: #92400E;">Verification in Progress</h3>
                    <span class="badge badge-warning" style="font-size: 0.7rem; padding: 0.25rem 0.6rem;">ADMIN AUDIT QUEUE</span>
                  </div>
                  <p style="color: #B45309; font-size: 0.9rem; margin: 0.35rem 0 0; line-height: 1.5;">
                    Your uploaded Aadhaar ID, proof of address, and photograph are currently being reviewed by the KLEEN verification desk. Verification typically completes within <strong>2 to 4 business hours</strong>.
                  </p>
                </div>
              </div>

              <!-- Audit Checklist Breakdown -->
              <div style="background: #FFFFFF; border: 1px solid #FDE68A; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.75rem;">
                <div style="font-size: 0.75rem; font-weight: 800; color: #92400E; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.85rem;">
                  Submitted Document Verification Status
                </div>
                <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.85rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.6rem; border-bottom: 1px solid #F3F4F6;">
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                      ${icon('shield-check', { size: 16, stroke: '#059669' })}
                      <span>Government ID Proof (Aadhaar / Voter ID / Passport)</span>
                    </div>
                    <span class="badge badge-warning" style="font-size: 0.65rem;">IN AUDIT</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.6rem; border-bottom: 1px solid #F3F4F6;">
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                      ${icon('shield-check', { size: 16, stroke: '#059669' })}
                      <span>Residential Address Verification</span>
                    </div>
                    <span class="badge badge-warning" style="font-size: 0.65rem;">IN AUDIT</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 0.6rem;">
                      ${icon('shield-check', { size: 16, stroke: '#059669' })}
                      <span>Partner Profile Portrait Photo</span>
                    </div>
                    <span class="badge badge-warning" style="font-size: 0.65rem;">IN AUDIT</span>
                  </div>
                </div>
              </div>

              <!-- Metadata info -->
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem; font-size: 0.8rem; color: #92400E; background: rgba(254, 243, 199, 0.4); border-radius: 8px; padding: 0.75rem 1rem; margin-bottom: 2rem;">
                <div>Submitted At: <strong>${formattedSubmission}</strong></div>
                <div>Queue ID: <code>${partnerKey}</code></div>
                <div>Fleet Area: <strong>${partner.district || partner.city || 'Kerala'}</strong></div>
              </div>

              <!-- Well Arranged Action Buttons -->
              <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                <button type="button" id="btn-view-submitted-info" class="btn btn-primary btn-md" style="display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 700; border-radius: 10px; padding: 0.75rem 1.4rem;">
                  ${icon('file-text', { size: 16 })} View Submitted Documents
                </button>
                <button type="button" id="btn-refresh-kyc-status" class="btn btn-secondary btn-md" style="display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 700; border-radius: 10px; padding: 0.75rem 1.4rem;">
                  ${icon('refresh-cw', { size: 16 })} Refresh Status
                </button>
                <a href="#/partner/support" class="btn btn-glass btn-md" style="display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 600; border-radius: 10px; padding: 0.75rem 1.25rem;">
                  ${icon('help-circle', { size: 16 })} Partner Helpdesk
                </a>
              </div>

            </div>
          ` : ''}

          <!-- ===================================================================== -->
          <!-- 3. REJECTED STATE: HIGH CONTRAST ALERT CARD -->
          <!-- ===================================================================== -->
          ${isRejected ? `
            <div class="solid-card" style="padding: 2.25rem 2rem; border-radius: 18px; background: linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 80%); border: 1px solid #FECACA; box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.08); margin-bottom: 1.75rem;">
              
              <div style="display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.5rem; flex-wrap: wrap;">
                <div style="width: 60px; height: 60px; border-radius: 16px; background: #FEE2E2; border: 2px solid #F87171; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 14px rgba(239,68,68,0.2);">
                  ${icon('alert-triangle', { size: 30, stroke: '#DC2626' })}
                </div>
                <div>
                  <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <h3 style="font-size: 1.35rem; margin: 0; font-weight: 800; color: #991B1B;">Verification Revision Required</h3>
                    <span class="badge badge-danger" style="font-size: 0.7rem; padding: 0.25rem 0.6rem;">DOCUMENTS REJECTED</span>
                  </div>
                  <p style="color: #B91C1C; font-size: 0.9rem; margin: 0.35rem 0 0; line-height: 1.5;">
                    Your verification documents could not be approved due to compliance criteria. Please review the administrative feedback below and upload fresh, legible documents.
                  </p>
                </div>
              </div>

              <!-- Rejection Notice Box -->
              <div style="background: #FFFFFF; border: 1px solid #FCA5A5; border-left: 5px solid #DC2626; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.75rem;">
                <div style="font-size: 0.75rem; font-weight: 800; color: #991B1B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.4rem;">
                  Admin Reviewer Feedback
                </div>
                <p style="font-size: 0.95rem; color: #7F1D1D; margin: 0; font-weight: 600; line-height: 1.5;">
                  "${partner.rejectionReason || kyc.rejectionReason || "One or more uploaded document images were blurry or incomplete. Please upload clear, original documents."}"
                </p>
              </div>

              <!-- Instructions -->
              <div style="background: #FFF5F5; border-radius: 10px; padding: 1rem 1.25rem; font-size: 0.85rem; color: #991B1B; margin-bottom: 2rem;">
                <strong>Next Steps to Get Approved:</strong>
                <ul style="margin: 0.4rem 0 0; padding-left: 1.25rem; line-height: 1.5;">
                  <li>Take high-resolution, un-cropped photos in good daylight.</li>
                  <li>Ensure all four corners of your Aadhaar / Government ID are visible.</li>
                  <li>Utility bill or bank passbook for address proof must be under 3 months old.</li>
                </ul>
              </div>

              <!-- Well Arranged Action Buttons -->
              <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                <a href="#/partner/kyc" class="btn btn-danger btn-md" style="display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 800; border-radius: 10px; padding: 0.75rem 1.5rem; background: #DC2626; box-shadow: 0 4px 14px rgba(220,38,38,0.3);">
                  ${icon('upload', { size: 16 })} Resubmit Verification Documents
                </a>
                <button type="button" id="btn-view-submitted-info" class="btn btn-secondary btn-md" style="display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 700; border-radius: 10px; padding: 0.75rem 1.25rem;">
                  ${icon('file-text', { size: 16 })} View Prior Submission
                </button>
                <a href="#/partner/support" class="btn btn-glass btn-md" style="display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 600; border-radius: 10px; padding: 0.75rem 1.25rem;">
                  ${icon('help-circle', { size: 16 })} Contact Support
                </a>
              </div>

            </div>
          ` : ''}

          <!-- ===================================================================== -->
          <!-- 4. NOT STARTED STATE: ONBOARDING CARD -->
          <!-- ===================================================================== -->
          ${isNotStarted ? `
            <div class="solid-card" style="padding: 2.5rem 2rem; border-radius: 18px; background: #FFFFFF; border: 1px solid #E5E7EB; box-shadow: 0 8px 24px rgba(0,0,0,0.04); text-align: center;">
              <div style="width: 64px; height: 64px; border-radius: 20px; background: #ECFDF5; border: 2px solid #A7F3D0; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem;">
                ${icon('shield', { size: 32, stroke: '#059669' })}
              </div>
              <h3 style="font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin: 0 0 0.5rem;">Begin Your KYC Onboarding</h3>
              <p style="color: var(--text-muted); font-size: 0.9rem; max-width: 520px; margin: 0 auto 1.75rem; line-height: 1.6;">
                To ensure trust and customer safety on the KLEEN platform, all service professionals must submit their government ID, address proof, and portrait photograph before taking jobs.
              </p>

              <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                <a href="#/partner/kyc" class="btn btn-primary btn-md" style="display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 800; border-radius: 10px; padding: 0.75rem 1.75rem;">
                  ${icon('shield-check', { size: 16 })} Start KYC Verification
                </a>
                <a href="#/partner" class="btn btn-secondary btn-md" style="display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 700; border-radius: 10px; padding: 0.75rem 1.4rem;">
                  Partner Home
                </a>
              </div>
            </div>
          ` : ''}

          <!-- ===================================================================== -->
          <!-- 5. SUSPENDED STATE -->
          <!-- ===================================================================== -->
          ${isSuspended ? `
            <div class="solid-card" style="padding: 2.5rem 2rem; border-radius: 18px; background: #FEF2F2; border: 1px solid #FECACA; text-align: center;">
              <div style="width: 64px; height: 64px; border-radius: 20px; background: #FEE2E2; border: 2px solid #F87171; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem;">
                ${icon('alert-octagon', { size: 32, stroke: '#DC2626' })}
              </div>
              <h3 style="font-size: 1.4rem; font-weight: 800; color: #991B1B; margin: 0 0 0.5rem;">Partner Account Suspended</h3>
              <p style="color: #B91C1C; font-size: 0.9rem; max-width: 520px; margin: 0 auto 1.75rem; line-height: 1.6;">
                This partner account has been temporarily suspended by KLEEN administration due to security or compliance auditing. Please connect with partner support for formal dispute resolution.
              </p>
              <a href="#/partner/support" class="btn btn-secondary btn-md" style="display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 700; border-radius: 10px;">
                Contact Partner Support
              </a>
            </div>
          ` : ''}

        </div>
      </div>

      ${renderPartnerMobileBottomNav("/partner/kyc/status")}
    </div>
  `;
}

export function attachPartnerKycStatusEvents() {
  attachPartnerNavEvents();

  const user = auth.getCurrentUser();
  if (!user) return;

  const partnerKey = user.partnerId || user.userId;

  // View Submitted Information Audit Modal
  const viewInfoBtn = document.getElementById("btn-view-submitted-info");
  if (viewInfoBtn) {
    viewInfoBtn.onclick = () => {
      const partner = db.getPartnerById(partnerKey) || db.getPartnerById(user.userId) || user;
      const kyc = db.getPartnerKyc(partnerKey) || db.getPartnerKyc(user.userId) || {};

      const identityDoc = kyc.identityDocument || (partner.idProofUrl ? { fileName: "Aadhaar_ID_Proof.jpg", fileUrl: partner.idProofUrl } : null);
      const addressDoc = kyc.addressDocument || (partner.addressProofUrl ? { fileName: "Address_Proof.jpg", fileUrl: partner.addressProofUrl } : null);
      const photoDoc = kyc.profilePhoto || (partner.profileImage ? { fileName: "Profile_Photo.jpg", fileUrl: partner.profileImage } : null);

      modal.open({
        title: "Submitted KYC Verification Details",
        maxWidth: "540px",
        bodyHtml: `
          <div style="display: flex; flex-direction: column; gap: 1rem; font-size: 0.875rem;">
            
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1rem;">
              <div style="font-weight: 800; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">
                Partner Profile Identification
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                <div>
                  <span style="color: var(--text-muted); font-size: 0.75rem;">Full Name:</span><br>
                  <strong style="color: var(--text-primary);">${kyc.fullName || partner.fullName || 'Not recorded'}</strong>
                </div>
                <div>
                  <span style="color: var(--text-muted); font-size: 0.75rem;">Partner ID:</span><br>
                  <code style="color: var(--text-primary);">${partnerKey}</code>
                </div>
                <div>
                  <span style="color: var(--text-muted); font-size: 0.75rem;">Phone Number:</span><br>
                  <strong>${kyc.phone || partner.phone || 'N/A'}</strong>
                </div>
                <div>
                  <span style="color: var(--text-muted); font-size: 0.75rem;">Email:</span><br>
                  <strong>${kyc.email || partner.email || 'N/A'}</strong>
                </div>
              </div>
            </div>

            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 1rem;">
              <div style="font-weight: 800; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">
                Registered Address & Location
              </div>
              <p style="margin: 0; font-size: 0.85rem; color: var(--text-primary); line-height: 1.5;">
                ${kyc.address || partner.address || 'Address details recorded with KLEEN'}<br>
                <strong>${partner.city || partner.district || 'Kerala'}</strong>, Pin: ${partner.pinCode || '695001'}
              </p>
            </div>

            <div>
              <div style="font-weight: 800; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">
                Verification Assets on File
              </div>
              <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; padding: 0.65rem 0.85rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    ${icon('file-text', { size: 16, stroke: '#059669' })}
                    <span>Government ID Document</span>
                  </div>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">${identityDoc ? identityDoc.fileName : 'Aadhaar Card on File'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; padding: 0.65rem 0.85rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    ${icon('home', { size: 16, stroke: '#059669' })}
                    <span>Proof of Address</span>
                  </div>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">${addressDoc ? addressDoc.fileName : 'Utility Bill / Passbook'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 8px; padding: 0.65rem 0.85rem;">
                  <div style="display: flex; align-items: center; gap: 0.5rem;">
                    ${icon('user', { size: 16, stroke: '#059669' })}
                    <span>Profile Photo / Selfie</span>
                  </div>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">${photoDoc ? photoDoc.fileName : 'Passport Photo'}</span>
                </div>
              </div>
            </div>

          </div>
        `,
        footerHtml: `
          <button type="button" class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()" style="border-radius: 8px;">Close Summary</button>
        `
      });
    };
  }

  // Refresh status button
  const refreshBtns = document.querySelectorAll("#btn-refresh-kyc-status");
  refreshBtns.forEach(btn => {
    btn.onclick = () => {
      toast.info("Status Refreshed", "Loaded latest KYC compliance status.");
      const container = document.getElementById("page-container");
      if (container) {
        container.innerHTML = renderPartnerKycStatusPage();
        attachPartnerKycStatusEvents();
      }
    };
  });
}
