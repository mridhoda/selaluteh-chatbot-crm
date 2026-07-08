Goal :
Complete SELKOP Phase 4 brownfield backend adaptation from specs/backlog/qr-store-backend by working through tasks.md in order, with all P0 tasks completed, P1 tasks completed or explicitly documented as approved deferrals, and no P0 No-Go condition remaining. Before coding, audit existing docs, frontend routes, backend routes, services, repositories, migrations, tests, and existing WhatsApp/AI marketplace flows. Do not rewrite existing working modules; reuse, extend, refactor, or rebuild only after documenting evidence. Preserve existing WhatsApp/AI marketplace, admin dashboard, kitchen board, product/catalog, cart, order, payment, and webhook behavior. Implement only safe additive migrations unless explicitly justified. Enforce backend authority for price, availability, checkout total, payment status, fulfillment status, QR outlet/location, admin permissions, audit, and webhook validity. Payment may become paid only through verified provider webhook or valid reconciliation. Public checkout must be idempotent and server-authoritative. QR Store must support universal, outlet, and location/table QR with server-side validation. Admin fulfillment must require payment_status=paid and use explicit actions/allowed_actions. Add or update tests for every changed behavior. Update requirements/design/tasks/status/progress docs after major changes. Prove completion in the transcript by showing: audit summary, capability/gap map, changed files, migrations/seed plan, tests added/updated, command outputs for npm run specs and all targeted unit/security/integration/regression tests, No-Go checklist result, known limitations, rollback notes, and final implementation report. Stop after 30 turns or when blocked by missing credentials/environment/access, and if blocked, produce a precise blocker report instead of guessing or hiding gaps.

Continue SELKOP Phase 4 brownfield backend adaptation safely.

Current source of truth:

specs/backlog/qr-store-backend/spec.yaml
specs/backlog/qr-store-backend/requirements.md
specs/backlog/qr-store-backend/design.md
specs/backlog/qr-store-backend/tasks.md
docs/backend/09-ai-context/current-task.md
docs/backend/11-sprint/implementation-status.md
docs/backend/11-sprint/progress-log.md

Loop rules:

First inspect the current git diff, task status, latest test output, current-task pointer, implementation-status, and progress-log.
Continue only the next unfinished Phase 4 task in order.
Do not start a new area if the previous checkpoint is incomplete.
Do not mark a task complete unless implementation, validation, tests, and docs are done.
If a task says audit first, perform and document the audit before changing runtime code.
Do not rewrite working existing modules. Reuse existing services/repositories/routes when safe.
Do not create duplicate business logic for cart, order, checkout, payment, QR, admin lifecycle, or audit.
Keep route handlers thin. Put business rules in service/use-case layer and database access in repositories.
Preserve existing WhatsApp/AI marketplace, admin dashboard, kitchen board, product/catalog, cart/order/payment, and existing webhook flows.
Use additive migrations unless destructive migration is explicitly approved.
Never trust frontend/client input for price, total, payment paid, fulfillment status, admin permission, QR locked outlet, or QR locked location.
Payment may become paid only through verified provider webhook or valid server-side reconciliation.
Public checkout must require idempotency and must not create duplicate order/payment under retry or double-click.
QR universal/outlet/location rules must be validated server-side at checkout, not only at scan.
Admin order actions must be explicit and paid-only for fulfillment.
Workers must call service-layer state machines and must not mutate database status directly.
Redact secrets, raw provider auth headers, full phone numbers, raw unsafe provider payloads, and plaintext public tokens from logs/docs.
For every code change, add or update the smallest relevant tests.
Run the narrowest relevant tests first, then broader validation at checkpoints.
After each iteration, update docs/status/progress honestly with completed work, evidence, tests run, failures, blockers, known limitations, and next task.

Loop :
Preferred iteration flow:
A. Read current status and identify one next task.
B. Audit relevant existing code/docs/schema/tests.
C. Produce a mini implementation plan.
D. Make minimal safe changes.
E. Run targeted tests.
F. Fix failures without broad rewrites.
G. Update task/docs/status/progress.
H. Print a concise iteration report:

task handled
files inspected
files changed
tests run and result
remaining risk
next recommended task

Stop the loop if:

all P0 tasks are complete and P1 deferrals are documented;
npm run specs passes;
targeted tests pass;
No-Go checklist is clear;
final report is produced;
or work is blocked by missing credentials, unavailable Supabase environment, missing provider sandbox data, ambiguous spec authority, or unsafe migration risk.

If blocked, do not guess. Produce a blocker report with exact missing input, affected task, safe fallback, and next manual action.