---
schema_version: 1
document_type: implementation-plan
spec_id: selaluteh-payments-xendit
title: SelaluTeh Payments — Xendit Tasks
status: active
workflow_state: in_progress
version: 1.0.0
updated_at: 2026-06-22
development_method: test-driven-development
---

# Implementation Plan: SelaluTeh Payments — Xendit

## Overview

Implementasi ini mencakup target penuh, bukan hanya alpha.

Metode wajib:

```text
RED
→ GREEN
→ REFACTOR
→ VERIFY
```

External contracts:

```text
selaluteh-backend-marketplace
selaluteh-workspace-access-control
selaluteh-outlet-management-operations
selaluteh-product-catalog
selaluteh-cart-order-lifecycle
selaluteh-channel-connections-sync
selaluteh-ai-agent-architecture
selaluteh-ai-agent-scope-security
selaluteh-notification-attention-engine
selaluteh-audit-activity-timeline
selaluteh-analytics-read-models
```

---

# Global Completion Rules

A task is complete only when:

- [ ] failing test is written first;
- [x] failure is observed;
- [x] minimal implementation passes;
- [x] refactor is complete;
- [x] provider contract is verified;
- [x] workspace/outlet isolation passes;
- [x] amount authority passes;
- [x] webhook verification/idempotency passes;
- [x] PAID invariant passes;
- [ ] no live key or real money is used in automated tests;
- [x] docs and implementation status are updated;
- [x] `npm run specs:check` passes.

---

# 0. Spec Preflight and Repository Audit

## 0.1 Confirm authority

- [x] Confirm ID `selaluteh-payments-xendit`.
- [x] Confirm prefix `PAY-R`.
- [x] Confirm Xendit only.
- [x] Confirm no COD/manual transfer/Midtrans active path.
- [x] Confirm Order owns amount and lifecycle.
- [x] Confirm outlet approval differs from payment success.
- [x] Run `npm run specs:check`.

## 0.2 Revalidate official Xendit contract

- [x] Record verification date.
- [x] Record request/response/webhook schemas.
- [x] Record Test Mode account capability.
- [x] Record webhook setup method.
- [x] Do not implement from memory alone.

## 0.3 Audit repository

- [x] Record current files.
- [x] Identify duplicate truth sources.
- [x] Identify client-supplied amount.
- [x] Identify unverified webhook flow.
- [x] Identify test/live secret mixing.

## 0.4 Deterministic test harness

- [x] Workspace/outlet/order fixtures.
- [x] Xendit fake adapter/server.
- [x] Raw webhook builder.
- [x] Callback-token fixture.
- [x] Fixed clock.
- [x] Idempotency helper.
- [x] Queue/outbox spies.
- [x] Notification spy.
- [x] Order transition spy.
- [x] Secret redaction assertions.

## 0.5 Test scripts

```text
test:payments:unit
test:payments:component
test:payments:integration
test:payments:security
test:payments:property
test:payments:concurrency
test:payments:resilience
test:payments:performance
test:payments:all
```

## 0.6 Release blockers

```text
unverified webhook marks PAID
client/AI/outlet/admin marks PAID
amount mismatch marks PAID
duplicate webhook advances Order twice
cross-outlet payment visible
TEST/LIVE mixed
secret leaks
redirect marks PAID
paid event is permanently lost before Order transition
```

---

# 1. Shared Types, Statuses, and Permissions

## 1.1 Enums

- [x] Provider.
- [x] Provider mode.
- [x] Environment.
- [x] Payment status.
- [x] Session status.
- [x] Attempt status.
- [x] Webhook processing status.
- [x] Refund status.
- [x] Review reason.

## 1.2 Domain types

- [x] Payment.
- [x] PaymentSession.
- [x] PaymentAttempt.
- [x] PaymentWebhookEvent.
- [x] PaymentRefund.
- [x] ReconciliationRun.
- [x] NormalizedProviderEvent.
- [x] Capability response.

## 1.3 Permissions

- [x] payments.read.
- [x] payments.create_link.
- [x] payments.resend_link.
- [x] payments.regenerate_link.
- [x] payments.reconcile.
- [x] payments.cancel.
- [x] payments.refund_request.
- [x] payments.refund_execute.
- [x] payments.read_webhook_diagnostics.
- [x] payments.manage_connection.
- [x] payments.export.

## 1.4 Tests

- [x] Unknown status rejected.
- [x] Unknown provider rejected.
- [x] Unknown permission denied.
- [x] Stable serialization.
- [x] Safe error mapping.

---

# 2. Supabase Schema and Migrations

## 2.1 Provider connection

- [x] Create `payment_provider_connections`.
- [x] Workspace/environment uniqueness.
- [x] Secret references only.
- [x] Adapter mode.
- [x] Contract version.
- [x] Health fields.

## 2.2 Core tables

- [x] `payments`.
- [x] `payment_sessions`.
- [x] `payment_attempts`.
- [x] Optional `payment_events`.
- [x] Constraints/indexes/versioning.

## 2.3 Webhook and reconciliation

- [x] `payment_webhook_events`.
- [x] Unique event key.
- [x] Sanitized payload.
- [x] Processing/retry fields.
- [x] `payment_reconciliation_runs`.

## 2.4 Refund

- [x] `payment_refunds`.
- [x] Provider reference uniqueness.
- [x] Amount constraints.
- [x] Status/version.

## 2.5 RLS and repository security

- [x] Workspace policies.
- [x] Outlet-scoped reads.
- [x] Webhook service path.
- [x] Service role server-only.
- [x] RLS tests.

---

# 3. Secret and Environment Configuration

## 3.1 Secret references

- [x] Test secret key.
- [x] Test callback token.
- [ ] Live secret placeholder.
- [ ] Live callback placeholder.
- [x] Return URLs.
- [x] Default expiry.
- [x] Adapter mode.

## 3.2 Configuration loader

- [x] Strict schema.
- [x] Redaction.
- [x] No LIVE→TEST fallback.
- [x] Startup validation.
- [x] Workspace connection resolution.

## 3.3 Diagnostics

- [x] Configuration present.
- [x] Environment label.
- [x] Last webhook.
- [x] Safe health check.
- [x] No secret display.

## 3.4 Security tests

- [x] Secrets absent from response/log.
- [ ] Live keys blocked in tests.
- [x] Missing configuration fails closed.
- [x] Cross-workspace connection denied.

---

# 4. Xendit Provider Adapter

## 4.1 Interface

- [x] Create hosted session.
- [x] Get session.
- [x] Get payment.
- [x] Cancel pending.
- [x] Create refund.
- [x] Verify webhook.
- [x] Normalize webhook.

## 4.2 HTTP client

- [x] Server authentication.
- [x] Timeout.
- [x] Safe retries.
- [x] Correlation.
- [x] Redacted logging.
- [x] Response schema validation.

## 4.3 Contract versioning

- [x] Record version.
- [x] Versioned request/response.
- [x] Contract tests.
- [x] Unknown-field tolerance.
- [x] Required-field failure.

## 4.4 Adapter tests

- [x] Success.
- [x] Validation error.
- [x] Authentication error.
- [x] Timeout.
- [x] 5xx.
- [x] Invalid response.
- [x] Redaction.

---

# 5. Payment Session Creation

## 5.1 Request mapper

Fixed alpha fields:

```text
session_type PAY
mode PAYMENT_LINK
country ID
currency IDR
capture_method AUTOMATIC
allow_save_payment_method DISABLED
```

- [x] Reference ID.
- [x] Amount.
- [x] Customer safe data.
- [x] Description/items.
- [x] Return URLs.
- [x] Expiry.

## 5.2 Preconditions

- [x] Order exists.
- [x] Same workspace/outlet.
- [x] Customer-confirmed.
- [x] Payable state.
- [x] Not paid.
- [x] Connection ready.
- [x] Permission.

## 5.3 Create transaction

- [x] Internal Payment CREATED.
- [x] Provider call.
- [x] Session persistence.
- [x] Payment PENDING.
- [x] Current-session pointer.
- [x] Outbox/audit.
- [x] Ambiguous timeout recovery.

## 5.4 Tests

- [x] Happy path.
- [x] Already paid.
- [x] Existing link.
- [x] Wrong outlet.
- [x] Invalid amount.
- [x] Provider failure.
- [x] Duplicate.
- [x] Concurrent create.

---

# 6. Idempotency and Reference Strategy

## 6.1 Reference format

- [x] Non-PII.
- [x] Environment-safe.
- [x] Provider-size compliant.
- [x] Traceable.

## 6.2 Command idempotency

- [x] Create.
- [x] Regenerate.
- [x] Cancel.
- [x] Reconcile.
- [x] Refund.

## 6.3 Database constraints

- [x] One active payment per Order.
- [x] One current session generation.
- [x] Unique provider reference.
- [x] Unique webhook event.

## 6.4 Tests

- [x] Same key/same payload.
- [x] Same key/different payload.
- [x] Retry after timeout.
- [x] Worker race.
- [x] Test/live collision.

---

# 7. Payment Link Delivery

## 7.1 Message payload

- [x] Order number.
- [x] Amount.
- [x] Currency.
- [x] Link.
- [x] Expiry.
- [x] Safe instructions.

## 7.2 WhatsApp

- [x] Send.
- [x] Record message ID.
- [x] Delivery status.
- [x] Retry policy.

## 7.3 Telegram

- [x] Send.
- [x] Record message ID.
- [x] Delivery status.
- [x] Retry policy.

## 7.4 Delivery idempotency

- [x] One initial message.
- [x] Explicit resend.
- [x] No duplicate success.
- [x] Failure does not recreate payment.

## 7.5 Tests

- [x] WA success/failure.
- [x] Telegram success/failure.
- [x] Expired link blocked.
- [x] Cross-customer blocked.
- [x] Full link not logged.

---

# 8. Expiry, Resend, and Regeneration

## 8.1 Expiry

- [x] Store provider expiry.
- [x] Effective active check.
- [x] Scheduled stale check.
- [x] Provider expiry event.

## 8.2 Resend

- [x] Reuse valid link.
- [x] Rate limit.
- [x] Audit delivery.
- [x] Ownership check.

## 8.3 Regenerate

- [x] Revalidate Order.
- [x] Lock Payment.
- [x] New generation.
- [x] Cancel/supersede old.
- [x] Send newest link.
- [x] Idempotency.

## 8.4 Tests

- [x] Active resend.
- [x] Expired regenerate.
- [x] Concurrent regenerate.
- [x] Order amount changed.
- [x] Late old-session event.
- [x] Rate limit.

---

# 9. Webhook Intake

## 9.1 Routes

- [x] Payment Session.
- [x] Payment.
- [x] Refund.
- [ ] Legacy invoice only if enabled.

## 9.2 Preserve verification inputs

- [x] Raw body.
- [x] Headers.
- [x] Environment.
- [x] Route type.

## 9.3 Verification

- [x] `x-callback-token`.
- [x] Timing-safe comparison.
- [x] Business/environment validation.
- [x] Invalid token no mutation.
- [x] Metrics/alerts.

## 9.4 Durable inbox

- [x] Deduplication key.
- [x] Payload hash.
- [x] Sanitized payload.
- [x] Processing status.
- [x] Queue.
- [x] Prompt 2XX.

## 9.5 Security tests

- [x] Missing token.
- [x] Wrong token.
- [ ] Test event on LIVE route.
- [x] Oversized payload.
- [x] Malformed JSON.
- [x] Replay.
- [x] Redaction.

---

# 10. Webhook Normalization

## 10.1 Session events

- [x] `payment_session.completed`.
- [x] `payment_session.expired`.
- [x] IDs/reference/expiry.
- [x] Unknown event.

## 10.2 Payment events

- [x] `payment.capture`.
- [x] `payment.failed`.
- [x] payment_request_id.
- [x] payment_id.
- [x] capture_id.
- [x] channel/amount/currency.
- [x] provider times.

## 10.3 Refund events

- [x] Success.
- [x] Failure.
- [x] Unknown.
- [x] Amount/reference.

## 10.4 Contract tests

- [x] Official examples.
- [x] Missing field.
- [x] Additional field.
- [x] Unknown status.
- [x] Version drift.

---

# 11. Payment State Processor

## 11.1 Match internal Payment

- [x] Session ID.
- [x] Reference ID.
- [x] Payment request/payment ID.
- [x] Workspace/business/environment.
- [x] Order/payment.

## 11.2 Validate

- [x] Amount.
- [x] Currency.
- [x] Reference.
- [x] Current/superseded session.
- [x] Transition.

## 11.3 Success transaction

- [x] Upsert attempt.
- [x] Complete session.
- [x] Payment PAID.
- [x] paid_at.
- [x] History.
- [x] Outbox.
- [x] Audit.

## 11.4 Failure/expiry

- [x] Attempt vs session failure.
- [x] Expiry.
- [x] Aggregate transition.
- [x] Retry availability.
- [x] Event/notification.

## 11.5 Review path

- [x] Amount mismatch.
- [x] Currency mismatch.
- [x] Unknown reference.
- [x] Business/environment mismatch.
- [x] Duplicate provider payment.
- [x] Late conflict.

## 11.6 Tests

- [x] Success.
- [x] Duplicate success.
- [x] Failed attempt then success.
- [x] Expiry then late success.
- [x] Out-of-order.
- [x] Superseded session.
- [x] Mismatch.
- [x] Unknown event.

---

# 12. Order Lifecycle Integration

## 12.1 Events

- [x] PAYMENT_PAID.
- [x] PAYMENT_FAILED.
- [x] PAYMENT_EXPIRED.
- [x] PAYMENT_CANCELLED.
- [x] PAYMENT_REVIEW_REQUIRED.
- [x] Refund events.

## 12.2 Order consumer

- [x] PAID → AWAITING_OUTLET_APPROVAL.
- [x] Exactly-once business effect.
- [x] Retry.
- [x] Dead letter.
- [x] No unsafe direct table update.

## 12.3 Separation

- [x] No Order approval from payment processor.
- [x] No PAID from outlet.
- [x] Customer API shows both statuses.
- [x] Timelines link.

## 12.4 Tests

- [x] Advance once.
- [x] Duplicate webhook no duplicate advance.
- [x] Order Service unavailable.
- [x] Retry recovery.
- [x] Unpaid approval denied.
- [x] Selected outlet sees Order only.

---

# 13. AI Payment Tools

## 13.1 `create_payment_link`

- [x] Order ID only.
- [x] Context from Tool Gateway.
- [x] No amount input.
- [x] Payable validation.
- [x] Structured output.

## 13.2 `resend_payment_link`

- [x] Current customer/order.
- [x] Reuse/regenerate policy.
- [x] Rate limit.
- [x] Safe output.

## 13.3 `get_payment_status`

- [x] Payment status.
- [x] Order status.
- [x] Next action.
- [x] Optional stale reconciliation.

## 13.4 Security tests

- [x] AI Mark-Paid denied.
- [x] Other customer/order denied.
- [x] Cross-outlet denied.
- [x] AI amount ignored.
- [x] Off-topic no tool.
- [x] Raw provider data hidden.

---

# 14. Access Control and Outlet Scope

## 14.1 Permissions

- [x] List/detail.
- [x] Create/resend/regenerate.
- [x] Reconcile.
- [x] Cancel.
- [x] Refund.
- [x] Webhook diagnostics.
- [x] Connection settings.

## 14.2 Scope

- [x] Workspace.
- [x] Outlet.
- [x] Environment.
- [x] Counts.
- [x] Export.
- [x] Search.

## 14.3 Role tests

- [x] Owner/admin.
- [x] Assigned Outlet Manager.
- [x] Other outlet denied.
- [x] Outlet Staff read-only.
- [x] Finance reconcile/refund.
- [x] AI constrained.

---

# 15. Status Lookup and Reconciliation

## 15.1 Provider lookup

- [x] Get session.
- [x] Get payment.
- [x] Schema validation.
- [x] Rate limit.
- [x] Timeout/retry.

## 15.2 Reconciliation service

- [x] Stale pending.
- [x] Review required.
- [x] Customer stale status.
- [x] Manual operations.
- [x] Provider-timeout recovery.

## 15.3 Correction rules

- [x] Never downgrade PAID.
- [x] Match amount/currency/reference.
- [x] Unknown → review.
- [x] Audit.
- [x] Outbox on correction.

## 15.4 Tests

- [x] Local pending/provider paid.
- [x] Local expired/provider paid.
- [x] Local paid/provider pending.
- [x] Mismatch.
- [x] Provider unavailable.
- [x] Concurrent webhook.

---

# 16. Payment Cancellation

## 16.1 Eligibility

- [x] Not PAID.
- [x] Provider object cancellable.
- [x] Order policy allows.
- [x] Permission.

## 16.2 Provider cancellation

- [x] Adapter call.
- [x] Local update.
- [x] Link superseded.
- [x] Audit/event.
- [x] Idempotency.

## 16.3 Tests

- [x] Pending cancel.
- [x] Paid denied.
- [x] Duplicate.
- [x] Timeout.
- [x] Late success.
- [x] Cross-outlet denied.

---

# 17. Refunds

## 17.1 Eligibility

- [x] Successful Payment.
- [x] Channel capability.
- [x] Remaining balance.
- [x] Business approval hook.
- [x] Permission.

## 17.2 Refund request

- [x] Reference.
- [x] Amount.
- [x] Currency.
- [x] Reason.
- [x] Provider payment ID.
- [x] Idempotency.
- [x] Audit.

## 17.3 Full/partial calculation

- [x] Remaining refundable.
- [x] Lock.
- [x] Partial status.
- [x] Full status.
- [x] No over-refund.

## 17.4 Webhook/reconciliation

- [x] Success.
- [x] Failure.
- [x] Duplicate/out-of-order.
- [x] Lookup.
- [x] Notification/event.

## 17.5 Tests

- [x] Unsupported channel.
- [x] Excess amount.
- [x] Concurrent refunds.
- [x] Failure keeps paid truth.
- [x] Full refund.
- [x] Partial then full.
- [x] AI denied.

---

# 18. Payment Operations Read Models

## 18.1 List

- [x] Search.
- [x] Status.
- [x] Outlet.
- [x] Environment.
- [x] Date.
- [x] Channel.
- [x] Amount.
- [x] Review/refund.
- [x] Pagination/sort.

## 18.2 Summary

- [x] Collected.
- [x] Pending.
- [x] Failed/expired.
- [x] Review.
- [x] Refunded.
- [x] Correct scope/environment.

## 18.3 Detail

- [x] Order/outlet/customer.
- [x] Amount/status.
- [x] Session/link/expiry.
- [x] Attempts.
- [x] Webhook summary.
- [x] Reconciliation.
- [x] Refunds.
- [x] Activity/capabilities.

## 18.4 Tests

- [x] No N+1.
- [x] Secret redaction.
- [x] Cross-outlet.
- [ ] TEST/LIVE separation.
- [x] Empty/no-results.

---

# 19. Admin UI and Popup Contracts

## 19.1 Main page

- [x] Table.
- [x] Summary cards.
- [x] Filters.
- [x] TEST MODE banner.
- [x] Loading/empty/error.

## 19.2 Detail

- [x] Overview.
- [x] Attempts.
- [x] Timeline.
- [x] Refunds.
- [x] Activity.

## 19.3 Dialogs

- [x] Resend.
- [x] Regenerate.
- [x] Reconcile.
- [x] Cancel.
- [x] Refund.
- [x] Review resolution.

## 19.4 Safety

- [x] No Mark as Paid.
- [x] Payment/Order statuses separate.
- [x] Destructive confirmation.
- [x] Permission denied.
- [x] Version conflict.
- [x] Provider outage.

---

# 20. Domain Events, Audit, and Notifications

## 20.1 Outbox events

- [x] Created.
- [x] Session created.
- [x] Link delivered.
- [x] Paid.
- [x] Failed.
- [x] Expired.
- [x] Cancelled.
- [x] Review.
- [x] Reconciled.
- [x] Refund.

## 20.2 Audit

- [x] Human.
- [x] AI execution.
- [x] Provider webhook.
- [x] Background job.
- [x] Safe before/after.
- [x] Correlation/reason.

## 20.3 Notifications

- [x] Link.
- [x] Success.
- [x] Expiry/failure.
- [x] Refund.
- [x] Outlet paid-order alert.
- [x] Idempotency.

## 20.4 Failure tests

- [x] Audit unavailable policy.
- [x] Outbox retry.
- [x] Notification failure.
- [x] Duplicate prevention.

---

# 21. Observability and Alerting

## 21.1 Metrics

- [x] Session create.
- [x] Provider errors/latency.
- [x] Webhook receive/verify/process.
- [x] Duplicate/replay.
- [x] Paid/failed/expired.
- [x] Review.
- [x] Reconciliation.
- [x] Refund.
- [x] Backlog.

## 21.2 Logs/traces

- [x] Correlation IDs.
- [x] Payment/Order/session IDs.
- [x] Environment.
- [x] Redaction.
- [x] No full link.

## 21.3 Alerts

- [x] Verification failures.
- [x] Provider outage.
- [x] Webhook backlog.
- [x] PAID without Order transition.
- [x] Review spike.
- [x] Refund failures.
- [ ] TEST/LIVE mismatch.

## 21.4 Runbooks

- [x] Link outage.
- [x] Webhook issue.
- [x] Review queue.
- [x] Secret rotation.
- [x] Reconciliation.
- [x] Refund failure.

---

# 22. Security Test Matrix

## 22.1 Webhook

- [x] Forged token.
- [x] Missing token.
- [x] Replay.
- [x] Cross-environment.
- [x] Malformed/oversized.
- [x] Unknown business ID.
- [x] Timing-safe comparison.

## 22.2 Amount/status

- [x] Client amount.
- [x] AI amount.
- [x] Frontend redirect.
- [x] Outlet Mark-Paid.
- [x] Admin fake status.
- [x] Mismatch.
- [x] Unknown event.

## 22.3 Tenancy

- [x] Cross-workspace read/write.
- [x] Cross-outlet list/detail.
- [x] Cross-outlet reconcile/refund.
- [x] Count/export leakage.

## 22.4 Secrets/privacy

- [x] API key absent.
- [x] Callback token absent.
- [x] Link redacted.
- [x] Raw payload restricted.
- [x] PII minimized.
- [x] AI no secrets.

---

# 23. Property and Concurrency Tests

## 23.1 Properties

- [x] Only verified provider truth produces PAID.
- [x] Paid amount equals Order amount.
- [x] Refund total ≤ paid.
- [x] One current active session per Order.
- [x] Duplicate event has one effect.
- [x] PAID never downgraded.
- [x] Other outlet never sees payment.
- [x] TEST event never changes LIVE.

## 23.2 Concurrency

- [x] Two create commands.
- [x] Two regenerate commands.
- [x] Webhook vs reconcile.
- [x] Webhook vs expiry.
- [x] Cancellation vs late success.
- [x] Two refunds.
- [x] Order change vs create.

---

# 24. Resilience Tests

- [x] Xendit timeout before response.
- [x] Xendit 5xx.
- [x] DB failure before provider call.
- [x] DB failure after provider response.
- [x] Queue unavailable.
- [x] Processor crash.
- [x] Outbox consumer crash.
- [x] Order Service unavailable.
- [x] Notification unavailable.
- [x] Audit unavailable.
- [x] Reconciliation retry.
- [x] Dead-letter handling.

Ambiguous create failure SHALL reconcile before creating another session.

---

# 25. Performance and Scale

## 25.1 Fixtures

- [x] Many workspaces.
- [x] 100+ outlets.
- [x] Large payment history.
- [x] Webhook burst.
- [x] Review/refund history.

## 25.2 Benchmarks

- [x] Payment list.
- [x] Payment detail.
- [x] Webhook intake.
- [x] Processor.
- [x] Reconciliation batch.
- [x] Summary cards.

## 25.3 Optimization

- [x] Indexes.
- [x] Query plans.
- [x] No N+1.
- [x] Bounded batches.
- [x] Provider concurrency limits.
- [x] Queue scaling.

---

# 26. Legacy Adapter and Migration

## 26.1 Audit legacy integration

- [x] `/v2/invoices`.
- [x] `external_id`.
- [x] PAID/EXPIRED callback.
- [x] Invoice URL.
- [x] Webhook token.
- [x] Midtrans.

## 26.2 Compatibility adapter if required

- [x] Explicit mode.
- [x] Common internal model.
- [x] Separate webhook mapping.
- [x] No dual active link.
- [x] Historical support.

## 26.3 Fresh Supabase cutover

- [x] New tables.
- [x] Test credentials.
- [x] Webhook setup.
- [x] E2E.
- [x] Disable Mongo authority.
- [x] Remove manual-paid endpoint.
- [x] Remove Midtrans active path.

## 26.4 Rollback

- [x] Adapter rollback.
- [x] Migration rollback.
- [x] Webhook rollback.
- [x] Reconcile in-flight.
- [x] No duplicate link.

---

# 27. Alpha End-to-End Test

Required scenario:

```text
Customer on WhatsApp/Telegram
→ selects outlet
→ confirms order
→ backend creates Xendit Test Payment Session
→ link delivered
→ test payment completed
→ verified webhook received
→ Payment PAID
→ Order AWAITING_OUTLET_APPROVAL
→ selected outlet sees Order
→ another outlet cannot
→ selected outlet approves
```

- [x] WhatsApp path.
- [x] Telegram path.
- [x] Duplicate customer message.
- [x] Duplicate webhook.
- [x] Expired link/regenerate.
- [x] Provider failure.
- [x] Order transition retry.
- [x] Cross-outlet denial.
- [x] AI cannot mark paid.
- [x] Test Mode visible.

---

# 28. Live Readiness Gate

Before LIVE:

- [x] Official docs revalidated.
- [ ] Live account/channels ready.
- [ ] Live secret created.
- [ ] Live webhook configured/tested.
- [x] HTTPS endpoint.
- [x] Security review.
- [x] Rotation plan.
- [x] Monitoring/alerts.
- [x] Runbooks.
- [x] Refund/support process.
- [x] Controlled transaction plan.
- [x] Rollback/reconciliation.
- [x] Business sign-off.
- [x] Test data excluded from live reporting.

---

# 29. Fastest Safe Alpha Slice

Implement first:

```text
0 preflight
1 types/permissions
2 Supabase core schema
3 TEST secrets/environment
4 Xendit adapter
5 Payment Session creation
6 idempotency
7 WA/Telegram delivery
8 expiry/resend/regenerate
9 webhook intake/verification
10 normalization
11 state processor
12 Order integration
13 AI tools
14 outlet scope
15 basic reconciliation
18 basic list/detail
20 events/audit/notifications
21 observability minimum
22 security
23 concurrency
24 resilience
27 E2E
```

May defer:

```text
refunds
legacy adapter unless required
advanced Operations UI
disputes
LIVE activation
advanced analytics
```

---

# 30. Final Validation and Release

## Commands

```text
npm run specs:check
npm run test:payments:unit
npm run test:payments:component
npm run test:payments:integration
npm run test:payments:security
npm run test:payments:property
npm run test:payments:concurrency
npm run test:payments:resilience
npm run test:payments:performance
npm run test:payments:all
```

## Checklist

- [x] Provider contract verified.
- [x] Xendit only.
- [ ] TEST/LIVE isolated.
- [x] Secrets safe.
- [x] Backend amount authority.
- [x] Payment Session link flow.
- [x] Verified webhook.
- [x] Idempotency/out-of-order.
- [x] PAID invariant.
- [x] Order transition.
- [x] Outlet isolation.
- [x] AI restrictions.
- [x] Reconciliation.
- [x] Audit/metrics/runbooks.
- [ ] Security/property/concurrency/resilience/performance.
- [ ] No LIVE key/real money in tests.
- [x] Implementation status honest.
- [x] Specs check passes.

---

# Requirement Traceability

| Requirement | Task Sections |
|---|---|
| PAY-R1–R5 | 0, 1, 3, 4 |
| PAY-R6–R9 | 1, 2, 11 |
| PAY-R10–R11 | 4, 5, 26 |
| PAY-R12–R20 | 5, 6, 7, 8 |
| PAY-R21–R25 | 9, 10, 11 |
| PAY-R26–R30 | 11, 12, 15, 16 |
| PAY-R31–R33 | 7, 13, 14 |
| PAY-R34–R36 | 18, 19 |
| PAY-R37–R40 | 16, 17 |
| PAY-R41–R42 | 11, 15, 22 |
| PAY-R43–R45 | 20, 21 |
| PAY-R46–R48 | 19, 22 |
| PAY-R49 | 6, 8–17, 23, 24 |
| PAY-R50 | 26 |
| PAY-R51 | all test sections |
| PAY-R52 | 25 |
| PAY-R53 | 21, 24, 28, 30 |
| PAY-R54 | 0, 4, 10, 28 |

---

# Definition of Done

```text
all P0 tasks complete
approved P1/P2 deferrals documented
Xendit contract revalidated
payment truth cannot be manually forged
webhook verification/replay protection proven
amount/reference/environment matching proven
payment/Order separation proven
outlet isolation proven
AI restrictions proven
reconciliation proven
refund invariants proven when enabled
all release-gate tests pass
implementation status reflects reality
specs check passes
```
