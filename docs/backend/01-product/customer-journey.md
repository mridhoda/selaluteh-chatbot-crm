# Customer Journey

## Journey Overview

Customer journey MVP dimulai dan berakhir di Telegram, dengan backend sebagai commerce engine.

```txt
Awareness
↓
Start Bot
↓
Browse/Search Product
↓
Ask AI
↓
Add to Cart
↓
Checkout Confirmation
↓
Payment Link
↓
Payment Success
↓
Order Fulfillment
↓
Post-Purchase Support
```

## Stage 1 — Start Bot

Customer membuka bot dan mengirim `/start`.

Backend actions:

- find platform,
- upsert contact,
- upsert chat,
- save message,
- send welcome menu.

Customer sees:

- welcome message,
- browse products button,
- view cart button,
- talk to admin option.

## Stage 2 — Product Discovery

Customer memilih browse products atau bertanya ke AI.

Backend actions:

- query active products by workspace,
- return paginated list,
- optionally let AI explain product.

Customer sees:

- product names,
- prices,
- category/variant info,
- detail button.

## Stage 3 — Product Decision

Customer membuka product detail.

Backend actions:

- validate product active,
- fetch images/variants,
- render product detail message.

Customer sees:

- product description,
- price,
- variant options,
- add to cart button.

## Stage 4 — Cart

Customer menambahkan produk ke cart.

Backend actions:

- create/reuse active cart,
- add/update cart item,
- calculate subtotal,
- return cart summary.

Customer sees:

- item added confirmation,
- view cart button,
- checkout button.

## Stage 5 — Checkout

Customer melakukan checkout.

Backend actions:

- validate cart,
- lock/confirm cart snapshot,
- create checkout session,
- ask explicit confirmation,
- create pending order after confirmation.

Customer sees:

- final item list,
- total amount,
- payment method instruction,
- confirm checkout button.

## Stage 6 — Payment

Customer menerima payment link.

Backend actions:

- create payment record,
- request payment link from sandbox provider,
- save provider transaction id,
- send link to Telegram.

Customer sees:

- payment link,
- payment expiry note,
- order id/reference.

## Stage 7 — Payment Success

Payment provider mengirim webhook.

Backend actions:

- verify signature,
- save payment event,
- update payment status,
- update order status,
- send Telegram notification.

Customer sees:

- payment success confirmation,
- next step/order processing info.

## Stage 8 — Fulfillment

Admin memproses order.

Backend actions:

- admin updates fulfillment status,
- optional notification to customer.

Customer sees:

- status update if enabled.

## Failure Points

| Stage | Possible Failure | Expected Response |
|---|---|---|
| Start bot | Platform token invalid | log error and return safe fallback if possible |
| Product browse | No active products | show empty catalog message |
| Add to cart | Product inactive | reject and show unavailable message |
| Checkout | Cart empty | ask customer to add product first |
| Payment | Provider error | show retry/manual fallback |
| Webhook | Duplicate event | ignore duplicate safely |
| Fulfillment | Admin delay | customer can ask status |
