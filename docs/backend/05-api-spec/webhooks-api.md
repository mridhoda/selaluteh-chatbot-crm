# Webhooks API

## Purpose

Receive external events from Telegram, Meta/WhatsApp/Instagram, and payment gateways.

Webhook routes are public at HTTP layer, but must verify provider authenticity.

## POST `/webhook/telegram/:secret?`

Receive Telegram updates.

### Verification

Recommended:

- Use secret path or Telegram secret token header if configured.
- Find platform by token/secret mapping.
- Store event in `webhook_events` before processing.

### Request

Telegram provider payload.

### Response

Always return quickly:

```json
{
  "ok": true
}
```

Recommended HTTP status: `200` after event accepted.

### Processing

```txt
receive update
-> compute event id
-> idempotency insert webhook_events
-> find platform
-> find agent
-> upsert contact
-> upsert chat
-> insert user message
-> if takeover_by exists stop AI
-> otherwise process AI/commerce action
-> send platform reply
-> insert AI message
```

## GET `/webhook/meta`

Meta webhook verification.

### Query

```txt
hub.mode
hub.verify_token
hub.challenge
```

### Response

Return `hub.challenge` when token matches.

## POST `/webhook/meta`

Receive WhatsApp/Instagram webhook events.

### Verification

Recommended:

- Verify Meta signature if configured.
- Match account id to platform.
- Use webhook event idempotency.

## POST `/webhook/payments/:provider`

Receive payment gateway webhook.

Provider examples:

```txt
midtrans
xendit
```

### Request

Provider-specific payload.

### Response

```json
{
  "success": true
}
```

### Rules

- Verify signature before state mutation.
- Store raw event in `webhook_events`.
- Store normalized provider event in `payment_events`.
- Update payment/order status idempotently.

## POST `/api/webhooks/xendit/payment-sessions`

Receive Xendit Test Mode Payment Session status webhooks.

### Verification

```txt
x-callback-token == XENDIT_WEBHOOK_VERIFICATION_TOKEN
```

Missing or invalid token returns an unauthorized error and performs no payment/order mutation.

### Accepted Events

```txt
payment_session.completed
payment_session.expired
```

### Processing

```txt
receive webhook
-> verify x-callback-token
-> normalize data.payment_session_id, reference_id, status, amount, currency
-> derive idempotency key from webhook id or session/event/timestamp
-> locate internal payment by provider session id or merchant reference
-> store payment_events row
-> validate provider session id/reference/amount/currency
-> paid: set payments.status=paid and orders.payment_status=paid
-> expired: set payments.status=expired and orders.payment_status=expired
-> do not downgrade paid payment from stale event
-> return 2xx for safe duplicate/no-op
```

### Response

```json
{
  "processed": true,
  "event": {
    "eventType": "payment_session.completed",
    "status": "paid"
  }
}
```

No raw Xendit secret, callback token, Authorization header, or full provider response is returned.

## Webhook Event Table Usage

Store:

```txt
workspace_id
provider
event_type
event_id
raw_payload
processing_status
processed_at
error_message
```

## Idempotency

If duplicate event received:

- Return success.
- Do not create duplicate messages/payments/orders.
- Optionally append attempt count.

## Async Processing Recommendation

MVP can process inline if fast enough, but recommended architecture:

```txt
Webhook endpoint
-> insert webhook_events
-> enqueue job
-> return 202/200
-> worker processes event
```
