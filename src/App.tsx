import { useMemo, useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Category, Tag, Todo, TimeBlock, WeeklyPlans } from './types'
import { DEFAULT_CATEGORIES, DEFAULT_TAGS } from './types'
import { dateKey, startOfWeek } from './components/planner/date'
import { useLocalStorage } from './hooks/useLocalStorage'
import { useBlockExporter } from './hooks/useBlockExporter'
import { useTheme } from './hooks/useTheme'
import { TabBar } from './components/TabBar'
import { TodoForm } from './components/TodoForm'
import { TodoList } from './components/TodoList'
import { CategoryFilter } from './components/CategoryFilter'
import { TagManager } from './components/TagManager'
import { TimeBlockPlanner } from './components/planner/TimeBlockPlanner'

type FilterStatus = 'all' | 'active' | 'completed'
type ActiveTab = 'tasks' | 'timeblock'

export default function App() {
  const { theme, cycle, paletteThemeName } = useTheme()
  const [activeTab, setActiveTab] = useState<ActiveTab>('tasks')
  const [todos, setTodos] = useLocalStorage<Todo[]>('domi-todos', [])
  const [categories] = useLocalStorage<Category[]>(
    'domi-categories',
    DEFAULT_CATEGORIES
  )
  const [tags, setTags] = useLocalStorage<Tag[]>('domi-tags', DEFAULT_TAGS)
  const [blocks, setBlocks] = useLocalStorage<TimeBlock[]>('domi-blocks', [])
  const [weeklyPlans, setWeeklyPlans] = useLocalStorage<WeeklyPlans>(
    'domi-weekly-plans',
    {}
  )
  const currentWeekKey = dateKey(startOfWeek(new Date()))
  const currentWeekTodoIds = weeklyPlans[currentWeekKey] ?? []
  const exportBlocks = useMemo(
    () =>
      blocks.map((b) =>
        b.taskId
          ? { ...b, title: todos.find((t) => t.id === b.taskId)?.text ?? b.title }
          : b
      ),
    [blocks, todos]
  )
  useBlockExporter(exportBlocks)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [filterTag, setFilterTag] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all')
  const [showTagManager, setShowTagManager] = useState(false)

  // Migrate legacy todos that predate newer fields: ensure every todo has
  // `tagIds` and `description` so rendering never hits undefined access.
  let needsMigration = false
  for (const t of todos) {
    if (!Array.isArray(t.tagIds) || typeof t.description !== 'string') {
      needsMigration = true
      break
    }
  }
  if (needsMigration) {
    setTodos((prev) => prev.map((t) => ({
      ...t,
      tagIds: Array.isArray(t.tagIds) ? t.tagIds : [],
      description: typeof t.description === 'string' ? t.description : '',
    })))
  }

  // Ensure legacy time blocks carry a description field.
  let blocksNeedMigration = false
  for (const b of blocks) {
    if (typeof b.description !== 'string') {
      blocksNeedMigration = true
      break
    }
  }
  if (blocksNeedMigration) {
    setBlocks((prev) => prev.map((b) => ({
      ...b,
      description: typeof b.description === 'string' ? b.description : '',
    })))
  }

  // Backfill: every plan block should be backed by a task so the Tasks
  // view is a complete list of everything planned.
  const orphanBlocks = blocks.filter((b) => !b.taskId)
  if (orphanBlocks.length > 0) {
    const backfilled: Todo[] = orphanBlocks.map((b) => ({
      id: uuidv4(),
      text: b.title || 'Untitled',
      description: b.description ?? '',
      completed: false,
      categoryId: null,
      tagIds: [],
      dueDate: b.date,
      createdAt: new Date().toISOString(),
    }))
    const linkByBlockId = new Map<string, string>()
    orphanBlocks.forEach((b, i) => linkByBlockId.set(b.id, backfilled[i].id))
    setTodos((prev) => [...prev, ...backfilled])
    setBlocks((prev) =>
      prev.map((b) => {
        const todoId = linkByBlockId.get(b.id)
        return todoId ? { ...b, taskId: todoId, title: null } : b
      })
    )
  }

  // Weekly plans: on week rollover (or first ever run) seed the current
  // week. Idempotent — once the current week key exists (even if emptied)
  // this never fires again. Carry-over pulls incomplete members forward from
  // the most recent prior week; the very first run seeds from the unscheduled
  // inventory so the queue doesn't boot empty.
  if (!(currentWeekKey in weeklyPlans)) {
    const priorKeys = Object.keys(weeklyPlans)
      .filter((k) => k < currentWeekKey)
      .sort()
    const priorKey = priorKeys[priorKeys.length - 1]
    const todosById = new Map(todos.map((t) => [t.id, t]))
    let memberIds: string[]
    if (priorKey) {
      memberIds = (weeklyPlans[priorKey] ?? []).filter(
        (id) => todosById.has(id) && !todosById.get(id)?.completed
      )
    } else {
      const scheduled = new Set(blocks.filter((b) => b.taskId).map((b) => b.taskId))
      memberIds = todos
        .filter((t) => !t.completed && !scheduled.has(t.id))
        .map((t) => t.id)
    }
    setWeeklyPlans((prev) => ({ ...prev, [currentWeekKey]: memberIds }))
  }

  const addTodo = (text: string, categoryId: string | null, tagIds: string[], dueDate: string | null, description = '') => {
    const newTodo: Todo = {
      id: uuidv4(),
      text,
      description,
      completed: false,
      categoryId,
      tagIds,
      dueDate,
      createdAt: new Date().toISOString(),
    }
    setTodos((prev) => [newTodo, ...prev])
  }

  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }

  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id))
    setBlocks((prev) => prev.filter((b) => b.taskId !== id))
    setWeeklyPlans((prev) => {
      const next: WeeklyPlans = {}
      for (const week in prev) {
        const filtered = prev[week].filter((todoId) => todoId !== id)
        if (filtered.length > 0 || week === currentWeekKey) next[week] = filtered
      }
      return next
    })
  }

  const editTodo = (id: string, text: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, text } : t))
    )
  }

  const setTodoTags = (id: string, tagIds: string[]) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, tagIds } : t))
    )
  }

  const setTodoDescription = (id: string, description: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, description } : t))
    )
  }

  const setTodoCategory = (id: string, categoryId: string | null) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, categoryId } : t))
    )
  }

  const setTodoDueDate = (id: string, dueDate: string | null) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, dueDate } : t))
    )
  }

  const addTag = (name: string, color: string) => {
    const newTag: Tag = { id: `tag-${uuidv4()}`, name, color }
    setTags((prev) => [...prev, newTag])
  }

  const deleteTag = (id: string) => {
    setTags((prev) => prev.filter((t) => t.id !== id))
    setTodos((prev) =>
      prev.map((t) => ({ ...t, tagIds: (t.tagIds ?? []).filter((tid) => tid !== id) }))
    )
    if (filterTag === id) setFilterTag(null)
  }

  const addBlock = (block: Omit<TimeBlock, 'id'>) => {
    const newBlock: TimeBlock = { ...block, id: uuidv4() }
    setBlocks((prev) => [...prev, newBlock])
  }

  const addTaskBlock = (date: string, startMinute: number, text: string) => {
    const todo: Todo = {
      id: uuidv4(),
      text,
      description: '',
      completed: false,
      categoryId: null,
      tagIds: [],
      dueDate: date,
      createdAt: new Date().toISOString(),
    }
    const block: TimeBlock = {
      id: uuidv4(),
      date,
      startMinute,
      durationMin: 60,
      taskId: todo.id,
      title: null,
      description: '',
      color: '#64748b',
      meeting: false,
      recurrence: null,
    }
    setTodos((prev) => [todo, ...prev])
    setBlocks((prev) => [...prev, block])
    addTasksToWeek([todo.id])
    return block.id
  }

  // ---- Weekly plan membership ----
  const addTasksToWeek = (ids: string[]) => {
    setWeeklyPlans((prev) => {
      const existing = prev[currentWeekKey] ?? []
      const merged = [...existing, ...ids.filter((id) => !existing.includes(id))]
      return { ...prev, [currentWeekKey]: merged }
    })
  }

  const toggleTaskInWeek = (id: string) => {
    setWeeklyPlans((prev) => {
      const existing = prev[currentWeekKey] ?? []
      return existing.includes(id)
        ? { ...prev, [currentWeekKey]: existing.filter((x) => x !== id) }
        : { ...prev, [currentWeekKey]: [...existing, id] }
    })
  }

  const updateBlock = (id: string, patch: Partial<TimeBlock>) => {
    setBlocks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)))
  }

  const deleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id))
  }

  const filteredTodos = todos.filter((todo) => {
    if (filterCategory && todo.categoryId !== filterCategory) return false
    if (filterTag && !(todo.tagIds ?? []).includes(filterTag)) return false
    if (filterStatus === 'active' && todo.completed) return false
    if (filterStatus === 'completed' && !todo.completed) return false
    return true
  })

  const stats = {
    total: todos.length,
    active: todos.filter((t) => !t.completed).length,
    completed: todos.filter((t) => t.completed).length,
  }

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      {/* Theme cycle button */}
      <button
        onClick={cycle}
        title={`Theme: ${theme[0].toUpperCase() + theme.slice(1)} (click to cycle)`}
        className="fixed top-4 right-4 z-50 px-3 py-2 rounded-lg bg-surface border border-border text-text-secondary hover:text-text hover:bg-surface-hover shadow-sm transition-colors flex items-center gap-2"
      >
        {theme === 'dark' ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        ) : theme === 'light' ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        )}
        <span className="text-sm font-medium capitalize">
          {theme === 'system' && paletteThemeName ? `System · ${paletteThemeName}` : theme}
        </span>
      </button>

      <div className={`${activeTab === 'timeblock' ? 'max-w-6xl' : 'max-w-3xl'} mx-auto`}>
        {/* Header */}
        <header className="text-center mb-8 animate-fade-in">
          <h1 className="text-5xl font-bold text-primary mb-2 tracking-tight">
            DoMi
          </h1>
          <p className="text-text-secondary text-lg">
            Do more. Stay organized.
          </p>
          {activeTab === 'tasks' && (
            <div className="flex justify-center gap-6 mt-4 text-sm text-text-muted">
              <span>
                <strong className="text-text font-semibold">{stats.total}</strong> total
              </span>
              <span>
                <strong className="text-primary font-semibold">{stats.active}</strong> active
              </span>
              <span>
                <strong className="text-success font-semibold">{stats.completed}</strong> done
              </span>
            </div>
          )}
        </header>

        {/* Tab bar */}
        <div className="animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <TabBar active={activeTab} onChange={setActiveTab} />
        </div>

        {/* Planner view */}
        {activeTab === 'timeblock' ? (
          <div className="mt-6 animate-fade-in">
            <TimeBlockPlanner
              blocks={blocks}
              todos={todos}
              queueTodoIds={currentWeekTodoIds}
              categories={categories}
              tags={tags}
              onAddBlock={addBlock}
              onUpdateBlock={updateBlock}
              onDeleteBlock={deleteBlock}
              onAddTaskBlock={addTaskBlock}
              onToggleTask={toggleTodo}
              onUpdateTodo={editTodo}
              onSetCategory={setTodoCategory}
              onSetDueDate={setTodoDueDate}
              onSetTags={setTodoTags}
              onSetDescription={setTodoDescription}
              onDeleteTodo={deleteTodo}
            />
          </div>
        ) : (
          <>
            {/* Todo Form */}
            <div className="mt-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <TodoForm
                categories={categories}
                tags={tags}
                onAdd={addTodo}
              />
            </div>

            {/* Filters */}
            <div className="mt-6 animate-fade-in" style={{ animationDelay: '0.15s' }}>
              <CategoryFilter
                categories={categories}
                tags={tags}
                activeCategory={filterCategory}
                activeTag={filterTag}
                activeStatus={filterStatus}
                onSelectCategory={setFilterCategory}
                onSelectTag={setFilterTag}
                onSelectStatus={setFilterStatus}
                onManageTags={() => setShowTagManager(true)}
              />
            </div>

            {/* Tag Manager Modal */}
            {showTagManager && (
              <TagManager
                tags={tags}
                onAdd={addTag}
                onDelete={deleteTag}
                onClose={() => setShowTagManager(false)}
              />
            )}

            {/* Todo List */}
            <div className="mt-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <TodoList
                todos={filteredTodos}
                categories={categories}
                tags={tags}
                weekTodoIds={currentWeekTodoIds}
                onToggleWeek={toggleTaskInWeek}
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onEdit={editTodo}
                onSetTags={setTodoTags}
                onSetDescription={setTodoDescription}
                onSetCategory={setTodoCategory}
                onSetDueDate={setTodoDueDate}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
