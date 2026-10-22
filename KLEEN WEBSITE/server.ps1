# KLEEN Platform Native PowerShell Server
# Serves static web assets and handles Brevo OTP authentication endpoints

$port = 8080
$root = $PSScriptRoot
if (-not $root) { $root = "c:\Users\LENOVO\Desktop\KLEEN WEBSITE" }

$brevoApiKey = "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"
$brevoSenderEmail = "ananthanappu006@gmail.com"
$brevoSenderName = "KLEEN"

# Load .env if present
$envFile = Join-Path $root ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -and -not $line.StartsWith("#")) {
            $parts = $line.Split("=", 2)
            if ($parts.Length -eq 2) {
                $k = $parts[0].Trim()
                $v = $parts[1].Trim()
                if ($k -eq "BREVO_API_KEY") { $brevoApiKey = $v }
                if ($k -eq "BREVO_SENDER_EMAIL") { $brevoSenderEmail = $v }
                if ($k -eq "BREVO_SENDER_NAME") { $brevoSenderName = $v }
                if ($k -eq "PORT") { [int]::TryParse($v, [ref]$port) | Out-Null }
            }
        }
    }
}

# In-memory stores
$script:otpRecords = @{}     # email -> @{ otp; expiresAt; attempts; role }
$script:sessions = @{}       # token -> userObj

function Mask-Email($email) {
    if (-not $email -or -not $email.Contains("@")) { return "***" }
    $parts = $email.Split("@")
    $name = $parts[0]
    if ($name.Length -le 2) { return "*@" + $parts[1] }
    return $name.Substring(0, 2) + ("*" * ($name.Length - 2)) + "@" + $parts[1]
}

function Send-BrevoEmail($toEmail, $otp, $role) {
    if (-not $brevoApiKey) {
        Write-Host "[WARN] BREVO_API_KEY not set; simulated email"
        return $null
    }

    $roleDisplay = "Customer"
    if ($role -eq "partner") { $roleDisplay = "Service Partner" }
    elseif ($role -eq "admin") { $roleDisplay = "Administrator" }

    $html = @"
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #F8FAFC; padding: 30px;">
  <div style="max-width: 500px; margin: 0 auto; background: #fff; border-radius: 12px; padding: 28px; border: 1px solid #E2E8F0;">
    <h2 style="color: #064E3B; margin-top: 0;">KLEEN $roleDisplay Verification</h2>
    <p style="color: #475569;">Use the 6-digit code below to securely authenticate your account. Valid for 5 minutes.</p>
    <div style="background: #F0FDF4; border: 2px dashed #10B981; border-radius: 10px; padding: 18px; text-align: center; margin: 20px 0;">
      <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #064E3B; font-family: monospace;">$otp</span>
    </div>
    <p style="font-size: 12px; color: #94A3B8;">Expires in 5 minutes. Never share this code with anyone.</p>
  </div>
</body>
</html>
"@

    $payload = @{
        sender = @{ name = $brevoSenderName; email = $brevoSenderEmail }
        to = @( @{ email = $toEmail } )
        subject = "Your KLEEN Verification Code: $otp"
        htmlContent = $html
    } | ConvertTo-Json -Depth 5

    try {
        $headers = @{
            "api-key" = $brevoApiKey
            "Content-Type" = "application/json"
            "Accept" = "application/json"
        }
        $resp = Invoke-RestMethod -Uri "https://api.brevo.com/v3/smtp/email" -Method POST -Headers $headers -Body $payload
        Write-Host "[INFO] Brevo email accepted for $(Mask-Email $toEmail)"
        return $null
    } catch {
        $errStr = $_.Exception.Message
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errStr = $reader.ReadToEnd()
        }
        Write-Host "[ERROR] Brevo API error: $errStr"
        return $errStr
    }
}

# Start HTTP Listener
$listener = New-Object System.Net.HttpListener
$urlPrefix = "http://localhost:$port/"
$listener.Prefixes.Add($urlPrefix)
$listener.Prefixes.Add("http://127.0.0.1:$port/")

try {
    $listener.Start()
} catch {
    Write-Host "[ERROR] Failed to bind port ${port}: $_"
    exit 1
}

Write-Host "========================================================="
Write-Host " KLEEN Platform Server running on http://localhost:$port"
Write-Host " Brevo Sender: $brevoSenderName <$brevoSenderEmail>"
Write-Host " Ready to accept requests..."
Write-Host "========================================================="

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".svg"  = "image/svg+xml"
    ".webp" = "image/webp"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # CORS Headers
        $response.AddHeader("Access-Control-Allow-Origin", "*")
        $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        $response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        $rawUrl = $request.RawUrl
        $path = $request.Url.AbsolutePath

        # =========================================================================
        # API Endpoints
        # =========================================================================
        if ($path.StartsWith("/api/auth/")) {
            $response.ContentType = "application/json; charset=utf-8"

            # Read Body
            $body = ""
            if ($request.HasEntityBody) {
                $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
                $body = $reader.ReadToEnd()
                $reader.Close()
            }
            $json = @{}
            if ($body) {
                try { $json = $body | ConvertFrom-Json } catch {}
            }

            if ($path -eq "/api/auth/send-otp" -and $request.HttpMethod -eq "POST") {
                $email = ($json.email -as [string]).Trim().ToLower()
                $role = ($json.role -as [string]).Trim().ToLower()
                if (-not $role) { $role = "customer" }

                if (-not $email -or -not ($email -match "^[^\s@]+@[^\s@]+\.[^\s@]+$")) {
                    $response.StatusCode = 400
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes((@{ success = $false; message = "Please enter a valid email address." } | ConvertTo-Json))
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    $response.Close()
                    continue
                }

                # Generate 6-digit code
                $otp = (Get-Random -Minimum 100000 -Maximum 999999).ToString()
                $script:otpRecords[$email] = @{
                    otp = $otp
                    expiresAt = (Get-Date).AddMinutes(5)
                    attempts = 0
                    role = $role
                }

                Write-Host "[INFO] OTP generated for $(Mask-Email $email) (Role: $role)"
                Write-Host "[DEV NOTICE] [LOCAL DEV] >>> OTP for $(Mask-Email $email) is: $otp <<<"

                $sendErr = Send-BrevoEmail $email $otp $role
                if ($sendErr) {
                    if ($sendErr.Contains("unrecognised IP address")) {
                        $response.StatusCode = 403
                        $errMsg = "Brevo Security Notice: Your IP address is not authorized yet. Please visit https://app.brevo.com/security/authorised_ips to authorize your current IP, or check your email for Brevo's authorization link."
                    } else {
                        $response.StatusCode = 500
                        $errMsg = "Failed to deliver verification email. Please check your email address and try again."
                    }
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes((@{ success = $false; message = $errMsg } | ConvertTo-Json))
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    $response.Close()
                    continue
                }

                $response.StatusCode = 200
                $resData = @{
                    success = $true
                    message = "A 6-digit verification code has been sent to $(Mask-Email $email). Please check your inbox."
                }
                $bytes = [System.Text.Encoding]::UTF8.GetBytes(($resData | ConvertTo-Json))
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.Close()
                continue
            }

            if ($path -eq "/api/auth/verify-otp" -and $request.HttpMethod -eq "POST") {
                $email = ($json.email -as [string]).Trim().ToLower()
                $otp = ($json.otp -as [string]).Trim()
                $role = ($json.role -as [string]).Trim().ToLower()

                if (-not $script:otpRecords.ContainsKey($email)) {
                    $response.StatusCode = 400
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes((@{ success = $false; message = "No verification code was sent to this email." } | ConvertTo-Json))
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    $response.Close()
                    continue
                }

                $rec = $script:otpRecords[$email]
                if ((Get-Date) -gt $rec.expiresAt) {
                    $response.StatusCode = 400
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes((@{ success = $false; message = "This verification code has expired. Please request a new code." } | ConvertTo-Json))
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    $response.Close()
                    continue
                }

                if ($rec.attempts -ge 5) {
                    $response.StatusCode = 429
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes((@{ success = $false; message = "Too many attempts. Please request a new code." } | ConvertTo-Json))
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    $response.Close()
                    continue
                }

                if ($rec.otp -ne $otp) {
                    $rec.attempts++
                    $rem = 5 - $rec.attempts
                    $response.StatusCode = 400
                    $msg = "Incorrect verification code. $rem attempts remaining."
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes((@{ success = $false; message = $msg } | ConvertTo-Json))
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    $response.Close()
                    continue
                }

                # Success!
                $script:otpRecords.Remove($email)
                $token = [System.Guid]::NewGuid().ToString("N")
                $resolvedRole = if ($role) { $role } else { $rec.role }
                if (-not $resolvedRole) { $resolvedRole = "customer" }

                $userID = "usr_" + [System.Guid]::NewGuid().ToString("N").Substring(0, 8)
                $fullName = $email.Split("@")[0]
                if ($resolvedRole -eq "admin") {
                    $userID = "usr_admin_kleen"
                    $fullName = "KLEEN Executive Admin"
                }

                $userObj = @{
                    id = $userID
                    email = $email
                    fullName = $fullName
                    role = $resolvedRole
                    accountStatus = "ACTIVE"
                    emailVerified = $true
                    authMethod = "email_otp"
                }

                $script:sessions[$token] = $userObj

                $cookie = New-Object System.Net.Cookie("kleen_session", $token, "/")
                $cookie.HttpOnly = $true
                $response.Cookies.Add($cookie)

                $response.StatusCode = 200
                $resData = @{
                    success = $true
                    verified = $true
                    message = "Email verified successfully."
                    user = $userObj
                    token = $token
                }
                $bytes = [System.Text.Encoding]::UTF8.GetBytes(($resData | ConvertTo-Json -Depth 5))
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.Close()
                continue
            }

            if ($path -eq "/api/auth/resend-otp" -and $request.HttpMethod -eq "POST") {
                $email = ($json.email -as [string]).Trim().ToLower()
                $role = "customer"
                if ($script:otpRecords.ContainsKey($email)) {
                    $role = $script:otpRecords[$email].role
                }

                $otp = (Get-Random -Minimum 100000 -Maximum 999999).ToString()
                $script:otpRecords[$email] = @{
                    otp = $otp
                    expiresAt = (Get-Date).AddMinutes(5)
                    attempts = 0
                    role = $role
                }

                Write-Host "[INFO] OTP resent for $(Mask-Email $email)"
                Write-Host "[DEV NOTICE] [LOCAL DEV] >>> Resent OTP for $(Mask-Email $email) is: $otp <<<"

                $sendErr = Send-BrevoEmail $email $otp $role
                if ($sendErr) {
                    $response.StatusCode = 500
                    $bytes = [System.Text.Encoding]::UTF8.GetBytes((@{ success = $false; message = "Failed to resend verification email." } | ConvertTo-Json))
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    $response.Close()
                    continue
                }

                $response.StatusCode = 200
                $bytes = [System.Text.Encoding]::UTF8.GetBytes((@{ success = $true; message = "A new verification code has been sent." } | ConvertTo-Json))
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.Close()
                continue
            }

            if ($path -eq "/api/auth/logout") {
                $response.StatusCode = 200
                $bytes = [System.Text.Encoding]::UTF8.GetBytes((@{ success = $true; message = "Logged out" } | ConvertTo-Json))
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.Close()
                continue
            }

            if ($path -eq "/api/auth/me") {
                $response.StatusCode = 200
                $bytes = [System.Text.Encoding]::UTF8.GetBytes((@{ user = $null } | ConvertTo-Json))
                $response.OutputStream.Write($bytes, 0, $bytes.Length)
                $response.Close()
                continue
            }

            # Unhandled API
            $response.StatusCode = 404
            $bytes = [System.Text.Encoding]::UTF8.GetBytes((@{ success = $false; message = "Endpoint not found" } | ConvertTo-Json))
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.Close()
            continue
        }

        # =========================================================================
        # Static File Serving
        # =========================================================================
        $cleanPath = $path.TrimStart("/")
        if (-not $cleanPath -or $cleanPath -eq "") {
            $cleanPath = "index.html"
        }

        # Security check: forbid directory traversal
        $filePath = [System.IO.Path]::GetFullPath((Join-Path $root $cleanPath))
        $rootFullPath = [System.IO.Path]::GetFullPath($root)

        if (-not $filePath.StartsWith($rootFullPath)) {
            $response.StatusCode = 403
            $response.Close()
            continue
        }

        if (-not (Test-Path $filePath -PathType Leaf)) {
            # Try index.html for SPA route fallback
            $fallback = Join-Path $root "index.html"
            if (Test-Path $fallback) {
                $filePath = $fallback
            } else {
                $response.StatusCode = 404
                $response.Close()
                continue
            }
        }

        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        $ct = "application/octet-stream"
        if ($mimeTypes.ContainsKey($ext)) {
            $ct = $mimeTypes[$ext]
        }

        $response.ContentType = $ct
        $response.AddHeader("Cache-Control", "no-cache, must-revalidate")

        $fileBytes = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentLength64 = $fileBytes.Length
        $response.StatusCode = 200
        $response.OutputStream.Write($fileBytes, 0, $fileBytes.Length)
        $response.Close()
    } catch {
        # Catch connection aborts gracefully
    }
}
