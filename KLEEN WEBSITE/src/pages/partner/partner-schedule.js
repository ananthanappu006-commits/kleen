/**
 * KLEEN — Deprecated Schedule Page (Redirects to Gig Market)
 */

import { renderPartnerGigsPage, attachPartnerGigsEvents } from "./partner-gigs.js";

export function renderPartnerSchedulePage() {
  return renderPartnerGigsPage();
}

export function attachPartnerScheduleEvents() {
  attachPartnerGigsEvents();
}
