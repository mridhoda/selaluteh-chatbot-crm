# Sprint 2 — Product Catalog

## Objective

Add marketplace product primitives.

## Scope

- Product categories.
- Products.
- Variants.
- Product media metadata.
- Product CRUD API.

## Product Rules

- Only `active` products can appear in Telegram commerce.
- Prices are stored in integer minor units.
- Product detail should be snapshot into order item during checkout.
- Product images use local storage metadata.

## Tasks

- [ ] ProductCategory model/table.
- [ ] Product model/table.
- [ ] ProductVariant model/table.
- [ ] ProductImage model/table or file relationship.
- [ ] Product CRUD.
- [ ] Product list for Telegram.
- [ ] Product seed data.

## Acceptance Criteria

- Owner/super can create product.
- Active products can be fetched by Telegram bot.
- Archived products are hidden from customer browsing.
