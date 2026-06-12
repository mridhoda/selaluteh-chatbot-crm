# Task Breakdown

Dokumen ini memecah pekerjaan menjadi task kecil yang bisa dilempar ke AI coding agent.

## Task Template

```md
## Task: <name>

### Context
...

### Files Likely To Change
- ...

### Requirements
- [ ] ...

### Acceptance Criteria
- [ ] ...

### Do Not Break
- ...
```

## Security Tasks

### Task: Secure Orders Routes

Context:

Existing orders routes must not be public.

Files likely to change:

- `server/src/routes/orders.js`
- `server/src/middleware/auth.js`
- order repository/service if available

Requirements:

- [ ] Add auth middleware.
- [ ] Attach user/workspace.
- [ ] Filter all reads by workspace.
- [ ] Validate workspace on update/delete.
- [ ] Return 404 instead of leaking cross-workspace existence.

Acceptance Criteria:

- [ ] Unauthenticated request gets 401.
- [ ] Other workspace order cannot be accessed.
- [ ] Existing Orders UI still loads for owner.

### Task: Add Webhook Event Idempotency

Files likely to change:

- `server/src/models/WebhookEvent.js`
- `server/src/routes/webhooks/telegram.js`
- `server/src/routes/webhooks/meta.js`
- `server/src/routes/webhooks/payment.js`

Requirements:

- [ ] Store provider, event id, workspace id, payload hash.
- [ ] Skip duplicate event id.
- [ ] Record processing status.
- [ ] Record error if processing fails.

Acceptance Criteria:

- [ ] Same Telegram message does not duplicate internal message.
- [ ] Same payment webhook does not double-update order.

## Commerce Tasks

### Task: Add Product Catalog

Files likely to change:

- `server/src/models/Product.js`
- `server/src/models/ProductCategory.js`
- `server/src/models/ProductVariant.js`
- `server/src/routes/products.js`
- `server/src/services/products.service.js`

Requirements:

- [ ] Workspace scoped products.
- [ ] Status: draft/active/archived.
- [ ] Price stored in smallest currency unit.
- [ ] Product can have variants.
- [ ] Product can be shown in Telegram if active.

Acceptance Criteria:

- [ ] Owner can create product.
- [ ] Telegram service can list active products.

### Task: Add Cart Service

Requirements:

- [ ] One active cart per contact/platform/session.
- [ ] Add item.
- [ ] Update quantity.
- [ ] Remove item.
- [ ] Clear cart.
- [ ] Validate product active before add.

Acceptance Criteria:

- [ ] Cart total is calculated by backend.
- [ ] Invalid/inactive product cannot be added.

### Task: Add Checkout Service

Requirements:

- [ ] Convert cart to checkout.
- [ ] Confirm checkout before order creation.
- [ ] Create order items snapshot.
- [ ] Prevent duplicate checkout.

Acceptance Criteria:

- [ ] Cart cannot be checked out twice.
- [ ] Order items preserve product name/price at checkout time.

## Payment Tasks

### Task: Add Payment Provider Adapter

Requirements:

- [ ] Common interface: createPaymentLink, verifyWebhook, mapStatus.
- [ ] Sandbox mode.
- [ ] Store provider reference id.
- [ ] Store payment link url.
- [ ] Store raw event safely.

Acceptance Criteria:

- [ ] Payment can be created without changing Telegram code.
- [ ] Provider can be swapped later.

## Telegram Tasks

### Task: Add Inline Keyboard Helpers

Requirements:

- [ ] Send inline buttons.
- [ ] Encode callback action.
- [ ] Validate callback payload.
- [ ] Keep payload small.

Acceptance Criteria:

- [ ] Product list has buttons.
- [ ] Add-to-cart callback works.

## AI Tasks

### Task: Add AI Action Logging

Requirements:

- [ ] Store AI proposed action.
- [ ] Backend validates before execution.
- [ ] Prevent AI from marking payment paid.

Acceptance Criteria:

- [ ] AI recommendation works.
- [ ] AI cannot bypass checkout/payment rules.
