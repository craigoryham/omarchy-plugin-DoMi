import { useState } from 'react'
import type { Tag } from '../types'
import { TAG_COLORS } from '../types'

interface TagManagerProps {
  tags: Tag[]
  onAdd: (name: string, color: string) => void
  onDelete: (id: string) => void
  onClose: () => void
}

export function TagManager({ tags, onAdd, onDelete, onClose }: TagManagerProps) {
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(TAG_COLORS[0])

  const handleAdd = () => {
    const trimmed = newName.trim()
    if (!trimmed) return
    onAdd(trimmed, newColor)
    setNewName('')
    setNewColor(TAG_COLORS[0])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd()
    if (e.key === 'Escape') onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface rounded-xl shadow-lg border border-border p-6 w-full max-w-sm mx-4 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text">Manage Tags</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-alt transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Add new */}
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tag name"
            className="flex-1 px-3 py-2 rounded-lg bg-surface-alt border border-border-light text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <button
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="px-3 py-2 bg-primary hover:bg-primary-dark disabled:bg-primary/50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-all"
          >
            Add
          </button>
        </div>

        {/* Color picker */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {TAG_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => setNewColor(color)}
              className={`w-7 h-7 rounded-full transition-all ${
                newColor === color ? 'ring-2 ring-offset-2 ring-text-muted scale-110' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Existing tags */}
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface-alt"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="text-sm text-text">{tag.name}</span>
              </div>
              <button
                onClick={() => onDelete(tag.id)}
                className="p-1 rounded text-text-muted hover:text-danger hover:bg-danger/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
