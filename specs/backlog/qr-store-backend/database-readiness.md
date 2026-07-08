# QR Store Backend Database Readiness

Updated: 2026-07-07

Scope: Phase 4 section 2 database readiness plus follow-up database hardening verification. This document records Supabase MCP target confirmation, migration `042` application, migration `043`/`universal_qr_scope` verification, migration `044`/`public_checkout_idempotency_state` application, real SELKOP storefront/QR seed evidence, BayarGG provider-setting validation, post-seed uniqueness checks, advisor review, and remaining blockers.

## 044 Public Checkout Idempotency State Follow-up

Status: Complete on target Supabase project `marketplace-chatbot-Project` (`hxel...ioff`, redacted). Section 8 work was not run in this task.

Supabase MCP target re-confirmation:

| Field | Result |
|---|---|
| Target project | `marketplace-chatbot-Project` |
| Project ref | `hxel...ioff` redacted |
| Region | `ap-southeast-1` |
| Status | `ACTIVE_HEALTHY` |
| Database engine | Postgres 17 |

Local migration reviewed before apply: `server/src/db/migrations/044_public_checkout_idempotency_state.sql`.

Safety review result: migration is additive/guarded/idempotent for the target. It uses `alter table if exists`, `add column if not exists`, guarded `DO` blocks, `create index if not exists`, and a `NOT VALID` check constraint. It has no `drop`, `delete`, `truncate`, or table replacement statements. The only data mutation is a narrow status backfill for existing `public_checkout` idempotency rows where `status is null`; with the newly added `status text not null default 'completed'` column, existing rows receive the default during column add, so no unrelated data was touched.

Supabase MCP apply result:

| Field | Result |
|---|---|
| Migration name | `public_checkout_idempotency_state` |
| Source file | `server/src/db/migrations/044_public_checkout_idempotency_state.sql` |
| Ledger version | `20260707075151` |
| Result | `success: true` |

Post-apply MCP verification:

| Check | Result |
|---|---|
| Migration ledger | `public_checkout_idempotency_state` exists with version `20260707075151`. |
| `status` column | Exists on `public.order_idempotency_records` as `text`, `NOT NULL`, default `'completed'::text`. |
| `error_snapshot` column | Exists on `public.order_idempotency_records` as nullable `jsonb`. |
| Status check constraint | `order_idempotency_records_status_check` exists with allowed statuses `processing`, `completed`, and `failed`; `convalidated=false` because it was added `NOT VALID`. |
| Public checkout status index | `order_idempotency_records_public_checkout_status_idx` exists on `(workspace_id, idempotency_key, status)` where `command_type = 'public_checkout'`. |
| Existing uniqueness preserved | `order_idempotency_records_public_checkout_unique_idx` remains a unique index on `(workspace_id, idempotency_key)` where `command_type = 'public_checkout'`. |

No blockers were encountered for migration `044` apply/verification.

## 2.2-2.6 Status

Status: Ready with approved BayarGG credential/live-readiness deferral. Supabase MCP made deterministic seed changes for the requested SELKOP workspace/outlets, verified migration `universal_qr_scope`, seeded a true Universal QR row, enabled SELKOP storefront ordering/pickup readiness, seeded product outlet availability for active products at both outlets, and verified post-seed constraints. The database is ready for Phase 4 P0 non-credential work, but real BayarGG paid-alpha/live payment readiness is not claimed because no real BayarGG `payment_provider_settings` row/credential reference exists.

Approved deferral decision: User explicitly selected **Defer BayarGG** on 2026-07-07. Do not create fake BayarGG credentials or synthetic active provider settings. Task `2.4` remains incomplete and blocked by authorized real credentials, while checkpoint `2.6` is accepted as complete with documented deferral so Phase 4 can proceed with P0 non-credential work.

Remaining manual action: an authorized operator must configure a real SELKOP BayarGG provider settings row using encrypted credentials or an approved secret reference, activate the correct workspace/mode when intended, run live or provider-supplied webhook/session verification, and update task `2.4` before claiming real paid-alpha/live payment readiness.

Target data identified without printing secrets:

| Item | Result |
|---|---|
| Target project | `marketplace-chatbot-Project` (`hxel...ioff`, redacted) |
| SELKOP workspace | `SelaluKopi Demo`, active, id suffix `...393c6` |
| SELKOP outlets | `SELKOP Samarinda` / `SLKP-SMD-01` / `selkop-samarinda`; `SELKOP Tenggarong` / `SLKP-TGR-01` / `selkop-tenggarong` |
| Source outlet orderability | Updated only the requested SELKOP workspace/outlet IDs: both outlets are now `status=active`, `operational_status=OPEN`, `accepts_orders=true`, and `pickup_enabled=true`. |
| Existing storefront rows before seed | `0` |

### 2.2 Storefront Seed Result

Supabase MCP upserted one active SELKOP storefront and two storefront outlet mappings:

| Seeded object | Result |
|---|---|
| `storefronts` | `1` row for slug `selkop`, name `SELKOP Online Store`, brandline `Born Local For Everyone`, status `active`, ordering enabled. |
| `storefront_outlets` | `2` rows mapped to `SELKOP Samarinda` and `SELKOP Tenggarong`. |
| Visibility | Both mappings are `is_visible=true`, `status=active`. |
| Ordering | Storefront and mappings are `ordering_enabled=true`; both target outlets are pickup order-ready. |
| Metadata fallback | Preserved; runtime fallback was not removed. |

Latest Supabase MCP update enabled the storefront and mappings for pickup ordering and seeded product availability for active products:

| Verification | Result |
|---|---|
| `SELKOP Samarinda` | `status=active`, `operational_status=OPEN`, `accepts_orders=true`, `pickup_enabled=true`, storefront/mapping ordering enabled, `1` active product, `1` active available product-outlet row. |
| `SELKOP Tenggarong` | `status=active`, `operational_status=OPEN`, `accepts_orders=true`, `pickup_enabled=true`, storefront/mapping ordering enabled, `1` active product, `1` active available product-outlet row. |

Task `2.2` is complete for the requested workspace/outlet IDs.

### 2.3 QR Seed Result

Supabase MCP upserted schema-compatible QR data derived from the two SELKOP outlets:

| Seeded object | Result |
|---|---|
| `qr_locations` | `4` active rows: `Pickup Counter` (`PICKUP`) and `Table 01` (`T01`) for each SELKOP outlet. |
| Outlet QR | `2` active QR code rows, one per SELKOP outlet. |
| Location/table QR | `4` active QR code rows, one pickup-location QR and one table-location QR per SELKOP outlet. |
| Public code evidence | Only last 8 characters captured: `f3b8ee4d`, `ff573071`, `fa580941`, `4125a574`, `5dcc7444`, `38339c7a`. Full public codes and token hashes are intentionally not printed. |
| Token storage | `qr_token_hash` values generated with SHA-256 digest of random UUID material; raw QR tokens were not stored or documented. |
| Runtime compatibility | Seeded QR rows use `outlet_locked=true`, which is compatible with the applied `042` target schema and previous runtime lookup. |

Universal QR is now verified on the Supabase target. Supabase MCP confirmed migration `universal_qr_scope` is already in the migration ledger and verified: `qr_codes.outlet_id` is nullable, `qr_codes.scope` and `qr_codes.qr_type` exist, expected scope/type/target consistency checks exist, `qr_codes_workspace_scope_status_idx` and `qr_codes_workspace_qr_type_status_idx` exist, `qr_order_sessions.outlet_id` is nullable, and `selected_outlet_id`, `locked_outlet_id`, `locked_location_id`, and `customer_context` exist.

Universal QR seed result: `1` active SELKOP row with `scope='universal'`, `qr_type='universal'`, `outlet_id=null`, `qr_location_id=null`, `outlet_locked=false`, public code `uqr_7d8dd103549e8cae38dacdce6da68820e0b7`, and token hash last8 `e6b5d9bf`. Plaintext QR token was not printed or stored.

### 2.4 BayarGG Provider Settings Validation

Supabase MCP validation result:

| Check | Result |
|---|---|
| BayarGG provider catalog | Present: `payment_providers.code='bayargg'`, `is_enabled=true`, `supports_qris=true`. |
| Provider settings rows | `0` BayarGG `payment_provider_settings` rows exist for the SELKOP workspace. |
| Active provider settings rows | `0` active BayarGG settings rows exist for the SELKOP workspace. |
| Credential references | `0` rows with encrypted credential or credential fingerprint/reference. |
| Duplicate active provider per workspace/mode | `0` duplicate active groups. |
| Secure credential columns | Table has encrypted/ciphertext credential columns such as `server_key_encrypted`, `webhook_secret_encrypted`, `secret_key_ciphertext`, and `webhook_secret_ciphertext`. |
| Plaintext secret columns | No forbidden plaintext columns named `secret_key`, `server_key`, `webhook_secret`, `api_key`, or `private_key`. |

Precise blocker for completing task `2.4`: no real BayarGG settings row or credential reference exists to validate. No fake credentials were created and none should be created. A real encrypted/referenced BayarGG settings row must be configured by an authorized operator before live payment readiness can be claimed. This blocker is an approved deferral for Phase 4 P0 non-credential work only; it is not a completion claim for BayarGG readiness.

### 2.5 Post-Seed Index And Constraint Validation

Supabase MCP post-seed verification passed:

| Area | Index/constraint evidence | Duplicate groups |
|---|---|---:|
| Public order token | Unique index `orders_public_order_token_unique_idx` exists. | `0` |
| Order number | Unique index `orders_workspace_order_number_unique_idx` exists. | `0` |
| Payment provider references | Unique indexes `payments_provider_ref_unique_idx`, `payments_provider_transaction_unique_idx`, and `payments_merchant_reference_provider_unique_idx` exist. | `0` |
| Payment event provider-event | Unique index `payment_events_provider_event_unique_idx` exists. | `0` |
| Public checkout idempotency | Unique index `order_idempotency_records_public_checkout_unique_idx` exists for `command_type='public_checkout'`. | `0` |
| QR code/location uniqueness | Unique indexes `qr_codes_public_code_key`, `qr_codes_token_hash_key`, and `qr_locations_outlet_code_key` exist. | `0` |

Post-seed counts for the SELKOP workspace: `1` storefront, `2` storefront outlet mappings, `4` seeded QR locations, `6` existing outlet/location/table QR codes, and `1` active Universal QR row.

### 2.6 Checkpoint Result

Checkpoint status is complete with approved BayarGG credential/live-readiness deferral. Migration apply/verification results, seed result, rollback notes, and advisor review are documented; tasks `2.2` and `2.3` are complete, while task `2.4` remains incomplete/blocked because no real encrypted credential/reference exists.

Supabase advisors were reviewed through MCP. The security advisor reports broad pre-existing public-table RLS issues and function search-path/security-definer warnings, including public tables such as `orders`, `payments`, `payment_events`, `outlets`, `products`, and others. Newly reconciled Phase 3 tables checked in this wave have RLS enabled with one policy each: `storefronts`, `storefront_outlets`, `qr_locations`, `qr_codes`, `payment_providers`, `payment_provider_settings`, `payment_status_history`, and `security_events`. Performance advisor output was reviewed but is too large to inline in this document.

Phase 4 may proceed to section 3 and other P0 non-credential work under the approved BayarGG deferral. Do not claim BayarGG live readiness, real paid-alpha payment readiness, or production payment readiness until task `2.4` is resolved with real credentials and provider/live verification.

## 2.1 Status

Status: Complete. Re-confirmed target project `marketplace-chatbot-Project` (`hxel...ioff`, redacted), applied reconciliation migration `online_qr_store_target_reconciliation` through Supabase MCP, and verified required objects/indexes/constraints. Do not start task `2.2` in this wave.

Direct application of local migrations `038` through `041` remains unsafe for this target because the target had a drifted `payment_provider_settings` table using `provider` instead of local migration `provider_code`, later `qr_order_alpha_*` migration records, missing Phase 3 storefront/QR tables, and old `(workspace_id, provider)` uniqueness. Applying `041_online_qr_store_phase33_integrity.sql` as written would reference `provider_code` on a target table that does not have that column. The target-aware additive migration `042_online_qr_store_target_reconciliation.sql` was used instead and applied successfully through Supabase MCP.

## Apply Result

Supabase MCP `apply_migration` result:

| Field | Result |
|---|---|
| Target project | `marketplace-chatbot-Project` |
| Project ref | `hxel...ioff` redacted |
| Migration name | `online_qr_store_target_reconciliation` |
| Source file | `server/src/db/migrations/042_online_qr_store_target_reconciliation.sql` |
| Result | `success: true` |

Migration content review before apply confirmed that `042` is additive/guarded for this target: it uses `create table if not exists`, `add column if not exists`, guarded `DO` blocks, seed upserts, RLS/policy creation only when absent, and guarded `NOT VALID` constraints. It has no data drops and no table drops. The only destructive statements are targeted removals of old named uniqueness objects on `payment_provider_settings(provider)` that conflict with per-mode provider settings: `payment_provider_settings_unique`, `payment_provider_settings_workspace_provider_key` if present, `payment_provider_settings_one_active_idx` if present, and `uq_payment_provider_settings_workspace_provider` if present.

## Post-Apply MCP Verification

Post-apply SQL verification passed:

| Check | Result |
|---|---|
| Required tables | `storefronts`, `storefront_outlets`, `qr_locations`, `qr_codes`, `payment_providers`, `payment_status_history`, and `security_events` all exist. |
| UUID support | `gen_random_uuid()` exists and returned a UUID sample successfully. |
| Old uniqueness objects | `payment_provider_settings_unique` and `uq_payment_provider_settings_workspace_provider` are absent as both constraints and indexes. |
| Active per-mode uniqueness | `payment_provider_settings_one_active_per_mode_idx` exists, is unique, uses columns `{workspace_id,mode}`, and has predicate `(is_active = true)`. |
| Provider/mode uniqueness | `payment_provider_settings_workspace_provider_mode_unique_idx` exists, is unique, and uses columns `{workspace_id,provider,mode}`. |
| Expected `041` constraints | All expected `NOT VALID` constraints exist with `convalidated = false`: `orders_payment_status_check`, `orders_fulfillment_status_check`, `orders_fulfillment_type_check`, `orders_channel_check`, `orders_amounts_non_negative_check`, `payments_status_check`, `payments_amount_non_negative_check`, and `order_items_quantity_positive_check`. |
| Forbidden duplicate tables | `qr_sessions`, `product_availability`, `checkout_sessions`, `idempotency_keys`, and `admin_users` do not exist. |

No target schema-compatible `041` constraint was missing after reconciliation.

## Target Identified

Supabase MCP `list_projects` returned one accessible active project:

| Field | Value |
|---|---|
| Name | `marketplace-chatbot-Project` |
| Project ref | `hxel...ioff` redacted |
| Region | `ap-southeast-1` |
| Status | `ACTIVE_HEALTHY` |
| Database engine | Postgres 17 |

Repository references also point to the same project ref. Secrets were not printed.

## Read-Only Supabase MCP Checks Run

### Migration Ledger

The target has `supabase_migrations.schema_migrations` with columns `version`, `statements`, `name`, `created_by`, `idempotency_key`, and `rollback`.

Read-only query for exact migration names returned no rows for:

- `038_online_qr_store_schema_phase3`
- `039_online_qr_store_phase31_hardening`
- `040_online_qr_store_phase32_detail_schema`
- `041_online_qr_store_phase33_integrity`

Recent target migration names include later timestamped records such as:

- `20260707024046` / `qr_order_alpha_schema_sync_v2`
- `20260707024140` / `qr_order_alpha_order_fulfillment_type`
- `20260707024221` / `qr_order_alpha_status_enum_sync`

Interpretation: local files `038` through `041` are not tracked as applied on the target, but the target has later schema-sync migrations that partially overlap and drift from the local files.

### Required Extension / Function

Read-only SQL confirmed:

| Check | Result |
|---|---|
| `pgcrypto` | Installed, version `1.3` |
| `uuid-ossp` | Installed, version `1.1` |
| `gen_random_uuid()` | Resolved as `gen_random_uuid()` |

Interpretation: the UUID-generation prerequisite for migrations using `gen_random_uuid()` is satisfied.

### Object Presence

Read-only `to_regclass` checks showed these target objects are absent:

- `public.storefronts`
- `public.storefront_outlets`
- `public.qr_locations`
- `public.qr_codes`
- `public.payment_providers`
- `public.payment_status_history`
- `public.security_events`

Read-only checks showed these relevant runtime objects already exist:

- `public.payment_provider_settings`
- `public.order_idempotency_records`
- `public.product_outlet_availability`
- `public.payment_events`
- `public.payment_webhook_events`
- `public.audit_logs`

Interpretation: base Phase 3 tables from `038`/`040` are not present, but several existing runtime tables overlap with later migrations and have a different shape than the local SQL assumes.

### Provider-Setting Schema Drift

Target `payment_provider_settings` columns include:

- `provider` as a user-defined enum, not `provider_code`
- `environment`
- `mode`
- `is_active`
- encrypted secret columns such as `server_key_encrypted`, `webhook_secret_encrypted`, `secret_key_ciphertext`, and `webhook_secret_ciphertext`
- `display_name`
- `payment_expiry_minutes`

Target `payment_provider_settings` columns do not include:

- `provider_code`
- `created_by`
- `updated_by`

Target uniqueness/index state includes:

- Present: `payment_provider_settings_one_active_per_mode_idx` on `(workspace_id, mode)` where `is_active = true`
- Present: `payment_provider_settings_workspace_provider_mode_unique_idx` on `(workspace_id, provider, mode)`
- Present and conflicting with per-mode model: `payment_provider_settings_unique` constraint/index on `(workspace_id, provider)`
- Present and conflicting with per-mode model: `uq_payment_provider_settings_workspace_provider` index on `(workspace_id, provider)`
- Absent: local-migration old name `payment_provider_settings_one_active_idx`
- Absent: local-migration old constraint name `payment_provider_settings_workspace_provider_key`

Read-only duplicate checks returned:

| Check | Result |
|---|---|
| Duplicate `(workspace_id, provider, mode)` groups | `0` |
| Duplicate active `(workspace_id, mode)` groups | `0` |
| Current settings rows inspected | `0` rows |

Interpretation: there is no current row-level conflict, but the old `(workspace_id, provider)` uniqueness still conflicts structurally with the intended per-mode uniqueness because it prevents multiple modes per workspace/provider.

### `041` NOT VALID Constraints

Read-only `pg_constraint` checks returned no rows for these expected `041` constraints:

- `orders_payment_status_check`
- `orders_fulfillment_status_check`
- `orders_fulfillment_type_check`
- `orders_channel_check`
- `orders_amounts_non_negative_check`
- `payments_status_check`
- `payments_amount_non_negative_check`
- `order_items_quantity_positive_check`

Interpretation: `NOT VALID` constraint acceptance cannot be marked complete because the constraints are absent on the target.

### Expected Index Presence

Read-only index checks showed only a subset of `040`/`041` provider-setting indexes are present. Most expected `038` through `041` storefront, QR, order, payment, webhook, idempotency, audit, and security-event indexes are absent, including the order/payment `NOT VALID` hardening-related follow-up indexes.

Notable present expected indexes:

- `payment_provider_settings_active_mode_idx`
- `payment_provider_settings_one_active_per_mode_idx`
- `payment_provider_settings_workspace_provider_mode_unique_idx` on `(workspace_id, provider, mode)` rather than local `(workspace_id, provider_code, mode)`

Interpretation: target has partial later provider-setting hardening, but not the full local `038` through `041` object/index set.

## Apply Decision

Migrations `038` through `041` were not applied directly. Migration `042` was applied through Supabase MCP after the target project was re-confirmed.

Reason: project target is unambiguous, but the local migration files and target schema are not safe to reconcile with a blind apply. The target has drifted provider-setting names (`provider` versus `provider_code`) and existing uniqueness/indexes created by later timestamped migrations. Applying local `041` as-is would fail or require modifying existing uniqueness on a live target without the target-aware guards in `042`.

Decision: `server/src/db/migrations/042_online_qr_store_target_reconciliation.sql` was applied through Supabase MCP `apply_migration` with name `online_qr_store_target_reconciliation`. Do not use the local `038` through `041` files as a blind apply script against this target.

## Reconciliation Migration Prepared

Prepared file: `server/src/db/migrations/042_online_qr_store_target_reconciliation.sql`.

The migration is target-aware and intentionally differs from a blind replay of `038` through `041`:

- Creates absent Phase 3 tables: `storefronts`, `storefront_outlets`, `qr_locations`, `qr_codes`, `payment_providers`, `payment_status_history`, and `security_events`.
- Adds compatible Phase 3 columns/indexes to existing runtime tables with `IF NOT EXISTS` or guarded `DO` blocks.
- Uses `payment_provider_settings.provider` for runtime provider settings and never references `provider_code`.
- Preserves encrypted/ciphertext credential fields and does not create plaintext `secret_key` or `webhook_secret` columns.
- Drops only the old named uniqueness objects that structurally block per-mode provider settings: `payment_provider_settings_unique` and `uq_payment_provider_settings_workspace_provider`, plus legacy local names if present. No rows are deleted or updated.
- Ensures per-mode provider-setting uniqueness on `(workspace_id, mode)` for active settings and `(workspace_id, provider, mode)` for provider/mode rows.
- Adds guarded `NOT VALID` constraints from `041` where compatible with the target runtime tables.
- Avoids duplicate greenfield runtime tables: `qr_sessions`, `product_availability`, `checkout_sessions`, `idempotency_keys`, and `admin_users`.

## Files Inspected

| File | Local readiness evidence |
|---|---|
| `server/src/db/migrations/038_online_qr_store_schema_phase3.sql` | Creates base `storefronts`, `storefront_outlets`, `qr_locations`, `qr_codes`, `payment_providers`, `payment_provider_settings`, and `payment_status_history`; extends `qr_order_sessions` and `orders`; seeds provider rows; enables RLS and service-role policies. |
| `server/src/db/migrations/039_online_qr_store_phase31_hardening.sql` | Depends on `038` QR tables/columns; adds QR hardening columns/indexes; rewrites legacy `qr_locations.location_type` values before tightening the check constraint; conditionally tightens `qr_order_sessions.session_status`. |
| `server/src/db/migrations/040_online_qr_store_phase32_detail_schema.sql` | Depends on `038` provider/history tables and existing payment/order history tables; adds detail columns, `security_events`, RLS, and supporting indexes. |
| `server/src/db/migrations/041_online_qr_store_phase33_integrity.sql` | Depends on prior migrations and existing runtime tables; adds indexes, provider-setting per-mode uniqueness, runtime payment-event indexes, and guarded `NOT VALID` check constraints. |

## Expected Apply Order

1. `server/src/db/migrations/038_online_qr_store_schema_phase3.sql`
2. `server/src/db/migrations/039_online_qr_store_phase31_hardening.sql`
3. `server/src/db/migrations/040_online_qr_store_phase32_detail_schema.sql`
4. `server/src/db/migrations/041_online_qr_store_phase33_integrity.sql`

Rationale: `039` mutates QR tables created by `038`; `040` extends provider/history tables created by `038`; `041` assumes the combined schema and replaces provider-setting uniqueness from `038` with the per-mode rules.

## Required Environment Inputs

An operator needs all of the following before task `2.1` can be completed:

- Target Supabase project reference / project id.
- Supabase CLI authenticated session or equivalent CI credentials.
- Database URL or linked Supabase project with migration privileges.
- Approval that the target is the intended environment for Phase 4 readiness validation.
- Access to run read-only SQL checks after apply.
- Decision on backup/snapshot point before applying to production-like data.

## Required Extensions / Prerequisites To Check

Local migrations `038` and `040` use `gen_random_uuid()`. The migration files inspected here do not create extensions themselves, so the target database must already expose `gen_random_uuid()` through the available Postgres/Supabase extension setup, typically `pgcrypto` on PostgreSQL environments.

Operator check:

```sql
select extname, extversion
from pg_extension
where extname in ('pgcrypto', 'uuid-ossp');

select gen_random_uuid();
```

Do not mark the required-extension checklist complete until the target database returns successful output.

## NOT VALID Constraint Readiness

Migration `041` adds these `NOT VALID` constraints:

- `orders_payment_status_check`
- `orders_fulfillment_status_check`
- `orders_fulfillment_type_check`
- `orders_channel_check`
- `orders_amounts_non_negative_check`
- `payments_status_check`
- `payments_amount_non_negative_check`
- `order_items_quantity_positive_check`

Expected behavior: adding `NOT VALID` check constraints should avoid scanning/rejecting existing rows at creation time, but new/updated rows are still constrained. Later validation requires a separate production data audit/remediation step and explicit `VALIDATE CONSTRAINT` commands.

Operator post-apply check:

```sql
select conname, convalidated
from pg_constraint
where conname in (
  'orders_payment_status_check',
  'orders_fulfillment_status_check',
  'orders_fulfillment_type_check',
  'orders_channel_check',
  'orders_amounts_non_negative_check',
  'payments_status_check',
  'payments_amount_non_negative_check',
  'order_items_quantity_positive_check'
)
order by conname;
```

Expected readiness interpretation: each listed constraint exists, and `convalidated` is expected to be `false` immediately after this migration because the constraints are intentionally `NOT VALID`.

## Provider-Setting Uniqueness Conflict Readiness

Migration `038` creates:

- Constraint `payment_provider_settings_workspace_provider_key` on `(workspace_id, provider_code)`.
- Unique partial index `payment_provider_settings_one_active_idx` on `(workspace_id)` where `is_active = true`.

Migration `041` changes the provider-setting model to support per-mode provider settings locally:

- Creates `payment_provider_settings_one_active_per_mode_idx` on `(workspace_id, mode)` where `is_active = true`.
- Drops `payment_provider_settings_one_active_idx`.
- Drops constraint `payment_provider_settings_workspace_provider_key` if present.
- Creates `payment_provider_settings_workspace_provider_mode_unique_idx` on `(workspace_id, provider_code, mode)`.

Target reconciliation migration `042` applies that intent to the actual target column name, `provider`, and removes only old named `(workspace_id, provider)` uniqueness objects that block multiple modes.

Conflict to check before/after apply: any existing duplicate `(workspace_id, provider, mode)` rows will block the new unique index in `042`; any legacy active-provider rows must satisfy one active provider per `(workspace_id, mode)`.

Operator preflight SQL:

```sql
select workspace_id, provider, mode, count(*) as row_count
from payment_provider_settings
group by workspace_id, provider, mode
having count(*) > 1;

select workspace_id, mode, count(*) as active_count
from payment_provider_settings
where is_active = true
group by workspace_id, mode
having count(*) > 1;
```

Operator post-apply SQL:

```sql
select indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename = 'payment_provider_settings'
  and indexname in (
    'payment_provider_settings_one_active_idx',
    'payment_provider_settings_one_active_per_mode_idx',
    'payment_provider_settings_workspace_provider_mode_unique_idx',
    'payment_provider_settings_unique',
    'uq_payment_provider_settings_workspace_provider'
  )
order by indexname;

select conname
from pg_constraint
where conname in (
  'payment_provider_settings_workspace_provider_key',
  'payment_provider_settings_unique'
);
```

Expected readiness interpretation after successful `042`: old one-active-per-workspace index is absent, old `(workspace_id, provider)` uniqueness objects are absent, and the per-mode unique indexes exist using `provider`.

## Manual Migration Commands

Run from the repository root after confirming the intended target environment. These commands are provided as an operator runbook only; this session did not execute them and does not claim their output.

```bash
supabase status
supabase link --project-ref <target-project-ref>
supabase migration list
supabase db push --include-all
supabase migration list
```

Do not push `038` through `041` blindly to the drifted target. For this target, use the reconciliation migration once approved:

```bash
psql "$SUPABASE_DATABASE_URL" -v ON_ERROR_STOP=1 -f server/src/db/migrations/042_online_qr_store_target_reconciliation.sql
```

Preferred MCP path: use Supabase MCP `apply_migration` with name `online_qr_store_target_reconciliation` and the contents of `042_online_qr_store_target_reconciliation.sql` after operator confirmation of the target project.

## Post-Apply Checks

```sql
select to_regclass('public.storefronts') as storefronts,
       to_regclass('public.storefront_outlets') as storefront_outlets,
       to_regclass('public.qr_locations') as qr_locations,
       to_regclass('public.qr_codes') as qr_codes,
       to_regclass('public.payment_providers') as payment_providers,
       to_regclass('public.payment_provider_settings') as payment_provider_settings,
       to_regclass('public.payment_status_history') as payment_status_history,
       to_regclass('public.security_events') as security_events;

select code, is_enabled, supports_qris
from payment_providers
where code in ('bayargg', 'xendit', 'doku', 'manual')
order by code;

select tablename, policyname
from pg_policies
where schemaname = 'public'
  and tablename in (
    'storefronts',
    'storefront_outlets',
    'qr_locations',
    'qr_codes',
    'payment_providers',
    'payment_provider_settings',
    'payment_status_history',
    'security_events'
  )
order by tablename, policyname;
```

## Rollback Notes

The inspected migrations are intended to be additive but not automatically reversible. Rollback should be treated as an operational database change, not a blind command.

- Prefer restoring from a pre-apply snapshot for production-like targets if migration application fails midway.
- If only `041` fails while previous migrations apply, inspect partial index/constraint creation before retrying; do not drop data-bearing tables as a first response.
- Dropping new tables from `038`/`040` would remove Online/QR Store/payment readiness data and should require explicit approval.
- Dropping columns added to existing tables can be destructive if any runtime or seed data has already written to them.
- `NOT VALID` constraints can be dropped by constraint name if a newly enforced write path is blocked unexpectedly, but that should be accompanied by data remediation notes.

## Validation Commands

- Targeted migration contract test to run from `server/`: `NODE_ENV=test node --test "test/unit/migrations/phase3-online-qr-store-schema.test.js"`.
- Specs validation to run from repository root: `npm run specs:check`.
- Attempted targeted test execution in this wave was blocked by the active command permission policy before Node started, so no pass/fail result is claimed.
- `npm run specs:check` was not run after the targeted command was blocked by the same shell-backed execution policy.
- Supabase apply was intentionally not run in this wave because no safe target dry-run mechanism was available.

## Current Decision

Task `2.1` is complete after successful Supabase MCP apply and verification of migration `042`. Task `2.2` remains the next task and was not started in this wave.
