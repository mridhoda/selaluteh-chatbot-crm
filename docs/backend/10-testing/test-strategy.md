# Test Strategy

## Goal

Memastikan backend aman, predictable, dan tidak merusak behavior existing saat ditambah marketplace Telegram.

## Test Pyramid

```txt
Few      E2E tests: full Telegram commerce/payment/admin journeys
Some     Integration tests: API + DB + provider adapter + webhook
Many     Unit tests: services, validators, mappers, repositories
Always   Static checks: lint, type checks, schema checks, migration checks
```

## Test Layers

| Layer | Scope | Examples |
|---|---|---|
| Unit | Pure logic and service rules | cart total, order status transition, signature validation |
| Integration | API + DB + mocked external provider | create checkout, payment webhook update |
| Webhook | Telegram/Meta/payment inbound payloads | duplicate update, unknown platform, invalid signature |
| E2E | Realistic user/admin journey | Telegram browse → cart → payment link → paid notification |
| Security | Auth, workspace isolation, abuse | cross-workspace access blocked |
| Migration | Mongo → Postgres data equivalence | counts, references, timestamps |
| Manual QA | UX and provider sandbox | Telegram bot button experience |

## Priority Order

1. Auth and workspace isolation.
2. Webhook idempotency.
3. Product/cart/checkout/order/payment flow.
4. Human takeover and AI skip.
5. AI action validation.
6. File storage and media references.
7. Migration correctness.
8. Performance and observability.

## Test Environments

| Environment | Purpose |
|---|---|
| Local | Developer fast feedback |
| Staging | Supabase/Postgres + sandbox providers |
| Production | Smoke only, no destructive tests |

## External Services Strategy

| Service | Test Strategy |
|---|---|
| Telegram | Mock webhook payloads for automated tests; real sandbox bot for manual QA |
| Meta WhatsApp/Instagram | Mock webhook payloads first; real test pages/accounts later |
| Payment Gateway | Sandbox environment and signed webhook fixtures |
| AI Provider | Mock by default; controlled live tests for quality gates only |
| Local Storage | Temp upload root during tests |

## Non-Negotiable Invariants

- Every tenant-owned row has `workspace_id`.
- Every API route that reads tenant data validates workspace ownership.
- Duplicate webhook payloads do not duplicate messages, orders, or payments.
- `takeover_by != null` means AI must not auto-reply.
- Payment status cannot be changed by AI text alone.
- Order `paid` status requires a valid payment provider event.
