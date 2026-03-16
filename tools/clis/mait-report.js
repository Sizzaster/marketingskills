#!/usr/bin/env node

const SHEETS_TOKEN = process.env.GOOGLE_SHEETS_ACCESS_TOKEN
const SHEETS_BASE = 'https://sheets.googleapis.com/v4/spreadsheets'

function parseArgs(argv) {
  const result = { _: [] }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith('--')) {
        result[key] = next
        i++
      } else {
        result[key] = true
      }
    } else {
      result._.push(arg)
    }
  }
  return result
}

const args = parseArgs(process.argv.slice(2))
const [cmd, ...rest] = args._

function parseJsonArg(value, name) {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch {
    console.error(JSON.stringify({ error: `Invalid JSON in --${name}` }))
    process.exit(1)
  }
}

function extractMetaSpend(data) {
  if (!data || !data.data) return []
  const rows = Array.isArray(data.data) ? data.data : [data.data]
  return rows.map(r => ({
    platform: 'Meta',
    campaign: r.campaign_name || r.campaign_id || 'All Campaigns',
    spend: parseFloat(r.spend || 0),
    impressions: parseInt(r.impressions || 0),
    clicks: parseInt(r.clicks || 0),
    conversions: Array.isArray(r.actions) ? r.actions.reduce((sum, a) => sum + parseInt(a.value || 0), 0) : 0,
  }))
}

function extractGoogleSpend(data) {
  if (!data || !data.results) return []
  return data.results.map(r => {
    const metrics = r.metrics || {}
    return {
      platform: 'Google',
      campaign: (r.campaign || {}).name || 'All Campaigns',
      spend: (parseInt(metrics.cost_micros || 0)) / 1000000,
      impressions: parseInt(metrics.impressions || 0),
      clicks: parseInt(metrics.clicks || 0),
      conversions: parseFloat(metrics.conversions || 0),
    }
  })
}

function extractPinterestSpend(data) {
  if (!data || !Array.isArray(data)) return []
  return data.map(r => ({
    platform: 'Pinterest',
    campaign: r.campaign_id || 'All Campaigns',
    spend: (parseInt(r.SPEND_IN_MICRO_DOLLAR || 0)) / 1000000,
    impressions: parseInt(r.IMPRESSION || 0),
    clicks: parseInt(r.CLICKTHROUGH || 0),
    conversions: parseInt(r.TOTAL_CONVERSIONS || 0),
  }))
}

function extractTwitterSpend(data) {
  if (!data || !data.data) return []
  const rows = Array.isArray(data.data) ? data.data : [data.data]
  return rows.map(r => {
    const metrics = r.id_data ? r.id_data[0]?.metrics : r.metrics || {}
    return {
      platform: 'Twitter/X',
      campaign: r.campaign_id || r.id || 'All Campaigns',
      spend: (parseInt((metrics.billed_charge_local_micro || [])[0] || 0)) / 1000000,
      impressions: parseInt((metrics.impressions || [])[0] || 0),
      clicks: parseInt((metrics.clicks || [])[0] || 0),
      conversions: parseInt((metrics.conversion_purchases || {}).total || 0),
    }
  })
}

function classifyOrders(orders, adPatterns, affiliatePatterns) {
  const adPrefixes = adPatterns || ['AD-', 'FB-', 'GOOGLE-', 'GOOG-', 'PIN-', 'TW-', 'TWITTER-', 'META-']
  const affPrefixes = affiliatePatterns || ['AFF-', 'REF-', 'AFFILIATE-', 'PARTNER-']

  let adOrders = 0, affiliateOrders = 0, noCodeOrders = 0
  let adRevenue = 0, affiliateRevenue = 0, noCodeRevenue = 0

  const orderList = Array.isArray(orders) ? orders : (orders.orders || [])

  for (const order of orderList) {
    const codes = order.discount_codes || []
    const price = parseFloat(order.total_price || 0)

    if (codes.length === 0) {
      noCodeOrders++
      noCodeRevenue += price
    } else {
      const codeStr = codes.map(c => (c.code || '').toUpperCase()).join(',')
      const isAd = adPrefixes.some(p => codeStr.includes(p.toUpperCase()))
      const isAffiliate = affPrefixes.some(p => codeStr.includes(p.toUpperCase()))

      if (isAd) {
        adOrders++
        adRevenue += price
      } else if (isAffiliate) {
        affiliateOrders++
        affiliateRevenue += price
      } else {
        noCodeOrders++
        noCodeRevenue += price
      }
    }
  }

  return {
    ad: { orders: adOrders, revenue: adRevenue },
    affiliate: { orders: affiliateOrders, revenue: affiliateRevenue },
    noCode: { orders: noCodeOrders, revenue: noCodeRevenue },
    total: { orders: adOrders + affiliateOrders + noCodeOrders, revenue: adRevenue + affiliateRevenue + noCodeRevenue },
  }
}

async function writeToSheets(spreadsheetId, rows) {
  if (!SHEETS_TOKEN) {
    return { warning: 'GOOGLE_SHEETS_ACCESS_TOKEN not set. Output to stdout only.', rows }
  }
  if (!spreadsheetId) {
    return { warning: '--spreadsheet-id not provided. Output to stdout only.', rows }
  }

  const url = `${SHEETS_BASE}/${spreadsheetId}/values/Daily Report!A:N:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`
  const opts = {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${SHEETS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ values: rows }),
  }

  if (args['dry-run']) {
    return { _dry_run: true, url, rows }
  }

  const res = await fetch(url, opts)
  const text = await res.text()
  try {
    return { sheets_response: JSON.parse(text), rows_written: rows.length }
  } catch {
    return { status: res.status, body: text }
  }
}

async function main() {
  let result

  switch (cmd) {
    case 'compile': {
      const date = args.date || new Date(Date.now() - 86400000).toISOString().split('T')[0]

      const metaData = parseJsonArg(args.meta, 'meta')
      const googleData = parseJsonArg(args.google, 'google')
      const pinterestData = parseJsonArg(args.pinterest, 'pinterest')
      const twitterData = parseJsonArg(args.twitter, 'twitter')
      const shopifyData = parseJsonArg(args.shopify, 'shopify')

      const allSpend = [
        ...extractMetaSpend(metaData),
        ...extractGoogleSpend(googleData),
        ...extractPinterestSpend(pinterestData),
        ...extractTwitterSpend(twitterData),
      ]

      const adPatterns = args['ad-patterns'] ? args['ad-patterns'].split(',') : undefined
      const affiliatePatterns = args['affiliate-patterns'] ? args['affiliate-patterns'].split(',') : undefined
      const orderClassification = shopifyData ? classifyOrders(shopifyData, adPatterns, affiliatePatterns) : null

      const totalRevenue = orderClassification ? orderClassification.total.revenue : 0
      const totalSpend = allSpend.reduce((sum, r) => sum + r.spend, 0)

      const rows = allSpend.map(r => {
        const ctr = r.impressions > 0 ? ((r.clicks / r.impressions) * 100).toFixed(2) + '%' : '0%'
        const cpc = r.clicks > 0 ? '$' + (r.spend / r.clicks).toFixed(2) : '$0.00'
        const platformRevShare = totalSpend > 0 ? (r.spend / totalSpend) * totalRevenue : 0
        const roas = r.spend > 0 ? (platformRevShare / r.spend).toFixed(2) : '0.00'

        return [
          date,
          r.platform,
          r.campaign,
          r.spend.toFixed(2),
          r.impressions.toString(),
          r.clicks.toString(),
          ctr,
          cpc,
          r.conversions.toString(),
          '$' + platformRevShare.toFixed(2),
          roas,
          orderClassification ? orderClassification.ad.orders.toString() : '0',
          orderClassification ? orderClassification.affiliate.orders.toString() : '0',
          orderClassification ? orderClassification.noCode.orders.toString() : '0',
        ]
      })

      const spreadsheetId = args['spreadsheet-id'] || process.env.GOOGLE_SHEETS_SPREADSHEET_ID
      const sheetsResult = await writeToSheets(spreadsheetId, rows)

      result = {
        date,
        platforms: allSpend.length,
        total_spend: '$' + totalSpend.toFixed(2),
        total_revenue: '$' + totalRevenue.toFixed(2),
        blended_roas: totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : 'N/A',
        order_classification: orderClassification,
        rows,
        sheets: sheetsResult,
      }
      break
    }

    case 'classify-orders': {
      const shopifyData = parseJsonArg(args.shopify, 'shopify')
      if (!shopifyData) { result = { error: '--shopify required (JSON orders data)' }; break }
      const adPatterns = args['ad-patterns'] ? args['ad-patterns'].split(',') : undefined
      const affiliatePatterns = args['affiliate-patterns'] ? args['affiliate-patterns'].split(',') : undefined
      result = classifyOrders(shopifyData, adPatterns, affiliatePatterns)
      break
    }

    default:
      result = {
        error: 'Unknown command',
        usage: {
          compile: 'compile --date YYYY-MM-DD [--meta <json>] [--google <json>] [--pinterest <json>] [--twitter <json>] [--shopify <json>] [--spreadsheet-id <id>] [--ad-patterns AD-,FB-] [--affiliate-patterns AFF-,REF-]',
          'classify-orders': 'classify-orders --shopify <json> [--ad-patterns AD-,FB-] [--affiliate-patterns AFF-,REF-]',
        },
        description: 'MAIT (Marketing Attribution and Investment Tracking) report compiler. Aggregates ad spend from multiple platforms, classifies Shopify orders by discount code type, and writes to Google Sheets.',
      }
  }

  console.log(JSON.stringify(result, null, 2))
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }))
  process.exit(1)
})
