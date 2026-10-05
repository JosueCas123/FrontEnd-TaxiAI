import { ApiError } from '../api/client'
import type { EstadoSolicitud, SolicitudActiva } from '../api/types'

export const CLAVE_SOLICITUDES_ACTIVAS = ['solicitudes-activas'] as const
export const ESTADOS_ACTIVOS = [
  { valor: 'creada', etiqueta: 'Creada' },
  { valor: 'buscando', etiqueta: 'Buscando conductor' },
  { valor: 'conductor_seleccionado', etiqueta: 'Conductor seleccionado' },
  { valor: 'esperando_respuesta', etiqueta: 'Esperando respuesta' },
  { valor: 'aceptada', etiqueta: 'Aceptada' },
  { valor: 'en_servicio', etiqueta: 'En servicio' },
] as const satisfies readonly { valor: EstadoSolicitud; etiqueta: string }[]
export type FiltroEstadoSolicitud = 'todos' | typeof ESTADOS_ACTIVOS[number]['valor']

export function filtrarSolicitudes(datos: SolicitudActiva[], texto: string, estado: FiltroEstadoSolicitud): SolicitudActiva[] {
  const termino = texto.trim().toLowerCase()
  return datos.filter((fila) => (estado === 'todos' || fila.estado === estado)
    && [fila.id, fila.pasajero?.nombre, fila.conductorAsignado?.nombreCompleto]
      .some((valor) => valor?.toLowerCase().includes(termino)))
}

export function fechaSolicitud(valor: string | null, segundos = false): string {
  if (valor === null) return '\u2014'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return 'Fecha no disponible'
  return new Intl.DateTimeFormat('es-BO', {
    timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', ...(segundos ? { second: '2-digit' } : {}), hourCycle: 'h23',
  }).format(fecha)
}

export function informacionErrorSolicitudes(error: unknown): { mensaje: string; recuperable: boolean } | null {
  if (error instanceof Error && (error.name === 'AbortError' || error.name === 'CancelledError')) return null
  if (error instanceof ApiError) return {
    mensaje: error.message || 'No se pudo completar la operacion.',
    recuperable: error.status >= 500 && error.status < 600,
  }
  if (error instanceof TypeError) return { mensaje: 'No se pudo conectar con el servidor.', recuperable: true }
  return { mensaje: 'No se pudo completar la operacion.', recuperable: false }
}

export const retrySolicitudes = (fallos: number, error: unknown): boolean =>
  fallos < 1 && informacionErrorSolicitudes(error)?.recuperable === true

export const intervaloSolicitudes = (visible: boolean, enCurso: boolean): number | false =>
  visible && !enCurso ? 15_000 : false

export const puedeRefrescarSolicitudes = (conectado: boolean, fetchStatus: string, bloqueada: boolean, lecturaInicial = false): boolean =>
  conectado && fetchStatus === 'idle' && !bloqueada && !lecturaInicial
