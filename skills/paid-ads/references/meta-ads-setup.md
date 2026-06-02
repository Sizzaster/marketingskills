# Meta Ads CLI Setup Guide

Step-by-step guide to get your Meta (Facebook/Instagram) access token and start using the `meta-ads.js` CLI tool.

## Step 1: Create a Meta App

1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Click **My Apps** (top right) and sign in
3. Click **Create App**
4. Select **Other** as the use case, then **Business** as the app type
5. Name your app (e.g., "My Ads Reporter") and click **Create**

## Step 2: Add the Marketing API

1. In your app dashboard, click **Add Products** in the left sidebar
2. Find **Marketing API** and click **Set Up**
3. This gives your app access to ad account data

## Step 3: Generate Your Access Token

### Option A: Short-Lived Token (Quick Start - Expires in ~1 Hour)

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from the dropdown
3. Click **Generate Access Token**
4. Grant the required permissions:
   - `ads_management`
   - `ads_read`
   - `business_management`
5. Copy the token

### Option B: Long-Lived Token (Recommended - Lasts ~60 Days)

1. Get a short-lived token from Option A
2. Go to [Access Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/)
3. Paste your token and click **Debug**
4. Click **Extend Access Token** at the bottom
5. Copy the new long-lived token

### Option C: System User Token (Best for Automation - Never Expires)

1. Go to [Meta Business Suite](https://business.facebook.com/) > **Settings**
2. Navigate to **Users** > **System Users**
3. Click **Add** to create a system user (select **Admin** role)
4. Click **Generate New Token**
5. Select your app and grant these permissions:
   - `ads_management`
   - `ads_read`
   - `business_management`
6. Copy the token (it won't expire)

## Step 4: Find Your Ad Account ID

1. Go to [Meta Ads Manager](https://adsmanager.facebook.com/)
2. Your account ID is in the URL: `act_XXXXXXXXX`
3. You only need the numbers (without `act_`)

Or use the CLI itself after setting up your token:

```bash
META_ACCESS_TOKEN=your_token_here node tools/clis/meta-ads.js accounts list
```

## Step 5: Set Environment Variables

### macOS / Linux

Add to your `~/.zshrc` or `~/.bashrc`:

```bash
export META_ACCESS_TOKEN="your_token_here"
export META_AD_ACCOUNT_ID="your_account_id_numbers"
```

Then reload:

```bash
source ~/.zshrc  # or source ~/.bashrc
```

### Windows (PowerShell)

```powershell
$env:META_ACCESS_TOKEN = "your_token_here"
$env:META_AD_ACCOUNT_ID = "your_account_id_numbers"
```

To make it permanent, add to your PowerShell profile or set via System Settings > Environment Variables.

## Step 6: Test It

Run these commands in the `marketingskills/` directory:

```bash
# Verify syntax
node --check tools/clis/meta-ads.js

# Preview a request (no actual API call)
node tools/clis/meta-ads.js campaigns list --dry-run

# List your campaigns (live call)
node tools/clis/meta-ads.js campaigns list

# Get insights for a campaign
node tools/clis/meta-ads.js campaigns insights --id CAMPAIGN_ID

# List ad sets
node tools/clis/meta-ads.js adsets list

# List audiences
node tools/clis/meta-ads.js audiences list
```

## CLI Quick Reference

| Command | What it does |
|---------|-------------|
| `accounts list` | List all ad accounts you have access to |
| `campaigns list` | List campaigns in your ad account |
| `campaigns insights --id ID` | Get performance metrics for a campaign |
| `campaigns create --name "Name" --objective SALES` | Create a new campaign (starts paused) |
| `campaigns update --id ID --status ACTIVE` | Activate/pause a campaign |
| `adsets list` | List ad sets |
| `ads list --adset-id ID` | List ads in an ad set |
| `audiences list` | List custom audiences |
| `audiences create-lookalike --source-id ID --country US` | Create a lookalike audience |

Add `--dry-run` to any command to preview the API request without sending it.

## Troubleshooting

| Error | Fix |
|-------|-----|
| `META_ACCESS_TOKEN environment variable required` | Set the env var (see Step 5) |
| `OAuthException` / `Invalid OAuth access token` | Token expired - generate a new one |
| `(#2635) You are calling a deprecated version` | Update API version in the script |
| `--account-id required` | Set `META_AD_ACCOUNT_ID` env var or pass `--account-id` |
| `Error validating access token` | Check permissions (Step 3) and regenerate |
