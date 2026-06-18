# Legacy Mongo to Supabase Mapping Reference

This document is now historical/reference material only. The approved cutover mode is fresh Supabase data with no Mongo import.

## Runtime Rule

```txt
Current/final runtime target: Supabase/Postgres
Legacy runtime: MongoDB + Mongoose until domain code is cut over
Migration mode: staged domain-by-domain cutover
Data mode: start fresh from Supabase
Not allowed: Mongo backfill, dual-write, legacy reconciliation
Auth phase 1: keep custom backend auth; Supabase Auth is deferred
Supabase access phase 1: backend service role only; no frontend direct table access
```

## Why This Mapping Still Exists

Use this file only to understand legacy shape differences while replacing code. Do not build a Mongo import/backfill pipeline from this document unless a separate historical-data import spec is approved later.

## Naming Reference

| Legacy/Mongoose | Supabase/Postgres |
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

## Model Mapping Reference

| Legacy Model | Target Table(s) | Notes |
|---|---|---|
| `Workspace` | `workspaces` | Supabase is canonical after cutover. |
| `User` | `users`, `user_workspace_memberships` | Preserve custom auth via `password_hash`. |
| `UserWorkspaceMembership` | `user_workspace_memberships` | Canonical membership source. |
| `UserOutletAccess` | `user_outlet_access` | Enforce outlet scope. |
| `Outlet` | `outlets` | Preserve workspace ownership and outlet metadata. |
| `Platform` | `platforms` | Secrets stay backend-only and redacted. |
| `Contact` | `contacts` | `platformAccountId` maps to `external_id`. |
| `Chat` | `chats` | Preserve current outlet, takeover, escalation, unread, and state semantics. |
| `Message` | `chat_messages`, `files` | Store attachments as file metadata when normalized. |
| `Agent` | `agents`, `agent_outlets` | JSONB config first, outlet mapping through `agent_outlets`. |
| `Knowledge` | `files`, `agents.knowledge` JSONB | Store metadata only; binary remains local. |
| `AIAction` | `ai_actions` | Preserve input/output/errors/status semantics. |
| `Product` | `products`, `files` | Product catalog is Supabase canonical. |
| `ProductOutletAvailability` | `product_outlet_availability` | Outlet-specific availability/price/stock. |
| `Cart` | `carts`, `cart_items` | Normalize items into rows. |
| `Checkout` | `checkouts`, `checkout_items` | Snapshot checkout items. |
| `Order` | `orders`, `order_items`, `order_events` | Normalize items and lifecycle events. |
| `Payment` | `payments`, `payment_events` | Provider webhook is payment authority. |
| `PaymentEvent` | `payment_events` | Idempotent gateway event table. |
| `WebhookEvent` | `webhook_events` | Provider/platform/external-event idempotency. |
| `Complaint` | `complaints` | Preserve workspace/outlet/contact/chat references. |
| `Setting` | `workspace_settings` | Secrets redacted in API responses. |
| `OTP` | `otps` | Custom backend auth remains. |
| `PasswordReset` | `password_resets` | Custom backend auth remains. |

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

## Embedded Data Decisions

| Legacy Embedded Field | Target |
|---|---|
| `Cart.items[]` | `cart_items` relational rows |
| `Checkout.items[]` | `checkout_items` relational snapshot rows |
| `Order.items[]` | `order_items` relational snapshot rows |
| `Order.timeline[]` | `order_events` relational rows |
| `Payment.events[]` | `payment_events` rows |
| `Agent.knowledge[]` | `agents.knowledge` JSONB phase 1 |
| `Agent.followUps[]` | `agents.follow_ups` JSONB phase 1 |
| `Agent.database[]` | `agents.database` JSONB + `files` when stored file exists |
| `Agent.salesForms[]` | `agents.sales_forms` JSONB phase 1 |
| `Agent.products[]` | Keep JSONB unless explicitly migrated to `products` after review |
| `Complaint.formData` | JSONB |
| `Chat.state` | JSONB |
| `WebhookEvent.payload` | JSONB |
| `PaymentEvent.raw` | JSONB |

## Auth Strategy

Phase 1 keeps current custom auth:

```txt
users.email
users.password_hash
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
