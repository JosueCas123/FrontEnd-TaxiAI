import type { MutationFilters } from '@tanstack/react-query'

export const CLAVE_ESCRITURA_CONDUCTOR = ['transicion-conductor']
export interface OrigenEscrituraConductor { fila: { id: string }; sesion: number }

export function filtroEscrituraConductor(sesion: number, id?: string): MutationFilters {
  return {
    mutationKey: CLAVE_ESCRITURA_CONDUCTOR,
    status: 'pending',
    predicate: (mutation) => {
      const origen = mutation.state.variables as OrigenEscrituraConductor | undefined
      return origen?.sesion === sesion && (id === undefined || origen.fila.id === id)
    },
  }
}
