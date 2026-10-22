/**
 * KLEEN — Global Footer Component
 * Includes Services, Company links, "How It Works", "Offers", "Contact",
 * and an Admin text link that directs to the admin page (no buttons, no role switcher).
 */

import { auth } from "../services/auth-service.js";
import { icon } from "./icons.js";

export function renderFooter() {
  return `
    <footer class="kleen-global-footer" style="background: #09281E; color: #FFFFFF; padding: 4.5rem 0 2.5rem; margin-top: 4rem; border-top: 1px solid rgba(255, 255, 255, 0.08);">
      <div class="app-container">
        <!-- Main Footer Links Grid -->
        <div style="display: grid; grid-template-columns: 2fr 1.2fr 1.2fr 1.6fr; gap: 3rem; margin-bottom: 3.5rem;">
          <!-- Col 1: Brand & Mission -->
          <div>
            <div style="display: flex; align-items: center; gap: 0.6rem; margin-bottom: 1.25rem;">
              <a href="#/" style="display: inline-block; text-decoration: none;">
                <img src="assets/kleen-logo-white.png" alt="KLEEN" style="height: 42px; width: auto; max-width: 165px; object-fit: contain; display: block;" />
              </a>
            </div>
            <p style="color: rgba(255, 255, 255, 0.72); font-size: 0.875rem; max-width: 320px; line-height: 1.65; margin-bottom: 0;">
              India's premier on-demand maid and residential hygiene platform. Connecting verified, police-cleared professionals with modern homes.
            </p>
          </div>

          <!-- Col 2: Services -->
          <div>
            <h4 style="color: #FFFFFF; font-size: 0.95rem; font-weight: 700; margin-bottom: 1.25rem; letter-spacing: 0.02em;">Services</h4>
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.65rem; font-size: 0.875rem; padding: 0; margin: 0;">
              <li><a href="#/services" style="color: rgba(255, 255, 255, 0.75); text-decoration: none; transition: color var(--transition-fast);" onmouseover="this.style.color='#34D399'" onmouseout="this.style.color='rgba(255, 255, 255, 0.75)'">Full Deep Cleaning</a></li>
              <li><a href="#/services" style="color: rgba(255, 255, 255, 0.75); text-decoration: none; transition: color var(--transition-fast);" onmouseover="this.style.color='#34D399'" onmouseout="this.style.color='rgba(255, 255, 255, 0.75)'">Regular Maid Service</a></li>
              <li><a href="#/services" style="color: rgba(255, 255, 255, 0.75); text-decoration: none; transition: color var(--transition-fast);" onmouseover="this.style.color='#34D399'" onmouseout="this.style.color='rgba(255, 255, 255, 0.75)'">Kitchen Deep Clean</a></li>
              <li><a href="#/services" style="color: rgba(255, 255, 255, 0.75); text-decoration: none; transition: color var(--transition-fast);" onmouseover="this.style.color='#34D399'" onmouseout="this.style.color='rgba(255, 255, 255, 0.75)'">Bathroom Sanitation</a></li>
              <li><a href="#/services" style="color: rgba(255, 255, 255, 0.75); text-decoration: none; transition: color var(--transition-fast);" onmouseover="this.style.color='#34D399'" onmouseout="this.style.color='rgba(255, 255, 255, 0.75)'">Utensil Washing</a></li>
            </ul>
          </div>

          <!-- Col 3: Quick Links (How It Works, Offers, Contact, About, FAQ) -->
          <div>
            <h4 style="color: #FFFFFF; font-size: 0.95rem; font-weight: 700; margin-bottom: 1.25rem; letter-spacing: 0.02em;">Quick Links</h4>
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.65rem; font-size: 0.875rem; padding: 0; margin: 0;">
              <li><a href="#/how-it-works" style="color: #34D399; font-weight: 600; text-decoration: none; transition: color var(--transition-fast);" onmouseover="this.style.color='#6EE7B7'" onmouseout="this.style.color='#34D399'">How It Works →</a></li>
              <li><a href="#/offers" style="color: rgba(255, 255, 255, 0.75); text-decoration: none; transition: color var(--transition-fast);" onmouseover="this.style.color='#34D399'" onmouseout="this.style.color='rgba(255, 255, 255, 0.75)'">Coupons & Offers</a></li>
              <li><a href="#/contact" style="color: rgba(255, 255, 255, 0.75); text-decoration: none; transition: color var(--transition-fast);" onmouseover="this.style.color='#34D399'" onmouseout="this.style.color='rgba(255, 255, 255, 0.75)'">Contact Support</a></li>
              <li><a href="#/about" style="color: rgba(255, 255, 255, 0.75); text-decoration: none; transition: color var(--transition-fast);" onmouseover="this.style.color='#34D399'" onmouseout="this.style.color='rgba(255, 255, 255, 0.75)'">About KLEEN</a></li>
              <li><a href="#/faq" style="color: rgba(255, 255, 255, 0.75); text-decoration: none; transition: color var(--transition-fast);" onmouseover="this.style.color='#34D399'" onmouseout="this.style.color='rgba(255, 255, 255, 0.75)'">Help & FAQ</a></li>
            </ul>
          </div>

          <!-- Col 4: Partner & Helpdesk -->
          <div>
            <h4 style="color: #FFFFFF; font-size: 0.95rem; font-weight: 700; margin-bottom: 1.25rem; letter-spacing: 0.02em;">Partner & Support</h4>
            <div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.75); line-height: 1.7; margin-bottom: 1.25rem;">
              <p style="margin: 0 0 0.4rem 0; display: flex; align-items: center; gap: 0.4rem;"><span style="color: #34D399; display: flex; align-items: center;">${icon("phone", { size: 14, stroke: "#34D399" })}</span> <span><strong>Helpline:</strong> 1800-419-KLEEN</span></p>
              <p style="margin: 0 0 0.4rem 0; display: flex; align-items: center; gap: 0.4rem;"><span style="color: #34D399; display: flex; align-items: center;">${icon("mail", { size: 14, stroke: "#34D399" })}</span> <span><strong>Email:</strong> care@kleen.in</span></p>
              <p style="margin: 0 0 0.75rem 0; display: flex; align-items: center; gap: 0.4rem;"><span style="color: #34D399; display: flex; align-items: center;">${icon("map-pin", { size: 14, stroke: "#34D399" })}</span> <span><strong>Coverage:</strong> Bangalore • Mumbai • Delhi NCR</span></p>
            </div>
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 0.65rem; font-size: 0.875rem; padding: 0; margin: 0;">
              <li><a href="#/partner-with-us" style="color: rgba(255, 255, 255, 0.75); text-decoration: none; transition: color var(--transition-fast);" onmouseover="this.style.color='#34D399'" onmouseout="this.style.color='rgba(255, 255, 255, 0.75)'">Join as Maid Partner</a></li>
            </ul>
          </div>
        </div>

        <!-- Bottom Copyright & Legal Links -->
        <div style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 2rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem; font-size: 0.825rem; color: rgba(255, 255, 255, 0.55);">
          <span>© 2026 KLEEN Technologies India Pvt. Ltd. All rights reserved.</span>
          <div style="display: flex; gap: 1.5rem; align-items: center; flex-wrap: wrap;">
            <a href="#/about" style="color: rgba(255, 255, 255, 0.55); text-decoration: none;" onmouseover="this.style.color='#34D399'" onmouseout="this.style.color='rgba(255, 255, 255, 0.55)'">Security Policy</a>
            <a href="#/how-it-works" style="color: rgba(255, 255, 255, 0.55); text-decoration: none;" onmouseover="this.style.color='#34D399'" onmouseout="this.style.color='rgba(255, 255, 255, 0.55)'">Terms of Service</a>
            <a href="#/contact" style="color: rgba(255, 255, 255, 0.55); text-decoration: none;" onmouseover="this.style.color='#34D399'" onmouseout="this.style.color='rgba(255, 255, 255, 0.55)'">Privacy & Grievance</a>
            <a href="#/admin/login" style="color: rgba(255, 255, 255, 0.55); text-decoration: none;" onmouseover="this.style.color='#34D399'" onmouseout="this.style.color='rgba(255, 255, 255, 0.55)'">Admin</a>
          </div>
        </div>
      </div>
    </footer>
  `;
}

export function attachFooterEvents() {
  // Global footer events
}
