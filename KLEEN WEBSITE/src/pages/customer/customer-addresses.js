/**
 * KLEEN — Customer Address Management Page (/customer/addresses)
 */

import { auth } from "../../services/auth-service.js";
import { db } from "../../services/db-service.js";
import { modal } from "../../components/modal.js";
import { toast } from "../../components/toast.js";
import { initLocationPicker } from "../../services/maps-service.js";
import { icon } from "../../components/icons.js";
import { renderDistrictOptions, DEFAULT_STATE, DEFAULT_DISTRICT } from "../../config/kerala-districts.js";


export function renderCustomerAddressesPage() {
  const user = auth.getCurrentUser();
  if (!user) {
    return `
      <div class="app-container" style="max-width: 480px; padding: 4rem 1rem 6rem; text-align: center;">
        <div class="solid-card" style="padding: 3rem 2rem;">
          <div style="display: flex; justify-content: center; margin-bottom: 1rem; color: var(--brand-emerald);">
            ${icon("map-pin", { size: 36, stroke: "var(--brand-emerald)" })}
          </div>
          <h2>Address Book</h2>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0.5rem 0 1.5rem;">Please sign in to view and manage your saved cleaning locations.</p>
          <a href="#/login" class="btn btn-primary btn-md">Go to Sign In</a>
        </div>
      </div>
    `;
  }

  const addresses = db.getCustomerAddresses(user.userId);

  return `
    <div class="app-container" style="max-width: 800px; padding: 3rem 1rem 6rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <div>
          <span class="badge badge-info" style="margin-bottom: 0.35rem;">Address Book</span>
          <h2>Saved Cleaning Locations</h2>
        </div>
        <button id="btn-page-add-addr" class="btn btn-primary btn-sm">+ Add New Address</button>
      </div>

      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${addresses.length === 0 ? `
          <div class="solid-card" style="padding: 3rem 1.5rem; text-align: center;">
            <div style="display: flex; justify-content: center; margin-bottom: 1rem; color: var(--brand-emerald);">
              ${icon("map-pin", { size: 36, stroke: "var(--brand-emerald)" })}
            </div>
            <h3 style="margin-bottom: 0.5rem;">No Saved Addresses Yet</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; max-width: 380px; margin: 0 auto 1.5rem;">
              You have not saved any cleaning locations yet. Add your home or office address to book services quickly.
            </p>
            <button id="btn-empty-add-addr" class="btn btn-primary btn-md">+ Add Your First Address</button>
          </div>
        ` : addresses.map(addr => `
          <div class="solid-card" style="padding: 1.5rem; display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.35rem;">
                <span style="display: flex; align-items: center; color: var(--brand-emerald);">${icon("map-pin", { size: 16, stroke: "var(--brand-emerald)" })}</span>
                <h4 style="font-size: 1.05rem;">${addr.label}</h4>
                ${addr.isDefault ? `<span class="badge badge-success">DEFAULT</span>` : ''}
              </div>
              <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">
                ${addr.house}, ${addr.street}, ${addr.area}, ${addr.district || addr.city}, ${addr.state || DEFAULT_STATE} - ${addr.pinCode}
              </p>
              ${addr.landmark ? `<p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">Landmark: ${addr.landmark}</p>` : ''}
              ${addr.lat && addr.lng ? `<p style="font-size: 0.75rem; color: var(--brand-emerald-dark); margin-top: 0.25rem; display: flex; align-items: center; gap: 0.35rem;"><span>Coordinates:</span> ${addr.lat.toFixed(4)}, ${addr.lng.toFixed(4)}</p>` : ''}
            </div>

            <div style="display: flex; gap: 0.5rem;">
              ${!addr.isDefault ? `
                <button class="btn btn-glass btn-sm btn-set-default-addr" data-id="${addr.addressId}">Set Default</button>
              ` : ''}
              <button class="btn btn-danger btn-sm btn-delete-addr" data-id="${addr.addressId}" data-label="${addr.label}">Delete</button>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

export function attachCustomerAddressesEvents() {
  // Delete with confirmation modal
  document.querySelectorAll(".btn-delete-addr").forEach(btn => {
    btn.onclick = () => {
      const addrId = btn.getAttribute("data-id");
      const label = btn.getAttribute("data-label");

      modal.open({
        title: "Delete Address",
        maxWidth: "420px",
        bodyHtml: `
          <p style="font-size: 0.9rem; color: var(--text-secondary);">
            Are you sure you want to remove <strong>${label}</strong> from your address book?
          </p>
        `,
        footerHtml: `
          <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">Cancel</button>
          <button class="btn btn-danger btn-sm" id="btn-confirm-del-addr">Confirm Delete</button>
        `,
        onOpen: (container) => {
          container.querySelector("#btn-confirm-del-addr").onclick = () => {
            const user = auth.getCurrentUser();
            if (!user) return;
            const snapshot = db.getSnapshot();
            snapshot.users = (snapshot.users || []).map(u => {
              if (u.userId === user.userId) {
                return { ...u, addresses: (u.addresses || []).filter(a => a.addressId !== addrId) };
              }
              return u;
            });
            db.saveSnapshot(snapshot);
            modal.close();
            toast.success("Address Removed", "The address was deleted.");
            window.location.reload();
          };
        }
      });
    };
  });

  // Set Default
  document.querySelectorAll(".btn-set-default-addr").forEach(btn => {
    btn.onclick = () => {
      const addrId = btn.getAttribute("data-id");
      const user = auth.getCurrentUser();
      if (!user) return;
      const snapshot = db.getSnapshot();
      snapshot.users = (snapshot.users || []).map(u => {
        if (u.userId === user.userId) {
          return {
            ...u,
            addresses: (u.addresses || []).map(a => ({ ...a, isDefault: a.addressId === addrId }))
          };
        }
        return u;
      });
      db.saveSnapshot(snapshot);
      toast.success("Default Address Updated", "Your preferred cleaning location was updated.");
      window.location.reload();
    };
  });

  // Add Address Modal on addresses page with Google Map Location Picker
  const openAddModal = () => {
    const user = auth.getCurrentUser();
    if (!user) {
      toast.info("Please Sign In", "Sign in to save addresses to your profile.");
      window.location.hash = "#/login";
      return;
    }

    let selectedCoords = { lat: 12.9716, lng: 77.5946 };

    modal.open({
      title: "Add New Service Address",
      maxWidth: "560px",
      bodyHtml: `
        <div class="form-group">
          <label class="form-label" style="font-weight: 700; color: var(--brand-emerald-dark);">Pinpoint Location on Map</label>
          <div id="modal-map-picker" style="min-height: 280px;"></div>
        </div>

        <div class="form-group">
          <label class="form-label">Address Label</label>
          <input type="text" id="page-new-addr-label" class="form-input" placeholder="e.g. Home, Office, Parents' Flat">
        </div>
        <div class="form-group">
          <label class="form-label">Flat / House / Building Number</label>
          <input type="text" id="page-new-addr-house" class="form-input" placeholder="e.g. Flat 301, Tower B">
        </div>
        <div class="form-group">
          <label class="form-label">Street / Colony</label>
          <input type="text" id="page-new-addr-street" class="form-input" placeholder="e.g. 5th Main, 4th Block">
        </div>
        <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">District (Kerala) *</label>
            <select id="page-new-addr-city" class="form-select" required>
              ${renderDistrictOptions(DEFAULT_DISTRICT)}
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">State *</label>
            <input type="text" id="page-new-addr-state" class="form-input" value="${DEFAULT_STATE}" readonly style="background: #F8FAFC;" required>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">PIN Code *</label>
            <input type="text" id="page-new-addr-pin" class="form-input" placeholder="695001" required pattern="[0-9]{6}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Nearby Landmark (Optional)</label>
          <input type="text" id="page-new-addr-landmark" class="form-input" placeholder="e.g. Near Community Center">
        </div>
      `,
      footerHtml: `
        <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">Cancel</button>
        <button class="btn btn-primary btn-sm" id="btn-save-page-addr">Save Address</button>
      `,
      onOpen: (container) => {
        const mapMount = container.querySelector("#modal-map-picker");
        const streetInput = container.querySelector("#page-new-addr-street");
        const cityInput = container.querySelector("#page-new-addr-city");
        const stateInput = container.querySelector("#page-new-addr-state");
        const pinInput = container.querySelector("#page-new-addr-pin");

        initLocationPicker(mapMount, {
          initialLat: 9.9312,
          initialLng: 76.2673,
          onLocationChange: ({ lat, lng, address }) => {
            selectedCoords = { lat, lng };
            if (address) {
              if (address.street && !streetInput.value) streetInput.value = address.street;
              if (address.city) {
                const matched = Array.from(cityInput.options).find(o => o.value.toLowerCase() === address.city.toLowerCase());
                if (matched) cityInput.value = matched.value;
              }
              if (address.pinCode) pinInput.value = address.pinCode;
            }
          }
        });

        container.querySelector("#btn-save-page-addr").onclick = () => {
          const label = container.querySelector("#page-new-addr-label").value.trim();
          const house = container.querySelector("#page-new-addr-house").value.trim();
          const street = container.querySelector("#page-new-addr-street").value.trim();
          const city = container.querySelector("#page-new-addr-city").value.trim();
          const state = (stateInput?.value.trim()) || DEFAULT_STATE;
          const pinCode = container.querySelector("#page-new-addr-pin").value.trim();
          const landmark = container.querySelector("#page-new-addr-landmark").value.trim();

          if (!label || !house || !street || !city) {
            toast.error("Required Fields", "Please enter address label, house number, street, and district.");
            return;
          }

          db.addCustomerAddress(user.userId, {
            label,
            house,
            street,
            area: street,
            district: city,
            city: city || DEFAULT_DISTRICT,
            state: state || DEFAULT_STATE,
            pinCode: pinCode || "695001",
            landmark,
            lat: selectedCoords.lat,
            lng: selectedCoords.lng
          });

          modal.close();
          toast.success("Address Saved", "Your new location was saved with map coordinates.");
          window.location.reload();
        };
      }
    });
  };

  const pageAddBtn = document.getElementById("btn-page-add-addr");
  if (pageAddBtn) pageAddBtn.onclick = openAddModal;

  const emptyAddBtn = document.getElementById("btn-empty-add-addr");
  if (emptyAddBtn) emptyAddBtn.onclick = openAddModal;
}

