/**
 * KLEEN — Kerala Districts & State Configuration
 * 14 Administrative Districts of Kerala
 */

export const KERALA_DISTRICTS = [
  "Alappuzha",
  "Ernakulam",
  "Idukki",
  "Kannur",
  "Kasaragod",
  "Kollam",
  "Kottayam",
  "Kozhikode",
  "Malappuram",
  "Palakkad",
  "Pathanamthitta",
  "Thiruvananthapuram",
  "Thrissur",
  "Wayanad"
];

export const DEFAULT_STATE = "Kerala";
export const DEFAULT_DISTRICT = "Thiruvananthapuram";

/**
 * Generates <option> tags for the 14 Kerala districts
 * @param {string} selectedDistrict Currently selected district name
 * @param {boolean} includePlaceholder Whether to include a "Select District" placeholder option
 * @returns {string} HTML string of <option> tags
 */
export function renderDistrictOptions(selectedDistrict = DEFAULT_DISTRICT, includePlaceholder = false) {
  const options = [];
  if (includePlaceholder) {
    options.push(`<option value="" ${!selectedDistrict ? "selected" : ""} disabled>Select District</option>`);
  }

  KERALA_DISTRICTS.forEach(district => {
    const isSelected = selectedDistrict && 
      district.toLowerCase() === String(selectedDistrict).trim().toLowerCase();
    options.push(`<option value="${district}" ${isSelected ? "selected" : ""}>${district}</option>`);
  });

  return options.join("\n");
}
