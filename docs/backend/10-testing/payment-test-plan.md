# Payment Test Plan

## Goal

Validate payment gateway sandbox integration and payment state machine.

## Scope

- Create payment link.
- Create manual/COD payment instruction.
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
- Xendit Test Mode Payment Session creates `payment_session_id` and `payment_link_url` via mocked `POST /sessions`.
- Xendit create-session endpoint reuses active pending session.
- Xendit create-session endpoint rejects already paid order.
- `Idempotency-Key` returns existing result for same workspace/order/request.
- Manual/COD provider stores pending payment with no payment URL.
- Existing pending/paid payment attempt is reused.
- Client-provided amount mismatch is rejected.

### Webhook Security

- Valid signature accepted.
- Invalid signature rejected.
- Missing signature rejected.
- Unknown provider transaction id logged.
- Xendit `x-callback-token` valid accepted.
- Xendit missing/invalid `x-callback-token` rejected with no mutation.
- Xendit `payment_session.completed` validates provider session ID, reference, amount, and currency.
- Xendit `payment_session.expired` marks payment/order payment status expired without downgrading paid.

### Idempotency

- Duplicate paid webhook does not send duplicate notification.
- Duplicate event does not create duplicate payment_events row.
- Payment event timeline links event to payment and order.
- Duplicate Xendit session webhook returns safe no-op.

### Notification

- Paid payment sends Telegram notification once.
- Notification failure does not revert payment status.
- Failed notification is retryable.

## Automated Coverage Current State

```txt
payment-attempt.integration.test.js
payment-webhook.integration.test.js
payment-reconciliation.unit.test.js
xendit-client.unit.test.js
```

Current passing suite covers manual payment creation, reusable attempts, amount mismatch rejection, Xendit adapter payload/status/webhook-token mapping, payment webhook duplicate handling, payment/order paid transition, and payment event timeline references.

## Sandbox Manual Test

1. Start backend with `PAYMENT_PROVIDER=xendit`, `XENDIT_MODE=test`, `XENDIT_SECRET_API_KEY`, and `XENDIT_WEBHOOK_VERIFICATION_TOKEN` in `server/.env`.
2. Expose backend through HTTPS tunnel.
3. Configure Xendit Test Mode webhook URL: `<APP_PUBLIC_URL>/api/webhooks/xendit/payment-sessions`.
4. Create order from Telegram or admin.
5. Call `POST /api/orders/:orderId/payments/xendit/session`.
6. Confirm `paymentLinkUrl` is stored and returned.
7. Open Xendit test checkout link.
8. Complete or simulate payment using Xendit-supported Test Mode behavior.
9. Confirm webhook received.
10. Confirm payment becomes paid.
11. Confirm `orders.payment_status` becomes paid without setting fulfillment completed.
12. Confirm Telegram paid notification is sent once.
13. Resend webhook from Xendit dashboard.
14. Confirm duplicate webhook has no duplicate side effect.
