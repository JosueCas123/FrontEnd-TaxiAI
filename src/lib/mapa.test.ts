import { describe, expect, it } from 'vitest'
import { ApiError } from '../api/client'
import type { ConductorMapa } from '../api/types'
import {
  CATEGORIAS_FILTRO,
  CENTRO_INICIAL_MAPA,
  CLAVE_CONDUCTORES_MAPA,
  ETIQUETAS_COLOR,
  MAX_ZOOM_MAPA,
  ZOOM_INICIAL_MAPA,
  antiguedadUbicacionParaMostrar,
  categoriaDe,
  conteoPorCategoria,
  conductoresConUbicacion,
  conductoresVisibles,
  estadoParaMostrar,
  getColorMarcador,
  inicialesParaMostrar,
  informacionErrorMapa,
  intervaloRefrescoMapa,
  puedeDispararRefrescoMapa,
  retryMapa,
  textoVehiculoParaMostrar,
  type CategoriaFiltro,
  type ColorMarcador,
} from './mapa'

const conductor = (parches: Partial<ConductorMapa> = {}): ConductorMapa => ({
  id: 'c1',
  nombreCompleto: 'Juan Mamani',
  estado: 'aprobado',
  estadoJornada: 'activa',
  estadoDisponibilidad: 'disponible',
  vehiculo: { placa: '1234-ABC', marca: 'Toyota', modelo: 'Corolla', color: 'Blanco' },
  ubicacion: { latitud: -16.4897, longitud: -68.1193, horaRegistro: '2026-10-02T12:00:00.000Z' },
  ultimaUbicacionRegistradaEn: '2026-10-02T12:00:00.000Z',
  ...parches,
})

const sinUbicacion = { ubicacion: null } as const
const conFecha = '2026-10-02T12:00:00.000Z'

const LISTA: ConductorMapa[] = [
  conductor({ id: 'v', estadoDisponibilidad: 'disponible' }),
  conductor({ id: 'a', estadoDisponibilidad: 'en_servicio' }),
  conductor({ id: 'g1', estado: 'pendiente' }),
  conductor({ id: 'g2', estadoJornada: 'no_iniciada' }),
  conductor({ id: 'g3', estadoDisponibilidad: 'no_disponible' }),
  conductor({ id: 'g4', estadoDisponibilidad: 'solicitud_pendiente' }),
  conductor({ id: 'g5', ...sinUbicacion, ultimaUbicacionRegistradaEn: null }),
  conductor({ id: 'r', ...sinUbicacion, ultimaUbicacionRegistradaEn: conFecha }),
]

describe('U01 clave de query y vista inicial', () => {
  it('la query key es exactamente la del endpoint de conductors', () => {
    expect(CLAVE_CONDUCTORES_MAPA).toEqual(['conductores-mapa'])
  })

  it('el centro inicial es La Paz y el zoom inicial respeta el maximo del encuadre', () => {
    expect(CENTRO_INICIAL_MAPA).toEqual([-16.4897, -68.1193])
    expect(CENTRO_INICIAL_MAPA[0]).toBeLessThan(0)
    expect(CENTRO_INICIAL_MAPA[1]).toBeLessThan(0)
    expect(ZOOM_INICIAL_MAPA).toBe(14)
    expect(MAX_ZOOM_MAPA).toBe(14)
  })
})

describe('U02 color del marcador', () => {
  it('regla 1: sin ubicacion actual pero con ultima registrada es ambar', () => {
    expect(getColorMarcador(conductor({ ...sinUbicacion }))).toBe('ambar')
  })

  it('regla 2: estado distinto de aprobado es gris', () => {
    for (const estado of ['pendiente', 'rechazado', 'suspendido'] as const) {
      expect(getColorMarcador(conductor({ estado }))).toBe('gris')
    }
  })

  it('regla 3: jornada distinta de activa es gris', () => {
    for (const estadoJornada of ['no_iniciada', 'finalizada'] as const) {
      expect(getColorMarcador(conductor({ estadoJornada }))).toBe('gris')
    }
  })

  it('regla 4: nunca recibio reportes es gris', () => {
    expect(getColorMarcador(conductor({ ...sinUbicacion, ultimaUbicacionRegistradaEn: null }))).toBe('gris')
  })

  it('regla 5: en servicio es azul', () => {
    expect(getColorMarcador(conductor({ estadoDisponibilidad: 'en_servicio' }))).toBe('azul')
  })

  it('regla 6: disponible es verde', () => {
    expect(getColorMarcador(conductor({ estadoDisponibilidad: 'disponible' }))).toBe('verde')
  })

  it.each(['no_disponible', 'solicitud_pendiente'] as const)('regla 7: %s cae en gris', (estadoDisponibilidad) => {
    expect(getColorMarcador(conductor({ estadoDisponibilidad }))).toBe('gris')
  })

  it('el ambar gana a cualquier regla posterior', () => {
    const enServicioSinUbicacion = conductor({
      ...sinUbicacion,
      estadoDisponibilidad: 'en_servicio',
      ultimaUbicacionRegistradaEn: conFecha,
    })
    expect(getColorMarcador(enServicioSinUbicacion)).toBe('ambar')
    const pendienteSinUbicacion = conductor({
      ...sinUbicacion,
      estado: 'pendiente',
      estadoJornada: 'no_iniciada',
      ultimaUbicacionRegistradaEn: conFecha,
    })
    expect(getColorMarcador(pendienteSinUbicacion)).toBe('ambar')
    expect(getColorMarcador(pendienteSinUbicacion)).not.toBe('gris')
  })

  it('la antiguedad del reporte no altera el color', () => {
    const recientes = conductor({ ...sinUbicacion, ultimaUbicacionRegistradaEn: '2026-10-02T11:59:59.000Z' })
    const antiguos = conductor({ ...sinUbicacion, ultimaUbicacionRegistradaEn: '2020-01-01T00:00:00.000Z' })
    expect(getColorMarcador(recientes)).toBe('ambar')
    expect(getColorMarcador(antiguos)).toBe('ambar')
  })

  it('nunca devuelve un color fuera de la paleta de cuatro estados', () => {
    for (const fila of LISTA) expect(Object.keys(ETIQUETAS_COLOR)).toContain(getColorMarcador(fila))
  })
})

describe('U03 filtros y conteos', () => {
  it('categoriaDe coincide con el color del marcador', () => {
    for (const fila of LISTA) expect(categoriaDe(fila)).toBe(getColorMarcador(fila))
  })

  it('todos devuelve la lista completa sin crear copias distintas', () => {
    expect(conductoresVisibles(LISTA, 'todos')).toBe(LISTA)
  })

  it.each<[CategoriaFiltro, string[]]>([
    ['verde', ['v']],
    ['azul', ['a']],
    ['gris', ['g1', 'g2', 'g3', 'g4', 'g5']],
    ['ambar', ['r']],
  ])('el chip %s muestra solo sus conductores', (categoria, esperados) => {
    expect(conductoresVisibles(LISTA, categoria).map((fila) => fila.id)).toEqual(esperados)
  })

  it('ningun filtro pierde ni duplica conductores', () => {
    for (const { clave } of CATEGORIAS_FILTRO) {
      const visibles = conductoresVisibles(LISTA, clave)
      expect(visibles.length).toBeLessThanOrEqual(LISTA.length)
      expect(new Set(visibles.map((fila) => fila.id)).size).toBe(visibles.length)
    }
    const suma = (['verde', 'azul', 'gris', 'ambar'] as const).reduce(
      (total, color) => total + conductoresVisibles(LISTA, color).length,
      0,
    )
    expect(suma).toBe(LISTA.length)
  })

  it('los conteos por categoria cuadran con la lista y con todos', () => {
    expect(conteoPorCategoria(LISTA)).toEqual({ todos: 8, verde: 1, azul: 1, gris: 5, ambar: 1 })
    for (const { clave } of CATEGORIAS_FILTRO) {
      expect(conteoPorCategoria(LISTA)[clave]).toBe(conductoresVisibles(LISTA, clave).length)
    }
  })

  it('una lista vacia cuenta cero en todas las categorias', () => {
    expect(conteoPorCategoria([])).toEqual({ todos: 0, verde: 0, azul: 0, gris: 0, ambar: 0 })
    expect(conductoresVisibles([], 'azul')).toEqual([])
  })
})

describe('U04 iniciales del marcador', () => {
  it.each([
    ['Juan Mamani', 'JM'],
    ['Ana', 'A'],
    ['Ana Lucia Rojas', 'AL'],
    ['Maria Fernanda Lopez Vargas', 'MF'],
    ['De la Cruz Ana', 'CA'],
    ['Óscar Chávez', 'ÓC'],
    ['  Juan   Perez  ', 'JP'],
    ['-Ana', 'A'],
  ])('las iniciales de «%s» son «%s»', (nombre, esperado) => {
    expect(inicialesParaMostrar(nombre)).toBe(esperado)
  })

  it.each(['', '   ', '\t\n', '1234', '---', '!!!', '😀😀'])(
    '«%s» nunca devuelve cadena vacia',
    (nombre) => {
      const resultado = inicialesParaMostrar(nombre)
      expect(resultado.length).toBeGreaterThan(0)
      expect(resultado.length).toBeLessThanOrEqual(3)
    },
  )

  it('ningun nombre produce mas de tres caracteres ni caracteres no alfabeticos', () => {
    const conLetras = ['Juan Mamani Perez Vargas', 'De la Cruz Ana', 'Óscar Chávez', 'Ana María', '-Ana']
    for (const nombre of conLetras) expect(inicialesParaMostrar(nombre)).toMatch(/^[\p{L}]{1,3}$/u)
    for (const nombre of [...conLetras, '', '   ', '4 5 6', '---', '😀😀']) {
      const resultado = inicialesParaMostrar(nombre)
      expect(resultado.length).toBeGreaterThan(0)
      expect(resultado.length).toBeLessThanOrEqual(3)
    }
  })

  it('el resultado no puede inyectar markup en el html del divIcon', () => {
    expect(inicialesParaMostrar('<img src=x onerror=alert(1)>')).not.toMatch(/[<>&"']/)
  })
})

describe('U05 antiguedad de la ubicacion para el popup y el directorio', () => {
  const ahora = Date.parse('2026-10-02T12:00:00.000Z')

  it('usa la hora del reporte actual cuando hay ubicacion', () => {
    const reciente = conductor({ ubicacion: { latitud: -16.4897, longitud: -68.1193, horaRegistro: '2026-10-02T11:30:00.000Z' } })
    expect(antiguedadUbicacionParaMostrar(reciente, ahora)).toBe('Hace 30 min')
  })

  it('usa el ultimo reporte cuando ya no hay ubicacion actual', () => {
    const desactualizado = conductor({ ...sinUbicacion, ultimaUbicacionRegistradaEn: '2026-10-02T11:40:00.000Z' })
    expect(antiguedadUbicacionParaMostrar(desactualizado, ahora)).toBe('Hace 20 min')
  })

  it('sin ningun reporte declara la ausencia y no simula una fecha', () => {
    const nuncaReporto = conductor({ ...sinUbicacion, ultimaUbicacionRegistradaEn: null })
    expect(antiguedadUbicacionParaMostrar(nuncaReporto, ahora)).toBe('Sin reportes de ubicacion')
  })

  it('una fecha ilegible se declara no disponible y nunca invalida', () => {
    const ilegible = conductor({ ...sinUbicacion, ultimaUbicacionRegistradaEn: 'no-es-fecha' })
    expect(antiguedadUbicacionParaMostrar(ilegible, ahora)).toBe('Fecha no disponible')
    expect(antiguedadUbicacionParaMostrar(ilegible, ahora)).not.toContain('Invalid')
  })

  it('un reloj adelantado por el servidor no produce antiguedad negativa', () => {
    const futuro = conductor({ ubicacion: { latitud: 0, longitud: 0, horaRegistro: '2026-10-02T12:30:00.000Z' } })
    expect(antiguedadUbicacionParaMostrar(futuro, ahora)).toBe('Hace menos de 1 min')
  })
})

describe('U06 vehiculo, estado y conductores pintables', () => {
  it('con vehiculo muestra la placa y sin vehiculo el texto del prototipo', () => {
    expect(textoVehiculoParaMostrar(conductor())).toBe('1234-ABC')
    expect(textoVehiculoParaMostrar(conductor({ vehiculo: null }))).toBe('Sin vehiculo registrado')
  })

  it('el estado textual acompana siempre al color', () => {
    for (const fila of LISTA) {
      expect(estadoParaMostrar(fila)).toBe(ETIQUETAS_COLOR[getColorMarcador(fila)])
      expect(estadoParaMostrar(fila).length).toBeGreaterThan(0)
    }
  })

  it('solo los conductores con coordenada se pintan en el mapa', () => {
    const pintables = conductoresConUbicacion(LISTA)
    expect(pintables.map((fila) => fila.id)).toEqual(['v', 'a', 'g1', 'g2', 'g3', 'g4'])
    expect(conductoresConUbicacion([])).toEqual([])
  })

  it('un conductor sin ubicacion sigue apareciendo en el directorio', () => {
    expect(conductoresVisibles(LISTA, 'todos').map((fila) => fila.id)).toContain('g5')
    expect(conductoresVisibles(LISTA, 'ambar').map((fila) => fila.id)).toContain('r')
    expect(conductoresConUbicacion(conductoresVisibles(LISTA, 'ambar'))).toEqual([])
  })
})

describe('U07 retry', () => {
  it.each([
    ['red', new TypeError('Failed to fetch')],
    ['500', new ApiError(500, 'No se pudo completar la operacion')],
    ['502', new ApiError(502, 'No se pudo completar la operacion')],
    ['503', new ApiError(503, 'No se pudo completar la operacion')],
  ])('reintenta %s como maximo una vez', (_caso, error) => {
    expect(retryMapa(0, error)).toBe(true)
    expect(retryMapa(1, error)).toBe(false)
    expect(retryMapa(5, error)).toBe(false)
  })

  it.each([
    ['400', new ApiError(400, 'Entrada invalida')],
    ['401', new ApiError(401, 'Credenciales invalidas')],
    ['403', new ApiError(403, 'Permiso denegado')],
    ['404', new ApiError(404, 'Ruta inexistente')],
  ])('no reintenta %s', (_caso, error) => {
    expect(retryMapa(0, error)).toBe(false)
    expect(retryMapa(1, error)).toBe(false)
  })

  it.each([
    new Error('Otro fallo'),
    new SyntaxError('JSON invalido'),
    new DOMException('Solicitud de una sesion anterior', 'AbortError'),
    null,
  ])('no reintenta errores que no son de transporte ni de servidor', (error) => {
    expect(retryMapa(0, error)).toBe(false)
  })
})

describe('U08 errores por status', () => {
  it.each([
    [400, 'Entrada invalida', false],
    [401, 'Credenciales invalidas', false],
    [403, 'Permiso denegado', false],
    [404, 'Ruta inexistente', false],
    [500, 'No se pudo completar la operacion', true],
    [503, 'No se pudo completar la operacion', true],
  ])('HTTP %s con el mensaje del contrato', (status, mensaje, recuperable) => {
    expect(informacionErrorMapa(new ApiError(status, mensaje))).toEqual({ mensaje, recuperable })
  })

  it('el error de transporte es recuperable con mensaje propio', () => {
    expect(informacionErrorMapa(new TypeError('Failed to fetch'))).toEqual({
      mensaje: 'No se pudo conectar con el servidor.',
      recuperable: true,
    })
  })

  it.each([new Error('otro'), new SyntaxError('json'), new DOMException('x', 'AbortError'), null])(
    'un fallo sin status no ofrece recuperacion',
    (error) => {
      const info = informacionErrorMapa(error)
      expect(info.mensaje.length).toBeGreaterThan(0)
      expect(info.recuperable).toBe(false)
    },
  )

  it('decide por status y no por el texto del mensaje', () => {
    expect(informacionErrorMapa(new ApiError(400, 'Permiso denegado')).recuperable).toBe(false)
    expect(informacionErrorMapa(new ApiError(500, 'Ruta inexistente')).recuperable).toBe(true)
  })

  it('un 500 sin mensaje utilizable no deja la interfaz sin texto', () => {
    const info = informacionErrorMapa(new ApiError(500, ''))
    expect(info.mensaje.length).toBeGreaterThan(0)
    expect(info.recuperable).toBe(true)
  })
})

describe('U09 intervalo de refresco', () => {
  it('15 s con la pestana visible y sin lectura en curso', () => {
    expect(intervaloRefrescoMapa({ visible: true, enCurso: false })).toBe(15_000)
  })

  it.each([
    ['pestana oculta', { visible: false, enCurso: false }],
    ['lectura en curso', { visible: true, enCurso: true }],
    ['pestana oculta y lectura en curso', { visible: false, enCurso: true }],
  ])('pausa con %s', (_caso, argumentos) => {
    expect(intervaloRefrescoMapa(argumentos)).toBe(false)
  })
})

describe('U10 guardas de lectura manual', () => {
  it('bloquea mientras hay lectura en curso y permite disparar si no la hay', () => {
    expect(puedeDispararRefrescoMapa(true)).toBe(false)
    expect(puedeDispararRefrescoMapa(false)).toBe(true)
  })
})

describe('U11 etiquetas y chips', () => {
  it('las cuatro etiquetas de color son las del prototipo y no affirmative sobre solicitudes', () => {
    expect(ETIQUETAS_COLOR).toEqual({
      verde: 'Disponible',
      azul: 'En servicio',
      gris: 'Fuera de servicio',
      ambar: 'Ubicacion desactualizada',
    })
    for (const etiqueta of Object.values(ETIQUETAS_COLOR)) expect(etiqueta).not.toMatch(/listo|recibir solicitudes/i)
  })

  it('los chips son todos mas los cuatro colores, en ese orden y con su punto', () => {
    expect(CATEGORIAS_FILTRO.map((chip) => chip.clave)).toEqual(['todos', 'verde', 'azul', 'gris', 'ambar'])
    expect(CATEGORIAS_FILTRO.map((chip) => chip.etiqueta)).toEqual([
      'Todos',
      'Disponibles',
      'En servicio',
      'Fuera de servicio',
      'Desactualizados',
    ])
    expect(CATEGORIAS_FILTRO[0].color).toBeNull()
    for (const chip of CATEGORIAS_FILTRO.slice(1)) {
      expect(chip.color).toBe(chip.clave as ColorMarcador)
      expect(ETIQUETAS_COLOR[chip.color as ColorMarcador].length).toBeGreaterThan(0)
    }
  })

  it('cada chip tiene etiqueta visible aunque el color no tenga texto propio', () => {
    for (const chip of CATEGORIAS_FILTRO) expect(chip.etiqueta.trim().length).toBeGreaterThan(0)
  })
})