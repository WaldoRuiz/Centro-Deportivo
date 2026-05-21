export type LoginRequest = {
  correo: string
  password: string
}

export type RegisterRequest = {
  nombre: string
  correo: string
  password: string
  telefono?: string
}

export type AuthUser = {
  idUsuario: number
  nombre: string
  correo: string
  telefono?: string
  rol: string
}

export type LoginResponse = {
  token: string
  usuario: AuthUser
}
