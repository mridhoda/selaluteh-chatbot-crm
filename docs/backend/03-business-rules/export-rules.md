# Export Rules

## Purpose

Defines business rules for exporting data from backend/admin dashboard.

## Export Scope

Export must always be workspace-scoped.

Exportable entities may include:

```txt
contacts
chats
messages
orders
order_items
payments
complaints
products
analytics summaries
```

## Permission Rule

Only owner/super may export workspace data by default.

Agent export is disabled unless explicit permission exists.

## Privacy Rule

Exports can contain customer personal data.

Export should:

- include only requested date range/status/filter
- avoid secrets/tokens
- avoid payment provider raw payload unless admin/security export
- redact sensitive fields if needed

## File Export Rule

Binary files should not be automatically bundled in normal CSV/XLSX export.

Export file should include:

```txt
file public_path or media id
```

If media export is needed, create separate archive job with permission and audit log.

## Order Export Rule

Order exports must include snapshot fields, not live product price.

Recommended fields:

```txt
order_code
customer_name
status
payment_status
items
subtotal
grand_total
created_at
updated_at
```

## Payment Export Rule

Payment exports must not include provider secrets/signatures.

Allowed:

```txt
provider
provider_reference
status
amount
currency
mode
created_at
paid_at
```

## Chat Export Rule

Chat export should preserve chronological order.

Messages should include:

```txt
sender
text
attachment public path if available
platform_message_id
created_at
```

## Audit Rule

Every export should create audit log:

```txt
user_id
workspace_id
export_type
filters
created_at
file_id optional
```

## Large Export Rule

Large exports should run as background job.

MVP may limit export to:

```txt
max 10,000 rows per request
```

or require date range.
