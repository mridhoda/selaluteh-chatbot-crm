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
- **Migrations** are numbered SQL files in `server/src/db/migrations/` (`NNN_description.sql`, sequential, currently up to ~048). There is no automated migration runner in this repo — migrations are reviewed and applied by hand/MCP against the target Supabase project (see history in `docs/backend/09-ai-context/current-task.md` for how prior migrations were validated against schema drift before applying). Always check actual Supabase schema state before assuming a migration file has been applied.
- **AI subsystem** (`server/src/ai/`) is its own layered pipeline: `inbound/` (channel message intake) → `orchestration/` (`orchestrator.js`, `agent-router.js`, `semantic-router.js`, `specialist-router.js`, `turn-state-machine.js`) → `tools/` (`tool-registry.js`, `tool-gateway.js`, `domain-tools.js`, `confirmation-service.js`, `idempotency-service.js`) → `commerce/`, `memory/`, `rag/`, `security/`. Model access goes through `models/` and `config/` (`OPENAI_*`/`GOOGLE_*` env vars), not direct SDK calls from feature code.
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
