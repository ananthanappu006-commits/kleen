/**
 * KLEEN — Google Maps API & Location Configuration
 * 
 * Replace 'YOUR_GOOGLE_MAPS_API_KEY' with your actual Google Maps JavaScript API key
 * from Google Cloud Console (https://console.cloud.google.com/).
 * Enable: Maps JavaScript API, Places API, Geocoding API.
 */

export const mapsConfig = {
  apiKey: "YOUR_GOOGLE_MAPS_API_KEY",
  defaultCenter: {
    lat: 8.5241, // Thiruvananthapuram, Kerala
    lng: 76.9366
  },
  defaultZoom: 15,
  libraries: ["places", "geometry"]
};

export const isGoogleMapsConfigured = () => {
  return mapsConfig.apiKey && 
         mapsConfig.apiKey !== "YOUR_GOOGLE_MAPS_API_KEY" && 
         mapsConfig.apiKey.trim().length > 10;
};
