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

## Create Xendit Test Mode Payment Session

```http
POST /api/orders/:orderId/payments/xendit/session
Idempotency-Key: unique-client-action-key
```

Body is optional and must not contain amount, currency, workspace ID, outlet ID, or paid status.

Response:

```json
{
  "data": {
    "paymentId": "payment-id",
    "orderId": "order-id",
    "provider": "xendit",
    "environment": "test",
    "status": "pending",
    "amount": 111000,
    "currency": "IDR",
    "paymentLinkUrl": "https://dev.xen.to/example",
    "expiresAt": "2026-06-18T16:30:00.000Z"
  }
}
```

Rules:

- Backend loads the order and uses its authoritative total.
- Xendit Payment Session uses `POST /sessions`, `session_type=PAY`, `mode=PAYMENT_LINK`, `capture_method=AUTOMATIC`, and `allow_save_payment_method=DISABLED`.
- Active pending sessions are reused; paid orders reject new sessions.
- The response never includes Xendit API key, webhook token, Authorization header, or raw provider response.

## Refresh Xendit Payment Session

```http
POST /api/payments/:paymentId/refresh
```

Refresh performs server-side `GET /sessions/{payment_session_id}` reconciliation. The client cannot assert desired status.

## Payment Gateway Config State

```http
GET /api/payments/gateway/config
```

Response is safe for authenticated admin UI:

```json
{
  "data": {
    "provider": "xendit",
    "environment": "test",
    "configured": true
  }
}
```

`configured` is a boolean only and does not expose secret values.

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
