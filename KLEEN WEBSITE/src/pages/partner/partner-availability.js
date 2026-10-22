/**
 * KLEEN — Deprecated Availability Page (Redirects to Gig Market)
 */

import { renderPartnerGigsPage, attachPartnerGigsEvents } from "./partner-gigs.js";

export function renderPartnerAvailabilityPage() {
  return renderPartnerGigsPage();
}

export function attachPartnerAvailabilityEvents() {
  attachPartnerGigsEvents();
}
