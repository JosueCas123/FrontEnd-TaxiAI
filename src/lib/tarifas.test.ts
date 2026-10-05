import { afterEach, expect, it, vi } from 'vitest'
import { ApiError } from '../api/client'
import { CLAVE_TARIFAS, fechaTarifa, hoyTarifa, informacionErrorTarifas, intervaloTarifas, leerTarifas, montoTarifa, puedeRefrescarTarifas, retryTarifas } from './tarifas'

afterEach(() => vi.unstubAllGlobals())
it('clave y GET exactos con signal', async () => {
  const fetch = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => [] })
  vi.stubGlobal('fetch', fetch)
  const signal = new AbortController().signal
  expect(CLAVE_TARIFAS).toEqual(['tarifas'])
  expect(await leerTarifas(signal)).toEqual([])
  expect(fetch.mock.calls[0][0]).toMatch(/\/api\/tarifas$/)
  expect(fetch.mock.calls[0][1].signal).toBe(signal)
})
it('pausa por dialogo, visibilidad, offline o lectura en vuelo', () => {
  expect(intervaloTarifas(true, true, false, false)).toBe(15000)
  expect(intervaloTarifas(true, true, true, false)).toBe(false)
  expect(intervaloTarifas(false, true, false, false)).toBe(false)
  expect(intervaloTarifas(true, false, false, false)).toBe(false)
  expect(intervaloTarifas(true, true, false, true)).toBe(false)
})
it('evita solapamientos y offline', () => {
  expect(puedeRefrescarTarifas(true, 'idle', false)).toBe(true)
  for (const estado of ['fetching', 'paused']) expect(puedeRefrescarTarifas(true, estado, false)).toBe(false)
  expect(puedeRefrescarTarifas(true, 'idle', true)).toBe(false)
  expect(puedeRefrescarTarifas(false, 'idle', false)).toBe(false)
})
it.each([400, 401, 403, 404, 409])('clasifica %s por status sin retry', (status) => {
  const error = new ApiError(status, 'mensaje arbitrario')
  expect(informacionErrorTarifas(error)?.mensaje).toBe('mensaje arbitrario')
  expect(informacionErrorTarifas(error)?.permiso).toBe(status === 403)
  expect(retryTarifas(0, error)).toBe(false)
})
it.each([new TypeError('red'), new ApiError(500, 'servidor')])('un solo retry recuperable', (error) => {
  expect(retryTarifas(0, error)).toBe(true)
  expect(retryTarifas(1, error)).toBe(false)
})
it('cancelaciones silenciosas', () => expect(informacionErrorTarifas(new DOMException('', 'AbortError'))).toBeNull())
it('formatea sin normalizar montos ni desplazar calendarios', () => {
  expect(montoTarifa('99999999.99')).toBe('99999999.99 Bs')
  expect(montoTarifa('15.00')).toBe('15.00 Bs')
  for (const valor of ['05.00', '5', '0.00']) expect(montoTarifa(valor)).toBe('Monto no disponible')
  expect(fechaTarifa('2026-01-01')).toBe('01/01/2026')
  expect(fechaTarifa('2026-02-30')).toBe('Fecha no disponible')
  expect(hoyTarifa(new Date('2026-10-05T02:00:00Z'))).toBe('2026-10-04')
})
