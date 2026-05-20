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

  return (
    <div
      className={`fixed bottom-24 left-4 right-4 z-50 rounded-xl ${bg} px-4 py-3 text-sm text-white shadow-lg`}
      onClick={onDismiss}
    >
      {message}
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
