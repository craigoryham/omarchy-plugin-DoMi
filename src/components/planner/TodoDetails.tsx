import type { Todo, Category, Tag } from '../../types'

interface TodoDetailsProps {
  todo: Todo
  categories: Category[]
  tags: Tag[]
  onClose: () => void
  onUpdateTodo: (id: string, text: string) => void
  onSetCategory: (id: string, categoryId: string | null) => void
  onSetDueDate: (id: string, dueDate: string | null) => void
  onSetTags: (id: string, tagIds: string[]) => void
  onSetDescription: (id: string, description: string) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}

export function TodoDetails({ todo, categories, tags, onClose, onUpdateTodo, onSetCategory, onSetDueDate, onSetTags, onSetDescription, onToggle, onDelete }: TodoDetailsProps) {
  const toggleTag = (id: string) => {
    onSetTags(
      todo.id,
      todo.tagIds.includes(id)
        ? todo.tagIds.filter((t) => t !== id)
        : [...todo.tagIds, id]
    )
  }

  return (
    <div className="bg-surface-alt rounded-lg p-3 border border-border animate-scale-in">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-text">Task details</span>
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
        <div>
          <label className="block text-xs text-text-muted mb-1">Title</label>
          <input
            type="text"
            value={todo.text}
            onChange={(e) => onUpdateTodo(todo.id, e.target.value)}
            placeholder="Task title"
            className="w-full px-2 py-1 rounded bg-surface border border-border-light text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-text-muted mb-1">Category</label>
            <select
              value={todo.categoryId ?? ''}
              onChange={(e) => onSetCategory(todo.id, e.target.value || null)}
              className="w-full px-2 py-1 rounded bg-surface border border-border-light text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">No category</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-xs text-text-muted mb-1">Due date</label>
            <input
              type="date"
              value={todo.dueDate ?? ''}
              onChange={(e) => onSetDueDate(todo.id, e.target.value || null)}
              className="w-full px-2 py-1 rounded bg-surface border border-border-light text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Description</label>
          <textarea
            value={todo.description ?? ''}
            onChange={(e) => onSetDescription(todo.id, e.target.value)}
            rows={2}
            placeholder="Add optional details..."
            className="w-full px-2 py-1 rounded bg-surface border border-border-light text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 resize-y"
          />
        </div>
        <div>
          <label className="block text-xs text-text-muted mb-1">Tags</label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => {
              const active = todo.tagIds.includes(tag.id)
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTag(tag.id)}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all border ${
                    active
                      ? 'text-white border-transparent'
                      : 'bg-surface text-text-muted border-border-light hover:border-text-muted'
                  }`}
                  style={active ? { backgroundColor: tag.color } : undefined}
                >
                  {tag.name}
                </button>
              )
            })}
          </div>
        </div>
        <button
          onClick={() => onToggle(todo.id)}
          className={`w-full mt-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-opacity hover:opacity-90 ${
            todo.completed
              ? 'bg-surface border border-border text-text-muted hover:text-text'
              : 'bg-primary text-white'
          }`}
        >
          {todo.completed ? 'Mark as incomplete' : 'Mark complete'}
        </button>
        <button
          onClick={() => onDelete(todo.id)}
          className="w-full px-3 py-1.5 bg-danger text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          Delete task
        </button>
      </div>
    </div>
  )
}