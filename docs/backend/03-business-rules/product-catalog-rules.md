# Product Catalog Rules

## Product Ownership

Product is owned by workspace.

```txt
products.workspace_id
```

## Outlet Availability

Product visibility/orderability is controlled by:

```txt
product_outlet_availability
```

Fields:

```txt
workspace_id
product_id
outlet_id
is_available
price_override
stock_quantity
status
```

## Customer Product List Rule

Product appears in Telegram only if:

- product belongs to workspace
- product.status = active
- product.telegram_visible = true
- outlet is active
- product is available in selected outlet

## Price Rule

Backend calculates price.

Use:

```txt
price_override if exists
else product.base_price
```
