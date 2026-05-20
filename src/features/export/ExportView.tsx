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
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5">
        <h1 className="text-base font-semibold tracking-tight text-[var(--color-text)]">Export & Sauvegarde</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Export global */}
        <section className="mb-5">
          <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Tout exporter
          </h2>
          <div className="flex flex-col gap-2">
            {hasFileSystemAccess && (
              <button
                onClick={handleExportToFolder}
                disabled={loading === 'folder'}
                className="flex items-center gap-3.5 rounded-2xl bg-[var(--color-surface)] p-4 text-left active:scale-[0.99] transition-transform disabled:opacity-60"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl">📁</div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    Sauvegarder dans un dossier
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Écrit directement sur votre appareil
                  </p>
                </div>
                {loading === 'folder' && (
                  <div className="ml-auto h-4 w-4 shrink-0 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin-ring" />
                )}
              </button>
            )}
            <button
              onClick={handleExportAll}
              disabled={loading === 'all'}
              className="flex items-center gap-3.5 rounded-2xl bg-[var(--color-surface)] p-4 text-left active:scale-[0.99] transition-transform disabled:opacity-60"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-xl">📦</div>
              <div>
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  Télécharger en ZIP
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Archive complète (données + photos)
                </p>
              </div>
              {loading === 'all' && (
                <div className="ml-auto h-4 w-4 shrink-0 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin-ring" />
              )}
            </button>
          </div>
        </section>

        {/* Conseil */}
        <div className="mb-5 flex gap-3 rounded-2xl border border-blue-100 bg-blue-50 p-3.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" className="mt-0.5 shrink-0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
          <p className="text-xs text-blue-700 leading-relaxed">
            <span className="font-semibold">Conseil :</span> enregistrez votre ZIP dans Google Drive, iCloud ou Dropbox pour ne jamais perdre vos données.
          </p>
        </div>

        {/* Export par itinéraire */}
        {itineraries && itineraries.length > 0 && (
          <section>
            <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
              Par itinéraire
            </h2>
            <div className="flex flex-col gap-2">
              {itineraries.map((it) => {
                const ptCount = points?.filter((p) => p.itineraryId === it.id).length ?? 0
                const isLoading = loading === it.id
                return (
                  <button
                    key={it.id}
                    onClick={() => handleExportItinerary(it.id)}
                    disabled={isLoading}
                    className="flex items-center justify-between rounded-2xl bg-[var(--color-surface)] p-4 text-left active:scale-[0.99] transition-transform disabled:opacity-60"
                    style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-text)]">{it.name}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {ptCount} point{ptCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                    {isLoading ? (
                      <div className="h-5 w-5 rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)] animate-spin-ring" />
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {(!itineraries || itineraries.length === 0) && (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-surface)]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text)]">Rien à exporter</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">Créez des itinéraires pour les exporter ici.</p>
            </div>
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
