# Telegram Commerce Rules

## Purpose

Defines business behavior for Telegram-first marketplace flow.

## Principle

Telegram is a chat interface. Backend commerce state is the source of truth.

## Start Flow

On `/start`, bot should show:

```txt
welcome message
main menu
browse products
view cart
contact admin / human help
```

If customer already has active cart, bot may show `Continue Cart`.

## Menu Rules

Telegram menu/buttons must never contain trusted price/order/payment state. Callback payload should contain IDs/actions only.

Example safe callback:

```txt
product:view:<product_id>
cart:add:<variant_id>
cart:view
checkout:confirm:<checkout_id>
```

Backend validates every callback.

## Product Browsing

Only active products visible to Telegram customer.

Product detail should include:

- name
- price from backend
- stock/availability if shown
- description
- image if available
- add to cart button

## Cart Rules in Telegram

User can:

- add product
- increase/decrease quantity
- remove item
- view cart
- proceed to checkout

If user uses natural language, AI may interpret intent, but backend must validate final action.

## Checkout Rules

Telegram checkout must show final summary before payment:

```txt
items
quantity
subtotal
fees if any
grand total
payment method
```

User must confirm with button or explicit confirmation text.

## Payment Link Rules

Payment link sent to Telegram only after order/payment record exists.

Message should include:

- order code/reference
- amount
- payment link
- expiry time if available
- status check command/button

## Status Check

User can request status using:

```txt
/status
button: Check Payment Status
text: status pesanan
```

Backend should show latest order/payment status from DB/provider if necessary.

## Human Help

User can request human help anytime.

Allowed triggers:

- button: `Talk to Admin`
- text: `admin`, `cs`, `bantuan`, `operator`
- AI uncertainty/escalation

On human takeover, AI must stop auto-replying for that chat.

## Duplicate Callback Rule

Telegram callbacks can be repeated. Backend must be idempotent.

Examples:

- clicking `Confirm Checkout` twice returns existing order/payment link.
- clicking `Add to Cart` twice intentionally increases quantity only if action semantics say so.
- repeated payment success webhook sends one success notification.

## Error Messages

Customer-facing error should be simple:

```txt
Produk tidak tersedia.
Keranjang kamu kosong.
Harga berubah, ini ringkasan terbaru.
Pembayaran belum berhasil.
Aku hubungkan ke admin ya.
```

Do not expose stack traces, internal IDs, provider secrets, or SQL errors.
