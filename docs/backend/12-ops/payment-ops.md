# Payment Operations

## Payment Providers

MVP may use:

- Midtrans sandbox.
- Xendit sandbox.
- Manual sandbox adapter.

## Payment Operational Rules

- Backend creates payment link.
- User pays on provider page.
- Provider webhook is authoritative.
- AI/user text cannot mark payment paid.
- Webhook must be signature-verified.
- Duplicate webhook must be idempotent.

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
