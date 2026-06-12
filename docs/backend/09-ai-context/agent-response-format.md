# Agent Response Format

Dokumen ini mendefinisikan format response AI/customer-facing dan action-facing.

## Customer-Facing Reply Style

AI reply ke customer harus:

- jelas,
- singkat,
- ramah,
- tidak terlalu teknis,
- tidak menjanjikan hal yang tidak ada di database,
- meminta konfirmasi sebelum checkout/order.

Contoh:

```txt
Siap kak 😊 Ini isi keranjang kakak:
- Salty Caramel x2
Total: Rp50.000

Mau lanjut checkout sekarang?
```

## Action-Facing Output

Jika AI menghasilkan action proposal, format internal harus deterministic.

Recommended structure:

```json
{
  "reply": "Aku temukan beberapa produk yang cocok kak.",
  "actions": [
    {
      "type": "search_products",
      "input": {
        "query": "salty caramel"
      }
    }
  ],
  "handoff": false,
  "confidence": 0.82
}
```

## Rules

- `reply` boleh dikirim ke user setelah backend validasi.
- `actions` harus divalidasi backend.
- Jika confidence rendah, AI harus minta klarifikasi atau handoff.
- Jangan kirim raw JSON internal ke customer.

## Telegram Button Reply

Untuk flow commerce, backend boleh menambahkan inline keyboard:

```json
{
  "text": "Pilih produk:",
  "buttons": [
    { "label": "Salty Caramel", "callback_data": "product:view:<id>" }
  ]
}
```

AI tidak boleh membuat callback id acak. Callback data harus dibuat backend.
