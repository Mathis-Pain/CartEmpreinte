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
    <div className="flex h-full flex-col items-center justify-center gap-8 bg-[var(--color-bg)] p-8">
      <div className="flex flex-col items-center gap-3 text-center">
        <span className="text-6xl">🗺️</span>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">
          Bienvenue sur CartEmpreinte
        </h1>
        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
          Votre journal cartographique personnel, offline et privé.
        </p>
      </div>

      <div className="w-full max-w-sm rounded-2xl bg-[var(--color-surface)] p-5 text-sm text-[var(--color-text)]">
        {hasFileSystemAccess ? (
          <>
            <p className="mb-3 font-medium">📁 Dossier de sauvegarde</p>
            <p className="mb-4 text-[var(--color-text-muted)] leading-relaxed">
              Choisissez un dossier sur votre appareil pour sauvegarder vos données.
              Vous pourrez exporter directement depuis l'app.
            </p>
            <button
              onClick={handlePickFolder}
              disabled={loading}
              className="w-full rounded-xl bg-[var(--color-accent)] py-3 text-sm font-semibold text-white active:scale-95 transition-transform disabled:opacity-60"
            >
              {loading ? 'Chargement…' : 'Choisir un dossier'}
            </button>
            {error && (
              <p className="mt-2 text-xs text-red-500">{error}</p>
            )}
          </>
        ) : (
          <>
            <p className="mb-3 font-medium">📲 Export sur iOS</p>
            <p className="mb-4 text-[var(--color-text-muted)] leading-relaxed">
              Sur iOS, vos données sont stockées localement. Utilisez le bouton
              <strong> Export</strong> pour télécharger une archive ZIP dans vos Fichiers.
            </p>
          </>
        )}
      </div>

      <button
        onClick={completeOnboarding}
        className="text-sm text-[var(--color-text-muted)] underline"
      >
        Continuer sans dossier
      </button>
    </div>
  )
}
