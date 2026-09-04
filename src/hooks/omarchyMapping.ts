export interface OmarchyPalette {
  mode: string | null
  colors: Record<string, string>
  themeName: string | null
  mtime: number
}

export interface ResolvedPalette {
  vars: Record<string, string>
  colorScheme: 'light' | 'dark'
}

// Normalize a #rgb / #rrggbb hex to #rrggbb.
function normalizeHex(input: string): string | null {
  const m = input.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!m) return null
  const h = m[1].toLowerCase()
  return h.length === 3
    ? `#${h[0]}${h[0]}${h[1]}${h[1]}${h[2]}${h[2]}`
    : `#${h}`
}

function hexToRgb(hex: string): [number, number, number] | null {
  const n = normalizeHex(hex)
  if (!n) return null
  return [
    parseInt(n.slice(1, 3), 16),
    parseInt(n.slice(3, 5), 16),
    parseInt(n.slice(5, 7), 16),
  ]
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

// Blend hexB into hexA by `t` (0 = A, 1 = B).
function mix(hexA: string, hexB: string, t: number): string {
  const a = hexToRgb(hexA)
  const b = hexToRgb(hexB)
  if (!a || !b) return normalizeHex(hexA) ?? hexA
  return rgbToHex(
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  )
}

// Lighten a color by mixing toward white (`t` toward white).
function lighten(hex: string, t: number): string {
  return mix(hex, '#ffffff', t)
}

// Darken a color by mixing toward black (`t` toward black).
function darken(hex: string, t: number): string {
  return mix(hex, '#000000', t)
}

const pick = (c: OmarchyPalette['colors'], ...keys: string[]): string | null => {
  for (const k of keys) {
    const v = c[k]
    if (v && /^#?[0-9a-f]{3,6}$/i.test(String(v).trim())) return String(v)
  }
  return null
}

export function resolveOmarchyPalette(p: OmarchyPalette): ResolvedPalette {
  const c = p.colors ?? {}
  const bg = pick(c, 'background', 'darker_background', 'dark_background') ?? '#111827'
  const accent = pick(c, 'accent', 'blue') ?? '#6366f1'
  const fg = pick(c, 'foreground') ?? '#e5e7eb'
  const selection = pick(c, 'selection') ?? mix(bg, '#ffffff', 0.12)
  const border = pick(c, 'muted') ?? mix(bg, '#ffffff', 0.3)
  const textMuted = pick(c, 'dark_foreground') ?? mix(fg, bg, 0.45)
  const textSecondary = pick(c, 'bright_foreground', 'light_foreground') ?? mix(fg, bg, 0.15)
  const lighterBg = pick(c, 'lighter_background') ?? mix(bg, '#ffffff', 0.06)

  // Negative-space chain: darker variants become the deep page void/body.
  const voidColor =
    pick(c, 'darker_background', 'dark_background', 'background') ?? darken(bg, 0.15)
  const bodyColor =
    pick(c, 'dark_background', 'background') ?? mix(bg, voidColor, 0.5)

  return {
    colorScheme: p.mode === 'light' ? 'light' : 'dark',
    vars: {
      '--page-bg-a': bodyColor,
      '--page-bg-b': voidColor,
      '--color-primary': accent,
      '--color-primary-light': lighten(accent, 0.18),
      '--color-primary-dark': darken(accent, 0.18),
      '--color-surface': bg,
      '--color-surface-hover': lighterBg,
      '--color-surface-alt': selection,
      '--color-border': border,
      '--color-border-light': mix(border, bg, 0.6),
      '--color-text': fg,
      '--color-text-secondary': textSecondary,
      '--color-text-muted': textMuted,
      '--color-danger': pick(c, 'red', 'bright_red') ?? '#ef4444',
      '--color-danger-light': mix(pick(c, 'red', 'bright_red') ?? '#ef4444', bg, 0.85),
      '--color-success': pick(c, 'green', 'bright_green') ?? '#22c55e',
      '--color-warning': pick(c, 'yellow', 'bright_yellow') ?? '#f59e0b',
    },
  }
}
