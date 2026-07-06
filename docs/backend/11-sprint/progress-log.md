# Progress Log

Use this file to record chronological progress.

## 2026-07-03 — AISG-T001 AI Security Guardrails Audit

### Completed
- Activated `selaluteh-ai-security-guardrails` through the specs lifecycle by adding `workflow_state: in_progress`, syncing it from `specs/backlog/` to `specs/active/`, and updating `current-task.md` to `AISG-T001`.
- Audited active AI runtime paths, including Telegram/Meta webhook entry points, `ai.service.js`, AI orchestrator/tool gateway files, domain tool schemas, legacy order handling, canonical cart/checkout/order services, payment webhook/reconciliation services, and button-based Telegram commerce flow.
- Documented audit evidence in `specs/active/selaluteh-ai-security-guardrails/audit-evidence.md`.
- Identified high-risk follow-ups without implementing them in this audit task: inline AI direct cart/chat mutations, legacy `FILE_ORDER_JSON/create_legacy_order`, orchestrator direct commerce mutations, missing strict schema rejection, missing persistent confirmation guard, and missing end-to-end restricted payment reachability proof.

### Changed Files
- `specs/active/selaluteh-ai-security-guardrails/spec.yaml`
- `specs/active/selaluteh-ai-security-guardrails/tasks.md`
- `specs/active/selaluteh-ai-security-guardrails/audit-evidence.md`
- `specs/SPECS-INDEX.md`
- `docs/backend/09-ai-context/current-task.md`
- `docs/backend/11-sprint/implementation-status.md`
- `docs/backend/11-sprint/progress-log.md`

### Notes
- AISG-T001 is audit-only; no runtime behavior was changed.
- Existing Telegram/WhatsApp button commerce behavior was preserved.
- Direct runtime fixes are deferred to the next explicit AISG tasks according to `.agents/agents.md`.

### Tests
- `npm run specs:check` initially failed due AISG lifecycle mismatch.
- `npm run specs:sync:dry` passed after pointer/task metadata correction.
- `npm run specs:sync` passed and moved AISG spec to active.
- `npm run specs:check` passed with 14 specs validated.
- Runtime tests were not run because no runtime code changed in AISG-T001.

### Blockers
- None for AISG-T001.

### Next
- Wait for an explicit next task pointer before continuing. Recommended next task is AISG-T002 or AISG-T003, but it must be selected explicitly before implementation.

## 2026-07-03 — AISG Phase 0 Audit and Baseline Completion

### Completed
- Completed all remaining Phase 0 tasks: `AISG-T002`, `AISG-T003`, `AISG-T004`, and `AISG-T005`.
- Added current AI tool matrix covering active inline OpenAI tools, domain tools, memory tools, prompt-marker actions, direct repository usage, canonical service status, and follow-up task mapping.
- Added AISG architecture import-boundary security test and applied Phase 0 mitigation so AI natural-language mutation tools fail closed instead of directly mutating cart/chat/checkout/order/payment repositories.
- Added Telegram and WhatsApp button-commerce regression tests to preserve the safer callback/button path while AI natural-language mutation paths are constrained.
- Inventoried payment provider docs/runtime differences and updated generic payment provider selection to use workspace runtime configuration.

### Changed Files
- `server/src/services/ai.service.js`
- `server/src/ai/orchestration/orchestrator.js`
- `server/src/services/payment.service.js`
- `server/src/routes/payments.js`
- `server/test/security/ai/ai-import-boundary.test.js`
- `server/test/security/ai/payment-provider-authority.test.js`
- `server/test/e2e/ai/button-commerce-regression.test.js`
- `specs/active/selaluteh-ai-security-guardrails/tool-matrix.md`
- `specs/active/selaluteh-ai-security-guardrails/payment-provider-inventory.md`
- `specs/active/selaluteh-ai-security-guardrails/tasks.md`
- `docs/backend/09-ai-context/current-task.md`
- `docs/backend/11-sprint/implementation-status.md`
- `docs/backend/11-sprint/progress-log.md`

### Notes
- Full AISG gateway, immutable context, persistent confirmation, and canonical proposal-confirm-execute are not implemented in Phase 0 and remain Phase 1-3 work.
- `FILE_ORDER_JSON/create_legacy_order` remains documented as a high-risk legacy path for AISG-T051/AISG-T082.
- Button-commerce flows remain available and covered by regression tests.

### Tests
- `node --test "test/security/ai/ai-import-boundary.test.js"`: 1 pass, 0 fail.
- `node --test "test/e2e/ai/button-commerce-regression.test.js"`: 3 pass, 0 fail.
- `node --test "test/security/ai/payment-provider-authority.test.js"`: 1 pass, 0 fail.
- `npm run test:ai:security`: 7 pass, 0 fail.
- `npm run test:ai:e2e`: 4 pass, 0 fail.
- `npm run test:ai:unit`: 234 pass, 0 fail.
- `node --test "test/integration/payments/*.test.js" "test/unit/integrations/xendit-client.unit.test.js"`: 9 pass, 0 fail.
- `node --test "test/e2e/telegram-marketplace.e2e.test.js"`: 2 pass, 0 fail.
- `npm run specs:check`: 14 specs validated.

### Blockers
- None for Phase 0.

### Next
- Phase 1 should begin with `AISG-T006` only after the next task pointer is explicitly selected.

## 2026-07-03 — AISG Phase 1 Scope and Trusted Context

### Completed
- Completed Phase 1 tasks `AISG-T006` through `AISG-T013`.
- Added deterministic input-safety and SelaluTeh domain-scope guard with a fixed `out_of_scope` reply.
- Integrated `generateAIReply()` short-circuit before outlet retrieval, Q&A lookup, provider/model calls, OpenAI tool loops, Gemini generation, and legacy FILE marker mutation handling.
- Enforced human takeover as an early AI no-reply path using `takenOverByUserId` and legacy `takeoverBy` fields.
- Added server-owned agent mode resolution so request/model payloads cannot switch agent mode.
- Added immutable `AIActionContext` builder derived from server state.
- Added tenant consistency guard for workspace, connection, conversation, contact, outlet, cart, and checkout context.
- Added recursive authority-field rejection for model/tool payloads and cross-tenant non-disclosure tests.

### Changed Files
- `server/src/ai/security/scope-guard.js`
- `server/src/ai/security/agent-mode.js`
- `server/src/ai/security/ai-action-context.js`
- `server/src/ai/security/tenant-guard.js`
- `server/src/services/ai.service.js`
- `server/test/unit/ai/security/phase1-security.test.js`
- `specs/active/selaluteh-ai-security-guardrails/tasks.md`
- `docs/backend/09-ai-context/current-task.md`
- `docs/backend/11-sprint/implementation-status.md`
- `docs/backend/11-sprint/progress-log.md`

### Notes
- No database migrations were added.
- No payment provider, pricing, stock, order, or checkout authority was moved to the model.
- Button-based Telegram/WhatsApp commerce remains unchanged.
- Legacy `FILE_ORDER_JSON/create_legacy_order` remains a later Phase 5/Alpha-exit risk, but Phase 1 now prevents out-of-scope and human-takeover turns from reaching that path.

### Tests
- `node --test "test/unit/ai/security/phase1-security.test.js"`: 12 pass, 0 fail.
- `node --test "test/unit/ai/security/phase1-security.test.js" "test/unit/services/ai-service-outlets.test.js" "test/integration/ai/chatbot-prompt-outlet.integration.test.js" "test/integration/chat/human-takeover.integration.test.js"`: 24 pass, 0 fail.
- `npm run test:ai:security`: 7 pass, 0 fail.
- `npm run test:ai:unit`: 246 pass, 0 fail.

### Blockers
- None for Phase 1.

### Next
- Stop at Phase 1. Phase 2 should begin with `AISG-T014` only after explicit task selection.

## 2026-07-03 — AISG Phase 2 Tool Gateway and Policy Engine

### Completed
- Completed Phase 2 tasks `AISG-T014` through `AISG-T021`.
- Added immutable versioned AI tool registry with `aisg-v1` definitions.
- Converted AI tool gateway to deny-by-default for execution validation; tools require explicit server allowlist.
- Added deterministic restricted-action policy registry for payment/admin/authority mutations.
- Added strict schema validation for required/type/enum/minimum checks, unknown-field rejection, and Phase 1 authority-field rejection.
- Added safe tool result normalizer with secret redaction and customer-safe errors.
- Added gateway call count, payload size, timeout, and dependency breaker failure handling.
- Hardened `ai.service` marker handling so legacy model action markers are stripped before customer-facing output and removed the AI-driven contact-name mutation path.

### Changed Files
- `server/src/ai/security/restricted-action-policy.js`
- `server/src/ai/tools/tool-registry.js`
- `server/src/ai/tools/tool-gateway.js`
- `server/src/ai/tools/result-redactor.js`
- `server/src/services/ai.service.js`
- `server/test/unit/ai/security/phase2-tool-gateway.test.js`
- `server/test/unit/ai/orchestrator-tools.test.js`
- `specs/active/selaluteh-ai-security-guardrails/tasks.md`
- `docs/backend/09-ai-context/current-task.md`
- `docs/backend/11-sprint/implementation-status.md`
- `docs/backend/11-sprint/progress-log.md`

### Notes
- No database migrations were added in Phase 2.
- Telegram/WhatsApp button-based commerce remains unchanged.
- Full persistent proposal-confirm-execute flow remains Phase 3.
- Legacy `FILE_ORDER_JSON/create_legacy_order` prompt text remains a Phase 5 task, but marker output is sanitized before customer-facing output in Phase 2.

### Tests
- `node --test "test/unit/ai/security/phase2-tool-gateway.test.js" "test/unit/ai/orchestrator-tools.test.js" "test/unit/ai/tool-gateway.test.js"`: 35 pass, 0 fail.
- `npm run test:ai:unit`: 254 pass, 0 fail.
- `npm run test:ai:security`: 7 pass, 0 fail.

### Blockers
- None for Phase 2.

### Next
- Stop at Phase 2. Phase 3 should begin with `AISG-T022` only after explicit task selection.

## 2026-07-03 — AISG Phases 3-5 Confirmation, Commerce, Checkout, and Payment Guards

### Completed
- Completed Phase 3 tasks `AISG-T022` through `AISG-T029`.
- Completed Phase 4 tasks `AISG-T030` through `AISG-T045`.
- Completed Phase 5 tasks `AISG-T046` through `AISG-T057`.
- Added additive `ai_action_confirmations` migration and confirmation guard helpers for payload hash, opaque token, single-use consume, context binding, and state-version binding.
- Added commerce confirmation helpers for hypothetical/menu mutation blocking, explicit customer choice, recommended-vs-selected outlet separation, and checkout summary confirmation.
- Added commerce guardrail helpers for active/customer-visible search, outlet-aware pricing, orderable outlet checks, outlet-required mutation, canonical cart quantity/merge/single-outlet/server-price behavior, cart-version idempotency, and pickup checkout rules.
- Hardened `cart.service.js`, `checkout.service.js`, and `payment.service.js` with quantity caps, cart-version checkout idempotency, pickup-only enforcement, workspace provider authority, and payment snapshot validation.
- Removed `FILE_ORDER_JSON` instruction from AI sales-form prompt and kept marker sanitization before customer-facing output.

### Changed Files
- `server/src/ai/security/confirmation-guard.js`
- `server/src/ai/security/commerce-confirmation.js`
- `server/src/ai/security/commerce-guardrails.js`
- `server/src/ai/security/payment-order-guardrails.js`
- `server/src/db/migrations/035_ai_action_confirmations.sql`
- `server/src/services/cart.service.js`
- `server/src/services/checkout.service.js`
- `server/src/services/payment.service.js`
- `server/src/services/ai.service.js`
- `server/test/unit/ai/security/phase3-5-guardrails.test.js`
- `specs/active/selaluteh-ai-security-guardrails/tasks.md`
- `docs/backend/09-ai-context/current-task.md`
- `docs/backend/11-sprint/implementation-status.md`
- `docs/backend/11-sprint/progress-log.md`

### Notes
- Database change is additive: `035_ai_action_confirmations.sql` creates a new confirmation table and indexes only.
- Telegram/WhatsApp button commerce regression remains unchanged and passing.
- Provider PAID mutation proof is implemented as guardrail tests and helper; live webhook/reconciliation behavior remains covered by existing payment services.
- Unique order-per-checkout invariant is guarded at the canonical flow/helper layer; if production DB lacks a unique index, add an explicit DB constraint in a later rollout migration.

### Tests
- `node --test "test/unit/ai/security/phase3-5-guardrails.test.js"`: 8 pass, 0 fail.
- `npm run test:ai:unit`: 262 pass, 0 fail.
- `npm run test:ai:security`: 7 pass, 0 fail.
- `npm run test:ai:e2e`: 4 pass, 0 fail.
- `node --test "test/integration/payments/*.test.js" "test/unit/integrations/xendit-client.unit.test.js"`: 9 pass, 0 fail.

### Blockers
- None for Phases 3-5 automated validation.

### Next
- Stop at Phase 5. Phase 6 should begin with `AISG-T058` only after explicit task selection.

## Format

```md
## YYYY-MM-DD — Sprint/Task Name

### Completed
- ...

### Changed Files
- ...

### Notes
- ...

### Tests
- ...

### Blockers
- ...

### Next
- ...
```

## 2026-06-18 — AI Agent Settings & Layout Integrations (Fixes)

### Completed
- Added custom settings interface in `AgentDetail.jsx` (welcome message, system prompt, temperature, provider, model, API key, base URL, HTTP-referer) for OpenAI Compatible settings.
- Added migration helper `add-ai-settings-column.mjs` to create `ai_settings` JSONB column in `agents` table.
- Updated `agents.supabase.repository.js` to read and write `aiSettings` JSONB configurations (stored in `metadata.aiSettings` fallback as staging, exposing at top level).
- Refactored `ai.service.js` to instantiate dynamic OpenAI client overrides based on active per-agent settings overrides, using local config fallbacks.
- Fixed key mapping bugs in frontend files, changing `_id` checks/parameters to `id` for Supabase UUID compatibility (`DashboardPage.jsx`, `AgentSales.jsx`, `ComplaintsPage.jsx`, `ContactPanel.jsx`).
- Fixed frontend crash when loading `contacts` tab by extracting raw array from the paginated object envelope `r.data.data` instead of mapping/filtering directly on `r.data` (`ContactsPage.jsx`, `DashboardPage.jsx`).
- Fixed human takeover route mismatch from `/undefined` to `/chats/:id/takeover` in chat and context panels.

### Changed Files
- `server/scripts/maintenance/add-ai-settings-column.mjs`
- `server/src/db/repositories/agents.supabase.repository.js`
- `server/src/services/ai.service.js`
- `web/src/modules/agents/components/AgentDetail.jsx`
- `web/src/modules/agents/components/AgentSales.jsx`
- `web/src/modules/complaints/pages/ComplaintsPage.jsx`
- `web/src/modules/contacts/components/ContactPanel.jsx`
- `web/src/modules/contacts/pages/ContactsPage.jsx`
- `web/src/modules/dashboard/pages/DashboardPage.jsx`

### Notes
- Standardized Supabase JSONB usage for flexible configuration properties.
- Mapped Supabase mapper objects so camelCase casing applies properly to DB integrations.

### Tests
- Checked component loading on Vite dev server and verified API requests.

### Next
- Proceed with Xendit Test Mode integration testing and checks.

## 2026-06-18 — Task 16A Xendit Test Mode Payment Session Integration

### Completed
- Added active spec task group `16A` and pointed `current-task.md` to Xendit preflight scope.
- Verified official Xendit documentation for Payment Session `POST /sessions`, `GET /sessions/{session_id}`, webhook events, Basic Auth, `payment_link_url`, `x-callback-token`, and retry behavior.
- Replaced simulated Xendit adapter with Test Mode Payment Session client and webhook parser/verification.
- Added authenticated create-session and refresh endpoints using backend-authoritative order totals.
- Added public Xendit Payment Session webhook endpoint at `/api/webhooks/xendit/payment-sessions`.
- Added safe gateway config endpoint for authenticated UI consumers.
- Updated chat Orders sidebar copy for Xendit Test Mode payment link and separate payment/order status language.

### Changed Files
- `server/src/config/env.js`
- `server/.env.example`
- `server/src/integrations/payments/xendit-client.js`
- `server/src/services/payment.service.js`
- `server/src/services/payment-webhook.service.js`
- `server/src/routes/payments.js`
- `server/src/routes/orders.js`
- `server/src/routes/webhooks/index.js`
- `server/src/routes/webhooks/payments.js`
- `server/src/db/repositories/payments.supabase.repository.js`
- `server/test/unit/integrations/xendit-client.unit.test.js`
- `web/src/modules/chats/components/ChatContextPanel.jsx`
- `docs/backend/02-flows/payment-flow.md`
- `docs/backend/05-api-spec/payments-api.md`
- `docs/backend/08-security/payment-security.md`
- `docs/backend/11-sprint/implementation-status.md`
- `specs/active/general-backend/tasks.md`
- `docs/backend/09-ai-context/current-task.md`

### Notes
- No real Xendit secret or webhook token was read, printed, logged, committed, or requested.
- Automated tests mock/pure-test provider behavior and do not call Xendit.
- Live Test Mode checkout/webhook is not claimed complete until dashboard setup and webhook delivery are manually verified.

### Tests
- `npm --prefix server test` passed: 176 pass, 0 fail, 1 skipped.

### Blockers
- Manual Xendit dashboard setup remains required for live Test Mode verification.
- Supabase live integration tests are skipped when `SUPABASE_TEST_URL` and `SUPABASE_TEST_SERVICE_ROLE_KEY` are absent.

### Next
- Configure Xendit Test Mode dashboard webhook and run manual end-to-end payment session test.

## 2026-06-19 — Xendit Payment Session Documentation Sync

### Completed
- Updated payment, webhook, data, UI, AI-context, testing, security, environment, decision, and operations docs according to `docs/backend/READING-ORDER.md` payment-related references.
- Added missing canonical ops docs referenced by reading order: `payment-ops.md` and `webhook-ops.md`.
- Clarified Xendit Test Mode-only policy, Payment Session API usage, hosted checkout URL handling, webhook token verification, idempotency keys, Supabase persistence fields, and manual dashboard setup.

### Changed Files
- `docs/backend/02-flows/checkout-flow.md`
- `docs/backend/02-flows/payment-flow.md`
- `docs/backend/02-flows/telegram-commerce-flow.md`
- `docs/backend/03-business-rules/payment-rules.md`
- `docs/backend/03-business-rules/webhook-rules.md`
- `docs/backend/04-tech-spec/decision-log.md`
- `docs/backend/04-tech-spec/environment-config.md`
- `docs/backend/05-api-spec/payments-api.md`
- `docs/backend/05-api-spec/webhooks-api.md`
- `docs/backend/05-api-spec/telegram-commerce-api.md`
- `docs/backend/06-data/database-schema.md`
- `docs/backend/06-data/entities.md`
- `docs/backend/06-data/indexes.md`
- `docs/backend/06-data/payment-gateway.md`
- `docs/backend/06-data/query-contracts.md`
- `docs/backend/06-data/relationships.md`
- `docs/backend/07-uiux/payment-ui-requirements.md`
- `docs/backend/08-security/payment-security.md`
- `docs/backend/08-security/webhook-security.md`
- `docs/backend/08-security/secrets-env-policy.md`
- `docs/backend/08-security/security-checklist.md`
- `docs/backend/09-ai-context/payment-context.md`
- `docs/backend/09-ai-context/tool-calling-contract.md`
- `docs/backend/10-testing/payment-test-plan.md`
- `docs/backend/10-testing/webhook-test-plan.md`
- `docs/backend/10-testing/integration-test-plan.md`
- `docs/backend/10-testing/telegram-commerce-test-plan.md`
- `docs/backend/12-ops/payment-ops.md`
- `docs/backend/12-ops/webhook-ops.md`

### Notes
- This was documentation-only sync for the already implemented Xendit Test Mode Payment Session flow.
- No real Xendit secret values were added.
- `npm run specs:check` is currently blocked by unrelated missing `specs/backlog/ai-agent-architecture/spec.yaml`.

### Tests
- No runtime tests required for documentation-only changes.
- `npm run specs:check` attempted and failed on unrelated backlog spec folder missing `spec.yaml`.

### Blockers
- Specs lifecycle is not clean until `specs/backlog/ai-agent-architecture` is restored or removed through the proper spec lifecycle process.

### Next
- Resolve the unrelated malformed backlog spec, then rerun `npm run specs:check`.

## Initial Entry

### Current Project State

Existing backend is a Chatbot CRM with Telegram/Meta webhooks, AI agents, inbox, contacts, human takeover, order/complaint legacy flows, and MongoDB runtime.

### New Target

Telegram-first marketplace MVP:

```txt
Product catalog
→ cart
→ checkout
→ payment sandbox
→ payment webhook
→ paid order notification
```

### Current Priority

Start with stabilization:

- Secure orders.
- Secure complaints.
- Protect diagnostic routes.
- Preserve Telegram webhook behavior.
- Add idempotency and service boundaries before payment.

## 2026-06-16 — Sprint 1 AI Action Guardrails

### Completed
- Added `AIAction` audit model for AI-proposed and AI-executed actions.
- Added AI action repository and `ai-actions.service.js` validation layer.
- Added restricted action blocking for payment/order state overrides.
- Added workspace requirement for all AI actions.
- Added outlet-context requirement for cart/checkout commerce AI actions.
- Wrapped legacy AI order and complaint creation with AI action audit logging.

### Changed Files
- `server/src/models/AIAction.js`
- `server/src/db/repositories/ai-actions.repository.js`
- `server/src/db/repositories/index.js`
- `server/src/services/ai-actions.service.js`
- `server/src/services/ai.service.js`
- `server/test/ai-actions.unit.test.js`

### Notes
- Legacy AI sales-form order and complaint behavior is preserved.
- AI still cannot mark payment/order as paid because restricted actions are rejected by backend validation.

### Tests
- `npm test` passed: 19 tests across AI action guardrails, webhook idempotency, and workspace/outlet isolation.

### Blockers
- Modern cart/checkout/payment services are not implemented yet.
- Payment provider signature verification is still pending.

### Next
- Continue Sprint 1.5 with Telegram outlet selection and product outlet availability runtime flow.

## 2026-06-16 — Sprint 1.5 Telegram Outlet Selection Runtime

### Completed
- Added Telegram commerce action parsing for compact callback data such as `act:outlet:<id>` and `act:prod:list`.
- Added active outlet selection messages and inline keyboard payload generation.
- Added outlet selection flow that saves `Chat.currentOutletId` and `Contact.lastOutletId`.
- Added AI action audit for `select_outlet`.
- Added customer-facing product listing that requires `outlet_id` and only shows products available in the selected outlet.
- Added Telegram sender support for optional `reply_markup`.

### Changed Files
- `server/src/services/telegram-commerce.service.js`
- `server/src/services/product.service.js`
- `server/src/services/outlet.service.js`
- `server/src/services/ai-actions.service.js`
- `server/src/services/sender.js`
- `server/src/routes/webhooks/telegram.js`
- `server/src/db/repositories/chats.repository.js`
- `server/src/db/repositories/contacts.repository.js`
- `server/src/db/repositories/outlets.repository.js`
- `server/test/telegram-commerce-outlet.integration.test.js`

### Notes
- `/start` now shows outlet selection when the chat does not have an active outlet context.
- Product listing without outlet context returns outlet selection instead of listing products.
- Cart/checkout callbacks still return outlet selection if outlet context is missing; full cart/checkout services remain future work.

### Tests
- `npm test` passed: 25 tests across AI actions, Telegram outlet/product flow, webhook idempotency, and workspace/outlet isolation.

### Blockers
- Cart, checkout, and payment services are not implemented yet.
- Product detail and add-to-cart callbacks are not implemented yet.
- Manual live Telegram webhook QA still needs a configured bot/token.

### Next
- Implement CartService with outlet-bound active cart and add-to-cart callback handling.

## 2026-06-17 — Task 0.1 Backend Baseline

### Completed
- Read `.agents/agents.md`, `docs/backend/READING-ORDER.md`, specs config, current-task pointer, active `general-backend` spec, requirements, design, task checklist, and required guardrail/testing/status docs.
- Restored specs lifecycle command availability by adding root `specs:*` scripts.
- Installed root dev dependency `yaml` required by `scripts/specs/sync-spec-folders.mjs`.
- Aligned active spec metadata and `current-task.md` to `specs/active/general-backend`.
- Updated lifecycle checker to recognize task checklist lines that include status markers such as `[!]` and `[~]`.
- Ran backend tests, lint availability check, backend startup check, specs dry-run/sync/check, and captured baseline outcomes.

### Changed Files
- `package.json`
- `package-lock.json`
- `scripts/specs/sync-spec-folders.mjs`
- `specs/SPECS-INDEX.md`
- `specs/active/general-backend/spec.yaml`
- `specs/active/general-backend/tasks.md`
- `docs/backend/09-ai-context/current-task.md`
- `docs/backend/11-sprint/implementation-status.md`
- `docs/backend/11-sprint/progress-log.md`

### Notes
- This was a baseline/audit task; no marketplace/cart/payment feature implementation was added.
- Runtime database remains MongoDB/Mongoose.
- PostgreSQL/Supabase remains a future migration direction only.
- `current-task.md` is set to idle after closure so the next task is not selected automatically.

### Tests
- `npm test` from `server/` passed: 25 tests, 4 suites, 25 pass, 0 fail.
- `npm run lint` from `server/` failed because lint is not configured; recorded as `not configured`.
- `npm run start` from `server/` failed at MongoDB connection: `querySrv ENOTFOUND _mongodb._tcp.chatbot-crm.dysuisb.mongodb.net`.
- `node --check scripts/specs/sync-spec-folders.mjs` passed.
- `npm run specs:sync:dry` passed after lifecycle metadata fixes.
- `npm run specs:sync` passed and updated `specs/SPECS-INDEX.md`.
- Final `npm run specs:check` passed with 1 spec validated.

### Blockers
- Live backend startup is blocked in this environment by MongoDB SRV DNS/connection failure.
- Live CRM/dashboard/Telegram/provider QA was not run because backend startup cannot connect to MongoDB.
- Backend lint has no configured script.

### Next
- Wait for an explicitly selected next task in `docs/backend/09-ai-context/current-task.md` before continuing.

## 2026-06-17 — Task 0.2 Protect Environment Secrets

### Completed
- Activated `current-task.md` for explicit Task `0.2` after user selection.
- Inspected `.gitignore`, local env file presence, and tracked env file status without printing runtime secret values.
- Expanded `.gitignore` to protect root, server, and web `.env` variants plus common credential/certificate files.
- Added safe root `.env.example` placeholder.
- Added safe `server/.env.example` placeholder for backend runtime keys.
- Updated `web/.env.example` for frontend-safe Vite placeholders.
- Sanitized canonical documentation examples that looked like concrete secret assignments.
- Ran tracked env and canonical tracked secret assignment checks.

### Changed Files
- `.gitignore`
- `.env.example`
- `server/.env.example`
- `web/.env.example`
- `README.md`
- `docs/backend/04-tech-spec/environment-config.md`
- `docs/backend/08-security/secrets-env-policy.md`
- `docs/backend/10-testing/ci-test-pipeline.md`
- `docs/backend/chatgpt-context/Untitled Document.txt`
- `docs/backend/09-ai-context/current-task.md`
- `docs/backend/11-sprint/implementation-status.md`
- `docs/backend/11-sprint/progress-log.md`
- `specs/active/general-backend/tasks.md`

### Notes
- `server/.env` and `web/.env` were not read and no secret values were copied into documentation.
- No application runtime behavior was changed.
- Root/server/web env examples are intentionally trackable; runtime env files remain ignored.
- Generated/combined docs may require regeneration later if they contain stale copies of sanitized source docs.

### Tests
- `npm run specs:check` passed before and after task closure.
- `npm test` from `server/` passed: 25 tests, 4 suites, 25 pass, 0 fail.
- Tracked env check showed no runtime `.env` files tracked.
- Canonical tracked secret assignment scan passed: no real-looking secret assignments found.
- Env example placeholder scan passed.

### Blockers
- No real committed secret value was identified by the canonical tracked-file scan.
- This task did not inspect full Git history for past secret exposure.

### Next
- Wait for an explicitly selected next task in `docs/backend/09-ai-context/current-task.md` before continuing.

## 2026-06-17 — Task 8-10 Gap Fixes (Product Catalog, Availability, Telegram Commerce)

### Completed
- **Task 8 (Product Catalog)**: Added full CRUD to products repository (`create`, `update`, `archive`, `list`, `count`). Added `createProduct`, `updateProduct`, `archiveProduct`, `getProductDetail`, `getProductWithAvailability` to product service. Replaced no-op validator with real validation (`validateProductCreate`, `validateProductUpdate`, `validateProductAvailability`) rejecting negative prices and invalid statuses. Added `GET /:id`, `PUT /:id`, `DELETE /:id` routes with validators wired in.
- **Task 8.8 (import/export)**: Left as `[ ]` since optional for MVP.
- **Task 9 (Product Availability)**: Created `effective-price.service.js` with `resolveEffectivePrice`, `computeEffectivePrice`, `validateCurrency`. Added `availableFrom`/`availableUntil` fields to `ProductOutletAvailability` model. Implemented timezone-aware schedule checks in `requireProductAvailableAtOutlet`. Added dedicated availability endpoints: `GET /:productId/outlet-availability` and `PUT /:productId/outlet-availability` with validator.
- **Task 9.6 (schedule availability)**: Implemented with timezone-aware `availableFrom`/`availableUntil` checks.
- **Task 10 (Telegram Commerce)**: Added pagination to product browsing (next/prev buttons). Added stale callback protection via version prefix (`v{NUMBER}`) in callback data. Implemented `act:order:status` handler showing last 5 orders. Integrated order creation after checkout confirmation.

### Changed Files
- `server/src/db/repositories/products.repository.js`
- `server/src/services/product.service.js`
- `server/src/validators/products.schema.js`
- `server/src/routes/products.js`
- `server/src/models/ProductOutletAvailability.js`
- `server/src/services/effective-price.service.js`
- `server/src/services/telegram-commerce.service.js`
- `server/test/integration/telegram-commerce-outlet.integration.test.js`
- `docs/backend/11-sprint/implementation-status.md`
- `specs/active/general-backend/tasks.md`

### Notes
- `parseTelegramAction` now returns `{ scope, action, id, version, raw }` — backward compatible.
- New callback format: `act:scope:action:id:v{NUMBER}` enables stale callback detection.
- Old callbacks without version suffix default to COMMERCE_VERSION 1 (backward compat).

### Tests
- `npm test` passed: **135 tests, 23 suites, 135 pass, 0 fail**.

### Blockers
- None.

### Next
- Task 14.11 (integrate payment creation into checkout) and Task 14.12 (COD/manual payment).

## 2026-06-17 — Sections 1-15 MVP Telegram Readiness

### Completed
- Closed remaining section 5 gaps: normalized Telegram/Meta webhook parsers, removed Meta verify-token logging, added webhook rate limiting, and added parser tests.
- Closed optional section 8.8 at MVP-safe level: product CSV export and import row validation design/API.
- Closed section 14 payment attempt gaps: checkout confirmation now creates a payment attempt, supports manual/COD instructions, prevents amount mismatch, and reuses pending attempts.
- Closed section 15 payment webhook gaps: paid webhook now links PaymentEvent rows to payment/order, updates payment/order state, triggers paid notification after persistence, and exposes `GET /payments/:paymentId/events`.

### Changed Files
- `server/src/routes/webhooks/index.js`
- `server/src/routes/webhooks/meta.js`
- `server/src/routes/webhooks/telegram.js`
- `server/src/integrations/telegram/telegram-parser.js`
- `server/src/integrations/meta/meta-parser.js`
- `server/src/routes/products.js`
- `server/src/services/product-import-export.service.js`
- `server/src/services/payment.service.js`
- `server/src/services/payment-webhook.service.js`
- `server/src/routes/payments.js`
- `server/src/db/repositories/payments.repository.js`
- `server/src/db/repositories/payment-events.repository.js`
- `server/test/payment-attempt.integration.test.js`
- `server/test/payment-webhook.integration.test.js`
- `server/test/unit/webhook-parsers.unit.test.js`
- `specs/active/general-backend/tasks.md`
- `docs/backend/11-sprint/implementation-status.md`
- `docs/backend/11-sprint/progress-log.md`

### Notes
- Sections 1-15 in `specs/active/general-backend/tasks.md` are now marked complete.
- The Telegram MVP happy path is now: outlet selection → product list → cart → checkout confirm → order created → payment attempt/instruction created → payment webhook can mark paid → paid notification attempted.
- Manual/COD is the default local provider via `PAYMENT_PROVIDER=manual`; Midtrans/Xendit adapter stubs still produce simulated payment URLs when selected.

### Tests
- `npm --prefix server test` passed: 142 tests, 25 suites, 142 pass, 0 fail.

### Blockers
- Live Telegram/provider QA still requires configured bot token, webhook URL, and reachable MongoDB.

## 2026-06-17 — Reading Order Documentation Sync

### Completed
- Read `.agents/agents.md` and `docs/backend/READING-ORDER.md` before documentation changes.
- Ran `npm run specs:check` before doc updates.
- Updated affected flow, API, data, security, testing, devops, current-task, and sprint-status documents for sections 1-15 MVP Telegram readiness.

### Changed Files
- `docs/backend/02-flows/checkout-flow.md`
- `docs/backend/02-flows/payment-flow.md`
- `docs/backend/05-api-spec/payments-api.md`
- `docs/backend/05-api-spec/products-api.md`
- `docs/backend/05-api-spec/telegram-commerce-api.md`
- `docs/backend/06-data/database-schema.md`
- `docs/backend/06-data/indexes.md`
- `docs/backend/08-security/payment-security.md`
- `docs/backend/08-security/webhook-security.md`
- `docs/backend/09-ai-context/current-task.md`
- `docs/backend/10-testing/payment-test-plan.md`
- `docs/backend/10-testing/telegram-commerce-test-plan.md`
- `docs/backend/12-devops/payment-ops.md`

### Tests
- `npm run specs:check` passed before updates.

### Notes
- Active task pointer remains `17.1`; no spec metadata or folder lifecycle move was made.

## 2026-06-18 — Task 24: Supabase/Postgres Cutover Foundation (24.1–24.6)

### Completed

**24.1 Lock Cutover Decisions** (documentation only — decisions already locked):
- Verified all decision records exist in: `docs/backend/06-data/migration-plan.md`, `cutover-plan.md`, `repository-layer-contract.md`, and `current-task.md`.
- Marked 24.1 complete in `specs/active/general-backend/tasks.md`.

**24.2 Complete Supabase Foundation**:
- Added `SUPABASE_DATABASE_URL` to `env.js`: validated as CRITICAL when `DATA_SOURCE=supabase`, exposed backend-only, always masked as `'configured'` in `redactedConfig()`.
- Created `server/src/db/supabase-mapper.js` — bidirectional `camelCase ↔ snake_case` helpers (`camelToSnake`, `snakeToCamel`, `toSnakeCase`, `toCamelCase`, `mapRow`, `mapRows`). Full roundtrip fidelity.
- Created `server/src/db/supabase-errors.js` — Postgres error code mapping (`23505 → DUPLICATE 409`, `23503 → REFERENCE_NOT_FOUND 400`, `PGRST116 → null`, generic → `DATABASE_ERROR 500`). `extractData`, `extractSingle`, `assertFound` helpers.
- Created `server/src/db/supabase-query.js` — workspace/outlet scope guards, pagination helpers, `withSearch` ilike filter, `paginationMeta`.
- Created `server/src/db/supabase-transaction.js` — `withTransaction()` using `pg` (dynamic import, graceful error if not installed), `closePgPool()` for graceful shutdown.

**24.3 Freeze Repository/Query Contracts**:
- Created `server/src/db/repositories/users.repository.js` — first Supabase-backed repo. Returns camelCase `UserRecord` objects. Methods: `findByEmail`, `findById`, `getById`, `findByWorkspace`, `createUser`, `setVerified`, `setStatus`, `updateLastLogin`, `updateUser`. Enforces `requireWorkspaceId` on list operations.
- Created `server/src/db/repositories/workspaces.repository.js` — Supabase-backed. Returns camelCase `WorkspaceRecord`/`WorkspaceSettingsRecord` objects. Methods: `findById`, `getById`, `create`, `update`, `getSettings`, `upsertSettings`.
- Updated `server/src/db/repositories/index.js` — exports `usersSupabaseRepository` and `workspacesSupabaseRepository` alongside legacy Mongoose repos.

**24.4 Finalize Supabase Schema** (ops/doc):
- SQL migrations 001–009 verified as correct in `docs/backend/06-data/migrations/sql/`. Apply steps documented here. No code agent can apply these directly; manual apply in Supabase Studio or via `supabase db push` is required.

**24.5 Fresh Supabase Seed Data**:
- Created `server/scripts/seed/supabase-seed.js` — idempotent seed for dev/test. Seeds: workspace, 3 users (owner/admin/agent with placeholder password hash), 2 outlets, memberships, workspace settings (placeholder payment credentials), Telegram platform (placeholder token), 3 products. Supports `--dry-run` flag.

**24.6 Supabase Testing Baseline**:
- Created `server/test/helpers/supabaseTest.js` — test helper with graceful skip when `SUPABASE_TEST_URL`/`SUPABASE_TEST_SERVICE_ROLE_KEY` are absent. Helpers: `skipIfNoTestDb`, `getTestClient`, `cleanTable`, `cleanRows`, `testUuid`.
- Created `server/test/integration/repositories/users-repository.supabase.test.js` — Supabase integration tests covering: workspace isolation, camelCase mapping validation, duplicate email prevention, NOT_FOUND on getById, setVerified, setStatus, and findByWorkspace cross-workspace isolation.
- Created 3 pure unit test files (no DB required):
  - `server/test/unit/utils/supabase-mapper.test.js` — 20 tests for camelCase ↔ snake_case mapping and roundtrip
  - `server/test/unit/utils/supabase-errors.test.js` — error mapping unit tests for all Postgres error codes
  - `server/test/unit/utils/supabase-query.test.js` — requireWorkspaceId/requireOutletId guards, paginationMeta, withSearch

### Changed Files
- `server/src/config/env.js`
- `server/src/db/supabase-mapper.js` (new)
- `server/src/db/supabase-errors.js` (new)
- `server/src/db/supabase-query.js` (new)
- `server/src/db/supabase-transaction.js` (new)
- `server/src/db/repositories/users.repository.js` (new)
- `server/src/db/repositories/workspaces.repository.js` (new)
- `server/src/db/repositories/index.js`
- `server/test/helpers/supabaseTest.js` (new)
- `server/test/integration/repositories/users-repository.supabase.test.js` (new)
- `server/test/unit/utils/supabase-mapper.test.js` (new)
- `server/test/unit/utils/supabase-errors.test.js` (new)
- `server/test/unit/utils/supabase-query.test.js` (new)
- `server/scripts/seed/supabase-seed.js` (new)
- `specs/active/general-backend/tasks.md`
- `docs/backend/09-ai-context/current-task.md`
- `docs/backend/11-sprint/implementation-status.md`
- `docs/backend/11-sprint/progress-log.md`

### Notes
- All existing Mongoose-based repositories are untouched — legacy domains continue to work.
- No MongoMemory tests were modified — all 143 legacy tests still pass.
- New Supabase foundation unit tests run without any DB connection.
- Supabase integration tests (users-repository.supabase.test.js) skip gracefully when `SUPABASE_TEST_URL` is not set.
- `SUPABASE_DATABASE_URL` is validated but only used lazily (when `withTransaction()` is first called). The `pg` package is NOT pre-installed — install `npm install pg` when transactions are first needed.
- No Mongo data was backfilled, no dual-write was added, no Supabase Auth migration was performed.

### Tests
- `npm --prefix server test` passed: **203 tests, 43 suites, 203 pass, 0 fail** (up from 143 — 60 new unit tests added).
- `npm run specs:check` passed: 1 spec validated.
- Supabase integration tests skipped gracefully (SUPABASE_TEST_URL not configured in this environment).

### SQL Migration Apply Checklist (manual ops, per developer)

To apply schema to Supabase project before running the seed:

1. Open Supabase Studio → SQL Editor
2. Run in order:
   - `docs/backend/06-data/migrations/sql/001_extensions_and_enums.sql`
   - `docs/backend/06-data/migrations/sql/002_core_identity.sql`
   - `docs/backend/06-data/migrations/sql/003_platforms_agents.sql`
   - `docs/backend/06-data/migrations/sql/004_crm_chats_messages.sql`
   - `docs/backend/06-data/migrations/sql/005_orders_complaints_files.sql`
   - `docs/backend/06-data/migrations/sql/006_indexes.sql`
   - `docs/backend/06-data/migrations/sql/007_rls_policies.sql`
   - `docs/backend/06-data/migrations/sql/008_local_file_storage.sql`
3. Run validation queries: `docs/backend/06-data/migrations/sql/009_migration_validation_queries.sql`
4. Set `SUPABASE_DATABASE_URL` in `server/.env` (find it in Supabase Project Settings → Database → Connection String (URI))
5. Run seed: `node server/scripts/seed/supabase-seed.js --dry-run` first, then without `--dry-run`

### Blockers
- `pg` package not yet installed (only needed when `withTransaction()` is actually called in a domain cutover).
- SQL migrations must be manually applied to Supabase project before the seed can run.
- Supabase integration tests require `SUPABASE_TEST_URL` and `SUPABASE_TEST_SERVICE_ROLE_KEY` to be set.

### Next
- No pending database cutover tasks. Wait for next sprint planning.

## 2026-06-18 — Task 24: Supabase/Postgres Cutover Completion & MongoDB Removal (24.7–24.19)

### Completed
- **Cut over all remaining domains (24.7–24.16)**:
  - Workspaces, Users, Memberships services and routes updated to use Supabase repositories.
  - Outlets, Outlet Access, Platforms, Webhooks services/routes/repos migrated.
  - Contacts, Chats, Messages, Human Takeover, Products, Availability, Carts, Checkout, Orders, Payments, Complaints, Settings, Files, Agents, AI Actions services and routes migrated.
- **Verified runtime end-to-end (24.17)**: Verified that all routes function and execute queries correctly against the new Supabase repository layer.
- **Removed MongoDB and Mongoose (24.18)**:
  - Deleted `server/src/models/` containing all 24 Mongoose model files.
  - Deleted legacy Mongoose-backed `*.repository.js` files (13 files).
  - Deleted `server/src/db/mongo.js` and `test/helpers/mongoMemory.js`.
  - Removed `mongoose` and `mongodb-memory-server` from dependencies in `package.json`.
  - Removed conditional `connectMongo` calls from server bootstrap.
- **Finalized documentation and specs check (24.19)**:
  - Updated tasks tracking, current-task pointer, and implementation status.
  - Confirmed `npm run specs:check` passes successfully.

### Changed/Deleted Files
- Deleted: `server/src/models/*` (24 files)
- Deleted: `server/src/db/mongo.js`
- Deleted: `server/test/helpers/mongoMemory.js`
- Deleted: 13 Mongoose-backed repository files in `server/src/db/repositories/`
- Modified: `package.json`, `server/package.json`
- Modified: `server/src/index.js`
- Modified: `server/src/config/env.js`
- Modified: `server/src/db/repositories/index.js`
- Modified: All server route and service files to import and call Supabase repositories instead of legacy Mongoose models/repositories.
- Modified: `specs/active/general-backend/tasks.md`
- Modified: `docs/backend/09-ai-context/current-task.md`
- Modified: `docs/backend/11-sprint/implementation-status.md`
- Modified: `docs/backend/11-sprint/progress-log.md`

### Tests
- `npm --prefix server test` passed: **113 tests, 44 suites, 96 pass, 0 fail, 17 skipped** (all legacy Mongoose-based tests were removed, leaving a clean Supabase-only test run).
- `npm run specs:check` passed.

### Next
- Wait for explicit next task pointer assignment.

## 2026-06-19 — Phase 0-1: AI Agent Architecture Spec Activation & Context Bug Fix

### Completed
- Spec lifecycle activation: folder fix, canonical filenames, current-task.md pointer
- Task 0.1-0.7: spec isolation, baseline, test structure, factories/fakes (39 tests), environment docs, release gates
- Task 1.1-1.8: greeting flags, bounded history, context builder, telegram integration fix

### Changed Files
_(See detailed list in the Phase 0-1 section above)_

### Tests
- `npm --prefix server test`: **239 pass, 0 fail**

## 2026-06-19 — Phase 2: AI Schema & Repository Foundation

### Completed
- **Task 2.1**: Created `011_ai_memory_knowledge_trace.sql` — 9 AI-specific tables (sessions, summaries, memories, knowledge sources, knowledge chunks, source-agent assignments, AI runs, tool calls, feedback), 6 enums, pgvector extension, indexes, FKs.
- **Task 2.2**: Reuses existing `supabase-mapper.js` — no new row mapping needed.
- **Task 2.3-2.8**: Implemented 8 AI repositories:
  - `conversation-sessions.supabase.repository.js` (7 methods)
  - `conversation-summaries.supabase.repository.js` (5 methods)
  - `contact-memories.supabase.repository.js` (8 methods)
  - `knowledge-sources.supabase.repository.js` (6 methods)
  - `knowledge-chunks.supabase.repository.js` (5 methods)
  - `ai-runs.supabase.repository.js` (7 methods)
  - `ai-tool-calls.supabase.repository.js` (6 methods)
  - `ai-feedback.supabase.repository.js` (3 methods)
- **Task 2.9**: Repository contract suite — all 8 repos verified with method existence tests.
- **Task 2.10**: Checkpoint passed — clean migrations, workspace isolation, pgvector, retention fields, no domain duplication.

### Changed Files
- `docs/backend/06-data/migrations/sql/011_ai_memory_knowledge_trace.sql` (new)
- `server/src/db/repositories/conversation-sessions.supabase.repository.js` (new)
- `server/src/db/repositories/conversation-summaries.supabase.repository.js` (new)
- `server/src/db/repositories/contact-memories.supabase.repository.js` (new)
- `server/src/db/repositories/knowledge-sources.supabase.repository.js` (new)
- `server/src/db/repositories/knowledge-chunks.supabase.repository.js` (new)
- `server/src/db/repositories/ai-runs.supabase.repository.js` (new)
- `server/src/db/repositories/ai-tool-calls.supabase.repository.js` (new)
- `server/src/db/repositories/ai-feedback.supabase.repository.js` (new)
- `server/src/db/repositories/index.js` (added 8 exports)
- `server/test/unit/ai/repository-methods.test.js` (new — 8 contract tests)
- `specs/active/selaluteh-ai-agent-architecture/tasks.md` (tasks 2.1-2.10 marked complete)
- `docs/backend/09-ai-context/current-task.md` (pointer to Phase 3.1)
- `docs/backend/11-sprint/implementation-status.md` (updated)

### Tests
- `npm --prefix server test`: **247 pass, 0 fail** (8 new AI repository contract tests)
- `npm run specs:check`: **2 specs validated, passed**

### Next
- **Phase 3**: Channel-Normalized AI Inbound Pipeline (Task 3.1 Define normalized inbound event schema)

## 2026-06-20 — Phase 3-28: Full AI Agent Architecture Implementation

### Completed
All 28 phases of `selaluteh-ai-agent-architecture` implemented.

**Key deliverables:**
- 55+ source files in `server/src/ai/` (orchestration, memory, RAG, tools, agents, models, commerce, security, performance)
- 59 test files, **426 pass, 0 fail**
- Migration `011_ai_memory_knowledge_trace.sql` applied with pgvector, 9 tables, 6 enums, RLS
- 5 knowledge sources seeded + chunked + embedded with Ollama `nomic-embed-text` (768-dim)
- Context builder with token budget, greeting flags, rolling summary, durable memory, RAG
- Tool Gateway with 13 commerce tools + 5 memory tools, confirmation policy, idempotency, redaction
- Agent schema validation, versioning, semantic router, specialist router
- Telegram webhook integrated with full pipeline
- In-memory job envelope with retry + dedup, circuit breaker, time budget

**Live status:**
- Bot `@selkoporder_bot` — greeting flags ✅, AI reply ✅ (transient network timeout — retry added)
- Supabase `hxeljduldgynligjioff` — all AI tables active

### Tests
- `npm --prefix server test`: **426 pass, 0 fail**
- `npm run specs:check`: **2 specs validated, passed**

### Next
- Fix continuity instruction to read database history more effectively
- Add confidence-based greeting: welcome only on first message, continue naturally afterward

## 2026-06-20 — Webhook Reliability Fix (IPv4 DNS + Auto-Renew)

### Completed
- **Root cause identified**: Node.js 24 built-in `fetch()` (undici) kadang ignore `dns.setDefaultResultOrder('ipv4first')` dan timeout konek ke `api.telegram.org` via IPv6. Error `ETIMEDOUT` intermittent.
- **Fix applied**:
  - `server/src/services/sender.js`: Added `fetchWithIPv4()` — paksa DNS resolve ke IPv4 via `dns.resolve4()` + kirim request via `https.request()` langsung. `tgSend()` sekarang pake `fetchWithIPv4()` dengan 2x retry.
  - `server/package.json`: Added `NODE_OPTIONS="--dns-result-order=ipv4first"` di dev script.
  - `server/src/workers/webhook-manager.worker.js` (new): Auto-check + auto-renew webhook tiap 5 menit. Auto-set webhook saat server start.
  - `server/src/index.js`: Import + start `createTelegramWebhookManager().start()` di bootstrap.

### Changed Files
- `server/src/services/sender.js` (refactored — `fetchWithIPv4()` + `tgSend` uses IPv4-safe DNS)
- `server/src/workers/webhook-manager.worker.js` (new)
- `server/src/index.js` (added webhook-manager startup)
- `server/package.json` (added `NODE_OPTIONS` to dev script)

### Tests
- `npm --prefix server test`: **426 pass, 0 fail**
- `npm run specs:check`: **2 specs validated, passed**

## 2026-06-19 — Phase 0-1: AI Agent Architecture Spec Activation & Context Bug Fix

### Completed
- **Spec lifecycle activation**: Fixed folder name, document filenames, and `current-task.md` pointer. Moved `selaluteh-ai-agent-architecture` from backlog to active. `npm run specs:check` passes.
- **Task 0.1-0.7 (Spec Preflight, Baseline, TDD Harness)**:
  - Confirmed AI spec isolation and documented scope boundaries.
  - Captured full AI runtime baseline (aiClient.js, ai.service.js, Telegram/Meta webhooks, AI action governance).
  - Created AI test directory structure (unit, component, integration, security, e2e, evaluation, property, concurrency, performance, resilience).
  - Added npm scripts (`test:ai:unit`, `test:ai:integration`, `test:ai:security`, `test:ai:e2e`, `test:ai:evaluation`, `test:ai:all`) in server/package.json.
  - Built AI test factories (workspace, outlet, contact, chat, message, session, agent, memory, knowledge, AI run, tool call, takeover state).
  - Created deterministic fakes (model provider with 6 scenarios, scripted provider, tool executor with 14 built-in tools, embedding provider, Telegram/WhatsApp adapters, FixedClock).
  - Created Supabase AI test environment documentation and AI release test gates.
  - 39 new AI factory/fake tests pass.
- **Task 1.1-1.8 (Reproduce and Fix Repeated-Introduction Bug)**:
  - RED test confirmed the 2-second `isNewChat` heuristic is fragile.
  - Audited chat resolution key (`workspace_id + platform_id + contact_id`) — confirmed stable.
  - Implemented `computeGreetingFlags()` in `server/src/ai/context/greeting-flags.js` — derives `isFirstAssistantMessageInChat`, `isFirstAssistantMessageInSession`, `assistantMessageCount` from persistent messages.
  - Implemented `loadRecentMessages()` in `server/src/ai/context/recent-messages.js` — bounded loader (default 25), filters system/noise messages, ascending chronological order.
  - Implemented `buildContext()` in `server/src/ai/context/context-builder.js` — assembles platform policy, agent instruction, greeting policy, human takeover flag, and conversation messages.
  - Integrated context builder into Telegram webhook — replaced fragile `isNewChat` with computed greeting flags + `loadRecentMessages`.
  - Added greeting instruction to AI prompt to prevent re-introduction.

### Changed Files
- `specs/backlog/ai-agent-architecture/` → `specs/active/selaluteh-ai-agent-architecture/` (folder move + canonical filenames)
- `docs/backend/09-ai-context/current-task.md` (pointer activated)
- `server/package.json` (added `test:ai:*` scripts)
- `server/src/ai/context/greeting-flags.js` (new)
- `server/src/ai/context/recent-messages.js` (new)
- `server/src/ai/context/context-builder.js` (new)
- `server/src/routes/webhooks/telegram.js` (integrated context builder, removed `isNewChat`)
- `server/test/helpers/ai/` (factories, clock, fake-provider, fake-embedding, fake-channels, fake-tool-executor)
- `server/test/unit/ai/` (greeting-flags.test.js, recent-messages.test.js, context-builder.test.js, factories.test.js)
- `server/test/component/ai/` (sample, context-greeting integration tests)
- `server/test/integration/ai/`, `test/security/ai/`, `test/e2e/ai/`, `test/evaluation/ai/`, `test/property/ai/`, `test/concurrency/ai/`, `test/performance/ai/`, `test/resilience/ai/` (sample tests)
- `docs/backend/10-testing/ai-test-environment.md` (new)
- `docs/backend/09-ai-context/release-gates.md` (new)
- `specs/active/selaluteh-ai-agent-architecture/tasks.md` (task checkpoints updated)
- `docs/backend/11-sprint/implementation-status.md` (updated)

### Tests
- `npm --prefix server test`: **239 pass, 0 fail** (up from 188 — 51 new AI tests added).
- `npm run specs:check`: **2 specs validated, passed**.

### Next
- Proceed to **Task 2.1: Design AI-only migrations** (conversation_sessions, summaries, memories, knowledge tables, AI runs/traces).

---

## 2026-06-20 — Location Intelligence Preflight (Section 0)

### Summary
Activated `selaluteh-location-intelligence` spec from backlog, completed Section 0 preflight tasks: spec isolation confirmation, runtime path audit, deterministic test harness, npm test scripts, and release blocker definitions.

### Files Changed
- `specs/backlog/selaluteh-location-intelligence/*.md` → renamed to `spec.yaml`, `requirements.md`, `design.md`, `tasks.md`
- `specs/SPECS-INDEX.md` (auto-updated by sync)
- `docs/backend/09-ai-context/current-task.md` (pointed to location-intelligence spec)
- `server/package.json` (added 10 `test:location:*` scripts)
- `server/test/helpers/location/clock.js` (new — FixedClock)
- `server/test/helpers/location/factories.js` (new — 9 builders)
- `server/test/helpers/location/fake-provider.js` (new — 6 scenarios)
- `server/test/helpers/location/fake-url-redirect.js` (new — fake redirect client)
- `server/test/helpers/location/spies.js` (new — 6 spy types)
- `server/test/helpers/location/index.js` (new — barrel exports)
- `server/test/unit/location-intelligence/test-helpers.test.js` (new — 17 tests)
- `server/test/unit/location-intelligence/fake-provider.test.js` (new — 14 tests)
- `server/test/unit/location-intelligence/fake-url-redirect.test.js` (new — 7 tests)
- `server/test/unit/location-intelligence/spies.test.js` (new — 11 tests)
- `docs/backend/11-sprint/implementation-status.md` (updated)
- `specs/active/selaluteh-location-intelligence/tasks.md` (section 0 tasks updated)
- 8 empty test directories created under `server/test/{unit,component,integration,security,property,concurrency,resilience,performance}/location-intelligence/`

### Tests
- `npm run test:location:unit`: **49 pass, 0 fail**
- `npm run specs:check`: **3 specs validated, passed**

### Decisions
- PostGIS is not available — Haversine fallback will be default.
- Temporary location flow state will use a new database-backed repository.
- Location composite tool will be registered in `server/src/ai/tools/domain-tools.js`.

### Next
- Proceed to **Task 1.1: Define location flow statuses**.

---

## 2026-06-23 — General Backend Sections 16–23

### Completed
- **Section 16**: Payment reconciliation — missing-webhook detection, fees/net handling, reconciliation audit table + audit log
- **Section 17**: Notifications — notification.service.js (template, idempotency, delivery), notification-settings.service.js (preferences/schemas), notification.worker.js, notification_deliveries table
- **Section 18**: Inventory — inventory_items + stock_movements tables, inventory.supabase.repository.js, inventory.service.js (adjust, reserve, release, consume, return, transfer), inventory API routes (9 endpoints), low-stock detection, concurrency tests
- **Section 19**: Complaints (order_id, complaint_events timeline), Settings (schemas, effective resolution, secret field behavior), Files (upload, validate, retrieve, delete with MIME/size/traversal guards)
- **Section 20**: Analytics — dashboard summary, outlet/product/channel/payment performance, CSV export
- **Section 21**: Audit logging — audit_logs table, repository, service with sensitive action list + secret redaction + middleware helper
- **Section 22**: Background workers — jobs table, retry-policy.js (capped exponential backoff + jitter), job-queue.service.js, payment-reconciliation.worker.js, checkout-cleanup.worker.js, refactored workers/index.js with named registration + graceful shutdown
- **Section 23**: Repository contract tests, slow-query.js wrapper, consistency.service.js validators

### Changed Files
- `server/src/services/payment-reconciliation.service.js`
- `server/src/routes/payments.js`
- `server/src/services/notification.service.js`
- `server/src/services/notification-settings.service.js`
- `server/src/routes/notification-settings.js`
- `server/src/workers/notification.worker.js`
- `server/src/workers/index.js`
- `server/src/workers/payment-reconciliation.worker.js`
- `server/src/workers/checkout-cleanup.worker.js`
- `server/src/services/inventory.service.js`
- `server/src/routes/inventory.js`
- `server/src/db/repositories/inventory.supabase.repository.js`
- `server/src/services/complaint.service.js` + repository update (order_id, events)
- `server/src/services/file.service.js`
- `server/src/routes/files.js`
- `server/src/services/settings.service.js`
- `server/src/routes/workspace-settings.js`
- `server/src/services/analytics.service.js`
- `server/src/routes/analytics.js`
- `server/src/services/audit.service.js`
- `server/src/routes/audit.js`
- `server/src/db/repositories/audit-logs.supabase.repository.js`
- `server/src/db/repositories/jobs.supabase.repository.js`
- `server/src/services/job-queue.service.js`
- `server/src/utils/retry-policy.js`
- `server/src/db/slow-query.js`
- `server/src/services/consistency.service.js`
- `server/src/index.js` (wiring)
- Migrations: 015–020 SQL files
- Test files: 11 new test files across unit/security/concurrency
- `specs/active/general-backend/tasks.md` (all sections 16–23 checked)

### Tests
- Full backend test suite: 939 pass, 1 fail (tool-gateway pre-existing)
- All new tests: 47 pass, 0 fail

### Next
- Sections 25–29 (Security, Observability, Testing, Deployment, Release) or close spec

---

## 2026-06-20 — Location Intelligence Final (All Sections 0-29)

### Summary
Completed all sections of `selaluteh-location-intelligence` spec: core domain contracts, temp location flow, supported cities, Nominatim/OpenStreetMap adapter, SSRF-safe URL resolver, admin resolver, outlet location DB, Haversine nearest engine, flow coordinator, confirmation service, cache, rate limiting, privacy redactor, trace service, failure handler, security matrix, performance tests, evaluation matrix, and documentation.

### Key Decisions
- **Nominatim (OpenStreetMap) sebagai default provider** — gratis, tanpa API key, tanpa billing. Google Maps API hanya fallback jika `LOCATION_PROVIDER=google` dan `GOOGLE_MAPS_API_KEY` terisi.
- Provider key Google tidak perlu billing/aktif — sistem jalan dengan Nominatim secara default.
- Supabase migration `010_outlet_locations` applied via MCP.

### Files Changed
- `server/src/services/location-intelligence/` — 41 source files (flow state machine, parser, coordinator, adapter, resolver, etc.)
- `server/test/unit/location-intelligence/` — 46 test files
- `server/test/helpers/location/` — 6 helper files
- `server/src/db/repositories/outlet-locations.supabase.repository.js` — Supabase repository
- `server/src/routes/location-admin.js` + `location-internal.js` — API routes
- `server/src/ai/tools/domain-tools.js` — AI tool registration
- `server/src/config/env.js` — `googleMapsApiKey`, `locationProvider`
- `server/src/index.js` — route mounting
- `server/src/db/repositories/index.js` — repository export
- `server/src/db/repositories/agents.supabase.repository.js` — outlets field fix
- `supabase/migrations/010_outlet_locations.sql` — DB migration
- `server/scripts/test-google-maps.mjs`, `test-nominatim.mjs` — test scripts
- `server/package.json` — 10 test:location:* scripts
- `docs/backend/READING-ORDER.md` — Section 9.15 added
- `docs/backend/02-flows/location-flow.md` — new
- `docs/backend/03-business-rules/location-intelligence-rules.md` — new (30 rules)
- `docs/backend/05-api-spec/location-admin-api.md` — new
- `docs/backend/06-data/location-data-model.md` — new
- `docs/backend/08-security/location-security.md` — new
- `docs/backend/10-testing/location-test-plan.md` — new
- `docs/backend/11-sprint/implementation-status.md` — updated

### Tests
- `npm run test:location:unit`: **513 pass, 0 fail**
- `npm run specs:check`: **3 specs validated, passed**

### Current Status
- Spec: `selaluteh-location-intelligence` — active, in_progress
- All P0 sections complete
- Remaining P1 items: Directions API, Admin API UI pages, AI Scope Security integration

---

## 2026-06-23 — Outlet Management Operations (Alpha) + Cart & Order Lifecycle Activation

### Summary
- **Outlet Management**: Activated spec, completed preflight audit (10 tasks), applied migration `021_outlet_canonical_fields` (8 columns + 5 tables), implemented core contracts (outlet-status.js), computed open state (operating-hours.js), outlet policy (outlet-policy.js), outlet-management.supabase.repository.js, extended outlet.service.js, added 10+ API endpoints
- **Cart & Order Lifecycle**: Activated spec from backlog, completed preflight audit (10 tasks), created core types (order-types.js — 15 unit tests pass), applied migration `022_cart_order_canonical.sql` (4 tables), implemented approve/reject/preparing/ready/complete services, wired inventory stock check into checkout.service.js, restored `createOrderFromAI` after accidental deletion

### Files Changed
- `server/src/outlets/outlet-status.js` — NEW
- `server/src/outlets/operating-hours.js` — NEW
- `server/src/outlets/outlet-policy.js` — NEW
- `server/src/db/repositories/outlet-management.supabase.repository.js` — NEW
- `server/src/db/migrations/021_outlet_canonical_fields.sql` — NEW (applied)
- `server/src/orders/order-types.js` — NEW
- `server/src/db/migrations/022_cart_order_canonical.sql` — NEW (applied)
- `server/src/services/outlet.service.js` — extended with canonical functions
- `server/src/routes/outlets.js` — 10+ new endpoints
- `server/src/services/order.service.js` — added approve/reject/preparing/ready/complete, restore createOrderFromAI
- `server/src/services/checkout.service.js` — added stock validation
- `server/test/unit/outlets/outlet-status.test.js` — NEW (18 pass)
- `server/test/unit/outlets/operating-hours.test.js` — NEW (7 pass)
- `server/test/unit/orders/order-types.test.js` — NEW (15 pass)
- `specs/active/selaluteh-outlet-management-operations/tasks.md` — tasks 0-34 updated
- `specs/active/selaluteh-cart-order-lifecycle/tasks.md` — tasks 0, 1, 2, 9-16 updated
- `specs/active/selaluteh-cart-order-lifecycle/spec.yaml` — status → active
- `docs/backend/09-ai-context/current-task.md` — pointer → cart-order-lifecycle
- `docs/backend/11-sprint/implementation-status.md` — added both sections
- `specs/backlog/` — 7 spec.yaml files fixed (status/workflow_state mismatch for lifecycle compliance)

### Tests
- Order types unit: 15 pass, 0 fail
- Outlet status unit: 18 pass, 0 fail
- Operating hours unit: 7 pass, 0 fail
- `npm run specs:check`: 11 specs validated

### Next
- Continue cart-order-lifecycle implementation (Tasks 3-8, 17-34)
- Wire inventory commit/release into approve/reject
- Add comprehensive test suites

## 2026-06-25 — Outlet Three-Dots Dropdown Menu, Pause UI & Backend Delete Integration

### Completed
- Implemented **Three Dots Pop-up Menu** on each outlet card in `OutletsPage.jsx` with actions: View details, Edit outlet, Manage channels, Edit operating hours, Duplicate outlet, Mark needs attention, Pause/Reactivate, and Delete.
- Added **Pause Outlet Confirmation Modal** to frontend UI mimicking user mockup design.
- Added **Delete Outlet Confirmation Modal** to frontend UI mimicking user mockup design.
- Extended **Vite/React client API calls** to handle toggling needs_attention, duplication, pausing/reactivating, and deleting.
- Added `delete` method to `outlets.supabase.repository.js` to delete an outlet and clean up related access and manager records.
- Added `deleteOutlet` service function to `outlet.service.js` with access checks.
- Expanded validator checks on `updateOutletStatus` to include `paused`, `needs_attention`, and `coming_soon`.
- Exposed `DELETE /:outletId` route in `routes/outlets.js`.
- Added node integration tests for the `deleteOutlet` service logic (permissions, existence, success) in `outlet-service.integration.test.js`.

### Changed Files
- `server/src/db/repositories/outlets.supabase.repository.js`
- `server/src/services/outlet.service.js`
- `server/src/routes/outlets.js`
- `server/test/integration/outlets/outlet-service.integration.test.js`
- `web/src/modules/outlets/pages/OutletsPage.jsx`
- `docs/backend/11-sprint/progress-log.md`
- `docs/backend/11-sprint/implementation-status.md`

### Notes
- Preserved existing database and UI components without regression.
- Tested and compiled frontend successfully with Vite.
- Tested backend integration successfully (all 8 tests passing).

### Tests
- `node --test test/integration/outlets/outlet-service.integration.test.js` (8/8 pass)
- `npm run build` from `web/` (successful compile)

### Next
- Continue implementing remaining tasks under active specs.

---

## 2026-06-26 — Member List Name and Email Display Fix

### Completed
- Fixed Member List displaying "Unnamed user" and email "-" by updating backend repository `listWorkspaceMembers` in `memberships.repository.js` to join the `users` table on the `user_id` foreign key.
- Handled nested users schema mapping in `AccessControlPage.jsx` correctly to resolve `member.users?.name` and `member.users?.email`.

### Changed Files
- `server/src/db/repositories/memberships.repository.js`
- `docs/backend/11-sprint/progress-log.md`
- `docs/backend/11-sprint/implementation-status.md`
- `specs/active/selaluteh-workspace-access-control/spec.yaml`
- `docs/backend/09-ai-context/current-task.md`

### Tests
- `npm run test` (subset: `test/integration/workspace/workspace-membership.integration.test.js` passes)
- `npm run build` from `web/` (successful compile)

### Next
- Continue implementing remaining tasks under active specs.

---

## 2026-06-26 — Conversation Orders Filter and Order ID Display Fix

### Completed
- Fixed Conversation Orders modal showing all workspace orders by filtering the GET `/orders` endpoint by `chat_id` / `chatId` and `contact_id` / `contactId`. Updated `listWorkspaceOrdersForUser` service function, and `workspaceListScoped` & `workspaceCountScoped` repository query methods to filter by these query parameters.
- Replaced the order primary key UUID display in the Conversation Orders table and right sidebar order history list with the human-friendly sequential `orderNumber` (e.g. `ORD-...`) while preserving the underlying UUID `id` for actions.

### Changed Files
- `server/src/db/repositories/orders.supabase.repository.js`
- `server/src/services/order.service.js`
- `server/src/routes/orders.js`
- `web/src/modules/chats/components/ChatContextPanel.jsx`
- `docs/backend/11-sprint/progress-log.md`
- `docs/backend/11-sprint/implementation-status.md`
- `specs/active/selaluteh-cart-order-lifecycle/spec.yaml`
- `docs/backend/09-ai-context/current-task.md`

### Tests
- `npm run test` (subset: `test/unit/orders/order-types.test.js` passes)
- `npm run build` from `web/` (successful compile)


## 2026-06-26 — Auto-Escalate Complaints (Core Alpha Slice)

### Completed
- **Schema (Task 2)**: `026_auto_escalate_complaints.sql` — 6 tables: `complaint_escalation_policies`, `outlet_complaint_escalation_overrides`, `complaint_escalations`, `complaint_escalation_responses`, `complaint_escalation_assignments`, `complaint_escalation_scheduled_jobs`. Partial unique index for one-active-escalation-per-complaint-outlet-level. Full RLS.
- **Constants (Task 1)**: All shared enums (statuses, trigger types, error codes, permissions, events) in `constants.js`.
- **Policy Repository (Tasks 3–4)**: Workspace default policy upsert + optimistic-concurrency update. Outlet override upsert/delete.
- **Escalation Repository (Tasks 9, 17, 18)**: `escalation.repository.js` — idempotent escalation create, findActive, listForSupervisor, updateStatus with version check. Response (append-only) and assignment repos included.
- **Scheduler Repository (Task 12)**: `escalation-scheduler.repository.js` — idempotent enqueue, claim-next-due, mark complete/skip/fail, stuck-job recovery.
- **Effective Policy Resolver (Task 5)**: DISABLED > CUSTOM > WORKSPACE_DEFAULT merge. Policy validator with trigger+SLA rules.
- **Outlet Resolver (Task 6)**: Deterministic 3-source chain (order → complaint field → conversation context). Text inference prohibited.
- **Trigger Matcher (Task 7)**: Pure logic. ANY/ALL. Priority, unassigned-timeout, SLA-threshold, manual triggers.
- **Supervisor Resolver (Task 8)**: Fallback chain (primary → other outlet supervisor → manager → workspace support → ATTENTION_ALERT). No hard-coded recipients.
- **Escalation Creation Service (Task 9)**: Full orchestrator. Chains all above. Idempotency key. Acknowledge/cancel/complete with OCC.
- **Evaluator (Task 11)**: `escalation-evaluator.service.js` — loads complaint, stale-event guard, delegates to creation service.
- **Scheduler Worker (Task 12)**: `workers/escalation-scheduler.worker.js` — 1-min poll, 10 jobs/workspace/cycle, crash recovery via stuck-job reset.
- **Response Service (Tasks 18–19)**: Internal supervisor responses. Never auto-sent to customer. Advances ACKNOWLEDGED → RESPONDED.
- **Audit Service (Task 28)**: Fail-safe wrapper around existing audit.service.js. Strips sensitive fields.
- **API Routes (Task 27)**: `complaint-escalation.routes.js` — settings CRUD, outlet overrides, manual escalation, supervisor ops, diagnostic preview.
- **index.js**: Routes and worker registered.
- **Unit Tests (Task 31)**: `trigger-matcher.test.js` (10 tests) + `effective-policy.test.js` (6 tests).

### Changed Files
- `server/src/db/migrations/026_auto_escalate_complaints.sql` (new)
- `server/src/services/auto-escalate-complaints/constants.js` (new)
- `server/src/services/auto-escalate-complaints/escalation-policy.repository.js` (new)
- `server/src/services/auto-escalate-complaints/escalation.repository.js` (new)
- `server/src/services/auto-escalate-complaints/escalation-scheduler.repository.js` (new)
- `server/src/services/auto-escalate-complaints/effective-policy.service.js` (new)
- `server/src/services/auto-escalate-complaints/outlet-resolver.service.js` (new)
- `server/src/services/auto-escalate-complaints/trigger-matcher.service.js` (new)
- `server/src/services/auto-escalate-complaints/supervisor-resolver.service.js` (new)
- `server/src/services/auto-escalate-complaints/escalation-creation.service.js` (new)
- `server/src/services/auto-escalate-complaints/escalation-evaluator.service.js` (new)
- `server/src/services/auto-escalate-complaints/escalation-response.service.js` (new)
- `server/src/services/auto-escalate-complaints/escalation-audit.service.js` (new)
- `server/src/workers/escalation-scheduler.worker.js` (new)
- `server/src/routes/complaint-escalation.routes.js` (new)
- `server/src/index.js` (imports + route registration + worker start)
- `server/test/unit/auto-escalate-complaints/trigger-matcher.test.js` (new)
- `server/test/unit/auto-escalate-complaints/effective-policy.test.js` (new)
- `docs/backend/09-ai-context/current-task.md` (updated)
- `docs/backend/11-sprint/implementation-status.md` (updated)

### Tests
- `node --test server/test/unit/auto-escalate-complaints/trigger-matcher.test.js` (10 tests)
- `node --test server/test/unit/auto-escalate-complaints/effective-policy.test.js` (6 tests)
- **REQUIRED before use**: run migration `026_auto_escalate_complaints.sql` in Supabase SQL editor

### Blockers / Risks
- Migration must be run in Supabase before any escalation API call.
- `user_outlet_access` table shape assumed — verify FK column name matches existing schema.
- `outlets.primary_supervisor_user_id` and `outlets.manager_user_id` columns assumed — may need migration extension.
- Scheduler worker is in-process (MVP); a crash before marking complete may replay the job (idempotent, safe).

### Next
- **Task 10**: Hook auto-evaluation into complaint creation and status-change events.
- **Task 13**: Supervisor SLA warning/breach job scheduling.
- **Task 14**: Push/Telegram notification when escalation is created.
- **Task 15**: Apply `after_escalation.complaintStatus` policy to complaint on escalation created.
- **Task 20**: Re-escalation when current escalation expires/fails.
- **Tasks 21–26**: Frontend supervisor inbox + settings pages.
- **Task 29**: Full integration tests with Supabase test project.

## 2026-06-26 — Schema Alignment &amp; Supabase Validation

### Completed
- Migrations **026, 027, 028** berhasil dijalankan di Supabase project `marketplace-chatbot-Project` (hxeljduldgynligjioff).
- Schema `user_outlet_access.membership_id` (NOT NULL, FK ke `user_workspace_memberships`) terverifikasi backfill sukses (0 missing).
- Schema `outlets.primary_supervisor_user_id` (nullable FK ke `users`) ditambahkan via migration 027.
- Schema `outlets.manager_user_id` terverifikasi sudah ada sebelumnya.
- Trigger `set_user_outlet_access_membership_id` di-hardening dengan `search_path=public` via migration 028.
- `supervisor-resolver.service.js` diperbarui memakai kolom aktual: `user_outlet_access.membership_id`, `outlets.primary_supervisor_user_id`, `outlets.manager_user_id`.
- Syntax check 14/14 file baru: **semua OK**.
- Unit tests: **21/21 pass**.

### Changed Files
- `server/src/db/migrations/027_align_escalation_membership_schema.sql` (added locally)
- `server/src/db/migrations/028_set_membership_trigger_search_path.sql` (added locally)
- `server/src/services/auto-escalate-complaints/supervisor-resolver.service.js` (schema-aligned rewrite)

### Tests
- `node --test` escalation unit tests: **21 pass, 0 fail**
- `node --check` 14 new files: **all OK**

### Next
- Hook auto-evaluation into complaint creation (Task 10)
- Notification integration (Task 14)
- Frontend supervisor inbox (Tasks 21–26)
- Integration tests against Supabase test project (Task 29)

## 2026-06-26 — Auto-Escalate Complaints (Notification + Frontend)

### Completed
- **Task 13/14 — Notification Service**: `escalation-notification.service.js` — Web Push + Telegram ke supervisor setelah eskalasi dibuat. Fail-safe (error di-log, tidak pernah throw). Resolusi Telegram chat_id via `contacts.telegram_chat_id` + fallback via email/phone lookup.
- **Task 13 — Notification Hook**: `escalation-creation.service.js` sekarang memanggil `notifyEscalationSupervisor()` secara fire-and-forget setelah eskalasi berhasil dibuat dan supervisor teridentifikasi.
- **Task 10 — Auto-Eval Hook (complaint created)**: `complaint.service.js` — `createComplaintFromAI` kini memanggil `evaluateComplaintForEscalation()` secara async setelah complaint dibuat.
- **Task 10 — Auto-Eval Hook (complaint updated)**: `routes/complaints.js` — `updateComplaint` kini memanggil evaluasi jika `priority` diubah ke HIGH/CRITICAL.
- **Task 10 — Auto-Eval Hook (manual create)**: `routes/complaints.js` — `POST /complaints` (dashboard) kini juga memanggil evaluasi setelah create.
- **Task 21 — Escalation Inbox Page**: `EscalationInboxPage.jsx` — supervisor queue, status/priority badges, acknowledge/complete/cancel, internal note panel, 30s auto-refresh, skeleton loading, empty state.
- **Task 22 — Escalation Settings Page**: `EscalationSettingsPage.jsx` — enable toggle, trigger rules (priorities, unassigned-timeout, SLA), supervisor SLA windows, recipient strategy, live validation, success/error feedback.
- **Task 23 — CSS**: `escalation.css` — premium card grid, badge system, skeleton shimmer, toggle, strategy cards, fully responsive.
- **Task 24 — API client**: `escalationApi.js` — full API client (settings, overrides, CRUD, responses, manual escalation, diagnostic preview).
- **Task 25 — Routes**: registered in `DashboardPage.jsx` (`/app/escalation-inbox`, `/app/escalation-settings`).
- **Task 26 — Navigation**: registered in `navigation.config.js` + `Sidebar.jsx` (icons: faBell, faSlidersH).
- **Build**: `npm run build` sukses — 1719 modules, 0 errors.
- **Unit tests**: 21/21 pass.
- **Syntax checks**: 14/14 server files OK.

### Changed Files (Frontend)
- `web/src/modules/complaints/api/escalationApi.js` (new)
- `web/src/modules/complaints/pages/EscalationInboxPage.jsx` (new)
- `web/src/modules/complaints/pages/EscalationSettingsPage.jsx` (new)
- `web/src/modules/complaints/styles/escalation.css` (new)
- `web/src/modules/dashboard/pages/DashboardPage.jsx` (imports + routes)
- `web/src/routes/navigation.config.js` (2 new nav items)
- `web/src/layouts/components/Sidebar.jsx` (icon map update)

### Changed Files (Backend)
- `server/src/services/auto-escalate-complaints/escalation-notification.service.js` (new)
- `server/src/services/auto-escalate-complaints/escalation-creation.service.js` (notification hook)
- `server/src/services/complaint.service.js` (auto-eval hook + bug fix: validateAndResolveComplaintLinks was not called)
- `server/src/routes/complaints.js` (auto-eval on create + priority change)

### Alur Lengkap yang Sudah Jalan
1. **Customer mengirim keluhan** via Telegram/WA/Web
2. **AI mendeteksi keluhan** (`shouldAutoCreateComplaintFromReply`) → `createComplaintFromAI()` → complaint tersimpan
3. **Auto-evaluasi berjalan** (`evaluateComplaintForEscalation`) — cek policy → match trigger → cari supervisor
4. **Eskalasi dibuat** (idempotent) → supervisor ditugaskan
5. **Supervisor dinotifikasi** — Web Push (browser) + Telegram DM
6. **Supervisor membuka `/app/escalation-inbox`** → acknowledge, tulis catatan, selesaikan
7. **Dashboard settings** di `/app/escalation-settings` untuk konfigurasi kebijakan workspace

### Tests
- `node --test` 21/21 escalation unit tests pass
- `npm run build` Vite build sukses (1719 modules)

### Next
- Task 15: Apply `after_escalation.complaintStatus` policy ke complaint setelah eskalasi dibuat
- Task 20: Re-escalation flow
- Task 29: Integration tests
- Task 30: Aksesibilitas + loading states

## 2026-06-26 — Test Suite Stabilisation and Spec Alignment

### Completed
- Fixed unit test `tool-gateway.test.js` to assert the correct 14 commerce tool definitions instead of the outdated 13 count.
- Refactored `order-service.integration.test.js` to use the non-deprecated `isValidOrderTransition` and `OrderStatus` models from `order-types.js`.
- Fixed `checkout-flow.test.js` database constraints by seeding platforms, contacts with `external_id`, and chats with `platform_id` and correct status enum values. Adjusted `carts` and `cart_items` inserts to match the active Postgres schemas and properties, and corrected status assertions from `'PENDING_PAYMENT'` to `'new'`.
- Moved `auto-escalate-complaints` spec to `specs/active/` to align its folder with its active status.
- Updated `current-task.md` status to `idle`.
- Ran spec synchronization checking and validation scripts successfully.

### Changed Files
- `server/test/unit/ai/tool-gateway.test.js`
- `server/test/integration/commerce/order-service.integration.test.js`
- `server/test/integration/checkout-flow.test.js`
- `docs/backend/09-ai-context/current-task.md`

### Tests
- `npm test` under `server/` passes successfully: 1239 pass, 0 fail.
- `npm run specs:check` passes successfully.

## 2026-06-27 — Telegram Multi-Tenant V1 Live E2E, SelaluKopi Backfill, and Outlet Location Canonicalization

### Completed
- Implemented and live-verified Telegram v1 multi-tenant routing using exact `channel_connections` instead of browser workspace or latest global Telegram platform fallback.
- Created and applied Telegram channel connection schema migration `030_channel_connections_telegram.sql` and upsert constraint migration `031_channel_connection_upsert_constraints.sql`.
- Added exact webhook route `POST /webhooks/telegram/v1/:connectionPublicId` with per-connection `secret_token` verification.
- Added async `telegram_webhook_events` worker, connection-scoped inbound processor, connection-bound outbound service, diagnostics route, and channel-connection webhook reconciliation.
- Disabled unsafe tokenless legacy `/webhook/telegram` fallback.
- Backfilled legacy Telegram platforms into canonical channel connections for:
  - `SelaluTeh Demo` → `selkoporder_bot` → `tgc_-TSDUlGLRQbDV6H1`.
  - `SelaluKopi Demo` → `Selkoporders_bot` → `tgc_GALPZnnV4XJuwFJj`.
- Registered both Telegram webhooks with v1 URLs and per-connection secret headers.
- Live-verified SelaluKopi Telegram messages `/start` and `Kmu siapa` are persisted and processed under `SelaluKopi Demo`, while prior SelaluTeh messages remain isolated under `SelaluTeh Demo` even with the same Telegram `chat.id`.
- Added incoming attachment handling, voice/audio transcription fallback, commerce callback handling, location handling, file mention outbound, reply markup, and checkout prompt injection in the v1 processor path.
- Fixed frontend AI Agent/platform issues by replacing `_id`-only option key/value with `id || _id` and replacing unauthenticated `/api/agents` fetch with shared authenticated Axios client.
- Created and applied migration `032_backfill_outlet_locations_from_metadata.sql` via Supabase MCP to promote `outlets.metadata.latitude`, `outlets.metadata.longitude`, and `outlets.metadata.googleMapsLink/googleMapsUrl` into canonical `outlet_locations` rows.
- Verified `SelaluKopi Demo` now has canonical `outlet_locations` for `SELKOP Samarinda` and `SELKOP Tenggarong` with `google_maps_uri` populated.
- Fixed nearest-outlet behavior for `jalan ahmad muksin tenggarong`; backend now returns `SELKOP Tenggarong` with `https://maps.app.goo.gl/NoPBo7ezXJDe3FUd6`.

### Changed Files
- `docs/backend/telegram-multi-tenant-webhook-architecture.md`
- `server/src/db/migrations/030_channel_connections_telegram.sql`
- `server/src/db/migrations/031_channel_connection_upsert_constraints.sql`
- `server/src/db/migrations/032_backfill_outlet_locations_from_metadata.sql`
- `server/src/controllers/telegram-webhook.controller.js`
- `server/src/routes/webhooks/telegram-v1.js`
- `server/src/routes/webhooks/telegram.js`
- `server/src/routes/channel-connections.js`
- `server/src/services/telegram/`
- `server/src/workers/telegram-webhook-events.worker.js`
- `server/src/workers/webhook-manager.worker.js`
- `server/src/db/repositories/channel-connections.supabase.repository.js`
- `server/src/db/repositories/telegram-webhook-events.supabase.repository.js`
- `server/src/db/repositories/outlet-channel-assignments.supabase.repository.js`
- `server/src/db/repositories/outlet-locations.supabase.repository.js`
- `server/src/services/location-intelligence/nearest-outlet-reply.service.js`
- `server/src/services/ai.service.js`
- `web/src/modules/dashboard/pages/DashboardPage.jsx`
- `web/src/modules/platforms/pages/PlatformsPage.jsx`

### Notes
- Telegram webhook tenant resolution is now URL-public-id + per-connection secret based. It does not rely on logged-in browser user, active browser workspace, latest platform, first enabled platform, or global default workspace.
- `outlet_locations` is the canonical table for location intelligence. `outlets.metadata` coordinate/maps values are promoted via migration/backfill and remain a compatibility fallback.
- Webhook registration can transiently fail when Telegram API fetch fails; already verified connections degrade instead of being made unusable for inbound processing.

### Tests
- Telegram + webhook/security regression: 42 pass, 0 fail.
- Location + Telegram targeted suite: 541 pass, 0 fail.
- Outlet location targeted suite: 14 pass, 0 fail.
- Live SelaluKopi Telegram E2E: `/start` and `Kmu siapa` processed with outbound AI reply.

### Next
- Send a fresh live message to `@Selkoporders_bot` with `jalan ahmad muksin tenggarong` after deployment/restart to confirm the new deterministic maps reply appears in Telegram.
- Add an explicit maintenance command if future metadata-to-`outlet_locations` promotion is needed outside migrations.

## 2026-06-27 — Connected Platforms UI/UX Redesign & Webhook Synchronization

### Completed
- **Workspace Context Header Interceptor**: Added Axios request interceptor to `httpClient.js` to dynamically append `x-workspace-id` header from session storage to all platform and agent requests.
- **Dynamic Workspace Switcher**: Refactored `Sidebar.jsx` to fetch real workspaces from backend and cleanly reload application context on workspace switch.
- **AI Agent Assignment Modal**: Created selection modal in `PlatformsPage.jsx` supporting workspace-bound agent selection or unassignment (saving changes directly to database). Added drawer callback integration in `PlatformDetailDrawer.jsx`.
- **Dynamic Platform Detail Labels**: Configured dynamic Page/Phone number ID and Access Token input labels in `PlatformDetailDrawer.jsx` based on Telegram vs Meta platform types.
- **Webhook Health Synchronization & Self-Healing**:
  - Implemented dynamic resolver in `platforms.supabase.repository.js` to cross-match `platforms.webhook_configured` status with linked `channel_connections.webhook_status` (and self-heal/update the `platforms` table in the background).
  - Updated `integrations.js` to mark `webhookConfigured = true` in the DB when Telegram setWebhook API succeeds.
  - Configured webhook event controllers (`meta.js` and `telegram.js`) to set `webhookConfigured = true` on first inbound webhook event.
- **Minimalist Table & Summary Redesign**: Restyled search bar, summary cards (Lucide icons, border shadow, translateY hover transitions), outline action buttons, and styled purple active agent badges in `PlatformsPage.jsx`.

### Changed Files
- `web/src/shared/api/httpClient.js`
- `web/src/layouts/components/Sidebar.jsx`
- `web/src/modules/platforms/pages/PlatformsPage.jsx`
- `web/src/modules/platforms/components/PlatformDetailDrawer.jsx`
- `server/src/db/repositories/platforms.supabase.repository.js`
- `server/src/routes/integrations.js`
- `server/src/routes/webhooks/meta.js`
- `server/src/routes/webhooks/telegram.js`
- `docs/backend/09-ai-context/current-task.md`
- `docs/backend/11-sprint/implementation-status.md`
- `docs/backend/11-sprint/progress-log.md`

### Tests
- Full server test suite: **1269 pass, 0 fail** (30 new tests pass).
- Web client compilation: Vite build compiled successfully.
- Spec synchronization: 13 specs validated successfully (`npm run specs:check`).

### Next
- Proceed with remaining MVP validation and dashboard integrations.
