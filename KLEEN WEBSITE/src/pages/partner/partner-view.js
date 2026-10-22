/**
 * KLEEN — Partner / Maid Interface
 * KYC onboarding wizard, approval status gating, live job dispatch, and earnings ledger.
 */

import { db } from "../../services/db-service.js";
import { auth } from "../../services/auth-service.js";
import { storage } from "../../services/storage-service.js";
import { modal } from "../../components/modal.js";
import { toast } from "../../components/toast.js";
import { icon } from "../../components/icons.js";
import { renderDistrictOptions, DEFAULT_STATE, DEFAULT_DISTRICT } from "../../config/kerala-districts.js";

export function renderPartnerView() {
  const user = auth.getCurrentUser();
  if (!user || user.role !== "partner") {
    return `
      <div class="app-container" style="max-width: 500px; padding: 4rem 1rem 6rem; text-align: center;">
        <div class="solid-card" style="padding: 3rem 2rem;">
          <div style="display: flex; justify-content: center; margin-bottom: 1rem;">
            <div class="icon-box icon-box-lg icon-box-emerald">
              ${icon('sparkles', { size: 28 })}
            </div>
          </div>
          <h2>Partner Portal</h2>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0.5rem 0 1.5rem;">Please sign in with your partner account or register to start working with KLEEN.</p>
          <div style="display: flex; gap: 0.75rem; justify-content: center;">
            <a href="#/login" class="btn btn-primary btn-md">Partner Sign In</a>
            <a href="#/partner/register" class="btn btn-secondary btn-md">Join as Partner</a>
          </div>
        </div>
      </div>
    `;
  }

  const partner = db.getPartnerById(user.userId) || user;
  const kycStatus = (partner && partner.kycStatus) || "NOT_STARTED";

  // STRICT GATING: Only APPROVED partners get active dashboard
  if (kycStatus !== "APPROVED") {
    return renderKycGatingView(partner, kycStatus);
  }

  return renderActivePartnerDashboard(partner);
}

/**
 * Gating view for partners whose KYC is NOT approved yet
 */
function renderKycGatingView(partner, status) {
  let statusBannerHtml = "";

  if (status === "UNDER_REVIEW" || status === "SUBMITTED") {
    statusBannerHtml = `
      <div class="kyc-status-alert pending animate-slide-up">
        <div class="icon-box icon-box-md icon-box-amber" style="flex-shrink: 0;">
          ${icon('clock', { size: 24 })}
        </div>
        <div>
          <h4 style="color: var(--color-warning); font-size: 1.15rem; margin-bottom: 0.35rem;">KYC Verification Under Review</h4>
          <p style="color: #92400E; font-size: 0.9rem; line-height: 1.5;">
            We have safely received your government identity and address documents. Our compliance team is currently reviewing your application. Verification usually takes <strong>under 24 hours</strong>.
          </p>
          <div style="margin-top: 1rem; display: flex; gap: 0.75rem;">
            <button class="btn btn-secondary btn-sm" onclick="window.location.reload()">Refresh Status</button>
            <button class="btn btn-glass btn-sm" id="btn-quick-admin-approve" style="color: var(--brand-emerald-dark); font-weight: bold; display: inline-flex; align-items: center; gap: 0.4rem;">
              ${icon('zap', { size: 14 })}
              <span>Quick-Approve via Admin (Testing)</span>
            </button>
          </div>
        </div>
      </div>
    `;
  } else if (status === "REJECTED") {
    statusBannerHtml = `
      <div class="kyc-status-alert rejected animate-slide-up">
        <div class="icon-box icon-box-md icon-box-rose" style="flex-shrink: 0;">
          ${icon('alert-triangle', { size: 24 })}
        </div>
        <div>
          <h4 style="color: var(--color-danger); font-size: 1.15rem; margin-bottom: 0.35rem;">KYC Application Requires Correction</h4>
          <p style="color: #991B1B; font-size: 0.9rem; line-height: 1.5;">
            <strong>Admin Reason:</strong> ${partner.rejectionReason || "Uploaded identity card image was blurry or unreadable. Please submit a high-resolution photo."}
          </p>
          <button id="btn-restart-kyc" class="btn btn-primary btn-sm" style="margin-top: 1rem;">
            Resubmit Documents
          </button>
        </div>
      </div>
    `;
  } else if (status === "SUSPENDED") {
    statusBannerHtml = `
      <div class="kyc-status-alert rejected">
        <div class="icon-box icon-box-md icon-box-rose" style="flex-shrink: 0;">
          ${icon('slash', { size: 24 })}
        </div>
        <div>
          <h4 style="color: var(--color-danger); font-size: 1.15rem; margin-bottom: 0.35rem;">Partner Account Suspended</h4>
          <p style="color: #991B1B; font-size: 0.9rem;">
            This partner account is temporarily deactivated by administrator review. Please contact KLEEN Partner Support at partner@kleen.in.
          </p>
        </div>
      </div>
    `;
  }

  return `
    <div class="app-container">
      <div class="kyc-container animate-fade-in">
        <div class="kyc-header">
          <h2>KLEEN Partner Verification</h2>
          <p>Complete mandatory 4-step KYC verification to unlock job requests & payouts.</p>
        </div>

        <div class="kyc-stepper">
          <div class="kyc-step ${status === 'NOT_STARTED' ? 'active' : 'done'}">
            <span class="kyc-step-num">1</span>
            <span>Personal</span>
          </div>
          <div class="kyc-step ${status === 'NOT_STARTED' ? '' : 'done'}">
            <span class="kyc-step-num">2</span>
            <span>Address</span>
          </div>
          <div class="kyc-step ${status === 'NOT_STARTED' ? '' : 'done'}">
            <span class="kyc-step-num">3</span>
            <span>Documents</span>
          </div>
          <div class="kyc-step ${status === 'UNDER_REVIEW' || status === 'SUBMITTED' ? 'active' : ''}">
            <span class="kyc-step-num">4</span>
            <span>Admin Review</span>
          </div>
        </div>

        <div class="kyc-body">
          ${statusBannerHtml}

          ${status === 'NOT_STARTED' || status === 'REJECTED' ? `
            <form id="kyc-submission-form">
              <h3 style="margin-bottom: 1.25rem;">Submit Partner Information</h3>
              
              <div class="form-group">
                <label class="form-label">Full Legal Name (as on Government ID)</label>
                <input type="text" id="kyc-name" class="form-input" value="${partner ? partner.fullName : ''}" required>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label class="form-label">Date of Birth</label>
                  <input type="date" id="kyc-dob" class="form-input" value="${partner ? partner.dateOfBirth || '1992-05-15' : '1992-05-15'}" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Gender</label>
                  <select id="kyc-gender" class="form-select">
                    <option>Female</option>
                    <option>Male</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Residential Address</label>
                <input type="text" id="kyc-address" class="form-input" value="${partner ? partner.address || '' : ''}" placeholder="Street, Door No, Locality" required>
              </div>

              <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label class="form-label">District (Kerala)</label>
                  <select id="kyc-district" class="form-select" required>
                    ${renderDistrictOptions(partner ? (partner.district || partner.city) : DEFAULT_DISTRICT)}
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">State</label>
                  <input type="text" id="kyc-state" class="form-input" value="${DEFAULT_STATE}" readonly style="background: #F1F5F9; cursor: not-allowed;">
                </div>
                <div class="form-group">
                  <label class="form-label">PIN Code</label>
                  <input type="text" id="kyc-pin" class="form-input" value="${partner ? (partner.pinCode || partner.pin || '695001') : '695001'}" required>
                </div>
              </div>

              <h4 style="margin: 1.5rem 0 1rem;">Required KYC Verification Documents</h4>

              <!-- Document 1: Govt Identity -->
              <div class="doc-upload-item">
                <div class="doc-info">
                  <h4>1. Government Identity (Aadhaar / PAN / Voter ID)</h4>
                  <p>Clear front & back image or PDF</p>
                </div>
                <div>
                  <input type="file" id="upload-doc-identity" accept="image/*,.pdf" style="display:none;">
                  <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('upload-doc-identity').click()">
                    Upload File
                  </button>
                  <span id="label-doc-identity" style="font-size:0.775rem; color:#15803D; margin-left:0.5rem;">aadhaar_verified.pdf</span>
                </div>
              </div>

              <!-- Document 2: Address Proof -->
              <div class="doc-upload-item">
                <div class="doc-info">
                  <h4>2. Address Proof (Electricity Bill / Rent Agreement)</h4>
                  <p>Dated within last 3 months</p>
                </div>
                <div>
                  <input type="file" id="upload-doc-address" accept="image/*,.pdf" style="display:none;">
                  <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('upload-doc-address').click()">
                    Upload File
                  </button>
                  <span id="label-doc-address" style="font-size:0.775rem; color:#15803D; margin-left:0.5rem;">bescom_bill.pdf</span>
                </div>
              </div>

              <!-- Document 3: Live Verification Selfie -->
              <div class="doc-upload-item">
                <div class="doc-info">
                  <h4>3. Live Verification Selfie Photo</h4>
                  <p>Clear front-facing passport photograph</p>
                </div>
                <div>
                  <input type="file" id="upload-doc-photo" accept="image/*" style="display:none;">
                  <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('upload-doc-photo').click()">
                    Take/Upload Photo
                  </button>
                  <span id="label-doc-photo" style="font-size:0.775rem; color:#15803D; margin-left:0.5rem;">selfie.jpg</span>
                </div>
              </div>

              <div style="margin: 1.5rem 0; display: flex; align-items: flex-start; gap: 0.65rem;">
                <input type="checkbox" id="kyc-declaration" checked style="margin-top: 4px;">
                <label for="kyc-declaration" style="font-size: 0.825rem; color: var(--text-secondary);">
                  I certify that all documents submitted are authentic. I agree to undergo mandatory police background verification and adhere to the KLEEN Partner Code of Conduct.
                </label>
              </div>

              <button type="submit" class="btn btn-primary btn-lg" style="width: 100%;">
                Submit Application for Verification
              </button>
            </form>
          ` : `
            <div style="text-align: center; padding: 2rem 1rem;">
              <p style="font-size: 0.95rem; color: var(--text-muted); max-width: 480px; margin: 0 auto;">
                Your documents are securely stored on Firebase Cloud Storage. Once approved by the administrator, you will immediately receive notification alerts and instant access to incoming jobs.
              </p>
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

/**
 * Full Partner Dashboard for APPROVED Partners
 */
function renderActivePartnerDashboard(partner) {
  const bookings = db.getBookings();

  // Find incoming requests for this partner (or open bookings needing partner)
  const incomingRequests = bookings.filter(b => 
    b.bookingStatus === "CONFIRMED" || 
    (b.bookingStatus === "PARTNER_REQUESTED" && b.partnerId === partner.userId)
  );

  // Find current job in progress by this partner
  const currentJob = bookings.find(b => 
    (b.partnerId === partner.userId || b.partnerId === partner.partnerId) &&
    ["PARTNER_ACCEPTED", "ON_THE_WAY", "ARRIVED", "SERVICE_STARTED"].includes(b.bookingStatus)
  );

  // Completed jobs
  const completedJobs = bookings.filter(b => 
    (b.partnerId === partner.userId || b.partnerId === partner.partnerId) &&
    b.bookingStatus === "SERVICE_COMPLETED"
  );

  return `
    <div class="app-container" style="padding: 2.5rem 1rem 5rem;">
      <!-- Header & Availability Switch -->
      <div class="partner-dash-header">
        <div class="partner-profile-summary">
          <img src="${partner.profileImage || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=140&q=80'}" class="partner-big-avatar">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <h2 style="font-size: 1.5rem; margin: 0;">${partner.fullName}</h2>
              <span class="badge badge-success">KYC APPROVED</span>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.2rem;">
              Specialist Maid Partner • 4.9 (${partner.totalRatings || 184} Reviews)
            </p>
          </div>
        </div>

        <div class="availability-toggle-box">
          <span style="font-size: 0.85rem; font-weight: 700; color: ${partner.isOnline ? 'var(--color-success)' : 'var(--text-muted)'};">
            ${partner.isOnline ? 'ONLINE (Ready for Jobs)' : (partner.kycStatus === 'APPROVED' ? 'OFFLINE' : 'OFFLINE (KYC Pending)')}
          </span>
          <label class="switch" style="${partner.kycStatus !== 'APPROVED' ? 'opacity: 0.6; cursor: not-allowed;' : ''}" title="${partner.kycStatus === 'APPROVED' ? 'Toggle availability' : 'Locked: Admin KYC approval required'}">
            <input type="checkbox" id="partner-availability-toggle" ${partner.isOnline ? 'checked' : ''} ${partner.kycStatus !== 'APPROVED' ? 'disabled' : ''}>
            <span class="slider"></span>
          </label>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="partner-stats-grid">
        <div class="partner-stat-card">
          <span class="price-label">Today's Earnings</span>
          <div class="stat-num" style="color: var(--brand-emerald-dark);">₹1,420</div>
          <span style="font-size: 0.775rem; color: #15803D;">80% Payout Share</span>
        </div>
        <div class="partner-stat-card">
          <span class="price-label">Total Lifetime Earnings</span>
          <div class="stat-num">₹${partner.totalEarnings || 82450}</div>
          <span style="font-size: 0.775rem; color: var(--text-muted);">Direct Bank Settlement</span>
        </div>
        <div class="partner-stat-card">
          <span class="price-label">Completed Jobs</span>
          <div class="stat-num">${partner.totalCompletedJobs || 342}</div>
          <span style="font-size: 0.775rem; color: #15803D;">100% On-Time Arrival</span>
        </div>
        <div class="partner-stat-card">
          <span class="price-label">Partner Rating</span>
          <div class="stat-num">${partner.rating || 4.9}</div>
          <span style="font-size: 0.775rem; color: var(--text-muted);">Top Tier Professional</span>
        </div>
      </div>

      <!-- Live Job Alert (if any incoming booking waiting) -->
      ${incomingRequests.length > 0 && !currentJob ? `
        <div class="live-booking-alert-card animate-slide-up">
          <div class="live-badge">
            <div class="live-dot"></div>
            <span>NEW BOOKING REQUEST</span>
          </div>

          <h3 style="font-size: 1.35rem; margin-bottom: 0.35rem;">${incomingRequests[0].serviceName}</h3>
          <p style="font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 1.25rem;">
            Location: <strong>${incomingRequests[0].serviceAddress}</strong><br>
            Scheduled for: <strong>${incomingRequests[0].bookingDate} at ${incomingRequests[0].startTime}</strong> (${incomingRequests[0].duration})
          </p>

          <div style="background: var(--brand-sage-lightest); border: 1px solid var(--brand-sage-border); padding: 1rem; border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <div>
              <span class="price-label">Estimated Net Earning (80%)</span>
              <div style="font-size: 1.4rem; font-weight: 800; color: var(--brand-emerald-dark);">
                ₹${Math.round(incomingRequests[0].totalAmount * 0.8)}
              </div>
            </div>
            <span class="badge badge-success">Customer Paid via Razorpay</span>
          </div>

          <div style="display: flex; gap: 1rem;">
            <button class="btn btn-primary btn-md btn-accept-job" data-id="${incomingRequests[0].bookingId}" style="flex: 1;">
              Accept Booking
            </button>
            <button class="btn btn-secondary btn-md btn-reject-job" data-id="${incomingRequests[0].bookingId}">
              Decline
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Current Ongoing Job Execution Panel -->
      ${currentJob ? `
        <div class="job-execution-card animate-slide-up">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem;">
            <div>
              <span class="badge badge-info" style="margin-bottom: 0.35rem;">JOB IN PROGRESS</span>
              <h3 style="font-size: 1.4rem;">${currentJob.serviceName}</h3>
              <p style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.2rem;">
                Customer: <strong>${currentJob.customerName}</strong> (${currentJob.customerPhone})<br>
                Address: <strong>${currentJob.serviceAddress}</strong>
              </p>
            </div>
            <div style="text-align: right;">
              <span class="price-label">Current Status</span>
              <div class="badge badge-success" style="font-size: 0.85rem; margin-top: 0.25rem;">
                ${currentJob.bookingStatus.replace(/_/g, ' ')}
              </div>
            </div>
          </div>

          <!-- Action Stepper -->
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.5rem;">
            Update job status as you arrive and finish service:
          </p>

          <div class="job-actions-toolbar">
            <button class="btn ${currentJob.bookingStatus === 'PARTNER_ACCEPTED' ? 'btn-primary' : 'btn-glass'} btn-sm btn-job-status-step" data-id="${currentJob.bookingId}" data-status="ON_THE_WAY">
              Start Trip (On The Way)
            </button>
            <button class="btn ${currentJob.bookingStatus === 'ON_THE_WAY' ? 'btn-primary' : 'btn-glass'} btn-sm btn-job-status-step" data-id="${currentJob.bookingId}" data-status="ARRIVED">
              Mark Arrived
            </button>
            <button class="btn ${currentJob.bookingStatus === 'ARRIVED' ? 'btn-primary' : 'btn-glass'} btn-sm btn-job-status-step" data-id="${currentJob.bookingId}" data-status="SERVICE_STARTED">
              Start Cleaning Service
            </button>
            <button class="btn ${currentJob.bookingStatus === 'SERVICE_STARTED' ? 'btn-primary' : 'btn-glass'} btn-sm btn-job-status-step" data-id="${currentJob.bookingId}" data-status="SERVICE_COMPLETED" style="background-color: var(--color-success); color: white;">
              Finish & Complete Work
            </button>
          </div>
        </div>
      ` : ''}

      <!-- Earnings & Completed Jobs Table -->
      <section style="margin-top: 3rem;">
        <h3 style="margin-bottom: 1.25rem;">Completed Jobs & Settlement Ledger</h3>
        ${completedJobs.length > 0 ? `
          <div class="table-responsive">
            <table class="kleen-table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Service</th>
                  <th>Customer</th>
                  <th>Gross Amount</th>
                  <th>Platform Fee (20%)</th>
                  <th>Your Earning (80%)</th>
                  <th>Settlement Status</th>
                </tr>
              </thead>
              <tbody>
                ${completedJobs.map(j => {
                  const gross = j.totalAmount || 500;
                  const net = Math.round(gross * 0.8);
                  const comm = gross - net;
                  return `
                    <tr>
                      <td><strong>#${j.bookingId}</strong></td>
                      <td>${j.serviceName}</td>
                      <td>${j.customerName || 'Customer'}</td>
                      <td>₹${gross}</td>
                      <td>- ₹${comm}</td>
                      <td><strong style="color: var(--brand-emerald-dark); font-size: 1rem;">₹${net}</strong></td>
                      <td><span class="badge badge-success">SETTLED</span></td>
                    </tr>
                  `;
                }).join("")}
              </tbody>
            </table>
          </div>
        ` : `
          <p style="color: var(--text-muted); font-size: 0.9rem;">No completed jobs recorded yet.</p>
        `}
      </section>
    </div>
  `;
}

export function attachPartnerEvents() {
  // Online/Offline Availability Toggle
  const toggle = document.getElementById("partner-availability-toggle");
  if (toggle) {
    toggle.onchange = () => {
      const user = auth.getCurrentUser();
      if (!user) return;
      const partner = db.getPartnerById(user.userId) || user;
      const isApproved = partner.kycStatus === "APPROVED" && partner.accountStatus === "ACTIVE";

      if (toggle.checked && !isApproved) {
        toggle.checked = false;
        toast.error("Cannot Go Online", "Your KYC must be approved by an administrator before going online.");
        return;
      }

      try {
        db.updatePartnerAvailability(user.userId, toggle.checked);
        toast.info("Availability Updated", toggle.checked ? "You are now ONLINE and will receive booking requests." : "You are now OFFLINE.");
      } catch (err) {
        toggle.checked = !toggle.checked;
        toast.error("Cannot Change Availability", err.message || "Failed to update availability.");
      }
    };
  }

  // Accept Job
  document.querySelectorAll(".btn-accept-job").forEach(btn => {
    btn.onclick = () => {
      const bId = btn.getAttribute("data-id");
      const user = auth.getCurrentUser();
      if (!user) return;
      db.assignPartnerToBooking(bId, user.userId, user.fullName);
      toast.success("Booking Accepted!", "Customer has been notified. Please start your trip on time.");
      window.location.reload();
    };
  });

  // Decline Job
  document.querySelectorAll(".btn-reject-job").forEach(btn => {
    btn.onclick = () => {
      const bId = btn.getAttribute("data-id");
      db.updateBookingStatus(bId, "SEARCHING_PARTNER");
      toast.info("Request Declined", "The request will be routed to another verified partner.");
      window.location.reload();
    };
  });

  // Job Progress Step
  document.querySelectorAll(".btn-job-status-step").forEach(btn => {
    btn.onclick = () => {
      const bId = btn.getAttribute("data-id");
      const nextStatus = btn.getAttribute("data-status");
      db.updateBookingStatus(bId, nextStatus);

      if (nextStatus === "SERVICE_COMPLETED") {
        toast.success("Job Completed!", "Earnings credited to your ledger. Customer prompted for review.");
      } else {
        toast.info("Status Updated", `Job status set to ${nextStatus.replace(/_/g, ' ')}`);
      }
      window.location.reload();
    };
  });

  // Quick Admin Approval Shortcut for evaluation
  const quickApproveBtn = document.getElementById("btn-quick-admin-approve");
  if (quickApproveBtn) {
    quickApproveBtn.onclick = () => {
      const user = auth.getCurrentUser();
      if (!user) return;
      db.adminReviewKyc(user.userId, "APPROVE");
      toast.success("KYC Approved!", "Unlocked full partner dashboard.");
      window.location.reload();
    };
  }

  // KYC Form Submission
  const kycForm = document.getElementById("kyc-submission-form");
  if (kycForm) {
    kycForm.onsubmit = (e) => {
      e.preventDefault();
      const user = auth.getCurrentUser();
      if (!user) return;

      const fullName = document.getElementById("kyc-name").value;
      const dob = document.getElementById("kyc-dob").value;
      const gender = document.getElementById("kyc-gender").value;
      const address = document.getElementById("kyc-address").value;
      const districtEl = document.getElementById("kyc-district");
      const district = districtEl ? districtEl.value : DEFAULT_DISTRICT;
      const city = district;
      const state = DEFAULT_STATE;
      const pinCode = document.getElementById("kyc-pin").value;

      db.submitKycApplication(user.userId, {
        fullName,
        dateOfBirth: dob,
        gender,
        address,
        city,
        district,
        state,
        pinCode
      });

      toast.success("KYC Submitted!", "Your application was sent to Admin for review.");
      window.location.reload();
    };
  }
}
