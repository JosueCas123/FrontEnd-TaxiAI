import { afterEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { ApiError, http } from '../api/client'
import { getSessionId, setToken } from '../api/token'
import type { Configuracion } from '../api/types'
import {
  CLAVE_CONFIGURACION,
  FALLBACK_LATERAL,
  FALLBACK_HEADER,
  esEnlaceActivo,
  esNombreValido,
  informacionErrorConfiguracion,
  inicialEmpresa,
  nombreEmpresaParaMostrar,
  nombresEmpresa,
  puedeDispararReintento,
  retryConfiguracion,
} from './configuracion'

const CONFIG_VALIDA: Configuracion = {
  id: 1,
  nombreEmpresa: 'Radio Taxi Sur Rio Abajo',
  radioMaximoBusquedaKm: 5,
  telefonoCentroAtencion: '+59100000000',
  actualizadoEn: '2026-09-28T12:00:00.000Z',
}

const NOMBRE_100 = `Radio Taxi Sur Rio Abajo ${'Santa Cruz '.repeat(7)}`.slice(0, 100)

afterEach(() => {
  setToken(null)
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.resetAllMocks()
})

describe('esNombreValido', () => {
  it.each([
    ['TaxiSur - Pruebas', true],
    ['Radio Taxi Sur Rio Abajo', true],
    ['', false],
    ['   ', false],
    ['\t\n', false],
    [null, false],
    [undefined, false],
  ])('%j', (nombre, esperado) => {
    expect(esNombreValido(nombre as string | null | undefined)).toBe(esperado)
  })
})

describe('nombreEmpresaParaMostrar', () => {
  it('recorta espacios sobrantes sin alterar el valor de cache', () => {
    expect(nombreEmpresaParaMostrar('  Conductor Central  ')).toBe('Conductor Central')
    expect(nombreEmpresaParaMostrar(' TaxiSur - Pruebas ')).toBe('TaxiSur - Pruebas')
    expect(nombreEmpresaParaMostrar('')).toBeNull()
    expect(nombreEmpresaParaMostrar(' ')).toBeNull()
    expect(nombreEmpresaParaMostrar(null)).toBeNull()
  })

  it('devuelve el texto tal cual, sin interpretar marcas como HTML', () => {
    const conMarcas = '<b>Radio</b> <script>alert(1)</script> & Cia'
    expect(nombreEmpresaParaMostrar(conMarcas)).toBe(conMarcas)
  })
})

describe('nombresEmpresa', () => {
  it('sin nombre previo muestra los fallbacks diferenciados de P1', () => {
    expect(nombresEmpresa({ nombreServidor: undefined, ultimoNombreValido: null })).toEqual({
      lateral: FALLBACK_LATERAL,
      header: FALLBACK_HEADER,
    })
    expect(FALLBACK_LATERAL).toBe('TaxiSurRioAbajo')
    expect(FALLBACK_HEADER).toBe('Panel administrativo')
  })

  it('reproduce TaxiSur - Pruebas tal cual, sin sustituirlo por el marcador', () => {
    expect(nombresEmpresa({ nombreServidor: 'TaxiSur - Pruebas', ultimoNombreValido: null })).toEqual({
      lateral: 'TaxiSur - Pruebas',
      header: 'TaxiSur - Pruebas',
    })
  })

  it('muestra el mismo nombre recortado en lateral y header', () => {
    expect(nombresEmpresa({ nombreServidor: '  Radio Taxi Sur  ', ultimoNombreValido: null })).toEqual({
      lateral: 'Radio Taxi Sur',
      header: 'Radio Taxi Sur',
    })
  })

  it.each(['', '   ', '\t\n'])(
    'nombre invalido %j con nombre previo: conserva el previo en ambos lugares',
    (invalido) => {
      expect(nombresEmpresa({ nombreServidor: invalido, ultimoNombreValido: 'Radio Central' })).toEqual({
        lateral: 'Radio Central',
        header: 'Radio Central',
      })
    },
  )

  it.each(['', '   '])('nombre invalido %j sin nombre previo: fallbacks diferenciados', (invalido) => {
    expect(nombresEmpresa({ nombreServidor: invalido, ultimoNombreValido: null })).toEqual({
      lateral: FALLBACK_LATERAL,
      header: FALLBACK_HEADER,
    })
  })

  it('el nombre vigente del servidor tiene prioridad sobre el ultimo nombre de la sesion', () => {
    expect(nombresEmpresa({ nombreServidor: 'Radio Nuevo', ultimoNombreValido: 'Radio Anterior' })).toEqual({
      lateral: 'Radio Nuevo',
      header: 'Radio Nuevo',
    })
  })

  it('acepta un nombre de 100 caracteres sin recortarlo ni deformarlo', () => {
    expect(NOMBRE_100).toHaveLength(100)
    const resultado = nombresEmpresa({ nombreServidor: NOMBRE_100, ultimoNombreValido: null })
    expect(resultado.lateral).toBe(NOMBRE_100)
    expect(resultado.header).toBe(NOMBRE_100)
  })
})

describe('inicialEmpresa', () => {
  it.each([
    ['Radio Taxi Sur', 'R'],
    ['  taxi sur  ', 'T'],
    ['4 Vientos', '4'],
    ['Ñandú S.A.', 'Ñ'],
    ['Ángel', 'Á'],
  ])('deriva la inicial de %j', (nombre, esperado) => {
    expect(inicialEmpresa(nombre)).toBe(esperado)
  })

  it.each(['', '   ', '\t\n', '—', '!!!', null, undefined])(
    'no inventa inicial para %j',
    (nombre) => {
      expect(inicialEmpresa(nombre as string | null | undefined)).toBeNull()
    },
  )
})

describe('puedeDispararReintento', () => {
  it('bloquea mientras hay peticion en curso y permite reintentar si no la hay', () => {
    expect(puedeDispararReintento(true)).toBe(false)
    expect(puedeDispararReintento(false)).toBe(true)
  })
})

describe('retryConfiguracion', () => {
  it.each([
    ['red', new TypeError('Failed to fetch')],
    ['500', new ApiError(500, 'Error 500')],
    ['502', new ApiError(502, 'Error 502')],
    ['503', new ApiError(503, 'Error 503')],
  ])('permite como maximo un reintento para %s', (_t, error) => {
    expect(retryConfiguracion(0, error)).toBe(true)
    expect(retryConfiguracion(1, error)).toBe(false)
    expect(retryConfiguracion(2, error)).toBe(false)
  })

  it.each([
    ['401', new ApiError(401, 'Sesion expirada')],
    ['403', new ApiError(403, 'Sin permiso')],
    ['409', new ApiError(409, 'Configuracion eliminada')],
    ['404', new ApiError(404, 'No encontrado')],
    ['400', new ApiError(400, 'Entrada invalida')],
  ])('no reintenta %s', (_t, error) => {
    expect(retryConfiguracion(0, error)).toBe(false)
  })

  it('no reintenta errores de parseo/contrato ni abortos', () => {
    expect(retryConfiguracion(0, new SyntaxError('JSON invalido'))).toBe(false)
    expect(retryConfiguracion(0, new DOMException('Solicitud cancelada', 'AbortError'))).toBe(false)
    expect(retryConfiguracion(0, new Error('Otro fallo'))).toBe(false)
  })
})

describe('informacionErrorConfiguracion', () => {
  it('403 muestra permiso denegado sin boton recuperable', () => {
    const info = informacionErrorConfiguracion(new ApiError(403, 'Sin permiso'))
    expect(info.mensaje).toContain('No tienes permiso')
    expect(info.recuperable).toBe(false)
  })

  it('409 muestra el mensaje del servidor sin boton recuperable', () => {
    const info = informacionErrorConfiguracion(new ApiError(409, 'Configuracion eliminada'))
    expect(info.mensaje).toBe('Configuracion eliminada')
    expect(info.recuperable).toBe(false)
  })

  it.each([new ApiError(500, 'Error 500'), new TypeError('Failed to fetch')])(
    'red/5xx es recuperable',
    (error) => {
      const info = informacionErrorConfiguracion(error)
      expect(info.mensaje.length).toBeGreaterThan(0)
      expect(info.recuperable).toBe(true)
    },
  )

  it('404 explica que la configuracion aun no fue cargada y no ofrece recuperacion', () => {
    const info = informacionErrorConfiguracion(new ApiError(404, 'Configuracion no encontrada'))
    expect(info.mensaje).toContain('aun no fue cargada')
    expect(info.recuperable).toBe(false)
  })

  it.each([
    new ApiError(400, 'Entrada invalida'),
    new SyntaxError('JSON invalido'),
    new DOMException('cancelada', 'AbortError'),
  ])('otros fallos no recuperables usan un aviso seguro', (error) => {
    const info = informacionErrorConfiguracion(error)
    expect(info.mensaje.length).toBeGreaterThan(0)
    expect(info.recuperable).toBe(false)
  })
})

describe('esEnlaceActivo', () => {
  it.each([
    ['/', '/', true, true],
    ['/conductores', '/', true, false],
    ['/conductores', '/conductores', false, true],
    ['/conductores/:id', '/conductores', false, true],
    ['/conductores/123', '/conductores', false, true],
    ['/conductoresA', '/conductores', false, false],
    ['/conductoresX', '/conductores/', false, false],
    ['/mapa', '/mapa', false, true],
    ['/mapa/trazado', '/mapa', false, true],
    ['/mapas', '/mapa', false, false],
  ])('pathname=%s destino=%s end=%s -> %s', (pathname, destino, end, esperado) => {
    expect(esEnlaceActivo(pathname, destino, end)).toBe(esperado)
  })
})

describe('retry local integrado con QueryClient', () => {
  function prepararFetch(respuestas: (() => Promise<Response> | Response)[]) {
    let llamadas = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        const respuesta = respuestas[Math.min(llamadas, respuestas.length - 1)]
        llamadas += 1
        return respuesta()
      }),
    )
    return () => llamadas
  }

  async function consultar() {
    const client = new QueryClient()
    const data = await client.fetchQuery<Configuracion>({
      queryKey: CLAVE_CONFIGURACION,
      queryFn: () => http.get<Configuracion>('/api/configuracion'),
      retry: retryConfiguracion,
      retryDelay: () => 0,
    })
    return { data, client }
  }

  it('red intermitente: un reintento automatico y exito al segundo intento', async () => {
    const llamadas = prepararFetch([
      () => {
        throw new TypeError('Failed to fetch')
      },
      () => new Response(JSON.stringify(CONFIG_VALIDA)),
    ])
    const { data, client } = await consultar()
    expect(llamadas()).toBe(2)
    expect(data).toEqual(CONFIG_VALIDA)
    expect(client.getQueryData<Configuracion>(CLAVE_CONFIGURACION)).toEqual(CONFIG_VALIDA)
  })

  it('5xx intermitente: un reintento automatico con el DTO de cinco campos en cache', async () => {
    const llamadas = prepararFetch([
      () => new Response(JSON.stringify({ error: { message: 'Error 500' } }), { status: 500 }),
      () => new Response(JSON.stringify(CONFIG_VALIDA)),
    ])
    const { data, client } = await consultar()
    expect(llamadas()).toBe(2)
    expect(data).toEqual(CONFIG_VALIDA)
    expect(client.getQueryData<Configuracion>(CLAVE_CONFIGURACION)).toMatchObject(CONFIG_VALIDA)
  })

  it.each([401, 403, 409])('HTTP %s: cero reintentos automaticos', async (status) => {
    vi.stubGlobal('window', { dispatchEvent: vi.fn() })
    const llamadas = prepararFetch([
      () => new Response(JSON.stringify({ message: `Error ${status}` }), { status }),
    ])
    const client = new QueryClient()
    await expect(
      client.fetchQuery<Configuracion>({
        queryKey: CLAVE_CONFIGURACION,
        queryFn: () => http.get<Configuracion>('/api/configuracion'),
        retry: retryConfiguracion,
        retryDelay: () => 0,
      }),
    ).rejects.toBeInstanceOf(ApiError)
    expect(llamadas()).toBe(1)
  })

  it('el cache conserva el nombre original del servidor aunque se muestre recortado', async () => {
    const bruto = '  Conductor Central  '
    prepararFetch([() => new Response(JSON.stringify({ ...CONFIG_VALIDA, nombreEmpresa: bruto }))])
    const { client } = await consultar()
    const enCache = client.getQueryData<Configuracion>(CLAVE_CONFIGURACION)
    expect(enCache?.nombreEmpresa).toBe(bruto)
    expect(nombreEmpresaParaMostrar(enCache?.nombreEmpresa)).toBe('Conductor Central')
  })
})

describe('contrato y cache compartida', () => {
  function responderJson(cuerpo: unknown, status = 200) {
    return () => Promise.resolve(new Response(JSON.stringify(cuerpo), { status }))
  }

  it('Q02 guarda los cinco campos, incluido telefono null, y respeta TaxiSur - Pruebas', async () => {
    const backend: Configuracion = {
      id: 1,
      nombreEmpresa: 'TaxiSur - Pruebas',
      radioMaximoBusquedaKm: 5,
      telefonoCentroAtencion: null,
      actualizadoEn: '2026-09-28T12:00:00.000Z',
    }
    vi.stubGlobal('fetch', vi.fn(responderJson(backend)))
    const client = new QueryClient()
    const data = await client.fetchQuery<Configuracion>({
      queryKey: CLAVE_CONFIGURACION,
      queryFn: () => http.get<Configuracion>('/api/configuracion'),
    })
    expect(data).toEqual(backend)
    expect(Object.keys(data).sort()).toEqual([
      'actualizadoEn',
      'id',
      'nombreEmpresa',
      'radioMaximoBusquedaKm',
      'telefonoCentroAtencion',
    ])
    const enCache = client.getQueryData<Configuracion>(CLAVE_CONFIGURACION)
    expect(nombresEmpresa({ nombreServidor: enCache?.nombreEmpresa, ultimoNombreValido: null })).toEqual({
      lateral: 'TaxiSur - Pruebas',
      header: 'TaxiSur - Pruebas',
    })
  })

  it('Q07 el DTO con nombre en blanco queda intacto en cache y la vista usa los fallbacks', async () => {
    const bruto = '   '
    vi.stubGlobal(
      'fetch',
      vi.fn(responderJson({ ...CONFIG_VALIDA, nombreEmpresa: bruto })),
    )
    const client = new QueryClient()
    await client.fetchQuery<Configuracion>({
      queryKey: CLAVE_CONFIGURACION,
      queryFn: () => http.get<Configuracion>('/api/configuracion'),
    })
    const enCache = client.getQueryData<Configuracion>(CLAVE_CONFIGURACION)
    expect(enCache?.nombreEmpresa).toBe(bruto)
    expect(nombresEmpresa({ nombreServidor: enCache?.nombreEmpresa, ultimoNombreValido: null })).toEqual({
      lateral: FALLBACK_LATERAL,
      header: FALLBACK_HEADER,
    })
  })

  it('Q07 el cache de un nombre de 100 caracteres conserva el valor del servidor', async () => {
    expect(NOMBRE_100).toHaveLength(100)
    vi.stubGlobal('fetch', vi.fn(responderJson({ ...CONFIG_VALIDA, nombreEmpresa: NOMBRE_100 })))
    const client = new QueryClient()
    await client.fetchQuery<Configuracion>({
      queryKey: CLAVE_CONFIGURACION,
      queryFn: () => http.get<Configuracion>('/api/configuracion'),
    })
    expect(client.getQueryData<Configuracion>(CLAVE_CONFIGURACION)?.nombreEmpresa).toBe(NOMBRE_100)
  })

  it('Q03 dos consultas concurrentes con la misma key producen una sola peticion', async () => {
    const resolvers: ((r: Response) => void)[] = []
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => { resolvers.push(resolve) }))
    vi.stubGlobal('fetch', fetchMock)
    const client = new QueryClient()
    const opciones = {
      queryKey: CLAVE_CONFIGURACION,
      queryFn: () => http.get<Configuracion>('/api/configuracion'),
    }
    const primera = client.fetchQuery<Configuracion>(opciones)
    const segunda = client.fetchQuery<Configuracion>(opciones)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    resolvers[0](new Response(JSON.stringify(CONFIG_VALIDA)))
    expect(await primera).toEqual(CONFIG_VALIDA)
    expect(await segunda).toEqual(CONFIG_VALIDA)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('Q03 una invalidacion controlada actualiza los observadores sin recrear la consulta', async () => {
    let respuesta = CONFIG_VALIDA
    const fetchMock = vi.fn(() => Promise.resolve(new Response(JSON.stringify(respuesta))))
    vi.stubGlobal('fetch', fetchMock)
    const client = new QueryClient()
    const opciones = {
      queryKey: CLAVE_CONFIGURACION,
      queryFn: () => http.get<Configuracion>('/api/configuracion'),
    }
    const lateral = new QueryObserver(client, opciones)
    const header = new QueryObserver(client, opciones)
    const cambiosLateral = vi.fn()
    const cambiosHeader = vi.fn()
    lateral.subscribe(cambiosLateral)
    header.subscribe(cambiosHeader)

    await Promise.all([lateral.refetch(), header.refetch()])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(lateral.getCurrentResult().data).toEqual(CONFIG_VALIDA)
    expect(header.getCurrentResult().data).toEqual(CONFIG_VALIDA)

    respuesta = { ...CONFIG_VALIDA, nombreEmpresa: 'Radio Actualizado' }
    await client.invalidateQueries({ queryKey: CLAVE_CONFIGURACION })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(cambiosLateral).toHaveBeenCalled()
    expect(cambiosHeader).toHaveBeenCalled()
    expect(lateral.getCurrentResult().data?.nombreEmpresa).toBe('Radio Actualizado')
    expect(header.getCurrentResult().data?.nombreEmpresa).toBe('Radio Actualizado')

    lateral.destroy()
    header.destroy()
  })
})

describe('avisos por estado de error', () => {
  function fetchQueFalla(cuerpo: string, status: number) {
    const fetchMock = vi.fn(() => Promise.resolve(new Response(cuerpo, { status })))
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('window', { dispatchEvent: vi.fn() })
    return fetchMock
  }

  async function errorDeLaConsulta() {
    const client = new QueryClient()
    return client
      .fetchQuery<Configuracion>({
        queryKey: CLAVE_CONFIGURACION,
        queryFn: () => http.get<Configuracion>('/api/configuracion'),
        retry: retryConfiguracion,
        retryDelay: () => 0,
      })
      .catch((error: unknown) => error)
  }

  it('Q05 409 CONFIGURATION_DELETED muestra el mensaje y no ofrece recuperacion', async () => {
    const fetchMock = fetchQueFalla(
      JSON.stringify({ error: { code: 'CONFIGURATION_DELETED', message: 'Configuracion eliminada' } }),
      409,
    )
    const error = await errorDeLaConsulta()
    expect(error).toBeInstanceOf(ApiError)
    expect(informacionErrorConfiguracion(error)).toEqual({
      mensaje: 'Configuracion eliminada',
      recuperable: false,
    })
    expect(retryConfiguracion(0, error)).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('Q05 403 no cierra sesion ni ofrece recuperacion', async () => {
    const fetchMock = fetchQueFalla(JSON.stringify({ error: { message: 'Sin permiso' } }), 403)
    const dispatchEvent = vi.fn()
    vi.stubGlobal('window', { dispatchEvent })
    setToken('token-vigente')
    const error = await errorDeLaConsulta()
    expect(informacionErrorConfiguracion(error).recuperable).toBe(false)
    expect(informacionErrorConfiguracion(error).mensaje).toContain('No tienes permiso')
    expect(dispatchEvent).not.toHaveBeenCalled()
    expect(getSessionId()).not.toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('Q04 500 no JSON tras el unico reintento deja aviso recuperable', async () => {
    const fetchMock = fetchQueFalla('<html>Unavailable</html>', 500)
    const error = await errorDeLaConsulta()
    expect(error).toBeInstanceOf(ApiError)
    expect(informacionErrorConfiguracion(error).recuperable).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('Q04 red sin respuesta tras el unico reintento deja aviso recuperable', async () => {
    const fetchMock = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')))
    vi.stubGlobal('fetch', fetchMock)
    const error = await errorDeLaConsulta()
    expect(error).toBeInstanceOf(TypeError)
    expect(informacionErrorConfiguracion(error).recuperable).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('401 de la sesion vigente notifica el cierre de sesion y no ofrece recuperacion', async () => {
    const fetchMock = fetchQueFalla('', 401)
    const dispatchEvent = vi.fn()
    vi.stubGlobal('window', { dispatchEvent })
    setToken('token-vigente')
    const idVigente = getSessionId()
    const error = await errorDeLaConsulta()
    expect(error).toBeInstanceOf(ApiError)
    expect(informacionErrorConfiguracion(error).recuperable).toBe(false)
    expect(dispatchEvent).toHaveBeenCalledOnce()
    expect((dispatchEvent.mock.calls[0][0] as CustomEvent<{ sessionId: number | null }>).detail).toEqual({
      sessionId: idVigente,
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('pulsaciones repetidas de Reintentar', () => {
  it('no generan una segunda peticion mientras hay una en curso', async () => {
    const resolvers: ((r: Response) => void)[] = []
    const fetchMock = vi.fn(() => new Promise<Response>((resolve) => { resolvers.push(resolve) }))
    vi.stubGlobal('fetch', fetchMock)
    const client = new QueryClient()
    const opciones = {
      queryKey: CLAVE_CONFIGURACION,
      queryFn: () => http.get<Configuracion>('/api/configuracion'),
      retry: false,
    }
    const cargaInicial = client.fetchQuery<Configuracion>(opciones)
    const query = client.getQueryCache().find({ queryKey: CLAVE_CONFIGURACION })
    expect(query).toBeDefined()
    // Dos activaciones de Reintentar mientras la peticion sigue en curso.
    const primero = query!.fetch()
    const segundo = query!.fetch()
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(puedeDispararReintento(true)).toBe(false)
    resolvers[0](new Response(JSON.stringify(CONFIG_VALIDA)))
    expect(await cargaInicial).toEqual(CONFIG_VALIDA)
    expect(await primero).toEqual(CONFIG_VALIDA)
    expect(await segundo).toEqual(CONFIG_VALIDA)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})

describe('aislamiento entre sesiones', () => {
    function fetchEnCola() {
      const resolvers: ((r: Response) => void)[] = []
      const fetchMock = vi.fn(
        (..._args: Parameters<typeof fetch>) =>
          new Promise<Response>((resolve) => { resolvers.push(resolve) }),
      )
      vi.stubGlobal('fetch', fetchMock)
      return { fetchMock, resolvers }
    }

  const opciones = {
    queryKey: CLAVE_CONFIGURACION,
    queryFn: () => http.get<Configuracion>('/api/configuracion'),
    retry: false,
  }

  it('A03 una respuesta 200 tardia de A no alimenta la cache de la sesion B', async () => {
    const { fetchMock, resolvers } = fetchEnCola()
    const dispatchEvent = vi.fn()
    vi.stubGlobal('window', { dispatchEvent })

    setToken('token-a')
    const clientA = new QueryClient()
    const pendienteA = clientA.fetchQuery<Configuracion>(opciones).catch((e: unknown) => e)

    setToken(null)
    setToken('token-b')
    const clientB = new QueryClient()
    const pendienteB = clientB.fetchQuery<Configuracion>(opciones)

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(new Headers(fetchMock.mock.calls[0][1]?.headers).get('Authorization')).toBe('Bearer token-a')
    expect(new Headers(fetchMock.mock.calls[1][1]?.headers).get('Authorization')).toBe('Bearer token-b')

    const configB: Configuracion = { ...CONFIG_VALIDA, nombreEmpresa: 'Empresa B' }
    resolvers[1](new Response(JSON.stringify(configB)))
    expect(await pendienteB).toEqual(configB)

    const configA: Configuracion = { ...CONFIG_VALIDA, nombreEmpresa: 'Empresa A' }
    resolvers[0](new Response(JSON.stringify(configA)))
    const errorA = await pendienteA
    expect(errorA).toMatchObject({ name: 'AbortError' })
    expect(clientA.getQueryData(CLAVE_CONFIGURACION)).toBeUndefined()
    expect(clientB.getQueryData<Configuracion>(CLAVE_CONFIGURACION)).toEqual(configB)
    expect(dispatchEvent).not.toHaveBeenCalled()
  })

  it('A03 un 401 tardio de A no coincide con la sesion B vigente', async () => {
    const { fetchMock, resolvers } = fetchEnCola()
    const dispatchEvent = vi.fn()
    vi.stubGlobal('window', { dispatchEvent })

    setToken('token-a')
    const idA = getSessionId()
    const clientA = new QueryClient()
    const pendienteA = clientA.fetchQuery<Configuracion>(opciones).catch((e: unknown) => e)

    setToken(null)
    setToken('token-b')
    const idB = getSessionId()
    expect(idB).not.toBe(idA)

    resolvers[0](new Response(JSON.stringify({ error: { message: 'Sesion A expirada' } }), { status: 401 }))
    const errorA = await pendienteA
    expect(errorA).toBeInstanceOf(ApiError)
    expect(dispatchEvent).toHaveBeenCalledOnce()
    const detalle = (dispatchEvent.mock.calls[0][0] as CustomEvent<{ sessionId: number | null }>).detail
    // El evento lleva la identidad de A: AuthContext lo descarta y B sigue viva.
    expect(detalle).toEqual({ sessionId: idA })
    expect(detalle.sessionId).not.toBe(getSessionId())
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
