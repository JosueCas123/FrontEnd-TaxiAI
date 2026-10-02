import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import * as Dialog from '@radix-ui/react-dialog'
import { ApiError, apiFetch, http } from '../../api/client'
import { getSessionRevision } from '../../api/token'
import type { ConductorDetalle, ConductorMapa, Vehiculo } from '../../api/types'
import { useAuth } from '../../context/AuthContext'
import EstadoBadge from '../../components/EstadoBadge'
import { Alert } from '../../components/ui/alert'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { accionesPorEstado, ETIQUETAS_ACCION, mensajeErrorTransicion, mensajeExitoTransicion,
  antiguedadParaMostrar, nombreParaMostrar, retryConductores, rutaTransicion, textoConfirmacion, type Accion } from '../../lib/conductores'
import { construirPayloadVehiculo, tieneEdicionesVehiculo, validarVehiculo, valoresDesdeVehiculo,
  type ValoresVehiculo } from '../../lib/vehiculoForm'
import './Detalle.css'

const ETIQUETAS: Record<keyof ValoresVehiculo, string> = {
  placa: 'Placa', marca: 'Marca', modelo: 'Modelo', color: 'Color', capacidadPasajeros: 'Capacidad de pasajeros',
}
interface Edicion {
  base: Vehiculo
  valores: ValoresVehiculo
  objetivoPerdido: boolean
}

export default function Detalle() {
  const { id = '' } = useParams()
  const { estaAutenticado } = useAuth()
  const sesion = getSessionRevision()
  return estaAutenticado ? <Ficha key={`${sesion}:${id}`} id={id} sesion={sesion} /> : null
}

function Ficha({ id, sesion }: { id: string; sesion: number }) {
  const client = useQueryClient()
  const { cerrarSesion } = useAuth()
  const montado = useRef(true)
  const refrescando = useRef(false)
  const enviado = useRef(false)
  const botonEditar = useRef<HTMLButtonElement>(null)
  const enlaceVolver = useRef<HTMLAnchorElement>(null)
  const primerCampo = useRef<HTMLInputElement>(null)
  const [edicion, setEdicion] = useState<Edicion | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [validar, setValidar] = useState(false)
  const [falla, setFalla] = useState<string | null>(null)
  const [permisoPatchDenegado, setPermisoPatchDenegado] = useState(false)
  const [exito, setExito] = useState(false)
  const [restriccion, setRestriccion] = useState<ApiError | null>(null)
  const [avisoCuenta, setAvisoCuenta] = useState<{ error: boolean; texto: string } | null>(null)
  const { data, error, isPending, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: ['conductor-detalle', id],
    queryFn: async ({ signal }) => {
      if (getSessionRevision() !== sesion) throw new DOMException('Sesion anterior', 'AbortError')
      try {
        const detalle = await apiFetch<ConductorDetalle>(`/api/conductores/${encodeURIComponent(id)}`, { signal })
        if (getSessionRevision() !== sesion) throw new DOMException('Sesion anterior', 'AbortError')
        return detalle
      } catch (fallo) {
        if (getSessionRevision() !== sesion) throw new DOMException('Sesion anterior', 'AbortError')
        throw fallo
      }
    },
    enabled: !!id,
    retry: retryConductores,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
  const errorRestringido = error instanceof ApiError && [403, 404].includes(error.status) ? error : null
  const accesoBloqueado = errorRestringido ?? restriccion
  const ubicacion = useQuery({
    queryKey: ['conductor-ubicacion', id],
    queryFn: async ({ signal }) => {
      if (getSessionRevision() !== sesion) throw new DOMException('Sesion anterior', 'AbortError')
      try {
        const filas = await apiFetch<ConductorMapa[]>('/api/dashboard/conductores-mapa', { signal })
        if (getSessionRevision() !== sesion) throw new DOMException('Sesion anterior', 'AbortError')
        return filas.find((fila) => fila.id === id) ?? null
      } catch (fallo) {
        if (getSessionRevision() !== sesion) throw new DOMException('Sesion anterior', 'AbortError')
        throw fallo
      }
    },
    enabled: !!data && !accesoBloqueado,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  })
  const reporte = ubicacion.data?.ultimaUbicacionRegistradaEn
  const antiguedad = reporte ? Math.max(0, Date.now() - Date.parse(reporte)) : null
  const desactualizada = antiguedad !== null && antiguedad > 300_000
  const objetivoPerdido = !!edicion && (edicion.objetivoPerdido || data?.vehiculo?.id !== edicion.base.id)
  const guardadoBloqueado = !!accesoBloqueado || permisoPatchDenegado || objetivoPerdido
  const sucio = !!edicion && tieneEdicionesVehiculo(edicion.base, edicion.valores)
  const errores = edicion && validar ? validarVehiculo(edicion.valores) : {}

  useEffect(() => {
    if (objetivoPerdido) setEdicion((actual) => actual && !actual.objetivoPerdido ? { ...actual, objetivoPerdido: true } : actual)
  }, [objetivoPerdido])
  useEffect(() => {
    if (!sucio) return
    const advertir = (evento: BeforeUnloadEvent) => { evento.preventDefault(); evento.returnValue = '' }
    window.addEventListener('beforeunload', advertir)
    return () => window.removeEventListener('beforeunload', advertir)
  }, [sucio])

  // Un reintento pendiente o fallido no rehabilita datos anteriores a un 403/404.
  useEffect(() => {
    if (error instanceof ApiError && [403, 404].includes(error.status)) setRestriccion(error)
    else if (!error && !isFetching && data) setRestriccion(null)
  }, [error, isFetching, data, dataUpdatedAt])
  useEffect(() => {
    montado.current = true
    return () => { montado.current = false }
  }, [])

  const refrescar = async () => {
    if (getSessionRevision() !== sesion || !montado.current || refrescando.current || isFetching || enviado.current) return
    refrescando.current = true
    try {
      await refetch({ cancelRefetch: false })
      if (getSessionRevision() !== sesion || !montado.current) return
      if (data && !accesoBloqueado) await ubicacion.refetch({ cancelRefetch: false })
    }
    finally { refrescando.current = false }
  }

  const cerrarModal = () => {
    if (enviado.current || (sucio && !window.confirm('Descartar los cambios sin guardar?'))) return false
    setEdicion(null)
    setFalla(null)
    setValidar(false)
    return true
  }

  const gestionar = async (accion: Accion) => {
    if (!data || edicion || enviado.current || accesoBloqueado || permisoPatchDenegado ||
      !montado.current || getSessionRevision() !== sesion || !accionesPorEstado(data.estado).includes(accion)) return
    if (!window.confirm(textoConfirmacion(accion, data.nombreCompleto))) return
    enviado.current = true
    setEnviando(true)
    setAvisoCuenta(null)
    const vigente = () => getSessionRevision() === sesion
    const clave = ['conductor-detalle', id]
    let respuesta: ConductorDetalle | undefined
    let aviso: { error: boolean; texto: string }
    try {
      respuesta = await http.patch<ConductorDetalle>(rutaTransicion(id, accion))
      aviso = { error: false, texto: mensajeExitoTransicion(accion, data.nombreCompleto) }
    } catch (fallo) {
      if (!vigente()) return
      aviso = { error: true, texto: mensajeErrorTransicion(fallo) }
      if (montado.current && fallo instanceof ApiError && fallo.status === 403) setPermisoPatchDenegado(true)
    }
    if (!vigente()) return
    await client.cancelQueries({ queryKey: clave, exact: true })
    if (!vigente()) return
    await client.cancelQueries({ queryKey: ['conductores'] })
    if (!vigente()) return
    await client.cancelQueries({ queryKey: ['conductor-ubicacion', id], exact: true })
    if (!vigente()) return
    if (respuesta) client.setQueryData(clave, respuesta)
    if (montado.current) setAvisoCuenta(aviso)
    await Promise.all([
      client.invalidateQueries({ queryKey: clave, exact: true }, { cancelRefetch: false }),
      client.invalidateQueries({ queryKey: ['conductores'] }, { cancelRefetch: false }),
      client.invalidateQueries({ queryKey: ['conductor-ubicacion', id], exact: true }, { cancelRefetch: false }),
    ])
    if (!vigente() || !montado.current) return
    enviado.current = false
    setEnviando(false)
  }

  const guardar = async () => {
    if (enviado.current || guardadoBloqueado || !edicion || getSessionRevision() !== sesion) return
    setValidar(true)
    const payload = construirPayloadVehiculo(edicion.base, edicion.valores)
    if (!payload || !Object.keys(payload).length) return
    enviado.current = true
    setEnviando(true)
    setFalla(null)
    setExito(false)
    const vigente = () => getSessionRevision() === sesion
    const vistaVigente = () => vigente() && montado.current
    const clave = ['conductor-detalle', id]
    let respuesta: ConductorDetalle
    try {
      // Una sola escritura, sin retry ni datos optimistas. Cancelar GET no revierte PATCH.
      respuesta = await http.patch<ConductorDetalle>(`/api/conductores/${encodeURIComponent(id)}/vehiculo`, payload)
    } catch (fallo) {
      if (!vigente()) return
      if (vistaVigente()) {
        setFalla(fallo instanceof ApiError && fallo.status < 500 ? fallo.message :
          `${fallo instanceof ApiError ? `${fallo.message}. ` : ''}No se pudo confirmar el resultado del guardado. Revisa la conexion y actualiza antes de volver a intentar; los cambios pueden haberse aplicado.`)
        if (fallo instanceof ApiError && fallo.status === 403) setPermisoPatchDenegado(true)
        if (fallo instanceof ApiError && fallo.status === 404) {
          setEdicion((actual) => actual && { ...actual, objetivoPerdido: true })
        }
      }
      if (fallo instanceof ApiError && fallo.status === 404) {
        await client.cancelQueries({ queryKey: clave, exact: true })
        if (!vigente()) return
        await client.invalidateQueries({ queryKey: clave, exact: true }, { cancelRefetch: false })
      }
      if (vistaVigente()) { enviado.current = false; setEnviando(false) }
      return
    }
    if (!vigente()) return
    // La conciliacion del origen sigue en la misma sesion aunque se haya navegado.
    await client.cancelQueries({ queryKey: clave, exact: true })
    if (!vigente()) return
    await client.cancelQueries({ queryKey: ['conductores'] })
    if (!vigente()) return
    client.setQueryData<ConductorDetalle>(clave, respuesta)
    if (vistaVigente()) {
      setExito(true)
      setEdicion(null)
      setValidar(false)
      enviado.current = false
      setEnviando(false)
    }
    // Los fallos de lectura son independientes del PATCH ya confirmado.
    void client.invalidateQueries({ queryKey: clave, exact: true }, { cancelRefetch: false })
    if (!vigente()) return
    void client.invalidateQueries({ queryKey: ['conductores'] }, { cancelRefetch: false })
  }

  let fecha: { iso: string; texto: string } | null = null
  if (data) {
    try {
      const valor = new Date(data.creadoEn)
      fecha = { iso: valor.toISOString(), texto: new Intl.DateTimeFormat('es-BO', {
        timeZone: 'America/La_Paz', day: 'numeric', month: 'short', year: 'numeric',
      }).format(valor) }
    } catch { /* No se inventa una fecha para datos no formateables. */ }
  }
  const nombre = nombreParaMostrar(data?.nombreCompleto)

  return <div className="conductor-detalle">
    <div className="detalle-toolbar">
      <Link ref={enlaceVolver} to="/conductores"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m12 5-7 7 7 7M5 12h14" /></svg>Volver a conductores</Link>
      <Button variant="ghost" disabled={isFetching || enviando} onClick={() => void refrescar()}>Actualizar</Button>
    </div>
    {isFetching && <p role="status">{data ? 'Actualizando...' : 'Cargando conductor...'}</p>}
    {exito && <p role="status" className="detalle-exito">Vehiculo guardado.</p>}
    {permisoPatchDenegado && <Alert>Permiso de edicion denegado. Vuelve a iniciar sesion con permisos de administrador para recuperar el guardado; actualizar la ficha no acredita ese permiso.</Alert>}
    {accesoBloqueado ? <section className="detalle-panel">
      <h1>{accesoBloqueado.status === 404 ? 'Conductor no encontrado' : 'Permiso denegado'}</h1>
      <Alert>{accesoBloqueado.message}</Alert>
    </section> : <>
      {error && <Alert>
        <p>{error instanceof ApiError ? error.message : 'No se pudo cargar el conductor.'}</p>
        {data && <p>Los datos mostrados pueden estar desactualizados.</p>}
        <Button variant="ghost" disabled={isFetching || enviando} onClick={() => void refrescar()}>Reintentar</Button>
      </Alert>}
      {!data && isPending && !isFetching && <h1>Detalle de conductor</h1>}
      {data && <>
        <header className="detalle-heading">
          <span className="detalle-avatar" aria-hidden="true">{data.nombreCompleto?.trim().split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase() || '?'}</span>
          <div><h1>{nombre}</h1><p>{fecha ? <>Registrado el <time dateTime={fecha.iso}>{fecha.texto}</time></> : 'Fecha no disponible'}</p></div>
          <EstadoBadge estado={data.estado} />
        </header>
        <div className="detalle-grid">
          <div className="detalle-stack">
            <section className="detalle-panel">
              <div className="detalle-panel-heading"><h2>Datos personales</h2><span>Solo lectura</span></div>
              <dl className="detalle-datos">
                <div><dt>Nombre completo</dt><dd>{nombre}</dd></div>
                <div><dt>Cedula de identidad</dt><dd>{data.cedulaIdentidad}</dd></div>
                <div><dt>Telefono</dt><dd>{data.telefono}</dd></div>
                <div><dt>Estado de la cuenta</dt><dd><EstadoBadge estado={data.estado} /></dd></div>
              </dl>
              <p className="detalle-nota">Datos administrados por la empresa. Esta ficha no edita datos personales.</p>
            </section>
            <section className="detalle-panel">
              <div className="detalle-panel-heading"><h2>Vehiculo asignado</h2>
                {data.vehiculo && <Button ref={botonEditar} variant="ghost" disabled={enviando} onClick={() => {
                  if (!data.vehiculo || accesoBloqueado || enviado.current) return
                  setEdicion({ base: { ...data.vehiculo }, valores: valoresDesdeVehiculo(data.vehiculo), objetivoPerdido: false })
                  setFalla(null); setValidar(false); setExito(false)
                 }}><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m16 3 5 5-12 12H4v-5L16 3Zm-3 3 5 5" /></svg>Editar vehiculo</Button>}
              </div>
              {data.vehiculo ? <>
                <div className="detalle-vehiculo">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="m5 8 2-4h10l2 4 2 3v7H3v-7l2-3Zm0 0h14M3 13h18M6 18v3m12-3v3M6 10v1m12-1v1" /></svg>
                  <div><h3>{data.vehiculo.marca} {data.vehiculo.modelo}</h3><strong className="detalle-placa">{data.vehiculo.placa}</strong></div>
                </div>
                <dl className="detalle-datos">
                  <div><dt>Marca</dt><dd>{data.vehiculo.marca}</dd></div>
                  <div><dt>Modelo</dt><dd>{data.vehiculo.modelo}</dd></div>
                  <div><dt>Color</dt><dd>{data.vehiculo.color}</dd></div>
                  <div><dt>Capacidad</dt><dd>{data.vehiculo.capacidadPasajeros} pasajeros</dd></div>
                </dl>
                <p className="detalle-nota">Estos datos se muestran al pasajero al seleccionar un conductor.</p>
              </> : <p className="detalle-nota">Sin vehiculo registrado</p>}
            </section>
          </div>
          <div className="detalle-stack"><section className="detalle-panel">
            <div className="detalle-panel-heading"><h2>Estado operativo</h2><span>Solo lectura</span></div>
            <dl className="detalle-operativo">
              <div><dt>Jornada</dt><dd><EstadoBadge estado={data.estadoJornada} /></dd></div>
              <div><dt>Disponibilidad</dt><dd><EstadoBadge estado={data.estadoDisponibilidad} /></dd></div>
              <div><dt>Ultima ubicacion</dt><dd className={desactualizada ? 'detalle-antigua' : ''}>
                {ubicacion.isFetching ? <span role="status">Consultando...</span> : ubicacion.error ? 'No disponible' :
                  ubicacion.isPending ? 'Pendiente de consulta' : antiguedad === null ? 'Sin reportes' :
                     antiguedadParaMostrar(antiguedad)}
              </dd></div>
            </dl>
            {ubicacion.error ? <div className="detalle-ubicacion-error"><Alert>No se pudo consultar la ultima ubicacion.</Alert>
              <Button variant="ghost" disabled={ubicacion.isFetching || enviando} onClick={() => {
                if (getSessionRevision() === sesion && !enviado.current) void ubicacion.refetch()
              }}>Reintentar ubicacion</Button></div> : !ubicacion.isFetching && desactualizada &&
              <p className="detalle-aviso-antiguedad">Mas de 5 minutos sin actualizar. No elegible para nuevas solicitudes.</p>}
          </section>
          <section className="detalle-panel">
            <div className="detalle-panel-heading"><div><h2>Gestion de la cuenta</h2><p>{data.estado === 'pendiente' ?
              'Revisa los datos del conductor y su vehiculo.' : data.estado === 'suspendido' ? 'La cuenta conserva sus datos.' :
                data.estado === 'rechazado' ? 'Este registro no fue aprobado.' : 'La suspension impide recibir nuevas solicitudes.'}</p></div></div>
            {accionesPorEstado(data.estado).length > 0 && <div className="detalle-acciones" aria-busy={enviando}>
              {accionesPorEstado(data.estado).map((accion) => <Button key={accion}
                variant="ghost" className={`detalle-accion detalle-accion--${accion}`}
                disabled={enviando || !!edicion || permisoPatchDenegado}
                onClick={() => void gestionar(accion)}>{(accion === 'aprobar' || accion === 'reactivar') &&
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m5 12 4 4L19 6" /></svg>}{ETIQUETAS_ACCION[accion]}</Button>)}
            </div>}
            {enviando && !edicion && <p role="status" className="detalle-nota">Procesando transicion...</p>}
            {avisoCuenta && <p role={avisoCuenta.error ? 'alert' : 'status'} className={avisoCuenta.error ? 'detalle-nota text-destructive' : 'detalle-exito'}>{avisoCuenta.texto}</p>}
          </section></div>
        </div>
      </>}
    </>}
    <Dialog.Root open={edicion !== null} onOpenChange={(abierto) => { if (!abierto) cerrarModal() }}>
      <Dialog.Portal>
        <Dialog.Overlay className="vehiculo-overlay" />
        <Dialog.Content className="vehiculo-modal" onOpenAutoFocus={(evento) => {
          evento.preventDefault(); primerCampo.current?.focus()
        }} onCloseAutoFocus={(evento) => {
          evento.preventDefault()
          if (montado.current && getSessionRevision() === sesion) (botonEditar.current ?? enlaceVolver.current)?.focus()
        }}>
          <div className="vehiculo-modal-heading">
            <div><Dialog.Title>Editar vehiculo</Dialog.Title><Dialog.Description>{nombre}. Solo se envian los campos modificados.</Dialog.Description></div>
            <Button type="button" variant="ghost" aria-label="Cerrar edicion" disabled={enviando} onClick={cerrarModal}>X</Button>
          </div>
          {edicion && <form noValidate aria-busy={enviando} onSubmit={(evento) => { evento.preventDefault(); void guardar() }}>
            <div className="vehiculo-modal-body">
              {sucio && <p role="status" className="vehiculo-borrador">Tienes cambios sin guardar</p>}
              <p className="vehiculo-ayuda">Salir a otra pantalla puede perder el borrador sin confirmacion.</p>
              {falla && <Alert>{falla}</Alert>}
              {guardadoBloqueado && <Alert>
                {permisoPatchDenegado ? 'El guardado sigue bloqueado hasta volver a iniciar sesion con permisos de administrador.' :
                  accesoBloqueado ? `${accesoBloqueado.message}. Este borrador no se puede guardar.` :
                    'El vehiculo cambio, esta ausente o requiere una nueva consulta. El borrador anterior no se puede guardar.'}
              </Alert>}
              <fieldset disabled={enviando || guardadoBloqueado} className="vehiculo-campos">
                {(Object.keys(ETIQUETAS) as (keyof ValoresVehiculo)[]).map((campo) => <div key={campo}>
                  <Label htmlFor={`vehiculo-${campo}`}>{ETIQUETAS[campo]}</Label>
                  <Input id={`vehiculo-${campo}`} ref={campo === 'placa' ? primerCampo : undefined}
                    value={edicion.valores[campo]} inputMode={campo === 'capacidadPasajeros' ? 'numeric' : 'text'}
                    aria-invalid={!!errores[campo]} aria-describedby={`ayuda-${campo}${errores[campo] ? ` error-${campo}` : ''}`}
                    onChange={(evento) => setEdicion({ ...edicion, valores: { ...edicion.valores, [campo]: evento.target.value } })} />
                  <p className="vehiculo-ayuda" id={`ayuda-${campo}`}>{campo === 'capacidadPasajeros' ? 'Numero entero entre 1 y 100.' : 'Entre 1 y 30 caracteres, sin espacios exteriores.'}</p>
                  {errores[campo] && <p id={`error-${campo}`} role="alert" className="text-destructive">{errores[campo]}</p>}
                </div>)}
              </fieldset>
              <Button type="button" variant="ghost" disabled={enviando || isFetching} onClick={() => void refrescar()}>{isFetching ? 'Actualizando...' : 'Actualizar ficha'}</Button>
              {guardadoBloqueado && <Button type="button" variant="ghost" disabled={enviando || isFetching} onClick={() => {
                if (cerrarModal()) void refrescar()
              }}>Descartar y volver a consultar</Button>}
            </div>
            <div className="vehiculo-modal-footer">
              <Button type="button" variant="ghost" disabled={enviando} onClick={cerrarModal}>Cancelar</Button>
              <Button type="submit" disabled={enviando || guardadoBloqueado || !sucio}>{enviando ? 'Guardando...' : 'Guardar vehiculo'}</Button>
            </div>
            <Button className="vehiculo-salir" type="button" variant="ghost" onClick={cerrarSesion}>Cerrar sesion</Button>
          </form>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  </div>
}
