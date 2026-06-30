#!/bin/bash
# Migrate images from B2 to GitHub
# Run after B2 cap resets (midnight UTC)
# Usage: B2_KEY_ID=xxx B2_APP_KEY=xxx B2_BUCKET_NAME=xxx GITHUB_TOKEN=xxx bash migrate-b2-to-github.sh

set -e

B2_BUCKET_NAME="${B2_BUCKET_NAME:?Set B2_BUCKET_NAME}"
GITHUB_OWNER="${GITHUB_OWNER:-MyLhassane}"
GITHUB_REPO="${GITHUB_REPO:-fifa2026-images}"
GITHUB_TOKEN="${GITHUB_TOKEN:?Set GITHUB_TOKEN}"

echo "=== B2 Auth ==="
B2_AUTH=$(curl -s -u "${B2_KEY_ID}:${B2_APP_KEY}" "https://api.backblazeb2.com/b2api/v2/b2_authorize_account")
API_URL=$(echo "$B2_AUTH" | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).apiUrl")
AUTH_TOKEN=$(echo "$B2_AUTH" | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).authorizationToken")
DOWNLOAD_URL=$(echo "$B2_AUTH" | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).downloadUrl")
echo "API URL: $API_URL"

echo "=== List files ==="
FILES=$(curl -s -X POST "${API_URL}/b2api/v2/b2_list_file_names" \
  -H "Authorization: $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"bucketId\": \"$(curl -s -X POST "${API_URL}/b2api/v2/b2_list_buckets" -H "Authorization: $AUTH_TOKEN" -H "Content-Type: application/json" -d '{}' | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).buckets[0].bucketId")\", \"maxFileCount\": 10000}")

COUNT=$(echo "$FILES" | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).files.length")
echo "Found $COUNT files"

echo "$FILES" | node -pe "
const data = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
data.files.map(f => f.fileName).join('\n')
" > /tmp/b2-file-list.txt

SUCCESS=0
FAIL=0

while IFS= read -r FILE_NAME; do
  [ -z "$FILE_NAME" ] && continue
  
  echo -n "Downloading: $FILE_NAME ... "
  
  # Download from B2
  HTTP_CODE=$(curl -s -o "/tmp/b2-file-$(basename "$FILE_NAME")" -w "%{http_code}" \
    "${DOWNLOAD_URL}/file/${B2_BUCKET_NAME}/${FILE_NAME}" \
    -H "Authorization: $AUTH_TOKEN")
  
  if [ "$HTTP_CODE" != "200" ]; then
    echo "FAILED (HTTP $HTTP_CODE)"
    FAIL=$((FAIL + 1))
    continue
  fi
  
  # Base64 encode
  B64=$(base64 < "/tmp/b2-file-$(basename "$FILE_NAME")" | tr -d '\n')
  
  # Upload to GitHub
  RESULT=$(curl -s -X PUT "https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${FILE_NAME}" \
    -H "Authorization: Bearer $GITHUB_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"message\": \"Migrate from B2: ${FILE_NAME}\", \"content\": \"${B64}\"}")
  
  if echo "$RESULT" | grep -q '"sha"'; then
    echo "OK"
    SUCCESS=$((SUCCESS + 1))
  else
    echo "FAILED: $(echo "$RESULT" | node -pe "JSON.parse(require('fs').readFileSync('/dev/stdin','utf8')).message || 'unknown error'" 2>/dev/null || echo "$RESULT")"
    FAIL=$((FAIL + 1))
  fi
  
  rm -f "/tmp/b2-file-$(basename "$FILE_NAME")"
  
  # Rate limit: GitHub allows ~5000 requests/hour
  sleep 0.5
  
done < /tmp/b2-file-list.txt

echo ""
echo "=== Migration complete ==="
echo "Success: $SUCCESS"
echo "Failed: $FAIL"
