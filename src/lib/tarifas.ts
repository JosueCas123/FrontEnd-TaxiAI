import { ApiError, apiFetch } from '../api/client'
import type { Tarifa } from '../api/types'
import { montoSchema, vigenciaDesdeSchema } from './tarifasForm'

export const CLAVE_TARIFAS = ['tarifas'] as const
export const leerTarifas = (signal: AbortSignal) => apiFetch<Tarifa[]>('/api/tarifas', { signal })
export const intervaloTarifas = (visible: boolean, conectado: boolean, abierto: boolean, enCurso: boolean): number | false =>
  visible && conectado && !abierto && !enCurso ? 15_000 : false
export const puedeRefrescarTarifas = (conectado: boolean, fetchStatus: string, bloqueada: boolean): boolean =>
  conectado && fetchStatus === 'idle' && !bloqueada

export function informacionErrorTarifas(error: unknown) {
  if (error instanceof Error && ['AbortError', 'CancelledError'].includes(error.name)) return null
  if (error instanceof ApiError) return { mensaje: error.message, permiso: error.status === 403,
    ausente: error.status === 404, recuperable: error.status >= 500 && error.status < 600 }
  return { mensaje: error instanceof TypeError ? 'No se pudo conectar con el servidor.' : 'No se pudo completar la operacion.',
    permiso: false, ausente: false, recuperable: error instanceof TypeError }
}
export const retryTarifas = (fallos: number, error: unknown) => fallos < 1 && informacionErrorTarifas(error)?.recuperable === true
export const montoTarifa = (valor: string) => montoSchema.safeParse(valor).success ? `${valor} Bs` : 'Monto no disponible'
export function fechaTarifa(valor: string): string {
  if (!vigenciaDesdeSchema.safeParse(valor).success) return 'Fecha no disponible'
  const [anio, mes, dia] = valor.split('-')
  return `${dia}/${mes}/${anio}`
}
export function hoyTarifa(ahora = new Date()): string {
  const partes = new Intl.DateTimeFormat('en-US', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(ahora)
  const valor = (tipo: string) => partes.find((parte) => parte.type === tipo)!.value
  return `${valor('year')}-${valor('month')}-${valor('day')}`
}
