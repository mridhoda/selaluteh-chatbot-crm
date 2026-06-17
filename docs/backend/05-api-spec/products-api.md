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

## Product CRUD

```http
GET /api/products/:productId
POST /api/products
PUT /api/products/:productId
DELETE /api/products/:productId
```

Rules:

- Create/update requires workspace management permission.
- `basePrice` and `costPrice` must be non-negative.
- Delete is a soft archive (`isActive=false`).
- Optional `outlet_id` on detail response includes outlet availability snapshot.

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
      "stock_quantity": 20,
      "available_from": null,
      "available_until": null
    }
  ]
}
```

## Product Availability Detail

```http
GET /api/products/:productId/outlet-availability
```

Returns all outlet availability rows for a product in the current workspace.

## Product CSV Export and Import Validation

```http
GET /api/products/export.csv
POST /api/products/import/validate
```

`POST /import/validate` body:

```json
{
  "rows": [
    {
      "sku": "TEH-001",
      "slug": "teh-manis",
      "name": "Teh Manis",
      "basePrice": 10000,
      "currency": "IDR",
      "isActive": true
    }
  ]
}
```

Import validation returns row-level errors and does not mutate data.
