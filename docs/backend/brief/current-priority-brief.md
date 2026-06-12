# Current Priority Brief

## Current Priority

The safest current priority is:

```txt
Stabilize existing CRM before building marketplace/payment.
```

## Why

Payment and commerce features are sensitive.

Before adding them, backend must have:

- secure order routes
- secure complaint routes
- workspace isolation
- webhook idempotency
- diagnostic route cleanup
- stable Telegram webhook behavior

## Immediate Focus

### Priority 1 — Security Stabilization

- Add auth to orders.
- Add auth to complaints.
- Workspace-scope both modules.
- Remove/protect diagnostic routes.

### Priority 2 — Webhook Idempotency

- Add webhook event storage.
- Prevent duplicate Telegram message.
- Prepare payment webhook idempotency.

### Priority 3 — Product Catalog

- Add product category.
- Add product.
- Add variants.
- Add active/draft/archive status.

### Priority 4 — Cart/Checkout

- Add cart and cart item.
- Add checkout confirmation.
- Create order items snapshot.

### Priority 5 — Payment Sandbox

- Add payment provider abstraction.
- Add payment link.
- Add payment webhook.
- Add paid notification.

## Not Current Priority

Do not start with:

- multi-seller
- payout
- commission
- refund automation
- advanced AI recommendations
- logistics integration
