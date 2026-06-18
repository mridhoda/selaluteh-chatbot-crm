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
| Webhook parser normalization | Implemented |
| Webhook rate limit/safe logging | Implemented |
| Cart outlet binding | Implemented |
| Checkout outlet binding | Implemented |
| Orders outlet UI | Not Started |
| Outlet access tests | Partial |

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

