#!/bin/bash

# Paths relative to the repository root
PUBLIC_KEY="extra/public_key.pem"
SUBMISSIONS_DIR="submissions"
RAW_FILE=$1

# 1. Check if input file was provided
if [ -z "$RAW_FILE" ]; then
    echo "Usage: bash extra/encrypt.sh submissions/predictions.csv"
    exit 1
fi

# 2. Verify files and folders exist
if [ ! -f "$PUBLIC_KEY" ]; then
    echo "Error: Public key not found at $PUBLIC_KEY"
    exit 1
fi

if [ ! -d "$SUBMISSIONS_DIR" ]; then
    echo "Error: Directory $SUBMISSIONS_DIR not found"
    exit 1
fi

echo "--- Starting Secure Encryption ---"

# 3. Generate a temporary random key for AES
openssl rand -base64 32 > extra/temp_secret.key

# 4. Encrypt the CSV file (AES-256)
# Output goes directly into the submissions/ folder
openssl enc -aes-256-cbc -salt -in "$RAW_FILE" -out "$SUBMISSIONS_DIR/submission.csv.enc" -pass file:extra/temp_secret.key -pbkdf2

# 5. Encrypt the random key using the RSA Public Key
openssl pkeyutl -encrypt -pubin -inkey "$PUBLIC_KEY" -in extra/temp_secret.key -out "$SUBMISSIONS_DIR/secret.key.enc"

# 6. SECURE CLEANUP
echo "Encryption successful. Cleaning up..."
rm -f extra/temp_secret.key
rm -f "$RAW_FILE"

echo "--- Done! ---"
echo "Original file $RAW_FILE removed."
