import { useState, useEffect, useRef } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../core/db/schema'
import { deletePoint, updatePoint } from '../../core/db/repositories/point.repo'
import { getPhotoUrl, savePhoto } from '../../core/storage/opfs'
import { createPhoto, deletePhotoById } from '../../core/db/repositories/photo.repo'

interface Props {
  pointId: string
  onClose: () => void
  onDeleted: () => void
}

export default function PointDetailSheet({ pointId, onClose, onDeleted }: Props) {
  const point = useLiveQuery(() => db.points.get(pointId), [pointId])
  const category = useLiveQuery(
    () => (point ? db.categories.get(point.categoryId) : undefined),
    [point]
  )
  const itinerary = useLiveQuery(
    () => (point?.itineraryId ? db.itineraries.get(point.itineraryId) : undefined),
    [point?.itineraryId]
  )
  const photos = useLiveQuery(
    () => db.photos.where('pointId').equals(pointId).toArray(),
    [pointId]
  )

  const [photoUrls, setPhotoUrls] = useState<Map<string, string>>(new Map())
  const [editing, setEditing] = useState(false)
  const [addingPhotos, setAddingPhotos] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [description, setDescription] = useState('')
  const [loadingAddress, setLoadingAddress] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    if (!photos) return
    const urls = new Map<string, string>()
    const load = async () => {
      for (const photo of photos) {
        try {
          const url = await getPhotoUrl(photo.id)
          urls.set(photo.id, url)
        } catch {
          // ignore
        }
      }
      setPhotoUrls(new Map(urls))
    }
    load()
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [photos])

  useEffect(() => {
    if (point) setDescription(point.description ?? '')
  }, [point])

  useEffect(() => {
    if (!point || point.address || !navigator.onLine) return
    setLoadingAddress(true)
    const controller = new AbortController()
    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${point.lat}&lon=${point.lng}&format=json&accept-language=fr`,
      { signal: controller.signal, headers: { 'Accept-Language': 'fr' } }
    )
      .then((r) => { if (!r.ok) throw new Error('nominatim'); return r.json() })
      .then(async (data) => {
        const a = data.address ?? {}
        const parts = [
          a.road ?? a.pedestrian ?? a.path,
          a.village ?? a.town ?? a.city ?? a.municipality ?? a.county,
          a.country_code ? (a.country_code as string).toUpperCase() : undefined,
        ].filter(Boolean)
        const resolved = parts.length > 0 ? parts.join(', ') : (data.display_name ?? '')
        if (resolved) await updatePoint(point.id, { address: resolved })
      })
      .catch(() => {})
      .finally(() => setLoadingAddress(false))
    return () => controller.abort()
  }, [point?.id])

  async function handleSaveDescription() {
    if (!point) return
    await updatePoint(point.id, { description: description.trim() || undefined })
    setEditing(false)
  }

  async function handleDeletePoint() {
    if (!confirm('Supprimer ce point et ses photos ?')) return
    await deletePoint(pointId)
    onDeleted()
  }

  async function handleAddPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    if (!point || !e.target.files) return
    setAddingPhotos(true)
    try {
      const newIds: string[] = []
      for (const file of Array.from(e.target.files).filter((f) => f.type.startsWith('image/'))) {
        const id = crypto.randomUUID()
        await savePhoto(id, file)
        await createPhoto({ id, pointId: point.id, filename: `${id}.jpg` })
        newIds.push(id)
      }
      await updatePoint(point.id, { photoIds: [...point.photoIds, ...newIds] })
    } catch {
      setError('Impossible d\'enregistrer la photo. Stockage plein ?')
    } finally {
      setAddingPhotos(false)
      e.target.value = ''
    }
  }

  async function handleDeletePhoto(photoId: string) {
    const url = photoUrls.get(photoId)
    if (url) URL.revokeObjectURL(url)
    await deletePhotoById(photoId)
    if (point) {
      await updatePoint(point.id, {
        photoIds: point.photoIds.filter((id) => id !== photoId),
      })
    }
  }

  if (!point) return null

  const photoList = photos?.map((p) => ({ id: p.id, url: photoUrls.get(p.id) })).filter((p) => p.url) ?? []

  return (
    <>
    {lightboxIndex !== null && photoList[lightboxIndex] && (
      <div
        className="fixed inset-0 z-30 flex items-center justify-center bg-black/95"
        onClick={() => setLightboxIndex(null)}
      >
        <img
          src={photoList[lightboxIndex].url}
          alt=""
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full object-contain"
        />
        <button
          onClick={() => setLightboxIndex(null)}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white text-lg"
        >
          ✕
        </button>
        {photoList.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex - 1 + photoList.length) % photoList.length) }}
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white text-xl"
            >
              ‹
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setLightboxIndex((lightboxIndex + 1) % photoList.length) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white text-xl"
            >
              ›
            </button>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {photoList.map((_, i) => (
                <div
                  key={i}
                  className={['h-1.5 rounded-full transition-all', i === lightboxIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'].join(' ')}
                />
              ))}
            </div>
          </>
        )}
      </div>
    )}
    <div className="fixed inset-x-0 bottom-0 z-20 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-[var(--color-surface)] shadow-2xl animate-sheet-up">
      <div className="mx-auto mt-2.5 h-1 w-10 rounded-full bg-[var(--color-border)]" />
      <div className="flex flex-col gap-4 p-5 pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {category && (
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-base"
                style={{ backgroundColor: category.color }}
              >
                {category.icon}
              </span>
            )}
            <div>
              <span className="font-semibold text-[var(--color-text)]">
                {category?.name ?? 'Point'}
              </span>
              {itinerary && (
                <p className="text-xs text-[var(--color-text-muted)]">{itinerary.name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(!editing)}
              className={[
                'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
                editing
                  ? 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]'
                  : 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]',
              ].join(' ')}
            >
              {editing ? 'Annuler' : 'Modifier'}
            </button>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-text-muted)] active:scale-90 transition-transform"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Description */}
        {editing ? (
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] resize-none"
            />
            <button
              onClick={handleSaveDescription}
              className="mt-2 rounded-xl bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
            >
              Sauvegarder
            </button>
          </div>
        ) : (
          <p className="text-sm text-[var(--color-text-muted)]">
            {point.description || <em>Aucune description</em>}
          </p>
        )}

        {/* Photos */}
        {(photos && photos.length > 0 || editing) && (
          <div className="grid grid-cols-3 gap-2">
            {photos?.map((photo, i) => {
              const url = photoUrls.get(photo.id)
              return url ? (
                <div key={photo.id} className="relative aspect-square">
                  <img
                    src={url}
                    alt=""
                    onClick={() => setLightboxIndex(i)}
                    className="h-full w-full rounded-xl object-cover cursor-pointer active:opacity-80"
                  />
                  {editing && (
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ) : null
            })}
            {editing && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={addingPhotos}
                className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-border)] text-2xl text-[var(--color-text-muted)] disabled:opacity-40"
              >
                {addingPhotos ? '…' : '+'}
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              capture="environment"
              className="hidden"
              onChange={handleAddPhotos}
            />
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}

        <div className="flex items-center justify-between pt-1 border-t border-[var(--color-border)]">
          <span className="flex-1 mr-3 truncate text-xs text-[var(--color-text-muted)]">
            {point.address
              ? point.address
              : loadingAddress
                ? <span className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-[var(--color-text-muted)] animate-pulse inline-block" />Localisation…</span>
                : ''}
          </span>
          <button
            onClick={handleDeletePoint}
            className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-red-500 active:bg-red-50 transition-colors"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
    </>
  )
}
