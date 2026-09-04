import { useEffect, useRef } from 'react'
import type { TimeBlock } from '../types'

const BLOCK_SYNC_URL = 'http://127.0.0.1:5175/blocks'
const DEBOUNCE_MS = 200

export function useBlockExporter(blocks: TimeBlock[]) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    // Skip the first render — no need to POST the initial load back to the server
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      fetch(BLOCK_SYNC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks }),
      }).catch(() => {
        // Silently ignore — block-sync may not be running
      })
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [blocks])
}
