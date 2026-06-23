---
schema_version: 1
document_type: implementation-plan
spec_id: selaluteh-inventory-stock-ledger
title: SelaluTeh Inventory & Stock Ledger Tasks
status: active
workflow_state: in_progress
version: 1.0.0
updated_at: 2026-06-23
development_method: test-driven-development
---

# Implementation Plan: SelaluTeh Inventory & Stock Ledger

## Method

```text
RED
→ GREEN
→ REFACTOR
→ VERIFY
```

# Global Completion Rules

- [x] Failing tests are written and observed first.
- [x] Ledger mutation is append-only.
- [x] Balance equations are verified.
- [x] Workspace/outlet scope is verified.
- [x] Idempotency and concurrency tests pass.
- [x] AI mutation is denied.
- [x] Docs and implementation status are updated.
- [x] `npm run specs:check` passes.

# 0. Preflight and Repository Audit

- [x] Confirm spec authority and `INV-R` prefix.
- [x] Confirm Product Catalog vs Inventory boundary.
- [x] Confirm Order/Payment reservation policy.
- [x] Locate legacy stock fields and availability booleans.
- [x] Locate existing inventory routes/models/services.
- [x] Locate order stock deduction logic.
- [x] Locate Mongo and Supabase inventory structures.
- [x] Identify direct balance overwrite paths.
- [x] Identify negative-stock behavior.
- [x] Create deterministic inventory test fixtures.

# 1. Shared Types, Units, and Permissions

- [x] Inventory item types.
- [x] Tracking modes.
- [x] Item/account lifecycle.
- [x] Movement/transaction types.
- [x] Reservation statuses.
- [x] Transfer lifecycle.
- [x] Stocktake lifecycle.
- [x] Unit categories and base units.
- [x] Permissions.
- [x] Stable error codes.
- [x] Decimal arithmetic helper/tests.

# 2. Supabase Schema and RLS

- [x] Inventory items.
- [x] Units and conversions.
- [x] Product mappings.
- [x] Recipes/components.
- [x] Stock accounts.
- [x] Transactions.
- [x] Immutable ledger entries.
- [x] Balance projections.
- [x] Reservations.
- [x] Transfers/items.
- [x] Stocktakes/lines.
- [x] Optional batches.
- [x] Indexes and constraints.
- [x] Workspace/outlet RLS.
- [x] Service policies for Order integration.
- [x] Append-only ledger enforcement tests.

# 3. Inventory Item and Stock Account Core

- [x] Item CRUD/lifecycle.
- [x] Item code uniqueness.
- [x] Base unit assignment.
- [x] Tracking mode validation.
- [x] Outlet stock-account creation.
- [x] Same-workspace validation.
- [x] Threshold configuration.
- [x] Negative-stock policy.
- [x] Versioning/audit/events.

# 4. Unit Conversion

- [x] System unit registry.
- [x] Workspace custom units.
- [x] Compatible-category validation.
- [x] Item-specific conversion.
- [x] Decimal-safe factor application.
- [x] Rounding policy.
- [x] Historical base-unit storage.
- [x] Property tests.

# 5. Product Mapping

- [x] Direct product mapping.
- [x] Variant mapping.
- [x] Quantity per sale.
- [x] NONE/DIRECT/RECIPE validation.
- [x] Archived/missing mapping behavior.
- [x] Product Catalog integration.
- [x] Availability cache invalidation.
- [x] Contract tests.

# 6. Inventory Transaction and Ledger Service

- [x] Transaction command contract.
- [x] Idempotency.
- [x] Account/balance locking.
- [x] Append ledger entries.
- [x] Monotonic ledger sequence.
- [x] Projection update.
- [x] Outbox insertion.
- [x] Reversal transaction.
- [x] No edit/delete path.
- [x] Integrity/property tests.

# 7. Opening Balance

- [x] Opening-balance command.
- [x] Single-opening validation.
- [x] Negative rejection.
- [x] Source/reason/actor metadata.
- [x] Projection update.
- [x] Audit/event.
- [x] Migration support.
- [x] Duplicate-command test.

# 8. Stock Receipt

- [x] Receipt command.
- [x] Supplier/external reference.
- [x] Unit conversion.
- [x] Optional cost/batch/expiry metadata.
- [x] Increase on-hand.
- [x] Idempotent external reference.
- [x] Reversal.
- [x] Permission/audit tests.

# 9. Manual Adjustment

- [x] Positive adjustment.
- [x] Negative adjustment.
- [x] Reason codes.
- [x] High-risk approval hook.
- [x] Negative-stock validation.
- [x] Projection metadata.
- [x] Reversal.
- [x] AI denial and permission tests.

# 10. Waste and Return

- [x] Waste/damage/spoilage/loss reasons.
- [x] Evidence attachment reference.
- [x] Quantity reduction.
- [x] Return-in command.
- [x] Reusable/quarantine/waste disposition.
- [x] Order reference.
- [x] Duplicate return protection.
- [x] Reversal/audit.

# 11. Balance Projection

- [x] On-hand.
- [x] Reserved.
- [x] Available.
- [x] In-transit.
- [x] Version and ledger sequence.
- [x] Transactional update.
- [x] Zero vs unavailable distinction.
- [x] Rebuild support.
- [x] Drift detection.

# 12. Reservation Service

- [x] Reservation command.
- [x] Order/order-item reference.
- [x] Requirement snapshot.
- [x] Account locking.
- [x] Sufficient available check.
- [x] Active reservation records.
- [x] Projection update.
- [x] Idempotency.
- [x] Multi-item atomicity.
- [x] Concurrency oversell tests.

# 13. Reservation Expiry and Release

- [x] Expiry timestamp.
- [x] Payment-link-aligned TTL.
- [x] Scheduler.
- [x] Order event release.
- [x] Reject/cancel/expire flows.
- [x] Projection update.
- [x] Idempotent duplicate events.
- [x] Late-event reconciliation.
- [x] Stuck-reservation diagnostics.

# 14. Commit and Consumption

- [x] Commit policy configuration.
- [x] Alpha default at outlet approval.
- [x] Lock reservation/balance.
- [x] Append SALE_CONSUMPTION.
- [x] Reduce on-hand and reserved atomically.
- [x] Partial-commit policy.
- [x] Duplicate commit protection.
- [x] Commit-vs-release concurrency tests.
- [x] Failure rollback tests.

# 15. Order and Payment Integration

- [x] Availability contract.
- [x] Reserve command at payable state.
- [x] Preserve after payment success.
- [x] Commit at approved point.
- [x] Release on rejection/cancellation/payment expiry.
- [x] Replace reservation on order edit.
- [x] Order version/idempotency.
- [x] Payment late-event handling.
- [x] E2E contract tests.

# 16. Product Availability Integration

- [x] Reason-code contract.
- [x] Direct stock availability.
- [x] Inventory-not-configured behavior.
- [x] Account inactive behavior.
- [x] Outlet operational check contract.
- [x] Catalog cache invalidation.
- [x] Max sellable quantity.
- [x] Customer-safe AI output.
- [x] Product/Order integration tests.

# 17. Low-Stock and Attention

- [x] Threshold fields.
- [x] Low/out-of-stock computation.
- [x] Entered/cleared events.
- [x] Notification Attention integration.
- [x] Reorder suggestion boundary.
- [x] Permission/audit.
- [x] Duplicate alert prevention.
- [x] Dashboard metrics.

# 18. Recipe and Ingredient Tracking

- [x] Recipe version model.
- [x] Components.
- [x] Variant rules.
- [x] Modifier add/remove/replace.
- [x] Base-unit expansion.
- [x] Requirement snapshot.
- [x] Component reservation.
- [x] Component consumption.
- [x] Historical version integrity.
- [x] Decimal/property tests.

# 19. Batch and Expiry

- [x] Batch records.
- [x] Receipt batch allocation.
- [x] Remaining quantity.
- [x] Expiry/quarantine status.
- [x] FIFO/FEFO policy.
- [x] Reservation batch selection.
- [x] Expiry attention events.
- [x] Account/batch reconciliation.
- [x] Batch correction via ledger.

# 20. Transfers

- [x] Create request.
- [x] Same-workspace outlets.
- [x] Approval policy.
- [x] Dispatch transaction.
- [x] In-transit projection.
- [x] Partial receipt.
- [x] Destination receipt transaction.
- [x] Variance resolution.
- [x] Close/cancel/reject.
- [x] Segregation of duties.
- [x] Concurrency/idempotency tests.

# 21. Stocktakes

- [x] Create session/scope.
- [x] Snapshot/cutoff policy.
- [x] Blind count.
- [x] Count entry.
- [x] Progress.
- [x] Variance calculation.
- [x] Post variance ledger.
- [x] Duplicate-post prevention.
- [x] Concurrent movement warning.
- [x] Audit/events.
- [x] Cycle-count scheduler.

# 22. Cost and Procurement Boundary

- [x] Unit-cost metadata.
- [x] Cost permission.
- [x] Valuation strategy interface.
- [x] Historical cost snapshot.
- [x] Supplier/external references.
- [x] Future procurement command contract.
- [x] No accounting-ledger coupling.
- [x] Redaction tests.

# 23. Inventory Overview Read Model

- [x] Outlet selector/scope.
- [x] Search/filter/sort/pagination.
- [x] On-hand/reserved/available/in-transit.
- [x] Low/out-of-stock.
- [x] Last movement.
- [x] Summary cards.
- [x] Cost redaction.
- [x] Zero vs unavailable.
- [x] No N+1/query plans.

# 24. Item Detail and Ledger Read Model

- [x] Item definition.
- [x] Product mappings.
- [x] Outlet balances.
- [x] Thresholds.
- [x] Recipe usage.
- [x] Batches.
- [x] Reservations.
- [x] Immutable ledger pagination.
- [x] Reversal links.
- [x] Activity.
- [x] External failure fallback.

# 25. Reservation, Transfer, and Stocktake Read Models

- [x] Reservation list/detail.
- [x] Stuck/expired filters.
- [x] Manual release capability.
- [x] Transfer list/detail.
- [x] Partial receipt/variance.
- [x] Stocktake list/detail.
- [x] Blind-count visibility rules.
- [x] Capability flags.
- [x] Stable pagination.

# 26. AI Read Tools

- [x] `check_inventory_availability`.
- [x] `get_product_stock_reason`.
- [x] `list_low_stock`.
- [x] Workspace/outlet/product context.
- [x] Customer-safe quantity policy.
- [x] No adjustment/receipt/transfer/stocktake mutation.
- [x] Off-topic no tool.
- [x] Prompt-injection tests.

# 27. API Contracts

- [x] Item/account endpoints.
- [x] Receipt/adjustment/waste/return.
- [x] Reversal.
- [x] Ledger query.
- [x] Reservation/replace/release/commit.
- [x] Transfers.
- [x] Stocktakes.
- [x] Availability.
- [x] Reconciliation.
- [x] Strict schemas/errors/idempotency.
- [x] Permission documentation.

# 28. Admin UI Contracts

- [x] Inventory page.
- [x] Item detail tabs.
- [x] Receive Stock modal.
- [x] Adjust Stock modal.
- [x] Waste modal.
- [x] Transfer flow.
- [x] Stocktake flow.
- [x] Reservation diagnostics.
- [x] Reversal confirmation.
- [x] Reconciliation/repair.
- [x] Loading/empty/no-results.
- [x] Permission/conflict/stale/outage states.
- [x] No Edit Ledger action.

# 29. Events, Audit, Metrics, and Alerts

- [x] Transaction events.
- [x] Reservation events.
- [x] Low-stock events.
- [x] Transfer events.
- [x] Stocktake events.
- [x] Projection/integrity events.
- [x] Outbox.
- [x] Human/system/migration actor distinction.
- [x] Metrics.
- [x] Alerts.
- [x] Runbook links.
- [x] PII/cost redaction.

# 30. Authorization and RLS Security Matrix

- [x] Workspace owner/admin.
- [x] Outlet manager.
- [x] Outlet staff.
- [x] Inventory manager.
- [x] Transfer approver.
- [x] Stocktake counter/poster.
- [x] Finance/cost viewer.
- [x] Order service identity.
- [x] AI read-only identity.
- [x] Cross-workspace denial.
- [x] Cross-outlet denial.
- [x] Unscoped query denial.

# 31. Property and Concurrency Tests

Properties:

- [x] Posted ledger rows are immutable.
- [x] On-hand equals posted physical deltas.
- [x] Reserved equals active reservations.
- [x] Available equals on-hand minus reserved.
- [x] Duplicate idempotency key has one effect.
- [x] Reversal restores net quantity.
- [x] No oversell when negative stock is disabled.
- [x] AI never creates a mutation transaction.

Concurrency:

- [x] Two reservations.
- [x] Commit vs release.
- [x] Receipt vs stocktake.
- [x] Adjustment vs reservation.
- [x] Transfer receive vs cancel.
- [x] Rebuild vs transaction posting.
- [x] Order edit vs payment success.

# 32. Reconciliation and Repair

- [x] Ledger replay calculator.
- [x] Active reservation calculator.
- [x] In-transit calculator.
- [x] Projection comparison.
- [x] Drift report.
- [x] Authorized projection rebuild.
- [x] Idempotent job.
- [x] Block risky mutations on unresolved integrity error.
- [x] Audit/event.
- [x] Crash/restart tests.

# 33. Resilience Tests

- [x] DB failure before posting.
- [x] DB failure after entry insert before projection.
- [x] Outbox failure.
- [x] Order retry.
- [x] Payment retry.
- [x] Duplicate scheduler event.
- [x] Cache failure.
- [x] Reconciliation worker crash.
- [x] Notification failure.
- [x] External service outage.

# 34. Performance and Scale

- [x] Many workspaces/outlets.
- [x] Large item and ledger history.
- [x] Concurrent reservation load.
- [x] Availability latency.
- [x] Inventory list/detail latency.
- [x] Ledger pagination.
- [x] Transfer/stocktake queries.
- [x] Reconciliation batches.
- [x] Index/query-plan review.
- [x] Bounded payloads.

# 35. Migration and Cutover

- [x] Audit legacy stock and availability fields.
- [x] Define units/items/mappings.
- [x] Create outlet accounts.
- [x] Validate negative/missing data.
- [x] Generate migration/opening transactions.
- [x] Reconcile balances.
- [x] Enable Order reservation integration.
- [x] Disable legacy stock authority.
- [x] Remove direct balance writes.
- [x] Document rollback.
- [x] Update implementation status honestly.

# 36. Alpha End-to-End Validation

```text
Admin sets opening balance
→ customer chooses product/outlet
→ Inventory confirms availability
→ confirmed order reserves stock
→ Xendit payment link is sent
→ payment succeeds
→ reservation remains
→ outlet approves
→ reservation commits
→ on-hand and reserved update
→ other outlet balance remains isolated
```

- [x] Available flow.
- [x] Out-of-stock flow.
- [x] Duplicate order command.
- [x] Two customers race for last item.
- [x] Payment expiry releases.
- [x] Outlet rejection releases.
- [x] Payment success preserves.
- [x] Approval commits once.
- [x] Order edit replaces reservation.
- [x] Other outlet isolation.
- [x] Projection rebuild.
- [x] AI read-only tool.

# 37. Fastest Safe Alpha Slice

Implement first:

```text
0 preflight
1 types/units/permissions
2 Supabase/RLS
3 item/account
5 product mapping
6 ledger
7 opening balance
8 receipts
9 adjustments
11 balance projection
12 reservations
13 release/expiry
14 commit
15 Order/Payment integration
16 availability
17 low stock
23 overview
24 detail/ledger
26 AI read tools
27 APIs
28 UI contracts
29 events/audit/metrics
30 authorization
31 property/concurrency
32 reconciliation
33 resilience
35 migration
36 E2E
```

May defer:

```text
recipes
batches/expiry
waste evidence
returns
transfers
stocktake scheduling
cost valuation
procurement integration
quarantine
```

# 38. Final Validation

Commands:

```text
npm run specs:check
npm run test:inventory:unit
npm run test:inventory:component
npm run test:inventory:integration
npm run test:inventory:security
npm run test:inventory:property
npm run test:inventory:concurrency
npm run test:inventory:resilience
npm run test:inventory:performance
npm run test:inventory:all
```

# Requirement Traceability

| Requirements | Task Sections |
|---|---|
| INV-R1–R9 | 0–5 |
| INV-R10–R18 | 6–11 |
| INV-R19–R27 | 12–18 |
| INV-R28–R36 | 19–22 |
| INV-R37–R43 | 23–26 |
| INV-R44–R51 | 15, 27–30 |
| INV-R52–R58 | 29–38 |

# Definition of Done

```text
all P0 tasks complete
approved P1/P2 deferrals documented
ledger immutability proven
balance equations proven
no oversell proven
order/payment reservation flow proven
workspace/outlet isolation proven
AI mutation denied
projection rebuild proven
all release-gate tests pass
implementation status reflects repository reality
specs check passes
```
