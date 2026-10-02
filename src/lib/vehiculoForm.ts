import type { Vehiculo } from '../api/types'

export const CAMPOS_TEXTO = ['placa', 'marca', 'modelo', 'color'] as const
export type ValoresVehiculo = Record<typeof CAMPOS_TEXTO[number] | 'capacidadPasajeros', string>
export type PayloadVehiculo = Partial<Pick<Vehiculo, keyof ValoresVehiculo>>
export type ErroresVehiculo = Partial<Record<keyof ValoresVehiculo, string>>

export function valoresDesdeVehiculo(vehiculo: Vehiculo): ValoresVehiculo {
  return {
    placa: vehiculo.placa, marca: vehiculo.marca, modelo: vehiculo.modelo,
    color: vehiculo.color, capacidadPasajeros: String(vehiculo.capacidadPasajeros),
  }
}

export function validarVehiculo(valores: ValoresVehiculo): ErroresVehiculo {
  const errores: ErroresVehiculo = {}
  for (const campo of CAMPOS_TEXTO) {
    const texto = valores[campo].trim()
    if (!texto || texto.length > 30) errores[campo] = 'Escribe entre 1 y 30 caracteres.'
  }
  const capacidad = Number(valores.capacidadPasajeros)
  if (!valores.capacidadPasajeros.trim() || !Number.isInteger(capacidad) || capacidad < 1 || capacidad > 100) {
    errores.capacidadPasajeros = 'Escribe un numero entero entre 1 y 100.'
  }
  return errores
}

// La suciedad no depende de que el formulario sea valido: un campo vacio es un borrador.
export function tieneEdicionesVehiculo(base: Vehiculo, valores: ValoresVehiculo): boolean {
  return CAMPOS_TEXTO.some((campo) => valores[campo].trim() !== base[campo].trim()) ||
    !valores.capacidadPasajeros.trim() || Number(valores.capacidadPasajeros) !== base.capacidadPasajeros
}

export function construirPayloadVehiculo(base: Vehiculo, valores: ValoresVehiculo): PayloadVehiculo | null {
  if (Object.keys(validarVehiculo(valores)).length) return null
  const payload: PayloadVehiculo = {}
  for (const campo of CAMPOS_TEXTO) {
    const texto = valores[campo].trim()
    if (texto !== base[campo].trim()) payload[campo] = texto
  }
  const capacidad = Number(valores.capacidadPasajeros)
  if (capacidad !== base.capacidadPasajeros) payload.capacidadPasajeros = capacidad
  return payload
}
