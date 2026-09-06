import { useState, useRef, useEffect } from 'react'
import type { Todo, Category, Tag } from '../types'

interface TodoItemProps {
  todo: Todo
  category: Category | undefined
  categories: Category[]
  tags: Tag[]
  inWeek: boolean
  highlighted?: boolean
  onToggleWeek: () => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, text: string) => void
  onSetTags: (id: string, tagIds: string[]) => void
  onSetDescription: (id: string, description: string) => void
  onSetCategory: (id: string, categoryId: string | null) => void
  onSetDueDate: (id: string, dueDate: string | null) => void
}

export function TodoItem({ todo, category, categories, tags, inWeek, highlighted, onToggleWeek, onToggle, onDelete, onEdit, onSetTags, onSetDescription, onSetCategory, onSetDueDate }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(todo.text)
  const [showTags, setShowTags] = useState(false)
  const [tagDraft, setTagDraft] = useState<string[]>(todo.tagIds ?? [])
  const [showDescription, setShowDescription] = useState(false)
  const [descDraft, setDescDraft] = useState(todo.description ?? '')
  const [editingMeta, setEditingMeta] = useState<'category' | 'due' | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const itemRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (highlighted) {
      itemRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlighted])

  useEffect(() => {
    if (isEditing) inputRef.current?.focus()
  }, [isEditing])

  useEffect(() => {
    if (showTags) setTagDraft(todo.tagIds)
  }, [showTags, todo.tagIds])

  useEffect(() => {
    if (!showTags) return
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowTags(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showTags])

  const handleSave = () => {
    const trimmed = editText.trim()
    if (trimmed && trimmed !== todo.text) {
      onEdit(todo.id, trimmed)
    } else {
      setEditText(todo.text)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') {
      setEditText(todo.text)
      setIsEditing(false)
    }
  }

  const toggleDraftTag = (id: string) => {
    setTagDraft((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  const commitTags = () => {
    onSetTags(todo.id, tagDraft)
    setShowTags(false)
  }

  const toggleDescription = () => {
    if (showDescription) {
      onSetDescription(todo.id, descDraft)
      setShowDescription(false)
    } else {
      setDescDraft(todo.description ?? '')
      setShowDescription(true)
    }
  }

  const isOverdue =
    todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date(new Date().toDateString())

  const todoTags = tags.filter((t) => (todo.tagIds ?? []).includes(t.id))

  return (
    <div
      ref={itemRef}
      className={`group relative flex flex-col gap-3 p-4 rounded-xl border transition-all duration-200 animate-slide-in ${
        highlighted ? 'ring-2 ring-primary/50 shadow-lg' : ''
      } ${
        todo.completed
          ? 'bg-surface-alt/50 border-border-light'
          : isOverdue
          ? 'bg-danger-light border-danger/20 hover:border-danger/40'
          : 'bg-surface border-border hover:border-primary/30 hover:shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3">
      {/* Checkbox */}
      <button
        onClick={() => onToggle(todo.id)}
        className={`flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center ${
          todo.completed
            ? 'bg-success border-success'
            : 'border-text-muted hover:border-primary'
        }`}
      >
        {todo.completed && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-1 rounded bg-surface-alt border border-primary/30 text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        ) : (
          <p
            onDoubleClick={() => !todo.completed && setIsEditing(true)}
            className={`text-text truncate ${
              todo.completed ? 'line-through text-text-muted' : ''
            }`}
          >
            {todo.text}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {inWeek && (
            <span
              title="Loaded into this week's queue"
              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary inline-flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v2m8-2v2M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
              </svg>
              This week
            </span>
          )}
          {editingMeta === 'category' ? (
            <select
              autoFocus
              value={todo.categoryId ?? ''}
              onChange={(e) => {
                onSetCategory(todo.id, e.target.value || null)
                setEditingMeta(null)
              }}
              onBlur={() => setEditingMeta(null)}
              className="text-[10px] px-1.5 py-0.5 rounded bg-surface-alt border border-primary/30 text-text focus:outline-none focus:ring-1 focus:ring-primary/30"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          ) : category ? (
            <button
              onClick={() => setEditingMeta('category')}
              title="Change category"
              className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white cursor-pointer hover:opacity-80 transition-opacity"
              style={{ backgroundColor: category.color }}
            >
              {category.name}
            </button>
          ) : (
            <button
              onClick={() => setEditingMeta('category')}
              title="Add category"
              className="text-[10px] px-2 py-0.5 rounded-full border border-dashed border-border-light text-text-muted hover:border-text-muted hover:text-text transition-colors"
            >
              + Category
            </button>
          )}
          {editingMeta === 'due' ? (
            <input
              type="date"
              autoFocus
              value={todo.dueDate ?? ''}
              onChange={(e) => onSetDueDate(todo.id, e.target.value || null)}
              onBlur={() => setEditingMeta(null)}
              onKeyDown={(e) => e.key === 'Escape' && setEditingMeta(null)}
              className="text-[10px] px-1.5 py-0.5 rounded bg-surface-alt border border-primary/30 text-text focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          ) : todo.dueDate ? (
            <button
              onClick={() => setEditingMeta('due')}
              title="Change due date"
              className={`text-[10px] cursor-pointer hover:underline ${
                isOverdue ? 'text-danger font-medium' : 'text-text-muted'
              }`}
            >
              {isOverdue ? 'Overdue' : ''} {new Date(todo.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </button>
          ) : (
            <button
              onClick={() => setEditingMeta('due')}
              title="Add due date"
              className="text-[10px] px-2 py-0.5 rounded-full border border-dashed border-border-light text-text-muted hover:border-text-muted hover:text-text transition-colors"
            >
              + Due
            </button>
          )}
          {todoTags.map((t) => (
            <span
              key={t.id}
              className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: t.color }}
            >
              {t.name}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!todo.completed && (
          <button
            onClick={onToggleWeek}
            className={`p-1.5 rounded-lg transition-colors ${
              inWeek
                ? 'text-primary hover:bg-primary/10'
                : 'text-text-muted hover:text-primary hover:bg-primary/10'
            }`}
            title={inWeek ? 'Remove from this week' : 'Add to this week'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v2m8-2v2M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zM12 11v6M9 14h6" />
            </svg>
          </button>
        )}
        {!todo.completed && (
          <button
            onClick={() => setIsEditing(true)}
            className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
            title="Edit"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        )}
        <button
          onClick={() => setShowTags(true)}
          className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
          title="Tags"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5a1.99 1.99 0 011.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(todo.id)}
          className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
          title="Delete"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      </div>

      {/* Description (expandable) */}
      {(todo.description || showDescription) && (
        <div className="ml-8 border-t border-border-light pt-2 animate-fade-in">
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-1 text-[10px] text-text-muted font-medium flex-shrink-0 mt-1">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Notes
            </div>
            {showDescription ? (
              <textarea
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                rows={2}
                placeholder="Add a description..."
                autoFocus
                className="flex-1 px-2 py-1 rounded bg-surface-alt border border-border-light text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
              />
            ) : (
              <p className="flex-1 text-sm text-text-secondary whitespace-pre-wrap break-words">
                {todo.description}
              </p>
            )}
            <button
              onClick={toggleDescription}
              className="flex-shrink-0 self-start p-1 rounded-md text-text-muted hover:text-primary hover:bg-primary/10 transition-colors"
              title={showDescription ? 'Save & collapse' : 'Edit'}
            >
              {showDescription ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Tag popover */}
      {showTags && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-full mt-2 z-20 w-64 bg-surface rounded-xl shadow-lg border border-border p-3 animate-scale-in"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-text">Edit tags</span>
            <button
              onClick={() => setShowTags(false)}
              className="p-1 rounded text-text-muted hover:text-text transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
            {tags.map((tag) => {
              const active = tagDraft.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleDraftTag(tag.id)}
                  className={`px-2 py-1 rounded-full text-xs font-medium transition-all border ${
                    active
                      ? 'text-white border-transparent'
                      : 'bg-surface text-text-muted border-border hover:border-text-muted'
                  }`}
                  style={active ? { backgroundColor: tag.color } : undefined}
                >
                  {tag.name}
                </button>
              )
            })}
            {tags.length === 0 && (
              <p className="text-xs text-text-muted">Manage tags to create some.</p>
            )}
          </div>
          <div className="mt-3 flex justify-end">
            <button
              onClick={commitTags}
              className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-medium rounded-lg transition-all"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
