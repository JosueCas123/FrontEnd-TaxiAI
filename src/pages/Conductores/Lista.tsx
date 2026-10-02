import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useIsFetching, useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch, http } from '../../api/client'
import { getSessionRevision } from '../../api/token'
import type { ConductorDetalle, ConductorListado, EstadoConductor } from '../../api/types'
import { useAuth } from '../../context/AuthContext'
import { useIsMobile } from '../../hooks/use-mobile'
import EstadoBadge from '../../components/EstadoBadge'
import { Alert } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import './Lista.css'
import { CLAVE_ESCRITURA_CONDUCTOR, filtroEscrituraConductor, type OrigenEscrituraConductor } from '../../lib/conductorQueries'
import {
  accionesPorEstado, claveConductores, etiquetaVehiculo, ETIQUETAS_ACCION, filtrarConductores,
  hayTerminoBusqueda, informacionErrorConductores, intervaloRefresco, mensajeBusquedaVacia,
  mensajeErrorTransicion, mensajeExitoTransicion, mensajePestanaVacia, nombreParaMostrar,
  PESTANAS, puedeDispararRefresco, quitarConductor, resumenResultados, retryConductores,
  rutaConductores, rutaTransicion, textoConfirmacion, type Accion,
} from '../../lib/conductores'

interface Transicion {
  fila: ConductorListado
  accion: Accion
  origen: EstadoConductor
  sesion: number
}

export default function Lista() {
  const { estaAutenticado } = useAuth()
  const client = useQueryClient()
  const movil = useIsMobile()
  const [estado, setEstado] = useState<EstadoConductor>('pendiente')
  const [texto, setTexto] = useState('')
  const [visible, setVisible] = useState(document.visibilityState === 'visible')
  const [manual, setManual] = useState(false)
  const [aviso, setAviso] = useState<{ error: boolean; texto: string } | null>(null)
  const region = useRef<HTMLElement>(null)
  const foco = useRef<HTMLElement | null>(null)
  const montado = useRef(true)
  const bloqueadas = useRef(new Set<string>())
  const refrescando = useRef(false)
  const sesion = getSessionRevision()
  const pendientes = useMutationState({
    filters: filtroEscrituraConductor(sesion),
    select: (mutation) => mutation.state.variables as OrigenEscrituraConductor,
  })
  const hayTransicion = pendientes.length > 0
  const lecturas = useIsFetching({ queryKey: ['conductores'] })

  useEffect(() => {
    montado.current = true
    let oculta = false
    const reevaluar = () => setVisible(!oculta && document.visibilityState === 'visible')
    const ocultar = () => { oculta = true; reevaluar() }
    const mostrar = () => { oculta = false; reevaluar() }
    const recordarFoco = (evento: FocusEvent) => {
      foco.current = evento.target instanceof HTMLElement && region.current?.contains(evento.target)
        ? evento.target : null
    }
    document.addEventListener('visibilitychange', reevaluar)
    window.addEventListener('pagehide', ocultar)
    window.addEventListener('pageshow', mostrar)
    document.addEventListener('focusin', recordarFoco)
    return () => {
      montado.current = false
      document.removeEventListener('visibilitychange', reevaluar)
      window.removeEventListener('pagehide', ocultar)
      window.removeEventListener('pageshow', mostrar)
      document.removeEventListener('focusin', recordarFoco)
    }
  }, [])

  const { data, error, isPending } = useQuery({
    queryKey: claveConductores(estado),
    queryFn: ({ signal }) => apiFetch<ConductorListado[]>(rutaConductores(estado), { signal }),
    enabled: estaAutenticado,
    retry: retryConductores,
    refetchInterval: () => intervaloRefresco({ visible, hayTransicionEnCurso: hayTransicion }),
  })

  useLayoutEffect(() => {
    if (foco.current && !foco.current.isConnected && document.activeElement === document.body) {
      region.current?.focus()
    }
  })

  const transicion = useMutation({
    mutationKey: CLAVE_ESCRITURA_CONDUCTOR,
    retry: false,
    mutationFn: async ({ fila, accion, origen, sesion: inicio }: Transicion) => {
      const vigente = () => getSessionRevision() === inicio
      const clave = ['conductor-detalle', fila.id]
      const claveUbicacion = ['conductor-ubicacion', fila.id]
      let respuesta: ConductorDetalle | undefined
      let resultado: { error: boolean; texto: string }
      try {
        respuesta = await http.patch<ConductorDetalle>(rutaTransicion(fila.id, accion))
        if (!vigente()) return
        // Aborta transportes anteriores en todas las pestanas, no solo la visible.
        await client.cancelQueries({ queryKey: ['conductores'] })
        if (!vigente()) return
        client.setQueryData<ConductorListado[]>(claveConductores(origen), (lista) => quitarConductor(lista, fila.id))
        resultado = { error: false, texto: mensajeExitoTransicion(accion, fila.nombreCompleto) }
      } catch (errorTransicion) {
        if (!vigente()) return
        resultado = { error: true, texto: mensajeErrorTransicion(errorTransicion) }
        await client.cancelQueries({ queryKey: ['conductores'] })
        if (!vigente()) return
      }
      await client.cancelQueries({ queryKey: clave, exact: true })
      if (!vigente()) return
      await client.cancelQueries({ queryKey: claveUbicacion, exact: true })
      if (!vigente()) return
      if (respuesta) client.setQueryData(clave, respuesta)
      if (montado.current) setAviso(resultado)
      // Sigue pendiente durante la conciliacion: el polling no compite con ella.
      await Promise.all([
        client.invalidateQueries({ queryKey: ['conductores'] }, { cancelRefetch: false }),
        client.invalidateQueries({ queryKey: clave, exact: true }, { cancelRefetch: false }),
        client.invalidateQueries({ queryKey: claveUbicacion, exact: true }, { cancelRefetch: false }),
      ])
    },
  })

  const ejecutar = async (fila: ConductorListado, accion: Accion) => {
    if (getSessionRevision() !== sesion || !montado.current || bloqueadas.current.has(fila.id) || client.isMutating(filtroEscrituraConductor(sesion, fila.id))) return
    if (!window.confirm(textoConfirmacion(accion, fila.nombreCompleto))) return
    bloqueadas.current.add(fila.id)
    setAviso(null)
    try {
      await transicion.mutateAsync({ fila, accion, origen: estado, sesion })
    } finally {
      bloqueadas.current.delete(fila.id)
    }
  }

  const refrescar = async () => {
    if (!puedeDispararRefresco(lecturas > 0 || hayTransicion || refrescando.current)) return
    refrescando.current = true
    setManual(true)
    try {
      await client.invalidateQueries({ queryKey: ['conductores'] }, { cancelRefetch: false })
    } finally {
      refrescando.current = false
      if (montado.current && sesion === getSessionRevision()) setManual(false)
    }
  }

  const acciones = (fila: ConductorListado) => {
    const disponibles = accionesPorEstado(fila.estado)
    if (disponibles.length === 0) return <span className="text-xs text-gris">No admite transiciones</span>
    return <div className="conductor-acciones flex flex-wrap gap-2">
      {disponibles.map((accion) => <Button key={accion} variant={accion === 'aprobar' || accion === 'reactivar' ? 'default' : 'ghost'}
        className={`conductor-accion conductor-accion--${accion}`}
        aria-label={`${ETIQUETAS_ACCION[accion]} a ${nombreParaMostrar(fila.nombreCompleto)}`}
        disabled={pendientes.some((p) => p.fila.id === fila.id)}
        onClick={() => void ejecutar(fila, accion)}>
        {accion === 'aprobar' && <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4 shrink-0"><path d="m5 12 4 4L19 6" /></svg>}
        {ETIQUETAS_ACCION[accion]}</Button>)}
    </div>
  }
  const filas = data === undefined ? [] : filtrarConductores(data, texto)
  const infoError = error ? informacionErrorConductores(error) : null
  const ocupado = manual || hayTransicion
  const refrescoBloqueado = lecturas > 0 || ocupado

  return (
    <div className="conductores-lista min-w-0">
      <header className="conductores-heading">
      <h1 className="font-display text-2xl font-bold text-ink-950">Conductores</h1>
      <p className="mt-1 text-sm text-gris">
        Listado y gestión de cuentas. Fuente: <code>GET /api/conductores</code>.
      </p>
      </header>
      <div className="conductores-panel">
      <div className="conductores-controles">
        <div role="group" aria-label="Estado de conductores" className="conductores-pestanas">
          {(Object.keys(PESTANAS) as EstadoConductor[]).map((opcion) => <Button key={opcion}
            aria-pressed={estado === opcion} variant="ghost"
            className="conductores-pestana"
            onClick={() => setEstado(opcion)}>{PESTANAS[opcion]}</Button>)}
        </div>
        <Button variant="ghost" className="conductores-actualizar" disabled={refrescoBloqueado}
          onClick={() => void refrescar()}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4 shrink-0"><path d="M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 6M4 12l2 6a7 7 0 0 0 12-1" /></svg>
          Actualizar</Button>
      </div>
      <div className="conductores-filtros">
      <div className="conductores-busqueda">
        <Label htmlFor="busqueda-conductores">Buscar conductores</Label>
        <div className="relative mt-2">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-gris"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" /></svg>
        <Input id="busqueda-conductores" type="search" value={texto}
          className="pl-9" placeholder="Nombre, telefono o placa" onChange={(evento) => setTexto(evento.target.value)} />
        </div>
      </div>
      <span className="text-xs text-gris">Datos administrados por la empresa</span>
      </div>
      {aviso && <p role={aviso.error ? 'alert' : 'status'}
        className={`mb-4 rounded-lg border p-4 text-sm ${aviso.error ? 'border-red-200 bg-red-50 text-red-800' : 'border-emerald-200 bg-emerald-50 text-emerald-900'}`}>{aviso.texto}</p>}
      <section ref={region} tabIndex={-1} aria-label={`Resultados: ${PESTANAS[estado]}`}
        aria-busy={ocupado} className="conductores-resultados min-w-0 rounded-xl focus-visible:outline-2 focus-visible:outline-azul">
        {ocupado && <p className="mb-3 text-sm text-gris">{hayTransicion ? 'Procesando transicion...' : 'Actualizando...'}</p>}
        {infoError && <Alert className="mb-4">
          <p>{infoError.mensaje}</p>
          {data !== undefined && <p>Los datos mostrados pueden estar desactualizados.</p>}
          <Button variant="ghost" className="mt-2 border border-slate-300" disabled={refrescoBloqueado}
            onClick={() => void refrescar()}>Reintentar</Button>
        </Alert>}
        {data === undefined && isPending && <p role="status" className="py-8 text-gris">Cargando conductores...</p>}
        {data !== undefined && <>
          {filas.length === 0 ? <div className="rounded-xl border border-slate-200 bg-white p-6">
            <p className="break-words">{hayTerminoBusqueda(texto) ? mensajeBusquedaVacia(texto) : mensajePestanaVacia(estado)}</p>
            {hayTerminoBusqueda(texto) && <Button variant="ghost" className="mt-3 border border-slate-300"
              onClick={() => setTexto('')}>Limpiar busqueda</Button>}
          </div> : movil ? <div className="conductores-tarjetas space-y-4">
            {filas.map((fila) => <article key={fila.id} className="conductor-tarjeta min-w-0 rounded-xl border border-slate-200 bg-white p-4 [overflow-wrap:anywhere]">
              <h2 className="font-semibold text-ink-950"><Link className="conductor-nombre-link" to={`/conductores/${encodeURIComponent(fila.id)}`}>{nombreParaMostrar(fila.nombreCompleto)}</Link></h2>
              <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-3 gap-y-3 text-sm">
                <dt className="text-gris">Telefono</dt><dd>{fila.telefono}</dd>
                <dt className="text-gris">Estado</dt><dd><EstadoBadge estado={fila.estado} /></dd>
                <dt className="text-gris">Jornada</dt><dd><EstadoBadge estado={fila.estadoJornada} /></dd>
                <dt className="text-gris">Disponibilidad</dt><dd><EstadoBadge estado={fila.estadoDisponibilidad} /></dd>
                <dt className="text-gris">Vehiculo</dt><dd>{etiquetaVehiculo(fila.vehiculo)}</dd>
              </dl>
              <div className="conductor-enlaces-acciones mt-4 border-t border-slate-200 pt-4">{acciones(fila)}<Link className="conductor-detalle-link" to={`/conductores/${encodeURIComponent(fila.id)}`} aria-label={`Ver detalle de ${nombreParaMostrar(fila.nombreCompleto)}`}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m9 5 7 7-7 7" /></svg></Link></div>
            </article>)}
          </div> : <table className="conductores-tabla w-full table-fixed border-collapse bg-white text-left text-sm [overflow-wrap:anywhere]">
            <colgroup>{[20, 14, 10, 11, 13, 10, 22].map((ancho, indice) => <col key={indice} style={{ width: `${ancho}%` }} />)}</colgroup>
            <thead><tr>
              {['Nombre', 'Telefono', 'Estado', 'Jornada', 'Disponibilidad', 'Vehiculo', 'Acciones'].map((titulo) =>
                <th key={titulo} scope="col" className="px-3 py-4">{titulo}</th>)}
            </tr></thead>
            <tbody>{filas.map((fila) => <tr key={fila.id} className="border-b border-slate-200">
              <td className="p-3 font-semibold"><div className="flex items-center gap-3"><span aria-hidden="true" className="conductor-avatar">{fila.nombreCompleto?.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase() || '?'}</span><Link className="conductor-nombre-link min-w-0" to={`/conductores/${encodeURIComponent(fila.id)}`}>{nombreParaMostrar(fila.nombreCompleto)}</Link></div></td>
              <td className="p-3 tabular-nums text-gris">{fila.telefono}</td>
              <td className="p-3"><EstadoBadge estado={fila.estado} /></td>
              <td className="p-3"><EstadoBadge estado={fila.estadoJornada} /></td>
              <td className="p-3"><EstadoBadge estado={fila.estadoDisponibilidad} /></td>
              <td className="p-3">{etiquetaVehiculo(fila.vehiculo)}</td>
              <td className="p-3"><div className="conductor-enlaces-acciones">{acciones(fila)}<Link className="conductor-detalle-link" to={`/conductores/${encodeURIComponent(fila.id)}`} aria-label={`Ver detalle de ${nombreParaMostrar(fila.nombreCompleto)}`}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m9 5 7 7-7 7" /></svg></Link></div></td>
            </tr>)}</tbody>
          </table>}
          <p role="status" key={estado} className="conductores-pie">{resumenResultados(filas.length, data.length)}</p>
        </>}
      </section>
      </div>
    </div>
  )
}
