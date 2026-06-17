export function normalizePhone(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('62')) return '0' + digits.slice(2);
  if (digits.startsWith('0')) return digits;
  if (digits.length >= 10 && !digits.startsWith('0') && !digits.startsWith('62')) return '0' + digits;
  return digits;
}
