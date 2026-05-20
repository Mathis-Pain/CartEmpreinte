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
      <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <h1 className="font-semibold text-[var(--color-text)]">Mes itinéraires</h1>
        <button
          onClick={() => setCreating(true)}
          className="rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-semibold text-white"
        >
          + Nouveau
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        {creating && (
          <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
            <p className="mb-2 text-sm font-medium text-[var(--color-text)]">Nouvel itinéraire</p>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Nom de l'itinéraire"
              className="mb-2 w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
            />
            {error && <p className="mb-2 text-xs text-red-500">{error}</p>}
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                className="flex-1 rounded-xl bg-[var(--color-accent)] py-2 text-sm font-semibold text-white"
              >
                Créer
              </button>
              <button
                onClick={() => { setCreating(false); setError(null) }}
                className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)]"
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        {itineraries?.length === 0 && !creating && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="text-5xl">🗺️</span>
            <p className="text-sm text-[var(--color-text-muted)]">
              Aucun itinéraire pour l'instant.
              <br />Créez-en un pour commencer à placer des points.
            </p>
          </div>
        )}

        {itineraries?.map((it) => {
          const ptCount = points?.filter((p) => p.itineraryId === it.id).length ?? 0

          return (
            <div
              key={it.id}
              className="flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3"
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
                  <p className="truncate text-sm font-medium text-[var(--color-text)]">
                    {it.name}
                  </p>
                )}
                <p className="text-xs text-[var(--color-text-muted)]">
                  {ptCount} point{ptCount !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setEditingId(it.id); setEditName(it.name) }}
                  className="text-sm text-[var(--color-text-muted)]"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(it.id)}
                  className="text-sm text-red-400"
                >
                  🗑️
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
