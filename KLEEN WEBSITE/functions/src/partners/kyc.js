/**
 * Partner KYC Review Operations
 */
async function processKycDecision(db, partnerId, decision, rejectionReason = "", adminId = "admin") {
  const partnerRef = db.collection("partners").doc(partnerId);

  const updates = {
    reviewedAt: new Date().toISOString(),
    reviewedBy: adminId
  };

  if (decision === "APPROVE") {
    updates.kycStatus = "APPROVED";
    updates.accountStatus = "ACTIVE";
    updates.isEligibleForBooking = true;
    updates.approvedAt = new Date().toISOString();
  } else if (decision === "REJECT") {
    updates.kycStatus = "REJECTED";
    updates.isEligibleForBooking = false;
    updates.rejectionReason = rejectionReason;
  } else if (decision === "SUSPEND") {
    updates.accountStatus = "SUSPENDED";
    updates.isEligibleForBooking = false;
  }

  await partnerRef.update(updates);
  return { success: true, partnerId, decision };
}

module.exports = {
  processKycDecision
};
