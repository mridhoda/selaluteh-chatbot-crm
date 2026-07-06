# Tasks: SelaluTeh Public Storefront QR Guest Checkout

## Phase 0 — Audit And Activation

- [x] PSF-T001 [P0] Audit frontend routing, layouts, API client, utility, UI component, and feature folder patterns.
- [x] PSF-T002 [P0] Activate lifecycle spec and point `current-task.md` to public storefront implementation.

## Phase 1 — Modular Static UI

- [x] PSF-T003 [P0] Create `web/src/features/public-store/` folder structure with typed JS/JSDoc-ready boundaries.
- [x] PSF-T004 [P0] Add public store types, mock data, utilities, and mock API adapter.
- [x] PSF-T005 [P0] Add public store layout, storefront, checkout, payment pending, and order status pages.
- [x] PSF-T006 [P0] Register public routes without auth/admin dashboard layout.

## Phase 2 — Local Interaction

- [x] PSF-T007 [P0] Implement category/search filtering, product modifier sheet, quantity stepper, and cart drawer.
- [x] PSF-T008 [P0] Implement checkout validation and mock payment/order navigation.
- [x] PSF-T009 [P1] Implement loading, empty, error, unavailable, and basic accessibility states.

## Phase 3 — Verification And Documentation

- [x] PSF-T010 [P1] Add tests supported by current frontend tooling.
- [x] PSF-T011 [P0] Run build/test/spec checks and update lifecycle documentation.
- [x] PSF-T012 [P0] Update Phase 1 storefront to allow free pickup outlet selection and compact menu cards.

## Validation Notes

- `npm --prefix web test`: 26 pass, 0 fail.
- `npx eslint src/features/public-store test/public-store-utils.test.mjs` from `web/`: passed.
- `npm --prefix web run build`: passed with existing chunk-size warning.
- Full `npm --prefix web run lint` remains blocked by pre-existing errors outside `features/public-store`, including service worker globals, legacy hook-order issues, no-control-regex rules, and unescaped entity rules.
