#!/usr/bin/env node

const TOKEN = process.env.PINTEREST_ACCESS_TOKEN
const DEFAULT_ACCOUNT_ID = process.env.PINTEREST_AD_ACCOUNT_ID
const BASE_URL = 'https://api.pinterest.com/v5'

if (!TOKEN) {
  console.error(JSON.stringify({ error: 'PINTEREST_ACCESS_TOKEN environment variable required' }))
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
  return args['ad-account-id'] || DEFAULT_ACCOUNT_ID
}

async function main() {
  let result

  switch (cmd) {
    case 'accounts':
      switch (sub) {
        case 'list':
          result = await api('GET', '/ad_accounts')
          break
        default:
          result = { error: 'Unknown accounts subcommand. Use: list' }
      }
      break

    case 'campaigns':
      switch (sub) {
        case 'list': {
          const accountId = getAccountId()
          if (!accountId) { result = { error: '--ad-account-id required (or set PINTEREST_AD_ACCOUNT_ID)' }; break }
          result = await api('GET', `/ad_accounts/${accountId}/campaigns`)
          break
        }
        case 'get': {
          const accountId = getAccountId()
          if (!accountId) { result = { error: '--ad-account-id required (or set PINTEREST_AD_ACCOUNT_ID)' }; break }
          if (!args.id) { result = { error: '--id required' }; break }
          result = await api('GET', `/ad_accounts/${accountId}/campaigns/${args.id}`)
          break
        }
        case 'analytics': {
          const accountId = getAccountId()
          if (!accountId) { result = { error: '--ad-account-id required (or set PINTEREST_AD_ACCOUNT_ID)' }; break }
          const startDate = args['start-date']
          const endDate = args['end-date'] || args['start-date']
          if (!startDate) { result = { error: '--start-date required (YYYY-MM-DD)' }; break }
          const columns = args.columns || 'SPEND_IN_MICRO_DOLLAR,IMPRESSION,CLICKTHROUGH,TOTAL_CONVERSIONS,TOTAL_CONVERSIONS_VALUE_IN_MICRO_DOLLAR'
          const granularity = args.granularity || 'DAY'
          let campaignIds = args['campaign-ids']
          if (!campaignIds) {
            const campaigns = await api('GET', `/ad_accounts/${accountId}/campaigns`)
            if (campaigns._dry_run) { result = campaigns; break }
            const items = campaigns.items || []
            if (items.length === 0) { result = { error: 'No campaigns found in this ad account' }; break }
            campaignIds = items.map(c => c.id).join(',')
          }
          result = await api('GET', `/ad_accounts/${accountId}/campaigns/analytics?campaign_ids=${campaignIds}&start_date=${startDate}&end_date=${endDate}&columns=${columns}&granularity=${granularity}`)
          break
        }
        case 'create': {
          const accountId = getAccountId()
          if (!accountId) { result = { error: '--ad-account-id required (or set PINTEREST_AD_ACCOUNT_ID)' }; break }
          if (!args.name) { result = { error: '--name required' }; break }
          result = await api('POST', `/ad_accounts/${accountId}/campaigns`, [{
            name: args.name,
            status: args.status || 'PAUSED',
            objective_type: args.objective || 'AWARENESS',
            daily_spend_cap: args['daily-budget'] ? parseInt(args['daily-budget']) * 1000000 : undefined,
          }])
          break
        }
        case 'update': {
          const accountId = getAccountId()
          if (!accountId) { result = { error: '--ad-account-id required (or set PINTEREST_AD_ACCOUNT_ID)' }; break }
          if (!args.id || !args.status) { result = { error: '--id and --status required' }; break }
          result = await api('PATCH', `/ad_accounts/${accountId}/campaigns`, [{ id: args.id, status: args.status }])
          break
        }
        default:
          result = { error: 'Unknown campaigns subcommand. Use: list, get, analytics, create, update' }
      }
      break

    case 'adgroups':
      switch (sub) {
        case 'list': {
          const accountId = getAccountId()
          if (!accountId) { result = { error: '--ad-account-id required (or set PINTEREST_AD_ACCOUNT_ID)' }; break }
          result = await api('GET', `/ad_accounts/${accountId}/ad_groups`)
          break
        }
        case 'analytics': {
          const accountId = getAccountId()
          if (!accountId) { result = { error: '--ad-account-id required (or set PINTEREST_AD_ACCOUNT_ID)' }; break }
          const startDate = args['start-date']
          const endDate = args['end-date'] || args['start-date']
          if (!startDate) { result = { error: '--start-date required (YYYY-MM-DD)' }; break }
          const columns = args.columns || 'SPEND_IN_MICRO_DOLLAR,IMPRESSION,CLICKTHROUGH,TOTAL_CONVERSIONS'
          const granularity = args.granularity || 'DAY'
          result = await api('GET', `/ad_accounts/${accountId}/ad_groups/analytics?start_date=${startDate}&end_date=${endDate}&columns=${columns}&granularity=${granularity}`)
          break
        }
        default:
          result = { error: 'Unknown adgroups subcommand. Use: list, analytics' }
      }
      break

    case 'pins':
      switch (sub) {
        case 'analytics': {
          const accountId = getAccountId()
          if (!accountId) { result = { error: '--ad-account-id required (or set PINTEREST_AD_ACCOUNT_ID)' }; break }
          const startDate = args['start-date']
          const endDate = args['end-date'] || args['start-date']
          if (!startDate) { result = { error: '--start-date required (YYYY-MM-DD)' }; break }
          const columns = args.columns || 'SPEND_IN_MICRO_DOLLAR,IMPRESSION,CLICKTHROUGH,PIN_CLICK'
          const granularity = args.granularity || 'DAY'
          result = await api('GET', `/ad_accounts/${accountId}/ads/analytics?start_date=${startDate}&end_date=${endDate}&columns=${columns}&granularity=${granularity}`)
          break
        }
        default:
          result = { error: 'Unknown pins subcommand. Use: analytics' }
      }
      break

    default:
      result = {
        error: 'Unknown command',
        usage: {
          accounts: 'accounts [list]',
          campaigns: 'campaigns [list|get|analytics|create|update] [--ad-account-id <id>] [--id <id>] [--start-date YYYY-MM-DD] [--end-date YYYY-MM-DD] [--name <name>] [--objective <type>] [--status <status>]',
          adgroups: 'adgroups [list|analytics] [--ad-account-id <id>] [--start-date YYYY-MM-DD] [--end-date YYYY-MM-DD]',
          pins: 'pins [analytics] [--ad-account-id <id>] [--start-date YYYY-MM-DD] [--end-date YYYY-MM-DD]',
        },
      }
  }

  console.log(JSON.stringify(result, null, 2))
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }))
  process.exit(1)
})
