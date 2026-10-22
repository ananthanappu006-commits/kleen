const crypto = require("crypto");

/**
 * Generates Razorpay Order options and verifies payment signature.
 */
function verifySignature(orderId, paymentId, signature, secret) {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(`${orderId}|${paymentId}`);
  const generated = hmac.digest("hex");
  return generated === signature;
}

module.exports = {
  verifySignature
};
