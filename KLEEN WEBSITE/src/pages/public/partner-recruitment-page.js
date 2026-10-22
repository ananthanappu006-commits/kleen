/**
 * KLEEN — Become a Partner / Partner Recruitment Landing Page
 * Features:
 * - High-converting hero with instant quick-apply card
 * - Live interactive Earnings Calculator (reactive sliders for hours, days, service specialization)
 * - Transparent Partner Benefits & Perks (80% take-home, weekly bank settlements, ₹5L insurance)
 * - 4-step onboarding roadmap
 * - Verified partner success stories & testimonials
 * - Partner eligibility checklist
 * - Interactive FAQ accordion
 * - Floating CTA and bottom conversion banner
 */

import { icon } from "../../components/icons.js";
import { renderDistrictOptions, DEFAULT_DISTRICT } from "../../config/kerala-districts.js";

export function renderPartnerRecruitmentPage() {
  return `
    <div class="partner-recruitment-page" style="background: var(--bg-primary, #F8FAFC); min-height: 100vh; font-family: var(--font-body, system-ui, sans-serif); color: var(--text-primary, #1E293B);">
      
      <!-- HERO SECTION -->
      <section class="partner-hero-section">
        <!-- Subtle decorative glow -->
        <div style="position: absolute; top: -150px; right: -150px; width: 500px; height: 500px; background: radial-gradient(circle, rgba(52, 211, 153, 0.22) 0%, transparent 70%); border-radius: 50%; pointer-events: none;"></div>
        <div style="position: absolute; bottom: -120px; left: -100px; width: 400px; height: 400px; background: radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%); border-radius: 50%; pointer-events: none;"></div>

        <!-- Blended Partner Background Layer & Bottom Blur -->
        <div class="partner-hero-bg-layer" aria-hidden="true">
          <div class="partner-hero-bg-ambient"></div>
          <img src="assets/partner-hero.png" alt="" class="partner-hero-bg-image" />
          <div class="partner-hero-bottom-blur"></div>
        </div>

        <div class="app-container" style="position: relative;">
          <div style="display: grid; grid-template-columns: 1.25fr 1fr; gap: 3.5rem; align-items: center;">
            
            <!-- Left: Hero Headline & Badges with Transparency Liquid Glass Effect -->
            <div class="partner-hero-liquid-glass">
              <div class="partner-badge-liquid-glass">
                <span style="display: inline-block; width: 8px; height: 8px; background: #34D399; border-radius: 50%; box-shadow: 0 0 10px #34D399;"></span>
                <span style="font-size: 0.825rem; font-weight: 700; color: #FFFFFF; letter-spacing: 0.05em; text-transform: uppercase;">Now Hiring Verified Maid Partners</span>
              </div>

              <h1 style="font-family: var(--font-heading, inherit); font-size: clamp(2.3rem, 4vw, 3.5rem); font-weight: 800; line-height: 1.18; letter-spacing: -0.03em; margin: 0 0 1.25rem 0; color: #FFFFFF;">
                Earn <span style="background: linear-gradient(135deg, #34D399, #10B981); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-shadow: 0 0 25px rgba(52,211,153,0.35);">₹35,000 – ₹55,000</span> Every Month with Dignity
              </h1>

              <p style="font-size: 1.05rem; line-height: 1.65; color: rgba(255, 255, 255, 0.92); margin-bottom: 2rem; text-shadow: 0 2px 8px rgba(0,0,0,0.5);">
                Join India's most trusted home care and maid network. Flexible work hours near your home, weekly Tuesday bank transfers, and free ₹5,00,000 medical coverage for your family.
              </p>

              <!-- Quick action buttons with Liquid Glass Styling -->
              <div style="display: flex; gap: 1.15rem; align-items: center; flex-wrap: wrap; position: relative; z-index: 10;">
                <a href="#partner-calculator" class="btn btn-secondary partner-btn-liquid-glass">
                  Calculate Your Earnings ↓
                </a>
                <a href="#/partner/login" class="partner-link-liquid-glass">
                  Already Registered? Sign In &rarr;
                </a>
              </div>
            </div>

            <!-- Right: Quick Apply / Lead Form Card -->
            <div style="position: relative; z-index: 10;">
              <div style="background: #FFFFFF; color: #1E293B; border-radius: 18px; padding: 2.25rem; box-shadow: 0 20px 45px rgba(0, 0, 0, 0.28); border: 1px solid rgba(255, 255, 255, 0.8);">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.25rem;">
                  <div>
                    <h3 style="font-size: 1.35rem; font-weight: 800; color: #09281E; margin: 0 0 0.25rem 0;">Start in 2 Minutes</h3>
                    <p style="font-size: 0.85rem; color: #64748B; margin: 0;">100% Free Registration • Zero Joining Fees</p>
                  </div>
                  <span class="badge" style="background: #ECFDF5; color: #059669; font-weight: 700; font-size: 0.75rem; padding: 0.35rem 0.65rem; border-radius: 6px; border: 1px solid #A7F3D0;">Free Kit Included</span>
                </div>

                <form id="partner-quick-apply-form" style="display: flex; flex-direction: column; gap: 1rem;">
                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem;">Full Legal Name (as on Aadhaar) *</label>
                    <input type="text" id="lead-name" required placeholder="e.g. Sunita Devi" style="width: 100%; padding: 0.75rem 0.9rem; border-radius: 8px; border: 1px solid #CBD5E1; font-size: 0.9rem; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='#10B981'" onblur="this.style.borderColor='#CBD5E1'">
                  </div>

                  <div>
                    <label style="display: block; font-size: 0.825rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem;">Mobile Phone Number *</label>
                    <div style="display: flex;">
                      <span style="background: #F1F5F9; border: 1px solid #CBD5E1; border-right: none; padding: 0.75rem 0.85rem; border-top-left-radius: 8px; border-bottom-left-radius: 8px; font-weight: 600; font-size: 0.9rem; color: #475569;">+91</span>
                      <input type="tel" id="lead-phone" maxlength="10" pattern="[6-9][0-9]{9}" required placeholder="9876543210" style="width: 100%; padding: 0.75rem 0.9rem; border-top-right-radius: 8px; border-bottom-right-radius: 8px; border: 1px solid #CBD5E1; font-size: 0.9rem; outline: none; transition: border-color 0.2s;" onfocus="this.style.borderColor='#10B981'" onblur="this.style.borderColor='#CBD5E1'">
                    </div>
                  </div>

                  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <div>
                      <label style="display: block; font-size: 0.825rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem;">District (Kerala) *</label>
                      <select id="lead-city" required style="width: 100%; padding: 0.75rem 0.9rem; border-radius: 8px; border: 1px solid #CBD5E1; font-size: 0.875rem; background: #FFFFFF; outline: none;">
                        ${renderDistrictOptions(DEFAULT_DISTRICT)}
                      </select>
                    </div>

                    <div>
                      <label style="display: block; font-size: 0.825rem; font-weight: 600; color: #334155; margin-bottom: 0.35rem;">Primary Work *</label>
                      <select id="lead-skill" required style="width: 100%; padding: 0.75rem 0.9rem; border-radius: 8px; border: 1px solid #CBD5E1; font-size: 0.875rem; background: #FFFFFF; outline: none;">
                        <option value="All-Rounder Maid" selected>All-Rounder Maid</option>
                        <option value="Full Deep Cleaning">Deep Cleaning</option>
                        <option value="Cooking & Meal Prep">Cooking & Kitchen</option>
                        <option value="Bathroom & Sanitation">Sanitation</option>
                      </select>
                    </div>
                  </div>

                  <div style="font-size: 0.75rem; color: #64748B; line-height: 1.45; margin-top: 0.25rem;">
                    By continuing, you agree to receive SMS / WhatsApp updates from KLEEN regarding partner verification and onboarding.
                  </div>

                  <button type="submit" id="btn-submit-lead" style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: #FFFFFF; font-weight: 700; font-size: 1rem; padding: 0.9rem; border: none; border-radius: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35); transition: all 0.2s;" onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 6px 20px rgba(16, 185, 129, 0.45)'" onmouseout="this.style.transform='none'; this.style.boxShadow='0 4px 15px rgba(16, 185, 129, 0.35)'">
                    <span>Continue to Free Registration</span>
                    <span style="font-size: 1.1rem; line-height: 1;">&rarr;</span>
                  </button>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- STATS STRIP -->
      <section style="background: #FFFFFF; border-bottom: 1px solid #E2E8F0; padding: 2rem 0;">
        <div class="app-container">
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; text-align: center;">
            <div>
              <div style="font-size: 2.2rem; font-weight: 800; color: #09281E; line-height: 1.1;">10,000+</div>
              <div style="font-size: 0.875rem; font-weight: 600; color: #64748B; margin-top: 0.25rem;">Active Maid Partners</div>
            </div>
            <div>
              <div style="font-size: 2.2rem; font-weight: 800; color: #059669; line-height: 1.1;">₹18.4 Cr+</div>
              <div style="font-size: 0.875rem; font-weight: 600; color: #64748B; margin-top: 0.25rem;">Paid Out to Partners</div>
            </div>
            <div>
              <div style="font-size: 2.2rem; font-weight: 800; color: #09281E; line-height: 1.1; display: flex; align-items: center; justify-content: center; gap: 0.35rem;">4.9 <span style="color: #F59E0B; display: inline-flex;">${icon("star", { size: 22, fill: "#F59E0B", stroke: "#F59E0B" })}</span></div>
              <div style="font-size: 0.875rem; font-weight: 600; color: #64748B; margin-top: 0.25rem;">Partner Satisfaction Rating</div>
            </div>
            <div>
              <div style="font-size: 2.2rem; font-weight: 800; color: #059669; line-height: 1.1;">₹0</div>
              <div style="font-size: 0.875rem; font-weight: 600; color: #64748B; margin-top: 0.25rem;">Joining or Uniform Fees</div>
            </div>
          </div>
        </div>
      </section>

      <!-- INTERACTIVE EARNINGS CALCULATOR -->
      <section id="partner-calculator" style="padding: 5rem 0; background: #F8FAFC;">
        <div class="app-container">
          <div style="text-align: center; max-width: 650px; margin: 0 auto 3.5rem;">
            <div style="display: inline-block; font-size: 0.825rem; font-weight: 700; color: #059669; background: #ECFDF5; border: 1px solid #A7F3D0; padding: 0.35rem 0.85rem; border-radius: 9999px; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">
              Transparent Potential
            </div>
            <h2 style="font-size: 2.25rem; font-weight: 800; color: #09281E; letter-spacing: -0.02em; margin-bottom: 0.75rem;">
              Calculate How Much You Can Earn
            </h2>
            <p style="font-size: 1rem; color: #64748B; line-height: 1.6;">
              Customize your schedule and skills below to see your estimated take-home income. No hidden deductions — you receive 80% on every single completed booking.
            </p>
          </div>

          <div style="max-width: 950px; margin: 0 auto; background: #FFFFFF; border-radius: 20px; box-shadow: 0 10px 35px rgba(0, 0, 0, 0.06); border: 1px solid #E2E8F0; overflow: hidden; display: grid; grid-template-columns: 1.1fr 0.9fr;">
            
            <!-- Calculator Controls -->
            <div style="padding: 3rem 2.5rem; display: flex; flex-direction: column; gap: 2rem;">
              
              <!-- Service Selection -->
              <div>
                <label style="display: block; font-size: 0.9rem; font-weight: 700; color: #1E293B; margin-bottom: 0.75rem;">
                  1. Choose Your Preferred Service Focus
                </label>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.6rem;">
                  <button type="button" class="calc-service-btn active" data-rate="240" style="padding: 0.75rem 0.5rem; border-radius: 10px; border: 2px solid #10B981; background: #ECFDF5; color: #065F46; font-weight: 700; font-size: 0.825rem; cursor: pointer; text-align: center; transition: all 0.2s;">
                    Regular Maid
                    <span style="display: block; font-size: 0.7rem; font-weight: 500; color: #059669; margin-top: 0.2rem;">₹240/hr net</span>
                  </button>
                  <button type="button" class="calc-service-btn" data-rate="320" style="padding: 0.75rem 0.5rem; border-radius: 10px; border: 2px solid #E2E8F0; background: #FFFFFF; color: #475569; font-weight: 700; font-size: 0.825rem; cursor: pointer; text-align: center; transition: all 0.2s;">
                    Deep Cleaning
                    <span style="display: block; font-size: 0.7rem; font-weight: 500; color: #64748B; margin-top: 0.2rem;">₹320/hr net</span>
                  </button>
                  <button type="button" class="calc-service-btn" data-rate="280" style="padding: 0.75rem 0.5rem; border-radius: 10px; border: 2px solid #E2E8F0; background: #FFFFFF; color: #475569; font-weight: 700; font-size: 0.825rem; cursor: pointer; text-align: center; transition: all 0.2s;">
                    Kitchen Special
                    <span style="display: block; font-size: 0.7rem; font-weight: 500; color: #64748B; margin-top: 0.2rem;">₹280/hr net</span>
                  </button>
                </div>
              </div>

              <!-- Daily Hours Slider -->
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
                  <label style="font-size: 0.9rem; font-weight: 700; color: #1E293B;">2. Daily Working Hours</label>
                  <span id="display-calc-hours" style="font-size: 1.1rem; font-weight: 800; color: #059669; background: #ECFDF5; padding: 0.2rem 0.65rem; border-radius: 6px;">6 Hours/Day</span>
                </div>
                <input type="range" id="slider-calc-hours" min="2" max="10" step="1" value="6" style="width: 100%; accent-color: #10B981; cursor: pointer;">
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #94A3B8; margin-top: 0.35rem;">
                  <span>Part Time (2 hrs)</span>
                  <span>Standard (6 hrs)</span>
                  <span>Full Day (10 hrs)</span>
                </div>
              </div>

              <!-- Working Days per Week -->
              <div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem;">
                  <label style="font-size: 0.9rem; font-weight: 700; color: #1E293B;">3. Working Days Per Week</label>
                  <span id="display-calc-days" style="font-size: 1.1rem; font-weight: 800; color: #059669; background: #ECFDF5; padding: 0.2rem 0.65rem; border-radius: 6px;">6 Days/Week</span>
                </div>
                <input type="range" id="slider-calc-days" min="3" max="7" step="1" value="6" style="width: 100%; accent-color: #10B981; cursor: pointer;">
                <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: #94A3B8; margin-top: 0.35rem;">
                  <span>3 Days</span>
                  <span>5 Days</span>
                  <span>6 Days</span>
                  <span>7 Days</span>
                </div>
              </div>

            </div>

            <!-- Calculation Output Card -->
            <div style="background: linear-gradient(145deg, #09281E 0%, #0F4C3A 100%); color: #FFFFFF; padding: 3rem 2.5rem; display: flex; flex-direction: column; justify-content: space-between; border-left: 1px solid rgba(255,255,255,0.1);">
              <div>
                <span style="font-size: 0.8rem; font-weight: 700; color: #34D399; text-transform: uppercase; letter-spacing: 0.05em; display: block; margin-bottom: 0.5rem;">Estimated Take-Home Payout</span>
                <div style="display: flex; align-baseline: baseline; gap: 0.4rem; margin-bottom: 1.5rem;">
                  <span style="font-size: 3.2rem; font-weight: 900; color: #FFFFFF; line-height: 1;" id="calc-monthly-total">₹37,440</span>
                  <span style="font-size: 1.1rem; color: rgba(255,255,255,0.7); font-weight: 600;">/ month</span>
                </div>

                <!-- Breakdown table -->
                <div style="background: rgba(255, 255, 255, 0.08); border-radius: 12px; padding: 1.25rem; border: 1px solid rgba(255, 255, 255, 0.12); display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1.5rem; font-size: 0.875rem;">
                  <div style="display: flex; justify-content: space-between; color: rgba(255,255,255,0.85);">
                    <span>Weekly Settlement:</span>
                    <strong style="color: #FFFFFF;" id="calc-weekly-total">₹9,360</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; color: rgba(255,255,255,0.85);">
                    <span>Estimated Customer Tips:</span>
                    <strong style="color: #34D399;" id="calc-tips-total">₹2,800</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between; color: rgba(255,255,255,0.85);">
                    <span>Monthly Bonus Tier:</span>
                    <strong style="color: #34D399;" id="calc-bonus-tier">Gold (₹2,500)</strong>
                  </div>
                  <div style="border-top: 1px solid rgba(255,255,255,0.15); padding-top: 0.75rem; display: flex; justify-content: space-between;">
                    <span style="font-weight: 700;">Total Potential Income:</span>
                    <strong style="color: #34D399; font-size: 1.05rem;" id="calc-grand-total">₹42,740</strong>
                  </div>
                </div>

                <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; color: rgba(255,255,255,0.75);">
                  <span style="color: #34D399; display: flex; align-items: center;">${icon("check", { size: 14, stroke: "#34D399", strokeWidth: 3 })}</span>
                  <span>Direct NEFT/IMPS transfer every Tuesday morning.</span>
                </div>
              </div>

              <div style="margin-top: 2rem;">
                <a href="#/partner/register" style="display: block; width: 100%; text-align: center; background: #10B981; color: #FFFFFF; font-weight: 700; font-size: 1rem; padding: 0.95rem; border-radius: 10px; text-decoration: none; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4); transition: all 0.2s;" onmouseover="this.style.background='#059669'; this.style.transform='translateY(-1px)'" onmouseout="this.style.background='#10B981'; this.style.transform='none'">
                  Claim This Payout — Join Now &rarr;
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- WHY CHOOSE KLEEN — 6 BENEFIT CARDS -->
      <section style="padding: 5rem 0; background: #FFFFFF;">
        <div class="app-container">
          <div style="text-align: center; max-width: 650px; margin: 0 auto 3.5rem;">
            <div style="display: inline-block; font-size: 0.825rem; font-weight: 700; color: #059669; background: #ECFDF5; border: 1px solid #A7F3D0; padding: 0.35rem 0.85rem; border-radius: 9999px; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">
              Partner First Culture
            </div>
            <h2 style="font-size: 2.25rem; font-weight: 800; color: #09281E; letter-spacing: -0.02em; margin-bottom: 0.75rem;">
              Why Maids Prefer KLEEN Over Any Other Platform
            </h2>
            <p style="font-size: 1rem; color: #64748B; line-height: 1.6;">
              We treat our partners with dignity, offer comprehensive financial security, and protect your safety at all times.
            </p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem;">
            
            <!-- Benefit 1 -->
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 2rem; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 28px rgba(0,0,0,0.06)'" onmouseout="this.style.transform='none'; this.style.boxShadow='none'">
              <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(16, 185, 129, 0.12); color: #059669; display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem;">
                ${icon("coins", { size: 24, stroke: "#059669" })}
              </div>
              <h3 style="font-size: 1.2rem; font-weight: 700; color: #09281E; margin-bottom: 0.6rem;">80% Net Take-Home</h3>
              <p style="font-size: 0.9rem; color: #64748B; line-height: 1.6; margin: 0;">
                KLEEN retains only a minimal 20% platform fee. You keep 80% of every rupee paid by customers, plus 100% of all customer tips.
              </p>
            </div>

            <!-- Benefit 2 -->
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 2rem; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 28px rgba(0,0,0,0.06)'" onmouseout="this.style.transform='none'; this.style.boxShadow='none'">
              <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(16, 185, 129, 0.12); color: #059669; display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem;">
                ${icon("building", { size: 24, stroke: "#059669" })}
              </div>
              <h3 style="font-size: 1.2rem; font-weight: 700; color: #09281E; margin-bottom: 0.6rem;">Guaranteed Weekly Bank Payouts</h3>
              <p style="font-size: 0.9rem; color: #64748B; line-height: 1.6; margin: 0;">
                No waiting till month-end. All completed jobs from Monday to Sunday are settled directly into your bank account every Tuesday morning via Razorpay.
              </p>
            </div>

            <!-- Benefit 3 -->
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 2rem; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 28px rgba(0,0,0,0.06)'" onmouseout="this.style.transform='none'; this.style.boxShadow='none'">
              <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(16, 185, 129, 0.12); color: #059669; display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem;">
                ${icon("shield-check", { size: 24, stroke: "#059669" })}
              </div>
              <h3 style="font-size: 1.2rem; font-weight: 700; color: #09281E; margin-bottom: 0.6rem;">₹5,00,000 Free Insurance</h3>
              <p style="font-size: 0.9rem; color: #64748B; line-height: 1.6; margin: 0;">
                Every active partner receives comprehensive cashless medical insurance and on-duty accidental protection from day one, covering you and your family.
              </p>
            </div>

            <!-- Benefit 4 -->
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 2rem; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 28px rgba(0,0,0,0.06)'" onmouseout="this.style.transform='none'; this.style.boxShadow='none'">
              <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(16, 185, 129, 0.12); color: #059669; display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem;">
                ${icon("map-pin", { size: 24, stroke: "#059669" })}
              </div>
              <h3 style="font-size: 1.2rem; font-weight: 700; color: #09281E; margin-bottom: 0.6rem;">Choose Your Own Radius</h3>
              <p style="font-size: 0.9rem; color: #64748B; line-height: 1.6; margin: 0;">
                Work in your preferred pin codes and localities. Minimize travel time and fuel cost with automated proximity job dispatching within 3–5 km.
              </p>
            </div>

            <!-- Benefit 5 -->
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 2rem; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 28px rgba(0,0,0,0.06)'" onmouseout="this.style.transform='none'; this.style.boxShadow='none'">
              <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(16, 185, 129, 0.12); color: #059669; display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem;">
                ${icon("sparkles", { size: 24, stroke: "#059669" })}
              </div>
              <h3 style="font-size: 1.2rem; font-weight: 700; color: #09281E; margin-bottom: 0.6rem;">Free Starter Cleaning Kit</h3>
              <p style="font-size: 0.9rem; color: #64748B; line-height: 1.6; margin: 0;">
                Zero security deposit. Upon verification, you receive a free branded apron, microfibre cloth sets, cleaning gloves, and identification badge.
              </p>
            </div>

            <!-- Benefit 6 -->
            <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 16px; padding: 2rem; transition: transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 12px 28px rgba(0,0,0,0.06)'" onmouseout="this.style.transform='none'; this.style.boxShadow='none'">
              <div style="width: 48px; height: 48px; border-radius: 12px; background: rgba(16, 185, 129, 0.12); color: #059669; display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem;">
                ${icon("shield-alert", { size: 24, stroke: "#059669" })}
              </div>
              <h3 style="font-size: 1.2rem; font-weight: 700; color: #09281E; margin-bottom: 0.6rem;">24/7 Partner SOS Support</h3>
              <p style="font-size: 0.9rem; color: #64748B; line-height: 1.6; margin: 0;">
                Never feel alone on a job. Access 1-click in-app emergency SOS and our 24/7 bilingual helpline for immediate conflict or safety resolution.
              </p>
            </div>

          </div>
        </div>
      </section>

      <!-- 4-STEP ONBOARDING ROADMAP -->
      <section style="padding: 5rem 0; background: #F1F5F9; border-top: 1px solid #E2E8F0; border-bottom: 1px solid #E2E8F0;">
        <div class="app-container">
          <div style="text-align: center; max-width: 650px; margin: 0 auto 3.5rem;">
            <div style="display: inline-block; font-size: 0.825rem; font-weight: 700; color: #059669; background: #ECFDF5; border: 1px solid #A7F3D0; padding: 0.35rem 0.85rem; border-radius: 9999px; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">
              Fast & Simple
            </div>
            <h2 style="font-size: 2.25rem; font-weight: 800; color: #09281E; letter-spacing: -0.02em; margin-bottom: 0.75rem;">
              Start Earning in 4 Simple Steps
            </h2>
            <p style="font-size: 1rem; color: #64748B; line-height: 1.6;">
              Our paperless digital verification gets you on the road within 24 hours.
            </p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; position: relative;">
            
            <!-- Step 1 -->
            <div style="background: #FFFFFF; border-radius: 16px; padding: 2rem 1.5rem; border: 1px solid #E2E8F0; text-align: center;">
              <div style="width: 44px; height: 44px; border-radius: 50%; background: #ECFDF5; color: #059669; font-weight: 800; font-size: 1.15rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; border: 2px solid #A7F3D0;">
                1
              </div>
              <h4 style="font-size: 1.1rem; font-weight: 700; color: #09281E; margin-bottom: 0.5rem;">2-Min Sign Up</h4>
              <p style="font-size: 0.85rem; color: #64748B; line-height: 1.5; margin: 0;">
                Enter your mobile number, select your city, and submit basic contact information online.
              </p>
            </div>

            <!-- Step 2 -->
            <div style="background: #FFFFFF; border-radius: 16px; padding: 2rem 1.5rem; border: 1px solid #E2E8F0; text-align: center;">
              <div style="width: 44px; height: 44px; border-radius: 50%; background: #ECFDF5; color: #059669; font-weight: 800; font-size: 1.15rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; border: 2px solid #A7F3D0;">
                2
              </div>
              <h4 style="font-size: 1.1rem; font-weight: 700; color: #09281E; margin-bottom: 0.5rem;">Digital KYC</h4>
              <p style="font-size: 0.85rem; color: #64748B; line-height: 1.5; margin: 0;">
                Upload your Aadhaar ID and bank passbook/UPI details for secure weekly payouts.
              </p>
            </div>

            <!-- Step 3 -->
            <div style="background: #FFFFFF; border-radius: 16px; padding: 2rem 1.5rem; border: 1px solid #E2E8F0; text-align: center;">
              <div style="width: 44px; height: 44px; border-radius: 50%; background: #ECFDF5; color: #059669; font-weight: 800; font-size: 1.15rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; border: 2px solid #A7F3D0;">
                3
              </div>
              <h4 style="font-size: 1.1rem; font-weight: 700; color: #09281E; margin-bottom: 0.5rem;">Brief Orientation</h4>
              <p style="font-size: 0.85rem; color: #64748B; line-height: 1.5; margin: 0;">
                Complete a 20-minute video hygiene & safety orientation and collect your free kit.
              </p>
            </div>

            <!-- Step 4 -->
            <div style="background: #FFFFFF; border-radius: 16px; padding: 2rem 1.5rem; border: 1px solid #E2E8F0; text-align: center;">
              <div style="width: 44px; height: 44px; border-radius: 50%; background: #059669; color: #FFFFFF; font-weight: 800; font-size: 1.15rem; display: flex; align-items: center; justify-content: center; margin: 0 auto 1.25rem; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.35);">
                4
              </div>
              <h4 style="font-size: 1.1rem; font-weight: 700; color: #09281E; margin-bottom: 0.5rem;">Go Online & Earn</h4>
              <p style="font-size: 0.85rem; color: #64748B; line-height: 1.5; margin: 0;">
                Toggle online in your partner app, accept nearby bookings, and start receiving earnings!
              </p>
            </div>

          </div>
        </div>
      </section>

      <!-- TESTIMONIALS & STORIES -->
      <section style="padding: 5rem 0; background: #FFFFFF;">
        <div class="app-container">
          <div style="text-align: center; max-width: 650px; margin: 0 auto 3.5rem;">
            <div style="display: inline-block; font-size: 0.825rem; font-weight: 700; color: #059669; background: #ECFDF5; border: 1px solid #A7F3D0; padding: 0.35rem 0.85rem; border-radius: 9999px; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">
              Real Stories
            </div>
            <h2 style="font-size: 2.25rem; font-weight: 800; color: #09281E; letter-spacing: -0.02em; margin-bottom: 0.75rem;">
              Hear From Our Proud Partners
            </h2>
            <p style="font-size: 1rem; color: #64748B; line-height: 1.6;">
              Read how women and cleaning professionals across India built financial independence through KLEEN.
            </p>
          </div>

          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem;">
            
            <!-- Story 1 -->
            <div style="background: #F8FAFC; border-radius: 16px; padding: 2rem; border: 1px solid #E2E8F0; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; gap: 0.25rem; color: #F59E0B; margin-bottom: 1rem;">
                  ${[1,2,3,4,5].map(() => icon("star", { size: 16, fill: "#F59E0B", stroke: "#F59E0B" })).join("")}
                </div>
                <p style="font-size: 0.95rem; color: #334155; line-height: 1.65; font-style: italic; margin-bottom: 1.5rem;">
                  "Earlier I used to work in 4 different houses without any fixed leaves or respect, earning barely ₹14,000. With KLEEN, I work 6 hours a day near HSR Layout, earn ₹41,000 every month, and my salary comes directly into my bank account every Tuesday without asking."
                </p>
              </div>
              <div style="display: flex; align-items: center; gap: 0.9rem; border-top: 1px solid #E2E8F0; padding-top: 1rem;">
                <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80" alt="Sunita Sharma" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid #10B981;">
                <div>
                  <div style="font-weight: 700; color: #09281E; font-size: 0.95rem;">Sunita Sharma</div>
                  <div style="font-size: 0.8rem; color: #059669; font-weight: 600;">Bangalore • Partner since 2024</div>
                </div>
              </div>
            </div>

            <!-- Story 2 -->
            <div style="background: #F8FAFC; border-radius: 16px; padding: 2rem; border: 1px solid #E2E8F0; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; gap: 0.25rem; color: #F59E0B; margin-bottom: 1rem; font-size: 1rem;">
                  ${[1,2,3,4,5].map(() => icon("star", { size: 16, fill: "#F59E0B", stroke: "#F59E0B" })).join("")}
                </div>
                <p style="font-size: 0.95rem; color: #334155; line-height: 1.65; font-style: italic; margin-bottom: 1.5rem;">
                  "The ₹5,00,000 health insurance gave my family immense peace of mind. When my daughter was hospitalized with dengue, the KLEEN cashless cover took care of the entire hospital bill. KLEEN is more than just an app, it is a family."
                </p>
              </div>
              <div style="display: flex; align-items: center; gap: 0.9rem; border-top: 1px solid #E2E8F0; padding-top: 1rem;">
                <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80" alt="Laxmi Devi" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid #10B981;">
                <div>
                  <div style="font-weight: 700; color: #09281E; font-size: 0.95rem;">Laxmi Devi</div>
                  <div style="font-size: 0.8rem; color: #059669; font-weight: 600; display: flex; align-items: center; gap: 0.25rem;">Mumbai (Andheri) • 4.9 <span style="display: inline-flex;">${icon("star", { size: 12, fill: "#059669", stroke: "#059669" })}</span> Partner</div>
                </div>
              </div>
            </div>

            <!-- Story 3 -->
            <div style="background: #F8FAFC; border-radius: 16px; padding: 2rem; border: 1px solid #E2E8F0; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <div style="display: flex; gap: 0.25rem; color: #F59E0B; margin-bottom: 1rem; font-size: 1rem;">
                  ${[1,2,3,4,5].map(() => icon("star", { size: 16, fill: "#F59E0B", stroke: "#F59E0B" })).join("")}
                </div>
                <p style="font-size: 0.95rem; color: #334155; line-height: 1.65; font-style: italic; margin-bottom: 1.5rem;">
                  "I specialize in kitchen deep cleaning. Customers on KLEEN are polite and verified. The app gives me exact directions and when I finish a job, the payment breakdown shows immediately. Best platform for hard working people."
                </p>
              </div>
              <div style="display: flex; align-items: center; gap: 0.9rem; border-top: 1px solid #E2E8F0; padding-top: 1rem;">
                <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80" alt="Ramesh Kumar" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid #10B981;">
                <div>
                  <div style="font-weight: 700; color: #09281E; font-size: 0.95rem;">Ramesh Kumar</div>
                  <div style="font-size: 0.8rem; color: #059669; font-weight: 600;">Delhi NCR • 650+ Jobs Done</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- ELIGIBILITY CRITERIA -->
      <section style="padding: 4.5rem 0; background: #F8FAFC; border-top: 1px solid #E2E8F0;">
        <div class="app-container">
          <div style="max-width: 850px; margin: 0 auto; background: #FFFFFF; border-radius: 18px; padding: 3rem; border: 1px solid #E2E8F0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
            <div style="text-align: center; margin-bottom: 2rem;">
              <h3 style="font-size: 1.75rem; font-weight: 800; color: #09281E;">Who Can Apply?</h3>
              <p style="font-size: 0.95rem; color: #64748B; margin-top: 0.35rem;">Simple requirements to become an active partner</p>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
              <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background: #ECFDF5; color: #059669; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${icon("check", { size: 15, stroke: "#059669", strokeWidth: 3 })}</div>
                <div>
                  <strong style="color: #09281E; font-size: 0.95rem;">Age 18 or Above</strong>
                  <p style="font-size: 0.85rem; color: #64748B; margin: 0.2rem 0 0;">Valid Indian citizenship and legal working age.</p>
                </div>
              </div>

              <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background: #ECFDF5; color: #059669; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${icon("check", { size: 15, stroke: "#059669", strokeWidth: 3 })}</div>
                <div>
                  <strong style="color: #09281E; font-size: 0.95rem;">Government Photo ID</strong>
                  <p style="font-size: 0.85rem; color: #64748B; margin: 0.2rem 0 0;">Aadhaar Card or Voter ID for paperless verification.</p>
                </div>
              </div>

              <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background: #ECFDF5; color: #059669; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${icon("check", { size: 15, stroke: "#059669", strokeWidth: 3 })}</div>
                <div>
                  <strong style="color: #09281E; font-size: 0.95rem;">Bank Account / UPI</strong>
                  <p style="font-size: 0.85rem; color: #64748B; margin: 0.2rem 0 0;">Savings account in your name for direct weekly payout deposits.</p>
                </div>
              </div>

              <div style="display: flex; gap: 0.75rem; align-items: flex-start;">
                <div style="width: 28px; height: 28px; border-radius: 50%; background: #ECFDF5; color: #059669; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${icon("check", { size: 15, stroke: "#059669", strokeWidth: 3 })}</div>
                <div>
                  <strong style="color: #09281E; font-size: 0.95rem;">Android Smartphone</strong>
                  <p style="font-size: 0.85rem; color: #64748B; margin: 0.2rem 0 0;">To accept booking alerts and navigate to customer addresses.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- FREQUENTLY ASKED QUESTIONS (ACCORDION) -->
      <section style="padding: 5rem 0; background: #FFFFFF;">
        <div class="app-container">
          <div style="text-align: center; max-width: 650px; margin: 0 auto 3.5rem;">
            <div style="display: inline-block; font-size: 0.825rem; font-weight: 700; color: #059669; background: #ECFDF5; border: 1px solid #A7F3D0; padding: 0.35rem 0.85rem; border-radius: 9999px; margin-bottom: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em;">
              Got Questions?
            </div>
            <h2 style="font-size: 2.25rem; font-weight: 800; color: #09281E; letter-spacing: -0.02em; margin-bottom: 0.75rem;">
              Partner FAQs
            </h2>
            <p style="font-size: 1rem; color: #64748B; line-height: 1.6;">
              Everything you need to know about working with KLEEN.
            </p>
          </div>

          <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 1rem;" id="partner-faq-container">
            
            <!-- FAQ 1 -->
            <div class="faq-item" style="border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background: #F8FAFC;">
              <button type="button" class="faq-toggle-btn" style="width: 100%; text-align: left; padding: 1.25rem 1.5rem; background: none; border: none; display: flex; justify-content: space-between; align-items: center; font-size: 1.05rem; font-weight: 700; color: #09281E; cursor: pointer;">
                <span>How and when do I receive my earnings?</span>
                <span class="faq-icon" style="font-size: 1.2rem; color: #059669; transition: transform 0.2s;">+</span>
              </button>
              <div class="faq-answer" style="display: none; padding: 0 1.5rem 1.25rem; font-size: 0.925rem; color: #64748B; line-height: 1.65; border-top: 1px solid #F1F5F9;">
                All payouts are transferred automatically every Tuesday morning directly into your registered bank account or UPI ID. You will receive an SMS and in-app statement detailing every booking, net payout (80%), and tips.
              </div>
            </div>

            <!-- FAQ 2 -->
            <div class="faq-item" style="border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background: #F8FAFC;">
              <button type="button" class="faq-toggle-btn" style="width: 100%; text-align: left; padding: 1.25rem 1.5rem; background: none; border: none; display: flex; justify-content: space-between; align-items: center; font-size: 1.05rem; font-weight: 700; color: #09281E; cursor: pointer;">
                <span>Is there any joining fee, deposit, or kit charge?</span>
                <span class="faq-icon" style="font-size: 1.2rem; color: #059669; transition: transform 0.2s;">+</span>
              </button>
              <div class="faq-answer" style="display: none; padding: 0 1.5rem 1.25rem; font-size: 0.925rem; color: #64748B; line-height: 1.65; border-top: 1px solid #F1F5F9;">
                Zero! KLEEN charges absolutely NO joining fee, registration fee, or security deposit. The starter kit, including your branded apron and identification card, is provided completely free of charge.
              </div>
            </div>

            <!-- FAQ 3 -->
            <div class="faq-item" style="border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background: #F8FAFC;">
              <button type="button" class="faq-toggle-btn" style="width: 100%; text-align: left; padding: 1.25rem 1.5rem; background: none; border: none; display: flex; justify-content: space-between; align-items: center; font-size: 1.05rem; font-weight: 700; color: #09281E; cursor: pointer;">
                <span>Can I choose my own hours and holidays?</span>
                <span class="faq-icon" style="font-size: 1.2rem; color: #059669; transition: transform 0.2s;">+</span>
              </button>
              <div class="faq-answer" style="display: none; padding: 0 1.5rem 1.25rem; font-size: 0.925rem; color: #64748B; line-height: 1.65; border-top: 1px solid #F1F5F9;">
                Yes, you have complete freedom! In our on-demand Gig model, you are your own boss. Browse the live Gig Marketplace whenever you want to work, claim high-paying cleaning jobs that fit your preferences, and go offline whenever you want time off.
              </div>
            </div>

            <!-- FAQ 4 -->
            <div class="faq-item" style="border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background: #F8FAFC;">
              <button type="button" class="faq-toggle-btn" style="width: 100%; text-align: left; padding: 1.25rem 1.5rem; background: none; border: none; display: flex; justify-content: space-between; align-items: center; font-size: 1.05rem; font-weight: 700; color: #09281E; cursor: pointer;">
                <span>What happens if a customer cancels at the last minute?</span>
                <span class="faq-icon" style="font-size: 1.2rem; color: #059669; transition: transform 0.2s;">+</span>
              </button>
              <div class="faq-answer" style="display: none; padding: 0 1.5rem 1.25rem; font-size: 0.925rem; color: #64748B; line-height: 1.65; border-top: 1px solid #F1F5F9;">
                If a customer cancels within 2 hours of the scheduled booking or after you have set out on your trip, you receive a guaranteed cancellation compensation credited directly to your weekly payout.
              </div>
            </div>

            <!-- FAQ 5 -->
            <div class="faq-item" style="border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; background: #F8FAFC;">
              <button type="button" class="faq-toggle-btn" style="width: 100%; text-align: left; padding: 1.25rem 1.5rem; background: none; border: none; display: flex; justify-content: space-between; align-items: center; font-size: 1.05rem; font-weight: 700; color: #09281E; cursor: pointer;">
                <span>How do I get help if I face any issue at a customer's home?</span>
                <span class="faq-icon" style="font-size: 1.2rem; color: #059669; transition: transform 0.2s;">+</span>
              </button>
              <div class="faq-answer" style="display: none; padding: 0 1.5rem 1.25rem; font-size: 0.925rem; color: #64748B; line-height: 1.65; border-top: 1px solid #F1F5F9;">
                You can press the red SOS emergency button in the app or call our 24/7 dedicated partner helpline at 1800-419-5533. Our regional team will immediately support and resolve the matter with the customer.
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- BOTTOM HIGH-CONVERSION CTA BANNER -->
      <section style="background: linear-gradient(135deg, #09281E 0%, #0F4C3A 100%); color: #FFFFFF; padding: 5rem 0; text-align: center; position: relative; overflow: hidden;">
        <div class="app-container" style="position: relative; z-index: 2; max-width: 720px; margin: 0 auto;">
          <h2 style="font-size: 2.5rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 1rem;">
            Ready to Take Control of Your Financial Future?
          </h2>
          <p style="font-size: 1.15rem; color: rgba(255,255,255,0.85); line-height: 1.6; margin-bottom: 2.25rem;">
            Join over 10,000 satisfied partners earning steady weekly incomes with respect and security.
          </p>
          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <a href="#/partner/register" style="background: #10B981; color: #FFFFFF; font-weight: 700; font-size: 1.05rem; padding: 0.9rem 2.25rem; border-radius: 10px; text-decoration: none; box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4); transition: all 0.2s;" onmouseover="this.style.background='#059669'; this.style.transform='translateY(-2px)'" onmouseout="this.style.background='#10B981'; this.style.transform='none'">
              Register as Partner Now &rarr;
            </a>
            <a href="#/partner/login" style="background: rgba(255,255,255,0.12); color: #FFFFFF; font-weight: 600; font-size: 1.05rem; padding: 0.9rem 2rem; border-radius: 10px; text-decoration: none; border: 1px solid rgba(255,255,255,0.25); backdrop-filter: blur(8px); transition: all 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.12)'">
              Partner Sign In
            </a>
          </div>
          <div style="margin-top: 2rem; font-size: 0.85rem; color: rgba(255,255,255,0.65);">
            Have questions before applying? Call Partner Helpline: <strong style="color: #34D399;">1800-419-KLEEN</strong>
          </div>
        </div>
      </section>

    </div>
  `;
}

export function attachPartnerRecruitmentEvents() {
  // 1. Quick Lead Apply Form handler
  const leadForm = document.getElementById("partner-quick-apply-form");
  if (leadForm) {
    leadForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = document.getElementById("lead-name")?.value || "";
      const phone = document.getElementById("lead-phone")?.value || "";
      const city = document.getElementById("lead-city")?.value || "Bangalore";
      const skill = document.getElementById("lead-skill")?.value || "All-Rounder Maid";

      // Store lead info in sessionStorage so the partner register page can pre-fill
      try {
        sessionStorage.setItem("kleen_partner_lead", JSON.stringify({
          fullName: name,
          phone: phone,
          city: city,
          skill: skill
        }));
      } catch (err) {
        console.error("Failed to save lead info:", err);
      }

      // Navigate to partner register page
      window.location.hash = "#/partner/register";
    });
  }

  // 2. Earnings Calculator Logic
  let hourlyRate = 240;
  let dailyHours = 6;
  let daysPerWeek = 6;

  const sliderHours = document.getElementById("slider-calc-hours");
  const sliderDays = document.getElementById("slider-calc-days");
  const displayHours = document.getElementById("display-calc-hours");
  const displayDays = document.getElementById("display-calc-days");
  const displayMonthly = document.getElementById("calc-monthly-total");
  const displayWeekly = document.getElementById("calc-weekly-total");
  const displayTips = document.getElementById("calc-tips-total");
  const displayBonusTier = document.getElementById("calc-bonus-tier");
  const displayGrand = document.getElementById("calc-grand-total");
  const serviceButtons = document.querySelectorAll(".calc-service-btn");

  function updateCalculator() {
    const weeklyHours = dailyHours * daysPerWeek;
    const weeklyBasePayout = weeklyHours * hourlyRate;
    const monthlyBasePayout = weeklyBasePayout * 4;

    // Tips estimated based on hours worked
    const estimatedTips = Math.round(monthlyBasePayout * 0.075);

    // Bonus tier calculation
    let bonusAmount = 1000;
    let bonusTierName = "Silver (₹1,000)";
    if (monthlyBasePayout >= 40000) {
      bonusAmount = 4000;
      bonusTierName = "Platinum (₹4,000)";
    } else if (monthlyBasePayout >= 30000) {
      bonusAmount = 2500;
      bonusTierName = "Gold (₹2,500)";
    }

    const grandTotal = monthlyBasePayout + estimatedTips + bonusAmount;

    if (displayMonthly) displayMonthly.textContent = `₹${monthlyBasePayout.toLocaleString("en-IN")}`;
    if (displayWeekly) displayWeekly.textContent = `₹${weeklyBasePayout.toLocaleString("en-IN")}`;
    if (displayTips) displayTips.textContent = `₹${estimatedTips.toLocaleString("en-IN")}`;
    if (displayBonusTier) displayBonusTier.textContent = bonusTierName;
    if (displayGrand) displayGrand.textContent = `₹${grandTotal.toLocaleString("en-IN")}`;
  }

  if (sliderHours && displayHours) {
    sliderHours.addEventListener("input", (e) => {
      dailyHours = parseInt(e.target.value, 10);
      displayHours.textContent = `${dailyHours} Hours/Day`;
      updateCalculator();
    });
  }

  if (sliderDays && displayDays) {
    sliderDays.addEventListener("input", (e) => {
      daysPerWeek = parseInt(e.target.value, 10);
      displayDays.textContent = `${daysPerWeek} Days/Week`;
      updateCalculator();
    });
  }

  serviceButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      serviceButtons.forEach((b) => {
        b.style.borderColor = "#E2E8F0";
        b.style.background = "#FFFFFF";
        b.style.color = "#475569";
        const subtext = b.querySelector("span");
        if (subtext) subtext.style.color = "#64748B";
      });

      btn.style.borderColor = "#10B981";
      btn.style.background = "#ECFDF5";
      btn.style.color = "#065F46";
      const subtext = btn.querySelector("span");
      if (subtext) subtext.style.color = "#059669";

      hourlyRate = parseInt(btn.getAttribute("data-rate"), 10) || 240;
      updateCalculator();
    });
  });

  // Initial calculation
  updateCalculator();

  // 3. FAQ Accordion Logic
  const faqToggles = document.querySelectorAll(".faq-toggle-btn");
  faqToggles.forEach((btn) => {
    btn.addEventListener("click", () => {
      const parent = btn.closest(".faq-item");
      const answer = parent?.querySelector(".faq-answer");
      const iconSpan = btn.querySelector(".faq-icon");

      if (answer) {
        const isCurrentlyOpen = answer.style.display === "block";
        // Close all first
        document.querySelectorAll(".faq-answer").forEach((a) => (a.style.display = "none"));
        document.querySelectorAll(".faq-icon").forEach((i) => {
          i.textContent = "+";
          i.style.transform = "none";
        });

        if (!isCurrentlyOpen) {
          answer.style.display = "block";
          if (iconSpan) {
            iconSpan.textContent = "−";
            iconSpan.style.transform = "rotate(180deg)";
          }
        }
      }
    });
  });

  // 4. Quick Apply Lead Form Submission
  const quickApplyForm = document.getElementById("partner-quick-apply-form");
  if (quickApplyForm) {
    quickApplyForm.onsubmit = (e) => {
      e.preventDefault();
      const fullName = document.getElementById("lead-name")?.value.trim();
      const phone = document.getElementById("lead-phone")?.value.trim();
      const district = document.getElementById("lead-city")?.value.trim() || DEFAULT_DISTRICT;
      const skill = document.getElementById("lead-skill")?.value.trim();

      sessionStorage.setItem("kleen_partner_lead", JSON.stringify({
        fullName,
        phone: "+91 " + (phone ? phone.replace(/^\+91\s*/, "") : ""),
        district,
        city: district,
        skill
      }));

      window.location.hash = "#/partner/register";
    };
  }
}
