---
name: automate-mait-reporting
description: When the user wants to automate their daily or weekly MAIT (Marketing Attribution and Investment Tracking) report. Use when the user says "MAIT report," "daily ad spend report," "marketing spend tracker," "pull ad spend," "compile marketing numbers," "attribution report," or "automate reporting." Pulls spend data from ad platforms (Meta/Facebook, Google, Pinterest, Twitter/X), order and discount code data from Shopify, and writes the compiled report to Google Sheets. For analytics setup, see analytics-tracking. For paid ads strategy, see paid-ads.
metadata:
  version: 1.0.0
---

# Automate MAIT Reporting

You are an expert in marketing attribution, ad platform APIs, and automated reporting. Your goal is to help the user set up fully automated daily MAIT (Marketing Attribution and Investment Tracking) reports that pull real data from ad platforms and e-commerce systems, then output a clean report to Google Sheets.

## Initial Assessment

**Check for product marketing context first:**
If `.agents/product-marketing-context.md` exists (or `.claude/product-marketing-context.md` in older setups), read it before asking questions. Use that context and only ask for information not already covered or specific to this task.

Before building the report, understand:

1. **Platforms in Use** - Which ad platforms are active? (Meta, Google Ads, Pinterest, Twitter/X, TikTok, LinkedIn)
2. **E-commerce Platform** - Shopify, WooCommerce, or other? Need order + discount code data?
3. **Attribution Model** - Last-click, first-click, or multi-touch?
4. **Report Cadence** - Daily, weekly, or both?
5. **Discount Code Taxonomy** - How are affiliate codes vs. ad codes differentiated? (e.g., naming convention, prefix)

---

## MAIT Report Structure

### Standard Columns

| Column | Source | Description |
|--------|--------|-------------|
| Date | All | Report date |
| Platform | All | Ad platform name |
| Campaign | Ad APIs | Campaign name or ID |
| Spend | Ad APIs | Total spend for the period |
| Impressions | Ad APIs | Total impressions |
| Clicks | Ad APIs | Total clicks |
| CTR | Calculated | Clicks / Impressions |
| CPC | Calculated | Spend / Clicks |
| Conversions | Ad APIs + Shopify | Platform-reported conversions |
| Revenue | Shopify | Attributed revenue from orders |
| ROAS | Calculated | Revenue / Spend |
| Orders (Ad Codes) | Shopify | Orders using ad discount codes |
| Orders (Affiliate Codes) | Shopify | Orders using affiliate discount codes |
| Orders (No Code) | Shopify | Orders with no discount code |

### Shopify Discount Code Classification

Orders are classified by their discount codes:

- **Ad Codes** - Codes tied to ad campaigns (e.g., prefix `AD-`, `FB-`, `GOOGLE-`, `PIN-`, `TW-`)
- **Affiliate Codes** - Codes tied to affiliate/referral partners (e.g., prefix `AFF-`, `REF-`, partner names)
- **No Code** - Organic orders with no discount applied

**Important**: Ask the user for their specific naming conventions. Common patterns:
- Platform prefix: `FB20OFF`, `GOOGLE15`, `PIN10`
- Affiliate name: `CREATOR-JANE`, `AFF-PARTNER1`
- Campaign-specific: `SPRING2026-FB`, `LAUNCH-GOOGLE`

---

## Data Collection Workflow

### Step 1: Pull Ad Spend from Each Platform

For each active platform, use the corresponding CLI tool to pull yesterday's (or target date's) spend data.

#### Meta/Facebook Ads

```bash
# Get account-level spend for a date range
node tools/clis/meta-ads.js campaigns insights \
  --id {campaign_id} \
  --date-preset yesterday

# Or pull all campaigns
node tools/clis/meta-ads.js campaigns list --account-id {account_id}
```

**Key fields**: `spend`, `impressions`, `clicks`, `actions` (conversions)

#### Google Ads

```bash
# Pull campaign performance
node tools/clis/google-ads.js campaigns performance \
  --customer-id {customer_id} \
  --start-date {YYYY-MM-DD} \
  --end-date {YYYY-MM-DD}
```

**Key fields**: `cost_micros` (divide by 1,000,000), `impressions`, `clicks`, `conversions`

#### Pinterest Ads

```bash
# Pull campaign analytics (auto-discovers all campaign IDs)
node tools/clis/pinterest-ads.js campaigns analytics \
  --ad-account-id 823877462990642660 \
  --start-date {YYYY-MM-DD} \
  --end-date {YYYY-MM-DD}
```

**Key fields**: `SPEND_IN_MICRO_DOLLAR` (divide by 1,000,000), `IMPRESSION`, `CLICKTHROUGH`, `TOTAL_CONVERSIONS`

**Account**: Heavenly Heat Saunas — Ad Account ID `823877462990642660`

#### Twitter/X Ads

```bash
# Pull campaign stats (auto-discovers all campaign IDs)
node tools/clis/twitter-ads.js campaigns stats \
  --account-id 2033881993977462785 \
  --start-time {YYYY-MM-DDT00:00:00Z} \
  --end-time {YYYY-MM-DDT23:59:59Z}
```

**Key fields**: `billed_charge_local_micro` (divide by 1,000,000), `impressions`, `clicks`, `conversion_purchases`

**Account**: Heavenly Heat Saunas — Ads Account ID `2033881993977462785`

### Step 2: Pull Shopify Orders

```bash
# Pull orders for the target date with discount code details
node tools/clis/shopify.js orders list \
  --created-at-min {YYYY-MM-DD}T00:00:00-00:00 \
  --created-at-max {YYYY-MM-DD}T23:59:59-00:00 \
  --status any \
  --fields id,name,total_price,discount_codes,created_at,referring_site
```

Then classify each order:
1. Extract `discount_codes` array from each order
2. Match code against ad code patterns → count as "Ad Code Order"
3. Match code against affiliate code patterns → count as "Affiliate Code Order"
4. No discount code → count as "No Code Order"

### Step 3: Write to Google Sheets

```bash
# Append a row to the MAIT spreadsheet
node tools/clis/google-sheets.js sheets append \
  --spreadsheet-id {spreadsheet_id} \
  --range "Daily Report!A:N" \
  --values '[["2026-03-16","Meta","Spring Campaign","1234.56","50000","1200","2.4%","$1.03","45","$8,901.23","7.21","12","8","25"]]'
```

---

## Automation Setup

### Option A: Scheduled CLI Script

Create a shell script that runs daily via cron or a scheduler:

```bash
#!/bin/bash
# mait-daily.sh - Run daily at 8:00 AM

DATE=$(date -d "yesterday" +%Y-%m-%d)

# Pull from each platform (campaign IDs auto-discovered)
META_DATA=$(node tools/clis/meta-ads.js campaigns insights --date-preset yesterday)
GOOGLE_DATA=$(node tools/clis/google-ads.js campaigns performance --start-date $DATE --end-date $DATE)
PINTEREST_DATA=$(node tools/clis/pinterest-ads.js campaigns analytics --ad-account-id 823877462990642660 --start-date $DATE --end-date $DATE)
TWITTER_DATA=$(node tools/clis/twitter-ads.js campaigns stats --account-id 2033881993977462785 --start-time ${DATE}T00:00:00Z --end-time ${DATE}T23:59:59Z)

# Pull Shopify orders
SHOPIFY_DATA=$(node tools/clis/shopify.js orders list --created-at-min ${DATE}T00:00:00-00:00 --created-at-max ${DATE}T23:59:59-00:00)

# Compile and push to Google Sheets
node tools/clis/mait-report.js compile \
  --date $DATE \
  --meta "$META_DATA" \
  --google "$GOOGLE_DATA" \
  --pinterest "$PINTEREST_DATA" \
  --twitter "$TWITTER_DATA" \
  --shopify "$SHOPIFY_DATA" \
  --spreadsheet-id {your_spreadsheet_id}
```

### Option B: Zapier Integration

Use Zapier to trigger the report daily:
1. Schedule trigger (daily at 8 AM)
2. Run each platform CLI as a Zapier Code step
3. Compile results
4. Write to Google Sheets via Zapier's native integration

See [zapier integration guide](../../tools/integrations/zapier.md) for setup.

---

## Environment Variables Required

| Variable | Platform | How to Get |
|----------|----------|------------|
| `META_ACCESS_TOKEN` | Meta/Facebook | Meta Business Suite → System User Token |
| `META_AD_ACCOUNT_ID` | Meta/Facebook | Meta Business Suite → Ad Account ID |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Google Ads | Google Ads API Center |
| `GOOGLE_ADS_ACCESS_TOKEN` | Google Ads | OAuth 2.0 flow |
| `GOOGLE_ADS_CUSTOMER_ID` | Google Ads | Google Ads account number (no dashes) |
| `PINTEREST_ACCESS_TOKEN` | Pinterest | Pinterest API app |
| `PINTEREST_AD_ACCOUNT_ID` | Pinterest | Pinterest Ads Manager |
| `TWITTER_ADS_ACCESS_TOKEN` | Twitter/X | Twitter Developer Portal |
| `TWITTER_ADS_ACCOUNT_ID` | Twitter/X | Twitter Ads Manager |
| `SHOPIFY_ACCESS_TOKEN` | Shopify | Shopify Admin → Custom App |
| `SHOPIFY_STORE` | Shopify | Your myshopify.com subdomain |
| `GOOGLE_SHEETS_ACCESS_TOKEN` | Google Sheets | Google Cloud Console → OAuth 2.0 |

---

## Error Handling

### Common Issues

| Issue | Resolution |
|-------|------------|
| API rate limit hit | Stagger requests with 2-second delays between platforms |
| Token expired | Refresh OAuth tokens; use long-lived tokens where possible |
| Missing spend data | Some platforms delay reporting by 24-48 hours; re-pull if needed |
| Discount code mismatch | Review Shopify discount code naming conventions with the user |
| Google Sheets quota | Batch writes; max 60 requests/minute |

### Data Validation

Before writing to the sheet, validate:
- Spend values are non-negative numbers
- Dates are in the expected format
- No duplicate rows for the same date/platform
- Totals reconcile (sum of platform spend ≈ total marketing spend)

---

## Output Format

The final Google Sheet should have:

### Tab 1: Daily Report
One row per platform per day with all standard columns.

### Tab 2: Summary
- **Daily Total Spend** across all platforms
- **Daily Total Revenue** from Shopify
- **Blended ROAS** (Total Revenue / Total Spend)
- **Order Breakdown** (Ad Code / Affiliate Code / No Code)

### Tab 3: Affiliate Analysis
- Orders grouped by affiliate discount code
- Revenue per affiliate
- Comparison to ad-driven orders

---

## Task-Specific Questions

1. Which ad platforms are you currently running? (Meta, Google, Pinterest, Twitter/X, others?)
2. What's your Shopify store URL?
3. How do you differentiate affiliate discount codes from ad discount codes?
4. Do you have API access set up for each platform, or do we need to configure that?
5. Where should the Google Sheet live? (existing sheet or create new?)
6. What time zone should the report use?
7. Do you want daily only, or also weekly/monthly rollups?

---

## Tool Integrations

For implementation, see the [tools registry](../../tools/REGISTRY.md). Key tools for MAIT:

| Tool | Purpose | Guide |
|------|---------|-------|
| **meta-ads** | Facebook/Instagram ad spend | [meta-ads.md](../../tools/integrations/meta-ads.md) |
| **google-ads** | Google Ads spend | [google-ads.md](../../tools/integrations/google-ads.md) |
| **pinterest-ads** | Pinterest ad spend | [pinterest-ads.md](../../tools/integrations/pinterest-ads.md) |
| **twitter-ads** | Twitter/X ad spend | [twitter-ads.md](../../tools/integrations/twitter-ads.md) |
| **shopify** | Order + discount code data | [shopify.md](../../tools/integrations/shopify.md) |
| **google-sheets** | Report output destination | [google-sheets.md](../../tools/integrations/google-sheets.md) |
| **mait-report** | Compile + write MAIT report | CLI orchestrator tool |

---

## Related Skills

- **analytics-tracking**: For setting up conversion tracking that feeds MAIT data
- **paid-ads**: For ad strategy and campaign management
- **referral-program**: For affiliate program setup and tracking
- **revops**: For revenue operations and pipeline metrics
