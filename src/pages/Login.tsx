import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { http } from '../api/client'

const loginSchema = z.object({
  correo: z.string().min(1, 'Ingresa tu correo').email('Correo no válido'),
  contraseña: z.string().min(1, 'Ingresa tu contraseña'),
})

type LoginForm = z.infer<typeof loginSchema>

interface LoginResponse {
  token?: string
  accessToken?: string
  jwt?: string
}

export default function Login() {
  const { iniciarSesion, estaAutenticado } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [verContrasena, setVerContrasena] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (datos: LoginForm) => {
    setError(null)
    try {
      const res = await http.post<LoginResponse>('/api/auth/admin/login', datos)
      const token = res.token ?? res.accessToken ?? res.jwt
      if (!token) throw new Error('La respuesta del servidor no incluye un token')
      iniciarSesion(token)
      navigate('/', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión')
    }
  }

  if (estaAutenticado) {
    navigate('/', { replace: true })
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-taxi font-display text-xl font-extrabold text-ink-950">
              T
            </div>
            <h1 className="font-display text-xl font-bold text-ink-950">TaxiSur</h1>
            <p className="mt-1 text-sm text-gris">Panel administrativo</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div>
              <label htmlFor="correo" className="mb-1.5 block text-sm font-medium text-ink-950">
                Correo
              </label>
              <input
                id="correo"
                type="email"
                autoComplete="email"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-azul focus:ring-2 focus:ring-azul/30"
                {...register('correo')}
              />
              {errors.correo && <p className="mt-1 text-xs text-red-600">{errors.correo.message}</p>}
            </div>

            <div>
              <label htmlFor="contrasena" className="mb-1.5 block text-sm font-medium text-ink-950">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="contrasena"
                  type={verContrasena ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-12 text-sm outline-none focus:border-azul focus:ring-2 focus:ring-azul/30"
                  {...register('contraseña')}
                />
                <button
                  type="button"
                  onClick={() => setVerContrasena((v) => !v)}
                  className="absolute inset-y-0 right-2 text-xs font-semibold text-azul hover:underline"
                >
                  {verContrasena ? 'Ocultar' : 'Ver'}
                </button>
              </div>
              {errors.contraseña && (
                <p className="mt-1 text-xs text-red-600">{errors.contraseña.message}</p>
              )}
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-lg bg-taxi px-3 py-2.5 text-sm font-bold text-ink-950 transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isSubmitting ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}