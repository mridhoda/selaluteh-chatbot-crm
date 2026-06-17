# Mongo to Postgres Mapping — v3 Final Pre-MCP

This document maps the current MongoDB/Mongoose runtime schema to the target Supabase/Postgres schema. MongoDB remains the active runtime until an explicit staged cutover is approved.

## Runtime Rule

```txt
Current runtime: MongoDB + Mongoose
Target runtime: Supabase/Postgres
Migration mode: staged, no big-bang rewrite
Auth phase 1: keep custom backend auth; Supabase Auth is deferred
Supabase access phase 1: backend service role only; no frontend direct table access
```

## ID Strategy

Do not reuse Mongo ObjectId strings as UUID primary keys.

Use a deterministic mapping table during import:

```sql
create table if not exists mongo_id_map (
  collection text not null,
  mongo_id text not null,
  postgres_id uuid not null default gen_random_uuid(),
  created_at timestamptz not null default now(),
  primary key (collection, mongo_id),
  unique (postgres_id)
);
```

Rules:

1. Generate every mapped UUID before inserting rows with foreign keys.
2. Every FK lookup must use `mongo_id_map`.
3. Keep `mongo_id_map` until rollback window is closed.
4. Store unmapped/null references in the migration report.

## Naming

| Mongo | Postgres |
|---|---|
| `_id` | `id` |
| `workspaceId` | `workspace_id` |
| `userId` | `user_id` or `owner_user_id` depending context |
| `platformId` | `platform_id` |
| `agentId` | `agent_id` |
| `contactId` | `contact_id` |
| `chatId` | `chat_id` |
| `outletId` | `outlet_id` |
| `productId` | `product_id` |
| `checkoutId` | `checkout_id` |
| `orderId` | `order_id` |
| `paymentId` | `payment_id` |
| `takeoverBy` | `taken_over_by_user_id` |
| `isEscalated` | `is_escalated` |
| `lastMessageAt` | `last_message_at` |
| `platformType` | `platform_type` |
| `platformAccountId` | `external_id` |
| `platformMessageId` | `platform_message_id` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |

## Workspace Strategy

`Workspace` now exists in Mongo. Migration must import it directly.

Fallback only if legacy data has users with `workspaceId` but missing Workspace row:

1. Create workspace using `users.workspaceId`.
2. Prefer user with role `owner` as owner.
3. If no owner exists, pick earliest user and flag in report.
4. Backfill `user_workspace_memberships` from `User.workspaceId` + `User.role`.

## Model Mapping

| Mongoose Model | Target Table(s) | Mapping Notes |
|---|---|---|
| `Workspace` | `workspaces` | Preserve `name`, `status`, `metadata`, timestamps. |
| `User` | `users`, `user_workspace_memberships` | Preserve custom auth in `password_hash`. Keep `workspace_id`, `role`, `verified`, `status`, `plan`, `plan_expiry`. |
| `UserWorkspaceMembership` | `user_workspace_memberships` | Canonical membership source when present. Unique `(workspace_id,user_id)`. |
| `UserOutletAccess` | `user_outlet_access` | Unique `(workspace_id,user_id,outlet_id)`. |
| `Outlet` | `outlets` | Preserve code/city/region/address/phone/timezone/opening_hours/metadata. |
| `Platform` | `platforms` | Encrypt or rotate token/appSecret/webhookSecret. Preserve status, health, lastEventAt, agentId, enabled. |
| `Contact` | `contacts` | `platformAccountId` -> `external_id`; preserve `platformType`, `lastOutletId`, tags, notes. |
| `Chat` | `chats` | Preserve current outlet, takeover, escalation, unread, state, last activity. |
| `Message` | `chat_messages`, `files` | Preserve `platformMessageId`; migrate attachment metadata to `files` when possible. |
| `Agent` | `agents`, `agent_outlets`, optional `products` | Keep config arrays JSONB first; map outlet names/codes to `agent_outlets` when deterministic. |
| `Knowledge` | `files`, `agents.knowledge` JSONB | Store file metadata. Preserve local file path. |
| `AIAction` | `ai_actions` | Preserve input/output/errors/status/timestamps. |
| `Product` | `products`, `files` | Preserve catalog fields, thumbnail file/url, tags, tax, stock flags. |
| `ProductOutletAvailability` | `product_outlet_availability` | Preserve price override, stock, status, availability schedule. Unique `(workspace_id,product_id,variant_id,outlet_id)` with null-aware handling. |
| `Cart` | `carts`, `cart_items` | Normalize `items[]` to `cart_items`; preserve totals/status/expiresAt. |
| `Checkout` | `checkouts`, `checkout_items` | Normalize `items[]`; preserve idempotency key, customer/fulfillment snapshots, expiry. |
| `Order` | `orders`, `order_items`, `order_events` | Normalize `items[]` and `timeline[]`; flatten totals and snapshots. |
| `Payment` | `payments`, `payment_events` | Preserve attemptNumber on payment or split to `payment_attempts`; migrate embedded events to `payment_events` with dedupe. |
| `PaymentEvent` | `payment_events` | Canonical gateway event table; link payment/order when known. |
| `WebhookEvent` | `webhook_events` | Preserve payloadHash/payload/signature/status/attempts/errors. Unique provider+platform+externalEvent. |
| `Complaint` | `complaints` | Preserve workspace/outlet/chat/contact/agent/platformType/formData/status. `formData` -> JSONB. |
| `Setting` | `workspace_settings` | Map `primaryAI`, `secondaryAI`; defaults fill business/timezone/currency fields. |
| `OTP` | `otps` | Optional. Skip expired rows unless needed for active auth flows. Needs scheduled cleanup in Postgres. |
| `PasswordReset` | `password_resets` | Optional. Skip expired rows unless needed for active auth flows. |

## Enum Finalization

Use code-compatible enums/checks for phase 1:

```txt
platform.type: telegram, whatsapp, instagram, facebook, custom
platform.status: connected, disabled, pending_setup, needs_attention, disconnected
platform.health: healthy, no_recent_events, verification_failed, delivery_errors, not_configured
user.role legacy: owner, super, agent
membership.role: owner, admin, outlet_manager, human_agent, viewer
chat.status: open, resolved
cart.status: active, converted, expired, cancelled
checkout.status: pending, confirmed, converted, failed, expired
order.status: new, accepted, preparing, ready, completed, cancelled
order.payment_status: unpaid, pending, paid, failed, expired, refunded
order.fulfillment_status: unfulfilled, preparing, ready, fulfilled, cancelled
product_availability.status: active, inactive, sold_out, available, unavailable
payment.provider: midtrans, xendit, manual
payment.status: pending, paid, failed, expired, cancelled, refunded
payment.reconciliation_status: pending, matched, missing_webhook, unmatched, amount_mismatch, duplicate, provider_paid_order_pending
payment_event.processing_status: received, verified, processed, rejected, failed
complaint.status: open, resolved, dismissed
```

Do not create narrower Postgres enums until these values are accepted or migrated.

## Embedded Data Decisions

| Mongo Embedded Field | Final Target |
|---|---|
| `Cart.items[]` | `cart_items` relational rows |
| `Checkout.items[]` | `checkout_items` relational snapshot rows |
| `Order.items[]` | `order_items` relational snapshot rows |
| `Order.timeline[]` | `order_events` relational rows |
| `Payment.events[]` | `payment_events` rows, deduped against standalone `PaymentEvent` |
| `Agent.knowledge[]` | `agents.knowledge` JSONB phase 1 |
| `Agent.followUps[]` | `agents.follow_ups` JSONB phase 1 |
| `Agent.database[]` | `agents.database` JSONB + `files` when stored file exists |
| `Agent.salesForms[]` | `agents.sales_forms` JSONB phase 1 |
| `Agent.products[]` | Keep JSONB unless explicitly migrated to `products` after review |
| `Complaint.formData` | JSONB |
| `Chat.state` | JSONB |
| `WebhookEvent.payload` | JSONB |
| `PaymentEvent.raw` | JSONB |

## Sparse/Nullable Unique Index Strategy

Mongo sparse unique indexes must become Postgres partial unique indexes:

```sql
create unique index if not exists uq_products_workspace_slug_present
  on products(workspace_id, slug) where slug is not null and slug <> '';

create unique index if not exists uq_products_workspace_sku_present
  on products(workspace_id, sku) where sku is not null and sku <> '';

create unique index if not exists uq_outlets_workspace_code_present
  on outlets(workspace_id, code) where code is not null and code <> '';

create unique index if not exists uq_checkouts_workspace_idempotency_present
  on checkouts(workspace_id, idempotency_key) where idempotency_key is not null and idempotency_key <> '';

create unique index if not exists uq_orders_workspace_order_number_present
  on orders(workspace_id, order_number) where order_number is not null and order_number <> '';

create unique index if not exists uq_payments_provider_transaction_present
  on payments(provider_transaction_id) where provider_transaction_id is not null and provider_transaction_id <> '';

create unique index if not exists uq_payments_merchant_reference_present
  on payments(merchant_reference) where merchant_reference is not null and merchant_reference <> '';

create unique index if not exists uq_payment_events_provider_event_present
  on payment_events(coalesce(provider, ''), provider_event_id) where provider_event_id is not null and provider_event_id <> '';
```

Webhook events need null-aware platform handling:

```sql
create unique index if not exists uq_webhook_events_provider_platform_external
  on webhook_events(provider, coalesce(platform_id, '00000000-0000-0000-0000-000000000000'::uuid), external_event_id);
```

## Secret Migration

Platform secrets are not safe to expose through Supabase client APIs.

Rules:

1. Migrate `token`, `appSecret`, `webhookSecret` into encrypted/server-only fields.
2. Prefer credential rotation after import.
3. Backend service role can read encrypted fields.
4. Public/anon client must never select secret columns.
5. Log only `configured`/redacted state.

## Auth Strategy

Phase 1 keeps current custom auth:

```txt
users.email
users.password_hash
otps
password_resets
JWT middleware unchanged
```

Supabase Auth migration is deferred. If enabled later, map `users.auth_user_id` to Supabase Auth UUID and rebuild RLS around `auth.uid()`.

## RLS Strategy

Phase 1 migration uses backend service role only.

Recommended RLS preparation:

1. Keep `workspace_id` on every tenant-owned table.
2. Keep `user_workspace_memberships` and `user_outlet_access` complete.
3. Draft RLS policies, but do not enable frontend direct reads until auth strategy is finalized.

## Migration Order

1. Build `mongo_id_map` for all source collections.
2. Insert workspaces.
3. Insert users.
4. Insert memberships and outlet access.
5. Insert outlets/settings/platforms/agents.
6. Insert contacts/chats/messages/files.
7. Insert products/availability.
8. Insert carts/cart_items.
9. Insert checkouts/checkout_items.
10. Insert orders/order_items/order_events.
11. Insert payments/payment_events/webhook_events.
12. Insert complaints/auth transient rows if still active.
13. Run validation queries.
14. Run app smoke tests.

## Pre-MCP Gate

Before running Supabase MCP writes:

```txt
[ ] Supabase project is staging/non-production
[ ] Mongo backup exists
[ ] uploads backup exists
[ ] SQL schema reviewed
[ ] mongo_id_map strategy accepted
[ ] enum strategy accepted
[ ] embedded data strategy accepted
[ ] secret migration/rotation accepted
[ ] auth phase-1 strategy accepted
[ ] validation queries ready
[ ] rollback plan ready
```
