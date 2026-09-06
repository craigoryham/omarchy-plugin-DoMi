import type { Todo, Category, Tag } from '../types'
import { TodoItem } from './TodoItem'

interface TodoListProps {
  todos: Todo[]
  categories: Category[]
  tags: Tag[]
  weekTodoIds: string[]
  highlightTodoId?: string | null
  onToggleWeek: (id: string) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
  onEdit: (id: string, text: string) => void
  onSetTags: (id: string, tagIds: string[]) => void
  onSetDescription: (id: string, description: string) => void
  onSetCategory: (id: string, categoryId: string | null) => void
  onSetDueDate: (id: string, dueDate: string | null) => void
}

export function TodoList({ todos, categories, tags, weekTodoIds, highlightTodoId, onToggleWeek, onToggle, onDelete, onEdit, onSetTags, onSetDescription, onSetCategory, onSetDueDate }: TodoListProps) {
  const getCategory = (id: string | null) => categories.find((c) => c.id === id)
  const weekSet = new Set(weekTodoIds)

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
          categories={categories}
          tags={tags}
          inWeek={weekSet.has(todo.id)}
          highlighted={highlightTodoId === todo.id}
          onToggleWeek={() => onToggleWeek(todo.id)}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          onSetTags={onSetTags}
          onSetDescription={onSetDescription}
          onSetCategory={onSetCategory}
          onSetDueDate={onSetDueDate}
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
          categories={categories}
          tags={tags}
          inWeek={weekSet.has(todo.id)}
          highlighted={highlightTodoId === todo.id}
          onToggleWeek={() => onToggleWeek(todo.id)}
          onToggle={onToggle}
          onDelete={onDelete}
          onEdit={onEdit}
          onSetTags={onSetTags}
          onSetDescription={onSetDescription}
          onSetCategory={onSetCategory}
          onSetDueDate={onSetDueDate}
        />
      ))}
    </div>
  )
}
