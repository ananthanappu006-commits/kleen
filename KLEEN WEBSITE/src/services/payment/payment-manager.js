/**
 * KLEEN — Payment Manager
 */

import { payment } from "../payment-service.js";

class PaymentManager {
  async processPayment(bookingDetails, costSummary) {
    return payment.processPayment(bookingDetails, costSummary);
  }
}

export const paymentManager = new PaymentManager();
