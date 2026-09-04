export function dateKey(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(d: Date, n: number): Date {
  const c = new Date(d)
  c.setDate(c.getDate() + n)
  return c
}

export function addMonths(d: Date, n: number): Date {
  const c = new Date(d)
  c.setDate(1)
  c.setMonth(c.getMonth() + n)
  return c
}

// Return the Monday of the week containing `d`.
export function startOfWeek(d: Date): Date {
  const monday = addDays(new Date(d), 1 - d.getDay())
  monday.setHours(0, 0, 0, 0)
  return monday
}

// Return the first day of the month containing `d`.
export function startOfMonth(d: Date): Date {
  const first = new Date(d.getFullYear(), d.getMonth(), 1)
  first.setHours(0, 0, 0, 0)
  return first
}

export function formatTime(minuteOfDay: number): string {
  let h = Math.floor(minuteOfDay / 60) % 24
  const suffix = h < 12 ? 'AM' : 'PM'
  h = h % 12 || 12
  return `${h}:${String(minuteOfDay % 60).padStart(2, '0')} ${suffix}`
}

export function formatDuration(min: number): string {
  return min % 60 === 0 ? `${min / 60}h` : `${Math.floor(min / 60)}h ${min % 60}m`
}
