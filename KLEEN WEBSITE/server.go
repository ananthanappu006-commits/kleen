package main

import (
	"bufio"
	"bytes"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"math/big"
	"net/http"
	"net/smtp"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"
)

// Config holds environment settings
type Config struct {
	BrevoAPIKey     string
	BrevoSMTPKey    string
	BrevoSMTPLogin  string
	BrevoSenderEmail string
	BrevoSenderName  string
	Port             string
}

// OTPRecord represents an active or past OTP in otp_verifications
type OTPRecord struct {
	ID                string     `json:"id"`
	Email             string     `json:"email"`
	OTPHash           string     `json:"otp_hash"`
	Salt              string     `json:"salt"`
	ExpiresAt         time.Time  `json:"expires_at"`
	Attempts          int        `json:"attempts"`
	MaxAttempts       int        `json:"max_attempts"`
	ResendAvailableAt time.Time  `json:"resend_available_at"`
	Used              bool       `json:"used"`
	CreatedAt         time.Time  `json:"created_at"`
	VerifiedAt        *time.Time `json:"verified_at,omitempty"`
	Role              string     `json:"role"`
}

// UserSession represents an authenticated session
type UserSession struct {
	ID            string    `json:"id"`
	Email         string    `json:"email"`
	FullName      string    `json:"fullName"`
	Role          string    `json:"role"`
	AccountStatus string    `json:"accountStatus"`
	EmailVerified bool      `json:"emailVerified"`
	AuthMethod    string    `json:"authMethod"`
	CreatedAt     time.Time `json:"createdAt"`
	LastLogin     time.Time `json:"lastLogin"`
}

type OTPStore struct {
	sync.RWMutex
	records  map[string][]*OTPRecord // email -> slice of records
	sessions map[string]*UserSession // token -> session
	sendLogs map[string][]time.Time  // email -> timestamps of sends within 1 hr
}

var (
	cfg      Config
	otpStore = &OTPStore{
		records:  make(map[string][]*OTPRecord),
		sessions: make(map[string]*UserSession),
		sendLogs: make(map[string][]time.Time),
	}
	emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
)

func loadEnv() {
	// 1. Try reading .env file
	file, err := os.Open(".env")
	if err == nil {
		defer file.Close()
		scanner := bufio.NewScanner(file)
		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			if line == "" || strings.HasPrefix(line, "#") {
				continue
			}
			parts := strings.SplitN(line, "=", 2)
			if len(parts) == 2 {
				k := strings.TrimSpace(parts[0])
				v := strings.TrimSpace(parts[1])
				v = strings.Trim(v, `"'`)
				if os.Getenv(k) == "" {
					os.Setenv(k, v)
				}
			}
		}
		if err := scanner.Err(); err != nil {
			log.Printf("Warning: error reading .env file: %v", err)
		}
	}

	apiKey := os.Getenv("BREVO_API_KEY")
	smtpKey := os.Getenv("BREVO_SMTP_KEY")
	if apiKey == "" && smtpKey != "" {
		apiKey = smtpKey
	}
	if smtpKey == "" && apiKey != "" {
		smtpKey = apiKey
	}

	cfg = Config{
		BrevoAPIKey:     apiKey,
		BrevoSMTPKey:    smtpKey,
		BrevoSMTPLogin:  os.Getenv("BREVO_SMTP_LOGIN"),
		BrevoSenderEmail: os.Getenv("BREVO_SENDER_EMAIL"),
		BrevoSenderName:  os.Getenv("BREVO_SENDER_NAME"),
		Port:             os.Getenv("PORT"),
	}

	if cfg.Port == "" {
		cfg.Port = "8080"
	}
	if cfg.BrevoSenderName == "" {
		cfg.BrevoSenderName = "KLEEN"
	}
	if cfg.BrevoSenderEmail == "" {
		cfg.BrevoSenderEmail = "notifications@kleen.in"
	}
}

// Generate a cryptographically secure 6-digit OTP
func generateCryptoOTP() (string, error) {
	max := big.NewInt(1000000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

// Generate random hex token
func generateRandomHex(byteCount int) string {
	b := make([]byte, byteCount)
	rand.Read(b)
	return hex.EncodeToString(b)
}

// Hash OTP with salt
func hashOTP(otp, salt string) string {
	hasher := sha256.New()
	hasher.Write([]byte(salt + ":" + otp + ":kleen_secret_salt_v1"))
	return hex.EncodeToString(hasher.Sum(nil))
}

// Brevo API email payload structures
type BrevoSender struct {
	Name  string `json:"name"`
	Email string `json:"email"`
}

type BrevoRecipient struct {
	Email string `json:"email"`
}

type BrevoSendEmailRequest struct {
	Sender      BrevoSender      `json:"sender"`
	To          []BrevoRecipient `json:"to"`
	Subject     string           `json:"subject"`
	HTMLContent string           `json:"htmlContent"`
}

// Send OTP email via Brevo transactional email API
func sendBrevoOtpEmail(toEmail, otp, role string) error {
	if cfg.BrevoAPIKey == "" {
		log.Println("[WARN] BREVO_API_KEY is not configured; simulated email send for OTP")
		return nil
	}

	roleDisplay := "Customer"
	if role == "partner" {
		roleDisplay = "Service Partner"
	} else if role == "admin" {
		roleDisplay = "Administrator"
	}

	htmlContent := fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KLEEN Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1E293B;">
  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F8FAFC; padding: 36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%%" max-width="520" cellspacing="0" cellpadding="0" border="0" style="max-width: 520px; background-color: #FFFFFF; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.06); border: 1px solid #E2E8F0;">
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #064E3B 0%%, #10B981 100%%); padding: 32px 28px; text-align: center;">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px; color: #FFFFFF;">KLEEN</h1>
              <p style="margin: 6px 0 0; font-size: 13px; color: #D1FAE5; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase;">Verified Home & Care Services</p>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <span style="display: inline-block; padding: 4px 12px; background-color: #ECFDF5; color: #047857; font-size: 12px; font-weight: 700; border-radius: 9999px; margin-bottom: 16px;">
                %s Portal Verification
              </span>
              <h2 style="margin: 0 0 12px; font-size: 20px; font-weight: 700; color: #0F172A;">Verify Your Email Address</h2>
              <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #475569;">
                Use the 6-digit verification code below to securely authenticate your KLEEN account. This code is valid for <strong>5 minutes</strong>.
              </p>
              
              <!-- OTP Box -->
              <div style="background-color: #F0FDF4; border: 2px dashed #10B981; border-radius: 12px; padding: 22px 16px; text-align: center; margin: 28px 0;">
                <span style="font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #064E3B; font-family: 'SF Mono', Consolas, Monaco, monospace; display: inline-block;">
                  %s
                </span>
                <div style="margin-top: 8px; font-size: 12px; color: #059669; font-weight: 600;">
                  Expires in 5 minutes &bull; Single-use only
                </div>
              </div>

              <!-- Security Warning -->
              <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; border-radius: 6px; padding: 12px 14px; margin: 24px 0;">
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
          <!-- Footer -->
          <tr>
            <td style="background-color: #F1F5F9; padding: 20px 32px; text-align: center; border-top: 1px solid #E2E8F0;">
              <p style="margin: 0; font-size: 12px; color: #94A3B8;">
                &copy; %d KLEEN Technologies Pvt. Ltd. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`, roleDisplay, otp, time.Now().Year())

	payload := BrevoSendEmailRequest{
		Sender: BrevoSender{
			Name:  cfg.BrevoSenderName,
			Email: cfg.BrevoSenderEmail,
		},
		To: []BrevoRecipient{
			{Email: toEmail},
		},
		Subject:     fmt.Sprintf("Your KLEEN Verification Code: %s", otp),
		HTMLContent: htmlContent,
	}

	// If SMTP Login and Key are configured, attempt direct Brevo SMTP Relay
	smtpLogin := cfg.BrevoSMTPLogin
	if smtpLogin == "" {
		smtpLogin = cfg.BrevoSenderEmail
	}
	if cfg.BrevoSMTPKey != "" && smtpLogin != "" {
		auth := smtp.PlainAuth("", smtpLogin, cfg.BrevoSMTPKey, "smtp-relay.brevo.com")
		msg := []byte(fmt.Sprintf("From: %s <%s>\r\nTo: %s\r\nSubject: Your KLEEN Verification Code: %s\r\nMIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n%s",
			cfg.BrevoSenderName, cfg.BrevoSenderEmail, toEmail, otp, htmlContent))
		err := smtp.SendMail("smtp-relay.brevo.com:587", auth, cfg.BrevoSenderEmail, []string{toEmail}, msg)
		if err == nil {
			log.Printf("[INFO] Brevo email dispatched via SMTP relay to %s", maskEmail(toEmail))
			return nil
		}
		log.Printf("[WARN] Brevo SMTP attempt (%s) returned: %v; trying API fallback...", smtpLogin, err)
	}

	if cfg.BrevoAPIKey != "" {
		bodyBytes, err := json.Marshal(payload)
		if err != nil {
			return err
		}

		req, err := http.NewRequest("POST", "https://api.brevo.com/v3/smtp/email", bytes.NewBuffer(bodyBytes))
		if err != nil {
			return err
		}

		req.Header.Set("api-key", cfg.BrevoAPIKey)
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Accept", "application/json")

		client := &http.Client{Timeout: 10 * time.Second}
		resp, err := client.Do(req)
		if err != nil {
			log.Printf("[ERROR] Brevo network request failed: %v", err)
			return err
		}
		defer resp.Body.Close()

		if resp.StatusCode >= 200 && resp.StatusCode < 300 {
			respBytes, _ := io.ReadAll(resp.Body)
			log.Printf("[INFO] Brevo email accepted by API for %s (Status: %d, Response: %s)", maskEmail(toEmail), resp.StatusCode, string(respBytes))
			return nil
		}

		respBytes, _ := io.ReadAll(resp.Body)
		respStr := string(respBytes)
		log.Printf("[ERROR] Brevo API responded with status %d: %s", resp.StatusCode, respStr)
		if strings.Contains(respStr, "unrecognised IP address") {
			ipRe := regexp.MustCompile(`unrecognised IP address\s+([0-9a-fA-F:.]+)`)
			detectedIP := ""
			if match := ipRe.FindStringSubmatch(respStr); len(match) > 1 {
				detectedIP = strings.Trim(match[1], ".")
			}
			return fmt.Errorf("brevo_ip_unauthorized:%s", detectedIP)
		}
		return fmt.Errorf("brevo delivery rejected: status %d", resp.StatusCode)
	}

	return nil
}

func maskEmail(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return "***"
	}
	name := parts[0]
	if len(name) <= 2 {
		return "*@" + parts[1]
	}
	return name[:2] + strings.Repeat("*", len(name)-2) + "@" + parts[1]
}

// JSON Helper
func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func respondError(w http.ResponseWriter, status int, message string) {
	respondJSON(w, status, map[string]interface{}{
		"success": false,
		"message": message,
	})
}

// CORS & Preflight middleware
func withCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next(w, r)
	}
}

// API: POST /api/auth/send-otp
func handleSendOTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req struct {
		Email string `json:"email"`
		Role  string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	if email == "" || !emailRegex.MatchString(email) {
		respondError(w, http.StatusBadRequest, "Please enter a valid email address.")
		return
	}

	role := strings.ToLower(strings.TrimSpace(req.Role))
	if role != "partner" && role != "admin" {
		role = "customer"
	}

	otpStore.Lock()
	now := time.Now()

	// Check 1-hour rate limit (max 5 per hour)
	logs := otpStore.sendLogs[email]
	var recentLogs []time.Time
	for _, t := range logs {
		if now.Sub(t) < time.Hour {
			recentLogs = append(recentLogs, t)
		}
	}
	if len(recentLogs) >= 5 {
		otpStore.Unlock()
		respondError(w, http.StatusTooManyRequests, "Too many verification requests. Please try again in an hour.")
		return
	}

	// Check 60s cooldown
	existing := otpStore.records[email]
	if len(existing) > 0 {
		latest := existing[len(existing)-1]
		if !latest.Used && now.Before(latest.ResendAvailableAt) {
			rem := int(latest.ResendAvailableAt.Sub(now).Seconds())
			otpStore.Unlock()
			respondError(w, http.StatusTooManyRequests, fmt.Sprintf("Please wait %d seconds before requesting another code.", rem))
			return
		}
	}

	// Generate 6-digit OTP
	otp, err := generateCryptoOTP()
	if err != nil {
		otpStore.Unlock()
		respondError(w, http.StatusInternalServerError, "Failed to generate security code")
		return
	}

	salt := generateRandomHex(16)
	recordID := "otp_" + generateRandomHex(12)
	hashed := hashOTP(otp, salt)

	// Invalidate previous active records
	for _, rec := range existing {
		if !rec.Used {
			rec.Used = true
		}
	}

	newRecord := &OTPRecord{
		ID:                recordID,
		Email:             email,
		OTPHash:           hashed,
		Salt:              salt,
		ExpiresAt:         now.Add(5 * time.Minute),
		Attempts:          0,
		MaxAttempts:       5,
		ResendAvailableAt: now.Add(60 * time.Second),
		Used:              false,
		CreatedAt:         now,
		Role:              role,
	}

	otpStore.records[email] = append(existing, newRecord)
	otpStore.sendLogs[email] = append(recentLogs, now)
	otpStore.Unlock()

	log.Printf("[INFO] OTP email requested for %s", maskEmail(email))
	log.Printf("[DEV NOTICE] [LOCAL DEV] >>> OTP for %s is: %s <<<", maskEmail(email), otp)

	// Send email via Brevo
	if err := sendBrevoOtpEmail(email, otp, role); err != nil {
		log.Printf("[ERROR] Brevo delivery failed for %s: %v", maskEmail(email), err)
		if strings.Contains(err.Error(), "brevo_ip_unauthorized") {
			detectedIP := strings.TrimPrefix(err.Error(), "brevo_ip_unauthorized:")
			log.Printf("=================================================================")
			log.Printf("[BREVO IP AUTHORIZATION REQUIRED]")
			log.Printf("Current IP (%s) is not authorized in your Brevo account.", detectedIP)
			log.Printf("To authorize: visit https://app.brevo.com/security/authorised_ips or click the link in Brevo's email.")
			log.Printf("[LOCAL DEV] Allowing login flow with local code for %s: %s", maskEmail(email), otp)
			log.Printf("=================================================================")

			respondJSON(w, http.StatusOK, map[string]interface{}{
				"success":    true,
				"message":    fmt.Sprintf("Verification code generated! (Dev Notice: Brevo IP %s is not yet authorized in Brevo. For local testing, code is: %s)", detectedIP, otp),
				"otp":        otp,
				"devNotice":  fmt.Sprintf("Brevo IP (%s) unauthorized. Authorize at https://app.brevo.com/security/authorised_ips. Local OTP: %s", detectedIP, otp),
				"detectedIP": detectedIP,
			})
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to deliver verification email. Please check your email address and try again.")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("A 6-digit verification code has been sent to %s. Please check your inbox.", maskEmail(email)),
	})
}

// API: POST /api/auth/verify-otp
func handleVerifyOTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req struct {
		Email string `json:"email"`
		OTP   string `json:"otp"`
		Role  string `json:"role"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	otp := strings.TrimSpace(req.OTP)

	if email == "" || !emailRegex.MatchString(email) {
		respondError(w, http.StatusBadRequest, "Please enter a valid email address.")
		return
	}
	if len(otp) != 6 {
		respondError(w, http.StatusBadRequest, "Please enter a complete 6-digit code.")
		return
	}

	otpStore.Lock()
	defer otpStore.Unlock()

	records := otpStore.records[email]
	if len(records) == 0 {
		respondError(w, http.StatusBadRequest, "No verification code was sent to this email.")
		return
	}

	latest := records[len(records)-1]

	if latest.Used {
		respondError(w, http.StatusBadRequest, "This verification code has already been used. Please request a new code.")
		return
	}

	if latest.Attempts >= latest.MaxAttempts {
		respondError(w, http.StatusTooManyRequests, "Too many attempts. Please request a new code.")
		return
	}

	now := time.Now()
	if now.After(latest.ExpiresAt) {
		respondError(w, http.StatusBadRequest, "This verification code has expired. Please request a new code.")
		return
	}

	computedHash := hashOTP(otp, latest.Salt)
	if subtle.ConstantTimeCompare([]byte(computedHash), []byte(latest.OTPHash)) != 1 {
		latest.Attempts++
		rem := latest.MaxAttempts - latest.Attempts
		log.Printf("[WARN] OTP verification failed for %s (%d attempts remaining)", maskEmail(email), rem)
		if rem <= 0 {
			respondError(w, http.StatusTooManyRequests, "Too many attempts. Please request a new code.")
		} else {
			respondError(w, http.StatusBadRequest, fmt.Sprintf("Incorrect verification code. %d attempts remaining.", rem))
		}
		return
	}

	// Successfully verified!
	latest.Used = true
	latest.VerifiedAt = &now
	log.Printf("[INFO] OTP verification successful for %s", maskEmail(email))

	// Resolve role
	role := latest.Role
	if req.Role != "" {
		reqRole := strings.ToLower(strings.TrimSpace(req.Role))
		if reqRole == "partner" || reqRole == "customer" || reqRole == "admin" {
			role = reqRole
		}
	}
	if role == "" {
		role = "customer"
	}

	// Create user session
	userID := "usr_" + generateRandomHex(8)
	if role == "admin" {
		userID = "usr_admin_kleen"
	}
	sessionToken := generateRandomHex(32)
	username := strings.Split(email, "@")[0]
	fullName := strings.Title(strings.ReplaceAll(username, ".", " "))
	if role == "admin" {
		fullName = "KLEEN Executive Admin"
	}

	user := &UserSession{
		ID:            userID,
		Email:         email,
		FullName:      fullName,
		Role:          role,
		AccountStatus: "ACTIVE",
		EmailVerified: true,
		AuthMethod:    "email_otp",
		CreatedAt:     now,
		LastLogin:     now,
	}

	otpStore.sessions[sessionToken] = user

	// Set session cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "kleen_session",
		Value:    sessionToken,
		Path:     "/",
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		MaxAge:   86400 * 30, // 30 days
	})

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success":  true,
		"verified": true,
		"message":  "Email verified successfully.",
		"token":    sessionToken,
		"user":     user,
	})
}

// API: POST /api/auth/resend-otp
func handleResendOTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	var req struct {
		Email string `json:"email"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	email := strings.ToLower(strings.TrimSpace(req.Email))
	if email == "" || !emailRegex.MatchString(email) {
		respondError(w, http.StatusBadRequest, "Please enter a valid email address.")
		return
	}

	otpStore.Lock()
	now := time.Now()

	// Check 1-hour rate limit
	logs := otpStore.sendLogs[email]
	var recentLogs []time.Time
	for _, t := range logs {
		if now.Sub(t) < time.Hour {
			recentLogs = append(recentLogs, t)
		}
	}
	if len(recentLogs) >= 5 {
		otpStore.Unlock()
		respondError(w, http.StatusTooManyRequests, "Too many verification requests. Please try again in an hour.")
		return
	}

	existing := otpStore.records[email]
	role := "customer"
	if len(existing) > 0 {
		latest := existing[len(existing)-1]
		role = latest.Role
		if !latest.Used && now.Before(latest.ResendAvailableAt) {
			rem := int(latest.ResendAvailableAt.Sub(now).Seconds())
			otpStore.Unlock()
			respondError(w, http.StatusTooManyRequests, fmt.Sprintf("Please wait %d seconds before requesting another code.", rem))
			return
		}
		// Invalidate
		for _, rec := range existing {
			rec.Used = true
		}
	}

	otp, err := generateCryptoOTP()
	if err != nil {
		otpStore.Unlock()
		respondError(w, http.StatusInternalServerError, "Failed to generate security code")
		return
	}

	salt := generateRandomHex(16)
	recordID := "otp_" + generateRandomHex(12)
	hashed := hashOTP(otp, salt)

	newRecord := &OTPRecord{
		ID:                recordID,
		Email:             email,
		OTPHash:           hashed,
		Salt:              salt,
		ExpiresAt:         now.Add(5 * time.Minute),
		Attempts:          0,
		MaxAttempts:       5,
		ResendAvailableAt: now.Add(60 * time.Second),
		Used:              false,
		CreatedAt:         now,
		Role:              role,
	}

	otpStore.records[email] = append(existing, newRecord)
	otpStore.sendLogs[email] = append(recentLogs, now)
	otpStore.Unlock()

	log.Printf("[INFO] Resending OTP email requested for %s", maskEmail(email))
	log.Printf("[DEV NOTICE] [LOCAL DEV] >>> Resent OTP for %s is: %s <<<", maskEmail(email), otp)

	if err := sendBrevoOtpEmail(email, otp, role); err != nil {
		log.Printf("[ERROR] Brevo resend delivery failed for %s: %v", maskEmail(email), err)
		if strings.Contains(err.Error(), "brevo_ip_unauthorized") {
			detectedIP := strings.TrimPrefix(err.Error(), "brevo_ip_unauthorized:")
			log.Printf("=================================================================")
			log.Printf("[BREVO IP AUTHORIZATION REQUIRED]")
			log.Printf("Current IP (%s) is not authorized in your Brevo account.", detectedIP)
			log.Printf("To authorize: visit https://app.brevo.com/security/authorised_ips or click the link in Brevo's email.")
			log.Printf("[LOCAL DEV] Allowing resend flow with local code for %s: %s", maskEmail(email), otp)
			log.Printf("=================================================================")

			respondJSON(w, http.StatusOK, map[string]interface{}{
				"success":    true,
				"message":    fmt.Sprintf("A new verification code was generated! (Dev Notice: Brevo IP %s unauthorized. Local OTP: %s)", detectedIP, otp),
				"otp":        otp,
				"devNotice":  fmt.Sprintf("Brevo IP (%s) unauthorized. Authorize at https://app.brevo.com/security/authorised_ips. Local OTP: %s", detectedIP, otp),
				"detectedIP": detectedIP,
			})
			return
		}
		respondError(w, http.StatusInternalServerError, "Failed to resend verification email. Please try again.")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("A new 6-digit verification code has been sent to %s.", maskEmail(email)),
	})
}

// API: POST /api/auth/logout
func handleLogout(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	// Read token from header or cookie
	authHeader := r.Header.Get("Authorization")
	token := strings.TrimPrefix(authHeader, "Bearer ")
	if token == "" {
		if cookie, err := r.Cookie("kleen_session"); err == nil {
			token = cookie.Value
		}
	}

	if token != "" {
		otpStore.Lock()
		delete(otpStore.sessions, token)
		otpStore.Unlock()
	}

	// Clear cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "kleen_session",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Logged out successfully",
	})
}

// API: GET /api/auth/me
func handleMe(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	token := strings.TrimPrefix(authHeader, "Bearer ")
	if token == "" {
		if cookie, err := r.Cookie("kleen_session"); err == nil {
			token = cookie.Value
		}
	}

	if token == "" {
		respondError(w, http.StatusUnauthorized, "Not authenticated")
		return
	}

	otpStore.RLock()
	user, exists := otpStore.sessions[token]
	otpStore.RUnlock()

	if !exists {
		respondError(w, http.StatusUnauthorized, "Session expired or invalid")
		return
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"user":    user,
	})
}

func main() {
	loadEnv()

	mux := http.NewServeMux()

	// Register API endpoints
	mux.HandleFunc("/api/auth/send-otp", withCORS(handleSendOTP))
	mux.HandleFunc("/api/auth/verify-otp", withCORS(handleVerifyOTP))
	mux.HandleFunc("/api/auth/resend-otp", withCORS(handleResendOTP))
	mux.HandleFunc("/api/auth/logout", withCORS(handleLogout))
	mux.HandleFunc("/api/auth/me", withCORS(handleMe))

	// Static file handler with SPA fallback
	fs := http.FileServer(http.Dir("."))
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
		w.Header().Set("Access-Control-Allow-Origin", "*")

		path := strings.TrimPrefix(r.URL.Path, "/")
		if path == "" {
			path = "index.html"
		}

		// Check if requested file exists
		if _, err := os.Stat(path); os.IsNotExist(err) {
			// If not an API request, serve index.html (SPA client-side router)
			if !strings.HasPrefix(r.URL.Path, "/api/") {
				http.ServeFile(w, r, "index.html")
				return
			}
			http.NotFound(w, r)
			return
		}

		// Set mime type properly for JavaScript modules
		ext := filepath.Ext(path)
		switch ext {
		case ".js":
			w.Header().Set("Content-Type", "application/javascript; charset=utf-8")
		case ".css":
			w.Header().Set("Content-Type", "text/css; charset=utf-8")
		case ".json":
			w.Header().Set("Content-Type", "application/json; charset=utf-8")
		}

		fs.ServeHTTP(w, r)
	})

	log.Printf("=========================================================")
	log.Printf(" KLEEN Backend Server running on http://localhost:%s", cfg.Port)
	log.Printf(" Brevo Sender: %s <%s>", cfg.BrevoSenderName, cfg.BrevoSenderEmail)
	log.Printf(" Email OTP Auth API: POST /api/auth/send-otp")
	log.Printf("=========================================================")

	if err := http.ListenAndServe(":"+cfg.Port, mux); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
