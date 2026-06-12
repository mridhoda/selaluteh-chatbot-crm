# Telegram Commerce Flow

Dokumen ini menjelaskan UX dan data flow Telegram-first Marketplace MVP.

## Goal

```txt
/start -> browse products -> product detail -> add to cart -> view cart -> checkout -> payment link -> paid notification
```

## Telegram APIs

Use:

```txt
sendMessage
editMessageText
answerCallbackQuery
sendPhoto optional
inline_keyboard
```

## Callback Payload Convention

Keep payload small and ID-based:

```txt
m:browse:p=1
m:product:<product_id>
m:add:<product_id>:<variant_id_or_none>:1
m:cart
m:checkout
m:clearcart
m:orders
m:admin
```

Never put price/name in callback payload.

## Main Menu

Triggered by `/start`.

Message:

```txt
Halo! Selamat datang 👋
Mau cari produk apa hari ini?
```

Buttons:

```txt
🛍 Lihat Produk
🛒 Keranjang
📦 Pesanan Saya
👩‍💻 Bicara Admin
```

## Browse Products

Backend queries active products and sends paginated list.

Message:

```txt
Produk tersedia:
1. Salty Caramel — Rp25.000
2. Aren Latte — Rp23.000
```

Buttons:

```txt
Salty Caramel
Aren Latte
Next Page
Back to Menu
```

## Product Detail

Backend validates product belongs to workspace, fetches variants, formats price.

Buttons without variant:

```txt
Tambah ke Keranjang
Lihat Keranjang
Kembali
```

With variants:

```txt
Regular — Rp25.000
Large — Rp30.000
Kembali
```

## Add to Cart

Backend:

1. validate product active
2. validate variant active
3. find/create active cart
4. upsert cart item
5. recalculate totals
6. send cart summary

Message:

```txt
✅ Ditambahkan ke keranjang:
Salty Caramel x1
Subtotal: Rp25.000
```

## View Cart

Message:

```txt
Keranjang kamu:
1. Salty Caramel x1 — Rp25.000
2. Aren Latte x2 — Rp46.000

Total: Rp71.000
```

Buttons:

```txt
Checkout
Tambah Lagi
Kosongkan Keranjang
```

## Checkout

If delivery required, ask address and store temporary state:

```json
{"awaiting":"delivery_address","checkout_cart_id":"..."}
```

Then show confirmation:

```txt
Konfirmasi pesanan:
1. Salty Caramel x1 — Rp25.000
Total: Rp25.000
Alamat: ...
Lanjut bayar?
```

Buttons:

```txt
Lanjut Bayar
Ubah Keranjang
Batal
```

## Payment Link

After confirmation:

```txt
Order berhasil dibuat ✅
Order: #ORD-20260611-0001
Total: Rp25.000
Silakan bayar lewat link berikut:
<payment_url>
```

## Payment Success Notification

Triggered by payment webhook:

```txt
Pembayaran berhasil ✅
Order #ORD-20260611-0001 sudah kami terima.
Pesanan kamu akan segera diproses.
```

## My Orders

Find latest orders by contact and show:

```txt
Pesanan terakhir kamu:
#ORD-20260611-0001
Status: Dibayar
Total: Rp25.000
```

## Talk to Admin

Set `chats.is_escalated=true` and optionally notify dashboard.

Message:

```txt
Baik, aku hubungkan ke admin ya 🙏
```

## Text Fallback

Order:

1. deterministic state first
2. command/callback
3. AI fallback

AI can recommend products, backend returns buttons.

## Acceptance Criteria

- `/start` shows menu.
- Product list comes from database.
- Product detail appears.
- Add to cart creates cart item.
- Checkout creates order/order_items.
- Payment link is sent.
- Webhook updates status.
- Paid notification is sent to the correct Telegram chat.
