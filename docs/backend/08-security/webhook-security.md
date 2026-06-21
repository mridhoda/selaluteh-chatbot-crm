# Webhook Security

## Webhook Sources

```txt
Telegram
Meta WhatsApp/Instagram
Payment gateway
```

All webhook endpoints are public, so they need provider validation, idempotency, and strict parsing.

## Generic Webhook Rules

1. Accept only expected HTTP method.
2. Validate content type and payload size.
3. Verify provider secret/signature when available.
4. Store event in `webhook_events` before side effects.
5. Use idempotency key.
6. Process side effects once.
7. Return fast; use queue/worker if processing is heavy.
8. Never expose stack traces in webhook responses.
9. Rate limit webhook endpoints to reduce abuse.
10. Never log configured provider secrets or verification tokens.

Current MVP backend:

```txt
express.json({ limit: '2mb' })
routes/webhooks/index.js in-memory rate limit: 120 requests/minute/IP
telegram-parser.js and meta-parser.js normalize payload before domain processing
```

## Telegram Webhook

Recommended protections:

- Use tokenized path or secret header.
- Validate platform token mapping.
- Store `update_id` or `message_id` in `webhook_events`.
- Enforce idempotency with `(platform_id, provider_event_id)`.
- Do not trust username/name for identity; use Telegram `chat.id` / user id.

## Meta Webhook

Recommended protections:

- Verify setup token for GET challenge.
- Verify POST signature using app secret when configured.
- Use account/phone/page id to find platform.
- Deduplicate message ids.
- Do not log `META_VERIFY_TOKEN` or app secrets.

## Payment Webhook

Payment webhook must have separate stricter rules:

- verify signature;
- verify callback token where provider uses token verification;
- store raw payload;
- update payment/order only after verification;
- make duplicate events idempotent;
- reconcile suspicious events with provider API.

For Xendit Payment Session:

```txt
verification header = x-callback-token
configured secret = XENDIT_WEBHOOK_VERIFICATION_TOKEN
accepted path = /api/webhooks/xendit/payment-sessions
accepted events = payment_session.completed, payment_session.expired
```

The webhook handler must not accept `workspace_id` from query/body as authority. It must locate the internal payment by provider session ID or merchant reference, then use that payment's workspace/outlet/order scope.

## Webhook Event Table

Suggested fields:

```txt
id
workspace_id
source
provider
platform_id
provider_event_id
payload
signature_valid
status
processed_at
error_message
created_at
```

## Replay Protection

- Use provider event id if provided.
- Reject duplicate idempotency keys or return OK without reprocessing.
- Optionally reject old timestamps if provider signs timestamp.

For Xendit, prefer documented webhook ID if present. Fallback key should include `payment_session_id`, event type, and provider updated timestamp. Duplicate webhook must not create duplicate Telegram success messages.
