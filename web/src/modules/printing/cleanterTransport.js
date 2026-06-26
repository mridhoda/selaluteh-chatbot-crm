import { buildCleanterPayload } from './cleanterCommands.js'
import { CleanterClient, CleanterError, DEFAULT_CLEANTER_CLIENT_CONFIG } from './cleanterClient.js'

function isAndroidUserAgent(userAgent = globalThis.navigator?.userAgent || '') {
  return /android/i.test(String(userAgent))
}

export function getCleanterConfigFromEnv(env = {}) {
  return {
    enabled: env.VITE_CLEANTER_ENABLED !== 'false',
    baseUrl: env.VITE_CLEANTER_BASE_URL || DEFAULT_CLEANTER_CLIENT_CONFIG.baseUrl,
    printPath: env.VITE_CLEANTER_PRINT_PATH || DEFAULT_CLEANTER_CLIENT_CONFIG.printPath,
    timeoutMs: Number(env.VITE_CLEANTER_TIMEOUT_MS || DEFAULT_CLEANTER_CLIENT_CONFIG.timeoutMs),
    maxPayloadBytes: Number(env.VITE_CLEANTER_MAX_PAYLOAD_BYTES || DEFAULT_CLEANTER_CLIENT_CONFIG.maxPayloadBytes),
    supportsCut: env.VITE_CLEANTER_SUPPORTS_CUT === 'true',
    supportsQr: false,
    supportsBarcode: false,
    supportsImage: false,
  }
}

export class CleanterTransport {
  constructor(config = {}, client, platform = {}) {
    this.type = 'CLEANTER'
    this.config = { ...getCleanterConfigFromEnv({}), ...config }
    this.client = client || new CleanterClient(this.config)
    this.platform = platform
  }

  isSupported() {
    const userAgent = this.platform.userAgent ?? globalThis.navigator?.userAgent ?? ''
    return Boolean(this.config.enabled && isAndroidUserAgent(userAgent))
  }

  async getCapabilities() {
    return {
      isAvailable: this.isSupported(),
      supportsText: true,
      supportsFeed: true,
      supportsCut: Boolean(this.config.supportsCut),
      supportsQr: Boolean(this.config.supportsQr),
      supportsBarcode: Boolean(this.config.supportsBarcode),
      supportsImage: Boolean(this.config.supportsImage),
    }
  }

  async print(input = {}) {
    if (!this.config.enabled) return this.failure('CLEANTER_DISABLED', 'Cleanter transport dinonaktifkan.')
    if (!this.isSupported()) return this.failure('CLEANTER_UNSUPPORTED_PLATFORM', 'Cleanter hanya didukung pada Android.')
    if (!input.snapshot) return this.failure('CLEANTER_INVALID_PAYLOAD', 'Receipt snapshot tidak tersedia.')

    try {
      const payload = buildCleanterPayload(input.snapshot, {
        supportsCut: this.config.supportsCut,
        ...input.profile,
      })
      const response = await this.client.print(payload)
      return {
        dispatched: true,
        completed: false,
        evidence: 'TRANSPORT_ACK',
        transport: this.type,
        transportReference: response.status ? `cleanter:${response.status}` : 'cleanter',
        rawResponse: response.body,
      }
    } catch (error) {
      if (error instanceof CleanterError) return this.failure(error.code, userMessageForCleanterError(error.code), error.message)
      return this.failure('CLEANTER_UNKNOWN_ERROR', userMessageForCleanterError('CLEANTER_UNKNOWN_ERROR'))
    }
  }

  failure(errorCode, safeMessage, errorMessage = safeMessage) {
    return {
      dispatched: false,
      completed: false,
      evidence: 'NONE',
      transport: this.type,
      errorCode,
      errorMessage,
      safeMessage,
    }
  }
}

export function userMessageForCleanterError(code) {
  const messages = {
    CLEANTER_DISABLED: 'Cleanter transport dinonaktifkan.',
    CLEANTER_UNSUPPORTED_PLATFORM: 'Cleanter hanya tersedia untuk Android. Gunakan Browser Print di desktop.',
    CLEANTER_NOT_CONFIGURED: 'Cleanter belum dikonfigurasi.',
    CLEANTER_UNAVAILABLE: 'Browser tidak bisa menghubungi Cleanter local bridge. Pastikan Cleanter sudah Start, izin Local Network Chrome diizinkan, dan coba base URL 127.0.0.1 atau localhost sesuai Cleanter.',
    CLEANTER_CONNECTION_REFUSED: 'Cleanter local bridge tidak dapat dihubungi.',
    CLEANTER_CORS_BLOCKED: 'Browser tidak diizinkan mengakses Cleanter local bridge.',
    CLEANTER_LOCAL_NETWORK_PERMISSION_DENIED: 'Berikan izin Local Network pada Chrome untuk mencetak.',
    CLEANTER_TIMEOUT: 'Cleanter tidak merespons. Periksa aplikasi dan koneksi printer.',
    CLEANTER_PAYLOAD_TOO_LARGE: 'Payload struk terlalu besar untuk dikirim ke Cleanter.',
    CLEANTER_INVALID_PAYLOAD: 'Payload struk tidak valid untuk Cleanter.',
    CLEANTER_PRINT_REJECTED: 'Cleanter menolak print job. Jalankan Test Print dari Cleanter.',
    CLEANTER_INVALID_RESPONSE: 'Cleanter mengembalikan respons yang tidak dikenali.',
    CLEANTER_UNKNOWN_ERROR: 'Cleanter print gagal.',
  }
  return messages[code] || messages.CLEANTER_UNKNOWN_ERROR
}
