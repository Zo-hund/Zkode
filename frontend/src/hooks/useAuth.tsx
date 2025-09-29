import { useState, useEffect, createContext, useContext } from 'react'
import type { ReactNode } from 'react'
import { apiEndpoints } from '../config/env'

interface User {
  id: string
  email: string
  name: string
  createdAt: string
  preferences: {
    defaultFramework: string
    defaultModel: string
    theme: string
  }
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  error: string | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)


  useEffect(() => {
    // Check for existing token on load
    const savedToken = localStorage.getItem('zkode_token')
    if (savedToken) {
      setToken(savedToken)
      fetchProfile(savedToken)
    } else {
      setIsLoading(false)
    }
  }, [])

  const fetchProfile = async (authToken: string) => {
    try {
      const response = await fetch(apiEndpoints.auth.profile, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })

      if (response.ok) {
        const profile = await response.json()
        setUser(profile)
      } else {
        // Token is invalid, clear it
        localStorage.removeItem('zkode_token')
        setToken(null)
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      localStorage.removeItem('zkode_token')
      setToken(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(apiEndpoints.auth.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem('zkode_token', data.token)
      } else {
        throw new Error(data.error || 'Login failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(apiEndpoints.auth.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password, name })
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setToken(data.token)
        localStorage.setItem('zkode_token', data.token)
      } else {
        throw new Error(data.error || 'Registration failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('zkode_token')
  }

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
    error
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}