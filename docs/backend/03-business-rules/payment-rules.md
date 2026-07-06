# Payment Rules

## Outlet-Aware Payment

```txt
payments.workspace_id = orders.workspace_id
payments.outlet_id = orders.outlet_id
```

## Source of Truth

Payment status comes from:

- payment provider webhook

AI cannot mark payment paid.

Admin/manual mark-paid is disabled for current alpha. If a future audited override is approved, it must be specified separately before implementation.

For the current Xendit MVP, the payment provider webhook means a verified Xendit Test Mode Payment Session event. Browser return URLs, Telegram button clicks, screenshots, customer messages, or AI output are never payment authority.

## Xendit Test Mode Payment Session Rules

The approved Xendit configuration is:

```txt
provider = xendit
environment = test
session_type = PAY
mode = PAYMENT_LINK
capture_method = AUTOMATIC
allow_save_payment_method = DISABLED
country = ID
currency = IDR
```

Rules:

- use one Xendit Test Mode business account for all MVP outlets;
- store `workspace_id`, `outlet_id`, `order_id`, attempt number, merchant reference, provider session ID, amount, currency, payment link URL, and expiry;
- never use Xendit Live Mode in MVP development;
- do not use legacy Invoice API unless Payment Session is unavailable and the fallback is explicitly approved;
- do not expose `XENDIT_SECRET_API_KEY` or `XENDIT_WEBHOOK_VERIFICATION_TOKEN` to frontend, chat, logs, or docs.

## Create Session Rule

Before creating a Xendit session, backend must:

```txt
load order by workspace
verify outlet access
reject already paid order/payment
derive amount and currency from authoritative order row
generate unique merchant reference per attempt
reuse active unexpired session where safe
```

The client may send an idempotency key but may not send trusted amount, currency, workspace ID, outlet ID, or paid status.

## Webhook Processing

Must:

- verify signature
- enforce idempotency
- find payment/order
- validate provider session/reference/amount/currency
- update payment
- update order `payment_status` only through allowed payment transition
- set order `fulfillment_status = awaiting_acceptance` after verified paid events
- never set paid orders directly to accepted, preparing, ready, completed, or equivalent fulfillment states
- notify customer

For Xendit Payment Session, verification uses the documented `x-callback-token` header. Event types currently accepted are `payment_session.completed` and `payment_session.expired`.

## Status Mapping

```txt
Xendit ACTIVE    -> payment pending
Xendit COMPLETED -> payment paid
Xendit EXPIRED   -> payment expired
Xendit CANCELED  -> payment cancelled
```

`paid` is monotonic for MVP. A stale `expired`, `cancelled`, `failed`, or `pending` event must not downgrade a paid payment.
