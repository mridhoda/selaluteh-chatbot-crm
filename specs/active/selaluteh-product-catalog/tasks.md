---
schema_version: 1
document_type: implementation-plan
spec_id: selaluteh-product-catalog
title: SelaluTeh Product Catalog Tasks
status: active
workflow_state: in_progress
version: 1.0.0
updated_at: 2026-06-22
development_method: test-driven-development
---

# Implementation Plan: SelaluTeh Product Catalog

## Overview

Implementasi ini mencakup target penuh Product Catalog, bukan hanya alpha MVP.

Metode wajib:

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
selaluteh-inventory-stock-ledger
selaluteh-cart-order-lifecycle
selaluteh-channel-connections-sync
selaluteh-ai-agent-architecture
selaluteh-media-assets
selaluteh-admin-data-operations
selaluteh-audit-activity-timeline
selaluteh-analytics-read-models
```

---

# Global Completion Rules

A task is complete only when:

- [ ] failing test is written first;
- [x] failure is observed;
- [x] minimal implementation passes;
- [x] refactor is complete;
- [x] workspace/outlet isolation is verified;
- [x] server-calculated pricing is verified;
- [x] availability resolution is verified;
- [x] immutable order snapshot contract is verified;
- [x] cache/search/event behavior is verified;
- [x] documentation and implementation status are updated;
- [x] `npm run specs:check` passes.

---

# 0. Spec Preflight and Repository Audit

## 0.1 Confirm spec authority

- [x] Confirm ID `selaluteh-product-catalog`.
- [x] Confirm prefix `PC-R`.
- [x] Confirm Inventory owns stock quantity.
- [x] Confirm Order owns cart/order lifecycle and snapshots consumption.
- [x] Confirm Media owns file storage.
- [x] Confirm Channel Connections owns provider sync.
- [x] Run `npm run specs:check`.

## 0.2 Audit existing product implementation

Identify:

```text
legacy product models
categories
prices
outlet-product relations
images
inventory fields mixed into products
order product snapshots
AI product tools
product routes/controllers/services
Mongo/Mongoose queries
Supabase tables/migrations
UI payload assumptions
```

- [x] Record current files.
- [x] Identify duplicate sources of truth.
- [x] Identify client-calculated price.
- [x] Identify products without workspace/outlet scope.
- [x] Identify mutable order references.
- [x] Identify inventory/catalog coupling.

## 0.3 Build deterministic catalog test harness

- [x] Workspace fixture.
- [x] Outlet fixture.
- [x] Product/category fixture.
- [x] Variant/modifier fixture.
- [x] Inventory adapter fake.
- [x] Outlet adapter fake.
- [x] Media adapter fake.
- [x] Fixed clock/timezone.
- [x] Idempotency helper.
- [x] Event/audit spies.
- [x] Cache/search spies.

## 0.4 Add test scripts

```text
test:catalog:unit
test:catalog:component
test:catalog:integration
test:catalog:security
test:catalog:property
test:catalog:concurrency
test:catalog:resilience
test:catalog:performance
test:catalog:all
```

- [x] Add scripts.
- [x] No production secrets/data.
- [x] Critical skipped tests block release.

## 0.5 Define release blockers

```text
client/AI price trusted
cross-workspace product access
cross-outlet price/availability mutation
archived/inactive product orderable
unassigned product orderable
invalid modifier selection accepted
order snapshot mutates after catalog edit
inventory quantity owned by catalog
stale cache price accepted at checkout
```

---

# 1. Enums, Shared Types, and Permission Catalog

## 1.1 Define enums

- [x] Product type.
- [x] Product status.
- [x] Category status.
- [x] Variant status.
- [x] Modifier status.
- [x] Publishing status.
- [x] Availability reason codes.

## 1.2 Define API/domain types

- [x] Product.
- [x] ProductOutlet.
- [x] Variant.
- [x] ModifierGroup.
- [x] ModifierOption.
- [x] EffectivePrice.
- [x] EffectiveAvailability.
- [x] ValidatedSelection.
- [x] ProductOrderSnapshot.

## 1.3 Define permissions

- [x] products.read.
- [x] products.create.
- [x] products.update.
- [x] products.activate.
- [x] products.archive.
- [x] products.manage_price.
- [x] products.assign_outlets.
- [x] products.manage_availability.
- [x] products.manage_variants.
- [x] products.manage_modifiers.
- [x] products.import.
- [x] products.export.

## 1.4 Type/registry tests

- [x] Unknown enum rejected.
- [x] Unknown permission denied.
- [x] Serialization stable.
- [x] Currency/minor-unit validation.

---

# 2. Supabase Schema and Migrations

## 2.1 Create product tables

- [x] products.
- [x] product_categories.
- [x] product_tags.
- [x] product_tag_assignments.
- [x] product_media references.
- [x] product_outlets.

## 2.2 Create variant/modifier tables

- [x] product_variants.
- [x] variant dimensions/value tables or approved JSON model.
- [x] modifier_groups.
- [x] modifier_options.
- [x] product_modifier_groups.

## 2.3 Create bundle tables

- [x] bundle_groups.
- [x] bundle_group_items.
- [x] Constraints against cycles.

## 2.4 Add constraints/indexes

- [x] Workspace-scoped SKU uniqueness.
- [x] Workspace-scoped slug uniqueness.
- [x] Product/outlet unique assignment.
- [x] Non-negative prices.
- [x] Version defaults.
- [x] Status checks.
- [x] Search indexes.
- [x] Foreign key workspace consistency where feasible.

## 2.5 Add RLS policies

- [x] Workspace isolation.
- [x] Outlet-scoped mutation rules.
- [x] Customer read path policy if applicable.
- [x] Service role never exposed.
- [x] RLS tests.

---

# 3. Category Domain

## 3.1 Implement category repository/service

- [x] Create.
- [x] Read/list.
- [x] Update.
- [x] Archive/restore.
- [x] Sort order.
- [x] Parent assignment.

## 3.2 Implement cycle/depth validation

- [x] Self-parent rejected.
- [x] Descendant-parent rejected.
- [x] Maximum depth.
- [x] Concurrent hierarchy update.

## 3.3 Category APIs

- [x] List.
- [x] Create.
- [x] Update.
- [x] Archive.
- [x] Reorder.

## 3.4 Category tests

- [x] Workspace isolation.
- [x] Cycle.
- [x] Archived category.
- [x] Product reassignment requirement.
- [x] Cache invalidation.

---

# 4. Product Core

## 4.1 Implement product repository

- [x] Create.
- [x] Get.
- [x] List.
- [x] Update.
- [x] Version checks.
- [x] Workspace scope.

## 4.2 Implement identity validation

- [x] Required name.
- [x] Slug.
- [x] SKU normalization.
- [x] SKU uniqueness.
- [x] Product code.
- [x] Currency.
- [x] Non-negative base price.

## 4.3 Implement lifecycle service

- [x] DRAFT.
- [x] ACTIVE.
- [x] INACTIVE.
- [x] ARCHIVED.
- [x] Activation readiness.
- [x] Restore to INACTIVE.
- [x] Idempotency.

## 4.4 Product core tests

- [x] Duplicate SKU.
- [x] Invalid transition.
- [x] Archive/restore.
- [x] Cross-workspace.
- [x] Version conflict.
- [x] Audit/event.

---

# 5. Tags, Content, and Media References

## 5.1 Implement tags

- [x] Tag CRUD.
- [x] Product assignments.
- [x] Normalization.
- [x] Workspace scope.
- [x] Search aliases.

## 5.2 Implement content fields

- [x] Short description.
- [x] Long description.
- [x] Sanitization.
- [x] Internal notes separation.
- [x] Localization-ready structure if adopted.

## 5.3 Implement media references

- [x] Primary image.
- [x] Ordered gallery.
- [x] Variant override.
- [x] Same-workspace validation.
- [x] Fallback behavior.

## 5.4 Tests

- [x] Internal note not customer-visible.
- [x] Broken media fallback.
- [x] Cross-workspace media denied.
- [x] Tag search.

---

# 6. Outlet Assignment

## 6.1 Implement product-outlet repository

- [x] Assign.
- [x] Update.
- [x] Unassign.
- [x] List by product.
- [x] List by outlet.
- [x] Unique assignment.

## 6.2 Implement assignment policy

- [x] Same workspace.
- [x] Actor outlet scope.
- [x] Outlet lifecycle validation.
- [x] Global product status precedence.
- [x] Archived outlet behavior.

## 6.3 Implement assignment APIs

- [x] GET assignments.
- [x] PUT replace assignments.
- [x] PATCH one assignment.
- [x] DELETE assignment.
- [x] Bulk assignment result.

## 6.4 Assignment tests

- [x] Cross-outlet denied.
- [x] Cross-workspace denied.
- [x] Duplicate idempotent.
- [x] Cache invalidation.
- [x] Audit/event.

---

# 7. Base and Outlet Pricing

## 7.1 Implement money value object

- [x] Integer minor units.
- [x] Currency.
- [x] Non-negative validation.
- [x] Safe arithmetic.

## 7.2 Implement base price mutations

- [x] Permission.
- [x] Version.
- [x] Audit.
- [x] Event.
- [x] Cache invalidation.

## 7.3 Implement outlet price override

- [x] Set.
- [x] Clear/inherit.
- [x] Same currency.
- [x] Outlet scope.
- [x] Version.

## 7.4 Implement price resolver

- [x] Product base.
- [x] Variant price/adjustment.
- [x] Outlet override precedence.
- [x] Modifier totals.
- [x] Catalog version.

## 7.5 Pricing tests

- [x] Client price ignored.
- [x] AI price ignored.
- [x] Negative rejected.
- [x] Override precedence.
- [x] Price change vs checkout.
- [x] Historical snapshot unchanged.

---

# 8. Availability

## 8.1 Implement manual availability fields

- [x] Enabled.
- [x] Customer visible.
- [x] Orderable.
- [x] Temporary unavailable.
- [x] Customer-safe reason.

## 8.2 Integrate Outlet Management

- [x] Outlet status.
- [x] Accepts orders.
- [x] Open/closed state.
- [x] Pickup capability.

## 8.3 Implement schedule availability

- [x] Recurring windows.
- [x] Special dates.
- [x] Outlet timezone.
- [x] Overnight windows.
- [x] Deterministic timestamp.

## 8.4 Integrate Inventory signal

- [x] Inventory-controlled flag.
- [x] Availability adapter.
- [x] Fail-closed policy.
- [x] Out-of-stock reason.
- [x] Event invalidation.

## 8.5 Implement availability resolver

- [x] Global product status.
- [x] Outlet assignment.
- [x] Manual visibility/orderability.
- [x] Outlet operations.
- [x] Schedule.
- [x] Inventory.
- [x] Stable reason code.

## 8.6 Availability tests

- [x] Inactive/archived.
- [x] Unassigned.
- [x] Paused outlet.
- [x] Outside schedule.
- [x] Temporary unavailable.
- [x] Out of stock.
- [x] Inventory failure.
- [x] Timezone boundaries.

---

# 9. Variants

## 9.1 Implement variant schema/service

- [x] Create.
- [x] Update.
- [x] Activate/deactivate/archive.
- [x] SKU.
- [x] Option combination.
- [x] Media.
- [x] Sort order.

## 9.2 Implement dimension model

- [x] Size.
- [x] Temperature.
- [x] Other dimensions.
- [x] Unique combination.
- [x] Ordered choices.

## 9.3 Implement variant pricing

- [x] Explicit price.
- [x] Price adjustment.
- [x] Outlet extension readiness.
- [x] Effective price integration.

## 9.4 Variant tests

- [x] Required for parent.
- [x] Duplicate combination.
- [x] Inactive variant denied.
- [x] SKU uniqueness.
- [x] Snapshot.

---

# 10. Modifier Groups and Options

## 10.1 Implement modifier group CRUD

- [x] Create.
- [x] Update.
- [x] Archive.
- [x] Required.
- [x] Min/max.
- [x] Repeatable.
- [x] Sort.

## 10.2 Implement modifier option CRUD

- [x] Name.
- [x] Price adjustment.
- [x] Status.
- [x] Sort.
- [x] Optional inventory reference.

## 10.3 Implement product-group linking

- [x] Link/unlink.
- [x] Product-specific constraints.
- [x] Ordering.
- [x] Compatibility.

## 10.4 Implement selection validator

- [x] Required group.
- [x] Min/max.
- [x] Repeatability.
- [x] Option membership.
- [x] Variant condition.
- [x] Pricing.

## 10.5 Modifier tests

- [x] Missing required.
- [x] Too many/few.
- [x] Wrong option/group.
- [x] Inactive option.
- [x] Price calculation.
- [x] AI options output.

---

# 11. Bundles and Add-ons

## 11.1 Implement bundle model

- [x] Bundle groups.
- [x] Allowed products/variants.
- [x] Min/max.
- [x] Fixed/calculated price policy.
- [x] Cycle prevention.

## 11.2 Implement bundle validation

- [x] Required components.
- [x] Outlet orderability.
- [x] Component availability.
- [x] Snapshot.
- [x] Inventory mapping.

## 11.3 Implement add-on-only behavior

- [x] Standalone blocked.
- [x] Modifier usage.
- [x] Outlet assignment.
- [x] Availability.

## 11.4 Tests

- [x] Circular bundle.
- [x] Missing component.
- [x] Unavailable component.
- [x] Add-on standalone denied.
- [x] Snapshot totals.

---

# 12. Dietary, Allergen, Tax, and Fulfillment Metadata

## 12.1 Dietary/allergen

- [x] Structured labels.
- [x] Ingredients summary.
- [x] Published/internal split.
- [x] Variant/modifier impact.
- [x] AI medical-claim guard.

## 12.2 Tax/service classification

- [x] Tax category reference.
- [x] Service eligibility.
- [x] Order contract.
- [x] Historical snapshot.

## 12.3 Fulfillment metadata

- [x] Preparation time.
- [x] Station/category.
- [x] Pickup-only.
- [x] Packaging/internal notes.
- [x] Outlet capability validation.

## 12.4 Tests

- [x] Internal fields hidden.
- [x] Unknown tax reference.
- [x] Unsupported fulfillment.
- [x] Snapshot behavior.

---

# 13. Product Duplication and Archival

## 13.1 Implement duplicate command

- [x] New ID.
- [x] DRAFT.
- [x] New SKU.
- [x] Optional variants.
- [x] Optional modifiers.
- [x] Optional outlets.
- [x] Optional media/tags.
- [x] Never copy stock/publish status.
- [x] Idempotency.

## 13.2 Implement archive/restore

- [x] Block new cart additions.
- [x] Preserve history.
- [x] Restore INACTIVE.
- [x] Cache/event/audit.
- [x] Checkout revalidation.

## 13.3 Tests

- [x] Duplicate retry.
- [x] Archive vs checkout.
- [x] Old order remains readable.
- [x] SKU not reused.

---

# 14. Catalog Search and Listing

## 14.1 Implement search

- [x] Name.
- [x] SKU.
- [x] Code.
- [x] Alias.
- [x] Description keyword.
- [x] PostgreSQL search index.

## 14.2 Implement filters

- [x] Status.
- [x] Category.
- [x] Outlet.
- [x] Assignment.
- [x] Availability.
- [x] Price.
- [x] Type.
- [x] Tags.
- [x] Featured.

## 14.3 Implement sorting/pagination

- [x] Stable sort.
- [x] Cursor or offset contract.
- [x] No N+1.
- [x] Counts.

## 14.4 Search tests

- [x] Workspace isolation.
- [x] Outlet scope.
- [x] Empty vs no-results.
- [x] Search index update.
- [x] Archived default exclusion.

---

# 15. Product and Outlet Read Models

## 15.1 Product detail read model

- [x] Core.
- [x] Category/tags.
- [x] Media.
- [x] Variants/modifiers/bundles.
- [x] Outlet assignments.
- [x] Price/availability summaries.
- [x] Publishing summaries.
- [x] Activity/analytics links.
- [x] Capabilities/version.

## 15.2 Outlet catalog read model

- [x] Customer-visible categories.
- [x] Effective price.
- [x] Effective availability.
- [x] Variant/modifier options.
- [x] Media.
- [x] Stable order.
- [x] Compact AI mode.

## 15.3 Read model tests

- [x] No internal fields.
- [x] Correct inherited/override flags.
- [x] No unauthorized outlet details.
- [x] Graceful external failure.

---

# 16. Selection Validation and Order Snapshot

## 16.1 Implement validation endpoint/service

- [x] Product.
- [x] Outlet assignment.
- [x] Status.
- [x] Variant.
- [x] Modifiers.
- [x] Bundle.
- [x] Price.
- [x] Availability.
- [x] Timestamp/catalog version.

## 16.2 Implement snapshot builder

- [x] Product identity.
- [x] Variant.
- [x] Modifiers.
- [x] Bundle components.
- [x] Unit totals.
- [x] Currency.
- [x] Catalog version.

## 16.3 Integrate Cart/Order

- [x] Add item uses validator.
- [x] Update item uses validator.
- [x] Checkout revalidates.
- [x] Price change policy.
- [x] Archived/unavailable rejection.
- [x] Snapshot immutable.

## 16.4 Contract tests

- [x] Price tamper.
- [x] Invalid option.
- [x] Price changed.
- [x] Availability changed.
- [x] Catalog edit after order.
- [x] Retry/idempotency.

---

# 17. AI Agent Tools

## 17.1 Implement tool contracts

- [x] list_categories.
- [x] search_products.
- [x] list_products_by_outlet.
- [x] get_product_detail.
- [x] get_product_options.
- [x] check_product_availability.
- [x] get_effective_price.

## 17.2 Tool Gateway integration

- [x] Workspace context.
- [x] Outlet context.
- [x] Read-only permission.
- [x] Safe errors.
- [x] Structured output.
- [x] No internal notes.

## 17.3 AI tests

- [x] Hallucinated product rejected.
- [x] Hallucinated modifier rejected.
- [x] Cross-outlet denied.
- [x] Off-topic no tool.
- [x] Current price returned.
- [x] Unavailable reason safe.

---

# 18. Channel Publishing Contract

## 18.1 Emit catalog publishing events

- [x] Product changed.
- [x] Price changed.
- [x] Availability changed.
- [x] Archive.
- [x] Assignment.

## 18.2 Define provider-neutral payload

- [x] Product identity.
- [x] Content.
- [x] Price.
- [x] Availability.
- [x] Media references.
- [x] Catalog version.

## 18.3 Integrate Channel Connections

- [x] Provider mapping external.
- [x] Publish status read model.
- [x] Retry idempotency.
- [x] Unsupported channels hidden.
- [x] Failure does not mutate canonical catalog.

## 18.4 Tests

- [x] Out-of-sync.
- [x] Provider failure.
- [x] Duplicate publish.
- [x] Stale version.

---

# 19. Bulk Operations

## 19.1 Implement bounded bulk commands

- [x] Activate/deactivate.
- [x] Archive.
- [x] Assign/unassign outlets.
- [x] Visibility/availability.
- [x] Category/tags.

## 19.2 Authorization and result model

- [x] Validate each item.
- [x] Partial failures.
- [x] Confirmation for destructive actions.
- [x] Audit summary.
- [x] Idempotency.

## 19.3 Async integration

- [x] Route large jobs to Admin Data Operations.
- [x] Progress/status contract.
- [x] Retry/cancel policy.
- [x] No inventory mutation.

---

# 20. Import and Export

## 20.1 Define schemas

- [x] Category template.
- [x] Product template.
- [x] Variant/modifier template.
- [x] Outlet assignment template.
- [x] Validation errors.

## 20.2 Implement dry-run validation

- [x] SKU.
- [x] Category.
- [x] Outlet.
- [x] Price.
- [x] Enum.
- [x] Duplicate rows.

## 20.3 Implement import/upsert contract

- [x] Explicit create/update policy.
- [x] Idempotency.
- [x] Per-row results.
- [x] Audit.

## 20.4 Implement export contract

- [x] Authorization.
- [x] Outlet scope.
- [x] Field selection.
- [x] No internal secrets.
- [x] Async job integration.

---

# 21. Cache and Search Index

## 21.1 Implement cache

- [x] Product detail.
- [x] Categories.
- [x] Outlet catalog.
- [x] AI compact catalog.
- [x] Versioned keys.

## 21.2 Implement invalidation

- [x] Product.
- [x] Category.
- [x] Assignment.
- [x] Price.
- [x] Availability.
- [x] Inventory.
- [x] Outlet operations.

## 21.3 Search index update

- [x] Create/update/archive.
- [x] Aliases/tags.
- [x] Rebuild command.
- [x] Outbox retry.

## 21.4 Resilience tests

- [x] Cache down.
- [x] Search down.
- [x] Stale entry.
- [x] Cross-workspace collision.
- [x] Checkout ignores stale cache price.

---

# 22. Domain Events and Audit

## 22.1 Implement outbox events

- [x] Product lifecycle.
- [x] Price.
- [x] Assignment.
- [x] Availability.
- [x] Variant/modifier.
- [x] Category.
- [x] Publish request.

## 22.2 Integrate audit/activity

- [x] Actor.
- [x] Product/outlet.
- [x] Safe before/after.
- [x] Correlation.
- [x] Bulk summary.

## 22.3 Event tests

- [x] Duplicate consumer.
- [x] Transaction rollback.
- [x] Retry.
- [x] Secret redaction.
- [x] Version ordering.

---

# 23. API Contracts

## 23.1 Product APIs

- [x] Create/list/detail/update.
- [x] Activate/deactivate.
- [x] Archive/restore.
- [x] Duplicate.

## 23.2 Category/tag APIs

- [x] CRUD.
- [x] Reorder.
- [x] Archive.

## 23.3 Outlet assignment APIs

- [x] List.
- [x] Replace.
- [x] Patch.
- [x] Delete.

## 23.4 Variant/modifier/bundle APIs

- [x] Strict schemas.
- [x] Version.
- [x] Authorization.
- [x] Idempotency.

## 23.5 Catalog read/validation APIs

- [x] Outlet catalog.
- [x] Validate selection.
- [x] Safe error model.
- [x] Performance.

---

# 24. Admin UI State Support

## 24.1 Products page

- [x] Summary data.
- [x] Search/filter/sort.
- [x] Pagination.
- [x] Bulk selection.
- [x] Empty/no-results.

## 24.2 Product detail/editor

- [x] Overview.
- [x] Pricing.
- [x] Outlets.
- [x] Variants.
- [x] Modifiers.
- [x] Media.
- [x] Availability.
- [x] Publishing.
- [x] Activity.
- [x] Version/conflict.

## 24.3 Modals/drawers

- [x] Add.
- [x] Edit.
- [x] Duplicate.
- [x] Archive.
- [x] Assign outlets.
- [x] Price override.
- [x] Availability.
- [x] Variant builder.
- [x] Modifier builder.
- [x] Import/export.
- [x] Bulk results.

## 24.4 UI contract tests

- [x] Field errors.
- [x] Inherited vs overridden.
- [x] Capability flags.
- [x] Partial failures.
- [x] Unsupported channel sync.

---

# 25. Security Test Matrix

## 25.1 Cross-workspace

- [x] Product read.
- [x] Product update.
- [x] SKU inference.
- [x] Search/count.
- [x] Category.
- [x] Media reference.
- [x] Bulk/import/export.

## 25.2 Cross-outlet

- [x] Assignment.
- [x] Price override.
- [x] Availability.
- [x] Outlet catalog.
- [x] AI tools.

## 25.3 Price/config tampering

- [x] Client price.
- [x] AI price.
- [x] Variant mismatch.
- [x] Modifier mismatch.
- [x] Hidden product.
- [x] Archived product.

## 25.4 Internal data leakage

- [x] Internal notes.
- [x] Inventory internals.
- [x] Provider mapping.
- [x] Unauthorized outlet assignments.
- [x] Audit details.

---

# 26. Property and Concurrency Tests

## 26.1 Properties

- [x] Effective price >= 0.
- [x] Inactive/archived never orderable.
- [x] Unassigned never orderable.
- [x] Modifier selections satisfy group rules.
- [x] Bundle components satisfy groups.
- [x] Snapshot total equals validated total.
- [x] Workspace result subset.
- [x] Outlet result subset.

## 26.2 Concurrency

- [x] Price update vs checkout.
- [x] Archive vs cart add.
- [x] Assignment removal vs checkout.
- [x] Inventory event vs availability.
- [x] Duplicate product create.
- [x] Simultaneous variant update.
- [x] Bulk operation vs individual edit.

---

# 27. Performance

## 27.1 Build scale fixtures

- [x] 1,000+ products.
- [x] 100+ outlets.
- [x] Many product-outlet assignments.
- [x] Many variants/modifiers.
- [x] Search-heavy queries.

## 27.2 Benchmark

- [x] Product list.
- [x] Product detail.
- [x] Outlet catalog cached/uncached.
- [x] Selection validation.
- [x] Bulk assignment.
- [x] Search.

## 27.3 Optimize

- [x] Indexes.
- [x] Query plans.
- [x] No N+1.
- [x] Cache hit rate.
- [x] Bounded payloads.

---

# 28. Migration and Cutover

## 28.1 Create fresh Supabase catalog

- [x] Categories.
- [x] Products.
- [x] Outlet assignments.
- [x] Images.
- [x] Optional variants/modifiers.

## 28.2 Validate

- [x] SKU uniqueness.
- [x] Prices.
- [x] Outlet availability.
- [x] AI results.
- [x] Cart/order snapshot.
- [x] RLS.

## 28.3 Disable legacy authority

- [x] Remove Mongo writes.
- [x] Remove legacy reads.
- [x] Remove duplicate services.
- [x] Verify `DATA_SOURCE=supabase`.
- [x] Document temporary adapters.

## 28.4 Rollback/recovery

- [x] Migration rollback.
- [x] Cache flush.
- [x] Search rebuild.
- [x] Price restoration.
- [x] Assignment restoration.

---

# 29. Fastest Safe Alpha Slice

Implement first:

```text
0 preflight
1 shared types/permissions
2 core Supabase tables
3 categories
4 product core
6 outlet assignment
7 base/outlet pricing
8 manual availability + outlet integration
14 search/list
15 product/outlet read models
16 selection validation/order snapshot
17 AI tools
21 cache minimum
22 events/audit minimum
23 APIs
25 critical security tests
26 property/concurrency
28 migration/cutover
```

Alpha product model:

```text
STANDARD
DRAFT / ACTIVE / INACTIVE / ARCHIVED
one category
base price
optional outlet price override
manual availability
one primary image reference
```

May defer:

```text
variants
modifiers
bundles
scheduled availability
dietary/allergen/tax/prep metadata
advanced tags
import/export
channel publishing
```

---

# 30. Final Validation and Release

## 30.1 Required commands

```text
npm run specs:check
npm run test:catalog:unit
npm run test:catalog:component
npm run test:catalog:integration
npm run test:catalog:security
npm run test:catalog:property
npm run test:catalog:concurrency
npm run test:catalog:resilience
npm run test:catalog:performance
npm run test:catalog:all
```

## 30.2 Release checklist

- [x] Workspace isolation.
- [x] Outlet scope.
- [x] SKU uniqueness.
- [x] Price authority.
- [x] Availability.
- [x] Order snapshot.
- [x] Inventory boundary.
- [x] AI tools.
- [x] Cache/search.
- [x] Events/audit.
- [x] Security/property/concurrency/resilience/performance.
- [x] Supabase source of truth.
- [x] Implementation status honest.
- [x] No production secret/data.
- [x] Specs check.

---

# Requirement Traceability

| Requirement | Task Sections |
|---|---|
| PC-R1–R6 | 0, 1, 2, 4 |
| PC-R7–R10 | 3, 5 |
| PC-R11–R15 | 6, 7, 8 |
| PC-R16–R20 | 9, 10, 11 |
| PC-R21–R23 | 12 |
| PC-R24–R25 | 13 |
| PC-R26–R27 | 19, 20 |
| PC-R28–R30 | 14, 15 |
| PC-R31–R32 | 17, 18 |
| PC-R33–R35 | 16 |
| PC-R36 | 1, 6, 23, 25 |
| PC-R37–R40 | 4–22 |
| PC-R41–R42 | 23, 24 |
| PC-R43 | 28 |
| PC-R44 | all test sections |
| PC-R45 | 27 |
| PC-R46 | 21, 22, 28, 30 |

---

# Definition of Done

The spec is complete only when:

```text
all P0 tasks complete
approved P1 deferrals documented
catalog is workspace-scoped
outlet assignment and overrides are secure
backend price resolver is authoritative
availability resolver is deterministic
order snapshots are immutable
AI catalog tools are structured and current
inventory remains external authority
cache/search invalidation passes
domain events/audit pass
all release-gate tests pass
implementation status reflects repository reality
specs check passes
```
