# Goals and KPI

## Product Goals

### Goal 1 — Enable Chat-Based Purchase

Customers should be able to complete a purchase flow from Telegram.

Target:

```txt
Telegram → product → cart → checkout → payment link → paid notification
```

### Goal 2 — Keep Admin in Control

Admin should be able to manage products, orders, payments, and customer chat from the dashboard.

### Goal 3 — Preserve Existing CRM

All existing core CRM features should continue to work while marketplace features are added.

### Goal 4 — Build Safe Payment Foundation

Payment status must be secure, webhook-driven, and idempotent.

### Goal 5 — Prepare Scalable Data Layer

The backend should be ready for Supabase/Postgres migration with workspace-scoped data and local media metadata.

## MVP Success Metrics

| Metric | Target for MVP |
|---|---:|
| Telegram product list response works | 100% in demo |
| Add-to-cart success rate | > 95% in test cases |
| Checkout creation success rate | > 95% in test cases |
| Payment webhook idempotency | 100% duplicate-safe |
| Paid order notification delivery | > 95% in test/staging |
| Admin can view paid order | 100% in demo |
| Existing login/dashboard smoke test | 100% pass |
| Existing Telegram basic AI reply | No regression |
| Cross-workspace access test | 0 known failures |
| Unauthenticated order access | 0 allowed |

## Engineering KPIs

| KPI | Target |
|---|---|
| P0 security issues before payment | 0 open |
| Public dangerous diagnostic routes | 0 |
| Service role exposed to frontend | 0 |
| Payment webhook without verification | 0 |
| Duplicate payment processing | 0 |
| Duplicate Telegram message handling | Idempotent |
| Missing workspace scope in tenant routes | 0 known P0 routes |

## Business KPIs After MVP

These are not required for technical MVP but should be tracked later:

- Number of Telegram conversations.
- Product view count.
- Add-to-cart count.
- Checkout started.
- Payment link clicked.
- Payment completed.
- Abandoned cart.
- Human takeover rate.
- AI resolution rate.
- Order completion time.
