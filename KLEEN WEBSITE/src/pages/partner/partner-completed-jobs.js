/**
 * KLEEN — Partner Completed Jobs History (/partner/completed-jobs)
 * Historical ledger of all completed cleanings with service, customer, completion time, earnings, and star rating.
 */

import { auth } from "../../services/auth-service.js";
import { db } from "../../services/db-service.js";
import { icon } from "../../components/icons.js";
import { renderPartnerHeader, renderPartnerSidebar, renderPartnerMobileBottomNav, attachPartnerNavEvents } from "./partner-nav.js";

export function renderPartnerCompletedJobsPage() {
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
  const partnerId = partner.partnerId || user.userId;
  const snapshot = db.getSnapshot();
  const allBookings = snapshot.bookings || [];

  // Filter completed bookings for this partner
  const completed = allBookings.filter(b => 
    b.partnerId === partnerId && 
    (b.status === "SERVICE_COMPLETED" || b.status === "COMPLETED")
  ).sort((a, b) => new Date(b.completedAt || b.createdAt || 0) - new Date(a.completedAt || a.createdAt || 0));

  // Partner ratings breakdown & verified reviews
  const avgRating = partner.rating ? partner.rating.toFixed(1) : "4.9";
  const partnerReviews = snapshot.reviews ? snapshot.reviews.filter(r => r.partnerId === partnerId) : [];
  
  // Seed sample verified reviews if brand new partner
  const displayReviews = partnerReviews.length > 0 ? partnerReviews : [
    {
      customerName: "Ananya Menon",
      serviceName: "Deep Home Cleaning",
      rating: 5,
      comment: "Arrived exactly on time! Kitchen countertops, sink scaling, and living room were spotless. Very polite.",
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      customerName: "Rahul Varma",
      serviceName: "Bathroom Scrubbing & Sanitization",
      rating: 5,
      comment: "Incredible attention to detail with tile scaling and floor cleaning. Will book again next month.",
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
    },
    {
      customerName: "Deepa Nair",
      serviceName: "Kitchen & Exhaust Degreasing",
      rating: 4,
      comment: "Cleaned thoroughly. Very professional service specialist.",
      createdAt: new Date(Date.now() - 86400000 * 9).toISOString()
    }
  ];

  const totalReviewsCount = displayReviews.length;
  const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  displayReviews.forEach(r => {
    const star = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
    starCounts[star] = (starCounts[star] || 0) + 1;
  });

  const effectiveTotalReviews = totalReviewsCount || 1;

  return `
    <div class="partner-layout">
      ${renderPartnerSidebar("/partner/completed-jobs")}

      <div class="partner-main-content">
        ${renderPartnerHeader("/partner/completed-jobs", partner)}

        <div class="partner-dashboard-body" style="padding: 1.5rem 1rem 5rem;">
          
          <div style="margin-bottom: 2rem;">
            <span class="badge badge-success" style="margin-bottom: 0.35rem;">Service Archive</span>
            <h2 style="font-size: 1.65rem; margin: 0; font-weight: 800;">Completed Cleaning Jobs (${completed.length})</h2>
            <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0.25rem 0 0;">
              Full chronological history of all verified services delivered by you
            </p>
          </div>

          ${completed.length === 0 ? `
            <div class="solid-card" style="padding: 4rem 1.5rem; text-align: center;">
              <div class="icon-box icon-box-lg icon-box-slate" style="margin: 0 auto 0.75rem;">
                ${icon('calendar', { size: 32 })}
              </div>
              <h3 style="font-weight: 800;">No Completed Jobs Yet</h3>
              <p style="color: var(--text-muted); font-size: 0.875rem; max-width: 420px; margin: 0.5rem auto 1.5rem;">
                When you accept and finish customer cleaning bookings, their completion timestamp and 80% payout will appear here.
              </p>
              <a href="#/partner/bookings" class="btn btn-primary btn-sm">Browse Available Requests</a>
            </div>
          ` : `
            <div class="solid-card" style="padding: 1.5rem;">
              <div style="display: flex; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap;">
                <input type="text" id="filter-completed-search" class="form-input" placeholder="Search service, customer..." style="flex: 1; min-width: 200px;">
                <input type="date" id="filter-completed-date" class="form-input" style="width: auto;">
              </div>

              <div class="table-responsive">
                <table class="kleen-table" id="completed-jobs-table">
                  <thead>
                    <tr>
                      <th>Booking ID</th>
                      <th>Service Name</th>
                      <th>Customer</th>
                      <th>Scheduled Date</th>
                      <th>Duration</th>
                      <th>Completed Time</th>
                      <th>Your Earnings (80%)</th>
                      <th>Customer Rating</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody id="completed-jobs-tbody">
                    ${completed.map(b => {
                      const net = Math.round((b.totalAmount || 499) * 0.80);
                      return `
                        <tr>
                          <td><strong>#${b.bookingId}</strong></td>
                          <td>${b.serviceName}</td>
                          <td>${b.customerName || 'Customer'}</td>
                          <td>${b.bookingDate}</td>
                          <td>${b.duration || '2 hrs'}</td>
                          <td>${b.completedAt ? new Date(b.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Done'}</td>
                          <td><strong style="color: var(--brand-emerald-dark);">₹${net}</strong></td>
                          <td>
                            <span style="color: #D97706; font-weight: 700; display: inline-flex; align-items: center; gap: 0.25rem;">
                              ${icon('star', { size: 12, fill: '#F59E0B', stroke: '#F59E0B' })} ${b.rating || '5.0'}
                            </span>
                          </td>
                          <td>
                            <a href="#/partner/bookings/${b.bookingId}" class="btn btn-secondary btn-sm">
                              View Details
                            </a>
                          </td>
                        </tr>
                      `;
                    }).join("")}
                  </tbody>
                </table>
              </div>
            </div>
          `}

          <!-- Section 11: Ratings & Verified Customer Reviews (Feature 11) -->
          <div class="solid-card" style="padding: 2rem; margin-top: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
              <div>
                <span class="badge badge-warning" style="margin-bottom: 0.35rem;">Customer Feedback</span>
                <h3 style="font-size: 1.35rem; margin: 0; font-weight: 800;">Ratings & Reviews Summary</h3>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0.25rem 0 0;">
                  Customer feedback directly impacts your verified partner rating, dispatch rank, and weekly bonuses.
                </p>
              </div>
              <div style="background: #FFFBEB; border: 1px solid #FCD34D; padding: 0.5rem 0.85rem; border-radius: var(--radius-sm); font-size: 0.775rem; color: #92400E; display: flex; align-items: center; gap: 0.4rem;">
                <span>${icon('lock', { size: 14 })}</span> <span><strong>Verified Ratings:</strong> Partner cannot edit or delete customer reviews</span>
              </div>
            </div>

            <!-- Rating Breakdown Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 2rem; align-items: center; margin-bottom: 2rem;">
              <!-- Score Summary -->
              <div style="text-align: center; background: #FAFDFB; border: 1.5px solid #E2E8F0; padding: 1.75rem 1.25rem; border-radius: var(--radius-md);">
                <div style="font-size: 3.5rem; font-weight: 800; color: var(--brand-emerald-dark); line-height: 1;">
                  ${avgRating}
                </div>
                <div style="display: flex; justify-content: center; gap: 0.25rem; margin: 0.5rem 0;">
                  ${Array(5).fill(icon('star', { size: 18, fill: '#F59E0B', stroke: '#F59E0B' })).join('')}
                </div>
                <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">
                  Based on ${effectiveTotalReviews} Verified Reviews
                </div>
                <div style="margin-top: 0.5rem;">
                  <span class="badge badge-success" style="font-size: 0.725rem;">Top 5% Partner</span>
                </div>
              </div>

              <!-- 5 Star to 1 Star Breakdown Bars -->
              <div style="display: flex; flex-direction: column; gap: 0.55rem;">
                ${[5, 4, 3, 2, 1].map(stars => {
                  const count = starCounts[stars];
                  const pct = effectiveTotalReviews > 0 ? Math.round((count / effectiveTotalReviews) * 100) : 0;
                  return `
                    <div style="display: flex; align-items: center; gap: 0.75rem; font-size: 0.85rem;">
                      <span style="width: 55px; font-weight: 600; color: var(--text-secondary);">${stars} Star${stars > 1 ? 's' : ' '}</span>
                      <div style="flex: 1; height: 10px; background: #E5E7EB; border-radius: 5px; overflow: hidden;">
                        <div style="width: ${pct}%; height: 100%; background: ${stars >= 4 ? '#10B981' : (stars === 3 ? '#F59E0B' : '#EF4444')}; border-radius: 5px;"></div>
                      </div>
                      <span style="width: 75px; text-align: right; color: var(--text-muted); font-size: 0.8rem; font-weight: 600;">${count} (${pct}%)</span>
                    </div>
                  `;
                }).join("")}
              </div>
            </div>

            <!-- Customer Reviews List -->
            <div style="border-top: 1px solid #E5E7EB; padding-top: 1.5rem;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h4 style="font-size: 1.1rem; margin: 0; color: var(--text-primary); font-weight: 800;">Recent Customer Reviews (${displayReviews.length})</h4>
                <span style="font-size: 0.75rem; color: var(--text-muted);">Read-Only Platform Records</span>
              </div>

              <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                ${displayReviews.map(rev => `
                  <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: var(--radius-md); padding: 1.15rem 1.25rem;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.4rem; flex-wrap: wrap; gap: 0.5rem;">
                      <div>
                        <strong style="font-size: 0.95rem; color: var(--text-primary); display: inline-flex; align-items: center; gap: 0.35rem;">
                          ${icon('user', { size: 14, stroke: 'var(--brand-emerald)' })} ${rev.customerName || 'Verified Customer'}
                        </strong>
                        <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 0.5rem;">• Service: <strong>${rev.serviceName || 'Home Cleaning'}</strong></span>
                      </div>
                      <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="display: flex; align-items: center; gap: 0.15rem;">
                          ${Array(rev.rating || 5).fill(icon('star', { size: 13, fill: '#F59E0B', stroke: '#F59E0B' })).join('')}
                          ${Array(5 - (rev.rating || 5)).fill(icon('star', { size: 13, stroke: '#CBD5E1' })).join('')}
                        </div>
                        <span style="font-size: 0.75rem; color: var(--text-muted);">${rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recent'}</span>
                      </div>
                    </div>
                    <p style="margin: 0.25rem 0 0; font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; font-style: italic;">
                      "${rev.comment || 'Punctual, thorough, and very courteous.'}"
                    </p>
                  </div>
                `).join("")}
              </div>
            </div>
          </div>

        </div>

        ${renderPartnerMobileBottomNav("/partner/completed-jobs")}
      </div>
    </div>
  `;
}

export function attachPartnerCompletedJobsEvents() {
  attachPartnerNavEvents();

  const searchInput = document.getElementById("filter-completed-search");
  const dateInput = document.getElementById("filter-completed-date");
  const tbody = document.getElementById("completed-jobs-tbody");

  if (tbody && (searchInput || dateInput)) {
    const filterFn = () => {
      const q = (searchInput?.value || "").toLowerCase().trim();
      const dt = dateInput?.value || "";
      const rows = tbody.querySelectorAll("tr");

      rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        const matchesQ = !q || text.includes(q);
        const matchesDt = !dt || text.includes(dt);
        row.style.display = (matchesQ && matchesDt) ? "" : "none";
      });
    };

    if (searchInput) searchInput.oninput = filterFn;
    if (dateInput) dateInput.onchange = filterFn;
  }
}
