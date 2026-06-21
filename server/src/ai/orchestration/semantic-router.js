const INTENT_PATTERNS = [
  { intent: 'greeting', patterns: [/^halo/i, /^hai/i, /^pagi/i, /^siang/i, /^sore/i, /^malam/i] },
  { intent: 'product_search', patterns: [/cari.*(produk|teh|minuman)/i, /ada.*(teh|produk)/i, /produk.*apa/i, /menu/i] },
  { intent: 'outlet', patterns: [/outlet/i, /cabang/i, /lokasi/i, /dimana/i] },
  { intent: 'cart', patterns: [/keranjang/i, /cart/i, /beli/i, /mau.*(pesan|beli)/i, /tambah/i] },
  { intent: 'order_status', patterns: [/status.*(pesanan|order)/i, /cek.*(pesanan|order)/i] },
  { intent: 'payment', patterns: [/bayar/i, /pembayaran/i, /payment/i, /lunas/i, /transfer/i] },
  { intent: 'complaint', patterns: [/keluhan/i, /komplain/i, /rusak/i, /salah/i, /kecewa/i] },
  { intent: 'handoff', patterns: [/admin/i, /manusia/i, /orang/i, /staff/i, /bicara.*(admin|manusia)/i] },
  { intent: 'memory', patterns: [/ingat/i, /simpan/i, /preferensi/i, /suka.*(manis|tawar)/i, /kurang.*(manis|gula)/i] },
];

export function classifyIntent(text) {
  if (!text) return { intent: 'other', confidence: 0, needsTools: false, requiresHuman: false };

  let best = { intent: 'other', confidence: 0, needsTools: false, requiresHuman: false, matchedPattern: null };

  for (const entry of INTENT_PATTERNS) {
    for (const pattern of entry.patterns) {
      if (pattern.test(text)) {
        const confidence = Math.min(1, (text.match(pattern)?.length || 0) + 0.5);
        if (confidence > best.confidence) {
          best = {
            intent: entry.intent,
            confidence,
            needsTools: ['product_search', 'outlet', 'cart', 'order_status', 'payment'].includes(entry.intent),
            requiresHuman: entry.intent === 'handoff' || (entry.intent === 'complaint' && text.length > 100),
            matchedPattern: pattern,
          };
        }
        break;
      }
    }
  }

  return best;
}

export { INTENT_PATTERNS };
