export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
  },
  actividades: {
    base: '/actividades',
    inscritos: (id: number) => `/actividades/${id}/inscritos`,
  },
  reservas: {
    base: '/reservas',
    misReservas: '/reservas/mis-reservas',
    asistencia: (id: number) => `/reservas/${id}/asistencia`,
    byId: (id: number) => `/reservas/${id}`,
  },
  reportes: {
    generar: '/reportes/generar',
    exportar: '/reportes/exportar',
  },
  users: {
    entrenadores: '/users/entrenadores',
    entrenadorById: (id: number) => `/users/entrenadores/${id}`,
  },
} as const
