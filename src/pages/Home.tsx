import { useEffect, useRef, useState } from 'react'
import { useIsFetching, useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/client'
import type { Indicadores } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import {
  CLAVE_INDICADORES,
  TARJETAS,
  fechaIndicadoresParaMostrar,
  informacionErrorIndicadores,
  intervaloRefrescoIndicadores,
  puedeDispararRefrescoIndicadores,
  retryIndicadores,
  type ClaveIndicador,
  type ColorPie,
  type NombreIcono,
} from '../lib/indicadores'

const RUTA_INDICADORES = '/api/dashboard/indicadores'

const ICONOS: Record<NombreIcono, string> = {
  car: 'M5 17H3v-6l2-6h14l2 6v6h-2M5 17h14M5 17v3M19 17v3M3 11h18M7 14h.01M17 14h.01M9 2h6',
  pin: 'M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  requests: 'M8 3H5a2 2 0 0 0-2 2v15a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V5a2 2 0 0 0-2-2h-3M8 2h8v4H8zM7 11h10M7 16h6',
  checkCircle: 'M22 11.1V12a10 10 0 1 1-5.9-9.1M22 4l-10 10-3-3',
}

const COLOR_PIE: Record<ColorPie, string> = {
  verde: 'bg-verde',
  azul: 'bg-azul',
  ambar: 'bg-ambar',
  gris: 'bg-gris',
}

const ESTILO_ICONO: Record<ColorPie, string> = {
  verde: 'bg-verde/10 text-verde',
  azul: 'bg-azul/10 text-azul',
  ambar: 'bg-ambar/10 text-ambar',
  gris: 'bg-gris/10 text-gris',
}

const BORDE_INFERIOR: Record<ColorPie, string> = {
  verde: 'border-b-verde/45',
  azul: 'border-b-azul/45',
  ambar: 'border-b-ambar/55',
  gris: 'border-b-gris/35',
}

const esCancelacion = (error: unknown) =>
  error instanceof DOMException ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'CancelledError'

export default function Home() {
  const { estaAutenticado } = useAuth()
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible')
  const [lecturaManual, setLecturaManual] = useState(false)
  const lecturasEnVuelo = useIsFetching({ queryKey: CLAVE_INDICADORES })
  const lecturaBloqueada = useRef(false)

  useEffect(() => {
    const reevaluar = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', reevaluar)
    return () => document.removeEventListener('visibilitychange', reevaluar)
  }, [])

  const enCurso = lecturasEnVuelo > 0 || lecturaManual

  const { data, error, refetch } = useQuery({
    queryKey: CLAVE_INDICADORES,
    queryFn: ({ signal }) => apiFetch<Indicadores>(RUTA_INDICADORES, { signal }),
    enabled: estaAutenticado,
    retry: retryIndicadores,
    refetchInterval: () => intervaloRefrescoIndicadores({ visible, enCurso }),
  })

  useEffect(() => {
    if (data === undefined) return
    for (const { clave } of TARJETAS) {
      if (typeof data[clave] !== 'number') {
        console.warn(`Indicadores: el contador ${clave} no es numerico y se muestra como guion.`)
      }
    }
  }, [data])

  const fallo = error !== null && !esCancelacion(error) ? error : null
  const infoError = fallo === null ? null : informacionErrorIndicadores(fallo)
  const hayLecturaConfirmada = data !== undefined
  const fecha = fechaIndicadoresParaMostrar(new Date())

  const contador = (clave: ClaveIndicador) => {
    const valor = data?.[clave]
    return typeof valor === 'number' ? valor : '–'
  }

  const refrescar = () => {
    if (lecturaBloqueada.current || !puedeDispararRefrescoIndicadores(enCurso)) return
    lecturaBloqueada.current = true
    setLecturaManual(true)
    void refetch().finally(() => {
      lecturaBloqueada.current = false
      setLecturaManual(false)
    })
  }

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold text-ink-950">Inicio</h1>
          <p className="mt-1 text-sm text-gris">
            Todo lo que necesitas para supervisar tu flota, en un solo lugar.
          </p>
        </div>
        <Button
          variant="ghost"
          className="gap-2 border border-slate-300"
          disabled={enCurso}
          onClick={refrescar}
        >
          <svg
            aria-hidden="true"
            focusable="false"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 shrink-0"
          >
            <path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1" />
          </svg>
          {enCurso ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </div>

      {lecturaManual && (
        <p role="status" className="mt-3 text-sm text-gris">
          Actualizando indicadores...
        </p>
      )}

      {infoError && hayLecturaConfirmada && (
        <div
          role="status"
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <p>{infoError.mensaje}</p>
          <p>Los indicadores mostrados pueden estar desactualizados.</p>
          {infoError.recuperable && (
            <Button
              variant="ghost"
              className="mt-2 border border-amber-300"
              disabled={enCurso}
              onClick={refrescar}
            >
              Reintentar
            </Button>
          )}
        </div>
      )}

      {infoError && !hayLecturaConfirmada && (
        <Alert className="mt-4">
          <p>{infoError.mensaje}</p>
          <p>No se pudieron leer los indicadores.</p>
          {infoError.recuperable && (
            <Button
              variant="ghost"
              className="mt-2 border border-slate-300"
              disabled={enCurso}
              onClick={refrescar}
            >
              Reintentar
            </Button>
          )}
        </Alert>
      )}

      <section
        aria-label="Indicadores del dia"
        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3 xl:grid-cols-4 xl:gap-[18px]"
      >
        {TARJETAS.map((tarjeta) => (
          <article
            key={tarjeta.clave}
            className={`min-h-[160px] overflow-hidden rounded-[14px] border border-slate-200 border-b-[3px] bg-white px-5 pb-4 pt-[21px] sm:min-h-[148px] sm:px-4 sm:pb-3.5 sm:pt-4 sm:text-[13px] xl:min-h-[160px] xl:px-[21px] xl:pb-[18px] xl:pt-[21px] ${BORDE_INFERIOR[tarjeta.pie.color]}`}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="min-w-0 text-sm font-[550] text-gris sm:text-[13px] xl:text-sm">
                {tarjeta.titulo}
              </h2>
              <span
                aria-hidden="true"
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-[10px] sm:h-8 sm:w-8 sm:rounded-[7px] xl:h-[36px] xl:w-[36px] xl:rounded-[10px] ${ESTILO_ICONO[tarjeta.pie.color]}`}
              >
                <svg
                  aria-hidden="true"
                  focusable="false"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5 shrink-0"
                >
                  <path d={ICONOS[tarjeta.icono]} />
                </svg>
              </span>
            </div>
            <p className="mb-[13px] mt-1.5 font-display text-[34px] font-extrabold leading-[1.2] tracking-[-1.3px] tabular-nums text-ink-950 xl:text-[37px]">
              {contador(tarjeta.clave)}
            </p>
            <p className="flex items-center gap-1.5 text-xs text-gris">
              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${COLOR_PIE[tarjeta.pie.color]}`}
              />
              <span className="min-w-0">
                {tarjeta.clave === 'solicitudesCompletadasHoy'
                  ? `${tarjeta.pie.texto}: ${fecha}`
                  : tarjeta.pie.texto}
              </span>
            </p>
          </article>
        ))}
      </section>
    </div>
  )
}