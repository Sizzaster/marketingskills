# Pinterest Ads

Advertising platform for visual discovery and shopping on Pinterest.

## Capabilities

| Integration | Available | Notes |
|-------------|-----------|-------|
| API | ✓ | Pinterest API v5 for campaigns, analytics, audiences |
| MCP | - | Not available |
| CLI | ✓ | [pinterest-ads.js](../clis/pinterest-ads.js) |
| SDK | ✓ | Official Python SDK |

## Authentication

- **Type**: OAuth 2.0 Access Token
- **Header**: `Authorization: Bearer {access_token}`
- **Base URL**: `https://api.pinterest.com/v5`
- **Setup**: Pinterest Developer Portal → Create app → Generate access token

## Common Agent Operations

### Get ad accounts

```bash
GET https://api.pinterest.com/v5/ad_accounts

Authorization: Bearer {access_token}
```

### List campaigns

```bash
GET https://api.pinterest.com/v5/ad_accounts/{ad_account_id}/campaigns

Authorization: Bearer {access_token}
```

### Get campaign analytics

```bash
GET https://api.pinterest.com/v5/ad_accounts/{ad_account_id}/campaigns/analytics?start_date=2026-03-15&end_date=2026-03-15&columns=SPEND_IN_MICRO_DOLLAR,IMPRESSION,CLICKTHROUGH,TOTAL_CONVERSIONS,TOTAL_CONVERSIONS_VALUE_IN_MICRO_DOLLAR&granularity=DAY

Authorization: Bearer {access_token}
```

### Get ad group analytics

```bash
GET https://api.pinterest.com/v5/ad_accounts/{ad_account_id}/ad_groups/analytics?start_date=2026-03-15&end_date=2026-03-15&columns=SPEND_IN_MICRO_DOLLAR,IMPRESSION,CLICKTHROUGH&granularity=DAY

Authorization: Bearer {access_token}
```

### Create campaign

```bash
POST https://api.pinterest.com/v5/ad_accounts/{ad_account_id}/campaigns

Authorization: Bearer {access_token}

[{
  "name": "Spring 2026 Campaign",
  "status": "PAUSED",
  "objective_type": "AWARENESS",
  "daily_spend_cap": 50000000
}]
```

### Update campaign status

```bash
PATCH https://api.pinterest.com/v5/ad_accounts/{ad_account_id}/campaigns

Authorization: Bearer {access_token}

[{
  "id": "{campaign_id}",
  "status": "ACTIVE"
}]
```

## Key Metrics

| Metric | Description | Notes |
|--------|-------------|-------|
| `SPEND_IN_MICRO_DOLLAR` | Amount spent | Divide by 1,000,000 for dollars |
| `IMPRESSION` | Ad impressions | Total views |
| `CLICKTHROUGH` | Link clicks | Clicks to destination |
| `PIN_CLICK` | Pin engagement clicks | Clicks on pin |
| `TOTAL_CONVERSIONS` | All conversions | Requires Pinterest tag |
| `TOTAL_CONVERSIONS_VALUE_IN_MICRO_DOLLAR` | Conversion value | Divide by 1,000,000 |
| `OUTBOUND_CLICK` | Outbound clicks | Clicks leaving Pinterest |

## Campaign Objectives

- `AWARENESS` - Brand awareness
- `CONSIDERATION` - Traffic
- `VIDEO_VIEW` - Video views
- `CONVERSIONS` - Website conversions
- `CATALOG_SALES` - Shopping/catalog
- `SHOPPING` - Shopping ads

## When to Use

- Visual product advertising
- Shopping and catalog campaigns
- Brand awareness for visual brands
- Driving traffic from discovery feeds
- MAIT report ad spend tracking

## Rate Limits

- 1,000 requests per minute per app
- 200 write requests per minute
- Use analytics endpoints for batch data

## Relevant Skills

- paid-ads
- ad-creative
- automate-mait-reporting
- analytics-tracking
