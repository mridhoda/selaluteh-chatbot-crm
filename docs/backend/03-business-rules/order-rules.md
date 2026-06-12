# Order Rules

## Required Fields

Every marketplace order must have:

```txt
workspace_id
outlet_id
contact_id
chat_id optional
status
payment_status
total_amount
```

## MVP Statuses

```txt
pending_payment
paid
processing
completed
cancelled
```

## Access Rule

User can view/update order only if:

- user belongs to workspace
- user has access to order.outlet_id, or has all-outlet role
- role permits action

## Status Actions

pending_payment:

- resend payment link
- cancel order
- open chat

paid:

- mark processing
- open chat

processing:

- mark completed
- open chat

completed/cancelled:

- view only, unless owner override
