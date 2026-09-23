import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSessionId, setToken } from '../api/token'

interface AuthContextValue {
  token: string | null
  estaAutenticado: boolean
  iniciarSesion: (nuevoToken: string) => void
  cerrarSesion: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const cerrarSesion = () => {
    if (getSessionId() === null) return
    setToken(null)
    setTokenState(null)
    // Cancellation starts synchronously; never clear B after awaiting A.
    void queryClient.cancelQueries()
    queryClient.clear()
  }

  useEffect(() => {
    const desautorizado = (event: Event) => {
      const origin = (event as CustomEvent<{ sessionId: number | null }>).detail?.sessionId
      if (origin != null && origin === getSessionId()) cerrarSesion()
    }
    window.addEventListener('auth:unauthorized', desautorizado)
    return () => window.removeEventListener('auth:unauthorized', desautorizado)
  }, [queryClient])

  const iniciarSesion = (nuevoToken: string) => {
    setToken(nuevoToken)
    setTokenState(nuevoToken)
  }

  return (
    <AuthContext.Provider
      value={{ token, estaAutenticado: token !== null, iniciarSesion, cerrarSesion }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
