#!/usr/bin/env node

// Block Sync — receives DoMi time blocks from the React app and writes them
// to disk so the Omarchy QML clock widget can read them via FileView.
//
// Endpoints:
//   POST /blocks  — receive { blocks: [...] }, write to ~/.local/state/domi/blocks.json
//   GET  /health  — { ok: true, blocks: N }

import http from 'node:http'
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const HOST = process.env.BLOCK_SYNC_HOST || '127.0.0.1'
const PORT = Number(process.env.BLOCK_SYNC_PORT || '5175')
const STATE_DIR = path.join(os.homedir(), '.local', 'state', 'domi')
const BLOCKS_PATH = path.join(STATE_DIR, 'blocks.json')

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function ensureDir() {
  mkdirSync(STATE_DIR, { recursive: true })
}

function readBlockCount() {
  try {
    const data = JSON.parse(readFileSync(BLOCKS_PATH, 'utf8'))
    return Array.isArray(data.blocks) ? data.blocks.length : 0
  } catch {
    return 0
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)

  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS)
    res.end()
    return
  }

  if (url.pathname === '/health' && req.method === 'GET') {
    const count = readBlockCount()
    res.writeHead(200, { ...CORS, 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, blocks: count }))
    return
  }

  if (url.pathname === '/blocks' && req.method === 'POST') {
    let body = ''
    req.on('data', (chunk) => { body += chunk })
    req.on('end', () => {
      try {
        const parsed = JSON.parse(body)
        const blocks = Array.isArray(parsed.blocks) ? parsed.blocks : []
        ensureDir()
        const payload = JSON.stringify({
          updatedAt: Date.now(),
          blocks,
        }, null, 2)
        writeFileSync(BLOCKS_PATH, payload)
        res.writeHead(200, { ...CORS, 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: true, blocks: blocks.length }))
      } catch (err) {
        res.writeHead(400, { ...CORS, 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: 'invalid JSON' }))
      }
    })
    return
  }

  res.writeHead(404, { ...CORS, 'Content-Type': 'text/plain' })
  res.end('not found')
})

server.listen(PORT, HOST, () => {
  ensureDir()
  process.stdout.write(`block-sync on http://${HOST}:${PORT}\n`)
})

function shutdown() {
  server.close(() => process.exit(0))
  setTimeout(() => process.exit(0), 2000).unref()
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
