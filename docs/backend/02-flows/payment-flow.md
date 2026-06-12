# Payment Flow

## Outlet-Aware Payment

Payment belongs to:

```txt
workspace_id
outlet_id
order_id
checkout_id
```

## Flow

```txt
order pending_payment
→ create provider transaction/payment link
→ send payment link
→ webhook received
→ verify signature
→ idempotency check
→ update payment
→ update order
→ notify customer
```

## Rule

Payment must update the order in the same workspace and outlet.

Future production may use workspace-specific payment credentials.
