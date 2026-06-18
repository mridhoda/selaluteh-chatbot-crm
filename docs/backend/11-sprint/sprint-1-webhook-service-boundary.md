# Sprint 1 — Webhook Idempotency & Service Boundary

## Objective

Make webhook processing safer and prepare backend for payments/commerce.

## Scope

- Webhook event log.
- Duplicate prevention.
- Service layer extraction.
- AI side effect guardrails.

## Tasks

- [x] Add webhook event persistence.
- [x] Telegram duplicate detection by platform message id/update id.
- [x] Meta duplicate detection where possible.
- [x] Payment webhook idempotency placeholder.
- [x] Extract chat message write flow.
- [x] Extract order creation flow.
- [x] Extract complaint creation flow.
- [x] Add AI action logging design.

## Acceptance Criteria

- Duplicate Telegram event is ignored.
- Service functions receive `workspace_id`.
- Order/complaint creation cannot occur without workspace validation.

## Implemented Notes

- Webhook idempotency is implemented by `WebhookEvent` and `webhook-idempotency.service.js`.
- AI action guardrails are implemented by `AIAction` and `ai-actions.service.js`.
- Legacy AI order/complaint creation is audited before execution.
- Restricted AI actions such as payment/order state overrides are rejected.
- Automated tests cover webhook idempotency, workspace/outlet isolation, and AI action validation.
