---
schema_version: 1
document_type: implementation-plan
spec_id: selaluteh-crm-inbox-contacts
title: SelaluTeh CRM Inbox & Contacts Tasks
status: active
workflow_state: in_progress
version: 1.0.0
updated_at: 2026-06-23
development_method: test-driven-development
---

# Implementation Plan: SelaluTeh CRM Inbox & Contacts

## Method

```text
RED
→ GREEN
→ REFACTOR
→ VERIFY
```

# Global Completion Rules

- [x] Failing test written and observed first.
- [x] Workspace/outlet isolation verified.
- [x] Inbound durability verified.
- [x] Internal-note isolation verified.
- [x] AI/human handling conflict tested.
- [x] Message idempotency verified.
- [x] Docs and implementation status updated.
- [x] `npm run specs:check` passes.

# 0. Preflight and Repository Audit

## 0.1 Authority
- [x] Confirm ID `selaluteh-crm-inbox-contacts`.
- [x] Confirm `CRM-R` prefix.
- [x] Confirm CRM owns contacts/conversations/messages.
- [x] Confirm Channel Connections owns provider transport.
- [x] Confirm Order/Payment/Complaint remain authoritative.

## 0.2 Audit legacy implementation
- [x] Locate contact models/routes/services.
- [x] Locate chat/conversation/message models.
- [x] Locate human takeover state.
- [x] Locate AI conversation memory.
- [x] Locate order sidebar/context code.
- [x] Locate Mongo/Mongoose and Supabase structures.
- [x] Identify duplicate or unscoped queries.
- [x] Identify internal-note leakage risks.

## 0.3 Deterministic fixtures
- [x] Workspace/outlet/user/team fixtures.
- [x] Contact/channel identity fixtures.
- [x] Conversation/message fixtures.
- [x] Channel Connections fake.
- [x] AI Tool Gateway fake.
- [x] Order/Payment/Complaint fakes.
- [x] Fixed clock and idempotency helpers.
- [x] Audit/notification spies.

## 0.4 Test scripts

```text
test:crm:unit
test:crm:component
test:crm:integration
test:crm:security
test:crm:property
test:crm:concurrency
test:crm:resilience
test:crm:performance
test:crm:all
```

# 1. Shared Types, Statuses, and Permissions

- [x] Contact statuses.
- [x] Conversation lifecycle statuses.
- [x] Handling modes.
- [x] Message directions/actor/content types.
- [x] Priority/SLA states.
- [x] Handoff statuses and trigger types.
- [x] Contact and conversation permissions.
- [x] Stable error codes.
- [x] Unknown enum/permission tests.

# 2. Supabase Schema and RLS

- [x] `contacts`.
- [x] `contact_channel_identities`.
- [x] `contact_tags`.
- [x] `contact_tag_assignments`.
- [x] Custom-field tables.
- [x] `conversations`.
- [x] `messages`.
- [x] Assignment history.
- [x] Handoff records.
- [x] User read/follow states.
- [x] Conversation summaries.
- [x] Indexes/constraints/versioning.
- [x] Workspace RLS.
- [x] Outlet-scoped policies.
- [x] Service integration policies.
- [x] RLS tests.

# 3. Contact Core

- [x] Create/read/update contact.
- [x] Normalize name/phone/email.
- [x] Lifecycle transitions.
- [x] Block/unblock.
- [x] Archive/anonymize boundary.
- [x] Version checks.
- [x] Audit/events.
- [x] Cross-workspace tests.

# 4. Channel Identity Resolution

- [x] Exact provider identity matching.
- [x] Connection/workspace scope.
- [x] Phone/email fallback policy.
- [x] New-contact creation.
- [x] Identity status/history.
- [x] Duplicate identity constraints.
- [x] Retry idempotency.
- [x] Channel Connections integration tests.

# 5. Contact Deduplication and Merge

- [x] Duplicate-candidate query.
- [x] Deterministic exact match.
- [x] Fuzzy-review boundary.
- [x] Merge plan and conflict resolution.
- [x] Transactional canonicalization.
- [x] Repoint conversations/identities/domain references.
- [x] Preserve merged record.
- [x] Merge idempotency.
- [x] Concurrency and audit tests.

# 6. Contact Tags and Custom Fields

- [x] Tag CRUD.
- [x] Tag assignment/removal.
- [x] Typed custom-field definitions.
- [x] Field validation/visibility.
- [x] Contact field values.
- [x] Search/filter integration.
- [x] AI/export redaction.
- [x] Bulk/tag tests.

# 7. Consent and Communication Preferences

- [x] Consent record/history.
- [x] Channel-specific opt-out.
- [x] Service vs marketing distinction.
- [x] Provider opt-out event integration.
- [x] AI/automation enforcement.
- [x] Permission/audit tests.

# 8. Conversation Core

- [x] Create/read conversation.
- [x] Provider thread references.
- [x] Contact/connection/channel identity linkage.
- [x] Optional outlet context.
- [x] Lifecycle transitions.
- [x] Reopen on inbound policy.
- [x] Archive/spam.
- [x] Versioning/events/audit.

# 9. Handling Mode

- [x] AI_ACTIVE.
- [x] HANDOFF_PENDING.
- [x] HUMAN_ACTIVE.
- [x] HUMAN_PAUSED.
- [x] AUTOMATION_DISABLED.
- [x] Transition guards.
- [x] Pre-generation and pre-send checks.
- [x] Race-condition tests.

# 10. Message Core and Durable Inbound

- [x] Message repository/model.
- [x] Inbound normalized payload adapter.
- [x] Persist before AI/human processing.
- [x] Provider ID deduplication.
- [x] Content-type normalization.
- [x] Unsupported-content fallback.
- [x] Deterministic ordering.
- [x] Inbound failure/retry tests.

# 11. Outbound Message Intent

- [x] Validate actor/conversation/handling mode.
- [x] Create outbound message intent.
- [x] Send through Channel Connections.
- [x] Link transport ID/provider message ID.
- [x] Update normalized status.
- [x] Idempotent command.
- [x] Prevent INTERNAL transport.
- [x] Retry/ambiguous result tests.

# 12. Inbox Queries and Saved Views

- [x] All.
- [x] Mine.
- [x] Unassigned.
- [x] AI Handling.
- [x] Human Handling.
- [x] Handoff Pending.
- [x] Waiting for Customer.
- [x] Waiting for Team.
- [x] Snoozed.
- [x] Resolved.
- [x] Search/filter/sort/pagination.
- [x] Authorization-scoped counts.
- [x] Empty/no-results states.
- [x] Query-plan tests.

# 13. Unread and User Conversation State

- [x] Per-conversation unread.
- [x] Per-user last-read state.
- [x] Mark read/unread.
- [x] Inbound attention increment.
- [x] Exclude AI/system false increments.
- [x] Idempotent updates.
- [x] Concurrent read/new-message tests.
- [x] Count-repair command/runbook.

# 14. Outlet Context and Visibility

- [x] Conversation outlet assignment.
- [x] Workspace-level unresolved state.
- [x] Outlet-scoped reads.
- [x] Outlet change validation.
- [x] Cart/Order contract.
- [x] Other-outlet non-disclosure.
- [x] RLS and service tests.

# 15. Assignment and Team Routing

- [x] Member/team eligibility.
- [x] Outlet access validation.
- [x] Assign/reassign/unassign.
- [x] Assignment history.
- [x] Unassigned fallback queue.
- [x] Handling-mode coordination.
- [x] Version conflict tests.
- [x] Suspended-member handling.

# 16. Human Handoff

- [x] Manual handoff command.
- [x] HANDOFF_PENDING state.
- [x] Team/member route.
- [x] Fallback queue.
- [x] HUMAN_ACTIVE acceptance.
- [x] AI pause.
- [x] Handoff history.
- [x] Notification event.
- [x] Concurrency: handoff vs AI send.

# 17. Smart Handoff

- [x] Trigger registry.
- [x] Customer request.
- [x] Complaint/payment issue.
- [x] Repeated failure.
- [x] Low confidence.
- [x] Safety/unsupported request.
- [x] Reason codes.
- [x] Outlet/team availability.
- [x] Evaluation fixtures.
- [x] False-positive/false-negative review.

# 18. Return to AI

- [x] Eligibility checks.
- [x] Resolve channel/outlet/workspace agent.
- [x] Build bounded context.
- [x] Transition to AI_ACTIVE.
- [x] Audit.
- [x] Optional explicit automatic policy.
- [x] Race tests.

# 19. Internal Notes and Mentions

- [x] INTERNAL message creation.
- [x] Never send externally.
- [x] Permission/outlet scope.
- [x] Mentions.
- [x] Notification integration.
- [x] Note edit/delete policy.
- [x] AI visibility policy.
- [x] Leakage security tests.

# 20. Snooze, Priority, and SLA

- [x] Snooze command.
- [x] Snooze scheduler.
- [x] Unsnooze on inbound.
- [x] Priority mutation.
- [x] Business-hours SLA calculation.
- [x] Breach attention event.
- [x] Idempotent scheduler.
- [x] Timezone/special-hours tests.

# 21. Contact Search and Detail Read Model

- [x] Search name/phone/email/channel identity.
- [x] Status/channel/outlet/tag/activity filters.
- [x] Stable pagination/sort.
- [x] Contact detail aggregation.
- [x] Channel identities.
- [x] Conversations/orders/payments/complaints links.
- [x] Capability/version.
- [x] Sensitive-field redaction.
- [x] No N+1.

# 22. Conversation Detail and Context Sidebar

- [x] Conversation header/read model.
- [x] Contact summary.
- [x] Channel/outlet/assignment.
- [x] Handling and handoff state.
- [x] Message pagination.
- [x] Current cart/order.
- [x] Payment status/link summary.
- [x] Complaint/ticket links.
- [x] Recent orders.
- [x] Notes/tags.
- [x] Graceful external failure.
- [x] Hide/minimize sidebar state contract.

# 23. AI Suggested Replies

- [x] Assist-only command.
- [x] Business scope check.
- [x] Authorized context builder.
- [x] Draft vs sent distinction.
- [x] Human edit tracking.
- [x] Unsafe/off-topic rejection.
- [x] Feedback capture.
- [x] No automatic send tests.

# 24. AI Conversation Summary

- [x] Summary schema.
- [x] Facts vs inference vs unresolved.
- [x] Source-message boundary.
- [x] Freshness timestamp.
- [x] Redaction.
- [x] Regeneration policy.
- [x] Failure fallback.
- [x] Evaluation tests.

# 25. AI Memory Retention

- [x] Three-month memory window.
- [x] Conversation/contact/outlet scoping.
- [x] Bounded recent messages.
- [x] Summary-based long context.
- [x] Expiration job.
- [x] CRM history preservation.
- [x] Secret exclusion.
- [x] Audit/idempotency tests.

# 26. AI Scope and Tool Security

- [x] Business-domain classifier integration.
- [x] Fixed out-of-scope response.
- [x] No RAG/tools for off-topic.
- [x] Tool Gateway context validation.
- [x] No permission/provider/payment-truth mutation.
- [x] Human handoff fallback.
- [x] Prompt injection/adversarial tests.

# 27. Order, Payment, and Complaint Context

- [x] Read contracts.
- [x] Current vs historical records.
- [x] Outlet scoping.
- [x] Safe summaries.
- [x] Approved domain commands only.
- [x] External failure fallback.
- [x] Cross-domain contract tests.

# 28. Contact Import and Export

- [x] Import schema/template.
- [x] Dry-run validation.
- [x] Matching/upsert policy.
- [x] Row-level errors.
- [x] Async job integration.
- [x] Export field permissions.
- [x] Outlet/workspace scope.
- [x] Redaction/audit.

# 29. Bulk Operations

- [x] Bulk assign.
- [x] Bulk tag.
- [x] Bulk read/unread.
- [x] Bulk snooze.
- [x] Bulk resolve/archive/spam.
- [x] Per-record authorization.
- [x] Partial failures.
- [x] Idempotency.
- [x] Async handoff for large jobs.
- [x] Audit summary.

# 30. Canned Replies

- [x] Reply library schema.
- [x] Outlet/channel/language scope.
- [x] Variable validation.
- [x] Permission.
- [x] Usage creates normal outbound message.
- [x] Locked compliance text.
- [x] Audit.
- [x] Provider capability tests.

# 31. Activity Timeline

- [x] Message timeline.
- [x] Assignment/handoff events.
- [x] Contact lifecycle.
- [x] Notes.
- [x] Order/payment/complaint links.
- [x] Provider/process timestamps.
- [x] Filters/pagination.
- [x] Permission/redaction.
- [x] External failure fallback.

# 32. API Contracts

- [x] Contact endpoints.
- [x] Merge/block/tag endpoints.
- [x] Conversation list/detail.
- [x] Assignment/handoff.
- [x] Snooze/resolve/reopen/archive.
- [x] Read/unread.
- [x] Messages/notes.
- [x] AI suggestion/summary.
- [x] Strict schemas.
- [x] Stable errors.
- [x] Idempotency and versioning.
- [x] Permission documentation.

# 33. UI Contracts

## Chats
- [x] Three-column layout payload.
- [x] Conversation filters/queues.
- [x] Channel/outlet/assignment badges.
- [x] AI/human/handoff state.
- [x] Unread/priority/SLA.
- [x] Composer permissions.
- [x] Context sidebar.
- [x] Notes.
- [x] Loading/empty/no-results/error/conflict.

## Contacts
- [x] Summary cards.
- [x] Search/filter/table.
- [x] Add/edit contact.
- [x] Detail drawer/page.
- [x] Merge/block/archive.
- [x] Import/export.
- [x] Activity.
- [x] Partial failures.

# 34. Events, Audit, and Notifications

- [x] Contact events.
- [x] Conversation lifecycle/handling events.
- [x] Assignment/handoff events.
- [x] Message/note events.
- [x] Outbox.
- [x] Human/AI/system/provider actor distinction.
- [x] Mention/assignment/new-message notifications.
- [x] SLA/reopen notifications.
- [x] Duplicate notification prevention.
- [x] PII/content minimization.

# 35. Security Test Matrix

- [x] Cross-workspace contact/conversation/message.
- [x] Cross-outlet conversation and linked order/payment.
- [x] Internal note customer leakage.
- [x] Unauthorized merge/block/export.
- [x] Forged AI/system actor.
- [x] AI prompt scope expansion.
- [x] Blocked contact outbound.
- [x] Contact identity collision.
- [x] PII in logs/export/summary.
- [x] Unscoped counts/search.

# 36. Property and Concurrency Tests

Properties:

- [x] Duplicate provider message yields one CRM message.
- [x] INTERNAL message never reaches transport.
- [x] HUMAN_ACTIVE blocks autonomous AI reply.
- [x] Merged contact resolves to canonical.
- [x] Unread count never becomes negative.
- [x] Cross-workspace/outlet access never succeeds.

Concurrency:

- [x] Two assignments.
- [x] Handoff vs AI send.
- [x] Resolve vs inbound.
- [x] Merge vs new message.
- [x] Read update vs inbound.
- [x] Duplicate inbound workers.
- [x] Archive vs reply.

# 37. Resilience Tests

- [x] Channel Connections unavailable.
- [x] AI unavailable.
- [x] Order/Payment/Complaint unavailable.
- [x] Notification unavailable.
- [x] Audit unavailable.
- [x] Cache unavailable.
- [x] Summary generation failure.
- [x] Scheduler failure.
- [x] Retry/dead-letter recovery.

# 38. Performance and Scale

- [x] Many workspaces/outlets.
- [x] 100k+ synthetic contacts.
- [x] Large conversation/message history.
- [x] Inbox query benchmarks.
- [x] Contact search benchmarks.
- [x] Message pagination benchmarks.
- [x] Unread-count update benchmarks.
- [x] Index/query-plan review.
- [x] No N+1.
- [x] Bounded payloads.

# 39. Migration and Cutover

- [x] Audit legacy data/code.
- [x] Create Supabase schema/RLS.
- [x] Migrate retained contacts.
- [x] Migrate channel identities.
- [x] Migrate conversations/messages.
- [x] Map outlet/channel connection.
- [x] Verify message order/dedup.
- [x] Verify takeover state.
- [x] Verify order/payment context.
- [x] Disable Mongo authority.
- [x] Remove duplicate legacy services.
- [x] Document rollback.

# 40. Alpha End-to-End Validation

```text
WhatsApp / Telegram inbound
→ resolve Contact
→ create/reuse Conversation
→ persist Message
→ select Outlet
→ AI responds
→ customer asks for human
→ handoff
→ human replies
→ create Order
→ show Xendit link/status
→ selected outlet sees conversation/order
→ other outlet cannot
```

- [x] WhatsApp path.
- [x] Telegram path.
- [x] Duplicate inbound.
- [x] Duplicate outbound.
- [x] AI/human race.
- [x] Internal note isolation.
- [x] Unread/read.
- [x] Assignment.
- [x] Handoff fallback.
- [x] Order/payment context.
- [x] Cross-outlet denial.
- [x] Three-month AI memory boundary.

# 41. Fastest Safe Alpha Slice

Implement first:

```text
0 preflight
1 types/permissions
2 Supabase/RLS
3 Contact
4 Channel identity
8 Conversation
9 Handling mode
10 Inbound Message
11 Outbound intent
12 Inbox views
13 Unread
14 Outlet visibility
15 Assignment
16 Handoff
17 smart handoff basics
19 Internal notes
21 Contact read model
22 Conversation/sidebar
25 AI memory
26 AI scope
27 Order/payment context
32 APIs
33 UI contracts
34 Events/audit/notifications
35 Security
36 Concurrency/property
37 Resilience
39 Migration
40 E2E
```

May defer:

```text
advanced tags/custom fields
consent center
contact merge UI
SLA
mentions
AI assist suggestions
advanced summaries
import/export
bulk operations
canned replies
advanced analytics
```

# 42. Final Validation

Commands:

```text
npm run specs:check
npm run test:crm:unit
npm run test:crm:component
npm run test:crm:integration
npm run test:crm:security
npm run test:crm:property
npm run test:crm:concurrency
npm run test:crm:resilience
npm run test:crm:performance
npm run test:crm:all
```

# Requirement Traceability

| Requirements | Task Sections |
|---|---|
| CRM-R1–R5 | 0–5 |
| CRM-R6–R15 | 3–7, 21, 28 |
| CRM-R16–R24 | 8–20 |
| CRM-R25–R33 | 10–13, 19, 20 |
| CRM-R34–R40 | 16–26 |
| CRM-R41–R47 | 22, 27, 31, 34 |
| CRM-R48–R54 | 2, 32–37 |
| CRM-R55–R58 | 38–42 |

# Definition of Done

```text
all P0 tasks complete
approved P1 deferrals documented
workspace/outlet isolation proven
contact and identity resolution proven
inbound durability and deduplication proven
outbound idempotency proven
AI/human handling conflict prevention proven
handoff and assignment proven
internal notes isolated
order/payment boundaries preserved
three-month AI memory enforced
all release-gate tests pass
implementation status reflects repository reality
specs check passes
```
