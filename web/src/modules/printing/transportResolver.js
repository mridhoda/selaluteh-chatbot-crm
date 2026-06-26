import { CleanterTransport } from './cleanterTransport.js'

export const PrinterTransportType = Object.freeze({
  MOCK: 'MOCK',
  BROWSER_PRINT: 'BROWSER_PRINT',
  CLEANTER: 'CLEANTER',
  QZ_TRAY: 'QZ_TRAY',
  LOCAL_AGENT: 'LOCAL_AGENT',
})

export const ANDROID_PRIMARY_TRANSPORT = PrinterTransportType.CLEANTER

export function createBrowserPrintTransport() {
  return {
    type: PrinterTransportType.BROWSER_PRINT,
    isSupported: () => true,
    getCapabilities: async () => ({
      isAvailable: true,
      supportsText: false,
      supportsFeed: false,
      supportsCut: false,
      supportsQr: false,
      supportsBarcode: false,
      supportsImage: false,
    }),
  }
}

export function createMockPrinterTransport() {
  return {
    type: PrinterTransportType.MOCK,
    isSupported: () => true,
    getCapabilities: async () => ({
      isAvailable: true,
      supportsText: true,
      supportsFeed: true,
      supportsCut: true,
      supportsQr: false,
      supportsBarcode: false,
      supportsImage: false,
    }),
    print: async () => ({
      dispatched: true,
      completed: false,
      evidence: 'TRANSPORT_ACK',
      transport: PrinterTransportType.MOCK,
    }),
  }
}

export function resolvePrinterTransport(config = {}) {
  switch (config.transportType) {
    case PrinterTransportType.CLEANTER:
      return new (config.CleanterTransportClass || CleanterTransport)(config.cleanterConfig, config.cleanterClient, {
        userAgent: config.userAgent,
      })
    case PrinterTransportType.BROWSER_PRINT:
      return createBrowserPrintTransport()
    case PrinterTransportType.MOCK:
      return createMockPrinterTransport()
    case PrinterTransportType.QZ_TRAY:
    case PrinterTransportType.LOCAL_AGENT:
      throw new Error(`Unsupported transport: ${config.transportType}`)
    default:
      throw new Error(`Unsupported transport: ${config.transportType}`)
  }
}
