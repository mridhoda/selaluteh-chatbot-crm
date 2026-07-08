# Orders API

## List Orders

```http
GET /api/orders
```

Query:

```txt
outlet_id
order_status
payment_status
platform
date_from
date_to
search
page
limit
```

## Row Fields

```json
{
  "id": "ord_123",
  "order_number": "ORD-00124",
  "outlet": {
    "id": "outlet_123",
    "name": "SelaluTeh Tenggarong"
  },
  "customer": {},
  "total_amount": 75000,
  "status": "PENDING_PAYMENT",
  "payment_status": "pending",
  "fulfillment_status": "not_started",
  "public_order_status": "payment_pending",
  "capabilities": {
    "canAccept": false,
    "canStartPreparing": false,
    "canMarkReady": false,
    "canComplete": false,
    "canCancel": false
  }
}
```

## Detail Must Include

- customer info
- outlet info
- order items
- payment summary
- timeline
- related chat

## Rule

Order update requires outlet access.

Fulfillment mutation endpoints:

```http
POST /orders/:id/accept
POST /orders/:id/reject
POST /orders/:id/start-preparing
POST /orders/:id/mark-ready
POST /orders/:id/complete
POST /orders/:id/cancel
```

Phase 2 admin aliases are also available for dashboard alpha clients:

```http
GET  /api/v1/admin/orders
GET  /api/v1/admin/orders/:orderId
POST /api/v1/admin/orders/:orderId/accept
POST /api/v1/admin/orders/:orderId/prepare
POST /api/v1/admin/orders/:orderId/ready
POST /api/v1/admin/orders/:orderId/complete
POST /api/v1/admin/orders/:orderId/cancel
```

The alias response includes snake_case status fields and server-derived `allowed_actions`. These actions are advisory UI hints only; service transition guards remain authoritative.

Fulfillment actions require `payment_status = paid` and move `fulfillment_status` through `awaiting_acceptance -> accepted -> preparing -> ready -> completed`.

Admin lifecycle routes resolve the order through the caller's outlet scope before mutation and pass that resolved scope into accept, prepare, ready, complete, cancel, and generic status transitions. Cross-outlet mutation attempts must be denied before state change.

`allowed_actions` is returned only when both backend order capability and the existing `orders.manage_status` permission are present. Per-action permission splitting is deferred to avoid changing the existing permission model during alpha hardening.

Cancellation requires a non-empty reason for both legacy and `/api/v1/admin/orders` status routes.

Hard delete is disabled:

```http
DELETE /orders/:id -> 405 ORDER_DELETE_DISABLED
```

Use cancellation with a reason instead. The hard-delete block is enforced in route, service, and repository layers.
