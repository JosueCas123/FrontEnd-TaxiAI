import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { onlineManager, useIsFetching, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { http } from '../api/client'
import { getSessionRevision } from '../api/token'
import type { Tarifa } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { CLAVE_TARIFAS, fechaTarifa, hoyTarifa, informacionErrorTarifas, intervaloTarifas, leerTarifas, montoTarifa, puedeRefrescarTarifas, retryTarifas } from '../lib/tarifas'
import { construirPatchTarifa, esquemaTarifa, type PayloadCrearTarifa } from '../lib/tarifasForm'

const CAMPOS = ['Descripcion', 'Monto', 'Vigencia desde', 'Acciones']

export default function Tarifas() {
  const { estaAutenticado } = useAuth()
  const cliente = useQueryClient()
  const [abierto, setAbierto] = useState(false)
  const [base, setBase] = useState<Tarifa | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const [falla, setFalla] = useState<ReturnType<typeof informacionErrorTarifas>>(null)
  const [enviando, setEnviando] = useState(false)
  const [manual, setManual] = useState(false)
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible')
  const envio = useRef(false)
  const lectura = useRef(false)
  const montado = useRef(true)
  const origen = useRef<HTMLButtonElement | null>(null)
  const resultados = useRef<HTMLElement | null>(null)
  const enfocarResultados = useRef(false)
  const lecturas = useIsFetching({ queryKey: CLAVE_TARIFAS })
  const conectado = useSyncExternalStore((notificar) => onlineManager.subscribe(notificar), () => onlineManager.isOnline())
  useEffect(() => {
    montado.current = true
    const actualizar = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', actualizar)
    return () => { montado.current = false; document.removeEventListener('visibilitychange', actualizar) }
  }, [])
  const { data, error, isPending, fetchStatus, refetch } = useQuery({
    queryKey: CLAVE_TARIFAS,
    queryFn: ({ signal }) => leerTarifas(signal),
    enabled: estaAutenticado,
    retry: retryTarifas,
    refetchOnWindowFocus: !abierto,
    refetchOnReconnect: !abierto,
    refetchInterval: (query) => intervaloTarifas(visible, conectado, abierto, query.state.fetchStatus !== 'idle'),
  })
  const { register, reset, watch, handleSubmit, setFocus, formState: { errors, isSubmitting } } = useForm<PayloadCrearTarifa>({
    resolver: zodResolver(esquemaTarifa),
    defaultValues: { descripcion: '', monto: '', vigenciaDesde: '' },
  })
  const valores = watch()
  const cambios = base === null || construirPatchTarifa(base, valores) !== null
  const sinConexion = !conectado || fetchStatus === 'paused'
  const info = error ? informacionErrorTarifas(error) : null
  const ocupado = enviando || isSubmitting
  const refrescar = () => {
    if (!estaAutenticado || !puedeRefrescarTarifas(conectado, fetchStatus, lectura.current)) return
    lectura.current = true
    setManual(true)
    enfocarResultados.current = true
    void refetch({ cancelRefetch: false }).finally(() => {
      lectura.current = false
      if (montado.current) setManual(false)
    })
  }
  useEffect(() => {
    if (enfocarResultados.current && data !== undefined && !manual && fetchStatus === 'idle' && !abierto) {
      resultados.current?.focus()
      enfocarResultados.current = false
    }
  }, [data, manual, fetchStatus, abierto])
  const abrir = (boton: HTMLButtonElement, tarifa: Tarifa | null) => {
    origen.current = boton
    setBase(tarifa)
    reset(tarifa ?? { descripcion: '', monto: '', vigenciaDesde: hoyTarifa() })
    setFalla(null)
    setExito(null)
    setAbierto(true)
  }
  const cerrar = () => { if (!envio.current) setAbierto(false) }
  const guardar = handleSubmit(async (validado) => {
    if (!estaAutenticado || (base && falla?.ausente)) return
    const payload = base ? construirPatchTarifa(base, validado) : validado
    if (payload === null) return
    const sesion = getSessionRevision()
    const vigente = () => montado.current && getSessionRevision() === sesion
    setFalla(null)
    try {
      if (base) await http.patch<Tarifa>(`/api/tarifas/${base.id}`, payload)
      else await http.post<Tarifa>('/api/tarifas', payload)
      if (!vigente()) return
      setExito(base ? 'Cambios guardados.' : 'Tarifa agregada.')
      setAbierto(false)
      void cliente.invalidateQueries({ queryKey: CLAVE_TARIFAS })
    } catch (errorGuardado) {
      if (vigente()) setFalla(informacionErrorTarifas(errorGuardado))
    }
  })
  const editar = (fila: Tarifa) => <Button variant="ghost" aria-label={`Editar ${fila.descripcion}`}
    onClick={(evento) => abrir(evento.currentTarget, fila)}>Editar</Button>
  const celdas = (fila: Tarifa) => [fila.descripcion, montoTarifa(fila.monto), fechaTarifa(fila.vigenciaDesde), editar(fila)]

  return <div className="min-w-0 space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><h1 className="font-display text-2xl font-bold text-ink-950">Tarifas</h1>
        <p className="mt-1 text-sm text-gris">Administra los valores oficiales que se informan a los pasajeros.</p></div>
      <Button onClick={(evento) => abrir(evento.currentTarget, null)}>Nueva tarifa</Button>
    </header>
    {exito && <p role="status" className="rounded-lg bg-emerald-50 p-4 text-emerald-900">{exito}</p>}
    <section className="min-w-0 space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h2 className="font-display text-lg font-bold">Tarifario de la empresa</h2>
          {data !== undefined && <p className="text-sm text-gris">{data.length} tarifas vigentes {'\u00b7'} Montos en bolivianos (Bs)</p>}</div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">Valores fijos</span>
      </div>
      <p role="status" className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">El asistente consulta este tarifario para responder a los pasajeros. Las tarifas son fijas; no se calculan automaticamente por kilometro.</p>
      {sinConexion && <p role="status" className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900">Sin conexion. {data === undefined ? 'Todavia no hay una lectura confirmada de tarifas.' : 'Los datos mostrados pueden estar desactualizados.'}</p>}
      {info && <Alert role={data === undefined ? 'alert' : 'status'} className={data === undefined ? '' : 'border-amber-200 bg-amber-50 text-amber-900'}>
        <p>{data === undefined ? 'No se pudieron cargar las tarifas' : 'No se pudieron actualizar las tarifas. Se muestran los ultimos datos cargados.'}</p>
        {info.permiso && <p>Tu usuario no tiene permiso para consultar las tarifas.</p>}
        <p>{info.mensaje}</p>
        {!info.permiso && <Button variant="ghost" disabled={sinConexion || lecturas > 0 || manual} onClick={refrescar}>Reintentar</Button>}
      </Alert>}
      {data === undefined && isPending && !sinConexion && <p role="status">Cargando tarifas...</p>}
      {data !== undefined && <section ref={resultados} tabIndex={-1} aria-label="Resultados de tarifas" className="min-w-0 focus-visible:outline-2 focus-visible:outline-azul">
        {data.length === 0 ? <div className="py-6"><p>No hay tarifas vigentes</p><p className="mt-2 text-sm text-gris">Registra la primera tarifa con el boton Nueva tarifa.</p></div> : <>
          <div className="space-y-4 lg:hidden">{data.map((fila) => <article key={fila.id} aria-label={fila.descripcion} className="min-w-0 rounded-lg border border-slate-200 p-4 [overflow-wrap:anywhere]">
            <dl className="space-y-3">{celdas(fila).slice(0, 3).map((valor, indice) => <div key={CAMPOS[indice]}><dt className="text-xs text-gris">{CAMPOS[indice]}</dt><dd className="text-sm">{valor}</dd></div>)}</dl>
            {editar(fila)}
          </article>)}</div>
          <table className="hidden w-full table-fixed border-collapse text-left text-sm [overflow-wrap:anywhere] lg:table">
            <caption className="sr-only">Tarifas vigentes de la empresa</caption>
            <thead><tr>{CAMPOS.map((campo) => <th scope="col" key={campo} className="p-3">{campo}</th>)}</tr></thead>
            <tbody>{data.map((fila) => <tr key={fila.id} className="border-t border-slate-200 align-top">{celdas(fila).map((valor, indice) => <td key={CAMPOS[indice]} className="p-3">{valor}</td>)}</tr>)}</tbody>
          </table>
        </>}
      </section>}
      <p role="status" className="text-sm text-gris">El monto informado es aproximado y no es un precio garantizado. El asistente solo cita estos valores del tarifario oficial.</p>
    </section>
    <Dialog.Root open={abierto} onOpenChange={(valor) => { if (!valor) cerrar() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90%] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl bg-white p-5 shadow-xl [overflow-wrap:anywhere]"
          onOpenAutoFocus={(evento) => { evento.preventDefault(); setFocus('descripcion') }}
          onCloseAutoFocus={(evento) => { evento.preventDefault(); if (montado.current) (origen.current?.isConnected ? origen.current : resultados.current)?.focus() }}>
          <Dialog.Title className="font-display text-xl font-bold">{base ? 'Editar tarifa' : 'Nueva tarifa'}</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-gris">Define un valor fijo del tarifario oficial.</Dialog.Description>
          <form noValidate aria-busy={ocupado} className="mt-5 space-y-4" onSubmit={(evento) => {
            evento.preventDefault()
            // Bloqueo antes de la validacion asincrona de RHF, no solo del transporte.
            if (envio.current) return
            envio.current = true
            setEnviando(true)
            void guardar(evento).finally(() => { envio.current = false; if (montado.current) setEnviando(false) })
          }}>
            <fieldset disabled={ocupado} className="min-w-0 space-y-4">
              <div><Label htmlFor="tarifa-descripcion">Descripcion</Label>
                <Input id="tarifa-descripcion" placeholder="Ej. Tarifa base diurna" {...register('descripcion')} aria-invalid={!!errors.descripcion} aria-describedby={`ayuda-descripcion${errors.descripcion ? ' error-descripcion' : ''}`} />
                <p id="ayuda-descripcion" className="mt-1 text-sm text-gris">Entre 1 y 255 caracteres.</p>
                {errors.descripcion && <p id="error-descripcion" role="alert">{errors.descripcion.message}</p>}
              </div>
              <div><Label htmlFor="tarifa-monto">Monto en bolivianos</Label>
                <div className="flex items-center gap-2"><Input id="tarifa-monto" type="text" inputMode="decimal" placeholder="0.00" {...register('monto')} aria-invalid={!!errors.monto} aria-describedby={`ayuda-monto${errors.monto ? ' error-monto' : ''}`} /><span aria-hidden="true">Bs</span></div>
                <p id="ayuda-monto" className="mt-1 text-sm text-gris">Dos decimales exactos, sin comas ni signo. El minimo es 0.01 y el maximo 99999999.99.</p>
                {errors.monto && <p id="error-monto" role="alert">{errors.monto.message}</p>}
              </div>
              <div><Label htmlFor="tarifa-vigencia">Vigencia desde</Label>
                <Input id="tarifa-vigencia" type="date" readOnly={base !== null} {...register('vigenciaDesde')} aria-invalid={!!errors.vigenciaDesde} aria-describedby={`${base ? 'ayuda-vigencia ' : ''}${errors.vigenciaDesde ? 'error-vigencia' : ''}`.trim() || undefined} />
                {base && <p id="ayuda-vigencia" className="mt-1 text-sm text-gris">La vigencia no se puede cambiar desde aqui.</p>}
                {errors.vigenciaDesde && <p id="error-vigencia" role="alert">{errors.vigenciaDesde.message}</p>}
              </div>
            </fieldset>
            {falla && <Alert><p>{falla.mensaje}</p>{base && falla.ausente && <><p>La tarifa ya no existe. Recarga la lista para consultar las tarifas actuales.</p><Button type="button" variant="ghost" disabled={ocupado || sinConexion || lecturas > 0} onClick={() => { cerrar(); refrescar() }}>Recargar lista</Button></>}</Alert>}
            <div className="flex flex-wrap justify-end gap-3">
              <Button type="button" variant="ghost" disabled={ocupado} onClick={cerrar}>Cancelar</Button>
              <Button type="submit" disabled={ocupado || !cambios || !!(base && falla?.ausente)}>{base ? 'Guardar cambios' : 'Agregar tarifa'}</Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </div>
}
