Siap, kita lanjut ke **Phase 3.4 — Security & Threat Model Plan** 🔐☕
Ini fase penting sebelum implementasi dan alpha testing, karena sekarang flow kamu menyentuh **QR ordering, checkout, payment provider configurable, BayarGG, admin order actions, dan public order tracking**.

> Fokus Phase 3.4: **bukan bikin security terlalu enterprise dulu**, tapi memastikan Online/QR Store aman untuk alpha dan tidak mudah dimanipulasi.

---

# Phase 3.4 — Security & Threat Model Plan

## Goal Phase 3.4

Kita mau melindungi beberapa hal utama:

```txt
1. QR tidak bisa dipalsukan / salah outlet
2. Harga order tidak bisa dimanipulasi dari frontend
3. Payment paid tidak bisa dipalsukan client
4. Webhook BayarGG tidak bisa dipalsukan
5. Checkout tidak membuat order dobel
6. Public order status tidak bocor data sensitif
7. Admin tidak bisa update order di luar permission
8. Payment provider settings tidak bisa diubah sembarang
9. Semua aksi penting tercatat di audit log
```

---

# 1. Security Scope

Scope security untuk alpha:

```txt
Online Store
QR Store
Checkout
Payment Provider Settings
BayarGG Payment Flow
Payment Webhook
Public Order Status
Admin Online/QR Order Management
Audit Log
```

Yang belum perlu terlalu dalam:

```txt
Full enterprise SSO
Advanced fraud ML
Full WAF tuning
Complex multi-tenant enterprise isolation
Delivery driver security
Loyalty abuse prevention
```

---

# 2. Main Actors

| Actor            | Akses                                              | Risiko                                         |
| ---------------- | -------------------------------------------------- | ---------------------------------------------- |
| Customer         | Scan QR, browse menu, checkout, bayar, lihat order | Bisa manipulasi cart/price/token               |
| Staff outlet     | Lihat dan update order                             | Bisa proses unpaid order / salah outlet        |
| Admin/Owner      | Setting provider, produk, outlet                   | Bisa salah konfigurasi payment                 |
| Payment Provider | Kirim callback/webhook                             | Webhook spoofing / duplicate event             |
| Attacker         | Tanpa login                                        | QR tampering, brute force token, spam checkout |
| System           | Update status otomatis                             | Bug status transition                          |

---

# 3. Trust Boundary

Ini batas kepercayaan yang wajib kamu pahami:

```txt
Frontend/customer browser = tidak dipercaya
Admin frontend = tidak sepenuhnya dipercaya
Backend service = source of truth
Database = source of truth persistence
Payment provider webhook = dipercaya hanya setelah signature valid
```

Artinya:

```txt
Harga dari frontend tidak dipercaya
Payment status dari frontend tidak dipercaya
Outlet dari frontend harus divalidasi
QR token harus divalidasi backend
Admin action harus dicek backend
```

---

# 4. Threat Model per Flow

---

## 4.1 QR Scan Flow Threats

### Flow

```txt
Customer scan QR
→ /qr/:qrToken
→ Backend validate QR
→ Create QR session
→ Customer order dari outlet/lokasi QR
```

### Threats

| Threat                           | Risiko                         | Control                            |
| -------------------------------- | ------------------------------ | ---------------------------------- |
| QR token ditebak                 | Orang buka QR palsu            | Token random panjang, unguessable  |
| QR lama masih aktif              | Customer order dari QR expired | `qr_codes.status`, `expires_at`    |
| QR salah outlet                  | Order masuk outlet salah       | QR bind ke `outlet_id`             |
| Customer ganti outlet            | Order keluar dari context QR   | `outlet_locked = true`             |
| QR meja dipakai di luar konteks  | Order meja salah               | `qr_location_id`, label meja jelas |
| QR dicetak ulang oleh pihak lain | Abuse order                    | Revocation support                 |

### Required Controls

```txt
QR public_code harus random kuat
QR code harus punya status active/inactive/expired/revoked
QR harus bind ke outlet
QR session harus bind ke QR code + outlet + location
QR session punya expiry
QR locked outlet tidak bisa diganti customer
Invalid/expired/revoked QR harus punya UI state jelas
```

### Recommended Error Codes

```txt
QR_INVALID
QR_EXPIRED
QR_REVOKED
QR_INACTIVE
QR_OUTLET_MISMATCH
QR_SESSION_EXPIRED
```

---

## 4.2 Cart & Checkout Threats

### Flow

```txt
Customer add to cart
→ Checkout
→ Backend validate cart
→ Backend calculate total
→ Create order + payment
```

### Threats

| Threat                         | Risiko                 | Control                       |
| ------------------------------ | ---------------------- | ----------------------------- |
| Customer edit price di browser | Bayar lebih murah      | Backend recalculate total     |
| Customer order produk sold out | Operasional kacau      | Validate product availability |
| Customer ubah outlet_id        | Order salah outlet     | Outlet validation + QR lock   |
| Double click checkout          | Order dobel            | Idempotency key               |
| Cart stale dari localStorage   | Harga/produk berubah   | Cart validation endpoint      |
| Modifier invalid               | Item tidak sesuai menu | Validate modifier relation    |

### Required Controls

```txt
Frontend total = preview only
Backend total = final
Backend validate product, modifier, outlet, availability
Checkout wajib pakai Idempotency-Key
Checkout request hash harus disimpan
Duplicate checkout return existing order/payment
```

### Security Rule

```txt
Jangan pernah simpan total dari frontend sebagai final total.
```

Backend harus hitung:

```txt
unit_price
modifier_total
line_total
subtotal
discount
tax/service fee
total
```

---

## 4.3 Payment Provider Settings Threats

Karena provider dipilih dari **Settings** dan provider aktif sekarang **BayarGG**, ini area sensitif.

### Threats

| Threat                              | Risiko             | Control                                   |
| ----------------------------------- | ------------------ | ----------------------------------------- |
| Staff biasa ubah provider           | Payment rusak      | Permission `settings.payment.manage`      |
| Dua provider aktif bersamaan        | Checkout conflict  | Unique active provider per workspace/mode |
| Secret key bocor                    | Payment compromise | Secret ref/encrypted storage              |
| Salah mode sandbox/production       | Payment gagal      | Mode jelas di UI + audit                  |
| Provider config berubah tanpa jejak | Susah debugging    | Audit log wajib                           |

### Required Controls

```txt
Only owner/admin with permission can update payment provider settings
Only one active provider per workspace per mode
Secrets tidak disimpan plain text
Provider change harus masuk audit_logs
UI harus menampilkan mode: sandbox / production
BayarGG active provider harus jelas di Settings
```

### Permission

```txt
settings.payment.read
settings.payment.manage
settings.payment.rotate_secret
```

---

## 4.4 BayarGG Payment Flow Threats

### Flow

```txt
Checkout
→ Backend create payment via active provider BayarGG
→ Customer redirected/open payment URL
→ BayarGG callback/webhook
→ Backend verify
→ Payment paid
→ Order awaiting_acceptance
```

### Threats

| Threat                              | Risiko                      | Control                         |
| ----------------------------------- | --------------------------- | ------------------------------- |
| Fake paid dari client               | Order diproses tanpa bayar  | Paid hanya dari backend/webhook |
| Webhook palsu                       | Payment fraud               | Verify signature                |
| Duplicate webhook                   | Status double update        | Webhook idempotency             |
| Amount mismatch                     | Customer bayar nominal beda | Amount matching                 |
| Currency mismatch                   | Payment salah currency      | Currency validation             |
| Provider reference mismatch         | Update payment salah        | Match provider_reference        |
| Payment expired tapi tetap diproses | Order tidak valid           | Expiry validation               |
| Raw webhook bocor                   | Data sensitif terekspos     | Simpan hash/ref, bukan expose   |

### Required Controls

```txt
Verify BayarGG webhook signature
Validate provider_reference
Validate amount
Validate currency
Validate status mapping
Store webhook event
Prevent duplicate processing
Update payment + order in one transaction
Insert payment_status_history
Insert order_status_history
Insert audit_logs
```

### Webhook Processing Rule

```txt
Webhook invalid signature → do not update payment
Webhook duplicate → ignore safely
Webhook amount mismatch → manual_review
Webhook paid valid → payment_status paid + fulfillment_status awaiting_acceptance
```

---

# 5. Status Transition Security

Ini salah satu security paling penting untuk mencegah staff memproses unpaid order.

## Payment Status Rule

```txt
payment_status = paid
hanya boleh dari:
1. Valid provider webhook/callback
2. System verified provider status check
3. Manual override khusus dengan permission tinggi + audit
```

Untuk alpha, rekomendasi:

```txt
Manual override payment = disabled
```

---

## Fulfillment Status Rule

| Action   | Required Current State | Required Payment | Permission        |
| -------- | ---------------------- | ---------------- | ----------------- |
| Accept   | `awaiting_acceptance`  | `paid`           | `orders.accept`   |
| Prepare  | `accepted`             | `paid`           | `orders.prepare`  |
| Ready    | `preparing`            | `paid`           | `orders.ready`    |
| Complete | `ready`                | `paid`           | `orders.complete` |
| Cancel   | not terminal           | any              | `orders.cancel`   |

Rule wajib:

```txt
Tidak boleh accepted/preparing/ready/completed kalau payment_status != paid.
```

---

# 6. Public Order Token Security

Public order status page harus aman karena customer bisa buka tanpa login.

## Threats

| Threat                 | Risiko                          | Control              |
| ---------------------- | ------------------------------- | -------------------- |
| Token ditebak          | Lihat order orang lain          | Random strong token  |
| Data internal bocor    | Staff note/payment raw terlihat | Response public-safe |
| Phone number bocor     | Privacy issue                   | Masking              |
| Token dipakai scraping | Abuse                           | Rate limit           |

## Required Controls

```txt
public_order_token harus random kuat
Jangan pakai order_number sebagai token
Public response hanya field customer-safe
Masking customer phone
Rate limit public order endpoint
No internal_note
No admin actor info
No raw provider payload
No internal audit logs
```

Contoh masking:

```txt
62812****7890
```

---

# 7. Admin Security

## Admin Risks

| Threat                         | Risiko                 | Control                        |
| ------------------------------ | ---------------------- | ------------------------------ |
| Staff lihat semua outlet       | Data outlet lain bocor | Outlet scope                   |
| Staff update order outlet lain | Operasional kacau      | `admin_outlet_scopes`          |
| Staff cancel tanpa alasan      | Audit lemah            | Cancel reason required         |
| Delete order                   | Data hilang            | No hard delete                 |
| UI menampilkan action salah    | Salah proses           | `allowed_actions` dari backend |
| Role salah permission          | Abuse                  | RBAC                           |

## Required Controls

```txt
Admin API must check authentication
Admin API must check permission
Admin API must check outlet scope
Admin API must return allowed_actions
Admin UI uses allowed_actions, not local guess
Cancel order requires reason
Delete order endpoint should not exist for operational order
All admin status changes logged
```

---

# 8. Rate Limiting Plan

Untuk alpha, rate limit sederhana sudah cukup.

| Endpoint                          |                                 Suggested Limit |
| --------------------------------- | ----------------------------------------------: |
| `GET /public/qr/:qrToken`         |                                   60/min per IP |
| `POST /public/carts/validate`     |                           30/min per IP/session |
| `POST /public/checkout`           |                           10/min per IP/session |
| `GET /public/payments/:id/status` |                             30/min per IP/order |
| `GET /public/orders/:token`       |                             60/min per IP/token |
| `POST /webhooks/payments/bayargg` | Signature required, no normal public rate style |
| Admin login                       |                              5/min per IP/email |
| Admin status update               |                                 60/min per user |

Payment webhook jangan diblokir dengan rate limit sembarangan, tapi harus:

```txt
signature verification
provider allowlist if possible
duplicate event protection
payload size limit
```

---

# 9. Input Validation Plan

Gunakan validation schema di backend untuk semua request.

## Public Checkout Validation

```txt
customer.name required
customer.phone required
items min 1
product_id required
quantity > 0
modifier option valid
fulfillment_type valid
outlet_id required
qr_session_token required if qr_store
idempotency key required
```

## Admin Status Validation

```txt
reason required for cancel
orderId must be uuid
transition must be valid
admin must have permission
admin must have outlet scope
```

## Payment Settings Validation

```txt
provider_id valid
mode valid
only one active provider
secret refs valid
payment_expiry_minutes reasonable
enabled methods supported by provider
```

---

# 10. Secret Management Plan

Karena payment provider settings sensitif:

## Jangan simpan plain secret seperti ini

```txt
secret_key = "sk_live_xxxxx"
webhook_secret = "xxxx"
```

## Lebih aman

```txt
secret_key_ref = "secret://selkop/bayargg/sandbox/secret_key"
webhook_secret_ref = "secret://selkop/bayargg/sandbox/webhook_secret"
```

Untuk implementasi awal, kalau belum punya secret manager:

```txt
Simpan secret di environment variable
DB hanya menyimpan reference/key name
```

Contoh:

```txt
BAYARGG_SANDBOX_SECRET_KEY
BAYARGG_SANDBOX_WEBHOOK_SECRET
```

---

# 11. Audit Log Plan

Audit wajib untuk semua aksi penting.

## Order Audit

```txt
order.created
order.accepted
order.preparing
order.ready
order.completed
order.cancelled
```

## Payment Audit

```txt
payment.created
payment.webhook_received
payment.paid
payment.failed
payment.expired
payment.manual_review
```

## QR Audit

```txt
qr.scanned
qr.session_created
qr.revoked
qr.invalid_attempt
```

## Settings Audit

```txt
settings.payment_provider_changed
settings.payment_secret_rotated
settings.payment_mode_changed
```

## Admin Audit

```txt
admin.login
admin.permission_changed
admin.outlet_scope_changed
```

Minimal field:

```txt
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

# 12. Threat Severity Matrix

## P0 Security Risks

Wajib fix sebelum alpha real order.

| Risk                                 | Severity | Required Fix                   |
| ------------------------------------ | -------- | ------------------------------ |
| Client bisa membuat payment `paid`   | Critical | Paid only from backend/webhook |
| Admin bisa prepare unpaid order      | Critical | Status transition guard        |
| Webhook tanpa signature verification | Critical | Verify BayarGG signature       |
| Checkout tanpa idempotency           | High     | Idempotency-Key wajib          |
| QR outlet tidak locked               | High     | QR session outlet lock         |
| Harga dari frontend dipercaya        | Critical | Backend recalculation          |
| Public order token predictable       | High     | Strong random token            |

---

## P1 Security Risks

Sebaiknya fix sebelum alpha luas.

| Risk                                  | Severity | Required Fix                |
| ------------------------------------- | -------- | --------------------------- |
| Admin outlet scope belum kuat         | High     | RBAC + outlet scope         |
| Payment provider settings tanpa audit | High     | Audit logs                  |
| Cancel tanpa reason                   | Medium   | Reason required             |
| Rate limit belum ada                  | Medium   | Basic rate limit            |
| QR expired state belum ada            | Medium   | QR status/expiry validation |
| Order status response terlalu detail  | Medium   | Public-safe response        |

---

# 13. Security Test Plan for Alpha

## Customer Security Tests

```txt
[ ] Ubah total cart di browser → backend tetap hitung total asli
[ ] Checkout tanpa idempotency key → reject
[ ] Double click checkout → hanya satu order dibuat
[ ] Pakai QR expired → reject
[ ] Pakai QR revoked → reject
[ ] QR outlet A tapi kirim outlet B → reject
[ ] Buka public order token random → not found
[ ] Payment pending tidak berubah paid dari timer frontend
```

## Payment Security Tests

```txt
[ ] Webhook tanpa signature → reject
[ ] Webhook signature salah → reject
[ ] Webhook duplicate → ignored safely
[ ] Webhook amount mismatch → manual_review
[ ] Webhook currency mismatch → manual_review
[ ] Valid paid webhook → order jadi awaiting_acceptance
[ ] Expired payment → tidak bisa diproses fulfillment
```

## Admin Security Tests

```txt
[ ] Staff outlet A tidak bisa lihat order outlet B
[ ] Staff tanpa permission tidak bisa cancel order
[ ] Staff tidak bisa prepare unpaid order
[ ] Cancel order wajib reason
[ ] Delete order endpoint tidak tersedia
[ ] Payment provider settings hanya bisa diubah owner/admin
[ ] Semua status update masuk audit log
```

---

# 14. Security Implementation Priority

## Phase 3.4A — Must-have Before Real Alpha

```txt
1. Backend total recalculation
2. Payment paid only from backend/webhook
3. BayarGG webhook signature verification
4. Checkout idempotency
5. QR session outlet lock
6. Admin status transition guard
7. Public order token random
8. Cancel reason + audit log
```

## Phase 3.4B — Should-have Before Wider Alpha

```txt
1. Rate limiting
2. Admin outlet scope
3. Payment provider settings audit
4. Public order response masking
5. Webhook duplicate event handling
6. QR revoked/expired UI states
```

## Phase 3.4C — Nice-to-have Later

```txt
1. Advanced fraud scoring
2. Device fingerprinting
3. IP allowlist for webhook
4. Advanced anomaly detection
5. Manual payment review console
```

---

# 15. Backend Security Middleware Plan

Minimal middleware yang perlu ada:

```txt
request_id middleware
rate_limit middleware
input_validation middleware
admin_auth middleware
permission_check middleware
outlet_scope_check middleware
idempotency middleware
webhook_signature_verification middleware
audit_log helper
error_handler middleware
```

Untuk public route:

```txt
rate limit
input validation
safe error response
```

Untuk admin route:

```txt
auth
permission
outlet scope
audit
```

Untuk webhook route:

```txt
raw body parser
signature verification
idempotency
payload size limit
```

---

# 16. Security Rules by Endpoint

## Public QR

```txt
GET /api/v1/public/qr/:qrToken
```

Rules:

```txt
Validate qrToken
Check QR active
Check QR expiry
Create QR session
Return outlet + QR context
Do not expose internal IDs unnecessarily
```

---

## Checkout

```txt
POST /api/v1/public/checkout
```

Rules:

```txt
Idempotency-Key required
Validate QR/storefront context
Validate outlet
Validate product availability
Recalculate total
Create order/payment
Never trust frontend amount
```

---

## Payment Status

```txt
GET /api/v1/public/payments/:paymentId/status
```

Rules:

```txt
Return backend status only
Do not auto-promote paid
Do not expose provider raw payload
Rate limit polling
```

---

## Public Order

```txt
GET /api/v1/public/orders/:publicOrderToken
```

Rules:

```txt
Token random and unique
Return public-safe response
Mask sensitive customer info
Rate limit
```

---

## Admin Order Transition

```txt
POST /api/v1/admin/orders/:orderId/prepare
```

Rules:

```txt
Admin authenticated
Has permission orders.prepare
Has outlet scope
Order payment_status must be paid
Current fulfillment_status must be accepted
Insert audit log
```

---

## BayarGG Webhook

```txt
POST /api/v1/webhooks/payments/bayargg
```

Rules:

```txt
Use raw request body for signature verification
Verify BayarGG signature
Store webhook event
Reject/ignore duplicate
Validate amount/currency/reference
Update payment/order transactionally
Never expose webhook endpoint logic to frontend
```

---

# 17. Alpha Security Readiness Checklist

Sebelum alpha real order, minimal checklist ini harus hijau:

```txt
[ ] QR token random dan tidak sequential
[ ] QR session punya expiry
[ ] QR locked outlet enforced
[ ] Checkout pakai idempotency
[ ] Backend recalculate total
[ ] Product availability dicek per outlet
[ ] Payment provider aktif diambil dari Settings
[ ] BayarGG webhook signature diverifikasi
[ ] Payment paid hanya dari backend/webhook
[ ] Webhook duplicate aman
[ ] Amount/currency matching ada
[ ] Admin tidak bisa prepare unpaid order
[ ] Admin action pakai permission
[ ] Admin outlet scope aktif
[ ] Cancel order wajib reason
[ ] Order tidak bisa hard delete
[ ] Public order token random
[ ] Public order response aman
[ ] Audit log untuk order/payment/settings
[ ] Rate limit basic aktif
```

---

# 18. Final Output Phase 3.4

Dokumen Phase 3.4 nanti bisa dibuat sebagai:

```txt
security-threat-model.md
```

Isi dokumennya:

```txt
1. Security scope
2. Actors
3. Trust boundaries
4. QR threat model
5. Checkout threat model
6. Payment/BayarGG threat model
7. Admin threat model
8. Public order token security
9. Rate limiting plan
10. Secret management plan
11. Audit log plan
12. Security test plan
13. Alpha readiness checklist
```

---

# Final Recommendation

Menurutku sebelum lanjut coding alpha, kamu wajib kunci 8 security guardrail ini:

```txt
1. Backend final total calculation
2. Idempotency checkout
3. QR outlet/session lock
4. BayarGG webhook signature verification
5. Payment paid only from backend
6. Admin status transition guard
7. Public order token security
8. Audit log for order/payment/settings
```

