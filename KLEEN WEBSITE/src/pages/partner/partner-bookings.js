/**
 * KLEEN — Partner Bookings Management & 5-Stage Job Execution Workflow
 * 
 * 5-Stage Execution Progression:
 * 1. Accepting the Booking (CONFIRMED / SEARCHING_PARTNER -> PARTNER_ACCEPTED)
 * 2. On the Way (PARTNER_ACCEPTED -> ON_THE_WAY)
 * 3. Arrived (ON_THE_WAY -> ARRIVED)
 * 4. Service Started (ARRIVED -> SERVICE_STARTED)
 * 5. Service Completed (SERVICE_STARTED -> SERVICE_COMPLETED)
 */

import { auth } from "../../services/auth-service.js";
import { db } from "../../services/db-service.js";
import { modal } from "../../components/modal.js";
import { toast } from "../../components/toast.js";
import { icon } from "../../components/icons.js";
import { renderPartnerHeader, renderPartnerSidebar, renderPartnerMobileBottomNav, attachPartnerNavEvents } from "./partner-nav.js";

export function renderPartnerBookingsPage(bookingIdFilter = null) {
  const user = auth.getCurrentUser();
  if (!user || user.role !== "partner") {
    return `
      <div class="app-container" style="max-width: 480px; padding: 4rem 1rem; text-align: center;">
        <div class="solid-card smooth-card" style="padding: 2.5rem;">
          <h2>Partner Access Required</h2>
          <a href="#/partner/login" class="btn btn-primary btn-md">Sign In as Partner</a>
        </div>
      </div>
    `;
  }

  const partner = db.getPartnerById(user.userId) || user;
  const partnerId = partner.partnerId || user.userId;
  const snapshot = db.getSnapshot();
  const allBookings = snapshot.bookings || [];

  // Dedicated Route: /partner/bookings/requests
  if (bookingIdFilter === "requests") {
    return renderRequestsFeedPage(allBookings, partner);
  }

  // Dedicated Route: /partner/bookings/:bookingId
  if (bookingIdFilter && bookingIdFilter !== "requests") {
    const booking = allBookings.find(b => b.bookingId === bookingIdFilter);
    return renderBookingDetailPage(booking, partner);
  }

  // Default Route: /partner/bookings (All Bookings Hub)
  const myBookings = allBookings.filter(b => b.partnerId === partnerId);
  const pendingAvailable = allBookings.filter(b => (!b.partnerId || b.status === "SEARCHING_PARTNER") && b.status !== "CANCELLED");

  // Active Job in Progress (Milestones: PARTNER_ACCEPTED, ON_THE_WAY, ARRIVED, SERVICE_STARTED)
  const activeJob = myBookings.find(b => 
    ["PARTNER_ACCEPTED", "ON_THE_WAY", "ARRIVED", "SERVICE_STARTED"].includes(b.status)
  );

  return `
    <div class="partner-layout">
      ${renderPartnerSidebar("/partner/bookings")}

      <div class="partner-main-content">
        ${renderPartnerHeader("/partner/bookings", partner)}

        <div class="partner-dashboard-body" style="padding: 1.5rem 1rem 5rem;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem;">
            <div>
              <h2 style="font-size: 1.5rem; margin: 0; font-weight: 800;">My Bookings & Execution Hub</h2>
              <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0.25rem 0 0;">Manage your 5-stage cleaning service milestones and active executions</p>
            </div>
            <a href="#/partner/gigs" class="btn btn-primary btn-sm" style="font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem;">
              ${icon('calendar', { size: 14 })} Explore Gig Market
            </a>
          </div>

          <!-- Top Sticky Active Job Execution Card if a job is in progress -->
          ${activeJob ? renderActiveJobTopBanner(activeJob) : ""}

          <!-- Search & Filters Bar -->
          <div class="solid-card smooth-card" style="padding: 1rem 1.25rem; margin-bottom: 1.25rem; display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
            <input type="text" id="booking-search-input" class="form-input" placeholder="Search Booking ID, Service, or Customer..." style="flex: 1; min-width: 200px; height: 38px;">
            <select id="booking-filter-status" class="form-select" style="width: 170px; height: 38px;">
              <option value="ALL">All Statuses</option>
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="PARTNER_ACCEPTED">ACCEPTED</option>
              <option value="ON_THE_WAY">ON THE WAY</option>
              <option value="ARRIVED">ARRIVED</option>
              <option value="SERVICE_STARTED">SERVICE STARTED</option>
              <option value="SERVICE_COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <input type="date" id="booking-filter-date" class="form-input" style="width: 160px; height: 38px;">
          </div>

          <!-- Tabs: ALL, REQUESTS, UPCOMING, ACTIVE, COMPLETED, CANCELLED -->
          <div class="partner-tabs-container" style="display: flex; gap: 0.5rem; border-bottom: 2px solid #E5E7EB; margin-bottom: 1.5rem; overflow-x: auto; padding-bottom: 2px;">
            <button class="partner-tab-btn active" data-tab="all">ALL (${myBookings.length})</button>
            <button class="partner-tab-btn" data-tab="requests">REQUESTS (${pendingAvailable.length})</button>
            <button class="partner-tab-btn" data-tab="upcoming">UPCOMING</button>
            <button class="partner-tab-btn" data-tab="active">ACTIVE (${myBookings.filter(b => ["PARTNER_ACCEPTED", "ON_THE_WAY", "ARRIVED", "SERVICE_STARTED"].includes(b.status)).length})</button>
            <button class="partner-tab-btn" data-tab="completed">COMPLETED</button>
            <button class="partner-tab-btn" data-tab="cancelled">CANCELLED</button>
          </div>

          <!-- Bookings Feed List -->
          <div id="partner-bookings-list" style="display: flex; flex-direction: column; gap: 1rem;">
            ${renderBookingsListCards(myBookings, pendingAvailable, "all", partnerId)}
          </div>

        </div>

        ${renderPartnerMobileBottomNav("/partner/bookings")}
      </div>
    </div>
  `;
}

/**
 * Top banner for current active job execution
 */
function renderActiveJobTopBanner(job) {
  const nextAction = getNextMilestoneInfo(job);
  const netEarnings = Math.round((job.totalAmount || 499) * 0.80);

  return `
    <div class="active-job-top-banner animate-slide-up">
      <div style="display: flex; align-items: center; gap: 1rem; flex-wrap: wrap;">
        <div class="icon-box icon-box-md icon-box-emerald" style="background: rgba(255,255,255,0.18); border-color: rgba(255,255,255,0.3); color: #FFF;">
          ${nextAction.icon}
        </div>
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="execution-live-badge"><span class="pulse-dot"></span> ACTIVE EXECUTION</span>
            <span style="font-size: 0.775rem; color: #A7F3D0; font-weight: 700;">#${job.bookingId}</span>
            <span class="badge badge-warning" style="font-size: 0.7rem; padding: 0.2rem 0.5rem;">${formatStatus(job.status)}</span>
          </div>
          <h3 style="color: #FFFFFF; font-size: 1.2rem; margin: 0.25rem 0 0.15rem; font-weight: 800;">${job.serviceName}</h3>
          <p style="color: rgba(255,255,255,0.9); font-size: 0.825rem; margin: 0; display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
            <span style="display: inline-flex; align-items: center; gap: 0.3rem;">${icon('user', { size: 13, stroke: '#A7F3D0' })} ${job.customerName || 'Customer'}</span> • 
            <span style="display: inline-flex; align-items: center; gap: 0.3rem;">${icon('map-pin', { size: 13, stroke: '#A7F3D0' })} ${job.serviceAddress ? job.serviceAddress.split(',').slice(0, 2).join(', ') : 'Kerala'}</span> • 
            <span>₹${netEarnings} Net Earnings</span>
          </p>
        </div>
      </div>

      <div style="display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap;">
        ${nextAction.buttonHtml}
        <a href="#/partner/bookings/${job.bookingId}" class="btn btn-sm" style="background: rgba(255,255,255,0.2); color: #FFFFFF; border: 1px solid rgba(255,255,255,0.4); font-weight: 700;">
          EXECUTION DETAILS →
        </a>
      </div>
    </div>
  `;
}

/**
 * Returns icon, action label and button for the next lifecycle milestone
 */
function getNextMilestoneInfo(b) {
  const status = b.status || "CONFIRMED";

  if (!b.partnerId || status === "SEARCHING_PARTNER" || status === "CONFIRMED" || status === "PARTNER_REQUESTED") {
    return {
      icon: icon('file-text', { size: 20 }),
      label: "Accept Booking",
      buttonHtml: `<button class="btn btn-milestone-primary btn-sm btn-action-accept" data-id="${b.bookingId}">${icon('check', { size: 14 })} ACCEPT BOOKING</button>`
    };
  }

  if (status === "PARTNER_ACCEPTED" || status === "PARTNER_ASSIGNED") {
    return {
      icon: icon('navigation', { size: 20 }),
      label: "Start Trip",
      buttonHtml: `<button class="btn btn-milestone-primary btn-sm btn-action-start-trip" data-id="${b.bookingId}">${icon('navigation', { size: 14 })} START TRIP (ON THE WAY)</button>`
    };
  }

  if (status === "ON_THE_WAY") {
    return {
      icon: icon('map-pin', { size: 20 }),
      label: "Mark Arrived",
      buttonHtml: `<button class="btn btn-milestone-primary btn-sm btn-action-arrived" data-id="${b.bookingId}">${icon('map-pin', { size: 14 })} MARK ARRIVED</button>`
    };
  }

  if (status === "ARRIVED") {
    return {
      icon: icon('sparkles', { size: 20 }),
      label: "Start Service",
      buttonHtml: `<button class="btn btn-milestone-primary btn-sm btn-action-start-service" data-id="${b.bookingId}">${icon('sparkles', { size: 14 })} START SERVICE</button>`
    };
  }

  if (status === "SERVICE_STARTED") {
    return {
      icon: icon('badge-check', { size: 20 }),
      label: "Complete Service",
      buttonHtml: `<button class="btn btn-milestone-primary btn-sm btn-action-complete" data-id="${b.bookingId}">${icon('badge-check', { size: 14 })} COMPLETE SERVICE</button>`
    };
  }

  return {
    icon: icon('check', { size: 20 }),
    label: "Completed",
    buttonHtml: `<a href="#/partner/bookings/${b.bookingId}" class="btn btn-secondary btn-sm">VIEW DETAILS</a>`
  };
}

// Dedicated 5-Stage Booking Execution Definition
const executionStages = [
  {
    id: "ACCEPT",
    number: 1,
    title: "Accept Booking",
    subtitle: "Claim Assignment",
    iconName: "file-text"
  },
  {
    id: "ON_THE_WAY",
    number: 2,
    title: "On the Way",
    subtitle: "Travel to Address",
    iconName: "navigation"
  },
  {
    id: "ARRIVED",
    number: 3,
    title: "Arrived",
    subtitle: "At Customer Door",
    iconName: "map-pin"
  },
  {
    id: "SERVICE_STARTED",
    number: 4,
    title: "Service Started",
    subtitle: "Cleaning in Progress",
    iconName: "sparkles"
  },
  {
    id: "SERVICE_COMPLETED",
    number: 5,
    title: "Service Completed",
    subtitle: "Signed Off & Paid",
    iconName: "badge-check"
  }
];

function getExecutionStageIndex(status) {
  if (!status || status === "SEARCHING_PARTNER" || status === "CONFIRMED" || status === "PARTNER_REQUESTED") return 0;
  if (status === "PARTNER_ACCEPTED" || status === "PARTNER_ASSIGNED") return 1;
  if (status === "ON_THE_WAY") return 2;
  if (status === "ARRIVED") return 3;
  if (status === "SERVICE_STARTED") return 4;
  if (status === "SERVICE_COMPLETED" || status === "COMPLETED") return 5;
  return 0;
}

/**
 * 5-Stage Visual Stepper
 */
function renderExecutionStepper(currentStatus) {
  const currentStageIndex = getExecutionStageIndex(currentStatus);

  return `
    <div class="execution-stepper-container" style="margin-bottom: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
        <span style="font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: var(--brand-emerald-dark);">
          5-Stage Execution Progression
        </span>
        <span class="badge ${getStatusBadgeClass(currentStatus)}" style="font-size: 0.775rem;">
          ${formatStatus(currentStatus)}
        </span>
      </div>

      <div class="execution-stepper">
        ${executionStages.map((stage, idx) => {
          let stateClass = "upcoming";
          let circleContent = stage.number;

          if (currentStageIndex === 5) {
            stateClass = "completed";
            circleContent = icon('check', { size: 14 });
          } else if (idx < currentStageIndex) {
            stateClass = "completed";
            circleContent = icon('check', { size: 14 });
          } else if (idx === currentStageIndex) {
            stateClass = "active";
          }

          return `
            <div class="execution-step ${stateClass}">
              <div class="execution-step-circle">
                ${circleContent}
              </div>
              <div class="execution-step-title">${stage.title}</div>
              <div class="execution-step-sub">${stage.subtitle}</div>
            </div>
          `;
        }).join("")}
      </div>
    </div>
  `;
}

/**
 * Hero Execution Milestone Action Card
 */
function renderHeroActionCard(b) {
  const status = b.status || "CONFIRMED";
  const netEarnings = Math.round((b.totalAmount || 499) * 0.80);

  // 1. Stage 1: Accept Booking
  if (!b.partnerId || status === "SEARCHING_PARTNER" || status === "PARTNER_REQUESTED") {
    return `
      <div class="execution-hero-action-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
          <div>
            <span class="execution-live-badge"><span class="pulse-dot"></span> STEP 1 OF 5: ACCEPT BOOKING</span>
            <h3 style="color: #FFFFFF; font-size: 1.5rem; margin: 0.5rem 0 0.25rem; font-weight: 800;">New Booking Assignment</h3>
            <p style="color: rgba(255, 255, 255, 0.85); font-size: 0.9rem; margin: 0; max-width: 520px;">
              Review the schedule, service type, and address. Accept this job to claim it and lock in your earnings.
            </p>
          </div>
          <div style="text-align: right; background: rgba(255,255,255,0.15); padding: 0.75rem 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.25);">
            <span style="font-size: 0.75rem; color: #A7F3D0; text-transform: uppercase; font-weight: 700;">Partner Earnings (80%)</span>
            <div style="font-size: 1.6rem; font-weight: 900; color: #FFFFFF;">₹${netEarnings}</div>
          </div>
        </div>

        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
          <button class="btn-milestone-primary btn-action-accept" data-id="${b.bookingId}">
            ${icon('check', { size: 16 })} ACCEPT BOOKING NOW
          </button>
          <button class="btn btn-secondary btn-md btn-reject-request" data-id="${b.bookingId}" style="background: rgba(255,255,255,0.15); color: #FFF; border: 1px solid rgba(255,255,255,0.3); font-weight: 700;">
            DECLINE REQUEST
          </button>
        </div>
      </div>
    `;
  }

  // 2. Stage 2: On the Way (Start Trip)
  if (status === "PARTNER_ACCEPTED" || status === "PARTNER_ASSIGNED" || status === "CONFIRMED") {
    return `
      <div class="execution-hero-action-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
          <div>
            <span class="execution-live-badge"><span class="pulse-dot"></span> STEP 2 OF 5: ON THE WAY</span>
            <h3 style="color: #FFFFFF; font-size: 1.5rem; margin: 0.5rem 0 0.25rem; font-weight: 800;">Ready to Depart</h3>
            <p style="color: rgba(255, 255, 255, 0.85); font-size: 0.9rem; margin: 0; max-width: 540px;">
              You have accepted this booking! When you leave your location, tap <strong>Start Trip</strong> so the customer is notified in real time.
            </p>
          </div>
          <div style="text-align: right; background: rgba(255,255,255,0.15); padding: 0.75rem 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.25);">
            <span style="font-size: 0.75rem; color: #A7F3D0; text-transform: uppercase; font-weight: 700;">Service Scheduled</span>
            <div style="font-size: 1.15rem; font-weight: 800; color: #FFFFFF;">${b.bookingDate} • ${b.startTime}</div>
          </div>
        </div>

        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
          <button class="btn-milestone-primary btn-action-start-trip" data-id="${b.bookingId}">
            ${icon('navigation', { size: 16 })} START TRIP (ON THE WAY)
          </button>
          <a href="tel:${b.customerPhone || '9876543210'}" class="btn btn-md" style="background: rgba(255,255,255,0.2); color: #FFF; border: 1px solid rgba(255,255,255,0.35); font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem;">
            ${icon('phone', { size: 15 })} CALL CUSTOMER
          </a>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(b.serviceAddress || 'Kerala')}" target="_blank" class="btn btn-md" style="background: rgba(255,255,255,0.2); color: #FFF; border: 1px solid rgba(255,255,255,0.35); font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem;">
            ${icon('map-pin', { size: 15 })} NAVIGATE MAPS
          </a>
          <button class="btn btn-danger btn-md btn-action-cancel" data-id="${b.bookingId}" style="margin-left: auto;">
            CANCEL BOOKING
          </button>
        </div>
      </div>
    `;
  }

  // 3. Stage 3: Arrived
  if (status === "ON_THE_WAY") {
    return `
      <div class="execution-hero-action-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
          <div>
            <span class="execution-live-badge"><span class="pulse-dot"></span> STEP 3 OF 5: ARRIVED</span>
            <h3 style="color: #FFFFFF; font-size: 1.5rem; margin: 0.5rem 0 0.25rem; font-weight: 800;">En Route to Customer</h3>
            <p style="color: rgba(255, 255, 255, 0.85); font-size: 0.9rem; margin: 0; max-width: 540px;">
              Customer tracker shows you are traveling. Once you reach the gate or door, tap <strong>I Have Arrived</strong>.
            </p>
          </div>
          <div style="text-align: right; background: rgba(255,255,255,0.15); padding: 0.75rem 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.25);">
            <span style="font-size: 0.75rem; color: #A7F3D0; text-transform: uppercase; font-weight: 700;">Trip Started At</span>
            <div style="font-size: 1.15rem; font-weight: 800; color: #FFFFFF;">${b.tripStartedAt ? new Date(b.tripStartedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'In Transit'}</div>
          </div>
        </div>

        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
          <button class="btn-milestone-primary btn-action-arrived" data-id="${b.bookingId}">
            ${icon('map-pin', { size: 16 })} I HAVE ARRIVED
          </button>
          <a href="tel:${b.customerPhone || '9876543210'}" class="btn btn-md" style="background: rgba(255,255,255,0.2); color: #FFF; border: 1px solid rgba(255,255,255,0.35); font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem;">
            ${icon('phone', { size: 15 })} CALL CUSTOMER
          </a>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(b.serviceAddress || 'Kerala')}" target="_blank" class="btn btn-md" style="background: rgba(255,255,255,0.2); color: #FFF; border: 1px solid rgba(255,255,255,0.35); font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem;">
            ${icon('map-pin', { size: 15 })} VIEW ROUTE
          </a>
          <button class="btn btn-secondary btn-md btn-report-issue" data-id="${b.bookingId}" style="background: rgba(255,255,255,0.15); color: #FFF; border: 1px solid rgba(255,255,255,0.3); margin-left: auto;">
            REPORT ISSUE
          </button>
        </div>
      </div>
    `;
  }

  // 4. Stage 4: Ready to start service (Arrived state)
  if (status === "ARRIVED") {
    return `
      <div class="execution-hero-action-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
          <div>
            <span class="execution-live-badge"><span class="pulse-dot"></span> STEP 4 OF 5: SERVICE STARTED</span>
            <h3 style="color: #FFFFFF; font-size: 1.5rem; margin: 0.5rem 0 0.25rem; font-weight: 800;">At Service Location</h3>
            <p style="color: rgba(255, 255, 255, 0.85); font-size: 0.9rem; margin: 0; max-width: 540px;">
              You have arrived! Greet the customer, verify their requirements, and tap <strong>Start Service</strong> to begin the cleaning execution timer.
            </p>
          </div>
          <div style="text-align: right; background: rgba(255,255,255,0.15); padding: 0.75rem 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.25);">
            <span style="font-size: 0.75rem; color: #A7F3D0; text-transform: uppercase; font-weight: 700;">Arrived At</span>
            <div style="font-size: 1.15rem; font-weight: 800; color: #FFFFFF;">${b.arrivedAt ? new Date(b.arrivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'On Site'}</div>
          </div>
        </div>

        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
          <button class="btn-milestone-primary btn-action-start-service" data-id="${b.bookingId}">
            ${icon('sparkles', { size: 16 })} START SERVICE NOW
          </button>
          <a href="tel:${b.customerPhone || '9876543210'}" class="btn btn-md" style="background: rgba(255,255,255,0.2); color: #FFF; border: 1px solid rgba(255,255,255,0.35); font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem;">
            ${icon('phone', { size: 15 })} CALL CUSTOMER
          </a>
          <button class="btn btn-secondary btn-md btn-report-issue" data-id="${b.bookingId}" style="background: rgba(255,255,255,0.15); color: #FFF; border: 1px solid rgba(255,255,255,0.3); margin-left: auto;">
            REPORT ISSUE
          </button>
        </div>
      </div>
    `;
  }

  // 5. Stage 4 (Active): Service Started & Cleaning in progress
  if (status === "SERVICE_STARTED") {
    return `
      <div class="execution-hero-action-card">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
          <div>
            <span class="execution-live-badge"><span class="pulse-dot"></span> STEP 4 OF 5: IN PROGRESS</span>
            <h3 style="color: #FFFFFF; font-size: 1.5rem; margin: 0.5rem 0 0.25rem; font-weight: 800;">Cleaning Underway</h3>
            <p style="color: rgba(255, 255, 255, 0.85); font-size: 0.9rem; margin: 0; max-width: 540px;">
              Follow the checklist below. Once all cleaning tasks are complete and verified, tap <strong>Complete Service</strong>.
            </p>
          </div>
          
          <!-- Live Service Timer -->
          <div style="text-align: center; background: rgba(0,0,0,0.3); padding: 0.75rem 1.25rem; border-radius: 12px; border: 1px solid rgba(52, 211, 153, 0.45);">
            <span style="font-size: 0.75rem; color: #A7F3D0; text-transform: uppercase; font-weight: 700; display: flex; align-items: center; gap: 0.35rem; justify-content: center;">
              ${icon('clock', { size: 13, stroke: '#A7F3D0' })} Service Elapsed
            </span>
            <div id="service-timer-display" data-started="${b.serviceStartedAt || new Date().toISOString()}" style="font-size: 1.5rem; font-family: monospace; font-weight: 900; color: #34D399; margin-top: 0.2rem;">
              00:00:00
            </div>
          </div>
        </div>

        <!-- Cleaning Service Execution Checklist -->
        <div class="checklist-card" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.22); color: #FFFFFF; margin-bottom: 1.25rem;">
          <div style="font-size: 0.825rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #A7F3D0; margin-bottom: 0.75rem; display: flex; align-items: center; gap: 0.4rem;">
            ${icon('check', { size: 14 })} Cleaning Execution Checklist (Tap to check off)
          </div>
          <label class="checklist-item" style="color: #FFFFFF; border-bottom: 1px solid rgba(255,255,255,0.15); cursor: pointer;">
            <input type="checkbox" class="task-check" checked>
            <span>Initial walkthrough with customer & high-touch surface dusting</span>
          </label>
          <label class="checklist-item" style="color: #FFFFFF; border-bottom: 1px solid rgba(255,255,255,0.15); cursor: pointer;">
            <input type="checkbox" class="task-check" checked>
            <span>Kitchen & countertop degreasing and appliance exterior wipe-down</span>
          </label>
          <label class="checklist-item" style="color: #FFFFFF; border-bottom: 1px solid rgba(255,255,255,0.15); cursor: pointer;">
            <input type="checkbox" class="task-check">
            <span>Bathroom deep scrubbing, tile scaling & toilet disinfection</span>
          </label>
          <label class="checklist-item" style="color: #FFFFFF; border-bottom: 1px solid rgba(255,255,255,0.15); cursor: pointer;">
            <input type="checkbox" class="task-check">
            <span>Floor sweeping, vacuuming and eco-friendly mopping</span>
          </label>
          <label class="checklist-item" style="color: #FFFFFF; cursor: pointer;">
            <input type="checkbox" class="task-check">
            <span>Trash disposal, final customer satisfaction review & sign-off</span>
          </label>
        </div>

        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
          <button class="btn-milestone-primary btn-action-complete" data-id="${b.bookingId}">
            ${icon('badge-check', { size: 16 })} COMPLETE SERVICE & CLAIM ₹${netEarnings}
          </button>
          <button class="btn btn-secondary btn-md btn-report-issue" data-id="${b.bookingId}" style="background: rgba(255,255,255,0.15); color: #FFF; border: 1px solid rgba(255,255,255,0.3);">
            REPORT ISSUE
          </button>
        </div>
      </div>
    `;
  }

  // 6. Stage 5: Service Completed
  if (status === "SERVICE_COMPLETED" || status === "COMPLETED") {
    return `
      <div class="execution-hero-action-card" style="background: linear-gradient(135deg, #047857 0%, #065F46 100%);">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem;">
          <div>
            <span class="execution-live-badge" style="background: #059669; border-color: #34D399; color: #FFFFFF; display: inline-flex; align-items: center; gap: 0.35rem;">
              ${icon('check', { size: 12 })} STEP 5 OF 5: COMPLETED
            </span>
            <h3 style="color: #FFFFFF; font-size: 1.5rem; margin: 0.5rem 0 0.25rem; font-weight: 800; display: flex; align-items: center; gap: 0.5rem;">
              Service Completed & Paid! ${icon('badge-check', { size: 24, stroke: '#6EE7B7' })}
            </h3>
            <p style="color: rgba(255, 255, 255, 0.9); font-size: 0.9rem; margin: 0; max-width: 540px;">
              Great work! This service execution has completed and your payout has been credited to your KLEEN Earnings Ledger.
            </p>
          </div>
          <div style="text-align: right; background: rgba(255,255,255,0.2); padding: 0.75rem 1.25rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.3);">
            <span style="font-size: 0.75rem; color: #A7F3D0; text-transform: uppercase; font-weight: 700;">Earnings Credited</span>
            <div style="font-size: 1.6rem; font-weight: 900; color: #FFFFFF;">+ ₹${netEarnings}</div>
          </div>
        </div>

        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
          <a href="#/partner/earnings" class="btn btn-milestone-primary" style="display: inline-flex; align-items: center; gap: 0.4rem;">
            ${icon('indian-rupee', { size: 15 })} VIEW EARNINGS LEDGER
          </a>
          <a href="#/partner/bookings" class="btn btn-md" style="background: rgba(255,255,255,0.2); color: #FFF; border: 1px solid rgba(255,255,255,0.35); font-weight: 700;">
            VIEW ALL BOOKINGS
          </a>
          <button class="btn btn-secondary btn-md btn-report-issue" data-id="${b.bookingId}" style="background: rgba(255,255,255,0.15); color: #FFF; border: 1px solid rgba(255,255,255,0.3); margin-left: auto;">
            REPORT ISSUE
          </button>
        </div>
      </div>
    `;
  }

  return ``;
}

/**
 * Dedicated Booking Details Screen with 5-Stage Stepper & Context Actions
 */
function renderBookingDetailPage(b, partner) {
  if (!b) {
    return `
      <div class="app-container" style="max-width: 500px; padding: 4rem 1rem; text-align: center;">
        <div class="solid-card smooth-card" style="padding: 2rem;">
          <h3>Booking Not Found</h3>
          <p style="color: var(--text-muted);">The requested booking does not exist or has expired.</p>
          <a href="#/partner/bookings" class="btn btn-primary btn-sm">Back to Bookings</a>
        </div>
      </div>
    `;
  }

  const netEarnings = Math.round((b.totalAmount || 499) * 0.80);
  const platformFee = (b.totalAmount || 499) - netEarnings;

  return `
    <div class="partner-layout">
      ${renderPartnerSidebar("/partner/bookings")}

      <div class="partner-main-content">
        ${renderPartnerHeader("/partner/bookings", partner)}

        <div class="partner-dashboard-body" style="max-width: 860px; margin: 0 auto; padding: 2rem 1rem 5rem;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.5rem;">
            <div>
              <a href="#/partner/bookings" style="font-size: 0.85rem; color: var(--brand-emerald-dark); text-decoration: none; font-weight: 700;">← Back to Bookings</a>
              <h2 style="font-size: 1.65rem; margin: 0.35rem 0 0; font-weight: 800;">Booking #${b.bookingId}</h2>
            </div>
            <span class="badge ${getStatusBadgeClass(b.status)}" style="font-size: 0.85rem; padding: 0.4rem 0.8rem;">
              ${formatStatus(b.status)}
            </span>
          </div>

          <!-- 5-STAGE BOOKING EXECUTION STEPPER -->
          ${renderExecutionStepper(b.status)}

          <!-- HERO EXECUTION ACTION CARD (Next Milestone) -->
          ${renderHeroActionCard(b)}

          <!-- Main Booking Details Card -->
          <div class="solid-card smooth-card" style="padding: 2rem; margin-bottom: 1.5rem;">
            <div style="display: flex; gap: 1rem; align-items: flex-start; border-bottom: 1px solid #E5E7EB; padding-bottom: 1.25rem; margin-bottom: 1.25rem;">
              <img src="${b.serviceImage || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=160&q=80'}" alt="${b.serviceName}" style="width: 80px; height: 80px; border-radius: 12px; object-fit: cover;">
              <div>
                <h3 style="font-size: 1.35rem; margin: 0 0 0.25rem; font-weight: 800;">${b.serviceName}</h3>
                <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0; line-height: 1.4;">
                  ${b.serviceDescription || 'Professional home care & deep cleaning package delivered by verified KLEEN specialists.'}
                </p>
                <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.35rem;">
                  Duration: <strong>${b.duration || '2 hrs'}</strong> • Payment Status: <strong>PAID (Razorpay Secured)</strong>
                </div>
              </div>
            </div>

            <!-- Customer & Contact Info -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.25rem; margin-bottom: 1.5rem; font-size: 0.9rem;">
              <div style="background: #F9FAFB; padding: 1.15rem; border-radius: var(--radius-md); border: 1px solid #E5E7EB;">
                <span style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">Customer Contact Info</span>
                <div style="font-weight: 800; margin-top: 0.35rem; font-size: 1.05rem; display: flex; align-items: center; gap: 0.4rem;">
                  ${icon('user', { size: 16, stroke: 'var(--brand-emerald)' })} ${b.customerName || 'Customer'}
                </div>
                <div style="color: var(--brand-emerald-dark); font-weight: 700; margin-top: 0.35rem;">
                  <a href="tel:${b.customerPhone || '9876543210'}" style="color: inherit; text-decoration: none; display: flex; align-items: center; gap: 0.4rem;">
                    ${icon('phone', { size: 14 })} ${b.customerPhone || '+91 98765 43210'} (Tap to call)
                  </a>
                </div>
              </div>
              <div style="background: #F9FAFB; padding: 1.15rem; border-radius: var(--radius-md); border: 1px solid #E5E7EB;">
                <span style="color: var(--text-muted); font-size: 0.75rem; font-weight: 700; text-transform: uppercase;">Service Address</span>
                <div style="font-weight: 700; margin-top: 0.35rem; font-size: 0.95rem; display: flex; align-items: center; gap: 0.4rem;">
                  ${icon('map-pin', { size: 16, stroke: 'var(--brand-emerald)' })} ${b.serviceAddress || 'Location specified on confirmation'}
                </div>
                <div style="color: var(--text-secondary); margin-top: 0.35rem; display: flex; align-items: center; gap: 0.4rem;">
                  ${icon('calendar', { size: 14 })} <strong>${b.bookingDate}</strong> at <strong>${b.startTime}</strong>
                </div>
              </div>
            </div>

            ${b.customerNotes ? `
              <div style="margin-bottom: 1.5rem; background: #FEF3C7; color: #92400E; padding: 0.85rem 1rem; border-radius: var(--radius-sm); font-size: 0.875rem; border-left: 4px solid #F59E0B;">
                <strong>Special Customer Instructions:</strong> "${b.customerNotes}"
              </div>
            ` : ''}

            <!-- Estimated Earnings & Financial Breakdown -->
            <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem;">
              <div style="font-size: 0.8rem; text-transform: uppercase; color: #166534; font-weight: 700; margin-bottom: 0.5rem;">Financial Breakdown</div>
              <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.35rem;">
                <span>Total Customer Amount:</span>
                <strong>₹${b.totalAmount || 499}</strong>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.35rem; color: var(--text-muted);">
                <span>Platform Fee (20%):</span>
                <span>- ₹${platformFee}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: 800; color: #15803D; border-top: 1px solid #BBF7D0; padding-top: 0.5rem; margin-top: 0.5rem;">
                <span>Net Partner Payout (80%):</span>
                <span>₹${netEarnings}</span>
              </div>
            </div>

          </div>

        </div>

        ${renderPartnerMobileBottomNav("/partner/bookings")}
      </div>
    </div>
  `;
}

/**
 * List Cards for All Bookings view
 */
function renderBookingsListCards(myBookings, pendingAvailable, activeTab, partnerId) {
  let filtered = [];

  if (activeTab === "all") filtered = [...myBookings];
  else if (activeTab === "requests") filtered = [...pendingAvailable];
  else if (activeTab === "upcoming") filtered = myBookings.filter(b => b.status === "PARTNER_ACCEPTED" || b.status === "CONFIRMED" || b.status === "PARTNER_ASSIGNED");
  else if (activeTab === "active") filtered = myBookings.filter(b => ["ON_THE_WAY", "ARRIVED", "SERVICE_STARTED", "PARTNER_ACCEPTED"].includes(b.status));
  else if (activeTab === "completed") filtered = myBookings.filter(b => b.status === "SERVICE_COMPLETED" || b.status === "COMPLETED");
  else if (activeTab === "cancelled") filtered = myBookings.filter(b => b.status === "CANCELLED" || b.status === "PARTNER_CANCELLED");

  if (filtered.length === 0) {
    return `
      <div class="solid-card smooth-card" style="padding: 3rem 1.5rem; text-align: center;">
        <div class="icon-box icon-box-lg icon-box-slate" style="margin: 0 auto 0.75rem;">
          ${icon('calendar', { size: 28 })}
        </div>
        <h4 style="margin-bottom: 0.35rem; font-weight: 700;">No bookings found.</h4>
        <p style="color: var(--text-muted); font-size: 0.875rem;">Check other tabs or ensure your online status is turned on to receive new jobs.</p>
      </div>
    `;
  }

  return filtered.map(b => {
    const netEarnings = Math.round((b.totalAmount || 499) * 0.80);
    const stageIndex = getExecutionStageIndex(b.status);
    const nextAction = getNextMilestoneInfo(b);

    return `
      <div class="solid-card smooth-card booking-row-card" style="padding: 1.5rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; border-left: 4px solid ${b.status === 'SERVICE_STARTED' ? '#10B981' : (b.status === 'ON_THE_WAY' ? '#3B82F6' : '#E5E7EB')};">
        <div style="flex: 1; min-width: 260px;">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
            <span class="badge ${getStatusBadgeClass(b.status)}">${formatStatus(b.status)}</span>
            <span style="font-size: 0.775rem; color: var(--text-muted); font-weight: 600;">#${b.bookingId}</span>
            ${stageIndex > 0 && stageIndex < 5 ? `<span style="font-size: 0.72rem; color: #047857; background: #DCFCE7; padding: 0.15rem 0.45rem; border-radius: 4px; font-weight: 700;">Stage ${stageIndex}/5 Active</span>` : ''}
          </div>
          <h4 style="font-size: 1.15rem; margin: 0 0 0.25rem; font-weight: 800;">${b.serviceName}</h4>
          <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
            <span style="display: inline-flex; align-items: center; gap: 0.3rem;">${icon('calendar', { size: 13 })} ${b.bookingDate} at ${b.startTime}</span>
            <span style="display: inline-flex; align-items: center; gap: 0.3rem;">${icon('user', { size: 13 })} ${b.customerName || 'Customer'}</span>
          </div>
          <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem; display: flex; align-items: center; gap: 0.3rem;">
            ${icon('map-pin', { size: 13 })} ${b.serviceAddress || 'Kerala'}
          </div>
        </div>

        <div style="text-align: right; min-width: 160px;">
          <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Net Payout</div>
          <div style="font-size: 1.35rem; font-weight: 800; color: var(--brand-emerald-dark); margin-bottom: 0.5rem;">₹${netEarnings}</div>
          
          <div style="display: flex; gap: 0.4rem; justify-content: flex-end; flex-wrap: wrap;">
            ${b.status !== "SERVICE_COMPLETED" && b.status !== "COMPLETED" && b.status !== "CANCELLED" ? nextAction.buttonHtml : ''}
            <a href="#/partner/bookings/${b.bookingId}" class="btn btn-secondary btn-sm" style="font-weight: 700;">VIEW DETAILS</a>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

// Section 13: Booking Request Page (/partner/bookings/requests)
function renderRequestsFeedPage(allBookings, partner) {
  const partnerId = partner.partnerId || partner.userId;
  const pendingRequests = allBookings.filter(b => 
    (!b.partnerId || b.status === "SEARCHING_PARTNER" || b.partnerAssignmentStatus === "SEARCHING") &&
    b.status !== "CANCELLED" &&
    b.status !== "SERVICE_COMPLETED"
  );
  const acceptedRequests = allBookings.filter(b => b.partnerId === partnerId && (b.status === "PARTNER_ACCEPTED" || b.status === "PARTNER_ASSIGNED"));
  const rejectedRequests = allBookings.filter(b => b.lastRejectionReason && b.lastRejectionReason.includes(partnerId));
  const expiredRequests = allBookings.filter(b => b.status === "EXPIRED" || (b.status === "SEARCHING_PARTNER" && b.isExpired));
  const servicesList = Array.from(new Set(allBookings.map(b => b.serviceName).filter(Boolean)));

  return `
    <div class="partner-layout">
      ${renderPartnerSidebar("/partner/requests")}

      <div class="partner-main-content">
        ${renderPartnerHeader("/partner/requests", partner)}

        <div class="partner-dashboard-body" style="padding: 1.5rem 1rem 5rem;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem;">
            <div>
              <span class="badge badge-warning" style="margin-bottom: 0.35rem;">Real-time Dispatch</span>
              <h2 style="font-size: 1.65rem; margin: 0; font-weight: 800;">Booking Requests</h2>
              <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0.25rem 0 0;">New customer booking opportunities available in your service area</p>
            </div>
            <a href="#/partner/bookings" class="btn btn-secondary btn-sm">All Bookings →</a>
          </div>

          <!-- Search & Filters -->
          <div class="solid-card smooth-card" style="padding: 1rem 1.25rem; margin-bottom: 1.25rem; display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center;">
            <input type="text" id="requests-search-input" class="form-input" placeholder="Search Booking ID..." style="flex: 1; min-width: 180px; height: 38px;">
            <select id="requests-filter-service" class="form-select" style="width: auto; min-width: 160px; height: 38px;">
              <option value="ALL">All Services</option>
              ${servicesList.map(s => `<option value="${s}">${s}</option>`).join("")}
            </select>
            <input type="date" id="requests-filter-date" class="form-input" style="width: auto; height: 38px;">
            <input type="text" id="requests-filter-location" class="form-input" placeholder="Filter Area/City..." style="width: 160px; height: 38px;">
          </div>

          <!-- Tabs: NEW, EXPIRING, ACCEPTED, REJECTED, EXPIRED -->
          <div class="partner-tabs-container" style="display: flex; gap: 0.5rem; border-bottom: 2px solid #E5E7EB; margin-bottom: 1.5rem; overflow-x: auto; padding-bottom: 2px;">
            <button class="partner-tab-btn filter-req-btn active" data-reqfilter="new">NEW (${pendingRequests.length})</button>
            <button class="partner-tab-btn filter-req-btn" data-reqfilter="expiring">EXPIRING</button>
            <button class="partner-tab-btn filter-req-btn" data-reqfilter="accepted">ACCEPTED (${acceptedRequests.length})</button>
            <button class="partner-tab-btn filter-req-btn" data-reqfilter="rejected">REJECTED</button>
            <button class="partner-tab-btn filter-req-btn" data-reqfilter="expired">EXPIRED</button>
          </div>

          <div id="requests-feed-container">
            ${renderRequestsCardsList(pendingRequests, "new", partnerId, partner)}
          </div>

        </div>

        ${renderPartnerMobileBottomNav("/partner/requests")}
      </div>
    </div>
  `;
}

function renderRequestsCardsList(requests, activeReqFilter, partnerId, partner) {
  const isOnline = partner && partner.isOnline;

  if (!requests || requests.length === 0) {
    let emptyMsg = "No new booking requests.";
    let subMsg = "Switch online to start receiving live booking requests from nearby customers.";
    if (activeReqFilter === "expiring") {
      emptyMsg = "No expiring requests.";
      subMsg = "All requests currently have ample response time.";
    } else if (activeReqFilter === "accepted") {
      emptyMsg = "No accepted requests.";
      subMsg = "Accepted bookings will appear here and in your My Bookings feed.";
    } else if (activeReqFilter === "rejected") {
      emptyMsg = "No rejected requests.";
      subMsg = "You haven't declined any incoming requests recently.";
    } else if (activeReqFilter === "expired") {
      emptyMsg = "No expired requests.";
      subMsg = "No requests have expired past their response deadline.";
    }

    return `
      <div class="solid-card smooth-card" style="padding: 3rem 1.5rem; text-align: center;">
        <div class="icon-box icon-box-lg icon-box-slate" style="margin: 0 auto 0.75rem;">
          ${icon('bell', { size: 28 })}
        </div>
        <h4 style="margin-bottom: 0.35rem; font-weight: 700;">${emptyMsg}</h4>
        <p style="color: var(--text-muted); font-size: 0.875rem;">${subMsg}</p>
      </div>
    `;
  }

  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem;">
      ${requests.map((req, index) => {
        const estEarnings = Math.round((req.totalAmount || 499) * 0.80);
        const timerSec = activeReqFilter === "expiring" ? Math.max(10, 25 - (index * 5)) : (75 - (index * 10));
        const isExp = activeReqFilter === "expired" || timerSec <= 0;
        const isAcc = activeReqFilter === "accepted" || req.partnerId === partnerId;

        return `
          <div class="solid-card smooth-card request-card" style="padding: 1.5rem; border-top: 4px solid var(--brand-emerald);">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
              <div>
                <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Booking #${req.bookingId}</span>
                <h4 style="font-size: 1.1rem; margin: 0.15rem 0 0; font-weight: 800;">${req.serviceName}</h4>
              </div>
              <span class="badge badge-success" style="font-size: 0.9rem; font-weight: 700;">₹${estEarnings}</span>
            </div>

            <div style="font-size: 0.85rem; color: var(--text-secondary); display: flex; flex-direction: column; gap: 0.35rem; margin-bottom: 1.25rem;">
              <div style="display: inline-flex; align-items: center; gap: 0.4rem;">${icon('user', { size: 14 })} <strong>Customer:</strong> ${req.customerName || 'Customer'}</div>
              <div style="display: inline-flex; align-items: center; gap: 0.4rem;">${icon('calendar', { size: 14 })} <strong>Date:</strong> ${req.bookingDate} at ${req.startTime}</div>
              <div style="display: inline-flex; align-items: center; gap: 0.4rem;">${icon('clock', { size: 14 })} <strong>Duration:</strong> ${req.duration || '2 hrs'}</div>
              <div style="display: inline-flex; align-items: center; gap: 0.4rem;">${icon('map-pin', { size: 14 })} <strong>Location:</strong> ${req.serviceAddress ? req.serviceAddress.split(',').slice(-2).join(', ') : 'Kerala'}</div>
              ${!isAcc && !isExp ? `
                <div class="countdown-badge" data-seconds="${timerSec > 10 ? timerSec : 60}" style="font-size: 0.75rem; color: #D97706; font-weight: 700; background: #FEF3C7; padding: 0.2rem 0.5rem; border-radius: 4px; display: inline-flex; align-items: center; gap: 0.35rem; margin-top: 0.25rem;">
                  ${icon('clock', { size: 12 })} Respond within <span class="timer-display">${timerSec > 10 ? timerSec : 60}s</span>
                </div>
              ` : ''}
              ${isExp ? `
                <div style="font-size: 0.75rem; color: #DC2626; font-weight: 700; background: #FEE2E2; padding: 0.2rem 0.5rem; border-radius: 4px; display: inline-flex; align-items: center; gap: 0.35rem; margin-top: 0.25rem;">
                  ${icon('alert-triangle', { size: 12 })} REQUEST EXPIRED
                </div>
              ` : ''}
              ${isAcc ? `
                <div style="font-size: 0.75rem; color: #166534; font-weight: 700; background: #DCFCE7; padding: 0.2rem 0.5rem; border-radius: 4px; display: inline-flex; align-items: center; gap: 0.35rem; margin-top: 0.25rem;">
                  ${icon('check', { size: 12 })} ACCEPTED BY YOU
                </div>
              ` : ''}
            </div>

            <div style="display: flex; gap: 0.5rem;">
              <a href="#/partner/bookings/${req.bookingId}" class="btn btn-glass btn-sm" style="flex: 1; text-align: center; font-weight: 700;">VIEW</a>
              ${!isAcc && !isExp ? `
                <button class="btn btn-primary btn-sm btn-action-accept" data-id="${req.bookingId}" style="flex: 1.2; font-weight: 700;" ${!isOnline ? 'disabled title="Go online to accept"' : ''}>ACCEPT</button>
                <button class="btn btn-secondary btn-sm btn-reject-request" data-id="${req.bookingId}" style="flex: 1; font-weight: 700;">REJECT</button>
              ` : ''}
              ${isAcc ? `
                <a href="#/partner/bookings/${req.bookingId}" class="btn btn-primary btn-sm" style="flex: 1; text-align: center; font-weight: 700;">MANAGE JOB</a>
              ` : ''}
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function formatStatus(status) {
  if (!status) return "PENDING";
  if (status === "PARTNER_ACCEPTED") return "ACCEPTED";
  if (status === "ON_THE_WAY") return "ON THE WAY";
  if (status === "ARRIVED") return "ARRIVED";
  if (status === "SERVICE_STARTED") return "IN PROGRESS";
  if (status === "SERVICE_COMPLETED" || status === "COMPLETED") return "COMPLETED";
  return status.replace(/_/g, " ");
}

function getStatusBadgeClass(status) {
  if (status === "SERVICE_COMPLETED" || status === "COMPLETED") return "badge-success";
  if (status === "ON_THE_WAY" || status === "ARRIVED" || status === "SERVICE_STARTED") return "badge-warning";
  if (status === "CANCELLED" || status === "PARTNER_CANCELLED") return "badge-danger";
  return "badge-info";
}

export function attachPartnerBookingsEvents() {
  attachPartnerNavEvents();

  const user = auth.getCurrentUser();
  if (!user) return;
  const partnerId = user.userId;
  const partnerName = user.fullName || "Partner";

  // Clean up any existing service timers
  if (window._partnerServiceTimer) {
    clearInterval(window._partnerServiceTimer);
    window._partnerServiceTimer = null;
  }

  // Live Service Elapsed Timer (Stage 4)
  const timerElem = document.getElementById("service-timer-display");
  if (timerElem) {
    const startedIso = timerElem.getAttribute("data-started") || new Date().toISOString();
    const startTimeMs = new Date(startedIso).getTime();

    const updateTimer = () => {
      const nowMs = Date.now();
      const diffSec = Math.max(0, Math.floor((nowMs - startTimeMs) / 1000));
      const hours = Math.floor(diffSec / 3600);
      const mins = Math.floor((diffSec % 3600) / 60);
      const secs = diffSec % 60;
      timerElem.textContent = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    };

    updateTimer();
    window._partnerServiceTimer = setInterval(updateTimer, 1000);
  }

  // Task check item toggle (strikethrough)
  document.querySelectorAll(".task-check").forEach(chk => {
    chk.onchange = () => {
      const item = chk.closest(".checklist-item");
      if (item) {
        if (chk.checked) item.classList.add("checked");
        else item.classList.remove("checked");
      }
    };
  });

  // Booking Requests Filtering, Search & Tabs
  const reqTabs = document.querySelectorAll(".filter-req-btn");
  let currentReqFilter = "new";

  const getFilteredRequests = () => {
    const snapshot = db.getSnapshot();
    const allBookings = snapshot.bookings || [];
    const pending = allBookings.filter(b => 
      (!b.partnerId || b.status === "SEARCHING_PARTNER" || b.partnerAssignmentStatus === "SEARCHING") &&
      b.status !== "CANCELLED" &&
      b.status !== "SERVICE_COMPLETED"
    );
    const accepted = allBookings.filter(b => b.partnerId === partnerId && (b.status === "PARTNER_ACCEPTED" || b.status === "PARTNER_ASSIGNED"));
    const rejected = allBookings.filter(b => b.lastRejectionReason && b.lastRejectionReason.includes(partnerId));
    const expired = allBookings.filter(b => b.status === "EXPIRED" || (b.status === "SEARCHING_PARTNER" && b.isExpired));

    let pool = [];
    if (currentReqFilter === "new") pool = pending;
    else if (currentReqFilter === "expiring") pool = pending.slice(0, 2);
    else if (currentReqFilter === "accepted") pool = accepted;
    else if (currentReqFilter === "rejected") pool = rejected;
    else if (currentReqFilter === "expired") pool = expired;

    const q = (document.getElementById("requests-search-input")?.value || "").toLowerCase().trim();
    const srv = document.getElementById("requests-filter-service")?.value || "ALL";
    const dt = document.getElementById("requests-filter-date")?.value || "";
    const loc = (document.getElementById("requests-filter-location")?.value || "").toLowerCase().trim();

    return pool.filter(b => {
      if (q && !(b.bookingId && b.bookingId.toLowerCase().includes(q))) return false;
      if (srv !== "ALL" && b.serviceName !== srv) return false;
      if (dt && b.bookingDate !== dt) return false;
      if (loc && !(b.serviceAddress && b.serviceAddress.toLowerCase().includes(loc))) return false;
      return true;
    });
  };

  const updateRequestsFeed = () => {
    const container = document.getElementById("requests-feed-container");
    if (!container) return;
    const partner = db.getPartnerById(partnerId) || user;
    const filtered = getFilteredRequests();
    container.innerHTML = renderRequestsCardsList(filtered, currentReqFilter, partnerId, partner);
    attachActionListeners();
    initCountdownTimers();
  };

  reqTabs.forEach(btn => {
    btn.onclick = () => {
      reqTabs.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentReqFilter = btn.getAttribute("data-reqfilter") || "new";
      updateRequestsFeed();
    };
  });

  const reqSearch = document.getElementById("requests-search-input");
  const reqSrv = document.getElementById("requests-filter-service");
  const reqDt = document.getElementById("requests-filter-date");
  const reqLoc = document.getElementById("requests-filter-location");

  if (reqSearch) reqSearch.oninput = updateRequestsFeed;
  if (reqSrv) reqSrv.onchange = updateRequestsFeed;
  if (reqDt) reqDt.onchange = updateRequestsFeed;
  if (reqLoc) reqLoc.oninput = updateRequestsFeed;

  // Tab Filtering & Search for /partner/bookings
  const tabs = document.querySelectorAll(".partner-tab-btn:not(.filter-req-btn)");
  tabs.forEach(btn => {
    btn.onclick = () => {
      tabs.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const tab = btn.getAttribute("data-tab");
      const container = document.getElementById("partner-bookings-list");
      if (container) {
        const snapshot = db.getSnapshot();
        const allBookings = snapshot.bookings || [];
        const myBookings = allBookings.filter(b => b.partnerId === partnerId);
        const pending = allBookings.filter(b => (!b.partnerId || b.status === "SEARCHING_PARTNER") && b.status !== "CANCELLED");
        container.innerHTML = renderBookingsListCards(myBookings, pending, tab, partnerId);
        attachActionListeners();
      }
    };
  });

  const searchInput = document.getElementById("booking-search-input");
  const statusFilter = document.getElementById("booking-filter-status");
  const dateFilter = document.getElementById("booking-filter-date");

  const filterHandler = () => {
    const query = (searchInput?.value || "").toLowerCase().trim();
    const stVal = statusFilter?.value || "ALL";
    const dateVal = dateFilter?.value || "";

    const snapshot = db.getSnapshot();
    let bookings = (snapshot.bookings || []).filter(b => b.partnerId === partnerId);

    if (query) {
      bookings = bookings.filter(b => 
        (b.bookingId && b.bookingId.toLowerCase().includes(query)) ||
        (b.serviceName && b.serviceName.toLowerCase().includes(query)) ||
        (b.customerName && b.customerName.toLowerCase().includes(query))
      );
    }
    if (stVal !== "ALL") {
      bookings = bookings.filter(b => b.status === stVal);
    }
    if (dateVal) {
      bookings = bookings.filter(b => b.bookingDate === dateVal);
    }

    const container = document.getElementById("partner-bookings-list");
    if (container) {
      container.innerHTML = renderBookingsListCards(bookings, [], "all", partnerId);
      attachActionListeners();
    }
  };

  if (searchInput) searchInput.oninput = filterHandler;
  if (statusFilter) statusFilter.onchange = filterHandler;
  if (dateFilter) dateFilter.onchange = filterHandler;

  // Countdown timer helper
  const initCountdownTimers = () => {
    const badges = document.querySelectorAll(".countdown-badge");
    badges.forEach(badge => {
      if (badge._hasTimer) return;
      badge._hasTimer = true;
      let sec = parseInt(badge.getAttribute("data-seconds"), 10) || 60;
      const interval = setInterval(() => {
        sec -= 1;
        badge.setAttribute("data-seconds", sec);
        const mins = Math.floor(sec / 60);
        const rem = sec % 60;
        const display = badge.querySelector(".timer-display");
        if (display) {
          display.textContent = `${String(mins).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
        }
        if (sec <= 0) {
          clearInterval(interval);
          badge.innerHTML = `<span class="badge badge-danger" style="font-size:0.75rem; display: inline-flex; align-items: center; gap: 0.25rem;">${icon('alert-triangle', { size: 12 })} REQUEST EXPIRED</span>`;
          const card = badge.closest(".request-card");
          if (card) {
            const accBtn = card.querySelector(".btn-action-accept");
            if (accBtn) {
              accBtn.disabled = true;
              accBtn.style.opacity = "0.5";
              accBtn.style.pointerEvents = "none";
              accBtn.innerText = "EXPIRED";
            }
          }
        }
      }, 1000);
    });
  };

  const attachActionListeners = () => {
    // 1. Stage 1: Accept Booking
    document.querySelectorAll(".btn-action-accept").forEach(btn => {
      btn.onclick = () => {
        const bId = btn.getAttribute("data-id");
        btn.textContent = "Accepting...";
        btn.disabled = true;
        try {
          db.acceptBookingAtomically(bId, partnerId, partnerName);
          toast.success("Booking Accepted!", `Assigned to booking #${bId}. Proceed to Start Trip when ready.`);
          window.location.hash = `#/partner/bookings/${bId}`;
          window.location.reload();
        } catch (err) {
          toast.error("Notice", err.message || "Failed to accept booking.");
          btn.textContent = "ACCEPT";
          btn.disabled = false;
        }
      };
    });

    // 2. Decline / Reject Booking
    document.querySelectorAll(".btn-reject-request").forEach(btn => {
      btn.onclick = () => {
        const bId = btn.getAttribute("data-id");
        modal.open({
          title: "Decline Booking Request?",
          maxWidth: "440px",
          bodyHtml: `
            <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1rem;">
              Please select a reason for declining booking #${bId}:
            </p>
            <div class="form-group" style="margin-bottom: 1rem;">
              <label class="form-label" style="font-weight: 600;">Reason *</label>
              <select id="reject-reason-select" class="form-select">
                <option value="Not Available">Not Available</option>
                <option value="Schedule Conflict">Schedule Conflict</option>
                <option value="Too Far">Too Far</option>
                <option value="Service Not Suitable">Service Not Suitable</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Optional Comments</label>
              <textarea id="reject-reason-notes" class="form-textarea" placeholder="Add additional details..." rows="2"></textarea>
            </div>
          `,
          footerHtml: `
            <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">CANCEL</button>
            <button class="btn btn-danger btn-sm" id="btn-confirm-decline-job">DECLINE BOOKING</button>
          `,
          onOpen: (container) => {
            container.querySelector("#btn-confirm-decline-job").onclick = () => {
              const reason = container.querySelector("#reject-reason-select").value;
              const notes = container.querySelector("#reject-reason-notes")?.value || "";
              const fullReason = `${partnerId}: ${reason}${notes ? ` - ${notes}` : ""}`;
              db.rejectBookingByPartner(bId, partnerId, fullReason);
              modal.close();
              toast.info("Request Declined", "The booking was re-routed to other partners.");
              window.location.reload();
            };
          }
        });
      };
    });

    // 3. Stage 2: Start Trip (On the Way)
    document.querySelectorAll(".btn-action-start-trip").forEach(btn => {
      btn.onclick = () => {
        const bId = btn.getAttribute("data-id");
        modal.open({
          title: "Start Trip — On the Way",
          maxWidth: "420px",
          bodyHtml: `
            <p style="font-size: 0.95rem; color: var(--text-primary); margin-bottom: 0.5rem;">
              Are you departing now for booking <strong>#${bId}</strong>?
            </p>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              The customer will receive an instant notification that you are on the way to their address.
            </p>
          `,
          footerHtml: `
            <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">NOT YET</button>
            <button class="btn btn-milestone-primary btn-sm" id="btn-confirm-start-trip">YES, I'M ON THE WAY</button>
          `,
          onOpen: (container) => {
            container.querySelector("#btn-confirm-start-trip").onclick = () => {
              modal.close();
              db.startTrip(bId, partnerId);
              toast.success("Trip Started!", "Customer has been notified that you are en route.");
              window.location.reload();
            };
          }
        });
      };
    });

    // 4. Stage 3: Arrived
    document.querySelectorAll(".btn-action-arrived").forEach(btn => {
      btn.onclick = () => {
        const bId = btn.getAttribute("data-id");
        modal.open({
          title: "Confirm Arrival",
          maxWidth: "420px",
          bodyHtml: `
            <p style="font-size: 0.95rem; color: var(--text-primary); margin-bottom: 0.5rem;">
              Have you arrived at the customer's location for booking <strong>#${bId}</strong>?
            </p>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              This will notify the customer that you are at their doorstep.
            </p>
          `,
          footerHtml: `
            <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">CANCEL</button>
            <button class="btn btn-milestone-primary btn-sm" id="btn-confirm-arrived">I HAVE ARRIVED</button>
          `,
          onOpen: (container) => {
            container.querySelector("#btn-confirm-arrived").onclick = () => {
              modal.close();
              db.markArrived(bId, partnerId);
              toast.success("Arrived at Destination!", "Customer notified. Greet the customer and start service.");
              window.location.reload();
            };
          }
        });
      };
    });

    // 5. Stage 4: Start Service
    document.querySelectorAll(".btn-action-start-service").forEach(btn => {
      btn.onclick = () => {
        const bId = btn.getAttribute("data-id");
        modal.open({
          title: "Start Cleaning Service",
          maxWidth: "420px",
          bodyHtml: `
            <p style="font-size: 0.95rem; color: var(--text-primary); margin-bottom: 0.5rem;">
              Ready to begin cleaning for booking <strong>#${bId}</strong>?
            </p>
            <p style="font-size: 0.85rem; color: var(--text-muted);">
              This will update customer tracking to 'In Progress' and initiate the live service execution timer.
            </p>
          `,
          footerHtml: `
            <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">NOT YET</button>
            <button class="btn btn-milestone-primary btn-sm" id="btn-confirm-start-service">START SERVICE NOW</button>
          `,
          onOpen: (container) => {
            container.querySelector("#btn-confirm-start-service").onclick = () => {
              modal.close();
              db.startService(bId, partnerId);
              toast.success("Service Started!", "Service timer initiated.");
              window.location.reload();
            };
          }
        });
      };
    });

    // 6. Stage 5: Complete Service
    document.querySelectorAll(".btn-action-complete").forEach(btn => {
      btn.onclick = () => {
        const bId = btn.getAttribute("data-id");
        const booking = db.getBookingById(bId);
        const netEarnings = Math.round(((booking ? booking.totalAmount : 499) || 499) * 0.80);

        modal.open({
          title: "Complete Cleaning Service",
          maxWidth: "460px",
          bodyHtml: `
            <div style="text-align: center; margin-bottom: 1.25rem;">
              <div class="icon-box icon-box-lg icon-box-emerald" style="margin: 0 auto 0.75rem;">
                ${icon('badge-check', { size: 36 })}
              </div>
              <h4 style="font-size: 1.25rem; margin: 0; font-weight: 800;">Sign Off & Complete Service</h4>
              <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.25rem;">
                Confirm that all cleaning tasks for booking #${bId} are complete.
              </p>
            </div>

            <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 10px; padding: 1rem; margin-bottom: 1rem;">
              <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.35rem;">
                <span style="color: #166534; font-weight: 600;">Net Payout Credited:</span>
                <span style="color: #15803D; font-weight: 800; font-size: 1.15rem;">₹${netEarnings}</span>
              </div>
              <p style="font-size: 0.775rem; color: #166534; margin: 0;">
                Funds will be deposited into your verified bank account according to your settlement schedule.
              </p>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-size: 0.85rem; font-weight: 600;">Partner Completion Notes (Optional)</label>
              <textarea id="completion-notes" class="form-textarea" placeholder="e.g., Completed all living room & bathroom deep cleaning. Customer satisfied." rows="2"></textarea>
            </div>
          `,
          footerHtml: `
            <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">GO BACK</button>
            <button class="btn btn-success btn-sm" id="btn-confirm-complete-job" style="background:#15803D; color:#FFF; font-weight: 800; padding: 0.6rem 1.25rem;">
              COMPLETE & CLAIM PAYOUT
            </button>
          `,
          onOpen: (container) => {
            container.querySelector("#btn-confirm-complete-job").onclick = () => {
              try {
                db.completeService(bId, partnerId);
                modal.close();
                toast.success("Job Completed!", `₹${netEarnings} has been credited to your earnings ledger.`);
                window.location.hash = "#/partner/earnings";
                window.location.reload();
              } catch (err) {
                toast.error("Error", err.message || "Could not complete service.");
              }
            };
          }
        });
      };
    });

    // 7. Cancel Booking
    document.querySelectorAll(".btn-action-cancel").forEach(btn => {
      btn.onclick = () => {
        const bId = btn.getAttribute("data-id");
        modal.open({
          title: "Cancel Booking",
          maxWidth: "440px",
          bodyHtml: `
            <p style="font-size: 0.95rem; margin-bottom: 1rem;">Are you sure you want to cancel booking #${bId}?</p>
            <div class="form-group">
              <label class="form-label">Cancellation Reason *</label>
              <textarea id="cancel-reason-input" class="form-textarea" placeholder="Please provide your reason..." required></textarea>
            </div>
          `,
          footerHtml: `
            <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">KEEP BOOKING</button>
            <button class="btn btn-danger btn-sm" id="btn-confirm-cancel-job">CANCEL BOOKING</button>
          `,
          onOpen: (container) => {
            container.querySelector("#btn-confirm-cancel-job").onclick = () => {
              const reason = container.querySelector("#cancel-reason-input").value.trim();
              if (!reason) {
                toast.error("Reason Required", "Please specify why you are cancelling.");
                return;
              }
              try {
                db.cancelBookingByPartner(bId, partnerId, reason);
                modal.close();
                toast.warning("Booking Cancelled", `Booking #${bId} cancelled.`);
                window.location.hash = "#/partner/bookings";
                window.location.reload();
              } catch (err) {
                toast.error("Error", err.message || "Failed to cancel booking.");
              }
            };
          }
        });
      };
    });

    // 8. Report Issue
    document.querySelectorAll(".btn-report-issue").forEach(btn => {
      btn.onclick = () => {
        const bId = btn.getAttribute("data-id");
        modal.open({
          title: "Report an Issue",
          maxWidth: "480px",
          bodyHtml: `
            <div style="background: #F3F4F6; padding: 0.6rem 0.85rem; border-radius: var(--radius-sm); margin-bottom: 1rem; font-size: 0.85rem;">
              <strong>Booking ID:</strong> <span style="color: var(--brand-emerald-dark); font-weight: 700;">#${bId}</span>
            </div>
            <div class="form-group" style="margin-bottom: 0.85rem;">
              <label class="form-label">Issue Type *</label>
              <select id="issue-type-select" class="form-select">
                <option value="Customer Not Available">Customer Not Available</option>
                <option value="Address Inaccurate">Address Inaccurate</option>
                <option value="Service Scope Mismatch">Service Scope Mismatch</option>
                <option value="Safety or Access Issue">Safety or Access Issue</option>
                <option value="Technical Issue">Technical Issue</option>
                <option value="Other">Other Issue</option>
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 0.85rem;">
              <label class="form-label">Description *</label>
              <textarea id="issue-desc-text" class="form-textarea" placeholder="Provide details of the issue..." rows="3" required></textarea>
            </div>
          `,
          footerHtml: `
            <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">CANCEL</button>
            <button class="btn btn-danger btn-sm" id="btn-submit-issue">SUBMIT ISSUE</button>
          `,
          onOpen: (container) => {
            container.querySelector("#btn-submit-issue").onclick = () => {
              const category = container.querySelector("#issue-type-select").value;
              const desc = container.querySelector("#issue-desc-text").value.trim();

              if (!desc) {
                toast.error("Description Required", "Please enter issue description.");
                return;
              }
              db.createPartnerTicket({
                partnerId,
                subject: `Issue on Booking #${bId}: ${category}`,
                category,
                description: desc,
                bookingId: bId
              });
              modal.close();
              toast.success("Issue Submitted", "Admin notified of your report.");
            };
          }
        });
      };
    });
  };

  attachActionListeners();
  initCountdownTimers();
}
