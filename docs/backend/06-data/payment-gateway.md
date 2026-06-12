# Payment Gateway Design

Dokumen ini menjelaskan rancangan payment gateway untuk Telegram-first Marketplace MVP.

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
orders
payments
payment_events
webhook_events optional
```

## Statuses

Internal payment status:

```txt
pending
paid
failed
expired
cancelled
refunded
partial_refund
```

Provider-specific status is stored in:

```txt
payment_events.transaction_status
payment_events.payload
payments.raw_response
```

## Order Status vs Payment Status

Examples:

```txt
orders.status = pending_payment
orders.payment_status = pending
```

After payment success:

```txt
orders.status = paid
orders.payment_status = paid
orders.paid_at = now()
```

When admin starts fulfillment:

```txt
orders.status = processing
orders.payment_status = paid
```

## Create Payment Link Flow

```txt
Checkout confirmed
-> create order pending_payment
-> create order_items
-> call provider
-> insert payments row
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
-> insert payment_events row
-> verify signature
-> find order/payment
-> map provider status
-> update payments.status
-> update orders.payment_status/status
-> notify Telegram
```

Invalid signature:

```txt
payment_events.signature_valid=false
no order/payment update
```

## Status Mapping

| Provider Status | Payment Status | Order Status |
|---|---|---|
| pending | pending | pending_payment |
| settlement | paid | paid |
| capture accepted | paid | paid |
| expire | expired | expired |
| cancel | cancelled | cancelled |
| deny/failure | failed | failed |
| refund | refunded | refunded |

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
payment_proof_file_id
payment_status updated by admin
```

But gateway webhook should be preferred.
