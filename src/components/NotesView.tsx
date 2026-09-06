import { useState } from 'react'
import type { Todo, Tag, WeekNotes } from '../types'
import { MarkdownText } from './MarkdownText'

interface NotesViewProps {
  todos: Todo[]
  tags: Tag[]
  weekNotes: WeekNotes
  onOpenTodo: (id: string) => void
}

interface Entry {
  id: string
  title: string
  body: string
  dateMs: number
  kind: 'task' | 'week'
  task?: Todo
}

function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function fmtMonday(weekKey: string): string {
  const d = new Date(weekKey + 'T00:00:00')
  return `Week of ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}

export function NotesView({ todos, tags, weekNotes, onOpenTodo }: NotesViewProps) {
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const taskEntries: Entry[] = todos
    .filter((t) => (t.description ?? '').trim().length > 0)
    .map((t) => ({
      id: t.id,
      title: t.text,
      body: t.description,
      dateMs: new Date(t.createdAt).getTime(),
      kind: 'task' as const,
      task: t,
    }))

  const weekEntries: Entry[] = Object.entries(weekNotes).map(([key, text]) => ({
    id: 'week-' + key,
    title: fmtMonday(key),
    body: text,
    dateMs: new Date(key + 'T00:00:00').getTime(),
    kind: 'week' as const,
  }))

  const allEntries = [...taskEntries, ...weekEntries].sort((a, b) => b.dateMs - a.dateMs)
  const entries = activeTag
    ? allEntries.filter((e) => e.kind === 'task' && (e.task?.tagIds ?? []).includes(activeTag))
    : allEntries

  return (
    <div className="space-y-4">
      {/* Tag filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setActiveTag(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
            !activeTag
              ? 'bg-primary text-white border-primary'
              : 'bg-surface text-text-muted border-border hover:border-text-muted'
          }`}
        >
          All notes
        </button>
        {tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => setActiveTag(activeTag === tag.id ? null : tag.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
              activeTag === tag.id
                ? 'text-white border-transparent'
                : 'bg-surface text-text-muted border-border hover:border-text-muted'
            }`}
            style={
              activeTag === tag.id
                ? { backgroundColor: tag.color, borderColor: tag.color }
                : undefined
            }
          >
            {tag.name}
          </button>
        ))}
      </div>

      {entries.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-8 text-center">
          {activeTag ? (
            <p className="text-sm text-text-muted">No notes with this tag.</p>
          ) : (
            <p className="text-sm text-text-muted">
              No notes yet — add a description to a task, or write a week note.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((e) => (
            <article
              key={e.id}
              onClick={e.kind === 'task' ? () => onOpenTodo(e.id) : undefined}
              className={`bg-surface rounded-xl shadow-md border border-border p-4 ${
                e.kind === 'task' ? 'cursor-pointer hover:border-primary/40 transition-colors' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-sm font-semibold text-text truncate">{e.title}</h3>
                  {e.kind === 'week' && (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/15 text-primary flex-shrink-0">
                      Journal
                    </span>
                  )}
                </div>
                <span className="text-xs text-text-muted flex-shrink-0">{fmtDate(e.dateMs)}</span>
              </div>

              {e.kind === 'task' && (e.task?.tagIds?.length ?? 0) > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  {tags
                    .filter((tag) => e.task?.tagIds.includes(tag.id))
                    .map((tag) => (
                      <span
                        key={tag.id}
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full text-white"
                        style={{ backgroundColor: tag.color }}
                      >
                        {tag.name}
                      </span>
                    ))}
                </div>
              )}

              <div className="text-sm text-text-secondary">
                <MarkdownText body={e.body} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}