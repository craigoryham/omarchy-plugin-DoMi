import type { Todo, Category, Tag, TimeBlock } from '../../types'
import { PLAN_START_HOUR, PLAN_END_HOUR, PLAN_HOUR_HEIGHT } from '../../types'
import { dateKey } from './date'
import { DayColumn } from './DayColumn'

interface WeekGridProps {
  weekStart: Date
  dayCount: number
  blocks: TimeBlock[]
  todos: Todo[]
  categories: Category[]
  tags: Tag[]
  selectedBlockId: string | null
  todayKey: string
  focusedDay: number
  onSelectBlock: (id: string | null) => void
  onDrop: (date: string, minuteOffset: number) => void
  onGridClick: (date: string, minuteOffset: number) => void
  onToggleTask: (taskId: string) => void
  onRemoveBlock: (id: string) => void
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const gridTemplate = (dayCount: number) => ({
  gridTemplateColumns: `40px repeat(${dayCount}, minmax(0, 1fr))`,
})

export function WeekGrid({
  weekStart,
  dayCount,
  blocks,
  todos,
  categories,
  tags,
  selectedBlockId,
  todayKey,
  focusedDay,
  onSelectBlock,
  onDrop,
  onGridClick,
  onToggleTask,
  onRemoveBlock,
}: WeekGridProps) {
  const hourLabels: number[] = []
  for (let h = PLAN_START_HOUR; h <= PLAN_END_HOUR; h++) hourLabels.push(h)
  const totalHeight = (PLAN_END_HOUR - PLAN_START_HOUR) * PLAN_HOUR_HEIGHT

  const days = WEEKDAYS.slice(0, dayCount).map((_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  return (
    <div className="border border-border rounded-lg overflow-hidden overflow-x-auto">
      {/* Day headers */}
      <div className="grid border-b border-border bg-surface-alt/50" style={gridTemplate(dayCount)}>
        <div className="py-2" />
        {days.map((d, i) => {
          const key = dateKey(d)
          const isToday = key === todayKey
          const isFocused = i === focusedDay
          return (
            <div
              key={i}
              className={`py-2 text-center border-l border-border-light ${isFocused ? 'bg-primary/10' : ''}`}
            >
              <div className={`text-[10px] uppercase tracking-wide ${isFocused ? 'text-primary font-semibold' : 'text-text-muted'}`}>
                {WEEKDAYS[i]}
              </div>
              <div
                className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm font-semibold ${
                  isToday ? 'bg-primary text-white' : isFocused ? 'bg-primary/15 text-primary' : 'text-text'
                }`}
              >
                {d.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Timeline body */}
      <div className="grid select-none" style={{ height: totalHeight, ...gridTemplate(dayCount) }}>
        {/* Hour labels */}
        <div className="relative">
          {hourLabels.map((h) => (
            <span
              key={h}
              className="absolute right-1 text-[10px] text-text-muted"
              style={{ top: (h - PLAN_START_HOUR) * PLAN_HOUR_HEIGHT - 6 }}
            >
              {h % 12 === 0 ? '12' : h % 12} {h < 12 ? 'AM' : 'PM'}
            </span>
          ))}
        </div>

        {/* Day columns */}
        {days.map((d, i) => {
          const key = dateKey(d)
          return (
            <div
              key={key}
              className={`border-l border-border-light ${i === focusedDay ? 'ring-2 ring-inset ring-primary/40' : ''}`}
            >
              <DayColumn
                date={key}
                blocks={blocks.filter((b) => b.date === key)}
                todos={todos}
                categories={categories}
                tags={tags}
                selectedBlockId={selectedBlockId}
                isToday={key === todayKey}
                onSelectBlock={onSelectBlock}
                onDrop={onDrop}
                onGridClick={onGridClick}
                onToggleTask={onToggleTask}
                onRemoveBlock={onRemoveBlock}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
