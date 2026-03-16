#!/usr/bin/env node

const TOKEN = process.env.GOOGLE_SHEETS_ACCESS_TOKEN
const BASE_URL = 'https://sheets.googleapis.com/v4/spreadsheets'

if (!TOKEN) {
  console.error(JSON.stringify({ error: 'GOOGLE_SHEETS_ACCESS_TOKEN environment variable required' }))
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

function getSpreadsheetId() {
  return args['spreadsheet-id'] || process.env.GOOGLE_SHEETS_SPREADSHEET_ID
}

async function main() {
  let result

  switch (cmd) {
    case 'sheets':
      switch (sub) {
        case 'get': {
          const id = getSpreadsheetId()
          if (!id) { result = { error: '--spreadsheet-id required (or set GOOGLE_SHEETS_SPREADSHEET_ID)' }; break }
          const range = args.range || 'Sheet1'
          result = await api('GET', `/${id}/values/${encodeURIComponent(range)}`)
          break
        }
        case 'append': {
          const id = getSpreadsheetId()
          if (!id) { result = { error: '--spreadsheet-id required (or set GOOGLE_SHEETS_SPREADSHEET_ID)' }; break }
          const range = args.range || 'Sheet1'
          if (!args.values) { result = { error: '--values required (JSON array of arrays)' }; break }
          let values
          try {
            values = JSON.parse(args.values)
          } catch {
            result = { error: 'Invalid JSON in --values' }; break
          }
          result = await api('POST', `/${id}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, {
            values: values,
          })
          break
        }
        case 'update': {
          const id = getSpreadsheetId()
          if (!id) { result = { error: '--spreadsheet-id required (or set GOOGLE_SHEETS_SPREADSHEET_ID)' }; break }
          const range = args.range
          if (!range) { result = { error: '--range required (e.g., Sheet1!A1:D5)' }; break }
          if (!args.values) { result = { error: '--values required (JSON array of arrays)' }; break }
          let values
          try {
            values = JSON.parse(args.values)
          } catch {
            result = { error: 'Invalid JSON in --values' }; break
          }
          result = await api('PUT', `/${id}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, {
            values: values,
          })
          break
        }
        case 'clear': {
          const id = getSpreadsheetId()
          if (!id) { result = { error: '--spreadsheet-id required (or set GOOGLE_SHEETS_SPREADSHEET_ID)' }; break }
          const range = args.range
          if (!range) { result = { error: '--range required (e.g., Sheet1!A1:D5)' }; break }
          result = await api('POST', `/${id}/values/${encodeURIComponent(range)}:clear`, {})
          break
        }
        default:
          result = { error: 'Unknown sheets subcommand. Use: get, append, update, clear' }
      }
      break

    case 'spreadsheets':
      switch (sub) {
        case 'get': {
          const id = getSpreadsheetId()
          if (!id) { result = { error: '--spreadsheet-id required (or set GOOGLE_SHEETS_SPREADSHEET_ID)' }; break }
          result = await api('GET', `/${id}?fields=spreadsheetId,properties.title,sheets.properties`)
          break
        }
        case 'create': {
          if (!args.title) { result = { error: '--title required' }; break }
          const body = {
            properties: { title: args.title },
          }
          if (args['sheet-titles']) {
            const titles = args['sheet-titles'].split(',')
            body.sheets = titles.map(t => ({ properties: { title: t.trim() } }))
          }
          result = await api('POST', '', body)
          break
        }
        default:
          result = { error: 'Unknown spreadsheets subcommand. Use: get, create' }
      }
      break

    default:
      result = {
        error: 'Unknown command',
        usage: {
          sheets: 'sheets [get|append|update|clear] --spreadsheet-id <id> --range <range> [--values <json>]',
          spreadsheets: 'spreadsheets [get|create] --spreadsheet-id <id> [--title <title>] [--sheet-titles <comma-separated>]',
        },
        examples: {
          read: 'sheets get --spreadsheet-id <id> --range "Sheet1!A1:D10"',
          append: 'sheets append --spreadsheet-id <id> --range "Sheet1" --values \'[["a","b"],["c","d"]]\'',
          update: 'sheets update --spreadsheet-id <id> --range "Sheet1!A1:B2" --values \'[["a","b"],["c","d"]]\'',
          clear: 'sheets clear --spreadsheet-id <id> --range "Sheet1!A1:D10"',
          create: 'spreadsheets create --title "My Sheet" --sheet-titles "Daily Report,Summary,Affiliate Analysis"',
        },
      }
  }

  console.log(JSON.stringify(result, null, 2))
}

main().catch(err => {
  console.error(JSON.stringify({ error: err.message }))
  process.exit(1)
})
