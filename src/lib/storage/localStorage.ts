type StorageValue = boolean | number | object | string | null

const canUseLocalStorage = () => typeof window !== 'undefined'

export const localStorageService = {
  getItem<TValue = unknown>(key: string): TValue | null {
    if (!canUseLocalStorage()) {
      return null
    }

    const rawValue = window.localStorage.getItem(key)

    if (rawValue === null) {
      return null
    }

    try {
      return JSON.parse(rawValue) as TValue
    } catch {
      return rawValue as TValue
    }
  },

  setItem(key: string, value: StorageValue) {
    if (!canUseLocalStorage()) {
      return
    }

    const normalizedValue =
      typeof value === 'string' ? value : JSON.stringify(value)

    window.localStorage.setItem(key, normalizedValue)
  },

  removeItem(key: string) {
    if (!canUseLocalStorage()) {
      return
    }

    window.localStorage.removeItem(key)
  },

  clear() {
    if (!canUseLocalStorage()) {
      return
    }

    window.localStorage.clear()
  },
}
