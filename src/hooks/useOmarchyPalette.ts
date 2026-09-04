import { useEffect, useState } from 'react'
import type { OmarchyPalette } from './omarchyMapping'

const EASEL_URL = 'http://127.0.0.1:5174/palette'

const ACTIVE_INTERVAL_MS = 5000

interface PaletteState {
  palette: OmarchyPalette | null
  status: 'loading' | 'available' | 'unavailable'
}

export function useOmarchyPalette(active: boolean): PaletteState {
  const [state, setState] = useState<PaletteState>({
    palette: null,
    status: 'loading',
  })

  useEffect(() => {
    if (!active) {
      setState({ palette: null, status: 'loading' })
      return
    }

    let stopped = false
    let activeTimer: ReturnType<typeof setInterval> | null = null

    const fetchPalette = async () => {
      try {
        const res = await fetch(EASEL_URL, { cache: 'no-cache' })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = (await res.json()) as OmarchyPalette
        if (stopped) return
        setState((prev) =>
          prev.palette && prev.palette.mtime === data.mtime
            ? prev
            : { palette: data, status: 'available' },
        )
      } catch {
        if (stopped) return
        setState({ palette: null, status: 'unavailable' })
      }
    }

    // Kick off immediately, then poll slowly while active.
    fetchPalette()
    activeTimer = setInterval(() => {
      fetchPalette()
    }, ACTIVE_INTERVAL_MS)

    return () => {
      stopped = true
      if (activeTimer) clearInterval(activeTimer)
    }
  }, [active])

  return state
}
