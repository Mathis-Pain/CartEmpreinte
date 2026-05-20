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
    <div className="fixed inset-x-0 bottom-0 z-20 rounded-t-2xl bg-[var(--color-surface)] shadow-2xl">
      <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[var(--color-border)]" />
      <div className="flex flex-col gap-3 p-5 pb-8">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[var(--color-text)]">Filtres</h2>
          <button onClick={onClose} className="text-[var(--color-text-muted)] text-xl">✕</button>
        </div>

        {itineraries?.map((it) => {
          const isVisible = visible.get(it.id) !== false
          return (
            <label key={it.id} className="flex items-center gap-3">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={isVisible}
                  onChange={(e) => onChange(it.id, e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={[
                    'h-6 w-6 rounded-md border-2 flex items-center justify-center transition-colors',
                    isVisible
                      ? 'border-transparent'
                      : 'border-[var(--color-border)] bg-white',
                  ].join(' ')}
                  style={isVisible ? { backgroundColor: catMap.get(it.categoryId)?.color ?? '#16a34a' } : {}}
                >
                  {isVisible && <span className="text-white text-xs">✓</span>}
                </div>
              </div>
              <span className="text-sm text-[var(--color-text)]">{it.name}</span>
            </label>
          )
        })}

        {(!itineraries || itineraries.length === 0) && (
          <p className="text-sm text-[var(--color-text-muted)]">Aucun itinéraire</p>
        )}
      </div>
    </div>
  )
}
