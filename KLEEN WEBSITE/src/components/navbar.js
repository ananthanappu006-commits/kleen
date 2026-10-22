/**
 * KLEEN — Navigation Component
 * Liquid-glass sticky header, mobile bottom navigation, and quick role switcher.
 */

import { auth } from "../services/auth-service.js";
import { notificationManager } from "../services/notification/notification-manager.js";
import { getStoredLocation, openLocationPickerModal } from "../services/location-service.js";
import { icon } from "./icons.js";


export function renderNavbar(currentPath = "/") {
  const user = auth.getCurrentUser();
  const role = auth.getRole();
  const notifications = notificationManager.getNotifications(user ? user.userId : null);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const location = getStoredLocation();
  const isPartnerKyc = currentPath.includes("partner/kyc") || (typeof window !== "undefined" && window.location.hash.includes("partner/kyc"));

  let navLinksHtml = "";

  if (isPartnerKyc) {
    // Hide navigation during partner onboarding
    navLinksHtml = "";
  } else {
    navLinksHtml = `
      <a href="#/" class="nav-item ${currentPath === '/' || currentPath === '#/' || currentPath === '' ? 'active' : ''}">Home</a>
      <a href="#/services" class="nav-item ${currentPath.includes('services') ? 'active' : ''}">Services</a>
      <a href="#/partner-with-us" class="nav-item ${currentPath.includes('partner-with-us') ? 'active' : ''}">Partner With Us</a>
      <a href="#/about" class="nav-item ${currentPath.includes('about') ? 'active' : ''}">About</a>
    `;
  }

  let userActionHtml = "";
  if (isPartnerKyc) {
    userActionHtml = user ? `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <div style="display: flex; align-items: center; gap: 0.5rem; background: rgba(20, 92, 71, 0.08); padding: 0.35rem 0.85rem; border-radius: var(--radius-full);">
          <img src="${user.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&q=80'}" alt="Avatar" style="width: 28px; height: 28px; border-radius: 50%; object-fit: cover;">
          <span style="font-size: 0.85rem; font-weight: 600; color: var(--brand-emerald-dark);">${user.fullName ? user.fullName.split(' ')[0] : 'Partner'}</span>
        </div>
        <button id="btn-global-logout" class="btn btn-glass btn-sm" title="Log Out">
          Sign Out
        </button>
      </div>
    ` : `
      <div style="display: flex; align-items: center; gap: 0.75rem;">
        <a href="#/partner/login" class="btn btn-glass btn-sm">Sign In</a>
      </div>
    `;
  } else {
    const cityLabel = (location && location.city && location.city !== "Add Location") ? location.city : "Kochi";

    if (!user) {
      userActionHtml = `
        <div class="mockup-nav-right" style="display: flex; align-items: center; gap: 0.6rem;">
          <!-- Location Picker Pill -->
          <button type="button" class="mockup-nav-loc-btn" id="btn-header-location" title="Select Service City" style="background: transparent; border: none; font-size: 0.9rem; font-weight: 600; color: #334155; display: inline-flex; align-items: center; gap: 0.35rem; cursor: pointer; padding: 0.4rem 0.6rem; border-radius: 9999px; transition: background 0.2s;">
            <span style="display: flex; align-items: center; color: #64748B;">
              ${icon("map-pin", { size: 15, stroke: "#64748B", strokeWidth: 2 })}
            </span>
            <span id="nav-location-text-display">${cityLabel}</span>
            <span style="display: flex; align-items: center; color: #64748B;">
              ${icon("chevron-down", { size: 13, stroke: "#64748B", strokeWidth: 2 })}
            </span>
          </button>

          <!-- My Bookings Button (Desktop Only) -->
          <a href="#/bookings" id="nav-btn-my-bookings" class="mockup-nav-bookings-btn desktop-only-action" style="display: inline-flex; align-items: center; gap: 0.5rem; background: #FFFFFF; border: 1.5px solid #CBD5E1; color: #334155; padding: 0.45rem 1rem; border-radius: 9999px; font-weight: 600; font-size: 0.85rem; text-decoration: none; box-shadow: 0 1px 3px rgba(0,0,0,0.03); transition: all 0.2s ease;">
            <span style="display: flex; align-items: center; color: #10B981;">
              ${icon("calendar", { size: 15, stroke: "#10B981", strokeWidth: 2 })}
            </span>
            <span>My Bookings</span>
          </a>

          <!-- Sign In Button (Desktop Only) -->
          <a href="#/login" class="btn btn-glass btn-sm desktop-only-action" id="nav-btn-signin" style="font-weight: 600; font-size: 0.85rem; padding: 0.45rem 1rem; border-radius: 9999px; text-decoration: none; color: var(--text-primary);">
            Sign In
          </a>

          <!-- Register Button (Desktop Only) -->
          <a href="#/register" class="btn btn-primary btn-sm desktop-only-action" id="nav-btn-signup" style="font-weight: 700; font-size: 0.85rem; padding: 0.45rem 1.1rem; border-radius: 9999px; text-decoration: none; box-shadow: 0 2px 8px rgba(15, 76, 58, 0.2);">
            Sign Up
          </a>

          <!-- Mobile Menu Hamburger Button -->
          <button type="button" id="btn-mobile-nav-toggle" class="mobile-nav-toggle" aria-label="Open Navigation Menu" title="Open Menu">
            ${icon("menu", { size: 24, stroke: "#0F4C3A" })}
          </button>
        </div>
      `;
    } else {
      userActionHtml = `
        <div class="mockup-nav-right" style="display: flex; align-items: center; gap: 0.6rem;">
          <!-- Location Picker Pill -->
          <button type="button" class="mockup-nav-loc-btn" id="btn-header-location" title="Select Service City" style="background: transparent; border: none; font-size: 0.9rem; font-weight: 600; color: #334155; display: inline-flex; align-items: center; gap: 0.35rem; cursor: pointer; padding: 0.4rem 0.6rem; border-radius: 9999px; transition: background 0.2s;">
            <span style="display: flex; align-items: center; color: #64748B;">
              ${icon("map-pin", { size: 15, stroke: "#64748B", strokeWidth: 2 })}
            </span>
            <span id="nav-location-text-display">${cityLabel}</span>
            <span style="display: flex; align-items: center; color: #64748B;">
              ${icon("chevron-down", { size: 13, stroke: "#64748B", strokeWidth: 2 })}
            </span>
          </button>

          ${user.role === "customer" ? `
            <!-- My Bookings Button (Desktop Only) -->
            <a href="#/bookings" id="nav-btn-my-bookings" class="mockup-nav-bookings-btn desktop-only-action" style="display: inline-flex; align-items: center; gap: 0.5rem; background: #FFFFFF; border: 1.5px solid #CBD5E1; color: #334155; padding: 0.45rem 1rem; border-radius: 9999px; font-weight: 600; font-size: 0.85rem; text-decoration: none; box-shadow: 0 1px 3px rgba(0,0,0,0.03); transition: all 0.2s ease;">
              <span style="display: flex; align-items: center; color: #10B981;">
                ${icon("calendar", { size: 15, stroke: "#10B981", strokeWidth: 2 })}
              </span>
              <span>My Bookings</span>
            </a>

            <!-- Customer Avatar / Profile -->
            <a href="#/customer/profile" id="nav-btn-user-avatar" title="${user.fullName || 'Your Profile'}" style="display: flex; align-items: center; gap: 0.5rem; background: rgba(20, 92, 71, 0.08); padding: 0.3rem 0.75rem 0.3rem 0.35rem; border-radius: 9999px; text-decoration: none; border: 1.5px solid rgba(20, 92, 71, 0.15);">
              <div style="width: 28px; height: 28px; border-radius: 50%; overflow: hidden; background: var(--brand-emerald); color: white; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 700;">
                ${user.profileImage ? `<img src="${user.profileImage}" style="width: 100%; height: 100%; object-fit: cover;">` : (user.fullName ? user.fullName[0].toUpperCase() : "C")}
              </div>
              <span style="font-size: 0.825rem; font-weight: 600; color: var(--brand-emerald-dark); max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${user.fullName ? user.fullName.split(' ')[0] : 'Account'}
              </span>
            </a>
          ` : (user.role === "admin" ? `
            <a href="#/admin" class="badge badge-warning" style="text-decoration: none; font-size: 0.8rem; padding: 0.4rem 0.8rem;">
              Admin Portal →
            </a>
          ` : `
            <span style="font-size: 0.825rem; font-weight: 600; color: var(--brand-emerald-dark);">${user.fullName ? user.fullName.split(' ')[0] : 'Partner'}</span>
          `)}

          <!-- Sign Out Button (Desktop Only) -->
          <button id="btn-global-logout" class="btn btn-glass btn-sm desktop-only-action" title="Sign Out" style="font-size: 0.775rem; padding: 0.35rem 0.7rem; border-radius: 9999px;">
            Sign Out
          </button>

          <!-- Mobile Menu Hamburger Button -->
          <button type="button" id="btn-mobile-nav-toggle" class="mobile-nav-toggle" aria-label="Open Navigation Menu" title="Open Menu">
            ${icon("menu", { size: 24, stroke: "#0F4C3A" })}
          </button>
        </div>
      `;
    }
  }

  const cityLabel = (location && location.city && location.city !== "Add Location") ? location.city : "Kochi";

  return `
    <header class="glass-nav transparent-nav" id="main-header" style="position: sticky; top: 0; z-index: 900; background: transparent; backdrop-filter: none; -webkit-backdrop-filter: none; border-bottom: 1px solid transparent; box-shadow: none; transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);">
      <div class="app-container" style="display: flex; align-items: center; justify-content: space-between; height: 74px;">
        <!-- Logo -->
        <div style="display: flex; align-items: center; gap: 1.25rem;">
          <a href="#/" class="navbar-brand-link" style="display: flex; align-items: center; text-decoration: none;">
            <img src="assets/kleen-logo.png" alt="KLEEN" style="height: 42px; width: auto; max-width: 165px; object-fit: contain; display: block;" />
          </a>
        </div>

        <!-- Center Desktop Navigation Links -->
        <nav class="desktop-nav">
          ${navLinksHtml}
        </nav>

        <!-- Right Utility Actions -->
        <div class="user-action-box">
          ${userActionHtml}
        </div>
      </div>
    </header>

    <!-- Mobile Slide-Out Drawer Backdrop -->
    <div id="mobile-nav-backdrop" class="mobile-nav-backdrop"></div>

    <!-- Mobile Slide-Out Drawer -->
    <aside id="mobile-nav-drawer" class="mobile-nav-drawer" aria-label="Mobile Navigation">
      <div class="mobile-drawer-header">
        <a href="#/" class="mobile-drawer-logo">
          <img src="assets/kleen-logo.png" alt="KLEEN" style="height: 36px; width: auto; max-width: 140px; object-fit: contain;" />
        </a>
        <button type="button" id="btn-mobile-drawer-close" class="mobile-drawer-close" aria-label="Close Navigation">
          ${icon("x", { size: 20, stroke: "#334155" })}
        </button>
      </div>

      <!-- User or Guest Banner -->
      <div class="mobile-drawer-user-card">
        ${user ? `
          <div class="mobile-drawer-user-info">
            <div class="mobile-drawer-avatar">
              ${user.profileImage ? `<img src="${user.profileImage}" alt="${user.fullName}">` : (user.fullName ? user.fullName[0].toUpperCase() : "U")}
            </div>
            <div>
              <div class="mobile-drawer-user-name">${user.fullName || "User"}</div>
              <div class="mobile-drawer-user-role">${user.role === 'admin' ? 'Administrator' : (user.role === 'partner' ? 'Service Partner' : 'Customer Account')}</div>
            </div>
          </div>
          <a href="${user.role === 'customer' ? '#/customer/profile' : (user.role === 'partner' ? '#/partner/dashboard' : '#/admin')}" class="btn btn-secondary btn-sm mobile-drawer-view-profile">
            ${icon("user", { size: 14 })}
            <span>Manage Account</span>
          </a>
        ` : `
          <div class="mobile-drawer-guest">
            <div class="mobile-drawer-guest-title">Welcome to KLEEN</div>
            <div class="mobile-drawer-guest-sub">Book verified domestic helpers & deep cleaning in seconds.</div>
            <div class="mobile-drawer-guest-actions">
              <a href="#/login" class="btn btn-secondary btn-sm mobile-drawer-btn">Sign In</a>
              <a href="#/register" class="btn btn-primary btn-sm mobile-drawer-btn">Sign Up</a>
            </div>
          </div>
        `}
      </div>

      <!-- Service Location Selector in Drawer -->
      <div class="mobile-drawer-location-box">
        <div class="mobile-drawer-location-label">Service City</div>
        <button type="button" id="btn-drawer-location" class="mobile-drawer-location-btn">
          <span style="display: flex; align-items: center; color: #0E9F6E;">${icon("map-pin", { size: 16 })}</span>
          <span id="drawer-location-text-display">${cityLabel}</span>
          <span style="margin-left: auto; color: #64748B;">${icon("chevron-right", { size: 14 })}</span>
        </button>
      </div>

      <!-- Drawer Nav Links -->
      <nav class="mobile-drawer-nav">
        <a href="#/" class="mobile-drawer-link ${(currentPath === '/' || currentPath === '' || currentPath === '#/') ? 'active' : ''}">
          <span class="mobile-drawer-link-icon">${icon("home", { size: 18 })}</span>
          <span>Home</span>
        </a>
        <a href="#/services" class="mobile-drawer-link ${currentPath.includes('services') ? 'active' : ''}">
          <span class="mobile-drawer-link-icon">${icon("grid", { size: 18 })}</span>
          <span>Browse Services</span>
        </a>
        <a href="#/bookings" class="mobile-drawer-link ${currentPath.includes('bookings') ? 'active' : ''}">
          <span class="mobile-drawer-link-icon">${icon("calendar", { size: 18 })}</span>
          <span>My Bookings</span>
        </a>
        <a href="#/partner-with-us" class="mobile-drawer-link ${currentPath.includes('partner-with-us') ? 'active' : ''}">
          <span class="mobile-drawer-link-icon">${icon("briefcase", { size: 18 })}</span>
          <span>Partner With Us</span>
        </a>
        <a href="#/about" class="mobile-drawer-link ${currentPath.includes('about') ? 'active' : ''}">
          <span class="mobile-drawer-link-icon">${icon("info", { size: 18 })}</span>
          <span>About KLEEN</span>
        </a>
        <a href="#/how-it-works" class="mobile-drawer-link ${currentPath.includes('how-it-works') ? 'active' : ''}">
          <span class="mobile-drawer-link-icon">${icon("check-circle", { size: 18 })}</span>
          <span>How It Works</span>
        </a>
        <a href="#/offers" class="mobile-drawer-link ${currentPath.includes('offers') ? 'active' : ''}">
          <span class="mobile-drawer-link-icon">${icon("tag", { size: 18 })}</span>
          <span>Offers & Discounts</span>
        </a>
        <a href="#/faq" class="mobile-drawer-link ${currentPath.includes('faq') ? 'active' : ''}">
          <span class="mobile-drawer-link-icon">${icon("help-circle", { size: 18 })}</span>
          <span>Help & FAQs</span>
        </a>
        <a href="#/contact" class="mobile-drawer-link ${currentPath.includes('contact') ? 'active' : ''}">
          <span class="mobile-drawer-link-icon">${icon("phone", { size: 18 })}</span>
          <span>Contact Us</span>
        </a>
      </nav>

      <!-- Drawer Footer -->
      <div class="mobile-drawer-footer">
        ${user ? `
          <button type="button" id="btn-drawer-logout" class="btn btn-secondary btn-sm mobile-drawer-logout-btn">
            ${icon("log-out", { size: 16 })}
            <span>Sign Out</span>
          </button>
        ` : ''}
        <div class="mobile-drawer-version">KLEEN v2.4 • Verified Home Care Platform</div>
      </div>
    </aside>

    <!-- Fixed Mobile Bottom Navigation Bar (Shown on <= 768px) -->
    ${!isPartnerKyc ? `
      <nav class="mobile-bottom-nav" id="mobile-bottom-nav" aria-label="Quick Mobile Navigation">
        <a href="#/" class="bottom-nav-item ${(currentPath === '/' || currentPath === '' || currentPath === '#/') ? 'active' : ''}">
          <span class="bottom-nav-icon">${icon("home", { size: 20 })}</span>
          <span class="bottom-nav-label">Home</span>
        </a>
        <a href="#/services" class="bottom-nav-item ${currentPath.includes('services') ? 'active' : ''}">
          <span class="bottom-nav-icon">${icon("grid", { size: 20 })}</span>
          <span class="bottom-nav-label">Services</span>
        </a>
        <a href="#/bookings" class="bottom-nav-item ${currentPath.includes('bookings') ? 'active' : ''}">
          <span class="bottom-nav-icon">${icon("calendar", { size: 20 })}</span>
          <span class="bottom-nav-label">Bookings</span>
        </a>
        <a href="${user ? (user.role === 'customer' ? '#/customer/profile' : (user.role === 'partner' ? '#/partner/dashboard' : '#/admin')) : '#/login'}" class="bottom-nav-item ${(currentPath.includes('customer') || currentPath.includes('login') || currentPath.includes('register')) ? 'active' : ''}">
          <span class="bottom-nav-icon">${icon("user", { size: 20 })}</span>
          <span class="bottom-nav-label">${user ? 'Account' : 'Sign In'}</span>
        </a>
      </nav>
    ` : ''}
  `;
}

export function attachNavbarEvents() {
  // Transparent top navbar with smooth frosted blur on scroll
  const header = document.getElementById("main-header");
  if (header) {
    const handleScroll = () => {
      if (window.scrollY > 25) {
        header.classList.add("scrolled");
      } else {
        header.classList.remove("scrolled");
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
  }

  // Mobile Drawer Toggle handlers
  const drawer = document.getElementById("mobile-nav-drawer");
  const backdrop = document.getElementById("mobile-nav-backdrop");
  const toggleBtn = document.getElementById("btn-mobile-nav-toggle");
  const closeBtn = document.getElementById("btn-mobile-drawer-close");

  const openDrawer = () => {
    if (drawer) drawer.classList.add("open");
    if (backdrop) backdrop.classList.add("open");
    document.body.style.overflow = "hidden";
  };

  const closeDrawer = () => {
    if (drawer) drawer.classList.remove("open");
    if (backdrop) backdrop.classList.remove("open");
    document.body.style.overflow = "";
  };

  if (toggleBtn) {
    toggleBtn.onclick = (e) => {
      e.stopPropagation();
      openDrawer();
    };
  }

  if (closeBtn) {
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      closeDrawer();
    };
  }

  if (backdrop) {
    backdrop.onclick = () => {
      closeDrawer();
    };
  }

  // Close drawer when any link inside it is clicked
  if (drawer) {
    drawer.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        closeDrawer();
      });
    });
  }

  // Close drawer on ESC key
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer && drawer.classList.contains("open")) {
      closeDrawer();
    }
  });

  const logoutBtn = document.getElementById("btn-global-logout");
  if (logoutBtn) {
    logoutBtn.onclick = () => {
      auth.logout();
      window.location.hash = "#/";
    };
  }

  const drawerLogoutBtn = document.getElementById("btn-drawer-logout");
  if (drawerLogoutBtn) {
    drawerLogoutBtn.onclick = () => {
      closeDrawer();
      auth.logout();
      window.location.hash = "#/";
    };
  }

  const locationBtn = document.getElementById("btn-header-location");
  if (locationBtn) {
    locationBtn.onclick = () => {
      openLocationPickerModal((newLoc) => {
        updateNavbarLocationUI(newLoc);
      });
    };
  }

  const drawerLocationBtn = document.getElementById("btn-drawer-location");
  if (drawerLocationBtn) {
    drawerLocationBtn.onclick = () => {
      closeDrawer();
      openLocationPickerModal((newLoc) => {
        updateNavbarLocationUI(newLoc);
      });
    };
  }

  // Listen for global location changes
  window.addEventListener("kleen:location-changed", (e) => {
    if (e.detail) {
      updateNavbarLocationUI(e.detail);
    }
  });
}

function updateNavbarLocationUI(loc) {
  const isDefault = !loc || !loc.address || loc.address === "Add Location" || loc.isPrompt;
  const label = isDefault
    ? "Add Location"
    : (loc.area ? `${loc.area}${loc.city ? ', ' + loc.city : ''}` : (loc.city || loc.address));

  const textEl = document.getElementById("nav-location-text-display");
  if (textEl) {
    textEl.textContent = label;
  }
  const drawerTextEl = document.getElementById("drawer-location-text-display");
  if (drawerTextEl) {
    drawerTextEl.textContent = label;
  }
}


