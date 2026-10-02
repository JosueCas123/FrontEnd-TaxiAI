import { ApiError } from '../api/client'
import type { Indicadores } from '../api/types'

export type ClaveIndicador = keyof Indicadores
export type ColorPie = 'verde' | 'azul' | 'ambar' | 'gris'
export type NombreIcono = 'car' | 'pin' | 'requests' | 'checkCircle'

export const CLAVE_INDICADORES = ['indicadores'] as const

export interface TarjetaIndicador {
  clave: ClaveIndicador
  titulo: string
  icono: NombreIcono
  pie: { color: ColorPie; texto: string }
}

export const TARJETAS: TarjetaIndicador[] = [
  {
    clave: 'conductoresDisponibles',
    titulo: 'Conductores disponibles',
    icono: 'car',
    pie: { color: 'verde', texto: 'Disponibilidad registrada' },
  },
  {
    clave: 'conductoresEnServicio',
    titulo: 'Conductores en servicio',
    icono: 'pin',
    pie: { color: 'azul', texto: 'Atendiendo un viaje' },
  },
  {
    clave: 'solicitudesActivas',
    titulo: 'Solicitudes activas',
    icono: 'requests',
    pie: { color: 'ambar', texto: 'En el flujo de atencion' },
  },
  {
    clave: 'solicitudesCompletadasHoy',
    titulo: 'Solicitudes completadas hoy',
    icono: 'checkCircle',
    pie: { color: 'gris', texto: 'Fecha local del navegador' },
  },
]

export function retryIndicadores(failureCount: number, error: unknown): boolean {
  return failureCount < 1 && (error instanceof ApiError ? error.status >= 500 : error instanceof TypeError)
}

export interface InformacionErrorIndicadores {
  mensaje: string
  recuperable: boolean
}

export function informacionErrorIndicadores(error: unknown): InformacionErrorIndicadores {
  if (error instanceof ApiError) {
    if (error.status === 403) return { mensaje: error.message, recuperable: false }
    if (error.status === 404) return { mensaje: error.message, recuperable: false }
    if (error.status >= 500) {
      return { mensaje: error.message || 'No se pudo completar la operacion.', recuperable: true }
    }
    return { mensaje: error.message || 'No se pudo completar la operacion.', recuperable: false }
  }
  if (error instanceof TypeError) {
    return { mensaje: 'No se pudo conectar con el servidor.', recuperable: true }
  }
  return { mensaje: 'No se pudo completar la operacion.', recuperable: false }
}

export const intervaloRefrescoIndicadores = ({ visible, enCurso }: { visible: boolean; enCurso: boolean }) =>
  visible && !enCurso ? 15_000 : false

export const puedeDispararRefrescoIndicadores = (enCurso: boolean) => !enCurso

const FORMATO_FECHA = new Intl.DateTimeFormat('es-BO', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'America/La_Paz',
})

export function fechaIndicadoresParaMostrar(fecha: Date): string {
  if (!Number.isFinite(fecha.getTime())) return 'Fecha no disponible'
  const texto = FORMATO_FECHA.format(fecha)
  return texto === 'Invalid Date' ? 'Fecha no disponible' : texto
}
