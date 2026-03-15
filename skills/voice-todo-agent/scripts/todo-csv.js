#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const HEADERS = ['ID', 'Task', 'Priority', 'Status', 'DateAdded', 'DateCompleted']

function parseArgs(args) {
  const result = { _: [] }
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg.startsWith('--')) {
      const key = arg.slice(2)
      const next = args[i + 1]
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

function parseCSV(text) {
  const rows = []
  let current = ''
  let inQuotes = false
  const lines = text.split('\n')

  for (const line of lines) {
    if (!line.trim() && !inQuotes) continue
    current += (current ? '\n' : '') + line
    const quoteCount = (current.match(/"/g) || []).length
    inQuotes = quoteCount % 2 !== 0
    if (!inQuotes) {
      rows.push(parseCSVRow(current))
      current = ''
    }
  }
  if (current.trim()) rows.push(parseCSVRow(current))
  return rows
}

function parseCSVRow(line) {
  const fields = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        field += '"'
        i++
      } else if (ch === '"') {
        inQuotes = false
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        fields.push(field)
        field = ''
      } else {
        field += ch
      }
    }
  }
  fields.push(field)
  return fields
}

function toCSV(rows, headers) {
  const escape = (val) => {
    const s = String(val ?? '')
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    return s
  }
  const lines = [headers.map(escape).join(',')]
  for (const row of rows) {
    lines.push(headers.map((_, i) => escape(row[i] ?? '')).join(','))
  }
  return lines.join('\n') + '\n'
}

function readTodos(filePath) {
  if (!fs.existsSync(filePath)) return []
  const text = fs.readFileSync(filePath, 'utf8')
  const rows = parseCSV(text)
  if (rows.length === 0) return []
  // Skip header row
  return rows.slice(1)
}

function writeTodos(filePath, rows) {
  fs.writeFileSync(filePath, toCSV(rows, HEADERS), 'utf8')
}

function nextId(rows) {
  let max = 0
  for (const row of rows) {
    const id = parseInt(row[0], 10)
    if (id > max) max = id
  }
  return max + 1
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

const args = parseArgs(process.argv.slice(2))
const [cmd] = args._

function main() {
  if (args['dry-run'] && cmd !== undefined) {
    console.log(JSON.stringify({ _dry_run: true, command: cmd, args }))
    return
  }

  switch (cmd) {
    case 'init': {
      const file = args.file
      if (!file) return error('--file required')
      if (fs.existsSync(file)) {
        console.log(JSON.stringify({ status: 'exists', file }))
        return
      }
      const dir = path.dirname(file)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      fs.writeFileSync(file, HEADERS.join(',') + '\n', 'utf8')
      console.log(JSON.stringify({ status: 'created', file }))
      break
    }

    case 'add': {
      const file = args.file
      const task = args.task
      if (!file) return error('--file required')
      if (!task) return error('--task required')

      // Auto-init if file doesn't exist
      if (!fs.existsSync(file)) {
        const dir = path.dirname(file)
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
        fs.writeFileSync(file, HEADERS.join(',') + '\n', 'utf8')
      }

      const rows = readTodos(file)
      const id = nextId(rows)
      const priority = args.priority || 'P3'
      const row = [String(id), task, priority, 'todo', today(), '']
      rows.push(row)
      writeTodos(file, rows)
      console.log(JSON.stringify({ status: 'added', id, task, priority }))
      break
    }

    case 'list': {
      const file = args.file
      if (!file) return error('--file required')
      if (!fs.existsSync(file)) return error('File not found: ' + file)

      const rows = readTodos(file)
      let items = rows.map(r => ({
        id: parseInt(r[0], 10),
        task: r[1],
        priority: r[2],
        status: r[3],
        dateAdded: r[4],
        dateCompleted: r[5] || null
      }))

      // Filter by status (default: show non-completed)
      if (args.status) {
        items = items.filter(i => i.status === args.status)
      } else if (!args.all) {
        items = items.filter(i => i.status !== 'done')
      }

      if (args.priority) {
        items = items.filter(i => i.priority === args.priority)
      }

      console.log(JSON.stringify({ count: items.length, items }))
      break
    }

    case 'complete': {
      const file = args.file
      if (!file) return error('--file required')
      if (!fs.existsSync(file)) return error('File not found: ' + file)

      const rows = readTodos(file)
      const target = args.id ? String(args.id) : null
      const match = args.match || null

      let found = false
      for (const row of rows) {
        if ((target && row[0] === target) || (match && row[1].toLowerCase().includes(match.toLowerCase()))) {
          row[3] = 'done'
          row[5] = today()
          found = true
          console.log(JSON.stringify({ status: 'completed', id: parseInt(row[0], 10), task: row[1] }))
          break
        }
      }

      if (!found) return error('Todo not found')
      writeTodos(file, rows)
      break
    }

    case 'remove': {
      const file = args.file
      if (!file) return error('--file required')
      if (!fs.existsSync(file)) return error('File not found: ' + file)

      const rows = readTodos(file)
      const target = args.id ? String(args.id) : null
      const match = args.match || null

      const idx = rows.findIndex(row =>
        (target && row[0] === target) || (match && row[1].toLowerCase().includes(match.toLowerCase()))
      )

      if (idx === -1) return error('Todo not found')
      const removed = rows.splice(idx, 1)[0]
      writeTodos(file, rows)
      console.log(JSON.stringify({ status: 'removed', id: parseInt(removed[0], 10), task: removed[1] }))
      break
    }

    case 'update': {
      const file = args.file
      if (!file) return error('--file required')
      if (!args.id) return error('--id required')
      if (!fs.existsSync(file)) return error('File not found: ' + file)

      const rows = readTodos(file)
      const target = String(args.id)
      const row = rows.find(r => r[0] === target)
      if (!row) return error('Todo not found')

      if (args.task) row[1] = args.task
      if (args.priority) row[2] = args.priority
      if (args.status) row[3] = args.status

      writeTodos(file, rows)
      console.log(JSON.stringify({ status: 'updated', id: parseInt(row[0], 10), task: row[1], priority: row[2] }))
      break
    }

    default:
      console.log(`Usage: todo-csv.js <command> [options]

Commands:
  init      Create a new todo CSV file
  add       Add a todo item
  list      List todo items
  complete  Mark a todo as done
  remove    Delete a todo item
  update    Update a todo item

Options:
  --file <path>      Path to CSV file (required)
  --task <text>      Task description (for add)
  --priority <P1-P4> Priority level (default: P3)
  --id <number>      Todo ID (for complete/remove/update)
  --match <text>     Match todo by text (for complete/remove)
  --status <status>  Filter by status (for list)
  --all              Show all items including done (for list)
  --dry-run          Preview without making changes`)
  }
}

function error(msg) {
  console.log(JSON.stringify({ error: msg }))
  process.exit(1)
}

main()
