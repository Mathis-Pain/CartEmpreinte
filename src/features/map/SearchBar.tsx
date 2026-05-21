import { useState, useEffect, useRef } from 'react'

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

interface Props {
  onSelect: (lat: number, lng: number) => void
}

export default function SearchBar({ onSelect }: Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NominatimResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (query.length < 2) {
      setResults([])
      return
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
          { headers: { 'Accept-Language': 'fr', 'User-Agent': 'CartEmpreinte/1.0' } }
        )
        const data: NominatimResult[] = await res.json()
        setResults(data)
      } catch {
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  const handleOpen = () => {
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  const handleClose = () => {
    setOpen(false)
    setQuery('')
    setResults([])
  }

  const handleSelect = (r: NominatimResult) => {
    onSelect(parseFloat(r.lat), parseFloat(r.lon))
    handleClose()
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        className="absolute right-3 top-3 z-10 flex items-center justify-center w-10 h-10 md:w-[75px] md:h-[75px] rounded-full bg-white/95 active:scale-95 transition-transform"
        style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.12)' }}
        aria-label="Rechercher une ville"
      >
        <SearchIcon />
      </button>
    )
  }

  return (
    <div className="absolute right-3 top-3 z-20 w-72 max-w-[calc(100vw-8rem)]">
      <div
        className="flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 md:h-[75px] md:px-6 md:gap-3"
        style={{ boxShadow: '0 2px 10px rgba(0,0,0,0.12)' }}
      >
        <SearchIcon className="shrink-0 text-gray-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une ville…"
          className="flex-1 min-w-0 bg-transparent text-[16px] font-medium outline-none placeholder-gray-400 md:text-base"
          style={{ touchAction: 'manipulation' }}
        />
        {loading && <Spinner />}
        <button onClick={handleClose} className="shrink-0 text-gray-400 p-0.5" aria-label="Fermer">
          <CloseIcon />
        </button>
      </div>

      {results.length > 0 && (
        <ul
          className="mt-1.5 rounded-2xl bg-white overflow-hidden"
          style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.14)' }}
        >
          {results.map((r, i) => (
            <li key={r.place_id} className={i < results.length - 1 ? 'border-b border-gray-100' : ''}>
              <button
                onClick={() => handleSelect(r)}
                className="w-full text-left px-4 py-2.5 text-xs active:bg-gray-100"
              >
                <span className="block font-medium truncate">{r.display_name.split(',')[0]}</span>
                <span className="block text-gray-400 truncate mt-0.5">
                  {r.display_name.split(',').slice(1, 3).join(',').trim()}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={`w-[17px] h-[17px] md:w-[29px] md:h-[29px] ${className ?? ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg className="w-3 h-3 md:w-4 md:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="animate-spin text-gray-400 shrink-0">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" />
    </svg>
  )
}
