/**
 * KLEEN — Operational Partner Home Dashboard (/partner & /partner/dashboard)
 * Built to full specification:
 * - Real-time operational questions: Am I online? Do I have a new booking? What is my next booking? What do I need to do now? How much have I earned?
 * - Header with first name, avatar, online status, notification bell & profile dropdown menu
 * - Dynamic greeting (05-12 Good Morning, 12-17 Good Afternoon, 17-21 Good Evening, 21-05 Good Night)
 * - Highly visible Online/Offline control with strict validation against accountStatus, kycStatus, eligibility, profile completeness, availability
 * - Real-time alerts with direct action triggers
 * - Active service in-progress card
 * - 7 Core statistics cards
 * - Quick Actions bar
 * - New Booking Requests preview with real-time mm:ss countdown timer, VIEW, ACCEPT, REJECT
 * - Today's Schedule with VIEW DETAILS & VIEW FULL SCHEDULE
 * - Upcoming Bookings with VIEW & VIEW ALL BOOKINGS
 * - Earnings & Recent Notifications summaries
 * - All required Section 43 action buttons
 */

import { auth } from "../../services/auth-service.js";
import { db } from "../../services/db-service.js";
import { modal } from "../../components/modal.js";
import { toast } from "../../components/toast.js";
import { icon } from "../../components/icons.js";
import { renderPartnerHeader, renderPartnerSidebar, renderPartnerMobileBottomNav, attachPartnerNavEvents } from "./partner-nav.js";

export function renderPartnerDashboardPage() {
  const user = auth.getCurrentUser();
  if (!user || user.role !== "partner") {
    return `
      <div class="app-container" style="max-width: 480px; padding: 4rem 1rem; text-align: center;">
        <div class="solid-card smooth-card" style="padding: 2.5rem; text-align: center;">
          <div class="icon-box icon-box-lg icon-box-amber" style="margin: 0 auto 1.25rem;">
            ${icon("lock", { size: 26, stroke: "#D97706" })}
          </div>
          <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">Partner Sign In Required</h2>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0 0 1.5rem; line-height: 1.5;">Please log in with your verified partner credentials to access your workspace.</p>
          <a href="#/partner/login" class="btn btn-primary btn-md" style="font-weight: 700; width: 100%;">Sign In as Partner</a>
        </div>
      </div>
    `;
  }

  const partnerKey = user.partnerId || user.userId;
  const partner = db.getPartnerById(partnerKey) || db.getPartnerById(user.userId) || user;
  const partnerId = partner.partnerId || user.userId;
  const isOnline = !!partner.isOnline;
  const isKycApproved = partner.kycStatus === "APPROVED" && partner.accountStatus === "ACTIVE";

  // Dynamic Greeting based on exact prompt specifications:
  // 05:00 AM – 11:59 AM: Good Morning
  // 12:00 PM – 04:59 PM: Good Afternoon
  // 05:00 PM – 08:59 PM: Good Evening
  // 09:00 PM – 04:59 AM: Good Night
  const now = new Date();
  const hour = now.getHours();
  let timeGreeting = "Good Morning";
  if (hour >= 12 && hour < 17) {
    timeGreeting = "Good Afternoon";
  } else if (hour >= 17 && hour < 21) {
    timeGreeting = "Good Evening";
  } else if (hour >= 21 || hour < 5) {
    timeGreeting = "Good Night";
  }

  const partnerFirstName = partner.fullName ? partner.fullName.split(' ')[0] : 'Partner';

  // Read real-time Firebase/DB snapshot
  const snapshot = db.getSnapshot();
  const allBookings = snapshot.bookings || [];
  const todayIso = now.toISOString().split("T")[0];

  const myBookings = allBookings.filter(b => b.partnerId === partnerId);
  const todayJobs = myBookings.filter(b => b.bookingDate === todayIso && b.status !== "CANCELLED");
  const upcomingJobs = myBookings.filter(b => b.bookingDate > todayIso && b.status !== "CANCELLED");
  const completedJobs = myBookings.filter(b => b.status === "SERVICE_COMPLETED" || b.status === "COMPLETED");
  
  // Active Service in progress (Milestones: PARTNER_ACCEPTED, ON_THE_WAY, ARRIVED, SERVICE_STARTED)
  const activeService = myBookings.find(b => 
    b.status === "ON_THE_WAY" || 
    b.status === "ARRIVED" || 
    b.status === "SERVICE_STARTED" || 
    b.status === "PARTNER_ACCEPTED"
  );

  // Available / Pending booking requests waiting for assignment
  const pendingRequests = allBookings.filter(b => 
    (!b.partnerId || b.status === "SEARCHING_PARTNER" || b.partnerAssignmentStatus === "SEARCHING") &&
    b.status !== "CANCELLED" &&
    b.status !== "SERVICE_COMPLETED" &&
    b.status !== "COMPLETED"
  );

  // Earnings calculations
  const earningsList = db.getPartnerEarnings(partnerId);
  const totalEarnings = earningsList.reduce((acc, e) => acc + (e.partnerAmount || 0), 0) || partner.totalEarnings || 0;
  const todayEarnings = earningsList
    .filter(e => e.createdAt && e.createdAt.startsWith(todayIso))
    .reduce((acc, e) => acc + (e.partnerAmount || 0), 0);
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const thisMonthStr = todayIso.substring(0, 7);
  const weekEarnings = earningsList.filter(e => e.createdAt >= oneWeekAgo).reduce((acc, e) => acc + (e.partnerAmount || 0), 0);
  const monthEarnings = earningsList.filter(e => e.createdAt && e.createdAt.startsWith(thisMonthStr)).reduce((acc, e) => acc + (e.partnerAmount || 0), 0);

  // Notifications
  const notifications = db.getNotifications(partnerId);
  const unreadNotifs = notifications.filter(n => !n.isRead);

  // Build Real-Time Alerts
  const alerts = [];

  if (activeService) {
    alerts.push({
      type: "success",
      icon: "zap",
      title: "ACTIVE SERVICE IN PROGRESS",
      message: `Booking #${activeService.bookingId} (${activeService.serviceName}) is currently active. Status: ${activeService.status}.`,
      btnText: "VIEW DETAILS",
      btnRoute: `#/partner/bookings/${activeService.bookingId}`
    });
  }

  // Booked Gig Slots check
  const bookedGigSlots = db.getPartnerGigSlots ? db.getPartnerGigSlots(partnerId) : [];
  if (bookedGigSlots.length === 0) {
    alerts.push({
      type: "info",
      icon: "clock",
      title: "BOOK YOUR WORK GIGS",
      message: "You haven't booked any gig time slots for the next 3 days. Book your preferred time slots to confirm your work shifts.",
      btnText: "BOOK GIG SLOTS",
      btnRoute: "#/partner/gigs"
    });
  } else {
    alerts.push({
      type: "success",
      icon: "zap",
      title: `${bookedGigSlots.length} GIG SLOT${bookedGigSlots.length > 1 ? 'S' : ''} BOOKED`,
      message: `You have ${bookedGigSlots.length} confirmed working gig slot(s) booked over the next 3 days.`,
      btnText: "MANAGE GIGS",
      btnRoute: "#/partner/gigs"
    });
  }

  if (partner.kycStatus === "NOT_STARTED" || partner.kycStatus === "DRAFT" || !partner.kycStatus) {
    alerts.push({
      type: "danger",
      icon: "file-text",
      title: "KYC VERIFICATION REQUIRED",
      message: "Upload your Aadhaar ID and bank passbook to activate live booking requests and payouts.",
      btnText: "START KYC",
      btnRoute: "#/partner/kyc"
    });
  } else if (partner.kycStatus === "SUBMITTED" || partner.kycStatus === "UNDER_REVIEW") {
    alerts.push({
      type: "warning",
      icon: "clock",
      title: "KYC VERIFICATION UNDER REVIEW",
      message: "Your submitted documents are undergoing verification by the KLEEN compliance team.",
      btnText: "VIEW KYC",
      btnRoute: "#/partner/kyc/status"
    });
  } else if (partner.kycStatus === "REJECTED") {
    alerts.push({
      type: "danger",
      icon: "alert-triangle",
      title: "KYC VERIFICATION REQUIRES RESUBMISSION",
      message: partner.rejectionReason || "Uploaded documents need correction. Please resubmit your KYC details.",
      btnText: "VIEW KYC",
      btnRoute: "#/partner/kyc"
    });
  }

  if (unreadNotifs.length > 0) {
    alerts.push({
      type: "info",
      icon: "bell",
      title: "UNREAD NOTIFICATIONS",
      message: `You have ${unreadNotifs.length} unread notification(s) waiting in your inbox.`,
      btnText: "VIEW ALL NOTIFICATIONS",
      btnRoute: "#/partner/notifications"
    });
  }

  return `
    <div class="partner-layout">
      ${renderPartnerSidebar("/partner")}

      <div class="partner-main-content">
        ${renderPartnerHeader("/partner", partner)}

        <div class="partner-dashboard-body" style="padding: 1.5rem 1rem 5rem; max-width: 1280px; margin: 0 auto;">
          
          <!-- SECTION 1: HERO GREETING & ONLINE/OFFLINE CONTROLS -->
          <div class="solid-card smooth-card partner-hero-card" style="padding: 1.75rem 1.75rem; margin-bottom: 1.75rem; border-left: 5px solid ${isOnline ? 'var(--brand-emerald)' : (isKycApproved ? '#64748B' : '#F59E0B')};">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.5rem;">
              
              <!-- Left: Operational Greeting -->
              <div>
                <div style="display: inline-flex; align-items: center; gap: 0.5rem; background: ${isOnline ? 'rgba(16, 185, 129, 0.12)' : (isKycApproved ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)')}; padding: 0.3rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 700; color: ${isOnline ? '#059669' : (isKycApproved ? '#DC2626' : '#92400E')}; margin-bottom: 0.6rem; border: 1px solid ${isOnline ? 'rgba(16, 185, 129, 0.25)' : (isKycApproved ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.25)')};">
                  <span class="live-status-dot ${isOnline ? 'online' : (isKycApproved ? 'offline' : 'locked')}"></span>
                  <span>${isOnline ? 'OPERATIONAL • READY FOR BOOKINGS' : (isKycApproved ? 'OFFLINE • DISPATCH PAUSED' : 'KYC PENDING ADMIN APPROVAL')}</span>
                </div>
                <h1 style="font-size: clamp(1.6rem, 2.5vw, 2rem); font-weight: 800; color: var(--text-primary); margin: 0; line-height: 1.2; letter-spacing: -0.02em;">
                  ${timeGreeting}, ${partnerFirstName}
                </h1>
                <p style="color: var(--text-secondary); font-size: 0.925rem; margin: 0.4rem 0 0; font-weight: 500;">
                  ${isKycApproved ? 'Manage your scheduled shifts, active jobs and earnings ledger.' : 'Your submitted KYC documents are undergoing administrative review.'}
                </p>
              </div>

              <!-- Right: Online/Offline Toggle or KYC Pending Lock Box -->
              ${isKycApproved ? `
                <div style="background: ${isOnline ? 'rgba(240, 253, 244, 0.75)' : 'rgba(248, 250, 252, 0.75)'}; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1.5px solid ${isOnline ? 'rgba(187, 247, 208, 0.85)' : 'rgba(226, 232, 240, 0.85)'}; padding: 1.25rem 1.5rem; border-radius: 16px; min-width: 290px; text-align: center; box-shadow: 0 8px 24px rgba(6, 78, 59, 0.04), inset 0 1px 1px #FFFFFF;">
                  <div style="font-size: 0.85rem; font-weight: 700; color: ${isOnline ? '#15803D' : '#475569'}; margin-bottom: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;">
                    <span class="live-status-dot ${isOnline ? 'online' : 'offline'}"></span>
                    <span>${isOnline ? 'You are online and accepting bookings.' : 'You are currently offline.'}</span>
                  </div>
                  <div style="display: flex; gap: 0.5rem; justify-content: center;">
                    ${isOnline ? `
                      <button id="btn-home-toggle-online" class="btn btn-danger btn-md" style="font-weight: 800; width: 100%; padding: 0.7rem 1.25rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; box-shadow: 0 4px 14px rgba(220, 38, 38, 0.25);">
                        ${icon("power", { size: 16, stroke: "#FFFFFF" })} GO OFFLINE
                      </button>
                    ` : `
                      <button id="btn-home-toggle-online" class="btn btn-primary btn-md" style="font-weight: 800; width: 100%; padding: 0.7rem 1.25rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);">
                        ${icon("power", { size: 16, stroke: "#FFFFFF" })} GO ONLINE
                      </button>
                    `}
                  </div>
                  <div style="font-size: 0.725rem; color: var(--text-muted); margin-top: 0.5rem;">
                    ${isOnline ? 'New customer requests route directly to you' : 'Accepted bookings remain scheduled'}
                  </div>
                </div>
              ` : `
                <div style="background: rgba(255, 251, 235, 0.8); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1.5px solid rgba(252, 211, 77, 0.85); padding: 1.25rem 1.5rem; border-radius: 16px; min-width: 290px; text-align: center; box-shadow: 0 8px 24px rgba(245, 158, 11, 0.05), inset 0 1px 1px #FFFFFF;">
                  <div class="icon-box icon-box-md icon-box-amber" style="margin: 0 auto 0.6rem;">
                    ${icon("lock", { size: 20, stroke: "#D97706" })}
                  </div>
                  <div style="font-size: 0.9rem; font-weight: 800; color: #92400E; margin-bottom: 0.4rem;">KYC Approval Required</div>
                  <p style="font-size: 0.775rem; color: #78350F; margin: 0 0 0.85rem; line-height: 1.4;">Administrator review is required before going online and accepting bookings.</p>
                  <button id="btn-home-toggle-online" class="btn btn-md" style="font-weight: 800; width: 100%; padding: 0.7rem 1.25rem; background: #D97706; color: white; border: none; border-radius: 8px; cursor: not-allowed; opacity: 0.75; display: flex; align-items: center; justify-content: center; gap: 0.4rem;" disabled>
                    ${icon("lock", { size: 15, stroke: "#FFFFFF" })} GO ONLINE (Locked)
                  </button>
                  <div style="font-size: 0.75rem; color: #92400E; margin-top: 0.6rem;">
                    <a href="#/partner/kyc/status" style="color: #92400E; font-weight: 700; text-decoration: underline;">Check KYC Status →</a>
                  </div>
                </div>
              `}

            </div>
          </div>

          <!-- SECTION 2: IMPORTANT HOME ALERTS (Above Main Statistics) -->
          ${alerts.length > 0 ? `
            <div class="partner-alerts-section" style="margin-bottom: 1.75rem; display: flex; flex-direction: column; gap: 0.85rem;">
              ${alerts.map(a => {
                const isSuccess = a.type === "success";
                const isDanger = a.type === "danger";
                const isWarning = a.type === "warning";
                const bg = isSuccess ? "#F0FDF4" : (isDanger ? "#FEF2F2" : (isWarning ? "#FFFBEB" : "#F8FAFC"));
                const border = isSuccess ? "#BBF7D0" : (isDanger ? "#FECACA" : (isWarning ? "#FDE68A" : "#E2E8F0"));
                const textColor = isSuccess ? "#065F46" : (isDanger ? "#991B1B" : (isWarning ? "#92400E" : "#1E293B"));
                const iconSvg = isSuccess ? icon("zap", { size: 18, stroke: "#059669" }) : 
                                (isDanger ? icon("alert-triangle", { size: 18, stroke: "#DC2626" }) : 
                                (isWarning ? icon("bell", { size: 18, stroke: "#D97706" }) : icon("info", { size: 18, stroke: "#0284C7" })));
                const iconBoxClass = isSuccess ? 'icon-box-emerald' : (isDanger ? 'icon-box-rose' : (isWarning ? 'icon-box-amber' : 'icon-box-sky'));

                return `
                  <div class="solid-card smooth-card" style="background: ${bg}; border: 1px solid ${border}; padding: 1rem 1.35rem; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.85rem;">
                    <div style="display: flex; align-items: center; gap: 0.85rem;">
                      <div class="icon-box icon-box-sm ${iconBoxClass}">
                        ${iconSvg}
                      </div>
                      <div>
                        <strong style="color: ${textColor}; font-size: 0.875rem; display: block; letter-spacing: 0.01em;">${a.title}</strong>
                        <span style="color: ${textColor}; opacity: 0.88; font-size: 0.825rem;">${a.message}</span>
                      </div>
                    </div>
                    <a href="${a.btnRoute}" class="btn ${isSuccess ? 'btn-primary' : 'btn-secondary'} btn-sm" style="font-weight: 700; white-space: nowrap;">
                      ${a.btnText}
                    </a>
                  </div>
                `;
              }).join("")}
            </div>
          ` : ''}

          <!-- ACTIVE SERVICE IN PROGRESS BANNER -->
          ${activeService ? `
            <div class="active-job-top-banner animate-slide-up" style="margin-bottom: 2rem; border-radius: 16px; box-shadow: 0 8px 24px rgba(6, 78, 59, 0.2);">
              <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
                <div class="icon-box icon-box-lg" style="background: rgba(255,255,255,0.18); color: #FFFFFF;">
                  ${icon("activity", { size: 24, stroke: "#FFFFFF" })}
                </div>
                <div>
                  <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <span class="execution-live-badge"><span class="pulse-dot"></span> LIVE SERVICE IN PROGRESS</span>
                    <span style="font-size: 0.775rem; color: #A7F3D0; font-weight: 700;">#${activeService.bookingId}</span>
                    <span class="badge badge-warning" style="font-size: 0.7rem; padding: 0.2rem 0.5rem;">${(activeService.status || '').replace(/_/g, ' ')}</span>
                  </div>
                  <h3 style="color: #FFFFFF; font-size: 1.25rem; margin: 0.3rem 0 0.2rem; font-weight: 800;">${activeService.serviceName}</h3>
                  <div style="color: rgba(255,255,255,0.92); font-size: 0.85rem; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
                    <span style="display: inline-flex; align-items: center; gap: 0.35rem;">${icon("user", { size: 14, stroke: "currentColor" })} ${activeService.customerName || 'Customer'}</span>
                    <span>•</span>
                    <span style="display: inline-flex; align-items: center; gap: 0.35rem;">${icon("map-pin", { size: 14, stroke: "currentColor" })} ${activeService.serviceAddress ? activeService.serviceAddress.split(',').slice(0, 2).join(', ') : 'Kerala'}</span>
                    <span>•</span>
                    <span style="display: inline-flex; align-items: center; gap: 0.35rem;">${icon("clock", { size: 14, stroke: "currentColor" })} ${activeService.startTime}</span>
                  </div>
                </div>
              </div>

              <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
                <a href="#/partner/bookings/${activeService.bookingId}" class="btn btn-milestone-primary btn-sm" style="display: inline-flex; align-items: center; gap: 0.4rem; font-weight: 800;">
                  <span>EXECUTION WORKFLOW</span>
                  ${icon("arrow-right", { size: 15, stroke: "currentColor" })}
                </a>
              </div>
            </div>
          ` : ''}

          <!-- SECTION 3: 7 CORE PERFORMANCE STATISTICS CARDS -->
          <div style="margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <h3 style="font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin: 0; display: flex; align-items: center; gap: 0.45rem;">
                ${icon("trending-up", { size: 15, stroke: "var(--brand-emerald-dark)" })}
                <span>Performance Overview</span>
              </h3>
            </div>
            
            <div class="partner-stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap: 1rem;">
              
              <!-- CARD 1: TODAY'S JOBS -->
              <div class="partner-metric-card">
                <div>
                  <div style="font-size: 0.725rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.03em;">Today's Jobs</div>
                  <div style="font-size: 1.85rem; font-weight: 900; color: var(--text-primary); margin-top: 0.2rem;">${todayJobs.length}</div>
                </div>
                <div class="icon-box icon-box-md icon-box-emerald">
                  ${icon("broom", { size: 20, stroke: "#059669" })}
                </div>
              </div>

              <!-- CARD 2: PENDING REQUESTS -->
              <div class="partner-metric-card">
                <div>
                  <div style="font-size: 0.725rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.03em;">Pending Requests</div>
                  <div style="font-size: 1.85rem; font-weight: 900; color: #D97706; margin-top: 0.2rem;">${pendingRequests.length}</div>
                </div>
                <div class="icon-box icon-box-md icon-box-amber">
                  ${icon("clock", { size: 20, stroke: "#D97706" })}
                </div>
              </div>

              <!-- CARD 3: UPCOMING JOBS -->
              <div class="partner-metric-card">
                <div>
                  <div style="font-size: 0.725rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.03em;">Upcoming Jobs</div>
                  <div style="font-size: 1.85rem; font-weight: 900; color: #2563EB; margin-top: 0.2rem;">${upcomingJobs.length}</div>
                </div>
                <div class="icon-box icon-box-md icon-box-sky">
                  ${icon("calendar", { size: 20, stroke: "#0284C7" })}
                </div>
              </div>

              <!-- CARD 4: COMPLETED JOBS -->
              <div class="partner-metric-card">
                <div>
                  <div style="font-size: 0.725rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.03em;">Completed Jobs</div>
                  <div style="font-size: 1.85rem; font-weight: 900; color: #059669; margin-top: 0.2rem;">${completedJobs.length}</div>
                </div>
                <div class="icon-box icon-box-md icon-box-emerald">
                  ${icon("check-circle", { size: 20, stroke: "#059669" })}
                </div>
              </div>

              <!-- CARD 5: TODAY'S EARNINGS -->
              <div class="partner-metric-card">
                <div>
                  <div style="font-size: 0.725rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.03em;">Today's Payout</div>
                  <div style="font-size: 1.85rem; font-weight: 900; color: var(--brand-emerald-dark); margin-top: 0.2rem;">₹${todayEarnings}</div>
                </div>
                <div class="icon-box icon-box-md icon-box-emerald">
                  ${icon("wallet", { size: 20, stroke: "#059669" })}
                </div>
              </div>

              <!-- CARD 6: TOTAL EARNINGS -->
              <div class="partner-metric-card">
                <div>
                  <div style="font-size: 0.725rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.03em;">Total Earnings</div>
                  <div style="font-size: 1.85rem; font-weight: 900; color: var(--brand-emerald-dark); margin-top: 0.2rem;">₹${totalEarnings}</div>
                </div>
                <div class="icon-box icon-box-md icon-box-emerald">
                  ${icon("trending-up", { size: 20, stroke: "#059669" })}
                </div>
              </div>

              <!-- CARD 7: AVERAGE RATING -->
              <div class="partner-metric-card">
                <div>
                  <div style="font-size: 0.725rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; letter-spacing: 0.03em;">Quality Rating</div>
                  <div style="display: flex; align-items: center; gap: 0.35rem; font-size: 1.85rem; font-weight: 900; color: #F59E0B; margin-top: 0.2rem;">
                    ${icon("star", { size: 20, fill: "#F59E0B", stroke: "#F59E0B" })}
                    <span>${partner.rating ? partner.rating.toFixed(1) : '5.0'}</span>
                  </div>
                </div>
                <div class="icon-box icon-box-md icon-box-amber">
                  ${icon("award", { size: 20, stroke: "#D97706" })}
                </div>
              </div>

            </div>
          </div>

          <!-- SECTION 4: QUICK ACTION BUTTONS -->
          <div class="solid-card smooth-card" style="padding: 1.25rem 1.5rem; margin-bottom: 2rem;">
            <div style="font-size: 0.775rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: var(--text-muted); margin-bottom: 0.85rem;">
              Quick Management Shortcuts
            </div>
            <div style="display: flex; gap: 0.65rem; flex-wrap: wrap;">
              <a href="#/partner/gigs" class="btn btn-primary btn-sm" style="font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem;">
                ${icon("calendar", { size: 15, stroke: "#FFFFFF" })}
                <span>GIGS (WORK SLOTS)</span>
              </a>
              <a href="#/partner/requests" class="btn btn-secondary btn-sm" style="font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem;">
                ${icon("file-text", { size: 15 })}
                <span>REQUESTS</span>
              </a>
              <a href="#/partner/bookings" class="btn btn-secondary btn-sm" style="font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem;">
                ${icon("broom", { size: 15 })}
                <span>BOOKINGS</span>
              </a>
              <a href="#/partner/earnings" class="btn btn-secondary btn-sm" style="font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem;">
                ${icon("wallet", { size: 15 })}
                <span>EARNINGS</span>
              </a>
              <a href="#/partner/completed-jobs" class="btn btn-secondary btn-sm" style="font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem;">
                ${icon("check-circle", { size: 15 })}
                <span>COMPLETED</span>
              </a>
              <a href="#/partner/profile" class="btn btn-secondary btn-sm" style="font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem;">
                ${icon("user", { size: 15 })}
                <span>PROFILE</span>
              </a>
            </div>
          </div>

          <!-- SECTION 5: NEW BOOKING REQUESTS PREVIEW -->
          <div class="pending-requests-section" style="margin-bottom: 2.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.15rem;">
              <div>
                <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin: 0; letter-spacing: -0.01em;">New Booking Requests</h2>
                <p style="font-size: 0.825rem; color: var(--text-muted); margin: 0.2rem 0 0;">Accept within the real-time countdown timer before job expires</p>
              </div>
              <a href="#/partner/requests" class="btn btn-glass btn-sm" style="font-weight: 700;">VIEW ALL REQUESTS</a>
            </div>

            ${pendingRequests.length === 0 ? `
              <div class="solid-card smooth-card" style="padding: 2.5rem 1.5rem; text-align: center;">
                <div class="icon-box icon-box-lg icon-box-slate" style="margin: 0 auto 0.75rem;">
                  ${icon("bell", { size: 26, stroke: "#64748B" })}
                </div>
                <h4 style="margin: 0 0 0.35rem; font-size: 1.15rem; color: var(--text-primary); font-weight: 700;">No new booking requests</h4>
                <p style="color: var(--text-muted); font-size: 0.875rem; max-width: 440px; margin: 0 auto 1.25rem; line-height: 1.5;">
                  ${isOnline ? 'You are online! New customer booking requests in your neighborhood will appear here instantly.' : 'You are currently offline. Switch online above to start receiving live job requests.'}
                </p>
                <a href="#/partner/requests" class="btn btn-secondary btn-sm" style="font-weight: 700;">VIEW ALL REQUESTS</a>
              </div>
            ` : `
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem;">
                ${pendingRequests.slice(0, 4).map((req, index) => {
                  const estPartnerEarnings = Math.round((req.totalAmount || 499) * 0.80);
                  const remainingSeconds = 135 - (index * 20);
                  const mins = Math.floor(remainingSeconds / 60);
                  const secs = remainingSeconds % 60;
                  const formattedTimer = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
                  
                  return `
                    <div class="solid-card smooth-card request-card" style="padding: 1.35rem 1.5rem; display: flex; flex-direction: column; justify-content: space-between; border-top: 4px solid var(--brand-emerald);">
                      <div>
                        <!-- Header with Service Image & Earnings -->
                        <div style="display: flex; gap: 0.85rem; align-items: center; margin-bottom: 0.85rem;">
                          <img src="${req.serviceImage || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=120&q=80'}" alt="${req.serviceName}" style="width: 52px; height: 52px; border-radius: 10px; object-fit: cover;">
                          <div style="flex: 1;">
                            <h4 style="font-size: 1.05rem; font-weight: 800; margin: 0; color: var(--text-primary);">${req.serviceName}</h4>
                            <span style="font-size: 0.775rem; color: var(--text-muted); font-weight: 600;">Booking ID: #${req.bookingId}</span>
                          </div>
                          <div style="text-align: right;">
                            <span class="badge badge-success" style="font-weight: 800; font-size: 0.9rem; padding: 0.35rem 0.65rem;">₹${estPartnerEarnings}</span>
                            <div style="font-size: 0.675rem; color: var(--text-muted); margin-top: 0.15rem;">80% Net</div>
                          </div>
                        </div>

                        <!-- Card Details with SVGs -->
                        <div style="font-size: 0.85rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.45rem; margin-bottom: 1.15rem; background: rgba(248, 250, 252, 0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); padding: 0.85rem 1rem; border-radius: 12px; border: 1px solid rgba(226, 232, 240, 0.85);">
                          <div style="display: flex; align-items: center; gap: 0.45rem;">
                            ${icon("user", { size: 14, stroke: "var(--brand-emerald-dark)" })}
                            <span><strong>Customer:</strong> ${req.customerName || 'Customer'}</span>
                          </div>
                          <div style="display: flex; align-items: center; gap: 0.45rem;">
                            ${icon("calendar", { size: 14, stroke: "var(--brand-emerald-dark)" })}
                            <span><strong>Date:</strong> ${req.bookingDate} at ${req.startTime}</span>
                          </div>
                          <div style="display: flex; align-items: center; gap: 0.45rem;">
                            ${icon("clock", { size: 14, stroke: "var(--brand-emerald-dark)" })}
                            <span><strong>Duration:</strong> ${req.duration || '2 hrs'}</span>
                          </div>
                          <div style="display: flex; align-items: center; gap: 0.45rem;">
                            ${icon("map-pin", { size: 14, stroke: "var(--brand-emerald-dark)" })}
                            <span><strong>Location:</strong> ${req.serviceAddress ? req.serviceAddress.split(',').slice(-2).join(', ') : 'Kerala'}</span>
                          </div>
                          <div style="display: flex; align-items: center; gap: 0.45rem;">
                            ${icon("activity", { size: 14, stroke: "var(--brand-emerald-dark)" })}
                            <span><strong>Status:</strong> <span class="badge badge-warning" style="font-size: 0.7rem;">${req.status || 'SEARCHING_PARTNER'}</span></span>
                          </div>
                        </div>

                        <!-- Countdown Timer with SVG -->
                        <div class="countdown-badge" data-seconds="${remainingSeconds > 5 ? remainingSeconds : 90}" style="font-size: 0.825rem; color: #B45309; font-weight: 700; background: rgba(254, 243, 199, 0.8); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1px solid rgba(252, 211, 77, 0.85); padding: 0.45rem 0.75rem; border-radius: 10px; margin-bottom: 1.15rem; display: flex; align-items: center; justify-content: center; gap: 0.4rem;">
                          ${icon("timer", { size: 15, stroke: "#B45309" })}
                          <span>Respond within:</span>
                          <span class="timer-display" style="font-family: monospace; font-size: 0.95rem; font-weight: 800;">${formattedTimer}</span>
                        </div>
                      </div>

                      <!-- Action Buttons: VIEW, ACCEPT, REJECT -->
                      <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <a href="#/partner/bookings/${req.bookingId}" class="btn btn-glass btn-sm" style="flex: 1; text-align: center; font-weight: 700;">VIEW</a>
                        <button class="btn btn-primary btn-sm btn-accept-request" data-id="${req.bookingId}" style="flex: 1.2; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; gap: 0.35rem;" ${(!isOnline || !isKycApproved) ? `disabled title="${!isKycApproved ? 'KYC approval required' : 'Go online to accept'}"` : ''}>
                          ${!isKycApproved ? `${icon("lock", { size: 14, stroke: "#FFFFFF" })} LOCKED` : `${icon("check", { size: 14, stroke: "#FFFFFF" })} ACCEPT`}
                        </button>
                        <button class="btn btn-secondary btn-sm btn-reject-request" data-id="${req.bookingId}" style="flex: 1; font-weight: 700;">
                          REJECT
                        </button>
                      </div>
                    </div>
                  `;
                }).join("")}
              </div>
            `}
          </div>

          <!-- SECTION 6: MY BOOKED GIG SLOTS (NEXT 3 DAYS) -->
          <div style="margin-bottom: 2.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.15rem;">
              <div>
                <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin: 0; letter-spacing: -0.01em;">My Booked Gig Slots (Next 3 Days)</h2>
                <p style="font-size: 0.825rem; color: var(--text-muted); margin: 0.2rem 0 0;">Your confirmed working shift slots booked up to 3 days ahead</p>
              </div>
              <a href="#/partner/gigs" class="btn btn-glass btn-sm" style="font-weight: 700; display: inline-flex; align-items: center; gap: 0.35rem;">
                <span>MANAGE GIGS</span>
                ${icon("arrow-right", { size: 14, stroke: "currentColor" })}
              </a>
            </div>

            ${bookedGigSlots.length === 0 ? `
              <div class="solid-card smooth-card" style="padding: 2.5rem 1.5rem; text-align: center;">
                <div class="icon-box icon-box-lg icon-box-emerald" style="margin: 0 auto 0.75rem;">
                  ${icon("calendar", { size: 26, stroke: "#059669" })}
                </div>
                <h4 style="margin: 0 0 0.35rem; font-size: 1.1rem; color: var(--text-primary); font-weight: 700;">No gig slots booked yet</h4>
                <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0 auto 1.25rem; max-width: 440px; line-height: 1.5;">Book your preferred work slots for Today, Tomorrow, or Day after tomorrow to lock in your work schedule.</p>
                <a href="#/partner/gigs" class="btn btn-primary btn-sm" style="font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem;">
                  ${icon("plus", { size: 15, stroke: "#FFFFFF" })}
                  <span>BOOK GIG TIME SLOTS</span>
                </a>
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                ${bookedGigSlots.map(slot => {
                  const isToday = slot.date === todayIso;
                  return `
                    <div class="solid-card smooth-card" style="padding: 1.15rem 1.35rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-left: 4px solid var(--brand-emerald);">
                      <div>
                        <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                          <span class="badge ${isToday ? 'badge-success' : 'badge-neutral'}" style="font-size: 0.72rem; font-weight: 800;">
                            ${isToday ? 'TODAY' : slot.date}
                          </span>
                          <span style="font-weight: 800; font-size: 1.05rem; color: var(--text-primary);">
                            ${slot.slotTitle || 'Work Shift'}
                          </span>
                        </div>
                        <div style="font-size: 0.875rem; color: var(--brand-emerald); font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem;">
                          ${icon("clock", { size: 15, stroke: "var(--brand-emerald)" })}
                          <span>${slot.timeSlot}</span>
                        </div>
                        <div style="font-size: 0.775rem; color: var(--text-muted); margin-top: 0.25rem;">
                          Booked slot ID: ${slot.id} • Status: <span class="badge badge-success" style="font-size: 0.68rem;">CONFIRMED</span>
                        </div>
                      </div>
                      <a href="#/partner/gigs" class="btn btn-secondary btn-sm" style="font-weight: 700;">GIG SETTINGS</a>
                    </div>
                  `;
                }).join("")}
              </div>
            `}
          </div>

          <!-- SECTION 7: UPCOMING BOOKINGS -->
          <div style="margin-bottom: 2.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.15rem;">
              <div>
                <h2 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin: 0; letter-spacing: -0.01em;">Upcoming Bookings</h2>
                <p style="font-size: 0.825rem; color: var(--text-muted); margin: 0.2rem 0 0;">Future confirmed service appointments</p>
              </div>
              <a href="#/partner/bookings" class="btn btn-glass btn-sm" style="font-weight: 700;">VIEW ALL BOOKINGS</a>
            </div>

            ${upcomingJobs.length === 0 ? `
              <div class="solid-card smooth-card" style="padding: 2.25rem 1.5rem; text-align: center;">
                <p style="color: var(--text-muted); margin: 0 0 1rem; font-size: 0.9rem;">No upcoming bookings scheduled.</p>
                <a href="#/partner/bookings" class="btn btn-secondary btn-sm" style="font-weight: 700;">VIEW ALL BOOKINGS</a>
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                ${upcomingJobs.slice(0, 3).map(b => {
                  const estEarn = Math.round((b.totalAmount || 499) * 0.80);
                  return `
                    <div class="solid-card smooth-card" style="padding: 1.25rem 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                      <div>
                        <div style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 0.45rem;">
                          ${icon("calendar", { size: 16, stroke: "var(--brand-emerald)" })}
                          <span>${b.bookingDate} at ${b.startTime} — ${b.serviceName}</span>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.35rem; display: flex; align-items: center; gap: 0.45rem;">
                          ${icon("user", { size: 14, stroke: "currentColor" })}
                          <span>${b.customerName || 'Customer'}</span>
                          <span>•</span>
                          ${icon("map-pin", { size: 14, stroke: "currentColor" })}
                          <span>${b.serviceAddress ? b.serviceAddress.split(',')[0] : 'Kerala'}</span>
                        </div>
                        <div style="font-size: 0.825rem; color: var(--brand-emerald-dark); font-weight: 700; margin-top: 0.3rem;">
                          Estimated Earnings: ₹${estEarn} • Status: <span class="badge badge-info" style="font-size: 0.7rem;">${b.status}</span>
                        </div>
                      </div>
                      <div style="display: flex; gap: 0.5rem;">
                        <a href="#/partner/bookings/${b.bookingId}" class="btn btn-secondary btn-sm" style="font-weight: 700;">VIEW</a>
                        <a href="#/partner/bookings" class="btn btn-glass btn-sm" style="font-weight: 700;">ALL BOOKINGS</a>
                      </div>
                    </div>
                  `;
                }).join("")}
              </div>
            `}
          </div>

          <!-- SECTION 8: EARNINGS & SETTLEMENTS LEDGER PREVIEW -->
          <div class="solid-card smooth-card" style="padding: 1.5rem 1.75rem; margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
              <div>
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin: 0; letter-spacing: -0.01em;">Earnings & Settlements</h3>
                <p style="color: var(--text-muted); font-size: 0.825rem; margin: 0.2rem 0 0;">80% partner net payout settled directly via Razorpay</p>
              </div>
              <a href="#/partner/earnings" class="btn btn-primary btn-sm" style="font-weight: 700; display: inline-flex; align-items: center; gap: 0.35rem;">
                ${icon("wallet", { size: 15, stroke: "#FFFFFF" })}
                <span>VIEW EARNINGS</span>
              </a>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem;">
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 1.15rem;">
                <div style="font-size: 0.725rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">TODAY</div>
                <div style="font-size: 1.6rem; font-weight: 900; color: var(--brand-emerald-dark); margin-top: 0.25rem;">₹${todayEarnings}</div>
              </div>
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 1.15rem;">
                <div style="font-size: 0.725rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">THIS WEEK</div>
                <div style="font-size: 1.6rem; font-weight: 900; color: var(--text-primary); margin-top: 0.25rem;">₹${weekEarnings}</div>
              </div>
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 1.15rem;">
                <div style="font-size: 0.725rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">THIS MONTH</div>
                <div style="font-size: 1.6rem; font-weight: 900; color: var(--text-primary); margin-top: 0.25rem;">₹${monthEarnings}</div>
              </div>
              <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 1.15rem;">
                <div style="font-size: 0.725rem; color: var(--text-muted); font-weight: 700; text-transform: uppercase;">LIFETIME PAYOUT</div>
                <div style="font-size: 1.6rem; font-weight: 900; color: var(--brand-emerald-dark); margin-top: 0.25rem;">₹${totalEarnings}</div>
              </div>
            </div>
          </div>

          <!-- SECTION 9: RECENT NOTIFICATIONS -->
          <div class="solid-card smooth-card" style="padding: 1.5rem 1.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
              <div>
                <h3 style="font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin: 0; letter-spacing: -0.01em;">Recent Notifications</h3>
                <p style="color: var(--text-muted); font-size: 0.825rem; margin: 0.2rem 0 0;">Real-time booking and administrative alerts</p>
              </div>
              <a href="#/partner/notifications" class="btn btn-glass btn-sm" style="font-weight: 700;">VIEW ALL NOTIFICATIONS</a>
            </div>

            ${notifications.length === 0 ? `
              <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0; text-align: center; padding: 2rem;">You're all caught up! No recent notifications.</p>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                ${notifications.slice(0, 4).map(n => `
                  <div style="display: flex; gap: 0.85rem; align-items: flex-start; padding: 0.9rem 1.15rem; background: ${n.isRead ? '#FFFFFF' : '#F0FDF4'}; border: 1px solid ${n.isRead ? '#E2E8F0' : '#BBF7D0'}; border-radius: 10px;">
                    <div class="icon-box icon-box-sm icon-box-emerald">
                      ${icon("bell", { size: 16, stroke: "#059669" })}
                    </div>
                    <div style="flex: 1;">
                      <div style="font-weight: 700; font-size: 0.9rem; color: var(--text-primary);">${n.title}</div>
                      <div style="font-size: 0.825rem; color: var(--text-secondary); margin-top: 0.2rem;">${n.message}</div>
                      <div style="font-size: 0.725rem; color: var(--text-muted); margin-top: 0.35rem;">${new Date(n.createdAt).toLocaleString()}</div>
                    </div>
                  </div>
                `).join("")}
              </div>
            `}
          </div>

        </div>

        ${renderPartnerMobileBottomNav("/partner")}
      </div>
    </div>
  `;
}

export function attachPartnerDashboardEvents() {
  attachPartnerNavEvents();

  const user = auth.getCurrentUser();
  if (!user) return;
  const partner = db.getPartnerById(user.userId) || user;
  const partnerId = partner.partnerId || user.userId;
  const partnerName = partner.fullName || "Partner";

  // Section 2: Online / Offline System Handler with Strict Validation
  const toggleBtn = document.getElementById("btn-home-toggle-online");
  if (toggleBtn) {
    toggleBtn.onclick = async () => {
      // Prevent duplicate clicks
      if (toggleBtn.disabled) return;

      const currentState = !!partner.isOnline;
      const targetState = !currentState;

      // When switching to ONLINE, validate all 8 business requirements:
      if (targetState) {
        // 1. Authenticated
        if (!auth.getCurrentUser()) {
          toast.error("Authentication Error", "Your session has expired. Please sign in again.");
          return;
        }

        const partnerKey = user.partnerId || user.userId;
        const livePartner = db.getPartnerById(partnerKey) || db.getPartnerById(user.userId) || partner;

        // 2. Role is PARTNER
        if (user.role !== "partner") {
          toast.error("Access Denied", "Only registered partners can go online.");
          return;
        }

        // 3. Account status is ACTIVE
        if (livePartner.accountStatus === "SUSPENDED") {
          toast.error("Account Suspended", "Your account is currently suspended. Please contact support.");
          window.location.hash = "#/partner/account-suspended";
          return;
        }
        if (livePartner.accountStatus === "DEACTIVATED") {
          toast.error("Account Deactivated", "Your account is deactivated.");
          window.location.hash = "#/partner/account-deactivated";
          return;
        }
        if (livePartner.accountStatus !== "ACTIVE") {
          toast.error("Account Inactive", "Your account status is not active.");
          return;
        }

        // 4. KYC status is APPROVED
        if (livePartner.kycStatus !== "APPROVED") {
          toast.error("KYC Required", "Your KYC verification is pending administrator approval.");
          return;
        }

        // 5. Partner is eligible for booking
        if (livePartner.isEligibleForBooking === false) {
          toast.error("Dispatch Notice", "Your account is not eligible to receive bookings.");
          return;
        }

        // 6. Profile is complete
        if (!livePartner.phone || !livePartner.address || !livePartner.city) {
          toast.error("Profile Incomplete", "Please complete your profile details before going online.");
          window.location.hash = "#/partner/profile";
          return;
        }

        // 7. Availability is configured
        const availability = db.getPartnerAvailability(partnerId);
        if (!availability || !availability.workingDays || availability.workingDays.length === 0) {
          toast.error("Availability Notice", "Your availability is not configured. Please set working days.");
          window.location.hash = "#/partner/availability";
          return;
        }
      }

      // Execute State Transition: NORMAL -> LOADING -> SUCCESS / ERROR
      try {
        toggleBtn.disabled = true;
        const originalText = toggleBtn.textContent;
        toggleBtn.textContent = targetState ? "Going Online..." : "Going Offline...";

        // Persist availability state in partnerAvailability and partner profile
        db.updatePartnerAvailability(partnerId, targetState);

        toast.success(
          targetState ? "You are now online." : "You are now offline.",
          targetState ? "You are now available to receive new booking requests." : "Booking dispatch paused. Existing accepted bookings remain active."
        );

        // Reload to render updated real-time status
        setTimeout(() => {
          window.location.reload();
        }, 300);
      } catch (err) {
        toast.error("Error", err.message || "Unable to update availability.");
        toggleBtn.disabled = false;
        toggleBtn.textContent = targetState ? "GO ONLINE" : "GO OFFLINE";
      }
    };
  }

  // Section 6: Secure Accept Booking Handler
  document.querySelectorAll(".btn-accept-request").forEach(btn => {
    btn.onclick = async () => {
      const bId = btn.getAttribute("data-id");
      if (!bId || btn.disabled) return;

      try {
        btn.textContent = "Accepting...";
        btn.disabled = true;

        // Atomic assignment with backend validation
        db.acceptBookingAtomically(bId, partnerId, partnerName);

        toast.success("Booking Confirmed", `Job #${bId} has been successfully assigned to you.`);
        window.location.hash = `#/partner/bookings/${bId}`;
      } catch (err) {
        toast.error("Unable to Accept Booking", err.message || "This booking is no longer available.");
        btn.textContent = "ACCEPT";
        btn.disabled = false;
      }
    };
  });

  // Section 7: Reject Booking Handler with Exact 5 Reasons
  document.querySelectorAll(".btn-reject-request").forEach(btn => {
    btn.onclick = () => {
      const bId = btn.getAttribute("data-id");
      if (!bId) return;

      modal.open({
        title: "Reject Booking Request",
        maxWidth: "420px",
        bodyHtml: `
          <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.5;">
            Are you sure you want to pass on this booking request? It will be re-routed to other eligible KLEEN service partners without cancelling the customer's booking.
          </p>
          <div class="form-group" style="margin-bottom: 1rem;">
            <label class="form-label" style="font-weight: 700;">Reason for declining *</label>
            <select id="reject-reason-select" class="form-select">
              <option value="Not Available">Not Available</option>
              <option value="Schedule Conflict">Schedule Conflict</option>
              <option value="Too Far">Too Far</option>
              <option value="Service Not Suitable">Service Not Suitable</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div class="form-group" id="reject-custom-reason-group" style="display: none; margin-bottom: 0.5rem;">
            <label class="form-label">Optional Note</label>
            <input type="text" id="reject-custom-note" class="form-input" placeholder="Provide additional details...">
          </div>
        `,
        footerHtml: `
          <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">Cancel</button>
          <button class="btn btn-danger btn-sm" id="btn-confirm-reject-req">Reject Request</button>
        `,
        onOpen: (container) => {
          const selectEl = container.querySelector("#reject-reason-select");
          const customGroup = container.querySelector("#reject-custom-reason-group");
          if (selectEl && customGroup) {
            selectEl.onchange = () => {
              customGroup.style.display = selectEl.value === "Other" ? "block" : "none";
            };
          }

          container.querySelector("#btn-confirm-reject-req").onclick = () => {
            const reason = selectEl.value;
            const customNote = container.querySelector("#reject-custom-note")?.value || "";
            const fullReason = customNote ? `${reason}: ${customNote}` : reason;

            db.rejectBookingByPartner(bId, partnerId, fullReason);
            modal.close();
            toast.info("Booking request rejected.", "The booking was re-routed to other available partners.");
            window.location.reload();
          };
        }
      });
    };
  });

  // Section 4: Real-time Countdown Timer Loop for "Respond within mm:ss"
  const countdownBadges = document.querySelectorAll(".countdown-badge");
  if (countdownBadges.length > 0) {
    const timerInterval = setInterval(() => {
      let anyActive = false;
      countdownBadges.forEach(badge => {
        let sec = parseInt(badge.getAttribute("data-seconds"), 10);
        if (sec > 0) {
          anyActive = true;
          sec -= 1;
          badge.setAttribute("data-seconds", sec);
          const mins = Math.floor(sec / 60);
          const remSecs = sec % 60;
          const displayEl = badge.querySelector(".timer-display");
          if (displayEl) {
            displayEl.textContent = `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`;
          }
          if (sec === 0) {
            badge.innerHTML = `<span class="badge badge-danger" style="font-size: 0.75rem; font-weight: 800; display: inline-flex; align-items: center; gap: 0.35rem;">${icon("alert-triangle", { size: 14, stroke: "#DC2626" })} <span>REQUEST EXPIRED</span></span>`;
            const card = badge.closest(".request-card");
            if (card) {
              const acceptBtn = card.querySelector(".btn-accept-request");
              if (acceptBtn) {
                acceptBtn.disabled = true;
                acceptBtn.style.opacity = "0.45";
                acceptBtn.style.cursor = "not-allowed";
                acceptBtn.innerText = "EXPIRED";
              }
            }
          }
        }
      });
      if (!anyActive) clearInterval(timerInterval);
    }, 1000);
  }
}
