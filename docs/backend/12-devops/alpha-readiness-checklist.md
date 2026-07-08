# Alpha Readiness Checklist

Updated: 2026-07-07

Scope: SELKOP Online Store and QR Store backend Phase 4 closure. This checklist records implementation readiness, Supabase MCP validation, approved deferrals, and validation blocked by local command policy. It does not claim local automated tests pass in this session.

## Current Status

| Area | Status | Evidence |
|---|---|---|
| Supabase target | Ready for alpha data checks | MCP confirmed `marketplace-chatbot-Project` (`hxel...ioff` redacted), `ACTIVE_HEALTHY`, `ap-southeast-1`, Postgres 17. |
| Migration `042` | Applied and verified | `online_qr_store_target_reconciliation` applied through Supabase MCP; required tables, indexes, and `NOT VALID` constraints verified. |
| Migration `043` | Verified present | `universal_qr_scope` present in target ledger/schema; nullable Universal QR target and selected/locked QR session context verified. |
| Migration `044` | Applied and verified | `public_checkout_idempotency_state` applied through Supabase MCP; status/error columns, check constraint, status index, and public checkout uniqueness verified. |
| SELKOP storefront seed | Ready | Slug `selkop`, active storefront, two active/visible/orderable pickup outlet mappings. |
| SELKOP outlet readiness | Ready | Requested Samarinda and Tenggarong outlets active, `OPEN`, `accepts_orders=true`, `pickup_enabled=true`. |
| Product availability seed | Ready | Active product availability seeded for active SELKOP products at both requested outlets. |
| QR seed | Ready | Outlet/location/table QR rows and one true Universal QR row seeded with random hashed token storage; raw tokens not printed. |
| Public storefront/menu implementation | Implementation-covered, validation blocked | Customer-safe menu, active/orderable outlet filtering, backend-owned modifier price deltas, and selected-outlet validation implemented in prior waves; local commands blocked. |
| Public checkout/idempotency | Implementation-covered, MCP migration verified, validation blocked | Checkout requires idempotency/customer identity and migration `044` supports processing/completed/failed states; local retry/concurrency validation blocked. |
| Admin fulfillment | Implementation-covered, validation blocked | Paid-only fulfillment, outlet scope enforcement, cancel reason, hard-delete block, and allowed-actions capability/permission guard implemented; command validation blocked. |
| Audit/security events | Implementation-covered, validation blocked | Audit redaction, payment/settings audit events, and security event writes implemented; no admin security-event browsing UI included. |
| Rate limiting | Alpha ready only | Public route rate limits enabled, but in-memory and single-instance only. Use edge/WAF before production or multi-instance deployment. |
| Background workers | Alpha ready only | Payment expiry/reconciliation and QR cleanup run as in-process MVP timers; no durable queue or distributed lock. |
| Regression protection | Coverage inventoried, validation blocked | Existing WhatsApp/AI/cart/order/payment/admin/webhook guardrail files are listed in `specs/backlog/qr-store-backend/tasks.md` section 11. |
| BayarGG live payment readiness | Approved deferral / No-Go for paid alpha | Provider catalog exists, but there are zero real SELKOP BayarGG provider settings rows, active settings rows, or credential references. |

## Go Conditions For Non-Payment Alpha Dry Run

- Supabase target remains the verified project and no destructive migration drift is introduced.
- `selkop` storefront remains active with both requested outlets active, visible, orderable, and pickup-enabled.
- Universal QR and outlet/location/table QR rows remain active with hashed token storage.
- Public APIs return customer-safe data only: no raw provider payloads, secrets, internal IDs where not intended, audit internals, COGS, or unmasked phone numbers.
- Operators understand that command-based validation was blocked in this documentation pass and must be rerun before broader release.

## No-Go Conditions

- Do not claim local automated tests pass from this session; command execution was blocked.
- Do not claim BayarGG sandbox, real paid-alpha, or live payment readiness until an authorized operator configures real encrypted/referenced SELKOP BayarGG credentials and session/webhook validation passes.
- Do not run production or multi-instance alpha with only in-memory public route rate limiting and in-process workers unless the deployment is explicitly single-instance and accepted as alpha-only.
- Do not expose raw QR tokens, BayarGG credentials, webhook secrets, service-role keys, or raw provider payloads in frontend/docs/logs.
- Do not ignore Supabase advisor output before production; broad pre-existing RLS/function warnings remain hardening items.
- Do not mark admin security-event observability complete; write-side events exist, but browsing UI/API is not included.

## Required Validation When Commands Are Available

```txt
npm run specs:check
NODE_ENV=test node --test "test/unit/migrations/phase3-online-qr-store-schema.test.js"
NODE_ENV=test node --test "test/unit/services/public-storefront.service.test.js" "test/unit/services/qr-order-session.service.test.js"
NODE_ENV=test node --test "test/security/orders/cart-order-security.test.js" "test/security/payments/payment-security.test.js"
NODE_ENV=test node --test "test/e2e/ai/button-commerce-regression.test.js" "test/e2e/telegram-webhook-v1.e2e.test.js" "test/e2e/telegram-marketplace.e2e.test.js"
NODE_ENV=test node --test "test/integration/webhooks/webhook-idempotency.integration.test.js" "test/security/webhook-abuse.test.js"
NODE_ENV=test node --test "test/integration/payments/payment-session-bayargg.integration.test.js" "test/integration/payments/payment-webhook.integration.test.js" "test/integration/payments/payment-attempt.integration.test.js"
NODE_ENV=test node --test "test/unit/services/payment-expiry.service.test.js" "test/unit/services/payment-reconciliation.unit.test.js" "test/unit/workers/qr-session-expiry.worker.test.js"
```

## BayarGG Deferral Exit Criteria

- Authorized operator creates a real SELKOP BayarGG provider settings row using encrypted credentials or an approved secret reference.
- Exactly one active provider setting exists for the intended workspace/mode.
- Sandbox session creation succeeds using backend-owned amount/currency/reference.
- Valid webhook signature is verified before any payment/order mutation.
- Duplicate webhook is a safe no-op.
- Amount, currency, expiry, provider transaction, and merchant reference mismatch paths do not fulfill and enter safe error/manual-review handling where applicable.
- Documentation and task `2.4` are updated with credential/reference evidence without printing secrets.

## Rollback Notes

- Migrations `042`, `043`, and `044` are additive/guarded for the target and documented in `specs/backlog/qr-store-backend/database-readiness.md`.
- Runtime retains metadata/legacy fallbacks for older storefront and QR behavior where applicable.
- Disable public checkout with `MARKETPLACE_CHECKOUT_ENABLED=false` if needed.
- Disable payment webhook processing with `PAYMENT_WEBHOOK_PROCESSING_ENABLED=false` if needed; retain raw events for replay/reconciliation.
- Revoke individual QR rows or set storefront/outlet mapping ordering flags off instead of deleting operational history.
