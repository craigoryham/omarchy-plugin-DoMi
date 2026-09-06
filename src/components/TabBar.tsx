interface TabBarProps {
  active: 'tasks' | 'timeblock'
  onChange: (tab: 'tasks' | 'timeblock') => void
}

export function TabBar({ active, onChange }: TabBarProps) {
  const tabs = [
    { key: 'tasks' as const, label: 'Tasks' },
    { key: 'timeblock' as const, label: 'Time Block' },
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
