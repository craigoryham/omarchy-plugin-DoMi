interface TabBarProps {
  active: 'tasks' | 'plan'
  onChange: (tab: 'tasks' | 'plan') => void
}

export function TabBar({ active, onChange }: TabBarProps) {
  const tabs = [
    { key: 'tasks' as const, label: 'Tasks' },
    { key: 'plan' as const, label: 'Plan' },
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
