import type { Todo, Category, TimeBlock } from '../../types'
import { DEFAULT_CATEGORIES } from '../../types'
import { formatDuration } from './date'

interface BlockDetailsProps {
  block: TimeBlock
  todo: Todo | undefined
  weekLabel: string
  onClose: () => void
  onUpdate: (id: string, patch: Partial<TimeBlock>) => void
  onUpdateTodo: (id: string, text: string) => void
  onDelete: (id: string) => void
}

function startTimeInputValue(startMinute: number): string {
  const h = Math.floor(startMinute / 60) % 24
  const m = startMinute % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function BlockDetails({ block, todo, weekLabel, onClose, onUpdate, onUpdateTodo, onDelete }: BlockDetailsProps) {
  return (
    <div className="bg-surface-alt rounded-lg p-3 border border-border animate-scale-in">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-text">Block details</span>
        <button
          onClick={onClose}
          className="p-1 rounded text-text-muted hover:text-text"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="space-y-2 text-sm">
        <p className="text-xs text-text-muted mb-2">{weekLabel}</p>
        <div>
          <label className="block text-xs text-text-muted mb-1">Title</label>
          <input
            type="text"
            value={block.taskId ? (todo?.text ?? '') : (block.title ?? '')}
            onChange={(e) =>
              block.taskId
                ? onUpdateTodo(block.taskId, e.target.value)
                : onUpdate(block.id, { title: e.target.value })
            }
            placeholder="Title"
            className="w-full px-2 py-1 rounded bg-surface border border-border-light text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Description</label>
          <textarea
            value={block.description ?? ''}
            onChange={(e) => onUpdate(block.id, { description: e.target.value })}
            rows={2}
            placeholder="Add optional details..."
            className="w-full px-2 py-1 rounded bg-surface border border-border-light text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Start time</label>
          <input
            type="time"
            value={startTimeInputValue(block.startMinute)}
            onChange={(e) => {
              const [hs, ms] = e.target.value.split(':').map(Number)
              onUpdate(block.id, { startMinute: hs * 60 + ms })
            }}
            className="w-full px-2 py-1 rounded bg-surface border border-border-light text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Duration</label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onUpdate(block.id, { durationMin: Math.max(30, block.durationMin - 30) })}
              disabled={block.durationMin <= 30}
              className="flex-shrink-0 w-7 h-7 rounded-md bg-surface-alt border border-border-light text-text-muted hover:text-text hover:border-text-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm leading-none"
            >
              −
            </button>
            <div className="flex-1 text-center text-sm text-text font-medium tabular-nums">
              {formatDuration(block.durationMin)}
            </div>
            <button
              onClick={() => onUpdate(block.id, { durationMin: Math.min(720, block.durationMin + 30) })}
              disabled={block.durationMin >= 720}
              className="flex-shrink-0 w-7 h-7 rounded-md bg-surface-alt border border-border-light text-text-muted hover:text-text hover:border-text-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm leading-none"
            >
              +
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Color</label>
          <div className="flex flex-wrap gap-1.5">
            {DEFAULT_CATEGORIES.map((c: Category) => (
              <button
                key={c.id}
                onClick={() => onUpdate(block.id, { color: c.color })}
                className={`w-5 h-5 rounded-full transition-all ${block.color === c.color ? 'ring-2 ring-offset-1 ring-text-muted' : 'hover:scale-110'}`}
                style={{ backgroundColor: c.color }}
              />
            ))}
          </div>
        </div>
        <button
          onClick={() => onDelete(block.id)}
          className={`w-full mt-2 px-3 py-1.5 text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity ${
            block.taskId ? 'bg-primary' : 'bg-danger'
          }`}
        >
          {block.taskId ? 'Return to task queue' : 'Delete block'}
        </button>
      </div>
    </div>
  )
}
