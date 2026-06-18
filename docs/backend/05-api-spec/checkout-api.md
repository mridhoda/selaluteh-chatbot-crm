# Checkout API

## Purpose

Convert validated cart into a pending order and prepare payment.

Checkout should be deterministic and not controlled directly by AI text generation.

## POST `/api/v1/checkouts`

Start checkout from cart.

### Headers

```http
Idempotency-Key: checkout_contact_cart_019...
```

### Request

```json
{
  "cart_id": "019...",
  "chat_id": "019...",
  "contact_id": "019...",
  "delivery_method": "pickup",
  "customer_name": "Customer",
  "customer_phone": "+62812...",
  "customer_address": null,
  "notes": "Less sugar"
}
```

### Response

```json
{
  "success": true,
  "data": {
    "checkout_id": "019...",
    "cart_id": "019...",
    "status": "draft",
    "subtotal_amount": 50000,
    "delivery_fee_amount": 0,
    "discount_amount": 0,
    "total_amount": 50000,
    "currency": "IDR"
  }
}
```

## POST `/api/v1/checkouts/:checkout_id/confirm`

Create pending order from checkout.

### Request

```json
{
  "confirm": true
}
```

### Response

```json
{
  "success": true,
  "data": {
    "order_id": "019...",
    "status": "new",
    "payment_status": "pending",
    "total_amount": 50000,
    "currency": "IDR"
  }
}
```

### Side Effects

Writes:

```txt
orders
order_items
```

Updates:

```txt
carts.status = converted
checkouts.status = confirmed
```

## GET `/api/v1/checkouts/:checkout_id`

Return checkout detail.

## POST `/api/v1/checkouts/:checkout_id/cancel`

Cancel checkout before payment.

## Validation Rules

Checkout must fail if:

- Cart is empty.
- Cart is not open/checkout_started.
- Product/variant inactive.
- Quantity invalid.
- Required customer info missing.
- Existing confirmed checkout for same idempotency key exists.

## Recommended Telegram Flow

```txt
View cart
-> Confirm checkout details
-> POST /checkouts
-> POST /checkouts/:id/confirm
-> POST /payments
-> Send payment link
```
