import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  buildReceiptSnapshot,
  buildRawBtUrl,
  getReceiptEligibility,
  isAndroidUserAgent,
  maskPhone,
  openReceiptPrintWindow,
  openRawBtPrint,
  renderReceiptEscPosText,
  renderReceiptHtml,
} from '../src/modules/printing/thermalPrint.js'

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

  it('detects Android user agents for RawBT transport selection', () => {
    assert.equal(isAndroidUserAgent('Mozilla/5.0 (Linux; Android 14; Pixel)'), true)
    assert.equal(isAndroidUserAgent('Mozilla/5.0 (X11; Linux x86_64)'), false)
  })

  it('renders bounded ESC/POS text payload without raw HTML tags', () => {
    const payload = renderReceiptEscPosText(buildReceiptSnapshot(paidOrder))

    assert.match(payload, /\x1B@/)
    assert.match(payload, /SELALUTEH/)
    assert.match(payload, /Sally \[Caramel\]/)
    assert.doesNotMatch(payload, /<script>/)
  })

  it('builds RawBT deep links without auth tokens', () => {
    const { primaryUrl, intentUrl, sizeBytes } = buildRawBtUrl('hello receipt')

    assert.match(primaryUrl, /^rawbt:base64,/)
    assert.match(intentUrl, /^intent:base64,/) 
    assert.equal(primaryUrl.includes('token='), false)
    assert.equal(intentUrl.includes('Authorization'), false)
    assert.equal(sizeBytes, 13)
  })

  it('marks RawBT handoff as dispatched but not completed on Android', () => {
    const locationRef = { href: '' }
    const result = openRawBtPrint(paidOrder, {
      documentType: 'CUSTOMER_RECEIPT',
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel)',
      locationRef,
    })

    assert.equal(result.dispatched, true)
    assert.equal(result.completed, false)
    assert.equal(result.transport, 'RAWBT')
    assert.equal(result.evidence, 'NONE')
    assert.match(locationRef.href, /^intent:base64,/)
  })

  it('rejects RawBT transport outside Android', () => {
    const result = openRawBtPrint(paidOrder, {
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64)',
      locationRef: { href: '' },
    })

    assert.equal(result.dispatched, false)
    assert.equal(result.errorCode, 'TRANSPORT_UNSUPPORTED')
  })
})
