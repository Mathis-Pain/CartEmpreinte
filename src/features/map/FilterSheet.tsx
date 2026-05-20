import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../core/db/schema'

interface Props {
  visible: Map<string, boolean>
  onChange: (id: string, val: boolean) => void
  onClose: () => void
}

export default function FilterSheet({ visible, onChange, onClose }: Props) {
  const itineraries = useLiveQuery(() => db.itineraries.orderBy('updatedAt').reverse().toArray(), [])
  const categories = useLiveQuery(() => db.categories.toArray(), [])

  const catMap = new Map(categories?.map((c) => [c.id, c]) ?? [])

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 rounded-t-2xl bg-[var(--color-surface)] shadow-2xl animate-sheet-up">
      <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-[var(--color-border)]" />
      <div className="flex flex-col gap-3 p-5 pb-8">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-[var(--color-text)]">Filtres</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-muted)] active:scale-90 transition-transform"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {itineraries?.map((it) => {
          const isVisible = visible.get(it.id) !== false
          const catColor = catMap.get(it.categoryId)?.color ?? '#16a34a'
          return (
            <label key={it.id} className="flex items-center gap-3 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={(e) => onChange(it.id, e.target.checked)}
                  className="sr-only"
                />
                <div
                  className="h-6 w-6 rounded-lg border-2 flex items-center justify-center transition-all duration-150"
                  style={isVisible
                    ? { backgroundColor: catColor, borderColor: catColor }
                    : { borderColor: 'var(--color-border)', backgroundColor: 'white' }
                  }
                >
                  {isVisible && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-sm font-medium text-[var(--color-text)]">{it.name}</span>
            </label>
          )
        })}

        {(!itineraries || itineraries.length === 0) && (
          <p className="text-sm text-[var(--color-text-muted)]">Aucun itinéraire à filtrer.</p>
        )}
      </div>
    </div>
  )
}
