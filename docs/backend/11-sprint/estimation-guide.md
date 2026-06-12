# Estimation Guide

Dokumen ini membantu mengestimasi ukuran task.

## Size Scale

| Size | Meaning | Typical Effort |
|---|---|---|
| XS | Small config/doc/simple route change | < 0.5 day |
| S | Simple endpoint/model/helper | 0.5–1 day |
| M | Feature slice with route/service/model | 1–2 days |
| L | Multi-file domain feature | 2–4 days |
| XL | Cross-cutting refactor/integration | 4+ days |

## Examples

### XS

- Mount missing route.
- Fix env variable naming.
- Add README note.
- Add one index.

### S

- Add auth middleware to one route group.
- Add simple model.
- Add simple service method.
- Add basic validation.

### M

- Product CRUD API.
- Cart service.
- Telegram inline keyboard helper.
- Webhook idempotency for one platform.

### L

- Checkout flow.
- Payment sandbox integration.
- Migration import script.
- Admin product management UI/API.

### XL

- Full Mongo → Supabase repository swap.
- Payment provider abstraction + webhook + admin UI.
- Full Telegram commerce flow end-to-end.

## Complexity Multipliers

Increase estimate if task includes:

- Payment handling.
- Security-sensitive behavior.
- Cross-workspace data access.
- Webhook idempotency.
- AI side effects.
- Migration/backfill.
- Backward compatibility with existing CRM.

## Risk Labels

| Label | Meaning |
|---|---|
| LOW | Safe, isolated change |
| MEDIUM | Multiple files or behavior change |
| HIGH | Security/payment/data integrity impact |
| CRITICAL | Can cause data loss, payment spoof, or production outage |

## Suggested Sprint Capacity

For early MVP sprint, avoid more than:

```txt
1 XL task
or
2 L tasks
or
4 M tasks
plus small fixes
```

Keep sprint demoable.
