<!--
Tech Spec Pack: Telegram-first Marketplace Backend
Project: KALIS.AI / eskala-bot evolution
Target: Chatbot CRM + Telegram Marketplace MVP
Generated: 2026-06-11
-->

# Background Jobs

## Why Background Jobs Are Needed

Webhook endpoints should respond quickly. AI calls, retries, file downloads, payment reconciliation, and notifications should not block HTTP webhook response too long.

## Current State

Existing project uses `node-cron` for follow-ups. There is no durable queue yet.

## MVP Recommendation

Start with lightweight job abstraction. If Redis is available, use BullMQ.

```txt
Webhook route
  -> validate + store event
  -> enqueue job
  -> return 200

Worker
  -> process message/payment/notification
  -> update database
```

## Job Types

| Job | Purpose |
|---|---|
| `telegram.inbound_message` | Process incoming Telegram text/media |
| `telegram.callback_query` | Process inline button actions |
| `ai.generate_reply` | Generate AI reply |
| `telegram.send_message` | Send outgoing Telegram message |
| `payment.webhook_received` | Process verified payment event |
| `payment.reconcile` | Recheck pending provider status |
| `followup.run` | Scheduled follow-ups |
| `file.download_provider_media` | Download platform media |
| `notification.send` | Send Telegram/Meta notification |

## Retry Strategy

| Job | Retry |
|---|---|
| AI reply | 2-3 retries with fallback |
| Telegram send | 3 retries, exponential backoff |
| Payment webhook | no blind retry after verification; idempotent process |
| Payment reconcile | scheduled retries until terminal status |
| File download | 3 retries |

## Idempotency

Every job should have stable `jobId` when possible.

Examples:

```txt
telegram-message:<platform_message_id>
payment-event:<provider>:<event_id>
notification:<order_id>:paid
```

## Worker Separation

For MVP, API and worker can run in same repo but separate process:

```bash
npm run dev:api
npm run dev:worker
```

Production:

```txt
container: backend-api
container: backend-worker
container: redis
```

## Cron Jobs

Recommended cron:

| Cron | Schedule | Purpose |
|---|---|---|
| payment pending reconciliation | every 5-15 min | Recheck pending payments |
| follow-up scheduler | every 1 min | Existing CRM follow-ups |
| cleanup expired carts | every 30 min | Mark stale carts expired |
| cleanup temporary files | hourly | Remove `uploads/temp` |
| webhook stuck events | every 10 min | Retry failed processable events |

## Failure States

Store job failures in logs and optionally `job_runs` table later.

Minimum fields:

```txt
job_type
job_id
workspace_id
status
attempts
error_code
error_message
created_at
updated_at
```

## Backpressure

If AI provider slow/down:

- do not block webhook response
- send fallback message if needed
- mark chat as needing human review after repeated failures

## Acceptance Criteria

- Webhook can return quickly.
- Duplicate jobs do not duplicate messages/orders.
- Failed payment notification can retry.
- Worker can be restarted safely.
