const ABBREVIATIONS = {
  'Jl.': 'Jalan',
  'Jln.': 'Jalan',
  'Kec.': 'Kecamatan',
  'Kel.': 'Kelurahan',
};

export function normalizeQuery(fields) {
  let text = '';

  if (fields.rawText) {
    text = fields.rawText;
    const injectionMarkers = ['abaikan', 'ignore', 'tampilkan', 'jangan', 'lupakan', 'perintah'];
    for (const marker of injectionMarkers) {
      const idx = text.toLowerCase().indexOf(marker);
      if (idx >= 0) {
        text = text.slice(0, idx).trim().replace(/[.,;:!?]+$/, '');
      }
    }
  } else {
    const parts = [];
    if (fields.street) parts.push(fields.street);
    if (fields.area) parts.push(fields.area);
    if (fields.landmark) parts.push(fields.landmark);
    if (fields.placeName) parts.push(fields.placeName);
    if (fields.postalCode) parts.push(fields.postalCode);
    if (fields.city) parts.push(fields.city);
    if (fields.province) parts.push(fields.province);
    text = parts.join(', ');
  }

  for (const [abbr, full] of Object.entries(ABBREVIATIONS)) {
    text = text.replace(new RegExp(abbr.replace('.', '\\.'), 'g'), full);
  }

  text = text.replace(/\s+/g, ' ').trim();

  if (fields.city && !text.toLowerCase().includes('indonesia')) {
    text += ', Indonesia';
  }

  return text;
}

export function isNormalizedQueryInjectionSafe(query) {
  const injectionMarkers = ['abaikan', 'ignore', 'tampilkan', 'jangan', 'lupakan', 'perintah'];
  for (const marker of injectionMarkers) {
    if (query.toLowerCase().includes(marker)) return false;
  }
  return true;
}
