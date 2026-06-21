# Webhook Ops

## Public Webhook Endpoints

Current relevant endpoints:

```txt
POST /api/webhooks/telegram/...
POST /api/webhooks/meta
POST /api/webhooks/xendit/payment-sessions
```

Webhook routes are public at the HTTP layer and must verify provider authenticity before mutation.

## Xendit Payment Session Webhook

Dashboard URL:

```txt
<APP_PUBLIC_URL>/api/webhooks/xendit/payment-sessions
```

Verification:

```txt
x-callback-token == XENDIT_WEBHOOK_VERIFICATION_TOKEN
```

Accepted events:

```txt
payment_session.completed
payment_session.expired
```

Expected durable handling:

```txt
verify token
derive event idempotency key
find internal payment by payment_session_id or reference_id
store payment_events row
validate provider session/reference/amount/currency
apply monotonic payment state transition
update orders.payment_status
send customer notification only after persistence
return 2xx for safe duplicate/no-op
```

## Retry Behavior

Xendit retries failed webhook deliveries. Treat duplicate delivery as normal. Duplicate delivery must not duplicate payment transitions, Telegram messages, inventory action, or timeline events.

## Local Testing

Use an HTTPS tunnel for local webhook testing. Do not hard-code tunnel URLs in source code or docs beyond examples. Configure public base URL through environment variables.

## Secret Handling

Never log:

```txt
XENDIT_SECRET_API_KEY
XENDIT_WEBHOOK_VERIFICATION_TOKEN
Authorization header
x-callback-token header value
```

Logs should include safe identifiers only, such as request ID, provider, event type, payment ID, order ID, and processing result.
