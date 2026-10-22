/**
 * KLEEN — Services Catalog Page
 * Real-time search, category filters, price sorting, and dynamic grid.
 */

import { db } from "../../services/db-service.js";
import { openBookingFlow } from "../customer/customer-view.js";
import { icon } from "../../components/icons.js";

export function renderServicesPage() {
  const categories = db.getCategories();
  const allServices = db.getServices();

  return `
    <div class="app-container" style="padding: 2.5rem 1rem 5rem;">
      <div style="margin-bottom: 2rem;">
        <span class="badge badge-info" style="margin-bottom: 0.5rem;">Explore Catalog</span>
        <h2>All Home Care Services</h2>
        <p style="color: var(--text-muted);">Verified domestic helpers, maid services, and deep cleaning for urban homes.</p>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="glass-card" style="padding: 1.25rem 1.5rem; margin-bottom: 2rem; display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
          <div style="flex: 1; min-width: 260px; position: relative; display: flex; align-items: center;">
            <span style="position: absolute; left: 12px; display: flex; align-items: center; color: var(--text-muted); pointer-events: none;">
              ${icon("search", { size: 16, stroke: "var(--text-muted)" })}
            </span>
            <input type="text" id="catalog-search-input" class="form-input" placeholder="Search by service name or task..." style="padding-left: 2.25rem;">
          </div>

          <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
            <select id="catalog-sort-select" class="form-select" style="width: auto;">
              <option value="popular">Sort: Most Popular</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        <!-- Category Filter Pills -->
        <div class="chip-group" id="catalog-cat-chips">
          <button class="chip-btn active" data-cat="all">All Services</button>
          ${categories.map(c => `
            <button class="chip-btn" data-cat="${c.categoryId}">${c.name}</button>
          `).join("")}
        </div>
      </div>

      <!-- Result Counter -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <span id="catalog-results-count" style="font-size: 0.875rem; color: var(--text-muted); font-weight: 600;">
          Showing ${allServices.length} available services
        </span>
      </div>

      <!-- Services Grid -->
      <div class="services-grid" id="catalog-services-container">
        ${renderServiceCards(allServices)}
      </div>
    </div>
  `;
}

function renderServiceCards(services) {
  if (!services || services.length === 0) {
    return `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem; background: #FFFFFF; border-radius: var(--radius-lg); border: 1px solid #E5E7EB;">
        <div style="display: flex; justify-content: center; margin-bottom: 1rem;">
          ${icon("search", { size: 40, stroke: "var(--brand-emerald)" })}
        </div>
        <h3>No matching services found</h3>
        <p style="color: var(--text-muted); margin-top: 0.25rem;">Try adjusting your search keywords or filter criteria.</p>
      </div>
    `;
  }

  return services.map(srv => `
    <div class="service-card animate-fade-in" data-service-id="${srv.serviceId}">
      <div class="service-image-box btn-view-detail" data-id="${srv.serviceId}" style="cursor: pointer;" title="View detailed information for ${srv.name}">
        <img src="${srv.image}" alt="${srv.name}" class="service-img" loading="lazy">
        <span class="service-badge">${srv.duration}</span>
        <span class="service-rating">${icon("star", { size: 12, fill: "#F59E0B", stroke: "#F59E0B" })} ${srv.rating} (${srv.reviewCount})</span>
      </div>
      <div class="service-content">
        <h3 class="service-name btn-view-detail" data-id="${srv.serviceId}" style="cursor: pointer;" title="View detailed information for ${srv.name}">${srv.name}</h3>
        <p class="service-desc">${srv.description}</p>
        
        <div class="service-meta">
          <div class="service-meta-item">
            <span>${icon("shield-check", { size: 15, stroke: "var(--brand-emerald)" })}</span>
            <span>Verified Maid</span>
          </div>
          <div class="service-meta-item">
            <span>${icon("leaf", { size: 15, stroke: "var(--brand-emerald)" })}</span>
            <span>Chemicals Included</span>
          </div>
        </div>

        <div class="service-footer">
          <div class="service-price-block">
            <span class="price-label">Starting From</span>
            <span class="price-amount">₹${srv.price}</span>
          </div>
          <div style="display: flex; gap: 0.5rem;">
            <a href="#/services/${srv.serviceId}" class="btn btn-glass btn-sm">Details</a>
            <button class="btn btn-primary btn-sm btn-catalog-book" data-id="${srv.serviceId}">Book Now</button>
          </div>
        </div>
      </div>
    </div>
  `).join("");
}

export function attachServicesPageEvents() {
  const searchInput = document.getElementById("catalog-search-input");
  const sortSelect = document.getElementById("catalog-sort-select");
  const catChips = document.querySelectorAll("#catalog-cat-chips .chip-btn");
  const container = document.getElementById("catalog-services-container");
  const countLabel = document.getElementById("catalog-results-count");

  let activeCat = "all";
  let searchQuery = "";
  let currentSort = "popular";

  // Parse query parameters from URL hash (#/services?cat=...&q=...)
  const hash = window.location.hash || "";
  const qIndex = hash.indexOf("?");
  if (qIndex !== -1) {
    const params = new URLSearchParams(hash.substring(qIndex + 1));
    const catParam = params.get("cat");
    const qParam = params.get("q");

    if (catParam) {
      activeCat = catParam;
      catChips.forEach(chip => {
        if (chip.getAttribute("data-cat") === catParam) {
          chip.classList.add("active");
        } else {
          chip.classList.remove("active");
        }
      });
    }

    if (qParam) {
      searchQuery = qParam;
      if (searchInput) searchInput.value = qParam;
    }
  }

  const filterAndRender = () => {
    let list = db.getServices();

    if (activeCat !== "all") {
      list = list.filter(s => s.categoryId === activeCat);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.description.toLowerCase().includes(q) ||
        (s.includedTasks && s.includedTasks.some(t => t.toLowerCase().includes(q)))
      );
    }

    if (currentSort === "price-asc") {
      list.sort((a, b) => a.price - b.price);
    } else if (currentSort === "price-desc") {
      list.sort((a, b) => b.price - a.price);
    } else if (currentSort === "rating") {
      list.sort((a, b) => b.rating - a.rating);
    }

    if (container) {
      container.innerHTML = renderServiceCards(list);
    }
    if (countLabel) {
      countLabel.textContent = `Showing ${list.length} available service${list.length === 1 ? "" : "s"}`;
    }

    // Re-attach book buttons & card detail links
    if (container) {
      container.querySelectorAll(".btn-catalog-book").forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const sId = btn.getAttribute("data-id");
          openBookingFlow(sId);
        };
      });

      container.querySelectorAll(".btn-view-detail").forEach(el => {
        el.onclick = () => {
          const sId = el.getAttribute("data-id");
          if (sId) {
            window.location.hash = `#/services/${sId}`;
          }
        };
      });
    }
  };

  // Run initial filter
  filterAndRender();

  if (searchInput) {
    searchInput.oninput = (e) => {
      searchQuery = e.target.value;
      filterAndRender();
    };
  }

  if (sortSelect) {
    sortSelect.onchange = (e) => {
      currentSort = e.target.value;
      filterAndRender();
    };
  }

  catChips.forEach(chip => {
    chip.onclick = () => {
      catChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      activeCat = chip.getAttribute("data-cat");
      filterAndRender();
    };
  });
}

