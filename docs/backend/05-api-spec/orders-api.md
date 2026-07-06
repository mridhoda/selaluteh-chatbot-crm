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

Fulfillment actions require `payment_status = paid` and move `fulfillment_status` through `awaiting_acceptance -> accepted -> preparing -> ready -> completed`.

Hard delete is disabled:

```http
DELETE /orders/:id -> 405 ORDER_DELETE_DISABLED
```

Use cancellation with a reason instead.
