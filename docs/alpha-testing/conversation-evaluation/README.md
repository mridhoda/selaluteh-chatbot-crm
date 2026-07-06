# Conversation Evaluation Dataset

Folder ini berisi dataset evaluasi percakapan untuk alpha testing internal khusus Marketplace / Order Bot.

Tujuan utama dataset ini adalah memastikan bot:
- memahami intent order dengan benar,
- tidak mengarang produk, harga, promo, atau stok,
- menggunakan tool hanya untuk domain marketplace/customer service,
- menjaga konteks cart dan order,
- menolak permintaan di luar scope bisnis,
- aman terhadap prompt injection,
- mampu melakukan human handoff saat diperlukan.

## Files

| File | Purpose |
|---|---|
| `evaluation-schema.yaml` | Struktur standar test case percakapan |
| `happy-path.yaml` | Percakapan order normal dari awal sampai checkout |
| `ambiguous-input.yaml` | Input customer yang tidak jelas dan butuh klarifikasi |
| `out-of-scope.yaml` | Permintaan di luar domain Marketplace / Order Bot |
| `prompt-injection.yaml` | Serangan prompt injection dan data leakage attempt |
| `complaint-handoff.yaml` | Keluhan customer dan eskalasi ke human admin |

## Evaluation Result

Gunakan status berikut saat menjalankan evaluasi:

- `pass`: hasil sesuai expected behavior
- `fail`: hasil tidak sesuai dan perlu bug report
- `blocked`: tidak bisa diuji karena dependency belum siap
- `needs_review`: hasil tidak sepenuhnya salah, tapi perlu review manual

## Suggested Usage

1. Jalankan setiap pesan atau conversation flow ke bot alpha.
2. Catat response bot, tool call, intent, dan route.
3. Bandingkan dengan expected behavior.
4. Jika gagal pada case critical/high, buat bug report menggunakan `06-bug-report-template.md`.
5. Jangan lanjut ke beta sebelum semua critical conversation evaluation pass.
