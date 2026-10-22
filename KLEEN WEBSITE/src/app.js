/**
 * KLEEN — Master Application Bootstrap & Client-Side Router
 */

import "./config/razorpay-config.js";
import { renderNavbar, attachNavbarEvents } from "./components/navbar.js?v=19";
import { renderFooter, attachFooterEvents } from "./components/footer.js?v=6";
import { renderHomePage, attachHomePageEvents } from "./pages/public/home-page.js?v=16";
import { renderServicesPage, attachServicesPageEvents } from "./pages/public/services-page.js?v=12";
import { renderServiceDetailPage, attachServiceDetailPageEvents } from "./pages/public/service-detail-page.js?v=12";
import {
  renderAboutPage,
  renderHowItWorksPage,
  renderOffersPage,
  renderContactPage,
  renderFaqPage,
  renderNotFoundPage,
  renderAccessDeniedPage,
  attachInfoPagesEvents
} from "./pages/public/info-pages.js";
import {
  renderLoginPage,
  renderRegisterCustomerPage,
  renderForgotPasswordPage,
  attachAuthPagesEvents
} from "./pages/public/auth-pages.js?v=37";
import {
  renderPartnerRecruitmentPage,
  attachPartnerRecruitmentEvents
} from "./pages/public/partner-recruitment-page.js?v=6";

import { renderCustomerView, attachCustomerEvents } from "./pages/customer/customer-view.js";
import { renderCustomerProfilePage, attachCustomerProfileEvents } from "./pages/customer/customer-profile.js";
import { renderCustomerAddressesPage, attachCustomerAddressesEvents } from "./pages/customer/customer-addresses.js";
import { renderCustomerSupportPage, attachCustomerSupportEvents } from "./pages/customer/customer-support.js";
import { renderCustomerNotificationsPage, attachCustomerNotificationsEvents } from "./pages/customer/customer-notifications.js";

// Partner Pages
import {
  renderPartnerLoginPage,
  renderPartnerRegisterPage,
  renderPartnerForgotPasswordPage,
  attachPartnerAuthEvents
} from "./pages/partner/partner-auth.js?v=36";
import { renderPartnerKycPage, attachPartnerKycEvents } from "./pages/partner/partner-kyc.js?v=6";
import { renderPartnerKycStatusPage, attachPartnerKycStatusEvents } from "./pages/partner/partner-kyc-status.js?v=33";
import { renderPartnerDashboardPage, attachPartnerDashboardEvents } from "./pages/partner/partner-dashboard.js?v=33";
import { renderPartnerBookingsPage, attachPartnerBookingsEvents } from "./pages/partner/partner-bookings.js";
import { renderPartnerGigsPage, attachPartnerGigsEvents } from "./pages/partner/partner-gigs.js";
import { renderPartnerEarningsPage, attachPartnerEarningsEvents } from "./pages/partner/partner-earnings.js?v=32";
import { renderPartnerCompletedJobsPage, attachPartnerCompletedJobsEvents } from "./pages/partner/partner-completed-jobs.js";
import { renderPartnerNotificationsPage, attachPartnerNotificationsEvents } from "./pages/partner/partner-notifications.js";
import { renderPartnerProfilePage, attachPartnerProfileEvents } from "./pages/partner/partner-profile.js?v=32";
import { renderPartnerSupportPage, attachPartnerSupportEvents } from "./pages/partner/partner-support.js";
import { renderPartnerSettingsPage, attachPartnerSettingsEvents } from "./pages/partner/partner-settings.js";
import {
  renderPartnerAccountSuspendedPage,
  renderPartnerAccountDeactivatedPage,
  renderPartnerAccessDeniedPage,
  attachPartnerStatusScreensEvents
} from "./pages/partner/partner-status-screens.js";

// Admin Pages
import { renderAdminLoginPage, attachAdminLoginEvents } from "./pages/admin/admin-login.js";
import { renderAdminView, attachAdminEvents } from "./pages/admin/admin-view.js?v=33";

import { auth } from "./services/auth-service.js";
import { authManager } from "./services/auth/auth-manager.js";
import { scrollManager } from "./services/scroll-manager.js?v=2";
import { icon } from "./components/icons.js";

class App {
  constructor() {
    this.appRoot = document.getElementById("app");
    this.currentHash = window.location.hash || "#/";
    this.init();
  }

  init() {
    scrollManager.init();

    window.addEventListener("hashchange", () => {
      this.currentHash = window.location.hash || "#/";
      scrollManager.resetOnRoute();
      this.render();
    });

    auth.subscribe(() => {
      this.render();
    });

    this.render();
  }

  render() {
    if (!this.appRoot) return;

    try {
      const hash = this.currentHash;
      const rawRoute = hash.replace(/^#/, "") || "/";
      const [cleanRoute, queryString] = rawRoute.split("?");

      // Check route permissions
      if (!authManager.canAccessRoute(cleanRoute)) {
        if (cleanRoute.startsWith("/admin")) {
          window.location.hash = "#/admin/login";
          return;
        }
        if (cleanRoute.startsWith("/customer") || cleanRoute === "/bookings") {
          window.location.hash = "#/login";
          return;
        }
        if (cleanRoute.startsWith("/partner")) {
          window.location.hash = "#/partner/access-denied";
          return;
        }
        this.appRoot.innerHTML = `
          ${renderNavbar(hash)}
          <main id="page-container">${renderAccessDeniedPage()}</main>
          ${renderFooter()}
        `;
        attachNavbarEvents();
        attachFooterEvents();
        return;
      }

      // Determine workspace layouts
      const isAdminRoute = cleanRoute.startsWith("/admin") && cleanRoute !== "/admin/login";
      const isPartnerWorkspace = cleanRoute.startsWith("/partner") && 
        cleanRoute !== "/partner/login" && 
        cleanRoute !== "/partner/register" && 
        cleanRoute !== "/partner/forgot-password" && 
        cleanRoute !== "/partner/account-suspended" && 
        cleanRoute !== "/partner/account-deactivated" && 
        cleanRoute !== "/partner/access-denied" &&
        cleanRoute !== "/partner/kyc" &&
        cleanRoute !== "/partner/join";

      // Enforce PRD Section 3 Partner Access Rule
      if (isPartnerWorkspace) {
        const user = auth.getCurrentUser();
        const redirectTarget = authManager.getPartnerRedirectTarget(user, cleanRoute);
        if (redirectTarget && redirectTarget !== cleanRoute) {
          window.location.hash = "#" + redirectTarget;
          return;
        }
      }

      const navHtml = (isAdminRoute || cleanRoute === "/admin/login" || isPartnerWorkspace) ? "" : renderNavbar(cleanRoute);
      const footerHtml = (isAdminRoute || isPartnerWorkspace) ? "" : renderFooter();

      let pageContent = "";
      let attachEventsFn = null;

      // Route matching
      if (cleanRoute === "/" || cleanRoute === "") {
        pageContent = renderHomePage();
        attachEventsFn = attachHomePageEvents;
      } else if (cleanRoute === "/services") {
        pageContent = renderServicesPage();
        attachEventsFn = attachServicesPageEvents;
      } else if (cleanRoute.startsWith("/services/")) {
        const serviceId = cleanRoute.split("/")[2];
        pageContent = renderServiceDetailPage(serviceId);
        attachEventsFn = () => attachServiceDetailPageEvents(serviceId);
      } else if (cleanRoute === "/about") {
        pageContent = renderAboutPage();
      } else if (cleanRoute === "/how-it-works") {
        pageContent = renderHowItWorksPage();
      } else if (cleanRoute === "/offers") {
        pageContent = renderOffersPage();
        attachEventsFn = attachInfoPagesEvents;
      } else if (cleanRoute === "/contact") {
        pageContent = renderContactPage();
        attachEventsFn = attachInfoPagesEvents;
      } else if (cleanRoute === "/faq") {
        pageContent = renderFaqPage();
      } else if (cleanRoute === "/login") {
        pageContent = renderLoginPage();
        attachEventsFn = attachAuthPagesEvents;
      } else if (cleanRoute === "/register") {
        pageContent = renderRegisterCustomerPage();
        attachEventsFn = attachAuthPagesEvents;
      } else if (cleanRoute === "/forgot-password") {
        pageContent = renderForgotPasswordPage();
        attachEventsFn = attachAuthPagesEvents;
      } else if (cleanRoute === "/partner-with-us" || cleanRoute === "/partner/join" || cleanRoute === "/join-partner") {
        pageContent = renderPartnerRecruitmentPage();
        attachEventsFn = attachPartnerRecruitmentEvents;
      }

      // =========================================================================
      // Partner Platform Routes (PRD Section 4 & 5)
      // =========================================================================
      else if (cleanRoute === "/partner/login") {
        pageContent = renderPartnerLoginPage();
        attachEventsFn = attachPartnerAuthEvents;
      } else if (cleanRoute === "/partner/register") {
        pageContent = renderPartnerRegisterPage();
        attachEventsFn = attachPartnerAuthEvents;
      } else if (cleanRoute === "/partner/forgot-password") {
        pageContent = renderPartnerForgotPasswordPage();
        attachEventsFn = attachPartnerAuthEvents;
      } else if (cleanRoute === "/partner/kyc") {
        pageContent = renderPartnerKycPage();
        attachEventsFn = attachPartnerKycEvents;
      } else if (cleanRoute === "/partner/kyc/status") {
        pageContent = renderPartnerKycStatusPage();
        attachEventsFn = attachPartnerKycStatusEvents;
      } else if (cleanRoute === "/partner/dashboard") {
        // Canonical redirect: /partner/dashboard -> /partner
        window.location.hash = "#/partner";
        return;
      } else if (cleanRoute === "/partner") {
        pageContent = renderPartnerDashboardPage();
        attachEventsFn = attachPartnerDashboardEvents;
      } else if (cleanRoute === "/partner/requests") {
        pageContent = renderPartnerBookingsPage("requests");
        attachEventsFn = attachPartnerBookingsEvents;
      } else if (cleanRoute === "/partner/bookings") {
        pageContent = renderPartnerBookingsPage();
        attachEventsFn = attachPartnerBookingsEvents;
      } else if (cleanRoute.startsWith("/partner/bookings/")) {
        const bId = cleanRoute.split("/")[3];
        pageContent = renderPartnerBookingsPage(bId);
        attachEventsFn = attachPartnerBookingsEvents;
      } else if (cleanRoute === "/partner/gigs" || cleanRoute.startsWith("/partner/gigs/")) {
        const tabParam = cleanRoute.split("/")[3] || null;
        pageContent = renderPartnerGigsPage(tabParam);
        attachEventsFn = attachPartnerGigsEvents;
      } else if (cleanRoute === "/partner/schedule" || cleanRoute === "/partner/availability") {
        window.location.hash = "#/partner/gigs";
        return;
      } else if (cleanRoute === "/partner/earnings") {
        pageContent = renderPartnerEarningsPage();
        attachEventsFn = attachPartnerEarningsEvents;
      } else if (cleanRoute === "/partner/completed-jobs") {
        pageContent = renderPartnerCompletedJobsPage();
        attachEventsFn = attachPartnerCompletedJobsEvents;
      } else if (cleanRoute === "/partner/notifications") {
        pageContent = renderPartnerNotificationsPage();
        attachEventsFn = attachPartnerNotificationsEvents;
      } else if (cleanRoute === "/partner/profile") {
        pageContent = renderPartnerProfilePage();
        attachEventsFn = attachPartnerProfileEvents;
      } else if (cleanRoute === "/partner/support") {
        pageContent = renderPartnerSupportPage();
        attachEventsFn = attachPartnerSupportEvents;
      } else if (cleanRoute === "/partner/settings") {
        pageContent = renderPartnerSettingsPage();
        attachEventsFn = attachPartnerSettingsEvents;
      } else if (cleanRoute === "/partner/account-suspended") {
        pageContent = renderPartnerAccountSuspendedPage();
        attachEventsFn = attachPartnerStatusScreensEvents;
      } else if (cleanRoute === "/partner/account-deactivated") {
        pageContent = renderPartnerAccountDeactivatedPage();
        attachEventsFn = attachPartnerStatusScreensEvents;
      } else if (cleanRoute === "/partner/access-denied") {
        pageContent = renderPartnerAccessDeniedPage();
      }

      // Customer Portal Routes
      else if (cleanRoute === "/customer/profile") {
        pageContent = renderCustomerProfilePage();
        attachEventsFn = attachCustomerProfileEvents;
      } else if (cleanRoute === "/customer/addresses") {
        pageContent = renderCustomerAddressesPage();
        attachEventsFn = attachCustomerAddressesEvents;
      } else if (cleanRoute === "/customer/support") {
        pageContent = renderCustomerSupportPage();
        attachEventsFn = attachCustomerSupportEvents;
      } else if (cleanRoute === "/customer/notifications") {
        pageContent = renderCustomerNotificationsPage();
        attachEventsFn = attachCustomerNotificationsEvents;
      } else if (cleanRoute === "/customer" || cleanRoute === "/customer/bookings" || cleanRoute === "/bookings" || cleanRoute === "/customer/view") {
        pageContent = renderCustomerView();
        attachEventsFn = attachCustomerEvents;
      }

      // Admin Routes
      else if (cleanRoute === "/admin/login") {
        pageContent = renderAdminLoginPage();
        attachEventsFn = attachAdminLoginEvents;
      } else if (cleanRoute.startsWith("/admin")) {
        const parts = cleanRoute.split("/");
        const tab = parts[2] || "dashboard";
        pageContent = renderAdminView(tab);
        attachEventsFn = attachAdminEvents;
      } else {
        pageContent = renderNotFoundPage();
      }

      this.appRoot.innerHTML = `
        ${navHtml}
        <main id="page-container">${pageContent}</main>
        ${footerHtml}
      `;

      if (!isAdminRoute && cleanRoute !== "/admin/login" && !isPartnerWorkspace) {
        attachNavbarEvents();
      }

      if (footerHtml) {
        attachFooterEvents();
      }

      if (typeof attachEventsFn === "function") {
        attachEventsFn();
      }

      // Trigger Apple-grade smooth scroll reveal scan on freshly rendered DOM
      setTimeout(() => {
        scrollManager.initPageScrollAnimations(this.appRoot);
      }, 50);
    } catch (err) {
      console.error("Critical rendering error in App.render:", err);
      if (this.appRoot) {
        this.appRoot.innerHTML = `
          <div style="padding: 4rem 1.5rem; max-width: 600px; margin: 2rem auto; font-family: system-ui, sans-serif; background: #FFF; border: 1px solid #E2E8F0; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.06); text-align: center;">
            <div style="display: flex; justify-content: center; margin-bottom: 0.75rem; color: #DC2626;">${icon("alert-triangle", { size: 48, stroke: "#DC2626" })}</div>
            <h2 style="color: #0F172A; margin: 0 0 0.5rem; font-weight: 800;">Page Encountered an Error</h2>
            <p style="color: #64748B; font-size: 0.925rem; margin: 0 0 1.5rem; line-height: 1.5;">${err.message || "An unexpected error occurred while loading this view."}</p>
            <div style="display: flex; gap: 0.75rem; justify-content: center;">
              <a href="#/" class="btn btn-secondary" style="padding: 0.6rem 1.25rem; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Return Home</a>
              <button onclick="window.location.reload()" class="btn btn-primary" style="padding: 0.6rem 1.25rem; background: #0D9488; color: #FFF; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Reload</button>
            </div>
          </div>
        `;
      }
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new App();
  });
} else {
  new App();
}
