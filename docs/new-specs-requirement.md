**SUMMARY**

| No. | Checklist | Spec                                      |
| --: | --------- | ----------------------------------------- |
|   1 |           | `selaluteh-backend-marketplace`           |
|   2 | TRUE      | `selaluteh-ai-agent-architecture`         |
|   3 | TRUE      | `selaluteh-ai-agent-scope-security`       |
|   4 | TRUE      | `selaluteh-location-intelligence`         |
|   5 |           | `selaluteh-workspace-access-control`      |
|   6 |           | `selaluteh-outlet-management-operations`  |
|   7 |           | `selaluteh-channel-connections-sync`      |
|   8 |           | `selaluteh-product-catalog`               |
|   9 |           | `selaluteh-inventory-stock-ledger`        |
|  10 |           | `selaluteh-cart-order-lifecycle`          |
|  11 |           | `selaluteh-payments-xendit`               |
|  12 |           | `selaluteh-crm-inbox-contacts`            |
|  13 |           | `selaluteh-complaints-tickets`            |
|  14 |           | `selaluteh-admin-data-operations`         |
|  15 |           | `selaluteh-audit-activity-timeline`       |
|  16 |           | `selaluteh-analytics-read-models`         |
|  17 |           | `selaluteh-notification-attention-engine` |
|  18 |           | `selaluteh-media-assets`                  |
|     |           |                                           |
Iya, **ada beberapa spec baru yang memang perlu dibuat**. Dari UI/UX terbaru, terlihat bahwa backend-mu membutuhkan lebih banyak kemampuan daripada sekadar CRUD dasar.

Namun, **tidak setiap popup atau state UI perlu menjadi spec sendiri**. Yang perlu dibuat spec adalah fungsi yang:

- menyimpan atau mengubah data;
    
- menjalankan proses backend;
    
- membutuhkan permission;
    
- mempunyai aturan bisnis;
    
- membutuhkan audit, idempotency, atau concurrency;
    
- dipakai ulang oleh banyak halaman.
    

Beberapa attachment lama sudah tidak bisa kubuka langsung karena kedaluwarsa, tetapi keputusan dan struktur utamanya masih tersimpan dalam konteks proyek. Untuk audit isi dokumen baris per baris nanti, file lamanya perlu di-upload ulang.

# Spec yang sudah kita miliki

Secara garis besar, kita sudah merancang:

```text
selaluteh-backend-marketplace
selaluteh-ai-agent-architecture
selaluteh-ai-agent-scope-security
selaluteh-location-intelligence
```

Pembagian authority-nya:

|Spec|Tanggung jawab|
|---|---|
|Backend Marketplace|Fondasi workspace, outlet, commerce, dan domain backend|
|AI Agent Architecture|Runtime AI, memory, tools, conversation, handoff|
|AI Scope Security|Membatasi domain chatbot dan tool access|
|Location Intelligence|Lokasi customer, Google Maps, dan outlet terdekat|

Masalahnya, beberapa domain di dalam backend marketplace masih baru berupa **boundary atau rancangan global**, belum menjadi implementable domain spec yang lengkap.

# Spec baru yang wajib dibuat

## 1. `selaluteh-workspace-access-control`

Ini dibutuhkan karena aplikasi akhirnya akan menjadi:

```text
multi-account
→ multi-workspace
→ multi-outlet
→ multi-member
```

Spec ini mengatur:

- workspace;
    
- memberships;
    
- roles;
    
- permissions;
    
- super admin, owner, manager, CS, outlet staff;
    
- outlet visibility;
    
- siapa boleh melihat outlet tertentu;
    
- siapa boleh mengubah produk;
    
- siapa boleh pause outlet;
    
- siapa boleh export data;
    
- siapa boleh mengelola channel;
    
- siapa boleh mengakses payment;
    
- siapa boleh melakukan bulk action;
    
- invitation member;
    
- staff assignment;
    
- cross-workspace isolation.
    

UI yang membutuhkannya:

```text
Assign Manager
Edit Outlet
Manage Channels
Pause Outlet
Delete Outlet
Export
Bulk Actions
Contact Owner
Assigned To
```

Tanpa spec ini, backend mungkin hanya mengecek apakah user sudah login, tetapi belum mempunyai aturan permission yang konsisten.

---

## 2. `selaluteh-outlet-management-operations`

Ini adalah spec baru paling penting setelah desain **Outlets Page**.

Jangan digabung dengan Location Intelligence. Pembagiannya:

```text
Location Intelligence
→ resolve Maps URL
→ koordinat
→ nearest outlet
→ lokasi terverifikasi

Outlet Management
→ data dan operasi bisnis outlet
```

Spec ini harus mencakup:

### Outlet lifecycle

```text
Draft
Coming Soon
Active
Paused
Needs Attention
Archived
```

### Outlet operations

- membuat outlet;
    
- mengedit outlet;
    
- mengarsipkan outlet;
    
- pause/reactivate;
    
- duplicate outlet;
    
- assign manager;
    
- outlet code;
    
- region dan city;
    
- service settings;
    
- pickup availability;
    
- preparation time;
    
- internal notes;
    
- operating hours;
    
- special hours;
    
- holiday closure;
    
- outlet tags;
    
- channel summary;
    
- outlet health;
    
- last sync;
    
- outlet metrics summary.
    

### Aturan penting

```text
Coming Soon
→ belum menerima order

Paused
→ tidak menerima order baru

Needs Attention
→ bukan selalu lifecycle state
→ bisa berupa operational health state

Archived
→ tidak muncul di customer flow
```

`Needs Attention` sebaiknya dipisahkan dari status utama:

```text
operational_status:
ACTIVE | PAUSED | COMING_SOON | ARCHIVED

health_status:
HEALTHY | NEEDS_ATTENTION | OFFLINE
```

Ini menghindari backend mencampur status operasional dengan kondisi error.

---

## 3. `selaluteh-channel-connections-sync`

Desain popup **Manage Connected Channels** memperlihatkan bahwa fungsi ini sudah cukup besar untuk menjadi domain spec sendiri.

Mencakup:

- WhatsApp connection;
    
- Telegram connection;
    
- Website ordering;
    
- Instagram;
    
- connector status;
    
- credential reference;
    
- connect;
    
- disconnect;
    
- reconnect;
    
- reauthorization;
    
- test connection;
    
- webhook health;
    
- last sync;
    
- sync menu;
    
- sync orders;
    
- retry sync;
    
- failed webhook;
    
- integration activity log;
    
- per-outlet channel assignment;
    
- connector configuration;
    
- encrypted secret storage.
    

Status connector:

```text
NOT_CONNECTED
PENDING_SETUP
CONNECTED
NEEDS_REAUTHORIZATION
DEGRADED
DISCONNECTED
ERROR
```

Pisahkan juga:

```text
connection_status
health_status
sync_status
```

Karena sebuah channel bisa:

```text
CONNECTED
tetapi
health_status = DEGRADED
```

---

## 4. `selaluteh-product-catalog`

Desain Products Page sudah melampaui CRUD produk sederhana.

Spec ini perlu mencakup:

- product;
    
- SKU;
    
- category;
    
- tags;
    
- description;
    
- media;
    
- base price;
    
- cost;
    
- tax;
    
- product status;
    
- draft;
    
- active;
    
- inactive;
    
- archived;
    
- duplicate product;
    
- outlet assignment;
    
- per-outlet availability;
    
- per-outlet price override;
    
- product variants;
    
- customization/modifier;
    
- product search;
    
- filtering;
    
- bulk activate/deactivate;
    
- bulk outlet assignment;
    
- product activity timeline;
    
- catalog import/export.
    

Pemisahan penting:

```text
Product Catalog
→ identitas dan konfigurasi produk

Inventory
→ jumlah stok dan pergerakannya
```

Jangan simpan stock logic langsung di product service.

---

## 5. `selaluteh-inventory-stock-ledger`

Ini wajib dibuat terpisah karena stok bersifat transaksional.

Mencakup:

- inventory per product per outlet;
    
- available stock;
    
- reserved stock;
    
- committed stock;
    
- low-stock threshold;
    
- out-of-stock state;
    
- stock adjustment;
    
- adjustment reason;
    
- stock reservation saat checkout;
    
- reservation release;
    
- stock deduction setelah order confirmed;
    
- reversal bila order dibatalkan;
    
- stock movement history;
    
- concurrency;
    
- negative-stock prevention;
    
- inventory audit.
    

Model sederhananya:

```text
available_to_sell
=
on_hand
- reserved
```

Semua perubahan stok sebaiknya menghasilkan ledger:

```text
PURCHASE
MANUAL_ADJUSTMENT
ORDER_RESERVED
ORDER_CONFIRMED
ORDER_CANCELLED
WASTE
TRANSFER_IN
TRANSFER_OUT
CORRECTION
```

Desain popup **Adjust Stock** tidak aman jika backend hanya melakukan:

```text
stock = stock + quantity
```

Harus ada ledger, reason, actor, dan idempotency.

---

## 6. `selaluteh-cart-order-lifecycle`

AI Agent Architecture sudah menjelaskan bagaimana AI menggunakan cart dan order, tetapi detail implementasi order perlu spec sendiri.

Mencakup:

- satu active cart per customer;
    
- cart terikat outlet;
    
- pindah outlet;
    
- cart conflict;
    
- item snapshot;
    
- price snapshot;
    
- cart expiration;
    
- order confirmation;
    
- checkout;
    
- order creation;
    
- pickup;
    
- status lifecycle;
    
- cancellation rules;
    
- order timeline;
    
- customer order history;
    
- outlet routing;
    
- order idempotency;
    
- inventory reservation;
    
- payment dependency.
    

Contoh lifecycle:

```text
DRAFT_CART
→ AWAITING_CONFIRMATION
→ PENDING_PAYMENT
→ PAID
→ PREPARING
→ READY_FOR_PICKUP
→ COMPLETED
```

Jalur lain:

```text
PENDING_PAYMENT
→ EXPIRED

PAID
→ CANCEL_REQUESTED
→ CANCELLED / REJECTED
```

AI tidak menjadi authority atas state ini.

---

## 7. `selaluteh-payments-xendit`

Walaupun kita sudah membahas Xendit dan Payment Page, detail backend pembayaran perlu spec khusus.

Mencakup:

- Xendit test mode;
    
- payment link creation;
    
- invoice/external ID;
    
- payment expiration;
    
- payment events;
    
- webhook verification;
    
- webhook idempotency;
    
- duplicate webhook;
    
- out-of-order webhook;
    
- payment reconciliation;
    
- payment status;
    
- retry link;
    
- resend payment link;
    
- refund request flow;
    
- payment activity;
    
- error handling;
    
- audit;
    
- monitoring.
    

Metode MVP tetap:

```text
Xendit payment gateway only
```

Tidak ada:

```text
manual bank transfer
COD
AI mark as paid
manual payment confirmation
```

Authority:

```text
Xendit webhook
→ backend verifies
→ backend updates payment
→ backend updates order
→ AI hanya membaca
```

---

## 8. `selaluteh-crm-inbox-contacts`

Desain Chats dan Contacts menunjukkan bahwa domain CRM juga perlu spec terpisah.

Mencakup:

- contact identity;
    
- WhatsApp identity;
    
- Telegram identity;
    
- identity merging;
    
- conversation;
    
- messages;
    
- unread count;
    
- assignment;
    
- queue;
    
- AI handling;
    
- human handling;
    
- takeover;
    
- resume AI;
    
- contact owner;
    
- contact tags;
    
- internal notes;
    
- preferred outlet;
    
- last interaction;
    
- total orders;
    
- total spent;
    
- conversation status;
    
- SLA;
    
- archive conversation.
    

Pemisahan assignment:

```text
Contact Owner
→ PIC hubungan jangka panjang

Conversation Assignee
→ orang yang menangani chat saat ini

Order Outlet
→ outlet yang memproses pesanan
```

Nilainya tidak harus sama.

---

## 9. `selaluteh-complaints-tickets`

Complaint jangan hanya menjadi kolom di conversation.

Spec ini harus mencakup:

- complaint creation;
    
- source channel;
    
- related contact;
    
- related order;
    
- related outlet;
    
- category;
    
- priority;
    
- severity;
    
- status;
    
- assigned agent;
    
- escalation;
    
- internal notes;
    
- customer-visible messages;
    
- attachment;
    
- resolution;
    
- reopen;
    
- complaint timeline;
    
- AI-created ticket;
    
- human-created ticket.
    

Lifecycle contoh:

```text
OPEN
→ TRIAGED
→ ASSIGNED
→ IN_PROGRESS
→ WAITING_CUSTOMER
→ RESOLVED
→ CLOSED
```

---

# Spec cross-cutting baru yang muncul dari desain popup

Ini bagian yang sebelumnya mudah terlewat. Banyak popup Products dan Outlets ternyata tidak hanya membutuhkan domain endpoint, tetapi juga **platform capability yang digunakan lintas halaman**.

## 10. `selaluteh-admin-data-operations`

Menurutku ini adalah **spec baru yang paling jelas muncul dari seluruh desain UI terbaru**.

Spec ini dipakai oleh:

```text
Products
Outlets
Contacts
Orders
Payments
Complaints
Reports
```

Mencakup:

### Query dan list contract

- pagination;
    
- filtering;
    
- sorting;
    
- search;
    
- date range;
    
- multi-select filter;
    
- stable query parameters;
    
- total count;
    
- applied filter metadata.
    

### Saved filter sets

- save filter;
    
- rename;
    
- update;
    
- delete;
    
- private view;
    
- workspace view;
    
- default view.
    

### Bulk actions

- bulk activate;
    
- bulk pause;
    
- bulk archive;
    
- bulk tags;
    
- bulk assignment;
    
- bulk export;
    
- partial success;
    
- retry failed items;
    
- maximum batch size.
    

### Import/export

- CSV;
    
- Excel;
    
- PDF bila memang dibutuhkan;
    
- selected rows;
    
- current page;
    
- all filtered data;
    
- asynchronous export job;
    
- signed download URL;
    
- export expiration;
    
- email delivery;
    
- import preview;
    
- validation errors;
    
- duplicate detection;
    
- downloadable error report.
    

### Async job status

```text
QUEUED
PROCESSING
COMPLETED
PARTIALLY_COMPLETED
FAILED
CANCELLED
EXPIRED
```

### Idempotency dan audit

- idempotency key;
    
- job actor;
    
- workspace scope;
    
- command result;
    
- failed item list;
    
- audit event.
    

Tanpa spec ini, setiap halaman mungkin membuat implementasi export dan bulk action sendiri-sendiri.

---

## 11. `selaluteh-audit-activity-timeline`

UI Products dan Outlets sama-sama mempunyai tab atau card **Activity**.

Audit log bukan sekadar tulisan bebas.

Spec ini mengatur:

- actor;
    
- entity;
    
- entity ID;
    
- action;
    
- previous value;
    
- new value;
    
- source;
    
- IP/device metadata bila dibutuhkan;
    
- workspace;
    
- outlet;
    
- correlation ID;
    
- timestamp;
    
- reason;
    
- visibility.
    

Contoh event:

```text
OUTLET_CREATED
OUTLET_PAUSED
OUTLET_MANAGER_ASSIGNED
OPERATING_HOURS_UPDATED
CHANNEL_RECONNECTED
PRODUCT_PRICE_UPDATED
PRODUCT_ASSIGNED_TO_OUTLET
STOCK_ADJUSTED
PAYMENT_LINK_RESENT
CONTACT_OWNER_CHANGED
```

UI Recent Activity kemudian membaca data dari event ini.

Audit event sebaiknya immutable.

---

## 12. `selaluteh-analytics-read-models`

Cards seperti ini tidak sebaiknya dihitung langsung dengan query besar setiap page dibuka:

```text
Today's Orders
Revenue Today
Average Prep Time
Sales This Month
Outlet Performance
Product Performance
Last 7 Days Chart
```

Spec ini mengatur:

- analytics event input;
    
- daily aggregates;
    
- product aggregates;
    
- outlet aggregates;
    
- revenue aggregates;
    
- prep time aggregates;
    
- timezone;
    
- date boundaries;
    
- delayed data;
    
- refresh strategy;
    
- read models;
    
- chart endpoints;
    
- last updated timestamp.
    

Contoh read model:

```text
outlet_daily_metrics
product_daily_metrics
workspace_daily_metrics
channel_health_metrics
```

Dengan begitu UI tidak membebani order database setiap kali dibuka.

---

## 13. `selaluteh-notification-attention-engine`

UI menggunakan konsep:

```text
Needs Attention
Printer offline
Channel disconnected
Webhook failed
Low stock
Payment issue
Sync delayed
```

Ini perlu aturan backend yang konsisten.

Spec ini mengatur:

- alert types;
    
- severity;
    
- deduplication;
    
- first detected;
    
- last detected;
    
- resolved at;
    
- acknowledged by;
    
- notification recipients;
    
- outlet scope;
    
- workspace scope;
    
- escalation;
    
- auto-resolution;
    
- notification preferences.
    

Pisahkan:

```text
business status
operational health
alert
```

Contoh:

```text
Outlet status = ACTIVE
Outlet health = NEEDS_ATTENTION
Alert = WHATSAPP_WEBHOOK_FAILURE
```

Jangan mengubah outlet menjadi `Needs Attention` sebagai satu-satunya status permanen hanya karena printer offline.

---

## 14. `selaluteh-media-assets`

Ini bisa dibuat belakangan, tetapi tetap diperlukan karena Products dan Outlets mempunyai image upload.

Mencakup:

- upload URL;
    
- file type;
    
- file size;
    
- image validation;
    
- crop;
    
- thumbnail;
    
- replacement;
    
- orphan cleanup;
    
- storage path;
    
- workspace ownership;
    
- public/private access;
    
- signed URLs;
    
- malware scanning bila diperlukan;
    
- delete protection.
    

Jangan membiarkan frontend langsung menentukan arbitrary storage path.

---

# Elemen UI yang tidak membutuhkan spec backend baru

Beberapa state tetap cukup menjadi bagian frontend design system:

```text
drawer open/closed
modal open/closed
active tab visual
hover state
focus state
loading skeleton
button disabled visual
empty-state illustration
no-results illustration
tooltip placement
responsive layout
animation
toast appearance
```

Tetapi backend tetap harus menyediakan data/error yang membuat state tersebut muncul.

Contoh:

```text
No results
→ cukup list endpoint mengembalikan items: [] dan total: 0

Empty account
→ list endpoint mengembalikan items: [] dan workspace_has_ever_created_outlet: false
```

Perbedaan itu dapat dimasukkan ke API contract, tidak perlu spec tersendiri.

---

# Mapping desain Outlets ke spec backend

|UI / Action|Spec pemilik|
|---|---|
|Add/Edit Outlet|Outlet Management|
|Pause/Activate/Archive|Outlet Management|
|Assign Manager|Workspace Access + Outlet Management|
|Operating Hours|Outlet Management|
|Maps Link dan Coordinate Resolver|Location Intelligence|
|Find Nearest Outlet|Location Intelligence|
|Manage WhatsApp/Telegram|Channel Connections|
|Sync Menu/Orders|Channel Connections|
|Export|Admin Data Operations|
|Advanced Filters|Admin Data Operations|
|Saved Filter Set|Admin Data Operations|
|Bulk Actions|Admin Data Operations + domain spec|
|Recent Activity|Audit Activity Timeline|
|Orders/Revenue Chart|Analytics Read Models|
|Needs Attention|Notification & Attention Engine|
|Outlet Photo|Media Assets|

---

# Mapping desain Products ke spec backend

|UI / Action|Spec pemilik|
|---|---|
|Add/Edit/Duplicate Product|Product Catalog|
|Assign Product to Outlets|Product Catalog|
|Price Override|Product Catalog|
|Activate/Deactivate/Archive|Product Catalog|
|Adjust Stock|Inventory Ledger|
|Low Stock/Out of Stock|Inventory Ledger|
|Product Sales Chart|Analytics Read Models|
|Product Activity|Audit Activity Timeline|
|Export/Import|Admin Data Operations|
|More Filters|Admin Data Operations|
|Product Image|Media Assets|

---

# Struktur spec yang kusarankan

Jangan langsung membuat semuanya `active`.

```text
docs/specs/
├── active/
│   └── selaluteh-outlet-management-operations/
│       ├── spec.yaml
│       ├── requirements.md
│       ├── design.md
│       └── tasks.md
│
├── backlog/
│   ├── selaluteh-workspace-access-control/
│   ├── selaluteh-channel-connections-sync/
│   ├── selaluteh-product-catalog/
│   ├── selaluteh-inventory-stock-ledger/
│   ├── selaluteh-cart-order-lifecycle/
│   ├── selaluteh-payments-xendit/
│   ├── selaluteh-crm-inbox-contacts/
│   ├── selaluteh-complaints-tickets/
│   ├── selaluteh-admin-data-operations/
│   ├── selaluteh-audit-activity-timeline/
│   ├── selaluteh-analytics-read-models/
│   ├── selaluteh-notification-attention-engine/
│   └── selaluteh-media-assets/
│
└── completed/
```

# Urutan pengerjaan paling aman

Untuk kondisi proyekmu sekarang:

```text
1. Workspace Access Control
2. Outlet Management & Operations
3. Channel Connections & Sync
4. Product Catalog
5. Inventory Stock Ledger
6. Admin Data Operations
7. Audit Activity Timeline
8. Cart & Order Lifecycle
9. Payments & Xendit
10. CRM Inbox & Contacts
11. Complaints & Tickets
12. Analytics Read Models
13. Notification & Attention Engine
14. Media Assets
```

Namun hanya satu atau dua spec yang sebaiknya berstatus `active` pada satu waktu.

# Kesimpulan

**Ya, spec baru masih diperlukan.** Yang paling terlihat dari desain UI terbaru adalah:

```text
selaluteh-outlet-management-operations
selaluteh-product-catalog
selaluteh-inventory-stock-ledger
selaluteh-channel-connections-sync
selaluteh-admin-data-operations
selaluteh-audit-activity-timeline
selaluteh-analytics-read-models
selaluteh-notification-attention-engine
```

Sedangkan untuk keseluruhan backend marketplace, tetap perlu:

```text
workspace access control
cart/order lifecycle
payments/Xendit
CRM inbox/contacts
complaints/tickets
```

Spec pertama yang paling tepat dibuat sekarang adalah **`selaluteh-outlet-management-operations`**, karena desain Outlets sudah paling lengkap dan boundaries-nya sudah jelas dengan Location Intelligence. Setelah itu lanjut ke **Product Catalog**, **Inventory**, lalu **Admin Data Operations**. 🚀


