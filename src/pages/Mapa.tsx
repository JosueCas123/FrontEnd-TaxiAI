import { Component, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react'
import { Link } from 'react-router-dom'
import { useIsFetching, useQuery } from '@tanstack/react-query'
import { MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import './Mapa.css'
import { apiFetch } from '../api/client'
import type { ConductorMapa } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import {
  CATEGORIAS_FILTRO,
  CENTRO_INICIAL_MAPA,
  CLAVE_CONDUCTORES_MAPA,
  ETIQUETAS_COLOR,
  MAX_ZOOM_MAPA,
  ZOOM_INICIAL_MAPA,
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
const TESELAS = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const ATRIBUCION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
const PADDING_ENCUADRE: L.PointTuple = [75, 75]

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

// Si Leaflet no llega a inicializarse, la pantalla cae aqui en vez de dejar un hueco
// vacio. Envuelve solo el subarbol del mapa: un fallo de la tabla de estados de lectura
// se muestra por su cuenta y no debe disfrazarse de mapa caido.
class FalloDeMapa extends Component<{ children: ReactNode }, { caido: boolean }> {
  state = { caido: false }

  static getDerivedStateFromError() {
    return { caido: true }
  }

  render() {
    if (!this.state.caido) return this.props.children
    return <div className="mapa-vacio">
      <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="mapa-vacio-icono">
        <path d={ICONOS.mapa} />
      </svg>
      <p className="mapa-vacio-titulo">El mapa no esta disponible</p>
      <p className="mapa-vacio-texto">
        La base cartografica no se pudo inicializar. Puedes consultar los conductores en el listado.
      </p>
      <Link className="mapa-vacio-enlace" to="/conductores">Ver conductores</Link>
    </div>
  }
}

// Unico componente hijo autorizado: consume `useMap()` porque el mapa solo existe dentro
// del contexto de react-leaflet. Su unica dependencia de encuadre es la categoria del
// filtro, jamas el array de conductores, que reencuadraria la vista cada 15 s.
function Encuadre({
  conductores,
  categoria,
  primerEncuadre,
  categoriaPrevia,
}: {
  conductores: ConductorMapa[]
  categoria: CategoriaFiltro
  primerEncuadre: RefObject<boolean>
  categoriaPrevia: RefObject<CategoriaFiltro>
}) {
  const mapa = useMap()

  useEffect(() => {
    const puntos = conductores.flatMap((conductor) =>
      conductor.ubicacion
        ? ([[conductor.ubicacion.latitud, conductor.ubicacion.longitud]] as L.LatLngTuple[])
        : [],
    )
    if (puntos.length === 0) return
    // El cambio de chip es el movimiento mas reciente e intencionado: si coinciden ambos
    // casos en el mismo render, prevalece sobre el primer encuadre automatico.
    if (categoria === categoriaPrevia.current) {
      // El guardia se consume solo cuando el encuadre ocurre de verdad, nunca al recibir
      // una respuesta sin marcadores.
      if (primerEncuadre.current) return
      primerEncuadre.current = true
    }
    mapa.fitBounds(L.latLngBounds(puntos), {
      padding: PADDING_ENCUADRE,
      maxZoom: MAX_ZOOM_MAPA,
      animate: true,
    })
  }, [categoria, mapa])

  return null
}

export default function Mapa() {
  const { estaAutenticado } = useAuth()
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible')
  const [lecturaManual, setLecturaManual] = useState(false)
  const [categoria, setCategoria] = useState<CategoriaFiltro>('todos')
  const [seleccionado, setSeleccionado] = useState<string | null>(null)
  const [avisoTeselas, setAvisoTeselas] = useState(false)
  const lecturasEnVuelo = useIsFetching({ queryKey: CLAVE_CONDUCTORES_MAPA })
  const lecturaBloqueada = useRef(false)
  const primerEncuadre = useRef(false)
  const categoriaPrevia = useRef<CategoriaFiltro>('todos')
  const mapa = useRef<L.Map | null>(null)
  const marcadores = useRef(new Map<string, L.Marker>())
  const teselas = useRef({ cargadas: 0, fallidas: 0, descartado: false })

  useEffect(() => {
    const reevaluar = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', reevaluar)
    return () => document.removeEventListener('visibilitychange', reevaluar)
  }, [])

  const enCurso = lecturasEnVuelo > 0 || lecturaManual

  const { data, error, isPending, refetch } = useQuery({
    queryKey: CLAVE_CONDUCTORES_MAPA,
    queryFn: ({ signal }) => apiFetch<ConductorMapa[]>(RUTA_CONDUCTORES_MAPA, { signal }),
    enabled: estaAutenticado,
    retry: retryMapa,
    refetchInterval: () => intervaloRefrescoMapa({ visible, enCurso }),
  })

  const refrescar = () => {
    if (lecturaBloqueada.current || !puedeDispararRefrescoMapa(enCurso)) return
    lecturaBloqueada.current = true
    setLecturaManual(true)
    void refetch().finally(() => {
      lecturaBloqueada.current = false
      setLecturaManual(false)
    })
  }

  const elegirCategoria = (nueva: CategoriaFiltro) => {
    categoriaPrevia.current = categoria
    setCategoria(nueva)
  }

  const cargando = data === undefined && isPending
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

  // El aviso de teselas tiene su propio ciclo: tres contadores observables y ninguna
  // persistencia. Recuperar la red lo oculta y limpia tambien el descarte.
  const alCargarTesela = () => {
    const cuenta = teselas.current
    cuenta.cargadas += 1
    if (cuenta.cargadas === 1) {
      cuenta.descartado = false
      setAvisoTeselas(false)
    }
  }
  const alFallarTesela = () => {
    const cuenta = teselas.current
    cuenta.fallidas += 1
    if (cuenta.fallidas > 3 && cuenta.cargadas === 0 && !cuenta.descartado) setAvisoTeselas(true)
  }
  const cerrarAvisoTeselas = () => {
    teselas.current.descartado = true
    setAvisoTeselas(false)
  }

  const tituloMarcador = (conductor: ConductorMapa) =>
    `${conductor.nombreCompleto}: ${estadoParaMostrar(conductor)}${getColorMarcador(conductor) === 'ambar' ? ' · Ubicacion desactualizada' : ''}`

  const descripcionUbicacion = (conductor: ConductorMapa) =>
    conductor.ubicacion === null && conductor.ultimaUbicacionRegistradaEn === null
      ? `${estadoParaMostrar(conductor)} · Sin ubicacion reportada`
      : `${estadoParaMostrar(conductor)} · ${antiguedadUbicacionParaMostrar(conductor, Date.now())}`

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

      {lecturaManual && (
        <p role="status" className="mt-3 text-sm text-gris">Actualizando ubicaciones de conductores...</p>
      )}

      {infoError && hayLecturaConfirmada && (
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

      {infoError && !hayLecturaConfirmada && (
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
          <span className="mapa-chip-conteo">{cargando ? '–' : conteos[chip.clave]}</span>
        </Button>)}
      </div>

      <section className="mapa-panel" aria-label="Mapa y directorio de conductores">
        <div className="mapa-lienzo" role="region"
          aria-label="Mapa de los conductores con la ultima ubicacion reportada por cada uno, segun GET /api/dashboard/conductores-mapa">
          <FalloDeMapa>
          <MapContainer ref={mapa} center={CENTRO_INICIAL_MAPA} zoom={ZOOM_INICIAL_MAPA}
            scrollWheelZoom={false} touchZoom={false} boxZoom={false} doubleClickZoom={false}
            zoomControl={false} attributionControl>
            <TileLayer url={TESELAS} attribution={ATRIBUCION} maxZoom={18}
              eventHandlers={{ tileload: alCargarTesela, tileerror: alFallarTesela }} />
            <ZoomControl position="bottomright" />
            {pintables.length > 0 && (
              <Encuadre conductores={pintables} categoria={categoria} primerEncuadre={primerEncuadre}
                categoriaPrevia={categoriaPrevia} />
            )}
            {pintables.map((conductor) => conductor.ubicacion && (
              <Marker key={conductor.id}
                position={[conductor.ubicacion.latitud, conductor.ubicacion.longitud]}
                keyboard={false}
                title={tituloMarcador(conductor)}
                eventHandlers={{ click: () => setSeleccionado(conductor.id) }}
                ref={(instancia) => {
                  if (instancia) marcadores.current.set(conductor.id, instancia)
                  else marcadores.current.delete(conductor.id)
                }}
                icon={L.divIcon({
                  className: 'mapa-icono',
                  html: `<span class="mapa-marcador mapa-marcador--${getColorMarcador(conductor)}">${inicialesParaMostrar(conductor.nombreCompleto)}</span>`,
                  iconSize: [50, 30],
                  iconAnchor: [25, 35],
                })}>
                <Popup className="mapa-popup">
                  <p className="mapa-popup-nombre">{conductor.nombreCompleto}</p>
                  <p className="mapa-popup-estado">
                    {punto(getColorMarcador(conductor))}
                    {estadoParaMostrar(conductor)}
                  </p>
                  <p className="mapa-popup-linea">{textoVehiculoParaMostrar(conductor)}</p>
                  {conductor.vehiculo && (
                    <p className="mapa-popup-linea">
                      {conductor.vehiculo.marca} {conductor.vehiculo.modelo} · {conductor.vehiculo.color}
                    </p>
                  )}
                  <p className="mapa-popup-linea">
                    {antiguedadUbicacionParaMostrar(conductor, Date.now())}
                  </p>
                  <Link className="mapa-popup-enlace"
                    to={`/conductores/${encodeURIComponent(conductor.id)}`}>
                    Ver conductor
                    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"
                      className="mapa-popup-flecha">
                      <path d={ICONOS.flecha} />
                    </svg>
                  </Link>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          </FalloDeMapa>

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
          ) : <p className="mapa-directorio-cargando" role="status">Cargando conductores...</p>}
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