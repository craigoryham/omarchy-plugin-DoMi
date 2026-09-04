import type { Todo, Category, Tag } from '../types'
import { TodoItem } from './TodoItem'

interface TodoListProps {
  todos: Todo[]
  categories: Category[]
  tags: Tag[]
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, text: string) => void
  onSetTags: (id: string, tagIds: string[]) => void
  onSetDescription: (id: string, description: string) => void
}

export function TodoList({ todos, categories, tags, onToggle, onDelete, onEdit, onSetTags, onSetDescription }: TodoListProps) {
  const getCategory = (id: string | null) => categories.find((c) => c.id === id)

  if (todos.length === 0) {
    return (
      <div className="text-center py-16 text-text-muted">
        <div className="text-5xl mb-4">{'( ._. )'}</div>
        <p className="text-lg">Nothing here yet</p>
        <p className="text-sm mt-1">Add a task above to get started</p>
      </div>
    )
  }

  const activeTodos = todos.filter((t) => !t.completed)
  const completedTodos = todos.filter((t) => t.completed)

  return (
    <div className="space-y-2">
      {activeTodos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          category={getCategory(todo.categoryId)}
          tags={tags}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          onSetTags={onSetTags}
          onSetDescription={onSetDescription}
        />
      ))}

      {completedTodos.length > 0 && activeTodos.length > 0 && (
        <div className="flex items-center gap-3 py-2">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-text-muted font-medium">
            {completedTodos.length} completed
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>
      )}

      {completedTodos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          category={getCategory(todo.categoryId)}
          tags={tags}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          onSetTags={onSetTags}
          onSetDescription={onSetDescription}
        />
      ))}
    </div>
  )
}
