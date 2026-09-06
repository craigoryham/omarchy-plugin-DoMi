export interface Category {
  id: string
  name: string
  color: string
}

export type WeeklyPlans = Record<string, string[]>

export interface Tag {
  id: string
  name: string
  color: string
}

export interface Todo {
  id: string
  text: string
  description: string
  completed: boolean
  categoryId: string | null
  tagIds: string[]
  dueDate: string | null
  createdAt: string
}

export interface TimeBlock {
  id: string
  date: string
  startMinute: number
  durationMin: number
  taskId: string | null
  title: string | null
  description: string
  color: string
  meeting?: boolean
  recurrence?: string | null
}

export const CATEGORY_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#ec4899',
  '#ef4444',
  '#f59e0b',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#64748b',
]

export const TAG_COLORS = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#22c55e',
  '#14b8a6',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
  '#64748b',
]

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-personal', name: 'Personal', color: '#6366f1' },
  { id: 'cat-work', name: 'Work', color: '#f59e0b' },
  { id: 'cat-health', name: 'Health', color: '#22c55e' },
  { id: 'cat-finance', name: 'Finance', color: '#ef4444' },
]

export const DEFAULT_TAGS: Tag[] = [
  { id: 'tag-urgent', name: 'Urgent', color: '#ef4444' },
  { id: 'tag-big-picture', name: 'Big Picture', color: '#3b82f6' },
  { id: 'tag-deep-work', name: 'Deep Work', color: '#8b5cf6' },
  { id: 'tag-communications', name: 'Comms', color: '#14b8a6' },
  { id: 'tag-admin', name: 'Admin', color: '#64748b' },
]

export const PLAN_START_HOUR = 6
export const PLAN_END_HOUR = 22
export const PLAN_HOUR_HEIGHT = 60
