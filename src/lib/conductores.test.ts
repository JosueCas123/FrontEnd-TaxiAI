import { describe, expect, it } from 'vitest'
import { ApiError } from '../api/client'
import type { ConductorListado, EstadoConductor } from '../api/types'
import * as c from './conductores'

const fila: ConductorListado = {
  id: 'uno', nombreCompleto: 'Nombre Ficticio', telefono: '+591 000-123',
  cedulaIdentidad: 'TEST', estado: 'pendiente', estadoJornada: 'no_iniciada',
  estadoDisponibilidad: 'no_disponible', creadoEn: '2026-09-30',
  vehiculo: { id: 'v', placa: 'TEST- 123', marca: 'Test', modelo: 'Test', color: 'Test', capacidadPasajeros: 4 },
}

describe('conductores: contratos y errores', () => {
  it.each(Object.keys(c.PESTANAS) as EstadoConductor[])('clave y ruta %s', (estado) => {
    expect(c.claveConductores(estado)).toEqual(['conductores', { estado }])
    expect(c.rutaConductores(estado)).toBe(`/api/conductores?estado=${estado}`)
  })
  it.each([400, 401, 403, 404, 409, 422, 500, 503])('reintento y mensaje HTTP %s', (status) => {
    const error = new ApiError(status, `Servidor ${status}`)
    expect(c.retryConductores(0, error)).toBe(status >= 500)
    expect(c.retryConductores(1, error)).toBe(false)
    expect(c.informacionErrorConductores(error).recuperable).toBe(status >= 500)
    expect(c.informacionErrorConductores(error).mensaje).toContain(error.message)
    expect(c.mensajeErrorTransicion(error)).toBe(error.message)
  })
  it('red, aborto y errores desconocidos', () => {
    expect(c.retryConductores(0, new TypeError())).toBe(true)
    expect(c.retryConductores(1, new TypeError())).toBe(false)
    for (const error of [new Error(), new DOMException('', 'AbortError'), null]) {
      expect(c.retryConductores(0, error)).toBe(false)
      expect(c.informacionErrorConductores(error).recuperable).toBe(false)
    }
    expect(c.informacionErrorConductores(new TypeError()).recuperable).toBe(true)
    expect(c.mensajeErrorTransicion(new TypeError())).toContain('No se pudo confirmar')
  })
})

describe('busqueda local y etiquetas', () => {
  it.each(['nombre', ' FICTICIO ', '+591000123', '000- 123', 'test123', 'TEST- 123'])('filtra %s', (texto) => {
    expect(c.filtrarConductores([fila], texto)).toEqual([fila])
  })
  it('no reordena, no deduplica y no altera la lista', () => {
    const lista = [fila, { ...fila, id: 'dos' }, fila]
    expect(c.filtrarConductores(lista, '  ')).toBe(lista)
    expect(c.filtrarConductores(lista, 'nombre')).toEqual(lista)
    expect(c.filtrarConductores(lista, 'ausente')).toEqual([])
    expect(c.filtrarConductores([{ ...fila, vehiculo: null }], 'test123')).toEqual([])
    expect(c.filtrarConductores([fila], '-')).toEqual([])
  })
  it('normaliza solo las reglas aprobadas', () => {
    expect(c.normalizarTexto(' ÁB C ')).toBe('áb c')
    expect(c.normalizarDigitos(' AB- C ')).toBe('abc')
    expect(c.hayTerminoBusqueda('  ')).toBe(false)
    expect(c.hayTerminoBusqueda('-')).toBe(true)
  })
  it.each(['', '   ', undefined, null])('nombre ausente %s', (nombre) => {
    expect(c.nombreParaMostrar(nombre)).toBe('(sin nombre)')
    expect(c.textoConfirmacion('aprobar', nombre)).toContain('(sin nombre)')
    expect(c.mensajeExitoTransicion('aprobar', nombre)).toContain('(sin nombre)')
  })
  it('etiquetas y cantidades locales', () => {
    expect(c.nombreParaMostrar(' Test ')).toBe('Test')
    expect(c.etiquetaVehiculo(null)).toBe('Sin vehiculo')
    expect(c.etiquetaVehiculo(fila.vehiculo)).toBe('TEST- 123')
    expect(c.mensajeBusquedaVacia(' X ')).toBe('Sin resultados para «X»')
    expect(c.resumenResultados(0, 3)).toBe('Mostrando 0 de 3')
    expect(c.resumenResultados(0, 0)).toBe('Mostrando 0 de 0')
    for (const estado of Object.keys(c.PESTANAS) as EstadoConductor[]) {
      expect(c.mensajePestanaVacia(estado)).toBe(`No hay conductores ${c.PESTANAS[estado].toLowerCase()}`)
    }
  })
})

describe('transiciones y conciliacion', () => {
  it('matriz estricta', () => {
    expect(c.accionesPorEstado('pendiente')).toEqual(['aprobar', 'rechazar'])
    expect(c.accionesPorEstado('aprobado')).toEqual(['suspender'])
    expect(c.accionesPorEstado('suspendido')).toEqual(['reactivar'])
    expect(c.accionesPorEstado('rechazado')).toEqual([])
  })
  it.each(['aprobar', 'rechazar', 'suspender', 'reactivar'] as c.Accion[])('ruta y textos %s', (accion) => {
    expect(c.rutaTransicion('id', accion)).toBe(`/api/conductores/id/${accion}`)
    expect(c.textoConfirmacion(accion, ' Test ')).toContain('Test')
    expect(c.textoConfirmacion(accion, 'Test')).toContain(c.ETIQUETAS_ACCION[accion])
    expect(c.mensajeExitoTransicion(accion, 'Test')).toContain('Cuenta de Test')
  })
  it('retira por id sin fabricar cache ni mutar', () => {
    const lista = [fila, { ...fila, id: 'dos' }]
    expect(c.quitarConductor(undefined, 'uno')).toBeUndefined()
    expect(c.quitarConductor(lista, 'uno')).toEqual([lista[1]])
    expect(c.quitarConductor(lista, 'ausente')).toEqual(lista)
    expect(lista).toHaveLength(2)
  })
  it.each([true, false])('visibilidad %s y pausa de mutacion', (visible) => {
    expect(c.intervaloRefresco({ visible, hayTransicionEnCurso: true })).toBe(false)
    expect(c.intervaloRefresco({ visible, hayTransicionEnCurso: false })).toBe(visible ? 15000 : false)
  })
  it('guarda de refresco', () => {
    expect(c.puedeDispararRefresco(true)).toBe(false)
    expect(c.puedeDispararRefresco(false)).toBe(true)
  })
})
