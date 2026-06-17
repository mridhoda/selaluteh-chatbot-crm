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

## Create Payment Attempt

```http
POST /api/payments
```

Body:

```json
{
  "orderId": "order_123",
  "paymentMethod": "cod",
  "customer": {
    "name": "Customer",
    "phone": "628123"
  }
}
```

Rules:

- `orderId` is required.
- `amount` is optional; when provided it must match the authoritative order total.
- Existing pending or paid attempt for the same order is reused.
- `PAYMENT_PROVIDER=manual` creates a pending manual/COD payment without `paymentUrl`.

## Payment Event Timeline

```http
GET /api/payments/:paymentId/events
```

Returns gateway/manual event rows linked to the payment.

Example:

```json
{
  "data": [
    {
      "provider": "midtrans",
      "providerEventId": "tx-valid",
      "processingStatus": "processed",
      "verificationResult": "paid",
      "amount": 50000,
      "currency": "IDR"
    }
  ]
}
```

## Rule

Viewing payment requires access to payment outlet.

Only verified provider events or future audited admin manual flows may set payment status to `paid`.
