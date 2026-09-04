import { useEffect, useMemo, useState } from 'react'
import { useOmarchyPalette } from './useOmarchyPalette'
import { resolveOmarchyPalette } from './omarchyMapping'

export type Theme = 'light' | 'dark' | 'system'

const THEME_KEY = 'domi-theme'

const CYCLE: Theme[] = ['light', 'dark', 'system']

function readStored(): Theme {
  try {
    const raw = window.localStorage.getItem(THEME_KEY)
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  } catch {
    /* ignore */
  }
  return 'system'
}

const OMARCHY_VARS = [
  '--page-bg-a',
  '--page-bg-b',
  '--color-primary',
  '--color-primary-light',
  '--color-primary-dark',
  '--color-surface',
  '--color-surface-hover',
  '--color-surface-alt',
  '--color-border',
  '--color-border-light',
  '--color-text',
  '--color-text-secondary',
  '--color-text-muted',
  '--color-danger',
  '--color-danger-light',
  '--color-success',
  '--color-warning',
]

function clearOmarchyVars() {
  const el = document.documentElement
  for (const v of OMARCHY_VARS) el.style.removeProperty(v)
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(readStored)

  // Only poll Easel while in System mode.
  const { palette, status: paletteStatus } = useOmarchyPalette(theme === 'system')

  const setTheme = (next: Theme) => {
    setThemeState(next)
    try {
      window.localStorage.setItem(THEME_KEY, next)
    } catch {
      /* ignore */
    }
  }

  const cycle = () => {
    const i = CYCLE.indexOf(theme)
    setTheme(CYCLE[(i + 1) % CYCLE.length])
  }

  const usingOmarchy = theme === 'system' && paletteStatus === 'available' && !!palette

  // Apply/clear Omarchy palette vars.
  useEffect(() => {
    if (usingOmarchy && palette) {
      const el = document.documentElement
      const resolved = resolveOmarchyPalette(palette)
      for (const [k, v] of Object.entries(resolved.vars)) el.style.setProperty(k, v)
      el.style.colorScheme = resolved.colorScheme
    } else {
      clearOmarchyVars()
      if (document.documentElement) document.documentElement.style.colorScheme = ''
    }
  }, [usingOmarchy, palette])

  // Fallback light/dark class when not using Omarchy palette.
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => {
      let isDark: boolean
      if (usingOmarchy) {
        isDark = false
      } else if (theme === 'dark') {
        isDark = true
      } else if (theme === 'light') {
        isDark = false
      } else {
        isDark = mq.matches // system fallback
      }
      document.documentElement.classList.toggle('dark', isDark)
    }
    sync()
    if (!usingOmarchy && theme === 'system') {
      mq.addEventListener('change', sync)
      return () => mq.removeEventListener('change', sync)
    }
  }, [theme, usingOmarchy])

  const effective: Theme = useMemo(() => {
    if (theme !== 'system') return theme
    if (usingOmarchy) return 'system'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }, [theme, usingOmarchy])

  return {
    theme,
    effective,
    setTheme,
    cycle,
    paletteStatus,
    paletteThemeName: palette?.themeName ?? null,
  }
}
