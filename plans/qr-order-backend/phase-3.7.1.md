Siap Rido, lanjut 🚀
Setelah **Phase 3.7 — REST API Architecture**, fase berikutnya adalah membuat kontrak formal API yang bisa dibaca manusia dan mesin.

# Phase 3.7.1 — OpenAPI Specification

## Objective

Mendefinisikan seluruh REST API SELKOP dalam format **OpenAPI Specification** agar frontend, backend, admin dashboard, payment webhook, QA, dan AI Coding Agent memiliki satu kontrak API yang sama.

Kalau **Phase 3.7** menjawab:

> API apa saja yang dibutuhkan?

Maka **Phase 3.7.1** menjawab:

> Bentuk request, response, schema, error, auth, dan contoh payload-nya seperti apa?

---

# Deliverable

```text
03.7.1-openapi-specification.md
```

File teknis:

```text
openapi.yaml
```

Opsional struktur folder:

```text
docs/
  api/
    openapi.yaml
    schemas/
      common.yaml
      storefront.yaml
      qr.yaml
      cart.yaml
      checkout.yaml
      payment.yaml
      order.yaml
      admin.yaml
      webhook.yaml
```

---

# 1. OpenAPI Purpose

Dokumen ini menjadi kontrak resmi antara:

```text
Frontend
Admin Dashboard
Backend Controller
Service Layer
QA Tester
AI Coding Agent
Payment Provider Webhook
```

Dengan OpenAPI, kita bisa menghasilkan:

```text
API documentation
Mock server
TypeScript client
Backend route stub
Request validation
Response validation
Contract test
Postman collection
Swagger UI / Redoc
```

---

# 2. OpenAPI Version

Gunakan:

```yaml
openapi: 3.1.0
```

API version:

```yaml
info:
  title: SELKOP Online & QR Store API
  version: 1.0.0-alpha
  description: API contract for SELKOP Online Store, QR Store, Admin Dashboard, and Payment Webhooks.
```

Base URL:

```yaml
servers:
  - url: https://api.selkop.local/api/v1
    description: Local / Development
  - url: https://sandbox-api.selkop.com/api/v1
    description: Sandbox
  - url: https://api.selkop.com/api/v1
    description: Production
```

---

# 3. API Tags

Gunakan tag agar dokumentasi rapi.

```yaml
tags:
  - name: Public Storefront
  - name: Public QR
  - name: Public Cart
  - name: Public Checkout
  - name: Public Payment
  - name: Public Order
  - name: Admin Orders
  - name: Admin Products
  - name: Admin QR
  - name: Admin Settings
  - name: Webhooks
  - name: Internal
```

---

# 4. Security Schemes

## Public API

Public API tidak selalu butuh login, tapi bisa menggunakan:

```yaml
QrSessionToken:
  type: apiKey
  in: header
  name: X-QR-Session-Token
```

```yaml
IdempotencyKey:
  type: apiKey
  in: header
  name: Idempotency-Key
```

---

## Admin API

Admin API wajib auth.

```yaml
AdminBearerAuth:
  type: http
  scheme: bearer
  bearerFormat: JWT
```

---

## Webhook API

Webhook menggunakan signature dari provider.

```yaml
ProviderWebhookSignature:
  type: apiKey
  in: header
  name: X-Provider-Signature
```

Untuk BayarGG nanti bisa disesuaikan dengan header sebenarnya.

---

# 5. Common Schema Components

Semua schema umum diletakkan di `components.schemas`.

## Common Response

```yaml
SuccessResponse:
  type: object
  required:
    - success
    - data
    - meta
  properties:
    success:
      type: boolean
      example: true
    data:
      type: object
    meta:
      $ref: '#/components/schemas/ResponseMeta'
```

---

## Error Response

```yaml
ErrorResponse:
  type: object
  required:
    - success
    - error
    - meta
  properties:
    success:
      type: boolean
      example: false
    error:
      $ref: '#/components/schemas/ErrorObject'
    meta:
      $ref: '#/components/schemas/ResponseMeta'
```

---

## Error Object

```yaml
ErrorObject:
  type: object
  required:
    - code
    - message
  properties:
    code:
      type: string
      example: PRODUCT_UNAVAILABLE
    message:
      type: string
      example: Produk tidak tersedia di outlet ini.
    details:
      type: object
      additionalProperties: true
```

---

## Response Meta

```yaml
ResponseMeta:
  type: object
  properties:
    request_id:
      type: string
      example: req_01HXABC123
    timestamp:
      type: string
      format: date-time
```

---

# 6. Common Enums

OpenAPI harus mendefinisikan enum resmi.

```yaml
OrderChannel:
  type: string
  enum:
    - online_store
    - qr_store
```

```yaml
FulfillmentType:
  type: string
  enum:
    - pickup
    - dine_in
    - takeaway
```

```yaml
PaymentStatus:
  type: string
  enum:
    - unpaid
    - pending
    - processing
    - paid
    - failed
    - expired
    - refunded
    - cancelled
    - manual_review
```

```yaml
FulfillmentStatus:
  type: string
  enum:
    - not_started
    - awaiting_acceptance
    - accepted
    - preparing
    - ready
    - completed
    - cancelled
```

```yaml
PublicOrderStatus:
  type: string
  enum:
    - payment_pending
    - payment_processing
    - payment_failed
    - payment_expired
    - order_received
    - accepted
    - preparing
    - ready
    - completed
    - cancelled
```

```yaml
QRScope:
  type: string
  enum:
    - universal
    - outlet
    - location
```

```yaml
PaymentMethodType:
  type: string
  enum:
    - qris
    - virtual_account
    - ewallet
    - bank_transfer
    - card
    - manual
```

---

# 7. Public Storefront Endpoints

## GET Public Storefront

```http
GET /public/storefronts/{storefrontSlug}
```

Purpose:

```text
Load storefront, brand, outlets, categories, products, and availability.
```

OpenAPI harus mendefinisikan:

```text
Path params
Response 200
Response 404
Response 409 if ordering disabled
```

Schema utama:

```yaml
StorefrontResponse
BrandPublic
OutletPublic
CategoryPublic
ProductPublic
ModifierGroupPublic
ModifierOptionPublic
```

---

# 8. Public QR Endpoint

## GET Public QR

```http
GET /public/qr/{qrToken}
```

Purpose:

```text
Resolve QR token, validate QR, create QR session, and return store context.
```

Response harus mendukung 3 varian:

```text
Universal QR Response
Outlet QR Response
Location QR Response
```

Gunakan `oneOf`.

```yaml
QRResolveResponse:
  oneOf:
    - $ref: '#/components/schemas/UniversalQRResponse'
    - $ref: '#/components/schemas/OutletQRResponse'
    - $ref: '#/components/schemas/LocationQRResponse'
```

Error:

```text
QR_EXPIRED
QR_REVOKED
QR_NOT_FOUND
OUTLET_CLOSED
ORDERING_DISABLED
```

---

# 9. Cart Validation Endpoint

## POST Cart Validate

```http
POST /public/carts/validate
```

Request schema:

```yaml
CartValidateRequest:
  type: object
  required:
    - channel
    - fulfillment_type
    - outlet_id
    - items
  properties:
    channel:
      $ref: '#/components/schemas/OrderChannel'
    qr_session_token:
      type: string
      nullable: true
    outlet_id:
      type: string
      format: uuid
    fulfillment_type:
      $ref: '#/components/schemas/FulfillmentType'
    items:
      type: array
      items:
        $ref: '#/components/schemas/CartItemInput'
```

Response:

```yaml
CartValidateResponse:
  type: object
  properties:
    valid:
      type: boolean
    subtotal_amount:
      type: integer
    service_fee_amount:
      type: integer
    tax_amount:
      type: integer
    total_amount:
      type: integer
    currency:
      type: string
      example: IDR
    items:
      type: array
      items:
        $ref: '#/components/schemas/CartValidatedItem'
```

Rule penting:

```text
Frontend tidak boleh mengirim final price sebagai source of truth.
```

---

# 10. Checkout Endpoint

## POST Checkout

```http
POST /public/checkout
```

Header wajib:

```http
Idempotency-Key: <key>
```

Request schema:

```yaml
CheckoutRequest:
  type: object
  required:
    - channel
    - fulfillment_type
    - outlet_id
    - customer
    - items
    - payment_method_type
  properties:
    channel:
      $ref: '#/components/schemas/OrderChannel'
    qr_session_token:
      type: string
      nullable: true
    outlet_id:
      type: string
      format: uuid
    qr_location_id:
      type: string
      format: uuid
      nullable: true
    fulfillment_type:
      $ref: '#/components/schemas/FulfillmentType'
    customer:
      $ref: '#/components/schemas/CheckoutCustomer'
    items:
      type: array
      items:
        $ref: '#/components/schemas/CartItemInput'
    payment_method_type:
      $ref: '#/components/schemas/PaymentMethodType'
```

Response:

```yaml
CheckoutResponse:
  type: object
  properties:
    checkout_id:
      type: string
      format: uuid
    order:
      $ref: '#/components/schemas/CheckoutOrderSummary'
    payment:
      $ref: '#/components/schemas/CheckoutPaymentSummary'
```

Error:

```text
IDEMPOTENCY_CONFLICT
PRODUCT_UNAVAILABLE
QR_OUTLET_MISMATCH
QR_LOCATION_MISMATCH
PAYMENT_PROVIDER_ERROR
CHECKOUT_VALIDATION_FAILED
```

---

# 11. Payment Status Endpoint

## GET Payment Status

```http
GET /public/payments/{paymentId}/status
```

Response:

```yaml
PaymentStatusResponse:
  type: object
  properties:
    payment_id:
      type: string
      format: uuid
    status:
      $ref: '#/components/schemas/PaymentStatus'
    amount:
      type: integer
    currency:
      type: string
      example: IDR
    expires_at:
      type: string
      format: date-time
      nullable: true
```

Rule:

```text
Endpoint ini read-only.
Tidak ada endpoint public untuk mark payment paid.
```

---

# 12. Public Order Endpoint

## GET Public Order

```http
GET /public/orders/{publicOrderToken}
```

Response:

```yaml
PublicOrderResponse:
  type: object
  properties:
    order_number:
      type: string
      example: SLK-000123
    public_order_status:
      $ref: '#/components/schemas/PublicOrderStatus'
    payment_status:
      $ref: '#/components/schemas/PaymentStatus'
    fulfillment_status:
      $ref: '#/components/schemas/FulfillmentStatus'
    outlet:
      $ref: '#/components/schemas/PublicOutletSnapshot'
    items:
      type: array
      items:
        $ref: '#/components/schemas/PublicOrderItem'
    total_amount:
      type: integer
    currency:
      type: string
```

Tidak boleh expose:

```text
internal_note
audit_logs
raw provider payload
admin_user_id
full customer phone
```

---

# 13. Admin Order Endpoints

Endpoint utama:

```http
GET  /admin/orders
GET  /admin/orders/{orderId}
POST /admin/orders/{orderId}/accept
POST /admin/orders/{orderId}/prepare
POST /admin/orders/{orderId}/ready
POST /admin/orders/{orderId}/complete
POST /admin/orders/{orderId}/cancel
```

Semua memakai:

```yaml
security:
  - AdminBearerAuth: []
```

Admin order detail harus include:

```yaml
allowed_actions:
  type: array
  items:
    type: string
    enum:
      - accept
      - prepare
      - ready
      - complete
      - cancel
```

Cancel request wajib punya reason:

```yaml
AdminCancelOrderRequest:
  type: object
  required:
    - reason
  properties:
    reason:
      type: string
      minLength: 3
```

---

# 14. Admin Product Availability Endpoints

```http
GET  /admin/products/availability
POST /admin/products/{productId}/availability
```

Request:

```yaml
UpdateProductAvailabilityRequest:
  type: object
  required:
    - outlet_id
    - is_available
  properties:
    outlet_id:
      type: string
      format: uuid
    is_available:
      type: boolean
    sold_out_until:
      type: string
      format: date-time
      nullable: true
    availability_note:
      type: string
      nullable: true
```

---

# 15. Admin QR Endpoints

```http
GET  /admin/qr-codes
POST /admin/qr-codes
GET  /admin/qr-codes/{qrCodeId}
POST /admin/qr-codes/{qrCodeId}/activate
POST /admin/qr-codes/{qrCodeId}/disable
POST /admin/qr-codes/{qrCodeId}/revoke
```

Create QR request harus support:

```yaml
CreateQRCodeRequest:
  type: object
  required:
    - scope
  properties:
    scope:
      $ref: '#/components/schemas/QRScope'
    outlet_id:
      type: string
      format: uuid
      nullable: true
    qr_location_id:
      type: string
      format: uuid
      nullable: true
    source_type:
      type: string
      nullable: true
    source_label:
      type: string
      nullable: true
    default_fulfillment_type:
      $ref: '#/components/schemas/FulfillmentType'
```

Validation rule:

```text
scope = universal → outlet_id null, qr_location_id null
scope = outlet → outlet_id required
scope = location → outlet_id required, qr_location_id required
```

---

# 16. Payment Provider Settings Endpoints

```http
GET  /admin/settings/payment-providers
POST /admin/settings/payment-providers/{providerCode}/activate
POST /admin/settings/payment-providers/{providerCode}/configure
```

Security:

```text
Required permission:
settings.payment.manage
```

Schema harus provider-agnostic.

Tidak boleh schema seperti:

```text
bayargg_secret
xendit_invoice_id
midtrans_token
```

Gunakan:

```yaml
PaymentProviderSetting:
  type: object
  properties:
    provider_code:
      type: string
      example: bayargg
    mode:
      type: string
      enum:
        - sandbox
        - production
    is_active:
      type: boolean
    enabled_methods:
      type: array
      items:
        $ref: '#/components/schemas/PaymentMethodType'
```

---

# 17. Webhook Endpoint

## Payment Provider Webhook

```http
POST /webhooks/payments/{providerCode}
```

Contoh:

```http
POST /webhooks/payments/bayargg
```

OpenAPI harus mendefinisikan:

```text
Provider code path parameter
Signature header
Raw payload requirement
Success response
Invalid signature response
Duplicate webhook response
```

Response success:

```yaml
WebhookAcceptedResponse:
  type: object
  properties:
    success:
      type: boolean
      example: true
    received:
      type: boolean
      example: true
    event_id:
      type: string
      nullable: true
```

Rule:

```text
Webhook accepted bukan berarti payment langsung paid.
Payment status tetap diproses melalui service dan state machine.
```

---

# 18. Operation ID Standard

Setiap endpoint wajib punya `operationId`.

Format:

```text
verbDomainResourceAction
```

Contoh:

```yaml
operationId: getPublicQRCode
operationId: validatePublicCart
operationId: createPublicCheckout
operationId: getPublicPaymentStatus
operationId: acceptAdminOrder
operationId: completeAdminOrder
operationId: receivePaymentWebhook
```

Ini penting untuk generated client SDK.

---

# 19. Request / Response Examples

Setiap endpoint penting wajib punya example.

Minimal:

```text
Universal QR response
Outlet QR response
Location QR response
Cart validate request
Cart validate response
Checkout request
Checkout response
Payment pending response
Payment paid response
Admin order detail response
Webhook accepted response
Webhook invalid signature response
```

Example membuat frontend dan QA jauh lebih cepat bekerja.

---

# 20. Error Response Catalog

OpenAPI harus memuat daftar error resmi.

Contoh:

```yaml
ErrorCode:
  type: string
  enum:
    - VALIDATION_ERROR
    - AUTHENTICATION_REQUIRED
    - FORBIDDEN
    - NOT_FOUND
    - CONFLICT
    - RATE_LIMITED
    - PAYMENT_PROVIDER_ERROR
    - PAYMENT_WEBHOOK_INVALID
    - QR_EXPIRED
    - QR_REVOKED
    - QR_OUTLET_MISMATCH
    - QR_LOCATION_MISMATCH
    - PRODUCT_UNAVAILABLE
    - CHECKOUT_EXPIRED
    - IDEMPOTENCY_CONFLICT
    - ORDER_INVALID_TRANSITION
```

Frontend harus bergantung pada:

```text
error.code
```

Bukan parsing:

```text
error.message
```

---

# 21. Pagination Contract

Untuk list endpoint:

```http
GET /admin/orders?page=1&page_size=20
```

Response:

```yaml
PaginationMeta:
  type: object
  properties:
    page:
      type: integer
    page_size:
      type: integer
    total:
      type: integer
    total_pages:
      type: integer
```

Endpoint yang butuh pagination:

```text
GET /admin/orders
GET /admin/qr-codes
GET /admin/products/availability
GET /admin/settings/payment-providers
```

---

# 22. API Validation Rules

OpenAPI harus dipakai untuk validasi:

```text
Request body
Path params
Query params
Response schema
Enum value
Required fields
Nullable fields
Format uuid
Format date-time
Minimum / maximum values
```

Contoh:

```yaml
quantity:
  type: integer
  minimum: 1
  maximum: 99
```

---

# 23. Contract Testing

OpenAPI bukan hanya dokumentasi.

Harus dipakai untuk test.

Minimal contract test:

```text
Backend response matches OpenAPI schema
Frontend generated client matches OpenAPI
Invalid request returns documented error
Missing required field returns VALIDATION_ERROR
Unauthorized admin request returns 401
Forbidden admin request returns 403
Webhook invalid signature returns 401/403
```

Tools bisa dipilih nanti, tapi konsepnya wajib masuk dokumen.

---

# 24. Mock Server Strategy

OpenAPI bisa menghasilkan mock server.

Use case:

```text
Frontend bisa develop sebelum backend selesai.
QA bisa test flow lebih awal.
AI Coding Agent bisa generate endpoint skeleton.
```

Mock scenarios:

```text
QR universal success
QR outlet success
QR location success
Checkout success
Checkout failed product unavailable
Payment pending
Payment paid
Payment expired
Admin order ready
Webhook accepted
```

---

# 25. Generated Client Strategy

Dari OpenAPI, kita bisa generate client.

Target:

```text
Frontend Web Client
Admin Dashboard Client
Internal Worker Client optional
```

Generated client membantu:

```text
Type safety
Consistent request/response
Reduced manual API bugs
Auto-complete for frontend developer
```

---

# 26. OpenAPI Governance

Agar OpenAPI tetap rapi:

```text
Semua endpoint baru wajib masuk openapi.yaml.

Breaking change harus naik API version.

Schema tidak boleh expose internal DB field sembarangan.

Error code baru harus didaftarkan.

Enum baru harus disetujui.

Endpoint deprecated harus diberi deprecation flag.
```

Contoh deprecated:

```yaml
deprecated: true
```

---

# 27. OpenAPI CI Checklist

Setiap pull request wajib menjalankan:

```text
OpenAPI lint
Schema validation
Breaking change detection
Generated client compile check
Contract test
Example payload validation
```

Ini mencegah API berubah diam-diam dan merusak frontend.

---

# 28. Alpha Readiness Checklist

Untuk alpha testing, OpenAPI minimal harus mencakup:

```text
☐ Public storefront endpoint

☐ Public QR endpoint

☐ Cart validation endpoint

☐ Checkout endpoint

☐ Payment status endpoint

☐ Public order status endpoint

☐ Admin order list/detail

☐ Admin order action endpoints

☐ Admin product availability

☐ Admin QR management

☐ Payment provider settings

☐ BayarGG webhook endpoint

☐ Common response schema

☐ Common error schema

☐ Common enum schema

☐ Auth scheme

☐ Idempotency header

☐ Example request/response

☐ Error code catalog

☐ Contract test plan
```

---

# Final Document Structure

```text
03.7.1-openapi-specification.md
```

Isi:

```text
1. OpenAPI Purpose
2. OpenAPI Version
3. Servers
4. Tags
5. Security Schemes
6. Common Schemas
7. Common Enums
8. Public Storefront API
9. Public QR API
10. Cart Validation API
11. Checkout API
12. Payment Status API
13. Public Order API
14. Admin Orders API
15. Admin Product Availability API
16. Admin QR API
17. Admin Payment Provider Settings API
18. Webhook API
19. Operation ID Standard
20. Request / Response Examples
21. Error Code Catalog
22. Pagination Contract
23. Validation Rules
24. Contract Testing
25. Mock Server Strategy
26. Generated Client Strategy
27. OpenAPI Governance
28. Alpha Readiness Checklist
```

---

# Output Akhir Phase 3.7.1

Dengan fase ini, SELKOP punya kontrak API yang jelas dan siap dipakai oleh frontend, backend, QA, dan AI Coding Agent.

```text
Phase 3.7
REST API Architecture
        │
        ▼
=============================
Phase 3.7.1
OPENAPI SPECIFICATION
=============================
        │
        ▼
Phase 3.8
Testing & Alpha Readiness
```

Phase ini penting banget karena setelah `openapi.yaml` fix, implementasi backend bisa berjalan lebih cepat dan lebih aman. Frontend juga tidak perlu menebak-nebak bentuk response dari backend.
