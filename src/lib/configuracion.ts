import { ApiError } from '../api/client'

// Marcadores visuales de interfaz (P1). No son datos de empresa ni defaults del
// backend: solo ocupan el lugar del nombre mientras no exista uno valido de la
// sesion. Son diferenciados porque lateral y header no son el mismo espacio.
export const FALLBACK_LATERAL = 'TaxiSurRioAbajo'
export const FALLBACK_HEADER = 'Panel administrativo'

export const CLAVE_CONFIGURACION = ['configuracion'] as const

export function esNombreValido(nombre: string | null | undefined): boolean {
  return typeof nombre === 'string' && nombre.trim().length > 0
}

export function nombreEmpresaParaMostrar(nombre: string | null | undefined): string | null {
  return esNombreValido(nombre) ? nombre!.trim() : null
}

export interface NombresEmpresaVisibles {
  lateral: string
  header: string
}

export function nombresEmpresa(parametros: {
  nombreServidor: string | null | undefined
  ultimoNombreValido: string | null
}): NombresEmpresaVisibles {
  const nombre = nombreEmpresaParaMostrar(parametros.nombreServidor) ?? parametros.ultimoNombreValido
  return { lateral: nombre ?? FALLBACK_LATERAL, header: nombre ?? FALLBACK_HEADER }
}

// La inicial del avatar se deriva del nombre real; sin nombre no se inventa una letra.
export function inicialEmpresa(nombre: string | null | undefined): string | null {
  const visible = nombreEmpresaParaMostrar(nombre)
  if (!visible) return null
  const letra = visible.match(/\p{L}|\p{N}/u)?.[0]
  return letra ? letra.toUpperCase() : null
}

// El boton Reintentar se deshabilita mientras hay peticion en curso (P2).
export function puedeDispararReintento(enCurso: boolean): boolean {
  return !enCurso
}

export function retryConfiguracion(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) return false
  if (error instanceof ApiError) return error.status >= 500
  return error instanceof TypeError
}

export interface InformacionErrorConfiguracion {
  mensaje: string
  recuperable: boolean
}

export function informacionErrorConfiguracion(error: unknown): InformacionErrorConfiguracion {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return { mensaje: 'No tienes permiso para ver la configuración del panel.', recuperable: false }
    }
    if (error.status === 409) {
      return { mensaje: error.message, recuperable: false }
    }
    if (error.status === 404) {
      return {
        mensaje: 'La configuracion del panel aun no fue cargada en la base de datos.',
        recuperable: false,
      }
    }
    if (error.status >= 500) {
      return { mensaje: 'No se pudo cargar la configuración del panel.', recuperable: true }
    }
    return { mensaje: 'No se pudo cargar la configuración del panel.', recuperable: false }
  }
  if (error instanceof TypeError) {
    return { mensaje: 'No se pudo conectar con el servidor.', recuperable: true }
  }
  return { mensaje: 'No se pudo cargar la configuración del panel.', recuperable: false }
}

export function esEnlaceActivo(pathname: string, destino: string, exacto = false): boolean {
  if (exacto) return pathname === destino
  return (
    pathname === destino ||
    (pathname.startsWith(destino) && pathname.charAt(destino.length) === '/')
  )
}
