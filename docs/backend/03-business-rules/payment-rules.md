# Payment Rules

## Outlet-Aware Payment

```txt
payments.workspace_id = orders.workspace_id
payments.outlet_id = orders.outlet_id
```

## Source of Truth

Payment status comes from:

- payment provider webhook
- explicit authorized admin override

AI cannot mark payment paid.

## Webhook Processing

Must:

- verify signature
- enforce idempotency
- find payment/order
- validate amount
- update payment
- update order
- notify customer

## Manual Override

If enabled, require:

- owner/admin role
- reason
- proof/reference
- audit log
