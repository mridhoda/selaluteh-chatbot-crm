Siap, kita lanjut ke **Phase 3.3 — Indexes, Constraints, and Data Integrity Rules** ☕🔥

Phase ini penting banget karena database bukan cuma tempat simpan data, tapi harus ikut menjaga agar flow **Online Store + QR Store + Payment Provider Settings** tidak gampang rusak saat alpha testing.

> Catatan penting yang tetap kita pegang: **payment provider configurable dari Settings**, dan provider aktif sekarang adalah **BayarGG**.

---

# Phase 3.3 — Indexes, Constraints, and Data Integrity Rules

## Tujuan Phase 3.3

Kita ingin mengunci:

```txt
1. Unique constraints
2. Foreign key rules
3. Index untuk performa
4. Data integrity rule
5. Payment integrity
6. QR session integrity
7. Order lifecycle integrity
8. Idempotency
9. Auditability
10. Soft delete policy
```

Supaya nanti saat masuk alpha, sistem tidak mudah terkena masalah seperti:

```txt
order dobel
QR salah outlet
payment fake paid
admin prepare unpaid order
order kehilangan outlet
payment webhook diproses dua kali
customer melihat order orang lain
staff salah outlet
```

---

# 1. Prinsip Integrity Utama

Ada beberapa aturan yang wajib dijaga oleh backend + database:

| Area        | Rule                                                                    |
| ----------- | ----------------------------------------------------------------------- |
| Payment     | `paid` hanya dari backend setelah provider callback/webhook tervalidasi |
| QR Store    | QR harus terikat ke outlet dan session                                  |
| Outlet      | Order tidak boleh tanpa outlet                                          |
| Checkout    | Total harga dihitung ulang backend                                      |
| Idempotency | Checkout tidak boleh membuat order dobel                                |
| Admin       | Status transition harus permission-based                                |
| Order       | `paid` tidak sama dengan `completed`                                    |
| Delete      | Order operasional tidak boleh hard delete                               |
| Audit       | Semua action penting harus tercatat                                     |

---

# 2. Unique Constraints Plan

## 2.1 Workspace / Brand

```sql
unique(workspaces.slug)
unique(brands.workspace_id, brands.slug)
unique(workspace_settings.workspace_id, workspace_settings.key)
```

Tujuan:

```txt
Tidak boleh ada slug workspace/brand dobel.
Setting workspace tidak boleh duplicate key.
```

---

## 2.2 Outlet

```sql
unique(outlets.workspace_id, outlets.slug)
unique(outlets.workspace_id, outlets.code)
unique(qr_locations.outlet_id, qr_locations.code)
```

Tujuan:

```txt
Satu workspace tidak punya outlet slug/code yang bentrok.
Satu outlet tidak punya QR location code yang sama.
```

Contoh:

```txt
SMD
TGR
T07
COUNTER-01
```

---

## 2.3 QR

```sql
unique(qr_codes.public_code)
unique(qr_sessions.session_token)
```

Tujuan:

```txt
QR public code harus unik.
QR session token harus unik dan tidak bisa ditebak.
```

Catatan security:

```txt
public_code dan session_token harus random kuat,
bukan sequential seperti qr_001 atau meja_01.
```

---

## 2.4 Storefront

```sql
unique(storefronts.workspace_id, storefronts.slug)
unique(storefront_outlets.storefront_id, storefront_outlets.outlet_id)
unique(storefront_settings.storefront_id, storefront_settings.key)
```

Tujuan:

```txt
/store/selkop tidak bentrok.
Outlet tidak duplicate di storefront yang sama.
```

---

## 2.5 Catalog

```sql
unique(product_categories.workspace_id, product_categories.slug)
unique(products.workspace_id, products.slug)
unique(modifier_groups.workspace_id, modifier_groups.code)
unique(modifier_options.modifier_group_id, modifier_options.code)
unique(product_modifier_groups.product_id, product_modifier_groups.modifier_group_id)
unique(product_availability.product_id, product_availability.outlet_id)
```

Tujuan:

```txt
Produk, kategori, modifier, dan availability tetap bersih.
Availability per product-outlet hanya satu record.
```

---

## 2.6 Checkout / Idempotency

```sql
unique(idempotency_keys.workspace_id, idempotency_keys.key)
```

Tujuan:

```txt
Cegah customer membuat order dobel dari double tap / retry / refresh.
```

---

## 2.7 Orders

```sql
unique(orders.workspace_id, orders.order_number)
unique(orders.public_order_token)
```

Tujuan:

```txt
Nomor order unik untuk staff.
Public order token unik untuk customer tracking.
```

`public_order_token` harus random kuat, bukan sequential.

---

## 2.8 Payments

Karena provider configurable, constraint-nya harus provider-agnostic:

```sql
unique(payments.provider_id, payments.provider_reference)
```

Tapi karena `provider_reference` bisa nullable sebelum provider mengembalikan reference, lebih aman pakai **partial unique index**:

```sql
unique(provider_id, provider_reference)
where provider_reference is not null
```

Tujuan:

```txt
Webhook/callback provider yang sama tidak diproses jadi payment dobel.
```

---

## 2.9 Payment Provider Settings

Karena hanya boleh satu provider aktif per workspace per mode:

```sql
unique(workspace_id, mode)
where is_active = true
```

Artinya:

```txt
Workspace SELKOP tidak boleh punya BayarGG active dan Xendit active bersamaan di mode sandbox.
```

Provider lain boleh ada di Settings, tapi `is_active` hanya satu.

---

# 3. Foreign Key Rules

## 3.1 General FK Policy

Rekomendasi:

| Relasi                         | On Delete                 |
| ------------------------------ | ------------------------- |
| Workspace → child data         | `restrict`                |
| Outlet → orders                | `restrict`                |
| Product → order_items          | `set null`                |
| Product → product_availability | `cascade` atau `restrict` |
| Order → order_items            | `cascade`                 |
| Order → payments               | `restrict`                |
| Payment → payment_history      | `cascade`                 |
| Admin user → audit logs        | `set null`                |

---

## 3.2 Kenapa order item product_id boleh nullable?

Karena order harus tetap bisa dibaca walaupun produk dihapus/nonaktif.

Jadi:

```txt
order_items.product_id boleh null
order_items.product_name wajib snapshot
order_items.unit_price_amount wajib snapshot
```

Dengan begitu invoice/order history tetap aman.

---

## 3.3 Order tidak boleh kehilangan outlet

Untuk `orders.outlet_id`:

```sql
outlet_id uuid not null references outlets(id) on delete restrict
```

Karena order QR/online selalu harus jelas outlet-nya.

---

# 4. Index Plan

## 4.1 Orders Index

Untuk admin order list, filter paling sering:

```txt
outlet
channel
payment_status
fulfillment_status
created_at
```

Recommended indexes:

```sql
index orders_workspace_created_at_idx
on orders(workspace_id, created_at desc);

index orders_outlet_created_at_idx
on orders(outlet_id, created_at desc);

index orders_channel_created_at_idx
on orders(workspace_id, channel, created_at desc);

index orders_payment_status_created_at_idx
on orders(workspace_id, payment_status, created_at desc);

index orders_fulfillment_status_created_at_idx
on orders(workspace_id, fulfillment_status, created_at desc);

index orders_public_order_token_idx
on orders(public_order_token);

index orders_order_number_idx
on orders(workspace_id, order_number);
```

Untuk query admin gabungan bisa tambah:

```sql
index orders_admin_filter_idx
on orders(workspace_id, outlet_id, channel, payment_status, fulfillment_status, created_at desc);
```

---

## 4.2 QR Index

```sql
index qr_codes_public_code_idx
on qr_codes(public_code);

index qr_codes_outlet_status_idx
on qr_codes(outlet_id, status);

index qr_sessions_session_token_idx
on qr_sessions(session_token);

index qr_sessions_qr_code_created_idx
on qr_sessions(qr_code_id, created_at desc);

index qr_sessions_status_expires_idx
on qr_sessions(status, expires_at);
```

Tujuan:

```txt
Scan QR cepat.
Session lookup cepat.
Expired QR/session gampang dibersihkan.
```

---

## 4.3 Product/Menu Index

```sql
index product_categories_workspace_sort_idx
on product_categories(workspace_id, sort_order);

index products_category_sort_idx
on products(category_id, sort_order);

index products_workspace_active_idx
on products(workspace_id, is_active);

index product_availability_outlet_product_idx
on product_availability(outlet_id, product_id);

index product_availability_outlet_available_idx
on product_availability(outlet_id, is_available);
```

Tujuan:

```txt
Menu public cepat.
Availability outlet cepat.
Produk sold out cepat terbaca.
```

---

## 4.4 Payment Index

```sql
index payments_order_id_idx
on payments(order_id);

index payments_provider_reference_idx
on payments(provider_id, provider_reference);

index payments_status_created_idx
on payments(workspace_id, status, created_at desc);

index payments_expires_idx
on payments(status, expires_at);

index payment_webhook_provider_event_idx
on payment_webhook_events(provider_id, provider_event_id);

index payment_webhook_payload_hash_idx
on payment_webhook_events(payload_hash);

index payment_status_history_payment_idx
on payment_status_history(payment_id, created_at desc);
```

Tujuan:

```txt
Payment status lookup cepat.
Webhook idempotency aman.
Expired payment gampang dicari.
```

---

## 4.5 Admin / Permission Index

```sql
index admin_users_workspace_email_idx
on admin_users(workspace_id, email);

index admin_user_roles_user_idx
on admin_user_roles(admin_user_id);

index role_permissions_role_idx
on role_permissions(role_id);

index admin_outlet_scopes_user_outlet_idx
on admin_outlet_scopes(admin_user_id, outlet_id);
```

---

## 4.6 Audit Log Index

```sql
index audit_logs_workspace_created_idx
on audit_logs(workspace_id, created_at desc);

index audit_logs_entity_idx
on audit_logs(entity_type, entity_id, created_at desc);

index audit_logs_actor_idx
on audit_logs(actor_type, actor_id, created_at desc);
```

Tujuan:

```txt
Trace order/payment/settings cepat saat debugging alpha.
```

---

# 5. Check Constraints Plan

Kalau pakai PostgreSQL, beberapa enum bisa dijaga dengan `CHECK`.

## 5.1 Payment Status

```sql
check (
  payment_status in (
    'unpaid',
    'pending',
    'processing',
    'paid',
    'failed',
    'expired',
    'refunded',
    'cancelled',
    'manual_review'
  )
)
```

---

## 5.2 Fulfillment Status

```sql
check (
  fulfillment_status in (
    'not_started',
    'awaiting_acceptance',
    'accepted',
    'preparing',
    'ready',
    'completed',
    'cancelled'
  )
)
```

---

## 5.3 Fulfillment Type

```sql
check (
  fulfillment_type in (
    'pickup',
    'dine_in',
    'takeaway'
  )
)
```

---

## 5.4 Order Channel

```sql
check (
  channel in (
    'online_store',
    'qr_store'
  )
)
```

---

## 5.5 Money Amount

Untuk amount:

```sql
check (subtotal_amount >= 0)
check (discount_amount >= 0)
check (service_fee_amount >= 0)
check (tax_amount >= 0)
check (total_amount >= 0)
```

Untuk quantity:

```sql
check (quantity > 0)
```

---

# 6. Data Integrity Rules by Domain

## 6.1 QR Integrity Rules

### Rule 1 — QR code must belong to outlet

```txt
qr_codes.outlet_id wajib ada.
```

### Rule 2 — QR session follows QR code outlet

Saat QR session dibuat:

```txt
qr_sessions.outlet_id harus sama dengan qr_codes.outlet_id.
```

Ini biasanya ditegakkan di service layer.

### Rule 3 — QR locked outlet cannot be changed

Jika:

```txt
qr_codes.outlet_locked = true
```

Maka checkout harus pakai:

```txt
checkout.outlet_id = qr_session.outlet_id
```

Kalau tidak:

```txt
QR_OUTLET_MISMATCH
```

### Rule 4 — QR expired cannot create session

Jika:

```txt
qr_codes.status != active
atau qr_codes.expires_at < now()
```

Maka reject.

### Rule 5 — QR session expired cannot checkout

Jika:

```txt
qr_sessions.status != active
atau qr_sessions.expires_at < now()
```

Maka reject checkout.

---

## 6.2 Storefront Integrity Rules

Online store boleh pilih outlet, tapi outlet harus:

```txt
ada di storefront_outlets
is_visible = true
outlets.is_active = true
outlets.ordering_enabled = true
```

Kalau tidak:

```txt
OUTLET_UNAVAILABLE
```

---

## 6.3 Product/Menu Integrity Rules

Saat validate cart / checkout:

Backend harus cek:

```txt
product exists
product.is_active = true
product belongs to workspace/brand
product available in selected outlet
modifier group valid for product
modifier option valid for selected group
quantity valid
```

Harga final:

```txt
unit_price = products.base_price_amount
modifier_total = sum(option.price_delta_amount)
line_total = (unit_price + modifier_total) * quantity
```

Frontend total diabaikan.

---

## 6.4 Checkout Integrity Rules

Checkout harus:

```txt
punya idempotency key
punya valid outlet
punya valid cart
punya customer name
punya customer phone
punya fulfillment_type valid
punya backend-calculated total
```

Jika channel `qr_store`, harus ada:

```txt
qr_session_id
qr_session_token
```

Jika channel `online_store`, harus ada:

```txt
storefront_id
```

---

## 6.5 Order Integrity Rules

Order dibuat dari checkout yang valid.

Initial state:

### Untuk order baru sebelum payment

```txt
payment_status = pending
fulfillment_status = not_started
public_order_status = payment_pending
```

### Setelah payment paid dari provider

```txt
payment_status = paid
fulfillment_status = awaiting_acceptance
public_order_status = order_received
```

### Staff accept

```txt
payment_status = paid
fulfillment_status = accepted
public_order_status = accepted
```

### Staff prepare

```txt
payment_status = paid
fulfillment_status = preparing
public_order_status = preparing
```

### Staff ready

```txt
payment_status = paid
fulfillment_status = ready
public_order_status = ready
```

### Staff complete

```txt
payment_status = paid
fulfillment_status = completed
public_order_status = completed
```

---

# 7. Status Transition Rules

## 7.1 Payment Transition Matrix

| From            | To Allowed                                             |
| --------------- | ------------------------------------------------------ |
| `unpaid`        | `pending`, `cancelled`                                 |
| `pending`       | `processing`, `paid`, `failed`, `expired`, `cancelled` |
| `processing`    | `paid`, `failed`, `manual_review`                      |
| `paid`          | `refunded`, `manual_review`                            |
| `failed`        | terminal                                               |
| `expired`       | terminal                                               |
| `refunded`      | terminal                                               |
| `cancelled`     | terminal                                               |
| `manual_review` | `paid`, `failed`, `refunded`, `cancelled`              |

Rule:

```txt
failed/expired/refunded/cancelled terminal kecuali admin/system override dengan audit.
```

---

## 7.2 Fulfillment Transition Matrix

| From                  | To Allowed                         |
| --------------------- | ---------------------------------- |
| `not_started`         | `awaiting_acceptance`, `cancelled` |
| `awaiting_acceptance` | `accepted`, `cancelled`            |
| `accepted`            | `preparing`, `cancelled`           |
| `preparing`           | `ready`, `cancelled`               |
| `ready`               | `completed`, `cancelled`           |
| `completed`           | terminal                           |
| `cancelled`           | terminal                           |

Rule besar:

```txt
accepted/preparing/ready/completed hanya boleh kalau payment_status = paid.
```

---

## 7.3 Public Order Status Mapping

Backend harus generate status customer dari payment + fulfillment.

| Payment Status | Fulfillment Status    | Public Status        |
| -------------- | --------------------- | -------------------- |
| `pending`      | `not_started`         | `payment_pending`    |
| `processing`   | `not_started`         | `payment_processing` |
| `failed`       | `not_started`         | `payment_failed`     |
| `expired`      | `not_started`         | `payment_expired`    |
| `paid`         | `awaiting_acceptance` | `order_received`     |
| `paid`         | `accepted`            | `accepted`           |
| `paid`         | `preparing`           | `preparing`          |
| `paid`         | `ready`               | `ready`              |
| `paid`         | `completed`           | `completed`          |
| any            | `cancelled`           | `cancelled`          |

---

# 8. Payment Integrity Rules

Karena provider configurable dan sekarang BayarGG aktif:

## 8.1 Active Provider Rule

Saat checkout:

```txt
ambil active payment_provider_settings
where workspace_id = current workspace
and mode = current mode
and is_active = true
```

Kalau tidak ada:

```txt
PAYMENT_PROVIDER_NOT_CONFIGURED
```

Kalau ada lebih dari satu:

```txt
PAYMENT_PROVIDER_CONFIG_CONFLICT
```

Ini harus dicegah dengan partial unique index.

---

## 8.2 Provider-Agnostic Payment Fields

Jangan buat kolom spesifik seperti:

```txt
bayargg_invoice_id
xendit_invoice_id
midtrans_token
```

Gunakan:

```txt
provider_payment_id
provider_reference
provider_checkout_url / payment_url
raw_status
metadata_json
```

---

## 8.3 Webhook Idempotency

Payment webhook harus aman diproses berkali-kali.

Gunakan:

```txt
provider_event_id
payload_hash
provider_reference
```

Rules:

```txt
Jika provider_event_id sudah processed, ignore.
Jika payload_hash sudah processed, ignore atau mark duplicate.
Jika amount mismatch, masuk manual_review.
Jika signature invalid, jangan update payment.
```

---

## 8.4 Amount Matching

Webhook paid hanya valid kalau:

```txt
provider amount = payments.amount
provider currency = payments.currency
provider reference cocok
signature valid
payment belum terminal incompatible
```

Kalau mismatch:

```txt
payment_status = manual_review
security_event = payment_amount_mismatch
```

---

## 8.5 Payment Expiry

Expired payment harus berdasarkan backend/provider.

Rule:

```txt
payments.expires_at < now()
and status in pending/processing
→ status expired
```

Jangan berdasarkan timer frontend.

---

# 9. Idempotency Rules

## 9.1 Checkout Idempotency

Client wajib kirim:

```http
Idempotency-Key: checkout_<random>
```

Backend simpan:

```txt
workspace_id
key
request_hash
response_json
resource_type
resource_id
status
expires_at
```

Behavior:

| Kondisi                      | Result                                    |
| ---------------------------- | ----------------------------------------- |
| Key baru                     | proses checkout                           |
| Key sama + request hash sama | return response lama                      |
| Key sama + request hash beda | error                                     |
| Key sedang processing        | return 409 atau wait/retry                |
| Key expired                  | boleh reject atau buat baru sesuai policy |

Error:

```txt
IDEMPOTENCY_KEY_CONFLICT
```

---

## 9.2 Idempotency Expiry

Rekomendasi alpha:

```txt
idempotency_keys.expires_at = created_at + 24 hours
```

---

# 10. Public Token Security

## 10.1 `public_order_token`

Harus:

```txt
random kuat
unguessable
unique
tidak mengandung order_number
tidak sequential
```

Contoh aman:

```txt
pub_ord_6H8kLm92PxQz
```

Contoh buruk:

```txt
order_001
SKP-0001
```

---

## 10.2 Public Order Response

Endpoint public order tidak boleh mengembalikan:

```txt
internal_note
admin user id
raw payment payload
full audit log
payment provider secret/reference sensitif
full phone number jika tidak perlu
```

Untuk phone bisa masking:

```txt
62812****7890
```

---

# 11. Admin Permission Integrity

## 11.1 Outlet Scope

Admin order query harus filter berdasarkan outlet scope.

```txt
Admin hanya melihat order dari outlet yang dia punya access.
```

Jika owner/manager global:

```txt
can_view_all_outlets = true
```

atau pakai role permission.

---

## 11.2 Allowed Actions

Backend harus mengirim:

```json
{
  "allowed_actions": [
    "accept_order",
    "mark_preparing",
    "mark_ready",
    "mark_completed",
    "cancel_order"
  ]
}
```

Frontend tidak boleh menebak action dari status saja.

---

## 11.3 Permission Rule

| Action                  | Required Permission       |
| ----------------------- | ------------------------- |
| Accept order            | `orders.accept`           |
| Mark preparing          | `orders.prepare`          |
| Mark ready              | `orders.ready`            |
| Complete order          | `orders.complete`         |
| Cancel order            | `orders.cancel`           |
| Payment manual review   | `payments.manual_review`  |
| Change payment provider | `settings.payment.manage` |

---

# 12. Soft Delete Policy

## 12.1 Do Not Hard Delete

Untuk data operasional:

```txt
orders
payments
payment_webhook_events
order_status_history
payment_status_history
audit_logs
qr_sessions
```

Tidak boleh hard delete.

Gunakan:

```txt
cancelled
revoked
inactive
deleted_at
```

---

## 12.2 Data yang boleh soft delete

```txt
products
categories
modifier options
outlets
admin users
qr codes
```

Tapi tetap jangan hilangkan history order.

---

# 13. Audit Log Rules

Audit wajib untuk:

```txt
order.created
order.accepted
order.preparing
order.ready
order.completed
order.cancelled

payment.created
payment.paid
payment.failed
payment.expired
payment.manual_review

qr.scanned
qr.revoked
settings.payment_provider_changed
product.availability_changed
admin.permission_changed
```

Minimal audit log harus menyimpan:

```txt
actor_type
actor_id
action
entity_type
entity_id
before_json
after_json
reason
created_at
```

Untuk cancel order:

```txt
reason wajib
```

---

# 14. Transaction Boundaries

Ini penting saat implementasi backend.

## 14.1 Checkout Transaction

Dalam satu transaction:

```txt
1. Lock idempotency key
2. Validate QR/storefront/outlet
3. Validate cart/products/modifiers
4. Calculate totals
5. Create checkout_session
6. Create order
7. Create order_items
8. Create payment record
9. Call payment provider? 
10. Save provider response
11. Save idempotency response
```

Catatan:

Kalau provider call dilakukan di tengah transaction, hati-hati timeout. Alternatif lebih aman:

```txt
create order/payment pending internal
commit
call provider
update payment provider reference/url
```

Untuk alpha, pendekatan kedua lebih stabil.

---

## 14.2 Webhook Transaction

Dalam satu transaction:

```txt
1. Save webhook event
2. Verify signature
3. Find payment
4. Check duplicate event
5. Validate amount/currency/reference
6. Update payment status
7. Update order payment_status
8. If paid, set fulfillment_status awaiting_acceptance
9. Insert payment_status_history
10. Insert order_status_history
11. Insert audit_log
12. Mark webhook processed
```

---

## 14.3 Admin Status Update Transaction

Dalam satu transaction:

```txt
1. Check admin permission
2. Check outlet scope
3. Lock order row
4. Validate current payment_status
5. Validate fulfillment transition
6. Update order status
7. Insert order_status_history
8. Insert audit_log
9. Return updated order + allowed_actions
```

---

# 15. Alpha Integrity Checklist

Sebelum alpha, pastikan ini sudah ada:

```txt
[ ] orders.public_order_token unique dan random
[ ] payments.provider_reference unique per provider
[ ] idempotency key aktif di checkout
[ ] QR public_code unique
[ ] QR session token unique
[ ] payment provider active hanya satu per workspace/mode
[ ] admin status transition tidak bisa unpaid → preparing
[ ] payment paid hanya dari webhook/backend
[ ] order cancel wajib reason
[ ] order delete tidak tersedia di UI/API
[ ] product availability dicek per outlet
[ ] public order response tidak bocorkan data internal
[ ] audit log tercatat untuk payment/order/settings
```

---

# 16. Phase 3.3 Deliverables

Output dokumen yang bisa dibuat dari phase ini:

```txt
03-indexes-and-constraints.md
04-integrity-rules.md
05-status-transition-rules.md
06-payment-integrity-rules.md
07-qr-integrity-rules.md
08-alpha-db-readiness-checklist.md
```

Atau digabung dulu menjadi:

```txt
database-integrity-plan.md
```

---

# Final Recommendation Phase 3.3

Menurutku yang paling wajib kamu implementasikan sebelum alpha adalah:

```txt
1. Idempotency checkout
2. Payment provider active setting constraint
3. Payment webhook idempotency
4. Payment amount matching
5. QR session outlet lock
6. Admin transition guard
7. Public order token security
8. Audit log untuk order/payment/settings
```

Kalau 8 ini aman, sistem kamu jauh lebih siap untuk masuk alpha online/QR ordering.

