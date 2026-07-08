

Siap, Rido. Kita lanjut ke **Phase 3.6.2 — Repository Architecture** ☕🔥

Kalau **3.6.1 Service Contracts** menjawab:

> “Service menerima input apa, output apa, dan error apa?”

Maka **3.6.2 Repository Architecture** menjawab:

> **“Bagaimana service membaca dan menulis data ke database dengan aman, konsisten, dan tidak bocor antar-domain?”**

Ini penting banget karena backend kamu sudah mulai kompleks: **Online Store, Universal QR, Outlet QR, Location QR, multi-outlet, configurable payment provider, BayarGG, order lifecycle, dan audit log.**

---

# Phase 3.6.2 — Repository Architecture

## Objective

Mendesain pola akses database yang bersih, aman, reusable, dan sesuai dengan domain boundary.

Repository bertugas sebagai lapisan akses data. Repository **tidak boleh menyimpan business logic**, tetapi harus menyediakan query dan persistence operation yang dibutuhkan oleh service layer.

---

# Deliverable

```txt
03.6.2-repository-architecture.md
```

---

# 1. Repository Principles

Prinsip utama:

```txt
Controller tidak boleh akses database langsung.

Service tidak boleh menulis raw SQL berulang-ulang.

Repository tidak boleh memanggil service lain.

Repository tidak boleh memanggil payment provider.

Repository tidak boleh mengandung business decision.

Repository hanya bertugas mengambil, menyimpan, dan mengunci data.
```

Struktur ideal:

```txt
Controller
   ↓
Service
   ↓
Repository
   ↓
Database
```

Bukan:

```txt
Controller
   ↓
Database
```

atau:

```txt
Repository
   ↓
Payment Provider
```

---

# 2. Repository Scope

Repository dibuat berdasarkan **aggregate / domain**, bukan berdasarkan setiap tabel kecil.

Jadi jangan membuat terlalu banyak repository seperti:

```txt
OrderItemModifierRepository
PaymentStatusHistoryRepository
QRLocationRepository
```

Kecuali memang perlu.

Lebih baik:

```txt
OrderRepository
PaymentRepository
QrRepository
CatalogRepository
```

Karena tabel kecil biasanya bagian dari aggregate besar.

---

# 3. Aggregate Repository Boundaries

## Recommended Aggregate Repositories

```txt
WorkspaceRepository
StorefrontRepository
OutletRepository
QrRepository
QrSessionRepository
CatalogRepository
CheckoutRepository
IdempotencyRepository
OrderRepository
PaymentRepository
PaymentProviderSettingsRepository
AdminUserRepository
AuditLogRepository
AnalyticsRepository
```

Ini sudah cukup rapi untuk MVP/alpha.

---

# 4. Repository Responsibility Matrix

| Repository | Tanggung Jawab |
|---|---|
| `WorkspaceRepository` | Workspace, brand, global settings |
| `StorefrontRepository` | Public storefront, storefront outlets |
| `OutletRepository` | Outlet, operating status, outlet availability |
| `QrRepository` | QR code, QR scope, QR source, QR status |
| `QrSessionRepository` | QR session, locked/selected outlet, TTL |
| `CatalogRepository` | Categories, products, modifiers |
| `CheckoutRepository` | Checkout session dan checkout item snapshot |
| `IdempotencyRepository` | Idempotency key dan request hash |
| `OrderRepository` | Orders, items, status history |
| `PaymentRepository` | Payments, payment history, webhook events |
| `PaymentProviderSettingsRepository` | Active provider settings, BayarGG config |
| `AdminUserRepository` | Admin user, roles, permissions, outlet scope |
| `AuditLogRepository` | Append-only audit trail |
| `AnalyticsRepository` | QR scan, checkout, conversion event |

---

# 5. Workspace Scoping Rule

Semua repository wajib menerima `workspaceId`.

Contoh:

```ts
findOrderById(workspaceId, orderId)
findProductsByOutlet(workspaceId, outletId)
findActivePaymentProvider(workspaceId, mode)
```

Hindari method seperti:

```ts
findOrderById(orderId)
```

Karena bisa membuka risiko data lintas workspace.

Rule:

```txt
Semua query bisnis wajib scoped by workspace_id.
```

---

# 6. Command vs Query Repository

Pisahkan operasi repository menjadi dua jenis.

## Query Methods

Untuk baca data:

```ts
findById()
findBySlug()
listActiveProducts()
findOrderDetail()
```

## Command Methods

Untuk tulis/update data:

```ts
createOrder()
updatePaymentStatus()
markQrSessionCompleted()
appendAuditLog()
```

Untuk query kompleks dashboard, boleh pakai read model khusus.

---

# 7. Repository Return Type

Repository **tidak boleh mengembalikan raw database row langsung ke controller**.

Idealnya repository mengembalikan:

```txt
Domain Model
DTO internal
Aggregate object
```

Contoh:

```ts
type OrderAggregate = {
  order: Order;
  items: OrderItem[];
  payment?: Payment;
  qrContext?: QrContext;
};
```

Jangan langsung expose schema database mentah ke service yang tidak perlu tahu detail tabel.

---

# 8. Transaction-Aware Repository

Repository harus bisa berjalan di dalam transaction.

Pattern:

```ts
OrderRepository.withTx(tx)
PaymentRepository.withTx(tx)
AuditLogRepository.withTx(tx)
```

Contoh checkout:

```txt
CheckoutService
   ↓ begin transaction
IdempotencyRepository
OrderRepository
PaymentRepository
AuditLogRepository
   ↓ commit
PaymentProviderService call BayarGG
```

Repository tidak membuka transaction sendiri kecuali memang operation itu sangat kecil dan isolated.

**Transaction owner tetap Service.**

---

# 9. Locking Strategy

Beberapa operasi butuh row lock.

## Wajib Lock

| Operation | Lock Target |
|---|---|
| Checkout with idempotency | `idempotency_keys` |
| Payment webhook processing | `payments` |
| Admin order status update | `orders` |
| QR session completion | `qr_sessions` |
| Product availability update | `product_availability` |

Contoh method:

```ts
findPaymentForUpdate(workspaceId, paymentId)
findOrderForUpdate(workspaceId, orderId)
findIdempotencyKeyForUpdate(workspaceId, key)
```

---

# 10. Repository List

## 10.1 `WorkspaceRepository`

Tanggung jawab:

```txt
workspace
brand
workspace settings
```

Methods:

```ts
findWorkspaceBySlug(slug)
findBrandBySlug(workspaceId, brandSlug)
getWorkspaceSetting(workspaceId, key)
```

---

## 10.2 `StorefrontRepository`

Tanggung jawab:

```txt
/store/:slug
storefront status
storefront outlets
```

Methods:

```ts
findStorefrontBySlug(workspaceId, slug)
listStorefrontOutlets(workspaceId, storefrontId)
isOutletAvailableForStorefront(workspaceId, storefrontId, outletId)
```

---

## 10.3 `OutletRepository`

Tanggung jawab:

```txt
outlet final
opening status
ordering enabled
fulfillment options
```

Methods:

```ts
findOutletById(workspaceId, outletId)
listActiveOutlets(workspaceId)
validateOutletOrdering(workspaceId, outletId)
```

---

## 10.4 `QrRepository`

Tanggung jawab:

```txt
Universal QR
Outlet QR
Location QR
QR source
QR status
QR scope
```

Methods:

```ts
findQrByPublicCode(publicCode)
createQrCode(data)
revokeQrCode(workspaceId, qrCodeId, reason)
incrementQrScanCount(workspaceId, qrCodeId)
```

Important query result:

```ts
type QrCodeContext = {
  qrCodeId: string;
  workspaceId: string;
  brandId?: string;
  scope: "universal" | "outlet" | "location";
  outletId?: string;
  qrLocationId?: string;
  sourceType?: string;
  status: "active" | "inactive" | "expired" | "revoked";
};
```

---

## 10.5 `QrSessionRepository`

Tanggung jawab:

```txt
session_token
locked_outlet_id
selected_outlet_id
locked_location_id
TTL
completed session
```

Methods:

```ts
createSession(data)
findSessionByToken(sessionToken)
findActiveSessionByToken(sessionToken)
updateSelectedOutlet(workspaceId, sessionId, outletId)
markCompleted(workspaceId, sessionId, orderId)
expireOldSessions(now)
```

Untuk Universal QR:

```txt
selected_outlet_id boleh null sampai customer memilih outlet.
```

Untuk Outlet/Location QR:

```txt
locked_outlet_id wajib ada.
```

---

## 10.6 `CatalogRepository`

Tanggung jawab:

```txt
categories
products
modifiers
product availability
```

Methods:

```ts
listCategories(workspaceId, brandId)
listProductsForOutlet(workspaceId, outletId)
findProductWithModifiers(workspaceId, productId)
findProductsByIds(workspaceId, productIds)
listAvailabilityForOutlet(workspaceId, outletId)
```

Catatan:

```txt
CatalogRepository boleh membaca product_availability,
tetapi keputusan valid/tidak valid tetap dilakukan oleh CartValidationService.
```

---

## 10.7 `CheckoutRepository`

Tanggung jawab:

```txt
checkout session
checkout item snapshot
checkout status
```

Methods:

```ts
createCheckoutSession(data)
createCheckoutItems(checkoutSessionId, items)
markCheckoutConverted(workspaceId, checkoutSessionId, orderId)
markCheckoutExpired(workspaceId, checkoutSessionId)
findCheckoutById(workspaceId, checkoutSessionId)
```

---

## 10.8 `IdempotencyRepository`

Tanggung jawab:

```txt
double checkout protection
request hash
response replay
```

Methods:

```ts
findByKeyForUpdate(workspaceId, key)
createProcessingKey(workspaceId, key, requestHash)
markCompleted(workspaceId, key, responseJson, resourceId)
markFailed(workspaceId, key, errorJson)
```

Rules:

```txt
Key sama + request hash sama → return response lama.

Key sama + request hash beda → conflict.

Key processing → reject/retry.
```

---

## 10.9 `OrderRepository`

Tanggung jawab:

```txt
orders
order_items
order_item_modifiers
order_status_history
```

Methods:

```ts
createOrder(data)
createOrderItems(orderId, items)
findOrderById(workspaceId, orderId)
findOrderForUpdate(workspaceId, orderId)
findOrderByPublicToken(publicOrderToken)
listOrders(filter)
updateFulfillmentStatus(workspaceId, orderId, status)
updatePaymentStatus(workspaceId, orderId, status)
appendStatusHistory(orderId, history)
```

Important:

```txt
OrderRepository boleh update status,
tetapi tidak boleh memutuskan apakah transisi status valid.

Validasi status dilakukan oleh OrderService / State Machine.
```

---

## 10.10 `PaymentRepository`

Tanggung jawab:

```txt
payments
payment_status_history
payment_webhook_events
```

Methods:

```ts
createPayment(data)
findPaymentById(workspaceId, paymentId)
findPaymentForUpdate(workspaceId, paymentId)
findPaymentByProviderReference(providerId, providerReference)
updatePaymentProviderReference(paymentId, providerData)
updatePaymentStatus(paymentId, status)
appendPaymentStatusHistory(data)
createWebhookEvent(data)
markWebhookProcessed(webhookEventId)
findWebhookDuplicate(providerId, providerEventId, payloadHash)
```

Important:

```txt
PaymentRepository tidak boleh memverifikasi signature webhook.
Itu tugas SecurityService / PaymentAdapter.
```

---

## 10.11 `PaymentProviderSettingsRepository`

Tanggung jawab:

```txt
active payment provider
BayarGG active config
sandbox/production mode
provider capability
```

Methods:

```ts
findActiveProviderSettings(workspaceId, mode)
listProviderSettings(workspaceId)
findProviderByCode(code)
updateProviderSettings(workspaceId, providerId, data)
disableOtherProviders(workspaceId, mode)
```

Rule:

```txt
Hanya satu active provider per workspace + mode.
```

Untuk sekarang:

```txt
BayarGG adalah active provider.
```

---

## 10.12 `AdminUserRepository`

Tanggung jawab:

```txt
admin users
roles
permissions
outlet scope
```

Methods:

```ts
findAdminById(workspaceId, adminUserId)
listPermissions(workspaceId, adminUserId)
listOutletScopes(workspaceId, adminUserId)
hasPermission(workspaceId, adminUserId, permission)
hasOutletAccess(workspaceId, adminUserId, outletId)
```

Catatan:

```txt
Authorization decision bisa dilakukan oleh SecurityService,
tetapi data permission berasal dari AdminUserRepository.
```

---

## 10.13 `AuditLogRepository`

Tanggung jawab:

```txt
append-only audit logs
```

Methods:

```ts
appendAuditLog(data)
listAuditLogs(filter)
findAuditLogsByEntity(workspaceId, entityType, entityId)
```

Rule:

```txt
AuditLogRepository tidak boleh punya update/delete operation normal.
```

---

## 10.14 `AnalyticsRepository`

Tanggung jawab:

```txt
QR scan
checkout conversion
payment conversion
order completion
```

Methods:

```ts
trackQrScan(data)
trackCheckoutStarted(data)
trackCheckoutCompleted(data)
trackPaymentSucceeded(data)
trackOrderCompleted(data)
getQrPerformanceReport(filter)
```

Catatan:

```txt
Analytics tidak boleh mengubah business state.
```

---

# 11. Query Specification Pattern

Untuk query kompleks admin dashboard, gunakan specification/filter object.

Contoh:

```ts
type OrderListFilter = {
  workspaceId: string;
  outletIds?: string[];
  channel?: "online_store" | "qr_store";
  paymentStatus?: PaymentStatus[];
  fulfillmentStatus?: FulfillmentStatus[];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  page: number;
  limit: number;
};
```

Lalu:

```ts
OrderRepository.listOrders(filter)
```

Hindari membuat terlalu banyak method seperti:

```ts
listPaidOrdersByOutlet()
listPendingOrdersByOutlet()
listQrOrdersByDate()
listReadyOrdersByOutlet()
```

Karena akan meledak.

---

# 12. Read Models

Untuk dashboard admin, terkadang query join bisa berat.

Boleh siapkan read model/view seperti:

```txt
admin_order_list_view
order_detail_view
qr_performance_view
product_availability_view
```

Tapi untuk alpha, bisa mulai dari repository query biasa dulu.

Read model berguna nanti saat:

```txt
order volume tinggi
dashboard lambat
analytics makin kompleks
multi-outlet besar
```

---

# 13. Soft Delete Rules in Repository

Repository harus menghormati `deleted_at`.

Default query:

```sql
where deleted_at is null
```

Untuk data operasional seperti order/payment/audit:

```txt
jangan hard delete.
```

Untuk master data:

```txt
soft delete boleh.
```

Contoh:

```ts
ProductRepository.softDeleteProduct(workspaceId, productId)
```

Bukan:

```ts
deleteProductPermanently()
```

---

# 14. Repository Error Types

Repository error harus dibedakan dari business error.

Contoh:

```txt
DatabaseConnectionError
UniqueConstraintViolation
ForeignKeyViolation
RecordNotFound
TransactionConflict
DeadlockDetected
```

Lalu service menerjemahkan menjadi business error jika perlu.

Misalnya:

```txt
UniqueConstraintViolation on idempotency key
→ DuplicateCheckout
```

---

# 15. Repository Testing Strategy

Setiap repository wajib punya test untuk:

```txt
workspace scoping
soft delete filtering
unique constraint behavior
transaction behavior
lock behavior
pagination
filter correctness
```

Critical repository yang wajib integration test:

```txt
IdempotencyRepository
OrderRepository
PaymentRepository
QrSessionRepository
PaymentProviderSettingsRepository
AuditLogRepository
```

---

# 16. Anti-Patterns

Hindari:

```txt
Repository memanggil service lain.

Repository memverifikasi payment webhook.

Repository menghitung business status transition.

Repository mengirim notification.

Repository membaca data lintas workspace tanpa filter.

Service langsung menulis raw SQL tanpa repository.

Controller langsung akses repository.

Repository mengembalikan data internal terlalu mentah ke response public.
```

---

# 17. Implementation Checklist

```txt
☐ Semua repository scoped by workspace

☐ Repository tidak mengandung business logic

☐ Repository mendukung transaction context

☐ Repository mendukung row locking untuk critical flow

☐ Query admin memakai filter/specification object

☐ Payment provider config tidak hardcoded BayarGG

☐ BayarGG hanya aktif lewat provider settings

☐ Order/payment/audit tidak hard delete

☐ Audit log append-only

☐ Repository errors distandarkan

☐ Integration test untuk repository kritikal
```

---

# Final Recommendation

Untuk implementasi awal, aku sarankan buat repository dalam struktur seperti ini:

```txt
src/modules/
  storefront/
    storefront.repository.ts

  qr/
    qr.repository.ts
    qr-session.repository.ts

  catalog/
    catalog.repository.ts

  checkout/
    checkout.repository.ts
    idempotency.repository.ts

  order/
    order.repository.ts

  payment/
    payment.repository.ts
    payment-provider-settings.repository.ts

  admin/
    admin-user.repository.ts

  audit/
    audit-log.repository.ts

  analytics/
    analytics.repository.ts
```

Dengan ini, **Phase 3.6.3 External Provider Architecture** nanti akan jauh lebih rapi karena payment provider tidak langsung menyentuh database sembarangan. Provider adapter cukup berkomunikasi melalui `PaymentProviderService`, lalu `PaymentProviderService` yang memakai repository sesuai kontrak.