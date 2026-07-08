---
schema_version: 1
document_type: implementation-plan
spec_id: selkop-phase-5-frontend-integration
title: SELKOP Phase 5 Frontend Integration Tasks
status: draft
version: 1.0.0
updated_at: 2026-07-07
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

- [ ] Read Phase 5 `spec.yaml`, `requirements.md`, `design.md`, and `tasks.md`.
- [ ] Confirm active spec is `selkop-phase-5-frontend-integration`.
- [ ] Confirm Phase 5 implementation mode is audit-driven greenfield frontend.
- [ ] Confirm backend authority rules from Phase 4 remain unchanged.
- [ ] Confirm frontend is intent sender and contract consumer only.
- [ ] Confirm Online Store, QR Store, Checkout, Payment Pending, Public Order Tracking, and Admin Operations are in scope.
- [ ] Confirm existing WhatsApp/admin frontend flows must not regress.

_Requirements: P5-R1, P5-R2, P5-R26_

### 0.2 [P0] Capture current frontend baseline

- [ ] Run existing frontend tests if available.
- [ ] Run existing lint/typecheck/build if available.
- [ ] Record current failing tests separately from Phase 5 regressions.
- [ ] Record framework, router, bundler, state management, test runner, styling system, and API client approach.
- [ ] Record current public routes, admin routes, auth guards, layouts, and environment variables.
- [ ] Record current admin order, product, payment, CRM/chat, and marketplace UI behavior.
- [ ] Record what is confirmed by code versus what is still an assumption.

_Requirements: P5-R1, P5-R23, P5-R24_

### 0.3 [P0] Prepare frontend test structure

- [ ] Create Phase 5 test folder structure only when real tests are added.
- [ ] Preserve existing test runner and project conventions.
- [ ] Add or confirm scripts for unit, component, API client, E2E, and regression tests.
- [ ] Ensure tests can run without production backend, production provider secrets, or real payment credentials.
- [ ] Add test helpers for public route rendering, admin route rendering, fake API responses, and error-state assertions.
- [ ] Add helper for generating checkout Idempotency-Key in tests.
- [ ] Add helper for QR session token test fixtures.

_Requirements: P5-R4, P5-R21, P5-R24_

### 0.4 [P0] Create API mock and contract fixture layer

- [ ] Create fake responses for public storefront API.
- [ ] Create fake responses for QR resolve API.
- [ ] Create fake responses for cart validation API.
- [ ] Create fake responses for checkout API.
- [ ] Create fake responses for payment status API.
- [ ] Create fake responses for public order tracking API.
- [ ] Create fake responses for admin order list/detail/action APIs.
- [ ] Create fake responses for admin QR and payment settings APIs when included.
- [ ] Create fake backend error responses for critical error codes.
- [ ] Ensure mock data never teaches frontend to own backend authority.

_Requirements: P5-R4, P5-R20, P5-R24_

### 0.5 [P0] Define frontend secret and environment guard

- [ ] Audit client-exposed environment variables.
- [ ] Ensure provider secrets, webhook secrets, service-role keys, and private keys are not exposed to frontend.
- [ ] Document public-safe environment variables.
- [ ] Add test or static check for forbidden env names if practical.
- [ ] Ensure local/dev/test environment can run with fake backend or non-production API.
- [ ] Document required environment variables for alpha.

_Requirements: P5-R21, P5-R26_

### 0.6 [P0] Define Phase 5 release gates

- [ ] Define blocking checks for lint, typecheck, unit tests, component tests, API client tests, E2E tests, and regression tests.
- [ ] Define No-Go frontend conditions.
- [ ] Define manual sandbox verification checklist.
- [ ] Define browser/device matrix for alpha.
- [ ] Define skipped-test and flaky-test policy.
- [ ] Define minimum P0 completion criteria before alpha.

_Requirements: P5-R24, P5-R26_

---

## 1. Phase 5.0 — Existing Frontend and Contract Audit

### 1.1 [P0] Audit existing frontend docs and repository structure

- [ ] Search README, docs, frontend architecture docs, deployment docs, environment docs, and testing docs.
- [ ] List frontend folders and entry points.
- [ ] Identify stale, conflicting, missing, and current docs.
- [ ] Record existing route conventions and file naming conventions.
- [ ] Record actual facts with file paths.

_Requirements: P5-R1, P5-R26_

### 1.2 [P0] Audit routing, layouts, and app shell

- [ ] List existing public routes.
- [ ] List existing admin routes.
- [ ] List existing route guards.
- [ ] Identify current app shell and layout components.
- [ ] Identify existing public layout if any.
- [ ] Identify existing admin layout and navigation.
- [ ] Identify route-level loading/error patterns.
- [ ] Identify where Phase 5 greenfield routes can be added safely.

_Requirements: P5-R1, P5-R3, P5-R5_

### 1.3 [P0] Audit existing API client, auth, and state management

- [ ] Find all frontend API client utilities.
- [ ] Find direct fetch/axios calls outside centralized client.
- [ ] Identify auth token handling.
- [ ] Identify public versus admin API separation.
- [ ] Identify state management approach.
- [ ] Identify persistence in localStorage/sessionStorage.
- [ ] Identify error handling and response normalization.
- [ ] Identify request ID handling if any.

_Requirements: P5-R1, P5-R4, P5-R21_

### 1.4 [P0] Audit design system and reusable components

- [ ] Identify existing UI primitives.
- [ ] Identify form components.
- [ ] Identify modal/drawer components.
- [ ] Identify table/list components.
- [ ] Identify badge/status components.
- [ ] Identify toast/alert components.
- [ ] Identify empty/loading/error components.
- [ ] Identify mobile responsiveness patterns.
- [ ] Classify components as reuse, extend, refactor, rebuild, or greenfield.

_Requirements: P5-R1, P5-R3, P5-R20, P5-R25_

### 1.5 [P0] Audit existing admin dashboard and marketplace screens

- [ ] Identify existing admin order screens.
- [ ] Identify existing product/catalog screens.
- [ ] Identify existing payment/provider screens.
- [ ] Identify existing CRM/chat/WhatsApp screens.
- [ ] Identify existing kitchen/fulfillment screens.
- [ ] Identify shared admin navigation impact.
- [ ] Record flows that must not break.
- [ ] Record screens that will be extended versus left untouched.

_Requirements: P5-R1, P5-R16, P5-R23_

### 1.6 [P0] Audit Phase 4 backend contracts for frontend use

- [ ] Find or confirm public storefront API contract.
- [ ] Find or confirm public QR resolve API contract.
- [ ] Find or confirm cart validation API contract.
- [ ] Find or confirm checkout API contract.
- [ ] Find or confirm payment status API contract.
- [ ] Find or confirm public order tracking API contract.
- [ ] Find or confirm admin order API contract.
- [ ] Find or confirm admin QR and payment settings API contracts.
- [ ] Mark missing backend contracts as blocked or mock-only.

_Requirements: P5-R2, P5-R4, P5-R26_

### 1.7 [P0] Audit existing frontend tests and regression coverage

- [ ] List existing frontend test files.
- [ ] Identify unit, component, integration, and E2E test tools.
- [ ] Identify existing admin regression coverage.
- [ ] Identify existing public/marketplace regression coverage.
- [ ] Identify missing critical tests.
- [ ] Record current test pass/fail status.
- [ ] Create regression plan for existing WhatsApp/admin screens.

_Requirements: P5-R23, P5-R24_

### 1.8 [P0] Produce `05.0-existing-frontend-contract-audit.md`

- [ ] Document frontend repository audit.
- [ ] Document route/layout/app shell audit.
- [ ] Document API client/auth/state audit.
- [ ] Document design system audit.
- [ ] Document admin/marketplace audit.
- [ ] Document backend contract audit.
- [ ] Document test/regression audit.
- [ ] Document reusable components, risky areas, missing contracts, open questions, and blockers.

_Requirements: P5-R1, P5-R26_

---

## 2. Phase 5.1 — Frontend Gap Analysis and Integration Map

### 2.1 [P0] Build Phase 5 capability map

- [ ] Map Public Online Store.
- [ ] Map QR Store.
- [ ] Map cart and product interaction.
- [ ] Map checkout and payment pending.
- [ ] Map public order tracking.
- [ ] Map admin order management.
- [ ] Map admin QR management.
- [ ] Map admin payment settings.
- [ ] Map frontend security and error handling.
- [ ] Map testing and alpha readiness.

_Requirements: P5-R2, P5-R26_

### 2.2 [P0] Create frontend reuse / extend / refactor / rebuild / greenfield matrix

- [ ] Classify routing.
- [ ] Classify public layout.
- [ ] Classify admin layout.
- [ ] Classify API client.
- [ ] Classify auth guard.
- [ ] Classify design system components.
- [ ] Classify public store UI.
- [ ] Classify QR flow UI.
- [ ] Classify cart/checkout/payment UI.
- [ ] Classify admin order UI.
- [ ] Classify admin QR/payment settings UI.
- [ ] Add reason, risk, affected files, and required tests for each decision.

_Requirements: P5-R2, P5-R3, P5-R23_

### 2.3 [P0] Create API contract dependency matrix

- [ ] Map each UI screen to backend endpoint.
- [ ] Map each endpoint to request DTO and response DTO.
- [ ] Mark read-only endpoints and mutation endpoints.
- [ ] Mark endpoints requiring admin auth.
- [ ] Mark public no-login endpoints.
- [ ] Mark idempotency requirements.
- [ ] Mark QR session token requirements.
- [ ] Mark missing or unstable contracts.

_Requirements: P5-R4, P5-R5, P5-R26_

### 2.4 [P0] Create frontend implementation wave plan

- [ ] Group tasks by safest implementation order.
- [ ] Ensure audit and contract mapping happen before UI implementation.
- [ ] Ensure API client foundation comes before screens.
- [ ] Ensure public flows are tested before admin expansion.
- [ ] Ensure No-Go checks are placed before alpha readiness.
- [ ] Document dependencies and blockers.

_Requirements: P5-R2, P5-R24, P5-R26_

### 2.5 [P0] Produce `05.1-frontend-gap-analysis-integration-map.md`

- [ ] Add capability map.
- [ ] Add decision matrix.
- [ ] Add API dependency matrix.
- [ ] Add implementation waves.
- [ ] Add file-by-file plan.
- [ ] Add test plan.
- [ ] Add regression plan.
- [ ] Add blockers.

_Requirements: P5-R2, P5-R26_

---

## 3. Phase 5.2 — Frontend Architecture and App Shell

### 3.1 [P0] Define route architecture

- [ ] Define public storefront route.
- [ ] Define QR route.
- [ ] Define checkout/payment route strategy.
- [ ] Define public order tracking route.
- [ ] Define admin order routes.
- [ ] Define admin QR routes.
- [ ] Define admin payment settings route.
- [ ] Ensure route names match existing router conventions when possible.

_Requirements: P5-R3, P5-R5_

### 3.2 [P0] Define public app shell

- [ ] Create or select mobile-first public layout.
- [ ] Define header/navigation behavior.
- [ ] Define cart access pattern.
- [ ] Define QR context display area.
- [ ] Define payment pending shell.
- [ ] Define order tracking shell.
- [ ] Ensure public shell does not expose admin navigation or auth state.

_Requirements: P5-R3, P5-R5, P5-R25_

### 3.3 [P0] Define admin shell integration

- [ ] Reuse existing admin auth guard where safe.
- [ ] Reuse existing admin layout/navigation where safe.
- [ ] Add routes without breaking CRM/chat/WhatsApp admin flows.
- [ ] Define admin page headers, filters, tables, action buttons, and detail layouts.
- [ ] Document navigation impact and compatibility risks.

_Requirements: P5-R3, P5-R16, P5-R23_

### 3.4 [P0] Define state management strategy

- [ ] Define local cart intent state.
- [ ] Define backend-validated cart state.
- [ ] Define QR session state.
- [ ] Define checkout attempt and Idempotency-Key lifecycle.
- [ ] Define payment polling state.
- [ ] Define admin action pending state.
- [ ] Define storage rules for localStorage/sessionStorage.
- [ ] Ensure sensitive data is not persisted unnecessarily.

_Requirements: P5-R12, P5-R13, P5-R21, P5-R22_

### 3.5 [P0] Define form validation strategy

- [ ] Define product/modifier client-side UX validation.
- [ ] Define customer info validation.
- [ ] Define checkout form validation.
- [ ] Define cancel reason validation.
- [ ] Define backend validation error display.
- [ ] Ensure client validation is UX helper only and backend remains final authority.

_Requirements: P5-R11, P5-R13, P5-R17, P5-R20_

### 3.6 [P0] Produce `05.2-frontend-architecture-app-shell.md`

- [ ] Document routing.
- [ ] Document public shell.
- [ ] Document admin shell integration.
- [ ] Document state management.
- [ ] Document form validation.
- [ ] Document environment and feature flag rules.
- [ ] Document risks and tests.

_Requirements: P5-R3, P5-R26_

---

## 4. Phase 5.3 — API Client and Contract Integration

### 4.1 [P0] Create centralized API client boundary

- [ ] Create or adapt public API client.
- [ ] Create or adapt admin API client.
- [ ] Centralize base URL handling.
- [ ] Centralize headers.
- [ ] Centralize request ID handling.
- [ ] Centralize JSON parsing.
- [ ] Centralize response normalization.
- [ ] Centralize safe error mapping.

_Requirements: P5-R4, P5-R20_

### 4.2 [P0] Implement public API methods

- [ ] Implement get storefront method.
- [ ] Implement resolve QR method.
- [ ] Implement validate cart method.
- [ ] Implement checkout method.
- [ ] Implement get payment status method.
- [ ] Implement get public order method.
- [ ] Ensure checkout supports Idempotency-Key.
- [ ] Ensure QR calls support QR session token where required.

_Requirements: P5-R4, P5-R5, P5-R13, P5-R14, P5-R15_

### 4.3 [P0] Implement admin API methods

- [ ] Implement admin order list method.
- [ ] Implement admin order detail method.
- [ ] Implement accept order method.
- [ ] Implement prepare order method.
- [ ] Implement ready order method.
- [ ] Implement complete order method.
- [ ] Implement cancel order method.
- [ ] Implement admin QR methods when backend contract exists.
- [ ] Implement admin payment settings methods when backend contract exists.

_Requirements: P5-R16, P5-R17, P5-R18, P5-R19_

### 4.4 [P0] Add API client safety guards

- [ ] Ensure frontend does not call webhook endpoints.
- [ ] Ensure checkout payload does not include payment_status.
- [ ] Ensure checkout payload does not include fulfillment_status.
- [ ] Ensure checkout payload does not treat total as authority.
- [ ] Ensure admin action payloads do not use generic status patch.
- [ ] Ensure provider secrets are never sent or stored client-side.
- [ ] Add tests for forbidden payload fields.

_Requirements: P5-R4, P5-R13, P5-R17, P5-R21_

### 4.5 [P0] Implement backend error code mapping

- [ ] Map QR_EXPIRED.
- [ ] Map QR_REVOKED.
- [ ] Map QR_OUTLET_MISMATCH.
- [ ] Map QR_LOCATION_MISMATCH.
- [ ] Map PRODUCT_UNAVAILABLE.
- [ ] Map MODIFIER_INVALID.
- [ ] Map CHECKOUT_IDEMPOTENCY_REQUIRED.
- [ ] Map IDEMPOTENCY_CONFLICT.
- [ ] Map PAYMENT_PROVIDER_ERROR.
- [ ] Map ORDER_INVALID_TRANSITION.
- [ ] Map ORDER_UNPAID.
- [ ] Map FORBIDDEN.
- [ ] Map RATE_LIMITED.
- [ ] Map INTERNAL_ERROR.

_Requirements: P5-R20, P5-R22_

### 4.6 [P0] Produce `05.3-api-client-contract-integration.md`

- [ ] Document API client structure.
- [ ] Document public methods.
- [ ] Document admin methods.
- [ ] Document auth/header rules.
- [ ] Document idempotency and QR session handling.
- [ ] Document error mapping.
- [ ] Document tests and known contract gaps.

_Requirements: P5-R4, P5-R26_

---

## 5. Phase 5.4 — Public Online Store UI

### 5.1 [P0] Implement public storefront route

- [ ] Create or adapt `/store/:storefrontSlug` route.
- [ ] Load storefront data from backend.
- [ ] Render brand/storefront identity.
- [ ] Render safe loading, error, and empty states.
- [ ] Handle invalid storefront slug safely.
- [ ] Ensure route does not require admin login.

_Requirements: P5-R5, P5-R6, P5-R20_

### 5.2 [P0] Implement outlet selection for Online Store

- [ ] Render eligible outlets from backend response.
- [ ] Require outlet selection when needed.
- [ ] Handle no active outlet state.
- [ ] Handle inactive/disabled outlet state.
- [ ] Refresh or filter menu by selected outlet.
- [ ] Invalidate or revalidate cart when outlet changes.

_Requirements: P5-R6, P5-R12, P5-R20_

### 5.3 [P0] Implement category and product list

- [ ] Render categories.
- [ ] Render products by category.
- [ ] Render product availability.
- [ ] Render sold-out/unavailable state.
- [ ] Prevent unavailable products from being added to cart.
- [ ] Support mobile-first browsing.

_Requirements: P5-R6, P5-R11, P5-R25_

### 5.4 [P0] Implement product detail and modifier picker

- [ ] Show product name, description, image if available, and price preview.
- [ ] Show required modifier groups.
- [ ] Show optional modifier groups.
- [ ] Validate required modifier UX client-side.
- [ ] Support quantity update.
- [ ] Show backend modifier validation errors.
- [ ] Return cart intent, not final pricing authority.

_Requirements: P5-R11, P5-R12_

### 5.5 [P0] Add public store component tests

- [ ] Test storefront loading.
- [ ] Test invalid storefront.
- [ ] Test outlet selector.
- [ ] Test product list.
- [ ] Test sold-out product.
- [ ] Test modifier picker.
- [ ] Test mobile critical controls where practical.

_Requirements: P5-R6, P5-R11, P5-R24, P5-R25_

### 5.6 [P0] Produce `05.4-public-online-store-ui.md`

- [ ] Document route.
- [ ] Document screens.
- [ ] Document API dependencies.
- [ ] Document component decisions.
- [ ] Document error/empty states.
- [ ] Document tests.

_Requirements: P5-R6, P5-R26_

---

## 6. Phase 5.5 — QR Store UI

### 6.1 [P0] Implement QR resolve route

- [ ] Create or adapt `/qr/:qrToken` route.
- [ ] Call QR resolve API.
- [ ] Store QR session token only as needed.
- [ ] Render QR scope from backend response.
- [ ] Handle invalid QR token.
- [ ] Handle expired QR.
- [ ] Handle revoked QR.
- [ ] Handle backend-safe error messages.

_Requirements: P5-R5, P5-R7, P5-R20_

### 6.2 [P0] Implement Universal QR UI

- [ ] Show outlet selection for Universal QR.
- [ ] Only show backend-provided eligible outlets.
- [ ] Require selected outlet before cart validation or checkout.
- [ ] Refresh availability based on selected outlet.
- [ ] Send selected outlet only where backend contract allows.
- [ ] Handle no eligible outlet state.

_Requirements: P5-R7, P5-R8, P5-R12_

### 6.3 [P0] Implement Outlet QR UI

- [ ] Display locked outlet from backend.
- [ ] Do not show outlet selector.
- [ ] Prevent outlet override.
- [ ] Use locked outlet for availability display.
- [ ] Send QR session token for validation/checkout.
- [ ] Handle QR_OUTLET_MISMATCH error from backend.

_Requirements: P5-R7, P5-R9, P5-R20, P5-R21_

### 6.4 [P0] Implement Location QR UI

- [ ] Display locked outlet.
- [ ] Display locked location/table label.
- [ ] Do not show outlet selector.
- [ ] Do not show location selector.
- [ ] Prevent location override.
- [ ] Send QR session token for validation/checkout.
- [ ] Handle QR_LOCATION_MISMATCH error from backend.

_Requirements: P5-R7, P5-R10, P5-R20, P5-R21_

### 6.5 [P0] Add QR flow tests

- [ ] Test Universal QR success.
- [ ] Test Universal QR missing outlet UX.
- [ ] Test Outlet QR locked outlet UI.
- [ ] Test Location QR locked outlet/location UI.
- [ ] Test expired QR error.
- [ ] Test revoked QR error.
- [ ] Test QR mismatch error display.
- [ ] Test frontend cannot override locked outlet/location.

_Requirements: P5-R7, P5-R8, P5-R9, P5-R10, P5-R24_

### 6.6 [P0] Produce `05.5-qr-store-ui.md`

- [ ] Document QR route.
- [ ] Document QR session state.
- [ ] Document Universal QR behavior.
- [ ] Document Outlet QR behavior.
- [ ] Document Location QR behavior.
- [ ] Document error handling and tests.

_Requirements: P5-R7, P5-R8, P5-R9, P5-R10, P5-R26_

---

## 7. Phase 5.6 — Cart and Menu Interaction

### 7.1 [P0] Implement local cart intent state

- [ ] Store product ID, quantity, and modifier option IDs.
- [ ] Store selected outlet only when allowed.
- [ ] Store QR session token reference when present.
- [ ] Support add item.
- [ ] Support remove item.
- [ ] Support quantity update.
- [ ] Support modifier edit.
- [ ] Avoid storing sensitive customer/payment data.

_Requirements: P5-R12, P5-R21_

### 7.2 [P0] Implement backend cart validation integration

- [ ] Call cart validation API before checkout.
- [ ] Send cart intent.
- [ ] Send selected outlet only when allowed.
- [ ] Send QR session token when present.
- [ ] Display backend-normalized cart summary.
- [ ] Display item-level errors.
- [ ] Display product unavailable errors.
- [ ] Display modifier errors.
- [ ] Display outlet/QR mismatch errors.

_Requirements: P5-R12, P5-R20_

### 7.3 [P0] Implement cart UI

- [ ] Show cart item list.
- [ ] Show estimated local subtotal as preview only.
- [ ] Show backend-validated total after validation.
- [ ] Show unavailable item state.
- [ ] Show modifier edit controls.
- [ ] Show clear checkout CTA state.
- [ ] Disable checkout when cart is invalid.
- [ ] Support mobile drawer or page pattern.

_Requirements: P5-R12, P5-R25_

### 7.4 [P0] Handle cart invalidation scenarios

- [ ] Handle outlet change invalidating cart.
- [ ] Handle product unavailable after add.
- [ ] Handle modifier invalid after add.
- [ ] Handle QR session expired.
- [ ] Handle backend validation conflict.
- [ ] Let user edit or remove invalid items.

_Requirements: P5-R12, P5-R20, P5-R22_

### 7.5 [P0] Add cart/menu tests

- [ ] Test add/remove/update item.
- [ ] Test modifier selection.
- [ ] Test backend-normalized cart display.
- [ ] Test unavailable product error.
- [ ] Test modifier invalid error.
- [ ] Test outlet change invalidation.
- [ ] Test local subtotal is not final authority.
- [ ] Test checkout disabled when backend validation fails.

_Requirements: P5-R11, P5-R12, P5-R24_

### 7.6 [P0] Produce `05.6-cart-menu-interaction.md`

- [ ] Document cart state model.
- [ ] Document validation flow.
- [ ] Document invalidation rules.
- [ ] Document UI behavior.
- [ ] Document tests.

_Requirements: P5-R12, P5-R26_

---

## 8. Phase 5.7 — Checkout and Payment UI

### 8.1 [P0] Implement checkout form

- [ ] Collect required customer information.
- [ ] Validate obvious field errors client-side.
- [ ] Show backend validation errors.
- [ ] Use backend-validated cart summary.
- [ ] Include QR session token when present.
- [ ] Include selected outlet only when allowed.
- [ ] Do not include final total as authority.
- [ ] Do not include payment_status or fulfillment_status.

_Requirements: P5-R13, P5-R21_

### 8.2 [P0] Implement checkout idempotency lifecycle

- [ ] Generate Idempotency-Key per checkout attempt.
- [ ] Reuse same Idempotency-Key for retry of the same attempt.
- [ ] Generate new Idempotency-Key for intentional new attempt.
- [ ] Disable submit while request is pending.
- [ ] Prevent double click duplicate submission.
- [ ] Handle IDEMPOTENCY_CONFLICT.
- [ ] Clear or finalize checkout attempt after successful order creation.

_Requirements: P5-R13, P5-R22_

### 8.3 [P0] Implement checkout submission flow

- [ ] Call checkout API through centralized client.
- [ ] Handle success response with order token and payment details.
- [ ] Handle validation errors.
- [ ] Handle provider errors.
- [ ] Handle network retry safely.
- [ ] Redirect to payment pending or open payment URL according to backend response.
- [ ] Never treat payment redirect as paid.

_Requirements: P5-R13, P5-R14, P5-R20_

### 8.4 [P0] Implement payment pending UI

- [ ] Display payment instructions or payment URL from backend.
- [ ] Display payment_status from backend.
- [ ] Poll payment status using read-only endpoint.
- [ ] Show pending, paid, failed, expired, and manual_review states where available.
- [ ] Stop or slow polling based on rate-limit or terminal status.
- [ ] Link to public order tracking.
- [ ] Do not expose raw provider payload.

_Requirements: P5-R14, P5-R20, P5-R22_

### 8.5 [P0] Add checkout/payment tests

- [ ] Test checkout requires validated cart.
- [ ] Test Idempotency-Key is sent.
- [ ] Test duplicate click creates one frontend mutation attempt.
- [ ] Test forbidden payment_status/fulfillment_status are not sent.
- [ ] Test frontend total is not treated as authority.
- [ ] Test provider error display.
- [ ] Test payment pending polling.
- [ ] Test redirect is not treated as paid.

_Requirements: P5-R13, P5-R14, P5-R21, P5-R24_

### 8.6 [P0] Produce `05.7-checkout-payment-ui.md`

- [ ] Document checkout form.
- [ ] Document Idempotency-Key lifecycle.
- [ ] Document payment pending flow.
- [ ] Document polling strategy.
- [ ] Document safety rules and tests.

_Requirements: P5-R13, P5-R14, P5-R26_

---

## 9. Phase 5.8 — Public Order Tracking UI

### 9.1 [P0] Implement public order tracking route

- [ ] Create or adapt `/order/:publicOrderToken` route.
- [ ] Load order by public order token.
- [ ] Handle invalid token.
- [ ] Handle expired/missing token if backend returns it.
- [ ] Render safe loading/error/empty states.
- [ ] Do not require admin login.

_Requirements: P5-R5, P5-R15, P5-R20_

### 9.2 [P0] Render safe public order summary

- [ ] Show safe order number.
- [ ] Show public_order_status.
- [ ] Show safe payment status label.
- [ ] Show safe fulfillment status label.
- [ ] Show item snapshot.
- [ ] Show outlet info.
- [ ] Show QR table/location label if relevant.
- [ ] Show payment pending/failed/expired/cancelled/completed states.

_Requirements: P5-R15_

### 9.3 [P0] Enforce public order privacy

- [ ] Hide internal order ID.
- [ ] Hide raw provider payload.
- [ ] Hide admin notes.
- [ ] Hide admin user data.
- [ ] Hide sensitive customer data.
- [ ] Mask customer phone if shown.
- [ ] Ensure public token is treated as opaque.

_Requirements: P5-R15, P5-R21_

### 9.4 [P0] Add public order tracking tests

- [ ] Test valid public order display.
- [ ] Test invalid token safe error.
- [ ] Test payment pending state.
- [ ] Test payment failed state.
- [ ] Test payment expired state.
- [ ] Test completed state.
- [ ] Test internal fields are not rendered.
- [ ] Test raw provider payload is not rendered.

_Requirements: P5-R15, P5-R21, P5-R24_

### 9.5 [P0] Produce `05.8-public-order-tracking-ui.md`

- [ ] Document route.
- [ ] Document response fields.
- [ ] Document public status display.
- [ ] Document privacy rules.
- [ ] Document tests.

_Requirements: P5-R15, P5-R26_

---

## 10. Phase 5.9 — Admin Order Management UI

### 10.1 [P0] Implement admin order list UI

- [ ] Use existing admin auth guard.
- [ ] Load order list from backend.
- [ ] Show channel.
- [ ] Show payment_status.
- [ ] Show fulfillment_status.
- [ ] Show outlet.
- [ ] Show QR context when relevant.
- [ ] Support channel filter.
- [ ] Support outlet filter if backend allows.
- [ ] Preserve existing WhatsApp order visibility.

_Requirements: P5-R16, P5-R23_

### 10.2 [P0] Implement admin order detail UI

- [ ] Load order detail from backend.
- [ ] Show item snapshot.
- [ ] Show customer summary safely.
- [ ] Show payment status.
- [ ] Show fulfillment status.
- [ ] Show public order status.
- [ ] Show QR/table context.
- [ ] Show status history if backend returns it.
- [ ] Hide provider secrets and raw provider payload.

_Requirements: P5-R16, P5-R21_

### 10.3 [P0] Render backend allowed_actions

- [ ] Read allowed_actions from backend response.
- [ ] Render only actions provided by backend.
- [ ] Do not guess actions from status.
- [ ] Hide unavailable actions.
- [ ] Show disabled/pending state while action is executing.
- [ ] Refresh order after action.
- [ ] Display updated allowed_actions after action.

_Requirements: P5-R17, P5-R22_

### 10.4 [P0] Implement explicit admin order actions

- [ ] Call accept endpoint.
- [ ] Call prepare endpoint.
- [ ] Call ready endpoint.
- [ ] Call complete endpoint.
- [ ] Call cancel endpoint.
- [ ] Require cancel reason.
- [ ] Prevent duplicate action submission.
- [ ] Handle ORDER_INVALID_TRANSITION.
- [ ] Handle ORDER_UNPAID.
- [ ] Handle FORBIDDEN.

_Requirements: P5-R17, P5-R20, P5-R22_

### 10.5 [P0] Preserve existing admin/WhatsApp regression

- [ ] Confirm existing admin navigation still works.
- [ ] Confirm existing WhatsApp order visibility still works.
- [ ] Confirm existing CRM/chat screens are not broken by routing changes.
- [ ] Confirm existing product/payment admin screens still load unless intentionally changed.
- [ ] Record any intentional breaking change with reason and migration path.

_Requirements: P5-R23_

### 10.6 [P0] Add admin order tests

- [ ] Test order list rendering.
- [ ] Test order detail rendering.
- [ ] Test allowed_actions rendering.
- [ ] Test frontend does not guess actions.
- [ ] Test accept/prepare/ready/complete/cancel actions call explicit endpoints.
- [ ] Test cancel requires reason.
- [ ] Test unpaid order error handling.
- [ ] Test duplicate action prevention.

_Requirements: P5-R16, P5-R17, P5-R24_

### 10.7 [P0] Produce `05.9-admin-order-management-ui.md`

- [ ] Document admin routes.
- [ ] Document order list/detail behavior.
- [ ] Document allowed_actions usage.
- [ ] Document explicit action endpoints.
- [ ] Document regression impact.
- [ ] Document tests.

_Requirements: P5-R16, P5-R17, P5-R26_

---

## 11. Phase 5.10 — Admin QR and Payment Settings UI

### 11.1 [P1] Implement admin QR list/detail UI

- [ ] List QR codes.
- [ ] Show QR scope.
- [ ] Show QR status.
- [ ] Show outlet binding when applicable.
- [ ] Show location/table binding when applicable.
- [ ] Show safe public QR link/token.
- [ ] Show QR detail.
- [ ] Handle permission errors.

_Requirements: P5-R18_

### 11.2 [P1] Implement admin QR create/update actions

- [ ] Create Universal QR if backend supports it.
- [ ] Create Outlet QR if backend supports it.
- [ ] Create Location QR if backend supports it.
- [ ] Activate QR code.
- [ ] Disable QR code.
- [ ] Revoke QR code.
- [ ] Refresh list/detail after mutation.
- [ ] Prevent duplicate submissions.
- [ ] Show safe errors.

_Requirements: P5-R18, P5-R20, P5-R22_

### 11.3 [P2] Implement minimal QR printable/share UI

- [ ] Display public QR link safely.
- [ ] Display basic QR preview if existing dependency or backend supports it.
- [ ] Avoid exposing internal security metadata.
- [ ] Provide copy link UX.
- [ ] Document if print/export is deferred.

_Requirements: P5-R18, P5-R21_

### 11.4 [P1] Implement admin payment provider settings UI

- [ ] Show active provider from backend.
- [ ] Show BayarGG display for alpha.
- [ ] Show provider status/mode if backend returns it.
- [ ] Configure provider only if backend API supports it.
- [ ] Activate/disable provider only if backend API supports it.
- [ ] Hide secrets.
- [ ] Do not call provider API directly.
- [ ] Handle permission errors.

_Requirements: P5-R19, P5-R21_

### 11.5 [P1] Add admin QR/payment settings tests

- [ ] Test QR list/detail.
- [ ] Test QR create forms.
- [ ] Test QR activate/disable/revoke actions.
- [ ] Test permission errors.
- [ ] Test active provider display.
- [ ] Test secrets are not rendered.
- [ ] Test frontend does not call provider API directly.

_Requirements: P5-R18, P5-R19, P5-R24_

### 11.6 [P1] Produce `05.10-admin-qr-payment-settings-ui.md`

- [ ] Document QR management UI.
- [ ] Document payment provider settings UI.
- [ ] Document supported and deferred capabilities.
- [ ] Document security rules.
- [ ] Document tests.

_Requirements: P5-R18, P5-R19, P5-R26_

---

## 12. Phase 5.11 — Frontend Security, Error, and State Handling

### 12.1 [P0] Implement global error mapping and display system

- [ ] Map backend error codes to user-friendly messages.
- [ ] Display request ID when useful for support.
- [ ] Avoid raw stack traces.
- [ ] Avoid raw provider payload.
- [ ] Use consistent public error components.
- [ ] Use consistent admin error components.
- [ ] Support retry only where safe.

_Requirements: P5-R20, P5-R21_

### 12.2 [P0] Implement loading and empty states

- [ ] Add loading states for storefront, QR resolve, cart validation, checkout, payment polling, order tracking, admin list/detail, and admin actions.
- [ ] Add empty states for outlets, categories, products, cart, orders, QR list, and provider settings where applicable.
- [ ] Ensure loading does not block forever without feedback.
- [ ] Ensure mobile loading states are understandable.

_Requirements: P5-R20, P5-R22, P5-R25_

### 12.3 [P0] Implement frontend privacy safeguards

- [ ] Ensure public UI hides internal order ID.
- [ ] Ensure public UI hides raw provider payload.
- [ ] Ensure public UI hides admin notes.
- [ ] Ensure public UI hides admin user data.
- [ ] Ensure frontend env does not expose secrets.
- [ ] Avoid storing sensitive customer data in localStorage.
- [ ] Clear checkout/session data after completion where appropriate.

_Requirements: P5-R21_

### 12.4 [P0] Implement polling/retry/concurrency safeguards

- [ ] Prevent duplicate checkout submission.
- [ ] Prevent duplicate admin action submission.
- [ ] Handle browser refresh during payment pending.
- [ ] Handle network retry without duplicate mutation.
- [ ] Stop or slow payment polling on terminal status or rate limit.
- [ ] Do not assume success from optimistic client state for critical mutations.

_Requirements: P5-R22_

### 12.5 [P1] Implement accessibility and mobile-first improvements

- [ ] Check public store on small screen.
- [ ] Check QR flow on small screen.
- [ ] Check cart and checkout on small screen.
- [ ] Check payment pending on small screen.
- [ ] Ensure key forms have labels.
- [ ] Ensure destructive actions require confirmation where appropriate.
- [ ] Document accessibility limitations before alpha.

_Requirements: P5-R25, P5-R26_

### 12.6 [P0] Add security/error/state tests

- [ ] Test critical error code mapping.
- [ ] Test raw stack trace is not displayed.
- [ ] Test raw provider payload is not displayed.
- [ ] Test internal IDs are not displayed in public UI.
- [ ] Test duplicate checkout prevention.
- [ ] Test duplicate admin action prevention.
- [ ] Test polling terminal state behavior.
- [ ] Test sensitive data persistence rules where practical.

_Requirements: P5-R20, P5-R21, P5-R22, P5-R24_

### 12.7 [P0] Produce `05.11-frontend-security-error-state-handling.md`

- [ ] Document error mapping.
- [ ] Document loading and empty states.
- [ ] Document privacy safeguards.
- [ ] Document polling/retry/concurrency rules.
- [ ] Document accessibility notes.
- [ ] Document tests.

_Requirements: P5-R20, P5-R21, P5-R22, P5-R25, P5-R26_

---

## 13. Phase 5.12 — Frontend Testing and E2E Stabilization

### 13.1 [P0] Build API client test suite

- [ ] Test public API client methods.
- [ ] Test admin API client methods.
- [ ] Test auth headers.
- [ ] Test Idempotency-Key header.
- [ ] Test QR session token handling.
- [ ] Test forbidden payload fields are not sent.
- [ ] Test error normalization.

_Requirements: P5-R4, P5-R24_

### 13.2 [P0] Build component test suite

- [ ] Test public store components.
- [ ] Test QR components.
- [ ] Test product detail/modifier components.
- [ ] Test cart components.
- [ ] Test checkout components.
- [ ] Test payment pending components.
- [ ] Test order tracking components.
- [ ] Test admin order components.

_Requirements: P5-R6, P5-R7, P5-R11, P5-R12, P5-R13, P5-R14, P5-R15, P5-R16, P5-R24_

### 13.3 [P0] Build Online Store E2E flow

- [ ] Open public storefront.
- [ ] Select outlet.
- [ ] Add product with modifiers.
- [ ] Validate cart.
- [ ] Submit checkout with Idempotency-Key.
- [ ] Reach payment pending.
- [ ] Read payment status.
- [ ] Open public order tracking.
- [ ] Confirm no payment authority is client-side.

_Requirements: P5-R6, P5-R12, P5-R13, P5-R14, P5-R15, P5-R24_

### 13.4 [P0] Build QR Store E2E flows

- [ ] Universal QR checkout success.
- [ ] Outlet QR checkout success.
- [ ] Location QR checkout success.
- [ ] Universal QR missing outlet shows error.
- [ ] Outlet QR mismatch shows error.
- [ ] Location QR mismatch shows error.
- [ ] Expired/revoked QR shows safe error.
- [ ] Frontend cannot override locked outlet/location.

_Requirements: P5-R7, P5-R8, P5-R9, P5-R10, P5-R24_

### 13.5 [P0] Build Admin Order E2E flow

- [ ] Open admin order list.
- [ ] Open order detail.
- [ ] Render allowed_actions.
- [ ] Accept paid order.
- [ ] Mark preparing.
- [ ] Mark ready.
- [ ] Mark complete.
- [ ] Cancel requires reason.
- [ ] Unpaid order action is blocked/handled.
- [ ] Order refreshes after action.

_Requirements: P5-R16, P5-R17, P5-R24_

### 13.6 [P0] Build security and regression E2E checks

- [ ] Verify public UI does not show internal order ID.
- [ ] Verify public UI does not show raw provider payload.
- [ ] Verify checkout cannot submit payment_status or fulfillment_status.
- [ ] Verify payment redirect is not treated as paid.
- [ ] Verify existing admin navigation still works.
- [ ] Verify existing WhatsApp order visibility still works.
- [ ] Verify existing CRM/chat screens still load if in same frontend.

_Requirements: P5-R21, P5-R23, P5-R24_

### 13.7 [P0] Record manual sandbox verification

- [ ] Verify Online Store on real or staging backend.
- [ ] Verify Universal QR on real or staging backend.
- [ ] Verify Outlet QR on real or staging backend.
- [ ] Verify Location QR on real or staging backend.
- [ ] Verify BayarGG sandbox payment pending/status behavior.
- [ ] Verify admin order processing.
- [ ] Record browser/device used.
- [ ] Record failures and limitations.

_Requirements: P5-R14, P5-R24, P5-R26_

### 13.8 [P0] Produce `05.12-frontend-testing-e2e-stabilization.md`

- [ ] Document test strategy.
- [ ] Document test commands.
- [ ] Document E2E results.
- [ ] Document regression results.
- [ ] Document manual sandbox results.
- [ ] Document known failures and blockers.

_Requirements: P5-R24, P5-R26_

---

## 14. Phase 5.13 — Alpha Frontend Readiness

### 14.1 [P0] Update all Phase 5 deliverable docs

- [ ] Update `05.0-existing-frontend-contract-audit.md`.
- [ ] Update `05.1-frontend-gap-analysis-integration-map.md`.
- [ ] Update `05.2-frontend-architecture-app-shell.md`.
- [ ] Update `05.3-api-client-contract-integration.md`.
- [ ] Update `05.4-public-online-store-ui.md`.
- [ ] Update `05.5-qr-store-ui.md`.
- [ ] Update `05.6-cart-menu-interaction.md`.
- [ ] Update `05.7-checkout-payment-ui.md`.
- [ ] Update `05.8-public-order-tracking-ui.md`.
- [ ] Update `05.9-admin-order-management-ui.md`.
- [ ] Update `05.10-admin-qr-payment-settings-ui.md` if included.
- [ ] Update `05.11-frontend-security-error-state-handling.md`.
- [ ] Update `05.12-frontend-testing-e2e-stabilization.md`.

_Requirements: P5-R26_

### 14.2 [P0] Run final frontend alpha checklist

- [ ] Confirm public storefront usable.
- [ ] Confirm QR Store usable.
- [ ] Confirm mobile layout acceptable.
- [ ] Confirm cart validation works.
- [ ] Confirm checkout idempotency works.
- [ ] Confirm payment pending is understandable.
- [ ] Confirm public order tracking works.
- [ ] Confirm admin order processing works.
- [ ] Confirm admin QR/payment settings status if included.
- [ ] Confirm error, loading, and empty states are clear.

_Requirements: P5-R20, P5-R24, P5-R25, P5-R26_

### 14.3 [P0] Run No-Go condition review

- [ ] Confirm frontend cannot mark payment paid.
- [ ] Confirm frontend does not send payment_status.
- [ ] Confirm frontend does not send fulfillment_status.
- [ ] Confirm frontend does not treat redirect as paid.
- [ ] Confirm frontend does not use local total as final authority.
- [ ] Confirm frontend cannot override QR locked outlet/location.
- [ ] Confirm checkout cannot submit without Idempotency-Key.
- [ ] Confirm duplicate checkout is prevented.
- [ ] Confirm admin actions use explicit endpoints.
- [ ] Confirm allowed_actions are not guessed.
- [ ] Confirm raw provider payload/internal order ID/admin notes do not appear in public UI.
- [ ] Confirm existing WhatsApp/admin flows do not break silently.

_Requirements: P5-R21, P5-R23, P5-R26_

### 14.4 [P0] Produce final alpha frontend readiness report

- [ ] Create `05.13-alpha-frontend-readiness.md`.
- [ ] Record implemented scope.
- [ ] Record deferred scope.
- [ ] Record tests run.
- [ ] Record tests not run.
- [ ] Record manual sandbox result.
- [ ] Record known limitations.
- [ ] Record risks and follow-up.
- [ ] Record GO/NO-GO decision.

_Requirements: P5-R24, P5-R26_

### 14.5 [P0] Finalize Phase 5 task checklist

- [ ] Mark completed tasks accurately.
- [ ] Leave blocked tasks unchecked with reason.
- [ ] Leave untested tasks unchecked.
- [ ] Update implementation status.
- [ ] Update progress log.
- [ ] Update current task pointer.
- [ ] Prepare handoff to Phase 6 Alpha Testing & QA.

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

- [ ] No-Go cleared
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

- [ ] frontend can mark payment paid
- [ ] frontend sends payment_status
- [ ] frontend sends fulfillment_status
- [ ] frontend treats payment redirect as paid
- [ ] frontend uses local total as final authority
- [ ] frontend can override Outlet QR locked outlet
- [ ] frontend can override Location QR locked location
- [ ] checkout can submit without Idempotency-Key
- [ ] duplicate checkout can happen from UI
- [ ] admin action uses generic PATCH status
- [ ] admin can complete unpaid order from UI
- [ ] allowed_actions are guessed client-side
- [ ] raw provider payload appears in public UI
- [ ] internal order ID appears in public UI
- [ ] admin notes appear in public UI
- [ ] QR mismatch is unclear to user
- [ ] payment failed/expired state is unclear to user
- [ ] existing WhatsApp/admin flow breaks silently

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