const DEFAULT_API_TIMEOUT_MS = 15000

const parseNumber = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback
  }

  const parsedValue = Number(value)

  return Number.isFinite(parsedValue) ? parsedValue : fallback
}

export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '',
  apiTimeoutMs: parseNumber(
    import.meta.env.VITE_API_TIMEOUT_MS,
    DEFAULT_API_TIMEOUT_MS,
  ),
} as const
