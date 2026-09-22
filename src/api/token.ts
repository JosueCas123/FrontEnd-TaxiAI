let token: string | null = null

export function setToken(nuevo: string | null) {
  token = nuevo
}

export function getToken() {
  return token
}