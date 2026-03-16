# Google Sheets

Spreadsheet platform for collaborative data, reporting, and dashboards.

## Capabilities

| Integration | Available | Notes |
|-------------|-----------|-------|
| API | ✓ | Sheets API v4 for read/write/create |
| MCP | - | Not available |
| CLI | ✓ | [google-sheets.js](../clis/google-sheets.js) |
| SDK | ✓ | Official Google APIs client libraries |

## Authentication

- **Type**: OAuth 2.0 Access Token
- **Header**: `Authorization: Bearer {access_token}`
- **Scopes**: `https://www.googleapis.com/auth/spreadsheets` (read/write) or `https://www.googleapis.com/auth/spreadsheets.readonly`
- **Setup**: Google Cloud Console → Enable Sheets API → Create OAuth 2.0 credentials

## Common Agent Operations

### Get spreadsheet metadata

```bash
GET https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}?fields=spreadsheetId,properties.title,sheets.properties

Authorization: Bearer {access_token}
```

### Read cell values

```bash
GET https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{range}

Authorization: Bearer {access_token}
```

Range examples: `Sheet1!A1:D10`, `Daily Report!A:N`, `Sheet1`

### Append rows

```bash
POST https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS

Authorization: Bearer {access_token}

{
  "values": [
    ["2026-03-16", "Meta", "$1,234.56", "50000"],
    ["2026-03-16", "Google", "$987.65", "32000"]
  ]
}
```

### Update cells

```bash
PUT https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{range}?valueInputOption=USER_ENTERED

Authorization: Bearer {access_token}

{
  "values": [
    ["Updated Value 1", "Updated Value 2"],
    ["Updated Value 3", "Updated Value 4"]
  ]
}
```

### Clear cells

```bash
POST https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{range}:clear

Authorization: Bearer {access_token}
```

### Create spreadsheet

```bash
POST https://sheets.googleapis.com/v4/spreadsheets

Authorization: Bearer {access_token}

{
  "properties": {
    "title": "MAIT Report 2026"
  },
  "sheets": [
    { "properties": { "title": "Daily Report" } },
    { "properties": { "title": "Summary" } },
    { "properties": { "title": "Affiliate Analysis" } }
  ]
}
```

## Value Input Options

| Option | Behavior |
|--------|----------|
| `RAW` | Values stored as-is (no parsing) |
| `USER_ENTERED` | Values parsed as if typed in UI (formulas, dates, numbers) |

## When to Use

- Automated reporting dashboards (MAIT, ad spend, revenue)
- Outputting structured data from CLI tools
- Collaborative marketing reports
- Data exports for team review

## Rate Limits

- 60 read requests per minute per user
- 60 write requests per minute per user
- 300 requests per minute per project
- Batch operations recommended for efficiency

## Relevant Skills

- automate-mait-reporting
- analytics-tracking
- revops
