import { getCleanterConfigFromEnv } from './cleanterTransport.js'
import {
  ANDROID_PRIMARY_TRANSPORT,
  PrinterTransportType,
  resolvePrinterTransport,
} from './transportResolver.js'

const DEFAULT_PAPER_WIDTH_MM = 58
const DEFAULT_CHARACTERS_PER_LINE = 32

const PAID_STATUSES = new Set(['paid', 'lunas', 'settled'])
const KITCHEN_PRINTABLE_STATUSES = new Set([
  'approved',
  'preparing',
  'ready',
  'ready_for_pickup',
  'completed',
])

export function escapeReceiptHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function formatReceiptMoney(value = 0) {
  const amount = Number(value) || 0
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`
}

export function maskPhone(value = '') {
  const digits = String(value).replace(/\D/g, '')
  if (digits.length <= 6) return digits
  return `${digits.slice(0, 4)}****${digits.slice(-3)}`
}

function normalizeStatus(value = '') {
  return String(value || '').trim().toLowerCase()
}

export function isAndroidUserAgent(userAgent = globalThis.navigator?.userAgent || '') {
  return /android/i.test(String(userAgent))
}

function normalizeItems(order = {}) {
  const rawItems = Array.isArray(order.itemsList) && order.itemsList.length > 0
    ? order.itemsList
    : Array.isArray(order.items)
      ? order.items
      : []

  return rawItems.map((item) => {
    const quantity = Number(item.qty ?? item.quantity ?? 1) || 1
    const unitPrice = Number(item.price ?? item.unitPrice ?? item.unitPriceMinor ?? 0) || 0
    const lineTotal = Number(item.lineTotal ?? item.lineTotalMinor ?? unitPrice * quantity) || 0

    return {
      name: item.name || item.productNameSnapshot || 'Item',
      variant: item.variant || item.metadata?.variant || '',
      modifiers: Array.isArray(item.modifiers) ? item.modifiers : [],
      quantity,
      unitPrice,
      lineTotal,
    }
  })
}

export function getReceiptEligibility(order = {}, documentType = 'CUSTOMER_RECEIPT') {
  if (!order) {
    return { eligible: false, reasonCode: 'ORDER_NOT_PRINTABLE', safeMessage: 'Order tidak tersedia.' }
  }

  if (documentType === 'TEST_PAGE') {
    return { eligible: true, reasonCode: null, safeMessage: 'Test page siap dicetak.' }
  }

  if (documentType === 'KITCHEN_TICKET') {
    const status = normalizeStatus(order.status)
    const eligible = KITCHEN_PRINTABLE_STATUSES.has(status)
    return {
      eligible,
      reasonCode: eligible ? null : 'ORDER_NOT_PRINTABLE',
      safeMessage: eligible
        ? 'Kitchen ticket siap dicetak.'
        : 'Kitchen ticket hanya untuk order yang sudah disetujui atau diproses.',
    }
  }

  const paymentStatus = normalizeStatus(order.paymentStatus)
  const eligible = PAID_STATUSES.has(paymentStatus)
  return {
    eligible,
    reasonCode: eligible ? null : 'PAYMENT_NOT_PAID',
    safeMessage: eligible
      ? 'Customer receipt siap dicetak.'
      : 'Receipt final hanya bisa dicetak setelah pembayaran verified PAID.',
  }
}

export function buildReceiptSnapshot(order = {}, options = {}) {
  const documentType = options.documentType || 'CUSTOMER_RECEIPT'
  const mode = options.mode || 'LIVE'
  const paperWidthMm = options.paperWidthMm || DEFAULT_PAPER_WIDTH_MM
  const items = normalizeItems(order)
  const subtotal = Number(order.subtotal ?? order.total ?? order.totalAmount ?? items.reduce((sum, item) => sum + item.lineTotal, 0)) || 0
  const feeTotal = Number(order.deliveryFee ?? order.platformFee ?? 0) || 0
  const grandTotal = Number(order.total ?? order.totalAmount ?? subtotal + feeTotal) || 0
  const customerName = order.contactId?.name || order.customerNameSnapshot || order.customer?.name || 'Customer'
  const customerPhone = order.contactId?.phone || order.customerPhoneSnapshot || order.customer?.phone || ''
  const orderId = order.id || order._id || order.orderId
  const orderNumber = order.orderNumber || order.invoiceId || order.orderIdDisplay || orderId || '-'
  const queueNumber = order.queueNumber || order.orderIdDisplay || ''

  return {
    schemaVersion: 1,
    documentType,
    mode,
    workspaceId: order.workspaceId || 'current-workspace',
    outletId: order.outletId || 'current-outlet',
    orderId,
    orderNumber,
    queueNumber,
    paperWidthMm,
    outlet: {
      name: order.outlet || order.outletNameSnapshot || 'SelaluTeh',
      addressLines: Array.isArray(order.outletAddressLines) ? order.outletAddressLines : [],
      phoneMasked: maskPhone(order.outletPhone || ''),
    },
    order: {
      status: order.status || '-',
      fulfillmentType: order.fulfillment || order.fulfillmentType || 'PICKUP',
      channel: order.channel || order.channelSnapshot || order.source || '-',
      createdAt: order.createdAt || new Date().toISOString(),
      completedAt: order.completedAt || null,
      pickupContactName: customerName,
      pickupContactPhoneMasked: maskPhone(customerPhone),
      notes: order.notes || order.note || '',
    },
    items,
    totals: {
      subtotal,
      modifierTotal: 0,
      discountTotal: Number(order.discountAmount || 0) || 0,
      taxTotal: Number(order.taxAmount || 0) || 0,
      feeTotal,
      grandTotal,
    },
    payment: {
      status: order.paymentStatus || 'Unpaid',
      method: order.paymentMethod || '-',
      referenceMasked: order.paymentReference ? maskPhone(order.paymentReference) : '',
      paidAt: order.paidAt || null,
    },
    print: {
      generatedAt: new Date().toISOString(),
      templateVersion: 'thermal-html-v1',
      sourceVersion: String(order.version || order.updatedAt || order.createdAt || 'snapshot'),
      isReprint: Boolean(options.isReprint),
      originalJobId: options.originalJobId || null,
    },
    footerLines: options.footerLines || ['Terima kasih atas pesanan Anda!', 'SelaluTeh'],
  }
}

function renderRows(snapshot) {
  return snapshot.items.map((item) => {
    const variant = item.variant
      ? `<div class="muted small">${escapeReceiptHtml(item.variant)}</div>`
      : ''
    const modifiers = item.modifiers.map((modifier) => (
      `<div class="muted small">+ ${escapeReceiptHtml(modifier.name)}</div>`
    )).join('')

    return `
      <tr>
        <td>
          <strong>${escapeReceiptHtml(item.quantity)}x ${escapeReceiptHtml(item.name)}</strong>
          ${variant}
          ${modifiers}
        </td>
        <td class="right">${escapeReceiptHtml(formatReceiptMoney(item.lineTotal))}</td>
      </tr>
    `
  }).join('')
}

export function renderReceiptHtml(snapshot, options = {}) {
  const autoPrint = Boolean(options.autoPrint)
  const title = `${snapshot.documentType} ${snapshot.orderNumber || ''}`.trim()
  const isKitchen = snapshot.documentType === 'KITCHEN_TICKET'
  const marker = snapshot.mode === 'TEST' ? '<div class="marker">TEST MODE</div>' : ''
  const reprint = snapshot.print.isReprint ? '<div class="marker">REPRINT</div>' : ''
  const bodyOnLoad = autoPrint ? ' onload="window.print()"' : ''
  const footer = snapshot.footerLines.map((line) => `<div>${escapeReceiptHtml(line)}</div>`).join('')

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeReceiptHtml(title)}</title>
    <style>
      @page { margin: 0; }
      * { box-sizing: border-box; }
      body { margin: 0; background: #f3f4f6; color: #000; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace; }
      .toolbar { position: sticky; top: 0; display: flex; gap: 8px; justify-content: center; padding: 12px; background: #111827; }
      .toolbar button { border: 0; border-radius: 8px; padding: 8px 12px; font-weight: 700; cursor: pointer; }
      .receipt { width: ${snapshot.paperWidthMm === 80 ? '72mm' : '48mm'}; min-height: 100vh; margin: 16px auto; padding: 8px 7px 16px; background: #fff; font-size: 11px; line-height: 1.35; }
      .center { text-align: center; }
      .right { text-align: right; white-space: nowrap; }
      .muted { color: #555; }
      .small { font-size: 10px; }
      .brand { font-size: 16px; font-weight: 900; letter-spacing: .08em; }
      .queue { font-size: 22px; font-weight: 900; margin: 6px 0; }
      .marker { border: 1px solid #000; padding: 3px 5px; margin: 6px 0; font-weight: 900; text-align: center; }
      .divider { border-top: 1px dashed #000; margin: 8px 0; }
      table { width: 100%; border-collapse: collapse; }
      th { text-align: left; border-bottom: 1px solid #000; padding: 0 0 4px; }
      td { vertical-align: top; padding: 5px 0; }
      .totals td { padding: 2px 0; }
      .grand td { padding-top: 6px; border-top: 1px solid #000; font-size: 13px; font-weight: 900; }
      .footer { margin-top: 14px; text-align: center; font-size: 10px; }
      @media print {
        body { margin: 0; background: #fff; }
        .toolbar { display: none !important; }
        .receipt { margin: 0; min-height: auto; box-shadow: none; }
      }
    </style>
  </head>
  <body${bodyOnLoad}>
    <div class="toolbar">
      <button onclick="window.print()">Print</button>
      <button onclick="window.close()">Close</button>
    </div>
    <main class="receipt" data-paper="${escapeReceiptHtml(snapshot.paperWidthMm)}">
      <section class="center">
        <div class="brand">SELALUTEH</div>
        <div>${escapeReceiptHtml(snapshot.outlet.name)}</div>
        ${snapshot.outlet.addressLines.map((line) => `<div class="small">${escapeReceiptHtml(line)}</div>`).join('')}
        ${marker}
        ${reprint}
        <div class="queue">${escapeReceiptHtml(snapshot.queueNumber || snapshot.orderNumber)}</div>
        <div>${escapeReceiptHtml(snapshot.documentType.replace(/_/g, ' '))}</div>
      </section>

      <div class="divider"></div>
      <table>
        <tbody>
          <tr><td>Invoice</td><td class="right">${escapeReceiptHtml(snapshot.orderNumber)}</td></tr>
          <tr><td>Waktu</td><td class="right">${escapeReceiptHtml(new Date(snapshot.order.createdAt).toLocaleString('id-ID'))}</td></tr>
          <tr><td>Channel</td><td class="right">${escapeReceiptHtml(snapshot.order.channel)}</td></tr>
          <tr><td>Order</td><td class="right">${escapeReceiptHtml(snapshot.order.status)}</td></tr>
          ${isKitchen ? '' : `<tr><td>Payment</td><td class="right">${escapeReceiptHtml(snapshot.payment.status)}</td></tr>`}
        </tbody>
      </table>

      <div class="divider"></div>
      <table>
        <thead><tr><th>Item</th><th class="right">Total</th></tr></thead>
        <tbody>${renderRows(snapshot)}</tbody>
      </table>

      <div class="divider"></div>
      <table class="totals">
        <tbody>
          <tr><td>Subtotal</td><td class="right">${escapeReceiptHtml(formatReceiptMoney(snapshot.totals.subtotal))}</td></tr>
          ${snapshot.totals.discountTotal ? `<tr><td>Diskon</td><td class="right">-${escapeReceiptHtml(formatReceiptMoney(snapshot.totals.discountTotal))}</td></tr>` : ''}
          ${snapshot.totals.feeTotal ? `<tr><td>Biaya</td><td class="right">${escapeReceiptHtml(formatReceiptMoney(snapshot.totals.feeTotal))}</td></tr>` : ''}
          <tr class="grand"><td>TOTAL</td><td class="right">${escapeReceiptHtml(formatReceiptMoney(snapshot.totals.grandTotal))}</td></tr>
        </tbody>
      </table>

      <div class="divider"></div>
      <div><strong>Pickup:</strong> ${escapeReceiptHtml(snapshot.order.pickupContactName)}</div>
      ${snapshot.order.pickupContactPhoneMasked ? `<div><strong>Phone:</strong> ${escapeReceiptHtml(snapshot.order.pickupContactPhoneMasked)}</div>` : ''}
      ${snapshot.order.notes ? `<div><strong>Catatan:</strong> ${escapeReceiptHtml(snapshot.order.notes)}</div>` : ''}
      ${isKitchen ? '' : `<div><strong>Metode:</strong> ${escapeReceiptHtml(snapshot.payment.method)}</div>`}
      <div class="footer">${footer}</div>
      <div class="center muted small">Generated ${escapeReceiptHtml(new Date(snapshot.print.generatedAt).toLocaleString('id-ID'))}</div>
    </main>
  </body>
</html>`
}

function stripReceiptText(value = '') {
  return String(value)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
}

function fallbackThermalText(value = '') {
  return stripReceiptText(value)
    .replace(/</g, '[')
    .replace(/>/g, ']')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, '-')
}

function fitLine(value = '', width = DEFAULT_CHARACTERS_PER_LINE) {
  const text = fallbackThermalText(value)
  if (text.length <= width) return text
  return text.slice(0, Math.max(0, width - 1)) + '.'
}

function wrapText(value = '', width = DEFAULT_CHARACTERS_PER_LINE) {
  const words = fallbackThermalText(value).split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''

  for (const word of words) {
    if (!current) {
      current = word
    } else if (`${current} ${word}`.length <= width) {
      current = `${current} ${word}`
    } else {
      lines.push(current)
      current = word
    }

    while (current.length > width) {
      lines.push(current.slice(0, width))
      current = current.slice(width)
    }
  }

  if (current) lines.push(current)
  return lines.length > 0 ? lines : ['']
}

function moneyWithoutPrefix(value = 0) {
  return Math.round(Number(value) || 0).toLocaleString('id-ID')
}

function twoColumn(left = '', right = '', width = DEFAULT_CHARACTERS_PER_LINE) {
  const cleanRight = fallbackThermalText(right)
  const maxLeft = Math.max(1, width - cleanRight.length - 1)
  const leftLines = wrapText(left, maxLeft)
  const firstLeft = leftLines.shift() || ''
  const space = Math.max(1, width - firstLeft.length - cleanRight.length)
  const lines = [`${firstLeft}${' '.repeat(space)}${cleanRight}`]

  for (const line of leftLines) {
    lines.push(line)
  }

  return lines.join('\n')
}

function centerLine(value = '', width = DEFAULT_CHARACTERS_PER_LINE) {
  const text = fitLine(value, width)
  const left = Math.max(0, Math.floor((width - text.length) / 2))
  return `${' '.repeat(left)}${text}`
}

export function renderReceiptEscPosText(snapshot, options = {}) {
  const width = Number(options.charactersPerLine || snapshot.charactersPerLine || DEFAULT_CHARACTERS_PER_LINE)
  const isKitchen = snapshot.documentType === 'KITCHEN_TICKET'
  const divider = '-'.repeat(width)
  const ESC = '\x1B'
  const init = `${ESC}@`
  const boldOn = `${ESC}E\x01`
  const boldOff = `${ESC}E\x00`
  const center = `${ESC}a\x01`
  const left = `${ESC}a\x00`
  const feed = '\n\n\n'
  const cut = options.cut === false ? '' : `${ESC}m`
  const lines = []

  lines.push(init)
  lines.push(center)
  lines.push(boldOn + centerLine('SELALUTEH', width) + boldOff)
  lines.push(centerLine(snapshot.outlet.name, width))
  for (const addressLine of snapshot.outlet.addressLines) {
    lines.push(centerLine(addressLine, width))
  }
  if (snapshot.mode === 'TEST') lines.push(centerLine('*** TEST MODE ***', width))
  if (snapshot.print.isReprint) lines.push(centerLine('*** REPRINT ***', width))
  lines.push(boldOn + centerLine(snapshot.queueNumber || snapshot.orderNumber, width) + boldOff)
  lines.push(centerLine(snapshot.documentType.replace(/_/g, ' '), width))
  lines.push(left)
  lines.push(divider)
  lines.push(twoColumn('Invoice', snapshot.orderNumber, width))
  lines.push(twoColumn('Waktu', new Date(snapshot.order.createdAt).toLocaleString('id-ID'), width))
  lines.push(twoColumn('Channel', snapshot.order.channel, width))
  lines.push(twoColumn('Order', snapshot.order.status, width))
  if (!isKitchen) lines.push(twoColumn('Payment', snapshot.payment.status, width))
  lines.push(divider)

  for (const item of snapshot.items) {
    lines.push(twoColumn(`${item.quantity}x ${item.name}`, moneyWithoutPrefix(item.lineTotal), width))
    if (item.variant) {
      for (const variantLine of wrapText(`  ${item.variant}`, width)) lines.push(variantLine)
    }
    for (const modifier of item.modifiers) {
      for (const modifierLine of wrapText(`  + ${modifier.name}`, width)) lines.push(modifierLine)
    }
  }

  lines.push(divider)
  lines.push(twoColumn('Subtotal', moneyWithoutPrefix(snapshot.totals.subtotal), width))
  if (snapshot.totals.discountTotal) lines.push(twoColumn('Diskon', `-${moneyWithoutPrefix(snapshot.totals.discountTotal)}`, width))
  if (snapshot.totals.feeTotal) lines.push(twoColumn('Biaya', moneyWithoutPrefix(snapshot.totals.feeTotal), width))
  lines.push(boldOn + twoColumn('TOTAL', moneyWithoutPrefix(snapshot.totals.grandTotal), width) + boldOff)
  lines.push(divider)
  lines.push(fitLine(`Pickup: ${snapshot.order.pickupContactName}`, width))
  if (snapshot.order.pickupContactPhoneMasked) lines.push(fitLine(`Phone : ${snapshot.order.pickupContactPhoneMasked}`, width))
  if (snapshot.order.notes) {
    for (const noteLine of wrapText(`Note  : ${snapshot.order.notes}`, width)) lines.push(noteLine)
  }
  if (!isKitchen) lines.push(fitLine(`Metode: ${snapshot.payment.method}`, width))
  lines.push(divider)
  for (const footerLine of snapshot.footerLines) lines.push(centerLine(footerLine, width))
  lines.push(centerLine(`Generated ${new Date(snapshot.print.generatedAt).toLocaleString('id-ID')}`, width))
  lines.push(feed + cut)

  return lines.join('\n')
}

export function openReceiptPrintWindow(order, options = {}) {
  const snapshot = buildReceiptSnapshot(order, options)
  const html = renderReceiptHtml(snapshot, { autoPrint: Boolean(options.autoPrint) })
  const printWindow = window.open('', '_blank', options.windowFeatures || 'width=420,height=760')
  if (!printWindow) {
    return { dispatched: false, snapshot, errorCode: 'PRINT_DISPATCH_FAILED' }
  }

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()

  return {
    dispatched: Boolean(options.autoPrint),
    completed: false,
    evidence: 'NONE',
    snapshot,
  }
}

export async function printWithBestAvailableTransport(order, options = {}) {
  const userAgent = options.userAgent ?? globalThis.navigator?.userAgent ?? ''
  const snapshot = buildReceiptSnapshot(order, options)
  if (isAndroidUserAgent(userAgent)) {
    const transport = resolvePrinterTransport({
      platform: 'ANDROID',
      transportType: ANDROID_PRIMARY_TRANSPORT,
      userAgent,
      cleanterClient: options.cleanterClient,
      cleanterConfig: {
        ...getCleanterConfigFromEnv(import.meta.env),
        ...options.cleanterConfig,
      },
    })
    return transport.print({
      snapshot,
      profile: {
        paperWidthMm: options.paperWidthMm || DEFAULT_PAPER_WIDTH_MM,
        charactersPerLine: options.charactersPerLine || DEFAULT_CHARACTERS_PER_LINE,
        supportsCut: options.supportsCut,
      },
    })
  }

  return openReceiptPrintWindow(order, { ...options, autoPrint: options.autoPrint !== false })
}

export { PrinterTransportType }
