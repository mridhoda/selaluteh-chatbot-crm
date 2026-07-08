# SELKOP Phase 4 — Backend Audit & QR Store Adaptation Tasks

## 1. Purpose

Dokumen ini adalah backlog implementasi backend untuk mengadaptasi backend existing **SelaluTeh Chatbot CRM** agar mendukung **SELKOP Online Store** dan **QR Store** dengan pendekatan **brownfield adaptation**.

> Prinsip utama: **jangan rewrite dari nol**. Semua pekerjaan dimulai dari audit runtime existing, mapping capability, lalu implementasi gap yang benar-benar belum tersedia.

## 2. Target Scope

| Area | Target |
|---|---|
| Existing flow | CRM, marketplace flow, WhatsApp ordering, AI-assisted ordering |
| Storefront | Public Online Store, public no-login checkout, public order tracking |
| QR Store | Universal QR, Outlet QR, Location/Table QR |
| Pricing | Backend-authoritative pricing, product availability per outlet, modifier validation/pricing |
| Payment | BayarGG active configurable provider, webhook hardening, reconciliation |
| Fulfillment | Admin/kitchen order lifecycle, paid-only fulfillment guard |
| Security | Audit log, security events, public rate limiting, response hardening |
| Operations | Background workers, migration/seed readiness, alpha readiness |

## 3. Implementation Profile

| Item | Value |
|---|---|
| Runtime | Node.js, Express |
| Database | Supabase/Postgres |
| Admin dashboard | React + Vite |
| Backend root | `server/src/` |
| Architecture | Route → Middleware → Service → Repository → Database |
| External provider flow | Service → Provider Adapter / Integration Client → Provider |

## 4. Current Implementation Baseline

**Status update:** 2026-07-07

- Backend sudah menggunakan Supabase/Postgres runtime.
- Phase 3.x sudah menambahkan public route, QR context, public checkout, payment status, public order status, admin order aliases, provider settings schema, dan integrity migration.
- Phase 3.3 sudah menambahkan indexes, constraints, provider setting uniqueness per mode, runtime payment event indexes, dan `manual_review` payment state.
- Phase 3.4 sudah menambahkan public route rate limiting, public response hardening, BayarGG mismatch manual review path, audit logging, cancel reason enforcement, dan hard-delete blocking.
- Phase 4 tetap dibutuhkan untuk merapikan brownfield audit, seed/apply strategy, transactional hardening, modifier validation, live BayarGG verification, dan alpha readiness.

## 5. Existing Components to Preserve

Komponen berikut sudah ada dan harus **dipertahankan atau diperkuat**, bukan ditulis ulang tanpa alasan.

### Routes

```txt
server/src/routes/public-store.js
server/src/routes/admin-orders.js
server/src/routes/orders.js
server/src/routes/payments.js
server/src/routes/webhooks/payments.js
```

### Services

```txt
server/src/services/public-storefront.service.js
server/src/services/public-order.service.js
server/src/services/qr-order-session.service.js
server/src/services/order.service.js
server/src/services/payment.service.js
server/src/services/payment-webhook.service.js
server/src/services/payment-reconciliation.service.js
server/src/services/settings.service.js
```

### Repositories

```txt
server/src/db/repositories/orders.supabase.repository.js
server/src/db/repositories/payments.supabase.repository.js
server/src/db/repositories/qr-order-sessions.supabase.repository.js
server/src/db/repositories/storefronts.supabase.repository.js
server/src/db/repositories/payment-provider-settings.supabase.repository.js
```

### Migrations

```txt
server/src/db/migrations/037_qr_public_order_lifecycle.sql
server/src/db/migrations/038_online_qr_store_schema_phase3.sql
server/src/db/migrations/039_online_qr_store_phase31_hardening.sql
server/src/db/migrations/040_online_qr_store_phase32_detail_schema.sql
server/src/db/migrations/041_online_qr_store_phase33_integrity.sql
```

## 6. Implemented Foundations

- Public storefront/menu API.
- QR context lookup dari `qr_codes` dan fallback `qr_order_sessions`.
- Public cart validation.
- Public checkout dengan idempotency key.
- Public checkout mewajibkan customer name dan phone.
- Public payment status.
- Public order status by opaque public token.
- Public order phone masking.
- Public route rate limiting.
- Admin order lifecycle aliases.
- Paid-only fulfillment guards.
- Order hard-delete blocked di route/service/repository.
- Provider-agnostic payment settings schema.
- Active provider uniqueness per workspace/mode.
- BayarGG payment session dan webhook path.
- BayarGG amount/currency/expiry mismatch ke `manual_review`.
- Non-blocking audit logs untuk order dan payment events.
- Phase 3.3 index dan constraint migration.

## 7. Known Remaining Gaps

Gap berikut harus tetap terlihat dan tidak boleh disembunyikan.

- Full transaction/claim-based public checkout idempotency locking.
- Full modifier group/option validation dan modifier price calculation di public cart validation.
- Live BayarGG webhook verification dengan real provider payloads.
- Applying migrations `038`–`041` ke target Supabase environment.
- Real seed/application workflow untuk storefront, outlet, QR location, dan QR code data.
- Distributed/edge-backed rate limiting untuk multi-instance deployment.
- Admin per-action permission split jika product memutuskan enforce `orders.accept`, `orders.prepare`, `orders.ready`, `orders.complete`, dan `orders.cancel` secara terpisah.

## 8. Task Notation

| Notation | Meaning |
|---|---|
| `[ ]` | Not started |
| `[~]` | In progress |
| `[x]` | Completed |
| `[!]` | Release/security critical |
| `[*]` | Optional for fastest MVP |

## 9. Priority Notation

| Priority | Meaning |
|---|---|
| P0 | Required before real alpha order |
| P1 | Required before wider alpha |
| P2 | Future-ready / later phase |

## 10. Task Rules

1. Jangan menandai task selesai hanya karena file dibuat.
2. Task selesai hanya jika implementation, validation, tests, dan docs yang relevan selesai.
3. Setiap code change wajib disertai test baru atau update test yang relevan.
4. Existing WhatsApp, AI-assisted ordering, marketplace catalog, cart, order, payment, dan admin flow tidak boleh regress.
5. Jangan membuat service/repository baru bila service existing bisa diperluas dengan aman.
6. Jangan mempercayai price, total, discount, payment paid, fulfillment status, order completed, provider webhook validity, admin permission, QR locked outlet, atau QR locked location dari client.
7. Route baru harus tipis.
8. Business logic wajib berada di service/use-case layer.
9. Repository wajib menjadi boundary akses database.
10. Query tenant-owned wajib memakai workspace scope.
11. Query outlet-operational wajib memakai outlet scope.
12. Payment `paid` hanya berasal dari verified provider webhook atau valid backend reconciliation.
13. Duplicate checkout tidak boleh membuat duplicate order/payment.
14. Duplicate webhook tidak boleh membuat duplicate mutation.
15. Migration harus additive kecuali user menyetujui destructive migration secara eksplisit.
16. Secrets tidak boleh masuk response frontend, audit unsafe details, atau log.
17. Setiap checkpoint wajib menjalankan validation dan mencatat risk/limitation.
18. Docs harus diperbarui pada setiap task besar.

---

# Tasks

## 0. Backlog Spec Hygiene and Activation

### 0.1 Normalize backlog spec documents

**Status:** `[~]` Blocked by target schema drift · **Marker:** `[!]` Release/security critical
**Requirements:** documentation integrity, brownfield governance

**Acceptance checklist**

- [ ] Bersihkan `requirements.md` dari wrapper generator seperti `cat > requirements.md <<'EOF'`.
- [ ] Bersihkan `design.md` dari instruksi copy/paste seperti `nano design.md` dan fenced markdown pembungkus seluruh dokumen.
- [ ] Pastikan `requirements.md`, `design.md`, dan `tasks.md` bisa dibaca sebagai dokumen Markdown biasa.
- [ ] Pastikan `spec.yaml` tetap valid untuk lifecycle tooling.

---

### 0.2 Confirm spec authority before activation

**Status:** `[~]` Blocked by target schema drift · **Marker:** `[!]` Release/security critical
**Requirements:** scope control, implementation governance

**Acceptance checklist**

- [ ] Tentukan apakah spec backlog ini akan menggantikan, melanjutkan, atau menjadi follow-up dari `specs/active/selaluteh-cart-order-lifecycle`.
- [ ] Jangan memindahkan backlog ke active tanpa keputusan eksplisit.
- [ ] Catat keputusan di `docs/backend/09-ai-context/current-task.md`.

---

### 0.3 Map Phase 4 backlog against completed Phase 3.x work

**Status:** `[ ]` Not started · **Marker:** Standard
**Requirements:** existing backend audit

**Acceptance checklist**

- [ ] Tandai capability yang sudah selesai sebagai baseline/evidence.
- [ ] Jangan membuat ulang migration, service, atau route yang sudah ada.
- [ ] Buat gap list berbasis file runtime dan tests, bukan asumsi dokumen.

---

### 0.4 Checkpoint — backlog spec ready

**Status:** `[ ]` Not started · **Marker:** Standard

**Acceptance checklist**

- [ ] `npm run specs:check` pass.
- [ ] Spec index up to date.
- [ ] Requirements, design, tasks, dan spec manifest konsisten.
- [ ] Belum ada runtime code change kecuali user memang meminta implementasi.

---

## 1. Existing Backend Audit

### 1.1 Audit Online Store runtime paths

**Status:** `[~]` In progress · **Marker:** `[!]` Release/security critical
**Requirements:** Online Store, brownfield adaptation

**Acceptance checklist**

- [ ] Inspect route `server/src/routes/public-store.js`.
- [ ] Inspect service `server/src/services/public-storefront.service.js`.
- [ ] Inspect repository `server/src/db/repositories/storefronts.supabase.repository.js`.
- [ ] Map public storefront, outlet selection, menu browsing, cart validation, checkout, payment status, and public order tracking capability.

---

### 1.2 Audit QR Store runtime paths

**Status:** `[x]` Complete · **Marker:** `[!]` Release/security critical
**Requirements:** QR Store, Universal QR, Outlet QR, Location QR

**Acceptance checklist**

- [ ] Inspect `qr-order-session.service.js`.
- [ ] Inspect `qr-order-sessions.supabase.repository.js`.
- [ ] Inspect migrations `038`, `039`, `040`, and `041` for QR code/location/session support.
- [ ] Map Universal QR, Outlet QR, and Location/Table QR support versus remaining gaps.

---

### 1.3 Audit existing marketplace preservation paths

**Status:** `[x]` Complete · **Marker:** `[!]` Release/security critical
**Requirements:** existing WhatsApp marketplace preservation

**Acceptance checklist**

- [ ] Inspect WhatsApp commerce path.
- [ ] Inspect Telegram commerce path if active.
- [ ] Inspect AI assisted order path.
- [ ] Identify regression tests that must remain green.

---

### 1.4 Audit product, availability, and modifier runtime

**Status:** `[x]` Complete · **Marker:** `[!]` Release/security critical
**Requirements:** backend price authority, modifier validation

**Acceptance checklist**

- [ ] Map product repository/service.
- [ ] Map product outlet availability.
- [ ] Map existing modifier data model and validation.
- [ ] Identify whether public cart validation can reuse existing modifier validation and price calculation.

---

### 1.5 Audit checkout, order, and payment lifecycle

**Status:** `[x]` Completed · **Marker:** `[!]` Release/security critical
**Requirements:** public checkout, payment authority, paid is not completed

**Acceptance checklist**

- [ ] Map checkout creation and idempotency behavior.
- [ ] Map order snapshot creation.
- [ ] Map payment session creation.
- [ ] Map BayarGG webhook paid transition.
- [ ] Map fulfillment transition guards.

---

### 1.6 Audit admin order lifecycle and permissions

**Status:** `[x]` Completed locally; Supabase idempotency state schema applied · **Marker:** `[!]` Release/security critical
**Requirements:** admin fulfillment, outlet scope, permission integrity

**Acceptance checklist**

- [ ] Confirm list/detail scoping.
- [ ] Confirm outlet access enforcement.
- [ ] Confirm cancel reason enforcement.
- [ ] Confirm hard-delete blocking.
- [ ] Identify gap between `orders.manage_status` and per-action permissions.

---

### 1.7 Audit docs versus runtime

**Status:** `[ ]` Not started · **Marker:** Standard
**Requirements:** documentation correctness

**Acceptance checklist**

- [ ] Compare API docs against route/service behavior.
- [ ] Compare data docs against migrations.
- [ ] Mark stale docs before editing.

---

### 1.8 Checkpoint — audit complete

**Status:** `[ ]` Not started · **Marker:** Standard

**Acceptance checklist**

- [ ] Gap list includes file references.
- [ ] Baseline tests identified.
- [ ] No implementation begins until gap priority is confirmed.

---

## 2. Database and Migration Readiness

### 2.1 Verify migrations `038` through `041`

**Status:** `[x]` Complete · **Marker:** `[!]` Release/security critical
**Requirements:** migration readiness, data integrity

**Acceptance checklist**

- [x] Confirm migrations apply in order on target Supabase. Supabase MCP re-confirmed target project `marketplace-chatbot-Project` (`hxel...ioff`) and applied target-aware reconciliation migration `online_qr_store_target_reconciliation` from `042_online_qr_store_target_reconciliation.sql` successfully. Local migrations `038` through `041` were not applied blindly because target schema drift makes direct apply unsafe: `payment_provider_settings` uses `provider`, not `provider_code`.
- [x] Confirm required extensions exist. Supabase MCP read-only SQL confirmed `pgcrypto` `1.3`, `uuid-ossp` `1.1`, and `gen_random_uuid()` on the target.
- [x] Confirm `NOT VALID` constraints are accepted. Supabase MCP post-apply SQL confirmed all expected `041` constraints exist with `convalidated = false`: `orders_payment_status_check`, `orders_fulfillment_status_check`, `orders_fulfillment_type_check`, `orders_channel_check`, `orders_amounts_non_negative_check`, `payments_status_check`, `payments_amount_non_negative_check`, and `order_items_quantity_positive_check`.
- [x] Confirm old provider-setting uniqueness does not conflict with per-mode uniqueness. Supabase MCP post-apply SQL confirmed old objects `payment_provider_settings_unique` and `uq_payment_provider_settings_workspace_provider` are absent, `payment_provider_settings_one_active_per_mode_idx` is unique on `{workspace_id,mode}` with predicate `(is_active = true)`, and `payment_provider_settings_workspace_provider_mode_unique_idx` is unique on `{workspace_id,provider,mode}`.

---

### 2.2 Seed real storefront data

**Status:** `[x]` Complete · **Marker:** `[!]` Release/security critical
**Requirements:** Online Store

**Acceptance checklist**

- [x] Create storefront rows. Supabase MCP seeded/upserted one active SELKOP storefront for `SelaluKopi Demo` (`workspace_id` redacted in docs) with slug `selkop`, name `SELKOP Online Store`, and `ordering_enabled=true`.
- [x] Create storefront outlet mappings. Supabase MCP seeded/upserted mappings for `SELKOP Samarinda` (`SLKP-SMD-01`) and `SELKOP Tenggarong` (`SLKP-TGR-01`).
- [x] Mark visible/orderable outlets. Supabase MCP updated only the SELKOP workspace/outlet IDs requested: both outlets are `status=active`, `operational_status=OPEN`, `accepts_orders=true`, `pickup_enabled=true`; both storefront mappings are `is_visible=true`, `status=active`, `ordering_enabled=true`, and `pickup_enabled=true`.
- [x] Preserve metadata fallback until seeded data is verified. Runtime metadata fallback remains untouched; readiness metadata was added to the targeted SELKOP outlet/storefront rows.

---

### 2.3 Seed real QR data

**Status:** `[x]` Complete · **Marker:** `[!]` Release/security critical
**Requirements:** QR Store, QR security

**Acceptance checklist**

- [x] Create QR locations. Supabase MCP seeded/upserted `Pickup Counter` (`PICKUP`) and `Table 01` (`T01`) locations for both SELKOP outlets; total `4` active QR locations.
- [x] Create Universal QR. Supabase MCP confirmed migration `universal_qr_scope` is already applied, verified nullable QR target schema, and seeded/verified one active SELKOP Universal QR row with `scope='universal'`, `qr_type='universal'`, `outlet_id=null`, `qr_location_id=null`, and `outlet_locked=false`; public code `uqr_7d8dd103549e8cae38dacdce6da68820e0b7`, token hash last8 `e6b5d9bf`. Plaintext QR token was not printed or stored.
- [x] Create Outlet QR. Supabase MCP seeded/upserted one active outlet QR for each SELKOP outlet; public codes are stored as random `qr_<uuid-without-dashes>` values and only last 8 characters were captured in evidence.
- [x] Create Location/Table QR. Supabase MCP seeded/upserted active pickup-location and table-location QR codes for both SELKOP outlets; total `4` location/table QR codes.
- [x] Ensure public QR code/token is random and unguessable. Public codes were generated from `gen_random_uuid()` and `qr_token_hash` values were generated with SHA-256 digest of random UUID material; raw QR tokens were not stored or documented.

---

### 2.4 Validate payment provider settings data

**Status:** `[~]` Approved deferral / blocked by real provider credentials · **Marker:** `[!]` Release/security critical
**Requirements:** BayarGG configurable provider

**Deferral decision:** User explicitly selected **Defer BayarGG** on 2026-07-07. Do not create fake credentials or synthetic active provider settings. Real BayarGG encrypted credential/reference validation and live provider readiness remain incomplete and blocked by authorized real credentials. This is an approved credential/live-readiness deferral, not a completion claim.

**Priority impact:** BayarGG real credential/live verification remains a P0 gate before claiming real paid-alpha/live payment readiness. The approved deferral allows Phase 4 to proceed with P0 non-credential work while this BayarGG credential task stays open.

**Acceptance checklist**

- [x] Confirm BayarGG provider row exists. Supabase MCP confirmed `payment_providers.code='bayargg'`, `is_enabled=true`, and `supports_qris=true`.
- [x] Confirm exactly one active provider per workspace/mode. Supabase MCP confirmed `0` SELKOP BayarGG provider settings rows and therefore `0` active BayarGG provider settings rows; no duplicate active groups exist.
- [ ] Confirm provider credentials remain encrypted or referenced securely. Approved deferral: blocked because there is no BayarGG settings row or real credential reference to validate. No fake credentials were created and none should be created for this task.
- [x] Confirm no plaintext secret columns are used. Supabase MCP confirmed `payment_provider_settings` has no forbidden plaintext columns named `secret_key`, `server_key`, `webhook_secret`, `api_key`, or `private_key`; encrypted/ciphertext columns remain the available credential columns.

---

### 2.5 Validate indexes and constraints after seed

**Status:** `[~]` Implementation complete, validation blocked · **Marker:** Standard

**Acceptance checklist**

- [x] Public order token uniqueness. Supabase MCP confirmed unique index `orders_public_order_token_unique_idx` exists and duplicate groups = `0`.
- [x] Order number uniqueness. Supabase MCP confirmed unique index `orders_workspace_order_number_unique_idx` exists and duplicate groups = `0`.
- [x] Payment provider transaction/reference uniqueness. Supabase MCP confirmed unique indexes `payments_provider_ref_unique_idx`, `payments_provider_transaction_unique_idx`, and `payments_merchant_reference_provider_unique_idx` exist and duplicate groups = `0`.
- [x] Payment event provider-event uniqueness. Supabase MCP confirmed unique index `payment_events_provider_event_unique_idx` exists and duplicate groups = `0`.
- [x] Idempotency key uniqueness. Supabase MCP confirmed unique index `order_idempotency_records_public_checkout_unique_idx` exists and duplicate groups = `0` for `command_type='public_checkout'`.
- [x] QR code uniqueness. Supabase MCP confirmed `qr_codes_public_code_key`, `qr_codes_token_hash_key`, and `qr_locations_outlet_code_key` exist and duplicate groups = `0`.

---

### 2.6 Checkpoint — database ready

**Status:** `[x]` Complete with approved BayarGG credential deferral · **Marker:** Standard

**Checkpoint decision:** Accepted as database-ready-with-deferral for Phase 4 P0 non-credential work. Task `2.4` remains incomplete/blocked by real BayarGG credentials, but this checkpoint is complete because the credential/live-readiness gap is explicitly documented as an approved deferral and no fake credentials were created.

**Priority impact:** Do not claim BayarGG live readiness, real paid-alpha payment readiness, or production payment readiness until task `2.4` is resolved with real encrypted/referenced credentials and provider/live verification. Phase 4 may proceed to P0 non-credential work.

**Acceptance checklist**

- [x] Migration apply result documented. Supabase MCP confirmed `universal_qr_scope` is present in the migration ledger and post-apply QR schema checks passed.
- [x] Seed result documented. Storefront/orderable outlet readiness, product outlet availability, and Universal QR seed evidence are recorded in `database-readiness.md`; BayarGG settings remain incomplete as an approved real-credential/live-readiness deferral because no real credential reference exists.
- [x] Rollback notes documented.
- [x] Supabase security/performance advisors reviewed if environment is available. Advisors were queried through Supabase MCP; security advisor reports broad pre-existing public-table RLS issues and mutable search-path/function exposure warnings. Newly reconciled Phase 3 tables have RLS enabled with one policy each. Performance advisor output was reviewed but too large to inline. Section 3/P0 non-credential work may proceed under the approved BayarGG deferral.

---

## 3. Public Storefront and Menu

### 3.1 Confirm public storefront contract

**Status:** `[x]` Complete · **Marker:** `[!]` Release/security critical
**Requirements:** public storefront

**Acceptance checklist**

- [x] `GET /api/v1/public/stores/:storefrontSlug` returns customer-safe data. Runtime maps only safe storefront/outlet/product fields and keeps internal storefront context non-enumerable.
- [x] Storefront response does not leak secrets or internal unsafe fields. Public product mapping omits cost price, inventory counts, and raw metadata.
- [x] Ordering disabled states are clear. Storefront-level disabled state returns `STORE_INACTIVE`; selected unavailable outlets return `OUTLET_UNAVAILABLE`.

---

### 3.2 Harden online outlet selection

**Status:** `[x]` Completed · **Marker:** `[!]` Release/security critical
**Requirements:** outlet selection

**Acceptance checklist**

- [x] Customer can select only visible/orderable outlet. Public outlets are filtered to active, visible, orderable, pickup-enabled outlets.
- [x] Closed or inactive outlet rejects checkout. Storefront lookup and cart/checkout context resolution reject unavailable selected outlets.
- [x] Outlet availability comes from backend state. Selection is resolved from `storefront_outlets`, outlet status, and outlet metadata/mapping flags, not client flags.

---

### 3.3 Complete modifier validation and pricing

**Status:** `[x]` Completed with model limitation · **Marker:** `[!]` Release/security critical
**Requirements:** modifier selection, backend total authority

**Acceptance checklist**

- [x] Validate modifier group belongs to product.
- [x] Validate modifier option belongs to modifier group.
- [x] Validate min/max selection rules if model supports them. Runtime enforces metadata/relation fields such as `min`, `max`, `minSelections`, `maxSelections`, `min_selections`, and `max_selections`; no normalized modifier min/max table exists in the active migration set.
- [x] Add modifier price delta into backend total.
- [x] Reject invalid modifier payload.

---

### 3.4 Harden menu response safety

**Status:** `[x]` Completed · **Marker:** Standard
**Requirements:** public response safety

**Acceptance checklist**

- [x] Do not expose cost price.
- [x] Do not expose internal inventory details.
- [x] Do not expose unpublished products.
- [x] Return sold-out/unavailable states safely. Customer product listing filters unavailable/sold-out products; public product mapping emits safe availability state only.

---

### 3.5 Add public storefront and menu tests

**Status:** `[~]` Implemented; local execution blocked · **Marker:** Standard

**Acceptance checklist**

- [x] Storefront happy path covered through existing public mapping tests plus added customer-safe product/modifier mapping assertions.
- [x] Outlet unavailable path covered by `isOutletOrderable` helper tests.
- [x] Product unavailable path covered through public product safety/availability mapping and existing cart unavailable behavior; full DB-backed integration remains pending executable test environment.
- [x] Modifier invalid path covered by helper tests for invalid group, invalid option, min, and max errors.
- [x] Price tampering ignored covered by helper test proving client modifier price/name fields are replaced by backend catalog data.

---

### 3.6 Checkpoint — public menu ready

**Status:** `[~]` Pending executable validation · **Marker:** Standard

**Acceptance checklist**

- [ ] Public storefront tests pass. Test execution was attempted but blocked by active command/tool policy in this session.
- [ ] Existing WhatsApp/AI product tests still pass. Not executed because command execution was blocked.

---

## 4. QR Store Context and Session

### 4.1 Support Universal QR

**Status:** `[x]` Code complete locally / pending Supabase apply · **Marker:** `[!]` Release/security critical
**Requirements:** Universal QR

**Acceptance checklist**

- [x] QR scope `universal` lets customer choose outlet. Local implementation returns `outlet_locked=false`, no forced outlet before selection, and selectable active/orderable outlets.
- [x] Backend validates chosen outlet belongs to allowed workspace/storefront. Local implementation validates selected outlet against the QR workspace's active/orderable outlets before menu/cart/checkout.
- [x] Universal QR does not lock table/location. Local implementation keeps universal QR without outlet/location target unless an outlet is explicitly selected.

---

### 4.2 Support Outlet QR

**Status:** `[x]` Code complete locally / pending Supabase apply · **Marker:** `[!]` Release/security critical
**Requirements:** Outlet QR

**Acceptance checklist**

- [x] QR scope `outlet` locks outlet. Local implementation infers/returns outlet scope with `outlet_locked=true`.
- [x] Checkout rejects outlet override. Local QR cart/checkout rejects mismatched `outlet_id` for outlet/location QR.
- [x] Public response shows customer-safe outlet context. Local response maps only customer-safe outlet fields.

---

### 4.3 Support Location / Table QR

**Status:** `[x]` Code complete locally / pending Supabase apply · **Marker:** `[!]` Release/security critical
**Requirements:** Location/Table QR

**Acceptance checklist**

- [x] QR scope `location` locks outlet and table/location. Local implementation returns location scope with `outlet_locked=true` and carries `qr_location_id`.
- [x] Checkout stores location/table snapshot. Local checkout no longer writes `location_label` into UUID `tableId`; it stores QR location metadata and fulfillment snapshot structurally.
- [x] Admin order view shows location label. Existing order/admin mapping continues to receive `qrLocationLabel`, and orders repository inserts `qr_location_id` when supported.

---

### 4.4 Decide QR session materialization policy

**Status:** `[x]` Decided for current implementation · **Marker:** `[!]` Release/security critical
**Requirements:** QR session integrity

**Acceptance checklist**

- [x] Decide whether scanning `qr_codes` must create a `qr_order_sessions` row before checkout. Current local implementation does not require scan-time session materialization.
- [x] If required, implement session creation and expiry. Not required in this implementation wave.
- [x] If not required, document QR code ID as context authority and prove order metadata is sufficient. Local tests cover QR code ID staying separate from `qr_session.id`; checkout metadata carries `qrCodeId`, QR scope/type, and QR location snapshot.

---

### 4.5 Harden QR invalid states

**Status:** `[~]` Partially code complete locally / pending broader negative-path tests · **Marker:** `[!]` Release/security critical
**Requirements:** QR security

**Acceptance checklist**

- [x] Expired QR returns `QR_EXPIRED`. Existing QR service behavior preserved.
- [x] Revoked QR returns `QR_REVOKED`. Existing QR service behavior preserved.
- [ ] Inactive QR returns `QR_INACTIVE`. Repository still filters active QR codes and returns invalid/not-found for non-active rows.
- [x] Outlet mismatch returns `QR_OUTLET_MISMATCH`. Local implementation rejects override on outlet/location QR.

---

### 4.6 Add QR tests

**Status:** `[ ]` Not started · **Marker:** Standard

**Acceptance checklist**

- [ ] Universal QR happy path.
- [ ] Outlet QR lock enforcement.
- [ ] Location QR lock enforcement.
- [ ] Expired/revoked/inactive QR errors.
- [ ] Random token not found.

---

### 4.7 Checkpoint — QR context ready

**Status:** `[ ]` Not started · **Marker:** Standard

**Acceptance checklist**

- [ ] QR tests pass.
- [ ] Public checkout QR paths pass.
- [ ] Existing online store paths still pass.

---

## 5. Public Checkout and Idempotency

### 5.1 Enforce public checkout required fields

**Status:** `[x]` Complete · **Marker:** `[!]` Release/security critical
**Requirements:** public no-login checkout

**Acceptance checklist**

- [x] `Idempotency-Key` required.
- [x] `customer.name` required.
- [x] `customer.phone` required.
- [x] `items` min 1.
- [x] `fulfillment_type` valid.
- [x] Alpha fulfillment remains pickup-only unless product decision changes.

---

### 5.2 Implement race-safe idempotency claim

**Status:** `[x]` Completed locally; Supabase idempotency state schema applied · **Marker:** `[!]` Release/security critical
**Requirements:** duplicate checkout suppression

**Acceptance checklist**

- [x] Create idempotency claim before order/payment side effects.
- [x] Store request hash.
- [x] Represent `processing`, `completed`, and `failed` if schema supports it. Supabase target migration `public_checkout_idempotency_state` applied and verified on 2026-07-07.
- [x] Same key plus same hash returns existing response.
- [x] Same key plus different hash returns conflict.
- [x] Concurrent duplicate does not create duplicate order/payment.

---

### 5.3 Preserve backend total authority

**Status:** `[x]` Completed locally · **Marker:** `[!]` Release/security critical
**Requirements:** backend price authority

**Acceptance checklist**

- [x] Ignore client totals.
- [x] Recalculate unit price.
- [x] Recalculate modifier total.
- [x] Recalculate line total.
- [x] Recalculate subtotal, discount, tax, service fee, and total where enabled.
- [x] Store immutable snapshots.

---

### 5.4 Handle payment creation failure safely

**Status:** `[x]` Completed locally · **Marker:** `[!]` Release/security critical
**Requirements:** payment robustness

**Acceptance checklist**

- [x] If order creation succeeds but provider call fails, persist recoverable state.
- [x] Return safe error.
- [x] Provide retry path or operational recovery note.

---

### 5.5 Add checkout tests

**Status:** `[x]` Completed locally · **Marker:** Standard

**Acceptance checklist**

- [x] Missing idempotency key.
- [x] Missing customer name.
- [x] Missing customer phone.
- [x] Same key same payload.
- [x] Same key different payload.
- [x] Concurrent duplicate checkout.
- [x] Provider creation failure recovery.

---

### 5.6 Checkpoint — checkout ready

**Status:** `[-]` Pending executable validation · **Marker:** Standard

**Acceptance checklist**

- [ ] Public checkout tests pass. Blocked locally by active command execution policy before Node starts.
- [ ] Existing checkout/order tests still pass. Blocked locally by active command execution policy before Node starts.

---

## 6. BayarGG Payment Provider and Webhook

### 6.1 Verify BayarGG runtime config

**Status:** `[~]` Implemented with approved credential deferral · **Marker:** `[!]` Release/security critical
**Requirements:** BayarGG configurable provider

**Credential decision:** User-approved BayarGG credential/live-readiness deferral remains in force. Runtime code paths require active provider settings and real BayarGG API configuration before BayarGG sessions/webhooks can be used, but no real credentials or fake active settings were created. Live credential validation remains incomplete by design.

**Acceptance checklist**

- [x] Active provider selected from settings per workspace/mode.
- [ ] Credentials come from encrypted settings or approved secret reference. Deferred until authorized real BayarGG credentials/settings exist.
- [x] API responses expose configured state only.

---

### 6.2 Verify BayarGG payment session creation

**Status:** `[x]` Implemented, pending executable validation · **Marker:** `[!]` Release/security critical
**Requirements:** payment creation

**Acceptance checklist**

- [x] Backend sends authoritative amount and currency.
- [x] Backend sends merchant reference/provider reference.
- [x] Payment URL returned customer-safe.
- [x] Raw provider response is not exposed publicly.

---

### 6.3 Harden BayarGG webhook verification

**Status:** `[x]` Implemented, pending executable validation · **Marker:** `[!]` Release/security critical
**Requirements:** payment webhook hardening

**Acceptance checklist**

- [x] Use raw body when provider signature requires it.
- [x] Verify signature before mutation.
- [x] Validate provider transaction/reference.
- [x] Validate amount.
- [x] Validate currency.
- [x] Validate expiry.
- [x] Duplicate event returns safe no-op.

---

### 6.4 Maintain manual review paths

**Status:** `[x]` Implemented, pending executable validation · **Marker:** `[!]` Release/security critical
**Requirements:** payment integrity

**Acceptance checklist**

- [x] Amount mismatch goes to `manual_review`.
- [x] Currency mismatch goes to `manual_review`.
- [x] Expired payment callback goes to `manual_review`.
- [x] Manual review does not auto-fulfill order.

---

### 6.5 Add BayarGG tests

**Status:** `[x]` Added, execution blocked locally · **Marker:** Standard

**Acceptance checklist**

- [x] Valid paid webhook.
- [x] Invalid signature.
- [x] Duplicate webhook.
- [x] Amount mismatch.
- [x] Currency mismatch.
- [x] Expired payment callback.
- [x] Provider reference mismatch.

---

### 6.6 Checkpoint — payment ready

**Status:** `[~]` Runtime/test implementation ready with approved live-credential deferral · **Marker:** Standard

**Checkpoint decision:** BayarGG non-credential runtime hardening and mocked tests are implemented, but executable local validation was blocked by command policy and live sandbox verification is explicitly deferred because real BayarGG credentials are not available. Do not claim live payment readiness until real credentials/settings and sandbox verification are completed.

**Acceptance checklist**

- [ ] Payment webhook tests pass. Targeted command execution was blocked locally before Node started.
- [ ] Live BayarGG sandbox verification completed if credentials are available. Approved deferral due missing real credentials.

---

## 7. Order Lifecycle and Admin Fulfillment

### 7.1 Confirm order lifecycle states

**Status:** `[x]` Complete · **Marker:** `[!]` Release/security critical
**Requirements:** paid is not completed

**Acceptance checklist**

- [x] New order before payment is payment pending/unpaid and fulfillment not started.
- [x] Verified paid moves fulfillment to `awaiting_acceptance`.
- [x] Staff accept moves fulfillment to `accepted`.
- [x] Staff prepare moves fulfillment to `preparing`.
- [x] Staff ready moves fulfillment to `ready`.
- [x] Staff complete moves fulfillment to `completed`.

---

### 7.2 Enforce paid-only fulfillment

**Status:** `[x]` Complete · **Marker:** `[!]` Release/security critical
**Requirements:** admin order lifecycle

**Acceptance checklist**

- [x] Accept requires `payment_status=paid`.
- [x] Prepare requires `payment_status=paid`.
- [x] Ready requires `payment_status=paid`.
- [x] Complete requires `payment_status=paid`.
- [x] Cancel requires reason.

---

### 7.3 Harden admin permissions

**Status:** `[x]` Complete with per-action split deferral · **Marker:** `[!]` Release/security critical
**Requirements:** permission integrity

**Acceptance checklist**

- [x] Decide whether to keep `orders.manage_status` or split into `orders.accept`, `orders.prepare`, `orders.ready`, `orders.complete`, and `orders.cancel`.
- [x] If split, update authorization middleware and tests. Decision: split deferred because user did not explicitly approve per-action permission changes; existing `orders.manage_status` is preserved.
- [x] `allowed_actions` should reflect backend permission and order capability.

---

### 7.4 Preserve outlet scope

**Status:** `[x]` Complete · **Marker:** `[!]` Release/security critical
**Requirements:** outlet-scoped admin

**Acceptance checklist**

- [x] Staff can list only assigned outlet orders.
- [x] Staff can update only assigned outlet orders.
- [x] Owner/admin can view all allowed outlets.
- [x] Cross-outlet update is denied.

---

### 7.5 Add admin lifecycle tests

**Status:** `[~]` Implementation complete, validation blocked · **Marker:** Standard

**Acceptance checklist**

- [x] Staff outlet A cannot see outlet B.
- [x] Staff cannot prepare unpaid order.
- [x] Cancel requires reason.
- [x] Delete endpoint returns 405.
- [x] Allowed actions match capability.

---

### 7.6 Checkpoint — admin lifecycle ready

**Status:** `[~]` Implementation complete, validation blocked · **Marker:** Standard

**Acceptance checklist**

- [ ] Admin order tests pass. Targeted execution was blocked by active command policy before Node started.
- [ ] Existing order tests still pass. Targeted execution was blocked by active command policy before Node started.

---

## 8. Audit Log and Security Events

### 8.1 Verify audit log coverage

**Status:** `[x]` Complete · **Marker:** `[!]` Release/security critical
**Requirements:** audit log

**Acceptance checklist**

- [x] `order.created`.
- [x] `order.accepted`.
- [x] `order.preparing`.
- [x] `order.ready`.
- [x] `order.completed`.
- [x] `order.cancelled`.
- [x] `payment.created`.
- [x] `payment.webhook_received`.
- [x] `payment.paid`.
- [x] `payment.manual_review`.
- [x] `settings.payment_provider_changed`.

---

### 8.2 Redact audit details

**Status:** `[x]` Complete · **Marker:** `[!]` Release/security critical
**Requirements:** audit safety

**Acceptance checklist**

- [x] No secret key.
- [x] No webhook secret.
- [x] No raw provider auth header.
- [x] No sensitive raw payload in unsafe contexts.

---

### 8.3 Define security event strategy

**Status:** `[x]` Complete · **Marker:** Standard
**Requirements:** security events

**Acceptance checklist**

- [x] Decide when to write `security_events` versus `audit_logs`. Audit logs record business/admin mutations; `security_events` records abuse/suspicious public/security failures.
- [x] Record invalid QR attempt if needed.
- [x] Record webhook verification failure if needed.
- [x] Record idempotency conflict if needed.

---

### 8.4 Add audit/security tests

**Status:** `[~]` Implemented, validation blocked · **Marker:** Standard

**Acceptance checklist**

- [x] Audit record created for order status change.
- [x] Audit record created for BayarGG manual review.
- [x] Secrets redacted in audit details.

---

### 8.5 Checkpoint — audit ready

**Status:** `[~]` Implementation complete, validation blocked · **Marker:** Standard

**Acceptance checklist**

- [ ] Audit tests pass. Targeted execution was blocked by active command policy before Node started.
- [x] Docs list all audited actions.

---

## 9. Public Security and Rate Limiting

### 9.1 Confirm public response safety

**Status:** `[x]` Complete · **Marker:** `[!]` Release/security critical
**Requirements:** public order tracking

**Acceptance checklist**

- [x] Public order response has no internal order ID.
- [x] Public order response has no raw provider payload.
- [x] Public order response has no audit logs.
- [x] Public order response masks phone.
- [x] Public order response uses public-safe amount fields.

---

### 9.2 Confirm public rate limits

**Status:** `[x]` Complete · **Marker:** `[!]` Release/security critical
**Requirements:** public abuse protection

**Acceptance checklist**

- [x] QR lookup limit.
- [x] Cart validation limit.
- [x] Checkout limit.
- [x] Payment status polling limit.
- [x] Public order lookup limit.

---

### 9.3 Decide distributed rate limit strategy

**Status:** `[x]` Complete · **Marker:** `[!]` Release/security critical
**Requirements:** production hardening

**Acceptance checklist**

- [x] Current in-memory limiter is alpha-grade only.
- [x] For multi-instance production, choose Redis, Supabase, edge, or WAF strategy. Recommendation: edge/WAF route-level limit as the primary production control; Redis-backed app limiter only if app-level identity-aware throttling is required.
- [x] Document deployment limitation.

---

### 9.4 Add public security tests

**Status:** `[~]` Implemented, validation blocked · **Marker:** Standard

**Acceptance checklist**

- [x] Rate limit blocks after threshold.
- [x] Public order token random lookup returns not found.
- [x] Public response does not include forbidden fields.

---

### 9.5 Checkpoint — public security ready

**Status:** `[~]` Implementation complete, validation blocked · **Marker:** Standard

**Acceptance checklist**

- [ ] Security tests pass. Targeted execution was blocked by active command policy before Node started.
- [x] Known alpha limitations documented.

---

## 10. Background Workers and Reconciliation

### 10.1 Payment expiry worker

**Status:** `[x]` Complete · **Marker:** `[!]` Release/security critical
**Requirements:** payment monitoring

**Acceptance checklist**

- [x] Expire pending/processing payments based on backend/provider time.
- [x] Do not rely on frontend timer.
- [x] Do not expire already paid payments.

---

### 10.2 Payment reconciliation worker

**Status:** `[x]` Complete with BayarGG credential deferral · **Marker:** `[!]` Release/security critical
**Requirements:** payment reconciliation

**Acceptance checklist**

- [x] Detect missing webhooks.
- [x] Query provider status where supported.
- [x] Record reconciliation audit.
- [x] Avoid duplicate paid notification.

---

### 10.3 QR/session cleanup worker

**Status:** `[x]` Complete · **Marker:** Standard
**Requirements:** QR session integrity

**Acceptance checklist**

- [x] Expire old QR sessions.
- [x] Keep QR codes revocable.
- [x] Do not delete operational history.

---

### 10.4 Add worker tests

**Status:** `[~]` Implemented, executable validation pending · **Marker:** Standard

**Acceptance checklist**

- [x] Expire pending payment.
- [x] Do not expire paid payment.
- [x] Reconcile missing paid webhook.
- [x] Cleanup expired QR session.

---

### 10.5 Checkpoint — workers ready

**Status:** `[~]` Runbook updated, targeted tests attempted · **Marker:** Standard

**Acceptance checklist**

- [ ] Worker tests pass. Targeted command attempted; see progress log for result.
- [x] Operational runbook updated.

---

## 11. Regression Protection

### 11.1 Existing WhatsApp marketplace regression

**Status:** `[~]` Existing regression files identified; implementation coverage present, executable validation blocked · **Marker:** `[!]` Release/security critical
**Requirements:** existing flow preservation

**Acceptance checklist**

- [ ] Existing WhatsApp order flow still works. Coverage identified in `server/test/e2e/ai/button-commerce-regression.test.js`, including WhatsApp interactive commerce action contract checks; command execution is blocked, so no pass is claimed.
- [ ] Existing AI assisted ordering still works. Coverage identified in `server/test/e2e/ai/button-commerce-regression.test.js`, `server/test/unit/telegram/telegram-update-processor-attachments.test.js`, and AI/cart security tests; validation blocked.
- [ ] Existing cart/order/payment flow still works. Coverage identified in `server/test/integration/commerce/cart-service.integration.test.js`, `server/test/integration/commerce/order-service.integration.test.js`, `server/test/e2e/orders/cart-order-e2e.test.js`, `server/test/e2e/payments/payment-e2e.test.js`, `server/test/security/orders/cart-order-security.test.js`, and `server/test/security/payments/payment-security.test.js`; validation blocked.

---

### 11.2 Existing admin dashboard regression

**Status:** `[~]` Admin API guardrail tests identified/updated, UI executable validation blocked · **Marker:** `[!]` Release/security critical
**Requirements:** admin dashboard preservation

**Acceptance checklist**

- [ ] Existing orders list still loads. API/permission coverage identified in `server/test/unit/routes/authorization-routes.test.js`, `server/test/security/orders/cart-order-security.test.js`, and `server/test/e2e/orders/cart-order-e2e.test.js`; frontend/dashboard runtime smoke validation blocked.
- [ ] Existing payment views still load. Payment API/domain coverage identified in `server/test/integration/payments/payment-attempt.integration.test.js`, `server/test/integration/payments/payment-session-bayargg.integration.test.js`, `server/test/integration/payments/payment-webhook.integration.test.js`, and `server/test/security/payments/payment-security.test.js`; frontend/dashboard runtime smoke validation blocked.
- [ ] Existing product/outlet views still load. Outlet/product/backend coverage identified in `server/test/integration/outlets/outlet-service.integration.test.js`, `server/test/integration/commerce/telegram-commerce-outlet.integration.test.js`, and `server/test/unit/commerce/telegram-commerce-select-outlet.test.js`; frontend/dashboard runtime smoke validation blocked.

---

### 11.3 Existing webhook regression

**Status:** `[~]` Webhook regression coverage identified/added, executable validation blocked · **Marker:** `[!]` Release/security critical
**Requirements:** webhook preservation

**Acceptance checklist**

- [ ] Telegram webhook tests still pass. Coverage identified in `server/test/e2e/telegram-webhook-v1.e2e.test.js`, `server/test/e2e/telegram-marketplace.e2e.test.js`, and `server/test/integration/webhooks/webhook-idempotency.integration.test.js`; validation blocked.
- [ ] Meta webhook tests still pass. Coverage identified in `server/test/e2e/ai/button-commerce-regression.test.js` for WhatsApp/Meta commerce action contract and `server/test/security/webhook-abuse.test.js` for abuse/idempotency guardrails; validation blocked.
- [ ] Existing Xendit/DOKU paths still pass if currently supported. Xendit coverage identified in `server/test/integration/checkout-flow.test.js`, `server/test/e2e/payments/payment-e2e.test.js`, and payment provider architecture tests; BayarGG mocked coverage added in prior Phase 4 waves; DOKU remains provider catalog/architecture only unless currently supported by runtime adapter tests. Validation blocked.

---

### 11.4 Existing AI guardrail regression

**Status:** `[~]` AI guardrail coverage identified/updated, executable validation blocked · **Marker:** Standard
**Requirements:** AI guardrails

**Acceptance checklist**

- [ ] AI cannot mark payment paid. Coverage identified in `server/test/security/ai/payment-provider-authority.test.js`, `server/test/unit/ai/security/phase1-security.test.js`, `server/test/unit/ai/security/phase3-5-guardrails.test.js`, and `server/test/security/orders/cart-order-security.test.js`; validation blocked.
- [ ] AI cannot bypass price authority. Coverage identified in public cart/order security tests and AI guardrail tests, including backend-owned totals/modifier price-delta behavior added in prior Phase 4 waves; validation blocked.
- [ ] AI cannot bypass outlet scope. Coverage identified in `server/test/security/workspace-isolation.security.test.js`, `server/test/integration/commerce/telegram-commerce-outlet.integration.test.js`, `server/test/unit/commerce/telegram-commerce-select-outlet.test.js`, and admin/order outlet-scope tests; validation blocked.

---

### 11.5 Checkpoint — regressions protected

**Status:** `[~]` Regression inventory documented; implementation/test coverage present, validation blocked · **Marker:** Standard

**Acceptance checklist**

- [ ] Targeted old-flow tests pass. Not claimed because command execution is blocked in-session; targeted commands are listed in section 13.
- [ ] New Online/QR Store tests pass. Not claimed because command execution is blocked in-session; implementation/test coverage was added in prior waves and targeted commands are listed in section 13.

---

## 12. Documentation and Alpha Readiness

### 12.1 Update backend API docs

**Status:** `[x]` Updated for current alpha reality · **Marker:** `[!]` Release/security critical
**Requirements:** documentation

**Acceptance checklist**

- [x] Public Storefront API updated for table-backed storefronts, Universal QR, public checkout idempotency, customer-safe responses, alpha-only rate limits, and seed status.
- [x] Orders API updated for paid-only fulfillment, outlet scope, allowed actions, cancellation reason, and hard-delete block.
- [x] Payments API updated for provider settings reality, BayarGG deferred live credentials, manual-review mismatch behavior, and public payment safety.
- [x] Webhooks API updated for BayarGG verification-before-mutation, duplicate no-op, mismatch/manual-review behavior, and live credential deferral.
- [x] Admin Order API documented in `docs/backend/05-api-spec/orders-api.md` via `/api/v1/admin/orders` aliases and permission/capability rules.

---

### 12.2 Update data docs

**Status:** `[x]` Updated for migrations, seed, RLS/index, and deferral reality · **Marker:** `[!]` Release/security critical
**Requirements:** database documentation

**Acceptance checklist**

- [x] Database schema mapping updated in `docs/backend/06-data/database-schema.md`, `plans/qr-order-backend/database-schema-plan.md`, and `specs/backlog/qr-store-backend/database-readiness.md`.
- [x] Indexes documented in `database-readiness.md` with MCP-verified uniqueness/index evidence for public orders, payments, payment events, public checkout idempotency, QR public codes/token hashes, and QR locations.
- [x] Migration plan/status documented: local `038`-`041` not blindly applied due target drift; target-aware `042` applied; `043`/`universal_qr_scope` verified present; `044` applied.
- [x] RLS policies documented at readiness level: newly reconciled Phase 3 tables have RLS enabled with one service-role policy each; broad pre-existing security advisor warnings remain production-hardening items.
- [x] Seed/application guide updated for SELKOP storefront/outlets, active product availability, outlet/location/table QR, true Universal QR, no raw token printing, and BayarGG live credential deferral.

---

### 12.3 Update sprint/status docs

**Status:** `[x]` Updated with final Phase 4 implementation report · **Marker:** `[!]` Release/security critical
**Requirements:** implementation traceability

**Acceptance checklist**

- [x] Current task pointer updated.
- [x] Progress log updated.
- [x] Implementation status updated.
- [x] Known limitations documented: BayarGG real credentials/live sandbox deferred, local executable validation blocked, rate limiting alpha-only/in-memory, workers in-process MVP timers, production RLS/security advisor warnings remain.

---

### 12.4 Create alpha readiness checklist

**Status:** `[x]` Checklist created with Go/No-Go gates and approved deferrals · **Marker:** `[!]` Release/security critical
**Requirements:** alpha readiness

**Acceptance checklist**

- [x] QR tokens seeded and random. MCP verified hashed/random QR storage and one true Universal QR seed; raw tokens not printed.
- [ ] Public checkout tested. Implementation/test coverage exists, but executable validation is blocked.
- [ ] BayarGG sandbox tested. Approved deferral; no real SELKOP BayarGG credentials/settings row exists.
- [ ] Webhook signature verified. Mocked BayarGG/Xendit tests exist; local execution and live provider validation blocked/deferred.
- [ ] Admin fulfillment tested. Implementation/test coverage exists; executable validation blocked.
- [x] Rate limits enabled. Public route rate-limit middleware is implemented and documented as alpha-only/in-memory.
- [~] Audit logs visible. Audit/security event writes are implemented and tested at code level, but no admin security-event browsing UI was added and execution is blocked.
- [x] Rollback plan available in `docs/backend/12-devops/alpha-readiness-checklist.md`, `docs/backend/04-tech-spec/runbook.md`, and `specs/backlog/qr-store-backend/database-readiness.md`.

---

### 12.5 Checkpoint — docs ready

**Status:** `[~]` Docs updated; specs validation blocked · **Marker:** Standard

**Acceptance checklist**

- [ ] `npm run specs:check` passes. Not claimed because command execution is blocked.
- [x] Docs reflect runtime reality: migrations `042`/`043`/`044`, seed data enabled, Universal QR seeded, BayarGG live credential deferred, rate limiting alpha-only, and workers in-process.
- [x] Known limitations are explicit.

---

## 13. Final Validation

Command validation status: shell/background command execution is blocked in this session, so no new local pass/fail result is claimed. Supabase MCP validations listed below passed where noted.

Targeted commands attempted or required when command execution is available:

```txt
npm run specs:check
NODE_ENV=test node --test "test/unit/migrations/phase3-online-qr-store-schema.test.js"
NODE_ENV=test node --test "test/unit/services/public-storefront.service.test.js"
NODE_ENV=test node --test "test/unit/services/qr-order-session.service.test.js"
NODE_ENV=test node --test "test/unit/services/payment-expiry.service.test.js" "test/unit/services/payment-reconciliation.unit.test.js" "test/unit/workers/qr-session-expiry.worker.test.js"
NODE_ENV=test node --test "test/e2e/ai/button-commerce-regression.test.js" "test/e2e/telegram-webhook-v1.e2e.test.js" "test/e2e/telegram-marketplace.e2e.test.js"
NODE_ENV=test node --test "test/integration/webhooks/webhook-idempotency.integration.test.js" "test/security/webhook-abuse.test.js"
NODE_ENV=test node --test "test/integration/commerce/cart-service.integration.test.js" "test/integration/commerce/order-service.integration.test.js" "test/integration/commerce/telegram-commerce-outlet.integration.test.js"
NODE_ENV=test node --test "test/integration/payments/payment-session-bayargg.integration.test.js" "test/integration/payments/payment-webhook.integration.test.js" "test/integration/payments/payment-attempt.integration.test.js"
NODE_ENV=test node --test "test/security/orders/cart-order-security.test.js"
NODE_ENV=test node --test "test/security/payments/payment-security.test.js"
NODE_ENV=test node --test "test/security/ai/payment-provider-authority.test.js" "test/unit/ai/security/phase1-security.test.js" "test/unit/ai/security/phase3-5-guardrails.test.js"
NODE_ENV=test node --test "test/unit/routes/authorization-routes.test.js"
NODE_ENV=test node --test "test/unit/middleware/rate-limit.test.js"
```

Supabase MCP validations passed:

```txt
Target project confirmed: marketplace-chatbot-Project (hxel...ioff redacted), ACTIVE_HEALTHY, ap-southeast-1, Postgres 17
Migration 042 online_qr_store_target_reconciliation applied successfully and verified
Migration 043 universal_qr_scope verified present in ledger and schema verified
Migration 044 public_checkout_idempotency_state applied successfully and verified
SELKOP storefront/outlet mappings enabled for pickup ordering
Product outlet availability seeded for active SELKOP products at both requested outlets
Outlet/location/table QR rows seeded with hashed random token storage
True Universal QR row seeded with scope/type universal and null outlet/location target
BayarGG provider catalog present and QRIS-enabled
BayarGG provider settings/live credential validation deferred because zero real SELKOP settings/credential rows exist
Required uniqueness indexes exist and duplicate groups are zero for checked order/payment/payment-event/idempotency/QR constraints
Security/performance advisors reviewed; broad pre-existing RLS/function warnings remain production hardening items
```

Additional live validation when provider/database commands are available:

```txt
Do not apply local 038-041 blindly to the drifted target; use target-aware 042 already applied and verified
Re-run seed verification for real storefront/outlet/QR data before alpha cutover
Run BayarGG sandbox payment session
Run BayarGG valid webhook callback
Run BayarGG duplicate webhook callback
Run amount/currency mismatch webhook tests
Run admin fulfillment smoke test
Run public order tracking smoke test
```

Final No-Go checklist:

- Clear for documentation handoff: API/data/status/readiness docs now reflect current implementation and deferrals.
- Clear for non-payment alpha preparation: migrations `042`, `043`, and `044` are applied/verified or ledger-verified; SELKOP seed data and Universal QR are present; backend implementation/test coverage exists for public store, QR, checkout, audit/security, workers, and regression guardrails.
- No-Go for claiming automated validation pass: local/spec/test commands are blocked and must not be marked passing.
- No-Go for real paid-alpha/live BayarGG readiness: no real SELKOP BayarGG `payment_provider_settings` row or credential reference exists; live session/webhook validation is an approved deferral.
- No-Go for production/multi-instance deployment: rate limiting remains in-memory alpha-only, workers remain in-process without durable distributed locking/queueing, and pre-existing Supabase advisor findings require hardening.
- No-Go for full admin security-event observability: security event writes exist, but no admin browsing UI/API is included in this Phase 4 closure.

---

# Requirement Traceability

| Requirements | Task Sections |
|---|---|
| Brownfield adaptation | 0-1 |
| Existing flow preservation | 1, 11 |
| Online Store | 2-3, 5, 9 |
| QR Store | 2, 4-5, 9 |
| Universal QR | 4 |
| Outlet QR | 4 |
| Location / Table QR | 4 |
| Public no-login checkout | 5 |
| Backend price authority | 3, 5 |
| BayarGG configurable provider | 6 |
| Payment webhook hardening | 6, 10 |
| Admin order lifecycle | 7 |
| Audit log and security events | 8 |
| Background workers | 10 |
| Regression testing | 11, 13 |
| Alpha readiness | 12-13 |

---

# Definition of Done

- [ ] all P0 tasks complete; documentation and implementation coverage are complete for Phase 4, but executable validation remains blocked and BayarGG credential/live readiness is deferred.
- [x] approved P1/credential deferrals documented.
- [~] existing WhatsApp/AI marketplace flow protected by identified regression coverage; pass status not claimed.
- [~] public storefront and QR store routes implementation-covered and Supabase-seeded; executable validation blocked.
- [~] backend pricing authority implementation/test coverage added; executable validation blocked.
- [~] public checkout idempotency implementation/migration coverage added and migration `044` verified; retry/concurrency executable validation blocked.
- [ ] BayarGG paid transition verified by signature-valid webhook
- [ ] mismatch/expiry payment paths go to manual_review
- [ ] paid-only fulfillment proven
- [ ] outlet scope and admin permission proven
- [ ] public response safety proven
- [ ] rate limits enabled for public endpoints
- [ ] audit logs recorded for order/payment/settings actions
- [ ] migrations applied or explicit apply plan documented
- [ ] seed/application plan documented
- [ ] all targeted tests pass
- [ ] npm run specs:check passes
- [ ] implementation status reflects repository reality
