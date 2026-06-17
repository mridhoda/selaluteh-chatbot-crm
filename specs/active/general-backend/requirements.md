# Requirements Document: SelaluTeh Chatbot CRM & Telegram Marketplace Backend

## Introduction

Dokumen ini mendefinisikan kebutuhan fungsional dan non-fungsional untuk **SelaluTeh Chatbot CRM & Telegram Marketplace Backend**.

Sistem ini berawal dari aplikasi CRM chatbot yang telah memiliki:

- autentikasi;
- connected platforms;
- Telegram, WhatsApp, dan Instagram webhook;
- contacts;
- chats dan messages;
- AI agents;
- human takeover;
- complaints;
- analytics;
- local file uploads;
- legacy orders.

Sistem kemudian dikembangkan menjadi **Telegram-first commerce MVP** yang mendukung:

- satu workspace/account SelaluTeh;
- banyak outlet;
- katalog produk;
- ketersediaan produk per outlet;
- cart;
- checkout;
- order;
- payment link melalui payment gateway;
- payment webhook;
- admin operations melalui web dashboard;
- future multi-workspace/multi-account/franchise-owner architecture.

Dokumen ini menjadi requirements authority untuk pengembangan backend baru, refactor bertahap, API contract, database model, security, testing, dan operational readiness.

---

## Product Direction

### MVP

```txt
SelaluTeh Platform
└── 1 Workspace / Business Account
    ├── Outlet Samarinda
    ├── Outlet Tenggarong
    ├── Outlet Bontang
    └── Outlet lainnya
```

MVP berfokus pada:

```txt
Telegram
→ pilih outlet
→ lihat produk
→ tambah ke cart
→ checkout
→ order dibuat
→ payment link dikirim
→ payment gateway webhook
→ payment terverifikasi
→ outlet memproses order
```

### Future Production

```txt
SelaluTeh Platform
├── Workspace / Franchise Owner A
│   ├── Outlet A1
│   └── Outlet A2
├── Workspace / Franchise Owner B
│   ├── Outlet B1
│   └── Outlet B2
└── Workspace / Franchise Owner C
    └── Outlet C1
```

Future production harus dapat mendukung:

- multiple workspaces;
- multiple business accounts;
- multiple franchise owners;
- each workspace has many outlets;
- workspace-specific users, platforms, products, settings, orders, and payments;
- strict workspace and outlet data isolation.

---

## Architectural Baseline

| Area | Current / Target Decision |
|---|---|
| Backend runtime | Node.js + Express |
| Current database | MongoDB + Mongoose |
| Database target direction | PostgreSQL/Supabase-ready repository abstraction |
| Frontend | React + Vite admin dashboard |
| Primary commerce channel | Telegram |
| Future commerce channel | WhatsApp |
| Payment | Payment gateway-generated payment link |
| Payment authority | Verified provider webhook |
| Tenant boundary | `workspace_id` |
| Branch boundary | `outlet_id` |
| File storage | Local filesystem + database metadata |
| AI role | Assistant and action proposer, not transaction authority |
| Backend pattern | Route → Service → Repository → Model/Database |
| External providers | `integrations/` adapter/client layer |
| Migration approach | Incremental, no big-bang rewrite |

---

## Glossary

- **Platform**: Keseluruhan aplikasi SelaluTeh.
- **Workspace**: Akun bisnis, merchant account, atau franchise owner.
- **Workspace_Membership**: Hubungan user dengan workspace beserta role.
- **Outlet**: Cabang fisik yang memproses order.
- **Outlet_Access**: Hak user untuk mengakses outlet tertentu.
- **Platform_Connection**: Integrasi Telegram, WhatsApp, Instagram, atau channel lain.
- **Contact**: Identitas customer yang tersimpan di CRM.
- **Chat**: Percakapan customer melalui platform tertentu.
- **Message**: Unit pesan inbound/outbound dalam chat.
- **Human_Takeover**: Pengambilalihan chat dari AI ke human agent.
- **AI_Agent**: Konfigurasi AI yang menangani percakapan dan action proposal.
- **Product**: Entitas katalog produk milik workspace.
- **Product_Outlet_Availability**: Ketersediaan, harga override, dan status produk per outlet.
- **Inventory_Item**: Posisi stok produk/variant pada outlet.
- **Stock_Movement**: Catatan append-only perubahan stok.
- **Cart**: Keranjang customer yang terikat ke satu outlet.
- **Checkout**: Snapshot hasil validasi cart sebelum order dibuat.
- **Order**: Pesanan customer yang terikat ke workspace dan outlet.
- **Payment**: Percobaan/transaksi pembayaran untuk sebuah order.
- **Payment_Attempt**: Satu payment link atau percobaan metode pembayaran.
- **Payment_Event**: Event provider/webhook yang memengaruhi payment.
- **Reconciliation**: Proses pencocokan state gateway dengan state internal.
- **Webhook_Event**: Catatan event provider untuk idempotency, audit, dan retry.
- **Source_of_Truth**: Sistem yang memiliki kewenangan final terhadap suatu data.
- **Repository**: Abstraction layer untuk query dan persistence.
- **Provider_Adapter**: Abstraction untuk Telegram, Meta, payment gateway, atau AI provider.
- **Idempotency_Key**: Identifier yang menjamin request berulang tidak membuat side effect ganda.
- **Request_Context**: Context server-side berisi user, workspace, role, dan outlet access.
- **Verified_Webhook**: Webhook yang lolos validasi signature/token/provider contract.
- **Local_File_Store**: Filesystem server untuk file upload/media.
- **MVP**: Versi minimum yang membuktikan alur commerce end-to-end.
- **Future_Ready**: Desain yang belum seluruhnya diaktifkan di MVP tetapi tidak menghambat evolusi.

---

## Requirement Summary

| ID | Requirement | Priority |
|---|---|---|
| R1 | Workspace Management | P0 |
| R2 | User Authentication and Account Security | P0 |
| R3 | Workspace Membership and Roles | P0 |
| R4 | Outlet Management | P0 |
| R5 | User Outlet Access | P0 |
| R6 | Connected Platforms | P0 |
| R7 | Webhook Ingestion and Idempotency | P0 |
| R8 | Contacts | P0 |
| R9 | Chats and Messages | P0 |
| R10 | Human Takeover | P0 |
| R11 | AI Agents and Commerce Guardrails | P0 |
| R12 | Product Catalog | P0 |
| R13 | Product Availability and Pricing per Outlet | P0 |
| R14 | Inventory Items | P1 |
| R15 | Stock Movement and Reservation | P1 |
| R16 | Customer Cart | P0 |
| R17 | Checkout | P0 |
| R18 | Orders | P0 |
| R19 | Order Status, Timeline, and Actions | P0 |
| R20 | Payments and Payment Attempts | P0 |
| R21 | Payment Webhooks and Payment Events | P0 |
| R22 | Payment Reconciliation | P1 |
| R23 | Telegram Commerce Flow | P0 |
| R24 | WhatsApp Commerce Readiness | P2 |
| R25 | Notifications | P0 |
| R26 | Complaints | P1 |
| R27 | Settings | P0 |
| R28 | Files and Local Storage | P0 |
| R29 | API Contract and Error Format | P0 |
| R30 | Workspace and Outlet Security | P0 |
| R31 | Audit Logging | P0 |
| R32 | Background Jobs, Retry, and Scheduling | P1 |
| R33 | Analytics and Reports | P1 |
| R34 | Database, Query Performance, and Indexing | P0 |
| R35 | Repository Layer and Database Migration | P0 |
| R36 | Observability and Health Checks | P0 |
| R37 | Testing and Quality Assurance | P0 |
| R38 | Deployment, Backup, and Production Readiness | P1 |

---

# Requirements

## Requirement 1: Workspace Management

**Priority:** P0

**User Story:** Sebagai platform owner, saya ingin setiap business account atau franchise owner direpresentasikan sebagai workspace, sehingga data bisnis dapat dipisahkan dengan aman dan sistem dapat berkembang menjadi multi-account.

### Acceptance Criteria

1. THE Backend_System SHALL menyediakan entity `Workspace` dengan minimum field:
   - `id`
   - `name`
   - `slug`
   - `owner_user_id`
   - `account_type`
   - `status`
   - `timezone`
   - `settings`
   - `created_at`
   - `updated_at`
2. THE Backend_System SHALL menggunakan workspace sebagai primary tenant boundary.
3. THE Backend_System SHALL memastikan semua tenant-owned domain menyimpan `workspace_id`.
4. THE Backend_System SHALL menerapkan unique constraint atau equivalent validation untuk `slug`.
5. THE Backend_System SHALL mendukung status workspace:
   - `active`
   - `suspended`
   - `inactive`
6. WHEN workspace berstatus `suspended` atau `inactive`, THE Backend_System SHALL menolak operasi bisnis baru selain operasi administratif yang diizinkan.
7. THE MVP_UI SHALL menggunakan satu workspace aktif tanpa wajib menampilkan workspace switcher.
8. THE Backend_System SHALL tetap mendukung lebih dari satu workspace dalam data model dan authorization contract.
9. THE Backend_System SHALL TIDAK menggunakan `outlet_id` sebagai pengganti workspace/account ownership.
10. WHEN resource dibuat, THE Backend_System SHALL menetapkan `workspace_id` dari verified request context, bukan dari body yang tidak dipercaya.
11. THE Backend_System SHALL menyediakan endpoint internal/admin untuk mengambil current workspace.
12. THE Backend_System SHALL mencegah penghapusan hard-delete workspace yang masih memiliki data bisnis aktif.

---

## Requirement 2: User Authentication and Account Security

**Priority:** P0

**User Story:** Sebagai pengguna, saya ingin login secara aman dan memiliki sesi yang dapat dicabut, sehingga akun dan data bisnis terlindungi.

### Acceptance Criteria

1. THE Backend_System SHALL mendukung autentikasi existing berbasis JWT/OTP/password reset.
2. THE User entity SHALL memiliki minimum field:
   - `id`
   - `email`
   - `password_hash`
   - `full_name`
   - `avatar_url`
   - `status`
   - `token_version`
   - `last_login_at`
   - `created_at`
   - `updated_at`
3. THE Backend_System SHALL menerapkan unique constraint atau equivalent validation pada email yang telah dinormalisasi.
4. THE Backend_System SHALL menyimpan password dalam bentuk strong password hash.
5. THE Backend_System SHALL TIDAK menyimpan password plaintext.
6. THE Backend_System SHALL mendukung account status:
   - `active`
   - `invited`
   - `disabled`
   - `locked`
7. WHEN account tidak aktif, THE Backend_System SHALL menolak login.
8. WHEN `token_version` meningkat, THE Backend_System SHALL menolak JWT lama.
9. THE Backend_System SHALL memberikan generic error untuk login gagal agar tidak mengekspos apakah email terdaftar.
10. THE Backend_System SHALL menerapkan rate limit pada login, OTP, verify, forgot-password, dan reset-password.
11. THE Backend_System SHALL memiliki expiration untuk OTP dan password reset token.
12. THE Backend_System SHALL menghapus atau menandai token reset sebagai used setelah berhasil digunakan.
13. THE Backend_System SHALL mencatat login sukses, login gagal, logout, reset password, dan force logout pada audit log.
14. THE Backend_System SHALL mendukung secure logout dan revocation.
15. THE Backend_System SHALL TIDAK mengirim password hash, OTP secret, reset token, atau JWT secret ke frontend.

---

## Requirement 3: Workspace Membership and Roles

**Priority:** P0

**User Story:** Sebagai owner, saya ingin mengatur user dan role dalam workspace, sehingga setiap orang hanya memiliki kewenangan sesuai tanggung jawabnya.

### Acceptance Criteria

1. THE Backend_System SHALL menyediakan entity `UserWorkspaceMembership`.
2. THE membership SHALL memiliki minimum field:
   - `id`
   - `workspace_id`
   - `user_id`
   - `role`
   - `status`
   - `joined_at`
   - `created_at`
   - `updated_at`
3. THE Backend_System SHALL mendukung minimum roles:
   - `owner`
   - `admin`
   - `outlet_manager`
   - `human_agent`
   - `viewer`
4. THE Backend_System SHALL mencegah duplicate active membership untuk kombinasi user dan workspace.
5. THE Backend_System SHALL memastikan setiap membership merujuk ke user dan workspace valid.
6. THE Backend_System SHALL menyelesaikan current workspace dari verified membership.
7. THE Backend_System SHALL TIDAK mempercayai role yang dikirim oleh frontend.
8. THE owner role SHALL dapat melihat seluruh outlet dalam workspace.
9. THE outlet_manager SHALL hanya dapat melakukan operasi pada outlet yang diberikan.
10. THE human_agent SHALL dapat mengoperasikan chat yang diizinkan tanpa otomatis mendapat permission ke settings sensitif.
11. THE viewer SHALL bersifat read-only untuk domain yang diberikan.
12. WHEN membership dinonaktifkan, THE Backend_System SHALL segera menolak request baru ke workspace tersebut.
13. THE Backend_System SHALL mencatat invite, role change, membership disable, dan membership removal ke audit log.
14. THE Backend_System SHALL mencegah workspace kehilangan seluruh owner aktif tanpa explicit transfer/confirmation flow.

---

## Requirement 4: Outlet Management

**Priority:** P0

**User Story:** Sebagai owner, saya ingin mengelola banyak outlet dalam satu workspace, sehingga katalog, order, payment, chat, dan analytics dapat dioperasikan per cabang.

### Acceptance Criteria

1. THE Backend_System SHALL menyediakan entity `Outlet`.
2. THE outlet SHALL memiliki minimum field:
   - `id`
   - `workspace_id`
   - `name`
   - `code`
   - `address`
   - `city`
   - `phone`
   - `timezone`
   - `opening_hours`
   - `status`
   - `metadata`
   - `created_at`
   - `updated_at`
3. THE Backend_System SHALL memastikan outlet selalu dimiliki oleh satu workspace.
4. THE Backend_System SHALL menerapkan unique constraint atau equivalent validation untuk kombinasi `workspace_id + code`.
5. THE Backend_System SHALL mendukung status:
   - `active`
   - `temporarily_closed`
   - `inactive`
6. WHEN outlet berstatus `inactive`, THE Backend_System SHALL menolak cart, checkout, dan order baru untuk outlet tersebut.
7. WHEN outlet berstatus `temporarily_closed`, THE Backend_System SHALL mengikuti workspace policy apakah future order diperbolehkan.
8. THE Backend_System SHALL menyediakan API list/detail/create/update/status outlet.
9. THE outlet list API SHALL mendukung search, status filter, pagination, dan sorting.
10. THE Backend_System SHALL menyimpan timezone per outlet.
11. THE Backend_System SHALL menggunakan outlet timezone untuk display/business schedule tetapi menyimpan timestamp internal dalam UTC.
12. THE Backend_System SHALL mempertahankan data historis saat outlet dinonaktifkan.
13. THE Backend_System SHALL TIDAK hard-delete outlet yang telah memiliki order/payment historis.
14. THE Backend_System SHALL mencatat perubahan status, jam operasional, dan detail sensitif outlet ke audit log.

---

## Requirement 5: User Outlet Access

**Priority:** P0

**User Story:** Sebagai owner, saya ingin membatasi user ke outlet tertentu, sehingga outlet manager dan human agent tidak dapat melihat cabang yang bukan tanggung jawabnya.

### Acceptance Criteria

1. THE Backend_System SHALL menyediakan entity `UserOutletAccess`.
2. THE entity SHALL memiliki minimum field:
   - `id`
   - `workspace_id`
   - `outlet_id`
   - `user_id`
   - `role`
   - `status`
   - `created_at`
   - `updated_at`
3. THE Backend_System SHALL memastikan workspace, outlet, dan user membership saling konsisten.
4. THE Backend_System SHALL mencegah user mendapat outlet access pada workspace tempat user tidak memiliki active membership.
5. THE Backend_System SHALL memvalidasi outlet access pada setiap outlet-scoped operation.
6. THE Backend_System SHALL TIDAK menganggap `?outlet_id=` sebagai bukti authorization.
7. THE Backend_System SHALL memfilter list result hanya ke outlet yang boleh diakses user.
8. THE owner/admin dengan workspace-wide permission MAY mengakses seluruh outlet tanpa row access satu per satu.
9. WHEN outlet access dinonaktifkan, THE user SHALL kehilangan akses pada request berikutnya.
10. THE Backend_System SHALL menyediakan endpoint untuk melihat dan mengubah outlet access user.
11. THE Backend_System SHALL mencatat grant, update, dan revoke outlet access ke audit log.
12. THE Backend_System SHALL mengembalikan `403 OUTLET_ACCESS_DENIED` tanpa mengekspos data outlet lain.

---

## Requirement 6: Connected Platforms

**Priority:** P0

**User Story:** Sebagai admin, saya ingin menghubungkan Telegram, WhatsApp, dan Instagram ke workspace, sehingga chat dan commerce dapat berjalan melalui channel tersebut.

### Acceptance Criteria

1. THE Backend_System SHALL menyediakan entity `Platform`.
2. THE platform SHALL memiliki minimum field:
   - `id`
   - `workspace_id`
   - `type`
   - `display_name`
   - `status`
   - `credentials_encrypted`
   - `webhook_secret_encrypted`
   - `provider_account_id`
   - `default_agent_id`
   - `routing_config`
   - `last_event_at`
   - `created_at`
   - `updated_at`
3. THE Backend_System SHALL mendukung platform types:
   - `telegram`
   - `whatsapp`
   - `instagram`
   - `manual`
   - future `web`
4. THE Backend_System SHALL mendukung connection states:
   - `connected`
   - `disabled`
   - `pending_setup`
   - `needs_attention`
   - `disconnected`
5. THE Backend_System SHALL mendukung webhook health states:
   - `healthy`
   - `no_recent_events`
   - `verification_failed`
   - `delivery_errors`
   - `not_configured`
6. THE Backend_System SHALL menyediakan API create, list, detail, update, enable, disable, test, dan disconnect.
7. THE Backend_System SHALL mengenkripsi credential dan webhook secret at rest jika memungkinkan.
8. THE Backend_System SHALL TIDAK mengirim secret plaintext ke frontend setelah disimpan.
9. THE Backend_System SHALL menampilkan secret field sebagai write-only/replace-only.
10. THE Backend_System SHALL memvalidasi platform type-specific credential.
11. WHEN Telegram platform diaktifkan, THE Backend_System SHALL mendukung webhook registration.
12. THE Backend_System SHALL mencatat platform connection test result dan last event time.
13. THE Backend_System SHALL mendukung assignment AI agent per platform.
14. THE Backend_System SHALL mendukung routing config ke outlet/default outlet jika dibutuhkan.
15. THE Backend_System SHALL mencatat credential update, enable/disable, dan disconnect ke audit log.

---

## Requirement 7: Webhook Ingestion and Idempotency

**Priority:** P0

**User Story:** Sebagai sistem, saya ingin memproses webhook secara aman dan idempotent, sehingga event ganda tidak membuat message, order, atau payment ganda.

### Acceptance Criteria

1. THE Backend_System SHALL menyediakan entity `WebhookEvent`.
2. THE WebhookEvent SHALL memiliki minimum field:
   - `id`
   - `workspace_id`
   - `platform_id`
   - `provider`
   - `provider_event_id`
   - `event_type`
   - `payload_hash`
   - `status`
   - `attempt_count`
   - `last_error`
   - `received_at`
   - `processed_at`
   - `created_at`
3. THE Backend_System SHALL memverifikasi provider token/signature sebelum melakukan mutation.
4. THE Backend_System SHALL menggunakan `provider + provider_event_id` sebagai primary idempotency key jika tersedia.
5. IF provider event ID tidak tersedia, THE Backend_System SHALL menggunakan stable fallback key berdasarkan provider, payload hash, reference, dan timestamp yang relevan.
6. WHEN duplicate event diterima, THE Backend_System SHALL mengembalikan provider-compatible success response tanpa mengulang side effect.
7. THE Backend_System SHALL memisahkan webhook parsing dari domain processing.
8. THE Backend_System SHALL membatasi webhook payload size.
9. THE Backend_System SHALL menyimpan raw body hanya sejauh diperlukan untuk signature verification dan debugging aman.
10. THE Backend_System SHALL meredact token, secret, authorization header, dan sensitive payload dari log.
11. THE Backend_System SHALL mengakui webhook secepat mungkin.
12. Heavy processing SHALL dapat dipindahkan ke background worker.
13. THE Backend_System SHALL mendukung webhook statuses:
    - `received`
    - `processing`
    - `processed`
    - `ignored_duplicate`
    - `rejected`
    - `failed`
    - `retry_scheduled`
14. THE Backend_System SHALL menyimpan processing error yang aman untuk operations.
15. THE Backend_System SHALL menyediakan retry hanya untuk retriable failure.
16. THE Backend_System SHALL mencegah duplicate notification akibat duplicate webhook.

---

## Requirement 8: Contacts

**Priority:** P0

**User Story:** Sebagai human agent, saya ingin memiliki satu record contact per customer, sehingga riwayat chat dan order dapat dilihat secara konsisten.

### Acceptance Criteria

1. THE Backend_System SHALL menyediakan entity `Contact`.
2. THE contact SHALL memiliki minimum field:
   - `id`
   - `workspace_id`
   - `display_name`
   - `phone`
   - `email`
   - `telegram_user_id`
   - `whatsapp_user_id`
   - `instagram_user_id`
   - `last_outlet_id`
   - `metadata`
   - `created_at`
   - `updated_at`
3. THE Backend_System SHALL meng-upsert contact dari inbound webhook.
4. THE Backend_System SHALL melakukan normalization phone number.
5. THE Backend_System SHALL menjaga provider identity mapping.
6. THE Backend_System SHALL mencegah merge contact otomatis jika identity tidak cukup kuat.
7. THE contact list SHALL mendukung search, tags, channel, last activity, dan pagination.
8. THE contact detail SHALL dapat menampilkan related chats, orders, dan complaints sesuai permission.
9. THE Backend_System SHALL memastikan contact hanya terlihat dalam workspace yang sama.
10. THE Backend_System SHALL mencatat manual merge atau sensitive contact update ke audit log.
11. THE Backend_System SHALL TIDAK menampilkan data customer di log lebih banyak dari yang dibutuhkan.
12. THE Backend_System SHALL mendukung soft archive contact tanpa menghapus histori transaksi.

---

## Requirement 9: Chats and Messages

**Priority:** P0

**User Story:** Sebagai human agent, saya ingin melihat percakapan lintas platform dalam satu inbox, sehingga customer dapat ditangani secara konsisten.

### Acceptance Criteria

1. THE Backend_System SHALL menyediakan entities `Chat` dan `Message`.
2. THE Chat SHALL memiliki minimum field:
   - `id`
   - `workspace_id`
   - `platform_id`
   - `contact_id`
   - `assigned_user_id`
   - `takeover_by`
   - `ai_agent_id`
   - `current_outlet_id`
   - `status`
   - `unread_count`
   - `last_message_at`
   - `tags`
   - `created_at`
   - `updated_at`
3. THE Message SHALL memiliki minimum field:
   - `id`
   - `workspace_id`
   - `chat_id`
   - `platform_message_id`
   - `direction`
   - `sender_type`
   - `message_type`
   - `text`
   - `media`
   - `reply_to_message_id`
   - `delivery_status`
   - `provider_timestamp`
   - `created_at`
4. THE Backend_System SHALL upsert chat berdasarkan workspace, platform, dan provider conversation/contact identity.
5. THE Backend_System SHALL mencegah duplicate message berdasarkan provider message ID.
6. THE Backend_System SHALL menyimpan inbound message sebelum menjalankan AI/action processing.
7. THE Backend_System SHALL menyimpan outbound message dan delivery status.
8. THE chat list SHALL mendukung filter:
   - outlet
   - channel
   - assigned agent
   - unread
   - status
   - tags
   - search
9. THE chat list SHALL diurutkan default berdasarkan `last_message_at DESC`.
10. THE messages API SHALL mengembalikan chronological order ascending untuk conversation rendering.
11. THE Backend_System SHALL mendukung text, media, file, reply-to, dan system event message types.
12. THE Backend_System SHALL menyimpan current outlet context pada chat ketika commerce flow berlangsung.
13. THE Backend_System SHALL mengizinkan link ke cart, latest order, dan payment context.
14. THE Backend_System SHALL membatasi chat visibility sesuai workspace/outlet access.
15. THE Backend_System SHALL mendukung resolved/reopened chat state.
16. THE Backend_System SHALL mendukung unread counter yang konsisten.
17. THE Backend_System SHALL TIDAK memproses provider echo sebagai inbound customer message baru.

---

## Requirement 10: Human Takeover

**Priority:** P0

**User Story:** Sebagai human agent, saya ingin mengambil alih chat dari AI, sehingga situasi kompleks dapat ditangani manusia tanpa balasan AI yang bertabrakan.

### Acceptance Criteria

1. THE Backend_System SHALL mendukung human takeover per chat.
2. THE Chat entity SHALL menyimpan:
   - `takeover_by`
   - `takeover_at`
   - optional `takeover_reason`
3. WHEN `takeover_by` tidak null, THE Backend_System SHALL menghentikan AI auto-reply untuk chat tersebut.
4. THE Backend_System SHALL tetap menyimpan inbound message saat takeover aktif.
5. THE authorized human agent SHALL dapat mengirim outbound message.
6. THE Backend_System SHALL mendukung release takeover.
7. WHEN takeover dilepas, THE Backend_System SHALL mengikuti policy apakah AI kembali aktif secara otomatis atau membutuhkan explicit enable.
8. THE Backend_System SHALL mencegah dua agent mengambil takeover tanpa conflict handling.
9. THE Backend_System SHALL mencatat takeover, reassignment, dan release pada timeline/audit.
10. THE Backend_System SHALL memvalidasi outlet access human agent sebelum takeover.
11. THE Backend_System SHALL mengembalikan error jika agent mencoba mengirim dari platform yang disconnected/disabled.
12. THE Backend_System SHALL mencegah AI mengirim delayed response setelah takeover aktif.

---

## Requirement 11: AI Agents and Commerce Guardrails

**Priority:** P0

**User Story:** Sebagai owner, saya ingin AI membantu percakapan dan commerce tanpa memiliki kewenangan untuk memalsukan harga, order, atau pembayaran.

### Acceptance Criteria

1. THE Backend_System SHALL menyediakan entity `Agent`.
2. THE Agent SHALL memiliki minimum field:
   - `id`
   - `workspace_id`
   - `name`
   - `provider`
   - `model`
   - `system_prompt`
   - `status`
   - `temperature`
   - `knowledge_config`
   - `commerce_enabled`
   - `created_at`
   - `updated_at`
3. THE Backend_System SHALL memisahkan provider client dari AI orchestration service.
4. THE AI MAY:
   - answer product questions;
   - recommend products;
   - ask for missing details;
   - summarize chat;
   - propose structured backend actions.
5. THE AI SHALL NOT:
   - set product price;
   - invent unavailable product;
   - bypass outlet availability;
   - set payment to paid;
   - bypass order transition;
   - access another workspace;
   - create refund guarantee;
   - expose secret.
6. THE Backend_System SHALL validate every AI tool/action call using server-side schema.
7. THE Backend_System SHALL execute AI action through normal service permission and validation.
8. THE Backend_System SHALL reject unknown tool/action names.
9. THE Backend_System SHALL provide minimum necessary context to AI.
10. THE Backend_System SHALL exclude provider secrets and sensitive settings from prompt context.
11. THE Backend_System SHALL preserve confirmed outlet context across commerce messages.
12. THE AI SHALL ask customer to select outlet before commerce action if no outlet is confirmed.
13. THE AI SHALL not offer product unavailable at selected outlet.
14. THE Backend_System SHALL stop AI auto-reply during human takeover.
15. THE Backend_System SHALL support provider failure fallback and safe user-facing message.
16. THE Backend_System SHALL record AI action proposal and execution result for debugging without logging secrets.

---

## Requirement 12: Product Catalog

**Priority:** P0

**User Story:** Sebagai catalog admin, saya ingin mengelola produk secara terpusat, sehingga Telegram, WhatsApp, order, dan dashboard memakai katalog yang sama.

### Acceptance Criteria

1. THE Backend_System SHALL menyediakan entity `Product`.
2. THE Product SHALL memiliki minimum field:
   - `id`
   - `workspace_id`
   - `name`
   - `slug`
   - `sku`
   - `description`
   - `category_id`
   - `base_price`
   - `currency`
   - `status`
   - `image_file_id`
   - `variants`
   - `modifiers`
   - `metadata`
   - `created_at`
   - `updated_at`
3. THE Backend_System SHALL mendukung product statuses:
   - `draft`
   - `active`
   - `archived`
4. THE Backend_System SHALL memastikan SKU unique dalam workspace jika SKU digunakan.
5. THE Backend_System SHALL memastikan base price tidak negatif.
6. THE Backend_System SHALL menolak product active tanpa nama dan valid price.
7. THE Backend_System SHALL menyediakan CRUD products.
8. THE product list SHALL mendukung:
   - search
   - category
   - status
   - outlet availability
   - pagination
   - sorting
9. THE Backend_System SHALL menyediakan detail product.
10. THE Backend_System SHALL mendukung image metadata/file reference.
11. THE Backend_System SHALL mendukung variants dan modifiers sederhana.
12. THE Backend_System SHALL TIDAK menyimpan catalog product hanya dalam AI prompt/config.
13. THE Backend_System SHALL menjadi source of truth product data.
14. THE Backend_System SHALL mempertahankan product snapshot pada order meskipun product berubah.
15. Archived product SHALL tidak dapat ditambahkan ke cart baru.
16. THE Backend_System SHALL mencatat price/status change ke audit log.
17. THE Backend_System SHALL mendukung bulk import/export sebagai optional admin capability.
18. THE Backend_System SHALL menjaga workspace isolation pada semua product queries.

---

## Requirement 13: Product Availability and Pricing per Outlet

**Priority:** P0

**User Story:** Sebagai owner, saya ingin menentukan produk yang tersedia dan harga per outlet, sehingga setiap cabang dapat memiliki katalog operasional yang berbeda.

### Acceptance Criteria

1. THE Backend_System SHALL menyediakan entity `ProductOutletAvailability`.
2. THE entity SHALL memiliki minimum field:
   - `id`
   - `workspace_id`
   - `product_id`
   - `outlet_id`
   - `is_available`
   - `price_override`
   - `status`
   - `sold_out_reason`
   - `available_from`
   - `available_until`
   - `created_at`
   - `updated_at`
3. THE Backend_System SHALL memastikan product dan outlet berada pada workspace yang sama.
4. THE Backend_System SHALL mencegah duplicate availability record untuk product + outlet.
5. THE Backend_System SHALL menghitung effective price:
   - `price_override` jika valid;
   - jika tidak, gunakan `product.base_price`.
6. THE Backend_System SHALL memastikan price override tidak negatif.
7. THE Backend_System SHALL menolak add-to-cart bila product tidak tersedia di selected outlet.
8. THE Backend_System SHALL mendukung schedule availability.
9. THE Backend_System SHALL mendukung manual sold-out state.
10. THE product API SHALL dapat filter berdasarkan outlet.
11. THE Telegram commerce product list SHALL hanya menampilkan active and available products.
12. THE Backend_System SHALL mencatat availability/price override update ke audit log.
13. THE Backend_System SHALL mempertahankan order item price snapshot.
14. THE Backend_System SHALL menyediakan bulk availability update per outlet sebagai optional capability.

---

## Requirement 14: Inventory Items

**Priority:** P1

**User Story:** Sebagai outlet manager, saya ingin mengetahui stok per produk per outlet, sehingga sistem dapat mencegah overselling.

### Acceptance Criteria

1. THE Backend_System SHALL menyediakan entity `InventoryItem`.
2. THE InventoryItem SHALL memiliki minimum field:
   - `id`
   - `workspace_id`
   - `outlet_id`
   - `product_id`
   - `variant_id`
   - `on_hand_quantity`
   - `reserved_quantity`
   - `available_quantity`
   - `low_stock_threshold`
   - `status`
   - `updated_at`
3. THE Backend_System SHALL memastikan product dan outlet berada di workspace yang sama.
4. THE Backend_System SHALL mencegah duplicate inventory item untuk outlet + product + variant.
5. THE Backend_System SHALL menjaga invariant:
   - `on_hand_quantity >= 0`
   - `reserved_quantity >= 0`
   - `available_quantity = on_hand_quantity - reserved_quantity`
6. THE Backend_System SHALL mendukung inventory status:
   - `in_stock`
   - `low_stock`
   - `out_of_stock`
   - `not_tracked`
7. THE Backend_System SHALL mendukung per-product opt-in/out inventory tracking.
8. WHEN inventory tracking tidak aktif, THE system SHALL menggunakan availability flag tanpa quantity enforcement.
9. WHEN available quantity mencapai 0, THE commerce service SHALL memperlakukan item sebagai unavailable jika policy mengharuskan.
10. THE inventory list SHALL mendukung outlet, product, status, low-stock, dan search filter.
11. THE Backend_System SHALL mencegah direct arbitrary stock mutation tanpa stock movement.
12. THE Backend_System SHALL mencatat stock adjustment ke audit log.

---

## Requirement 15: Stock Movement and Reservation

**Priority:** P1

**User Story:** Sebagai outlet manager, saya ingin setiap perubahan stok dapat dilacak, sehingga audit dan koreksi stok dapat dilakukan.

### Acceptance Criteria

1. THE Backend_System SHALL menyediakan entity `StockMovement`.
2. THE entity SHALL memiliki minimum field:
   - `id`
   - `workspace_id`
   - `outlet_id`
   - `inventory_item_id`
   - `type`
   - `quantity`
   - `before_quantity`
   - `after_quantity`
   - `reference_type`
   - `reference_id`
   - `reason`
   - `created_by`
   - `created_at`
3. THE Backend_System SHALL mendukung movement types:
   - `stock_in`
   - `stock_out`
   - `reservation`
   - `reservation_release`
   - `sale`
   - `return`
   - `adjustment`
   - `waste`
   - `transfer_in`
   - `transfer_out`
4. THE Backend_System SHALL membuat stock movement untuk setiap stock mutation.
5. THE stock movement SHALL bersifat append-only.
6. THE Backend_System SHALL melakukan reservation secara atomic.
7. THE Backend_System SHALL mencegah reservation melebihi available quantity.
8. WHEN order dibatalkan/expired, THE Backend_System SHALL me-release reservation tepat satu kali.
9. WHEN order selesai, THE Backend_System SHALL mengurangi on-hand dan reserved secara konsisten.
10. THE Backend_System SHALL mendukung idempotency pada reservation/release/consume operations.
11. THE Backend_System SHALL mencatat actor dan reason untuk adjustment.
12. THE Backend_System SHALL mencegah cross-outlet stock mutation.
13. Transfer stock SHALL menghasilkan paired transfer-out dan transfer-in records.
14. THE Backend_System SHALL mempertahankan histori stock movement tanpa hard delete.

---

## Requirement 16: Customer Cart

**Priority:** P0

**User Story:** Sebagai customer, saya ingin menambahkan produk ke cart dari outlet yang dipilih, sehingga saya dapat membuat satu order yang konsisten.

### Acceptance Criteria

1. THE Backend_System SHALL menyediakan entity `Cart`.
2. THE Cart SHALL memiliki minimum field:
   - `id`
   - `workspace_id`
   - `outlet_id`
   - `contact_id`
   - `chat_id`
   - `platform_id`
   - `status`
   - `currency`
   - `items`
   - `subtotal`
   - `discount_total`
   - `fee_total`
   - `grand_total`
   - `expires_at`
   - `created_at`
   - `updated_at`
3. THE Backend_System SHALL mendukung cart statuses:
   - `active`
   - `converted`
   - `abandoned`
   - `expired`
   - `cancelled`
4. THE Backend_System SHALL memastikan active cart memiliki satu workspace dan satu outlet.
5. THE Backend_System SHALL melarang campuran product dari outlet berbeda dalam satu cart.
6. THE Backend_System SHALL memvalidasi product active and available saat add/update cart item.
7. THE Backend_System SHALL menghitung price server-side.
8. THE Backend_System SHALL TIDAK mempercayai client/AI-provided unit price.
9. THE Backend_System SHALL mendukung add, update quantity, remove, clear, dan view cart.
10. THE Backend_System SHALL mencegah quantity <= 0.
11. THE Backend_System SHALL mendukung modifier/variant validation.
12. THE Backend_System SHALL menghitung ulang subtotal dan total setelah setiap mutation.
13. THE Backend_System SHALL mendukung one active cart per contact/chat/outlet policy.
14. WHEN customer ingin mengganti outlet dengan cart non-empty, THE Backend_System SHALL meminta explicit confirmation dan clear/rebuild cart.
15. THE Backend_System SHALL mendukung cart expiration.
16. THE Backend_System SHALL mencegah cart converted digunakan ulang.
17. IF inventory reservation dilakukan sebelum checkout, THE Backend_System SHALL memastikan release saat cart expired.
18. THE cart mutation SHALL mendukung idempotency untuk callback Telegram berulang.

---

## Requirement 17: Checkout

**Priority:** P0

**User Story:** Sebagai customer, saya ingin mengonfirmasi checkout, sehingga order dan payment link dibuat berdasarkan data yang telah divalidasi.

### Acceptance Criteria

1. THE Backend_System SHALL menyediakan entity `Checkout`.
2. THE Checkout SHALL memiliki minimum field:
   - `id`
   - `workspace_id`
   - `outlet_id`
   - `cart_id`
   - `contact_id`
   - `chat_id`
   - `status`
   - `items_snapshot`
   - `pricing_snapshot`
   - `customer_snapshot`
   - `fulfillment_snapshot`
   - `expires_at`
   - `created_at`
   - `updated_at`
3. THE Backend_System SHALL mendukung checkout statuses:
   - `created`
   - `validated`
   - `converted`
   - `expired`
   - `failed`
4. THE Backend_System SHALL memvalidasi cart aktif dan tidak kosong.
5. THE Backend_System SHALL memvalidasi outlet active/open sesuai policy.
6. THE Backend_System SHALL memvalidasi semua product availability.
7. THE Backend_System SHALL menghitung ulang effective price dan totals.
8. THE Backend_System SHALL memvalidasi stock bila inventory enforcement aktif.
9. THE Backend_System SHALL membuat immutable-enough snapshots.
10. THE Backend_System SHALL mendukung idempotency key pada checkout.
11. Repeated checkout request dengan key yang sama SHALL tidak membuat order ganda.
12. THE Backend_System SHALL membuat order dalam status yang sesuai, biasanya `pending_payment`.
13. THE Backend_System SHALL membuat payment attempt jika metode pembayaran online dipilih.
14. THE Backend_System SHALL mengubah cart menjadi `converted` hanya setelah checkout/order berhasil dibuat.
15. IF payment provider gagal membuat link, THE Backend_System SHALL mempertahankan state yang dapat di-retry tanpa duplicate order.
16. THE Backend_System SHALL mengembalikan customer-safe error untuk product/price/stock change.
17. THE Backend_System SHALL mencatat checkout failure reason untuk debugging aman.

---

## Requirement 18: Orders

**Priority:** P0

**User Story:** Sebagai outlet operator, saya ingin melihat dan memproses order, sehingga customer menerima produk yang dipesan.

### Acceptance Criteria

1. THE Backend_System SHALL menyediakan entity `Order`.
2. THE Order SHALL memiliki minimum field:
   - `id`
   - `workspace_id`
   - `outlet_id`
   - `contact_id`
   - `chat_id`
   - `platform_id`
   - `checkout_id`
   - `order_number`
   - `status`
   - `payment_status_summary`
   - `items`
   - `subtotal`
   - `discount_total`
   - `delivery_fee`
   - `total_amount`
   - `currency`
   - `customer_snapshot`
   - `fulfillment_snapshot`
   - `notes`
   - `created_at`
   - `updated_at`
   - `completed_at`
   - `cancelled_at`
3. THE Backend_System SHALL memastikan order selalu memiliki workspace dan outlet.
4. THE Backend_System SHALL memastikan checkout, contact, chat, platform, dan outlet berada pada workspace yang sama.
5. THE order number SHALL unique dalam workspace.
6. THE order item SHALL menyimpan product/variant/modifier/name/price snapshot.
7. THE Backend_System SHALL TIDAK mengubah order total akibat perubahan product setelah order dibuat.
8. THE orders API SHALL mendukung:
   - outlet filter
   - order status
   - payment status
   - channel
   - date range
   - search
   - pagination
   - sorting
9. Search SHALL dapat mencakup order number, customer name, phone, dan provider reference yang relevan.
10. THE order detail SHALL menyediakan:
    - customer
    - outlet
    - items
    - totals
    - payment summary
    - timeline
    - actions
11. THE Backend_System SHALL menjaga workspace and outlet access pada list dan detail.
12. THE Backend_System SHALL mencegah mutation dari stale/unauthorized client.
13. THE Backend_System SHALL mencatat create, status change, cancel, dan exceptional action.
14. THE Backend_System SHALL mendukung source channel:
    - Telegram
    - WhatsApp
    - Instagram/manual/future web jika diaktifkan.
15. THE Backend_System SHALL mempertahankan histori order saat contact/product/outlet dinonaktifkan.

---

## Requirement 19: Order Status, Timeline, and Actions

**Priority:** P0

**User Story:** Sebagai outlet operator, saya ingin order bergerak melalui status yang valid dan dapat diaudit.

### Acceptance Criteria

1. THE Backend_System SHALL mendukung minimum order statuses:
   - `pending_payment`
   - `new`
   - `accepted`
   - `preparing`
   - `ready`
   - `completed`
   - `cancelled`
2. THE Backend_System SHALL memisahkan order status dari payment status.
3. THE Backend_System SHALL memvalidasi transition menggunakan server-side state machine.
4. THE Backend_System SHALL menolak transition yang tidak diizinkan.
5. THE Backend_System SHALL mendukung transition:
   - pending_payment → new
   - pending_payment → cancelled
   - new → accepted
   - new → cancelled
   - accepted → preparing
   - accepted → cancelled
   - preparing → ready
   - ready → completed
6. Exceptional transition SHALL membutuhkan explicit permission, reason, dan audit.
7. Paid order cancellation SHALL membutuhkan elevated permission dan future refund/reconciliation handling.
8. THE Backend_System SHALL menyimpan order timeline event:
   - created
   - payment link created
   - paid
   - accepted
   - preparing
   - ready
   - completed
   - cancelled
   - human note
9. Timeline event SHALL menyimpan actor, timestamp, type, dan safe metadata.
10. THE Backend_System SHALL mendukung conditional actions berdasarkan status.
11. THE Backend_System SHALL mencegah completed order diubah tanpa explicit recovery flow.
12. THE Backend_System SHALL mengupdate inventory reservation/consumption sesuai lifecycle jika inventory aktif.
13. THE Backend_System SHALL mengirim customer notification setelah state commit berhasil.
14. THE Backend_System SHALL mencegah duplicate timeline event untuk idempotent operation.

---

## Requirement 20: Payments and Payment Attempts

**Priority:** P0

**User Story:** Sebagai customer, saya ingin menerima payment link dan membayar melalui gateway, sedangkan admin dapat melihat riwayat attempt tanpa memalsukan status pembayaran.

### Acceptance Criteria

1. THE Backend_System SHALL menyediakan entity `Payment`.
2. THE Payment SHALL memiliki minimum field:
   - `id`
   - `workspace_id`
   - `outlet_id`
   - `order_id`
   - `checkout_id`
   - `attempt_number`
   - `provider`
   - `provider_transaction_id`
   - `merchant_reference`
   - `method`
   - `status`
   - `gross_amount`
   - `provider_fee`
   - `net_amount`
   - `currency`
   - `payment_url`
   - `expires_at`
   - `paid_at`
   - `cancelled_at`
   - `reconciliation_status`
   - `metadata`
   - `created_at`
   - `updated_at`
3. THE Backend_System SHALL mendukung multiple payment attempts per order.
4. THE Backend_System SHALL memastikan attempt number monotonically increasing per order.
5. THE Backend_System SHALL mendukung statuses:
   - `created`
   - `pending`
   - `paid`
   - `failed`
   - `expired`
   - `cancelled`
   - `manual_review`
   - `partially_refunded`
   - `refunded`
6. THE Backend_System SHALL membuat payment link melalui configured payment provider adapter.
7. THE Backend_System SHALL menyimpan provider reference dan merchant reference.
8. THE Backend_System SHALL menjaga workspace, outlet, order, amount, dan currency consistency.
9. THE Backend_System SHALL TIDAK menyediakan standard endpoint `mark paid`.
10. THE Backend_System SHALL TIDAK menandai paid berdasarkan frontend, chat text, screenshot, atau AI response.
11. THE Backend_System SHALL mendukung resend current valid link.
12. THE Backend_System SHALL mendukung create new payment attempt bila link expired/failed.
13. THE Backend_System SHALL mencegah duplicate provider transaction creation akibat retry yang tidak aman.
14. THE Backend_System SHALL query provider jika create request timeout dan result tidak diketahui.
15. THE Backend_System SHALL menampilkan current payment summary pada order detail.
16. THE standalone payment monitoring API MAY disediakan untuk reconciliation/admin operations.
17. THE Backend_System SHALL mencatat payment link generation dan attempt creation.
18. THE Backend_System SHALL meredact full payment URL/token dari logs.
19. COD/manual payment method MAY didukung sebagai separate explicit policy dan tidak menggunakan resend link.

---

## Requirement 21: Payment Webhooks and Payment Events

**Priority:** P0

**User Story:** Sebagai sistem, saya ingin payment status diperbarui dari verified provider event, sehingga data pembayaran akurat dan aman.

### Acceptance Criteria

1. THE Backend_System SHALL menyediakan entity `PaymentEvent`.
2. THE PaymentEvent SHALL memiliki minimum field:
   - `id`
   - `workspace_id`
   - `outlet_id`
   - `payment_id`
   - `order_id`
   - `provider`
   - `provider_event_id`
   - `event_type`
   - `provider_status`
   - `signature_verified`
   - `processing_status`
   - `payload_hash`
   - `safe_payload`
   - `error_code`
   - `error_message`
   - `received_at`
   - `processed_at`
   - `created_at`
3. THE Backend_System SHALL verify signature/token using provider-specific adapter.
4. Invalid signature SHALL menghasilkan no mutation.
5. THE Backend_System SHALL normalize provider statuses into internal payment states.
6. THE Backend_System SHALL validate amount and currency before paid transition.
7. THE Backend_System SHALL validate provider transaction belongs to expected payment/order.
8. THE Backend_System SHALL enforce idempotency on provider event ID.
9. Duplicate event SHALL disimpan/ditandai sesuai policy tanpa duplicate mutation.
10. THE Backend_System SHALL not downgrade paid payment from stale pending/failed/expired event.
11. THE Backend_System SHALL handle paid event after expired link according to verified provider state and reconciliation policy.
12. THE Backend_System SHALL persist event before/with processing state.
13. THE Backend_System SHALL update payment and order summary atomically where possible.
14. Customer notification SHALL hanya dikirim setelah state persistence berhasil.
15. THE Backend_System SHALL support payment event statuses:
    - `received`
    - `verified`
    - `processed`
    - `ignored_duplicate`
    - `rejected`
    - `failed`
    - `retry_scheduled`
16. THE Backend_System SHALL store safe, redacted payload for investigation.
17. THE Backend_System SHALL expose payment event timeline to authorized admin.
18. THE Backend_System SHALL record processing retry count and last error.
19. THE Backend_System SHALL return provider-compatible success for already processed events.

---

## Requirement 22: Payment Reconciliation

**Priority:** P1

**User Story:** Sebagai finance/admin operator, saya ingin melihat payment yang tidak sinkron dengan gateway, sehingga masalah uang dapat ditemukan dan diperbaiki.

### Acceptance Criteria

1. THE Backend_System SHALL support reconciliation statuses:
   - `pending`
   - `matched`
   - `missing_webhook`
   - `unmatched`
   - `amount_mismatch`
   - `duplicate`
   - `provider_paid_order_pending`
2. THE Backend_System SHALL compare:
   - provider status
   - internal payment status
   - order payment summary
   - amount
   - currency
   - provider reference
3. THE Backend_System SHALL flag provider paid + internal pending.
4. THE Backend_System SHALL flag amount mismatch.
5. THE Backend_System SHALL flag missing webhook after configurable time.
6. THE Backend_System SHALL expose needs-attention query.
7. THE payment monitoring API SHALL support:
   - outlet
   - provider
   - method
   - payment status
   - reconciliation status
   - date range
   - search
8. THE Backend_System SHALL support authorized `sync with provider`.
9. Sync SHALL not blindly overwrite internal state without transition validation.
10. Retry processing SHALL re-run internal event processing, not forge provider payment.
11. Manual reconciliation action SHALL require elevated permission, reason, dan audit record.
12. THE Backend_System SHALL store reconciliation notes/history.
13. THE Backend_System SHALL support provider fee and net amount when provider supplies them.
14. Settlement/refund/dispute MAY remain future scope.
15. THE Backend_System SHALL TIDAK expose provider secrets through reconciliation API.

---

## Requirement 23: Telegram Commerce Flow

**Priority:** P0

**User Story:** Sebagai customer Telegram, saya ingin memilih outlet, melihat produk, membuat cart, checkout, dan menerima payment link.

### Acceptance Criteria

1. THE Backend_System SHALL support Telegram `/start`.
2. THE bot SHALL show active accessible outlets.
3. THE customer SHALL confirm outlet before product browsing.
4. THE Backend_System SHALL persist current outlet context in chat/session/cart.
5. THE bot SHALL only show products available at selected outlet.
6. THE bot SHALL support product pagination or category navigation.
7. THE bot SHALL support add-to-cart buttons/callbacks.
8. THE bot SHALL support view cart, update quantity, remove, dan clear cart.
9. THE bot SHALL display server-calculated totals.
10. THE bot SHALL require explicit checkout confirmation.
11. THE Backend_System SHALL create idempotent checkout/order.
12. THE bot SHALL send payment link for online payment.
13. THE bot SHALL send order confirmation.
14. THE bot SHALL send paid notification after verified payment webhook.
15. THE bot SHALL send order status updates according to notification policy.
16. Duplicate callback/update SHALL not create duplicate cart item/order/payment unexpectedly.
17. THE bot SHALL handle stale callback safely.
18. THE bot SHALL display friendly error for:
    - outlet closed
    - product unavailable
    - price changed
    - cart expired
    - payment provider unavailable
19. THE bot SHALL not expose internal IDs/secrets beyond safe public references.
20. Human takeover SHALL supersede AI auto-reply.
21. THE commerce logic SHALL live in backend services, not Telegram route only.
22. Telegram SHALL act as channel adapter, not source of truth.

---

## Requirement 24: WhatsApp Commerce Readiness

**Priority:** P2

**User Story:** Sebagai business owner, saya ingin backend commerce dapat digunakan ulang oleh WhatsApp, sehingga channel baru tidak membutuhkan rewrite order/payment logic.

### Acceptance Criteria

1. THE Backend_System SHALL keep cart, checkout, order, payment, and inventory services channel-agnostic.
2. THE Backend_System SHALL support channel metadata on chat/cart/order.
3. THE Backend_System SHALL support Meta/WhatsApp provider identities.
4. THE Backend_System SHALL provide product retailer identifiers when catalog sync is introduced.
5. THE Backend_System SHALL support incoming WhatsApp order payload mapping in future.
6. THE Backend_System SHALL not store critical commerce state only inside Telegram callbacks.
7. THE Backend_System SHALL allow same customer to have different platform identities linked to one contact.
8. THE Backend_System SHALL support payment link delivery through WhatsApp.
9. THE Backend_System SHALL support WhatsApp order status notification.
10. THE MVP SHALL NOT require simultaneous Telegram and WhatsApp checkout completion before release.
11. WhatsApp implementation SHALL reuse the same backend validation and business rules.
12. Meta catalog SHALL be treated as display/distribution channel, not product source of truth.

---

## Requirement 25: Notifications

**Priority:** P0

**User Story:** Sebagai customer dan admin, saya ingin menerima notifikasi yang relevan setelah state bisnis berhasil berubah.

### Acceptance Criteria

1. THE Backend_System SHALL support notification types:
   - payment link created
   - payment paid
   - payment failed/expired
   - order accepted
   - preparing
   - ready
   - completed
   - cancelled
   - platform needs attention
   - low stock
2. THE Backend_System SHALL support channel delivery through Telegram and future WhatsApp.
3. THE Backend_System SHALL persist notification intent/result if operationally required.
4. THE Backend_System SHALL send notification only after successful state commit.
5. THE Backend_System SHALL ensure notification idempotency.
6. Duplicate webhook SHALL not send duplicate notification.
7. THE Backend_System SHALL support retry for transient delivery failure.
8. THE Backend_System SHALL stop retries for permanent invalid destination.
9. THE Backend_System SHALL store safe delivery status and error.
10. THE Backend_System SHALL support workspace notification settings.
11. THE Backend_System SHALL support outlet-specific operational notification recipients.
12. THE Backend_System SHALL not leak sensitive provider/customer data in notification content.
13. THE Backend_System SHALL support templates with validated variables.
14. Template missing variable SHALL fail safely.
15. Notification delivery SHALL not roll back already committed payment/order state.

---

## Requirement 26: Complaints

**Priority:** P1

**User Story:** Sebagai customer support, saya ingin complaints dikaitkan dengan customer, order, dan outlet, sehingga penanganan masalah dapat dilacak.

### Acceptance Criteria

1. THE Backend_System SHALL preserve existing complaint functionality.
2. THE Complaint SHALL memiliki workspace ownership.
3. Complaint SHOULD support optional:
   - outlet_id
   - contact_id
   - chat_id
   - order_id
   - assigned_user_id
4. THE Backend_System SHALL support complaint statuses:
   - `open`
   - `in_progress`
   - `resolved`
   - `closed`
5. THE Backend_System SHALL support priority/severity.
6. THE complaints list SHALL honor workspace and outlet access.
7. THE Backend_System SHALL record complaint status timeline.
8. THE Backend_System SHALL support notes and attachment metadata.
9. THE Backend_System SHALL not delete related order/payment history.
10. Resolution action SHALL store actor, note, and timestamp.
11. THE Backend_System SHALL support opening related chat/order.
12. THE Backend_System SHALL preserve legacy data compatibility during migration.

---

## Requirement 27: Settings

**Priority:** P0

**User Story:** Sebagai owner/admin, saya ingin mengatur workspace, commerce, payments, notifications, AI, dan security tanpa mengekspos secrets.

### Acceptance Criteria

1. THE Backend_System SHALL provide settings scopes:
   - workspace
   - outlet
   - user
   - platform
   - provider
2. THE settings domain SHALL support sections:
   - general
   - commerce
   - orders and checkout
   - payments
   - notifications
   - AI providers
   - security
   - appearance/user preferences
   - danger zone
3. THE Backend_System SHALL provide effective settings resolution.
4. Outlet-specific setting MAY override workspace default for allowed keys.
5. THE Backend_System SHALL validate setting schema per section.
6. THE Backend_System SHALL support section-level save.
7. THE Backend_System SHALL provide safe default values.
8. Secrets SHALL be write-only/replace-only.
9. API SHALL return secret status such as `configured: true`, not plaintext.
10. Payment provider setting SHALL support:
    - provider
    - sandbox/production mode
    - credential configured state
    - webhook URL/status
    - connection test
11. AI provider setting SHALL support:
    - provider
    - base URL if allowed
    - model
    - credential configured state
    - connection test
12. Connected platform credential SHALL remain managed in platform domain, not duplicated.
13. THE Backend_System SHALL audit sensitive settings changes.
14. THE Backend_System SHALL require elevated permission for danger-zone actions.
15. THE Backend_System SHALL protect against accidental workspace destructive action.
16. THE Backend_System SHALL provide validation error per field.
17. THE Backend_System SHALL maintain backwards compatibility with existing setting keys where possible.

---

## Requirement 28: Files and Local Storage

**Priority:** P0

**User Story:** Sebagai system owner, saya ingin file media disimpan lokal dengan metadata aman, sehingga database tidak dibebani binary besar.

### Acceptance Criteria

1. THE Backend_System SHALL store uploaded binary files in configured local filesystem.
2. THE database SHALL store metadata/path, not file BLOB.
3. File metadata SHALL include:
   - id
   - workspace_id
   - owner/reference
   - original_name
   - safe_name
   - mime_type
   - size
   - storage_path
   - checksum if available
   - created_at
4. THE Backend_System SHALL validate file size.
5. THE Backend_System SHALL validate allowed MIME type.
6. THE Backend_System SHALL generate safe storage filename.
7. THE Backend_System SHALL prevent path traversal.
8. THE Backend_System SHALL ensure resolved path remains within configured upload root.
9. Private file access SHALL require authorization.
10. THE Backend_System SHALL support local file deletion according to domain lifecycle.
11. Runtime upload files SHALL be excluded from Git.
12. THE Backend_System SHALL not execute uploaded files.
13. THE Backend_System SHALL log file operation metadata without logging sensitive content.
14. THE Backend_System SHALL support backup/restore of required local media.
15. Missing file SHALL not corrupt database operation; API SHALL return safe error.
16. THE Backend_System SHALL support legacy upload metadata migration.

---

## Requirement 29: API Contract and Error Format

**Priority:** P0

**User Story:** Sebagai frontend developer, saya ingin API konsisten, sehingga halaman admin dapat diimplementasikan dan dipelihara dengan mudah.

### Acceptance Criteria

1. THE Backend_System SHALL use REST-style endpoints for admin resources.
2. Base path SHALL be `/api` with future `/api/v1` readiness.
3. Success response SHOULD use:
   ```json
   {
     "data": {},
     "meta": {
       "request_id": "req_..."
     }
   }
   ```
4. Error response SHALL use:
   ```json
   {
     "error": {
       "code": "ERROR_CODE",
       "message": "Safe message",
       "details": {}
     },
     "meta": {
       "request_id": "req_..."
     }
   }
   ```
5. THE Backend_System SHALL generate request ID.
6. THE Backend_System SHALL include request ID in logs and responses.
7. List APIs SHALL support pagination.
8. List APIs SHOULD support sorting and validated filters.
9. THE Backend_System SHALL reject unknown/invalid filter values.
10. THE Backend_System SHALL return:
    - `400/422` validation
    - `401` authentication
    - `403` authorization
    - `404` not found
    - `409` conflict/state/idempotency
    - `429` rate limit
    - `502` provider failure
    - `504` timeout
    - `500` unexpected error
11. THE Backend_System SHALL not expose stack trace in production response.
12. THE Backend_System SHALL map provider errors into stable internal codes.
13. API resources SHALL not expose encrypted secret fields.
14. THE Backend_System SHALL preserve current public route compatibility during gradual refactor.
15. Breaking API changes SHALL require versioning or migration plan.
16. DELETE operations SHALL prefer archive/disable for historical business resources.

---

## Requirement 30: Workspace and Outlet Security

**Priority:** P0

**User Story:** Sebagai platform owner, saya ingin workspace dan outlet data terisolasi, sehingga tidak ada cross-account atau cross-outlet data leak.

### Acceptance Criteria

1. THE Backend_System SHALL derive `workspace_id` from authenticated request context.
2. THE Backend_System SHALL validate active workspace membership.
3. THE Backend_System SHALL validate role permission.
4. THE Backend_System SHALL validate outlet access for outlet-scoped operation.
5. THE Backend_System SHALL apply workspace filter to all tenant-owned repository queries.
6. Update/delete query SHALL include workspace ownership condition.
7. Outlet-scoped query SHALL include allowed outlet filter.
8. THE Backend_System SHALL not trust route/query/body workspace or outlet identifiers without validation.
9. Resource from another workspace SHALL return safe 404/403 according to policy.
10. THE Backend_System SHALL prevent ID enumeration from leaking existence.
11. THE Backend_System SHALL apply rate limit to auth, webhook, AI, upload, and sensitive actions.
12. THE Backend_System SHALL use secure headers/CORS configuration.
13. THE Backend_System SHALL validate all request payloads.
14. THE Backend_System SHALL sanitize logging.
15. THE Backend_System SHALL separate platform-admin privileged operations from normal tenant flow.
16. THE Backend_System SHALL provide security tests for workspace and outlet isolation.
17. THE Backend_System SHALL support future database RLS without changing high-level authorization contract.
18. THE Backend_System SHALL enforce least privilege on provider credentials.
19. THE Backend_System SHALL protect secret environment variables from source control.
20. THE Backend_System SHALL audit repeated access-denied/security-sensitive events where useful.

---

## Requirement 31: Audit Logging

**Priority:** P0

**User Story:** Sebagai owner/admin, saya ingin perubahan sensitif dapat dilacak, sehingga investigasi dan recovery lebih mudah.

### Acceptance Criteria

1. THE Backend_System SHALL provide `AuditLog`.
2. AuditLog SHALL include:
   - `id`
   - `workspace_id`
   - `outlet_id` optional
   - `user_id`
   - `action`
   - `resource`
   - `resource_id`
   - `details`
   - `request_id`
   - `ip_address`
   - `user_agent`
   - `timestamp`
3. THE Backend_System SHALL audit:
   - login/logout/failed login
   - role/membership changes
   - outlet access changes
   - outlet status changes
   - platform credential changes
   - AI agent config changes
   - product price/status changes
   - inventory adjustment
   - order cancellation/exceptional transition
   - payment retry/reconciliation
   - sensitive settings changes
4. Audit details SHALL be redacted.
5. Audit log SHALL be append-only for normal users.
6. THE Backend_System SHALL prevent normal tenant admin from editing audit entries.
7. Audit list SHALL support workspace, outlet, actor, action, resource, dan date filters.
8. Audit retention SHALL follow operations/compliance policy.
9. THE Backend_System SHALL preserve audit records when target resource is archived/deleted.
10. Audit write failure for critical action SHALL be logged and surfaced according to policy.
11. THE Backend_System SHALL avoid storing full sensitive payload.
12. Audit export MAY be provided for authorized roles.

---

## Requirement 32: Background Jobs, Retry, and Scheduling

**Priority:** P1

**User Story:** Sebagai system operator, saya ingin pekerjaan berat/retry diproses terpisah, sehingga webhook dan API tetap responsif.

### Acceptance Criteria

1. THE Backend_System SHALL maintain explicit worker boundary.
2. MVP MAY use in-process worker/queue.
3. THE Backend_System SHALL NOT claim in-process jobs survive process restart.
4. Job types MAY include:
   - notification delivery
   - webhook retry
   - payment reconciliation
   - follow-up messages
   - cart/checkout expiration
   - cleanup
5. Every job SHALL have:
   - type
   - payload/reference
   - attempt count
   - created time
   - next run time
   - status
   - last error
6. Retry SHALL use capped exponential backoff with jitter.
7. Non-idempotent job SHALL not be blindly retried.
8. THE Backend_System SHALL distinguish retriable and permanent errors.
9. Max attempts SHALL be configurable by job type.
10. Failed job SHALL be observable.
11. THE Backend_System SHALL prevent duplicate scheduled job using idempotency/deduplication key where applicable.
12. Graceful shutdown SHALL stop accepting new jobs and handle in-flight jobs safely.
13. THE Backend_System SHALL support future Redis/BullMQ or equivalent migration.
14. Durable queue SHALL become required before multi-instance production if jobs are business critical.
15. THE Backend_System SHALL record worker metrics and failures.

---

## Requirement 33: Analytics and Reports

**Priority:** P1

**User Story:** Sebagai owner, saya ingin melihat performa order, payment, product, dan outlet, sehingga keputusan bisnis dapat dibuat.

### Acceptance Criteria

1. THE Backend_System SHALL provide basic aggregate endpoints for:
   - order count
   - gross sales
   - paid orders
   - pending payment
   - cancelled orders
   - product sales
   - outlet performance
   - channel performance
2. Analytics SHALL support outlet filter.
3. Analytics SHALL support date range.
4. Analytics SHALL respect workspace/outlet access.
5. Monetary analytics SHALL use paid/qualified order definition explicitly.
6. THE Backend_System SHALL not double-count duplicate payment attempts.
7. THE Backend_System SHALL distinguish order gross total, payment gross, fee, dan net where available.
8. Dashboard summary SHALL use defined timezone boundaries.
9. THE Backend_System SHALL document aggregation definition.
10. Heavy analytics SHOULD use optimized aggregate query/precomputation when necessary.
11. Report export MAY support CSV/JSON first.
12. Generated report SHALL include filter context.
13. THE Backend_System SHALL prevent report access across workspace/outlet.
14. Payment reconciliation metrics MAY include needs-attention count.
15. Analytics is not allowed to mutate transactional data.

---

## Requirement 34: Database, Query Performance, and Indexing

**Priority:** P0

**User Story:** Sebagai developer, saya ingin query tetap cepat saat outlet, chat, order, dan payment bertambah.

### Acceptance Criteria

1. THE Backend_System SHALL define indexes based on actual query contracts.
2. Tenant-owned collections/tables SHALL index `workspace_id`.
3. Outlet-scoped high-volume data SHALL index `workspace_id + outlet_id`.
4. Order list SHOULD support composite indexes for common combinations:
   - workspace + outlet + created_at
   - workspace + status + created_at
   - workspace + payment status + created_at
5. Message queries SHOULD index:
   - workspace + chat + created_at
   - platform_message_id uniqueness where available
6. Chat list SHOULD index:
   - workspace + last_message_at
   - workspace + assigned_user_id + last_message_at
   - workspace + outlet + last_message_at
7. Product availability SHOULD enforce unique product + outlet.
8. Cart SHOULD index active cart lookup keys.
9. Payment SHOULD index:
   - workspace + created_at
   - workspace + outlet + created_at
   - provider transaction ID
   - merchant reference
   - reconciliation status
10. Webhook/payment event SHALL enforce provider event uniqueness.
11. Inventory SHALL enforce unique outlet + product + variant.
12. Query list SHALL use pagination and maximum page size.
13. THE Backend_System SHALL avoid unbounded `.find()` on large collections.
14. Search SHALL use normalized/indexed fields or dedicated search strategy as scale grows.
15. THE Backend_System SHALL measure slow queries.
16. Index addition/removal SHALL be reviewed for write/storage cost.
17. THE Backend_System SHALL provide migration/index scripts.
18. The target response for common admin list SHOULD remain responsive under expected MVP volume.
19. THE Backend_System SHALL preserve query semantics during MongoDB-to-PostgreSQL migration.
20. THE Backend_System SHALL provide validation queries after migration.

---

## Requirement 35: Repository Layer and Database Migration

**Priority:** P0

**User Story:** Sebagai developer, saya ingin persistence berada di repository layer, sehingga database dapat dimigrasikan tanpa rewrite business logic.

### Acceptance Criteria

1. THE Backend_System SHALL use repository abstraction for new commerce domains.
2. Repository method SHALL receive workspace scope.
3. Outlet-scoped repository method SHALL receive allowed outlet scope.
4. Repository SHALL not return HTTP response objects.
5. Service SHALL not rely on Mongoose-specific details where avoidable.
6. Route SHALL not directly access model for new/refactored domain.
7. THE current runtime SHALL remain MongoDB/Mongoose until migration is approved.
8. THE documentation SHALL not falsely claim PostgreSQL is active before cutover.
9. Migration SHALL be incremental by domain/route.
10. Migration sequence SHALL include:
    - contract freeze
    - current behavior tests
    - target schema
    - backfill
    - validation
    - repository implementation
    - staged cutover
    - monitoring
11. SQL migration SHALL use unique increasing numbers.
12. Applied migration SHALL not be edited silently.
13. Migration failure SHALL stop dependent cutover.
14. Destructive migration SHALL require backup and rollback/cutover plan.
15. THE Backend_System SHALL maintain migration state.
16. Validation query SHALL be separate from executable migration when appropriate.
17. THE Backend_System SHALL support dual-read validation only when risk is controlled.
18. Dual-write SHALL not be introduced without explicit consistency strategy.
19. Data mapping SHALL document MongoDB IDs, references, timestamps, status enums, and nullable semantics.
20. Repository contract tests SHALL be reusable across database implementations.

---

## Requirement 36: Observability and Health Checks

**Priority:** P0

**User Story:** Sebagai operator, saya ingin mengetahui kesehatan API, database, webhook, dan provider, sehingga masalah dapat ditemukan cepat.

### Acceptance Criteria

1. THE Backend_System SHALL use structured logging.
2. Log SHALL include when available:
   - request_id
   - workspace_id
   - outlet_id
   - user_id
   - chat_id
   - order_id
   - payment_id
   - provider
   - event_id
   - operation
   - duration_ms
   - result
3. Log SHALL not include:
   - password
   - OTP
   - JWT
   - full auth header
   - API secret
   - provider credential
4. THE Backend_System SHALL provide liveness endpoint.
5. THE Backend_System SHALL provide readiness endpoint.
6. Readiness SHALL validate database availability.
7. Optional provider health SHALL be reported separately.
8. THE Backend_System SHALL expose/record metrics:
   - request count/duration
   - webhook received/duplicate/failed
   - AI requests/errors
   - order created
   - checkout failed
   - payment created/paid/reconciliation
   - notification failure
   - inventory adjustment
9. THE Backend_System SHALL record unhandled error with request ID.
10. THE Backend_System SHALL support alerting threshold for critical failures.
11. Payment webhook signature failures SHALL be observable without exposing secret.
12. Repeated provider failures SHALL move platform/provider health to needs attention.
13. THE Backend_System SHALL support tracing correlation through request/event/job ID.
14. Production log level SHALL be configurable.
15. Sensitive payload logging SHALL be disabled by default.

---

## Requirement 37: Testing and Quality Assurance

**Priority:** P0

**User Story:** Sebagai development team, saya ingin automated test melindungi critical flow dan tenant isolation.

### Acceptance Criteria

1. THE Backend_System SHALL have unit, integration, security, and E2E test layers.
2. Tests SHALL cover workspace isolation.
3. Tests SHALL cover outlet access.
4. Tests SHALL cover webhook idempotency.
5. Tests SHALL cover payment signature verification.
6. Tests SHALL cover payment amount mismatch.
7. Tests SHALL cover payment no-downgrade.
8. Tests SHALL cover human takeover.
9. Tests SHALL cover single-outlet cart.
10. Tests SHALL cover checkout idempotency.
11. Tests SHALL cover order state transition.
12. Tests SHALL cover inventory reservation/release if enabled.
13. Tests SHALL use isolated database/test fixtures.
14. External providers SHALL be mocked for automated tests.
15. Sandbox/manual tests SHALL be documented separately.
16. Test data SHALL not contain production secret/customer data.
17. Build and lint SHALL run in CI.
18. Critical integration/security tests SHALL block release.
19. Migration validation SHALL be tested.
20. Regression checklist SHALL protect existing CRM behavior.
21. THE Backend_System SHALL maintain deterministic webhook fixtures.
22. Tests SHALL verify error code and status.
23. Security test SHALL attempt manipulated workspace/outlet IDs.
24. E2E SHALL cover Telegram order flow from outlet selection to paid notification.
25. Definition of Done SHALL require relevant tests and docs update.

---

## Requirement 38: Deployment, Backup, and Production Readiness

**Priority:** P1

**User Story:** Sebagai operator, saya ingin deployment dapat diulang dan dipulihkan, sehingga system aman digunakan.

### Acceptance Criteria

1. THE Backend_System SHALL support separate local, staging, and production environments.
2. Provider sandbox and production credentials SHALL be separated.
3. THE Backend_System SHALL validate required environment variables at startup.
4. Missing critical environment SHALL stop startup with safe message.
5. `.env` SHALL be excluded from Git.
6. Runtime uploads SHALL be excluded from Git.
7. THE Backend_System SHALL support graceful shutdown.
8. Graceful shutdown SHALL:
   - stop new request intake
   - allow bounded in-flight completion
   - stop workers
   - close database connection
9. THE deployment process SHALL be documented.
10. THE migration process SHALL be documented.
11. Production migration SHALL require backup.
12. Backup scope SHALL include:
    - database
    - required local files
    - migration state
    - configuration inventory
13. Restore process SHALL be documented and periodically tested.
14. THE Backend_System SHALL provide rollback strategy.
15. Production readiness checklist SHALL include:
    - security
    - payment webhook
    - idempotency
    - observability
    - backup
    - restore
    - rate limits
    - secret rotation
16. Development tunnel SHALL not be production dependency.
17. Deployment SHALL preserve stable webhook URLs.
18. Health checks SHALL be used by deployment/runtime platform.
19. THE Backend_System SHALL support incident response and postmortem process.
20. Release SHALL not proceed if critical security/payment tests fail.

---

# Cross-Cutting Correctness Properties

## Property 1: Workspace Isolation

*For any* normal authenticated request in workspace A, result and mutation SHALL only involve resources with `workspace_id = A`.

## Property 2: Outlet Authorization

*For any* outlet-scoped request, a user without active outlet access SHALL not read or mutate the outlet resource.

## Property 3: Workspace–Outlet Consistency

*For any* record containing `workspace_id` and `outlet_id`, the outlet SHALL belong to that workspace.

## Property 4: Product Availability

*For any* add-to-cart operation, product SHALL be active and available at the selected outlet.

## Property 5: Effective Price Authority

*For any* cart item, the applied price SHALL equal backend-calculated effective price.

## Property 6: Single-Outlet Cart

*For any* active cart, all items SHALL belong to one workspace and one outlet.

## Property 7: Checkout Idempotency

*For any* repeated checkout request with the same idempotency key, at most one order SHALL be created.

## Property 8: Order Snapshot Integrity

*For any* existing order, later product price/name changes SHALL not alter the order snapshot.

## Property 9: Valid Order Transition

*For any* invalid transition, THE Backend_System SHALL reject with `ORDER_INVALID_TRANSITION`.

## Property 10: Payment Authority

*For any* payment, state SHALL not become paid from client input, AI, message text, or unverified webhook.

## Property 11: Payment Amount Match

*For any* provider-paid event, amount and currency SHALL match expected values.

## Property 12: Payment Event Idempotency

*For any* duplicate payment event, no duplicate state transition or notification SHALL occur.

## Property 13: No Paid Downgrade

*For any* paid payment, stale pending/failed/expired event SHALL not downgrade status.

## Property 14: Webhook Signature Safety

*For any* invalid payment signature, no payment/order mutation SHALL occur.

## Property 15: Human Takeover

*For any* chat with takeover active, inbound message SHALL not trigger AI auto-reply.

## Property 16: Message Idempotency

*For any* duplicate platform message ID, only one internal message SHALL exist.

## Property 17: Inventory Non-Negativity

*For any* inventory operation, on-hand, reserved, and available quantity SHALL not become negative.

## Property 18: Reservation Release Exactly Once

*For any* cancelled/expired order, reservation SHALL be released exactly once.

## Property 19: Stock Movement Completeness

*For any* stock mutation, a stock movement audit record SHALL exist.

## Property 20: Secret Confidentiality

*For any* API response or normal log, plaintext provider secret SHALL not be present.

## Property 21: File Path Safety

*For any* uploaded filename, resolved storage path SHALL remain inside upload root.

## Property 22: Repository Scope

*For any* tenant-owned repository operation, workspace scope SHALL be mandatory.

## Property 23: Migration Ordering

*For any* migration set, migrations SHALL execute in strict unique ascending order.

## Property 24: Notification After Commit

*For any* notification caused by state change, notification SHALL be sent only after persistence succeeds.

## Property 25: Outlet Context Preservation

*For any* Telegram commerce session, confirmed outlet SHALL be used until customer explicitly changes it.

## Property 26: Cart Outlet Change Safety

*For any* non-empty cart, outlet change SHALL require explicit confirmation and safe clear/rebuild.

## Property 27: Audit for Sensitive Action

*For any* sensitive admin action, an audit record SHALL be produced.

## Property 28: Provider Abstraction

*For any* supported payment provider, equivalent normalized provider events SHALL produce equivalent domain behavior.

## Property 29: Resource Historical Integrity

*For any* deactivated outlet/product/contact, historical order/payment records SHALL remain intact.

## Property 30: Existing CRM Preservation

*For any* marketplace implementation, existing chat, contact, platform, AI, and human takeover behavior SHALL not regress without approved migration.

---

# Error Codes

```txt
AUTH_REQUIRED
AUTH_INVALID
TOKEN_EXPIRED
ACCOUNT_DISABLED
WORKSPACE_NOT_FOUND
WORKSPACE_ACCESS_DENIED
WORKSPACE_SUSPENDED
MEMBERSHIP_INACTIVE
OUTLET_NOT_FOUND
OUTLET_ACCESS_DENIED
OUTLET_INACTIVE
OUTLET_CLOSED
PLATFORM_NOT_FOUND
PLATFORM_DISCONNECTED
WEBHOOK_SIGNATURE_INVALID
WEBHOOK_EVENT_DUPLICATE
WEBHOOK_PROCESSING_FAILED
CONTACT_NOT_FOUND
CHAT_NOT_FOUND
CHAT_TAKEOVER_CONFLICT
MESSAGE_DUPLICATE
AI_PROVIDER_UNAVAILABLE
AI_ACTION_REJECTED
PRODUCT_NOT_FOUND
PRODUCT_ARCHIVED
PRODUCT_UNAVAILABLE_AT_OUTLET
INVALID_PRODUCT_PRICE
INVENTORY_NOT_TRACKED
INSUFFICIENT_STOCK
STOCK_ADJUSTMENT_INVALID
CART_NOT_FOUND
CART_EMPTY
CART_EXPIRED
CART_OUTLET_MISMATCH
CHECKOUT_INVALID
CHECKOUT_EXPIRED
CHECKOUT_ALREADY_CONVERTED
CHECKOUT_IDEMPOTENCY_CONFLICT
ORDER_NOT_FOUND
ORDER_INVALID_TRANSITION
ORDER_ALREADY_CANCELLED
PAYMENT_NOT_FOUND
PAYMENT_PROVIDER_UNAVAILABLE
PAYMENT_SIGNATURE_INVALID
PAYMENT_AMOUNT_MISMATCH
PAYMENT_EVENT_DUPLICATE
PAYMENT_STATE_CONFLICT
PAYMENT_RECONCILIATION_REQUIRED
FILE_TOO_LARGE
FILE_TYPE_NOT_ALLOWED
FILE_PATH_INVALID
RATE_LIMITED
VALIDATION_FAILED
INTERNAL_ERROR
```

---

# MVP Scope Boundary

## Included in MVP

```txt
single workspace UI
multi-outlet data model
outlet access
Telegram platform
contacts
chats/messages
AI + human takeover
products
product availability per outlet
cart
checkout
orders
payment link
payment webhook
paid notification
orders admin operations
settings
local file metadata/storage
workspace/outlet security
basic analytics
critical tests
```

## Optional / Phase After Core MVP

```txt
standalone payment reconciliation page
inventory quantity tracking
stock reservations
advanced reports
WhatsApp checkout
refund workflow
settlement monitoring
durable queue
PostgreSQL cutover
```

## Explicitly Out of Scope for Initial MVP

```txt
multi-seller marketplace
seller onboarding
commission split
franchise payout automation
wallet
advanced accounting ledger
chargeback/dispute management
automatic refund
public customer web storefront
complex voucher/promotions engine
multi-currency
warehouse planning
ERP/POS replacement
microservices rewrite
Kubernetes requirement
```

---

# Requirement Traceability by Delivery Phase

## Phase 0 — Stabilization

```txt
R2 Authentication
R7 Webhook idempotency
R29 API/error format
R30 Security
R31 Audit
R36 Observability
R37 Testing
```

## Phase 1 — Multi-Outlet Foundation

```txt
R1 Workspace
R3 Membership
R4 Outlets
R5 Outlet access
R30 Workspace/outlet security
```

## Phase 2 — Catalog

```txt
R12 Product catalog
R13 Outlet availability/pricing
```

## Phase 3 — Telegram Cart and Checkout

```txt
R16 Cart
R17 Checkout
R23 Telegram commerce
```

## Phase 4 — Order and Payment

```txt
R18 Orders
R19 Order transitions
R20 Payments
R21 Payment webhooks/events
R25 Notifications
```

## Phase 5 — Admin Operations

```txt
R6 Connected platforms
R8 Contacts
R9 Chats
R10 Human takeover
R11 AI agents
R27 Settings
R33 Analytics
```

## Phase 6 — Hardening and Expansion

```txt
R14 Inventory
R15 Stock movement
R22 Reconciliation
R24 WhatsApp readiness
R32 Durable jobs
R35 Migration
R38 Production readiness
```

---

# Definition of Done for a Requirement

A requirement is considered complete only when:

1. acceptance criteria are implemented or explicitly marked deferred;
2. route/API contract is documented;
3. request validation exists;
4. workspace scope is enforced;
5. outlet scope is enforced when applicable;
6. business logic resides in service layer;
7. persistence uses approved repository/query boundary;
8. provider calls use integration adapter;
9. error codes are stable and safe;
10. logs do not expose secrets;
11. audit is added for sensitive action;
12. unit/integration/security tests are added;
13. frontend/backend contract is updated;
14. existing CRM regression tests pass;
15. build and lint pass;
16. migration and rollback impact are documented;
17. relevant docs are updated;
18. manual sandbox verification is documented where external provider is involved.

---

# Final Requirement Statement

The SelaluTeh backend SHALL evolve from an existing chatbot CRM into a maintainable commerce platform without a destructive rewrite.

The system SHALL preserve existing CRM behavior while introducing:

```txt
Workspace
→ Outlets
→ Products
→ Outlet Availability
→ Cart
→ Checkout
→ Order
→ Payment
→ Fulfillment
```

Telegram SHALL be the first commerce channel, but all core commerce rules SHALL remain channel-agnostic.

The backend SHALL be the authoritative source for:

```txt
product
price
availability
inventory
cart
checkout
order
payment
workspace access
outlet access
```

AI, Telegram, WhatsApp, payment gateways, and the admin frontend SHALL operate through validated backend contracts and SHALL NOT bypass security, state machines, idempotency, or payment verification rules.
