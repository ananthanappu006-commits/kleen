/**
 * KLEEN — Smooth Scroll & Scroll-Driven Reveal Animation Engine
 * 
 * Features:
 * 1. 100% Native, unhijacked fluid scrolling with OS hardware acceleration.
 * 2. Ultra-smooth IntersectionObserver scroll-driven reveal transitions (Apple-grade bezier).
 * 3. Dynamic cascade staggering for grids, cards, and sections.
 * 4. Above-the-fold instant & gentle visibility to prevent layout flickering.
 * 5. Native smooth scroll anchor targeting for in-page navigation.
 */

class ScrollManager {
  constructor() {
    this.isInitialized = false;
    this.observer = null;

    // Respect reduced motion preference
    this.prefersReducedMotion = typeof window !== "undefined" && (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  init() {
    if (this.isInitialized || typeof window === "undefined") return;
    this.isInitialized = true;

    this.initObserver();
    this.initPageScrollAnimations();
  }

  /**
   * Initializes the shared IntersectionObserver with smooth view-detection margin
   */
  initObserver() {
    if (this.observer) {
      this.observer.disconnect();
    }

    const options = {
      root: null,
      rootMargin: "0px 0px -40px 0px", // triggers gracefully right as item approaches viewport
      threshold: 0.06
    };

    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target;
          target.classList.add("is-revealed");
          // Once revealed, unobserve to keep CPU consumption at 0
          this.observer.unobserve(target);
        }
      });
    }, options);
  }

  /**
   * Scans and applies scroll reveal animations to any page
   */
  initPageScrollAnimations(root = document) {
    if (this.prefersReducedMotion) {
      document.querySelectorAll("[data-scroll-reveal], .scroll-reveal").forEach(el => el.classList.add("is-revealed"));
      return;
    }

    if (!this.observer) {
      this.initObserver();
    }

    // Key semantic selectors across all views (public, customer, partner, admin)
    const candidates = [
      // Sections & Headers
      ".content-section",
      ".section-header",
      ".hero-quick-estimator",
      ".floating-search-bar",
      ".hero-tags-group",
      
      // Cards & Grids
      ".category-card",
      ".service-card",
      ".trust-card",
      ".step-card",
      ".testimonial-card",
      ".solid-card",
      ".glass-card",
      ".kpi-card",
      ".pricing-card",
      ".faq-item",
      ".feature-item",
      ".benefit-card",
      ".partner-benefit-card",
      ".step-flow-item",
      
      // Tables & Workbenches
      ".table-responsive",
      ".admin-table-card",
      ".kyc-workbench",
      
      // Explicit markers
      "[data-scroll-reveal]",
      ".scroll-reveal"
    ];

    const elements = root.querySelectorAll(candidates.join(", "));
    const windowHeight = window.innerHeight;

    // Group elements by grid/container for automatic stagger effects
    const containerGroups = new Map();

    elements.forEach((el) => {
      // Don't re-observe elements already revealed
      if (el.classList.contains("is-revealed")) return;

      // Ensure data attribute exists
      if (!el.hasAttribute("data-scroll-reveal")) {
        el.setAttribute("data-scroll-reveal", "fade-up");
      }

      // Check if inside a multi-item grid or sibling group
      const parent = el.parentElement;
      if (parent && (
        parent.classList.contains("categories-grid") ||
        parent.classList.contains("services-grid") ||
        parent.classList.contains("trust-grid") ||
        parent.classList.contains("steps-grid") ||
        parent.classList.contains("testimonials-grid") ||
        parent.classList.contains("kpi-grid") ||
        parent.classList.contains("grid-cards") ||
        parent.classList.contains("kyc-doc-grid")
      )) {
        if (!containerGroups.has(parent)) {
          containerGroups.set(parent, []);
        }
        containerGroups.get(parent).push(el);
      }

      // Check if already above the fold (in viewport on initial page render)
      const rect = el.getBoundingClientRect();
      const isAboveFold = rect.top < windowHeight * 0.95 && rect.bottom > 0;

      if (isAboveFold) {
        // Smoothly reveal above-fold elements with a slight cascading breath
        setTimeout(() => {
          el.classList.add("is-revealed");
        }, 50);
      } else {
        // Register for viewport scroll reveal
        this.observer.observe(el);
      }
    });

    // Apply staggered delays to sibling elements in grid containers
    containerGroups.forEach((group) => {
      group.forEach((item, idx) => {
        const delay = Math.min(idx * 50, 300); // silky subtle stagger
        item.style.transitionDelay = `${delay}ms`;
      });
    });
  }

  /**
   * Smoothly scrolls to target element or Y coordinate using native smooth scrolling
   */
  smoothScrollTo(target, offset = -20) {
    let destY = 0;
    if (typeof target === "number") {
      destY = target;
    } else if (typeof target === "string") {
      const el = document.querySelector(target);
      if (el) {
        const box = el.getBoundingClientRect();
        destY = window.pageYOffset + box.top + offset;
      }
    } else if (target && target.getBoundingClientRect) {
      const box = target.getBoundingClientRect();
      destY = window.pageYOffset + box.top + offset;
    }

    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    destY = Math.max(0, Math.min(maxScroll, destY));

    window.scrollTo({
      top: destY,
      behavior: "smooth"
    });
  }

  /**
   * Resets scroll position to top cleanly on route change
   */
  resetOnRoute() {
    window.scrollTo({
      top: 0,
      behavior: "instant"
    });

    // Refresh animations for new route
    setTimeout(() => {
      this.initPageScrollAnimations();
    }, 40);
  }
}

export const scrollManager = new ScrollManager();
