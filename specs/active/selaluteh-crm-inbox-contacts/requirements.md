---
schema_version: 1
document_type: requirements
spec_id: selaluteh-crm-inbox-contacts
title: SelaluTeh CRM Inbox & Contacts Requirements
status: active
workflow_state: in_progress
version: 1.0.0
updated_at: 2026-06-23
---

# Requirements Document: SelaluTeh CRM Inbox & Contacts

## Introduction

Spec ini mendefinisikan domain CRM untuk:

```text
Contacts
Channel identities
Inbox
Conversations
Messages
Assignments
Unread state
Human handoff
AI assist
Internal notes
Contact and conversation timelines
```

Alur utama:

```text
WhatsApp / Telegram
→ Channel Connections
→ normalized inbound message
→ CRM contact + conversation + message
→ outlet context
→ AI handling or human handling
→ outbound reply through Channel Connections
```

## Authority and Boundaries

| Area | Authority |
|---|---|
| Contacts, channel identities, conversations, messages, inbox state, notes, assignments, handoff | This spec |
| Provider credentials, webhook intake, outbound transport | `selaluteh-channel-connections-sync` |
| Workspace/outlet permissions | `selaluteh-workspace-access-control` |
| Outlet operational data | `selaluteh-outlet-management-operations` |
| AI runtime and scope | AI Agent specs |
| Order, payment, complaint truth | Their dedicated specs |
| Immutable admin activity | `selaluteh-audit-activity-timeline` |
| Notification delivery | `selaluteh-notification-attention-engine` |

## Product Principles

```text
CRM is the durable business record for contacts, conversations, and messages.
Provider transport details remain behind Channel Connections.
One contact may have many channel identities.
Conversation lifecycle and AI/human handling mode are separate.
AI stops customer-facing replies during human takeover.
Internal notes never leave the CRM.
Workspace and outlet isolation apply to every read and mutation.
AI memory retention is three months, but required CRM records are retained separately.
```

## Requirement Summary

| ID | Requirement | Priority |
|---|---|---|
| CRM-R1 | Spec Authority and Domain Boundary | P0 |
| CRM-R2 | Workspace CRM Ownership | P0 |
| CRM-R3 | Contact Identity and Stable Record | P0 |
| CRM-R4 | Channel Identity Model | P0 |
| CRM-R5 | Contact Lifecycle | P0 |
| CRM-R6 | Contact Core Profile Fields | P0 |
| CRM-R7 | Contact Tags and Segmentation Metadata | P1 |
| CRM-R8 | Contact Custom Fields | P1 |
| CRM-R9 | Contact Deduplication and Matching | P0 |
| CRM-R10 | Contact Merge | P0 |
| CRM-R11 | Contact Block and Communication Restriction | P1 |
| CRM-R12 | Consent, Opt-Out, and Communication Preferences | P1 |
| CRM-R13 | Contact Search, Filter, Sort, and Pagination | P0 |
| CRM-R14 | Contact Detail Read Model | P0 |
| CRM-R15 | Contact Import and Export Contract | P1 |
| CRM-R16 | Conversation Identity and Core Fields | P0 |
| CRM-R17 | Conversation Lifecycle | P0 |
| CRM-R18 | Conversation Handling Mode | P0 |
| CRM-R19 | Inbox Queues and Views | P0 |
| CRM-R20 | Conversation Assignment | P0 |
| CRM-R21 | Outlet Context and Visibility | P0 |
| CRM-R22 | Priority and Service-Level Metadata | P1 |
| CRM-R23 | Unread, Read, and Attention State | P0 |
| CRM-R24 | Snooze and Follow-Up | P1 |
| CRM-R25 | Message Identity and Core Model | P0 |
| CRM-R26 | Message Direction and Actor Types | P0 |
| CRM-R27 | Message Content Types | P0 |
| CRM-R28 | Message Delivery and Transport State | P0 |
| CRM-R29 | Message Ordering and Timeline Consistency | P0 |
| CRM-R30 | Message Idempotency and Deduplication | P0 |
| CRM-R31 | Attachments and Media References | P1 |
| CRM-R32 | Internal Notes | P0 |
| CRM-R33 | Mentions and Collaboration | P1 |
| CRM-R34 | Human Handoff | P0 |
| CRM-R35 | Smart Handoff Rules | P1 |
| CRM-R36 | Return from Human to AI | P1 |
| CRM-R37 | AI Suggested Replies and Assist Mode | P1 |
| CRM-R38 | AI Conversation Summary | P1 |
| CRM-R39 | AI Context and Memory Retention | P0 |
| CRM-R40 | AI Business Scope and Tool Restrictions | P0 |
| CRM-R41 | Order, Payment, and Complaint Context Panel | P0 |
| CRM-R42 | Contact and Conversation Activity Timeline | P1 |
| CRM-R43 | Canned Replies and Internal Response Library | P1 |
| CRM-R44 | Conversation Archive, Spam, and Restore | P1 |
| CRM-R45 | Bulk Inbox and Contact Operations | P1 |
| CRM-R46 | Notifications and Attention Signals | P1 |
| CRM-R47 | CRM Analytics Event Contract | P1 |
| CRM-R48 | Authorization and Outlet Scope | P0 |
| CRM-R49 | Row-Level Security and Repository Scoping | P0 |
| CRM-R50 | API Contracts and Error Model | P0 |
| CRM-R51 | Admin UI and State Support | P1 |
| CRM-R52 | Optimistic Concurrency and Idempotent Commands | P0 |
| CRM-R53 | Audit and Domain Events | P0 |
| CRM-R54 | Security and Privacy | P0 |
| CRM-R55 | Legacy Migration and Compatibility | P0 |
| CRM-R56 | Testing and Quality Assurance | P0 |
| CRM-R57 | Scalability and Performance | P1 |
| CRM-R58 | Operational Readiness and Recovery | P1 |

---

# Detailed Requirements

## CRM-R1: Spec Authority and Domain Boundary

**Priority:** P0

### Acceptance Criteria

1. The system shall use this spec as authority for contacts, channel identities, conversations, inbox queues, messages, assignments, handoff state, notes, and CRM read models.
2. Channel Connections remains authority for provider credentials, webhooks, and transport delivery execution.
3. Order, Payment, Complaint, Audit, Notification, and AI domains remain authoritative for their owned business facts.
4. Missing external contracts shall be documented as blockers rather than guessed.
5. Dedicated domain specs shall override umbrella details in their owned boundary.

## CRM-R2: Workspace CRM Ownership

**Priority:** P0

### Acceptance Criteria

1. Every CRM entity shall belong to exactly one workspace.
2. Workspace context shall come from verified authorization context.
3. Cross-workspace reads, counts, searches, exports, assignments, and mutations shall be denied.
4. Background jobs shall carry explicit workspace context.
5. Workspace archive or suspension shall block new CRM mutations according to policy.

## CRM-R3: Contact Identity and Stable Record

**Priority:** P0

### Acceptance Criteria

1. A contact shall have a stable internal ID independent from channel identifiers.
2. A contact shall store workspace, display name, normalized name, lifecycle status, source, version, and timestamps.
3. A contact may exist before having a completed order.
4. A contact shall not be identified solely by display name.
5. Historical conversations and orders shall retain the contact reference.

## CRM-R4: Channel Identity Model

**Priority:** P0

### Acceptance Criteria

1. A contact may have multiple channel identities such as WhatsApp phone, Telegram user/chat ID, Instagram ID, or website visitor ID.
2. Each channel identity shall reference its workspace connection.
3. Provider identifiers shall be unique within the correct provider/connection scope.
4. Cross-workspace identity merging shall never happen automatically.
5. Channel identity history shall be preserved when identifiers change or connections are archived.

## CRM-R5: Contact Lifecycle

**Priority:** P0

### Acceptance Criteria

1. Contact statuses shall include ACTIVE, INACTIVE, BLOCKED, MERGED, ANONYMIZED, and ARCHIVED.
2. Lifecycle transitions shall be explicit and validated.
3. BLOCKED contacts shall not receive ordinary outbound messages unless policy permits a required service message.
4. MERGED contacts shall redirect to a canonical contact.
5. ANONYMIZED contacts shall preserve required operational history without unnecessary PII.
6. Lifecycle changes shall be audited and versioned.

## CRM-R6: Contact Core Profile Fields

**Priority:** P0

### Acceptance Criteria

1. Contact profile shall support display name, first/last name, normalized phone, email, language, timezone, and optional notes-safe summary.
2. Phone and email shall be normalized before matching.
3. Missing optional fields shall not block chat or order flows.
4. Sensitive/internal fields shall be permission-protected.
5. AI and customer-facing outputs shall receive only safe published fields.

## CRM-R7: Contact Tags and Segmentation Metadata

**Priority:** P1

### Acceptance Criteria

1. Workspace users may define and assign contact tags.
2. Tags shall be workspace-scoped and normalized.
3. Tags may support labels such as VIP, repeat customer, complaint history, or wholesale prospect.
4. Tags shall not replace structured consent, complaint, or order state.
5. Tag changes shall be audited.
6. Bulk tag operations shall return per-contact results.

## CRM-R8: Contact Custom Fields

**Priority:** P1

### Acceptance Criteria

1. Workspace may define typed custom fields for contacts.
2. Supported types should include text, number, boolean, date, enum, and reference where approved.
3. Field definitions shall include validation, visibility, edit permission, and archive status.
4. Unknown or archived fields shall not accept new values.
5. Custom fields shall be excluded from AI/customer output unless explicitly allowed.
6. Field changes shall be versioned and audited.

## CRM-R9: Contact Deduplication and Matching

**Priority:** P0

### Acceptance Criteria

1. The system shall detect probable duplicates using normalized channel identities, phone, email, and approved matching signals.
2. Exact provider identity matches shall be deterministic.
3. Fuzzy similarity shall never auto-merge contacts without an approved threshold and policy.
4. Duplicate detection shall be workspace-scoped.
5. Potential duplicates shall be reviewable.
6. Matching logic shall avoid using display name alone.

## CRM-R10: Contact Merge

**Priority:** P0

### Acceptance Criteria

1. Authorized users may merge duplicate contacts into one canonical contact.
2. Merge shall preserve conversations, messages, orders, payments, complaints, tags, and identity mappings.
3. Conflicting profile fields shall require deterministic or user-confirmed resolution.
4. The merged record shall remain traceable.
5. Merge shall be transactional, idempotent, and audited.
6. Unmerge shall not be assumed and requires a separate approved workflow.

## CRM-R11: Contact Block and Communication Restriction

**Priority:** P1

### Acceptance Criteria

1. Authorized users may block a contact for abuse, spam, fraud, or policy reasons.
2. Block reason and actor shall be recorded.
3. Inbound messages may still be retained according to security policy.
4. Automated AI replies and proactive messages shall stop for blocked contacts unless explicitly allowed.
5. Blocking shall not delete order/payment history.
6. Unblock shall be audited.

## CRM-R12: Consent, Opt-Out, and Communication Preferences

**Priority:** P1

### Acceptance Criteria

1. The CRM shall store consent and opt-out signals separately from tags.
2. Preferences may be channel-specific.
3. Service messages and marketing messages shall be distinguishable.
4. Provider opt-out events shall be normalized and persisted.
5. AI and automations shall respect opt-out policy.
6. Consent history shall be auditable.

## CRM-R13: Contact Search, Filter, Sort, and Pagination

**Priority:** P0

### Acceptance Criteria

1. Contact search shall support name, normalized phone, email, channel identity, and safe reference identifiers.
2. Filters shall support status, outlet relationship, channel, tags, last activity, order history summary, handoff history, and blocked state where available.
3. Sorting and pagination shall be stable.
4. Search shall be workspace-scoped and permission-aware.
5. Empty and no-results states shall be distinguishable.
6. Read models shall avoid N+1 queries.

## CRM-R14: Contact Detail Read Model

**Priority:** P0

### Acceptance Criteria

1. Contact detail shall include safe profile, channel identities, tags, custom fields allowed to the actor, conversation summaries, outlet relationship, order/payment/complaint links, and recent activity.
2. Sensitive fields shall be redacted by permission.
3. External domain failures shall degrade gracefully.
4. The response shall expose capability flags as advisory only.
5. Version shall be returned for conflict-safe editing.

## CRM-R15: Contact Import and Export Contract

**Priority:** P1

### Acceptance Criteria

1. Contacts may be imported and exported through Admin Data Operations.
2. Import shall support validation-only dry run and row-level errors.
3. Import matching/upsert rules shall be explicit.
4. Export shall respect workspace, outlet, field, and permission scope.
5. Secrets, raw provider payloads, and prohibited PII shall not be exported.
6. Import/export actions shall be audited.

## CRM-R16: Conversation Identity and Core Fields

**Priority:** P0

### Acceptance Criteria

1. A conversation shall have a stable ID and belong to one workspace, contact, and primary channel connection.
2. Conversation shall support optional outlet context, assigned team/member, priority, handling mode, and lifecycle status.
3. Provider chat/thread IDs shall be stored as channel references, not as the internal primary key.
4. Historical conversations shall remain readable after connection archive.
5. Conversation mutations shall use versioning.

## CRM-R17: Conversation Lifecycle

**Priority:** P0

### Acceptance Criteria

1. Conversation statuses shall include OPEN, PENDING, SNOOZED, RESOLVED, CLOSED, SPAM, and ARCHIVED.
2. Transitions shall be explicit and validated.
3. New inbound customer activity may reopen RESOLVED or CLOSED according to policy.
4. ARCHIVED shall preserve history but hide from ordinary inbox views.
5. SPAM shall suppress ordinary AI/human reply workflows.
6. Lifecycle changes shall emit events and audit records.

## CRM-R18: Conversation Handling Mode

**Priority:** P0

### Acceptance Criteria

1. Handling mode shall include AI_ACTIVE, HUMAN_ACTIVE, HANDOFF_PENDING, HUMAN_PAUSED, and AUTOMATION_DISABLED.
2. Handling mode shall remain separate from conversation lifecycle status.
3. Only authorized workflows shall change handling mode.
4. AI shall not reply while HUMAN_ACTIVE unless explicitly allowed by a safe assist-only mode.
5. Mode transitions shall be idempotent and auditable.

## CRM-R19: Inbox Queues and Views

**Priority:** P0

### Acceptance Criteria

1. The inbox shall support views such as All, Mine, Unassigned, AI Handling, Human Handling, Handoff Pending, Waiting for Customer, Waiting for Team, Snoozed, and Resolved.
2. Views shall be workspace and outlet scoped.
3. Counts shall use the same filters and authorization as lists.
4. Saved views may be supported per user or workspace.
5. Queue membership shall be derived from authoritative conversation state.
6. The UI shall distinguish empty inbox from no search results.

## CRM-R20: Conversation Assignment

**Priority:** P0

### Acceptance Criteria

1. Conversation may be assigned to a human member and/or team.
2. Assignment shall validate workspace membership, outlet access, role permission, and active status.
3. Only one primary assignee shall exist unless a future collaboration mode is explicitly supported.
4. Reassignment shall be versioned and audited.
5. Unassigned conversations shall remain in an eligible queue.
6. AI handling resolution shall respect active human assignment.

## CRM-R21: Outlet Context and Visibility

**Priority:** P0

### Acceptance Criteria

1. Conversation may have an outlet context selected by the customer or routing workflow.
2. Outlet-scoped users shall see only conversations allowed by their outlet assignments.
3. A conversation without an outlet may remain workspace-level until selection or routing.
4. Changing outlet context shall follow cart/order and authorization rules.
5. Other outlets shall not infer conversation existence.
6. Outlet context shall be preserved in order/payment side panels.

## CRM-R22: Priority and Service-Level Metadata

**Priority:** P1

### Acceptance Criteria

1. Conversation priority shall support LOW, NORMAL, HIGH, and URGENT.
2. Priority may be set by authorized humans or deterministic rules.
3. AI may suggest but shall not silently escalate priority unless policy allows.
4. SLA timestamps may include first response due, next response due, and resolution due.
5. SLA policy shall consider business hours and outlet/team configuration.
6. Breaches shall be observable and may trigger alerts.

## CRM-R23: Unread, Read, and Attention State

**Priority:** P0

### Acceptance Criteria

1. Unread state shall be tracked per conversation and, where required, per user.
2. Inbound customer messages shall increase attention state.
3. Opening a conversation shall not automatically mark it read unless the UI action confirms it.
4. AI/system messages shall not incorrectly increase customer-unread count.
5. Read/unread commands shall be idempotent.
6. Counts shall remain authorization-scoped.

## CRM-R24: Snooze and Follow-Up

**Priority:** P1

### Acceptance Criteria

1. Authorized users may snooze a conversation until a specific time or condition supported by policy.
2. Snoozed conversations shall leave ordinary active queues but remain queryable.
3. New customer activity may unsnooze automatically.
4. Snooze expiry shall re-enter the correct queue.
5. Snooze reason and actor shall be recorded.
6. Duplicate scheduler events shall be idempotent.

## CRM-R25: Message Identity and Core Model

**Priority:** P0

### Acceptance Criteria

1. Every message shall have a stable internal ID and belong to a conversation and workspace.
2. Message shall store direction, sender actor type, channel transport reference, content type, status, timestamps, and version where mutable.
3. Provider message ID shall not replace the internal ID.
4. Message record shall be durable before AI/human post-processing where feasible.
5. Messages shall not be hard-deleted during normal operations.

## CRM-R26: Message Direction and Actor Types

**Priority:** P0

### Acceptance Criteria

1. Directions shall include INBOUND, OUTBOUND, and INTERNAL.
2. Actor types shall distinguish CUSTOMER, HUMAN_MEMBER, AI_AGENT, SYSTEM, PROVIDER, and AUTOMATION.
3. Internal notes shall never be sent through channel transport.
4. Human and AI authorship shall remain visible in audit and timeline.
5. Impersonation/support actions shall retain the real actor.

## CRM-R27: Message Content Types

**Priority:** P0

### Acceptance Criteria

1. Supported normalized content types shall include TEXT, IMAGE, DOCUMENT, AUDIO, VIDEO, LOCATION, INTERACTION, SYSTEM_EVENT, and UNSUPPORTED.
2. Provider-specific payloads shall be normalized before CRM persistence.
3. Unsupported content shall remain visible with a safe fallback.
4. Structured interaction payloads shall be schema-validated.
5. Customer-visible rendering shall sanitize content.

## CRM-R28: Message Delivery and Transport State

**Priority:** P0

### Acceptance Criteria

1. CRM shall expose normalized transport states from Channel Connections.
2. Transport status shall remain separate from conversation business state.
3. Delivery/read failures shall not delete the message.
4. Status updates shall be idempotent and monotonic according to provider policy.
5. Provider errors shown to users shall be sanitized.
6. Retry actions shall remain owned by Channel Connections.

## CRM-R29: Message Ordering and Timeline Consistency

**Priority:** P0

### Acceptance Criteria

1. Message ordering shall use provider timestamp, received timestamp, sequence metadata, and stable tie-breakers.
2. Provider event order shall not be assumed.
3. Late messages shall not duplicate irreversible business actions.
4. Timeline ordering shall remain deterministic across reloads.
5. Edited/internal metadata shall not rewrite original sender time.
6. Concurrency tests shall cover simultaneous inbound and outbound messages.

## CRM-R30: Message Idempotency and Deduplication

**Priority:** P0

### Acceptance Criteria

1. Duplicate provider messages shall produce one CRM message.
2. Duplicate outbound commands shall produce one visible message.
3. Idempotency shall survive worker restart.
4. Same idempotency key with conflicting payload shall fail.
5. Deduplication shall be workspace and connection aware.
6. Duplicate business events shall not duplicate payment/order notifications.

## CRM-R31: Attachments and Media References

**Priority:** P1

### Acceptance Criteria

1. Messages may reference media assets without storing raw binary in CRM tables.
2. Media access shall be workspace and conversation scoped.
3. Unsafe or unavailable media shall degrade safely.
4. Attachment metadata shall include type, filename, size, provider reference, and safe asset reference.
5. Internal-only attachments shall not be exposed to customers.
6. Media lifecycle remains owned by Media/Storage domain.

## CRM-R32: Internal Notes

**Priority:** P0

### Acceptance Criteria

1. Authorized users may add INTERNAL messages as notes.
2. Internal notes shall never be sent to providers or customers.
3. AI may read internal notes only when explicitly permitted and safe.
4. Notes shall support author, timestamp, and optional mentions.
5. Edits or deletion shall follow strict audit policy.
6. Outlet visibility restrictions shall apply.

## CRM-R33: Mentions and Collaboration

**Priority:** P1

### Acceptance Criteria

1. Internal notes may mention authorized workspace members.
2. Mention targets shall have access to the conversation or receive no content.
3. Mentions may trigger Notification Attention Engine.
4. Mention events shall be idempotent.
5. Removed/suspended members shall no longer be eligible targets.
6. Mention history shall be auditable.

## CRM-R34: Human Handoff

**Priority:** P0

### Acceptance Criteria

1. AI or authorized human may request handoff according to policy.
2. Handoff shall transition handling mode to HANDOFF_PENDING and route to an eligible team or member.
3. AI shall stop customer-facing replies when human control becomes active.
4. Handoff reason, trigger, requested team, and timestamps shall be recorded.
5. Failed assignment shall use a fallback queue.
6. Handoff shall not change channel connection ownership.

## CRM-R35: Smart Handoff Rules

**Priority:** P1

### Acceptance Criteria

1. Deterministic or model-assisted triggers may request handoff for complaint, payment issue, repeated failure, customer request, low confidence, safety concern, or unsupported task.
2. Trigger output shall be explainable through a safe reason code.
3. Handoff decision shall respect outlet/team availability.
4. The AI shall not fabricate successful assignment.
5. Trigger tuning and evaluation shall be versioned.
6. Critical handoff paths shall be covered by evaluation and integration tests.

## CRM-R36: Return from Human to AI

**Priority:** P1

### Acceptance Criteria

1. Authorized users may return eligible conversations to AI handling.
2. Return shall require no unresolved takeover restriction.
3. The selected AI policy shall resolve through channel, outlet, and workspace configuration.
4. AI shall receive a bounded conversation summary rather than unrestricted historical payload.
5. Return action shall be audited.
6. Automatic return may occur only under an explicit policy.

## CRM-R37: AI Suggested Replies and Assist Mode

**Priority:** P1

### Acceptance Criteria

1. AI may generate draft suggestions for human review.
2. Suggested replies shall not be sent automatically in assist-only mode.
3. Suggestions shall use current authorized context and business-domain scope.
4. The system shall distinguish generated suggestion, edited draft, and sent message.
5. Unsafe or off-topic suggestions shall be blocked.
6. Human feedback may be recorded for evaluation without leaking customer data.

## CRM-R38: AI Conversation Summary

**Priority:** P1

### Acceptance Criteria

1. AI may produce a concise conversation summary for authorized users.
2. Summary shall distinguish customer facts, inferred context, unresolved issues, and next actions.
3. Summary shall not replace original messages.
4. Summary freshness and generation timestamp shall be visible.
5. Sensitive data shall be minimized.
6. Summary generation failure shall not block conversation access.

## CRM-R39: AI Context and Memory Retention

**Priority:** P0

### Acceptance Criteria

1. Conversation memory used by AI shall be scoped to workspace, contact, conversation, and outlet context.
2. Current product decision sets memory retention to three months unless legal or business policy requires otherwise.
3. AI context shall use bounded summaries and relevant recent messages rather than unrestricted full history.
4. Expired AI memory shall not delete required CRM records.
5. Secrets and raw provider credentials shall never enter AI memory.
6. Retention jobs shall be auditable and idempotent.

## CRM-R40: AI Business Scope and Tool Restrictions

**Priority:** P0

### Acceptance Criteria

1. CRM AI features shall respect SelaluTeh business-domain scope.
2. Off-topic messages shall use the fixed out-of-scope route without RAG or business tools.
3. AI shall not change permissions, provider credentials, payment truth, or hidden CRM state.
4. Tool Gateway shall validate workspace, outlet, contact, conversation, and actor context.
5. Prompt instructions shall not expand access.
6. Human handoff shall remain available.

## CRM-R41: Order, Payment, and Complaint Context Panel

**Priority:** P0

### Acceptance Criteria

1. Conversation detail shall expose authorized summaries and links for current cart/order, payment, pickup, complaint, and ticket records.
2. External domain records shall remain authoritative.
3. CRM shall not directly mutate payment truth or order state outside approved commands.
4. Outlet scope shall filter linked records.
5. Unavailable external services shall degrade gracefully.
6. Context panel shall distinguish current and historical records.

## CRM-R42: Contact and Conversation Activity Timeline

**Priority:** P1

### Acceptance Criteria

1. CRM shall expose a timeline combining messages, assignments, handoff, notes, lifecycle changes, and linked domain events.
2. Audit domain remains the immutable authority for administrative actions.
3. Provider time, message time, and processing time shall be distinguishable.
4. Timeline shall be filterable and paginated.
5. Sensitive events shall be permission-protected.
6. Cross-domain failures shall not break the base message timeline.

## CRM-R43: Canned Replies and Internal Response Library

**Priority:** P1

### Acceptance Criteria

1. Workspace may maintain approved canned replies for human support.
2. Replies may be scoped by channel, outlet, language, category, and role.
3. Variables shall be validated and escaped.
4. Using a canned reply shall still create a normal outbound message.
5. AI shall not silently modify locked compliance text.
6. Reply library changes shall be audited.

## CRM-R44: Conversation Archive, Spam, and Restore

**Priority:** P1

### Acceptance Criteria

1. Authorized users may archive, mark spam, restore, or reopen conversations according to lifecycle rules.
2. Spam actions shall suppress ordinary AI and notification behavior.
3. Archive shall not delete messages or linked business records.
4. Restore shall return to a validated status.
5. Bulk actions shall be idempotent and report partial failures.
6. Every destructive-looking action shall be audited.

## CRM-R45: Bulk Inbox and Contact Operations

**Priority:** P1

### Acceptance Criteria

1. Authorized users may bulk assign, tag, mark read/unread, snooze, resolve, archive, or export selected records.
2. Every target shall be validated against workspace and outlet scope.
3. Partial failures shall be returned per record.
4. Large operations may use Admin Data Operations.
5. Bulk actions shall not bypass lifecycle rules.
6. Audit shall summarize affected records.

## CRM-R46: Notifications and Attention Signals

**Priority:** P1

### Acceptance Criteria

1. CRM shall emit attention events for new inbound messages, handoff pending, mentions, SLA breach, assignment, and reopened conversations.
2. Notification delivery remains owned by Notification Attention Engine.
3. Duplicate CRM events shall not create duplicate notifications.
4. User notification preferences shall be respected.
5. Sensitive message content shall not be included unless permitted.
6. Attention state shall not replace conversation truth.

## CRM-R47: CRM Analytics Event Contract

**Priority:** P1

### Acceptance Criteria

1. CRM shall emit provider-neutral events for response time, resolution time, handoff, reassignment, AI containment, human takeover, and conversation outcomes.
2. Analytics aggregation remains external.
3. Events shall avoid raw message content and unnecessary PII.
4. Metric definitions shall be versioned.
5. Test and production data shall be distinguishable.
6. Analytics failure shall not block messaging.

## CRM-R48: Authorization and Outlet Scope

**Priority:** P0

### Acceptance Criteria

1. Contact, conversation, message, note, assignment, export, and AI-assist actions shall use Workspace Access Control.
2. Outlet-scoped users shall access only permitted conversations and linked records.
3. Workspace-wide contact fields may require stronger permission than conversation reply.
4. AI execution identity shall be constrained.
5. Frontend visibility shall never replace backend authorization.
6. Cross-workspace/outlet tests shall pass.

## CRM-R49: Row-Level Security and Repository Scoping

**Priority:** P0

### Acceptance Criteria

1. Tenant-owned CRM tables shall include workspace_id.
2. Repositories shall require workspace context and outlet scope when applicable.
3. Supabase RLS shall provide defense-in-depth.
4. Unscoped repository methods shall be prohibited except reviewed platform jobs.
5. Counts, search, saved views, exports, and bulk actions shall use the same scoping.
6. RLS tests shall cover contact, conversation, message, note, and assignment records.

## CRM-R50: API Contracts and Error Model

**Priority:** P0

### Acceptance Criteria

1. APIs shall use strict request and response schemas.
2. Stable errors shall cover missing records, scope denial, invalid lifecycle transition, assignment failure, handoff conflict, duplicate identity, merge conflict, and version conflict.
3. Mutation APIs shall support idempotency where relevant.
4. Errors shall not leak cross-workspace existence.
5. Field validation errors shall map to UI fields.
6. API documentation shall include required permission.

## CRM-R51: Admin UI and State Support

**Priority:** P1

### Acceptance Criteria

1. Backend shall support the Chats page, conversation sidebar, order/payment context panel, Contacts page, contact detail, advanced filters, import/export, add/edit contact, merge, block, assignment, handoff, notes, activity, and bulk actions.
2. UI shall support loading, skeleton, empty, no-results, permission, conflict, stale data, partial failure, disconnected channel, and provider outage states.
3. AI handling and human handling shall be visually distinct.
4. Unread, assignment, outlet, channel, and SLA states shall be available.
5. Capability flags shall remain advisory only.

## CRM-R52: Optimistic Concurrency and Idempotent Commands

**Priority:** P0

### Acceptance Criteria

1. Contact, conversation, assignment, note, tag, custom field, snooze, handling mode, and merge mutations shall use version checks or equivalent conflict controls.
2. Inbound/outbound message creation and business-event notifications shall be idempotent.
3. Concurrent assignments shall not silently overwrite.
4. Handoff and human reply races shall be handled deterministically.
5. Version conflict responses shall include safe latest metadata.
6. Concurrency tests shall cover message, assignment, handoff, merge, and resolve races.

## CRM-R53: Audit and Domain Events

**Priority:** P0

### Acceptance Criteria

1. Contact lifecycle, merge, block, assignment, handoff, notes, conversation lifecycle, and bulk operations shall be auditable.
2. Events shall distinguish human, AI, system, provider, and automation actors.
3. Events shall include workspace, contact, conversation, outlet when applicable, correlation, timestamp, and version.
4. Secrets and unnecessary message content shall not be included.
5. Critical consumers shall use outbox or reliable delivery.
6. Consumers shall be idempotent.

## CRM-R54: Security and Privacy

**Priority:** P0

### Acceptance Criteria

1. PII shall be minimized, protected, and permission-scoped.
2. Provider credentials and raw webhook secrets shall never enter CRM responses or AI context.
3. Internal notes shall never be customer-visible.
4. Exports and diagnostics shall be redacted.
5. Abuse, spam, and unauthorized access shall be rate-limited and monitored.
6. Security review shall precede production release.

## CRM-R55: Legacy Migration and Compatibility

**Priority:** P0

### Acceptance Criteria

1. Existing inbox, chat, message, contact, takeover, order sidebar, and channel identity implementations shall be audited.
2. Legacy Mongo/Mongoose models shall not remain authoritative after Supabase cutover.
3. Fresh Supabase data may be used where legacy test data is unimportant.
4. Retained contacts/conversations/messages shall map provider identities and outlet context.
5. Temporary compatibility adapters shall be documented and removable.
6. Cutover and rollback shall be documented.

## CRM-R56: Testing and Quality Assurance

**Priority:** P0

### Acceptance Criteria

1. Implementation shall follow TDD.
2. Unit, component, integration, security, property, concurrency, resilience, and performance tests shall be present.
3. Integration tests shall cover Channel Connections, Access Control, AI Tool Gateway, Orders, Payments, Complaints, Audit, and Notifications.
4. Security tests shall cover cross-workspace/outlet access, internal-note leakage, PII leakage, AI scope bypass, and forged actor context.
5. Production data and secrets shall not be used.
6. Skipped critical tests shall block release.

## CRM-R57: Scalability and Performance

**Priority:** P1

### Acceptance Criteria

1. Contact identity, conversation status, assignment, outlet, unread, provider message ID, and timestamps shall be indexed.
2. Inbox and contact lists shall paginate.
3. Message timelines shall use bounded pagination.
4. Search and summary read models shall avoid N+1 queries.
5. Event and notification processing shall be horizontally scalable and idempotent.
6. Performance tests shall use realistic synthetic workspaces, outlets, contacts, conversations, and messages.

## CRM-R58: Operational Readiness and Recovery

**Priority:** P1

### Acceptance Criteria

1. CRM data shall be backed up according to platform policy.
2. Restore shall preserve workspace isolation, message ordering, identity mapping, and linked business references.
3. Runbooks shall cover message backlog, failed assignment, stuck handoff, duplicate identity, merge incident, unread-count drift, and AI summary failure.
4. Repair tools shall be access-controlled and audited.
5. Disaster recovery shall avoid duplicate outbound messages and lost inbound records.
6. Operational ownership shall be documented.


---
# Alpha Slice

Minimum alpha:

```text
workspace-scoped contacts
WhatsApp and Telegram channel identities
conversation + message persistence
inbox views: All, Mine, Unassigned, AI, Human, Handoff Pending
outlet visibility
unread/read state
assignment to outlet member/team
AI_ACTIVE / HANDOFF_PENDING / HUMAN_ACTIVE
manual and smart handoff basics
internal notes
order/payment context links
outbound reply through Channel Connections
three-month AI memory boundary
critical authorization, RLS, idempotency, and concurrency tests
```

May follow after alpha:

```text
custom fields
advanced tags/segmentation
contact import/export
smart SLA
mentions
AI assist drafts
advanced summaries
bulk operations
consent center
advanced canned replies
contact merge UI
analytics dashboards
```

# Definition of Done

1. Workspace and outlet isolation pass.
2. Inbound messages persist durably.
3. Duplicate provider events create one CRM message.
4. Outbound commands create one visible message.
5. Contact/channel identity resolution is deterministic.
6. AI and human handling modes do not conflict.
7. Handoff works with valid outlet/team permissions.
8. Internal notes never reach customers.
9. Order/payment context remains read-only unless an approved domain command is used.
10. Three-month AI memory policy is enforced without deleting required CRM history.
11. Audit/events/notifications are idempotent.
12. Security, property, concurrency, resilience, and performance tests pass.
13. `npm run specs:check` passes.

# Final Requirement Statement

```text
Channel event
→ contact identity
→ conversation
→ durable message
→ outlet-scoped inbox
→ AI or human handling
→ authorized outbound response
→ linked customer, order, payment, and support history
```

The system shall never expose cross-workspace conversations, send internal notes to customers, let AI reply during active human takeover, or lose an inbound message because AI or another downstream service failed.
