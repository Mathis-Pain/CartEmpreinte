import { useState, useEffect } from 'react'
import { db } from './core/db/schema'
import { seedDefaultCategories } from './core/db/repositories/category.repo'
import BottomNav, { type Tab } from './components/BottomNav'
import OnboardingScreen from './features/onboarding/OnboardingScreen'
import MapView from './features/map/MapView'
import ItineraryList from './features/itinerary/ItineraryList'
import CategoryList from './features/legend/CategoryList'
import ExportView from './features/export/ExportView'

type AppState = 'loading' | 'onboarding' | 'app' | 'error'

export default function App() {
  const [state, setState] = useState<AppState>('loading')
  const [activeTab, setActiveTab] = useState<Tab>('map')

  useEffect(() => {
    async function init() {
      await seedDefaultCategories()
      const setting = await db.settings.get('onboardingDone')
      if (setting?.value) {
        setState('app')
      } else {
        setState('onboarding')
      }
    }
    init().catch(() => setState('error'))
  }, [])

  if (state === 'loading') {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--color-bg)]">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 rounded-full border-4 border-[var(--color-border)]" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[var(--color-accent)] animate-spin-ring" />
          </div>
          <p className="text-sm font-medium text-[var(--color-text-muted)]">Chargement…</p>
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--color-bg)] p-6">
        <div className="flex flex-col items-center gap-5 text-center animate-fade-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2} strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth={2.5} />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text)]">
              Impossible d'ouvrir la base de données locale.
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)] leading-relaxed">
              Cela peut arriver si le stockage est plein ou si les données sont corrompues.
            </p>
          </div>
          <button
            onClick={async () => { await db.delete(); window.location.reload() }}
            className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white active:scale-95 transition-transform"
          >
            Réinitialiser les données
          </button>
        </div>
      </div>
    )
  }

  if (state === 'onboarding') {
    return <OnboardingScreen onDone={() => setState('app')} />
  }

  return (
    <div className="flex h-full flex-col">
      <main className="relative flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* MapView toujours monté pour conserver l'état carte */}
        <div className={activeTab === 'map' ? 'flex-1 min-h-0' : 'hidden'}>
          <MapView />
        </div>
        {activeTab === 'itineraries' && <ItineraryList />}
        {activeTab === 'categories' && <CategoryList />}
        {activeTab === 'export' && <ExportView />}
      </main>
      <BottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  )
}
