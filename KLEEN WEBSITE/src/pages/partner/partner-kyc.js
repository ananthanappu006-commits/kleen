/**
 * KLEEN — Partner 4-Step KYC Verification Wizard (/partner/kyc)
 * Steps: 1. Personal Information -> 2. Address -> 3. Documents -> 4. Review & Submit
 */

import { auth } from "../../services/auth-service.js";
import { db } from "../../services/db-service.js";
import { storage } from "../../services/storage-service.js";
import { toast } from "../../components/toast.js";
import { icon } from "../../components/icons.js";
import { renderDistrictOptions, DEFAULT_STATE, DEFAULT_DISTRICT } from "../../config/kerala-districts.js";

// Wizard state cached across steps
let kycFormData = {
  step: 1,
  personal: {
    fullName: "",
    dateOfBirth: "1994-05-12",
    gender: "Female",
    phone: "",
    email: ""
  },
  address: {
    house: "",
    street: "",
    area: "",
    district: DEFAULT_DISTRICT,
    city: DEFAULT_DISTRICT,
    state: DEFAULT_STATE,
    pinCode: "695001",
    landmark: ""
  },
  documents: {
    identityDocument: null, // { fileName, fileUrl, fileSize }
    addressDocument: null,
    profilePhoto: null,
    additionalDocument: null
  }
};

export function renderPartnerKycPage() {
  const user = auth.getCurrentUser();
  if (!user || user.role !== "partner") {
    return `
      <div class="app-container" style="max-width: 500px; padding: 4rem 1rem 6rem; text-align: center;">
        <div class="solid-card" style="padding: 2.5rem;">
          <div style="display: flex; justify-content: center; margin-bottom: 1.25rem;">
            <div class="icon-box icon-box-lg icon-box-slate">
              ${icon('lock', { size: 32 })}
            </div>
          </div>
          <h2>Partner Verification Portal</h2>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0.5rem 0 1.5rem;">
            Please log in or register as a KLEEN Partner to submit your verification documents.
          </p>
          <div style="display: flex; gap: 0.75rem; justify-content: center;">
            <a href="#/partner/login" class="btn btn-primary btn-md">Partner Login</a>
            <a href="#/partner/register" class="btn btn-secondary btn-md">Register as Partner</a>
          </div>
        </div>
      </div>
    `;
  }

  const partner = db.getPartnerById(user.userId) || user;

  // If KYC is approved, redirect to partner dashboard
  if (partner.kycStatus === "APPROVED") {
    window.location.hash = "#/partner";
    return "";
  }
  // If KYC is already submitted or under review, redirect to status tracker
  if (partner.kycStatus === "UNDER_REVIEW" || partner.kycStatus === "SUBMITTED") {
    window.location.hash = "#/partner/kyc/status";
    return "";
  }

  // Pre-fill initial personal info from user profile if empty
  if (!kycFormData.personal.fullName) {
    kycFormData.personal.fullName = partner.fullName || "";
    kycFormData.personal.email = partner.email || "";
    kycFormData.personal.phone = partner.phone || "";
    kycFormData.personal.dateOfBirth = partner.dateOfBirth || "1994-05-12";
    kycFormData.personal.gender = partner.gender || "Female";
  }

  const step = kycFormData.step || 1;

  return `
    <div class="app-container" style="max-width: 720px; padding: 3rem 1rem 6rem;">
      <div class="solid-card" style="padding: 2.5rem 2rem;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 2rem;">
          <span class="badge badge-success" style="margin-bottom: 0.5rem;">Official KYC Verification</span>
          <h2 style="font-size: 1.75rem; margin-bottom: 0.25rem;">Partner Onboarding & Verification</h2>
          <p style="color: var(--text-muted); font-size: 0.875rem;">
            Complete mandatory verification to unlock real customer jobs, direct weekly bank payouts, and guaranteed insurance.
          </p>
        </div>

        <!-- 4-Step Progress Indicator -->
        <div class="kyc-steps-indicator" style="display: flex; justify-content: space-between; margin-bottom: 2.5rem; position: relative;">
          ${[
            { num: 1, title: "Personal Info" },
            { num: 2, title: "Address" },
            { num: 3, title: "Documents" },
            { num: 4, title: "Review & Submit" }
          ].map(s => `
            <div class="kyc-step-item ${step === s.num ? 'active' : (step > s.num ? 'completed' : '')}" style="flex: 1; text-align: center; position: relative; z-index: 2;">
              <div style="width: 38px; height: 38px; border-radius: 50%; margin: 0 auto 0.4rem; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.9rem; background: ${step === s.num ? 'var(--brand-emerald-dark)' : (step > s.num ? '#10B981' : '#E5E7EB')}; color: ${step >= s.num ? '#FFF' : 'var(--text-muted)'};">
                ${step > s.num ? icon('check', { size: 16 }) : s.num}
              </div>
              <div style="font-size: 0.775rem; font-weight: 600; color: ${step === s.num ? 'var(--brand-emerald-dark)' : 'var(--text-secondary)'};">
                ${s.title}
              </div>
            </div>
          `).join("")}
        </div>

        <!-- Step 1: Personal Information -->
        <div id="kyc-step-1" style="${step === 1 ? '' : 'display: none;'}">
          <h3 style="font-size: 1.15rem; margin-bottom: 1.25rem;">Step 1 — Personal Information</h3>
          
          <div class="form-group">
            <label class="form-label">Full Legal Name (as on Aadhaar Card) *</label>
            <input type="text" id="kyc-fullname" class="form-input" value="${kycFormData.personal.fullName}" required>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">Date of Birth *</label>
              <input type="date" id="kyc-dob" class="form-input" value="${kycFormData.personal.dateOfBirth}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Gender *</label>
              <select id="kyc-gender" class="form-select">
                <option value="Female" ${kycFormData.personal.gender === 'Female' ? 'selected' : ''}>Female</option>
                <option value="Male" ${kycFormData.personal.gender === 'Male' ? 'selected' : ''}>Male</option>
                <option value="Other" ${kycFormData.personal.gender === 'Other' ? 'selected' : ''}>Other</option>
              </select>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">Phone Number *</label>
              <input type="tel" id="kyc-phone" class="form-input" value="${kycFormData.personal.phone}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Email Address *</label>
              <input type="email" id="kyc-email" class="form-input" value="${kycFormData.personal.email}" required>
            </div>
          </div>

          <div style="display: flex; justify-content: flex-end; margin-top: 1.5rem;">
            <button type="button" id="btn-kyc-next-1" class="btn btn-primary btn-md">
              Next: Address Details →
            </button>
          </div>
        </div>

        <!-- Step 2: Address Details -->
        <div id="kyc-step-2" style="${step === 2 ? '' : 'display: none;'}">
          <h3 style="font-size: 1.15rem; margin-bottom: 1.25rem;">Step 2 — Residential Address</h3>
          
          <div class="form-group">
            <label class="form-label">House / Flat / Building Name *</label>
            <input type="text" id="kyc-house" class="form-input" placeholder="e.g. Flat 204, Rose Villa" value="${kycFormData.address.house}" required>
          </div>

          <div class="form-group">
            <label class="form-label">Street / Colony / Main Road *</label>
            <input type="text" id="kyc-street" class="form-input" placeholder="e.g. 5th Cross, 2nd Main" value="${kycFormData.address.street}" required>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">Area / Locality *</label>
              <input type="text" id="kyc-area" class="form-input" placeholder="e.g. Indiranagar" value="${kycFormData.address.area}" required>
            </div>
            <div class="form-group">
              <label class="form-label">Nearby Landmark</label>
              <input type="text" id="kyc-landmark" class="form-input" placeholder="e.g. Near Metro Station" value="${kycFormData.address.landmark}">
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 0.75rem;">
            <div class="form-group">
              <label class="form-label">District (Kerala) *</label>
              <select id="kyc-district" class="form-select" required>
                ${renderDistrictOptions(kycFormData.address.district || kycFormData.address.city || DEFAULT_DISTRICT)}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">State</label>
              <input type="text" id="kyc-state" class="form-input" value="${DEFAULT_STATE}" readonly style="background: #F1F5F9; cursor: not-allowed;">
            </div>
            <div class="form-group">
              <label class="form-label">PIN Code *</label>
              <input type="text" id="kyc-pin" class="form-input" placeholder="695001" value="${kycFormData.address.pinCode || '695001'}" required pattern="[0-9]{6}">
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; margin-top: 1.5rem;">
            <button type="button" id="btn-kyc-back-2" class="btn btn-secondary btn-md">
              ← Back to Personal Info
            </button>
            <button type="button" id="btn-kyc-next-2" class="btn btn-primary btn-md">
              Next: Upload Documents →
            </button>
          </div>
        </div>

        <!-- Step 3: Document Uploads -->
        <div id="kyc-step-3" style="${step === 3 ? '' : 'display: none;'}">
          <h3 style="font-size: 1.15rem; margin-bottom: 0.5rem;">Step 3 — Document Verification</h3>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem;">
            Please upload clear, legible photos or PDF scans (max 5MB each). Documents are encrypted and protected by Firebase Security Rules.
          </p>

          <!-- 1. Government Identity Document (Aadhaar/Voter ID/Passport) -->
          <div class="kyc-upload-card" style="border: 1px solid #E5E7EB; border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1rem; background: #FAFAFA;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
              <div>
                <strong style="font-size: 0.95rem;">1. Government Identity Document *</strong>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.15rem 0 0;">Aadhaar Card or Voter ID (PDF, JPG, PNG &lt; 5MB)</p>
              </div>
              <span id="badge-doc-id" class="badge ${kycFormData.documents.identityDocument ? 'badge-success' : 'badge-neutral'}" style="display: inline-flex; align-items: center; gap: 0.25rem;">
                ${kycFormData.documents.identityDocument ? `${icon('check', { size: 12 })} Uploaded` : 'Required'}
              </span>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
              <input type="file" id="file-doc-id" accept=".pdf,image/jpeg,image/jpg,image/png" style="display: none;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('file-doc-id').click()">
                ${kycFormData.documents.identityDocument ? 'Replace Document' : 'Upload Document'}
              </button>
              ${kycFormData.documents.identityDocument ? `
                <button type="button" class="btn btn-danger btn-sm btn-remove-doc" data-key="identityDocument" data-badge="badge-doc-id" data-filename="filename-doc-id" style="padding: 0.25rem 0.5rem;">Remove</button>
              ` : ''}
              <span id="filename-doc-id" style="font-size: 0.8rem; color: var(--text-secondary);">
                ${kycFormData.documents.identityDocument ? kycFormData.documents.identityDocument.fileName : 'No file chosen'}
              </span>
            </div>
          </div>

          <!-- 2. Address Document -->
          <div class="kyc-upload-card" style="border: 1px solid #E5E7EB; border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1rem; background: #FAFAFA;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
              <div>
                <strong style="font-size: 0.95rem;">2. Address Proof Document *</strong>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.15rem 0 0;">Electricity Bill, Rental Agreement, or Gas Bill (PDF, JPG, PNG &lt; 5MB)</p>
              </div>
              <span id="badge-doc-addr" class="badge ${kycFormData.documents.addressDocument ? 'badge-success' : 'badge-neutral'}" style="display: inline-flex; align-items: center; gap: 0.25rem;">
                ${kycFormData.documents.addressDocument ? `${icon('check', { size: 12 })} Uploaded` : 'Required'}
              </span>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
              <input type="file" id="file-doc-addr" accept=".pdf,image/jpeg,image/jpg,image/png" style="display: none;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('file-doc-addr').click()">
                ${kycFormData.documents.addressDocument ? 'Replace Document' : 'Upload Document'}
              </button>
              ${kycFormData.documents.addressDocument ? `
                <button type="button" class="btn btn-danger btn-sm btn-remove-doc" data-key="addressDocument" data-badge="badge-doc-addr" data-filename="filename-doc-addr" style="padding: 0.25rem 0.5rem;">Remove</button>
              ` : ''}
              <span id="filename-doc-addr" style="font-size: 0.8rem; color: var(--text-secondary);">
                ${kycFormData.documents.addressDocument ? kycFormData.documents.addressDocument.fileName : 'No file chosen'}
              </span>
            </div>
          </div>

          <!-- 3. Profile Photo / Selfie -->
          <div class="kyc-upload-card" style="border: 1px solid #E5E7EB; border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1rem; background: #FAFAFA;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
              <div>
                <strong style="font-size: 0.95rem;">3. Professional Profile Photo (Selfie) *</strong>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.15rem 0 0;">Clear front-facing portrait with plain background (JPG, PNG &lt; 5MB)</p>
              </div>
              <span id="badge-doc-photo" class="badge ${kycFormData.documents.profilePhoto ? 'badge-success' : 'badge-neutral'}" style="display: inline-flex; align-items: center; gap: 0.25rem;">
                ${kycFormData.documents.profilePhoto ? `${icon('check', { size: 12 })} Uploaded` : 'Required'}
              </span>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
              <input type="file" id="file-doc-photo" accept="image/jpeg,image/jpg,image/png" style="display: none;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('file-doc-photo').click()">
                ${kycFormData.documents.profilePhoto ? 'Replace Photo' : 'Upload Photo'}
              </button>
              ${kycFormData.documents.profilePhoto ? `
                <button type="button" class="btn btn-danger btn-sm btn-remove-doc" data-key="profilePhoto" data-badge="badge-doc-photo" data-filename="filename-doc-photo" style="padding: 0.25rem 0.5rem;">Remove</button>
              ` : ''}
              <span id="filename-doc-photo" style="font-size: 0.8rem; color: var(--text-secondary);">
                ${kycFormData.documents.profilePhoto ? kycFormData.documents.profilePhoto.fileName : 'No photo chosen'}
              </span>
            </div>
          </div>

          <!-- 4. Additional Document (Optional) -->
          <div class="kyc-upload-card" style="border: 1px solid #E5E7EB; border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem; background: #FAFAFA;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
              <div>
                <strong style="font-size: 0.95rem;">4. Police Clearance / Experience Certificate (Optional)</strong>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.15rem 0 0;">Increases customer booking preference & priority badge (PDF, JPG, PNG)</p>
              </div>
              <span id="badge-doc-extra" class="badge ${kycFormData.documents.additionalDocument ? 'badge-success' : 'badge-neutral'}" style="display: inline-flex; align-items: center; gap: 0.25rem;">
                ${kycFormData.documents.additionalDocument ? `${icon('check', { size: 12 })} Attached` : 'Optional'}
              </span>
            </div>
            <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
              <input type="file" id="file-doc-extra" accept=".pdf,image/jpeg,image/jpg,image/png" style="display: none;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('file-doc-extra').click()">
                ${kycFormData.documents.additionalDocument ? 'Replace File' : 'Upload File'}
              </button>
              ${kycFormData.documents.additionalDocument ? `
                <button type="button" class="btn btn-danger btn-sm btn-remove-doc" data-key="additionalDocument" data-badge="badge-doc-extra" data-filename="filename-doc-extra" style="padding: 0.25rem 0.5rem;">Remove</button>
              ` : ''}
              <span id="filename-doc-extra" style="font-size: 0.8rem; color: var(--text-secondary);">
                ${kycFormData.documents.additionalDocument ? kycFormData.documents.additionalDocument.fileName : 'No file chosen'}
              </span>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; margin-top: 1.5rem;">
            <button type="button" id="btn-kyc-back-3" class="btn btn-secondary btn-md">
              ← Back to Address
            </button>
            <button type="button" id="btn-kyc-next-3" class="btn btn-primary btn-md">
              Next: Review & Confirm →
            </button>
          </div>
        </div>

        <!-- Step 4: Review and Submit -->
        <div id="kyc-step-4" style="${step === 4 ? '' : 'display: none;'}">
          <h3 style="font-size: 1.15rem; margin-bottom: 0.5rem;">Step 4 — Review Your Application</h3>
          <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 1.5rem;">
            Please double-check all details below before submitting for compliance verification.
          </p>

          <!-- Section 1 Review: Personal Information -->
          <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div class="icon-box icon-box-sm icon-box-slate">${icon('user', { size: 14 })}</div>
                <strong style="font-size: 0.95rem; color: var(--text-primary);">Personal Information</strong>
              </div>
              <button type="button" class="btn btn-glass btn-sm btn-kyc-edit" data-target-step="1">Edit</button>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.85rem;">
              <div><span style="color: var(--text-muted);">Full Name:</span> <strong>${kycFormData.personal.fullName}</strong></div>
              <div><span style="color: var(--text-muted);">Date of Birth:</span> <strong>${kycFormData.personal.dateOfBirth}</strong></div>
              <div><span style="color: var(--text-muted);">Gender:</span> <strong>${kycFormData.personal.gender}</strong></div>
              <div><span style="color: var(--text-muted);">Phone:</span> <strong>${kycFormData.personal.phone}</strong></div>
              <div style="grid-column: 1 / -1;"><span style="color: var(--text-muted);">Email:</span> <strong>${kycFormData.personal.email}</strong></div>
            </div>
          </div>

          <!-- Section 2 Review: Address -->
          <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div class="icon-box icon-box-sm icon-box-slate">${icon('map-pin', { size: 14 })}</div>
                <strong style="font-size: 0.95rem; color: var(--text-primary);">Residential Address</strong>
              </div>
              <button type="button" class="btn btn-glass btn-sm btn-kyc-edit" data-target-step="2">Edit</button>
            </div>
            <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
              ${kycFormData.address.house}, ${kycFormData.address.street}, ${kycFormData.address.area}, ${kycFormData.address.city}, ${kycFormData.address.state} - ${kycFormData.address.pinCode}
              ${kycFormData.address.landmark ? `<br><span style="color: var(--text-muted);">Landmark: ${kycFormData.address.landmark}</span>` : ''}
            </p>
          </div>

          <!-- Section 3 Review: Documents -->
          <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: var(--radius-md); padding: 1.25rem; margin-bottom: 1.5rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <div class="icon-box icon-box-sm icon-box-slate">${icon('file-text', { size: 14 })}</div>
                <strong style="font-size: 0.95rem; color: var(--text-primary);">Verification Documents</strong>
              </div>
              <button type="button" class="btn btn-glass btn-sm btn-kyc-edit" data-target-step="3">Edit</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.85rem;">
              <div style="display: flex; justify-content: space-between;">
                <span>Identity Document:</span>
                <strong>${kycFormData.documents.identityDocument ? kycFormData.documents.identityDocument.fileName : '<span style="color:red">Missing</span>'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Address Document:</span>
                <strong>${kycFormData.documents.addressDocument ? kycFormData.documents.addressDocument.fileName : '<span style="color:red">Missing</span>'}</strong>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <span>Profile Photo (Selfie):</span>
                <strong>${kycFormData.documents.profilePhoto ? kycFormData.documents.profilePhoto.fileName : '<span style="color:red">Missing</span>'}</strong>
              </div>
              ${kycFormData.documents.additionalDocument ? `
                <div style="display: flex; justify-content: space-between;">
                  <span>Police Verification:</span>
                  <strong>${kycFormData.documents.additionalDocument.fileName}</strong>
                </div>
              ` : ''}
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; margin-top: 1.5rem;">
            <button type="button" id="btn-kyc-back-4" class="btn btn-secondary btn-md" style="display: inline-flex; align-items: center; gap: 0.5rem;">
              ${icon('arrow-left', { size: 16 })}
              <span>Back to Documents</span>
            </button>
            <button type="button" id="btn-submit-kyc-final" class="btn btn-primary btn-md" style="font-weight: 700; display: inline-flex; align-items: center; gap: 0.5rem;">
              <span>Submit KYC Application</span>
              ${icon('arrow-right', { size: 16 })}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function attachPartnerKycEvents() {
  const switchStep = (newStep) => {
    kycFormData.step = newStep;
    window.scrollTo(0, 0);
    const container = document.getElementById("page-container");
    if (container) {
      container.innerHTML = renderPartnerKycPage();
      attachPartnerKycEvents();
    }
  };

  // Step 1 -> Step 2
  const next1 = document.getElementById("btn-kyc-next-1");
  if (next1) {
    next1.onclick = () => {
      const name = document.getElementById("kyc-fullname").value.trim();
      const dob = document.getElementById("kyc-dob").value;
      const gender = document.getElementById("kyc-gender").value;
      const phone = document.getElementById("kyc-phone").value.trim();
      const email = document.getElementById("kyc-email").value.trim();

      if (!name || !dob || !phone || !email) {
        toast.error("Required Fields", "Please enter your name, date of birth, phone, and email.");
        return;
      }

      kycFormData.personal = { fullName: name, dateOfBirth: dob, gender, phone, email };
      switchStep(2);
    };
  }

  // Step 2 -> Back & Next
  const back2 = document.getElementById("btn-kyc-back-2");
  if (back2) back2.onclick = () => switchStep(1);

  const next2 = document.getElementById("btn-kyc-next-2");
  if (next2) {
    next2.onclick = () => {
      const house = document.getElementById("kyc-house").value.trim();
      const street = document.getElementById("kyc-street").value.trim();
      const area = document.getElementById("kyc-area").value.trim();
      const districtEl = document.getElementById("kyc-district");
      const district = districtEl ? districtEl.value.trim() : DEFAULT_DISTRICT;
      const city = district;
      const state = (document.getElementById("kyc-state")?.value || DEFAULT_STATE).trim();
      const pinCode = document.getElementById("kyc-pin").value.trim();
      const landmark = document.getElementById("kyc-landmark").value.trim();

      if (!house || !street || !area || !district || !pinCode) {
        toast.error("Required Fields", "Please complete all required address fields.");
        return;
      }

      kycFormData.address = { house, street, area, city, district, state, pinCode, landmark };
      switchStep(3);
    };
  }

  // Step 3 -> Document Uploads
  const attachRemoveButtons = () => {
    document.querySelectorAll(".btn-remove-doc").forEach(btn => {
      btn.onclick = () => {
        const key = btn.getAttribute("data-key");
        const badgeId = btn.getAttribute("data-badge");
        const filenameId = btn.getAttribute("data-filename");
        if (key && kycFormData.documents[key]) {
          kycFormData.documents[key] = null;
          const badge = document.getElementById(badgeId);
          const fname = document.getElementById(filenameId);
          if (badge) {
            badge.className = "badge badge-neutral";
            badge.textContent = key === "additionalDocument" ? "OPTIONAL" : "REQUIRED";
          }
          if (fname) {
            fname.textContent = key === "profilePhoto" ? "No photo chosen" : "No file chosen";
          }
          btn.remove();
          toast.info("Document Removed", "You can now select a different file if needed.");
        }
      };
    });
  };
  attachRemoveButtons();

  const handleUpload = async (inputEl, docKey, badgeId, filenameId) => {
    if (!inputEl || !inputEl.files || !inputEl.files[0]) return;
    const file = inputEl.files[0];
    const user = auth.getCurrentUser();
    const partnerId = user?.userId || "partner";

    // 1. File size validation (< 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
    if (file.size > MAX_SIZE) {
      toast.error("File Too Large", "Document must be smaller than 5MB.");
      inputEl.value = "";
      return;
    }

    // 2. File type validation
    const allowedDocTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
    const allowedPhotoTypes = ["image/jpeg", "image/jpg", "image/png"];
    const isPhoto = docKey === "profilePhoto";
    const allowed = isPhoto ? allowedPhotoTypes : allowedDocTypes;

    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|jpg|jpeg|png)$/i)) {
      toast.error("Invalid Format", isPhoto ? "Profile photo must be a JPG or PNG image." : "File must be a PDF, JPG, or PNG document.");
      inputEl.value = "";
      return;
    }

    // 3. Exact Storage Paths per PRD Section 12
    let storagePath = "";
    if (docKey === "identityDocument") {
      storagePath = `partnerKyc/${partnerId}/identity/${file.name}`;
    } else if (docKey === "addressDocument") {
      storagePath = `partnerKyc/${partnerId}/address/${file.name}`;
    } else if (docKey === "profilePhoto") {
      storagePath = `profileImages/${partnerId}/${file.name}`;
    } else {
      storagePath = `partnerKyc/${partnerId}/additional/${file.name}`;
    }

    try {
      toast.info("Uploading...", `Uploading and encrypting ${file.name}`);
      const uploaded = await storage.uploadFile(file, storagePath);
      kycFormData.documents[docKey] = uploaded;

      const badge = document.getElementById(badgeId);
      const fname = document.getElementById(filenameId);
      if (badge) {
        badge.className = "badge badge-success";
        badge.innerHTML = docKey === "additionalDocument" ? `${icon('check', { size: 12 })} Attached` : `${icon('check', { size: 12 })} Uploaded`;
      }
      if (fname) fname.textContent = uploaded.fileName;

      // Ensure Remove button is present
      const parentContainer = inputEl.parentElement;
      if (parentContainer && !parentContainer.querySelector(`.btn-remove-doc[data-key="${docKey}"]`)) {
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "btn btn-danger btn-sm btn-remove-doc";
        removeBtn.style.padding = "0.25rem 0.5rem";
        removeBtn.setAttribute("data-key", docKey);
        removeBtn.setAttribute("data-badge", badgeId);
        removeBtn.setAttribute("data-filename", filenameId);
        removeBtn.textContent = "Remove";
        inputEl.insertAdjacentElement("afterend", removeBtn);
        attachRemoveButtons();
      }

      toast.success("Document Uploaded", `${file.name} successfully uploaded.`);
    } catch (err) {
      toast.error("Upload Failed", err.message || "Failed to upload document. Please try again.");
      const badge = document.getElementById(badgeId);
      if (badge) {
        badge.className = "badge badge-danger";
        badge.textContent = "FAILED";
      }
    }
  };

  const fileId = document.getElementById("file-doc-id");
  if (fileId) fileId.onchange = () => handleUpload(fileId, "identityDocument", "badge-doc-id", "filename-doc-id");

  const fileAddr = document.getElementById("file-doc-addr");
  if (fileAddr) fileAddr.onchange = () => handleUpload(fileAddr, "addressDocument", "badge-doc-addr", "filename-doc-addr");

  const filePhoto = document.getElementById("file-doc-photo");
  if (filePhoto) filePhoto.onchange = () => handleUpload(filePhoto, "profilePhoto", "badge-doc-photo", "filename-doc-photo");

  const fileExtra = document.getElementById("file-doc-extra");
  if (fileExtra) fileExtra.onchange = () => handleUpload(fileExtra, "additionalDocument", "badge-doc-extra", "filename-doc-extra");

  const back3 = document.getElementById("btn-kyc-back-3");
  if (back3) back3.onclick = () => switchStep(2);

  const next3 = document.getElementById("btn-kyc-next-3");
  if (next3) {
    next3.onclick = () => {
      // Validate mandatory documents per PRD Section 10
      if (!kycFormData.documents.identityDocument) {
        toast.error("Identity Document Required", "Please upload your Aadhaar Card or Voter ID.");
        return;
      }
      if (!kycFormData.documents.addressDocument) {
        toast.error("Address Document Required", "Please upload proof of residence (bill/agreement).");
        return;
      }
      if (!kycFormData.documents.profilePhoto) {
        toast.error("Profile Photo Required", "Please upload a clear selfie or portrait photo.");
        return;
      }
      switchStep(4);
    };
  }

  // Step 4 -> Edit Section Buttons
  document.querySelectorAll(".btn-kyc-edit").forEach(btn => {
    btn.onclick = () => {
      const target = parseInt(btn.getAttribute("data-target-step"), 10);
      if (target) switchStep(target);
    };
  });

  const back4 = document.getElementById("btn-kyc-back-4");
  if (back4) back4.onclick = () => switchStep(3);

  // Final Submit KYC
  const submitBtn = document.getElementById("btn-submit-kyc-final");
  if (submitBtn) {
    submitBtn.onclick = () => {
      const user = auth.getCurrentUser();
      if (!user) {
        toast.error("Session Expired", "Please log in again.");
        window.location.hash = "#/partner/login";
        return;
      }

      submitBtn.textContent = "Submitting Application to Admin...";
      submitBtn.disabled = true;

      const fullAddress = `${kycFormData.address.house}, ${kycFormData.address.street}, ${kycFormData.address.area}, ${kycFormData.address.city}, ${kycFormData.address.state} - ${kycFormData.address.pinCode}`;
      const nowIso = new Date().toISOString();

      // 1. Save KYC Payload with UNDER_REVIEW status
      db.savePartnerKyc(user.userId, {
        fullName: kycFormData.personal.fullName,
        dateOfBirth: kycFormData.personal.dateOfBirth,
        gender: kycFormData.personal.gender,
        phone: kycFormData.personal.phone,
        email: kycFormData.personal.email,
        address: fullAddress,
        city: kycFormData.address.city,
        district: kycFormData.address.district || kycFormData.address.city,
        state: kycFormData.address.state,
        pinCode: kycFormData.address.pinCode,
        identityDocument: kycFormData.documents.identityDocument,
        addressDocument: kycFormData.documents.addressDocument,
        profilePhoto: kycFormData.documents.profilePhoto,
        additionalDocument: kycFormData.documents.additionalDocument,
        status: "UNDER_REVIEW",
        submittedAt: nowIso
      });

      // 2. Update Partner Record to UNDER_REVIEW and PENDING_VERIFICATION
      const snapshot = db.getSnapshot();
      let updatedPartner = null;
      snapshot.partners = (snapshot.partners || []).map(p => {
        if (p.partnerId === user.userId || p.userId === user.userId) {
          updatedPartner = {
            ...p,
            fullName: kycFormData.personal.fullName,
            dateOfBirth: kycFormData.personal.dateOfBirth,
            gender: kycFormData.personal.gender,
            phone: kycFormData.personal.phone,
            address: fullAddress,
            city: kycFormData.address.city,
            district: kycFormData.address.district || kycFormData.address.city,
            state: kycFormData.address.state,
            pin: kycFormData.address.pinCode,
            profileImage: kycFormData.documents.profilePhoto?.fileUrl || p.profileImage,
            idProofUrl: kycFormData.documents.identityDocument?.fileUrl || p.idProofUrl,
            addressProofUrl: kycFormData.documents.addressDocument?.fileUrl || p.addressProofUrl,
            identityDocument: kycFormData.documents.identityDocument || p.identityDocument,
            addressDocument: kycFormData.documents.addressDocument || p.addressDocument,
            profilePhoto: kycFormData.documents.profilePhoto || p.profilePhoto,
            additionalDocument: kycFormData.documents.additionalDocument || p.additionalDocument,
            kycStatus: "UNDER_REVIEW",
            accountStatus: "PENDING_VERIFICATION",
            isEligibleForBooking: false,
            isOnline: false,
            submittedAt: nowIso
          };
          return updatedPartner;
        }
        return p;
      });

      // Ensure users collection is synced
      snapshot.users = (snapshot.users || []).map(u => {
        if (u.userId === user.userId) {
          return {
            ...u,
            fullName: kycFormData.personal.fullName,
            phone: kycFormData.personal.phone,
            role: "partner",
            accountStatus: "PENDING_VERIFICATION",
            kycStatus: "UNDER_REVIEW"
          };
        }
        return u;
      });

      // 3. Dispatch Notification to Admin
      const adminNotification = {
        notificationId: "notif_admin_" + Date.now(),
        userId: "usr_admin_kleen",
        type: "NEW_KYC_SUBMISSION",
        title: "New Partner KYC Documents Submitted",
        message: `${kycFormData.personal.fullName} submitted KYC documents (Identity Proof & Residential Address) for verification.`,
        partnerId: user.userId,
        partnerName: kycFormData.personal.fullName,
        isRead: false,
        createdAt: nowIso
      };

      const partnerNotification = {
        notificationId: "notif_part_" + Date.now(),
        userId: user.userId,
        type: "KYC_SUBMITTED",
        title: "KYC Documents Received",
        message: "Your verification documents have been received by the KLEEN Admin team and are currently under review.",
        isRead: false,
        createdAt: nowIso
      };

      snapshot.notifications = [adminNotification, partnerNotification, ...(snapshot.notifications || [])];
      db.saveSnapshot(snapshot);

      // Refresh active user session
      if (updatedPartner) {
        auth.currentUser = { ...auth.currentUser, ...updatedPartner };
        auth.saveSession();
      }

      // 4. Log Audit for Admin Compliance Log
      db.logAuditAction({
        actorId: user.userId,
        actorRole: "partner",
        action: "KYC_SUBMITTED_TO_ADMIN",
        targetId: user.userId,
        metadata: {
          partnerName: kycFormData.personal.fullName,
          hasIdentityDoc: !!kycFormData.documents.identityDocument,
          hasAddressDoc: !!kycFormData.documents.addressDocument,
          hasSelfie: !!kycFormData.documents.profilePhoto
        },
        description: `Partner ${kycFormData.personal.fullName} submitted complete KYC verification package to Admin.`
      });

      // Reset form cache
      kycFormData.step = 1;

      // Show success feedback and redirect to status screen
      toast.success("Documents Sent to Admin!", "Your KYC application has been received and is under review.");
      window.location.hash = "#/partner/kyc/status";
    };
  }
}
