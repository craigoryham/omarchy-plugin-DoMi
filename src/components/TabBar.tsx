type TabKey = 'tasks' | 'timeblock' | 'notes'

interface TabBarProps {
  active: TabKey
  onChange: (tab: TabKey) => void
}

export function TabBar({ active, onChange }: TabBarProps) {
  const tabs: { key: TabKey; label: string }[] = [
    { key: 'tasks', label: 'Tasks' },
    { key: 'timeblock', label: 'Time Block' },
    { key: 'notes', label: 'Notes' },
  ]

  return (
    <div className="flex bg-surface-alt rounded-xl p-1 border border-border-light shadow-sm">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            active === tab.key
              ? 'bg-surface text-primary shadow-sm'
              : 'text-text-muted hover:text-text'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}