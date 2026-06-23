---
schema_version: 1
document_type: requirements
spec_id: selaluteh-channel-connections-sync
title: SelaluTeh Channel Connections & Sync Requirements
status: active
workflow_state: in_progress
version: 1.0.0
updated_at: 2026-06-23
---

# Requirements Document: SelaluTeh Channel Connections & Sync

## Introduction

Spec ini mendefinisikan koneksi channel, webhook, messaging transport, outlet channel policy, routing, health, dan sinkronisasi untuk SelaluTeh Marketplace.

```text
Connected Platforms
= koneksi provider pada level workspace

Manage Connected Channels di Outlet
= apakah outlet menerima chat/order dari koneksi itu
  serta routing, AI handling, human team, dan operational behavior
```

MVP aktif:

```text
WhatsApp
Telegram
```

Future-ready:

```text
Instagram
Facebook Messenger
Website Chat / Ordering
marketplace connectors
```

## Authority and Boundaries

| Area | Authority |
|---|---|
| Provider connection, secret reference, webhook, outbound transport, delivery state, sync | This spec |
| Contacts, conversations, messages | `selaluteh-crm-inbox-contacts` |
| Outlet lifecycle | `selaluteh-outlet-management-operations` |
| Access control | `selaluteh-workspace-access-control` |
| AI runtime/security | AI Agent specs |
| Products, orders, payments | Their dedicated domain specs |
| Immutable activity | `selaluteh-audit-activity-timeline` |

## Product Principles

```text
Workspace owns provider connections.
Outlet owns participation policy, not credentials.
WhatsApp and Telegram share normalized internal contracts.
Webhooks are verified, durable, idempotent, and observable.
Duplicate events never duplicate messages, orders, or payment links.
Connection, health, sync, and assignment status are separate.
Provider-specific behavior stays behind adapters.
AI prompt/configuration cannot expand channel permissions.
```

## Requirement Summary

| ID | Requirement | Priority |
|---|---|---|
| CCS-R1 | Spec Authority and Domain Boundary | P0 |
| CCS-R2 | Workspace-Level Connection Ownership | P0 |
| CCS-R3 | Provider Adapter Architecture | P0 |
| CCS-R4 | Supported Channel Registry | P0 |
| CCS-R5 | Connection Identity and Core Fields | P0 |
| CCS-R6 | Connection Lifecycle | P0 |
| CCS-R7 | Status Dimension Separation | P0 |
| CCS-R8 | Credential and Secret Management | P0 |
| CCS-R9 | WhatsApp Connection Contract | P0 |
| CCS-R10 | Telegram Connection Contract | P0 |
| CCS-R11 | OAuth, Token, and Reauthorization Readiness | P1 |
| CCS-R12 | Webhook Endpoint Registration and Ownership | P0 |
| CCS-R13 | Webhook Authentication and Verification | P0 |
| CCS-R14 | Durable Webhook Intake | P0 |
| CCS-R15 | Webhook Idempotency and Replay Protection | P0 |
| CCS-R16 | Provider Event Normalization | P0 |
| CCS-R17 | Inbound Message Processing | P0 |
| CCS-R18 | Outbound Message Processing | P0 |
| CCS-R19 | Message Delivery and Read-State Tracking | P1 |
| CCS-R20 | Message Deduplication | P0 |
| CCS-R21 | Message Ordering and Late Events | P0 |
| CCS-R22 | Media and Attachment Transport | P1 |
| CCS-R23 | Conversation and Contact Resolution | P0 |
| CCS-R24 | Outlet Channel Assignment | P0 |
| CCS-R25 | Accept Chats and Accept Orders Policy | P0 |
| CCS-R26 | Outlet Routing and Selection | P0 |
| CCS-R27 | AI Handling Policy | P0 |
| CCS-R28 | Human Handoff and Team Routing | P0 |
| CCS-R29 | Outside-Hours Behavior | P1 |
| CCS-R30 | Channel-Specific Customer Identity | P0 |
| CCS-R31 | Payment-Link and Order-Status Delivery | P0 |
| CCS-R32 | Message Templates and Proactive Messaging | P1 |
| CCS-R33 | Rate Limits and Provider Quotas | P0 |
| CCS-R34 | Retry, Backoff, and Dead-Letter Handling | P0 |
| CCS-R35 | Connection Health Monitoring | P0 |
| CCS-R36 | Test Connection and Diagnostics | P0 |
| CCS-R37 | Reconnect and Reauthorize Operations | P1 |
| CCS-R38 | Channel Settings Read and Write Model | P1 |
| CCS-R39 | Webhook Operations Read Model | P1 |
| CCS-R40 | Channel Activity Log Read Model | P1 |
| CCS-R41 | Product and Menu Sync Contract | P1 |
| CCS-R42 | External Order Sync Contract | P2 |
| CCS-R43 | Provider Mapping and Sync State | P1 |
| CCS-R44 | Bulk and Multi-Outlet Operations | P1 |
| CCS-R45 | Authorization and Outlet Scope | P0 |
| CCS-R46 | AI and Tool Security | P0 |
| CCS-R47 | API Contracts and Error Model | P0 |
| CCS-R48 | Admin UI and Popup State Support | P1 |
| CCS-R49 | Domain Events and Outbox | P0 |
| CCS-R50 | Audit, Observability, Metrics, and Alerts | P0 |
| CCS-R51 | Security and Privacy | P0 |
| CCS-R52 | Optimistic Concurrency and Idempotent Commands | P0 |
| CCS-R53 | Legacy Migration and Compatibility | P0 |
| CCS-R54 | Testing and Quality Assurance | P0 |
| CCS-R55 | Scalability and Performance | P1 |
| CCS-R56 | Operational Readiness and Recovery | P1 |
| CCS-R57 | Provider Contract Versioning | P0 |

---

# Detailed Requirements

## CCS-R1: Spec Authority and Domain Boundary

**Priority:** P0

### Acceptance Criteria

1. The system shall use this spec as authority for provider connections, webhooks, outbound transport, delivery state, and sync execution.
2. CRM remains authority for contacts, conversations, and business message records.
3. Outlet Management remains authority for outlet lifecycle; Order, Product, and Payment domains remain authoritative for their own business truth.
4. Provider-specific behavior shall remain behind adapters.
5. Missing external contracts shall be recorded as blockers rather than guessed.

## CCS-R2: Workspace-Level Connection Ownership

**Priority:** P0

### Acceptance Criteria

1. Every provider connection shall belong to exactly one workspace.
2. One workspace connection may serve multiple outlets.
3. Outlet records shall never store raw provider credentials.
4. Cross-workspace connection usage shall be denied.
5. Connection changes shall be audited and versioned.

## CCS-R3: Provider Adapter Architecture

**Priority:** P0

### Acceptance Criteria

1. Core services shall depend on provider-neutral interfaces.
2. Adapters shall normalize inbound provider payloads and translate outbound commands.
3. Unsupported capabilities shall be declared explicitly.
4. Provider errors shall map to stable internal errors.
5. Adapter contract versions shall be recorded and independently tested.

## CCS-R4: Supported Channel Registry

**Priority:** P0

### Acceptance Criteria

1. The registry shall classify channels as ACTIVE_MVP, SUPPORTED, EXPERIMENTAL, PLANNED, or DISABLED.
2. WhatsApp and Telegram shall be ACTIVE_MVP.
3. Instagram, Facebook Messenger, Website Chat, Website Ordering, Tokopedia, and Shopee shall remain PLANNED unless separately activated.
4. UI actions shall be capability-driven.
5. Sync Menu and Sync Orders shall only appear when supported.

## CCS-R5: Connection Identity and Core Fields

**Priority:** P0

### Acceptance Criteria

1. Connection shall store workspace, provider, channel type, account/sender identifiers, environment, status dimensions, capabilities, secret reference, and version.
2. Connection ID shall remain stable across safe reconnect or reauthorization.
3. Provider identifiers shall be unique according to provider scope.
4. Secrets shall not be returned by normal read APIs.
5. Historical messages shall retain connection references after disconnect.

## CCS-R6: Connection Lifecycle

**Priority:** P0

### Acceptance Criteria

1. Supported lifecycle states shall include DRAFT, PENDING_SETUP, CONNECTED, DEGRADED, DISCONNECTED, REAUTH_REQUIRED, SUSPENDED, and ARCHIVED.
2. Transitions shall be validated and idempotent.
3. CONNECTED shall not imply perfect runtime health.
4. ARCHIVED shall preserve historical references.
5. Lifecycle changes shall emit events and audit records.

## CCS-R7: Status Dimension Separation

**Priority:** P0

### Acceptance Criteria

1. The system shall maintain separate connection_status, health_status, sync_status, and outlet_assignment_status.
2. Health shall be derived from runtime signals.
3. Sync status shall apply only to sync-capable resources.
4. Outlet assignment shall be outlet-specific.
5. Unknown health shall never be displayed as healthy.

## CCS-R8: Credential and Secret Management

**Priority:** P0

### Acceptance Criteria

1. API keys, bot tokens, access tokens, app secrets, verification tokens, and signing secrets shall be server-side only.
2. Business tables shall store secret references rather than raw secrets.
3. Secrets shall never appear in logs, frontend responses, AI prompts, exports, or audit payloads.
4. Rotation and revocation shall be supported.
5. Production credentials shall not be used in local development or CI.

## CCS-R9: WhatsApp Connection Contract

**Priority:** P0

### Acceptance Criteria

1. The adapter shall support inbound text, outbound text/link delivery, provider message IDs, and status events when available.
2. Media support shall be capability-driven.
3. Webhook verification and event normalization shall be implemented.
4. Template/proactive messaging shall be separated from ordinary conversational messaging.
5. The exact provider/API contract used shall be recorded.

## CCS-R10: Telegram Connection Contract

**Priority:** P0

### Acceptance Criteria

1. The adapter shall support inbound updates, outbound text/links, and supported media.
2. Update IDs shall support deduplication and ordering logic.
3. Webhook mode shall be supported.
4. Polling shall not run simultaneously with production webhook mode unless explicitly configured.
5. Bot tokens shall remain secret and the exact Bot API contract shall be recorded.

## CCS-R11: OAuth, Token, and Reauthorization Readiness

**Priority:** P1

### Acceptance Criteria

1. Connections shall declare auth type such as STATIC_TOKEN, API_KEY, OAUTH2, SIGNED_WEBHOOK, or CUSTOM.
2. Expiring OAuth tokens shall be monitored and refreshed securely.
3. Reauthorization shall preserve connection identity where possible.
4. Revoked scopes shall produce REAUTH_REQUIRED or DEGRADED.
5. Outlet users shall not reauthorize workspace credentials by default.

## CCS-R12: Webhook Endpoint Registration and Ownership

**Priority:** P0

### Acceptance Criteria

1. Every provider connection shall have an unambiguous webhook route or connection key.
2. Webhook ownership shall resolve to the correct workspace connection.
3. Route identifiers shall not expose secrets.
4. Registration state and last verified event shall be observable.
5. Disconnect/archive shall disable or deregister webhooks when supported.

## CCS-R13: Webhook Authentication and Verification

**Priority:** P0

### Acceptance Criteria

1. Provider webhooks shall be authenticated according to the provider contract before business mutation.
2. Secrets shall come from server secret storage.
3. Invalid or missing verification shall produce no message, order, or payment effect.
4. Verification shall be adapter/version-specific and tested.
5. IP allowlisting may be additive but not the only control.

## CCS-R14: Durable Webhook Intake

**Priority:** P0

### Acceptance Criteria

1. Verified events shall be durably stored or enqueued before acknowledgement where feasible.
2. Webhook endpoints shall respond within provider timing requirements.
3. Business processing shall be asynchronous or tightly bounded.
4. Payload size and rate limits shall be enforced.
5. Stored raw payload shall be sanitized and retention-bounded.

## CCS-R15: Webhook Idempotency and Replay Protection

**Priority:** P0

### Acceptance Criteria

1. Every provider event shall have a deterministic deduplication key.
2. Native event, update, or message IDs shall be used when available.
3. Duplicate events shall not duplicate messages, AI responses, orders, payment links, or notifications.
4. Failed processing shall remain retryable.
5. Manual replay shall require permission and audit.

## CCS-R16: Provider Event Normalization

**Priority:** P0

### Acceptance Criteria

1. Provider payloads shall normalize into stable internal event types.
2. Unknown events shall be retained and ignored or reviewed safely.
3. Provider timestamps and received timestamps shall remain separate.
4. Normalized event schemas shall be versioned.
5. Normalization shall not directly invoke AI.

## CCS-R17: Inbound Message Processing

**Priority:** P0

### Acceptance Criteria

1. Verified inbound messages shall resolve connection, workspace, channel identity, contact, conversation, and message.
2. Inbound messages shall be persisted before AI or human handling where feasible.
3. Duplicate inbound events shall not duplicate CRM records.
4. Unsupported content shall be represented safely.
5. Processing failure shall not lose the inbound message.

## CCS-R18: Outbound Message Processing

**Priority:** P0

### Acceptance Criteria

1. Outbound messages shall originate from an authorized human, AI tool, business event, or approved automation.
2. Outbound commands shall be persisted and idempotent.
3. Provider message ID and result shall be stored.
4. Retry shall not duplicate visible messages.
5. Human takeover and channel capabilities shall be respected.

## CCS-R19: Message Delivery and Read-State Tracking

**Priority:** P1

### Acceptance Criteria

1. Normalized states shall include QUEUED, SENDING, SENT, DELIVERED, READ, FAILED, CANCELLED, and UNKNOWN.
2. Provider status events shall map safely.
3. Status shall not move backward except through documented reconciliation rules.
4. Delivery/read support shall be capability-driven.
5. Failure reasons shall be sanitized.

## CCS-R20: Message Deduplication

**Priority:** P0

### Acceptance Criteria

1. Provider message/update IDs shall be unique within connection scope.
2. Duplicate inbound webhook shall not duplicate message.
3. Duplicate outbound idempotency key shall return the existing result when payload matches.
4. Same key with different payload shall fail.
5. Deduplication shall survive restarts and prevent cross-workspace collisions.

## CCS-R21: Message Ordering and Late Events

**Priority:** P0

### Acceptance Criteria

1. Provider event order shall not be assumed.
2. Conversation chronology shall use provider and received timestamps.
3. Late status events shall update only their matching message.
4. Late inbound messages shall not repeat irreversible business effects.
5. Out-of-order events shall not incorrectly revert final message states.

## CCS-R22: Media and Attachment Transport

**Priority:** P1

### Acceptance Criteria

1. Adapters may support image, document, audio, video, and location when available.
2. Binary storage remains owned by Media/Storage.
3. Downloads shall be size, type, timeout, and security constrained.
4. Expired provider media URLs shall be handled safely.
5. AI shall not receive unsafe raw binary data.

## CCS-R23: Conversation and Contact Resolution

**Priority:** P0

### Acceptance Criteria

1. Channel identity shall resolve to a CRM contact.
2. One contact may have multiple channel identities.
3. Provider identity shall never attach across workspaces automatically.
4. Conversation reuse or creation shall follow CRM rules.
5. Retries shall not create duplicate contacts or conversations.

## CCS-R24: Outlet Channel Assignment

**Priority:** P0

### Acceptance Criteria

1. Outlet-channel assignment shall reference a workspace connection and outlet in the same workspace.
2. Assignment states shall include ENABLED, DISABLED, and PENDING_CONFIGURATION.
3. One connection may be enabled for many outlets.
4. Assignment shall store chat/order policy, routing, AI handling, human team, and version.
5. Assignment changes shall invalidate routing cache and be audited.

## CCS-R25: Accept Chats and Accept Orders Policy

**Priority:** P0

### Acceptance Criteria

1. accepts_chats and accepts_orders shall be separate settings.
2. An outlet may accept support chats while refusing orders.
3. Order tools shall verify both channel policy and outlet operational order acceptance.
4. Disabled assignment shall override both settings.
5. The server shall return a customer-safe reason when ordering is unavailable.

## CCS-R26: Outlet Routing and Selection

**Priority:** P0

### Acceptance Criteria

1. Routing modes may include CUSTOMER_SELECTS_OUTLET, PRESELECTED_OUTLET, NEAREST_OUTLET_SUGGESTION, FIXED_OUTLET, and MANUAL_ROUTING.
2. MVP default shall be CUSTOMER_SELECTS_OUTLET.
3. AI shall not finalize an outlet without customer confirmation.
4. Only enabled, order-capable outlets shall be selectable.
5. Routing results shall persist into conversation and order context.

## CCS-R27: AI Handling Policy

**Priority:** P0

### Acceptance Criteria

1. Policies shall include USE_WORKSPACE_DEFAULT, USE_OUTLET_OVERRIDE, USE_CHANNEL_OVERRIDE, and AI_DISABLED.
2. One workspace default agent may serve all outlets.
3. Outlet and channel overrides shall be optional.
4. Resolution order shall be channel override, then outlet override, then workspace default.
5. AI policy shall never grant provider credentials or bypass Tool Gateway.

## CCS-R28: Human Handoff and Team Routing

**Priority:** P0

### Acceptance Criteria

1. Outlet-channel policy may define a default human team.
2. Handoff shall use CRM state and permissions.
3. Human replies shall use the same authorized connection.
4. AI shall stop or defer according to takeover state.
5. Unavailable teams shall use a configured fallback queue.

## CCS-R29: Outside-Hours Behavior

**Priority:** P1

### Acceptance Criteria

1. Policy may continue AI support, block orders, send auto-reply, suggest another outlet, or queue for humans.
2. Outlet timezone and hours shall come from Outlet Management.
3. Special hours shall be respected.
4. Duplicate auto-replies shall be prevented.
5. Outside-hours behavior shall not override payment or order truth.

## CCS-R30: Channel-Specific Customer Identity

**Priority:** P0

### Acceptance Criteria

1. Provider user, chat, or phone identifiers shall be normalized and protected.
2. Display names shall not be treated as unique identities.
3. Provider identity uniqueness shall follow connection/workspace semantics.
4. Cross-workspace identity merging shall not occur automatically.
5. Privacy deletion or merge shall follow CRM policy.

## CCS-R31: Payment-Link and Order-Status Delivery

**Priority:** P0

### Acceptance Criteria

1. Channels shall deliver Xendit links created by Payments domain.
2. Channel domain shall not create or modify payment amount or status.
3. Order-status notifications shall consume Order events.
4. Duplicate events shall not duplicate customer messages.
5. Delivery failure shall not change Order or Payment truth.

## CCS-R32: Message Templates and Proactive Messaging

**Priority:** P1

### Acceptance Criteria

1. Providers requiring templates shall use approved templates.
2. Template version/status and variable mapping shall be stored safely.
3. AI shall not create arbitrary provider templates at runtime.
4. Conversation-window and proactive messaging rules shall remain adapter-owned.
5. Customer opt-out rules shall be respected.

## CCS-R33: Rate Limits and Provider Quotas

**Priority:** P0

### Acceptance Criteria

1. Adapters shall model provider rate and throughput limits.
2. Outbound dispatch shall use bounded concurrency.
3. Retry-After guidance shall be respected.
4. Per-workspace and per-connection rate limits shall exist.
5. Rate limits shall not silently drop messages.

## CCS-R34: Retry, Backoff, and Dead-Letter Handling

**Priority:** P0

### Acceptance Criteria

1. Only retryable errors shall be retried with bounded exponential backoff and jitter.
2. Ambiguous send failures shall reconcile before resend when possible.
3. Exhausted failures shall enter a dead-letter or review queue.
4. Dead-letter replay shall require permission and audit.
5. Recovery shall avoid duplicate visible messages.

## CCS-R35: Connection Health Monitoring

**Priority:** P0

### Acceptance Criteria

1. Health states shall include UNKNOWN, HEALTHY, DEGRADED, UNHEALTHY, and OFFLINE.
2. Health shall derive from credential validity, webhook recency, provider API results, send failures, rate limits, and backlog.
3. Health shall remain separate from connection lifecycle.
4. UI shall show reason and last checked time.
5. Degradation shall trigger attention or alerts.

## CCS-R36: Test Connection and Diagnostics

**Priority:** P0

### Acceptance Criteria

1. Authorized users may run a safe test connection.
2. The test shall validate local configuration and provider reachability when supported.
3. It shall not send a customer-visible message unless explicitly requested.
4. Results shall show safe checks, latency, timestamp, and error category.
5. Secrets shall never be shown.

## CCS-R37: Reconnect and Reauthorize Operations

**Priority:** P1

### Acceptance Criteria

1. Reconnect shall restore transport/webhook configuration without duplicating the connection.
2. Reauthorize shall renew provider permission or tokens where required.
3. Outlet-level UI shall not own workspace credential reauthorization.
4. Concurrent operations shall be guarded.
5. Actions and outcomes shall be audited.

## CCS-R38: Channel Settings Read and Write Model

**Priority:** P1

### Acceptance Criteria

1. Settings shall support outlet enablement, accepts chats/orders, routing, AI handling, team routing, outside-hours behavior, and notification toggles.
2. Inherited and overridden values shall be distinguishable.
3. Unsupported settings shall not appear.
4. Writes shall use authorization and versioning.
5. Changes shall invalidate routing/configuration caches.

## CCS-R39: Webhook Operations Read Model

**Priority:** P1

### Acceptance Criteria

1. The Webhooks tab shall expose endpoint state, verification, recent events, processing status, retries, latency, and sanitized errors.
2. Raw secrets and verification headers shall never appear.
3. Raw payload access shall be privileged and redacted.
4. Filters and stable pagination shall be supported.
5. Replay shall require permission.

## CCS-R40: Channel Activity Log Read Model

**Priority:** P1

### Acceptance Criteria

1. Activity shall include connection, webhook, assignment, routing, test, authorization, sync, and health changes.
2. Actor, connection, outlet, timestamp, result, and safe metadata shall be available.
3. Provider, system, human, and AI actors shall be distinguishable.
4. Secrets shall be redacted.
5. Audit domain remains the immutable storage authority.

## CCS-R41: Product and Menu Sync Contract

**Priority:** P1

### Acceptance Criteria

1. Canonical product data shall come from Product Catalog.
2. Only catalog-sync-capable providers shall expose Sync Menu.
3. Sync shall be idempotent, version-aware, and outlet-aware.
4. Failed sync shall not alter canonical catalog data.
5. WhatsApp or Telegram chat flows may read the backend catalog directly without external catalog sync.

## CCS-R42: External Order Sync Contract

**Priority:** P2

### Acceptance Criteria

1. Only external-order-capable providers shall expose Sync Orders.
2. External orders shall normalize into commands for Order domain.
3. Duplicate external orders shall not create duplicate internal orders.
4. Unknown product or outlet mappings shall enter review.
5. Chat-created WhatsApp/Telegram orders shall not use external-order sync.

## CCS-R43: Provider Mapping and Sync State

**Priority:** P1

### Acceptance Criteria

1. Provider mappings shall belong to workspace and connection.
2. Internal entities remain canonical.
3. External IDs shall be unique in provider scope.
4. Mapping status shall support ACTIVE, STALE, FAILED, and ARCHIVED.
5. Mapping deletion shall not delete internal entities.

## CCS-R44: Bulk and Multi-Outlet Operations

**Priority:** P1

### Acceptance Criteria

1. Authorized admins may enable or disable one connection across many outlets.
2. Every target outlet shall be validated.
3. Partial failure shall return per-outlet results.
4. Large operations may use Admin Data Operations.
5. Credentials shall remain workspace-level and never be duplicated per outlet.

## CCS-R45: Authorization and Outlet Scope

**Priority:** P0

### Acceptance Criteria

1. Connection management shall require workspace-level permission.
2. Outlet assignment and settings shall require outlet scope.
3. Outlet staff shall never access provider secrets.
4. Webhook processing shall use a service identity.
5. List, count, export, diagnostics, replay, and sync shall all enforce scope.

## CCS-R46: AI and Tool Security

**Priority:** P0

### Acceptance Criteria

1. AI shall not connect, disconnect, reauthorize, or reveal providers.
2. AI shall not read raw webhook payloads or secrets.
3. AI outbound messages shall use Tool Gateway and resolved context.
4. AI shall respect outlet enablement, provider templates, human takeover, and rate limits.
5. Prompt instructions shall not expand channel permissions.

## CCS-R47: API Contracts and Error Model

**Priority:** P0

### Acceptance Criteria

1. APIs shall use strict schemas, authorization, stable errors, and idempotency where relevant.
2. Connection, outlet settings, diagnostics, webhooks, replay, activity, and sync endpoints shall be defined.
3. Errors shall not leak secrets or cross-workspace existence.
4. Provider errors shall map to safe internal codes.
5. Unsupported capabilities shall return an explicit capability error.

## CCS-R48: Admin UI and Popup State Support

**Priority:** P1

### Acceptance Criteria

1. Backend shall support Connected Platforms and the four-tab outlet popup: Connected Channels, Channel Settings, Webhooks, and Activity.
2. Outlet-level Disconnect shall mean Disable for Outlet.
3. Workspace credential disconnect shall remain on Connected Platforms.
4. Connection, health, sync, and assignment states shall be visually distinct.
5. Loading, empty, no-results, permission, conflict, outage, and partial-failure states shall be supported.

## CCS-R49: Domain Events and Outbox

**Priority:** P0

### Acceptance Criteria

1. Connection, webhook, message, assignment, settings, health, and sync changes shall emit versioned events.
2. Critical consumers shall use reliable outbox delivery.
3. Consumers shall be idempotent.
4. Events shall include safe workspace, connection, outlet, provider, actor, correlation, and timestamp.
5. Secrets and raw sensitive payloads shall not appear.

## CCS-R50: Audit, Observability, Metrics, and Alerts

**Priority:** P0

### Acceptance Criteria

1. Metrics shall cover webhook, inbound, outbound, delivery, provider latency, rate limits, dead letters, health, and sync failures.
2. Metrics shall avoid PII and high-cardinality labels.
3. Logs shall use safe IDs and redaction.
4. Alerts shall cover verification failures, provider outage, backlog, send failure spikes, reauthorization, and dead letters.
5. Runbooks shall be linked to operational alerts.

## CCS-R51: Security and Privacy

**Priority:** P0

### Acceptance Criteria

1. Credentials shall remain server-only and webhooks shall be verified before mutation.
2. Workspace and outlet authorization shall be enforced.
3. PII and raw provider payload retention shall be minimized.
4. Media download, SSRF, open redirect, and provider URL risks shall be mitigated.
5. Production activation shall require security review.

## CCS-R52: Optimistic Concurrency and Idempotent Commands

**Priority:** P0

### Acceptance Criteria

1. Connection, outlet assignment, settings, mapping, and sync mutations shall use version checks.
2. Connect, reconnect, reauthorize, disconnect, send, test, replay, and sync commands shall be idempotent where possible.
3. Concurrent edits shall not silently overwrite.
4. Duplicate sends shall not produce duplicate visible messages.
5. Concurrency tests shall cover settings, webhooks, sends, reconnects, and sync jobs.

## CCS-R53: Legacy Migration and Compatibility

**Priority:** P0

### Acceptance Criteria

1. Existing Telegram, Meta, WhatsApp, Instagram, and webhook code shall be audited.
2. Legacy credentials shall move to secret references.
3. Provider logic shall migrate behind adapters.
4. Supabase shall become the active source after cutover; legacy Mongo shall not remain authoritative.
5. Legacy implicit outlet routing shall become explicit outlet-channel assignments.

## CCS-R54: Testing and Quality Assurance

**Priority:** P0

### Acceptance Criteria

1. Implementation shall follow TDD.
2. Unit, component, integration, security, property, concurrency, resilience, and performance tests shall be present.
3. Tests shall cover adapters, webhooks, dispatch, routing, health, sync, CRM, Orders, Payments, and Tool Gateway.
4. Production credentials and data shall not be used.
5. Skipped critical tests shall block release.

## CCS-R55: Scalability and Performance

**Priority:** P1

### Acceptance Criteria

1. Provider IDs, event IDs, message IDs, connection IDs, and outlet assignments shall be indexed.
2. Webhook intake and outbound queues shall support bursts.
3. Conversation ordering shall avoid global serialization.
4. Lists shall paginate and sync shall use bounded batches.
5. Architecture shall support many workspaces and outlets without schema rewrite.

## CCS-R56: Operational Readiness and Recovery

**Priority:** P1

### Acceptance Criteria

1. Connection, assignment, mapping, webhook inbox, and delivery data shall be backed up.
2. Runbooks shall cover credential expiry, webhook failures, provider outage, send failures, dead letters, lost webhook registration, reauthorization, and sync failures.
3. Webhook replay and recovery actions shall be authorized and audited.
4. Disaster recovery shall avoid duplicate messages and orders.
5. Operational ownership shall be assigned.

## CCS-R57: Provider Contract Versioning

**Priority:** P0

### Acceptance Criteria

1. Each adapter shall record provider API and webhook contract versions.
2. Request, response, and event schemas shall be versioned and contract-tested.
3. Missing required fields shall fail safely; unknown additional fields may be tolerated.
4. Official provider documentation shall be revalidated before implementation and production release.
5. Provider version changes shall not silently alter internal semantics.


---
# Alpha Slice

Minimum alpha:

```text
workspace-level WhatsApp connection
workspace-level Telegram connection
secure secret references
provider adapters
verified webhook intake
inbound/outbound text and links
message deduplication
contact/conversation resolution
outlet channel assignment
accept chats / accept orders
customer-selected outlet
workspace default AI agent
human handoff
payment-link delivery
order-status delivery
health/test connection
Webhooks and Activity read models
critical security/concurrency/resilience tests
```

May follow after alpha:

```text
Instagram/Facebook
Website Chat
catalog sync
external-order sync
OAuth reauthorization
rich media
proactive templates
advanced bulk operations
marketplace connectors
```

# Definition of Done

1. Workspace and outlet isolation pass.
2. Credentials never reach frontend, AI, logs, or exports.
3. WhatsApp and Telegram adapters normalize events.
4. Webhook verification and durable intake pass.
5. Duplicate provider events have one business effect.
6. Inbound messages are never lost.
7. Outbound retries do not duplicate visible messages.
8. Outlet assignment controls chat/order eligibility.
9. AI and human routing policies are enforced.
10. Payment/order delivery is idempotent.
11. Status dimensions remain separate.
12. Audit, events, metrics, alerts, and runbooks exist.
13. Provider contract tests pass.
14. Security, property, concurrency, resilience, and performance tests pass.
15. `npm run specs:check` passes.

# Final Requirement Statement

```text
Workspace connection
→ verified provider event
→ normalized channel event
→ CRM contact/conversation/message
→ outlet routing
→ AI or human handling
→ authorized outbound response
→ delivery status and operations visibility
```

The system shall never duplicate credentials per outlet, trust unverified webhooks, expose secrets, route orders to disabled outlets, or allow prompts to expand channel permissions.
