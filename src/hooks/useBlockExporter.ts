import { useEffect, useRef } from 'react'
import type { TimeBlock } from '../types'

const BLOCK_SYNC_URL = 'http://localhost:5175/blocks'
const DEBOUNCE_MS = 200

export function useBlockExporter(blocks: TimeBlock[]) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
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
