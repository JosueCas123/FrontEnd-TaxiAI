import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, apiFetch } from './client'
import { getSessionId, setToken } from './token'

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

  it.each([
    ['{"error":{"message":"Backend message"}}', 'Backend message'],
    ['<html>Unauthorized</html>', 'Sesi\u00f3n expirada o no autorizada'],
    ['null', 'Sesi\u00f3n expirada o no autorizada'],
    ['{"error":{"message":7}}', 'Sesi\u00f3n expirada o no autorizada'],
    ['{"message":" "}', 'Sesi\u00f3n expirada o no autorizada'],
  ])(
    'M06 / U01-U02 401 body %s', async (body, message) => {
      const response = new Response(body, { status: 401 })
      const json = vi.spyOn(response, 'json')
      fetchMock.mockResolvedValue(response)
      const error = await apiFetch('/test').catch((reason: unknown) => reason)
      expect(error).toBeInstanceOf(ApiError)
      expect(error).toMatchObject({ status: 401, message })
      expect(dispatchEvent).toHaveBeenCalledExactlyOnceWith(expect.any(CustomEvent))
      expect(dispatchEvent.mock.calls[0][0].type).toBe('auth:unauthorized')
      expect(dispatchEvent.mock.calls[0][0].detail).toEqual({ sessionId: null })
      expect(json).toHaveBeenCalledOnce()
    },
  )
})

it('U03 403 preserves permission error without notifying', async () => {
  fetchMock.mockResolvedValue(new Response('{"error":{"message":"Sin permiso"}}', { status: 403 }))
  await expect(apiFetch('/test')).rejects.toMatchObject({ status: 403, message: 'Sin permiso' })
  expect(dispatchEvent).not.toHaveBeenCalled()
})

it.each(['different', 'same', 'public'])('U05 late 401 origin: %s', async (variant) => {
  setToken('same')
  const origin = variant === 'public' ? null : getSessionId()
  let resolve!: (response: Response) => void
  fetchMock.mockReturnValue(new Promise<Response>(r => { resolve = r }))
  const pending = apiFetch(variant === 'public' ? '/api/auth/admin/login' : '/test').catch(e => e)
  setToken(null)
  setToken(variant === 'different' ? 'different' : 'same')
  expect(getSessionId()).not.toBe(origin)
  resolve(new Response('{"message":"Anterior"}', { status: 401 }))
  expect(await pending).toMatchObject({ status: 401, message: 'Anterior' })
  expect(dispatchEvent).toHaveBeenCalledOnce()
  expect(dispatchEvent.mock.calls[0][0].detail).toEqual({ sessionId: origin })
  if (variant === 'public') expect(new Headers(fetchMock.mock.calls[0][1]?.headers).has('Authorization')).toBe(false)
})

it('P2 rejects late success even with the same token', async () => {
  setToken('same')
  let resolve!: (response: Response) => void
  fetchMock.mockReturnValue(new Promise<Response>(r => { resolve = r }))
  const pending = apiFetch('/test').catch(e => e)
  setToken(null)
  setToken('same')
  resolve(new Response('{"private":"A"}'))
  expect(await pending).toMatchObject({ name: 'AbortError' })
  expect(dispatchEvent).not.toHaveBeenCalled()
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
