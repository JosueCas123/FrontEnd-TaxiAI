import { useEffect, useState } from 'react'

// Alineado con el token `lg` de Tailwind (64rem = 1024px, min-width).
export const MOBILE_BREAKPOINT = 1024
export const CONSULTA_MOVIL = `(width < ${MOBILE_BREAKPOINT}px)`

// Devuelve null donde no exista matchMedia para no romper entornos sin DOM.
export function consultaMovil(): MediaQueryList | null {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return null
  return window.matchMedia(CONSULTA_MOVIL)
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean>(() => consultaMovil()?.matches ?? false)

  useEffect(() => {
    const mql = consultaMovil()
    if (!mql) return
    setIsMobile(mql.matches)
    const escuchar = () => setIsMobile(mql.matches)
    mql.addEventListener('change', escuchar)
    return () => mql.removeEventListener('change', escuchar)
  }, [])

  return isMobile
}