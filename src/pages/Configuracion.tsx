import { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, http } from '../api/client'
import { getSessionRevision } from '../api/token'
import type { Configuracion } from '../api/types'
import { useAuth } from '../context/AuthContext'
import { Alert } from '../components/ui/alert'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import {
  CLAVE_CONFIGURACION,
  informacionErrorConfiguracion,
  puedeDispararReintento,
  retryConfiguracion,
} from '../lib/configuracion'
import {
  construirPayload,
  esquemaConfiguracion,
  TELEFONO_FICTICIO,
  tieneEdiciones,
  valoresDesdeConfiguracion,
  type ValoresFormulario,
} from '../lib/configuracionForm'

const MENSAJE_EXITO = 'Cambios guardados.'
const AVISO_BORRADOR = 'Tienes cambios sin guardar'

interface FallaGuardado {
  mensaje: string
  // 404/409 no son transitorios: no se reintenta como si lo fueran ni se deja
  // guardar sobre una fila ausente o eliminada.
  bloqueaGuardado: boolean
}

function fallaDeGuardado(error: unknown): FallaGuardado {
  if (error instanceof ApiError) {
    if (error.status === 400 || error.status === 403) {
      return { mensaje: error.message, bloqueaGuardado: false }
    }
    if (error.status === 404) {
      return {
        mensaje: `${error.message}. No hay una configuración que guardar en la base de datos.`,
        bloqueaGuardado: true,
      }
    }
    if (error.status === 409) {
      return {
        mensaje: `${error.message}. La configuración figura eliminada y esta pantalla no la restaura.`,
        bloqueaGuardado: true,
      }
    }
    if (error.status === 401) {
      return { mensaje: 'La sesión expiró. Vuelve a ingresar para continuar.', bloqueaGuardado: false }
    }
    return {
      mensaje: `El servidor respondió con un error (${error.status}). Tus cambios siguen en el formulario.`,
      bloqueaGuardado: false,
    }
  }
  if (error instanceof TypeError) {
    return {
      mensaje:
        'No se pudo confirmar el guardado: la respuesta del servidor no llegó. Revisa la conexión antes de volver a intentar.',
      bloqueaGuardado: false,
    }
  }
  return {
    mensaje: 'No se pudo confirmar el guardado. Tus cambios siguen en el formulario.',
    bloqueaGuardado: false,
  }
}

function describir(...ids: (string | false | null | undefined)[]) {
  const texto = ids.filter(Boolean).join(' ')
  return texto === '' ? undefined : texto
}

function IconoObjetivo() {
  return (
    <span
      aria-hidden="true"
      className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-ambar"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
        focusable="false"
        className="h-6 w-6"
      >
        <path d="M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0M12 11v2" />
      </svg>
    </span>
  )
}

export default function Configuracion() {
  const { estaAutenticado } = useAuth()
  const queryClient = useQueryClient()

  // Misma entrada que observa el shell: montarse no dispara un GET adicional si
  // el Layout ya dispone del DTO, y una invalidacion explicita si reconcilia.
  const {
    data,
    error: errorLectura,
    isPending,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: CLAVE_CONFIGURACION,
    queryFn: () => http.get<Configuracion>('/api/configuracion'),
    retry: retryConfiguracion,
    enabled: estaAutenticado,
    refetchOnMount: false,
  })

  // Base confirmada del inicio de la edicion. Las diferencias se comparan contra
  // ella y no contra una cache que pueda cambiar mientras el usuario escribe.
  const [base, setBase] = useState<Configuracion | null>(null)
  const [exito, setExito] = useState<string | null>(null)
  const [falla, setFalla] = useState<FallaGuardado | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [bloqueoGuardado, setBloqueoGuardado] = useState(false)
  const enviadoRef = useRef(false)
  const montadoRef = useRef(true)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ValoresFormulario>({
    resolver: zodResolver(esquemaConfiguracion),
    defaultValues: { nombreEmpresa: '', radioMaximoBusquedaKm: '', telefonoCentroAtencion: '' },
  })

  // `watch()` recalcula en cada render: el payload se compara contra la base vigente.
  const valores = watch()
  const payload = base === null ? null : construirPayload(base, valores)
  // Aviso y `beforeunload` siguen diferencias efectivas (payload); las acciones
  // se habilitan con la edicion bruta para que un valor invalido pueda validarse.
  const cambios = payload !== null && Object.keys(payload).length > 0
  const sucio = base !== null && tieneEdiciones(base, valores)

  const cargando = data === undefined && (isPending || isFetching)
  const lecturaNoEditable =
    errorLectura instanceof ApiError && [403, 404, 409].includes(errorLectura.status)
  const lecturaAusente =
    errorLectura instanceof ApiError && (errorLectura.status === 404 || errorLectura.status === 409)
  const guardarBloqueado = bloqueoGuardado || lecturaNoEditable
  const camposBloqueados = guardarBloqueado || enviando
  const formularioVisible = data !== undefined || base !== null
  const confirmado = data ?? base
  const infoLectura = errorLectura ? informacionErrorConfiguracion(errorLectura) : null
  const telefonoActual = valores.telefonoCentroAtencion ?? ''

  const adoptar = useCallback(
    (lecturaConfirmada: Configuracion) => {
      reset(valoresDesdeConfiguracion(lecturaConfirmada))
      setBase(lecturaConfirmada)
    },
    [reset],
  )

  // Sincronizacion: los primeros datos validos inicializan formulario y base; sin
  // ediciones locales se incorporan lecturas confirmadas; con borrador, un refetch
  // nunca lo borra.
  useEffect(() => {
    if (data === undefined || errorLectura !== null) return
    if (base !== null && (cambios || enviando)) return
    adoptar(data)
    setBloqueoGuardado(false)
  }, [adoptar, base, cambios, data, enviando, errorLectura])

  useEffect(() => {
    if (cambios) setExito(null)
  }, [cambios])

  // N1-B: aviso permanente y `beforeunload` solo mientras hay cambios efectivos.
  // No se bloquea la navegacion interna ni el cierre de sesion.
  useEffect(() => {
    if (!cambios) return
    const advertirAntesDeSalir = (evento: BeforeUnloadEvent) => {
      evento.preventDefault()
      evento.returnValue = ''
    }
    window.addEventListener('beforeunload', advertirAntesDeSalir)
    return () => window.removeEventListener('beforeunload', advertirAntesDeSalir)
  }, [cambios])

  useEffect(() => {
    montadoRef.current = true
    return () => {
      montadoRef.current = false
    }
  }, [])

  const vigente = (origen: number) => montadoRef.current && getSessionRevision() === origen

  const restablecer = () => {
    if (camposBloqueados || !sucio || data === undefined) return
    reset(valoresDesdeConfiguracion(data))
    setBase(data)
    setExito(null)
    setFalla(null)
  }

  const guardar = handleSubmit(async (valoresValidados: ValoresFormulario) => {
    if (enviadoRef.current || guardarBloqueado || base === null) return
    // Comprobacion final: nunca se escribe un cuerpo vacio.
    const diferencias = construirPayload(base, valoresValidados)
    if (Object.keys(diferencias).length === 0) return

    enviadoRef.current = true
    setEnviando(true)
    setExito(null)
    setFalla(null)
    const origen = getSessionRevision()
    try {
      const respuesta = await http.put<Configuracion>('/api/configuracion', diferencias)
      // Una respuesta de una sesion anterior no publica cache ni exito.
      if (!vigente(origen)) return
      // Descarta lecturas en vuelo: un GET anterior al guardado no revierte el 200.
      await queryClient.cancelQueries({ queryKey: CLAVE_CONFIGURACION })
      queryClient.setQueryData<Configuracion>(CLAVE_CONFIGURACION, respuesta)
      reset(valoresDesdeConfiguracion(respuesta))
      setBase(respuesta)
      setExito(MENSAJE_EXITO)
      void queryClient.invalidateQueries({ queryKey: CLAVE_CONFIGURACION })
    } catch (error) {
      if (!vigente(origen)) return
      const info = fallaDeGuardado(error)
      setFalla(info)
      if (info.bloqueaGuardado) setBloqueoGuardado(true)
    } finally {
      if (montadoRef.current) setEnviando(false)
      enviadoRef.current = false
    }
  })

  const reintentarLectura = () => {
    if (!puedeDispararReintento(isFetching)) return
    void refetch()
  }

  return (
    <div className="min-w-0">
      <h1 className="font-display text-2xl font-bold text-ink-950">Configuración</h1>
      <p className="mt-1 text-sm text-gris">
        Define la información de la empresa y los parámetros de búsqueda de conductores.
      </p>

      {cambios && (
        <p
          role="status"
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-semibold text-amber-900"
        >
          {AVISO_BORRADOR}
        </p>
      )}

      <div className="mt-6 grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] lg:items-start">
        <div className="min-w-0">
          {cargando && (
            <div
              role="status"
              className="rounded-2xl border border-slate-200 bg-white px-5 py-6"
            >
              <p className="text-sm font-semibold text-ink-950">Cargando configuración…</p>
              <p className="mt-1 text-sm text-gris">
                Consultando <code>GET /api/configuracion</code>. El formulario aparece con los
                valores guardados.
              </p>
            </div>
          )}

          {!cargando && errorLectura !== null && infoLectura !== null && (
            <Alert className="mb-5">
              {exito && (
                <p className="mb-1 font-semibold">
                  Los cambios se guardaron; solo falló la actualización de la información.
                </p>
              )}
              <p>{infoLectura.mensaje}</p>
              {lecturaAusente && (
                <p className="mt-1">
                  {errorLectura.status === 409
                    ? 'La configuración figura eliminada. Esta pantalla no la restaura ni permite guardar sobre ella.'
                    : 'No hay una configuración cargada en la base de datos. Esta pantalla no la crea.'}
                </p>
              )}
              {lecturaNoEditable && (
                <p className="mt-1">Lo escrito se conserva, pero no puede guardarse desde aquí.</p>
              )}
              {infoLectura.recuperable && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={reintentarLectura}
                  disabled={!puedeDispararReintento(isFetching)}
                  className="mt-3 border border-slate-300"
                >
                  {isFetching ? 'Reintentando…' : 'Reintentar'}
                </Button>
              )}
            </Alert>
          )}

          {formularioVisible && (
            <form
              onSubmit={guardar}
              noValidate
              aria-busy={enviando}
              className="min-w-0 rounded-2xl border border-slate-200 bg-white"
            >
              <fieldset disabled={camposBloqueados} className="m-0 min-w-0 border-0 p-0">
                <legend className="px-5 pt-5 text-sm font-semibold text-ink-950 sm:px-6">
                  Información de la empresa
                </legend>
                <p className="px-5 pt-1 text-sm text-gris sm:px-6">
                  Datos de contacto que utiliza el centro de atención.
                </p>

                <div className="space-y-5 px-5 pb-5 pt-4 sm:px-6">
                  <div>
                    <Label htmlFor="nombreEmpresa">Nombre de la empresa</Label>
                    <Input
                      id="nombreEmpresa"
                      autoComplete="organization"
                      aria-invalid={!!errors.nombreEmpresa}
                      aria-describedby={describir(
                        'ayuda-nombreEmpresa',
                        errors.nombreEmpresa && 'error-nombreEmpresa',
                      )}
                      {...register('nombreEmpresa')}
                    />
                    <p id="ayuda-nombreEmpresa" className="mt-2 text-sm text-gris">
                      Se muestra en el encabezado y en la barra lateral del panel.
                    </p>
                    {errors.nombreEmpresa && (
                      <p id="error-nombreEmpresa" role="alert" className="mt-2 text-sm text-destructive">
                        {errors.nombreEmpresa.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="telefonoCentroAtencion">
                      Teléfono del centro de atención{' '}
                      <span className="font-normal text-gris">· Opcional</span>
                    </Label>
                    <Input
                      id="telefonoCentroAtencion"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="+591 4 000 0000"
                      aria-invalid={!!errors.telefonoCentroAtencion}
                      aria-describedby={describir(
                        'ayuda-telefonoCentroAtencion',
                        telefonoActual.trim() === TELEFONO_FICTICIO && 'aviso-telefonoFicticio',
                        errors.telefonoCentroAtencion && 'error-telefonoCentroAtencion',
                      )}
                      {...register('telefonoCentroAtencion')}
                    />
                    <p id="ayuda-telefonoCentroAtencion" className="mt-2 text-sm text-gris">
                      Se ofrece al pasajero cuando no hay conductores disponibles. Vaciarlo lo
                      limpia.
                    </p>
                    {telefonoActual.trim() === TELEFONO_FICTICIO && (
                      <p
                        id="aviso-telefonoFicticio"
                        className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900"
                      >
                        <strong className="font-semibold">Contacto ficticio.</strong>{' '}
                        {TELEFONO_FICTICIO} no es un número operativo del centro de atención. Puedes
                        guardarlo tal cual.
                      </p>
                    )}
                    {errors.telefonoCentroAtencion && (
                      <p
                        id="error-telefonoCentroAtencion"
                        role="alert"
                        className="mt-2 text-sm text-destructive"
                      >
                        {errors.telefonoCentroAtencion.message}
                      </p>
                    )}
                  </div>
                </div>
              </fieldset>

              <fieldset
                disabled={camposBloqueados}
                className="m-0 min-w-0 border-0 border-t border-slate-200 p-0"
              >
                <legend className="px-5 pt-5 text-sm font-semibold text-ink-950 sm:px-6">
                  Búsqueda de conductores
                </legend>
                <p className="px-5 pt-1 text-sm text-gris sm:px-6">
                  Alcance de búsqueda desde el punto de recogida del pasajero.
                </p>

                <div className="px-5 pb-5 pt-4 sm:px-6">
                  <Label htmlFor="radioMaximoBusquedaKm">Radio máximo de búsqueda (km)</Label>
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      id="radioMaximoBusquedaKm"
                      inputMode="numeric"
                      className="w-full sm:w-40"
                      aria-invalid={!!errors.radioMaximoBusquedaKm}
                      aria-describedby={describir(
                        'ayuda-radioMaximoBusquedaKm',
                        errors.radioMaximoBusquedaKm && 'error-radioMaximoBusquedaKm',
                      )}
                      {...register('radioMaximoBusquedaKm')}
                    />
                    <span aria-hidden="true" className="shrink-0 text-sm font-medium text-gris">
                      km
                    </span>
                  </div>
                  <p id="ayuda-radioMaximoBusquedaKm" className="mt-2 text-sm text-gris">
                    Número entero entre 1 y 2147483647 kilómetros.
                  </p>
                  {errors.radioMaximoBusquedaKm && (
                    <p
                      id="error-radioMaximoBusquedaKm"
                      role="alert"
                      className="mt-2 text-sm text-destructive"
                    >
                      {errors.radioMaximoBusquedaKm.message}
                    </p>
                  )}
                </div>
              </fieldset>

              {exito && (
                <p
                  role="status"
                  className="border-t border-slate-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-900 sm:px-6"
                >
                  {exito}
                </p>
              )}
              {falla && (
                <div className="px-5 pt-5 sm:px-6">
                  <Alert>{falla.mensaje}</Alert>
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="text-xs text-gris">
                  Solo se envían los campos modificados.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={restablecer}
                    disabled={!sucio || camposBloqueados || data === undefined}
                    className="border border-slate-300"
                  >
                    Restablecer
                  </Button>
                  <Button
                    type="submit"
                    disabled={!sucio || camposBloqueados || isSubmitting}
                  >
                    {enviando ? 'Guardando…' : 'Guardar cambios'}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>

        <aside
          aria-label="Alcance de búsqueda de conductores"
          className="hidden min-w-0 lg:block"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <IconoObjetivo />
            <h2 className="font-display text-base font-bold text-ink-950">Un alcance adecuado</h2>
            <p className="mt-2 text-sm leading-6 text-gris">
              El sistema busca conductores elegibles dentro del radio configurado y presenta al
              pasajero los tres más cercanos.
            </p>

            <div aria-hidden="true" className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <span className="block h-full w-1/2 rounded-full bg-taxi" />
            </div>
            <p className="mt-3 flex items-center justify-between gap-3 text-sm">
              <span className="text-gris">Radio guardado</span>
              <strong className="font-semibold text-ink-950">
                {confirmado === null || confirmado === undefined
                  ? '—'
                  : `${confirmado.radioMaximoBusquedaKm} km`}
              </strong>
            </p>

            <hr className="my-5 border-slate-200" />

            <h3 className="text-sm font-semibold text-ink-950">Si no hay disponibilidad</h3>
            <p className="mt-2 text-sm leading-6 text-gris">
              El pasajero recibe el teléfono del centro de atención para obtener ayuda.
            </p>
            <p className="mt-2 break-words text-sm font-medium text-ink-950">
              {confirmado?.telefonoCentroAtencion ?? 'Sin teléfono registrado'}
            </p>

            <hr className="my-5 border-slate-200" />

            <p className="text-xs leading-5 text-gris">
              Muestra los valores guardados en <code>GET /api/configuracion</code>. Esta pantalla no
              crea ni restaura la configuración.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
