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

## Xendit Test Mode Payment Session Flow

When `PAYMENT_PROVIDER=xendit`, the MVP uses Xendit Test Mode Payment Sessions:

```txt
admin/chat commerce flow
→ POST /api/orders/:orderId/payments/xendit/session
→ backend loads authoritative order total
→ backend creates Xendit POST /sessions with session_type=PAY and mode=PAYMENT_LINK
→ backend stores provider payment_session_id and payment_link_url in Supabase payments
→ customer receives Xendit-hosted checkout URL
→ Xendit sends payment_session.completed or payment_session.expired webhook
→ backend verifies x-callback-token
→ backend validates provider session, reference, amount, and currency
→ payment status changes independently from order fulfillment status
```

The return URL only tells the UI that verification is pending. It must not mark an order paid.

## Rule

Payment must update the order in the same workspace and outlet.

Payment amount must equal the authoritative order total. Client-provided amount mismatch is rejected.

Future production may use workspace-specific payment credentials.
