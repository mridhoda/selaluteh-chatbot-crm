---
schema_version: 2
document_type: active-task-pointer
status: idle
spec: general-backend
updated_at: 2026-06-27
---

# Current Task

## Telegram Multi-Tenant Webhook + Outlet Location Canonicalization

Status: completed and idle after verification.

Completed in the latest session:

- Fixed Connected Platforms active workspace synchronization:
  - Configured request interceptor in `httpClient.js` to attach the active `x-workspace-id` header to all backend API calls.
  - Refactored `Sidebar.jsx` to load dynamic workspace options from the database and reload the page clean on switcher change.
- Implemented dedicated AI Agent Assignment Modal in `PlatformsPage.jsx` and updated `PlatformDetailDrawer.jsx` to trigger it.
- Made `PlatformDetailDrawer.jsx` labels dynamic based on platform type (Telegram vs Meta/WhatsApp/Instagram).
- Fully redesigned Connected Platforms UI/UX to a minimalist modern layout:
  - Upgraded Summary Cards with Lucide icons, borders, shadows, and translateY hover transitions.
  - Redesigned table layout with card shadows, generous padding, and a styled purple AI agent badge.
  - Redesigned action buttons to custom square-rounded styled icons.
- Implemented Webhook Health Auto-Sync and Verification:
  - Updated `platforms.supabase.repository.js` (`list`, `findById`, `findByIdWithCredentials`) to dynamically resolve `webhookConfigured` status from the linked `channel_connections` table's `webhook_status` (and self-heal/sync the `platforms` table in the background).
  - Updated Telegram `setWebhook` API (`integrations.js`) and webhook event handlers (`meta.js`, `telegram.js`) to set `webhookConfigured: true` in the database upon successful registration/event reception.
- Implemented canonical Telegram v1 routing with exact `channel_connections` resolution at `POST /webhooks/telegram/v1/:connectionPublicId`.
- Disabled unsafe legacy tokenless `/webhook/telegram` fallback behavior.
- Backfilled and registered live Telegram connections for both workspaces:
  - `SelaluTeh Demo` → `selkoporder_bot` → `tgc_-TSDUlGLRQbDV6H1`.
  - `SelaluKopi Demo` → `Selkoporders_bot` → `tgc_GALPZnnV4XJuwFJj`.
- Verified both bots receive and process live Telegram messages into separate workspace-scoped chats/messages even when the Telegram `chat.id` is the same.
- Added Telegram v1 event worker, outbound service, diagnostics, attachment handling, commerce callbacks, checkout prompt, and connection-safe webhook reconciliation.
- Added migration `030_channel_connections_telegram.sql` and `031_channel_connection_upsert_constraints.sql`.
- Added migration `032_backfill_outlet_locations_from_metadata.sql` and applied it to Supabase. This backfills canonical `outlet_locations` from `outlets.metadata.latitude`, `outlets.metadata.longitude`, and `outlets.metadata.googleMapsLink/googleMapsUrl`.
- Verified `SelaluKopi Demo` now has canonical `outlet_locations` rows for `SELKOP Samarinda` and `SELKOP Tenggarong` with Google Maps links.
- Fixed nearest-outlet reply behavior so `jalan ahmad muksin tenggarong` resolves to `SELKOP Tenggarong` and returns `https://maps.app.goo.gl/NoPBo7ezXJDe3FUd6`.
- Fixed frontend agents/platforms issues:
  - AI Agent create dropdown now uses `p.id || p._id`.
  - Platforms page no longer calls unauthenticated `/api/agents`; it uses the shared authenticated Axios client.

Validation captured:

- Telegram + webhook regression: 42 pass, 0 fail.
- Location + Telegram targeted suite: 541 pass, 0 fail.
- Outlet location targeted suite: 14 pass, 0 fail.

## Pending Tasks (Next Agent)

- Run a fresh live Telegram message to `@Selkoporders_bot` with `jalan ahmad muksin tenggarong` after this documentation sync to confirm the newly patched deterministic reply is what the user sees in Telegram.
- If deploying beyond local dev, ensure the public runtime has the latest code and migration `032_backfill_outlet_locations_from_metadata` applied.
- Add a reusable maintenance command if future outlet metadata backfills must be run outside SQL migrations.
