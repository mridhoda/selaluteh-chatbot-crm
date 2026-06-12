# Payment Gateway Contract

This document defines the payment abstraction for Midtrans/Xendit/manual providers.

## MVP Provider

Recommended MVP provider:

```txt
Midtrans sandbox
```

Xendit can be supported later using the same table contract.

## Payment Creation Flow

```txt
OrderService creates order pending_payment
PaymentService.createPaymentLink(order)
  -> create provider transaction
  -> insert payments row
  -> send payment_link_url to Telegram
```

## Tables

```txt
payments
payment_events
webhook_events
orders
```

## Provider Order ID

Use internal order number as the provider order id when possible:

```txt
payments.provider_order_id = orders.order_number
```

If provider requires uniqueness per retry, append attempt number:

```txt
ORD-20260611-ABC123-A1
```

## Status Mapping

| Provider Status | Internal `payment_status` | Internal `order_status` |
|---|---|---|
| pending | pending | pending_payment |
| settlement | settlement / paid | paid |
| capture | capture / paid | paid |
| deny | deny | failed |
| cancel | cancel | cancelled |
| expire | expire | expired |
| failure | failure | failed |
| refund | refund | refunded |

## Webhook Handling

1. Receive provider webhook.
2. Insert `webhook_events` idempotency record.
3. Verify provider signature.
4. Find `payments` by provider + provider_order_id / transaction id.
5. Insert `payment_events`.
6. Update `payments.status`.
7. Update `orders.payment_status` and `orders.status`.
8. Send Telegram notification if status changed.

## Signature Verification

Payment webhook endpoint must reject invalid signature.

Never trust webhook body without verification.

## Manual Payment Compatibility

Legacy manual payment proof remains supported through:

```txt
orders.payment_proof_file_id
orders.payment_proof_url
agents.payment_* columns
```

But marketplace MVP should prefer payment link sandbox for deterministic status updates.

## Reconciliation

Admin should be able to query:

```sql
select o.order_number, o.status, o.payment_status, p.provider, p.status, p.amount
from orders o
left join payments p on p.order_id = o.id
where o.workspace_id = :workspace_id
order by o.created_at desc;
```
