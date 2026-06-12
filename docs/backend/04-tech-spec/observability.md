<!--
Tech Spec Pack: Telegram-first Marketplace Backend
Project: KALIS.AI / eskala-bot evolution
Target: Chatbot CRM + Telegram Marketplace MVP
Generated: 2026-06-11
-->

# Observability

## Goals

- Debug Telegram, AI, payment, and database problems quickly.
- Detect failed webhook processing.
- Track marketplace conversion flow.
- Avoid logging sensitive data.

## Logging Standards

Every request should include:

```txt
request_id
method
path
status
latency_ms
user_id if available
workspace_id if available
```

Every webhook log should include:

```txt
provider
platform_id
workspace_id
event_id
processing_status
latency_ms
```

## Structured Logs

Use JSON logs in production.

Example:

```json
{
  "level": "info",
  "event": "telegram.webhook.processed",
  "workspaceId": "uuid",
  "platformId": "uuid",
  "chatId": "uuid",
  "messageId": "uuid",
  "latencyMs": 842
}
```

## Do Not Log

- Telegram bot tokens
- provider server keys
- JWTs
- passwords
- OTP codes in production
- payment card/customer sensitive data
- Supabase service role key
- full raw message if privacy-sensitive unless debug mode

## Metrics

### Webhook Metrics

```txt
webhook_received_total{provider}
webhook_processed_total{provider,status}
webhook_duplicate_total{provider}
webhook_processing_duration_ms{provider}
```

### AI Metrics

```txt
ai_requests_total{provider,model,status}
ai_latency_ms{provider,model}
ai_action_proposed_total{type}
ai_action_executed_total{type,status}
```

### Commerce Metrics

```txt
product_views_total
cart_add_total
checkout_created_total
payment_link_created_total
payment_paid_total
payment_failed_total
order_created_total
order_completed_total
```

### Queue Metrics

```txt
jobs_waiting
jobs_active
jobs_failed
jobs_completed
```

## Error Categories

Use consistent error codes:

```txt
AUTH_REQUIRED
FORBIDDEN_WORKSPACE
VALIDATION_ERROR
NOT_FOUND
PROVIDER_TIMEOUT
PAYMENT_SIGNATURE_INVALID
PAYMENT_AMOUNT_MISMATCH
WEBHOOK_DUPLICATE
AI_PROVIDER_ERROR
STORAGE_FILE_MISSING
```

## Dashboards

Minimum dashboards:

1. API health.
2. Webhook throughput/errors.
3. AI latency/error rate.
4. Payment webhook success/failure.
5. Marketplace funnel.
6. Worker queue health.

## Alerts

Alert if:

- payment webhook failures > threshold
- Telegram send failures spike
- AI provider errors high
- database connection errors
- disk usage high for uploads
- queue failed jobs increasing
- no webhook received for unusually long period if expected traffic

## Health Endpoints

```txt
GET /health
GET /health/deep
```

`/health` checks process alive.

`/health/deep` checks:

- database
- Redis if enabled
- local upload directory writeability
- optional provider config presence

## Audit Logs

Add audit trail for:

- payment status change
- order status change
- admin manual payment approval
- product price change
- user role change
- platform token update
