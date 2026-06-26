const DEFAULT_CHARACTERS_PER_LINE = 32

function cleanText(value = '') {
  return String(value)
    .replace(/[\r\t]+/g, ' ')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/</g, '[')
    .replace(/>/g, ']')
    .trim()
}

function fitLine(value = '', width = DEFAULT_CHARACTERS_PER_LINE) {
  const text = cleanText(value)
  if (text.length <= width) return text
  return text.slice(0, Math.max(0, width - 1)) + '.'
}

function wrapText(value = '', width = DEFAULT_CHARACTERS_PER_LINE) {
  const words = cleanText(value).split(/\s+/).filter(Boolean)
  const lines = []
  let current = ''

  for (const word of words) {
    if (!current) current = word
    else if (`${current} ${word}`.length <= width) current = `${current} ${word}`
    else {
      lines.push(current)
      current = word
    }

    while (current.length > width) {
      lines.push(current.slice(0, width))
      current = current.slice(width)
    }
  }

  if (current) lines.push(current)
  return lines.length ? lines : ['']
}

function centerLine(value = '', width = DEFAULT_CHARACTERS_PER_LINE) {
  const text = fitLine(value, width)
  const left = Math.max(0, Math.floor((width - text.length) / 2))
  return `${' '.repeat(left)}${text}`
}

function money(value = 0) {
  return Math.round(Number(value) || 0).toLocaleString('id-ID')
}

function twoColumn(left = '', right = '', width = DEFAULT_CHARACTERS_PER_LINE) {
  const cleanRight = cleanText(right)
  const maxLeft = Math.max(1, width - cleanRight.length - 1)
  const leftLines = wrapText(left, maxLeft)
  const firstLeft = leftLines.shift() || ''
  const space = Math.max(1, width - firstLeft.length - cleanRight.length)
  const lines = [`${firstLeft}${' '.repeat(space)}${cleanRight}`]
  return lines.concat(leftLines).join('\n')
}

function textCommand(lines) {
  return { type: 'text', value: lines.filter(Boolean).join('\n') }
}

export function buildCleanterPayload(snapshot, profile = {}) {
  if (!snapshot || typeof snapshot !== 'object') {
    throw new Error('Cleanter payload requires a receipt snapshot')
  }

  const width = Number(profile.charactersPerLine || snapshot.charactersPerLine || DEFAULT_CHARACTERS_PER_LINE)
  const isKitchen = snapshot.documentType === 'KITCHEN_TICKET'
  const divider = '-'.repeat(width)
  const lines = []

  lines.push(centerLine('SELALUTEH', width))
  lines.push(centerLine(snapshot.outlet?.name || 'SelaluTeh', width))
  for (const addressLine of snapshot.outlet?.addressLines || []) lines.push(centerLine(addressLine, width))
  if (snapshot.mode === 'TEST') lines.push(centerLine('*** TEST MODE ***', width))
  if (snapshot.print?.isReprint) lines.push(centerLine('*** REPRINT ***', width))
  lines.push(centerLine(snapshot.queueNumber || snapshot.orderNumber || '-', width))
  lines.push(centerLine(String(snapshot.documentType || 'RECEIPT').replace(/_/g, ' '), width))
  lines.push(divider)
  lines.push(twoColumn('Invoice', snapshot.orderNumber || '-', width))
  lines.push(twoColumn('Waktu', new Date(snapshot.order?.createdAt || snapshot.print?.generatedAt || Date.now()).toLocaleString('id-ID'), width))
  lines.push(twoColumn('Channel', snapshot.order?.channel || '-', width))
  lines.push(twoColumn('Order', snapshot.order?.status || '-', width))
  if (!isKitchen) lines.push(twoColumn('Payment', snapshot.payment?.status || '-', width))
  lines.push(divider)

  for (const item of snapshot.items || []) {
    lines.push(twoColumn(`${item.quantity}x ${item.name}`, money(item.lineTotal), width))
    if (item.variant) for (const line of wrapText(`  ${item.variant}`, width)) lines.push(line)
    for (const modifier of item.modifiers || []) {
      for (const line of wrapText(`  + ${modifier.name}`, width)) lines.push(line)
    }
  }

  lines.push(divider)
  lines.push(twoColumn('Subtotal', money(snapshot.totals?.subtotal), width))
  if (snapshot.totals?.discountTotal) lines.push(twoColumn('Diskon', `-${money(snapshot.totals.discountTotal)}`, width))
  if (snapshot.totals?.feeTotal) lines.push(twoColumn('Biaya', money(snapshot.totals.feeTotal), width))
  lines.push(twoColumn('TOTAL', money(snapshot.totals?.grandTotal), width))
  lines.push(divider)
  lines.push(fitLine(`Pickup: ${snapshot.order?.pickupContactName || '-'}`, width))
  if (snapshot.order?.pickupContactPhoneMasked) lines.push(fitLine(`Phone : ${snapshot.order.pickupContactPhoneMasked}`, width))
  if (snapshot.order?.notes) for (const line of wrapText(`Note  : ${snapshot.order.notes}`, width)) lines.push(line)
  if (!isKitchen) lines.push(fitLine(`Metode: ${snapshot.payment?.method || '-'}`, width))
  lines.push(divider)
  for (const footerLine of snapshot.footerLines || []) lines.push(centerLine(footerLine, width))
  lines.push(centerLine(`Generated ${new Date(snapshot.print?.generatedAt || Date.now()).toLocaleString('id-ID')}`, width))

  const commands = [textCommand(lines), { type: 'feed', lines: Number(profile.feedLines || 3) }]
  if (profile.supportsCut) commands.push({ type: 'cut' })
  return { commands }
}
