import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { Category, Tag, Todo, TimeBlock } from './types'
import { DEFAULT_CATEGORIES, DEFAULT_TAGS } from './types'
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
type ActiveTab = 'tasks' | 'plan'

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
  useBlockExporter(blocks)
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

      <div className="max-w-3xl mx-auto">
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
        {activeTab === 'plan' ? (
          <div className="mt-6 animate-fade-in">
            <TimeBlockPlanner
              blocks={blocks}
              todos={todos}
              categories={categories}
              tags={tags}
              onAddBlock={addBlock}
              onUpdateBlock={updateBlock}
              onDeleteBlock={deleteBlock}
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
                onToggle={toggleTodo}
                onDelete={deleteTodo}
                onEdit={editTodo}
                onSetTags={setTodoTags}
                onSetDescription={setTodoDescription}
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
