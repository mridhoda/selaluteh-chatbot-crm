const KNOWN_CITIES = [
  'Samarinda', 'Balikpapan', 'Jakarta', 'Bandung', 'Surabaya',
  'Medan', 'Makassar', 'Yogyakarta', 'Semarang', 'Palembang',
  'Tangerang', 'Bekasi', 'Depok', 'Bogor', 'Malang',
  'Tenggarong', 'Bontang',
];

const ABBREVIATIONS = {
  'jl': 'Jalan',
  'jln': 'Jalan',
  'kec': 'Kecamatan',
  'kel': 'Kelurahan',
};

const MAX_INPUT_LENGTH = 500;

const CUSTOMER_LOCATION_PREFIX_PATTERNS = [
  /^(?:kalau|kalo|jika|misal|misalnya)\s+(?:aku|saya|sy|aq|kami)\s+(?:ada\s+)?di\s+/i,
  /^lokasi\s+(?:ku|aku|saya|kami)\s+(?:ada\s+)?(?:di\s+)?/i,
  /^posisi\s+(?:ku|aku|saya|kami)\s+(?:ada\s+)?(?:di\s+)?/i,
  /^alamat\s+(?:ku|aku|saya|kami)\s+(?:ada\s+)?(?:di\s+)?/i,
  /^(?:aku|saya|kami)\s+(?:ada\s+)?di\s+/i,
  /^(?:lokasiku|posisiku|alamatku)\s+(?:ada\s+)?(?:di\s+)?/i,
];

export function stripCustomerLocationPrefix(text = '') {
  let normalized = String(text || '').trim();
  for (const pattern of CUSTOMER_LOCATION_PREFIX_PATTERNS) {
    normalized = normalized.replace(pattern, '').trim();
  }
  return normalized;
}

export function parseLocationText(text) {
  const result = {
    street: null,
    area: null,
    city: null,
    province: null,
    landmark: null,
    placeName: null,
    postalCode: null,
  };

  if (!text || typeof text !== 'string') return result;

  let normalized = stripCustomerLocationPrefix(text).slice(0, MAX_INPUT_LENGTH);

  const injectionMarkers = ['abaikan', 'ignore', 'tampilkan', 'jangan', 'lupakan'];
  for (const marker of injectionMarkers) {
    const idx = normalized.toLowerCase().indexOf(marker);
    if (idx >= 0) {
      normalized = normalized.slice(0, idx).trim().replace(/[.,;:!?]+$/, '');
    }
  }

  const foundCity = KNOWN_CITIES.find(city =>
    normalized.toLowerCase().includes(city.toLowerCase())
  );
  if (foundCity) {
    result.city = foundCity;
    const withoutCity = normalized.replace(new RegExp(foundCity, 'i'), '').trim();
    parseDetail(withoutCity, result);
  } else {
    parseDetail(normalized, result);
  }

  return result;
}

function parseDetail(text, result) {
  let detail = text;
  for (const [abbr, full] of Object.entries(ABBREVIATIONS)) {
    const regex = new RegExp(`\\b${abbr}\\.?`, 'gi');
    detail = detail.replace(regex, full);
  }

  const landmarkPrefixes = ['dekat', 'di dekat', 'samping', 'sebelah', 'belakang', 'depan'];
  for (const prefix of landmarkPrefixes) {
    const regex = new RegExp(`^${prefix}\\s+(.+)$`, 'i');
    const match = detail.match(regex);
    if (match) {
      result.landmark = match[1].trim();
      return;
    }
  }

  const postalMatch = detail.match(/\b(\d{5})\b/);
  if (postalMatch) {
    result.postalCode = postalMatch[1];
    detail = detail.replace(postalMatch[0], '').trim();
  }

  if (detail) {
    if (result.postalCode && !detail) return;
    if (detail.toLowerCase().includes('jalan') || detail.toLowerCase().includes('jl')) {
      result.street = detail;
    } else {
      result.area = detail;
    }
  }
}
