import { ApiError } from '../api/client'
import type { ConductorListado, EstadoConductor, Vehiculo } from '../api/types'

export type Accion = 'aprobar' | 'rechazar' | 'suspender' | 'reactivar'
export const PESTANAS: Record<EstadoConductor, string> = {
  pendiente: 'Pendientes', aprobado: 'Aprobados', rechazado: 'Rechazados', suspendido: 'Suspendidos',
}
export const ETIQUETAS_ACCION: Record<Accion, string> = {
  aprobar: 'Aprobar', rechazar: 'Rechazar', suspender: 'Suspender', reactivar: 'Reactivar',
}
export const claveConductores = (estado: EstadoConductor) => ['conductores', { estado }] as const
export const rutaConductores = (estado: EstadoConductor) => `/api/conductores?estado=${estado}`
export const rutaTransicion = (id: string, accion: Accion) => `/api/conductores/${encodeURIComponent(id)}/${accion}`

export function retryConductores(failureCount: number, error: unknown): boolean {
  return failureCount < 1 && (error instanceof ApiError ? error.status >= 500 : error instanceof TypeError)
}

export function informacionErrorConductores(error: unknown) {
  if (error instanceof ApiError) return {
    mensaje: error.status === 403 ? `Permiso denegado: ${error.message}` : error.message,
    recuperable: error.status >= 500,
  }
  return {
    mensaje: error instanceof TypeError ? 'No se pudo conectar con el servidor.' : 'No se pudo cargar el listado de conductores.',
    recuperable: error instanceof TypeError,
  }
}

export function mensajeErrorTransicion(error: unknown): string {
  // Conserva literalmente los mensajes 404/409, incluido el estado real del servidor.
  if (error instanceof ApiError) return error.message
  return 'No se pudo confirmar la transicion. Revisa la conexion y el listado actualizado.'
}

export const normalizarTexto = (texto: string) => texto.trim().toLowerCase()
export const normalizarDigitos = (texto: string) => normalizarTexto(texto).replace(/[\s-]/g, '')
export const hayTerminoBusqueda = (texto: string) => normalizarTexto(texto).length > 0

export function filtrarConductores(lista: ConductorListado[], texto: string): ConductorListado[] {
  if (!hayTerminoBusqueda(texto)) return lista
  const termino = normalizarTexto(texto)
  const compacto = normalizarDigitos(texto)
  return lista.filter((fila) => normalizarTexto(fila.nombreCompleto ?? '').includes(termino) ||
    (compacto.length > 0 && (normalizarDigitos(fila.telefono).includes(compacto) ||
      (fila.vehiculo !== null && normalizarDigitos(fila.vehiculo.placa).includes(compacto)))))
}

export function accionesPorEstado(estado: EstadoConductor): readonly Accion[] {
  const acciones: Record<EstadoConductor, Accion[]> = {
    pendiente: ['aprobar', 'rechazar'], aprobado: ['suspender'], rechazado: [], suspendido: ['reactivar'],
  }
  return acciones[estado]
}

export const nombreParaMostrar = (nombre: string | null | undefined) => nombre?.trim() || '(sin nombre)'
export function textoConfirmacion(accion: Accion, nombre: string | null | undefined): string {
  const textos: Record<Accion, string> = {
    aprobar: 'Aprobar la cuenta de', rechazar: 'Rechazar la cuenta de',
    suspender: 'Suspender la cuenta de', reactivar: 'Reactivar la cuenta de',
  }
  return `¿${textos[accion]} ${nombreParaMostrar(nombre)}?`
}
export function mensajeExitoTransicion(accion: Accion, nombre: string | null | undefined): string {
  const resultados: Record<Accion, string> = {
    aprobar: 'aprobada', rechazar: 'rechazada', suspender: 'suspendida', reactivar: 'reactivada',
  }
  return `Cuenta de ${nombreParaMostrar(nombre)} ${resultados[accion]}.`
}
export const etiquetaVehiculo = (vehiculo: Vehiculo | null) => vehiculo?.placa ?? 'Sin vehiculo'
export const mensajePestanaVacia = (estado: EstadoConductor) => `No hay conductores ${PESTANAS[estado].toLowerCase()}`
export const mensajeBusquedaVacia = (texto: string) => `Sin resultados para «${texto.trim()}»`
export const resumenResultados = (visibles: number, total: number) => `Mostrando ${visibles} de ${total}`
export const quitarConductor = (lista: ConductorListado[] | undefined, id: string) => lista?.filter((fila) => fila.id !== id)
export const intervaloRefresco = ({ visible, hayTransicionEnCurso }: { visible: boolean; hayTransicionEnCurso: boolean }) =>
  visible && !hayTransicionEnCurso ? 15_000 : false
export const puedeDispararRefresco = (enCurso: boolean) => !enCurso
