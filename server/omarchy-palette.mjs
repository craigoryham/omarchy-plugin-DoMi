#!/usr/bin/env node

// Easel — serves Omarchy's current palette to DoMi over HTTP.
//
// Omarchy stages the current theme's generated files in
//   $HOME/.local/state/omarchy/current/theme/
// and records the theme name in theme.name. This server reads colors.toml
// there and returns it as JSON so the browser (which cannot read local
// files) can theme the app to match the system palette.

import http from 'node:http'
import { readFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const HOST = process.env.EASEL_HOST || '127.0.0.1'
const PORT = Number(process.env.EASEL_PORT || '5174')

const STATE_ROOT = process.env.EASEL_STATE || path.join(os.homedir(), '.local', 'state', 'omarchy', 'current')
const COLORS_PATH = path.join(STATE_ROOT, 'theme', 'colors.toml')
const NAME_PATH = path.join(STATE_ROOT, 'theme.name')

// --- Hand-rolled TOML parser (flat tables only, sufficient for colors.toml) ---
function parseToml(text) {
  const out = {}
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const m = line.match(/^([A-Za-z0-9_.-]+)\s*=\s*(.*)$/)
    if (!m) continue
    const key = m[1]
    let val = m[2].trim()
    // Quoted string? Take it verbatim (may contain "#").
    const q = val.match(/^("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/)
    if (q) {
      const s = q[1]
      out[key] = s.slice(1, -1)
      continue
    }
    // Unquoted: strip trailing comment (a "#" preceded by whitespace).
    val = val.replace(/\s+#.*$/, '').trim()
    if (val === 'true') out[key] = true
    else if (val === 'false') out[key] = false
    else if (/^-?\d+(\.\d+)?$/.test(val)) out[key] = Number(val)
    else out[key] = val
  }
  return out
}

function readName() {
  try {
    const n = readFileSync(NAME_PATH, 'utf8').trim()
    return n || null
  } catch {
    return null
  }
}

function readPalette() {
  let stat
  let text
  try {
    stat = readFileSync(COLORS_PATH)
    text = stat.toString()
  } catch {
    return null
  }
  const parsed = parseToml(text)
  const themeName = readName()
  return {
    mode: typeof parsed.mode === 'string' ? parsed.mode : null,
    colors: parsed,
    themeName,
    mtime: stat.mtimeMs,
  }
}

const DEFAULT_CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)

  if (req.method === 'OPTIONS') {
    res.writeHead(204, DEFAULT_CORS)
    res.end()
    return
  }

  if (req.method !== 'GET') {
    res.writeHead(405, { ...DEFAULT_CORS, 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'method not allowed' }))
    return
  }

  if (url.pathname === '/health') {
    res.writeHead(200, { ...DEFAULT_CORS, 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true }))
    return
  }

  if (url.pathname === '/palette') {
    const palette = readPalette()
    if (!palette) {
      res.writeHead(404, { ...DEFAULT_CORS, 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'palette unavailable' }))
      return
    }
    const body = JSON.stringify(palette)
    res.writeHead(200, {
      ...DEFAULT_CORS,
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      'ETag': `"${palette.mtime}"`,
    })
    res.end(body)
    return
  }

  if (url.pathname === '/' || url.pathname === '/favicon.ico') {
    res.writeHead(200, { ...DEFAULT_CORS, 'Content-Type': 'text/plain' })
    res.end('Easel')
    return
  }

  res.writeHead(404, { ...DEFAULT_CORS, 'Content-Type': 'text/plain' })
  res.end('not found')
})

server.listen(PORT, HOST, () => {
  process.stdout.write(`Easel palette server on http://${HOST}:${PORT}\n`)
})

function shutdown() {
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 2000).unref()
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
