---
schema_version: 1
document_type: requirements
spec_id: selaluteh-inventory-stock-ledger
title: SelaluTeh Inventory & Stock Ledger Requirements
status: active
workflow_state: in_progress
version: 1.0.0
updated_at: 2026-06-23
---

# Requirements Document: SelaluTeh Inventory & Stock Ledger

## Introduction

Spec ini mendefinisikan domain inventory penuh untuk SelaluTeh Marketplace:

```text
Inventory items
Ingredients and finished goods
Outlet stock accounts
Immutable stock ledger
On-hand / reserved / available balances
Order reservations
Consumption
Receipts and adjustments
Waste and returns
Transfers
Stocktakes
Batch and expiry
Low-stock availability
Reconciliation and repair
```

Arsitektur utamanya:

```text
Product Catalog
→ defines what is sold

Inventory
→ defines what physical stock exists
→ where it exists
→ why quantity changed
→ how much is reserved
→ whether an outlet can fulfill an order
```

## Authority and Boundaries

| Area | Authority |
|---|---|
| Inventory items, stock accounts, ledger, balances, reservations, movements, transfers, stocktakes | This spec |
| Products, variants, modifiers, product status | `selaluteh-product-catalog` |
| Order lifecycle | `selaluteh-cart-order-lifecycle` |
| Payments | `selaluteh-payments-xendit` |
| Workspace/outlet permissions | `selaluteh-workspace-access-control` |
| Outlet operational state | `selaluteh-outlet-management-operations` |
| Immutable administrative audit | `selaluteh-audit-activity-timeline` |
| Alerts/attention | `selaluteh-notification-attention-engine` |
| Analytics aggregation | `selaluteh-analytics-read-models` |

## Product Principles

```text
Ledger is append-only.
Balances are projections, not historical truth.
Corrections use compensating entries.
On-hand, reserved, and available are separate.
Inventory definitions are workspace-level; quantities are outlet-level.
One connection between product and stock is explicit.
Negative stock is denied by default.
AI can read stock but cannot mutate it.
Order and payment events are idempotent.
```

## Requirement Summary

| ID | Requirement | Priority |
|---|---|---|
| INV-R1 | Spec Authority and Domain Boundary | P0 |
| INV-R2 | Workspace and Outlet Inventory Ownership | P0 |
| INV-R3 | Inventory Item Identity | P0 |
| INV-R4 | Product and Variant Mapping | P0 |
| INV-R5 | Ingredient and Recipe Model | P1 |
| INV-R6 | Units of Measure | P0 |
| INV-R7 | Unit Conversion Rules | P1 |
| INV-R8 | Inventory Item Lifecycle | P0 |
| INV-R9 | Stock Account Per Outlet | P0 |
| INV-R10 | Immutable Stock Ledger | P0 |
| INV-R11 | Inventory Transaction and Movement Model | P0 |
| INV-R12 | On-Hand, Reserved, and Available Quantity | P0 |
| INV-R13 | Inventory Balance Projection | P0 |
| INV-R14 | Opening Balance | P0 |
| INV-R15 | Stock Receipt and Replenishment | P0 |
| INV-R16 | Manual Stock Adjustment | P0 |
| INV-R17 | Waste, Damage, and Loss | P1 |
| INV-R18 | Customer and Operational Returns | P1 |
| INV-R19 | Inventory Reservation | P0 |
| INV-R20 | Reservation Expiry and Release | P0 |
| INV-R21 | Order Reservation Policy | P0 |
| INV-R22 | Reservation Commit and Consumption | P0 |
| INV-R23 | Recipe-Based Reservation and Consumption | P1 |
| INV-R24 | Direct Product-Level Stock Tracking | P0 |
| INV-R25 | Negative Stock Policy | P0 |
| INV-R26 | Low-Stock and Reorder Thresholds | P1 |
| INV-R27 | Out-of-Stock and Catalog Availability Integration | P0 |
| INV-R28 | Stock Transfer Between Outlets | P1 |
| INV-R29 | Transfer Approval and Segregation of Duties | P1 |
| INV-R30 | Partial Transfer Receipt and Variance | P1 |
| INV-R31 | Stock Count and Stocktake | P0 |
| INV-R32 | Cycle Count and Count Scheduling | P1 |
| INV-R33 | Batch, Lot, and Expiry Tracking | P1 |
| INV-R34 | Quarantine and Quality Hold | P2 |
| INV-R35 | Cost Metadata and Valuation Boundary | P1 |
| INV-R36 | Supplier and Procurement Integration Boundary | P1 |
| INV-R37 | Inventory Search, Filter, Sort, and Pagination | P0 |
| INV-R38 | Inventory Overview Read Model | P0 |
| INV-R39 | Inventory Item Detail and Ledger Timeline | P0 |
| INV-R40 | Reservation Read Model | P1 |
| INV-R41 | Transfer Read Model | P1 |
| INV-R42 | Stocktake Read Model | P1 |
| INV-R43 | AI Inventory Read Tools | P0 |
| INV-R44 | Order Domain Integration | P0 |
| INV-R45 | Payment Domain Integration | P0 |
| INV-R46 | Product Catalog Integration | P0 |
| INV-R47 | Outlet Management Integration | P0 |
| INV-R48 | Authorization and Segregation of Duties | P0 |
| INV-R49 | Row-Level Security and Repository Scope | P0 |
| INV-R50 | API Contracts and Error Model | P0 |
| INV-R51 | Admin UI and State Support | P1 |
| INV-R52 | Domain Events and Outbox | P0 |
| INV-R53 | Audit and Activity Timeline | P0 |
| INV-R54 | Observability, Metrics, and Alerts | P0 |
| INV-R55 | Optimistic Concurrency and Idempotency | P0 |
| INV-R56 | Ledger Reconciliation and Projection Repair | P0 |
| INV-R57 | Legacy Migration and Opening Cutover | P0 |
| INV-R58 | Testing, Scalability, and Operational Readiness | P0 |

---

# Detailed Requirements

## INV-R1: Spec Authority and Domain Boundary

**Priority:** P0

### Acceptance Criteria

1. The system shall use this spec as authority for stock-tracked items, outlet inventory balances, reservations, stock movements, immutable ledger entries, transfers, stock counts, and inventory availability.
2. Product Catalog remains authority for sellable products, variants, modifiers, and catalog visibility.
3. Order domain remains authority for order lifecycle; Inventory only reacts through approved commands and events.
4. Workspace Access Control and Outlet Management remain authoritative for tenant, member, outlet, and operational permissions.
5. Missing cross-domain contracts shall be documented as blockers rather than guessed.

## INV-R2: Workspace and Outlet Inventory Ownership

**Priority:** P0

### Acceptance Criteria

1. Every inventory-owned record shall belong to one workspace.
2. Outlet stock shall be scoped to one outlet within the same workspace.
3. Cross-workspace and unauthorized cross-outlet access shall be denied.
4. Workspace-level stock definitions may be reused across many outlets.
5. Outlet archive or suspension shall block new inventory mutations according to policy while preserving history.

## INV-R3: Inventory Item Identity

**Priority:** P0

### Acceptance Criteria

1. An inventory item shall have a stable internal ID independent from product SKU or provider identifiers.
2. Inventory items shall support types such as FINISHED_GOOD, PRODUCT_VARIANT, INGREDIENT, PACKAGING, ADD_ON, SUPPLY, and OTHER.
3. Item code and normalized name shall be unique within the configured workspace scope.
4. Archived inventory items shall retain all historical ledger references.
5. Inventory item identity shall not be inferred from display name alone.

## INV-R4: Product and Variant Mapping

**Priority:** P0

### Acceptance Criteria

1. Inventory items may map to one or more Product Catalog products or variants through explicit mappings.
2. Product and inventory identifiers shall remain separate.
3. A product may be non-stock-tracked, directly stock-tracked, or recipe-tracked.
4. Mapping changes shall not rewrite historical order or ledger records.
5. Unknown or archived mappings shall fail safely during availability calculation.

## INV-R5: Ingredient and Recipe Model

**Priority:** P1

### Acceptance Criteria

1. The system shall support recipes or bills of materials for products and variants.
2. Recipe components shall reference inventory items and normalized quantities.
3. Recipe versions shall be immutable after use and may be superseded.
4. Variant and modifier choices may add, remove, or replace recipe components.
5. Availability shall be calculable from all required components.
6. Recipe updates shall not alter historical consumption snapshots.

## INV-R6: Units of Measure

**Priority:** P0

### Acceptance Criteria

1. Inventory quantities shall use explicit units of measure.
2. Supported unit categories should include count, mass, volume, and package.
3. Each inventory item shall define a base stock unit.
4. Mutation commands shall reject incompatible units.
5. Display units may differ from base units through approved conversions.
6. Unit labels shall be workspace-safe and versioned where custom.

## INV-R7: Unit Conversion Rules

**Priority:** P1

### Acceptance Criteria

1. Conversions shall be explicit, deterministic, and limited to compatible unit categories.
2. Conversion factors shall use decimal-safe arithmetic.
3. Ingredient-specific density or package conversions shall require an explicit item-level rule.
4. Historical ledger quantities shall remain stored in the base unit.
5. Conversion changes shall not silently rewrite historical records.
6. Rounding policy shall be documented per item and operation.

## INV-R8: Inventory Item Lifecycle

**Priority:** P0

### Acceptance Criteria

1. Inventory item statuses shall include DRAFT, ACTIVE, INACTIVE, and ARCHIVED.
2. Only ACTIVE items may receive ordinary stock mutations.
3. INACTIVE items may remain readable and countable but shall not be used for new product mappings by default.
4. ARCHIVED items shall preserve history and be excluded from normal selection.
5. Lifecycle transitions shall be authorized, versioned, and audited.

## INV-R9: Stock Account Per Outlet

**Priority:** P0

### Acceptance Criteria

1. Each tracked inventory item shall have at most one active stock account per outlet.
2. A stock account shall store workspace, outlet, item, status, negative-stock policy, reorder settings, and version.
3. Stock account creation shall validate that item and outlet belong to the same workspace.
4. Stock account archive shall not delete ledger entries or movements.
5. Duplicate outlet-item accounts shall be prevented by database constraints.

## INV-R10: Immutable Stock Ledger

**Priority:** P0

### Acceptance Criteria

1. The stock ledger shall be append-only for ordinary application operations.
2. Every inventory mutation shall create one or more ledger entries.
3. Ledger entries shall never be edited or deleted to correct stock; corrections require compensating entries.
4. Each entry shall include workspace, outlet, stock account, transaction, movement type, signed quantity, unit, actor, source reference, and timestamp.
5. Ledger integrity shall be protected by database constraints and tests.

## INV-R11: Inventory Transaction and Movement Model

**Priority:** P0

### Acceptance Criteria

1. Related ledger entries shall be grouped under an inventory transaction.
2. Movement types shall include OPENING_BALANCE, RECEIPT, RESERVATION, RESERVATION_RELEASE, SALE_CONSUMPTION, RETURN_IN, ADJUSTMENT_IN, ADJUSTMENT_OUT, WASTE, TRANSFER_OUT, TRANSFER_IN, STOCKTAKE_VARIANCE, and REVERSAL.
3. Transaction status shall include PENDING, POSTED, REVERSED, FAILED, and CANCELLED where appropriate.
4. POSTED transactions shall be immutable.
5. Every reversal shall reference the original transaction.

## INV-R12: On-Hand, Reserved, and Available Quantity

**Priority:** P0

### Acceptance Criteria

1. The system shall distinguish on_hand, reserved, and available quantities.
2. Available quantity shall be computed as on_hand minus active reserved quantity, adjusted by explicit policy.
3. A reservation shall not directly reduce on_hand.
4. Committed consumption shall reduce on_hand and release the matching reservation atomically.
5. Balance projections shall be derived from ledger and reservation records.

## INV-R13: Inventory Balance Projection

**Priority:** P0

### Acceptance Criteria

1. The ledger shall remain the authoritative stock history.
2. The system may maintain inventory_balances as a transactional projection for fast reads.
3. Balance projection shall store on_hand, reserved, available, in_transit, last_ledger_sequence, and version.
4. Projection updates shall occur atomically with posted ledger transactions where feasible.
5. A rebuild process shall be able to recalculate balances from authoritative records.
6. Projection drift shall be detectable and repairable.

## INV-R14: Opening Balance

**Priority:** P0

### Acceptance Criteria

1. Opening balance shall be created only through an explicit authorized transaction.
2. An outlet-item account shall not receive multiple independent opening balances without an adjustment or migration policy.
3. Opening balance shall include source, actor, reason, quantity, unit, and effective time.
4. Negative opening balance shall be rejected by default.
5. Opening balance operations shall be audited.

## INV-R15: Stock Receipt and Replenishment

**Priority:** P0

### Acceptance Criteria

1. Authorized users may record stock receipts into an outlet account.
2. Receipt shall support supplier or external reference metadata without requiring a full procurement module.
3. Receipt quantity, unit, cost metadata, batch, and expiry may be recorded where applicable.
4. Posting a receipt shall increase on_hand exactly once.
5. Duplicate external receipt references shall be idempotent within configured scope.
6. Receipt reversal shall use compensating entries.

## INV-R16: Manual Stock Adjustment

**Priority:** P0

### Acceptance Criteria

1. Authorized users may create positive or negative adjustments with a required reason code.
2. Adjustment shall never overwrite the balance directly.
3. High-risk or high-value adjustments may require approval according to policy.
4. Negative adjustment shall respect negative-stock rules.
5. Every adjustment shall record before/after projection values for audit convenience without replacing ledger truth.
6. AI shall not execute adjustments.

## INV-R17: Waste, Damage, and Loss

**Priority:** P1

### Acceptance Criteria

1. Waste, damage, spoilage, and loss shall be recorded as explicit movement types or reason codes.
2. The system shall support quantity, reason, notes, actor, batch reference, and evidence attachment reference.
3. Posting waste shall reduce on_hand exactly once.
4. Waste reporting shall be outlet-scoped.
5. Waste correction shall use reversal or compensating transaction.

## INV-R18: Customer and Operational Returns

**Priority:** P1

### Acceptance Criteria

1. Approved return flows may create RETURN_IN transactions when physical stock is actually reusable.
2. Refund or order cancellation shall not automatically increase stock without an Inventory command.
3. Returned stock condition shall determine whether it returns to available stock, quarantine, or waste.
4. Return transaction shall reference order, order item, and actor.
5. Duplicate return events shall be idempotent.

## INV-R19: Inventory Reservation

**Priority:** P0

### Acceptance Criteria

1. The system shall support reservations tied to order, order item, outlet, and inventory account.
2. Reservation shall store quantity, unit, status, expiry, idempotency key, and source version.
3. Reservation statuses shall include ACTIVE, COMMITTED, RELEASED, EXPIRED, and CANCELLED.
4. Creating a reservation shall atomically verify sufficient available quantity unless negative availability is explicitly allowed.
5. Duplicate reservation commands shall not reserve twice.
6. Reservation shall be outlet-scoped.

## INV-R20: Reservation Expiry and Release

**Priority:** P0

### Acceptance Criteria

1. Reservations shall support expiry timestamps.
2. Alpha default reservation TTL should align with payment-link expiry plus a bounded approval buffer.
3. Expired, cancelled, rejected, or invalidated orders shall release reservations exactly once.
4. Release shall increase available quantity without changing on_hand.
5. Scheduler and event-driven release shall be idempotent.
6. Late payment or order events shall use reconciliation rules.

## INV-R21: Order Reservation Policy

**Priority:** P0

### Acceptance Criteria

1. The reservation point shall be an explicit system policy.
2. Alpha policy shall reserve stock when a customer-confirmed order enters payment-link generation or equivalent payable state.
3. Payment success shall extend or preserve reservation while awaiting outlet approval.
4. Outlet rejection, payment expiry, or order cancellation shall release the reservation.
5. Order changes shall revalidate and replace reservations safely.
6. The policy shall be versioned and testable.

## INV-R22: Reservation Commit and Consumption

**Priority:** P0

### Acceptance Criteria

1. Committing a reservation shall atomically reduce on_hand, reduce reserved quantity, and create consumption ledger entries.
2. Commit point shall be configurable by order policy, such as OUTLET_APPROVAL, PREPARATION_STARTED, or ORDER_COMPLETED.
3. Alpha default should commit at outlet approval unless the Order spec defines another approved point.
4. Duplicate commit events shall have one business effect.
5. Partial commit shall be explicitly supported or rejected by policy.
6. Commit failure shall not leave reserved and on_hand projections inconsistent.

## INV-R23: Recipe-Based Reservation and Consumption

**Priority:** P1

### Acceptance Criteria

1. For recipe-tracked products, reservation shall expand the order item into versioned recipe component requirements.
2. Variant and modifier selections shall alter component requirements deterministically.
3. The reservation shall store a consumption snapshot independent from future recipe changes.
4. Insufficient stock in any required component shall fail or partially fulfill only according to explicit policy.
5. Commit shall post component-level consumption entries.
6. Recipe calculation shall use decimal-safe quantities.

## INV-R24: Direct Product-Level Stock Tracking

**Priority:** P0

### Acceptance Criteria

1. The system shall support direct stock tracking for finished goods or product variants without recipes.
2. Available sellable quantity shall be derived from the mapped stock account.
3. Order quantity shall reserve and consume the mapped item quantity according to mapping rules.
4. A product may not use both direct and recipe tracking ambiguously.
5. Tracking mode shall be explicit and validated.

## INV-R25: Negative Stock Policy

**Priority:** P0

### Acceptance Criteria

1. Negative on_hand and negative available quantity shall be disallowed by default.
2. A workspace or account may explicitly enable negative stock for selected items or operations only with strong permission.
3. Order reservation and consumption shall fail closed when policy disallows insufficient stock.
4. Manual override shall require reason and audit.
5. Negative-stock state shall trigger operational attention.
6. AI and ordinary outlet staff shall not override the policy.

## INV-R26: Low-Stock and Reorder Thresholds

**Priority:** P1

### Acceptance Criteria

1. Stock accounts may define low-stock threshold, reorder point, target level, and safety stock.
2. Thresholds shall use the item base unit.
3. Low-stock state shall derive from available quantity unless another policy is explicitly configured.
4. Threshold breaches shall emit attention events.
5. Threshold changes shall be versioned and audited.
6. Recommendations shall not automatically place supplier orders.

## INV-R27: Out-of-Stock and Catalog Availability Integration

**Priority:** P0

### Acceptance Criteria

1. Inventory shall expose structured availability signals to Product Catalog and Order validation.
2. Catalog availability shall consider product status, outlet assignment, outlet order acceptance, inventory mapping, reservations, and stock account state.
3. Inventory shall return reason codes such as AVAILABLE, OUT_OF_STOCK, INSUFFICIENT_COMPONENT, INVENTORY_NOT_CONFIGURED, or STOCK_ACCOUNT_INACTIVE.
4. Inventory shall not directly edit Product Catalog visibility fields.
5. Availability caches shall be invalidated after relevant ledger, reservation, mapping, or outlet changes.

## INV-R28: Stock Transfer Between Outlets

**Priority:** P1

### Acceptance Criteria

1. The system shall support transfer requests between outlets in the same workspace.
2. Transfer lifecycle shall include DRAFT, REQUESTED, APPROVED, DISPATCHED, PARTIALLY_RECEIVED, RECEIVED, REJECTED, CANCELLED, and CLOSED.
3. Dispatch shall reduce source on_hand and increase in_transit.
4. Receipt shall reduce in_transit and increase destination on_hand.
5. Source and destination entries shall share one transfer reference.
6. Transfer actions shall enforce outlet permissions and idempotency.

## INV-R29: Transfer Approval and Segregation of Duties

**Priority:** P1

### Acceptance Criteria

1. High-value or cross-region transfers may require approval.
2. The requester and approver may be required to be different actors.
3. Approval policy shall be workspace-configurable.
4. Unauthorized destination outlets shall not be selectable.
5. Rejected or cancelled transfers shall release any held quantity safely.
6. Approval and rejection shall be audited.

## INV-R30: Partial Transfer Receipt and Variance

**Priority:** P1

### Acceptance Criteria

1. Destination may receive less than dispatched quantity with an explicit variance reason.
2. Unreceived quantity shall remain in transit, be returned, or be written off through a controlled workflow.
3. Partial receipt shall be idempotent and cumulative.
4. Over-receipt shall be rejected unless an approved adjustment is used.
5. Transfer closure shall require all quantities to be resolved.
6. Variance shall be visible in transfer detail and audit.

## INV-R31: Stock Count and Stocktake

**Priority:** P0

### Acceptance Criteria

1. Authorized users may create a stocktake session for selected outlets, categories, or items.
2. Stocktake shall record expected quantity, counted quantity, variance, counter, and timestamp.
3. Posting a completed stocktake shall create STOCKTAKE_VARIANCE ledger transactions rather than overwrite balances.
4. Count entry may support blind count to reduce bias.
5. Duplicate posting shall be prevented.
6. Open stocktake behavior during concurrent movements shall follow a documented snapshot or cutoff policy.

## INV-R32: Cycle Count and Count Scheduling

**Priority:** P1

### Acceptance Criteria

1. The system may support recurring cycle-count schedules by item class or outlet.
2. Schedule execution shall create count tasks without changing stock.
3. Missed or overdue counts shall emit attention events.
4. Count frequency may be based on item risk or movement volume.
5. Schedule changes shall be audited.
6. Scheduler retries shall be idempotent.

## INV-R33: Batch, Lot, and Expiry Tracking

**Priority:** P1

### Acceptance Criteria

1. Inventory items may enable batch or lot tracking.
2. Receipts may create batch records with received quantity, manufactured date, and expiry date.
3. Consumption policy may support FIFO or FEFO.
4. Expired or quarantined batches shall not be available for reservation.
5. Batch-level quantity shall reconcile with account-level balance.
6. Batch corrections shall use ledger-backed transactions.

## INV-R34: Quarantine and Quality Hold

**Priority:** P2

### Acceptance Criteria

1. Stock may be placed in quarantine or quality hold.
2. Quarantined quantity shall not be available for order reservation.
3. Release or disposal shall require an explicit authorized transaction.
4. Hold reason, actor, evidence, and timestamps shall be recorded.
5. Batch and non-batch items shall both be supportable.
6. Quality hold shall be visible to authorized operations.

## INV-R35: Cost Metadata and Valuation Boundary

**Priority:** P1

### Acceptance Criteria

1. Receipts and movements may store unit cost metadata for operational reporting.
2. Inventory valuation may support weighted average, FIFO, or another approved method.
3. This spec shall not become a full accounting general ledger.
4. Financial posting and settlement remain outside this domain unless separately specified.
5. Cost visibility shall be permission-controlled.
6. Historical cost snapshots shall not be rewritten by later price changes.

## INV-R36: Supplier and Procurement Integration Boundary

**Priority:** P1

### Acceptance Criteria

1. Receipts may reference supplier, purchase order, or shipment identifiers.
2. Inventory shall not own full supplier contracting or accounts payable.
3. Future Procurement domain may create approved receipt commands.
4. Duplicate external procurement references shall be idempotent.
5. Missing procurement service shall not block authorized manual receipt.
6. Supplier metadata shown in inventory shall be safe and scoped.

## INV-R37: Inventory Search, Filter, Sort, and Pagination

**Priority:** P0

### Acceptance Criteria

1. Inventory lists shall support search by item name, code, mapped product, and safe reference.
2. Filters shall support outlet, item type, lifecycle, stock state, tracking mode, category, batch/expiry, and mapping state.
3. Sorting and pagination shall be stable.
4. Counts and summaries shall use the same authorization and filters.
5. Empty and no-results states shall be distinct.
6. Queries shall avoid N+1 behavior.

## INV-R38: Inventory Overview Read Model

**Priority:** P0

### Acceptance Criteria

1. Overview shall expose on_hand, reserved, available, in_transit, low-stock state, last movement, and stock account status.
2. Workspace users may view all authorized outlets; outlet users shall see assigned outlets only.
3. Summary cards may include total tracked items, low stock, out of stock, expiring soon, and open transfers.
4. Cost values shall require separate permission.
5. The read model shall distinguish unavailable data from zero quantity.
6. Version and last recalculated time shall be available.

## INV-R39: Inventory Item Detail and Ledger Timeline

**Priority:** P0

### Acceptance Criteria

1. Item detail shall show item definition, product mappings, outlet balances, thresholds, recipe usage, batches, reservations, and recent transactions.
2. Ledger timeline shall support movement type, outlet, actor, source, quantity, resulting projection, and timestamp.
3. Entries shall be immutable and paginated.
4. Reversal relationships shall be visible.
5. Sensitive cost or supplier metadata shall be permission-protected.
6. Cross-domain links shall degrade gracefully.

## INV-R40: Reservation Read Model

**Priority:** P1

### Acceptance Criteria

1. Authorized users shall be able to inspect active, expired, committed, and released reservations.
2. Reservation detail shall link to order, order item, outlet, item, quantity, expiry, and status history.
3. Customer PII shall be minimized.
4. Stuck or overdue reservations shall be filterable.
5. Manual release shall require permission and reason.
6. Reservation diagnostics shall not permit manual commit to bypass Order policy.

## INV-R41: Transfer Read Model

**Priority:** P1

### Acceptance Criteria

1. Transfer list and detail shall expose source, destination, items, requested, dispatched, received, variance, lifecycle, actors, and timestamps.
2. Capabilities shall be calculated from status and permissions.
3. Transfer read models shall support outlet and status filtering.
4. Source and destination users shall see only authorized data.
5. Partial receipt and unresolved in-transit quantity shall be prominent.
6. Large transfer histories shall paginate.

## INV-R42: Stocktake Read Model

**Priority:** P1

### Acceptance Criteria

1. Stocktake list and detail shall expose scope, snapshot time, counters, progress, expected, counted, variance, and posting state.
2. Blind-count mode shall hide expected quantity from counters when configured.
3. Posting capability shall require permission and completed validation.
4. Count history shall remain immutable after posting.
5. Variance summaries shall be available by item and outlet.
6. Concurrent movement warnings shall be visible.

## INV-R43: AI Inventory Read Tools

**Priority:** P0

### Acceptance Criteria

1. AI may use structured read-only tools such as check_inventory_availability, get_product_stock_reason, and list_low_stock only when authorized.
2. AI shall not adjust stock, post receipts, commit reservations, approve transfers, or post stocktakes.
3. Tool input shall use resolved workspace, outlet, product, and order context.
4. AI shall not fabricate stock quantity or availability.
5. Off-topic requests shall not invoke inventory tools.
6. Tool results shall return customer-safe reason codes.

## INV-R44: Order Domain Integration

**Priority:** P0

### Acceptance Criteria

1. Order domain shall request availability checks, reservations, replacement, release, and commit through explicit contracts.
2. Inventory shall not directly transition Order status.
3. Each Order command shall include workspace, outlet, order, order version, and idempotency key.
4. Order item snapshots shall carry inventory requirement snapshots where required.
5. Failure responses shall be stable and actionable.
6. Duplicate Order events shall have one inventory business effect.

## INV-R45: Payment Domain Integration

**Priority:** P0

### Acceptance Criteria

1. Payment success shall not directly consume stock unless the configured order policy explicitly uses payment as the commit point.
2. Alpha policy shall preserve reservation after payment while awaiting outlet approval.
3. Payment expiry or cancellation shall contribute to reservation release through Order-approved events.
4. Inventory shall not read or modify payment credentials or payment truth.
5. Late payment events shall be reconciled with Order state before inventory mutation.
6. Duplicate payment events shall not duplicate inventory effects.

## INV-R46: Product Catalog Integration

**Priority:** P0

### Acceptance Criteria

1. Product Catalog shall own product and variant identity.
2. Inventory shall expose mapping, availability, and stock reason data.
3. Product Catalog shall not write ledger entries directly.
4. Catalog archive or mapping changes shall invalidate availability projections safely.
5. Recipe or direct-tracking mode shall be explicit per product or variant.
6. Unknown product mappings shall fail closed for orderability when inventory is required.

## INV-R47: Outlet Management Integration

**Priority:** P0

### Acceptance Criteria

1. Outlet lifecycle, timezone, operating status, and accepts_orders shall come from Outlet Management.
2. Inventory account creation and transfer endpoints shall validate outlet workspace membership.
3. Closed or suspended outlet policy shall determine whether receipts, counts, or transfers remain allowed.
4. Inventory availability shall not override outlet operational closure.
5. Outlet archive shall preserve inventory history.
6. Outlet permission changes shall invalidate access caches.

## INV-R48: Authorization and Segregation of Duties

**Priority:** P0

### Acceptance Criteria

1. Inventory read, adjust, receive, transfer, approve, count, post, and cost-view actions shall use Workspace Access Control.
2. Outlet users shall be limited to assigned outlets.
3. High-risk adjustments, transfer approvals, stocktake posting, and negative-stock overrides shall use separate permissions.
4. Frontend visibility shall not replace backend authorization.
5. Service identities shall be narrowly scoped.
6. Cross-workspace and cross-outlet security tests shall pass.

## INV-R49: Row-Level Security and Repository Scope

**Priority:** P0

### Acceptance Criteria

1. Tenant-owned inventory tables shall include workspace_id.
2. Repositories shall require workspace and permitted outlet context.
3. Supabase RLS shall provide defense-in-depth.
4. Unscoped repository methods shall be prohibited except reviewed platform jobs.
5. Counts, exports, movements, reservations, stocktakes, and transfers shall use the same scope.
6. RLS tests shall cover every inventory-owned table.

## INV-R50: API Contracts and Error Model

**Priority:** P0

### Acceptance Criteria

1. APIs shall use strict schemas, stable errors, authorization, and idempotency.
2. Errors shall cover insufficient stock, inactive account, mapping missing, reservation conflict, transfer conflict, stocktake conflict, invalid unit, negative-stock denial, permission denial, and version conflict.
3. Errors shall not leak cross-workspace or unauthorized outlet existence.
4. Mutation responses shall return transaction IDs and resulting safe projection data.
5. Provider or external-domain raw errors shall be mapped safely.
6. API documentation shall identify required permissions.

## INV-R51: Admin UI and State Support

**Priority:** P1

### Acceptance Criteria

1. Backend shall support Inventory overview, item list, item detail, stock ledger, receive stock, adjust stock, waste, transfer, stocktake, reservation diagnostics, low-stock alerts, and settings.
2. UI shall support loading, skeleton, empty, no-results, permission denial, version conflict, partial failure, stale balance, and external-service outage.
3. Destructive or high-risk operations shall require confirmation and reason.
4. Ledger entries shall not expose an edit action.
5. Cost fields shall be hidden without permission.
6. Capability flags shall remain advisory only.

## INV-R52: Domain Events and Outbox

**Priority:** P0

### Acceptance Criteria

1. Inventory transactions, reservations, transfers, stocktakes, low-stock changes, mapping changes, and balance repairs shall emit versioned events.
2. Critical consumers shall use outbox or reliable delivery.
3. Events shall include workspace, outlet, item, transaction, source reference, actor, correlation, and timestamp.
4. Secrets, raw customer PII, and unnecessary cost data shall not be included.
5. Consumers shall be idempotent.
6. Event failure shall not lose ledger truth.

## INV-R53: Audit and Activity Timeline

**Priority:** P0

### Acceptance Criteria

1. Receipts, adjustments, waste, returns, reservations, releases, commits, transfers, stocktakes, negative overrides, and repairs shall be auditable.
2. Actors shall distinguish human, AI request context, system, migration, and background job.
3. Audit shall record safe before/after projection metadata and reason.
4. Ledger remains the quantity authority while Audit remains the administrative activity authority.
5. High-risk actions shall retain approval metadata.
6. Secrets and unnecessary PII shall be excluded.

## INV-R54: Observability, Metrics, and Alerts

**Priority:** P0

### Acceptance Criteria

1. Metrics shall cover ledger posting, reservation success/failure, insufficient stock, expired reservations, low stock, negative stock, transfer aging, stocktake variance, projection drift, and repair jobs.
2. Metrics shall avoid PII and high-cardinality labels.
3. Logs shall use safe workspace, outlet, item, order, transaction, and correlation IDs.
4. Alerts shall cover ledger-post failures, projection drift, stuck reservations, negative stock, overdue transfers, and stocktake anomalies.
5. Dashboards shall support workspace and outlet operations.
6. Runbooks shall be linked to alerts.

## INV-R55: Optimistic Concurrency and Idempotency

**Priority:** P0

### Acceptance Criteria

1. Stock accounts, balances, reservations, transfers, stocktakes, and configuration changes shall use version or equivalent concurrency controls.
2. All mutation commands shall accept idempotency keys where duplicate delivery is possible.
3. Concurrent reservations shall not oversell when negative stock is disabled.
4. Concurrent commit and release shall produce one final effect.
5. Concurrent transfer receipt and cancellation shall be deterministic.
6. Concurrency tests shall cover all high-risk races.

## INV-R56: Ledger Reconciliation and Projection Repair

**Priority:** P0

### Acceptance Criteria

1. The system shall support recalculating balances from ledger and reservation sources.
2. Reconciliation shall detect missing, duplicated, or inconsistent projection updates.
3. Repair shall never rewrite posted ledger entries.
4. Authorized repair may rebuild projections and record audit/events.
5. Repair jobs shall be workspace/outlet bounded and idempotent.
6. Unresolved integrity conflicts shall block risky mutations and alert operations.

## INV-R57: Legacy Migration and Opening Cutover

**Priority:** P0

### Acceptance Criteria

1. Existing inventory, product stock, availability flags, and order stock behavior shall be audited.
2. Legacy Mongo or ad-hoc stock fields shall not remain authoritative after cutover.
3. Fresh Supabase stock may be initialized through controlled opening balances when legacy data is unimportant.
4. Retained legacy quantities shall produce migration transactions with source references.
5. Product mappings, units, outlet accounts, and negative values shall be validated before cutover.
6. Rollback and reconciliation plans shall be documented.

## INV-R58: Testing, Scalability, and Operational Readiness

**Priority:** P0

### Acceptance Criteria

1. Implementation shall follow TDD with unit, component, integration, security, property, concurrency, resilience, and performance tests.
2. Property tests shall prove ledger immutability, balance equations, no oversell under policy, and one business effect per idempotency key.
3. Performance tests shall cover large ledgers, concurrent reservations, inventory lists, and reconciliation jobs.
4. Production data and secrets shall not be used in tests.
5. Backup, restore, runbooks, ownership, and disaster-recovery tests shall be documented.
6. Skipped critical tests shall block release.


---
# Alpha Slice

Minimum alpha:

```text
workspace inventory items
product/variant direct stock mapping
base unit
outlet stock accounts
append-only ledger
balance projection
opening balance
receipts
manual adjustment
on-hand / reserved / available
order reservation at payable state
reservation expiry/release
payment-success preservation
commit at outlet approval
out-of-stock reason codes
low-stock threshold
inventory overview/detail/ledger
workspace/outlet authorization and RLS
idempotency, concurrency, reconciliation, and E2E tests
```

May follow after alpha:

```text
ingredient recipes
modifier-driven consumption
batch/expiry
waste evidence
returns
transfers
stocktake scheduling
cost valuation
supplier/procurement integration
quarantine
advanced AI/analytics
```

# Definition of Done

1. Ledger is append-only and correction uses compensating entries.
2. Balance equation is consistent.
3. Duplicate commands have one business effect.
4. Concurrent reservations do not oversell when negative stock is disabled.
5. Order/payment events preserve and release reservations correctly.
6. Commit reduces on-hand and reserved atomically.
7. Product availability returns stable reason codes.
8. Workspace and outlet isolation pass.
9. AI cannot mutate stock.
10. Projection can be rebuilt from authoritative sources.
11. Audit, events, metrics, alerts, and runbooks exist.
12. Security, property, concurrency, resilience, and performance tests pass.
13. `npm run specs:check` passes.

# Final Requirement Statement

```text
Physical stock event
→ authorized inventory transaction
→ immutable ledger entries
→ transactional balance projection
→ availability and reservation result
→ order fulfillment decision
```

The system shall never overwrite stock balances without a ledger-backed transaction, silently oversell when policy denies negative stock, or allow a frontend, AI agent, or duplicate event to fabricate inventory quantity.
