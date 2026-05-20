import { useState, useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'error' | 'success' | 'info'
  onDismiss: () => void
}

export function Toast({ message, type = 'info', onDismiss }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3500)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const bg =
    type === 'error'
      ? 'bg-red-600'
      : type === 'success'
        ? 'bg-[var(--color-accent)]'
        : 'bg-stone-700'

  const icon =
    type === 'error'   ? '✕' :
    type === 'success' ? '✓' : 'i'

  return (
    <div
      className={`fixed bottom-24 left-4 right-4 z-50 flex items-start gap-3 rounded-2xl ${bg} px-4 py-3.5 text-sm text-white shadow-xl animate-toast-slide`}
      onClick={onDismiss}
    >
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/25 text-xs font-bold">
        {icon}
      </span>
      <span className="flex-1 leading-snug">{message}</span>
    </div>
  )
}

export function useToast() {
  const [toast, setToast] = useState<{
    message: string
    type: 'error' | 'success' | 'info'
  } | null>(null)

  const showToast = (
    message: string,
    type: 'error' | 'success' | 'info' = 'info'
  ) => setToast({ message, type })

  const dismiss = () => setToast(null)

  return { toast, showToast, dismiss }
}
