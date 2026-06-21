# Payment Security

## Core Payment Rule

Only verified payment gateway webhook or authorized admin action can change payment state.

AI, Telegram user message, or client request must never directly mark payment/order as paid.

## Payment Flow Security

```txt
checkout confirmed
-> create pending order
-> create payment transaction with provider
-> save payment row
-> send payment link or manual/COD instruction
-> receive provider webhook
-> verify signature
-> save payment_event
-> update payment/order status
-> notify customer
```

For local MVP, `PAYMENT_PROVIDER=manual` creates a pending manual/COD payment attempt but does not mark the payment paid.

## Payment Provider Secrets

Store server-side only:

```txt
MIDTRANS_SERVER_KEY
XENDIT_SECRET_API_KEY
XENDIT_WEBHOOK_VERIFICATION_TOKEN
PAYMENT_WEBHOOK_SECRET
```

Never expose to frontend or logs.

## Signature Verification

Every payment webhook must verify provider-specific signature.

For Xendit Payment Session webhooks, the backend verifies the documented `x-callback-token` header using `XENDIT_WEBHOOK_VERIFICATION_TOKEN`. No HMAC scheme is invented for Payment Session unless Xendit changes the official contract.

If signature invalid:

```txt
store event as rejected/suspicious if safe
return 401/403
never update order/payment
```

## Idempotency

Duplicate provider webhook is normal.

Required:

- unique provider transaction id;
- unique provider event id if available;
- idempotent transition logic.

Example safe behavior:

```txt
payment already paid + duplicate settlement -> do nothing, return OK
pending + settlement -> mark paid
paid + failed -> ignore or flag for review
```

## Amount Validation

Before marking paid, validate:

```txt
payment.order_id matches order
payment.workspace_id matches order.workspace_id
provider gross_amount equals expected amount
currency matches
transaction status is paid/settlement/capture
fraud status if provider supplies it is acceptable
```

The payment creation API must reject client-provided amount mismatch before provider/manual attempt creation.

For Xendit Test Mode, the webhook handler also validates `payment_session_id`, `reference_id`, amount, and currency before a paid transition. A stale `expired` event cannot downgrade a `paid` payment.

## Manual Payment Proof

Manual proof upload is lower trust.

Manual/COD instruction is allowed for MVP, but payment remains `pending` until verified by an approved operational/admin process. Customer text, AI output, and Telegram callbacks must not set `paid`.

Rules:

- store as `payment_proof` file;
- mark payment as `manual_review`, not paid;
- admin must approve;
- AI may help read/describe proof but cannot approve.

## Refund/Cancellation

MVP can mark refunds manual-only.

Do not implement automatic refund until:

- payment provider refund API is integrated;
- admin approval flow exists;
- audit logs exist.
