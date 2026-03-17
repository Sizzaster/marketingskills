#!/usr/bin/env node

const TOKEN = process.env.TWITTER_ADS_ACCESS_TOKEN
const DEFAULT_ACCOUNT_ID = process.env.TWITTER_ADS_ACCOUNT_ID
const BASE_URL = 'https://ads-api.x.com/12'

if (!TOKEN) {
  console.error(JSON.stringify({ error: 'TWITTER_ADS_ACCESS_TOKEN environment variable required' }))
  process.exit(1)
}

async function api(method, path, body) {
  const url = `${BASE_URL}${path}`
  const opts = {
    method,
    headers: { 'Authorization': `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  }
  if (body) {
    opts.body = JSON.stringify(body)
  }
  if (args['dry-run']) {
    return { _dry_run: true, method, url, headers: { ...opts.headers, Authorization: '***' }, body: body || undefined }
  }
  const res = await fetch(url, opts)
  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    return { status: res.status, body: text }
  }
}

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
const [cmd, sub, ...rest] = args._

function getAccountId() {
  return args['account-id'] || DEFAULT_ACCOUNT_ID
}

async function main() {
  let result

  switch (cmd) {
    case 'accounts':
      switch (sub) {
        case 'list':
          result = await api('GET', '/accounts')
          break
        case 'get': {
          const accountId = getAccountId()
          if (!accountId) { result = { error: '--account-id required (or set TWITTER_ADS_ACCOUNT_ID)' }; break }
          result = await api('GET', `/accounts/${accountId}`)
          break
        }
        default:
          result = { error: 'Unknown accounts subcommand. Use: list, get' }
      }
      break

    case 'campaigns':
      switch (sub) {
        case 'list': {
          const accountId = getAccountId()
          if (!accountId) { result = { error: '--account-id required (or set TWITTER_ADS_ACCOUNT_ID)' }; break }
          result = await api('GET', `/accounts/${accountId}/campaigns`)
          break
        }
        case 'get': {
          const accountId = getAccountId()
          if (!accountId) { result = { error: '--account-id required (or set TWITTER_ADS_ACCOUNT_ID)' }; break }
          if (!args.id) { result = { error: '--id required' }; break }
          result = await api('GET', `/accounts/${accountId}/campaigns/${args.id}`)
          break
        }
        case 'stats': {
          const accountId = getAccountId()
          if (!accountId) { result = { error: '--account-id required (or set TWITTER_ADS_ACCOUNT_ID)' }; break }
          const startTime = args['start-time']
          const endTime = args['end-time']
          if (!startTime || !endTime) { result = { error: '--start-time and --end-time required (ISO 8601 format)' }; break }
          const granularity = args.granularity || 'DAY'
          const placement = args.placement || 'ALL_ON_TWITTER'
          let entityIds = args['campaign-ids'] || args.id
          if (!entityIds) {
            const campaigns = await api('GET', `/accounts/${accountId}/campaigns`)
            if (campaigns._dry_run) { result = campaigns; break }
            const items = (campaigns.data || [])
            if (items.length === 0) { result = { error: 'No campaigns found in this ad account' }; break }
            entityIds = items.map(c => c.id).join(',')
          }
          result = await api('GET', `/stats/accounts/${accountId}?entity=CAMPAIGN&entity_ids=${entityIds}&start_time=${encodeURIComponent(startTime)}&end_time=${encodeURIComponent(endTime)}&granularity=${granularity}&placement=${placement}&metric_groups=BILLING,ENGAGEMENT,MEDIA,WEB_CONVERSION`)
          break
        }
        case 'create': {
          const accountId = getAccountId()
          if (!accountId) { result = { error: '--account-id required (or set TWITTER_ADS_ACCOUNT_ID)' }; break }
          if (!args.name || !args['funding-instrument-id']) { result = { error: '--name and --funding-instrument-id required' }; break }
          result = await api('POST', `/accounts/${accountId}/campaigns`, {
            name: args.name,
            funding_instrument_id: args['funding-instrument-id'],
            status: args.status || 'PAUSED',
            daily_budget_amount_local_micro: args['daily-budget'] ? parseInt(args['daily-budget']) * 1000000 : undefined,
            start_time: args['start-time'] || undefined,
            end_time: args['end-time'] || undefined,
          })
          break
        }
        case 'update': {
          const accountId = getAccountId()
          if (!accountId) { result = { error: '--account-id required (or set TWITTER_ADS_ACCOUNT_ID)' }; break }
          if (!args.id) { result = { error: '--id required' }; break }
          const body = {}
          if (args.status) body.status = args.status
          if (args.name) body.name = args.name
          if (args['daily-budget']) body.daily_budget_amount_local_micro = parseInt(args['daily-budget']) * 1000000
          result = await api('PUT', `/accounts/${accountId}/campaigns/${args.id}`, body)
          break
        }
        default:
          result = { error: 'Unknown campaigns subcommand. Use: list, get, stats, create, update' }
      }
      break

    case 'line-items':
      switch (sub) {
        case 'list': {
          const accountId = getAccountId()
          if (!accountId) { result = { error: '--account-id required (or set TWITTER_ADS_ACCOUNT_ID)' }; break }
          const campaignId = args['campaign-id'] ? `?campaign_ids=${args['campaign-id']}` : ''
          result = await api('GET', `/accounts/${accountId}/line_items${campaignId}`)
          break
        }
        default:
          result = { error: 'Unknown line-items subcommand. Use: list' }
      }
      break

    case 'funding':
      switch (sub) {
        case 'list': {
          const accountId = getAccountId()
          if (!accountId) { result = { error: '--account-id required (or set TWITTER_ADS_ACCOUNT_ID)' }; break }
          result = await api('GET', `/accounts/${accountId}/funding_instruments`)
          break
        }
        default:
          result = { error: 'Unknown funding subcommand. Use: list' }
      }
      break

    default:
      result = {
        error: 'Unknown command',
        usage: {
          accounts: 'accounts [list|get] [--account-id <id>]',
          campaigns: 'campaigns [list|get|stats|create|update] [--account-id <id>] [--id <id>] [--campaign-ids <ids>] [--start-time ISO8601] [--end-time ISO8601] [--name <name>] [--status <status>] [--daily-budget <dollars>]',
          'line-items': 'line-items [list] [--account-id <id>] [--campaign-id <id>]',
          funding: 'funding [list] [--account-id <id>]',
        },
      }
  }

  console.log(JSON.stringify(result, null, 2))
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }))
  process.exit(1)
})
