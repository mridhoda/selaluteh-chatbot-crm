# Payment Operations

## Payment Providers

MVP may use:

- Midtrans sandbox.
- Xendit sandbox.
- Manual sandbox adapter.

## Payment Operational Rules

- Backend creates payment link.
- With `PAYMENT_PROVIDER=manual`, backend creates manual/COD instruction and keeps payment pending.
- User pays on provider page.
- Provider webhook is authoritative.
- AI/user text cannot mark payment paid.
- Webhook must be signature-verified.
- Duplicate webhook must be idempotent.
- PaymentEvent timeline should be checked before manual correction.

## Payment Statuses

Recommended:

```txt
pending
requires_action
paid
failed
expired
cancelled
refunded
```

## Payment Incident Examples

### Fake Paid Order

Severity:

```txt
SEV-1
```

Immediate action:

1. Disable payment webhook.
2. Check signature verification.
3. Check payment event logs.
4. Revert affected order status.
5. Notify admin.

### Payment Webhook Down

Severity:

```txt
SEV-2
```

Action:

1. Check backend health.
2. Check provider dashboard.
3. Replay webhook if provider supports.
4. Manually verify payment if needed.
5. Patch payment/order status only with verified evidence.

### Duplicate Payment Notification

Severity:

```txt
SEV-2/3
```

Action:

1. Check idempotency key.
2. Check payment event uniqueness.
3. Prevent duplicate notification.
4. Add regression test.

## Daily Payment Ops Checks

- [ ] No failed webhooks.
- [ ] No invalid signature spike.
- [ ] No payment/order mismatch.
- [ ] Paid orders visible in admin.
- [ ] Duplicate event count normal.

## MVP Telegram QA Setup

Required environment:

```txt
PAYMENT_PROVIDER=manual              # local/COD smoke test
PAYMENT_PROVIDER=midtrans|xendit     # sandbox link smoke test
PUBLIC_BASE_URL=https://<stable-or-tunnel-url>
PAYMENT_WEBHOOK_SECRET=<provider secret when applicable>
```

Smoke sequence:

1. Telegram customer confirms checkout.
2. Verify order exists and `paymentStatus=pending`.
3. Verify payment attempt exists.
4. Verify Telegram message shows payment link or manual/COD instruction.
5. For provider sandbox, send paid webhook.
6. Verify payment/order become paid.
7. Verify `GET /api/payments/:paymentId/events` shows processed event.
