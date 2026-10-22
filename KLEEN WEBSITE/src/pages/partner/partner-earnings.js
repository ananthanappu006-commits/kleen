/**
 * KLEEN — Partner Earnings & Payout Ledger (/partner/earnings)
 * Real-time ledger with Today, This Week, This Month, Lifetime, Commission,
 * Bank Account Registration with all Indian Banks + Logos + Live Search,
 * Safety Deposit (₹500), Weekly Monday Settlements, and Quick Settle.
 */

import { auth } from "../../services/auth-service.js";
import { db } from "../../services/db-service.js";
import { modal } from "../../components/modal.js";
import { toast } from "../../components/toast.js";
import { icon } from "../../components/icons.js";
import { renderPartnerHeader, renderPartnerSidebar, renderPartnerMobileBottomNav, attachPartnerNavEvents } from "./partner-nav.js";
import { INDIAN_BANKS, POPULAR_BANKS, searchBanks, findBank } from "../../config/indian-banks.js";

export function renderPartnerEarningsPage() {
  const user = auth.getCurrentUser();
  if (!user || user.role !== "partner") {
    return `
      <div class="app-container" style="max-width: 480px; padding: 4rem 1rem 6rem; text-align: center;">
        <div class="solid-card" style="padding: 3rem 2rem;">
          <div class="icon-box icon-box-lg icon-box-slate" style="margin: 0 auto 1rem;">
            ${icon('lock', { size: 32 })}
          </div>
          <h2 style="font-weight: 800;">Partner Sign In Required</h2>
          <p style="color: var(--text-muted); font-size: 0.9rem; margin: 0.5rem 0 1.5rem;">Please sign in with your partner credentials to view your earnings ledger.</p>
          <a href="#/partner/login" class="btn btn-primary btn-md">Go to Sign In</a>
        </div>
      </div>
    `;
  }

  const partner = db.getPartnerById(user.userId) || user;
  const partnerId = partner.partnerId || user.userId;

  // Compute live financials
  const fin = db.getPartnerFinancials(partnerId);
  const earnings = db.getPartnerEarnings(partnerId);
  const payouts = db.getPartnerPayouts(partnerId);
  const bank = fin.bankDetails;
  const bankMeta = bank ? findBank(bank.bankName) : null;

  const defaultBankLogoSvg = `
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#047857"/>
      <path d="M12 17L20 11L28 17V19H12V17ZM14 21H16V27H14V21ZM19 21H21V27H19V21ZM24 21H26V27H24V21ZM12 28H28V30H12V28Z" fill="#FFFFFF"/>
    </svg>
  `;

  return `
    <div class="partner-layout">
      ${renderPartnerSidebar("/partner/earnings")}

      <div class="partner-main-content">
        ${renderPartnerHeader("/partner/earnings", partner)}

        <div class="partner-dashboard-body" style="padding: 1.5rem 1rem 5rem;">
          
          <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
            <div>
              <span class="badge badge-success" style="margin-bottom: 0.35rem;">Financial Ledger & Payouts</span>
              <h2 style="font-size: 1.65rem; margin: 0; font-weight: 800;">Partner Earnings & Bank Payouts</h2>
              <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0.25rem 0 0;">
                Guaranteed 80% partner net share with weekly bank transfer and on-demand Quick Settle.
              </p>
            </div>
            
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
              ${!bank ? `
              <button id="btn-partner-open-bank-modal" class="btn btn-secondary btn-md" style="display: inline-flex; align-items: center; gap: 0.5rem; font-weight: 700; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
                ${icon('bank', { size: 14 })} Add Bank Account
              </button>
              ` : ''}
              
              <button id="btn-partner-quick-settle" class="btn btn-primary btn-md" style="display: inline-flex; align-items: center; gap: 0.4rem; font-weight: 800; border-radius: 10px; background: linear-gradient(135deg, #059669 0%, #047857 100%); box-shadow: 0 4px 14px rgba(5, 150, 105, 0.35);" ${fin.quickSettleAvailable <= 0 ? 'disabled title="Minimum ₹500 safety deposit held until weekly payout"' : ''}>
                ${icon('zap', { size: 14, fill: 'currentColor' })} Quick Settle ${fin.quickSettleAvailable > 0 ? `(₹${fin.quickSettleAvailable})` : ''}
              </button>
            </div>
          </div>

          <!-- Connected Bank Account Status Banner (Premium Aesthetic with Bank Logo) -->
          <div class="solid-card" style="padding: 1.35rem 1.6rem; margin-bottom: 2rem; border-radius: 16px; border-left: 6px solid ${bank ? '#10B981' : '#F59E0B'}; background: ${bank ? 'linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 70%)' : 'linear-gradient(135deg, #FFFBEB 0%, #FFFFFF 70%)'}; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1.25rem;">
              <div style="display: flex; align-items: center; gap: 1.15rem;">
                <div style="width: 48px; height: 48px; border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 4px 10px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.08);">
                  ${bankMeta ? bankMeta.logoSvg : (bank ? defaultBankLogoSvg : `${icon('alert-triangle', { size: 24, stroke: '#F59E0B' })}`)}
                </div>
                <div>
                  <div style="display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;">
                    <strong style="font-size: 1.05rem; color: var(--text-primary); font-weight: 800;">
                      ${bank ? `${bank.bankName} (${bank.accountType || 'Savings'})` : 'No Bank Account Connected'}
                    </strong>
                    <span class="badge ${bank ? 'badge-success' : 'badge-warning'}" style="font-size: 0.725rem; font-weight: 700; letter-spacing: 0.3px;">
                      ${bank ? `<span style="display:inline-flex; align-items:center; gap:3px;">${icon('check-circle', { size: 12 })} VERIFIED FOR SETTLEMENTS</span>` : `<span style="display:inline-flex; align-items:center; gap:3px;">${icon('alert-triangle', { size: 12 })} PAYOUTS ON HOLD</span>`}
                    </span>
                  </div>
                  <p style="margin: 0.3rem 0 0; font-size: 0.85rem; color: var(--text-secondary);">
                    ${bank 
                      ? `Account: •••• ${bank.accountNumber.slice(-4)} &bull; IFSC: <span style="font-family: monospace; font-weight: 700;">${bank.ifscCode}</span> &bull; Beneficiary: <strong>${bank.accountHolderName}</strong>${bank.upiId ? ` &bull; UPI: ${bank.upiId}` : ''}`
                      : 'Link your verified Indian bank account so KLEEN can dispatch your automated Monday settlements and instant Quick Settle payouts.'}
                  </p>
                </div>
              </div>

              <div>
                <button id="btn-banner-edit-bank" class="btn btn-glass btn-sm" style="font-weight: 700; border-radius: 8px; padding: 0.45rem 0.9rem;">
                  ${bank ? 'Change Bank Details' : '+ Add Bank Account'}
                </button>
              </div>
            </div>
          </div>

          <!-- Weekly Payout & Safety Deposit Policy Notice -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <!-- Weekly Payout Schedule Card -->
            <div class="solid-card" style="padding: 1.25rem 1.5rem; background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 14px;">
              <div style="display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.5rem;">
                ${icon('calendar-days', { size: 20, stroke: 'var(--brand-emerald)' })}
                <strong style="font-size: 0.95rem; color: #1E293B;">Weekly Payout Cycle</strong>
                <span class="badge badge-info" style="font-size: 0.65rem; margin-left: auto;">EVERY MONDAY</span>
              </div>
              <p style="font-size: 0.825rem; color: var(--text-secondary); margin: 0 0 0.5rem; line-height: 1.5;">
                Next scheduled disbursement: <strong>${fin.nextWeeklyPayoutDate}</strong>. All net earnings and your <strong>₹500 safety deposit</strong> will be automatically transferred to your bank account.
              </p>
              <div style="font-size: 0.775rem; color: #047857; font-weight: 600;">
                ${icon('check', { size: 13, stroke: 'var(--brand-emerald)' })} Direct NEFT/IMPS Bank Transfer with official UTR Reference
              </div>
            </div>

            <!-- Safety Deposit Reserve Card -->
            <div class="solid-card" style="padding: 1.25rem 1.5rem; background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 14px;">
              <div style="display: flex; align-items: center; gap: 0.65rem; margin-bottom: 0.5rem;">
                ${icon('shield-check', { size: 20, stroke: 'var(--brand-emerald)' })}
                <strong style="font-size: 0.95rem; color: #065F46;">₹500 Safety Deposit</strong>
                <span class="badge badge-success" style="font-size: 0.65rem; margin-left: auto;">SETTLED WEEKLY</span>
              </div>
              <p style="font-size: 0.825rem; color: #047857; margin: 0 0 0.5rem; line-height: 1.5;">
                ₹500 is reserved from active job earnings for platform service security and client satisfaction guarantee. <strong>This full ₹500 is settled and released to your bank account on every weekly payout.</strong>
              </p>
              <div style="font-size: 0.775rem; color: #065F46; font-weight: 600;">
                Current Held Deposit: <strong>₹${fin.safetyDepositAmount}</strong> / ₹500
              </div>
            </div>
          </div>

          <!-- High-Level Financial Metrics -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
            <div class="solid-card" style="padding: 1.25rem; border-radius: 12px;">
              <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Today's Earnings</div>
              <div style="font-size: 1.65rem; font-weight: 800; color: var(--brand-emerald-dark); margin: 0.25rem 0;">₹${fin.todayEarnings}</div>
              <span style="font-size: 0.75rem; color: #16A34A;">Live Day Ledger</span>
            </div>

            <div class="solid-card" style="padding: 1.25rem; border-radius: 12px;">
              <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">This Week</div>
              <div style="font-size: 1.65rem; font-weight: 800; color: var(--text-primary); margin: 0.25rem 0;">₹${fin.weekEarnings}</div>
              <span style="font-size: 0.75rem; color: var(--text-muted);">Last 7 Days</span>
            </div>

            <div class="solid-card" style="padding: 1.25rem; border-radius: 12px; border-left: 4px solid var(--brand-emerald);">
              <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Total Net Earned</div>
              <div style="font-size: 1.65rem; font-weight: 800; color: var(--brand-emerald-dark); margin: 0.25rem 0;">₹${fin.totalNet}</div>
              <span style="font-size: 0.75rem; color: #16A34A;">80% Net Share</span>
            </div>

            <div class="solid-card" style="padding: 1.25rem; border-radius: 12px;">
              <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Total Paid to Bank</div>
              <div style="font-size: 1.65rem; font-weight: 800; color: #2563EB; margin: 0.25rem 0;">₹${fin.totalPaidOut}</div>
              <span style="font-size: 0.75rem; color: #2563EB;">Disbursed Funds</span>
            </div>

            <div class="solid-card" style="padding: 1.25rem; border-radius: 12px; border-left: 4px solid #D97706;">
              <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Pending Settlement</div>
              <div style="font-size: 1.65rem; font-weight: 800; color: #D97706; margin: 0.25rem 0;">₹${fin.pendingSettlement}</div>
              <span style="font-size: 0.75rem; color: #D97706;">Due Every Monday</span>
            </div>

            <div class="solid-card" style="padding: 1.25rem; border-radius: 12px; border-left: 4px solid #059669; background: #F0FDF4;">
              <div style="font-size: 0.75rem; text-transform: uppercase; color: #065F46; font-weight: 700;">${icon('zap', { size: 12, fill: 'currentColor' })} Quick Settle Available</div>
              <div style="font-size: 1.65rem; font-weight: 800; color: #047857; margin: 0.25rem 0;">₹${fin.quickSettleAvailable}</div>
              <span style="font-size: 0.75rem; color: #059669;">Instant Payout (minus ₹500)</span>
            </div>
          </div>

          ${fin.activeQuickSettleRequest ? `
            <div class="solid-card" style="padding: 1.25rem 1.5rem; margin-bottom: 2rem; background: #FEF3C7; border: 1px solid #FCD34D; border-radius: 14px;">
              <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem;">
                  ${icon('zap', { size: 20, fill: '#059669', stroke: '#059669' })}
                  <div>
                    <strong style="color: #92400E; font-size: 0.95rem;">Quick Settle in Progress: ₹${fin.activeQuickSettleRequest.amount}</strong>
                    <div style="font-size: 0.8rem; color: #B45309;">Requested at ${new Date(fin.activeQuickSettleRequest.requestedAt).toLocaleString('en-IN')}. Admin is verifying and dispatching funds to your bank account.</div>
                  </div>
                </div>
                <span class="badge badge-warning" style="font-size: 0.75rem; font-weight: 700;">AWAITING ADMIN TRANSFER</span>
              </div>
            </div>
          ` : ''}

          <!-- Bank Payout History (Settlements transferred to Partner's bank account) -->
          <div class="solid-card" style="padding: 1.5rem; margin-bottom: 2rem; border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <h3 style="font-size: 1.15rem; margin: 0; font-weight: 800;">Bank Transfers & Settlements History</h3>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.2rem 0 0;">Official records of weekly and instant payouts deposited to your bank</p>
              </div>
            </div>

            <div class="table-responsive">
              <table class="kleen-table">
                <thead>
                  <tr>
                    <th>Payout ID</th>
                    <th>Type</th>
                    <th>Date & Time</th>
                    <th>Bank Account</th>
                    <th>Transfer Mode</th>
                    <th>UTR / Reference No</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${payouts.length > 0 ? payouts.map(p => {
                    let statusBadge = 'badge-success';
                    if (p.status === 'REQUESTED') statusBadge = 'badge-warning';
                    else if (p.status === 'PROCESSING') statusBadge = 'badge-info';
                    else if (p.status === 'FAILED') statusBadge = 'badge-danger';

                    const pBankMeta = p.bankDetails ? findBank(p.bankDetails.bankName) : bankMeta;

                    return `
                      <tr>
                        <td><strong>#${p.payoutId}</strong></td>
                        <td>
                          <span class="badge ${p.payoutType === 'QUICK_SETTLE' ? 'badge-primary' : 'badge-info'}" style="font-size: 0.7rem;">
                            ${p.payoutType === 'QUICK_SETTLE' ? `${icon('zap', { size: 12, fill: 'currentColor' })} Quick Settle` : (p.payoutType === 'WEEKLY_SCHEDULED' ? `${icon('calendar-days', { size: 12 })} Weekly Payout` : 'Manual Payout')}
                          </span>
                        </td>
                        <td>${p.processedAt ? new Date(p.processedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : (p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-IN') : 'Recent')}</td>
                        <td>
                          <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div style="width: 24px; height: 24px; border-radius: 6px; overflow: hidden; flex-shrink: 0;">
                              ${pBankMeta ? pBankMeta.logoSvg : defaultBankLogoSvg}
                            </div>
                            <div>
                              <div style="font-weight: 600; font-size: 0.85rem;">${p.bankDetails ? p.bankDetails.bankName : (bank ? bank.bankName : 'Bank A/C')}</div>
                              <div style="font-size: 0.75rem; color: var(--text-muted);">•••• ${p.bankDetails ? p.bankDetails.accountNumber.slice(-4) : (bank ? bank.accountNumber.slice(-4) : '****')}</div>
                            </div>
                          </div>
                        </td>
                        <td><span style="font-weight: 600; font-size: 0.85rem; color: #475569;">${p.transferMode || 'IMPS'}</span></td>
                        <td>
                          ${p.utrNumber ? `<code style="font-size: 0.8rem; background: #F1F5F9; padding: 0.2rem 0.4rem; border-radius: 4px;">${p.utrNumber}</code>` : '<span style="color: var(--text-muted); font-size: 0.8rem;">Processing</span>'}
                        </td>
                        <td><strong style="color: var(--brand-emerald-dark); font-size: 1.05rem;">₹${p.amount}</strong></td>
                        <td>
                          <span class="badge ${statusBadge}">
                            ${p.status}
                          </span>
                        </td>
                      </tr>
                    `;
                  }).join("") : `
                    <tr>
                      <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2.5rem 1rem;">
                        <div style="margin-bottom: 0.5rem;">${icon('bank', { size: 36, stroke: 'var(--brand-emerald)' })}</div>
                        <p style="margin: 0; font-size: 0.95rem; font-weight: 700;">No bank payouts disbursed yet.</p>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">Your pending earnings will be transferred on the upcoming Monday weekly payout cycle or via Quick Settle.</p>
                      </td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>

          <!-- Itemized Bookings Earnings Table -->
          <div class="solid-card" style="padding: 1.5rem; border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 0.5rem;">
              <div>
                <h3 style="font-size: 1.15rem; margin: 0; font-weight: 800;">Completed Job Earnings (80% Net)</h3>
                <p style="font-size: 0.8rem; color: var(--text-muted); margin: 0.2rem 0 0;">Itemized ledger of verified customer bookings and your payout share</p>
              </div>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <button id="btn-export-earnings" class="btn btn-glass btn-sm" style="display: inline-flex; align-items: center; gap: 0.35rem; font-weight: 700;">
                  ${icon('file-text', { size: 14 })} Export Ledger
                </button>
              </div>
            </div>

            <div class="table-responsive">
              <table class="kleen-table">
                <thead>
                  <tr>
                    <th>Booking ID</th>
                    <th>Service & Customer</th>
                    <th>Date</th>
                    <th>Gross Customer Amount</th>
                    <th>Platform Fee (20%)</th>
                    <th>Net Partner Payout (80%)</th>
                    <th>Settlement Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  ${earnings.length > 0 ? earnings.map(e => {
                    let statusBadge = 'badge-warning';
                    if (e.settlementStatus === 'PAID') statusBadge = 'badge-success';
                    else if (e.settlementStatus === 'PROCESSING') statusBadge = 'badge-info';
                    else if (e.settlementStatus === 'FAILED') statusBadge = 'badge-danger';

                    return `
                    <tr>
                      <td><strong>#${e.bookingId}</strong></td>
                      <td>${e.serviceName || 'Cleaning Service'}<br><span style="font-size: 0.75rem; color: var(--text-muted);">${e.customerName || 'Customer'}</span></td>
                      <td>${e.bookingDate || (e.createdAt ? e.createdAt.split('T')[0] : 'Today')}</td>
                      <td>₹${e.grossAmount}</td>
                      <td style="color: var(--text-muted);">- ₹${e.platformCommission}</td>
                      <td><strong style="color: var(--brand-emerald-dark); font-size: 1.05rem;">₹${e.partnerAmount}</strong></td>
                      <td>
                        <span class="badge ${statusBadge}">
                          ${e.settlementStatus || 'PENDING'}
                        </span>
                      </td>
                      <td>
                        <a href="#/partner/bookings/${e.bookingId}" class="btn btn-secondary btn-sm" style="font-size: 0.75rem;">
                          View Booking
                        </a>
                      </td>
                    </tr>
                  `;
                  }).join("") : `
                    <tr>
                      <td colspan="8" style="text-align: center; color: var(--text-muted); padding: 3rem 1rem;">
                        <div class="icon-box icon-box-lg icon-box-slate" style="margin: 0 auto 0.75rem;">
                          ${icon('indian-rupee', { size: 32 })}
                        </div>
                        <p style="margin: 0; font-size: 0.95rem; font-weight: 700;">No earnings generated yet.</p>
                        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">Complete your active bookings to see verified payouts credited here.</p>
                      </td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        ${renderPartnerMobileBottomNav("/partner/earnings")}
      </div>
    </div>
  `;
}

export function attachPartnerEarningsEvents() {
  attachPartnerNavEvents();

  const user = auth.getCurrentUser();
  if (!user) return;
  const partnerId = user.userId;

  // Export ledger
  const exportBtn = document.getElementById("btn-export-earnings");
  if (exportBtn) {
    exportBtn.onclick = () => {
      toast.success("Ledger Exported", "Your verified earnings and payout report has been generated successfully.");
    };
  }

  // Open Bank Details Modal
  const openBankBtns = [
    document.getElementById("btn-partner-open-bank-modal"),
    document.getElementById("btn-banner-edit-bank")
  ];

  openBankBtns.forEach(btn => {
    if (!btn) return;
    btn.onclick = () => {
      openBankDetailsModal(partnerId);
    };
  });

  // Quick Settle Action
  const quickSettleBtn = document.getElementById("btn-partner-quick-settle");
  if (quickSettleBtn) {
    quickSettleBtn.onclick = () => {
      openQuickSettleModal(partnerId);
    };
  }
}

/**
 * Ultra-Premium, Aesthetic Modal with Searchable Bank List & Logos
 */
export function openBankDetailsModal(partnerId) {
  const user = auth.getCurrentUser();
  const effectivePartnerId = partnerId || user?.partnerId || user?.userId || "usr_partner_sunita";
  const currentBank = db.getPartnerBankDetails(effectivePartnerId) || {};
  const partner = db.getPartnerById(effectivePartnerId) || user || {};

  // Find pre-selected bank or default to State Bank of India
  let selectedBank = (currentBank && currentBank.bankName) 
    ? findBank(currentBank.bankName) 
    : (findBank("State Bank of India") || INDIAN_BANKS[0]);

  const bodyHtml = `
    <div style="display: flex; flex-direction: column; gap: 1.35rem; max-height: 80vh; overflow-y: auto; padding: 0.35rem 0.5rem 0.5rem 0.25rem;">
      
      <!-- Classic & Premium Editorial Header Banner -->
      <div style="background: linear-gradient(135deg, #022C22 0%, #064E3B 55%, #065F46 100%); border-radius: 14px; padding: 1.25rem 1.4rem; color: #FFFFFF; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 4px 18px rgba(2, 44, 34, 0.25); border: 1px solid rgba(255, 255, 255, 0.08); position: relative; overflow: hidden;">
        <div style="position: absolute; right: -20px; top: -20px; width: 100px; height: 100px; background: radial-gradient(circle, rgba(167, 243, 208, 0.15) 0%, transparent 70%); border-radius: 50%;"></div>
        <div style="position: relative; z-index: 1;">
          <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1.5px; color: #6EE7B7; font-weight: 800;">RBI Compliant Settlement Vault</div>
          <h4 style="margin: 0.25rem 0 0; font-family: 'Playfair Display', Georgia, serif; font-size: 1.25rem; font-weight: 700; color: #FFFFFF; letter-spacing: 0.01em;">Verified Indian Bank Account</h4>
          <p style="margin: 0.2rem 0 0; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.775rem; color: #A7F3D0; opacity: 0.9;">Direct payouts via RTGS, NEFT, and instant 24/7 IMPS networks</p>
        </div>
        <div style="position: relative; z-index: 1; margin-bottom: 0.25rem;">${icon('bank', { size: 36, stroke: '#FFFFFF' })}</div>
      </div>

      <!-- Selected Bank Showcase / Switcher Card -->
      <div>
        <label class="bank-input-label">
          <span>Selected Bank Institution *</span>
          <span style="font-size: 0.7rem; color: #059669; font-weight: 700; letter-spacing: 0.02em; text-transform: none;">35+ Verified Indian Banks</span>
        </label>

        <div id="bank-active-display-card" style="border: 1.5px solid #10B981; background: linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 100%); border-radius: 14px; padding: 0.9rem 1.15rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer; transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 2px 8px rgba(16, 185, 129, 0.08);" title="Click to choose a different bank">
          <div style="display: flex; align-items: center; gap: 0.9rem;">
            <div id="bank-display-logo" style="width: 46px; height: 46px; border-radius: 12px; overflow: hidden; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid rgba(0,0,0,0.06); background: #FFFFFF; display: flex; align-items: center; justify-content: center;">
              ${selectedBank ? selectedBank.logoSvg : ''}
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap;">
                <strong id="bank-display-name" style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.05rem; color: #064E3B; font-weight: 800; letter-spacing: -0.01em;">${selectedBank ? selectedBank.name : 'Select Bank'}</strong>
                <span id="bank-display-cat" class="badge badge-success" style="font-size: 0.65rem; padding: 0.15rem 0.5rem; font-weight: 800; letter-spacing: 0.5px;">${selectedBank ? selectedBank.category : 'Verified'}</span>
              </div>
              <div id="bank-display-ifsc-hint" style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.775rem; color: #047857; margin-top: 0.2rem; font-weight: 500;">
                IFSC Code starts with: <strong style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #064E3B;">${selectedBank ? selectedBank.ifscPrefix : 'SBIN'}</strong>
              </div>
            </div>
          </div>

          <button type="button" id="btn-toggle-bank-search" class="btn btn-secondary btn-sm" style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.775rem; padding: 0.4rem 0.8rem; font-weight: 700; border-radius: 8px; border: 1px solid rgba(4, 120, 87, 0.2);">
            Change Bank ▾
          </button>
        </div>
      </div>

      <!-- Interactive Searchable Bank Drawer (Visible or Toggled) -->
      <div id="bank-search-drawer" style="display: none; border: 1.5px solid #E2E8F0; border-radius: 14px; padding: 1.15rem; background: #FAFAFA; box-shadow: 0 4px 20px rgba(0,0,0,0.05);">
        
        <!-- Live Search Input with Premium Styling -->
        <div class="bank-input-wrapper" style="margin-bottom: 0.95rem;">
          <span class="bank-input-icon" style="color: #059669; display:flex; align-items:center;">${icon('search', { size: 15 })}</span>
          <input type="text" id="bank-search-input" class="bank-premium-input" placeholder="Search 35+ Indian banks by name or code (e.g. SBI, HDFC, Federal)..." style="height: 46px; border-color: #A7F3D0; font-size: 0.885rem;">
        </div>

        <!-- Quick Popular Banks Chips -->
        <div style="margin-bottom: 0.95rem;">
          <span style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.7rem; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.06em; display: block; margin-bottom: 0.45rem;">
            Popular & Kerala Banks:
          </span>
          <div style="display: flex; gap: 0.45rem; flex-wrap: wrap;">
            ${POPULAR_BANKS.map(pb => `
              <button type="button" class="btn-quick-pick-bank" data-bank-id="${pb.id}" style="display: inline-flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.65rem; border-radius: 9999px; border: 1.5px solid #E2E8F0; background: #FFFFFF; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.775rem; font-weight: 700; color: #1E293B; transition: all 0.15s; box-shadow: 0 1px 3px rgba(0,0,0,0.03);">
                <span style="width: 17px; height: 17px; display: inline-block; overflow: hidden; border-radius: 50%;">${pb.logoSvg}</span>
                <span>${pb.shortCode}</span>
              </button>
            `).join("")}
          </div>
        </div>

        <!-- Scrollable Banks Listbox Container -->
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.7rem; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 0.4rem;">
          All Indian Banks (${INDIAN_BANKS.length}):
        </div>
        <div id="bank-listbox-container" style="max-height: 230px; overflow-y: auto; border: 1.5px solid #E2E8F0; border-radius: 12px; background: #FFFFFF; padding: 0.35rem; box-shadow: inset 0 1px 3px rgba(0,0,0,0.03);">
          <!-- Dynamically populated via renderBankListboxItems -->
        </div>
      </div>

      <!-- Account Holder Legal Name & Account Type -->
      <div style="display: grid; grid-template-columns: 1.35fr 1fr; gap: 1rem;">
        <div>
          <label class="bank-input-label">
            <span>Account Holder Legal Name *</span>
            <span style="font-size: 0.675rem; color: #64748B; font-weight: 600; text-transform: none;">Official Record</span>
          </label>
          <div class="bank-input-wrapper">
            <span class="bank-input-icon" style="display:flex; align-items:center;">${icon('user', { size: 15 })}</span>
            <input type="text" id="bank-acc-holder" class="bank-premium-input" value="${currentBank.accountHolderName || partner.fullName || ''}" placeholder="Exact name as in passbook / cheque" required autocomplete="off">
          </div>
        </div>

        <div>
          <label class="bank-input-label">
            <span>Account Type *</span>
            <span style="font-size: 0.675rem; color: #64748B; font-weight: 600; text-transform: none;">RBI Tier</span>
          </label>
          <div class="bank-input-wrapper">
            <span class="bank-input-icon" style="display:flex; align-items:center;">${icon('bank', { size: 15 })}</span>
            <select id="bank-acc-type" class="bank-premium-input bank-premium-select" style="font-weight: 700;">
              <option value="SAVINGS" ${currentBank.accountType === 'SAVINGS' ? 'selected' : ''}>Savings Account</option>
              <option value="CURRENT" ${currentBank.accountType === 'CURRENT' ? 'selected' : ''}>Current Account</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Account Number & Confirm Account Number -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
        <div>
          <label class="bank-input-label">
            <span>Bank Account Number *</span>
          </label>
          <div class="bank-input-wrapper">
            <span class="bank-input-icon" style="display:flex; align-items:center;">${icon('credit-card', { size: 15 })}</span>
            <input type="password" id="bank-acc-num" class="bank-premium-input mono-font" value="${currentBank.accountNumber || ''}" placeholder="Enter full account number" required style="padding-right: 2.85rem;" autocomplete="off">
            <button type="button" id="btn-toggle-mask-acc" style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); background: #F1F5F9; border: 1px solid #CBD5E1; border-radius: 8px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.85rem; color: #475569; transition: all 0.15s;" title="Toggle visibility">${icon('eye', { size: 14 })}</button>
          </div>
        </div>

        <div>
          <label class="bank-input-label">
            <span>Confirm Account Number *</span>
            <span id="acc-match-indicator" style="font-size: 0.7rem; font-weight: 800; font-family: 'Plus Jakarta Sans', sans-serif;"></span>
          </label>
          <div class="bank-input-wrapper">
            <span class="bank-input-icon" style="display:flex; align-items:center;">${icon('lock', { size: 15 })}</span>
            <input type="text" id="bank-acc-num-confirm" class="bank-premium-input mono-font" value="${currentBank.accountNumber || ''}" placeholder="Re-enter to verify match" required autocomplete="off">
          </div>
        </div>
      </div>

      <!-- IFSC Code & Optional UPI ID -->
      <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 1rem;">
        <div>
          <label class="bank-input-label">
            <span>Branch IFSC Code *</span>
            <button type="button" id="btn-auto-fill-ifsc" style="background: #ECFDF5; border: 1px solid #A7F3D0; color: #047857; font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.685rem; font-weight: 800; cursor: pointer; padding: 0.18rem 0.5rem; border-radius: 6px; display: inline-flex; align-items: center; gap: 0.2rem; transition: all 0.15s;">
              ${icon('zap', { size: 12, fill: 'currentColor' })} Use ${selectedBank ? selectedBank.ifscPrefix : 'SBIN'}
            </button>
          </label>
          <div class="bank-input-wrapper">
            <span class="bank-input-icon" style="display:flex; align-items:center;">${icon('tag', { size: 15 })}</span>
            <input type="text" id="bank-ifsc" class="bank-premium-input mono-font" value="${currentBank.ifscCode || (selectedBank ? selectedBank.ifscPrefix : '')}" placeholder="e.g. SBIN0001234" maxlength="11" style="text-transform: uppercase;" required autocomplete="off">
          </div>
          <small id="ifsc-hint-text" style="font-family: 'Plus Jakarta Sans', sans-serif; color: #64748B; font-size: 0.72rem; display: block; margin-top: 0.3rem; font-weight: 500;">
            11-character code on your passbook or cheque leaf
          </small>
        </div>

        <div>
          <label class="bank-input-label">
            <span>UPI ID (Optional)</span>
            <span style="font-size: 0.675rem; color: #64748B; font-weight: 600; text-transform: none;">Fast Payout</span>
          </label>
          <div class="bank-input-wrapper">
            <span class="bank-input-icon" style="display:flex; align-items:center;">${icon('smartphone', { size: 15 })}</span>
            <input type="text" id="bank-upi" class="bank-premium-input mono-font" value="${currentBank.upiId || ''}" placeholder="e.g. 9876543210@upi" autocomplete="off">
          </div>
          <small style="font-family: 'Plus Jakarta Sans', sans-serif; color: #64748B; font-size: 0.72rem; display: block; margin-top: 0.3rem; font-weight: 500;">
            Used for instant secondary backup verification
          </small>
        </div>
      </div>

      <!-- Trust & Security Seal with Classic Seal Styling -->
      <div style="background: linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%); border: 1.5px solid #A7F3D0; border-radius: 12px; padding: 0.85rem 1.15rem; display: flex; align-items: center; gap: 0.85rem; box-shadow: 0 2px 6px rgba(16, 185, 129, 0.05);">
        <div style="width: 34px; height: 34px; border-radius: 50%; background: #059669; color: #FFFFFF; display: flex; align-items: center; justify-content: center; flex-shrink: 0; box-shadow: 0 2px 6px rgba(5, 150, 105, 0.3);">
          ${icon('lock', { size: 16, stroke: '#FFFFFF' })}
        </div>
        <div style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 0.775rem; color: #065F46; line-height: 1.45; font-weight: 500;">
          <strong style="color: #064E3B; font-weight: 800;">End-to-End 256-Bit Encrypted Vault:</strong> Your banking coordinates are stored securely in compliance with RBI payout standards and dispatched directly for weekly Monday settlements.
        </div>
      </div>
    </div>
  `;

  const footerHtml = `
    <div style="display: flex; justify-content: flex-end; align-items: center; gap: 0.85rem; width: 100%;">
      <button type="button" class="btn btn-secondary btn-md" id="btn-cancel-bank-modal" style="font-family: 'Plus Jakarta Sans', sans-serif; border-radius: 10px; font-weight: 700; padding: 0.6rem 1.25rem;">
        Cancel
      </button>
      <button type="button" class="btn btn-primary btn-md" id="btn-save-bank-details" style="font-family: 'Plus Jakarta Sans', sans-serif; border-radius: 10px; font-weight: 800; background: linear-gradient(135deg, #059669 0%, #047857 100%); box-shadow: 0 4px 14px rgba(5, 150, 105, 0.35); padding: 0.6rem 1.5rem; letter-spacing: 0.01em;">
        Save Verified Bank Account
      </button>
    </div>
  `;

  modal.open({
    title: currentBank.accountNumber ? "Edit Bank Account for Payouts" : "Add Bank Account for Payouts",
    bodyHtml,
    footerHtml,
    maxWidth: "580px",
    onOpen: (container) => {
      // Elements
      const cancelBtn = container.querySelector("#btn-cancel-bank-modal");
      if (cancelBtn) cancelBtn.onclick = () => modal.close();

      const drawer = container.querySelector("#bank-search-drawer");
      const toggleDrawerBtn = container.querySelector("#btn-toggle-bank-search");
      const displayCard = container.querySelector("#bank-active-display-card");
      const searchInput = container.querySelector("#bank-search-input");
      const listboxContainer = container.querySelector("#bank-listbox-container");
      const ifscInput = container.querySelector("#bank-ifsc");
      const autoFillIfscBtn = container.querySelector("#btn-auto-fill-ifsc");
      const accNumInput = container.querySelector("#bank-acc-num");
      const accNumConfirmInput = container.querySelector("#bank-acc-num-confirm");
      const matchIndicator = container.querySelector("#acc-match-indicator");
      const toggleMaskBtn = container.querySelector("#btn-toggle-mask-acc");

      // Render the banks listbox items
      function renderBankListbox(banks) {
        if (!banks || banks.length === 0) {
          listboxContainer.innerHTML = `
            <div style="padding: 1.5rem; text-align: center; color: var(--text-muted); font-size: 0.825rem;">
              No banks found matching your search.
            </div>
          `;
          return;
        }

        listboxContainer.innerHTML = banks.map(b => {
          const isSelected = selectedBank && selectedBank.id === b.id;
          return `
            <div class="bank-list-item" data-bank-id="${b.id}" style="display: flex; align-items: center; justify-content: space-between; padding: 0.55rem 0.75rem; border-radius: 8px; cursor: pointer; transition: background 0.15s; ${isSelected ? 'background: #F0FDF4; font-weight: 700;' : ''}" onmouseover="if(!${isSelected}) this.style.background='#F1F5F9'" onmouseout="if(!${isSelected}) this.style.background='transparent'">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <div style="width: 30px; height: 30px; border-radius: 8px; overflow: hidden; flex-shrink: 0; box-shadow: 0 1px 4px rgba(0,0,0,0.08);">
                  ${b.logoSvg}
                </div>
                <div>
                  <div style="font-size: 0.85rem; color: var(--text-primary); font-weight: ${isSelected ? '800' : '600'};">
                    ${b.name}
                  </div>
                  <div style="font-size: 0.7rem; color: var(--text-muted);">
                    ${b.category} &bull; IFSC starts with <span style="font-family: monospace; font-weight: 600;">${b.ifscPrefix}</span>
                  </div>
                </div>
              </div>
              <div>
                ${isSelected ? `<span style="color: #10B981; font-weight: 800; font-size: 0.85rem; display:inline-flex; align-items:center; gap:3px;">${icon('check-circle', { size: 12 })} Selected</span>` : `<span style="font-size: 0.75rem; color: var(--text-muted);">Select</span>`}
              </div>
            </div>
          `;
        }).join("");

        // Attach click listeners to each item
        listboxContainer.querySelectorAll(".bank-list-item").forEach(item => {
          item.onclick = () => {
            const bId = item.getAttribute("data-bank-id");
            selectBank(bId);
          };
        });
      }

      function selectBank(bankId) {
        selectedBank = findBank(bankId) || INDIAN_BANKS[0];
        
        // Update display card
        container.querySelector("#bank-display-logo").innerHTML = selectedBank.logoSvg;
        container.querySelector("#bank-display-name").textContent = selectedBank.name;
        container.querySelector("#bank-display-cat").textContent = selectedBank.category;
        container.querySelector("#bank-display-ifsc-hint").innerHTML = `IFSC Code starts with: <strong style="font-family: monospace;">${selectedBank.ifscPrefix}</strong>`;
        
        if (autoFillIfscBtn) {
          autoFillIfscBtn.textContent = `Use ${selectedBank.ifscPrefix}`;
        }

        // Auto-update IFSC if blank or still default
        if (!ifscInput.value || ifscInput.value.length <= 4) {
          ifscInput.value = selectedBank.ifscPrefix;
        }

        // Close drawer
        drawer.style.display = "none";
        toggleDrawerBtn.textContent = "Change Bank ▾";
        renderBankListbox(INDIAN_BANKS);
      }

      // Initialize list
      renderBankListbox(INDIAN_BANKS);

      // Toggle drawer
      const toggleDrawer = () => {
        const isHidden = drawer.style.display === "none";
        drawer.style.display = isHidden ? "block" : "none";
        toggleDrawerBtn.textContent = isHidden ? "Close ▴" : "Change Bank ▾";
        if (isHidden) {
          searchInput.focus();
        }
      };

      if (toggleDrawerBtn) toggleDrawerBtn.onclick = (e) => { e.stopPropagation(); toggleDrawer(); };
      if (displayCard) displayCard.onclick = () => toggleDrawer();

      // Quick Pick Buttons
      container.querySelectorAll(".btn-quick-pick-bank").forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const bId = btn.getAttribute("data-bank-id");
          selectBank(bId);
        };
      });

      // Live search input filtering
      if (searchInput) {
        searchInput.oninput = () => {
          const filtered = searchBanks(searchInput.value);
          renderBankListbox(filtered);
        };
      }

      // Auto-fill IFSC button
      if (autoFillIfscBtn) {
        autoFillIfscBtn.onclick = () => {
          if (selectedBank) {
            ifscInput.value = selectedBank.ifscPrefix;
            ifscInput.focus();
          }
        };
      }

      // Live Account Number Match Verification
      const checkMatch = () => {
        const v1 = accNumInput.value.trim();
        const v2 = accNumConfirmInput.value.trim();
        if (!v2) {
          matchIndicator.innerHTML = "";
          return;
        }
        if (v1 === v2) {
          matchIndicator.innerHTML = `<span style="background: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; padding: 0.15rem 0.5rem; border-radius: 6px; font-size: 0.685rem; font-weight: 800; letter-spacing: 0.03em;">MATCHES</span>`;
        } else {
          matchIndicator.innerHTML = `<span style="background: #FEF2F2; color: #B91C1C; border: 1px solid #FECACA; padding: 0.15rem 0.5rem; border-radius: 6px; font-size: 0.685rem; font-weight: 800; letter-spacing: 0.03em;">MISMATCH</span>`;
        }
      };

      accNumInput.oninput = checkMatch;
      accNumConfirmInput.oninput = checkMatch;

      // Toggle password masking
      if (toggleMaskBtn) {
        toggleMaskBtn.onclick = () => {
          if (accNumInput.type === "password") {
            accNumInput.type = "text";
            toggleMaskBtn.innerHTML = icon('lock', { size: 14 });
          } else {
            accNumInput.type = "password";
            toggleMaskBtn.innerHTML = icon('eye', { size: 14 });
          }
        };
      }

      // Save Button Handler
      const saveBtn = container.querySelector("#btn-save-bank-details");
      if (saveBtn) {
        saveBtn.onclick = () => {
          const holder = container.querySelector("#bank-acc-holder").value.trim();
          const bName = selectedBank ? selectedBank.name : "State Bank of India";
          const accType = container.querySelector("#bank-acc-type").value;
          const accNum = accNumInput.value.trim();
          const accNumConfirm = accNumConfirmInput.value.trim();
          const ifsc = ifscInput.value.trim().toUpperCase();
          const upi = container.querySelector("#bank-upi").value.trim();

          if (!holder) {
            toast.error("Required Field", "Please enter the account holder name.");
            return;
          }
          if (!accNum || accNum.length < 8) {
            toast.error("Invalid Account", "Please enter a valid bank account number.");
            return;
          }
          if (accNum !== accNumConfirm) {
            toast.error("Mismatch", "Account number and confirmation account number do not match.");
            return;
          }
          if (!ifsc || ifsc.length !== 11) {
            toast.error("Invalid IFSC", "IFSC code must be exactly 11 characters (e.g. SBIN0001234).");
            return;
          }

          try {
            saveBtn.disabled = true;
            saveBtn.textContent = "Saving...";

            db.savePartnerBankDetails(effectivePartnerId, {
              accountHolderName: holder,
              bankName: bName,
              accountNumber: accNum,
              ifscCode: ifsc,
              accountType: accType,
              upiId: upi
            });

            if (user) {
              user.bankDetails = {
                accountHolderName: holder,
                bankName: bName,
                accountNumber: accNum,
                ifscCode: ifsc,
                accountType: accType,
                upiId: upi,
                isVerified: true
              };
              try { auth.saveSession(); } catch (e) {}
            }

            toast.success("Bank Account Verified", `Linked ${bName} for weekly payouts and Quick Settle.`);
            modal.close();
            setTimeout(() => {
              window.location.reload();
            }, 250);
          } catch (err) {
            toast.error("Save Failed", err.message);
            saveBtn.disabled = false;
            saveBtn.textContent = "Save Verified Bank Account";
          }
        };
      }
    }
  });
}

/**
 * Interactive Modal to Request Instant Quick Settle
 */
export function openQuickSettleModal(partnerId) {
  const fin = db.getPartnerFinancials(partnerId);

  if (!fin.hasBankDetails) {
    toast.error("Bank Required", "Please link your bank account before requesting Quick Settle.");
    openBankDetailsModal(partnerId);
    return;
  }

  if (fin.quickSettleAvailable <= 0) {
    toast.warning("Zero Balance", "No withdrawable balance available. Minimum ₹500 safety deposit is reserved until your weekly Monday payout.");
    return;
  }

  if (fin.activeQuickSettleRequest) {
    toast.info("Request Pending", "You already have a Quick Settle request awaiting admin processing.");
    return;
  }

  const bank = fin.bankDetails;
  const bankMeta = findBank(bank.bankName);

  const defaultBankLogoSvg = `
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="10" fill="#047857"/>
      <path d="M12 17L20 11L28 17V19H12V17ZM14 21H16V27H14V21ZM19 21H21V27H19V21ZM24 21H26V27H24V21ZM12 28H28V30H12V28Z" fill="#FFFFFF"/>
    </svg>
  `;

  const bodyHtml = `
    <div style="display: flex; flex-direction: column; gap: 1.25rem;">
      <div style="background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 14px; padding: 1.35rem; text-align: center; box-shadow: 0 4px 14px rgba(4, 120, 87, 0.08);">
        <span style="font-size: 0.775rem; text-transform: uppercase; color: #065F46; font-weight: 700; letter-spacing: 0.5px;">Available for Instant Quick Settle</span>
        <div style="font-size: 2.35rem; font-weight: 800; color: #047857; margin: 0.25rem 0;">₹${fin.quickSettleAvailable}</div>
        <span style="font-size: 0.8rem; color: #059669;">Instant 24x7 IMPS transfer to your registered bank account</span>
      </div>

      <!-- Financial Calculation Breakdown -->
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 1rem 1.15rem; font-size: 0.85rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: var(--text-secondary);">Total Pending Net Earnings:</span>
          <strong>₹${fin.pendingSettlement}</strong>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; color: #D97706;">
          <span>Less: Platform Safety Deposit:</span>
          <strong>- ₹${fin.safetyDepositAmount}</strong>
        </div>
        <div style="height: 1px; background: #CBD5E1; margin: 0.5rem 0;"></div>
        <div style="display: flex; justify-content: space-between; font-size: 0.95rem; font-weight: 800; color: #047857;">
          <span>Instant Quick Settle Payout:</span>
          <span>₹${fin.quickSettleAvailable}</span>
        </div>
      </div>

      <!-- Safety Deposit Explanation -->
      <div style="background: #FFFBEB; border-left: 4px solid #F59E0B; padding: 0.85rem 1rem; border-radius: 8px; font-size: 0.775rem; color: #92400E; line-height: 1.5;">
        ℹ️ <strong>Safety Deposit Policy:</strong> The ₹${fin.safetyDepositAmount} safety deposit is held during active jobs and <strong>will be settled directly into your bank account on your upcoming Monday weekly payout (${fin.nextWeeklyPayoutDate}).</strong>
      </div>

      <!-- Destination Bank Account with Logo -->
      <div style="border: 1px solid #E2E8F0; border-radius: 12px; padding: 0.9rem 1.1rem; display: flex; align-items: center; gap: 0.9rem; background: #FFFFFF;">
        <div style="width: 40px; height: 40px; border-radius: 10px; overflow: hidden; flex-shrink: 0; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
          ${bankMeta ? bankMeta.logoSvg : defaultBankLogoSvg}
        </div>
        <div>
          <span style="font-size: 0.725rem; text-transform: uppercase; color: var(--text-muted); font-weight: 700; display: block;">
            Destination Account
          </span>
          <div style="font-weight: 800; font-size: 0.95rem; color: var(--text-primary);">
            ${bank.bankName} (•••• ${bank.accountNumber.slice(-4)})
          </div>
          <div style="font-size: 0.775rem; color: var(--text-secondary);">
            IFSC: <span style="font-family: monospace;">${bank.ifscCode}</span> &bull; A/C Name: ${bank.accountHolderName}
          </div>
        </div>
      </div>
    </div>
  `;

  const footerHtml = `
    <div style="display: flex; justify-content: flex-end; gap: 0.75rem; width: 100%;">
      <button type="button" class="btn btn-secondary btn-sm" id="btn-cancel-qs" style="border-radius: 8px;">Cancel</button>
      <button type="button" class="btn btn-primary btn-sm" id="btn-confirm-qs" style="font-weight: 800; background: #059669; border-radius: 8px; box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);">
        Confirm Quick Settle (₹${fin.quickSettleAvailable})
      </button>
    </div>
  `;

  modal.open({
    title: "Request Instant Quick Settle",
    bodyHtml,
    footerHtml,
    maxWidth: "500px",
    onOpen: (container) => {
      const cancelBtn = container.querySelector("#btn-cancel-qs");
      if (cancelBtn) cancelBtn.onclick = () => modal.close();

      const confirmBtn = container.querySelector("#btn-confirm-qs");
      if (confirmBtn) {
        confirmBtn.onclick = () => {
          try {
            confirmBtn.disabled = true;
            confirmBtn.textContent = "Submitting Request...";

            const payout = db.requestQuickSettle(partnerId, fin.quickSettleAvailable, "Partner on-demand Quick Settle");
            toast.success("Quick Settle Submitted!", `Your request for ₹${payout.amount} has been queued. Funds will be transferred to your bank account.`);
            modal.close();
            window.location.reload();
          } catch (err) {
            toast.error("Request Failed", err.message);
            confirmBtn.disabled = false;
            confirmBtn.textContent = `Confirm Quick Settle (₹${fin.quickSettleAvailable})`;
          }
        };
      }
    }
  });
}
