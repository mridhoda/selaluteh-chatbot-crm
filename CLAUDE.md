# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

SelaluTeh Chatbot CRM: a multi-tenant CRM + AI chatbot + commerce backend. React/Vite frontend (`web/`) and an Express/Supabase (Postgres) backend (`server/`). Covers inbox/chat across channels (WhatsApp/Meta, Telegram), AI agents (OpenAI/Gemini), human agent takeover, orders, an online/QR storefront with cart+checkout, payments (Xendit, Duitku, DOKU, BayarGG, Midtrans), outlets/inventory, complaints, and analytics/billing.

**The data layer is Supabase/Postgres, not MongoDB.** The root `README.md` and some docs still describe a MongoDB stack — that's stale. All repositories live under `server/src/db/repositories/*.supabase.repository.js` (or `.repository.js` for a few) and the Mongoose/legacy path was fully removed. Trust `server/src/db/`, not the README, when in doubt.

## Commands

Install (three separate installs — no workspaces):
```bash
npm install                 # root (specs tooling only)
npm --prefix server install
npm --prefix web install
```

Run dev:
```bash
npm run dev          # web + server together (scripts/dev.js)
npm run dev:server   # server only
npm run dev:web      # web only
```

Build / lint / format (web):
```bash
npm --prefix web run build
npm --prefix web run lint
npm --prefix web run format
```

Server tests (Node's built-in `node --test`, not Jest/Vitest):
```bash
cd server
npm test                                   # everything under test/**
node --test "test/unit/routes/orders.test.js"      # single file
node --test --test-name-pattern="checkout"  test/integration/checkout-flow.test.js  # single test by name
npm run security:test                      # security + auth/middleware suite (also runs in CI)
```
Tests are organized by *type* under `server/test/`: `unit/`, `component/`, `integration/`, `security/`, `e2e/`, `property/`, `concurrency/`, `resilience/`, `performance/`, `evaluation/`, mirrored again per-feature for `ai/` and `location-intelligence/` (see the `test:ai:*` / `test:location:*` scripts in `server/package.json`). When adding tests for those two feature areas, match the existing type/feature nesting rather than dropping a file at the top level.

Web tests: `npm --prefix web test` (also `node --test`, under `web/test/`).

CI (`.github/workflows/`): `server-security.yml` runs `npm run security:audit` + `npm run security:test` on any `server/**` change. `specs-check.yml` runs `npm run specs:check` on any spec/docs change — it never mutates files or picks specs itself.

### Specs lifecycle system

This repo uses a requirements-first spec system under `specs/{backlog,active,completed}/<spec-id>/` (each with `spec.yaml`, `requirements.md`, `design.md`, `tasks.md`). Full detail in `README-SPECS-SYSTEM.md`; the entry point for any nontrivial backend change is `docs/backend/READING-ORDER.md`.

```bash
npm run specs:check        # validate only, CI-safe, no mutation
npm run specs:sync:dry     # preview folder moves / index rebuild
npm run specs:sync         # apply folder moves + rebuild SPECS-INDEX.md
```
Key rules: a spec's folder location is derived from `spec.yaml`'s `status` field (`backlog`/`active`/`completed`) — never move the folder by hand, run `specs:sync`. `docs/backend/09-ai-context/current-task.md` is the single pointer to whatever spec/task is "active" right now; read it before touching backend code, and update it (plus `tasks.md`) when you finish a task. Never pick a spec or task yourself, never silently reopen a completed spec, never mark a task done without tests + doc updates.

## Backend architecture (`server/src`)

Layering: `routes/*.js` → `middleware/*` → services (feature dirs like `orders/`, `payments/`, `outlets/`, `crm/`, `access-control/`, `ai/`) → `db/repositories/*.supabase.repository.js` → Supabase (Postgres via `@supabase/supabase-js`, service-role client from `db/supabase.js`).

- **Auth/authz chain** on protected routes: `authRequired` (verifies JWT, sets `req.user`) → `attachUser` (loads Supabase user row into `req.me`, UUID-keyed) → `attachWorkspaceContext` (resolves `req.workspace`, `req.allowedOutletIds`, permission matrix) → `authorizePermission(resource, action)` and/or `requireOutletAccess(...)` per-route. Multi-tenant scoping is workspace-based; almost every query needs `workspaceId` and outlet-scoping is enforced via `req.allowedOutletIds`, not left to the frontend.
- **Migrations** are numbered SQL files in `server/src/db/migrations/` (`NNN_description.sql`, sequential, currently up to ~050). There is no automated migration runner in this repo — migrations are reviewed and applied by hand/MCP against the target Supabase project (see history in `docs/backend/09-ai-context/current-task.md` for how prior migrations were validated against schema drift before applying). Always check actual Supabase schema state before assuming a migration file has been applied.
- **AI subsystem** (`server/src/ai/`) is its own layered pipeline: `inbound/` (channel message intake) → `orchestration/` (`orchestrator.js`, `agent-router.js`, `semantic-router.js`, `specialist-router.js`, `turn-state-machine.js`) → `tools/` (`tool-registry.js`, `tool-gateway.js`, `domain-tools.js`, `confirmation-service.js`, `idempotency-service.js`) → `commerce/`, `memory/`, `rag/`, `security/`. Model access goes through `models/` and `config/` (`OPENAI_*`/`GOOGLE_*` env vars), not direct SDK calls from feature code.
- **TATA-POS integration outbox** (`server/src/integrations/tata-pos/`, `server/src/db/migrations/049_integration_outbox.sql`/`050_integration_outbox_rls.sql`, 2026-08-22): pushes `online_store`-channel order lifecycle events (`order.paid`/`completed`/`refunded`/`voided`/`fulfillment_updated`) to TATA-POS's HMAC-signed `POST /api/v1/integrations/orders` (a separate repo/Supabase project — see TATA-POS's own `specs/backlog/modul-online-store-ingestion/`). `qr_store`-channel orders never sync (would double-book revenue against whatever already records dine-in transactions). Durable outbox pattern (`integration_outbox` table + `integration-outbox-dispatch.worker.js`, exponential backoff via `job-contract.js`'s `computeWorkerBackoffMs`, min 8 attempts before `dead`) — enqueue hooks live in `order.service.js`'s consolidated `markOrderPaidPreparing()` (order.paid, only on the transition that actually just made the order paid) and its single `notifyOrderUpdatedRealtime()` call site (fulfillment lifecycle, guarded on `paymentStatus === PAID` so an order cancelled before ever being paid never enqueues anything). Enqueue failures are caught/logged, never allowed to fail the underlying payment/order operation — delivery reliability is the outbox worker's job, not the hook's. Verified end-to-end against a local TATA-POS backend (dummy order genuinely landed in TATA-POS's `sales_orders`); production TATA-POS server needed an explicit `npm run build` (not just `git pull` + `pm2 restart`) before the receiving endpoint actually appeared — a NestJS/`dist/`-build deploy gotcha worth remembering if TATA-POS-side changes ever seem to "not take effect" after a restart.
- **Reverse bridge: TATA-POS action buttons** (`server/src/routes/integrations-inbound.js`, `server/src/middleware/tataPosInboundAuth.js`, mounted at `/api/v1/integrations/tata-pos`, 2026-08-22): the *other* direction from the outbox above — TATA-POS-Android's cashier-app kitchen board (Accept/Ready/Complete buttons) proxies through TATA-POS's own backend into this router, which calls the *existing* `approveOrder`/`startPreparing`/`markReady`/`completeOrder` in `order.service.js` (no new business logic). Auth is a **single static shared secret** (`TATA_POS_INBOUND_HMAC_SECRET`, must match TATA-POS's `ONLINE_STORE_INBOUND_HMAC_SECRET` exactly) — deliberately not the per-outlet `integration_keys` scheme the outbound direction uses, since there's exactly one caller here. `/orders/:orderId/accept` auto-chains into `startPreparing` in the same call — nothing in the current web Kitchen Tablet UI ever reaches the `accepted → preparing` transition on its own (confirmed via a full-repo grep for calls to `/prepare` — none found), and `markReady` requires `preparing`, not `accepted`, so without this chain the "ready" button would fail for any order accepted through this bridge. Verified with real signed HTTP requests (`ready`/`complete` both transitioned a real order correctly; an invalid signature was correctly rejected with `401`) — this is the one side of the two-repo bridge that's actually been exercised live so far, not just type-checked.
- **Payments** are provider-adapted: `server/src/integrations/payments/*-client.js` (xendit, duitku, doku, bayargg, midtrans) implement a shared shape declared in `payment-provider.types.js`, selected via `payment-adapter-registry.js`. `PAYMENT_PROVIDER` env var picks the active provider; provider-specific env vars are prefixed accordingly (`XENDIT_*`, etc). Webhook handlers live under `routes/webhooks/`.
- **Channels**: WhatsApp/Meta and Telegram integrations live under `server/src/integrations/meta/` and `server/src/integrations/telegram/`; long-running side effects (webhook reconciliation, cart expiry, payment reconciliation, QR session expiry, escalation scheduling) run as workers registered at the bottom of `server/src/index.js`, not as separate processes.
- Config is centralized and validated in `server/src/config/env.js` — required (`critical`) vs `optional` env vars fail fast at boot if missing; add new env vars there rather than reading `process.env` ad hoc in feature code.

## Frontend architecture (`web/src`)

- `app/App.jsx` is the authenticated CRM shell; `app/PublicStoreApp.jsx` is the separate public storefront entry (QR/online store, no auth). Routing config: `routes/privateRoutes.jsx` (CRM) and `routes/publicRoutes.jsx` (storefront), with `routes/navigation.config.js` driving sidebar/nav.
- Feature code is organized by domain under `web/src/modules/<domain>/` (e.g. `orders`, `payments`, `products`, `chats`, `outlets`, `access-control`), each following the same internal shape: `api/` (HTTP calls), `components/`, `hooks/`, `models/` (client-side shaping/validation), `pages/`, sometimes `utils/`. Follow this shape when adding a new module rather than inventing a new layout. `web/src/features/public-store/` holds the storefront-specific (non-CRM) equivalent.
- All backend calls go through `web/src/shared/api/httpClient.js` (Axios wrapper) + `apiError.js` (error normalization) — don't call `axios` directly from a module's `api/` file.
- Global state is in `web/src/stores/` (`authStore`, `workspaceStore`, `outletStore`, `uiStore`) — check these before adding new global state or re-fetching data already held there.
- Dev server proxies API paths (`/auth`, `/orders`, `/payments`, etc. — see `web/vite.config.js`) to `VITE_DEV_API_PROXY_TARGET` (defaults to `http://127.0.0.1:5000`). If you add a new top-level backend route prefix, add it to the proxy list too or dev-mode requests will 404.

## Environment

Backend env template is documented in `README.md`'s "Isi minimal `server/.env`" section (Supabase URL/service-role key/DB URL, `JWT_SECRET`, `CORS_ORIGIN`, SMTP, `OPENAI_API_KEY`/`GOOGLE_API_KEY`, plus per-provider payment keys referenced in `server/src/config/env.js`). Frontend: `web/.env` from `web/.env.example`, mainly `VITE_API_BASE`.
