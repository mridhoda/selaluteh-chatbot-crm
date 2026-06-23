---
schema_version: 1
document_type: implementation-plan
spec_id: selaluteh-workspace-access-control
title: SelaluTeh Workspace Access Control Tasks
status: active
workflow_state: in_progress
version: 1.0.0
updated_at: 2026-06-22
development_method: test-driven-development
---

# Implementation Plan: SelaluTeh Workspace Access Control

## Overview

Implementasi ini mencakup target penuh Workspace Access Control, bukan hanya alpha MVP.

Metode wajib:

```text
RED
→ GREEN
→ REFACTOR
→ VERIFY
```

Coding agent SHALL membaca:

```text
spec.yaml
requirements.md
design.md
tasks.md
```

External contracts:

```text
selaluteh-backend-marketplace
selaluteh-outlet-management-operations
selaluteh-cart-order-lifecycle
selaluteh-crm-inbox-contacts
selaluteh-channel-connections-sync
selaluteh-ai-agent-architecture
selaluteh-ai-agent-scope-security
selaluteh-audit-activity-timeline
```

---

# Global Completion Rules

A task is complete only when:

- [x] failing test written first;
- [x] failure observed;
- [x] minimal implementation passes;
- [x] refactor complete;
- [x] workspace isolation verified;
- [x] outlet isolation verified where applicable;
- [x] owner invariant preserved;
- [x] no privilege escalation;
- [x] audit and cache behavior verified;
- [x] docs and implementation status updated;
- [x] specs check passes.

---

# 0. Spec Preflight and Repository Audit

## 0.1 Confirm spec authority

- [x] Confirm spec ID `selaluteh-workspace-access-control`.
- [x] Confirm prefix `WAC-R`.
- [x] Confirm authentication remains external.
- [x] Confirm Outlet Management owns operational outlet data.
- [x] Confirm Order Lifecycle owns order status.
- [x] Confirm no duplicate policy engine exists.
- [x] Run `npm run specs:check`.

## 0.2 Audit legacy authorization

Identify:

```text
auth middleware
JWT/session context
implicit admin checks
workspace models
user models
outlet-user links
route-level role checks
service-level authorization
Supabase client usage
RLS policies
legacy Mongo/Mongoose access rules
```

- [x] Record current files.
- [x] Mark mismatches.
- [x] Identify unprotected routes.
- [x] Identify role strings embedded in controllers.
- [x] Identify queries missing workspace scope.
- [x] Identify frontend-only permission enforcement.

## 0.3 Build deterministic access-control test harness

- [x] User fixture builder.
- [x] Workspace fixture builder.
- [x] Membership fixture builder.
- [x] Role/permission fixture builder.
- [x] Outlet fixture builder.
- [x] Service identity fixture.
- [x] Fixed clock.
- [x] Idempotency helper.
- [x] Audit spy.
- [x] Cache spy.
- [x] Session revoke spy.
- [x] RLS test helper.

## 0.4 Add test scripts

```text
test:access:unit
test:access:component
test:access:integration
test:access:security
test:access:property
test:access:concurrency
test:access:resilience
test:access:performance
test:access:all
```

- [x] Add scripts without breaking existing tests.
- [x] Production secrets/data prohibited.
- [x] Non-zero exit on failure.

## 0.5 Define release blockers

Block release if:

```text
cross-workspace read/write succeeds
cross-outlet read/write succeeds
owner can be removed
suspended member retains access
unknown permission allows
AI can change membership/role
invitation token replay succeeds
service role leaks
frontend is sole enforcement
unscoped repository query exists
```

---

# 1. Permission Registry

## 1.1 Define permission key convention

- [x] Choose canonical `<domain>.<resource>.<action>` convention.
- [x] Add registry schema.
- [x] Add descriptions and risk level.
- [x] Add delegable flag.
- [x] Add version.

## 1.2 Seed baseline permissions

Domains:

```text
workspace
members
roles
teams
outlets
products
inventory
orders
payments
chats
contacts
complaints
agents
knowledge
channels
analytics
audit
exports
```

- [x] Add permission constants.
- [x] Add DB seed/migration.
- [x] Add documentation generation if used.
- [x] Add unknown-key rejection tests.

## 1.3 Permission registry tests

- [x] Unique keys.
- [x] Stable serialization.
- [x] Unknown permission denied.
- [x] Deprecated alias behavior.
- [x] Reserved permission not delegable.
- [x] UI metadata contains no authority logic.

---

# 2. System Roles

## 2.1 Define role model

- [x] SYSTEM and CUSTOM types.
- [x] ACTIVE and ARCHIVED statuses.
- [x] Version.
- [x] Workspace-null system role.
- [x] Workspace-owned custom role.

## 2.2 Seed system roles

- [x] OWNER.
- [x] ADMIN.
- [x] OUTLET_MANAGER.
- [x] OUTLET_STAFF.
- [x] CUSTOMER_SUPPORT.
- [x] FINANCE_VIEWER.
- [x] ANALYST.

## 2.3 Add role-permission mappings

- [x] Owner broad access.
- [x] Admin without owner-transfer through generic grant.
- [x] Outlet manager operational scope.
- [x] Outlet staff narrow scope.
- [x] Support no payment mutation.
- [x] Finance read-only.
- [x] Analyst read-only.

## 2.4 System role tests

- [x] Stable identifiers.
- [x] Cannot delete/edit destructively.
- [x] Reserved permissions excluded.
- [x] Role mapping snapshots.
- [x] Version migration tests.

---

# 3. Workspace Foundation

## 3.1 Add workspace schema/migration

Fields:

```text
id
name
slug
legal_name
status
timezone
locale
owner_membership_id
plan_id
version
timestamps
```

- [x] Constraints.
- [x] Slug uniqueness.
- [x] IANA timezone validation.
- [x] Status checks.
- [x] Archive fields.

## 3.2 Implement workspace repository

- [x] Create.
- [x] Read by authorized identity.
- [x] Update with version.
- [x] Suspend.
- [x] Archive.
- [x] Restore.
- [x] List user memberships/workspaces.

## 3.3 Workspace lifecycle tests

- [x] ACTIVE.
- [x] SUSPENDED.
- [x] ARCHIVED.
- [x] Mutation rejection on archived.
- [x] Historical read policy.
- [x] Version conflict.

---

# 4. Membership Foundation

## 4.1 Add membership schema/migration

- [x] Unique workspace/user constraint.
- [x] Status.
- [x] Primary role.
- [x] Outlet scope mode.
- [x] Version/timestamps.
- [x] Owner reference support.

## 4.2 Implement membership repository

- [x] Get by workspace/user.
- [x] List paginated.
- [x] Create invited.
- [x] Activate.
- [x] Suspend.
- [x] Restore.
- [x] Remove.
- [x] Safe lookup without leakage.

## 4.3 Implement membership status machine

- [x] INVITED → ACTIVE.
- [x] INVITED → EXPIRED.
- [x] ACTIVE → SUSPENDED.
- [x] SUSPENDED → ACTIVE.
- [x] ACTIVE/SUSPENDED → REMOVED.
- [x] Invalid transitions rejected.

## 4.4 Membership tests

- [x] Duplicate active membership.
- [x] Cross-workspace.
- [x] Removed access denied.
- [x] Suspended access denied.
- [x] Multi-workspace user unaffected by one removal.
- [x] Idempotent transitions.

---

# 5. Outlet Access Scope

## 5.1 Add `membership_outlets`

- [x] Workspace consistency constraints.
- [x] Membership/outlet unique assignment.
- [x] Indexes.
- [x] Actor/timestamp metadata.

## 5.2 Implement scope modes

- [x] ALL_OUTLETS.
- [x] SELECTED_OUTLETS.
- [x] NO_OUTLET_ACCESS.
- [x] Owner forced ALL_OUTLETS.

## 5.3 Implement assignment service

- [x] Assign one.
- [x] Remove one.
- [x] Replace selected set atomically.
- [x] Bulk assign.
- [x] List outlets per member.
- [x] List members per outlet.
- [x] Audit/cache invalidation.

## 5.4 Outlet scope tests

- [x] Assigned outlet allowed.
- [x] Unassigned denied.
- [x] ALL_OUTLETS allows new outlet.
- [x] NO_OUTLET_ACCESS denies.
- [x] Cross-workspace assignment rejected.
- [x] Archived outlet handling.
- [x] Duplicate assignment idempotent.

---

# 6. Policy Engine

## 6.1 Define authorization contracts

- [x] AuthorizationRequest.
- [x] AuthorizationDecision.
- [x] Reason codes.
- [x] Policy version.
- [x] Decision ID.

## 6.2 Implement effective permission resolver

- [x] Membership ACTIVE.
- [x] Role permissions.
- [x] Multiple role union-ready design.
- [x] Reserved denies.
- [x] Unknown permission denied.
- [x] Workspace status.

## 6.3 Implement outlet scope evaluator

- [x] Workspace-only action.
- [x] Outlet-owned action.
- [x] Resource-derived outlet.
- [x] New-resource target outlet.
- [x] No request-claim trust.

## 6.4 Implement owner guard

- [x] Owner always active.
- [x] Owner always all outlets.
- [x] Generic role update cannot remove owner.
- [x] Last owner cannot suspend/remove.
- [x] Broken invariant detected.

## 6.5 Policy unit/property tests

- [x] Same input deterministic.
- [x] Default deny.
- [x] Unknown action deny.
- [x] Effective grants subset of platform maximum.
- [x] Suspended always deny.
- [x] Owner invariant.
- [x] Outlet result subset of assigned outlets.

---

# 7. Middleware and Service Authorization

## 7.1 Implement identity adapter

- [x] Consume existing JWT/session auth.
- [x] Resolve human identity.
- [x] Do not reimplement login.
- [x] Stable unauthenticated errors.

## 7.2 Implement workspace context resolver

- [x] Verify active membership.
- [x] Support user with multiple workspaces.
- [x] Reject stale workspace selection.
- [x] Do not trust arbitrary workspace header.

## 7.3 Implement `requirePermission`

- [x] Route declaration.
- [x] Workspace action.
- [x] Outlet action.
- [x] Safe errors.
- [x] Correlation trace.

## 7.4 Implement service assertion API

- [x] Internal domain calls.
- [x] Jobs.
- [x] Tools.
- [x] Same policy engine as HTTP.

## 7.5 Architecture/static checks

- [x] Protected route without permission declaration detected.
- [x] Unscoped repository method detected or reviewed.
- [x] Frontend-only role checks not accepted.
- [x] Role string checks outside policy layer flagged.

---

# 8. Repository and Query Scoping

## 8.1 Introduce workspace-scoped repository interfaces

- [x] Require context parameter.
- [x] Remove/limit unscoped methods.
- [x] Add outlet scope helper.
- [x] Add count/aggregate scope.

## 8.2 Audit domain repositories

Check:

```text
outlets
products
inventory
orders
payments
contacts
chats
complaints
agents
knowledge
analytics
```

- [x] Add workspace predicate.
- [x] Add outlet predicate where required.
- [x] Add cross-workspace tests.

## 8.3 Search/list leakage tests

- [x] Names.
- [x] Counts.
- [x] Autocomplete.
- [x] Exports.
- [x] Bulk target IDs.
- [x] Related-resource includes.

---

# 9. Supabase and RLS

## 9.1 Add Supabase migrations

- [x] Workspaces.
- [x] Memberships.
- [x] Roles.
- [x] Permissions.
- [x] Role permissions.
- [x] Membership outlets.
- [x] Invitations.
- [x] Teams/access requests when implemented.

## 9.2 Define RLS strategy

- [x] Document custom auth + service role behavior.
- [x] Define backend DB role/session context.
- [x] Define future client access policy.
- [x] No false claim of RLS coverage.

## 9.3 Implement RLS policies

- [x] Workspace isolation.
- [x] Membership read restrictions.
- [x] Role restrictions.
- [x] Outlet assignment isolation.
- [x] Invitation isolation.
- [x] Service process policy.

## 9.4 RLS security tests

- [x] Cross-workspace SELECT.
- [x] Cross-workspace INSERT.
- [x] Cross-workspace UPDATE.
- [x] Cross-workspace DELETE.
- [x] Service role not exposed.
- [x] Missing context denied where applicable.

---

# 10. Invitations

## 10.1 Add invitation schema/repository

- [x] Token hash.
- [x] Expiry.
- [x] Status.
- [x] Intended role/outlet scope.
- [x] Delivery metadata.
- [x] Version.

## 10.2 Implement invite command

- [x] Permission/delegability check.
- [x] Duplicate pending policy.
- [x] Secure token.
- [x] Delivery adapter.
- [x] Audit.
- [x] Rate limit.

## 10.3 Implement acceptance

- [x] Token verification.
- [x] Identity match.
- [x] Expiry/revocation/use checks.
- [x] Atomic membership activation.
- [x] Role/outlet assignment.
- [x] Idempotency.

## 10.4 Implement revoke/resend

- [x] Old token invalidation.
- [x] New token.
- [x] Rate limit.
- [x] Audit.
- [x] UI status.

## 10.5 Invitation security tests

- [x] Replay.
- [x] Expired.
- [x] Revoked.
- [x] Wrong identity.
- [x] Cross-workspace.
- [x] Brute force/rate limit.
- [x] Token absent from logs.

---

# 11. Member Administration

## 11.1 Member list/detail APIs

- [x] Search.
- [x] Status filter.
- [x] Role filter.
- [x] Outlet filter.
- [x] Pagination.
- [x] Effective access summary.

## 11.2 Update role

- [x] Delegability.
- [x] Reserved role.
- [x] Owner guard.
- [x] Version.
- [x] Cache invalidation.
- [x] Audit.

## 11.3 Update outlet access

- [x] Scope mode.
- [x] Selected outlets.
- [x] Workspace validation.
- [x] Version.
- [x] Cache invalidation.
- [x] Audit.

## 11.4 Suspend/restore/remove

- [x] Owner guard.
- [x] Session revoke.
- [x] Resource reassignment event.
- [x] Idempotency.
- [x] Audit.

## 11.5 Self-leave

- [x] Non-owner.
- [x] Confirmation.
- [x] Immediate access revoke.
- [x] Multi-workspace unaffected.

---

# 12. Owner Transfer

## 12.1 Implement transfer command

- [x] Current owner authorization.
- [x] Target ACTIVE same workspace.
- [x] Step-up auth hook.
- [x] Expected version.
- [x] Atomic role/reference update.
- [x] Previous owner fallback role.
- [x] Idempotency.
- [x] Audit/notification.

## 12.2 Owner transfer tests

- [x] Success.
- [x] Target inactive.
- [x] Cross-workspace.
- [x] Concurrent transfers.
- [x] Duplicate request.
- [x] Non-owner attempt.
- [x] Notification failure.
- [x] Rollback on transaction failure.

---

# 13. Custom Roles

## 13.1 Implement role CRUD

- [x] Create.
- [x] Read.
- [x] Update with new version.
- [x] Archive.
- [x] In-use checks.

## 13.2 Implement delegability validation

- [x] Actor permission subset.
- [x] Platform maximum.
- [x] Reserved permissions.
- [x] Risk warning.

## 13.3 Role editor metadata API

- [x] Permission groups.
- [x] Description.
- [x] Risk level.
- [x] Effective preview.
- [x] Members using role.

## 13.4 Custom role tests

- [x] Escalation denied.
- [x] Concurrent update.
- [x] Archive in-use.
- [x] Cache invalidation.
- [x] Workspace isolation.
- [x] System role immutable.

---

# 14. Teams

## 14.1 Add team schema/repositories

- [x] Teams.
- [x] Team memberships.
- [x] Team outlets.
- [x] Status/version.

## 14.2 Implement team CRUD

- [x] Create.
- [x] Update.
- [x] Archive.
- [x] Unique name.
- [x] Permission checks.

## 14.3 Implement team assignment

- [x] Add/remove members.
- [x] Assign outlets.
- [x] Bulk operations.
- [x] Cross-workspace checks.
- [x] Audit.

## 14.4 Integrate team references

- [x] CRM assignee validation.
- [x] Complaint team validation.
- [x] Outlet team reference.
- [x] No automatic permission expansion.

---

# 15. Access Requests

## 15.1 Add request schema/repository

- [x] Requested role/outlets.
- [x] Justification.
- [x] Status/version.
- [x] Expiry.

## 15.2 Implement request/review flow

- [x] Create.
- [x] Cancel.
- [x] Approve.
- [x] Reject.
- [x] Delegability.
- [x] Atomic policy update.
- [x] Audit/notification.

## 15.3 Access request tests

- [x] Duplicate active.
- [x] Unauthorized approval.
- [x] Escalation.
- [x] Expired.
- [x] Concurrent review.

---

# 16. Authorization Cache

## 16.1 Implement effective-access cache

- [x] Safe key.
- [x] Bounded TTL.
- [x] Policy/membership versions.
- [x] Workspace isolation.

## 16.2 Implement invalidation

Events:

```text
membership status
role assignment
role update
outlet access
workspace status
owner transfer
platform policy
```

- [x] Immediate suspension/removal invalidation.
- [x] Multi-node propagation.
- [x] Metrics.

## 16.3 Cache failure/resilience tests

- [x] Cache down.
- [x] Stale value.
- [x] Invalidation delay.
- [x] Cross-workspace collision.
- [x] Authoritative fallback.

---

# 17. Service Identities

## 17.1 Define service identity model

- [x] Type.
- [x] Workspace/platform scope.
- [x] Permission policy.
- [x] Secret reference.
- [x] Expiry/revoke.

## 17.2 Integrate background jobs

- [x] Explicit identity.
- [x] Explicit workspace.
- [x] Least privilege.
- [x] Audit attribution.
- [x] No arbitrary user session.

## 17.3 Integrate AI execution identity

- [x] Tool-specific permissions.
- [x] No membership administration.
- [x] No role/owner controls.
- [x] Workspace/outlet constraints.
- [x] Tool Gateway integration.

## 17.4 Service identity security tests

- [x] Expired.
- [x] Revoked.
- [x] Cross-workspace.
- [x] Permission expansion.
- [x] Secret redaction.

---

# 18. Platform Support and Break-Glass

## 18.1 Define platform admin permissions

- [x] Separate identity.
- [x] Diagnostic/read minimization.
- [x] No implicit membership.
- [x] Audit.

## 18.2 Implement support access workflow

- [x] Purpose.
- [x] Target workspace.
- [x] Time limit.
- [x] Notification policy.
- [x] Real actor attribution.

## 18.3 Implement break-glass

- [x] Disabled by default.
- [x] Strong approval.
- [x] Auto expiry.
- [x] Persistent banner.
- [x] Security alert.
- [x] Destructive action restrictions.

## 18.4 Security tests

- [x] Expiry.
- [x] Hidden impersonation rejected.
- [x] Audit attribution.
- [x] Secret fields hidden.
- [x] Workspace owner notification.

---

# 19. Field-Level and Action-Level Policies

## 19.1 Define response redaction framework

- [x] PII.
- [x] Payment.
- [x] Provider credentials.
- [x] Service secrets.
- [x] Audit metadata.

## 19.2 Separate permissions

- [x] Read vs export.
- [x] Update vs archive.
- [x] Read payment vs reconcile.
- [x] View role vs manage role.
- [x] View audit vs manage platform.

## 19.3 Response-shape tests

- [x] Support.
- [x] Finance.
- [x] Analyst.
- [x] Outlet staff.
- [x] Owner.
- [x] Unauthorized.

---

# 20. API Contracts

## 20.1 Workspace APIs

- [x] List/select current workspaces.
- [x] Create.
- [x] Read.
- [x] Update.
- [x] Suspend/archive according to policy.

## 20.2 Member APIs

- [x] List/detail.
- [x] Update role.
- [x] Update outlets.
- [x] Suspend/restore/remove.
- [x] Leave workspace.

## 20.3 Invitation APIs

- [x] Create/list.
- [x] Resend/revoke.
- [x] Accept.

## 20.4 Role/team/access-request APIs

- [x] Strict schemas.
- [x] Permissions.
- [x] Version.
- [x] Idempotency.
- [x] Safe errors.

## 20.5 Current-access API

- [x] Effective permissions.
- [x] Outlet scope.
- [x] Capability flags.
- [x] Policy version.
- [x] No secrets.

---

# 21. UI State Support

## 21.1 Members page contracts

- [x] Counts.
- [x] Filters.
- [x] Search.
- [x] Pagination.
- [x] Empty/no-results distinction.

## 21.2 Invite modal state

- [x] Role options.
- [x] Outlet scope.
- [x] Selected outlets.
- [x] Team.
- [x] Expiry.
- [x] Validation errors.

## 21.3 Edit member drawer

- [x] Current role.
- [x] Effective permissions.
- [x] Outlet access.
- [x] Teams.
- [x] Status.
- [x] Protected owner state.

## 21.4 Role editor

- [x] Permission registry metadata.
- [x] Search/group.
- [x] Risk labels.
- [x] Preview.
- [x] In-use count.

## 21.5 Confirmation/error states

- [x] Suspend.
- [x] Remove.
- [x] Leave.
- [x] Owner transfer.
- [x] Version conflict.
- [x] Partial bulk failure.
- [x] Permission denied.

---

# 22. Audit and Observability

## 22.1 Emit access-control domain events

- [x] Workspace.
- [x] Membership.
- [x] Invitation.
- [x] Role.
- [x] Outlet access.
- [x] Team.
- [x] Owner.
- [x] Break-glass.

## 22.2 Implement authorization tracing

- [x] Decision ID.
- [x] Result/reason.
- [x] Policy version.
- [x] Latency.
- [x] Correlation.

## 22.3 Metrics and alerts

- [x] Allow/deny.
- [x] Suspended attempts.
- [x] Cross-workspace attempts.
- [x] Escalation attempts.
- [x] Invitation failures.
- [x] Cache health.
- [x] Owner transfer.
- [x] Break-glass.

## 22.4 Redaction tests

- [x] No token.
- [x] No service key.
- [x] No password/OTP.
- [x] No sensitive PII labels.

---

# 23. Domain Integration

## 23.1 Outlet Management

- [x] Create/update/pause/archive permissions.
- [x] Manager assignment validity.
- [x] Assigned outlet visibility.

## 23.2 Orders

- [x] Outlet manager sees assigned outlet orders.
- [x] Other outlet denied.
- [x] Approve/status permissions.
- [x] Owner/admin all-outlet behavior.

## 23.3 Products and Inventory

- [x] Product access scoped.
- [x] Inventory adjustment scoped.
- [x] Cross-outlet mutation denied.

## 23.4 CRM

- [x] Contact/chat visibility policy.
- [x] Conversation assignment validation.
- [x] Human takeover permission.

## 23.5 Payments

- [x] Read permissions.
- [x] Reconcile/refund separate.
- [x] AI read-only.
- [x] Secrets redacted.

## 23.6 Channels and AI Agents

- [x] Configure vs read.
- [x] Reauthorization restricted.
- [x] Agent publish restricted.
- [x] Agent cannot expand own tools.

---

# 24. Security Test Matrix

## 24.1 Cross-workspace

- [x] Read.
- [x] Update.
- [x] Delete/archive.
- [x] Search.
- [x] Count.
- [x] Export.
- [x] Related includes.
- [x] Bulk IDs.

## 24.2 Cross-outlet

- [x] Orders.
- [x] Products.
- [x] Inventory.
- [x] Chats.
- [x] Complaints.
- [x] Analytics.

## 24.3 Privilege escalation

- [x] Assign owner.
- [x] Create role with reserved permission.
- [x] Grant permission actor lacks.
- [x] Change outlet scope to all.
- [x] Modify platform role.
- [x] AI admin tool attempt.

## 24.4 Invitation

- [x] Replay.
- [x] Wrong identity.
- [x] Expired.
- [x] Revoked.
- [x] Brute force.
- [x] Token log leakage.

## 24.5 Owner/break-glass

- [x] Remove owner.
- [x] Suspend owner.
- [x] Concurrent transfer.
- [x] Expired impersonation.
- [x] Real actor attribution.

---

# 25. Concurrency and Resilience

## 25.1 Concurrency

- [x] Two owner transfers.
- [x] Role update vs member assignment.
- [x] Remove vs request approval.
- [x] Duplicate invite accept.
- [x] Cache read vs suspension.
- [x] Bulk outlet assignment race.

## 25.2 Resilience

- [x] DB unavailable.
- [x] Cache unavailable.
- [x] Audit unavailable.
- [x] Notification unavailable.
- [x] Session revoke unavailable.
- [x] Outbox retry.
- [x] Partial bulk failure.

## 25.3 Failure policy

- [x] Authorization failure always fails closed.
- [x] Cache failure uses DB.
- [x] Critical audit failure policy documented.
- [x] Owner transfer transaction rolls back fully.
- [x] No partial membership activation.

---

# 26. Performance

## 26.1 Baselines

- [x] Cached decision.
- [x] Uncached decision.
- [x] Member list.
- [x] Permission matrix.
- [x] Outlet assignment.

## 26.2 Scale fixtures

- [x] Many workspaces per user.
- [x] 100+ outlets.
- [x] 1,000+ members.
- [x] Many custom roles.
- [x] Large outlet assignment set.

## 26.3 Query/index verification

- [x] Explain plans.
- [x] No N+1.
- [x] Pagination.
- [x] Cache hit rate.
- [x] Bounded bulk operations.

---

# 27. Migration and Rollout

## 27.1 Bootstrap fresh Supabase

- [x] Permission registry.
- [x] System roles.
- [x] Initial workspace.
- [x] Initial owner membership.
- [x] Initial outlet assignments.
- [x] Initial admins/staff.

## 27.2 Replace legacy checks

- [x] Map routes.
- [x] Add new guards.
- [x] Remove implicit admin.
- [x] Remove Mongo authority.
- [x] Verify Supabase source.

## 27.3 Shadow authorization

Optional staged rollout:

- [x] Evaluate new policy without blocking.
- [x] Compare legacy/new.
- [x] Log mismatches.
- [x] Fix false allows/denies.
- [x] Enforce.

## 27.4 Rollback

- [x] Migration rollback.
- [x] Policy version rollback.
- [x] Cache flush.
- [x] Owner repair.
- [x] Incident runbook.

---

# 28. Fastest Safe Alpha Slice

Implement first:

```text
0 preflight
1 permission registry
2 system roles
3 workspace
4 membership
5 outlet scope
6 policy engine
7 middleware/service guards
8 repository scoping
9 Supabase/RLS
10 invitation basic
11 member admin basic
12 owner guard/transfer
16 cache
22 audit/observability minimum
23 outlet/order integration
24 critical security tests
25 concurrency/resilience
27 bootstrap/rollout
```

Alpha roles:

```text
OWNER
ADMIN
OUTLET_MANAGER
OUTLET_STAFF
```

Alpha permissions:

```text
outlets.read
orders.read
orders.approve
orders.update_status
products.read
members.read
members.invite
members.update_role
members.update_outlets
```

May defer:

```text
custom roles
teams
access requests
platform impersonation
advanced field redaction
multiple roles per membership
```

---

# 29. Final Validation and Release

## 29.1 Required commands

```text
npm run specs:check
npm run test:access:unit
npm run test:access:component
npm run test:access:integration
npm run test:access:security
npm run test:access:property
npm run test:access:concurrency
npm run test:access:resilience
npm run test:access:performance
npm run test:access:all
```

## 29.2 Release checklist

- [x] Workspace isolation.
- [x] Outlet isolation.
- [x] Owner invariant.
- [x] Invitation security.
- [x] Privilege escalation.
- [x] Session/cache revoke.
- [x] RLS.
- [x] AI tool restrictions.
- [x] Service identity restrictions.
- [x] Audit/observability.
- [x] Backup/recovery docs.
- [x] Implementation status honest.
- [x] No production secret/data in tests.

---

# Requirement Traceability

| Requirement | Task Sections |
|---|---|
| WAC-R1–R3 | 0, 3 |
| WAC-R4–R5 | 4 |
| WAC-R6–R10 | 1, 2, 6 |
| WAC-R11–R13 | 5, 8 |
| WAC-R14–R16 | 14 |
| WAC-R17–R19 | 10 |
| WAC-R20 | 15 |
| WAC-R21–R24 | 11, 12 |
| WAC-R25–R27 | 7, 8, 9 |
| WAC-R28–R32 | 17, 18, 23 |
| WAC-R33–R34 | 19, 23 |
| WAC-R35–R36 | 4–16 |
| WAC-R37–R39 | 22, 24 |
| WAC-R40–R41 | 20, 21 |
| WAC-R42 | 27 |
| WAC-R43 | all test sections |
| WAC-R44 | 26 |
| WAC-R45 | 27, 29 |

---

# Definition of Done

The spec is complete only when:

```text
all P0 tasks complete
approved P1 deferrals documented
owner invariant proven
cross-workspace and cross-outlet tests pass
RLS tests pass
authorization cache invalidation passes
critical invitation tests pass
AI/service identities are constrained
role escalation tests pass
all protected routes have guards
documentation and implementation status updated
specs check passes
```
