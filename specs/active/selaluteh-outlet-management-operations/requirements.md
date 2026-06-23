---
schema_version: 1
document_type: requirements
spec_id: selaluteh-outlet-management-operations
title: SelaluTeh Outlet Management and Operations Requirements
status: active
workflow_state: in_progress
version: 1.0.0
updated_at: 2026-06-22
---

# Requirements Document: SelaluTeh Outlet Management and Operations

## Introduction

Dokumen ini mendefinisikan kebutuhan lengkap untuk domain **Outlet Management and Operations** pada SelaluTeh Marketplace. Cakupan dokumen ini tidak hanya MVP alpha, tetapi target produk penuh yang mendukung multi-workspace, multi-outlet, franchise, channel routing, konfigurasi operasional, status layanan, jam buka, health, audit, analytics integration, bulk operations, dan production readiness.

Spec ini merupakan dedicated domain spec di bawah umbrella:

```text
selaluteh-backend-marketplace
```

Spec ini memperinci requirement umum `R4 Outlet Management` dan kontrak lintas domain yang berkaitan dengan outlet, tetapi tidak menggantikan authority domain lain.

## Authority and External Boundaries

| Domain | Authority |
|---|---|
| Outlet lifecycle, profile, service capabilities, order acceptance, hours, outlet-level policies | `selaluteh-outlet-management-operations` |
| Workspace membership, roles, permissions, outlet access | `selaluteh-workspace-access-control` |
| Provider credential, OAuth, webhook health, connection lifecycle | `selaluteh-channel-connections-sync` |
| Canonical coordinates, Maps URL resolution, nearest outlet | `selaluteh-location-intelligence` |
| Product assignment, availability, price override | `selaluteh-product-catalog` |
| Cart, order status, outlet approval | `selaluteh-cart-order-lifecycle` |
| Generic export/import/bulk job infrastructure | `selaluteh-admin-data-operations` |
| Immutable audit storage and activity query | `selaluteh-audit-activity-timeline` |
| Revenue/order/prep-time aggregates | `selaluteh-analytics-read-models` |
| Alerts and attention workflow | `selaluteh-notification-attention-engine` |
| Image upload and asset lifecycle | `selaluteh-media-assets` |

## Product Principles

```text
Workspace owns outlets.
Outlet is the operational branch boundary.
Operational status is different from health status.
Open/closed state is computed from schedules and is not lifecycle status.
Channel enabled for outlet does not mean provider credential is stored per outlet.
One workspace default AI agent may serve many outlets.
Outlet operations never bypass access control.
Historical orders remain linked after outlet archive.
Backend is the authority for order acceptance.
```

## Requirement Summary

| ID | Requirement | Priority |
|---|---|---|
| OM-R1 | Spec Authority and Domain Boundary | P0 |
| OM-R2 | Workspace Ownership and Tenant Isolation | P0 |
| OM-R3 | Outlet Identity and Profile | P0 |
| OM-R4 | Outlet Code and Slug Uniqueness | P0 |
| OM-R5 | Operational Lifecycle Status | P0 |
| OM-R6 | Operational Health Status | P0 |
| OM-R7 | Create Outlet | P0 |
| OM-R8 | Update Outlet Profile | P0 |
| OM-R9 | Pause, Resume, Archive, and Restore | P0 |
| OM-R10 | Duplicate Outlet | P1 |
| OM-R11 | Manager and Team Assignment Contract | P0 |
| OM-R12 | Outlet Authorization Contract | P0 |
| OM-R13 | Region, City, and Organizational Grouping | P1 |
| OM-R14 | Service Capabilities | P0 |
| OM-R15 | Order Acceptance Policy | P0 |
| OM-R16 | Outlet Channel Assignment Policy | P0 |
| OM-R17 | Outlet AI Handling Policy | P1 |
| OM-R18 | Regular Operating Hours | P0 |
| OM-R19 | Special Hours and Holiday Closures | P0 |
| OM-R20 | Computed Open State | P0 |
| OM-R21 | Preparation Time and Capacity Settings | P1 |
| OM-R22 | Canonical Location Integration | P0 |
| OM-R23 | Outlet Media and Image | P1 |
| OM-R24 | Tags, Labels, and Controlled Metadata | P1 |
| OM-R25 | Outlet List, Search, Filter, Sort, and Pagination | P0 |
| OM-R26 | Outlet Detail and Operational Summary | P0 |
| OM-R27 | Bulk Outlet Actions | P1 |
| OM-R28 | Import and Export Integration | P1 |
| OM-R29 | Audit and Activity Timeline Integration | P0 |
| OM-R30 | Health and Attention Integration | P1 |
| OM-R31 | Analytics Read Model Integration | P1 |
| OM-R32 | Operational Notifications | P1 |
| OM-R33 | API Contracts and Error Model | P0 |
| OM-R34 | Optimistic Concurrency and Idempotency | P0 |
| OM-R35 | Soft Delete, Archive, and Historical Retention | P0 |
| OM-R36 | Security, Privacy, and Secret Handling | P0 |
| OM-R37 | Domain Events and Integration Contracts | P0 |
| OM-R38 | Cache and Invalidation | P1 |
| OM-R39 | Observability and Operational Monitoring | P0 |
| OM-R40 | Testing and Quality Assurance | P0 |
| OM-R41 | Legacy Migration and Compatibility | P0 |
| OM-R42 | Admin UI State Support | P1 |
| OM-R43 | Localization, Timezone, and Formatting | P1 |
| OM-R44 | Scalability and Performance | P1 |
| OM-R45 | Backup, Recovery, and Operational Readiness | P1 |

# Detailed Requirements

## OM-R1: Spec Authority and Domain Boundary

**Priority:** P0

**User Story / Intent:** Menetapkan batas authority Outlet Management agar tidak menduplikasi Access Control, Location Intelligence, Channel Connections, Analytics, Audit, Media, Product, Order, atau Payment.

### Acceptance Criteria

1. THE System SHALL menjadikan spec ini authority untuk lifecycle, profil operasional, kemampuan layanan, jam operasional, status penerimaan order, dan konfigurasi operasional outlet.
2. THE System SHALL menggunakan `selaluteh-backend-marketplace` sebagai umbrella architecture.
3. THE System SHALL menggunakan dedicated spec lain sebagai authority untuk detail domain yang bukan milik outlet management.
4. THE System SHALL menolak implementasi shadow service untuk workspace membership, provider credential, geocoding, product catalog, order lifecycle, payment, generic export job, immutable audit store, analytics aggregate, atau media storage.
5. WHEN external contract belum tersedia, task terkait SHALL ditandai blocked dan tidak diisi dengan asumsi tersembunyi.
6. THE System SHALL mempertahankan backward compatibility hanya melalui adapter yang terdokumentasi dan dapat dihapus.
## OM-R2: Workspace Ownership and Tenant Isolation

**Priority:** P0

**User Story / Intent:** Memastikan setiap outlet dimiliki satu workspace dan seluruh operasi terisolasi.

### Acceptance Criteria

1. Every outlet SHALL memiliki `workspace_id` yang tidak nullable.
2. Workspace SHALL menjadi primary tenant boundary.
3. Backend SHALL mendapatkan workspace dari verified request context, bukan mempercayai body/query mentah.
4. All outlet queries and mutations SHALL include workspace scope.
5. Cross-workspace outlet identifiers SHALL return safe not-found or access-denied responses without leaking data.
6. Unique constraints SHALL be workspace-scoped where applicable.
7. Background jobs and events SHALL carry workspace context.
8. Cache keys SHALL include workspace context when data is tenant-specific.
## OM-R3: Outlet Identity and Profile

**Priority:** P0

**User Story / Intent:** Menyediakan profil canonical outlet yang lengkap.

### Acceptance Criteria

1. Outlet SHALL memiliki minimum fields: id, workspace_id, name, code, slug, description, phone, email, timezone, region_id, city, address_summary, status, health_status, accepts_orders, pickup_enabled, metadata, version, created_at, updated_at.
2. Name SHALL be required and bounded.
3. Code SHALL be normalized and human-readable.
4. Slug SHALL be URL-safe when exposed.
5. Phone and email SHALL be validated when present.
6. Timezone SHALL use an IANA timezone identifier.
7. Address summary SHALL not replace canonical location owned by Location Intelligence.
8. Metadata SHALL be schema-controlled and not become an unbounded dumping field.
9. Profile updates SHALL be audited.
## OM-R4: Outlet Code and Slug Uniqueness

**Priority:** P0

**User Story / Intent:** Menjamin identifier outlet stabil dan tidak duplikat.

### Acceptance Criteria

1. Combination `workspace_id + code` SHALL be unique.
2. Combination `workspace_id + slug` SHALL be unique when slug is enabled.
3. Code normalization SHALL be deterministic.
4. Archived outlet identifiers SHALL remain reserved by default to protect historical references.
5. Duplicate conflicts SHALL return stable error codes.
6. Rename SHALL not silently change code or slug unless explicitly requested.
7. API SHALL expose immutable outlet ID as canonical identifier.
## OM-R5: Operational Lifecycle Status

**Priority:** P0

**User Story / Intent:** Memisahkan lifecycle outlet dari health dan open/closed state.

### Acceptance Criteria

1. Operational status SHALL support `DRAFT`, `COMING_SOON`, `ACTIVE`, `PAUSED`, and `ARCHIVED`.
2. `ACTIVE` SHALL be the only default status eligible to receive new orders.
3. `COMING_SOON` SHALL be visible only according to publication policy and SHALL not receive orders.
4. `PAUSED` SHALL preserve data but reject new order acceptance.
5. `ARCHIVED` SHALL preserve historical data and disappear from normal operational lists.
6. Status transition validation SHALL be server-side.
7. Every status transition SHALL include actor, reason, timestamp, and previous/new status.
8. Hard delete SHALL not be exposed for outlets with historical references.
## OM-R6: Operational Health Status

**Priority:** P0

**User Story / Intent:** Memisahkan masalah operasional dari lifecycle status.

### Acceptance Criteria

1. Health status SHALL support `HEALTHY`, `NEEDS_ATTENTION`, `DEGRADED`, `OFFLINE`, and `UNKNOWN`.
2. Health status SHALL not replace operational status.
3. An ACTIVE outlet MAY have DEGRADED or NEEDS_ATTENTION health.
4. Health SHALL be computed from authoritative signals such as channel health, order acceptance, schedule validity, location verification, and operational alerts.
5. Health changes SHALL not automatically archive an outlet.
6. Critical health rules MAY automatically pause order acceptance only through explicit policy.
7. Health reasons SHALL be available as structured codes.
8. Health status SHALL expose last evaluated time.
## OM-R7: Create Outlet

**Priority:** P0

**User Story / Intent:** Mendukung pembuatan outlet secara aman dan bertahap.

### Acceptance Criteria

1. Authorized user SHALL be able to create an outlet in DRAFT or COMING_SOON.
2. Create SHALL validate code, slug, timezone, region/city, and contact fields.
3. Create SHALL be idempotent when an idempotency key is supplied.
4. Create SHALL not silently activate order acceptance.
5. Create SHALL initialize version and timestamps.
6. Create SHALL emit an outlet-created domain event.
7. Create SHALL not require channel credentials, canonical location, or product availability immediately.
8. Create response SHALL identify incomplete setup requirements.
## OM-R8: Update Outlet Profile

**Priority:** P0

**User Story / Intent:** Mendukung perubahan profil dengan validasi dan concurrency control.

### Acceptance Criteria

1. Profile update SHALL use an allowlist of mutable fields.
2. Update SHALL require authorization and workspace scope.
3. Update SHALL use optimistic concurrency through version or ETag.
4. Conflicting updates SHALL return `OUTLET_VERSION_CONFLICT`.
5. Sensitive changes SHALL create audit events.
6. Update SHALL not mutate external-domain records directly.
7. Location, channel, media, and manager changes SHALL use their dedicated commands or adapters.
8. Partial update SHALL preserve unspecified fields.
## OM-R9: Pause, Resume, Archive, and Restore

**Priority:** P0

**User Story / Intent:** Mendukung operasi lifecycle tanpa kehilangan histori.

### Acceptance Criteria

1. Authorized users SHALL pause and resume eligible outlets.
2. Pause SHALL immediately stop new order acceptance after transaction commit/cache invalidation.
3. Existing paid or in-progress orders SHALL remain accessible and processable according to order policy.
4. Archive SHALL require confirmation and reason.
5. Archive SHALL fail or require resolution when blocking dependencies exist.
6. Restore SHALL return outlet to DRAFT or PAUSED by default, not silently ACTIVE.
7. Lifecycle operations SHALL be idempotent.
8. Notifications and events SHALL be emitted after successful transition.
## OM-R10: Duplicate Outlet

**Priority:** P1

**User Story / Intent:** Mendukung pembuatan outlet baru dari template outlet lama tanpa menyalin data sensitif atau transaksi.

### Acceptance Criteria

1. Authorized user MAY duplicate an outlet into DRAFT.
2. Duplicate SHALL generate new ID, code, and slug.
3. Duplicate MAY copy approved profile, service settings, hours templates, tags, and non-sensitive configuration.
4. Duplicate SHALL NOT copy orders, payments, contacts, conversations, audit history, health alerts, provider credentials, webhook secrets, or customer data.
5. Channel assignments SHALL default disabled unless explicitly selected.
6. Canonical location SHALL require new confirmation unless policy allows a reviewed copy.
7. Product assignments MAY be copied through Product Catalog contract.
8. Duplicate SHALL return a preview of copied and excluded fields.
## OM-R11: Manager and Team Assignment Contract

**Priority:** P0

**User Story / Intent:** Menetapkan hubungan outlet dengan manager/team tanpa mengambil alih Access Control.

### Acceptance Criteria

1. Outlet MAY reference one primary manager and multiple operational teams through Workspace Access contracts.
2. Assignment SHALL validate active workspace membership and required permission.
3. Assignment SHALL not itself grant hidden workspace membership.
4. Removal of membership SHALL invalidate assignment or mark it unresolved.
5. Primary manager SHALL be optional during draft setup.
6. Assignment changes SHALL be audited.
7. Outlet list/detail MAY display manager summary from access-control read contract.
8. Bulk manager assignment SHALL use generic admin operation orchestration where available.
## OM-R12: Outlet Authorization Contract

**Priority:** P0

**User Story / Intent:** Mendefinisikan permission yang harus ditegakkan oleh Access Control.

### Acceptance Criteria

1. Operations SHALL require explicit permissions such as outlet.read, outlet.create, outlet.update, outlet.status.manage, outlet.hours.manage, outlet.channels.manage, outlet.manager.assign, outlet.archive, and outlet.bulk.manage.
2. Workspace-wide roles MAY access all outlets only when policy grants it.
3. Outlet-scoped users SHALL see only assigned outlets.
4. Query parameters SHALL never grant authorization.
5. Disabled access SHALL apply on the next request.
6. Background jobs SHALL use service authorization and workspace scope.
7. Permission failures SHALL use stable error responses.
## OM-R13: Region, City, and Organizational Grouping

**Priority:** P1

**User Story / Intent:** Mendukung outlet grouping untuk filter, policy, dan ekspansi nasional.

### Acceptance Criteria

1. Outlet SHALL support region and city references.
2. Region/city values SHALL use controlled identifiers or normalized records.
3. Outlet MAY belong to operational groups such as cluster, franchise region, or outlet group.
4. Grouping SHALL be workspace-scoped.
5. Group changes SHALL not rewrite historical order outlet IDs.
6. List APIs SHALL filter by region, city, and group.
7. Policy resolution MAY use group overrides.
8. Deleting a group SHALL not delete outlets.
## OM-R14: Service Capabilities

**Priority:** P0

**User Story / Intent:** Mendefinisikan layanan apa yang dapat diberikan outlet.

### Acceptance Criteria

1. Outlet SHALL expose service capability flags including pickup, delivery_future, dine_in_future, group_order_future, and preorder_future.
2. Pickup SHALL be independently enabled or disabled.
3. Disabled capability SHALL reject related new flows server-side.
4. Capabilities SHALL be versioned and audited.
5. Capabilities SHALL not imply operational status ACTIVE.
6. AI and customer channels SHALL consume authoritative capability data.
7. Future capabilities MAY be added without changing core outlet identity.
## OM-R15: Order Acceptance Policy

**Priority:** P0

**User Story / Intent:** Menentukan kapan outlet dapat menerima order baru.

### Acceptance Criteria

1. Order acceptance SHALL be derived from operational status, accepts_orders flag, pickup capability, current schedule, special closure, and blocking health policy.
2. Order acceptance SHALL return structured eligibility and reason codes.
3. Closed outlet MAY allow future preorder only when a future policy explicitly enables it.
4. Outlet SHALL be revalidated at cart confirmation and order creation.
5. UI/AI SHALL not override order acceptance.
6. Pause SHALL invalidate cached acceptance immediately.
7. Order acceptance evaluation SHALL use outlet timezone.
8. Existing orders SHALL not be silently cancelled when acceptance becomes false.
## OM-R16: Outlet Channel Assignment Policy

**Priority:** P0

**User Story / Intent:** Mengatur apakah outlet menerima chat/order dari channel yang sudah terkoneksi pada workspace.

### Acceptance Criteria

1. Outlet SHALL support assignment to existing workspace channel connections.
2. Assignment SHALL distinguish enabled_for_outlet, accepts_chats, accepts_orders, and routing_enabled.
3. Assignment SHALL not store provider credentials.
4. Connection credential, OAuth, webhook, and provider health SHALL remain owned by Channel Connections spec.
5. An outlet MAY use the same workspace channel as other outlets.
6. Disabling a channel for an outlet SHALL not disconnect the workspace connection.
7. Order requests from a disabled outlet-channel combination SHALL be rejected or rerouted according to policy.
8. Assignment changes SHALL be audited and cache-invalidating.
## OM-R17: Outlet AI Handling Policy

**Priority:** P1

**User Story / Intent:** Mengatur penggunaan default AI agent dan override outlet/channel secara opsional.

### Acceptance Criteria

1. Workspace default agent SHALL be used when no override exists.
2. Outlet MAY define an optional agent override.
3. Outlet-channel assignment MAY define a narrower optional agent override.
4. Resolution precedence SHALL be channel override, outlet override, workspace default.
5. Agent override SHALL reference an active agent in the same workspace.
6. Outlet SHALL be able to disable AI handling while retaining human handling.
7. AI policy SHALL not grant tool permissions beyond Scope Security and Tool Gateway.
8. Changes SHALL be audited.
## OM-R18: Regular Operating Hours

**Priority:** P0

**User Story / Intent:** Mendukung jadwal reguler mingguan per outlet.

### Acceptance Criteria

1. Outlet SHALL store zero or more intervals per day of week.
2. Intervals SHALL be interpreted in outlet timezone.
3. Overlapping intervals SHALL be rejected or normalized deterministically.
4. Closed-day configuration SHALL be explicit.
5. Overnight intervals SHALL be supported or rejected with a clear documented policy.
6. Hours updates SHALL use optimistic concurrency.
7. Hours SHALL be auditable.
8. Hours SHALL be available to AI, order acceptance, and admin UI through a normalized contract.
## OM-R19: Special Hours and Holiday Closures

**Priority:** P0

**User Story / Intent:** Mendukung pengecualian kalender terhadap jam reguler.

### Acceptance Criteria

1. Outlet SHALL support date-specific special opening intervals.
2. Outlet SHALL support full-day closure.
3. Special hours SHALL override regular hours.
4. Conflicting exceptions SHALL be rejected.
5. Each exception SHALL include reason and optional customer-facing note.
6. Bulk holiday templates MAY be applied through reviewed operations.
7. Expired exceptions SHALL remain in history but not affect current state.
8. Changes SHALL invalidate open-state caches.
## OM-R20: Computed Open State

**Priority:** P0

**User Story / Intent:** Menghasilkan status open/closed yang konsisten dan explainable.

### Acceptance Criteria

1. System SHALL compute `OPEN`, `CLOSED`, `OPENING_SOON`, `CLOSING_SOON`, or `UNKNOWN` from timezone, regular hours, and special hours.
2. Computed state SHALL include evaluated_at and next_transition_at when known.
3. Unknown schedule SHALL not be presented as open.
4. Fixed-clock tests SHALL cover daylight/timezone boundaries.
5. Open state SHALL not replace lifecycle or health state.
6. Customer-facing responses SHALL use authoritative computed state.
7. Caching SHALL expire at or before the next schedule transition.
## OM-R21: Preparation Time and Capacity Settings

**Priority:** P1

**User Story / Intent:** Mendukung estimasi operasional dan kesiapan outlet.

### Acceptance Criteria

1. Outlet SHALL support default preparation target minutes.
2. Outlet MAY support capacity state such as NORMAL, BUSY, VERY_BUSY, and PAUSED.
3. Capacity changes SHALL be manual or derived through an external operations/analytics contract.
4. Preparation target SHALL be bounded and validated.
5. Estimated preparation time SHALL not be fabricated by AI.
6. Order lifecycle MAY consume outlet preparation settings.
7. Changes SHALL be timestamped and auditable.
8. Future queue-aware routing MAY consume these settings.
## OM-R22: Canonical Location Integration

**Priority:** P0

**User Story / Intent:** Mengintegrasikan outlet dengan Location Intelligence tanpa menduplikasi geocoding.

### Acceptance Criteria

1. Outlet SHALL reference canonical verified location owned by Location Intelligence.
2. Outlet detail MAY expose safe location summary and Google Maps URI.
3. Create/update profile SHALL not persist arbitrary customer-supplied coordinates as canonical location.
4. Order acceptance MAY require verified location according to policy.
5. Nearest-outlet search SHALL use Location Intelligence, not outlet service calculations.
6. Location verification changes SHALL invalidate outlet summary caches.
7. Archive SHALL preserve historical location linkage.
8. Location permissions SHALL be enforced by relevant external contracts.
## OM-R23: Outlet Media and Image

**Priority:** P1

**User Story / Intent:** Mendukung profil visual outlet melalui Media Assets.

### Acceptance Criteria

1. Outlet SHALL reference media asset IDs rather than arbitrary storage paths.
2. Primary image SHALL be optional.
3. Image upload, validation, transformation, signed URL, and deletion SHALL be owned by Media Assets.
4. Outlet update SHALL validate asset workspace ownership.
5. Replacing an image SHALL not immediately delete an asset still referenced elsewhere.
6. Fallback placeholder SHALL be supported.
7. Public exposure SHALL follow media access policy.
## OM-R24: Tags, Labels, and Controlled Metadata

**Priority:** P1

**User Story / Intent:** Mendukung pengelompokan operasional tanpa schema chaos.

### Acceptance Criteria

1. Outlet MAY have workspace-scoped tags.
2. Tag assignment SHALL use controlled tag IDs.
3. Tags SHALL support filtering and bulk assignment.
4. Metadata keys SHALL be allowlisted or namespaced.
5. Sensitive secrets SHALL never be placed in metadata.
6. Tag changes SHALL be audited when used for operations.
7. Deleted tags SHALL not delete outlet records.
## OM-R25: Outlet List, Search, Filter, Sort, and Pagination

**Priority:** P0

**User Story / Intent:** Mendukung page Outlets dan operasional skala banyak cabang.

### Acceptance Criteria

1. List API SHALL support cursor or stable offset pagination.
2. List SHALL support search by name, code, city, manager summary, and address summary where indexed.
3. Filters SHALL include operational status, health status, region, city, channel assignment, manager, capability, open state, tags, and setup completeness.
4. Sorting SHALL include name, created_at, updated_at, status, city, last_order_at read-model, revenue read-model, and health priority where available.
5. Only authorized outlets SHALL be returned.
6. Filter combinations SHALL be deterministic.
7. Response SHALL include total/count metadata where feasible.
8. No-results and never-created empty states SHALL be distinguishable through metadata.
## OM-R26: Outlet Detail and Operational Summary

**Priority:** P0

**User Story / Intent:** Menyediakan satu read contract untuk drawer/detail outlet.

### Acceptance Criteria

1. Detail SHALL include canonical profile, lifecycle, health, capabilities, operating hours summary, channel assignment summary, manager/team summary, setup completeness, location summary, and safe metadata.
2. Detail MAY include recent metrics through Analytics read contracts.
3. Detail MAY include recent activity through Audit read contracts.
4. Detail SHALL not expose provider credentials or secrets.
5. Detail SHALL include version/ETag.
6. Detail SHALL distinguish unavailable external sections from zero values.
7. Detail SHALL respect outlet access.
## OM-R27: Bulk Outlet Actions

**Priority:** P1

**User Story / Intent:** Mendukung bulk activate, pause, assignment, tagging, and archive secara aman.

### Acceptance Criteria

1. Supported domain actions SHALL be explicitly allowlisted.
2. Bulk operations SHALL validate every outlet and permission.
3. Partial success SHALL return per-item outcomes.
4. Large operations SHALL use Admin Data Operations job orchestration.
5. Bulk lifecycle changes SHALL require reason and confirmation.
6. Idempotency SHALL prevent duplicate execution.
7. Cross-workspace IDs SHALL be rejected.
8. Bulk changes SHALL emit individual or correlated audit events.
## OM-R28: Import and Export Integration

**Priority:** P1

**User Story / Intent:** Mendukung export/import outlet tanpa menduplikasi generic data jobs.

### Acceptance Criteria

1. Outlet domain SHALL define exportable and importable fields.
2. Generic CSV/Excel/PDF job handling SHALL be owned by Admin Data Operations.
3. Export SHALL respect filters and access scope.
4. Secrets and internal-only metadata SHALL be excluded.
5. Import SHALL support preview, validation, duplicate detection, and row-level errors.
6. Import SHALL not auto-activate outlets unless explicitly approved.
7. Location and channel fields SHALL use external domain validation.
8. Export/import activity SHALL be audited.
## OM-R29: Audit and Activity Timeline Integration

**Priority:** P0

**User Story / Intent:** Memastikan semua perubahan penting dapat ditelusuri.

### Acceptance Criteria

1. Outlet operations SHALL emit structured audit events.
2. Events SHALL include workspace, outlet, actor, action, reason, correlation ID, timestamp, and safe before/after summary.
3. Audit storage and timeline query SHALL be owned by Audit Activity Timeline spec.
4. Activity feed SHALL support filters by action and date.
5. Secrets SHALL be redacted.
6. Failed commands SHALL not be represented as successful activity.
7. Events SHALL be immutable after persistence according to audit policy.
## OM-R30: Health and Attention Integration

**Priority:** P1

**User Story / Intent:** Menghubungkan outlet dengan alert dan attention engine.

### Acceptance Criteria

1. Outlet SHALL consume active alerts from Notification and Attention Engine.
2. Health reason codes SHALL map from current unresolved signals.
3. Acknowledging an alert SHALL not mutate lifecycle status unless policy commands it.
4. Resolved signals SHALL remove or downgrade health reasons.
5. UI SHALL receive attention count and highest severity.
6. Health aggregation SHALL be deterministic and versioned.
7. Outlet management SHALL not duplicate channel webhook monitoring logic.
## OM-R31: Analytics Read Model Integration

**Priority:** P1

**User Story / Intent:** Mendukung cards dan chart tanpa query transaksional berat.

### Acceptance Criteria

1. Outlet detail/list MAY consume read models for today orders, revenue, rating, staff count, average preparation time, and trend.
2. Analytics SHALL clearly expose data freshness and last updated time.
3. Zero SHALL be distinguishable from unavailable.
4. Outlet management SHALL not recompute large historical aggregates on every request.
5. Analytics access SHALL respect workspace and outlet authorization.
6. Analytics failure SHALL not prevent core outlet profile operations.
7. Time boundaries SHALL use outlet/workspace reporting policy.
## OM-R32: Operational Notifications

**Priority:** P1

**User Story / Intent:** Mengirim pemberitahuan untuk perubahan outlet yang penting.

### Acceptance Criteria

1. Events MAY trigger notifications for pause, resume, archive, assignment change, critical health, hours change, or order acceptance change.
2. Notification delivery SHALL be owned by notification infrastructure.
3. Notification recipients SHALL be resolved from access/team contracts.
4. Duplicate events SHALL not create duplicate notifications.
5. Notification failure SHALL not roll back a successful outlet mutation unless explicitly required.
6. User preferences and channel policy SHALL be respected.
## OM-R33: API Contracts and Error Model

**Priority:** P0

**User Story / Intent:** Menyediakan REST/API contract yang stabil untuk frontend dan AI tools.

### Acceptance Criteria

1. API SHALL use consistent success and error envelopes according to backend umbrella contract.
2. Error codes SHALL be stable and machine-readable.
3. Validation errors SHALL identify safe field paths.
4. List/detail/create/update/status/hours/channel-policy/manager operations SHALL be versionable.
5. Responses SHALL use ISO 8601 UTC timestamps and include timezone where relevant.
6. Internal stack traces SHALL not be exposed.
7. Deprecated fields SHALL have migration windows.
## OM-R34: Optimistic Concurrency and Idempotency

**Priority:** P0

**User Story / Intent:** Mencegah lost updates dan duplicate side effects.

### Acceptance Criteria

1. Mutations SHALL support version/ETag checks.
2. Status, hours, channel policy, manager, and archive changes SHALL fail on stale version.
3. Create, duplicate, lifecycle, and bulk commands SHALL support idempotency keys where side effects can repeat.
4. Idempotency storage SHALL be workspace-scoped.
5. Duplicate requests SHALL return the original result when safe.
6. Concurrent tests SHALL verify no lost update.
7. Event publication SHALL follow transaction/outbox reliability where required.
## OM-R35: Soft Delete, Archive, and Historical Retention

**Priority:** P0

**User Story / Intent:** Melindungi histori bisnis.

### Acceptance Criteria

1. Outlets with orders, payments, messages, or audit records SHALL not be hard-deleted through normal APIs.
2. Archive SHALL be the standard removal mechanism.
3. Archived outlets SHALL remain resolvable for historical records.
4. Personally sensitive fields SHALL follow retention policy while business references remain intact.
5. Restore SHALL be controlled and audited.
6. Physical deletion MAY occur only through an approved compliance/maintenance process.
7. Foreign-key behavior SHALL not cascade-delete historical commerce data.
## OM-R36: Security, Privacy, and Secret Handling

**Priority:** P0

**User Story / Intent:** Melindungi data tenant dan integrasi.

### Acceptance Criteria

1. Provider credentials SHALL never be stored in outlet records.
2. Outlet APIs SHALL redact private/internal metadata according to role.
3. Input SHALL be schema validated and size bounded.
4. Authorization SHALL be checked server-side for every operation.
5. Cross-workspace access SHALL be release-blocking.
6. Logs SHALL not contain secrets or unnecessary PII.
7. Rate limits SHALL protect sensitive mutations.
8. SSRF protection for Maps URL SHALL remain owned by Location Intelligence.
## OM-R37: Domain Events and Integration Contracts

**Priority:** P0

**User Story / Intent:** Membuat perubahan outlet dapat dikonsumsi domain lain secara konsisten.

### Acceptance Criteria

1. System SHALL define versioned events such as OutletCreated, OutletProfileUpdated, OutletStatusChanged, OutletOrderAcceptanceChanged, OutletHoursChanged, OutletChannelPolicyChanged, OutletManagerChanged, OutletArchived, and OutletRestored.
2. Events SHALL carry workspace_id, outlet_id, event_id, occurred_at, version, actor, and correlation_id.
3. Events SHALL not contain provider secrets.
4. Consumers SHALL be idempotent.
5. Event schema changes SHALL be backward compatible or versioned.
6. Failed publication SHALL be retriable without repeating mutation.
7. Events SHALL invalidate relevant caches/read models.
## OM-R38: Cache and Invalidation

**Priority:** P1

**User Story / Intent:** Meningkatkan performa tanpa menjadikan cache source of truth.

### Acceptance Criteria

1. Cache MAY store list summaries, detail summaries, computed open state, setup completeness, and order acceptance eligibility.
2. Cache keys SHALL be workspace and outlet scoped.
3. Mutations SHALL invalidate related caches after commit.
4. Open-state cache SHALL expire before next transition.
5. Cache failure SHALL fall back safely to source data.
6. Stale cache SHALL not keep a paused outlet order-eligible.
7. Cache behavior SHALL be observable and testable.
## OM-R39: Observability and Operational Monitoring

**Priority:** P0

**User Story / Intent:** Menyediakan trace, metric, dan health yang cukup.

### Acceptance Criteria

1. Operations SHALL emit structured logs and traces with correlation IDs.
2. Metrics SHALL include create/update/status change latency, list latency, conflict count, authorization denials, archive count, cache hit, and health evaluation failures.
3. High-cardinality PII SHALL not be metric labels.
4. Critical failures SHALL alert operators.
5. Provider/external dependency failures SHALL be distinguishable.
6. Audit, trace, and analytics SHALL not be conflated.
7. Runbook SHALL document common incidents.
## OM-R40: Testing and Quality Assurance

**Priority:** P0

**User Story / Intent:** Mewajibkan TDD dan lapisan test lengkap.

### Acceptance Criteria

1. Implementation SHALL follow RED-GREEN-REFACTOR-VERIFY.
2. Unit, component, integration, API, security, property, concurrency, resilience, performance, and migration tests SHALL be provided where applicable.
3. Tests SHALL use Supabase/Postgres-compatible fixtures and not add new Mongoose dependencies.
4. Critical authorization, lifecycle, order acceptance, and concurrency tests SHALL block release.
5. External contracts SHALL use fakes or contract tests.
6. Production data and secrets SHALL be forbidden in tests.
7. Skipped critical tests SHALL not be accepted.
## OM-R41: Legacy Migration and Compatibility

**Priority:** P0

**User Story / Intent:** Memigrasikan outlet legacy ke canonical Supabase model tanpa membawa data test yang tidak penting.

### Acceptance Criteria

1. Current legacy model and routes SHALL be audited before changes.
2. Approved strategy SHALL use fresh Supabase data unless explicitly changed.
3. No new Mongoose dependency SHALL be introduced.
4. Legacy API fields MAY be supported temporarily through mappers.
5. Migration SHALL be idempotent.
6. Legacy status values SHALL map deterministically to new lifecycle states.
7. Compatibility adapters SHALL have removal criteria.
8. Implementation status SHALL reflect repository reality rather than unchecked claims.
## OM-R42: Admin UI State Support

**Priority:** P1

**User Story / Intent:** Menyediakan backend state untuk seluruh desain page Outlets dan popup.

### Acceptance Criteria

1. Backend SHALL support main list, selected detail drawer, add outlet, edit outlet, export, advanced filters, bulk selection, action menu, pause/archive confirmation, channel settings, operating hours, activity, empty state, no-results state, loading, partial failure, and stale-version conflict.
2. UI state SHALL be derived from structured status and capability fields, not text parsing.
3. Buttons SHALL receive permission/capability hints where safe.
4. Disabled reasons SHALL be machine-readable.
5. Empty workspace and filtered-empty states SHALL be distinguishable.
6. Async jobs SHALL expose progress/status through external job contract.
7. UI SHALL not infer operational eligibility from badge color alone.
## OM-R43: Localization, Timezone, and Formatting

**Priority:** P1

**User Story / Intent:** Menjamin waktu dan label konsisten lintas kota Indonesia.

### Acceptance Criteria

1. Outlet SHALL store IANA timezone.
2. Internal timestamps SHALL be UTC.
3. Business schedule SHALL evaluate in outlet timezone.
4. API SHALL expose canonical codes and localized display labels separately.
5. Phone/address formatting SHALL be locale-aware but canonical data SHALL remain structured.
6. Future multi-language labels SHALL not require schema redesign.
7. Timezone changes SHALL be validated and audited.
## OM-R44: Scalability and Performance

**Priority:** P1

**User Story / Intent:** Mendukung banyak workspace dan outlet tanpa rewrite.

### Acceptance Criteria

1. List queries SHALL use appropriate indexes and bounded pagination.
2. Filter/sort combinations SHALL be profiled.
3. Expensive analytics SHALL use read models.
4. Bulk operations SHALL be bounded or asynchronous.
5. Health evaluation SHALL avoid N+1 provider calls.
6. Operating-hours computation SHALL be efficient and cacheable.
7. Performance baselines SHALL be documented for expected outlet counts.
8. No hard-coded single-workspace or single-brand assumption SHALL exist in domain logic.
## OM-R45: Backup, Recovery, and Operational Readiness

**Priority:** P1

**User Story / Intent:** Memastikan perubahan outlet dapat dipulihkan dan dioperasikan.

### Acceptance Criteria

1. Database migrations SHALL have rollback or forward-fix plans.
2. Canonical outlet data SHALL be included in backup strategy.
3. Archive/restore and accidental status changes SHALL have operational procedures.
4. Runbook SHALL cover stuck status, wrong hours, failed cache invalidation, broken channel assignment, missing location, and access incidents.
5. Release SHALL define monitoring and rollback criteria.
6. Production configuration SHALL be documented and secret-safe.
7. Disaster recovery tests SHOULD verify outlet data restoration.


# Global Correctness Properties

1. For any outlet mutation, workspace context and authorization must be verified server-side.
2. For any archived outlet, historical orders and payments remain readable by authorized users.
3. For any PAUSED or ARCHIVED outlet, new order acceptance is false.
4. For any channel disabled for an outlet, disabling does not disconnect the workspace provider connection.
5. For any schedule calculation, evaluation uses the outlet IANA timezone and UTC storage.
6. For any outlet location displayed as verified, data comes from Location Intelligence.
7. For any stale version mutation, no partial update occurs.
8. For any bulk command, every item result is independently traceable.
9. For any outlet activity record, secrets and provider credentials are absent.
10. For any filtered list, returned outlets are a subset of the caller's authorized scope.

# Definition of Done

A requirement is complete only when:

- acceptance criteria are implemented;
- tests are written first and pass;
- authorization and workspace isolation pass;
- optimistic concurrency is verified;
- required audit events are emitted;
- cache invalidation is covered;
- external-domain contracts are used instead of duplicated;
- API documentation is updated;
- implementation status reflects repository reality;
- `npm run specs:check` passes.
