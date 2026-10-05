import { z } from 'zod'
import type { Tarifa } from '../api/types'

export const MENSAJES = {
  descripcionVacia: 'Ingresa una descripcion.',
  descripcionLarga: 'La descripcion admite hasta 255 caracteres.',
  montoVacio: 'Ingresa un monto.',
  montoFormato: 'Usa dos decimales exactos, sin comas ni signo.',
  montoMinimo: 'El monto minimo es 0.01.',
  montoMaximo: 'El monto maximo es 99999999.99.',
  fechaInvalida: 'Ingresa una fecha valida con formato YYYY-MM-DD.',
}

export const descripcionSchema = z.string().trim().min(1, MENSAJES.descripcionVacia).max(255, MENSAJES.descripcionLarga)
export const montoSchema = z.string().min(1, MENSAJES.montoVacio)
  .superRefine((value, ctx) => {
    if (/^[1-9][0-9]{8,}\.[0-9]{2}$/.test(value)) ctx.addIssue({ code: 'custom', message: MENSAJES.montoMaximo })
  })
  .pipe(z.string().regex(/^(?:0|[1-9][0-9]{0,7})\.[0-9]{2}$/, MENSAJES.montoFormato)
    .refine((value) => value !== '0.00' && value === value.trim(), MENSAJES.montoMinimo))
// Zod 3 equivalente a z.iso.date() del contrato, sin convertir a Date.
export const vigenciaDesdeSchema = z.string().date(MENSAJES.fechaInvalida)
export const esquemaTarifa = z.object({ descripcion: descripcionSchema, monto: montoSchema, vigenciaDesde: vigenciaDesdeSchema })
export type PayloadCrearTarifa = z.infer<typeof esquemaTarifa>
export type PayloadEditarTarifa = Partial<Pick<PayloadCrearTarifa, 'descripcion' | 'monto'>>

export function construirPatchTarifa(base: Tarifa, valores: PayloadCrearTarifa): PayloadEditarTarifa | null {
  const payload: PayloadEditarTarifa = {}
  if (valores.descripcion.trim() !== base.descripcion) payload.descripcion = valores.descripcion.trim()
  if (valores.monto !== base.monto) payload.monto = valores.monto
  return Object.keys(payload).length ? payload : null
}
