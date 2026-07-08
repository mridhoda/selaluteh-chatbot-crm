Siap Rido 👍
Untuk **Phase 3.8 — Testing & Alpha Readiness**, yang harus dites bukan cuma “fitur jalan”, tapi memastikan **flow order, payment, QR, admin, dan security aman sebelum alpha**.

Aku bagi jadi 3 bagian:

1. **Apa saja yang harus dites**
2. **Flow test teknis untuk developer / QA engineer**
3. **Flow test non-teknis untuk owner, admin outlet, barista, atau tester umum**

---

# Phase 3.8 — Apa Saja yang Harus Dites

## 1. Public Storefront Test

Tujuan: memastikan customer bisa membuka menu online.

Yang dites:

```text
GET /public/storefronts/:storefrontSlug
```

Checklist:

```text
☐ Storefront aktif bisa dibuka

☐ Storefront nonaktif tidak bisa checkout

☐ Outlet list tampil benar

☐ Produk aktif tampil

☐ Produk nonaktif tidak tampil

☐ Produk sold out tidak bisa checkout

☐ Modifier tampil benar

☐ Harga tampil sesuai backend

☐ Tidak ada data internal bocor ke public response
```

Expected result:

```text
Customer hanya melihat data public:
- outlet
- menu
- kategori
- produk
- harga
- modifier
```

Tidak boleh muncul:

```text
internal_note
admin_user
raw payment provider
audit_log
cost price
```

---

# 2. QR Store Test

QR harus dites untuk 3 mode:

```text
Universal QR
Outlet QR
Location / Table QR
```

---

## 2.1 Universal QR Test

Flow:

```text
Scan QR
→ Store terbuka
→ Customer pilih outlet
→ Pilih produk
→ Checkout
→ Payment
→ Order masuk ke outlet yang dipilih
```

Yang dites:

```text
☐ Universal QR aktif bisa discan

☐ Universal QR membuat QR session

☐ Customer wajib memilih outlet

☐ Checkout gagal jika outlet belum dipilih

☐ Checkout gagal jika outlet tidak aktif

☐ Checkout gagal jika outlet ordering_enabled = false

☐ Produk divalidasi berdasarkan outlet yang dipilih

☐ Order menyimpan qr_scope = universal

☐ Admin bisa melihat order berasal dari Universal QR
```

Expected result:

```text
Order masuk ke outlet final yang dipilih customer.
```

---

## 2.2 Outlet QR Test

Flow:

```text
Scan QR outlet
→ Outlet otomatis terkunci
→ Customer order
→ Checkout
→ Order masuk ke outlet tersebut
```

Yang dites:

```text
☐ Outlet QR aktif bisa discan

☐ Outlet otomatis terkunci

☐ Customer tidak bisa mengganti outlet

☐ Checkout dengan outlet berbeda harus gagal

☐ Error QR_OUTLET_MISMATCH muncul jika outlet dimanipulasi

☐ Order menyimpan qr_scope = outlet

☐ Admin melihat QR Type = Outlet QR
```

Expected result:

```text
Outlet QR hanya bisa membuat order untuk outlet yang terikat di QR.
```

---

## 2.3 Location / Table QR Test

Flow:

```text
Scan QR meja
→ Outlet otomatis terkunci
→ Meja/location otomatis terkunci
→ Fulfillment dine_in
→ Checkout
→ Order masuk dengan table/location
```

Yang dites:

```text
☐ Location QR aktif bisa discan

☐ Outlet terkunci

☐ Table/location terkunci

☐ Customer tidak bisa mengganti outlet

☐ Customer tidak bisa mengganti table/location

☐ Checkout dengan location berbeda harus gagal

☐ Error QR_LOCATION_MISMATCH muncul jika dimanipulasi

☐ Order menyimpan table/location snapshot

☐ Admin melihat table/location di order
```

Expected result:

```text
Order jelas berasal dari meja/location tertentu.
```

---

# 3. Cart Validation Test

Cart tidak boleh dipercaya sebagai source of truth.

Yang dites:

```text
POST /public/carts/validate
```

Checklist:

```text
☐ Produk valid berhasil divalidasi

☐ Produk nonaktif ditolak

☐ Produk sold out ditolak

☐ Produk tidak tersedia di outlet ditolak

☐ Modifier invalid ditolak

☐ Modifier required wajib dipilih

☐ Modifier min/max selection bekerja

☐ Quantity 0 ditolak

☐ Quantity terlalu besar ditolak

☐ Harga dari frontend diabaikan

☐ Total dihitung ulang backend
```

Expected result:

```text
Backend selalu menghitung ulang:
- subtotal
- modifier total
- service fee
- tax
- total
```

---

# 4. Checkout Test

Checkout adalah area paling kritikal.

Yang dites:

```text
POST /public/checkout
```

Checklist:

```text
☐ Checkout valid berhasil membuat order

☐ Checkout membuat order_items

☐ Checkout membuat payment

☐ Checkout memakai Idempotency-Key

☐ Double click checkout tidak membuat order ganda

☐ Idempotency-Key sama + payload sama return response lama

☐ Idempotency-Key sama + payload beda return conflict

☐ Checkout gagal jika QR session expired

☐ Checkout gagal jika outlet mismatch

☐ Checkout gagal jika product unavailable

☐ Checkout rollback jika payment creation gagal

☐ Order snapshot tersimpan
```

Expected result:

```text
1 checkout berhasil = 1 order + 1 payment.
```

Tidak boleh:

```text
1 checkout menghasilkan 2 order
1 checkout menghasilkan 2 payment
checkout gagal tapi order tetap tersimpan
```

---

# 5. Payment Test

Provider aktif saat ini:

```text
BayarGG
```

Tapi testing tetap provider-agnostic.

Yang dites:

```text
☐ Create payment success

☐ Payment status pending

☐ Payment paid dari webhook valid

☐ Payment failed

☐ Payment expired

☐ Payment cancelled

☐ Provider timeout

☐ Provider invalid response

☐ Amount mismatch masuk manual_review

☐ Currency mismatch masuk manual_review

☐ Unknown provider reference tidak update payment

☐ Payment tidak bisa paid dari frontend
```

Expected result:

```text
Payment hanya berubah paid melalui:
- webhook valid
- provider verification valid
```

---

# 6. Webhook Test

Webhook adalah salah satu test paling penting.

Endpoint:

```text
POST /api/v1/webhooks/payments/bayargg
```

Checklist:

```text
☐ Webhook signature valid diterima

☐ Webhook signature invalid ditolak

☐ Missing signature ditolak

☐ Duplicate webhook tidak diproses dua kali

☐ Webhook replay tidak membuat status history dobel

☐ Amount mismatch masuk manual_review

☐ Currency mismatch masuk manual_review

☐ Unknown payment tidak mengubah data

☐ Webhook paid mengubah payment_status menjadi paid

☐ Webhook paid mengubah public_order_status menjadi order_received

☐ Payment status history tercatat

☐ Audit log tercatat
```

Expected result:

```text
Webhook invalid tidak pernah mengubah payment.
```

---

# 7. Order Lifecycle Test

Order lifecycle wajib mengikuti state machine.

Valid flow:

```text
payment_pending
→ order_received
→ accepted
→ preparing
→ ready
→ completed
```

Checklist:

```text
☐ Paid order bisa di-accept

☐ Unpaid order tidak bisa di-accept

☐ Accepted order bisa masuk preparing

☐ Preparing order bisa masuk ready

☐ Ready order bisa completed

☐ Completed order tidak bisa diubah lagi

☐ Cancel membutuhkan reason

☐ Cancel membuat audit log

☐ Admin allowed_actions benar
```

Invalid transition yang harus gagal:

```text
unpaid → accepted

accepted → completed

ready → preparing

completed → cancelled

cancelled → preparing
```

---

# 8. Admin Order Test

Admin dashboard harus aman.

Yang dites:

```text
☐ Admin bisa lihat order sesuai outlet scope

☐ Admin tidak bisa lihat order outlet lain

☐ Admin tanpa permission tidak bisa accept order

☐ Admin tidak bisa process unpaid order

☐ Admin tidak bisa complete order langsung dari pending

☐ Admin cancel wajib isi reason

☐ Setiap admin action membuat order_status_history

☐ Setiap admin action membuat audit_log

☐ allowed_actions dikirim dari backend
```

Expected result:

```text
Frontend admin hanya mengikuti allowed_actions dari backend.
```

---

# 9. Product Availability Test

Karena produk bisa tersedia di outlet A tapi habis di outlet B.

Checklist:

```text
☐ Produk tersedia di Outlet A bisa checkout

☐ Produk sold out di Outlet B tidak bisa checkout

☐ Update availability hanya berdampak pada outlet terkait

☐ Produk inactive tidak muncul di storefront

☐ Produk soft delete tidak muncul

☐ Order lama tetap menyimpan snapshot produk lama
```

---

# 10. Security Test

Security wajib lolos sebelum alpha.

Checklist:

```text
☐ QR token tidak mudah ditebak

☐ Public order token tidak mudah ditebak

☐ Public order tidak expose data sensitif

☐ Admin API wajib auth

☐ Admin API validasi permission

☐ Admin API validasi outlet scope

☐ Webhook signature diverifikasi

☐ Rate limit aktif

☐ Request body size limit aktif

☐ Frontend tidak bisa set payment_status

☐ Frontend tidak bisa set fulfillment_status

☐ Frontend tidak bisa set total_amount
```

---

# 11. Background Worker Test

Worker yang perlu dites:

```text
ExpireCheckoutSessionWorker
ExpireQRSessionWorker
ExpirePaymentWorker
PaymentReconciliationWorker
WebhookEventProcessorWorker
NotificationRetryWorker
CleanupWorker
```

Checklist:

```text
☐ Checkout expired berubah status expired

☐ Checkout converted tidak boleh expired

☐ QR session expired tidak bisa checkout

☐ Payment pending yang lewat expires_at menjadi expired

☐ Reconciliation bisa update payment jika provider bilang paid

☐ Worker idempotent

☐ Worker retry bekerja

☐ Dead letter job tercatat jika gagal terus
```

---

# 12. Analytics Test

Analytics tidak boleh mengubah business state.

Checklist:

```text
☐ QR scan tercatat

☐ Checkout started tercatat

☐ Payment success tercatat

☐ Order completed tercatat

☐ Universal QR source tercatat

☐ Outlet QR source tercatat

☐ Location QR source tercatat

☐ Analytics gagal tidak menggagalkan checkout
```

---

# Flow Test Teknis

Ini untuk developer, QA engineer, backend engineer, atau AI coding agent.

---

## Technical Flow 1 — Universal QR Happy Path

Tujuan:

```text
Memastikan Universal QR bisa menghasilkan paid order yang valid.
```

Steps:

```text
1. Seed workspace SELKOP

2. Seed outlet:
   - SELKOP Samarinda
   - SELKOP Tenggarong

3. Seed storefront aktif

4. Seed Universal QR aktif

5. Call:
   GET /api/v1/public/qr/:universalQrToken

6. Assert response:
   qr_scope = universal
   allow_outlet_selection = true
   qr_session_token exists
   outlets length > 0

7. Call:
   POST /api/v1/public/carts/validate

   Payload:
   - qr_session_token
   - selected outlet_id
   - products
   - modifiers

8. Assert:
   valid = true
   total_amount dihitung backend

9. Call:
   POST /api/v1/public/checkout
   Header:
   Idempotency-Key: test-universal-001

10. Assert database:
    orders created = 1
    payments created = 1
    order_items created > 0
    orders.qr_scope = universal
    orders.outlet_id = selected outlet

11. Simulate BayarGG paid webhook:
    POST /api/v1/webhooks/payments/bayargg

12. Assert:
    payment_status = paid
    public_order_status = order_received
    fulfillment_status = awaiting_acceptance

13. Admin call:
    POST /api/v1/admin/orders/:id/accept

14. Continue:
    prepare → ready → complete

15. Assert:
    order_status_history created
    payment_status_history created
    audit_log created
```

Pass criteria:

```text
Order selesai tanpa status lompat dan tanpa duplicate payment.
```

---

## Technical Flow 2 — Outlet QR Mismatch

Tujuan:

```text
Memastikan customer tidak bisa mengganti outlet dari Outlet QR.
```

Steps:

```text
1. Scan Outlet QR Samarinda

2. Backend return:
   qr_scope = outlet
   locked_outlet_id = Samarinda

3. Kirim checkout dengan outlet_id = Tenggarong

4. Assert response:
   HTTP 409
   error.code = QR_OUTLET_MISMATCH

5. Assert database:
   no order created
   no payment created
```

Pass criteria:

```text
Manipulasi outlet dari frontend gagal total.
```

---

## Technical Flow 3 — Location QR Mismatch

Tujuan:

```text
Memastikan table/location QR tidak bisa dimanipulasi.
```

Steps:

```text
1. Scan QR Meja 07

2. Backend return:
   qr_scope = location
   locked_outlet_id = Samarinda
   locked_qr_location_id = Meja 07

3. Kirim checkout dengan:
   outlet_id = Samarinda
   qr_location_id = Meja 08

4. Assert:
   HTTP 409
   error.code = QR_LOCATION_MISMATCH

5. Assert:
   no order
   no payment
```

Pass criteria:

```text
Order table tidak bisa dipalsukan.
```

---

## Technical Flow 4 — Duplicate Checkout

Tujuan:

```text
Memastikan double click tidak membuat duplicate order.
```

Steps:

```text
1. Prepare valid checkout payload

2. Send POST /public/checkout dengan:
   Idempotency-Key: duplicate-test-001

3. Send lagi request yang sama dengan key sama

4. Assert:
   response kedua sama dengan response pertama

5. Assert database:
   order count = 1
   payment count = 1

6. Send request ketiga dengan key sama tapi payload beda

7. Assert:
   HTTP 409
   error.code = IDEMPOTENCY_CONFLICT
```

Pass criteria:

```text
Duplicate checkout dicegah.
```

---

## Technical Flow 5 — Webhook Duplicate

Tujuan:

```text
Memastikan webhook provider yang dikirim berkali-kali tetap aman.
```

Steps:

```text
1. Buat order + payment pending

2. Kirim webhook paid valid

3. Kirim webhook paid yang sama 3 kali

4. Assert:
   payment_status = paid

5. Assert:
   payment_status_history untuk paid hanya 1

6. Assert:
   audit payment.paid hanya 1

7. Assert:
   response duplicate tetap success / ignored safely
```

Pass criteria:

```text
Webhook idempotent dan tidak membuat history dobel.
```

---

## Technical Flow 6 — Admin Cannot Process Unpaid Order

Tujuan:

```text
Memastikan admin tidak bisa accept unpaid order.
```

Steps:

```text
1. Buat order dengan payment_status = pending

2. Login sebagai admin yang punya permission orders.accept

3. Call:
   POST /admin/orders/:id/accept

4. Assert:
   HTTP 409
   error.code = ORDER_INVALID_TRANSITION

5. Assert:
   fulfillment_status tidak berubah

6. Assert:
   audit/security event tercatat jika perlu
```

Pass criteria:

```text
Permission admin saja tidak cukup. Order harus paid.
```

---

## Technical Flow 7 — Payment Amount Mismatch

Tujuan:

```text
Memastikan payment mismatch tidak dianggap paid.
```

Steps:

```text
1. Buat payment pending amount = 42000

2. Kirim webhook paid amount = 40000

3. Assert:
   payment_status = manual_review

4. Assert:
   order public status tidak menjadi order_received

5. Assert:
   security_event created

6. Assert:
   audit_log created
```

Pass criteria:

```text
Amount mismatch masuk manual review, bukan paid.
```

---

# Flow Test Non-Teknis

Ini untuk owner, staff outlet, barista, cashier, admin operasional, atau tester umum.
Bahasanya harus seperti script manual, bukan API.

---

## Non-Technical Flow 1 — Customer Order via Universal QR

Role:

```text
Customer
```

Skenario:

```text
Customer scan QR dari Instagram / poster / website.
```

Langkah test:

```text
1. Buka kamera HP.

2. Scan Universal QR SELKOP.

3. Pastikan halaman SELKOP terbuka.

4. Pastikan customer diminta memilih outlet.

5. Pilih outlet:
   SELKOP Samarinda.

6. Pilih produk:
   Kopi Susu.

7. Pilih modifier:
   Less Sugar / Normal Ice.

8. Tambahkan ke cart.

9. Buka cart.

10. Pastikan total harga masuk akal.

11. Isi nama dan nomor WhatsApp.

12. Pilih metode bayar QRIS.

13. Klik Checkout.

14. Pastikan muncul halaman pembayaran.

15. Lakukan pembayaran sandbox / simulasi bayar.

16. Pastikan status berubah menjadi:
    Pesanan Diterima.

17. Tunggu admin outlet memproses order.

18. Pastikan status berubah:
    Dikonfirmasi → Sedang Dibuat → Siap → Selesai.
```

Expected result:

```text
Customer bisa order dari QR umum dan order masuk ke outlet yang dipilih.
```

---

## Non-Technical Flow 2 — Customer Order via Outlet QR

Role:

```text
Customer di outlet
```

Skenario:

```text
Customer scan QR yang ditempel di outlet SELKOP Samarinda.
```

Langkah test:

```text
1. Scan QR outlet SELKOP Samarinda.

2. Pastikan halaman menu terbuka.

3. Pastikan outlet sudah otomatis:
   SELKOP Samarinda.

4. Pastikan customer tidak diminta memilih outlet.

5. Pilih produk.

6. Checkout.

7. Bayar.

8. Pastikan order masuk ke admin outlet Samarinda.
```

Expected result:

```text
Customer tidak bisa memilih outlet lain.
```

Hal yang harus diperhatikan tester:

```text
Jika masih bisa ganti outlet, itu bug critical.
```

---

## Non-Technical Flow 3 — Customer Order via Table QR

Role:

```text
Customer dine-in
```

Skenario:

```text
Customer duduk di Meja 07 dan scan QR meja.
```

Langkah test:

```text
1. Duduk di Meja 07.

2. Scan QR di meja tersebut.

3. Pastikan halaman menampilkan:
   SELKOP Samarinda
   Meja 07

4. Pilih produk.

5. Checkout.

6. Bayar.

7. Pastikan admin melihat order dari:
   Meja 07.

8. Staff menyiapkan pesanan.

9. Pesanan diantar ke meja.

10. Admin menyelesaikan order.
```

Expected result:

```text
Order jelas berasal dari meja yang benar.
```

Hal yang harus diperhatikan tester:

```text
Jika order masuk tanpa nomor meja, itu bug major.
```

---

## Non-Technical Flow 4 — Admin Proses Paid Order

Role:

```text
Admin outlet / barista
```

Skenario:

```text
Order sudah dibayar customer.
```

Langkah test:

```text
1. Login ke admin dashboard.

2. Buka halaman Orders.

3. Cari order baru.

4. Pastikan payment badge:
   Paid.

5. Pastikan order status:
   Pesanan Diterima.

6. Klik Accept / Terima Pesanan.

7. Pastikan status berubah:
   Dikonfirmasi.

8. Klik Preparing / Sedang Dibuat.

9. Pastikan status berubah:
   Sedang Dibuat.

10. Klik Ready / Siap.

11. Pastikan status customer berubah:
    Pesanan Siap.

12. Klik Complete / Selesai.

13. Pastikan order masuk status:
    Completed.
```

Expected result:

```text
Admin bisa memproses order hanya jika sudah paid.
```

---

## Non-Technical Flow 5 — Admin Tidak Boleh Proses Unpaid Order

Role:

```text
Admin outlet
```

Skenario:

```text
Customer sudah checkout tapi belum bayar.
```

Langkah test:

```text
1. Login admin.

2. Buka order yang payment-nya masih Pending.

3. Coba cari tombol Accept.

4. Pastikan tombol Accept tidak muncul atau disabled.

5. Jika tombol tetap diklik, sistem harus menolak.

6. Pastikan muncul pesan:
   Pesanan belum dibayar.
```

Expected result:

```text
Admin tidak bisa memproses pesanan unpaid.
```

Bug severity:

```text
P0 / Blocker jika admin bisa complete unpaid order.
```

---

## Non-Technical Flow 6 — Produk Sold Out

Role:

```text
Admin outlet dan customer
```

Skenario:

```text
Produk Kopi Susu habis di outlet Samarinda.
```

Langkah test:

```text
1. Admin login.

2. Buka Product Availability.

3. Pilih outlet Samarinda.

4. Tandai Kopi Susu sebagai Sold Out.

5. Customer buka storefront Samarinda.

6. Pastikan Kopi Susu tidak bisa dibeli.

7. Customer coba checkout produk tersebut.

8. Pastikan checkout ditolak.

9. Admin aktifkan kembali produk.

10. Customer coba checkout lagi.

11. Pastikan produk bisa dibeli lagi.
```

Expected result:

```text
Sold out berlaku per outlet.
```

---

## Non-Technical Flow 7 — Payment Failed / Expired

Role:

```text
Customer
```

Skenario:

```text
Customer checkout tapi tidak menyelesaikan pembayaran.
```

Langkah test:

```text
1. Customer pilih produk.

2. Checkout.

3. Masuk halaman pembayaran.

4. Jangan bayar sampai waktu habis.

5. Pastikan status berubah:
   Pembayaran Kedaluwarsa.

6. Pastikan order tidak masuk antrian produksi.

7. Admin tidak bisa memproses order tersebut.
```

Expected result:

```text
Order expired tidak diproses outlet.
```

---

# Minimal Alpha Test Suite

Untuk alpha, minimal test ini harus lolos dulu.

| Area         | Test                             | Wajib Alpha |
| ------------ | -------------------------------- | ----------: |
| Storefront   | Menu public tampil               |           ✅ |
| Universal QR | Pilih outlet lalu checkout       |           ✅ |
| Outlet QR    | Outlet terkunci                  |           ✅ |
| Location QR  | Table/location terkunci          |           ✅ |
| Cart         | Harga dihitung backend           |           ✅ |
| Checkout     | Idempotency aktif                |           ✅ |
| Payment      | BayarGG sandbox payment          |           ✅ |
| Webhook      | Valid webhook update paid        |           ✅ |
| Webhook      | Invalid webhook ditolak          |           ✅ |
| Order        | Paid order bisa diproses         |           ✅ |
| Order        | Unpaid order tidak bisa diproses |           ✅ |
| Admin        | Allowed actions benar            |           ✅ |
| Security     | Public token aman                |           ✅ |
| Worker       | Payment expiry jalan             |           ✅ |
| Audit        | Order/payment/settings tercatat  |           ✅ |

---

# Bug Severity untuk Phase 3.8

Gunakan klasifikasi ini biar tim tidak bingung.

| Severity | Arti     | Contoh                           |
| -------- | -------- | -------------------------------- |
| P0       | Blocker  | Frontend bisa mark payment paid  |
| P1       | Critical | Duplicate order/payment          |
| P2       | Major    | QR outlet mismatch tidak dicegah |
| P3       | Medium   | Error message kurang jelas       |
| P4       | Minor    | Typo atau UI spacing             |

Rule:

```text
P0 dan P1 wajib selesai sebelum alpha.
P2 sebaiknya selesai sebelum alpha.
P3 dan P4 boleh masuk backlog jika tidak mengganggu flow utama.
```

---

# Go / No-Go Criteria

## Go Alpha ✅

Alpha boleh jalan kalau:

```text
☐ Universal QR berhasil end-to-end

☐ Outlet QR berhasil end-to-end

☐ Location QR berhasil end-to-end

☐ Checkout tidak duplicate

☐ Payment BayarGG sandbox berhasil

☐ Webhook valid bekerja

☐ Webhook invalid ditolak

☐ Admin tidak bisa proses unpaid order

☐ Order lifecycle aman

☐ Audit log tercatat

☐ Public order status aman

☐ Product availability jalan

☐ Worker expiry jalan

☐ Error response standar
```

## No-Go ❌

Alpha jangan jalan kalau masih ada:

```text
☐ Payment bisa dipalsukan dari frontend

☐ Admin bisa complete unpaid order

☐ Duplicate checkout masih terjadi

☐ QR outlet mismatch tidak dicegah

☐ Webhook invalid bisa update payment

☐ Amount mismatch dianggap paid

☐ Public order token mudah ditebak

☐ Tidak ada audit log untuk order/payment
```

---

# Format Laporan Test Manual

Untuk tester non-teknis, pakai format sederhana:

```text
Test Case:
Universal QR Checkout

Tester:
Nama tester

Device:
iPhone / Android / Laptop

Tanggal:
...

Step:
1. Scan QR
2. Pilih outlet
3. Pilih produk
4. Checkout
5. Bayar

Expected Result:
Order berhasil dan masuk ke outlet yang dipilih.

Actual Result:
...

Status:
Pass / Fail

Screenshot:
...

Order Number:
...

Catatan:
...
```

---

Menurutku untuk Phase 3.8, fokus paling penting adalah **menguji 5 flow end-to-end** ini dulu:

```text
1. Universal QR → Checkout → Payment → Admin Complete

2. Outlet QR → Checkout → Payment → Admin Complete

3. Location QR → Checkout → Payment → Admin Complete

4. Payment Failed / Expired → Admin tidak bisa proses

5. Duplicate Checkout / Duplicate Webhook → Tidak membuat data dobel
```

Kalau 5 flow ini sudah lolos, fondasi alpha testing SELKOP sudah jauh lebih aman 🚀
