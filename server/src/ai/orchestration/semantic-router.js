const INTENT_PATTERNS = [
  { intent: 'greeting', patterns: [/^halo/i, /^hai/i, /^pagi/i, /^siang/i, /^sore/i, /^malam/i] },
  { intent: 'product_search', patterns: [/cari.*(produk|teh|minuman)/i, /ada.*(teh|produk)/i, /produk.*apa/i, /menu/i] },
  { intent: 'outlet', patterns: [/outlet/i, /cabang/i, /lokasi/i, /dimana/i] },
  // Complaint MUST come before cart — "yang aku beli beda" contains "beli" but is a complaint
  {
    intent: 'complaint',
    patterns: [
      /keluhan/i, /komplain/i, /rusak/i, /kecewa/i, /protes/i, /refund/i, /ganti rugi/i, /retur/i,
      // Past purchase + problem
      /\b(sudah|udah|barusan|baru saja|tadi|kemarin)\b.{0,20}\b(beli|pesan|terima|dapat|order)\b/i,
      /\b(yang\s+(aku|saya|gue|gw)\s+(beli|pesan|terima|dapat))\b.{0,30}\b(beda|salah|berbeda|tidak sesuai|gak sesuai|keliru)\b/i,
      // Product mismatch signals
      /\b(produk|barang|pesanan|order|minuman)\b.{0,25}\b(beda|berbeda|salah|tidak sesuai|gak sesuai|keliru|rusak|kurang)\b/i,
      /\b(beda|berbeda|tidak sesuai|gak sesuai)\b.{0,20}\b(produk|barang|pesanan|order)\b/i,
      // Previous order reference
      /\b(sebelumnya|sebelum ini|yang lalu|pesanan lama|order lama)\b.{0,30}\b(pesanan|order|beli|produk)\b/i,
      /\bmasalah\b.{0,30}\b(pesanan|order|produk|barang|beli)\b/i,
      /\b(pesanan|order|produk)\b.{0,30}\bmasalah\b/i,
      // General wrong/error signal
      /\bsalah\b.{0,20}\b(produk|barang|pesanan|kirim)\b/i,
    ],
  },
  { intent: 'cart', patterns: [/keranjang/i, /cart/i, /\bmau\s+beli\b/i, /mau.*(pesan|beli)/i, /tambah/i] },
  { intent: 'order_status', patterns: [/status.*(pesanan|order)/i, /cek.*(pesanan|order)/i] },
  { intent: 'payment', patterns: [/bayar/i, /pembayaran/i, /payment/i, /lunas/i, /transfer/i] },
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
