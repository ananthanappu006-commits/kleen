/**
 * KLEEN — Partner Gigs Time Slot Booking System (/partner/gigs)
 * 
 * Allows partners to book their working gig time slots up to 3 days in advance
 * from the current date (Today, Tomorrow, Day after tomorrow).
 */

import { auth } from "../../services/auth-service.js";
import { db } from "../../services/db-service.js";
import { modal } from "../../components/modal.js";
import { toast } from "../../components/toast.js";
import { icon } from "../../components/icons.js";
import {
  renderPartnerHeader,
  renderPartnerSidebar,
  renderPartnerMobileBottomNav,
  attachPartnerNavEvents
} from "./partner-nav.js";

// Standard pre-defined 4-hour gig slots
const STANDARD_GIG_SLOTS = [
  {
    id: "morning",
    title: "Morning Gig Shift",
    timeSlot: "08:00 AM – 12:00 PM",
    startTime: "08:00",
    endTime: "12:00",
    duration: "4.0 hrs",
    description: "Peak hours for full home sweeping, mopping and morning dusting",
    iconName: "clock"
  },
  {
    id: "midday",
    title: "Midday Gig Shift",
    timeSlot: "11:00 AM – 03:00 PM",
    startTime: "11:00",
    endTime: "15:00",
    duration: "4.0 hrs",
    description: "Kitchen vessel cleaning, countertop sanitization & meal assistance",
    iconName: "kitchen"
  },
  {
    id: "afternoon",
    title: "Afternoon Gig Shift",
    timeSlot: "02:00 PM – 06:00 PM",
    startTime: "14:00",
    endTime: "18:00",
    duration: "4.0 hrs",
    description: "Bathroom tile scrubbing, balcony cleaning and laundry folding",
    iconName: "shower"
  },
  {
    id: "evening",
    title: "Evening Gig Shift",
    timeSlot: "05:00 PM – 09:00 PM",
    startTime: "17:00",
    endTime: "21:00",
    duration: "4.0 hrs",
    description: "Post-work tidy up, dishwashing and express surface wipe",
    iconName: "sparkles"
  }
];

let selectedDateIndex = 0; // 0 = Today, 1 = Tomorrow, 2 = Day 3

export function renderPartnerGigsPage() {
  const user = auth.getCurrentUser();
  if (!user || user.role !== "partner") {
    return `
      <div class="app-container" style="max-width: 480px; padding: 4rem 1rem; text-align: center;">
        <div class="solid-card smooth-card" style="padding: 2.5rem; text-align: center;">
          <div class="icon-box icon-box-lg icon-box-amber" style="margin: 0 auto 1.25rem;">
            ${icon("lock", { size: 26, stroke: "#D97706" })}
          </div>
          <h2 style="font-size: 1.4rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">Partner Sign In Required</h2>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0 0 1.5rem; line-height: 1.5;">Please sign in with your verified partner account to book your gig slots.</p>
          <a href="#/partner/login" class="btn btn-primary btn-md" style="width: 100%; font-weight: 700;">Sign In as Partner</a>
        </div>
      </div>
    `;
  }

  const partner = db.getPartnerById(user.userId) || user;
  const partnerId = partner.partnerId || user.userId;

  // Allowed 3-Day Window (Today, Tomorrow, Day 3)
  const allowedDates = db.getPartnerAllowedDateRange();
  const activeDateObj = allowedDates[selectedDateIndex] || allowedDates[0];
  const activeIso = activeDateObj.iso;

  // Retrieve partner's booked slots
  const allBookedSlots = db.getPartnerGigSlots(partnerId);
  const activeDateBookedSlots = allBookedSlots.filter(s => s.date === activeIso);

  // Stats
  const totalSlotsCount = allBookedSlots.length;
  const totalCommittedHours = totalSlotsCount * 4;

  return `
    <div class="partner-layout">
      ${renderPartnerSidebar("/partner/gigs")}

      <div class="partner-main-content">
        ${renderPartnerHeader("/partner/gigs", partner)}

        <div class="partner-dashboard-body" style="padding: 1.5rem 1rem 5rem; max-width: 1280px; margin: 0 auto;">

          <!-- Top Hero Card: Gigs Time Slot Booking -->
          <div class="gig-market-hero animate-fade-in" style="margin-bottom: 2rem; border-radius: 18px; box-shadow: 0 8px 24px rgba(6, 78, 59, 0.2);">
            <div>
              <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 0.5rem;">
                <span class="badge" style="background: rgba(52, 211, 153, 0.2); color: #6EE7B7; border: 1px solid rgba(52, 211, 153, 0.4); font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.35rem;">
                  ${icon("calendar", { size: 14, stroke: "#34D399" })}
                  <span>GIG TIME SLOTS</span>
                </span>
                <span class="badge" style="background: rgba(255,255,255,0.15); color: #FFFFFF; font-size: 0.725rem; font-weight: 600; display: inline-flex; align-items: center; gap: 0.35rem;">
                  ${icon("clock", { size: 13, stroke: "#FFFFFF" })}
                  <span>3-DAY ROLLING WINDOW</span>
                </span>
              </div>
              <h1 style="font-size: clamp(1.6rem, 3vw, 2.2rem); font-weight: 800; margin: 0 0 0.5rem; letter-spacing: -0.02em;">
                Book Your Work Gigs
              </h1>
              <p style="color: #D1FAE5; font-size: 0.925rem; margin: 0; max-width: 620px; line-height: 1.5;">
                Select and confirm your working shifts up to 3 days in advance. Booked gig slots ensure incoming customer requests are routed directly to your schedule.
              </p>
            </div>

            <!-- Stats Pill Box -->
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
              <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 14px; padding: 0.95rem 1.35rem; text-align: center; min-width: 130px;">
                <div style="font-size: 1.75rem; font-weight: 800; color: #34D399;">${totalSlotsCount}</div>
                <div style="font-size: 0.725rem; color: #A7F3D0; text-transform: uppercase; font-weight: 700; letter-spacing: 0.04em;">Slots Booked</div>
              </div>
              <div style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(8px); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 14px; padding: 0.95rem 1.35rem; text-align: center; min-width: 140px;">
                <div style="font-size: 1.75rem; font-weight: 800; color: #FBBF24;">${totalCommittedHours} hrs</div>
                <div style="font-size: 0.725rem; color: #FEF3C7; text-transform: uppercase; font-weight: 700; letter-spacing: 0.04em;">Hours Committed</div>
              </div>
            </div>
          </div>

          <!-- Section 1: 3-Day Rolling Window Date Selector -->
          <div class="solid-card smooth-card" style="padding: 1.5rem 1.75rem; margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <h3 style="margin: 0; font-size: 1.2rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.01em;">
                  Step 1: Choose Date (Rolling 3 Days)
                </h3>
                <p style="font-size: 0.825rem; color: var(--text-muted); margin: 0.2rem 0 0;">
                  Work slot scheduling is strictly available for the next 3 days from the current date.
                </p>
              </div>
              <span class="badge badge-info" style="font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 0.35rem;">
                ${icon("calendar", { size: 14, stroke: "currentColor" })}
                <span>Active: ${activeDateObj.label} (${activeIso})</span>
              </span>
            </div>

            <!-- 3 Day Selector Pills -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 1rem;">
              ${allowedDates.map((dateItem, idx) => {
                const isSelected = idx === selectedDateIndex;
                const bookedCountOnDate = allBookedSlots.filter(s => s.date === dateItem.iso).length;

                return `
                  <button type="button" 
                          class="btn-select-gig-date" 
                          data-index="${idx}"
                          style="background: ${isSelected ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.95) 0%, rgba(15, 76, 58, 0.92) 100%)' : 'rgba(255, 255, 255, 0.68)'}; 
                                 backdrop-filter: blur(16px) saturate(180%);
                                 -webkit-backdrop-filter: blur(16px) saturate(180%);
                                 color: ${isSelected ? '#FFFFFF' : 'var(--text-primary)'}; 
                                 border: 2px solid ${isSelected ? '#064E3B' : 'rgba(255, 255, 255, 0.85)'}; 
                                 border-radius: 16px; 
                                 padding: 1.15rem 1rem; 
                                 text-align: center; 
                                 cursor: pointer; 
                                 transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                                 box-shadow: ${isSelected ? '0 10px 24px rgba(6, 78, 59, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.3)' : '0 4px 16px rgba(0,0,0,0.02), inset 0 1px 1px #FFFFFF'};">
                    <div style="font-size: 0.725rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: ${isSelected ? '#A7F3D0' : 'var(--text-muted)'}; margin-bottom: 0.35rem;">
                      ${idx === 0 ? 'DAY 1 • TODAY' : (idx === 1 ? 'DAY 2 • TOMORROW' : 'DAY 3')}
                    </div>
                    <div style="font-size: 1.25rem; font-weight: 900; margin-bottom: 0.35rem;">
                      ${dateItem.dayName}, ${dateItem.dayNum} ${dateItem.month}
                    </div>
                    <div style="font-size: 0.75rem; font-weight: 600; color: ${isSelected ? '#D1FAE5' : '#64748B'}; display: flex; align-items: center; justify-content: center; gap: 0.35rem;">
                      ${bookedCountOnDate > 0 ? `
                        <span style="display: inline-flex; align-items: center; gap: 0.25rem; color: ${isSelected ? '#6EE7B7' : '#059669'};">
                          ${icon("check", { size: 12, stroke: "currentColor" })} ${bookedCountOnDate} slot${bookedCountOnDate > 1 ? 's' : ''} booked
                        </span>
                      ` : '<span>Available for booking</span>'}
                    </div>
                  </button>
                `;
              }).join("")}
            </div>

            <div style="display: flex; align-items: center; gap: 0.45rem; font-size: 0.775rem; color: var(--text-muted); margin-top: 1rem; padding-top: 0.85rem; border-top: 1px solid #F1F5F9;">
              ${icon("lock", { size: 14, stroke: "currentColor" })}
              <span>Dates beyond 3 days (${allowedDates[2].dayName}, ${allowedDates[2].dayNum} ${allowedDates[2].month}) will automatically unlock as the calendar advances.</span>
            </div>
          </div>

          <!-- Section 2: Time Slot Selector for the Active Date -->
          <div class="solid-card smooth-card" style="padding: 1.5rem 1.75rem; margin-bottom: 2rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.35rem; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <h3 style="margin: 0; font-size: 1.2rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.01em;">
                  Step 2: Select & Book Time Slot for ${activeDateObj.label} (${activeDateObj.dayName}, ${activeDateObj.dayNum} ${activeDateObj.month})
                </h3>
                <p style="font-size: 0.825rem; color: var(--text-muted); margin: 0.2rem 0 0;">
                  Choose the work shifts that match your availability. Multiple slots can be booked on the same day.
                </p>
              </div>
            </div>

            <!-- Standard Gig Slots Grid -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.15rem; margin-bottom: 1.75rem;">
              ${STANDARD_GIG_SLOTS.map(slot => {
                const isBooked = activeDateBookedSlots.some(s => s.timeSlot === slot.timeSlot);
                const bookedRecord = activeDateBookedSlots.find(s => s.timeSlot === slot.timeSlot);

                return `
                  <div class="solid-card smooth-card" style="padding: 1.35rem 1.5rem; border-radius: 16px; border: 1.5px solid ${isBooked ? '#10B981' : 'rgba(255, 255, 255, 0.88)'}; background: ${isBooked ? 'rgba(240, 253, 244, 0.8)' : 'rgba(255, 255, 255, 0.72)'}; backdrop-filter: blur(18px) saturate(180%); -webkit-backdrop-filter: blur(18px) saturate(180%); display: flex; flex-direction: column; justify-content: space-between; box-shadow: ${isBooked ? '0 8px 24px rgba(16, 185, 129, 0.12), inset 0 1px 1.5px #FFFFFF' : '0 6px 20px rgba(0,0,0,0.03), inset 0 1px 1.5px #FFFFFF'};">
                    <div>
                      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.85rem;">
                        <span class="badge" style="background: ${isBooked ? '#D1FAE5' : '#F1F5F9'}; color: ${isBooked ? '#065F46' : '#475569'}; font-weight: 700; font-size: 0.725rem;">
                          ${slot.duration}
                        </span>
                        ${isBooked ? `
                          <span class="badge badge-success" style="font-size: 0.725rem; font-weight: 800; display: inline-flex; align-items: center; gap: 0.3rem;">
                            ${icon("check", { size: 12, stroke: "#059669" })}
                            <span>BOOKED</span>
                          </span>
                        ` : `
                          <span class="badge badge-info" style="font-size: 0.725rem; font-weight: 700;">
                            AVAILABLE
                          </span>
                        `}
                      </div>

                      <h4 style="margin: 0 0 0.35rem; font-size: 1.1rem; font-weight: 800; color: var(--text-primary);">
                        ${slot.title}
                      </h4>
                      <div style="font-size: 1.05rem; font-weight: 800; color: ${isBooked ? '#166534' : 'var(--brand-emerald-dark)'}; margin-bottom: 0.5rem; display: flex; align-items: center; gap: 0.4rem;">
                        ${icon("clock", { size: 16, stroke: isBooked ? "#166534" : "var(--brand-emerald-dark)" })}
                        <span>${slot.timeSlot}</span>
                      </div>
                      <p style="font-size: 0.825rem; color: var(--text-muted); line-height: 1.45; margin: 0 0 1.25rem;">
                        ${slot.description}
                      </p>
                    </div>

                    <div>
                      ${isBooked ? `
                        <button type="button" 
                                class="btn btn-danger btn-sm btn-release-gig-slot" 
                                data-id="${bookedRecord.slotId}" 
                                data-title="${slot.title}"
                                data-timeslot="${slot.timeSlot}"
                                style="width: 100%; justify-content: center; font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem;">
                          ${icon("x", { size: 14, stroke: "#FFFFFF" })}
                          <span>Release Slot</span>
                        </button>
                      ` : `
                        <button type="button" 
                                class="btn btn-primary btn-sm btn-book-standard-slot" 
                                data-date="${activeIso}" 
                                data-timeslot="${slot.timeSlot}"
                                data-start="${slot.startTime}"
                                data-end="${slot.endTime}"
                                data-title="${slot.title}"
                                style="width: 100%; justify-content: center; font-weight: 700; display: inline-flex; align-items: center; gap: 0.4rem;">
                          ${icon("plus", { size: 14, stroke: "#FFFFFF" })}
                          <span>Book Gig Slot</span>
                        </button>
                      `}
                    </div>
                  </div>
                `;
              }).join("")}
            </div>

            <!-- Custom Time Slot Section -->
            <div style="background: rgba(248, 250, 252, 0.72); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border: 1.5px dashed rgba(203, 213, 225, 0.85); border-radius: 16px; padding: 1.35rem 1.5rem; box-shadow: inset 0 1px 1px #FFFFFF;">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <div class="icon-box icon-box-sm icon-box-slate">
                  ${icon("sliders", { size: 16, stroke: "#475569" })}
                </div>
                <h4 style="margin: 0; font-size: 1rem; font-weight: 800; color: var(--text-primary);">
                  Or Book a Custom Gig Time Slot
                </h4>
              </div>
              <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.25rem 0 1.15rem;">
                Prefer specific working hours? Specify your exact start and end times for ${activeDateObj.label}.
              </p>
              
              <div style="display: flex; gap: 1rem; align-items: flex-end; flex-wrap: wrap;">
                <div>
                  <label class="form-label" style="font-size: 0.775rem; font-weight: 700;">Start Time</label>
                  <input type="time" id="custom-slot-start" class="form-input" value="09:00" style="height: 40px; width: 140px; font-weight: 600;">
                </div>
                <div>
                  <label class="form-label" style="font-size: 0.775rem; font-weight: 700;">End Time</label>
                  <input type="time" id="custom-slot-end" class="form-input" value="13:00" style="height: 40px; width: 140px; font-weight: 600;">
                </div>
                <div style="flex: 1; min-width: 220px;">
                  <label class="form-label" style="font-size: 0.775rem; font-weight: 700;">Shift Description (Optional)</label>
                  <input type="text" id="custom-slot-title" class="form-input" placeholder="e.g. Afternoon Deep Cleaning Shift" style="height: 40px;">
                </div>
                <button type="button" id="btn-book-custom-slot" class="btn btn-secondary btn-sm" style="height: 40px; font-weight: 700; padding: 0 1.35rem; display: inline-flex; align-items: center; gap: 0.4rem;">
                  ${icon("plus", { size: 15, stroke: "currentColor" })}
                  <span>Book Custom Slot</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Section 3: My Booked Gig Slots (Active & Upcoming) -->
          <div class="solid-card smooth-card" style="padding: 1.5rem 1.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.35rem; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <h3 style="margin: 0; font-size: 1.25rem; font-weight: 800; color: var(--text-primary); letter-spacing: -0.01em;">
                  My Booked Gig Slots (${allBookedSlots.length})
                </h3>
                <p style="font-size: 0.825rem; color: var(--text-muted); margin: 0.2rem 0 0;">
                  Your confirmed gig shifts over the next 3 days
                </p>
              </div>
            </div>

            ${allBookedSlots.length === 0 ? `
              <div style="padding: 3rem 1.5rem; text-align: center; background: #F8FAFC; border-radius: 14px; border: 1px dashed #CBD5E1;">
                <div class="icon-box icon-box-lg icon-box-emerald" style="margin: 0 auto 0.75rem;">
                  ${icon("calendar", { size: 26, stroke: "#059669" })}
                </div>
                <h4 style="margin: 0 0 0.35rem; font-size: 1.1rem; color: var(--text-primary); font-weight: 700;">No Gig Slots Booked Yet</h4>
                <p style="color: var(--text-muted); font-size: 0.85rem; max-width: 440px; margin: 0 auto 1.25rem; line-height: 1.5;">
                  Select a date and time slot above to book your work shifts. Clients will be routed to you during your confirmed hours.
                </p>
              </div>
            ` : `
              <div style="display: flex; flex-direction: column; gap: 0.85rem;">
                ${allBookedSlots.map(slot => {
                  const dateObj = allowedDates.find(d => d.iso === slot.date);
                  const dateLabel = dateObj ? `${dateObj.label} (${dateObj.dayName}, ${dateObj.dayNum} ${dateObj.month})` : slot.date;

                  return `
                    <div class="solid-card smooth-card" style="padding: 1.15rem 1.35rem; border-radius: 12px; border-left: 5px solid #10B981; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
                      <div>
                        <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.25rem;">
                          <span class="badge badge-success" style="font-size: 0.725rem; font-weight: 700;">CONFIRMED GIG SLOT</span>
                          <span style="font-size: 0.8rem; font-weight: 700; color: var(--brand-emerald-darker);">${dateLabel}</span>
                        </div>
                        <h4 style="margin: 0 0 0.25rem; font-size: 1.05rem; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 0.4rem;">
                          ${icon("clock", { size: 16, stroke: "var(--brand-emerald)" })}
                          <span>${slot.timeSlot}</span>
                        </h4>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">
                          ${slot.slotTitle || 'General Maid / Cleaning Shift'} • Booked on ${new Date(slot.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>

                      <div style="display: flex; gap: 0.5rem; align-items: center;">
                        <button type="button" 
                                class="btn btn-secondary btn-sm btn-release-gig-slot" 
                                data-id="${slot.slotId}" 
                                data-title="${slot.slotTitle || slot.timeSlot}"
                                data-timeslot="${slot.timeSlot}"
                                style="font-weight: 700; color: #DC2626; border-color: #FECACA; display: inline-flex; align-items: center; gap: 0.35rem;">
                          ${icon("trash", { size: 14, stroke: "#DC2626" })}
                          <span>Release Slot</span>
                        </button>
                      </div>
                    </div>
                  `;
                }).join("")}
              </div>
            `}
          </div>

        </div>

        ${renderPartnerMobileBottomNav("/partner/gigs")}
      </div>
    </div>
  `;
}

export function attachPartnerGigsEvents() {
  attachPartnerNavEvents();

  const user = auth.getCurrentUser();
  if (!user) return;
  const partnerId = user.userId;

  // Date Selector clicks
  document.querySelectorAll(".btn-select-gig-date").forEach(btn => {
    btn.onclick = () => {
      const idx = parseInt(btn.getAttribute("data-index"), 10);
      selectedDateIndex = idx;
      refreshPage();
    };
  });

  // Book Standard Time Slot
  document.querySelectorAll(".btn-book-standard-slot").forEach(btn => {
    btn.onclick = () => {
      const date = btn.getAttribute("data-date");
      const timeSlot = btn.getAttribute("data-timeslot");
      const startTime = btn.getAttribute("data-start");
      const endTime = btn.getAttribute("data-end");
      const title = btn.getAttribute("data-title");

      try {
        db.bookPartnerGigSlot(partnerId, {
          date,
          timeSlot,
          startTime,
          endTime,
          slotTitle: title
        });
        toast.success("Gig Slot Booked", `You are confirmed for ${timeSlot} on ${date}.`);
        refreshPage();
      } catch (err) {
        toast.error("Booking Notice", err.message || "Failed to book gig slot.");
      }
    };
  });

  // Book Custom Time Slot
  const btnBookCustom = document.getElementById("btn-book-custom-slot");
  if (btnBookCustom) {
    btnBookCustom.onclick = () => {
      const allowedDates = db.getPartnerAllowedDateRange();
      const activeDate = allowedDates[selectedDateIndex]?.iso;
      const startVal = document.getElementById("custom-slot-start")?.value;
      const endVal = document.getElementById("custom-slot-end")?.value;
      const titleVal = document.getElementById("custom-slot-title")?.value?.trim() || "Custom Cleaning Shift";

      if (!startVal || !endVal) {
        toast.error("Time Required", "Please select both start and end times.");
        return;
      }

      const formatTime = (t24) => {
        const [h, m] = t24.split(":").map(Number);
        const ampm = h >= 12 ? "PM" : "AM";
        const h12 = h % 12 || 12;
        return `${String(h12).padStart(2, "0")}:${String(m).padStart(2, "0")} ${ampm}`;
      };

      const formattedSlot = `${formatTime(startVal)} – ${formatTime(endVal)}`;

      try {
        db.bookPartnerGigSlot(partnerId, {
          date: activeDate,
          timeSlot: formattedSlot,
          startTime: startVal,
          endTime: endVal,
          slotTitle: titleVal
        });
        toast.success("Custom Slot Booked", `Confirmed for ${formattedSlot} on ${activeDate}.`);
        refreshPage();
      } catch (err) {
        toast.error("Booking Notice", err.message || "Failed to book custom slot.");
      }
    };
  }

  // Release / Cancel Booked Gig Slot
  document.querySelectorAll(".btn-release-gig-slot").forEach(btn => {
    btn.onclick = () => {
      const slotId = btn.getAttribute("data-id");
      const title = btn.getAttribute("data-title");
      const timeslot = btn.getAttribute("data-timeslot");

      modal.open({
        title: "Release Booked Gig Slot?",
        maxWidth: "440px",
        bodyHtml: `
          <div style="text-align: center; padding: 1rem 0;">
            <div class="icon-box icon-box-lg icon-box-rose" style="margin: 0 auto 1rem;">
              ${icon("alert-triangle", { size: 26, stroke: "#DC2626" })}
            </div>
            <h4 style="margin: 0 0 0.5rem; font-size: 1.15rem; color: var(--text-primary); font-weight: 800;">Release ${timeslot}?</h4>
            <p style="font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; margin-bottom: 1.5rem;">
              Releasing this slot will remove you from the confirmed schedule for this time window. You can re-book any time within the 3-day window.
            </p>
            <div style="display: flex; gap: 0.75rem;">
              <button class="btn btn-danger btn-md" id="btn-confirm-release" style="flex: 1; justify-content: center; font-weight: 700;">
                Yes, Release Slot
              </button>
              <button class="btn btn-secondary btn-md" onclick="document.querySelector('.modal-close').click()" style="justify-content: center;">
                Keep Slot
              </button>
            </div>
          </div>
        `,
        onOpen: (container) => {
          const confirmRelease = container.querySelector("#btn-confirm-release");
          if (confirmRelease) {
            confirmRelease.onclick = () => {
              try {
                db.cancelPartnerGigSlot(slotId, partnerId);
                modal.close();
                toast.info("Slot Released", `Your gig shift ${timeslot} has been released.`);
                refreshPage();
              } catch (err) {
                toast.error("Cannot Release Slot", err.message);
              }
            };
          }
        }
      });
    };
  });

  function refreshPage() {
    const root = document.getElementById("page-container") || document.getElementById("app");
    if (root) {
      root.innerHTML = renderPartnerGigsPage();
      attachPartnerGigsEvents();
    }
  }
}
