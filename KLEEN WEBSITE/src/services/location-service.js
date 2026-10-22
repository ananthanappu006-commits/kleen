/**
 * KLEEN — Location Service
 * Global location state management and Google Maps Places API location picker modal.
 */

import { modal } from "../components/modal.js";
import { toast } from "../components/toast.js";
import { initLocationPicker } from "./maps-service.js";
import { icon } from "../components/icons.js";


const STORAGE_KEY = "kleen_user_location";

const DEFAULT_LOCATION = {
  address: "Add Location",
  area: "Add Location",
  city: "Thiruvananthapuram",
  lat: 8.5241,
  lng: 76.9366,
  isPrompt: true
};

/**
 * Get current stored location or default location
 */
export function getStoredLocation() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.address && parsed.address !== "HSR Layout, Bengaluru" && !parsed.address.includes("Bengaluru")) return parsed;
    }
  } catch (err) {
    console.warn("Failed to read location from localStorage:", err);
  }
  return { ...DEFAULT_LOCATION };
}

/**
 * Save selected location to localStorage and broadcast event
 */
export function saveStoredLocation(loc) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    window.dispatchEvent(new CustomEvent("kleen:location-changed", { detail: loc }));
  } catch (err) {
    console.warn("Failed to save location to localStorage:", err);
  }
}

/**
 * Open interactive Google Maps Places API location picker modal
 */
export function openLocationPickerModal(onConfirmCallback = null) {
  let currentLocation = getStoredLocation();
  let pendingLocation = { ...currentLocation };

  modal.open({
    title: "Select Service Location",
    maxWidth: "640px",
    bodyHtml: `
      <div style="margin-bottom: 1rem;">
        <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.5; margin-bottom: 0.75rem;">
          Search any area, landmark, or street using Google Maps Places API, drag the pin to your exact spot, or click <strong>Detect Location</strong>.
        </p>
      </div>

      <div id="modal-gmaps-picker-mount"></div>
    `,
    footerHtml: `
      <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
        <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1; overflow: hidden; margin-right: 1rem;">
          <span style="display: flex; align-items: center; color: var(--brand-emerald);">${icon("map-pin", { size: 16, stroke: "var(--brand-emerald)" })}</span>
          <span id="modal-location-status" style="font-size: 0.825rem; font-weight: 600; color: var(--brand-emerald-dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${currentLocation.address === "Add Location" ? "Search or pin your exact location" : currentLocation.address}
          </span>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-shrink: 0;">
          <button class="btn btn-secondary btn-sm" id="btn-cancel-location">Cancel</button>
          <button class="btn btn-primary btn-sm" id="btn-confirm-location">Set Location</button>
        </div>
      </div>
    `,
    onOpen: async (container) => {
      const mountEl = container.querySelector("#modal-gmaps-picker-mount");
      const statusEl = container.querySelector("#modal-location-status");
      const confirmBtn = container.querySelector("#btn-confirm-location");
      const cancelBtn = container.querySelector("#btn-cancel-location");

      cancelBtn.onclick = () => modal.close();

      await initLocationPicker(mountEl, {
        initialLat: currentLocation.lat,
        initialLng: currentLocation.lng,
        onLocationChange: (loc) => {
          const addr = loc.address;
          const formatted = addr.formattedAddress || (addr.area ? `${addr.area}, ${addr.city}` : `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`);
          
          pendingLocation = {
            address: formatted,
            area: addr.area || addr.street || "Selected Area",
            city: addr.city || "Thiruvananthapuram",
            lat: loc.lat,
            lng: loc.lng
          };

          if (statusEl) {
            statusEl.textContent = pendingLocation.address;
          }
        }
      });

      confirmBtn.onclick = () => {
        saveStoredLocation(pendingLocation);
        modal.close();
        toast.success("Location Updated", `Service location set to ${pendingLocation.address}`);
        if (onConfirmCallback) {
          onConfirmCallback(pendingLocation);
        }
      };
    }
  });
}
