# Backend Testing Docs

Dokumen ini adalah pusat testing plan untuk backend **SelaluTeh Chatbot CRM / Telegram-first Marketplace MVP**.

## Context

SelaluTeh Chatbot CRM backend is moving toward a Telegram-first Marketplace MVP. The system includes Express backend, React/Vite admin UI, Telegram/Meta webhooks, AI agents, human takeover, Supabase/Postgres target data layer, local file storage, product catalog, cart, checkout, orders, payments, complaints, and background jobs.

## Folder Scope

Folder `10-testing` berisi strategi, test plan, checklist, acceptance cases, test data, dan evaluasi QA untuk memastikan fitur existing CRM tetap aman saat backend berkembang menjadi marketplace berbasis Telegram.

## Documents

| File | Purpose |
|---|---|
| `test-strategy.md` | Strategi testing keseluruhan |
| `unit-test-plan.md` | Unit test services, validators, repositories |
| `integration-test-plan.md` | Integration test API, DB, provider adapter |
| `e2e-test-plan.md` | End-to-end user/admin journey |
| `acceptance-test-cases.md` | Acceptance criteria per core feature |
| `regression-checklist.md` | Checklist sebelum release |
| `ci-test-pipeline.md` | CI pipeline dan quality gates |
| `tdd-rules.md` | Aturan TDD/prioritas test |
| `test-data.md` | Data fixture dan seed testing |
| `qa-process.md` | Proses QA manual dan automated |
| `webhook-test-plan.md` | Test Telegram/Meta/payment webhook |
| `payment-test-plan.md` | Test payment gateway sandbox |
| `telegram-commerce-test-plan.md` | Test commerce flow di Telegram |
| `security-test-plan.md` | Test keamanan penting |
| `migration-test-plan.md` | Test migrasi MongoDB ke Supabase/Postgres |
| `local-storage-test-plan.md` | Test local file storage/media |

## Testing Principles

1. Existing CRM behavior must not break.
2. Webhook processing must be idempotent.
3. Marketplace order/payment state must be deterministic.
4. AI can assist, but backend must validate every critical action.
5. Workspace isolation must be tested at API and database levels.
6. Payment success must only come from verified provider webhook or trusted sandbox callback.
7. Local media files must not be lost across migration/deployment.

## Minimum Release Gate

A build is not releasable unless these pass:

- Auth smoke tests.
- Telegram webhook smoke tests.
- Chat/inbox smoke tests.
- Product/cart/checkout/order/payment happy path.
- Payment webhook verification/idempotency tests.
- Workspace isolation tests.
- Regression checklist.
