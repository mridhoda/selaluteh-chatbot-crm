# Products Page Design Specification

## 1. Purpose

Products adalah source of truth admin untuk catalog yang dipakai oleh Telegram marketplace dan channel lain di masa depan.

Page ini harus mendukung:

- product CRUD;
- category and status management;
- product image;
- base price;
- simple variant/modifier support;
- availability per outlet;
- optional outlet price override;
- simple stock/availability indicator;
- audit-friendly operational view.

MVP tidak mencakup complex inventory reservation, supplier management, purchase order, voucher, bundle engine, atau warehouse management.

## 2. Route and module

```txt
Route: /app/products
Page: web/src/modules/products/pages/ProductsPage.jsx
API: web/src/modules/products/api/productsApi.js
Components: web/src/modules/products/components/*
Hooks: web/src/modules/products/hooks/*
Styles: web/src/modules/products/styles/*
```

## 3. Header

### Left

```txt
Products
Manage the catalog and availability across your outlets
```

### Right actions

- Secondary: `Import` — optional, disabled/hidden until backend supports it.
- Primary: `Add Product`.

Do not show a non-functional import action as active.

## 4. Filter toolbar

Order:

```txt
Outlet
Category
Product Status
Availability
Search
```

Recommended values:

### Outlet

- All Outlets
- each allowed outlet

### Product status

- All Statuses
- Active
- Draft
- Archived

### Availability

- All Availability
- Available
- Unavailable
- Out of Stock
- Partial Outlet Availability

### Search

Search by:

- product name;
- SKU;
- category;
- optional variant name.

Active-filter chips appear only for non-default selections.

## 5. Summary cards

Use maximum four cards. Cards must respond to current outlet and filters.

Recommended:

1. Total Products
2. Active
3. Unavailable / Out of Stock
4. Needs Attention

`Needs Attention` includes:

- missing image;
- no active outlet availability;
- invalid/zero price if not allowed;
- archived category with active product;
- incomplete required field.

Cards may be hidden at narrow widths or when they do not provide value.

## 6. Main table

Recommended columns:

```txt
Product
Category
Availability / Outlets
Base Price
Variants
Status
Updated At
Actions
```

### Product cell

- 40–48px image thumbnail;
- product name;
- SKU/short ID secondary text;
- optional issue badge.

### Availability cell

When `All Outlets`:

```txt
3 of 4 outlets
Partial
```

When specific outlet:

```txt
Available
Rp2.000 override
```

### Status

Product lifecycle status is separate from availability.

Examples:

```txt
Active + Available
Active + Unavailable at selected outlet
Draft
Archived
```

### Row actions

- View/Edit
- Duplicate — optional P1
- Set availability
- Archive
- Restore when archived

Do not expose hard delete as the normal action. Archive is safer for products referenced by historical orders.

## 7. Product create/edit experience

Use a large right drawer or dedicated full page if the form grows. For MVP, a wide drawer is acceptable.

### Section A — Basic information

Fields:

```txt
Product name *
Description
Category *
SKU / product code
Product image
Status: Draft | Active
```

### Section B — Pricing

```txt
Base price *
Compare-at price (optional, hide for MVP if unused)
Tax behavior (optional, follow backend rules)
```

Use Indonesian Rupiah formatting in display, but store numeric minor/major units consistently with backend contract.

### Section C — Variants and modifiers

MVP recommendation:

- simple variants only if required by menu;
- examples: Size, Ice Level, Sugar Level;
- modifier option can add price;
- enforce unique combinations if true variants are used.

Do not build a generic unlimited option engine if current Telegram flow only needs a few deterministic options.

### Section D — Outlet availability

Provide a table/matrix:

```txt
Outlet | Available | Price Override | Stock/Availability | Notes
```

Rules:

- workspace-level base product always exists once;
- outlet availability is separate;
- price override is optional;
- disabling an outlet does not delete the product;
- existing paid/historical orders must keep snapshot data.

### Section E — Channel preview

Optional but valuable:

- Telegram product card preview;
- image, name, price, short description;
- preview is read-only;
- do not let preview diverge from actual saved product fields.

## 8. Product detail drawer

Sections:

1. Product overview
2. Price and variants
3. Outlet availability
4. Channel visibility
5. Recent updates
6. Related orders — optional P1

Primary action: `Edit Product`.

## 9. States

### Empty catalog

```txt
No products yet
Add your first product to start building the Telegram catalog.
[Add Product]
```

### Empty filter result

```txt
No products match these filters
[Clear filters]
```

### Loading

- summary skeletons;
- table rows skeleton;
- keep toolbar interactive only when safe.

### Error

- inline error with Retry;
- retain current filter state.

## 10. Permissions

### Owner / Super Admin

- create, update, archive;
- manage all outlet availability;
- view all outlets.

### Outlet Manager

- view products available to assigned outlet;
- optionally edit availability/stock for own outlet only;
- cannot edit workspace base product or other outlet price unless permission allows.

### Human Agent

- read-only product lookup by default.

## 11. Backend/data contract expectations

Minimum product shape:

```js
{
  id,
  workspaceId,
  name,
  description,
  sku,
  imageUrl,
  category,
  basePrice,
  status,
  variants,
  outletAvailability,
  createdAt,
  updatedAt
}
```

Outlet availability shape:

```js
{
  outletId,
  outletName,
  isAvailable,
  priceOverride,
  stockQuantity,
  availabilityStatus
}
```

Backend must derive/validate workspace. UI must not send arbitrary workspace ownership.

## 12. Required components

```txt
ProductsPage.jsx
ProductsToolbar.jsx
ProductsSummaryCards.jsx
ProductsTable.jsx
ProductStatusBadge.jsx
ProductFormDrawer.jsx
ProductBasicFields.jsx
ProductPricingFields.jsx
ProductVariantsEditor.jsx
ProductOutletAvailabilityEditor.jsx
ProductDetailDrawer.jsx
ProductImageUploader.jsx
```

Only extract components when the page is becoming difficult to maintain. Avoid empty abstraction files.

## 13. Acceptance criteria

- Product list loads and is outlet-aware.
- Search and filters can combine.
- Default filters do not show active-filter banner.
- Create/edit validation is clear.
- Product status and outlet availability are visually distinct.
- Historical orders are not affected by later product edits.
- User cannot modify unauthorized outlet availability.
- Build and lint have no errors.
