/**
 * KLEEN — Admin Operations & Audit Manager
 */

import { db } from "../db-service.js";

class AdminManager {
  reviewKyc(partnerId, decision, rejectionReason = "") {
    return db.adminReviewKyc(partnerId, decision, rejectionReason);
  }

  assignPartner(bookingId, partnerId, partnerName) {
    return db.assignPartnerToBooking(bookingId, partnerId, partnerName);
  }

  addService(data) {
    return db.addService(data);
  }

  updateService(id, updates) {
    return db.updateService(id, updates);
  }

  deleteService(id) {
    return db.deleteService(id);
  }

  toggleServiceStatus(id) {
    const srv = db.getServiceById(id);
    if (srv) {
      return db.updateService(id, { isActive: !srv.isActive });
    }
  }

  addCategory(data) {
    return db.addCategory(data);
  }

  updateCategory(id, updates) {
    return db.updateCategory(id, updates);
  }

  deleteCategory(id) {
    return db.deleteCategory(id);
  }

  getOffers() {
    return db.getSnapshot().offers || [];
  }

  addOffer(offer) {
    const snapshot = db.getSnapshot();
    const newOffer = {
      offerId: "off_" + Date.now(),
      isActive: true,
      ...offer
    };
    snapshot.offers = [newOffer, ...(snapshot.offers || [])];
    db.saveSnapshot(snapshot, "offers");
    return newOffer;
  }

  toggleOffer(offerId) {
    const snapshot = db.getSnapshot();
    snapshot.offers = (snapshot.offers || []).map(o => {
      if (o.offerId === offerId) {
        return { ...o, isActive: !o.isActive };
      }
      return o;
    });
    db.saveSnapshot(snapshot, "offers");
  }

  resolveComplaint(complaintId, response) {
    return db.resolveComplaint(complaintId, response);
  }

  moderateReview(reviewId, status) {
    const snapshot = db.getSnapshot();
    snapshot.reviews = (snapshot.reviews || []).map(r => {
      if (r.reviewId === reviewId) {
        return { ...r, status };
      }
      return r;
    });
    db.saveSnapshot(snapshot, "reviews");
  }

  getSettings() {
    return db.getSnapshot().settings || {};
  }

  updateSettings(updates) {
    const snapshot = db.getSnapshot();
    snapshot.settings = { ...(snapshot.settings || {}), ...updates };
    db.saveSnapshot(snapshot, "settings");
  }

  getAdminLogs() {
    return db.getSnapshot().adminLogs || [];
  }

  deleteCustomer(userId) {
    return db.deleteCustomer(userId);
  }

  toggleUserStatus(userId) {
    return db.toggleUserStatus(userId);
  }

  deletePartner(partnerId) {
    return db.deletePartner(partnerId);
  }

  cancelPartnerGigSlot(slotId) {
    return db.cancelPartnerGigSlot(slotId, null);
  }

  togglePartnerAvailability(partnerId) {
    const snapshot = db.getSnapshot();
    const partner = (snapshot.partners || []).find(p => p.partnerId === partnerId || p.userId === partnerId);
    if (!partner) throw new Error("Partner not found.");

    const nextState = !partner.isOnline;
    if (nextState && partner.kycStatus !== "APPROVED") {
      db.adminReviewKyc(partnerId, "APPROVE");
    }
    return db.updatePartnerAvailability(partnerId, nextState);
  }

  getAllPartnerGigSlots(dateFilter = null) {
    return db.getAllPartnerGigSlots(dateFilter);
  }

  getOnlinePartners() {
    const snapshot = db.getSnapshot();
    return (snapshot.partners || []).filter(p => !!p.isOnline);
  }

  getPartnerFinancials(partnerId) {
    return db.getPartnerFinancials(partnerId);
  }

  getAllPayouts() {
    return db.getAllPartnerPayouts();
  }

  processPartnerPayout(payload) {
    return db.processPartnerPayout(payload);
  }

  processBatchWeeklyPayout(partnerIds = []) {
    return db.processBatchWeeklyPayout(partnerIds);
  }
}

export const adminManager = new AdminManager();
