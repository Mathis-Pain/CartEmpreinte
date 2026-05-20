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
      <div className="fixed inset-x-0 bottom-0 z-20 rounded-t-2xl bg-[var(--color-surface)] shadow-2xl animate-sheet-up">
        <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-[var(--color-border)]" />
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-2)] text-3xl">🏷️</div>
          <p className="text-sm font-semibold text-[var(--color-text)]">Aucune catégorie</p>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">Créez une catégorie depuis l'onglet Catégories avant d'ajouter un point.</p>
          <button onClick={onClose} className="mt-2 rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] active:scale-95 transition-transform">Fermer</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 max-h-[90dvh] overflow-y-auto rounded-t-2xl bg-[var(--color-surface)] shadow-2xl animate-sheet-up">
      <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-[var(--color-border)]" />

      <div className="flex flex-col gap-4 p-5 pb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--color-text)]">Nouveau point</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-muted)] active:scale-90 transition-transform"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Itinéraire */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Itinéraire <span className="font-normal normal-case">(optionnel)</span>
          </label>
          <button
            type="button"
            onClick={() => setItineraryOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-[var(--color-text)] active:bg-stone-50 transition-colors"
          >
            <span>{itineraries?.find((i) => i.id === effectiveItineraryId)?.name ?? 'Sans itinéraire'}</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`text-[var(--color-text-muted)] transition-transform ${itineraryOpen ? 'rotate-180' : ''}`}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
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
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
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
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes, souvenirs…"
            rows={2}
            className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2.5 text-sm text-[var(--color-text)] resize-none placeholder:text-[var(--color-border)]"
          />
        </div>

        {/* Photos */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Photos
          </label>
          <div className="flex gap-2 flex-wrap">
            {photos.map((_file, i) => (
              <div key={i} className="relative">
                <img
                  src={previews[i]}
                  alt=""
                  className="h-16 w-16 rounded-xl object-cover"
                />
                <button
                  onClick={() => removePhoto(i)}
                  className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] active:bg-[var(--color-surface-2)] transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
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
          className="w-full rounded-xl bg-[var(--color-accent)] py-3.5 text-sm font-semibold text-white active:scale-[0.98] transition-transform disabled:opacity-60"
          style={{ boxShadow: '0 2px 12px rgba(22,163,74,0.35)' }}
        >
          {saving ? 'Enregistrement…' : 'Enregistrer le point'}
        </button>
      </div>
    </div>
  )
}
