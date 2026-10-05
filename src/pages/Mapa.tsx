import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { onlineManager, useIsFetching, useQuery } from '@tanstack/react-query'
import L from 'leaflet'
import MapaFlota from '../components/MapaFlota'
import './Mapa.css'
import { apiFetch } from '../api/client'
import type { ConductorMapa } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import {
  CATEGORIAS_FILTRO,
  CLAVE_CONDUCTORES_MAPA,
  ETIQUETAS_COLOR,
  antiguedadUbicacionParaMostrar,
  conteoPorCategoria,
  conductoresConUbicacion,
  conductoresVisibles,
  estadoParaMostrar,
  getColorMarcador,
  informacionErrorMapa,
  inicialesParaMostrar,
  intervaloRefrescoMapa,
  puedeDispararRefrescoMapa,
  retryMapa,
  textoVehiculoParaMostrar,
  type CategoriaFiltro,
} from '../lib/mapa'

const RUTA_CONDUCTORES_MAPA = '/api/dashboard/conductores-mapa'

const ICONOS = {
  pin: 'M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  alerta: 'M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0ZM12 9v4M12 17h.01',
  ojo: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  flecha: 'M5 12h14M12 5l7 7-7 7',
  mapa: 'M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4ZM8 2v16M16 6v16',
  cerrar: 'M18 6 6 18M6 6l12 12',
} as const

const esCancelacion = (error: unknown) =>
  error instanceof DOMException ? error.name === 'AbortError'
    : error instanceof Error && error.name === 'CancelledError'

const punto = (color: string) => <span aria-hidden="true" className={`mapa-punto mapa-punto--${color}`} />

export default function Mapa() {
  const [parametros] = useSearchParams()
  const { estaAutenticado } = useAuth()
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible')
  const [lecturaManual, setLecturaManual] = useState(false)
  const [categoria, setCategoria] = useState<CategoriaFiltro>(() => parametros.get('filtro') === 'ambar' ? 'ambar' : 'todos')
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const [avisoTeselas, setAvisoTeselas] = useState(false)
  const lecturasEnVuelo = useIsFetching({ queryKey: CLAVE_CONDUCTORES_MAPA })
  const lecturaBloqueada = useRef(false)
  const conectado = useSyncExternalStore(
    (notificar) => onlineManager.subscribe(notificar),
    () => onlineManager.isOnline(),
  )
  const mapa = useRef<L.Map | null>(null)
  const marcadores = useRef(new Map<string, L.Marker>())
  const teselas = useRef({ fallidas: 0, descartado: false })

  useEffect(() => {
    const reevaluar = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', reevaluar)
    return () => document.removeEventListener('visibilitychange', reevaluar)
  }, [])

  const { data, dataUpdatedAt, error, isPending, fetchStatus, refetch } = useQuery({
    queryKey: CLAVE_CONDUCTORES_MAPA,
    queryFn: ({ signal }) => apiFetch<ConductorMapa[]>(RUTA_CONDUCTORES_MAPA, { signal }),
    enabled: estaAutenticado,
    retry: retryMapa,
    refetchInterval: (query) => intervaloRefrescoMapa({ visible, enCurso: query.state.fetchStatus !== 'idle' }),
  })
  const pausada = fetchStatus === 'paused'
  const sinConexion = !conectado || pausada
  const enCurso = !pausada && (lecturasEnVuelo > 0 || lecturaManual)

  const refrescar = () => {
    if (pausada || lecturaBloqueada.current || !puedeDispararRefrescoMapa(enCurso)) return
    lecturaBloqueada.current = true
    setLecturaManual(true)
    void refetch({ cancelRefetch: false }).finally(() => {
      lecturaBloqueada.current = false
      setLecturaManual(false)
    })
  }

  const elegirCategoria = (nueva: CategoriaFiltro) => {
    setCategoria(nueva)
  }

  const cargando = data === undefined && isPending && !sinConexion
  const hayLecturaConfirmada = data !== undefined
  const fallo = error !== null && !esCancelacion(error) ? error : null
  const infoError = fallo === null ? null : informacionErrorMapa(fallo)
  const conductores = data ?? []
  const visibles = conductoresVisibles(conductores, categoria)
  const pintables = conductoresConUbicacion(visibles)
  const conteos = conteoPorCategoria(conductores)
  const filtroVacio = hayLecturaConfirmada && visibles.length === 0
  const sinUbicaciones = hayLecturaConfirmada && visibles.length > 0 && pintables.length === 0

  const recentrar = (conductor: ConductorMapa) => {
    setSeleccionado(conductor.id)
    if (conductor.ubicacion === null || mapa.current === null) return
    const objetivo: L.LatLngExpression = [conductor.ubicacion.latitud, conductor.ubicacion.longitud]
    const mapaActual = mapa.current
    // El popup se abre al terminar el vuelo: abierto durante el vuelo, su autoPan
    // compite con la animacion y el marcador deja de quedar centrado.
    mapaActual.once('moveend', () => marcadores.current.get(conductor.id)?.openPopup())
    mapaActual.flyTo(objetivo, mapaActual.getZoom(), { duration: 0.4 })
  }

  // Cuatro fallos consecutivos, no acumulados durante toda la vida del mapa.
  // Una carga recuperada reinicia tanto la racha como el descarte del usuario.
  const alCargarTesela = () => {
    const cuenta = teselas.current
    cuenta.fallidas = 0
    cuenta.descartado = false
    setAvisoTeselas(false)
  }
  const alFallarTesela = () => {
    const cuenta = teselas.current
    cuenta.fallidas += 1
    if (cuenta.fallidas > 3 && !cuenta.descartado) setAvisoTeselas(true)
  }
  const cerrarAvisoTeselas = () => {
    teselas.current.descartado = true
    setAvisoTeselas(false)
  }

  const descripcionUbicacion = (conductor: ConductorMapa) =>
    conductor.ubicacion === null && conductor.ultimaUbicacionRegistradaEn === null
      ? `${estadoParaMostrar(conductor)} · Sin ubicacion reportada`
      : `${estadoParaMostrar(conductor)} · ${antiguedadUbicacionParaMostrar(conductor, dataUpdatedAt)}`

  return (
    <div className="mapa-pagina min-w-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold text-ink-950">Mapa</h1>
          <p className="mt-1 text-sm text-gris">
            Consulta la ultima ubicacion reportada por cada conductor.
          </p>
        </div>
        <Button variant="ghost" className="gap-2 border border-slate-300" disabled={enCurso}
          onClick={refrescar}>
          <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0">
            <path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1" />
          </svg>
          {enCurso ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </div>

      {lecturaManual && !pausada && (
        <p role="status" className="mt-3 text-sm text-gris">Actualizando ubicaciones de conductores...</p>
      )}

      {sinConexion && <div role="status" className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p>Sin conexion. La consulta se reanudara al recuperar la conexion.</p>
        <p>{hayLecturaConfirmada ? 'Las ubicaciones mostradas pueden estar desactualizadas.' : 'Todavia no hay una lectura confirmada de conductores.'}</p>
      </div>}

      {!sinConexion && infoError && hayLecturaConfirmada && (
        <div role="status"
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p>{infoError.mensaje}</p>
          <p>Las ubicaciones mostradas pueden estar desactualizadas.</p>
          {infoError.recuperable && (
            <Button variant="ghost" className="mt-2 border border-amber-300" disabled={enCurso}
              onClick={refrescar}>Reintentar</Button>
          )}
        </div>
      )}

      {!sinConexion && infoError && !hayLecturaConfirmada && (
        <Alert className="mt-4">
          <p>{infoError.mensaje}</p>
          <p>No se pudieron leer las ubicaciones de los conductores.</p>
          {infoError.recuperable && (
            <Button variant="ghost" className="mt-2 border border-slate-300" disabled={enCurso}
              onClick={refrescar}>Reintentar</Button>
          )}
        </Alert>
      )}

      <div role="group" aria-label="Filtrar conductores del mapa" className="mapa-filtros">
        {CATEGORIAS_FILTRO.map((chip) => <Button key={chip.clave} aria-pressed={categoria === chip.clave}
          variant="ghost" className={`mapa-chip ${categoria === chip.clave ? 'mapa-chip--activo' : ''}`}
          onClick={() => elegirCategoria(chip.clave)}>
          {chip.color !== null && punto(chip.color)}
          {chip.etiqueta}
          <span className="mapa-chip-conteo">{hayLecturaConfirmada ? conteos[chip.clave] : '–'}</span>
        </Button>)}
      </div>

      <section className="mapa-panel" aria-label="Mapa y directorio de conductores">
        <div className="mapa-lienzo" role="region"
          aria-label="Mapa de los conductores con la ultima ubicacion reportada por cada uno, segun GET /api/dashboard/conductores-mapa">
          <MapaFlota conductores={pintables} ahora={dataUpdatedAt} categoria={categoria} mapaRef={mapa}
            alSeleccionar={setSeleccionado} alCargarTesela={alCargarTesela} alFallarTesela={alFallarTesela}
            marcadorRef={(id, instancia) => {
              if (instancia) marcadores.current.set(id, instancia)
              else marcadores.current.delete(id)
            }} />

          <p className="mapa-distintivo">
            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
              className="mapa-distintivo-icono">
              <path d={ICONOS.pin} />
            </svg>
            La Paz, Bolivia
          </p>

          {sinUbicaciones && (
            <div className="mapa-vacio">
              <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="mapa-vacio-icono">
                <path d={ICONOS.pin} />
              </svg>
              <p className="mapa-vacio-titulo">Sin ubicaciones para mostrar</p>
              <p className="mapa-vacio-texto">
                {visibles.length === 1
                  ? 'El conductor de este filtro no tiene una ultima ubicacion reportada. Consulta el directorio para ver el motivo.'
                  : `Los ${visibles.length} conductores de este filtro no tienen una ultima ubicacion reportada. Consulta el directorio para ver el motivo de cada uno.`}
              </p>
            </div>
          )}

          {cargando && <p className="mapa-vacio">Cargando ubicaciones de conductores...</p>}

          {filtroVacio && (
            <div className="mapa-vacio">
              <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="mapa-vacio-icono">
                <path d={ICONOS.mapa} />
              </svg>
              <p className="mapa-vacio-titulo">
                {conductores.length === 0 ? 'Sin conductores' : 'Sin conductores en este filtro'}
              </p>
              <p className="mapa-vacio-texto">
                {conductores.length === 0
                  ? 'No hay conductores para mostrar en el mapa.'
                  : 'Ningun conductor coincide con el filtro activo. Elige otro chip para ver el resto de la flota.'}
              </p>
              {conductores.length === 0 && (
                <Link className="mapa-vacio-enlace" to="/conductores">Ver conductores</Link>
              )}
            </div>
          )}

          {avisoTeselas && (
            <div role="status" className="mapa-nota-teselas">
              <p>No se pudo cargar el mapa base. Las coordenadas de los conductores se conservan.</p>
              <button type="button" className="mapa-nota-teselas-cerrar"
                aria-label="Cerrar aviso del mapa base" onClick={cerrarAvisoTeselas}>
                <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                  <path d={ICONOS.cerrar} />
                </svg>
              </button>
            </div>
          )}
        </div>

        <aside className="mapa-directorio" aria-label="Directorio de conductores del mapa">
          <div className="mapa-directorio-cabecera">
            <h2 className="mapa-directorio-total">
              {hayLecturaConfirmada ? `${conductores.length} conductores en el mapa` : 'Conductores en el mapa'}
            </h2>
            <p className="mapa-directorio-pie">Selecciona una unidad para localizarla</p>
          </div>
          {hayLecturaConfirmada ? (
            visibles.length === 0 ? <div className="mapa-directorio-vacio">
              <p className="mapa-directorio-vacio-titulo">Sin conductores</p>
              <p className="mapa-directorio-vacio-texto">
                {conductores.length === 0
                  ? 'No hay conductores registrados todavia.'
                  : 'No hay conductores que coincidan con el filtro activo.'}
              </p>
            </div> : <ul className="mapa-directorio-lista">
              {visibles.map((conductor) => {
                const color = getColorMarcador(conductor)
                return <li key={conductor.id} className="mapa-persona-fila">
                  <button type="button" onClick={() => recentrar(conductor)}
                    aria-pressed={seleccionado === conductor.id}
                    className={`mapa-persona ${seleccionado === conductor.id ? 'mapa-persona--seleccionada' : ''}`}>
                    <span aria-hidden="true" className="mapa-avatar">{inicialesParaMostrar(conductor.nombreCompleto)}</span>
                    <span className="mapa-persona-datos">
                      <span className="mapa-persona-nombre">{conductor.nombreCompleto}</span>
                      <span className="mapa-persona-meta">{textoVehiculoParaMostrar(conductor)}</span>
                      <span className="mapa-persona-meta">
                        {punto(color)}
                        {descripcionUbicacion(conductor)}
                      </span>
                    </span>
                  </button>
                  <Link className="mapa-persona-enlace" aria-label={`Ver detalle de ${conductor.nombreCompleto}`}
                    to={`/conductores/${encodeURIComponent(conductor.id)}`}>
                    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                      <path d={ICONOS.flecha} />
                    </svg>
                  </Link>
                </li>
              })}
            </ul>
          ) : <p className="mapa-directorio-cargando" role="status">
            {sinConexion ? 'Sin conexion. Conductores pendientes de consulta.' : infoError
              ? 'No se pudieron cargar los conductores.' : cargando ? 'Cargando conductores...' : 'Conductores pendientes de consulta.'}
          </p>}
          <p className="mapa-directorio-nota">
            <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="mapa-directorio-nota-icono">
              <path d={ICONOS.ojo} />
            </svg>
            El directorio es la via accesible de todo lo que muestra el mapa.
          </p>
        </aside>
      </section>

      <div className="mapa-leyenda">
        {(Object.keys(ETIQUETAS_COLOR) as (keyof typeof ETIQUETAS_COLOR)[]).map((color) => (
          <span key={color} className="mapa-leyenda-item">
            {punto(color)}
            {ETIQUETAS_COLOR[color]}
          </span>
        ))}
      </div>

      <p className="mapa-aviso">
        <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="mapa-aviso-icono">
          <path d={ICONOS.alerta} />
        </svg>
        <span>
          Una ubicacion con mas de 5 minutos de antiguedad se muestra en amarillo y deja de ser elegible para
          recibir nuevas solicitudes.
        </span>
      </p>
    </div>
  )
}
