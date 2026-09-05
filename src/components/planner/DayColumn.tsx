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
  onToggleTask: (taskId: string) => void
  onRemoveBlock: (id: string) => void
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
  onToggleTask,
  onRemoveBlock,
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
        const linkedTaskId = todo ? block.taskId : null
        return (
          <div
            key={block.id}
            draggable
            onDragStart={(e) => { e.stopPropagation(); onSelectBlock(block.id) }}
            onClick={(e) => { e.stopPropagation(); onSelectBlock(block.id) }}
            className={`group absolute left-1 right-1 rounded-md text-xs text-white overflow-hidden cursor-pointer shadow-sm hover:opacity-90 transition-opacity ${
              linkedTaskId ? 'pl-5 pr-1 py-1' : 'px-2 py-1'
            } ${todo?.completed ? 'opacity-60' : ''} ${
              selectedBlockId === block.id ? 'ring-2 ring-white/70 z-10' : ''
            }`}
            style={{
              top: Math.max(0, offset / 60 * PLAN_HOUR_HEIGHT),
              height: Math.max(22, h),
              backgroundColor: block.color || colorForTodo(todo, tags, categories),
            }}
            title={columnTitle(block, todos)}
          >
            {linkedTaskId && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleTask(linkedTaskId) }}
                className={`absolute top-1 left-1 z-20 w-3.5 h-3.5 rounded-full border border-white/80 flex items-center justify-center text-[8px] leading-none transition-opacity ${
                  todo?.completed ? 'bg-white text-black opacity-100' : 'opacity-0 group-hover:opacity-100'
                }`}
                title={todo?.completed ? 'Mark incomplete' : 'Mark complete'}
                aria-label={todo?.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {todo?.completed ? '✓' : ''}
              </button>
            )}
            {linkedTaskId && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveBlock(block.id) }}
                className="absolute top-1 right-1 z-20 w-4 h-4 rounded-full bg-black/30 text-white text-[9px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/50"
                title="Return to task queue"
                aria-label="Return to task queue"
              >
                ↩
              </button>
            )}
            <p className={`font-medium truncate ${todo?.completed ? 'line-through' : ''}`}>{columnTitle(block, todos)}</p>
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
