# Public Storefront API

## Phase 2 Versioned Public Routes

The Phase 2 alpha backend contract is available under `/api/v1/public` while the older `/api/public` QR/order routes remain compatible.

Customer routes:

```http
GET  /api/v1/public/stores/:storefrontSlug
GET  /api/v1/public/qr/:qrToken
POST /api/v1/public/carts/validate
POST /api/v1/public/checkout
GET  /api/v1/public/payments/:paymentId/status
GET  /api/v1/public/orders/:publicOrderToken
```

Rules:

- Public routes are intentionally unauthenticated, but only return customer-safe data.
- Backend derives workspace/outlet from `storefronts`/`storefront_outlets` when seeded, with workspace/settings metadata fallback for older Phase 2 data.
- Backend derives QR context from `qr_codes` when seeded, with existing `qr_order_sessions.qr_token_hash` fallback. The target alpha database has migration `043`/`universal_qr_scope` verified and one active SELKOP Universal QR seeded.
- Client-provided totals, prices, payment status, fulfillment status, and workspace ID are ignored.
- Client-provided modifier names and price deltas are ignored; backend validates selected modifier groups/options against the product menu model and recomputes modifier price deltas.
- Outlet/location/table QR checkout locks the outlet/location from the QR token and rejects overrides. Universal QR returns selectable active/orderable outlets and requires the selected outlet on cart/checkout.
- Alpha fulfillment remains `pickup` only.
- Checkout requires `Idempotency-Key`, `customer.name`, and `customer.phone`; same key with different payload returns `IDEMPOTENCY_KEY_CONFLICT`.
- Payment status is read-only for frontend; `paid` only appears after backend/provider confirmation.
- Public routes use alpha-grade rate limiting for QR lookup, cart validation, checkout, payment polling, and public order lookup.
- Public route rate limits are currently in-memory and suitable for alpha/single-instance deployments only. Production multi-instance deployments should enforce public route limits at the edge/WAF; add Redis-backed app limits only when app-level identity-aware throttling is required.
- Public security events are recorded for invalid QR attempts, webhook verification failures, and public checkout idempotency conflicts. These are operational/security telemetry and are never exposed by public APIs.

## Get Online Storefront

```http
GET /api/v1/public/stores/:storefrontSlug
```

Returns storefront metadata, customer-selectable outlets, and outlet-aware menu for the selected outlet.

Outlet rules:

- Only active, visible, orderable, pickup-enabled outlets are returned.
- If `outlet_id`/`outletId` points to a closed, inactive, hidden, non-orderable, or non-pickup outlet, the backend returns `OUTLET_UNAVAILABLE`.
- Checkout and cart validation re-resolve the selected outlet from backend state; client outlet flags are ignored.

Menu safety rules:

- Products come from active customer-facing product availability for the selected outlet.
- Cost price, stock/inventory counts, internal product metadata, unpublished/inactive products, and unavailable products are not exposed in the public menu.
- Product `availability` is a customer-safe state such as `available` or `unavailable`; current public listing filters unavailable/sold-out products out through the customer product service.

```json
{
  "storefront": {
    "id": "workspace-id",
    "slug": "selkop",
    "name": "SELKOP",
    "brandline": "Born Local For Everyone",
    "ordering_enabled": true
  },
  "outlets": [],
  "menu": {
    "categories": [],
    "products": []
  }
}
```

## Validate Cart

```http
POST /api/v1/public/carts/validate
```

Request accepts only channel/storefront or QR context, selected outlet for online store, fulfillment type, and item selections. Backend recomputes prices.

Modifier rules:

- Each modifier selection must reference a modifier group on the product and an option in that group.
- The response snapshot uses backend modifier group/option names and backend price deltas, not client-provided names or prices.
- Modifier price deltas are added to `unit_total` and `line_total`; `unit_price` remains the base product price.
- Min/max selection rules are enforced when the product modifier model provides `min`, `max`, `minSelections`, `maxSelections`, `min_selections`, or `max_selections`. If product data has no min/max fields, no implicit min/max rule can be enforced beyond group/option ownership.
- Invalid modifier payloads return cart validation errors such as `INVALID_MODIFIER_GROUP`, `INVALID_MODIFIER_OPTION`, `MODIFIER_MIN_SELECTIONS`, or `MODIFIER_MAX_SELECTIONS`.

```json
{
  "valid": true,
  "cart_snapshot": {
    "currency": "IDR",
    "subtotal_amount": 42000,
    "discount_amount": 0,
    "service_fee_amount": 0,
    "tax_amount": 0,
    "total_amount": 42000,
    "items": []
  },
  "errors": [],
  "warnings": []
}
```

## Public Checkout

```http
POST /api/v1/public/checkout
Idempotency-Key: checkout_unique_key
```

Creates an immutable order snapshot and payment session after cart validation succeeds. The request is rejected before order/payment side effects when `Idempotency-Key`, `customer.name`, `customer.phone`, items, or pickup-only fulfillment validation fails.

Idempotency behavior:

- The backend creates an `order_idempotency_records` claim before order/payment side effects and stores a stable request hash.
- Same key plus same payload returns the completed response when available.
- Same key plus different payload returns `IDEMPOTENCY_KEY_CONFLICT`.
- Same key plus same payload while the first request is still processing returns HTTP `202` with a customer-safe `idempotency.status="processing"` response and retry guidance, and does not create another order/payment.
- If order creation succeeds but payment session creation fails, the idempotency record is marked failed with sanitized recovery metadata and the API returns a safe retryable `PAYMENT_CREATION_FAILED`/`PAYMENT_CREATION_RECOVERY_REQUIRED` error. Operational recovery should inspect `order_idempotency_records.error_snapshot` and `resource_id`, reconcile or create the missing payment, then retry the same key after recovery.

```json
{
  "order": {
    "public_order_token": "po_...",
    "payment_status": "unpaid",
    "fulfillment_status": "not_started",
    "public_order_status": "payment_pending"
  },
  "payment": {
    "id": "payment-id",
    "status": "pending",
    "payment_url": "https://..."
  },
  "next": {
    "payment_pending_url": "/payment/pending/payment-id",
    "public_order_url": "/order/po_..."
  }
}
```

## QR Context

```http
GET /api/public/qr/:qrToken
GET /api/v1/public/qr/:qrToken
```

Returns customer-safe QR context resolved from a hashed token lookup.

```json
{
  "data": {
    "qr_token": "opaque-token",
    "outlet_id": "019...",
    "outlet_name": "SELKOP Samarinda",
    "table_id": null,
    "table_label": "Meja 07",
    "location_label": "Pickup Counter",
    "fulfillment_type": "pickup",
    "expires_at": null,
    "is_active": true
  }
}
```

Rules:

- The raw QR token is never stored; backend stores `qr_token_hash`.
- Expired or inactive QR sessions return safe errors.
- Outlet/location/table QR context locks outlet/table/location for QR checkout flows.
- Universal QR context has `scope='universal'`, no locked outlet/location target, `outlet_locked=false`, and a customer-selectable outlet list restricted to active, visible, orderable, pickup-enabled outlets in the QR workspace.
- For Universal QR, cart validation and checkout must include a selected outlet accepted by the backend; client outlet flags and totals are ignored.
- Alpha fulfillment remains pickup-only unless product approves dine-in/takeaway activation.

Current alpha seed reality:

- SELKOP storefront slug `selkop` is seeded and enabled for pickup ordering on the requested Samarinda and Tenggarong outlets.
- Active product outlet availability is seeded for the active SELKOP product at both requested outlets.
- Outlet/location/table QR rows and one true Universal QR row are seeded with random hashed token storage; raw QR tokens are not printed or committed.
- Local command validation is blocked in the current session, so API docs describe implementation and Supabase MCP verification, not a fresh automated test pass.

## Public Order Lookup

```http
GET /api/public/orders/:publicOrderToken
GET /api/v1/public/orders/:publicOrderToken
```

Returns customer-safe order status by opaque public token, not internal order ID.

```json
{
  "data": {
    "id": "po_...",
    "orderNumber": "SLTH-20260706-0001",
    "channel": "online_store",
    "publicOrderStatus": "order_received",
    "paymentStatus": "paid",
    "fulfillmentStatus": "awaiting_acceptance",
    "fulfillmentType": "pickup",
    "outlet": {
      "name": "SELKOP Samarinda",
      "code": "SMR"
    },
    "customer": {
      "name": "Customer",
      "phone": "62******123"
    },
    "amounts": {
      "subtotal_amount": 42000,
      "discount_amount": 0,
      "service_fee_amount": 0,
      "tax_amount": 0,
      "total_amount": 42000,
      "currency": "IDR"
    },
    "items": [],
    "payment": {
      "status": "paid",
      "paymentUrl": null,
      "paidAt": "2026-07-06T00:00:00.000Z"
    }
  }
}
```

The response must not expose internal IDs, raw provider payloads, secrets, internal notes, audit internals/logs, COGS, raw totals objects, or unmasked customer phone numbers.

## Audited Backend Actions

The following backend mutations are covered by non-blocking audit logging:

- `order.created`
- `order.accepted`
- `order.preparing`
- `order.ready`
- `order.completed`
- `order.cancelled`
- `payment.created`
- `payment.webhook_received`
- `payment.paid`
- `payment.manual_review`
- `settings.payment_provider_changed`

Audit details are sanitized before persistence. Secret keys, webhook secrets, raw authorization headers, and unsafe raw provider payload/response fields are redacted.
