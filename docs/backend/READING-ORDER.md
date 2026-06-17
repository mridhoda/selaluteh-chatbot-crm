# READING ORDER — SelaluTeh Backend & Specs Lifecycle

> **Canonical entry point untuk developer dan AI coding agent.**  
> Dokumen ini menjelaskan alur kerja lengkap: memvalidasi lifecycle spec, membaca konteks, memilih task, membaca docs terkait, menginspeksi source code, mengimplementasikan perubahan, menjalankan test, memperbarui dokumentasi, dan menyinkronkan folder spec.

---

## 1. Tujuan dan Aturan Utama

Gunakan dokumen ini sebelum:

- memulai atau melanjutkan task backend;
- mengaktifkan spec dari backlog;
- menyelesaikan atau membuka kembali spec;
- mengubah arsitektur, API, data model, security, payment, webhook, AI, storage, migration, atau operations;
- menyerahkan pekerjaan kepada coding agent lain.

Urutan normal:

```text
READING-ORDER.md
→ specs.config.yaml
→ current-task.md
→ active spec.yaml
→ requirements.md
→ design.md
→ tasks.md
→ global guardrails
→ domain docs
→ existing source code
→ tests
→ implementation
→ documentation updates
→ lifecycle update
→ specs sync/check
```

Jangan:

- mulai dari source code secara acak;
- memilih task sendiri;
- mengimplementasikan backlog;
- membuka completed spec tanpa perubahan status eksplisit;
- melakukan big-bang rewrite;
- mengubah requirement hanya agar implementasi existing terlihat benar;
- menandai task selesai tanpa test dan update docs.

Project ini dimodernisasi secara bertahap:

```text
preserve behavior
→ tambah guardrail
→ tambah abstraction
→ migrasi bertahap
→ validasi
→ baru deprecate legacy path
```

---

# 2. Struktur Canonical

```text
docs/
└── backend/
    ├── READING-ORDER.md
    ├── 00-overview/
    ├── 01-product/
    ├── 02-flows/
    ├── 03-business-rules/
    ├── 04-tech-spec/
    ├── 05-api-spec/
    ├── 06-data/
    ├── 07-uiux/
    ├── 08-security/
    ├── 09-ai-context/
    │   └── current-task.md
    ├── 10-testing/
    ├── 11-sprint/
    └── 12-ops/

specs/
├── specs.config.yaml
├── SPECS-INDEX.md
├── _templates/
├── backlog/
├── active/
└── completed/

scripts/
└── specs/
    └── sync-spec-folders.mjs

.github/
└── workflows/
    └── specs-check.yml
```

Setiap spec wajib memiliki:

```text
<spec-id>/
├── spec.yaml
├── requirements.md
├── design.md
└── tasks.md
```

---

# 3. Specs Lifecycle System

## 3.1 Global config

```text
specs/specs.config.yaml
```

Mengatur:

- allowed statuses;
- mapping status ke folder;
- workflow states;
- metadata wajib;
- required documents;
- priority;
- task completion rules;
- current-task validation;
- index generation;
- sync/check behavior.

## 3.2 Status menentukan folder

```text
status: backlog
→ specs/backlog/<spec-id>/

status: active
→ specs/active/<spec-id>/

status: completed
→ specs/completed/<spec-id>/
```

## 3.3 Workflow state

### Backlog

```text
draft
review
approved
```

### Active

```text
in_progress
blocked
verifying
```

### Completed

```text
done
archived
```

Contoh blocked:

```yaml
status: active
workflow_state: blocked
```

Folder tetap di `active`.

## 3.4 Script lifecycle

```text
scripts/specs/sync-spec-folders.mjs
```

Commands:

```bash
npm run specs:check
npm run specs:check:verbose
npm run specs:sync:dry
npm run specs:sync
npm run specs:help
```

### Check

```bash
npm run specs:check
```

Hanya validasi. Tidak mengubah file.

### Dry run

```bash
npm run specs:sync:dry
```

Menampilkan folder/index yang akan berubah tanpa memodifikasi repository.

### Sync

```bash
npm run specs:sync
```

Dapat:

- memindahkan seluruh folder spec berdasarkan `status`;
- memperbarui `updated_at`;
- memperbarui `lifecycle.current_bucket`;
- memperbarui `lifecycle.current_path`;
- memperbarui `SPECS-INDEX.md`.

## 3.5 Tidak otomatis saat save

```text
edit metadata
→ update current-task pointer
→ specs:sync:dry
→ specs:sync
→ specs:check
→ review git diff
```

## 3.6 CI hanya check

```text
.github/workflows/specs-check.yml
```

CI hanya menjalankan:

```bash
npm run specs:check
```

CI tidak boleh:

- memindahkan folder;
- mengubah file;
- membuat commit;
- memilih spec aktif;
- mengubah current-task pointer.

---

# 4. Langkah Nol — Validasi Tooling

Pastikan tersedia:

```text
specs/specs.config.yaml
scripts/specs/sync-spec-folders.mjs
docs/backend/09-ai-context/current-task.md
```

Install parser YAML bila belum ada:

```bash
npm install --save-dev yaml
```

Periksa syntax:

```bash
node --check scripts/specs/sync-spec-folders.mjs
```

Baseline validation:

```bash
npm run specs:check
```

Jika gagal karena folder/status mismatch:

```bash
npm run specs:sync:dry
```

Periksa:

- folder yang akan dipindahkan;
- status yang menyebabkannya;
- target path pada `current-task.md`;
- required task yang masih terbuka;
- `SPECS-INDEX.md` yang stale.

Setelah metadata benar:

```bash
npm run specs:sync
npm run specs:check
```

Jangan mulai coding sampai lifecycle valid, kecuali kegagalan check adalah masalah yang memang sedang diperbaiki oleh task tersebut.

---

# 5. Langkah Pertama — Baca `current-task.md`

File:

```text
docs/backend/09-ai-context/current-task.md
```

Contoh pointer aktif:

```yaml
---
schema_version: 1
status: active

active_spec:
  id: selaluteh-backend-marketplace
  path: specs/active/selaluteh-backend-marketplace/spec.yaml

active_task:
  id: "0.1"
  title: Capture current backend baseline
  source: specs/active/selaluteh-backend-marketplace/tasks.md

updated_at: 2026-06-17
---
```

Ambil:

```text
pointer status
active spec ID
active spec path
active task ID
active task title
active task source
```

## Pointer idle

```yaml
---
schema_version: 1
status: idle
updated_at: 2026-06-17
---
```

Pada mode idle:

- jangan tambahkan `active_spec`;
- jangan tambahkan `active_task`;
- jangan memilih task sendiri.

## Stop conditions

Jangan coding apabila:

- file hilang atau front matter invalid;
- `active_spec.path` tidak ada;
- `active_spec.id` tidak cocok;
- spec yang ditunjuk bukan `active`;
- task source tidak ada;
- task ID tidak ditemukan;
- pointer menunjuk spec completed;
- pointer sedang idle.

---

# 6. Langkah Kedua — Baca Active `spec.yaml`

Gunakan path dari `current-task.md`; jangan hard-code berdasarkan ingatan.

Baca seluruh section:

```text
identity
description
scope
included/deferred/excluded
lifecycle
status/workflow_state
documents
document_authority
runtime
source_locations
architecture
domain_boundaries
current_implementation_baseline
data_authority
core_invariants
status_workflow
implementation
references
security_context
testing_context
operations_context
dependencies
risks
ai_agent
completion
```

Setelah membaca, harus bisa menjawab:

```text
Apa tujuan spec?
Apa scope MVP?
Apa yang deferred/excluded?
Apa runtime existing?
Apa migration direction?
Apa source of truth?
Apa invariants?
Apa release gate?
Apa risiko?
Docs apa yang relevan?
Apa syarat completion?
```

---

# 7. Langkah Ketiga — Baca Dokumen Utama Spec

Baca:

```text
spec.yaml
requirements.md
design.md
tasks.md
```

## `requirements.md`

Mengontrol **apa** yang wajib dilakukan sistem:

```text
behavior
acceptance criteria
business rules
security requirements
data requirements
integration requirements
non-functional requirements
```

Jika requirement tidak lagi benar:

```text
stop
→ catat mismatch
→ rekam approved decision
→ update requirements
→ update design
→ update tasks
→ baru implementasi
```

## `design.md`

Mengontrol **bagaimana** requirement dipenuhi:

```text
architecture
component boundaries
data model
API contract
state transition
error handling
migration
testing
observability
security design
```

Perubahan desain material harus didokumentasikan sebelum atau bersamaan dengan implementasi.

## `tasks.md`

Mengontrol:

```text
order
dependencies
checkpoints
verification
completion
```

Cari exact `active_task.id`.

Jangan:

- mengerjakan task lain;
- melewati dependency;
- menandai selesai hanya karena code ditulis;
- menambahkan scope tersembunyi.

---

# 8. Langkah Keempat — Baca Global Guardrails

Minimal baca:

```text
docs/backend/11-sprint/implementation-status.md
docs/backend/11-sprint/progress-log.md
docs/backend/11-sprint/current-sprint.md
docs/backend/04-tech-spec/decision-log.md
docs/backend/09-ai-context/do-not-break.md
docs/backend/09-ai-context/backend-boundaries.md
docs/backend/09-ai-context/coding-guidelines.md
docs/backend/09-ai-context/security-rules-for-ai.md
docs/backend/09-ai-context/testing-expectations.md
docs/backend/11-sprint/definition-of-done.md
```

| File | Fungsi |
|---|---|
| `implementation-status.md` | Kondisi aktual implementasi |
| `progress-log.md` | Riwayat perubahan |
| `current-sprint.md` | Fokus sprint |
| `decision-log.md` | Keputusan material yang disetujui |
| `do-not-break.md` | Behavior existing yang harus dipertahankan |
| `backend-boundaries.md` | Batas tanggung jawab backend |
| `coding-guidelines.md` | Pola coding project |
| `security-rules-for-ai.md` | Guardrail security |
| `testing-expectations.md` | Test minimum |
| `definition-of-done.md` | Syarat closure |

Jika file belum tersedia:

```text
jangan mengarang
→ laporkan missing doc
→ gunakan authority berikutnya
→ tambahkan documentation task bila dibutuhkan
```

---

# 9. Langkah Kelima — Baca Domain Docs Terkait

Gunakan kombinasi:

```text
active task
+ spec.references
+ domain map berikut
```

## 9.1 Workspace, Membership, Outlet Access

```text
docs/backend/02-flows/outlet-selection-flow.md
docs/backend/03-business-rules/workspace-tenant-rules.md
docs/backend/03-business-rules/outlet-rules.md
docs/backend/03-business-rules/outlet-access-rules.md
docs/backend/03-business-rules/permissions.md
docs/backend/05-api-spec/users-api.md
docs/backend/05-api-spec/outlets-api.md
docs/backend/05-api-spec/outlet-access-api.md
docs/backend/06-data/entities.md
docs/backend/06-data/relationships.md
docs/backend/06-data/query-contracts.md
docs/backend/08-security/auth-authz.md
docs/backend/08-security/workspace-tenant-security.md
docs/backend/08-security/outlet-access-security.md
docs/backend/10-testing/outlet-test-plan.md
docs/backend/10-testing/security-test-plan.md
```

Invariant:

```text
workspace_id berasal dari verified request context
outlet access divalidasi server-side
cross-workspace/outlet access ditolak
```

## 9.2 Platforms dan Webhooks

```text
docs/backend/02-flows/webhook-message-flow.md
docs/backend/03-business-rules/webhook-rules.md
docs/backend/05-api-spec/platforms-api.md
docs/backend/05-api-spec/integrations-api.md
docs/backend/05-api-spec/webhooks-api.md
docs/backend/08-security/webhook-security.md
docs/backend/08-security/telegram-security.md
docs/backend/08-security/meta-platform-security.md
docs/backend/10-testing/webhook-test-plan.md
docs/backend/12-ops/webhook-ops.md
```

Invariant:

```text
verify before mutation
duplicate event tidak duplicate side effect
provider event ID idempotent
secret/signature tidak bocor
```

## 9.3 Contacts, Chats, Messages, Human Takeover

```text
docs/backend/02-flows/human-takeover-flow.md
docs/backend/03-business-rules/human-takeover-rules.md
docs/backend/05-api-spec/contacts-api.md
docs/backend/05-api-spec/chats-api.md
docs/backend/07-uiux/backend-ui-contract.md
docs/backend/07-uiux/admin-actions-matrix.md
docs/backend/10-testing/integration-test-plan.md
docs/backend/10-testing/regression-checklist.md
```

Invariant:

```text
takeover_by != null
→ AI auto-reply harus berhenti
```

## 9.4 AI Agents

```text
docs/backend/03-business-rules/ai-agent-rules.md
docs/backend/04-tech-spec/ai-pipeline.md
docs/backend/05-api-spec/agents-api.md
docs/backend/05-api-spec/ai-actions-api.md
docs/backend/08-security/ai-action-security.md
docs/backend/08-security/ai-prompt-security.md
docs/backend/09-ai-context/tool-calling-contract.md
docs/backend/09-ai-context/commerce-agent-guardrails.md
docs/backend/09-ai-context/security-rules-for-ai.md
```

Invariant:

```text
AI bukan source of truth untuk price/availability/permission/payment
AI tidak bypass human takeover
tool action tetap divalidasi backend
```

## 9.5 Products dan Availability

```text
docs/backend/02-flows/product-catalog-flow.md
docs/backend/03-business-rules/product-catalog-rules.md
docs/backend/05-api-spec/products-api.md
docs/backend/06-data/marketplace-module.md
docs/backend/06-data/entities.md
docs/backend/06-data/query-contracts.md
docs/backend/07-uiux/pages-backend-requirements.md
docs/backend/07-uiux/filters-search-sort.md
```

Invariant:

```text
effective price server-side
availability outlet-scoped
inactive product tidak dapat dibeli
order menyimpan immutable snapshot
```

## 9.6 Cart dan Checkout

```text
docs/backend/02-flows/cart-checkout-flow.md
docs/backend/02-flows/checkout-flow.md
docs/backend/03-business-rules/cart-checkout-rules.md
docs/backend/03-business-rules/validations.md
docs/backend/05-api-spec/carts-api.md
docs/backend/05-api-spec/checkout-api.md
docs/backend/06-data/marketplace-module.md
docs/backend/09-ai-context/outlet-context.md
docs/backend/10-testing/integration-test-plan.md
docs/backend/10-testing/telegram-commerce-test-plan.md
```

Invariant:

```text
one cart = one outlet
price dihitung ulang saat checkout
checkout idempotent
client tidak dipercaya untuk total
```

## 9.7 Orders

```text
docs/backend/02-flows/order-fulfillment-flow.md
docs/backend/03-business-rules/order-rules.md
docs/backend/03-business-rules/status-rules.md
docs/backend/05-api-spec/orders-api.md
docs/backend/07-uiux/orders-page-multi-outlet.md
docs/backend/07-uiux/workflow-buttons.md
docs/backend/10-testing/acceptance-test-cases.md
```

Invariant:

```text
order status terpisah dari payment status
state transition tervalidasi
order snapshot immutable
cross-outlet mutation ditolak
```

## 9.8 Payments dan Reconciliation

```text
docs/backend/02-flows/payment-flow.md
docs/backend/03-business-rules/payment-rules.md
docs/backend/03-business-rules/webhook-rules.md
docs/backend/05-api-spec/payments-api.md
docs/backend/05-api-spec/webhooks-api.md
docs/backend/06-data/payment-gateway.md
docs/backend/07-uiux/payment-ui-requirements.md
docs/backend/08-security/payment-security.md
docs/backend/08-security/webhook-security.md
docs/backend/09-ai-context/payment-context.md
docs/backend/10-testing/payment-test-plan.md
docs/backend/10-testing/webhook-test-plan.md
docs/backend/12-ops/payment-ops.md
docs/backend/12-ops/webhook-ops.md
```

Invariant:

```text
paid hanya dari verified provider event
amount/currency harus cocok
duplicate event idempotent
paid tidak downgrade oleh stale event
manual mark-paid harus audited bila diizinkan
```

## 9.9 Inventory

```text
requirements.md — inventory requirements
design.md — inventory design
tasks.md — inventory tasks
docs/backend/06-data/entities.md
docs/backend/06-data/relationships.md
docs/backend/06-data/query-contracts.md
docs/backend/10-testing/integration-test-plan.md
```

Invariant:

```text
quantity tidak negatif
setiap mutation memiliki stock movement
reserve/release/consume traceable
inventory outlet tidak bercampur
```

## 9.10 Telegram Commerce

```text
docs/backend/02-flows/telegram-commerce-flow.md
docs/backend/02-flows/outlet-selection-flow.md
docs/backend/03-business-rules/telegram-commerce-rules.md
docs/backend/05-api-spec/telegram-commerce-api.md
docs/backend/06-data/telegram-commerce-flow.md
docs/backend/08-security/telegram-security.md
docs/backend/09-ai-context/telegram-bot-context.md
docs/backend/10-testing/telegram-commerce-test-plan.md
docs/backend/12-ops/telegram-ops.md
```

## 9.11 Files dan Storage

```text
docs/backend/02-flows/media-file-flow.md
docs/backend/03-business-rules/storage-rules.md
docs/backend/04-tech-spec/storage-strategy.md
docs/backend/05-api-spec/files-api.md
docs/backend/06-data/storage-model.md
docs/backend/08-security/file-storage-security.md
docs/backend/09-ai-context/storage-context.md
docs/backend/12-ops/storage-ops.md
```

Invariant:

```text
path containment wajib
metadata di database
actual file dapat lokal untuk MVP
uploads tidak di-track Git
```

## 9.12 Database dan Migration

```text
docs/backend/04-tech-spec/database-access.md
docs/backend/06-data/database-schema.md
docs/backend/06-data/entities.md
docs/backend/06-data/erd.md
docs/backend/06-data/relationships.md
docs/backend/06-data/query-contracts.md
docs/backend/06-data/repository-layer-contract.md
docs/backend/06-data/indexes.md
docs/backend/06-data/rls-policies.md
docs/backend/06-data/migration-plan.md
docs/backend/06-data/implementation-checklist.md
docs/backend/10-testing/migration-test-plan.md
docs/backend/12-ops/database-ops.md
docs/backend/12-ops/migration-ops.md
```

Invariant:

```text
runtime sekarang MongoDB/Mongoose
PostgreSQL belum aktif sebelum cutover
migration incremental dan tervalidasi
rollback/backfill harus terdokumentasi
```

## 9.13 Security

```text
docs/backend/08-security/auth-authz.md
docs/backend/08-security/api-security.md
docs/backend/08-security/workspace-tenant-security.md
docs/backend/08-security/outlet-access-security.md
docs/backend/08-security/webhook-security.md
docs/backend/08-security/payment-security.md
docs/backend/08-security/file-storage-security.md
docs/backend/08-security/ai-action-security.md
docs/backend/08-security/ai-prompt-security.md
docs/backend/08-security/secrets-env-policy.md
docs/backend/08-security/rate-limit-abuse.md
docs/backend/08-security/security-checklist.md
docs/backend/08-security/threat-model.md
```

## 9.14 Testing

```text
docs/backend/10-testing/test-strategy.md
docs/backend/10-testing/unit-test-plan.md
docs/backend/10-testing/integration-test-plan.md
docs/backend/10-testing/security-test-plan.md
docs/backend/10-testing/e2e-test-plan.md
docs/backend/10-testing/webhook-test-plan.md
docs/backend/10-testing/payment-test-plan.md
docs/backend/10-testing/outlet-test-plan.md
docs/backend/10-testing/telegram-commerce-test-plan.md
docs/backend/10-testing/migration-test-plan.md
docs/backend/10-testing/regression-checklist.md
docs/backend/10-testing/acceptance-test-cases.md
docs/backend/10-testing/ci-test-pipeline.md
docs/backend/09-ai-context/testing-expectations.md
```

## 9.15 Deployment dan Operations

```text
docs/backend/04-tech-spec/deployment.md
docs/backend/04-tech-spec/environment-config.md
docs/backend/04-tech-spec/observability.md
docs/backend/04-tech-spec/runbook.md
docs/backend/12-ops/deployment-runbook.md
docs/backend/12-ops/release-runbook.md
docs/backend/12-ops/rollback-runbook.md
docs/backend/12-ops/health-checks.md
docs/backend/12-ops/monitoring-alerting.md
docs/backend/12-ops/backup-restore-runbook.md
docs/backend/12-ops/disaster-recovery.md
docs/backend/12-ops/incident-response-runbook.md
docs/backend/12-ops/production-readiness.md
```

---

# 10. Langkah Keenam — Inspeksi Existing Source Code

Backend root:

```text
server/src/
```

Area:

```text
server/src/config
server/src/db
server/src/db/repositories
server/src/integrations
server/src/middleware
server/src/models
server/src/routes
server/src/routes/webhooks
server/src/services
server/src/utils
server/src/validators
server/src/workers
server/test
```

Cari:

```text
existing implementation
imports/call sites
routes/services/repositories/models
validators/middleware
provider clients
tests
environment variables
migration references
```

Pertanyaan wajib:

```text
Apakah implementation serupa sudah ada?
Siapa consumer-nya?
Apa behavior yang harus dipertahankan?
Apakah workspace/outlet scoping ada?
Apakah idempotency ada?
Apakah error contract existing harus dipertahankan?
Apakah migration/backfill dibutuhkan?
```

Pola utama:

```text
Route
→ Middleware
→ Service
→ Repository
→ Model/Database
```

External provider:

```text
Service
→ Integration Adapter
→ Provider
```

Dilarang:

```text
route → provider langsung
route → query kompleks
service → Express response formatting
integration client → permission decision
repository → HTTP response
```

---

# 11. Langkah Ketujuh — Preflight Report

Sebelum coding, tulis:

```text
1. Documents read
2. Active spec ID/path
3. Active task ID/title
4. Requirement sections
5. Design sections
6. Domain docs
7. Existing files inspected
8. Behavior to preserve
9. Planned files to modify
10. Workspace security impact
11. Outlet access impact
12. Payment/webhook/idempotency impact
13. Database/migration impact
14. API compatibility impact
15. Tests to add/run
16. Docs to update
17. Rollback/compatibility plan
```

Stop bila:

```text
requirement vs design conflict
payment authority unclear
workspace/outlet boundary unclear
migration state unclear
existing behavior unknown
scope di luar spec
```

---

# 12. Langkah Kedelapan — Implementasi

Kerjakan hanya active task.

Jika menemukan follow-up:

```text
catat
→ tambahkan ke tasks/backlog setelah disetujui
→ jangan diam-diam dikerjakan
```

Core invariants:

```text
workspace = tenant boundary
outlet = operational boundary
workspace_id tidak dipercaya dari client
outlet access server-side
one cart = one outlet
backend authoritative untuk price/payment
paid membutuhkan verified event
webhook idempotent
human takeover menghentikan AI
existing CRM tidak regresi
```

Task belum selesai sampai:

```text
code complete
tests pass
docs updated
status/progress updated
current-task updated
specs check pass
```

---

# 13. Langkah Kesembilan — Testing

Gunakan command actual repository.

Contoh:

```bash
npm test
npm run test:unit
npm run test:integration
npm run test:security
npm run test:e2e
```

Minimum test berdasarkan impact:

| Impact | Test minimum |
|---|---|
| Workspace | isolation/security |
| Outlet | access/scoping |
| Webhook | signature + duplicate |
| Payment | signature + amount + currency + no downgrade |
| Cart | one outlet + recalculation |
| Checkout | idempotency + duplicate order |
| Order | state transition |
| AI | takeover + authorization |
| Storage | path traversal + metadata |
| Migration | backfill + rollback |
| Legacy CRM | regression |

Gunakan status jujur:

```text
passed
failed
not run
blocked
partially verified
manual verification only
```

---

# 14. Langkah Kesepuluh — Update Dokumentasi

### Testing wajib sebelum close

Setiap code change wajib memiliki test baru yang sesuai dengan impact-nya, mengacu pada test plans di `docs/backend/10-testing/`:
- `unit-test-plan.md` — untuk pure logic, service, helpers
- `integration-test-plan.md` — untuk API + database + provider
- `security-test-plan.md` — untuk workspace/outlet isolation
- `telegram-commerce-test-plan.md` — untuk Telegram flow
- `webhook-test-plan.md` — untuk idempotency
- `regression-checklist.md` — untuk memastikan existing behavior tidak rusak

Jangan menandai task selesai tanpa test baru yang mencakup perubahan kode.

## 14.1 `tasks.md` — selalu

Centang hanya bila acceptance criteria, tests, dan docs selesai.

```markdown
- [x] 4.2 Implement payment webhook verification
```

Tambahkan bila format mendukung:

```text
files changed
tests run
result
known limitation
follow-up
```

## 14.2 `implementation-status.md` — selalu

```text
docs/backend/11-sprint/implementation-status.md
```

Gunakan status aktual:

```text
implemented
partially implemented
not implemented
blocked
deprecated
tested
not tested
```

Jangan menggambarkan target design sebagai fitur aktif.

## 14.3 `progress-log.md` — selalu

```text
docs/backend/11-sprint/progress-log.md
```

Entry minimal:

```text
date
spec ID
task ID
summary
files changed
tests
decisions
blockers
next action
```

## 14.4 `current-task.md` — selalu

Jika spec masih aktif:

- pindahkan ke task berikutnya yang disetujui; atau
- ubah pointer menjadi idle.

Jangan memilih task berikutnya otomatis.

## 14.5 `current-sprint.md`

Update bila:

```text
scope sprint berubah
task masuk/keluar
blocker
carry-over
milestone
```

## 14.6 `backlog.md`

Update bila:

```text
follow-up baru
scope deferred
technical debt
issue baru
dependency belum tersedia
```

## 14.7 `decision-log.md`

Update untuk keputusan material:

```text
architecture
database
provider
security
API compatibility
migration/cutover
storage
queue
deprecation
```

## 14.8 `requirements.md`

Update bila approved behavior berubah:

```text
requirement
acceptance criteria
scope
security
business rule
NFR
```

## 14.9 `design.md`

Update bila berubah:

```text
architecture
component boundary
data model
API
state machine
error handling
migration
security
testing
observability
```

## 14.10 Domain docs

| Perubahan | Folder docs |
|---|---|
| Flow | `02-flows/` |
| Business rule | `03-business-rules/` |
| Architecture | `04-tech-spec/` |
| API | `05-api-spec/` |
| Data | `06-data/` |
| UI contract | `07-uiux/` |
| Security | `08-security/` |
| AI context | `09-ai-context/` |
| Testing | `10-testing/` |
| Sprint/status | `11-sprint/` |
| Operations | `12-ops/` |

## 14.11 `spec.yaml`

Update bila berubah:

```text
status/workflow_state
priority
scope
dependencies
risks
references
lifecycle
phase
release gates
completion
updated_at
```

`spec.yaml` adalah control plane, bukan pengganti requirements/design/tasks.

---

# 15. Task Closure vs Spec Completion

## 15.1 Task selesai, spec masih aktif

Tetap:

```yaml
status: active
workflow_state: in_progress
```

atau:

```yaml
status: active
workflow_state: verifying
```

Urutan:

```text
update tasks.md
update implementation-status.md
update progress-log.md
update current-task.md
update domain docs
run tests
npm run specs:check
review git diff
```

`specs:sync` tidak wajib bila status/path/index tidak berubah.

## 15.2 Task blocked

```yaml
status: active
workflow_state: blocked
```

Update:

```text
tasks.md
progress-log.md
current-sprint.md
risk-log.md bila relevan
current-task.md
```

Folder tetap `active`.

## 15.3 Verifying

```yaml
status: active
workflow_state: verifying
```

Lakukan:

```text
regression
security gate
acceptance test
documentation review
operations readiness
release checklist
```

---

# 16. Mengaktifkan Spec dari Backlog

Current:

```text
specs/backlog/<spec-id>/
```

Urutan:

1. Pastikan `workflow_state: approved`.
2. Pastikan requirements/design/tasks siap.
3. Ubah:

```yaml
status: active
workflow_state: in_progress
```

4. Update pointer ke **target path**:

```yaml
active_spec:
  id: <spec-id>
  path: specs/active/<spec-id>/spec.yaml

active_task:
  id: "<task-id>"
  title: "<task-title>"
  source: specs/active/<spec-id>/tasks.md
```

5. Preview:

```bash
npm run specs:sync:dry
```

6. Apply:

```bash
npm run specs:sync
```

7. Validate:

```bash
npm run specs:check
```

8. Review:

```bash
git status
git diff --stat
git diff
```

---

# 17. Menyelesaikan Spec

Syarat:

```text
required tasks selesai
definition of done lulus
critical/security/regression tests lulus
docs lengkap
implementation status akurat
release/rollback readiness cukup
```

Urutan:

1. Update seluruh docs akhir.
2. Pindahkan `current-task.md` ke spec berikutnya atau `idle`.
3. Ubah spec:

```yaml
status: completed
workflow_state: done
```

4. Preview:

```bash
npm run specs:sync:dry
```

5. Apply:

```bash
npm run specs:sync
```

6. Validate:

```bash
npm run specs:check
```

Folder target:

```text
specs/completed/<spec-id>/
```

7. Review Git diff.

---

# 18. Membuka Kembali Completed Spec

Hanya dengan keputusan eksplisit.

Ubah:

```yaml
status: active
workflow_state: in_progress
```

Update pointer ke:

```text
specs/active/<spec-id>/spec.yaml
```

Lalu:

```bash
npm run specs:sync:dry
npm run specs:sync
npm run specs:check
```

Update:

```text
decision-log.md
progress-log.md
implementation-status.md
tasks.md
```

Tambahkan alasan reopen.

---

# 19. Mengembalikan Active ke Backlog

Ubah:

```yaml
status: backlog
workflow_state: approved
```

atau:

```yaml
status: backlog
workflow_state: review
```

Sebelum sync:

```text
hapus/pindahkan current-task pointer
update backlog
update current sprint
update progress log
catat alasan
```

Lalu:

```bash
npm run specs:sync:dry
npm run specs:sync
npm run specs:check
```

---

# 20. `SPECS-INDEX.md`

```text
specs/SPECS-INDEX.md
```

Dikelola otomatis oleh:

```bash
npm run specs:sync
```

Jangan edit manual.

Index harus memuat:

```text
status
workflow
priority
ID
title
canonical path
```

---

# 21. Authority dan Conflict Resolution

Urutan:

```text
1. Latest approved decision
2. spec.yaml
3. requirements.md
4. design.md
5. tasks.md
6. current-task/current sprint
7. domain docs
8. implementation-status untuk current reality
9. generated combined docs
10. archived docs
```

Interpretasi:

```text
requirements → WHAT
design → HOW
tasks → ORDER
current-task → IMMEDIATE SCOPE
implementation-status → CURRENT REALITY
```

Jika code dan docs bertentangan:

```text
identifikasi legacy behavior
cek authority terbaru
cek decision log
cek implementation status
laporkan mismatch
tentukan code/docs yang diperbaiki
update keduanya setelah disetujui
```

---

# 22. Forbidden Actions

```text
rewrite backend dari nol
trust workspace_id dari client
bypass outlet access
route memanggil provider langsung
mark payment paid tanpa verified event
skip idempotency
log secret/token/signature
klaim PostgreSQL aktif sebelum cutover
hapus legacy behavior tanpa regression
ubah requirement diam-diam
pindahkan spec tanpa sync script
edit SPECS-INDEX.md manual
pilih next task otomatis
close task tanpa test
complete spec dengan required task terbuka
gunakan current-task path yang salah
```

---

# 23. Final Report Setelah Task

Laporkan:

```text
1. Spec ID
2. Task ID
3. Implementation summary
4. Files changed
5. Behavior preserved
6. Requirement/design satisfied
7. Tests dan result
8. Security impact
9. Migration/data impact
10. Docs updated
11. Remaining risks
12. Blockers/follow-up
13. Next task pointer
14. Spec status/workflow
15. specs:check result
```

---

# 24. Prompt Standar Coding Agent

```text
Read docs/backend/READING-ORDER.md first.

Run:
npm run specs:check

Then read:
specs/specs.config.yaml
docs/backend/09-ai-context/current-task.md

Follow active_spec.path and active_task exactly.

Read:
spec.yaml
requirements.md
design.md
tasks.md
implementation-status.md
progress-log.md
current-sprint.md
decision-log.md
do-not-break.md
backend-boundaries.md
security-rules-for-ai.md
testing-expectations.md
definition-of-done.md

Read all domain docs referenced by the task/spec.

Before coding, report:
documents read,
active spec/task,
existing files inspected,
behavior to preserve,
planned changes,
security impact,
migration impact,
tests,
docs updates,
rollback plan.

Implement only the active task.
Preserve existing CRM behavior.

Use:
Route → Middleware → Service → Repository → Model/Database.

Never trust workspace_id from the client.
Validate outlet access server-side.
Never mark payment paid without a verified event.
Keep webhook processing idempotent.

After coding:
run tests,
update tasks.md,
update implementation-status.md,
update progress-log.md,
update current-task.md,
update relevant domain docs,
update spec.yaml when needed.

If status changes:
update current-task pointer first,
run npm run specs:sync:dry,
run npm run specs:sync.

Finally:
npm run specs:check

Do not continue automatically.
```

---

# 25. Quick Start Checklist

```text
[ ] npm run specs:check
[ ] read specs.config.yaml
[ ] read current-task.md
[ ] confirm active spec/task
[ ] read spec.yaml
[ ] read requirements.md
[ ] read design.md
[ ] read exact task
[ ] read global guardrails
[ ] read domain docs
[ ] inspect code/tests
[ ] write preflight
[ ] implement only task
[ ] run tests
[ ] update tasks.md
[ ] update implementation-status.md
[ ] update progress-log.md
[ ] update current-task.md
[ ] update domain docs
[ ] update spec.yaml if needed
[ ] sync if lifecycle changed
[ ] npm run specs:check
[ ] review git diff
[ ] final report
```

---

# 26. Task Closure Checklist

```text
[ ] correct task
[ ] acceptance criteria met
[ ] requirement satisfied
[ ] design consistent
[ ] behavior preserved
[ ] workspace scope
[ ] outlet access
[ ] validation/errors
[ ] secrets protected
[ ] idempotency
[ ] audit for sensitive actions
[ ] tests added/run
[ ] regression checked
[ ] migration documented
[ ] rollback documented
[ ] tasks.md updated
[ ] implementation-status.md updated
[ ] progress-log.md updated
[ ] current-task.md updated
[ ] domain docs updated
[ ] spec.yaml updated if needed
[ ] specs:check passed
```

---

# 27. Spec Completion Checklist

```text
[ ] required tasks complete
[ ] definition of done passed
[ ] acceptance/security/regression passed
[ ] implementation status accurate
[ ] final progress log
[ ] decision log if needed
[ ] release checklist
[ ] operations/rollback ready
[ ] current-task moved or idle
[ ] status completed
[ ] workflow_state done
[ ] specs:sync:dry reviewed
[ ] specs:sync passed
[ ] folder in completed
[ ] index updated
[ ] specs:check passed
[ ] git diff reviewed
```

---

# 28. End-to-End Workflow

```text
START
│
├─ npm run specs:check
├─ read specs.config.yaml
├─ read current-task.md
├─ read active spec.yaml
├─ read requirements/design/tasks
├─ read global guardrails
├─ read domain docs
├─ inspect code/tests
├─ preflight report
│
├─ implement
├─ test
├─ verify
│
├─ update tasks.md
├─ update implementation-status.md
├─ update progress-log.md
├─ update current-task.md
├─ update domain docs
├─ update spec.yaml if needed
│
├─ status changed?
│   ├─ no  → npm run specs:check
│   └─ yes
│       ├─ update pointer first
│       ├─ npm run specs:sync:dry
│       ├─ npm run specs:sync
│       └─ npm run specs:check
│
├─ review git diff
├─ final report
└─ STOP — do not select another task automatically
```
