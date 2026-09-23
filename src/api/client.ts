import { getSessionId, getToken } from './token'

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ''

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')
  const isLogin = path === '/api/auth/admin/login'
  const sessionId = isLogin ? null : getSessionId()
  const token = isLogin ? null : getToken()
  if (isLogin) headers.delete('Authorization')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    let message = res.status === 401 ? 'Sesión expirada o no autorizada' : `Error ${res.status}`
    try {
      const body = (await res.json()) as unknown
      if (typeof body === 'object' && body !== null && !Array.isArray(body)) {
        const b = body as Record<string, unknown>
        const nested = typeof b.error === 'object' && b.error !== null && !Array.isArray(b.error)
          ? (b.error as Record<string, unknown>).message
          : undefined
        if (typeof nested === 'string' && nested.trim()) message = nested
        else if (typeof b.message === 'string' && b.message.trim()) message = b.message
        else if (typeof b.error === 'string' && b.error.trim()) message = b.error
      }
    } catch {
      // cuerpo no JSON: se mantiene el mensaje genérico
    }
    if (res.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { sessionId } }))
    }
    throw new ApiError(res.status, message)
  }

  const data = res.status === 204 ? undefined : await res.json()
  // A completed transport must not deliver old session data to success callbacks.
  if (sessionId !== null && sessionId !== getSessionId()) {
    throw new DOMException('Solicitud de una sesion anterior', 'AbortError')
  }
  return data as T
}

export const http = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
}
