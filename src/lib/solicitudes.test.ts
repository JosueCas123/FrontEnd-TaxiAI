import { describe, expect, it } from 'vitest'
import { ApiError } from '../api/client'
import type { SolicitudActiva } from '../api/types'
import {
  CLAVE_SOLICITUDES_ACTIVAS, ESTADOS_ACTIVOS, fechaSolicitud, filtrarSolicitudes,
  informacionErrorSolicitudes, intervaloSolicitudes, puedeRefrescarSolicitudes, retrySolicitudes,
} from './solicitudes'

const fila: SolicitudActiva = {
  id: 'AAAAAAAA-0000-4000-8000-000000000001', estado: 'esperando_respuesta',
  pasajero: { id: 'p', nombre: 'Pasajero Álvarez' }, conductorAsignado: { id: 'c', nombreCompleto: 'Conductor Prueba' },
  latitudRecogida: -16, longitudRecogida: -68, destino: null,
  creadoEn: '2026-10-05T02:03:04Z', expiraEn: '2020-01-01T00:00:00Z',
}

describe('contrato y filtros locales', () => {
  it('clave exacta y seis activos sin terminales', () => {
    expect(CLAVE_SOLICITUDES_ACTIVAS).toEqual(['solicitudes-activas'])
    expect(ESTADOS_ACTIVOS.map((e) => e.valor)).toEqual(['creada', 'buscando', 'conductor_seleccionado', 'esperando_respuesta', 'aceptada', 'en_servicio'])
  })
  it.each([' aaaaaaaa ', ' PASAJERO ', 'conductor PRUEBA', 'ÁLVAREZ'])('busca %s', (texto) => {
    expect(filtrarSolicitudes([fila], texto, 'todos')).toEqual([fila])
  })
  it('combina filtros sin normalizar acentos', () => {
    expect(filtrarSolicitudes([fila], 'alvarez', 'todos')).toEqual([])
    expect(filtrarSolicitudes([fila], 'pasajero', 'aceptada')).toEqual([])
    expect(filtrarSolicitudes([fila], 'pasajero', 'esperando_respuesta')).toEqual([fila])
  })
  it('nulos, vacio y orden sin truncar ni interpretar expiracion', () => {
    const datos = Array.from({ length: 30 }, (_, i) => ({ ...fila, id: `${30 - i}`, pasajero: null, conductorAsignado: null }))
    expect(filtrarSolicitudes(datos, ' ', 'todos')).toEqual(datos)
    expect(filtrarSolicitudes(datos, 'ausente', 'todos')).toEqual([])
    expect(filtrarSolicitudes([], '', 'todos')).toEqual([])
    expect(datos.every((dato) => dato.estado === 'esperando_respuesta')).toBe(true)
  })
})

describe('fechas absolutas', () => {
  it('zona explicita, cruce de dia, 24 horas y segundos opcionales', () => {
    expect(fechaSolicitud(fila.creadoEn)).toBe('04/10/2026, 22:03')
    expect(fechaSolicitud(fila.creadoEn, true)).toBe('04/10/2026, 22:03:04')
    expect(fechaSolicitud('2026-10-05T04:00:00Z', true)).toBe('05/10/2026, 00:00:00')
  })
  it('fallbacks', () => {
    expect(fechaSolicitud(null)).toBe('\u2014')
    expect(fechaSolicitud('invalida')).toBe('Fecha no disponible')
  })
})

describe('lectura y errores', () => {
  it.each([400, 401, 403, 404, 422, 429])('no reintenta %i ni analiza palabras', (status) => {
    const error = new ApiError(status, '500 servidor caido')
    expect(retrySolicitudes(0, error)).toBe(false)
    expect(informacionErrorSolicitudes(error)).toEqual({ mensaje: error.message, recuperable: false })
  })
  it.each([new ApiError(500, 'Mock'), new ApiError(503, ''), new TypeError('Network')])('un solo retry recuperable %s', (error) => {
    expect(retrySolicitudes(0, error)).toBe(true)
    expect(retrySolicitudes(1, error)).toBe(false)
    expect(retrySolicitudes(2, error)).toBe(false)
    expect(informacionErrorSolicitudes(error)?.recuperable).toBe(true)
  })
  it.each(['AbortError', 'CancelledError'])('silencia %s', (name) => {
    const error = new Error('cancelada'); error.name = name
    expect(informacionErrorSolicitudes(error)).toBeNull()
    expect(retrySolicitudes(0, error)).toBe(false)
  })
  it('error desconocido no recuperable', () => {
    expect(retrySolicitudes(0, new Error('500'))).toBe(false)
    expect(informacionErrorSolicitudes(null)?.recuperable).toBe(false)
  })
  it.each([true, false])('intervalo visible=%s', (visible) => {
    expect(intervaloSolicitudes(visible, false)).toBe(visible ? 15000 : false)
    expect(intervaloSolicitudes(visible, true)).toBe(false)
  })
  it.each(['idle', 'fetching', 'paused'])('guarda manual %s', (status) => {
    expect(puedeRefrescarSolicitudes(true, status, false)).toBe(status === 'idle')
    expect(puedeRefrescarSolicitudes(false, status, false)).toBe(false)
    expect(puedeRefrescarSolicitudes(true, status, true)).toBe(false)
  })
  it('bloquea el refresco durante la carga inicial', () => {
    expect(puedeRefrescarSolicitudes(true, 'idle', false, true)).toBe(false)
    expect(puedeRefrescarSolicitudes(true, 'idle', false, false)).toBe(true)
  })
})
