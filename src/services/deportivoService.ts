import { API_ENDPOINTS, apiClient } from './api'
import type {
  Actividad,
  CrearActividad,
  CrearEntrenador,
  Inscrito,
  ReporteGenerado,
  Reserva,
  Usuario,
} from '../types/domain'

type MensajeReserva = {
  mensaje: string
  reserva: Reserva
}

export const deportivoService = {
  actividades: {
    listar() {
      return apiClient.get<Actividad[]>(API_ENDPOINTS.actividades.base, {
        requiresAuth: false,
      })
    },
    crear(payload: CrearActividad) {
      return apiClient.post<Actividad, CrearActividad>(
        API_ENDPOINTS.actividades.base,
        payload,
      )
    },
    actualizar(id: number, payload: CrearActividad & { cupoDisponible?: number }) {
      return apiClient.put<Actividad, typeof payload>(
        `${API_ENDPOINTS.actividades.base}/${id}`,
        payload,
      )
    },
    eliminar(id: number) {
      return apiClient.delete<void>(`${API_ENDPOINTS.actividades.base}/${id}`)
    },
    inscritos(id: number) {
      return apiClient.get<Inscrito[]>(API_ENDPOINTS.actividades.inscritos(id))
    },
  },
  reservas: {
    listarMias() {
      return apiClient.get<Reserva[]>(API_ENDPOINTS.reservas.misReservas)
    },
    crear(idActividad: number) {
      return apiClient.post<MensajeReserva, { idActividad: number }>(
        API_ENDPOINTS.reservas.base,
        { idActividad },
      )
    },
    cancelar(id: number) {
      return apiClient.delete<{ mensaje: string }>(API_ENDPOINTS.reservas.byId(id))
    },
    marcarAsistencia(id: number, asistencia: boolean) {
      return apiClient.put<MensajeReserva, { asistencia: boolean }>(
        API_ENDPOINTS.reservas.asistencia(id),
        { asistencia },
      )
    },
  },
  entrenadores: {
    listar() {
      return apiClient.get<Usuario[]>(API_ENDPOINTS.users.entrenadores)
    },
    crear(payload: CrearEntrenador) {
      return apiClient.post<Usuario, CrearEntrenador>(
        API_ENDPOINTS.users.entrenadores,
        { ...payload, rol: 'Entrenador' },
      )
    },
    actualizar(id: number, payload: Omit<CrearEntrenador, 'password'>) {
      return apiClient.put<Usuario, typeof payload>(
        API_ENDPOINTS.users.entrenadorById(id),
        payload,
      )
    },
    eliminar(id: number) {
      return apiClient.delete<void>(API_ENDPOINTS.users.entrenadorById(id))
    },
  },
  reportes: {
    generar(fechaInicio: string, fechaFin: string) {
      return apiClient.post<
        ReporteGenerado,
        { fechaInicio: string; fechaFin: string; tipo: string }
      >(API_ENDPOINTS.reportes.generar, {
        fechaInicio,
        fechaFin,
        tipo: 'AsistenciaPorActividad',
      })
    },
    exportarCsv(fechaInicio: string, fechaFin: string) {
      return apiClient.get<string>(API_ENDPOINTS.reportes.exportar, {
        params: { formato: 'csv', fechaInicio, fechaFin },
      })
    },
  },
}
