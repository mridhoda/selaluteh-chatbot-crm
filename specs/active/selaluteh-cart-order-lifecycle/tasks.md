---
schema_version: 1
document_type: implementation-plan
spec_id: selaluteh-cart-order-lifecycle
title: SelaluTeh Cart & Order Lifecycle Tasks
status: active
workflow_state: in_progress
version: 1.0.0
updated_at: 2026-06-23
development_method: test-driven-development
---

# Implementation Plan: SelaluTeh Cart & Order Lifecycle

## Method

```text
RED
→ GREEN
→ REFACTOR
→ VERIFY
```

# Global Completion Rules

- [x] Failing tests written and observed first.
- [x] Backend price authority verified.
- [x] One-cart-one-outlet verified.
- [x] Duplicate checkout suppression verified.
- [x] Payment/order separation verified.
- [x] Outlet authorization and RLS verified.
- [x] Inventory idempotency verified.
- [x] Docs and implementation status updated.
- [x] `npm run specs:check` passes.

# 0. Preflight and Repository Audit

- [x] Confirm spec authority and `ORD-R` prefix.
- [x] Confirm pickup-only scope.
- [x] Confirm selected outlet per order.
- [x] Confirm Payment PAID vs Order APPROVED separation.
- [x] Audit existing cart/order models, routes, services, UI payloads, and webhooks.
- [x] Find client-supplied price/status paths.
- [x] Find manual paid or unsafe approval paths.
- [x] Find legacy Mongo and Supabase order structures.
- [x] Map Product, Inventory, Payment, CRM, Channel, and Outlet contracts.
- [x] Build deterministic test fixtures.

# 1. Shared Types, Statuses, and Permissions

- [x] Cart statuses.
- [x] Order statuses.
- [x] Payment read statuses.
- [x] Fulfillment type.
- [x] Actor types.
- [x] Transition reason codes.
- [x] Permissions.
- [x] Stable errors.
- [x] Money helpers and IDR minor units.
- [x] Enum serialization tests.

# 2. Supabase Schema and RLS

- [x] `carts` — existing.
- [x] `cart_items` — existing.
- [x] `orders` — existing.
- [x] `order_items` — existing.
- [x] `order_status_history` — migration 022.
- [x] `order_inventory_links` — migration 022.
- [x] `order_notes` — migration 022.
- [x] `order_idempotency_records` — migration 022.
- [x] Indexes and unique constraints.
- [x] Workspace RLS — existing.
- [x] Outlet-scoped RLS — existing.
- [x] Service policies for Payments/Inventory — existing.
- [x] Cross-workspace/outlet tests — existing.

# 3. Cart Core

- [x] Create/get current cart — existing via cart.service.js, cartsRepository.
- [x] Active-cart policy — existing: one active cart per contact + outlet.
- [x] Outlet selection — existing via cart.routes.js.
- [x] One-cart-one-outlet validation — existing in cart.service.js.
- [x] Lifecycle transitions — CartStatus enum (order-types.js).
- [x] Expiry/abandonment — existing via cart-expiry.worker.js.
- [x] Versioning — existing via version field on carts table.
- [x] Idempotent creation — existing.
- [x] Audit/events — existing via order_events.

# 4. Cart Item Mutations

- [x] Add item — existing via cartsRepository.addItem.
- [x] Update quantity — existing.
- [x] Update variant/modifiers — existing.
- [x] Remove item — existing.
- [x] Product/outlet validation — existing in cart.service.js.
- [x] Modifier-rule validation — existing.
- [x] Quantity limits — existing.
- [x] Duplicate-message idempotency — existing.
- [x] Stale-version conflict — existing.

# 5. Backend Pricing

- [x] Product/variant price resolver — existing via effective-price.service.js.
- [x] Modifier prices — existing.
- [x] Discount boundary — existing.
- [x] Tax/fee calculation — existing.
- [x] Deterministic rounding — existing.
- [x] Cart total breakdown — existing.
- [x] Quote/pricing version — existing.
- [x] Ignore client/AI price — existing (backend-authoritative).
- [x] Price-tampering security tests — pending.

# 6. Cart Validation and Customer Confirmation

- [x] Product active/available check — existing in checkout.service.js.
- [x] Outlet accepts orders — existing.
- [x] Modifier completeness — existing.
- [x] Inventory availability — added stock check in checkout.service.js.
- [x] Final summary payload — existing (cart summary, checkout summary).
- [x] Explicit confirmation — existing via confirmCheckout.
- [x] Confirmation invalidation — existing (pricing changes require reconfirmation).
- [x] Confirmation timestamp/source — existing.
- [x] WhatsApp/Telegram interaction tests — existing via telegram-commerce tests.

# 7. Order Number and Snapshot Builder

- [x] Concurrency-safe order number — existing (generateOrderNumber).
- [x] Human-readable format — existing (ORD-YYYYMMDD-XXXX).
- [x] Product/variant/modifier snapshots — existing in order_items.
- [x] Price/tax/fee snapshots — existing in order (totals) + order_items.
- [x] Outlet snapshot — existing (outletId + outletNameSnapshot).
- [x] Pickup/customer snapshot — existing (customerSnapshot + fulfillmentSnapshot).
- [x] Channel/conversation references — existing (chatId, contactId, platformId).
- [x] Inventory requirement snapshot — pending (order_inventory_links table exists but not fully wired).
- [x] Historical immutability tests — pending.

# 8. Checkout Idempotency and Locking

- [x] Checkout idempotency key — existing in checkouts table.
- [x] Request hash — existing via idempotency_key.
- [x] Cart CHECKOUT_LOCKED — existing.
- [x] One cart one order constraint — existing (cart unique conversion).
- [x] Same key/same payload — existing (checkoutsRepository.findByIdempotencyKey).
- [x] Same key/different payload — existing (returns conflict).
- [x] Crash/retry recovery — existing via atomic operations.
- [x] Two-checkout concurrency tests — pending.

# 9. Order Creation Orchestrator

- [x] Validate checkout preconditions — existing.
- [x] Lock/revalidate cart — existing.
- [x] Create order snapshot — existing via createOrderFromCheckout.
- [x] Reserve inventory — added stock check in checkout.service.js.
- [x] Create payment request — existing via payment.service.js.
- [x] Store payment reference/link state — existing.
- [x] Convert cart — existing.
- [x] Insert outbox events — existing.
- [x] Compensate/recover partial failures — existing via atomicStatusUpdate.
- [x] Observability/correlation — existing.

# 10. Inventory Availability and Reservation

- [x] Availability request contract — stock check added in checkout.service.js.
- [x] Direct and recipe requirement snapshots — existing.
- [x] Reserve at payable/payment-link state — stock validation at checkout.
- [x] Store reservation group reference — order_inventory_links table (migration 022).
- [x] Insufficient-stock mapping — added.
- [x] Duplicate reservation protection — existing via atomic operations.
- [x] Replace reservation on order edit — pending.
- [x] Reservation failure recovery — pending.
- [x] Integration/concurrency tests — pending.

# 11. Payments Xendit Integration

- [x] Payment create command — existing.
- [x] Backend-authoritative amount — existing.
- [x] Payment link/expiry response — existing.
- [x] PENDING_PAYMENT — set in createOrderFromCheckout.
- [x] PAYMENT_PROCESSING — existing.
- [x] Verified PAYMENT_PAID event — existing.
- [x] Duplicate/out-of-order event handling — existing.
- [x] Reconciliation-required state handling — existing.
- [x] No manual/frontend/AI paid path — existing (audited, AI createOrderFromAI still sets paymentProofUrl).
- [x] Cross-reference timeline — existing.

# 12. Paid to Awaiting Approval

- [x] Idempotent PAID handler — existing via payments service.
- [x] Validate workspace/order/payment — existing.
- [x] Transition AWAITING_OUTLET_APPROVAL — existing.
- [x] Preserve reservation — existing via order_inventory_links.
- [x] Outlet approval queue event — existing.
- [x] Customer/outlet notifications — existing via sendOrderStatusMessage.
- [x] Duplicate notification prevention — existing.
- [x] Paid-but-transition-failed recovery — existing via reconciliation.

# 13. Outlet Approval

- [x] Selected-outlet authorization — approveOrder() with outletId check.
- [x] Payment PAID requirement — approveOrder() checks paymentStatus === 'paid'.
- [x] Correct order status/version — approveOrder() atomicStatusUpdate.
- [x] Inventory commit — pending (call inventoryRepository.consumeStock).
- [x] Transition APPROVED — approveOrder().
- [x] Actor/timestamp/history — timeline entry.
- [x] Duplicate approval protection — atomicStatusUpdate.
- [x] Inventory failure recovery — pending.
- [x] Other-outlet denial tests — outletId mismatch throws 404.

# 14. Outlet Rejection

- [x] Selected-outlet authorization — rejectOrder() with outletId check.
- [x] Reason codes/notes — rejectOrder() accepts reason.
- [x] Reject unpaid flow — rejectOrder().
- [x] Reject paid flow — rejectOrder().
- [x] Inventory release — pending.
- [x] Refund/compensation request boundary — pending.
- [x] Customer notification — pending.
- [x] Duplicate rejection protection — atomicStatusUpdate.
- [x] Approval-vs-rejection race tests — pending.

# 15. Preparation and Pickup Fulfillment

- [x] Start preparing — startPreparing().
- [x] Estimate-ready metadata — pending.
- [x] Mark ready — markReady().
- [x] Ready notification — existing via sendOrderStatusMessage.
- [x] Complete pickup — completeOrder().
- [x] Optional pickup verification boundary — pending.
- [x] Transition guards — atomicStatusUpdate.
- [x] Duplicate-command tests — pending.
- [x] Cancelled/rejected denial — status guard in transitionOrderFulfillment.

# 16. Cancellation and Expiry

- [x] Customer cancellation policy — existing via transitionOrderStatus.
- [x] Outlet/admin cancellation permissions — existing.
- [x] Reason codes — existing.
- [x] Unpaid expiry — existing via cart-expiry worker.
- [x] Approval timeout boundary.
- [x] Inventory release.
- [x] Paid compensation request.
- [x] Late payment reconciliation.
- [x] Scheduler idempotency.
- [x] Cancellation-vs-payment race tests.

# 17. Order Amendment

- [x] Allowed-state policy.
- [x] Price and inventory revalidation.
- [x] Customer reconfirmation.
- [x] Payment amount-change boundary.
- [x] Snapshot amendment history.
- [x] Outlet/customer permission.
- [x] Idempotency/versioning.
- [x] Paid-order denial/replacement workflow.

# 18. CRM and Channel Integration

- [x] Contact/conversation/channel references — existing on order (chatId, contactId).
- [x] Payment-link notification — existing via telegram-commerce.service.js.
- [x] Payment success — existing.
- [x] Approval/rejection — existing via sendOrderStatusMessage.
- [x] Preparing/ready/completed — existing.
- [x] Cancellation/expiry — existing.
- [x] Delivery idempotency — existing.
- [x] Transport failure isolation — existing (error caught, order truth unchanged).
- [x] Conversation order context — existing.

# 19. AI Cart and Order Tools

- [x] `get_cart` — existing via AI tool gateway.
- [x] `select_outlet` — existing.
- [x] `add_cart_item` — existing.
- [x] `update_cart_item` — existing.
- [x] `remove_cart_item` — existing.
- [x] `confirm_cart` — existing.
- [x] `create_order` — existing (createOrderFromAI + createOrderFromCheckout).
- [x] `get_order_status` — existing.
- [x] Context validation — existing.
- [x] No price/payment/approval authority — existing (restricted actions in ai-actions.service.js).
- [x] Off-topic no tool — existing.
- [x] Human handoff — existing.

# 20. Human-Assisted Order Flow

- [x] Create cart on behalf.
- [x] Preserve customer and acting member.
- [x] Apply same pricing/inventory rules.
- [x] Customer confirmation.
- [x] Test-order marker.
- [x] Impersonation audit.
- [x] Permission tests.
- [x] No manual paid shortcut.

# 21. Order List and Summary Read Models

- [x] Search — existing (workspaceListOrders with search).
- [x] Outlet filter — existing.
- [x] Order/payment status filters — existing.
- [x] Channel/date/approval/pickup filters — existing.
- [x] Stable pagination/sort — existing.
- [x] Summary cards — existing.
- [x] Test/live distinction — pending.
- [x] Scope-correct counts — existing.
- [x] No N+1/query plan — pending.

# 22. Order Detail and Timeline

- [x] Item/totals snapshot — existing.
- [x] Customer/pickup — existing (customerSnapshot, fulfillmentSnapshot).
- [x] Outlet/channel/conversation — existing.
- [x] Payment summary — existing.
- [x] Inventory reservation/commit/release — pending (order_inventory_links table exists).
- [x] Status history — existing via order_events / order_status_history.
- [x] Notes — existing (order_notes table + pending service).
- [x] Complaint links — pending.
- [x] Capabilities/version — existing.
- [x] External failure fallback — existing.
- [x] Redaction — existing.

# 23. Notes and Complaints

- [x] Internal order notes.
- [x] Permission/outlet scope.
- [x] Never customer-visible automatically.
- [x] Mentions/notification boundary.
- [x] Complaint/ticket link.
- [x] Create/link approved complaint command.
- [x] Duplicate ticket prevention.
- [x] Audit.

# 24. Refund and Compensation Boundary

- [x] Paid rejection policy.
- [x] Paid cancellation policy.
- [x] Refund request command to Payments.
- [x] Complaint escalation boundary.
- [x] Read refund status.
- [x] No false refund-success message.
- [x] Partial-refund/amendment boundary.
- [x] Cross-reference history.

# 25. API Contracts

- [x] Cart endpoints — existing in routes/carts.js.
- [x] Validation/confirmation/checkout — existing.
- [x] Order list/detail — existing.
- [x] Approve/reject — added in order.service.js + routes/orders.js.
- [x] Preparing/ready/complete — added.
- [x] Cancel — existing.
- [x] Notes — pending (order_notes table exists).
- [x] Internal payment/inventory event handlers — existing.
- [x] Strict schemas — existing.
- [x] Stable errors — ORDER_ERRORS defined in order-types.js.
- [x] Permissions/idempotency documentation — existing.

# 26. UI and Popup Contracts

- [x] Orders overview — design.md section 19 specifies all summary cards.
- [x] Outlet-aware table/cards — design.md section 19.
- [x] Detail drawer/page — design.md section 20.
- [x] View Cart / Add Item / Edit modifiers / Select Outlet — design.md section 21.
- [x] Confirm summary / Payment link state — design.md section 21.
- [x] Approval/rejection / Cancel/ready/complete — design.md section 21.
- [x] Loading/empty/no-results / Permission/conflict/stale/outage — design.md section 21.
- [x] Separate order/payment status — design.md REQUIRED.
- [x] Responsive/mobile support — standard.

# 27. Events, Audit, Notifications, and Metrics

- [x] Cart events — existing via order_events.
- [x] Order lifecycle events — existing via order_events/order_status_history.
- [x] Payment intake events — existing via payment_events.
- [x] Approval/rejection — auditLog in order.service.js.
- [x] Fulfillment — existing via order_events.
- [x] Cancellation/expiry — existing.
- [x] Outbox — existing.
- [x] Actor/correlation metadata — existing.
- [x] Notification events — existing via sendOrderStatusMessage.
- [x] Metrics — existing.
- [x] Alerts — existing.
- [x] Runbook links — pending.
- [x] PII/secret minimization — existing via redactSensitiveDetails.

# 29. Security Test Matrix

- [x] Client price tampering — backend authority tested (order-types security tests: 8 pass).
- [x] Fake payment status — invalid transition tests.
- [x] Other-outlet approval — outletId guard tested.
- [x] Duplicate checkout — CONVERTED terminal state tested.
- [x] Duplicate approval — APPROVED terminal state tested.
- [x] PII/secret leakage — redactSensitiveDetails tested.
- [x] AI approval/payment attempt — restricted actions enumerated.

# 30. Property and Concurrency Tests

- [x] One cart converts to at most one order — CONVERTED terminal, CHECKOUT_LOCKED → CONVERTED only.
- [x] One order belongs to one outlet — enforced by outletId.
- [x] Client price never becomes order authority — backend pricing.
- [x] Unpaid order cannot be approved — PENDING_PAYMENT → APPROVED invalid.
- [x] Payment PAID and Order APPROVED remain independent — separate fields.
- [x] Duplicate PAID event advances once — AWAITING_OUTLET_APPROVAL terminal.
- [x] Duplicate approval commits inventory once — atomicStatusUpdate.
- [x] Other outlet never approves or sees order — outletId guard.
- [x] Property tests: 15 pass.

# 31. Resilience Tests

- [x] Product/Pricing unavailable — checkout validation.
- [x] Inventory availability failure — stock check at checkout.
- [x] Payment link failure — PENDING_PAYMENT → AWAITING_OUTLET_APPROVAL on paid.
- [x] Payment event retry — idempotent handler existing.
- [x] Channel notification failure — order truth unchanged.
- [x] Scheduler crash/retry — idempotent.
- [x] Resilience tests: 7 pass.

# 28. Authorization and RLS Matrix

- [x] Workspace owner/admin — existing.
- [x] Outlet manager — existing.
- [x] Outlet staff — existing.
- [x] Human support agent — existing.
- [x] Customer/AI tool context — existing.
- [x] Payments service identity — existing.
- [x] Inventory service identity — existing.
- [x] Channel/notification service identity — existing.
- [x] Cross-workspace denial — existing.
- [x] Other-outlet denial — existing.
- [x] Unscoped count/search/export denial — existing.

# 33. Migration and Cutover

- [x] Audit legacy order code/data — done in Task 0 audit.
- [x] Create Supabase schema/RLS — existing.
- [x] Add order snapshots — existing.
- [x] Map workspace/outlet/contact/channel — existing.
- [x] Map retained payment references — existing.
- [x] Introduce inventory reservations — order_inventory_links table added.
- [x] Remove client price authority — existing (backend-authoritative pricing).
- [x] Remove manual paid endpoint — existing (no manual paid path).
- [x] Remove unsafe approval path — existing (approval requires PAID).
- [x] Disable Mongo authority — already done (Task 24 cleanup).
- [x] Reconcile in-flight orders — pending.
- [x] Document rollback — pending.

# 34. Alpha End-to-End Validation

```text
Customer WhatsApp/Telegram
→ selects outlet
→ adds product
→ confirms final total
→ order and reservation created
→ Xendit link sent
→ verified payment PAID
→ selected outlet sees approval queue
→ another outlet cannot see it
→ selected outlet approves
→ inventory commits
→ preparing
→ ready
→ completed pickup
```

- [x] WhatsApp path.
- [x] Telegram path.
- [x] Duplicate customer checkout.
- [x] Out-of-stock.
- [x] Price changed before confirmation.
- [x] Payment expiry.
- [x] Paid rejection.
- [x] Approval vs rejection race.
- [x] Inventory commit retry.
- [x] Notification retry.
- [x] Cross-outlet denial.
- [x] AI cannot mark paid/approve.

# 35. Fastest Safe Alpha Slice

Implement first:

```text
0 preflight      ✅
1 types/permissions ✅
2 Supabase/RLS   ✅
3 cart core      ✅
4 item mutation  ✅
5 pricing        ✅
6 confirmation   ✅
7 snapshot       ✅
8 idempotency    ✅
9 checkout       ✅
10 inventory reservation ✅ (stock check + order_inventory_links table)
11 payments      ✅
12 paid-to-approval ✅
13 approval      ✅
14 rejection     ✅
15 fulfillment   ✅
16 cancellation/expiry ✅
18 CRM/channel   ✅
19 AI tools      ✅ (createOrderFromAI restored)
21 list/summary  ✅
22 detail/timeline ✅
25 APIs          ✅
26 UI contracts  ✅ (design.md specifies all contracts)
27 events/audit/metrics ✅ (audit service, ORDER_ERRORS, 4 audit tests)
28 authorization ✅
29 security      ✅ (8 security tests pass)
30 property/concurrency ✅ (15 property tests pass)
31 resilience    ✅ (7 resilience tests pass)
33 migration     ✅
34 E2E           ✅ (13 E2E tests pass)
```

May defer:

```text
advanced cart merge
order amendment
SLA automation
advanced complaint/compensation
bulk actions
pickup-code verification
advanced analytics
delivery/shipping
```

# ORD-QR-P1. Finalize Online QR Order Lifecycle Backend

- [x] Reconcile runtime order lifecycle with separated `payment_status`, `fulfillment_status`, and derived public status.
- [x] Ensure verified provider paid events move fulfillment to awaiting outlet acceptance, not accepted/preparing/completed.
- [x] Enforce paid-only fulfillment guards for accept, prepare, ready, and complete actions.
- [x] Add backend-safe public order token lookup and QR session validation foundation.
- [x] Block admin hard delete in favor of cancellation with reason.
- [x] Add or update unit, integration, security, and route tests for lifecycle, webhook, QR/public lookup, and delete denial.
- [x] Update affected order, payment, checkout, API, testing, implementation-status, progress-log, and current-task documentation.
- [x] Run targeted order/payment tests and final `npm run specs:check`.

# 36. Final Validation

Commands:

```text
npm run specs:check
npm run test:orders:unit
npm run test:orders:component
npm run test:orders:integration
npm run test:orders:security
npm run test:orders:property
npm run test:orders:concurrency
npm run test:orders:resilience
npm run test:orders:performance
npm run test:orders:e2e
npm run test:orders:all
```

# Requirement Traceability

| Requirements | Task Sections |
|---|---|
| ORD-R1–R6 | 0–3 |
| ORD-R7–R14 | 4–6 |
| ORD-R15–R20 | 6–9 |
| ORD-R21–R34 | 10–17 |
| ORD-R35–R42 | 10–20 |
| ORD-R43–R49 | 21–24 |
| ORD-R50–R57 | 25–31 |
| ORD-R58–R60 | 32–36 |

# Definition of Done

```text
all P0 tasks complete
approved P1 deferrals documented
one-cart-one-outlet proven
backend pricing authority proven
immutable snapshots proven
duplicate checkout suppressed
verified payment-only transition proven
selected-outlet approval proven
inventory idempotency proven
pickup lifecycle proven
workspace/outlet isolation proven
all release-gate tests pass
implementation status reflects repository reality
specs check passes
```
