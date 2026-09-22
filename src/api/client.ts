import { getToken } from './token'

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
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401) {
    window.dispatchEvent(new CustomEvent('auth:unauthorized'))
    throw new ApiError(401, 'Sesión expirada o no autorizada')
  }

  if (!res.ok) {
    let message = `Error ${res.status}`
    try {
      const body = (await res.json()) as unknown
      if (typeof body === 'object' && body !== null) {
        const b = body as Record<string, unknown>
        if (typeof b.message === 'string') message = b.message
        else if (typeof b.error === 'string') message = b.error
      }
    } catch {
      // cuerpo no JSON: se mantiene el mensaje genérico
    }
    throw new ApiError(res.status, message)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
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