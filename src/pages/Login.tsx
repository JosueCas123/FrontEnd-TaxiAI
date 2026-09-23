import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ApiError, http } from '../api/client'
import { getSessionRevision } from '../api/token'
import type { TokenAdmin } from '../api/types'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Alert } from '../components/ui/alert'

const loginSchema = z.object({
  correo: z.string().min(1, 'Ingresa tu correo').email('Correo no válido'),
  contraseña: z.string().min(1, 'Ingresa tu contraseña'),
})

type LoginForm = z.infer<typeof loginSchema>

const tokenAdminSchema: z.ZodType<TokenAdmin> = z.object({
  token: z.string().refine(value => value.trim().length > 0),
  tokenType: z.literal('Bearer'),
  expiresIn: z.number().finite().positive(),
})

const iconPaths = {
  car: 'M5 17H3v-6l2-6h14l2 6v6h-2M5 17h14M5 17v3M19 17v3M3 11h18M7 14h.01M17 14h.01M9 2h6',
  shield: 'm12 2 8 4v6c0 5-8 10-8 10S4 17 4 12V6zM8 12l3 3 5-6',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  arrow: 'M4 12h16M14 6l6 6-6 6',
}

function Icon({ name, className = '' }: { name: keyof typeof iconPaths; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={iconPaths[name]} />
    </svg>
  )
}

export default function Login() {
  const { iniciarSesion, estaAutenticado } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [verContrasena, setVerContrasena] = useState(false)
  const pending = useRef(false)
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (datos: LoginForm) => {
    if (pending.current) return
    pending.current = true
    const origin = getSessionRevision()
    setError(null)
    try {
      const res = await http.post<unknown>('/api/auth/admin/login', datos)
      if (!mounted.current || origin !== getSessionRevision()) return
      const parsed = tokenAdminSchema.safeParse(res)
      if (!parsed.success) {
        setError('Respuesta de autenticación inválida. Intenta nuevamente.')
        return
      }
      iniciarSesion(parsed.data.token)
    } catch (e) {
      if (!mounted.current || origin !== getSessionRevision()) return
      setError(e instanceof ApiError ? e.message : e instanceof SyntaxError
        ? 'Respuesta de autenticación inválida. Intenta nuevamente.'
        : 'No se pudo conectar con el servidor. Intenta nuevamente.')
    } finally {
      pending.current = false
    }
  }

  if (estaAutenticado) {
    return <Navigate to="/" replace />
  }

  return (
    <main className="grid min-h-dvh bg-white font-sans text-ink-950 lg:grid-cols-2">
      <section className="hidden flex-col bg-ink-950 p-12 text-white lg:flex xl:p-16" aria-label="TaxiSur, centro de operaciones">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-taxi text-ink-950"><Icon name="car" className="h-6 w-6" /></span>
          <p className="font-display text-2xl font-bold">Taxi<span className="text-taxi">Sur</span></p>
        </div>
        <div className="my-auto py-16">
          <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-slate-300">Centro de operaciones</p>
          <h2 className="max-w-lg font-display text-5xl font-bold leading-tight tracking-tight">Tu flota conectada.<br /><span className="text-taxi">Tu operación, clara.</span></h2>
          <p className="mt-6 max-w-sm text-base leading-8 text-slate-300">Supervisa los servicios y acompaña a tu equipo desde un solo lugar.</p>
          <p className="mt-10 flex items-center gap-3 text-sm text-slate-200"><Icon name="shield" className="h-4 w-4 text-taxi" />Acceso para la administración de TaxiSur</p>
        </div>
        <p className="text-xs text-slate-300">TaxiSur Admin · Panel administrativo</p>
      </section>
      <section className="flex min-w-0 items-center justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm">
          <div className="mb-12 flex items-center gap-3 font-display text-2xl font-bold lg:hidden">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-taxi text-ink-950"><Icon name="car" className="h-6 w-6" /></span>
            <span>Taxi<span className="rounded bg-taxi px-1 text-ink-950">Sur</span></span>
          </div>
          <div className="mb-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-600">Bienvenido a TaxiSur</p>
            <h1 className="font-display text-3xl font-bold tracking-tight">Ingresa a tu panel</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">Usa tu correo y contraseña de administrador.</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate aria-busy={isSubmitting}>
            <div>
              <Label htmlFor="correo">Correo electrónico</Label>
              <Input
                id="correo"
                type="email"
                autoComplete="username"
                aria-invalid={!!errors.correo}
                aria-describedby={errors.correo ? 'correo-error' : undefined}
                {...register('correo')}
              />
              {errors.correo && <p id="correo-error" role="alert" className="mt-2 text-sm text-destructive">{errors.correo.message}</p>}
            </div>

            <div>
              <Label htmlFor="contrasena">Contraseña</Label>
              <div className="relative">
                <Input
                  id="contrasena"
                  type={verContrasena ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="pr-20"
                  aria-invalid={!!errors.contraseña}
                  aria-describedby={errors.contraseña ? 'contrasena-error' : undefined}
                  {...register('contraseña')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={verContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={verContrasena}
                  onClick={() => setVerContrasena((v) => !v)}
                  className="absolute inset-y-0 right-1 my-auto w-12 px-0"
                >
                  <Icon name="eye" className="h-5 w-5" />
                </Button>
              </div>
              {errors.contraseña && (
                <p id="contrasena-error" role="alert" className="mt-2 text-sm text-destructive">{errors.contraseña.message}</p>
              )}
            </div>

            {error && (
              <Alert>{error}</Alert>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full gap-2"
            >
              {isSubmitting ? 'Ingresando…' : 'Ingresar'}
              <Icon name="arrow" className="h-4 w-4 shrink-0" />
            </Button>
          </form>
        </div>
      </section>
    </main>
  )
}
