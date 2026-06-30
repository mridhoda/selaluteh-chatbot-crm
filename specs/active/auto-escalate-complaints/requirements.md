---
schema_version: 1
document_type: requirements
spec_id: auto-escalate-complaints
title: SelaluTeh Auto Escalate Complaints Requirements
status: active
workflow_state: in_progress
version: 1.0.0
updated_at: 2026-06-25
---

# Requirements Document: SelaluTeh Auto Escalate Complaints

## Introduction

Spec ini mendefinisikan fitur otomatis meneruskan complaint kepada supervisor outlet terkait:

```text
Complaint dibuat atau berubah
→ outlet complaint di-resolve
→ policy workspace + override outlet dibaca
→ trigger dievaluasi
→ supervisor outlet dipilih
→ escalation dibuat
→ supervisor mendapat notification
→ supervisor acknowledge dan memberi internal response
→ CS menyampaikan jawaban resmi kepada customer
```

Complaint tetap satu record. Sistem tidak membuat ticket duplikat.

## Authority and Boundaries

| Area | Authority |
|---|---|
| Complaint identity, status, customer communication, resolution | Complaints domain |
| Auto/manual escalation, routing, supervisor SLA, response workflow | This spec |
| Order outlet | `selaluteh-cart-order-lifecycle` |
| Outlet and supervisor membership | `selaluteh-outlet-management-operations` |
| Roles and permissions | `selaluteh-workspace-access-control` |
| In-app and external notification delivery | `selaluteh-notification-attention-engine` |
| Contact, conversation, channel messaging | `selaluteh-crm-inbox-contacts` |
| Administrative audit | `selaluteh-audit-activity-timeline` |

## Product Principles

```text
Complaint is not duplicated.
Complaint status and escalation status are separate.
The related order outlet is the preferred routing source.
The supervisor is resolved from membership data, never hard-coded.
CS remains the primary customer communicator by default.
Supervisor responses are internal by default.
One complaint has at most one active escalation per level/outlet.
Auto escalation is configuration driven and auditable.
No eligible supervisor triggers fallback and attention, not guessing.
```

## Requirement Summary

| ID | Requirement | Priority |
|---|---|---|
| AEC-R1 | Spec Authority and Domain Boundary | P0 |
| AEC-R2 | Complaint and Escalation Separation | P0 |
| AEC-R3 | Workspace and Outlet Ownership | P0 |
| AEC-R4 | Workspace Default Policy | P0 |
| AEC-R5 | Outlet Override Policy | P0 |
| AEC-R6 | Auto Escalation Enablement | P0 |
| AEC-R7 | Trigger Evaluation Model | P0 |
| AEC-R8 | Priority-Based Trigger | P0 |
| AEC-R9 | Category-Based Trigger | P0 |
| AEC-R10 | Unassigned Timeout Trigger | P0 |
| AEC-R11 | SLA Threshold Trigger | P0 |
| AEC-R12 | Repeated Customer Message Trigger | P1 |
| AEC-R13 | Manual Escalation | P0 |
| AEC-R14 | Complaint Outlet Resolution | P0 |
| AEC-R15 | Order-Linked Outlet Authority | P0 |
| AEC-R16 | Explicit Complaint Outlet | P0 |
| AEC-R17 | Primary Supervisor Resolution | P0 |
| AEC-R18 | Multiple Supervisor Strategy | P0 |
| AEC-R19 | Fallback Recipient Strategy | P0 |
| AEC-R20 | Recipient Eligibility | P0 |
| AEC-R21 | Escalation Assignment Model | P0 |
| AEC-R22 | Complaint Status After Escalation | P0 |
| AEC-R23 | Escalation Lifecycle | P0 |
| AEC-R24 | One Active Escalation Invariant | P0 |
| AEC-R25 | Escalation Record Snapshot | P0 |
| AEC-R26 | Information Inclusion Policy | P0 |
| AEC-R27 | Supervisor Acknowledgement | P0 |
| AEC-R28 | Supervisor Internal Response | P0 |
| AEC-R29 | Proposed Resolution | P0 |
| AEC-R30 | Escalation Completion | P0 |
| AEC-R31 | Escalation Cancellation | P0 |
| AEC-R32 | Reassignment and Re-escalation | P1 |
| AEC-R33 | Supervisor SLA | P0 |
| AEC-R34 | Supervisor SLA States | P0 |
| AEC-R35 | Business Hours Policy | P0 |
| AEC-R36 | Outside-Hours Behavior | P0 |
| AEC-R37 | Customer Notification Policy | P0 |
| AEC-R38 | Supervisor Notification | P0 |
| AEC-R39 | Notification Payload Minimization | P0 |
| AEC-R40 | Auto Escalation Scheduler | P0 |
| AEC-R41 | Event-Driven Evaluation | P0 |
| AEC-R42 | Policy Evaluation Explanation | P1 |
| AEC-R43 | Settings UI | P0 |
| AEC-R44 | Outlet Override UI | P0 |
| AEC-R45 | Complaint Detail Integration | P0 |
| AEC-R46 | Supervisor Queue | P0 |
| AEC-R47 | Escalation Timeline | P0 |
| AEC-R48 | Escalation History Read Model | P0 |
| AEC-R49 | Search, Filter, Sort, and Pagination | P0 |
| AEC-R50 | Authorization and Segregation of Duties | P0 |
| AEC-R51 | Row-Level Security and Repository Scope | P0 |
| AEC-R52 | API Contracts and Error Model | P0 |
| AEC-R53 | Domain Events and Outbox | P0 |
| AEC-R54 | Audit | P0 |
| AEC-R55 | Observability, Metrics, and Alerts | P0 |
| AEC-R56 | Optimistic Concurrency and Idempotency | P0 |
| AEC-R57 | Security and Privacy | P0 |
| AEC-R58 | Migration and Rollout | P0 |
| AEC-R59 | Testing and Quality Assurance | P0 |
| AEC-R60 | Operational Readiness and Definition of Done | P0 |

---

# Detailed Requirements

## AEC-R1: Spec Authority and Domain Boundary

**Priority:** P0

### Acceptance Criteria

1. This spec shall be the authority for complaint escalation policy, auto-escalation evaluation, outlet supervisor routing, escalation assignments, escalation SLA, escalation notifications, acknowledgements, responses, and escalation history.
2. The complaint domain remains authoritative for complaint identity, complaint status, customer communication, resolution, attachments, and complaint timeline.
3. Workspace Access Control remains authoritative for workspace membership, outlet access, roles, and permissions.
4. Outlet Management remains authoritative for outlet identity, operational state, primary supervisor configuration, and outlet membership.
5. Notification Attention remains authoritative for delivery of in-app, push, email, and operational notifications.
6. This spec shall not create a duplicate ticket for an existing complaint.

## AEC-R2: Complaint and Escalation Separation

**Priority:** P0

### Acceptance Criteria

1. A complaint shall remain one canonical record.
2. Escalation shall be modeled as a related workflow rather than a copied complaint or new ticket.
3. Complaint status and escalation status shall be stored separately.
4. Escalation completion shall not automatically resolve the complaint unless an approved policy explicitly performs that transition.
5. Escalation history shall remain linked to the original complaint.

## AEC-R3: Workspace and Outlet Ownership

**Priority:** P0

### Acceptance Criteria

1. Every escalation policy, override, escalation, acknowledgement, response, and escalation notification shall belong to one workspace.
2. Every outlet-targeted escalation shall belong to exactly one complaint outlet.
3. Workspace and outlet context shall be derived from verified server-side context.
4. Cross-workspace and unauthorized cross-outlet reads and mutations shall be denied.
5. Historical escalation records shall preserve their original workspace and outlet references.

## AEC-R4: Workspace Default Policy

**Priority:** P0

### Acceptance Criteria

1. A workspace may define one default complaint escalation policy.
2. The workspace default shall apply to outlets without an explicit override.
3. The policy shall be versioned and auditable.
4. Disabling the workspace default shall not delete existing escalations.
5. Policy evaluation shall use the version effective at evaluation time.

## AEC-R5: Outlet Override Policy

**Priority:** P0

### Acceptance Criteria

1. Each outlet may use the workspace default, define a custom policy, or disable auto escalation.
2. Override modes shall include USE_WORKSPACE_DEFAULT, CUSTOM, and DISABLED.
3. A custom override shall inherit only fields explicitly configured as inherited.
4. Changing an override shall not rewrite historical escalation decisions.
5. Outlet override access shall require outlet or workspace administrative permission.

## AEC-R6: Auto Escalation Enablement

**Priority:** P0

### Acceptance Criteria

1. Auto escalation shall be disabled until a valid workspace policy is saved.
2. Enabling auto escalation shall require at least one valid trigger and one valid recipient strategy.
3. An enabled policy with no eligible supervisor shall execute a configured fallback.
4. The UI shall show whether effective policy comes from workspace default or outlet override.
5. Manual escalation shall remain available when auto escalation is disabled, subject to permission.

## AEC-R7: Trigger Evaluation Model

**Priority:** P0

### Acceptance Criteria

1. The system shall support immediate and delayed escalation triggers.
2. Supported triggers shall include complaint created, complaint remains unassigned, priority match, category match, SLA threshold, repeated customer message, and manual escalation.
3. Multiple trigger conditions may use ANY or ALL match logic.
4. Trigger evaluation shall be deterministic and idempotent.
5. A trigger shall record the matched rule and evaluation time.

## AEC-R8: Priority-Based Trigger

**Priority:** P0

### Acceptance Criteria

1. Policies may automatically escalate selected priorities.
2. Default MVP immediate priorities should be HIGH and CRITICAL.
3. Priority values shall come from the complaint domain.
4. A priority change shall re-evaluate only when the policy permits re-evaluation.
5. Lowering priority shall not silently cancel an active escalation.

## AEC-R9: Category-Based Trigger

**Priority:** P0

### Acceptance Criteria

1. Policies may automatically escalate selected complaint categories.
2. Categories shall use complaint-domain identifiers rather than display text.
3. Unknown or archived categories shall not match.
4. Category rules may be combined with priority and SLA conditions.
5. Policy changes shall not retroactively alter recorded trigger reasons.

## AEC-R10: Unassigned Timeout Trigger

**Priority:** P0

### Acceptance Criteria

1. A policy may escalate a complaint that remains unassigned for a configured number of minutes.
2. The timeout shall start from complaint creation or from the latest unassignment event according to policy.
3. Assignment before expiry shall cancel the pending timeout evaluation.
4. The timeout scheduler shall be idempotent.
5. Delayed jobs shall use complaint and policy versions to avoid stale escalation.

## AEC-R11: SLA Threshold Trigger

**Priority:** P0

### Acceptance Criteria

1. A policy may escalate when complaint SLA remaining time falls below a configured threshold.
2. The complaint domain remains authoritative for customer-facing SLA deadlines.
3. SLA threshold evaluation shall use outlet timezone and approved SLA calculations.
4. Paused SLA shall not trigger unless policy explicitly allows it.
5. Already breached SLA may trigger a breach-specific escalation reason.

## AEC-R12: Repeated Customer Message Trigger

**Priority:** P1

### Acceptance Criteria

1. A policy may escalate when a customer sends repeated messages while a complaint remains unresolved.
2. The threshold shall be configurable by message count and time window.
3. System events, agent messages, and duplicate provider deliveries shall not count as customer messages.
4. The trigger shall not create duplicate active escalations.
5. Message content shall not be copied into notifications unless explicitly allowed.

## AEC-R13: Manual Escalation

**Priority:** P0

### Acceptance Criteria

1. Authorized users may manually escalate a complaint to the related outlet supervisor.
2. Manual escalation shall require a reason or message.
3. Manual escalation shall use the same recipient resolution and permission controls as auto escalation.
4. Manual escalation shall record MANUAL as the trigger type.
5. Manual escalation shall not bypass active-escalation duplicate prevention.

## AEC-R14: Complaint Outlet Resolution

**Priority:** P0

### Acceptance Criteria

1. The system shall resolve complaint outlet using an ordered strategy.
2. The default order shall be related order outlet, complaint explicit outlet, and conversation selected outlet.
3. The system shall not infer outlet from product name or free-text complaint description.
4. Resolved outlet shall belong to the complaint workspace.
5. Failure to resolve outlet shall create a configuration attention event rather than guessing.

## AEC-R15: Order-Linked Outlet Authority

**Priority:** P0

### Acceptance Criteria

1. When a complaint references an order, the order outlet shall be the preferred complaint outlet.
2. Order outlet shall come from the immutable order snapshot or authoritative order read model.
3. A later outlet profile change shall not rewrite the order-linked escalation target.
4. An invalid cross-workspace order reference shall be rejected.
5. Order lookup failure shall degrade to other approved outlet-resolution sources.

## AEC-R16: Explicit Complaint Outlet

**Priority:** P0

### Acceptance Criteria

1. Authorized users may set or correct the complaint outlet before escalation.
2. Changing the outlet of a complaint with an active escalation shall require an explicit reassignment workflow.
3. Outlet correction shall be audited.
4. The selected outlet shall be visible in complaint details.
5. AI shall not silently select an outlet without an approved deterministic source.

## AEC-R17: Primary Supervisor Resolution

**Priority:** P0

### Acceptance Criteria

1. The preferred recipient shall be the active primary supervisor of the complaint outlet.
2. Primary supervisor shall be resolved through outlet membership and role/permission records.
3. Recipient selection shall not be hard-coded by outlet name.
4. The selected supervisor shall have complaint escalation access to that outlet.
5. An inactive, suspended, or expired membership shall not be eligible.

## AEC-R18: Multiple Supervisor Strategy

**Priority:** P0

### Acceptance Criteria

1. If multiple eligible supervisors exist, the policy shall define how one or more recipients are selected.
2. Supported strategies shall include PRIMARY_ONLY, FIRST_AVAILABLE, ROUND_ROBIN, SUPERVISOR_QUEUE, and ALL_SUPERVISORS.
3. MVP should use PRIMARY_ONLY with fallback.
4. Selection shall be deterministic and auditable.
5. Round-robin state shall be concurrency-safe.

## AEC-R19: Fallback Recipient Strategy

**Priority:** P0

### Acceptance Criteria

1. A policy shall define fallback behavior when no primary supervisor is eligible.
2. Default fallback order should be another active outlet supervisor, outlet manager, workspace support manager, then configuration alert.
3. Fallback shall not route to an unrelated outlet supervisor.
4. Every fallback step shall be recorded.
5. If no recipient exists, escalation status shall become FAILED_ROUTING or PENDING_CONFIGURATION.

## AEC-R20: Recipient Eligibility

**Priority:** P0

### Acceptance Criteria

1. Recipient eligibility shall require active membership, outlet access, required permission, and non-suspended status.
2. Optional availability and working-schedule checks may apply.
3. A user who is the complaint customer or prohibited conflict actor shall not be selected.
4. Eligibility shall be rechecked at dispatch time.
5. Ineligible recipients shall not receive complaint details.

## AEC-R21: Escalation Assignment Model

**Priority:** P0

### Acceptance Criteria

1. A supervisor receiving an escalation shall be added as an OUTLET_SUPERVISOR collaborator or equivalent assignment.
2. The current CS agent shall remain the primary complaint handler by default.
3. Policy may explicitly transfer primary ownership, but this shall not be the MVP default.
4. Assignment creation shall be idempotent.
5. Assignment removal shall not delete escalation history.

## AEC-R22: Complaint Status After Escalation

**Priority:** P0

### Acceptance Criteria

1. Auto escalation shall not create a new complaint status family.
2. The default behavior shall keep the complaint status or transition OPEN to IN_PROGRESS.
3. WAITING_OUTLET shall be represented through escalation state or a derived operational queue rather than forcing a complex complaint status.
4. Status changes shall follow complaint-domain transition rules.
5. Escalation failure shall not falsely resolve or close a complaint.

## AEC-R23: Escalation Lifecycle

**Priority:** P0

### Acceptance Criteria

1. Escalation statuses shall include PENDING, ACKNOWLEDGED, RESPONDED, COMPLETED, CANCELLED, FAILED_ROUTING, and EXPIRED.
2. Transitions shall be explicit and validated.
3. ACKNOWLEDGED shall identify the supervisor who accepted responsibility.
4. RESPONDED shall indicate that an internal response or proposed resolution exists.
5. COMPLETED shall indicate that the outlet escalation work is complete, not necessarily that the complaint is resolved.

## AEC-R24: One Active Escalation Invariant

**Priority:** P0

### Acceptance Criteria

1. A complaint shall have at most one active escalation per escalation level and target outlet.
2. Duplicate complaint events, scheduler retries, and repeated messages shall not create duplicate active escalations.
3. A completed or cancelled escalation may be followed by a new escalation only through an explicit re-escalation rule.
4. Database constraints or transactional checks shall enforce the invariant.
5. Duplicate attempts shall return the existing active escalation.

## AEC-R25: Escalation Record Snapshot

**Priority:** P0

### Acceptance Criteria

1. Each escalation shall store the complaint summary, resolved outlet, selected recipient, priority, category, SLA state, matched rule, policy version, and safe source references.
2. The snapshot shall not rewrite when complaint fields later change.
3. Attachments shall be referenced rather than duplicated.
4. Internal notes shall be excluded unless policy explicitly includes them.
5. Sensitive customer and payment data shall be minimized.

## AEC-R26: Information Inclusion Policy

**Priority:** P0

### Acceptance Criteria

1. A policy shall control whether escalation context includes complaint summary, related order, product details, attachments, current SLA, customer-safe identity, and internal notes.
2. Default included data shall be summary, related order, product context, attachments, SLA, and priority.
3. Full customer phone number and raw payment provider data shall be excluded by default.
4. Internal notes shall be excluded by default.
5. Attachment access shall still require authorization.

## AEC-R27: Supervisor Acknowledgement

**Priority:** P0

### Acceptance Criteria

1. An eligible supervisor shall be able to acknowledge a pending escalation.
2. Acknowledgement shall record actor, timestamp, source device, and escalation version.
3. Only one active recipient may acknowledge when the strategy requires a single owner.
4. Duplicate acknowledgement shall have one business effect.
5. Acknowledgement shall stop the acknowledgement SLA timer.

## AEC-R28: Supervisor Internal Response

**Priority:** P0

### Acceptance Criteria

1. A supervisor shall be able to add an internal response to an escalation.
2. Response types shall include MESSAGE, REQUEST_INFORMATION, PROPOSED_RESOLUTION, APPROVAL, REJECTION, and SYSTEM_EVENT.
3. Supervisor responses shall not be sent to the customer automatically.
4. Responses shall be visible only to authorized complaint collaborators.
5. Response history shall be append-only or correction-linked.

## AEC-R29: Proposed Resolution

**Priority:** P0

### Acceptance Criteria

1. A supervisor may propose a resolution such as remake product, pickup replacement, investigate stock, request evidence, propose refund, or propose voucher.
2. A proposed resolution shall not directly execute refund, payment, or inventory changes.
3. The primary complaint handler shall review and communicate the official response to the customer.
4. Accepted proposals shall be recorded in complaint history.
5. Rejected proposals shall retain their reasoning.

## AEC-R30: Escalation Completion

**Priority:** P0

### Acceptance Criteria

1. An authorized supervisor or complaint handler may mark escalation work completed.
2. Completion shall require a response or completion reason.
3. Completion shall stop escalation response and resolution timers.
4. Complaint resolution shall remain a separate action.
5. Completion shall emit timeline, audit, and notification events.

## AEC-R31: Escalation Cancellation

**Priority:** P0

### Acceptance Criteria

1. Authorized users may cancel an escalation that is no longer needed or was misrouted.
2. Cancellation shall require a reason.
3. Cancellation shall not delete assignment, responses, notifications, or history.
4. A cancelled escalation may be re-escalated through an explicit action.
5. Cancellation shall stop future escalation SLA alerts.

## AEC-R32: Reassignment and Re-escalation

**Priority:** P1

### Acceptance Criteria

1. Authorized users may reassign an active escalation to another eligible supervisor in the same outlet.
2. Reassignment to another outlet shall require complaint outlet correction or exceptional administrative approval.
3. Re-escalation shall create a new escalation record linked to the prior record.
4. Reassignment and re-escalation reasons shall be audited.
5. Notification deduplication shall prevent duplicate alerts to the same recipient.

## AEC-R33: Supervisor SLA

**Priority:** P0

### Acceptance Criteria

1. The system shall support separate acknowledgement, first response, and resolution-proposal targets for outlet supervisors.
2. Supervisor SLA shall be distinct from customer complaint SLA.
3. MVP defaults may use 15 minutes for acknowledgement and 60 minutes for first response.
4. Supervisor SLA deadlines shall be calculated using approved business-hours policy.
5. SLA targets shall be stored in the escalation snapshot.

## AEC-R34: Supervisor SLA States

**Priority:** P0

### Acceptance Criteria

1. Escalation SLA states shall include ON_TRACK, WARNING, BREACHED, PAUSED, and COMPLETED.
2. Warning thresholds shall be configurable.
3. A breach shall not automatically resolve or cancel the escalation.
4. SLA state changes shall emit attention events.
5. UI shall clearly distinguish complaint SLA from supervisor SLA.

## AEC-R35: Business Hours Policy

**Priority:** P0

### Acceptance Criteria

1. Policies shall define whether escalation runs at any time, outlet operating hours, or supervisor work schedule.
2. High and critical complaints may bypass normal business hours according to policy.
3. Medium and low complaints may be queued until the next working period.
4. Timezone shall come from the outlet.
5. Business-hours calculations shall be deterministic and tested across timezone boundaries.

## AEC-R36: Outside-Hours Behavior

**Priority:** P0

### Acceptance Criteria

1. Outside-hours behavior shall support ESCALATE_IMMEDIATELY, QUEUE_UNTIL_OPEN, ESCALATE_TO_WORKSPACE_SUPPORT, and CREATE_ATTENTION_ALERT.
2. The selected behavior shall be stored with the escalation decision.
3. Queued escalation shall preserve the original trigger time.
4. A queued complaint that becomes critical may be escalated immediately.
5. Outside-hours logic shall not silently discard escalation.

## AEC-R37: Customer Notification Policy

**Priority:** P0

### Acceptance Criteria

1. Customer notification after escalation shall be configurable.
2. MVP default shall not automatically notify the customer.
3. Optional customer message may state that the outlet is investigating without naming internal personnel.
4. Customer notification shall use Channel Connections and CRM transport contracts.
5. Notification delivery failure shall not change escalation state.

## AEC-R38: Supervisor Notification

**Priority:** P0

### Acceptance Criteria

1. An escalation shall notify the selected supervisor through configured channels.
2. MVP required channels shall be in-app notification and dashboard attention queue.
3. Email, push, and operational WhatsApp may be optional.
4. External notifications shall contain minimal safe context and a link to the authenticated dashboard.
5. Notification delivery shall be idempotent.

## AEC-R39: Notification Payload Minimization

**Priority:** P0

### Acceptance Criteria

1. External supervisor notifications shall not include raw payment data, full phone numbers, internal notes, or unrestricted attachments.
2. Safe payload may include complaint ID, outlet, priority, order number, SLA remaining time, and issue summary.
3. Dashboard access shall perform authorization before revealing full details.
4. Notification templates shall be versioned.
5. Notification failures and retries shall be observable.

## AEC-R40: Auto Escalation Scheduler

**Priority:** P0

### Acceptance Criteria

1. Delayed triggers shall be evaluated by a reliable scheduler or queue.
2. Jobs shall include complaint ID, workspace ID, policy version, expected complaint version, trigger type, and due time.
3. Stale jobs shall be safely discarded or re-evaluated.
4. Scheduler retries shall be idempotent.
5. Job execution shall be bounded and observable.

## AEC-R41: Event-Driven Evaluation

**Priority:** P0

### Acceptance Criteria

1. Immediate triggers shall evaluate on complaint created, priority changed, category changed, outlet resolved, assignment changed, SLA changed, and customer message received.
2. Events shall be versioned and idempotent.
3. Evaluation failure shall not lose complaint truth.
4. Event consumers shall use outbox or reliable delivery where critical.
5. Duplicate events shall have one escalation business effect.

## AEC-R42: Policy Evaluation Explanation

**Priority:** P1

### Acceptance Criteria

1. The system shall expose why a complaint did or did not auto escalate.
2. Explanation shall include effective policy, matched conditions, skipped conditions, outlet resolution source, recipient strategy, and fallback result.
3. Sensitive implementation details shall be hidden from ordinary users.
4. Explanations shall support support and debugging workflows.
5. The explanation shall not become an authorization bypass.

## AEC-R43: Settings UI

**Priority:** P0

### Acceptance Criteria

1. Settings shall provide Auto Escalation enablement, trigger rules, recipient strategy, included context, post-escalation behavior, supervisor SLA, notification channels, business hours, and fallback.
2. Disabled settings shall be visually clear.
3. Validation errors shall be shown at field level.
4. The UI shall show effective workspace and outlet policy.
5. Saving shall require version conflict handling.

## AEC-R44: Outlet Override UI

**Priority:** P0

### Acceptance Criteria

1. The workspace settings page shall list outlet override mode, auto-escalation state, primary supervisor, rule summary, and configuration health.
2. Users may filter outlets by enabled, disabled, custom, inherited, and missing supervisor.
3. Each outlet may open an override drawer or page.
4. Bulk enabling shall require confirmation and validation.
5. Outlet access restrictions shall apply.

## AEC-R45: Complaint Detail Integration

**Priority:** P0

### Acceptance Criteria

1. Complaint detail shall show current escalation status, recipient, outlet, trigger source, timestamps, supervisor SLA, and latest response.
2. The action bar shall include Escalate to Outlet or View Escalation as appropriate.
3. Available actions shall include acknowledge, respond, reassign, cancel, complete, and view history according to permission.
4. Escalation banner shall not obscure complaint details.
5. Complaint and escalation statuses shall be visually distinct.

## AEC-R46: Supervisor Queue

**Priority:** P0

### Acceptance Criteria

1. Supervisors shall have a queue of escalations for their authorized outlets.
2. Queue filters shall include pending acknowledgement, acknowledged, awaiting response, breached, priority, outlet, category, and date.
3. Queue counts shall use the same authorization and filters as list results.
4. Queue shall support stable pagination and sorting.
5. Unrelated outlet escalations shall not be inferable.

## AEC-R47: Escalation Timeline

**Priority:** P0

### Acceptance Criteria

1. Complaint timeline shall include escalation created, recipient selected, fallback used, notification sent, acknowledgement, response, reassignment, completion, cancellation, and SLA breach.
2. Timeline actors shall distinguish human, system, scheduler, and background job.
3. Entries shall be immutable or correction-linked.
4. Customer-visible timeline and internal timeline shall be separate.
5. Timeline rendering shall minimize sensitive details.

## AEC-R48: Escalation History Read Model

**Priority:** P0

### Acceptance Criteria

1. Authorized users shall be able to view current and historical escalations for a complaint.
2. History shall show trigger, policy version, target outlet, recipients, status, SLA, responses, fallback, and timestamps.
3. Re-escalation relationships shall be visible.
4. Long histories shall paginate.
5. History shall remain readable after membership or policy changes.

## AEC-R49: Search, Filter, Sort, and Pagination

**Priority:** P0

### Acceptance Criteria

1. Escalation lists shall support search by complaint ID, order number, customer-safe identifier, outlet, and recipient.
2. Filters shall include status, priority, category, trigger type, SLA state, recipient, and date.
3. Sorting and pagination shall be stable.
4. Counts shall respect workspace and outlet authorization.
5. Queries shall avoid N+1 behavior.

## AEC-R50: Authorization and Segregation of Duties

**Priority:** P0

### Acceptance Criteria

1. Separate permissions shall exist for policy management, manual escalation, acknowledgement, response, reassignment, cancellation, completion, and history.
2. Outlet supervisors shall access only assigned outlets.
3. CS agents may escalate but may not change outlet supervisor configuration without permission.
4. Supervisor response shall not directly execute payment refund or inventory mutation.
5. Frontend visibility shall not replace backend authorization.

## AEC-R51: Row-Level Security and Repository Scope

**Priority:** P0

### Acceptance Criteria

1. Tenant-owned escalation tables shall include workspace_id.
2. Outlet-bound records shall include outlet_id.
3. Repositories shall require workspace and allowed outlet context.
4. Supabase RLS shall provide defense-in-depth.
5. Unscoped list, count, search, and mutation methods shall be prohibited except reviewed platform jobs.

## AEC-R52: API Contracts and Error Model

**Priority:** P0

### Acceptance Criteria

1. APIs shall use strict request and response schemas.
2. Stable errors shall cover policy invalid, outlet unresolved, supervisor missing, recipient ineligible, escalation already active, invalid escalation transition, permission denied, outlet scope denied, version conflict, and idempotency conflict.
3. Errors shall not leak cross-workspace or unauthorized outlet existence.
4. Mutation endpoints shall support idempotency and version checks.
5. API documentation shall identify required actor and permission.

## AEC-R53: Domain Events and Outbox

**Priority:** P0

### Acceptance Criteria

1. Policy changes, evaluation matches, escalation creation, routing failure, acknowledgement, response, reassignment, completion, cancellation, and SLA changes shall emit versioned events.
2. Critical events shall use reliable outbox delivery.
3. Events shall include workspace, outlet, complaint, escalation, recipient, trigger, actor, correlation, timestamp, and version where applicable.
4. Events shall exclude secrets and unnecessary PII.
5. Consumers shall be idempotent.

## AEC-R54: Audit

**Priority:** P0

### Acceptance Criteria

1. Policy changes, outlet overrides, manual escalation, routing decisions, recipient changes, acknowledgements, responses, completions, cancellations, and administrative overrides shall be audited.
2. Audit shall distinguish human, system, scheduler, and background-job actors.
3. High-risk changes shall require reason.
4. Safe before and after metadata shall be recorded.
5. Audit history shall remain separate from customer-visible conversation history.

## AEC-R55: Observability, Metrics, and Alerts

**Priority:** P0

### Acceptance Criteria

1. Metrics shall cover evaluations, matched rules, escalations created, routing failures, acknowledgement latency, response latency, SLA breaches, notification failures, and duplicate suppression.
2. Metrics shall avoid PII and high-cardinality customer labels.
3. Logs shall use safe workspace, outlet, complaint, escalation, recipient, trigger, and correlation identifiers.
4. Alerts shall cover no eligible supervisor, routing failure, scheduler backlog, repeated notification failure, and breached supervisor SLA.
5. Dashboards shall support workspace and outlet operations.

## AEC-R56: Optimistic Concurrency and Idempotency

**Priority:** P0

### Acceptance Criteria

1. Policies, overrides, escalations, acknowledgements, assignments, and completion operations shall use version or equivalent concurrency controls.
2. Auto and manual escalation races shall create at most one active escalation.
3. Concurrent acknowledgement by two supervisors shall produce one valid owner when required.
4. Concurrent cancel and respond operations shall resolve deterministically.
5. Duplicate events, scheduler retries, and double clicks shall have one business effect.

## AEC-R57: Security and Privacy

**Priority:** P0

### Acceptance Criteria

1. Complaint and escalation data shall be minimized according to recipient need.
2. Provider secrets, raw payment webhooks, internal AI prompts, and unrestricted customer data shall never appear in escalation payloads.
3. Prompt or message content shall not override routing policy or permissions.
4. Rate limits shall protect manual escalation, acknowledgement, responses, and settings updates.
5. Security review shall precede production activation.

## AEC-R58: Migration and Rollout

**Priority:** P0

### Acceptance Criteria

1. The feature shall be introduced without duplicating existing complaints or tickets.
2. Existing outlet supervisor memberships shall be audited before enabling auto escalation.
3. Workspace policy shall begin disabled until configuration validation passes.
4. Rollout shall start with selected test outlets and internal supervisors.
5. Rollback shall disable future auto escalation while preserving existing escalation history.

## AEC-R59: Testing and Quality Assurance

**Priority:** P0

### Acceptance Criteria

1. Implementation shall follow TDD.
2. Unit, component, integration, security, property, concurrency, resilience, scheduler, notification, performance, and end-to-end tests shall be present.
3. Integration tests shall cover Complaints, Orders, Outlets, Access Control, CRM, Notifications, Audit, and Supabase RLS.
4. Security tests shall cover cross-outlet routing, recipient spoofing, internal-note leakage, duplicate escalation, and unauthorized settings changes.
5. Production data and secrets shall not be used in tests.

## AEC-R60: Operational Readiness and Definition of Done

**Priority:** P0

### Acceptance Criteria

1. Runbooks shall cover missing supervisor, routing failure, scheduler delay, notification failure, wrong outlet, reassignment, SLA breach, and policy rollback.
2. Backup and restore shall preserve policies, overrides, escalations, responses, and audit references.
3. Implementation status shall reflect repository reality.
4. All P0 requirements and release-gate tests shall pass before broad activation.
5. Escalation infrastructure failure shall never delete or corrupt the complaint.


---
# Recommended MVP Defaults

```text
Auto Escalate:
ON after valid configuration

Immediate:
HIGH and CRITICAL

Unassigned timeout:
10 minutes for MEDIUM and LOW

Recipient:
Primary outlet supervisor

Fallback:
Other active outlet supervisor
→ Outlet Manager
→ Workspace Support Manager
→ Configuration Alert

Included:
Complaint summary
Related order
Product context
Attachments
Priority and SLA

Excluded:
Internal notes
Full customer phone
Raw payment data

After escalation:
Complaint remains IN_PROGRESS
CS remains primary handler
Supervisor becomes outlet collaborator
No automatic customer notification

Supervisor SLA:
Acknowledgement 15 minutes
First response 60 minutes

Outside working hours:
HIGH/CRITICAL immediately
MEDIUM/LOW next working period
```

# Fastest Safe Alpha Slice

```text
workspace default settings
outlet override modes
priority trigger
unassigned timeout trigger
order-based outlet resolution
primary supervisor routing
fallback to outlet manager/workspace support
one active escalation invariant
in-app notification
supervisor queue
acknowledgement
internal response
completion/cancellation
supervisor SLA
complaint detail banner/timeline
authorization and RLS
idempotency, scheduler, concurrency, and E2E tests
```

May follow after alpha:

```text
category combinations
repeated customer message trigger
round robin
all-supervisor fanout
email/push/WhatsApp supervisor notification
advanced business schedules
multi-level escalation
automatic compensation approval
analytics recommendations
```

# Definition of Done

1. Complaint is not duplicated.
2. Related order outlet routes to the correct outlet.
3. The primary supervisor is resolved from active membership.
4. No supervisor uses the documented fallback.
5. Auto/manual races create one active escalation.
6. CS remains primary handler by default.
7. Supervisor response remains internal until CS sends a reply.
8. Customer SLA and supervisor SLA remain separate.
9. Other outlets cannot view or act on the escalation.
10. Timeline, audit, notification, and observability are present.
11. Security, scheduler, property, concurrency, resilience, and E2E tests pass.
12. `npm run specs:check` passes.

# Final Requirement Statement

```text
Complaint event
→ deterministic policy evaluation
→ complaint outlet resolution
→ eligible supervisor routing
→ internal acknowledgement and response
→ official customer handling remains with complaint owner
```

The system shall never hard-code a supervisor, create duplicate complaints, expose complaint data to another outlet, or automatically send internal supervisor responses to customers without an explicit approved action.
