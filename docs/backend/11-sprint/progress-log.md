# Progress Log

Use this file to record chronological progress.

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
