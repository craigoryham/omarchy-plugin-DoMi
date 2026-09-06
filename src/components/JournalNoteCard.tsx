import { useState } from 'react'
import { MarkdownText } from './MarkdownText'

interface JournalNoteCardProps {
  weekLabel: string
  value: string
  onSave: (text: string) => void
}

export function JournalNoteCard({ weekLabel, value, onSave }: JournalNoteCardProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)

  const startEdit = () => {
    setDraft(value)
    setEditing(true)
  }

  const save = () => {
    setEditing(false)
    const next = draft.trim()
    if (next !== value.trim()) onSave(next)
  }

  return (
    <div className="bg-surface rounded-xl shadow-md border border-border p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-text flex items-center gap-1.5">
          <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          {weekLabel} note
        </h4>
        {!editing && (
          <button
            onClick={startEdit}
            className="text-xs text-text-muted hover:text-primary transition-colors"
          >
            {value ? 'Edit' : 'Write'}
          </button>
        )}
      </div>
      {editing ? (
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setDraft(value)
              setEditing(false)
            }
          }}
          placeholder="Markdown — **bold**, # heading, - list…"
          rows={4}
          className="w-full px-3 py-2 rounded-lg bg-surface-alt border border-border-light text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 font-mono resize-y"
        />
      ) : value ? (
        <MarkdownText body={value} />
      ) : (
        <p className="text-xs text-text-muted">No note yet for this week.</p>
      )}
    </div>
  )
}