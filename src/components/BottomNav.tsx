export type Tab = 'map' | 'itineraries' | 'categories' | 'export'

interface Props {
  active: Tab
  onChange: (tab: Tab) => void
}

function MapIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"
        fill="currentColor" fillOpacity={active ? 0.13 : 0} />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  )
}

function RouteIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="6.5" r="2.5" fill="currentColor" fillOpacity={active ? 0.8 : 0.2} />
      <circle cx="18.5" cy="17.5" r="2.5" fill="currentColor" fillOpacity={active ? 0.8 : 0.2} />
      <path d="M8 6.5h4a2.5 2.5 0 0 1 2.5 2.5v5a2.5 2.5 0 0 0 2.5 2.5h1.5" />
    </svg>
  )
}

function TagIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"
        fill="currentColor" fillOpacity={active ? 0.13 : 0} />
      <circle cx="7" cy="7" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

function UploadIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={active ? 2 : 1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
        fill="currentColor" fillOpacity={active ? 0.13 : 0} />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  )
}

const tabs = [
  { id: 'map' as Tab,         label: 'Carte',       Icon: MapIcon    },
  { id: 'itineraries' as Tab, label: 'Itinéraires', Icon: RouteIcon  },
  { id: 'categories' as Tab,  label: 'Catégories',  Icon: TagIcon    },
  { id: 'export' as Tab,      label: 'Export',      Icon: UploadIcon },
]

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav className="flex border-t border-[var(--color-border)] bg-[var(--color-surface)] safe-bottom">
      {tabs.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={[
              'relative flex flex-1 flex-col items-center gap-1 pt-2.5 pb-2 text-[10.5px] font-semibold tracking-wide transition-colors duration-150',
              isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]',
            ].join(' ')}
          >
            {isActive && (
              <span className="absolute inset-x-4 top-0 h-[2.5px] rounded-b-full bg-[var(--color-accent)]" />
            )}
            <tab.Icon active={isActive} />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
