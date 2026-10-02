import { describe, expect, it } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { CLAVE_ESCRITURA_CONDUCTOR, filtroEscrituraConductor } from './conductorQueries'

describe('coordinacion de escrituras de conductor en Query', () => {
  it('bloquea solo el recurso y sesion de origen hasta terminar la conciliacion', async () => {
    const client = new QueryClient()
    let liberar!: () => void
    const espera = new Promise<void>((resolve) => { liberar = resolve })
    const mutation = client.getMutationCache().build(client, {
      mutationKey: CLAVE_ESCRITURA_CONDUCTOR,
      retry: false,
      mutationFn: async (_origen: { fila: { id: string }; sesion: number }) => espera,
    })
    const resultado = mutation.execute({ fila: { id: 'a' }, sesion: 1 })
    expect(client.isMutating(filtroEscrituraConductor(1, 'a'))).toBe(1)
    expect(client.isMutating(filtroEscrituraConductor(1))).toBe(1)
    expect(client.isMutating(filtroEscrituraConductor(1, 'b'))).toBe(0)
    expect(client.isMutating(filtroEscrituraConductor(2, 'a'))).toBe(0)
    liberar()
    await resultado
    expect(client.isMutating(filtroEscrituraConductor(1, 'a'))).toBe(0)
    client.clear()
  })

  it('no incluye otra clase de mutacion ni mutaciones sin origen', async () => {
    const client = new QueryClient()
    let liberar!: () => void
    const espera = new Promise<void>((resolve) => { liberar = resolve })
    const mutation = client.getMutationCache().build(client, {
      mutationKey: ['otra'], mutationFn: async () => espera,
    })
    const resultado = mutation.execute(undefined)
    expect(client.isMutating(filtroEscrituraConductor(1))).toBe(0)
    liberar()
    await resultado
    client.clear()
  })
})
