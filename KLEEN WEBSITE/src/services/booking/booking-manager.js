/**
 * KLEEN — Booking & Concurrency Manager
 */

import { db } from "../db-service.js";

class BookingManager {
  calculatePrice(service, couponCode = "KLEEN50") {
    const basePrice = service.price || 499;
    const platformFee = 49;
    let discount = 0;

    if (couponCode === "KLEEN50") {
      discount = 50;
    } else if (couponCode === "DEEPCLEAN10") {
      discount = Math.round(basePrice * 0.1);
    }

    const taxableAmount = Math.max(0, basePrice - discount);
    const tax = Math.round(taxableAmount * 0.18);
    const total = taxableAmount + platformFee + tax;

    return {
      basePrice,
      platformFee,
      discount,
      tax,
      total
    };
  }

  createBooking(payload) {
    return db.createBooking(payload);
  }

  getBookings() {
    return db.getBookings();
  }

  getBookingById(id) {
    return db.getBookingById(id);
  }

  updateStatus(bookingId, status, extra = {}) {
    return db.updateBookingStatus(bookingId, status, extra);
  }

  cancelBooking(bookingId, reason) {
    return db.updateBookingStatus(bookingId, "CUSTOMER_CANCELLED", {
      cancellationReason: reason,
      refundStatus: "REFUND_PENDING",
      cancelledAt: new Date().toISOString()
    });
  }

  subscribe(callback) {
    return db.subscribe("bookings", callback);
  }
}

export const bookingManager = new BookingManager();
