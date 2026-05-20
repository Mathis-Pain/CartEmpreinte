import { useState } from 'react'
import { pickFolder, hasFileSystemAccess } from '../../core/storage/folder'
import { db } from '../../core/db/schema'

interface Props {
  onDone: () => void
}

export default function OnboardingScreen({ onDone }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePickFolder() {
    setLoading(true)
    setError(null)
    const handle = await pickFolder()
    if (!handle) {
      setError('Dossier non sélectionné. Vous pouvez le faire plus tard depuis Export.')
    }
    await completeOnboarding()
    setLoading(false)
  }

  async function completeOnboarding() {
    await db.settings.put({ key: 'onboardingDone', value: true })
    onDone()
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-8 bg-[var(--color-bg)] p-8 animate-fade-in">
      {/* Logo / Hero */}
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-[22px] bg-[var(--color-accent)] text-4xl"
          style={{ boxShadow: '0 8px 28px rgba(22,163,74,0.35)' }}>
          🗺️
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text)]">
            CartEmpreinte
          </h1>
          <p className="mt-1.5 text-sm text-[var(--color-text-muted)] leading-relaxed">
            Votre journal cartographique personnel,<br />offline et privé.
          </p>
        </div>
      </div>

      {/* Card action */}
      <div className="w-full max-w-sm rounded-2xl bg-[var(--color-surface)] p-5 text-sm text-[var(--color-text)]"
        style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
        {hasFileSystemAccess ? (
          <>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--color-accent)]/10 text-base">📁</div>
              <p className="font-semibold text-[var(--color-text)]">Dossier de sauvegarde</p>
            </div>
            <p className="mb-4 text-xs text-[var(--color-text-muted)] leading-relaxed">
              Choisissez un dossier sur votre appareil pour sauvegarder vos données.
              Vous pourrez exporter directement depuis l'app.
            </p>
            <button
              onClick={handlePickFolder}
              disabled={loading}
              className="w-full rounded-xl bg-[var(--color-accent)] py-3 text-sm font-semibold text-white active:scale-[0.98] transition-transform disabled:opacity-60"
              style={{ boxShadow: '0 2px 12px rgba(22,163,74,0.3)' }}
            >
              {loading ? 'Chargement…' : 'Choisir un dossier'}
            </button>
            {error && (
              <p className="mt-2.5 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">{error}</p>
            )}
          </>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-base">📲</div>
              <p className="font-semibold text-[var(--color-text)]">Export sur iOS</p>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
              Sur iOS, vos données sont stockées localement. Utilisez le bouton
              <strong className="text-[var(--color-text)]"> Export</strong> pour télécharger une archive ZIP dans vos Fichiers.
            </p>
          </>
        )}
      </div>

      <button
        onClick={completeOnboarding}
        className="text-sm font-medium text-[var(--color-text-muted)] underline underline-offset-2"
      >
        Continuer sans dossier
      </button>
    </div>
  )
}
