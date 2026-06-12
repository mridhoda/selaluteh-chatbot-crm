# Payments API

## List Payments

```http
GET /api/payments
```

Query:

```txt
outlet_id
status
provider
date_from
date_to
search
page
limit
```

## Payment Fields

```json
{
  "id": "pay_123",
  "workspace_id": "ws_123",
  "outlet_id": "outlet_123",
  "order_id": "ord_123",
  "provider": "midtrans",
  "amount": 75000,
  "status": "pending",
  "payment_link": "https://..."
}
```

## Rule

Viewing payment requires access to payment outlet.
