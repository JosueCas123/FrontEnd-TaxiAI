import { describe, expect, it } from 'vitest'
import { construirPatchTarifa, descripcionSchema, montoSchema, vigenciaDesdeSchema } from './tarifasForm'

describe('contrato de tarifa', () => {
  it.each(['5', '5.0', '5.000', ' 5.00', '5.00 ', '-1.00', '05.00', '0.00', '1e5', '1,50', 5, '', '+5.00', '100000000.00'])('rechaza monto %s', (valor) => {
    expect(montoSchema.safeParse(valor).success).toBe(false)
  })
  it.each(['0.01', '99999999.99', '15.00'])('acepta string %s sin transformar', (valor) => expect(montoSchema.parse(valor)).toBe(valor))
  it.each(['', '   ', 'a'.repeat(256)])('rechaza descripcion invalida', (valor) => expect(descripcionSchema.safeParse(valor).success).toBe(false))
  it('recorta descripcion y acepta 255', () => {
    expect(descripcionSchema.parse(' ejemplo ')).toBe('ejemplo')
    expect(descripcionSchema.parse('a'.repeat(255))).toHaveLength(255)
  })
  it.each(['2026-13-01', '2026-01-32', '2026-02-29', '2026/01/01', '2026-01-01T00:00:00', '2026-01-01T00:00:00Z', ''])('rechaza fecha %s', (valor) => expect(vigenciaDesdeSchema.safeParse(valor).success).toBe(false))
  it.each(['2024-02-29', '2026-10-05'])('acepta fecha %s', (valor) => expect(vigenciaDesdeSchema.parse(valor)).toBe(valor))
  const base = { id: 'ficticio', descripcion: 'Base', monto: '15.00', vigenciaDesde: '2026-01-01' }
  it('bloquea vacio e ignora vigencia incluso manipulada', () => expect(construirPatchTarifa(base, { ...base, descripcion: ' Base ', vigenciaDesde: '2030-01-01' })).toBeNull())
  it('envia solo descripcion', () => expect(construirPatchTarifa(base, { ...base, descripcion: ' Otra ' })).toEqual({ descripcion: 'Otra' }))
  it('envia solo monto', () => expect(construirPatchTarifa(base, { ...base, monto: '0.01' })).toEqual({ monto: '0.01' }))
  it('envia ambos sin vigencia', () => expect(construirPatchTarifa(base, { ...base, descripcion: 'Otra', monto: '0.01' })).toEqual({ descripcion: 'Otra', monto: '0.01' }))
})
