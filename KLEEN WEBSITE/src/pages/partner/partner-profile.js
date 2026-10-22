/**
 * KLEEN — Partner Profile Management (/partner/profile)
 * Profile image upload, personal details editing, change password modal, and KYC status check.
 */

import { auth } from "../../services/auth-service.js";
import { db } from "../../services/db-service.js";
import { storage } from "../../services/storage-service.js";
import { modal } from "../../components/modal.js";
import { toast } from "../../components/toast.js";
import { icon } from "../../components/icons.js";
import { renderPartnerHeader, renderPartnerSidebar, renderPartnerMobileBottomNav, attachPartnerNavEvents } from "./partner-nav.js";
import { renderDistrictOptions, KERALA_DISTRICTS, DEFAULT_STATE, DEFAULT_DISTRICT } from "../../config/kerala-districts.js";
import { openBankDetailsModal } from "./partner-earnings.js?v=31";
import { findBank } from "../../config/indian-banks.js";

export function renderPartnerProfilePage() {
  const user = auth.getCurrentUser();
  if (!user || user.role !== "partner") {
    return `
      <div class="app-container" style="max-width: 480px; padding: 4rem 1rem; text-align: center;">
        <div class="solid-card" style="padding: 2.5rem;">
          <h2>Partner Access Required</h2>
          <a href="#/partner/login" class="btn btn-primary btn-md">Sign In as Partner</a>
        </div>
      </div>
    `;
  }

  const partnerId = user.partnerId || user.userId;
  const partner = db.getPartnerById(partnerId) || user;
  const resolvedBank = db.getPartnerBankDetails(partnerId) || partner.bankDetails || null;
  partner.bankDetails = resolvedBank;
  const avatar = partner.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(partner.fullName || 'Service Partner')}&background=064E3B&color=fff&size=160`;
  const profileBankMeta = (partner.bankDetails && partner.bankDetails.bankName) ? findBank(partner.bankDetails.bankName) : null;

  return `
    <div class="partner-layout">
      ${renderPartnerSidebar("/partner/profile")}

      <div class="partner-main-content">
        ${renderPartnerHeader("/partner/profile", partner)}

        <div class="partner-dashboard-body" style="max-width: 820px; margin: 0 auto; padding: 2rem 1rem 5rem;">
          
          <div style="margin-bottom: 2rem;">
            <span class="badge badge-info" style="margin-bottom: 0.35rem;">Partner Account</span>
            <h2 style="font-size: 1.65rem; margin: 0; font-weight: 800;">My Profile & Credentials</h2>
            <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0.25rem 0 0;">
              Manage your verified personal profile, photo, security settings, and KYC record
            </p>
          </div>

          <!-- Hero Avatar & Badges Card -->
          <div class="solid-card" style="padding: 2rem; margin-bottom: 1.75rem; display: flex; align-items: center; gap: 1.5rem; flex-wrap: wrap;">
            <div style="position: relative; text-align: center;">
              <img id="partner-profile-avatar" src="${avatar}" alt="${partner.fullName}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; border: 3px solid var(--brand-emerald);">
              <input type="file" id="file-partner-photo" accept="image/*" style="display: none;">
              <button type="button" id="btn-change-avatar" style="position: absolute; bottom: 0; right: 0; background: var(--brand-emerald-dark); color: #FFF; border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center;" title="Upload new photo">
                ${icon('camera', { size: 15, stroke: '#FFF' })}
              </button>
              ${partner.profileImage ? `
                <div style="margin-top: 0.5rem;">
                  <button type="button" id="btn-remove-avatar" class="btn btn-danger btn-sm" style="font-size: 0.7rem; padding: 0.2rem 0.5rem;">Remove</button>
                </div>
              ` : ''}
            </div>

            <div style="flex: 1; min-width: 240px;">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem; flex-wrap: wrap;">
                <h3 style="font-size: 1.35rem; margin: 0; font-weight: 800;">${partner.fullName || 'Service Partner'}</h3>
                <span class="badge ${partner.accountStatus === 'SUSPENDED' ? 'badge-danger' : (partner.accountStatus === 'DEACTIVATED' ? 'badge-neutral' : 'badge-success')}">
                  ${partner.accountStatus || 'ACTIVE'}
                </span>
              </div>
              <p style="color: var(--text-secondary); font-size: 0.85rem; margin: 0 0 0.5rem;">
                ${partner.email} • ${partner.phone || '+91 98765 43210'}
              </p>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; font-size: 0.8rem;">
                <span class="badge badge-neutral" style="display: inline-flex; align-items: center; gap: 0.3rem;">
                  ${icon('star', { size: 12, fill: '#F59E0B', stroke: '#F59E0B' })} ${partner.rating ? partner.rating.toFixed(1) : '5.0'} Rating
                </span>
                <span class="badge badge-neutral" style="display: inline-flex; align-items: center; gap: 0.3rem;">
                  ${icon('badge-check', { size: 12, stroke: '#10B981' })} ${partner.totalCompletedJobs || 0} Jobs Completed
                </span>
                <span class="badge badge-neutral" style="display: inline-flex; align-items: center; gap: 0.3rem;">
                  ${icon('indian-rupee', { size: 12, stroke: '#10B981' })} ${partner.totalEarnings || 0} Earned
                </span>
                <span class="badge ${partner.kycStatus === 'APPROVED' ? 'badge-success' : 'badge-warning'}">KYC: ${partner.kycStatus || 'NOT_STARTED'}</span>
              </div>
            </div>
          </div>

          <!-- Personal Information Card -->
          <div class="solid-card" style="padding: 2rem; margin-bottom: 1.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
              <h3 style="font-size: 1.15rem; margin: 0; font-weight: 800;">Personal Details</h3>
              <button id="btn-edit-partner-profile" class="btn btn-secondary btn-sm" style="font-weight: 700;">EDIT PROFILE</button>
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; font-size: 0.9rem;">
              <div>
                <span style="color: var(--text-muted); font-size: 0.775rem; text-transform: uppercase;">Full Legal Name</span>
                <div style="font-weight: 600; margin-top: 0.2rem;">${partner.fullName || 'Not recorded'}</div>
              </div>
              <div>
                <span style="color: var(--text-muted); font-size: 0.775rem; text-transform: uppercase;">Date of Birth</span>
                <div style="font-weight: 600; margin-top: 0.2rem;">${partner.dateOfBirth || '15 Aug 1990'}</div>
              </div>
              <div>
                <span style="color: var(--text-muted); font-size: 0.775rem; text-transform: uppercase;">Gender</span>
                <div style="font-weight: 600; margin-top: 0.2rem;">${partner.gender || 'Female'}</div>
              </div>
              <div>
                <span style="color: var(--text-muted); font-size: 0.775rem; text-transform: uppercase;">Contact Phone</span>
                <div style="font-weight: 600; margin-top: 0.2rem;">${partner.phone || 'N/A'}</div>
              </div>
              <div>
                <span style="color: var(--text-muted); font-size: 0.775rem; text-transform: uppercase;">Email Address</span>
                <div style="font-weight: 600; margin-top: 0.2rem;">${partner.email || 'N/A'}</div>
              </div>
              <div>
                <span style="color: var(--text-muted); font-size: 0.775rem; text-transform: uppercase;">Booking Eligibility</span>
                <div style="font-weight: 700; margin-top: 0.2rem; color: ${partner.kycStatus === 'APPROVED' && partner.accountStatus === 'ACTIVE' ? '#15803D' : '#D97706'};">
                  ${partner.kycStatus === 'APPROVED' && partner.accountStatus === 'ACTIVE' 
                    ? `<span style="display: inline-flex; align-items: center; gap: 0.3rem;">${icon('check', { size: 14 })} Eligible for Bookings</span>` 
                    : `<span style="display: inline-flex; align-items: center; gap: 0.3rem;">${icon('alert-triangle', { size: 14 })} Pending Admin KYC Approval</span>`}
                </div>
              </div>
              <div style="grid-column: 1 / -1;">
                <span style="color: var(--text-muted); font-size: 0.775rem; text-transform: uppercase;">Registered Address</span>
                <div style="font-weight: 600; margin-top: 0.2rem;">${partner.address || 'Kowdiar, Thiruvananthapuram'}</div>
              </div>
              <div>
                <span style="color: var(--text-muted); font-size: 0.775rem; text-transform: uppercase;">District</span>
                <div style="font-weight: 600; margin-top: 0.2rem;">${partner.district || partner.city || DEFAULT_DISTRICT}</div>
              </div>
              <div>
                <span style="color: var(--text-muted); font-size: 0.775rem; text-transform: uppercase;">State</span>
                <div style="font-weight: 600; margin-top: 0.2rem;">${partner.state || DEFAULT_STATE}</div>
              </div>
              <div>
                <span style="color: var(--text-muted); font-size: 0.775rem; text-transform: uppercase;">PIN Code</span>
                <div style="font-weight: 600; margin-top: 0.2rem;">${partner.pinCode || partner.pin || '695003'}</div>
              </div>
            </div>
          </div>

          <!-- Bank & Payout Details Card -->
          <div class="solid-card" style="padding: 2rem; margin-bottom: 1.75rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
              <div>
                <h3 style="font-size: 1.15rem; margin: 0; font-weight: 800;">Bank & Payout Details</h3>
                <p style="color: var(--text-muted); font-size: 0.825rem; margin: 0.2rem 0 0;">Used for weekly payouts and instant Quick Settle transfers</p>
              </div>
              <button id="btn-profile-edit-bank" class="btn btn-secondary btn-sm" style="font-weight: 700;">
                ${partner.bankDetails && partner.bankDetails.accountNumber ? 'CHANGE BANK DETAILS' : '+ ADD BANK ACCOUNT'}
              </button>
            </div>

            ${partner.bankDetails && partner.bankDetails.accountNumber ? `
              <div style="display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; background: linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 80%); border: 1px solid #BBF7D0; border-radius: 12px; margin-bottom: 1.25rem;">
                <div style="width: 50px; height: 50px; border-radius: 12px; background: white; border: 1px solid #E2E8F0; display: flex; align-items: center; justify-content: center; padding: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.04); flex-shrink: 0;">
                  ${profileBankMeta ? profileBankMeta.logoSvg : icon('bank', { size: 24, stroke: 'var(--brand-emerald)' })}
                </div>
                <div style="flex: 1;">
                  <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                    <span style="font-weight: 800; font-size: 1.05rem; color: #0F172A;">${partner.bankDetails.bankName}</span>
                    <span class="badge badge-success" style="font-size: 0.7rem; font-weight: 700; display: inline-flex; align-items: center; gap: 3px;">${icon('check-circle', { size: 12 })} VERIFIED</span>
                  </div>
                  <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.15rem;">
                    ${partner.bankDetails.accountType || 'Savings'} Account &bull; Automated Weekly Monday Payouts Active
                  </div>
                </div>
              </div>

              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.25rem; font-size: 0.9rem;">
                <div>
                  <span style="color: var(--text-muted); font-size: 0.775rem; text-transform: uppercase; font-weight: 600;">Account Number</span>
                  <div style="font-weight: 600; margin-top: 0.2rem; font-family: monospace; letter-spacing: 0.5px;">•••• •••• ${partner.bankDetails.accountNumber.slice(-4)}</div>
                </div>
                <div>
                  <span style="color: var(--text-muted); font-size: 0.775rem; text-transform: uppercase; font-weight: 600;">IFSC Code</span>
                  <div style="font-weight: 600; margin-top: 0.2rem; font-family: monospace; letter-spacing: 0.5px;">${partner.bankDetails.ifscCode}</div>
                </div>
                <div>
                  <span style="color: var(--text-muted); font-size: 0.775rem; text-transform: uppercase; font-weight: 600;">Beneficiary Name</span>
                  <div style="font-weight: 600; margin-top: 0.2rem;">${partner.bankDetails.accountHolderName}</div>
                </div>
                <div>
                  <span style="color: var(--text-muted); font-size: 0.775rem; text-transform: uppercase; font-weight: 600;">UPI ID</span>
                  <div style="font-weight: 600; margin-top: 0.2rem;">${partner.bankDetails.upiId || 'Not linked'}</div>
                </div>
              </div>
            ` : `
              <div style="text-align: center; padding: 2rem 1rem; border: 1.5px dashed #CBD5E1; border-radius: 12px; background: #F8FAFC;">
                <div style="color: #F59E0B; margin-bottom: 0.5rem; display: flex; justify-content: center;">
                  ${icon('alert-triangle', { size: 28 })}
                </div>
                <strong style="display: block; color: var(--text-primary); font-size: 0.95rem;">No Bank Account Linked</strong>
                <p style="color: var(--text-muted); font-size: 0.825rem; margin: 0.25rem 0 1rem;">
                  Link your verified bank account to receive weekly payout transfers and unlock instant Quick Settle withdrawals.
                </p>
                <button id="btn-profile-add-bank-cta" class="btn btn-primary btn-sm" style="font-weight: 700;">+ Add Bank Account</button>
              </div>
            `}
          </div>

          <!-- Security & System Actions Card -->
          <div class="solid-card" style="padding: 2rem; margin-bottom: 2rem;">
            <div style="margin-bottom: 1.25rem;">
              <h3 style="font-size: 1.15rem; margin: 0; font-weight: 800;">Security & Credentials</h3>
              <p style="color: var(--text-muted); font-size: 0.85rem; margin: 0;">Update your password or inspect your submitted KYC files.</p>
            </div>
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
              <button id="btn-change-partner-pwd" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 0.4rem; font-weight: 700;">
                ${icon('lock', { size: 14 })} CHANGE PASSWORD
              </button>
              <button id="btn-profile-quick-change-bank" class="btn btn-secondary btn-sm" style="display: inline-flex; align-items: center; gap: 0.4rem; font-weight: 700;">
                ${icon('bank', { size: 14 })} ${partner.bankDetails && partner.bankDetails.accountNumber ? 'CHANGE BANK DETAILS' : '+ ADD BANK ACCOUNT'}
              </button>
              <a href="#/partner/kyc/status" class="btn btn-glass btn-sm" style="display: inline-flex; align-items: center; gap: 0.4rem; font-weight: 700;">
                ${icon('file-text', { size: 14 })} VIEW KYC
              </a>
            </div>
          </div>

        </div>

        ${renderPartnerMobileBottomNav("/partner/profile")}
      </div>
    </div>
  `;
}

export function attachPartnerProfileEvents() {
  attachPartnerNavEvents();

  const user = auth.getCurrentUser();
  if (!user) return;
  const partnerId = user.userId;
  const partner = db.getPartnerById(partnerId) || user;

  // Change Profile Photo Upload
  const avatarInput = document.getElementById("file-partner-photo");
  const changeAvatarBtn = document.getElementById("btn-change-avatar");
  if (changeAvatarBtn && avatarInput) {
    changeAvatarBtn.onclick = () => avatarInput.click();
    avatarInput.onchange = async () => {
      if (!avatarInput.files || !avatarInput.files[0]) return;
      const file = avatarInput.files[0];
      try {
        toast.info("Uploading Photo...", "Optimizing image file.");
        const uploaded = await storage.uploadFile(file, `profileImages/${partnerId}/${file.name}`);
        
        // Update partner record
        const snapshot = db.getSnapshot();
        snapshot.partners = (snapshot.partners || []).map(p => {
          if (p.partnerId === partnerId || p.userId === partnerId) {
            return { ...p, profileImage: uploaded.fileUrl };
          }
          return p;
        });
        db.saveSnapshot(snapshot, "partners");

        const avatarImg = document.getElementById("partner-profile-avatar");
        if (avatarImg) avatarImg.src = uploaded.fileUrl;
        toast.success("Profile Photo Updated!", "Your new photo has been saved.");
        window.location.reload();
      } catch (err) {
        toast.error("Upload Error", err.message || "Failed to update profile photo.");
      }
    };
  }

  // Remove Profile Photo
  const removeAvatarBtn = document.getElementById("btn-remove-avatar");
  if (removeAvatarBtn) {
    removeAvatarBtn.onclick = () => {
      modal.open({
        title: "Remove Profile Photo",
        maxWidth: "400px",
        bodyHtml: `<p style="font-size: 0.9rem; color: var(--text-secondary);">Are you sure you want to remove your profile photo?</p>`,
        footerHtml: `
          <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">Cancel</button>
          <button class="btn btn-danger btn-sm" id="btn-confirm-remove-photo">Remove Photo</button>
        `,
        onOpen: (container) => {
          container.querySelector("#btn-confirm-remove-photo").onclick = () => {
            db.removePartnerProfilePhoto(partnerId);
            modal.close();
            toast.info("Photo Removed", "Profile photo has been reset to default.");
            window.location.reload();
          };
        }
      });
    };
  }

  // Edit Profile Details Modal
  const editBtn = document.getElementById("btn-edit-partner-profile");
  if (editBtn) {
    editBtn.onclick = () => {
      modal.open({
        title: "Edit Profile Details",
        maxWidth: "500px",
        bodyHtml: `
          <div class="form-group" style="margin-bottom: 0.75rem;">
            <label class="form-label">Full Legal Name *</label>
            <input type="text" id="edit-part-name" class="form-input" value="${partner.fullName || ''}">
          </div>
          <div class="form-group" style="margin-bottom: 0.75rem;">
            <label class="form-label">Contact Phone *</label>
            <input type="tel" id="edit-part-phone" class="form-input" value="${partner.phone || ''}">
          </div>
          <div class="form-group" style="margin-bottom: 0.75rem;">
            <label class="form-label">Residential Address</label>
            <input type="text" id="edit-part-addr" class="form-input" value="${partner.address || ''}">
          </div>
          <div style="display: grid; grid-template-columns: 1.2fr 1fr 1fr; gap: 0.5rem;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">District (Kerala)</label>
              <select id="edit-part-district" class="form-select">
                ${renderDistrictOptions(partner.district || partner.city || DEFAULT_DISTRICT)}
              </select>
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">State</label>
              <input type="text" id="edit-part-state" class="form-input" value="${partner.state || DEFAULT_STATE}">
            </div>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">PIN Code</label>
              <input type="text" id="edit-part-pin" class="form-input" value="${partner.pinCode || partner.pin || '695003'}">
            </div>
          </div>
        `,
        footerHtml: `
          <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">CANCEL</button>
          <button class="btn btn-primary btn-sm" id="btn-save-partner-profile">SAVE</button>
        `,
        onOpen: (container) => {
          container.querySelector("#btn-save-partner-profile").onclick = () => {
            const name = container.querySelector("#edit-part-name").value.trim();
            const phone = container.querySelector("#edit-part-phone").value.trim();
            const address = container.querySelector("#edit-part-addr").value.trim();
            const district = container.querySelector("#edit-part-district")?.value.trim() || DEFAULT_DISTRICT;
            const city = district;
            const state = container.querySelector("#edit-part-state").value.trim();
            const pinCode = container.querySelector("#edit-part-pin").value.trim();

            if (!name || !phone) {
              toast.error("Required Fields", "Please enter both name and phone number.");
              return;
            }

            const snapshot = db.getSnapshot();
            snapshot.partners = (snapshot.partners || []).map(p => {
              if (p.partnerId === partnerId || p.userId === partnerId) {
                return { ...p, fullName: name, phone, address, city, district, state, pinCode };
              }
              return p;
            });
            db.saveSnapshot(snapshot, "partners");

            modal.close();
            toast.success("Profile Updated", "Your changes have been saved.");
            window.location.reload();
          };
        }
      });
    };
  }

  // Change Password Modal
  const changePwdBtn = document.getElementById("btn-change-partner-pwd");
  if (changePwdBtn) {
    changePwdBtn.onclick = () => {
      modal.open({
        title: "Change Account Password",
        maxWidth: "420px",
        bodyHtml: `
          <div class="form-group">
            <label class="form-label">Current Password</label>
            <input type="password" id="part-pwd-current" class="form-input" placeholder="Current password" required>
          </div>
          <div class="form-group">
            <label class="form-label">New Password</label>
            <input type="password" id="part-pwd-new" class="form-input" placeholder="Min. 6 characters" required>
          </div>
          <div class="form-group">
            <label class="form-label">Confirm New Password</label>
            <input type="password" id="part-pwd-confirm" class="form-input" placeholder="Re-enter new password" required>
          </div>
        `,
        footerHtml: `
          <button class="btn btn-secondary btn-sm" onclick="document.querySelector('.modal-close').click()">Cancel</button>
          <button class="btn btn-primary btn-sm" id="btn-submit-change-pwd">Update Password</button>
        `,
        onOpen: (container) => {
          container.querySelector("#btn-submit-change-pwd").onclick = () => {
            const newPwd = container.querySelector("#part-pwd-new").value;
            const confirm = container.querySelector("#part-pwd-confirm").value;

            if (newPwd.length < 6) {
              toast.error("Weak Password", "Password must be at least 6 characters long.");
              return;
            }
            if (newPwd !== confirm) {
              toast.error("Mismatch", "New passwords do not match.");
              return;
            }

            modal.close();
            toast.success("Password Changed!", "Your account credentials have been updated.");
          };
        }
      });
    };
  }

  // Edit / Add Bank Details
  const editBankBtn = document.getElementById("btn-profile-edit-bank");
  const quickChangeBankBtn = document.getElementById("btn-profile-quick-change-bank");
  const addBankCta = document.getElementById("btn-profile-add-bank-cta");
  if (editBankBtn) editBankBtn.onclick = () => openBankDetailsModal(partnerId);
  if (quickChangeBankBtn) quickChangeBankBtn.onclick = () => openBankDetailsModal(partnerId);
  if (addBankCta) addBankCta.onclick = () => openBankDetailsModal(partnerId);
}
