import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../core/db/schema'
import { exportAllAsZip, exportItineraryAsZip, exportToFolder } from '../../core/storage/export'
import { restoreFolder, pickFolder, hasFileSystemAccess } from '../../core/storage/folder'
import { useToast, Toast } from '../../components/Toast'

export default function ExportView() {
  const itineraries = useLiveQuery(() => db.itineraries.orderBy('updatedAt').reverse().toArray(), [])
  const points = useLiveQuery(() => db.points.toArray(), [])

  const [loading, setLoading] = useState<string | null>(null)
  const { toast, showToast, dismiss } = useToast()

  async function handleExportAll() {
    setLoading('all')
    try {
      await exportAllAsZip()
      showToast('Export téléchargé.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur export.', 'error')
    } finally {
      setLoading(null)
    }
  }

  async function handleExportItinerary(id: string) {
    setLoading(id)
    try {
      await exportItineraryAsZip(id)
      showToast('Export téléchargé.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur export.', 'error')
    } finally {
      setLoading(null)
    }
  }

  async function handleExportToFolder() {
    setLoading('folder')
    try {
      let handle = await restoreFolder()
      if (!handle) {
        handle = await pickFolder()
      }
      if (!handle) {
        showToast('Aucun dossier sélectionné.', 'info')
        setLoading(null)
        return
      }
      await exportToFolder(handle)
      showToast('Export enregistré dans le dossier.', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Erreur export.', 'error')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-[var(--color-bg)]">
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <h1 className="font-semibold text-[var(--color-text)]">Export & Sauvegarde</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Export global */}
        <section className="mb-6">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
            Tout exporter
          </h2>
          <div className="flex flex-col gap-2">
            {hasFileSystemAccess && (
              <button
                onClick={handleExportToFolder}
                disabled={loading === 'folder'}
                className="flex items-center gap-3 rounded-xl bg-[var(--color-surface)] p-4 text-left disabled:opacity-60"
              >
                <span className="text-2xl">📁</span>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    Sauvegarder dans un dossier
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Écrit directement sur votre appareil
                  </p>
                </div>
              </button>
            )}
            <button
              onClick={handleExportAll}
              disabled={loading === 'all'}
              className="flex items-center gap-3 rounded-xl bg-[var(--color-surface)] p-4 text-left disabled:opacity-60"
            >
              <span className="text-2xl">📦</span>
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">
                  Télécharger en ZIP
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Archive complète (données + photos)
                </p>
              </div>
            </button>
          </div>
        </section>

        {/* Conseil */}
        <div className="mb-6 flex gap-3 rounded-xl bg-blue-50 p-4">
          <span className="mt-0.5 shrink-0 text-base">💡</span>
          <p className="text-xs text-blue-700 leading-relaxed">
            <span className="font-semibold">Conseil :</span> enregistrez votre ZIP dans Google Drive, iCloud ou Dropbox pour retrouver votre sauvegarde sur tous vos appareils et ne jamais la perdre.
          </p>
        </div>

        {/* Export par itinéraire */}
        {itineraries && itineraries.length > 0 && (
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
              Par itinéraire
            </h2>
            <div className="flex flex-col gap-2">
              {itineraries.map((it) => {
                const ptCount = points?.filter((p) => p.itineraryId === it.id).length ?? 0
                return (
                  <button
                    key={it.id}
                    onClick={() => handleExportItinerary(it.id)}
                    disabled={loading === it.id}
                    className="flex items-center justify-between rounded-xl bg-[var(--color-surface)] p-4 text-left disabled:opacity-60"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text)]">{it.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {ptCount} point{ptCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <span className="text-xl">
                      {loading === it.id ? '⏳' : '⬇️'}
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {(!itineraries || itineraries.length === 0) && (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <span className="text-5xl">📤</span>
            <p className="text-sm text-[var(--color-text-muted)]">
              Aucun itinéraire à exporter.
            </p>
          </div>
        )}

      </div>

      <div className="border-t border-[var(--color-border)] py-3 text-center">
        <p className="text-xs text-[var(--color-text-muted)]">
          Développé par <span className="font-medium text-[var(--color-text)]">Mathis Pain</span>
        </p>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={dismiss} />
      )}
    </div>
  )
}
