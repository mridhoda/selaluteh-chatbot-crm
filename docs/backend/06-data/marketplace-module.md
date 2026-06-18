# Marketplace Module

Dokumen ini menjelaskan rancangan modul marketplace MVP yang ditambahkan di atas Chatbot CRM existing.

## MVP Positioning

Target saat ini adalah:

```txt
Telegram-first Single Merchant Commerce MVP
```

Bukan full multi-seller marketplace.

## Core Tables

```txt
product_categories
products
product_variants
product_outlet_availability
carts
cart_items
orders
order_items
order_events
payment_provider_settings
payments
payment_attempts
payment_events
```

Commerce MVP also depends on CRM/channel, access, agent, and complaint tables:

```txt
workspaces
workspace_settings
outlets
platforms
contacts
chats
chat_messages
user_workspace_memberships
user_outlet_access
agents
agent_outlets
complaints
```

## Product Catalog

Required for MVP:

```txt
name
slug
sku optional
base_price
cost_price optional
currency
is_active
short_description
thumbnail_file_id optional
thumbnail_url optional
tax_rate optional
tags optional
```

Optional:

```txt
sku
category_id
description
is_featured
stock_tracking
stock_quantity
metadata
```

## Variant

Use variants for size, flavor, package, and add-ons. If no variant exists, cart references product only.

## Cart

Recommended MVP rule:

```txt
One active cart per workspace + outlet + contact + platform.
```

Add-to-cart steps:

1. find active cart
2. create if missing
3. validate product/variant
4. resolve backend price
5. upsert cart item
6. recalculate totals

## Checkout

Checkout transforms cart into order.

Transaction steps:

```txt
validate cart
validate stock if enabled
create order
copy cart_items to order_items
mark cart status ordered
create payment link
send Telegram message
```

## Order

Order stores customer info, financial totals, fulfillment status, payment status, and legacy `form_data`.

Important:

```txt
orders.status != orders.payment_status
```

Order detail UI needs `order_events` for timeline/history:

```txt
created
paid
preparing
ready
completed
cancelled
note_added
```

Order rows should keep snapshots:

```txt
customer_name_snapshot
customer_phone_snapshot
channel_snapshot
product_name_snapshot on order_items
unit_price on order_items
```

## Payment

Payments page/detail requires:

```txt
payment_link
provider_ref
merchant_reference
reconciliation_status
provider_fee
net_amount
expires_at
paid_at
matched_at
```

Use `payment_attempts` for retry/payment-link history and `payment_events` for webhook/internal timeline events.

## Inventory

MVP recommendation:

```txt
stock_tracking=false
```

Good for first F&B/coffee MVP. If enabled, validate stock at checkout, not only add-to-cart.

## Suggested APIs

Admin:

```txt
GET/POST /products
GET/PUT /products/:id
POST /products/:id/variants
PUT /product-variants/:id
GET/POST /product-categories
```

Telegram/internal:

```txt
POST /commerce/cart/items
GET  /commerce/cart/current
POST /commerce/cart/clear
POST /commerce/checkout
GET  /commerce/orders/:id/status
```

Payment:

```txt
POST /payments/create-link
POST /webhook/payment/midtrans
```

## Admin UI Required

```txt
Products
Product Form
Orders
Order Detail
Payments/Transactions
```

Existing CRM pages stay useful:

```txt
Inbox
Contacts
Platforms
Agents
Human Takeover
```

Current MVP frontend also expects:

```txt
Outlets
Platforms
Settings - General
Settings - Payment Provider
Order Detail Timeline
Payment Detail Timeline
```

## Telegram UX

Main menu:

```txt
🛍 Lihat Produk
🛒 Keranjang
📦 Pesanan Saya
👩‍💻 Bicara Admin
```

Product detail buttons:

```txt
Tambah ke Keranjang
Lihat Keranjang
Kembali
```

Cart buttons:

```txt
Checkout
Tambah Lagi
Kosongkan Keranjang
```

## AI Role

AI can explain and recommend products, but must not invent price, mark payment paid, or create final order without backend validation.

## Acceptance Criteria

```txt
Admin can create product.
Telegram user can browse product.
Telegram user can add to cart.
Telegram user can checkout.
Order with order_items is created.
Payment link is generated.
Payment webhook marks order paid.
Telegram user receives paid notification.
Admin can see paid order.
```
