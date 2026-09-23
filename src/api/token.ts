let token: string | null = null
let revision = 0

export function setToken(nuevo: string | null) {
  revision += 1
  token = nuevo
}

export function getSessionRevision() {
  return revision
}

export function getSessionId() {
  return token === null ? null : revision
}

export function getToken() {
  return token
}
