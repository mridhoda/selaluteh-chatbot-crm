# Marketplace Schema Notes

## MVP Scope

This schema targets a **single-merchant Telegram-first marketplace MVP**.

It is intentionally not a full multi-seller marketplace yet.

## Included

- Product categories.
- Products.
- Variants.
- Product images.
- Active carts.
- Cart items.
- Checkout confirmation.
- Orders.
- Order items.
- Payments.
- Payment events.
- Telegram webhook idempotency.
- AI action audit.

## Excluded for MVP

- Seller accounts.
- Seller wallets.
- Commission calculation.
- Payouts.
- Marketplace dispute system.
- Review/rating.
- Courier integration.
- Advanced promo engine.

## Why `orders` Supports Both Legacy and Marketplace

Existing app already has an AI-generated `Order` model. Removing it would break current behavior.

So the new `orders` table supports both:

```txt
Legacy AI form order:
  source = ai_form
  form_name
  form_data

New marketplace order:
  source = telegram
  cart_id
  checkout_id
  order_items
  payments
```

## Product Data Source

Long-term product data should live in:

```txt
products
product_variants
product_images
product_categories
```

Legacy `agent_products` and `agent_sales_form_products` are preserved only for compatibility.

## Price Snapshot Rule

Always snapshot price/name/sku into:

```txt
cart_items.product_snapshot
order_items.product_snapshot
```

This protects historical orders if product price/name changes later.

## Inventory Rule

MVP can start with `inventory_policy = do_not_track`.

When stock matters:

- Check `stock_quantity` before add-to-cart and checkout.
- Deduct/reserve stock only after order/payment rule is chosen.
- For food/drink MVP, simplest rule: deduct stock on paid order.

## Payment Rule

Order is not paid because AI says so.

Only payment webhook or admin action can change:

```txt
orders.payment_status = paid/settlement/capture
orders.status = paid
```
