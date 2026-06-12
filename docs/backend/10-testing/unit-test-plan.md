# Unit Test Plan

## Goal

Unit tests verify isolated business logic without network, database, or provider calls.

## Recommended Test Targets

### Auth

- Password hashing/compare wrapper.
- JWT payload creation/verification.
- Role guard logic.
- Verified user requirement.

### Workspace/Tenant Logic

- `assertSameWorkspace(row, user)` passes for same workspace.
- Cross-workspace access throws forbidden.
- Agent role visibility rules.

### Telegram Parsing

- Extract text from message.
- Extract caption fallback.
- Extract callback query data.
- Extract platform message id.
- Normalize Telegram user/contact identity.

### Cart

- Add item to empty cart.
- Add same variant increments quantity.
- Remove item.
- Quantity cannot be zero/negative.
- Cart subtotal calculation.
- Cart currency consistency.

### Checkout

- Checkout cannot start with empty cart.
- Checkout snapshot preserves price/name at time of checkout.
- Checkout expires after configured duration.
- Checkout cannot be reused after completed/cancelled.

### Orders

- Create order from checkout.
- Normalize order items.
- Status transition validation.
- Invalid transition is rejected.
- Legacy AI form order remains supported.

### Payments

- Payment status transition validation.
- Provider event mapping.
- Signature validation helper.
- Duplicate provider event detection.
- Paid payment updates order exactly once.

### AI Actions

- Allowed action schema validation.
- Disallowed actions are rejected.
- `mark_order_paid` is never allowed from AI.
- Product recommendation can only reference active products.

### Files

- Safe filename generation.
- Relative path generation.
- MIME/type validation.
- Public path generation.

## Naming Convention

```txt
<module>.unit.test.js
```

Examples:

```txt
cart.service.unit.test.js
payment-signature.unit.test.js
telegram-parser.unit.test.js
order-status.unit.test.js
```

## Acceptance

- Unit tests are deterministic.
- Unit tests do not call external APIs.
- Unit tests run in under 30 seconds locally.
