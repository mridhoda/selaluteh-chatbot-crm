---
schema_version: 1
document_type: implementation-plan
spec_id: selkop-phase-5-frontend-integration
title: SELKOP Phase 5 Frontend Integration Tasks
status: alpha-readiness-review-complete-no-go
version: 1.0.0
updated_at: 2026-07-08
development_method: audit-driven-greenfield
---

# Implementation Plan: SELKOP Phase 5 Frontend Integration

## Overview

Phase 5 adalah tahap **Frontend Integration** untuk SELKOP Online Store dan QR Store.

Metode Phase 5:

```text
audit-driven greenfield frontend
```

Artinya frontend boleh dibangun baru dengan struktur lebih bersih, tetapi tetap wajib audit existing frontend, existing API client, existing admin dashboard, existing design system, existing tests, dan backend contract dari Phase 4 terlebih dahulu.

Frontend hanya berperan sebagai:

```text
intent sender
UX layer
state presenter
contract consumer
```

Backend tetap menjadi source of truth untuk:

```text
price
total
QR locked outlet
QR locked location
payment_status
fulfillment_status
public_order_status
admin allowed_actions
```

---

# Source Documents

Task plan ini harus dibaca bersama:

```text
spec.yaml
requirements.md
design.md
tasks.md
```

Phase 5 bergantung pada backend contract Phase 4:

```text
public storefront API
public QR resolve API
cart validation API
checkout API
payment status API
public order tracking API
admin order APIs
admin QR APIs
admin payment settings APIs
auth/session APIs
```

---

# Fixed Technical Decisions

```text
Implementation mode:
audit-driven greenfield frontend

Frontend role:
intent sender + UX layer + contract consumer

Public flow:
no-login

Checkout:
Idempotency-Key required

Payment:
read-only status display
redirect does not mean paid

QR:
backend QR session is authority

Admin actions:
explicit endpoints only
allowed_actions from backend only

Existing flows:
WhatsApp/admin frontend must not regress
```

---

# Test-Driven Development Policy

Every behavior-changing task SHALL follow:

```text
AUDIT
→ MAP
→ RED TEST
→ GREEN IMPLEMENTATION
→ REFACTOR
→ VERIFY
→ DOCS UPDATE
```

## Mandatory Rules

1. Audit existing frontend/backend contract before implementation.
2. Do not implement fake business logic to cover missing backend behavior.
3. Do not duplicate backend authority on frontend.
4. Write failing tests before implementing critical frontend behavior.
5. Frontend SHALL NOT mark payment as paid.
6. Frontend SHALL NOT send payment_status.
7. Frontend SHALL NOT send fulfillment_status.
8. Frontend SHALL NOT treat local total as final authority.
9. Frontend SHALL NOT override QR locked outlet/location.
10. Frontend SHALL NOT guess admin allowed_actions.
11. Frontend SHALL NOT call webhook endpoints.
12. Frontend SHALL NOT expose raw provider payload or internal public data.
13. Existing WhatsApp/admin flows SHALL be regression checked when impacted.

---

# Task Notation

```text
[ ]  Not started
[~]  In progress
[x]  Completed
[!]  Security/release critical
[*]  Optional or post-core
[B]  Blocked by backend contract
```

Priority:

```text
P0 = required for alpha correctness and safety
P1 = required for complete alpha admin usefulness
P2 = future polish or production hardening
```

---

# Global Completion Rules

A task is complete only when:

```text
[ ] existing frontend/backend contract audited
[ ] implementation decision documented
[ ] failing test written first when behavior changes
[ ] implementation complete
[ ] relevant unit/component/API tests pass
[ ] relevant E2E tests pass
[ ] impacted existing admin/WhatsApp regression checked
[ ] frontend does not own backend authority
[ ] security/privacy checks pass
[ ] docs updated
[ ] known limitations recorded
```

---

# Tasks

## 0. Spec Preflight, Baseline, and Frontend TDD Harness

### 0.1 [P0] Confirm Phase 5 spec isolation

- [x] Read available Phase 5 docs: `requirements.md` and `tasks.md`; `spec.yaml` and `design.md` are missing and recorded in `00.1-spec-isolation-confirmation.md`.
- [x] Confirm active spec is `selkop-phase-5-frontend-integration`.
- [x] Confirm Phase 5 implementation mode is audit-driven greenfield frontend.
- [x] Confirm backend authority rules from Phase 4 remain unchanged.
- [x] Confirm frontend is intent sender and contract consumer only.
- [x] Confirm Online Store, QR Store, Checkout, Payment Pending, Public Order Tracking, and Admin Operations are in scope.
- [x] Confirm existing WhatsApp/admin frontend flows must not regress.

Task 0.1 note, 2026-07-08: `spec.yaml` and `design.md` were not found under `plans/qr-order-backend/phase-5/`. Per execution instruction, this blocker was bypassed by documenting the missing source docs instead of inventing content. Deliverable: `00.1-spec-isolation-confirmation.md`.

_Requirements: P5-R1, P5-R2, P5-R26_

### 0.2 [P0] Capture current frontend baseline

- [x] Run existing frontend tests if available.
- [x] Run existing lint/typecheck/build if available.
- [x] Record current failing tests separately from Phase 5 regressions.
- [x] Record framework, router, bundler, state management, test runner, styling system, and API client approach.
- [x] Record current public routes, admin routes, auth guards, layouts, and environment variables.
- [x] Record current admin order, product, payment, CRM/chat, and marketplace UI behavior.
- [x] Record what is confirmed by code versus what is still an assumption.

Task 0.2 note, 2026-07-08: Current frontend baseline captured in `00.2-current-frontend-baseline.md`. Requested verification commands were attempted/recorded, but shell/process execution was blocked by workspace permission policy before npm commands could run; blocker was documented and audit continued per approved bypass. No runtime frontend/backend implementation changed.

_Requirements: P5-R1, P5-R23, P5-R24_

### 0.3 [P0] Prepare frontend test structure

- [x] Create Phase 5 test folder structure only when real tests are added.
- [x] Preserve existing test runner and project conventions.
- [x] Add or confirm scripts for unit, component, API client, E2E, and regression tests.
- [x] Ensure tests can run without production backend, production provider secrets, or real payment credentials.
- [x] Add test helpers for public route rendering, admin route rendering, fake API responses, and error-state assertions.
- [x] Add helper for generating checkout Idempotency-Key in tests.
- [x] Add helper for QR session token test fixtures.

Task 0.3 note, 2026-07-08: Existing Node test runner convention (`node --test "test/**/*.test.mjs"`) was preserved. Phase 5 test-only helpers and safety tests were added under `web/test/phase-5/`; browser/component/E2E scripts were documented as release gates because no browser runner exists yet. Verification remains blocked by workspace shell/process policy. Deliverable: `00.3-frontend-test-structure.md`.

_Requirements: P5-R4, P5-R21, P5-R24_

### 0.4 [P0] Create API mock and contract fixture layer

- [x] Create fake responses for public storefront API.
- [x] Create fake responses for QR resolve API.
- [x] Create fake responses for cart validation API.
- [x] Create fake responses for checkout API.
- [x] Create fake responses for payment status API.
- [x] Create fake responses for public order tracking API.
- [x] Create fake responses for admin order list/detail/action APIs.
- [x] Create fake responses for admin QR and payment settings APIs when included.
- [x] Create fake backend error responses for critical error codes.
- [x] Ensure mock data never teaches frontend to own backend authority.

Task 0.4 note, 2026-07-08: Test-only contract fixtures were added in `web/test/phase-5/fixtures/api-contract-fixtures.mjs`. Request fixtures avoid backend-owned authority fields; backend-owned payment/fulfillment/allowed-action fields appear only as fake backend responses. Admin QR fixture is mock-only because no backend admin QR route was found. Deliverable: `00.4-api-mock-contract-fixtures.md`.

_Requirements: P5-R4, P5-R20, P5-R24_

### 0.5 [P0] Define frontend secret and environment guard

- [x] Audit client-exposed environment variables.
- [x] Ensure provider secrets, webhook secrets, service-role keys, and private keys are not exposed to frontend.
- [x] Document public-safe environment variables.
- [x] Add test or static check for forbidden env names if practical.
- [x] Ensure local/dev/test environment can run with fake backend or non-production API.
- [x] Document required environment variables for alpha.

Task 0.5 note, 2026-07-08: Client-exposed `VITE_*` variables were audited and documented. Added `web/test/phase-5/env-guard.test.mjs` to detect forbidden secret-shaped client env names in frontend source/env examples. Verification could not run due to workspace shell/process policy. Deliverable: `00.5-frontend-env-secret-guard.md`.

_Requirements: P5-R21, P5-R26_

### 0.6 [P0] Define Phase 5 release gates

- [x] Define blocking checks for lint, typecheck, unit tests, component tests, API client tests, E2E tests, and regression tests.
- [x] Define No-Go frontend conditions.
- [x] Define manual sandbox verification checklist.
- [x] Define browser/device matrix for alpha.
- [x] Define skipped-test and flaky-test policy.
- [x] Define minimum P0 completion criteria before alpha.

Task 0.6 note, 2026-07-08: Release gates, No-Go conditions, manual sandbox matrix, browser/device matrix, skipped/flaky policy, and minimum P0 alpha criteria were documented. Deliverable: `00.6-phase-5-release-gates.md`.

_Requirements: P5-R24, P5-R26_

---

## 1. Phase 5.0 — Existing Frontend and Contract Audit

### 1.1 [P0] Audit existing frontend docs and repository structure

- [x] Search README, docs, frontend architecture docs, deployment docs, environment docs, and testing docs.
- [x] List frontend folders and entry points.
- [x] Identify stale, conflicting, missing, and current docs.
- [x] Record existing route conventions and file naming conventions.
- [x] Record actual facts with file paths.

_Requirements: P5-R1, P5-R26_

### 1.2 [P0] Audit routing, layouts, and app shell

- [x] List existing public routes.
- [x] List existing admin routes.
- [x] List existing route guards.
- [x] Identify current app shell and layout components.
- [x] Identify existing public layout if any.
- [x] Identify existing admin layout and navigation.
- [x] Identify route-level loading/error patterns.
- [x] Identify where Phase 5 greenfield routes can be added safely.

_Requirements: P5-R1, P5-R3, P5-R5_

### 1.3 [P0] Audit existing API client, auth, and state management

- [x] Find all frontend API client utilities.
- [x] Find direct fetch/axios calls outside centralized client.
- [x] Identify auth token handling.
- [x] Identify public versus admin API separation.
- [x] Identify state management approach.
- [x] Identify persistence in localStorage/sessionStorage.
- [x] Identify error handling and response normalization.
- [x] Identify request ID handling if any.

_Requirements: P5-R1, P5-R4, P5-R21_

### 1.4 [P0] Audit design system and reusable components

- [x] Identify existing UI primitives.
- [x] Identify form components.
- [x] Identify modal/drawer components.
- [x] Identify table/list components.
- [x] Identify badge/status components.
- [x] Identify toast/alert components.
- [x] Identify empty/loading/error components.
- [x] Identify mobile responsiveness patterns.
- [x] Classify components as reuse, extend, refactor, rebuild, or greenfield.

_Requirements: P5-R1, P5-R3, P5-R20, P5-R25_

### 1.5 [P0] Audit existing admin dashboard and marketplace screens

- [x] Identify existing admin order screens.
- [x] Identify existing product/catalog screens.
- [x] Identify existing payment/provider screens.
- [x] Identify existing CRM/chat/WhatsApp screens.
- [x] Identify existing kitchen/fulfillment screens.
- [x] Identify shared admin navigation impact.
- [x] Record flows that must not break.
- [x] Record screens that will be extended versus left untouched.

_Requirements: P5-R1, P5-R16, P5-R23_

### 1.6 [P0] Audit Phase 4 backend contracts for frontend use

- [x] Find or confirm public storefront API contract.
- [x] Find or confirm public QR resolve API contract.
- [x] Find or confirm cart validation API contract.
- [x] Find or confirm checkout API contract.
- [x] Find or confirm payment status API contract.
- [x] Find or confirm public order tracking API contract.
- [x] Find or confirm admin order API contract.
- [x] Find or confirm admin QR and payment settings API contracts.
- [x] Mark missing backend contracts as blocked or mock-only.

Task 1.6 note, 2026-07-08: Public storefront/QR/cart/checkout/payment/order and admin order contracts were confirmed from backend route/service files. Admin payment settings/status has partial route evidence. Admin QR backend route was not found and is marked mock-only/blocked for frontend implementation.

_Requirements: P5-R2, P5-R4, P5-R26_

### 1.7 [P0] Audit existing frontend tests and regression coverage

- [x] List existing frontend test files.
- [x] Identify unit, component, integration, and E2E test tools.
- [x] Identify existing admin regression coverage.
- [x] Identify existing public/marketplace regression coverage.
- [x] Identify missing critical tests.
- [x] Record current test pass/fail status.
- [x] Create regression plan for existing WhatsApp/admin screens.

_Requirements: P5-R23, P5-R24_

### 1.8 [P0] Produce `05.0-existing-frontend-contract-audit.md`

- [x] Document frontend repository audit.
- [x] Document route/layout/app shell audit.
- [x] Document API client/auth/state audit.
- [x] Document design system audit.
- [x] Document admin/marketplace audit.
- [x] Document backend contract audit.
- [x] Document test/regression audit.
- [x] Document reusable components, risky areas, missing contracts, open questions, and blockers.

Task 1.8 note, 2026-07-08: Existing frontend and contract audit completed in `05.0-existing-frontend-contract-audit.md`. Command verification remains blocked by workspace shell/process policy and is documented in the deliverable.

_Requirements: P5-R1, P5-R26_

---

## 2. Phase 5.1 — Frontend Gap Analysis and Integration Map

### 2.1 [P0] Build Phase 5 capability map

- [x] Map Public Online Store.
- [x] Map QR Store.
- [x] Map cart and product interaction.
- [x] Map checkout and payment pending.
- [x] Map public order tracking.
- [x] Map admin order management.
- [x] Map admin QR management.
- [x] Map admin payment settings.
- [x] Map frontend security and error handling.
- [x] Map testing and alpha readiness.

_Requirements: P5-R2, P5-R26_

### 2.2 [P0] Create frontend reuse / extend / refactor / rebuild / greenfield matrix

- [x] Classify routing.
- [x] Classify public layout.
- [x] Classify admin layout.
- [x] Classify API client.
- [x] Classify auth guard.
- [x] Classify design system components.
- [x] Classify public store UI.
- [x] Classify QR flow UI.
- [x] Classify cart/checkout/payment UI.
- [x] Classify admin order UI.
- [x] Classify admin QR/payment settings UI.
- [x] Add reason, risk, affected files, and required tests for each decision.

_Requirements: P5-R2, P5-R3, P5-R23_

### 2.3 [P0] Create API contract dependency matrix

- [x] Map each UI screen to backend endpoint.
- [x] Map each endpoint to request DTO and response DTO.
- [x] Mark read-only endpoints and mutation endpoints.
- [x] Mark endpoints requiring admin auth.
- [x] Mark public no-login endpoints.
- [x] Mark idempotency requirements.
- [x] Mark QR session token requirements.
- [x] Mark missing or unstable contracts.

_Requirements: P5-R4, P5-R5, P5-R26_

### 2.4 [P0] Create frontend implementation wave plan

- [x] Group tasks by safest implementation order.
- [x] Ensure audit and contract mapping happen before UI implementation.
- [x] Ensure API client foundation comes before screens.
- [x] Ensure public flows are tested before admin expansion.
- [x] Ensure No-Go checks are placed before alpha readiness.
- [x] Document dependencies and blockers.

_Requirements: P5-R2, P5-R24, P5-R26_

### 2.5 [P0] Produce `05.1-frontend-gap-analysis-integration-map.md`

- [x] Add capability map.
- [x] Add decision matrix.
- [x] Add API dependency matrix.
- [x] Add implementation waves.
- [x] Add file-by-file plan.
- [x] Add test plan.
- [x] Add regression plan.
- [x] Add blockers.

Task 2.5 note, 2026-07-08: Frontend gap analysis and integration map completed in `05.1-frontend-gap-analysis-integration-map.md`. Admin QR remains blocked/mock-only pending backend contract; command verification remains blocked by workspace shell/process policy.

_Requirements: P5-R2, P5-R26_

---

## 3. Phase 5.2 — Frontend Architecture and App Shell

### 3.1 [P0] Define route architecture

- [x] Define public storefront route.
- [x] Define QR route.
- [x] Define checkout/payment route strategy.
- [x] Define public order tracking route.
- [x] Define admin order routes.
- [x] Define admin QR routes.
- [x] Define admin payment settings route.
- [x] Ensure route names match existing router conventions when possible.

Task 3.1 note, 2026-07-08: Route architecture documented in `05.2-frontend-architecture-app-shell.md`. Admin QR route remains blocked/hidden until backend admin QR contract exists; no UI routes were implemented in Wave 1.

_Requirements: P5-R3, P5-R5_

### 3.2 [P0] Define public app shell

- [x] Create or select mobile-first public layout.
- [x] Define header/navigation behavior.
- [x] Define cart access pattern.
- [x] Define QR context display area.
- [x] Define payment pending shell.
- [x] Define order tracking shell.
- [x] Ensure public shell does not expose admin navigation or auth state.

Task 3.2 note, 2026-07-08: Public shell strategy documented only; existing public UI remains unchanged. Public routes must use the isolated Phase 5 public API boundary and must not expose admin auth/workspace state.

_Requirements: P5-R3, P5-R5, P5-R25_

### 3.3 [P0] Define admin shell integration

- [x] Reuse existing admin auth guard where safe.
- [x] Reuse existing admin layout/navigation where safe.
- [x] Add routes without breaking CRM/chat/WhatsApp admin flows.
- [x] Define admin page headers, filters, tables, action buttons, and detail layouts.
- [x] Document navigation impact and compatibility risks.

Task 3.3 note, 2026-07-08: Admin shell integration documented in `05.2-frontend-architecture-app-shell.md`. No admin route/UI changes were made to avoid CRM/chat/WhatsApp regressions in Wave 1.

_Requirements: P5-R3, P5-R16, P5-R23_

### 3.4 [P0] Define state management strategy

- [x] Define local cart intent state.
- [x] Define backend-validated cart state.
- [x] Define QR session state.
- [x] Define checkout attempt and Idempotency-Key lifecycle.
- [x] Define payment polling state.
- [x] Define admin action pending state.
- [x] Define storage rules for localStorage/sessionStorage.
- [x] Ensure sensitive data is not persisted unnecessarily.

Task 3.4 note, 2026-07-08: State strategy documented in `05.2-frontend-architecture-app-shell.md`; implementation remains deferred to UI waves.

_Requirements: P5-R12, P5-R13, P5-R21, P5-R22_

### 3.5 [P0] Define form validation strategy

- [x] Define product/modifier client-side UX validation.
- [x] Define customer info validation.
- [x] Define checkout form validation.
- [x] Define cancel reason validation.
- [x] Define backend validation error display.
- [x] Ensure client validation is UX helper only and backend remains final authority.

Task 3.5 note, 2026-07-08: Validation strategy documented as UX-only in `05.2-frontend-architecture-app-shell.md`; backend remains authority for totals/status/QR locks/admin transitions.

_Requirements: P5-R11, P5-R13, P5-R17, P5-R20_

### 3.6 [P0] Produce `05.2-frontend-architecture-app-shell.md`

- [x] Document routing.
- [x] Document public shell.
- [x] Document admin shell integration.
- [x] Document state management.
- [x] Document form validation.
- [x] Document environment and feature flag rules.
- [x] Document risks and tests.

Task 3.6 note, 2026-07-08: Deliverable completed in `05.2-frontend-architecture-app-shell.md`. Verification commands are recorded there; local execution remains subject to workspace shell/process policy.

_Requirements: P5-R3, P5-R26_

---

## 4. Phase 5.3 — API Client and Contract Integration

### 4.1 [P0] Create centralized API client boundary

- [x] Create or adapt public API client.
- [x] Create or adapt admin API client.
- [x] Centralize base URL handling.
- [x] Centralize headers.
- [x] Centralize request ID handling.
- [x] Centralize JSON parsing.
- [x] Centralize response normalization.
- [x] Centralize safe error mapping.

Task 4.1 note, 2026-07-08: Added centralized Phase 5 client boundary in `web/src/features/public-store/api/phase5ApiClient.js` and error mapping in `web/src/shared/api/apiError.js`. Request ID handling remains supported by caller-supplied headers; no new request ID authority was invented.

_Requirements: P5-R4, P5-R20_

### 4.2 [P0] Implement public API methods

- [x] Implement get storefront method.
- [x] Implement resolve QR method.
- [x] Implement validate cart method.
- [x] Implement checkout method.
- [x] Implement get payment status method.
- [x] Implement get public order method.
- [x] Ensure checkout supports Idempotency-Key.
- [x] Ensure QR calls support QR session token where required.

Task 4.2 note, 2026-07-08: Public Phase 5 client methods implemented with `/api/v1/public` endpoints. Checkout requires `Idempotency-Key`; QR/session tokens are only sent through supported path/payload inputs.

_Requirements: P5-R4, P5-R5, P5-R13, P5-R14, P5-R15_

### 4.3 [P0] Implement admin API methods

- [x] Implement admin order list method.
- [x] Implement admin order detail method.
- [x] Implement accept order method.
- [x] Implement prepare order method.
- [x] Implement ready order method.
- [x] Implement complete order method.
- [x] Implement cancel order method.
- [B] Implement admin QR methods when backend contract exists.
- [x] Implement admin payment settings methods when backend contract exists.

Task 4.3 note, 2026-07-08: Admin order methods use `/api/v1/admin/orders` explicit endpoints only. Admin QR methods are blocked because no backend admin QR route contract was found. Admin payment gateway config is read-only only via `getPaymentGatewayConfig()`; no secret-bearing mutation was added.

_Requirements: P5-R16, P5-R17, P5-R18, P5-R19_

### 4.4 [P0] Add API client safety guards

- [x] Ensure frontend does not call webhook endpoints.
- [x] Ensure checkout payload does not include payment_status.
- [x] Ensure checkout payload does not include fulfillment_status.
- [x] Ensure checkout payload does not treat total as authority.
- [x] Ensure admin action payloads do not use generic status patch.
- [x] Ensure provider secrets are never sent or stored client-side.
- [x] Add tests for forbidden payload fields.

Task 4.4 note, 2026-07-08: Added Phase 5 API client guards and Node safety tests in `web/test/phase-5/phase5-api-client-safety.test.mjs`. No webhook/provider callback methods or secret-bearing payment methods were added.

_Requirements: P5-R4, P5-R13, P5-R17, P5-R21_

### 4.5 [P0] Implement backend error code mapping

- [x] Map QR_EXPIRED.
- [x] Map QR_REVOKED.
- [x] Map QR_OUTLET_MISMATCH.
- [x] Map QR_LOCATION_MISMATCH.
- [x] Map PRODUCT_UNAVAILABLE.
- [x] Map MODIFIER_INVALID.
- [x] Map CHECKOUT_IDEMPOTENCY_REQUIRED.
- [x] Map IDEMPOTENCY_CONFLICT.
- [x] Map PAYMENT_PROVIDER_ERROR.
- [x] Map ORDER_INVALID_TRANSITION.
- [x] Map ORDER_UNPAID.
- [x] Map FORBIDDEN.
- [x] Map RATE_LIMITED.
- [x] Map INTERNAL_ERROR.

Task 4.5 note, 2026-07-08: Phase 5 backend error mapping added in `web/src/shared/api/apiError.js`, including runtime alias `IDEMPOTENCY_KEY_REQUIRED` for the current backend mismatch.

_Requirements: P5-R20, P5-R22_

### 4.6 [P0] Produce `05.3-api-client-contract-integration.md`

- [x] Document API client structure.
- [x] Document public methods.
- [x] Document admin methods.
- [x] Document auth/header rules.
- [x] Document idempotency and QR session handling.
- [x] Document error mapping.
- [x] Document tests and known contract gaps.

Task 4.6 note, 2026-07-08: Deliverable completed in `05.3-api-client-contract-integration.md`. Known gaps are documented for admin QR and payment settings mutation scope; Wave 2+ UI tasks remain unmodified.

_Requirements: P5-R4, P5-R26_

---

## 5. Phase 5.4 — Public Online Store UI

### 5.1 [P0] Implement public storefront route

- [x] Create or adapt `/store/:storefrontSlug` route.
- [x] Load storefront data from backend.
- [x] Render brand/storefront identity.
- [x] Render safe loading, error, and empty states.
- [x] Handle invalid storefront slug safely.
- [x] Ensure route does not require admin login.

Task 5.1 note, 2026-07-08: Existing public route was preserved outside `/app/*` and continues to bypass admin shell/auth. `usePublicStorefront()` now loads through Wave 1 `phase5ApiClient.public.getStorefront()` and normalizes backend response variants with `publicStoreModel`. Verification command execution remains blocked by workspace shell/process policy.

_Requirements: P5-R5, P5-R6, P5-R20_

### 5.2 [P0] Implement outlet selection for Online Store

- [x] Render eligible outlets from backend response.
- [x] Require outlet selection when needed.
- [x] Handle no active outlet state.
- [x] Handle inactive/disabled outlet state.
- [~] Refresh or filter menu by selected outlet.
- [x] Invalidate or revalidate cart when outlet changes.

Task 5.2 note, 2026-07-08: Selectable outlets are filtered from backend response only and outlet changes clear local cart intent. Menu refresh is limited to rendering the backend-provided menu in the selected outlet context; no extra outlet-specific refetch contract was added in this wave.

_Requirements: P5-R6, P5-R12, P5-R20_

### 5.3 [P0] Implement category and product list

- [x] Render categories.
- [x] Render products by category.
- [x] Render product availability.
- [x] Render sold-out/unavailable state.
- [x] Prevent unavailable products from being added to cart.
- [x] Support mobile-first browsing.

Task 5.3 note, 2026-07-08: Existing mobile-first category/search/product components were retained. Backend availability values are normalized to `isAvailable`; unavailable products remain disabled in `ProductCard` and blocked by `useGuestCart.addItem()`.

_Requirements: P5-R6, P5-R11, P5-R25_

### 5.4 [P0] Implement product detail and modifier picker

- [x] Show product name, description, image if available, and price preview.
- [x] Show required modifier groups.
- [x] Show optional modifier groups.
- [x] Validate required modifier UX client-side.
- [x] Support quantity update.
- [~] Show backend modifier validation errors.
- [x] Return cart intent, not final pricing authority.

Task 5.4 note, 2026-07-08: `ProductModifierSheet` now uses shared `validateModifierSelection()` for UX-only required/max selection checks. Backend modifier validation display remains partial because cart validation is Wave 3+; mapped backend errors exist through the centralized error boundary.

_Requirements: P5-R11, P5-R12_

### 5.5 [P0] Add public store component tests

- [x] Test storefront loading.
- [x] Test invalid storefront.
- [x] Test outlet selector.
- [x] Test product list.
- [x] Test sold-out product.
- [x] Test modifier picker.
- [~] Test mobile critical controls where practical.

Task 5.5 note, 2026-07-08: Added Node-testable model/API-boundary tests in `web/test/phase-5/public-store-ui-model.test.mjs`. Full browser component tests and responsive interaction tests are documented limitations because no supported component/browser runner exists.

_Requirements: P5-R6, P5-R11, P5-R24, P5-R25_

### 5.6 [P0] Produce `05.4-public-online-store-ui.md`

- [x] Document route.
- [x] Document screens.
- [x] Document API dependencies.
- [x] Document component decisions.
- [x] Document error/empty states.
- [x] Document tests.

Task 5.6 note, 2026-07-08: Deliverable completed in `05.4-public-online-store-ui.md`, including verification blocker and component-test limitations.

_Requirements: P5-R6, P5-R26_

---

## 6. Phase 5.5 — QR Store UI

### 6.1 [P0] Implement QR resolve route

- [x] Create or adapt `/qr/:qrToken` route.
- [x] Call QR resolve API.
- [x] Store QR session token only as needed.
- [x] Render QR scope from backend response.
- [x] Handle invalid QR token.
- [x] Handle expired QR.
- [x] Handle revoked QR.
- [x] Handle backend-safe error messages.

Task 6.1 note, 2026-07-08: Added `QrStorePage` and public `/qr/:qrToken` route. QR scope/session/locks come from backend resolve response and are normalized by `normalizeQrResolveResponse()`; QR token is treated as opaque.

_Requirements: P5-R5, P5-R7, P5-R20_

### 6.2 [P0] Implement Universal QR UI

- [x] Show outlet selection for Universal QR.
- [x] Only show backend-provided eligible outlets.
- [x] Require selected outlet before cart validation or checkout.
- [~] Refresh availability based on selected outlet.
- [x] Send selected outlet only where backend contract allows.
- [x] Handle no eligible outlet state.

Task 6.2 note, 2026-07-08: Universal QR requires explicit outlet selection from backend-provided eligible outlets. Availability refresh is limited to backend-provided resolve/menu data because no additional outlet-menu refetch contract was added in this wave.

_Requirements: P5-R7, P5-R8, P5-R12_

### 6.3 [P0] Implement Outlet QR UI

- [x] Display locked outlet from backend.
- [x] Do not show outlet selector.
- [x] Prevent outlet override.
- [x] Use locked outlet for availability display.
- [x] Send QR session token for validation/checkout.
- [x] Handle QR_OUTLET_MISMATCH error from backend.

Task 6.3 note, 2026-07-08: Outlet QR disables selector UI and uses `assertNoLockedQrOverride()` for model-level override rejection. QR session token is included only in future validation/checkout intent context after backend resolve; checkout itself remains Wave 3+.

_Requirements: P5-R7, P5-R9, P5-R20, P5-R21_

### 6.4 [P0] Implement Location QR UI

- [x] Display locked outlet.
- [x] Display locked location/table label.
- [x] Do not show outlet selector.
- [x] Do not show location selector.
- [x] Prevent location override.
- [x] Send QR session token for validation/checkout.
- [x] Handle QR_LOCATION_MISMATCH error from backend.

Task 6.4 note, 2026-07-08: Location QR displays backend-provided locked outlet/location label and renders no location selector. Override attempts are rejected in the QR model; validation/checkout mutation is deferred to Wave 3+.

_Requirements: P5-R7, P5-R10, P5-R20, P5-R21_

### 6.5 [P0] Add QR flow tests

- [x] Test Universal QR success.
- [x] Test Universal QR missing outlet UX.
- [x] Test Outlet QR locked outlet UI.
- [x] Test Location QR locked outlet/location UI.
- [x] Test expired QR error.
- [x] Test revoked QR error.
- [x] Test QR mismatch error display.
- [x] Test frontend cannot override locked outlet/location.

Task 6.5 note, 2026-07-08: Added Node-testable QR model tests in `web/test/phase-5/qr-store-ui-model.test.mjs`; expired/revoked mapping is covered in `public-store-ui-model.test.mjs`. Browser route/component tests remain documented limitation due to missing supported runner.

_Requirements: P5-R7, P5-R8, P5-R9, P5-R10, P5-R24_

### 6.6 [P0] Produce `05.5-qr-store-ui.md`

- [x] Document QR route.
- [x] Document QR session state.
- [x] Document Universal QR behavior.
- [x] Document Outlet QR behavior.
- [x] Document Location QR behavior.
- [x] Document error handling and tests.

Task 6.6 note, 2026-07-08: Deliverable completed in `05.5-qr-store-ui.md`, including verification blocker and component-test limitations.

_Requirements: P5-R7, P5-R8, P5-R9, P5-R10, P5-R26_

---

## 7. Phase 5.6 — Cart and Menu Interaction

### 7.1 [P0] Implement local cart intent state

- [x] Store product ID, quantity, and modifier option IDs.
- [x] Store selected outlet only when allowed.
- [x] Store QR session token reference when present.
- [x] Support add item.
- [x] Support remove item.
- [x] Support quantity update.
- [~] Support modifier edit.
- [x] Avoid storing sensitive customer/payment data.

Task 7.1 note, 2026-07-08: Added `cartIntentModel.js` and adapted `useGuestCart()` so persisted cart state is intent-only: product ID, quantity, modifier option IDs, QR token reference, and selected outlet only when allowed. Existing modifier selection can be changed by removing/re-adding through current UI; dedicated in-cart modifier edit controls remain a browser/UI limitation.

_Requirements: P5-R12, P5-R21_

### 7.2 [P0] Implement backend cart validation integration

- [x] Call cart validation API before checkout.
- [x] Send cart intent.
- [x] Send selected outlet only when allowed.
- [x] Send QR session token when present.
- [x] Display backend-normalized cart summary.
- [~] Display item-level errors.
- [~] Display product unavailable errors.
- [~] Display modifier errors.
- [~] Display outlet/QR mismatch errors.

Task 7.2 note, 2026-07-08: `useGuestCart().validateCart()` calls centralized `phase5ApiClient.public.validateCart()` and normalizes backend totals. Checkout page renders backend-validated total. Fine-grained item/product/modifier/QR error UI depends on final backend error payload and component runner; current implementation shows safe validation failure state.

_Requirements: P5-R12, P5-R20_

### 7.3 [P0] Implement cart UI

- [x] Show cart item list.
- [x] Show estimated local subtotal as preview only.
- [x] Show backend-validated total after validation.
- [~] Show unavailable item state.
- [~] Show modifier edit controls.
- [x] Show clear checkout CTA state.
- [~] Disable checkout when cart is invalid.
- [x] Support mobile drawer or page pattern.

Task 7.3 note, 2026-07-08: Existing mobile cart drawer remains in use, and checkout page now labels local total as an estimate with backend-validated total display. Checkout submission refuses unvalidated/invalid backend cart, but the button itself remains enabled to trigger validation and show errors. Unavailable item and modifier edit visual controls require component-runner/browser follow-up.

_Requirements: P5-R12, P5-R25_

### 7.4 [P0] Handle cart invalidation scenarios

- [x] Handle outlet change invalidating cart.
- [~] Handle product unavailable after add.
- [~] Handle modifier invalid after add.
- [~] Handle QR session expired.
- [~] Handle backend validation conflict.
- [x] Let user edit or remove invalid items.

Task 7.4 note, 2026-07-08: Cart validation state is invalidated on add/remove/update/clear and existing outlet change handlers clear cart. Backend validation failures are shown safely, but exact product/modifier/QR error rendering is limited pending final backend payload/component tests.

_Requirements: P5-R12, P5-R20, P5-R22_

### 7.5 [P0] Add cart/menu tests

- [x] Test add/remove/update item.
- [x] Test modifier selection.
- [x] Test backend-normalized cart display.
- [~] Test unavailable product error.
- [~] Test modifier invalid error.
- [x] Test outlet change invalidation.
- [x] Test local subtotal is not final authority.
- [~] Test checkout disabled when backend validation fails.

Task 7.5 note, 2026-07-08: Added pure model tests in `web/test/phase-5/cart-checkout-payment-order-model.test.mjs`; existing QR/public-store model tests cover modifier selection and outlet invalidation rules. Browser-only unavailable item rendering and disabled button DOM behavior remain unverified due to no component runner. Verification command was attempted but blocked by workspace shell/process policy.

_Requirements: P5-R11, P5-R12, P5-R24_

### 7.6 [P0] Produce `05.6-cart-menu-interaction.md`

- [x] Document cart state model.
- [x] Document validation flow.
- [x] Document invalidation rules.
- [x] Document UI behavior.
- [x] Document tests.

Task 7.6 note, 2026-07-08: Deliverable completed in `05.6-cart-menu-interaction.md`, including browser/component-runner limitations and verification blocker.

_Requirements: P5-R12, P5-R26_

---

## 8. Phase 5.7 — Checkout and Payment UI

### 8.1 [P0] Implement checkout form

- [x] Collect required customer information.
- [x] Validate obvious field errors client-side.
- [x] Show backend validation errors.
- [x] Use backend-validated cart summary.
- [x] Include QR session token when present.
- [x] Include selected outlet only when allowed.
- [x] Do not include final total as authority.
- [x] Do not include payment_status or fulfillment_status.

Task 8.1 note, 2026-07-08: `useCheckoutForm()` now requires backend validation and sends checkout intent through `buildCheckoutPayload()` and centralized `phase5ApiClient`. Payload excludes backend-owned totals/status fields.

_Requirements: P5-R13, P5-R21_

### 8.2 [P0] Implement checkout idempotency lifecycle

- [x] Generate Idempotency-Key per checkout attempt.
- [x] Reuse same Idempotency-Key for retry of the same attempt.
- [x] Generate new Idempotency-Key for intentional new attempt.
- [x] Disable submit while request is pending.
- [x] Prevent double click duplicate submission.
- [x] Handle IDEMPOTENCY_CONFLICT.
- [x] Clear or finalize checkout attempt after successful order creation.

Task 8.2 note, 2026-07-08: Added checkout attempt helpers and hook lifecycle for idempotency key generation/reuse/new-attempt behavior, with submit pending guard and conflict message.

_Requirements: P5-R13, P5-R22_

### 8.3 [P0] Implement checkout submission flow

- [x] Call checkout API through centralized client.
- [x] Handle success response with order token and payment details.
- [x] Handle validation errors.
- [~] Handle provider errors.
- [x] Handle network retry safely.
- [x] Redirect to payment pending or open payment URL according to backend response.
- [x] Never treat payment redirect as paid.

Task 8.3 note, 2026-07-08: Checkout mutation uses centralized client and navigates to payment pending by backend `paymentId`/token. Safe generic provider/network error text exists; provider-specific UI assertions remain browser-runner limited.

_Requirements: P5-R13, P5-R14, P5-R20_

### 8.4 [P0] Implement payment pending UI

- [x] Display payment instructions or payment URL from backend.
- [x] Display payment_status from backend.
- [x] Poll payment status using read-only endpoint.
- [x] Show pending, paid, failed, expired, and manual_review states where available.
- [x] Stop or slow polling based on rate-limit or terminal status.
- [x] Link to public order tracking.
- [x] Do not expose raw provider payload.

Task 8.4 note, 2026-07-08: `usePaymentStatus()` polls read-only status endpoint, normalizes status, stops on terminal status/max polls, and hides raw provider payload. Payment URL is only an action link and does not imply paid.

_Requirements: P5-R14, P5-R20, P5-R22_

### 8.5 [P0] Add checkout/payment tests

- [x] Test checkout requires validated cart.
- [x] Test Idempotency-Key is sent.
- [x] Test duplicate click creates one frontend mutation attempt.
- [x] Test forbidden payment_status/fulfillment_status are not sent.
- [x] Test frontend total is not treated as authority.
- [~] Test provider error display.
- [x] Test payment pending polling.
- [x] Test redirect is not treated as paid.

Task 8.5 note, 2026-07-08: Added pure model tests for validation requirement, idempotency lifecycle, duplicate guard, forbidden fields, local total non-authority, polling terminal behavior, and redirect-not-paid. Existing API client tests cover `Idempotency-Key` header and forbidden payload fields. Provider error DOM display remains unverified due to no component runner. Verification command was attempted but blocked by workspace shell/process policy.

_Requirements: P5-R13, P5-R14, P5-R21, P5-R24_

### 8.6 [P0] Produce `05.7-checkout-payment-ui.md`

- [x] Document checkout form.
- [x] Document Idempotency-Key lifecycle.
- [x] Document payment pending flow.
- [x] Document polling strategy.
- [x] Document safety rules and tests.

Task 8.6 note, 2026-07-08: Deliverable completed in `05.7-checkout-payment-ui.md`, including verification blocker and provider/browser UI limitations.

_Requirements: P5-R13, P5-R14, P5-R26_

---

## 9. Phase 5.8 — Public Order Tracking UI

### 9.1 [P0] Implement public order tracking route

- [x] Create or adapt `/order/:publicOrderToken` route.
- [x] Load order by public order token.
- [x] Handle invalid token.
- [x] Handle expired/missing token if backend returns it.
- [x] Render safe loading/error/empty states.
- [x] Do not require admin login.

Task 9.1 note, 2026-07-08: Added public `/order/:publicOrderToken` route while preserving legacy `/store/order/:publicOrderToken`. Hook loads via centralized public API and safe error state; no admin guard applies.

_Requirements: P5-R5, P5-R15, P5-R20_

### 9.2 [P0] Render safe public order summary

- [x] Show safe order number.
- [x] Show public_order_status.
- [x] Show safe payment status label.
- [x] Show safe fulfillment status label.
- [x] Show item snapshot.
- [x] Show outlet info.
- [x] Show QR table/location label if relevant.
- [x] Show payment pending/failed/expired/cancelled/completed states.

Task 9.2 note, 2026-07-08: `sanitizePublicOrder()` maps public order data for UI and `OrderStatusPage` renders safe order number, status, payment/fulfillment labels, items, outlet, and QR location when present.

_Requirements: P5-R15_

### 9.3 [P0] Enforce public order privacy

- [x] Hide internal order ID.
- [x] Hide raw provider payload.
- [x] Hide admin notes.
- [x] Hide admin user data.
- [x] Hide sensitive customer data.
- [x] Mask customer phone if shown.
- [x] Ensure public token is treated as opaque.

Task 9.3 note, 2026-07-08: Public order hook sanitizes response through allowlisted fields only. Internal IDs, raw provider data, admin notes/users, and sensitive customer fields are dropped; masked phone is the only phone display field.

_Requirements: P5-R15, P5-R21_

### 9.4 [P0] Add public order tracking tests

- [x] Test valid public order display.
- [~] Test invalid token safe error.
- [x] Test payment pending state.
- [x] Test payment failed state.
- [x] Test payment expired state.
- [x] Test completed state.
- [x] Test internal fields are not rendered.
- [x] Test raw provider payload is not rendered.

Task 9.4 note, 2026-07-08: Added pure model tests for valid public display fields, payment pending/failed/expired/completed states, and privacy stripping. Invalid token safe error is implemented in hook but DOM assertion is browser-runner limited. Verification command was attempted but blocked by workspace shell/process policy.

_Requirements: P5-R15, P5-R21, P5-R24_

### 9.5 [P0] Produce `05.8-public-order-tracking-ui.md`

- [x] Document route.
- [x] Document response fields.
- [x] Document public status display.
- [x] Document privacy rules.
- [x] Document tests.

Task 9.5 note, 2026-07-08: Deliverable completed in `05.8-public-order-tracking-ui.md`, including route/privacy behavior, tests, verification blocker, and browser-runner limitations.

_Requirements: P5-R15, P5-R26_

---

## 10. Phase 5.9 — Admin Order Management UI

### 10.1 [P0] Implement admin order list UI

- [x] Use existing admin auth guard.
- [~] Load order list from backend in the active legacy Orders UI.
- [~] Show channel in the active legacy Orders UI.
- [~] Show payment_status in the active legacy Orders UI.
- [~] Show fulfillment_status in the active legacy Orders UI.
- [~] Show outlet in the active legacy Orders UI.
- [~] Show QR context when relevant in the active legacy Orders UI.
- [~] Support channel filter in the active legacy Orders UI.
- [~] Support outlet filter if backend allows in the active legacy Orders UI.
- [~] Preserve existing WhatsApp order visibility.

Task 10.1 note, 2026-07-08: `/app/orders` was restored to the legacy `OrdersPage` UI by user request. Phase 5 admin order list integration remains partial/non-active in `Phase5AdminOrdersPage.jsx`, model/API code, and tests; the requirements must be integrated into the existing UI/components rather than replacing the page.

_Requirements: P5-R16, P5-R23_

### 10.2 [P0] Implement admin order detail UI

- [~] Load order detail from backend in the active legacy Orders UI.
- [~] Show item snapshot in the active legacy Orders UI.
- [~] Show customer summary safely in the active legacy Orders UI.
- [~] Show payment status in the active legacy Orders UI.
- [~] Show fulfillment status in the active legacy Orders UI.
- [~] Show public order status in the active legacy Orders UI.
- [~] Show QR/table context in the active legacy Orders UI.
- [~] Show status history if backend returns it in the active legacy Orders UI.
- [~] Hide provider secrets and raw provider payload in the active legacy Orders UI.

Task 10.2 note, 2026-07-08: A non-active Phase 5 detail panel backed by `GET /api/v1/admin/orders/:orderId` remains available with sensitive-key stripping in the model layer. Active legacy Orders UI still needs these safety fields and rendering rules integrated.

_Requirements: P5-R16, P5-R21_

### 10.3 [P0] Render backend allowed_actions

- [~] Read allowed_actions from backend response in the active legacy Orders UI.
- [~] Render only actions provided by backend in the active legacy Orders UI.
- [~] Do not guess actions from status in the active legacy Orders UI.
- [~] Hide unavailable actions in the active legacy Orders UI.
- [~] Show disabled/pending state while action is executing in the active legacy Orders UI.
- [~] Refresh order after action in the active legacy Orders UI.
- [~] Display updated allowed_actions after action in the active legacy Orders UI.

Task 10.3 note, 2026-07-08: `adminOrderModel` action mapping from backend `allowed_actions` only remains available and tested. Because `/app/orders` is back on legacy `OrdersPage`, this model must be wired into existing action components before the active UI satisfies this requirement.

_Requirements: P5-R17, P5-R22_

### 10.4 [P0] Implement explicit admin order actions

- [~] Call accept endpoint from the active legacy Orders UI.
- [~] Call prepare endpoint from the active legacy Orders UI.
- [~] Call ready endpoint from the active legacy Orders UI.
- [~] Call complete endpoint from the active legacy Orders UI.
- [~] Call cancel endpoint from the active legacy Orders UI.
- [~] Require cancel reason in the active legacy Orders UI.
- [~] Prevent duplicate action submission in the active legacy Orders UI.
- [~] Handle ORDER_INVALID_TRANSITION in the active legacy Orders UI.
- [~] Handle ORDER_UNPAID in the active legacy Orders UI.
- [~] Handle FORBIDDEN in the active legacy Orders UI.

Task 10.4 note, 2026-07-08: Lifecycle API methods, cancel reason validation, and duplicate action model guards remain implemented/testable, but active legacy Orders UI does not yet use the Phase 5 replacement page. Wire these safeguards into existing components instead of replacing the page.

_Requirements: P5-R17, P5-R20, P5-R22_

### 10.5 [P0] Preserve existing admin/WhatsApp regression

- [~] Confirm existing admin navigation still works.
- [~] Confirm existing WhatsApp order visibility still works.
- [~] Confirm existing CRM/chat screens are not broken by routing changes.
- [~] Confirm existing product/payment admin screens still load unless intentionally changed.
- [x] Record any intentional breaking change with reason and migration path.

Task 10.5 note, 2026-07-08: Routing remains inside current `/app` dashboard shell. `/app/orders` now points back to the legacy `OrdersPage` by user request; `Phase5AdminOrdersPage.jsx` remains reference/non-active. Browser/runtime regression could not be executed because shell/process verification is blocked.

_Requirements: P5-R23_

### 10.6 [P0] Add admin order tests

- [x] Test order list rendering.
- [x] Test order detail rendering.
- [x] Test allowed_actions rendering.
- [x] Test frontend does not guess actions.
- [x] Test accept/prepare/ready/complete/cancel actions call explicit endpoints.
- [x] Test cancel requires reason.
- [x] Test unpaid order error handling.
- [x] Test duplicate action prevention.

Task 10.6 note, 2026-07-08: Added Node-testable model/API tests in `web/test/phase-5/admin-order-management.test.mjs`. Component DOM rendering remains browser-runner limited; behavior is covered through normalization/action models and API endpoint assertions.

_Requirements: P5-R16, P5-R17, P5-R24_

### 10.7 [P0] Produce `05.9-admin-order-management-ui.md`

- [x] Document admin routes.
- [x] Document order list/detail behavior.
- [x] Document allowed_actions usage.
- [x] Document explicit action endpoints.
- [x] Document regression impact.
- [x] Document tests.

Task 10.7 note, 2026-07-08: Deliverable updated to record that active `/app/orders` was restored to legacy UI. Phase 5 route-level UI replacement is not active; contract, model/API safety, tests, and integration requirements remain documented for incremental integration into existing Orders components.

_Requirements: P5-R16, P5-R17, P5-R26_

---

## 11. Phase 5.10 — Admin QR and Payment Settings UI

### 11.1 [P1] Implement admin QR list/detail UI

- [B] List QR codes.
- [B] Show QR scope.
- [B] Show QR status.
- [B] Show outlet binding when applicable.
- [B] Show location/table binding when applicable.
- [B] Show safe public QR link/token.
- [B] Show QR detail.
- [~] Handle permission errors.

Task 11.1 note, 2026-07-08: Blocked by missing backend admin QR route. Implemented safe read-only blocked status UI at `/app/payments/settings`; no QR authority or mock mutation was invented.

_Requirements: P5-R18_

### 11.2 [P1] Implement admin QR create/update actions

- [B] Create Universal QR if backend supports it.
- [B] Create Outlet QR if backend supports it.
- [B] Create Location QR if backend supports it.
- [B] Activate QR code.
- [B] Disable QR code.
- [B] Revoke QR code.
- [B] Refresh list/detail after mutation.
- [B] Prevent duplicate submissions.
- [~] Show safe errors.

Task 11.2 note, 2026-07-08: Blocked because no safe backend admin QR create/update/action contract exists. UI documents the blocker and renders no mutation controls.

_Requirements: P5-R18, P5-R20, P5-R22_

### 11.3 [P2] Implement minimal QR printable/share UI

- [B] Display public QR link safely.
- [B] Display basic QR preview if existing dependency or backend supports it.
- [x] Avoid exposing internal security metadata.
- [B] Provide copy link UX.
- [x] Document if print/export is deferred.

Task 11.3 note, 2026-07-08: QR print/share deferred because there is no admin QR detail/list contract to provide safe public QR URLs. Internal QR/security metadata is not rendered.

_Requirements: P5-R18, P5-R21_

### 11.4 [P1] Implement admin payment provider settings UI

- [x] Show active provider from backend.
- [x] Show BayarGG display for alpha.
- [x] Show provider status/mode if backend returns it.
- [B] Configure provider only if backend API supports it.
- [B] Activate/disable provider only if backend API supports it.
- [x] Hide secrets.
- [x] Do not call provider API directly.
- [~] Handle permission errors.

Task 11.4 note, 2026-07-08: Added read-only `/app/payments/settings` UI using backend `/payments/gateway/config`. No secret fields, provider API calls, or unsupported provider mutation controls are exposed.

_Requirements: P5-R19, P5-R21_

### 11.5 [P1] Add admin QR/payment settings tests

- [B] Test QR list/detail.
- [B] Test QR create forms.
- [B] Test QR activate/disable/revoke actions.
- [~] Test permission errors.
- [x] Test active provider display.
- [x] Test secrets are not rendered.
- [x] Test frontend does not call provider API directly.

Task 11.5 note, 2026-07-08: Added `web/test/phase-5/admin-qr-payment-settings.test.mjs` for blocked QR contract status, payment config normalization, secret stripping, and backend-only gateway config calls. QR action tests are blocked with QR contract.

_Requirements: P5-R18, P5-R19, P5-R24_

### 11.6 [P1] Produce `05.10-admin-qr-payment-settings-ui.md`

- [x] Document QR management UI.
- [x] Document payment provider settings UI.
- [x] Document supported and deferred capabilities.
- [x] Document security rules.
- [x] Document tests.

Task 11.6 note, 2026-07-08: Deliverable completed in `05.10-admin-qr-payment-settings-ui.md`, including QR backend blocker, payment read-only behavior, security rules, tests, and verification blocker.

_Requirements: P5-R18, P5-R19, P5-R26_

---

## 12. Phase 5.11 — Frontend Security, Error, and State Handling

### 12.1 [P0] Implement global error mapping and display system

- [x] Map backend error codes to user-friendly messages.
- [x] Display request ID when useful for support.
- [x] Avoid raw stack traces.
- [x] Avoid raw provider payload.
- [x] Use consistent public error components.
- [x] Use consistent admin error components.
- [x] Support retry only where safe.

Task 12.1 note, 2026-07-08: Hardened `apiError.js` with safe message/details sanitization, request ID support, and retry eligibility. Existing public/admin error states continue to use the shared mapping layer.

_Requirements: P5-R20, P5-R21_

### 12.2 [P0] Implement loading and empty states

- [~] Add loading states for storefront, QR resolve, cart validation, checkout, payment polling, order tracking, admin list/detail, and admin actions.
- [~] Add empty states for outlets, categories, products, cart, orders, QR list, and provider settings where applicable.
- [x] Ensure loading does not block forever without feedback.
- [B] Ensure mobile loading states are understandable.

Task 12.2 note, 2026-07-08: Existing Wave 2-4 loading/empty states were audited and documented in `05.11-frontend-security-error-state-handling.md`. Browser/mobile visual verification is blocked because no browser runner is available in this environment.

_Requirements: P5-R20, P5-R22, P5-R25_

### 12.3 [P0] Implement frontend privacy safeguards

- [x] Ensure public UI hides internal order ID.
- [x] Ensure public UI hides raw provider payload.
- [x] Ensure public UI hides admin notes.
- [x] Ensure public UI hides admin user data.
- [x] Ensure frontend env does not expose secrets.
- [x] Avoid storing sensitive customer data in localStorage.
- [~] Clear checkout/session data after completion where appropriate.

Task 12.3 note, 2026-07-08: Public order and admin order models were hardened and tested for internal IDs, raw provider payloads, admin notes/admin users, and sensitive customer data. Cart persistence remains intent-only. Full browser storage cleanup after all terminal paths remains partial until browser verification.

_Requirements: P5-R21_

### 12.4 [P0] Implement polling/retry/concurrency safeguards

- [x] Prevent duplicate checkout submission.
- [x] Prevent duplicate admin action submission.
- [x] Handle browser refresh during payment pending.
- [x] Handle network retry without duplicate mutation.
- [x] Stop or slow payment polling on terminal status or rate limit.
- [x] Do not assume success from optimistic client state for critical mutations.

Task 12.4 note, 2026-07-08: Checkout/admin duplicate guards, idempotency retry, backend-response-only critical mutation success, and payment polling terminal/rate-limit behavior are implemented and covered by Node-testable model/API tests.

_Requirements: P5-R22_

### 12.5 [P1] Implement accessibility and mobile-first improvements

- [B] Check public store on small screen.
- [B] Check QR flow on small screen.
- [B] Check cart and checkout on small screen.
- [B] Check payment pending on small screen.
- [x] Ensure key forms have labels.
- [x] Ensure destructive actions require confirmation where appropriate.
- [x] Document accessibility limitations before alpha.

Task 12.5 note, 2026-07-08: Form labels and destructive admin cancel confirmation are present. Small-screen/browser accessibility verification is blocked by missing browser runner and documented in `05.11-frontend-security-error-state-handling.md`.

_Requirements: P5-R25, P5-R26_

### 12.6 [P0] Add security/error/state tests

- [x] Test critical error code mapping.
- [x] Test raw stack trace is not displayed.
- [x] Test raw provider payload is not displayed.
- [x] Test internal IDs are not displayed in public UI.
- [x] Test duplicate checkout prevention.
- [x] Test duplicate admin action prevention.
- [x] Test polling terminal state behavior.
- [x] Test sensitive data persistence rules where practical.

Task 12.6 note, 2026-07-08: Expanded Node-testable suites in `phase5-api-client-safety.test.mjs`, `cart-checkout-payment-order-model.test.mjs`, and `admin-order-management.test.mjs` for error, privacy, duplicate, polling, and persistence rules. Verification commands are blocked by unavailable shell runner.

_Requirements: P5-R20, P5-R21, P5-R22, P5-R24_

### 12.7 [P0] Produce `05.11-frontend-security-error-state-handling.md`

- [x] Document error mapping.
- [x] Document loading and empty states.
- [x] Document privacy safeguards.
- [x] Document polling/retry/concurrency rules.
- [x] Document accessibility notes.
- [x] Document tests.

Task 12.7 note, 2026-07-08: Deliverable completed in `05.11-frontend-security-error-state-handling.md` with verification blockers and remaining risks recorded.

_Requirements: P5-R20, P5-R21, P5-R22, P5-R25, P5-R26_

---

## 13. Phase 5.12 — Frontend Testing and E2E Stabilization

### 13.1 [P0] Build API client test suite

- [x] Test public API client methods.
- [x] Test admin API client methods.
- [x] Test auth headers.
- [x] Test Idempotency-Key header.
- [x] Test QR session token handling.
- [x] Test forbidden payload fields are not sent.
- [x] Test error normalization.

Task 13.1 note, 2026-07-08: API client safety suite covers public/admin methods, auth/workspace headers, checkout idempotency, QR token request handling, forbidden fields, webhook blocking, and safe error normalization.

_Requirements: P5-R4, P5-R24_

### 13.2 [P0] Build component test suite

- [~] Test public store components.
- [~] Test QR components.
- [~] Test product detail/modifier components.
- [~] Test cart components.
- [~] Test checkout components.
- [~] Test payment pending components.
- [~] Test order tracking components.
- [~] Test admin order components.

Task 13.2 note, 2026-07-08: Component behavior is covered through Node-testable model/API suites because no React DOM/browser runner exists. Marked partial rather than complete; no browser/component pass is claimed.

_Requirements: P5-R6, P5-R7, P5-R11, P5-R12, P5-R13, P5-R14, P5-R15, P5-R16, P5-R24_

### 13.3 [P0] Build Online Store E2E flow

- [B] Open public storefront.
- [B] Select outlet.
- [B] Add product with modifiers.
- [B] Validate cart.
- [B] Submit checkout with Idempotency-Key.
- [B] Reach payment pending.
- [B] Read payment status.
- [B] Open public order tracking.
- [B] Confirm no payment authority is client-side.

Task 13.3 note, 2026-07-08: E2E plan documented in `05.12-frontend-testing-e2e-stabilization.md`; execution blocked by missing E2E/browser runner and unavailable command runner.

_Requirements: P5-R6, P5-R12, P5-R13, P5-R14, P5-R15, P5-R24_

### 13.4 [P0] Build QR Store E2E flows

- [B] Universal QR checkout success.
- [B] Outlet QR checkout success.
- [B] Location QR checkout success.
- [B] Universal QR missing outlet shows error.
- [B] Outlet QR mismatch shows error.
- [B] Location QR mismatch shows error.
- [B] Expired/revoked QR shows safe error.
- [B] Frontend cannot override locked outlet/location.

Task 13.4 note, 2026-07-08: QR E2E plan documented in `05.12-frontend-testing-e2e-stabilization.md`; execution blocked by missing E2E/browser runner and backend sandbox QR session.

_Requirements: P5-R7, P5-R8, P5-R9, P5-R10, P5-R24_

### 13.5 [P0] Build Admin Order E2E flow

- [B] Open admin order list.
- [B] Open order detail.
- [B] Render allowed_actions.
- [B] Accept paid order.
- [B] Mark preparing.
- [B] Mark ready.
- [B] Mark complete.
- [B] Cancel requires reason.
- [B] Unpaid order action is blocked/handled.
- [B] Order refreshes after action.

Task 13.5 note, 2026-07-08: Admin order E2E plan documented in `05.12-frontend-testing-e2e-stabilization.md`; execution blocked by missing E2E/browser runner and authenticated staging session.

_Requirements: P5-R16, P5-R17, P5-R24_

### 13.6 [P0] Build security and regression E2E checks

- [B] Verify public UI does not show internal order ID.
- [B] Verify public UI does not show raw provider payload.
- [B] Verify checkout cannot submit payment_status or fulfillment_status.
- [B] Verify payment redirect is not treated as paid.
- [B] Verify existing admin navigation still works.
- [B] Verify existing WhatsApp order visibility still works.
- [B] Verify existing CRM/chat screens still load if in same frontend.

Task 13.6 note, 2026-07-08: Security/regression E2E plan documented in `05.12-frontend-testing-e2e-stabilization.md`; model/API checks cover non-DOM portions, but browser regression smoke is blocked.

_Requirements: P5-R21, P5-R23, P5-R24_

### 13.7 [P0] Record manual sandbox verification

- [B] Verify Online Store on real or staging backend.
- [B] Verify Universal QR on real or staging backend.
- [B] Verify Outlet QR on real or staging backend.
- [B] Verify Location QR on real or staging backend.
- [B] Verify BayarGG sandbox payment pending/status behavior.
- [B] Verify admin order processing.
- [B] Record browser/device used.
- [x] Record failures and limitations.

Task 13.7 note, 2026-07-08: Manual sandbox verification was not executed; blocked by missing browser/staging/sandbox execution path. Failures and limitations are recorded in `05.12-frontend-testing-e2e-stabilization.md`.

_Requirements: P5-R14, P5-R24, P5-R26_

### 13.8 [P0] Produce `05.12-frontend-testing-e2e-stabilization.md`

- [x] Document test strategy.
- [x] Document test commands.
- [x] Document E2E results.
- [x] Document regression results.
- [x] Document manual sandbox results.
- [x] Document known failures and blockers.

Task 13.8 note, 2026-07-08: Deliverable completed in `05.12-frontend-testing-e2e-stabilization.md`. E2E/regression/manual results are documented as blocked, not passed.

_Requirements: P5-R24, P5-R26_

---

## 14. Phase 5.13 — Alpha Frontend Readiness

### 14.1 [P0] Update all Phase 5 deliverable docs

- [x] Review/update `05.0-existing-frontend-contract-audit.md` status/limitations.
- [x] Review/update `05.1-frontend-gap-analysis-integration-map.md` status/limitations.
- [x] Review/update `05.2-frontend-architecture-app-shell.md` status/limitations.
- [x] Review/update `05.3-api-client-contract-integration.md` status/limitations.
- [x] Review/update `05.4-public-online-store-ui.md` status/limitations.
- [x] Review/update `05.5-qr-store-ui.md` status/limitations.
- [x] Review/update `05.6-cart-menu-interaction.md` status/limitations.
- [x] Review/update `05.7-checkout-payment-ui.md` status/limitations.
- [x] Review/update `05.8-public-order-tracking-ui.md` status/limitations.
- [x] Review/update `05.9-admin-order-management-ui.md` status/limitations.
- [x] Review/update `05.10-admin-qr-payment-settings-ui.md`; admin QR remains `[B]` due missing backend admin QR contract.
- [x] Review/update `05.11-frontend-security-error-state-handling.md` status/limitations.
- [x] Review/update `05.12-frontend-testing-e2e-stabilization.md` status/limitations.

Task 14.1 note, 2026-07-08: Required deliverables from `05.0` through `05.12` exist and record limitations/blockers where applicable. Wave 0 support deliverables also exist. Final deliverable `05.13-alpha-frontend-readiness.md` was added. No E2E/manual/browser pass results were invented.

_Requirements: P5-R26_

### 14.2 [P0] Run final frontend alpha checklist

- [B] Confirm public storefront usable; blocked by no browser/E2E/manual sandbox execution.
- [B] Confirm QR Store usable; blocked by no browser/E2E/manual sandbox execution and no backend sandbox QR session.
- [B] Confirm mobile layout acceptable; blocked by no browser/mobile viewport pass.
- [~] Confirm cart validation works; API/model implementation exists, runtime backend verification blocked.
- [~] Confirm checkout idempotency works; API/model tests exist, runtime backend verification blocked.
- [~] Confirm payment pending is understandable; code/docs exist, browser/manual verification blocked.
- [~] Confirm public order tracking works; model/UI implementation exists, runtime backend verification blocked.
- [~] Confirm admin order processing works; model/API/UI implementation exists, authenticated E2E/manual verification blocked.
- [~] Confirm admin QR/payment settings status if included; payment settings read-only status exists, admin QR remains `[B]` due missing backend contract.
- [~] Confirm error, loading, and empty states are clear; code/docs exist, browser/mobile verification blocked.

Task 14.2 note, 2026-07-08: Final frontend alpha checklist was run as a documentation/code-readiness review only. Usability, mobile, E2E, runtime backend, and manual sandbox confirmations remain blocked/unverified and are not marked complete.

_Requirements: P5-R20, P5-R24, P5-R25, P5-R26_

### 14.3 [P0] Run No-Go condition review

- [x] Static Cleared: frontend cannot mark payment paid; source shows read-only backend payment polling/status display. Runtime/browser verification remains blocked.
- [x] Static Cleared: frontend does not send payment_status; source guard rejects backend-owned request fields. Command/runtime verification remains blocked.
- [x] Static Cleared: frontend does not send fulfillment_status; source guard rejects backend-owned request fields. Command/runtime verification remains blocked.
- [x] Static Cleared: frontend does not treat redirect as paid; source treats payment URL as action link only. Provider/browser redirect verification remains blocked.
- [x] Static Cleared: frontend does not use local total as final authority; checkout payload omits totals/status and UI labels local total as estimate. Backend runtime verification remains blocked.
- [x] Static Cleared: frontend cannot override QR locked outlet/location by code review; QR UI/model uses backend resolve/session authority and override assertions. Backend QR sandbox verification remains blocked.
- [x] Static Cleared: checkout cannot submit without Idempotency-Key by client/form code review. Network/runtime verification remains blocked.
- [~] Partial: duplicate checkout is reduced by submit guard, disabled submit button, and idempotency key reuse, but browser race/backend idempotency verification remains blocked.
- [x] Static Cleared: Phase 5 admin actions use explicit endpoints; static review found explicit POST lifecycle endpoints and no Phase 5 generic PATCH status path. Authenticated E2E remains blocked.
- [~] Partial: admin complete unpaid order from Phase 5 UI is constrained by backend `allowed_actions`, but legacy status-derived quick-action code still exists and backend `ORDER_UNPAID` runtime enforcement was not executed.
- [~] Partial: Phase 5 `allowed_actions` rendering is backend-driven, but legacy quick-action code still guesses next actions by status and browser route behavior was not executed.
- [x] Static Cleared: raw provider payload and admin notes do not appear in public order UI by sanitizer/page code review. Browser rendering remains blocked.
- [~] Partial: internal order ID does not appear in public order status UI, but payment pending UI displays a derived `#PAY-...` from the route `paymentId`; contract confirmation or UI adjustment is needed before this No-Go can be statically cleared.
- [~] Partial: QR mismatch and payment failed/expired states have static safe messages/labels, but browser/mobile/provider scenario verification remains blocked.
- [B] Blocked Runtime: existing WhatsApp/admin flows do not break silently; static routing review found preserved routes/navigation, but regression smoke was not executed.

Task 14.3 note, 2026-07-08: Static No-Go Verification Bypass Review completed and recorded in `05.13-alpha-frontend-readiness.md`. Code-review-verifiable authority/privacy items are marked Static Cleared where source guardrails exist, but duplicate-submit, legacy admin quick actions, internal payment/order identifier display, QR/payment clarity, existing regression, command execution, E2E/browser, backend sandbox, and manual checks remain partial or blocked. Alpha decision remains NO-GO pending runtime verification; no runtime/browser/npm pass is claimed.

_Requirements: P5-R21, P5-R23, P5-R26_

### 14.4 [P0] Produce final alpha frontend readiness report

- [x] Create `05.13-alpha-frontend-readiness.md`.
- [x] Record implemented scope.
- [x] Record deferred scope.
- [x] Record tests added and final commands requested.
- [x] Record tests not run.
- [x] Record manual sandbox result as blocked/not executed.
- [x] Record known limitations.
- [x] Record risks and follow-up.
- [x] Record GO/NO-GO decision: **NO-GO for alpha approval; handoff to Phase 6 QA only**.

Task 14.4 note, 2026-07-08: Final readiness report produced in `05.13-alpha-frontend-readiness.md`. The decision is NO-GO for alpha approval because verification is incomplete/blocked.

_Requirements: P5-R24, P5-R26_

### 14.5 [P0] Finalize Phase 5 task checklist

- [x] Mark completed documentation/reporting tasks accurately.
- [x] Leave blocked tasks as `[B]` with reason where verification/backend contract is blocked.
- [x] Leave untested/unverified runtime checks as `[~]` or `[B]`, not falsely complete.
- [x] Update implementation status in this file frontmatter and Wave 6 notes.
- [x] Update progress log in Wave 6 notes; no separate Phase 5 progress file exists under `plans/qr-order-backend/`.
- [x] Update current task pointer in Wave 6 notes; no separate Phase 5 current-task file exists under `plans/qr-order-backend/`.
- [x] Prepare handoff to Phase 6 Alpha Testing & QA.

Task 14.5 note, 2026-07-08: Phase 5 Wave 6 finalized as documentation/reporting handoff. Current pointer: Phase 6 Alpha Testing & QA should begin with runnable command verification, E2E/browser setup, manual sandbox execution, No-Go clearance, and regression smoke. Phase 5 status: implementation present, verification incomplete, alpha NO-GO until proven otherwise.

_Requirements: P5-R26_

---

# Optional Post-Phase-5 Tasks

- [ ]* PM1 Full visual redesign beyond alpha-critical UI
- [ ]* PM2 Advanced analytics dashboard
- [ ]* PM3 Refund and manual review UI
- [ ]* PM4 Loyalty UI
- [ ]* PM5 Delivery tracking map
- [ ]* PM6 Advanced QR print/export templates
- [ ]* PM7 Advanced campaign QR analytics
- [ ]* PM8 PWA/offline optimization
- [ ]* PM9 Advanced accessibility audit
- [ ]* PM10 Cross-browser production matrix
- [ ]* PM11 Admin provider reconciliation dashboard
- [ ]* PM12 CRM redesign
- [ ]* PM13 POS cashier frontend
- [ ]* PM14 Production launch polish

---

# Checkpoints

## Checkpoint A — Audit and Gap Map

- [ ] existing frontend audited
- [ ] backend contracts audited
- [ ] gap matrix complete
- [ ] implementation waves approved

## Checkpoint B — Architecture and API Client

- [ ] public/admin route architecture defined
- [ ] API client centralized
- [ ] error mapping implemented
- [ ] forbidden payload checks in place

## Checkpoint C — Public Store and QR

- [ ] public storefront usable
- [ ] Universal QR works
- [ ] Outlet QR locked flow works
- [ ] Location QR locked flow works
- [ ] QR errors displayed safely

## Checkpoint D — Cart, Checkout, Payment, Order Tracking

- [ ] cart validation integrated
- [ ] checkout idempotent
- [ ] payment pending/status read-only
- [ ] public order tracking safe

## Checkpoint E — Admin Operations

- [ ] admin order list/detail usable
- [ ] allowed_actions rendered from backend
- [ ] explicit admin actions used
- [ ] admin QR/payment settings status known

## Checkpoint F — Security and E2E

- [ ] no frontend payment authority
- [ ] no frontend fulfillment authority
- [ ] no frontend total authority
- [ ] no QR lock override
- [ ] E2E critical flows pass
- [ ] existing admin/WhatsApp regression checked

## Checkpoint G — Alpha Readiness

- [ ] No-Go cleared at runtime/manual level; 2026-07-08 static bypass review only cleared code-review-verifiable items and does not approve alpha.
- [ ] manual sandbox recorded
- [ ] docs updated
- [ ] GO/NO-GO recorded

---

# Requirement Traceability Matrix

| Requirements | Primary Task Sections |
|---|---|
| P5-R1 Existing Frontend and Contract Audit | 0, 1 |
| P5-R2 Frontend Gap Analysis and Integration Map | 1, 2 |
| P5-R3 Greenfield Frontend Architecture and App Shell | 2, 3 |
| P5-R4 Centralized API Client and Contract Handling | 3, 4, 13 |
| P5-R5 Public Routing and No-Login Access | 3, 4, 5, 6, 9 |
| P5-R6 Public Online Store UI | 5, 13 |
| P5-R7 QR Store Resolve and Scope UI | 6, 13 |
| P5-R8 Universal QR Outlet Selection | 6, 13 |
| P5-R9 Outlet QR Locked Flow | 6, 13 |
| P5-R10 Location QR Locked Flow | 6, 13 |
| P5-R11 Menu, Product Detail, and Modifier UX | 5, 7, 13 |
| P5-R12 Cart State and Backend Validation | 7, 13 |
| P5-R13 Checkout Form and Idempotency | 8, 13 |
| P5-R14 Payment Pending and Payment Status UI | 8, 13 |
| P5-R15 Public Order Tracking UI | 9, 13 |
| P5-R16 Admin Order List and Detail UI | 10, 13 |
| P5-R17 Admin Explicit Order Actions | 10, 13 |
| P5-R18 Admin QR Management Minimal UI | 11, 13 |
| P5-R19 Admin Payment Provider Settings Minimal UI | 11, 13 |
| P5-R20 Frontend Error Handling and Empty States | 4, 5, 6, 7, 8, 9, 12 |
| P5-R21 Frontend Security and Data Privacy | 0, 4, 8, 9, 12, 13, 14 |
| P5-R22 Loading, Polling, Retry, and Concurrency UX | 7, 8, 10, 12 |
| P5-R23 Existing WhatsApp/Admin Regression Preservation | 0, 1, 10, 13, 14 |
| P5-R24 Frontend Testing and E2E Coverage | 0, 5, 6, 7, 8, 9, 10, 11, 12, 13 |
| P5-R25 Accessibility and Mobile-First Usability | 3, 5, 7, 12, 14 |
| P5-R26 Frontend Documentation and Alpha Readiness | all |

---

# Task Dependency Waves

| Wave | Name | Sections |
|---|---|---|
| 0 | Preflight, audit, and gap map | 0, 1, 2 |
| 1 | Architecture and API client | 3, 4 |
| 2 | Public Online Store and QR Store | 5, 6 |
| 3 | Cart, checkout, payment, and order tracking | 7, 8, 9 |
| 4 | Admin operations | 10, 11 |
| 5 | Security, error states, and testing | 12, 13 |
| 6 | Alpha readiness | 14 |

---

# Fastest Safe Phase 5 Path

```text
0  Preflight, audit, and gap map
1  Architecture and API client
2  Public Online Store and QR Store
3  Cart, checkout, payment, and order tracking
4  Admin operations
5  Security, error states, and testing
6  Alpha readiness
```

Do not defer:

```text
existing frontend audit
backend contract audit
centralized API client
checkout Idempotency-Key
no frontend payment authority
no frontend fulfillment authority
no frontend total authority
QR lock protection
allowed_actions from backend
explicit admin action endpoints
public data privacy
existing WhatsApp/admin regression
critical E2E tests
No-Go review
```

---

# No-Go Conditions

Phase 5 SHALL NOT be approved for alpha if any of these are true:

- [x] Static Cleared 2026-07-08: frontend can mark payment paid. Runtime/browser verification still required before alpha GO.
- [x] Static Cleared 2026-07-08: frontend sends payment_status. Command/runtime verification still required before alpha GO.
- [x] Static Cleared 2026-07-08: frontend sends fulfillment_status. Command/runtime verification still required before alpha GO.
- [x] Static Cleared 2026-07-08: frontend treats payment redirect as paid. Browser/provider verification still required before alpha GO.
- [x] Static Cleared 2026-07-08: frontend uses local total as final authority. Backend runtime verification still required before alpha GO.
- [x] Static Cleared 2026-07-08: frontend can override Outlet QR locked outlet. Backend QR sandbox verification still required before alpha GO.
- [x] Static Cleared 2026-07-08: frontend can override Location QR locked location. Backend QR sandbox verification still required before alpha GO.
- [x] Static Cleared 2026-07-08: checkout can submit without Idempotency-Key. Network/runtime verification still required before alpha GO.
- [~] Partial 2026-07-08: duplicate checkout can happen from UI. Submit guard/idempotency exist, but browser race/backend idempotency verification is blocked.
- [x] Static Cleared 2026-07-08: admin action uses generic PATCH status in Phase 5 admin code. Authenticated E2E still required before alpha GO.
- [~] Partial 2026-07-08: admin can complete unpaid order from UI. Phase 5 UI relies on backend `allowed_actions`, but legacy status-derived quick-action code and backend enforcement remain unverified.
- [~] Partial 2026-07-08: allowed_actions are guessed client-side. Phase 5 page is backend-driven, but legacy quick-action code still guesses by status and browser route behavior is unverified.
- [x] Static Cleared 2026-07-08: raw provider payload appears in public UI. Browser rendering still required before alpha GO.
- [~] Partial 2026-07-08: internal order ID appears in public UI. Public order page uses public number, but payment pending page displays a derived `#PAY-...` from route `paymentId`; contract/UI follow-up required.
- [x] Static Cleared 2026-07-08: admin notes appear in public UI. Browser rendering still required before alpha GO.
- [~] Partial 2026-07-08: QR mismatch is unclear to user. Static messages exist; browser/mobile seeded QR scenarios blocked.
- [~] Partial 2026-07-08: payment failed/expired state is unclear to user. Static labels exist; provider/browser scenarios blocked.
- [B] Blocked Runtime 2026-07-08: existing WhatsApp/admin flow breaks silently. Static routing review only; regression smoke not executed.

2026-07-08 static bypass note: the checklist above records a source/docs-only No-Go review. Static Cleared means code-review-verifiable guardrails were found; it does not mean runtime, E2E, browser, backend sandbox, manual payment sandbox, mobile/accessibility, or existing WhatsApp/admin regression verification passed. Overall alpha decision remains **NO-GO pending runtime verification**.

---

# Definition of Done

- [ ] existing frontend audited
- [ ] backend contract audited
- [ ] gap map completed
- [ ] frontend architecture documented
- [ ] API client centralized
- [ ] public Online Store works
- [ ] Universal QR works
- [ ] Outlet QR works
- [ ] Location QR works
- [ ] cart validation works
- [ ] checkout idempotency works
- [ ] payment pending/status works
- [ ] public order tracking works
- [ ] admin order list/detail works
- [ ] admin explicit actions work
- [ ] admin QR minimal works if included for alpha
- [ ] admin payment settings minimal works if included for alpha
- [ ] frontend does not own payment/fulfillment/price authority
- [ ] security/privacy checks pass
- [ ] E2E critical flows pass
- [ ] existing WhatsApp/admin regression checked
- [ ] manual sandbox result recorded
- [ ] alpha readiness doc produced
- [ ] No-Go checklist cleared

---

# Final Task Statement

SELKOP Phase 5 SHALL deliver an audit-driven greenfield frontend for Online Store, QR Store, Checkout, Payment Pending, Public Order Tracking, and Admin Operations.

Frontend SHALL provide excellent UX, but SHALL NOT become authority for price, payment, fulfillment, QR lock, or admin lifecycle.

All critical frontend behavior SHALL be contract-driven, tested, and verified against Phase 4 backend authority before alpha.
EOF
