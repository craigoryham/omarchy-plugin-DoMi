import { useEffect, useState } from 'react'
import type { Todo, Category, Tag, TimeBlock } from '../../types'
import { addDays, addMonths, dateKey, startOfMonth, startOfWeek } from './date'
import { WeekGrid } from './WeekGrid'
import { DayColumn } from './DayColumn'
import { MonthGrid } from './MonthGrid'
import { BlockDetails } from './BlockDetails'
import { TodoDetails } from './TodoDetails'
import { PLAN_START_HOUR, PLAN_END_HOUR, PLAN_HOUR_HEIGHT } from '../../types'

interface TimeBlockPlannerProps {
  blocks: TimeBlock[]
  todos: Todo[]
  categories: Category[]
  tags: Tag[]
  onAddBlock: (block: Omit<TimeBlock, 'id'>) => void
  onUpdateBlock: (id: string, patch: Partial<TimeBlock>) => void
  onDeleteBlock: (id: string) => void
  onAddTaskBlock: (date: string, startMinute: number, text: string) => string
  onToggleTask: (id: string) => void
  onUpdateTodo: (id: string, text: string) => void
  onSetCategory: (id: string, categoryId: string | null) => void
  onSetDueDate: (id: string, dueDate: string | null) => void
  onSetTags: (id: string, tagIds: string[]) => void
  onSetDescription: (id: string, description: string) => void
  onDeleteTodo: (id: string) => void
}

type View = 'day' | 'week' | 'month'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function fmtMonthDay(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function TimeBlockPlanner({
  blocks,
  todos,
  categories,
  tags,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onAddTaskBlock,
  onToggleTask,
  onUpdateTodo,
  onSetCategory,
  onSetDueDate,
  onSetTags,
  onSetDescription,
  onDeleteTodo,
}: TimeBlockPlannerProps) {
  const [view, setView] = useState<View>('week')
  const [cursor, setCursor] = useState<Date>(() => new Date())
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null)
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [selectedTodoId, setSelectedTodoId] = useState<string | null>(null)

  const selectedBlock = blocks.find((b) => b.id === selectedBlockId) ?? null
  const selectedQueueTodo = selectedTodoId ? todos.find((t) => t.id === selectedTodoId) ?? null : null

  const selectBlock = (id: string | null) => {
    setSelectedTodoId(null)
    setSelectedBlockId(id)
  }

  const selectTodo = (id: string) => {
    setSelectedBlockId(null)
    setSelectedTodoId(id)
  }
  const todayKey = dateKey(new Date())
  const weekStart = startOfWeek(cursor)
  const monthAnchor = startOfMonth(cursor)

  const hourLabels: number[] = []
  for (let h = PLAN_START_HOUR; h <= PLAN_END_HOUR; h++) hourLabels.push(h)

  const getTodo = (id: string | null) => todos.find((t) => t.id === id)
  const getCategory = (id: string | null) => categories.find((c) => c.id === id)

  const colorForTodo = (todo: Todo | undefined): string => {
    if (!todo) return '#64748b'
    const cat = getCategory(todo.categoryId)
    if (cat) return cat.color
    const tag = tags.find((t) => (todo.tagIds ?? []).includes(t.id))
    return tag ? tag.color : '#64748b'
  }

  // -------- navigation --------
  const navigate = (dir: -1 | 1) => {
    if (view === 'day') setCursor((c) => addDays(c, dir))
    else if (view === 'week') setCursor((c) => addDays(c, dir * 7))
    else {
      const m = addMonths(cursor, dir)
      setCursor(m)
    }
  }

  const goToday = () => setCursor(new Date())

  const selectWeekday = (n: number) => {
    const monday = startOfWeek(cursor)
    setCursor(addDays(monday, n - 1))
  }

  // -------- keyboard hotkeys [ ] --------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const tag = t?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === '[') navigate(-1)
      else if (e.key === ']') navigate(1)
      else if (e.key === 't') goToday()
      else if (e.key === 'm') setView('month')
      else if (e.key === 'd') setView('day')
      else if (e.key === 'w') setView('week')
      else if (view === 'week' && e.key >= '1' && e.key <= '5') selectWeekday(Number(e.key))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, cursor])

  // -------- block creation --------
  const snapStartMinute = (minuteOffset: number) => {
    const raw = PLAN_START_HOUR * 60 + minuteOffset
    const snapped = Math.round(raw / 30) * 30
    return Math.min(Math.max(snapped, PLAN_START_HOUR * 60), PLAN_END_HOUR * 60 - 60)
  }

  const handleDrop = (date: string, minuteOffset: number) => {
    if (!draggingTaskId) return
    const startMinute = snapStartMinute(minuteOffset)
    const block: Omit<TimeBlock, 'id'> = {
      date,
      startMinute,
      durationMin: 60,
      taskId: draggingTaskId,
      title: null,
      description: '',
      color: colorForTodo(getTodo(draggingTaskId)),
      meeting: false,
      recurrence: null,
    }
    onAddBlock(block)
    setDraggingTaskId(null)
  }

  const handleDropOnDay = (date: string) => {
    if (!draggingTaskId) return
    const block: Omit<TimeBlock, 'id'> = {
      date,
      startMinute: 9 * 60,
      durationMin: 60,
      taskId: draggingTaskId,
      title: null,
      description: '',
      color: colorForTodo(getTodo(draggingTaskId)),
      meeting: false,
      recurrence: null,
    }
    onAddBlock(block)
    setDraggingTaskId(null)
  }

  const handleGridClick = (date: string, minuteOffset: number) => {
    const id = onAddTaskBlock(date, snapStartMinute(minuteOffset), 'New task')
    setSelectedBlockId(id)
  }

  const handleOpenDay = (date: string) => {
    setCursor(new Date(date + 'T00:00:00'))
    setView('day')
  }

  // -------- scheduled tasks (anywhere) --------
  const scheduledTaskIds = new Set<string>()
  for (const b of blocks) {
    if (b.taskId) scheduledTaskIds.add(b.taskId)
  }
  const unplannedTodos = todos.filter((t) => !t.completed && !scheduledTaskIds.has(t.id))

  // -------- header label --------
  let title = ''
  if (view === 'day') {
    title = fmtMonthDay(cursor)
  } else if (view === 'week') {
    const monday = startOfWeek(cursor)
    const friday = addDays(monday, 4)
    title = `${fmtMonthDay(monday)} — ${fmtMonthDay(friday)}, ${monday.getFullYear()}`
  } else {
    title = `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`
  }

  const isCurrent = view === 'month'
    ? cursor.getMonth() === new Date().getMonth() && cursor.getFullYear() === new Date().getFullYear()
    : dateKey(cursor) === todayKey

  // weekday label for the selected block
  const blockWeekday = selectedBlock
    ? new Date(selectedBlock.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    : ''

  return (
    <div className="bg-surface rounded-xl shadow-md border border-border p-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="text-center flex-1">
          <h3 className="text-lg font-semibold text-text">{title}</h3>
          {!isCurrent && (
            <button onClick={goToday} className="text-xs text-primary hover:underline">
              Today
            </button>
          )}
        </div>

        <button
          onClick={() => navigate(1)}
          className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* View toggle */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex rounded-lg bg-surface-alt border border-border p-0.5">
          {(['day', 'week', 'month'] as View[]).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                view === v ? 'bg-primary text-white' : 'text-text-muted hover:text-text'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-[1fr_220px] gap-4">
        {/* Main view */}
        <div>
          {view === 'week' && (
            <WeekGrid
              weekStart={weekStart}
              blocks={blocks}
              todos={todos}
              categories={categories}
              tags={tags}
              selectedBlockId={selectedBlockId}
              todayKey={todayKey}
              focusedDay={Math.min(4, Math.max(0, cursor.getDay() - 1))}
              onSelectBlock={selectBlock}
              onDrop={handleDrop}
              onGridClick={handleGridClick}
              onToggleTask={onToggleTask}
              onRemoveBlock={onDeleteBlock}
            />
          )}
          {view === 'day' && (
            <div className="grid grid-cols-[40px_1fr] border border-border rounded-lg overflow-hidden">
              <div className="relative bg-surface-alt/50">
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
              <DayColumn
                date={dateKey(cursor)}
                blocks={blocks.filter((b) => b.date === dateKey(cursor))}
                todos={todos}
                categories={categories}
                tags={tags}
                selectedBlockId={selectedBlockId}
                isToday={true}
                onSelectBlock={selectBlock}
                onDrop={handleDrop}
                onGridClick={handleGridClick}
                onToggleTask={onToggleTask}
                onRemoveBlock={onDeleteBlock}
              />
            </div>
          )}
          {view === 'month' && (
            <MonthGrid
              monthAnchor={monthAnchor}
              blocks={blocks}
              todos={todos}
              categories={categories}
              tags={tags}
              selectedBlockId={selectedBlockId}
              todayKey={todayKey}
              onSelectBlock={selectBlock}
              onOpenDay={handleOpenDay}
              onDropOnDay={handleDropOnDay}
            />
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {selectedQueueTodo ? (
            <TodoDetails
              todo={selectedQueueTodo}
              categories={categories}
              tags={tags}
              onClose={() => setSelectedTodoId(null)}
              onUpdateTodo={onUpdateTodo}
              onSetCategory={onSetCategory}
              onSetDueDate={onSetDueDate}
              onSetTags={onSetTags}
              onSetDescription={onSetDescription}
              onToggle={onToggleTask}
              onDelete={onDeleteTodo}
            />
          ) : selectedBlock ? (
            <BlockDetails
              block={selectedBlock}
              todo={getTodo(selectedBlock.taskId)}
              weekLabel={blockWeekday}
              onClose={() => setSelectedBlockId(null)}
              onUpdate={onUpdateBlock}
              onUpdateTodo={onUpdateTodo}
              onDelete={onDeleteBlock}
            />
          ) : (
            <div className="bg-surface-alt rounded-lg p-3 border border-border">
              <p className="text-xs text-text-muted">Select a block or task to edit details.</p>
            </div>
          )}

          {/* Unplanned todos to drag */}
          <div className="bg-surface-alt rounded-lg p-3 border border-border">
            <h4 className="text-sm font-semibold text-text mb-2">Drag a task to schedule</h4>
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {unplannedTodos.length === 0 && (
                <p className="text-xs text-text-muted">All tasks scheduled. Nice!</p>
              )}
              {unplannedTodos.map((todo) => (
                <div
                  key={todo.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', todo.id)
                    setDraggingTaskId(todo.id)
                  }}
                  onClick={() => selectTodo(todo.id)}
                  className={`px-2.5 py-1.5 bg-surface rounded-md border text-sm text-text flex items-center gap-2 hover:shadow-sm cursor-pointer ${
                    selectedTodoId === todo.id
                      ? 'border-primary ring-1 ring-primary/40 cursor-grab'
                      : 'border-border cursor-grab hover:border-primary/40'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: colorForTodo(todo) }} />
                  <span className="truncate">{todo.text}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
