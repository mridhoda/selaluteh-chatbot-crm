# Online QR Store Database Schema Plan

## Purpose

This document reconciles Phase 3 Online Store and QR Store schema goals with the existing Supabase/Postgres runtime. It treats Phase 3 table names as domain concepts unless they already exist physically.

## Runtime Mapping

| Domain concept | Physical table | Phase 3 decision |
|---|---|---|
| Storefront | `storefronts` | New additive table for public slug, name, ordering state, and metadata. |
| Storefront outlet mapping | `storefront_outlets` | New additive table for outlet scope, defaults, and public ordering flags. |
| QR location | `qr_locations` | New additive table for counter/table/area metadata. |
| QR code | `qr_codes` | New additive table for hashed token lookup and revocation/expiry state. |
| QR session | `qr_order_sessions` | Existing physical table retained and extended with nullable QR code/location references. |
| Product availability | `product_outlet_availability` | Existing physical table retained; no duplicate `product_availability` table. |
| Checkout idempotency | `order_idempotency_records` | Existing physical table retained for public checkout idempotency. |
| Payment provider catalog | `payment_providers` | New provider-agnostic catalog seeded with `bayargg`, `xendit`, `doku`, and `manual`. |
| Payment provider settings | `payment_provider_settings` | New normalized table with ciphertext/reference fields only; runtime keeps workspace metadata fallback. |
| Payment webhooks | `payment_webhook_events` | Existing physical table retained; no duplicate provider-event table. |
| Payment status timeline | `payment_status_history` | New additive history table for future UI/audit timelines. |

## Additive Migration

Migration `server/src/db/migrations/038_online_qr_store_schema_phase3.sql` adds:

- `storefronts` and `storefront_outlets` with tenant ownership, active/default indexes, RLS, and service-role policy.
- `qr_locations` and `qr_codes` with hashed token storage, expiry/revocation columns, RLS, and service-role policy.
- Nullable compatibility columns on `qr_order_sessions`: `qr_code_id`, `qr_location_id`, `session_status`, and `completed_order_id`.
- Nullable order context columns on `orders`: `qr_location_id`, `storefront_id`, service/tax amounts, and denormalized `payment_provider`.
- `payment_providers`, `payment_provider_settings`, and `payment_status_history` with RLS and service-role policy.

The migration is non-destructive and does not rename/drop any Phase 1 or Phase 2 runtime table.

## Runtime Strategy

Public storefront resolution now tries `storefronts` first and falls back to the Phase 2 workspace/settings metadata slug conventions when the table is missing or no active storefront exists.

QR context resolution tries `qr_codes` first and falls back to existing `qr_order_sessions` hashed-token lookup. Existing `table_id`, `table_label`, and `location_label` fields remain compatibility fields. In QR-code-only mode, the public compatibility envelope keeps `qr_session.id = null` and carries `qr_session.qr_code_id`, so checkout never writes `qr_codes.id` into `orders.qr_session_id`. Migration `043` extends this model for Universal QR by allowing nullable QR outlet targets and storing selected/locked outlet/location context on `qr_order_sessions`.

Public storefront responses keep the Phase 2 response shape (`storefront.id` remains the workspace/public store identifier). Table-backed storefront IDs are carried as service-internal, non-enumerable context and persisted only in order metadata for now to avoid breaking databases where migration `038` has not been applied.

Payment runtime config can read the active normalized provider code/mode, but credential material remains sourced from existing encrypted workspace settings metadata until a dedicated credential migration is implemented and verified.

## Phase 3.1 Hardening

Migration `server/src/db/migrations/039_online_qr_store_phase31_hardening.sql` is additive on top of migration `038` and adds:

- `qr_locations.sort_order` for stable admin/public location ordering.
- `qr_codes.outlet_locked`, `revoked_reason`, and nullable `created_by` for future QR management flows.
- Query indexes for QR public code/status, token hash/status, QR location sort, QR creator, and QR session status/expiry paths.
- A safe `qr_locations.location_type` compatibility rewrite from legacy `pickup`, `area`, `room`, and `other` values to Phase 3.1 values before applying the check constraint.
- A `qr_order_sessions.session_status` check constraint only when existing data already conforms to `active`, `expired`, `completed`, and `cancelled`.

Runtime domain constants live in `server/src/orders/order-types.js` and intentionally do not create duplicate physical tables for `qr_sessions`, `product_availability`, or `idempotency_keys`.

## Phase 3.2 Detail Schema Reconciliation

`plans/qr-order-backend/phase-3.2.md` is a detailed greenfield schema draft. Runtime implementation keeps existing physical table names and adds only safe detail fields in `server/src/db/migrations/040_online_qr_store_phase32_detail_schema.sql`.

| Phase 3.2 logical table | Runtime decision |
|---|---|
| `brands` | Deferred. Current runtime uses `workspaces`, `outlets`, and `storefronts` metadata; `storefronts.brand_id` is nullable without FK until a brand domain is implemented. |
| `workspace_settings` | Existing `workspace_settings` runtime shape remains the authority, especially encrypted payment credentials in metadata. |
| `qr_locations` | Existing `qr_locations`; `sort_order` added in migration `039`. |
| `qr_codes` | Existing `qr_codes`; outlet lock/revocation/admin fields added in migration `039`. |
| `qr_sessions` | Existing `qr_order_sessions`; no duplicate `qr_sessions` table. |
| `storefronts` | Existing `storefronts`; `theme_json`, `logo_url`, and nullable `brand_id` added in migration `040`. |
| `storefront_outlets` | Existing `storefront_outlets`; `is_visible` added in migration `040`. |
| `storefront_settings` | Deferred; current runtime stores public-store settings in `storefronts.metadata` and workspace/settings metadata fallback. |
| `product_categories`, `products`, modifiers | Existing product runtime remains canonical; no catalog rebuild in Phase 3.2. |
| `product_availability` | Existing `product_outlet_availability`; no duplicate `product_availability` table. |
| `checkout_sessions`, `checkout_items` | Existing `checkouts` and checkout service snapshots remain canonical. Public checkout remains service-driven and idempotent. |
| `idempotency_keys` | Existing `order_idempotency_records`; no duplicate `idempotency_keys` table. |
| `orders`, `order_items`, `order_status_history` | Existing runtime tables; migration `040` adds nullable detail timeline columns to `order_status_history`. |
| `payment_providers` | Existing `payment_providers`; runtime-supported seeds remain `bayargg`, `xendit`, `doku`, `manual`. |
| `payment_provider_settings` | Existing table; migration `040` adds display/expiry/admin metadata while secrets remain ciphertext/configured flags. |
| `payments` | Existing `payments`; migration `040` adds nullable normalized provider-setting and raw-provider detail columns. |
| `payment_status_history` | Existing Phase 3 table; migration `040` adds nullable actor/provider-event references. |
| `payment_webhook_events` | Existing canonical webhook table; migration `040` adds signature/raw-payload/error detail columns. |
| `admin_users`, roles, permissions | Existing `users`, `memberships`, `user_outlet_access`, and permission middleware; no duplicate admin auth tables. |
| `audit_logs` | Existing runtime table/repository remains canonical; no incompatible rebuild in Phase 3.2. |
| `security_events` | Added as optional service-role-only table in migration `040` for QR/payment protection events. |

Migration `040` intentionally avoids changing money storage semantics. Existing runtime currently uses numeric/integer-compatible amount fields depending on legacy table origin; money conversion to a single integer-minor-unit standard remains a future cutover task because it would require coordinated data migration and API compatibility work.

## Phase 3.3 Integrity Reconciliation

`plans/qr-order-backend/phase-3.3.md` defines the target index, constraint, and integrity rules for alpha readiness. Runtime implementation in `server/src/db/migrations/041_online_qr_store_phase33_integrity.sql` applies those rules to existing physical tables.

| Phase 3.3 logical target | Runtime implementation |
|---|---|
| `qr_sessions` indexes | Applied to `qr_order_sessions` (`qr_order_sessions_qr_code_created_idx`, status/expiry from migration `039`). |
| `product_availability` indexes | Applied to `product_outlet_availability`. |
| `idempotency_keys` unique key | Applied to `order_idempotency_records` for `command_type = 'public_checkout'`. |
| `payments.provider_id/provider_reference` uniqueness | Applied to existing provider columns: `(provider, provider_transaction_id)` and `(provider, merchant_reference)` partial unique indexes. |
| one active provider per workspace/mode | `payment_provider_settings_one_active_per_mode_idx`; existing stricter one-active-per-workspace index remains compatible. |
| webhook idempotency | Existing webhook uniqueness remains, plus payload hash and processing indexes where `payment_webhook_events` exists. |
| admin/permission indexes | Existing user/membership/outlet-access runtime remains authority; no greenfield admin tables added. |
| auditability | Adds guarded `audit_logs` indexes only when the table exists. |
| order/payment check constraints | Adds `NOT VALID` constraints so new writes are protected without requiring an immediate legacy data cleanup. |

Integrity rules that remain service-layer authority:

- `payment_status = paid` can only be produced by backend/provider webhook/reconciliation paths.
- Fulfillment transitions to accepted/preparing/ready/completed require paid payment status.
- Public checkout totals are recomputed by backend and client totals are ignored.
- QR store checkout must use the locked outlet from QR context.
- Public order tokens and QR tokens must be random, unguessable, and never derived from order numbers or sequential QR labels.

## Target Reconciliation and Seed/Application Strategy

The alpha Supabase target had drift from the local greenfield migration sequence. Do not blindly replay local migrations `038` through `041` against that target. The target-aware reconciliation migration `042_online_qr_store_target_reconciliation.sql` was applied and verified through Supabase MCP, `043`/`universal_qr_scope` was verified present, and `044_public_checkout_idempotency_state.sql` was applied and verified.

Apply migrations `038` and `039` before relying on table-backed Online Store or QR Store behavior in a target Supabase project. Seed/application should be idempotent and environment-specific:

- Verify `payment_providers` contains `bayargg`, `xendit`, `doku`, and `manual`; do not insert unsupported providers as active runtime integrations.
- Insert one active `storefronts` row per public slug and map orderable outlets through `storefront_outlets`, with exactly one default active outlet per storefront.
- Insert `qr_locations` using Phase 3.1 location types (`table`, `counter`, `pickup_area`, `takeaway_area`, `general_store`).
- Insert outlet/location/table `qr_codes` with generated `public_code`, hashed `qr_token_hash`, `outlet_locked = true`, and no raw token storage.
- Insert Universal QR rows only after Universal QR schema support is present: `scope='universal'`, `qr_type='universal'`, null outlet/location targets, random public code, hashed token, and `outlet_locked=false`.
- Keep payment credentials in encrypted `workspace_settings.metadata.app_settings` until a dedicated credential migration is implemented.
- Do not print or commit real QR tokens, BayarGG credentials, or plaintext provider secrets.

## Security

Tenant-owned tables include `workspace_id`, supporting indexes, RLS enabled, and service-role policies matching existing server-side repository usage.

Provider secret fields use `*_ciphertext` names and are not exposed by repository reads. The new normalized settings table is not used to store plaintext secrets.

Public APIs continue to omit workspace IDs, raw payment provider payloads, and secret values.

## Rollback

The Phase 3 tables are additive. If incomplete data or production issues are found, the runtime can continue through the existing metadata and `qr_order_sessions` fallbacks without dropping the new tables.
