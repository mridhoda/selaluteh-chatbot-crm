# Observability Test Plan

## Goal

Ensure logs, metrics, and traces are enough to debug production issues.

## Required Logs

| Event | Required Fields |
|---|---|
| Webhook received | provider, workspace_id, event_id, platform_id |
| Message saved | chat_id, message_id, sender |
| AI response | chat_id, provider, duration, success/failure |
| Payment webhook | provider, transaction_id, event_id, status, signature_valid |
| Order status change | order_id, old_status, new_status, actor |
| File upload | file_id, workspace_id, source, size_bytes |

## Tests

- Trigger Telegram webhook and verify structured log exists.
- Trigger payment webhook and verify signature result logged.
- Trigger AI error and verify sanitized error log.
- Trigger cross-workspace forbidden and verify security event.

## Do Not Log

- Full API keys.
- Full platform tokens.
- Passwords/OTP codes.
- Raw payment secrets.
- User private data beyond what is necessary.

## Alert Candidates

- Payment webhook invalid signature spike.
- AI provider failure rate spike.
- Telegram send failure spike.
- High duplicate webhook rate.
- Upload directory missing.
