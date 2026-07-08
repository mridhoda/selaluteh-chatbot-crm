---
schema_version: 1
document_type: requirements
spec_id: selkop-phase-4-existing-backend-adaptation
title: SELKOP Phase 4 Existing Backend Audit & Implementation Adaptation Requirements
status: draft
version: 1.0.0
updated_at: 2026-07-07
---

# Requirements Document: SELKOP Phase 4 Existing Backend Audit & Implementation Adaptation

## Introduction

Dokumen ini mendefinisikan kebutuhan fungsional dan non-fungsional untuk **Phase 4 — Existing Backend Audit & Implementation Adaptation**.

Phase 4 tidak dimulai dari backend kosong.

Sistem existing sudah memiliki fondasi:

```text
AI WhatsApp Marketplace
Chatbot CRM
Marketplace
Product catalog
Cart / order flow
Payment flow
Admin dashboard
Kitchen / fulfillment flow
AI assisted ordering
```

Karena itu, Phase 4 harus menggunakan pendekatan:

```text
Audit existing docs.
Audit existing frontend.
Audit existing backend.
Map existing capability.
Decide reuse / extend / refactor / rebuild.
Implement only the gap.
Run regression tests.
Preserve existing WhatsApp marketplace flow.
```

Dokumen ini tidak menggantikan requirement backend existing untuk AI Agent, CRM, marketplace, product, cart, order, payment, inventory, workspace, outlet, platform integration, atau admin dashboard.

Dokumen ini hanya mengatur kebutuhan untuk mengadaptasi sistem existing agar dapat mendukung:

- Online Store;
- QR Store;
- Universal QR;
- Outlet QR;
- Location / Table QR;
- public no-login checkout;
- BayarGG as active configurable payment provider;
- payment webhook hardening;
- admin order lifecycle;
- audit log;
- security events;
- background workers;
- regression testing;
- alpha readiness.

Prinsip utama:

```text
Existing backend is the baseline.

Online Store and QR Store are new channels, not a separate backend.

Canonical backend services remain authoritative.

Frontend, QR, WhatsApp, and AI only send intent.

Backend validates, calculates, mutates, and audits.

Payment paid only comes from verified provider webhook or valid reconciliation.

Paid is not completed.

Existing WhatsApp Marketplace must not regress.
```

Backend tetap menjadi source of truth untuk:

```text
product price
modifier price
product availability
cart
checkout
order
payment
fulfillment
permission
audit
QR session
provider webhook validity
```

Frontend, AI, WhatsApp, dan QR public client tidak menjadi source of truth untuk:

```text
price
total
discount
payment paid
fulfillment status
order completed
provider webhook validity
admin permission
QR locked outlet
QR locked location
```

---

# Product Decisions

## Phase 4 Implementation Decision

Phase 4 menggunakan pendekatan:

```text
brownfield adaptation
```

Bukan:

```text
greenfield rewrite
```

Konsekuensinya:

```text
existing code harus dibaca sebelum coding
existing docs harus dibaca sebelum coding
existing database harus diaudit sebelum migration
existing services harus dipetakan sebelum membuat service baru
existing WhatsApp flow harus dilindungi regression test
```

## Existing Flow Preservation Decision

Flow existing yang wajib tetap berjalan:

```text
WhatsApp ordering
AI assisted order
existing marketplace catalog
existing cart/order/payment flow
existing admin dashboard
existing kitchen / fulfillment board
existing webhook integration
existing customer/contact model
```

## New Channel Decision

Phase 4 menambahkan channel baru:

```text
online_store
qr_store
```

Target `order_channel`:

```text
whatsapp
telegram
online_store
qr_store
```

Jika `telegram` belum aktif di existing system, field boleh disiapkan tetapi activation tidak wajib.

## Online Store Decision

Online Store MVP harus mendukung:

```text
public storefront
outlet selection
menu browsing
modifier selection
cart validation
checkout
payment creation
payment status polling
public order tracking
admin fulfillment processing
```

## QR Store Decision

QR Store MVP harus mendukung:

```text
Universal QR
Outlet QR
Location / Table QR
```

QR scope final:

```text
universal
outlet
location
```

Universal QR:

```text
customer memilih outlet
```

Outlet QR:

```text
outlet terkunci dari QR
```

Location QR:

```text
outlet dan table/location terkunci dari QR
```

## Payment Provider Decision

Provider aktif untuk SELKOP alpha:

```text
BayarGG
```

Namun payment architecture harus tetap provider-agnostic.

Field yang dilarang di core domain:

```text
bayargg_invoice_id
xendit_invoice_id
midtrans_token
```

Gunakan field netral:

```text
provider_code
provider_payment_id
provider_reference
provider_checkout_url
provider_raw_status
provider_metadata_json
```

## Payment Authority Decision

Payment hanya boleh menjadi `paid` melalui:

```text
verified provider webhook
valid server-to-server reconciliation
```

Tidak tersedia untuk alpha:

```text
frontend mark-paid
AI mark-paid
admin free manual mark-paid
localStorage mark-paid
payment success from redirect only
```

## Order Lifecycle Decision

Order lifecycle harus memisahkan:

```text
payment_status
fulfillment_status
public_order_status
```

Aturan final:

```text
Paid ≠ Completed.
Payment status ≠ Fulfillment status.
```

Admin fulfillment hanya bisa dilakukan jika:

```text
payment_status = paid
```

## Admin Action Decision

Admin order action harus explicit.

Gunakan action endpoints:

```http
POST /api/v1/admin/orders/:orderId/accept
POST /api/v1/admin/orders/:orderId/prepare
POST /api/v1/admin/orders/:orderId/ready
POST /api/v1/admin/orders/:orderId/complete
POST /api/v1/admin/orders/:orderId/cancel
```

Dilarang untuk operational order:

```http
PATCH /api/v1/admin/orders/:orderId
{
  "status": "completed"
}
```

## Public No-Login Decision

Online Store dan QR Store adalah public no-login flow.

Wajib menggunakan:

```text
opaque public token
unguessable QR token
unguessable public order token
idempotency key
rate limit
body size limit
schema validation
server-side price calculation
```

## Migration Decision

Database adaptation harus mengutamakan:

```text
additive migration
backfill
compatibility layer
safe rollback
```

Hindari:

```text
destructive migration
drop existing order data
rewrite historical payment
hard delete operational order
breaking rename without compatibility
```

---

# Architectural Baseline

| Area | Decision |
|---|---|
| Implementation mode | Brownfield adaptation |
| Existing system | AI WhatsApp Marketplace / CRM / Marketplace |
| Source of truth | Existing canonical backend services |
| Database | Existing PostgreSQL / Supabase boundary |
| New channels | `online_store`, `qr_store` |
| Existing channel preservation | WhatsApp flow must not regress |
| Payment provider | BayarGG active for SELKOP alpha |
| Payment architecture | Provider-agnostic adapter/resolver |
| QR scope | Universal, Outlet, Location |
| Public checkout | No-login, token-based, idempotent |
| Order lifecycle | Separate payment, fulfillment, and public status |
| Admin actions | Explicit action endpoints |
| Testing | Regression-first plus new QR/Online tests |
| Audit | Mandatory for payment/order/admin/settings/QR |
| Workers | Service-layer only, idempotent |
| Rollout | Feature-flagged, staged activation |

---

# Dependency Boundary

Phase 4 depends on existing backend domain contracts for:

```text
workspace
brand
outlet
storefront
product
category
modifier
product availability
cart
checkout
order
payment
invoice / receipt
customer / contact
admin user
role / permission
kitchen board
audit
notification
worker / queue
```

Phase 4 SHALL NOT create shadow implementations for existing domains.

Phase 4 MAY introduce or extend:

```text
QR code
QR session
public order token
provider-agnostic payment fields
payment webhook event
payment status history
order status history
audit log
security event
idempotency key
```

If an existing domain service is missing or unsafe, Phase 4 SHALL classify it as:

```text
reuse
extend
refactor
rebuild
```

---

# Glossary

- **Existing Backend**: Backend aplikasi AI WhatsApp Marketplace yang sudah ada.
- **Brownfield Adaptation**: Implementasi di atas sistem existing, bukan rewrite dari nol.
- **Canonical Service**: Service backend yang menjadi pemilik business logic resmi.
- **Channel**: Sumber order seperti WhatsApp, Online Store, atau QR Store.
- **Online Store**: Public web storefront tanpa login untuk customer.
- **QR Store**: Public ordering flow yang dimulai dari scan QR.
- **Universal QR**: QR tanpa outlet locked; customer memilih outlet.
- **Outlet QR**: QR yang mengunci satu outlet.
- **Location QR**: QR yang mengunci outlet dan table/location.
- **QR Session**: Session temporary yang menyimpan QR context untuk customer.
- **Public Order Token**: Token opaque untuk customer melihat order tanpa login.
- **Idempotency Key**: Header/key untuk mencegah duplicate checkout.
- **Payment Provider Service**: Service yang mengabstraksi provider payment.
- **BayarGG Adapter**: Adapter provider untuk BayarGG.
- **Webhook Event**: Event dari provider payment yang harus diverifikasi.
- **Payment Status**: Status pembayaran.
- **Fulfillment Status**: Status operasional pesanan.
- **Public Order Status**: Status yang aman ditampilkan ke customer.
- **Allowed Actions**: Daftar action admin yang valid berdasarkan state backend.
- **Audit Log**: Catatan perubahan penting untuk investigasi.
- **Security Event**: Catatan percobaan atau kondisi security-sensitive.
- **Regression Test**: Test untuk memastikan fitur existing tidak rusak.
- **Feature Flag**: Konfigurasi untuk mengaktifkan/mematikan fitur.
- **No-Go Condition**: Kondisi yang memblok alpha/frontend integration.

---

# Requirement Summary

| ID | Requirement | Priority |
|---|---|---|
| P4-R1 | Existing Docs and Repository Audit | P0 |
| P4-R2 | Existing Capability Mapping | P0 |
| P4-R3 | Reuse / Extend / Refactor / Rebuild Decision | P0 |
| P4-R4 | Existing WhatsApp Marketplace Regression Preservation | P0 |
| P4-R5 | Database Adaptation and Migration Safety | P0 |
| P4-R6 | Channel Expansion for Online Store and QR Store | P0 |
| P4-R7 | Public Storefront Backend Support | P0 |
| P4-R8 | QR Code and QR Session Domain | P0 |
| P4-R9 | QR Scope Validation | P0 |
| P4-R10 | Public Cart Validation | P0 |
| P4-R11 | Public Checkout Hardening and Idempotency | P0 |
| P4-R12 | Order Lifecycle Refactor | P0 |
| P4-R13 | Public Order Tracking | P0 |
| P4-R14 | Payment Provider Abstraction | P0 |
| P4-R15 | BayarGG Adapter | P0 |
| P4-R16 | Payment Webhook Hardening | P0 |
| P4-R17 | Payment Status and Amount Integrity | P0 |
| P4-R18 | Admin Order Action Hardening | P0 |
| P4-R19 | Product Availability and Modifier Validation | P0 |
| P4-R20 | Audit Log and Security Events | P0 |
| P4-R21 | Background Workers and Scheduler Alignment | P1 |
| P4-R22 | Public API Security | P0 |
| P4-R23 | Observability and Operational Logging | P1 |
| P4-R24 | Feature Flags and Rollout Control | P1 |
| P4-R25 | Regression and Alpha Readiness Testing | P0 |
| P4-R26 | Documentation Deliverables | P0 |
| P4-R27 | No-Go Gate Enforcement | P0 |

---

# Requirements

## P4-R1: Existing Docs and Repository Audit

**Priority:** P0

**User Story:** Sebagai development team, saya ingin membaca docs dan code existing sebelum implementasi agar perubahan Phase 4 tidak salah asumsi.

### Acceptance Criteria

1. THE Team SHALL membaca docs existing sebelum coding.
2. THE Team SHALL membaca frontend route dan component existing sebelum membuat public API baru.
3. THE Team SHALL membaca backend route/controller existing sebelum membuat endpoint baru.
4. THE Team SHALL membaca service existing sebelum membuat service baru.
5. THE Team SHALL membaca migration/schema existing sebelum membuat migration baru.
6. THE Team SHALL membaca payment/webhook implementation existing sebelum membuat BayarGG adapter.
7. THE Team SHALL membaca admin order flow existing sebelum mengubah lifecycle.
8. THE Team SHALL membaca kitchen board flow existing sebelum mengubah fulfillment status.
9. THE Team SHALL membaca AI WhatsApp ordering flow existing sebelum mengubah cart/order/payment domain.
10. THE Team SHALL membuat dokumen `04.0-existing-backend-audit.md`.
11. THE audit document SHALL mencantumkan docs yang ditemukan dan dibaca.
12. THE audit document SHALL mencantumkan frontend files yang relevan.
13. THE audit document SHALL mencantumkan backend services yang relevan.
14. THE audit document SHALL mencantumkan database tables yang relevan.
15. THE audit document SHALL mencantumkan existing order/payment/admin flow.
16. THE audit document SHALL mencantumkan reusable modules.
17. THE audit document SHALL mencantumkan risky modules.
18. THE audit document SHALL mencantumkan missing modules.
19. THE audit document SHALL mencantumkan regression risks.
20. THE Team SHALL NOT implement major Phase 4 code before audit is complete.

---

## P4-R2: Existing Capability Mapping

**Priority:** P0

**User Story:** Sebagai backend engineer, saya ingin memetakan target capability ke module existing agar tidak membuat duplicate business logic.

### Acceptance Criteria

1. THE Team SHALL membuat capability map untuk Phase 4.
2. Capability map SHALL mencakup product catalog.
3. Capability map SHALL mencakup cart.
4. Capability map SHALL mencakup checkout.
5. Capability map SHALL mencakup order lifecycle.
6. Capability map SHALL mencakup payment provider.
7. Capability map SHALL mencakup webhook.
8. Capability map SHALL mencakup admin order.
9. Capability map SHALL mencakup QR store.
10. Capability map SHALL mencakup audit log.
11. Capability map SHALL mencakup background workers.
12. Capability map SHALL mencantumkan existing module untuk setiap target capability.
13. Capability map SHALL mencantumkan gap untuk setiap target capability.
14. Capability map SHALL mencantumkan risk untuk setiap target capability.
15. Capability map SHALL mencantumkan owner service.
16. Capability map SHALL mencantumkan regression test.
17. Capability map SHALL disimpan sebagai `04.1-gap-analysis-implementation-map.md`.
18. Capability dengan missing owner SHALL tidak diimplementasikan secara tersebar.
19. Capability dengan existing owner SHALL menggunakan service owner tersebut.
20. Capability map SHALL diperbarui ketika ditemukan fakta baru saat audit.

---

## P4-R3: Reuse / Extend / Refactor / Rebuild Decision

**Priority:** P0

**User Story:** Sebagai tech lead, saya ingin setiap fitur diklasifikasikan agar implementasi tidak asal rewrite.

### Acceptance Criteria

1. THE Team SHALL mengklasifikasikan setiap target capability sebagai `reuse`, `extend`, `refactor`, atau `rebuild`.
2. `reuse` SHALL digunakan jika existing module aman dan memenuhi target invariant.
3. `extend` SHALL digunakan jika existing module bagus tetapi kurang field/route/adapter.
4. `refactor` SHALL digunakan jika existing module berjalan tetapi melanggar target rule.
5. `rebuild` SHALL digunakan hanya jika existing module unsafe atau incompatible.
6. Decision SHALL mencantumkan alasan.
7. Decision SHALL mencantumkan risk.
8. Decision SHALL mencantumkan implementation step.
9. Decision SHALL mencantumkan regression test.
10. Decision SHALL mencantumkan affected files bila diketahui.
11. Decision SHALL mencantumkan migration impact bila ada.
12. Decision SHALL tidak boleh hanya berdasarkan asumsi tanpa audit.
13. Rebuild decision SHALL membutuhkan justification lebih kuat.
14. Reuse decision SHALL tetap membutuhkan regression test.
15. Refactor decision SHALL mempertimbangkan compatibility layer.
16. Extend decision SHALL menghindari duplicate logic.
17. Decision matrix SHALL menjadi referensi task implementation.
18. Any changed decision SHALL diperbarui di docs.
19. Ambiguous decision SHALL diblok sampai audit cukup.
20. THE Team SHALL NOT create duplicate service ownership.

---

## P4-R4: Existing WhatsApp Marketplace Regression Preservation

**Priority:** P0

**User Story:** Sebagai business owner, saya ingin flow WhatsApp Marketplace existing tetap berjalan setelah Online Store dan QR Store ditambahkan.

### Acceptance Criteria

1. Existing WhatsApp order flow SHALL tetap dapat membuat order.
2. Existing AI assisted cart flow SHALL tetap dapat membaca dan mengubah cart.
3. Existing AI order confirmation flow SHALL tetap berjalan.
4. Existing product catalog flow SHALL tetap berjalan.
5. Existing payment flow SHALL tetap berjalan.
6. Existing webhook flow SHALL tetap berjalan atau memiliki compatibility adapter.
7. Existing admin order list SHALL tetap menampilkan order.
8. Existing kitchen board SHALL tetap menerima fulfillment status yang sesuai.
9. Existing customer/contact identity SHALL tidak rusak.
10. Existing invoice/receipt references SHALL tidak rusak.
11. Existing order history SHALL tidak dihapus.
12. Existing payment history SHALL tidak dihapus.
13. Existing WhatsApp orders SHOULD diberi `channel = whatsapp` melalui backfill jika field baru ditambahkan.
14. Existing tests SHALL dijalankan sebelum merge.
15. Jika existing tests belum ada, Phase 4 SHALL menambah minimal regression tests.
16. New public checkout code SHALL tidak bypass existing order service.
17. New QR flow SHALL tidak mengubah behavior WhatsApp cart tanpa alasan.
18. New payment provider config SHALL tidak mematikan provider existing tanpa feature flag.
19. Regression failure P0/P1 SHALL block alpha.
20. Rollback plan SHALL menjaga WhatsApp Marketplace tetap hidup.

---

## P4-R5: Database Adaptation and Migration Safety

**Priority:** P0

**User Story:** Sebagai developer, saya ingin migration Phase 4 aman agar data existing tidak hilang.

### Acceptance Criteria

1. THE System SHALL prefer additive migrations.
2. Migration SHALL not delete existing orders.
3. Migration SHALL not delete existing payments.
4. Migration SHALL not hard-delete operational history.
5. Migration SHALL preserve WhatsApp order history.
6. Migration SHALL preserve existing invoice/receipt references.
7. Migration SHALL add missing fields only after schema audit.
8. Migration SHALL use backfill for existing data where required.
9. Migration SHALL include indexes for public token lookups.
10. Migration SHALL include indexes for provider reference lookup.
11. Migration SHALL include indexes for QR public code/session token lookup.
12. Migration SHALL include constraints for unique provider reference within provider scope.
13. Migration SHOULD include constraints for one payment per order if target domain requires.
14. Migration SHALL include safe default for existing orders.
15. Migration SHALL not rename critical columns without compatibility layer.
16. Migration SHALL include rollback or disable plan.
17. Migration SHALL be tested on staging copy.
18. Migration SHALL document data mapping.
19. Migration SHALL avoid exposing sequential IDs in public API.
20. Migration SHALL be reviewed before alpha.

---

## P4-R6: Channel Expansion for Online Store and QR Store

**Priority:** P0

**User Story:** Sebagai platform, saya ingin Online Store dan QR Store menjadi channel resmi agar order bisa difilter dan diproses konsisten.

### Acceptance Criteria

1. THE System SHALL support `online_store` order channel.
2. THE System SHALL support `qr_store` order channel.
3. Existing WhatsApp orders SHALL remain supported.
4. If existing channel enum exists, migration SHALL extend it safely.
5. If existing source field exists, mapping SHALL be documented.
6. Order created from public storefront SHALL store `channel = online_store`.
7. Order created from QR flow SHALL store `channel = qr_store`.
8. Admin order list SHALL be able to filter by channel.
9. Analytics/logging SHALL include channel.
10. Channel SHALL not determine payment paid authority.
11. Channel SHALL not bypass product validation.
12. Channel SHALL not bypass order lifecycle.
13. Channel SHALL not bypass workspace scope.
14. Channel-specific context SHALL be stored as snapshot where required.
15. QR channel order SHALL store QR context.
16. Online store order SHALL store storefront context where available.
17. WhatsApp order SHALL continue to store contact/chat context.
18. Channel addition SHALL not require separate order table.
19. Channel behavior SHALL be covered in tests.
20. Unknown channel SHALL be rejected.

---

## P4-R7: Public Storefront Backend Support

**Priority:** P0

**User Story:** Sebagai customer, saya ingin membuka menu SELKOP dari web public tanpa login.

### Acceptance Criteria

1. THE System SHALL provide public storefront endpoint.
2. Endpoint SHALL be available under `/api/v1/public`.
3. Public storefront lookup SHALL use safe slug or public identifier.
4. Public storefront response SHALL include only public-safe fields.
5. Public storefront SHALL include active outlets where applicable.
6. Public storefront SHALL include active categories.
7. Public storefront SHALL include active products.
8. Public storefront SHALL include modifier groups/options if available.
9. Public storefront SHALL not expose cost price.
10. Public storefront SHALL not expose admin notes.
11. Public storefront SHALL not expose internal IDs if public token is required.
12. Product prices SHALL come from backend authoritative source.
13. Product availability SHALL be validated per outlet where required.
14. Inactive storefront SHALL not allow checkout.
15. Inactive outlet SHALL not allow checkout.
16. Disabled ordering outlet SHALL not allow checkout.
17. Public response SHALL be cache-safe according to freshness policy.
18. Public response SHALL include request ID.
19. Public endpoint SHALL be rate-limited.
20. Public endpoint SHALL be covered by API tests.

---

## P4-R8: QR Code and QR Session Domain

**Priority:** P0

**User Story:** Sebagai customer, saya ingin scan QR dan mendapatkan context store yang benar.

### Acceptance Criteria

1. THE System SHALL support QR codes.
2. QR code SHALL have `scope`.
3. QR code SHALL have `public_code` or equivalent unguessable token.
4. QR code SHALL have status.
5. QR code SHALL support universal scope.
6. QR code SHALL support outlet scope.
7. QR code SHALL support location scope.
8. QR code SHALL support source metadata.
9. QR code MAY have expiry.
10. QR code SHALL belong to workspace.
11. QR code SHALL not allow cross-workspace access.
12. QR scan SHALL create QR session.
13. QR session SHALL have `session_token`.
14. QR session SHALL have expiry.
15. QR session SHALL snapshot QR scope.
16. QR session SHALL store locked outlet when scope is outlet/location.
17. QR session SHALL store locked location when scope is location.
18. QR session SHALL store selected outlet when scope is universal.
19. QR session SHALL be completed after successful checkout.
20. Completed QR session SHALL not create another successful checkout.
21. Expired QR session SHALL not checkout.
22. Revoked QR SHALL not create new session.
23. QR scan SHALL be auditable or observable.
24. QR session token SHALL be unguessable.
25. QR domain SHALL be tested for all scopes.

---

## P4-R9: QR Scope Validation

**Priority:** P0

**User Story:** Sebagai owner outlet, saya ingin QR bound tidak bisa dimanipulasi ke outlet atau meja lain.

### Acceptance Criteria

1. Universal QR SHALL allow outlet selection.
2. Universal QR SHALL require selected outlet before checkout.
3. Universal QR selected outlet SHALL belong to same workspace.
4. Universal QR selected outlet SHALL be active.
5. Universal QR selected outlet SHALL have ordering enabled.
6. Outlet QR SHALL lock outlet.
7. Outlet QR SHALL not allow customer to change outlet.
8. Outlet QR checkout outlet SHALL match locked outlet.
9. Outlet QR mismatch SHALL return `QR_OUTLET_MISMATCH`.
10. Location QR SHALL lock outlet.
11. Location QR SHALL lock location/table.
12. Location QR checkout outlet SHALL match locked outlet.
13. Location QR checkout location SHALL match locked location.
14. Location QR mismatch SHALL return `QR_LOCATION_MISMATCH`.
15. QR expired SHALL return `QR_EXPIRED`.
16. QR revoked SHALL return `QR_REVOKED`.
17. QR not found SHALL return `QR_NOT_FOUND`.
18. QR validation SHALL happen server-side.
19. Frontend SHALL not be trusted for locked outlet/location.
20. QR mismatch attempt SHALL create security event.
21. QR context SHALL be stored on order snapshot.
22. QR location label SHALL be snapshotted on order.
23. QR validation SHALL run during checkout, not only scan.
24. QR scope SHALL be included in logs/analytics.
25. QR validation SHALL be covered by unit and E2E tests.

---

## P4-R10: Public Cart Validation

**Priority:** P0

**User Story:** Sebagai customer, saya ingin cart divalidasi sebelum checkout agar item dan harga benar.

### Acceptance Criteria

1. THE System SHALL provide public cart validation endpoint.
2. Cart validation SHALL accept product IDs, quantities, modifier choices, outlet, and QR session if applicable.
3. Cart validation SHALL recalculate price server-side.
4. Cart validation SHALL ignore frontend total as authority.
5. Cart validation SHALL validate product active status.
6. Cart validation SHALL validate outlet availability.
7. Cart validation SHALL validate product sold-out status.
8. Cart validation SHALL validate modifier group rules.
9. Cart validation SHALL validate modifier option active status.
10. Cart validation SHALL validate quantity minimum/maximum.
11. Cart validation SHALL validate outlet scope for QR session.
12. Cart validation SHALL return normalized cart summary.
13. Cart validation SHALL return errors per item where possible.
14. Cart validation SHALL not create final order.
15. Cart validation MAY create temporary validation session if existing architecture requires.
16. Cart validation SHALL not trust client price.
17. Cart validation SHALL be workspace-scoped.
18. Cart validation SHALL be rate-limited.
19. Cart validation SHALL produce safe public error messages.
20. Cart validation SHALL be covered by tests.

---

## P4-R11: Public Checkout Hardening and Idempotency

**Priority:** P0

**User Story:** Sebagai customer, saya ingin checkout tidak membuat pesanan ganda meskipun tombol diklik dua kali.

### Acceptance Criteria

1. Public checkout endpoint SHALL require `Idempotency-Key`.
2. Missing idempotency key SHALL return validation error.
3. Same idempotency key with same request SHALL return same result.
4. Same idempotency key with different request SHALL return `IDEMPOTENCY_CONFLICT`.
5. Checkout SHALL validate cart server-side.
6. Checkout SHALL recalculate total server-side.
7. Checkout SHALL validate product availability.
8. Checkout SHALL validate modifier rules.
9. Checkout SHALL validate outlet.
10. Checkout SHALL validate QR session if present.
11. Checkout SHALL create one order for one successful checkout.
12. Checkout SHALL create one payment for one successful checkout.
13. Checkout SHALL create order items snapshot.
14. Checkout SHALL create payment record.
15. Checkout SHALL create public order token.
16. Checkout SHALL create payment status history if required.
17. Checkout SHALL create audit log.
18. Checkout SHALL not mark payment paid.
19. Checkout SHALL not trust frontend payment status.
20. Checkout SHALL not trust frontend fulfillment status.
21. Checkout SHALL be atomic for local DB writes.
22. External provider call SHALL not cause duplicate local order.
23. Provider failure SHALL not create duplicate order on retry.
24. Checkout success response SHALL include payment URL or pending provider status as appropriate.
25. Checkout SHALL be covered by duplicate-click test.

---

## P4-R12: Order Lifecycle Refactor

**Priority:** P0

**User Story:** Sebagai admin outlet, saya ingin order memiliki status yang jelas antara pembayaran dan pengerjaan.

### Acceptance Criteria

1. THE System SHALL support `payment_status`.
2. THE System SHALL support `fulfillment_status`.
3. THE System SHALL support `public_order_status`.
4. Payment status SHALL not be reused as fulfillment status.
5. Fulfillment status SHALL not be reused as payment status.
6. Public order status SHALL be derived or mapped safely.
7. Paid order SHALL not automatically become completed.
8. Completed order SHALL not change payment state.
9. Admin fulfillment SHALL require paid payment.
10. Unpaid order SHALL not be accepted.
11. Accepted order MAY move to preparing.
12. Preparing order MAY move to ready.
13. Ready order MAY move to completed.
14. Invalid transitions SHALL return `ORDER_INVALID_TRANSITION`.
15. Cancel SHALL require reason.
16. Operational orders SHALL not be hard deleted.
17. Status history SHALL be recorded.
18. Order lifecycle SHALL preserve existing kitchen board behavior via mapping if needed.
19. Existing WhatsApp orders SHALL be backfilled/mapped safely.
20. Order lifecycle SHALL be covered by state machine tests.

---

## P4-R13: Public Order Tracking

**Priority:** P0

**User Story:** Sebagai customer, saya ingin melihat status order tanpa login menggunakan token aman.

### Acceptance Criteria

1. THE System SHALL provide public order status endpoint.
2. Endpoint SHALL use public order token.
3. Public order token SHALL be unguessable.
4. Public order token SHALL not be sequential.
5. Public order response SHALL include order number.
6. Public order response SHALL include public order status.
7. Public order response SHALL include safe payment status.
8. Public order response SHALL include safe fulfillment status.
9. Public order response SHALL include item snapshot.
10. Public order response MAY include outlet public info.
11. Public order response MAY include QR location label for table order.
12. Public order response SHALL not expose internal notes.
13. Public order response SHALL not expose raw provider payload.
14. Public order response SHALL not expose admin user data.
15. Public order response SHALL mask phone number if returned.
16. Public order response SHALL not allow mutation.
17. Endpoint SHALL be rate-limited.
18. Expired/invalid token SHALL return safe not found response.
19. Public order endpoint SHALL log view safely.
20. Public order endpoint SHALL be covered by security tests.

---

## P4-R14: Payment Provider Abstraction

**Priority:** P0

**User Story:** Sebagai platform, saya ingin payment provider bisa diganti tanpa mengubah order core.

### Acceptance Criteria

1. THE System SHALL provide PaymentProviderService or equivalent.
2. THE System SHALL provide provider resolver.
3. Provider resolver SHALL determine active provider per workspace/mode.
4. Payment core SHALL store `provider_code`.
5. Payment core SHALL store provider reference using neutral field.
6. Payment core SHALL store provider payment ID using neutral field.
7. Payment core SHALL store provider payment URL using neutral field.
8. Payment core SHALL store raw status using neutral field.
9. Payment core MAY store provider metadata JSON.
10. Payment core SHALL not hardcode BayarGG in order table.
11. Payment core SHALL not hardcode Xendit in order table.
12. Provider adapter SHALL normalize status.
13. Provider adapter SHALL normalize errors.
14. Provider settings SHALL store secret references safely.
15. Secret values SHALL not be returned by admin API.
16. Provider activation SHALL require permission.
17. Provider setting changes SHALL be audited.
18. Existing provider integration SHALL be mapped before refactor.
19. Provider unavailable SHALL return safe error.
20. Provider abstraction SHALL be tested with mocked provider.

---

## P4-R15: BayarGG Adapter

**Priority:** P0

**User Story:** Sebagai SELKOP, saya ingin checkout bisa membuat pembayaran melalui BayarGG.

### Acceptance Criteria

1. THE System SHALL implement BayarGG adapter.
2. BayarGG adapter SHALL implement create payment.
3. BayarGG adapter SHALL implement webhook verification.
4. BayarGG adapter SHALL implement webhook parsing.
5. BayarGG adapter SHALL implement payment status lookup if API supports it.
6. BayarGG adapter SHALL map provider statuses to internal enum.
7. BayarGG adapter SHALL not update order directly.
8. BayarGG adapter SHALL not mark payment paid outside PaymentProviderService.
9. BayarGG adapter SHALL not change fulfillment status.
10. BayarGG adapter SHALL not expose secret in logs.
11. BayarGG adapter SHALL use workspace provider config.
12. BayarGG adapter SHALL handle timeout.
13. BayarGG adapter SHALL handle invalid response.
14. BayarGG adapter SHALL return normalized errors.
15. BayarGG sandbox/test mode SHALL be supported for alpha.
16. BayarGG payment URL/QRIS data SHALL be stored in neutral payment fields.
17. BayarGG provider references SHALL be unique in provider scope.
18. BayarGG adapter SHALL be covered by unit tests.
19. BayarGG sandbox flow SHALL be covered by integration/manual test.
20. BayarGG failure SHALL not create duplicate order/payment.

---

## P4-R16: Payment Webhook Hardening

**Priority:** P0

**User Story:** Sebagai platform, saya ingin webhook payment aman dari replay, duplicate, dan signature palsu.

### Acceptance Criteria

1. THE System SHALL provide webhook endpoint under `/api/v1/webhooks/payments/:providerCode`.
2. Webhook endpoint SHALL route to provider adapter.
3. Webhook endpoint SHALL verify signature.
4. Invalid signature SHALL not update payment.
5. Missing signature SHALL not update payment.
6. Webhook raw event SHALL be stored safely where appropriate.
7. Webhook event SHALL have idempotency/dedupe key.
8. Duplicate webhook SHALL not duplicate payment history.
9. Duplicate webhook SHALL not duplicate audit log.
10. Duplicate webhook SHALL not send duplicate notification.
11. Webhook SHALL parse provider reference.
12. Webhook SHALL find payment by provider scope/reference.
13. Unknown provider reference SHALL not mutate payment.
14. Webhook SHALL validate amount.
15. Webhook SHALL validate currency.
16. Webhook SHALL validate state transition.
17. Webhook SHALL update payment through service/state machine.
18. Webhook SHALL update public order status if payment becomes paid/failed/expired.
19. Webhook SHALL record payment status history.
20. Webhook SHALL record audit log.
21. Invalid webhook SHALL record security event.
22. Amount mismatch SHALL record security event.
23. Currency mismatch SHALL record security event.
24. Webhook processing SHALL be idempotent.
25. Webhook hardening SHALL be covered by tests.

---

## P4-R17: Payment Status and Amount Integrity

**Priority:** P0

**User Story:** Sebagai owner, saya ingin payment amount yang dibayar sama dengan order amount sebelum dianggap paid.

### Acceptance Criteria

1. Payment amount SHALL be calculated by backend.
2. Payment currency SHALL be stored.
3. Provider paid amount SHALL be validated.
4. Provider paid currency SHALL be validated.
5. Amount mismatch SHALL not become paid.
6. Amount mismatch SHOULD become `manual_review`.
7. Currency mismatch SHALL not become paid.
8. Currency mismatch SHOULD become `manual_review`.
9. Provider reference mismatch SHALL not update payment.
10. Payment already paid SHALL not be downgraded by stale failed webhook without valid transition rule.
11. Payment expired SHALL not become paid unless reconciliation verifies valid provider state and rule allows.
12. Payment status transitions SHALL be explicit.
13. Payment status history SHALL be recorded once per transition.
14. Payment paid event SHALL be auditable.
15. Payment manual review event SHALL be auditable.
16. Frontend SHALL not submit paid status.
17. Admin normal order flow SHALL not manually mark paid during alpha.
18. AI SHALL not mark paid.
19. Payment status polling SHALL be read-only.
20. Payment integrity SHALL be covered by amount mismatch tests.

---

## P4-R18: Admin Order Action Hardening

**Priority:** P0

**User Story:** Sebagai admin outlet, saya ingin hanya melihat action yang valid dan tidak bisa memproses order unpaid.

### Acceptance Criteria

1. Admin order response SHALL include `allowed_actions`.
2. Allowed actions SHALL be computed by backend.
3. Admin frontend SHALL not guess transitions.
4. Admin accept endpoint SHALL require paid payment.
5. Admin prepare endpoint SHALL require valid previous fulfillment state.
6. Admin ready endpoint SHALL require valid previous fulfillment state.
7. Admin complete endpoint SHALL require valid previous fulfillment state.
8. Admin cancel endpoint SHALL require reason.
9. Admin actions SHALL enforce workspace scope.
10. Admin actions SHALL enforce outlet scope.
11. Admin actions SHALL enforce permission.
12. Admin actions SHALL create order status history.
13. Admin actions SHALL create audit log.
14. Admin actions SHALL reject invalid transitions.
15. Admin actions SHALL reject unpaid order processing.
16. Admin actions SHALL not hard delete order.
17. Admin actions SHALL be explicit endpoints.
18. Generic PATCH status SHALL not be used for operational transitions.
19. Existing admin UI SHALL remain compatible or be adapted with mapping.
20. Admin hardening SHALL be covered by integration tests.

---

## P4-R19: Product Availability and Modifier Validation

**Priority:** P0

**User Story:** Sebagai customer, saya ingin hanya bisa checkout produk dan modifier yang tersedia di outlet yang benar.

### Acceptance Criteria

1. Product active status SHALL be validated.
2. Product availability SHALL be validated per outlet.
3. Sold-out product SHALL not checkout.
4. Product unavailable in selected outlet SHALL not checkout.
5. Modifier group active status SHALL be validated.
6. Modifier option active status SHALL be validated.
7. Required modifier group SHALL be enforced.
8. Modifier min selection SHALL be enforced.
9. Modifier max selection SHALL be enforced.
10. Modifier price SHALL be calculated by backend.
11. Product price snapshot SHALL be stored on order item.
12. Modifier price snapshot SHALL be stored on order item.
13. Product name snapshot SHALL be stored on order item.
14. Modifier label snapshot SHALL be stored on order item.
15. Existing order snapshot SHALL not change when product changes.
16. Product availability update SHALL affect only relevant outlet if scoped.
17. Public storefront SHALL hide or mark unavailable products based on policy.
18. Cart validation SHALL return product unavailable errors.
19. Checkout SHALL revalidate even if cart was validated earlier.
20. Availability and modifier validation SHALL be covered by tests.

---

## P4-R20: Audit Log and Security Events

**Priority:** P0

**User Story:** Sebagai operator, saya ingin semua aksi penting bisa diaudit saat terjadi masalah.

### Acceptance Criteria

1. THE System SHALL provide audit logging for critical actions.
2. Audit SHALL record order created.
3. Audit SHALL record order accepted.
4. Audit SHALL record order preparing.
5. Audit SHALL record order ready.
6. Audit SHALL record order completed.
7. Audit SHALL record order cancelled.
8. Audit SHALL record payment created.
9. Audit SHALL record payment paid.
10. Audit SHALL record payment failed.
11. Audit SHALL record payment expired.
12. Audit SHALL record payment manual review.
13. Audit SHALL record QR scanned or QR session created where appropriate.
14. Audit SHALL record QR revoked.
15. Audit SHALL record product availability changed.
16. Audit SHALL record payment provider setting changed.
17. Security event SHALL record invalid webhook signature.
18. Security event SHALL record amount mismatch.
19. Security event SHALL record currency mismatch.
20. Security event SHALL record unknown provider reference.
21. Security event SHALL record QR outlet mismatch.
22. Security event SHALL record QR location mismatch.
23. Security event SHALL record idempotency conflict.
24. Security event SHALL record unauthorized admin action.
25. Audit/security logs SHALL redact secrets.
26. Audit/security logs SHALL include request ID where available.
27. Audit/security logs SHALL be workspace-scoped when applicable.
28. Audit/security APIs SHALL be permission-controlled.
29. Audit failure SHALL not expose internal details.
30. Audit/security events SHALL be covered by tests.

---

## P4-R21: Background Workers and Scheduler Alignment

**Priority:** P1

**User Story:** Sebagai operator, saya ingin expiry, reconciliation, dan retry berjalan otomatis tanpa bypass business rules.

### Acceptance Criteria

1. THE System SHALL audit existing worker/scheduler system before adding new workers.
2. Worker implementation SHALL align with existing queue/cron approach.
3. ExpireCheckoutSessionWorker SHOULD exist or equivalent behavior SHALL exist.
4. ExpireQRSessionWorker SHOULD exist or equivalent behavior SHALL exist.
5. ExpirePaymentWorker SHOULD exist or equivalent behavior SHALL exist.
6. PaymentReconciliationWorker SHOULD exist for stuck pending payments.
7. WebhookEventProcessorWorker MAY be used if webhook processing async.
8. NotificationRetryWorker SHOULD exist if notifications are sent.
9. CleanupWorker SHOULD exist for expired sessions/log retention.
10. Worker SHALL call service layer.
11. Worker SHALL not bypass state machine.
12. Worker SHALL be idempotent.
13. Worker SHALL use safe locking or dedupe.
14. Worker SHALL not mark payment paid without provider verification.
15. Worker SHALL not complete fulfillment automatically.
16. Worker SHALL record safe logs/metrics.
17. Worker SHALL support retry.
18. Worker SHALL support max attempts/dead letter.
19. Worker SHALL be covered by tests for duplicate execution.
20. Worker failure SHALL be observable.

---

## P4-R22: Public API Security

**Priority:** P0

**User Story:** Sebagai platform, saya ingin public endpoints aman karena tidak memakai login customer.

### Acceptance Criteria

1. Public endpoints SHALL be rate-limited.
2. Public endpoints SHALL enforce request body size limit.
3. Public endpoints SHALL validate schema.
4. Public endpoints SHALL use safe CORS policy.
5. Public endpoints SHALL not expose internal IDs where avoidable.
6. Public endpoints SHALL not expose admin notes.
7. Public endpoints SHALL not expose raw payment provider payload.
8. Public endpoints SHALL not expose payment secrets.
9. Public endpoints SHALL not expose webhook secrets.
10. Public endpoints SHALL not expose full customer phone unnecessarily.
11. Public order token SHALL be unguessable.
12. QR token SHALL be unguessable.
13. QR session token SHALL be unguessable.
14. Sensitive token SHOULD be hashed at rest where feasible.
15. Public checkout SHALL not accept payment status.
16. Public checkout SHALL not accept fulfillment status.
17. Public checkout SHALL not accept final total as authority.
18. Public payment status endpoint SHALL be read-only.
19. Public error messages SHALL be safe.
20. Public API security SHALL be covered by tests.

---

## P4-R23: Observability and Operational Logging

**Priority:** P1

**User Story:** Sebagai developer, saya ingin melihat alur checkout/payment/QR dengan request ID agar mudah debugging.

### Acceptance Criteria

1. THE System SHALL include request ID in public/admin/webhook responses.
2. THE System SHALL log public storefront viewed.
3. THE System SHALL log QR scanned.
4. THE System SHALL log QR session created.
5. THE System SHALL log cart validated.
6. THE System SHALL log checkout started.
7. THE System SHALL log checkout failed.
8. THE System SHALL log checkout completed.
9. THE System SHALL log payment created.
10. THE System SHALL log payment paid.
11. THE System SHALL log payment failed.
12. THE System SHALL log payment expired.
13. THE System SHALL log webhook received.
14. THE System SHALL log invalid webhook signature.
15. THE System SHALL log duplicate webhook ignored.
16. THE System SHALL log admin order accepted/preparing/ready/completed.
17. Logs SHALL include safe fields only.
18. Logs SHALL not include provider secret.
19. Logs SHALL not include full authorization header.
20. Logs SHALL not include plaintext sensitive public token.
21. Metrics SHOULD include checkout success rate.
22. Metrics SHOULD include webhook failure rate.
23. Metrics SHOULD include payment pending duration.
24. Metrics SHOULD include duplicate checkout conflict count.
25. Metrics SHOULD include QR scan conversion.
26. Observability SHALL not change business state.
27. Logging failure SHALL not expose secrets.
28. Error logs SHALL include error code.
29. Operational dashboard MAY be added later.
30. Observability SHALL be documented.

---

## P4-R24: Feature Flags and Rollout Control

**Priority:** P1

**User Story:** Sebagai operator, saya ingin bisa mengaktifkan Online Store dan QR Store secara bertahap.

### Acceptance Criteria

1. THE System SHOULD support `online_store_enabled`.
2. THE System SHOULD support `qr_store_enabled`.
3. THE System SHOULD support `public_checkout_enabled`.
4. THE System SHOULD support `bayargg_enabled`.
5. THE System SHOULD support `webhook_worker_enabled`.
6. THE System SHOULD support `payment_reconciliation_enabled`.
7. THE System SHOULD support `admin_order_action_guard_enabled`.
8. Feature flags SHALL be workspace or environment scoped where appropriate.
9. Disabled online store SHALL not allow new checkout.
10. Disabled QR store SHALL not create new QR session.
11. Disabled public checkout SHALL not create order.
12. Disabled BayarGG SHALL not create BayarGG payment.
13. Disabling new features SHALL not break WhatsApp Marketplace.
14. Feature flag changes SHALL be audited if admin-controlled.
15. Rollout SHALL begin in staging.
16. Rollout SHALL use sandbox payment first.
17. Rollout SHALL test webhook before alpha.
18. Rollout SHALL have rollback plan.
19. Rollback SHALL not delete orders/payments.
20. Rollout/flags SHALL be documented.

---

## P4-R25: Regression and Alpha Readiness Testing

**Priority:** P0

**User Story:** Sebagai engineering team, saya ingin yakin backend siap untuk frontend integration dan alpha.

### Acceptance Criteria

1. THE System SHALL have regression tests for existing WhatsApp order.
2. THE System SHALL have regression tests for AI cart mutation if existing.
3. THE System SHALL have regression tests for existing product catalog.
4. THE System SHALL have regression tests for existing admin order list.
5. THE System SHALL have regression tests for existing kitchen board.
6. THE System SHALL have regression tests for existing payment flow.
7. THE System SHALL have regression tests for existing webhook flow.
8. THE System SHALL have Universal QR E2E test.
9. THE System SHALL have Outlet QR E2E test.
10. THE System SHALL have Location QR E2E test.
11. THE System SHALL have duplicate checkout test.
12. THE System SHALL have duplicate webhook test.
13. THE System SHALL have invalid webhook signature test.
14. THE System SHALL have admin cannot process unpaid order test.
15. THE System SHALL have amount mismatch manual review test.
16. THE System SHALL have product availability per outlet test.
17. THE System SHALL have public order token privacy test.
18. THE System SHALL have checkout rollback/failure test.
19. P0/P1 bugs SHALL block alpha.
20. Test results SHALL be documented honestly.

---

## P4-R26: Documentation Deliverables

**Priority:** P0

**User Story:** Sebagai team, saya ingin setiap subphase punya dokumen agar implementasi bisa diaudit.

### Acceptance Criteria

1. THE Team SHALL create `04.0-existing-backend-audit.md`.
2. THE Team SHALL create `04.1-gap-analysis-implementation-map.md`.
3. THE Team SHOULD create `04.2-database-adaptation.md`.
4. THE Team SHOULD create `04.3-service-mapping.md`.
5. THE Team SHOULD create `04.4-order-lifecycle-refactor.md`.
6. THE Team SHOULD create `04.5-channel-expansion.md`.
7. THE Team SHOULD create `04.6-qr-store-extension.md`.
8. THE Team SHOULD create `04.7-checkout-hardening.md`.
9. THE Team SHOULD create `04.8-payment-provider-hardening.md`.
10. THE Team SHOULD create `04.9-webhook-hardening.md`.
11. THE Team SHOULD create `04.10-admin-order-hardening.md`.
12. THE Team SHOULD create `04.11-audit-security-events.md`.
13. THE Team SHOULD create `04.12-background-worker-alignment.md`.
14. THE Team SHOULD create `04.13-regression-testing-stabilization.md`.
15. Documentation SHALL include audit results.
16. Documentation SHALL include implementation decisions.
17. Documentation SHALL include migration impact.
18. Documentation SHALL include test plan.
19. Documentation SHALL be updated after implementation changes.
20. Documentation SHALL be considered part of Definition of Done.

---

## P4-R27: No-Go Gate Enforcement

**Priority:** P0

**User Story:** Sebagai owner, saya ingin alpha diblok jika masih ada risiko payment/order/security kritis.

### Acceptance Criteria

1. THE System SHALL not proceed to alpha if frontend can mark payment paid.
2. THE System SHALL not proceed to alpha if admin can complete unpaid order.
3. THE System SHALL not proceed to alpha if duplicate checkout creates duplicate order.
4. THE System SHALL not proceed to alpha if invalid webhook can update payment.
5. THE System SHALL not proceed to alpha if QR outlet mismatch is not blocked.
6. THE System SHALL not proceed to alpha if QR location mismatch is not blocked.
7. THE System SHALL not proceed to alpha if amount mismatch becomes paid.
8. THE System SHALL not proceed to alpha if public order token is guessable.
9. THE System SHALL not proceed to alpha if existing WhatsApp order flow breaks.
10. THE System SHALL not proceed to alpha if order/payment/cart logic is duplicated outside canonical service.
11. THE System SHALL not proceed to alpha if audit log is missing for payment/order/settings.
12. THE System SHALL not proceed to alpha if BayarGG sandbox cannot create payment.
13. THE System SHALL not proceed to alpha if valid webhook cannot mark payment paid.
14. THE System SHALL not proceed to alpha if invalid webhook is not rejected.
15. THE System SHALL not proceed to alpha if public checkout does not use idempotency.
16. THE System SHALL not proceed to alpha if critical migration is destructive.
17. THE Team SHALL maintain No-Go checklist.
18. No-Go checklist SHALL be reviewed before frontend integration.
19. No-Go checklist SHALL be reviewed before alpha.
20. No-Go exception SHALL require explicit documented approval.

---

# Cross-Cutting Correctness Properties

## Property 1: Audit-First Implementation

*For any* Phase 4 implementation task, relevant docs and existing code SHALL be audited before coding.

## Property 2: Existing Flow Preservation

*For any* Phase 4 change, existing WhatsApp Marketplace flow SHALL remain functional.

## Property 3: Canonical Service Ownership

*For any* business mutation, canonical backend service SHALL own the rule and execution.

## Property 4: No Duplicate Business Logic

*For any* public or QR flow, logic SHALL not duplicate price/order/payment rules outside canonical services.

## Property 5: Additive Migration Safety

*For any* database change, existing operational data SHALL not be destroyed.

## Property 6: Public Checkout Idempotency

*For any* duplicate public checkout request with the same idempotency key and same payload, at most one successful order/payment SHALL exist.

## Property 7: Payment Authority

*For any* payment marked paid, the source SHALL be verified webhook or valid reconciliation.

## Property 8: Paid Is Not Completed

*For any* paid order, fulfillment completion SHALL still require valid fulfillment transition.

## Property 9: Admin Fulfillment Guard

*For any* admin fulfillment action, payment status SHALL be paid.

## Property 10: QR Universal Outlet Selection

*For any* Universal QR checkout, selected outlet SHALL be validated by backend.

## Property 11: QR Outlet Boundary

*For any* Outlet QR checkout, outlet SHALL match locked outlet.

## Property 12: QR Location Boundary

*For any* Location QR checkout, outlet and location SHALL match locked values.

## Property 13: Server Price Authority

*For any* order total, final amount SHALL be calculated by backend.

## Property 14: Public Privacy

*For any* public response, internal data and secrets SHALL not be exposed.

## Property 15: Webhook Idempotency

*For any* duplicate provider webhook, payment transition side effects SHALL occur at most once.

## Property 16: Amount Integrity

*For any* provider paid event, amount and currency SHALL match expected payment before paid state is applied.

## Property 17: Auditability

*For any* critical order/payment/admin/provider action, audit or security event SHALL exist.

## Property 18: Worker Service Boundary

*For any* background worker mutation, worker SHALL call service layer and not bypass state machine.

## Property 19: Feature Flag Safety

*For any* new channel feature disabled by flag, new public/QR checkout SHALL not proceed while existing WhatsApp flow remains available.

## Property 20: No-Go Gate

*For any* alpha release candidate, all P0 No-Go conditions SHALL be cleared.

---

# Error Codes

```text
EXISTING_AUDIT_REQUIRED
CAPABILITY_MAPPING_REQUIRED
IMPLEMENTATION_DECISION_REQUIRED
REGRESSION_RISK_DETECTED
MIGRATION_UNSAFE
MIGRATION_BACKFILL_FAILED
CHANNEL_NOT_SUPPORTED
STOREFRONT_NOT_FOUND
STOREFRONT_INACTIVE
OUTLET_NOT_FOUND
OUTLET_INACTIVE
OUTLET_ORDERING_DISABLED
QR_NOT_FOUND
QR_EXPIRED
QR_REVOKED
QR_SESSION_EXPIRED
QR_SESSION_COMPLETED
QR_OUTLET_REQUIRED
QR_OUTLET_MISMATCH
QR_LOCATION_MISMATCH
CART_INVALID
PRODUCT_UNAVAILABLE
PRODUCT_SOLD_OUT
MODIFIER_INVALID
CHECKOUT_IDEMPOTENCY_REQUIRED
IDEMPOTENCY_CONFLICT
CHECKOUT_EXPIRED
CHECKOUT_FAILED
PAYMENT_PROVIDER_NOT_CONFIGURED
PAYMENT_PROVIDER_DISABLED
PAYMENT_PROVIDER_ERROR
PAYMENT_PROVIDER_TIMEOUT
PAYMENT_REFERENCE_NOT_FOUND
PAYMENT_WEBHOOK_INVALID
PAYMENT_WEBHOOK_DUPLICATE
PAYMENT_AMOUNT_MISMATCH
PAYMENT_CURRENCY_MISMATCH
PAYMENT_INVALID_TRANSITION
PAYMENT_MANUAL_REVIEW_REQUIRED
ORDER_NOT_FOUND
ORDER_INVALID_TRANSITION
ORDER_UNPAID
ORDER_CANCEL_REASON_REQUIRED
ADMIN_PERMISSION_DENIED
ADMIN_OUTLET_SCOPE_DENIED
PUBLIC_TOKEN_INVALID
RATE_LIMITED
AUDIT_WRITE_FAILED
SECURITY_EVENT_RECORDED
WORKER_LOCK_CONFLICT
WORKER_RETRY_EXCEEDED
FEATURE_DISABLED
ALPHA_NO_GO_BLOCKED
INTERNAL_ERROR
```

---

# MVP Scope Boundary

## Included in Phase 4 MVP

```text
existing backend/docs audit
existing frontend audit
existing database audit
capability mapping
reuse/extend/refactor/rebuild decision matrix
additive database adaptation
online_store channel
qr_store channel
public storefront endpoint
Universal QR
Outlet QR
Location QR
QR session
public cart validation
public checkout
checkout idempotency
server-side price recalculation
public order token
payment provider abstraction
BayarGG adapter
payment webhook endpoint
webhook signature verification
webhook idempotency
amount/currency validation
order lifecycle separation
admin explicit order actions
allowed_actions
audit log
security events
basic workers
regression tests
alpha readiness checklist
```

## Optional / After Core Phase 4

```text
advanced analytics dashboard
advanced reconciliation dashboard
multi-provider admin switching UI
refund workflow
manual payment review UI
delivery fulfillment
loyalty integration
campaign QR analytics
advanced notification templates
dedicated message broker
multi-brand advanced storefront
```

## Explicitly Out of Scope

```text
greenfield backend rewrite
frontend visual redesign
AI mark-paid
frontend mark-paid
admin free mark-paid for alpha
hard delete operational orders
payment status patch from public client
fulfillment status patch from public client
direct DB mutation from worker bypassing services
QR outlet/location trust from frontend only
production launch
POS full cashier system
delivery fleet management
loyalty system
```

---

# Requirement Traceability by Delivery Phase

## Phase 4.0 — Existing Backend & Docs Audit

```text
P4-R1 Existing Docs and Repository Audit
P4-R2 Existing Capability Mapping
P4-R3 Reuse / Extend / Refactor / Rebuild Decision
P4-R4 Existing WhatsApp Marketplace Regression Preservation
```

## Phase 4.1 — Gap Analysis & Implementation Map

```text
P4-R2 Existing Capability Mapping
P4-R3 Reuse / Extend / Refactor / Rebuild Decision
P4-R26 Documentation Deliverables
```

## Phase 4.2 — Database Adaptation

```text
P4-R5 Database Adaptation and Migration Safety
P4-R6 Channel Expansion for Online Store and QR Store
P4-R8 QR Code and QR Session Domain
P4-R12 Order Lifecycle Refactor
P4-R14 Payment Provider Abstraction
P4-R20 Audit Log and Security Events
```

## Phase 4.3 — Existing Service Mapping

```text
P4-R2 Existing Capability Mapping
P4-R3 Reuse / Extend / Refactor / Rebuild Decision
P4-R4 Existing WhatsApp Marketplace Regression Preservation
```

## Phase 4.4 — Order Lifecycle Refactor

```text
P4-R12 Order Lifecycle Refactor
P4-R13 Public Order Tracking
P4-R18 Admin Order Action Hardening
P4-R20 Audit Log and Security Events
```

## Phase 4.5 — Channel Expansion

```text
P4-R6 Channel Expansion for Online Store and QR Store
P4-R7 Public Storefront Backend Support
P4-R13 Public Order Tracking
```

## Phase 4.6 — QR Store Extension

```text
P4-R8 QR Code and QR Session Domain
P4-R9 QR Scope Validation
P4-R13 Public Order Tracking
P4-R20 Audit Log and Security Events
```

## Phase 4.7 — Checkout Hardening

```text
P4-R10 Public Cart Validation
P4-R11 Public Checkout Hardening and Idempotency
P4-R19 Product Availability and Modifier Validation
P4-R22 Public API Security
```

## Phase 4.8 — Payment Provider Hardening

```text
P4-R14 Payment Provider Abstraction
P4-R15 BayarGG Adapter
P4-R17 Payment Status and Amount Integrity
```

## Phase 4.9 — Webhook Hardening

```text
P4-R16 Payment Webhook Hardening
P4-R17 Payment Status and Amount Integrity
P4-R20 Audit Log and Security Events
```

## Phase 4.10 — Admin Order Hardening

```text
P4-R18 Admin Order Action Hardening
P4-R12 Order Lifecycle Refactor
P4-R20 Audit Log and Security Events
```

## Phase 4.11 — Audit Log & Security Events

```text
P4-R20 Audit Log and Security Events
P4-R23 Observability and Operational Logging
```

## Phase 4.12 — Background Worker Alignment

```text
P4-R21 Background Workers and Scheduler Alignment
P4-R23 Observability and Operational Logging
```

## Phase 4.13 — Regression Testing & Backend Stabilization

```text
P4-R4 Existing WhatsApp Marketplace Regression Preservation
P4-R25 Regression and Alpha Readiness Testing
P4-R27 No-Go Gate Enforcement
```

---

# Definition of Done for a Phase 4 Requirement

Satu requirement Phase 4 dianggap selesai hanya jika:

1. existing docs/code terkait sudah diaudit;
2. capability mapping sudah diperbarui;
3. decision reuse/extend/refactor/rebuild sudah jelas;
4. implementation tidak membuat duplicate business logic;
5. workspace scope diterapkan;
6. outlet scope diterapkan jika applicable;
7. public input schema divalidasi;
8. server-side authority diterapkan untuk price/order/payment/status;
9. payment authority tetap dari verified webhook/reconciliation;
10. admin transition guard diterapkan jika applicable;
11. idempotency diterapkan untuk side effect public;
12. audit/security event dibuat jika applicable;
13. migration bersifat additive atau memiliki compatibility plan;
14. existing WhatsApp regression test lulus;
15. unit test tersedia;
16. integration test tersedia;
17. security test tersedia;
18. API contract diperbarui;
19. docs deliverable diperbarui;
20. No-Go checklist tidak dilanggar.

---

# Final Requirement Statement

SELKOP Phase 4 SHALL mengadaptasi existing AI WhatsApp Marketplace backend menjadi backend yang siap mendukung Online Store dan QR Store tanpa melakukan rewrite tidak perlu.

Phase 4 SHALL:

```text
membaca docs existing
mengaudit frontend/backend/database
memetakan service existing
mereuse module yang aman
menambah gap yang diperlukan
merefactor logic yang berisiko
membangun ulang hanya yang unsafe
melindungi WhatsApp flow dengan regression test
```

Online Store dan QR Store SHALL menjadi channel tambahan yang menggunakan canonical backend services.

Backend SHALL tetap authoritative untuk:

```text
workspace access
outlet access
product price
product availability
cart validation
checkout total
order lifecycle
payment status
fulfillment status
admin actions
audit
```

Payment SHALL hanya dianggap paid setelah verified provider webhook atau valid reconciliation.

QR Store SHALL mendukung Universal QR, Outlet QR, dan Location QR dengan validasi server-side.

Public checkout SHALL idempotent, server-authoritative, dan aman untuk no-login customer.

Existing WhatsApp Marketplace SHALL tetap berjalan setelah Phase 4 selesai.
