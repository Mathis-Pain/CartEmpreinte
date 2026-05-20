import { useRef, useEffect, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../core/db/schema'
import { initMap } from '../../core/map/renderer'
import { createMarkerElement } from '../../core/map/markers'
import PointDrawer from '../point/PointDrawer'
import PointDetailSheet from '../point/PointDetailSheet'
import FilterSheet from './FilterSheet'

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<maplibregl.Marker[]>([])

  const [mapReady, setMapReady] = useState(false)
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [visibility, setVisibility] = useState<Map<string, boolean>>(new Map())

  const points = useLiveQuery(() => db.points.toArray(), [])
  const categories = useLiveQuery(() => db.categories.toArray(), [])

  const catMap = new Map(categories?.map((c) => [c.id, c]) ?? [])

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = initMap(containerRef.current)
    mapRef.current = map
    map.on('load', () => setMapReady(true))
    return () => {
      map.remove()
      mapRef.current = null
      setMapReady(false)
    }
  }, [])

  // Clic sur la carte → ouvrir PointDrawer
  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current!
    const handler = (e: maplibregl.MapMouseEvent) => {
      // Ignorer si un sheet est déjà ouvert
      if (pendingCoords || selectedPointId || showFilters) return
      setPendingCoords({ lat: e.lngLat.lat, lng: e.lngLat.lng })
    }
    map.on('click', handler)
    return () => { map.off('click', handler) }
  }, [mapReady, pendingCoords, selectedPointId, showFilters])

  // Redraw markers
  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current!
    if (!points || !categories) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const visiblePoints = points.filter((p) =>
      !p.itineraryId || visibility.get(p.itineraryId) !== false
    )

    markersRef.current = visiblePoints.map((point) => {
      const cat = catMap.get(point.categoryId)
      const el = createMarkerElement(cat?.color ?? '#6b7280', cat?.icon)

      const handleSelect = (e: Event) => {
        e.stopPropagation()
        e.preventDefault()
        setPendingCoords(null)
        setSelectedPointId(point.id)
      }
      el.addEventListener('click', handleSelect)

      return new maplibregl.Marker({ element: el })
        .setLngLat([point.lng, point.lat])
        .addTo(map)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, points, categories, visibility])

  const handleVisibilityChange = useCallback((id: string, val: boolean) => {
    setVisibility((prev) => {
      const next = new Map(prev)
      next.set(id, val)
      return next
    })
  }, [])

  return (
    <div className="relative flex-1 h-full w-full">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Bouton filtres */}
      <button
        onClick={() => setShowFilters(true)}
        className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-xl bg-white/90 px-3 py-2 text-xs font-medium text-[var(--color-text)] shadow"
      >
        <span>⊞</span> Filtres
      </button>

      {/* Hint ajout */}
      {mapReady && !pendingCoords && !selectedPointId && !showFilters && (
        <div className="absolute bottom-4 inset-x-0 z-10 flex justify-center pointer-events-none">
          <div className="rounded-full bg-black/40 px-4 py-1.5 text-xs text-white/80">
            Appuyez sur la carte pour ajouter un point
          </div>
        </div>
      )}

      {(pendingCoords || selectedPointId || showFilters) && (
        <div className="fixed inset-0 z-[15]" />
      )}

      {pendingCoords && (
        <PointDrawer
          lat={pendingCoords.lat}
          lng={pendingCoords.lng}
          onClose={() => setPendingCoords(null)}
          onCreated={() => setPendingCoords(null)}
        />
      )}

      {selectedPointId && (
        <PointDetailSheet
          pointId={selectedPointId}
          onClose={() => setSelectedPointId(null)}
          onDeleted={() => setSelectedPointId(null)}
        />
      )}

      {showFilters && (
        <FilterSheet
          visible={visibility}
          onChange={handleVisibilityChange}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  )
}
