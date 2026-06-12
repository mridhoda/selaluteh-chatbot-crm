# Webhook Rules

## Purpose

Defines business rules for Telegram, Meta, and payment webhooks.

## General Webhook Rule

Webhook endpoints are public externally but must not trust raw payload blindly.

Every webhook should:

1. verify provider identity if possible
2. derive workspace from platform/payment config
3. store or check idempotency key
4. process event safely
5. avoid duplicate side effects
6. return provider-appropriate response quickly

## Telegram Webhook

Telegram update should resolve platform by:

```txt
platform.type = telegram
platform.token or webhook_secret/path token
```

Rules:

- save incoming message once
- use Telegram message id/update id for idempotency
- callback queries must be validated by backend
- do not trust callback payload for price/status

## Meta Webhook

Meta webhook should resolve platform by:

```txt
platform.type = whatsapp/instagram
account_id / phone_number_id / recipient id
```

Rules:

- verify token on setup
- verify signature in production if supported
- store platform message id
- prevent duplicate inserts

## Payment Webhook

Payment webhook must:

- verify signature
- identify payment/order
- validate amount/reference
- store `payment_events`
- update payment/order idempotently
- send notification only after successful commit

## Webhook Event Table

Recommended `webhook_events` stores:

```txt
workspace_id
provider
event_type
event_id
idempotency_key
payload
status
processed_at
error_message
```

## Idempotency Rule

For the same provider event:

```txt
process once
return success on duplicate if already processed
never duplicate messages/orders/payments/notifications
```

## Failure Rule

If webhook processing fails after event is stored:

```txt
status = failed
error_message stored
retry mechanism or manual review available
```

## Timeout Rule

Webhook route should respond quickly.

If AI/payment work is slow, queue it or process asynchronously.

MVP without queue:

- store event
- process lightweight validation
- avoid long AI call inside provider webhook if possible

## Security Rule

Never log full tokens, provider secrets, or raw payment credentials.

Payload logs should redact sensitive fields.
