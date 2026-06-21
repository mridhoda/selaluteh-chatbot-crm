const CANCEL_PATTERNS = [
  /^batal$/i,
  /^ganti lokasi$/i,
  /^cari lokasi lain$/i,
  /^ulang dari awal$/i,
  /^cancel$/i,
  /^restart$/i,
];

export function matchCancellationCommand(text) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim().toLowerCase();
  return CANCEL_PATTERNS.some(pattern => pattern.test(trimmed));
}
