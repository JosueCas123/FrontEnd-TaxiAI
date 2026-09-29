import { afterEach, describe, expect, it, vi } from 'vitest'
import { CONSULTA_MOVIL, MOBILE_BREAKPOINT, consultaMovil } from './use-mobile'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  vi.resetAllMocks()
})

function stubMatchMedia(matches: boolean) {
  const mql = {
    matches,
    media: CONSULTA_MOVIL,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }
  const matchMedia = vi.fn(() => mql)
  vi.stubGlobal('window', { matchMedia })
  return { matchMedia, mql }
}

describe('detector movil', () => {
  it('usa el mismo breakpoint que el token lg de Tailwind (64rem = 1024px)', () => {
    expect(MOBILE_BREAKPOINT).toBe(1024)
    expect(CONSULTA_MOVIL).toBe('(width < 1024px)')
  })

  it.each([true, false])('consulta la media con la consulta alineada (%s)', (matches) => {
    const { matchMedia } = stubMatchMedia(matches)
    expect(consultaMovil()?.matches).toBe(matches)
    expect(matchMedia).toHaveBeenCalledWith('(width < 1024px)')
  })

  it('devuelve null sin matchMedia en lugar de lanzar', () => {
    vi.stubGlobal('window', {})
    expect(consultaMovil()).toBeNull()
  })

  it('devuelve null en entornos sin window', () => {
    vi.stubGlobal('window', undefined)
    expect(consultaMovil()).toBeNull()
  })
})
