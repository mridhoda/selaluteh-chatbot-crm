# Payment Gateway Design

Dokumen ini menjelaskan rancangan payment gateway untuk Telegram-first Marketplace MVP.

Canonical status values live in `database-schema.md` under **Status Reference**.

## MVP Recommendation

Start with:

```txt
Midtrans Sandbox Payment Link / Snap Redirect
```

Keep schema generic enough for Xendit later.

## Architecture

```txt
Order -> Payment -> Provider Transaction -> Payment URL -> Customer Pays -> Provider Webhook -> Payment Event -> Update Payment/Order -> Notify Telegram
```

## Tables

```txt
payment_provider_settings
orders
order_items
order_events
payments
payment_attempts
payment_events
webhook_events
```

## Statuses

Internal payment record status (`payments.status`):

```txt
pending
paid
failed
expired
cancelled
refunded
```

Order payment status (`orders.payment_status`):

```txt
unpaid
pending
paid
failed
expired
refunded
```

Order lifecycle status (`orders.status`):

```txt
new
accepted
preparing
ready
completed
cancelled
```

Fulfillment status (`orders.fulfillment_status`):

```txt
unfulfilled
preparing
ready
fulfilled
cancelled
```

Provider-specific status is stored in:

```txt
payment_events.raw_payload
payments.metadata
```

## Order Status vs Payment Status

Important rule:

```txt
orders.status != orders.payment_status
orders.fulfillment_status tracks kitchen/ops progress separately
```

Examples:

```txt
Checkout confirmed:
  orders.status = new
  orders.payment_status = pending
  orders.fulfillment_status = unfulfilled
```

After payment success:

```txt
payments.status = paid
orders.payment_status = paid
orders.status = accepted
orders.paid_at = now()
```

When admin starts fulfillment:

```txt
orders.status = preparing
orders.fulfillment_status = preparing
orders.payment_status = paid
```

## Create Payment Link Flow

```txt
Checkout confirmed
-> create order new with payment_status pending
-> create order_items
-> insert order_events(created)
-> call provider using payment_provider_settings
-> insert payments row
-> insert payment_attempts row
-> send payment URL to Telegram
```

## Env

```env
PAYMENT_PROVIDER=midtrans
PAYMENT_MODE=sandbox
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
MIDTRANS_IS_PRODUCTION=false
MIDTRANS_NOTIFICATION_SECRET=
```

Never expose server keys to frontend.

## Provider Payload Concept

```json
{
  "transaction_details": {
    "order_id": "ORD-20260611-0001",
    "gross_amount": 25000
  },
  "customer_details": {
    "first_name": "Telegram User",
    "phone": "..."
  },
  "item_details": [
    {"id":"COF-SALTY-CARAMEL","price":25000,"quantity":1,"name":"Salty Caramel"}
  ]
}
```

## Webhook Flow

```txt
Provider webhook
-> insert webhook_events / payment_events row
-> verify signature using payment_provider_settings.webhook_secret_encrypted
-> find order/payment
-> map provider status
-> update payments.status
-> update orders.payment_status and lifecycle status when appropriate
-> insert order_events(paid)
-> notify Telegram
```

Invalid signature:

```txt
payment_events.raw_payload.signature_valid=false
no order/payment update
```

## Status Mapping

| Provider Status | payments.status | orders.payment_status | orders.status |
|---|---|---|---|
| pending | pending | pending | new |
| settlement | paid | paid | accepted |
| capture accepted | paid | paid | accepted |
| expire | expired | expired | new |
| cancel | cancelled | failed | cancelled |
| deny/failure | failed | failed | new |
| refund | refunded | refunded | cancelled |

## Idempotency

- Duplicate provider webhook must not duplicate side effects.
- If payment already paid, do not downgrade to pending.
- Pending can move to paid/failed/expired/cancelled.
- Paid/refunded are terminal unless explicit admin workflow.

## Telegram Notification

Success:

```txt
Pembayaran berhasil ✅
Order #ORD-xxxx sudah kami terima dan akan diproses.
```

Expired:

```txt
Link pembayaran untuk Order #ORD-xxxx sudah kedaluwarsa.
Silakan checkout ulang atau hubungi admin.
```

## Manual Payment Compatibility

Existing manual QRIS/proof can stay as fallback:

```txt
provider=manual
orders.payment_proof_file_id
orders.payment_status updated by admin
```

But gateway webhook should be preferred.
