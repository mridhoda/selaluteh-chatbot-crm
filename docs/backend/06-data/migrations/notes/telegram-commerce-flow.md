# Telegram Commerce Flow

This document defines the deterministic Telegram-first marketplace flow.

## Principle

Telegram is the storefront/chat interface. Postgres is the source of truth.

AI can recommend products and answer questions, but these backend services must own state changes:

```txt
ProductService
CartService
CheckoutService
OrderService
PaymentService
TelegramNotificationService
```

## Recommended Commands / Buttons

| Command/Button | Backend Action |
|---|---|
| `/start` | Show main menu |
| `Browse Products` | List active products/categories |
| `Product Detail` | Show product info and add-to-cart button |
| `Add to Cart` | Create/update cart item |
| `View Cart` | Show cart summary |
| `Checkout` | Create checkout draft / ask missing details |
| `Confirm Checkout` | Create pending order + payment link |
| `Order Status` | Show latest order/payment status |
| `Talk to Admin` | Set escalation / human takeover path |

## Flow

```txt
/start
  -> show menu
Browse Products
  -> products where status = active
Product Detail
  -> show price, stock, description, image
Add to Cart
  -> upsert active cart by workspace + contact + chat
View Cart
  -> summarize cart_items
Checkout
  -> collect name/phone/address if needed
Confirm Checkout
  -> create checkouts row
  -> create orders row
  -> copy cart_items into order_items snapshot
  -> create payment row/link
  -> send payment link
Payment Webhook
  -> verify signature
  -> update payments
  -> update orders.payment_status/status
  -> send Telegram notification
```

## Callback Data Pattern

Keep callback data short because Telegram has callback data limits.

Recommended pattern:

```txt
m:home
m:products
m:p:<shortProductId>
m:add:<shortProductId>:<shortVariantId>
m:cart
m:checkout
m:confirm:<shortCheckoutId>
m:order:<shortOrderId>
```

Map short ids to UUID server-side if needed.

## Idempotency

For every callback query:

1. Store/update `webhook_events` with Telegram `update_id`.
2. If duplicate, return quickly.
3. Avoid creating duplicate cart/order/payment.

## Cart Rules

- One active cart per `workspace_id + contact_id + chat_id` is recommended.
- Cart item uniqueness: `cart_id + product_id + variant_id`.
- Price snapshot must be stored when item is added.
- On checkout, copy cart item snapshots to `order_items`.

## AI Role

AI may:

- Help user choose product.
- Explain product details.
- Suggest categories.
- Ask clarifying questions.

AI may not directly:

- Mark orders as paid.
- Change payment status.
- Create payment provider transactions.
- Override inventory.
- Promise unavailable stock.

Use `ai_actions` for audit when AI proposes a commerce action.
