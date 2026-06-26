export const DEFAULT_CLEANTER_CLIENT_CONFIG = {
  baseUrl: 'http://127.0.0.1:9100',
  printPath: '/print',
  timeoutMs: 10000,
  maxPayloadBytes: 256000,
}

export class CleanterError extends Error {
  constructor(code, message, status) {
    super(message)
    this.name = 'CleanterError'
    this.code = code
    this.status = status
  }
}

function parseJsonSafely(value = '') {
  if (!value) return null
  try {
    return JSON.parse(value)
  } catch (_) {
    return value.slice(0, 500)
  }
}

function sanitizeCleanterError(value = '') {
  const text = String(value || '').replace(/[\x00-\x1F\x7F]/g, ' ').trim()
  return text.slice(0, 500) || 'Cleanter menolak print job.'
}

function mapFetchError(error) {
  if (error instanceof CleanterError) return error
  if (error?.name === 'AbortError') {
    return new CleanterError('CLEANTER_TIMEOUT', 'Cleanter tidak merespons sebelum timeout.')
  }
  if (error instanceof TypeError) {
    const message = String(error.message || '').toLowerCase()
    if (message.includes('cors')) {
      return new CleanterError('CLEANTER_CORS_BLOCKED', 'Browser tidak diizinkan mengakses Cleanter local bridge.')
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('failed')) {
      return new CleanterError(
        'CLEANTER_UNAVAILABLE',
        'Browser tidak bisa menghubungi Cleanter local bridge. Penyebab umum: izin Local Network ditolak, CORS Cleanter belum mengizinkan browser, bridge tidak listen di alamat ini, atau Cleanter belum Start.'
      )
    }
  }
  return new CleanterError('CLEANTER_UNKNOWN_ERROR', 'Cleanter print gagal.')
}

export async function postCleanterPrintJob(config, payload, deps = {}) {
  const mergedConfig = { ...DEFAULT_CLEANTER_CLIENT_CONFIG, ...config }
  const serializedPayload = JSON.stringify(payload)
  const payloadSize = new TextEncoder().encode(serializedPayload).byteLength

  if (!payload || !Array.isArray(payload.commands)) {
    throw new CleanterError('CLEANTER_INVALID_PAYLOAD', 'Payload Cleanter harus memiliki commands.')
  }
  if (payloadSize > mergedConfig.maxPayloadBytes) {
    throw new CleanterError(
      'CLEANTER_PAYLOAD_TOO_LARGE',
      `Payload exceeds ${mergedConfig.maxPayloadBytes} bytes`
    )
  }

  const fetchImpl = deps.fetchImpl || globalThis.fetch
  if (typeof fetchImpl !== 'function') {
    throw new CleanterError('CLEANTER_UNAVAILABLE', 'Fetch API tidak tersedia untuk menghubungi Cleanter.')
  }

  const setTimeoutImpl = deps.setTimeoutImpl || globalThis.setTimeout
  const clearTimeoutImpl = deps.clearTimeoutImpl || globalThis.clearTimeout
  const controller = new AbortController()
  const timeout = setTimeoutImpl(() => controller.abort(), mergedConfig.timeoutMs)

  try {
    const response = await fetchImpl(new URL(mergedConfig.printPath, mergedConfig.baseUrl).toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: serializedPayload,
      signal: controller.signal,
      credentials: 'omit',
      cache: 'no-store',
    })
    const responseText = await response.text()

    if (!response.ok) {
      throw new CleanterError('CLEANTER_PRINT_REJECTED', sanitizeCleanterError(responseText), response.status)
    }

    return {
      ok: true,
      status: response.status,
      body: parseJsonSafely(responseText),
    }
  } catch (error) {
    throw mapFetchError(error)
  } finally {
    clearTimeoutImpl(timeout)
  }
}

export class CleanterClient {
  constructor(config = {}, deps = {}) {
    this.config = { ...DEFAULT_CLEANTER_CLIENT_CONFIG, ...config }
    this.deps = deps
  }

  print(payload) {
    return postCleanterPrintJob(this.config, payload, this.deps)
  }
}
