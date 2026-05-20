import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { initMap } from '../../core/map/renderer'

export function useMap(containerRef: React.RefObject<HTMLElement | null>) {
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = initMap(containerRef.current)
    mapRef.current = map
    map.on('load', () => setReady(true))
    return () => {
      map.remove()
      mapRef.current = null
      setReady(false)
    }
  }, [containerRef])

  return { map: mapRef.current, ready }
}
