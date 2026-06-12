# Products API

## List Products

```http
GET /api/products
```

Query:

```txt
outlet_id
status
category_id
search
telegram_visible
page
limit
```

## Behavior

- without outlet_id: list workspace products
- with outlet_id: include outlet availability
- customer-facing list requires outlet_id

## Update Outlet Availability

```http
PUT /api/products/:product_id/outlet-availability
```

Body:

```json
{
  "outlets": [
    {
      "outlet_id": "outlet_123",
      "is_available": true,
      "price_override": null,
      "stock_quantity": 20
    }
  ]
}
```
