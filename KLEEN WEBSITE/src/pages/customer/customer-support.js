/**
 * KLEEN — Customer Support & Complaints (/customer/support)
 */

import { auth } from "../../services/auth-service.js";
import { db } from "../../services/db-service.js";
import { toast } from "../../components/toast.js";

export function renderCustomerSupportPage() {
  const user = auth.getCurrentUser();
  const complaints = user ? db.getComplaints().filter(c => c.createdBy === user.userId) : [];
  const bookings = user ? db.getBookings().filter(b => b.customerId === user.userId) : [];

  return `
    <div class="app-container" style="max-width: 800px; padding: 3rem 1rem 6rem;">
      <div style="margin-bottom: 2rem;">
        <span class="badge badge-info" style="margin-bottom: 0.35rem;">Customer Care</span>
        <h2>Help & Support Tickets</h2>
        <p style="color: var(--text-muted);">Track your active inquiries or submit a new service ticket.</p>
      </div>

      <!-- New Ticket Form Card -->
      <div class="solid-card" style="padding: 2rem; margin-bottom: 3rem;">
        <h3 style="margin-bottom: 1.25rem;">Submit a New Support Ticket</h3>
        <form id="form-customer-ticket">
          <div class="form-group">
            <label class="form-label">Select Associated Booking</label>
            <select id="ticket-booking-select" class="form-select">
              ${bookings.map(b => `
                <option value="${b.bookingId}">Booking #${b.bookingId} - ${b.serviceName} (${b.bookingDate})</option>
              `).join("")}
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Category / Issue</label>
            <select id="ticket-subject" class="form-select">
              <option>Partner delayed or missed scheduled slot</option>
              <option>Cleaning quality or incomplete task</option>
              <option>Billing, coupon or refund query</option>
              <option>Safety or conduct feedback</option>
              <option>General query</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Explain what happened</label>
            <textarea id="ticket-desc" class="form-textarea" placeholder="Please share details so our operations team can resolve this immediately..." required></textarea>
          </div>

          <button type="submit" class="btn btn-primary btn-md">Submit Support Request</button>
        </form>
      </div>

      <!-- Previous Tickets -->
      <section>
        <h3 style="margin-bottom: 1.25rem;">Your Support History</h3>
        ${complaints.length > 0 ? `
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${complaints.map(c => `
              <div class="solid-card" style="padding: 1.5rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                  <strong style="font-size: 1.05rem;">${c.subject}</strong>
                  <span class="badge ${c.status === 'RESOLVED' ? 'badge-success' : 'badge-warning'}">${c.status}</span>
                </div>
                <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5;">${c.description}</p>
                <div style="font-size: 0.775rem; color: var(--text-muted); margin-top: 0.75rem;">
                  Ticket #${c.complaintId} • Booking #${c.bookingId}
                </div>
                ${c.adminResponse ? `
                  <div style="background: #F0FDF4; border: 1px solid #BBF7D0; padding: 0.75rem; border-radius: var(--radius-sm); margin-top: 0.75rem; font-size: 0.85rem; color: #166534;">
                    <strong>KLEEN Support Resolution:</strong> ${c.adminResponse}
                  </div>
                ` : ''}
              </div>
            `).join("")}
          </div>
        ` : `
          <p style="color: var(--text-muted);">You have no open support tickets.</p>
        `}
      </section>
    </div>
  `;
}

export function attachCustomerSupportEvents() {
  const form = document.getElementById("form-customer-ticket");
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const bookingId = document.getElementById("ticket-booking-select").value;
      const subject = document.getElementById("ticket-subject").value;
      const desc = document.getElementById("ticket-desc").value;
      const user = auth.getCurrentUser();
      if (!user) {
        toast.error("Sign In Required", "Please sign in to submit support tickets.");
        return;
      }

      db.submitComplaint({
        createdBy: user.userId,
        userType: "customer",
        bookingId,
        subject,
        description: desc
      });

      toast.success("Ticket Submitted", "Our support manager has been notified and will assist you shortly.");
      form.reset();
      window.location.reload();
    };
  }
}
