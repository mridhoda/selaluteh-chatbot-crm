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


---

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


---

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


---

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


---

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
- Verify AI skip when `takeover_by` exists.
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


---

# File: notes/data-backfill-order.md

```md
# Data Backfill Order — v2

Import order matters because of foreign keys and workspace isolation.

## Phase A — Prepare ID Mapping

1. Read all Mongo collections.
2. Build UUID map for every `_id` in every collection.
3. Build workspace UUID map from distinct Mongo `workspaceId` values.
4. Validate all references before writing.

## Phase B — Core CRM Import

1. Insert `workspaces` from distinct Mongo `workspaceId`.
2. Insert `users`.
3. Update `workspaces.owner_user_id`.
4. Insert `settings`.
5. Insert `platforms`.
6. Insert `agents`.
7. Insert agent child tables:
   - `agent_knowledge`
   - `agent_followups`
   - `agent_database_files`
   - `agent_complaint_fields`
   - `agent_outlets`
   - `agent_products`
   - `agent_sales_forms`
   - `agent_sales_form_fields`
   - `agent_sales_form_products`
8. Insert `contacts`.
9. Insert `chats`.
10. Verify/copy local files and insert `files` metadata.
11. Patch `agent_database_files.file_id`.
12. Insert `messages`.
13. Insert legacy `orders`.
14. Insert `complaints`.
15. Insert `knowledge_files`.

## Phase C — Marketplace Bootstrap

After CRM import is stable:

1. Create product categories if needed.
2. Migrate selected `agent_products` / `agent_sales_form_products` to `products`.
3. Create `product_variants` only when variants are meaningful.
4. Insert `product_images` for local/public product images.
5. Do not backfill old carts; carts are new runtime data.
6. Do not backfill payments unless old manual proofs need audit records.

## Phase D — Runtime Tables

Runtime-only tables usually start empty:

```txt
carts
cart_items
checkouts
payments
payment_events
webhook_events
ai_actions
```

Exception: `webhook_events` can be seeded with recent processed external message ids if you need duplicate protection during cutover.

## Backfill Validations

After import, required-reference counts must be zero:

```sql
select count(*) from messages where chat_id is null;
select count(*) from chats where workspace_id is null;
select count(*) from contacts where platform_account_id = '';
select count(*) from orders where workspace_id is null;
select count(*) from complaints where workspace_id is null;
```

Cross-workspace mismatches must return zero rows:

```sql
select *
from messages m
join chats c on c.id = m.chat_id
where m.workspace_id <> c.workspace_id;
```

## Timestamp Preservation

Always preserve:

```txt
createdAt -> created_at
updatedAt -> updated_at
lastMessageAt -> last_message_at
```

Message ordering and inbox sorting depend on timestamps.
```


---

# File: notes/marketplace-schema-notes.md

```md
# Marketplace Schema Notes

## MVP Scope

This schema targets a **single-merchant Telegram-first marketplace MVP**.

It is intentionally not a full multi-seller marketplace yet.

## Included

- Product categories.
- Products.
- Variants.
- Product images.
- Active carts.
- Cart items.
- Checkout confirmation.
- Orders.
- Order items.
- Payments.
- Payment events.
- Telegram webhook idempotency.
- AI action audit.

## Excluded for MVP

- Seller accounts.
- Seller wallets.
- Commission calculation.
- Payouts.
- Marketplace dispute system.
- Review/rating.
- Courier integration.
- Advanced promo engine.

## Why `orders` Supports Both Legacy and Marketplace

Existing app already has an AI-generated `Order` model. Removing it would break current behavior.

So the new `orders` table supports both:

```txt
Legacy AI form order:
  source = ai_form
  form_name
  form_data

New marketplace order:
  source = telegram
  cart_id
  checkout_id
  order_items
  payments
```

## Product Data Source

Long-term product data should live in:

```txt
products
product_variants
product_images
product_categories
```

Legacy `agent_products` and `agent_sales_form_products` are preserved only for compatibility.

## Price Snapshot Rule

Always snapshot price/name/sku into:

```txt
cart_items.product_snapshot
order_items.product_snapshot
```

This protects historical orders if product price/name changes later.

## Inventory Rule

MVP can start with `inventory_policy = do_not_track`.

When stock matters:

- Check `stock_quantity` before add-to-cart and checkout.
- Deduct/reserve stock only after order/payment rule is chosen.
- For food/drink MVP, simplest rule: deduct stock on paid order.

## Payment Rule

Order is not paid because AI says so.

Only payment webhook or admin action can change:

```txt
orders.payment_status = paid/settlement/capture
orders.status = paid
```
```


---

# File: notes/mongo-to-postgres-mapping.md

```md
# Mongo to Postgres Mapping — v2

This document maps the current MongoDB/Mongoose CRM schema to the updated Supabase/Postgres schema with marketplace support.

## Naming

| Mongo | Postgres |
|---|---|
| `_id` | `id` |
| `workspaceId` | `workspace_id` |
| `userId` | `owner_user_id` |
| `platformId` | `platform_id` |
| `agentId` | `agent_id` |
| `contactId` | `contact_id` |
| `chatId` | `chat_id` |
| `takeoverBy` | `takeover_by` |
| `isEscalated` | `is_escalated` |
| `lastMessageAt` | `last_message_at` |
| `platformType` | `platform_type` |
| `platformAccountId` | `platform_account_id` |
| `platformMessageId` | `platform_message_id` |
| `replyTo` | `reply_to` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |

## ID Strategy

Do not reuse Mongo ObjectId strings as UUID.

Use a deterministic mapping during import:

```txt
collection + mongo _id -> generated uuid
```

Persist the mapping as:

```txt
mongo-id-map.json
```

or temporary staging table:

```txt
mongo_id_map(collection text, mongo_id text, postgres_id uuid)
```

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
| `User` | `users`, `workspaces` | Custom password auth preserved through `password_hash` |
| `Platform` | `platforms` | Tokens should be rotated/encrypted after migration |
| `Agent` | `agents` + child tables | Nested arrays are normalized |
| `Contact` | `contacts` | Upsert key: `workspace_id + platform_type + platform_account_id` |
| `Chat` | `chats` | Preserve `takeover_by`, `is_escalated`, `status`, `state` |
| `Message` | `messages`, `files` | Preserve ordering via `created_at` |
| `Order` | `orders` | Old AI orders become `source = ai_form` |
| `Complaint` | `complaints` | Must become workspace scoped |
| `Knowledge` | `knowledge_files`, `files` | Store file metadata only |
| `OTP` | `otps` | Expired records may be skipped |
| `PasswordReset` | `password_resets` | Expired records may be skipped |
| `Setting` | `settings` | One per workspace |

## Agent Nested Data

| Mongo path | Target |
|---|---|
| `agent.knowledge[]` | `agent_knowledge` |
| `agent.followUps[]` | `agent_followups` |
| `agent.database[]` | `agent_database_files` + `files` |
| `agent.complaintFields[]` | `agent_complaint_fields` |
| `agent.outlets[]` | `agent_outlets` |
| `agent.salesForms[]` | `agent_sales_forms` + child tables |
| `agent.products[]` | `agent_products` legacy table; optionally copy into new `products` table |
| `agent.payment` | `agents.payment_*` columns for legacy manual payment |
| `agent.complaintNotification` | `agents.complaint_notification_*` columns |

## Existing Orders

Current AI-generated orders use flexible form data.

Map them to:

```txt
orders.source = 'ai_form'
orders.form_name = old form name
orders.form_data = old formData
orders.status = mapped old status
orders.payment_proof_file_id = mapped file id if available
orders.payment_proof_url = old proof URL if available
```

Do not create `order_items` for old AI form orders unless product/quantity can be confidently parsed.

## Marketplace Products

If current `agent.products[]` are used as sellable products, migrate them in two ways:

1. Preserve raw data in `agent_products` for backward compatibility.
2. Optionally create rows in `products` with:

```txt
name -> products.name
price -> products.base_price
image_url -> file metadata if local or public URL metadata
status -> active
source metadata -> { "from": "agent.products" }
```

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
messages.attachment_file_id
messages.attachment legacy jsonb retained temporarily
```

File binary remains on local server storage.

## Payment Data

Old manual payment proof stays on orders:

```txt
orders.payment_proof_file_id
orders.payment_proof_url
```

New gateway payment data uses:

```txt
payments
payment_events
webhook_events
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


---

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


---

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
  messages.repository.js
  files.repository.js
  products.repository.js
  carts.repository.js
  orders.repository.js
  payments.repository.js
  complaints.repository.js
  webhook-events.repository.js
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


---

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


---

# File: sql/001_extensions_and_enums.sql

```sql
-- 001_extensions_and_enums.sql
-- Base extensions, enum types, and shared trigger helpers for the updated
-- Chatbot CRM + Telegram-first Marketplace MVP Supabase/Postgres schema.
--
-- Design goals:
-- - Preserve existing CRM/chatbot behavior migrated from MongoDB/Mongoose.
-- - Add deterministic commerce primitives: product catalog, cart, checkout,
--   normalized order_items, payments, payment_events, and webhook idempotency.
-- - Keep large media binaries on the local application server; Postgres stores metadata only.

create extension if not exists "pgcrypto";
create extension if not exists "citext";
create extension if not exists "pg_trgm";

-- Identity / billing
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

-- CRM / messaging
do $$ begin
  create type chat_status as enum ('open', 'resolved');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type message_sender as enum ('user', 'ai', 'human', 'system');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type message_kind as enum ('text', 'image', 'video', 'audio', 'voice', 'document', 'sticker', 'callback', 'system');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type knowledge_kind as enum ('url', 'pdf', 'text', 'file', 'qna');
exception when duplicate_object then null;
end $$;

-- Operations
do $$ begin
  create type complaint_status as enum ('open', 'resolved', 'dismissed');
exception when duplicate_object then null;
end $$;

-- Marketplace catalog
do $$ begin
  create type product_status as enum ('draft', 'active', 'archived', 'out_of_stock');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type product_type as enum ('physical', 'digital', 'service', 'bundle');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type inventory_policy as enum ('track', 'do_not_track');
exception when duplicate_object then null;
end $$;

-- Cart / checkout / order
do $$ begin
  create type cart_status as enum ('active', 'checked_out', 'abandoned', 'expired');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type checkout_status as enum ('draft', 'awaiting_confirmation', 'confirmed', 'cancelled', 'expired');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type order_status as enum (
    'draft',
    'new',                 -- legacy AI form order status compatibility
    'pending_payment',
    'paid',
    'processing',
    'processed',           -- legacy order status compatibility
    'completed',
    'cancelled',
    'expired',
    'failed',
    'refunded'
  );
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
  create type payment_status as enum (
    'pending',
    'paid',
    'settlement',
    'capture',
    'deny',
    'cancel',
    'expire',
    'failure',
    'refund',
    'partial_refund',
    'chargeback'
  );
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

-- Generates readable order numbers per workspace in application code preferred.
-- This helper is intentionally simple and safe for dev, but production can replace
-- it with a stronger sequence strategy if required.
create or replace function generate_order_number(prefix text default 'ORD')
returns text
language sql
as $$
  select upper(prefix) || '-' || to_char(now(), 'YYYYMMDD') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
$$;
```


---

# File: sql/002_core_identity.sql

```sql
-- 002_core_identity.sql
-- Core identity, workspace, custom JWT compatibility, and settings tables.
--
-- Current app still has custom JWT + password_hash. This schema keeps that path
-- while allowing a future Supabase Auth migration via users.auth_user_id.

create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Default Workspace',
  owner_user_id uuid null,
  default_currency text not null default 'IDR',
  timezone text not null default 'Asia/Makassar',
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

create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null unique references workspaces(id) on delete cascade,
  primary_ai text not null default 'openai' check (primary_ai in ('openai', 'gemini', 'none')),
  secondary_ai text not null default 'gemini' check (secondary_ai in ('openai', 'gemini', 'none')),
  default_language text not null default 'id',
  default_currency text not null default 'IDR',
  timezone text not null default 'Asia/Makassar',
  ai_commerce_enabled boolean not null default false,
  ai_auto_create_order boolean not null default false,
  require_checkout_confirmation boolean not null default true,
  human_handoff_enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_settings_updated_at
before update on settings
for each row execute function set_updated_at();
```


---

# File: sql/003_platforms_agents.sql

```sql
-- 003_platforms_agents.sql
-- Connected platforms, AI agents, legacy sales forms, and normalized agent child tables.
--
-- Agent sales forms are retained for backward compatibility with the existing AI
-- order capture flow. New marketplace product catalog lives in 005_orders_complaints_files.sql.

create table if not exists platforms (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  owner_user_id uuid null references users(id) on delete set null,
  type platform_type not null,
  label text not null,
  token text not null default '',
  account_id text not null default '',
  phone_number_id text not null default '',
  app_id text not null default '',
  app_secret text not null default '',
  webhook_secret text not null default '',
  enabled boolean not null default true,
  webhook_url text null,
  last_webhook_at timestamptz null,
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
  owner_user_id uuid null references users(id) on delete set null,
  platform_id uuid null references platforms(id) on delete set null,
  name text not null,
  prompt text not null default '',
  behavior text not null default '',
  welcome_message text not null default 'Halo! Ada yang bisa saya bantu?',
  response_delay integer not null default 0,
  sticker_url text null,
  ai_enabled boolean not null default true,
  ai_commerce_mode boolean not null default false,
  ai_may_recommend_products boolean not null default true,
  ai_may_create_cart boolean not null default false,
  ai_may_create_order boolean not null default false,
  payment_enabled boolean not null default false,
  payment_bank_info text not null default '',
  payment_qris_url text not null default '',
  complaint_notification_enabled boolean not null default false,
  complaint_notification_platform_id uuid null references platforms(id) on delete set null,
  complaint_notification_destination text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_agents_updated_at
before update on agents
for each row execute function set_updated_at();

create table if not exists agent_knowledge (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  kind knowledge_kind not null,
  value text null,
  question text null,
  answer text null,
  position integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_agent_knowledge_updated_at before update on agent_knowledge for each row execute function set_updated_at();

create table if not exists agent_followups (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  name text not null,
  trigger_text text not null,
  prompt text not null,
  delay_minutes integer not null check (delay_minutes >= 0),
  enabled boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_agent_followups_updated_at before update on agent_followups for each row execute function set_updated_at();

create table if not exists agent_database_files (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  file_id uuid null,
  legacy_file_id text null,
  name text null,
  original_name text null,
  url text null,
  mime_type text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_agent_database_files_updated_at before update on agent_database_files for each row execute function set_updated_at();

create table if not exists agent_complaint_fields (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  label text not null,
  key text not null,
  field_type text not null default 'text',
  required boolean not null default false,
  position integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_agent_complaint_fields_updated_at before update on agent_complaint_fields for each row execute function set_updated_at();

create table if not exists agent_outlets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  name text not null,
  address text null,
  phone text null,
  maps_url text null,
  is_active boolean not null default true,
  position integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_agent_outlets_updated_at before update on agent_outlets for each row execute function set_updated_at();

-- Legacy agent.products[] support. New production catalog uses product tables in 005.
create table if not exists agent_products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  name text not null,
  description text null,
  price numeric(14,2) not null default 0,
  currency text not null default 'IDR',
  image_url text null,
  is_active boolean not null default true,
  position integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_agent_products_updated_at before update on agent_products for each row execute function set_updated_at();

create table if not exists agent_sales_forms (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  name text not null,
  description text null,
  enabled boolean not null default true,
  position integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_agent_sales_forms_updated_at before update on agent_sales_forms for each row execute function set_updated_at();

create table if not exists agent_sales_form_fields (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  sales_form_id uuid not null references agent_sales_forms(id) on delete cascade,
  label text not null,
  key text not null,
  field_type text not null default 'text',
  required boolean not null default false,
  position integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_agent_sales_form_fields_updated_at before update on agent_sales_form_fields for each row execute function set_updated_at();

create table if not exists agent_sales_form_products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  sales_form_id uuid not null references agent_sales_forms(id) on delete cascade,
  name text not null,
  description text null,
  price numeric(14,2) not null default 0,
  currency text not null default 'IDR',
  image_url text null,
  position integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_agent_sales_form_products_updated_at before update on agent_sales_form_products for each row execute function set_updated_at();
```


---

# File: sql/004_crm_chats_messages.sql

```sql
-- 004_crm_chats_messages.sql
-- CRM contacts, chats, messages, webhook idempotency, and AI action audit tables.
--
-- This keeps the current behavior: platform webhook -> contact upsert -> chat upsert
-- -> message insert -> AI/human flow.

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  owner_user_id uuid null references users(id) on delete set null,
  name text not null default '',
  platform_type platform_type not null,
  platform_account_id text not null,
  handle text null,
  phone text null,
  email citext null,
  last_seen timestamptz null,
  tags text[] not null default '{}',
  notes text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contacts_platform_identity_unique unique (workspace_id, platform_type, platform_account_id)
);

create trigger set_contacts_updated_at
before update on contacts
for each row execute function set_updated_at();

create table if not exists chats (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  owner_user_id uuid null references users(id) on delete set null,
  agent_id uuid null references agents(id) on delete set null,
  contact_id uuid not null references contacts(id) on delete cascade,
  platform_id uuid null references platforms(id) on delete set null,
  platform_type platform_type not null,
  unread integer not null default 0 check (unread >= 0),
  last_message_at timestamptz null,
  takeover_by uuid null references users(id) on delete set null,
  is_escalated boolean not null default false,
  status chat_status not null default 'open',
  state jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chats_platform_contact_unique unique (workspace_id, platform_id, contact_id)
);

create trigger set_chats_updated_at
before update on chats
for each row execute function set_updated_at();

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  chat_id uuid not null references chats(id) on delete cascade,
  sender message_sender not null,
  kind message_kind not null default 'text',
  text text null,
  attachment_file_id uuid null,
  attachment jsonb not null default '{}'::jsonb,
  reply_to uuid null references messages(id) on delete set null,
  platform_message_id text null,
  platform_thread_id text null,
  raw_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_messages_updated_at
before update on messages
for each row execute function set_updated_at();

-- Public webhooks write through backend service role. This table makes webhook
-- processing idempotent for Telegram/Meta/payment providers.
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

-- AI action audit. AI can propose commerce actions, but checkout/order/payment
-- must be confirmed and executed by deterministic backend services.
create table if not exists ai_actions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  chat_id uuid null references chats(id) on delete cascade,
  message_id uuid null references messages(id) on delete set null,
  agent_id uuid null references agents(id) on delete set null,
  action_type text not null,
  status ai_action_status not null default 'proposed',
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  error text null,
  confirmed_by_user_at timestamptz null,
  executed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_ai_actions_updated_at
before update on ai_actions
for each row execute function set_updated_at();
```


---

# File: sql/005_orders_complaints_files.sql

```sql
-- 005_orders_complaints_files.sql
-- Files, operations, marketplace catalog, carts, checkouts, orders, and payments.
--
-- This file intentionally expands the old operations schema into the latest
-- Telegram-first Marketplace MVP schema.

-- -----------------------------------------------------------------------------
-- Local file metadata. Binaries stay in server/uploads or another local disk.
-- -----------------------------------------------------------------------------
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

-- Add FK that could not be created in 004 because files did not exist yet.
do $$ begin
  alter table messages
    add constraint messages_attachment_file_fk
    foreign key (attachment_file_id) references files(id)
    on delete set null;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter table agent_database_files
    add constraint agent_database_files_file_fk
    foreign key (file_id) references files(id)
    on delete set null;
exception when duplicate_object then null;
end $$;

-- -----------------------------------------------------------------------------
-- Marketplace catalog
-- -----------------------------------------------------------------------------
create table if not exists product_categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  parent_id uuid null references product_categories(id) on delete set null,
  name text not null,
  slug text not null,
  description text null,
  image_file_id uuid null references files(id) on delete set null,
  is_active boolean not null default true,
  position integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_categories_workspace_slug_unique unique (workspace_id, slug)
);
create trigger set_product_categories_updated_at before update on product_categories for each row execute function set_updated_at();

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  category_id uuid null references product_categories(id) on delete set null,
  name text not null,
  slug text not null,
  description text null,
  short_description text null,
  sku text null,
  product_type product_type not null default 'physical',
  status product_status not null default 'active',
  base_price numeric(14,2) not null default 0 check (base_price >= 0),
  currency text not null default 'IDR',
  inventory_policy inventory_policy not null default 'do_not_track',
  stock_quantity integer null check (stock_quantity is null or stock_quantity >= 0),
  low_stock_threshold integer null check (low_stock_threshold is null or low_stock_threshold >= 0),
  primary_image_file_id uuid null references files(id) on delete set null,
  tags text[] not null default '{}',
  is_featured boolean not null default false,
  sort_order integer not null default 0,
  ai_search_text text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_workspace_slug_unique unique (workspace_id, slug),
  constraint products_workspace_sku_unique unique (workspace_id, sku)
);
create trigger set_products_updated_at before update on products for each row execute function set_updated_at();

create table if not exists product_variants (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  name text not null,
  sku text null,
  option_values jsonb not null default '{}'::jsonb,
  price numeric(14,2) null check (price is null or price >= 0),
  currency text not null default 'IDR',
  inventory_policy inventory_policy not null default 'do_not_track',
  stock_quantity integer null check (stock_quantity is null or stock_quantity >= 0),
  is_default boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint product_variants_workspace_sku_unique unique (workspace_id, sku)
);
create trigger set_product_variants_updated_at before update on product_variants for each row execute function set_updated_at();

create table if not exists product_images (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  product_id uuid not null references products(id) on delete cascade,
  file_id uuid not null references files(id) on delete cascade,
  alt_text text null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Cart / checkout
-- -----------------------------------------------------------------------------
create table if not exists carts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  chat_id uuid null references chats(id) on delete set null,
  platform_id uuid null references platforms(id) on delete set null,
  platform_type platform_type not null,
  status cart_status not null default 'active',
  currency text not null default 'IDR',
  subtotal_amount numeric(14,2) not null default 0 check (subtotal_amount >= 0),
  discount_amount numeric(14,2) not null default 0 check (discount_amount >= 0),
  shipping_amount numeric(14,2) not null default 0 check (shipping_amount >= 0),
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  expires_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_carts_updated_at before update on carts for each row execute function set_updated_at();

create table if not exists cart_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  cart_id uuid not null references carts(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  variant_id uuid null references product_variants(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  currency text not null default 'IDR',
  line_total numeric(14,2) not null check (line_total >= 0),
  product_snapshot jsonb not null default '{}'::jsonb,
  notes text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_items_unique_product_variant unique (cart_id, product_id, variant_id)
);
create trigger set_cart_items_updated_at before update on cart_items for each row execute function set_updated_at();

create table if not exists checkouts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
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
create trigger set_checkouts_updated_at before update on checkouts for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- Orders and order items
-- -----------------------------------------------------------------------------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  order_number text not null default generate_order_number('ORD'),
  source order_source not null default 'telegram',
  platform_id uuid null references platforms(id) on delete set null,
  platform_type platform_type null,
  chat_id uuid null references chats(id) on delete set null,
  contact_id uuid null references contacts(id) on delete set null,
  agent_id uuid null references agents(id) on delete set null,
  cart_id uuid null references carts(id) on delete set null,
  checkout_id uuid null references checkouts(id) on delete set null,
  form_name text null,               -- legacy AI sales form compatibility
  form_data jsonb not null default '{}'::jsonb,
  status order_status not null default 'pending_payment',
  payment_status payment_status not null default 'pending',
  currency text not null default 'IDR',
  subtotal_amount numeric(14,2) not null default 0 check (subtotal_amount >= 0),
  discount_amount numeric(14,2) not null default 0 check (discount_amount >= 0),
  shipping_amount numeric(14,2) not null default 0 check (shipping_amount >= 0),
  total_amount numeric(14,2) not null default 0 check (total_amount >= 0),
  customer_name text null,
  customer_phone text null,
  customer_address text null,
  notes text null,
  payment_proof_file_id uuid null references files(id) on delete set null,
  payment_proof_url text null,
  paid_at timestamptz null,
  completed_at timestamptz null,
  cancelled_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_workspace_order_number_unique unique (workspace_id, order_number)
);
create trigger set_orders_updated_at before update on orders for each row execute function set_updated_at();

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid null references products(id) on delete set null,
  variant_id uuid null references product_variants(id) on delete set null,
  product_name text not null,
  variant_name text null,
  sku text null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(14,2) not null check (unit_price >= 0),
  currency text not null default 'IDR',
  line_total numeric(14,2) not null check (line_total >= 0),
  product_snapshot jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Payments
-- -----------------------------------------------------------------------------
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  order_id uuid not null references orders(id) on delete cascade,
  provider payment_provider not null default 'midtrans',
  provider_order_id text not null,
  provider_transaction_id text null,
  provider_payment_type text null,
  status payment_status not null default 'pending',
  currency text not null default 'IDR',
  amount numeric(14,2) not null check (amount >= 0),
  payment_link_url text null,
  snap_token text null,
  raw_response jsonb not null default '{}'::jsonb,
  expires_at timestamptz null,
  paid_at timestamptz null,
  cancelled_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_provider_order_unique unique (workspace_id, provider, provider_order_id)
);
create trigger set_payments_updated_at before update on payments for each row execute function set_updated_at();

create table if not exists payment_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  payment_id uuid null references payments(id) on delete set null,
  order_id uuid null references orders(id) on delete set null,
  provider payment_provider not null,
  event_type text not null,
  external_event_id text null,
  provider_order_id text null,
  provider_transaction_id text null,
  status payment_status null,
  signature_verified boolean not null default false,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz null,
  error text null,
  created_at timestamptz not null default now(),
  constraint payment_events_external_unique unique (provider, external_event_id)
);

-- -----------------------------------------------------------------------------
-- Complaints
-- -----------------------------------------------------------------------------
create table if not exists complaints (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  chat_id uuid null references chats(id) on delete set null,
  contact_id uuid null references contacts(id) on delete set null,
  agent_id uuid null references agents(id) on delete set null,
  platform_type platform_type null,
  text text not null default '',
  form_data jsonb not null default '{}'::jsonb,
  status complaint_status not null default 'open',
  assigned_to uuid null references users(id) on delete set null,
  resolved_at timestamptz null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger set_complaints_updated_at before update on complaints for each row execute function set_updated_at();

-- Separate workspace knowledge file metadata retained for migration compatibility.
create table if not exists knowledge_files (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  file_id uuid null references files(id) on delete set null,
  original_name text not null,
  stored_name text not null,
  mime_type text null,
  size_bytes bigint null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```


---

# File: sql/006_indexes.sql

```sql
-- 006_indexes.sql
-- Query indexes for CRM, Telegram webhook, marketplace MVP, payments, and migration checks.

-- Identity
create unique index if not exists users_email_unique on users (email);
create index if not exists users_workspace_id_idx on users (workspace_id);
create index if not exists users_auth_user_id_idx on users (auth_user_id);
create index if not exists users_workspace_role_idx on users (workspace_id, role);

-- Platforms and agents
create index if not exists platforms_workspace_id_idx on platforms (workspace_id);
create index if not exists platforms_workspace_type_idx on platforms (workspace_id, type);
create index if not exists platforms_account_lookup_idx on platforms (type, account_id) where account_id <> '';
create index if not exists platforms_token_lookup_idx on platforms (type, token) where token <> '';
create index if not exists platforms_enabled_idx on platforms (workspace_id, enabled);

create index if not exists agents_workspace_id_idx on agents (workspace_id);
create index if not exists agents_platform_id_idx on agents (platform_id);
create index if not exists agents_ai_commerce_idx on agents (workspace_id, ai_commerce_mode);

create index if not exists agent_knowledge_agent_idx on agent_knowledge (agent_id);
create index if not exists agent_followups_agent_idx on agent_followups (agent_id);
create index if not exists agent_database_files_agent_idx on agent_database_files (agent_id);
create index if not exists agent_products_agent_idx on agent_products (agent_id);
create index if not exists agent_sales_forms_agent_idx on agent_sales_forms (agent_id);

-- CRM contacts/chats/messages
create index if not exists contacts_workspace_id_idx on contacts (workspace_id);
create index if not exists contacts_tags_gin_idx on contacts using gin (tags);
create index if not exists contacts_name_trgm_idx on contacts using gin (name gin_trgm_ops);
create index if not exists contacts_handle_trgm_idx on contacts using gin (handle gin_trgm_ops);

create index if not exists chats_workspace_last_message_idx on chats (workspace_id, last_message_at desc nulls last);
create index if not exists chats_contact_id_idx on chats (contact_id);
create index if not exists chats_platform_contact_idx on chats (workspace_id, platform_id, contact_id);
create index if not exists chats_takeover_by_idx on chats (workspace_id, takeover_by);
create index if not exists chats_status_idx on chats (workspace_id, status);
create index if not exists chats_unread_idx on chats (workspace_id, unread);
create index if not exists chats_escalated_idx on chats (workspace_id, is_escalated);

create index if not exists messages_chat_created_idx on messages (chat_id, created_at);
create index if not exists messages_workspace_created_idx on messages (workspace_id, created_at desc);
create index if not exists messages_platform_message_id_idx on messages (platform_message_id) where platform_message_id is not null;
create index if not exists messages_reply_to_idx on messages (reply_to);
create index if not exists messages_text_trgm_idx on messages using gin (text gin_trgm_ops);

create index if not exists webhook_events_workspace_idx on webhook_events (workspace_id, received_at desc);
create index if not exists webhook_events_status_idx on webhook_events (status, received_at desc);
create index if not exists webhook_events_provider_type_idx on webhook_events (provider, event_type);
create index if not exists ai_actions_workspace_chat_idx on ai_actions (workspace_id, chat_id, created_at desc);
create index if not exists ai_actions_status_idx on ai_actions (workspace_id, status);

-- Files
create index if not exists files_workspace_id_idx on files (workspace_id);
create index if not exists files_source_idx on files (workspace_id, source);
create index if not exists files_public_path_idx on files (public_path);
create index if not exists files_mime_type_idx on files (workspace_id, mime_type);

-- Marketplace catalog
create index if not exists product_categories_workspace_idx on product_categories (workspace_id, is_active, position);
create index if not exists product_categories_parent_idx on product_categories (workspace_id, parent_id);
create index if not exists products_workspace_status_idx on products (workspace_id, status, sort_order);
create index if not exists products_category_idx on products (workspace_id, category_id, status);
create index if not exists products_featured_idx on products (workspace_id, is_featured) where is_featured = true;
create index if not exists products_name_trgm_idx on products using gin (name gin_trgm_ops);
create index if not exists products_description_trgm_idx on products using gin (description gin_trgm_ops);
create index if not exists products_tags_gin_idx on products using gin (tags);
create index if not exists product_variants_product_idx on product_variants (product_id, is_active, sort_order);
create index if not exists product_images_product_idx on product_images (product_id, position);

-- Cart / checkout
create index if not exists carts_contact_active_idx on carts (workspace_id, contact_id, status);
create index if not exists carts_chat_active_idx on carts (workspace_id, chat_id, status);
create index if not exists carts_expires_idx on carts (expires_at) where status = 'active';
create index if not exists cart_items_cart_idx on cart_items (cart_id);
create index if not exists checkouts_cart_idx on checkouts (cart_id);
create index if not exists checkouts_status_idx on checkouts (workspace_id, status, created_at desc);

-- Orders/payments/complaints
create index if not exists orders_workspace_status_created_idx on orders (workspace_id, status, created_at desc);
create index if not exists orders_contact_created_idx on orders (workspace_id, contact_id, created_at desc);
create index if not exists orders_chat_id_idx on orders (chat_id);
create index if not exists orders_payment_status_idx on orders (workspace_id, payment_status, created_at desc);
create index if not exists order_items_order_idx on order_items (order_id);
create index if not exists order_items_product_idx on order_items (workspace_id, product_id);

create index if not exists payments_workspace_status_idx on payments (workspace_id, status, created_at desc);
create index if not exists payments_order_idx on payments (order_id);
create index if not exists payments_provider_transaction_idx on payments (provider, provider_transaction_id) where provider_transaction_id is not null;
create index if not exists payment_events_payment_idx on payment_events (payment_id, created_at desc);
create index if not exists payment_events_order_idx on payment_events (order_id, created_at desc);

create index if not exists complaints_workspace_status_created_idx on complaints (workspace_id, status, created_at desc);
create index if not exists complaints_chat_id_idx on complaints (chat_id);
create index if not exists complaints_assigned_idx on complaints (workspace_id, assigned_to, status);
```


---

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
alter table settings enable row level security;
alter table platforms enable row level security;
alter table agents enable row level security;
alter table agent_knowledge enable row level security;
alter table agent_followups enable row level security;
alter table agent_database_files enable row level security;
alter table agent_complaint_fields enable row level security;
alter table agent_outlets enable row level security;
alter table agent_products enable row level security;
alter table agent_sales_forms enable row level security;
alter table agent_sales_form_fields enable row level security;
alter table agent_sales_form_products enable row level security;
alter table contacts enable row level security;
alter table messages enable row level security;
alter table webhook_events enable row level security;
alter table ai_actions enable row level security;
alter table files enable row level security;
alter table product_categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_images enable row level security;
alter table carts enable row level security;
alter table cart_items enable row level security;
alter table checkouts enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table payments enable row level security;
alter table payment_events enable row level security;
alter table complaints enable row level security;
alter table knowledge_files enable row level security;


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
    or takeover_by = public.current_app_user_id()
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

create policy "settings workspace select"
on settings for select
using (workspace_id = public.current_workspace_id());

create policy "settings workspace insert"
on settings for insert
with check (workspace_id = public.current_workspace_id());

create policy "settings workspace update"
on settings for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "settings workspace delete"
on settings for delete
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

create policy "agent_knowledge workspace select"
on agent_knowledge for select
using (workspace_id = public.current_workspace_id());

create policy "agent_knowledge workspace insert"
on agent_knowledge for insert
with check (workspace_id = public.current_workspace_id());

create policy "agent_knowledge workspace update"
on agent_knowledge for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "agent_knowledge workspace delete"
on agent_knowledge for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "agent_followups workspace select"
on agent_followups for select
using (workspace_id = public.current_workspace_id());

create policy "agent_followups workspace insert"
on agent_followups for insert
with check (workspace_id = public.current_workspace_id());

create policy "agent_followups workspace update"
on agent_followups for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "agent_followups workspace delete"
on agent_followups for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "agent_database_files workspace select"
on agent_database_files for select
using (workspace_id = public.current_workspace_id());

create policy "agent_database_files workspace insert"
on agent_database_files for insert
with check (workspace_id = public.current_workspace_id());

create policy "agent_database_files workspace update"
on agent_database_files for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "agent_database_files workspace delete"
on agent_database_files for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "agent_complaint_fields workspace select"
on agent_complaint_fields for select
using (workspace_id = public.current_workspace_id());

create policy "agent_complaint_fields workspace insert"
on agent_complaint_fields for insert
with check (workspace_id = public.current_workspace_id());

create policy "agent_complaint_fields workspace update"
on agent_complaint_fields for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "agent_complaint_fields workspace delete"
on agent_complaint_fields for delete
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

create policy "agent_products workspace select"
on agent_products for select
using (workspace_id = public.current_workspace_id());

create policy "agent_products workspace insert"
on agent_products for insert
with check (workspace_id = public.current_workspace_id());

create policy "agent_products workspace update"
on agent_products for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "agent_products workspace delete"
on agent_products for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "agent_sales_forms workspace select"
on agent_sales_forms for select
using (workspace_id = public.current_workspace_id());

create policy "agent_sales_forms workspace insert"
on agent_sales_forms for insert
with check (workspace_id = public.current_workspace_id());

create policy "agent_sales_forms workspace update"
on agent_sales_forms for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "agent_sales_forms workspace delete"
on agent_sales_forms for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "agent_sales_form_fields workspace select"
on agent_sales_form_fields for select
using (workspace_id = public.current_workspace_id());

create policy "agent_sales_form_fields workspace insert"
on agent_sales_form_fields for insert
with check (workspace_id = public.current_workspace_id());

create policy "agent_sales_form_fields workspace update"
on agent_sales_form_fields for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "agent_sales_form_fields workspace delete"
on agent_sales_form_fields for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));

create policy "agent_sales_form_products workspace select"
on agent_sales_form_products for select
using (workspace_id = public.current_workspace_id());

create policy "agent_sales_form_products workspace insert"
on agent_sales_form_products for insert
with check (workspace_id = public.current_workspace_id());

create policy "agent_sales_form_products workspace update"
on agent_sales_form_products for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "agent_sales_form_products workspace delete"
on agent_sales_form_products for delete
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

create policy "messages workspace select"
on messages for select
using (workspace_id = public.current_workspace_id());

create policy "messages workspace insert"
on messages for insert
with check (workspace_id = public.current_workspace_id());

create policy "messages workspace update"
on messages for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "messages workspace delete"
on messages for delete
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

create policy "product_images workspace select"
on product_images for select
using (workspace_id = public.current_workspace_id());

create policy "product_images workspace insert"
on product_images for insert
with check (workspace_id = public.current_workspace_id());

create policy "product_images workspace update"
on product_images for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "product_images workspace delete"
on product_images for delete
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

create policy "knowledge_files workspace select"
on knowledge_files for select
using (workspace_id = public.current_workspace_id());

create policy "knowledge_files workspace insert"
on knowledge_files for insert
with check (workspace_id = public.current_workspace_id());

create policy "knowledge_files workspace update"
on knowledge_files for update
using (workspace_id = public.current_workspace_id())
with check (workspace_id = public.current_workspace_id());

create policy "knowledge_files workspace delete"
on knowledge_files for delete
using (workspace_id = public.current_workspace_id() and public.current_app_role() in ('owner', 'super'));
```


---

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


---

# File: sql/009_migration_validation_queries.sql

```sql
-- 009_migration_validation_queries.sql
-- Non-destructive validation queries for staging and post-migration checks.
-- Run manually after importing Mongo data and local file metadata.

-- Required references should be zero.
select 'chats without workspace' as check_name, count(*) as count from chats where workspace_id is null;
select 'messages without chat' as check_name, count(*) as count from messages where chat_id is null;
select 'messages without workspace' as check_name, count(*) as count from messages where workspace_id is null;
select 'orders without workspace' as check_name, count(*) as count from orders where workspace_id is null;
select 'complaints without workspace' as check_name, count(*) as count from complaints where workspace_id is null;

-- Cross-workspace consistency checks should return zero rows.
select m.id as message_id, m.workspace_id as message_workspace_id, c.workspace_id as chat_workspace_id
from messages m
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

-- Marketplace readiness counts.
select 'products' as table_name, count(*) from products
union all select 'product_variants', count(*) from product_variants
union all select 'carts', count(*) from carts
union all select 'orders', count(*) from orders
union all select 'payments', count(*) from payments
union all select 'payment_events', count(*) from payment_events;
```
