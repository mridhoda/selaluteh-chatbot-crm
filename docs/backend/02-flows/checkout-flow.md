# Checkout Flow

## Outlet-Aware Checkout

Checkout is created from a cart with:

```txt
workspace_id
outlet_id
contact_id
chat_id
```

## Steps

1. Customer clicks checkout.
2. Backend loads active cart.
3. Backend validates outlet_id exists.
4. Backend validates outlet is active.
5. Backend validates all products are available at outlet.
6. Backend recalculates totals.
7. Backend creates checkout.
8. Customer explicitly confirms checkout.
9. Backend creates order exactly once.
10. Backend creates payment attempt.
11. Backend marks checkout/cart as converted.
12. Backend sends payment link or manual/COD instruction.

## Current MVP Runtime

Telegram confirmation now performs:

```txt
confirm checkout
→ create Order
→ create Payment attempt
→ mark checkout converted
→ mark cart converted
→ show payment instruction
```

When `PAYMENT_PROVIDER=manual`, the customer sees a manual/COD instruction instead of a provider URL.

## Failure Cases

- no outlet selected
- outlet inactive
- product unavailable
- cart outlet mismatch
- payment provider unavailable
- amount mismatch between order total and payment request
- duplicate checkout confirmation
