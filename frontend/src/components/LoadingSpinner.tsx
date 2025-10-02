import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div className="flex items-center gap-2">
      <Loader2 className={`${sizes[size]} animate-spin`} />
      {text && <span className="text-sm text-gray-400">{text}</span>}
    </div>
  )
}

interface LoadingOverlayProps {
  message?: string
}

export function LoadingOverlay({ message = 'Generating your code...' }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center z-10 animate-fade-in">
      <div className="text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-blue-400" />
        <p className="text-white font-medium">{message}</p>
        <p className="text-gray-400 text-sm mt-2 animate-pulse-slow">This may take a moment...</p>
      </div>
    </div>
  )
}
