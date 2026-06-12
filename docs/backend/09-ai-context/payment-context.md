# Payment Context

Dokumen ini memberi context payment gateway untuk AI coding agent.

## Current Payment State

Existing app hanya punya manual payment instruction/QRIS proof style. Belum ada gateway sandbox.

## Target MVP Payment

Gunakan payment provider abstraction:

```txt
PaymentProvider
  createPaymentLink(order)
  verifyWebhook(payload, headers)
  normalizeStatus(event)
```

Provider awal boleh:

- Midtrans sandbox, atau
- Xendit sandbox, atau
- mock provider untuk local development.

## Payment Flow

```txt
checkout confirmed
-> create pending order
-> create payment row pending
-> call provider create payment link
-> store provider transaction id
-> send payment link to Telegram user
-> receive provider webhook
-> verify signature
-> insert payment_event
-> update payment status
-> update order payment_status/order status
-> notify Telegram user
```

## Status Truth

Payment status hanya valid dari:

- verified payment provider webhook,
- manual admin override with audit log,
- sandbox simulation endpoint restricted to dev/test.

AI cannot mark payment as paid.

## Required Data

Payment row should include:

```txt
workspace_id
order_id
provider
provider_transaction_id
amount
currency
status
payment_link_url
expires_at
paid_at
metadata
```

Payment event should include raw/normalized payload for audit.

## Security

- verify webhook signature,
- idempotency on provider event id,
- never expose provider secret to frontend,
- never trust amount from client,
- compare webhook amount with order total.
