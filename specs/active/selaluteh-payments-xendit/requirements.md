---
schema_version: 1
document_type: requirements
spec_id: selaluteh-payments-xendit
title: SelaluTeh Payments — Xendit Requirements
status: active
workflow_state: in_progress
version: 1.0.0
updated_at: 2026-06-22
---

# Requirements Document: SelaluTeh Payments — Xendit

## Introduction

Dokumen ini mendefinisikan kebutuhan lengkap domain **Payments — Xendit** untuk SelaluTeh Marketplace.

Target alpha utama:

```text
Customer confirms order
→ backend creates Xendit Payment Session
→ backend receives payment_link_url
→ link is sent through WhatsApp or Telegram
→ customer pays on Xendit-hosted checkout
→ verified Xendit webhook reaches backend
→ payment becomes PAID
→ order becomes AWAITING_OUTLET_APPROVAL
→ only the selected outlet can see and approve the order
```

Spec ini mencakup target produk penuh, bukan hanya alpha.

---

# 1. Authority and Domain Boundaries

| Domain | Authority |
|---|---|
| Payment aggregate, Xendit provider integration, payment session, payment attempt, webhook processing, reconciliation, refund | `selaluteh-payments-xendit` |
| Order total, order lifecycle, outlet approval, cancellation policy | `selaluteh-cart-order-lifecycle` |
| Workspace, membership, permissions, outlet visibility | `selaluteh-workspace-access-control` |
| Outlet identity and operational status | `selaluteh-outlet-management-operations` |
| Product and price snapshot | `selaluteh-product-catalog` |
| Chat delivery of payment link/status | `selaluteh-channel-connections-sync` |
| AI payment tools | `selaluteh-ai-agent-architecture` |
| AI scope and immutable tool restrictions | `selaluteh-ai-agent-scope-security` |
| Generic notification delivery | `selaluteh-notification-attention-engine` |
| Immutable activity storage | `selaluteh-audit-activity-timeline` |
| Analytics aggregation | `selaluteh-analytics-read-models` |

Payment success and outlet approval are separate facts:

```text
Payment PAID
→ authority: verified Xendit webhook or verified provider reconciliation

Order APPROVED
→ authority: authorized outlet manager/staff
```

---

# 2. Fixed Product Decisions

```text
Provider: Xendit only
No COD
No manual bank-transfer confirmation
No Midtrans
No admin/outlet/AI/frontend "Mark as Paid"

Country: Indonesia
Currency: IDR
Alpha: Xendit Test Mode

Preferred integration:
POST /sessions
session_type = PAY
mode = PAYMENT_LINK
capture_method = AUTOMATIC
allow_save_payment_method = DISABLED

Legacy /v2/invoices:
compatibility adapter only

Credentials:
workspace-level, not outlet-level

Payment amount authority:
backend Order payable snapshot

Paid authority:
verified Xendit webhook or server-side reconciliation
```

---

# 3. Requirement Summary

| ID | Requirement | Priority |
|---|---|---|
| PAY-R1 | Spec Authority and Domain Boundary | P0 |
| PAY-R2 | Xendit-Only Provider Policy | P0 |
| PAY-R3 | Workspace-Level Provider Connection | P0 |
| PAY-R4 | Test and Live Environment Separation | P0 |
| PAY-R5 | Credential and Secret Management | P0 |
| PAY-R6 | Payment Aggregate Identity | P0 |
| PAY-R7 | Order-to-Payment Relationship | P0 |
| PAY-R8 | Internal Payment Status Lifecycle | P0 |
| PAY-R9 | Payment Session and Attempt Model | P0 |
| PAY-R10 | Xendit Payment Session Integration | P0 |
| PAY-R11 | Legacy Payment Link Compatibility Adapter | P1 |
| PAY-R12 | Authoritative Amount and Currency | P0 |
| PAY-R13 | Payment Creation Preconditions | P0 |
| PAY-R14 | Provider Reference and Idempotency | P0 |
| PAY-R15 | Payment Link Storage and Delivery | P0 |
| PAY-R16 | Payment Expiry | P0 |
| PAY-R17 | Resend and Regenerate Payment Link | P0 |
| PAY-R18 | Customer Data and Provider Payload | P0 |
| PAY-R19 | Payment Channel Configuration | P1 |
| PAY-R20 | Return URL and Redirect Handling | P0 |
| PAY-R21 | Webhook Endpoint and Durable Intake | P0 |
| PAY-R22 | Webhook Authentication and Verification | P0 |
| PAY-R23 | Webhook Idempotency and Replay Protection | P0 |
| PAY-R24 | Provider Event Normalization | P0 |
| PAY-R25 | Out-of-Order and Conflicting Events | P0 |
| PAY-R26 | Successful Payment Processing | P0 |
| PAY-R27 | Failed, Expired, and Cancelled Payments | P0 |
| PAY-R28 | Provider Status Lookup and Reconciliation | P0 |
| PAY-R29 | Manual Operations Reconciliation | P1 |
| PAY-R30 | Order Lifecycle Integration | P0 |
| PAY-R31 | Outlet Visibility and Authorization | P0 |
| PAY-R32 | AI and Tool Authorization | P0 |
| PAY-R33 | Channel Notification Integration | P0 |
| PAY-R34 | Payment Operations List Read Model | P1 |
| PAY-R35 | Payment Detail and Timeline Read Model | P1 |
| PAY-R36 | Payment Method and Channel Read Model | P1 |
| PAY-R37 | Refund Eligibility and Request | P1 |
| PAY-R38 | Full and Partial Refund Processing | P1 |
| PAY-R39 | Refund Webhooks and Reconciliation | P1 |
| PAY-R40 | Payment Cancellation | P1 |
| PAY-R41 | Mismatch, Duplicate, and Unknown Payment Handling | P0 |
| PAY-R42 | Dispute and Chargeback Readiness | P2 |
| PAY-R43 | Domain Events and Outbox | P0 |
| PAY-R44 | Audit and Activity Timeline | P0 |
| PAY-R45 | Observability, Metrics, and Alerts | P0 |
| PAY-R46 | Security and Privacy | P0 |
| PAY-R47 | API Contracts and Error Model | P0 |
| PAY-R48 | Admin UI and Popup State Support | P1 |
| PAY-R49 | Optimistic Concurrency, Retry, and Resilience | P0 |
| PAY-R50 | Legacy Migration and Cutover | P0 |
| PAY-R51 | Testing and Quality Assurance | P0 |
| PAY-R52 | Scalability and Performance | P1 |
| PAY-R53 | Operational Readiness and Recovery | P1 |
| PAY-R54 | Provider Contract Versioning | P0 |

---

# 4. Detailed Requirements

## PAY-R1: Spec Authority and Domain Boundary

**Priority:** P0

1. THE System SHALL use this spec as authority for payment records and Xendit integration.
2. THE System SHALL not calculate order totals independently from Order domain.
3. THE System SHALL not own outlet order approval.
4. THE System SHALL not duplicate channel transport or generic authorization.
5. Dedicated specs SHALL override umbrella details within their owned boundary.
6. Provider-specific behavior SHALL remain behind an adapter.
7. Missing external contracts SHALL be marked as blockers rather than guessed.

## PAY-R2: Xendit-Only Provider Policy

**Priority:** P0

1. Xendit SHALL be the only active payment provider.
2. Midtrans, COD, and manual-transfer confirmation SHALL not be active.
3. Admin, outlet, customer, frontend, and AI SHALL not manually mark payment PAID.
4. Provider enum MAY be extensible, but unknown providers SHALL fail closed.
5. UI SHALL not display inactive provider options.
6. A future provider requires a separately approved change/spec.

## PAY-R3: Workspace-Level Provider Connection

**Priority:** P0

1. A Xendit connection SHALL belong to one workspace.
2. Multiple outlets MAY use the same workspace connection.
3. Outlet records SHALL not store provider secrets.
4. Payment records SHALL store both workspace_id and outlet_id.
5. One workspace SHALL have at most one active primary connection per environment unless explicitly expanded.
6. Connection status SHALL be separate from payment status.
7. Cross-workspace connection usage SHALL be denied.
8. Connection changes SHALL be audited.

## PAY-R4: Test and Live Environment Separation

**Priority:** P0

1. TEST and LIVE SHALL be explicitly separated.
2. Test keys SHALL never create live transactions.
3. Live keys SHALL never be used by automated tests.
4. Payment records SHALL store environment.
5. References and idempotency namespaces SHALL avoid test/live collisions.
6. Webhook secrets and URLs SHALL be environment-specific.
7. UI SHALL clearly label TEST MODE.
8. Live activation SHALL require a readiness gate.
9. Test transactions SHALL be excluded from live summaries by default.

## PAY-R5: Credential and Secret Management

**Priority:** P0

1. Xendit secret API key and webhook verification secret SHALL be server-side only.
2. Secrets SHALL be stored through environment/secret-manager references.
3. Raw secrets SHALL not be stored in normal business tables.
4. Secrets SHALL never appear in logs, API responses, AI prompts, frontend bundles, exports, or audit payloads.
5. Secret rotation SHALL be supported.
6. Missing/revoked credentials SHALL fail closed.
7. Production secrets SHALL not be used in local development or CI.
8. Connection diagnostics SHALL never reveal secret values.

## PAY-R6: Payment Aggregate Identity

**Priority:** P0

Payment SHALL include:

```text
id, workspace_id, order_id, outlet_id, customer_id
provider, provider_mode, environment, reference_id
amount_minor, currency, status
paid_amount_minor, refunded_amount_minor
current_session_id, expires_at, paid_at
version, created_at, updated_at
```

1. Payment ID SHALL be stable.
2. Payment SHALL belong to one workspace, order, and outlet.
3. Amount SHALL use integer minor units.
4. Provider IDs SHALL be stored separately from internal ID.
5. Sensitive payment credentials SHALL never be stored.
6. Historical payment SHALL remain readable after outlet/product changes.
7. Payment mutation SHALL use versioning.

## PAY-R7: Order-to-Payment Relationship

**Priority:** P0

1. One order SHALL have at most one active payable payment aggregate.
2. One payment aggregate MAY have multiple sessions/attempts.
3. Amount SHALL equal the Order payable snapshot.
4. Order and payment workspace/outlet SHALL match.
5. Payment SHALL not be created for an unconfirmed cart/order.
6. Already-paid order SHALL block duplicate payment creation.
7. Paid payment SHALL never be detached from its order.
8. Duplicate create MAY return the current active link.
9. Order changes after link creation SHALL follow explicit invalidation/regeneration rules.

## PAY-R8: Internal Payment Status Lifecycle

**Priority:** P0

Statuses:

```text
CREATED
PENDING
PROCESSING
PAID
FAILED
EXPIRED
CANCELLED
REVIEW_REQUIRED
REFUND_PENDING
PARTIALLY_REFUNDED
REFUNDED
DISPUTED
```

1. Transitions SHALL be explicit and validated.
2. PAID SHALL only come from verified provider truth.
3. Unknown provider state SHALL map to REVIEW_REQUIRED.
4. REVIEW_REQUIRED SHALL block automatic fulfillment.
5. Payment status SHALL remain separate from order status.
6. Transition history SHALL be persisted.
7. Duplicate transitions SHALL be idempotent.
8. Status changes SHALL emit events.

## PAY-R9: Payment Session and Attempt Model

**Priority:** P0

1. Payment SHALL support multiple sessions.
2. One session MAY contain multiple provider attempts.
3. Session SHALL store provider_session_id, reference, link, status, expiry, contract version, and generation.
4. Attempt SHALL store provider payment request/payment/capture IDs, channel, amount, status, and provider timestamps.
5. Only one session SHALL be current for delivery.
6. Superseded sessions SHALL not overwrite the current link.
7. Retry within a session SHALL not create duplicate payment aggregate.
8. Session/attempt SHALL not independently mark order paid.

## PAY-R10: Xendit Payment Session Integration

**Priority:** P0

1. Preferred integration SHALL use Xendit Payment Session.
2. Server SHALL create `PAY` + `PAYMENT_LINK` + `AUTOMATIC` capture in `ID`/`IDR`.
3. Saving payment methods SHALL be disabled for current scope.
4. Request reference_id SHALL be backend-generated.
5. Amount SHALL come from Order.
6. Server SHALL store payment_session_id, payment_link_url, and expires_at.
7. Session creation SHALL only occur server-side.
8. Provider response SHALL be schema-validated.
9. Partial/invalid response SHALL not count as successful creation.
10. Provider contract version SHALL be recorded.
11. Ambiguous failures SHALL be recoverable through reconciliation.

## PAY-R11: Legacy Payment Link Compatibility Adapter

**Priority:** P1

1. Legacy `/v2/invoices` MAY exist only as a compatibility adapter.
2. It SHALL not be the preferred new integration.
3. Adapter mode SHALL be configuration-controlled.
4. Legacy external_id SHALL map to internal provider reference.
5. PAID/EXPIRED callbacks SHALL normalize into the common status model.
6. Legacy and Payment Session webhook paths SHALL be distinguishable.
7. One order SHALL not have active links from both adapters simultaneously.
8. Historical legacy records SHALL preserve their adapter mode.
9. Adapter removal criteria SHALL be documented.

## PAY-R12: Authoritative Amount and Currency

**Priority:** P0

1. Order domain SHALL provide payable amount.
2. Frontend, AI, customer, channel, and webhook metadata SHALL not define authoritative amount.
3. Internal amount SHALL use integer minor units.
4. Currency SHALL be IDR.
5. Provider amount/currency SHALL match before PAID.
6. Mismatch SHALL produce REVIEW_REQUIRED.
7. Negative/zero amount SHALL be rejected for current PAY flow.
8. Paid amount SHALL not be silently edited.

## PAY-R13: Payment Creation Preconditions

**Priority:** P0

1. Order SHALL exist and belong to verified workspace/outlet.
2. Order SHALL be customer-confirmed and payable.
3. Order payable amount SHALL be final for the current generation.
4. Provider connection SHALL be configured.
5. Existing PAID payment SHALL block creation.
6. Existing valid link MAY be returned.
7. Actor/tool SHALL have create-link permission.
8. Preconditions SHOULD be checked transactionally.

## PAY-R14: Provider Reference and Idempotency

**Priority:** P0

1. Payment creation SHALL support idempotency keys.
2. Provider reference SHALL be unique and non-PII.
3. Duplicate chat/customer requests SHALL not create duplicate payment.
4. Same key/same payload SHALL return the existing result.
5. Same key/different payload SHALL return IDEMPOTENCY_CONFLICT.
6. Database constraints SHALL back application idempotency.
7. Command and webhook idempotency SHALL use separate namespaces.
8. Test/live references SHALL not collide.

## PAY-R15: Payment Link Storage and Delivery

**Priority:** P0

1. Current active link SHALL be stored on the session record.
2. Link SHALL only be returned to authorized customer/channel/admin contexts.
3. Link SHALL not be logged in full.
4. Delivery SHALL use Channel Connections.
5. Delivery record SHALL track channel, message ID, status, and timestamp.
6. Delivery failure SHALL not recreate payment automatically.
7. Valid link MAY be resent.
8. Expired/cancelled/superseded link SHALL not be presented as active.
9. Link expiry SHALL be exposed safely.

## PAY-R16: Payment Expiry

**Priority:** P0

1. Session SHALL have explicit expires_at.
2. Expiry SHALL be stored from provider response.
3. Customer message SHALL communicate expiry.
4. Provider expiry event SHALL normalize to EXPIRED.
5. Scheduled reconciliation MAY verify stale sessions.
6. Expired payment SHALL not mark order paid.
7. Expired session SHALL not be reactivated.
8. Regeneration SHALL use a new provider reference.

## PAY-R17: Resend and Regenerate Payment Link

**Priority:** P0

1. Resend SHALL reuse a valid current link.
2. Regenerate SHALL create a new session only when required.
3. Regenerate SHALL revalidate order amount/state.
4. Previous session SHOULD be cancelled or marked superseded.
5. Concurrent regeneration SHALL create at most one new current session.
6. Resend/regenerate SHALL be rate-limited.
7. AI MAY request these through authorized tools.
8. Every action SHALL be audited.

## PAY-R18: Customer Data and Provider Payload

**Priority:** P0

1. Only required customer data SHALL be sent to Xendit.
2. Customer references SHALL not expose secrets.
3. Email/mobile SHALL be normalized if supplied.
4. Metadata SHALL contain safe references only.
5. Chat history, AI memory, secrets, and unnecessary PII SHALL not be included.
6. Item data MAY come from immutable Order snapshot.
7. Provider field constraints SHALL be validated.
8. Stored provider payload SHALL be sanitized and access-controlled.

## PAY-R19: Payment Channel Configuration

**Priority:** P1

1. Allowed Xendit channels MAY be workspace/environment-configurable.
2. Only provider-supported channel identifiers SHALL be accepted.
3. Disabled/unavailable channels SHALL not be shown.
4. Provider defaults MAY be used when explicitly configured.
5. Frontend/AI SHALL not invent channel availability.
6. Provider-reported chosen channel SHALL be recorded.
7. Outlet SHALL not own provider credentials.
8. Channel changes SHALL be audited.

## PAY-R20: Return URL and Redirect Handling

**Priority:** P0

1. Success/cancel URLs SHALL be HTTPS outside local development.
2. Redirect SHALL never be payment authority.
3. Return page SHALL fetch backend status.
4. Open-redirect input SHALL be rejected.
5. URLs SHALL be environment-specific.
6. Sensitive tokens SHALL not be placed in query strings.
7. Redirect failure SHALL not affect webhook processing.
8. Closing the hosted page SHALL not corrupt payment state.

## PAY-R21: Webhook Endpoint and Durable Intake

**Priority:** P0

1. Webhooks SHALL be handled server-side.
2. Endpoint SHALL accept supported payment/session/refund events.
3. Raw request bytes and required headers SHALL remain available for verification.
4. Verification SHALL happen before business mutation.
5. Valid event SHALL be durably stored/enqueued before acknowledgement where feasible.
6. Endpoint SHALL return 2XX promptly after safe intake.
7. Business processing SHOULD be asynchronous/bounded.
8. Payload size and rate limits SHALL be enforced.
9. Malformed payload SHALL be rejected safely.
10. Webhook route SHALL be environment/provider specific.

## PAY-R22: Webhook Authentication and Verification

**Priority:** P0

1. Payment/session webhook SHALL verify Xendit callback token or provider-required signature.
2. Verification secret SHALL come from server secret storage.
3. Comparison SHALL be timing-safe where applicable.
4. Invalid/missing verification SHALL produce no mutation.
5. Provider business/environment SHALL match configured connection where available.
6. Test webhook SHALL not mutate live payment.
7. Verification failures SHALL be safely logged and alerted.
8. Verification SHALL be adapter/version-specific and tested.
9. IP allowlisting MAY be additive, not a replacement.

## PAY-R23: Webhook Idempotency and Replay Protection

**Priority:** P0

1. Each webhook SHALL have a deterministic deduplication key.
2. Provider webhook-id SHALL be used when available.
3. Otherwise a safe compound key SHALL be used.
4. Duplicate event SHALL not repeat order transition, notification, refund, or audit effect.
5. Failed processing SHALL be retryable.
6. Event SHALL track RECEIVED, VERIFIED, PROCESSING, PROCESSED, FAILED, or IGNORED.
7. Payload hash SHALL be stored.
8. Deduplication SHALL be environment/workspace aware.
9. Manual replay SHALL require permission and audit.

## PAY-R24: Provider Event Normalization

**Priority:** P0

1. Provider events SHALL normalize into stable internal events.
2. Supported mappings SHOULD include session completed/expired, payment capture/failed, refund success/failure, and compatible legacy paid/expired events.
3. Provider status text SHALL not be used directly as internal status.
4. Unknown events SHALL be retained and ignored/reviewed safely.
5. Required identifiers and amount SHALL be validated.
6. Normalized event SHALL include provider time, received time, IDs, amount, currency, and channel.
7. Mapping SHALL be versioned and contract-tested.
8. Event normalization SHALL not invoke AI.
9. Session completed without adequate payment evidence SHALL trigger reconciliation rather than unsafe PAID.

## PAY-R25: Out-of-Order and Conflicting Events

**Priority:** P0

1. Delayed/out-of-order events SHALL be tolerated.
2. PAID SHALL not be overwritten by stale pending/failed events.
3. Refund/dispute events SHALL match a successful payment.
4. Conflicting amount/currency/reference SHALL produce REVIEW_REQUIRED.
5. Late success after local expiry/cancellation SHALL be reconciled.
6. Duplicate provider ID across different internal payments SHALL trigger incident.
7. Conflict resolution SHALL be deterministic.
8. Fulfillment SHALL stop while review is required.

## PAY-R26: Successful Payment Processing

**Priority:** P0

1. Success SHALL require verified provider event or reconciliation.
2. Session/payment reference SHALL match.
3. Amount, currency, environment, and business/account SHALL match.
4. Payment SHALL transition atomically to PAID.
5. paid_at SHALL use provider-confirmed time when available.
6. Order transition SHALL be emitted exactly once.
7. Customer/outlet notification SHALL trigger exactly once.
8. Duplicate success SHALL be idempotent.
9. Any mismatch SHALL produce REVIEW_REQUIRED.
10. PAID SHALL not automatically mean Order APPROVED.

## PAY-R27: Failed, Expired, and Cancelled Payments

**Priority:** P0

1. Verified failure SHALL update attempt/session/aggregate according to policy.
2. One failed attempt MAY leave the session retryable.
3. Session expiry SHALL produce EXPIRED when no success exists.
4. Cancellation SHALL invalidate the session where supported.
5. Customer SHALL receive safe retry guidance.
6. Order SHALL remain unpaid.
7. Failure reason SHALL be normalized and sanitized.
8. Retry/regenerate availability SHALL be calculated.
9. Transitions SHALL emit events.

## PAY-R28: Provider Status Lookup and Reconciliation

**Priority:** P0

1. Backend SHALL support provider session/payment lookup.
2. Lookup SHALL use server credentials.
3. Polling SHALL not replace webhooks as primary mechanism.
4. Reconciliation SHALL validate reference, amount, currency, and environment.
5. Reconciliation MAY correct stale local state using documented rules.
6. PAID SHALL not be downgraded.
7. Unknown/mismatch SHALL produce REVIEW_REQUIRED.
8. Jobs SHALL be rate-limited and retry-safe.
9. Customer status checks MAY trigger bounded reconciliation when stale.
10. last_reconciled_at SHALL be visible to authorized operations.

## PAY-R29: Manual Operations Reconciliation

**Priority:** P1

1. Authorized finance/admin MAY request reconciliation.
2. Outlet staff SHALL not reconcile unless explicitly permitted.
3. Reconciliation SHALL fetch provider truth, not accept typed status.
4. Action/result/reason SHALL be recorded.
5. Reconciliation SHALL be idempotent.
6. REVIEW_REQUIRED SHALL be filterable.
7. Result SHALL not expose secrets.
8. Action SHALL be audited.
9. UI SHALL not label reconciliation as Mark as Paid.

## PAY-R30: Order Lifecycle Integration

**Priority:** P0

1. Order SHALL enter PENDING_PAYMENT before link delivery.
2. Payment PAID SHALL request Order transition to AWAITING_OUTLET_APPROVAL or agreed equivalent.
3. Transition SHALL use Order API/event, not unsafe direct mutation.
4. Order transition failure SHALL be retryable.
5. Payment failure/expiry/cancellation SHALL use Order contract.
6. Paid payment SHALL remain paid if the order is later rejected/cancelled; refund policy applies.
7. Timelines SHALL cross-reference each other.
8. Outlet approval of unpaid order SHALL be denied under current policy.

## PAY-R31: Outlet Visibility and Authorization

**Priority:** P0

1. Payment SHALL inherit outlet_id from order.
2. Outlet users MAY read only assigned-outlet payments and allowed fields.
3. Owner/admin MAY read across authorized outlet scope.
4. Other outlets SHALL not see existence.
5. Outlet users SHALL not mark payment PAID.
6. Refund/reconcile SHALL use separate permissions.
7. Provider secret/raw payload SHALL never be exposed to outlet users.
8. List/count/export SHALL respect outlet scope.
9. Historical payment SHALL remain scoped to its original outlet.

## PAY-R32: AI and Tool Authorization

**Priority:** P0

Allowed tools MAY include:

```text
create_payment_link
resend_payment_link
get_payment_status
```

1. AI SHALL use Tool Gateway.
2. Context SHALL come from current workspace/outlet/customer/order.
3. AI SHALL not provide authoritative amount.
4. AI SHALL not set PAID, REFUNDED, or reconciliation outcome.
5. AI SHALL not access secrets/raw webhooks.
6. AI SHALL not create link for another customer/order.
7. Off-topic requests SHALL not invoke payment tools.
8. Tool output SHALL be structured and customer-safe.
9. Human handoff SHALL remain available.

## PAY-R33: Channel Notification Integration

**Priority:** P0

1. Payment link SHALL be deliverable through WhatsApp and Telegram.
2. Payload SHALL include order number, amount, expiry, and link.
3. Success message SHALL include current order status.
4. Failure/expiry MAY include retry guidance.
5. Delivery SHALL be idempotent.
6. Message ID/status SHALL be recorded.
7. Delivery failure SHALL not change payment truth.
8. Duplicate webhooks SHALL not send duplicate success message.
9. Sensitive provider payload SHALL not be sent.

## PAY-R34: Payment Operations List Read Model

**Priority:** P1

List SHALL support:

```text
order/reference/customer search
status
outlet
environment
date range
payment channel
amount range
review required
refund status
sort
pagination
```

1. List and summary SHALL respect workspace/outlet scope.
2. TEST and LIVE SHALL be separated.
3. Raw provider payload SHALL not be exposed.
4. Normalized statuses SHALL be used.
5. Stale/review records SHALL be visible.
6. Pagination SHALL be stable.
7. Export SHALL use separate permission.
8. Empty/no-results SHALL be distinct.
9. Read model SHALL avoid N+1.

## PAY-R35: Payment Detail and Timeline Read Model

**Priority:** P1

Detail SHALL include:

```text
payment, order, outlet, customer-safe identity
amount/currency and normalized status
provider/session IDs
current link and expiry when authorized
attempts
webhook/timeline summary
reconciliation history
refunds
notifications
capability flags
version
```

1. Detail SHALL be authorized/scoped.
2. Secrets/card data SHALL never appear.
3. Raw webhook body SHALL be privileged and redacted.
4. Order approval SHALL be displayed separately.
5. Current and superseded sessions SHALL be distinguishable.
6. Provider time and processing time SHALL be distinct.
7. Review reason SHALL be safe/actionable.
8. Version SHALL support conflict-safe actions.

## PAY-R36: Payment Method and Channel Read Model

**Priority:** P1

1. Provider-reported channel code/name MAY be stored.
2. Display SHALL use a safe normalized label.
3. Card/account secrets SHALL not be stored.
4. Allowed masked provider details MAY be displayed.
5. Unknown channel SHALL display Unknown.
6. Channel mapping SHALL be versioned.
7. AI MAY report only a safe method label.
8. Saved payment methods SHALL not be implied.

## PAY-R37: Refund Eligibility and Request

**Priority:** P1

1. Refund SHALL require verified successful payment.
2. Eligibility SHALL depend on provider/channel support.
3. Amount SHALL not exceed remaining refundable balance.
4. Refund SHALL return to original method.
5. Explicit permission and reason SHALL be required.
6. Customer request SHALL not directly execute provider refund without authorized workflow.
7. Business approval SHALL come from Order/Complaint policy.
8. Request SHALL be idempotent and audited.
9. AI SHALL not execute refund.

## PAY-R38: Full and Partial Refund Processing

**Priority:** P1

1. Full refund SHALL be supported when channel supports it.
2. Partial refund MAY be supported when channel supports it.
3. Provider payment request/payment ID SHALL be used as required.
4. Amount/currency SHALL be server-validated.
5. Refund statuses SHALL be REQUESTED, PROCESSING, SUCCEEDED, FAILED, and optional CANCELLED.
6. Successful partial refund SHALL update PARTIALLY_REFUNDED.
7. Fully refunded total SHALL update REFUNDED.
8. Concurrent refunds SHALL not exceed remaining amount.
9. Duplicate requests SHALL be idempotent.
10. Processing time SHALL not be promised as instant.

## PAY-R39: Refund Webhooks and Reconciliation

**Priority:** P1

1. Refund events SHALL use verified webhook intake.
2. Status SHALL be normalized.
3. Duplicate/out-of-order events SHALL be safe.
4. Amount/reference SHALL match.
5. Refund failure SHALL preserve original paid truth.
6. Refund reconciliation SHALL use provider lookup where available.
7. Timeline/notification/audit SHALL be updated.
8. Unknown event SHALL move refund to review.

## PAY-R40: Payment Cancellation

**Priority:** P1

1. Pending payment/session MAY be cancelled when supported.
2. PAID SHALL not be cancelled; refund applies.
3. Eligibility SHALL validate order/payment state and permission.
4. Cancellation SHALL be server-side.
5. Provider result SHALL be stored.
6. Link SHALL be invalidated/superseded.
7. Duplicate cancellation SHALL be idempotent.
8. Late success SHALL trigger reconciliation/review.
9. AI cancellation is not exposed by default.

## PAY-R41: Mismatch, Duplicate, and Unknown Payment Handling

**Priority:** P0

1. Amount, currency, business, environment, or reference mismatch SHALL never auto-mark PAID.
2. Unknown order/reference SHALL be retained as unmatched event and alerted.
3. Duplicate provider payment for one order SHALL trigger review.
4. One provider payment linked to multiple orders SHALL be blocked.
5. Overpayment/underpayment SHALL produce REVIEW_REQUIRED.
6. Unknown status/event SHALL be retained and reviewed.
7. Fulfillment SHALL be blocked while unresolved.
8. Resolution SHALL be audited and SHALL not become a hidden manual-paid toggle.

## PAY-R42: Dispute and Chargeback Readiness

**Priority:** P2

1. Data model SHALL support dispute/chargeback reference.
2. Dispute state SHALL not erase payment history.
3. Provider normalization MAY add DISPUTED.
4. Evidence workflow is out of current scope.
5. Unknown dispute event SHALL be retained for review.

## PAY-R43: Domain Events and Outbox

**Priority:** P0

Events SHOULD include:

```text
PAYMENT_CREATED
PAYMENT_SESSION_CREATED
PAYMENT_LINK_DELIVERED
PAYMENT_PROCESSING
PAYMENT_PAID
PAYMENT_FAILED
PAYMENT_EXPIRED
PAYMENT_CANCELLED
PAYMENT_REVIEW_REQUIRED
PAYMENT_RECONCILED
REFUND_REQUESTED
REFUND_SUCCEEDED
REFUND_FAILED
```

1. State transitions SHALL emit events.
2. Events SHALL include safe workspace/order/outlet/payment/provider references, amount, currency, correlation, and timestamp.
3. Secrets/raw card data SHALL not appear.
4. Outbox/reliable delivery SHALL be used for critical consumers.
5. Consumers SHALL be idempotent.
6. Event version SHALL be explicit.
7. Event failure SHALL not lose payment truth.

## PAY-R44: Audit and Activity Timeline

**Priority:** P0

1. Creation, link regeneration, reconciliation, cancellation, and refund SHALL be audited.
2. Status changes SHALL be auditable.
3. Actor SHALL distinguish human, AI, provider webhook, and background job.
4. Safe before/after metadata SHALL be recorded.
5. Secrets, callback tokens, and full links SHALL be redacted.
6. Webhook process timeline SHALL be available to privileged operations.
7. Outlet users SHALL see only authorized activity.
8. Support impersonation SHALL preserve real actor attribution.

## PAY-R45: Observability, Metrics, and Alerts

**Priority:** P0

Metrics SHOULD cover:

```text
session creation success/failure
link delivery failure
webhook receive/verify/duplicate/process
paid/failed/expired/review
reconciliation/refund
provider latency
webhook processing latency
queue/outbox backlog
```

1. Metrics SHALL avoid PII/high-cardinality labels.
2. Logs SHALL use safe correlation IDs.
3. Secrets, full link, and raw customer data SHALL be redacted.
4. Alerts SHALL cover verification failures, webhook backlog, provider outage, review spikes, and failed order transition.
5. TEST and LIVE SHALL be separated.
6. Trace SHALL cover order → link → webhook → paid → order transition.
7. Runbooks SHALL be linked to alerts.

## PAY-R46: Security and Privacy

**Priority:** P0

1. Payment processing SHALL be server-side.
2. Current integration SHALL use Xendit-hosted checkout.
3. Backend SHALL not collect/store card number or CVV.
4. Secrets SHALL be server-only.
5. Redirect SHALL not be trusted.
6. Webhooks SHALL be verified.
7. Amount SHALL be backend-authoritative.
8. Workspace/outlet authorization SHALL be enforced.
9. Open redirect and URL misuse SHALL be mitigated.
10. Rate limits SHALL protect create/resend/reconcile/refund/webhook routes.
11. PII SHALL be minimized and redacted.
12. Raw payload retention SHALL be bounded and protected.
13. AI SHALL not receive secrets/raw payment payloads.
14. Security review SHALL precede LIVE activation.

## PAY-R47: API Contracts and Error Model

**Priority:** P0

Suggested APIs:

```text
POST /api/orders/:orderId/payment
GET  /api/orders/:orderId/payment
POST /api/payments/:paymentId/resend-link
POST /api/payments/:paymentId/regenerate-link
GET  /api/payments
GET  /api/payments/:paymentId
POST /api/payments/:paymentId/reconcile
POST /api/payments/:paymentId/cancel
POST /api/payments/:paymentId/refunds
GET  /api/payments/:paymentId/refunds
POST /api/webhooks/xendit/payment-session
POST /api/webhooks/xendit/payment
POST /api/webhooks/xendit/refund
```

Stable errors SHALL include:

```text
PAYMENT_NOT_FOUND
PAYMENT_ALREADY_PAID
ORDER_NOT_PAYABLE
PAYMENT_ALREADY_ACTIVE
PAYMENT_LINK_EXPIRED
PAYMENT_PROVIDER_UNAVAILABLE
PAYMENT_CONFIGURATION_MISSING
PAYMENT_AMOUNT_MISMATCH
PAYMENT_CURRENCY_MISMATCH
PAYMENT_REVIEW_REQUIRED
WEBHOOK_VERIFICATION_FAILED
WEBHOOK_DUPLICATE
REFUND_NOT_SUPPORTED
REFUND_AMOUNT_INVALID
REFUND_EXCEEDS_AVAILABLE
OUTLET_SCOPE_DENIED
PERMISSION_DENIED
VERSION_CONFLICT
IDEMPOTENCY_CONFLICT
```

1. APIs SHALL use strict schemas.
2. Required permissions SHALL be documented.
3. Mutations SHALL support idempotency.
4. Errors SHALL not leak cross-workspace existence or secrets.
5. Responses SHALL distinguish payment and order status.
6. Provider errors SHALL map to safe internal errors.

## PAY-R48: Admin UI and Popup State Support

**Priority:** P1

Backend SHALL support:

```text
Payments overview
summary cards
payment list
filters
detail drawer/page
current link and expiry
resend/regenerate confirmation
reconciliation modal
refund modal and timeline
webhook health panel
review-required queue
TEST MODE banner
empty/no-results/loading/error
permission denied
version conflict
provider outage
```

1. Cards/list SHALL respect scope.
2. Payment and order status SHALL be separate.
3. Test mode SHALL be obvious.
4. Reconcile SHALL not be labeled Mark as Paid.
5. Refund UI SHALL show eligibility and remaining amount.
6. Raw payload SHALL not be exposed by default.
7. Capability flags SHALL be advisory only.
8. Payment page SHALL support operations even if Order page also shows payment state.

## PAY-R49: Optimistic Concurrency, Retry, and Resilience

**Priority:** P0

1. Payment aggregate SHALL use versioning.
2. Concurrent create/regenerate/reconcile/refund SHALL not duplicate side effects.
3. Provider retries SHALL be bounded and safe.
4. Ambiguous non-idempotent failures SHALL reconcile before retry.
5. Webhook processing SHALL retry safely.
6. Order transition failure after PAID SHALL retry through outbox.
7. Notification failure SHALL not roll back payment truth.
8. Queue/cache outage SHALL never create false PAID.
9. Circuit-breaker/timeout policy SHALL be documented.
10. Dead-letter/review queue SHALL handle exhausted failures.
11. Concurrency tests SHALL cover late webhooks and regeneration races.

## PAY-R50: Legacy Migration and Cutover

**Priority:** P0

1. Existing payment code/models/routes SHALL be audited.
2. Midtrans references SHALL be removed from active MVP paths.
3. Legacy Xendit invoice history SHALL remain identifiable.
4. Fresh Supabase test data MAY be used because legacy Mongo data is unimportant.
5. Mongo/Mongoose SHALL not remain payment authority after cutover.
6. Adapter mode SHALL be explicit.
7. Test webhook URL/token SHALL be verified before cutover.
8. Cutover SHALL include rollback and reconciliation.
9. Implementation status SHALL reflect repository reality.

## PAY-R51: Testing and Quality Assurance

**Priority:** P0

1. Implementation SHALL follow TDD.
2. Unit tests SHALL cover mapping, amount validation, lifecycle, idempotency, ordering, and refund calculation.
3. Component tests SHALL cover session creation, webhook processing, reconciliation, Order transition, and notification.
4. Integration tests SHALL cover Supabase, Xendit Test adapter, Order, Access Control, Tool Gateway, and channels.
5. Security tests SHALL cover forged webhooks, replay, tampering, secret leakage, cross-workspace/outlet, and redirects.
6. Property tests SHALL verify PAID and refund invariants.
7. Concurrency tests SHALL cover duplicate webhooks, simultaneous create/regenerate, late success, and concurrent refunds.
8. Resilience tests SHALL cover provider/queue/DB/order/notification failures.
9. Performance tests SHALL cover webhook bursts and payment queries.
10. Automated tests SHALL never use live keys or real money.
11. Skipped critical tests SHALL block release.

## PAY-R52: Scalability and Performance

**Priority:** P1

1. Payment/order/reference/provider IDs SHALL be indexed.
2. Webhook intake SHALL support burst traffic.
3. Lists SHALL paginate.
4. Reconciliation SHALL use bounded batches.
5. Provider concurrency SHALL respect limits.
6. Read models SHALL avoid N+1.
7. Outbox/queue processing SHALL be horizontally scalable and idempotent.
8. Backlog/latency SHALL be monitored.
9. Scale tests SHALL use synthetic data.
10. Multi-workspace/outlet growth SHALL not require schema rewrite.

## PAY-R53: Operational Readiness and Recovery

**Priority:** P1

1. Payment data SHALL be backed up.
2. Restore SHALL preserve workspace/order references.
3. Runbooks SHALL cover provider outage, webhook failures/backlog, duplicate events, PAID-but-order-not-advanced, review mismatch, refund failure, and secret rotation.
4. Webhook replay SHALL be authorized and audited.
5. Reconciliation tooling SHALL be available.
6. TEST-to-LIVE checklist SHALL be documented.
7. Monitoring ownership SHALL be assigned.
8. Disaster recovery SHALL verify no duplicate fulfillment.
9. Provider contract changes SHALL trigger review.
10. Production activation SHALL require security/business sign-off.

## PAY-R54: Provider Contract Versioning

**Priority:** P0

1. Xendit API endpoint/version SHALL be recorded.
2. Request/response/webhook schemas SHALL be adapter-versioned.
3. Contract tests SHALL detect breaking changes.
4. Unknown fields MAY be tolerated safely; missing required fields SHALL fail.
5. Official provider docs SHALL be revalidated before implementation and LIVE release.
6. Legacy and Payment Session adapters SHALL have separate mappings.
7. Provider version changes SHALL not silently alter internal statuses.
8. Last verified documentation date SHALL be recorded.

---

# 5. Alpha Slice

Minimum alpha slice:

```text
Xendit Test Mode connection
workspace-level secret reference
Payment Session PAY + PAYMENT_LINK
IDR amount from Order
one active payment per order
create/send link through WhatsApp/Telegram
expiry, resend, regenerate
verified webhook
duplicate/out-of-order protection
amount/reference/environment verification
payment PAID
order AWAITING_OUTLET_APPROVAL
selected outlet visibility
other outlet denial
no outlet/admin/AI mark-paid
basic payment list/detail
audit, metrics, and critical tests
```

May follow after alpha:

```text
legacy adapter unless needed
payment-channel customization
refunds and partial refunds
advanced reconciliation UI
review queue
dispute readiness
live activation
advanced analytics
```

---

# 6. Definition of Done

A requirement is complete only when:

1. tests are written first;
2. TEST/LIVE isolation passes;
3. secrets never reach client/AI/logs;
4. amount comes from Order;
5. duplicate create does not duplicate payment;
6. link flow works safely;
7. verified webhook is mandatory;
8. duplicate/out-of-order events are safe;
9. PAID only comes from verified provider truth;
10. amount/currency/reference/environment match;
11. payment and order approval remain separate;
12. outlet scope passes;
13. Order transition has exactly-once business effect;
14. reconciliation works;
15. refunds never exceed paid amount when enabled;
16. audit/events/metrics/runbooks exist;
17. security/property/concurrency/resilience tests pass;
18. no live key or real-money automated test is used;
19. provider contract is revalidated;
20. `npm run specs:check` passes.

---

# 7. Final Requirement Statement

```text
Order payable amount
→ Xendit Payment Session
→ hosted payment link
→ WhatsApp / Telegram delivery
→ verified webhook
→ normalized payment state
→ PAID
→ Order awaits outlet approval
```

The system SHALL never trust a frontend redirect, AI statement, outlet action, manually typed status, or unverified webhook as proof that money has been received.
