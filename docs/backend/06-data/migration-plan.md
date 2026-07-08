# Supabase Cutover Plan

## Final Decision

The backend runtime target and final end-state is Supabase/Postgres.

```txt
Full Supabase end-state
Staged domain-by-domain cutover
Start fresh from Supabase
No Mongo backfill
No dual-write
No legacy data reconciliation
Custom backend auth remains
Supabase Auth deferred
```

All migration phases (Phase 0 through Phase 11) have been fully executed and verified. MongoDB/Mongoose has been completely removed from the project.

## Online/QR Store Phase 3 Additive Schema

Migration `038_online_qr_store_schema_phase3.sql` adds storefront, QR location/code, and provider-agnostic payment configuration tables on top of the existing Supabase runtime.

Migrations `039_online_qr_store_phase31_hardening.sql` and `040_online_qr_store_phase32_detail_schema.sql` harden Phase 3.1/3.2 fields additively. They intentionally reconcile the greenfield plan to existing runtime tables instead of creating duplicate physical authority.

Migration `041_online_qr_store_phase33_integrity.sql` adds Phase 3.3 indexes, partial unique indexes, and `NOT VALID` check constraints. It keeps integrity rollout additive and avoids blocking deployment on legacy data that may need later cleanup. The latest hardening also replaces legacy one-active-provider-per-workspace uniqueness with one-active-provider-per-workspace/mode, adds workspace/provider/mode uniqueness, and adds runtime `payment_events` indexes for provider-event and raw-payload idempotency checks.

Rules:

- Keep `qr_order_sessions`, `product_outlet_availability`, and `order_idempotency_records` as existing physical runtime tables.
- Do not rename, drop, or replace existing commerce/payment tables.
- Use `storefronts` and `storefront_outlets` first when seeded; fallback to workspace/settings metadata remains supported.
- Use `qr_codes` first when seeded; fallback to existing `qr_order_sessions.qr_token_hash` remains supported.
- Keep provider credentials in existing encrypted workspace settings until normalized credential migration is explicitly implemented and verified.
- Keep Phase 3.2 greenfield tables deferred where existing runtime concepts already exist: `qr_order_sessions`, `product_outlet_availability`, `checkouts`, `order_idempotency_records`, existing payment tables, and existing auth/permission tables.
- Treat integer minor-unit money conversion as a future coordinated migration, not an implicit additive column tweak.
- Keep Phase 3.3 check constraints `NOT VALID` until production data is audited and any legacy invalid rows are remediated.
- Keep `manual_review` as the alpha-safe status for payment amount/currency/expiry mismatches; do not transition those orders to paid automatically.
- Rollback is operational: leave additive tables unused and rely on existing fallbacks.

## Phase 0 — Supabase Foundation

- Add/verify Supabase client setup.
- Validate `DATA_SOURCE=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_DATABASE_URL`.
- Keep service role key and database URL backend-only.
- Apply SQL migrations.
- Add camelCase/snake_case mapping conventions.
- Add repository conventions.
- Add error mapping conventions.
- Add transaction conventions.
- Add workspace/outlet scoping conventions.
- Add Supabase local or dedicated Supabase test project setup.

## Phase 1 — Workspaces / Users / Memberships

- Move custom auth persistence to Supabase.
- Preserve password hashing, JWT/session behavior, OTP, reset, and authorization flow.
- Add repository, integration, and security/isolation tests.

## Phase 2 — Outlets / User Outlet Access

- Move outlet and outlet access persistence to Supabase.
- Enforce workspace and outlet scope.
- Add repository, integration, and security/isolation tests.

## Phase 3 — Platforms / Integrations / Webhook Events

- Move platform settings and webhook idempotency to Supabase.
- Keep provider secrets redacted and server-only.
- Add webhook integration and duplicate-event tests.

## Phase 4 — Contacts / Chats / Messages

- Move CRM messaging persistence to Supabase.
- Preserve contact identity, chat state, message ordering, unread state, and human takeover behavior.
- Add inbox/chat integration and isolation tests.

## Phase 5 — Products / Outlet Availability

- Move catalog and outlet availability to Supabase.
- Preserve slug/SKU uniqueness and outlet availability rules.
- Add product integration and outlet-isolation tests.

## Phase 6 — Carts / Checkout Sessions

- Move carts, cart items, checkouts, and checkout items to Supabase.
- Use transaction conventions for checkout mutations.
- Add idempotency and total consistency tests.

## Phase 7 — Orders / Order Items

- Move order creation, item snapshots, lifecycle updates, and order events to Supabase.
- Keep lifecycle status separate from payment status and fulfillment status.
- Add order workflow and isolation tests.

## Phase 8 — Payments / Payment Events

- Move payments, payment events, provider identifiers, and reconciliation state to Supabase.
- Use provider webhook as payment authority.
- Add signature, duplicate event, and transaction tests.

## Phase 9 — Complaints / Files / Settings

- Move complaints, file metadata, and workspace settings to Supabase.
- Keep binary files in local storage.
- Keep secrets redacted.
- Add upload/settings/complaint security tests.

## Phase 10 — Agents / AI Actions / Knowledge

- Move agents, agent outlet mapping, knowledge metadata, and AI action logs to Supabase.
- Preserve AI guardrails.
- Add AI integration and isolation tests.

## Phase 11 — Remove MongoDB and Mongoose

- Remove Mongo connection/bootstrap code.
- Remove Mongoose models.
- Remove Mongoose dependency.
- Remove MongoMemoryServer and Mongo-specific test setup.
- Remove `DATA_SOURCE=mongo` fallback.
- Remove obsolete Mongo environment variables.
- Run full regression/security tests.
- Update all affected documentation and regenerate generated bundles.
