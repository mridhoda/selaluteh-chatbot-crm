# Implementation Priority Brief

## Priority Order

1. Stabilize existing CRM.
2. Add service/repository boundaries.
3. Add webhook idempotency.
4. Add multi-outlet foundation.
5. Add product outlet availability.
6. Add Telegram outlet selection.
7. Add outlet-bound cart.
8. Add outlet-bound checkout/order.
9. Add payment sandbox/webhook.
10. Add admin Orders/Products/Payments outlet UI.
11. Add outlet access/security tests.

## Why Now

Cart, checkout, order, and payment must be outlet-bound. Adding outlet later will cause painful refactor.
