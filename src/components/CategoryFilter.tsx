import type { Category, Tag } from '../types'

interface CategoryFilterProps {
  categories: Category[]
  tags: Tag[]
  activeCategory: string | null
  activeTag: string | null
  activeStatus: 'all' | 'active' | 'completed'
  onSelectCategory: (id: string | null) => void
  onSelectTag: (id: string | null) => void
  onSelectStatus: (status: 'all' | 'active' | 'completed') => void
  onManageTags: () => void
}

export function CategoryFilter({
  categories,
  tags,
  activeCategory,
  activeTag,
  activeStatus,
  onSelectCategory,
  onSelectTag,
  onSelectStatus,
  onManageTags,
}: CategoryFilterProps) {
  const statuses = [
    { key: 'all' as const, label: 'All' },
    { key: 'active' as const, label: 'Active' },
    { key: 'completed' as const, label: 'Done' },
  ]

  return (
    <div className="space-y-3">
      {/* Status filter */}
      <div className="flex items-center gap-2">
        <div className="flex bg-surface-alt rounded-lg p-1 border border-border-light">
          {statuses.map((s) => (
            <button
              key={s.key}
              onClick={() => onSelectStatus(s.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                activeStatus === s.key
                  ? 'bg-surface text-primary shadow-sm'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tag filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => onSelectTag(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
            !activeTag
              ? 'bg-primary text-white border-primary'
              : 'bg-surface text-text-muted border-border hover:border-text-muted'
          }`}
        >
          All tags
        </button>
        {tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => onSelectTag(activeTag === tag.id ? null : tag.id)}
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
        <button
          onClick={onManageTags}
          className="px-3 py-1 rounded-full text-xs font-medium border border-dashed border-border hover:border-primary hover:text-primary text-text-muted transition-all"
        >
          + Manage
        </button>
      </div>

      {/* Category filter */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onSelectCategory(null)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
              !activeCategory
                ? 'bg-surface-alt text-text border-border'
                : 'bg-surface text-text-muted border-border hover:border-text-muted'
            }`}
          >
            All categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(activeCategory === cat.id ? null : cat.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                activeCategory === cat.id
                  ? 'text-white border-transparent'
                  : 'bg-surface text-text-muted border-border hover:border-text-muted'
              }`}
              style={
                activeCategory === cat.id
                  ? { backgroundColor: cat.color, borderColor: cat.color }
                  : undefined
              }
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
