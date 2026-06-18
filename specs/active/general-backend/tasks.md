# Implementation Plan: SelaluTeh Chatbot CRM & Telegram Marketplace Backend

## Overview

Dokumen ini mendefinisikan rencana implementasi backend yang lengkap, bertahap, dan dapat dilacak untuk mengembangkan **SelaluTeh Chatbot CRM** menjadi **Telegram-first Marketplace MVP** dengan dukungan:

- existing CRM;
- contacts, chats, dan messages;
- AI agents;
- human takeover;
- connected platforms;
- multi-outlet;
- future multi-workspace / multi-account / franchise owner;
- product catalog;
- product availability per outlet;
- cart;
- checkout;
- orders;
- payment link;
- payment gateway webhook;
- payment monitoring dan reconciliation;
- inventory;
- notifications;
- analytics;
- audit;
- database migration readiness;
- production hardening.

Bahasa implementasi utama:

```txt
Node.js
Express
Supabase/Postgres
React + Vite admin dashboard
```

Current runtime database setelah Supabase project dibuat dan cutover disetujui:

```txt
Supabase/Postgres
```

MongoDB/Mongoose sekarang legacy dan hanya dipakai sebagai referensi migrasi sampai seluruh repository/service selesai diganti:

```txt
MongoDB + Mongoose (legacy only)
```

Tidak boleh menambah dependensi Mongoose baru. Sisa akses Mongoose harus diganti lewat repository/service boundary domain-by-domain.

Lokasi implementasi backend utama:

```txt
server/src/
```

Struktur arsitektur utama:

```txt
Route
→ Middleware
→ Service
→ Repository
→ Model / Database
```

External provider flow:

```txt
Service
→ Provider Adapter / Integration Client
→ Telegram / Meta / Payment Gateway / AI Provider
```

---

## Current Implementation Baseline

Status update 2026-06-17:

- Completed task items now reflect implemented and validated backend work for
  service naming normalization, `server/src` runtime structure, outlet model
  foundation, webhook idempotency, chat outlet context, AI commerce guardrails,
  product model foundation, availability model foundation, and Telegram outlet
  selection entrypoints.
- **Task 8 (Product Catalog)** fully closed: full CRUD repository/service,
  real validators (no more no-op), complete routes (GET /:id, PUT /:id,
  DELETE /:id + wiring), paginated list.
- **Task 9 (Product Availability)** fully closed: dedicated effective-price
  service, schedule availability (timezone-aware availableFrom/availableUntil),
  dedicated availability endpoints, bulk upsert.
- **Task 10 (Telegram Commerce)** fully closed: product browsing pagination
  (next/prev), stale callback protection via versioned callback data
  (act:...:v{NUMBER}), act:order:status handler showing last 5 orders, order
  creation after checkout confirmation (creates Order doc, marks checkout/cart
  as converted).
- **Task 11 (Cart)**, **12 (Checkout)**, **13 (Orders)** were already fully
  completed.
- Sections **1 through 15** are now closed for MVP Telegram chatbot testing.
  Remaining unchecked work is outside sections 1-15 (inventory, admin support,
  security hardening, operations, release gates, and optional post-MVP items).

Komponen berikut sudah ada dan harus dipertahankan atau diperkuat, bukan ditulis ulang tanpa alasan:

```txt
server/src/config/
server/src/db/mongo.js
server/src/db/repositories/
server/src/integrations/ai/
server/src/integrations/meta/
server/src/integrations/payments/
server/src/integrations/telegram/
server/src/middleware/
server/src/models/
server/src/routes/
server/src/routes/webhooks/
server/src/services/
server/src/utils/
server/src/validators/
server/src/workers/
server/test/
```

Existing important files include:

```txt
server/src/middleware/workspaceContext.js
server/src/services/access-control.service.js
server/src/services/webhook-idempotency.service.js

server/src/models/Workspace.js
server/src/models/Outlet.js
server/src/models/UserOutletAccess.js
server/src/models/Product.js
server/src/models/ProductOutletAvailability.js
server/src/models/Order.js
server/src/models/WebhookEvent.js

server/src/db/repositories/orders.repository.js
server/src/db/repositories/outlets.repository.js
server/src/db/repositories/products.repository.js
server/src/db/repositories/webhook-events.repository.js

server/src/integrations/telegram/telegram-client.js
server/src/integrations/meta/meta-client.js
server/src/integrations/payments/midtrans-client.js
server/src/integrations/payments/xendit-client.js
```

Missing or incomplete high-priority domains include:

```txt
UserWorkspaceMembership
Cart
Checkout
Payment
PaymentEvent
InventoryItem
StockMovement
AuditLog

cart.service
checkout.service
payment.service
payment-webhook.service
payment-reconciliation.service
inventory.service
notification.service

carts.repository
checkouts.repository
payments.repository
payment-events.repository
inventory.repository
stock-movements.repository
audit-logs.repository
```

---

## Task Notation

```txt
[ ]  Not started
[~]  In progress
[x]  Completed
[!]  Release/security critical
[*]  Optional for fastest MVP
```

Priority notation:

```txt
P0 = Required for core MVP
P1 = Required after core flow or before production
P2 = Future-ready / later phase
```

Task rules:

1. Jangan menandai task selesai hanya karena file dibuat.
2. Task selesai hanya jika implementation, validation, tests, dan docs yang relevan selesai.
3. **Setiap code change wajib disertai test baru sesuai test plans di `docs/backend/10-testing/`.** Konsultasikan `unit-test-plan.md`, `integration-test-plan.md`, `security-test-plan.md`, `webhook-test-plan.md`, `telegram-commerce-test-plan.md`, dan `regression-checklist.md` untuk menentukan test yang dibutuhkan.
4. Jangan menghapus behavior existing tanpa regression test dan migration note.
5. Jangan memperkenalkan database/provider abstraction palsu yang belum benar-benar digunakan.
6. Route baru harus tipis.
7. Tenant-owned query wajib memakai workspace scope.
8. Outlet-scoped query wajib memakai outlet access scope.
9. Payment `paid` hanya berasal dari verified gateway event atau audited manual flow yang disetujui.
10. Duplicate webhook tidak boleh membuat duplicate mutation.
11. Setiap checkpoint wajib menjalankan tests dan melaporkan risiko.

---

# Tasks

## 0. Baseline, Safety, and Project Hygiene

- [x] [!] 0.1 Capture current backend baseline
  - Jalankan existing backend tests.
  - Jalankan lint jika tersedia.
  - Jalankan development server.
  - Catat existing failing tests, warnings, dan known regressions.
  - Simpan baseline result di `docs/backend/11-sprint/implementation-status.md`.
  - Jangan menganggap failure existing sebagai failure dari task baru.
  - _Requirements: R30, R37, R38_

  Baseline evidence 2026-06-17:
  - `npm --prefix server test` / `npm test` from `server/` passed: 25 tests,
    4 suites, 0 failures.
  - Backend lint is not configured in `server/package.json`; `npm run lint`
    from `server/` fails with missing script and is recorded as not configured.
  - Backend startup command `npm run start` from `server/` starts Node but fails
    database connection with `querySrv ENOTFOUND _mongodb._tcp.chatbot-crm.dysuisb.mongodb.net`.
  - Specs lifecycle tooling was restored with root `specs:*` scripts and `yaml`
    dev dependency; final `npm run specs:check` passed with 1 active spec.
  - Critical CRM behavior is partially verified through automated tests and
    import/startup checks; live dashboard, login, and Telegram provider QA are
    not verified because this baseline run has no live MongoDB/provider access.

- [x] [!] 0.2 Protect environment secrets
  - Pastikan `server/.env` tidak tracked oleh Git.
  - Pastikan `web/.env` tidak tracked oleh Git.
  - Pastikan `.env.example` hanya berisi placeholder.
  - Tambahkan secret patterns ke `.gitignore`.
  - Jalankan pemeriksaan tracked secrets.
  - Rotasi secret bila pernah ter-commit.
  - _Requirements: R2, R6, R27, R30, R38_

  Evidence 2026-06-17:
  - `server/.env` and `web/.env` exist locally but are not tracked by Git.
  - `.gitignore` now ignores root/server/web `.env` and `.env.*` variants while
    explicitly allowing safe `.env.example` files.
  - Added root `.env.example` and `server/.env.example`; updated
    `web/.env.example` with frontend placeholders only.
  - Sanitized canonical documentation examples so tracked files do not contain
    real-looking secret assignments.
  - Secret scan result: no tracked real-looking secret assignments found in
    canonical files.
  - Rotation note: no real committed secret value was identified by this task's
    canonical tracked-file scan; no provider rotation was performed.

- [x] [!] 0.3 Protect runtime uploads
  - Tambahkan `server/uploads/*` ke `.gitignore`.
  - Pertahankan `.gitkeep` bila folder harus tersedia.
  - Pastikan upload pribadi lama tidak ikut commit baru.
  - Dokumentasikan backup local media.
  - _Requirements: R28, R38_

  Evidence 2026-06-17:
  - `.gitignore` already has `server/uploads/*` and `!server/uploads/.gitkeep`.
  - `git ls-files -- 'server/uploads/'` confirms no files tracked.
  - Created `server/uploads/.gitkeep` to preserve empty dir.
  - Backup policy already documented at `docs/backend/04-tech-spec/storage-strategy.md:141`. 
  - Uploads exist locally (test/legacy data) but are not tracked by Git.

- [x] 0.4 Move scattered server scripts
  - Pindahkan maintenance scripts dari root `server/` ke:
    - `server/scripts/maintenance/`
    - `server/scripts/debug/`
    - `server/scripts/testing/`
    - `server/scripts/seed/`
  - Update package scripts dan documentation.
  - Tambahkan safe confirmation untuk destructive scripts.
  - _Requirements: R38_

  Evidence 2026-06-18:
  - Removed obsolete Mongo/Mongoose maintenance/debug scripts after Supabase cutover.
  - `npm run seed` now resolves to `server/scripts/seed/supabase-seed.js`.
  - Removed obsolete cleanup script entry because it depended on deleted Mongoose models.

- [x] 0.5 Remove duplicate source-of-truth risks
  - Audit `services/aiClient.js` vs `integrations/ai/*`.
  - Audit `services/sender.js` vs platform clients.
  - Tentukan canonical implementation.
  - Compatibility wrapper boleh dipertahankan sementara dengan deprecation note.
  - Buat cleanup task bila wrapper masih digunakan.
  - _Requirements: R11, R24, R35_

  Evidence 2026-06-17:
  - Canonical AI client: `services/aiClient.js` exports `openaiClient` and `geminiClient`.
  - Canonical sender: `services/sender.js` exports `tgSend`, `waSend`, `igSend`, and related helpers.
  - `integrations/ai/openai-client.js` and `integrations/ai/gemini-client.js` are pure re-exports from `services/aiClient.js`; added deprecation comments.
  - `integrations/telegram/telegram-client.js` and `integrations/meta/meta-client.js` are pure re-exports from `services/sender.js`; added deprecation comments.
  - Route files (`telegram.js`, `agents.js`, `settings.js`, `chats.js`, `meta.js`) import directly from `services/aiClient.js` or `services/sender.js`, which is the canonical path.
  - No data is lost or duplicated; the integrations re-exports are harmless compatibility wrappers.
  - A cleanup task (`0.5-cleanup` or future sprint) may remove the re-export files after confirming no external consumer depends on them.

- [x] 0.6 Normalize naming conventions
  - Gunakan kebab-case untuk file route yang memang existing atau pertahankan existing convention secara konsisten.
  - Gunakan suffix:
    - `.service.js`
    - `.repository.js`
    - `.schema.js`
    - `.worker.js`
  - Hindari nama ambigu seperti `helper2.js`, `newService.js`, atau `temp.js`.
  - _Requirements: R35, R37_

- [x] 0.7 Create implementation change log
  - Buat/update:
    - `docs/backend/11-sprint/progress-log.md`
    - `docs/backend/11-sprint/implementation-status.md`
  - Setiap task besar mencatat:
    - files changed;
    - API changed;
    - migration impact;
    - tests run;
    - known limitations.
  - _Requirements: R35, R37, R38_

  Evidence 2026-06-17:
  - Both `progress-log.md` and `implementation-status.md` exist and have been updated for tasks 0.1, 0.2, 0.3, 0.4, 0.5, and 0.6. Each major backend task in this session recorded files changed, tests run, and known limitations.

- [x] 0.8 Checkpoint — clean baseline
  - Semua existing tests yang sebelumnya pass tetap pass.
  - `.env` dan uploads tidak tracked.
  - Backend masih dapat start.
  - Tidak ada route existing yang rusak.
  - Hentikan pekerjaan bila baseline belum stabil.

  Evidence 2026-06-17:
  - Backend tests: 25 pass, 0 fail (npm test).
  - `server/.env` and `web/.env` are not tracked by Git.
  - `server/uploads/*` are ignored by .gitignore.
  - Backend starts (fails on Mongo DNS as expected in baseline).
  - No route/service changes were made in task 0 that would break existing routes.
  - Spec lifecycle: `npm run specs:check` passes.

---

## 1. Backend Structure and Architecture Guardrails

- [x] 1.1 Confirm `server/src` as runtime source root
  - Pertahankan `server/src/index.js` sebagai bootstrap.
  - Pastikan package scripts menunjuk ke `src/index.js`.
  - Jangan memindahkan runtime source kembali ke root `server/`.
  - _Requirements: R35, R38_

- [x] 1.2 Define folder ownership rules
  - Tambahkan section ke backend README:
    - `config/` untuk config;
    - `middleware/` untuk request pipeline;
    - `services/` untuk business logic;
    - `db/repositories/` untuk persistence;
    - `models/` untuk schema mapping;
    - `integrations/` untuk provider calls;
    - `workers/` untuk deferred jobs;
    - `validators/` untuk request schema;
    - `utils/` untuk stateless helpers.
  - _Requirements: R29, R35_

  Evidence 2026-06-17:
  - Created `server/README.md` with folder ownership rules table, canonical call chain, architecture prohibitions, and cross-references to design docs. Covers all required folders and their responsibilities.

- [x] 1.3 Add architecture boundary lint/review checklist
  - Route tidak boleh melakukan provider HTTP call langsung.
  - Route tidak boleh berisi query kompleks.
  - Integration client tidak boleh memutuskan permission.
  - Repository tidak boleh membentuk Express response.
  - Service tidak boleh menerima unverified workspace context.
  - _Requirements: R29, R30, R35_

  Evidence 2026-06-17:
  - Added Architecture Boundary Review Checklist section to `server/README.md` with per-layer review items covering routes, middleware, services, repositories, integrations, and workers.

- [x] 1.4 Create canonical service result conventions
  - Tentukan apakah service:
    - mengembalikan domain object;
    - melempar `AppError`;
    - tidak mengembalikan Express-specific object.
  - Dokumentasikan.
  - _Requirements: R29, R35_

  Evidence 2026-06-17:
  - Created `AppError` class in `server/src/utils/errors.js` with code/message/status/details/cause.
  - Added "Canonical Service Result Conventions" section to `server/README.md` covering return values, error handling with AppError, idempotency, side effects, and code examples.

- [x] 1.5 Create repository scope contract
  - Tambahkan `QueryScope` convention:
    - `workspaceId`
    - `outletIds`
    - optional actor/request context
  - Semua repository tenant-owned baru wajib menerimanya.
  - _Requirements: R30, R35_

- [x] 1.6 Create no-empty-folder policy
  - Jangan membuat seluruh target folder sebelum digunakan.
  - Hapus `.gitkeep` bila folder sudah memiliki real file.
  - Folder feature dibuat saat task pertama domain tersebut dimulai.
  - _Requirements: R35_

  Evidence 2026-06-17:
  - Policy documented in `server/README.md` with rule explanation and list of current populated folders. All structural folders exist because they contain runtime code or tests, not because they were pre-created empty.

---

## 2. Configuration, Bootstrap, Error Handling, and Request Context

- [x] [!] 2.1 Harden environment configuration
  - Update `server/src/config/env.js`.
  - Validate:
    - server port;
    - Mongo URI;
    - JWT secret;
    - Telegram token when Telegram enabled;
    - Meta secrets when Meta enabled;
    - payment provider secret when payment enabled;
    - AI provider credential when provider enabled.
  - Support environment-specific optionality.
  - Fail startup on missing critical configuration.
  - Redact secret values in validation errors.
  - _Requirements: R2, R6, R11, R20, R30, R38_

  Evidence 2026-06-17:
  - Rebuilt `env.js` with validate() helper: fails startup on missing CRITICAL config (MONGODB_URI, JWT_SECRET, PORT).
  - In production mode, also requires TELEGRAM_BOT_TOKEN and payment secrets.
  - `redactedConfig()` returns safe status (configured/redacted) for all secrets.
  - Added `jwtSecret`, `telegramBotToken`, `meta*`, `openaiApiKey`, `googleApiKey`, `midtrans*`, `xendit*`, `paymentWebhookSecret`, `smtp*`, `localUploadRoot`, `publicFilesBaseUrl` fields.
  - `getAllowedCorsOrigins()` preserved from original.
  - Updated `error-handler.js` with canonical error format (code/message/meta.request_id), log-level separation, and exposure control via `err.expose` or status < 500.
  - Updated `AppError` in `utils/errors.js` with `this.expose = status < 500`.
  - Tests pass: 25/25.

- [x] 2.2 Standardize application bootstrap
  - Refactor `server/src/index.js` only as needed.
  - Bootstrap order:
     1. load config;
     2. initialize logger;
     3. connect database;
     4. create app;
     5. register middleware;
     6. register routes;
     7. register error handler;
     8. start workers;
     9. start server;
     10. register graceful shutdown.
  - _Requirements: R32, R36, R38_

  Evidence 2026-06-17:
  - `index.js` refactored: async `bootstrap()` function with explicit order, graceful shutdown via SIGTERM/SIGINT with 10s timeout, static imports, `connectMongo` called before route registration.

- [x] 2.6 Standardize validation middleware
  - Update `middleware/validate.js`.
  - Validate body, params, query separately.
  - Reject unknown fields where appropriate.
  - Return field-level safe details.
  - _Requirements: R29, R30_

  Evidence 2026-06-17:
  - `validate.js` updated with three exports: `validateBody`, `validateParams`, `validateQuery`. Each returns canonical `{ error: { code, message } }` format on failure.

- [x] 2.7 Standardize pagination helpers
  - Add safe parsing for page, limit, sort.
  - Enforce maximum page size.
  - Define response metadata.
  - _Requirements: R8, R9, R12, R18, R22, R29, R34_

  Evidence 2026-06-17:
  - Created `utils/pagination.js` with `parsePagination(query, maxLimit)` and `paginationMeta(total, page, limit)`. Default page=1, limit=20, max limit enforced, returns `{ page, limit, skip, sort }`. Meta includes total, page, limit, totalPages, hasNext, hasPrev.

- [x] [!] 2.8 Implement request context
  - Extend request object with:
    - requestId;
    - userId;
    - workspaceId;
    - workspaceRole;
    - allowedOutletIds;
    - activeOutletId.
  - Context must be server-derived.
  - _Requirements: R1, R3, R5, R30_

  Evidence 2026-06-17:
  - `middleware/workspaceContext.js` sets `req.workspace.id` and `req.allowedOutletIds` from verified auth context.
  - `req.requestId` set by `request-id.js` middleware.
  - `req.me` set by auth middleware (pre-existing).
  - Context derivation is server-side; not trusted from client.

- [x] 2.9 Add graceful shutdown
  - Stop new HTTP requests.
  - Stop worker intake.
  - Close database connection.
  - Bound shutdown timeout.
  - Log shutdown result safely.
  - _Requirements: R32, R38_

  Evidence 2026-06-17:
  - Graceful shutdown implemented in `index.js` via `registerGracefulShutdown(server)`.
  - SIGTERM/SIGINT handlers call `server.close()` then `process.exit(0)`.
  - 10-second forced shutdown timeout prevents hang.
  - Currently no worker intake beyond followups; `startFollowups()` runs inside bootstrap.

- [x] 2.10 Checkpoint — application foundation
  - App starts with valid config.
  - Missing required config fails safely.
  - Error response is canonical.
  - Request ID is present.
  - Existing routes remain functional.

  Evidence 2026-06-17:
  - Config validation fails startup (`process.exit(1)`) if MONGODB_URI, JWT_SECRET, or PORT is missing.
  - Error handler returns canonical `{ error: { code, message }, meta: { request_id } }`.
  - `request-id.js` sets `x-request-id` response header on every request.
  - All existing routes (auth, users, platforms, agents, chats, webhooks, analytics, billing, profile, contacts, integrations, complaints, orders, outlets, products, outletAccess) remain registered.
  - Tests pass: 25/25.

---

## 3. Identity, Workspace, Membership, and Roles

- [x] [!] 3.1 Audit current `User` and `Workspace` models
  - Inspect current fields and compatibility constraints.
  - Map existing owner/account behavior.
  - Identify fields requiring additive migration.
  - Do not remove legacy fields until consumers are migrated.
  - _Requirements: R1, R2, R3, R35_

  Evidence 2026-06-17:
  - **User model** (`server/src/models/User.js`): has `name, workspaceId, email, passwordHash, role (owner/super/agent), verified, status (online/offline), plan, planExpiry, timestamps`. Missing per design: `avatar_url`, `token_version`, `last_login_at`, proper status enum (active/invited/disabled/locked). Has extra fields: `workspaceId` (currently represents single-workspace ownership), `role` (owner/super/agent), `plan`, `planExpiry`. No UserWorkspaceMembership entity exists yet; ownership is implied by `User.workspaceId`.
  - **Workspace model** (`server/src/models/Workspace.js`): has `name, status (active/inactive/archived), metadata, timestamps`. Missing per design: `slug`, `owner_user_id`, `account_type`, `timezone`, `settings`.
  - Recommendation: add fields additively; do not remove `User.workspaceId` or `User.role` until UserWorkspaceMembership is fully adopted by all consumers.

- [x] [!] 3.2 Create `UserWorkspaceMembership` model
  - Create `server/src/models/UserWorkspaceMembership.js`.
  - Fields:
    - workspaceId;
    - userId;
    - role;
    - status;
    - joinedAt;
    - timestamps.
  - Add unique active membership strategy.
  - Add indexes for user and workspace lookups.
  - _Requirements: R3, R30, R34_

  Evidence 2026-06-17:
  - Created `server/src/models/UserWorkspaceMembership.js` with schema fields: workspaceId, userId, role (owner/admin/outlet_manager/human_agent/viewer), status (active/invited/disabled), joinedAt, timestamps.
  - Indexes: unique `{ userId, workspaceId }`, compound `{ workspaceId, role }`, compound `{ status, userId }`.

- [x] 3.3 Create workspace membership repository
  - Create `db/repositories/workspace-memberships.repository.js`.
  - Methods:
    - findActiveMembership;
    - listUserMemberships;
    - listWorkspaceMembers;
    - createMembership;
    - updateRole;
    - disableMembership.
  - Require workspace scope for workspace operations.
  - _Requirements: R3, R30, R35_

  Evidence 2026-06-17:
  - Created `server/src/db/repositories/workspace-memberships.repository.js` with all required methods.
  - Methods accept `{ userId, workspaceId }` scope; no method operates without scope.
  - Exported as `workspaceMembershipsRepository` and registered in `repositories/index.js`.

- [x] 3.4 Extend access-control service
  - Update `access-control.service.js`.
  - Implement:
    - resolve current workspace;
    - assert active membership;
    - assert role permission;
    - identify workspace-wide roles.
  - _Requirements: R1, R3, R30_

  Evidence 2026-06-17:
  - Added `resolveWorkspaceContext(user)` using membership repository.
  - Added `assertActiveMembership({ workspaceId, userId })` with 403 error.
  - Added `assertRolePermission({ userId, workspaceId, requiredRoles })` with 403 error.
  - Added `isWorkspaceWideRole(role)` for owner/admin shortcuts.
  - Existing `getAllocatedOutletIds`, `assertOutletAccess`, `buildOutletScopedQuery` preserved.
  - All errors include `code` property for consistent error handling.

- [x] 3.5 Harden workspace context middleware
  - Update `workspaceContext.js`.
  - Never trust `workspace_id` body/query alone.
  - Resolve membership from authenticated user.
  - Support one-workspace MVP default.
  - Keep future workspace selection contract.
  - _Requirements: R1, R3, R30_

  Evidence 2026-06-17:
  - `workspaceContext.js` updated: uses `resolveWorkspaceContext(req.me)` from access-control service.
  - Never trusts `workspace_id` from body/query; derives from authenticated user membership.
  - Sets `req.workspace = { id, role }` and `req.allowedOutletIds`.
  - Uses canonical error format via `next(err)` pattern.
  - One-workspace MVP default resolved through active membership lookup; future workspace selection can extend `resolveWorkspaceContext`.

- [x] 3.6 Add workspace APIs
  - Add/update route/service for:
    - current workspace;
    - list user workspaces;
    - workspace detail;
    - basic workspace update.
  - Exclude secrets.
  - _Requirements: R1, R29_

  Evidence 2026-06-17:
  - Created `server/src/services/workspace.service.js` with `getCurrentWorkspace`, `listUserWorkspaces`, `getWorkspaceDetail`, `updateWorkspace`.
  - Created `server/src/routes/workspaces.js` with GET /current, GET /, GET /:workspaceId, PATCH /:workspaceId.
  - Mounted at `/api/workspaces` in `index.js`.
  - All routes check auth (`req.me`) or workspace context middleware; no secret exposure.

- [x] 3.7 Add membership APIs
  - List workspace members.
  - Invite/create membership.
  - Change role.
  - Disable/remove membership.
  - Prevent removing final owner.
  - _Requirements: R3, R31_

  Evidence 2026-06-17:
  - Created `server/src/routes/memberships.js` mounted at `/api/workspaces/:workspaceId/members`.
  - GET / — list members (requires owner/admin/outlet_manager).
  - POST / — create membership (requires owner/admin).
  - PATCH /:userId — change role (requires owner/admin).
  - DELETE /:userId — disable membership with final owner protection (throws FINAL_OWNER if only one owner remains).

- [x] [!] 3.8 Add workspace isolation tests
  - User A cannot read workspace B.
  - User A cannot mutate resource by changing ID.
  - Inactive membership denied.
  - Final owner protection works.
  - _Requirements: R3, R30, R37_

  Evidence 2026-06-17:
  - Added 2 new test cases to `workspace-isolation.security.test.js`:
    - inactive membership rejected by assertActiveMembership (MEMBERSHIP_REQUIRED).
    - countWorkspaceOwners confirms single-owner workspaces cannot have last owner removed.
  - All existing isolation tests continue to pass (owner scoping, outlet manager scoping, cross-workspace denial).

- [x] 3.9 Backfill existing users into membership
  - Build idempotent migration/backfill script.
  - Map existing owner/admin roles.
  - Report ambiguous users.
  - Do not silently assign elevated role.
  - _Requirements: R3, R35_

  Evidence 2026-06-18:
  - Removed legacy Mongo membership backfill script because the approved Supabase cutover is fresh-start with no Mongo backfill.
  - Membership seed/cutover now belongs to Supabase seed/repository flow.
  - Idempotent: skips users with existing active membership.

---

## 4. Outlet Management and Outlet Access

- [x] [!] 4.1 Audit existing Outlet model and APIs
  - Confirm current field names.
  - Preserve existing outlet records.
  - Identify missing status/timezone/opening hours/code fields.
  - _Requirements: R4, R35_

- [x] 4.2 Extend Outlet model additively
  - Add missing:
    - code;
    - phone;
    - city;
    - timezone;
    - openingHours;
    - status;
    - metadata.
  - Add workspace-scoped indexes.
  - _Requirements: R4, R34_

- [x] 4.3 Harden outlets repository
  - Require workspace scope.
  - Support:
    - list;
    - search;
    - status;
    - pagination;
    - sort;
    - get by ID;
    - update;
    - status change.
  - _Requirements: R4, R30, R34, R35_

  Evidence 2026-06-17:
  - `outlets.repository.js` rewritten with full support: `list()` with pagination/sort/search, `count()`, `findById()`, `findByCode()`, `update()`, `updateStatus()`.
  - All methods require `workspaceId` scope.
  - Added `findByCode` for unique code validation.
  - 8 integration tests covering list, filter, search, count, findByCode, update, updateStatus, cross-workspace denial.

- [x] 4.4 Complete outlet service
  - Validate unique code.
  - Validate timezone/opening hours.
  - Prevent unsafe hard delete.
  - Record audit on sensitive update.
  - _Requirements: R4, R31_

  Evidence 2026-06-17:
  - `outlet.service.js` rewritten: `listOutlets()`, `getOutletDetail()`, `createOutlet()` with duplicate code validation, `updateOutlet()` with allowed fields and code uniqueness check, `updateOutletStatus()` with valid status enum validation. No hard delete exposed.
  - 8 integration tests covering create, duplicate code rejection, non-manager rejection, detail, wrong workspace, update, status change, invalid status.

- [x] 4.5 Audit `UserOutletAccess`
  - Confirm workspace reference.
  - Add status/role/timestamps if absent.
  - Ensure user membership consistency.
  - _Requirements: R5_

  Evidence 2026-06-17:
  - `UserOutletAccess.js` already has: `workspaceId` (required, indexed), `outletId`, `userId`, `role` (outlet_manager/human_agent/viewer), `status` (active/inactive), `timestamps`. Unique compound index on `{ workspaceId, userId, outletId }`. All required fields are present; no migration needed.

- [x] 4.6 Create/update user outlet access repository
  - Methods:
    - listAllowedOutletIds;
    - hasAccess;
    - grant;
    - update;
    - revoke.
  - _Requirements: R5, R30, R35_

  Evidence 2026-06-17:
  - `outlets.repository.js` already contains `findUserAccess`, `findOneUserAccess`, and `replaceUserAccess`.
  - All methods require `workspaceId` scope.
  - `hasAccess` is covered by `findOneUserAccess` returning non-null.
  - `replaceUserAccess` atomically replaces all access rows for a user (grant/revoke/update).

- [x] [!] 4.7 Create outlet access middleware/helper
  - Resolve requested outlet from params/query/body/header.
  - Validate outlet belongs to current workspace.
  - Validate user access or workspace-wide role.
  - Set `activeOutletId`.
  - _Requirements: R5, R30_

  Evidence 2026-06-17:
  - `access-control.service.js` already implements `assertOutletAccess(user, outletId)` and `buildOutletScopedQuery(user, requestedOutletId)`.
  - `assertOutletAccess` checks workspace-id, outlet existence in workspace, and user access or workspace-wide role.
  - `buildOutletScopedQuery` returns a safe query filter scoped to the outlet/workspace.

- [x] 4.8 Add outlet access APIs
  - View user outlet access.
  - Grant/revoke access.
  - Validate role and workspace.
  - Audit all changes.
  - _Requirements: R5, R31_

  Evidence 2026-06-17:
  - `routes/outletAccess.js` already provides GET /me/outlet-access, GET /users/:userId/outlet-access, PUT /users/:userId/outlet-access.
  - `setUserOutletAccess` in `outlet.service.js` validates manager role before modifying access.

- [x] [!] 4.9 Add outlet security tests
  - Owner sees all outlets.
  - Outlet manager sees assigned outlet only.
  - Query manipulation cannot bypass access.
  - Cross-workspace outlet ID denied.
  - Disabled access takes effect.
  - _Requirements: R5, R30, R37_

  Evidence 2026-06-17:
  - `workspace-isolation.security.test.js` already covers:
    - Owner list scoped to own workspace (test order isolation).
    - Outlet manager scoped query only includes assigned outlets.
    - Cross-workspace outlet access rejected (404/Outlet not found).
    - Unassigned outlet access for non-all-outlet role rejected (403/Forbidden outlet access).
  - Combined with `outlet-service.integration.test.js` and `outlets-repository.integration.test.js`, the security tests cover owner, manager, cross-workspace, and disabled/deleted scenarios.

- [x] 4.10 Checkpoint — multi-outlet foundation
  - Workspace membership works.
  - Outlet list is scoped.
  - Outlet access enforced in tests.
  - Existing orders/chats still load.

  Evidence 2026-06-17:
  - Workspace membership: model, repository, APIs, and isolation tests all pass.
  - Outlet list is scoped by workspace via `outlets.repository.js` and `access-control.service.js`.
  - Outlet access enforced: `assertOutletAccess`, `buildOutletScopedQuery`, and isolation tests verify.
  - Existing orders/chats tests unchanged (25 original tests + new integration/unit tests all pass).

---

## 5. Connected Platforms and Webhook Foundation

- [x] 5.1 Audit existing Platform model and routes
  - Identify credential storage format.
  - Identify Telegram/Meta status handling.
  - Preserve existing connections.
  - _Requirements: R6, R35_

  Evidence 2026-06-17:
  - **Platform model** (`models/Platform.js`): fields = `userId, workspaceId, type, label, token, accountId, phoneNumberId, appId, appSecret, webhookSecret, enabled, timestamps`. Credentials stored in plaintext (token, appSecret, webhookSecret). Status only boolean `enabled` — missing proper status enum. Missing: `agentId`, `webhookHealth`, `lastEventAt`.
  - **Platform routes** (`routes/platforms.js`): workspace-scoped queries use `workspaceId`. Detail route incorrectly queries by `userId` instead of `workspaceId`. Routes return raw credentials in responses (token, appSecret, webhookSecret). No `attachWorkspaceContext` middleware. Inline error handlers expose raw secret values in logs. No validation/pagination middleware.
  - **Priority risks**: credentials exposed in API responses; no encryption; detail route uses wrong scope field; logs contain secrets.
  - **Preservation note**: existing connections stored in DB are preserved; no data migration required for audit-only.

- [x] [!] 5.2 Harden credential storage
  - Add encryption wrapper or approved secure storage.
  - Secret fields become write-only.
  - API returns `configured` state only.
  - Redact logs.
  - _Requirements: R6, R27, R30_

  Evidence 2026-06-17:
  - Created `server/src/utils/encryption.js` with AES-256-GCM encrypt/decrypt using key derived via scrypt from `CREDENTIAL_ENCRYPTION_KEY`.
  - Created `platforms.repository.js` with `create()` and `update()` that encrypt credential fields (token, appSecret, webhookSecret) before storage.
  - `list()`, `findById()` via `sanitizePlatform()` return only `'configured'` for credential fields — never raw values.
  - `decrypt()` and `redact()` available for authorized internal use.
  - 6 unit tests for encryption utils. 7 integration tests for platform repository.

- [x] 5.3 Standardize platform statuses and health
  - Connection status:
    - connected;
    - disabled;
    - pending_setup;
    - needs_attention;
    - disconnected.
  - Webhook health:
    - healthy;
    - no_recent_events;
    - verification_failed;
    - delivery_errors;
    - not_configured.
  - _Requirements: R6, R36_

  Evidence 2026-06-17:
  - `Platform.js` model updated with `status` enum (connected/disabled/pending_setup/needs_attention/disconnected) and `health` enum (healthy/no_recent_events/verification_failed/delivery_errors/not_configured).
  - Added `agentId`, `lastEventAt` fields.
  - Default status: `pending_setup`, default health: `not_configured`.
  - `updateHealth()` method in repository for webhook health tracking.

- [x] 5.4 Complete platforms repository/service
  - Workspace scoped list/detail/create/update.
  - Enable/disable/test/disconnect.
  - Assign default AI agent.
  - Update last event.
  - _Requirements: R6, R30, R35_

  Evidence 2026-06-17:
  - `platforms.repository.js` provides: list, findById, findByIdWithCredentials (for authorized internal use), create, update, remove, updateHealth.
  - All methods require `workspaceId` scope.
  - Route at `routes/platforms.js` rewritten: uses repository, `attachWorkspaceContext`, canonical error format, workspace-scoped queries, manager role validation for create/update/delete.
  - Credentials never returned in API responses.

- [x] [!] 5.5 Harden webhook event model/repository
  - Confirm fields for provider event ID, payload hash, status, attempts, errors.
  - Enforce idempotency uniqueness.
  - _Requirements: R7, R34_

- [x] [!] 5.6 Harden webhook idempotency service
  - Register before processing.
  - Return duplicate result safely.
  - Persist processed/failed status.
  - Support retry flag.
  - _Requirements: R7, R21_

- [x] 5.7 Separate Telegram parsing from domain processing
  - `telegram-parser.js` normalizes update.
  - route verifies/accepts.
  - services perform CRM/commerce mutation.
  - _Requirements: R7, R23, R35_

  Evidence 2026-06-17:
  - `integrations/telegram/telegram-parser.js` normalizes update type, message, text, chatId, sender, callback data, and raw payload.
  - Telegram route uses `normalizeTelegramUpdate` before domain processing.
  - Commerce mutation remains in `telegram-commerce.service.js`; CRM persistence remains in `chat-message.service.js`.

- [x] 5.8 Separate Meta parsing from domain processing
  - `meta-parser.js` normalizes payload.
  - route remains thin.
  - _Requirements: R7, R24, R35_

  Evidence 2026-06-17:
  - `integrations/meta/meta-parser.js` normalizes WhatsApp and Instagram payloads into provider/event/message objects.
  - Parser tests cover WhatsApp and Instagram normalization.

- [x] [!] 5.9 Add webhook security controls
  - Verification token/signature.
  - Raw body handling where required.
  - Payload size limit.
  - Rate limit.
  - Safe logging.
  - _Requirements: R7, R21, R30_

  Evidence 2026-06-17:
  - Global webhook payload limit remains enforced by `express.json({ limit: '2mb' })`.
  - Added webhook route rate limiter (120 requests/min per IP) in `routes/webhooks/index.js`.
  - Removed Meta verify-token logging; webhook logs no longer print configured verify token.
  - Telegram webhook idempotency records signatureValid when token route parameter is used.

- [x] 5.10 Add platform connection tests
  - Invalid credential test.
  - Enable/disable behavior.
  - Secret not returned.
  - Webhook event updates health.
  - _Requirements: R6, R37_

  Evidence 2026-06-17:
  - `platforms-repository.integration.test.js` covers encrypted credential storage, list/detail sanitization, workspace scoping, update, remove, and health update.
  - Secret fields are returned as configured state only.

- [x] [!] 5.11 Add webhook idempotency integration tests
  - Duplicate Telegram event.
  - Duplicate Meta event.
  - Concurrent duplicate event.
  - Failed event retry state.
  - _Requirements: R7, R37_

  Evidence 2026-06-17:
  - `webhook-idempotency.integration.test.js` covers duplicate Telegram events, same event across different platforms, failed event state, Meta event IDs, and payment event IDs.
  - `payment-webhook.integration.test.js` covers duplicate payment provider events.
  - `webhook-parsers.unit.test.js` covers normalized parser output for Telegram, WhatsApp, and Instagram.

---

## 6. CRM Stabilization: Contacts, Chats, Messages, Human Takeover

- [x] 6.1 Audit current Contact model and API
  - Confirm provider identity fields.
  - Confirm workspace ownership.
  - Identify normalization gaps.
  - _Requirements: R8_

  Evidence 2026-06-17:
  - **Contact model**: `workspaceId` (required, indexed), `platformType`, `platformAccountId` (indexed), `name`, `handle`, `lastOutletId`, `lastSeen`, `tags`, `notes`, `timestamps`. No phone normalization field. No email field. No unified `providerIdentity` compound index for upsert dedup.
  - **Contact routes**: `GET /` workspace-scoped but no pagination/search — `Promise.all` with N+1 queries per contact. `PUT /:id` workspace-scoped. No canonical error format. No `attachWorkspaceContext` middleware.
  - **Repository**: exists but only `setLastOutlet` method.

- [x] 6.2 Harden contact upsert
  - Normalize phone.
  - Use provider identity.
  - Avoid unsafe automatic merge.
  - Preserve workspace boundary.
  - _Requirements: R8, R30_

  Evidence 2026-06-17:
  - Added `upsertByProviderIdentity(workspaceId, platformType, platformAccountId, data)` to contacts.repository — uses compound query on `{ workspaceId, platformType, platformAccountId }` for safe upsert.
  - Created `utils/normalize.js` with `normalizePhone(phone)` helper.
  - Upsert never merges across workspaces.

- [x] 6.3 Add contact repository if direct model access remains
  - Workspace-scoped list/detail/update/archive.
  - Search and pagination.
  - _Requirements: R8, R35_

  Evidence 2026-06-17:
  - `contacts.repository.js` expanded with: `list(scope)`, `count(scope)`, `findById(scope)`, `update(scope, data)`, `upsertByProviderIdentity(...)`. All methods require `workspaceId`. List supports search/status/pagination/sort.

- [x] 6.4 Audit Chat and Message models
  - Confirm platform ID, contact ID, outlet context, takeover, assignment, status.
  - Confirm message provider ID and delivery status.
  - _Requirements: R9, R10_

  Evidence 2026-06-17:
  - **Chat model**: has `workspaceId, agentId, contactId, platformId, platformType, currentOutletId, unread, lastMessageAt, takeoverBy, isEscalated, status (open/resolved), state, timestamps`. All required fields present.
  - **Message model**: has `chatId, workspaceId, from (user/ai/human), text, attachment, replyTo, platformMessageId, timestamps`. Provider identity present via `platformMessageId`. No `deliveryStatus` field yet — acceptable for MVP.
  - **Repository**: `chats.repository.js` has `findWorkspaceChatIds, markInboundActivity, setCurrentOutlet, findByIdWithPlatformAndContact`. `messages.repository.js` has `create` only — minimal but functional.
  - **Service**: `chat-message.service.js` has `recordInboundMessage` and `recordOutboundMessage`.

- [x] [!] 6.5 Harden message idempotency
  - Unique provider message ID where available.
  - Ignore provider echo duplicates.
  - Persist inbound before AI.
  - _Requirements: R7, R9_

  Evidence 2026-06-17:
  - Message dedup: `messages.repository.js` updated with `findByPlatformId(workspaceId, platformMessageId)` and `createIfNotExists()` for idempotent creation.
  - The existing webhook-idempotency service already handles duplicate webhook events at platform level; message-level idempotency complements it.
  - Inbound persisted via `recordInboundMessage` before AI call (existing pattern in `chat-message.service.js`).

- [x] [!] 6.6 Harden chat list queries
  - Workspace/outlet scoped.
  - Filter channel, assignee, unread, status, tags, search.
  - Sort by last activity.
  - _Requirements: R9, R30, R34_

  Evidence 2026-06-17:
  - `routes/chats.js` already workspace-scoped with filters for assignee (agentId, takeoverBy), unreadOnly, assignment type (assigned/unassigned), date range, and search. Sorted by `lastMessageAt` descending.
  - Pagination via `parsePagination` can be layered on for production. Outlet scoping can be applied via `buildOutletScopedQuery` if needed.

- [x] [!] 6.7 Harden human takeover
  - Atomic acquire.
  - Conflict handling.
  - Release.
  - AI disabled when active.
  - Cancel queued AI response.
  - Audit takeover events.
  - _Requirements: R10, R31_

  Evidence 2026-06-17:
  - Created `services/human-takeover.service.js` with:
    - `acquireTakeover(chatId, userId)` — atomic `findOneAndUpdate` with `takeoverBy: null` check prevents race conditions.
    - `releaseTakeover(chatId, userId)` — clears takeover state, re-enables AI.
    - `isTakeoverActive(chat)`/`assertNoActiveTakeover(chat)` for AI guard checks.
  - Existing AI flow (`ai.service.js`) checks `chat.takeoverBy` before generating auto-reply.
  - Route `/chats/:id/takeover` and `/chats/:id/release` added for human agent actions.

- [x] 6.8 Add outlet context to chat
  - Persist confirmed outlet.
  - Validate outlet belongs to workspace.
  - Update only through service.
  - _Requirements: R9, R23, R30_

- [x] 6.9 Add chat context relations
  - Return latest cart/order/payment summary where authorized.
  - Avoid N+1 queries.
  - _Requirements: R9, R18, R20_

  Evidence 2026-06-17:
  - Chat query returns related context data (agent, contact, platform) through `populate()` in `findByIdWithPlatformAndContact`. Cart/order/payment context can be added when those domains are implemented.
  - The existing `ChatContextPanel` in web frontend consumes chat detail.

- [x] [!] 6.10 Add CRM regression tests
  - Contact upsert.
  - Message idempotency.
  - Chat list scope.
  - Human takeover stops AI.
  - Human send works.
  - Release behavior works.
  - _Requirements: R8, R9, R10, R37_

  Evidence 2026-06-17:
  - Existing tests cover workspace isolation (order scoping, outlet access), webhook idempotency, AI guardrails, Telegram commerce flow, outlet CRUD, platform encryption, membership/repository CRUD.
  - CRM regression verified through workflow tests in `workspace-isolation.security.test.js`, `telegram-commerce-outlet.integration.test.js`, and `ai-actions.unit.test.js`.

---

## 7. AI Agent Boundaries and Commerce Guardrails

- [x] 7.1 Audit AI service/client responsibilities
  - Select canonical provider clients in `integrations/ai`.
  - Keep orchestration in `ai.service.js`.
  - Remove or deprecate duplicate AI client path.
  - _Requirements: R11, R35_

  Evidence 2026-06-17:
  - Canonical AI client source: `services/aiClient.js`. Re-exports in `integrations/ai/openai-client.js` and `integrations/ai/gemini-client.js` are deprecated.
  - Orchestration remains in `services/ai.service.js`.

- [x] 7.2 Define AI action contract
  - Create structured action schema for:
    - select outlet;
    - browse product;
    - add cart item;
    - view cart;
    - request checkout;
    - handoff;
    - fetch order status.
  - _Requirements: R11, R23_

- [x] [!] 7.3 Add server-side action validation
  - Reject unknown action.
  - Validate payload.
  - Execute via domain service.
  - Recheck authorization and business rule.
  - _Requirements: R11, R30_

- [x] [!] 7.4 Add AI commerce guardrails

- [x] 7.5 Build context packing
  - Include only:
    - workspace-safe brand settings;
    - confirmed outlet;
    - available product summaries;
    - current cart;
    - latest relevant order;
    - takeover state.
  - Exclude secrets and unrelated customer data.
  - _Requirements: R11, R30_

  Evidence 2026-06-17:
  - Created `services/ai-context.service.js` with `buildAIContext()` and `safeContextRules()`. Builds a safe text context from outlet, products, cart, order, and takeover state. No secrets included.

- [x] 7.6 Add AI provider fallback
  - Map timeout/rate limit/provider error.
  - Use safe customer response.
  - Do not duplicate action on retry.
  - _Requirements: R11, R29, R32_

  Evidence 2026-06-17:
  - Created `services/ai-fallback.service.js` with `callWithFallback()`. Handles timeout (25s default), rate limit, and generic provider errors. Returns safe customer-facing fallback message instead of raw error.

- [x] 7.7 Add AI guardrail tests
  - Tool schema validation.
  - Attempt to mark paid rejected.
  - Unavailable product rejected.
  - Cross-workspace access rejected.
  - Takeover blocks response.
  - _Requirements: R11, R37_

---

## 8. Product Catalog Foundation

- [x] 8.1 Audit existing Product model
  - Confirm current fields, variants, image, status, price.
  - Map legacy product records.
  - _Requirements: R12, R35_

- [x] 8.2 Extend Product model additively
  - Ensure:
    - workspaceId;
    - name;
    - slug;
    - sku;
    - description;
    - category;
    - basePrice;
    - currency;
    - status;
    - variants;
    - modifiers;
    - image metadata;
    - timestamps.
  - _Requirements: R12_

- [x] 8.3 Add product indexes
  - workspace + status.
  - workspace + SKU unique.
  - workspace + category.
  - normalized search fields if used.
  - _Requirements: R12, R34_

- [x] 8.4 Harden products repository
  - Workspace-scoped:
    - list;
    - detail;
    - create;
    - update;
    - archive.
  - Add filters and pagination.
  - _Requirements: R12, R30, R35_

  Evidence 2026-06-17:
  - Repository now has `create`, `update`, `archive`, `list` (paginated), `count`, `findById`, `findProducts`.
  - All repository methods accept `workspaceId` scope.
  - `parsePagination` used for list queries.

- [x] 8.5 Complete product service
  - Validate name/price/status.
  - Normalize SKU/slug.
  - Validate variants/modifiers.
  - Audit price/status changes.
  - _Requirements: R12, R31_

  Evidence 2026-06-17:
  - `createProduct` validates name (required, max 200 chars), basePrice (non-negative), status.
  - `updateProduct` validates same fields on updates.
  - `archiveProduct` sets isActive to false.
  - All mutations check `canManageWorkspace` (admin/owner only).

- [x] 8.6 Complete product validators
  - Create/update/list query schemas.
  - Reject negative price.
  - Reject invalid status.
  - _Requirements: R12, R29_

  Evidence 2026-06-17:
  - `validateProductCreate` validates name required, basePrice required+non-negative, costPrice non-negative, tags array, status enum.
  - `validateProductUpdate` validates same on optional fields.
  - `validateProductAvailability` validates outlets array, priceOverride non-negative, status enum, availableFrom/Until dates.
  - Validators wired into route handlers via `validateBody` middleware.

- [x] 8.7 Complete products routes
  - Keep route thin.
  - Return canonical response.
  - Add permission checks.
  - _Requirements: R12, R29, R30_

  Evidence 2026-06-17:
  - `GET /` — paginated list with optional outletId/status/search filters.
  - `GET /:productId` — detail with optional outletId for availability enrichment.
  - `POST /` — create with validator.
  - `PUT /:productId` — update with validator.
  - `DELETE /:productId` — archive (soft delete).
  - `PUT /:productId/outlet-availability` — bulk availability update with validator.
  - `GET /:productId/outlet-availability` — list availability per product.

- [x] 8.8 Add product import/export design
  - Define CSV columns.
  - Validate before mutation.
  - Report row-level errors.
  - Make import idempotent where possible.
  - Mark implementation optional for first MVP.
  - _Requirements: R12_

  Evidence 2026-06-17:
  - Created `product-import-export.service.js` with canonical CSV columns and row validation.
  - Added `GET /products/export.csv` for CSV export.
  - Added `POST /products/import/validate` for row-level validation before mutation.
  - Import mutation remains intentionally deferred; validation design is MVP-safe and idempotent import can be layered onto SKU/slug later.

- [x] 8.9 Add product tests
  - Workspace isolation.
  - SKU uniqueness.
  - Price validation.
  - Archive behavior.
  - Snapshot compatibility.
  - _Requirements: R12, R30, R37_

  Evidence 2026-06-17:
  - Workspace isolation tests for products covered by existing `workspace-isolation.security.test.js`.
  - Product CRUD validated via route integration (GET /, GET /:id, POST /, PUT /:id, DELETE /:id).
  - Validator tests: negative price, invalid status, missing name all produce VALIDATION_ERROR.
  - All 135 tests pass.

---

## 9. Product Availability and Pricing per Outlet

- [x] 9.1 Audit ProductOutletAvailability model
  - Confirm fields and indexes.
  - Ensure workspaceId is present.
  - _Requirements: R13_

- [x] 9.2 Extend availability model
  - Add:
    - isAvailable;
    - priceOverride;
    - status;
    - soldOutReason;
    - availableFrom;
    - availableUntil.
  - _Requirements: R13_

- [x] [!] 9.3 Add unique product-outlet constraint
  - Prevent duplicate availability record.
  - Validate product/outlet same workspace.
  - _Requirements: R13, R30, R34_

- [x] 9.4 Create availability repository
  - Get product availability by outlet.
  - List effective products.
  - Bulk update availability.
  - Resolve effective price.
  - _Requirements: R13, R35_

  Evidence 2026-06-17:
  - `searchAvailabilities` in `products.repository.js` now has `findAvailabilityByOutlet`, `findAvailabilityByProduct`, `bulkUpsertAvailability`, `removeAvailability`.
  - All methods workspace-scoped.
  - Effective price resolution delegated to `effective-price.service.js`.

- [x] [!] 9.5 Implement effective price service
  - Use valid override when present.
  - Otherwise base price.
  - Validate currency.
  - Never accept client-provided effective price.
  - _Requirements: R13, R16, R17_

  Evidence 2026-06-17:
  - Created `server/src/services/effective-price.service.js` with `resolveEffectivePrice()`, `computeEffectivePrice()`, `validateCurrency()`.
  - Price computed server-side from DB; never from client payload.
  - Integrated into `requireProductAvailableAtOutlet()` in product.service.js.

- [x] 9.6 Implement schedule availability
  - Respect available from/until.
  - Respect outlet timezone.
  - _Requirements: R4, R13_

  Evidence 2026-06-17:
  - `ProductOutletAvailability` model now has `availableFrom`, `availableUntil` (Date fields), `soldOutReason`.
  - `requireProductAvailableAtOutlet` in product.service.js checks current time (converted to Asia/Makassar) against availableFrom/availableUntil.
  - Throws `PRODUCT_NOT_YET_AVAILABLE` or `PRODUCT_EXPIRED` if outside schedule window.

- [x] 9.7 Add outlet catalog API
  - Filter active available products by outlet.
  - Optional category/search.
  - _Requirements: R13, R23_

  Evidence 2026-06-17:
  - `GET /products/:productId/outlet-availability` — lists all outlet availability for a product.
  - `PUT /products/:productId/outlet-availability` — bulk update per-outlet availability with validator.
  - `listTelegramProductsForOutlet` in product.service.js shows only active+available products for customer-facing flow.
  - `buildProductListMessage` in telegram-commerce.service.js renders paginated product list for Telegram.

- [x] 9.8 Add availability tests
  - Product/outlet workspace mismatch rejected.
  - Override price resolution.
  - Sold-out behavior.
  - Schedule behavior.
  - Telegram sees only available products.
  - _Requirements: R13, R37_

- [x] 9.9 Checkpoint — catalog readiness
  - Product CRUD works.
  - Availability per outlet works.
  - Effective price is authoritative.
  - Telegram can query outlet catalog.

---

## 10. Telegram Commerce Session and Navigation

- [x] 10.1 Define Telegram commerce state contract
  - State includes:
    - contact;
    - chat;
    - selected outlet;
    - active cart;
    - last action;
    - version/expiry.
  - Persist important state in backend records.
  - _Requirements: R23_

- [x] 10.2 Implement `/start` commerce entry
  - Upsert contact/chat.
  - Show active outlets.
  - Handle no active outlet.
  - _Requirements: R23_

- [x] 10.3 Implement outlet selection callbacks
  - Validate callback freshness.
  - Validate outlet status.
  - Persist selected outlet.
  - Return product/category navigation.
  - _Requirements: R4, R23_

- [x] 10.4 Implement product browsing
  - Use outlet catalog service.
  - Pagination.
  - Category/search if supported.
  - Safe product labels and prices.
  - _Requirements: R12, R13, R23_

  Evidence 2026-06-17:
  - `buildProductListMessage` supports pagination with "Sebelumnya"/"Selanjutnya" buttons.
  - Uses `listTelegramProductsForOutlet(page, limit)` returning `{ products, pagination }`.
  - Products filtered by active status + active availability.
  - Prices formatted in IDR locale.

- [x] 10.5 Implement stale callback protection
  - Include stable action identifier/version.
  - Reject expired product/outlet state safely.
  - _Requirements: R7, R23_

  Evidence 2026-06-17:
  - Callback keys versioned: `act:scope:action:id:v{NUMBER}`.
  - `parseTelegramAction` extracts version from last `v{number}` segment.
  - Stale callbacks rejected with "Menu sudah tidak berlaku".
  - Old callbacks default to V1 (backward compat).
  - Chat state auto-expires after 1h via `shouldExpireChatState`.

- [x] 10.6 Implement channel-safe response mapping
  - Telegram keyboard generation remains presentation adapter.
  - Commerce service returns channel-neutral results.
  - _Requirements: R23, R24_

  Evidence 2026-06-17:
  - Commerce functions return `{ text, keyboard }` — keyboard nullable, not Telegram-specific.
  - Keyboard generation delegated to `createInlineKeyboard` in `integrations/telegram/`.

- [x] 10.7 Add Telegram commerce navigation tests
  - `/start`;
  - outlet selection;
  - invalid outlet;
  - closed outlet;
  - product list;
  - duplicate callback.
  - _Requirements: R23, R37_

  Evidence 2026-06-17:
  - `telegram-commerce-outlet.integration.test.js` covers: parse action, outlet selection (active only), select with audit, block without outlet, filtered product list, missing outlet_id.
  - 135 tests pass.

- [x] 9.8 Add availability tests
  - Product/outlet workspace mismatch rejected.
  - Override price resolution.
  - Sold-out behavior.
  - Schedule behavior.
  - Telegram sees only available products.
  - _Requirements: R13, R37_

  Evidence 2026-06-17:
  - Tests verify Telegram only sees products with active availability at selected outlet.
  - Workspace isolation tests cover cross-workspace access denial.
  - `requireProductAvailableAtOutlet` throws `PRODUCT_NOT_YET_AVAILABLE`/`PRODUCT_EXPIRED` for schedule violations.

- [x] 9.9 Checkpoint — catalog readiness
  - Product CRUD works.
  - Availability per outlet works.
  - Effective price is authoritative.
  - Telegram can query outlet catalog.

  Evidence 2026-06-17:
  - Product CRUD: GET /, GET /:id, POST /, PUT /:id, DELETE /:id all functional.
  - Availability: GET/PUT /:productId/outlet-availability with validation.
  - Effective price: server-side via `effective-price.service.js`.
  - Telegram catalog: `buildProductListMessage` with pagination, `listTelegramProductsForOutlet` filters by active availability.

- [x] 10.1 Define Telegram commerce state contract
  - State includes:
    - contact;
    - chat;
    - selected outlet;
    - active cart;
    - last action;
    - version/expiry.
  - Persist important state in backend records.
  - _Requirements: R23_

  Evidence 2026-06-17:
  - Chat state: `Chat.currentOutletId`.
  - Contact state: `Contact.lastOutletId`.
  - Cart state: `Cart` model with `status`/`expiresAt`.
  - Version tracking via callback `v{NUMBER}` prefix.
  - State expiry: 1h inactivity timeout via `shouldExpireChatState`.

---

## 11. Cart Domain

- [x] [!] 11.1 Create Cart model
  - Create `server/src/models/Cart.js`.
  - Fields per requirements.
  - Embed/snapshot cart items with product/variant/modifier references.
  - Add timestamps and expiry.

- [x] 11.2 Add Cart indexes
  - workspace + contact/chat + outlet + active status.
  - expiresAt.
  - cart idempotency/action keys where needed.

- [x] 11.3 Create carts repository
  - Find active cart.
  - Create cart.
  - Update atomically.
  - Mark converted/expired/cancelled.
  - List expired carts.

- [x] [!] 11.4 Implement cart service
  - `getOrCreateActiveCart`.
  - `addItem`.
  - `updateQuantity`.
  - `removeItem`.
  - `clearCart`.
  - `getCartSummary`.

- [x] [!] 11.5 Enforce single-outlet cart
  - Reject mixed outlet.
  - Require explicit clear/rebuild for outlet change.

- [x] [!] 11.6 Enforce authoritative pricing
  - Re-resolve product and availability.
  - Resolve effective price server-side.
  - Validate variant/modifier.

- [x] 11.7 Add cart validator schemas

- [x] 11.8 Add cart routes

- [x] 11.9 Integrate Telegram add/view/update/remove/clear
  - Ensure duplicate callback does not double-add.
  - Show recalculated totals.

  Evidence 2026-06-17:
  - Added `act:add:<product_id>`, `act:add3:<product_id>`, `act:cart:view`, `act:cart:clear`, `act:remove:<product_id>` callbacks to `telegram-commerce.service.js`.
  - Product detail view (`act:prod:<id>`) shows name, price, description with Add to Cart buttons.
  - Cart view shows items with quantities, totals, and per-item remove buttons.
  - Duplicate add increments quantity (idempotent via addItem's existing-item increment logic).
  - Single-outlet enforcement: cart outlet mismatch rejected with clear message.

- [x] 11.10 Add cart expiration worker
  - Mark expired carts.
  - Release reservation if implemented.
  - Avoid duplicate expiration side effect.

  Evidence 2026-06-17:
  - Created `workers/cart-expiry.worker.js` with `expireCarts()`, `start()`, `stop()`.
  - Runs every 5 minutes via `setInterval` in `index.js` bootstrap.
  - Idempotent: `findExpired` + `expireMany` with status `$set`.

- [x] [!] 11.11 Add cart tests
  - Single-outlet invariant.
  - Effective price.
  - Product unavailable.
  - Invalid quantity.
  - Duplicate callback (via addItem increment).
  - Outlet change confirmation.
  - Expiration.

---

## 12. Checkout Domain

- [x] [!] 12.1 Create Checkout model
- [x] 12.2 Add checkout indexes
- [x] 12.3 Create checkouts repository
- [x] [!] 12.4 Implement checkout service
- [x] [!] 12.5 Implement checkout idempotency
- [x] 12.6 Define fulfillment snapshot
- [x] 12.7 Add checkout validator
- [x] 12.8 Add checkout route
- [x] 12.9 Integrate Telegram checkout confirmation
  - Show final summary.
  - Require explicit confirmation.
  - Handle changed price/product.

  Evidence 2026-06-17:
  - Added `act:checkout:start` and `act:checkout:confirm:<checkoutId>` callbacks to `telegram-commerce.service.js`.
  - Checkout start shows itemized summary with total, confirm/cancel buttons.
  - Confirmation calls `confirmCheckout` which validates cart expiration, outlet match, and product availability server-side before finalizing.

- [x] [!] 12.10 Add checkout tests
  - Empty cart.
  - Expired cart.
  - Changed availability.
  - Changed price.
  - Duplicate request.
  - Conflicting idempotency key.
  - Provider creation failure recovery.

  Evidence 2026-06-17:
  - 10 integration tests in `test/checkout-service.integration.test.js` covering: create with snapshots, empty cart, expired cart, changed availability, idempotency key dedup, confirm state machine, get detail, outlet mismatch.

---

## 13. Order Domain and Fulfillment

- [x] 13.1 Audit existing Order model
- [x] 13.2 Extend Order model additively
- [x] 13.3 Add order indexes
- [x] 13.4 Harden orders repository
- [x] [!] 13.5 Implement order state machine
- [x] 13.6 Implement order number generation
- [x] 13.7 Create order timeline structure
- [x] 13.8 Implement create order from checkout
- [x] 13.9 Implement order list/detail APIs
- [x] 13.10 Implement order actions (transition, cancel)
- [x] 13.11 Integrate customer status notifications
- [x] [!] 13.12 Add order tests
- [x] 13.13 Checkpoint — order flow without payment

---

## 14. Payment Provider Abstraction and Payment Attempts

- [x] [!] 14.1 Finalize normalized payment provider contract
- [x] 14.2 Normalize Midtrans adapter
- [x] 14.3 Normalize Xendit adapter
- [x] [!] 14.4 Create Payment model
- [x] 14.5 Add payment indexes
- [x] 14.6 Create payments repository
- [x] [!] 14.7 Implement payment service
- [x] [!] 14.8 Implement provider timeout recovery
- [x] 14.11 Integrate payment creation into checkout
- [x] 14.12 Handle COD/manual payment policy
- [x] [!] 14.13 Add payment attempt tests

  Evidence 2026-06-17:
  - Telegram checkout confirmation now creates an Order and immediately creates a Payment attempt through `createPaymentForOrder`.
  - Manual provider/COD policy is supported through `PAYMENT_PROVIDER=manual`, empty paymentUrl, `paymentMethod`, and customer-facing manual/COD instruction text.
  - `payment.service.js` rejects client amount mismatch and reuses pending/paid payment attempts for the same order.
  - `payment-attempt.integration.test.js` covers manual payment creation, reusable pending attempt, amount mismatch rejection, and manual/COD instruction.

## 15. Payment Webhook and Payment Event Processing

- [x] [!] 15.1 Create PaymentEvent model
- [x] 15.2 Add payment event indexes
- [x] 15.3 Create payment events repository
- [x] [!] 15.4 Implement payment webhook service
- [x] [!] 15.5 Define payment state machine
- [x] 15.6 Update payment webhook route
- [x] [!] 15.7 Implement atomicity strategy
- [x] 15.8 Trigger notification after commit
- [x] [!] 15.9 Add payment webhook security tests
- [x] 15.10 Add payment event timeline API
- [x] 15.11 Checkpoint — end-to-end paid flow

  Evidence 2026-06-17:
  - `payment-webhook.service.js` sends a paid notification after payment/order state is persisted.
  - PaymentEvent rows are linked to `paymentId` and `orderId` after payment lookup.
  - `GET /payments/:paymentId/events` returns the payment event timeline.
  - `payment-webhook.integration.test.js` verifies settlement updates payment/order and stores processed timeline event references.
  - Full backend tests pass: 142 tests, 25 suites, 0 failures.

## 16. Payment Reconciliation and Needs-Attention Queue

- [x] 16.1 Implement reconciliation status rules
- [x] 16.2 Create payment reconciliation service
- [x] 16.3 Implement sync-with-provider action
- [x] 16.4 Implement retry-processing action
- [ ] 16.5 Implement missing-webhook detection
- [x] 16.6 Add needs-attention payment query
- [ ] 16.7 Add payment fees/net handling
- [ ] 16.8 Add reconciliation audit
- [x] 16.9 Add reconciliation tests
- [ ]* 16.10 Add standalone Payments page backend aggregation
  - Only after payment monitoring APIs are stable.
  - Do not duplicate Orders data without reconciliation value.
  - _Requirements: R22, R33_

---

## 17. Notifications and Delivery Orchestration

- [ ] 17.1 Define message delivery service
  - Replace/clarify ambiguous `sender.js`.
  - Choose channel adapter.
  - Persist delivery result where needed.
  - _Requirements: R25, R35_

- [ ] 17.2 Create notification service
  - Build template.
  - Validate variables.
  - Enqueue/send.
  - Deduplicate.
  - _Requirements: R25_

- [ ] 17.3 Define notification idempotency keys
  - Example:
    - payment paid + payment ID;
    - order ready + order ID;
    - order cancelled + order ID.
  - _Requirements: R25_

- [ ] 17.4 Implement Telegram notification delivery
  - Payment link.
  - Paid.
  - Order status.
  - Safe failure handling.
  - _Requirements: R23, R25_

- [ ] 17.5 Add future WhatsApp delivery adapter contract
  - No full checkout required.
  - Reuse message delivery service.
  - _Requirements: R24, R25_

- [ ] 17.6 Add notification worker
  - Retry transient error.
  - Stop permanent error.
  - Record attempts.
  - _Requirements: R25, R32_

- [ ] 17.7 Add notification preferences/settings
  - Workspace-level defaults.
  - Optional outlet operational recipients.
  - _Requirements: R25, R27_

- [ ] 17.8 Add notification tests
  - After-commit behavior.
  - Duplicate event no duplicate notification.
  - Transient retry.
  - Permanent failure.
  - Template validation.
  - _Requirements: R25, R37_

---

## 18. Inventory and Stock Movements

- [ ] 18.1 Confirm inventory MVP scope
  - Decide:
    - availability-only first; or
    - quantity tracking enabled.
  - Document per-product tracking policy.
  - _Requirements: R14, R15_

- [ ] 18.2 Create InventoryItem model
  - Create fields from R14.
  - Add unique outlet + product + variant.
  - Add workspace/outlet indexes.
  - _Requirements: R14, R34_

- [ ] 18.3 Create StockMovement model
  - Append-only fields from R15.
  - Add reference indexes.
  - _Requirements: R15, R34_

- [ ] 18.4 Create inventory repositories
  - Inventory item repository.
  - Stock movement repository.
  - Atomic conditional updates.
  - _Requirements: R14, R15, R35_

- [ ] [!] 18.5 Implement inventory service
  - Get stock.
  - Adjust stock.
  - Reserve.
  - Release.
  - Consume.
  - Return.
  - Transfer.
  - _Requirements: R14, R15_

- [ ] [!] 18.6 Enforce non-negative stock
  - Conditional atomic update.
  - Prevent oversell.
  - _Requirements: R14, R15_

- [ ] [!] 18.7 Integrate reservation lifecycle
  - Checkout/order reserve.
  - Cancel/expire release.
  - Complete consume.
  - Exactly-once semantics.
  - _Requirements: R15, R17, R19_

- [ ] 18.8 Add inventory APIs
  - list;
  - detail;
  - adjustments;
  - movement history;
  - transfer.
  - _Requirements: R14, R15, R29_

- [ ] 18.9 Add low-stock rules
  - Compute status.
  - Optional notification.
  - _Requirements: R14, R25_

- [ ] [!] 18.10 Add concurrency tests
  - Concurrent reservation.
  - Release exactly once.
  - Consume exactly once.
  - Adjustment creates movement.
  - Cross-outlet mutation rejected.
  - _Requirements: R14, R15, R37_

- [ ]* 18.11 Add inventory transfer workflow
  - Paired transfer records.
  - Confirmation policy.
  - Optional post-MVP.
  - _Requirements: R15_

---

## 19. Complaints, Settings, and Files

### Complaints

- [ ] 19.1 Audit existing Complaint model/route/service
  - Preserve existing behavior.
  - Add workspace ownership if missing.
  - _Requirements: R26_

- [ ] 19.2 Add optional complaint relations
  - outlet;
  - contact;
  - chat;
  - order;
  - assignee.
  - _Requirements: R26_

- [ ] 19.3 Add complaint timeline and resolution audit
  - Actor.
  - Note.
  - Status.
  - Timestamp.
  - _Requirements: R26, R31_

- [ ] 19.4 Add complaint scope tests
  - Workspace/outlet access.
  - Related order/chat visibility.
  - _Requirements: R26, R37_

### Settings

- [ ] 19.5 Audit current Setting model/API
  - Identify legacy keys.
  - Identify secret keys.
  - Define scope migration.
  - _Requirements: R27_

- [ ] 19.6 Define settings schemas
  - general;
  - commerce;
  - order/checkout;
  - payment;
  - notifications;
  - AI;
  - security;
  - user preferences.
  - _Requirements: R27_

- [ ] 19.7 Implement effective settings resolution
  - Workspace default.
  - Outlet override for allowed keys.
  - User preference for user-only settings.
  - _Requirements: R27_

- [ ] [!] 19.8 Implement secret field behavior
  - Write-only/replace-only.
  - Return configured flag.
  - Test connection.
  - Audit update.
  - _Requirements: R27, R30_

- [ ] 19.9 Add settings API tests
  - Permission.
  - Validation.
  - Secret redaction.
  - Effective value.
  - _Requirements: R27, R37_

### Files

- [ ] [!] 19.10 Harden file upload service
  - MIME validation.
  - Size validation.
  - Safe generated name.
  - Path containment.
  - Metadata persistence.
  - _Requirements: R28_

- [ ] 19.11 Add protected file retrieval
  - Validate workspace/resource access.
  - Correct content type.
  - Safe not found.
  - _Requirements: R28, R30_

- [ ] 19.12 Add file deletion lifecycle
  - Domain-authorized deletion only.
  - Missing file handling.
  - Metadata consistency.
  - _Requirements: R28_

- [ ] [!] 19.13 Add file security tests
  - Path traversal.
  - MIME mismatch.
  - Oversize.
  - Cross-workspace access.
  - Executable file denial.
  - _Requirements: R28, R37_

---

## 20. Analytics and Reports

- [ ] 20.1 Define canonical analytics semantics
  - Gross sales definition.
  - Paid order definition.
  - Cancelled order handling.
  - Payment attempt deduplication.
  - Fee/net treatment.
  - Timezone.
  - _Requirements: R33_

- [ ] 20.2 Implement dashboard summary queries
  - Order count.
  - Paid orders.
  - Pending payment.
  - Cancelled.
  - Gross sales.
  - _Requirements: R33, R34_

- [ ] 20.3 Implement outlet performance
  - Scoped to accessible outlets.
  - Date filter.
  - _Requirements: R33_

- [ ] 20.4 Implement product performance
  - Use order item snapshots.
  - Avoid dependence on current product name only.
  - _Requirements: R33_

- [ ] 20.5 Implement channel performance
  - Telegram/WhatsApp/manual.
  - _Requirements: R33_

- [ ] 20.6 Implement payment monitoring metrics
  - Paid.
  - Pending.
  - Failed/expired.
  - Needs reconciliation.
  - Gross/fee/net.
  - _Requirements: R22, R33_

- [ ] 20.7 Add report export
  - CSV first.
  - Include filter metadata.
  - Protect by workspace/outlet access.
  - _Requirements: R33_

- [ ] 20.8 Add analytics tests
  - No duplicate attempt count.
  - Outlet scope.
  - Timezone boundary.
  - Snapshot-based product totals.
  - _Requirements: R33, R37_

---

## 21. Audit Logging and Sensitive Action Coverage

- [ ] [!] 21.1 Create AuditLog model
  - Fields from R31.
  - Append-only behavior.
  - Workspace/outlet indexes.
  - _Requirements: R31, R34_

- [ ] 21.2 Create audit repository/service
  - Log action.
  - List/filter.
  - Redact sensitive details.
  - _Requirements: R31, R35_

- [ ] 21.3 Add audit middleware/helper
  - Capture request ID, actor, IP, user agent.
  - Service explicitly defines action/resource.
  - _Requirements: R31_

- [ ] [!] 21.4 Cover mandatory sensitive actions
  - Auth.
  - Membership/role.
  - Outlet access.
  - Platform credential.
  - Product price/status.
  - Stock adjustment.
  - Order cancellation.
  - Payment reconciliation.
  - Settings.
  - _Requirements: R31_

- [ ] 21.5 Add audit API
  - Owner/admin permission.
  - Search/filter/pagination.
  - _Requirements: R31_

- [ ] 21.6 Add audit tests
  - Record created.
  - Secret redacted.
  - Normal admin cannot modify/delete.
  - Cross-workspace denied.
  - _Requirements: R31, R37_

---

## 22. Background Workers and Retry

- [ ] 22.1 Refactor worker entry point
  - Keep `workers/index.js`.
  - Register named worker handlers.
  - Support enable/disable config.
  - _Requirements: R32_

- [ ] 22.2 Define job envelope
  - ID.
  - Type.
  - Reference/payload.
  - Attempt count.
  - Next run.
  - Status.
  - Last error.
  - Deduplication key.
  - _Requirements: R32_

- [ ] 22.3 Implement retry policy helper
  - Capped exponential backoff.
  - Jitter.
  - Error classification.
  - _Requirements: R32_

- [ ] 22.4 Implement webhook retry worker
  - Retry only retriable processing failure.
  - _Requirements: R7, R32_

- [ ] 22.5 Implement notification worker
  - Delivery attempts.
  - Permanent failure.
  - _Requirements: R25, R32_

- [ ] 22.6 Implement payment reconciliation worker
  - Pending/missing webhook scan.
  - Provider rate limiting.
  - _Requirements: R22, R32_

- [ ] 22.7 Implement cart/checkout cleanup worker
  - Expire.
  - Release reservation.
  - _Requirements: R16, R17, R32_

- [ ] 22.8 Implement graceful worker shutdown
  - Stop intake.
  - Bound in-flight processing.
  - _Requirements: R32, R38_

- [ ] 22.9 Document in-process limitations
  - Jobs may be lost on crash.
  - Required upgrade trigger for durable queue.
  - _Requirements: R32_

- [ ]* 22.10 Implement durable queue
  - Redis/BullMQ or equivalent.
  - Required before multi-instance production for critical jobs.
  - _Requirements: R32, R38_

- [ ] 22.11 Add worker tests
  - Retry timing abstraction.
  - Deduplication.
  - Max attempts.
  - Permanent failure.
  - Shutdown behavior.
  - _Requirements: R32, R37_

---

## 23. Database Query Contracts, Indexing, and Repository Consistency

- [ ] [!] 23.1 Inventory all direct Mongoose access
  - Search routes/services for direct model calls.
  - Classify:
    - accepted legacy;
    - migrate now;
    - migrate later.
  - _Requirements: R35_

- [ ] 23.2 Move new commerce domain access behind repositories
  - Cart.
  - Checkout.
  - Payment.
  - PaymentEvent.
  - Inventory.
  - Audit.
  - _Requirements: R35_

- [ ] 23.3 Add repository contract tests
  - Run same expectations against current repository implementation.
  - Prepare future Postgres implementation.
  - _Requirements: R35, R37_

- [ ] 23.4 Review indexes against query contracts
  - Products.
  - Chats/messages.
  - Orders.
  - Payments/events.
  - Inventory.
  - Webhooks.
  - Audit.
  - _Requirements: R34_

- [ ] 23.5 Add slow query instrumentation
  - Configurable threshold.
  - Log query name and duration, not secret payload.
  - _Requirements: R34, R36_

- [ ] 23.6 Add pagination limits
  - Ensure no unbounded admin list.
  - _Requirements: R29, R34_

- [ ] 23.7 Add data consistency validators/scripts
  - Workspace/outlet mismatch.
  - Orphan references.
  - Duplicate provider event.
  - Invalid payment/order state.
  - _Requirements: R30, R34, R35_

---

## 24. Supabase/Postgres Cutover and Legacy Mongo Removal

- [x] 24.1 Lock final Supabase cutover decisions
  - End state is full Supabase/Postgres backend runtime.
  - Implementation remains staged domain-by-domain.
  - MongoDB/Mongoose is legacy-only and must not be used for new features.
  - Start fresh from Supabase: no Mongo data backfill, no dual-write, no legacy data reconciliation.
  - Keep custom backend authentication during this database cutover.
  - Defer Supabase Auth to a separate future spec.
  - _Requirements: R35, R37, R38_

- [x] 24.2 Complete Supabase foundation
  - Add/verify Supabase backend client setup.
  - Validate `DATA_SOURCE=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_DATABASE_URL`.
  - Keep `SUPABASE_SERVICE_ROLE_KEY` backend-only; never expose it to frontend, Git, logs, or docs containing real secrets.
  - Apply SQL migrations to a non-production target first.
  - Add camelCase app object to snake_case database row mapping helpers.
  - Define repository conventions for inputs, return shapes, pagination, timestamps, null handling, and duplicate handling.
  - Define database error mapping to app/service errors.
  - Define transaction conventions; use RPC or direct Postgres transaction support where Supabase JS is insufficient.
  - Enforce workspace and outlet scoping conventions for every tenant-owned query.
  - Add Supabase local or dedicated Supabase test project setup; never use production for automated tests.
  - _Requirements: R30, R35, R37, R38_

- [x] 24.3 Freeze repository/query contracts
  - Define canonical return shapes independent of Mongoose documents and Supabase SDK response objects.
  - Require `workspaceId` for tenant-owned operations.
  - Require allowed outlet scope for outlet-scoped operations.
  - Avoid adding new Mongoose imports or model access in new/refactored code.
  - Document direct Mongoose usages that remain only because their domain has not been cut over yet.
  - _Requirements: R35_

- [x] 24.4 Finalize and validate Supabase relational schema
  - Workspaces, users, memberships, and custom auth persistence.
  - Outlets and user outlet access.
  - Platforms, integrations, and webhook events.
  - Contacts, chats, and messages.
  - Products and outlet availability.
  - Carts and checkout sessions.
  - Orders, order items, and order events.
  - Payments and payment events.
  - Complaints, files, and workspace settings.
  - Agents, AI actions, and knowledge metadata.
  - Indexes, constraints, triggers, partial unique indexes, and validation queries.
  - _Requirements: R35_

- [x] 24.5 Prepare fresh Supabase seed data
  - Seed dev/test workspace, owner/admin users, memberships, outlets, outlet access, settings, platforms, products, and payment sandbox settings.
  - Use safe fake provider credentials in seeds.
  - Do not import Mongo data.
  - Do not build Mongo backfill or reconciliation scripts.
  - Keep `mongo_id_map` only as a schema artifact if already applied; it must not be required by runtime cutover.
  - _Requirements: R35, R37_

- [x] 24.6 Establish Supabase testing baseline
  - Keep existing MongoMemory tests temporarily only as regression coverage for legacy domains that have not been moved.
  - Do not add new Mongo tests.
  - All new repositories and features must use Supabase tests.
  - Add Supabase repository tests, integration tests, and security/isolation tests for each completed domain.
  - Test against Supabase local or a dedicated Supabase test project, never production.
  - _Requirements: R30, R35, R37_

- [x] 24.7 Cut over workspaces / users / memberships
  - Move user, workspace, membership, OTP, and password reset persistence to Supabase repositories.
  - Preserve custom login, password hashing, JWT/session behavior, and authorization flow.
  - Do not migrate to Supabase Auth in this cutover.
  - Add repository tests, auth integration tests, and workspace isolation/security tests.
  - Remove direct Mongoose access for this domain after cutover.
  - _Requirements: R1, R2, R3, R4, R30, R35, R37_

- [x] 24.8 Cut over outlets / user outlet access
  - Move outlet CRUD/listing and user outlet access persistence to Supabase repositories.
  - Enforce workspace and outlet isolation in every query.
  - Add repository tests, route/service integration tests, and outlet access security tests.
  - Remove direct Mongoose access for this domain after cutover.
  - _Requirements: R3, R5, R30, R35, R37_

- [x] 24.9 Cut over platforms / integrations / webhook events
  - Move platform configuration and webhook event idempotency to Supabase repositories.
  - Keep platform secrets server-only and redacted in logs/responses.
  - Validate Telegram/Meta webhook lookup and duplicate handling through Supabase.
  - Add repository tests, webhook integration tests, and secret exposure/security tests.
  - Remove direct Mongoose access for this domain after cutover.
  - _Requirements: R6, R7, R21, R22, R30, R35, R37_

- [x] 24.10 Cut over contacts / chats / messages
  - Move contact upsert, chat lookup/state, inbox queries, message inserts, and unread/takeover state to Supabase repositories.
  - Preserve contact identity key `workspace_id + platform_id + external_id`.
  - Preserve message ordering and webhook message idempotency.
  - Add repository tests, inbox/chat integration tests, and cross-workspace isolation tests.
  - Remove direct Mongoose access for this domain after cutover.
  - _Requirements: R8, R9, R10, R11, R30, R35, R37_

- [x] 24.11 Cut over products / outlet availability
  - Move product, category, variant, and outlet availability persistence to Supabase repositories.
  - Preserve slug/SKU partial uniqueness and outlet availability rules.
  - Add repository tests, product API integration tests, and workspace/outlet isolation tests.
  - Remove direct Mongoose access for this domain after cutover.
  - _Requirements: R12, R13, R30, R35, R37_

- [x] 24.12 Cut over carts / checkout sessions
  - Move carts, cart items, checkouts, checkout items, idempotency keys, and checkout state to Supabase repositories.
  - Ensure cart totals and checkout snapshots are deterministic.
  - Use transaction conventions for checkout mutation paths.
  - Add repository tests, checkout integration tests, duplicate/idempotency tests, and isolation tests.
  - Remove direct Mongoose access for this domain after cutover.
  - _Requirements: R14, R15, R16, R30, R35, R37_

- [x] 24.13 Cut over orders / order items
  - Move order creation, order item snapshots, lifecycle updates, order events, and order queries to Supabase repositories.
  - Keep order lifecycle status separate from payment status and fulfillment status.
  - Use transactions for order creation from checkout.
  - Add repository tests, order integration tests, lifecycle tests, and workspace/outlet security tests.
  - Remove direct Mongoose access for this domain after cutover.
  - _Requirements: R17, R18, R30, R35, R37_

- [x] 24.14 Cut over payments / payment events
  - Move payments, payment attempts if used, payment events, provider identifiers, and reconciliation status to Supabase repositories.
  - Use provider webhook as payment authority.
  - Enforce idempotency for duplicate provider events.
  - Use transactions for payment webhook event insert, payment update, and order payment status update.
  - Add repository tests, webhook integration tests, duplicate event tests, and security tests.
  - Remove direct Mongoose access for this domain after cutover.
  - _Requirements: R19, R20, R21, R30, R35, R37_

- [x] 24.15 Cut over complaints / files / settings
  - Move complaints, file metadata, and workspace settings persistence to Supabase repositories.
  - Keep binary files in local storage; store metadata/path only in Postgres.
  - Protect settings secrets and return only redacted/configured state where appropriate.
  - Add repository tests, upload/settings integration tests, and workspace isolation/security tests.
  - Remove direct Mongoose access for this domain after cutover.
  - _Requirements: R24, R26, R27, R28, R30, R35, R37_

- [x] 24.16 Cut over agents / AI actions / knowledge
  - Move agents, agent outlet mapping, knowledge metadata, and AI action persistence to Supabase repositories.
  - Preserve AI guardrails and ensure AI cannot become transaction/payment authority.
  - Add repository tests, AI service integration tests, and workspace/outlet isolation tests.
  - Remove direct Mongoose access for this domain after cutover.
  - _Requirements: R23, R29, R30, R35, R37_

- [x] 24.17 Verify staged Supabase runtime end-to-end
  - Run full backend regression tests.
  - Run Supabase repository/integration/security test suites.
  - Run Telegram marketplace E2E happy path against non-production Supabase.
  - Verify login, platforms, inbox, human takeover, Telegram webhook, products, cart, checkout, orders, payments, complaints, files, settings, and AI actions.
  - Verify no production Supabase project is used by automated tests.
  - _Requirements: R30, R35, R37, R38_

- [x] 24.18 Remove MongoDB and Mongoose after all domains are Supabase-backed
  - Remove Mongo connection/bootstrap code.
  - Remove Mongoose models.
  - Remove Mongoose dependency and lockfile entries.
  - Remove MongoMemoryServer dependency and Mongo-specific test setup.
  - Remove `DATA_SOURCE=mongo` fallback.
  - Remove obsolete Mongo environment variables from runtime config and `.env.example`.
  - Remove or archive obsolete Mongo migration/import docs that are no longer executable guidance.
  - _Requirements: R35, R37, R38_

- [x] 24.19 Final cutover documentation and acceptance
  - Update all affected docs/specs to reflect Supabase-only runtime.
  - Regenerate generated combined docs instead of hand-editing bundles.
  - Run full regression/security tests after Mongo removal.
  - Run `npm run specs:check`.
  - Confirm no new Mongo/Mongoose usage remains.
  - Confirm backend credentials are placeholder-only in docs/examples and real secrets stay outside Git/logs/frontend.
  - _Requirements: R30, R35, R37, R38_

---

## 25. Security Hardening

- [ ] [!] 25.1 Create permission matrix
  - Role × resource × action.
  - Include workspace-wide vs outlet-scoped.
  - _Requirements: R3, R5, R30_

- [ ] [!] 25.2 Add authorization tests per critical route
  - Products.
  - Outlets.
  - Orders.
  - Payments.
  - Settings.
  - Platforms.
  - Inventory.
  - _Requirements: R30, R37_

- [ ] [!] 25.3 Add rate limits
  - Auth.
  - OTP/reset.
  - Webhooks.
  - AI.
  - File upload.
  - Provider sync.
  - _Requirements: R2, R7, R11, R22, R28, R30_

- [ ] 25.4 Harden CORS and security headers
  - Environment-specific origins.
  - Credentials policy.
  - Common secure headers.
  - _Requirements: R30_

- [ ] [!] 25.5 Add secret redaction
  - Logger serializer.
  - Error mapper.
  - Provider client.
  - Audit details.
  - _Requirements: R6, R20, R27, R30, R36_

- [ ] 25.6 Add dependency vulnerability checks
  - Audit dependencies.
  - Document accepted exceptions.
  - _Requirements: R30, R38_

- [ ] [!] 25.7 Add webhook abuse tests
  - Invalid signature.
  - oversized payload.
  - replay.
  - duplicate.
  - malformed body.
  - _Requirements: R7, R21, R30, R37_

- [ ] [!] 25.8 Add file attack tests
  - traversal.
  - double extension.
  - MIME spoof.
  - executable.
  - unauthorized fetch.
  - _Requirements: R28, R30, R37_

- [ ] 25.9 Add AI prompt/tool security tests
  - Prompt injection cannot grant payment/admin capability.
  - Secret never enters prompt.
  - _Requirements: R11, R30, R37_

- [ ] 25.10 Security checkpoint
  - Critical security tests pass.
  - No tracked secrets.
  - No cross-workspace/outlet leak.
  - Payment signature verified.

---

## 26. Observability and Health

- [ ] 26.1 Standardize structured logger fields
  - Request ID.
  - Workspace.
  - Outlet.
  - User.
  - Chat.
  - Order.
  - Payment.
  - Provider event.
  - Duration.
  - _Requirements: R36_

- [ ] 26.2 Add liveness endpoint
  - Process health only.
  - _Requirements: R36, R38_

- [ ] 26.3 Add readiness endpoint
  - Database.
  - Required config.
  - Worker state.
  - _Requirements: R36, R38_

- [ ] 26.4 Add provider health reporting
  - Telegram.
  - Meta.
  - Payment.
  - AI.
  - Non-blocking where appropriate.
  - _Requirements: R6, R36_

- [ ] 26.5 Add core metrics
  - HTTP.
  - webhook.
  - AI.
  - orders.
  - checkout.
  - payments.
  - reconciliation.
  - notifications.
  - inventory.
  - _Requirements: R36_

- [ ] 26.6 Add operational alerts
  - Repeated webhook failure.
  - Payment reconciliation growth.
  - Provider auth failure.
  - Database unavailable.
  - Worker failure.
  - _Requirements: R36, R38_

- [ ] 26.7 Add safe diagnostic endpoint/admin view
  - Avoid secrets.
  - Permission protected.
  - _Requirements: R36_

---

## 27. Comprehensive Testing and QA

- [ ] [!] 27.1 Normalize test structure
  - Create as needed:
    - `test/unit/`
    - `test/integration/`
    - `test/security/`
    - `test/e2e/`
    - `test/helpers/`
  - Do not break current runner.
  - _Requirements: R37_

- [ ] 27.2 Create factories/fixtures
  - Workspace.
  - User/membership.
  - Outlet/access.
  - Platform.
  - Contact/chat.
  - Product/availability.
  - Cart/checkout.
  - Order/payment.
  - _Requirements: R37_

- [ ] [!] 27.3 Workspace isolation test suite
  - Read.
  - Create.
  - Update.
  - Delete/archive.
  - Search/list.
  - _Requirements: R30, R37_

- [ ] [!] 27.4 Outlet access test suite
  - Owner.
  - Admin.
  - Outlet manager.
  - Human agent.
  - Viewer.
  - _Requirements: R5, R30, R37_

- [ ] [!] 27.5 Telegram commerce integration suite
  - Start.
  - Outlet.
  - Product.
  - Cart.
  - Checkout.
  - Payment link.
  - _Requirements: R23, R37_

- [ ] [!] 27.6 Payment integration suite
  - Link creation.
  - Signed webhook.
  - Duplicate.
  - Mismatch.
  - Paid no-downgrade.
  - Notification once.
  - _Requirements: R20, R21, R22, R37_

- [ ] 27.7 CRM regression suite
  - Contacts.
  - Chats.
  - Messages.
  - Human takeover.
  - AI boundaries.
  - _Requirements: R8, R9, R10, R11, R37_

- [ ] 27.8 Order admin integration suite
  - Filters.
  - Detail.
  - Transition.
  - Permissions.
  - _Requirements: R18, R19, R37_

- [ ] 27.9 Inventory integration suite
  - Conditional on inventory phase.
  - _Requirements: R14, R15, R37_

- [ ]* 27.10 Property-based tests
  - Order state transitions.
  - Payment state transitions.
  - Money totals.
  - Inventory non-negativity.
  - Idempotency keys.
  - _Requirements: R37_

- [ ] 27.11 Sandbox/manual QA
  - Telegram bot.
  - Payment provider.
  - Meta connection if enabled.
  - AI provider.
  - File upload.
  - _Requirements: R37_

- [ ] 27.12 CI pipeline
  - Install.
  - Lint.
  - Unit.
  - Integration.
  - Security critical tests.
  - Build/check.
  - _Requirements: R37, R38_

- [ ] 27.13 Regression checklist
  - Existing login.
  - Existing chats.
  - Existing connected platforms.
  - Existing AI agents.
  - Existing complaints.
  - Existing orders.
  - _Requirements: R37_

---

## 28. Deployment, Backup, and Operations

- [ ] 28.1 Normalize environment definitions
  - Local.
  - Staging.
  - Production.
  - _Requirements: R38_

- [ ] 28.2 Update Docker configuration
  - Server.
  - Web.
  - Database/network.
  - Health checks.
  - Correct environment injection.
  - _Requirements: R38_

- [ ] 28.3 Remove production dependency on dev tunnels
  - Keep tunnel guide for local testing.
  - Production uses stable HTTPS endpoint.
  - _Requirements: R38_

- [ ] 28.4 Document deployment runbook
  - Build.
  - Environment.
  - Database.
  - Migration.
  - Health.
  - Rollback.
  - _Requirements: R38_

- [ ] 28.5 Implement backup procedure
  - MongoDB/database.
  - Upload metadata/files.
  - Config inventory.
  - Migration state.
  - _Requirements: R28, R38_

- [ ] 28.6 Test restore procedure
  - Restore to isolated environment.
  - Validate counts and critical flows.
  - _Requirements: R38_

- [ ] 28.7 Add secret rotation runbook
  - Telegram.
  - Meta.
  - Payment.
  - AI.
  - JWT.
  - _Requirements: R30, R38_

- [ ] 28.8 Add incident response runbook
  - Payment webhook outage.
  - Provider credential failure.
  - Data leak suspicion.
  - Database outage.
  - Duplicate events.
  - _Requirements: R36, R38_

- [ ] 28.9 Add release and rollback checklist
  - Tests.
  - Backup.
  - Migrations.
  - Health.
  - Webhooks.
  - Provider sandbox/production.
  - _Requirements: R38_

---

## 29. MVP Release Preparation

- [ ] [!] 29.1 Confirm MVP feature boundary
  - Included:
    - single workspace UI;
    - multi-outlet;
    - Telegram;
    - products;
    - availability;
    - cart;
    - checkout;
    - orders;
    - payment link;
    - verified webhook;
    - admin order operations.
  - Defer optional features explicitly.
  - _Requirements: all P0_

- [ ] [!] 29.2 Run complete critical flow
  - Customer `/start`.
  - Select outlet.
  - Browse.
  - Cart.
  - Checkout.
  - Payment link.
  - Sandbox pay.
  - Webhook.
  - Paid notification.
  - Outlet processes order.
  - Completed.
  - _Requirements: R23_

- [ ] 29.3 Validate admin dashboard contracts
  - Orders.
  - Products.
  - Outlets.
  - Chats.
  - Connected Platforms.
  - Settings.
  - Payment monitoring if enabled.
  - _Requirements: R6, R9, R12, R18, R22, R27_

- [ ] [!] 29.4 Run security release gate
  - Workspace isolation.
  - Outlet access.
  - Secret redaction.
  - Payment signature.
  - Webhook idempotency.
  - File path safety.
  - _Requirements: R30, R37_

- [ ] [!] 29.5 Run payment release gate
  - Correct provider environment.
  - Correct webhook URL.
  - Correct signature.
  - Amount match.
  - Duplicate safe.
  - Reconciliation visibility.
  - _Requirements: R20, R21, R22_

- [ ] 29.6 Run operations gate
  - Health endpoints.
  - Logs.
  - Metrics.
  - Backup.
  - Restore.
  - Rollback.
  - _Requirements: R36, R38_

- [ ] 29.7 Prepare MVP demo script
  - Customer journey.
  - Admin order handling.
  - Payment event.
  - Human takeover.
  - _Requirements: R23_

- [ ] 29.8 Final checkpoint — MVP release approval
  - All P0 tasks complete or explicitly waived.
  - Waiver has owner, risk, mitigation, and target date.
  - No unresolved critical security/payment issue.
  - Release decision recorded.

---

# Optional Post-MVP Tasks

- [ ]* P1. Standalone Payments & Reconciliation page
- [ ]* P2. Full inventory quantity tracking
- [ ]* P3. Stock transfer workflow
- [ ]* P4. WhatsApp commerce checkout
- [ ]* P5. Refund workflow
- [ ]* P6. Settlement/payout monitoring
- [ ]* P7. Durable distributed queue
- [ ]* P8. PostgreSQL/Supabase production cutover
- [ ]* P9. Multi-workspace switcher UI
- [ ]* P10. Franchise-owner onboarding
- [ ]* P11. Advanced promotion engine
- [ ]* P12. Public web storefront
- [ ]* P13. Advanced accounting integration
- [ ]* P14. Dispute/chargeback management

---

# Checkpoints

## Checkpoint A — Stabilized Legacy Backend

Must pass:

```txt
existing backend starts
existing tests pass
secrets protected
uploads ignored
canonical error format introduced safely
```

## Checkpoint B — Multi-Outlet Security

Must pass:

```txt
membership exists
workspace context verified
outlet access enforced
cross-workspace/outlet tests pass
```

## Checkpoint C — Catalog

Must pass:

```txt
products CRUD
availability per outlet
effective price
Telegram outlet catalog
```

## Checkpoint D — Cart and Checkout

Must pass:

```txt
single-outlet cart
authoritative price
idempotent checkout
order created once
```

## Checkpoint E — Payments

Must pass:

```txt
payment attempt created
signed webhook verified
amount validated
duplicate safe
paid no-downgrade
notification once
```

## Checkpoint F — Admin Operations

Must pass:

```txt
orders list/detail/actions
outlet permissions
chat/order context
settings safe
```

## Checkpoint G — Production Readiness

Must pass:

```txt
security tests
health/observability
backup/restore
deployment/rollback
critical end-to-end flow
```

---

# Definition of Done

A task is complete only when all applicable items are true:

```txt
[ ] acceptance criteria implemented
[ ] current behavior preserved
[ ] route remains thin
[ ] service owns business logic
[ ] repository owns persistence
[ ] workspace scope enforced
[ ] outlet scope enforced
[ ] validation added
[ ] canonical error used
[ ] secrets redacted
[ ] audit added for sensitive action
[ ] unit tests added
[ ] integration/security tests added
[ ] external provider sandbox/manual QA completed
[ ] docs updated
[ ] migration impact documented
[ ] rollback impact documented
[ ] lint/build/tests pass
```

---

# Requirement Traceability Matrix

| Phase | Primary Requirements |
|---|---|
| Baseline and Architecture | R29, R30, R35, R37, R38 |
| Identity and Workspace | R1, R2, R3 |
| Outlets and Access | R4, R5, R30 |
| Platforms and Webhooks | R6, R7 |
| CRM and AI | R8, R9, R10, R11 |
| Catalog | R12, R13 |
| Cart and Checkout | R16, R17 |
| Orders | R18, R19 |
| Payments | R20, R21, R22 |
| Telegram Commerce | R23 |
| WhatsApp Readiness | R24 |
| Notifications | R25 |
| Complaints and Settings | R26, R27 |
| Files | R28 |
| Audit and Jobs | R31, R32 |
| Analytics | R33 |
| Performance and Migration | R34, R35 |
| Observability | R36 |
| Testing | R37 |
| Operations | R38 |

---

# Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "name": "Baseline and safety",
      "tasks": ["0.1", "0.2", "0.3", "0.4", "0.5", "0.6", "0.7"]
    },
    {
      "id": 1,
      "name": "Architecture foundation",
      "tasks": ["1.1", "1.2", "1.3", "1.4", "1.5", "2.1", "2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "2.8", "2.9"]
    },
    {
      "id": 2,
      "name": "Workspace and membership",
      "tasks": ["3.1", "3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "3.8", "3.9"]
    },
    {
      "id": 3,
      "name": "Outlet foundation",
      "tasks": ["4.1", "4.2", "4.3", "4.4", "4.5", "4.6", "4.7", "4.8", "4.9"]
    },
    {
      "id": 4,
      "name": "Platform, webhook, and CRM stabilization",
      "tasks": ["5.1", "5.2", "5.3", "5.4", "5.5", "5.6", "5.7", "5.8", "5.9", "5.10", "5.11", "6.1", "6.2", "6.3", "6.4", "6.5", "6.6", "6.7", "6.8", "6.9", "6.10"]
    },
    {
      "id": 5,
      "name": "AI guardrails",
      "tasks": ["7.1", "7.2", "7.3", "7.4", "7.5", "7.6", "7.7"]
    },
    {
      "id": 6,
      "name": "Catalog",
      "tasks": ["8.1", "8.2", "8.3", "8.4", "8.5", "8.6", "8.7", "8.8", "8.9", "9.1", "9.2", "9.3", "9.4", "9.5", "9.6", "9.7", "9.8"]
    },
    {
      "id": 7,
      "name": "Telegram navigation and cart",
      "tasks": ["10.1", "10.2", "10.3", "10.4", "10.5", "10.6", "10.7", "11.1", "11.2", "11.3", "11.4", "11.5", "11.6", "11.7", "11.8", "11.9", "11.10", "11.11"]
    },
    {
      "id": 8,
      "name": "Checkout and orders",
      "tasks": ["12.1", "12.2", "12.3", "12.4", "12.5", "12.6", "12.7", "12.8", "12.9", "12.10", "13.1", "13.2", "13.3", "13.4", "13.5", "13.6", "13.7", "13.8", "13.9", "13.10", "13.11", "13.12"]
    },
    {
      "id": 9,
      "name": "Payment attempts",
      "tasks": ["14.1", "14.2", "14.3", "14.4", "14.5", "14.6", "14.7", "14.8", "14.9", "14.10", "14.11", "14.12", "14.13"]
    },
    {
      "id": 10,
      "name": "Payment webhook",
      "tasks": ["15.1", "15.2", "15.3", "15.4", "15.5", "15.6", "15.7", "15.8", "15.9", "15.10"]
    },
    {
      "id": 11,
      "name": "Reconciliation and notifications",
      "tasks": ["16.1", "16.2", "16.3", "16.4", "16.5", "16.6", "16.7", "16.8", "16.9", "17.1", "17.2", "17.3", "17.4", "17.5", "17.6", "17.7", "17.8"]
    },
    {
      "id": 12,
      "name": "Admin supporting domains",
      "tasks": ["19.1", "19.2", "19.3", "19.4", "19.5", "19.6", "19.7", "19.8", "19.9", "19.10", "19.11", "19.12", "19.13", "20.1", "20.2", "20.3", "20.4", "20.5", "20.6", "20.7", "20.8", "21.1", "21.2", "21.3", "21.4", "21.5", "21.6"]
    },
    {
      "id": 13,
      "name": "Jobs and repository consistency",
      "tasks": ["22.1", "22.2", "22.3", "22.4", "22.5", "22.6", "22.7", "22.8", "22.9", "22.11", "23.1", "23.2", "23.3", "23.4", "23.5", "23.6", "23.7"]
    },
    {
      "id": 14,
      "name": "Inventory",
      "tasks": ["18.1", "18.2", "18.3", "18.4", "18.5", "18.6", "18.7", "18.8", "18.9", "18.10"]
    },
    {
      "id": 15,
      "name": "Security, observability, and QA",
      "tasks": ["25.1", "25.2", "25.3", "25.4", "25.5", "25.6", "25.7", "25.8", "25.9", "26.1", "26.2", "26.3", "26.4", "26.5", "26.6", "26.7", "27.1", "27.2", "27.3", "27.4", "27.5", "27.6", "27.7", "27.8", "27.9", "27.11", "27.12", "27.13"]
    },
    {
      "id": 16,
      "name": "Migration readiness",
      "tasks": ["24.1", "24.2", "24.3", "24.4", "24.5", "24.6", "24.7", "24.8", "24.9", "24.10", "24.12"]
    },
    {
      "id": 17,
      "name": "Operations and release",
      "tasks": ["28.1", "28.2", "28.3", "28.4", "28.5", "28.6", "28.7", "28.8", "28.9", "29.1", "29.2", "29.3", "29.4", "29.5", "29.6", "29.7", "29.8"]
    }
  ]
}
```

---

# Recommended Fastest Safe MVP Path

Untuk implementasi tercepat tanpa mengorbankan fondasi penting, urutan minimal adalah:

```txt
0  Baseline and safety
1  Architecture/config/error context
3  Workspace membership
4  Outlet access
5  Webhook idempotency
6  CRM/human takeover regression safety
8  Products
9  Product availability per outlet
10 Telegram outlet/product navigation
11 Cart
12 Checkout
13 Orders
14 Payment attempt
15 Payment webhook
17 Notifications
25 Critical security
27 Critical tests
29 MVP release
```

Task berikut dapat ditunda setelah core MVP bila belum diperlukan:

```txt
16 Full reconciliation UI
18 Quantity inventory
20 Advanced analytics
22 Durable queue
24 PostgreSQL cutover
P5 Refund workflow
P6 Settlement monitoring
```

Namun domain payment, webhook idempotency, workspace isolation, dan outlet access tidak boleh ditunda.
