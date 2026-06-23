---
schema_version: 1
document_type: requirements
spec_id: selaluteh-cart-order-lifecycle
title: SelaluTeh Cart & Order Lifecycle Requirements
status: active
workflow_state: in_progress
version: 1.0.0
updated_at: 2026-06-23
---

# Requirements Document: SelaluTeh Cart & Order Lifecycle

## Introduction

Spec ini mendefinisikan domain cart dan order penuh untuk SelaluTeh Marketplace:

```text
Cart
→ outlet selection
→ item and modifier validation
→ backend pricing
→ customer confirmation
→ inventory reservation
→ order creation
→ Xendit payment link
→ verified payment
→ outlet approval
→ preparation
→ ready for pickup
→ pickup completion
```

Target alpha utama:

```text
Customer orders through WhatsApp or Telegram
→ selects outlet
→ confirms cart and amount
→ receives Xendit link
→ payment becomes PAID from verified webhook
→ selected outlet sees the order
→ selected outlet approves it
```

## Authority and Boundaries

| Area | Authority |
|---|---|
| Cart, checkout, order snapshot, order lifecycle, outlet approval, pickup | This spec |
| Product, variant, modifier, current price | `selaluteh-product-catalog` |
| Stock availability, reservation, commit, release | `selaluteh-inventory-stock-ledger` |
| Payment link, provider truth, refund execution | `selaluteh-payments-xendit` |
| Workspace and outlet permissions | `selaluteh-workspace-access-control` |
| Outlet state and accepts orders | `selaluteh-outlet-management-operations` |
| Provider messaging | `selaluteh-channel-connections-sync` |
| Contact, conversation, human handoff | `selaluteh-crm-inbox-contacts` |
| Complaint/ticket | `selaluteh-complaints-tickets` |
| Immutable admin audit | `selaluteh-audit-activity-timeline` |

## Product Principles

```text
One cart belongs to one outlet.
Customer confirms outlet, items, pickup, and final amount.
Backend is authoritative for price and totals.
Order snapshot is immutable historical truth.
Payment PAID and Order APPROVED are separate facts.
Only the selected outlet can approve the order.
Inventory reservations are idempotent.
Current scope is pickup only.
AI can assist the flow but cannot mark paid or approve.
```

## Requirement Summary

| ID | Requirement | Priority |
|---|---|---|
| ORD-R1 | Spec Authority and Domain Boundary | P0 |
| ORD-R2 | Workspace and Outlet Ownership | P0 |
| ORD-R3 | Cart Identity and Core Fields | P0 |
| ORD-R4 | Active Cart Policy | P0 |
| ORD-R5 | Cart Lifecycle | P0 |
| ORD-R6 | One Cart One Outlet Invariant | P0 |
| ORD-R7 | Product and Variant Snapshot in Cart | P0 |
| ORD-R8 | Backend Pricing Authority | P0 |
| ORD-R9 | Modifier and Customization Validation | P0 |
| ORD-R10 | Cart Quantity and Limit Rules | P0 |
| ORD-R11 | Cart Item Mutation | P0 |
| ORD-R12 | Cart Totals and Price Breakdown | P0 |
| ORD-R13 | Cart Expiry and Abandonment | P1 |
| ORD-R14 | Cart Merge and Conversation Continuity | P1 |
| ORD-R15 | Checkout Preconditions | P0 |
| ORD-R16 | Customer Confirmation | P0 |
| ORD-R17 | Pickup-Only Fulfillment | P0 |
| ORD-R18 | Customer and Pickup Information | P0 |
| ORD-R19 | Order Identity and Numbering | P0 |
| ORD-R20 | Immutable Order Snapshot | P0 |
| ORD-R21 | Order Lifecycle | P0 |
| ORD-R22 | Payment Status Separation | P0 |
| ORD-R23 | Pending Payment State | P0 |
| ORD-R24 | Payment Processing State | P0 |
| ORD-R25 | Paid Order Awaiting Outlet Approval | P0 |
| ORD-R26 | Outlet Approval | P0 |
| ORD-R27 | Outlet Rejection | P0 |
| ORD-R28 | Order Preparation | P0 |
| ORD-R29 | Ready for Pickup | P0 |
| ORD-R30 | Pickup Completion | P0 |
| ORD-R31 | Order Cancellation | P0 |
| ORD-R32 | Order Expiry and Timeouts | P0 |
| ORD-R33 | Order Amendment and Edit Policy | P1 |
| ORD-R34 | Checkout and Order Idempotency | P0 |
| ORD-R35 | Payment Integration | P0 |
| ORD-R36 | Inventory Availability and Reservation | P0 |
| ORD-R37 | Inventory Commit and Release | P0 |
| ORD-R38 | Channel and CRM Integration | P0 |
| ORD-R39 | AI Cart and Order Tools | P0 |
| ORD-R40 | Human-Assisted and Admin Order Creation | P1 |
| ORD-R41 | Outlet Visibility and Approval Queue | P0 |
| ORD-R42 | Order Assignment and Routing | P0 |
| ORD-R43 | Order Search, Filter, Sort, and Pagination | P0 |
| ORD-R44 | Order Overview and Summary Read Model | P0 |
| ORD-R45 | Order Detail Read Model | P0 |
| ORD-R46 | Order Timeline and State History | P0 |
| ORD-R47 | Order Notes and Internal Collaboration | P1 |
| ORD-R48 | Complaint and Ticket Integration | P1 |
| ORD-R49 | Refund and Compensation Boundary | P0 |
| ORD-R50 | Domain Events and Outbox | P0 |
| ORD-R51 | Audit and Operational Activity | P0 |
| ORD-R52 | Notifications and Attention Signals | P1 |
| ORD-R53 | Optimistic Concurrency and Transition Idempotency | P0 |
| ORD-R54 | API Contracts and Error Model | P0 |
| ORD-R55 | Admin UI and Popup State Support | P1 |
| ORD-R56 | Security and Privacy | P0 |
| ORD-R57 | Row-Level Security and Repository Scope | P0 |
| ORD-R58 | Legacy Migration and Cutover | P0 |
| ORD-R59 | Testing and Quality Assurance | P0 |
| ORD-R60 | Scalability, Observability, and Operational Readiness | P0 |

---

# Detailed Requirements

## ORD-R1: Spec Authority and Domain Boundary

**Priority:** P0

### Acceptance Criteria

1. The system shall use this spec as authority for cart identity, checkout, order creation, order snapshots, order lifecycle, outlet approval, pickup fulfillment, cancellation, and order read models.
2. Product Catalog remains authority for current product definitions, prices, modifiers, and outlet availability before snapshot creation.
3. Payments remains authority for payment links, provider status, reconciliation, and refund execution.
4. Inventory remains authority for availability, reservations, stock consumption, and stock release.
5. Workspace Access Control, Outlet Management, Channel Connections, CRM, Complaints, Audit, Notifications, and Analytics remain authoritative for their owned domains.
6. Missing cross-domain contracts shall be recorded as blockers rather than guessed.

## ORD-R2: Workspace and Outlet Ownership

**Priority:** P0

### Acceptance Criteria

1. Every cart and order shall belong to exactly one workspace.
2. Every payable order shall belong to exactly one selected outlet.
3. Workspace and outlet context shall be derived from verified server-side context.
4. Cross-workspace and unauthorized cross-outlet reads, counts, searches, exports, and mutations shall be denied.
5. Historical orders shall retain their original workspace and outlet references.

## ORD-R3: Cart Identity and Core Fields

**Priority:** P0

### Acceptance Criteria

1. A cart shall have a stable internal ID independent from conversation or provider identifiers.
2. A cart shall store workspace, contact, conversation, channel source, selected outlet, status, currency, version, and timestamps.
3. A cart may exist before an outlet is selected, but it shall not become payable without one.
4. Cart identity shall not be derived from display name, phone number, or provider message ID alone.
5. Cart mutation shall use optimistic concurrency.

## ORD-R4: Active Cart Policy

**Priority:** P0

### Acceptance Criteria

1. The system shall define whether one customer may have multiple active carts by workspace, conversation, and outlet.
2. MVP policy shall allow one active cart per customer conversation and selected outlet.
3. Changing outlet shall create or replace the outlet-bound cart according to explicit policy.
4. Duplicate cart-creation commands shall return the existing active cart when payload and context match.
5. Closed, converted, expired, or abandoned carts shall not accept ordinary item mutations.

## ORD-R5: Cart Lifecycle

**Priority:** P0

### Acceptance Criteria

1. Cart statuses shall include DRAFT, ACTIVE, CONFIRMATION_REQUIRED, CONFIRMED, CHECKOUT_LOCKED, CONVERTED, ABANDONED, EXPIRED, and CANCELLED.
2. Transitions shall be explicit and validated.
3. CHECKOUT_LOCKED shall block concurrent item changes while payment/order creation is being finalized.
4. CONVERTED shall reference the created order.
5. Lifecycle transitions shall be idempotent, versioned, and audited.

## ORD-R6: One Cart One Outlet Invariant

**Priority:** P0

### Acceptance Criteria

1. A cart shall contain products for exactly one outlet.
2. Product additions shall be validated against the cart outlet.
3. Changing outlet shall require cart replacement, item revalidation, or explicit customer confirmation according to policy.
4. A mixed-outlet cart shall be rejected server-side.
5. AI and frontend shall not bypass the one-cart-one-outlet invariant.

## ORD-R7: Product and Variant Snapshot in Cart

**Priority:** P0

### Acceptance Criteria

1. Cart items shall reference Product Catalog product and variant IDs.
2. Cart display data shall use current catalog data before checkout.
3. Cart item shall store selected modifiers, requested quantity, outlet context, and a pricing version or quote reference.
4. Archived or unavailable products shall be rejected or marked invalid.
5. Cart validation shall not trust product name, price, or availability supplied by the client or AI.

## ORD-R8: Backend Pricing Authority

**Priority:** P0

### Acceptance Criteria

1. All item prices, modifier prices, discounts, taxes, fees, and totals shall be calculated by backend-owned pricing logic.
2. Frontend, customer message, AI tool arguments, or channel payload shall not be authoritative for price.
3. Money shall use integer minor units and IDR for current scope.
4. A cart total shall be recalculated before customer confirmation and before order creation.
5. A pricing mismatch shall require customer reconfirmation rather than silent acceptance.

## ORD-R9: Modifier and Customization Validation

**Priority:** P0

### Acceptance Criteria

1. Selected modifiers shall be validated against product and outlet configuration.
2. Required modifier groups shall be satisfied.
3. Minimum, maximum, and mutually exclusive selection rules shall be enforced.
4. Unavailable or archived modifier options shall be rejected.
5. Modifier selections shall be snapshotted into the order.

## ORD-R10: Cart Quantity and Limit Rules

**Priority:** P0

### Acceptance Criteria

1. Cart item quantity shall be positive and within configured limits.
2. Per-product, per-order, and per-customer limits may be enforced.
3. Quantity changes shall trigger pricing and availability revalidation.
4. Zero quantity shall remove the item through an explicit operation rather than create an invalid row.
5. Integer and fractional quantities shall follow the product type policy.

## ORD-R11: Cart Item Mutation

**Priority:** P0

### Acceptance Criteria

1. Authorized customer, AI tool, or human agent may add, update, and remove cart items through server-side commands.
2. Mutation shall validate workspace, contact, conversation, outlet, product, modifier, and cart status.
3. Mutation shall support idempotency where channel retries may occur.
4. The command response shall return the complete current cart summary.
5. Duplicate or stale commands shall not create duplicate items or overwrite newer state.

## ORD-R12: Cart Totals and Price Breakdown

**Priority:** P0

### Acceptance Criteria

1. Cart shall expose subtotal, modifier total, discount total, tax total, fee total, and grand total.
2. Each total component shall use a stable calculation order.
3. Rounding shall be deterministic.
4. Unavailable promotion or pricing data shall fail safely.
5. The customer shall see a clear final amount before confirmation.

## ORD-R13: Cart Expiry and Abandonment

**Priority:** P1

### Acceptance Criteria

1. Carts may expire or be marked abandoned after an inactivity period.
2. Expiry shall not create an order or payment.
3. Any provisional inventory hold owned by an abandoned cart shall be released according to Inventory policy.
4. New customer activity may create a new cart or restore an eligible cart according to policy.
5. Expiry jobs shall be idempotent and auditable.

## ORD-R14: Cart Merge and Conversation Continuity

**Priority:** P1

### Acceptance Criteria

1. The system may merge eligible anonymous or duplicate carts when identity becomes known.
2. Merge shall be workspace and outlet safe.
3. Conflicting items, prices, or modifier selections shall require deterministic resolution or customer confirmation.
4. Converted or checkout-locked carts shall not be merged.
5. Merge shall be idempotent and auditable.

## ORD-R15: Checkout Preconditions

**Priority:** P0

### Acceptance Criteria

1. Checkout shall require an ACTIVE or CONFIRMATION_REQUIRED cart with at least one valid item.
2. Selected outlet shall exist, belong to the workspace, be active, and accept orders.
3. Products, variants, modifiers, prices, and availability shall be revalidated.
4. Customer identity and pickup details required for the order shall be present.
5. Existing converted or checkout-locked cart shall block duplicate checkout.

## ORD-R16: Customer Confirmation

**Priority:** P0

### Acceptance Criteria

1. The system shall obtain explicit customer confirmation of outlet, items, quantities, modifiers, pickup method, and final total before order creation.
2. Confirmation may come through WhatsApp, Telegram, or authorized human-assisted flow.
3. AI shall present the final summary before invoking checkout.
4. Material changes after confirmation shall invalidate confirmation and require reconfirmation.
5. Confirmation source, timestamp, and pricing version shall be stored.

## ORD-R17: Pickup-Only Fulfillment

**Priority:** P0

### Acceptance Criteria

1. Current product scope shall support PICKUP only.
2. Delivery, shipping fee, courier selection, and stored delivery address shall not be active.
3. The customer shall select or confirm the pickup outlet for each order.
4. Pickup contact name and phone may be confirmed per transaction.
5. Future delivery support shall require a separate approved specification.

## ORD-R18: Customer and Pickup Information

**Priority:** P0

### Acceptance Criteria

1. Order shall reference the CRM contact and channel identity used for the transaction.
2. Pickup contact data shall be normalized and snapshotted as needed for fulfillment.
3. The system shall not require permanently stored address data for pickup orders.
4. Sensitive customer fields shall be minimized and permission-scoped.
5. Changes to the CRM profile shall not rewrite historical order snapshots.

## ORD-R19: Order Identity and Numbering

**Priority:** P0

### Acceptance Criteria

1. An order shall have a stable internal UUID and a human-readable order number.
2. Order number shall be unique within the configured workspace scope.
3. Order number generation shall be concurrency-safe.
4. Provider, channel, conversation, payment, and external references shall remain separate from the internal order ID.
5. Historical order numbers shall never be reused.

## ORD-R20: Immutable Order Snapshot

**Priority:** P0

### Acceptance Criteria

1. Order creation shall snapshot product name, variant, modifiers, quantities, prices, discounts, taxes, fees, totals, currency, outlet, pickup details, and source channel.
2. Historical order display shall use snapshots rather than current catalog data.
3. Snapshot correction shall require a controlled amendment workflow and audit.
4. Catalog or outlet changes shall not rewrite historical snapshots.
5. Snapshot shall include the pricing and product versions used.

## ORD-R21: Order Lifecycle

**Priority:** P0

### Acceptance Criteria

1. Order statuses shall include PENDING_PAYMENT, PAYMENT_PROCESSING, AWAITING_OUTLET_APPROVAL, APPROVED, PREPARING, READY_FOR_PICKUP, COMPLETED, REJECTED, CANCELLED, and EXPIRED.
2. Transitions shall be explicit and validated.
3. Payment status shall remain a separate field or read model.
4. Order status shall not be inferred from frontend UI state.
5. Every transition shall record actor, reason, timestamp, and version.

## ORD-R22: Payment Status Separation

**Priority:** P0

### Acceptance Criteria

1. Order shall expose payment status from Payments domain without owning provider truth.
2. PAID shall only originate from verified Payments events.
3. Order APPROVED shall not imply payment PAID.
4. Payment PAID shall not imply outlet APPROVED.
5. UI and APIs shall present order and payment states separately.

## ORD-R23: Pending Payment State

**Priority:** P0

### Acceptance Criteria

1. A newly created payable order shall enter PENDING_PAYMENT.
2. Payment-link creation shall be requested from Payments domain.
3. The order shall retain a reference to the payment aggregate.
4. Failure to create a payment link shall not duplicate the order.
5. The customer shall receive a safe retry path.

## ORD-R24: Payment Processing State

**Priority:** P0

### Acceptance Criteria

1. Order may enter PAYMENT_PROCESSING when provider processing is known and not yet final.
2. The state shall not be used to represent unverified customer claims.
3. Timeout or stale processing shall trigger payment reconciliation through Payments domain.
4. The order shall not be outlet-approved while payment remains non-PAID under current policy.
5. Duplicate processing events shall be idempotent.

## ORD-R25: Paid Order Awaiting Outlet Approval

**Priority:** P0

### Acceptance Criteria

1. Verified Payment PAID shall transition the order to AWAITING_OUTLET_APPROVAL exactly once.
2. The selected outlet shall receive the order in its approval queue.
3. Other outlets shall not see or approve the order.
4. Inventory reservation shall remain active while approval is pending.
5. Customer and outlet notifications shall be idempotent.

## ORD-R26: Outlet Approval

**Priority:** P0

### Acceptance Criteria

1. Only an authorized member of the selected outlet may approve an eligible order.
2. Approval shall require Payment PAID under the current policy.
3. Approval shall validate outlet operational state, order version, inventory commit result, and required permissions.
4. Successful approval shall transition to APPROVED and commit inventory according to Inventory policy.
5. Duplicate approval shall have one business effect.
6. Approval actor and timestamp shall be audited.

## ORD-R27: Outlet Rejection

**Priority:** P0

### Acceptance Criteria

1. Only an authorized member of the selected outlet may reject an eligible order.
2. Rejection shall require a reason code and optional note.
3. If unpaid, rejection shall cancel or expire the payable flow according to policy.
4. If paid, rejection shall transition to REJECTED and request the approved compensation or refund workflow without changing payment truth directly.
5. Inventory reservation shall be released exactly once.
6. Customer notification shall explain the next safe step.

## ORD-R28: Order Preparation

**Priority:** P0

### Acceptance Criteria

1. An approved order may transition to PREPARING by an authorized outlet actor or approved automation.
2. Preparation start shall be idempotent.
3. Preparation shall not change payment truth.
4. The system may store preparation start time and estimated ready time.
5. Invalid or cancelled orders shall not enter PREPARING.

## ORD-R29: Ready for Pickup

**Priority:** P0

### Acceptance Criteria

1. An order in APPROVED or PREPARING may transition to READY_FOR_PICKUP according to policy.
2. Ready transition shall record actor and timestamp.
3. Customer notification shall be idempotent and channel-aware.
4. Pickup instructions shall use the selected outlet snapshot.
5. Cancelled or rejected orders shall not become ready.

## ORD-R30: Pickup Completion

**Priority:** P0

### Acceptance Criteria

1. An authorized outlet actor may mark an eligible order COMPLETED after pickup.
2. Completion shall record pickup time and actor.
3. The system may support a pickup code or verification signal without exposing sensitive data.
4. Duplicate completion shall have one effect.
5. Completed orders shall remain immutable except through controlled support workflows.

## ORD-R31: Order Cancellation

**Priority:** P0

### Acceptance Criteria

1. Cancellation eligibility shall depend on order and payment state.
2. Customer, outlet, or admin cancellation permissions shall be distinct.
3. Cancellation shall require a reason.
4. Cancellation shall release inventory reservation when applicable.
5. Paid cancellation shall request refund or compensation through Payments/Complaints policy.
6. Cancellation shall not silently mark a paid payment as unpaid.

## ORD-R32: Order Expiry and Timeouts

**Priority:** P0

### Acceptance Criteria

1. Unpaid orders may expire when the payment link or payable window expires.
2. Approval requests may have a bounded outlet response timeout with a configured escalation or rejection policy.
3. Expiry events shall be idempotent.
4. Expiry shall release inventory reservation exactly once.
5. Late payment events shall trigger reconciliation rather than unsafe state reversal.
6. Customer-facing expiry messages shall be accurate and safe.

## ORD-R33: Order Amendment and Edit Policy

**Priority:** P1

### Acceptance Criteria

1. Order edits shall be permitted only in explicitly allowed states.
2. Material edits shall recalculate price, inventory requirements, payment amount, and customer confirmation.
3. A paid order shall not be edited in place when the amount changes; it shall use an amendment, cancellation, or replacement workflow.
4. Historical snapshots shall remain traceable.
5. Outlet staff shall not silently change customer selections.
6. Amendments shall be versioned and audited.

## ORD-R34: Checkout and Order Idempotency

**Priority:** P0

### Acceptance Criteria

1. Checkout commands shall accept an idempotency key.
2. The same key and payload shall return the same order result.
3. The same key with a different payload shall return an idempotency conflict.
4. Duplicate channel messages or AI retries shall not create duplicate orders.
5. Database constraints shall back application idempotency.
6. One cart shall convert to at most one order.

## ORD-R35: Payment Integration

**Priority:** P0

### Acceptance Criteria

1. Order shall request payment creation with order ID and backend-authoritative payable amount.
2. Payments domain shall return payment ID, link, status, and expiry.
3. Order shall consume verified payment events through idempotent handlers.
4. Order shall never accept client, AI, outlet, or redirect claims as proof of payment.
5. Payment reconciliation shall remain owned by Payments.
6. Payment and order timelines shall cross-reference each other.

## ORD-R36: Inventory Availability and Reservation

**Priority:** P0

### Acceptance Criteria

1. Checkout shall call Inventory availability for the selected outlet and item snapshots.
2. Alpha policy shall reserve inventory when the customer-confirmed order enters payable/payment-link creation.
3. Reservation failure shall prevent or reverse payment-link issuance according to transactional orchestration.
4. Order shall store reservation references and inventory requirement snapshots.
5. Duplicate reservation requests shall not reserve twice.
6. Inventory-not-configured behavior shall follow explicit product policy.

## ORD-R37: Inventory Commit and Release

**Priority:** P0

### Acceptance Criteria

1. Outlet approval shall request inventory commit exactly once under alpha policy.
2. Payment expiry, order rejection, cancellation, or order expiry shall release reservations exactly once.
3. Commit or release failure shall place the order into a recoverable operational state without fabricating success.
4. Order shall not directly mutate stock balances.
5. Inventory reconciliation shall be invoked for unresolved conflicts.
6. Order history shall retain inventory transaction references.

## ORD-R38: Channel and CRM Integration

**Priority:** P0

### Acceptance Criteria

1. Orders shall reference originating contact, conversation, channel connection, and channel identity where available.
2. Order creation and status notifications shall use Channel Connections and CRM contracts.
3. Transport failure shall not change order truth.
4. Duplicate business events shall not send duplicate messages.
5. Human agents shall be able to view linked order context from the conversation.
6. Channel provider details shall not become order authority.

## ORD-R39: AI Cart and Order Tools

**Priority:** P0

### Acceptance Criteria

1. AI may use approved tools such as get_cart, add_cart_item, update_cart_item, remove_cart_item, select_outlet, confirm_cart, create_order, get_order_status, and request_handoff.
2. AI tool input shall use resolved workspace, contact, conversation, and outlet context.
3. AI shall not provide authoritative price, mark payment paid, approve an order, consume stock, or bypass customer confirmation.
4. Off-topic requests shall not invoke order tools.
5. Tool results shall be structured and customer-safe.
6. Human handoff shall remain available.

## ORD-R40: Human-Assisted and Admin Order Creation

**Priority:** P1

### Acceptance Criteria

1. Authorized human agents may create or modify a cart on behalf of a customer.
2. The system shall preserve acting member and customer context.
3. Customer confirmation shall still be required for customer-impacting price or item changes unless an approved exception exists.
4. Admin-created test orders shall be explicitly marked and separated from live reporting.
5. Human-assisted actions shall follow the same pricing, inventory, payment, and outlet rules.
6. Impersonation shall retain the real actor in audit.

## ORD-R41: Outlet Visibility and Approval Queue

**Priority:** P0

### Acceptance Criteria

1. Outlet users shall see only orders assigned to outlets they are allowed to access.
2. Workspace owner/admin may see orders across authorized outlets.
3. Approval queue shall show only eligible AWAITING_OUTLET_APPROVAL orders.
4. Counts and summary cards shall use the same authorization and filters as lists.
5. Other outlets shall not infer order existence through errors or counts.
6. Historical orders remain scoped to their original outlet.

## ORD-R42: Order Assignment and Routing

**Priority:** P0

### Acceptance Criteria

1. Selected outlet shall come from customer confirmation or an approved routing workflow.
2. Nearest-outlet suggestions may be provided but shall not silently finalize the outlet.
3. Order shall not be created for an outlet that is disabled, archived, or not accepting orders.
4. Changing selected outlet before checkout shall revalidate products, price, and inventory.
5. After order creation, outlet reassignment shall require an explicit exceptional workflow.
6. Routing decisions shall be auditable.

## ORD-R43: Order Search, Filter, Sort, and Pagination

**Priority:** P0

### Acceptance Criteria

1. Order list shall support search by order number, customer, contact reference, and safe payment reference.
2. Filters shall support outlet, order status, payment status, channel, date range, approval state, pickup state, and exception state.
3. Sorting and pagination shall be stable.
4. Search, counts, export, and summaries shall respect workspace and outlet scope.
5. Empty and no-results states shall be distinct.
6. Read models shall avoid N+1 queries.

## ORD-R44: Order Overview and Summary Read Model

**Priority:** P0

### Acceptance Criteria

1. Overview shall expose total orders, pending payment, awaiting approval, preparing, ready, completed, rejected/cancelled, and revenue summaries where authorized.
2. Payment revenue shall use Payments-confirmed data.
3. Summary shall support outlet and date filters.
4. Test-mode orders and payments shall be distinguishable.
5. Stale or unavailable external metrics shall be marked rather than treated as zero.
6. Summary calculation shall be scalable.

## ORD-R45: Order Detail Read Model

**Priority:** P0

### Acceptance Criteria

1. Order detail shall include snapshot items, totals, customer/pickup information, outlet, channel, conversation link, payment summary, inventory reservation/commit summary, status history, notes, and capability flags.
2. Payment and order statuses shall be visibly separate.
3. Sensitive fields shall be permission-protected.
4. External service failures shall degrade gracefully.
5. Version shall be returned for conflict-safe actions.
6. Historical snapshots shall remain readable after catalog changes.

## ORD-R46: Order Timeline and State History

**Priority:** P0

### Acceptance Criteria

1. Every order transition and important domain event shall be recorded in a chronological timeline.
2. Timeline shall distinguish customer, human, AI, system, provider, and background-job actors.
3. Provider event time, processing time, and business transition time shall remain distinguishable.
4. Timeline entries shall be immutable or correction-linked.
5. Filters and pagination may be supported for long histories.
6. Audit remains the immutable administrative authority.

## ORD-R47: Order Notes and Internal Collaboration

**Priority:** P1

### Acceptance Criteria

1. Authorized users may add internal notes to an order.
2. Internal notes shall never be sent to customers unless intentionally copied into a customer message.
3. Notes shall be workspace and outlet scoped.
4. Mentions may integrate with Notification Attention Engine.
5. Edits or deletion shall follow strict audit policy.
6. AI access to notes shall require explicit safe permission.

## ORD-R48: Complaint and Ticket Integration

**Priority:** P1

### Acceptance Criteria

1. Orders may link to complaints, support tickets, and customer-service cases.
2. Complaint domain remains authority for ticket lifecycle.
3. Order detail shall show linked complaint summaries according to permission.
4. Rejection, cancellation, missing item, pickup issue, or refund issue may create or link a complaint through an approved command.
5. Duplicate complaint events shall not create duplicate tickets.
6. Complaint failure shall not rewrite order truth.

## ORD-R49: Refund and Compensation Boundary

**Priority:** P0

### Acceptance Criteria

1. Order shall determine business eligibility or request for refund/compensation according to policy, while Payments executes provider refund operations.
2. Paid rejection or cancellation shall not directly set payment REFUNDED.
3. Refund status shall be read from Payments.
4. Partial refund may require item-level amendment or complaint workflow.
5. Customer notifications shall not claim refund success before provider-confirmed success.
6. Refund and order histories shall cross-reference.

## ORD-R50: Domain Events and Outbox

**Priority:** P0

### Acceptance Criteria

1. Cart conversion, order creation, payment-state intake, approval, rejection, preparation, ready, completion, cancellation, expiry, and amendment shall emit versioned domain events.
2. Critical consumers shall use outbox or reliable delivery.
3. Events shall include workspace, outlet, order, contact, actor, correlation, timestamp, and version.
4. Secrets, raw payment payloads, and unnecessary PII shall not be included.
5. Consumers shall be idempotent.
6. Event failure shall not lose order truth.

## ORD-R51: Audit and Operational Activity

**Priority:** P0

### Acceptance Criteria

1. Checkout, pricing changes, outlet selection, approval, rejection, cancellation, amendment, manual intervention, and exceptional recovery shall be audited.
2. Actor attribution shall distinguish customer, human, AI, system, provider event, and background job.
3. Safe before/after state, reason, and correlation shall be retained.
4. High-risk overrides shall require reason and elevated permission.
5. Order timeline may consume safe audit summaries without duplicating authority.
6. Sensitive data shall be minimized.

## ORD-R52: Notifications and Attention Signals

**Priority:** P1

### Acceptance Criteria

1. Order shall emit notification events for payment link, payment success, approval needed, approval, rejection, preparing, ready, completion, cancellation, expiry, and exception states.
2. Notification delivery remains owned by Channel Connections and Notification Attention Engine.
3. Duplicate events shall not create duplicate customer or outlet notifications.
4. Outlet approval attention shall target only authorized outlet recipients.
5. Notification content shall use order snapshots and safe customer data.
6. Delivery failure shall not change order state.

## ORD-R53: Optimistic Concurrency and Transition Idempotency

**Priority:** P0

### Acceptance Criteria

1. Cart and order mutations shall use version checks or equivalent concurrency controls.
2. Every transition command shall be idempotent.
3. Concurrent approval and rejection shall produce one valid outcome.
4. Concurrent cancellation and payment success shall follow deterministic reconciliation rules.
5. Order edit and checkout races shall not create duplicate or mismatched orders.
6. Version conflicts shall return safe latest metadata.

## ORD-R54: API Contracts and Error Model

**Priority:** P0

### Acceptance Criteria

1. APIs shall use strict request and response schemas.
2. Stable errors shall cover invalid cart state, outlet mismatch, product unavailable, pricing changed, insufficient stock, checkout conflict, invalid transition, unpaid approval, outlet scope denial, and version conflict.
3. Mutation APIs shall support idempotency where retry is possible.
4. Errors shall not leak cross-workspace or unauthorized outlet existence.
5. Field-level validation errors shall support UI display.
6. API documentation shall identify required permission and actor type.

## ORD-R55: Admin UI and Popup State Support

**Priority:** P1

### Acceptance Criteria

1. Backend shall support Orders overview, filters, order table/cards, detail drawer/page, approval/rejection dialogs, timeline, payment panel, inventory panel, customer/conversation links, create-order flow, cart popup, add-item browser, cancellation, and exception states.
2. UI shall support loading, skeleton, empty, no-results, permission denial, version conflict, stale data, payment provider outage, inventory conflict, and partial failure.
3. Order and payment status shall be visually separate.
4. Destructive actions shall require confirmation and reason.
5. Capability flags shall remain advisory only.
6. Outlet users shall not receive controls they cannot execute.

## ORD-R56: Security and Privacy

**Priority:** P0

### Acceptance Criteria

1. Workspace and outlet authorization shall be enforced on every order and cart operation.
2. Customer PII shall be minimized and permission-scoped.
3. Payment credentials, raw webhooks, provider secrets, and internal AI prompts shall never appear in order APIs.
4. Client-supplied price, payment status, outlet scope, and actor identity shall be treated as untrusted.
5. Rate limits shall protect checkout, status polling, approval, cancellation, and exports.
6. Security review shall precede production release.

## ORD-R57: Row-Level Security and Repository Scope

**Priority:** P0

### Acceptance Criteria

1. Tenant-owned cart and order tables shall include workspace_id.
2. Repositories shall require workspace and allowed outlet context.
3. Supabase RLS shall provide defense-in-depth.
4. Unscoped repository methods shall be prohibited except reviewed platform jobs.
5. Counts, searches, summaries, exports, timelines, and notes shall use the same scope.
6. RLS tests shall cover carts, cart items, orders, order items, histories, notes, and idempotency records.

## ORD-R58: Legacy Migration and Cutover

**Priority:** P0

### Acceptance Criteria

1. Existing cart, order, complaint, payment, and manual status code shall be audited.
2. Legacy Mongo/Mongoose order data shall not remain authoritative after Supabase cutover.
3. Fresh Supabase test orders may be used because legacy test data is not important.
4. Retained orders shall map workspace, outlet, customer, channel, payment, and status snapshots.
5. Manual paid or unsafe approval paths shall be removed or blocked.
6. Cutover, reconciliation, and rollback shall be documented.

## ORD-R59: Testing and Quality Assurance

**Priority:** P0

### Acceptance Criteria

1. Implementation shall follow TDD.
2. Unit, component, integration, security, property, concurrency, resilience, performance, and end-to-end tests shall be present.
3. Integration tests shall cover Product Catalog, Inventory, Payments, Channel Connections, CRM, Access Control, Outlet Management, Complaints, Audit, and Notifications.
4. Security tests shall cover price tampering, fake payment, cross-outlet approval, duplicate checkout, forged actor context, and PII leakage.
5. Production data, credentials, or real-money payment shall not be used.
6. Skipped critical tests shall block release.

## ORD-R60: Scalability, Observability, and Operational Readiness

**Priority:** P0

### Acceptance Criteria

1. Order number, workspace, outlet, status, payment status, customer, channel, and timestamps shall be indexed.
2. Lists and timelines shall paginate and avoid N+1 queries.
3. Metrics shall cover checkout, payment wait, approval latency, rejection, cancellation, completion, duplicate suppression, and transition failures.
4. Alerts and runbooks shall cover stuck payment, paid-but-not-awaiting-approval, approval backlog, inventory commit failure, notification failure, and state inconsistency.
5. Backup and restore shall preserve order snapshots and history.
6. Disaster recovery shall avoid duplicate orders, payments, inventory consumption, and customer notifications.


---
# Alpha Slice

Minimum alpha:

```text
one active cart per conversation/outlet
customer selects outlet
product/variant/modifier validation
backend pricing and cart totals
explicit cart confirmation
pickup-only
immutable order snapshot
PENDING_PAYMENT
Xendit payment link
verified PAID event
AWAITING_OUTLET_APPROVAL
selected-outlet-only visibility
approve / reject
inventory reservation, commit, release
basic preparation, ready, completed
WhatsApp / Telegram notifications
order list/detail/timeline
workspace/outlet RLS
idempotency, concurrency, resilience, and E2E tests
```

May follow after alpha:

```text
advanced cart merge
order amendment
SLA and approval timeout automation
partial item cancellation
advanced compensation
customer pickup code
bulk order actions
advanced analytics
delivery/shipping in a separate future spec
```

# Definition of Done

1. One cart contains one outlet only.
2. Backend price authority is proven.
3. Duplicate checkout creates one order.
4. Payment PAID only comes from Payments.
5. Selected outlet alone can see and approve.
6. Unpaid order cannot be approved.
7. Inventory reserve, commit, and release are idempotent.
8. Paid rejection does not falsify payment truth.
9. Pickup lifecycle works end to end.
10. Order and payment statuses remain separate.
11. Workspace/outlet RLS and authorization pass.
12. Security, property, concurrency, resilience, performance, and E2E tests pass.
13. `npm run specs:check` passes.

# Final Requirement Statement

```text
Confirmed cart
→ immutable payable order
→ verified payment
→ selected outlet approval
→ pickup fulfillment
```

The system shall never trust client-supplied price or payment state, create duplicate orders from retries, expose an order to the wrong outlet, or allow AI/frontend/admin shortcuts to bypass payment, inventory, approval, and customer-confirmation rules.
