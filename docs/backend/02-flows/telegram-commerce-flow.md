# Telegram Commerce Flow

## Updated Multi-Outlet Flow

```txt
/start
→ select outlet
→ list products available in outlet
→ view product
→ add to cart
→ cart bound to outlet
→ checkout
→ order bound to outlet
→ payment link sent
→ payment webhook updates order/payment
→ Telegram notification
```

## Required Context

Every commerce action must carry:

```txt
workspace_id
platform_id
chat_id
contact_id
active_outlet_id
```

## AI Role

AI may assist conversation and recommendation, but all commerce actions must go through backend services.

AI cannot:

- checkout without outlet
- offer unavailable outlet product
- mark payment paid
- change outlet without confirmation
