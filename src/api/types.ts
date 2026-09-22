export type EstadoConductor = 'pendiente' | 'aprobado' | 'rechazado' | 'suspendido'
export type EstadoJornada = 'no_iniciada' | 'activa' | 'finalizada'
export type EstadoDisponibilidad = 'disponible' | 'no_disponible' | 'solicitud_pendiente' | 'en_servicio'
export type EstadoSolicitud = 'creada' | 'buscando' | 'conductor_seleccionado'
  | 'esperando_respuesta' | 'aceptada' | 'rechazada' | 'expirada'
  | 'en_servicio' | 'finalizada' | 'sin_conductor'

export interface TokenAdmin {
  token: string
  tokenType: 'Bearer'
  expiresIn: number
}

export interface Configuracion {
  id: number
  nombreEmpresa: string
  radioMaximoBusquedaKm: number
  telefonoCentroAtencion: string | null
  actualizadoEn: string
}

export interface Vehiculo {
  id: string
  placa: string
  marca: string
  modelo: string
  color: string
  capacidadPasajeros: number
}

export interface ConductorListado {
  id: string
  telefono: string
  nombreCompleto: string
  cedulaIdentidad: string
  estado: EstadoConductor
  estadoJornada: EstadoJornada
  estadoDisponibilidad: EstadoDisponibilidad
  creadoEn: string
  vehiculo: Vehiculo | null
}

export interface ConductorDetalle extends ConductorListado {
  usuarioId: string
}

export interface Indicadores {
  conductoresDisponibles: number
  conductoresEnServicio: number
  solicitudesActivas: number
  solicitudesCompletadasHoy: number
}

export interface ConductorMapa {
  id: string
  nombreCompleto: string
  estado: EstadoConductor
  estadoJornada: EstadoJornada
  estadoDisponibilidad: EstadoDisponibilidad
  vehiculo: { placa: string; marca: string; modelo: string; color: string } | null
  ubicacion: { latitud: number; longitud: number; horaRegistro: string } | null
  ultimaUbicacionRegistradaEn: string | null
}

export interface SolicitudActiva {
  id: string
  estado: EstadoSolicitud
  pasajero: { id: string; nombre: string } | null
  conductorAsignado: { id: string; nombreCompleto: string } | null
  latitudRecogida: number
  longitudRecogida: number
  destino: string | null
  expiraEn: string | null
  creadoEn: string
}

export interface Tarifa {
  id: string
  descripcion: string
  monto: string
  vigenciaDesde: string
}
