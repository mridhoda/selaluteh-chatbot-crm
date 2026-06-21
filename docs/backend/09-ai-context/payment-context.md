# Payment Context

Dokumen ini memberi context payment gateway untuk AI coding agent.

## Current Payment State

Existing app supports manual/COD payment instruction and Xendit Test Mode Payment Session hosted checkout. Live mode is not enabled for MVP development.

## Target MVP Payment

Gunakan payment provider abstraction:

```txt
PaymentProvider
  createPaymentSession(order)
  getPaymentSession(providerSessionId)
  verifyWebhook(payload, headers)
  normalizeStatus(event)
```

Current approved provider:

- Xendit Test Mode Payment Session.

Mock provider behavior is allowed only for automated tests. Do not use Xendit Live Mode in this MVP task.

## Payment Flow

```txt
checkout confirmed
-> create pending order
-> create/reuse payment row pending
-> call Xendit POST /sessions
-> store payment_session_id and payment_link_url
-> send hosted checkout link to Telegram user
-> receive payment_session webhook
-> verify x-callback-token
-> insert payment_event
-> update payment status
-> update order payment_status only
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
merchant_reference
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
- verify Xendit `x-callback-token`,
- idempotency on provider event id,
- never expose provider secret to frontend,
- never trust amount from client,
- compare webhook amount with order total.

AI tools may request a backend `create_payment_link` action, but the backend must validate workspace, outlet, order, amount, and payment status. AI cannot create provider sessions directly and cannot set paid.
