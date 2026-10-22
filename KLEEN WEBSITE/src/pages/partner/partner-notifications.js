/**
 * KLEEN — Partner Notifications Center (/partner/notifications)
 * In-app notifications for bookings, earnings, KYC decisions, and admin messages.
 */

import { auth } from "../../services/auth-service.js";
import { db } from "../../services/db-service.js";
import { toast } from "../../components/toast.js";
import { icon } from "../../components/icons.js";
import { renderPartnerHeader, renderPartnerSidebar, renderPartnerMobileBottomNav, attachPartnerNavEvents } from "./partner-nav.js";

export function renderPartnerNotificationsPage() {
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
  const allNotifs = db.getNotifications();

  // Filter notifications addressed to this partner, all_partners, or all
  const notifications = allNotifs.filter(n => 
    n.userId === partnerId || 
    n.userId === "all_partners" || 
    n.userId === "all"
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return `
    <div class="partner-layout">
      ${renderPartnerSidebar("/partner/notifications")}

      <div class="partner-main-content">
        ${renderPartnerHeader("/partner/notifications", partner)}

        <div class="partner-dashboard-body" style="max-width: 780px; margin: 0 auto; padding: 2rem 1rem 5rem;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 0.75rem;">
            <div>
              <span class="badge badge-info" style="margin-bottom: 0.35rem;">Partner Inbox</span>
              <h2 style="font-size: 1.65rem; margin: 0; font-weight: 800;">Notifications (${unreadCount} unread)</h2>
            </div>
            ${unreadCount > 0 ? `
              <button id="btn-partner-mark-all-read" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 0.35rem; font-weight: 700;">
                ${icon('check', { size: 14 })} Mark All as Read
              </button>
            ` : ''}
          </div>

          <div style="display: flex; gap: 0.5rem; margin-bottom: 1.5rem; overflow-x: auto; padding-bottom: 0.5rem;" id="notif-category-pills">
            <button class="badge badge-success btn-notif-cat active" data-cat="ALL">All</button>
            <button class="badge badge-neutral btn-notif-cat" data-cat="BOOKING">Bookings</button>
            <button class="badge badge-neutral btn-notif-cat" data-cat="KYC">KYC</button>
            <button class="badge badge-neutral btn-notif-cat" data-cat="EARNING">Earnings</button>
            <button class="badge badge-neutral btn-notif-cat" data-cat="SUPPORT">Support</button>
            <button class="badge badge-neutral btn-notif-cat" data-cat="ADMIN">Admin</button>
            <button class="badge badge-neutral btn-notif-cat" data-cat="SYSTEM">System</button>
          </div>

          ${notifications.length === 0 ? `
            <div class="solid-card" style="padding: 4rem 1.5rem; text-align: center;">
              <div class="icon-box icon-box-lg icon-box-slate" style="margin: 0 auto 0.75rem;">
                ${icon('bell', { size: 32 })}
              </div>
              <h3 style="font-weight: 800;">You're all caught up!</h3>
              <p style="color: var(--text-muted); font-size: 0.875rem;">No new notifications right now. System updates and job alerts will appear here.</p>
            </div>
          ` : `
            <div style="display: flex; flex-direction: column; gap: 0.75rem;" id="notif-list-container">
              ${notifications.map(n => {
                const targetHash = n.bookingId ? `#/partner/bookings/${n.bookingId}` : (n.link || '#/partner');
                return `
                <div class="solid-card notif-item ${n.isRead ? 'read' : 'unread'}" data-type="${n.type || 'SYSTEM'}" style="padding: 1.25rem; display: flex; justify-content: space-between; align-items: flex-start; border-left: 4px solid ${n.isRead ? '#E5E7EB' : 'var(--brand-emerald)'}; background: ${n.isRead ? '#FFF' : '#F0FDF4'};">
                  <div style="flex: 1; padding-right: 1rem;">
                    <div style="display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.35rem;">
                      ${getNotifIcon(n.type)}
                      <strong style="font-size: 0.95rem; color: var(--text-primary);">${n.title || 'System Notification'}</strong>
                      ${!n.isRead ? `<span class="badge badge-success" style="font-size: 0.65rem;">NEW</span>` : ''}
                    </div>
                    <p style="font-size: 0.875rem; color: var(--text-secondary); margin: 0 0 0.4rem; line-height: 1.4;">
                      ${n.message}
                    </p>
                    <span style="font-size: 0.75rem; color: var(--text-muted); display: inline-flex; align-items: center; gap: 0.3rem;">
                      ${icon('clock', { size: 12 })} ${n.createdAt ? new Date(n.createdAt).toLocaleString() : 'Recent'}
                    </span>
                  </div>

                  <div style="display: flex; gap: 0.4rem; flex-direction: column; align-items: flex-end;">
                    <a href="${targetHash}" class="btn btn-secondary btn-sm" style="font-size: 0.75rem; padding: 0.25rem 0.6rem; font-weight: 700;">
                      OPEN →
                    </a>
                    ${!n.isRead ? `
                      <button class="btn btn-glass btn-sm btn-mark-read" data-id="${n.notificationId}" style="font-size: 0.75rem; padding: 0.25rem 0.6rem; display: inline-flex; align-items: center; gap: 0.3rem;">
                        ${icon('check', { size: 12 })} Mark Read
                      </button>
                    ` : ''}
                  </div>
                </div>
              `;
              }).join("")}
            </div>
          `}

        </div>

        ${renderPartnerMobileBottomNav("/partner/notifications")}
      </div>
    </div>
  `;
}

function getNotifIcon(type) {
  if (type === "PARTNER_ASSIGNED" || type === "NEW_REQUEST") {
    return `<div class="icon-box icon-box-sm icon-box-emerald">${icon('file-text', { size: 14 })}</div>`;
  }
  if (type === "EARNING_CREDITED") {
    return `<div class="icon-box icon-box-sm icon-box-amber">${icon('indian-rupee', { size: 14 })}</div>`;
  }
  if (type === "KYC_APPROVED") {
    return `<div class="icon-box icon-box-sm icon-box-emerald">${icon('badge-check', { size: 14 })}</div>`;
  }
  if (type === "KYC_REJECTED") {
    return `<div class="icon-box icon-box-sm icon-box-rose">${icon('alert-triangle', { size: 14 })}</div>`;
  }
  if (type === "ADMIN_BROADCAST") {
    return `<div class="icon-box icon-box-sm icon-box-sky">${icon('radio', { size: 14 })}</div>`;
  }
  return `<div class="icon-box icon-box-sm icon-box-slate">${icon('bell', { size: 14 })}</div>`;
}

export function attachPartnerNotificationsEvents() {
  attachPartnerNavEvents();

  const user = auth.getCurrentUser();
  if (!user) return;
  const partnerId = user.userId;

  // Category Filtering
  const catButtons = document.querySelectorAll(".btn-notif-cat");
  const notifItems = document.querySelectorAll(".notif-item");
  catButtons.forEach(btn => {
    btn.onclick = () => {
      catButtons.forEach(b => {
        b.classList.remove("active", "badge-success");
        b.classList.add("badge-neutral");
      });
      btn.classList.add("active", "badge-success");
      btn.classList.remove("badge-neutral");

      const cat = btn.getAttribute("data-cat");
      notifItems.forEach(item => {
        const type = (item.getAttribute("data-type") || "").toUpperCase();
        if (cat === "ALL") {
          item.style.display = "";
        } else if (cat === "BOOKING" && (type.includes("BOOKING") || type.includes("ASSIGNED") || type.includes("REQUEST"))) {
          item.style.display = "";
        } else if (cat === "KYC" && type.includes("KYC")) {
          item.style.display = "";
        } else if (cat === "EARNING" && (type.includes("EARNING") || type.includes("PAYOUT"))) {
          item.style.display = "";
        } else if (cat === "SUPPORT" && type.includes("SUPPORT")) {
          item.style.display = "";
        } else if (cat === "ADMIN" && type.includes("ADMIN")) {
          item.style.display = "";
        } else if (cat === "SYSTEM" && (type.includes("SYSTEM") || type === "GENERAL")) {
          item.style.display = "";
        } else {
          item.style.display = "none";
        }
      });
    };
  });

  // Mark single as read
  document.querySelectorAll(".btn-mark-read").forEach(btn => {
    btn.onclick = () => {
      const nId = btn.getAttribute("data-id");
      const snapshot = db.getSnapshot();
      snapshot.notifications = (snapshot.notifications || []).map(n => {
        if (n.notificationId === nId) {
          return { ...n, isRead: true };
        }
        return n;
      });
      db.saveSnapshot(snapshot, "notifications");
      toast.info("Read", "Notification marked as read.");
      window.location.reload();
    };
  });

  // Mark all as read
  const markAllBtn = document.getElementById("btn-partner-mark-all-read");
  if (markAllBtn) {
    markAllBtn.onclick = () => {
      const snapshot = db.getSnapshot();
      snapshot.notifications = (snapshot.notifications || []).map(n => {
        if (n.userId === partnerId || n.userId === "all_partners" || n.userId === "all") {
          return { ...n, isRead: true };
        }
        return n;
      });
      db.saveSnapshot(snapshot, "notifications");
      toast.success("Inbox Updated", "All notifications marked as read.");
      window.location.reload();
    };
  }
}
