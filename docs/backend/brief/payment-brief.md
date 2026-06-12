# Payment Brief

## Payment Strategy

Use external payment link from a payment gateway sandbox.

Recommended providers to support:

- Midtrans sandbox.
- Xendit sandbox.
- Manual/sandbox adapter for development.

## Payment Flow

```txt
Checkout confirmed
→ backend creates pending order
→ backend creates payment record
→ backend calls provider create payment link
→ provider returns payment link
→ bot sends link to Telegram user
→ provider sends webhook
→ backend verifies webhook signature
→ backend stores payment_event
→ backend updates payment
→ backend updates order
→ backend notifies Telegram user
```

## Payment Is Authoritative

Payment status can only be changed by:

- verified payment webhook
- authorized admin action for manual mode

Not allowed:

- customer text
- AI response
- unverified webhook

## Required Data

Payment should store:

- workspace_id
- order_id
- provider
- provider_reference_id
- amount
- currency
- status
- payment_link_url
- expires_at
- paid_at
- raw provider metadata if needed

Payment event should store:

- payment_id
- provider
- event_type
- provider_event_id
- raw_payload
- signature_valid
- processed_at

## Idempotency

Duplicate payment webhook must not:

- create duplicate payment event with same provider_event_id
- double-update order
- double-send paid notification if already processed

## MVP Payment Statuses

Recommended statuses:

```txt
pending
requires_action
paid
failed
expired
cancelled
refunded
```

Refund can be reserved for later.
