import { Component, useEffect, useRef, type ReactNode, type Ref } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer, ZoomControl, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { ConductorMapa } from '../api/types'
import {
  CENTRO_INICIAL_MAPA, MAX_ZOOM_MAPA, ZOOM_INICIAL_MAPA, antiguedadUbicacionParaMostrar,
  estadoParaMostrar, getColorMarcador, inicialesParaMostrar, textoVehiculoParaMostrar,
  type CategoriaFiltro,
} from '../lib/mapa'
import '../pages/Mapa.css'

class FalloDeMapa extends Component<{ children: ReactNode }, { caido: boolean }> {
  state = { caido: false }
  static getDerivedStateFromError() { return { caido: true } }
  render() {
    return this.state.caido ? <div className="mapa-vacio">
      <p className="mapa-vacio-titulo">El mapa no esta disponible</p>
      <p className="mapa-vacio-texto">La base cartografica no se pudo inicializar. Puedes consultar los conductores en el listado.</p>
      <Link className="mapa-vacio-enlace" to="/conductores">Ver conductores</Link>
    </div> : this.props.children
  }
}

function Encuadre({ conductores, categoria }: { conductores: ConductorMapa[]; categoria: CategoriaFiltro }) {
  const mapa = useMap()
  const primerEncuadre = useRef(false)
  const categoriaPrevia = useRef(categoria)
  useEffect(() => {
    const observer = new ResizeObserver(() => mapa.invalidateSize({ animate: false }))
    observer.observe(mapa.getContainer())
    return () => observer.disconnect()
  }, [mapa])
  useEffect(() => {
    const cambioFiltro = categoria !== categoriaPrevia.current
    categoriaPrevia.current = categoria
    const puntos = conductores.flatMap((conductor) => conductor.ubicacion
      ? ([[conductor.ubicacion.latitud, conductor.ubicacion.longitud]] as L.LatLngTuple[]) : [])
    if (puntos.length === 0 || (primerEncuadre.current && !cambioFiltro)) return
    primerEncuadre.current = true
    mapa.fitBounds(L.latLngBounds(puntos), { padding: [75, 75], maxZoom: MAX_ZOOM_MAPA, animate: true })
  }, [categoria, conductores, mapa])
  return null
}

export default function MapaFlota({ conductores, ahora, categoria = 'todos', mapaRef, marcadorRef, alSeleccionar, alCargarTesela, alFallarTesela }: {
  conductores: ConductorMapa[]
  ahora: number
  categoria?: CategoriaFiltro
  mapaRef?: Ref<L.Map>
  marcadorRef?: (id: string, marcador: L.Marker | null) => void
  alSeleccionar?: (id: string) => void
  alCargarTesela: () => void
  alFallarTesela: () => void
}) {
  return <FalloDeMapa>
    <MapContainer ref={mapaRef} center={CENTRO_INICIAL_MAPA} zoom={ZOOM_INICIAL_MAPA}
      scrollWheelZoom={false} touchZoom={false} boxZoom={false} doubleClickZoom={false}
      zoomControl={false} attributionControl>
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maxZoom={18}
        attribution={'&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'}
        eventHandlers={{ tileload: alCargarTesela, tileerror: alFallarTesela }} />
      <ZoomControl position="bottomright" />
      <Encuadre conductores={conductores} categoria={categoria} />
      {conductores.map((conductor) => conductor.ubicacion && <Marker key={conductor.id}
        position={[conductor.ubicacion.latitud, conductor.ubicacion.longitud]}
        keyboard={false} title={`${conductor.nombreCompleto}: ${estadoParaMostrar(conductor)}`}
        eventHandlers={{ click: () => alSeleccionar?.(conductor.id) }}
        ref={(instancia) => marcadorRef?.(conductor.id, instancia)}
        icon={L.divIcon({ className: 'mapa-icono',
          html: `<span class="mapa-marcador mapa-marcador--${getColorMarcador(conductor)}">${inicialesParaMostrar(conductor.nombreCompleto)}</span>`,
          iconSize: [50, 30], iconAnchor: [25, 35] })}>
        <Popup className="mapa-popup">
          <p className="mapa-popup-nombre">{conductor.nombreCompleto}</p>
          <p className="mapa-popup-estado">
            <span aria-hidden="true" className={`mapa-punto mapa-punto--${getColorMarcador(conductor)}`} />
            {estadoParaMostrar(conductor)}
          </p>
          <p className="mapa-popup-linea">{textoVehiculoParaMostrar(conductor)}</p>
          {conductor.vehiculo && <p className="mapa-popup-linea">
            {conductor.vehiculo.marca} {conductor.vehiculo.modelo} · {conductor.vehiculo.color}
          </p>}
          <p className="mapa-popup-linea">{antiguedadUbicacionParaMostrar(conductor, ahora)}</p>
          <Link className="mapa-popup-enlace" to={`/conductores/${encodeURIComponent(conductor.id)}`}>
            Ver conductor <span aria-hidden="true">&rarr;</span>
          </Link>
        </Popup>
      </Marker>)}
    </MapContainer>
  </FalloDeMapa>
}
