# Payment Gateway Design

Dokumen ini menjelaskan rancangan payment gateway untuk Telegram-first Marketplace MVP.

Canonical status values live in `database-schema.md` under **Status Reference**.

## MVP Recommendation

Start with:

```txt
Xendit Test Mode Payment Session
```

Use Xendit-hosted checkout through Payment Session `PAYMENT_LINK` mode. Keep schema generic enough for Midtrans or other providers later.

## Architecture

```txt
Order -> Payment -> Xendit Payment Session -> payment_link_url -> Customer Pays -> Xendit Webhook -> Payment Event -> Update Payment/Order -> Notify Telegram
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

Current implementation stores Xendit Payment Session attempt data on `payments` plus normalized rows in `payment_events`. The existing `payment_attempts` table remains available for future richer attempt history but is not required for the current Xendit session path.

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

For Xendit, `payments.provider_transaction_id` stores `payment_session_id`, `payments.merchant_reference` stores Xendit `reference_id`, `payments.payment_url` stores `payment_link_url`, and `payments.metadata` stores safe provider IDs such as payment request ID, payment ID, business ID, environment, and idempotency key.

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
orders.paid_at = now()
```

`orders.status` remains a fulfillment lifecycle status and must not be moved to `completed` by a payment webhook. The current database enum does not include `pending_payment`, so payment waiting state is represented by `orders.payment_status=pending`.

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
-> call Xendit POST /sessions using backend env secret
-> insert payments row
-> send payment URL to Telegram
```

## Env

```env
PAYMENT_PROVIDER=midtrans
XENDIT_MODE=test
XENDIT_API_BASE_URL=https://api.xendit.co
XENDIT_SECRET_API_KEY=
XENDIT_WEBHOOK_VERIFICATION_TOKEN=
XENDIT_PAYMENT_COUNTRY=ID
XENDIT_PAYMENT_CURRENCY=IDR
XENDIT_PAYMENT_SESSION_MODE=PAYMENT_LINK
XENDIT_PAYMENT_CAPTURE_METHOD=AUTOMATIC
```

Never expose server keys to frontend.

## Provider Payload Concept

```json
{
  "reference_id": "SLT_SMD_ORD202606110001_PAY01",
  "session_type": "PAY",
  "mode": "PAYMENT_LINK",
  "amount": 25000,
  "currency": "IDR",
  "country": "ID",
  "capture_method": "AUTOMATIC",
  "allow_save_payment_method": "DISABLED",
  "customer": {
    "reference_id": "CUSTOMER123",
    "type": "INDIVIDUAL",
    "mobile_number": "+6281234567890",
    "individual_detail": {
      "given_names": "Customer"
    }
  }
}
```

## Webhook Flow

```txt
Provider webhook
-> insert webhook_events / payment_events row
-> verify x-callback-token using XENDIT_WEBHOOK_VERIFICATION_TOKEN
-> find order/payment
-> map provider status
-> update payments.status
-> update orders.payment_status when appropriate
-> insert order_events(paid)
-> notify Telegram
```

Invalid signature:

```txt
payment_events.raw_payload.signature_valid=false
no order/payment update
```

## Status Mapping

| Xendit Session Status | payments.status | orders.payment_status | orders.status |
|---|---|---|---|
| ACTIVE | pending | pending | unchanged |
| COMPLETED | paid | paid | unchanged |
| EXPIRED | expired | expired | unchanged |
| CANCELED | cancelled | failed | unchanged |

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
