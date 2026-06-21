const CONFIRM_PATTERNS = [
  { pattern: /^ya$/i, action: 'confirm' },
  { pattern: /^pilih (yang )?pertama$/i, action: 'select:0' },
  { pattern: /^pilih (yang )?kedua$/i, action: 'select:1' },
  { pattern: /^pilih (yang )?ketiga$/i, action: 'select:2' },
  { pattern: /^pilih alternatif (pertama|1)$/i, action: 'select:0' },
  { pattern: /^pilih alternatif (kedua|2)$/i, action: 'select:1' },
  { pattern: /^pilih alternatif (ketiga|3)$/i, action: 'select:2' },
  { pattern: /^batal$/i, action: 'cancel' },
  { pattern: /^cari lokasi lain$/i, action: 'new_search' },
  { pattern: /^ulang$/i, action: 'new_search' },
];

export function matchConfirmationInput(text) {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  for (const { pattern, action } of CONFIRM_PATTERNS) {
    if (pattern.test(trimmed)) return action;
  }
  return null;
}

export function findOutletByIndex(outlets, index) {
  if (index < 0 || index >= outlets.length) return null;
  return outlets[index];
}
