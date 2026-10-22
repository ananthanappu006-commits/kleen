# KLEEN — Professional On-Demand Maid & Home-Service Booking Platform

KLEEN is an end-to-end, production-grade on-demand maid and home-care booking platform connecting homeowners with background-verified service partners. It provides three connected interfaces (**Customer**, **Maid/Partner**, and **Admin**) operating over a unified Firebase architecture with an **Apple-inspired Liquid Glass** design aesthetic.

---

## Architecture Overview

```
                         KLEEN PLATFORM
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
CUSTOMER INTERFACE      PARTNER INTERFACE        ADMIN DASHBOARD
  (/customer)              (/partner)               (/admin)
• Service Discovery     • 7-Step KYC Wizard     • Operations Analytics
• Address Book (CRUD)   • Online/Offline Toggle • KYC Review Workbench
• Multi-Step Booking    • Live Job Dispatch     • Dispatch Board & Assign
• Razorpay Payment Flow • Status Stepper        • Services & Offers CRUD
• Real-Time Tracking    • Earnings & Ledger     • Disputes & Complaints
       │                       │                       │
       └───────────────────────┼───────────────────────┘
                               ▼
                       FIREBASE SERVICES
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
 Firebase Auth          Cloud Firestore         Firebase Storage
• Email / Password     • Unified Collections   • Private KYC Documents
• Role-Based Security  • Real-Time Pub/Sub     • Profile Photos
                               │
                        CLOUD FUNCTIONS
                               │
                       ┌───────┴───────┐
                       ▼               ▼
                    RAZORPAY     NOTIFICATIONS
```

---

## Technology Stack

- **Frontend**: HTML5, CSS3 (Vanilla design tokens, Liquid Glass, Apple-style motion), Modern JavaScript ES6+ (Modular architecture).
- **Backend**: Firebase Authentication, Cloud Firestore, Firebase Storage, Firebase Cloud Functions.
- **Payment Gateway**: Razorpay (Secure backend order generation and HMAC SHA-256 signature verification).
- **Hosting**: Firebase Hosting (`firebase.json`).

---

## Project Structure

```
kleen/
├── public/                      # Public static assets & favicon
├── src/
│   ├── assets/                  # Curated photography & brand logos
│   ├── components/              # Reusable UI components (Navbar, Modal, Toast, Cards)
│   ├── config/                  # Firebase credentials & seed catalog data
│   ├── pages/
│   │   ├── public/              # Home, Services, Service Detail, About, Offers, FAQ, Auth
│   │   ├── customer/            # Dashboard, Profile, Addresses, Bookings, Support, Notifications
│   │   ├── partner/             # Registration, 7-Step KYC Wizard, Dashboard, Schedule, Earnings
│   │   └── admin/               # Analytics, KYC Workbench, Bookings Dispatch, Catalog, Disputes
│   ├── services/
│   │   ├── firebase/            # Firebase SDK client & persistence adapter
│   │   ├── auth/                # Authentication & Role-Based Access Control
│   │   ├── booking/             # Booking state machine & price calculation
│   │   ├── payment/             # Razorpay order generation & verification
│   │   ├── partner/             # KYC document upload & availability management
│   │   ├── notification/        # In-app notification dispatcher
│   │   └── admin/               # Administrative operations & audit logs
│   ├── styles/                  # Design tokens, liquid-glass styles, and responsive CSS
│   └── app.js                   # Application bootstrap & client router
├── functions/                   # Firebase Cloud Functions backend logic
│   ├── src/
│   │   ├── payments/            # Razorpay order creation & webhook verification
│   │   ├── bookings/            # Dispatch transactions & status progression
│   │   ├── partners/            # Partner KYC verification triggers
│   │   ├── notifications/       # Notification delivery logic
│   │   └── admin/               # Privileged administration & audit logs
│   ├── index.js
│   └── package.json
├── firestore.rules              # Cloud Firestore security rules
├── storage.rules                # Firebase Storage security rules
├── firebase.json                # Firebase Hosting and Functions configuration
├── package.json                 # Project dependencies & scripts
└── README.md
```

---

## Getting Started & Local Development

### Prerequisites
- Any modern web browser (Chrome, Edge, Firefox, Safari).
- Windows PowerShell (or any static HTTP server).

### Running Locally
Run the lightweight local HTTP server:
```powershell
powershell -ExecutionPolicy Bypass -File .\serve.ps1
```
Open **`http://localhost:8080/`** in your browser.

---

## Interactive Role Switcher
For seamless demonstration across all roles, a floating pill in the bottom-right allows instant switching between:
1. **Customer**: Browse services, schedule slots, pay with Razorpay, and view real-time tracking.
2. **Maid (Verified)**: Manage availability, accept/decline job requests, step through job stages (`Start Trip` → `Arrived` → `In Progress` → `Completed`), and view the earnings ledger.
3. **Maid (Pending KYC)**: Experience the 7-Step KYC Wizard and review status screen.
4. **Admin**: Review partner applications in the split-pane KYC Workbench, dispatch bookings to partners, edit the catalog, and resolve disputes.

---

## Connecting Live Firebase & Razorpay

1. In `src/config/firebase-config.js`, verify your Firebase Web App credentials.
2. In `src/config/razorpay-config.js`, Razorpay client keys are configured (`keyId`).
3. In `functions/.env`, backend credentials are set for order generation and cryptographic HMAC signature validation:
   ```bash
   RAZORPAY_KEY_ID="rzp_test_TbrOTwP7wGgfOG"
   RAZORPAY_KEY_SECRET="PkmI51s3HZ1gVBDqM1NybEpV"
   ```
4. Deploy Firestore rules, Storage rules, and Cloud Functions when ready:
   ```bash
   firebase deploy
   ```

---

## Security Highlights
- **Role Validation**: Roles (`customer`, `partner`, `admin`) are verified server-side.
- **Private KYC Documents**: Protected by `storage.rules`, accessible only by the verified owner and authenticated admins.
- **Double Booking Protection**: Concurrency checks prevent multiple partners from accepting the same booking.
- **Payment Verification**: Razorpay payment signatures are validated cryptographically before marking a booking as confirmed.
