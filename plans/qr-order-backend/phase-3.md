Siap, Rido. Aku catat keputusan terbaru ini sebagai acuan desain berikutnya ✅

> **Payment provider tidak hardcoded satu provider.**
> Sistem harus mendukung **multiple payment providers** yang dipilih dari **Settings**, dan untuk kondisi sekarang provider aktif adalah **BayarGG**.

Jadi mulai Phase 3, desain database tidak boleh pakai asumsi “Xendit only”. Kita desain sebagai:

```txt
Payment Provider Configurable
Current active provider: BayarGG
Future-ready for: provider lain
```

---

# Phase 3 — Database Schema Design Plan

## Online Store + QR Store + Payment Provider Settings

Tujuan Phase 3 adalah membuat rancangan database yang kuat untuk:

```txt
Online ordering
QR ordering
Multi-outlet
Product menu
Cart validation
Checkout
Payment provider configurable
Order lifecycle
Admin order management
Security
Audit log
Alpha testing
```

---

## 0. Prinsip Utama Database

Sebelum masuk tabel, kita pegang prinsip ini dulu:

| Prinsip                        | Keputusan                                 |
| ------------------------------ | ----------------------------------------- |
| Payment provider               | Dipilih dari Settings                     |
| Active provider sekarang       | **BayarGG**                               |
| Payment status source of truth | Backend + provider webhook/callback       |
| Frontend total harga           | Preview only                              |
| Backend total harga            | Final authority                           |
| QR outlet                      | Harus bisa locked by QR session           |
| Order delete                   | Tidak ada untuk operasional, pakai cancel |
| Status history                 | Wajib                                     |
| Audit log                      | Wajib                                     |
| Public order access            | Pakai `public_order_token`                |
| Checkout duplicate protection  | Pakai idempotency key                     |

---

# Phase 3 Plan

## Phase 3.1 — Define Core Domains

Kita bagi database menjadi beberapa domain:

```txt
1. Business / Tenant
2. Outlet & QR
3. Catalog / Menu
4. Cart & Checkout
5. Order
6. Payment
7. Admin / Roles / Permissions
8. Audit & Security
9. Settings
```

Untuk alpha, kita tidak perlu semua fitur enterprise dulu, tapi struktur harus siap berkembang.

---

# 1. Business / Tenant Domain

Ini untuk pondasi kalau nanti SELKOP berkembang multi-brand atau multi-account.

## Tabel kandidat

```txt
businesses
brands
workspaces
```

Untuk alpha, bisa disederhanakan:

```txt
workspaces
```

Contoh fungsi:

| Table               | Fungsi                                                           |
| ------------------- | ---------------------------------------------------------------- |
| `workspaces`        | Root account bisnis, misalnya Foodinesia / SELKOP                |
| `brands`            | Opsional kalau nanti satu workspace punya Selkop, SelaluTeh, dll |
| `business_settings` | Setting umum bisnis                                              |

Untuk alpha SELKOP, minimal:

```txt
workspaces
workspace_settings
```

---

# 2. Outlet & QR Domain

Ini penting banget karena fokus kamu adalah **online store + QR store**.

## Tabel kandidat

```txt
outlets
qr_codes
qr_sessions
qr_locations
```

## Fungsi

| Table          | Fungsi                                       |
| -------------- | -------------------------------------------- |
| `outlets`      | Menyimpan outlet: Samarinda, Tenggarong, dll |
| `qr_codes`     | QR yang ditempel di outlet                   |
| `qr_sessions`  | Session customer setelah scan QR             |
| `qr_locations` | Meja, counter, pickup area, atau titik QR    |

## Kenapa perlu `qr_locations`?

Karena QR store bisa berbeda:

```txt
Meja 01
Meja 02
Pickup Counter
Takeaway Counter
Outdoor Area
```

Jadi QR tidak hanya outlet, tapi bisa juga lokasi.

## Rule penting

```txt
QR code harus bind ke outlet.
QR code bisa bind ke qr_location.
QR session harus punya expiry.
QR locked outlet tidak boleh diganti customer.
```

---

# 3. Catalog / Menu Domain

Untuk menu online/QR store.

## Tabel kandidat

```txt
product_categories
products
product_variants
modifier_groups
modifier_options
product_modifier_groups
product_availability
product_images
```

## Fungsi

| Table                     | Fungsi                                       |
| ------------------------- | -------------------------------------------- |
| `product_categories`      | Coffee, Non Coffee, Signature, Snack         |
| `products`                | Salty Caramel, Aren Creamy, Caffe Latte      |
| `product_variants`        | Size, hot/ice, cup size                      |
| `modifier_groups`         | Ice level, sweetness, toppings               |
| `modifier_options`        | Less ice, normal ice, less sugar, extra shot |
| `product_modifier_groups` | Relasi produk ke modifier                    |
| `product_availability`    | Produk tersedia per outlet                   |
| `product_images`          | Gambar produk                                |

## Kenapa `product_availability` wajib?

Karena satu produk bisa tersedia di outlet A tapi habis di outlet B.

```txt
Salty Caramel tersedia di Samarinda
Salty Caramel sold out di Tenggarong
```

---

# 4. Cart & Checkout Domain

Untuk alpha, cart bisa tetap local di frontend, tapi backend tetap butuh menyimpan hasil checkout dan validasi.

## Tabel kandidat

```txt
checkout_sessions
checkout_items
idempotency_keys
```

Opsional kalau mau server cart:

```txt
carts
cart_items
```

## Rekomendasi alpha

Untuk alpha:

```txt
Frontend local cart
Backend checkout_sessions
Backend idempotency_keys
```

Jadi backend tetap punya catatan proses checkout.

## Fungsi

| Table               | Fungsi                                    |
| ------------------- | ----------------------------------------- |
| `checkout_sessions` | Snapshot request checkout sebelum payment |
| `checkout_items`    | Item yang divalidasi backend              |
| `idempotency_keys`  | Mencegah double checkout                  |

---

# 5. Order Domain

Ini inti sistem.

## Tabel kandidat

```txt
orders
order_items
order_item_modifiers
order_status_history
```

## Field penting di `orders`

```txt
channel
outlet_id
qr_session_id
qr_location_id
customer_name
customer_phone
fulfillment_type
payment_status
fulfillment_status
public_order_status
subtotal_amount
discount_amount
service_fee_amount
tax_amount
total_amount
public_order_token
```

## Status wajib dipisah

```txt
payment_status
fulfillment_status
public_order_status
```

Jangan hanya pakai satu field `status`.

---

# 6. Payment Domain

Karena provider dipilih dari Settings, payment domain harus provider-agnostic.

## Tabel kandidat

```txt
payment_providers
payment_provider_settings
payments
payment_events
payment_status_history
payment_webhook_events
```

---

## 6.1 `payment_providers`

Menyimpan daftar provider yang didukung.

Contoh data:

```txt
bayargg
xendit
midtrans
manual_transfer
```

Untuk sekarang:

```txt
active provider: bayargg
```

Field kandidat:

```txt
id
code
name
is_enabled
supports_qris
supports_va
supports_ewallet
supports_card
created_at
updated_at
```

Contoh:

```txt
code: bayargg
name: BayarGG
is_enabled: true
```

---

## 6.2 `payment_provider_settings`

Ini setting provider per workspace / brand.

Field kandidat:

```txt
id
workspace_id
provider_id
is_active
mode
public_key
secret_key_ref
webhook_secret_ref
callback_url
webhook_url
config_json
created_at
updated_at
```

Catatan penting:

```txt
Jangan simpan secret mentah kalau bisa.
Simpan sebagai encrypted value atau secret reference.
```

Contoh:

```txt
provider: bayargg
mode: sandbox / production
is_active: true
```

---

## 6.3 `payments`

Menyimpan transaksi payment per order.

Field kandidat:

```txt
id
order_id
provider_id
provider_payment_id
provider_reference
status
amount
currency
payment_url
expires_at
paid_at
failed_at
expired_at
raw_status
metadata_json
created_at
updated_at
```

Status:

```txt
pending
processing
paid
failed
expired
refunded
cancelled
manual_review
```

---

## 6.4 `payment_events`

Untuk tracking event dari provider.

```txt
payment_id
provider_id
event_type
event_status
provider_event_id
payload_hash
received_at
processed_at
processing_status
```

---

## 6.5 `payment_webhook_events`

Untuk menyimpan raw webhook secara aman.

```txt
id
provider_id
provider_event_id
signature_valid
payload_hash
raw_payload_ref
processing_status
error_message
received_at
processed_at
```

`raw_payload_ref` bisa menunjuk ke storage/log, bukan harus full JSON di database.

---

# 7. Admin / Roles / Permissions Domain

Untuk staff admin yang mengelola order QR/online.

## Tabel kandidat

```txt
admin_users
roles
permissions
role_permissions
admin_user_roles
admin_outlet_scopes
```

## Kenapa penting?

Karena staff tidak boleh sembarang:

```txt
cancel order
override payment
change fulfillment status
access semua outlet
delete data
```

## Contoh permissions

```txt
orders.read
orders.accept
orders.prepare
orders.ready
orders.complete
orders.cancel
payments.read
payments.manual_review
qr.manage
products.manage
settings.payment.manage
```

---

# 8. Audit & Security Domain

Ini wajib untuk sistem order/payment.

## Tabel kandidat

```txt
audit_logs
security_events
rate_limit_events
```

## `audit_logs`

Mencatat aksi penting:

```txt
Admin accept order
Admin mark preparing
Admin cancel order
Payment webhook update
Provider setting changed
QR disabled
Product availability changed
```

Field kandidat:

```txt
id
actor_type
actor_id
action
entity_type
entity_id
before_json
after_json
reason
ip_address
user_agent
created_at
```

---

# 9. Settings Domain

Karena payment provider dipilih dari Settings, kita butuh settings yang jelas.

## Tabel kandidat

```txt
workspace_settings
payment_provider_settings
storefront_settings
qr_ordering_settings
notification_settings
```

## Payment settings minimal

```txt
active_payment_provider_id
payment_mode
payment_expiry_minutes
auto_accept_paid_orders
allow_manual_payment_override
```

Rekomendasi untuk alpha:

```txt
auto_accept_paid_orders: false
allow_manual_payment_override: false
payment_expiry_minutes: 15
active_payment_provider: bayargg
```

---

# Phase 3.2 — ERD Draft Scope

ERD untuk alpha harus mencakup minimal:

```txt
workspaces
outlets
qr_locations
qr_codes
qr_sessions

product_categories
products
modifier_groups
modifier_options
product_availability

checkout_sessions
idempotency_keys

orders
order_items
order_item_modifiers
order_status_history

payment_providers
payment_provider_settings
payments
payment_status_history
payment_webhook_events

admin_users
roles
permissions
audit_logs
```

---

# Phase 3.3 — Enum Design

Kita harus kunci enum sebelum bikin tabel.

## `order_channel`

```txt
online_store
qr_store
```

## `fulfillment_type`

```txt
pickup
dine_in
takeaway
```

## `payment_status`

```txt
unpaid
pending
processing
paid
failed
expired
refunded
cancelled
manual_review
```

## `fulfillment_status`

```txt
not_started
awaiting_acceptance
accepted
preparing
ready
completed
cancelled
```

## `public_order_status`

```txt
payment_pending
payment_failed
payment_expired
order_received
accepted
preparing
ready
completed
cancelled
```

## `payment_provider_code`

```txt
bayargg
xendit
midtrans
manual_transfer
```

Untuk sekarang `bayargg` aktif, yang lain boleh disabled.

---

# Phase 3.4 — Constraint & Integrity Plan

Database harus menjaga data supaya tidak gampang rusak.

## Constraints penting

| Constraint                                           | Tujuan                        |
| ---------------------------------------------------- | ----------------------------- |
| `orders.public_order_token` unique                   | Public order link aman        |
| `orders.order_number` unique                         | Nomor order tidak bentrok     |
| `qr_codes.code` unique                               | QR tidak duplicate            |
| `payments.provider_reference` unique per provider    | Webhook tidak double proses   |
| `idempotency_keys.key` unique                        | Cegah duplicate checkout      |
| `order_items.order_id` foreign key                   | Item selalu punya order       |
| `payments.order_id` foreign key                      | Payment selalu punya order    |
| `product_availability(product_id, outlet_id)` unique | Availability jelas per outlet |

---

# Phase 3.5 — Index Plan

Index penting untuk performa admin dan order status.

## Orders

```txt
orders(outlet_id, created_at)
orders(channel, created_at)
orders(payment_status, created_at)
orders(fulfillment_status, created_at)
orders(public_order_token)
orders(order_number)
```

## Payments

```txt
payments(order_id)
payments(provider_id, provider_reference)
payments(status, created_at)
```

## QR

```txt
qr_codes(code)
qr_sessions(session_token)
qr_sessions(qr_code_id, created_at)
```

## Product Availability

```txt
product_availability(outlet_id, product_id)
```

---

# Phase 3.6 — Alpha Data Seed Plan

Untuk alpha testing, siapkan seed data:

## Outlets

```txt
SELKOP Samarinda
SELKOP Tenggarong
```

## QR Locations

```txt
Meja 01
Meja 02
Meja 03
Pickup Counter
Takeaway Counter
```

## QR Codes

```txt
QR untuk setiap meja
QR untuk pickup counter
QR expired test
QR inactive test
QR wrong outlet test
```

## Products

```txt
Salty Caramel
Aren Creamy
Caffe Latte
Butterscotch Sea Salt Latte
Spanish Latte
Nutty Latte
Dub Matcha
```

## Payment Provider

```txt
BayarGG sandbox/dev mode active
Other providers disabled
```

## Test Orders

```txt
payment_pending
paid + awaiting_acceptance
paid + preparing
paid + ready
payment_failed
payment_expired
cancelled
```

---

# Phase 3.7 — Security-by-Design Plan

Database harus mendukung security ini:

| Security Need                 | Table Support                              |
| ----------------------------- | ------------------------------------------ |
| QR tampering protection       | `qr_codes`, `qr_sessions`                  |
| Payment webhook verification  | `payment_webhook_events`, `payments`       |
| Duplicate checkout prevention | `idempotency_keys`                         |
| Admin permission              | `roles`, `permissions`, `admin_user_roles` |
| Outlet access scope           | `admin_outlet_scopes`                      |
| Status transition audit       | `order_status_history`, `audit_logs`       |
| Payment status trace          | `payment_status_history`                   |
| Provider setting change trace | `audit_logs`                               |

---

# Phase 3.8 — Deliverables

Output Phase 3 nanti idealnya berupa beberapa dokumen:

```txt
01-database-overview.md
02-erd-online-qr-store.md
03-schema-tables.md
04-enums-and-status.md
05-indexes-and-constraints.md
06-payment-provider-settings.md
07-security-and-audit-schema.md
08-alpha-seed-data.md
```

Tapi untuk efisiensi, kita bisa gabungkan dulu jadi satu:

```txt
database-schema-plan.md
```

---

# Recommended Phase 3 Execution Order

Aku sarankan urutannya begini:

```txt
Step 1: Kunci enum status
Step 2: Desain outlet + QR tables
Step 3: Desain catalog/menu tables
Step 4: Desain checkout + idempotency
Step 5: Desain orders + order items
Step 6: Desain payment provider configurable
Step 7: Desain admin roles + outlet scopes
Step 8: Desain audit logs + status history
Step 9: Tambahkan indexes + constraints
Step 10: Buat seed data alpha
```

---

# Yang berubah dari rencana sebelumnya

Sebelumnya payment sempat diasumsikan Xendit untuk contoh. Sekarang kita ubah jadi:

```txt
Payment provider configurable from Settings.
Current active provider: BayarGG.
Provider-specific details must live behind payment provider settings and adapter layer.
```

Artinya database dan backend tidak boleh punya field yang terlalu spesifik seperti:

```txt
xendit_invoice_id
xendit_payment_url
```

Lebih baik pakai:

```txt
provider_payment_id
provider_reference
provider_checkout_url
provider_raw_status
provider_metadata_json
```

Jadi nanti kalau provider diganti dari BayarGG ke provider lain, schema tidak perlu dirombak besar.

---

# Final Recommendation

Phase 3 harus menghasilkan database schema yang:

```txt
QR-ready
Online-order-ready
Payment-provider-configurable
BayarGG-ready untuk sekarang
Multi-outlet-ready
Audit-ready
Alpha-testing-ready
```

