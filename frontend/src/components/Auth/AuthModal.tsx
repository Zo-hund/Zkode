import { useState } from 'react'
import { X, Mail, Lock, User, AlertCircle } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.tsx'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [localError, setLocalError] = useState('')

  const { login, register, isLoading, error } = useAuth()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')

    try {
      if (isLoginMode) {
        await login(email, password)
      } else {
        if (!name.trim()) {
          setLocalError('Name is required')
          return
        }
        await register(email, password, name)
      }
      onClose()
    } catch (err) {
      // Error is handled by the auth context
    }
  }

  const displayError = error || localError

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-dark-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white">
              {isLoginMode ? 'Welcome Back' : 'Join ZKode'}
            </h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-blue-100 text-sm mt-1">
            {isLoginMode ? 'Sign in to continue coding' : 'Start your AI coding journey'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!isLoginMode && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your name"
                required={!isLoginMode}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Mail className="w-4 h-4 inline mr-2" />
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your password"
              required
              minLength={6}
            />
            {!isLoginMode && (
              <p className="text-xs text-gray-400 mt-1">
                Password must be at least 6 characters
              </p>
            )}
          </div>

          {displayError && (
            <div className="flex items-center space-x-2 text-red-400 bg-red-900/20 border border-red-800 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{displayError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{isLoginMode ? 'Signing In...' : 'Creating Account...'}</span>
              </div>
            ) : (
              <span>{isLoginMode ? 'Sign In' : 'Create Account'}</span>
            )}
          </button>

          {/* Demo Account */}
          {isLoginMode && (
            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-3 text-center">
              <p className="text-blue-300 text-sm mb-2">Try the demo account:</p>
              <button
                type="button"
                onClick={() => {
                  setEmail('demo@zkode.app')
                  setPassword('password123')
                }}
                className="text-blue-400 hover:text-blue-300 text-sm underline"
              >
                Use Demo Credentials
              </button>
            </div>
          )}

          {/* Toggle Mode */}
          <div className="text-center pt-4 border-t border-dark-800">
            <p className="text-gray-400 text-sm">
              {isLoginMode ? "Don't have an account? " : "Already have an account? "}
              <button
                type="button"
                onClick={() => {
                  setIsLoginMode(!isLoginMode)
                  setLocalError('')
                  setEmail('')
                  setPassword('')
                  setName('')
                }}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                {isLoginMode ? 'Sign Up' : 'Sign In'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}