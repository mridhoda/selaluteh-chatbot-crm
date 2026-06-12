# Jobs API

## Purpose

Define internal/admin contracts for background processing.

Current app uses in-process cron for follow-ups. Future architecture may use Redis/BullMQ workers.

## Job Types

```txt
webhook_process
ai_reply
payment_sync
payment_webhook_process
telegram_notification
followup_send
file_cleanup
migration_validation
```

## GET `/api/v1/jobs`

Optional admin endpoint to inspect jobs.

Auth: owner/super or internal admin.

### Response

```json
{
  "success": true,
  "data": [
    {
      "id": "job_019...",
      "type": "ai_reply",
      "status": "completed",
      "created_at": "2026-06-12T00:00:00Z",
      "completed_at": "2026-06-12T00:00:03Z"
    }
  ]
}
```

## POST `/api/v1/jobs/payment-sync`

Manually sync a payment/order with provider.

Auth: owner/super.

### Request

```json
{
  "payment_id": "019..."
}
```

## POST `/api/v1/jobs/retry-webhook-event`

Retry failed webhook processing.

Auth: owner/super/internal.

### Request

```json
{
  "webhook_event_id": "019..."
}
```

## POST `/api/v1/jobs/file-cleanup`

Clean temp files.

Auth: internal/admin.

## Internal Worker Contract

Recommended worker payload:

```json
{
  "job_id": "job_019...",
  "type": "webhook_process",
  "workspace_id": "019...",
  "resource_id": "019...",
  "attempt": 1,
  "payload": {}
}
```

## Rules

- Webhook endpoints should not block on slow AI/payment operations in production.
- Jobs must be retry-safe.
- Jobs must be idempotent.
- Failed jobs must store error reason.
