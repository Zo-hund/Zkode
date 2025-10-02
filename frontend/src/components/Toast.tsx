import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  id: string
  message: string
  type: ToastType
  duration?: number
  onClose: (id: string) => void
}

export function Toast({ id, message, type, duration = 5000, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id)
    }, duration)

    return () => clearTimeout(timer)
  }, [id, duration, onClose])

  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <XCircle className="w-5 h-5" />,
    warning: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />
  }

  const styles = {
    success: 'bg-green-500/90 text-white',
    error: 'bg-red-500/90 text-white',
    warning: 'bg-yellow-500/90 text-white',
    info: 'bg-blue-500/90 text-white'
  }

  return (
    <div className={`${styles[type]} rounded-lg shadow-lg p-4 flex items-center gap-3 min-w-[300px] max-w-md animate-slide-in backdrop-blur-sm`}>
      <div className="flex-shrink-0">
        {icons[type]}
      </div>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
