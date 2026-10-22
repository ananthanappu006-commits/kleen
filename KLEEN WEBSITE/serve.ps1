# KLEEN Platform Server Launcher
# Runs the full backend server with Brevo Email OTP API and static hosting.

if (Get-Command go -ErrorAction SilentlyContinue) {
    Write-Host "Compiling and starting KLEEN Backend & Static Server..."
    go build -o .\kleen-server.exe server.go
    if ($LASTEXITCODE -eq 0) {
        .\kleen-server.exe
        exit $LASTEXITCODE
    }
}

$port = 8080
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "KLEEN server running at http://localhost:$port/"

$mimeMap = @{
    ".html" = "text/html; charset=utf-8";
    ".css"  = "text/css; charset=utf-8";
    ".js"   = "application/javascript; charset=utf-8";
    ".json" = "application/json; charset=utf-8";
    ".png"  = "image/png";
    ".jpg"  = "image/jpeg";
    ".jpeg" = "image/jpeg";
    ".svg"  = "image/svg+xml";
    ".ico"  = "image/x-icon"
}

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        try {
            $request = $context.Request
            $response = $context.Response

            $localPath = $request.Url.LocalPath.TrimStart('/')
            if ([string]::IsNullOrWhiteSpace($localPath)) {
                $localPath = "index.html"
            }

            $filePath = Join-Path (Get-Location) $localPath

            if (Test-Path $filePath -PathType Leaf) {
                $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
                $mime = if ($mimeMap.ContainsKey($ext)) { $mimeMap[$ext] } else { "application/octet-stream" }
                $response.ContentType = $mime
                $response.Headers.Add("Access-Control-Allow-Origin", "*")
                $response.Headers.Add("Cache-Control", "no-cache")

                [byte[]]$bytes = [System.IO.File]::ReadAllBytes($filePath)
                $response.ContentLength64 = $bytes.LongLength
                if ($request.HttpMethod -ne "HEAD") {
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                }
            } else {
                # SPA Fallback for client routes
                $indexFile = Join-Path (Get-Location) "index.html"
                if (Test-Path $indexFile -PathType Leaf) {
                    $response.ContentType = "text/html; charset=utf-8"
                    $response.Headers.Add("Access-Control-Allow-Origin", "*")
                    [byte[]]$bytes = [System.IO.File]::ReadAllBytes($indexFile)
                    $response.ContentLength64 = $bytes.LongLength
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                } else {
                    $response.StatusCode = 404
                    [byte[]]$errBytes = [System.Text.Encoding]::UTF8.GetBytes("File Not Found")
                    $response.ContentLength64 = $errBytes.LongLength
                    $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
                }
            }
        } catch {
            Write-Host "Request error: $_"
        } finally {
            if ($null -ne $response) {
                $response.Close()
            }
        }
    }
} finally {
    $listener.Stop()
}
