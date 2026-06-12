# Sprint 1 — Webhook Idempotency & Service Boundary

## Objective

Make webhook processing safer and prepare backend for payments/commerce.

## Scope

- Webhook event log.
- Duplicate prevention.
- Service layer extraction.
- AI side effect guardrails.

## Tasks

- [ ] Add webhook event persistence.
- [ ] Telegram duplicate detection by platform message id/update id.
- [ ] Meta duplicate detection where possible.
- [ ] Payment webhook idempotency placeholder.
- [ ] Extract chat message write flow.
- [ ] Extract order creation flow.
- [ ] Extract complaint creation flow.
- [ ] Add AI action logging design.

## Acceptance Criteria

- Duplicate Telegram event is ignored.
- Service functions receive `workspace_id`.
- Order/complaint creation cannot occur without workspace validation.
