Phase 1 — Finalisasi Online/QR Order Lifecycle

Tujuannya: sebelum desain backend, database, dan security, kita harus kunci dulu alur status order supaya nanti database dan API tidak rancu.

Masalah utama yang harus kita hindari:

Paid ≠ Completed
Payment status ≠ Order fulfillment status
QR session ≠ Outlet biasa
Checkout total dari frontend ≠ total final
1. Core Flow Online / QR Store

Untuk customer, flow idealnya seperti ini:

Scan QR / Open Online Store
        ↓
Choose Outlet / QR locks Outlet
        ↓
Browse Menu
        ↓
Add Product to Cart
        ↓
Validate Cart
        ↓
Checkout
        ↓
Create Order + Payment
        ↓
Payment Pending
        ↓
Payment Paid
        ↓
Order Accepted by Staff
        ↓
Preparing
        ↓
Ready
        ↓
Completed

Untuk kasus gagal:

Payment Failed
Payment Expired
Order Cancelled
Product Unavailable
Outlet Closed
QR Invalid / Expired
2. Pisahkan 3 Status Besar

Menurutku sistem kamu harus punya 3 layer status, bukan cuma satu status.

A. payment_status

Ini khusus pembayaran.

type PaymentStatus =
  | "unpaid"
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "expired"
  | "refunded"
  | "cancelled";
B. fulfillment_status

Ini khusus operasional order di outlet.

type FulfillmentStatus =
  | "not_started"
  | "awaiting_acceptance"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";
C. order_status

Ini status gabungan untuk display customer.

type PublicOrderStatus =
  | "payment_pending"
  | "payment_failed"
  | "payment_expired"
  | "order_received"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

Kenapa perlu 3 layer?

Karena admin butuh data detail, sedangkan customer butuh bahasa yang mudah dipahami.

Contoh:

payment_status: paid
fulfillment_status: preparing
public_order_status: preparing

Atau:

payment_status: pending
fulfillment_status: not_started
public_order_status: payment_pending
3. State Transition Rules

Ini aturan penting sebelum alpha.

Payment Transition
unpaid
  ↓
pending
  ↓
processing
  ↓
paid

Atau gagal:

pending → failed
pending → expired
paid → refunded

Aturan penting:

Rule	Wajib
Frontend tidak boleh mengubah payment jadi paid	✅
paid hanya dari backend/payment webhook	✅
Timer frontend hanya visual, bukan sumber kebenaran	✅
Expired harus berdasarkan payment.expires_at dari backend	✅
Fulfillment Transition
not_started
  ↓
awaiting_acceptance
  ↓
accepted
  ↓
preparing
  ↓
ready
  ↓
completed

Cancel bisa terjadi di beberapa titik:

awaiting_acceptance → cancelled
accepted → cancelled
preparing → cancelled

Tapi harus pakai:

reason
actor_id
actor_role
audit_log
4. Guard Rule Paling Penting

Ini wajib dikunci di backend dan UI.

Order tidak boleh masuk preparing kalau payment_status belum paid.

Contoh rule:

function canStartPreparing(order) {
  return (
    order.payment_status === "paid" &&
    ["accepted", "awaiting_acceptance"].includes(order.fulfillment_status)
  );
}

Untuk UI admin:

Payment	Fulfillment	Action
pending	not_started	Disable prepare
pending	awaiting_acceptance	Disable accept/preparing
paid	awaiting_acceptance	Allow accept
paid	accepted	Allow preparing
paid	preparing	Allow ready
paid	ready	Allow completed
failed	any	Disable fulfillment
expired	any	Disable fulfillment
refunded	any	Disable fulfillment
5. Online vs QR Store Difference
Online Store

Customer bisa pilih outlet:

User buka /store/selkop
Pilih outlet
Tambah cart
Checkout
QR Store

Outlet harus dikunci dari QR:

User scan /qr/:qrToken
Backend validate QR
QR menentukan outlet/table/location
User tidak boleh sembarang ganti outlet

Untuk QR, context minimal:

type QRContext = {
  qr_token: string;
  outlet_id: string;
  outlet_name: string;
  table_id?: string;
  table_label?: string;
  location_label?: string;
  fulfillment_type: "dine_in" | "takeaway" | "pickup";
  expires_at?: string;
  is_active: boolean;
};

UI QR harus menampilkan:

SELKOP Samarinda
Meja 07
Dine-in Order

atau:

SELKOP Tenggarong
Pickup Counter
Takeaway Order
6. Recommended Order Model v1

Untuk backend/database nanti, order minimal harus punya ini:

type Order = {
  id: string;
  public_order_token: string;

  channel: "online_store" | "qr_store";
  outlet_id: string;

  qr_session_id?: string;
  table_id?: string;
  qr_location_label?: string;

  customer_id?: string;
  customer_name: string;
  customer_phone: string;

  fulfillment_type: "pickup" | "dine_in" | "takeaway";

  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;

  subtotal_amount: number;
  discount_amount: number;
  service_fee_amount: number;
  tax_amount: number;
  total_amount: number;

  customer_note?: string;
  internal_note?: string;

  created_at: string;
  updated_at: string;
};
7. Customer UI Copy by Status

Supaya tidak misleading seperti audit tadi, copy harus berubah berdasarkan status.

Public Status	Title	Subtitle
payment_pending	Menunggu Pembayaran	Selesaikan pembayaran agar pesanan dapat diproses.
payment_failed	Pembayaran Gagal	Pembayaran belum berhasil. Silakan coba lagi.
payment_expired	Pembayaran Kedaluwarsa	Waktu pembayaran sudah habis. Buat pesanan baru.
order_received	Pesanan Diterima	Pembayaran berhasil dan pesanan kamu sudah masuk ke outlet.
accepted	Pesanan Dikonfirmasi	Tim SELKOP sudah menerima pesanan kamu.
preparing	Pesanan Sedang Dibuat	Barista sedang menyiapkan pesanan kamu.
ready	Pesanan Siap Diambil	Pesanan kamu sudah siap.
completed	Pesanan Selesai	Terima kasih sudah pesan di SELKOP.
cancelled	Pesanan Dibatalkan	Pesanan ini dibatalkan. Hubungi staff jika perlu bantuan.
8. Admin UI Status Display

Di admin order list, jangan cuma tampilkan Paid/Unpaid.

Minimal tampilkan 2 badge:

Payment: Paid / Pending / Failed / Expired / Refunded
Order: Awaiting / Accepted / Preparing / Ready / Completed / Cancelled

Contoh row:

#ORD-1021
QR Store · SELKOP Samarinda · Meja 07

Payment: Paid
Order: Preparing

Total: Rp42.000
Customer: Rido
9. Alpha Testing Minimum Lifecycle

Sebelum alpha, minimal flow ini harus bisa dites:

Customer
1. Scan QR
2. QR membuka outlet yang benar
3. Pilih produk
4. Add to cart
5. Checkout
6. Payment pending
7. Payment paid via sandbox/webhook
8. Order status berubah
9. Pesanan preparing
10. Pesanan ready
11. Pesanan completed
Staff/Admin
1. Lihat order baru
2. Pastikan payment paid
3. Accept order
4. Mark preparing
5. Mark ready
6. Mark completed
7. Cancel order dengan reason
10. Keputusan yang perlu kamu approve

Sebelum lanjut ke backend API contract, menurutku kita kunci keputusan ini dulu:

Decision	Rekomendasi
Order channel	online_store, qr_store
Payment source of truth	Backend + payment webhook
Fulfillment boleh jalan kalau unpaid?	Tidak boleh
QR outlet bisa diganti customer?	Tidak untuk QR locked session
Public order status pakai token?	Ya, pakai public_order_token
Delete order di admin?	Tidak, ganti cancel + reason
Status history wajib?	Ya
Audit log wajib?	Ya
Checkout total dihitung frontend?	Hanya preview
Checkout total final	Backend
Rekomendasi finalku untuk Phase 1

Pakai struktur ini:

payment_status
fulfillment_status
public_order_status

Jangan cuma satu order.status, karena nanti akan kacau antara payment, produksi, dan tampilan customer.