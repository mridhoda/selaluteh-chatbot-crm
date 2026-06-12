# Audit Log Rules

## Purpose

Defines which actions should be auditable.

## Why Audit Logs Matter

Marketplace and payment flows require traceability for:

- payment disputes
- order changes
- admin overrides
- customer complaints
- security review
- migration troubleshooting

## Actions to Audit

Recommended audit events:

```txt
user_login
user_created
role_changed
platform_created
platform_token_updated
agent_updated
product_created
product_updated
product_archived
cart_checked_out
order_created
order_status_changed
payment_created
payment_status_changed
payment_override
payment_webhook_rejected
complaint_created
complaint_status_changed
human_takeover_started
human_takeover_released
export_created
file_deleted
webhook_duplicate_detected
ai_action_executed
ai_action_rejected
```

## Audit Fields

Recommended fields:

```txt
id
workspace_id
actor_type: user|system|webhook|ai
actor_user_id nullable
event_type
entity_type
entity_id
diff jsonb nullable
metadata jsonb nullable
created_at
```

## Payment Audit Rule

Payment status changes must be auditable.

Include:

- previous status
- next status
- provider
- provider event id
- actor
- reason if manual override

## Order Audit Rule

Order status changes must include reason for cancellation/review.

## AI Audit Rule

AI action should log:

- proposed action
- input references
- validation result
- execution result
- rejection reason

## Export Audit Rule

Export actions must log:

- filters
- type
- user
- timestamp
- file id if stored

## Retention

MVP can keep audit logs indefinitely or define retention later.

Do not hard-delete audit logs during normal admin operations.
