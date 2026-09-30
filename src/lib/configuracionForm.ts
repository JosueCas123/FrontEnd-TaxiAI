import { z } from 'zod'
import type { Configuracion } from '../api/types'

// Estado de edicion, no DTO: el radio viaja como TEXTO para poder representar un
// input vacio sin convertirlo silenciosamente en cero. Solo tras validar se
// convierte a numero JSON.
export type ValoresFormulario = {
  nombreEmpresa: string
  radioMaximoBusquedaKm: string
  telefonoCentroAtencion: string
}

// Unica forma admitida por el PUT parcial: nunca `id`, `actualizadoEn` ni claves ajenas.
export type PayloadConfiguracion = Partial<
  Pick<Configuracion, 'nombreEmpresa' | 'radioMaximoBusquedaKm' | 'telefonoCentroAtencion'>
>

export const LIMITE_NOMBRE = 100
export const LIMITE_TELEFONO = 30
export const LIMITE_RADIO = 2147483647

// Marcador del prototipo y de la carga inicial historica: contacto ficticio, no operativo.
export const TELEFONO_FICTICIO = '+59100000000'

export const MENSAJES = {
  nombreVacio: 'Escribe el nombre de la empresa.',
  nombreLargo: `El nombre admite hasta ${LIMITE_NOMBRE} caracteres.`,
  radioVacio: 'Escribe el radio máximo de búsqueda en kilómetros.',
  radioInvalido: `Usa un número entero entre 1 y ${LIMITE_RADIO} kilómetros.`,
  telefonoLargo: `El teléfono admite hasta ${LIMITE_TELEFONO} caracteres.`,
} as const

// Notacion numerica admitida; integridad y rango se comprueban sobre el numero.
const NUMERO_JSON = /^-?\d+(\.\d+)?([eE][+-]?\d+)?$/

// `null` significa "no es un radio valido todavia": el campo se conserva en el
// payload solo si el usuario escribio un entero dentro del rango del contrato.
export function analizarRadio(texto: string): number | null {
  const limpio = texto.trim()
  if (limpio === '' || !NUMERO_JSON.test(limpio)) return null
  const numero = Number(limpio)
  if (!Number.isFinite(numero) || !Number.isInteger(numero)) return null
  if (numero < 1 || numero > LIMITE_RADIO) return null
  return numero
}

export const esquemaConfiguracion = z.object({
  nombreEmpresa: z
    .string()
    .trim()
    .min(1, MENSAJES.nombreVacio)
    .max(LIMITE_NOMBRE, MENSAJES.nombreLargo),
  radioMaximoBusquedaKm: z
    .string()
    .trim()
    .min(1, MENSAJES.radioVacio)
    .refine((valor) => analizarRadio(valor) !== null, MENSAJES.radioInvalido),
  telefonoCentroAtencion: z.string().trim().max(LIMITE_TELEFONO, MENSAJES.telefonoLargo),
})

export type ValoresValidados = z.infer<typeof esquemaConfiguracion>

// El DTO de lectura es la unica fuente: un telefono `null` es un input vacio y
// nunca se sustituye por un nombre o un radio de ejemplo.
export function valoresDesdeConfiguracion(configuracion: Configuracion): ValoresFormulario {
  return {
    nombreEmpresa: configuracion.nombreEmpresa ?? '',
    radioMaximoBusquedaKm: configuracion.radioMaximoBusquedaKm == null ? '' : String(configuracion.radioMaximoBusquedaKm),
    telefonoCentroAtencion: configuracion.telefonoCentroAtencion ?? '',
  }
}

// Diferencias BRUTAS contra la base, ignorando solo los espacios exteriores.
// Habilita Guardar y Restablecer, que no dependen del payload: un valor todavia
// invalido (radio vacio, nombre de solo espacios) sigue siendo una edicion y el
// usuario debe poder guardar para leer el error de validacion.
export function tieneEdiciones(base: Configuracion, valores: ValoresFormulario): boolean {
  if (valores.nombreEmpresa.trim() !== base.nombreEmpresa.trim()) return true
  if (valores.radioMaximoBusquedaKm.trim() !== String(base.radioMaximoBusquedaKm)) return true
  if (valores.telefonoCentroAtencion.trim() !== (base.telefonoCentroAtencion?.trim() ?? '')) return true
  return false
}

// Diferencias efectivas contra la base CONFIRMADA del inicio de la edicion, nunca
// contra una cache que pueda cambiar mientras el usuario escribe.
//
// Base: nombre "Taxi Sur", radio 5, telefono "+59112345678".
// Edicion: nombre " Taxi Sur ", radio "8", telefono " ".
// Payload: { radioMaximoBusquedaKm: 8, telefonoCentroAtencion: null }.
// nombreEmpresa se omite: su valor normalizado no cambio.
export function construirPayload(base: Configuracion, valores: ValoresFormulario): PayloadConfiguracion {
  const payload: PayloadConfiguracion = {}

  const nombre = valores.nombreEmpresa.trim()
  if (nombre.length > 0 && nombre !== base.nombreEmpresa.trim()) {
    payload.nombreEmpresa = nombre
  }

  const radio = analizarRadio(valores.radioMaximoBusquedaKm)
  if (radio !== null && radio !== base.radioMaximoBusquedaKm) {
    payload.radioMaximoBusquedaKm = radio
  }

  const telefono = valores.telefonoCentroAtencion.trim()
  const telefonoBase = base.telefonoCentroAtencion?.trim() ?? ''
  if (telefono !== telefonoBase) {
    payload.telefonoCentroAtencion = telefono === '' ? null : telefono
  }

  return payload
}
