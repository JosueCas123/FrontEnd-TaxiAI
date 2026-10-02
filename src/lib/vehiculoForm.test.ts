import { describe, expect, it } from 'vitest'
import type { Vehiculo } from '../api/types'
import { CAMPOS_TEXTO, construirPayloadVehiculo, tieneEdicionesVehiculo, validarVehiculo, valoresDesdeVehiculo } from './vehiculoForm'

const base: Vehiculo = Object.freeze({ id: 'vehiculo-ficticio', placa: '123-abc', marca: 'Marca', modelo: 'Modelo', color: 'Blanco', capacidadPasajeros: 4 })
const valores = valoresDesdeVehiculo(base)

describe('U01 validacion de vehiculo', () => {
  for (const campo of CAMPOS_TEXTO) {
    it.each(['', '   ', 'a'.repeat(31)])(`${campo} rechaza %j`, (texto) => {
      expect(validarVehiculo({ ...valores, [campo]: texto })[campo]).toBeDefined()
      expect(construirPayloadVehiculo(base, { ...valores, [campo]: texto })).toBeNull()
    })
    it.each(['a', 'a'.repeat(30), '  abc  '])(`${campo} acepta %j`, (texto) => {
      expect(validarVehiculo({ ...valores, [campo]: texto })).toEqual({})
    })
  }
  it.each(['', ' ', 'texto', '0', '-1', '1.5', '101', 'Infinity', 'NaN'])('capacidad rechaza %j', (texto) => {
    expect(validarVehiculo({ ...valores, capacidadPasajeros: texto }).capacidadPasajeros).toBeDefined()
  })
  it.each(['1', '100', ' 4 ', '04', '4.0', '4e0'])('capacidad acepta %j sin limitar notacion', (texto) => {
    expect(validarVehiculo({ ...valores, capacidadPasajeros: texto })).toEqual({})
  })
})

describe('U02 diferencias contra base estable', () => {
  it('sin diferencias, trim y equivalencia numerica', () => {
    expect(construirPayloadVehiculo(base, valores)).toEqual({})
    const equivalente = { ...valores, placa: ' 123-abc ', capacidadPasajeros: '4e0' }
    expect(construirPayloadVehiculo(base, equivalente)).toEqual({})
    expect(tieneEdicionesVehiculo(base, equivalente)).toBe(false)
  })
  it.each(CAMPOS_TEXTO)('solo %s y sin mayusculas forzadas', (campo) => {
    expect(construirPayloadVehiculo(base, { ...valores, [campo]: ' nuevo ' })).toEqual({ [campo]: 'nuevo' })
  })
  it('capacidad es numero JSON', () => {
    expect(construirPayloadVehiculo(base, { ...valores, capacidadPasajeros: '100' })).toEqual({ capacidadPasajeros: 100 })
  })
  it('combinaciones y exclusion de campos internos', () => {
    expect(construirPayloadVehiculo(base, { ...valores, placa: ' abc ', color: 'Azul', capacidadPasajeros: '2' })).toEqual({ placa: 'abc', color: 'Azul', capacidadPasajeros: 2 })
    expect(Object.keys(valores)).toEqual(['placa', 'marca', 'modelo', 'color', 'capacidadPasajeros'])
  })
  it('U03 el borrador invalido sigue sucio y no modifica base', () => {
    for (const campo of Object.keys(valores)) {
      expect(tieneEdicionesVehiculo(base, { ...valores, [campo]: '' })).toBe(true)
    }
    const nuevaLectura = { ...base, color: 'Negro' }
    expect(construirPayloadVehiculo(base, { ...valores, placa: 'Otra' })).toEqual({ placa: 'Otra' })
    expect(nuevaLectura.color).toBe('Negro')
    expect(base.color).toBe('Blanco')
  })
})
