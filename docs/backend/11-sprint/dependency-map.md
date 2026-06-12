# Dependency Map

This document explains implementation dependencies.

## High-Level Dependency Chain

```txt
Security hardening
  ↓
Webhook idempotency
  ↓
Repository/service boundary
  ↓
Product catalog
  ↓
Cart
  ↓
Checkout
  ↓
Payment
  ↓
Admin ops
  ↓
MVP hardening
```

## Why This Order Matters

### Payment depends on Checkout

Payment requires a stable pending order. Do not implement payment first.

### Checkout depends on Cart

Checkout must convert a validated cart into order items.

### Cart depends on Product Catalog

Cart items must reference active products/variants.

### Telegram Commerce depends on Product + Cart

Telegram buttons need deterministic backend actions.

### AI Commerce depends on Backend Actions

AI should propose actions, but backend must validate product/cart/payment state.

## Parallelizable Work

Can be done in parallel:

- Product CRUD API and Product Admin UI.
- Payment provider research and payment model design.
- Security docs and route hardening.
- Migration SQL and repository layer design.

Should not be parallelized without coordination:

- Order schema changes and payment integration.
- Webhook idempotency and Telegram callback handling.
- Migration cutover and marketplace launch.
