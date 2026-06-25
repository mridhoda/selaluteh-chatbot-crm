const DEFAULT_API_PORT = '5000'

export function getApiBase() {
  const configuredBase = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL
  if (configuredBase) return configuredBase

  if (import.meta.env.DEV && typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }

  if (typeof window !== 'undefined' && window.location?.hostname) {
    return `${window.location.protocol}//${window.location.hostname}:${DEFAULT_API_PORT}`
  }

  return `http://localhost:${DEFAULT_API_PORT}`
}
