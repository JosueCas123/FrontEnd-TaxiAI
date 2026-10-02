import { describe, expect, it } from 'vitest'
import { ApiError } from '../api/client'
import type { Indicadores } from '../api/types'
import {
  CLAVE_INDICADORES,
  TARJETAS,
  fechaIndicadoresParaMostrar,
  informacionErrorIndicadores,
  intervaloRefrescoIndicadores,
  puedeDispararRefrescoIndicadores,
  retryIndicadores,
  type ClaveIndicador,
} from './indicadores'

const MUESTRA: Indicadores = {
  conductoresDisponibles: 3,
  conductoresEnServicio: 1,
  solicitudesActivas: 2,
  solicitudesCompletadasHoy: 4,
}

const CLAVES: ClaveIndicador[] = [
  'conductoresDisponibles',
  'conductoresEnServicio',
  'solicitudesActivas',
  'solicitudesCompletadasHoy',
]

describe('U01 tarjetas', () => {
  it('la query key es exactamente la del Modulo 1', () => {
    expect(CLAVE_INDICADORES).toEqual(['indicadores'])
  })

  it('las cuatro claves existen en Indicadores y en el orden del prototipo', () => {
    expect(TARJETAS.map((tarjeta) => tarjeta.clave)).toEqual(CLAVES)
    expect(Object.keys(MUESTRA)).toEqual(CLAVES)
    for (const clave of CLAVES) expect(typeof MUESTRA[clave]).toBe('number')
  })

  it.each([
    ['Conductores disponibles', 'verde', 'car'],
    ['Conductores en servicio', 'azul', 'pin'],
    ['Solicitudes activas', 'ambar', 'requests'],
    ['Solicitudes completadas hoy', 'gris', 'checkCircle'],
  ])('titulo %s con punto %s e icono %s', (titulo, color, icono) => {
    const tarjeta = TARJETAS.find((item) => item.titulo === titulo)
    expect(tarjeta).toBeDefined()
    expect(tarjeta!.pie.color).toBe(color)
    expect(tarjeta!.icono).toBe(icono)
    expect(tarjeta!.pie.texto.length).toBeGreaterThan(0)
  })

  it('el cuarto titulo es el del roadmap, no el abreviado del prototipo', () => {
    expect(TARJETAS[3].titulo).toBe('Solicitudes completadas hoy')
    expect(TARJETAS.some((tarjeta) => tarjeta.titulo === 'Completadas hoy')).toBe(false)
  })

  it('ningun titulo afirma que los conductores puedan recibir solicitudes', () => {
    for (const tarjeta of TARJETAS) {
      expect(tarjeta.titulo).not.toMatch(/listos|listo|recibir solicitudes|elegib/i)
      expect(tarjeta.pie.texto).not.toMatch(/listos|recibir solicitudes|elegib/i)
    }
    expect(TARJETAS[0].pie.texto).toBe('Disponibilidad registrada')
    expect(TARJETAS[0].pie.texto).not.toMatch(/listos|recibir solicitudes/i)
  })

  it('los colores siguen el orden verde, azul, ambar, gris del prototipo', () => {
    expect(TARJETAS.map((tarjeta) => tarjeta.pie.color)).toEqual(['verde', 'azul', 'ambar', 'gris'])
  })
})

describe('U02 retry', () => {
  it.each([
    ['red', new TypeError('Failed to fetch')],
    ['500', new ApiError(500, 'No se pudo completar la operacion')],
    ['502', new ApiError(502, 'No se pudo completar la operacion')],
    ['503', new ApiError(503, 'No se pudo completar la operacion')],
  ])('reintenta %s como maximo una vez', (_caso, error) => {
    expect(retryIndicadores(0, error)).toBe(true)
    expect(retryIndicadores(1, error)).toBe(false)
    expect(retryIndicadores(5, error)).toBe(false)
  })

  it.each([
    ['400', new ApiError(400, 'Entrada invalida')],
    ['401', new ApiError(401, 'Credenciales invalidas')],
    ['403', new ApiError(403, 'Permiso denegado')],
    ['404', new ApiError(404, 'Ruta inexistente')],
  ])('no reintenta %s', (_caso, error) => {
    expect(retryIndicadores(0, error)).toBe(false)
    expect(retryIndicadores(1, error)).toBe(false)
  })

  it.each([
    new DOMException('Solicitud de una sesion anterior', 'AbortError'),
    new Error('Otro fallo'),
    new SyntaxError('JSON invalido'),
    null,
  ])('no reintenta errores que no son de transporte ni de servidor', (error) => {
    expect(retryIndicadores(0, error)).toBe(false)
  })
})

describe('U03 errores por status', () => {
  it.each([
    [400, 'Entrada invalida', false],
    [401, 'Credenciales invalidas', false],
    [403, 'Permiso denegado', false],
    [404, 'Ruta inexistente', false],
    [500, 'No se pudo completar la operacion', true],
  ])('HTTP %s con el mensaje del contrato', (status, mensaje, recuperable) => {
    const info = informacionErrorIndicadores(new ApiError(status, mensaje))
    expect(info).toEqual({ mensaje, recuperable })
  })

  it('el error de transporte es recuperable con mensaje propio', () => {
    expect(informacionErrorIndicadores(new TypeError('Failed to fetch'))).toEqual({
      mensaje: 'No se pudo conectar con el servidor.',
      recuperable: true,
    })
  })

  it.each([new Error('otro'), new SyntaxError('json'), new DOMException('x', 'AbortError'), null])(
    'un fallo sin status no ofrece recuperacion',
    (error) => {
      const info = informacionErrorIndicadores(error)
      expect(info.mensaje.length).toBeGreaterThan(0)
      expect(info.recuperable).toBe(false)
    },
  )

  it('decide por status y no por el texto del mensaje', () => {
    expect(informacionErrorIndicadores(new ApiError(400, 'Permiso denegado')).recuperable).toBe(false)
    expect(informacionErrorIndicadores(new ApiError(500, 'Ruta inexistente')).recuperable).toBe(true)
    expect(informacionErrorIndicadores(new ApiError(403, 'No se pudo conectar con el servidor.'))).toEqual({
      mensaje: 'No se pudo conectar con el servidor.',
      recuperable: false,
    })
  })
})

describe('U04 intervalo de refresco', () => {
  it('15 s con la pestana visible y sin lectura en curso', () => {
    expect(intervaloRefrescoIndicadores({ visible: true, enCurso: false })).toBe(15_000)
  })

  it.each([
    ['pestana oculta', { visible: false, enCurso: false }],
    ['lectura en curso', { visible: true, enCurso: true }],
    ['pestana oculta y lectura en curso', { visible: false, enCurso: true }],
  ])('pausa con %s', (_caso, argumentos) => {
    expect(intervaloRefrescoIndicadores(argumentos)).toBe(false)
  })
})

const lecturaEnCurso = (enVuelo: boolean, manual: boolean) => enVuelo || manual

describe('U05 guardas de lectura manual', () => {
  it('bloquea mientras hay lectura en curso y permite disparar si no la hay', () => {
    expect(puedeDispararRefrescoIndicadores(true)).toBe(false)
    expect(puedeDispararRefrescoIndicadores(false)).toBe(true)
  })

  it('Actualizar y Reintentar comparten la guarda: basta una lectura en vuelo o manual', () => {
    expect(puedeDispararRefrescoIndicadores(lecturaEnCurso(true, false))).toBe(false)
    expect(puedeDispararRefrescoIndicadores(lecturaEnCurso(false, true))).toBe(false)
    expect(puedeDispararRefrescoIndicadores(lecturaEnCurso(true, true))).toBe(false)
    expect(puedeDispararRefrescoIndicadores(lecturaEnCurso(false, false))).toBe(true)
  })
})

describe('U06 fecha local', () => {
  it.each([
    ['2026-10-02T04:00:00.000Z', '02 oct 2026'],
    ['2026-10-02T03:59:59.999Z', '01 oct 2026'],
    ['2026-09-30T04:00:00.000Z', '30 sept 2026'],
  ])('formatea %s con el dia de America/La_Paz como %s', (instante, esperado) => {
    expect(fechaIndicadoresParaMostrar(new Date(instante))).toBe(esperado)
  })

  it('un instante a medianoche local usa el dia de America/La_Paz y no el del equipo', () => {
    const medianocheLocal = new Date(2026, 9, 2, 0, 0, 0)
    const diaEnLaPaz = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/La_Paz' }).format(medianocheLocal)
    expect(fechaIndicadoresParaMostrar(medianocheLocal).slice(0, 2)).toBe(diaEnLaPaz.slice(8, 10))
  })

  it.each([
    ['fecha no representable', new Date(Number.NaN)],
    ['rango maximo excedido', new Date(8.64e15 + 1)],
  ])('%s devuelve Fecha no disponible', (_caso, fecha) => {
    expect(fechaIndicadoresParaMostrar(fecha)).toBe('Fecha no disponible')
  })

  it('nunca devuelve Invalid Date', () => {
    for (const fecha of [new Date(Number.NaN), new Date(8.64e15 + 1), new Date('no-es-fecha')]) {
      expect(fechaIndicadoresParaMostrar(fecha)).not.toContain('Invalid Date')
    }
  })

  it('el instante limite del dia no se confunde entre el dia anterior y el actual', () => {
    const previo = fechaIndicadoresParaMostrar(new Date('2026-10-02T03:59:59.999Z'))
    const actual = fechaIndicadoresParaMostrar(new Date('2026-10-02T04:00:00.000Z'))
    expect(previo).not.toBe(actual)
  })
})
