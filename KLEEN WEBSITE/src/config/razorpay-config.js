/**
 * KLEEN — Razorpay Payment Gateway Configuration
 */

export const razorpayConfig = {
  keyId: "rzp_test_TbrOTwP7wGgfOG",
  currency: "INR",
  companyName: "KLEEN Home Services",
  themeColor: "#0F4C3A"
};

export const isRazorpayConfigured = () => {
  return (
    razorpayConfig.keyId &&
    razorpayConfig.keyId.startsWith("rzp_") &&
    !razorpayConfig.keyId.includes("sample")
  );
};

// Expose globally for SDK accessibility
if (typeof window !== "undefined") {
  window.RAZORPAY_LIVE_KEY = razorpayConfig.keyId;
}
