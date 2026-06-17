# Order Fulfillment Flow

Dokumen ini menjelaskan flow order setelah payment berhasil hingga completed/cancelled.

## Order Sources

| Source | Description |
|---|---|
| `telegram` | Order created from Telegram cart/checkout |
| `ai_form` | Legacy order created from AI `FILE_ORDER_JSON` marker |
| `admin` | Order manually created by admin if supported |

## Recommended Order Statuses

```txt
new
accepted
preparing
ready
completed
cancelled
```

Payment state is tracked separately in `orders.payment_status`.

## Fulfillment Happy Path

```mermaid
flowchart TD
  A[Order new, payment pending] --> B[Payment webhook paid]
  B --> C[Order accepted]
  C --> D[Admin sees paid order]
  D --> E[Admin marks preparing]
  E --> F[Backend optionally notifies user]
  F --> G[Admin marks ready]
  G --> H[Admin marks completed]
  H --> I[Backend notifies user]
```

## Admin Update Flow

```txt
Admin opens Orders
-> filters paid orders
-> opens order detail
-> checks item/payment/customer info
-> updates status to preparing/ready/completed/cancelled
-> backend validates transition
-> backend writes audit log if available
-> backend sends Telegram notification if enabled
```

## Status Transition Rules

| From | To | Allowed Actor | Notes |
|---|---|---|---|
| new | accepted | Payment webhook | Normal payment success |
| new | cancelled | Admin/system | Payment expired/cancelled |
| accepted | preparing | Admin | Start fulfillment |
| preparing | ready | Admin | Ready for pickup/delivery |
| ready | completed | Admin | Finish order |
| accepted | cancelled | Admin | Requires reason |
| completed | completed | Admin/payment process | Refund changes payment status, not lifecycle status |

## Telegram Notifications

Recommended notification events:

| Event | Message |
|---|---|
| Order accepted | Pembayaran berhasil, pesanan diproses |
| Order preparing | Pesanan sedang disiapkan |
| Order completed | Pesanan selesai, terima kasih |
| Order cancelled | Pesanan dibatalkan, alasan: ... |

## Order Detail for Admin

Order detail should show:

```txt
Order ID
Customer/contact
Chat link
Product items
Subtotal/grand total
Payment status
Payment provider reference
Fulfillment status
Notes
Timestamps
```

## Order Immutability Rule

After order is created:

- Do not mutate `order_items` casually.
- If correction is needed, use adjustment/refund/manual admin note.
- Product price/name changes should not affect existing order items.

## Edge Cases

| Case | Behavior |
|---|---|
| Payment paid after order cancelled | Flag for admin review |
| Admin cancels paid order | Require reason and refund policy |
| User asks order status | Bot reads latest order/payment/fulfillment status |
| Product deleted after order | Order item snapshots remain visible |
