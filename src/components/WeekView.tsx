import type { Todo, Category, Tag, WeeklyPlans, WeekNotes } from '../types'
import { dateKey, startOfWeek, addDays } from './planner/date'
import { JournalNoteCard } from './JournalNoteCard'

interface WeekViewProps {
  offset: 0 | 1
  todos: Todo[]
  categories: Category[]
  tags: Tag[]
  weeklyPlans: WeeklyPlans
  weekNotes: WeekNotes
  onToggleInWeek: (id: string, weekKey: string) => void
  onSetWeekNote: (weekKey: string, text: string) => void
}

function fmtRange(monday: Date): string {
  const sunday = addDays(monday, 6)
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(monday)} – ${fmt(sunday)}`
}

function colorForTodo(todo: Todo, tags: Tag[], categories: Category[]): string {
  const cat = categories.find((c) => c.id === todo.categoryId)
  if (cat) return cat.color
  const tag = tags.find((t) => todo.tagIds.includes(t.id))
  return tag ? tag.color : '#64748b'
}

export function WeekView({ offset, todos, categories, tags, weeklyPlans, weekNotes, onToggleInWeek, onSetWeekNote }: WeekViewProps) {
  const monday = startOfWeek(addDays(new Date(), offset * 7))
  const weekKey = dateKey(monday)
  const weekLabel = offset === 0 ? 'This week' : 'Next week'
  const memberIds = weeklyPlans[weekKey] ?? []
  const memberSet = new Set(memberIds)
  const activeTodos = todos.filter((t) => !t.completed)
  const todosById = new Map(todos.map((t) => [t.id, t]))
  const queueTodos = memberIds
    .map((id) => todosById.get(id))
    .filter((t): t is Todo => t !== undefined)
  const unplanned = queueTodos.filter((t) => !t.completed)
  const completed = queueTodos.filter((t) => t.completed)

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold text-text">
          {weekLabel} <span className="text-sm font-normal text-text-muted">· {fmtRange(monday)}</span>
        </h2>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Master task list */}
        <div className="bg-surface rounded-xl shadow-md border border-border p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-text">Load from master</h4>
            <span className="text-xs text-text-muted tabular-nums">{activeTodos.length}</span>
          </div>
          <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
            {activeTodos.map((todo) => {
              const inWeek = memberSet.has(todo.id)
              return (
                <div
                  key={todo.id}
                  className="px-2.5 py-1.5 bg-surface rounded-md border border-border text-sm text-text flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colorForTodo(todo, tags, categories) }} />
                  <span className="truncate flex-1">{todo.text}</span>
                  {tags
                    .filter((tag) => todo.tagIds.includes(tag.id))
                    .map((tag) => (
                      <span
                        key={tag.id}
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                  <button
                    onClick={() => onToggleInWeek(todo.id, weekKey)}
                    title={inWeek ? `Remove from ${weekLabel}` : `Add to ${weekLabel}`}
                    className={`p-1.5 rounded-lg transition-colors ${
                      inWeek
                        ? 'text-primary hover:bg-primary/10'
                        : 'text-text-muted hover:text-primary hover:bg-primary/10'
                    }`}
                  >
                    {inWeek ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v2m8-2v2M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zM12 11v6M9 14h6" />
                      </svg>
                    )}
                  </button>
                </div>
              )
            })}
            {activeTodos.length === 0 && (
              <p className="text-xs text-text-muted">No active tasks.</p>
            )}
          </div>
        </div>

        {/* Queue + journal */}
        <div className="space-y-4">
          <div className="bg-surface rounded-xl shadow-md border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold text-text">Queue</h4>
              <span className="text-xs text-text-muted tabular-nums">{unplanned.length}</span>
            </div>
            <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
              {unplanned.length === 0 && (
                <p className="text-xs text-text-muted">Nothing loaded yet.</p>
              )}
              {unplanned.map((todo) => (
                <div
                  key={todo.id}
                  className="px-2.5 py-1.5 bg-surface rounded-md border border-border text-sm text-text flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colorForTodo(todo, tags, categories) }} />
                  <span className="truncate flex-1">{todo.text}</span>
                  <button
                    onClick={() => onToggleInWeek(todo.id, weekKey)}
                    title={`Remove from ${weekLabel}`}
                    className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {completed.length > 0 && (
                <>
                  <div className="flex items-center gap-3 pt-1">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-[10px] text-text-muted font-medium">Done · {completed.length}</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  {completed.map((todo) => (
                    <div key={todo.id} className="px-2.5 py-1.5 bg-surface rounded-md border border-border text-sm flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0 opacity-50" style={{ backgroundColor: colorForTodo(todo, tags, categories) }} />
                      <span className="truncate text-text-muted line-through">{todo.text}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          <JournalNoteCard
            weekLabel={weekLabel}
            value={weekNotes[weekKey] ?? ''}
            onSave={(text) => onSetWeekNote(weekKey, text)}
          />
        </div>
      </div>
    </div>
  )
}