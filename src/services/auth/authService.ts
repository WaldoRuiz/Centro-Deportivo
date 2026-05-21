import { API_ENDPOINTS, apiClient } from '../api'
import { tokenStorage } from '../../lib/storage'
import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
} from './types'

export const authService = {
  async login(credentials: LoginRequest) {
    const response = await apiClient.post<LoginResponse, LoginRequest>(
      API_ENDPOINTS.auth.login,
      credentials,
      { requiresAuth: false },
    )

    tokenStorage.setToken(response.token)

    return response
  },

  async register(payload: RegisterRequest) {
    return apiClient.post<AuthUser, RegisterRequest>(
      API_ENDPOINTS.auth.register,
      payload,
      { requiresAuth: false },
    )
  },

  logout() {
    tokenStorage.removeToken()
  },
}
