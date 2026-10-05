import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { onlineManager, useIsFetching, useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/client'
import type { ConductorListado, ConductorMapa, Indicadores, SolicitudActiva } from '../api/types'
import MapaFlota from '../components/MapaFlota'
import EstadoBadge from '../components/EstadoBadge'
import { claveConductores, rutaConductores, retryConductores, informacionErrorConductores } from '../lib/conductores'
import { CLAVE_CONDUCTORES_MAPA, ETIQUETAS_COLOR, conteoPorCategoria, conductoresConUbicacion, inicialesParaMostrar, retryMapa, informacionErrorMapa } from '../lib/mapa'
import { CLAVE_SOLICITUDES_ACTIVAS, fechaSolicitud, retrySolicitudes, informacionErrorSolicitudes } from '../lib/solicitudes'
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
  const [inicio] = useState(() => new Date())
  const lecturasEnVuelo = useIsFetching({ queryKey: CLAVE_INDICADORES })
  const lecturaBloqueada = useRef(false)
  const [avisoTeselas, setAvisoTeselas] = useState(false)
  const teselasFallidas = useRef(0)
  const conectado = useSyncExternalStore(
    (notificar) => onlineManager.subscribe(notificar),
    () => onlineManager.isOnline(),
  )

  useEffect(() => {
    const reevaluar = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', reevaluar)
    return () => document.removeEventListener('visibilitychange', reevaluar)
  }, [])

  const enCurso = lecturasEnVuelo > 0 || lecturaManual

  const { data, dataUpdatedAt, error, refetch, fetchStatus } = useQuery({
    queryKey: CLAVE_INDICADORES,
    queryFn: ({ signal }) => apiFetch<Indicadores>(RUTA_INDICADORES, { signal }),
    enabled: estaAutenticado,
    retry: retryIndicadores,
    refetchInterval: (query) => intervaloRefrescoIndicadores({ visible, enCurso: query.state.fetchStatus !== 'idle' }),
  })
  const ubicaciones = useQuery({
    queryKey: CLAVE_CONDUCTORES_MAPA,
    queryFn: ({ signal }) => apiFetch<ConductorMapa[]>('/api/dashboard/conductores-mapa', { signal }),
    enabled: estaAutenticado,
    retry: retryMapa,
    refetchInterval: (query) => intervaloRefrescoIndicadores({ visible, enCurso: query.state.fetchStatus !== 'idle' }),
  })
  const pendientes = useQuery({
    queryKey: claveConductores('pendiente'),
    queryFn: ({ signal }) => apiFetch<ConductorListado[]>(rutaConductores('pendiente'), { signal }),
    enabled: estaAutenticado,
    retry: retryConductores,
    refetchInterval: (query) => intervaloRefrescoIndicadores({ visible, enCurso: query.state.fetchStatus !== 'idle' }),
  })
  const solicitudes = useQuery({
    queryKey: CLAVE_SOLICITUDES_ACTIVAS,
    queryFn: ({ signal }) => apiFetch<SolicitudActiva[]>('/api/dashboard/solicitudes-activas', { signal }),
    enabled: estaAutenticado,
    retry: retrySolicitudes,
    refetchInterval: (query) => intervaloRefrescoIndicadores({ visible, enCurso: query.state.fetchStatus !== 'idle' }),
  })
  const sinConexion = !conectado || [fetchStatus, ubicaciones.fetchStatus, pendientes.fetchStatus, solicitudes.fetchStatus].includes('paused')
  const actualizando = enCurso || ubicaciones.isFetching || pendientes.isFetching || solicitudes.isFetching
  const bloqueado = actualizando || sinConexion || !estaAutenticado
  const pintables = conductoresConUbicacion(ubicaciones.data ?? [])
  const desactualizados = conteoPorCategoria(ubicaciones.data ?? []).ambar
  const primerasSolicitudes = solicitudes.data?.slice(0, 4) ?? []
  const panel = 'min-w-0 overflow-hidden rounded-[14px] border border-slate-200 bg-white'
  const cabecera = 'flex flex-wrap items-center justify-between gap-3 px-4 py-[18px] sm:px-[22px] sm:py-[21px]'
  const titulo = 'font-display text-base font-bold tracking-[-0.3px] text-ink-950 sm:text-lg'
  const enlace = 'inline-flex items-center gap-2 text-xs font-semibold text-azul hover:underline focus-visible:outline-2 focus-visible:outline-azul sm:text-[13px]'
  const insignia = 'rounded-md bg-surface px-2 py-0.5 text-xs font-semibold text-gris tabular-nums'

  const estadoPanel = (consulta: { data: unknown; error: unknown; isPending: boolean }, nombre: string,
    informar: (error: unknown) => { mensaje: string; recuperable: boolean } | null) => {
    const info = consulta.error && !esCancelacion(consulta.error) ? informar(consulta.error) : null
    if (info) return <div role={consulta.data === undefined ? 'alert' : 'status'} className="m-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
      <p>No se pudieron {consulta.data === undefined ? 'cargar' : 'actualizar'} {nombre}. {info.mensaje}</p>
      {consulta.data !== undefined && <p>Los datos mostrados pueden estar desactualizados.</p>}
      {info.recuperable && <Button variant="ghost" className="mt-2 border border-amber-300" disabled={bloqueado} onClick={refrescar}>Reintentar</Button>}
    </div>
    if (consulta.data === undefined && consulta.isPending) return <p role="status" className="p-5 text-sm text-gris">
      {sinConexion ? `Sin conexion. Pendiente de consultar ${nombre}.` : `Cargando ${nombre}...`}
    </p>
    return null
  }

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
  const fecha = fechaIndicadoresParaMostrar(dataUpdatedAt ? new Date(dataUpdatedAt) : inicio)

  const contador = (clave: ClaveIndicador) => {
    const valor = data?.[clave]
    return typeof valor === 'number' ? valor : '–'
  }

  const refrescar = () => {
    if (lecturaBloqueada.current || bloqueado || !puedeDispararRefrescoIndicadores(actualizando)) return
    lecturaBloqueada.current = true
    setLecturaManual(true)
    void Promise.all([refetch({ cancelRefetch: false }), ubicaciones.refetch({ cancelRefetch: false }),
      pendientes.refetch({ cancelRefetch: false }), solicitudes.refetch({ cancelRefetch: false })]).finally(() => {
      lecturaBloqueada.current = false
      setLecturaManual(false)
    })
  }

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[1.5px] text-gris sm:text-xs">Centro de operaciones</p>
          <h1 className="font-display text-2xl font-extrabold tracking-[-0.8px] text-ink-950 sm:text-[28px]">Resumen de la operacion</h1>
          <p className="mt-1 text-sm text-gris">
            Todo lo que necesitas para supervisar tu flota, en un solo lugar.
          </p>
        </div>
        <div className="flex items-center gap-4">
        <span className="hidden text-[13px] capitalize text-gris min-[1201px]:inline">{fecha}</span>
        <Button
          variant="ghost"
          className="gap-2 border border-slate-300"
          disabled={bloqueado}
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
          {actualizando ? 'Actualizando...' : 'Actualizar'}
        </Button>
        </div>
      </div>

      {sinConexion && <p role="status" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Sin conexion. La consulta se reanudara al recuperar la conexion. Los datos mostrados pueden estar desactualizados.
      </p>}

      {lecturaManual && (
        <p role="status" className="mt-3 text-sm text-gris">
          Actualizando resumen...
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
              disabled={bloqueado}
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
              disabled={bloqueado}
              onClick={refrescar}
            >
              Reintentar
            </Button>
          )}
        </Alert>
      )}

      <section
        aria-label="Indicadores del dia"
        className="mt-6 grid grid-cols-2 gap-[11px] sm:gap-3 min-[1001px]:grid-cols-4 xl:gap-[18px]"
      >
        {TARJETAS.map((tarjeta) => (
          <article
            key={tarjeta.clave}
            className={`min-h-[146px] overflow-hidden rounded-[14px] border border-slate-200 border-b-[3px] bg-white px-3.5 py-[15px] sm:min-h-[148px] sm:px-4 sm:pb-3.5 sm:pt-4 sm:text-[13px] xl:min-h-[160px] xl:px-[21px] xl:pb-[18px] xl:pt-[21px] ${BORDE_INFERIOR[tarjeta.pie.color]}`}
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="min-w-0 text-[13px] font-[550] text-gris xl:text-sm">
                {tarjeta.titulo}
              </h2>
              <span
                aria-hidden="true"
                className={`grid h-[27px] w-[27px] shrink-0 place-items-center rounded-[7px] sm:h-8 sm:w-8 xl:h-[36px] xl:w-[36px] xl:rounded-[10px] ${ESTILO_ICONO[tarjeta.pie.color]}`}
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

      <div className="my-[18px] grid grid-cols-1 gap-[18px] min-[1001px]:grid-cols-[minmax(0,1.55fr)_minmax(275px,1fr)] xl:my-6 xl:grid-cols-[minmax(0,1.9fr)_minmax(288px,1fr)] xl:gap-[22px]">
        <section className={`${panel} mapa-pagina gap-0!`} aria-labelledby="home-mapa">
          <div className={cabecera}>
            <div><h2 id="home-mapa" className={titulo}>Tu flota en el mapa</h2>
              <p className="mt-1 text-xs text-gris sm:text-[13px]">{ubicaciones.data === undefined ? 'Ultimas ubicaciones reportadas'
                : `${pintables.length} de ${ubicaciones.data.length} conductores con coordenadas disponibles`}</p></div>
            <Link className={enlace} to="/mapa">Ver mapa completo <span aria-hidden="true">&rarr;</span></Link>
          </div>
          {estadoPanel(ubicaciones, 'las ubicaciones', informacionErrorMapa)}
          <div className="mapa-lienzo h-[300px] sm:h-[324px] min-[1550px]:h-[350px] [&_.leaflet-container]:h-full! [&_.leaflet-container]:min-h-0!" role="region" aria-label="Mapa compacto de conductores">
            <MapaFlota conductores={pintables} ahora={ubicaciones.dataUpdatedAt}
              alCargarTesela={() => { teselasFallidas.current = 0; setAvisoTeselas(false) }}
              alFallarTesela={() => { if (++teselasFallidas.current > 3) setAvisoTeselas(true) }} />
            {ubicaciones.data !== undefined && pintables.length === 0 && <div className="mapa-vacio">
              <p className="mapa-vacio-titulo">{ubicaciones.data.length === 0 ? 'Sin conductores' : 'Sin ubicaciones para mostrar'}</p>
              <p>No hay coordenadas disponibles. Consulta el directorio del mapa para ver los detalles.</p>
            </div>}
            {ubicaciones.data === undefined && <p className="mapa-vacio">{sinConexion ? 'Sin conexion' : ubicaciones.error ? 'Ubicaciones no disponibles' : 'Cargando ubicaciones...'}</p>}
            {avisoTeselas && <p role="status" className="mapa-nota-teselas">No se pudo cargar el mapa base. Las coordenadas de los conductores se conservan.</p>}
          </div>
          <div className="mapa-leyenda rounded-none! border-0!">
            {Object.entries(ETIQUETAS_COLOR).map(([color, etiqueta]) => <span key={color} className="mapa-leyenda-item">
              <span aria-hidden="true" className={`mapa-punto mapa-punto--${color}`} />{etiqueta}
            </span>)}
          </div>
        </section>

        <section className={`${panel} flex flex-col`} aria-labelledby="home-revisar">
          <div className={cabecera}><div>
            <div className="flex items-center gap-2.5"><h2 id="home-revisar" className={titulo}>Por revisar</h2><span className={insignia}>{pendientes.data?.length ?? '\u2013'}</span></div>
            <p className="mt-1 text-[13px] text-gris">Registros de nuevos conductores</p>
          </div></div>
          {estadoPanel(pendientes, 'los registros pendientes', informacionErrorConductores)}
          <div className="grow px-[22px]">
            {pendientes.data?.slice(0, 3).map((conductor, indice) => <Link key={conductor.id}
              className="flex items-center gap-3 border-b border-slate-100 py-[18px] hover:bg-surface focus-visible:outline-2 focus-visible:outline-azul"
              to={`/conductores/${encodeURIComponent(conductor.id)}`}>
              <span aria-hidden="true" className={`grid size-[38px] shrink-0 place-items-center rounded-full text-xs font-semibold ${['bg-azul/10 text-azul', 'bg-verde/10 text-verde', 'bg-ambar/10 text-ambar'][indice]}`}>{inicialesParaMostrar(conductor.nombreCompleto)}</span>
              <span className="min-w-0 grow [overflow-wrap:anywhere]"><strong className="block text-[13px] font-semibold">{conductor.nombreCompleto}</strong>
                <span className="mt-1 block text-[11px] text-gris">{conductor.vehiculo ? `${conductor.vehiculo.marca} ${conductor.vehiculo.modelo} · ${conductor.vehiculo.placa}` : 'Sin vehiculo registrado'}</span></span>
              <span aria-hidden="true" className="text-gris">&rsaquo;</span>
            </Link>)}
            {pendientes.data?.length === 0 && <div className="py-12 text-center"><p className="font-semibold">Todo al dia</p><p className="mt-2 text-sm text-gris">No hay registros pendientes.</p></div>}
          </div>
          <div className="px-[22px] pb-5 pt-4">
            <Link to="/conductores" className="flex min-h-11 items-center justify-between rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-azul">Revisar pendientes <span aria-hidden="true">&rarr;</span></Link>
            <p className="mt-3 text-center text-[11px] text-gris">Revisa los datos antes de aprobar.</p>
          </div>
        </section>
      </div>

      {ubicaciones.data !== undefined && desactualizados > 0 && <div className="mb-6 flex flex-wrap items-center gap-3 rounded-[10px] border border-ambar/25 bg-ambar/5 px-4 py-3 text-xs text-ambar sm:text-[13px]">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="size-[18px] shrink-0"><path d="m12 3 10 18H2L12 3ZM12 9v4M12 17h.01" /></svg>
        <p className="min-w-0 flex-1"><strong>{desactualizados} {desactualizados === 1 ? 'ubicacion desactualizada' : 'ubicaciones desactualizadas'}.</strong> {desactualizados === 1 ? 'Este conductor no recibe nuevas solicitudes.' : 'Estos conductores no reciben nuevas solicitudes.'}</p>
        <Link className={`${enlace} text-ambar!`} to="/mapa?filtro=ambar">Ver en el mapa <span aria-hidden="true">&rarr;</span></Link>
      </div>}

      <section className={panel} aria-labelledby="home-solicitudes">
        <div className={cabecera}>
          <div className="flex items-center gap-2.5"><h2 id="home-solicitudes" className={titulo}>Solicitudes activas</h2><span className={insignia}>{solicitudes.data?.length ?? '\u2013'}</span></div>
          <div className="flex items-center gap-4"><span className="rounded-full bg-surface px-2.5 py-1 text-[11px] text-gris">Solo lectura</span>
            <Link className={enlace} to="/solicitudes">Ver todas <span aria-hidden="true">&rarr;</span></Link></div>
        </div>
        {estadoPanel(solicitudes, 'las solicitudes', informacionErrorSolicitudes)}
        {solicitudes.data?.length === 0 && <p className="p-6 text-sm text-gris">No hay solicitudes activas.</p>}
        {primerasSolicitudes.length > 0 && <div className="overflow-x-auto" role="region" aria-label="Primeras cuatro solicitudes activas" tabIndex={0}>
          <table className="w-full min-w-[700px] table-fixed border-collapse text-left text-[13px]">
            <caption className="sr-only">Solicitudes en el orden recibido. Fechas en America/La_Paz.</caption>
            <thead className="border-y border-slate-100 bg-surface/60 text-[11px] uppercase tracking-wide text-gris"><tr>
              {['Solicitud', 'Pasajero', 'Conductor asignado', 'Estado', 'Hora de creacion'].map((campo) => <th key={campo} scope="col" className="px-[22px] py-3 font-semibold">{campo}</th>)}
            </tr></thead>
            <tbody>{primerasSolicitudes.map((solicitud) => <tr key={solicitud.id} className="border-b border-slate-100 [overflow-wrap:anywhere]">
              <td className="px-[22px] py-[18px] font-mono text-xs">{solicitud.id}</td>
              <td className="px-[22px] py-[18px] font-semibold">{solicitud.pasajero?.nombre ?? 'No disponible'}</td>
              <td className="px-[22px] py-[18px]">{solicitud.conductorAsignado?.nombreCompleto ?? <span className="text-gris">Sin conductor asignado</span>}</td>
              <td className="px-[22px] py-[18px]"><EstadoBadge estado={solicitud.estado} /></td>
              <td className="px-[22px] py-[18px] tabular-nums text-gris">{fechaSolicitud(solicitud.creadoEn)}</td>
            </tr>)}</tbody>
          </table>
        </div>}
        <div className="flex flex-wrap justify-between gap-2 px-4 py-3.5 text-[11px] text-gris sm:px-[22px]">
          <span>{solicitudes.data === undefined ? 'Sin lectura confirmada' : `Mostrando ${primerasSolicitudes.length} de ${solicitudes.data.length} solicitudes`}</span>
          <span>Consulta cada 15 s mientras esta vista esta visible · Hora de Bolivia</span>
        </div>
      </section>
    </div>
  )
}
