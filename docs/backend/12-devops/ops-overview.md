# Ops Overview

## Operational Goal

Keep the backend reliable, recoverable, observable, and safe during MVP development and production operation.

## System Components to Operate

| Component | Responsibility |
|---|---|
| Backend API | Auth, dashboard APIs, commerce, webhooks |
| Frontend dashboard | Admin UI |
| Database | MongoDB current runtime or Supabase/Postgres target |
| Local uploads | Chat media, payment proof, product images, agent files |
| Telegram webhook | Customer bot interaction |
| Meta webhook | WhatsApp/Instagram inbound messages |
| Payment webhook | Payment status updates |
| AI providers | OpenAI/Gemini reply generation |
| Background jobs | Follow-ups, queued tasks, future workers |
| Logs/metrics | Debugging and alerting |

## Highest Operational Priorities

1. Do not lose data.
2. Do not lose local uploads.
3. Do not expose secrets.
4. Keep webhook processing idempotent.
5. Keep payment webhook secure.
6. Preserve existing CRM behavior.
7. Keep rollback path available.
8. Monitor errors before users report them.

## Critical Paths

### Telegram Commerce Path

```txt
Telegram webhook
→ contact/chat resolution
→ product/cart/checkout
→ order creation
→ payment link
→ payment webhook
→ order paid notification
```

### CRM Support Path

```txt
Incoming chat
→ message saved
→ AI reply or human takeover
→ admin inbox update
```

### Payment Path

```txt
Checkout
→ payment provider
→ webhook
→ payment event
→ payment status
→ order status
→ notification
```

## Operational Rule

If a system change touches payment, webhook, database migration, or local uploads, treat it as high risk and follow release + rollback checklists.
