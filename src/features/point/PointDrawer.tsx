import { useState, useRef, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../core/db/schema'
import { createPoint } from '../../core/db/repositories/point.repo'
import { createPhoto } from '../../core/db/repositories/photo.repo'
import { savePhoto } from '../../core/storage/opfs'
import { updateItinerary } from '../../core/db/repositories/itinerary.repo'

interface Props {
  lat: number
  lng: number
  onClose: () => void
  onCreated: () => void
}

export default function PointDrawer({ lat, lng, onClose, onCreated }: Props) {
  const [description, setDescription] = useState('')
  const [selectedItineraryId, setSelectedItineraryId] = useState<string | null>(null)
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [itineraryOpen, setItineraryOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f))
    setPreviews(urls)
    return () => urls.forEach((u) => URL.revokeObjectURL(u))
  }, [photos])

  const itineraries = useLiveQuery(() => db.itineraries.orderBy('updatedAt').reverse().toArray(), [])
  const categories = useLiveQuery(() => db.categories.orderBy('createdAt').toArray(), [])

  const defaultItinerary = itineraries?.[0]
  // null = pas encore choisi (utilise le premier), '__none__' = sans itinéraire, sinon = id choisi
  const effectiveItineraryId =
    selectedItineraryId === '__none__' ? undefined
    : selectedItineraryId ?? defaultItinerary?.id
  const effectiveCategoryId =
    selectedCategoryId ||
    itineraries?.find((i) => i.id === effectiveItineraryId)?.categoryId ||
    categories?.[0]?.id ||
    ''

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      const valid = Array.from(e.target.files).filter((f) => f.type.startsWith('image/'))
      setPhotos((prev) => [...prev, ...valid])
    }
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSave() {
    if (!effectiveCategoryId) {
      setError('Sélectionnez une catégorie.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const photoIds: string[] = []
      for (const file of photos) {
        const id = crypto.randomUUID()
        await savePhoto(id, file)
        await createPhoto({ id, pointId: '', filename: `${id}.jpg` })
        photoIds.push(id)
      }
      const point = await createPoint({
        itineraryId: effectiveItineraryId,
        lat,
        lng,
        categoryId: effectiveCategoryId,
        description: description.trim() || undefined,
        photoIds,
      })
      // Fix pointId dans les photos
      for (const photoId of photoIds) {
        await db.photos.update(photoId, { pointId: point.id })
      }
      if (effectiveItineraryId) await updateItinerary(effectiveItineraryId, {})
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.')
    } finally {
      setSaving(false)
    }
  }

  if (categories !== undefined && categories.length === 0) {
    return (
      <div className="fixed inset-x-0 bottom-0 z-20 rounded-t-2xl bg-[var(--color-surface)] shadow-2xl">
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[var(--color-border)]" />
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <span className="text-4xl">🏷️</span>
          <p className="text-sm font-medium text-[var(--color-text)]">Aucune catégorie</p>
          <p className="text-xs text-[var(--color-text-muted)]">Créez une catégorie depuis l'onglet Catégories avant d'ajouter un point.</p>
          <button onClick={onClose} className="mt-2 rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-muted)]">Fermer</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 max-h-[90dvh] overflow-y-auto rounded-t-2xl bg-[var(--color-surface)] shadow-2xl">
      <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-[var(--color-border)]" />

      <div className="flex flex-col gap-4 p-5 pb-8">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-[var(--color-text)]">Nouveau point</h2>
          <button onClick={onClose} className="text-[var(--color-text-muted)] text-xl">✕</button>
        </div>

        {/* Itinéraire */}
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
            Itinéraire <span className="font-normal">(optionnel)</span>
          </label>
          <button
            type="button"
            onClick={() => setItineraryOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)]"
          >
            <span>{itineraries?.find((i) => i.id === effectiveItineraryId)?.name ?? 'Sans itinéraire'}</span>
            <span className="text-[var(--color-text-muted)] text-xs">{itineraryOpen ? '▲' : '▼'}</span>
          </button>
          {itineraryOpen && (
            <div className="mt-1 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
              <button
                type="button"
                onClick={() => { setSelectedItineraryId('__none__'); setItineraryOpen(false) }}
                className={[
                  'w-full px-3 py-2.5 text-left text-sm',
                  effectiveItineraryId === undefined ? 'font-semibold text-[var(--color-accent)]' : 'text-[var(--color-text)]',
                ].join(' ')}
              >
                Sans itinéraire
              </button>
              {itineraries?.map((it) => (
                <button
                  key={it.id}
                  type="button"
                  onClick={() => { setSelectedItineraryId(it.id); setItineraryOpen(false) }}
                  className={[
                    'w-full border-t border-[var(--color-border)] px-3 py-2.5 text-left text-sm',
                    effectiveItineraryId === it.id ? 'font-semibold text-[var(--color-accent)]' : 'text-[var(--color-text)]',
                  ].join(' ')}
                >
                  {it.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Catégorie */}
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
            Catégorie
          </label>
          <div className="flex gap-2 flex-wrap">
            {categories?.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={[
                  'flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium border transition-all',
                  effectiveCategoryId === cat.id
                    ? 'border-transparent text-white'
                    : 'border-[var(--color-border)] text-[var(--color-text)] bg-white',
                ].join(' ')}
                style={effectiveCategoryId === cat.id ? { backgroundColor: cat.color } : {}}
              >
                <span>{cat.icon}</span> {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes, souvenirs…"
            rows={2}
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] resize-none"
          />
        </div>

        {/* Photos */}
        <div>
          <label className="mb-1 block text-xs font-medium text-[var(--color-text-muted)]">
            Photos
          </label>
          <div className="flex gap-2 flex-wrap">
            {photos.map((_file, i) => (
              <div key={i} className="relative">
                <img
                  src={previews[i]}
                  alt=""
                  className="h-16 w-16 rounded-lg object-cover"
                />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                >
                  ✕
                </button>
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-border)] text-2xl text-[var(--color-text-muted)]"
            >
              +
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full rounded-xl bg-[var(--color-accent)] py-3 text-sm font-semibold text-white active:scale-95 transition-transform disabled:opacity-60"
        >
          {saving ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}
