import { useQuery } from '@tanstack/react-query'
import { http } from '../api/client'

interface Indicadores {
  conductoresDisponibles: number
  conductoresEnServicio: number
  solicitudesActivas: number
  solicitudesCompletadas: number
}

const TARJETAS: { clave: keyof Indicadores; titulo: string }[] = [
  { clave: 'conductoresDisponibles', titulo: 'Conductores disponibles' },
  { clave: 'conductoresEnServicio', titulo: 'Conductores en servicio' },
  { clave: 'solicitudesActivas', titulo: 'Solicitudes activas' },
  { clave: 'solicitudesCompletadas', titulo: 'Solicitudes completadas hoy' },
]

export default function Home() {
  const { data, isPending } = useQuery<Indicadores>({
    queryKey: ['indicadores'],
    queryFn: () => http.get<Indicadores>('/api/dashboard/indicadores'),
    refetchInterval: 15_000,
  })

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink-950">Inicio</h1>
      <p className="mt-1 text-sm text-gris">
        Resumen de la operación en tiempo real.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {TARJETAS.map((tarjeta) => (
          <div key={tarjeta.clave} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm font-medium text-gris">{tarjeta.titulo}</p>
            <p className="mt-2 font-display text-4xl font-extrabold text-ink-950">
              {isPending ? '–' : (data?.[tarjeta.clave] ?? 0)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}