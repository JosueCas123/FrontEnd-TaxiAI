import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { onlineManager, useIsFetching, useQuery } from '@tanstack/react-query'
import { apiFetch } from '../api/client'
import type { SolicitudActiva } from '../api/types'
import { useAuth } from '../context/AuthContext'
import EstadoBadge from '../components/EstadoBadge'
import { Alert } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  CLAVE_SOLICITUDES_ACTIVAS, ESTADOS_ACTIVOS, fechaSolicitud, filtrarSolicitudes,
  informacionErrorSolicitudes, intervaloSolicitudes, puedeRefrescarSolicitudes,
  retrySolicitudes, type FiltroEstadoSolicitud,
} from '../lib/solicitudes'

const CAMPOS = ['Identificador', 'Pasajero', 'Conductor asignado', 'Estado', 'Creacion', 'Destino', 'Expiracion']
const noDisponible = (texto: string) => <span><span aria-hidden="true">{'\u2014'}</span><span className="sr-only">{texto}</span></span>

export default function Solicitudes() {
  const { estaAutenticado } = useAuth()
  const [texto, setTexto] = useState('')
  const [estado, setEstado] = useState<FiltroEstadoSolicitud>('todos')
  const [visible, setVisible] = useState(() => document.visibilityState === 'visible')
  const [manual, setManual] = useState(false)
  const bloqueada = useRef(false)
  const lecturasEnVuelo = useIsFetching({ queryKey: CLAVE_SOLICITUDES_ACTIVAS })
  const conectado = useSyncExternalStore(
    (notificar) => onlineManager.subscribe(notificar),
    () => onlineManager.isOnline(),
  )
  useEffect(() => {
    const reevaluar = () => setVisible(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', reevaluar)
    return () => document.removeEventListener('visibilitychange', reevaluar)
  }, [])

  const { data, error, isPending, fetchStatus, refetch } = useQuery({
    queryKey: CLAVE_SOLICITUDES_ACTIVAS,
    queryFn: ({ signal }) => apiFetch<SolicitudActiva[]>('/api/dashboard/solicitudes-activas', { signal }),
    enabled: estaAutenticado,
    retry: retrySolicitudes,
    refetchInterval: (query) => intervaloSolicitudes(visible && conectado, query.state.fetchStatus !== 'idle'),
  })
  const sinConexion = !conectado || fetchStatus === 'paused'
  const enCurso = !sinConexion && (lecturasEnVuelo > 0 || manual)
  const lecturaInicial = data === undefined && isPending
  const bloqueado = enCurso || sinConexion || lecturaInicial
  const refrescar = () => {
    if (!estaAutenticado || !puedeRefrescarSolicitudes(conectado, fetchStatus, bloqueada.current, lecturaInicial)) return
    bloqueada.current = true
    setManual(true)
    void refetch({ cancelRefetch: false }).finally(() => {
      bloqueada.current = false
      setManual(false)
    })
  }
  const infoError = error ? informacionErrorSolicitudes(error) : null
  const filas = filtrarSolicitudes(data ?? [], texto, estado)
  const filtrando = texto.trim() !== '' || estado !== 'todos'
  const valores = (fila: SolicitudActiva) => [
    <span className="select-text font-mono text-xs">{fila.id}</span>,
    fila.pasajero?.nombre ?? noDisponible('Pasajero no disponible'),
    fila.conductorAsignado?.nombreCompleto ?? noDisponible('Conductor no disponible'),
    <EstadoBadge estado={fila.estado} />,
    fechaSolicitud(fila.creadoEn),
    fila.destino ?? noDisponible('Destino no disponible'),
    fila.expiraEn === null ? noDisponible('Expiracion no disponible') : fechaSolicitud(fila.expiraEn, true),
  ]

  return (
    <div className="min-w-0 space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-950">Solicitudes activas</h1>
          <p className="mt-1 text-sm text-gris">Supervisa la atencion de pasajeros y el estado de cada solicitud.</p>
        </div>
        <Button variant="ghost" className="border border-slate-300" disabled={bloqueado} onClick={refrescar}>
          {enCurso ? 'Actualizando...' : 'Actualizar'}
        </Button>
      </header>
      <p className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-gris">
        Vista de supervision. Desde esta pantalla no se reasignan solicitudes ni se modifican sus estados.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="min-w-0">
          <Label htmlFor="buscar-solicitudes">Buscar solicitudes</Label>
          <Input id="buscar-solicitudes" type="search" className="mt-2" placeholder="ID, pasajero o conductor"
            value={texto} onChange={(event) => setTexto(event.target.value)} />
        </div>
        <div className="min-w-0">
          <Label htmlFor="estado-solicitudes">Estado</Label>
          <select id="estado-solicitudes" className="mt-2 w-full rounded-lg border border-slate-300 bg-white p-2 text-sm focus-visible:outline-2 focus-visible:outline-azul"
            value={estado} onChange={(event) => setEstado(event.target.value as FiltroEstadoSolicitud)}>
            <option value="todos">Todos</option>
            {ESTADOS_ACTIVOS.map((opcion) => <option key={opcion.valor} value={opcion.valor}>{opcion.etiqueta}</option>)}
          </select>
        </div>
      </div>
      {manual && enCurso && <p role="status" className="text-sm text-gris">Actualizando solicitudes...</p>}
      {sinConexion && <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p>Sin conexion. La consulta se reanudara al recuperar la conexion.</p>
        <p>{data === undefined ? 'Todavia no hay una lectura confirmada de solicitudes.' : 'Los datos mostrados pueden estar desactualizados.'}</p>
      </div>}
      {!sinConexion && infoError && <Alert role={data === undefined ? 'alert' : 'status'}
        className={data === undefined ? '' : 'border-amber-200 bg-amber-50 text-amber-900'}>
        <p>{data === undefined ? 'No se pudieron cargar las solicitudes.' : 'No se pudieron actualizar las solicitudes.'} {infoError.mensaje}</p>
        {data !== undefined && <p>Los datos mostrados pueden estar desactualizados.</p>}
        {infoError.recuperable && <Button variant="ghost" className="mt-2 border border-slate-300"
          disabled={bloqueado} onClick={refrescar}>Reintentar</Button>}
      </Alert>}
      {data === undefined && isPending && !sinConexion && <p role="status" className="py-8 text-gris">Cargando solicitudes...</p>}
      {data !== undefined && <section aria-label="Resultados de solicitudes" className="min-w-0 space-y-3">
        <p className="text-sm text-gris">{filtrando ? `${filas.length} de ${data.length} solicitudes activas` : `Total: ${data.length} solicitudes activas`}</p>
        {filas.length === 0 ? <div className="rounded-xl border border-slate-200 bg-white p-6">
          <p>{data.length === 0 ? 'No hay solicitudes activas' : 'No hay solicitudes que coincidan con los filtros.'}</p>
          {data.length > 0 && <Button variant="ghost" className="mt-3 border border-slate-300"
            onClick={() => { setTexto(''); setEstado('todos') }}>Limpiar filtros</Button>}
        </div> : <>
          <div className="space-y-4 lg:hidden">
            {filas.map((fila) => <article key={fila.id} aria-label={`Solicitud ${fila.id}`}
              className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 [overflow-wrap:anywhere]">
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {valores(fila).map((valor, indice) => <div key={CAMPOS[indice]} className="min-w-0">
                  <dt className="text-xs text-gris">{CAMPOS[indice]}</dt><dd className="mt-1 text-sm">{valor}</dd>
                </div>)}
              </dl>
            </article>)}
          </div>
          <table className="hidden w-full table-fixed border-collapse bg-white text-left text-sm [overflow-wrap:anywhere] lg:table">
            <caption className="sr-only">Solicitudes activas, fechas en America/La_Paz</caption>
            <thead><tr>{CAMPOS.map((campo) => <th key={campo} scope="col" className="p-3">{campo}</th>)}</tr></thead>
            <tbody>{filas.map((fila) => <tr key={fila.id} className="border-b border-slate-200 align-top">
              {valores(fila).map((valor, indice) => <td key={CAMPOS[indice]} className="p-3">{valor}</td>)}
            </tr>)}</tbody>
          </table>
        </>}
        <p className="text-xs text-gris">Fechas en hora de Bolivia (America/La_Paz). Consulta periodica cada 15 segundos mientras esta vista esta visible.</p>
      </section>}
    </div>
  )
}
