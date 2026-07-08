---
schema_version: 2
document_type: active-task-pointer
status: idle
updated_at: 2026-07-07
---

# Current Task

## QR Store Backend Backlog Follow-up

Status: Phase 4 sections 11-13 documentation/regression/alpha readiness closure is complete with validation blocked where command execution is unavailable. Phase 4 implementation coverage is documented through section 13, Supabase MCP validations are recorded, and final No-Go limitations are explicit. Task `2.4` remains incomplete/blocked because no real BayarGG encrypted credential/reference exists; user explicitly selected **Defer BayarGG**, so no fake credentials or live-readiness claims are allowed.

Implementation progress on 2026-07-07:

- User explicitly approved continuing the QR Store backend backlog as a follow-up/continuation and instructed to ignore the spec authority blocker.
- Kept `specs/backlog/qr-store-backend/spec.yaml` in backlog status; the spec was not moved to active.
- Marked task `0.1` completed after confirming `requirements.md` and `design.md` are normalized Markdown documents; no `npm run specs:check` result is claimed for this wave.
- Marked task `0.2` completed with the authority decision above.
- Marked task `0.3` completed by adding `specs/backlog/qr-store-backend/audit-evidence.md` with a Phase 3.x capability/gap map from supplied file evidence.
- Left task `0.4` in progress/pending because specs check and spec index sync were not executed in this wave.
- Freshly inspected Online Store runtime paths for task `1.1`: `public-store.js`, `public-storefront.service.js`, `storefronts.supabase.repository.js`, plus relevant public order support, route tests, service helper tests, and API/status docs.
- Updated `specs/backlog/qr-store-backend/audit-evidence.md` with a dedicated `1.1 Online Store Audit` section covering public storefront, outlet selection, menu browsing, cart validation, checkout, payment status, public order tracking, gaps/risks, and baseline tests.
- Marked task `1.1` completed as a documentation audit only.
- Freshly inspected QR Store runtime paths for task `1.2`: `qr-order-session.service.js`, `qr-order-sessions.supabase.repository.js`, migrations `038` through `041`, and relevant QR unit/migration tests.
- Updated `specs/backlog/qr-store-backend/audit-evidence.md` with a dedicated `1.2 QR Store Runtime Audit` section covering universal/outlet/location QR support versus gaps, file references, and baseline tests.
- Marked task `1.2` completed as an audit only; true Universal QR remains a documented implementation gap because current `qr_codes.outlet_id` is non-null and runtime returns `outlet_locked: true`.
- Freshly inspected marketplace preservation paths for task `1.3`: WhatsApp/Meta commerce, active Telegram commerce, AI assisted order/cart paths, and marketplace regression tests.
- Freshly inspected product, outlet availability, and modifier runtime for task `1.4`: product service/repository, `product_outlet_availability`, inventory checks, cart/checkout modifier carry-through, and public cart modifier gaps.
- Freshly inspected checkout/order/payment lifecycle for task `1.5`: public checkout idempotency, order snapshot creation, payment session creation, BayarGG webhook paid/manual-review transitions, and fulfillment guards.
- Freshly inspected admin lifecycle and permissions for task `1.6`: list/detail scoping, outlet access, cancel reason, hard-delete blocking, and the `orders.manage_status` versus per-action permission gap.
- Freshly inspected API/data docs versus runtime/migrations for task `1.7` and marked stale docs in `audit-evidence.md` before any runtime edit.
- Marked tasks `1.3` through `1.7` completed as documentation audits and marked checkpoint `1.8` completed because the gap list has file references, baseline tests are identified, and no implementation has begun.
- Continued Phase 4 at section 2.1 with documentation-only local migration inspection of `038` through `041`.
- Added `specs/backlog/qr-store-backend/database-readiness.md` with expected apply order, required environment inputs, required extension checks, `NOT VALID` constraint checks, provider-setting uniqueness conflict checks, manual commands, post-apply checks, rollback notes, and the exact blocker.
- Updated task `2.1` to blocked/pending environment while keeping all verification checklist items unchecked because target Supabase execution was not actually performed.
- Supabase MCP verification on 2026-07-07 identified the accessible target as `marketplace-chatbot-Project` (`hxel...ioff`, redacted), matching repository project references without printing credentials.
- Supabase MCP read-only SQL confirmed `pgcrypto` `1.3`, `uuid-ossp` `1.1`, and `gen_random_uuid()` are available on the target.
- Supabase MCP read-only SQL confirmed migrations `038` through `041` are not present by local migration name in `supabase_migrations.schema_migrations`, while later `qr_order_alpha_*` migrations are present.
- Supabase MCP read-only SQL confirmed Phase 3 tables such as `storefronts`, `storefront_outlets`, `qr_locations`, `qr_codes`, `payment_providers`, `payment_status_history`, and `security_events` are absent.
- Supabase MCP read-only SQL found target schema drift: `payment_provider_settings` uses `provider` instead of `provider_code`, already has per-mode indexes on `(workspace_id, provider, mode)`, and still has old `(workspace_id, provider)` uniqueness that conflicts structurally with the intended per-mode model.
- Supabase MCP read-only SQL found no current row-level duplicate conflicts for provider/mode or active-provider/mode groups, but there are zero rows and the old structural uniqueness remains.
- Supabase MCP read-only SQL confirmed the `041` `NOT VALID` constraints are absent, so acceptance cannot be claimed.
- Local migrations `038` through `041` were not applied because direct application is unsafe against the drifted target schema and would reference `provider_code` where the target has `provider`.
- Added `server/src/db/migrations/042_online_qr_store_target_reconciliation.sql` as the target-aware additive reconciliation migration for the actual Supabase schema.
- Updated migration contract tests to assert that `042` uses `payment_provider_settings.provider`, avoids `provider_code`, avoids duplicate greenfield tables, guards old uniqueness cleanup, ensures per-mode uniqueness, and includes compatible `NOT VALID` constraints.
- Supabase MCP re-confirmed the active target as `marketplace-chatbot-Project` (`hxel...ioff`, redacted), reviewed `042` as additive/guarded with only targeted old provider-setting uniqueness cleanup and no data drops, and applied migration `online_qr_store_target_reconciliation` successfully.
- Supabase MCP post-apply SQL confirmed required tables exist: `storefronts`, `storefront_outlets`, `qr_locations`, `qr_codes`, `payment_providers`, `payment_status_history`, and `security_events`.
- Supabase MCP post-apply SQL confirmed `gen_random_uuid()` works, old provider-setting uniqueness objects `payment_provider_settings_unique` and `uq_payment_provider_settings_workspace_provider` are absent, and per-mode provider-setting indexes are present with correct unique column sets.
- Supabase MCP post-apply SQL confirmed all expected `041` `NOT VALID` constraints exist on `orders`, `payments`, and `order_items` with `convalidated = false`.
- Supabase MCP post-apply SQL confirmed forbidden duplicate tables `qr_sessions`, `product_availability`, `checkout_sessions`, `idempotency_keys`, and `admin_users` were not created.
- Continued Phase 4 section 2 tasks in order using Supabase MCP on `marketplace-chatbot-Project` (`hxel...ioff`, redacted).
- Inspected target data and identified `SelaluKopi Demo` as the SELKOP workspace with two relevant active outlets: `SELKOP Samarinda` (`SLKP-SMD-01`) and `SELKOP Tenggarong` (`SLKP-TGR-01`). Both source outlets are `operational_status=DRAFT`, `accepts_orders=false`, and have `0` product availability rows, so orderable storefront activation is blocked.
- Task `2.2`: Supabase MCP upserted one active `storefronts` row for slug `selkop` / `SELKOP Online Store`, plus two visible active `storefront_outlets` mappings for the SELKOP outlets. Ordering remains disabled on the storefront and mappings to preserve source data truth.
- Task `2.3`: Supabase MCP upserted four active `qr_locations` (`PICKUP` and `T01` per outlet) and six active outlet/location/table `qr_codes`. Full public QR codes and token hashes were not printed; evidence records only redacted last-8 public-code suffixes in `database-readiness.md`. True Universal QR remains blocked because `qr_codes.outlet_id` is `NOT NULL` and runtime lookup is outlet-locked.
- Task `2.4`: Supabase MCP confirmed the BayarGG provider catalog row exists and plaintext secret columns are absent, but there are `0` `payment_provider_settings` rows, so real credential/reference validation is blocked/deferred. No fake credentials were created.
- Task `2.5`: Supabase MCP confirmed required uniqueness indexes exist and duplicate groups are `0` for public order token, order number, payment provider references/transactions, payment event provider-event, public checkout idempotency, QR public code/token hash, and QR outlet/location code.
- Task `2.6`: Supabase MCP advisors were reviewed. Security advisor reports broad pre-existing public-table RLS/function warnings; newly reconciled Phase 3 tables have RLS enabled with one policy each. Earlier readiness gaps for `2.2` and `2.3` were later resolved; remaining BayarGG task `2.4` is now an approved credential/live-readiness deferral, so checkpoint `2.6` is complete with deferral.
- Added local migration `043_universal_qr_scope.sql` for Universal QR scope support without changing the Supabase target in this wave.
- Implemented local Universal QR runtime behavior: nullable QR outlet target, `scope`/`qr_type`, universal outlet selection, outlet/location override rejection, route `outlet_id` forwarding, cart/checkout selected-outlet requirement, and structured QR location metadata/fulfillment snapshots.
- Updated local tests for migration `043`, QR service universal/outlet/location response behavior, and public checkout QR location snapshot handling. Universal QR is local-implementation-ready pending Supabase MCP apply and seed.
- Supabase MCP re-confirmed target `marketplace-chatbot-Project` (`hxel...ioff`, redacted) and verified migration `universal_qr_scope` is already present in the migration ledger.
- Supabase MCP verified QR schema after `043`: `qr_codes.outlet_id` and `qr_order_sessions.outlet_id` are nullable; `qr_codes.scope` and `qr_type` exist; scope/type/target consistency checks and workspace scope/type indexes exist; `qr_order_sessions.selected_outlet_id`, `locked_outlet_id`, `locked_location_id`, and `customer_context` exist.
- Supabase MCP seeded/verified one active true Universal QR for SELKOP with public code `uqr_7d8dd103549e8cae38dacdce6da68820e0b7`, token hash last8 `e6b5d9bf`, `scope='universal'`, `qr_type='universal'`, and null outlet/location targets. Plaintext token was not printed or stored.
- Supabase MCP updated only workspace `b4af...393c6` and the two requested SELKOP outlets to pickup order-ready, seeded product availability for active products at both outlets, and enabled storefront `selkop` plus mappings. Verification showed both outlets have `1` active product and `1` active available product-outlet row.
- Supabase MCP validated BayarGG catalog exists and is QRIS-enabled, but SELKOP has `0` BayarGG provider settings rows, `0` active settings rows, and `0` credential references; no active provider setting or fake credential was created.
- User explicitly selected **Defer BayarGG**. Real BayarGG credential/live verification is an approved deferral: task `2.4` remains open/blocked by real credentials, checkpoint `2.6` is complete with documented deferral, and Phase 4 may proceed with P0 non-credential work. Do not claim BayarGG live readiness or create fake credentials.
- Implemented Phase 4 section 3 public storefront/menu runtime hardening: public outlets are now limited to active/visible/orderable/pickup-enabled outlets, selected unavailable outlets reject with `OUTLET_UNAVAILABLE`, public menu mapping omits cost/inventory/raw metadata, and public cart/checkout validates modifier group/option ownership with backend-owned price deltas.
- Modifier min/max validation is supported only where existing product modifier metadata/relation data provides `min`, `max`, `minSelections`, `maxSelections`, `min_selections`, or `max_selections`; the active migration set still lacks normalized modifier group/option/min-max tables.
- Added focused public storefront unit tests for safe product/modifier mapping, outlet unavailability, invalid modifiers, and price tampering ignored, but targeted test execution was blocked by active command/tool policy, so section 3 checkpoint remains pending executable validation.
- Implemented Phase 4 section 6 BayarGG non-credential hardening: active BayarGG sessions require configured runtime provider settings, backend sends authoritative amount/currency/reference, public session responses omit metadata/raw provider response, webhook verification happens before payment event mutation, duplicate processed events are no-op, provider transaction/reference/amount/currency/expiry are validated, and amount/currency/expired paths enter `manual_review` without order fulfillment.
- Added mocked BayarGG service tests for session payload/public response safety, missing configured credentials, valid paid webhook, invalid verification, duplicate webhook, amount mismatch, currency mismatch, expired callback, provider transaction mismatch, and merchant reference mismatch. No real credentials or live BayarGG calls were added.
- Maintained the approved BayarGG credential/live-readiness deferral for section `6.1` credential evidence and `6.6` live sandbox verification; those remain incomplete until authorized real credentials/settings exist.
- Implemented Phase 4 section 7 lifecycle/admin fulfillment hardening: admin/order lifecycle routes now resolve the order through existing user outlet scope before mutation, pass resolved outlet scope into accept/prepare/ready/complete/cancel/status transitions, and generic status transitions can enforce outlet mismatch denial when provided an outlet scope.
- Confirmed lifecycle semantics remain unpaid `not_started`, verified paid `awaiting_acceptance`, then accept/prepare/ready/complete through `accepted`, `preparing`, `ready`, and `completed`; paid-only service guards remain for accept/prepare/ready/complete and cancellation still requires a reason.
- Preserved `orders.manage_status` instead of introducing per-action permission splits because the user did not explicitly approve splitting lifecycle actions; `allowed_actions` now reflects both `orders.manage_status` permission and backend order capability.
- Added targeted lifecycle/security assertions for unpaid prepare denial, cross-outlet prepare/cancel denial before mutation, cancel reason, hard-delete blocking, and allowed-action permission/capability consistency.
- Supabase MCP re-confirmed target `marketplace-chatbot-Project` (`hxel...ioff`, redacted), reviewed local migration `044_public_checkout_idempotency_state.sql` as additive/guarded/idempotent with no data drops, and applied migration `public_checkout_idempotency_state` successfully.
- Supabase MCP verified `order_idempotency_records.status`, `error_snapshot`, `order_idempotency_records_status_check`, `order_idempotency_records_public_checkout_status_idx`, and preserved unique index `order_idempotency_records_public_checkout_unique_idx` on the target.
- Section 8 was not run in this task.
- Implemented Phase 4 section 10 background workers and reconciliation: payment expiry scans due backend `expires_at` rows and transitions only `pending`/`processing`; paid payments are guarded from expiry; reconciliation workers now call service-layer missing-webhook/provider-status reconciliation rather than direct payment/order row mutation; provider status queries go through configured provider resolver; reconciliation audit is recorded; paid notification is suppressed if the order was already paid; QR session cleanup expires/revokes old sessions without deleting operational history.
- Added focused tests for pending payment expiry, paid payment non-expiry, provider-paid missing webhook reconciliation without duplicate paid notification, and QR session cleanup behavior. Real BayarGG credentials/settings remain deferred, so BayarGG live/provider behavior is still not claimed.
- Completed Phase 4 section 11 regression protection documentation by inventorying existing/prior-wave test coverage for WhatsApp/Meta commerce, Telegram marketplace/webhooks, AI guardrails, cart/order/payment, admin authorization/order lifecycle, payment webhooks, and public route/security guardrails. Status is implementation/test coverage identified with executable validation blocked; no test pass is claimed.
- Completed Phase 4 section 12 documentation and alpha readiness updates: Public Storefront, Orders/Admin Orders, Payments, Webhooks, data schema, seed data, schema plan, production-readiness pointer, sprint status docs, and new alpha readiness checklist now reflect current reality.
- Recorded current reality explicitly: target-aware migration `042` applied/verified, `043` Universal QR verified present, `044` applied/verified, SELKOP storefront/outlet/product availability seed enabled, outlet/location/table QR and true Universal QR seeded, BayarGG live credential deferred, public rate limiting alpha-only/in-memory, and workers in-process.
- Completed Phase 4 section 13 final validation documentation with actual targeted commands attempted/blocked, Supabase MCP validations passed, and final No-Go checklist for local validation, BayarGG live readiness, production/multi-instance readiness, and admin security-event observability.

Validation status:

- Targeted migration contract test: attempted from `server/` with `NODE_ENV=test node --test "test/unit/migrations/phase3-online-qr-store-schema.test.js"`, but blocked by active command permission policy before Node started.
- Phase 4 section 7 targeted tests: attempted from `server/` with `NODE_ENV=test node --test "test/security/orders/cart-order-security.test.js" "test/unit/routes/authorization-routes.test.js"`, but blocked by active command permission policy before Node started.
- `npm run specs:check`: not run after shell-backed targeted command execution was blocked.
- Online Store baseline tests were identified but not executed in this documentation-only wave.
- QR baseline tests were identified but not executed in this documentation-only wave.
- Marketplace, product/availability/modifier, checkout/payment, admin lifecycle, and docs/runtime baseline tests were identified but not executed in this documentation-only wave.
- Target Supabase migration application: local `038` through `041` were not applied blindly because target schema drift makes direct apply unsafe; target-aware `042` was applied successfully through Supabase MCP and verified. SQL outputs are summarized in `specs/backlog/qr-store-backend/database-readiness.md`.
- Target Supabase seed/validation: MCP writes and read-only checks were completed for tasks `2.2` through `2.5`; outputs are summarized with redaction in `specs/backlog/qr-store-backend/database-readiness.md`.
- Target Supabase migration `044` application: MCP applied `public_checkout_idempotency_state` successfully and verified the idempotency state columns, check constraint, status index, and existing public checkout uniqueness. SQL outputs are summarized in `specs/backlog/qr-store-backend/database-readiness.md`.
- Targeted local tests for migration/QR/public storefront were attempted with `NODE_ENV=test node --test ...`, but command execution was blocked by active permission policy before Node started; no pass/fail result is claimed.
- Targeted BayarGG tests were attempted from `server/` with `npm test -- --test-reporter=spec test/integration/payments/payment-session-bayargg.integration.test.js test/integration/payments/payment-webhook.integration.test.js`, but command execution was blocked by active permission policy before Node started; no pass/fail result is claimed.
- Phase 4 section 10 targeted tests were attempted from `server/` with `NODE_ENV=test node --test "test/unit/services/payment-expiry.service.test.js" "test/unit/services/payment-reconciliation.unit.test.js" "test/unit/workers/qr-session-expiry.worker.test.js"`; see progress log for final result.
- Phase 4 section 11-13 final targeted commands are listed in `specs/backlog/qr-store-backend/tasks.md` section 13 and `docs/backend/12-devops/alpha-readiness-checklist.md`; command execution is blocked, so no local pass/fail result is claimed.

Known limitations and follow-ups:

- Current backlog task `2.1 Verify migrations 038 through 041` is complete via target-aware reconciliation on the real Supabase target.
- Current Phase 4 closure status: sections 11-13 are documentation-complete with validation blocked where appropriate. BayarGG task `2.4` and section `6.6` live sandbox verification remain deferred until a real encrypted/referenced credential is provided by an authorized operator.
- Phase 1 audit checkpoint `1.8` is complete as documentation-only; implementation gaps remain prioritized for later tasks.
- Later validation needs to run the targeted local/spec/regression commands once command execution is available and complete BayarGG credential/live sandbox validation before any real paid-alpha claim.

## Normalize QR Store Backend Backlog Spec Documents

Status: superseded by the QR Store Backend Backlog Follow-up entry above; task `0.1` is now marked completed with validation limitation.

Implementation progress on 2026-07-07:

- Removed generator wrapper lines from `specs/backlog/qr-store-backend/requirements.md` so it starts with YAML frontmatter and ends with real requirements content.
- Removed copy/paste conversational wrapper and tail save/commit instructions from `specs/backlog/qr-store-backend/design.md` while preserving legitimate Markdown/code fences inside the design document.
- Left task `0.1` pending validation because `npm run specs:check` could not be started in this session.
- Kept `specs/backlog/qr-store-backend/spec.yaml` in backlog status; the spec was not moved to active.
- No runtime code was changed.

Validation status:

- `npm run specs:check`: blocked by local shell/process execution permission policy before command execution.

Known limitations and follow-ups:

- `npm run specs:check` still needs to be executed before marking checkpoint `0.4` complete.
- Task `0.2` was completed by explicit user authority decision in the follow-up entry above.

## Harden Online QR Store Indexes and Integrity Rules

Status: idle after completing `ORD-QR-P3.3` for `selaluteh-cart-order-lifecycle`.

Implementation progress on 2026-07-07:

- Reconciled `plans/qr-order-backend/phase-3.3.md` with existing runtime physical tables.
- Added additive migration `041_online_qr_store_phase33_integrity.sql` for order, QR, product availability, payment, webhook, idempotency, provider-setting, and audit indexes.
- Added partial unique indexes for public order tokens, order numbers, public checkout idempotency, provider payment references, and one active provider per workspace/mode.
- Added follow-up Phase 3.3 integrity hardening for per-mode payment provider settings: dropped the old one-active-per-workspace index, replaced provider uniqueness with `(workspace_id, provider_code, mode)`, and made runtime active-provider lookup mode-aware.
- Added runtime `payment_events` idempotency/hash indexes to match the actual webhook processing table, not only the optional `payment_webhook_events` table.
- Added `manual_review` to order/payment status domain handling and BayarGG mismatch/expired-webhook paths.
- Required public checkout customer name and phone before side effects, required cancel reason on generic status cancellation, and disabled order hard delete at repository level.
- Added guarded `NOT VALID` constraints for order payment status, fulfillment status, fulfillment type, channel, non-negative order/payment amounts, and positive order item quantity.
- Kept paid-only fulfillment, backend total authority, QR outlet lock, public token secrecy, and provider-paid authority as service-layer rules.
- Added migration contract tests for Phase 3.3 integrity hardening and duplicate greenfield table avoidance.

Validation completed before pointer closure:

- Baseline `npm run specs:check`: passed, 15 specs validated.
- `NODE_ENV=test node --test "test/unit/migrations/phase3-online-qr-store-schema.test.js"`: passed, 6 tests.
- `NODE_ENV=test node --test "test/unit/migrations/phase3-online-qr-store-schema.test.js" "test/unit/repositories/payment-provider-settings.repository.test.js" "test/unit/orders/order-types.test.js" "test/unit/services/public-storefront.service.test.js" "test/security/orders/cart-order-security.test.js" "test/security/payments/payment-security.test.js"`: passed, 55 tests.
- `NODE_ENV=test node --test "test/unit/services/settings.service.test.js" "test/unit/middleware/rate-limit.test.js"`: passed, 6 tests.
- Final `npm run specs:check`: passed, 15 specs validated.

Known limitations and follow-ups:

- Apply migrations `038`, `039`, `040`, and `041` to the target Supabase environment before relying on Phase 3 database integrity hardening.
- `NOT VALID` constraints should be validated later after production data audit/remediation.
- Live payment webhook/idempotency and migration application were not run locally.
- Full transaction/claim-based public checkout idempotency locking and full modifier pricing validation remain deferred because they require broader repository/schema workflow changes.

Task scope:

- Implement `plans/qr-order-backend/phase-3.3.md` as additive integrity hardening on existing runtime tables.
- Add safe indexes, partial unique indexes, and check constraints only where compatible with current physical schema and existing data.
- Preserve existing runtime mappings and avoid duplicate greenfield tables such as `qr_sessions`, `product_availability`, `checkout_sessions`, and `idempotency_keys`.
- Keep payment provider configurable, active provider uniqueness provider-agnostic, and payment paid authority in backend/provider webhook paths.
- Preserve pickup-only public checkout and public response safety.

Planned validation:

- Baseline `npm run specs:check` before implementation changes.
- Targeted migration/schema integrity tests.
- Final `npm run specs:check` before pointer closure.

## Implement Online QR Store Security Guardrails

Status: idle after completing `ORD-QR-P3.4` for `plans/qr-order-backend/phase-3.4.md`.

Implementation progress on 2026-07-07:

- Added public route rate limits for QR lookup, cart validation, checkout, payment polling, and public order lookup, including token/payment-aware rate-limit keys.
- Hardened public order response by exposing public-safe `amounts` only and keeping phone numbers masked.
- Added non-blocking audit logs for order create/accept/prepare/ready/complete/cancel and BayarGG payment webhook/manual-review/paid events.
- Hardened BayarGG webhook mismatch handling so amount mismatch, currency mismatch, and expired payment callbacks enter `manual_review` and never mark payment/order paid.
- Preserved signature verification, duplicate event protection, provider reference matching, amount/currency validation, and paid-only fulfillment guards.
- Disabled order hard delete in route, service, and repository layers; cancellation requires a reason.

Validation completed before pointer closure:

- `NODE_ENV=test node --check "src/services/order.service.js"`: passed.
- `NODE_ENV=test node --check "src/services/payment-webhook.service.js"`: passed.
- `NODE_ENV=test node --check "src/routes/public-store.js"`: passed.
- `NODE_ENV=test node --check "src/middleware/rate-limit.js"`: passed.
- `NODE_ENV=test node --test "test/unit/services/public-storefront.service.test.js" "test/unit/middleware/rate-limit.test.js" "test/security/orders/cart-order-security.test.js" "test/security/payments/payment-security.test.js"`: passed, 24 tests.
- `NODE_ENV=test node --test "test/unit/migrations/phase3-online-qr-store-schema.test.js"`: passed, 6 tests.
- `npm run specs:check`: passed, 15 specs validated.

Known limitations and follow-ups:

- Live BayarGG webhook verification was not run in this local session.
- Payload-hash duplicate behavior is indexed for the runtime event table, but service-level provider-event idempotency remains the active processing guard.
- Basic in-memory rate limiting is sufficient for alpha only; distributed deployment needs shared storage or edge enforcement.

## Implement Phase 4 Audit Log And Public Security

Status: implementation complete for sections `8.1` through `9.5`, validation blocked by active command policy.

Implementation progress on 2026-07-07:

- Verified existing order lifecycle audit coverage for `order.created`, `order.accepted`, `order.preparing`, `order.ready`, `order.completed`, and `order.cancelled`.
- Added/confirmed payment/settings audit coverage for `payment.created`, `payment.webhook_received`, `payment.paid`, `payment.manual_review`, and `settings.payment_provider_changed`.
- Moved audit redaction into a shared utility and applied it at the audit repository boundary so all audit writes redact secret keys, webhook secrets, authorization/auth headers, bearer tokens, and unsafe raw provider payload/response fields.
- Added minimal `security_events` repository/service for existing `security_events` table usage and wired non-blocking events for invalid QR attempts, BayarGG webhook verification failure, and public checkout idempotency conflicts.
- Confirmed public order response remains customer-safe: no internal order ID, no raw provider payload, no audit logs, masked phone, and public-safe `amounts` fields.
- Confirmed existing public route rate limits cover QR lookup, cart validation, checkout, payment status polling, and public order lookup.
- Documented in-memory limiter as alpha/single-instance only and selected edge/WAF route-level limiting as the recommended production distributed strategy, with Redis app-level limiting only if identity-aware throttling is needed.

Validation status:

- Targeted command could not be started because the active tool permission policy blocks shell/background process execution.
- Intended targeted command: `NODE_ENV=test node --test "server/test/unit/orders/audit-events.test.js" "server/test/unit/utils/redaction.test.js" "server/test/unit/services/public-storefront.service.test.js" "server/test/unit/middleware/rate-limit.test.js" "server/test/unit/services/security-event.service.test.js" "server/test/integration/payments/payment-session-bayargg.integration.test.js" "server/test/integration/payments/payment-webhook.integration.test.js"`.

Known limitations and follow-ups:

- Local automated validation is pending because command execution is blocked in-session.
- `security_events` records only minimal operational metadata; no admin security event browsing API was added.
- Rate limiting remains in-memory for alpha and should be replaced or fronted by edge/WAF before multi-instance production.

## Reconcile Online QR Store Detail Table Schema

Status: idle after completing `ORD-QR-P3.2` for `selaluteh-cart-order-lifecycle`.

Implementation progress on 2026-07-07:

- Reconciled `plans/qr-order-backend/phase-3.2.md` as additive runtime mapping instead of a greenfield 36-table rebuild.
- Added additive migration `040_online_qr_store_phase32_detail_schema.sql` for safe storefront, storefront outlet, provider settings, payment, webhook, payment history, order history, and optional security event detail fields.
- Kept `qr_order_sessions`, `product_outlet_availability`, `checkouts`, `order_idempotency_records`, existing payment tables, and existing auth/permission runtime as canonical physical tables.
- Documented Phase 3.2 logical-to-physical table decisions and deferred money-standard/admin/catalog rebuilds in `plans/qr-order-backend/database-schema-plan.md` and data docs.
- Added migration contract tests proving Phase 3.2 detail schema does not create duplicate `qr_sessions`, `product_availability`, `checkout_sessions`, `idempotency_keys`, or `admin_users` tables and does not add plaintext secret columns.

Validation completed before pointer closure:

- Baseline `npm run specs:check`: passed, 15 specs validated.
- `NODE_ENV=test node --test "test/unit/migrations/phase3-online-qr-store-schema.test.js"`: passed, 5 tests.
- Final `npm run specs:check`: passed, 15 specs validated.

Known limitations and follow-ups:

- Apply migrations `038`, `039`, and `040` to the target Supabase environment before relying on the Phase 3 storefront/QR/payment detail columns.
- Phase 3.2 integer minor-unit money standard remains a future coordinated data/API migration.
- `brands`, `storefront_settings`, admin role tables, and catalog/modifier rebuilds remain deferred to avoid duplicate runtime authority.
- No live seed data or Supabase migration application was run locally.

Task scope:

- Implement `plans/qr-order-backend/phase-3.2.md` as additive runtime reconciliation, not as a greenfield 36-table rebuild.
- Keep canonical runtime mappings from `plans/qr-order-backend/database-schema-plan.md` and avoid duplicate tables such as `qr_sessions`, `product_availability`, and `idempotency_keys`.
- Add safe schema hardening only where Phase 3.2 fields are missing and compatible with current runtime.
- Keep public checkout pickup-only, public response shapes stable, and payment credentials sourced from encrypted workspace settings metadata.
- Document exact Phase 3.2 logical-to-physical table decisions and seed/apply constraints.

Planned validation:

- Baseline `npm run specs:check` before implementation changes.
- Syntax checks for touched runtime modules.
- Targeted migration/schema and service tests.
- Final `npm run specs:check` before pointer closure.

## Lock Online QR Store Enum and Runtime Mapping

Status: idle after completing `ORD-QR-P3.1` for `selaluteh-cart-order-lifecycle`.

Implementation progress on 2026-07-07:

- Added runtime domain constants for public order channels, QR location/status/session values, runtime fulfillment values, and supported payment provider codes/modes.
- Added additive migration `039_online_qr_store_phase31_hardening.sql` for QR location sort order, QR code outlet lock/revocation/admin fields, safe indexes, QR location type compatibility hardening, and conditional QR session status constraint hardening.
- Split QR code vs QR order session semantics so QR-code-only lookup keeps `qr_session.id = null` and carries `qr_session.qr_code_id`; public checkout therefore does not write `qr_codes.id` into `orders.qr_session_id`.
- Preserved public storefront response shape while carrying table-backed storefront ID through internal non-enumerable context and order metadata.
- Kept payment provider settings secret-safe and documented that encrypted workspace settings metadata remains credential authority.
- Documented seed/application strategy for storefronts, storefront outlets, QR locations, QR codes, and provider verification.

Validation completed before pointer closure:

- Baseline `npm run specs:check`: passed, 15 specs validated.
- `NODE_ENV=test node --check "src/services/public-storefront.service.js"`: passed.
- `NODE_ENV=test node --check "src/services/qr-order-session.service.js"`: passed.
- `NODE_ENV=test node --check "src/orders/order-types.js"`: passed.
- `NODE_ENV=test node --check "src/services/order.service.js"`: passed.
- `NODE_ENV=test node --test "test/unit/orders/order-types.test.js" "test/unit/services/public-storefront.service.test.js" "test/unit/services/qr-order-session.service.test.js" "test/unit/migrations/phase3-online-qr-store-schema.test.js" "test/unit/services/settings.service.test.js" "test/unit/repositories/payment-provider-settings.repository.test.js"`: passed, 39 tests.
- Final `npm run specs:check`: passed, 15 specs validated.

Known limitations and follow-ups:

- Apply migrations `038_online_qr_store_schema_phase3.sql` and `039_online_qr_store_phase31_hardening.sql` to the target Supabase environment before relying on dedicated storefront or QR code tables.
- Real seed rows were not inserted locally; the seed/application strategy is documented in `plans/qr-order-backend/database-schema-plan.md`.
- Payment credentials remain sourced from existing encrypted workspace settings metadata until a dedicated normalized credential migration is explicitly implemented.
- Active public checkout remains pickup-only until the active spec changes runtime fulfillment scope.

Task scope:

- Implement Phase 3.1 continuation from `.kilo/plans/1783371302130-tidy-knight.md` as the source of truth.
- Lock Online QR Store enum/domain decisions as runtime mapping, not greenfield replacement tables.
- Add only additive, non-destructive schema hardening on top of migration `038_online_qr_store_schema_phase3.sql`.
- Keep public response shapes stable, runtime pickup-only behavior unchanged, and payment credentials sourced from encrypted workspace settings metadata.
- Fix QR code vs QR order session semantics so `qr_codes.id` is not written as `orders.qr_session_id`.
- Retain internal storefront context without exposing new internal IDs in the public storefront response.

Planned validation:

- Baseline `npm run specs:check` before implementation changes.
- `node --check` for touched services/modules.
- Targeted public storefront, QR/session, settings/payment provider, and migration/schema tests.
- Final `npm run specs:check` before pointer closure.

## Design Online QR Store Database Schema

Status: idle after completing `ORD-QR-P3` for `selaluteh-cart-order-lifecycle`.

Implementation progress on 2026-07-07:

- Added additive migration `038_online_qr_store_schema_phase3.sql` for storefronts, storefront outlets, QR locations, QR codes, QR session/order extension columns, provider-agnostic payment settings, and payment status history.
- Added schema mapping document `plans/qr-order-backend/database-schema-plan.md` and updated database/index/RLS/migration/public API docs.
- Added storefront lookup repository and updated public storefront service to prefer `storefronts` while retaining workspace/settings metadata fallback.
- Extended QR lookup to prefer `qr_codes` and retain existing `qr_order_sessions` hashed-token fallback.
- Added normalized payment provider settings repository with secret redaction and kept existing encrypted workspace settings metadata as credential runtime fallback.
- Added migration, repository, public storefront, and settings tests.

Validation completed before pointer closure:

- Baseline `npm run specs:check`: passed, 15 specs validated.
- `NODE_ENV=test node --check "src/services/public-storefront.service.js"`: passed.
- `NODE_ENV=test node --check "src/services/qr-order-session.service.js"`: passed.
- `NODE_ENV=test node --check "src/services/settings.service.js"`: passed.
- `NODE_ENV=test node --test "test/unit/services/public-storefront.service.test.js" "test/unit/services/settings.service.test.js" "test/unit/migrations/phase3-online-qr-store-schema.test.js" "test/unit/repositories/payment-provider-settings.repository.test.js"`: passed, 13 tests.
- Targeted order/route/public/schema suite: passed, 42 tests.
- Final `npm run specs:check`: passed, 15 specs validated.

Known limitations and follow-ups:

- Apply migration `038_online_qr_store_schema_phase3.sql` to the target Supabase environment before relying on dedicated storefront or QR code tables.
- Seed data for `storefronts`, `storefront_outlets`, `qr_locations`, and `qr_codes` was not added because no real alpha seed credentials/data were provided.
- Payment credentials remain sourced from existing encrypted workspace settings metadata until a dedicated normalized credential migration is explicitly implemented.

Task scope:

- Implement Phase 3 from `.kilo/plans/1783370216800-cosmic-nebula.md` as the source of truth.
- Reconcile greenfield Phase 3 schema proposals with existing Supabase/Postgres runtime tables.
- Add only additive, non-destructive schema/runtime changes for storefronts, QR locations/codes, payment provider settings where missing, and compatibility service lookups.
- Preserve existing Phase 2 public/admin/payment API response shapes, pickup-only runtime behavior, and settings metadata fallback.
- Keep payment provider configurable; BayarGG is active configuration data, not hardcoded schema/runtime behavior.

Planned validation:

- Baseline `npm run specs:check` before implementation changes.
- Targeted public storefront, QR/session, payment config, and migration/schema tests after implementation.
- Final `npm run specs:check` before pointer closure.

## Finalize Online QR Store Backend API Contract

Status: idle after completing `ORD-QR-P2` for `selaluteh-cart-order-lifecycle`.

Implementation progress on 2026-07-07:

- Added `/api/v1/public`, `/api/v1/admin/orders`, and `/api/v1/webhooks` aliases without replacing legacy routes.
- Added Phase 2 public storefront/menu, QR context, cart validation, checkout, payment status, and public order response contracts.
- Added public checkout idempotency through `order_idempotency_records`, backend-only total recomputation, QR outlet lock, and pickup-only enforcement.
- Added admin order alias mapper with `allowed_actions` derived from existing order capabilities.
- Updated Phase 2 API documentation and added targeted route/helper tests.

Validation completed before pointer closure:

- Baseline `npm run specs:check`: passed, 15 specs validated.
- `NODE_ENV=test node --test "test/unit/orders/order-types.test.js" "test/unit/routes/authorization-routes.test.js" "test/unit/services/public-storefront.service.test.js"`: passed, 32 tests.
- `NODE_ENV=test node --test "test/security/orders/cart-order-security.test.js" "test/property/orders/cart-order-property.test.js" "test/resilience/orders/cart-order-resilience.test.js"`: passed, 26 tests.
- `NODE_ENV=test node --test "test/integration/payments/payment-attempt.integration.test.js" "test/integration/payments/payment-webhook.integration.test.js"`: passed, 5 tests.
- Final `npm run specs:check`: passed, 15 specs validated.

Known limitations and follow-ups:

- Public storefront slug resolution currently uses workspace/settings metadata conventions; a dedicated storefront configuration table can harden this later.
- Public checkout creates the order before payment session creation; if provider configuration is missing or provider creation fails, operational retry/recovery is required.
- Live provider webhook/payment and target Supabase migration application were not run locally.

Task scope:

- Implement the Phase 2 backend API contract from `.kilo/plans/1783347396991-happy-canyon.md` and `plans/qr-order-backend/phase-2.md`.
- Add `/api/v1` public, admin order, and webhook aliases without removing existing route mounts.
- Keep backend as authority for QR outlet context, cart validation, pricing, order creation, payment status, fulfillment transitions, public order status, admin permissions, and audit/event logs.
- Preserve pickup-only active fulfillment unless the active spec is explicitly updated.
- Keep public frontend integration out of scope unless separately requested.

Completed in the latest session:

- Reconciled runtime order lifecycle with separate `payment_status`, `fulfillment_status`, and derived `public_order_status`.
- Updated provider paid paths so verified paid moves fulfillment to `awaiting_acceptance`, not accepted/preparing/completed.
- Enforced paid-only fulfillment guards for accept, prepare, ready, and complete actions.
- Added public order token generation, QR session hashed-token lookup foundation, and public QR/order status endpoints.
- Blocked admin hard delete in favor of cancellation with reason.
- Added additive migration `037_qr_public_order_lifecycle.sql`.
- Updated order/payment/checkout/public API docs, implementation status, progress log, and active task checklist.

Validation completed before pointer closure:

- Baseline `npm run specs:check`: passed, 15 specs validated.
- `NODE_ENV=test node --test "test/unit/orders/order-types.test.js"`: passed, 20 tests.
- `NODE_ENV=test node --test "test/unit/routes/authorization-routes.test.js"`: passed, 7 tests before final cancel-route assertion update.
- `NODE_ENV=test node --test "test/security/orders/cart-order-security.test.js"`: passed, 9 tests.
- `NODE_ENV=test node --test "test/property/orders/cart-order-property.test.js"`: passed, 10 tests.
- `NODE_ENV=test node --test "test/resilience/orders/cart-order-resilience.test.js"`: passed, 7 tests.
- `NODE_ENV=test node --test "test/integration/commerce/order-service.integration.test.js" "test/e2e/orders/cart-order-e2e.test.js"`: passed, 24 tests.

Known limitations and follow-ups:

- Apply migration `037_qr_public_order_lifecycle.sql` to the target Supabase environment before using public QR/order APIs.
- Live provider webhook verification was not run in this local session.
- Public storefront frontend still uses mock API and needs a later explicit backend integration task.
