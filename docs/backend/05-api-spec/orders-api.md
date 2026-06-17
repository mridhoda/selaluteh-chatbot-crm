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
  "order_status": "new",
  "payment_status": "pending"
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
