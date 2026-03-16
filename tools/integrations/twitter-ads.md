# Twitter/X Ads

Advertising platform for promoted content on Twitter/X.

## Capabilities

| Integration | Available | Notes |
|-------------|-----------|-------|
| API | ✓ | Ads API v12 for campaigns, stats, audiences |
| MCP | - | Not available |
| CLI | ✓ | [twitter-ads.js](../clis/twitter-ads.js) |
| SDK | ✓ | Official Python SDK (twitter-ads) |

## Authentication

- **Type**: OAuth 2.0 Bearer Token
- **Header**: `Authorization: Bearer {access_token}`
- **Base URL**: `https://ads-api.x.com/12`
- **Setup**: Twitter Developer Portal → Ads API access → Generate bearer token

## Common Agent Operations

### List ad accounts

```bash
GET https://ads-api.x.com/12/accounts

Authorization: Bearer {access_token}
```

### List campaigns

```bash
GET https://ads-api.x.com/12/accounts/{account_id}/campaigns

Authorization: Bearer {access_token}
```

### Get campaign stats

```bash
GET https://ads-api.x.com/12/stats/accounts/{account_id}?entity=CAMPAIGN&entity_ids={campaign_id}&start_time=2026-03-15T00:00:00Z&end_time=2026-03-15T23:59:59Z&granularity=DAY&placement=ALL_ON_TWITTER&metric_groups=BILLING,ENGAGEMENT,MEDIA,WEB_CONVERSION

Authorization: Bearer {access_token}
```

### Create campaign

```bash
POST https://ads-api.x.com/12/accounts/{account_id}/campaigns

Authorization: Bearer {access_token}

{
  "name": "Spring 2026 Campaign",
  "funding_instrument_id": "{funding_id}",
  "status": "PAUSED",
  "daily_budget_amount_local_micro": 50000000,
  "start_time": "2026-03-16T00:00:00Z"
}
```

### Update campaign

```bash
PUT https://ads-api.x.com/12/accounts/{account_id}/campaigns/{campaign_id}

Authorization: Bearer {access_token}

{
  "status": "ACTIVE"
}
```

### List line items

```bash
GET https://ads-api.x.com/12/accounts/{account_id}/line_items?campaign_ids={campaign_id}

Authorization: Bearer {access_token}
```

### List funding instruments

```bash
GET https://ads-api.x.com/12/accounts/{account_id}/funding_instruments

Authorization: Bearer {access_token}
```

## Key Metrics

| Metric | Metric Group | Description |
|--------|-------------|-------------|
| `billed_charge_local_micro` | BILLING | Amount billed (÷ 1,000,000 for dollars) |
| `impressions` | ENGAGEMENT | Ad impressions |
| `clicks` | ENGAGEMENT | All clicks |
| `url_clicks` | ENGAGEMENT | Link clicks |
| `engagements` | ENGAGEMENT | Total engagements |
| `follows` | ENGAGEMENT | Follow actions |
| `retweets` | ENGAGEMENT | Retweets/reposts |
| `likes` | ENGAGEMENT | Likes |
| `replies` | ENGAGEMENT | Replies |
| `conversion_purchases` | WEB_CONVERSION | Purchase conversions |
| `conversion_sign_ups` | WEB_CONVERSION | Signup conversions |

## Campaign Objectives

- `AWARENESS` - Reach
- `TWEET_ENGAGEMENTS` - Engagement
- `VIDEO_VIEWS` - Video views
- `WEBSITE_CLICKS` - Traffic
- `WEBSITE_CONVERSIONS` - Conversions
- `APP_INSTALLS` - App installs
- `FOLLOWERS` - Follower growth

## When to Use

- Promoted tweets and conversation ads
- Video campaign management
- Audience targeting on Twitter/X
- Campaign performance analysis
- MAIT report ad spend tracking

## Rate Limits

- 300 requests per 15 minutes per endpoint
- Stats endpoints: 100 requests per 15 minutes
- Use granularity=DAY for efficient data pulls

## Relevant Skills

- paid-ads
- ad-creative
- social-content
- automate-mait-reporting
- analytics-tracking
