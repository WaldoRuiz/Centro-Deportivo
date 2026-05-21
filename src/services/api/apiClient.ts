import { env } from '../../config/env'
import { tokenStorage } from '../../lib/storage'
import { ApiError } from './apiError'
import type { ApiRequestOptions, QueryParams } from './types'

const JSON_CONTENT_TYPE = 'application/json'

const buildUrl = (path: string, params?: QueryParams) => {
  const baseUrl = env.apiBaseUrl.replace(/\/$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`

  if (!baseUrl) {
    const searchParams = new URLSearchParams()

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          searchParams.set(key, String(value))
        }
      })
    }

    const queryString = searchParams.toString()

    return queryString ? `${normalizedPath}?${queryString}` : normalizedPath
  }

  const url = new URL(`${baseUrl}${normalizedPath}`)

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    })
  }

  return url.toString()
}

const parseResponse = async <TResponse>(response: Response) => {
  if (response.status === 204) {
    return null as TResponse
  }

  const contentType = response.headers.get('content-type')

  if (contentType?.includes(JSON_CONTENT_TYPE)) {
    return (await response.json()) as TResponse
  }

  return (await response.text()) as TResponse
}

export const apiClient = {
  async request<TResponse, TBody = unknown>(
    path: string,
    options: ApiRequestOptions<TBody> = {},
  ) {
    const controller = new AbortController()
    const timeoutId = window.setTimeout(
      () => controller.abort(),
      env.apiTimeoutMs,
    )

    const headers = new Headers(options.headers)
    const token = tokenStorage.getToken()

    if (options.body !== undefined && !headers.has('Content-Type')) {
      headers.set('Content-Type', JSON_CONTENT_TYPE)
    }

    if (options.requiresAuth !== false && token) {
      headers.set('Authorization', `Bearer ${token}`)
    }

    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort(), {
        once: true,
      })
    }

    try {
      const response = await fetch(buildUrl(path, options.params), {
        body:
          options.body !== undefined ? JSON.stringify(options.body) : undefined,
        headers,
        method: options.method ?? 'GET',
        signal: controller.signal,
      })
      const data = await parseResponse<TResponse>(response)

      if (!response.ok) {
        throw new ApiError(response.statusText, response.status, data)
      }

      return data
    } finally {
      window.clearTimeout(timeoutId)
    }
  },

  get<TResponse>(path: string, options?: ApiRequestOptions) {
    return this.request<TResponse>(path, { ...options, method: 'GET' })
  },

  post<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: ApiRequestOptions<TBody>,
  ) {
    return this.request<TResponse, TBody>(path, {
      ...options,
      body,
      method: 'POST',
    })
  },

  put<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: ApiRequestOptions<TBody>,
  ) {
    return this.request<TResponse, TBody>(path, {
      ...options,
      body,
      method: 'PUT',
    })
  },

  patch<TResponse, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: ApiRequestOptions<TBody>,
  ) {
    return this.request<TResponse, TBody>(path, {
      ...options,
      body,
      method: 'PATCH',
    })
  },

  delete<TResponse>(path: string, options?: ApiRequestOptions) {
    return this.request<TResponse>(path, { ...options, method: 'DELETE' })
  },
}
