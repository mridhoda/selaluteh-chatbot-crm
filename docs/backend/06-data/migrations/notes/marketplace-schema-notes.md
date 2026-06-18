# Marketplace Schema Notes

## MVP Scope

This schema targets a **single-merchant Telegram-first marketplace MVP**.

It is intentionally not a full multi-seller marketplace yet.

Canonical source of truth:

```txt
database-schema.md
migrations/sql/001..005
```

## Included

Core admin/commerce tables (26):

```txt
users, workspaces, workspace_settings, outlets
user_workspace_memberships, user_outlet_access
platforms, contacts, chats, chat_messages
product_categories, products, product_variants, product_outlet_availability
carts, cart_items, orders, order_items, order_events
payment_provider_settings, payments, payment_attempts, payment_events
agents, agent_outlets, complaints
```

Operational runtime tables:

```txt
files
webhook_events
ai_actions
checkouts
```

## Excluded for MVP

- Seller accounts.
- Seller wallets.
- Commission calculation.
- Payouts.
- Marketplace dispute system.
- Review/rating.
- Courier integration.
- Advanced promo engine.
- Billing/subscription tables.

## Why `orders` Supports Both Legacy and Marketplace

Existing app already has an AI-generated `Order` model. Removing it would break current behavior.

So the new `orders` table supports both:

```txt
Legacy AI form order:
  source = ai_form
  form_data
  status = new
  payment_status = unpaid

New marketplace order:
  source = telegram
  cart_id
  checkout_id optional
  order_items
  payments
  status = new -> accepted -> preparing -> ready -> completed
  payment_status = pending -> paid
```

## Agent Configuration

Agent settings are stored as embedded JSON in `agents`:

```txt
tools, knowledge, follow_ups, database, complaint_fields,
complaint_notification, sales_forms, payment
```

Outlet mapping uses `agent_outlets.outlet_id` FK, not string arrays.

Legacy agent-embedded products inside `sales_forms` remain for compatibility until migrated to `products`.

## Price Snapshot Rule

Always snapshot price/name into:

```txt
cart_items.product_name_snapshot
cart_items.variant_name_snapshot
cart_items.unit_price
order_items.product_name_snapshot
order_items.variant_name_snapshot
order_items.unit_price
```

## Inventory Rule

MVP can start with `products.stock_tracking = false`.

When stock matters:

- Check `product_outlet_availability.stock_quantity` or `products.stock_quantity` before add-to-cart and checkout.
- Simplest F&B rule: deduct stock when `orders.payment_status = paid`.

## Payment Rule

Order is not paid because AI says so.

Only payment webhook or authorized admin can change:

```txt
payments.status = paid
orders.payment_status = paid
orders.status = accepted
```

Insert matching timeline rows in `order_events` and `payment_events`.
