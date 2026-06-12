# Telegram Bot UX

## Purpose

Define customer-facing UX for Telegram bot commerce.

## Main Menu

Suggested `/start` menu:

```txt
☕ Lihat Produk
🛒 Keranjang
📦 Status Pesanan
💬 Bantuan Admin
```

## Product List Message

Should show:

- product name
- short description
- price
- availability/status
- buttons to view detail

## Product Detail Message

Should show:

- product name
- description
- price
- variant options if any
- image if available
- Add to Cart button
- Back to Products button

## Cart Message

Should show:

- items
- quantity
- price per item
- subtotal
- total
- buttons:
  - update quantity
  - remove item
  - checkout
  - clear cart

## Checkout Message

Should show:

- customer summary
- order items
- total amount
- payment method/link after confirm
- confirm/cancel buttons

## Payment Message

Should show:

```txt
Ini link pembayaran kamu:
<url>

Setelah pembayaran berhasil, aku akan kabari otomatis di sini ya.
```

## Paid Notification

Example:

```txt
Pembayaran berhasil ✅
Pesanan kamu sedang diproses.
```

## Error Messages

If product unavailable:

```txt
Maaf kak, produk ini sedang tidak tersedia.
```

If cart empty:

```txt
Keranjang kamu masih kosong. Mau lihat produk dulu?
```

If payment pending:

```txt
Pembayaran kamu masih pending. Kalau sudah bayar, tunggu sebentar ya.
```

## UX Rule

Critical actions should use buttons, not free text only.
