/**
 * KLEEN — Public Home Page
 * Minimal classic liquid-glass hero, service discovery, trust guarantee, reviews, and FAQ.
 */

import { db } from "../../services/db-service.js";
import { modal } from "../../components/modal.js";
import { toast } from "../../components/toast.js";
import { openBookingFlow } from "../customer/customer-view.js";
import { icon, getCategoryIconName } from "../../components/icons.js";
import { getStoredLocation, openLocationPickerModal } from "../../services/location-service.js";

export function renderHomePage() {
  const categories = db.getCategories();
  const services = db.getServices();
  const storedLoc = getStoredLocation();
  const currentCity = storedLoc && storedLoc.city && storedLoc.city !== "Add Location" ? storedLoc.city : "Kochi";

  const categoriesHtml = categories.map(cat => `
    <div class="category-card" data-cat-id="${cat.categoryId}">
      <div class="category-icon-wrapper">
        ${icon(getCategoryIconName(cat.name), { size: 24, stroke: "var(--brand-emerald-dark)", strokeWidth: 2 })}
      </div>
      <span class="category-title">${cat.name}</span>
    </div>
  `).join("");

  const servicesHtml = services.slice(0, 6).map(srv => `
    <div class="service-card animate-fade-in" data-service-id="${srv.serviceId}">
      <div class="service-image-box" style="cursor: pointer;" onclick="window.location.hash='#/services/${srv.serviceId}'" title="View detailed information for ${srv.name}">
        <img src="${srv.image}" alt="${srv.name}" class="service-img" loading="lazy">
        <span class="service-badge">${srv.duration}</span>
        <span class="service-rating">${icon("star", { size: 12, fill: "#F59E0B", stroke: "#F59E0B" })} ${srv.rating} (${srv.reviewCount})</span>
      </div>
      <div class="service-content">
        <h3 class="service-name" style="cursor: pointer;" onclick="window.location.hash='#/services/${srv.serviceId}'" title="View detailed information for ${srv.name}">${srv.name}</h3>
        <p class="service-desc">${srv.description}</p>
        
        <div class="service-meta">
          <div class="service-meta-item">
            <span>${icon("shield-check", { size: 15, stroke: "var(--brand-emerald)" })}</span>
            <span>Verified Maid</span>
          </div>
          <div class="service-meta-item">
            <span>${icon("leaf", { size: 15, stroke: "var(--brand-emerald)" })}</span>
            <span>Eco Chemicals</span>
          </div>
        </div>

        <div class="service-footer">
          <div class="service-price-block">
            <span class="price-label">Starting From</span>
            <span class="price-amount">₹${srv.price}</span>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <a href="#/services/${srv.serviceId}" class="btn btn-glass btn-sm">Details</a>
            <button class="btn btn-primary btn-sm btn-book-service" data-id="${srv.serviceId}">Book Now</button>
          </div>
        </div>
      </div>
    </div>
  `).join("");


  return `
    <!-- Mockup Hero Section -->
    <section class="mockup-hero-section">
      <div class="mockup-ambient-light"></div>

      <div class="app-container">
        <!-- 3-Column Hero Grid -->
        <div class="mockup-hero-grid">
          
          <!-- Column 1: Left Content -->
          <div class="mockup-hero-left">
            <div class="mockup-hero-badge">
              <span style="display: flex; align-items: center;">${icon("sparkles", { size: 14, stroke: "#10B981", strokeWidth: 2 })}</span>
              <span>Trusted • Safe • Professional</span>
            </div>

            <h1 class="mockup-hero-title">
              Professional Cleaning,<br>
              <span class="mockup-hero-accent">Just a Tap Away.</span>
            </h1>

            <p class="mockup-hero-desc">
              Book trusted and verified cleaning professionals for your home. From regular cleaning to deep cleaning, we've got you covered.
            </p>

            <div class="mockup-hero-actions">
              <button type="button" class="mockup-btn-primary" id="btn-hero-book-service">
                <span>Book a Service</span>
                <span style="display: flex; align-items: center;">${icon("arrow-right", { size: 16, stroke: "#FFFFFF", strokeWidth: 2.5 })}</span>
              </button>
              <a href="#/services" class="mockup-btn-secondary" id="btn-hero-explore-services">
                Explore Services
              </a>
            </div>

            <!-- Social Proof -->
            <div class="mockup-social-proof">
              <div class="mockup-avatar-group">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&q=80" alt="Customer" class="mockup-avatar-img">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=64&q=80" alt="Customer" class="mockup-avatar-img">
                <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&q=80" alt="Customer" class="mockup-avatar-img">
                <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=64&q=80" alt="Customer" class="mockup-avatar-img">
              </div>
              <div class="mockup-rating-info">
                <div class="mockup-rating-val">
                  <span style="color: #F59E0B; display: inline-flex;">${icon("star", { size: 14, fill: "#F59E0B", stroke: "#F59E0B" })}</span>
                  <span>4.8/5</span>
                </div>
                <span class="mockup-rating-text">Trusted by 10,000+ happy homes</span>
              </div>
            </div>

            <!-- Drag to rotate interactive hint -->
            <div class="mockup-drag-hint" id="mockup-drag-hint">
              <span>&larr;</span>
              <span style="display: inline-flex; align-items: center;">${icon("mouse-pointer", { size: 13, stroke: "#64748B" })}</span>
              <span>Drag to rotate</span>
            </div>
          </div>

          <!-- Column 2: Center 3D Scene Element with 3D Parallax & Drag Tilt -->
          <div class="mockup-scene-wrapper" id="mockup-scene-interactive">
            <div class="mockup-scene-diorama" id="mockup-diorama-card">
              <img src="assets/partner-hero-3d.png" alt="KLEEN Verified Professional" class="mockup-scene-img" draggable="false" />
            </div>
          </div>

          <!-- Column 3: Right Frosted Glass "Need a cleaner?" Card -->
          <div class="mockup-hero-right">
            <div class="mockup-glass-card">
              <h3 class="mockup-card-title">Need a cleaner?</h3>
              <p class="mockup-card-subtitle">Find trusted professionals near you.</p>

              <!-- Location Dropdown Selector -->
              <div class="mockup-card-location-select" id="mockup-card-location-btn" title="Choose your district">
                <div style="display: flex; align-items: center; gap: 0.45rem;">
                  <span style="color: #0E9F6E; display: flex; align-items: center;">${icon("map-pin", { size: 15, stroke: "#0E9F6E", strokeWidth: 2 })}</span>
                  <span id="mockup-card-location-text">${currentCity}</span>
                </div>
                <span style="color: #64748B; display: flex; align-items: center;">${icon("chevron-down", { size: 13, stroke: "#64748B", strokeWidth: 2 })}</span>
              </div>

              <!-- Primary Card Button -->
              <button type="button" class="mockup-card-btn" id="btn-card-book-now">
                <span>Book Now</span>
                <span style="display: flex; align-items: center;">${icon("arrow-right", { size: 15, stroke: "#FFFFFF", strokeWidth: 2.2 })}</span>
              </button>

              <!-- 3 Feature Perks -->
              <div class="mockup-card-perks">
                <div class="mockup-perk-item">
                  <div class="mockup-perk-icon">
                    ${icon("zap", { size: 15, stroke: "#0E9F6E", strokeWidth: 2.2 })}
                  </div>
                  <span>Quick<br>Booking</span>
                </div>
                <div class="mockup-perk-item">
                  <div class="mockup-perk-icon">
                    ${icon("shield-check", { size: 15, stroke: "#0E9F6E", strokeWidth: 2.2 })}
                  </div>
                  <span>Secure<br>Payments</span>
                </div>
                <div class="mockup-perk-item">
                  <div class="mockup-perk-icon">
                    ${icon("headphones", { size: 15, stroke: "#0E9F6E", strokeWidth: 2.2 })}
                  </div>
                  <span>Reliable<br>Support</span>
                </div>
              </div>
            </div>

            <!-- Scroll Down Indicator -->
            <button type="button" class="mockup-scroll-down" id="btn-mockup-scroll-down" title="Scroll down to services">
              <span style="display: flex; align-items: center;">${icon("arrow-down", { size: 14, stroke: "#64748B", strokeWidth: 2 })}</span>
              <span>Scroll down</span>
              <span>&darr;</span>
            </button>
          </div>

        </div>

        <!-- Bottom Feature Dock (4 Value Cards) -->
        <div class="mockup-feature-dock">
          <div class="mockup-dock-card" id="dock-easy-booking">
            <div class="mockup-dock-icon">
              ${icon("check-circle", { size: 22, stroke: "#0E9F6E", strokeWidth: 2 })}
            </div>
            <div class="mockup-dock-content">
              <div class="mockup-dock-title">Easy Booking</div>
              <div class="mockup-dock-desc">Book in just a few taps</div>
            </div>
          </div>

          <div class="mockup-dock-card" id="dock-verified-pros">
            <div class="mockup-dock-icon">
              ${icon("user-check", { size: 22, stroke: "#0E9F6E", strokeWidth: 2 })}
            </div>
            <div class="mockup-dock-content">
              <div class="mockup-dock-title">Verified Professionals</div>
              <div class="mockup-dock-desc">Background checked & trusted</div>
            </div>
          </div>

          <div class="mockup-dock-card" id="dock-flexible-slots">
            <div class="mockup-dock-icon">
              ${icon("clock", { size: 22, stroke: "#0E9F6E", strokeWidth: 2 })}
            </div>
            <div class="mockup-dock-content">
              <div class="mockup-dock-title">Flexible Time Slots</div>
              <div class="mockup-dock-desc">Choose what works for you</div>
            </div>
          </div>

          <div class="mockup-dock-card" id="dock-secure-payments">
            <div class="mockup-dock-icon">
              ${icon("credit-card", { size: 22, stroke: "#0E9F6E", strokeWidth: 2 })}
            </div>
            <div class="mockup-dock-content">
              <div class="mockup-dock-title">Secure Payments</div>
              <div class="mockup-dock-desc">100% safe & hassle-free</div>
            </div>
          </div>
        </div>

      </div>
    </section>

    <!-- Popular Categories -->
    <section class="app-container" id="services" style="margin-top: 4.5rem; margin-bottom: 4rem;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem;">
        <div>
          <span class="price-label" style="font-weight: 700; color: var(--brand-emerald);">Care Categories</span>
          <h2>Explore Services</h2>
        </div>
        <button id="btn-show-all-cats" class="btn btn-glass btn-sm">View All Categories</button>
      </div>

      <div class="categories-grid">
        ${categoriesHtml}
      </div>
    </section>

    <!-- Featured Services Grid -->
    <section class="app-container" style="margin-bottom: 5rem;">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem;">
        <div>
          <span class="price-label" style="font-weight: 700; color: var(--brand-emerald);">Most Booked</span>
          <h2>Popular Home Care Packages</h2>
        </div>
        <a href="#/services" class="btn btn-secondary btn-sm">Browse Catalog →</a>
      </div>

      <div class="services-grid">
        ${servicesHtml}
      </div>
    </section>

    <!-- How KLEEN Works -->
    <section id="how-it-works" style="background: #FFFFFF; border-top: 1px solid #E5E7EB; border-bottom: 1px solid #E5E7EB; padding: 5rem 0;">
      <div class="app-container">
        <div style="text-align: center; max-width: 600px; margin: 0 auto 3.5rem;">
          <span class="price-label" style="font-weight: 700; color: var(--brand-emerald);">Simplicity First</span>
          <h2>How KLEEN Works</h2>
          <p style="margin-top: 0.5rem;">Book certified domestic service partners in four effortless steps.</p>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 2rem;">
          <div class="glass-card" style="padding: 2rem 1.5rem; text-align: center;">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: var(--brand-sage-light); color: var(--brand-emerald-dark); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin: 0 auto 1.25rem;">
              1
            </div>
            <h4>Select Service</h4>
            <p style="font-size: 0.875rem; margin-top: 0.5rem; color: var(--text-muted);">
              Browse clear pricing, task inclusions, and duration for your home size.
            </p>
          </div>

          <div class="glass-card" style="padding: 2rem 1.5rem; text-align: center;">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: var(--brand-sage-light); color: var(--brand-emerald-dark); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin: 0 auto 1.25rem;">
              2
            </div>
            <h4>Choose Slot & Pay</h4>
            <p style="font-size: 0.875rem; margin-top: 0.5rem; color: var(--text-muted);">
              Pick your preferred date and time slot. Pay securely with Razorpay.
            </p>
          </div>

          <div class="glass-card" style="padding: 2rem 1.5rem; text-align: center;">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: var(--brand-sage-light); color: var(--brand-emerald-dark); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin: 0 auto 1.25rem;">
              3
            </div>
            <h4>Partner Assigned</h4>
            <p style="font-size: 0.875rem; margin-top: 0.5rem; color: var(--text-muted);">
              A background-checked, KYC-verified partner accepts and arrives on time.
            </p>
          </div>

          <div class="glass-card" style="padding: 2rem 1.5rem; text-align: center;">
            <div style="width: 52px; height: 52px; border-radius: 50%; background: var(--brand-sage-light); color: var(--brand-emerald-dark); display: flex; align-items: center; justify-content: center; font-size: 1.5rem; margin: 0 auto 1.25rem;">
              4
            </div>
            <h4>Sparkling Home</h4>
            <p style="font-size: 0.875rem; margin-top: 0.5rem; color: var(--text-muted);">
              Track job progress in real-time, inspect results, and rate your experience.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Trust & Verification Section -->
    <section id="why-us" class="app-container content-section">
      <div class="glass-panel" style="padding: 3.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center;">
        <div>
          <span class="badge badge-success" style="margin-bottom: 1rem;">100% Verified Partners</span>
          <h2>Your Safety & Peace of Mind Is Our Core Priority</h2>
          <p style="margin: 1rem 0 1.75rem; line-height: 1.6;">
            Every maid and service partner on KLEEN passes rigorous 4-tier KYC verification including Aadhaar/government identity check, police record verification, residential address check, and practical skill evaluations.
          </p>

          <div style="display: flex; flex-direction: column; gap: 0.85rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span style="color: var(--brand-emerald);">${icon("shield-check", { size: 18, stroke: "var(--brand-emerald)" })}</span>
              <span style="font-weight: 600;">Government Identity & Background Verified</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span style="color: var(--brand-emerald);">${icon("check-circle", { size: 18, stroke: "var(--brand-emerald)" })}</span>
              <span style="font-weight: 600;">Fixed & Transparent Pricing (No Cash Hassles)</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <span style="color: var(--brand-emerald);">${icon("award", { size: 18, stroke: "var(--brand-emerald)" })}</span>
              <span style="font-weight: 600;">KLEEN Re-clean Guarantee if unsatisfied</span>
            </div>
          </div>
        </div>

        <div style="position: relative;">
          <img src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=700&q=80" alt="Verified Partner" style="width: 100%; height: 380px; object-fit: cover; border-radius: var(--radius-xl); box-shadow: var(--shadow-lg);">
          <div class="glass-card" style="position: absolute; bottom: 20px; left: -20px; padding: 1rem 1.5rem; display: flex; align-items: center; gap: 1rem; max-width: 280px;">
            <div style="width: 42px; height: 42px; border-radius: 50%; background: #22C55E; color: #FFFFFF; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(34, 197, 94, 0.35);">
              ${icon("shield-check", { size: 22, stroke: "#FFFFFF" })}
            </div>
            <div>
              <div style="font-weight: 700; font-size: 0.95rem;">Verified Service Professional</div>
              <div style="font-size: 0.775rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.25rem;">
                <span>Police Verified</span> • <span>${icon("star", { size: 12, fill: "#F59E0B", stroke: "#F59E0B" })} 5.0 Rating</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- End of Homepage Content -->
  `;
}

export function attachHomePageEvents() {
  // Service Book button triggers interactive booking flow
  document.querySelectorAll(".btn-book-service").forEach(btn => {
    btn.onclick = () => {
      const srvId = btn.getAttribute("data-id");
      openBookingFlow(srvId);
    };
  });

  // Service Details Modal
  document.querySelectorAll(".btn-view-service").forEach(btn => {
    btn.onclick = () => {
      const srvId = btn.getAttribute("data-id");
      const service = db.getServiceById(srvId);
      if (!service) return;

      modal.open({
        title: service.name,
        maxWidth: "600px",
        bodyHtml: `
          <img src="${service.image}" alt="${service.name}" style="width: 100%; height: 240px; object-fit: cover; border-radius: var(--radius-md); margin-bottom: 1.25rem;">
          <p style="font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 1.25rem;">${service.description}</p>
          
          <div style="display: flex; gap: 1.5rem; margin-bottom: 1.25rem; font-size: 0.85rem; font-weight: 600;">
            <span style="display: flex; align-items: center; gap: 0.35rem;">${icon("clock", { size: 15, stroke: "var(--brand-emerald)" })} Duration: ${service.duration}</span>
            <span style="display: flex; align-items: center; gap: 0.35rem;">${icon("star", { size: 15, fill: "#F59E0B", stroke: "#F59E0B" })} Rating: ${service.rating} (${service.reviewCount} reviews)</span>
          </div>

          <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: var(--radius-md); padding: 1rem; margin-bottom: 1rem;">
            <h5 style="color: #15803D; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
              ${icon("check-circle", { size: 16, stroke: "#15803D" })} What's Included:
            </h5>
            <ul style="padding-left: 1.25rem; font-size: 0.85rem; color: #166534; line-height: 1.5;">
              ${service.includedTasks.map(t => `<li>${t}</li>`).join("")}
            </ul>
          </div>

          <div style="background: #FEF2F2; border: 1px solid #FECACA; border-radius: var(--radius-md); padding: 1rem;">
            <h5 style="color: #B91C1C; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
              ${icon("x-circle", { size: 16, stroke: "#B91C1C" })} Excluded Tasks:
            </h5>
            <ul style="padding-left: 1.25rem; font-size: 0.85rem; color: #991B1B; line-height: 1.5;">
              ${service.excludedTasks.map(t => `<li>${t}</li>`).join("")}
            </ul>
          </div>
        `,
        footerHtml: `
          <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
            <span style="font-size: 1.35rem; font-weight: 800; color: var(--brand-emerald-dark);">₹${service.price}</span>
            <button class="btn btn-primary btn-sm" id="modal-proceed-book">Proceed to Book</button>
          </div>
        `,
        onOpen: (container) => {
          container.querySelector("#modal-proceed-book").onclick = () => {
            modal.close();
            openBookingFlow(service.serviceId);
          };
        }
      });
    };
  });

  // --- Interactive Mockup Hero Elements (All Buttons Functional) ---

  // 1. Hero Book a Service button -> interactive booking flow
  const heroBookBtn = document.getElementById("btn-hero-book-service");
  if (heroBookBtn) {
    heroBookBtn.onclick = () => {
      openBookingFlow("srv_home_1bhk");
    };
  }

  // 2. Hero Explore Services button -> smooth scroll to services section
  const heroExploreBtn = document.getElementById("btn-hero-explore-services");
  if (heroExploreBtn) {
    heroExploreBtn.onclick = (e) => {
      e.preventDefault();
      const target = document.getElementById("services") || document.getElementById("home-services-catalog");
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      } else {
        window.location.hash = "#/services";
      }
    };
  }

  // 3. Right Card Location Selector -> opens Location Picker Modal
  const locBtn = document.getElementById("mockup-card-location-btn");
  const locText = document.getElementById("mockup-card-location-text");
  if (locBtn) {
    locBtn.onclick = () => {
      openLocationPickerModal((loc) => {
        if (locText && loc) {
          locText.textContent = loc.city || loc.area || "Kochi";
        }
      });
    };
  }

  // Listen to global location changes
  window.addEventListener("kleen:location-changed", (e) => {
    if (locText && e.detail) {
      locText.textContent = e.detail.city || e.detail.area || "Kochi";
    }
  });

  // 4. Right Card Book Now button
  const cardBookBtn = document.getElementById("btn-card-book-now");
  if (cardBookBtn) {
    cardBookBtn.onclick = () => {
      openBookingFlow("srv_home_1bhk");
    };
  }

  // 5. Scroll Down Indicator Button
  const scrollDownBtn = document.getElementById("btn-mockup-scroll-down");
  if (scrollDownBtn) {
    scrollDownBtn.onclick = () => {
      const target = document.getElementById("services") || document.getElementById("home-services-catalog");
      if (target) {
        target.scrollIntoView({ behavior: "smooth" });
      }
    };
  }

  // 6. Interactive 3D Mouse Parallax & Drag to Tilt on the 3D Element
  const diorama = document.getElementById("mockup-diorama-card");
  const sceneWrapper = document.getElementById("mockup-scene-interactive");
  if (diorama && sceneWrapper) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    const applyTilt = (rotY, rotX, scale = 1.02) => {
      diorama.style.transform = `perspective(1000px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale3d(${scale}, ${scale}, ${scale})`;
    };

    sceneWrapper.addEventListener("mousemove", (e) => {
      if (isDragging) return;
      const rect = sceneWrapper.getBoundingClientRect();
      const x = e.clientX - (rect.left + rect.width / 2);
      const y = e.clientY - (rect.top + rect.height / 2);
      const rotY = Math.max(-18, Math.min(18, (x / (rect.width / 2)) * 14));
      const rotX = Math.max(-14, Math.min(14, -(y / (rect.height / 2)) * 10));
      applyTilt(rotY, rotX, 1.02);
    });

    sceneWrapper.addEventListener("mouseleave", () => {
      if (!isDragging) {
        diorama.style.transform = "perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)";
      }
    });

    // Drag to rotate implementation
    sceneWrapper.addEventListener("mousedown", (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      sceneWrapper.style.cursor = "grabbing";
    });

    window.addEventListener("mouseup", () => {
      if (isDragging) {
        isDragging = false;
        sceneWrapper.style.cursor = "grab";
        diorama.style.transform = "perspective(1000px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)";
      }
    });

    window.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const rotY = Math.max(-28, Math.min(28, dx * 0.3));
      const rotX = Math.max(-20, Math.min(20, -dy * 0.25));
      applyTilt(rotY, rotX, 1.04);
    });
  }

  // 8. Bottom Feature Dock Cards Interactions
  const dockEasy = document.getElementById("dock-easy-booking");
  if (dockEasy) {
    dockEasy.onclick = () => openBookingFlow("srv_home_1bhk");
  }

  const dockVerified = document.getElementById("dock-verified-pros");
  if (dockVerified) {
    dockVerified.onclick = () => {
      const target = document.getElementById("why-us");
      if (target) target.scrollIntoView({ behavior: "smooth" });
      else toast.info("All professionals are police background checked & verified.");
    };
  }

  const dockFlexible = document.getElementById("dock-flexible-slots");
  if (dockFlexible) {
    dockFlexible.onclick = () => openBookingFlow("srv_home_1bhk");
  }

  const dockSecure = document.getElementById("dock-secure-payments");
  if (dockSecure) {
    dockSecure.onclick = () => {
      toast.success("100% Secure Payments via Razorpay with KLEEN Re-clean Guarantee.");
    };
  }

  // 9. Category cards and navigation
  document.querySelectorAll(".category-card").forEach(card => {
    card.onclick = () => {
      const catId = card.getAttribute("data-cat-id");
      window.location.hash = catId ? `#/services?cat=${catId}` : `#/services`;
    };
  });

  const showAllCatsBtn = document.getElementById("btn-show-all-cats");
  if (showAllCatsBtn) {
    showAllCatsBtn.onclick = () => {
      window.location.hash = "#/services";
    };
  }
}
