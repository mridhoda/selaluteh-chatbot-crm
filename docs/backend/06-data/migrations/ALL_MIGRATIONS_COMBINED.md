# Data Migrations Combined Bundle

Generated from individual source files in `docs/backend/06-data/migrations`. If conflicts appear, treat the individual file as source of truth and regenerate this bundle.

# File: README.md

```md
# Data Migrations — Telegram Marketplace MVP v2

Folder ini adalah versi baru dari migration pack Supabase/Postgres untuk project **KALIS.AI / eskala-bot**.

Versi ini tetap mendukung migrasi dari MongoDB/Mongoose, tetapi skemanya sudah diperluas untuk rancangan terbaru:

```txt
Existing app:
  Chatbot CRM + Telegram/WhatsApp/Instagram webhook + AI Agent + Human Takeover

New MVP direction:
  Telegram-first single-merchant marketplace
  Product catalog -> Cart -> Checkout -> Order -> Payment gateway sandbox -> Payment webhook
```

## Structure

```txt
migrations-v2/
  README.md
  sql/
    001_extensions_and_enums.sql
    002_core_identity.sql
    003_platforms_agents.sql
    004_crm_chats_messages.sql
    005_orders_complaints_files.sql
    006_indexes.sql
    007_rls_policies.sql
    008_local_file_storage.sql
    009_migration_validation_queries.sql
  notes/
    mongo-to-postgres-mapping.md
    data-backfill-order.md
    cutover-plan.md
    telegram-commerce-flow.md
    payment-gateway-contract.md
    repository-layer-contract.md
    marketplace-schema-notes.md
  checklists/
    pre-migration-checklist.md
    post-migration-checklist.md
    marketplace-mvp-checklist.md
  manifest.json
  ALL_MIGRATIONS_COMBINED.md
```

## Canonical Schema Source

All docs and SQL in this folder are aligned to:

```txt
docs/backend/06-data/database-schema.md   # canonical field names + status enums
docs/backend/06-data/entities.md
docs/backend/06-data/query-contracts.md
```

Key naming decisions:

```txt
workspace_settings        replaces settings
chat_messages             replaces messages
taken_over_by_user_id     replaces takeover_by
contacts.external_id      replaces platform_account_id
agents.* JSONB fields     replaces normalized agent child tables
agent_outlets.outlet_id   replaces legacy agent.outlets string array
```

Operational tables required at runtime:

```txt
files, webhook_events, ai_actions, checkouts
```

## How to Use

1. Review all docs in `notes/` and `checklists/`.
2. Run SQL files `001` to `008` on a fresh Supabase staging project.
3. Use `009_migration_validation_queries.sql` only for manual validation, not as an automatic migration.
4. Build repository layer so app routes can move from Mongoose to Supabase table-by-table.
5. Run import script in dry-run mode first.
6. Migrate old CRM data.
7. Add marketplace data and Telegram commerce flow.
8. Test with Telegram bot sandbox/test bot.
9. Add Midtrans/Xendit sandbox payment flow.
10. Cutover only after pre/post migration checklists pass.

## Core Decisions

- `workspace_id` is the tenant boundary for every operational table.
- Postgres stores structured data and file metadata.
- Local server filesystem stores media binaries.
- AI can assist commerce but must not be the source of truth for order/payment state.
- Cart, checkout, order, and payment must be deterministic backend flows.
- Public webhooks write through backend service role, but provider validation and idempotency are mandatory.

## New Marketplace Tables

```txt
product_categories
products
product_variants
product_images
carts
cart_items
checkouts
orders
order_items
payments
payment_events
webhook_events
ai_actions
```

## Important Compatibility Notes

The old `orders` model created by `FILE_ORDER_JSON` is not removed. It is absorbed into the expanded `orders` table using:

```txt
source = ai_form
form_name
form_data
status = new / processed / completed / cancelled
```

New Telegram marketplace orders should use:

```txt
source = telegram
cart_id
checkout_id
order_items
payments
payment_events
```

## Status

These are migration drafts and should be reviewed in staging before production.
```

# File: checklists/marketplace-mvp-checklist.md

```md
# Telegram Marketplace MVP Checklist

## Product Catalog

- [ ] Admin can create category.
- [ ] Admin can create product.
- [ ] Product has price, status, and optional image.
- [ ] Product can be archived without deleting historical order references.
- [ ] Product list API is workspace scoped.

## Telegram Flow

- [ ] `/start` shows marketplace menu.
- [ ] Product list button works.
- [ ] Product detail button works.
- [ ] Add-to-cart callback works.
- [ ] Duplicate callback does not duplicate cart item/order.
- [ ] View cart works.
- [ ] Checkout asks missing customer info.
- [ ] Confirm checkout creates order.

## Cart / Checkout

- [ ] Active cart is unique per contact/chat where intended.
- [ ] Cart item quantity can be increased/decreased.
- [ ] Cart totals are recalculated server-side.
- [ ] Checkout snapshots customer data.
- [ ] Order snapshots product data into `order_items`.

## Payment Sandbox

- [ ] Midtrans/Xendit sandbox keys are server-side only.
- [ ] Payment link can be generated for order.
- [ ] Payment row is created.
- [ ] Payment webhook signature is verified.
- [ ] Payment event is saved.
- [ ] Order becomes paid only after verified webhook.
- [ ] Telegram paid notification is sent once.

## AI Guardrails

- [ ] AI can recommend products.
- [ ] AI cannot mark payment as paid.
- [ ] AI cannot bypass checkout confirmation.
- [ ] AI commerce action is logged in `ai_actions`.
- [ ] Human takeover disables AI replies.

## Admin

- [ ] Orders page shows order items.
- [ ] Orders page shows payment status.
- [ ] Admin can update fulfillment status.
- [ ] Admin can inspect Telegram chat related to order.
```

# File: checklists/post-migration-checklist.md

```md
# Post-Migration Checklist — v2

## Data Counts

- [ ] Users count matches expected.
- [ ] Platforms count matches expected.
- [ ] Agents count matches expected.
- [ ] Contacts count matches expected.
- [ ] Chats count matches expected.
- [ ] Messages count matches expected.
- [ ] Legacy orders count matches expected.
- [ ] Complaints count matches expected.
- [ ] Files metadata count matches migrated attachments.
- [ ] Local media files exist on server.
- [ ] Product catalog count matches expected if bootstrapped.

## App Smoke Tests

- [ ] Login works.
- [ ] Billing loads.
- [ ] Profile loads.
- [ ] Platforms page loads.
- [ ] Agents page loads.
- [ ] Inbox loads.
- [ ] Chat messages load in correct order.
- [ ] Unread reset works.
- [ ] Takeover works.
- [ ] Human reply sends and stores message.
- [ ] AI reply works.
- [ ] AI escalation sets `is_escalated`.
- [ ] Legacy order status update works.
- [ ] Complaint status update works.
- [ ] Local `/files` URLs resolve.

## Security Tests

- [ ] User cannot read another workspace's chats.
- [ ] User cannot read another workspace's contacts.
- [ ] User cannot read another workspace's products.
- [ ] User cannot read another workspace's orders.
- [ ] Agent role cannot see unassigned workspace chats unless intended.
- [ ] Service role key is not exposed to frontend.
- [ ] Payment webhook endpoint rejects invalid signature.
- [ ] Telegram duplicate update does not create duplicate message/order.

## Marketplace Smoke Tests

- [ ] Admin can create/update/archive product.
- [ ] Telegram product list works.
- [ ] Telegram product detail works.
- [ ] Add to cart works.
- [ ] View cart works.
- [ ] Checkout confirmation works.
- [ ] Pending order is created with order items.
- [ ] Payment sandbox link is created.
- [ ] Payment event is saved.
- [ ] Order status becomes `paid` after payment webhook.
- [ ] Telegram paid notification is sent.
```

# File: checklists/pre-migration-checklist.md

```md
# Pre-Migration Checklist — v2

## Code Safety

- [ ] Orders routes require auth.
- [ ] Complaints routes require auth.
- [ ] Orders are workspace-scoped.
- [ ] Complaints are workspace-scoped.
- [ ] Settings route is mounted or frontend dependency is removed.
- [ ] Diagnostic routes are removed or protected.
- [ ] Webhook duplicate message handling is implemented or planned.
- [ ] File upload size/type limits are defined.
- [ ] Platform tokens/secrets are not logged.
- [ ] `.env` is not committed.
- [ ] Any exposed secret has been rotated.

## Data Safety

- [ ] Mongo backup exists.
- [ ] Local `uploads` backup exists.
- [ ] Database backup and uploads backup are from the same time window.
- [ ] Distinct workspace ids are counted.
- [ ] Orphan chats are identified.
- [ ] Orphan messages are identified.
- [ ] Missing contact/platform/agent references are identified.
- [ ] Legacy order statuses are mapped.
- [ ] Manual payment proof files are mapped.

## Supabase Readiness

- [ ] Supabase project created.
- [ ] SQL migrations run in staging.
- [ ] RLS policies reviewed.
- [ ] Service role key stored server-side only.
- [ ] Anon key is safe to expose only if frontend direct reads are intentionally enabled.
- [ ] Persistent local upload directory prepared.
- [ ] Docker/server deployment will not wipe uploads.
- [ ] Upload directory backup strategy prepared.
- [ ] Import script tested on sample data.
- [ ] `sql/009_migration_validation_queries.sql` tested.

## Marketplace Readiness Before Enabling Commerce

- [ ] Product catalog admin flow exists or seed products are ready.
- [ ] Cart service is deterministic.
- [ ] Checkout confirmation exists.
- [ ] Order items are created from cart snapshot.
- [ ] AI is prevented from directly creating paid orders.
- [ ] Payment sandbox keys are configured server-side.
- [ ] Payment webhook signature verification is implemented.
- [ ] Telegram inline keyboard/callback idempotency is implemented.
```

# File: notes/cutover-plan.md

```md
# Cutover Plan — v2

## Goal

Switch production backend reads/writes from MongoDB to Supabase/Postgres with minimal data loss risk while preparing the app for Telegram marketplace MVP.

## Recommended Cutover

1. Announce maintenance window.
2. Stop webhook ingestion or point Telegram/Meta webhooks to a maintenance endpoint.
3. Stop backend worker/follow-up scheduler.
4. Disable AI auto-side-effects temporarily if still using `FILE_ORDER_JSON` flow.
5. Run final Mongo export.
6. Ensure local `uploads` are present on target server.
7. Run import into Supabase/Postgres.
8. Run validation queries from `sql/009_migration_validation_queries.sql`.
9. Switch backend env to Supabase.
10. Start backend.
11. Re-enable webhooks.
12. Run smoke tests.
13. Re-enable AI and follow-up scheduler.
14. Enable Telegram marketplace flow only after CRM smoke tests pass.

## Smoke Tests — Existing CRM

- Login owner.
- Load `/billing`.
- Load `/platforms`.
- Load `/agents`.
- Load `/chats`.
- Open chat messages.
- Send human reply in test chat.
- Receive Telegram test webhook.
- Verify duplicate Telegram update does not duplicate message.
- Verify AI skip when `taken_over_by_user_id` exists.
- Create/update legacy order.
- Create/update complaint.
- Confirm local file URLs still resolve.

## Smoke Tests — New Marketplace MVP

- Admin creates category.
- Admin creates product.
- Telegram `/start` shows menu.
- User opens product list.
- User adds product to cart.
- User views cart.
- User confirms checkout.
- Backend creates pending order with order items.
- Payment sandbox link is created.
- Payment webhook updates payment and order status.
- Telegram user receives paid confirmation.

## Rollback

Rollback is only safe if:

- Mongo writes were frozen during cutover.
- Local uploads were not modified or lost during cutover.
- Webhooks were not writing to Supabase only.
- No new production data must be preserved from Supabase.

If rollback is needed:

1. Disable webhooks again.
2. Stop backend.
3. Restore Mongo env.
4. Start old backend.
5. Re-enable webhooks to old backend.
6. Keep Supabase copy for postmortem.

## No-Rollback Zone

Once live Telegram marketplace orders/payments are written only to Supabase, rollback to Mongo requires data reconciliation.

Before entering no-rollback zone, ensure:

- Supabase backup is enabled.
- Uploads backup is enabled.
- Payment webhook logs are stored.
- Order/payment reconciliation query is ready.
```

# File: notes/data-backfill-order.md

```md
# Data Backfill Order — v2

Import order matters because of foreign keys and workspace isolation.

Canonical target schema: `database-schema.md` + `migrations/sql/001..005`.

## Phase A — Prepare ID Mapping

1. Read all Mongo collections.
2. Build UUID map for every `_id` in every collection.
3. Build workspace UUID map from distinct Mongo `workspaceId` values.
4. Validate all references before writing.

## Phase B — Core CRM Import

1. Insert `workspaces` from distinct Mongo `workspaceId`.
2. Insert `users`.
3. Update `workspaces.owner_user_id`.
4. Insert `outlets` (create default outlet per workspace if missing).
5. Insert `workspace_settings`.
6. Insert `user_workspace_memberships` and optional `user_outlet_access`.
7. Insert `platforms`.
8. Insert `agents` with embedded JSON config.
9. Insert `agent_outlets` by matching legacy outlet names/codes to `outlets.id`.
10. Insert `contacts`.
11. Insert `chats`.
12. Verify/copy local files and insert `files` metadata.
13. Insert `chat_messages`.
14. Insert legacy `orders`.
15. Insert `complaints`.

## Phase C — Marketplace Bootstrap

After CRM import is stable:

1. Create product categories if needed.
2. Migrate selected legacy agent sales-form products into `products`.
3. Create `product_variants` only when variants are meaningful.
4. Insert `product_outlet_availability`.
5. Do not backfill old carts; carts are new runtime data.
6. Do not backfill payments unless old manual proofs need audit records.

## Phase D — Runtime Tables

Do not seed historical rows for:

```txt
carts
cart_items
checkouts
payments
payment_attempts
payment_events
order_events
webhook_events
ai_actions
```

Exception: `webhook_events` can be seeded with recent processed external message ids if you need duplicate protection during cutover.

## Validation Queries

Run `sql/009_migration_validation_queries.sql` after import.

Expected:

```txt
chat_messages without chat = 0
orders without workspace = 0
complaints without workspace = 0
cross-workspace mismatches = 0
```
```

# File: notes/marketplace-schema-notes.md

```md
# Marketplace Schema Notes

## MVP Scope

This schema targets a **single-merchant Telegram-first marketplace MVP**.

It is intentionally not a full multi-seller marketplace yet.

Canonical source of truth:

```txt
database-schema.md
migrations/sql/001..005
```

## Included

Core admin/commerce tables (26):

```txt
users, workspaces, workspace_settings, outlets
user_workspace_memberships, user_outlet_access
platforms, contacts, chats, chat_messages
product_categories, products, product_variants, product_outlet_availability
carts, cart_items, orders, order_items, order_events
payment_provider_settings, payments, payment_attempts, payment_events
agents, agent_outlets, complaints
```

Operational runtime tables:

```txt
files
webhook_events
ai_actions
checkouts
```

## Excluded for MVP

- Seller accounts.
- Seller wallets.
- Commission calculation.
- Payouts.
- Marketplace dispute system.
- Review/rating.
- Courier integration.
- Advanced promo engine.
- Billing/subscription tables.

## Why `orders` Supports Both Legacy and Marketplace

Existing app already has an AI-generated `Order` model. Removing it would break current behavior.

So the new `orders` table supports both:

```txt
Legacy AI form order:
  source = ai_form
  form_data
  status = new
  payment_status = unpaid

New marketplace order:
  source = telegram
  cart_id
  checkout_id optional
  order_items
  payments
  status = pending_payment -> confirmed
```

## Agent Configuration

Agent settings are stored as embedded JSON in `agents`:

```txt
tools, knowledge, follow_ups, database, complaint_fields,
complaint_notification, sales_forms, payment
```

Outlet mapping uses `agent_outlets.outlet_id` FK, not string arrays.

Legacy agent-embedded products inside `sales_forms` remain for compatibility until migrated to `products`.

## Price Snapshot Rule

Always snapshot price/name into:

```txt
cart_items.product_name_snapshot
cart_items.variant_name_snapshot
cart_items.unit_price
order_items.product_name_snapshot
order_items.variant_name_snapshot
order_items.unit_price
```

## Inventory Rule

MVP can start with `products.stock_tracking = false`.

When stock matters:

- Check `product_outlet_availability.stock_quantity` or `products.stock_quantity` before add-to-cart and checkout.
- Simplest F&B rule: deduct stock when `orders.payment_status = paid`.

## Payment Rule

Order is not paid because AI says so.

Only payment webhook or authorized admin can change:

```txt
payments.status = paid
orders.payment_status = paid
orders.status = confirmed
```

Insert matching timeline rows in `order_events` and `payment_events`.
```

# File: notes/mongo-to-postgres-mapping.md

```md
# Mongo to Postgres Mapping — v2

This document maps the current MongoDB/Mongoose CRM schema to the canonical Supabase/Postgres schema in `database-schema.md` and `migrations/sql/001..005`.

## Naming

| Mongo | Postgres |
|---|---|
| `_id` | `id` |
| `workspaceId` | `workspace_id` |
| `userId` | `owner_user_id` or `user_id` depending on table |
| `platformId` | `platform_id` |
| `agentId` | `agent_id` |
| `contactId` | `contact_id` |
| `chatId` | `chat_id` |
| `takeoverBy` | `taken_over_by_user_id` |
| `isEscalated` | `is_escalated` |
| `lastMessageAt` | `last_message_at` |
| `platformType` | `platform_type` or `contacts.external_id` context |
| `platformAccountId` | `contacts.external_id` |
| `platformMessageId` | `chat_messages.platform_message_id` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |

## SQL Naming Notes

| Legacy doc/SQL name | Canonical name |
|---|---|
| `settings` | `workspace_settings` |
| `messages` | `chat_messages` |
| `takeover_by` | `taken_over_by_user_id` |
| `platform_account_id` | `external_id` on `contacts` |
| `token` on platforms | `token_encrypted` |

## ID Strategy

Do not reuse Mongo ObjectId strings as UUID.

Use a deterministic mapping during import:

```txt
collection + mongo _id -> generated uuid
```

Persist the mapping as `mongo-id-map.json` or staging table `mongo_id_map(collection, mongo_id, postgres_id)`.

## Workspace Creation

Current Mongo has no explicit `workspaces` collection.

Build `workspaces` from distinct `users.workspaceId`.

Owner rule:

1. Prefer user with role `owner` in the workspace.
2. If missing, pick earliest user and flag in migration report.
3. Patch `workspaces.owner_user_id` after users are inserted.

## Core Models

| Mongoose Model | Target Table(s) | Notes |
|---|---|---|
| `User` | `users`, `workspaces`, `user_workspace_memberships` | Custom password auth preserved through `password_hash` |
| `Platform` | `platforms` | Tokens should be rotated/encrypted after migration |
| `Agent` | `agents`, `agent_outlets` | Nested arrays become embedded JSON on `agents` |
| `Contact` | `contacts` | Upsert key: `workspace_id + platform_id + external_id` |
| `Chat` | `chats` | Preserve `taken_over_by_user_id`, `is_escalated`, `status`, `state` |
| `Message` | `chat_messages`, `files` | Preserve ordering via `created_at` |
| `Order` | `orders`, optional `order_items` | Old AI orders become `source = ai_form` |
| `Complaint` | `complaints` | Workspace scoped with outlet/contact/chat links |
| `Knowledge` | `files` + `agents.knowledge` JSON | Store file metadata only |
| `OTP` | `otps` | Expired records may be skipped |
| `PasswordReset` | `password_resets` | Expired records may be skipped |
| `Setting` | `workspace_settings` | One per workspace |

## Agent Nested Data

| Mongo path | Target |
|---|---|
| `agent.knowledge[]` | `agents.knowledge` JSONB |
| `agent.followUps[]` | `agents.follow_ups` JSONB |
| `agent.database[]` | `agents.database` JSONB + optional `files` rows |
| `agent.complaintFields[]` | `agents.complaint_fields` JSONB |
| `agent.outlets[]` | `agent_outlets.outlet_id` rows matched by outlet name/code |
| `agent.salesForms[]` | `agents.sales_forms` JSONB |
| `agent.payment` | `agents.payment` JSONB |
| `agent.complaintNotification` | `agents.complaint_notification` JSONB |
| `agent.tools[]` | `agents.tools` JSONB |

Legacy embedded products inside `salesForms.products` stay inside JSON until migrated to `products`.

## Existing Orders

Current AI-generated orders use flexible form data.

Map them to:

```txt
orders.source = 'ai_form'
orders.form_data = old formData
orders.status = new
orders.payment_status = unpaid
orders.fulfillment_status = unfulfilled
orders.payment_proof_file_id = mapped file id if available
```

Do not create `order_items` for old AI form orders unless product/quantity can be confidently parsed.

## Marketplace Products

If current `agent.salesForms[].products[]` or legacy agent product lists are used as sellable products, migrate them into:

```txt
products
product_variants optional
product_outlet_availability
```

Keep original JSON in `agents.sales_forms` until frontend fully switches to catalog products.

## Message Attachment

Current shape:

```json
{
  "url": "/files/filename.ext",
  "filename": "filename.ext"
}
```

Target:

```txt
files row
chat_messages.attachment_file_id
```

File binary remains on local server storage.

## Payment Data

Old manual payment proof stays on orders:

```txt
orders.payment_proof_file_id
```

New gateway payment data uses:

```txt
payment_provider_settings
payments
payment_attempts
payment_events
webhook_events
order_events
```

## Webhook Idempotency

Create `webhook_events` for incoming Telegram/Meta/payment events.

Recommended external ids:

| Provider | External Event ID |
|---|---|
| Telegram | `update_id` |
| WhatsApp | message id or webhook object id + timestamp fallback |
| Instagram | message id |
| Midtrans | `order_id + transaction_id + transaction_status` fallback |
| Xendit | event id from header/body |
```

# File: notes/payment-gateway-contract.md

```md
# Payment Gateway Contract

This document defines the payment abstraction for Midtrans/Xendit/manual providers.

## MVP Provider

Recommended MVP provider:

```txt
Midtrans sandbox
```

Xendit can be supported later using the same table contract.

## Payment Creation Flow

```txt
OrderService creates order pending_payment
PaymentService.createPaymentLink(order)
  -> create provider transaction
  -> insert payments row
  -> send payment_link_url to Telegram
```

## Tables

```txt
payments
payment_events
webhook_events
orders
```

## Provider Order ID

Use internal order number as the provider order id when possible:

```txt
payments.provider_order_id = orders.order_number
```

If provider requires uniqueness per retry, append attempt number:

```txt
ORD-20260611-ABC123-A1
```

## Status Mapping

| Provider Status | Internal `payment_status` | Internal `order_status` |
|---|---|---|
| pending | pending | pending_payment |
| settlement | settlement / paid | paid |
| capture | capture / paid | paid |
| deny | deny | failed |
| cancel | cancel | cancelled |
| expire | expire | expired |
| failure | failure | failed |
| refund | refund | refunded |

## Webhook Handling

1. Receive provider webhook.
2. Insert `webhook_events` idempotency record.
3. Verify provider signature.
4. Find `payments` by provider + provider_order_id / transaction id.
5. Insert `payment_events`.
6. Update `payments.status`.
7. Update `orders.payment_status` and `orders.status`.
8. Send Telegram notification if status changed.

## Signature Verification

Payment webhook endpoint must reject invalid signature.

Never trust webhook body without verification.

## Manual Payment Compatibility

Legacy manual payment proof remains supported through:

```txt
orders.payment_proof_file_id
orders.payment_proof_url
agents.payment_* columns
```

But marketplace MVP should prefer payment link sandbox for deterministic status updates.

## Reconciliation

Admin should be able to query:

```sql
select o.order_number, o.status, o.payment_status, p.provider, p.status, p.amount
from orders o
left join payments p on p.order_id = o.id
where o.workspace_id = :workspace_id
order by o.created_at desc;
```
```

# File: notes/repository-layer-contract.md

```md
# Repository Layer Contract

Migration should not rewrite all routes at once. Add repository interfaces first, then switch implementation route-by-route.

## Recommended Folder

```txt
server/src/repositories/
  users.repository.js
  workspaces.repository.js
  platforms.repository.js
  agents.repository.js
  contacts.repository.js
  chats.repository.js
  chatMessages.repository.js      # chat_messages
  files.repository.js
  products.repository.js
  carts.repository.js
  orders.repository.js
  payments.repository.js
  complaints.repository.js
  settings.repository.js          # workspace_settings
  webhookEvents.repository.js
```

## Rule

Every repository method must receive `workspace_id` unless it is truly global.

Bad:

```js
getOrderById(orderId)
```

Good:

```js
getOrderById({ workspaceId, orderId })
```

## Core Contracts

### Contact Upsert

```js
upsertContactByPlatformIdentity({
  workspaceId,
  platformType,
  platformAccountId,
  name,
  handle,
  metadata
})
```

### Chat Upsert

```js
upsertChat({
  workspaceId,
  platformId,
  contactId,
  agentId,
  platformType
})
```

### Message Insert

```js
createMessage({
  workspaceId,
  chatId,
  sender,
  kind,
  text,
  platformMessageId,
  attachmentFileId,
  rawPayload
})
```

### Webhook Idempotency

```js
createWebhookEventIfNew({
  provider,
  externalEventId,
  workspaceId,
  platformId,
  eventType,
  payload
})
```

Returns:

```js
{ created: true, event }
{ created: false, duplicate: true, event }
```

### Product List

```js
listActiveProducts({ workspaceId, categoryId, search, limit, offset })
```

### Active Cart

```js
getOrCreateActiveCart({ workspaceId, contactId, chatId, platformId, platformType })
```

### Checkout

```js
createCheckoutFromCart({ workspaceId, cartId, customerData })
```

### Order Creation

```js
createOrderFromCheckout({ workspaceId, checkoutId })
```

This must snapshot cart items into `order_items`.

### Payment Creation

```js
createPaymentForOrder({ workspaceId, orderId, provider })
```

## Migration Implementation Strategy

1. Create repositories backed by Mongoose.
2. Route code uses repositories only.
3. Create Supabase implementation with same contract.
4. Switch one route group at a time through env flag.
5. Remove direct Mongoose access after full cutover.
```

# File: notes/telegram-commerce-flow.md

```md
# Telegram Commerce Flow

This document defines the deterministic Telegram-first marketplace flow.

## Principle

Telegram is the storefront/chat interface. Postgres is the source of truth.

AI can recommend products and answer questions, but these backend services must own state changes:

```txt
ProductService
CartService
CheckoutService
OrderService
PaymentService
TelegramNotificationService
```

## Recommended Commands / Buttons

| Command/Button | Backend Action |
|---|---|
| `/start` | Show main menu |
| `Browse Products` | List active products/categories |
| `Product Detail` | Show product info and add-to-cart button |
| `Add to Cart` | Create/update cart item |
| `View Cart` | Show cart summary |
| `Checkout` | Create checkout draft / ask missing details |
| `Confirm Checkout` | Create pending order + payment link |
| `Order Status` | Show latest order/payment status |
| `Talk to Admin` | Set escalation / human takeover path |

## Flow

```txt
/start
  -> show menu
Browse Products
  -> products where status = active
Product Detail
  -> show price, stock, description, image
Add to Cart
  -> upsert active cart by workspace + contact + chat
View Cart
  -> summarize cart_items
Checkout
  -> collect name/phone/address if needed
Confirm Checkout
  -> create checkouts row
  -> create orders row
  -> copy cart_items into order_items snapshot
  -> create payment row/link
  -> send payment link
Payment Webhook
  -> verify signature
  -> update payments
  -> update orders.payment_status/status
  -> send Telegram notification
```

## Callback Data Pattern

Keep callback data short because Telegram has callback data limits.

Recommended pattern:

```txt
m:home
m:products
m:p:<shortProductId>
m:add:<shortProductId>:<shortVariantId>
m:cart
m:checkout
m:confirm:<shortCheckoutId>
m:order:<shortOrderId>
```

Map short ids to UUID server-side if needed.

## Idempotency

For every callback query:

1. Store/update `webhook_events` with Telegram `update_id`.
2. If duplicate, return quickly.
3. Avoid creating duplicate cart/order/payment.

## Cart Rules

- One active cart per `workspace_id + contact_id + chat_id` is recommended.
- Cart item uniqueness: `cart_id + product_id + variant_id`.
- Price snapshot must be stored when item is added.
- On checkout, copy cart item snapshots to `order_items`.

## AI Role

AI may:

- Help user choose product.
- Explain product details.
- Suggest categories.
- Ask clarifying questions.

AI may not directly:

- Mark orders as paid.
- Change payment status.
- Create payment provider transactions.
- Override inventory.
- Promise unavailable stock.

Use `ai_actions` for audit when AI proposes a commerce action.
```

# File: sql/001_extensions_and_enums.sql

```sql
-- 001_extensions_and_enums.sql
-- Base extensions, enum types, and shared trigger helpers for the canonical
-- Chatbot CRM + Telegram-first Marketplace MVP Supabase/Postgres schema.

create extension if not exists "pgcrypto";
create extension if not exists "citext";
create extension if not exists "pg_trgm";

-- Identity
do $$ begin
  create type user_role as enum ('owner', 'super', 'agent');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type user_status as enum ('online', 'offline');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type plan_type as enum ('free', 'pro', 'pro-banget');
exception when duplicate_object then null;
end $$;

-- Integrations
do $$ begin
  create type platform_type as enum ('whatsapp', 'telegram', 'instagram', 'facebook', 'custom');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type platform_status as enum ('connected', 'disconnected', 'error', 'disabled');
exception when duplicate_object then null;
end $$;

-- CRM / messaging
do $$ begin
  create type chat_status as enum ('open', 'pending', 'resolved', 'archived');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type chat_message_sender as enum ('customer', 'ai', 'admin', 'system');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type chat_message_direction as enum ('inbound', 'outbound');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type chat_message_type as enum ('text', 'image', 'file', 'audio', 'system');
exception when duplicate_object then null;
end $$;

-- Agents
do $$ begin
  create type agent_status as enum ('active', 'inactive');
exception when duplicate_object then null;
end $$;

-- Operations
do $$ begin
  create type complaint_status as enum ('open', 'in_progress', 'resolved', 'closed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type complaint_priority as enum ('low', 'medium', 'high', 'urgent');
exception when duplicate_object then null;
end $$;

-- Marketplace catalog
do $$ begin
  create type product_category_status as enum ('active', 'inactive');
exception when duplicate_object then null;
end $$;

-- Cart / checkout / order
do $$ begin
  create type cart_status as enum ('active', 'ordered', 'abandoned', 'cleared');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type checkout_status as enum ('draft', 'awaiting_confirmation', 'confirmed', 'cancelled', 'expired');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type order_status as enum (
    'new',
    'pending_payment',
    'confirmed',
    'preparing',
    'ready',
    'completed',
    'cancelled',
    'expired',
    'failed'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type order_payment_status as enum ('unpaid', 'pending', 'paid', 'failed', 'expired', 'refunded');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type fulfillment_status as enum ('unfulfilled', 'preparing', 'ready', 'fulfilled', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type order_source as enum ('telegram', 'whatsapp', 'instagram', 'facebook', 'crm_admin', 'ai_form', 'custom');
exception when duplicate_object then null;
end $$;

-- Payments
do $$ begin
  create type payment_provider as enum ('midtrans', 'xendit', 'manual', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type payment_provider_environment as enum ('sandbox', 'production');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type payment_record_status as enum ('pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type reconciliation_status as enum ('unmatched', 'matched', 'disputed', 'ignored');
exception when duplicate_object then null;
end $$;

-- Files / storage
do $$ begin
  create type file_source as enum (
    'platform_inbound',
    'crm_upload',
    'agent_database',
    'payment_proof',
    'product_image',
    'category_image',
    'public_asset',
    'ai_generated',
    'external_download',
    'migration_backfill'
  );
exception when duplicate_object then null;
end $$;

-- Webhooks / AI actions
do $$ begin
  create type webhook_event_status as enum ('received', 'processing', 'processed', 'ignored_duplicate', 'failed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type ai_action_status as enum ('proposed', 'confirmed', 'executed', 'cancelled', 'failed');
exception when duplicate_object then null;
end $$;

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function generate_order_number(prefix text default 'ORD')
returns text
language sql
as $$
  select upper(prefix) || '-' || to_char(now(), 'YYYYMMDD') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
$$;
```

# File: sql/002_core_identity.sql

```sql
-- 002_core_identity.sql
-- Core identity, workspace settings, outlets, and access tables.

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Default Workspace',
  owner_user_id uuid null,
  status text not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_workspaces_updated_at
before update on workspaces
for each row execute function set_updated_at();

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid null unique,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  email citext not null unique,
  password_hash text null,
  role user_role not null default 'owner',
  verified boolean not null default false,
  status user_status not null default 'offline',
  plan plan_type not null default 'pro',
  plan_expiry timestamptz not null default (now() + interval '30 days'),
  last_login_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_users_updated_at
before update on users
for each row execute function set_updated_at();

do $$ begin
  alter table workspaces
    add constraint workspaces_owner_user_fk
    foreign key (owner_user_id) references users(id)
    on delete set null;
exception when duplicate_object then null;
end $$;

create table if not exists otps (
  id uuid primary key default gen_random_uuid(),
  email citext not null,
  code text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists password_resets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token text not null unique,
  expires_at timestamptz not null,
  consumed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_password_resets_updated_at
before update on password_resets
for each row execute function set_updated_at();

create table if not exists outlets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  code text null,
  city text null,
  region text null,
  address text null,
  postal_code text null,
  phone text null,
  manager_user_id uuid null references users(id) on delete set null,
  status text not null default 'active',
  timezone text not null default 'Asia/Makassar',
  opening_hours jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint outlets_workspace_code_unique unique (workspace_id, code)
);

create trigger set_outlets_updated_at
before update on outlets
for each row execute function set_updated_at();

create table if not exists workspace_settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references workspaces(id) on delete cascade,
  business_display_name text not null default '',
  timezone text not null default 'Asia/Makassar',
  currency text not null default 'IDR',
  locale text not null default 'id-ID',
  support_contact_email citext null,
  default_outlet_id uuid null references outlets(id) on delete set null,
  allow_all_outlets_view boolean not null default false,
  primary_ai text not null default 'openai' check (primary_ai in ('openai', 'gemini', 'none')),
  secondary_ai text not null default 'gemini' check (secondary_ai in ('openai', 'gemini', 'none')),
  default_language text not null default 'id',
  ai_commerce_enabled boolean not null default false,
  require_checkout_confirmation boolean not null default true,
  human_handoff_enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_workspace_settings_updated_at
before update on workspace_settings
for each row execute function set_updated_at();

create table if not exists user_workspace_memberships (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'member',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_workspace_memberships_unique unique (workspace_id, user_id)
);

create trigger set_user_workspace_memberships_updated_at
before update on user_workspace_memberships
for each row execute function set_updated_at();

create table if not exists user_outlet_access (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  role text not null default 'outlet_viewer',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_outlet_access_unique unique (workspace_id, outlet_id, user_id)
);

create trigger set_user_outlet_access_updated_at
before update on user_outlet_access
for each row execute function set_updated_at();
```

# File: sql/003_platforms_agents.sql

```sql
-- 003_platforms_agents.sql
-- Connected platforms, AI agents (embedded JSON config), and agent-outlet mapping.

create table if not exists platforms (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  type platform_type not null,
  label text not null,
  status platform_status not null default 'connected',
  account_id text null,
  bot_id text null,
  phone_number_id text null,
  page_id text null,
  token_encrypted text null,
  credentials_encrypted text null,
  webhook_configured boolean not null default false,
  webhook_secret_encrypted text null,
  agent_id uuid null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_platforms_updated_at
before update on platforms
for each row execute function set_updated_at();

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  platform_id uuid null references platforms(id) on delete set null,
  name text not null,
  behavior text not null default '',
  prompt text not null default '',
  welcome_message text null,
  sticker_url text null,
  tools jsonb not null default '[]'::jsonb,
  knowledge jsonb not null default '[]'::jsonb,
  follow_ups jsonb not null default '[]'::jsonb,
  database jsonb not null default '[]'::jsonb,
  complaint_fields jsonb not null default '[]'::jsonb,
  complaint_notification jsonb not null default '{}'::jsonb,
  sales_forms jsonb not null default '[]'::jsonb,
  payment jsonb not null default '{}'::jsonb,
  status agent_status not null default 'active',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_agents_updated_at
before update on agents
for each row execute function set_updated_at();

do $$ begin
  alter table platforms
    add constraint platforms_agent_fk
    foreign key (agent_id) references agents(id)
    on delete set null;
exception when duplicate_object then null;
end $$;

create table if not exists agent_outlets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint agent_outlets_unique unique (agent_id, outlet_id)
);

create index if not exists agent_outlets_workspace_idx on agent_outlets (workspace_id);
create index if not exists agent_outlets_outlet_idx on agent_outlets (outlet_id);
```

# File: sql/004_crm_chats_messages.sql

```sql
-- 004_crm_chats_messages.sql
-- CRM contacts, chats, chat_messages, webhook idempotency, and AI action audit.

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  platform_id uuid null references platforms(id) on delete set null,
  external_id text not null,
  name text not null default '',
  phone text null,
  email citext null,
  handle text null,
  tags text[] not null default '{}',
  last_outlet_id uuid null references outlets(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contacts_platform_identity_unique unique (workspace_id, platform_id, external_id)
);

create trigger set_contacts_updated_at
before update on contacts
for each row execute function set_updated_at();

create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  platform_id uuid not null references platforms(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  current_outlet_id uuid null references outlets(id) on delete set null,
  status chat_status not null default 'open',
  ai_enabled boolean not null default true,
  is_blocked boolean not null default false,
  is_escalated boolean not null default false,
  taken_over_by_user_id uuid null references users(id) on delete set null,
  assigned_at timestamptz null,
  resolved_at timestamptz null,
  last_message_at timestamptz null,
  state jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chats_platform_contact_unique unique (workspace_id, platform_id, contact_id)
);

create trigger set_chats_updated_at
before update on chats
for each row execute function set_updated_at();

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  chat_id uuid not null references chats(id) on delete cascade,
  platform_id uuid not null references platforms(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  sender_type chat_message_sender not null,
  user_id uuid null references users(id) on delete set null,
  direction chat_message_direction not null,
  message_type chat_message_type not null default 'text',
  content text null,
  attachment_file_id uuid null,
  platform_message_id text null,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists webhook_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid null references workspaces(id) on delete cascade,
  platform_id uuid null references platforms(id) on delete set null,
  provider text not null,
  event_type text not null default '',
  external_event_id text not null,
  status webhook_event_status not null default 'received',
  payload jsonb not null default '{}'::jsonb,
  error text null,
  received_at timestamptz not null default now(),
  processed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint webhook_events_provider_external_unique unique (provider, external_event_id)
);

create trigger set_webhook_events_updated_at
before update on webhook_events
for each row execute function set_updated_at();

create table if not exists ai_actions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  chat_id uuid null references chats(id) on delete cascade,
  chat_message_id uuid null references chat_messages(id) on delete set null,
  agent_id uuid null references agents(id) on delete set null,
  action_type text not null,
  status ai_action_status not null default 'proposed',
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error text null,
  confirmed_at timestamptz null,
  executed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_ai_actions_updated_at
before update on ai_actions
for each row execute function set_updated_at();
```

# File: sql/005_orders_complaints_files.sql

```sql
-- 005_orders_complaints_files.sql
-- Files, marketplace catalog, carts, checkouts, orders, payments, and complaints.

create table if not exists files (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  storage_provider text not null default 'local',
  disk text not null default 'uploads',
  relative_path text not null,
  public_path text null,
  original_name text null,
  stored_name text not null,
  mime_type text null,
  size_bytes bigint null check (size_bytes is null or size_bytes >= 0),
  source file_source not null default 'crm_upload',
  created_by uuid null references users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint files_disk_relative_path_unique unique (disk, relative_path)
);

do $$ begin
  alter table chat_messages
    add constraint chat_messages_attachment_file_fk
    foreign key (attachment_file_id) references files(id)
    on delete set null;
exception when duplicate_object then null;
end $$;

create table if not exists product_categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  slug text not null,
  status product_category_status not null default 'active',
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_categories_workspace_slug_unique unique (workspace_id, slug)
);

create trigger set_product_categories_updated_at
before update on product_categories
for each row execute function set_updated_at();

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  category_id uuid null references product_categories(id) on delete set null,
  name text not null,
  slug text not null,
  sku text null,
  short_description text null,
  description text null,
  base_price numeric(14,2) not null default 0 check (base_price >= 0),
  cost_price numeric(14,2) null check (cost_price is null or cost_price >= 0),
  currency text not null default 'IDR',
  thumbnail_file_id uuid null references files(id) on delete set null,
  thumbnail_url text null,
  tags text[] not null default '{}',
  tax_rate numeric(8,4) null,
  tax_label text null,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  stock_tracking boolean not null default false,
  stock_quantity integer null check (stock_quantity is null or stock_quantity >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_workspace_slug_unique unique (workspace_id, slug),
  constraint products_workspace_sku_unique unique (workspace_id, sku)
);

create trigger set_products_updated_at
before update on products
for each row execute function set_updated_at();

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  sku text null,
  price_delta numeric(14,2) not null default 0,
  final_price numeric(14,2) null check (final_price is null or final_price >= 0),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_workspace_sku_unique unique (workspace_id, sku)
);

create trigger set_product_variants_updated_at
before update on product_variants
for each row execute function set_updated_at();

create table if not exists product_outlet_availability (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid null references product_variants(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  is_available boolean not null default true,
  price_override numeric(14,2) null check (price_override is null or price_override >= 0),
  stock_quantity integer null check (stock_quantity is null or stock_quantity >= 0),
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_outlet_availability_unique unique (workspace_id, product_id, variant_id, outlet_id)
);

create trigger set_product_outlet_availability_updated_at
before update on product_outlet_availability
for each row execute function set_updated_at();

create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  platform_id uuid not null references platforms(id) on delete cascade,
  status cart_status not null default 'active',
  subtotal_amount numeric(14,2) not null default 0 check (subtotal_amount >= 0),
  discount_amount numeric(14,2) not null default 0 check (discount_amount >= 0),
  delivery_fee numeric(14,2) not null default 0 check (delivery_fee >= 0),
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  currency text not null default 'IDR',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_carts_updated_at
before update on carts
for each row execute function set_updated_at();

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  variant_id uuid null references product_variants(id) on delete restrict,
  product_name_snapshot text not null,
  variant_name_snapshot text null,
  unit_price numeric(14,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  subtotal_amount numeric(14,2) not null check (subtotal_amount >= 0),
  notes text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_items_unique_product_variant unique (cart_id, product_id, variant_id)
);

create trigger set_cart_items_updated_at
before update on cart_items
for each row execute function set_updated_at();

create table if not exists checkouts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  cart_id uuid not null references carts(id) on delete cascade,
  chat_id uuid null references chats(id) on delete set null,
  contact_id uuid not null references contacts(id) on delete cascade,
  status checkout_status not null default 'draft',
  customer_name text null,
  customer_phone text null,
  customer_address text null,
  delivery_method text null,
  notes text null,
  confirmed_at timestamptz null,
  expires_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_checkouts_updated_at
before update on checkouts
for each row execute function set_updated_at();

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  platform_id uuid not null references platforms(id) on delete cascade,
  chat_id uuid null references chats(id) on delete set null,
  cart_id uuid null references carts(id) on delete set null,
  checkout_id uuid null references checkouts(id) on delete set null,
  order_number text not null default generate_order_number('ORD'),
  source order_source not null default 'telegram',
  status order_status not null default 'pending_payment',
  payment_status order_payment_status not null default 'unpaid',
  fulfillment_status fulfillment_status not null default 'unfulfilled',
  customer_name_snapshot text not null default '',
  customer_phone_snapshot text null,
  channel_snapshot text null,
  subtotal_amount numeric(14,2) not null default 0 check (subtotal_amount >= 0),
  discount_amount numeric(14,2) not null default 0 check (discount_amount >= 0),
  delivery_fee numeric(14,2) not null default 0 check (delivery_fee >= 0),
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  currency text not null default 'IDR',
  payment_method text null,
  notes text null,
  form_data jsonb not null default '{}'::jsonb,
  payment_proof_file_id uuid null references files(id) on delete set null,
  paid_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_workspace_order_number_unique unique (workspace_id, order_number)
);

create trigger set_orders_updated_at
before update on orders
for each row execute function set_updated_at();

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid null references products(id) on delete set null,
  variant_id uuid null references product_variants(id) on delete set null,
  product_name_snapshot text not null,
  variant_name_snapshot text null,
  unit_price numeric(14,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  subtotal_amount numeric(14,2) not null check (subtotal_amount >= 0),
  notes text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_order_items_updated_at
before update on order_items
for each row execute function set_updated_at();

create table if not exists order_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  event_type text not null,
  label text not null,
  actor_type text not null default 'system',
  actor_user_id uuid null references users(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists payment_provider_settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  provider payment_provider not null,
  environment payment_provider_environment not null default 'sandbox',
  merchant_id text null,
  public_key text null,
  server_key_encrypted text null,
  webhook_secret_encrypted text null,
  enabled_methods jsonb not null default '[]'::jsonb,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payment_provider_settings_unique unique (workspace_id, provider)
);

create trigger set_payment_provider_settings_updated_at
before update on payment_provider_settings
for each row execute function set_updated_at();

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  provider payment_provider not null default 'midtrans',
  method text null,
  status payment_record_status not null default 'pending',
  reconciliation_status reconciliation_status not null default 'unmatched',
  amount numeric(14,2) not null check (amount >= 0),
  provider_fee numeric(14,2) null check (provider_fee is null or provider_fee >= 0),
  net_amount numeric(14,2) null check (net_amount is null or net_amount >= 0),
  currency text not null default 'IDR',
  payment_link text null,
  provider_ref text null,
  merchant_reference text null,
  expires_at timestamptz null,
  paid_at timestamptz null,
  matched_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_payments_updated_at
before update on payments
for each row execute function set_updated_at();

create table if not exists payment_attempts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  payment_id uuid not null references payments(id) on delete cascade,
  attempt_number integer not null check (attempt_number > 0),
  status payment_record_status not null default 'pending',
  method text null,
  provider_ref text null,
  payment_link text null,
  created_at timestamptz not null default now(),
  expired_at timestamptz null,
  paid_at timestamptz null
);

create table if not exists payment_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  payment_id uuid not null references payments(id) on delete cascade,
  event_type text not null,
  label text not null default '',
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists complaints (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid null references outlets(id) on delete set null,
  contact_id uuid null references contacts(id) on delete set null,
  chat_id uuid null references chats(id) on delete set null,
  platform_id uuid null references platforms(id) on delete set null,
  channel platform_type null,
  subject text not null,
  description text null,
  status complaint_status not null default 'open',
  priority complaint_priority not null default 'medium',
  assigned_to_user_id uuid null references users(id) on delete set null,
  resolution_notes text null,
  form_data jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_complaints_updated_at
before update on complaints
for each row execute function set_updated_at();
```

# File: sql/006_indexes.sql

```sql
-- 006_indexes.sql
-- Query indexes aligned to database-schema.md and query-contracts.md.

-- Identity / access
create unique index if not exists users_email_unique on users (email);
create index if not exists users_workspace_id_idx on users (workspace_id);
create index if not exists users_auth_user_id_idx on users (auth_user_id);
create index if not exists idx_outlets_workspace_id on outlets (workspace_id);
create index if not exists idx_outlets_workspace_status on outlets (workspace_id, status);
create index if not exists idx_user_workspace_memberships_user on user_workspace_memberships (user_id);
create index if not exists idx_user_workspace_memberships_workspace on user_workspace_memberships (workspace_id);
create index if not exists idx_user_outlet_access_user_workspace on user_outlet_access (user_id, workspace_id);
create index if not exists idx_user_outlet_access_outlet on user_outlet_access (outlet_id);
create unique index if not exists uq_workspace_settings_workspace on workspace_settings (workspace_id);

-- Platforms / agents
create index if not exists idx_platforms_workspace_type_status on platforms (workspace_id, type, status);
create index if not exists idx_platforms_account_lookup on platforms (type, account_id) where account_id is not null;
create index if not exists idx_agents_workspace_id on agents (workspace_id);
create index if not exists idx_agents_platform_id on agents (platform_id);
create index if not exists idx_agent_outlets_agent on agent_outlets (agent_id);
create index if not exists idx_agent_outlets_outlet on agent_outlets (outlet_id);

-- CRM
create index if not exists idx_contacts_workspace_platform_external on contacts (workspace_id, platform_id, external_id);
create index if not exists idx_contacts_workspace_last_outlet on contacts (workspace_id, last_outlet_id);
create index if not exists idx_contacts_tags_gin on contacts using gin (tags);
create index if not exists idx_chats_workspace_platform_status on chats (workspace_id, platform_id, status);
create index if not exists idx_chats_workspace_outlet_status on chats (workspace_id, current_outlet_id, status);
create index if not exists idx_chats_last_message_at on chats (workspace_id, last_message_at desc nulls last);
create index if not exists idx_chats_takeover_by on chats (workspace_id, taken_over_by_user_id);
create index if not exists idx_chats_escalated on chats (workspace_id, is_escalated);
create index if not exists idx_chat_messages_chat_created on chat_messages (chat_id, created_at desc);
create index if not exists idx_chat_messages_platform_message_id on chat_messages (platform_message_id) where platform_message_id is not null;

-- Webhooks / AI audit
create index if not exists idx_webhook_events_workspace on webhook_events (workspace_id, received_at desc);
create index if not exists idx_webhook_events_status on webhook_events (status, received_at desc);
create index if not exists idx_ai_actions_workspace_chat on ai_actions (workspace_id, chat_id, created_at desc);

-- Files / catalog
create index if not exists idx_files_workspace_source on files (workspace_id, source);
create index if not exists idx_product_categories_workspace_status on product_categories (workspace_id, status, sort_order);
create index if not exists idx_products_workspace_status on products (workspace_id, is_active);
create index if not exists idx_products_workspace_category on products (workspace_id, category_id);
create index if not exists idx_product_variants_product on product_variants (product_id, is_active, sort_order);
create index if not exists idx_product_outlet_availability_workspace_outlet on product_outlet_availability (workspace_id, outlet_id);
create index if not exists idx_product_outlet_availability_product on product_outlet_availability (product_id);
create index if not exists idx_product_outlet_availability_product_outlet on product_outlet_availability (product_id, outlet_id);

-- Cart / checkout
create index if not exists idx_carts_workspace_contact_platform_outlet_status on carts (workspace_id, contact_id, platform_id, outlet_id, status);
create index if not exists idx_cart_items_cart on cart_items (cart_id);
create index if not exists idx_checkouts_cart on checkouts (cart_id);
create index if not exists idx_checkouts_status on checkouts (workspace_id, status, created_at desc);

-- Orders / payments / complaints
create index if not exists idx_orders_workspace_outlet_created on orders (workspace_id, outlet_id, created_at desc);
create index if not exists idx_orders_workspace_status_created on orders (workspace_id, status, created_at desc);
create index if not exists idx_orders_workspace_payment_status_created on orders (workspace_id, payment_status, created_at desc);
create index if not exists idx_orders_contact_created on orders (contact_id, created_at desc);
create index if not exists idx_order_items_order on order_items (order_id);
create index if not exists idx_order_items_product on order_items (product_id);
create index if not exists idx_order_events_order_created on order_events (order_id, created_at desc);
create unique index if not exists uq_payment_provider_settings_workspace_provider on payment_provider_settings (workspace_id, provider);
create index if not exists idx_payments_workspace_outlet_created on payments (workspace_id, outlet_id, created_at desc);
create index if not exists idx_payments_workspace_status_created on payments (workspace_id, status, created_at desc);
create index if not exists idx_payments_order on payments (order_id);
create index if not exists idx_payments_provider_ref on payments (provider, provider_ref);
create index if not exists idx_payment_attempts_payment_created on payment_attempts (payment_id, created_at desc);
create index if not exists idx_payment_events_payment_created on payment_events (payment_id, created_at desc);
create index if not exists idx_complaints_workspace_status_created on complaints (workspace_id, status, created_at desc);
create index if not exists idx_complaints_outlet on complaints (workspace_id, outlet_id, status);

-- Recommended partial unique index for one active cart per contact/outlet/platform:
-- create unique index uq_carts_active_contact_outlet_platform
-- on carts (workspace_id, outlet_id, contact_id, platform_id)
-- where status = 'active';
```

# File: sql/007_rls_policies.sql

```sql
-- 007_rls_policies.sql
-- Draft Supabase Row Level Security policies for CRM + Telegram marketplace MVP.
--
-- Important:
-- - Public webhooks should use backend service role and must validate provider tokens/signatures.
-- - Service role bypasses RLS, so backend routes still must validate workspace ownership.
-- - These policies are intended for future Supabase Auth usage.

create or replace function public.current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.users
  where auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.current_workspace_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select workspace_id
  from public.users
  where auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.current_app_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.users
  where auth_user_id = auth.uid()
  limit 1
$$;

alter table workspaces enable row level security;
alter table users enable row level security;
alter table workspace_settings enable row level security;
alter table outlets enable row level security;
alter table user_workspace_memberships enable row level security;
alter table user_outlet_access enable row level security;
alter table platforms enable row level security;
alter table agents enable row level security;
alter table agent_outlets enable row level security;
alter table contacts enable row level security;
alter table chats enable row level security;
alter table chat_messages enable row level security;
alter table webhook_events enable row level security;
alter table ai_actions enable row level security;
alter table files enable row level security;
alter table product_categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_outlet_availability enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table checkouts enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table order_events enable row level security;
alter table payment_provider_settings enable row level security;
alter table payments enable row level security;
alter table payment_attempts enable row level security;
alter table payment_events enable row level security;
alter table complaints enable row level security;


-- Workspaces and users
create policy "workspace members can read workspace"
on workspaces for select
using (id = public.current_workspace_id());

create policy "workspace owners can update workspace"
on workspaces for update
using (id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'))
with check (id = public.current_workspace_id());

create policy "workspace users read"
on users for select
using (workspace_id = public.current_workspace_id());

create policy "workspace owners manage users"
on users for all
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'))
with check (workspace_id = public.current_workspace_id());

-- Chat policy mirrors current owner/super vs human agent behavior.
create policy "chats workspace role read"
on chats for select
using (
  workspace_id = public.current_workspace_id()
  and (
    public.current_app_role() in ('owner', 'super')
    or taken_over_by_user_id = public.current_app_user_id()
  )
);

create policy "chats workspace insert"
on chats for insert
with check (workspace_id = public.current_workspace_id());

create policy "chats workspace update"
on chats for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "chats workspace delete owner super"
on chats for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

-- Product catalog can be readable by workspace users; customer-facing reads should go through backend.

create policy "workspace_settings workspace select"
on workspace_settings for select
using (workspace_id = public.current_workspace_id());

create policy "workspace_settings workspace insert"
on workspace_settings for insert
with check (workspace_id = public.current_workspace_id());

create policy "workspace_settings workspace update"
on workspace_settings for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "workspace_settings workspace delete"
on workspace_settings for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "outlets workspace select"
on outlets for select
using (workspace_id = public.current_workspace_id());

create policy "outlets workspace insert"
on outlets for insert
with check (workspace_id = public.current_workspace_id());

create policy "outlets workspace update"
on outlets for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "outlets workspace delete"
on outlets for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "user_workspace_memberships workspace select"
on user_workspace_memberships for select
using (workspace_id = public.current_workspace_id());

create policy "user_workspace_memberships workspace insert"
on user_workspace_memberships for insert
with check (workspace_id = public.current_workspace_id());

create policy "user_workspace_memberships workspace update"
on user_workspace_memberships for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "user_workspace_memberships workspace delete"
on user_workspace_memberships for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "user_outlet_access workspace select"
on user_outlet_access for select
using (workspace_id = public.current_workspace_id());

create policy "user_outlet_access workspace insert"
on user_outlet_access for insert
with check (workspace_id = public.current_workspace_id());

create policy "user_outlet_access workspace update"
on user_outlet_access for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "user_outlet_access workspace delete"
on user_outlet_access for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "platforms workspace select"
on platforms for select
using (workspace_id = public.current_workspace_id());

create policy "platforms workspace insert"
on platforms for insert
with check (workspace_id = public.current_workspace_id());

create policy "platforms workspace update"
on platforms for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "platforms workspace delete"
on platforms for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "agents workspace select"
on agents for select
using (workspace_id = public.current_workspace_id());

create policy "agents workspace insert"
on agents for insert
with check (workspace_id = public.current_workspace_id());

create policy "agents workspace update"
on agents for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "agents workspace delete"
on agents for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "agent_outlets workspace select"
on agent_outlets for select
using (workspace_id = public.current_workspace_id());

create policy "agent_outlets workspace insert"
on agent_outlets for insert
with check (workspace_id = public.current_workspace_id());

create policy "agent_outlets workspace update"
on agent_outlets for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "agent_outlets workspace delete"
on agent_outlets for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "contacts workspace select"
on contacts for select
using (workspace_id = public.current_workspace_id());

create policy "contacts workspace insert"
on contacts for insert
with check (workspace_id = public.current_workspace_id());

create policy "contacts workspace update"
on contacts for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "contacts workspace delete"
on contacts for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "chat_messages workspace select"
on chat_messages for select
using (workspace_id = public.current_workspace_id());

create policy "chat_messages workspace insert"
on chat_messages for insert
with check (workspace_id = public.current_workspace_id());

create policy "chat_messages workspace update"
on chat_messages for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "chat_messages workspace delete"
on chat_messages for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "webhook_events workspace select"
on webhook_events for select
using (workspace_id = public.current_workspace_id());

create policy "webhook_events workspace insert"
on webhook_events for insert
with check (workspace_id = public.current_workspace_id());

create policy "webhook_events workspace update"
on webhook_events for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "webhook_events workspace delete"
on webhook_events for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "ai_actions workspace select"
on ai_actions for select
using (workspace_id = public.current_workspace_id());

create policy "ai_actions workspace insert"
on ai_actions for insert
with check (workspace_id = public.current_workspace_id());

create policy "ai_actions workspace update"
on ai_actions for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "ai_actions workspace delete"
on ai_actions for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "files workspace select"
on files for select
using (workspace_id = public.current_workspace_id());

create policy "files workspace insert"
on files for insert
with check (workspace_id = public.current_workspace_id());

create policy "files workspace update"
on files for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "files workspace delete"
on files for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "product_categories workspace select"
on product_categories for select
using (workspace_id = public.current_workspace_id());

create policy "product_categories workspace insert"
on product_categories for insert
with check (workspace_id = public.current_workspace_id());

create policy "product_categories workspace update"
on product_categories for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "product_categories workspace delete"
on product_categories for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "products workspace select"
on products for select
using (workspace_id = public.current_workspace_id());

create policy "products workspace insert"
on products for insert
with check (workspace_id = public.current_workspace_id());

create policy "products workspace update"
on products for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "products workspace delete"
on products for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "product_variants workspace select"
on product_variants for select
using (workspace_id = public.current_workspace_id());

create policy "product_variants workspace insert"
on product_variants for insert
with check (workspace_id = public.current_workspace_id());

create policy "product_variants workspace update"
on product_variants for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "product_variants workspace delete"
on product_variants for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "product_outlet_availability workspace select"
on product_outlet_availability for select
using (workspace_id = public.current_workspace_id());

create policy "product_outlet_availability workspace insert"
on product_outlet_availability for insert
with check (workspace_id = public.current_workspace_id());

create policy "product_outlet_availability workspace update"
on product_outlet_availability for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "product_outlet_availability workspace delete"
on product_outlet_availability for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "carts workspace select"
on carts for select
using (workspace_id = public.current_workspace_id());

create policy "carts workspace insert"
on carts for insert
with check (workspace_id = public.current_workspace_id());

create policy "carts workspace update"
on carts for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "carts workspace delete"
on carts for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "cart_items workspace select"
on cart_items for select
using (workspace_id = public.current_workspace_id());

create policy "cart_items workspace insert"
on cart_items for insert
with check (workspace_id = public.current_workspace_id());

create policy "cart_items workspace update"
on cart_items for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "cart_items workspace delete"
on cart_items for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "checkouts workspace select"
on checkouts for select
using (workspace_id = public.current_workspace_id());

create policy "checkouts workspace insert"
on checkouts for insert
with check (workspace_id = public.current_workspace_id());

create policy "checkouts workspace update"
on checkouts for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "checkouts workspace delete"
on checkouts for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "orders workspace select"
on orders for select
using (workspace_id = public.current_workspace_id());

create policy "orders workspace insert"
on orders for insert
with check (workspace_id = public.current_workspace_id());

create policy "orders workspace update"
on orders for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "orders workspace delete"
on orders for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "order_items workspace select"
on order_items for select
using (workspace_id = public.current_workspace_id());

create policy "order_items workspace insert"
on order_items for insert
with check (workspace_id = public.current_workspace_id());

create policy "order_items workspace update"
on order_items for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "order_items workspace delete"
on order_items for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "order_events workspace select"
on order_events for select
using (workspace_id = public.current_workspace_id());

create policy "order_events workspace insert"
on order_events for insert
with check (workspace_id = public.current_workspace_id());

create policy "order_events workspace update"
on order_events for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "order_events workspace delete"
on order_events for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "payment_provider_settings workspace select"
on payment_provider_settings for select
using (workspace_id = public.current_workspace_id());

create policy "payment_provider_settings workspace insert"
on payment_provider_settings for insert
with check (workspace_id = public.current_workspace_id());

create policy "payment_provider_settings workspace update"
on payment_provider_settings for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "payment_provider_settings workspace delete"
on payment_provider_settings for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "payments workspace select"
on payments for select
using (workspace_id = public.current_workspace_id());

create policy "payments workspace insert"
on payments for insert
with check (workspace_id = public.current_workspace_id());

create policy "payments workspace update"
on payments for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "payments workspace delete"
on payments for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "payment_attempts workspace select"
on payment_attempts for select
using (workspace_id = public.current_workspace_id());

create policy "payment_attempts workspace insert"
on payment_attempts for insert
with check (workspace_id = public.current_workspace_id());

create policy "payment_attempts workspace update"
on payment_attempts for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "payment_attempts workspace delete"
on payment_attempts for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "payment_events workspace select"
on payment_events for select
using (workspace_id = public.current_workspace_id());

create policy "payment_events workspace insert"
on payment_events for insert
with check (workspace_id = public.current_workspace_id());

create policy "payment_events workspace update"
on payment_events for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "payment_events workspace delete"
on payment_events for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "complaints workspace select"
on complaints for select
using (workspace_id = public.current_workspace_id());

create policy "complaints workspace insert"
on complaints for insert
with check (workspace_id = public.current_workspace_id());

create policy "complaints workspace update"
on complaints for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "complaints workspace delete"
on complaints for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));
```

# File: sql/008_local_file_storage.sql

```sql
-- 008_local_file_storage.sql
-- Local media storage config for the hybrid Supabase/Postgres + local filesystem design.
--
-- This migration intentionally does not create Supabase Storage buckets.
-- Media binaries stay on the application server filesystem.

create table if not exists storage_disks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid null references workspaces(id) on delete cascade,
  name text not null default 'uploads',
  storage_provider text not null default 'local',
  root_path text not null,
  public_base_url text not null,
  is_public boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint storage_disks_workspace_name_unique unique (workspace_id, name)
);

create trigger set_storage_disks_updated_at
before update on storage_disks
for each row execute function set_updated_at();

-- Optional default row for development. Replace paths in real environments.
-- insert into storage_disks (workspace_id, name, root_path, public_base_url)
-- values (null, 'uploads', 'server/uploads', 'http://localhost:5000/files')
-- on conflict do nothing;

-- Required server-side directories:
--   server/uploads/chat
--   server/uploads/agent-files
--   server/uploads/payment-proofs
--   server/uploads/product-images
--   server/uploads/category-images
--   server/uploads/public-assets
--   server/uploads/temp
--
-- Suggested env:
--   LOCAL_UPLOAD_ROOT=/absolute/path/to/server/uploads
--   PUBLIC_FILES_BASE_URL=https://your-domain.example/files
--
-- Important backup rule:
--   Database backup and uploads backup must be taken from the same time window.
```

# File: sql/009_multi_workspace_outlet_foundation.sql

```sql
-- 009_multi_workspace_outlet_foundation.sql
-- DEPRECATED: outlet/access/product_outlet_availability foundation now lives in:
--   002_core_identity.sql
--   005_orders_complaints_files.sql
--
-- Keep this file as a no-op placeholder for older migration manifests.
-- Safe to run on fresh installs; does nothing.

select 1;
```

# File: sql/009_migration_validation_queries.sql

```sql
-- 009_migration_validation_queries.sql
-- Non-destructive validation queries for staging and post-migration checks.
-- Run manually after importing Mongo data and local file metadata.

select 'chats without workspace' as check_name, count(*) as count from chats where workspace_id is null;
select 'chat_messages without chat' as check_name, count(*) as count from chat_messages where chat_id is null;
select 'chat_messages without workspace' as check_name, count(*) as count from chat_messages where workspace_id is null;
select 'orders without workspace' as check_name, count(*) as count from orders where workspace_id is null;
select 'orders without outlet' as check_name, count(*) as count from orders where outlet_id is null;
select 'complaints without workspace' as check_name, count(*) as count from complaints where workspace_id is null;
select 'agents without workspace' as check_name, count(*) as count from agents where workspace_id is null;

select m.id as chat_message_id, m.workspace_id as message_workspace_id, c.workspace_id as chat_workspace_id
from chat_messages m
join chats c on c.id = m.chat_id
where m.workspace_id <> c.workspace_id
limit 50;

select ci.id as cart_item_id, ci.workspace_id as item_workspace_id, c.workspace_id as cart_workspace_id
from cart_items ci
join carts c on c.id = ci.cart_id
where ci.workspace_id <> c.workspace_id
limit 50;

select oi.id as order_item_id, oi.workspace_id as item_workspace_id, o.workspace_id as order_workspace_id
from order_items oi
join orders o on o.id = oi.order_id
where oi.workspace_id <> o.workspace_id
limit 50;

select 'products' as table_name, count(*) from products
union all select 'product_variants', count(*) from product_variants
union all select 'product_outlet_availability', count(*) from product_outlet_availability
union all select 'carts', count(*) from carts
union all select 'orders', count(*) from orders
union all select 'order_events', count(*) from order_events
union all select 'payments', count(*) from payments
union all select 'payment_attempts', count(*) from payment_attempts
union all select 'payment_events', count(*) from payment_events
union all select 'agents', count(*) from agents
union all select 'complaints', count(*) from complaints;
```

# File: manifest.json

```json
{
  "package": "telegram-marketplace-data-migrations-v2",
  "generated_for": "KALIS.AI / eskala-bot",
  "purpose": "Canonical Supabase/Postgres migration pack aligned to docs/backend/06-data/database-schema.md",
  "preserved_original_file_count": 14,
  "files": [
    "README.md",
    "checklists/marketplace-mvp-checklist.md",
    "checklists/post-migration-checklist.md",
    "checklists/pre-migration-checklist.md",
    "notes/cutover-plan.md",
    "notes/data-backfill-order.md",
    "notes/marketplace-schema-notes.md",
    "notes/mongo-to-postgres-mapping.md",
    "notes/payment-gateway-contract.md",
    "notes/repository-layer-contract.md",
    "notes/telegram-commerce-flow.md",
    "sql/001_extensions_and_enums.sql",
    "sql/002_core_identity.sql",
    "sql/003_platforms_agents.sql",
    "sql/004_crm_chats_messages.sql",
    "sql/005_orders_complaints_files.sql",
    "sql/006_indexes.sql",
    "sql/007_rls_policies.sql",
    "sql/008_local_file_storage.sql",
    "sql/009_multi_workspace_outlet_foundation.sql",
    "sql/009_migration_validation_queries.sql"
  ],
  "notes": [
    "Supabase/Postgres structured data",
    "Local server filesystem for large media",
    "CRM compatibility preserved",
    "Canonical names: workspace_settings, chat_messages, taken_over_by_user_id",
    "Marketplace MVP and operational tables added",
    "009_multi_workspace_outlet_foundation.sql is deprecated because its foundation is covered by 002/005",
    "AI commerce guardrails and webhook idempotency included"
  ]
}
```
