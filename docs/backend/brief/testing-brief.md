# Testing Brief

## Testing Goal

Ensure Telegram commerce MVP works without breaking existing CRM.

## Core Test Areas

### Existing CRM Regression

- Login.
- Dashboard.
- Platforms.
- Agents.
- Inbox.
- Chat messages.
- Human takeover.
- AI reply.
- Orders.
- Complaints.

### Telegram Tests

- `/start`
- Product list.
- Product detail.
- Add to cart.
- View cart.
- Checkout.
- Payment link message.
- Duplicate webhook event.
- Invalid callback payload.

### Payment Tests

- Create payment link.
- Receive sandbox webhook.
- Verify signature.
- Store payment event.
- Update payment status.
- Update order status.
- Duplicate webhook idempotency.

### Security Tests

- Unauthenticated order access denied.
- Unauthenticated complaint access denied.
- Cross-workspace data denied.
- Service role key not exposed.
- Payment spoof rejected.

### Data Migration Tests

- SQL migrations run cleanly.
- Import dry run works.
- Count validation works.
- Message order preserved.
- File metadata maps correctly.

## MVP Acceptance Test

End-to-end:

```txt
Telegram user
→ product
→ cart
→ checkout
→ payment link
→ sandbox paid webhook
→ paid order
→ admin sees order
```

## Testing Rule

Do not claim tests passed unless they were actually run.

If not run, write:

```txt
Not run — reason: ...
```
