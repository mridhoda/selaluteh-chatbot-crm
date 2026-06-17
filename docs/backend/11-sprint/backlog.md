# Backlog

## Multi-Outlet Foundation (Selesai — Sprint 1.5)

- [x] Add outlets model/table.
- [x] Add user outlet access.
- [x] Add product outlet availability.
- [x] Add outlet_id to cart/checkout/order/payment.
- [x] Add current_outlet_id to chats.
- [x] Add outlet API.
- [x] Add outlet access API.
- [x] Add outlet filter in orders/payments/chats/products.
- [x] Add Telegram outlet selection.
- [x] Add product filtering by outlet.
- [x] Add cart outlet binding.
- [x] Add checkout outlet validation.
- [x] Add outlet access tests.
- [ ] Add Orders UI outlet filter/column/detail. (Frontend — belum)

## Post-MVP Hardening

- Notification service dengan idempotency
- Payment reconciliation worker (missing-webhook scan)
- Cart expiry worker (code ada, jalankan di production)
- Inventory tracking (quantity/reservation)
- Audit logging
- Analytics/reports

## Future Multi-Workspace

- Workspace switcher.
- Multi-workspace onboarding.
- Workspace billing.
- Franchise owner isolation.
- Workspace-specific payment/platform credentials.
