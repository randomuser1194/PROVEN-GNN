# Usage: .\extra\encrypt.ps1 submissions\predictions.csv

param (
    [Parameter(Mandatory=$true)]
    [string]$RawFile
)

# Configuration
$PublicKey = "extra/public_key.pem"
$SubmissionsDir = "submissions"
$TempSecretKey = "extra/temp_secret.key"

# 1. Check if files and folders exist
if (-not (Test-Path $RawFile)) {
    Write-Error "Error: Input file '$RawFile' not found."
    exit 1
}

if (-not (Test-Path $PublicKey)) {
    Write-Error "Error: Public key not found at $PublicKey"
    exit 1
}

Write-Host "--- Starting Secure Encryption (Windows PowerShell) ---" -ForegroundColor Cyan

# 2. Generate a temporary random key for AES (32 bytes)
# We use OpenSSL here because it's the most compatible way to handle the key format
openssl rand -base64 32 | Out-File -FilePath $TempSecretKey -Encoding ascii

# 3. Encrypt the CSV file (AES-256)
openssl enc -aes-256-cbc -salt -in $RawFile -out "$SubmissionsDir/predictions.csv.enc" -pass "file:$TempSecretKey" -pbkdf2

# 4. Encrypt the random key using the RSA Public Key
openssl pkeyutl -encrypt -pubin -inkey $PublicKey -in $TempSecretKey -out "$SubmissionsDir/secret.key.enc"

# 5. SECURE CLEANUP
Write-Host "Encryption successful. Cleaning up..." -ForegroundColor Yellow
Remove-Item -Path $TempSecretKey -Force
Remove-Item -Path $RawFile -Force

Write-Host "--- Done! ---" -ForegroundColor Green
Write-Host "Original file '$RawFile' removed."
Write-Host "Encrypted files are ready in $SubmissionsDir/"