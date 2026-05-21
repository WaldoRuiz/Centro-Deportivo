export type Rol = 'Admin' | 'Administrador' | 'Cliente' | 'Entrenador'

export type Usuario = {
  idUsuario: number
  nombre: string
  correo: string
  telefono?: string
  rol: Rol | string
}

export type CrearEntrenador = {
  nombre: string
  correo: string
  password: string
  telefono?: string
  rol?: string
}

export type Actividad = {
  idActividad: number
  nombre: string
  descripcion?: string
  horarioInicio: string
  horarioFin: string
  cupoMaximo: number
  cupoDisponible: number
  idEntrenador: number
  entrenadorNombre?: string
}

export type CrearActividad = {
  nombre: string
  descripcion?: string
  horarioInicio: string
  horarioFin: string
  cupoMaximo: number
  idEntrenador: number
}

export type Reserva = {
  idReserva: number
  fechaReserva: string
  estado: string
  asistencia: boolean
  idUsuario: number
  idActividad: number
  actividadNombre?: string
  horarioInicio?: string
  horarioFin?: string
}

export type Inscrito = {
  idReserva: number
  idUsuario: number
  nombre: string
  correo: string
  asistencia: boolean
  estado: string
}

export type ReporteActividad = {
  idActividad: number
  actividad: string
  cuposOcupados: number
  asistenciaReal: number
  porcentajeAsistencia: number
}

export type ReporteUsoCliente = {
  idUsuario: number
  cliente: string
  totalReservas: number
  asistencias: number
}

export type ReporteGenerado = {
  fechaInicio: string
  fechaFin: string
  asistenciaPorActividad: ReporteActividad[]
  usoPorCliente: ReporteUsoCliente[]
  topActividades: ReporteActividad[]
}
