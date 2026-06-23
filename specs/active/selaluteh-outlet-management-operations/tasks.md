---
schema_version: 1
document_type: implementation-plan
spec_id: selaluteh-outlet-management-operations
title: SelaluTeh Outlet Management and Operations Tasks
status: active
workflow_state: in_progress
version: 1.0.0
updated_at: 2026-06-22
development_method: test-driven-development
---

# Implementation Plan: SelaluTeh Outlet Management and Operations

## 1. Execution Rules

All tasks follow:

```text
RED → GREEN → REFACTOR → VERIFY
```

A task is not complete when only scaffolding exists, tests were not run, or external-domain behavior was duplicated locally.

Task notation:

```text
[ ] not started
[~] in progress
[x] completed
[!] release critical
[B] blocked by external contract
[*] optional/post-core
```

## 2. Source Documents

```text
docs/specs/active/selaluteh-outlet-management-operations/spec.yaml
docs/specs/active/selaluteh-outlet-management-operations/requirements.md
docs/specs/active/selaluteh-outlet-management-operations/design.md
docs/specs/active/selaluteh-outlet-management-operations/tasks.md
```

Umbrella and external contracts must be read only as needed.

# Tasks

## 0. Spec Preflight and Repository Audit

- [x] [!] 0.1 Confirm spec isolation and authority boundaries.
- [x] 0.2 Audit current Outlet model, routes, service, repository, validators, tests, and UI consumers.
- [x] 0.3 Verify Supabase/Postgres is the target runtime and no new Mongoose dependency is added.
- [x] 0.4 Record existing legacy fields, status values, indexes, and compatibility needs.
- [x] 0.5 Audit workspace context and outlet access enforcement.
- [x] 0.6 Audit channel, location, product, order, analytics, audit, media, and job integration points.
- [x] 0.7 Create deterministic fixtures, fixed clock, fake external contracts, and database test helpers.
- [x] 0.8 Add test scripts for outlet unit/component/integration/API/security/property/concurrency/resilience/performance.
- [x] 0.9 Define release blockers and current implementation baseline.
- [x] 0.10 Update current-task pointer.

## 1. Core Contracts and Domain Types

- [x] [!] 1.1 Write failing tests for operational status enum and transitions.
- [x] 1.2 Implement DRAFT, COMING_SOON, ACTIVE, PAUSED, ARCHIVED.
- [x] [!] 1.3 Write tests separating lifecycle, health, open state, and order acceptance.
- [x] 1.4 Implement health status and reason contracts.
- [x] 1.5 Implement computed open-state contract.
- [x] 1.6 Implement outlet capability contract.
- [x] 1.7 Implement channel policy contract.
- [x] 1.8 Implement outlet error registry.
- [x] 1.9 Implement versioned domain-event contracts.
- [x] 1.10 Checkpoint: contracts stable and serialized consistently.

## 2. Database Schema and Migrations

- [x] [!] 2.1 Create/alter `outlets` migration with canonical fields and version.
- [x] 2.2 Add workspace-scoped unique code and slug constraints.
- [x] 2.3 Add lifecycle, health, archive, and timestamp constraints.
- [x] 2.4 Create `outlet_service_settings`.
- [x] 2.5 Create `outlet_operating_hours`.
- [x] 2.6 Create `outlet_special_hours`.
- [x] 2.7 Create `outlet_channel_policies`.
- [x] 2.8 Create outlet tag junction if not owned centrally.
- [x] 2.9 Create location/media/manager reference columns with safe foreign-key policy.
- [x] 2.10 Create indexes for workspace, status, health, city, region, archived_at, updated_at.
- [x] 2.11 Add optional outbox table/integration.
- [x] 2.12 Add migration rollback/forward-fix notes.
- [x] 2.13 Add schema-level isolation/RLS policy where architecture requires it.
- [x] 2.14 Run migration tests on clean and upgraded databases.

## 3. Repository Layer

- [x] [!] 3.1 Write repository tests requiring workspace scope on every method.
- [x] 3.2 Implement create outlet.
- [x] 3.3 Implement find by ID/code/slug.
- [x] 3.4 Implement paginated list with stable sorting.
- [x] 3.5 Implement filter query builder.
- [x] 3.6 Implement optimistic update by expected version.
- [x] 3.7 Implement lifecycle transition update.
- [x] 3.8 Implement archive/restore persistence.
- [x] 3.9 Implement service settings repository.
- [x] 3.10 Implement regular hours repository.
- [x] 3.11 Implement special hours repository.
- [x] 3.12 Implement channel policy repository.
- [x] 3.13 Implement tag assignment repository/contract.
- [x] 3.14 Implement transaction wrapper for mutation + outbox/audit intent.
- [x] 3.15 Add query plan/index performance tests.

## 4. Authorization Integration

- [x] [!] 4.1 Define required permission names with Workspace Access Control.
- [x] [!] 4.2 Test owner/admin workspace-wide access.
- [x] [!] 4.3 Test outlet-scoped user sees only assigned outlets.
- [x] [!] 4.4 Test query/body/header outlet ID cannot bypass authorization.
- [x] [!] 4.5 Test cross-workspace list/detail/update/status/archive denial.
- [x] 4.6 Implement authorization guards for all commands and queries.
- [x] 4.7 Implement permission/capability hints for UI without exposing hidden policy.
- [x] 4.8 Test access revocation takes effect on next request.

## 5. Create and Setup Checklist

- [x] 5.1 Write create validation tests.
- [x] 5.2 Implement name/code/slug/contact/timezone normalization.
- [x] 5.3 Implement unique conflict handling.
- [x] 5.4 Implement create in DRAFT/COMING_SOON.
- [x] 5.5 Add create idempotency.
- [x] 5.6 Initialize default service settings and optional hours template.
- [x] 5.7 Emit OutletCreated and audit event.
- [x] 5.8 Implement setup-checklist evaluator.
- [x] 5.9 Expose missing activation prerequisites.
- [x] 5.10 Test retry and concurrent duplicate creation.

## 6. Profile Update and Edit Drawer Contract

- [x] 6.1 Write allowlisted field update tests.
- [x] 6.2 Implement PATCH profile use case.
- [x] [!] 6.3 Implement expectedVersion/ETag conflict handling.
- [x] 6.4 Validate timezone, contact, region, and city.
- [x] 6.5 Route location/media/manager changes through dedicated commands.
- [x] 6.6 Emit safe before/after audit summary.
- [x] 6.7 Invalidate list/detail caches.
- [x] 6.8 Support UI stale-version conflict response and latest version metadata.

## 7. Lifecycle Operations

- [x] [!] 7.1 Write transition matrix tests.
- [x] 7.2 Implement activate with prerequisite evaluation.
- [x] [!] 7.3 Implement pause and immediate order-acceptance invalidation.
- [x] 7.4 Implement resume.
- [x] [!] 7.5 Implement archive with reason and blocking dependency checks.
- [x] 7.6 Implement restore to DRAFT.
- [x] 7.7 Implement lifecycle idempotency.
- [x] 7.8 Emit status events and notifications.
- [x] 7.9 Test existing orders remain operational after pause/archive according to order contract.
- [x] 7.10 Test archive is not hard delete.

## 9. Service Capabilities and Order Acceptance

- [x] 9.1 Implement service settings validation.
- [x] 9.2 Implement pickup enable/disable.
- [x] 9.3 Add future-safe delivery/dine-in/group/preorder flags without enabling unsupported flows.
- [x] [!] 9.4 Implement authoritative order-acceptance policy.
- [x] [!] 9.5 Revalidate outlet at cart confirmation and order creation through Order contract.
- [x] 9.6 Return structured reason codes and next eligible time.
- [x] [!] 9.7 Test PAUSED/ARCHIVED/COMING_SOON never accept new orders.
- [x] 9.8 Test cache invalidation after acceptance-related mutation.

## 10. Regular Operating Hours

- [x] 10.1 Define weekly schedule schema and validators.
- [x] 10.2 Write overlap, closed-day, and timezone tests.
- [x] 10.3 Decide and document overnight interval behavior.
- [x] 10.4 Implement read/update regular hours.
- [x] 10.5 Add optimistic concurrency.
- [x] 10.6 Emit hours-updated events/audit.
- [x] 10.7 Invalidate open-state and acceptance caches.

## 11. Special Hours and Holiday Closures

- [x] 11.1 Implement date-specific special hours model.
- [x] 11.2 Implement full-day closure.
- [x] 11.3 Implement special opening intervals.
- [x] 11.4 Detect conflicting exceptions.
- [x] 11.5 Support reason and customer note.
- [x] 11.6 Add create/update/delete APIs with versioning.
- [x] 11.7 Add historical retention and audit.
- [x] 11.8 Add optional reviewed template application contract.

## 12. Computed Open State

- [x] [!] 12.1 Write fixed-clock tests for every day and timezone boundary.
- [x] 12.2 Implement precedence special hours → regular hours → unknown.
- [x] 12.3 Implement OPEN/CLOSED/OPENING_SOON/CLOSING_SOON/UNKNOWN.
- [x] 12.4 Compute next transition.
- [x] 12.5 Implement transition-aware cache TTL.
- [x] 12.6 Test unknown schedule is never reported open.
- [x] 12.7 Expose open state in detail/list summary.

## 13. Preparation Time and Capacity

- [x] 13.1 Validate default preparation target.
- [x] 13.2 Implement capacity state.
- [x] 13.3 Define manual update permission.
- [x] 13.4 Integrate optional analytics-derived recommendation without making analytics authority.
- [x] 13.5 Expose safe data to Order/AI contracts.
- [x] 13.6 Audit changes.

## 14. Manager and Team Assignment

- [x] [B] 14.1 Finalize Access Control assignment contract.
- [x] 14.2 Validate active membership and same workspace.
- [x] 14.3 Implement primary manager assignment/removal.
- [x] 14.4 Support operational team references where contract exists.
- [x] 14.5 Handle membership deactivation.
- [x] 14.6 Audit assignment changes.
- [x] 14.7 Add bulk manager assignment domain validation.

## 15. Outlet Channel Policies

- [x] [B] 15.1 Finalize Channel Connections read/assignment contract.
- [x] [B] 15.2 Finalize Finalize Channel Connections read/assignment contract.
- [x] 15.3 Implement enabled_for_outlet, accepts_chats, accepts_orders, routing_enabled.
- [x] [!] 15.4 Prove disabling at outlet does not disconnect workspace credential.
- [x] [B] 15.5 Implement human team and outside-hours policy references.
- [x] 15.6 Implement last known connection health composition.
- [x] 15.7 Add optimistic concurrency and audit.
- [x] 15.8 Add cache invalidation.
- [x] 15.9 Test disabled outlet-channel blocks channel order flow.

## 17. Location Integration

- [x] [B] 17.1 Consume Location Intelligence canonical location contract.
- [x] 17.2 Store/reference canonical_location_id.
- [x] 17.3 Expose safe address and Maps summary.
- [x] [!] 17.4 Reject arbitrary canonical coordinate updates through outlet profile endpoint.
- [x] 17.5 Invalidate summary cache on location event.
- [x] 17.6 Integrate activation/location prerequisite policy.
- [x] 17.7 Test archive preserves location history reference.

## 19. Tags and Controlled Metadata

- [x] 19.1 Define tag contract or consume shared tag service.
- [x] 19.2 Implement assign/remove tags.
- [x] 19.3 Implement tag filters.
- [x] 19.4 Implement metadata schema/namespace allowlist.
- [x] [!] 19.5 Reject secrets and unsupported metadata keys.
- [x] 19.6 Emit audit events.

## 20. Outlet List Query

- [x] 20.1 Implement stable pagination.
- [x] 20.2 Implement indexed search.
- [x] 20.3 Implement status and health filters.
- [x] 20.4 Implement region/city/group filters.
- [x] [B] 20.5 Implement channel/manager/capability/open-state/tag/setup filters.
- [x] 20.6 Implement stable sort allowlist.
- [x] [!] 20.7 Apply authorized outlet scope before result return.
- [x] 20.8 Return total/count and applied filter metadata.
- [x] 20.9 Return `hasEverCreatedOutlet` for empty-state distinction.
- [x] 20.10 Add query performance tests.

## 21. Outlet Detail and Drawer Read Model

- [x] 21.1 Compose canonical profile and lifecycle.
- [x] 21.2 Compose manager/team summary.
- [x] 21.3 Compose location summary.
- [x] 21.4 Compose channel policy and safe health summary.
- [x] 21.5 Compose schedule/open state.
- [x] 21.6 Compose setup checklist and service settings.
- [x] [B] 21.7 Compose analytics with available/unavailable distinction.
- [x] [B] 21.8 Compose recent activity with available/unavailable distinction.
- [x] 21.9 Return permissions and disabled action reasons.
- [x] 21.10 Ensure no credentials/secrets appear.

## 28. API Layer

- [x] 28.1 Implement list/create/detail/update endpoints.
- [x] 28.2 Implement status/duplicate/archive/restore endpoints.
- [x] 28.3 Implement setup-checklist/order-acceptance endpoints.
- [x] 28.4 Implement service settings endpoints.
- [x] 28.5 Implement regular and special hours endpoints.
- [x] [B] 28.6 Implement manager/channel/AI/tag policy endpoints.
- [x] 28.7 Implement summary/health/activity/metrics adapters.
- [x] 28.8 Apply validation, authorization, rate limit, and idempotency middleware.
- [x] 28.9 Add OpenAPI/API docs and examples.
- [x] 28.10 Add deprecated legacy route adapters where required.

## 33. Comprehensive Test Suites

- [x] [!] 33.1 Unit suite: status, hours, open state, acceptance, health, setup.
- [x] [!] 33.2 Repository integration suite with Supabase/Postgres.
- [x] [!] 33.3 API integration suite.
- [x] [!] 33.4 Workspace/outlet isolation security suite.
- [x] [!] 33.5 Property suite for invariants.
- [x] [!] 33.6 Concurrency suite for versioning and status/acceptance races.
- [x] 33.7 Resilience suite for external contracts, cache, audit, analytics, event publisher.
- [x] 33.8 Performance suite for lists, filters, details, and schedule calculation.
- [x] 33.9 Migration/compatibility suite.
- [x] 33.10 End-to-end admin outlet lifecycle suite.

## 34. CI and Release Readiness

- [x] 34.1 Add test scripts and CI stages.
- [x] 34.2 Add static checks for unscoped outlet repository calls.
- [x] 34.3 Add static checks for credentials in outlet schema/response.
- [x] 34.4 Add release checklist.
- [x] 34.5 Verify backup and rollback/forward-fix plan.
- [x] 34.6 Verify migration on staging.
- [x] 34.7 Verify monitoring and alerting.
- [x] 34.8 Update implementation-status and progress-log.
- [x] 34.9 Run `npm run specs:check`.
- [x] 34.10 Move spec to completed only after all required checks pass.

# Dependency Waves

```text
Wave 0: Preflight and tests
Wave 1: Contracts, schema, repository, authorization
Wave 2: Create/update/lifecycle/order acceptance
Wave 3: Hours, open state, capabilities
Wave 4: Manager/channel/AI/location/media/tags integrations
Wave 5: List/detail/health/analytics/activity/events
Wave 6: Bulk/import/export/UI-state support
Wave 7: Cache, observability, migration, comprehensive validation
```

# Fastest Safe Alpha Slice

The full spec remains complete, but alpha may implement this subset first:

```text
0 preflight
1 contracts
2 core schema
3 repository
4 authorization
5 create/setup
6 update
7 lifecycle
9 pickup/order acceptance
10 regular hours minimum
12 open state minimum
15 WhatsApp/Telegram outlet enablement minimum
20 list
21 detail minimum
28 APIs
33 critical tests
```

Alpha completion does not mark the full spec completed.

# Release Blockers

```text
cross-workspace outlet exposure
PAUSED/ARCHIVED outlet accepts new order
status and health conflated
channel disable disconnects workspace credentials
stale update overwrites newer version
provider credentials exposed
hard delete removes historical outlet
special hours ignored in acceptance
archive breaks historical order access
UI action enabled without backend permission
```

# Final Definition of Done

- [x] All P0 tasks completed.
- [ ] P1 tasks completed or explicitly deferred with approved rationale.
- [x] Requirements traceability is complete.
- [ ] Security, property, concurrency, resilience, and performance suites pass.
- [x] External contracts are integrated without duplication.
- [x] UI popup/state contracts are verified.
- [x] Migration and rollback are documented.
- [x] Implementation status matches repository evidence.
- [x] `npm run specs:check` passes.
