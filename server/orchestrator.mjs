#!/usr/bin/env node

// Orchestrator — spawns and manages DoMi backend services.
// Run with: node server/orchestrator.mjs
//
// Services:
//   - Easel (palette server) on :5174
//   - Block Sync on :5175

import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const COOLDOWN_MS = 3000

const services = [
  {
    name: 'easel',
    command: 'node',
    args: [path.join(__dirname, 'omarchy-palette.mjs')],
  },
  {
    name: 'block-sync',
    command: 'node',
    args: [path.join(__dirname, 'block-sync.mjs')],
  },
]

const children = new Map()

function log(msg) {
  process.stdout.write(`[orchestrator] ${msg}\n`)
}

function spawnService(svc) {
  const child = spawn(svc.command, svc.args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env },
  })

  child.stdout.on('data', (data) => {
    for (const line of data.toString().split('\n')) {
      if (line.trim()) log(`[${svc.name}] ${line.trim()}`)
    }
  })

  child.stderr.on('data', (data) => {
    for (const line of data.toString().split('\n')) {
      if (line.trim()) log(`[${svc.name}] ${line.trim()}`)
    }
  })

  child.on('exit', (code, signal) => {
    log(`${svc.name} exited (code=${code}, signal=${signal})`)
    children.delete(svc.name)

    if (signal !== 'SIGTERM' && signal !== 'SIGINT') {
      log(`${svc.name} restarting in ${COOLDOWN_MS}ms...`)
      setTimeout(() => spawnService(svc), COOLDOWN_MS)
    }
  })

  children.set(svc.name, child)
  log(`started ${svc.name} (pid ${child.pid})`)
}

// Spawn all services
for (const svc of services) {
  spawnService(svc)
}

// Graceful shutdown
function shutdown(sig) {
  log(`received ${sig}, shutting down...`)
  for (const [name, child] of children) {
    log(`stopping ${name}`)
    child.kill('SIGTERM')
  }
  setTimeout(() => process.exit(0), 3000).unref()
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
