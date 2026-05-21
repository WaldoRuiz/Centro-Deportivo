export type HttpMethod = 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT'

export type QueryParams = Record<
  string,
  boolean | number | string | null | undefined
>

export type ApiRequestOptions<TBody = unknown> = {
  body?: TBody
  headers?: HeadersInit
  method?: HttpMethod
  params?: QueryParams
  requiresAuth?: boolean
  signal?: AbortSignal
}
