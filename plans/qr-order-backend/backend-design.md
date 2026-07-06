Sip, dari frontend implementation + UI flow yang kamu kirim, backend-nya sebaiknya **jangan dibuat kompleks dulu**, tapi tetap punya pondasi yang benar untuk scalable ke multi-brand, multi-outlet, dan multi-channel. 🚀

Intinya: **QR Online Store ini bukan sistem baru**, tapi **channel baru** di backend kamu.

```text
Existing system:
Telegram / WhatsApp / Admin Dashboard

Tambahan:
WEB_STORE / QR_STORE
```

---

# 1. Prinsip backend yang paling penting

Untuk MVP, backend cukup menjawab 5 kebutuhan utama:

```text
1. Tampilkan storefront public
2. Kelola guest cart
3. Checkout tanpa login
4. Buat payment session
5. Tampilkan status order + invoice public
```

Tapi business logic tetap lewat service existing:

```text
Product Service
→ Cart Service
→ Checkout Service
→ Order Service
→ Payment Service
→ Invoice Service
```

Jangan bikin logic paralel khusus online store seperti:

```text
publicStoreOrderService yang bikin order sendiri dari frontend
```

Karena itu nanti bikin sistemmu susah maintain.

---

# 2. Arsitektur backend sederhana

```text
Customer Scan QR
    ↓
Public Storefront API
    ↓
Guest Session
    ↓
Outlet-scoped Cart
    ↓
Checkout
    ↓
Payment Session
    ↓
Payment Gateway Webhook
    ↓
Order Paid
    ↓
Kitchen Board / Orders Page
    ↓
Public Order Status + Invoice
```

Secara backend module:

```text
server/src/modules/public-store/
├── public-store.routes.ts
├── public-store.controller.ts
├── public-store.service.ts
├── guest-session.service.ts
├── public-store.mapper.ts
├── public-store.validators.ts
└── public-store.errors.ts
```

Tapi module ini **hanya façade / public API layer**.

Dia tetap memanggil:

```text
catalogService
cartService
checkoutService
orderService
paymentService
invoiceService
```

---

# 3. Channel identity

Setiap order dari online store harus punya metadata:

```text
channel = WEB_STORE
source = QR
fulfillment_method = PICKUP
customer_type = GUEST
```

Contoh order metadata:

```json
{
  "workspace_id": "workspace_xxx",
  "outlet_id": "outlet_xxx",
  "channel": "WEB_STORE",
  "source": "QR",
  "storefront_id": "storefront_xxx",
  "guest_session_id": "guest_xxx",
  "fulfillment_method": "PICKUP"
}
```

Ini penting supaya nanti di dashboard bisa filter:

```text
Orders by Channel:
- Telegram
- WhatsApp
- Web Store
```

---

# 4. Database minimal MVP

## A. Reuse table existing

Pakai yang sudah kamu punya:

```text
workspaces
outlets
products
product_categories
product_variants
product_modifiers
product_outlet_availability
carts
cart_items
checkouts
orders
order_items
payments
payment_sessions
invoices / receipts
contacts / customers
```

## B. Tambahan table minimal

Untuk MVP, cukup tambah 4 table ini dulu.

---

## 4.1 `storefronts`

Untuk public online store per outlet/brand.

```sql
create table storefronts (
  id uuid primary key default gen_random_uuid(),

  workspace_id uuid not null references workspaces(id),
  outlet_id uuid not null references outlets(id),

  public_id text not null unique,
  slug text not null unique,

  name text not null,
  status text not null default 'ACTIVE',

  channel text not null default 'WEB_STORE',
  default_source text not null default 'QR',
  default_fulfillment_method text not null default 'PICKUP',

  theme_config jsonb not null default '{}'::jsonb,
  banner_config jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz null
);
```

Contoh:

```text
slug = selkop-01-jend-sutoyo
outlet_id = SELKOP-01 JEND SUTOYO
status = ACTIVE
```

---

## 4.2 `storefront_qr_codes`

Untuk QR per outlet/campaign.

```sql
create table storefront_qr_codes (
  id uuid primary key default gen_random_uuid(),

  workspace_id uuid not null references workspaces(id),
  storefront_id uuid not null references storefronts(id),
  outlet_id uuid not null references outlets(id),

  public_id text not null unique,
  qr_type text not null,
  source_label text null,
  target_url text not null,

  status text not null default 'ACTIVE',

  scan_count integer not null default 0,
  last_scanned_at timestamptz null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

`qr_type`:

```text
OUTLET_STORE
COUNTER
TABLE
POSTER
CAMPAIGN
```

Untuk MVP cukup:

```text
OUTLET_STORE
```

---

## 4.3 `guest_sessions`

Customer tidak login, tapi tetap perlu session.

```sql
create table guest_sessions (
  id uuid primary key default gen_random_uuid(),

  workspace_id uuid not null references workspaces(id),
  storefront_id uuid not null references storefronts(id),
  outlet_id uuid not null references outlets(id),

  public_token_hash text not null unique,

  status text not null default 'ACTIVE',

  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz not null,

  user_agent_hash text null,
  ip_hash text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Token guest dikirim ke frontend sebagai opaque token:

```text
gs_xxxxxxxxx
```

Yang disimpan di DB hanya hash-nya.

---

## 4.4 `public_order_links`

Untuk halaman status/invoice tanpa login.

```sql
create table public_order_links (
  id uuid primary key default gen_random_uuid(),

  workspace_id uuid not null references workspaces(id),
  order_id uuid not null references orders(id),

  public_token_hash text not null unique,

  status text not null default 'ACTIVE',
  expires_at timestamptz not null,
  revoked_at timestamptz null,

  view_count integer not null default 0,
  last_viewed_at timestamptz null,

  created_at timestamptz not null default now()
);
```

URL:

```text
/store/order/pub_xxxxx
```

Jangan pakai `order_id` langsung di URL.

---

# 5. Data customer MVP

Untuk pickup-only, data wajib cukup:

```text
name
phone
```

Opsional:

```text
order_note
email nanti
marketing_consent nanti
```

Di backend, saat checkout, buat atau link contact:

```text
phone normalized
→ cari contact existing di workspace
→ kalau ada, link
→ kalau tidak ada, create guest contact
```

Customer snapshot di order tetap disimpan:

```json
{
  "name": "Hafiz Rahman",
  "phone_masked": "0812 **** 7890",
  "phone_normalized": "+6281234567890"
}
```

Untuk public status page, tampilkan **masked phone** saja.

---

# 6. API endpoint MVP

## 6.1 Get storefront

```http
GET /api/public/storefronts/:slug
```

Return:

```json
{
  "storefront": {
    "id": "storefront_xxx",
    "slug": "selkop-01-jend-sutoyo",
    "name": "Selalu Kopi",
    "channel": "WEB_STORE",
    "source": "QR",
    "fulfillmentMethod": "PICKUP",
    "theme": {
      "primaryColor": "#E00000"
    },
    "outlet": {
      "id": "outlet_xxx",
      "name": "SELKOP-01 JEND SUTOYO",
      "address": "Jl. Jend. Sutoyo No.1",
      "isLockedFromQr": true
    },
    "banner": {
      "title": "Aren Creamy Combo",
      "subtitle": "Mulai dari Rp25.000",
      "imageUrl": "..."
    }
  },
  "categories": [],
  "products": []
}
```

Backend wajib filter:

```text
storefront active
outlet active
products active
products available at outlet
customer-visible only
```

---

## 6.2 Create guest session

```http
POST /api/public/storefronts/:slug/sessions
```

Return:

```json
{
  "guestSessionToken": "gs_xxxxx",
  "expiresAt": "2026-07-03T12:00:00Z"
}
```

Boleh juga dibuat otomatis saat first cart action.

---

## 6.3 Get cart

```http
GET /api/public/storefronts/:slug/cart
Header: X-Guest-Session: gs_xxxxx
```

Return canonical cart dari backend.

---

## 6.4 Add cart item

```http
POST /api/public/storefronts/:slug/cart/items
Header: X-Guest-Session: gs_xxxxx
```

Request:

```json
{
  "productId": "prod_xxx",
  "variantId": "var_xxx",
  "modifierOptionIds": ["mod_xxx"],
  "quantity": 1,
  "note": "less sugar"
}
```

Frontend **tidak boleh kirim price**.

Backend memanggil:

```text
cartService.addItem()
```

Backend validasi:

```text
same workspace
same outlet
product active
product available at outlet
variant valid
modifier valid
quantity valid
price server-side
```

---

## 6.5 Update cart item

```http
PATCH /api/public/storefronts/:slug/cart/items/:itemId
Header: X-Guest-Session: gs_xxxxx
```

Request:

```json
{
  "quantity": 2
}
```

---

## 6.6 Remove cart item

```http
DELETE /api/public/storefronts/:slug/cart/items/:itemId
Header: X-Guest-Session: gs_xxxxx
```

---

## 6.7 Checkout

```http
POST /api/public/storefronts/:slug/checkout
Header: X-Guest-Session: gs_xxxxx
Idempotency-Key: checkout:<guestSessionId>:<cartVersion>
```

Request:

```json
{
  "customer": {
    "name": "Hafiz Rahman",
    "phone": "081234567890"
  },
  "orderNote": "Kurangi gula untuk minuman ya"
}
```

Backend flow:

```text
validate guest session
→ load cart
→ validate cart fresh
→ validate customer
→ create/link contact
→ create checkout
→ create order pending payment
→ create payment session
→ create public order link
→ return paymentUrl
```

Return:

```json
{
  "checkoutId": "chk_xxx",
  "orderNumber": "ST-250621-1023",
  "payment": {
    "status": "PENDING",
    "paymentUrl": "https://payment-gateway..."
  },
  "publicOrderToken": "pub_xxxxx",
  "publicOrderUrl": "/store/order/pub_xxxxx"
}
```

---

## 6.8 Get public order status

```http
GET /api/public/orders/:publicOrderToken
```

Return:

```json
{
  "order": {
    "orderNumber": "ST-250621-1023",
    "queueNumber": "#12",
    "status": "PREPARING",
    "statusLabel": "Sedang Dibuat",
    "customer": {
      "name": "Hafiz Rahman",
      "phoneMasked": "0812 **** 7890"
    },
    "outlet": {
      "name": "SELKOP-01 JEND SUTOYO",
      "address": "Jl. Jend. Sutoyo No.1"
    },
    "items": [],
    "totals": {
      "subtotalMinor": 6100000,
      "serviceFeeMinor": 200000,
      "totalMinor": 6300000
    },
    "invoice": {
      "downloadUrl": "/api/public/invoices/inv_xxx/download",
      "shareUrl": "https://..."
    }
  }
}
```

---

## 6.9 Download invoice

```http
GET /api/public/invoices/:invoiceToken/download
```

Atau MVP lebih simple:

```http
GET /api/public/orders/:publicOrderToken/invoice.pdf
```

---

# 7. Service design

## 7.1 `PublicStoreService`

Tanggung jawab:

```text
resolve storefront by slug
validate storefront active
map product catalog to public response
create guest session
load guest cart
```

Jangan taruh logic harga/order/payment di sini.

---

## 7.2 `GuestSessionService`

Tanggung jawab:

```text
create opaque guest token
hash token
validate token
expire session
touch last_seen_at
bind session to storefront/outlet
```

Rules:

```text
guest session tidak boleh pindah workspace
guest session tidak boleh pindah outlet tanpa cart reset
guest session punya TTL
```

TTL MVP:

```text
guest session: 24 hours
cart: 2 hours / same business day
public order link: 7–30 days
```

---

## 7.3 `PublicCheckoutService`

Tanggung jawab:

```text
validate guest session
validate cart
validate customer data
create/link contact
call checkoutService
call paymentService
create public order link
return payment URL
```

Service ini façade saja.

Order tetap dibuat oleh canonical service.

---

## 7.4 `PublicOrderStatusService`

Tanggung jawab:

```text
resolve public token
load order safely
map backend status to customer status
mask phone
return invoice action
increment view count
```

Public response tidak boleh include:

```text
internal notes
full customer phone
payment provider raw payload
inventory data
COGS
admin audit
workspace internal IDs
```

---

# 8. State machine order

Backend status tetap canonical:

```text
CART
→ CHECKOUT_PENDING
→ PAYMENT_PENDING
→ PAID
→ AWAITING_OUTLET_APPROVAL
→ PREPARING
→ READY_FOR_PICKUP
→ COMPLETED
```

Customer UI mapping:

```text
PAYMENT_PENDING → Menunggu Pembayaran
PAID → Dibayar
AWAITING_OUTLET_APPROVAL → Diproses Outlet
PREPARING → Sedang Dibuat
READY_FOR_PICKUP → Siap Diambil
COMPLETED → Selesai
CANCELLED → Dibatalkan
PAYMENT_EXPIRED → Pembayaran Kedaluwarsa
```

Kitchen Board mapping:

```text
PAID / AWAITING_OUTLET_APPROVAL
→ Incoming

PREPARING
→ Preparing

READY_FOR_PICKUP
→ Ready

COMPLETED
→ Completed
```

---

# 9. Payment flow

Untuk MVP:

```text
checkout
→ create payment session
→ redirect customer
→ payment webhook
→ verify payment
→ mark payment PAID
→ update order PAID
→ order appears in Kitchen Board Incoming
```

Prinsip penting:

```text
Frontend tidak pernah set PAID.
```

PAID hanya dari:

```text
verified provider webhook
payment reconciliation
```

Payment session failure:

```text
show retry payment
do not create duplicate order
do not silently mark manual payment
```

---

# 10. Idempotency

Ini wajib supaya customer tidak bikin order/payment dobel.

## Add cart item

Idempotency optional tapi bagus:

```text
cart:add:<sessionId>:<productId>:<modifierHash>:<noteHash>
```

## Checkout

Wajib:

```text
checkout:<guestSessionId>:<cartId>:<cartVersion>
```

Kalau user klik bayar dua kali:

```text
same idempotency key
→ return existing checkout/payment session
```

## Payment webhook

Webhook juga idempotent:

```text
provider_event_id unique
payment_session_id unique event effect
```

## Public invoice

Public order link dibuat sekali per order:

```text
order_id unique where status active
```

---

# 11. Security public API

Karena tanpa login, public API harus ketat.

Wajib:

```text
rate limit by IP/session/storefront
body size limit
schema validation
opaque tokens
token hash only in DB
no sequential public ID
no frontend price authority
no frontend payment authority
no internal fields in response
CORS allowlist
bot protection basic
```

Public boleh:

```text
view active storefront
view active products
create guest session
manage own guest cart
checkout own guest cart
view own public order by token
download invoice by token
```

Public tidak boleh:

```text
list all orders
list all customers
view full customer phone
change order status
change payment status
view admin notes
view inventory/COGS
access other carts
```

---

# 12. Monitorability

Agar MVP tetap monitorable, tambahkan structured logs dan metrics dari awal.

## Logs

Setiap request public store log:

```json
{
  "event": "public_store.checkout.created",
  "workspaceId": "...",
  "storefrontId": "...",
  "outletId": "...",
  "guestSessionId": "...",
  "cartId": "...",
  "checkoutId": "...",
  "orderId": "...",
  "correlationId": "...",
  "durationMs": 123
}
```

Jangan log:

```text
full phone
payment raw payload
token plaintext
customer note full jika sensitif
```

## Metrics MVP

```text
storefront_view_total
qr_scan_total
guest_session_created_total
cart_item_added_total
checkout_started_total
payment_session_created_total
payment_success_total
payment_failed_total
public_order_view_total
invoice_download_total
```

Dengan label:

```text
workspace_id
storefront_id
outlet_id
channel
source
status
```

Hati-hati label high-cardinality seperti order_id/customer_id.

---

# 13. Admin impact

Backend harus membuat order yang otomatis terlihat di existing admin:

## Orders Page

```text
channel = WEB_STORE
source = QR
outlet = selected outlet
payment status
order status
```

## Kitchen Board

Order masuk ke:

```text
Incoming
```

setelah payment verified / sesuai policy kamu.

## Payments Page

Payment record:

```text
provider
payment session
status
amount
order number
channel = WEB_STORE
```

## Customers / Contacts

Contact dibuat/link dari phone.

## Analytics

MVP event cukup:

```text
view
add cart
checkout
payment success
```

---

# 14. Error handling

Gunakan stable error code.

```text
STOREFRONT_NOT_FOUND
STOREFRONT_INACTIVE
OUTLET_NOT_ORDERABLE
GUEST_SESSION_INVALID
GUEST_SESSION_EXPIRED
CART_EMPTY
CART_STALE
PRODUCT_NOT_AVAILABLE
PRODUCT_NOT_AVAILABLE_AT_OUTLET
INVALID_MODIFIER
INVALID_QUANTITY
CHECKOUT_ALREADY_EXISTS
PAYMENT_SESSION_CREATE_FAILED
PUBLIC_ORDER_LINK_INVALID
PUBLIC_ORDER_LINK_EXPIRED
INVOICE_NOT_READY
```

Customer-facing message:

```text
Produk ini sedang tidak tersedia di outlet ini.
```

Internal log:

```text
PRODUCT_NOT_AVAILABLE_AT_OUTLET
```

---

# 15. MVP implementation phase

## Phase 1 — Public read

```text
storefronts table
GET storefront
product list outlet-aware
QR scan tracking
```

## Phase 2 — Guest cart

```text
guest_sessions
cart create
add item
update quantity
remove item
get cart
```

## Phase 3 — Checkout

```text
customer form validation
contact create/link
checkout create
order create pending payment
payment session create
public order link
```

## Phase 4 — Payment + status

```text
payment webhook integration
order status mapping
public order status endpoint
invoice download endpoint
```

## Phase 5 — Monitoring hardening

```text
structured logs
metrics
rate limits
error catalog
dashboard filters
```

---

# 16. Rekomendasi paling simple untuk MVP

Kalau mau paling cepat tapi tetap benar:

```text
Tambahkan 4 table:
1. storefronts
2. storefront_qr_codes
3. guest_sessions
4. public_order_links
```

Lalu buat 6 endpoint:

```text
GET    /api/public/storefronts/:slug
POST   /api/public/storefronts/:slug/sessions
GET    /api/public/storefronts/:slug/cart
POST   /api/public/storefronts/:slug/cart/items
POST   /api/public/storefronts/:slug/checkout
GET    /api/public/orders/:publicOrderToken
```

Invoice bisa disusulkan:

```text
GET /api/public/orders/:publicOrderToken/invoice.pdf
```

Ini sudah cukup untuk MVP dari frontend yang kamu punya.

---

# 17. Kesimpulan desain backend

Desain backend yang aku sarankan:

```text
Public Store API
= thin public façade

Business logic
= existing canonical services

Data baru
= storefront, QR, guest session, public order link

Order flow
= same as chatbot marketplace

Monitoring
= public-store events + payment + order tracking
```

Jadi backend-nya tetap simple, tapi pondasinya benar:

```text
scalable karena channel-based
maintainable karena reuse service existing
monitorable karena ada event/log/metrics
secure karena public token dan no frontend authority
```

Untuk MVP, jangan dulu masuk ke loyalty, delivery, scheduled pickup, voucher kompleks, table service, atau login customer. Fokus dulu sampai customer bisa **scan QR → pilih menu → bayar → lihat invoice/status → pickup**. 🍵✨
