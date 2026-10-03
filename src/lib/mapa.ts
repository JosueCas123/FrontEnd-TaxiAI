import { ApiError } from '../api/client'
import type { ConductorMapa } from '../api/types'
import { antiguedadParaMostrar, antiguedadUbicacion } from './conductores'

export type ColorMarcador = 'verde' | 'azul' | 'gris' | 'ambar'
export type CategoriaFiltro = 'todos' | ColorMarcador

export const CLAVE_CONDUCTORES_MAPA = ['conductores-mapa'] as const

export const CENTRO_INICIAL_MAPA: [number, number] = [-16.4897, -68.1193]
export const ZOOM_INICIAL_MAPA = 14
export const MAX_ZOOM_MAPA = 14

export const ETIQUETAS_COLOR: Record<ColorMarcador, string> = {
  verde: 'Disponible',
  azul: 'En servicio',
  gris: 'Fuera de servicio',
  ambar: 'Ubicacion desactualizada',
}

export const CATEGORIAS_FILTRO: readonly { clave: CategoriaFiltro; etiqueta: string; color: ColorMarcador | null }[] = [
  { clave: 'todos', etiqueta: 'Todos', color: null },
  { clave: 'verde', etiqueta: 'Disponibles', color: 'verde' },
  { clave: 'azul', etiqueta: 'En servicio', color: 'azul' },
  { clave: 'gris', etiqueta: 'Fuera de servicio', color: 'gris' },
  { clave: 'ambar', etiqueta: 'Desactualizados', color: 'ambar' },
]

// El reloj ya no interviene: el backend filtro la vigencia de la ubicacion. Aqui solo se
// decide por la presencia o ausencia de `ubicacion` y de `ultimaUbicacionRegistradaEn`.
export function getColorMarcador(
  conductor: Pick<ConductorMapa, 'estado' | 'estadoJornada' | 'estadoDisponibilidad' | 'ubicacion' | 'ultimaUbicacionRegistradaEn'>,
): ColorMarcador {
  if (conductor.ubicacion === null && conductor.ultimaUbicacionRegistradaEn !== null) return 'ambar'
  if (conductor.estado !== 'aprobado') return 'gris'
  if (conductor.estadoJornada !== 'activa') return 'gris'
  if (conductor.ubicacion === null) return 'gris'
  if (conductor.estadoDisponibilidad === 'en_servicio') return 'azul'
  if (conductor.estadoDisponibilidad === 'disponible') return 'verde'
  return 'gris'
}

export const categoriaDe = (conductor: ConductorMapa): ColorMarcador => getColorMarcador(conductor)

export function conductoresVisibles(conductores: ConductorMapa[], categoria: CategoriaFiltro): ConductorMapa[] {
  if (categoria === 'todos') return conductores
  return conductores.filter((conductor) => getColorMarcador(conductor) === categoria)
}

export function conteoPorCategoria(conductores: ConductorMapa[]): Record<CategoriaFiltro, number> {
  const conteo: Record<CategoriaFiltro, number> = { todos: 0, verde: 0, azul: 0, gris: 0, ambar: 0 }
  conteo.todos = conductores.length
  for (const conductor of conductores) conteo[getColorMarcador(conductor)] += 1
  return conteo
}

// El conjunto pintado y el conjunto listado no son el mismo: sin `ubicacion` no hay
// coordenada, pero el conductor sigue apareciendo en el directorio.
export const conductoresConUbicacion = (conductores: ConductorMapa[]): ConductorMapa[] =>
  conductores.filter((conductor) => conductor.ubicacion !== null)

// El `html` del divIcon solo admite letras. Filtrar aqui hace imposible inyectar markup
// por el nombre, sin depender de que exista un escapado en la otra capa.
const PARTICULAS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'of', 'da', 'das', 'dos', 'van'])

export function inicialesParaMostrar(nombreCompleto: string): string {
  const palabras = (typeof nombreCompleto === 'string' ? nombreCompleto : '')
    .split(/\s+/)
    .filter((palabra) => /[\p{L}]/u.test(palabra))
  const conOnomastico = palabras.filter((palabra) => !PARTICULAS.has(palabra.toLowerCase()))
  const elegidas = (conOnomastico.length > 0 ? conOnomastico : palabras).slice(0, 2)
  const iniciales = elegidas
    .map((palabra) => palabra.replace(/^[^\p{L}]+/u, '').slice(0, 1).toUpperCase())
    .join('')
  return iniciales.length > 0 ? iniciales : '?'
}

export function antiguedadUbicacionParaMostrar(
  conductor: Pick<ConductorMapa, 'ubicacion' | 'ultimaUbicacionRegistradaEn'>,
  ahora: number,
): string {
  const antiguedad = antiguedadUbicacion(conductor.ubicacion?.horaRegistro ?? conductor.ultimaUbicacionRegistradaEn, ahora)
  if (antiguedad.estado === 'sin-reportes') return 'Sin reportes de ubicacion'
  if (antiguedad.estado === 'invalida') return 'Fecha no disponible'
  return antiguedadParaMostrar(antiguedad.milisegundos)
}

export const textoVehiculoParaMostrar = (conductor: Pick<ConductorMapa, 'vehiculo'>): string =>
  conductor.vehiculo?.placa ?? 'Sin vehiculo registrado'

export const estadoParaMostrar = (
  conductor: Pick<ConductorMapa, 'estado' | 'estadoJornada' | 'estadoDisponibilidad' | 'ubicacion' | 'ultimaUbicacionRegistradaEn'>,
): string => ETIQUETAS_COLOR[getColorMarcador(conductor)]

export function retryMapa(failureCount: number, error: unknown): boolean {
  return failureCount < 1 && (error instanceof ApiError ? error.status >= 500 : error instanceof TypeError)
}

export interface InformacionErrorMapa {
  mensaje: string
  recuperable: boolean
}

// La decision se toma por `status`. Nunca se parsea el texto del mensaje.
export function informacionErrorMapa(error: unknown): InformacionErrorMapa {
  if (error instanceof ApiError) {
    if (error.status === 403) return { mensaje: error.message, recuperable: false }
    if (error.status === 404) return { mensaje: error.message, recuperable: false }
    if (error.status >= 500) return { mensaje: error.message || 'No se pudo completar la operacion.', recuperable: true }
    return { mensaje: error.message || 'No se pudo completar la operacion.', recuperable: false }
  }
  if (error instanceof TypeError) return { mensaje: 'No se pudo conectar con el servidor.', recuperable: true }
  return { mensaje: 'No se pudo completar la operacion.', recuperable: false }
}

export const intervaloRefrescoMapa = ({ visible, enCurso }: { visible: boolean; enCurso: boolean }) =>
  visible && !enCurso ? 15_000 : false

export const puedeDispararRefrescoMapa = (enCurso: boolean) => !enCurso