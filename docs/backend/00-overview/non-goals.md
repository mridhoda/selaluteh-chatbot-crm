# Non-Goals

This document clarifies what the MVP should not try to solve.

## Not MVP

### Marketplace Complexity

- Multi-seller onboarding.
- Seller store pages.
- Seller wallet.
- Seller payout.
- Commission settlement.
- Seller disputes.
- Seller analytics.

### Advanced Commerce

- Voucher engine.
- Promotion engine.
- Dynamic pricing.
- Bundling.
- Loyalty points.
- Subscription commerce.
- Inventory reservation system.
- Warehouse management.
- Logistics provider automation.

### Payment Complexity

- Refund automation.
- Partial refund.
- Split payment.
- Escrow.
- Native wallet.
- Payout.
- Reconciliation dashboard.

### AI Complexity

- Fully autonomous sales agent.
- AI-controlled payment status.
- AI-generated product database without admin review.
- Advanced personalization/recommendation.
- Autonomous refund/dispute handling.

### Frontend Scope

- Full public web storefront.
- Mobile app.
- Customer account portal.
- Seller dashboard.

### Data Migration Scope

- Full Supabase Auth replacement if custom JWT remains enough for MVP.
- Moving all media into Supabase Storage.
- Rebuilding entire backend from scratch.

## Why Non-Goals Matter

The MVP must stay focused:

```txt
Telegram purchase flow + admin operations
```

Anything that delays this should be postponed.
