# Requirements: SelaluTeh Public Storefront QR Guest Checkout

## Overview

Implement a customer-facing public storefront frontend module for QR-based pickup orders. Customers are not required to log in and only provide name, WhatsApp number, and optional note during checkout.

## Requirements

| ID | Priority | Requirement |
|---|---|---|
| PSF-R01 | P0 | Public store routes shall be accessible without the admin dashboard shell or auth guard. |
| PSF-R02 | P0 | Public route paths shall include `/store/:storefrontSlug`, `/store/:storefrontSlug/checkout`, `/store/payment/pending/:checkoutToken`, and `/store/order/:publicOrderToken`. |
| PSF-R03 | P0 | The module shall use a feature-based structure under `web/src/features/public-store/`. |
| PSF-R04 | P0 | Mock data shall be separated from pages and components. |
| PSF-R05 | P0 | API access shall be separated behind `publicStoreApi` and shall not call `fetch` directly from components. |
| PSF-R06 | P0 | Storefront page shall support category filtering, search, product detail modifiers, and cart drawer interactions. |
| PSF-R06A | P0 | Customers shall be able to choose any available pickup outlet from the public storefront; QR storefront selection shall not be locked in Phase 1. |
| PSF-R07 | P0 | Product modifiers shall send canonical product and modifier option IDs only. |
| PSF-R08 | P0 | Cart totals in frontend shall be display previews only and shall not be payment or pricing authority. |
| PSF-R09 | P0 | Checkout form shall validate customer name and numeric WhatsApp phone. |
| PSF-R10 | P0 | Payment pending and order status pages shall use mock API behavior for Phase 1 and Phase 2. |
| PSF-R11 | P0 | Public order page shall mask customer phone and avoid exposing admin/internal fields. |
| PSF-R12 | P1 | UI shall be mobile-first, responsive, keyboard accessible, and avoid production desktop phone-frame wrappers. |
| PSF-R13 | P1 | Basic tests shall cover utilities and any testable frontend behavior supported by current tooling. |

## Security And Business Rules

- Frontend must not send unit price, totals, payment status, internal notes, inventory, COGS, or admin fields as authority.
- Backend remains the authority for availability, pricing, tax, fees, payment, invoice, and order status.
- Public route must not depend on stored admin login tokens.

## Acceptance Criteria

- Public storefront routes render without `DashboardLayout`, `Sidebar`, or `Topbar`.
- Feature code is modular and not implemented as a single monolithic page.
- Mock API, hooks, components, utils, pages, and layout are separated.
- Build passes or any failure is reported accurately.
- Related lifecycle documentation is updated.
