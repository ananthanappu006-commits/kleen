/**
 * KLEEN — Complete Admin Operations Console
 * Supports all 15 operational sections: Dashboard, Customers, Partners, KYC, Services,
 * Categories, Bookings, Payments, Refunds, Reviews, Complaints, Offers, Notifications, Reports, Settings.
 */

import { db } from "../../services/db-service.js";
import { adminManager } from "../../services/admin/admin-manager.js";
import { notificationManager } from "../../services/notification/notification-manager.js";
import { modal } from "../../components/modal.js";
import { toast } from "../../components/toast.js";
import { icon } from "../../components/icons.js";

let selectedKycPartnerId = null;
try {
  selectedKycPartnerId = sessionStorage.getItem("admin_selected_kyc_id") || null;
} catch (e) {}

export function renderAdminView(activeTab = "dashboard") {
  const snapshot = db.getSnapshot();
  const partners = db.getPartners();
  const bookings = snapshot.bookings || [];
  const services = snapshot.services || [];
  const categories = snapshot.categories || [];
  const complaints = snapshot.complaints || [];
  const reviews = snapshot.reviews || [];
  const offers = snapshot.offers || [];
  const users = snapshot.users || [];
  const settings = snapshot.settings || {};
  const partnerGigSlots = snapshot.partnerGigSlots || [];

  const onlinePartners = partners.filter(p => !!p.isOnline);
  const onlinePartnersCount = onlinePartners.length;
  const activeGigSlots = partnerGigSlots.filter(s => s.status !== "CANCELLED");
  const totalBookedGigsCount = activeGigSlots.length;

  const totalRevenue = bookings
    .filter(b => b.paymentStatus === "SUCCESS")
    .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const pendingKycCount = partners.filter(p => p.kycStatus === "UNDER_REVIEW" || p.kycStatus === "SUBMITTED").length;
  const activeBookingsCount = bookings.filter(b => !["SERVICE_COMPLETED", "CUSTOMER_CANCELLED"].includes(b.bookingStatus)).length;
  const openComplaintsCount = complaints.filter(c => c.status === "OPEN").length;
  const adminNotifications = (snapshot.notifications || []).filter(n => n.userId === "usr_admin_kleen" || n.userId === "all");
  const unreadAdminCount = adminNotifications.filter(n => !n.isRead).length;
  const allPayouts = snapshot.payouts || [];
  const pendingQuickSettleCount = allPayouts.filter(p => p.status === "REQUESTED" && p.payoutType === "QUICK_SETTLE").length;

  let contentHtml = "";

  switch (activeTab) {
    case "customers":
      contentHtml = renderCustomersSection(users.filter(u => u.role === "customer"));
      break;
    case "partners":
      contentHtml = renderPartnersSection(partners, partnerGigSlots);
      break;
    case "gigs":
    case "partner-gigs":
      contentHtml = renderPartnerGigsSection(partnerGigSlots, partners, bookings);
      break;
    case "kyc":
      contentHtml = renderKycWorkbench(partners);
      break;
    case "services":
      contentHtml = renderServicesSection(services);
      break;
    case "categories":
      contentHtml = renderCategoriesSection(categories);
      break;
    case "bookings":
      contentHtml = renderBookingsSection(bookings, partners);
      break;
    case "payments":
      contentHtml = renderPaymentsSection(bookings);
      break;
    case "payouts":
      contentHtml = renderPayoutsSection(partners);
      break;
    case "refunds":
      contentHtml = renderRefundsSection(bookings);
      break;
    case "reviews":
      contentHtml = renderReviewsSection(reviews);
      break;
    case "complaints":
      contentHtml = renderComplaintsSection(complaints);
      break;
    case "offers":
      contentHtml = renderOffersSection(offers);
      break;
    case "notifications":
      contentHtml = renderNotificationsSection();
      break;
    case "reports":
      contentHtml = renderReportsSection({ totalRevenue, bookings, partners });
      break;
    case "settings":
      contentHtml = renderSettingsSection(settings);
      break;
    default:
      contentHtml = renderDashboardSection({ totalRevenue, pendingKycCount, activeBookingsCount, openComplaintsCount, bookings, partners, onlinePartners, partnerGigSlots });
      break;
  }

  return `
    <div class="admin-layout">
      <!-- Admin Sidebar with all sections -->
      <aside class="admin-sidebar">
        <div class="admin-brand" style="display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
          <img src="assets/kleen-logo-white.png" alt="KLEEN" style="height: 32px; width: auto; max-width: 120px; object-fit: contain;" />
          <span class="admin-logo-badge">ADMIN</span>
        </div>

        <ul class="admin-nav-list" style="overflow-y: auto;">
          <li class="admin-nav-item ${activeTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard">
            ${icon('bar-chart', { size: 16 })}<span>Dashboard</span>
          </li>
          <li class="admin-nav-item ${activeTab === 'customers' ? 'active' : ''}" data-tab="customers">
            ${icon('user', { size: 16 })}<span>Customers</span>
          </li>
          <li class="admin-nav-item ${activeTab === 'partners' ? 'active' : ''}" data-tab="partners">
            ${icon('users', { size: 16 })}<span>Partners</span>
            ${onlinePartnersCount > 0 ? `<span class="badge badge-success" style="margin-left:auto; font-size:0.65rem; padding: 0.15rem 0.45rem;">${onlinePartnersCount} Online</span>` : ''}
          </li>
          <li class="admin-nav-item ${activeTab === 'gigs' || activeTab === 'partner-gigs' ? 'active' : ''}" data-tab="gigs">
            ${icon('calendar-days', { size: 16 })}<span>Partner Gigs</span>
            ${totalBookedGigsCount > 0 ? `<span class="badge badge-info" style="margin-left:auto; font-size:0.65rem; padding: 0.15rem 0.45rem;">${totalBookedGigsCount} Shifts</span>` : ''}
          </li>
          <li class="admin-nav-item ${activeTab === 'kyc' ? 'active' : ''}" data-tab="kyc">
            ${icon('shield-check', { size: 16 })}<span>KYC Verification</span>
            ${pendingKycCount > 0 ? `<span class="badge badge-warning" style="margin-left:auto; font-size:0.65rem;">${pendingKycCount}</span>` : ''}
          </li>
          <li class="admin-nav-item ${activeTab === 'services' ? 'active' : ''}" data-tab="services">
            ${icon('sparkles', { size: 16 })}<span>Services</span>
          </li>
          <li class="admin-nav-item ${activeTab === 'categories' ? 'active' : ''}" data-tab="categories">
            ${icon('tag', { size: 16 })}<span>Categories</span>
          </li>
          <li class="admin-nav-item ${activeTab === 'bookings' ? 'active' : ''}" data-tab="bookings">
            ${icon('calendar', { size: 16 })}<span>Bookings</span>
            ${activeBookingsCount > 0 ? `<span class="badge badge-info" style="margin-left:auto; font-size:0.65rem;">${activeBookingsCount}</span>` : ''}
          </li>
          <li class="admin-nav-item ${activeTab === 'payments' ? 'active' : ''}" data-tab="payments">
            ${icon('credit-card', { size: 16 })}<span>Payments</span>
          </li>
          <li class="admin-nav-item ${activeTab === 'payouts' ? 'active' : ''}" data-tab="payouts">
            ${icon('bank', { size: 16 })}<span>Partner Payouts</span>
            ${pendingQuickSettleCount > 0 ? `<span class="badge badge-danger" style="margin-left:auto; font-size:0.65rem; padding: 0.15rem 0.45rem;">${icon('zap', { size: 11, fill: 'currentColor' })} ${pendingQuickSettleCount}</span>` : ''}
          </li>
          <li class="admin-nav-item ${activeTab === 'refunds' ? 'active' : ''}" data-tab="refunds">
            ${icon('coins', { size: 16 })}<span>Refunds</span>
          </li>
          <li class="admin-nav-item ${activeTab === 'reviews' ? 'active' : ''}" data-tab="reviews">
            ${icon('star', { size: 16 })}<span>Reviews</span>
          </li>
          <li class="admin-nav-item ${activeTab === 'complaints' ? 'active' : ''}" data-tab="complaints">
            ${icon('message-square', { size: 16 })}<span>Complaints</span>
            ${openComplaintsCount > 0 ? `<span class="badge badge-danger" style="margin-left:auto; font-size:0.65rem;">${openComplaintsCount}</span>` : ''}
          </li>
          <li class="admin-nav-item ${activeTab === 'offers' ? 'active' : ''}" data-tab="offers">
            ${icon('gift', { size: 16 })}<span>Offers & Coupons</span>
          </li>
          <li class="admin-nav-item ${activeTab === 'notifications' ? 'active' : ''}" data-tab="notifications">
            ${icon('bell', { size: 16 })}<span>Broadcasts & Inbox</span>
            ${unreadAdminCount > 0 ? `<span class="badge badge-danger" style="margin-left:auto; font-size:0.65rem;">${unreadAdminCount}</span>` : ''}
          </li>
          <li class="admin-nav-item ${activeTab === 'reports' ? 'active' : ''}" data-tab="reports">
            ${icon('trending-up', { size: 16 })}<span>Reports</span>
          </li>
          <li class="admin-nav-item ${activeTab === 'settings' ? 'active' : ''}" data-tab="settings">
            ${icon('settings', { size: 16 })}<span>Settings</span>
          </li>
        </ul>

        <div class="admin-sidebar-footer">
          <div>
            <div style="font-size: 0.8rem; font-weight: 700; color: #FFFFFF;">Admin Ops</div>
            <div style="font-size: 0.7rem; color: rgba(255, 255, 255, 0.6);">admin@kleen.in</div>
          </div>
          <a href="#/" class="btn btn-glass btn-sm" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">Exit</a>
        </div>
      </aside>

      <!-- Main Admin Content Area -->
      <main class="admin-main">
        <header class="admin-header">
          <h2 class="admin-page-title" style="text-transform: capitalize;">${activeTab} Management</h2>
          <div style="display: flex; align-items: center; gap: 1rem;">
            ${unreadAdminCount > 0 ? `
              <a href="#/admin/notifications" class="badge badge-warning" style="text-decoration: none; cursor: pointer; display: flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.65rem;">
                ${icon('bell', { size: 16 })}
                <span>${unreadAdminCount} New Alerts</span>
              </a>
            ` : ''}
            <span class="badge badge-success">● Firebase Synced</span>
            <span style="font-size: 0.85rem; color: var(--text-muted);">Kerala Region</span>
          </div>
        </header>

        <div class="admin-content">
          ${contentHtml}
        </div>
      </main>
    </div>
  `;
}

// 1. Dashboard
function renderDashboardSection({ totalRevenue, pendingKycCount, activeBookingsCount, openComplaintsCount, bookings, partners = [], onlinePartners = [], partnerGigSlots = [] }) {
  const activeGigSlots = (partnerGigSlots || []).filter(s => s.status !== "CANCELLED");
  const onlineCount = onlinePartners.length;
  const totalPartnersCount = partners.length;

  // Get Today's ISO date string
  const todayIso = new Date().toISOString().split("T")[0];

  return `
    <div class="kpi-grid">
      <div class="kpi-card">
        <span class="kpi-label">Gross Platform Revenue</span>
        <div class="kpi-value">₹${totalRevenue.toLocaleString()}</div>
        <div class="kpi-trend positive">↑ 24% Growth</div>
      </div>
      <div class="kpi-card" style="cursor: pointer;" onclick="window.location.hash='#/admin/bookings'">
        <span class="kpi-label">Active Bookings</span>
        <div class="kpi-value">${activeBookingsCount}</div>
        <div class="kpi-trend positive">● Live Progress →</div>
      </div>
      <div class="kpi-card" style="cursor: pointer;" onclick="window.location.hash='#/admin/partners'">
        <span class="kpi-label">Available / Online Fleet</span>
        <div class="kpi-value" style="color: ${onlineCount > 0 ? '#10B981' : 'var(--text-muted)'};">
          ${onlineCount} <span style="font-size: 0.95rem; font-weight: 500; color: var(--text-muted);">/ ${totalPartnersCount} Online</span>
        </div>
        <div class="kpi-trend ${onlineCount > 0 ? 'positive' : 'neutral'}">
          ${onlineCount > 0 ? `${icon('status-online', { size: 11 })} Live & Ready for Dispatch` : `${icon('status-offline', { size: 11 })} All Partners Offline`}
        </div>
      </div>
      <div class="kpi-card" style="cursor: pointer;" onclick="window.location.hash='#/admin/gigs'">
        <span class="kpi-label">Booked Partner Gigs</span>
        <div class="kpi-value" style="color: #2563EB;">${activeGigSlots.length} <span style="font-size: 0.95rem; font-weight: 500; color: var(--text-muted);">Shifts</span></div>
        <div class="kpi-trend positive">● Next 72h Commitments →</div>
      </div>
      <div class="kpi-card" style="cursor: pointer;" onclick="window.location.hash='#/admin/kyc'">
        <span class="kpi-label">Pending KYC Audits</span>
        <div class="kpi-value" style="color: ${pendingKycCount > 0 ? 'var(--color-warning)' : 'var(--brand-emerald-dark)'};">${pendingKycCount}</div>
        <div class="kpi-trend neutral">Review Required →</div>
      </div>
      <div class="kpi-card" style="cursor: pointer;" onclick="window.location.hash='#/admin/complaints'">
        <span class="kpi-label">Open Support Tickets</span>
        <div class="kpi-value" style="color: ${openComplaintsCount > 0 ? 'var(--color-danger)' : 'var(--color-success)'};">${openComplaintsCount}</div>
        <div class="kpi-trend neutral">Avg resolution 15m</div>
      </div>
    </div>

    <!-- Live Available / Online Partners Section -->
    <div class="solid-card" style="padding: 1.5rem; margin-bottom: 1.5rem; border-left: 5px solid #10B981;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.6rem;">
            <span class="live-status-dot online"></span>
            <h3 style="font-size: 1.2rem; margin: 0; font-weight: 700;">Live Operational Fleet — Available Partners</h3>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0.35rem 0 0;">
            Partners currently online and available to receive customer bookings and on-demand dispatches.
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <span class="badge badge-success" style="font-size: 0.8rem; padding: 0.35rem 0.75rem; display: inline-flex; align-items: center; gap: 0.4rem;">
            <span class="live-status-dot online"></span>
            ${onlineCount} Online Now
          </span>
          <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#/admin/partners'">View All Fleet (${totalPartnersCount})</button>
        </div>
      </div>

      ${onlinePartners.length === 0 ? `
        <div style="text-align: center; padding: 2.5rem 1rem; background: #F8FAFC; border-radius: 8px; border: 1.5px dashed #CBD5E1;">
          <div style="margin-bottom: 0.5rem;">${icon('status-offline', { size: 36, stroke: '#94A3B8' })}</div>
          <strong style="display: block; color: var(--text-primary); font-size: 1rem; margin-bottom: 0.25rem;">No Partners Currently Online</strong>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0 0 1rem;">
            No verified maid partners have switched to ONLINE status. You can toggle partner availability in the Partners Directory.
          </p>
          <button class="btn btn-primary btn-sm" onclick="window.location.hash='#/admin/partners'">Manage Fleet Availability</button>
        </div>
      ` : `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem;">
          ${onlinePartners.map(p => {
            const pKey = p.partnerId || p.userId || p.id;
            const pShiftsToday = activeGigSlots.filter(s => s.partnerId === pKey && s.date === todayIso);
            const pAllShifts = activeGigSlots.filter(s => s.partnerId === pKey);
            const activeBooking = bookings.find(b => b.partnerId === pKey && !["SERVICE_COMPLETED", "CUSTOMER_CANCELLED"].includes(b.bookingStatus));

            return `
              <div class="partner-live-card">
                <div style="display: flex; align-items: center; gap: 0.85rem; flex: 1;">
                  <div style="position: relative; width: 48px; height: 48px; flex-shrink: 0;">
                    <img src="${p.profileImage || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80'}"
                         alt="${p.fullName}"
                         style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2px solid #10B981;">
                    <span class="live-status-dot online" style="position: absolute; bottom: 0; right: 0; border: 2px solid #FFFFFF;" title="Online"></span>
                  </div>
                  <div style="min-width: 0;">
                    <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary); display: flex; align-items: center; gap: 0.35rem;">
                      <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${p.fullName}</span>
                      <span style="font-size: 0.75rem; color: #D97706; font-weight: 600;">${icon('star', { size: 13, fill: '#D97706', stroke: '#D97706' })} ${p.rating || 4.9}</span>
                    </div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.15rem;">
                      ${icon('map-pin', { size: 12 })} ${p.district || p.city || 'Kerala'} • ${icon('phone', { size: 12 })} ${p.phone || '—'}
                    </div>
                    <div style="margin-top: 0.4rem; display: flex; gap: 0.35rem; flex-wrap: wrap;">
                      ${pShiftsToday.length > 0 ? `
                        <span class="gig-shift-chip gig-shift-morning" style="padding: 0.15rem 0.5rem; font-size: 0.7rem;">
                          ⏱️ Today: ${pShiftsToday[0].slotTitle.replace(' Gig Shift', '')} (${pShiftsToday[0].timeSlot})
                        </span>
                      ` : `
                        <span class="badge badge-success" style="font-size: 0.65rem; padding: 0.15rem 0.45rem;">
                          ${icon('status-online', { size: 11 })} Ready for Dispatch
                        </span>
                      `}
                      ${activeBooking ? `
                        <span class="badge badge-info" style="font-size: 0.65rem; padding: 0.15rem 0.45rem;" title="Assigned Booking #${activeBooking.bookingId}">
                          ${icon('package', { size: 12 })} On Job #${activeBooking.bookingId}
                        </span>
                      ` : ''}
                    </div>
                  </div>
                </div>

                <div style="display: flex; flex-direction: column; gap: 0.4rem; align-items: flex-end; flex-shrink: 0;">
                  <button class="btn btn-glass btn-sm btn-admin-view-partner-gigs" data-id="${pKey}" style="font-size: 0.75rem; padding: 0.3rem 0.65rem;">
                    ${icon('calendar-days', { size: 13 })} ${pAllShifts.length} Gigs
                  </button>
                  <button class="btn btn-secondary btn-sm btn-admin-toggle-partner-online" data-id="${pKey}" data-online="true" style="font-size: 0.7rem; padding: 0.25rem 0.55rem; color: var(--text-muted);" title="Set partner offline">
                    Toggle Offline
                  </button>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      `}
    </div>

    <!-- Recent Dispatch Activity -->
    <div class="solid-card" style="padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h3 style="font-size: 1.15rem; margin: 0;">Recent Dispatch Activity</h3>
        <button class="btn btn-glass btn-sm" onclick="window.location.hash='#/admin/bookings'">View All Bookings →</button>
      </div>
      <div class="table-responsive">
        <table class="kleen-table">
          <thead>
            <tr><th>Booking ID</th><th>Customer</th><th>Service</th><th>Partner</th><th>Total</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${bookings.slice(0, 6).map(b => {
              const assignedPartner = partners.find(p => (p.partnerId || p.userId) === b.partnerId);
              return `
              <tr>
                <td><strong>#${b.bookingId}</strong></td>
                <td>${b.customerName || 'Customer'}</td>
                <td>${b.serviceName}</td>
                <td>
                  ${b.partnerName ? `
                    <div style="display: inline-flex; align-items: center; gap: 0.4rem;">
                      <span class="live-status-dot ${assignedPartner?.isOnline ? 'online' : 'offline'}" title="${assignedPartner?.isOnline ? 'Partner is Online' : 'Partner is Offline'}"></span>
                      <strong>${b.partnerName}</strong>
                    </div>
                  ` : '<em style="color:#B45309;">Unassigned</em>'}
                </td>
                <td><strong>₹${b.totalAmount}</strong></td>
                <td><span class="badge badge-info">${b.bookingStatus}</span></td>
              </tr>
            `;}).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 2. Customers
function renderCustomersSection(customers) {
  return `
    <div class="solid-card" style="padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <h3 style="font-size: 1.25rem; margin: 0 0 0.25rem; font-weight: 700;">Registered Customers Directory</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">Manage customer accounts, access suspension, and record deletions.</p>
        </div>
        <span class="badge badge-info" style="font-size: 0.8rem; padding: 0.35rem 0.75rem;">${customers.length} Registered</span>
      </div>
      <div class="table-responsive">
        <table class="kleen-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th style="min-width: 170px;">Actions</th></tr>
          </thead>
          <tbody>
            ${customers.length === 0 ? `
              <tr><td colspan="5" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">No registered customers found.</td></tr>
            ` : customers.map(c => `
              <tr>
                <td><strong>${c.fullName || 'Customer'}</strong></td>
                <td>${c.email || '—'}</td>
                <td>${c.phone || '+91 98765 43210'}</td>
                <td><span class="badge ${c.accountStatus === 'ACTIVE' ? 'badge-success' : 'badge-danger'}">${c.accountStatus || 'ACTIVE'}</span></td>
                <td>
                  <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <button class="btn btn-glass btn-sm btn-admin-toggle-user" data-id="${c.userId}" data-status="${c.accountStatus}">
                      ${c.accountStatus === 'SUSPENDED' ? 'Reactivate' : 'Suspend'}
                    </button>
                    <button class="btn btn-danger btn-sm btn-admin-del-customer" data-id="${c.userId}" data-name="${c.fullName || c.email || 'this customer'}">
                      ${icon('trash', { size: 14 })} Delete
                    </button>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 3. Partners Directory with Live Online Availability & Booked Gigs
function renderPartnersSection(partners, partnerGigSlots = []) {
  const activeGigSlots = (partnerGigSlots || []).filter(s => s.status !== "CANCELLED");
  const onlinePartners = partners.filter(p => !!p.isOnline);
  const onlineCount = onlinePartners.length;
  const offlineCount = partners.length - onlineCount;
  const approvedCount = partners.filter(p => p.kycStatus === "APPROVED").length;

  return `
    <div class="solid-card" style="padding: 1.5rem;">
      <!-- Header with Stats Strip -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h3 style="font-size: 1.25rem; margin: 0 0 0.35rem; font-weight: 700;">Partner & Maid Fleet Management</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
            Real-time monitoring of maid partner online readiness, booked working gigs, and verification status.
          </p>
        </div>

        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-primary btn-sm" onclick="window.location.hash='#/admin/gigs'">
            ${icon('calendar-days', { size: 14 })} View All Booked Gigs (${activeGigSlots.length})
          </button>
          <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#/admin/kyc'">
            ${icon('shield-check', { size: 14 })} KYC Workbench
          </button>
        </div>
      </div>

      <!-- Fleet Operational Summary Strip -->
      <div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 1.5rem;">
        <div class="fleet-stat-badge">
          ${icon('users', { size: 16 })}
          <div>
            <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Total Fleet</div>
            <strong>${partners.length}</strong>
          </div>
        </div>

        <div class="fleet-stat-badge" style="border-left: 3px solid #10B981;">
          <span class="live-status-dot online"></span>
          <div>
            <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Online & Available</div>
            <strong style="color: #10B981;">${onlineCount}</strong>
          </div>
        </div>

        <div class="fleet-stat-badge" style="border-left: 3px solid #94A3B8;">
          <span class="live-status-dot offline"></span>
          <div>
            <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Offline</div>
            <strong style="color: #64748B;">${offlineCount}</strong>
          </div>
        </div>

        <div class="fleet-stat-badge" style="border-left: 3px solid #3B82F6;">
          ${icon('shield-check', { size: 16 })}
          <div>
            <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">KYC Verified</div>
            <strong style="color: #2563EB;">${approvedCount}</strong>
          </div>
        </div>

        <div class="fleet-stat-badge" style="border-left: 3px solid #F59E0B;">
          ${icon('calendar-days', { size: 16 })}
          <div>
            <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 700;">Committed Shifts</div>
            <strong style="color: #D97706;">${activeGigSlots.length}</strong>
          </div>
        </div>
      </div>

      <!-- Filter Controls & Search -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
        <div class="filter-pills" id="partner-filter-pills">
          <button class="filter-pill active" data-filter="all">All (${partners.length})</button>
          <button class="filter-pill" data-filter="online">${icon('status-online', { size: 11 })} Online Now (${onlineCount})</button>
          <button class="filter-pill" data-filter="offline">${icon('status-offline', { size: 11 })} Offline (${offlineCount})</button>
          <button class="filter-pill" data-filter="approved">${icon('shield-check', { size: 12 })} KYC Approved (${approvedCount})</button>
        </div>

        <div style="position: relative; min-width: 240px;">
          <input type="text" id="partner-search-input" class="form-input" placeholder="Search name, phone, district..." style="padding: 0.4rem 0.75rem 0.4rem 2rem; font-size: 0.85rem;">
          <span style="position: absolute; left: 0.7rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; display:flex; align-items:center;">${icon('search', { size: 13 })}</span>
        </div>
      </div>

      <!-- Partners Fleet Table -->
      <div class="table-responsive">
        <table class="kleen-table" id="admin-partners-table">
          <thead>
            <tr>
              <th>Partner</th>
              <th>Contact</th>
              <th>Live Availability</th>
              <th>Booked Gigs</th>
              <th>KYC Status</th>
              <th>Rating & Jobs</th>
              <th>Earnings</th>
              <th style="min-width: 220px; text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${partners.length === 0 ? `
              <tr><td colspan="8" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">No partners found in fleet directory.</td></tr>
            ` : partners.map(p => {
              const pKey = p.partnerId || p.userId || p.id;
              const isOnline = !!p.isOnline;
              const pGigs = activeGigSlots.filter(s => s.partnerId === pKey);

              return `
              <tr class="partner-row" data-online="${isOnline}" data-kyc="${p.kycStatus}" data-search="${(p.fullName + ' ' + (p.phone || '') + ' ' + (p.district || p.city || '')).toLowerCase()}">
                <td>
                  <div style="display: flex; align-items: center; gap: 0.65rem;">
                    <div style="position: relative; width: 38px; height: 38px; flex-shrink: 0;">
                      <img src="${p.profileImage || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80'}"
                           alt="${p.fullName}"
                           style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 1.5px solid ${isOnline ? '#10B981' : '#E2E8F0'};">
                      <span class="live-status-dot ${isOnline ? 'online' : 'offline'}" style="position: absolute; bottom: -1px; right: -1px; border: 1.5px solid #FFFFFF;"></span>
                    </div>
                    <div>
                      <strong style="display: block; font-size: 0.9rem; color: var(--text-primary);">${p.fullName || 'Partner'}</strong>
                      <span style="font-size: 0.75rem; color: var(--text-muted);">${icon('map-pin', { size: 12 })} ${p.district || p.city || 'Kerala'}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <div style="font-size: 0.85rem; font-weight: 500;">${p.phone || '—'}</div>
                  <div style="font-size: 0.7rem; color: var(--text-muted);">${p.email || '—'}</div>
                </td>
                <td>
                  ${isOnline ? `
                    <span class="badge badge-success" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.65rem; font-weight: 700; box-shadow: 0 0 10px rgba(16, 185, 129, 0.2);">
                      <span class="live-status-dot online"></span>
                      ONLINE (Available)
                    </span>
                  ` : `
                    <span class="badge badge-neutral" style="color: var(--text-muted); display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.65rem;">
                      <span class="live-status-dot offline"></span>
                      OFFLINE
                    </span>
                  `}
                </td>
                <td>
                  <button class="btn btn-glass btn-sm btn-admin-view-partner-gigs" data-id="${pKey}" style="font-size: 0.75rem; padding: 0.25rem 0.6rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.3rem;" title="Click to view all booked gig shifts">
                    ${icon('calendar-days', { size: 16 })}
                    <span>${pGigs.length} Shifts</span>
                  </button>
                </td>
                <td>
                  <span class="badge ${p.kycStatus === 'APPROVED' ? 'badge-success' : (p.kycStatus === 'REJECTED' ? 'badge-danger' : 'badge-warning')}">
                    ${p.kycStatus}
                  </span>
                </td>
                <td>
                  <div style="font-size: 0.85rem; font-weight: 600; color: #D97706;">${icon('star', { size: 13, fill: '#D97706', stroke: '#D97706' })} ${p.rating || 4.9}</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${p.totalCompletedJobs || 0} jobs completed</div>
                </td>
                <td>
                  <strong style="color: var(--text-primary);">₹${(p.totalEarnings || 0).toLocaleString()}</strong>
                </td>
                <td style="text-align: right;">
                  <div style="display: inline-flex; gap: 0.35rem; align-items: center; flex-wrap: wrap; justify-content: flex-end;">
                    <button class="btn btn-primary btn-sm btn-admin-view-partner-gigs" data-id="${pKey}" style="font-size: 0.75rem; padding: 0.25rem 0.55rem;">
                      ${icon('calendar-days', { size: 13 })} View Gigs
                    </button>
                    <button class="btn btn-secondary btn-sm btn-admin-toggle-partner-online" data-id="${pKey}" data-online="${isOnline}" style="font-size: 0.75rem; padding: 0.25rem 0.55rem;" title="Toggle online status">
                      ${isOnline ? 'Set Offline' : 'Set Online'}
                    </button>
                    <button class="btn btn-glass btn-sm" onclick="window.location.hash='#/admin/kyc'" style="font-size: 0.75rem; padding: 0.25rem 0.55rem;">
                      KYC
                    </button>
                    <button class="btn btn-danger btn-sm btn-admin-del-partner" data-id="${pKey}" data-name="${p.fullName || 'this partner'}" style="font-size: 0.75rem; padding: 0.25rem 0.55rem;">
                      ${icon('trash', { size: 14 })}
                    </button>
                  </div>
                </td>
              </tr>
            `;}).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 4. Dedicated Partner Gigs & Shift Management Section
function renderPartnerGigsSection(partnerGigSlots = [], partners = [], bookings = []) {
  const activeSlots = (partnerGigSlots || []).filter(s => s.status !== "CANCELLED");
  const todayIso = new Date().toISOString().split("T")[0];
  const allowedDates = db.getPartnerAllowedDateRange();

  const todaySlots = activeSlots.filter(s => s.date === todayIso);
  const onlinePartners = partners.filter(p => !!p.isOnline);
  const onlinePartnerIds = new Set(onlinePartners.map(p => p.partnerId || p.userId));
  const onlineCommittedCount = activeSlots.filter(s => onlinePartnerIds.has(s.partnerId)).length;
  const totalFleetHours = activeSlots.length * 4;

  return `
    <div class="solid-card" style="padding: 1.5rem;">
      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
            ${icon('calendar-days', { size: 18 })}
            <h3 style="font-size: 1.3rem; margin: 0; font-weight: 700;">Partner Booked Gigs & Shift Commitments</h3>
          </div>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
            Complete operational schedule of 4-hour working gig slots booked by maid partners across 3-day windows.
          </p>
        </div>

        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#/admin/partners'">
            ${icon('users', { size: 14 })} Manage Fleet (${partners.length})
          </button>
          <button class="btn btn-glass btn-sm" onclick="window.location.hash='#/admin/bookings'">
            ${icon('calendar', { size: 14 })} Dispatch Bookings
          </button>
        </div>
      </div>

      <!-- KPI Metrics Strip -->
      <div class="kpi-grid" style="margin-bottom: 1.75rem;">
        <div class="kpi-card">
          <span class="kpi-label">Total Booked Shifts</span>
          <div class="kpi-value" style="color: #2563EB;">${activeSlots.length}</div>
          <div class="kpi-trend positive">● All 3-Day Windows</div>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Today's Active Shifts</span>
          <div class="kpi-value" style="color: #D97706;">${todaySlots.length}</div>
          <div class="kpi-trend neutral">Today (${allowedDates[0]?.formatted || 'Today'})</div>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Online Partners Committed</span>
          <div class="kpi-value" style="color: #10B981;">${onlineCommittedCount}</div>
          <div class="kpi-trend positive">${icon('status-online', { size: 11 })} Currently Online</div>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Fleet Hours Committed</span>
          <div class="kpi-value" style="color: #7C3AED;">${totalFleetHours} <span style="font-size: 0.95rem; font-weight: 500;">hrs</span></div>
          <div class="kpi-trend neutral">4.0 hrs per shift block</div>
        </div>
      </div>

      <!-- Filter Controls -->
      <div style="display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 1.5rem; background: #F8FAFC; padding: 1rem 1.25rem; border-radius: 8px; border: 1px solid #E2E8F0;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <!-- Date Filter Pills -->
          <div class="filter-pills" id="gig-date-filters">
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); margin-right: 0.25rem;">Date:</span>
            <button class="filter-pill active" data-date="all">All Dates (${activeSlots.length})</button>
            ${allowedDates.map((d, i) => {
              const count = activeSlots.filter(s => s.date === d.iso).length;
              return `<button class="filter-pill" data-date="${d.iso}">${d.label} (${count})</button>`;
            }).join("")}
          </div>

          <!-- Shift Filter Pills -->
          <div class="filter-pills" id="gig-shift-filters">
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); margin-right: 0.25rem;">Shift:</span>
            <button class="filter-pill active" data-shift="all">All Shifts</button>
            <button class="filter-pill" data-shift="morning">${icon('sunrise', { size: 14 })} Morning</button>
            <button class="filter-pill" data-shift="midday">${icon('sun', { size: 14 })} Midday</button>
            <button class="filter-pill" data-shift="afternoon">${icon('sunset', { size: 14 })} Afternoon</button>
            <button class="filter-pill" data-shift="evening">${icon('moon', { size: 14 })} Evening</button>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <!-- Partner Selector -->
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary);">Partner:</span>
            <select id="gig-filter-partner-select" class="form-select" style="padding: 0.35rem 0.75rem; font-size: 0.85rem; width: 220px;">
              <option value="all">-- All Partners (${partners.length}) --</option>
              ${partners.map(p => `
                <option value="${p.partnerId || p.userId}">${p.isOnline ? '●' : '○'} ${p.fullName} (${p.district || p.city || 'Kerala'})</option>
              `).join("")}
            </select>
          </div>

          <!-- Search -->
          <div style="position: relative; min-width: 240px;">
            <input type="text" id="gig-search-input" class="form-input" placeholder="Search partner or shift..." style="padding: 0.35rem 0.75rem 0.35rem 2rem; font-size: 0.85rem;">
            <span style="position: absolute; left: 0.7rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; display:flex; align-items:center;">${icon('search', { size: 13 })}</span>
          </div>
        </div>
      </div>

      <!-- Shifts Table -->
      <div class="table-responsive">
        <table class="kleen-table" id="admin-gigs-table">
          <thead>
            <tr>
              <th>Partner</th>
              <th>Availability</th>
              <th>Gig Shift</th>
              <th>Date & Time</th>
              <th>Assigned Customer Bookings</th>
              <th>Status</th>
              <th style="min-width: 170px; text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${activeSlots.length === 0 ? `
              <tr><td colspan="7" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
                <div style="margin-bottom: 0.5rem;">${icon('calendar-days', { size: 36, stroke: 'var(--brand-emerald)' })}</div>
                <strong>No Booked Gigs Found</strong>
                <p style="font-size: 0.85rem; margin: 0.25rem 0 0;">No partner has booked gig shifts for this period.</p>
              </td></tr>
            ` : activeSlots.map(slot => {
              const partner = partners.find(p => (p.partnerId || p.userId) === slot.partnerId);
              const pName = partner ? partner.fullName : slot.partnerId;
              const isOnline = partner ? !!partner.isOnline : false;

              // Check if customer booking scheduled during this partner's shift
              const matchingBookings = bookings.filter(b => 
                (b.partnerId === slot.partnerId || (partner && b.partnerName === partner.fullName)) &&
                b.bookingDate === slot.date
              );

              // Shift badge styling class
              let shiftClass = "gig-shift-morning";
              const titleLower = (slot.slotTitle || "").toLowerCase();
              if (titleLower.includes("midday")) shiftClass = "gig-shift-midday";
              else if (titleLower.includes("afternoon")) shiftClass = "gig-shift-afternoon";
              else if (titleLower.includes("evening")) shiftClass = "gig-shift-evening";

              const isToday = slot.date === todayIso;

              return `
                <tr class="gig-row" 
                    data-date="${slot.date}" 
                    data-shift="${titleLower}" 
                    data-partner="${slot.partnerId}"
                    data-search="${(pName + ' ' + slot.slotTitle + ' ' + slot.timeSlot + ' ' + (partner?.district || '')).toLowerCase()}">
                  <td>
                    <div style="display: flex; align-items: center; gap: 0.65rem;">
                      <div style="position: relative; width: 36px; height: 36px; flex-shrink: 0;">
                        <img src="${partner?.profileImage || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80'}"
                             alt="${pName}"
                             style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 1.5px solid ${isOnline ? '#10B981' : '#E2E8F0'};">
                        <span class="live-status-dot ${isOnline ? 'online' : 'offline'}" style="position: absolute; bottom: -1px; right: -1px; border: 1.5px solid #FFFFFF;"></span>
                      </div>
                      <div>
                        <strong style="display: block; font-size: 0.88rem; color: var(--text-primary);">${pName}</strong>
                        <span style="font-size: 0.725rem; color: var(--text-muted);">${icon('map-pin', { size: 12 })} ${partner?.district || partner?.city || 'Kerala'} • ${icon('phone', { size: 12 })} ${partner?.phone || '—'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    ${isOnline ? `
                      <span class="badge badge-success" style="display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; padding: 0.25rem 0.55rem;">
                        <span class="live-status-dot online"></span>
                        ONLINE
                      </span>
                    ` : `
                      <span class="badge badge-neutral" style="color: var(--text-muted); display: inline-flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; padding: 0.25rem 0.55rem;">
                        <span class="live-status-dot offline"></span>
                        OFFLINE
                      </span>
                    `}
                  </td>
                  <td>
                    <span class="gig-shift-chip ${shiftClass}">
                      ${slot.slotTitle}
                    </span>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.2rem;">4.0 hrs shift window</div>
                  </td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 0.4rem;">
                      <strong style="font-size: 0.85rem; color: var(--text-primary);">${slot.date}</strong>
                      ${isToday ? `<span class="badge badge-warning" style="font-size: 0.65rem; padding: 0.1rem 0.4rem;">TODAY</span>` : ''}
                    </div>
                    <div style="font-size: 0.75rem; color: var(--brand-emerald-dark); font-weight: 600; margin-top: 0.15rem;">
                      ⏱️ ${slot.timeSlot}
                    </div>
                  </td>
                  <td>
                    ${matchingBookings.length > 0 ? `
                      <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                        ${matchingBookings.map(b => `
                          <div style="font-size: 0.75rem; background: #F0FDF4; border: 1px solid #BBF7D0; padding: 0.25rem 0.5rem; border-radius: 4px; color: #166534;">
                            <strong>#${b.bookingId}</strong>: ${b.serviceName} (${b.startTime}) • <em>${b.customerName}</em>
                          </div>
                        `).join("")}
                      </div>
                    ` : `
                      <span class="badge badge-warning" style="background: rgba(245, 158, 11, 0.08); color: #B45309; border: 1px solid rgba(245, 158, 11, 0.25); font-size: 0.75rem;">
                        ${icon('status-busy', { size: 11 })} Available for Dispatch (0 Jobs)
                      </span>
                    `}
                  </td>
                  <td>
                    <span class="badge badge-success">BOOKED</span>
                  </td>
                  <td style="text-align: right;">
                    <div style="display: inline-flex; gap: 0.35rem; align-items: center; justify-content: flex-end;">
                      <button class="btn btn-glass btn-sm btn-admin-view-partner-gigs" data-id="${slot.partnerId}" style="font-size: 0.75rem; padding: 0.25rem 0.55rem;" title="View all booked gigs for this partner">
                        Schedule
                      </button>
                      <button class="btn btn-danger btn-sm btn-admin-cancel-gig" data-slot-id="${slot.slotId}" data-name="${pName}" data-time="${slot.timeSlot}" data-date="${slot.date}" style="font-size: 0.75rem; padding: 0.25rem 0.55rem;" title="Admin cancellation of gig shift">
                        ${icon('x', { size: 13 })} Cancel Shift
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// Modal helper: Open Partner Gigs & Bookings detailed breakdown
function openPartnerGigsModal(partnerId) {
  const snapshot = db.getSnapshot();
  const partner = (snapshot.partners || []).find(p => (p.partnerId || p.userId) === partnerId);
  if (!partner) {
    toast.error("Partner Not Found", "Could not locate partner profile.");
    return;
  }

  const pKey = partner.partnerId || partner.userId;
  const isOnline = !!partner.isOnline;
  const partnerGigs = (snapshot.partnerGigSlots || []).filter(s => s.partnerId === pKey && s.status !== "CANCELLED");
  const partnerBookings = (snapshot.bookings || []).filter(b => b.partnerId === pKey || b.partnerName === partner.fullName);

  modal.open({
    title: `Partner Operations: ${partner.fullName}`,
    maxWidth: "740px",
    bodyHtml: `
      <div style="max-height: 75vh; overflow-y: auto; padding-right: 0.35rem;">
        <!-- Partner Profile Card -->
        <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 1.25rem; margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="position: relative; width: 64px; height: 64px; flex-shrink: 0;">
              <img src="${partner.profileImage || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'}"
                   alt="${partner.fullName}"
                   style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2.5px solid ${isOnline ? '#10B981' : '#CBD5E1'};">
              <span class="live-status-dot ${isOnline ? 'online' : 'offline'}" style="position: absolute; bottom: 1px; right: 1px; border: 2px solid #FFFFFF;"></span>
            </div>
            <div>
              <h4 style="margin: 0 0 0.25rem; font-size: 1.15rem; font-weight: 700; color: var(--text-primary);">${partner.fullName}</h4>
              <div style="font-size: 0.8rem; color: var(--text-muted);">
                ${icon('map-pin', { size: 12 })} ${partner.address || partner.district || 'Kerala'} • ${icon('phone', { size: 12 })} ${partner.phone || '—'}
              </div>
              <div style="display: flex; gap: 0.5rem; align-items: center; margin-top: 0.5rem;">
                <span class="badge ${isOnline ? 'badge-success' : 'badge-neutral'}" style="display: inline-flex; align-items: center; gap: 0.35rem;">
                  <span class="live-status-dot ${isOnline ? 'online' : 'offline'}"></span>
                  ${isOnline ? 'ONLINE (Accepting Jobs)' : 'OFFLINE'}
                </span>
                <span class="badge ${partner.kycStatus === 'APPROVED' ? 'badge-success' : 'badge-warning'}">KYC: ${partner.kycStatus}</span>
                <span style="font-size: 0.8rem; font-weight: 600; color: #D97706;">${icon('star', { size: 13, fill: '#D97706', stroke: '#D97706' })} ${partner.rating || 4.9}</span>
              </div>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.4rem; align-items: flex-end;">
            <button class="btn btn-secondary btn-sm" id="modal-btn-toggle-online" data-id="${pKey}">
              ${icon('zap', { size: 13, fill: 'currentColor' })} ${isOnline ? 'Switch Offline' : 'Switch Online'}
            </button>
            <div style="font-size: 0.75rem; color: var(--text-muted);">
              Earnings: <strong>₹${(partner.totalEarnings || 0).toLocaleString()}</strong>
            </div>
          </div>
        </div>

        <!-- Section 1: Booked Working Gig Shifts -->
        <div style="margin-bottom: 1.75rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <h4 style="font-size: 1rem; margin: 0; font-weight: 700; display: flex; align-items: center; gap: 0.4rem;">
              ${icon('calendar-days', { size: 16 })}
              <span>Booked Working Gig Shifts (${partnerGigs.length})</span>
            </h4>
            <span style="font-size: 0.75rem; color: var(--text-muted);">${partnerGigs.length * 4} Total Working Hours Committed</span>
          </div>

          ${partnerGigs.length === 0 ? `
            <div style="padding: 1.5rem; text-align: center; background: #F9FAFB; border-radius: 8px; border: 1px dashed #CBD5E1; color: var(--text-muted); font-size: 0.85rem;">
              No 4-hour gig shifts booked by this partner.
            </div>
          ` : `
            <div class="table-responsive">
              <table class="kleen-table" style="font-size: 0.85rem;">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Shift Block</th>
                    <th>Time Window</th>
                    <th>Status</th>
                    <th style="text-align: right;">Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${partnerGigs.map(slot => `
                    <tr>
                      <td><strong>${slot.date}</strong></td>
                      <td><span class="gig-shift-chip gig-shift-morning">${slot.slotTitle}</span></td>
                      <td>⏱️ ${slot.timeSlot}</td>
                      <td><span class="badge badge-success">BOOKED</span></td>
                      <td style="text-align: right;">
                        <button class="btn btn-danger btn-sm btn-modal-cancel-gig" data-slot-id="${slot.slotId}" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;">
                          Cancel Shift
                        </button>
                      </td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          `}
        </div>

        <!-- Section 2: Assigned Customer Bookings -->
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <h4 style="font-size: 1rem; margin: 0; font-weight: 700; display: flex; align-items: center; gap: 0.4rem;">
              ${icon('package', { size: 16 })}
              <span>Assigned Customer Booking Orders (${partnerBookings.length})</span>
            </h4>
          </div>

          ${partnerBookings.length === 0 ? `
            <div style="padding: 1.5rem; text-align: center; background: #F9FAFB; border-radius: 8px; border: 1px dashed #CBD5E1; color: var(--text-muted); font-size: 0.85rem;">
              No customer bookings currently assigned to this partner.
            </div>
          ` : `
            <div class="table-responsive">
              <table class="kleen-table" style="font-size: 0.85rem;">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Scheduled Time</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${partnerBookings.map(b => `
                    <tr>
                      <td><strong>#${b.bookingId}</strong></td>
                      <td>${b.customerName || 'Customer'}</td>
                      <td>${b.serviceName}</td>
                      <td>${b.bookingDate} (${b.startTime})</td>
                      <td><strong>₹${b.totalAmount}</strong></td>
                      <td><span class="badge badge-info">${b.bookingStatus}</span></td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `,
    footerHtml: `
      <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">Close</button>
    `,
    onOpen: (container) => {
      const toggleBtn = container.querySelector("#modal-btn-toggle-online");
      if (toggleBtn) {
        toggleBtn.onclick = () => {
          adminManager.togglePartnerAvailability(pKey);
          modal.close();
          toast.success("Availability Updated", `Toggled online status for ${partner.fullName}.`);
          window.location.reload();
        };
      }

      container.querySelectorAll(".btn-modal-cancel-gig").forEach(btn => {
        btn.onclick = () => {
          const sId = btn.getAttribute("data-slot-id");
          if (confirm("Cancel this booked gig shift on behalf of partner?")) {
            adminManager.cancelPartnerGigSlot(sId);
            modal.close();
            toast.info("Shift Cancelled", "Booked gig slot has been released.");
            window.location.reload();
          }
        };
      });
    }
  });
}

// Helper: Render KYC Document Card with Preview & Zoom
function renderKycDocCard(title, doc, subtitle, placeholderIcon = "file-text") {
  if (!doc || !doc.fileUrl) {
    return `
      <div class="kyc-doc-card">
        <div class="kyc-doc-card-header">
          <strong style="font-size: 0.85rem; color: var(--text-primary);">${title}</strong>
          <span class="badge badge-neutral" style="font-size: 0.65rem;">NOT UPLOADED</span>
        </div>
        <div class="kyc-doc-thumb-box" style="background: #F9FAFB; border-style: dashed; cursor: default;">
          <div style="text-align: center; color: var(--text-muted);">
            <div style="display: flex; justify-content: center; align-items: center; margin-bottom: 0.35rem; color: #9CA3AF;">${icon(placeholderIcon || "file-text", { size: 30, stroke: "#9CA3AF" })}</div>
            <span style="font-size: 0.75rem;">Document not provided</span>
          </div>
        </div>
        <span style="font-size: 0.725rem; color: var(--text-muted);">${subtitle}</span>
      </div>
    `;
  }

  const isPdf = doc.fileName?.toLowerCase().endsWith(".pdf") || (typeof doc.fileUrl === "string" && doc.fileUrl.startsWith("data:application/pdf"));
  const fileName = doc.fileName || `${title.toLowerCase().replace(/\s+/g, "_")}.jpg`;

  return `
    <div class="kyc-doc-card">
      <div class="kyc-doc-card-header">
        <strong style="font-size: 0.85rem; color: var(--text-primary);">${title}</strong>
        <span class="badge badge-success" style="font-size: 0.65rem;">UPLOADED</span>
      </div>
      <div class="kyc-doc-thumb-box btn-inspect-doc" data-url="${doc.fileUrl}" data-title="${title}" data-filename="${fileName}" data-is-pdf="${isPdf}">
        ${isPdf ? `
          <div style="text-align: center; padding: 1rem;">
            <div style="margin-bottom: 0.25rem;">${icon('file-text', { size: 36, stroke: '#DC2626' })}</div>
            <strong style="font-size: 0.8rem; display: block; color: var(--text-primary); word-break: break-all;">${fileName}</strong>
            <span style="font-size: 0.7rem; color: var(--brand-emerald-dark); font-weight: 600;">Click to Inspect PDF</span>
          </div>
        ` : `
          <img src="${doc.fileUrl}" alt="${title}" class="kyc-doc-thumb-img" onerror="this.src='https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80'">
          <div class="kyc-doc-zoom-overlay">${icon('search', { size: 13 })} Inspect Document</div>
        `}
      </div>
      <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem;">
        <span style="color: var(--text-muted); max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${fileName}">${fileName}</span>
        <button type="button" class="btn btn-glass btn-sm btn-inspect-doc" data-url="${doc.fileUrl}" data-title="${title}" data-filename="${fileName}" data-is-pdf="${isPdf}" style="padding: 0.2rem 0.5rem; font-size: 0.7rem;">
          View Full
        </button>
      </div>
    </div>
  `;
}

// 4. KYC Workbench
function renderKycWorkbench(partners) {
  if (!partners || partners.length === 0) {
    return `
      <div class="solid-card" style="padding: 3rem; text-align: center;">
        <div style="margin-bottom: 0.75rem;">${icon('shield-check', { size: 44, stroke: 'var(--brand-emerald)' })}</div>
        <h3>No Partner Applications</h3>
        <p style="color: var(--text-muted); font-size: 0.9rem;">No partner registrations found in the fleet database.</p>
      </div>
    `;
  }

  // Sort queue: UNDER_REVIEW / SUBMITTED first, then REJECTED, then APPROVED
  const sortedPartners = [...partners].sort((a, b) => {
    const scoreA = (a.kycStatus === "UNDER_REVIEW" || a.kycStatus === "SUBMITTED") ? 0 : (a.kycStatus === "REJECTED" ? 1 : 2);
    const scoreB = (b.kycStatus === "UNDER_REVIEW" || b.kycStatus === "SUBMITTED") ? 0 : (b.kycStatus === "REJECTED" ? 1 : 2);
    return scoreA - scoreB;
  });

  // Determine active selected partner
  let activePartner = null;
  if (selectedKycPartnerId) {
    activePartner = sortedPartners.find(p => (p.partnerId || p.userId || p.id) === selectedKycPartnerId);
  }
  if (!activePartner) {
    try {
      const savedSelectedId = sessionStorage.getItem("admin_selected_kyc_id");
      if (savedSelectedId) {
        activePartner = sortedPartners.find(p => (p.partnerId || p.userId || p.id) === savedSelectedId);
        if (activePartner) selectedKycPartnerId = savedSelectedId;
      }
    } catch (e) {}
  }
  if (!activePartner) {
    activePartner = sortedPartners.find(p => p.kycStatus === "UNDER_REVIEW" || p.kycStatus === "SUBMITTED") || sortedPartners[0];
    if (activePartner) {
      selectedKycPartnerId = activePartner.partnerId || activePartner.userId || activePartner.id;
      try { sessionStorage.setItem("admin_selected_kyc_id", selectedKycPartnerId); } catch (e) {}
    }
  }

  const activePartnerKey = activePartner.partnerId || activePartner.userId || activePartner.id || "partner";

  // Fetch KYC details for active partner — try multiple key variants
  const kycData = db.getPartnerKyc(activePartnerKey)
    || db.getPartnerKyc(activePartner.partnerId)
    || db.getPartnerKyc(activePartner.userId)
    || {};
  const pendingCount = partners.filter(p => p.kycStatus === "UNDER_REVIEW" || p.kycStatus === "SUBMITTED").length;

  // Resolve documents: kycData > partner record fields > URL fallbacks
  const identityDoc = kycData.identityDocument
    || activePartner.identityDocument
    || (activePartner.idProofUrl ? { fileName: "Aadhaar_ID_Proof.jpg", fileUrl: activePartner.idProofUrl } : null);
  const addressDoc = kycData.addressDocument
    || activePartner.addressDocument
    || (activePartner.addressProofUrl ? { fileName: "Address_Proof.jpg", fileUrl: activePartner.addressProofUrl } : null);
  const profilePhotoDoc = kycData.profilePhoto
    || activePartner.profilePhoto
    || (activePartner.profileImage ? { fileName: "Profile_Photo.jpg", fileUrl: activePartner.profileImage } : null);
  const additionalDoc = kycData.additionalDocument || activePartner.additionalDocument || null;

  const fullAddress = activePartner.address || kycData.address || "Kerala, India";
  const districtCity = activePartner.district || activePartner.city || kycData.district || kycData.city || "Thiruvananthapuram, Kerala";
  const submittedDate = activePartner.submittedAt || kycData.submittedAt;
  const formattedDate = submittedDate ? new Date(submittedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recently Registered";

  const isPending = activePartner.kycStatus === "UNDER_REVIEW" || activePartner.kycStatus === "SUBMITTED";
  const isApproved = activePartner.kycStatus === "APPROVED";
  const isRejected = activePartner.kycStatus === "REJECTED";

  return `
    <div class="kyc-workbench animate-fade-in">
      <!-- Sidebar: Partner Queue -->
      <div class="workbench-sidebar">
        <div style="padding: 1.25rem; border-bottom: 1px solid #E5E7EB; background: #FAFBFB;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h4 style="font-size: 0.95rem; margin: 0; font-weight: 700;">Verification Queue</h4>
            ${pendingCount > 0 ? `<span class="badge badge-warning" style="font-size: 0.7rem;">${pendingCount} Pending</span>` : `<span class="badge badge-success" style="font-size: 0.7rem;">All Clear</span>`}
          </div>
          <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0.35rem 0 0;">Select a partner to audit documents</p>
        </div>
        <div style="overflow-y: auto; flex: 1;">
          ${sortedPartners.map(p => {
            const pKey = p.partnerId || p.userId || p.id;
            const isItemPending = p.kycStatus === "UNDER_REVIEW" || p.kycStatus === "SUBMITTED";
            const isItemActive = pKey === activePartnerKey;
            return `
              <div class="partner-queue-item ${isItemActive ? 'active' : ''}" data-partner-id="${pKey}">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.25rem;">
                  <strong style="font-size: 0.875rem; color: var(--text-primary);">${p.fullName}</strong>
                  <span class="badge ${p.kycStatus === 'APPROVED' ? 'badge-success' : (p.kycStatus === 'REJECTED' ? 'badge-danger' : 'badge-warning')}" style="font-size: 0.65rem;">
                    ${isItemPending ? 'NEEDS REVIEW' : p.kycStatus}
                  </span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-muted);">
                  <span>${p.phone || 'No phone'}</span>
                  <span>${p.district || p.city || 'Kerala'}</span>
                </div>
                ${isItemPending ? `
                  <div style="margin-top: 0.35rem; display: flex; align-items: center; gap: 0.35rem; font-size: 0.7rem; color: #D97706; font-weight: 600;">
                    <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #F59E0B;"></span>
                    Documents Submitted for Review
                  </div>
                ` : ''}
              </div>
            `;
          }).join("")}
        </div>
      </div>

      <!-- Center Viewer: Partner Details & Documents -->
      <div class="workbench-viewer" style="overflow-y: auto;">
        <!-- Partner Top Banner -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
          <div style="display: flex; gap: 1rem; align-items: center;">
            <div style="width: 52px; height: 52px; border-radius: 50%; overflow: hidden; background: #E5E7EB; border: 2px solid #D1D5DB; flex-shrink: 0;">
              <img src="${profilePhotoDoc?.fileUrl || activePartner.profileImage || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80'}" alt="${activePartner.fullName}" style="width: 100%; height: 100%; object-fit: cover;">
            </div>
            <div>
              <h3 style="font-size: 1.25rem; margin: 0 0 0.25rem; color: var(--text-primary); font-weight: 700;">${activePartner.fullName}</h3>
              <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; font-size: 0.8rem; color: var(--text-muted);">
                <span>ID: <code>${activePartnerKey}</code></span>
                <span>•</span>
                <span>${icon('phone', { size: 12 })} ${activePartner.phone || 'N/A'}</span>
                <span>•</span>
                <span>${icon('mail', { size: 12 })} ${activePartner.email || 'N/A'}</span>
              </div>
            </div>
          </div>
          <div>
            <span class="badge ${isApproved ? 'badge-success' : (isRejected ? 'badge-danger' : 'badge-warning')}" style="font-size: 0.8rem; padding: 0.4rem 0.75rem;">
              ${isPending ? 'Awaiting Admin Verification' : (isApproved ? 'KYC Verified' : 'KYC Rejected')}
            </span>
          </div>
        </div>

        <!-- Rejection Alert if applicable -->
        ${isRejected ? `
          <div style="background: #FEF2F2; border: 1px solid #FCA5A5; border-radius: var(--radius-md); padding: 0.9rem 1.25rem; margin-bottom: 1.25rem; color: #991B1B;">
            <strong>Reason for Rejection:</strong>
            <p style="font-size: 0.85rem; margin: 0.25rem 0 0; line-height: 1.4;">${activePartner.rejectionReason || kycData.rejectionReason || "Documents require resubmission."}</p>
          </div>
        ` : ''}

        <!-- Personal & Location Metadata Card -->
        <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem;">
          <h4 style="font-size: 0.9rem; margin: 0 0 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Partner Information</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; font-size: 0.85rem;">
            <div>
              <span style="color: var(--text-muted); display: block; font-size: 0.75rem;">Residential Address</span>
              <strong style="color: var(--text-primary);">${fullAddress}</strong>
            </div>
            <div>
              <span style="color: var(--text-muted); display: block; font-size: 0.75rem;">District / Coverage Zone</span>
              <strong style="color: var(--text-primary);">${districtCity}</strong>
            </div>
            <div>
              <span style="color: var(--text-muted); display: block; font-size: 0.75rem;">Date of Birth / Gender</span>
              <strong style="color: var(--text-primary);">${kycData.dateOfBirth || activePartner.dateOfBirth || '1994-05-12'} (${kycData.gender || activePartner.gender || 'Female'})</strong>
            </div>
            <div>
              <span style="color: var(--text-muted); display: block; font-size: 0.75rem;">Submitted Timestamp</span>
              <strong style="color: var(--text-primary);">${formattedDate}</strong>
            </div>
          </div>
        </div>

        <!-- Uploaded Documents Inspection Grid -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <h4 style="font-size: 0.95rem; margin: 0; font-weight: 700;">Uploaded Verification Documents</h4>
          <span style="font-size: 0.75rem; color: var(--text-muted);">Click any document to inspect full-size</span>
        </div>

        <div class="kyc-doc-grid">
          ${renderKycDocCard("1. Aadhaar / Identity Proof", identityDoc, "Government Issued Photo ID", "credit-card")}
          ${renderKycDocCard("2. Residential Address Proof", addressDoc, "Electricity / Utility / Rent Bill", "home")}
          ${renderKycDocCard("3. Profile Photo (Selfie)", profilePhotoDoc, "Clear Front Portrait", "camera")}
          ${renderKycDocCard("4. Police Clearance / Experience", additionalDoc, "Background Certificate (Optional)", "file-text")}
        </div>
      </div>

      <!-- Right Sidebar: Verification Actions & Checklist -->
      <div class="workbench-actions">
        <h4 style="font-size: 1rem; margin: 0; font-weight: 700;">Verification Actions</h4>
        <p style="font-size: 0.75rem; color: var(--text-muted); margin: -0.5rem 0 0;">
          Review uploaded proofs and approve or reject this partner.
        </p>

        ${isApproved ? `
          <div style="background: #ECFDF5; border: 1px solid #A7F3D0; border-radius: var(--radius-md); padding: 1rem; text-align: center;">
            <div style="margin-bottom: 0.25rem;">${icon('check-circle', { size: 28, stroke: 'var(--brand-emerald)' })}</div>
            <strong style="font-size: 0.9rem; color: #065F46; display: block;">KYC Approved & Active</strong>
            <p style="font-size: 0.75rem; color: #047857; margin: 0.25rem 0 0;">Partner is authorized to go online and accept customer bookings.</p>
          </div>
          <button class="btn btn-danger btn-sm btn-admin-reject-kyc" data-id="${activePartnerKey}" style="width: 100%;">
            Revoke KYC & Request Resubmission
          </button>
          <button class="btn btn-secondary btn-sm btn-admin-suspend-partner" data-id="${activePartnerKey}" style="width: 100%;">
            ${icon('power', { size: 13 })} Suspend Partner Account
          </button>
          <button class="btn btn-danger btn-sm btn-admin-del-partner" data-id="${activePartnerKey}" data-name="${activePartner.fullName || 'this partner'}" style="width: 100%; margin-top: 0.25rem;">
            ${icon('trash', { size: 14 })} Delete Partner Account
          </button>
        ` : `
          <button class="btn btn-primary btn-md btn-admin-approve-kyc" data-id="${activePartnerKey}" style="width: 100%;">
            ${icon('check-circle', { size: 14 })} Approve Partner KYC
          </button>
          <button class="btn btn-danger btn-md btn-admin-reject-kyc" data-id="${activePartnerKey}" style="width: 100%;">
            ${icon('x-circle', { size: 14 })} Reject with Feedback
          </button>
          <button class="btn btn-secondary btn-sm btn-admin-suspend-partner" data-id="${activePartnerKey}" style="width: 100%;">
            ${icon('power', { size: 13 })} Suspend Account
          </button>
          <button class="btn btn-danger btn-sm btn-admin-del-partner" data-id="${activePartnerKey}" data-name="${activePartner.fullName || 'this partner'}" style="width: 100%; margin-top: 0.25rem;">
            ${icon('trash', { size: 14 })} Delete Partner Account
          </button>
        `}

        <!-- Verification Checklist Guide -->
        <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: var(--radius-md); padding: 1rem; margin-top: 0.5rem;">
          <strong style="font-size: 0.8rem; color: var(--text-secondary); display: block; margin-bottom: 0.5rem; text-transform: uppercase;">
            Audit Checklist
          </strong>
          <ul style="font-size: 0.75rem; color: var(--text-muted); padding-left: 1.25rem; margin: 0; line-height: 1.6;">
            <li>Name on Aadhaar matches profile name</li>
            <li>Address falls within Kerala service districts</li>
            <li>ID document is valid & clearly legible</li>
            <li>Selfie matches government photo ID</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

// 5. Services
function renderServicesSection(services) {
  const snapshot = db.getSnapshot();
  const categories = snapshot.categories || [];
  const getCatName = (catId) => (categories.find(c => c.categoryId === catId) || {}).name || catId;

  return `
    <div class="solid-card" style="padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h3 style="font-size: 1.25rem; margin: 0;">Service Catalog &amp; Packages</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.25rem 0 0;">${services.length} services across ${categories.length} categories</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-admin-add-service" style="display: flex; align-items: center; gap: 0.4rem;">+ Add New Service</button>
      </div>
      <div class="table-responsive">
        <table class="kleen-table">
          <thead>
            <tr>
              <th style="width:56px;">Photo</th>
              <th>Service Name</th>
              <th>Category</th>
              <th>Price</th>
              <th>Duration</th>
              <th>Booking Type</th>
              <th>Rating</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${services.map(s => `
              <tr>
                <td style="padding: 0.5rem;">
                  <img src="${s.image || 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=120&q=60'}"
                    alt="${s.name}"
                    style="width: 48px; height: 48px; object-fit: cover; border-radius: 8px; display: block; border: 1px solid #E2E8F0;">
                </td>
                <td>
                  <strong style="font-size: 0.875rem;">${s.name}</strong><br>
                  <span style="font-size: 0.75rem; color: var(--text-muted);">${(s.description || '').slice(0, 65)}${(s.description || '').length > 65 ? '...' : ''}</span>
                </td>
                <td><span class="badge badge-info" style="font-size: 0.7rem;">${getCatName(s.categoryId)}</span></td>
                <td><strong style="color: var(--brand-emerald-dark);">&#8377;${s.price}</strong></td>
                <td>${s.duration}</td>
                <td><span style="font-size: 0.75rem; color: var(--text-secondary);">${s.bookingType || 'Fixed'}</span></td>
                <td>&#9733; ${s.rating} <span style="font-size: 0.75rem; color: var(--text-muted);">(${s.reviewCount || 0})</span></td>
                <td><span class="badge ${s.isActive !== false ? 'badge-success' : 'badge-danger'}">${s.isActive !== false ? 'ACTIVE' : 'INACTIVE'}</span></td>
                <td style="text-align: right;">
                  <div style="display: inline-flex; gap: 0.35rem;">
                    <button class="btn btn-secondary btn-sm btn-admin-edit-service" data-id="${s.serviceId}" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">Edit</button>
                    <button class="btn btn-glass btn-sm btn-admin-toggle-service" data-id="${s.serviceId}" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">${s.isActive !== false ? 'Deactivate' : 'Activate'}</button>
                    <button class="btn btn-danger btn-sm btn-admin-del-service" data-id="${s.serviceId}" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">Delete</button>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 6. Categories
function renderCategoriesSection(categories) {
  const snapshot = db.getSnapshot();
  const services = snapshot.services || [];
  const getSrvCount = (catId) => services.filter(s => s.categoryId === catId).length;

  return `
    <div class="solid-card" style="padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h3 style="font-size: 1.25rem; margin: 0;">Service Categories</h3>
          <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.25rem 0 0;">Manage parent categories, descriptions, images and order</p>
        </div>
        <button class="btn btn-primary btn-sm" id="btn-admin-add-cat" style="display: flex; align-items: center; gap: 0.4rem;">+ Add Category</button>
      </div>
      <div class="table-responsive">
        <table class="kleen-table">
          <thead>
            <tr>
              <th style="width:56px;">Photo</th>
              <th>Category Name</th>
              <th>Description</th>
              <th>Services</th>
              <th>Sort Order</th>
              <th>Status</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${categories.map(c => `
              <tr>
                <td style="padding: 0.5rem;">
                  <img src="${c.image || 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=120&q=60'}"
                    alt="${c.name}"
                    style="width: 44px; height: 44px; object-fit: cover; border-radius: 8px; display: block; border: 1px solid #E2E8F0;">
                </td>
                <td><strong>${c.name}</strong><br><span style="font-size: 0.7rem; color: var(--text-muted); font-family: monospace;">ID: ${c.categoryId}</span></td>
                <td><span style="font-size: 0.8rem; color: var(--text-secondary);">${c.description || '-'}</span></td>
                <td><span class="badge badge-info" style="font-size: 0.75rem;">${getSrvCount(c.categoryId)} services</span></td>
                <td>${c.sortOrder || '-'}</td>
                <td><span class="badge ${c.isActive !== false ? 'badge-success' : 'badge-danger'}">${c.isActive !== false ? 'ACTIVE' : 'INACTIVE'}</span></td>
                <td style="text-align: right;">
                  <div style="display: inline-flex; gap: 0.35rem;">
                    <button class="btn btn-secondary btn-sm btn-admin-edit-cat" data-id="${c.categoryId}" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">Edit</button>
                    <button class="btn btn-danger btn-sm btn-admin-del-cat" data-id="${c.categoryId}" style="padding: 0.25rem 0.6rem; font-size: 0.75rem;">Delete</button>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 7. Bookings
function renderBookingsSection(bookings, partners) {
  const approvedPartners = partners.filter(p => p.kycStatus === "APPROVED");
  const onlineApproved = approvedPartners.filter(p => !!p.isOnline);

  return `
    <div class="solid-card" style="padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <h3 style="font-size: 1.25rem; margin: 0 0 0.25rem;">Dispatch & Booking Console</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin: 0;">
            Review incoming orders and dispatch available/online verified partners.
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <span class="badge badge-success" style="display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.65rem;">
            <span class="live-status-dot online"></span>
            ${onlineApproved.length} Partners Online & Ready
          </span>
          <button class="btn btn-secondary btn-sm" onclick="window.location.hash='#/admin/gigs'">
            ${icon('calendar-days', { size: 13 })} View Partner Gigs
          </button>
        </div>
      </div>

      <div class="table-responsive">
        <table class="kleen-table">
          <thead>
            <tr><th>ID</th><th>Customer</th><th>Service</th><th>Date & Time</th><th>Partner</th><th>Total</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            ${bookings.map(b => {
              const assignedPartner = partners.find(p => (p.partnerId || p.userId) === b.partnerId);
              const isPartnerOnline = assignedPartner ? !!assignedPartner.isOnline : false;

              return `
              <tr>
                <td><strong>#${b.bookingId}</strong></td>
                <td>
                  <strong>${b.customerName || 'Customer'}</strong>
                  ${b.customerPhone ? `<br><span style="font-size: 0.75rem; color: var(--text-muted);">${b.customerPhone}</span>` : ''}
                </td>
                <td>${b.serviceName}</td>
                <td>${b.bookingDate} (${b.startTime})</td>
                <td>
                  ${b.partnerName ? `
                    <div style="display: inline-flex; align-items: center; gap: 0.4rem;">
                      <span class="live-status-dot ${isPartnerOnline ? 'online' : 'offline'}" title="${isPartnerOnline ? 'Partner is currently ONLINE' : 'Partner is currently OFFLINE'}"></span>
                      <strong>${b.partnerName}</strong>
                    </div>
                  ` : `<span class="badge badge-warning">UNASSIGNED</span>`}
                </td>
                <td><strong>₹${b.totalAmount}</strong></td>
                <td><span class="badge badge-info">${b.bookingStatus}</span></td>
                <td>
                  <button class="btn btn-secondary btn-sm btn-admin-assign-partner" data-booking-id="${b.bookingId}">
                    ${b.partnerName ? 'Reassign Maid' : 'Assign Maid'}
                  </button>
                </td>
              </tr>
            `;}).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 8. Payments
function renderPaymentsSection(bookings) {
  return `
    <div class="solid-card" style="padding: 1.5rem;">
      <h3 style="font-size: 1.25rem; margin-bottom: 1.5rem;">Razorpay Payment Transactions</h3>
      <div class="table-responsive">
        <table class="kleen-table">
          <thead>
            <tr><th>Razorpay ID</th><th>Booking</th><th>Customer</th><th>Amount</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${bookings.map(b => `
              <tr>
                <td><code>${b.razorpayPaymentId || 'pay_rzp_live7781'}</code></td>
                <td>#${b.bookingId}</td>
                <td>${b.customerName || 'Customer'}</td>
                <td><strong>₹${b.totalAmount}</strong></td>
                <td><span class="badge badge-success">CAPTURED</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 9. Refunds
function renderRefundsSection(bookings) {
  const cancelled = bookings.filter(b => b.bookingStatus === "CUSTOMER_CANCELLED");
  return `
    <div class="solid-card" style="padding: 1.5rem;">
      <h3 style="font-size: 1.25rem; margin-bottom: 1.5rem;">Refunds & Cancellation Claims</h3>
      <div class="table-responsive">
        <table class="kleen-table">
          <thead>
            <tr><th>Booking</th><th>Customer</th><th>Amount</th><th>Cancellation Reason</th><th>Action</th></tr>
          </thead>
          <tbody>
            ${cancelled.length > 0 ? cancelled.map(c => `
              <tr>
                <td>#${c.bookingId}</td>
                <td>${c.customerName || 'Customer'}</td>
                <td>₹${c.totalAmount}</td>
                <td>${c.cancellationReason || 'Plans changed'}</td>
                <td><button class="btn btn-primary btn-sm" onclick="alert('Refund initiated via Razorpay API.')">Process Full Refund</button></td>
              </tr>
            `).join("") : `
              <tr><td colspan="5" style="text-align:center; color:var(--text-muted); padding:2rem;">No pending refund requests.</td></tr>
            `}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 9b. Partner Payouts & Bank Settlements
function renderPayoutsSection(partners) {
  const snapshot = db.getSnapshot();
  const allPayouts = snapshot.payouts || [];

  // Compute roster data
  let totalDisbursed = 0;
  let totalPending = 0;
  let totalSafetyDeposits = 0;
  let pendingQuickSettleCount = 0;

  const partnerRoster = partners.map(p => {
    const pKey = p.partnerId || p.userId || p.id;
    const fin = db.getPartnerFinancials(pKey);
    totalDisbursed += fin.totalPaidOut;
    totalPending += fin.pendingSettlement;
    totalSafetyDeposits += fin.safetyDepositAmount;
    if (fin.activeQuickSettleRequest) {
      pendingQuickSettleCount++;
    }
    return {
      partner: p,
      key: pKey,
      financials: fin
    };
  });

  return `
    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
      <!-- Payouts Executive Header & KPIs -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 1rem;">
        <div>
          <span class="badge badge-success" style="margin-bottom: 0.35rem;">Financial Operations</span>
          <h2 style="font-size: 1.65rem; margin: 0; font-weight: 800;">Partner Bank Payouts & Settlements</h2>
          <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0.25rem 0 0;">
            Audit partner bank accounts, monitor 80% net earnings, safety deposits, and disburse weekly or instant Quick Settle transfers.
          </p>
        </div>

        <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
          <button id="btn-admin-batch-weekly-payout" class="btn btn-primary btn-md" style="display: inline-flex; align-items: center; gap: 0.4rem; font-weight: 800; background: linear-gradient(135deg, #059669 0%, #047857 100%);">
            ${icon('calendar-days', { size: 16 })} Process Weekly Payout Batch
          </button>
        </div>
      </div>

      <!-- Financial Metrics Grid -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        <div class="solid-card" style="padding: 1.25rem; border-left: 4px solid #2563EB;">
          <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Total Disbursed</div>
          <div style="font-size: 1.65rem; font-weight: 800; color: #2563EB; margin: 0.25rem 0;">₹${totalDisbursed.toLocaleString()}</div>
          <span style="font-size: 0.75rem; color: #2563EB;">Transferred to Bank A/Cs</span>
        </div>

        <div class="solid-card" style="padding: 1.25rem; border-left: 4px solid #D97706;">
          <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Pending Settlements</div>
          <div style="font-size: 1.65rem; font-weight: 800; color: #D97706; margin: 0.25rem 0;">₹${totalPending.toLocaleString()}</div>
          <span style="font-size: 0.75rem; color: #D97706;">Due Next Monday</span>
        </div>

        <div class="solid-card" style="padding: 1.25rem; border-left: 4px solid #059669;">
          <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Safety Deposits Held</div>
          <div style="font-size: 1.65rem; font-weight: 800; color: #047857; margin: 0.25rem 0;">₹${totalSafetyDeposits.toLocaleString()}</div>
          <span style="font-size: 0.75rem; color: #059669;">₹500 / partner (settled weekly)</span>
        </div>

        <div class="solid-card" style="padding: 1.25rem; border-left: 4px solid ${pendingQuickSettleCount > 0 ? '#DC2626' : '#94A3B8'};">
          <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Quick Settle Requests</div>
          <div style="font-size: 1.65rem; font-weight: 800; color: ${pendingQuickSettleCount > 0 ? '#DC2626' : '#64748B'}; margin: 0.25rem 0;">
            ${pendingQuickSettleCount}
          </div>
          <span style="font-size: 0.75rem; color: ${pendingQuickSettleCount > 0 ? '#DC2626' : '#64748B'};">
            ${pendingQuickSettleCount > 0 ? 'Action Required' : 'All Clear'}
          </span>
        </div>
      </div>

      <!-- Partner Bank & Settlement Roster -->
      <div class="solid-card" style="padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
          <div>
            <h3 style="font-size: 1.2rem; margin: 0; font-weight: 800;">Partner Settlement Roster</h3>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.2rem 0 0;">Review bank details and transfer earnings directly to partners</p>
          </div>
        </div>

        <div class="table-responsive">
          <table class="kleen-table">
            <thead>
              <tr>
                <th>Partner</th>
                <th>Bank Account Details</th>
                <th>Total Earned (80%)</th>
                <th>Paid Out</th>
                <th>Pending Balance</th>
                <th>Safety Deposit</th>
                <th>Quick Settle</th>
                <th style="text-align: right; min-width: 170px;">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${partnerRoster.map(item => {
                const p = item.partner;
                const fin = item.financials;
                const b = fin.bankDetails;
                const hasBank = fin.hasBankDetails;

                return `
                  <tr>
                    <td>
                      <div style="display: flex; align-items: center; gap: 0.65rem;">
                        <img src="${p.profileImage || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80'}"
                             style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 1.5px solid #10B981;">
                        <div>
                          <strong style="font-size: 0.9rem; color: var(--text-primary); display: block;">${p.fullName || 'Partner'}</strong>
                          <span style="font-size: 0.75rem; color: var(--text-muted);">${p.phone || p.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      ${hasBank ? `
                        <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary);">${b.bankName}</div>
                        <div style="font-size: 0.775rem; color: var(--text-muted); font-family: monospace;">A/C: •••• ${b.accountNumber.slice(-4)} | IFSC: ${b.ifscCode}</div>
                        <div style="font-size: 0.725rem; color: #059669;">Name: ${b.accountHolderName}${b.upiId ? ` • UPI: ${b.upiId}` : ''}</div>
                      ` : `
                        <span class="badge badge-warning" style="font-size: 0.7rem;">${icon('alert-triangle', { size: 14 })} NO BANK LINKED</span>
                      `}
                    </td>
                    <td><strong style="font-size: 0.95rem; color: var(--brand-emerald-dark);">₹${fin.totalNet.toLocaleString()}</strong></td>
                    <td><span style="color: #2563EB; font-weight: 600;">₹${fin.totalPaidOut.toLocaleString()}</span></td>
                    <td>
                      <strong style="font-size: 1.05rem; color: ${fin.pendingSettlement > 0 ? '#D97706' : '#10B981'};">
                        ₹${fin.pendingSettlement.toLocaleString()}
                      </strong>
                    </td>
                    <td>
                      <span class="badge badge-neutral" style="font-size: 0.75rem;" title="Held during active jobs, settled weekly">
                        ${icon('shield', { size: 13 })} ₹${fin.safetyDepositAmount}
                      </span>
                    </td>
                    <td>
                      ${fin.activeQuickSettleRequest ? `
                        <span class="badge badge-danger" style="font-size: 0.75rem; font-weight: 700; padding: 0.35rem 0.6rem;">
                          ${icon('zap', { size: 12, fill: 'currentColor' })} REQ: ₹${fin.activeQuickSettleRequest.amount}
                        </span>
                      ` : (fin.quickSettleAvailable > 0 ? `
                        <span style="font-size: 0.8rem; color: #059669; font-weight: 600;">Avail: ₹${fin.quickSettleAvailable}</span>
                      ` : `
                        <span style="font-size: 0.75rem; color: var(--text-muted);">₹0 Avail</span>
                      `)}
                    </td>
                    <td style="text-align: right;">
                      <div style="display: inline-flex; gap: 0.4rem; justify-content: flex-end; align-items: center; flex-wrap: wrap;">
                        ${fin.activeQuickSettleRequest ? `
                          <button class="btn btn-primary btn-sm btn-admin-approve-qs" 
                            data-payout-id="${fin.activeQuickSettleRequest.payoutId}"
                            data-partner-id="${item.key}"
                            data-amount="${fin.activeQuickSettleRequest.amount}"
                            style="font-size: 0.75rem; padding: 0.3rem 0.6rem; font-weight: 700; background: #059669;">
                            ${icon('zap', { size: 12, fill: 'currentColor' })} Disburse QS
                          </button>
                        ` : ''}

                        <button class="btn btn-secondary btn-sm btn-admin-send-payout"
                          data-partner-id="${item.key}"
                          data-name="${p.fullName || 'Partner'}"
                          data-pending="${fin.pendingSettlement}"
                          ${!hasBank || fin.pendingSettlement <= 0 ? 'disabled' : ''}
                          style="font-size: 0.75rem; padding: 0.3rem 0.6rem; font-weight: 700;">
                          ${icon('bank', { size: 14 })} Send Payout
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Disbursed Bank Payouts Ledger Table -->
      <div class="solid-card" style="padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <div>
            <h3 style="font-size: 1.2rem; margin: 0; font-weight: 800;">Completed Bank Transfer Receipts</h3>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.2rem 0 0;">Historical record of all bank transfers, UTR numbers, and weekly batches</p>
          </div>
        </div>

        <div class="table-responsive">
          <table class="kleen-table">
            <thead>
              <tr>
                <th>Payout ID</th>
                <th>Partner</th>
                <th>Transfer Date</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Destination Bank</th>
                <th>UTR / Ref Number</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${allPayouts.length > 0 ? allPayouts.map(p => {
                const b = p.bankDetails || {};
                return `
                  <tr>
                    <td><strong>#${p.payoutId}</strong></td>
                    <td><strong>${p.partnerName || 'Partner'}</strong></td>
                    <td>${p.processedAt ? new Date(p.processedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : (p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : 'Recent')}</td>
                    <td><strong style="color: #047857; font-size: 1rem;">₹${p.amount}</strong></td>
                    <td><span style="font-weight: 600; font-size: 0.85rem; color: #475569;">${p.transferMode || 'IMPS'}</span></td>
                    <td>
                      <div style="font-size: 0.85rem; font-weight: 500;">${b.bankName || 'Bank'}</div>
                      <div style="font-size: 0.75rem; color: var(--text-muted);">•••• ${b.accountNumber ? b.accountNumber.slice(-4) : '****'} (${b.ifscCode || 'IFSC'})</div>
                    </td>
                    <td><code style="font-size: 0.8rem; background: #F1F5F9; padding: 0.2rem 0.4rem; border-radius: 4px;">${p.utrNumber || 'PENDING'}</code></td>
                    <td>
                      <span class="badge ${p.payoutType === 'QUICK_SETTLE' ? 'badge-primary' : (p.payoutType === 'WEEKLY_SCHEDULED' ? 'badge-info' : 'badge-neutral')}" style="font-size: 0.7rem;">
                        ${p.payoutType === 'QUICK_SETTLE' ? `${icon('zap', { size: 12, fill: 'currentColor' })} Quick Settle` : (p.payoutType === 'WEEKLY_SCHEDULED' ? `${icon('calendar-days', { size: 12 })} Weekly Batch` : 'Manual')}
                      </span>
                    </td>
                    <td>
                      <span class="badge ${p.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}">
                        ${p.status}
                      </span>
                    </td>
                  </tr>
                `;
              }).join("") : `
                <tr>
                  <td colspan="9" style="text-align: center; color: var(--text-muted); padding: 2.5rem 1rem;">
                    <div style="margin-bottom: 0.35rem;">${icon('bank', { size: 28, stroke: 'var(--brand-emerald)' })}</div>
                    No bank disbursements executed yet. Click "Send Payout" or "Process Weekly Payout Batch" to disburse funds.
                  </td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

/**
 * Modal to Disburse Payout to Partner Bank Account
 */
function openSendPayoutModal(partnerId) {
  const fin = db.getPartnerFinancials(partnerId);
  const partner = db.getPartnerById(partnerId);
  const b = fin.bankDetails;

  if (!fin.hasBankDetails) {
    toast.error("No Bank Account", "Partner has not registered bank account details yet.");
    return;
  }

  const generatedUtr = "UTR" + Math.floor(100000000000 + Math.random() * 900000000000);

  const bodyHtml = `
    <div style="display: flex; flex-direction: column; gap: 1rem;">
      <!-- Partner Bank Info Summary -->
      <div style="background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 10px; padding: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
          <strong style="font-size: 1rem; color: #065F46;">${b.bankName}</strong>
          <span class="badge badge-success" style="font-size: 0.7rem;">VERIFIED BANK A/C</span>
        </div>
        <div style="font-size: 0.85rem; color: #047857;">
          A/C: <strong>${b.accountNumber}</strong> • IFSC: <strong>${b.ifscCode}</strong> (${b.accountType || 'Savings'})
        </div>
        <div style="font-size: 0.8rem; color: #065F46; margin-top: 0.2rem;">
          Beneficiary Name: <strong>${b.accountHolderName}</strong>${b.upiId ? ` • UPI: <strong>${b.upiId}</strong>` : ''}
        </div>
      </div>

      <!-- Financial Status Breakdown -->
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.5rem; text-align: center;">
        <div style="background: #F8FAFC; padding: 0.75rem 0.5rem; border-radius: 8px; border: 1px solid #E2E8F0;">
          <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Total Net</div>
          <div style="font-size: 1.15rem; font-weight: 800; color: #047857;">₹${fin.totalNet}</div>
        </div>
        <div style="background: #F8FAFC; padding: 0.75rem 0.5rem; border-radius: 8px; border: 1px solid #E2E8F0;">
          <div style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Already Paid</div>
          <div style="font-size: 1.15rem; font-weight: 800; color: #2563EB;">₹${fin.totalPaidOut}</div>
        </div>
        <div style="background: #FFFBEB; padding: 0.75rem 0.5rem; border-radius: 8px; border: 1px solid #FCD34D;">
          <div style="font-size: 0.7rem; color: #92400E; text-transform: uppercase; font-weight: 700;">Pending Due</div>
          <div style="font-size: 1.15rem; font-weight: 800; color: #D97706;">₹${fin.pendingSettlement}</div>
        </div>
      </div>

      <!-- Payout Form Fields -->
      <div class="form-group" style="margin: 0;">
        <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Payout Amount to Disburse (₹) *</label>
        <input type="number" id="payout-form-amount" class="form-input" value="${fin.pendingSettlement}" min="1" max="${fin.pendingSettlement}" style="font-size: 1.25rem; font-weight: 800; color: #047857;">
        <small style="color: var(--text-muted); font-size: 0.75rem;">Includes pending balance and ₹500 safety deposit settlement.</small>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
        <div class="form-group" style="margin: 0;">
          <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Transfer Mode</label>
          <select id="payout-form-mode" class="form-select">
            <option value="IMPS">IMPS (Instant 24x7)</option>
            <option value="NEFT" selected>NEFT (Direct Bank)</option>
            <option value="UPI">UPI Instant Transfer</option>
            <option value="RAZORPAY_X">RazorpayX Payout</option>
          </select>
        </div>

        <div class="form-group" style="margin: 0;">
          <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Bank UTR / Reference No *</label>
          <input type="text" id="payout-form-utr" class="form-input" value="${generatedUtr}" style="font-family: monospace; font-size: 0.85rem;">
        </div>
      </div>

      <div class="form-group" style="margin: 0;">
        <label class="form-label" style="font-weight: 700; font-size: 0.85rem;">Transfer Note / Settlement Remarks</label>
        <input type="text" id="payout-form-note" class="form-input" value="Weekly payout settlement (including ₹500 safety deposit)" placeholder="Internal note or settlement description">
      </div>
    </div>
  `;

  const footerHtml = `
    <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">Cancel</button>
    <button class="btn btn-primary btn-sm" id="btn-confirm-transfer-payout" style="font-weight: 800; background: #059669;">
      ${icon('bank', { size: 14 })} Confirm Transfer & Disburse
    </button>
  `;

  modal.open({
    title: `Disburse Bank Payout — ${partner ? partner.fullName : 'Partner'}`,
    bodyHtml,
    footerHtml,
    maxWidth: "540px",
    onOpen: (container) => {
      container.querySelector("#btn-confirm-transfer-payout").onclick = () => {
        const amount = Number(container.querySelector("#payout-form-amount").value);
        const mode = container.querySelector("#payout-form-mode").value;
        const utr = container.querySelector("#payout-form-utr").value.trim();
        const note = container.querySelector("#payout-form-note").value.trim();

        if (!amount || amount <= 0) {
          toast.error("Invalid Amount", "Please enter a valid payout amount.");
          return;
        }

        try {
          db.processPartnerPayout({
            partnerId,
            amount,
            transferMode: mode,
            utrNumber: utr,
            note,
            isWeeklyPayout: amount === fin.pendingSettlement
          });

          toast.success("Payout Disbursed ", `₹${amount} transferred to ${partner ? partner.fullName : 'Partner'}'s bank account.`);
          modal.close();
          window.location.reload();
        } catch (err) {
          toast.error("Payout Failed", err.message);
        }
      };
    }
  });
}

// 10. Reviews
function renderReviewsSection(reviews) {
  return `
    <div class="solid-card" style="padding: 1.5rem;">
      <h3 style="font-size: 1.25rem; margin-bottom: 1.5rem;">Customer Review Moderation</h3>
      <div class="table-responsive">
        <table class="kleen-table">
          <thead>
            <tr><th>Rating</th><th>Customer</th><th>Partner</th><th>Comment</th><th>Status</th><th>Moderation</th></tr>
          </thead>
          <tbody>
            ${reviews.map(r => `
              <tr>
                <td style="color:#F59E0B; font-weight:bold;">${icon('star', { size: 13, fill: '#D97706', stroke: '#D97706' })} ${r.rating}</td>
                <td>${r.customerName || 'Customer'}</td>
                <td>${r.partnerName || 'Assigned Partner'}</td>
                <td>"${r.comment}"</td>
                <td><span class="badge ${r.status === 'APPROVED' ? 'badge-success' : 'badge-danger'}">${r.status || 'APPROVED'}</span></td>
                <td>
                  <button class="btn btn-glass btn-sm btn-admin-toggle-review" data-id="${r.reviewId}">
                    ${r.status === 'HIDDEN' ? 'Restore' : 'Hide'}
                  </button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 11. Complaints
function renderComplaintsSection(complaints) {
  return `
    <div class="solid-card" style="padding: 1.5rem;">
      <h3 style="font-size: 1.25rem; margin-bottom: 1.5rem;">Support Tickets & Disputes</h3>
      <div class="table-responsive">
        <table class="kleen-table">
          <thead>
            <tr><th>Ticket ID</th><th>Booking</th><th>Subject</th><th>Details</th><th>Status</th><th>Resolution</th></tr>
          </thead>
          <tbody>
            ${complaints.map(c => `
              <tr>
                <td>#${c.complaintId}</td>
                <td>#${c.bookingId}</td>
                <td><strong>${c.subject}</strong></td>
                <td style="max-width:260px;">${c.description}</td>
                <td><span class="badge ${c.status === 'RESOLVED' ? 'badge-success' : 'badge-danger'}">${c.status}</span></td>
                <td>
                  ${c.status === 'OPEN' ? `
                    <button class="btn btn-primary btn-sm btn-admin-resolve-ticket" data-id="${c.complaintId}">Resolve</button>
                  ` : `
                    <span style="color:var(--color-success); font-weight:600; font-size:0.8rem;">Resolved</span>
                  `}
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 12. Offers
function renderOffersSection(offers) {
  return `
    <div class="solid-card" style="padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.25rem;">Discount Coupons & Offers</h3>
        <button class="btn btn-primary btn-sm" id="btn-admin-add-offer">+ Create Offer</button>
      </div>
      <div class="table-responsive">
        <table class="kleen-table">
          <thead>
            <tr><th>Offer Name</th><th>Code</th><th>Discount</th><th>Min Order</th><th>Status</th><th>Action</th></tr>
          </thead>
          <tbody>
            ${offers.map(o => `
              <tr>
                <td><strong>${o.name}</strong></td>
                <td><code>${o.code}</code></td>
                <td>${o.discountType === 'FLAT' ? '₹' + o.discountValue : o.discountValue + '%'}</td>
                <td>₹${o.minimumAmount}</td>
                <td><span class="badge ${o.isActive ? 'badge-success' : 'badge-neutral'}">${o.isActive ? 'ACTIVE' : 'INACTIVE'}</span></td>
                <td>
                  <button class="btn btn-glass btn-sm btn-admin-toggle-offer" data-id="${o.offerId}">
                    ${o.isActive ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

// 13. Notifications
function renderNotificationsSection() {
  const snapshot = db.getSnapshot();
  const allNotifications = snapshot.notifications || [];
  const adminNotifications = allNotifications.filter(n => n.userId === "usr_admin_kleen" || n.userId === "all");

  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 1.5rem; align-items: start;">
      <!-- Admin Notifications Inbox -->
      <div class="solid-card" style="padding: 1.5rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
          <h3 style="font-size: 1.2rem; margin: 0; font-weight: 700;">Admin Activity & Alerts</h3>
          <span class="badge badge-info">${adminNotifications.length} Total</span>
        </div>
        ${adminNotifications.length === 0 ? `
          <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-muted); font-size: 0.9rem;">
            <div style="margin-bottom: 0.5rem;">${icon('inbox', { size: 36, stroke: 'var(--brand-emerald)' })}</div>
            No notifications received yet.
          </div>
        ` : `
          <div style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 520px; overflow-y: auto; padding-right: 0.25rem;">
            ${adminNotifications.map(n => {
              const isKycAlert = n.type === 'NEW_KYC_SUBMISSION';
              const timeFormatted = n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
              const dateFormatted = n.createdAt ? new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : '';
              return `
                <div style="padding: 1rem; border: 1px solid ${isKycAlert ? '#FDE68A' : '#E5E7EB'}; border-radius: var(--radius-md); background: ${isKycAlert ? '#FFFBEB' : '#FFFFFF'};">
                  <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.35rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <strong style="font-size: 0.9rem; color: var(--text-primary);">${n.title}</strong>
                      ${isKycAlert ? `<span class="badge badge-warning" style="font-size: 0.65rem;">ACTION REQUIRED</span>` : ''}
                    </div>
                    <span style="font-size: 0.7rem; color: var(--text-muted);">${dateFormatted} ${timeFormatted}</span>
                  </div>
                  <p style="font-size: 0.825rem; color: var(--text-secondary); margin: 0 0 0.6rem; line-height: 1.45;">${n.message}</p>
                  ${isKycAlert && n.partnerId ? `
                    <button type="button" class="btn btn-primary btn-sm btn-open-kyc-from-notif" data-partner-id="${n.partnerId}" style="font-size: 0.75rem; padding: 0.3rem 0.75rem;">
                      Audit Partner Documents in KYC Workbench →
                    </button>
                  ` : ''}
                </div>
              `;
            }).join("")}
          </div>
        `}
      </div>

      <!-- Broadcast Platform Notification Form -->
      <div class="solid-card" style="padding: 1.5rem;">
        <h3 style="font-size: 1.2rem; margin-bottom: 1.25rem; font-weight: 700;">Broadcast Platform Notification</h3>
        <form id="form-admin-broadcast">
          <div class="form-group">
            <label class="form-label">Target Audience</label>
            <select id="broadcast-audience" class="form-select">
              <option value="all">All Users (Customers & Partners)</option>
              <option value="customers">Customers Only</option>
              <option value="partners">Service Partners Only</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Notification Title</label>
            <input type="text" id="broadcast-title" class="form-input" placeholder="e.g. Monsoon Deep Clean Sale!" required>
          </div>
          <div class="form-group">
            <label class="form-label">Notification Message</label>
            <textarea id="broadcast-msg" class="form-textarea" placeholder="Enter message text..." rows="4" required></textarea>
          </div>
          <button type="submit" class="btn btn-primary btn-md">Send Broadcast Notification</button>
        </form>
      </div>
    </div>
  `;
}

// 14. Reports
function renderReportsSection({ totalRevenue, bookings, partners }) {
  return `
    <div class="solid-card" style="padding: 1.5rem;">
      <h3 style="font-size: 1.25rem; margin-bottom: 1.5rem;">Operational Analytics & Performance</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
        <div class="solid-card" style="padding: 1rem;">
          <span class="price-label">Total Completed Bookings</span>
          <div class="stat-num">${bookings.filter(b => b.bookingStatus === 'SERVICE_COMPLETED').length}</div>
        </div>
        <div class="solid-card" style="padding: 1rem;">
          <span class="price-label">Approved Maid Fleet</span>
          <div class="stat-num">${partners.filter(p => p.kycStatus === 'APPROVED').length}</div>
        </div>
        <div class="solid-card" style="padding: 1rem;">
          <span class="price-label">Avg Booking GMV</span>
          <div class="stat-num">₹950</div>
        </div>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="alert('CSV Operational Export generated.')">Export Full CSV Report</button>
    </div>
  `;
}

// 15. Settings
function renderSettingsSection(settings) {
  return `
    <div class="solid-card" style="padding: 1.5rem; max-width: 600px;">
      <h3 style="font-size: 1.25rem; margin-bottom: 1.5rem;">Platform Policy & Commission Settings</h3>
      <form id="form-admin-settings">
        <div class="form-group">
          <label class="form-label">Platform Safety Fee (₹)</label>
          <input type="number" id="setting-fee" class="form-input" value="${settings.platformFee || 49}">
        </div>
        <div class="form-group">
          <label class="form-label">GST Tax Rate (%)</label>
          <input type="number" id="setting-tax" class="form-input" value="${settings.taxPercentage || 18}">
        </div>
        <div class="form-group">
          <label class="form-label">Partner Commission Share (%)</label>
          <input type="number" id="setting-commission" class="form-input" value="${settings.partnerCommissionRate || 20}">
          <small style="color: var(--text-muted);">20% to KLEEN, 80% directly to verified maid partner.</small>
        </div>
        <button type="submit" class="btn btn-primary btn-md" style="margin-top: 0.5rem;">Save Platform Configuration</button>
      </form>
    </div>
  `;
}

export function attachAdminEvents() {
  // Navigation
  document.querySelectorAll(".admin-nav-item").forEach(item => {
    item.onclick = () => {
      const tab = item.getAttribute("data-tab");
      window.location.hash = `#/admin/${tab}`;
    };
  });

  // Switch Selected Partner in KYC Workbench Queue
  document.querySelectorAll(".partner-queue-item").forEach(item => {
    item.onclick = () => {
      const pId = item.getAttribute("data-partner-id");
      if (pId) {
        selectedKycPartnerId = pId;
        try { sessionStorage.setItem("admin_selected_kyc_id", pId); } catch (e) {}
        const contentEl = document.querySelector(".admin-content");
        if (contentEl) {
          contentEl.innerHTML = renderKycWorkbench(db.getPartners());
          attachAdminEvents();
        }
      }
    };
  });

  // Open KYC from Notification Button
  document.querySelectorAll(".btn-open-kyc-from-notif").forEach(btn => {
    btn.onclick = () => {
      const pId = btn.getAttribute("data-partner-id");
      if (pId) selectedKycPartnerId = pId;
      window.location.hash = "#/admin/kyc";
    };
  });

  // Document Inspection Full-Size Modal
  document.querySelectorAll(".btn-inspect-doc").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const url = btn.getAttribute("data-url");
      const title = btn.getAttribute("data-title") || "Verification Document";
      const fileName = btn.getAttribute("data-filename") || "document";
      const isPdf = btn.getAttribute("data-is-pdf") === "true";

      if (!url) return;

      modal.open({
        title: `Document Audit: ${title}`,
        maxWidth: "760px",
        bodyHtml: `
          <div style="text-align: center;">
            <div style="margin-bottom: 0.75rem; font-size: 0.85rem; color: var(--text-muted);">
              File: <strong>${fileName}</strong>
            </div>
            ${isPdf ? `
              <div style="height: 500px; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden; background: #FFF;">
                <iframe src="${url}" style="width: 100%; height: 100%; border: none;"></iframe>
              </div>
            ` : `
              <div style="max-height: 520px; overflow: auto; background: #0F172A; border-radius: 8px; padding: 0.5rem; display: flex; align-items: center; justify-content: center;">
                <img src="${url}" style="max-width: 100%; max-height: 500px; object-fit: contain; border-radius: 4px;" alt="${title}">
              </div>
            `}
            <div style="margin-top: 1rem; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 0.75rem; color: var(--text-muted);">Confidential Verification Asset • KLEEN Security</span>
              <div style="display: flex; gap: 0.5rem;">
                <a href="${url}" download="${fileName}" class="btn btn-secondary btn-sm" target="_blank">Download Asset</a>
                <button type="button" class="btn btn-primary btn-sm modal-btn-close">Close Audit Viewer</button>
              </div>
            </div>
          </div>
        `,
        onOpen: (container) => {
          container.querySelectorAll(".modal-btn-close").forEach(cBtn => {
            cBtn.onclick = () => modal.close();
          });
        }
      });
    };
  });

  // Approve KYC
  document.querySelectorAll(".btn-admin-approve-kyc").forEach(btn => {
    btn.onclick = () => {
      const pId = btn.getAttribute("data-id");
      adminManager.reviewKyc(pId, "APPROVE");
      selectedKycPartnerId = pId;
      try { sessionStorage.setItem("admin_selected_kyc_id", pId); } catch (e) {}
      toast.success("Partner KYC Approved", "Partner is now fully verified and authorized to go ONLINE and accept customer booking orders.");
      
      const contentEl = document.querySelector(".admin-content");
      if (contentEl) {
        contentEl.innerHTML = renderKycWorkbench(db.getPartners());
        attachAdminEvents();
      } else {
        window.location.reload();
      }
    };
  });

  // Reject KYC with Reason Modal
  document.querySelectorAll(".btn-admin-reject-kyc").forEach(btn => {
    btn.onclick = () => {
      const pId = btn.getAttribute("data-id");
      modal.open({
        title: "Reject KYC Application",
        maxWidth: "480px",
        bodyHtml: `
          <div style="margin-bottom: 1rem;">
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.75rem; line-height: 1.4;">
              Provide clear feedback explaining why the partner's verification documents were rejected. They will be notified immediately to re-upload.
            </p>
            <div class="form-group">
              <label class="form-label">Feedback Presets</label>
              <select id="modal-reject-preset" class="form-select" style="margin-bottom: 0.75rem;">
                <option value="">-- Choose reason template or write custom below --</option>
                <option value="Aadhaar / Government ID document photo is blurry or illegible. Please upload a clear high-resolution scan.">Blurry Government ID</option>
                <option value="Residential Address Proof is older than 3 months or incomplete. Please upload a recent utility bill.">Invalid / Expired Address Proof</option>
                <option value="Profile photo / selfie is unclear or dark. Please take a clear front-facing portrait.">Unclear Selfie Photo</option>
                <option value="Full name on Aadhaar does not match the registered partner profile name.">Name Mismatch</option>
                <option value="Service address is outside currently supported Kerala districts.">Out of Coverage Zone</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Specific Rejection Reason *</label>
              <textarea id="modal-reject-reason" class="form-textarea" rows="3" placeholder="Enter explanation for partner..." required></textarea>
            </div>
          </div>
        `,
        footerHtml: `
          <button class="btn btn-secondary btn-sm" id="btn-cancel-rejection">Cancel</button>
          <button class="btn btn-danger btn-sm" id="btn-confirm-rejection">Confirm Rejection</button>
        `,
        onOpen: (container) => {
          const presetSel = container.querySelector("#modal-reject-preset");
          const reasonInput = container.querySelector("#modal-reject-reason");
          presetSel.onchange = () => {
            if (presetSel.value) reasonInput.value = presetSel.value;
          };

          container.querySelector("#btn-cancel-rejection").onclick = () => modal.close();
          container.querySelector("#btn-confirm-rejection").onclick = () => {
            const reason = reasonInput.value.trim();
            if (!reason) {
              toast.error("Reason Required", "Please specify why the verification was rejected.");
              return;
            }
            adminManager.reviewKyc(pId, "REJECT", reason);
            selectedKycPartnerId = pId;
            try { sessionStorage.setItem("admin_selected_kyc_id", pId); } catch (e) {}
            modal.close();
            toast.info("Partner KYC Rejected", "Rejection notice and instructions sent to partner.");

            const contentEl = document.querySelector(".admin-content");
            if (contentEl) {
              contentEl.innerHTML = renderKycWorkbench(db.getPartners());
              attachAdminEvents();
            } else {
              window.location.reload();
            }
          };
        }
      });
    };
  });

  // Suspend Partner
  document.querySelectorAll(".btn-admin-suspend-partner").forEach(btn => {
    btn.onclick = () => {
      const pId = btn.getAttribute("data-id");
      if (confirm("Suspend this partner account? They will not be able to log in or receive booking requests.")) {
        adminManager.reviewKyc(pId, "SUSPEND");
        toast.error("Partner Suspended", "Partner access disabled.");
        
        const contentEl = document.querySelector(".admin-content");
        if (contentEl) {
          const snap = db.getSnapshot();
          contentEl.innerHTML = renderKycWorkbench(snap.partners || []);
          attachAdminEvents();
        } else {
          window.location.reload();
        }
      }
    };
  });

  // Toggle Customer Account Status (Active / Suspended)
  document.querySelectorAll(".btn-admin-toggle-user").forEach(btn => {
    btn.onclick = () => {
      const uId = btn.getAttribute("data-id");
      const currentStatus = btn.getAttribute("data-status");
      const nextAction = currentStatus === "SUSPENDED" ? "reactivate" : "suspend";
      if (confirm(`Are you sure you want to ${nextAction} this user account?`)) {
        const newStatus = adminManager.toggleUserStatus(uId);
        toast.info("User Status Updated", `Account is now ${newStatus}.`);
        
        const contentEl = document.querySelector(".admin-content");
        if (contentEl && window.location.hash.includes("customers")) {
          const snap = db.getSnapshot();
          contentEl.innerHTML = renderCustomersSection((snap.users || []).filter(u => u.role === "customer"));
          attachAdminEvents();
        } else {
          window.location.reload();
        }
      }
    };
  });

  // Permanently Delete Customer Record
  document.querySelectorAll(".btn-admin-del-customer").forEach(btn => {
    btn.onclick = () => {
      const uId = btn.getAttribute("data-id");
      const uName = btn.getAttribute("data-name") || "this customer";
      if (confirm(`${icon('alert-triangle', { size: 14 })} Warning: Are you sure you want to permanently delete customer "${uName}"?\n\nThis will remove their profile and associated customer data. This action cannot be undone.`)) {
        adminManager.deleteCustomer(uId);
        toast.success("Customer Deleted", `Customer record for "${uName}" has been permanently deleted.`);
        
        const contentEl = document.querySelector(".admin-content");
        if (contentEl && window.location.hash.includes("customers")) {
          const snap = db.getSnapshot();
          contentEl.innerHTML = renderCustomersSection((snap.users || []).filter(u => u.role === "customer"));
          attachAdminEvents();
        } else {
          window.location.reload();
        }
      }
    };
  });

  // Permanently Delete Partner Fleet Record
  document.querySelectorAll(".btn-admin-del-partner").forEach(btn => {
    btn.onclick = () => {
      const pId = btn.getAttribute("data-id");
      const pName = btn.getAttribute("data-name") || "this partner";
      if (confirm(`${icon('alert-triangle', { size: 14 })} Warning: Are you sure you want to permanently delete partner "${pName}"?\n\nThis will remove their fleet profile, KYC verification documents, and unassign any active bookings. This action cannot be undone.`)) {
        adminManager.deletePartner(pId);
        toast.success("Partner Deleted", `Fleet record for "${pName}" has been permanently deleted.`);
        
        const contentEl = document.querySelector(".admin-content");
        if (contentEl) {
          const snap = db.getSnapshot();
          if (window.location.hash.includes("kyc")) {
            selectedKycPartnerId = null;
            contentEl.innerHTML = renderKycWorkbench(snap.partners || []);
          } else {
            contentEl.innerHTML = renderPartnersSection(snap.partners || []);
          }
          attachAdminEvents();
        } else {
          window.location.reload();
        }
      }
    };
  });

  // Assign Partner to booking
  document.querySelectorAll(".btn-admin-assign-partner").forEach(btn => {
    btn.onclick = () => {
      const bId = btn.getAttribute("data-booking-id");
      const approved = db.getPartners().filter(p => p.kycStatus === "APPROVED");
      // Prioritize online partners at the top
      approved.sort((a, b) => (b.isOnline ? 1 : 0) - (a.isOnline ? 1 : 0));
      const onlineCount = approved.filter(p => !!p.isOnline).length;

      modal.open({
        title: `Assign Maid to Booking #${bId}`,
        maxWidth: "500px",
        bodyHtml: `
          <div style="margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <span class="badge badge-success" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.35rem 0.65rem;">
                <span class="live-status-dot online"></span>
                ${onlineCount} Partners Currently Online
              </span>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Prioritize Online fleet</span>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight: 700;">Select Verified Maid Partner *</label>
              <select id="modal-select-partner" class="form-select" style="font-size: 0.9rem; padding: 0.55rem 0.75rem;">
                ${approved.map(p => {
                  const tag = p.isOnline ? "[ONLINE & READY]" : "[OFFLINE]";
                  return `<option value="${p.partnerId || p.userId}" data-name="${p.fullName}">
                    ${tag} ${p.fullName} (${icon('star', { size: 13, fill: '#D97706', stroke: '#D97706' })} ${p.rating || 4.9}) • ${p.district || p.city || 'Kerala'}
                  </option>`;
                }).join("")}
              </select>
            </div>
            <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0.5rem 0 0;">
              Assigning will notify the partner instantly and update customer tracking.
            </p>
          </div>
        `,
        footerHtml: `
          <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">Cancel</button>
          <button class="btn btn-primary btn-sm" id="btn-modal-assign-confirm">Confirm Dispatch</button>
        `,
        onOpen: (container) => {
          container.querySelector("#btn-modal-assign-confirm").onclick = () => {
            const sel = container.querySelector("#modal-select-partner");
            if (!sel || !sel.options.length) {
              toast.error("No Partner Selected", "Please select a verified partner.");
              return;
            }
            const opt = sel.options[sel.selectedIndex];
            adminManager.assignPartner(bId, opt.value, opt.getAttribute("data-name"));
            modal.close();
            toast.success("Partner Dispatched", `Assigned ${opt.getAttribute("data-name")} to booking #${bId}.`);
            window.location.reload();
          };
        }
      });
    };
  });

  // =========================================================================
  // Service & Category Management Workflows
  // =========================================================================

  function openServiceFormModal(existingService = null) {
    const snap = db.getSnapshot();
    const categories = snap.categories || [];
    const isEdit = !!existingService;

    modal.open({
      title: isEdit ? `Edit Service: ${existingService.name}` : "Add New Home Care Service",
      maxWidth: "680px",
      bodyHtml: `
        <div style="display: flex; flex-direction: column; gap: 1rem; max-height: 75vh; overflow-y: auto; padding-right: 0.35rem;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-weight: 600;">Service Name *</label>
              <input type="text" id="srv-form-name" class="form-input" value="${existingService ? existingService.name : ''}" placeholder="e.g. Sofa Shampooing & Deep Clean" required>
            </div>
            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-weight: 600;">Category *</label>
              <select id="srv-form-category" class="form-select" required>
                ${categories.map(c => `
                  <option value="${c.categoryId}" ${existingService && existingService.categoryId === c.categoryId ? 'selected' : ''}>
                    ${c.name}
                  </option>
                `).join("")}
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-weight: 600;">Price (₹) *</label>
              <input type="number" id="srv-form-price" class="form-input" value="${existingService ? existingService.price : 499}" min="1" required>
            </div>
            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-weight: 600;">Duration *</label>
              <input type="text" id="srv-form-duration" class="form-input" value="${existingService ? existingService.duration : '2.0 hrs'}" placeholder="e.g. 1.5 hrs" required>
            </div>
            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-weight: 600;">Booking Type</label>
              <select id="srv-form-booking-type" class="form-select">
                <option value="Fixed" ${existingService && existingService.bookingType === 'Fixed' ? 'selected' : ''}>Fixed</option>
                <option value="Hourly" ${existingService && existingService.bookingType === 'Hourly' ? 'selected' : ''}>Hourly</option>
                <option value="Recurring" ${existingService && existingService.bookingType === 'Recurring' ? 'selected' : ''}>Recurring</option>
              </select>
            </div>
          </div>

          <div class="form-group" style="margin: 0;">
            <label class="form-label" style="font-weight: 600;">Short Description *</label>
            <textarea id="srv-form-desc" class="form-textarea" rows="2" placeholder="Clear summary of what tasks are performed for the customer..." required>${existingService ? existingService.description : ''}</textarea>
          </div>

          <!-- Image URL & File Upload with Live Preview -->
          <div class="form-group" style="margin: 0; background: #F8FAFC; padding: 1rem; border-radius: 8px; border: 1px solid #E2E8F0;">
            <label class="form-label" style="font-weight: 700; margin-bottom: 0.35rem; display: flex; justify-content: space-between; align-items: center;">
              <span>Service Image / Photo *</span>
              <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">URL or Local Image Upload</span>
            </label>
            <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
              <input type="url" id="srv-form-img-url" class="form-input" value="${existingService ? existingService.image : 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80'}" placeholder="https://images.unsplash.com/..." style="flex: 1;">
            </div>
            
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap;">
              <label class="btn btn-secondary btn-sm" style="cursor: pointer; padding: 0.35rem 0.75rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.35rem;">
                ${icon('folder', { size: 13 })} Upload from Device
                <input type="file" id="srv-form-img-file" accept="image/*" style="display: none;">
              </label>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Quick presets:</span>
              <button type="button" class="btn btn-glass btn-sm btn-preset-srv" data-url="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80">Home</button>
              <button type="button" class="btn btn-glass btn-sm btn-preset-srv" data-url="https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=800&q=80">Bathroom</button>
              <button type="button" class="btn btn-glass btn-sm btn-preset-srv" data-url="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80">Kitchen</button>
              <button type="button" class="btn btn-glass btn-sm btn-preset-srv" data-url="https://images.unsplash.com/photo-1585837575652-267c041d77d4?auto=format&fit=crop&w=800&q=80">Dishes</button>
              <button type="button" class="btn btn-glass btn-sm btn-preset-srv" data-url="https://images.unsplash.com/photo-1517677208171-0bc6725a3e60?auto=format&fit=crop&w=800&q=80">Laundry</button>
              <button type="button" class="btn btn-glass btn-sm btn-preset-srv" data-url="https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=800&q=80">Maid</button>
            </div>

            <div style="height: 140px; border-radius: 8px; overflow: hidden; background: #EDF2F7; border: 1.5px dashed #CBD5E1; display: flex; align-items: center; justify-content: center; position: relative;">
              <img id="srv-form-img-preview" src="${existingService ? existingService.image : 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80'}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-weight: 600;">What's Included Tasks (1 per line)</label>
              <textarea id="srv-form-included" class="form-textarea" rows="3" placeholder="Floor sweeping & mopping&#10;Surface dusting&#10;Wet wiping">${existingService ? (existingService.includedTasks || []).join("\n") : "Complete sweeping and mopping\nSurface dusting and wiping\nTrash clearance"}</textarea>
            </div>
            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-weight: 600;">Excluded Tasks (1 per line)</label>
              <textarea id="srv-form-excluded" class="form-textarea" rows="3" placeholder="Exterior high glass&#10;Heavy furniture lifting">${existingService ? (existingService.excludedTasks || []).join("\n") : "Exterior high altitude cleaning\nWall structural repairs"}</textarea>
            </div>
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">Cancel</button>
        <button class="btn btn-primary btn-sm" id="btn-save-srv-action">${isEdit ? "Save Changes" : "Publish Service"}</button>
      `,
      onOpen: (container) => {
        const urlInput = container.querySelector("#srv-form-img-url");
        const fileInput = container.querySelector("#srv-form-img-file");
        const imgPreview = container.querySelector("#srv-form-img-preview");

        if (urlInput && imgPreview) {
          urlInput.oninput = () => {
            if (urlInput.value.trim()) {
              imgPreview.src = urlInput.value.trim();
            }
          };
        }

        if (fileInput) {
          fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (loadEvent) => {
                const base64 = loadEvent.target.result;
                if (urlInput) urlInput.value = base64;
                if (imgPreview) imgPreview.src = base64;
              };
              reader.readAsDataURL(file);
            }
          };
        }

        container.querySelectorAll(".btn-preset-srv").forEach(btn => {
          btn.onclick = () => {
            const url = btn.getAttribute("data-url");
            if (urlInput) urlInput.value = url;
            if (imgPreview) imgPreview.src = url;
          };
        });

        container.querySelector("#btn-save-srv-action").onclick = () => {
          const name = container.querySelector("#srv-form-name").value.trim();
          const categoryId = container.querySelector("#srv-form-category").value;
          const price = parseInt(container.querySelector("#srv-form-price").value, 10);
          const duration = container.querySelector("#srv-form-duration").value.trim();
          const bookingType = container.querySelector("#srv-form-booking-type").value;
          const description = container.querySelector("#srv-form-desc").value.trim();
          const image = urlInput.value.trim() || "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80";
          const includedTasks = container.querySelector("#srv-form-included").value.split("\n").map(t => t.trim()).filter(Boolean);
          const excludedTasks = container.querySelector("#srv-form-excluded").value.split("\n").map(t => t.trim()).filter(Boolean);

          if (!name || !price || isNaN(price) || !duration || !description) {
            toast.error("Validation Error", "Please fill in all required fields (Name, Price, Duration, Description).");
            return;
          }

          const payload = {
            name,
            categoryId,
            price,
            duration,
            bookingType,
            description,
            image,
            includedTasks,
            excludedTasks
          };

          if (isEdit) {
            adminManager.updateService(existingService.serviceId, payload);
            toast.success("Service Updated ", `"${name}" changes saved.`);
          } else {
            adminManager.addService(payload);
            toast.success("Service Added ", `"${name}" published to catalog.`);
          }

          modal.close();
          window.location.reload();
        };
      }
    });
  }

  function openCategoryFormModal(existingCat = null) {
    const isEdit = !!existingCat;

    modal.open({
      title: isEdit ? `Edit Category: ${existingCat.name}` : "Add New Service Category",
      maxWidth: "540px",
      bodyHtml: `
        <div style="display: flex; flex-direction: column; gap: 1rem; max-height: 75vh; overflow-y: auto; padding-right: 0.35rem;">
          <div class="form-group" style="margin: 0;">
            <label class="form-label" style="font-weight: 600;">Category Name *</label>
            <input type="text" id="cat-form-name" class="form-input" value="${existingCat ? existingCat.name : ''}" placeholder="e.g. Pest Control & Sanitization" required>
          </div>

          <div class="form-group" style="margin: 0;">
            <label class="form-label" style="font-weight: 600;">Description *</label>
            <textarea id="cat-form-desc" class="form-textarea" rows="2" placeholder="Describe the types of services in this category..." required>${existingCat ? existingCat.description : ''}</textarea>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-weight: 600;">Category Icon</label>
              <select id="cat-form-icon" class="form-select">
                <option value="sparkles" ${existingCat?.icon === 'sparkles' ? 'selected' : ''}> Sparkles</option>
                <option value="home" ${existingCat?.icon === 'home' ? 'selected' : ''}>Home</option>
                <option value="droplet" ${existingCat?.icon === 'droplet' ? 'selected' : ''}>Droplet</option>
                <option value="utensils" ${existingCat?.icon === 'utensils' ? 'selected' : ''}>Utensils</option>
                <option value="package" ${existingCat?.icon === 'package' ? 'selected' : ''}>Package</option>
                <option value="shield" ${existingCat?.icon === 'shield' ? 'selected' : ''}>Shield</option>
                <option value="star" ${existingCat?.icon === 'star' ? 'selected' : ''}>Star</option>
                <option value="clock" ${existingCat?.icon === 'clock' ? 'selected' : ''}>Clock</option>
              </select>
            </div>
            <div class="form-group" style="margin: 0;">
              <label class="form-label" style="font-weight: 600;">Sort Order</label>
              <input type="number" id="cat-form-order" class="form-input" value="${existingCat ? existingCat.sortOrder : 11}" min="1">
            </div>
          </div>

          <!-- Category Image -->
          <div class="form-group" style="margin: 0; background: #F8FAFC; padding: 1rem; border-radius: 8px; border: 1px solid #E2E8F0;">
            <label class="form-label" style="font-weight: 700; margin-bottom: 0.35rem; display: flex; justify-content: space-between; align-items: center;">
              <span>Category Image / Cover Photo *</span>
              <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: normal;">URL or Local Upload</span>
            </label>
            <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
              <input type="url" id="cat-form-img-url" class="form-input" value="${existingCat ? existingCat.image : 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80'}" placeholder="https://images.unsplash.com/..." style="flex: 1;">
            </div>

            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap;">
              <label class="btn btn-secondary btn-sm" style="cursor: pointer; padding: 0.35rem 0.75rem; font-size: 0.8rem; display: inline-flex; align-items: center; gap: 0.35rem;">
                ${icon('folder', { size: 13 })} Upload Local Image
                <input type="file" id="cat-form-img-file" accept="image/*" style="display: none;">
              </label>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Quick presets:</span>
              <button type="button" class="btn btn-glass btn-sm btn-preset-cat" data-url="https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80">Home</button>
              <button type="button" class="btn btn-glass btn-sm btn-preset-cat" data-url="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80">Bathroom</button>
              <button type="button" class="btn btn-glass btn-sm btn-preset-cat" data-url="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=600&q=80">Kitchen</button>
              <button type="button" class="btn btn-glass btn-sm btn-preset-cat" data-url="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=80">Balcony</button>
            </div>

            <div style="height: 120px; border-radius: 8px; overflow: hidden; background: #EDF2F7; border: 1.5px dashed #CBD5E1; display: flex; align-items: center; justify-content: center;">
              <img id="cat-form-img-preview" src="${existingCat ? existingCat.image : 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80'}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
            </div>
          </div>
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">Cancel</button>
        <button class="btn btn-primary btn-sm" id="btn-save-cat-action">${isEdit ? "Save Changes" : "Add Category"}</button>
      `,
      onOpen: (container) => {
        const urlInput = container.querySelector("#cat-form-img-url");
        const fileInput = container.querySelector("#cat-form-img-file");
        const imgPreview = container.querySelector("#cat-form-img-preview");

        if (urlInput && imgPreview) {
          urlInput.oninput = () => {
            if (urlInput.value.trim()) {
              imgPreview.src = urlInput.value.trim();
            }
          };
        }

        if (fileInput) {
          fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (loadEvent) => {
                const base64 = loadEvent.target.result;
                if (urlInput) urlInput.value = base64;
                if (imgPreview) imgPreview.src = base64;
              };
              reader.readAsDataURL(file);
            }
          };
        }

        container.querySelectorAll(".btn-preset-cat").forEach(btn => {
          btn.onclick = () => {
            const url = btn.getAttribute("data-url");
            if (urlInput) urlInput.value = url;
            if (imgPreview) imgPreview.src = url;
          };
        });

        container.querySelector("#btn-save-cat-action").onclick = () => {
          const name = container.querySelector("#cat-form-name").value.trim();
          const description = container.querySelector("#cat-form-desc").value.trim();
          const icon = container.querySelector("#cat-form-icon").value;
          const sortOrder = parseInt(container.querySelector("#cat-form-order").value, 10) || 1;
          const image = urlInput.value.trim() || "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=600&q=80";

          if (!name || !description) {
            toast.error("Validation Error", "Please provide Category Name and Description.");
            return;
          }

          const payload = {
            name,
            description,
            icon,
            sortOrder,
            image
          };

          if (isEdit) {
            adminManager.updateCategory(existingCat.categoryId, payload);
            toast.success("Category Updated ", `"${name}" has been updated.`);
          } else {
            adminManager.addCategory(payload);
            toast.success("Category Added ", `"${name}" has been created.`);
          }

          modal.close();
          window.location.reload();
        };
      }
    });
  }

  // 1. Add Service Button
  const addSrvBtn = document.getElementById("btn-admin-add-service");
  if (addSrvBtn) {
    addSrvBtn.onclick = () => openServiceFormModal(null);
  }

  // 2. Edit Service Buttons
  document.querySelectorAll(".btn-admin-edit-service").forEach(btn => {
    btn.onclick = () => {
      const sId = btn.getAttribute("data-id");
      const service = db.getServiceById(sId);
      if (service) {
        openServiceFormModal(service);
      }
    };
  });

  // 3. Toggle Service Status (Deactivate / Activate)
  document.querySelectorAll(".btn-admin-toggle-service").forEach(btn => {
    btn.onclick = () => {
      const sId = btn.getAttribute("data-id");
      adminManager.toggleServiceStatus(sId);
      toast.info("Status Updated", "Service catalog availability toggled.");
      window.location.reload();
    };
  });

  // 4. Delete Service Permanently
  document.querySelectorAll(".btn-admin-del-service").forEach(btn => {
    btn.onclick = () => {
      const sId = btn.getAttribute("data-id");
      const srv = db.getServiceById(sId);
      if (confirm(`Are you sure you want to delete "${srv?.name || 'this service'}" from the catalog?`)) {
        adminManager.deleteService(sId);
        toast.info("Service Deleted", "Removed from catalog.");
        window.location.reload();
      }
    };
  });

  // 5. Add Category Button
  const addCatBtn = document.getElementById("btn-admin-add-cat");
  if (addCatBtn) {
    addCatBtn.onclick = () => openCategoryFormModal(null);
  }

  // 6. Edit Category Buttons
  document.querySelectorAll(".btn-admin-edit-cat").forEach(btn => {
    btn.onclick = () => {
      const cId = btn.getAttribute("data-id");
      const category = (db.getCategories() || []).find(c => c.categoryId === cId);
      if (category) {
        openCategoryFormModal(category);
      }
    };
  });

  // 7. Delete Category
  document.querySelectorAll(".btn-admin-del-cat").forEach(btn => {
    btn.onclick = () => {
      const cId = btn.getAttribute("data-id");
      const category = (db.getCategories() || []).find(c => c.categoryId === cId);
      if (confirm(`Are you sure you want to delete category "${category?.name || cId}"?`)) {
        adminManager.deleteCategory(cId);
        toast.info("Category Deleted", "Category removed from catalog.");
        window.location.reload();
      }
    };
  });

  // Resolve Ticket
  document.querySelectorAll(".btn-admin-resolve-ticket").forEach(btn => {
    btn.onclick = () => {
      const cmpId = btn.getAttribute("data-id");
      const resp = prompt("Resolution comment for customer:", "Compensation credited. Issue resolved.");
      if (resp) {
        adminManager.resolveComplaint(cmpId, resp);
        toast.success("Ticket Resolved", "Closed and saved.");
        window.location.reload();
      }
    };
  });

  // Toggle Offer
  document.querySelectorAll(".btn-admin-toggle-offer").forEach(btn => {
    btn.onclick = () => {
      const offId = btn.getAttribute("data-id");
      adminManager.toggleOffer(offId);
      toast.info("Offer Updated", "Coupon status toggled.");
      window.location.reload();
    };
  });

  // Broadcast Notification Form
  const broadcastForm = document.getElementById("form-admin-broadcast");
  if (broadcastForm) {
    broadcastForm.onsubmit = (e) => {
      e.preventDefault();
      const targetAudience = document.getElementById("broadcast-audience").value;
      const title = document.getElementById("broadcast-title").value;
      const message = document.getElementById("broadcast-msg").value;
      notificationManager.sendBroadcast({ title, message, targetAudience });
      toast.success("Broadcast Dispatched", "Notification delivered to selected users.");
      broadcastForm.reset();
    };
  }

  // Settings Form
  const settingsForm = document.getElementById("form-admin-settings");
  if (settingsForm) {
    settingsForm.onsubmit = (e) => {
      e.preventDefault();
      const platformFee = parseInt(document.getElementById("setting-fee").value) || 49;
      const taxPercentage = parseInt(document.getElementById("setting-tax").value) || 18;
      const partnerCommissionRate = parseInt(document.getElementById("setting-commission").value) || 20;
      adminManager.updateSettings({ platformFee, taxPercentage, partnerCommissionRate });
      toast.success("Settings Saved", "Platform policies updated.");
    };
  }

  // =========================================================================
  // Partner Bank Payouts & Settlements Handlers
  // =========================================================================

  // Batch Weekly Payout
  const batchWeeklyBtn = document.getElementById("btn-admin-batch-weekly-payout");
  if (batchWeeklyBtn) {
    batchWeeklyBtn.onclick = () => {
      const snap = db.getSnapshot();
      const partners = snap.partners || [];
      const eligible = partners.filter(p => {
        const fin = db.getPartnerFinancials(p.partnerId || p.userId);
        return fin.hasBankDetails && fin.pendingSettlement > 0;
      });

      if (eligible.length === 0) {
        toast.info("No Due Settlements", "There are no partners with pending earnings and linked bank accounts.");
        return;
      }

      const totalPending = eligible.reduce((sum, p) => {
        const fin = db.getPartnerFinancials(p.partnerId || p.userId);
        return sum + fin.pendingSettlement;
      }, 0);

      if (confirm(`Process weekly Monday batch payout for ${eligible.length} eligible partners (Total: ₹${totalPending.toLocaleString()})?\n\nThis will transfer all pending net earnings and release the ₹500 safety deposits directly to their verified bank accounts.`)) {
        const results = db.processBatchWeeklyPayout();
        toast.success("Weekly Batch Disbursed ", `Successfully transferred ₹${totalPending.toLocaleString()} to ${results.length} partner bank accounts.`);
        window.location.reload();
      }
    };
  }

  // Individual Partner Payout Modal
  document.querySelectorAll(".btn-admin-send-payout").forEach(btn => {
    btn.onclick = () => {
      const pId = btn.getAttribute("data-partner-id");
      if (pId) {
        openSendPayoutModal(pId);
      }
    };
  });

  // Approve Quick Settle Request
  document.querySelectorAll(".btn-admin-approve-qs").forEach(btn => {
    btn.onclick = () => {
      const payoutId = btn.getAttribute("data-payout-id");
      const partnerId = btn.getAttribute("data-partner-id");
      const amount = Number(btn.getAttribute("data-amount"));
      const fin = db.getPartnerFinancials(partnerId);
      const b = fin.bankDetails || {};

      const genUtr = "UTR" + Math.floor(100000000000 + Math.random() * 900000000000);

      if (confirm(`Approve & Disburse Quick Settle of ₹${amount} to ${fin.partnerName}?\nBank: ${b.bankName} (•••• ${b.accountNumber ? b.accountNumber.slice(-4) : '****'})\n\nFunds will be marked as transferred via IMPS.`)) {
        try {
          db.processPartnerPayout({
            payoutId,
            partnerId,
            amount,
            transferMode: "IMPS",
            utrNumber: genUtr,
            note: "Approved on-demand Quick Settle disbursement"
          });
          toast.success("Quick Settle Disbursed", `Transferred ₹${amount} via IMPS (UTR: ${genUtr}).`);
          window.location.reload();
        } catch (err) {
          toast.error("Disbursement Failed", err.message);
        }
      }
    };
  });

  // =========================================================================
  // Partner Fleet & Booked Gigs Operations Event Handlers
  // =========================================================================

  // 1. Open Partner Gigs & Bookings Modal
  document.querySelectorAll(".btn-admin-view-partner-gigs").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const pId = btn.getAttribute("data-id");
      if (pId) {
        openPartnerGigsModal(pId);
      }
    };
  });

  // 2. Toggle Partner Online / Offline Availability
  document.querySelectorAll(".btn-admin-toggle-partner-online").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const pId = btn.getAttribute("data-id");
      if (pId) {
        const nextOnline = adminManager.togglePartnerAvailability(pId);
        toast.success(
          nextOnline ? "Partner Set to ONLINE" : "Partner Set to OFFLINE",
          `Availability status updated for partner ${pId}.`
        );
        window.location.reload();
      }
    };
  });

  // 3. Admin Cancel Gig Shift
  document.querySelectorAll(".btn-admin-cancel-gig").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      const slotId = btn.getAttribute("data-slot-id");
      const pName = btn.getAttribute("data-name") || "this partner";
      const shiftTime = btn.getAttribute("data-time") || "";
      const date = btn.getAttribute("data-date") || "";

      if (confirm(`Are you sure you want to cancel the booked gig shift (${shiftTime} on ${date}) for ${pName}?`)) {
        adminManager.cancelPartnerGigSlot(slotId);
        toast.info("Shift Cancelled", `Released ${pName}'s gig shift.`);
        window.location.reload();
      }
    };
  });

  // 4. Partner Directory Filter Pills & Search
  const partnerFilterPills = document.querySelectorAll("#partner-filter-pills .filter-pill");
  const partnerRows = document.querySelectorAll("#admin-partners-table .partner-row");
  const partnerSearchInput = document.getElementById("partner-search-input");

  function applyPartnerFilters() {
    const activePill = document.querySelector("#partner-filter-pills .filter-pill.active");
    const filterType = activePill ? activePill.getAttribute("data-filter") : "all";
    const query = (partnerSearchInput ? partnerSearchInput.value : "").trim().toLowerCase();

    partnerRows.forEach(row => {
      const isOnline = row.getAttribute("data-online") === "true";
      const kyc = row.getAttribute("data-kyc");
      const searchText = row.getAttribute("data-search") || "";

      let matchesFilter = true;
      if (filterType === "online") matchesFilter = isOnline;
      else if (filterType === "offline") matchesFilter = !isOnline;
      else if (filterType === "approved") matchesFilter = (kyc === "APPROVED");

      const matchesSearch = !query || searchText.includes(query);
      row.style.display = (matchesFilter && matchesSearch) ? "" : "none";
    });
  }

  partnerFilterPills.forEach(pill => {
    pill.onclick = () => {
      partnerFilterPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      applyPartnerFilters();
    };
  });

  if (partnerSearchInput) {
    partnerSearchInput.oninput = applyPartnerFilters;
  }

  // 5. Partner Gigs Console Filters & Search
  const gigDatePills = document.querySelectorAll("#gig-date-filters .filter-pill");
  const gigShiftPills = document.querySelectorAll("#gig-shift-filters .filter-pill");
  const gigPartnerSelect = document.getElementById("gig-filter-partner-select");
  const gigSearchInput = document.getElementById("gig-search-input");
  const gigRows = document.querySelectorAll("#admin-gigs-table .gig-row");

  function applyGigFilters() {
    const activeDatePill = document.querySelector("#gig-date-filters .filter-pill.active");
    const activeShiftPill = document.querySelector("#gig-shift-filters .filter-pill.active");
    const dateFilter = activeDatePill ? activeDatePill.getAttribute("data-date") : "all";
    const shiftFilter = activeShiftPill ? activeShiftPill.getAttribute("data-shift") : "all";
    const partnerFilter = gigPartnerSelect ? gigPartnerSelect.value : "all";
    const query = (gigSearchInput ? gigSearchInput.value : "").trim().toLowerCase();

    gigRows.forEach(row => {
      const rowDate = row.getAttribute("data-date");
      const rowShift = row.getAttribute("data-shift") || "";
      const rowPartner = row.getAttribute("data-partner");
      const searchText = row.getAttribute("data-search") || "";

      const matchesDate = (dateFilter === "all" || rowDate === dateFilter);
      const matchesShift = (shiftFilter === "all" || rowShift.includes(shiftFilter));
      const matchesPartner = (partnerFilter === "all" || rowPartner === partnerFilter);
      const matchesSearch = !query || searchText.includes(query);

      row.style.display = (matchesDate && matchesShift && matchesPartner && matchesSearch) ? "" : "none";
    });
  }

  gigDatePills.forEach(pill => {
    pill.onclick = () => {
      gigDatePills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      applyGigFilters();
    };
  });

  gigShiftPills.forEach(pill => {
    pill.onclick = () => {
      gigShiftPills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      applyGigFilters();
    };
  });

  if (gigPartnerSelect) {
    gigPartnerSelect.onchange = applyGigFilters;
  }

  if (gigSearchInput) {
    gigSearchInput.oninput = applyGigFilters;
  }
}
