**SUMMARY**

| No. | Checklist | Spec                                      |
| --: | --------- | ----------------------------------------- |
|   1 | TRUE-A           | `selaluteh-workspace-access-control`      |
|   2 | TRUE-A    | `selaluteh-outlet-management-operations`  |
|   3 | TRUE-A           | `selaluteh-product-catalog`               |
|   4 | TRUE-A    | `selaluteh-cart-order-lifecycle`          |
|   5 | TRUE-A           | `selaluteh-payments-xendit`               |
|   6 | TRUE-A           | `selaluteh-channel-connections-sync`      |
|   7 | TRUE      | `selaluteh-ai-agent-architecture`         |
|   8 | TRUE      | `selaluteh-ai-agent-scope-security`       |
|   9 | TRUE-A           | `selaluteh-crm-inbox-contacts`            |
|  10 | TRUE      | `selaluteh-location-intelligence`         |
|  11 | TRUE-A           | `selaluteh-inventory-stock-ledger`        |
|  12 |           | `selaluteh-admin-data-operations`         |
|  13 |           | `selaluteh-audit-activity-timeline`       |
|  14 |           | `selaluteh-analytics-read-models`         |
|  15 |           | `selaluteh-notification-attention-engine` |
|  16 |           | `selaluteh-complaints-tickets`            |
|  17 |           | `selaluteh-media-assets`                  |
|  18 | TRUE      | `selaluteh-backend-marketplace`           |
|  19 |           | `selaluteh-alpha-ordering-payment-pilot`  |

Iya, untuk target **alpha testing** yang kamu sebutkan, kamu **tidak perlu menyelesaikan seluruh spec**. Fokuskan hanya pada jalur inti berikut:

```text
Customer chat melalui WhatsApp/Telegram
→ pilih outlet
→ pilih produk
→ konfirmasi cart
→ order dibuat
→ Xendit payment link dikirim
→ pembayaran terverifikasi
→ order masuk ke outlet yang dipilih
→ outlet approve dan memproses order
→ customer menerima update
```

# Spec yang wajib diselesaikan untuk Alpha

## 1. `selaluteh-workspace-access-control`

**Wajib**, tetapi cukup MVP slice.

Fungsinya agar:

```text
Owner
→ dapat melihat semua outlet

Outlet Manager Samarinda
→ hanya melihat order Samarinda

Outlet Staff Tenggarong
→ hanya melihat order Tenggarong
```

Yang harus selesai:

- workspace dan membership;
    
- role:
    
    - owner;
        
    - admin;
        
    - outlet manager;
        
    - outlet staff;
        
- user dapat ditautkan ke satu atau beberapa outlet;
    
- outlet-level visibility;
    
- permission melihat dan mengubah order;
    
- cross-workspace isolation;
    
- Supabase RLS atau backend authorization yang setara.
    

Yang belum perlu:

- custom role builder;
    
- permission sangat granular;
    
- invitation workflow lengkap;
    
- approval berlapis;
    
- advanced staff analytics.
    

### Mengapa penting?

Tanpa spec ini, backend belum dapat menjamin:

> “Outlet A hanya bisa melihat pesanan Outlet A.”

---

## 2. `selaluteh-outlet-management-operations`

**Wajib**, tetapi hanya bagian dasar outlet.

Yang harus selesai:

- membuat dan membaca outlet;
    
- outlet memiliki `workspace_id`;
    
- outlet status:
    
    - `ACTIVE`;
        
    - `PAUSED`;
        
    - `COMING_SOON`;
        
    - `ARCHIVED`;
        
- `accepts_orders`;
    
- pickup enabled;
    
- jam operasional dasar;
    
- outlet manager assignment;
    
- channel availability:
    
    - WhatsApp enabled;
        
    - Telegram enabled;
        
- outlet tidak aktif tidak dapat menerima order;
    
- outlet dapat dilihat oleh chatbot saat customer memilih outlet.
    

Yang belum perlu:

- duplicate outlet;
    
- advanced outlet analytics;
    
- recent activity UI lengkap;
    
- special holiday hours kompleks;
    
- outlet health engine lengkap;
    
- bulk pause/archive;
    
- advanced export.
    

---

## 3. `selaluteh-product-catalog`

**Wajib**, karena chatbot membutuhkan menu resmi.

Yang harus selesai:

- product;
    
- nama;
    
- SKU;
    
- description;
    
- category;
    
- base price;
    
- status aktif/nonaktif;
    
- assignment produk ke outlet;
    
- availability produk per outlet;
    
- harga per outlet jika berbeda;
    
- API/tool untuk:
    
    - list products;
        
    - search products;
        
    - get product detail;
        
    - check outlet availability.
        

Struktur minimal:

```text
Product
→ Teh Tarik Vanilla

Product Outlet
→ tersedia di Samarinda
→ tidak tersedia di Tenggarong
→ harga Samarinda Rp18.000
```

Yang dapat ditunda:

- inventory ledger;
    
- low-stock calculation;
    
- product sales analytics;
    
- bulk action;
    
- import/export;
    
- product activity timeline;
    
- cost dan profit;
    
- banyak gambar;
    
- advanced tag management.
    

Untuk alpha, stok dapat dibuat sederhana:

```text
is_available = true | false
```

Belum perlu menghitung jumlah cup secara transaksional.

---

## 4. `selaluteh-cart-order-lifecycle`

Ini adalah **spec paling penting** untuk target alpha-mu.

Yang harus benar-benar selesai:

### Cart

- satu active cart per customer;
    
- cart terikat ke outlet;
    
- tambah produk;
    
- ubah quantity;
    
- hapus produk;
    
- clear cart;
    
- cart total;
    
- customer confirmation;
    
- pindah outlet harus menangani cart lama;
    
- price snapshot.
    

### Order

- order dibuat setelah customer konfirmasi;
    
- setiap order wajib memiliki:
    
    - `workspace_id`;
        
    - `outlet_id`;
        
    - `customer_id`;
        
    - `channel`;
        
    - item snapshot;
        
    - price snapshot;
        
    - total;
        
    - status;
        
- nomor order unik;
    
- idempotency agar order tidak terbuat dua kali;
    
- order masuk ke outlet yang dipilih;
    
- order list dapat difilter berdasarkan outlet;
    
- outlet dapat membuka detail order;
    
- customer dapat mengecek status.
    

### Lifecycle minimum

Aku sarankan:

```text
DRAFT_CART
→ AWAITING_CUSTOMER_CONFIRMATION
→ PENDING_PAYMENT
→ PAID
→ AWAITING_OUTLET_APPROVAL
→ APPROVED
→ PREPARING
→ READY_FOR_PICKUP
→ COMPLETED
```

Jalur gagal:

```text
PENDING_PAYMENT
→ PAYMENT_EXPIRED

AWAITING_OUTLET_APPROVAL
→ REJECTED

APPROVED / PREPARING
→ CANCELLED
```

Untuk alpha, status bisa sedikit disederhanakan:

```text
PENDING_PAYMENT
PAID
NEW
APPROVED
PREPARING
READY
COMPLETED
REJECTED
CANCELLED
```

---

## 5. `selaluteh-payments-xendit`

**Wajib** karena targetmu mencakup pengiriman payment link dan verifikasi pembayaran.

Yang harus selesai:

- Xendit Test Mode configuration;
    
- create payment link;
    
- `external_id` unik;
    
- payment amount berasal dari backend order;
    
- payment expiration;
    
- simpan payment record;
    
- kirim link ke chatbot;
    
- webhook endpoint;
    
- webhook verification;
    
- webhook idempotency;
    
- duplicate webhook handling;
    
- payment event history minimal;
    
- update payment menjadi `PAID`;
    
- update order setelah payment terverifikasi;
    
- resend link;
    
- expired payment handling.
    

Flow:

```text
Order dibuat
→ backend create Xendit payment link
→ link dikirim ke customer
→ customer membayar
→ Xendit webhook masuk
→ backend memverifikasi webhook
→ payment = PAID
→ order = PAID / NEW
→ outlet melihat order baru
```

Batas keras:

```text
AI tidak boleh menandai payment sebagai PAID
Outlet tidak boleh menandai payment sebagai PAID
Frontend tidak boleh menandai payment sebagai PAID
```

Hanya:

```text
Xendit webhook
→ backend
```

---

## 6. `selaluteh-channel-connections-sync`

Untuk alpha, **tidak perlu menyelesaikan seluruh spec ini**.

Cukup selesaikan MVP slice:

- Telegram connection;
    
- WhatsApp connection;
    
- inbound message webhook;
    
- outbound reply;
    
- message deduplication;
    
- connection status;
    
- channel enabled untuk outlet;
    
- customer dapat memilih outlet;
    
- order menyimpan asal channel;
    
- kirim payment link;
    
- kirim order-status update.
    

Yang belum perlu:

- Instagram;
    
- Tokopedia;
    
- Shopee;
    
- Website connector;
    
- sync menu eksternal;
    
- sync order eksternal;
    
- reauthorization dashboard lengkap;
    
- advanced webhook activity UI;
    
- multi-provider marketplace connector.
    

Untuk popup outlet tadi, alpha cukup:

```text
WhatsApp
- Enabled for outlet
- Accept chat
- Accept order
- Health

Telegram
- Enabled for outlet
- Accept chat
- Accept order
- Health
```

---

## 7. `selaluteh-ai-agent-architecture`

Tidak harus seluruh spec selesai, tetapi **commerce runtime minimum wajib**.

Yang harus selesai:

- conversation context;
    
- AI tidak memperkenalkan diri berulang kali;
    
- intent routing;
    
- product tool;
    
- outlet tool;
    
- cart tool;
    
- order tool;
    
- payment-link tool;
    
- payment-status tool;
    
- order-status tool;
    
- Tool Gateway;
    
- structured tool result;
    
- workspace/outlet context;
    
- customer confirmation sebelum order;
    
- AI hanya membaca payment status;
    
- error fallback.
    

Tools minimum:

```text
list_outlets
list_products
get_product
get_cart
add_cart_item
update_cart_item
remove_cart_item
confirm_cart
create_order
create_payment_link
get_payment_status
get_order_status
```

Yang dapat ditunda:

- specialist agents;
    
- complex long-term memory;
    
- advanced RAG evaluation;
    
- agent marketplace;
    
- multiple LLM provider routing;
    
- sophisticated autonomous planning;
    
- complaint specialist;
    
- advanced personalization.
    

---

## 8. `selaluteh-ai-agent-scope-security`

Untuk alpha, selesaikan **minimum security guard**, jangan ditunda seluruhnya.

Yang wajib:

```text
input safety
→ business-domain classifier
→ allow / clarify / deny
→ tool permission
```

Minimal decision:

```text
ALLOW_BUSINESS
CLARIFY
DENY_OFF_TOPIC
DENY_UNSAFE
```

Wajib memastikan:

- coding request ditolak;
    
- general knowledge ditolak;
    
- prompt injection ditolak;
    
- payment manipulation ditolak;
    
- cross-workspace request ditolak;
    
- off-topic tidak memanggil tools;
    
- AI tidak dapat membuat harga;
    
- AI tidak dapat mengubah payment;
    
- AI tidak dapat memilih outlet tanpa customer.
    

Yang bisa ditunda:

- cooldown sangat kompleks;
    
- banyak profile security;
    
- advanced cost dashboard;
    
- ratusan evaluation scenario;
    
- full adversarial framework.
    

---

## 9. `selaluteh-crm-inbox-contacts`

Untuk alpha, cukup **conversation persistence minimum**.

Yang harus tersedia:

- contact;
    
- channel identity;
    
- conversation;
    
- incoming message;
    
- outgoing message;
    
- chat history;
    
- customer identity untuk Telegram/WhatsApp;
    
- order dapat ditautkan ke customer/conversation.
    

Yang belum perlu:

- contact owner;
    
- advanced assignment;
    
- contact segmentation;
    
- CRM tags lengkap;
    
- total lifetime value;
    
- customer merge UI;
    
- SLA;
    
- advanced inbox queue;
    
- detailed internal notes.
    

Jika backend legacy-mu sudah mempunyai contacts, chats, dan messages, jangan tulis ulang. Cukup modernisasi dan integrasikan dengan Supabase.

---

# Spec yang Belum Perlu Diselesaikan untuk Alpha

## `selaluteh-location-intelligence`

**Bisa ditunda.**

Untuk alpha, customer cukup memilih outlet dari daftar:

```text
Mau pesan dari outlet mana?

1. Samarinda Central
2. Tenggarong Riverside
3. Bontang Point
```

Belum perlu:

- pencarian Jalan Biawan;
    
- Google Maps geocoding;
    
- Haversine;
    
- outlet terdekat;
    
- directions;
    
- service radius.
    

Location Intelligence dapat masuk setelah alur order dan payment stabil.

---

## `selaluteh-inventory-stock-ledger`

**Bisa ditunda**, gunakan availability sederhana:

```text
product_outlet.is_available
```

Belum perlu:

- on-hand;
    
- reserved;
    
- stock movement;
    
- stock adjustment ledger;
    
- transfer;
    
- waste;
    
- low-stock threshold.
    

Namun jangan menampilkan UI stok akurat jika backend belum memilikinya.

---

## `selaluteh-admin-data-operations`

Tunda:

- advanced export;
    
- import;
    
- saved filters;
    
- bulk actions;
    
- asynchronous jobs;
    
- PDF export.
    

Filter dan pagination dasar dapat dibuat langsung di domain endpoint untuk alpha.

---

## `selaluteh-audit-activity-timeline`

Belum perlu membuat sistem audit generik.

Cukup simpan event penting di domain:

```text
order_events
payment_events
webhook_events
```

---

## `selaluteh-analytics-read-models`

Tunda:

- revenue charts;
    
- product performance;
    
- outlet comparison;
    
- average prep analytics;
    
- trend cards.
    

Untuk alpha, dashboard boleh menampilkan data sederhana atau disembunyikan.

---

## `selaluteh-notification-attention-engine`

Tunda alert engine lengkap.

Cukup kirim:

- order baru ke outlet;
    
- payment berhasil;
    
- order approved;
    
- order ready.
    

---

## `selaluteh-complaints-tickets`

Tunda untuk alpha ordering, kecuali complaint memang mau dites.

---

## `selaluteh-media-assets`

Gunakan image URL atau placeholder terlebih dahulu.

---

# Paket Spec Alpha yang Sebenarnya

Daripada mengaktifkan 14 spec sekaligus, kelompokkan menjadi lima jalur:

|Jalur|Spec yang terlibat|Hasil|
|---|---|---|
|**Foundation**|Backend Marketplace + Workspace Access + Outlet Management|Outlet dan user terisolasi|
|**Catalog**|Product Catalog|Chatbot mempunyai menu|
|**Commerce**|Cart & Order Lifecycle|Customer dapat membuat order|
|**Payment**|Payments Xendit|Link dikirim dan pembayaran diverifikasi|
|**Chat Runtime**|Channel Connections + AI Architecture + Scope Security + CRM minimum|Order dapat dibuat dari WA/Telegram|

# Urutan Implementasi

## Tahap 1 — Outlet dan Akses

Selesaikan:

```text
workspace
users
memberships
outlets
user-outlet access
outlet active/paused
outlet accepts orders
```

Hasil:

```text
Outlet Samarinda login
→ hanya melihat data Samarinda
```

---

## Tahap 2 — Produk per Outlet

Selesaikan:

```text
products
product_outlets
price
availability
product tools
```

Hasil:

```text
Chatbot dapat menunjukkan menu Outlet Samarinda
```

---

## Tahap 3 — Cart dan Order

Selesaikan:

```text
cart
cart items
confirmation
order
order items
outlet routing
order statuses
order list per outlet
```

Hasil:

```text
Customer membuat order
→ order masuk ke outlet yang benar
```

---

## Tahap 4 — Xendit

Selesaikan:

```text
payment creation
payment link
payment record
webhook
payment status
order-payment transition
```

Hasil:

```text
Customer mendapatkan link
→ membayar
→ payment otomatis menjadi PAID
```

---

## Tahap 5 — Outlet Approval

Selesaikan:

```text
outlet sees new order
→ approve/reject
→ preparing
→ ready
→ completed
```

Hasil:

```text
Customer dapat melihat status terbaru
```

---

## Tahap 6 — Telegram dan WhatsApp E2E

Jalankan flow yang sama di kedua channel:

```text
chat
→ outlet
→ product
→ cart
→ confirmation
→ order
→ Xendit link
→ paid
→ outlet approval
→ ready
→ completed
```

# Bedakan “Payment Approved” dan “Order Approved”

Ini penting supaya backend-mu tidak membingungkan dua hal.

## Pembayaran terverifikasi

```text
payment.status = PAID
```

Authority:

```text
Xendit webhook
```

## Order diterima outlet

```text
order.status = APPROVED
```

Authority:

```text
outlet manager/staff
```

Jadi flow-nya:

```text
Xendit confirms payment
→ Payment PAID
→ Order AWAITING_OUTLET_APPROVAL

Outlet accepts
→ Order APPROVED
→ PREPARING
```

Jangan menggunakan satu field `approved` untuk keduanya.

# Minimum Data yang Dibutuhkan

```text
workspaces
users
memberships
membership_outlets

outlets
outlet_channel_assignments

products
product_outlets

contacts
conversations
messages

carts
cart_items

orders
order_items
order_events

payments
payment_events
webhook_events
```

# Alpha Dianggap Selesai Jika

-  Customer dapat memulai chat dari Telegram.
    
-  Customer dapat memulai chat dari WhatsApp.
    
-  Customer dapat memilih outlet aktif.
    
-  Chatbot menampilkan produk outlet tersebut.
    
-  Customer dapat menambah dan mengubah cart.
    
-  Customer mengonfirmasi cart.
    
-  Order dibuat tepat satu kali.
    
-  Order memiliki `workspace_id` dan `outlet_id`.
    
-  Backend membuat Xendit payment link.
    
-  Chatbot mengirim link kepada customer.
    
-  Webhook Xendit diverifikasi.
    
-  Duplicate webhook tidak menggandakan update.
    
-  Payment berubah menjadi `PAID`.
    
-  Outlet yang dipilih melihat order masuk.
    
-  Outlet lain tidak dapat melihat order tersebut.
    
-  Outlet dapat approve atau reject.
    
-  Outlet dapat mengubah status ke preparing.
    
-  Outlet dapat menandai ready for pickup.
    
-  Customer dapat mengecek status.
    
-  Outlet dapat menandai completed.
    
-  AI tidak dapat memalsukan status payment.
    
-  Retry atau duplicate message tidak membuat dua order.
    
-  Seluruh flow lulus E2E test.
    

# Rekomendasi Status Spec Sekarang

## Jadikan `active`

```text
selaluteh-workspace-access-control
selaluteh-outlet-management-operations
selaluteh-product-catalog
selaluteh-cart-order-lifecycle
selaluteh-payments-xendit
```

Tetap aktifkan dan selesaikan MVP slice dari:

```text
selaluteh-backend-marketplace
selaluteh-ai-agent-architecture
selaluteh-ai-agent-scope-security
selaluteh-channel-connections-sync
selaluteh-crm-inbox-contacts
```

## Letakkan di `backlog`

```text
selaluteh-location-intelligence
selaluteh-inventory-stock-ledger
selaluteh-admin-data-operations
selaluteh-audit-activity-timeline
selaluteh-analytics-read-models
selaluteh-notification-attention-engine
selaluteh-complaints-tickets
selaluteh-media-assets
```

# Saran Terpenting

Buat satu **integration/release spec tipis**:

```text
selaluteh-alpha-ordering-payment-pilot
```

Spec ini tidak menduplikasi domain lain. Isinya hanya:

```text
target alpha
dependency spec
urutan integrasi
end-to-end flow
test scenario
release checklist
known limitations
```

Kemudian coding agent diarahkan ke:

```text
selaluteh-alpha-ordering-payment-pilot
```

Dari sana agent membaca dan mengeksekusi MVP slice dari spec domain terkait.

Jadi, target alpha-mu bukan menyelesaikan semua fitur marketplace. Targetnya adalah membuktikan satu **vertical slice** bekerja sempurna:

```text
WhatsApp/Telegram
→ chatbot
→ outlet
→ product
→ cart
→ order
→ Xendit
→ paid
→ outlet approve
→ pickup
```

Itulah fondasi MVP yang paling tepat untuk diuji lebih dulu. 🚀