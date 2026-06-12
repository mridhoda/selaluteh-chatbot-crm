# Quota Rules

## Purpose

Defines business rules for plan limits, usage quotas, and rate limits.

## Plan Types

Existing plan types:

```txt
free
pro
pro-banget
```

## Quota Dimensions

Possible quota dimensions:

```txt
messages_per_month
ai_replies_per_month
platform_connections
agents_count
human_users_count
contacts_count
products_count
orders_per_month
storage_bytes
export_jobs_per_day
```

## MVP Recommendation

For Telegram marketplace MVP, enforce at minimum:

- platform connection limit
- AI replies usage
- product count if free plan
- storage size warning
- rate limit for webhooks/API

## Billing Independence

Quota enforcement should not break existing CRM chat storage.

If AI quota exhausted:

```txt
store incoming message
skip AI response
optionally notify admin/user
allow human takeover
```

## Telegram Webhook Rate Rule

Webhook should be protected from spam.

Rules:

- use per-platform/contact rate limit if needed
- never block storing important provider webhook without logging
- if AI is rate limited, return fallback or escalate

## Payment Quota Rule

Payment webhook processing must not be blocked by plan quota.

Reason: payment consistency is more important than quota enforcement.

## Storage Quota Rule

If storage quota exceeded:

- block new admin uploads
- still allow critical inbound message metadata
- optionally reject large attachments with friendly message
- alert owner

## Export Quota Rule

Large exports should be limited to owner/super and quota-managed.

## Usage Reset

Monthly quotas reset based on billing cycle or calendar month.

Usage must be workspace-scoped.

## Graceful Degradation

When quota exceeded:

- do not crash webhook
- do not lose customer messages
- degrade AI/automation first
- show admin warning
