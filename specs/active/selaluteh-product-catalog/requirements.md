---
schema_version: 1
document_type: requirements
spec_id: selaluteh-product-catalog
title: SelaluTeh Product Catalog Requirements
status: active
workflow_state: in_progress
version: 1.0.0
updated_at: 2026-06-22
---

# Requirements Document: SelaluTeh Product Catalog

## Introduction

Dokumen ini mendefinisikan kebutuhan lengkap untuk domain **Product Catalog** pada SelaluTeh Marketplace.

Spec ini mengatur katalog produk kanonis yang digunakan oleh:

```text
Admin Dashboard
AI Agent
WhatsApp
Telegram
Order Service
Outlet Operations
Inventory
Payments
Analytics
External Channel Sync
```

Spec ini mendukung arsitektur:

```text
workspace
→ owns canonical catalog
→ assigns products to many outlets
→ each outlet may override price, visibility, and availability policy
```

Product Catalog menjawab:

> Produk apa yang dijual, bagaimana struktur menu-nya, berapa harga kanonisnya, outlet mana yang menawarkannya, dan konfigurasi pilihan apa yang tersedia?

Inventory menjawab:

> Berapa stok fisik/tersedia saat ini?

Order menjawab:

> Produk apa yang dibeli customer dan snapshot apa yang disimpan?

Channel Sync menjawab:

> Bagaimana katalog diterbitkan atau disinkronkan ke platform eksternal?

Spec ini merupakan dedicated domain spec di bawah umbrella:

```text
selaluteh-backend-marketplace
```

---

# 1. Authority and Domain Boundaries

| Domain | Authority |
|---|---|
| Product identity, category, description, base price, variants, modifier groups, outlet assignment, outlet price override, catalog lifecycle | `selaluteh-product-catalog` |
| Stock quantity, reservation, adjustment, ledger, waste, transfer | `selaluteh-inventory-stock-ledger` |
| Outlet lifecycle, outlet opening hours, order acceptance | `selaluteh-outlet-management-operations` |
| Workspace/member authorization | `selaluteh-workspace-access-control` |
| Cart and order item snapshot | `selaluteh-cart-order-lifecycle` |
| Product image upload/storage internals | `selaluteh-media-assets` |
| Import/export job engine | `selaluteh-admin-data-operations` |
| External menu sync and provider mapping | `selaluteh-channel-connections-sync` |
| Product analytics/read models | `selaluteh-analytics-read-models` |
| Immutable activity timeline | `selaluteh-audit-activity-timeline` |
| AI tool execution and response orchestration | `selaluteh-ai-agent-architecture` |

---

# 2. Product Principles

```text
Workspace owns the canonical catalog.

Product definition is separated from outlet assignment.

Base price is separated from outlet price override.

Catalog availability is separated from physical inventory.

Order items use immutable snapshots.

Unknown or archived products cannot be newly ordered.

AI reads catalog through authorized tools, not from prompt memory.

External channels consume published catalog state through adapters.

Product images are referenced, not stored in catalog tables as raw binary.

All mutations are workspace-scoped and audited.

Catalog changes are versioned and conflict-safe.
```

---

# 3. Requirement Summary

| ID | Requirement | Priority |
|---|---|---|
| PC-R1 | Spec Authority and Domain Boundary | P0 |
| PC-R2 | Workspace Catalog Ownership | P0 |
| PC-R3 | Product Identity and Core Fields | P0 |
| PC-R4 | Product Type Model | P0 |
| PC-R5 | Product Lifecycle | P0 |
| PC-R6 | SKU and Product Code Rules | P0 |
| PC-R7 | Category Hierarchy | P0 |
| PC-R8 | Tags and Search Metadata | P1 |
| PC-R9 | Product Description and Content | P0 |
| PC-R10 | Product Media References | P1 |
| PC-R11 | Base Pricing | P0 |
| PC-R12 | Outlet Assignment | P0 |
| PC-R13 | Outlet Price Override | P0 |
| PC-R14 | Outlet Availability Policy | P0 |
| PC-R15 | Schedule-Based Availability | P1 |
| PC-R16 | Variant Model | P0 |
| PC-R17 | Option and Modifier Groups | P0 |
| PC-R18 | Modifier Rules and Pricing | P0 |
| PC-R19 | Product Bundles and Combos | P1 |
| PC-R20 | Product Add-ons | P1 |
| PC-R21 | Dietary, Allergen, and Ingredient Metadata | P1 |
| PC-R22 | Tax and Service Classification | P1 |
| PC-R23 | Preparation and Fulfillment Metadata | P1 |
| PC-R24 | Product Duplication | P1 |
| PC-R25 | Product Archival and Restoration | P0 |
| PC-R26 | Bulk Product Operations | P1 |
| PC-R27 | Import and Export Integration | P1 |
| PC-R28 | Catalog Search, Filter, Sort, and Pagination | P0 |
| PC-R29 | Product Detail Read Model | P0 |
| PC-R30 | Outlet Catalog Read Model | P0 |
| PC-R31 | Channel Publishing State | P1 |
| PC-R32 | AI Agent Catalog Tools | P0 |
| PC-R33 | Cart and Order Snapshot Contract | P0 |
| PC-R34 | Inventory Integration Contract | P0 |
| PC-R35 | Price and Availability Validation | P0 |
| PC-R36 | Authorization and Outlet Scope | P0 |
| PC-R37 | Optimistic Concurrency and Idempotency | P0 |
| PC-R38 | Domain Events and Outbox | P0 |
| PC-R39 | Audit and Activity Timeline | P0 |
| PC-R40 | Cache and Search Index Invalidation | P0 |
| PC-R41 | API Contracts and Error Model | P0 |
| PC-R42 | Admin UI State Support | P1 |
| PC-R43 | Legacy Migration and Compatibility | P0 |
| PC-R44 | Testing and Quality Assurance | P0 |
| PC-R45 | Scalability and Performance | P1 |
| PC-R46 | Operational Readiness and Recovery | P1 |

---

# 4. Detailed Requirements

## PC-R1: Spec Authority and Domain Boundary

**Priority:** P0

### Acceptance Criteria

1. THE System SHALL use this spec as authority for product catalog behavior.
2. THE System SHALL not duplicate inventory quantity/ledger semantics.
3. THE System SHALL not duplicate outlet lifecycle semantics.
4. THE System SHALL not store order-time mutable references without snapshots.
5. THE System SHALL not implement provider credential or external sync internals.
6. Dedicated domain specs SHALL override umbrella details in their owned boundaries.
7. Missing external contracts SHALL be documented as blockers rather than silently invented.

## PC-R2: Workspace Catalog Ownership

**Priority:** P0

### Acceptance Criteria

1. Every catalog entity SHALL belong to exactly one workspace.
2. Workspace context SHALL come from verified authorization context.
3. Product IDs from another workspace SHALL never be readable or mutable.
4. Unique constraints such as SKU MAY be workspace-scoped.
5. List, count, search, export, and analytics inputs SHALL respect workspace scope.
6. Background catalog jobs SHALL carry explicit workspace context.
7. Archived workspace SHALL reject new catalog mutations.
8. Cross-workspace copy SHALL require an explicit future workflow and SHALL not be implicit.

## PC-R3: Product Identity and Core Fields

**Priority:** P0

Product core fields SHALL support:

```text
id
workspace_id
name
slug
sku
product_code optional
type
status
short_description
description
base_price
currency
category_id
primary_media_id optional
is_featured
sort_order
version
created_at
updated_at
archived_at
```

### Acceptance Criteria

1. Product name SHALL be required.
2. Product name SHALL be normalized for search.
3. Slug SHALL be unique per workspace when active.
4. Currency SHALL be explicit and default to IDR for current product.
5. Base price SHALL be non-negative.
6. Product SHALL retain stable ID across edits.
7. Product mutable fields SHALL support versioning.
8. Historical order records SHALL not depend on current product values.
9. Product type/status SHALL be validated against fixed enums.
10. Created/updated actor SHALL be traceable.

## PC-R4: Product Type Model

**Priority:** P0

Supported product types:

```text
STANDARD
VARIANT_PARENT
BUNDLE
ADD_ON_ONLY
```

### Acceptance Criteria

1. STANDARD product MAY be sold directly without variants.
2. VARIANT_PARENT SHALL require one or more sellable variants.
3. BUNDLE SHALL define component rules.
4. ADD_ON_ONLY SHALL not be purchased as a standalone item unless configured.
5. Unknown type SHALL be rejected.
6. Type changes SHALL be guarded when active orders or assignments exist.
7. UI and AI SHALL receive sellability information derived from type.

## PC-R5: Product Lifecycle

**Priority:** P0

Statuses:

```text
DRAFT
ACTIVE
INACTIVE
ARCHIVED
```

### Acceptance Criteria

1. DRAFT SHALL not be customer-visible.
2. ACTIVE MAY be customer-visible if outlet assignment and availability permit.
3. INACTIVE SHALL not accept new cart additions.
4. ARCHIVED SHALL be excluded from normal catalog lists.
5. Status transitions SHALL be validated.
6. ACTIVE product SHALL require required fields and at least one valid sellable configuration.
7. Archive SHALL preserve historical references.
8. Restore SHALL return to INACTIVE by default unless policy explicitly restores ACTIVE.
9. Duplicate transition commands SHALL be idempotent.
10. Status changes SHALL emit domain events.

## PC-R6: SKU and Product Code Rules

**Priority:** P0

### Acceptance Criteria

1. SKU SHALL be unique per workspace for active/non-archived sellable item.
2. Variant SKU SHALL be independently unique.
3. SKU normalization SHALL be deterministic.
4. SKU SHALL not be silently regenerated after orders exist.
5. Product code MAY be human-friendly and distinct from SKU.
6. Duplicate product workflow SHALL generate a new SKU/code or require user input.
7. Archived SKU reuse policy SHALL be explicit; default SHALL prohibit reuse.
8. Import SHALL report duplicate SKU errors per row.

## PC-R7: Category Hierarchy

**Priority:** P0

### Acceptance Criteria

1. Workspace MAY define product categories.
2. Category SHALL support parent-child hierarchy.
3. Maximum depth SHALL be bounded and configurable.
4. Circular hierarchy SHALL be rejected.
5. Category SHALL include name, slug, description optional, status, sort_order, version.
6. Product MAY belong to one primary category and optional secondary categories if enabled.
7. Category archive SHALL require reassignment or preserve product references safely.
8. Category ordering SHALL be supported.
9. Customer-facing outlet catalog SHALL only include active categories with visible products.
10. Category changes SHALL invalidate catalog cache.

## PC-R8: Tags and Search Metadata

**Priority:** P1

### Acceptance Criteria

1. Products MAY have controlled tags.
2. Tags SHALL be workspace-scoped.
3. Tags MAY support labels such as:
   - signature;
   - bestseller;
   - new;
   - coffee;
   - non-coffee;
   - creamy;
   - less-sweet-friendly.
4. Free-text tags SHALL be normalized.
5. Search metadata MAY include aliases and keywords.
6. Tags SHALL not replace structured dietary/allergen fields.
7. Tag deletion SHALL preserve audit and remove active associations safely.
8. AI search tool MAY use aliases and keywords.

## PC-R9: Product Description and Content

**Priority:** P0

### Acceptance Criteria

1. Product SHALL support short and long description.
2. Content SHALL support plain text and safely rendered rich text according to frontend contract.
3. Content SHALL be sanitized.
4. Description MAY include flavor notes, serving suggestion, and customer-facing highlights.
5. Internal notes SHALL be stored separately and not exposed to customers.
6. AI SHALL only receive publishable content.
7. Localization-ready structure MAY be supported.
8. Empty optional descriptions SHALL not break catalog rendering.

## PC-R10: Product Media References

**Priority:** P1

### Acceptance Criteria

1. Catalog SHALL store references to media assets, not raw binaries.
2. Product MAY have one primary image and ordered gallery.
3. Media reference SHALL belong to same workspace or approved shared asset scope.
4. Deleted/unavailable media SHALL fall back safely.
5. Alt text SHALL be supported.
6. Variant MAY override media.
7. Image processing/storage lifecycle SHALL remain owned by Media Assets.
8. Product archive SHALL not automatically delete shared media.

## PC-R11: Base Pricing

**Priority:** P0

### Acceptance Criteria

1. Product/variant SHALL have canonical base price.
2. Price SHALL use integer minor units.
3. Currency SHALL be explicit.
4. Negative price SHALL be rejected.
5. Zero price SHALL require allowed product policy.
6. Base price changes SHALL be audited.
7. Historical order price SHALL remain unchanged.
8. Price display SHALL be derived from authoritative backend values.
9. AI SHALL never invent or override price.
10. Price mutation SHALL require explicit permission.

## PC-R12: Outlet Assignment

**Priority:** P0

### Acceptance Criteria

1. Product SHALL be explicitly assigned to outlets.
2. Assignment SHALL include workspace_id, product_id, outlet_id, status, visibility, availability policy, optional price override, version.
3. Product and outlet SHALL belong to same workspace.
4. One product MAY be assigned to many outlets.
5. One outlet MAY offer many products.
6. Duplicate assignment SHALL be prevented.
7. Unassigned product SHALL not be orderable at that outlet.
8. Outlet archive SHALL preserve historical assignment while disabling new sales.
9. Assignment changes SHALL invalidate outlet catalog cache.
10. Bulk assignment SHALL report partial failures.

## PC-R13: Outlet Price Override

**Priority:** P0

### Acceptance Criteria

1. Outlet assignment MAY override base price.
2. Override SHALL use same currency as workspace catalog unless multi-currency is introduced later.
3. Effective price SHALL be:
   ```text
   outlet override
   → variant override
   → product base price
   ```
   according to documented precedence.
4. Price override SHALL be non-negative.
5. Clearing override SHALL restore inherited price.
6. Effective price SHALL be calculated server-side.
7. AI, cart, and order SHALL consume effective price from catalog service.
8. Price changes SHALL invalidate cache and emit events.
9. Order snapshot SHALL preserve effective price used.
10. Outlet-scoped authorization SHALL apply.

## PC-R14: Outlet Availability Policy

**Priority:** P0

Availability dimensions:

```text
assignment_enabled
customer_visible
orderable
temporarily_unavailable
inventory_controlled
```

### Acceptance Criteria

1. Product assignment SHALL distinguish visibility from orderability.
2. Product MAY be visible but temporarily unavailable.
3. Product MAY be hidden without archiving global product.
4. Global product INACTIVE/ARCHIVED SHALL override outlet assignment.
5. Outlet `accepts_orders = false` SHALL make products non-orderable without changing catalog records.
6. Inventory-controlled availability SHALL consume Inventory contract.
7. Manual availability override SHALL be auditable.
8. Availability reason MAY be customer-safe and internal.
9. AI SHALL receive effective orderability and safe reason.
10. Unknown availability state SHALL fail closed.

## PC-R15: Schedule-Based Availability

**Priority:** P1

### Acceptance Criteria

1. Product assignment MAY define recurring availability windows.
2. Availability schedule SHALL use outlet timezone.
3. Schedules MAY support days of week and start/end time.
4. Special date overrides MAY be supported.
5. Overnight windows SHALL be handled explicitly.
6. Schedule SHALL combine with outlet opening hours.
7. Schedule SHALL not make archived/inactive products orderable.
8. Effective availability SHALL be deterministic for a supplied timestamp.
9. Schedule changes SHALL invalidate cache.
10. Tests SHALL cover DST/timezone edge cases where applicable.

## PC-R16: Variant Model

**Priority:** P0

Examples:

```text
size: Regular / Large
temperature: Iced / Hot
```

### Acceptance Criteria

1. VARIANT_PARENT SHALL define one or more variant dimensions.
2. Sellable variant SHALL have stable ID and SKU.
3. Variant SHALL support name, option values, price adjustment or explicit price, status, media override, sort order, version.
4. Duplicate option combinations SHALL be prevented.
5. Inactive variant SHALL not be newly ordered.
6. Variant price SHALL be calculated authoritatively.
7. Variant MAY have outlet-specific availability/price override through documented extension.
8. Parent product SHALL not be directly orderable when variants are required.
9. Variant changes SHALL preserve order snapshots.
10. AI tools SHALL return valid selectable variants.

## PC-R17: Option and Modifier Groups

**Priority:** P0

Examples:

```text
Sugar Level
Ice Level
Milk Choice
Extra Shot
Topping
```

### Acceptance Criteria

1. Product MAY reference ordered modifier groups.
2. Modifier group SHALL be workspace-scoped.
3. Group SHALL define:
   - name;
   - required/optional;
   - minimum selection;
   - maximum selection;
   - repeatable flag;
   - sort order;
   - status.
4. Group SHALL contain modifier options.
5. Selection constraints SHALL be server-validated.
6. Required group SHALL block cart addition until valid choice is supplied.
7. Modifier group MAY be reusable across products.
8. Product-specific group configuration MAY override label/order/constraints within allowed bounds.
9. Inactive group/option SHALL not be offered.
10. AI SHALL receive concise, ordered selection prompts.

## PC-R18: Modifier Rules and Pricing

**Priority:** P0

### Acceptance Criteria

1. Modifier option SHALL support price adjustment.
2. Price adjustment SHALL use minor units and same currency.
3. Modifier MAY be free.
4. Modifier selection SHALL respect min/max/repeatability.
5. Incompatible combinations MAY be modeled.
6. Conditional modifiers MAY depend on variant or prior choice.
7. Backend SHALL calculate modifier total.
8. Cart/order SHALL not trust client-calculated modifier prices.
9. Order snapshot SHALL preserve modifier names and prices.
10. Modifier changes SHALL not mutate historical orders.

## PC-R19: Product Bundles and Combos

**Priority:** P1

### Acceptance Criteria

1. BUNDLE product SHALL define component groups.
2. Component group MAY require choosing products/variants from an allowed set.
3. Bundle SHALL validate minimum/maximum choices.
4. Bundle price MAY be fixed or calculated according to documented policy.
5. Component products SHALL belong to same workspace.
6. Outlet bundle orderability SHALL require all mandatory components orderable at the outlet.
7. Inventory integration SHALL receive component references.
8. Bundle order snapshot SHALL preserve selected components.
9. Circular bundle composition SHALL be rejected.
10. AI SHALL guide customer through required component selections.

## PC-R20: Product Add-ons

**Priority:** P1

### Acceptance Criteria

1. ADD_ON_ONLY product MAY be referenced by modifier groups.
2. Add-on standalone purchase SHALL be blocked unless explicitly allowed.
3. Add-on SHALL support price, outlet assignment, and availability.
4. Add-on MAY integrate with inventory separately.
5. Order snapshot SHALL identify add-on as a child selection.
6. Archived add-on SHALL not remain selectable.
7. Add-on search SHALL not pollute standard customer catalog unless configured.

## PC-R21: Dietary, Allergen, and Ingredient Metadata

**Priority:** P1

### Acceptance Criteria

1. Product MAY include structured dietary labels.
2. Product MAY include allergen declarations.
3. Product MAY include ingredient summary.
4. Metadata SHALL distinguish verified facts from marketing labels.
5. Admin UI SHALL warn that absence of an allergen label is not a medical guarantee.
6. AI SHALL not make unsupported medical claims.
7. Allergen/dietary data SHALL be customer-visible only when published.
8. Variant/modifier MAY change allergen/dietary profile.
9. Changes SHALL be audited.
10. Localization-ready labels MAY be supported.

## PC-R22: Tax and Service Classification

**Priority:** P1

### Acceptance Criteria

1. Product MAY reference tax category.
2. Tax calculation itself MAY remain owned by order/payment configuration.
3. Product SHALL expose tax classification to Order contract.
4. Service charge eligibility MAY be stored as classification.
5. Unknown tax category SHALL not be invented.
6. Tax category changes SHALL not modify historical order snapshots.
7. Workspace configuration SHALL define currency/tax defaults.
8. Admin permission SHALL protect tax classification updates.

## PC-R23: Preparation and Fulfillment Metadata

**Priority:** P1

### Acceptance Criteria

1. Product MAY include base preparation time.
2. Product MAY include preparation station/category.
3. Product MAY support pickup-only flag.
4. Fulfillment constraints SHALL combine with outlet capabilities.
5. Preparation time is advisory and SHALL not override outlet/order capacity engine.
6. Product MAY include packaging notes.
7. Internal preparation notes SHALL not be customer-visible.
8. Order snapshot MAY preserve fulfillment notes where needed.

## PC-R24: Product Duplication

**Priority:** P1

### Acceptance Criteria

1. Authorized user MAY duplicate product.
2. Duplicate SHALL receive new stable ID.
3. Duplicate SHALL default to DRAFT.
4. Duplicate SHALL require new SKU.
5. User MAY choose whether to copy:
   - variants;
   - modifier groups;
   - outlet assignments;
   - media references;
   - tags.
6. Inventory quantities SHALL never be copied.
7. Channel publishing state SHALL never be copied as published.
8. Duplication SHALL be idempotent.
9. Duplicate action SHALL be audited.

## PC-R25: Product Archival and Restoration

**Priority:** P0

### Acceptance Criteria

1. Product archive SHALL block new cart additions.
2. Existing paid/in-progress orders SHALL retain snapshots.
3. Archive SHALL preserve category, media, assignment, and audit history.
4. Archived product SHALL be excluded by default from search/list.
5. Restore SHALL return to INACTIVE unless explicit validated status requested.
6. SKU reuse SHALL remain prohibited by default.
7. Archive/restore SHALL use optimistic concurrency.
8. Archive event SHALL invalidate caches and channel publish state.
9. Product with active cart references SHALL be revalidated at checkout.
10. Hard delete SHALL not be normal admin operation.

## PC-R26: Bulk Product Operations

**Priority:** P1

Supported actions MAY include:

```text
activate
deactivate
archive
assign outlets
remove outlet assignments
set visibility
set availability
apply category
apply tags
```

### Acceptance Criteria

1. Bulk operation SHALL validate authorization for every target.
2. Cross-workspace IDs SHALL be denied.
3. Partial failure SHALL return per-item result.
4. Destructive operations SHALL require confirmation.
5. Large operations MAY be asynchronous through Admin Data Operations.
6. Bulk operation SHALL be idempotent where possible.
7. Audit SHALL record actor and affected count.
8. Inventory quantity SHALL not be mutated by catalog bulk action.

## PC-R27: Import and Export Integration

**Priority:** P1

### Acceptance Criteria

1. Catalog SHALL define import/export schemas.
2. Admin Data Operations SHALL own asynchronous file/job lifecycle.
3. Import SHALL support validation-only dry run.
4. Import SHALL report row-level errors.
5. Import SHALL reject unknown workspace/outlet/category references.
6. SKU uniqueness SHALL be validated.
7. Import SHALL support upsert policy explicitly.
8. Export SHALL respect authorization and outlet scope.
9. Export SHALL omit secrets/internal-only fields unless permitted.
10. Import/export activity SHALL be audited.

## PC-R28: Catalog Search, Filter, Sort, and Pagination

**Priority:** P0

### Acceptance Criteria

1. Product list SHALL support search by name, SKU, code, alias, and description keywords.
2. Filters SHALL include:
   - status;
   - category;
   - outlet;
   - assignment status;
   - availability;
   - price range;
   - type;
   - tags;
   - featured.
3. Sort SHALL include name, created date, updated date, base price, and custom order.
4. Pagination SHALL be stable.
5. Search SHALL be workspace-scoped.
6. Unauthorized outlet filters SHALL not leak data.
7. Empty and no-results responses SHALL be distinguishable.
8. Search index SHALL update after changes.
9. List response SHALL expose effective summary without requiring N+1 queries.
10. Filter contracts SHALL be reusable by UI and export jobs.

## PC-R29: Product Detail Read Model

**Priority:** P0

Product detail SHALL include:

```text
core product
category
tags
media
variants
modifier groups
bundle components
outlet assignments
effective prices
availability summaries
channel publishing summaries
sales/analytics links
recent activity links
capability flags
version
```

### Acceptance Criteria

1. Detail read model SHALL be workspace-scoped.
2. Outlet assignments SHALL be filtered by actor access.
3. Sensitive internal fields SHALL require permission.
4. Capability flags SHALL be advisory only.
5. Missing external read models SHALL degrade gracefully.
6. Detail SHALL avoid excessive round trips.
7. Version SHALL be returned for optimistic editing.

## PC-R30: Outlet Catalog Read Model

**Priority:** P0

### Acceptance Criteria

1. Catalog service SHALL return customer-facing products for one outlet.
2. Result SHALL apply:
   - workspace scope;
   - outlet status;
   - outlet order acceptance;
   - product status;
   - outlet assignment;
   - schedule;
   - availability;
   - inventory signal;
   - effective price.
3. Result SHALL include categories and ordering.
4. Hidden/internal products SHALL be excluded.
5. Unavailable products MAY be included with safe reason if requested.
6. Result SHALL support AI-friendly compact format.
7. Result SHALL support pagination or bounded full menu.
8. Effective timestamp/timezone SHALL be explicit.
9. Cache SHALL be outlet-aware.
10. Outlet catalog SHALL never trust channel-side stale price as authority.

## PC-R31: Channel Publishing State

**Priority:** P1

### Acceptance Criteria

1. Catalog SHALL expose publishable canonical state.
2. External provider mapping SHALL remain owned by Channel Connections.
3. Product MAY track publishing status per channel:
   - NOT_PUBLISHED;
   - PENDING;
   - PUBLISHED;
   - OUT_OF_SYNC;
   - FAILED.
4. Publishing status SHALL not affect internal orderability unless configured.
5. Catalog change SHALL emit events for sync adapters.
6. Provider-specific IDs SHALL be stored in channel mapping tables, not core product.
7. Failed sync SHALL not corrupt canonical catalog.
8. UI SHALL show last sync and safe error summary.
9. Re-publish SHALL be idempotent.
10. Unsupported channels SHALL not show sync actions.

## PC-R32: AI Agent Catalog Tools

**Priority:** P0

Minimum tools:

```text
list_categories
search_products
list_products_by_outlet
get_product_detail
get_product_options
check_product_availability
get_effective_price
```

### Acceptance Criteria

1. Tools SHALL require workspace/outlet context.
2. Tools SHALL return structured data.
3. Tools SHALL not expose internal notes or secrets.
4. Tools SHALL return effective price and orderability.
5. AI SHALL not cache price indefinitely.
6. Tool Gateway SHALL enforce authorization and scope.
7. Unknown product/outlet SHALL return safe errors.
8. AI SHALL not invent unavailable modifiers.
9. Tool output SHOULD include concise customer-facing reason for unavailability.
10. Off-topic requests SHALL not call catalog tools.

## PC-R33: Cart and Order Snapshot Contract

**Priority:** P0

### Acceptance Criteria

1. Cart SHALL reference catalog entities but revalidate at mutation/checkout.
2. Order item SHALL snapshot:
   - product ID;
   - product name;
   - SKU;
   - variant ID/name;
   - modifier selections;
   - unit price;
   - modifier prices;
   - quantity;
   - tax/service classification as needed;
   - outlet ID.
3. Snapshot SHALL be immutable after order creation except controlled corrections.
4. Catalog edits SHALL not mutate existing order snapshots.
5. Checkout SHALL reject inactive/unavailable/mismatched configuration.
6. Price changes between cart and checkout SHALL require updated total and confirmation according to Order policy.
7. Archived products in old orders SHALL remain displayable from snapshot.
8. Bundle components SHALL be snapshotted.

## PC-R34: Inventory Integration Contract

**Priority:** P0

### Acceptance Criteria

1. Catalog SHALL identify whether a product/variant/add-on is inventory-controlled.
2. Catalog SHALL not own stock quantity.
3. Inventory SHALL expose availability signal by outlet and item.
4. Catalog effective availability SHALL combine manual and inventory signals.
5. Inventory service failure policy SHALL be explicit:
   - fail closed for inventory-controlled items by default;
   - configurable safe fallback only if approved.
6. Product archive SHALL notify Inventory contract.
7. Variant/modifier inventory mapping SHALL be explicit.
8. Catalog SHALL not decrement stock directly.
9. Order/Inventory SHALL own reservation and consumption.
10. UI SHALL distinguish catalog unavailable from out-of-stock where safe.

## PC-R35: Price and Availability Validation

**Priority:** P0

### Acceptance Criteria

1. Server SHALL calculate effective price.
2. Server SHALL validate product, variant, modifiers, outlet assignment, status, schedule, and inventory signal.
3. Client/AI supplied price SHALL be ignored.
4. Price/availability validation SHALL be reusable by cart/order.
5. Validation SHALL return stable reason codes.
6. Validation SHALL use one consistent timestamp.
7. Validation result SHALL include catalog version/effective price.
8. Race conditions SHALL be handled at checkout.
9. Unknown state SHALL fail closed.
10. Validation SHALL be covered by property and concurrency tests.

## PC-R36: Authorization and Outlet Scope

**Priority:** P0

### Acceptance Criteria

1. Product read/manage actions SHALL use Workspace Access Control.
2. Outlet-specific assignment/price/availability SHALL require outlet scope.
3. Workspace owner/admin MAY have all-outlet access according to membership scope.
4. Outlet manager MAY manage only assigned outlets and allowed fields.
5. Outlet staff MAY have read-only or limited availability permission.
6. Product archive and base price changes SHALL require stronger permission.
7. Export SHALL require separate permission.
8. AI uses constrained tool identity.
9. Frontend hidden actions SHALL not replace backend authorization.
10. Cross-outlet assignment mutation SHALL be denied.

## PC-R37: Optimistic Concurrency and Idempotency

**Priority:** P0

### Acceptance Criteria

1. Product, category, variant, modifier group, outlet assignment, and custom sort mutations SHALL support version checks.
2. Concurrent updates SHALL return VERSION_CONFLICT.
3. Create, duplicate, assign outlet, archive, restore, and bulk commands SHALL support idempotency or deterministic duplicate handling.
4. Duplicate request SHALL not create duplicate product/assignment.
5. Price edits SHALL not silently overwrite.
6. Import upsert SHALL use stable idempotency keys.
7. Domain events SHALL avoid duplication.
8. Tests SHALL cover concurrent catalog and availability updates.

## PC-R38: Domain Events and Outbox

**Priority:** P0

Events MAY include:

```text
PRODUCT_CREATED
PRODUCT_UPDATED
PRODUCT_ACTIVATED
PRODUCT_DEACTIVATED
PRODUCT_ARCHIVED
PRODUCT_RESTORED
PRODUCT_PRICE_CHANGED
PRODUCT_OUTLET_ASSIGNED
PRODUCT_OUTLET_UNASSIGNED
PRODUCT_OUTLET_PRICE_CHANGED
PRODUCT_AVAILABILITY_CHANGED
PRODUCT_VARIANT_CHANGED
PRODUCT_MODIFIER_CHANGED
CATEGORY_CHANGED
CATALOG_PUBLISH_REQUESTED
```

### Acceptance Criteria

1. Business-relevant changes SHALL emit events.
2. Events SHALL include workspace, product, outlet if applicable, actor, version, correlation ID, timestamp.
3. Outbox/reliable delivery SHALL be used where consumers depend on events.
4. Duplicate consumers SHALL be idempotent.
5. Event payload SHALL avoid secrets.
6. Inventory, channel sync, analytics, cache, and audit MAY consume events.
7. Event failure behavior SHALL be documented.

## PC-R39: Audit and Activity Timeline

**Priority:** P0

### Acceptance Criteria

1. Catalog mutations SHALL produce audit/activity records.
2. Activity SHALL include actor, action, product, outlet if applicable, before/after safe metadata, timestamp.
3. Price changes SHALL always be auditable.
4. Archive/restore/assignment changes SHALL always be auditable.
5. Internal notes and secrets SHALL not leak.
6. Activity timeline storage remains owned by Audit spec.
7. Product detail MAY display recent activity read model.
8. Bulk actions SHALL summarize and link per-item details where available.

## PC-R40: Cache and Search Index Invalidation

**Priority:** P0

### Acceptance Criteria

1. Catalog MAY cache product and outlet menu read models.
2. Cache key SHALL include workspace, outlet, locale, timestamp bucket where schedules matter, and catalog version.
3. Product/category/assignment/price/availability changes SHALL invalidate affected keys.
4. Inventory availability events SHALL invalidate inventory-controlled outlet items.
5. Channel publishing cache SHALL remain separate from canonical catalog cache.
6. Search index SHALL update reliably.
7. Cache failure SHALL fall back to authoritative storage.
8. Cross-workspace cache collisions SHALL be impossible.
9. Stale price SHALL not be accepted at checkout.
10. Invalidation metrics SHALL be observable.

## PC-R41: API Contracts and Error Model

**Priority:** P0

Suggested APIs:

```text
GET    /api/products
POST   /api/products
GET    /api/products/:productId
PATCH  /api/products/:productId
POST   /api/products/:productId/activate
POST   /api/products/:productId/deactivate
POST   /api/products/:productId/archive
POST   /api/products/:productId/restore
POST   /api/products/:productId/duplicate

GET    /api/product-categories
POST   /api/product-categories
PATCH  /api/product-categories/:categoryId

PUT    /api/products/:productId/outlets
PATCH  /api/products/:productId/outlets/:outletId
DELETE /api/products/:productId/outlets/:outletId

POST   /api/products/:productId/variants
PATCH  /api/products/:productId/variants/:variantId
POST   /api/modifier-groups
PATCH  /api/modifier-groups/:groupId

GET    /api/outlets/:outletId/catalog
POST   /api/catalog/validate-selection
```

### Acceptance Criteria

1. APIs SHALL use strict schemas.
2. APIs SHALL enforce workspace and outlet authorization.
3. Mutation APIs SHALL support idempotency where relevant.
4. Versioned resources SHALL support optimistic concurrency.
5. Stable errors SHALL include:
   - PRODUCT_NOT_FOUND;
   - PRODUCT_NOT_ACTIVE;
   - PRODUCT_ARCHIVED;
   - SKU_ALREADY_EXISTS;
   - CATEGORY_NOT_FOUND;
   - CATEGORY_CYCLE;
   - OUTLET_ASSIGNMENT_REQUIRED;
   - OUTLET_SCOPE_DENIED;
   - PRODUCT_NOT_AVAILABLE;
   - VARIANT_REQUIRED;
   - VARIANT_NOT_AVAILABLE;
   - MODIFIER_SELECTION_INVALID;
   - PRICE_CHANGED;
   - VERSION_CONFLICT;
   - CROSS_WORKSPACE_ACCESS_DENIED.
6. Errors SHALL not leak cross-workspace existence.
7. API documentation SHALL include required permission.

## PC-R42: Admin UI State Support

**Priority:** P1

Backend SHALL support:

```text
Products list
Product detail drawer/page
Add product
Edit product
Duplicate product
Archive confirmation
Restore
Category management
Variant builder
Modifier group builder
Outlet assignment
Outlet price override
Outlet availability
Bulk selection bar
Advanced filters
Import modal
Export modal
Publishing status
Activity timeline
Sales summary links
Empty state
No-results state
Conflict state
Partial bulk failure
```

### Acceptance Criteria

1. List APIs SHALL provide summary counts and filters.
2. Product detail SHALL provide all editor-required data.
3. Capabilities SHALL be exposed as advisory flags.
4. Empty and no-results states SHALL be distinct.
5. Conflict response SHALL support safe refresh/reapply UX.
6. Partial failures SHALL identify affected rows/items.
7. Publishing state SHALL show unsupported channel correctly.
8. Inventory fields SHALL be clearly external/read-only where appropriate.
9. Price/availability inherited vs overridden state SHALL be explicit.
10. Form validation errors SHALL map to fields.

## PC-R43: Legacy Migration and Compatibility

**Priority:** P0

### Acceptance Criteria

1. Existing legacy product schemas SHALL be audited before migration.
2. Fresh Supabase catalog data MAY be used because legacy Mongo data is not important.
3. Migration SHALL map categories, products, variants/options, outlet assignment, and images where retained.
4. Unknown legacy fields SHALL be documented.
5. Mongo/Mongoose SHALL not remain active authority after cutover.
6. Compatibility adapters SHALL be temporary and removable.
7. Duplicate SKU and missing category issues SHALL be reported.
8. Migration SHALL validate effective outlet prices and availability.
9. Order history migration, if any, SHALL preserve snapshots independently.
10. Cutover and rollback SHALL be documented.

## PC-R44: Testing and Quality Assurance

**Priority:** P0

### Acceptance Criteria

1. Implementation SHALL follow TDD.
2. Unit tests SHALL cover lifecycle, pricing, variant/modifier validation, availability, category cycles, and SKU rules.
3. Component tests SHALL cover product service, outlet catalog, validation service, cache invalidation, and event emission.
4. Integration tests SHALL cover APIs, repositories, Supabase, RLS, Inventory contract, Order contract, and Tool Gateway.
5. Security tests SHALL cover cross-workspace, cross-outlet, price tampering, unauthorized archive, and internal-field leakage.
6. Property tests SHALL verify effective price/availability invariants.
7. Concurrency tests SHALL cover price changes, archive vs checkout, and duplicate creation.
8. Resilience tests SHALL cover cache, inventory, event, search index, and media failures.
9. Performance tests SHALL cover large catalogs and many outlet assignments.
10. Production secrets/data SHALL be prohibited.
11. Skipped critical tests SHALL block release.

## PC-R45: Scalability and Performance

**Priority:** P1

### Acceptance Criteria

1. Product, SKU, category, assignment, and search fields SHALL be indexed.
2. Outlet catalog SHALL avoid N+1 queries.
3. List endpoints SHALL paginate.
4. Cache SHALL support high-read catalog usage.
5. Search SHOULD support full-text strategy appropriate to PostgreSQL.
6. Bulk assignment SHALL use bounded batches.
7. Catalog events SHALL be asynchronous where safe.
8. Performance tests SHALL include many products, outlets, variants, and modifiers.
9. Architecture SHALL support future franchise workspaces without schema rewrite.
10. Query plans SHALL be reviewed for core endpoints.

## PC-R46: Operational Readiness and Recovery

**Priority:** P1

### Acceptance Criteria

1. Catalog data SHALL be backed up according to platform policy.
2. Restore SHALL preserve workspace isolation, SKU uniqueness, and product versions.
3. Recovery runbook SHALL include accidental archive, mass price change, and broken outlet assignment.
4. Price-change incident response SHALL be documented.
5. Search index rebuild SHALL be supported.
6. Cache flush/rebuild SHALL be supported.
7. Outbox replay SHALL be safe and idempotent.
8. Release checklist SHALL include catalog/order/payment integration.
9. Operational ownership SHALL be documented.
10. Data repair tools SHALL be access-controlled and audited.

---

# 5. Baseline Data Model

## Canonical catalog

```text
products
product_categories
product_category_assignments optional
product_tags
product_tag_assignments
product_media
product_variants
variant_option_values
modifier_groups
modifier_options
product_modifier_groups
bundle_groups
bundle_group_items
```

## Outlet catalog

```text
product_outlets
product_variant_outlets optional
product_availability_schedules
channel_product_mappings external-domain owned
```

## Cross-domain references

```text
media_asset_id
inventory_item_id / inventory_controlled flag
tax_category_id
preparation_station_id
```

---

# 6. Alpha Slice

The complete spec is broader than the alpha MVP.

Minimum alpha slice:

```text
product category
standard product
name
description
SKU
base price
ACTIVE / INACTIVE / ARCHIVED
outlet assignment
outlet price override
manual is_available
customer-visible outlet catalog
search/list/get product tools
cart/order selection validation
order item snapshot
workspace/outlet authorization
Supabase persistence
audit events
critical tests
```

May follow after alpha:

```text
variants
modifier groups
bundles
scheduled availability
custom tags
allergen metadata
tax classification
bulk import/export
channel publishing state
advanced activity and analytics
```

---

# 7. Definition of Done

A requirement is complete only when:

1. failing tests are written first;
2. workspace isolation passes;
3. outlet scope passes;
4. SKU uniqueness passes;
5. lifecycle transitions pass;
6. effective price is backend-authoritative;
7. effective availability is deterministic;
8. cart/order validation uses catalog service;
9. order snapshot is immutable;
10. AI tools return structured current data;
11. inventory boundary is respected;
12. cache/search invalidation works;
13. domain events/audit are emitted;
14. concurrency and idempotency pass;
15. RLS/security tests pass;
16. implementation status reflects repository reality;
17. no production secrets/data are used;
18. `npm run specs:check` passes.

---

# 8. Final Requirement Statement

SelaluTeh Product Catalog SHALL provide one canonical, workspace-owned catalog that can be safely offered across many outlets while allowing outlet-specific pricing, visibility, and availability.

The system SHALL resolve:

```text
workspace catalog
→ product lifecycle
→ outlet assignment
→ effective price
→ effective availability
→ valid variants/modifiers
→ customer-facing result
→ immutable cart/order snapshot
```

The system SHALL never trust client- or AI-supplied prices, expose cross-workspace catalog data, or conflate catalog availability with physical inventory quantity.
