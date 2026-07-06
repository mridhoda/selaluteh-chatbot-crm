---
schema_version: 2
document_type: active-task-pointer
status: idle
updated_at: 2026-07-06
---

# Current Task

## SelaluTeh Public Storefront QR Guest Checkout

Status: idle after completing `PSF-T001` through `PSF-T011`.

Completed in the latest session:

- Implement a modular public customer-facing QR storefront under `web/src/features/public-store/`.
- Register public store routes without `DashboardLayout`, `Sidebar`, `Topbar`, or auth guard.
- Use separated mock data, mock API adapter, hooks, utilities, pages, and presentational components.
- Preserve backend authority for final pricing, payment state, order creation, and invoice generation.
- Add utility tests for public store currency, phone normalization/masking, and display total calculations.
- Update lifecycle documentation and run available frontend/spec validation.

Validation:

- `npm --prefix web test`: passed, 26 tests.
- `npx eslint src/features/public-store test/public-store-utils.test.mjs` from `web/`: passed.
- `npm --prefix web run build`: passed with chunk-size warning.
- `npm run specs:check`: pending final validation in current session.

Known limitations and follow-ups:

- Live backend public storefront API integration.
- Real payment gateway redirect/session creation.
- Admin online store settings UI.
- Delivery fulfillment.
- Component tests require a DOM test runner; current frontend test tooling only covers pure Node tests.
