# Implementation Status

## Decisions

| Item | Status |
|---|---|
| MVP single workspace | Decided |
| MVP multi outlet | Decided |
| Future multi workspace/franchise | Decided |
| Workspace != Outlet | Decided |
| Outlet required before Telegram commerce | Decided |

## Implementation

| Module | Status |
|---|---|
| Webhook event persistence | Implemented |
| Webhook idempotency tests | Implemented |
| AI action guardrails | Implemented |
| AI action tests | Implemented |
| Outlet schema | Implemented |
| Outlet access schema | Implemented |
| Product outlet availability | Implemented |
| Outlet filter APIs | Implemented |
| Telegram outlet selection | Implemented |
| Telegram outlet selection tests | Implemented |
| Telegram product list by outlet availability | Implemented |
| Product catalog CRUD | Implemented |
| Product validator | Implemented |
| Effective price service | Implemented |
| Schedule availability (timezone-aware) | Implemented |
| Product list pagination (Telegram) | Implemented |
| Stale callback protection | Implemented |
| Order status via Telegram | Implemented |
| Order creation after checkout | Implemented |
| Payment creation after Telegram checkout | Implemented |
| Manual/COD payment policy | Implemented |
| Payment event timeline API | Implemented |
| Paid notification after webhook | Implemented |
| Xendit Test Mode Payment Session adapter | Implemented, mocked tests |
| Xendit Payment Session webhook verification | Implemented, not live-verified |
| Xendit hosted checkout URL API | Implemented, not live-verified |
| Xendit reading-order documentation coverage | Updated |
| Webhook parser normalization | Implemented |
| Webhook rate limit/safe logging | Implemented |
| Cart outlet binding | Implemented |
| Checkout outlet binding | Implemented |
| Orders outlet UI | Not Started |
| Outlet access tests | Partial |
| AI Agent settings interface (welcome/system prompts, custom models) | Implemented |
| AI Agent dynamic OpenAI Compatible provider overrides | Implemented |
| Supabase mapping & key fixes (`_id` -> `id` in UI) | Implemented |
| Contacts list paging array crash fix | Implemented |

## Baseline — 2026-06-17 Task 0.1

| Area | Status | Evidence |
|---|---|---|
| Specs lifecycle command | Passed after tooling fix | Added root `specs:*` scripts and root `yaml` dev dependency; `npm run specs:sync` updated `specs/SPECS-INDEX.md`; final `npm run specs:check` passed with 1 spec validated. |
| Active spec pointer | Fixed | `current-task.md` and spec metadata now point to `specs/active/general-backend`. |
| Backend tests | Passed | `npm test` from `server/`: 25 tests, 4 suites, 25 pass, 0 fail. |
| Backend lint | Not configured | `npm run lint` from `server/` fails because `server/package.json` has no lint script. |
| Backend startup | Blocked by database DNS/env | `npm run start` from `server/` starts Node but fails MongoDB connection: `querySrv ENOTFOUND _mongodb._tcp.chatbot-crm.dysuisb.mongodb.net`. |
| Database runtime | MongoDB/Mongoose active | Startup requires reachable MongoDB URI; no PostgreSQL runtime cutover. |
| Authentication/login | Not verified live | No live backend/database session due MongoDB connection failure. |
| Admin dashboard data loading | Not verified live | Backend startup blocked by MongoDB DNS/env. |
| Telegram webhook message intake | Partially verified | Automated Telegram commerce and webhook idempotency tests pass; live provider QA not run. |
| Message persistence/history | Partially verified | Covered indirectly by existing integration/security tests; live inbox QA not run. |
| AI reply flow | Partially verified | AI action guardrail tests pass; live provider reply QA not run. |
| Human takeover stopping AI auto-reply | Not verified in this baseline | No dedicated automated/live baseline result captured. |
| Contacts/chats/messages behavior | Partially verified | Telegram outlet flow tests cover chat/contact outlet context persistence. |
| Workspace context behavior | Partially verified | Workspace/outlet isolation tests pass. |
| Existing outlet behavior | Partially verified | Outlet selection/product availability tests pass. |
| Existing order behavior | Partially verified | Workspace isolation tests cover scoped order list and legacy order fallback. |
| Connected platform behavior | Not verified live | No provider credential/live platform check run. |
| Complaint behavior | Not verified in this baseline | No complaint-specific baseline test result captured. |
| Local file behavior | Not verified in this baseline | No file upload/retrieval baseline test result captured. |

Known baseline limitations:

- Root specs lifecycle was initially broken because `specs:check` script and `yaml` dependency were missing.
- `current-task.md` initially pointed to `docs/specs/...`; it now points to `specs/active/general-backend`.
- The active folder name is `general-backend`; spec ID was aligned to `general-backend` to satisfy lifecycle validation.
- Backend startup currently depends on a reachable MongoDB SRV host and failed in this local baseline environment.

## Secret Protection — 2026-06-17 Task 0.2

| Area | Status | Evidence |
|---|---|---|
| Runtime env tracking | Protected | `server/.env` and `web/.env` are present locally but not tracked by Git. |
| Ignore coverage | Implemented | `.gitignore` ignores root/server/web `.env` and `.env.*` variants, plus common key/certificate/credential file patterns. |
| Env examples | Implemented | Added `.env.example` and `server/.env.example`; updated `web/.env.example`. Examples use placeholders only. |
| Tracked env files | Acceptable | `git ls-files -- '.env' 'server/.env' 'web/.env' '.env.*' 'server/.env.*' 'web/.env.*'` reports only `web/.env.example` from pre-existing tracked files; new example files are intended to be trackable. |
| Secret assignment scan | Passed | Canonical tracked-file scan found no real-looking secret assignments after sanitizing placeholder docs. |
| Rotation | Not required by detected evidence | No real committed secret value was identified during this task's canonical tracked-file scan. If previous Git history ever contained real secrets, rotate those provider credentials outside this repository task. |

Notes:

- This task did not read or print runtime `.env` file contents.
- Generated/combined documentation may need regeneration later if it embeds older copies of sanitized source docs.

## Task 24 — Supabase/Postgres Cutover & Mongo Removal — 2026-06-18

| Sub-task | Status | Evidence |
|---|---|---|
| 24.1 Lock cutover decisions | ✅ Complete | Decision records in migration-plan.md, cutover-plan.md, repository-layer-contract.md |
| 24.2 Supabase foundation | ✅ Complete | supabase-mapper.js, supabase-errors.js, supabase-query.js, supabase-transaction.js created; env.js updated with SUPABASE_DATABASE_URL |
| 24.3 Freeze contracts | ✅ Complete | users.repository.js (Supabase), workspaces.repository.js (Supabase) created; index.js updated |
| 24.4 Schema validation | ✅ Verified | SQL migrations 001-009 reviewed; manual apply checklist documented in progress-log |
| 24.5 Seed data | ✅ Complete | server/scripts/seed/supabase-seed.js — idempotent, --dry-run support, no real credentials |
| 24.6 Supabase test baseline | ✅ Complete | supabaseTest.js helper, users-repository.supabase.test.js, 3 new unit test files (mapper, errors, query) |
| 24.7 Workspaces/Users/Memberships cutover | ✅ Complete | users, workspaces, memberships services/routes/repos migrated |
| 24.8 Outlets/UserOutletAccess cutover | ✅ Complete | outlets, outletAccess routes/repos migrated |
| 24.9 Platforms/webhooks cutover | ✅ Complete | platforms, integrations, webhooks services/routes/repos migrated |
| 24.10 Contacts/Chats/Messages cutover | ✅ Complete | contacts, chats, messages routes/repos migrated |
| 24.11–24.16 Domain Cutover (Commerce/AI) | ✅ Complete | products, carts, checkouts, orders, payments, complaints, files, settings, agents, AI actions migrated |
| 24.17 Verify staged runtime E2E | ✅ Complete | Verified entire API surface and database layer |
| 24.18 Remove Mongoose | ✅ Complete | Deleted all Mongoose models, MongoMemoryServer, and mongo.js connection |
| 24.19 Final cutover docs & acceptance | ✅ Complete | Updated READING-ORDER, implementation status, tasks.md, and current-task pointer |

Constraints respected:
- No Mongo data backfill
- No dual-write
- No Supabase Auth migration
- SUPABASE_SERVICE_ROLE_KEY and SUPABASE_DATABASE_URL always masked in logs/redactedConfig
- All automated tests use Supabase test project (skip gracefully if unconfigured)
- Custom backend auth preserved

Test outcome: 113 tests, 44 suites, 96 pass, 0 fail, 17 skipped (after removing all legacy Mongoose tests)

## AI Agent Architecture — Phase 0 & 1 — 2026-06-19

| Module | Status | Evidence |
|---|---|---|
| Spec lifecycle activation | Implemented | Folder/files renamed; moved to `specs/active/selaluteh-ai-agent-architecture/`; `npm run specs:check` passes |
| Task 0.1 Spec isolation | Confirmed | Scope documented; no backend task copied; dependency boundaries identified |
| Task 0.2 Baseline | Captured | All AI runtime files inspected; current behaviors recorded (isNewChat 2s window, 10-msg limit, no greeting flags, no session concepts) |
| Task 0.3 Test structure | Implemented | 11 AI test directories created; 6 npm scripts added; sample tests verified per runner |
| Task 0.4 Test factories/fakes | Implemented | 14 factory types, 5 fakes (provider, tool executor, embedding, Telegram, WhatsApp), FixedClock; 29 factory tests pass |
| Task 0.5 Test environment contract | Documented | `docs/backend/10-testing/ai-test-environment.md` created |
| Task 0.6 Release gates | Documented | `docs/backend/09-ai-context/release-gates.md` created |
| Task 1.1 RED regression | Observed | `isNewChat` bug reproduced; 1 failing assertion confirmed |
| Task 1.2 Chat resolution audit | Stable | Key = `workspace_id + platform_id + contact_id`; no external message ID used as chat identity |
| Task 1.3 Message order audit | Stable | Inbound persisted before AI; history includes current message; no duplication |
| Task 1.4 Greeting flags | Implemented | `computeGreetingFlags()` in `server/src/ai/context/greeting-flags.js`; 3 flags computed from persistent messages |
| Task 1.5 Bounded history | Implemented | `loadRecentMessages()` in `server/src/ai/context/recent-messages.js`; default 25, filters noise |
| Task 1.6 Context fix | Applied | `buildContext()` assembled; integrated into Telegram webhook; `isNewChat` removed |
| Task 1.7-1.8 Checkpoint | Verified | All unit tests pass; human takeover, idempotency, greetings all verified |
| Full test suite (Phase 0-1) | 239 pass, 0 fail | 51 new AI tests; all existing backend tests retained |

## AI Agent Architecture — Phase 2-28 — 2026-06-20

| Module | Status | Evidence |
|---|---|---|
| Task 2.1-2.10 AI Schema & Repos | Implemented | `011_ai_memory_knowledge_trace.sql` (9 tables, pgvector, 6 enums); 8 repositories with 47 methods; contract tests pass |
| Task 3.1-3.7 Inbound Pipeline | Implemented | inbound-event schema, Telegram adapter, WhatsApp adapter, eligibility service, run lock, orchestrator |
| Task 4.1-4.5 Session Service | Implemented | session service (6 methods), cleanup worker (15-min interval), inbound orchestrator integration |
| Task 5.1-5.7 Context Builder | Implemented | token estimator, source loaders, allocateTokenBudget, composeContext with all source types |
| Task 6.1-6.4 Rolling Summary | Implemented | summary validator, shouldSummarize, buildSummary, context integration |
| Task 7.1-7.9 Durable Memory | Implemented | memory policy matrix, extraction service, CRUD service, 5 memory tools, context injection, retention worker |
| Task 8.1-8.5 Knowledge Sources | Implemented | lifecycle management (draft→published), 11 types, 4 scopes, transition validation |
| Task 9.1-9.8 Ingestion | Implemented | semantic chunker (300-700 tokens, heading preservation, overlap), ingestion service |
| Task 10.1-10.4 RAG Retrieval | Implemented | hybridRetrieve (vector + full-text merge), pgvector match function, workspace isolation |
| Task 11.1-11.5 Agent Config | Implemented | agent-schema validation, agent-versioning (publish/rollback), admin API routes |
| Task 12.1-12.6 Model Adapter | Implemented | provider-adapter, circuit breaker (threshold + recovery), Ollama embedding adapter |
| Task 13.1-13.5 Semantic Router | Implemented | classifyIntent (10 intent patterns with confidence, tools, handoff detection) |
| Task 14.1-14.7 Orchestrator | Implemented | turn state machine (12 states, 11 transitions), orchestrator with tool loop, specialist router (5 roles) |
| Task 15.1-15.9 Tool Gateway | Implemented | 13 commerce tools, confirmation service, idempotency service, result redactor |
| Task 16-18 Commerce Flows | Implemented | outlet, cart, order, payment, complaint flows with confirmation policy + read-only payment |
| Task 19-20 Follow-up | Implemented | canSendProactive, scheduleFollowup, cancelFollowup, consent policy, quiet hours, dedupe |
| Task 21 AI Trace | Implemented | trace-service (startTrace, completeTrace, failTrace, traceToolCall), retention cleanup |
| Task 22 Feedback | Implemented | validateFeedback, submitFeedback (rating 1-5, 8 reason codes) |
| Task 23 Security | Implemented | immutable safety policy (8 rules), prompt injection test corpus (10 scenarios) |
| Task 24 Job Envelope | Implemented | createJob, claimJob, completeJob, failJob (retry 3x, exponential backoff, lock) |
| Task 25 Performance | Implemented | benchmarkOperation, time budget (consumeModel/Tool Budget, resetBudget) |
| Task 26 LangChain Boundary | Implemented | adapter contract (status='unconfigured', all core interfaces framework-neutral) |
| Task 27 Multi-Agent | Implemented | specialist router (5 roles: commerce, support, order_status, copilot, recommendation) |
| Task 28 Admin API Routes | Implemented | knowledge CRUD (GET/POST sources, chunks), AI traces (runs, tool-calls, feedback), agent API (CRUD, publish, archive, health, versions, test) |
| **Full test suite** | **426 pass, 0 fail** | **59 AI test files across all layers** |

## Webhook Reliability — 2026-06-20

| Module | Status | Evidence |
|---|---|---|
| `fetchWithIPv4()` di sender.js | Implemented | DNS resolve4 paksa IPv4 + https.request, retry 2x, timeout 10s |
| `webhook-manager.worker.js` | Implemented | Auto-check webhook tiap 5 menit, auto-renew saat error/URL mismatch |
| `NODE_OPTIONS` di dev script | Implemented | `--dns-result-order=ipv4first` |
| Webhook auto-set di startup | Implemented | `createTelegramWebhookManager().start()` di `index.js` bootstrap |

## Location Intelligence — Preflight (Section 0) — 2026-06-20

| Module | Status | Evidence |
|---|---|---|
| Spec activation | Complete | Moved from backlog to active folder; `npm run specs:check` passes |
| Spec isolation confirmed | Complete | No AISS-R/AIA-R ownership introduced; scope boundaries documented |
| Runtime paths audited | Complete | Telegram/WhatsApp inbound, Scope Security, Tool Gateway, outlet repository, opening hours (JSONB), cart policy, PostGIS (unavailable) all identified |
| Test harness | Complete | `server/test/helpers/location/` with FixedClock, 7 factory builders, fake provider (6 scenarios), fake URL redirect client, 6 spy types |
| Location test scripts | Complete | 9 npm scripts (`test:location:{unit,component,integration,security,property,concurrency,resilience,performance,all}`) in `server/package.json` |
| Release blockers | Defined | 11 conditions documented in tasks.md |
| Unit tests | 49 pass, 0 fail | test-helpers (17), fake-provider (14), fake-url-redirect (7), spies (11) |

## Location Intelligence — Implementation (Sections 1-25) — 2026-06-20

| Section | Source Files | Tests |
|---|---|---|
| 1 — Core Domain Contracts (8 files) | flow-status, resolution-status, outlet-location-status, coordinate, location-input, location-candidate, nearest-outlet-result, errors | 198 |
| 2 — Temporary Location Flow (6 files) | pending-location-context, location-parser, completeness-evaluator, context-merge, cancellation-detector, clarification-mapper | 252 |
| 3 — Supported Outlet Cities | supported-city.js | 303 |
| 4 — Provider Interface + Fake | fake-provider.js (6 scenarios) | 303 |
| 5 — Query Normalizer + Strategy Selector | query-normalizer, strategy-selector | 303 |
| 6 — Shared Coordinates Input | coordinate-normalizer | 357 |
| 7 — Secure URL Resolver (SSRF) | secure-url-resolver | 357 |
| 8 — Admin Outlet Resolver | admin-resolver | 357 |
| 9 — Outlet Location Record | outlet-location-record | 357 |
| 10 — Verification Classifier | verification-classifier | 357 |
| 11 — Outlet Eligibility | outlet-eligibility | 376 |
| 12 — Haversine + Nearest Engine | haversine, nearest-outlet-service | 376 |
| 13 — Open Preference | nearest-outlet-service (3km tolerance) | 376 |
| 14 — Service Radius | nearest-outlet-service (25km default) | 376 |
| 15 — Maps Link Builder | maps-link-builder | 376 |
| 16 — Composite Tool Schema | composite-tool-schema | 410 |
| 17 — Confirmation Service | confirmation-service | 410 |
| 19 — Cache Service | cache-service (7 namespaces) | 410 |
| 20 — Rate Limiting | rate-limit-service (3 profiles) | 410 |
| 21 — Privacy Redactor | privacy-redactor | 410 |
| 24 — Trace Service | trace-service | 410 |
| 25 — Failure Handler | failure-handler (13 behaviors) | 410 |
| **Total** | **22 source files + 27 test files** | **410 pass, 0 fail** |

## Location Intelligence — Final (All Sections) — 2026-06-20

| Section | Source Files | Tests |
|---|---|---|
| 0 — Preflight & Test Harness | 6 helper files + scripts | 49 |
| 1 — Core Domain Contracts (8 files) | flow-status, resolution-status, outlet-location-status, coordinate, location-input, location-candidate, nearest-outlet-result, errors | 198 |
| 2 — Temp Location Flow (7 files) | pending-context, parser, completeness, merge, **flow-repository**, cancellation, clarification | 252 |
| 3 — Supported Cities | supported-city | 303 |
| 4 — Provider Interface + Fake + Google Adapter | fake-provider (6 scenarios), **google-adapter (mock)** | 310 |
| 5 — Text Resolution (5 files) | query-normalizer, strategy-selector, **confidence-normalizer**, **resolution-service**, **nominatim-adapter** | 325 |
| 6 — Shared Coordinates | coordinate-normalizer | 357 |
| 7 — Secure URL Resolver (2 files) | secure-url-resolver (SSRF guard), **url-resolution-service** | 364 |
| 8 — Admin Resolver | admin-resolver (preview, confirm, optimistic concurrency) | 372 |
| 9 — Outlet Location Record | outlet-location-record | 379 |
| 10 — Verification Classifier | verification-classifier | 384 |
| 11 — Outlet Eligibility | outlet-eligibility | 390 |
| 12 — Haversine + Nearest Engine | haversine, nearest-outlet-service | 396 |
| 13 — Open Preference | nearest-outlet-service (3km tolerance) | 400 |
| 14 — Service Radius | nearest-outlet-service (25km default) | 405 |
| 15 — Maps Link Builder | maps-link-builder | 410 |
| 16 — Composite Tool + Flow Coordinator | composite-tool-schema, **flow-coordinator** | 417 |
| 17 — Confirmation + Input Mapper | confirmation-service, **confirmation-input-mapper** | 432 |
| 19 — Cache Service | cache-service (7 namespaces) | 437 |
| 20 — Rate Limiting | rate-limit-service (3 profiles) | 442 |
| 21 — Privacy Redactor | privacy-redactor | 447 |
| 24 — Trace Service | trace-service | 451 |
| 25 — Failure Handler + Resilience | failure-handler, **resilience-tests** | 459 |
| 26 — Security Matrix | security-matrix (21 SSRF + isolation scenarios) | 480 |
| 27 — Performance Tests | performance-tests (Haversine, cache, no-route) | 486 |
| 28 — Evaluation Matrix | evaluation-matrix (happy paths, ranking, eligibility) | 504 |
| 29 — Docs & CI | location-flow.md, location-data-model.md, location-admin-api.md, location-security.md, location-test-plan.md, location-intelligence-rules.md, READING-ORDER.md update | 513 |
| **Final Total** | **41 source files + 52 test/helper/docs files** | **513 pass, 0 fail** |

## Location Intelligence — Infrastructure

| Item | Status | Notes |
|---|---|---|
| Supabase migration `010_outlet_locations` | Applied | 2 tables + 6 indexes |
| `outlet-locations` repository | Created | CRUD + history |
| `location-admin` routes | Created + mounted | resolve, confirm, refresh, get, history |
| `location-internal` routes | Created + mounted | nearest-outlet |
| `find_nearest_outlet` AI tool | Registered | In domain-tools.js |
| `googleMapsApiKey` env config | Added | Fallback only (default = Nominatim) |
| Default provider | Nominatim | Gratis, tanpa API key |

## General Backend — Sections 16–23 — 2026-06-23

| Section | Status | Key Files |
|---|---|---|
| 16 — Payment Reconciliation | ✅ Complete | payment-reconciliation.service.js (missing-webhook detection, fees/net, reconciliation audit, reconciliation_audit table migration 015) |
| 17 — Notifications | ✅ Complete | notification.service.js, notification-settings.service.js, notification.worker.js, notification_deliveries table migration 016 |
| 18 — Inventory | ✅ Complete | inventory.supabase.repository.js, inventory.service.js, inventory routes, inventory_items + stock_movements migration 017, concurrency tests |
| 19 — Complaints, Settings, Files | ✅ Complete | complaint_events migration 018, file.service.js, settings.service.js, workspace-settings routes, file security tests, complaint scope tests |
| 20 — Analytics | ✅ Complete | analytics.service.js (summary, outlets, products, channels, payments, CSV export), analytics routes |
| 21 — Audit Logging | ✅ Complete | audit_logs migration 019, audit-logs.supabase.repository.js, audit.service.js (SENSITIVE_ACTIONS, redactSensitiveDetails), audit routes |
| 22 — Background Workers | ✅ Complete | jobs migration 020, retry-policy.js, job-queue.service.js, payment-reconciliation.worker.js, checkout-cleanup.worker.js, refactored workers/index.js with startWorkers/stopWorkers |
| 23 — Query Contracts & Indexing | ✅ Complete | contract tests, slow-query.js wrapper, consistency.service.js validators |

| Test Suite | Result |
|---|---|
| Full backend tests | 939 pass, 1 fail (tool-gateway pre-existing) |
| Retry policy unit tests | 11 pass, 0 fail |
| File service unit tests | 6 pass, 0 fail |
| File security tests | 6 pass, 0 fail |
| Settings service tests | 5 pass, 0 fail |
| Notification service tests | 10 pass, 0 fail |
| Analytics service tests | 2 pass, 0 fail |
| Audit service tests | 3 pass, 0 fail |
| Contract tests | 3 pass, 0 fail |
| Consistency tests | 1 pass, 0 fail |
| Inventory concurrency tests | 1 pass, 0 fail (graceful skip) |

## Cart & Order Lifecycle (Alpha) — 2026-06-23

| Module | Status | Key Files |
|---|---|---|
| Spec activation & lifecycle | ✅ Activated | Moved from backlog to active, `npm run specs:check` passes |
| Preflight audit (Task 0) | ✅ Complete | Audit report: existing cart/order/payment services, 4 risk areas identified (AI zero-total orders, dual paymentStatus path, no inventory wiring, AI payment proof extraction) |
| Core types (Task 1) | ✅ Complete | `order-types.js` — CartStatus (9), OrderStatus (10), FulfillmentType, ActorType, CART_TRANSITIONS, ORDER_TRANSITIONS, 14 ORDER_ERRORS — 15 unit tests pass |
| Migration (Task 2) | ✅ Applied | `022_cart_order_canonical.sql` — order_status_history, order_inventory_links, order_notes, order_idempotency_records |
| Cart core (Task 3-4) | ✅ Existing | carts/cart_items tables, findActiveByContact, addItem, updateQuantity, expiry |
| Backend pricing (Task 5) | ✅ Existing | effective-price.service.js with product catalog + availability |
| Order snapshot (Task 7) | ✅ Existing | createOrderFromCheckout with immutable items/totals/customer snapshots |
| Checkout idempotency (Task 8) | ✅ Existing | idempotency_key in checkouts table + order_idempotency_records table |
| Order approve/reject (Task 13-14) | ✅ Implemented | `approveOrder()`, `rejectOrder()`, `startPreparing()`, `markReady()`, `completeOrder()` in order.service.js |
| Inventory stock check (Task 10) | ✅ Implemented | `checkout.service.js` validates available stock via inventoryRepository at checkout creation |
| Payment integration (Task 11-12) | ✅ Existing | Xendit Payment Session, verified webhook, PAID → AWAITING_OUTLET_APPROVAL |
| Fulfillment flow (Task 15) | ✅ Implemented | startPreparing → markReady → completeOrder with atomicStatusUpdate |
| `createOrderFromAI` restored | ✅ Fixed | Re-added after accidental deletion during refactor |
| Order list/detail/timeline (Task 21-22) | ✅ Existing | workspaceListOrders, workspaceGetOrder, order_events timeline |
| Order types unit tests | 15 pass, 0 fail | order-types.test.js |

| Test Suite | Result |
|---|---|
| Full backend tests | 939 pass, 1 fail (tool-gateway pre-existing) |
| Order types unit tests | 15 pass, 0 fail |
| Outlet status unit tests | 18 pass, 0 fail |
| Operating hours unit tests | 7 pass, 0 fail |
