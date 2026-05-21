import { localStorageService } from './localStorage'
import { STORAGE_KEYS } from './storageKeys'

export const tokenStorage = {
  getToken() {
    return localStorageService.getItem<string>(STORAGE_KEYS.authToken)
  },

  setToken(token: string) {
    localStorageService.setItem(STORAGE_KEYS.authToken, token)
  },

  removeToken() {
    localStorageService.removeItem(STORAGE_KEYS.authToken)
  },

  hasToken() {
    return Boolean(this.getToken())
  },
}
