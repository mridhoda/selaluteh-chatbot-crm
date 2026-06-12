# Webhook Operations

## Webhook Types

- Telegram inbound webhook.
- Meta/WhatsApp/Instagram webhook.
- Payment provider webhook.

## Operational Rules

- Webhooks must be idempotent.
- Webhook handlers should respond quickly.
- Long work should be queued if needed.
- Raw payload should be logged/stored where useful.
- Duplicate events should not create duplicate messages/orders/payments.

## Telegram Webhook Ops

Check webhook:

- verify public HTTPS URL
- send `/start`
- check logs
- confirm message saved
- confirm bot replies

Common problems:

| Problem | Possible Cause |
|---|---|
| Bot no reply | webhook URL wrong, token wrong, backend down |
| Duplicate reply | no idempotency |
| AI replies during takeover | takeover check broken |
| File download fails | Telegram file API/token/storage issue |

## Payment Webhook Ops

Must verify:

- signature valid
- provider event id stored
- duplicate ignored
- payment status mapped correctly
- order updated correctly
- notification sent once

Common problems:

| Problem | Possible Cause |
|---|---|
| Order not marked paid | webhook failed, signature invalid, payment id mismatch |
| Duplicate paid notification | missing idempotency |
| Fake paid order | signature not verified |
| Raw event missing | event not logged |

## Pause Webhooks

During cutover/incident:

- point provider webhook to maintenance endpoint
- disable webhook if provider supports
- stop backend route accepting writes
- record time window

## Re-enable Webhooks

After fix:

- restore URL
- send test event
- monitor logs
