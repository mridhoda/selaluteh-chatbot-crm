# Carts API

## Purpose

Manage shopping cart for Telegram-first marketplace flow.

Carts are usually created by Telegram interactions, but dashboard/admin may inspect them.

## GET `/api/v1/carts/current`

Get current open cart for contact/platform session.

Auth required for dashboard. Internal bot call can use service role + platform verification.

### Query

| Param | Required | Notes |
|---|---|---|
| `contact_id` | yes | customer contact |
| `platform_id` | yes | telegram platform |

### Response

```json
{
  "success": true,
  "data": {
    "id": "019...",
    "status": "open",
    "currency": "IDR",
    "items": [
      {
        "id": "019...",
        "product_id": "019...",
        "variant_id": "019...",
        "name_snapshot": "Salty Caramel",
        "unit_price": 25000,
        "quantity": 2,
        "line_total": 50000
      }
    ],
    "subtotal_amount": 50000
  }
}
```

## POST `/api/v1/carts`

Create or return open cart.

### Request

```json
{
  "contact_id": "019...",
  "platform_id": "019...",
  "chat_id": "019...",
  "currency": "IDR"
}
```

## POST `/api/v1/carts/:cart_id/items`

Add item to cart.

### Request

```json
{
  "product_id": "019...",
  "variant_id": "019...",
  "quantity": 2
}
```

### Rules

- Product must be active.
- Variant must be active.
- Quantity must be > 0.
- Snapshot product name and price into cart item.
- If same product+variant exists, increment quantity.

## PATCH `/api/v1/carts/:cart_id/items/:item_id`

Update quantity.

### Request

```json
{
  "quantity": 3
}
```

Quantity 0 should remove item or return validation error depending UI rule. Recommended: use DELETE for removal.

## DELETE `/api/v1/carts/:cart_id/items/:item_id`

Remove item.

## DELETE `/api/v1/carts/:cart_id/items`

Clear cart.

## POST `/api/v1/carts/:cart_id/validate`

Validate cart before checkout.

### Response

```json
{
  "success": true,
  "data": {
    "valid": true,
    "issues": [],
    "subtotal_amount": 50000
  }
}
```

Invalid example:

```json
{
  "success": true,
  "data": {
    "valid": false,
    "issues": [
      {
        "item_id": "019...",
        "code": "PRODUCT_UNAVAILABLE",
        "message": "Product is no longer available."
      }
    ]
  }
}
```

## Cart Status

```txt
open
checkout_started
converted
abandoned
cancelled
```
