import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../core/db/schema'
import { createItinerary, deleteItinerary, updateItinerary } from '../../core/db/repositories/itinerary.repo'

export default function ItineraryList() {
  const itineraries = useLiveQuery(() => db.itineraries.orderBy('updatedAt').reverse().toArray(), [])
  const categories = useLiveQuery(() => db.categories.orderBy('createdAt').toArray(), [])
  const points = useLiveQuery(() => db.points.toArray(), [])

  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const defaultCatId = categories?.[0]?.id ?? ''

  async function handleCreate() {
    const name = newName.trim()
    if (!name) { setError('Nom requis.'); return }
    if (!defaultCatId) { setError('Créez d\'abord une catégorie.'); return }
    setError(null)
    try {
      await createItinerary({ name, categoryId: defaultCatId })
      setNewName('')
      setCreating(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.')
    }
  }

  async function handleDelete(id: string) {
    const count = points?.filter((p) => p.itineraryId === id).length ?? 0
    if (!confirm(`Supprimer cet itinéraire et ses ${count} point(s) ?`)) return
    try {
      await deleteItinerary(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.')
    }
  }

  async function handleRename(id: string) {
    const name = editName.trim()
    if (!name) return
    try {
      await updateItinerary(id, { name })
      setEditingId(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur.')
    }
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-[var(--color-bg)]">
      <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5">
        <h1 className="text-base font-semibold tracking-tight text-[var(--color-text)]">Mes itinéraires</h1>
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-full bg-[var(--color-accent)] px-3.5 py-1.5 text-xs font-semibold text-white active:scale-95 transition-transform"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Nouveau
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {creating && (
          <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] p-4 animate-fade-in">
            <p className="mb-2.5 text-sm font-semibold text-[var(--color-text)]">Nouvel itinéraire</p>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Nom de l'itinéraire"
              className="mb-2.5 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm"
            />
            {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 rounded-xl bg-[var(--color-accent)] py-2.5 text-sm font-semibold text-white active:scale-[0.98] transition-transform"
              >
                Créer
              </button>
              <button
                onClick={() => { setCreating(false); setError(null) }}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm text-[var(--color-text-muted)] active:bg-[var(--color-border)] transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {itineraries?.length === 0 && !creating && (
          <div className="flex flex-col items-center gap-4 py-20 text-center px-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface)]">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                <line x1="9" y1="3" x2="9" y2="18"/>
                <line x1="15" y1="6" x2="15" y2="21"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">Aucun itinéraire</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)] leading-relaxed">
                Créez-en un pour commencer à placer des points sur la carte.
              </p>
            </div>
          </div>
        )}

        {itineraries?.map((it) => {
          const ptCount = points?.filter((p) => p.itineraryId === it.id).length ?? 0

          return (
            <div
              key={it.id}
              className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3.5 active:bg-[var(--color-surface-2)] transition-colors"
            >
              <div className="min-w-0 flex-1">
                {editingId === it.id ? (
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(it.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    onBlur={() => handleRename(it.id)}
                    className="w-full rounded-lg border border-[var(--color-accent)] bg-white px-2 py-1 text-sm"
                  />
                ) : (
                  <p className="truncate text-sm font-semibold text-[var(--color-text)]">
                    {it.name}
                  </p>
                )}
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  {ptCount} point{ptCount !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setEditingId(it.id); setEditName(it.name) }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-muted)] active:bg-[var(--color-surface-2)] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(it.id)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 active:bg-red-50 transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14H6L5 6"/>
                    <path d="M10 11v6M14 11v6"/>
                    <path d="M9 6V4h6v2"/>
                  </svg>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
