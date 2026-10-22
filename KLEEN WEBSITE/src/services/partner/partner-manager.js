/**
 * KLEEN — Partner Operations Manager
 */

import { db } from "../db-service.js";

class PartnerManager {
  getPartners() {
    return db.getPartners();
  }

  getPartnerById(id) {
    return db.getPartnerById(id);
  }

  setAvailability(partnerId, isOnline) {
    return db.updatePartnerAvailability(partnerId, isOnline);
  }

  getAvailability(partnerId) {
    return db.getPartnerAvailability(partnerId);
  }

  saveAvailability(partnerId, availabilityData) {
    return db.savePartnerAvailability(partnerId, availabilityData);
  }

  submitKyc(partnerId, data) {
    return db.submitKycApplication(partnerId, data);
  }

  getKyc(partnerId) {
    return db.getPartnerKyc(partnerId);
  }

  saveKyc(partnerId, kycData) {
    return db.savePartnerKyc(partnerId, kycData);
  }

  acceptBooking(bookingId, partnerId, partnerName) {
    return db.acceptBookingAtomically(bookingId, partnerId, partnerName);
  }

  rejectBooking(bookingId, partnerId, reason) {
    return db.rejectBookingByPartner(bookingId, partnerId, reason);
  }

  startTrip(bookingId, partnerId) {
    return db.startTrip(bookingId, partnerId);
  }

  markArrived(bookingId, partnerId) {
    return db.markArrived(bookingId, partnerId);
  }

  startService(bookingId, partnerId) {
    return db.startService(bookingId, partnerId);
  }

  completeService(bookingId, partnerId) {
    return db.completeService(bookingId, partnerId);
  }

  getEarnings(partnerId) {
    return db.getPartnerEarnings(partnerId);
  }

  getBankDetails(partnerId) {
    return db.getPartnerBankDetails(partnerId);
  }

  saveBankDetails(partnerId, bankData) {
    return db.savePartnerBankDetails(partnerId, bankData);
  }

  getFinancials(partnerId) {
    return db.getPartnerFinancials(partnerId);
  }

  getPayouts(partnerId) {
    return db.getPartnerPayouts(partnerId);
  }

  requestQuickSettle(partnerId, amount, note) {
    return db.requestQuickSettle(partnerId, amount, note);
  }

  getTickets(partnerId) {
    return db.getPartnerTickets(partnerId);
  }

  createTicket(ticketData) {
    return db.createPartnerTicket(ticketData);
  }

  cancelBooking(bookingId, partnerId, reason) {
    return db.cancelBookingByPartner(bookingId, partnerId, reason);
  }

  removeProfilePhoto(partnerId) {
    return db.removePartnerProfilePhoto(partnerId);
  }

  logAudit(payload) {
    return db.logAuditAction(payload);
  }

  subscribe(callback) {
    return db.subscribe("partners", callback);
  }

  subscribeBookings(callback) {
    return db.subscribe("bookings", callback);
  }
}

export const partnerManager = new PartnerManager();
