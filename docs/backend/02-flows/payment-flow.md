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
order new with payment_status pending
→ create provider transaction/payment link
→ send payment link or manual/COD instruction
→ webhook received
→ verify signature
→ idempotency check
→ link payment_event to payment/order
→ update payment
→ update order payment_status and lifecycle status when appropriate
→ notify customer after state is persisted
```

## Manual/COD MVP Flow

When `PAYMENT_PROVIDER=manual`:

```txt
checkout confirmed
→ order created
→ payment attempt created with provider=manual
→ order.paymentStatus=pending
→ Telegram shows manual/COD instruction
→ outlet/admin verifies payment operationally
```

Manual/COD does not mark payment as `paid` automatically. Paid state still requires verified gateway webhook or an approved audited manual admin flow in a later task.

## Rule

Payment must update the order in the same workspace and outlet.

Payment amount must equal the authoritative order total. Client-provided amount mismatch is rejected.

Future production may use workspace-specific payment credentials.
