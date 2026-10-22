/**
 * KLEEN — Public Informational Pages (/about, /how-it-works, /offers, /contact, /faq, /404, /access-denied)
 */

import { toast } from "../../components/toast.js";
import { icon } from "../../components/icons.js";
import { SEED_OFFERS } from "../../config/seed-data.js";

export function renderAboutPage() {
  return `
    <div class="app-container" style="padding: 3.5rem 1rem 5rem;">
      <div style="max-width: 800px; margin: 0 auto; text-align: center; margin-bottom: 3.5rem;">
        <span class="badge badge-info" style="margin-bottom: 0.75rem;">Our Mission</span>
        <h1>Redefining Domestic Home Care in India</h1>
        <p style="font-size: 1.15rem; color: var(--text-muted); margin-top: 1rem; line-height: 1.6;">
          KLEEN was founded on a simple belief: urban homes deserve reliable, verified, and dignified home care services, while service partners deserve fair earnings, verified safety, and respect.
        </p>
      </div>

      <div class="glass-panel" style="padding: 3rem; margin-bottom: 3rem;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: center;">
          <div>
            <h3>The 4-Pillar KLEEN Standard</h3>
            <p style="margin: 1rem 0 1.5rem; line-height: 1.6; color: var(--text-secondary);">
              Every domestic helper on our platform completes criminal background verification, government Aadhaar authentication, and hands-on training in modern floor scrubbing, chemical safety, and courteous communication.
            </p>
            <div style="display: flex; flex-direction: column; gap: 0.75rem; font-size: 0.9rem; font-weight: 600;">
              <div style="display: flex; align-items: center; gap: 0.5rem;"><span style="color: var(--brand-emerald); display: flex; align-items: center;">${icon("check-circle", { size: 16 })}</span> <span>100% Background & Police Verified</span></div>
              <div style="display: flex; align-items: center; gap: 0.5rem;"><span style="color: var(--brand-emerald); display: flex; align-items: center;">${icon("check-circle", { size: 16 })}</span> <span>80% Earnings Retained by Partners</span></div>
              <div style="display: flex; align-items: center; gap: 0.5rem;"><span style="color: var(--brand-emerald); display: flex; align-items: center;">${icon("check-circle", { size: 16 })}</span> <span>Fixed, Transparent Pricing (No Bargaining)</span></div>
              <div style="display: flex; align-items: center; gap: 0.5rem;"><span style="color: var(--brand-emerald); display: flex; align-items: center;">${icon("check-circle", { size: 16 })}</span> <span>1-Click Re-clean Guarantee</span></div>
            </div>
          </div>
          <img src="https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=700&q=80" style="width:100%; border-radius: var(--radius-xl); box-shadow: var(--shadow-md);">
        </div>
      </div>
    </div>
  `;
}

export function renderHowItWorksPage() {
  return `
    <div class="app-container" style="padding: 3.5rem 1rem 5rem;">
      <div style="text-align: center; max-width: 700px; margin: 0 auto 3.5rem;">
        <span class="badge badge-info" style="margin-bottom: 0.75rem;">Transparent Process</span>
        <h1>How KLEEN Works</h1>
        <p style="font-size: 1.1rem; color: var(--text-muted); margin-top: 0.5rem;">
          From booking to a sparkling home in 6 seamless steps.
        </p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.75rem;">
        <div class="solid-card" style="padding: 2rem;">
          <div style="font-size: 1.75rem; margin-bottom: 0.75rem;">1️⃣</div>
          <h4>Discover & Choose</h4>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.35rem;">
            Browse bathroom cleaning, deep cleaning, and daily maid services with upfront task inclusions.
          </p>
        </div>
        <div class="solid-card" style="padding: 2rem;">
          <div style="font-size: 1.75rem; margin-bottom: 0.75rem;">2️⃣</div>
          <h4>Pick Date & Slot</h4>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.35rem;">
            Choose same-day express arrival or schedule days in advance for morning and afternoon slots.
          </p>
        </div>
        <div class="solid-card" style="padding: 2rem;">
          <div style="font-size: 1.75rem; margin-bottom: 0.75rem;">3️⃣</div>
          <h4>Pay Securely</h4>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.35rem;">
            100% cashless payment verified through Razorpay. Automatic coupon discounts applied.
          </p>
        </div>
        <div class="solid-card" style="padding: 2rem;">
          <div style="font-size: 1.75rem; margin-bottom: 0.75rem;">4️⃣</div>
          <h4>Verified Partner Dispatched</h4>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.35rem;">
            The nearest certified maid accepts your booking and arrives with standard cleaning kits.
          </p>
        </div>
        <div class="solid-card" style="padding: 2rem;">
          <div style="font-size: 1.75rem; margin-bottom: 0.75rem;">5️⃣</div>
          <h4>Real-Time Progress</h4>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.35rem;">
            Follow the live status timeline as your partner starts and completes each section of your home.
          </p>
        </div>
        <div class="solid-card" style="padding: 2rem;">
          <div style="font-size: 1.75rem; margin-bottom: 0.75rem;">6️⃣</div>
          <h4>Inspect & Rate</h4>
          <p style="font-size: 0.875rem; color: var(--text-muted); margin-top: 0.35rem;">
            Inspect your gleaming home, leave a star review, and tip your partner directly.
          </p>
        </div>
      </div>
    </div>
  `;
}

export function renderOffersPage() {
  return `
    <div class="app-container" style="padding: 3.5rem 1rem 5rem;">
      <div style="text-align: center; max-width: 600px; margin: 0 auto 3rem;">
        <span class="badge badge-success" style="margin-bottom: 0.75rem;">Exclusive Discounts</span>
        <h1>Current Platform Offers</h1>
        <p style="color: var(--text-muted); margin-top: 0.5rem;">Apply promo codes at checkout for instant savings.</p>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem;">
        ${SEED_OFFERS.map(o => `
          <div class="glass-card" style="padding: 2rem; border-left: 5px solid var(--brand-emerald);">
            <span class="badge badge-success">${o.code}</span>
            <h3 style="margin: 0.75rem 0 0.35rem;">${o.name}</h3>
            <p style="font-size: 0.875rem; color: var(--text-muted); margin-bottom: 1.25rem;">${o.description}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #E5E7EB; padding-top: 1rem;">
              <span style="font-size: 0.8rem; color: var(--text-secondary);">Min. order: ₹${o.minimumAmount}</span>
              <button class="btn btn-secondary btn-sm btn-copy-code" data-code="${o.code}">Copy Code</button>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

export function renderContactPage() {
  return `
    <div class="app-container" style="padding: 3.5rem 1rem 5rem;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem; align-items: flex-start;">
        <div>
          <span class="badge badge-info" style="margin-bottom: 0.5rem;">Support 24/7</span>
          <h2>Contact KLEEN Care</h2>
          <p style="color: var(--text-muted); margin: 0.75rem 0 2rem; line-height: 1.6;">
            Have a question regarding your booking or interested in registering as a service partner? Reach out to our operational headquarters.
          </p>

          <div style="display: flex; flex-direction: column; gap: 1.25rem;">
            <div style="display: flex; gap: 1rem; align-items: center;">
              <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--brand-sage-light); display: flex; align-items: center; justify-content: center; color: var(--brand-emerald);">${icon("phone", { size: 20 })}</div>
              <div>
                <strong style="display: block;">Toll-Free Helpline</strong>
                <span style="color: var(--text-muted); font-size: 0.9rem;">1800-419-KLEEN (9 AM - 9 PM)</span>
              </div>
            </div>

            <div style="display: flex; gap: 1rem; align-items: center;">
              <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--brand-sage-light); display: flex; align-items: center; justify-content: center; color: var(--brand-emerald);">${icon("mail", { size: 20 })}</div>
              <div>
                <strong style="display: block;">Email Support</strong>
                <span style="color: var(--text-muted); font-size: 0.9rem;">care@kleen.in</span>
              </div>
            </div>

            <div style="display: flex; gap: 1rem; align-items: center;">
              <div style="width: 44px; height: 44px; border-radius: 50%; background: var(--brand-sage-light); display: flex; align-items: center; justify-content: center; color: var(--brand-emerald);">${icon("map-pin", { size: 20 })}</div>
              <div>
                <strong style="display: block;">Kerala Operations Center</strong>
                <span style="color: var(--text-muted); font-size: 0.9rem;">Kowdiar, Thiruvananthapuram, Kerala 695003</span>
              </div>
            </div>
          </div>
        </div>

        <div class="solid-card" style="padding: 2rem;">
          <h3 style="margin-bottom: 1.25rem;">Send Us a Message</h3>
          <form id="contact-us-form">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" id="contact-name" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label">Email Address</label>
              <input type="email" id="contact-email" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label">Message</label>
              <textarea id="contact-msg" class="form-textarea" required></textarea>
            </div>
            <button type="submit" class="btn btn-primary btn-md" style="width: 100%;">Send Inquiry</button>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function renderFaqPage() {
  const faqs = [
    { q: "Are all KLEEN maids and service partners verified?", a: "Yes. Every partner must complete government photo ID verification (Aadhaar/PAN), residential address verification, and criminal background checks prior to being activated." },
    { q: "Do I need to supply cleaning supplies?", a: "Our deep cleaning partners bring commercial-grade vacuums, tile scrubbers, and safe biodegradable detergents. For daily housekeeping, our partner uses your preferred bucket, mop, and floor cleaner." },
    { q: "Can I reschedule or cancel my booking?", a: "Yes, you can cancel or reschedule for free up to 2 hours before the scheduled slot directly from your Customer Bookings tab." },
    { q: "How is payment handled?", a: "All transactions are 100% cashless and processed securely via Razorpay. We do not support cash payments to protect partner and customer safety." }
  ];

  return `
    <div class="app-container" style="padding: 3.5rem 1rem 5rem; max-width: 800px;">
      <div style="text-align: center; margin-bottom: 3rem;">
        <span class="badge badge-info" style="margin-bottom: 0.75rem;">Help Center</span>
        <h1>Frequently Asked Questions</h1>
      </div>

      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${faqs.map(f => `
          <div class="solid-card" style="padding: 1.5rem;">
            <h4 style="margin-bottom: 0.5rem; color: var(--brand-emerald-dark);">${f.q}</h4>
            <p style="font-size: 0.9rem; color: var(--text-secondary); line-height: 1.5;">${f.a}</p>
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

export function renderNotFoundPage() {
  return `
    <div class="app-container" style="text-align: center; padding: 6rem 1rem;">
      <h1 style="font-size: 4rem; color: var(--brand-emerald-dark);">404</h1>
      <h2>Page Not Found</h2>
      <p style="color: var(--text-muted); margin: 0.75rem auto 1.5rem; max-width: 400px;">
        The link you followed may be broken or the page may have been moved.
      </p>
      <a href="#/" class="btn btn-primary btn-md">Return Home</a>
    </div>
  `;
}

export function renderAccessDeniedPage() {
  return `
    <div class="app-container" style="text-align: center; padding: 6rem 1rem;">
      <div style="display: flex; justify-content: center; margin-bottom: 1rem; color: #EF4444;">${icon("shield-alert", { size: 54, stroke: "#EF4444" })}</div>
      <h2>Access Denied</h2>
      <p style="color: var(--text-muted); margin: 0.75rem auto 1.5rem; max-width: 440px;">
        You do not have the required administrative or partner credentials to access this area.
      </p>
      <a href="#/" class="btn btn-primary btn-md">Return to Home</a>
    </div>
  `;
}

export function attachInfoPagesEvents() {
  document.querySelectorAll(".btn-copy-code").forEach(btn => {
    btn.onclick = () => {
      const code = btn.getAttribute("data-code");
      navigator.clipboard.writeText(code);
      toast.success("Coupon Copied", `Code ${code} copied to clipboard.`);
    };
  });

  const contactForm = document.getElementById("contact-us-form");
  if (contactForm) {
    contactForm.onsubmit = (e) => {
      e.preventDefault();
      toast.success("Message Sent", "Thank you for contacting KLEEN. Our care team will reply within 2 hours.");
      contactForm.reset();
    };
  }
}
