/**
 * KLEEN — Shared Partner Navigation Component (Sidebar, Header & Mobile Bottom Bar)
 */

import { auth } from "../../services/auth-service.js";
import { db } from "../../services/db-service.js";
import { modal } from "../../components/modal.js";
import { toast } from "../../components/toast.js";
import { icon } from "../../components/icons.js";

export function renderPartnerHeader(currentRoute, partner) {
  const isOnline = partner && partner.isOnline;
  const isKycApproved = partner && partner.kycStatus === "APPROVED" && partner.accountStatus === "ACTIVE";
  const notifications = db.getNotifications(partner ? (partner.partnerId || partner.userId) : null);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return `
    <header class="partner-top-header">
      <div class="partner-header-left">
        <a href="#/partner" class="brand-logo" style="text-decoration: none; font-size: 1.35rem; display: flex; align-items: center; gap: 0.5rem;">
          <img src="assets/kleen-logo.png" alt="kleen" style="height: 36px; mix-blend-mode: multiply;">
          <span class="badge badge-success" style="font-size: 0.65rem; vertical-align: middle;">PARTNER</span>
        </a>
      </div>

      <div class="partner-header-right">
        <!-- Online/Offline Status Pill -->
        <div class="partner-online-chip ${isOnline ? 'online' : (isKycApproved ? 'offline' : 'locked')}" id="btn-header-toggle-online" title="${isKycApproved ? 'Click to toggle Gig readiness' : 'KYC Pending Admin Approval — Cannot go online'}" style="${!isKycApproved ? 'opacity: 0.8; cursor: not-allowed; border-color: #FCD34D;' : ''}">
          <span class="status-dot"></span>
          <span class="status-label">${isOnline ? 'ONLINE • READY FOR GIGS' : (isKycApproved ? 'OFFLINE' : 'OFFLINE (KYC PENDING)')}</span>
        </div>

        <!-- Notification Bell -->
        <a href="#/partner/notifications" class="partner-icon-btn" title="Notifications" style="display: flex; align-items: center; justify-content: center;">
          ${icon("bell", { size: 18, stroke: "var(--brand-emerald-dark)" })}
          ${unreadCount > 0 ? `<span class="badge-count">${unreadCount}</span>` : ''}
        </a>

        <!-- Partner User Menu & Profile Dropdown -->
        <div class="partner-profile-menu-wrapper" style="position: relative;">
          <button type="button" id="btn-partner-profile-menu-toggle" class="partner-profile-pill" style="background: rgba(255, 255, 255, 0.65); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border: 1px solid rgba(255, 255, 255, 0.9); box-shadow: 0 2px 10px rgba(0,0,0,0.03), inset 0 1px 1px #FFFFFF; cursor: pointer; display: flex; align-items: center; gap: 0.6rem; padding: 0.35rem 0.85rem; border-radius: 9999px; transition: all 0.2s ease;">
            <img src="${partner.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}" alt="${partner && partner.fullName ? partner.fullName.split(' ')[0] : 'Partner'}" class="partner-avatar-img" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
            <div class="partner-info-text" style="text-align: left;">
              <span class="partner-name" style="font-weight: 700; font-size: 0.85rem; color: var(--text-primary); display: block;">${partner && partner.fullName ? partner.fullName.split(' ')[0] : 'Partner'}</span>
              <span class="partner-rating" style="display: flex; align-items: center; gap: 0.25rem; font-size: 0.725rem; color: var(--text-muted);">${icon("star", { size: 11, fill: "#F59E0B", stroke: "#F59E0B" })} ${partner.rating ? partner.rating.toFixed(1) : '5.0'} (${partner.totalCompletedJobs || 0})</span>
            </div>
            <span style="display: flex; align-items: center; margin-left: 0.2rem;">${icon("chevron-down", { size: 13, stroke: "var(--text-muted)" })}</span>
          </button>

          <!-- Profile Menu Dropdown -->
          <div id="partner-profile-dropdown" style="display: none; position: absolute; right: 0; top: calc(100% + 8px); width: 220px; background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(24px) saturate(200%); -webkit-backdrop-filter: blur(24px) saturate(200%); border-radius: 14px; box-shadow: 0 16px 40px rgba(6, 78, 59, 0.12), inset 0 1px 1.5px #FFFFFF; border: 1px solid rgba(255, 255, 255, 0.95); padding: 0.5rem; z-index: 1000;">
            <a href="#/partner/profile" class="partner-dropdown-item" style="display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 0.85rem; border-radius: 8px; text-decoration: none; color: var(--text-primary); font-size: 0.875rem; font-weight: 600; transition: background 0.15s;" onmouseover="this.style.background='#F0FDF4'" onmouseout="this.style.background='transparent'">
              ${icon("user", { size: 16, stroke: "var(--brand-emerald-dark)" })} Profile
            </a>
            <button type="button" id="btn-nav-change-bank" class="partner-dropdown-item" style="width: 100%; border: none; background: transparent; cursor: pointer; text-align: left; display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 0.85rem; border-radius: 8px; color: var(--text-primary); font-size: 0.875rem; font-weight: 600; transition: background 0.15s;" onmouseover="this.style.background='#F0FDF4'" onmouseout="this.style.background='transparent'">
              ${icon("bank", { size: 16, stroke: "var(--brand-emerald-dark)" })} Change Bank Details
            </button>
            <a href="#/partner/settings" class="partner-dropdown-item" style="display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 0.85rem; border-radius: 8px; text-decoration: none; color: var(--text-primary); font-size: 0.875rem; font-weight: 600; transition: background 0.15s;" onmouseover="this.style.background='#F0FDF4'" onmouseout="this.style.background='transparent'">
              ${icon("lock", { size: 16, stroke: "var(--brand-emerald-dark)" })} Settings
            </a>
            <a href="#/partner/support" class="partner-dropdown-item" style="display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 0.85rem; border-radius: 8px; text-decoration: none; color: var(--text-primary); font-size: 0.875rem; font-weight: 600; transition: background 0.15s;" onmouseover="this.style.background='#F0FDF4'" onmouseout="this.style.background='transparent'">
              ${icon("headphones", { size: 16, stroke: "var(--brand-emerald-dark)" })} Support
            </a>
            <div style="height: 1px; background: rgba(0,0,0,0.06); margin: 0.4rem 0;"></div>
            <button type="button" class="btn-partner-trigger-logout" style="width: 100%; display: flex; align-items: center; gap: 0.6rem; padding: 0.6rem 0.85rem; border-radius: 8px; border: none; background: transparent; color: #EF4444; font-size: 0.875rem; font-weight: 600; cursor: pointer; text-align: left; transition: background 0.15s;" onmouseover="this.style.background='#FEF2F2'" onmouseout="this.style.background='transparent'">
              ${icon("log-out", { size: 16, stroke: "#EF4444" })} Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  `;
}

export function renderPartnerSidebar(currentRoute) {
  const items = [
    { label: "Home", route: "/partner", iconName: "home" },
    { label: "Gigs", route: "/partner/gigs", iconName: "calendar" },
    { label: "Booking Requests", route: "/partner/requests", iconName: "file-text" },
    { label: "My Bookings", route: "/partner/bookings", iconName: "broom" },
    { label: "Earnings", route: "/partner/earnings", iconName: "wallet" },
    { label: "Completed Jobs", route: "/partner/completed-jobs", iconName: "check-circle" },
    { label: "Notifications", route: "/partner/notifications", iconName: "bell" },
    { label: "Support", route: "/partner/support", iconName: "headphones" },
    { label: "Profile", route: "/partner/profile", iconName: "user" },
    { label: "Settings", route: "/partner/settings", iconName: "lock" }
  ];

  return `
    <aside class="partner-sidebar">
      <div class="sidebar-section-title">PARTNER WORKSPACE</div>
      <nav class="partner-nav-list">
        ${items.map(item => {
          const isActive = currentRoute === item.route || (item.route === "/partner" && (currentRoute === "/partner" || currentRoute === "/partner/dashboard"));
          return `
            <a href="#${item.route}" class="partner-nav-item ${isActive ? 'active' : ''}">
              <span class="nav-icon" style="display: flex; align-items: center;">${icon(item.iconName, { size: 18, stroke: isActive ? "var(--brand-emerald-dark)" : "currentColor" })}</span>
              <span class="nav-text">${item.label}</span>
              ${item.route === "/partner/gigs" ? `<span class="badge badge-success" style="margin-left: auto; font-size: 0.65rem; padding: 0.15rem 0.45rem;">NEW</span>` : ""}
            </a>
          `;
        }).join("")}
      </nav>

      <div class="sidebar-footer">
        <button class="btn btn-glass btn-sm btn-partner-trigger-logout" style="width: 100%; justify-content: center; color: var(--color-danger); gap: 0.5rem;">
          ${icon("log-out", { size: 16, stroke: "var(--color-danger)" })} Logout
        </button>
      </div>
    </aside>
  `;
}

export function renderPartnerMobileBottomNav(currentRoute) {
  const tabs = [
    { label: "Home", route: "/partner", iconName: "home" },
    { label: "Gigs", route: "/partner/gigs", iconName: "calendar" },
    { label: "Requests", route: "/partner/requests", iconName: "file-text" },
    { label: "Earnings", route: "/partner/earnings", iconName: "wallet" },
    { label: "Profile", route: "/partner/profile", iconName: "user" }
  ];

  return `
    <nav class="partner-bottom-nav">
      ${tabs.map(tab => {
        const isActive = currentRoute === tab.route || (tab.route === "/partner" && (currentRoute === "/partner" || currentRoute === "/partner/dashboard"));
        return `
          <a href="#${tab.route}" class="partner-bottom-item ${isActive ? 'active' : ''}">
            <span class="bottom-icon" style="display: flex; align-items: center; justify-content: center;">${icon(tab.iconName, { size: 18, stroke: isActive ? "var(--brand-emerald)" : "currentColor" })}</span>
            <span class="bottom-label">${tab.label}</span>
          </a>
        `;
      }).join("")}
      <button type="button" class="partner-bottom-item" id="btn-partner-mobile-more" style="background:none; border:none; cursor:pointer;">
        <span class="bottom-icon" style="display: flex; align-items: center; justify-content: center;">${icon("menu", { size: 18, stroke: "currentColor" })}</span>
        <span class="bottom-label">More</span>
      </button>
    </nav>
  `;
}

export function attachPartnerNavEvents() {
  // Profile dropdown menu toggle
  const profileMenuToggle = document.getElementById("btn-partner-profile-menu-toggle");
  const profileDropdown = document.getElementById("partner-profile-dropdown");
  if (profileMenuToggle && profileDropdown) {
    profileMenuToggle.onclick = (e) => {
      e.stopPropagation();
      const isVisible = profileDropdown.style.display === "block";
      profileDropdown.style.display = isVisible ? "none" : "block";
    };

    document.addEventListener("click", (e) => {
      if (!e.target.closest(".partner-profile-menu-wrapper")) {
        profileDropdown.style.display = "none";
      }
    });
  }

  // Change Bank Details from Profile Dropdown
  const changeBankBtn = document.getElementById("btn-nav-change-bank");
  if (changeBankBtn) {
    changeBankBtn.onclick = async () => {
      if (profileDropdown) profileDropdown.style.display = "none";
      const user = auth.getCurrentUser();
      const partnerId = user ? (user.partnerId || user.userId) : null;
      try {
        const { openBankDetailsModal } = await import("./partner-earnings.js");
        openBankDetailsModal(partnerId);
      } catch (err) {
        console.error("Error opening bank modal:", err);
      }
    };
  }

  const toggleOnline = document.getElementById("btn-header-toggle-online");
  if (toggleOnline) {
    toggleOnline.onclick = () => {
      const user = auth.getCurrentUser();
      if (!user) return;
      const partner = db.getPartnerById(user.userId) || user;
      const isApproved = partner && partner.kycStatus === "APPROVED" && partner.accountStatus === "ACTIVE";

      if (!isApproved && !partner.isOnline) {
        toast.error(
          "Action Blocked: KYC Not Approved",
          "Your KYC application must be approved by an administrator before you can go online."
        );
        return;
      }

      const nextState = !partner.isOnline;
      try {
        db.updatePartnerAvailability(partner.partnerId || user.userId, nextState);
        toast.success(
          nextState ? "You Are Now Online" : "You Are Now Offline",
          nextState ? "Eligible to receive nearby customer booking requests." : "Booking dispatch paused until you go back online."
        );
        window.location.reload();
      } catch (err) {
        toast.error("Availability Notice", err.message || "Cannot change online status.");
      }
    };
  }

  // Logout with confirmation modal per PRD Section 28
  document.querySelectorAll(".btn-partner-trigger-logout").forEach(btn => {
    btn.onclick = () => {
      modal.open({
        title: "Confirm Logout",
        maxWidth: "400px",
        bodyHtml: `
          <p style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.5rem;">
            Are you sure you want to log out of your partner portal?
          </p>
        `,
        footerHtml: `
          <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">CANCEL</button>
          <button class="btn btn-danger btn-sm" id="btn-confirm-partner-logout">LOGOUT</button>
        `,
        onOpen: (container) => {
          container.querySelector("#btn-confirm-partner-logout").onclick = () => {
            modal.close();
            auth.logout();
            toast.info("Logged Out", "You have safely signed out of your partner portal.");
            window.location.hash = "#/partner/login";
          };
        }
      });
    };
  });

  // Mobile More menu drawer
  const moreBtn = document.getElementById("btn-partner-mobile-more");
  if (moreBtn) {
    moreBtn.onclick = () => {
      modal.open({
        title: "More Options",
        maxWidth: "340px",
        bodyHtml: `
          <div style="display: flex; flex-direction: column; gap: 0.65rem; padding: 0.5rem 0;">
            <a href="#/partner/gigs" class="btn btn-secondary btn-md" style="justify-content: flex-start; display: inline-flex; align-items: center; gap: 0.65rem;" onclick="document.querySelector('.modal-close').click()">
              ${icon("calendar", { size: 18, stroke: "var(--brand-emerald-dark)" })}
              <span>Gigs (Work Slots)</span>
            </a>
            <a href="#/partner/bookings" class="btn btn-secondary btn-md" style="justify-content: flex-start; display: inline-flex; align-items: center; gap: 0.65rem;" onclick="document.querySelector('.modal-close').click()">
              ${icon("broom", { size: 18, stroke: "var(--brand-emerald-dark)" })}
              <span>My Bookings</span>
            </a>
            <a href="#/partner/completed-jobs" class="btn btn-secondary btn-md" style="justify-content: flex-start; display: inline-flex; align-items: center; gap: 0.65rem;" onclick="document.querySelector('.modal-close').click()">
              ${icon("check-circle", { size: 18, stroke: "var(--brand-emerald-dark)" })}
              <span>Completed Jobs</span>
            </a>
            <button type="button" id="btn-mobile-change-bank" class="btn btn-secondary btn-md" style="justify-content: flex-start; display: inline-flex; align-items: center; gap: 0.65rem;">
              ${icon("bank", { size: 18, stroke: "var(--brand-emerald-dark)" })}
              <span>Change Bank Details</span>
            </button>
            <a href="#/partner/notifications" class="btn btn-secondary btn-md" style="justify-content: flex-start; display: inline-flex; align-items: center; gap: 0.65rem;" onclick="document.querySelector('.modal-close').click()">
              ${icon("bell", { size: 18, stroke: "var(--brand-emerald-dark)" })}
              <span>Notifications</span>
            </a>
            <a href="#/partner/support" class="btn btn-secondary btn-md" style="justify-content: flex-start; display: inline-flex; align-items: center; gap: 0.65rem;" onclick="document.querySelector('.modal-close').click()">
              ${icon("headphones", { size: 18, stroke: "var(--brand-emerald-dark)" })}
              <span>Support</span>
            </a>
            <a href="#/partner/settings" class="btn btn-secondary btn-md" style="justify-content: flex-start; display: inline-flex; align-items: center; gap: 0.65rem;" onclick="document.querySelector('.modal-close').click()">
              ${icon("lock", { size: 18, stroke: "var(--brand-emerald-dark)" })}
              <span>Settings</span>
            </a>
            <button type="button" class="btn btn-danger btn-md btn-partner-trigger-logout" style="justify-content: flex-start; display: inline-flex; align-items: center; gap: 0.65rem;" onclick="document.querySelector('.modal-close').click()">
              ${icon("log-out", { size: 18, stroke: "#FFFFFF" })}
              <span>Logout</span>
            </button>
          </div>
        `,
        onOpen: (container) => {
          const mobileBankBtn = container.querySelector("#btn-mobile-change-bank");
          if (mobileBankBtn) {
            mobileBankBtn.onclick = async () => {
              modal.close();
              const user = auth.getCurrentUser();
              const partnerId = user ? (user.partnerId || user.userId) : null;
              try {
                const { openBankDetailsModal } = await import("./partner-earnings.js");
                openBankDetailsModal(partnerId);
              } catch (err) {
                console.error("Error opening bank modal:", err);
              }
            };
          }
        }
      });
    };
  }
}
