# Release Plan

## Release Strategy

Release dilakukan bertahap untuk menjaga existing CRM tetap stabil.

```txt
R0 Stabilization
R1 Product Catalog
R2 Telegram Cart
R3 Checkout + Orders
R4 Payment Sandbox
R5 Admin Marketplace UI
R6 MVP Hardening
```

## R0 — Stabilization

Goal:

- existing app aman untuk dikembangkan.

Deliverables:

- secure orders/complaints routes,
- remove/protect diagnostic routes,
- add webhook idempotency plan,
- mount missing settings route if needed,
- ensure workspace scoping.

Exit criteria:

- no unauthenticated access to orders/complaints,
- existing Telegram chat still works,
- existing dashboard still works.

## R1 — Product Catalog

Goal:

- admin can manage products.

Deliverables:

- product/category/variant schema,
- product API,
- product CRUD dashboard,
- product image local storage metadata.

Exit criteria:

- admin can create active product,
- Telegram backend can query active products.

## R2 — Telegram Cart

Goal:

- customer can add products to cart from Telegram.

Deliverables:

- cart/cart_item schema,
- Telegram inline keyboard helpers,
- browse product flow,
- add to cart flow,
- view cart flow.

Exit criteria:

- customer can add product to cart,
- cart state persists.

## R3 — Checkout + Orders

Goal:

- cart becomes structured order.

Deliverables:

- checkout session,
- order source/type support,
- order_items,
- order summary in Telegram,
- admin order detail.

Exit criteria:

- customer can confirm checkout,
- backend creates order and order_items.

## R4 — Payment Sandbox

Goal:

- order can be paid via sandbox payment link.

Deliverables:

- payment provider client,
- payments table/model,
- payment_events,
- payment webhook,
- signature verification,
- Telegram payment success notification.

Exit criteria:

- sandbox payment success updates order paid.

## R5 — Admin Marketplace UI

Goal:

- admin can operate MVP.

Deliverables:

- product page,
- order detail page,
- payment status UI,
- chat/order context panel.

Exit criteria:

- admin can process paid order from dashboard.

## R6 — MVP Hardening

Goal:

- reliable MVP demo/launch.

Deliverables:

- test fixtures,
- webhook retry tests,
- payment duplicate tests,
- access control tests,
- staging dry run,
- logs/observability.

Exit criteria:

- end-to-end Telegram purchase flow works reliably.
