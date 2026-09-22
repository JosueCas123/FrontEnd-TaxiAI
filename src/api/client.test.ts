import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiFetch } from './client'
import { setToken } from './token'

const fetchMock = vi.fn<typeof fetch>()
const dispatchEvent = vi.fn()

beforeEach(() => {
  setToken(null)
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('window', { dispatchEvent })
})

afterEach(() => {
  setToken(null)
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.resetAllMocks()
})

describe('HTTP errors', () => {
  it.each([
    ['M01 nested', 400, { error: { code: 'VALIDATION_ERROR', message: 'Entrada invalida' } }, 'Entrada invalida'],
    ['M02 root', 409, { message: 'Mensaje raiz' }, 'Mensaje raiz'],
    ['M03 string', 500, { error: 'Error textual' }, 'Error textual'],
    ['M04 nested precedence', 400, { error: { message: 'Anidado' }, message: 'Raiz' }, 'Anidado'],
    ['M04 invalid nested', 400, { error: { message: 7 }, message: 'Raiz' }, 'Raiz'],
    ['M04 root before string', 400, { error: 'Texto', message: 'Raiz' }, 'Raiz'],
    ['M05 null', 400, null, 'Error 400'],
    ['M05 array', 400, [], 'Error 400'],
    ['M05 invalid message', 400, { error: { message: 7 } }, 'Error 400'],
    ['M05 nested array', 400, { error: [] }, 'Error 400'],
    ['M05 invalid root', 400, { message: 7, error: 'Texto' }, 'Texto'],
  ])('%s', async (_id, status, body, message) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(body), { status }))
    const error = await apiFetch('/test').catch((reason: unknown) => reason)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status, message })
    expect(dispatchEvent).not.toHaveBeenCalled()
  })

  it('M05 non-JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Unavailable</html>', { status: 502 }))
    await expect(apiFetch('/test')).rejects.toMatchObject({ status: 502, message: 'Error 502' })
    expect(dispatchEvent).not.toHaveBeenCalled()
  })

  it.each(['{"error":{"message":"Backend message"}}', '<html>Unauthorized</html>'])(
    'M06 401 body %s', async (body) => {
      const response = new Response(body, { status: 401 })
      const json = vi.spyOn(response, 'json')
      fetchMock.mockResolvedValue(response)
      const error = await apiFetch('/test').catch((reason: unknown) => reason)
      expect(error).toBeInstanceOf(ApiError)
      expect(error).toMatchObject({ status: 401, message: 'Sesi\u00f3n expirada o no autorizada' })
      expect(dispatchEvent).toHaveBeenCalledExactlyOnceWith(expect.any(CustomEvent))
      expect(dispatchEvent.mock.calls[0][0].type).toBe('auth:unauthorized')
      expect(json).not.toHaveBeenCalled()
    },
  )
})

it('M07 204 never parses JSON', async () => {
  const response = new Response(null, { status: 204 })
  const json = vi.spyOn(response, 'json').mockImplementation(() => { throw new Error('Must not parse') })
  fetchMock.mockResolvedValue(response)
  await expect(apiFetch('/test')).resolves.toBeUndefined()
  expect(json).not.toHaveBeenCalled()
  expect(dispatchEvent).not.toHaveBeenCalled()
})

it.each(['test-token', null])('M08 Bearer with token %s', async (token) => {
  setToken(token)
  fetchMock.mockResolvedValue(new Response('{}'))
  await apiFetch('/test')
  expect(fetchMock).toHaveBeenCalledTimes(1)
  const headers = new Headers(fetchMock.mock.calls[0][1]?.headers)
  expect(headers.get('Authorization')).toBe(token ? `Bearer ${token}` : null)
  expect(headers.get('Content-Type')).toBe('application/json')
})

it.each([{ value: 1 }, []])('M09 JSON success %j', async (body) => {
  fetchMock.mockResolvedValue(new Response(JSON.stringify(body)))
  await expect(apiFetch('/test')).resolves.toEqual(body)
  expect(dispatchEvent).not.toHaveBeenCalled()
})

it('M11 network rejection remains a rejection', async () => {
  const error = new TypeError('Simulated network failure')
  fetchMock.mockRejectedValue(error)
  await expect(apiFetch('/test')).rejects.toBe(error)
  expect(dispatchEvent).not.toHaveBeenCalled()
})
