Mantap Rido, lanjut 🔥
Setelah:

```text
Phase 3.6.4
Background Workers & Scheduler
```

fase berikutnya paling natural adalah:

# Phase 3.7 — REST API Architecture

## Objective

Mendesain arsitektur REST API untuk SELKOP Online Store dan QR Store agar seluruh komunikasi antara frontend, admin dashboard, payment provider, dan backend berjalan konsisten, aman, versioned, dan mudah dites.

Phase ini menjembatani:

```text
Frontend / Admin / Payment Provider
        ↓
REST API Layer
        ↓
Service Layer
        ↓
Repository Layer
        ↓
Database
```

Output dokumen:

```text
03.7-rest-api-architecture.md
```

---

# 1. API Architecture Principles

Prinsip utama API SELKOP:

```text
Controllers harus tipis.

Business logic tidak boleh di controller.

Controller hanya:
- parse request
- validate auth
- call service
- map response
- return HTTP response
```

Tidak boleh:

```text
Controller langsung akses database.

Controller langsung update payment status.

Controller langsung ubah order status tanpa service.

Controller percaya total dari frontend.
```

---

# 2. API Base URL

Base API final:

```http
/api/v1
```

Struktur utama:

```text
/api/v1/public/*
/api/v1/admin/*
/api/v1/webhooks/*
/api/v1/internal/*
```

---

# 3. API Boundary

## Public API

Dipakai oleh customer.

Contoh:

```text
Online Store
QR Store
Order Status Page
Payment Status Page
```

Public API tetap aman karena tidak berarti bebas validasi.

---

## Admin API

Dipakai oleh staff/admin.

Contoh:

```text
Order management
Product availability
QR management
Payment provider settings
```

Wajib auth + RBAC + outlet scope.

---

## Webhook API

Dipakai oleh payment provider seperti BayarGG.

```text
BayarGG → SELKOP Backend
```

Tidak dipanggil frontend.

---

## Internal API

Untuk future use.

Contoh:

```text
worker
system integration
internal tooling
future microservices
```

---

# 4. Public API Plan

Minimal endpoint untuk alpha:

```http
GET  /api/v1/public/storefronts/:storefrontSlug
GET  /api/v1/public/stores/:storefrontSlug
GET  /api/v1/public/qr/:qrToken
POST /api/v1/public/carts/validate
POST /api/v1/public/checkout
GET  /api/v1/public/payments/:paymentId/status
GET  /api/v1/public/orders/:publicOrderToken
```

---

# 5. Public Storefront API

## Endpoint

```http
GET /api/v1/public/storefronts/:storefrontSlug
```

Purpose:

```text
Load storefront
Load brand
Load outlets
Load categories
Load products
Load availability
```

Response harus hanya data public.

Tidak boleh expose:

```text
internal product cost
admin notes
raw database IDs jika tidak perlu
provider config
secret
audit logs
```

---

# 6. Public QR API

## Endpoint

```http
GET /api/v1/public/qr/:qrToken
```

Purpose:

```text
Resolve QR
Validate QR
Create QR Session
Return storefront context
Return outlet resolution rule
```

Response berbeda berdasarkan QR scope.

---

## Universal QR Response

```json
{
  "qr_scope": "universal",
  "allow_outlet_selection": true,
  "qr_session_token": "...",
  "storefront": {},
  "outlets": []
}
```

---

## Outlet QR Response

```json
{
  "qr_scope": "outlet",
  "allow_outlet_selection": false,
  "locked_outlet": {},
  "qr_session_token": "...",
  "storefront": {},
  "menu": []
}
```

---

## Location QR Response

```json
{
  "qr_scope": "location",
  "allow_outlet_selection": false,
  "locked_outlet": {},
  "locked_location": {
    "label": "Meja 07"
  },
  "fulfillment_type": "dine_in",
  "qr_session_token": "...",
  "storefront": {},
  "menu": []
}
```

---

# 7. Cart Validation API

## Endpoint

```http
POST /api/v1/public/carts/validate
```

Purpose:

```text
Validate cart before checkout
Recalculate price
Check product availability
Check outlet validity
Check modifier validity
Return final payable amount
```

Frontend amount hanya preview.

Backend tetap source of truth.

---

## Important Rule

Request boleh mengirim:

```text
product_id
quantity
modifiers
note
outlet_id
qr_session_token
```

Request tidak dipercaya untuk:

```text
unit_price
subtotal
total
discount
payment_status
order_status
```

---

# 8. Checkout API

## Endpoint

```http
POST /api/v1/public/checkout
```

Wajib header:

```http
Idempotency-Key: <unique-key>
```

Purpose:

```text
Validate checkout
Create checkout session
Create order
Create order items
Create payment
Call payment provider
Return payment URL / QRIS / order tracking token
```

---

## Checkout Response

```json
{
  "checkout_id": "...",
  "order": {
    "public_order_token": "...",
    "order_number": "SLK-000123",
    "public_status": "payment_pending"
  },
  "payment": {
    "payment_id": "...",
    "status": "pending",
    "method_type": "qris",
    "payment_url": "...",
    "qr_string": "...",
    "expires_at": "..."
  }
}
```

---

# 9. Payment Status API

## Endpoint

```http
GET /api/v1/public/payments/:paymentId/status
```

Purpose:

```text
Frontend polling payment status
```

Rule:

```text
Frontend hanya membaca status.

Frontend tidak boleh membuat payment menjadi paid.

Timer frontend tidak boleh mengubah status backend.
```

---

# 10. Public Order Status API

## Endpoint

```http
GET /api/v1/public/orders/:publicOrderToken
```

Purpose:

```text
Customer melihat status order
```

Response harus aman.

Boleh expose:

```text
order_number
public_order_status
payment_status public-safe
fulfillment_status public-safe
items snapshot
outlet name
fulfillment type
created_at
```

Tidak boleh expose:

```text
internal_note
admin_user
audit_logs
raw payment payload
full provider metadata
full customer phone
```

---

# 11. Admin API Plan

Minimal alpha endpoints:

```http
GET  /api/v1/admin/orders
GET  /api/v1/admin/orders/:orderId

POST /api/v1/admin/orders/:orderId/accept
POST /api/v1/admin/orders/:orderId/prepare
POST /api/v1/admin/orders/:orderId/ready
POST /api/v1/admin/orders/:orderId/complete
POST /api/v1/admin/orders/:orderId/cancel
```

---

# 12. Admin Order API Rules

Admin tidak boleh update status bebas seperti ini:

```http
PATCH /api/v1/admin/orders/:id
{
  "status": "completed"
}
```

Yang benar:

```http
POST /api/v1/admin/orders/:id/complete
```

Karena setiap action punya business rule sendiri.

---

## Admin Order Detail Response

Harus include:

```json
{
  "order": {},
  "payment_status": "paid",
  "fulfillment_status": "preparing",
  "public_order_status": "preparing",
  "allowed_actions": [
    "ready",
    "cancel"
  ]
}
```

Frontend admin wajib mengikuti `allowed_actions`.

---

# 13. Admin Product Availability API

Untuk alpha, minimal:

```http
GET  /api/v1/admin/products/availability
POST /api/v1/admin/products/:productId/availability
```

Purpose:

```text
Staff bisa menandai produk tersedia / sold out per outlet.
```

Rule:

```text
Availability selalu outlet-specific.
```

---

# 14. Admin QR API

Endpoint awal:

```http
GET  /api/v1/admin/qr-codes
POST /api/v1/admin/qr-codes
GET  /api/v1/admin/qr-codes/:qrCodeId
POST /api/v1/admin/qr-codes/:qrCodeId/activate
POST /api/v1/admin/qr-codes/:qrCodeId/disable
POST /api/v1/admin/qr-codes/:qrCodeId/revoke
```

QR tidak dihapus hard delete.

QR yang sudah dipakai order sebaiknya hanya bisa:

```text
disabled
revoked
expired
```

---

# 15. Payment Provider Settings API

Endpoint:

```http
GET  /api/v1/admin/settings/payment-providers
POST /api/v1/admin/settings/payment-providers/:providerCode/activate
POST /api/v1/admin/settings/payment-providers/:providerCode/configure
```

Rule:

```text
Wajib permission settings.payment.manage.

Wajib audit log.

Hanya satu active provider per workspace per mode.
```

---

# 16. Webhook API

Endpoint final yang disarankan:

```http
POST /api/v1/webhooks/payments/:providerCode
```

Contoh BayarGG:

```http
POST /api/v1/webhooks/payments/bayargg
```

Purpose:

```text
Receive payment event
Verify signature
Store webhook event
Process idempotently
Update payment status through service
Publish domain event
```

---

## Webhook Rule

Webhook controller harus cepat.

Ideal flow:

```text
Receive webhook
Verify signature
Store event
Queue processing job
Return 200 OK
```

Processing detail dilakukan oleh worker.

---

# 17. Authentication Strategy

## Public API

Tidak selalu butuh login.

Tapi tetap butuh:

```text
public token
qr session token
public order token
rate limit
input validation
```

---

## Admin API

Wajib:

```text
admin auth
workspace scope
role permission
outlet scope
```

---

## Webhook API

Wajib:

```text
provider signature verification
payload hash
provider reference validation
amount validation
currency validation
```

---

# 18. Authorization Matrix

Contoh awal:

| Endpoint                                   | Permission                |
| ------------------------------------------ | ------------------------- |
| `GET /admin/orders`                        | `orders.read`             |
| `POST /admin/orders/:id/accept`            | `orders.accept`           |
| `POST /admin/orders/:id/prepare`           | `orders.prepare`          |
| `POST /admin/orders/:id/ready`             | `orders.ready`            |
| `POST /admin/orders/:id/complete`          | `orders.complete`         |
| `POST /admin/orders/:id/cancel`            | `orders.cancel`           |
| `POST /admin/settings/payment-providers/*` | `settings.payment.manage` |
| `POST /admin/qr-codes`                     | `qr.manage`               |

---

# 19. Standard Response Shape

Gunakan response konsisten.

## Success

```json
{
  "success": true,
  "data": {},
  "meta": {
    "request_id": "..."
  }
}
```

## Error

```json
{
  "success": false,
  "error": {
    "code": "PRODUCT_UNAVAILABLE",
    "message": "Produk tidak tersedia di outlet ini.",
    "details": {}
  },
  "meta": {
    "request_id": "..."
  }
}
```

---

# 20. Error Code Catalog

Kategori error:

```text
VALIDATION_ERROR
AUTHENTICATION_REQUIRED
FORBIDDEN
NOT_FOUND
CONFLICT
RATE_LIMITED
PAYMENT_PROVIDER_ERROR
PAYMENT_WEBHOOK_INVALID
QR_EXPIRED
QR_REVOKED
QR_OUTLET_MISMATCH
QR_LOCATION_MISMATCH
PRODUCT_UNAVAILABLE
CHECKOUT_EXPIRED
IDEMPOTENCY_CONFLICT
ORDER_INVALID_TRANSITION
```

Error code harus stabil.

Frontend boleh bergantung pada `error.code`.

Frontend tidak boleh parsing text message.

---

# 21. HTTP Status Convention

| Case                     | HTTP Status |
| ------------------------ | ----------: |
| Success                  |       `200` |
| Created                  |       `201` |
| Validation Error         |       `400` |
| Unauthorized             |       `401` |
| Forbidden                |       `403` |
| Not Found                |       `404` |
| Conflict / Invalid State |       `409` |
| Rate Limited             |       `429` |
| Provider Error           |       `502` |
| Unexpected Error         |       `500` |

---

# 22. Pagination, Filtering, Sorting

Untuk list API seperti admin orders:

```http
GET /api/v1/admin/orders?page=1&page_size=20
```

Filter:

```http
?outlet_id=
?channel=
?payment_status=
?fulfillment_status=
?date_from=
?date_to=
```

Sorting:

```http
?sort=created_at.desc
```

Response:

```json
{
  "success": true,
  "data": [],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 120
  }
}
```

---

# 23. Idempotency Rules

Endpoint wajib idempotent:

```text
POST /public/checkout
POST /webhooks/payments/:providerCode
POST /admin/orders/:id/accept
POST /admin/orders/:id/prepare
POST /admin/orders/:id/ready
POST /admin/orders/:id/complete
POST /admin/orders/:id/cancel
```

Khusus checkout wajib:

```http
Idempotency-Key
```

Admin action idempotent secara business logic.

Contoh:

```text
Accept order yang sudah accepted
        ↓
Return current state, jangan double history.
```

---

# 24. Rate Limiting

Minimal rule:

| Endpoint                          |               Limit |
| --------------------------------- | ------------------: |
| `GET /public/qr/:token`           |         `60/min/IP` |
| `POST /public/carts/validate`     | `30/min/IP/session` |
| `POST /public/checkout`           | `10/min/IP/session` |
| `GET /public/payments/:id/status` |      `30/min/order` |
| `GET /public/orders/:token`       |      `60/min/token` |
| Admin login                       |    `5/min/IP/email` |
| Admin order action                |       `60/min/user` |

Webhook jangan pakai rate limit publik biasa.

Webhook diamankan dengan:

```text
signature verification
payload size limit
idempotency
provider allowlist optional
```

---

# 25. API Security Checklist

```text
☐ No raw database entity returned directly

☐ No internal note in public response

☐ No raw payment provider payload in public/admin normal response

☐ No frontend-controlled payment status

☐ No frontend-controlled total amount

☐ Public order token unguessable

☐ QR token unguessable

☐ Admin API validates workspace scope

☐ Admin API validates outlet scope

☐ Webhook verifies provider signature

☐ Request body size limited

☐ Rate limit enabled

☐ Request ID logged
```

---

# 26. API Versioning Strategy

Current:

```text
/api/v1
```

Rule:

```text
Breaking changes masuk /api/v2.

Non-breaking changes boleh tetap /api/v1.

Field baru boleh ditambahkan.

Field lama jangan dihapus tanpa deprecation.
```

Response contract harus stabil agar frontend tidak mudah rusak.

---

# 27. Controller-to-Service Mapping

| API Area          | Controller                   | Service                         |
| ----------------- | ---------------------------- | ------------------------------- |
| Public Storefront | `PublicStorefrontController` | `StorefrontService`             |
| Public QR         | `PublicQrController`         | `QrService`, `QrSessionService` |
| Cart Validation   | `CartController`             | `CartValidationService`         |
| Checkout          | `CheckoutController`         | `CheckoutService`               |
| Payment Status    | `PaymentController`          | `PaymentProviderService`        |
| Public Order      | `PublicOrderController`      | `OrderService`                  |
| Admin Orders      | `AdminOrderController`       | `AdminOrderService`             |
| Admin QR          | `AdminQrController`          | `QrService`                     |
| Webhook           | `PaymentWebhookController`   | `PaymentProviderService`        |

---

# 28. API Testing Strategy

Minimal test:

```text
Public QR:
☐ Universal QR response
☐ Outlet QR response
☐ Location QR response
☐ Expired QR
☐ Revoked QR

Checkout:
☐ Valid checkout
☐ Invalid product
☐ Outlet mismatch
☐ Location mismatch
☐ Duplicate idempotency key
☐ Payment provider error

Payment:
☐ Pending status
☐ Paid status from webhook
☐ Failed status
☐ Expired status

Admin:
☐ Accept paid order
☐ Reject unpaid order transition
☐ Prepare order
☐ Ready order
☐ Complete order
☐ Cancel with reason

Webhook:
☐ Valid signature
☐ Invalid signature
☐ Duplicate webhook
☐ Amount mismatch
☐ Unknown provider reference
```

---

# 29. Deliverable Structure

Dokumen `03.7-rest-api-architecture.md` berisi:

```text
1. API Principles
2. API Boundary
3. Base URL
4. Public API
5. Admin API
6. Webhook API
7. Internal API
8. Auth Strategy
9. Authorization Matrix
10. Request / Response Standard
11. Error Code Catalog
12. Pagination
13. Idempotency
14. Rate Limiting
15. API Security
16. Versioning
17. Controller-Service Mapping
18. Testing Strategy
19. Alpha Readiness Checklist
```

---

# 30. Alpha Readiness Checklist

Untuk alpha testing, minimal API yang harus siap:

```text
☐ GET public storefront

☐ GET public QR

☐ POST cart validate

☐ POST checkout with idempotency

☐ GET payment status

☐ GET public order status

☐ GET admin orders

☐ POST admin accept

☐ POST admin prepare

☐ POST admin ready

☐ POST admin complete

☐ POST admin cancel

☐ POST BayarGG webhook

☐ Standard response shape

☐ Standard error code

☐ Admin authorization

☐ Public rate limit

☐ Webhook verification

☐ API integration tests
```

---

# Output Akhir Phase 3.7

Phase ini menjadi kontrak utama antara frontend dan backend.

```text
Phase 3.6.4
Background Workers & Scheduler
        │
        ▼
=============================
Phase 3.7
REST API ARCHITECTURE
=============================
        │
        ▼
Phase 3.7.1
OpenAPI Specification
        │
        ▼
Phase 3.8
Testing & Alpha Readiness
```

Dengan Phase 3.7 ini, frontend tidak perlu menebak response backend, admin dashboard tidak bisa bypass business rule, dan webhook BayarGG punya jalur resmi yang aman, idempotent, dan auditable. 🚀
