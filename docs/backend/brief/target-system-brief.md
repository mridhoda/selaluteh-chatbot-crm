# Target System Brief

## Target Backend Type

```txt
AI CRM + Telegram conversational commerce backend
```

## Target Architecture Summary

```txt
Telegram user
  ↓
Telegram webhook
  ↓
Webhook idempotency
  ↓
Chat/contact/session resolution
  ↓
Commerce action parser
  ↓
Product/cart/checkout/order/payment services
  ↓
Database
  ↓
Telegram response
```

## Target Database Direction

Current runtime:

```txt
MongoDB/Mongoose
```

Target migration:

```txt
Supabase/Postgres
```

Storage decision:

```txt
Structured data → Supabase/Postgres
Large media files → local server filesystem
File metadata → database files table
```

## Target Data Modules

Core CRM:

- workspaces
- users
- platforms
- agents
- contacts
- chats
- messages
- orders
- complaints
- files

Marketplace:

- product_categories
- products
- product_variants
- product_images
- carts
- cart_items
- checkouts
- order_items
- payments
- payment_events
- webhook_events
- ai_actions

## Target Commerce Flow

```txt
Product
→ Cart
→ Checkout
→ Order
→ Payment
→ Payment Event
→ Fulfillment Status
```

## Target AI Role

AI should become a safe assistant:

- Answer product questions.
- Recommend product.
- Explain checkout steps.
- Suggest action.
- Escalate when unsure.

Backend remains source of truth.

## Target Admin Role

Admin should operate:

- products
- chats
- orders
- payment status
- complaints
- agents
- platforms
