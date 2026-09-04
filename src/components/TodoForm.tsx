import { useState, useRef, useEffect } from 'react'
import type { Category, Tag } from '../types'

interface TodoFormProps {
  categories: Category[]
  tags: Tag[]
  onAdd: (text: string, categoryId: string | null, tagIds: string[], dueDate: string | null, description?: string) => void
}

export function TodoForm({ categories, tags, onAdd }: TodoFormProps) {
  const [text, setText] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [tagIds, setTagIds] = useState<string[]>([])
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [showOptions, setShowOptions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = text.trim()
    if (!trimmed) return
    onAdd(trimmed, categoryId, tagIds, dueDate || null, description.trim())
    setText('')
    setCategoryId(null)
    setTagIds([])
    setDueDate('')
    setDescription('')
    setShowOptions(false)
    inputRef.current?.focus()
  }

  const toggleTag = (id: string) => {
    setTagIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    )
  }

  const selectedCategory = categories.find((c) => c.id === categoryId)
  const selectedTags = tags.filter((t) => tagIds.includes(t.id))

  return (
    <form onSubmit={handleSubmit} className="bg-surface rounded-xl shadow-md border border-border p-4">
      <div className="flex gap-3">
        <input
          ref={inputRef}
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What needs to be done?"
          className="flex-1 px-4 py-3 rounded-lg bg-surface-alt border border-border-light text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="px-6 py-3 bg-primary hover:bg-primary-dark disabled:bg-primary/50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all active:scale-[0.97]"
        >
          Add
        </button>
      </div>

      {/* Toggle options */}
      <div className="flex items-center gap-2 mt-3">
        <button
          type="button"
          onClick={() => setShowOptions(!showOptions)}
          className="text-sm text-text-muted hover:text-primary transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d={showOptions ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
          </svg>
          {showOptions ? 'Less options' : 'More options'}
        </button>

        {selectedCategory && (
          <span
            className="text-xs px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: selectedCategory.color }}
          >
            {selectedCategory.name}
          </span>
        )}
        {selectedTags.map((t) => (
          <span
            key={t.id}
            className="text-xs px-2 py-0.5 rounded-full text-white"
            style={{ backgroundColor: t.color }}
          >
            {t.name}
          </span>
        ))}
        {dueDate && (
          <span className="text-xs text-text-muted">
            Due: {new Date(dueDate).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Expanded options */}
      {showOptions && (
        <div className="mt-3 pt-3 border-t border-border-light flex flex-wrap gap-3 animate-scale-in">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs text-text-muted mb-1">Category</label>
            <select
              value={categoryId || ''}
              onChange={(e) => setCategoryId(e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg bg-surface-alt border border-border-light text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs text-text-muted mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-surface-alt border border-border-light text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="w-full">
            <label className="block text-xs text-text-muted mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add optional details..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg bg-surface-alt border border-border-light text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
            />
          </div>
          <div className="w-full">
            <label className="block text-xs text-text-muted mb-1">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const active = tagIds.includes(tag.id)
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
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
            </div>
          </div>
        </div>
      )}
    </form>
  )
}
