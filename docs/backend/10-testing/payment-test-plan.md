# Payment Test Plan

## Goal

Validate payment gateway sandbox integration and payment state machine.

## Scope

- Create payment link.
- Store payment transaction.
- Receive provider webhook.
- Verify signature.
- Update payment and order status.
- Notify Telegram customer.

## Payment Status Matrix

| Current | Incoming | Expected |
|---|---|---|
| pending | paid | payment=paid, order=paid |
| pending | expired | payment=expired, order=pending/expired depending policy |
| pending | failed | payment=failed, order=pending/payment_failed |
| paid | paid duplicate | no-op |
| paid | failed | reject/no-op |
| expired | paid | policy-dependent, usually reject/manual review |

## Test Cases

### Create Payment

- Pending order can create payment.
- Completed/cancelled order cannot create payment.
- Payment amount equals order total.
- Payment currency is correct.
- Payment link URL stored.

### Webhook Security

- Valid signature accepted.
- Invalid signature rejected.
- Missing signature rejected.
- Unknown provider transaction id logged.

### Idempotency

- Duplicate paid webhook does not send duplicate notification.
- Duplicate event does not create duplicate payment_events row.

### Notification

- Paid payment sends Telegram notification once.
- Notification failure does not revert payment status.
- Failed notification is retryable.

## Sandbox Manual Test

1. Create order from Telegram.
2. Receive sandbox payment link.
3. Pay via provider simulator.
4. Confirm webhook received.
5. Confirm order changed to paid.
6. Confirm Telegram paid notification.
7. Confirm admin order page shows paid.
