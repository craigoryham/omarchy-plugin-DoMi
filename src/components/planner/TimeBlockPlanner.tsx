import { useEffect, useState } from 'react'
import type { Todo, Category, Tag, TimeBlock, WeeklyPlans, WeekNotes } from '../../types'
import { addDays, addMonths, dateKey, startOfMonth, startOfWeek } from './date'
import { WeekGrid } from './WeekGrid'
import { MonthGrid } from './MonthGrid'
import { BlockDetails } from './BlockDetails'
import { TodoDetails } from './TodoDetails'
import { WeekView } from '../WeekView'
import { PLAN_START_HOUR, PLAN_END_HOUR } from '../../types'

interface TimeBlockPlannerProps {
  blocks: TimeBlock[]
  todos: Todo[]
  queueTodoIds: string[]
  weeklyPlans: WeeklyPlans
  weekNotes: WeekNotes
  categories: Category[]
  tags: Tag[]
  onAddBlock: (block: Omit<TimeBlock, 'id'>) => void
  onUpdateBlock: (id: string, patch: Partial<TimeBlock>) => void
  onDeleteBlock: (id: string) => void
  onAddTaskBlock: (date: string, startMinute: number, text: string) => string
  onToggleTask: (id: string) => void
  onToggleInWeek: (id: string, weekKey: string) => void
  onSetWeekNote: (weekKey: string, text: string) => void
  onUpdateTodo: (id: string, text: string) => void
  onSetCategory: (id: string, categoryId: string | null) => void
  onSetDueDate: (id: string, dueDate: string | null) => void
  onSetTags: (id: string, tagIds: string[]) => void
  onSetDescription: (id: string, description: string) => void
  onDeleteTodo: (id: string) => void
}

type View = 'day' | 'workweek' | 'week7' | 'month' | 'preview' | 'ahead'

const VIEW_LABELS: Record<View, string> = {
  day: 'Day',
  workweek: 'Work Week',
  week7: '7 Day',
  month: 'Month',
  preview: 'Preview',
  ahead: 'Ahead',
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function fmtMonthDay(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const VIEW_OPTIONS: View[] = ['day', 'workweek', 'week7', 'month']
const WEEK_SURFACE_OPTIONS: View[] = ['preview', 'ahead']
const ALL_VIEW_OPTIONS: View[] = [...VIEW_OPTIONS, ...WEEK_SURFACE_OPTIONS]
const PILL_ORDER: View[] = ['preview', 'day', 'workweek', 'week7', 'ahead', 'month']
const SEPARATOR_AFTER: View = 'ahead'

const VIEW_STORAGE_KEY = 'domi-view-mode'

function loadSavedView(): View {
  const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(VIEW_STORAGE_KEY) : null
  return (ALL_VIEW_OPTIONS as string[]).includes(saved ?? '') ? (saved as View) : 'workweek'
}

export function TimeBlockPlanner({
  blocks,
  todos,
  queueTodoIds,
  weeklyPlans,
  weekNotes,
  categories,
  tags,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onAddTaskBlock,
  onToggleTask,
  onToggleInWeek,
  onSetWeekNote,
  onUpdateTodo,
  onSetCategory,
  onSetDueDate,
  onSetTags,
  onSetDescription,
  onDeleteTodo,
}: TimeBlockPlannerProps) {
  const [view, setView] = useState<View>(loadSavedView)
  const [cursor, setCursor] = useState<Date>(() => new Date())
  useEffect(() => {
    localStorage.setItem(VIEW_STORAGE_KEY, view)
  }, [view])
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
  const weekDayCount = view === 'week7' ? 7 : view === 'day' ? 1 : 5
  const focusedDay = Math.min(weekDayCount - 1, (cursor.getDay() + 6) % 7)
  const density = view === 'day' ? 'full' : view === 'week7' ? 'minimal' : 'compact'

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
    else if (view === 'workweek' || view === 'week7') setCursor((c) => addDays(c, dir * 7))
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
      if (WEEK_SURFACE_OPTIONS.includes(view)) {
        // Preview/Ahead weeks are fixed scopes; cursor nav is inert here.
        if (e.key === 'm') setView('month')
        else if (e.key === 'd') setView('day')
        else if (e.key === 'w') setView('workweek')
        return
      }
      if (e.key === '[') navigate(-1)
      else if (e.key === ']') navigate(1)
      else if (e.key === 't') goToday()
      else if (e.key === 'm') setView('month')
      else if (e.key === 'd') setView('day')
      else if (e.key === 'w') setView('workweek')
      else if ((view === 'workweek' || view === 'week7') && e.key >= '1' && e.key <= String(weekDayCount)) selectWeekday(Number(e.key))
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

  // -------- weekly queue (this week's loaded tasks) --------
  const scheduledTaskIds = new Set<string>()
  for (const b of blocks) {
    if (b.taskId) scheduledTaskIds.add(b.taskId)
  }
  const todosById = new Map(todos.map((t) => [t.id, t]))
  const weekTodos = queueTodoIds
    .map((id) => todosById.get(id))
    .filter((t): t is Todo => t !== undefined)
  const unplannedTodos = weekTodos.filter(
    (t) => !t.completed && !scheduledTaskIds.has(t.id)
  )
  const completedWeekTodos = weekTodos.filter((t) => t.completed)

  const isCurrent = view === 'month'
    ? cursor.getMonth() === new Date().getMonth() && cursor.getFullYear() === new Date().getFullYear()
    : dateKey(cursor) === todayKey

  // -------- header label --------
  let title = ''
  if (view === 'day') {
    title = fmtMonthDay(cursor)
  } else if (view === 'workweek' || view === 'week7') {
    const monday = startOfWeek(cursor)
    const last = addDays(monday, view === 'week7' ? 6 : 4)
    title = `${fmtMonthDay(monday)} — ${fmtMonthDay(last)}, ${monday.getFullYear()}`
  } else {
    title = `${MONTH_NAMES[cursor.getMonth()]} ${cursor.getFullYear()}`
  }

  // weekday label for the selected block
  const blockWeekday = selectedBlock
    ? new Date(selectedBlock.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    : ''

  const weekSurface = WEEK_SURFACE_OPTIONS.includes(view)
  const pill = (v: View) => (
    <button
      key={v}
      onClick={() => setView(v)}
      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
        view === v ? 'bg-primary text-white' : 'text-text-muted hover:text-text'
      }`}
    >
      {VIEW_LABELS[v]}
    </button>
  )

  return (
    <>
    <div className={weekSurface ? '' : 'lg:grid lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-4 lg:items-start'}>
      <div>
      {/* View toggle */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex items-center rounded-lg bg-surface-alt border border-border p-0.5">
          {PILL_ORDER.map((v) => (
            <>
              {pill(v)}
              {v === SEPARATOR_AFTER && <span className="w-px self-stretch bg-border mx-1" />}
            </>
          ))}
        </div>
      </div>
      {weekSurface ? (
        <WeekView
          offset={view === 'ahead' ? 1 : 0}
          todos={todos}
          categories={categories}
          tags={tags}
          weeklyPlans={weeklyPlans}
          weekNotes={weekNotes}
          onToggleInWeek={onToggleInWeek}
          onSetWeekNote={onSetWeekNote}
        />
      ) : (
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

      <div>
        {/* Main view */}
        <div>
          {(view === 'workweek' || view === 'week7' || view === 'day') && (
            <WeekGrid
              weekStart={view === 'day' ? cursor : weekStart}
              dayCount={weekDayCount}
              blocks={blocks}
              todos={todos}
              categories={categories}
              tags={tags}
              selectedBlockId={selectedBlockId}
              todayKey={todayKey}
              focusedDay={focusedDay}
              density={density}
              onSelectBlock={selectBlock}
              onDrop={handleDrop}
              onGridClick={handleGridClick}
              onToggleTask={onToggleTask}
              onRemoveBlock={onDeleteBlock}
            />
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

        </div>
      </div>
      )}
    </div>

    {/* Right rail — task queue + details (hidden on week surfaces) */}
    {!weekSurface && (
    <div className="mt-4 lg:mt-0 space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <div className="bg-surface rounded-xl shadow-md border border-border p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-text">This week's tasks</h4>
          <span className="text-xs text-text-muted tabular-nums">{unplannedTodos.length}</span>
        </div>
        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
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
          {completedWeekTodos.length > 0 && (
            <>
              <div className="flex items-center gap-3 pt-1">
                <div className="h-px flex-1 bg-border" />
                <span className="text-[10px] text-text-muted font-medium">
                  Done · {completedWeekTodos.length}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
              {completedWeekTodos.map((todo) => (
                <div
                  key={todo.id}
                  onClick={() => selectTodo(todo.id)}
                  className={`px-2.5 py-1.5 bg-surface rounded-md border text-sm flex items-center gap-2 cursor-pointer hover:shadow-sm ${
                    selectedTodoId === todo.id
                      ? 'border-primary ring-1 ring-primary/40'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0 opacity-50" style={{ backgroundColor: colorForTodo(todo) }} />
                  <span className="truncate text-text-muted line-through">{todo.text}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

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
      ) : null}
    </div>
    )}
    </div>
    </>
  )
}
