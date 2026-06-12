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
request_human_handoff(reason)
```

## Argument Rules

- Never trust IDs from AI without workspace/contact validation.
- Quantity must be integer and within bounds.
- Product/variant must be active.
- Checkout must be confirmed by user.
- Payment tools must not expose secret/provider credentials.

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
