import { ReactNode, useEffect } from 'react'

interface ToastProps {
  message: ReactNode
  duration?: number
  onClose: () => void
}

export default function Toast({
  message,
  duration = 3000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    const id = setTimeout(onClose, duration)
    return () => clearTimeout(id)
  }, [duration, onClose])

  return (
    <div role="status" className="toast">
      {message}
    </div>
  )
}
