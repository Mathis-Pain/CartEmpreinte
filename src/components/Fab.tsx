interface Props {
  onClick: () => void
  label?: string
}

export default function Fab({ onClick, label = 'Ajouter un point' }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="absolute bottom-20 right-4 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-accent)] text-white shadow-lg text-2xl active:scale-95 transition-transform"
    >
      +
    </button>
  )
}
