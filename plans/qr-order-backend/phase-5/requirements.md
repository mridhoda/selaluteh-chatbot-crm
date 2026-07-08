---
schema_version: 1
document_type: requirements
spec_id: selkop-phase-5-frontend-integration
title: SELKOP Phase 5 Frontend Integration Requirements
status: draft
version: 1.0.0
updated_at: 2026-07-07
development_method: audit-driven-greenfield
---

# Requirements Document: SELKOP Phase 5 Frontend Integration

## Introduction

Dokumen ini mendefinisikan requirements untuk **Phase 5 — Frontend Integration**.

Phase 5 menggunakan pendekatan:

```text
audit-driven greenfield frontend
```

Artinya UI, routing, state management, dan interaction model untuk Online Store / QR Store boleh dibangun baru dengan struktur yang lebih bersih, tetapi implementasi tetap wajib membaca dan memetakan:

```text
existing frontend
existing API client
existing admin dashboard
existing design system
existing backend contract
Phase 4 backend implementation
existing tests
```

Phase 5 tidak mengubah backend authority.

Frontend hanya menjadi:

```text
intent sender
UX layer
state presenter
contract consumer
```

Backend tetap menjadi source of truth untuk:

```text
workspace
storefront
outlet
QR scope
QR locked outlet
QR locked location
product price
modifier validation
cart validation
checkout total
payment status
fulfillment status
public order status
admin allowed_actions
audit/security events
```

---

# Product Decisions

## Implementation Mode

```text
greenfield frontend integration
```

UI baru boleh dibuat dari awal, tetapi harus tetap audit-driven.

## Primary User Surfaces

Phase 5 mencakup:

```text
Public Online Store
QR Store
Cart
Checkout
Payment Pending
Public Order Tracking
Admin Order Management
Admin QR Management
Admin Payment Provider Settings Minimal
```

## Customer Flow

Customer dapat:

```text
membuka public storefront
memilih outlet untuk Online Store / Universal QR
scan QR universal/outlet/location
melihat menu dan produk
memilih modifiers
melihat cart preview
memvalidasi cart
checkout tanpa login
membuka payment URL
melihat payment pending
melacak public order status
```

## Admin Flow

Admin dapat:

```text
melihat order list
melihat order detail
memproses order berdasarkan allowed_actions
accept order
mark preparing
mark ready
mark completed
cancel dengan alasan
melihat channel order
melihat QR context
mengelola QR code minimal
melihat / memilih payment provider minimal sesuai backend capability
```

## Payment Provider Decision

Frontend harus menganggap payment provider sebagai backend-managed setting.

Untuk alpha SELKOP:

```text
active provider: BayarGG
```

Namun frontend tidak boleh meng-hardcode business logic BayarGG di luar contract response.

Frontend hanya boleh menampilkan payment data yang dikembalikan backend:

```text
provider_code
payment_status
payment_url
payment_instructions
payment_expires_at
safe display label
```

## QR Decision

QR scope yang harus didukung:

```text
universal
outlet
location
```

Universal QR:

```text
customer memilih outlet
checkout mengirim selected outlet + QR session token
backend memvalidasi final outlet
```

Outlet QR:

```text
outlet locked dari backend
customer tidak bisa mengganti outlet
checkout mengirim QR session token
backend memvalidasi locked outlet
```

Location QR:

```text
outlet dan location/table locked dari backend
customer tidak bisa mengganti outlet/location
checkout mengirim QR session token
backend memvalidasi locked outlet/location
```

## Checkout Decision

Checkout public adalah no-login dan wajib idempotent.

Frontend harus membuat dan mengirim:

```text
Idempotency-Key
```

Frontend tidak boleh mengirim atau mempercayai:

```text
payment_status
fulfillment_status
final total authority
```

Frontend boleh mengirim cart intent:

```text
product_id
quantity
modifier_option_ids
selected_outlet_id when allowed
customer info
fulfillment preference
qr_session_token when present
```

## Order Status Decision

Public order tracking menggunakan:

```text
public_order_token
```

Frontend tidak boleh expose:

```text
internal order ID
raw provider payload
admin notes
sensitive customer data
security events
```

## Admin Action Decision

Admin UI hanya menampilkan action berdasarkan:

```text
allowed_actions
```

Frontend tidak boleh menebak action dari status.

Admin order lifecycle harus melalui explicit action endpoints, bukan generic PATCH status.

---

# Non-Negotiable Frontend Rules

1. Frontend SHALL NOT mark payment as paid.
2. Frontend SHALL NOT set payment_status.
3. Frontend SHALL NOT set fulfillment_status.
4. Frontend SHALL NOT treat payment redirect as paid.
5. Frontend SHALL NOT calculate final total as authority.
6. Frontend SHALL NOT override QR locked outlet.
7. Frontend SHALL NOT override QR locked location.
8. Frontend SHALL NOT guess admin allowed actions.
9. Frontend SHALL NOT use generic status PATCH for admin lifecycle.
10. Frontend SHALL NOT expose raw provider payload.
11. Frontend SHALL NOT expose internal order IDs in public UI.
12. Frontend SHALL NOT store provider secret or webhook secret.
13. Frontend SHALL NOT call webhook endpoints.
14. Frontend SHALL NOT bypass backend cart validation.
15. Frontend SHALL NOT silently break existing WhatsApp Marketplace/admin flows.

---

# Architectural Baseline

| Area | Decision |
|---|---|
| Frontend mode | Audit-driven greenfield |
| Backend | Existing backend adapted in Phase 4 |
| Public auth | No-login public flow |
| Admin auth | Existing admin auth |
| API integration | Centralized API client |
| Checkout authority | Backend |
| Price authority | Backend |
| Payment authority | Verified backend webhook / reconciliation |
| QR authority | Backend QR session |
| Admin action authority | Backend allowed_actions |
| Payment provider | Backend settings, BayarGG active for alpha |
| Existing WhatsApp marketplace | Must not regress |
| Testing | Component, API client, and E2E required |

---

# Dependency Boundary

Phase 5 depends on Phase 4 backend contracts:

```text
public storefront API
public QR resolve API
cart validation API
checkout API
payment status API
public order tracking API
admin order APIs
admin QR APIs
admin payment provider settings APIs
auth/session APIs
```

If a backend API is missing or incompatible, the frontend requirement must be marked:

```text
blocked
mock-only
or
requires backend contract clarification
```

Frontend SHALL NOT implement fake business logic to cover missing backend behavior.

---

# Glossary

- **Online Store**: Public no-login storefront for customer ordering.
- **QR Store**: Public ordering flow initiated by QR scan.
- **Universal QR**: QR that allows customer to select outlet.
- **Outlet QR**: QR that locks customer to one outlet.
- **Location QR**: QR that locks customer to outlet and table/location.
- **QR Session Token**: Public token returned by backend after QR resolve.
- **Cart Intent**: Product, quantity, and modifier choices sent by frontend.
- **Validated Cart**: Backend-normalized cart summary.
- **Checkout Intent**: Customer intent to create order/payment.
- **Idempotency-Key**: Client-generated key required by checkout mutation.
- **Public Order Token**: Opaque token used for public order tracking.
- **Allowed Actions**: Admin actions computed by backend.
- **Payment Pending UI**: Read-only payment status screen after checkout.
- **Backend Authority**: Backend as source of truth for price/status/QR/action.

---

# Requirement Summary

| ID | Requirement | Priority |
|---|---|---|
| P5-R1 | Existing Frontend and Contract Audit | P0 |
| P5-R2 | Frontend Gap Analysis and Integration Map | P0 |
| P5-R3 | Greenfield Frontend Architecture and App Shell | P0 |
| P5-R4 | Centralized API Client and Contract Handling | P0 |
| P5-R5 | Public Routing and No-Login Access | P0 |
| P5-R6 | Public Online Store UI | P0 |
| P5-R7 | QR Store Resolve and Scope UI | P0 |
| P5-R8 | Universal QR Outlet Selection | P0 |
| P5-R9 | Outlet QR Locked Flow | P0 |
| P5-R10 | Location QR Locked Flow | P0 |
| P5-R11 | Menu, Product Detail, and Modifier UX | P0 |
| P5-R12 | Cart State and Backend Validation | P0 |
| P5-R13 | Checkout Form and Idempotency | P0 |
| P5-R14 | Payment Pending and Payment Status UI | P0 |
| P5-R15 | Public Order Tracking UI | P0 |
| P5-R16 | Admin Order List and Detail UI | P0 |
| P5-R17 | Admin Explicit Order Actions | P0 |
| P5-R18 | Admin QR Management Minimal UI | P1 |
| P5-R19 | Admin Payment Provider Settings Minimal UI | P1 |
| P5-R20 | Frontend Error Handling and Empty States | P0 |
| P5-R21 | Frontend Security and Data Privacy | P0 |
| P5-R22 | Loading, Polling, Retry, and Concurrency UX | P0 |
| P5-R23 | Existing WhatsApp/Admin Regression Preservation | P0 |
| P5-R24 | Frontend Testing and E2E Coverage | P0 |
| P5-R25 | Accessibility and Mobile-First Usability | P1 |
| P5-R26 | Frontend Documentation and Alpha Readiness | P0 |

---

# Requirements

## P5-R1: Existing Frontend and Contract Audit

**Priority:** P0

**User Story:** Sebagai developer, saya ingin mengaudit frontend dan backend contract yang sudah ada sebelum membuat UI baru, sehingga greenfield frontend tidak merusak flow existing.

### Acceptance Criteria

1. THE Frontend_Project SHALL audit existing routes before implementation.
2. THE Frontend_Project SHALL audit existing layouts and app shell.
3. THE Frontend_Project SHALL audit existing admin dashboard.
4. THE Frontend_Project SHALL audit existing marketplace/public UI if any.
5. THE Frontend_Project SHALL audit existing checkout/payment/order status UI if any.
6. THE Frontend_Project SHALL audit existing API client.
7. THE Frontend_Project SHALL audit existing auth/session mechanism.
8. THE Frontend_Project SHALL audit existing state management.
9. THE Frontend_Project SHALL audit existing design system/components.
10. THE Frontend_Project SHALL audit existing tests.
11. THE Frontend_Project SHALL audit Phase 4 backend contract.
12. THE Frontend_Project SHALL identify reusable components.
13. THE Frontend_Project SHALL identify risky components.
14. THE Frontend_Project SHALL identify missing API contracts.
15. THE Frontend_Project SHALL produce `05.0-existing-frontend-contract-audit.md`.

---

## P5-R2: Frontend Gap Analysis and Integration Map

**Priority:** P0

**User Story:** Sebagai developer, saya ingin memetakan target frontend Phase 5 ke kondisi existing agar implementation tidak menebak-nebak.

### Acceptance Criteria

1. THE Frontend_Project SHALL map Online Store target capability.
2. THE Frontend_Project SHALL map QR Store target capability.
3. THE Frontend_Project SHALL map cart, checkout, payment, and order tracking capability.
4. THE Frontend_Project SHALL map admin order capability.
5. THE Frontend_Project SHALL map admin QR capability.
6. THE Frontend_Project SHALL map admin payment settings capability.
7. EACH area SHALL be classified as reuse, extend, refactor, rebuild, or greenfield.
8. EACH decision SHALL include reason and risk.
9. EACH decision SHALL list affected files.
10. EACH decision SHALL list required API contracts.
11. EACH decision SHALL list tests required.
12. THE Frontend_Project SHALL produce `05.1-frontend-gap-analysis-integration-map.md`.

---

## P5-R3: Greenfield Frontend Architecture and App Shell

**Priority:** P0

**User Story:** Sebagai developer, saya ingin frontend architecture yang bersih dan terpisah antara public flow dan admin flow.

### Acceptance Criteria

1. THE Frontend_Project SHALL define public route group.
2. THE Frontend_Project SHALL define admin route group.
3. THE Frontend_Project SHALL define shared layout strategy.
4. THE Frontend_Project SHALL define public app shell.
5. THE Frontend_Project SHALL define admin app shell integration.
6. THE Frontend_Project SHALL define API client boundary.
7. THE Frontend_Project SHALL define state management strategy.
8. THE Frontend_Project SHALL define form validation strategy.
9. THE Frontend_Project SHALL define error handling strategy.
10. THE Frontend_Project SHALL define feature flag strategy.
11. THE Frontend_Project SHALL define environment config strategy.
12. THE Frontend_Project SHALL avoid duplicating existing auth logic.
13. THE Frontend_Project SHALL support mobile-first public flow.
14. THE Frontend_Project SHALL produce `05.2-frontend-architecture-app-shell.md`.

---

## P5-R4: Centralized API Client and Contract Handling

**Priority:** P0

**User Story:** Sebagai developer, saya ingin semua API call melewati client yang konsisten agar error, auth, token, dan response dapat ditangani aman.

### Acceptance Criteria

1. THE Frontend_Project SHALL centralize public API calls.
2. THE Frontend_Project SHALL centralize admin API calls.
3. THE API_Client SHALL support request ID display/debugging.
4. THE API_Client SHALL map backend error codes to UI states.
5. THE API_Client SHALL attach admin auth only to admin endpoints.
6. THE API_Client SHALL support Idempotency-Key for checkout.
7. THE API_Client SHALL support QR session token.
8. THE API_Client SHALL not call webhook endpoints.
9. THE API_Client SHALL not send payment_status.
10. THE API_Client SHALL not send fulfillment_status.
11. THE API_Client SHALL not treat frontend total as authority.
12. THE API_Client SHALL handle 401, 403, 404, 409, 422, 429, and 500 safely.
13. THE API_Client SHALL have tests for request/response mapping.

---

## P5-R5: Public Routing and No-Login Access

**Priority:** P0

**User Story:** Sebagai customer, saya ingin membuka store, QR, checkout, payment, dan order tracking tanpa login.

### Acceptance Criteria

1. THE Frontend_Project SHALL provide public storefront route.
2. THE Frontend_Project SHALL provide QR route.
3. THE Frontend_Project SHALL provide checkout route or checkout state transition.
4. THE Frontend_Project SHALL provide payment pending route.
5. THE Frontend_Project SHALL provide public order tracking route.
6. Public routes SHALL NOT require admin login.
7. Public routes SHALL NOT expose admin shell.
8. Public routes SHALL NOT expose internal IDs.
9. Public routes SHALL use opaque tokens where required.
10. Invalid public token SHALL show safe error.
11. Expired public token SHALL show safe error.
12. Public route errors SHALL not leak stack trace.
13. Public route state SHALL survive refresh where safe.
14. Public route state SHALL not persist sensitive data unnecessarily.

---

## P5-R6: Public Online Store UI

**Priority:** P0

**User Story:** Sebagai customer, saya ingin melihat menu SELKOP dan memilih produk dari outlet yang tersedia.

### Acceptance Criteria

1. THE Online_Store_UI SHALL load public storefront data from backend.
2. THE Online_Store_UI SHALL display brand/storefront identity.
3. THE Online_Store_UI SHALL display active outlets when outlet selection is required.
4. THE Online_Store_UI SHALL display categories and products.
5. THE Online_Store_UI SHALL display availability and sold-out states.
6. THE Online_Store_UI SHALL display product detail and modifier options.
7. THE Online_Store_UI SHALL not show unavailable products as orderable.
8. THE Online_Store_UI SHALL not calculate final price as authority.
9. THE Online_Store_UI SHALL use backend-normalized cart summary before checkout.
10. THE Online_Store_UI SHALL support mobile-first navigation.
11. THE Online_Store_UI SHALL handle empty product/category/outlet states.

---

## P5-R7: QR Store Resolve and Scope UI

**Priority:** P0

**User Story:** Sebagai customer, saya ingin scan QR dan diarahkan ke flow sesuai jenis QR.

### Acceptance Criteria

1. THE QR_UI SHALL call backend QR resolve API.
2. THE QR_UI SHALL receive QR session token from backend.
3. THE QR_UI SHALL store QR session token only as needed for checkout flow.
4. THE QR_UI SHALL identify QR scope from backend response.
5. THE QR_UI SHALL support universal, outlet, and location QR.
6. THE QR_UI SHALL display locked outlet/location when backend returns it.
7. THE QR_UI SHALL handle expired QR.
8. THE QR_UI SHALL handle revoked QR.
9. THE QR_UI SHALL handle inactive outlet.
10. THE QR_UI SHALL handle invalid QR token.
11. THE QR_UI SHALL not infer QR scope client-side from token shape.

---

## P5-R8: Universal QR Outlet Selection

**Priority:** P0

**User Story:** Sebagai customer yang scan Universal QR, saya ingin memilih outlet sebelum order.

### Acceptance Criteria

1. THE Universal_QR_UI SHALL show outlet selection.
2. THE Universal_QR_UI SHALL only show backend-provided eligible outlets.
3. THE Universal_QR_UI SHALL require selected outlet before cart validation/checkout.
4. THE Universal_QR_UI SHALL send selected outlet to backend only where allowed.
5. THE Universal_QR_UI SHALL refresh product availability based on selected outlet.
6. Changing outlet SHALL invalidate or revalidate cart.
7. Inactive outlet SHALL not be selectable.
8. Backend remains final authority for selected outlet validity.

---

## P5-R9: Outlet QR Locked Flow

**Priority:** P0

**User Story:** Sebagai customer yang scan Outlet QR, saya tidak boleh mengganti outlet yang sudah dikunci.

### Acceptance Criteria

1. THE Outlet_QR_UI SHALL display locked outlet from backend.
2. THE Outlet_QR_UI SHALL not show outlet selector.
3. THE Outlet_QR_UI SHALL not allow outlet override.
4. THE Outlet_QR_UI SHALL use locked outlet for product availability display.
5. THE Outlet_QR_UI SHALL send QR session token during cart validation/checkout.
6. THE Outlet_QR_UI SHALL not send a conflicting outlet.
7. IF backend returns `QR_OUTLET_MISMATCH`, THE UI SHALL show safe error.
8. Backend remains final authority for outlet lock.

---

## P5-R10: Location QR Locked Flow

**Priority:** P0

**User Story:** Sebagai customer yang scan Location/Table QR, saya ingin outlet dan meja/lokasi otomatis terkunci.

### Acceptance Criteria

1. THE Location_QR_UI SHALL display locked outlet.
2. THE Location_QR_UI SHALL display locked location/table label.
3. THE Location_QR_UI SHALL not show outlet or location selector.
4. THE Location_QR_UI SHALL not allow location override.
5. THE Location_QR_UI SHALL send QR session token during cart validation/checkout.
6. THE Location_QR_UI SHALL not send conflicting location.
7. IF backend returns `QR_LOCATION_MISMATCH`, THE UI SHALL show safe error.
8. Backend remains final authority for location lock.

---

## P5-R11: Menu, Product Detail, and Modifier UX

**Priority:** P0

**User Story:** Sebagai customer, saya ingin memilih produk dan modifier dengan jelas sebelum masuk cart.

### Acceptance Criteria

1. THE Product_UI SHALL display product name, description, backend-provided price preview, and availability.
2. THE Product_UI SHALL display required and optional modifier groups.
3. THE Product_UI SHALL enforce required modifier selection client-side for UX.
4. THE Product_UI SHALL still rely on backend validation for final correctness.
5. THE Product_UI SHALL display modifier validation errors from backend.
6. THE Product_UI SHALL support quantity update.
7. THE Product_UI SHALL prevent obvious invalid quantity.
8. THE Product_UI SHALL display sold-out state.
9. THE Product_UI SHALL handle product deleted/unavailable after cart add.
10. THE Product_UI SHALL support mobile modal or detail page pattern.

---

## P5-R12: Cart State and Backend Validation

**Priority:** P0

**User Story:** Sebagai customer, saya ingin cart saya divalidasi backend agar item, modifier, outlet, dan harga final benar.

### Acceptance Criteria

1. THE Cart_UI SHALL maintain cart intent locally.
2. THE Cart_UI SHALL call backend cart validation before checkout.
3. THE Cart_UI SHALL display backend-normalized cart summary.
4. THE Cart_UI SHALL display item-level, modifier, product unavailable, and outlet errors.
5. THE Cart_UI SHALL handle cart invalidated by outlet change.
6. THE Cart_UI SHALL handle QR locked outlet.
7. THE Cart_UI SHALL not treat local subtotal as final.
8. THE Cart_UI SHALL mark local subtotal as estimate where relevant.
9. THE Cart_UI SHALL allow remove, quantity update, and modifier edit.
10. THE Cart_UI SHALL not send payment or fulfillment status.

---

## P5-R13: Checkout Form and Idempotency

**Priority:** P0

**User Story:** Sebagai customer, saya ingin checkout aman tanpa order/payment double karena double click atau retry.

### Acceptance Criteria

1. THE Checkout_UI SHALL require validated cart before checkout submission.
2. THE Checkout_UI SHALL collect required customer info.
3. THE Checkout_UI SHALL generate Idempotency-Key per checkout attempt.
4. THE Checkout_UI SHALL reuse same Idempotency-Key for retry of same attempt.
5. THE Checkout_UI SHALL generate new Idempotency-Key for intentional new checkout attempt.
6. THE Checkout_UI SHALL disable submit while checkout is in progress.
7. THE Checkout_UI SHALL handle double click safely.
8. THE Checkout_UI SHALL handle `IDEMPOTENCY_CONFLICT`.
9. THE Checkout_UI SHALL not send final total as authority.
10. THE Checkout_UI SHALL not send payment_status or fulfillment_status.
11. THE Checkout_UI SHALL include QR session token when present.
12. THE Checkout_UI SHALL include selected outlet only when backend flow allows it.
13. THE Checkout_UI SHALL redirect to payment pending or payment URL based on backend response.

---

## P5-R14: Payment Pending and Payment Status UI

**Priority:** P0

**User Story:** Sebagai customer, saya ingin melihat instruksi pembayaran dan status pembayaran tanpa frontend menganggap redirect sebagai paid.

### Acceptance Criteria

1. THE Payment_UI SHALL display backend-provided payment URL/instruction.
2. THE Payment_UI SHALL display payment_status from backend.
3. THE Payment_UI SHALL poll or refresh payment status using read-only endpoint.
4. THE Payment_UI SHALL not call webhook endpoint.
5. THE Payment_UI SHALL not mark payment as paid.
6. THE Payment_UI SHALL not assume paid after redirect.
7. THE Payment_UI SHALL show pending, paid, failed, expired, and manual_review states where supported.
8. THE Payment_UI SHALL handle provider unavailable and rate limit safely.
9. THE Payment_UI SHALL not expose raw provider payload.
10. THE Payment_UI SHALL provide link to public order tracking.

---

## P5-R15: Public Order Tracking UI

**Priority:** P0

**User Story:** Sebagai customer, saya ingin melihat status order dengan public token tanpa login.

### Acceptance Criteria

1. THE Order_Tracking_UI SHALL load order by public_order_token.
2. THE Order_Tracking_UI SHALL display safe order number.
3. THE Order_Tracking_UI SHALL display public_order_status.
4. THE Order_Tracking_UI SHALL display safe payment and fulfillment status labels.
5. THE Order_Tracking_UI SHALL display item snapshot, outlet info, and QR location/table label if relevant.
6. THE Order_Tracking_UI SHALL handle pending, failed, expired, cancelled, and completed states.
7. THE Order_Tracking_UI SHALL hide internal order ID.
8. THE Order_Tracking_UI SHALL hide raw provider payload.
9. THE Order_Tracking_UI SHALL hide admin notes and sensitive customer data.

---

## P5-R16: Admin Order List and Detail UI

**Priority:** P0

**User Story:** Sebagai admin, saya ingin melihat order online/QR/WhatsApp dalam dashboard yang jelas.

### Acceptance Criteria

1. THE Admin_Order_UI SHALL use existing admin auth.
2. THE Admin_Order_UI SHALL load order list from backend.
3. THE Admin_Order_UI SHALL display channel, payment_status, fulfillment_status, outlet, and QR context when relevant.
4. THE Admin_Order_UI SHALL support filter by channel.
5. THE Admin_Order_UI SHALL support filter by outlet if backend allows.
6. THE Admin_Order_UI SHALL support order detail page.
7. THE Admin_Order_UI SHALL display item snapshot and status history if backend returns it.
8. THE Admin_Order_UI SHALL not expose provider secret/raw payload.
9. THE Admin_Order_UI SHALL preserve existing WhatsApp order visibility.

---

## P5-R17: Admin Explicit Order Actions

**Priority:** P0

**User Story:** Sebagai admin, saya ingin hanya melihat tombol aksi yang memang diizinkan backend.

### Acceptance Criteria

1. THE Admin_Order_UI SHALL render actions from backend `allowed_actions`.
2. THE Admin_Order_UI SHALL not guess allowed actions from status.
3. THE Admin_Order_UI SHALL not use generic PATCH status for operational transitions.
4. THE Admin_Order_UI SHALL call explicit accept, prepare, ready, complete, and cancel endpoints.
5. Cancel action SHALL require reason input.
6. THE Admin_Order_UI SHALL handle `ORDER_INVALID_TRANSITION`.
7. THE Admin_Order_UI SHALL handle `ORDER_UNPAID`.
8. THE Admin_Order_UI SHALL handle forbidden action.
9. THE Admin_Order_UI SHALL refresh order after action.
10. THE Admin_Order_UI SHALL display updated allowed_actions after action.
11. THE Admin_Order_UI SHALL prevent duplicate action submission.

---

## P5-R18: Admin QR Management Minimal UI

**Priority:** P1

**User Story:** Sebagai admin, saya ingin membuat dan mengelola QR code untuk outlet dan table/location.

### Acceptance Criteria

1. THE Admin_QR_UI SHALL list QR codes.
2. THE Admin_QR_UI SHALL show QR scope and status.
3. THE Admin_QR_UI SHALL create Universal, Outlet, and Location QR if backend supports it.
4. THE Admin_QR_UI SHALL display QR public link/token safely.
5. THE Admin_QR_UI SHALL activate, disable, and revoke QR code.
6. THE Admin_QR_UI SHALL handle permission errors.
7. THE Admin_QR_UI SHALL hide internal security details.
8. THE Admin_QR_UI MAY show printable QR preview.
9. THE Admin_QR_UI SHALL refresh after state changes.

---

## P5-R19: Admin Payment Provider Settings Minimal UI

**Priority:** P1

**User Story:** Sebagai admin, saya ingin melihat provider pembayaran aktif dan mengatur provider sesuai permission.

### Acceptance Criteria

1. THE Payment_Settings_UI SHALL show active provider from backend.
2. THE Payment_Settings_UI SHALL support BayarGG display for alpha.
3. THE Payment_Settings_UI SHALL not hardcode provider authority outside backend contract.
4. THE Payment_Settings_UI SHALL not show provider secrets.
5. THE Payment_Settings_UI SHALL configure, activate, or disable provider only if backend API supports it.
6. THE Payment_Settings_UI SHALL handle permission errors.
7. THE Payment_Settings_UI SHALL show safe provider health/test status if backend returns it.
8. THE Payment_Settings_UI SHALL audit-critical changes through backend only.
9. THE Payment_Settings_UI SHALL not call provider API directly.

---

## P5-R20: Frontend Error Handling and Empty States

**Priority:** P0

**User Story:** Sebagai user, saya ingin error ditampilkan jelas tanpa bocor detail internal.

### Acceptance Criteria

1. THE Frontend_Project SHALL map backend error codes to user-friendly messages.
2. THE Frontend_Project SHALL support loading, empty, network error, and retry states.
3. THE Frontend_Project SHALL show request ID when useful for support.
4. THE Frontend_Project SHALL handle QR expired, revoked, outlet mismatch, and location mismatch.
5. THE Frontend_Project SHALL handle product unavailable and modifier invalid.
6. THE Frontend_Project SHALL handle checkout idempotency errors.
7. THE Frontend_Project SHALL handle payment provider errors.
8. THE Frontend_Project SHALL not display raw stack traces.

---

## P5-R21: Frontend Security and Data Privacy

**Priority:** P0

**User Story:** Sebagai platform owner, saya ingin frontend tidak mengekspos data sensitif atau melemahkan backend security.

### Acceptance Criteria

1. THE Frontend_Project SHALL not expose raw provider payload, provider secret, webhook secret, or service role keys.
2. THE Frontend_Project SHALL not expose admin notes or internal order ID in public UI.
3. THE Frontend_Project SHALL use opaque public tokens.
4. THE Frontend_Project SHALL not trust query params for authority.
5. THE Frontend_Project SHALL sanitize displayed user-provided content.
6. THE Frontend_Project SHALL avoid storing sensitive customer data in localStorage.
7. THE Frontend_Project SHALL clear checkout/session data after completion where appropriate.
8. THE Frontend_Project SHALL protect admin routes with existing auth guard.
9. THE Frontend_Project SHALL handle 401/403 securely.
10. THE Frontend_Project SHALL not include production secrets in client env.
11. THE Frontend_Project SHALL have security-focused tests for critical public surfaces.

---

## P5-R22: Loading, Polling, Retry, and Concurrency UX

**Priority:** P0

**User Story:** Sebagai customer/admin, saya ingin UI tetap aman saat loading, polling, retry, atau double click.

### Acceptance Criteria

1. THE Frontend_Project SHALL prevent duplicate checkout submission.
2. THE Frontend_Project SHALL prevent duplicate admin action submission.
3. THE Frontend_Project SHALL show checkout pending state.
4. THE Frontend_Project SHALL show payment polling state.
5. THE Frontend_Project SHALL stop or slow polling according to backend/rate limit.
6. THE Frontend_Project SHALL handle stale cart validation.
7. THE Frontend_Project SHALL refresh order after admin action.
8. THE Frontend_Project SHALL handle action and payment status conflicts.
9. THE Frontend_Project SHALL handle browser refresh during payment pending.
10. THE Frontend_Project SHALL handle back navigation safely.
11. THE Frontend_Project SHALL handle network retry without duplicate mutation.
12. THE Frontend_Project SHALL use idempotency for checkout retries.
13. THE Frontend_Project SHALL not assume success from client-side optimistic state for critical mutations.

---

## P5-R23: Existing WhatsApp/Admin Regression Preservation

**Priority:** P0

**User Story:** Sebagai owner, saya ingin frontend baru tidak merusak flow marketplace WhatsApp dan admin yang sudah ada.

### Acceptance Criteria

1. THE Frontend_Project SHALL identify existing WhatsApp-related frontend/admin screens.
2. THE Frontend_Project SHALL identify existing CRM/chat/admin routes.
3. THE Frontend_Project SHALL preserve existing admin auth and navigation unless explicitly changed.
4. THE Frontend_Project SHALL preserve existing WhatsApp order visibility.
5. THE Frontend_Project SHALL preserve existing product/payment/admin screens unless intentionally refactored.
6. THE Frontend_Project SHALL run existing frontend tests if available.
7. THE Frontend_Project SHALL add regression tests for impacted existing screens.
8. Any breaking change SHALL be documented with reason and migration path.

---

## P5-R24: Frontend Testing and E2E Coverage

**Priority:** P0

**User Story:** Sebagai developer, saya ingin frontend integration terbukti melalui automated tests sebelum alpha.

### Acceptance Criteria

1. THE Frontend_Project SHALL include API client tests.
2. THE Frontend_Project SHALL include component tests for cart/product/checkout.
3. THE Frontend_Project SHALL include QR flow tests.
4. THE Frontend_Project SHALL include checkout idempotency tests.
5. THE Frontend_Project SHALL include payment pending tests.
6. THE Frontend_Project SHALL include public order tracking tests.
7. THE Frontend_Project SHALL include admin order action tests.
8. THE Frontend_Project SHALL include admin QR tests when UI is implemented.
9. THE Frontend_Project SHALL include security tests for public data exposure.
10. THE Frontend_Project SHALL include E2E Online Store checkout.
11. THE Frontend_Project SHALL include E2E Universal QR checkout.
12. THE Frontend_Project SHALL include E2E Outlet QR checkout.
13. THE Frontend_Project SHALL include E2E Location QR checkout.
14. THE Frontend_Project SHALL include E2E admin order lifecycle.
15. THE Frontend_Project SHALL record manual sandbox verification separately.

---

## P5-R25: Accessibility and Mobile-First Usability

**Priority:** P1

**User Story:** Sebagai customer mobile, saya ingin store mudah dipakai dari HP setelah scan QR.

### Acceptance Criteria

1. Public store SHALL be mobile-first.
2. QR flow SHALL be mobile-first.
3. Cart, checkout, and payment pending SHALL be usable on small screens.
4. Tap targets SHOULD be comfortable.
5. Text contrast SHOULD follow accessible standards where feasible.
6. Forms SHALL have clear labels.
7. Error messages SHALL be associated with fields where feasible.
8. Loading state SHALL not block user indefinitely without feedback.
9. Keyboard navigation SHOULD work for admin critical flows.
10. Screen reader labels SHOULD be added for critical controls.
11. Destructive actions SHALL require confirmation where appropriate.
12. Accessibility limitations SHALL be documented before alpha.

---

## P5-R26: Frontend Documentation and Alpha Readiness

**Priority:** P0

**User Story:** Sebagai team, saya ingin dokumentasi frontend Phase 5 lengkap sebelum alpha.

### Acceptance Criteria

1. THE Frontend_Project SHALL produce `05.0-existing-frontend-contract-audit.md`.
2. THE Frontend_Project SHALL produce `05.1-frontend-gap-analysis-integration-map.md`.
3. THE Frontend_Project SHALL produce `05.2-frontend-architecture-app-shell.md`.
4. THE Frontend_Project SHALL produce `05.3-api-client-contract-integration.md`.
5. THE Frontend_Project SHALL produce `05.4-public-online-store-ui.md`.
6. THE Frontend_Project SHALL produce `05.5-qr-store-ui.md`.
7. THE Frontend_Project SHALL produce `05.6-cart-menu-interaction.md`.
8. THE Frontend_Project SHALL produce `05.7-checkout-payment-ui.md`.
9. THE Frontend_Project SHALL produce `05.8-public-order-tracking-ui.md`.
10. THE Frontend_Project SHALL produce `05.9-admin-order-management-ui.md`.
11. THE Frontend_Project SHALL produce `05.10-admin-qr-payment-settings-ui.md`.
12. THE Frontend_Project SHALL produce `05.11-frontend-security-error-state-handling.md`.
13. THE Frontend_Project SHALL produce `05.12-frontend-testing-e2e-stabilization.md`.
14. THE Frontend_Project SHALL produce `05.13-alpha-frontend-readiness.md`.
15. THE Frontend_Project SHALL maintain checklist of P0 requirements.
16. THE Frontend_Project SHALL record tests run, manual sandbox results, known limitations, and alpha GO/NO-GO result.

---

# No-Go Conditions

Phase 5 SHALL NOT be approved for alpha if any of these are true:

```text
frontend can mark payment paid
frontend sends payment_status
frontend sends fulfillment_status
frontend treats payment redirect as paid
frontend uses local total as final authority
frontend can override Outlet QR locked outlet
frontend can override Location QR locked location
checkout can submit without Idempotency-Key
duplicate checkout can happen from UI
admin action uses generic PATCH status
admin can complete unpaid order from UI
allowed_actions are guessed client-side
raw provider payload appears in public UI
internal order ID appears in public UI
admin notes appear in public UI
QR mismatch is unclear to user
payment failed/expired state is unclear to user
existing WhatsApp/admin flow breaks silently
```

---

# Definition of Done

Phase 5 is complete only when:

```text
existing frontend audited
backend contract audited
gap map completed
frontend architecture documented
API client centralized
public Online Store works
Universal QR works
Outlet QR works
Location QR works
cart validation works
checkout idempotency works
payment pending/status works
public order tracking works
admin order list/detail works
admin explicit actions work
admin QR minimal works if included for alpha
admin payment settings minimal works if included for alpha
frontend does not own payment/fulfillment/price authority
security/privacy checks pass
E2E critical flows pass
existing WhatsApp/admin regression checked
manual sandbox result recorded
alpha readiness doc produced
No-Go checklist cleared
```

---

# Final Requirement Statement

SELKOP Phase 5 SHALL deliver an audit-driven greenfield frontend for Online Store, QR Store, Checkout, Payment Pending, Public Order Tracking, and Admin Operations.

Frontend SHALL provide excellent UX, but SHALL NOT become authority for price, payment, fulfillment, QR lock, or admin lifecycle.

All critical frontend behavior SHALL be contract-driven, tested, and verified against Phase 4 backend authority before alpha.