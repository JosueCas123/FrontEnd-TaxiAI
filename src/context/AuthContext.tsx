import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { setToken } from '../api/token'

interface AuthContextValue {
  token: string | null
  estaAutenticado: boolean
  iniciarSesion: (nuevoToken: string) => void
  cerrarSesion: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null)
  const navigate = useNavigate()

  const cerrarSesion = () => {
    setToken(null)
    setTokenState(null)
    navigate('/login', { replace: true })
  }

  useEffect(() => {
    const desautorizado = () => cerrarSesion()
    window.addEventListener('auth:unauthorized', desautorizado)
    return () => window.removeEventListener('auth:unauthorized', desautorizado)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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