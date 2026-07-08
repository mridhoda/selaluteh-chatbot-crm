Siap, kita lanjut ke **Phase 3.1 — Final Enum + Core Table List** ☕🔥
Ini adalah fondasi sebelum kita masuk ke detail schema tabel, ERD, index, constraints, dan security.

Karena fokus kamu sekarang adalah **Online Store + QR Store**, dan audit sebelumnya menunjukkan masalah utama ada di payment, QR session, order lifecycle, serta admin order action, maka enum dan table list harus dirancang untuk menutup risiko itu sejak awal. 

---

# Phase 3.1 — Final Enum + Core Table List

## Goal Phase 3.1

Kita mau mengunci:

```txt
1. Enum status utama
2. Enum channel dan fulfillment
3. Enum payment provider
4. Core table list
5. Relasi besar antar domain
6. Scope alpha vs future
```

Agar nanti saat masuk Phase 3.2, kita tidak bingung lagi saat mendesain tabel detail.

---

# 1. Final Enum Design

## 1.1 `order_channel`

Untuk membedakan sumber order.

```ts
type OrderChannel =
  | "online_store"
  | "qr_store";
```

| Value          | Fungsi                                       |
| -------------- | -------------------------------------------- |
| `online_store` | Customer order dari website/app online biasa |
| `qr_store`     | Customer order dari QR outlet/meja           |

Untuk sekarang cukup 2 ini dulu. Jangan masukkan `pos`, `delivery_app`, atau marketplace lain sebelum scope alpha selesai.

---

## 1.2 `fulfillment_type`

Untuk cara pesanan dipenuhi.

```ts
type FulfillmentType =
  | "pickup"
  | "dine_in"
  | "takeaway";
```

| Value      | Fungsi                                          |
| ---------- | ----------------------------------------------- |
| `pickup`   | Customer pesan online lalu ambil di outlet      |
| `dine_in`  | Customer scan QR di meja dan konsumsi di tempat |
| `takeaway` | Customer scan QR/order lalu bawa pulang         |

Rekomendasi untuk alpha:

```txt
Online store default: pickup / takeaway
QR meja default: dine_in
QR counter default: takeaway
```

---

## 1.3 `payment_status`

Ini khusus status pembayaran. Jangan dicampur dengan status pembuatan pesanan.

```ts
type PaymentStatus =
  | "unpaid"
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "expired"
  | "refunded"
  | "cancelled"
  | "manual_review";
```

| Value           | Kapan dipakai                                     |
| --------------- | ------------------------------------------------- |
| `unpaid`        | Order belum punya payment session                 |
| `pending`       | Payment sudah dibuat, menunggu customer bayar     |
| `processing`    | Provider sedang memproses pembayaran              |
| `paid`          | Pembayaran berhasil dikonfirmasi backend/provider |
| `failed`        | Payment gagal                                     |
| `expired`       | Payment melewati batas waktu                      |
| `refunded`      | Payment sudah/refund diproses                     |
| `cancelled`     | Payment dibatalkan                                |
| `manual_review` | Ada mismatch atau perlu dicek manual              |

Rule penting:

```txt
Frontend tidak boleh membuat payment_status menjadi paid.
Paid hanya boleh berasal dari backend setelah provider callback/webhook tervalidasi.
```

---

## 1.4 `fulfillment_status`

Ini khusus status operasional pesanan di outlet.

```ts
type FulfillmentStatus =
  | "not_started"
  | "awaiting_acceptance"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";
```

| Value                 | Kapan dipakai                             |
| --------------------- | ----------------------------------------- |
| `not_started`         | Order dibuat tapi belum boleh diproses    |
| `awaiting_acceptance` | Payment sudah paid, menunggu staff accept |
| `accepted`            | Staff menerima order                      |
| `preparing`           | Barista sedang membuat pesanan            |
| `ready`               | Pesanan siap diambil/disajikan            |
| `completed`           | Pesanan selesai                           |
| `cancelled`           | Pesanan dibatalkan                        |

Rule utama:

```txt
Order tidak boleh masuk accepted / preparing kalau payment_status belum paid.
```

---

## 1.5 `public_order_status`

Ini status yang tampil ke customer. Dibuat dari gabungan `payment_status` + `fulfillment_status`.

```ts
type PublicOrderStatus =
  | "payment_pending"
  | "payment_processing"
  | "payment_failed"
  | "payment_expired"
  | "order_received"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";
```

| Public Status        | Customer Copy          |
| -------------------- | ---------------------- |
| `payment_pending`    | Menunggu Pembayaran    |
| `payment_processing` | Pembayaran Diproses    |
| `payment_failed`     | Pembayaran Gagal       |
| `payment_expired`    | Pembayaran Kedaluwarsa |
| `order_received`     | Pesanan Diterima       |
| `accepted`           | Pesanan Dikonfirmasi   |
| `preparing`          | Pesanan Sedang Dibuat  |
| `ready`              | Pesanan Siap           |
| `completed`          | Pesanan Selesai        |
| `cancelled`          | Pesanan Dibatalkan     |

Catatan:

```txt
public_order_status bisa disimpan di DB untuk query cepat,
atau dihitung dari payment_status + fulfillment_status.
```

Untuk alpha, aku sarankan **disimpan juga**, tapi tetap di-update hanya oleh backend.

---

## 1.6 `qr_location_type`

Untuk membedakan QR ditempel di mana.

```ts
type QRLocationType =
  | "table"
  | "counter"
  | "pickup_area"
  | "takeaway_area"
  | "general_store";
```

| Value           | Contoh                    |
| --------------- | ------------------------- |
| `table`         | Meja 01, Meja 07          |
| `counter`       | Kasir / counter utama     |
| `pickup_area`   | Area pickup               |
| `takeaway_area` | Area takeaway             |
| `general_store` | QR umum outlet tanpa meja |

---

## 1.7 `qr_status`

Status QR code.

```ts
type QRStatus =
  | "active"
  | "inactive"
  | "expired"
  | "revoked";
```

| Value      | Fungsi                         |
| ---------- | ------------------------------ |
| `active`   | QR bisa dipakai                |
| `inactive` | QR dimatikan sementara         |
| `expired`  | QR sudah kedaluwarsa           |
| `revoked`  | QR dicabut permanen / kompromi |

---

## 1.8 `qr_session_status`

Status session setelah customer scan QR.

```ts
type QRSessionStatus =
  | "active"
  | "expired"
  | "completed"
  | "cancelled";
```

| Value       | Fungsi                                    |
| ----------- | ----------------------------------------- |
| `active`    | Session masih bisa dipakai untuk checkout |
| `expired`   | Session sudah melewati expiry             |
| `completed` | Sudah menghasilkan order sukses           |
| `cancelled` | Session dibatalkan                        |

---

## 1.9 `payment_provider_code`

Karena provider dipilih dari Settings dan saat ini aktifnya BayarGG.

```ts
type PaymentProviderCode =
  | "bayargg"
  | "xendit"
  | "midtrans"
  | "manual_transfer";
```

| Provider          | Status            |
| ----------------- | ----------------- |
| `bayargg`         | Aktif sekarang    |
| `xendit`          | Future / disabled |
| `midtrans`        | Future / disabled |
| `manual_transfer` | Optional fallback |

Penting:

```txt
Database jangan pakai field seperti xendit_invoice_id.
Gunakan provider_payment_id, provider_reference, provider_metadata_json.
```

---

## 1.10 `payment_provider_mode`

```ts
type PaymentProviderMode =
  | "sandbox"
  | "production";
```

Untuk alpha:

```txt
BayarGG mode: sandbox / development dulu
```

---

## 1.11 `payment_method_type`

Provider bisa punya beberapa metode bayar.

```ts
type PaymentMethodType =
  | "qris"
  | "virtual_account"
  | "ewallet"
  | "bank_transfer"
  | "card"
  | "manual";
```

Untuk QR store, biasanya paling cocok:

```txt
qris
ewallet
virtual_account
```

---

## 1.12 `actor_type`

Untuk audit log dan status history.

```ts
type ActorType =
  | "customer"
  | "admin_user"
  | "system"
  | "payment_provider";
```

---

## 1.13 `audit_action`

Tidak harus enum DB kaku dari awal, tapi minimal distandardkan.

```ts
type AuditAction =
  | "order.created"
  | "order.accepted"
  | "order.preparing"
  | "order.ready"
  | "order.completed"
  | "order.cancelled"
  | "payment.created"
  | "payment.paid"
  | "payment.failed"
  | "payment.expired"
  | "payment.refunded"
  | "qr.scanned"
  | "qr.expired"
  | "settings.payment_provider_changed"
  | "product.availability_changed";
```

---

# 2. Core Table List

Sekarang kita kunci table list dulu. Detail field-nya masuk Phase 3.2.

---

# Domain A — Workspace / Business

Untuk alpha, tetap siapkan root business supaya nanti bisa multi-brand/multi-outlet.

## Core Tables

```txt
workspaces
workspace_settings
brands
```

| Table                |   Alpha? | Fungsi                                              |
| -------------------- | -------: | --------------------------------------------------- |
| `workspaces`         |        ✅ | Root bisnis/account                                 |
| `workspace_settings` |        ✅ | Setting global workspace                            |
| `brands`             | Optional | Kalau nanti Foodinesia punya SELKOP, SelaluTeh, dll |

Untuk alpha SELKOP, `brands` boleh ada tapi isinya satu.

---

# Domain B — Outlet & QR

Ini wajib untuk QR store.

## Core Tables

```txt
outlets
qr_locations
qr_codes
qr_sessions
```

| Table          | Alpha? | Fungsi                                    |
| -------------- | -----: | ----------------------------------------- |
| `outlets`      |      ✅ | Outlet fisik seperti Samarinda/Tenggarong |
| `qr_locations` |      ✅ | Meja/counter/pickup area                  |
| `qr_codes`     |      ✅ | QR yang ditempel di outlet/lokasi         |
| `qr_sessions`  |      ✅ | Session hasil scan QR                     |

Relasi besar:

```txt
workspace
  └── outlets
        └── qr_locations
              └── qr_codes
                    └── qr_sessions
```

---

# Domain C — Storefront / Online Store

Untuk online store dan menu public.

## Core Tables

```txt
storefronts
storefront_outlets
storefront_settings
```

| Table                 |   Alpha? | Fungsi                                        |
| --------------------- | -------: | --------------------------------------------- |
| `storefronts`         |        ✅ | Public store seperti `/store/selkop`          |
| `storefront_outlets`  |        ✅ | Outlet mana saja yang tampil di storefront    |
| `storefront_settings` | Optional | Setting seperti ordering enabled, theme, copy |

Kenapa butuh `storefronts`?

Karena nanti satu brand bisa punya beberapa storefront:

```txt
/store/selkop
/store/selaluteh
/store/foodinesia
```

---

# Domain D — Catalog / Menu

Untuk produk, kategori, modifier, availability.

## Core Tables

```txt
product_categories
products
product_images
modifier_groups
modifier_options
product_modifier_groups
product_availability
```

| Table                     |   Alpha? | Fungsi                              |
| ------------------------- | -------: | ----------------------------------- |
| `product_categories`      |        ✅ | Kategori menu                       |
| `products`                |        ✅ | Produk utama                        |
| `product_images`          | Optional | Gambar produk kalau lebih dari satu |
| `modifier_groups`         |        ✅ | Ice level, sweetness, topping       |
| `modifier_options`        |        ✅ | Less ice, normal ice, extra shot    |
| `product_modifier_groups` |        ✅ | Produk mana punya modifier apa      |
| `product_availability`    |        ✅ | Availability produk per outlet      |

Untuk alpha, `product_images` bisa dibuat simple sebagai field `image_url` di `products`, tapi table terpisah lebih scalable.

---

# Domain E — Checkout / Idempotency

Untuk proses checkout aman.

## Core Tables

```txt
checkout_sessions
checkout_items
idempotency_keys
```

| Table               | Alpha? | Fungsi                   |
| ------------------- | -----: | ------------------------ |
| `checkout_sessions` |      ✅ | Snapshot proses checkout |
| `checkout_items`    |      ✅ | Item validasi checkout   |
| `idempotency_keys`  |      ✅ | Cegah double checkout    |

Catatan:

```txt
Cart boleh local di frontend,
tapi checkout final wajib backend snapshot.
```

---

# Domain F — Orders

Inti operasional order.

## Core Tables

```txt
orders
order_items
order_item_modifiers
order_status_history
```

| Table                  | Alpha? | Fungsi                                      |
| ---------------------- | -----: | ------------------------------------------- |
| `orders`               |      ✅ | Header order                                |
| `order_items`          |      ✅ | Item order                                  |
| `order_item_modifiers` |      ✅ | Modifier snapshot per item                  |
| `order_status_history` |      ✅ | History perubahan fulfillment/public status |

Relasi besar:

```txt
orders
  ├── order_items
  │     └── order_item_modifiers
  └── order_status_history
```

---

# Domain G — Payments

Provider configurable, BayarGG aktif sekarang.

## Core Tables

```txt
payment_providers
payment_provider_settings
payments
payment_status_history
payment_webhook_events
```

| Table                       | Alpha? | Fungsi                                     |
| --------------------------- | -----: | ------------------------------------------ |
| `payment_providers`         |      ✅ | Master provider: BayarGG, Xendit, Midtrans |
| `payment_provider_settings` |      ✅ | Provider aktif dari Settings               |
| `payments`                  |      ✅ | Payment record per order                   |
| `payment_status_history`    |      ✅ | Riwayat perubahan status payment           |
| `payment_webhook_events`    |      ✅ | Tracking webhook/callback provider         |

Relasi besar:

```txt
payment_providers
  └── payment_provider_settings

orders
  └── payments
        ├── payment_status_history
        └── payment_webhook_events
```

Penting:

```txt
BayarGG detail masuk metadata/config,
bukan jadi nama kolom khusus yang mengunci schema.
```

---

# Domain H — Admin Users / Permission

Untuk dashboard staff.

## Core Tables

```txt
admin_users
roles
permissions
role_permissions
admin_user_roles
admin_outlet_scopes
```

| Table                 | Alpha? | Fungsi                                                |
| --------------------- | -----: | ----------------------------------------------------- |
| `admin_users`         |      ✅ | Staff/admin                                           |
| `roles`               |      ✅ | Owner, manager, staff                                 |
| `permissions`         |      ✅ | orders.accept, orders.cancel, settings.payment.manage |
| `role_permissions`    |      ✅ | Mapping role ke permission                            |
| `admin_user_roles`    |      ✅ | Mapping user ke role                                  |
| `admin_outlet_scopes` |      ✅ | User boleh akses outlet mana                          |

Untuk alpha bisa simple, tapi struktur permission harus ada agar status action aman.

---

# Domain I — Audit & Security

Untuk traceability dan alpha safety.

## Core Tables

```txt
audit_logs
security_events
```

| Table             |   Alpha? | Fungsi                                    |
| ----------------- | -------: | ----------------------------------------- |
| `audit_logs`      |        ✅ | Semua aksi penting                        |
| `security_events` | Optional | QR invalid, rate limit, suspicious action |

Minimal wajib:

```txt
audit_logs
```

Karena order/payment/admin action harus bisa dilacak.

---

# Domain J — Notification / Optional

Belum wajib untuk alpha, tapi bisa disiapkan.

## Future Tables

```txt
notification_events
message_templates
```

| Table                 |   Alpha? | Fungsi                      |
| --------------------- | -------: | --------------------------- |
| `notification_events` | Optional | WA/email/order update event |
| `message_templates`   | Optional | Template pesan customer     |

Untuk alpha pertama, ini bisa ditunda.

---

# 3. Alpha Minimal Table Set

Kalau mau paling ramping untuk alpha, ini minimalnya:

```txt
workspaces
workspace_settings

outlets
qr_locations
qr_codes
qr_sessions

storefronts
storefront_outlets

product_categories
products
modifier_groups
modifier_options
product_modifier_groups
product_availability

checkout_sessions
checkout_items
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
role_permissions
admin_user_roles
admin_outlet_scopes

audit_logs
```

Jumlah: sekitar **32 tables**.

Kedengarannya banyak, tapi ini wajar karena kamu membangun flow yang menyentuh:

```txt
QR
menu
checkout
payment
order
admin
security
audit
settings
```

---

# 4. Ultra-Minimal Alpha Table Set

Kalau mau lebih cepat, bisa dipangkas:

```txt
workspaces
outlets
qr_locations
qr_codes
qr_sessions

storefronts

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
admin_outlet_scopes

audit_logs
```

Jumlah: sekitar **25 tables**.

Yang dipangkas:

```txt
workspace_settings
storefront_outlets
storefront_settings
product_images
product_modifier_groups
checkout_items
permissions
role_permissions
admin_user_roles
security_events
```

Tapi aku lebih suka versi **Alpha Minimal 32 tables**, karena lebih aman dan tidak terlalu mahal secara kompleksitas.

---

# 5. Core Relationship Map

Gambaran besar relasinya:

```txt
workspaces
  ├── brands
  ├── outlets
  │     ├── qr_locations
  │     │     └── qr_codes
  │     │           └── qr_sessions
  │     └── product_availability
  │
  ├── storefronts
  │     └── storefront_outlets
  │
  ├── product_categories
  │     └── products
  │           ├── product_images
  │           └── product_modifier_groups
  │
  ├── modifier_groups
  │     └── modifier_options
  │
  ├── orders
  │     ├── order_items
  │     │     └── order_item_modifiers
  │     ├── order_status_history
  │     └── payments
  │           ├── payment_status_history
  │           └── payment_webhook_events
  │
  ├── payment_provider_settings
  │
  ├── admin_users
  │     ├── admin_user_roles
  │     └── admin_outlet_scopes
  │
  └── audit_logs
```

---

# 6. Final Decisions for Phase 3.1

Ini keputusan yang aku sarankan kita kunci:

| Area                     | Decision                                 |
| ------------------------ | ---------------------------------------- |
| Payment provider         | Configurable dari Settings               |
| Active provider sekarang | `bayargg`                                |
| Payment schema           | Provider-agnostic                        |
| QR outlet                | Locked by QR session                     |
| Cart                     | Local frontend + backend validation      |
| Checkout                 | Backend snapshot + idempotency           |
| Order status             | 3-layer status                           |
| Public order access      | `public_order_token`                     |
| Admin status actions     | Berdasarkan permission + allowed actions |
| Delete order             | Tidak ada, pakai cancel                  |
| Audit log                | Wajib                                    |
| Alpha table strategy     | Alpha Minimal 32 tables                  |

---

# 7. Output Phase 3.1 yang sudah final

## Enums final

```txt
order_channel
fulfillment_type
payment_status
fulfillment_status
public_order_status
qr_location_type
qr_status
qr_session_status
payment_provider_code
payment_provider_mode
payment_method_type
actor_type
audit_action
```

## Core domains final

```txt
workspace / business
outlet & QR
storefront
catalog / menu
checkout / idempotency
orders
payments
admin / permissions
audit / security
notification optional
```

## Core table list final

```txt
workspaces
workspace_settings
brands

outlets
qr_locations
qr_codes
qr_sessions

storefronts
storefront_outlets
storefront_settings

product_categories
products
product_images
modifier_groups
modifier_options
product_modifier_groups
product_availability

checkout_sessions
checkout_items
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
role_permissions
admin_user_roles
admin_outlet_scopes

audit_logs
security_events
```

---

