import type { Todo, Category, Tag, TimeBlock } from '../../types'
import { formatTime } from './date'

interface MonthGridProps {
  monthAnchor: Date
  blocks: TimeBlock[]
  todos: Todo[]
  categories: Category[]
  tags: Tag[]
  selectedBlockId: string | null
  todayKey: string
  onSelectBlock: (id: string | null) => void
  onOpenDay: (date: string) => void
  onDropOnDay: (date: string) => void
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function columnTitle(block: TimeBlock, todos: Todo[]): string {
  const todo = todos.find((t) => t.id === block.taskId)
  return block.title || todo?.text || 'Untitled'
}

function blockColor(block: TimeBlock, todos: Todo[], tags: Tag[], categories: Category[]): string {
  if (block.color) return block.color
  const todo = todos.find((t) => t.id === block.taskId)
  if (!todo) return '#64748b'
  const cat = categories.find((c) => c.id === todo.categoryId)
  if (cat) return cat.color
  const tag = tags.find((t) => (todo.tagIds ?? []).includes(t.id))
  return tag ? tag.color : '#64748b'
}

export function MonthGrid({
  monthAnchor,
  blocks,
  todos,
  categories,
  tags,
  selectedBlockId,
  todayKey,
  onSelectBlock,
  onOpenDay,
  onDropOnDay,
}: MonthGridProps) {
  const first = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth(), 1)
  const last = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 0)
  // Monday on/before the 1st — start the leading grid from Monday for a typical Mon-first calendar.
  const lead = first.getDay() === 0 ? 6 : first.getDay() - 1
  // Number of trailing cells to reach end of week (7).
  const gridStart = new Date(first)
  gridStart.setDate(first.getDate() - lead)

  const cells: Date[] = []
  const total = Math.ceil((lead + last.getDate()) / 7) * 7
  for (let i = 0; i < total; i++) {
    const d = new Date(gridStart)
    d.setDate(gridStart.getDate() + i)
    cells.push(d)
  }

  const keyOf = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <div className="grid grid-cols-7 border-b border-border bg-surface-alt/50">
        {DAY_LABELS.map((label) => (
          <div key={label} className="py-2 text-center text-[10px] uppercase tracking-wide text-text-muted">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((d, i) => {
          const key = keyOf(d)
          const inMonth = d.getMonth() === monthAnchor.getMonth()
          const isToday = key === todayKey
          const dayBlocks = blocks.filter((b) => b.date === key)
          return (
            <div
              key={i}
              onClick={(e) => {
                if (e.target instanceof HTMLElement && e.target.closest('[data-block]')) return
                onOpenDay(key)
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                onDropOnDay(key)
              }}
              className={`min-h-[96px] border-b border-r last:border-r-0 border-border-light p-1.5 cursor-pointer transition-colors ${
                inMonth ? 'bg-surface' : 'bg-surface-alt/40'
              } ${isToday ? 'ring-2 ring-inset ring-primary' : ''} hover:bg-surface-alt/70`}
            >
              <div className={`text-xs font-semibold mb-1 ${inMonth ? 'text-text' : 'text-text-muted'} ${
                isToday ? 'text-primary' : ''
              }`}>
                {d.getDate()}
              </div>
              <div className="space-y-1">
                {dayBlocks.slice(0, 3).map((block) => (
                  <div
                    key={block.id}
                    data-block
                    onClick={(e) => {
                      e.stopPropagation()
                      onSelectBlock(block.id)
                    }}
                    className={`px-1 py-0.5 rounded text-[10px] text-white truncate cursor-pointer hover:opacity-90 ${
                      selectedBlockId === block.id ? 'ring-2 ring-white/70' : ''
                    }`}
                    style={{ backgroundColor: blockColor(block, todos, tags, categories) }}
                    title={columnTitle(block, todos)}
                  >
                    {formatTime(block.startMinute)} {columnTitle(block, todos)}
                  </div>
                ))}
                {dayBlocks.length > 3 && (
                  <div className="text-[10px] text-text-muted px-1">+{dayBlocks.length - 3} more</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
