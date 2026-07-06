# Public Storefront API

## QR Context

```http
GET /api/public/qr/:qrToken
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
- QR context locks outlet/table/location for QR checkout flows.
- Alpha fulfillment remains pickup-only unless product approves dine-in/takeaway activation.

## Public Order Lookup

```http
GET /api/public/orders/:publicOrderToken
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
    "totals": {},
    "items": [],
    "payment": {
      "status": "paid",
      "paymentUrl": null,
      "paidAt": "2026-07-06T00:00:00.000Z"
    }
  }
}
```

The response must not expose internal IDs, raw provider payloads, secrets, internal notes, audit internals, COGS, or unmasked customer phone numbers.
