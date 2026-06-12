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
8. Backend creates order.
9. Backend creates payment link.
10. Backend sends payment link.

## Failure Cases

- no outlet selected
- outlet inactive
- product unavailable
- cart outlet mismatch
- payment provider unavailable
