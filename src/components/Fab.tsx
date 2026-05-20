interface Props {
  onClick: () => void
  label?: string
}

export default function Fab({ onClick, label = 'Ajouter un point' }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="absolute bottom-20 right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-white active:scale-95 transition-transform"
      style={{ boxShadow: '0 4px 18px rgba(22,163,74,0.45), 0 2px 6px rgba(0,0,0,0.14)' }}
    >
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth={2.2} strokeLinecap="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    </button>
  )
}
