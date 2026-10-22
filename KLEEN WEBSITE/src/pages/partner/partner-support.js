/**
 * KLEEN — Partner Support Portal (/partner/support)
 * Create support tickets, view ticket status threads, and browse partner FAQs.
 */

import { auth } from "../../services/auth-service.js";
import { db } from "../../services/db-service.js";
import { modal } from "../../components/modal.js";
import { toast } from "../../components/toast.js";
import { icon } from "../../components/icons.js";
import { renderPartnerHeader, renderPartnerSidebar, renderPartnerMobileBottomNav, attachPartnerNavEvents } from "./partner-nav.js";

export function renderPartnerSupportPage() {
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

  const tickets = db.getPartnerTickets(partnerId);
  const myBookings = (db.getSnapshot().bookings || []).filter(b => b.partnerId === partnerId);

  return `
    <div class="partner-layout">
      ${renderPartnerSidebar("/partner/support")}

      <div class="partner-main-content">
        ${renderPartnerHeader("/partner/support", partner)}

        <div class="partner-dashboard-body" style="max-width: 820px; margin: 0 auto; padding: 2rem 1rem 5rem;">
          
          <div style="margin-bottom: 2rem;">
            <span class="badge badge-info" style="margin-bottom: 0.35rem;">Help & Assistance</span>
            <h2 style="font-size: 1.65rem; margin: 0; font-weight: 800;">Partner Support Helpdesk</h2>
            <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0.25rem 0 0;">
              24/7 dedicated assistance for partner safety, payments, scheduling, and customer disputes.
            </p>
          </div>

          <!-- Emergency Hotline Banner -->
          <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
            <div>
              <strong style="color: #991B1B; font-size: 0.95rem; display: inline-flex; align-items: center; gap: 0.4rem;">
                ${icon('alert-triangle', { size: 18, stroke: '#DC2626' })} Partner Emergency Safety SOS
              </strong>
              <p style="color: #B91C1C; font-size: 0.825rem; margin: 0.15rem 0 0;">For immediate on-ground physical safety concerns during a trip</p>
            </div>
            <a href="tel:18004195533" class="btn btn-danger btn-sm" style="font-weight: 700; display: inline-flex; align-items: center; gap: 0.35rem;">
              ${icon('phone', { size: 14 })} Call SOS Helpline
            </a>
          </div>

          <!-- Create Ticket Form -->
          <div class="solid-card" style="padding: 2rem; margin-bottom: 2rem;">
            <h3 style="font-size: 1.2rem; margin-bottom: 1.25rem;">Create New Support Ticket</h3>
            
            <form id="form-partner-support-ticket">
              <div class="form-group">
                <label class="form-label">Subject / Issue Summary *</label>
                <input type="text" id="ticket-subject" class="form-input" placeholder="e.g. Discrepancy in weekly payout settlement" required>
              </div>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                <div class="form-group">
                  <label class="form-label">Category *</label>
                  <select id="ticket-category" class="form-select" required>
                    <option value="Booking">Booking</option>
                    <option value="Payment">Payment</option>
                    <option value="KYC">KYC</option>
                    <option value="Account">Account</option>
                    <option value="Technical">Technical</option>
                    <option value="Customer">Customer</option>
                    <option value="Earnings">Earnings</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Related Booking (Optional)</label>
                  <select id="ticket-booking-id" class="form-select">
                    <option value="">None / General Inquiry</option>
                    ${myBookings.map(b => `
                      <option value="${b.bookingId}">Booking #${b.bookingId} (${b.serviceName} - ${b.bookingDate})</option>
                    `).join("")}
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Detailed Description *</label>
                <textarea id="ticket-description" class="form-textarea" placeholder="Please provide all relevant details so our team can resolve your query swiftly..." rows="4" required></textarea>
              </div>

              <div class="form-group">
                <label class="form-label">Attachment (Optional screenshot or receipt)</label>
                <input type="file" id="ticket-attachment" class="form-input" accept="image/*,.pdf">
              </div>

              <button type="submit" id="btn-submit-ticket" class="btn btn-primary btn-md" style="font-weight: 700;">
                SUBMIT SUPPORT TICKET →
              </button>
            </form>
          </div>

          <!-- My Tickets Section (PRD Section 31-32) -->
          <div class="solid-card" style="padding: 2rem; margin-bottom: 2rem;">
            <h3 style="font-size: 1.2rem; margin-bottom: 1.25rem;">My Support Tickets (${tickets.length})</h3>

            ${tickets.length === 0 ? `
              <p style="color: var(--text-muted); font-size: 0.875rem; text-align: center; padding: 1.5rem 0;">
                You have not filed any support tickets. If you encounter any issue, submit the form above.
              </p>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 1rem;">
                ${tickets.map(t => {
                  let badgeClass = "badge-info";
                  if (t.status === "RESOLVED") badgeClass = "badge-success";
                  else if (t.status === "IN_PROGRESS" || t.status === "WAITING_FOR_PARTNER") badgeClass = "badge-warning";
                  else if (t.status === "CLOSED") badgeClass = "badge-neutral";

                  return `
                    <div style="border: 1px solid #E5E7EB; border-radius: var(--radius-md); padding: 1.25rem; background: #FAFAFA;">
                      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
                        <div>
                          <strong style="font-size: 1rem; color: var(--text-primary);">${t.subject}</strong>
                          <div style="font-size: 0.775rem; color: var(--text-muted); margin-top: 0.2rem;">
                            Ticket #${t.complaintId} • Category: ${t.category || 'General'} ${t.bookingId ? `• Booking #${t.bookingId}` : ''}
                          </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                          <span class="badge ${badgeClass}">
                            ${(t.status || 'OPEN').replace(/_/g, ' ')}
                          </span>
                          <button class="btn btn-secondary btn-sm btn-view-ticket-thread" data-id="${t.complaintId}" style="font-size: 0.75rem; display: inline-flex; align-items: center; gap: 0.3rem;">
                            ${icon('file-text', { size: 13 })} View Thread
                          </button>
                        </div>
                      </div>

                      <p style="font-size: 0.875rem; color: var(--text-secondary); margin: 0.5rem 0; line-height: 1.4;">
                        "${t.description}"
                      </p>

                      <div style="font-size: 0.75rem; color: var(--text-muted); display: flex; gap: 1rem; margin-top: 0.4rem; flex-wrap: wrap;">
                        <span style="display: inline-flex; align-items: center; gap: 0.3rem;">${icon('calendar', { size: 12 })} Created: ${t.createdAt ? new Date(t.createdAt).toLocaleString() : 'Recently'}</span>
                        <span style="display: inline-flex; align-items: center; gap: 0.3rem;">${icon('clock', { size: 12 })} Last Updated: ${t.updatedAt ? new Date(t.updatedAt).toLocaleString() : (t.createdAt ? new Date(t.createdAt).toLocaleString() : 'Recently')}</span>
                      </div>

                      ${t.adminResponse ? `
                        <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 6px; padding: 0.75rem; margin-top: 0.75rem; font-size: 0.85rem;">
                          <strong style="color: #166534;">Admin Response:</strong>
                          <p style="color: #15803D; margin: 0.25rem 0 0;">${t.adminResponse}</p>
                        </div>
                      ` : `
                        <div style="margin-top: 0.5rem;">
                          <span style="font-size: 0.75rem; color: var(--text-muted); font-style: italic; display: inline-flex; align-items: center; gap: 0.3rem;">
                            ${icon('clock', { size: 12 })} Awaiting administrator review. Average response time: 2 hours.
                          </span>
                        </div>
                      `}
                    </div>
                  `;
                }).join("")}
              </div>
            `}
          </div>

          <!-- Partner FAQ Section -->
          <div class="solid-card" style="padding: 2rem;">
            <h3 style="font-size: 1.2rem; margin-bottom: 1rem;">Frequently Asked Questions</h3>
            
            <div style="display: flex; flex-direction: column; gap: 1rem; font-size: 0.875rem;">
              <div>
                <strong>When do I receive my bank payouts?</strong>
                <p style="color: var(--text-secondary); margin: 0.2rem 0 0;">
                  Payouts are settled every Monday directly into your verified bank account for all jobs completed in the previous week.
                </p>
              </div>
              <div>
                <strong>What happens if a customer cancels at the last minute?</strong>
                <p style="color: var(--text-secondary); margin: 0.2rem 0 0;">
                  If a customer cancels within 2 hours of the scheduled start time, you receive a guaranteed cancellation compensation fee of ₹150.
                </p>
              </div>
              <div>
                <strong>How are customer star ratings calculated?</strong>
                <p style="color: var(--text-secondary); margin: 0.2rem 0 0;">
                  Ratings are an average of verified customer reviews over your last 50 completed bookings. Maintaining a 4.6+ rating qualifies you for premium incentive bonuses.
                </p>
              </div>
            </div>
          </div>

        </div>

        ${renderPartnerMobileBottomNav("/partner/support")}
      </div>
    </div>
  `;
}

export function attachPartnerSupportEvents() {
  attachPartnerNavEvents();

  const user = auth.getCurrentUser();
  if (!user) return;
  const partnerId = user.userId;

  const form = document.getElementById("form-partner-support-ticket");
  if (form) {
    form.onsubmit = (e) => {
      e.preventDefault();
      const subject = document.getElementById("ticket-subject").value.trim();
      const category = document.getElementById("ticket-category").value;
      const bookingId = document.getElementById("ticket-booking-id").value;
      const description = document.getElementById("ticket-description").value.trim();
      const submitBtn = document.getElementById("btn-submit-ticket");

      if (!subject || !description) {
        toast.error("Fields Required", "Please enter subject and description.");
        return;
      }

      submitBtn.textContent = "Submitting Ticket...";
      submitBtn.disabled = true;

      db.createPartnerTicket({
        partnerId,
        subject,
        category,
        bookingId,
        description
      });

      toast.success("Support Ticket Created!", "Our partner operations team has been notified.");
      window.location.reload();
    };
  }

  // View Ticket Thread Modal
  document.querySelectorAll(".btn-view-ticket-thread").forEach(btn => {
    btn.onclick = () => {
      const ticketId = btn.getAttribute("data-id");
      const tickets = db.getPartnerTickets(partnerId);
      const ticket = tickets.find(t => t.complaintId === ticketId);
      if (!ticket) return;

      const partner = db.getPartnerById(partnerId) || user;

      modal.open({
        title: `Support Ticket Thread #${ticket.complaintId}`,
        maxWidth: "600px",
        bodyHtml: `
          <div style="margin-bottom: 1rem; padding-bottom: 0.75rem; border-bottom: 1px solid #E5E7EB;">
            <strong style="font-size: 1.05rem;">${ticket.subject}</strong>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
              Category: ${ticket.category || 'General'} • Status: <span class="badge badge-info">${(ticket.status || 'OPEN').replace(/_/g, ' ')}</span>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.75rem; max-height: 280px; overflow-y: auto; padding: 0.5rem 0; margin-bottom: 1rem;">
            <!-- Partner Original Message -->
            <div style="background: #F3F4F6; padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.875rem;">
              <div style="font-weight: 700; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">YOU (${new Date(ticket.createdAt).toLocaleString()})</div>
              <div>${ticket.description}</div>
            </div>

            <!-- Admin Response -->
            ${ticket.adminResponse ? `
              <div style="background: #F0FDF4; border: 1px solid #BBF7D0; padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.875rem; margin-left: 1.5rem;">
                <div style="font-weight: 700; font-size: 0.75rem; color: #166534; margin-bottom: 0.25rem;">KLEEN PARTNER SUPPORT TEAM</div>
                <div style="color: #15803D;">${ticket.adminResponse}</div>
              </div>
            ` : ''}

            ${(ticket.responses || []).map(r => `
              <div style="background: ${r.senderRole === 'admin' ? '#F0FDF4' : '#F3F4F6'}; border: ${r.senderRole === 'admin' ? '1px solid #BBF7D0' : 'none'}; padding: 0.75rem 1rem; border-radius: var(--radius-md); font-size: 0.875rem; ${r.senderRole === 'admin' ? 'margin-left: 1.5rem;' : ''}">
                <div style="font-weight: 700; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem;">${r.senderName} (${new Date(r.timestamp).toLocaleString()})</div>
                <div>${r.text}</div>
              </div>
            `).join("")}
          </div>

          ${ticket.status !== 'CLOSED' ? `
            <div class="form-group" style="margin-bottom: 0.5rem;">
              <label class="form-label" style="font-size: 0.8rem;">Send Reply to Support</label>
              <textarea id="modal-reply-text" class="form-textarea" rows="2" placeholder="Type message..."></textarea>
            </div>
          ` : `
            <div style="font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 0.5rem; background: #F8FAFC; border-radius: 6px; display: flex; align-items: center; justify-content: center; gap: 0.35rem;">
              ${icon('lock', { size: 14 })} This support ticket has been closed.
            </div>
          `}
        `,
        footerHtml: `
          <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">Close Window</button>
          ${ticket.status !== 'CLOSED' ? `
            <button class="btn btn-danger btn-sm" id="btn-modal-close-ticket">Close Ticket</button>
            <button class="btn btn-primary btn-sm" id="btn-modal-send-reply">Send Reply</button>
          ` : ''}
        `,
        onOpen: (container) => {
          const sendBtn = container.querySelector("#btn-modal-send-reply");
          if (sendBtn) {
            sendBtn.onclick = () => {
              const replyText = container.querySelector("#modal-reply-text").value.trim();
              if (!replyText) {
                toast.error("Message Empty", "Please write a message before sending.");
                return;
              }
              db.addTicketReply(ticket.complaintId, {
                senderRole: "partner",
                senderName: partner.fullName || "Partner",
                text: replyText
              });
              modal.close();
              toast.success("Reply Sent", "Your message was sent to the support team.");
              window.location.reload();
            };
          }

          const closeBtn = container.querySelector("#btn-modal-close-ticket");
          if (closeBtn) {
            closeBtn.onclick = () => {
              db.updateTicketStatus(ticket.complaintId, "CLOSED");
              modal.close();
              toast.info("Ticket Closed", "Support ticket has been marked as closed.");
              window.location.reload();
            };
          }
        }
      });
    };
  });
}
