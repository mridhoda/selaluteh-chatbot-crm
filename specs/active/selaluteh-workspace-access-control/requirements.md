---
schema_version: 1
document_type: requirements
spec_id: selaluteh-workspace-access-control
title: SelaluTeh Workspace Access Control Requirements
status: active
workflow_state: in_progress
version: 1.0.0
updated_at: 2026-06-22
---

# Requirements Document: SelaluTeh Workspace Access Control

## Introduction

Dokumen ini mendefinisikan kebutuhan lengkap untuk domain **Workspace Access Control** pada SelaluTeh Marketplace.

Spec ini mengatur:

```text
workspace
membership
system role
custom role
permission
outlet access
team
invitation
access request
owner transfer
policy evaluation
authorization enforcement
Supabase RLS integration
service identity
audit
cache invalidation
security testing
admin UI states
```

Spec ini mendukung arsitektur:

```text
MVP:
single workspace
→ many outlets
→ many members

Production:
many accounts/workspaces
→ each workspace owns many outlets
→ each workspace has its own members, roles, teams, and data isolation
```

Spec ini merupakan dedicated domain spec di bawah umbrella:

```text
selaluteh-backend-marketplace
```

Spec ini tidak menggantikan authentication implementation. Authentication menjawab:

> Siapa user ini?

Workspace Access Control menjawab:

> Di workspace mana user ini menjadi member, outlet mana yang boleh diakses, dan tindakan apa yang boleh dilakukan?

---

# 1. Authority and Domain Boundaries

| Domain | Authority |
|---|---|
| Workspace, membership, role, permission, team, outlet access, invitation, owner transfer | `selaluteh-workspace-access-control` |
| Login, password, OTP, JWT/session issuance, identity verification | Existing backend authentication contract |
| Outlet lifecycle and operational configuration | `selaluteh-outlet-management-operations` |
| Contact and conversation assignment | `selaluteh-crm-inbox-contacts` |
| Order lifecycle and outlet order operations | `selaluteh-cart-order-lifecycle` |
| Provider credentials and channel connection | `selaluteh-channel-connections-sync` |
| Immutable activity storage | `selaluteh-audit-activity-timeline` |
| Admin bulk jobs | `selaluteh-admin-data-operations` |
| AI agent execution and tools | `selaluteh-ai-agent-architecture` |
| AI scope and tool security | `selaluteh-ai-agent-scope-security` |

---

# 2. Product Principles

```text
Workspace is the primary tenant boundary.

Authentication is not authorization.

Every protected backend operation is authorized server-side.

Frontend visibility is not a security boundary.

A user may belong to multiple workspaces.

A membership belongs to exactly one user and one workspace.

Outlet access is explicit or derived from a workspace-wide role.

Permissions are deny-by-default.

Owner access cannot be accidentally removed.

Cross-workspace identifiers must not leak data.

AI agents, background jobs, service accounts, and humans use explicit identities.

Changes to access are audited and invalidate cached authorization state.

Supabase RLS is defense-in-depth, not the only authorization layer.

Published role versions are stable and policy decisions are traceable.
```

---

# 3. Requirement Summary

| ID | Requirement | Priority |
|---|---|---|
| WAC-R1 | Spec Authority and Domain Boundary | P0 |
| WAC-R2 | Workspace as Tenant Boundary | P0 |
| WAC-R3 | Workspace Identity and Lifecycle | P0 |
| WAC-R4 | User-to-Workspace Membership | P0 |
| WAC-R5 | Membership Status Lifecycle | P0 |
| WAC-R6 | Default System Roles | P0 |
| WAC-R7 | Permission Registry | P0 |
| WAC-R8 | Custom Roles | P1 |
| WAC-R9 | Role Assignment | P0 |
| WAC-R10 | Effective Permission Evaluation | P0 |
| WAC-R11 | Outlet Access Scope | P0 |
| WAC-R12 | Multi-Outlet Member Assignment | P0 |
| WAC-R13 | Workspace-Wide Access | P0 |
| WAC-R14 | Team Model | P1 |
| WAC-R15 | Team Membership | P1 |
| WAC-R16 | Team-Based Resource Assignment | P1 |
| WAC-R17 | Member Invitation | P0 |
| WAC-R18 | Invitation Acceptance and Expiry | P0 |
| WAC-R19 | Invitation Revocation and Resend | P1 |
| WAC-R20 | Access Requests | P1 |
| WAC-R21 | Workspace Owner Protection | P0 |
| WAC-R22 | Ownership Transfer | P0 |
| WAC-R23 | Member Suspension and Removal | P0 |
| WAC-R24 | Self-Removal and Last-Owner Guard | P0 |
| WAC-R25 | Permission Enforcement Middleware | P0 |
| WAC-R26 | Query and Repository Scoping | P0 |
| WAC-R27 | Supabase RLS Integration | P0 |
| WAC-R28 | Service Identities and Background Jobs | P0 |
| WAC-R29 | Platform Administrator and Support Access | P1 |
| WAC-R30 | Break-Glass and Impersonation Control | P1 |
| WAC-R31 | API and Tool Authorization | P0 |
| WAC-R32 | AI Agent Authorization Boundary | P0 |
| WAC-R33 | Resource Ownership and Assignment Rules | P0 |
| WAC-R34 | Field-Level and Action-Level Restrictions | P1 |
| WAC-R35 | Optimistic Concurrency and Idempotency | P0 |
| WAC-R36 | Authorization Cache and Invalidation | P0 |
| WAC-R37 | Audit and Security Events | P0 |
| WAC-R38 | Observability and Decision Tracing | P0 |
| WAC-R39 | Security and Privacy | P0 |
| WAC-R40 | Admin UI State Support | P1 |
| WAC-R41 | API Contracts and Error Model | P0 |
| WAC-R42 | Legacy Migration and Compatibility | P0 |
| WAC-R43 | Testing and Quality Assurance | P0 |
| WAC-R44 | Scalability and Performance | P1 |
| WAC-R45 | Backup, Recovery, and Operational Readiness | P1 |

---

# 4. Detailed Requirements

## WAC-R1: Spec Authority and Domain Boundary

**Priority:** P0

### Acceptance Criteria

1. THE System SHALL use this spec as authority for workspace, membership, role, permission, outlet access, team, invitation, access request, and ownership transfer.
2. THE System SHALL not duplicate password, OTP, JWT issuance, or external identity verification.
3. THE System SHALL consume authentication identity through a verified request context.
4. THE System SHALL not duplicate outlet operational lifecycle, order lifecycle, channel credentials, or audit storage internals.
5. WHEN an external contract is missing, implementation tasks SHALL be marked blocked rather than silently inventing behavior.
6. Dedicated domain specs SHALL override umbrella details for their owned boundaries.
7. Legacy authorization behavior SHALL only remain through documented compatibility adapters.

## WAC-R2: Workspace as Tenant Boundary

**Priority:** P0

### Acceptance Criteria

1. `workspace_id` SHALL be the primary tenant partition for business data.
2. Every tenant-owned entity SHALL have a non-null workspace reference unless explicitly platform-global.
3. Workspace context SHALL come from verified session/token context or trusted service context.
4. Request body/query/path workspace identifiers SHALL not override verified context without explicit cross-workspace permission.
5. Cross-workspace data access SHALL be denied by default.
6. Cache keys, jobs, events, logs, and metrics SHALL include workspace context where required.
7. Unique constraints SHALL be workspace-scoped when identifiers only need uniqueness inside one workspace.
8. Background jobs SHALL process records in explicit workspace batches.
9. Data export SHALL never combine workspaces unless a platform-level authorized workflow explicitly requests it.

## WAC-R3: Workspace Identity and Lifecycle

**Priority:** P0

### Acceptance Criteria

1. Workspace SHALL include: id, name, slug, legal_name optional, status, timezone, locale, owner_membership_id, plan reference, version, created_at, updated_at.
2. Workspace status SHALL support:
   - ACTIVE;
   - SUSPENDED;
   - ARCHIVED.
3. Archived workspace SHALL reject new business mutations.
4. Suspended workspace SHALL reject configured business actions while allowing authorized recovery/administration.
5. Workspace slug SHALL be globally unique if used in URLs.
6. Workspace timezone SHALL use IANA format.
7. Workspace lifecycle changes SHALL be audited.
8. Historical records SHALL retain workspace linkage after archive.
9. Workspace hard delete SHALL not be part of normal admin operations.
10. Workspace restoration SHALL require authorized policy and audit.

## WAC-R4: User-to-Workspace Membership

**Priority:** P0

### Acceptance Criteria

1. Membership SHALL connect exactly one user identity to exactly one workspace.
2. One user MAY have memberships in multiple workspaces.
3. The `(workspace_id, user_id)` pair SHALL be unique for active/non-terminal memberships.
4. Membership SHALL include role assignments, status, outlet scope mode, timestamps, version, and optional title.
5. User profile data SHALL not be duplicated unnecessarily into membership.
6. Membership data SHALL be workspace-scoped.
7. Membership lookup SHALL not expose existence across unauthorized workspaces.
8. Membership creation SHALL require invitation, owner/admin command, migration, or approved platform workflow.
9. Membership updates SHALL be audited.
10. Membership identity SHALL remain stable across role changes.

## WAC-R5: Membership Status Lifecycle

**Priority:** P0

Membership statuses:

```text
INVITED
ACTIVE
SUSPENDED
REMOVED
EXPIRED
```

### Acceptance Criteria

1. INVITED membership SHALL not grant normal workspace access.
2. ACTIVE membership SHALL be eligible for authorization evaluation.
3. SUSPENDED membership SHALL deny normal workspace access.
4. REMOVED membership SHALL deny access while preserving audit history.
5. EXPIRED SHALL be used for invitations that passed expiry without acceptance where modeled as membership.
6. Status transitions SHALL be validated.
7. Removed membership SHALL not be reactivated without an explicit restore/reinvite workflow.
8. Membership status changes SHALL invalidate sessions or authorization cache as required.
9. Last active owner SHALL not be suspended or removed.
10. Duplicate transition commands SHALL be idempotent.

## WAC-R6: Default System Roles

**Priority:** P0

Default roles:

```text
OWNER
ADMIN
OUTLET_MANAGER
OUTLET_STAFF
CUSTOMER_SUPPORT
FINANCE_VIEWER
ANALYST
```

### Acceptance Criteria

1. System roles SHALL have stable identifiers.
2. OWNER SHALL have full workspace access except platform-reserved controls.
3. ADMIN SHALL manage workspace members and most business settings but SHALL not transfer ownership unless explicitly allowed.
4. OUTLET_MANAGER SHALL operate only assigned outlets unless given workspace-wide outlet scope.
5. OUTLET_STAFF SHALL have narrower assigned-outlet operations.
6. CUSTOMER_SUPPORT SHALL access allowed contacts/chats/orders according to scope without payment mutation authority.
7. FINANCE_VIEWER SHALL have read-only payment/revenue permissions.
8. ANALYST SHALL have read-only analytics access.
9. System role definitions SHALL be versioned.
10. System role destructive edits SHALL be forbidden; changes SHALL occur through versioned policy migration.
11. UI labels MAY be localized without changing role identifiers.

## WAC-R7: Permission Registry

**Priority:** P0

### Acceptance Criteria

1. Permissions SHALL use stable machine identifiers.
2. Permission naming SHOULD follow:
   ```text
   domain.resource.action
   ```
3. Example permissions:
   - workspace.settings.read;
   - workspace.settings.update;
   - members.read;
   - members.invite;
   - members.update_role;
   - outlets.read;
   - outlets.create;
   - outlets.update;
   - outlets.pause;
   - outlets.archive;
   - products.read;
   - products.manage;
   - inventory.read;
   - inventory.adjust;
   - orders.read;
   - orders.approve;
   - orders.update_status;
   - payments.read;
   - payments.reconcile;
   - chats.read;
   - chats.reply;
   - chats.assign;
   - agents.read;
   - agents.manage;
   - analytics.read;
   - exports.create.
4. Registry SHALL distinguish read, create, update, delete/archive, approve, assign, manage, and export actions.
5. Unknown permissions SHALL fail closed.
6. Permissions SHALL be documented with scope semantics.
7. Permission registry SHALL be testable and versioned.
8. Permission identifiers SHALL not be generated from UI labels.
9. Deprecated permissions SHALL have migration aliases only for a limited period.
10. Permission changes SHALL trigger role validation.

## WAC-R8: Custom Roles

**Priority:** P1

### Acceptance Criteria

1. Authorized workspace users MAY create custom roles.
2. Custom roles SHALL belong to one workspace.
3. Custom role SHALL include name, description, permission set, scope constraints, version, and status.
4. Custom role cannot grant platform-reserved permissions.
5. Custom role effective permissions SHALL not exceed creator's delegable permissions.
6. Role editing SHALL use optimistic concurrency.
7. A role assigned to active members SHALL not be deleted without reassignment or explicit guarded handling.
8. Custom roles MAY be archived.
9. Published role versions SHALL be immutable or produce a new version.
10. Role changes SHALL invalidate affected authorization caches.
11. Role changes SHALL be audited.
12. UI SHALL preview effective permissions before save.

## WAC-R9: Role Assignment

**Priority:** P0

### Acceptance Criteria

1. Membership SHALL have at least one role assignment when ACTIVE.
2. MVP MAY use one primary role; full model MAY support multiple roles.
3. Multiple role permissions SHALL combine by union unless explicit deny policies are introduced later.
4. Platform-reserved denies SHALL always override role grants.
5. Role assignment SHALL require `members.update_role` or stronger permission.
6. A user SHALL not grant a role with permissions they cannot delegate.
7. Owner role assignment SHALL only occur through ownership transfer.
8. Assignment changes SHALL be atomic and audited.
9. Duplicate assignment SHALL be idempotent.
10. Role removal SHALL not leave an ACTIVE membership with no valid permissions unless an explicit no-access role exists.

## WAC-R10: Effective Permission Evaluation

**Priority:** P0

### Acceptance Criteria

1. Authorization SHALL evaluate:
   - authenticated identity;
   - active membership;
   - workspace;
   - role permissions;
   - outlet scope;
   - resource scope;
   - action;
   - platform overrides;
   - suspension state.
2. Default result SHALL be DENY.
3. Unknown action/resource SHALL be DENY.
4. Decision SHALL be deterministic for identical policy state and context.
5. Decision result SHOULD include reason code and policy version.
6. Authorization SHALL not depend on frontend-hidden controls.
7. Permission checks SHALL occur before protected data retrieval or mutation.
8. Sensitive mutations MAY require step-up verification according to auth policy.
9. Owner protection rules SHALL override generic role changes.
10. Decision evaluation SHALL be independently unit tested.

## WAC-R11: Outlet Access Scope

**Priority:** P0

Outlet scope modes:

```text
ALL_OUTLETS
SELECTED_OUTLETS
NO_OUTLET_ACCESS
```

### Acceptance Criteria

1. Membership SHALL have an outlet scope mode.
2. ALL_OUTLETS SHALL derive access to all current and future outlets in the workspace for allowed permissions.
3. SELECTED_OUTLETS SHALL require explicit membership-outlet assignments.
4. NO_OUTLET_ACCESS SHALL allow workspace-only features while denying outlet resources.
5. Outlet scope SHALL be evaluated in addition to role permission.
6. Outlet identifiers from unauthorized scope SHALL not leak resource details.
7. Archived outlets SHALL follow domain-specific historical read rules.
8. Changing outlet assignments SHALL invalidate authorization cache.
9. Outlet scope changes SHALL be audited.
10. Owner SHALL always have ALL_OUTLETS.
11. Admin MAY have configurable outlet scope according to policy.

## WAC-R12: Multi-Outlet Member Assignment

**Priority:** P0

### Acceptance Criteria

1. One membership MAY be assigned to multiple outlets.
2. Assignment SHALL use a join/entity with workspace_id, membership_id, outlet_id, assignment role/metadata optional, created_at, and actor.
3. Assignment SHALL verify membership and outlet belong to the same workspace.
4. Duplicate assignments SHALL be prevented.
5. Removing an outlet assignment SHALL immediately affect new authorization decisions.
6. Bulk assignment SHALL be atomic where feasible or report partial results explicitly.
7. Assignment history SHALL be audited.
8. Outlet archive SHALL not corrupt membership history.
9. Assignment queries SHALL support listing members per outlet and outlets per member.
10. Assignment SHALL not imply operational manager ownership unless Outlet Management explicitly references it.

## WAC-R13: Workspace-Wide Access

**Priority:** P0

### Acceptance Criteria

1. Workspace-wide permission SHALL not automatically imply all outlet actions unless outlet scope is ALL_OUTLETS.
2. Workspace-wide settings SHALL require workspace permissions independent from outlet permissions.
3. A member MAY manage workspace knowledge/agents while having no order access.
4. A member MAY view analytics across all permitted outlets according to analytics scope.
5. Workspace owner SHALL have full workspace-wide access.
6. Cross-workspace switching SHALL require selecting an active membership.
7. Current workspace context SHALL be explicit in session/request state.
8. Switching workspace SHALL not reuse stale cached permissions from another workspace.

## WAC-R14: Team Model

**Priority:** P1

### Acceptance Criteria

1. Workspace MAY define teams.
2. Team SHALL include id, workspace_id, name, description, type, status, version, timestamps.
3. Team types MAY include:
   - SUPPORT;
   - OUTLET_OPERATIONS;
   - FINANCE;
   - SALES;
   - CUSTOM.
4. Team names SHALL be unique per workspace when active.
5. Teams MAY be linked to outlets.
6. Team archive SHALL preserve assignment history.
7. Team management SHALL require explicit permissions.
8. Team changes SHALL be audited.

## WAC-R15: Team Membership

**Priority:** P1

### Acceptance Criteria

1. ACTIVE workspace membership MAY belong to multiple teams.
2. Team membership SHALL be workspace-consistent.
3. Suspended/removed workspace members SHALL not function as active team members.
4. Team membership SHALL not grant permissions unless team-based policy explicitly supports it.
5. Team membership changes SHALL be idempotent and audited.
6. Team member listing SHALL respect workspace authorization.
7. Bulk team assignment SHALL have partial-failure reporting.

## WAC-R16: Team-Based Resource Assignment

**Priority:** P1

### Acceptance Criteria

1. Teams MAY be referenced as assignees for chats, complaints, operational alerts, or outlets through owning domain contracts.
2. Access Control SHALL validate that team belongs to the workspace and actor may assign it.
3. Resource ownership semantics SHALL remain owned by the resource domain.
4. Team assignment SHALL not silently expand member permissions beyond policy.
5. Team outlet scope MAY constrain assignment targets.
6. Team deletion/archive SHALL not erase historical resource assignments.
7. Cross-domain team references SHALL use stable IDs and events.

## WAC-R17: Member Invitation

**Priority:** P0

### Acceptance Criteria

1. Authorized users MAY invite a member by email or supported identity channel.
2. Invitation SHALL include workspace, intended role, outlet scope, expiry, inviter, and token hash/reference.
3. Invitation token SHALL be single-use and time-limited.
4. Raw invitation token SHALL not be stored in plaintext.
5. Invitation SHALL not grant active access before acceptance.
6. Duplicate pending invitation to the same identity SHALL be handled deterministically.
7. Invitation role/outlet assignments SHALL be validated before sending.
8. Inviter cannot delegate permissions they do not hold.
9. Invitation creation SHALL be audited.
10. Email/channel delivery failure SHALL not create ACTIVE membership.

## WAC-R18: Invitation Acceptance and Expiry

**Priority:** P0

### Acceptance Criteria

1. Valid invitation acceptance SHALL create or activate membership atomically.
2. Expired invitation SHALL be rejected.
3. Revoked invitation SHALL be rejected.
4. Used invitation SHALL be rejected idempotently without duplicate membership.
5. Invitation identity SHALL match authenticated/verified accepting identity according to auth policy.
6. Acceptance SHALL apply validated role and outlet scope.
7. Acceptance SHALL record timestamp and actor identity.
8. Acceptance SHALL invalidate pending invitation cache.
9. Expiry processing SHALL be idempotent.
10. Invitation acceptance SHALL not bypass workspace suspension policy.

## WAC-R19: Invitation Revocation and Resend

**Priority:** P1

### Acceptance Criteria

1. Authorized users MAY revoke pending invitations.
2. Revocation SHALL invalidate token immediately.
3. Resend SHOULD generate a new token and invalidate the old token.
4. Resend SHALL preserve or explicitly update intended role/outlet scope.
5. Rate limits SHALL prevent invitation abuse.
6. Resend/revoke actions SHALL be audited.
7. UI SHALL show pending, expired, accepted, and revoked invitation states.
8. Invitation delivery status MAY be tracked without exposing secrets.

## WAC-R20: Access Requests

**Priority:** P1

### Acceptance Criteria

1. Existing members MAY request additional outlet or permission access.
2. Request SHALL specify requested scope and justification.
3. Request SHALL have statuses:
   - PENDING;
   - APPROVED;
   - REJECTED;
   - CANCELLED;
   - EXPIRED.
4. Approval SHALL be performed by authorized approver.
5. Approver cannot grant non-delegable permissions.
6. Approval SHALL update access atomically and audit both request and resulting policy change.
7. Rejection MAY include a reason visible to requester.
8. Duplicate active requests SHOULD be prevented.
9. Requests SHALL not grant access before approval.

## WAC-R21: Workspace Owner Protection

**Priority:** P0

### Acceptance Criteria

1. Every ACTIVE workspace SHALL have exactly one canonical owner membership unless multi-owner policy is explicitly introduced later.
2. Owner membership SHALL be ACTIVE.
3. Owner SHALL have ALL_OUTLETS.
4. Owner role SHALL not be removed through generic role update.
5. Owner SHALL not be suspended, removed, or self-removed while still canonical owner.
6. Workspace operations SHALL fail safely if owner invariant is broken.
7. Repair tooling SHALL require platform-level authorization and audit.
8. Owner identity SHALL be visible to authorized workspace admins.
9. Owner permission SHALL not be delegated through custom role cloning.

## WAC-R22: Ownership Transfer

**Priority:** P0

### Acceptance Criteria

1. Ownership transfer SHALL require current owner or approved platform recovery workflow.
2. Target SHALL be an ACTIVE membership in the same workspace.
3. Transfer SHALL use explicit confirmation and may require step-up authentication.
4. Transfer SHALL be atomic:
   - target becomes OWNER;
   - previous owner becomes configured fallback role;
   - workspace owner reference updates.
5. Transfer SHALL be idempotent.
6. Concurrent transfer attempts SHALL use optimistic locking.
7. Transfer SHALL be audited as a critical security event.
8. Notification SHOULD be sent to both previous and new owner.
9. Transfer SHALL not cross workspaces.
10. Target user consent MAY be required according to product policy.

## WAC-R23: Member Suspension and Removal

**Priority:** P0

### Acceptance Criteria

1. Authorized users MAY suspend or remove non-owner members.
2. Suspension SHALL immediately deny normal workspace access.
3. Removal SHALL preserve historical actor references.
4. Active sessions/tokens SHOULD be revoked or invalidated promptly.
5. Assigned operational resources SHALL follow owning-domain reassignment policy.
6. Removal SHALL not delete user identity.
7. Actor cannot remove a member with higher protected authority unless policy allows.
8. Bulk suspension/removal SHALL be guarded and audited.
9. Duplicate commands SHALL be idempotent.
10. Owner protection SHALL always apply.

## WAC-R24: Self-Removal and Last-Owner Guard

**Priority:** P0

### Acceptance Criteria

1. Non-owner member MAY leave workspace when no blocking ownership/resource rule applies.
2. Owner SHALL transfer ownership before leaving.
3. Self-removal SHALL revoke access immediately.
4. Self-removal SHALL not delete historical actions.
5. Leaving one workspace SHALL not affect memberships in other workspaces.
6. UI SHALL clearly warn about access loss.
7. Self-removal SHALL use explicit confirmation.
8. Rejoining SHALL require invitation or approved restore workflow.

## WAC-R25: Permission Enforcement Middleware

**Priority:** P0

### Acceptance Criteria

1. Backend SHALL provide reusable authorization middleware/guard.
2. Guard input SHALL include verified user/service identity, workspace, action, resource type, and optional resource/outlet.
3. Guard SHALL fail closed.
4. Guard SHALL distinguish unauthenticated, no-membership, suspended, insufficient-permission, and outside-outlet-scope internally.
5. Public error responses SHALL avoid unnecessary existence leakage.
6. Middleware SHALL not trust frontend role labels.
7. Route registration SHALL explicitly declare required permission.
8. Sensitive service methods SHALL also enforce authorization, not rely only on HTTP middleware.
9. Unit and integration tests SHALL verify every protected route.
10. Missing permission declaration on protected route SHOULD fail static/architecture checks.

## WAC-R26: Query and Repository Scoping

**Priority:** P0

### Acceptance Criteria

1. Repositories SHALL require workspace context for tenant-owned queries.
2. Outlet-owned queries SHALL additionally require authorized outlet scope.
3. Unscoped repository methods SHALL be forbidden or clearly platform-internal.
4. Query builders SHALL not accept raw workspace filters from untrusted input.
5. List endpoints SHALL return only authorized records.
6. Counts and aggregates SHALL respect the same scope.
7. Search/autocomplete SHALL not leak unauthorized names or IDs.
8. Bulk operations SHALL validate every target.
9. Repository tests SHALL include cross-workspace and cross-outlet fixtures.
10. Raw SQL SHALL include explicit tenant predicates or RLS-safe context.

## WAC-R27: Supabase RLS Integration

**Priority:** P0

### Acceptance Criteria

1. Supabase/PostgreSQL SHALL be the target authorization-aware data store.
2. RLS policies SHALL protect tenant-owned tables where applicable.
3. Backend authorization SHALL remain required even when RLS exists.
4. Service role usage SHALL be restricted to trusted backend processes.
5. Service role SHALL not be exposed to client or AI prompt.
6. RLS context strategy SHALL be documented.
7. Direct client access, if allowed later, SHALL use least-privilege policies.
8. RLS tests SHALL verify cross-workspace denial.
9. Migration SHALL not temporarily disable isolation without compensating controls.
10. Policy changes SHALL be versioned and reviewed.
11. Custom backend auth SHALL remain active for MVP unless separately migrated to Supabase Auth.

## WAC-R28: Service Identities and Background Jobs

**Priority:** P0

### Acceptance Criteria

1. Non-human processes SHALL use explicit service identity.
2. Service identity SHALL have a defined workspace scope or platform scope.
3. Background jobs SHALL not inherit an arbitrary user session.
4. Service permissions SHALL be least-privilege.
5. Job payload SHALL include workspace and correlation context.
6. Cross-workspace batch jobs SHALL iterate explicitly and isolate failures.
7. Service credentials SHALL be secret-managed.
8. Service actions SHALL be audited where business-impacting.
9. Expired/revoked service identity SHALL fail closed.
10. AI agents SHALL not be treated as unrestricted service identities.

## WAC-R29: Platform Administrator and Support Access

**Priority:** P1

### Acceptance Criteria

1. Platform administrator identity SHALL be separate from workspace membership.
2. Platform admin access SHALL be limited to documented support/operations functions.
3. Platform admin SHALL not silently become workspace owner/member.
4. Workspace data access SHALL require purpose, authorization, and audit.
5. Support views SHOULD minimize sensitive data.
6. Platform admin permissions SHALL be centrally managed.
7. Production support access SHOULD be time-bound where feasible.
8. Platform admin actions SHALL be clearly distinguished in audit logs.
9. Platform admin access SHALL not be granted to AI agents.

## WAC-R30: Break-Glass and Impersonation Control

**Priority:** P1

### Acceptance Criteria

1. Emergency break-glass access SHALL be disabled by default.
2. Activation SHALL require strong authorization and recorded reason.
3. Access SHALL be time-limited.
4. Impersonation SHALL display a persistent banner and target workspace/user.
5. Impersonation SHALL not reveal secrets or payment credentials.
6. Destructive operations MAY be blocked during support impersonation.
7. Every action SHALL be attributed to the real platform actor and impersonated context.
8. Session SHALL expire automatically.
9. Workspace owner SHOULD be notified according to policy.
10. Break-glass events SHALL trigger security alerting.

## WAC-R31: API and Tool Authorization

**Priority:** P0

### Acceptance Criteria

1. Every admin API SHALL declare permission and scope.
2. Every AI/backend tool SHALL declare workspace and outlet authorization requirements.
3. Tool input SHALL not be able to override verified workspace.
4. Tool Gateway SHALL reject unknown or unauthorized tools.
5. Resource IDs SHALL be revalidated server-side.
6. Read and write tools SHALL have separate permissions.
7. Bulk tools SHALL validate each target.
8. API errors SHALL be stable and safe.
9. Authorization decision SHALL be traceable by correlation ID.
10. Frontend disabled state SHALL not replace backend authorization.

## WAC-R32: AI Agent Authorization Boundary

**Priority:** P0

### Acceptance Criteria

1. AI agent SHALL operate with a constrained execution identity.
2. AI agent permissions SHALL be a subset of platform-approved tool capabilities.
3. Agent custom prompts SHALL not expand permissions.
4. Agent SHALL not manage memberships, roles, owner transfer, or platform admin access.
5. Agent SHALL not bypass workspace/outlet scope.
6. Customer-facing agent SHALL only access the current customer's permitted business context.
7. AI payment permissions SHALL remain read-only except creating authorized payment requests through backend.
8. AI tool calls SHALL be evaluated by Tool Gateway and Access Control.
9. Human takeover SHALL remain authoritative.
10. AI authorization failures SHALL not reveal hidden resource existence.

## WAC-R33: Resource Ownership and Assignment Rules

**Priority:** P0

### Acceptance Criteria

1. Access Control SHALL validate assignee membership/team/workspace validity.
2. Resource domain SHALL own assignment lifecycle semantics.
3. Contact owner, conversation assignee, outlet manager, and order outlet SHALL remain distinct concepts.
4. Assigning a resource SHALL not automatically broaden all workspace permissions.
5. Assignee SHALL have required access to the target resource/outlet.
6. Removing member access SHALL trigger owning-domain reassignment or unassigned handling.
7. Assignment changes SHALL be audited.
8. Historical assignments SHALL retain actor identity after member removal.

## WAC-R34: Field-Level and Action-Level Restrictions

**Priority:** P1

### Acceptance Criteria

1. Sensitive fields MAY require stronger permissions than resource read.
2. Payment secrets, provider credentials, password/OTP, and service keys SHALL never be exposed through general read permissions.
3. Finance read permission MAY view payment status/amount but not secret gateway payload.
4. Contact PII fields MAY be redacted according to role.
5. Export permission SHALL be separate from list/read permission.
6. Archive/delete permission SHALL be separate from update.
7. Approval permission SHALL be separate from status read.
8. Field redaction SHALL be server-side.
9. API schemas SHALL document redacted/omitted fields.
10. Tests SHALL verify role-specific response shapes.

## WAC-R35: Optimistic Concurrency and Idempotency

**Priority:** P0

### Acceptance Criteria

1. Membership, role, workspace, team, and invitation mutations SHALL support version/conflict handling where concurrent edits matter.
2. Ownership transfer SHALL use optimistic locking.
3. Invite, revoke, resend, suspend, remove, assign role, and assign outlet commands SHALL support idempotency keys or deterministic duplicate handling.
4. Conflicts SHALL return stable errors.
5. Duplicate requests SHALL not create duplicate memberships/assignments.
6. Concurrent role edits SHALL not silently overwrite.
7. Audit event duplication SHALL be prevented or deduplicated.
8. Tests SHALL include races for owner transfer and member updates.

## WAC-R36: Authorization Cache and Invalidation

**Priority:** P0

### Acceptance Criteria

1. Effective authorization MAY be cached.
2. Cache key SHALL include user/service identity, workspace, policy version, membership version, and relevant outlet scope.
3. Cache SHALL never be the source of truth.
4. Role, membership, outlet assignment, team policy, workspace status, or platform override changes SHALL invalidate affected cache.
5. Suspension/removal SHALL invalidate immediately.
6. Cache TTL SHALL be bounded.
7. Cross-workspace cache collisions SHALL be impossible.
8. Cache failure SHALL fall back to authoritative evaluation.
9. Stale cache SHALL not preserve access after removal beyond documented hard maximum.
10. Cache metrics SHALL be observable without PII leakage.

## WAC-R37: Audit and Security Events

**Priority:** P0

Events SHALL include:

```text
WORKSPACE_CREATED
WORKSPACE_STATUS_CHANGED
MEMBER_INVITED
INVITATION_ACCEPTED
INVITATION_REVOKED
MEMBER_SUSPENDED
MEMBER_REMOVED
MEMBER_LEFT
ROLE_CREATED
ROLE_UPDATED
ROLE_ASSIGNED
ROLE_REMOVED
OUTLET_ACCESS_GRANTED
OUTLET_ACCESS_REVOKED
TEAM_CREATED
TEAM_MEMBERSHIP_CHANGED
ACCESS_REQUEST_CREATED
ACCESS_REQUEST_APPROVED
ACCESS_REQUEST_REJECTED
OWNERSHIP_TRANSFERRED
BREAK_GLASS_STARTED
BREAK_GLASS_ENDED
AUTHORIZATION_DENIED
```

### Acceptance Criteria

1. Security-sensitive changes SHALL emit immutable audit events through audit contract.
2. Events SHALL include actor, target, workspace, action, timestamp, correlation ID, and safe before/after metadata.
3. Secrets SHALL not be included.
4. Authorization-denied events SHALL be sampled/rate-controlled to avoid noise while preserving attacks.
5. Owner transfer and break-glass SHALL always be audited.
6. Event emission SHALL use outbox/reliable pattern where required.
7. Audit failure behavior SHALL be documented for critical mutations.

## WAC-R38: Observability and Decision Tracing

**Priority:** P0

### Acceptance Criteria

1. Authorization decisions SHOULD include decision ID, action, resource, workspace, outlet scope, result, reason code, and policy version.
2. Metrics SHALL include:
   - authorization_allow_total;
   - authorization_deny_total;
   - no_membership_total;
   - suspended_membership_total;
   - outlet_scope_denied_total;
   - invitation_created_total;
   - invitation_accept_failed_total;
   - cache_hit_total;
   - cache_invalidation_total;
   - owner_transfer_total.
3. Metrics SHALL avoid email, name, raw user ID, and PII labels.
4. Latency SHALL be measured.
5. Denial spikes SHALL trigger alerting.
6. Cross-workspace attempts SHALL trigger security signals.
7. Trace data SHALL not include secrets.
8. Decision tracing SHALL support debugging without exposing hidden chain of thought.

## WAC-R39: Security and Privacy

**Priority:** P0

### Acceptance Criteria

1. Authorization SHALL be deny-by-default.
2. Passwords, OTP, JWT secrets, API keys, service-role keys, and invitation tokens SHALL never be exposed.
3. Raw invitation tokens SHALL be hashed or stored in a secure token system.
4. Role escalation attempts SHALL be rejected.
5. Workspace/outlet identifiers SHALL be treated as untrusted input.
6. CSRF/session protections SHALL follow authentication architecture.
7. Rate limits SHALL protect invite, resend, access request, and sensitive mutations.
8. PII visibility SHALL follow least privilege.
9. Security headers/log redaction SHALL follow backend standards.
10. Authorization policies SHALL be reviewed for every new domain permission.
11. Unknown role/permission SHALL fail closed.
12. Platform support access SHALL be audited and time-bound.

## WAC-R40: Admin UI State Support

**Priority:** P1

Backend SHALL support states for:

```text
Members list
Invite member modal
Pending invitations
Edit member role drawer
Assign outlets modal
Create custom role
Role permission matrix
Team management
Access request review
Owner transfer confirmation
Suspend/remove confirmation
No-access state
Permission denied state
Workspace switcher
Empty team/member states
Conflict/version error
Bulk assignment partial failure
```

### Acceptance Criteria

1. List APIs SHALL provide pagination, filtering, status, role, outlet, and search.
2. Member detail SHALL include effective role and outlet scope.
3. UI SHALL receive capability flags or use permission endpoint to show allowed actions.
4. Capability flags SHALL be advisory; backend remains authority.
5. Partial failures SHALL include per-item results.
6. Conflict errors SHALL include safe latest-version metadata where useful.
7. Empty and no-results states SHALL be distinguishable.
8. Pending invitations SHALL expose expiry and delivery status safely.
9. Permission matrix SHALL expose documented permissions and descriptions.
10. Owner-protected actions SHALL return specific safe errors.

## WAC-R41: API Contracts and Error Model

**Priority:** P0

Suggested APIs:

```text
GET    /api/workspaces
POST   /api/workspaces
GET    /api/workspaces/:workspaceId
PATCH  /api/workspaces/:workspaceId
GET    /api/workspaces/:workspaceId/members
POST   /api/workspaces/:workspaceId/invitations
POST   /api/workspaces/:workspaceId/invitations/:invitationId/resend
DELETE /api/workspaces/:workspaceId/invitations/:invitationId
POST   /api/invitations/:token/accept
PATCH  /api/workspaces/:workspaceId/members/:membershipId
POST   /api/workspaces/:workspaceId/members/:membershipId/suspend
POST   /api/workspaces/:workspaceId/members/:membershipId/restore
DELETE /api/workspaces/:workspaceId/members/:membershipId
PUT    /api/workspaces/:workspaceId/members/:membershipId/outlets
GET    /api/workspaces/:workspaceId/roles
POST   /api/workspaces/:workspaceId/roles
PATCH  /api/workspaces/:workspaceId/roles/:roleId
POST   /api/workspaces/:workspaceId/owner-transfer
GET    /api/workspaces/:workspaceId/permissions/me
```

### Acceptance Criteria

1. APIs SHALL use strict schemas.
2. Workspace context SHALL be verified.
3. Mutation APIs SHALL support idempotency where relevant.
4. Versioned resources SHALL support optimistic concurrency.
5. Stable errors SHALL include:
   - AUTHENTICATION_REQUIRED;
   - WORKSPACE_MEMBERSHIP_REQUIRED;
   - MEMBERSHIP_SUSPENDED;
   - PERMISSION_DENIED;
   - OUTLET_SCOPE_DENIED;
   - ROLE_NOT_FOUND;
   - ROLE_ESCALATION_DENIED;
   - INVITATION_INVALID;
   - INVITATION_EXPIRED;
   - INVITATION_REVOKED;
   - OWNER_PROTECTED;
   - LAST_OWNER_REQUIRED;
   - VERSION_CONFLICT;
   - CROSS_WORKSPACE_ACCESS_DENIED.
6. Errors SHALL not leak unauthorized resource existence.
7. API documentation SHALL include required permission.

## WAC-R42: Legacy Migration and Compatibility

**Priority:** P0

### Acceptance Criteria

1. Legacy users/outlet access SHALL be audited before migration.
2. Mongo/Mongoose authorization records SHALL not remain active after Supabase cutover.
3. Since legacy Mongo data is not important, fresh Supabase data MAY be used.
4. Default initial workspace and owner SHALL be bootstrapped safely.
5. Existing admin users SHALL be mapped to explicit memberships.
6. Legacy implicit admin checks SHALL be replaced by permission checks.
7. Temporary compatibility adapters SHALL be documented and removable.
8. Migration SHALL validate no user receives unintended cross-outlet access.
9. Rollback strategy SHALL be documented.
10. Migration completion SHALL be verified against repository reality.

## WAC-R43: Testing and Quality Assurance

**Priority:** P0

### Acceptance Criteria

1. Implementation SHALL follow TDD.
2. Unit tests SHALL cover policy evaluation, role union, owner guard, outlet scope, transitions, and token expiry.
3. Component tests SHALL cover invitation, role assignment, owner transfer, cache invalidation, and RLS adapter.
4. Integration tests SHALL cover APIs, repositories, domain services, and external contracts.
5. Security tests SHALL cover privilege escalation, IDOR, cross-workspace, cross-outlet, token replay, invitation theft, and support impersonation.
6. Property tests SHALL verify effective permissions never exceed allowed grants and owner invariant.
7. Concurrency tests SHALL cover owner transfer, duplicate invitation acceptance, simultaneous role updates, and suspension races.
8. Resilience tests SHALL cover cache, database, event, notification, and audit failures.
9. Performance tests SHALL cover permission evaluation and large member/outlet assignments.
10. Live production secrets/data SHALL be forbidden.
11. Skipped critical tests SHALL block release.
12. All protected routes SHALL have authorization tests.

## WAC-R44: Scalability and Performance

**Priority:** P1

### Acceptance Criteria

1. Membership and permission lookup SHALL be indexed.
2. Outlet assignment queries SHALL support many outlets and members.
3. Effective permission evaluation SHOULD meet documented latency targets.
4. Cache MAY reduce repeated policy evaluation.
5. Bulk assignment SHALL use bounded batch sizes.
6. List endpoints SHALL paginate.
7. Permission matrix retrieval SHALL be cacheable by policy version.
8. Background invalidation SHALL be reliable.
9. Performance tests SHALL use realistic synthetic workspace sizes.
10. Architecture SHALL support future franchise workspaces without schema rewrite.

## WAC-R45: Backup, Recovery, and Operational Readiness

**Priority:** P1

### Acceptance Criteria

1. Membership, role, permission, invitation, team, and owner records SHALL be backed up according to platform policy.
2. Restore SHALL preserve owner invariant and workspace isolation.
3. Recovery runbook SHALL include accidental member removal and owner loss.
4. Platform repair tools SHALL be access-controlled and audited.
5. Disaster recovery tests SHOULD validate authorization integrity after restore.
6. Role/permission version history SHALL support policy recovery.
7. Incident procedures SHALL cover privilege escalation and cross-tenant exposure.
8. Release checklist SHALL include access-control regression testing.
9. Configuration/secrets SHALL be recoverable without embedding them in backups improperly.
10. Operational ownership SHALL be documented.

---

# 5. Permission Catalog Baseline

The exact catalog MAY grow, but MVP/full-product baseline SHOULD include:

| Domain | Permissions |
|---|---|
| Workspace | `workspace.read`, `workspace.update`, `workspace.archive` |
| Members | `members.read`, `members.invite`, `members.update_role`, `members.update_outlets`, `members.suspend`, `members.remove` |
| Roles | `roles.read`, `roles.create`, `roles.update`, `roles.archive` |
| Teams | `teams.read`, `teams.create`, `teams.update`, `teams.assign` |
| Outlets | `outlets.read`, `outlets.create`, `outlets.update`, `outlets.pause`, `outlets.archive` |
| Products | `products.read`, `products.manage`, `products.assign_outlets` |
| Inventory | `inventory.read`, `inventory.adjust` |
| Orders | `orders.read`, `orders.approve`, `orders.update_status`, `orders.cancel` |
| Payments | `payments.read`, `payments.manage_links`, `payments.reconcile`, `payments.refund_request` |
| Chats | `chats.read`, `chats.reply`, `chats.assign`, `chats.takeover` |
| Contacts | `contacts.read`, `contacts.update`, `contacts.export` |
| Complaints | `complaints.read`, `complaints.assign`, `complaints.resolve` |
| Agents | `agents.read`, `agents.manage`, `agents.publish` |
| Knowledge | `knowledge.read`, `knowledge.manage`, `knowledge.publish` |
| Channels | `channels.read`, `channels.configure`, `channels.reauthorize` |
| Analytics | `analytics.read`, `analytics.export` |
| Audit | `audit.read` |
| Exports | `exports.create`, `exports.download` |
| Platform-sensitive | reserved, never workspace-custom |

---

# 6. Alpha Slice

The complete spec is broader than MVP. The minimum slice required for alpha ordering is:

```text
workspace
owner membership
admin membership
outlet manager membership
outlet staff membership
role permission checks
membership outlet assignment
list orders only for assigned outlets
approve/update order only for assigned outlets
owner/admin view all outlets according to scope
cross-workspace denial
member suspension
authorization middleware
Supabase RLS defense-in-depth
audit of role/outlet assignment
```

Advanced features that MAY follow after the alpha slice:

```text
custom roles
teams
access requests
support impersonation
break-glass
field-level redaction matrix
multi-role membership
advanced bulk assignment
platform admin support tooling
```

---

# 7. Definition of Done

A requirement is complete only when:

1. failing tests are written first;
2. workspace isolation is verified;
3. outlet scope is verified;
4. owner invariant is verified;
5. permission escalation is rejected;
6. backend guard and service guard are both applied where needed;
7. RLS tests pass;
8. invitation tokens are safe;
9. authorization cache invalidates correctly;
10. sessions/access revoke on suspension/removal;
11. cross-workspace IDs do not leak data;
12. API errors are stable;
13. audit events are emitted;
14. property tests pass;
15. concurrency tests pass;
16. resilience tests pass;
17. performance baseline is recorded;
18. documentation and implementation status are updated;
19. no production secrets/data are used in tests;
20. `npm run specs:check` passes.

---

# 8. Final Requirement Statement

SelaluTeh Workspace Access Control SHALL ensure that every human, service, background job, and AI tool acts only inside an explicitly authorized workspace and outlet scope.

The system SHALL:

```text
authenticate externally
→ resolve active workspace membership
→ evaluate role permissions
→ evaluate outlet scope
→ enforce resource/action policy
→ execute or deny
→ trace and audit sensitive decisions
```

The system SHALL never rely on hidden frontend controls, user-supplied workspace IDs, AI prompts, or role labels as authorization authority.
