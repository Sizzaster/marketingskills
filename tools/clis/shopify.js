#!/usr/bin/env node

const TOKEN = process.env.SHOPIFY_ACCESS_TOKEN
const STORE = process.env.SHOPIFY_STORE

if (!TOKEN || !STORE) {
  console.error(JSON.stringify({ error: 'SHOPIFY_ACCESS_TOKEN and SHOPIFY_STORE environment variables required' }))
  process.exit(1)
}

const BASE_URL = `https://${STORE}.myshopify.com/admin/api/2024-01`

async function api(method, path, body) {
  const url = `${BASE_URL}${path}`
  const opts = {
    method,
    headers: { 'X-Shopify-Access-Token': TOKEN, 'Content-Type': 'application/json' },
  }
  if (body) {
    opts.body = JSON.stringify(body)
  }
  if (args['dry-run']) {
    return { _dry_run: true, method, url, headers: { ...opts.headers, 'X-Shopify-Access-Token': '***' }, body: body || undefined }
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

async function fetchAllPages(path) {
  let allItems = []
  let url = path
  while (url) {
    const data = await api('GET', url)
    if (data._dry_run) return data
    const key = Object.keys(data).find(k => Array.isArray(data[k]))
    if (key) {
      allItems = allItems.concat(data[key])
    }
    url = null
    if (data._pagination && data._pagination.next) {
      url = data._pagination.next
    }
  }
  return allItems
}

async function main() {
  let result

  switch (cmd) {
    case 'shop':
      switch (sub) {
        case 'info':
          result = await api('GET', '/shop.json')
          break
        default:
          result = { error: 'Unknown shop subcommand. Use: info' }
      }
      break

    case 'orders':
      switch (sub) {
        case 'list': {
          const params = []
          if (args.status) params.push(`status=${args.status}`)
          if (args.limit) params.push(`limit=${args.limit}`)
          if (args['created-at-min']) params.push(`created_at_min=${encodeURIComponent(args['created-at-min'])}`)
          if (args['created-at-max']) params.push(`created_at_max=${encodeURIComponent(args['created-at-max'])}`)
          if (args.fields) params.push(`fields=${args.fields}`)
          if (args['financial-status']) params.push(`financial_status=${args['financial-status']}`)
          if (args['fulfillment-status']) params.push(`fulfillment_status=${args['fulfillment-status']}`)
          const qs = params.length > 0 ? '?' + params.join('&') : '?status=any&limit=50'
          result = await api('GET', `/orders.json${qs}`)
          break
        }
        case 'get': {
          if (!args.id) { result = { error: '--id required' }; break }
          result = await api('GET', `/orders/${args.id}.json`)
          break
        }
        case 'count': {
          const params = []
          if (args.status) params.push(`status=${args.status}`)
          if (args['created-at-min']) params.push(`created_at_min=${encodeURIComponent(args['created-at-min'])}`)
          if (args['created-at-max']) params.push(`created_at_max=${encodeURIComponent(args['created-at-max'])}`)
          if (args['financial-status']) params.push(`financial_status=${args['financial-status']}`)
          const qs = params.length > 0 ? '?' + params.join('&') : ''
          result = await api('GET', `/orders/count.json${qs}`)
          break
        }
        default:
          result = { error: 'Unknown orders subcommand. Use: list, get, count' }
      }
      break

    case 'products':
      switch (sub) {
        case 'list': {
          const params = []
          if (args.limit) params.push(`limit=${args.limit}`)
          if (args.fields) params.push(`fields=${args.fields}`)
          if (args.collection) params.push(`collection_id=${args.collection}`)
          if (args.status) params.push(`status=${args.status}`)
          const qs = params.length > 0 ? '?' + params.join('&') : '?limit=50'
          result = await api('GET', `/products.json${qs}`)
          break
        }
        case 'get': {
          if (!args.id) { result = { error: '--id required' }; break }
          result = await api('GET', `/products/${args.id}.json`)
          break
        }
        case 'count':
          result = await api('GET', '/products/count.json')
          break
        default:
          result = { error: 'Unknown products subcommand. Use: list, get, count' }
      }
      break

    case 'customers':
      switch (sub) {
        case 'list': {
          const params = []
          if (args.limit) params.push(`limit=${args.limit}`)
          if (args.fields) params.push(`fields=${args.fields}`)
          const qs = params.length > 0 ? '?' + params.join('&') : '?limit=50'
          result = await api('GET', `/customers.json${qs}`)
          break
        }
        case 'get': {
          if (!args.id) { result = { error: '--id required' }; break }
          result = await api('GET', `/customers/${args.id}.json`)
          break
        }
        case 'search': {
          if (!args.query) { result = { error: '--query required' }; break }
          result = await api('GET', `/customers/search.json?query=${encodeURIComponent(args.query)}`)
          break
        }
        case 'count':
          result = await api('GET', '/customers/count.json')
          break
        default:
          result = { error: 'Unknown customers subcommand. Use: list, get, search, count' }
      }
      break

    case 'inventory':
      switch (sub) {
        case 'levels': {
          const params = []
          if (args['location-id']) params.push(`location_ids=${args['location-id']}`)
          if (args.limit) params.push(`limit=${args.limit}`)
          const qs = params.length > 0 ? '?' + params.join('&') : ''
          result = await api('GET', `/inventory_levels.json${qs}`)
          break
        }
        case 'locations':
          result = await api('GET', '/locations.json')
          break
        default:
          result = { error: 'Unknown inventory subcommand. Use: levels, locations' }
      }
      break

    case 'refunds':
      switch (sub) {
        case 'list': {
          if (!args['order-id']) { result = { error: '--order-id required' }; break }
          result = await api('GET', `/orders/${args['order-id']}/refunds.json`)
          break
        }
        default:
          result = { error: 'Unknown refunds subcommand. Use: list' }
      }
      break

    default:
      result = {
        error: 'Unknown command',
        usage: {
          shop: 'shop [info]',
          orders: 'orders [list|get|count] [--status any] [--created-at-min ISO8601] [--created-at-max ISO8601] [--fields field1,field2] [--financial-status paid] [--limit 50]',
          products: 'products [list|get|count] [--id <id>] [--limit 50] [--fields field1,field2] [--collection <id>]',
          customers: 'customers [list|get|search|count] [--id <id>] [--query email:user@example.com] [--limit 50]',
          inventory: 'inventory [levels|locations] [--location-id <id>]',
          refunds: 'refunds [list] --order-id <id>',
        },
      }
  }

  console.log(JSON.stringify(result, null, 2))
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }))
  process.exit(1)
})
