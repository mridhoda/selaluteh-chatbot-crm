---
schema_version: 1
document_type: implementation-plan
spec_id: selaluteh-channel-connections-sync
title: SelaluTeh Channel Connections & Sync Tasks
status: active
workflow_state: in_progress
version: 1.0.0
updated_at: 2026-06-23
development_method: test-driven-development
---

# Implementation Plan: SelaluTeh Channel Connections & Sync

## Method

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
selaluteh-crm-inbox-contacts
selaluteh-ai-agent-architecture
selaluteh-ai-agent-scope-security
selaluteh-product-catalog
selaluteh-cart-order-lifecycle
selaluteh-payments-xendit
selaluteh-audit-activity-timeline
selaluteh-notification-attention-engine
```

# Global Completion Rules

- [x] Failing test written and observed first.
- [x] Minimal implementation passes.
- [x] Workspace/outlet isolation verified.
- [x] Secrets never exposed.
- [x] Webhook verification and idempotency verified.
- [x] Outbound idempotency verified.
- [x] Provider contract version recorded.
- [x] Docs and implementation status updated.
- [x] `npm run specs:check` passes.

# 0. Preflight and Repository Audit

## 0.1 Spec authority
- [x] Confirm ID and `CCS-R` prefix.
- [x] Confirm WhatsApp/Telegram are P0.
- [x] Confirm Connected Platforms vs outlet assignment boundary.
- [x] Confirm CRM owns conversation/message business records.
- [x] Confirm no provider credential belongs to an outlet.

## 0.2 Provider contract audit
- [x] Revalidate WhatsApp provider/API contract.
- [x] Revalidate Telegram Bot API contract.
- [x] Record webhook verification method.
- [x] Record status/delivery capability.
- [x] Record message/media/template limits.

## 0.3 Legacy repository audit
- [x] Locate Telegram webhook/bot code.
- [x] Locate Meta/WhatsApp/Instagram webhook code.
- [x] Locate direct provider calls in controllers/services.
- [x] Locate credentials in source/database.
- [x] Locate Mongo models and Supabase tables.
- [x] Locate CRM/AI/order/payment integration points.
- [x] Identify unverified or duplicate webhook handling.

## 0.4 Deterministic test harness
- [x] Workspace/outlet fixtures.
- [x] Connection/assignment fixtures.
- [x] Provider fake adapters.
- [x] Raw webhook builders.
- [x] Fixed clock.
- [x] Queue/outbox spies.
- [x] CRM/AI/Order/Payment fakes.
- [x] Secret redaction assertions.

## 0.5 Test scripts

```text
test:channels:unit
test:channels:component
test:channels:integration
test:channels:security
test:channels:property
test:channels:concurrency
test:channels:resilience
test:channels:performance
test:channels:all
```

# 1. Shared Types, Registry, and Permissions

- [x] Define provider/channel registry.
- [x] Define capability registry.
- [x] Define connection lifecycle/status dimensions.
- [x] Define normalized message/event contracts.
- [x] Define transport states.
- [x] Define routing and AI handling policies.
- [x] Register channel permissions.
- [x] Add unknown-provider/capability tests.

# 2. Supabase Schema and RLS

- [x] `channel_connections`.
- [x] `outlet_channel_assignments`.
- [x] `channel_webhook_events`.
- [x] `channel_message_transports`.
- [x] `channel_identity_mappings`.
- [x] `channel_resource_mappings`.
- [x] Indexes and unique constraints.
- [x] Version fields.
- [x] Workspace RLS.
- [x] Outlet-scoped read/write RLS.
- [x] Service webhook path.
- [x] Cross-workspace/outlet RLS tests.

# 3. Secret and Configuration Layer

- [x] Secret-reference abstraction.
- [x] WhatsApp credentials/configuration schema.
- [x] Telegram token/configuration schema.
- [x] Environment separation.
- [x] Startup/config validation.
- [x] Secret rotation hooks.
- [x] Redacted diagnostics.
- [x] Production-credential prohibition in CI.

# 4. Provider Adapter Framework

- [x] Define `ChannelAdapter`.
- [x] Define capabilities contract.
- [x] Define provider error mapping.
- [x] Define webhook verifier interface.
- [x] Define send/test/reconnect/reauthorize interfaces.
- [x] Define optional catalog/order sync interfaces.
- [x] Add adapter contract tests.

# 5. WhatsApp Adapter

- [x] Implement inbound text normalization.
- [x] Implement outbound text/link.
- [x] Map provider message IDs.
- [x] Map delivery/read/failure events when available.
- [x] Implement webhook verification.
- [x] Add media capability hooks.
- [x] Add template/proactive boundary.
- [x] Implement provider rate/error mapping.
- [x] Record contract version.
- [x] Add fixture and contract tests.

# 6. Telegram Adapter

- [x] Implement inbound update normalization.
- [x] Implement outbound text/link.
- [x] Map update/message/chat/user IDs.
- [x] Implement webhook setup/verification strategy.
- [x] Prevent webhook and polling conflict.
- [x] Add supported media/interaction mapping.
- [x] Implement provider rate/error mapping.
- [x] Record contract version.
- [x] Add fixture and contract tests.

# 7. Connection Lifecycle Service

- [x] Create/list/detail/update connection.
- [x] Validate workspace ownership.
- [x] Implement DRAFT/PENDING/CONNECTED/DEGRADED/DISCONNECTED/REAUTH_REQUIRED/SUSPENDED/ARCHIVED.
- [x] Version checks.
- [x] Idempotent connect/disconnect.
- [x] Events/audit.
- [x] Historical reference preservation.
- [x] Lifecycle property tests.

# 8. Webhook Registration and Durable Intake

- [x] Generate non-secret connection route keys.
- [x] Register webhook ownership.
- [x] Preserve raw verification inputs.
- [x] Verify before mutation.
- [x] Insert unique webhook inbox record.
- [x] Sanitize payload.
- [x] Queue processing.
- [x] Return provider-safe acknowledgement.
- [x] Add size/rate limits.
- [x] Add replay and malformed-payload tests.

# 9. Webhook Processor and Deduplication

- [x] Normalize verified events.
- [x] Implement deterministic event key.
- [x] Track processing states/retries.
- [x] Ignore duplicates safely.
- [x] Add manual replay permission/audit.
- [x] Handle unknown events.
- [x] Add late/out-of-order tests.
- [x] Add crash/retry tests.

# 10. CRM Identity, Contact, and Conversation Integration

- [x] Resolve channel identity.
- [x] Upsert channel identity mapping.
- [x] Resolve/create CRM contact.
- [x] Resolve/create/reuse conversation.
- [x] Persist inbound message.
- [x] Preserve provider IDs/timestamps.
- [x] Prevent duplicate contact/conversation/message.
- [x] Handle unsupported content safely.
- [x] Add CRM failure resilience tests.

# 11. Outbound Dispatcher

- [x] Define send command.
- [x] Validate authorization/capability/context.
- [x] Persist transport command.
- [x] Queue by provider/connection/conversation.
- [x] Send through adapter.
- [x] Store provider message ID.
- [x] Update transport status.
- [x] Implement retry/backoff.
- [x] Implement dead-letter.
- [x] Prevent duplicate visible sends.
- [x] Add ambiguous-timeout reconciliation.

# 12. Delivery and Read-State Processing

- [x] Normalize SENT/DELIVERED/READ/FAILED/UNKNOWN.
- [x] Match provider message ID.
- [x] Enforce monotonic progression rules.
- [x] Sanitize failure reasons.
- [x] Handle unsupported statuses.
- [x] Add late/duplicate status tests.
- [x] Add delivery metrics.

# 13. Outlet Channel Assignment

- [x] Create assignment repository/service.
- [x] Validate same workspace.
- [x] ENABLED/DISABLED/PENDING_CONFIGURATION.
- [x] accepts_chats.
- [x] accepts_orders.
- [x] routing mode.
- [x] AI handling.
- [x] human team.
- [x] outside-hours and notification policies.
- [x] Version/idempotency.
- [x] Cache invalidation.
- [x] Audit/events.

# 14. Routing Resolver

- [x] CUSTOMER_SELECTS_OUTLET default.
- [x] PRESELECTED_OUTLET.
- [x] FIXED_OUTLET.
- [x] MANUAL_ROUTING.
- [x] NEAREST_OUTLET_SUGGESTION contract.
- [x] Filter disabled/non-ordering outlets.
- [x] Require customer confirmation.
- [x] Persist selected outlet context.
- [x] Handle outlet switch.
- [x] Add routing property/security tests.

# 15. AI Handling and Tool Gateway

- [x] Resolve channel override.
- [x] Resolve outlet override.
- [x] Resolve workspace default.
- [x] Support AI_DISABLED.
- [x] Validate tool permissions.
- [x] Block provider secret/config tools.
- [x] Respect scope guard.
- [x] Bound message/tool loops.
- [x] Add off-topic/no-tool tests.
- [x] Add cross-outlet tests.

# 16. Human Handoff and Team Routing

- [x] Validate default human team.
- [x] Integrate CRM takeover state.
- [x] Pause AI after handoff.
- [x] Human reply through same connection.
- [x] Fallback queue.
- [x] Optional return-to-AI policy.
- [x] Team/outlet permission tests.
- [x] Concurrency: handoff vs AI response.

# 17. Outside-Hours Policy

- [x] Integrate outlet hours/timezone/special hours.
- [x] Continue-AI mode.
- [x] Inquiry-only/order-block mode.
- [x] Auto-reply.
- [x] Suggest another outlet.
- [x] Human queue.
- [x] Prevent duplicate auto-reply.
- [x] Add boundary/timezone tests.

# 18. Payment and Order Notifications

- [x] Payment-link payload from Payments domain.
- [x] WhatsApp delivery.
- [x] Telegram delivery.
- [x] Expiry and amount display.
- [x] Order-status event templates.
- [x] Outlet-aware status.
- [x] Delivery idempotency.
- [x] Failure does not alter business truth.
- [x] Duplicate event no duplicate message.

# 19. Templates and Proactive Messaging

- [x] Template registry.
- [x] Provider template ID/status/version.
- [x] Safe variable mapping.
- [x] Conversation-window policy.
- [x] Opt-out enforcement.
- [x] Proactive permission.
- [x] Rejected-template handling.
- [x] Audit and provider tests.

# 20. Media and Attachments

- [x] Normalize supported media.
- [x] Validate type/size.
- [x] Safe provider download.
- [x] Media storage contract.
- [x] Expired URL handling.
- [x] Unsupported-content fallback.
- [x] AI-safe attachment handling.
- [x] SSRF/malware/security tests.

# 21. Health Monitoring and Diagnostics

- [x] Health signal collector.
- [x] UNKNOWN/HEALTHY/DEGRADED/UNHEALTHY/OFFLINE resolver.
- [x] Credential validity signal.
- [x] Webhook recency/failure signal.
- [x] Outbound success/latency signal.
- [x] Rate-limit/backlog signal.
- [x] Sync signal.
- [x] Safe reason/last checked.
- [x] Test Connection command.
- [x] Optional test-message confirmation.
- [x] Alerts and dashboard metrics.

# 22. Reconnect and Reauthorize

- [x] Reconnect command.
- [x] Reauthorization command/adapter hooks.
- [x] Preserve connection identity.
- [x] Rotate/revoke old secret references.
- [x] Prevent concurrent duplicate operation.
- [x] Update lifecycle/health.
- [x] Audit.
- [x] Failure recovery tests.

# 23. Channel Settings Read Model

- [x] Connected Channels tab payload.
- [x] Channel Settings tab payload.
- [x] Inherited vs overridden values.
- [x] Capabilities and supported actions.
- [x] Outlet assignment state.
- [x] Routing/AI/team summaries.
- [x] Version/capability flags.
- [x] Field validation errors.

# 24. Webhooks and Activity Read Models

- [x] Webhook event list/detail summary.
- [x] Filters/pagination.
- [x] Verification/processing/retry/latency.
- [x] Redacted payload diagnostics.
- [x] Replay capability.
- [x] Activity event list.
- [x] Actor and outlet context.
- [x] Empty/no-results states.
- [x] Secret-redaction tests.

# 25. Catalog Sync

- [x] Consume Product Catalog version/events.
- [x] Capability check.
- [x] Provider-neutral sync command.
- [x] Provider mapping.
- [x] Outlet price/availability support.
- [x] Idempotent/version-aware job.
- [x] Unsupported-feature warnings.
- [x] Failed sync leaves canonical data unchanged.
- [x] UI status/result.

# 26. External Order Sync

- [x] Capability check.
- [x] Normalize provider order.
- [x] Validate mapping/amount/outlet.
- [x] Order domain command.
- [x] Duplicate external-order prevention.
- [x] Review queue for unknown mappings.
- [x] Provider order mapping.
- [x] Explicitly exclude normal WhatsApp/Telegram chatbot orders.

# 27. Bulk Multi-Outlet Operations

- [x] Enable/disable connection across outlets.
- [x] Replace settings for selected outlets.
- [x] Per-outlet authorization.
- [x] Partial-failure result.
- [x] Destructive confirmation.
- [x] Async job handoff for large operations.
- [x] Audit summary.
- [x] Cache invalidation.

# 28. API Contracts

- [x] Workspace connection endpoints.
- [x] Outlet channel assignment endpoints.
- [x] Test/reconnect/reauthorize/disconnect.
- [x] Webhook list/replay.
- [x] Activity.
- [x] Catalog/order sync.
- [x] Provider webhook routes.
- [x] Strict schemas/errors/idempotency.
- [x] API documentation with permissions.

# 29. UI and Popup Contracts

- [x] Connected Platforms page.
- [x] Connected Channels tab.
- [x] Channel Settings tab.
- [x] Webhooks tab.
- [x] Activity tab.
- [x] Connect/Test/Reconnect/Reauthorize.
- [x] Disable for Outlet vs Disconnect Platform.
- [x] Loading/empty/no-results.
- [x] Permission/conflict/outage.
- [x] Partial bulk/sync failure.
- [x] Separate status dimensions.

# 30. Events, Audit, and Observability

- [x] Connection events.
- [x] Webhook events.
- [x] Message transport events.
- [x] Assignment/settings events.
- [x] Health events.
- [x] Sync events.
- [x] Reliable outbox.
- [x] Actor/correlation metadata.
- [x] Metrics and alerts.
- [x] Runbook links.
- [x] Secret/PII redaction.

# 31. Security Test Matrix

- [x] Forged webhook.
- [x] Replay/duplicate.
- [x] Cross-workspace connection.
- [x] Cross-outlet assignment/send.
- [x] Secret in response/log/AI.
- [x] Unauthorized reconnect/reauthorize/replay.
- [x] AI credential-management attempt.
- [x] Disabled-outlet order route.
- [x] SSRF/media abuse.
- [x] Outbound spam/rate limits.
- [x] Provider route-key enumeration.

# 32. Property and Concurrency Tests

Properties:

- [x] Duplicate provider event has one business effect.
- [x] Disabled outlet never accepts channel order.
- [x] AI_DISABLED never auto-replies.
- [x] Secrets never appear in user-visible payloads.
- [x] One idempotent outbound command produces one visible message.
- [x] Cross-workspace routing never succeeds.

Concurrency:

- [x] Duplicate webhook workers.
- [x] Two outbound sends.
- [x] Settings edit race.
- [x] Reconnect vs reauthorize.
- [x] Sync job race.
- [x] Handoff vs AI response.
- [x] Outlet disable vs Order creation.

# 33. Resilience Tests

- [x] Provider timeout.
- [x] Provider 5xx/rate limit.
- [x] Database failure.
- [x] Queue failure.
- [x] Processor crash.
- [x] CRM unavailable.
- [x] AI unavailable.
- [x] Order/Payment service unavailable.
- [x] Notification failure.
- [x] Dead-letter replay.
- [x] Webhook registration lost.
- [x] Secret rotation failure.

# 34. Performance and Scale

- [x] Multi-workspace fixtures.
- [x] 100+ outlets.
- [x] High webhook burst.
- [x] High outbound queue.
- [x] Large event/activity history.
- [x] Webhook intake benchmark.
- [x] Outbound throughput benchmark.
- [x] Channel settings/read-model benchmark.
- [x] Index/query-plan review.
- [x] Provider-rate-limit compliance.

# 35. Migration and Cutover

- [x] Audit legacy provider code.
- [x] Move credentials to secret references.
- [x] Create Supabase tables/RLS.
- [x] Create/recreate active connections.
- [x] Add outlet assignments.
- [x] Verify WhatsApp inbound/outbound.
- [x] Verify Telegram inbound/outbound.
- [x] Verify AI/human routing.
- [x] Verify payment/order delivery.
- [x] Disable Mongo authority.
- [x] Remove direct provider logic from business services.
- [x] Document rollback.

# 36. Alpha End-to-End Validation

Required flows:

```text
WhatsApp inbound
→ conversation
→ select outlet
→ product/order flow
→ Xendit link
→ payment/order status updates

Telegram inbound
→ same business flow
```

- [x] WhatsApp verified webhook.
- [x] Telegram verified/update intake.
- [x] Duplicate inbound.
- [x] Duplicate outbound event.
- [x] Outlet accepts chat but not order.
- [x] Disabled outlet rejected.
- [x] Workspace default AI.
- [x] Human handoff.
- [x] Payment link.
- [x] Order status.
- [x] Other outlet isolation.
- [x] Provider outage fallback.

# 37. Fastest Safe Alpha Slice

Implement first:

```text
0 preflight
1 registry/types/permissions
2 Supabase/RLS
3 secrets/config
4 adapter framework
5 WhatsApp
6 Telegram
7 lifecycle
8 webhook intake
9 processor/dedup
10 CRM integration
11 outbound dispatcher
12 status processing
13 outlet assignment
14 routing
15 AI
16 handoff
18 payment/order delivery
21 health/test
23 settings read model
24 webhook/activity read models
28 APIs
29 popup contracts
30 events/audit/metrics
31 security
32 concurrency/property
33 resilience
35 migration
36 E2E
```

May defer:

```text
OAuth reauthorization if not required
rich media
proactive templates
catalog sync
external-order sync
Instagram/Facebook
Website Chat
marketplace connectors
```

# 38. Final Validation

Commands:

```text
npm run specs:check
npm run test:channels:unit
npm run test:channels:component
npm run test:channels:integration
npm run test:channels:security
npm run test:channels:property
npm run test:channels:concurrency
npm run test:channels:resilience
npm run test:channels:performance
npm run test:channels:all
```

Release checklist:

- [x] Provider contracts verified.
- [x] Workspace/outlet isolation.
- [x] Secret safety.
- [x] Verified durable webhooks.
- [x] Message deduplication.
- [x] Outbound idempotency.
- [x] Outlet policy/routing.
- [x] AI/handoff.
- [x] Payment/order delivery.
- [x] Status separation.
- [x] Health/diagnostics.
- [x] Audit/metrics/runbooks.
- [x] Security/property/concurrency/resilience/performance.
- [x] Implementation status honest.
- [x] Specs check passes.

# Requirement Traceability

| Requirements | Task Sections |
|---|---|
| CCS-R1–R8 | 0–4, 7 |
| CCS-R9–R11 | 5, 6, 22 |
| CCS-R12–R16 | 8, 9 |
| CCS-R17–R23 | 10–12, 20 |
| CCS-R24–R30 | 13–17 |
| CCS-R31–R32 | 18, 19 |
| CCS-R33–R37 | 11, 21, 22, 33 |
| CCS-R38–R40 | 23, 24, 29 |
| CCS-R41–R44 | 25–27 |
| CCS-R45–R48 | 28, 29, 31 |
| CCS-R49–R51 | 30, 31 |
| CCS-R52–R57 | 32–38 |

# Definition of Done

```text
all P0 tasks complete
approved P1/P2 deferrals documented
provider contracts revalidated
credentials server-only
webhook verification/idempotency proven
inbound durability proven
outbound idempotency proven
outlet routing and AI/handoff proven
payment/order message delivery proven
status dimensions separated
all release-gate tests pass
implementation status reflects repository reality
specs check passes
```
