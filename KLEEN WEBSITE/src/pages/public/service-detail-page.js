/**
 * KLEEN — Service Details Page (/services/:serviceId)
 * Detailed service breakdown with high-res imagery, verified maid credentials,
 * transparent pricing, included/excluded tasks, safety guarantees & instant booking.
 */

import { db } from "../../services/db-service.js";
import { auth } from "../../services/auth-service.js";
import { openBookingFlow } from "../customer/customer-view.js";
import { icon, getCategoryIconName } from "../../components/icons.js";

export function renderServiceDetailPage(serviceId) {
  const service = db.getServiceById(serviceId) || db.getServices()[0];
  const user = auth.getCurrentUser();
  const isCustomer = user && user.role === "customer";
  const categories = db.getCategories();
  const category = categories.find(c => c.categoryId === service.categoryId);
  const categoryName = category ? category.name : "Home Care";

  const reviews = [
    {
      author: "Priya Sundaram",
      date: "2 days ago",
      rating: 5,
      comment: "Outstanding attention to detail! The helper arrived right on time, had proper ID verification, and left the place spotless.",
      verified: true
    },
    {
      author: "Rahul Varma",
      date: "1 week ago",
      rating: 5,
      comment: "Very professional and courteous. Used safe, non-toxic chemicals that didn't leave any pungent odor. Highly recommended!",
      verified: true
    },
    {
      author: "Ananya Iyer",
      date: "2 weeks ago",
      rating: 4.9,
      comment: "Booked this on short notice and the experience was completely seamless. Fixed pricing with zero surprise charges.",
      verified: true
    }
  ];

  return `
    <div class="service-detail-container app-container animate-fade-in">
      <!-- Breadcrumb Navigation -->
      <nav class="service-breadcrumb">
        <a href="#/">Home</a>
        <span>${icon("chevron-right", { size: 14, stroke: "var(--text-muted)" })}</span>
        <a href="#/services">Services</a>
        <span>${icon("chevron-right", { size: 14, stroke: "var(--text-muted)" })}</span>
        <a href="#/services?cat=${service.categoryId}">${categoryName}</a>
        <span>${icon("chevron-right", { size: 14, stroke: "var(--text-muted)" })}</span>
        <span style="color: var(--brand-emerald-dark); font-weight: 600;">${service.name}</span>
      </nav>

      <!-- Main Detail Layout -->
      <div class="service-detail-layout">
        <!-- Left: Image, Overview, Tasks, Tools, FAQs & Reviews -->
        <div class="service-detail-main">
          <!-- Hero Image & Badges -->
          <div class="service-media-hero">
            <img src="${service.image}" alt="${service.name}" class="service-hero-img" loading="lazy">
            <div class="service-hero-overlay-badges">
              <span class="hero-floating-badge">
                ${icon("shield-check", { size: 16, stroke: "var(--brand-emerald)" })}
                <span>Verified Specialist</span>
              </span>
              <span class="hero-floating-badge">
                ${icon("star", { size: 14, fill: "#F59E0B", stroke: "#F59E0B" })}
                <span>${service.rating} (${service.reviewCount} ratings)</span>
              </span>
            </div>
          </div>

          <!-- Service Header Info -->
          <div>
            <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;">
              <span class="badge badge-info" style="gap: 0.35rem;">
                ${icon(getCategoryIconName(categoryName), { size: 13, stroke: "var(--brand-emerald-dark)" })}
                ${categoryName}
              </span>
              <span class="badge" style="background: #F0FDF4; color: #166534; border: 1px solid #BBF7D0; font-size: 0.75rem; font-weight: 700;">
                ${icon("clock", { size: 12, stroke: "#166534" })} ${service.duration} Session
              </span>
            </div>
            
            <h1 style="font-size: clamp(1.85rem, 3.5vw, 2.4rem); font-weight: 800; color: var(--brand-emerald-darker); margin-bottom: 0.75rem; letter-spacing: -0.02em;">
              ${service.name}
            </h1>
            
            <p style="font-size: 1.05rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1.5rem;">
              ${service.description}
            </p>
          </div>

          <!-- Key Guarantees & Features 4-Grid -->
          <div class="service-features-grid">
            <div class="service-feature-pill-card">
              <div class="service-feature-icon">
                ${icon("shield-check", { size: 18, stroke: "var(--brand-emerald)" })}
              </div>
              <div>
                <h5 style="font-size: 0.875rem; font-weight: 700; margin-bottom: 0.15rem;">Verified Staff</h5>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0;">Police & Aadhaar background verified domestic helpers.</p>
              </div>
            </div>

            <div class="service-feature-pill-card">
              <div class="service-feature-icon">
                ${icon("leaf", { size: 18, stroke: "var(--brand-emerald)" })}
              </div>
              <div>
                <h5 style="font-size: 0.875rem; font-weight: 700; margin-bottom: 0.15rem;">Eco Chemicals</h5>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0;">Safe, pet-friendly and child-safe cleaning formulations.</p>
              </div>
            </div>

            <div class="service-feature-pill-card">
              <div class="service-feature-icon">
                ${icon("clock", { size: 18, stroke: "var(--brand-emerald)" })}
              </div>
              <div>
                <h5 style="font-size: 0.875rem; font-weight: 700; margin-bottom: 0.15rem;">On-Time Arrival</h5>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0;">Live tracking with punctual doorstep arrival guarantee.</p>
              </div>
            </div>

            <div class="service-feature-pill-card">
              <div class="service-feature-icon">
                ${icon("award", { size: 18, stroke: "var(--brand-emerald)" })}
              </div>
              <div>
                <h5 style="font-size: 0.875rem; font-weight: 700; margin-bottom: 0.15rem;">100% Guarantee</h5>
                <p style="font-size: 0.75rem; color: var(--text-muted); margin: 0;">Free re-clean rework if not 100% satisfied with the job.</p>
              </div>
            </div>
          </div>

          <!-- What's Included Card -->
          <div class="task-list-card included">
            <h4 style="color: #15803D; display: flex; align-items: center; gap: 0.5rem; margin: 0;">
              ${icon("check-circle", { size: 20, stroke: "#15803D" })}
              <span>What's Included in this Package</span>
            </h4>
            <p style="font-size: 0.825rem; color: #166534; margin: 0.35rem 0 0.75rem;">
              Full professional coverage carried out by trained home care specialists.
            </p>
            <ul class="task-items-list">
              ${(service.includedTasks || []).map(task => `
                <li class="task-item-row included">
                  <span style="flex-shrink: 0; margin-top: 2px;">${icon("check", { size: 16, stroke: "#15803D" })}</span>
                  <span>${task}</span>
                </li>
              `).join("")}
            </ul>
          </div>

          <!-- What's Excluded Card -->
          <div class="task-list-card excluded">
            <h4 style="color: #B91C1C; display: flex; align-items: center; gap: 0.5rem; margin: 0;">
              ${icon("x-circle", { size: 20, stroke: "#B91C1C" })}
              <span>Excluded Tasks & Safety Boundaries</span>
            </h4>
            <p style="font-size: 0.825rem; color: #991B1B; margin: 0.35rem 0 0.75rem;">
              Tasks beyond the scope of this package for partner safety and appliance safety.
            </p>
            <ul class="task-items-list">
              ${(service.excludedTasks || []).map(task => `
                <li class="task-item-row excluded">
                  <span style="flex-shrink: 0; margin-top: 2px;">${icon("x", { size: 15, stroke: "#B91C1C" })}</span>
                  <span>${task}</span>
                </li>
              `).join("")}
            </ul>
          </div>

          <!-- Equipment & Chemical Standards -->
          <div class="glass-card" style="padding: 1.75rem;">
            <h4 style="margin-bottom: 0.75rem; color: var(--brand-emerald-darker); display: flex; align-items: center; gap: 0.5rem;">
              ${icon("sparkles", { size: 18, stroke: "var(--brand-emerald)" })}
              Tools & Equipment We Bring
            </h4>
            <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 1rem;">
              Our verified professionals arrive with complete industry-grade supplies so you don't need to shop for chemicals or materials:
            </p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem;">
              <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: var(--radius-md); padding: 0.75rem 1rem; font-size: 0.85rem; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
                ${icon("check", { size: 14, stroke: "var(--brand-emerald)" })} Color-coded microfiber wipes
              </div>
              <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: var(--radius-md); padding: 0.75rem 1rem; font-size: 0.85rem; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
                ${icon("check", { size: 14, stroke: "var(--brand-emerald)" })} Taski R2/R6 disinfectants
              </div>
              <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: var(--radius-md); padding: 0.75rem 1rem; font-size: 0.85rem; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
                ${icon("check", { size: 14, stroke: "var(--brand-emerald)" })} Floor squeegees & scrub pads
              </div>
              <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: var(--radius-md); padding: 0.75rem 1rem; font-size: 0.85rem; font-weight: 600; color: var(--text-primary); display: flex; align-items: center; gap: 0.5rem;">
                ${icon("check", { size: 14, stroke: "var(--brand-emerald)" })} Protective gloves & shoe covers
              </div>
            </div>
          </div>

          <!-- Customer Reviews Section -->
          <div class="glass-card" style="padding: 1.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
              <div>
                <h4 style="margin: 0; color: var(--brand-emerald-darker);">Verified Customer Ratings</h4>
                <div style="display: flex; align-items: center; gap: 0.35rem; margin-top: 0.25rem;">
                  <span style="font-size: 1.25rem; font-weight: 800; color: var(--brand-emerald-dark);">${service.rating}</span>
                  <span style="display: flex; gap: 2px;">
                    ${[1,2,3,4,5].map(() => icon("star", { size: 14, fill: "#F59E0B", stroke: "#F59E0B" })).join("")}
                  </span>
                  <span style="font-size: 0.825rem; color: var(--text-muted);">(${service.reviewCount} total verified bookings)</span>
                </div>
              </div>
            </div>

            <div style="display: flex; flex-direction: column; gap: 1rem;">
              ${reviews.map(r => `
                <div style="background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: var(--radius-lg); padding: 1rem 1.25rem;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                      <span style="font-weight: 700; font-size: 0.9rem;">${r.author}</span>
                      <span style="font-size: 0.7rem; background: #ECFDF5; color: #047857; padding: 0.15rem 0.45rem; border-radius: var(--radius-full); font-weight: 700; display: inline-flex; align-items: center; gap: 0.25rem;">
                        ${icon("shield-check", { size: 11, stroke: "#047857" })} Verified Customer
                      </span>
                    </div>
                    <span style="font-size: 0.75rem; color: var(--text-muted);">${r.date}</span>
                  </div>
                  <p style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.5; margin: 0;">
                    "${r.comment}"
                  </p>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <!-- Right: Sticky Booking Summary Card -->
        <div class="service-sticky-sidebar">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <span class="badge badge-info" style="font-weight: 700;">Fixed Transparent Rate</span>
            <span style="display: flex; align-items: center; gap: 0.35rem; font-size: 0.75rem; color: #166534; font-weight: 600;">
              <span class="pulse-dot" style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: #22C55E;"></span>
              Slots Available Today
            </span>
          </div>

          <div style="margin-bottom: 1.5rem;">
            <span class="price-label">Starting All-Inclusive</span>
            <div style="font-family: var(--font-heading); font-size: 2.5rem; font-weight: 800; color: var(--brand-emerald-darker); line-height: 1.1;">
              ₹${service.price}
            </div>
            <span style="font-size: 0.775rem; color: #15803D; display: flex; align-items: center; gap: 0.35rem; margin-top: 0.35rem;">
              ${icon("check", { size: 13, stroke: "#15803D" })} Includes tax, chemicals, equipment & safety gear
            </span>
          </div>

          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: var(--radius-lg); padding: 1rem; margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.5rem;">
              <span style="color: var(--text-muted);">Estimated Duration</span>
              <span style="font-weight: 700; color: var(--text-primary);">${service.duration}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem; margin-bottom: 0.5rem;">
              <span style="color: var(--text-muted);">Maid Staff Dispatch</span>
              <span style="font-weight: 700; color: var(--brand-emerald-dark);">1 Certified Partner</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.85rem;">
              <span style="color: var(--text-muted);">Payment Mode</span>
              <span style="font-weight: 700; color: var(--text-primary);">UPI, Card, Cash</span>
            </div>
          </div>

          ${!isCustomer ? `
            <div style="text-align: center; margin-bottom: 0.65rem; font-size: 0.775rem; color: var(--brand-emerald-dark); background: rgba(20, 92, 71, 0.08); padding: 0.35rem 0.65rem; border-radius: var(--radius-sm); font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.35rem;">
              <span style="display: inline-flex; align-items: center;">${icon("lock", { size: 14, stroke: "currentColor" })}</span>
              <span>Customer sign in required to book</span>
            </div>
          ` : ''}

          <button id="btn-detail-book-now" class="btn btn-primary btn-lg" style="width: 100%; margin-bottom: 1rem; gap: 0.5rem; font-weight: 700; box-shadow: 0 4px 16px rgba(15, 76, 58, 0.3);">
            <span>${isCustomer ? 'Book This Service Now' : 'Sign In to Book This Service'}</span>
            <span style="display: flex; align-items: center;">${icon("arrow-right", { size: 16, stroke: "#FFFFFF" })}</span>
          </button>

          <a href="#/services" class="btn btn-glass btn-sm" style="width: 100%; justify-content: center; margin-bottom: 1.25rem;">
            Explore Other Services
          </a>

          <div style="display: flex; flex-direction: column; gap: 0.6rem; padding-top: 1rem; border-top: 1px solid rgba(20, 92, 71, 0.1); font-size: 0.775rem; color: var(--text-muted);">
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              ${icon("shield-check", { size: 15, stroke: "var(--brand-emerald)" })}
              <span>100% Satisfaction Guarantee with free rework</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              ${icon("clock", { size: 15, stroke: "var(--brand-emerald)" })}
              <span>Free cancellation up to 2 hours before your slot</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.4rem;">
              ${icon("lock", { size: 15, stroke: "var(--brand-emerald)" })}
              <span>Secure Razorpay / UPI payment processing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function attachServiceDetailPageEvents(serviceId) {
  const btn = document.getElementById("btn-detail-book-now");
  if (btn) {
    btn.onclick = () => {
      openBookingFlow(serviceId);
    };
  }
}
