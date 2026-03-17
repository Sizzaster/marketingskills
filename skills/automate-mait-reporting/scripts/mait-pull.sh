#!/bin/bash
# mait-pull.sh — Pull ad spend from all platforms and write to Google Sheets
#
# Usage:
#   ./mait-pull.sh                          # Yesterday's data
#   ./mait-pull.sh 2026-02-01 2026-02-28    # Date range (e.g., all of February)
#   ./mait-pull.sh 2026-03-16               # Specific single day
#
# Required env vars:
#   PINTEREST_ACCESS_TOKEN
#   TWITTER_ADS_ACCESS_TOKEN
#   GOOGLE_SHEETS_ACCESS_TOKEN  (optional — outputs to stdout if not set)
#   GOOGLE_SHEETS_SPREADSHEET_ID (optional — or pass --spreadsheet-id)
#
# Optional env vars:
#   META_ACCESS_TOKEN, META_AD_ACCOUNT_ID
#   GOOGLE_ADS_DEVELOPER_TOKEN, GOOGLE_ADS_ACCESS_TOKEN, GOOGLE_ADS_CUSTOMER_ID
#   SHOPIFY_ACCESS_TOKEN, SHOPIFY_STORE

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

# Date handling
if [ $# -ge 2 ]; then
  START_DATE="$1"
  END_DATE="$2"
elif [ $# -eq 1 ]; then
  START_DATE="$1"
  END_DATE="$1"
else
  # Default to yesterday
  if [[ "$OSTYPE" == "darwin"* ]]; then
    START_DATE=$(date -v-1d +%Y-%m-%d)
  else
    START_DATE=$(date -d "yesterday" +%Y-%m-%d)
  fi
  END_DATE="$START_DATE"
fi

echo "=== MAIT Report: $START_DATE to $END_DATE ==="
echo ""

# --- Pinterest ---
PINTEREST_DATA="{}"
if [ -n "${PINTEREST_ACCESS_TOKEN:-}" ]; then
  echo "Pulling Pinterest Ads..."
  PINTEREST_DATA=$(node "$REPO_DIR/tools/clis/pinterest-ads.js" campaigns analytics \
    --ad-account-id 823877462990642660 \
    --start-date "$START_DATE" \
    --end-date "$END_DATE" 2>/dev/null) || PINTEREST_DATA="{}"
  echo "  Done."
else
  echo "  Skipped Pinterest (PINTEREST_ACCESS_TOKEN not set)"
fi

# --- Twitter/X ---
TWITTER_DATA="{}"
if [ -n "${TWITTER_ADS_ACCESS_TOKEN:-}" ]; then
  echo "Pulling Twitter/X Ads..."
  TWITTER_DATA=$(node "$REPO_DIR/tools/clis/twitter-ads.js" campaigns stats \
    --account-id 2033881993977462785 \
    --start-time "${START_DATE}T00:00:00Z" \
    --end-time "${END_DATE}T23:59:59Z" 2>/dev/null) || TWITTER_DATA="{}"
  echo "  Done."
else
  echo "  Skipped Twitter/X (TWITTER_ADS_ACCESS_TOKEN not set)"
fi

# --- Meta (if configured) ---
META_DATA="{}"
if [ -n "${META_ACCESS_TOKEN:-}" ]; then
  echo "Pulling Meta Ads..."
  META_DATA=$(node "$REPO_DIR/tools/clis/meta-ads.js" campaigns insights \
    --date-preset yesterday 2>/dev/null) || META_DATA="{}"
  echo "  Done."
else
  echo "  Skipped Meta (META_ACCESS_TOKEN not set)"
fi

# --- Google Ads (if configured) ---
GOOGLE_DATA="{}"
if [ -n "${GOOGLE_ADS_ACCESS_TOKEN:-}" ]; then
  echo "Pulling Google Ads..."
  GOOGLE_DATA=$(node "$REPO_DIR/tools/clis/google-ads.js" campaigns performance \
    --start-date "$START_DATE" --end-date "$END_DATE" 2>/dev/null) || GOOGLE_DATA="{}"
  echo "  Done."
else
  echo "  Skipped Google Ads (GOOGLE_ADS_ACCESS_TOKEN not set)"
fi

# --- Shopify (if configured) ---
SHOPIFY_DATA="{}"
if [ -n "${SHOPIFY_ACCESS_TOKEN:-}" ]; then
  echo "Pulling Shopify orders..."
  SHOPIFY_DATA=$(node "$REPO_DIR/tools/clis/shopify.js" orders list \
    --created-at-min "${START_DATE}T00:00:00-00:00" \
    --created-at-max "${END_DATE}T23:59:59-00:00" \
    --status any \
    --fields id,name,total_price,discount_codes,created_at,referring_site 2>/dev/null) || SHOPIFY_DATA="{}"
  echo "  Done."
else
  echo "  Skipped Shopify (SHOPIFY_ACCESS_TOKEN not set)"
fi

echo ""
echo "Compiling MAIT report..."

# Compile everything
node "$REPO_DIR/tools/clis/mait-report.js" compile \
  --date "$START_DATE" \
  --meta "$META_DATA" \
  --google "$GOOGLE_DATA" \
  --pinterest "$PINTEREST_DATA" \
  --twitter "$TWITTER_DATA" \
  --shopify "$SHOPIFY_DATA" \
  ${GOOGLE_SHEETS_SPREADSHEET_ID:+--spreadsheet-id "$GOOGLE_SHEETS_SPREADSHEET_ID"}

echo ""
echo "=== MAIT Report Complete ==="
