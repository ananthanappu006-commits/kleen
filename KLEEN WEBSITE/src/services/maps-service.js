/**
 * KLEEN — Google Maps Service
 * Handles map rendering, interactive pin placement, geolocation, reverse geocoding,
 * and live active-booking map tracking.
 */

import { mapsConfig, isGoogleMapsConfigured } from "../config/maps-config.js";

let googleMapsPromise = null;

/**
 * Dynamically loads Google Maps JavaScript SDK
 */
export function loadGoogleMapsScript() {
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  googleMapsPromise = new Promise((resolve, reject) => {
    if (!isGoogleMapsConfigured()) {
      // Return null to activate interactive fallback map engine
      resolve(null);
      return;
    }

    const script = document.createElement("script");
    const libraries = mapsConfig.libraries ? mapsConfig.libraries.join(",") : "places";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapsConfig.apiKey}&libraries=${libraries}&callback=__kleenGoogleMapsInit`;
    script.async = true;
    script.defer = true;

    window.__kleenGoogleMapsInit = () => {
      delete window.__kleenGoogleMapsInit;
      resolve(window.google.maps);
    };

    script.onerror = (err) => {
      console.warn("Failed to load Google Maps JS API, switching to fallback interactive map picker:", err);
      resolve(null);
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

/**
 * Reverse Geocode (convert Lat/Lng coordinates into address components)
 */
export async function reverseGeocode(lat, lng) {
  try {
    const gmaps = await loadGoogleMapsScript();
    if (gmaps && gmaps.Geocoder) {
      const geocoder = new gmaps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results && response.results[0]) {
        const result = response.results[0];
        const address = parseGoogleAddressComponents(result.address_components, result.formatted_address);
        return { ...address, lat, lng };
      }
    }
  } catch (e) {
    console.warn("Google Geocoder error, attempting fallback reverse geocode:", e);
  }

  // Fallback reverse geocoding using open nominatim / client simulation
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      return {
        house: addr.house_number || addr.building || "",
        street: addr.road || addr.suburb || addr.neighbourhood || "Service Street",
        area: addr.suburb || addr.residential || addr.neighbourhood || addr.city_district || "",
        city: addr.city || addr.town || addr.state_district || "Thiruvananthapuram",
        pinCode: addr.postcode || "695001",
        formattedAddress: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        lat,
        lng
      };
    }
  } catch (err) {
    console.warn("Fallback geocoder fetch error:", err);
  }

  return {
    house: "",
    street: "Locality / Pinpoint Location",
    area: "",
    city: "Thiruvananthapuram",
    pinCode: "695001",
    formattedAddress: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
    lat,
    lng
  };
}

function parseGoogleAddressComponents(components, formattedAddress) {
  let house = "";
  let street = "";
  let area = "";
  let city = "";
  let pinCode = "";

  components.forEach(comp => {
    const types = comp.types;
    if (types.includes("street_number") || types.includes("premise") || types.includes("building")) {
      house = comp.long_name;
    } else if (types.includes("route")) {
      street = comp.long_name;
    } else if (types.includes("sublocality") || types.includes("neighborhood") || types.includes("sublocality_level_1")) {
      area = comp.long_name;
    } else if (types.includes("locality")) {
      city = comp.long_name;
    } else if (types.includes("postal_code")) {
      pinCode = comp.long_name;
    }
  });

  if (!street && area) street = area;
  if (!city) city = "Thiruvananthapuram";

  return {
    house,
    street: street || "Main Street",
    area: area || street,
    city,
    pinCode: pinCode || "695001",
    formattedAddress
  };
}

/**
 * Initializes Location Picker in target container
 * Supports Google Maps API or high-performance Interactive Leaflet fallback
 */
export async function initLocationPicker(containerEl, options = {}) {
  if (!containerEl) return null;

  const defaultLat = options.initialLat || mapsConfig.defaultCenter.lat;
  const defaultLng = options.initialLng || mapsConfig.defaultCenter.lng;
  const onLocationChange = options.onLocationChange || (() => {});

  let currentLat = defaultLat;
  let currentLng = defaultLng;

  // Build UI Container Structure
  containerEl.innerHTML = `
    <div class="gmaps-picker-wrapper">
      <div class="gmaps-search-bar">
        <input type="text" id="gmaps-search-input" class="gmaps-input" placeholder="Search area, apartment, street or landmark..." autocomplete="off">
        <button type="button" id="gmaps-btn-locate" class="gmaps-locate-btn" title="Detect current GPS location">
          Detect Location
        </button>
      </div>

      <div id="gmaps-canvas" class="gmaps-canvas"></div>

      <div class="gmaps-location-bar">
        <div style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Selected Map Location</div>
        <div id="gmaps-address-text" style="font-size: 0.85rem; font-weight: 600; color: var(--brand-emerald-dark); margin-top: 0.15rem; word-break: break-word;">
          Fetching location address...
        </div>
        <div style="font-size: 0.725rem; color: var(--text-muted); margin-top: 0.25rem; display: flex; gap: 0.75rem;">
          <span>Lat: <strong id="gmaps-lat-display">${defaultLat.toFixed(5)}</strong></span>
          <span>Lng: <strong id="gmaps-lng-display">${defaultLng.toFixed(5)}</strong></span>
        </div>
      </div>
    </div>
  `;

  const canvasEl = containerEl.querySelector("#gmaps-canvas");
  const searchInput = containerEl.querySelector("#gmaps-search-input");
  const locateBtn = containerEl.querySelector("#gmaps-btn-locate");
  const addressText = containerEl.querySelector("#gmaps-address-text");
  const latDisplay = containerEl.querySelector("#gmaps-lat-display");
  const lngDisplay = containerEl.querySelector("#gmaps-lng-display");

  const updateLocationDetails = async (lat, lng, labelText = null) => {
    currentLat = lat;
    currentLng = lng;
    latDisplay.textContent = lat.toFixed(5);
    lngDisplay.textContent = lng.toFixed(5);

    if (labelText) {
      addressText.textContent = labelText;
    } else {
      addressText.textContent = "Updating address from pin...";
    }

    const addr = await reverseGeocode(lat, lng);
    if (!labelText && addr.formattedAddress) {
      addressText.textContent = addr.formattedAddress;
    }
    onLocationChange({ lat, lng, address: addr });
  };

  const gmaps = await loadGoogleMapsScript();

  if (gmaps) {
    // Official Google Maps SDK initialized
    const map = new gmaps.Map(canvasEl, {
      center: { lat: defaultLat, lng: defaultLng },
      zoom: mapsConfig.defaultZoom,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
      styles: [
        { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] }
      ]
    });

    const marker = new gmaps.Marker({
      position: { lat: defaultLat, lng: defaultLng },
      map: map,
      draggable: true,
      animation: gmaps.Animation.DROP,
      title: "Drag to pinpoint location"
    });

    marker.addListener("dragend", () => {
      const pos = marker.getPosition();
      updateLocationDetails(pos.lat(), pos.lng());
    });

    map.addListener("click", (e) => {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      marker.setPosition({ lat, lng });
      updateLocationDetails(lat, lng);
    });

    // Places Autocomplete
    if (gmaps.places && gmaps.places.Autocomplete) {
      const autocomplete = new gmaps.places.Autocomplete(searchInput);
      autocomplete.bindTo("bounds", map);
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry && place.geometry.location) {
          map.setCenter(place.geometry.location);
          map.setZoom(16);
          marker.setPosition(place.geometry.location);
          updateLocationDetails(
            place.geometry.location.lat(),
            place.geometry.location.lng(),
            place.formatted_address || place.name
          );
        }
      });
    }

    // GPS Geolocation Button
    locateBtn.onclick = () => {
      if (navigator.geolocation) {
        locateBtn.textContent = "Locating...";
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            locateBtn.textContent = "Detect Location";
            map.setCenter({ lat, lng });
            map.setZoom(17);
            marker.setPosition({ lat, lng });
            updateLocationDetails(lat, lng);
          },
          (err) => {
            locateBtn.textContent = "Detect Location";
            alert("Could not detect location. Please check browser permissions.");
          }
        );
      }
    }

    // Initial update
    updateLocationDetails(defaultLat, defaultLng);

    return {
      getCoordinates: () => ({ lat: currentLat, lng: currentLng }),
      setCenter: (lat, lng) => {
        map.setCenter({ lat, lng });
        marker.setPosition({ lat, lng });
        updateLocationDetails(lat, lng);
      }
    };
  } else {
    // High-performance Leaflet OpenStreetMap fallback map loader
    return initLeafletFallbackPicker(canvasEl, searchInput, locateBtn, defaultLat, defaultLng, updateLocationDetails);
  }
}

/**
 * Fallback Leaflet Map Picker Engine
 */
function initLeafletFallbackPicker(canvasEl, searchInput, locateBtn, defaultLat, defaultLng, updateLocationDetails) {
  // Ensure Leaflet CSS & JS are loaded dynamically
  return new Promise((resolve) => {
    const loadLeaflet = () => {
      if (!window.L) {
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(css);

        const script = document.createElement("script");
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => setupLeafletMap();
        document.head.appendChild(script);
      } else {
        setupLeafletMap();
      }
    };

    const setupLeafletMap = () => {
      if (!canvasEl) return;
      const L = window.L;
      canvasEl.style.height = "260px";
      canvasEl.style.borderRadius = "12px";

      const map = L.map(canvasEl).setView([defaultLat, defaultLng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      const customIcon = L.divIcon({
        className: 'custom-map-pin',
        html: `<div style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35)); cursor: pointer; display: flex; align-items: center; justify-content: center;"><svg width="32" height="32" viewBox="0 0 24 24" fill="#10B981" stroke="#09281E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="#FFFFFF"/></svg></div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      });

      const marker = L.marker([defaultLat, defaultLng], {
        draggable: true,
        icon: customIcon
      }).addTo(map);

      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        updateLocationDetails(pos.lat, pos.lng);
      });

      map.on('click', (e) => {
        marker.setLatLng(e.latlng);
        updateLocationDetails(e.latlng.lat, e.latlng.lng);
      });

      // Search functionality via Nominatim
      let searchTimeout = null;
      searchInput.oninput = () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
          const query = searchInput.value.trim();
          if (query.length < 3) return;
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`);
            if (res.ok) {
              const results = await res.json();
              if (results && results[0]) {
                const lat = parseFloat(results[0].lat);
                const lng = parseFloat(results[0].lon);
                map.setView([lat, lng], 16);
                marker.setLatLng([lat, lng]);
                updateLocationDetails(lat, lng, results[0].display_name);
              }
            }
          } catch (err) {
            console.warn("Search geocode error:", err);
          }
        }, 600);
      };

      locateBtn.onclick = () => {
        if (navigator.geolocation) {
          locateBtn.textContent = "Locating...";
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              locateBtn.textContent = "Detect Location";
              map.setView([lat, lng], 17);
              marker.setLatLng([lat, lng]);
              updateLocationDetails(lat, lng);
            },
            (err) => {
              locateBtn.textContent = "Detect Location";
              alert("Unable to detect current GPS location.");
            }
          );
        }
      };

      updateLocationDetails(defaultLat, defaultLng);

      // Fix Leaflet map sizing inside modal
      setTimeout(() => {
        map.invalidateSize();
      }, 300);

      resolve({
        getCoordinates: () => ({ lat: marker.getLatLng().lat, lng: marker.getLatLng().lng }),
        setCenter: (lat, lng) => {
          map.setView([lat, lng], 16);
          marker.setLatLng([lat, lng]);
          updateLocationDetails(lat, lng);
        }
      });
    };

    loadLeaflet();
  });
}

/**
 * Render Active Booking Live Tracker Map Preview
 */
export async function renderBookingTrackerMap(containerEl, options = {}) {
  if (!containerEl) return;

  const serviceLat = options.serviceLat || 12.9716;
  const serviceLng = options.serviceLng || 77.5946;
  const partnerLat = options.partnerLat || (serviceLat - 0.008);
  const partnerLng = options.partnerLng || (serviceLng - 0.006);

  containerEl.innerHTML = `
    <div style="width: 100%; height: 220px; border-radius: 12px; overflow: hidden; position: relative;" id="tracker-map-canvas">
    </div>
  `;

  const canvas = containerEl.querySelector("#tracker-map-canvas");
  const gmaps = await loadGoogleMapsScript();

  if (gmaps) {
    const map = new gmaps.Map(canvas, {
      center: { lat: (serviceLat + partnerLat) / 2, lng: (serviceLng + partnerLng) / 2 },
      zoom: 14,
      mapTypeControl: false,
      streetViewControl: false
    });

    new gmaps.Marker({
      position: { lat: serviceLat, lng: serviceLng },
      map,
      title: "Service Location",
      label: "S"
    });

    if (options.showPartner) {
      new gmaps.Marker({
        position: { lat: partnerLat, lng: partnerLng },
        map,
        title: options.partnerName || "Partner",
        label: "P"
      });
    }
  } else {
    // Leaflet preview
    if (!window.L) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(css);

      const script = document.createElement("script");
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => buildLeafletTracker();
      document.head.appendChild(script);
    } else {
      buildLeafletTracker();
    }

    function buildLeafletTracker() {
      const L = window.L;
      const map = L.map(canvas, { zoomControl: false }).setView([serviceLat, serviceLng], 14);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

      const houseIcon = L.divIcon({
        html: `<div style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3)); display:flex; align-items:center; justify-content:center; width:34px; height:34px; background:#065F46; border-radius:50%; border:2px solid #FFF;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>`,
        iconSize: [30, 30]
      });
      L.marker([serviceLat, serviceLng], { icon: houseIcon }).addTo(map).bindPopup("Service Location");

      if (options.showPartner) {
        const maidIcon = L.divIcon({
          html: `<div style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3)); display:flex; align-items:center; justify-content:center; width:34px; height:34px; background:#D97706; border-radius:50%; border:2px solid #FFF;"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="7" r="4"/><path d="M5.5 21a8.38 8.38 0 0 1 13 0"/></svg></div>`,
          iconSize: [30, 30]
        });
        L.marker([partnerLat, partnerLng], { icon: maidIcon }).addTo(map).bindPopup(options.partnerName || "Partner On The Way");
      }

      setTimeout(() => map.invalidateSize(), 300);
    }
  }
}
