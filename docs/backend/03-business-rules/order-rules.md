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
fulfillment_status
public_order_token
total_amount
```

## Status Layers

Orders now expose separate lifecycle facts:

```txt
payment_status: unpaid | pending | processing | paid | failed | expired | refunded | cancelled
fulfillment_status: not_started | awaiting_acceptance | accepted | preparing | ready | completed | cancelled
public_order_status: payment_pending | payment_failed | payment_expired | order_received | accepted | preparing | ready | completed | cancelled
```

`public_order_status` is derived by backend from payment and fulfillment state. Clients must not send it as authority.

## Legacy Compatibility Status

```txt
PENDING_PAYMENT
PAYMENT_PROCESSING
AWAITING_OUTLET_APPROVAL
APPROVED
PREPARING
READY_FOR_PICKUP
COMPLETED
REJECTED
CANCELLED
EXPIRED
```

The legacy `status` column is retained for compatibility during migration, but operations must use `payment_status` and `fulfillment_status` as the authoritative runtime fields.

## Access Rule

User can view/update order only if:

- user belongs to workspace
- user has access to order.outlet_id, or has all-outlet role
- role permits action

## Status Actions

payment pending / not_started:

- resend payment link
- cancel order
- open chat

paid / awaiting_acceptance:

- accept order
- reject/cancel with reason
- open chat

paid / accepted:

- mark preparing
- open chat

paid / preparing:

- mark ready
- open chat

paid / ready:

- mark completed
- open chat

completed/cancelled:

- view only, unless owner override

Fulfillment actions are blocked unless `payment_status = paid`. Verified paid events move fulfillment to `awaiting_acceptance`, never directly to accepted, preparing, ready, or completed.
