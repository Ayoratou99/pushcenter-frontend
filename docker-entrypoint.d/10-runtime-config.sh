#!/bin/sh
# Regenerate the runtime configuration read by the SPA on boot.
set -e

CONFIG_FILE="/usr/share/nginx/html/config.js"

cat > "$CONFIG_FILE" <<EOF
window.__APP_CONFIG__ = {
  API_BASE_URL: "${VITE_API_BASE_URL:-http://localhost:8000/api/v1}",
  API_DOCS_URL: "${VITE_API_DOCS_URL:-}",
  API_TIMEOUT: "${VITE_API_TIMEOUT:-30000}",
  APP_NAME: "${VITE_APP_NAME:-AninfPush Management}",
  APP_VERSION: "${VITE_APP_VERSION:-1.0.0}",
  FACEBOOK_APP_ID: "${VITE_FACEBOOK_APP_ID:-}"
};
EOF

echo "Runtime config written to $CONFIG_FILE (API: ${VITE_API_BASE_URL:-http://localhost:8000/api/v1})"
