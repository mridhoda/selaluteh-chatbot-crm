export function maskPhone(phone = '') {
  const normalized = String(phone).replace(/\D/g, '')
  if (normalized.length <= 6) return normalized

  const prefix = normalized.slice(0, 4)
  const suffix = normalized.slice(-3)
  return `${prefix}****${suffix}`
}
