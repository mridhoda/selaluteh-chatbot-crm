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

`manual_review` is the alpha-safe status for verified webhook/provider events that match a known payment but fail amount, currency, reference, or expiry validation. It must not auto-promote the linked order to paid.

Active payment provider selection is mode-aware: normalized provider settings allow one active provider per workspace/mode, while encrypted workspace settings metadata remains the credential fallback until a dedicated credential migration is completed.

Current alpha payment-provider reality:

- Supabase MCP verified the `bayargg` provider catalog row exists and is QRIS-enabled.
- SELKOP has no real BayarGG `payment_provider_settings` row, no active BayarGG settings row, and no encrypted credential/fingerprint reference at Phase 4 closure.
- BayarGG live credential/session/webhook validation is an approved deferral. Do not claim real paid-alpha or live payment readiness until an authorized operator configures real encrypted/referenced credentials and live/provider validation is run.
- Mocked BayarGG session/webhook implementation coverage exists for configured-session requirement, customer-safe session response, verification-before-mutation, duplicate no-op, amount/currency/expiry mismatch manual review, and provider transaction/reference mismatch. Local command execution is blocked in the current session, so no new pass result is claimed.

## Public Payment Status

```http
GET /api/v1/public/payments/:paymentId/status
```

Returns only customer-safe payment and linked public order status. It never exposes raw provider payloads, reconciliation internals, workspace IDs, or secrets.

```json
{
  "payment": {
    "id": "payment-id",
    "provider": "xendit",
    "status": "pending",
    "amount": 42000,
    "currency": "IDR",
    "payment_url": "https://...",
    "expires_at": "2026-07-07T00:00:00.000Z"
  },
  "order": {
    "public_order_token": "po_...",
    "public_order_status": "payment_pending"
  }
}
```

Frontend may poll this route, but only verified provider webhook/reconciliation paths may move a payment to `paid`.
