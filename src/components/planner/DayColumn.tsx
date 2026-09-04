import type { Todo, Category, Tag, TimeBlock } from '../../types'
import { PLAN_START_HOUR, PLAN_END_HOUR, PLAN_HOUR_HEIGHT } from '../../types'

interface DayColumnProps {
  date: string
  blocks: TimeBlock[]
  todos: Todo[]
  categories: Category[]
  tags: Tag[]
  selectedBlockId: string | null
  isToday: boolean
  onSelectBlock: (id: string | null) => void
  onDrop: (date: string, minuteOffset: number) => void
  onGridClick: (date: string, minuteOffset: number) => void
}

function columnTitle(block: TimeBlock, todos: Todo[]): string {
  const todo = todos.find((t) => t.id === block.taskId)
  return block.title || todo?.text || 'Untitled'
}

function colorForTodo(todo: Todo | undefined, tags: Tag[], categories: Category[]): string {
  if (!todo) return '#64748b'
  const cat = categories.find((c) => c.id === todo.categoryId)
  if (cat) return cat.color
  const tag = tags.find((t) => (todo.tagIds ?? []).includes(t.id))
  return tag ? tag.color : '#64748b'
}

export function DayColumn({
  date,
  blocks,
  todos,
  categories,
  tags,
  selectedBlockId,
  isToday,
  onSelectBlock,
  onDrop,
  onGridClick,
}: DayColumnProps) {
  const hourLabels: number[] = []
  for (let h = PLAN_START_HOUR; h <= PLAN_END_HOUR; h++) hourLabels.push(h)
  const totalHeight = (PLAN_END_HOUR - PLAN_START_HOUR) * PLAN_HOUR_HEIGHT

  return (
    <div
      className={`relative border border-border rounded-lg overflow-hidden select-none ${isToday ? 'bg-primary/5' : ''}`}
      style={{ height: totalHeight }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
        const offsetPx = e.clientY - rect.top
        onDrop(date, Math.max(0, Math.round(offsetPx / PLAN_HOUR_HEIGHT * 60)))
      }}
      onClick={(e) => {
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
        const offsetPx = e.clientY - rect.top
        onGridClick(date, Math.max(0, Math.round(offsetPx / PLAN_HOUR_HEIGHT * 60)))
      }}
    >
      {/* Hour lines */}
      {hourLabels.map((h) => (
        <div
          key={h}
          className="absolute left-0 right-0 border-t border-border-light/60"
          style={{ top: (h - PLAN_START_HOUR) * PLAN_HOUR_HEIGHT }}
        />
      ))}

      {/* Blocks */}
      {blocks.map((block) => {
        const offset = block.startMinute - PLAN_START_HOUR * 60
        const h = block.durationMin / 60 * PLAN_HOUR_HEIGHT
        const todo = todos.find((t) => t.id === block.taskId)
        return (
          <div
            key={block.id}
            draggable
            onDragStart={(e) => { e.stopPropagation(); onSelectBlock(block.id) }}
            onClick={(e) => { e.stopPropagation(); onSelectBlock(block.id) }}
            className={`absolute left-1 right-1 rounded-md px-2 py-1 text-xs text-white overflow-hidden cursor-pointer shadow-sm hover:opacity-90 transition-opacity ${
              selectedBlockId === block.id ? 'ring-2 ring-white/70 z-10' : ''
            }`}
            style={{
              top: Math.max(0, offset / 60 * PLAN_HOUR_HEIGHT),
              height: Math.max(22, h),
              backgroundColor: block.color || colorForTodo(todo, tags, categories),
            }}
            title={columnTitle(block, todos)}
          >
            <p className="font-medium truncate">{columnTitle(block, todos)}</p>
            {(h > 30 || block.description || block.meeting) && (
              <p className="opacity-80 text-[10px] truncate">
                {String(Math.floor(block.startMinute / 60) % 12 || 12)}:{String(block.startMinute % 60).padStart(2, '0')} {Math.floor(block.startMinute / 60) < 12 ? 'AM' : 'PM'}
                {' · '}{block.durationMin}m
                {block.meeting ? ' · Meeting' : ''}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
