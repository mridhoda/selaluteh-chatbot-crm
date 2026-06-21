# Tool Calling Contract

Dokumen ini menjelaskan kontrak internal jika AI memakai tool/function calling.

## Principle

Tool calling harus menjadi layer aman antara AI dan backend.

```txt
AI selects tool + arguments
Backend validates arguments
Backend executes service
Backend returns safe result
```

## Recommended Tools

```txt
search_products(query)
get_product_detail(product_id)
get_cart()
add_cart_item(variant_id, quantity)
remove_cart_item(cart_item_id)
start_checkout()
confirm_checkout(checkout_id)
get_order_status(order_id/order_code)
create_payment_link(order_id)
get_payment_status(payment_id)
resend_payment_link(payment_id)
request_human_handoff(reason)
```

## Argument Rules

- Never trust IDs from AI without workspace/contact validation.
- Quantity must be integer and within bounds.
- Product/variant must be active.
- Checkout must be confirmed by user.
- Payment tools must not expose secret/provider credentials.
- Payment tools must not accept trusted amount, currency, workspace ID, outlet ID, or paid status from AI arguments.
- `create_payment_link` must call backend payment service, which loads the authoritative order and creates/reuses a Xendit Test Mode Payment Session.
- `get_payment_status` and `resend_payment_link` must enforce workspace and outlet access.

## Result Rules

Tool results returned to AI should be minimal and safe:

```json
{
  "ok": true,
  "cart_summary": {
    "items": 2,
    "total": 50000
  }
}
```

Do not return full database rows if not needed.

Payment tool results should return only safe fields:

```json
{
  "ok": true,
  "payment": {
    "status": "pending",
    "provider": "xendit",
    "environment": "test",
    "paymentLinkUrl": "https://dev.xen.to/example",
    "expiresAt": "2026-06-19T07:30:00.000Z"
  }
}
```

Never return Xendit API keys, webhook tokens, Authorization headers, or raw provider payloads to AI.
