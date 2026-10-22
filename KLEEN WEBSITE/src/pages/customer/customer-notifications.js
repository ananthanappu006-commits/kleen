/**
 * KLEEN — Customer Notifications Page (/customer/notifications)
 */

import { auth } from "../../services/auth-service.js";
import { notificationManager } from "../../services/notification/notification-manager.js";
import { toast } from "../../components/toast.js";
import { icon } from "../../components/icons.js";

export function renderCustomerNotificationsPage() {
  const user = auth.getCurrentUser();
  const notifications = user ? notificationManager.getNotifications(user.userId) : [];

  return `
    <div class="app-container" style="max-width: 700px; padding: 3rem 1rem 6rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <div>
          <span class="badge badge-info" style="margin-bottom: 0.35rem;">Inbox</span>
          <h2>Your Notifications</h2>
        </div>
        ${notifications.length > 0 ? `
          <button id="btn-mark-all-read" class="btn btn-glass btn-sm">Mark All as Read</button>
        ` : ''}
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.85rem;">
        ${notifications.length > 0 ? notifications.map(n => `
          <div class="solid-card" style="padding: 1.25rem; ${!n.isRead ? 'border-left: 4px solid var(--brand-emerald); background: #F8FAF9;' : ''}">
            <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.25rem;">
              <h4 style="font-size: 0.95rem;">${n.title}</h4>
              <span style="font-size: 0.725rem; color: var(--text-muted);">Recent</span>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.45;">${n.message}</p>
          </div>
        `).join("") : `
          <div class="solid-card" style="padding: 3rem; text-align: center;">
            <div style="margin-bottom: 0.75rem;">${icon('bell', { size: 40, stroke: 'var(--brand-emerald)' })}</div>
            <h3>You're all caught up!</h3>
            <p style="color: var(--text-muted); font-size: 0.85rem;">No unread notifications right now.</p>
          </div>
        `}
      </div>
    </div>
  `;
}

export function attachCustomerNotificationsEvents() {
  const btn = document.getElementById("btn-mark-all-read");
  if (btn) {
    btn.onclick = () => {
      const user = auth.getCurrentUser();
      if (user) {
        notificationManager.markAllAsRead(user.userId);
      }
      toast.success("All Read", "Notifications marked as read.");
      window.location.reload();
    };
  }
}
