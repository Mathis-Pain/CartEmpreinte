export type Tab = 'map' | 'itineraries' | 'categories' | 'export'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
}

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'map', label: 'Carte', icon: '🗺️' },
  { id: 'itineraries', label: 'Itinéraires', icon: '🗂️' },
  { id: 'categories', label: 'Catégories', icon: '🏷️' },
  { id: 'export', label: 'Export', icon: '📤' },
]

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="flex border-t border-[var(--color-border)] bg-[var(--color-surface)] safe-bottom">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={[
            'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors',
            active === tab.id
              ? 'text-[var(--color-accent)]'
              : 'text-[var(--color-text-muted)]',
          ].join(' ')}
        >
          <span className="text-xl leading-none">{tab.icon}</span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
