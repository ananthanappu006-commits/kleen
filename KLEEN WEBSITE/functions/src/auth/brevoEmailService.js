/**
 * KLEEN — Brevo Transactional Email Service
 * Sends secure OTP emails using the Brevo (formerly Sendinblue) SMTP/Email REST API.
 */

const https = require("https");

const BREVO_API_KEY = process.env.BREVO_API_KEY || process.env.BREVO_SMTP_KEY || (process.env.FUNCTIONS_EMULATOR ? "" : "");
const BREVO_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || "notifications@kleen.in";
const BREVO_SENDER_NAME = process.env.BREVO_SENDER_NAME || "KLEEN";

function maskEmail(email) {
  if (!email || !email.includes("@")) return "***";
  const [user, domain] = email.split("@");
  if (user.length <= 2) return "*@" + domain;
  return user.slice(0, 2) + "*".repeat(user.length - 2) + "@" + domain;
}

/**
 * Generate branded KLEEN OTP Email HTML
 */
function buildKleenOtpHtml(otp, role) {
  const roleDisplay = role === "partner" ? "Service Partner" : "Customer";
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KLEEN Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1E293B;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="520" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06); border: 1px solid #E2E8F0;">
          <tr>
            <td style="background: linear-gradient(135deg, #064E3B 0%, #10B981 100%); padding: 32px 28px; text-align: center;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #FFFFFF;">KLEEN</h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #D1FAE5; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase;">Verified Home & Care Services</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 32px;">
              <span style="display: inline-block; padding: 4px 12px; background-color: #ECFDF5; color: #047857; font-size: 12px; font-weight: 700; border-radius: 9999px; margin-bottom: 16px;">
                ${roleDisplay} Portal Verification
              </span>
              <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #0F172A;">Verify Your Email Address</h2>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #475569;">
                Use the 6-digit verification code below to securely authenticate your KLEEN account. This code is valid for <strong>5 minutes</strong>.
              </p>
              <div style="background-color: #F0FDF4; border: 2px dashed #10B981; border-radius: 12px; padding: 22px 16px; text-align: center; margin: 28px 0;">
                <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #064E3B; font-family: 'SF Mono', Consolas, Monaco, monospace; display: inline-block;">
                  ${otp}
                </span>
                <div style="margin-top: 8px; font-size: 12px; color: #059669; font-weight: 600;">
                  Expires in 5 minutes &bull; Single-use only
                </div>
              </div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; border-radius: 6px; padding: 12px 14px; margin: 24px 0;">
                <tr>
                  <td>
                    <p style="margin: 0; font-size: 12.5px; line-height: 1.5; color: #92400E;">
                      <strong>Security Tip:</strong> Never share this OTP with anyone, including anyone claiming to be from KLEEN support or service agents.
                    </p>
                  </td>
                </tr>
              </table>
              <p style="margin: 20px 0 0; font-size: 13px; color: #64748B; line-height: 1.5;">
                If you did not request this verification code, please disregard this email or contact support.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background-color: #F1F5F9; padding: 20px 32px; text-align: center; border-top: 1px solid #E2E8F0;">
              <p style="margin: 0; font-size: 12px; color: #94A3B8;">
                &copy; ${year} KLEEN Technologies Pvt. Ltd. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send OTP Email via Brevo API
 */
async function sendBrevoOtpEmail(email, otp, role = "customer") {
  const apiKey = process.env.BREVO_API_KEY || BREVO_API_KEY;
  if (!apiKey) {
    console.warn("BREVO_API_KEY not configured; email simulation mode.");
    return { success: true, simulated: true };
  }

  const payload = JSON.stringify({
    sender: {
      name: process.env.BREVO_SENDER_NAME || BREVO_SENDER_NAME,
      email: process.env.BREVO_SENDER_EMAIL || BREVO_SENDER_EMAIL,
    },
    to: [{ email }],
    subject: `Your KLEEN Verification Code: ${otp}`,
    htmlContent: buildKleenOtpHtml(otp, role),
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.brevo.com",
      port: 443,
      path: "/v3/smtp/email",
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`[INFO] Brevo email sent successfully to ${maskEmail(email)}`);
          resolve({ success: true, statusCode: res.statusCode });
        } else {
          console.error(`[ERROR] Brevo API rejected email: status ${res.statusCode}`);
          reject(new Error(`Brevo delivery failed with status ${res.statusCode}`));
        }
      });
    });

    req.on("error", (err) => {
      console.error("[ERROR] Brevo network error:", err.message);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

module.exports = {
  sendBrevoOtpEmail,
  maskEmail,
};
