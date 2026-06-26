import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  buildReceiptSnapshot,
  getReceiptEligibility,
  isAndroidUserAgent,
  maskPhone,
  openReceiptPrintWindow,
  printWithBestAvailableTransport,
  renderReceiptEscPosText,
  renderReceiptHtml,
} from '../src/modules/printing/thermalPrint.js'
import { buildCleanterPayload } from '../src/modules/printing/cleanterCommands.js'
import {
  CleanterError,
  postCleanterPrintJob,
} from '../src/modules/printing/cleanterClient.js'
import { CleanterTransport } from '../src/modules/printing/cleanterTransport.js'
import {
  ANDROID_PRIMARY_TRANSPORT,
  PrinterTransportType,
  resolvePrinterTransport,
} from '../src/modules/printing/transportResolver.js'

const paidOrder = {
  _id: 'order-1',
  orderIdDisplay: '#1023',
  invoiceId: 'INV-1023',
  status: 'completed',
  paymentStatus: 'Paid',
  paymentMethod: 'Xendit Link',
  outlet: 'SelaluTeh Danau Murung',
  channel: 'whatsapp',
  createdAt: '2026-06-25T08:00:00.000Z',
  contactId: { name: 'Rina <script>', phone: '081234567890' },
  itemsList: [
    {
      name: 'Sally <Caramel>',
      qty: 2,
      variant: 'Less Ice & Normal Sugar',
      price: 26000,
    },
  ],
  total: 52000,
  notes: 'Jangan terlalu manis <b>please</b>',
}

describe('thermal print alpha helpers', () => {
  it('allows customer receipt only for verified paid payment state', () => {
    assert.equal(getReceiptEligibility(paidOrder, 'CUSTOMER_RECEIPT').eligible, true)
    assert.deepEqual(
      getReceiptEligibility({ ...paidOrder, paymentStatus: 'pending' }, 'CUSTOMER_RECEIPT'),
      {
        eligible: false,
        reasonCode: 'PAYMENT_NOT_PAID',
        safeMessage: 'Receipt final hanya bisa dicetak setelah pembayaran verified PAID.',
      }
    )
  })

  it('allows kitchen ticket only after outlet approval flow starts', () => {
    assert.equal(getReceiptEligibility({ ...paidOrder, status: 'approved' }, 'KITCHEN_TICKET').eligible, true)
    assert.equal(getReceiptEligibility({ ...paidOrder, status: 'new' }, 'KITCHEN_TICKET').eligible, false)
  })

  it('builds masked snapshots without exposing full phone numbers', () => {
    const snapshot = buildReceiptSnapshot(paidOrder)

    assert.equal(snapshot.order.pickupContactPhoneMasked, '0812****890')
    assert.equal(maskPhone('6281234567890'), '6281****890')
    assert.equal(snapshot.items[0].lineTotal, 52000)
  })

  it('escapes dynamic receipt HTML values', () => {
    const html = renderReceiptHtml(buildReceiptSnapshot(paidOrder))

    assert.match(html, /Sally &lt;Caramel&gt;/)
    assert.match(html, /Rina &lt;script&gt;/)
    assert.match(html, /Jangan terlalu manis &lt;b&gt;please&lt;\/b&gt;/)
    assert.doesNotMatch(html, /Sally <Caramel>/)
  })

  it('marks browser handoff as dispatched but not physically completed', () => {
    const writes = []
    const previousWindow = globalThis.window

    globalThis.window = {
      open: () => ({
        document: {
          open() {},
          write(value) { writes.push(value) },
          close() {},
        },
      }),
    }

    try {
      const result = openReceiptPrintWindow(paidOrder, { autoPrint: true })

      assert.equal(result.dispatched, true)
      assert.equal(result.completed, false)
      assert.equal(result.evidence, 'NONE')
      assert.equal(writes.length, 1)
    } finally {
      globalThis.window = previousWindow
    }
  })

  it('detects Android user agents for Cleanter transport selection', () => {
    assert.equal(isAndroidUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel)'), true)
    assert.equal(isAndroidUserAgent('Mozilla/5.0 (X11; Linux x86_64)'), false)
    assert.equal(ANDROID_PRIMARY_TRANSPORT, PrinterTransportType.CLEANTER)
  })

  it('renders bounded ESC/POS text payload without raw HTML tags', () => {
    const payload = renderReceiptEscPosText(buildReceiptSnapshot(paidOrder))

    assert.match(payload, /\x1B@/)
    assert.match(payload, /SELALUTEH/)
    assert.match(payload, /Sally \[Caramel\]/)
    assert.doesNotMatch(payload, /<script>/)
  })

  it('builds deterministic Cleanter JSON payload with documented commands only', () => {
    const snapshot = buildReceiptSnapshot(paidOrder, { documentType: 'CUSTOMER_RECEIPT' })
    const first = buildCleanterPayload(snapshot, { charactersPerLine: 32, supportsCut: false })
    const second = buildCleanterPayload(snapshot, { charactersPerLine: 32, supportsCut: false })

    assert.deepEqual(first, second)
    assert.equal(Array.isArray(first.commands), true)
    assert.deepEqual([...new Set(first.commands.map((command) => command.type))].sort(), ['feed', 'text'])
    assert.equal(JSON.stringify(first).includes('token='), false)
    assert.equal(JSON.stringify(first).includes('Authorization'), false)
    assert.equal(JSON.stringify(first).includes('081234567890'), false)
    assert.match(first.commands[0].value, /SELALUTEH/)
  })

  it('adds cut command only when profile supports cut', () => {
    const payload = buildCleanterPayload(buildReceiptSnapshot(paidOrder), {
      charactersPerLine: 32,
      supportsCut: true,
    })

    assert.equal(payload.commands.at(-1).type, 'cut')
  })

  it('posts Cleanter print jobs without browser credentials', async () => {
    const calls = []
    const response = await postCleanterPrintJob(
      {
        baseUrl: 'http://localhost:9100',
        printPath: '/print',
        timeoutMs: 1000,
        maxPayloadBytes: 256000,
      },
      { commands: [{ type: 'text', value: 'Hello' }] },
      {
        fetchImpl: async (url, init) => {
          calls.push({ url, init })
          return new Response('{"accepted":true}', { status: 200 })
        },
        setTimeoutImpl: () => 1,
        clearTimeoutImpl: () => {},
      }
    )

    assert.equal(response.ok, true)
    assert.equal(response.status, 200)
    assert.equal(calls[0].url, 'http://localhost:9100/print')
    assert.equal(calls[0].init.credentials, 'omit')
    assert.equal(calls[0].init.cache, 'no-store')
    assert.equal(calls[0].init.headers['Content-Type'], 'application/json')
  })

  it('rejects oversized Cleanter payload before fetch', async () => {
    await assert.rejects(
      postCleanterPrintJob(
        {
          baseUrl: 'http://localhost:9100',
          printPath: '/print',
          timeoutMs: 1000,
          maxPayloadBytes: 10,
        },
        { commands: [{ type: 'text', value: 'payload too large' }] },
        { fetchImpl: async () => new Response('', { status: 200 }) }
      ),
      (error) => error instanceof CleanterError && error.code === 'CLEANTER_PAYLOAD_TOO_LARGE'
    )
  })

  it('maps Cleanter timeout and ambiguous browser fetch failures', async () => {
    await assert.rejects(
      postCleanterPrintJob(
        {
          baseUrl: 'http://localhost:9100',
          printPath: '/print',
          timeoutMs: 1000,
          maxPayloadBytes: 256000,
        },
        { commands: [{ type: 'text', value: 'Hello' }] },
        {
          fetchImpl: async () => {
            throw new DOMException('The operation was aborted.', 'AbortError')
          },
        }
      ),
      (error) => error instanceof CleanterError && error.code === 'CLEANTER_TIMEOUT'
    )

    await assert.rejects(
      postCleanterPrintJob(
        {
          baseUrl: 'http://localhost:9100',
          printPath: '/print',
          timeoutMs: 1000,
          maxPayloadBytes: 256000,
        },
        { commands: [{ type: 'text', value: 'Hello' }] },
        {
          fetchImpl: async () => {
            throw new TypeError('Failed to fetch')
          },
        }
      ),
      (error) => (
        error instanceof CleanterError &&
        error.code === 'CLEANTER_UNAVAILABLE' &&
        error.message.includes('Local Network')
      )
    )
  })

  it('marks Cleanter HTTP success as dispatched but not physically completed', async () => {
    const transport = new CleanterTransport(
      {
        enabled: true,
        baseUrl: 'http://localhost:9100',
        printPath: '/print',
        timeoutMs: 1000,
        maxPayloadBytes: 256000,
        supportsCut: false,
        supportsQr: false,
        supportsBarcode: false,
        supportsImage: false,
      },
      {
        print: async () => ({ ok: true, status: 200, body: { accepted: true } }),
      },
      { userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel)' }
    )

    const result = await transport.print({ snapshot: buildReceiptSnapshot(paidOrder), profile: { charactersPerLine: 32 } })

    assert.equal(result.dispatched, true)
    assert.equal(result.completed, false)
    assert.equal(result.transport, 'CLEANTER')
    assert.equal(result.evidence, 'TRANSPORT_ACK')
  })

  it('resolves Cleanter for Android and Browser Print for Linux', () => {
    const androidTransport = resolvePrinterTransport({
      platform: 'ANDROID',
      transportType: PrinterTransportType.CLEANTER,
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel)',
    })
    const linuxTransport = resolvePrinterTransport({
      platform: 'DESKTOP_LINUX',
      transportType: PrinterTransportType.BROWSER_PRINT,
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
    })

    assert.equal(androidTransport.type, PrinterTransportType.CLEANTER)
    assert.equal(linuxTransport.type, PrinterTransportType.BROWSER_PRINT)
  })

  it('uses Cleanter as best available Android transport', async () => {
    const result = await printWithBestAvailableTransport(paidOrder, {
      documentType: 'CUSTOMER_RECEIPT',
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel)',
      cleanterClient: {
        print: async () => ({ ok: true, status: 200, body: { accepted: true } }),
      },
    })

    assert.equal(result.transport, PrinterTransportType.CLEANTER)
    assert.equal(result.dispatched, true)
    assert.equal(result.completed, false)
  })
})
