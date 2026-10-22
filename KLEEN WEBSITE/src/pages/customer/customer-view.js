/**
 * KLEEN — Customer Interface
 * Active booking tracking timeline, multi-step booking wizard, address management, and ratings.
 */

import { db } from "../../services/db-service.js";
import { auth } from "../../services/auth-service.js";
import { payment } from "../../services/payment-service.js";
import { modal } from "../../components/modal.js";
import { toast } from "../../components/toast.js";
import { initLocationPicker, renderBookingTrackerMap } from "../../services/maps-service.js";
import { icon } from "../../components/icons.js";
import { renderDistrictOptions, DEFAULT_STATE, DEFAULT_DISTRICT } from "../../config/kerala-districts.js";


export function renderCustomerView() {
  const user = auth.getCurrentUser();
  const bookings = db.getBookings();

  // Match current user's bookings, or if demo customer/admin, include matching
  const myBookings = user 
    ? bookings.filter(b => b.customerId === user.userId || (user.email && b.customerEmail === user.email) || (user.userId === "usr_cust_rahul" && b.customerId === "usr_cust_rahul"))
    : bookings.filter(b => b.customerId === "usr_cust_rahul");

  // Separate into Live / Active bookings and Previous / Completed bookings
  const liveBookings = myBookings.filter(b => 
    !["SERVICE_COMPLETED", "CUSTOMER_CANCELLED", "CLOSED"].includes(b.bookingStatus)
  );

  const previousBookings = myBookings.filter(b => 
    ["SERVICE_COMPLETED", "CUSTOMER_CANCELLED", "CLOSED"].includes(b.bookingStatus)
  );

  return `
    <div class="app-container" style="padding: 2.5rem 1rem 5rem; max-width: 1040px; margin: 0 auto;">
      <!-- Page Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
            <span class="badge badge-info" style="font-size: 0.725rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Bookings Hub</span>
          </div>
          <h1 style="margin: 0; font-size: 1.85rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.5px;">My Bookings</h1>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0.35rem 0 0;">Track live active services in real time and view your past service history.</p>
        </div>
        <a href="#/services" class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.6rem 1.25rem; border-radius: 9999px; font-weight: 700; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);">
          <span>+ Book New Service</span>
        </a>
      </div>

      <!-- SECTION 1: LIVE BOOKINGS -->
      <section style="margin-bottom: 3.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h2 style="font-size: 1.35rem; font-weight: 700; margin: 0; color: var(--text-primary); display: flex; align-items: center; gap: 0.65rem;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #10B981; box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);"></span>
            <span>Live & In-Progress Services</span>
            <span class="badge badge-success" style="font-size: 0.75rem; padding: 0.2rem 0.55rem;">${liveBookings.length} Active</span>
          </h2>
        </div>

        ${liveBookings.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 1.75rem;">
            ${liveBookings.map(b => renderActiveBookingTracker(b)).join("")}
          </div>
        ` : `
          <div class="glass-card" style="padding: 3rem 2rem; text-align: center; background: #FFFFFF; border: 1.5px dashed #CBD5E1; border-radius: var(--radius-lg); box-shadow: 0 4px 15px rgba(0,0,0,0.02);">
            <div style="width: 56px; height: 56px; border-radius: 50%; background: rgba(16, 185, 129, 0.08); display: flex; align-items: center; justify-content: center; color: var(--brand-emerald); margin: 0 auto 1rem;">
              ${icon("broom", { size: 28, stroke: "var(--brand-emerald)" })}
            </div>
            <h3 style="margin-bottom: 0.4rem; font-size: 1.2rem; font-weight: 700; color: var(--text-primary);">No Live Bookings Right Now</h3>
            <p style="color: var(--text-muted); max-width: 440px; margin: 0 auto 1.5rem; font-size: 0.875rem; line-height: 1.5;">
              You have no services currently in progress or scheduled for today. Book a verified maid specialist or deep cleaning expert whenever you need.
            </p>
            <a href="#/services" class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; gap: 0.45rem; padding: 0.55rem 1.25rem; border-radius: 9999px;">
              <span>Explore Home Services</span> →
            </a>
          </div>
        `}
      </section>

      <!-- SECTION 2: PREVIOUS BOOKINGS & SERVICE HISTORY -->
      <section>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h2 style="font-size: 1.35rem; font-weight: 700; margin: 0; color: var(--text-primary); display: flex; align-items: center; gap: 0.65rem;">
            <span style="display: inline-flex; align-items: center; gap: 0.45rem;">${icon("clipboard", { size: 18, stroke: "var(--brand-emerald)" })} Previous Bookings & Service History</span>
            <span class="badge badge-info" style="font-size: 0.75rem; padding: 0.2rem 0.55rem;">${previousBookings.length} Completed</span>
          </h2>
        </div>

        ${previousBookings.length > 0 ? `
          <div class="solid-card" style="padding: 0; background: #FFFFFF; border-radius: var(--radius-lg); overflow: hidden; border: 1px solid #E2E8F0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
            <div class="table-responsive">
              <table class="kleen-table" style="margin: 0; width: 100%;">
                <thead>
                  <tr style="background: #F8FAFC; border-bottom: 1px solid #E2E8F0;">
                    <th style="padding: 1rem 1.25rem; font-weight: 700; font-size: 0.8rem; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Booking ID</th>
                    <th style="padding: 1rem 1.25rem; font-weight: 700; font-size: 0.8rem; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Service</th>
                    <th style="padding: 1rem 1.25rem; font-weight: 700; font-size: 0.8rem; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Date & Time</th>
                    <th style="padding: 1rem 1.25rem; font-weight: 700; font-size: 0.8rem; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Service Partner</th>
                    <th style="padding: 1rem 1.25rem; font-weight: 700; font-size: 0.8rem; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Amount Paid</th>
                    <th style="padding: 1rem 1.25rem; font-weight: 700; font-size: 0.8rem; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">Status</th>
                    <th style="padding: 1rem 1.25rem; font-weight: 700; font-size: 0.8rem; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; text-align: right;">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${previousBookings.map(b => `
                    <tr style="border-bottom: 1px solid #F1F5F9; transition: background 0.15s;">
                      <td style="padding: 1rem 1.25rem; font-weight: 700; color: var(--brand-emerald-dark); font-size: 0.85rem;">
                        #${b.bookingId}
                      </td>
                      <td style="padding: 1rem 1.25rem;">
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                          <img src="${b.serviceImage || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=80&q=80'}" alt="${b.serviceName}" style="width: 42px; height: 42px; border-radius: 8px; object-fit: cover; border: 1px solid #E2E8F0;">
                          <div>
                            <div style="font-weight: 700; font-size: 0.9rem; color: var(--text-primary);">${b.serviceName}</div>
                            <div style="font-size: 0.775rem; color: var(--text-muted); margin-top: 2px;">${b.address || 'Kochi'}</div>
                          </div>
                        </div>
                      </td>
                      <td style="padding: 1rem 1.25rem; font-size: 0.85rem; color: #334155;">
                        <div style="font-weight: 600;">${b.bookingDate}</div>
                        <div style="font-size: 0.775rem; color: var(--text-muted);">${b.startTime}</div>
                      </td>
                      <td style="padding: 1rem 1.25rem;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                          <img src="${b.partnerImage || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=60&q=80'}" alt="${b.partnerName || 'Partner'}" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover;">
                          <span style="font-weight: 600; font-size: 0.85rem; color: #1E293B;">${b.partnerName || 'Assigned Specialist'}</span>
                        </div>
                      </td>
                      <td style="padding: 1rem 1.25rem; font-weight: 800; font-size: 0.95rem; color: var(--brand-emerald-dark);">
                        ₹${b.totalAmount}
                      </td>
                      <td style="padding: 1rem 1.25rem;">
                        <span class="badge ${b.bookingStatus === 'SERVICE_COMPLETED' ? 'badge-success' : 'badge-neutral'}" style="font-size: 0.725rem; font-weight: 700;">
                          ${b.bookingStatus === 'SERVICE_COMPLETED' ? 'COMPLETED' : b.bookingStatus}
                        </span>
                      </td>
                      <td style="padding: 1rem 1.25rem; text-align: right;">
                        <div style="display: inline-flex; gap: 0.4rem;">
                          <button class="btn btn-secondary btn-sm btn-rate-booking" data-id="${b.bookingId}" data-partner-id="${b.partnerId || ''}" data-service-id="${b.serviceId}" style="font-size: 0.775rem; padding: 0.35rem 0.75rem;">
                            <span style="display: inline-flex; align-items: center; gap: 0.25rem;">${icon("star", { size: 13, fill: "#D97706", stroke: "#D97706" })} Rate</span>
                          </button>
                          <button class="btn btn-glass btn-sm btn-complain-booking" data-id="${b.bookingId}" style="font-size: 0.775rem; padding: 0.35rem 0.75rem;">
                            Help
                          </button>
                        </div>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          </div>
        ` : `
          <div class="glass-card" style="padding: 2.5rem 1.5rem; text-align: center; background: #FFFFFF; border: 1.5px dashed #CBD5E1; border-radius: var(--radius-lg);">
            <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0;">No completed or past bookings found yet.</p>
          </div>
        `}
      </section>
    </div>
  `;
}

function renderActiveBookingTracker(b) {
  const steps = [
    { key: "CONFIRMED", label: "Confirmed" },
    { key: "PARTNER_ACCEPTED", label: "Partner Assigned" },
    { key: "ON_THE_WAY", label: "On The Way" },
    { key: "ARRIVED", label: "Arrived" },
    { key: "SERVICE_STARTED", label: "In Progress" },
    { key: "SERVICE_COMPLETED", label: "Completed" }
  ];

  const statusWeights = {
    "PAYMENT_PENDING": 0,
    "CONFIRMED": 1,
    "SEARCHING_PARTNER": 1,
    "PARTNER_REQUESTED": 1,
    "PARTNER_ACCEPTED": 2,
    "PARTNER_ASSIGNED": 2,
    "ON_THE_WAY": 3,
    "ARRIVED": 4,
    "SERVICE_STARTED": 5,
    "SERVICE_COMPLETED": 6
  };

  const currentWeight = statusWeights[b.bookingStatus] || 1;
  const progressPercent = Math.min(100, Math.round(((currentWeight - 1) / (steps.length - 1)) * 100));

  return `
    <div class="booking-tracker-card animate-slide-up">
      <div class="tracker-header">
        <div>
          <div style="display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.35rem;">
            <span class="badge badge-info">LIVE SERVICE TRACKING</span>
            <span style="font-size: 0.85rem; color: var(--text-muted);">Booking #${b.bookingId}</span>
          </div>
          <h3 style="font-size: 1.45rem;">${b.serviceName}</h3>
          <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.25rem;">
            Scheduled: <strong>${b.bookingDate} at ${b.startTime}</strong> • Location: <em>${b.serviceAddress}</em>
          </p>
        </div>
        <div style="text-align: right;">
          <span style="font-size: 0.775rem; color: var(--text-muted); text-transform: uppercase;">Amount Paid</span>
          <h3 style="color: var(--brand-emerald-dark); font-size: 1.5rem;">₹${b.totalAmount}</h3>
          <span class="badge badge-success" style="margin-top: 0.25rem;">Razorpay Verified</span>
        </div>
      </div>

      <!-- Liquid Animated Timeline -->
      <div class="tracker-timeline">
        <div class="timeline-track">
          <div class="timeline-progress" style="width: ${progressPercent}%;"></div>
        </div>

        ${steps.map((s, idx) => {
          const stepWeight = idx + 1;
          const isCompleted = currentWeight > stepWeight;
          const isActive = currentWeight === stepWeight;

          return `
            <div class="timeline-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}">
              <div class="step-circle">
                ${isCompleted ? icon('check', { size: 14, stroke: '#FFFFFF', strokeWidth: 3 }) : (idx + 1)}
              </div>
              <span class="step-label">${s.label}</span>
            </div>
          `;
        }).join("")}
      </div>

      <!-- Assigned Partner Card -->
      <div class="assigned-partner-box">
        <div style="display: flex; align-items: center; gap: 1rem;">
          <img src="${b.partnerImage || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80'}" alt="Partner" class="partner-avatar">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <h4 style="font-size: 1.05rem; margin: 0;">${b.partnerName || 'Assigning Top Verified Partner...'}</h4>
              <span class="badge badge-success" style="font-size: 0.65rem;">KYC VERIFIED</span>
            </div>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.15rem;">
              ${b.partnerPhone ? `<span style='display:inline-flex; align-items:center; gap:0.25rem;'>${icon('phone', { size: 13 })} ${b.partnerPhone}</span> • <span style='display:inline-flex; align-items:center; gap:0.2rem;'>4.9 ${icon('star', { size: 12, fill: '#D97706', stroke: '#D97706' })}</span> Verified Maid Specialist` : 'Searching nearest available background-checked specialist...'}
            </p>
          </div>
        </div>

        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary btn-sm" onclick="alert('Connecting to partner via verified masked call...')">Call Partner</button>
          <button class="btn btn-glass btn-sm btn-complain-booking" data-id="${b.bookingId}">Need Help?</button>
        </div>
      </div>

      <!-- Live Service & Transit Route Google Map -->
      <div style="margin-top: 1.25rem;">
        <div style="font-size: 0.85rem; font-weight: 700; color: var(--brand-emerald-dark); margin-bottom: 0.5rem; display: flex; align-items: center; justify-content: space-between;">
          <span style="display: inline-flex; align-items: center; gap: 0.4rem;">${icon("map", { size: 16, stroke: "var(--brand-emerald)" })} Live Service Location & Transit Route</span>
          <span style="font-size: 0.725rem; font-weight: 500; color: var(--text-muted);">GPS Verified</span>
        </div>
        <div id="active-booking-map-container" class="active-booking-map-box" data-service-lat="${b.serviceLat || 12.9716}" data-service-lng="${b.serviceLng || 77.5946}" data-partner-name="${b.partnerName || 'Partner'}"></div>
      </div>
    </div>
  `;
}

function renderBookingAddressesList(addrList, selectedId) {
  if (!addrList || addrList.length === 0) {
    return `
      <div style="background: #F8FAFC; border: 1.5px dashed #CBD5E1; border-radius: var(--radius-md); padding: 1.25rem; text-align: center;">
        <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 0.35rem; color: var(--brand-emerald);">${icon("map-pin", { size: 26, stroke: "var(--brand-emerald)" })}</div>
        <div style="font-weight: 600; font-size: 0.875rem; color: var(--text-primary); margin-bottom: 0.25rem;">No saved addresses found</div>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 0.75rem;">Add your service location to proceed with booking.</p>
        <button type="button" id="btn-booking-trigger-add" class="btn btn-primary btn-sm">+ Add New Address</button>
      </div>
    `;
  }

  return `
    <div style="display: flex; flex-direction: column; gap: 0.65rem; max-height: 230px; overflow-y: auto; padding-right: 0.25rem;">
      ${addrList.map(addr => {
        const isSelected = addr.addressId === selectedId;
        return `
          <div class="booking-addr-card" data-id="${addr.addressId}" style="border: 2px solid ${isSelected ? 'var(--brand-emerald)' : '#E2E8F0'}; background: ${isSelected ? '#F0FDF4' : '#FFFFFF'}; border-radius: var(--radius-md); padding: 0.75rem 0.9rem; cursor: pointer; transition: all var(--transition-fast); display: flex; justify-content: space-between; align-items: flex-start; gap: 0.75rem;">
            <div style="flex: 1;">
              <div style="display: flex; align-items: center; gap: 0.4rem; margin-bottom: 0.25rem;">
                <input type="radio" name="booking-selected-address" value="${addr.addressId}" ${isSelected ? 'checked' : ''} style="accent-color: var(--brand-emerald); cursor: pointer;">
                <strong style="font-size: 0.875rem; color: var(--brand-emerald-dark); display: inline-flex; align-items: center; gap: 0.3rem;">${icon("map-pin", { size: 14, stroke: "var(--brand-emerald)" })} ${addr.label || 'Home'}</strong>
                ${addr.isDefault ? `<span class="badge badge-success" style="font-size: 0.625rem; padding: 0.15rem 0.4rem;">DEFAULT</span>` : ''}
              </div>
              <p style="font-size: 0.825rem; color: var(--text-secondary); margin: 0; line-height: 1.4;">
                ${addr.house}, ${addr.street}${addr.area && addr.area !== addr.street ? ', ' + addr.area : ''}, ${addr.district || addr.city}, ${addr.state || DEFAULT_STATE} - ${addr.pinCode}
              </p>
              ${addr.landmark ? `<div style="font-size: 0.725rem; color: var(--text-muted); margin-top: 0.2rem;">Landmark: ${addr.landmark}</div>` : ''}
            </div>
            <div>
              <button type="button" class="btn btn-glass btn-sm btn-edit-booking-addr" data-id="${addr.addressId}" style="font-size: 0.725rem; padding: 0.25rem 0.55rem;" title="Edit Address">
                <span style="display: inline-flex; align-items: center; gap: 0.25rem;">${icon("edit", { size: 13 })} Edit</span>
              </button>
            </div>
          </div>
        `;
      }).join("")}
    </div>
  `;
}

/**
 * Multi-Step Booking Flow Modal
 */
export function openBookingFlow(serviceId) {
  const service = db.getServiceById(serviceId);
  if (!service) return;

  const user = auth.getCurrentUser();
  const isCustomer = user && user.role === "customer";

  if (!isCustomer) {
    sessionStorage.setItem("kleen_pending_booking_service", serviceId);

    if (user && user.role !== "customer") {
      modal.open({
        title: "Customer Account Required",
        maxWidth: "480px",
        bodyHtml: `
          <div style="text-align: center; padding: 1.25rem 0.5rem;">
            <div style="width: 64px; height: 64px; border-radius: 50%; background: #FEF3C7; color: #D97706; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; box-shadow: 0 4px 14px rgba(217, 119, 6, 0.15);">
              ${icon("shield-alert", { size: 30, stroke: "#D97706" })}
            </div>
            <span class="badge badge-warning" style="margin-bottom: 0.5rem; font-weight: 700;">Partner / Admin Active</span>
            <h3 style="margin-bottom: 0.5rem; font-size: 1.35rem; color: var(--text-primary);">Customer Account Required</h3>
            <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1.5rem;">
              You are currently signed in as a <strong>${user.role === 'partner' ? 'Service Partner' : 'Administrator'}</strong> (${user.fullName}). To book home cleaning services, you must sign in with or register a Customer account.
            </p>
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
              <button class="btn btn-primary" id="btn-modal-switch-cust-login" style="width: 100%; justify-content: center;">
                Switch & Sign In as Customer
              </button>
              <button class="btn btn-secondary" id="btn-modal-switch-cust-register" style="width: 100%; justify-content: center;">
                Create New Customer Account
              </button>
            </div>
          </div>
        `,
        footerHtml: `
          <button class="btn btn-glass btn-sm" onclick="document.querySelector('.modal-close').click()">Cancel</button>
        `,
        onOpen: (container) => {
          const switchLogin = container.querySelector("#btn-modal-switch-cust-login");
          if (switchLogin) {
            switchLogin.onclick = () => {
              auth.logout();
              sessionStorage.setItem("kleen_pending_booking_service", serviceId);
              modal.close();
              window.location.hash = "#/login";
            };
          }
          const switchReg = container.querySelector("#btn-modal-switch-cust-register");
          if (switchReg) {
            switchReg.onclick = () => {
              auth.logout();
              sessionStorage.setItem("kleen_pending_booking_service", serviceId);
              modal.close();
              window.location.hash = "#/register";
            };
          }
        }
      });
      toast.info("Customer Login Required", "Please sign in with a customer account to book home cleaning services.");
      return;
    }

    // Unauthenticated guest user
    modal.open({
      title: "Sign In Required",
      maxWidth: "480px",
      bodyHtml: `
        <div style="text-align: center; padding: 1.25rem 0.5rem;">
          <div style="width: 64px; height: 64px; border-radius: 50%; background: rgba(20, 92, 71, 0.08); color: var(--brand-emerald-dark); display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; box-shadow: 0 4px 16px rgba(15, 76, 58, 0.12); border: 1.5px solid rgba(20, 92, 71, 0.15);">
            ${icon("lock", { size: 28, stroke: "var(--brand-emerald-dark)" })}
          </div>
          <span class="badge badge-info" style="margin-bottom: 0.5rem; font-weight: 700;">Mandatory Sign In</span>
          <h3 style="margin-bottom: 0.5rem; font-size: 1.35rem; color: var(--text-primary);">Sign In to Book Service</h3>
          <p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1.25rem;">
            Customer login or registration is <strong>mandatory</strong> to book <strong>${service.name}</strong>. Signing in protects your booking, verifies your address, assigns certified partners, and provides live GPS tracking.
          </p>

          <div style="background: #F8FAF9; border: 1px solid #E2E8F0; border-radius: var(--radius-md); padding: 0.85rem 1rem; margin-bottom: 1.5rem; text-align: left; font-size: 0.825rem; color: #475569; display: flex; flex-direction: column; gap: 0.4rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="color: #059669; display: inline-flex; align-items: center;">${icon("check", { size: 14, strokeWidth: 3 })}</span> <span>Automatic address & booking history saving</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="color: #059669; display: inline-flex; align-items: center;">${icon("check", { size: 14, strokeWidth: 3 })}</span> <span>Live partner GPS dispatch & 4-digit start OTP</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <span style="color: #059669; display: inline-flex; align-items: center;">${icon("check", { size: 14, strokeWidth: 3 })}</span> <span>100% satisfaction guarantee & secure Razorpay payments</span>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem;">
            <a href="#/login" class="btn btn-primary btn-md" id="btn-modal-go-login" style="width: 100%; justify-content: center; font-weight: 700; box-shadow: 0 4px 12px rgba(15, 76, 58, 0.25);">
              Sign In to Continue Booking →
            </a>
            <a href="#/register" class="btn btn-secondary btn-md" id="btn-modal-go-register" style="width: 100%; justify-content: center; font-weight: 600;">
              Create New Customer Account
            </a>
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-glass btn-sm" onclick="document.querySelector('.modal-close').click()">Cancel</button>
      `,
      onOpen: (container) => {
        const loginBtn = container.querySelector("#btn-modal-go-login");
        if (loginBtn) loginBtn.onclick = () => modal.close();
        const regBtn = container.querySelector("#btn-modal-go-register");
        if (regBtn) regBtn.onclick = () => modal.close();
      }
    });
    toast.info("Sign In Required", "Please sign in or create an account to book this service.");
    return;
  }

  let addresses = db.getCustomerAddresses(user.userId);
  let selectedAddressId = (addresses.find(a => a.isDefault) || addresses[0])?.addressId || null;

  const basePrice = service.price;
  const platformFee = 49;
  const discount = 50; // KLEEN50 applied
  const tax = Math.round((basePrice - discount) * 0.18);
  const total = basePrice + platformFee + tax - discount;

  const costSummary = {
    base: basePrice,
    platformFee,
    discount,
    tax,
    total
  };

  // Date and Time helpers
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const toIsoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  const todayIso = toIsoDate(now);

  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(now.getDate() + 1);
  const tomorrowIso = toIsoDate(tomorrowDate);

  const weekendDate = new Date(now);
  const dayOfWeek = now.getDay();
  const daysToSaturday = (6 - dayOfWeek + 7) % 7 || 7;
  weekendDate.setDate(now.getDate() + daysToSaturday);
  const weekendIso = toIsoDate(weekendDate);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const formatHumanDate = (iso) => {
    if (!iso) return "Today";
    const [y, m, d] = iso.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayName = days[dateObj.getDay()];
    const monName = months[dateObj.getMonth()];
    if (iso === todayIso) return `Today (${dayName}, ${d} ${monName})`;
    if (iso === tomorrowIso) return `Tomorrow (${dayName}, ${d} ${monName})`;
    return `${dayName}, ${d} ${monName} ${y}`;
  };

  const format12Hour = (time24) => {
    if (!time24) return "09:00 AM";
    const [h, m] = time24.split(":");
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    const hh = String(hours).padStart(2, "0");
    return `${hh}:${m} ${ampm}`;
  };

  const modalInstance = modal.open({
    title: `Book ${service.name}`,
    maxWidth: "580px",
    bodyHtml: `
      <div class="booking-wizard-steps">
        <div class="wizard-step-item active" id="wiz-step-1">
          <span class="wizard-step-num">1</span>
          <span>Gig Details</span>
        </div>
        <div class="wizard-step-item" id="wiz-step-2">
          <span class="wizard-step-num">2</span>
          <span>Location</span>
        </div>
        <div class="wizard-step-item" id="wiz-step-3">
          <span class="wizard-step-num">3</span>
          <span>Payment</span>
        </div>
      </div>

      <!-- Step 1: Schedule -->
      <div id="booking-step-content-1">
        <div style="display: flex; gap: 1rem; align-items: center; background: #F8FAF9; padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.25rem;">
          <img src="${service.image}" style="width: 60px; height: 60px; border-radius: 8px; object-fit: cover;">
          <div>
            <h4 style="font-size: 1rem;">${service.name}</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted);">Duration: ${service.duration} • ₹${service.price}</p>
          </div>
        </div>

        <!-- Calendar Date Picker Section -->
        <div class="form-group" style="margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <label class="form-label" for="booking-calendar-input" style="margin-bottom: 0; display: flex; align-items: center; gap: 0.4rem;">
              <span style="display: inline-flex; align-items: center; gap: 0.4rem;">${icon("calendar-days", { size: 15, stroke: "var(--brand-emerald)" })} Select Service Date</span>
            </label>
            <span id="date-selection-badge" style="font-size: 0.775rem; font-weight: 600; color: var(--brand-emerald-dark); background: rgba(20,92,71,0.08); padding: 0.2rem 0.55rem; border-radius: 6px; border: 1px solid rgba(20,92,71,0.15);">
              ${formatHumanDate(todayIso)}
            </span>
          </div>

          <div style="display: grid; grid-template-columns: 1fr auto; gap: 0.75rem; align-items: center; margin-bottom: 0.75rem;">
            <div style="position: relative;">
              <input type="date" id="booking-calendar-input" class="form-input" min="${todayIso}" value="${todayIso}" style="cursor: pointer; font-weight: 600; font-size: 0.925rem; padding: 0.7rem 0.9rem; border: 1.5px solid #D1D5DB;">
            </div>
            <button type="button" id="btn-pick-today" class="btn btn-secondary btn-sm" style="height: 100%; white-space: nowrap; padding: 0 0.85rem; font-size: 0.8rem;">Pick Today</button>
          </div>

          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.4rem; font-weight: 500;">Quick Shortcuts:</div>
          <div class="chip-group" id="date-chip-group">
            <button type="button" class="chip-btn active" data-date="${todayIso}">Today (ASAP)</button>
            <button type="button" class="chip-btn" data-date="${tomorrowIso}">Tomorrow</button>
            <button type="button" class="chip-btn" data-date="${weekendIso}">This Weekend</button>
          </div>
        </div>

        <!-- Time Selector Section -->
        <div class="form-group" style="margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <label class="form-label" for="booking-time-picker" style="margin-bottom: 0; display: flex; align-items: center; gap: 0.4rem;">
              <span>⏰ Select Arrival Time</span>
            </label>
            <span id="time-selection-badge" style="font-size: 0.775rem; font-weight: 600; color: var(--brand-emerald-dark); background: rgba(20,92,71,0.08); padding: 0.2rem 0.55rem; border-radius: 6px; border: 1px solid rgba(20,92,71,0.15);">
              09:00 AM - 11:00 AM
            </span>
          </div>

          <!-- Time slot pills -->
          <div class="chip-group" id="time-chip-group" style="margin-bottom: 0.75rem;">
            <button type="button" class="chip-btn active" data-time="09:00 AM - 11:00 AM" data-val="09:00">09:00 AM (Morning)</button>
            <button type="button" class="chip-btn" data-time="11:30 AM - 01:30 PM" data-val="11:30">11:30 AM (Midday)</button>
            <button type="button" class="chip-btn" data-time="02:30 PM - 04:30 PM" data-val="14:30">02:30 PM (Afternoon)</button>
            <button type="button" class="chip-btn" data-time="05:00 PM - 07:00 PM" data-val="17:00">05:00 PM (Evening)</button>
          </div>

          <!-- Custom Time Selector -->
          <div style="background: #F8FAF9; border: 1.5px dashed #CBD5E1; border-radius: var(--radius-md); padding: 0.75rem 1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem;">
            <div>
              <div style="font-size: 0.825rem; font-weight: 600; color: var(--text-primary);">Custom Time Selector</div>
              <div style="font-size: 0.75rem; color: var(--text-muted);">Set an exact arrival time for your maid</div>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <input type="time" id="booking-time-picker" class="form-input" value="09:00" style="width: 130px; padding: 0.45rem 0.65rem; font-size: 0.9rem; font-weight: 600; cursor: pointer; text-align: center; border: 1.5px solid #D1D5DB;">
            </div>
          </div>
        </div>

        <!-- Schedule Summary Confirmation Box -->
        <div id="booking-schedule-summary" style="background: linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%); border: 1px solid #A7F3D0; border-radius: var(--radius-md); padding: 0.85rem 1rem; display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 36px; height: 36px; border-radius: 50%; background: #D1FAE5; display: flex; align-items: center; justify-content: center; color: #047857;">
              ${icon("check", { size: 18, stroke: "#047857", strokeWidth: 3 })}
            </div>
            <div>
              <div style="font-size: 0.725rem; text-transform: uppercase; letter-spacing: 0.04em; color: #065F46; font-weight: 700;">Confirmed Schedule Slot</div>
              <div id="schedule-summary-text" style="font-size: 0.875rem; font-weight: 600; color: #047857;">
                ${formatHumanDate(todayIso)} • 09:00 AM - 11:00 AM
              </div>
            </div>
          </div>
          <span class="badge badge-success" style="font-size: 0.725rem;">Guaranteed</span>
        </div>

        <div class="form-group">
          <label class="form-label">Special Cleaning Instructions (Optional)</label>
          <input type="text" id="booking-notes-input" class="form-input" placeholder="e.g. Please sanitize kitchen first, ring back bell...">
        </div>
      </div>

      <!-- Step 2: Location -->
      <div id="booking-step-content-2" style="display: none;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
          <h4 style="font-size: 1rem; margin: 0; color: var(--text-primary);">Service Address & Contact</h4>
          <button type="button" id="btn-booking-add-new-addr" class="btn btn-secondary btn-sm" style="font-size: 0.775rem; padding: 0.35rem 0.75rem; display: ${addresses.length > 0 ? 'inline-flex' : 'none'};">
            + Add New Address
          </button>
        </div>

        <!-- Address Selection Container -->
        <div id="booking-addresses-list-container" style="margin-bottom: 1rem;">
          ${renderBookingAddressesList(addresses, selectedAddressId)}
        </div>

        <!-- Address Edit / Add Form (Hidden by default when addresses exist) -->
        <div id="booking-address-editor" style="display: ${addresses.length === 0 ? 'block' : 'none'}; background: #F8FAF9; border: 1.5px solid #CBD5E1; border-radius: var(--radius-md); padding: 1.15rem; margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <strong id="booking-editor-title" style="font-size: 0.925rem; color: var(--brand-emerald-dark);">
              ${addresses.length === 0 ? 'Add Service Address' : 'Add New Address'}
            </strong>
            <button type="button" id="btn-booking-cancel-edit" class="btn btn-glass btn-sm" style="font-size: 0.725rem; padding: 0.2rem 0.5rem; display: ${addresses.length > 0 ? 'inline-block' : 'none'};">Cancel</button>
          </div>
          <input type="hidden" id="booking-edit-addr-id" value="">
          <div class="form-group" style="margin-bottom: 0.55rem;">
            <label class="form-label" style="font-size: 0.775rem;">Address Label *</label>
            <input type="text" id="booking-input-label" class="form-input" placeholder="e.g. Home, Office, Villa" value="Home">
          </div>
          <div class="form-group" style="margin-bottom: 0.55rem;">
            <label class="form-label" style="font-size: 0.775rem;">Flat / House / Building Number *</label>
            <input type="text" id="booking-input-house" class="form-input" placeholder="e.g. Flat 302, Green Orchid Apartments">
          </div>
          <div class="form-group" style="margin-bottom: 0.55rem;">
            <label class="form-label" style="font-size: 0.775rem;">Street / Locality / Sector *</label>
            <input type="text" id="booking-input-street" class="form-input" placeholder="e.g. 12th Main, 4th Sector">
          </div>
          <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 0.6rem; margin-bottom: 0.55rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.775rem;">District (Kerala) *</label>
              <select id="booking-input-city" class="form-select" style="font-size: 0.85rem; padding: 0.5rem 0.6rem;">
                ${renderDistrictOptions(DEFAULT_DISTRICT)}
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.775rem;">State *</label>
              <input type="text" id="booking-input-state" class="form-input" value="${DEFAULT_STATE}" readonly style="font-size: 0.85rem; padding: 0.5rem 0.6rem; background: #F8FAFC;" title="Default state is Kerala">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-size: 0.775rem;">PIN Code *</label>
              <input type="text" id="booking-input-pin" class="form-input" placeholder="695001" style="font-size: 0.85rem; padding: 0.5rem 0.6rem;">
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 0.85rem;">
            <label class="form-label" style="font-size: 0.775rem;">Nearby Landmark (Optional)</label>
            <input type="text" id="booking-input-landmark" class="form-input" placeholder="e.g. Near Sony Signal">
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 0.5rem;">
            <button type="button" id="btn-booking-save-addr" class="btn btn-primary btn-sm">
              Save & Use Address
            </button>
          </div>
        </div>

        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label" style="font-size: 0.775rem;">Contact Phone for Partner *</label>
          <input type="tel" id="booking-phone-input" class="form-input" placeholder="+91 98765 43210" value="${user && user.phone ? user.phone : ''}">
        </div>
      </div>

      <!-- Step 3: Payment Summary -->
      <div id="booking-step-content-3" style="display: none;">
        <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.25rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
            <span>Service Base Price</span>
            <span>₹${basePrice}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
            <span>Platform & Safety Fee</span>
            <span>₹${platformFee}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem; color: #15803D;">
            <span>Welcome Offer (KLEEN50)</span>
            <span>- ₹${discount}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem;">
            <span>GST (18%)</span>
            <span>₹${tax}</span>
          </div>
          <div style="display: flex; justify-content: space-between; padding-top: 0.75rem; border-top: 1px solid #E5E7EB; font-weight: 700; font-size: 1.15rem; color: var(--brand-emerald-dark);">
            <span>Total Payable</span>
            <span>₹${total}</span>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.825rem; color: var(--text-muted); margin-bottom: 1rem;">
          <span style="display: inline-flex; align-items: center; color: var(--brand-emerald);">${icon("lock", { size: 14 })}</span>
          <span>Secured by Razorpay. 100% money-back guarantee if service not fulfilled.</span>
        </div>
      </div>
    `,
    footerHtml: `
      <div style="display: flex; justify-content: space-between; width: 100%;">
        <button class="btn btn-secondary btn-sm" id="btn-wiz-prev" style="visibility: hidden;">Back</button>
        <button class="btn btn-primary btn-sm" id="btn-wiz-next">Continue to Address</button>
      </div>
    `,
    onOpen: (container) => {
      let currentStep = 1;
      let selectedDate = formatHumanDate(todayIso);
      let selectedTime = "09:00 AM - 11:00 AM";

      const calendarInput = container.querySelector("#booking-calendar-input");
      const timePickerInput = container.querySelector("#booking-time-picker");
      const dateBadge = container.querySelector("#date-selection-badge");
      const timeBadge = container.querySelector("#time-selection-badge");
      const summaryText = container.querySelector("#schedule-summary-text");
      const pickTodayBtn = container.querySelector("#btn-pick-today");

      const refreshSummary = () => {
        if (dateBadge) dateBadge.textContent = selectedDate;
        if (timeBadge) timeBadge.textContent = selectedTime;
        if (summaryText) summaryText.textContent = `${selectedDate} • ${selectedTime}`;
      };

      // Calendar date picker change event
      if (calendarInput) {
        calendarInput.addEventListener("change", (e) => {
          const val = e.target.value;
          if (val) {
            selectedDate = formatHumanDate(val);
            container.querySelectorAll("#date-chip-group .chip-btn").forEach(b => {
              b.classList.toggle("active", b.getAttribute("data-date") === val);
            });
            refreshSummary();
          }
        });
      }

      // Quick date shortcut chips
      container.querySelectorAll("#date-chip-group .chip-btn").forEach(btn => {
        btn.onclick = () => {
          container.querySelectorAll("#date-chip-group .chip-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          const dateVal = btn.getAttribute("data-date");
          if (calendarInput) calendarInput.value = dateVal;
          selectedDate = formatHumanDate(dateVal);
          refreshSummary();
        };
      });

      // Quick "Pick Today" button
      if (pickTodayBtn) {
        pickTodayBtn.onclick = () => {
          if (calendarInput) calendarInput.value = todayIso;
          container.querySelectorAll("#date-chip-group .chip-btn").forEach(b => {
            b.classList.toggle("active", b.getAttribute("data-date") === todayIso);
          });
          selectedDate = formatHumanDate(todayIso);
          refreshSummary();
        };
      }

      // Time slot preset chips
      container.querySelectorAll("#time-chip-group .chip-btn").forEach(btn => {
        btn.onclick = () => {
          container.querySelectorAll("#time-chip-group .chip-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          selectedTime = btn.getAttribute("data-time");
          const slotVal = btn.getAttribute("data-val");
          if (timePickerInput && slotVal) timePickerInput.value = slotVal;
          refreshSummary();
        };
      });

      // Custom time picker input event
      if (timePickerInput) {
        timePickerInput.addEventListener("change", (e) => {
          const time24 = e.target.value;
          if (time24) {
            const formatted12 = format12Hour(time24);
            selectedTime = `${formatted12} (Exact Arrival)`;
            container.querySelectorAll("#time-chip-group .chip-btn").forEach(b => {
              b.classList.toggle("active", b.getAttribute("data-val") === time24);
            });
            refreshSummary();
          }
        });
      }

      // Address selection and editor management
      const addrListContainer = container.querySelector("#booking-addresses-list-container");
      const addrEditor = container.querySelector("#booking-address-editor");
      const btnAddNewAddr = container.querySelector("#btn-booking-add-new-addr");
      const btnCancelEdit = container.querySelector("#btn-booking-cancel-edit");
      const btnSaveAddr = container.querySelector("#btn-booking-save-addr");
      const editorTitle = container.querySelector("#booking-editor-title");
      const editAddrIdInput = container.querySelector("#booking-edit-addr-id");
      const inputLabel = container.querySelector("#booking-input-label");
      const inputHouse = container.querySelector("#booking-input-house");
      const inputStreet = container.querySelector("#booking-input-street");
      const inputCity = container.querySelector("#booking-input-city");
      const inputState = container.querySelector("#booking-input-state");
      const inputPin = container.querySelector("#booking-input-pin");
      const inputLandmark = container.querySelector("#booking-input-landmark");

      const openEditor = (addr = null) => {
        if (!addrEditor) return;
        addrEditor.style.display = "block";
        if (addr) {
          if (editorTitle) editorTitle.textContent = "Edit Address";
          if (editAddrIdInput) editAddrIdInput.value = addr.addressId || "";
          if (inputLabel) inputLabel.value = addr.label || "Home";
          if (inputHouse) inputHouse.value = addr.house || "";
          if (inputStreet) inputStreet.value = addr.street || addr.area || "";
          if (inputCity) inputCity.value = addr.district || addr.city || DEFAULT_DISTRICT;
          if (inputState) inputState.value = addr.state || DEFAULT_STATE;
          if (inputPin) inputPin.value = addr.pinCode || "";
          if (inputLandmark) inputLandmark.value = addr.landmark || "";
          if (btnCancelEdit) btnCancelEdit.style.display = "inline-block";
        } else {
          if (editorTitle) editorTitle.textContent = "Add New Address";
          if (editAddrIdInput) editAddrIdInput.value = "";
          if (inputLabel) inputLabel.value = "Home";
          if (inputHouse) inputHouse.value = "";
          if (inputStreet) inputStreet.value = "";
          if (inputCity) inputCity.value = DEFAULT_DISTRICT;
          if (inputState) inputState.value = DEFAULT_STATE;
          if (inputPin) inputPin.value = "";
          if (inputLandmark) inputLandmark.value = "";
          if (btnCancelEdit) btnCancelEdit.style.display = addresses.length > 0 ? "inline-block" : "none";
        }
        if (inputHouse) inputHouse.focus();
      };

      const closeEditor = () => {
        if (!addrEditor) return;
        addrEditor.style.display = "none";
        if (editAddrIdInput) editAddrIdInput.value = "";
      };

      const bindAddressListEvents = () => {
        if (!addrListContainer) return;
        // Bind radio or card clicks
        addrListContainer.querySelectorAll(".booking-addr-card").forEach(card => {
          card.onclick = (e) => {
            if (e.target.closest(".btn-edit-booking-addr")) return;
            const aid = card.getAttribute("data-id");
            selectedAddressId = aid;
            refreshAddressesUI();
          };
        });

        // Bind Edit buttons
        addrListContainer.querySelectorAll(".btn-edit-booking-addr").forEach(btn => {
          btn.onclick = (e) => {
            e.stopPropagation();
            const aid = btn.getAttribute("data-id");
            const addr = addresses.find(a => a.addressId === aid);
            if (addr) {
              openEditor(addr);
            }
          };
        });

        // Bind empty state trigger button
        const triggerAddBtn = addrListContainer.querySelector("#btn-booking-trigger-add");
        if (triggerAddBtn) {
          triggerAddBtn.onclick = () => openEditor();
        }
      };

      const refreshAddressesUI = () => {
        if (addrListContainer) {
          addrListContainer.innerHTML = renderBookingAddressesList(addresses, selectedAddressId);
          bindAddressListEvents();
        }
        if (btnAddNewAddr) {
          btnAddNewAddr.style.display = addresses.length > 0 ? "inline-flex" : "none";
        }
      };

      // Initial bind
      bindAddressListEvents();

      if (btnAddNewAddr) {
        btnAddNewAddr.onclick = () => openEditor();
      }

      if (btnCancelEdit) {
        btnCancelEdit.onclick = () => closeEditor();
      }

      const saveAddressAction = () => {
        const label = inputLabel ? inputLabel.value.trim() : "Home";
        const house = inputHouse ? inputHouse.value.trim() : "";
        const street = inputStreet ? inputStreet.value.trim() : "";
        const city = inputCity ? inputCity.value.trim() : DEFAULT_DISTRICT;
        const state = inputState ? inputState.value.trim() : DEFAULT_STATE;
        const pinCode = inputPin ? inputPin.value.trim() : "";
        const landmark = inputLandmark ? inputLandmark.value.trim() : "";

        if (!house || !street || !city || !pinCode) {
          toast.error("Missing Details", "Please fill all required address fields (House, Street, District, PIN).");
          return false;
        }

        const editId = editAddrIdInput ? editAddrIdInput.value.trim() : "";
        if (editId) {
          // Updating existing
          db.updateCustomerAddress(user.userId, editId, {
            label,
            house,
            street,
            area: street,
            district: city,
            city,
            state: state || DEFAULT_STATE,
            pinCode,
            landmark
          });
          selectedAddressId = editId;
          toast.success("Address Updated", "Your service address was updated successfully.");
        } else {
          // Adding new
          const newAddrId = db.addCustomerAddress(user.userId, {
            label,
            house,
            street,
            area: street,
            district: city,
            city,
            state: state || DEFAULT_STATE,
            pinCode,
            landmark
          });
          selectedAddressId = newAddrId;
          toast.success("Address Added", "New address saved to your profile.");
        }

        // Reload addresses from DB
        addresses = db.getCustomerAddresses(user.userId);
        refreshAddressesUI();
        closeEditor();
        return true;
      };

      if (btnSaveAddr) {
        btnSaveAddr.onclick = () => {
          saveAddressAction();
        };
      }

      const nextBtn = container.querySelector("#btn-wiz-next");
      const prevBtn = container.querySelector("#btn-wiz-prev");

      const updateStepUi = () => {
        container.querySelector("#booking-step-content-1").style.display = currentStep === 1 ? "block" : "none";
        container.querySelector("#booking-step-content-2").style.display = currentStep === 2 ? "block" : "none";
        container.querySelector("#booking-step-content-3").style.display = currentStep === 3 ? "block" : "none";

        container.querySelector("#wiz-step-1").classList.toggle("active", currentStep >= 1);
        container.querySelector("#wiz-step-2").classList.toggle("active", currentStep >= 2);
        container.querySelector("#wiz-step-3").classList.toggle("active", currentStep >= 3);

        prevBtn.style.visibility = currentStep > 1 ? "visible" : "hidden";

        if (currentStep === 1) nextBtn.textContent = "Continue to Location";
        if (currentStep === 2) nextBtn.textContent = "Continue to Payment";
        if (currentStep === 3) nextBtn.textContent = `Pay ₹${total} via Razorpay`;
      };

      prevBtn.onclick = () => {
        if (currentStep > 1) {
          currentStep--;
          updateStepUi();
        }
      };

      nextBtn.onclick = async () => {
        if (currentStep === 1) {
          currentStep = 2;
          updateStepUi();
        } else if (currentStep === 2) {
          const phoneVal = container.querySelector("#booking-phone-input") ? container.querySelector("#booking-phone-input").value.trim() : "";
          if (!phoneVal) {
            toast.error("Contact Required", "Please provide a contact phone number.");
            return;
          }

          // If address editor is actively open and has entered fields, attempt to save it
          if (addrEditor && addrEditor.style.display !== "none") {
            const hasInput = (inputHouse && inputHouse.value.trim()) || (inputStreet && inputStreet.value.trim());
            if (hasInput) {
              const saved = saveAddressAction();
              if (!saved) return;
            } else if (!selectedAddressId) {
              toast.error("Address Required", "Please fill and save your service address.");
              return;
            } else {
              closeEditor();
            }
          }

          // Ensure a valid address is selected
          const chosenAddr = addresses.find(a => a.addressId === selectedAddressId);
          if (!chosenAddr) {
            toast.error("Address Required", "Please select or add a service address.");
            if (addrEditor) openEditor();
            return;
          }

          const activeCustomer = auth.getCurrentUser();
          if (!activeCustomer || activeCustomer.role !== "customer") {
            modal.close();
            toast.error("Authentication Required", "Please sign in with a customer account to continue.");
            openBookingFlow(service.serviceId);
            return;
          }
          currentStep = 3;
          updateStepUi();
        } else {
          // Trigger Razorpay payment
          const activeCustomer = auth.getCurrentUser();
          if (!activeCustomer || activeCustomer.role !== "customer") {
            modal.close();
            toast.error("Authentication Required", "Please sign in with a customer account to complete your booking.");
            openBookingFlow(service.serviceId);
            return;
          }

          const notes = container.querySelector("#booking-notes-input") ? container.querySelector("#booking-notes-input").value.trim() : "";
          const phone = container.querySelector("#booking-phone-input") ? container.querySelector("#booking-phone-input").value.trim() : "";

          const chosenAddr = addresses.find(a => a.addressId === selectedAddressId);
          let finalAddress = chosenAddr
            ? `${chosenAddr.house}, ${chosenAddr.street}${chosenAddr.area && chosenAddr.area !== chosenAddr.street ? ', ' + chosenAddr.area : ''}, ${chosenAddr.district || chosenAddr.city}, ${chosenAddr.state || DEFAULT_STATE} - ${chosenAddr.pinCode}`
            : "Customer Service Address";
          let finalAddressId = chosenAddr ? chosenAddr.addressId : ("addr_" + Date.now().toString(36));

          const custName = activeCustomer.fullName;
          const custId = activeCustomer.userId;

          const chosenDistrict = chosenAddr?.district || chosenAddr?.city || "Ernakulam";
          const isUrgent = selectedDate === todayIso;

          const bookingPayload = {
            customerId: custId,
            customerName: custName,
            customerPhone: phone || (user ? user.phone : ""),
            serviceId: service.serviceId,
            serviceName: service.name,
            serviceImage: service.image,
            categoryId: service.categoryId,
            addressId: finalAddressId,
            serviceAddress: finalAddress,
            city: chosenAddr?.city || chosenDistrict,
            district: chosenDistrict,
            bookingDate: selectedDate,
            startTime: selectedTime,
            timingType: isUrgent ? "URGENT" : (selectedDate === tomorrowIso ? "TOMORROW" : "FLEXIBLE"),
            timingLabel: isUrgent ? `Urgent Today (${selectedTime})` : (selectedDate === tomorrowIso ? `Tomorrow (${selectedTime})` : `${selectedDate} (${selectedTime})`),
            duration: service.duration,
            customerNotes: notes,
            instructions: notes || `Clean and sanitize ${service.name} thoroughly.`
          };

          try {
            nextBtn.textContent = "Connecting to Gateway...";
            nextBtn.disabled = true;

            const result = await payment.processPayment(bookingPayload, costSummary);
            modal.close();
            toast.success("Gig Broadcasted", `Your cleaning gig is live on the partner market. Booking #${result.booking.bookingId}`);
            
            // Reload view / redirect to customer portal
            window.location.hash = "#/customer/bookings";
          } catch (err) {
            toast.error("Payment Notice", err.message || "Transaction was not completed.");
            nextBtn.disabled = false;
            nextBtn.textContent = `Pay ₹${total} via Razorpay`;
          }
        }
      };
    }
  });
}
export function renderCustomerServiceCards(services) {
  if (!services || services.length === 0) {
    return `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3.5rem 1rem; background: #FFFFFF; border-radius: var(--radius-lg); border: 1px solid #E5E7EB;">
        <div style="display: flex; justify-content: center; margin-bottom: 0.75rem; color: var(--brand-emerald);">${icon("search", { size: 36, stroke: "var(--brand-emerald)" })}</div>
        <h4 style="margin-bottom: 0.35rem; color: var(--text-primary);">No services found</h4>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">Try selecting another category or clear your search.</p>
      </div>
    `;
  }

  return services.map(srv => `
    <div class="service-card animate-fade-in" data-service-id="${srv.serviceId}" style="background: #FFFFFF;">
      <div class="service-image-box btn-cust-service-detail" data-id="${srv.serviceId}" style="cursor: pointer;" title="View details for ${srv.name}">
        <img src="${srv.image}" alt="${srv.name}" class="service-img" loading="lazy">
        <span class="service-badge">${srv.duration}</span>
        <span class="service-rating">${icon("star", { size: 12, fill: "#F59E0B", stroke: "#F59E0B" })} ${srv.rating} (${srv.reviewCount})</span>
      </div>
      <div class="service-content">
        <h3 class="service-name btn-cust-service-detail" data-id="${srv.serviceId}" style="cursor: pointer; font-size: 1.05rem;" title="View details for ${srv.name}">${srv.name}</h3>
        <p class="service-desc" style="font-size: 0.825rem; line-height: 1.4; -webkit-line-clamp: 2;">${srv.description}</p>
        
        <div class="service-meta" style="margin: 0.75rem 0;">
          <div class="service-meta-item">
            <span>${icon("shield-check", { size: 14, stroke: "var(--brand-emerald)" })}</span>
            <span>Verified Helper</span>
          </div>
          <div class="service-meta-item">
            <span>${icon("leaf", { size: 14, stroke: "var(--brand-emerald)" })}</span>
            <span>Eco Friendly</span>
          </div>
        </div>

        <div class="service-footer" style="padding-top: 0.75rem; border-top: 1px solid #F1F5F9;">
          <div class="service-price-block">
            <span class="price-label" style="font-size: 0.7rem;">Starting From</span>
            <span class="price-amount" style="font-size: 1.25rem;">₹${srv.price}</span>
          </div>
          <div style="display: flex; gap: 0.4rem;">
            <a href="#/services/${srv.serviceId}" class="btn btn-glass btn-sm" style="padding: 0.4rem 0.75rem; font-size: 0.8rem;">Details</a>
            <button class="btn btn-primary btn-sm btn-cust-book-service" data-id="${srv.serviceId}" style="padding: 0.4rem 0.85rem; font-size: 0.8rem;">Book Now</button>
          </div>
        </div>
      </div>
    </div>
  `).join("");
}

export function renderCustomerAddressesCards(addresses) {
  if (!addresses || addresses.length === 0) {
    return `
      <div class="solid-card" style="padding: 2.5rem 1.5rem; text-align: center; grid-column: 1 / -1; border: 2px dashed #D2E7DC; background: #FAFDFB; border-radius: 12px;">
        <div style="display: flex; justify-content: center; margin-bottom: 0.75rem; color: var(--brand-emerald);">${icon("map-pin", { size: 36, stroke: "var(--brand-emerald)" })}</div>
        <h4 style="margin-bottom: 0.35rem; color: var(--text-primary);">No Saved Addresses Yet</h4>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.25rem; max-width: 380px; margin-left: auto; margin-right: auto;">
          Add your home or apartment address to schedule verified maids and cleaning specialists quickly.
        </p>
        <button id="btn-add-address-empty" class="btn btn-primary btn-sm">+ Add Your First Address</button>
      </div>
    `;
  }

  return addresses.map(addr => `
    <div class="solid-card" style="padding: 1.35rem; border-radius: 12px; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid rgba(20, 92, 71, 0.12); position: relative; background: #FFFFFF;">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <span style="display: inline-flex; align-items: center; color: var(--brand-emerald);">${icon("map-pin", { size: 16, stroke: "var(--brand-emerald)" })}</span>
            <span style="font-weight: 700; color: var(--brand-emerald-dark); font-size: 1rem;">${addr.label}</span>
          </div>
          ${addr.isDefault ? `<span class="badge badge-success" style="font-size: 0.675rem; padding: 0.2rem 0.5rem;">DEFAULT</span>` : ''}
        </div>
        <p style="font-size: 0.875rem; color: var(--text-primary); line-height: 1.5; margin-bottom: 0.35rem;">
          <strong>${addr.house}</strong>, ${addr.street}${addr.area && addr.area !== addr.street ? ', ' + addr.area : ''}
        </p>
        <p style="font-size: 0.825rem; color: var(--text-muted); margin-bottom: 0.5rem;">
          ${addr.district || addr.city}, ${addr.state || DEFAULT_STATE} - ${addr.pinCode}
        </p>
        ${addr.landmark ? `
          <p style="font-size: 0.775rem; color: var(--text-secondary); background: rgba(20, 92, 71, 0.05); padding: 0.35rem 0.6rem; border-radius: 6px; margin-bottom: 0.75rem;">
            Landmark: ${addr.landmark}
          </p>
        ` : ''}
        ${addr.lat && addr.lng ? `
          <p style="font-size: 0.725rem; color: var(--brand-emerald-dark); display: flex; align-items: center; gap: 0.35rem; margin: 0;">
            <span>Coordinates:</span> ${Number(addr.lat).toFixed(4)}, ${Number(addr.lng).toFixed(4)}
          </p>
        ` : ''}
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem; padding-top: 0.75rem; border-top: 1px solid #F1F5F9;">
        ${!addr.isDefault ? `
          <button class="btn btn-glass btn-sm btn-set-default-addr" data-id="${addr.addressId}" style="font-size: 0.75rem; padding: 0.3rem 0.7rem;">
            Set Default
          </button>
        ` : ''}
        <button class="btn btn-danger btn-sm btn-delete-addr" data-id="${addr.addressId}" data-label="${addr.label}" style="font-size: 0.75rem; padding: 0.3rem 0.7rem;">
          Delete
        </button>
      </div>
    </div>
  `).join("");
}

export function attachCustomerEvents() {
  const user = auth.getCurrentUser();

  // 1. Edit Customer Profile Modal
  const editProfileBtn = document.getElementById("btn-edit-customer-profile");
  if (editProfileBtn) {
    editProfileBtn.onclick = () => {
      const curUser = auth.getCurrentUser();
      if (!curUser) {
        toast.info("Sign In Required", "Please sign in to update your profile.");
        return;
      }

      modal.open({
        title: "Edit Customer Profile",
        maxWidth: "500px",
        bodyHtml: `
          <div class="form-group">
            <label class="form-label" style="font-weight: 600;">Full Name *</label>
            <input type="text" id="edit-cust-name" class="form-input" value="${curUser.fullName || ''}" required placeholder="Enter your full name">
          </div>
          <div class="form-group">
            <label class="form-label" style="font-weight: 600;">Email Address *</label>
            <input type="email" id="edit-cust-email" class="form-input" value="${curUser.email || ''}" required placeholder="e.g. yourname@gmail.com">
          </div>
          <div class="form-group">
            <label class="form-label" style="font-weight: 600;">Phone Number *</label>
            <input type="tel" id="edit-cust-phone" class="form-input" value="${curUser.phone || ''}" required placeholder="e.g. +91 98765 43210">
          </div>
        `,
        footerHtml: `
          <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">Cancel</button>
          <button class="btn btn-primary btn-sm" id="btn-save-cust-profile">Save Changes</button>
        `,
        onOpen: (container) => {
          container.querySelector("#btn-save-cust-profile").onclick = () => {
            const name = container.querySelector("#edit-cust-name").value.trim();
            const email = container.querySelector("#edit-cust-email").value.trim();
            const phone = container.querySelector("#edit-cust-phone").value.trim();

            if (!name || !email) {
              toast.error("Validation Error", "Please provide at least your full name and email.");
              return;
            }

            curUser.fullName = name;
            curUser.email = email;
            curUser.phone = phone;
            auth.saveSession();
            db.updateUserProfile(curUser.userId, { fullName: name, email, phone });

            // Update UI elements in page
            const nameEl = document.getElementById("customer-disp-name");
            if (nameEl) nameEl.textContent = name;
            const welcomeEl = document.getElementById("customer-welcome-heading");
            if (welcomeEl) welcomeEl.textContent = `Welcome, ${name}`;
            const emailEl = document.getElementById("customer-disp-email");
            if (emailEl) emailEl.textContent = email;
            const phoneEl = document.getElementById("customer-disp-phone");
            if (phoneEl) phoneEl.textContent = phone;

            modal.close();
            toast.success("Profile Updated", "Your profile details have been saved successfully.");
          };
        }
      });
    };
  }

  // 2. Initialize Active Booking Live Map Trackers if present
  document.querySelectorAll(".active-booking-map-box, #active-booking-map-container").forEach(trackerMapMount => {
    const sLat = parseFloat(trackerMapMount.getAttribute("data-service-lat")) || 12.9716;
    const sLng = parseFloat(trackerMapMount.getAttribute("data-service-lng")) || 77.5946;
    const pName = trackerMapMount.getAttribute("data-partner-name") || "Service Partner";
    renderBookingTrackerMap(trackerMapMount, {
      serviceLat: sLat,
      serviceLng: sLng,
      partnerName: pName,
      showPartner: true
    });
  });

  // 3. Address Management System
  const refreshAddressesGrid = () => {
    const activeUser = auth.getCurrentUser();
    const grid = document.getElementById("customer-addresses-grid");
    if (!grid || !activeUser) return;
    const latestAddresses = db.getCustomerAddresses(activeUser.userId);
    grid.innerHTML = renderCustomerAddressesCards(latestAddresses);
    attachAddressListeners();
  };

  const setupAddAddressModal = (triggerBtn) => {
    if (!triggerBtn) return;
    triggerBtn.onclick = () => {
      const activeUser = auth.getCurrentUser();
      if (!activeUser) {
        toast.info("Sign In Required", "Please sign in or create an account to save addresses.");
        window.location.hash = "#/login";
        return;
      }

      let selectedCoords = { lat: 12.9716, lng: 77.5946 };

      modal.open({
        title: "Add New Service Address",
        maxWidth: "560px",
        bodyHtml: `
          <div class="form-group">
            <label class="form-label" style="font-weight: 700; color: var(--brand-emerald-dark);">Pinpoint Location on Map</label>
            <div id="modal-new-addr-map" style="min-height: 260px; border-radius: 8px; overflow: hidden; margin-bottom: 0.5rem;"></div>
          </div>

          <div class="form-group">
            <label class="form-label">Address Label *</label>
            <input type="text" id="new-addr-label" class="form-input" placeholder="e.g. Home, Parents' Flat, Vacation Villa" required>
          </div>
          <div class="form-group">
            <label class="form-label">Flat / House / Building Number *</label>
            <input type="text" id="new-addr-house" class="form-input" placeholder="e.g. Flat 301, Tower B" required>
          </div>
          <div class="form-group">
            <label class="form-label">Street / Colony *</label>
            <input type="text" id="new-addr-street" class="form-input" placeholder="e.g. 5th Main, Koramangala 4th Block" required>
          </div>
          <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">District (Kerala) *</label>
              <select id="new-addr-city" class="form-select" required>
                ${renderDistrictOptions(DEFAULT_DISTRICT)}
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">State *</label>
              <input type="text" id="new-addr-state" class="form-input" value="${DEFAULT_STATE}" readonly style="background: #F8FAFC;" required>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">PIN Code *</label>
              <input type="text" id="new-addr-pin" class="form-input" placeholder="695001" required pattern="[0-9]{6}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Nearby Landmark (Optional)</label>
            <input type="text" id="new-addr-landmark" class="form-input" placeholder="e.g. Near Sony World Signal">
          </div>
        `,
        footerHtml: `
          <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">Cancel</button>
          <button class="btn btn-primary btn-sm" id="btn-save-new-addr">Save Address</button>
        `,
        onOpen: (container) => {
          const mapMount = container.querySelector("#modal-new-addr-map");
          const streetInput = container.querySelector("#new-addr-street");
          const cityInput = container.querySelector("#new-addr-city");
          const stateInput = container.querySelector("#new-addr-state");
          const pinInput = container.querySelector("#new-addr-pin");

          initLocationPicker(mapMount, {
            initialLat: 9.9312,
            initialLng: 76.2673,
            onLocationChange: ({ lat, lng, address }) => {
              selectedCoords = { lat, lng };
              if (address) {
                if (address.street && !streetInput.value) streetInput.value = address.street;
                if (address.city) {
                  const matched = Array.from(cityInput.options).find(o => o.value.toLowerCase() === address.city.toLowerCase());
                  if (matched) cityInput.value = matched.value;
                }
                if (address.pinCode) pinInput.value = address.pinCode;
              }
            }
          });

          container.querySelector("#btn-save-new-addr").onclick = () => {
            const label = container.querySelector("#new-addr-label").value.trim();
            const house = container.querySelector("#new-addr-house").value.trim();
            const street = container.querySelector("#new-addr-street").value.trim();
            const city = container.querySelector("#new-addr-city").value.trim();
            const state = (stateInput?.value.trim()) || DEFAULT_STATE;
            const pinCode = container.querySelector("#new-addr-pin").value.trim();
            const landmark = container.querySelector("#new-addr-landmark").value.trim();

            if (!label || !house || !street || !city) {
              toast.error("Required Fields", "Please enter address label, house number, street, and district.");
              return;
            }

            db.addCustomerAddress(activeUser.userId, {
              label,
              house,
              street,
              area: street,
              district: city,
              city: city || DEFAULT_DISTRICT,
              state: state || DEFAULT_STATE,
              pinCode: pinCode || "695001",
              landmark,
              lat: selectedCoords.lat,
              lng: selectedCoords.lng
            });

            modal.close();
            toast.success("Address Saved", "Your service address was added to your profile.");
            refreshAddressesGrid();
          };
        }
      });
    };
  };

  const attachAddressListeners = () => {
    const activeUser = auth.getCurrentUser();
    if (!activeUser) return;

    // Delete Address with confirmation
    document.querySelectorAll(".btn-delete-addr").forEach(btn => {
      btn.onclick = () => {
        const addrId = btn.getAttribute("data-id");
        const label = btn.getAttribute("data-label") || "Address";

        modal.open({
          title: "Delete Address",
          maxWidth: "420px",
          bodyHtml: `
            <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
              Are you sure you want to remove <strong>${label}</strong> from your saved locations?
            </p>
          `,
          footerHtml: `
            <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">Cancel</button>
            <button class="btn btn-danger btn-sm" id="btn-confirm-del-addr">Confirm Delete</button>
          `,
          onOpen: (container) => {
            container.querySelector("#btn-confirm-del-addr").onclick = () => {
              db.deleteCustomerAddress(activeUser.userId, addrId);
              modal.close();
              toast.success("Address Removed", "The location was removed from your address book.");
              refreshAddressesGrid();
            };
          }
        });
      };
    });

    // Set as Default Address
    document.querySelectorAll(".btn-set-default-addr").forEach(btn => {
      btn.onclick = () => {
        const addrId = btn.getAttribute("data-id");
        db.setDefaultCustomerAddress(activeUser.userId, addrId);
        toast.success("Default Address Set", "This address is now your default cleaning location.");
        refreshAddressesGrid();
      };
    });

    // Wire up Add Address buttons
    setupAddAddressModal(document.getElementById("btn-add-address"));
    setupAddAddressModal(document.getElementById("btn-add-address-empty"));
  };

  // Initial attachment of address listeners
  attachAddressListeners();

  // Rate Booking Modal
  document.querySelectorAll(".btn-rate-booking").forEach(btn => {
    btn.onclick = () => {
      const bId = btn.getAttribute("data-id");
      const partnerId = btn.getAttribute("data-partner-id");
      const serviceId = btn.getAttribute("data-service-id");

      modal.open({
        title: "Rate Your Home Service",
        maxWidth: "480px",
        bodyHtml: `
          <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.25rem;">
            Your review directly rewards verified service partners and guarantees platform quality.
          </p>

          <div style="text-align: center; margin-bottom: 1.5rem;">
            <div id="star-rating-box" style="cursor: pointer; display: flex; justify-content: center; gap: 0.6rem; color: #F59E0B;">
              <span class="star" data-val="1" style="display: inline-flex;">${icon("star", { size: 28, fill: "currentColor", stroke: "currentColor" })}</span>
              <span class="star" data-val="2" style="display: inline-flex;">${icon("star", { size: 28, fill: "currentColor", stroke: "currentColor" })}</span>
              <span class="star" data-val="3" style="display: inline-flex;">${icon("star", { size: 28, fill: "currentColor", stroke: "currentColor" })}</span>
              <span class="star" data-val="4" style="display: inline-flex;">${icon("star", { size: 28, fill: "currentColor", stroke: "currentColor" })}</span>
              <span class="star" data-val="5" style="display: inline-flex;">${icon("star", { size: 28, fill: "currentColor", stroke: "currentColor" })}</span>
            </div>
            <div id="star-rating-label" style="font-size: 0.85rem; font-weight: 700; color: #0F4C3A; margin-top: 0.35rem;">
              5 Stars - Excellent Service!
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Write Feedback (Optional)</label>
            <textarea id="review-comment-input" class="form-textarea" placeholder="Describe the cleanliness, punctuality, and behavior of the partner..."></textarea>
          </div>
        `,
        footerHtml: `
          <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">Cancel</button>
          <button class="btn btn-primary btn-sm" id="btn-submit-review">Submit Review</button>
        `,
        onOpen: (container) => {
          let currentRating = 5;
          const stars = container.querySelectorAll(".star");
          const label = container.querySelector("#star-rating-label");

          stars.forEach(s => {
            s.onclick = () => {
              currentRating = parseInt(s.getAttribute("data-val"));
              stars.forEach((st, idx) => {
                st.style.color = idx < currentRating ? "#F59E0B" : "#D1D5DB";
              });
              label.textContent = `${currentRating} Stars - ${currentRating === 5 ? 'Excellent!' : (currentRating >= 4 ? 'Very Good!' : 'Fair')}`;
            };
          });

          container.querySelector("#btn-submit-review").onclick = () => {
            const comment = container.querySelector("#review-comment-input").value;
            db.submitReview({
              bookingId: bId,
              partnerId,
              serviceId,
              rating: currentRating,
              comment: comment || "Clean and courteous work."
            });
            modal.close();
            toast.success("Review Submitted", "Thank you for your rating.");
          };
        }
      });
    };
  });

  // Complaint / Help Modal
  document.querySelectorAll(".btn-complain-booking").forEach(btn => {
    btn.onclick = () => {
      const bId = btn.getAttribute("data-id");

      modal.open({
        title: "Report an Issue / Contact KLEEN Support",
        maxWidth: "480px",
        bodyHtml: `
          <div class="form-group">
            <label class="form-label">Issue Subject</label>
            <select id="complaint-subject-select" class="form-select">
              <option>Partner delay or no-show</option>
              <option>Incomplete cleaning / Quality issue</option>
              <option>Billing / Payment clarification</option>
              <option>Safety or behavior concern</option>
              <option>Other feedback</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Detailed Description</label>
            <textarea id="complaint-desc-input" class="form-textarea" placeholder="Please share specific details so our operations team can resolve this immediately..."></textarea>
          </div>
        `,
        footerHtml: `
          <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">Cancel</button>
          <button class="btn btn-primary btn-sm" id="btn-submit-complaint">Submit Ticket</button>
        `,
        onOpen: (container) => {
          container.querySelector("#btn-submit-complaint").onclick = () => {
            const subject = container.querySelector("#complaint-subject-select").value;
            const desc = container.querySelector("#complaint-desc-input").value;
            const user = auth.getCurrentUser();

            db.submitComplaint({
              createdBy: user ? user.userId : "guest_user",
              userType: "customer",
              bookingId: bId,
              subject,
              description: desc || "Customer requested operational assistance."
            });

            modal.close();
            toast.success("Ticket Submitted", "Our support manager has been notified and will call you within 15 minutes.");
          };
        }
      });
    };
  });

  // --- Customer Portal Service Catalog Filter & Booking Events ---
  const custServiceContainer = document.getElementById("customer-services-container");
  const custSearchInput = document.getElementById("customer-service-search");
  const custCatChips = document.querySelectorAll("#customer-cat-chips .chip-btn");

  let custActiveCat = "all";
  let custSearchQuery = "";

  const filterAndRenderCustServices = () => {
    let list = db.getServices();

    if (custActiveCat !== "all") {
      list = list.filter(s => s.categoryId === custActiveCat);
    }

    if (custSearchQuery.trim()) {
      const q = custSearchQuery.toLowerCase();
      list = list.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.description.toLowerCase().includes(q) ||
        (s.includedTasks && s.includedTasks.some(t => t.toLowerCase().includes(q)))
      );
    }

    if (custServiceContainer) {
      custServiceContainer.innerHTML = renderCustomerServiceCards(list);
      attachCustServiceCardListeners();
    }
  };

  const attachCustServiceCardListeners = () => {
    if (!custServiceContainer) return;

    custServiceContainer.querySelectorAll(".btn-cust-book-service").forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const sId = btn.getAttribute("data-id");
        openBookingFlow(sId);
      };
    });

    custServiceContainer.querySelectorAll(".btn-cust-service-detail").forEach(el => {
      el.onclick = () => {
        const sId = el.getAttribute("data-id");
        if (sId) {
          window.location.hash = `#/services/${sId}`;
        }
      };
    });
  };

  attachCustServiceCardListeners();

  if (custSearchInput) {
    custSearchInput.oninput = (e) => {
      custSearchQuery = e.target.value;
      filterAndRenderCustServices();
    };
  }

  custCatChips.forEach(chip => {
    chip.onclick = () => {
      custCatChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      custActiveCat = chip.getAttribute("data-cat");
      filterAndRenderCustServices();
    };
  });
}
