# All Product Docs Combined

This file combines all docs in `docs/backend/01-product` for AI/context review. Do not treat this as executable code.


---


# File: README.md


# 01 Product Docs — SelaluTeh Chatbot CRM / Telegram Marketplace MVP

Folder ini berisi dokumen produk untuk backend **SelaluTeh Chatbot CRM** yang diarahkan menjadi **Telegram-first Marketplace MVP**.

Dokumen di folder ini menjawab pertanyaan produk:

- produk ini dibuat untuk siapa?
- masalah apa yang diselesaikan?
- fitur apa saja yang masuk MVP?
- fitur apa yang ditunda?
- seperti apa persona user/admin/customer?
- bagaimana user story dan acceptance criteria?
- bagaimana arah brand, logo, dan personality produk?

## Product Direction

Produk ini bukan marketplace web biasa. Produk ini adalah **chat-first commerce platform**:

```txt
Customer membeli lewat Telegram
↓
AI assistant membantu memilih produk
↓
Backend mengelola product, cart, checkout, order, dan payment
↓
Admin/human agent bisa takeover chat dari dashboard CRM
```

## Relationship With Other Docs

| Folder | Fungsi |
|---|---|
| `01-product` | Product scope, persona, feature, requirements, user stories |
| `02-flows` | Alur proses: auth, checkout, Telegram commerce, payment, webhook |
| `03-business-rules` | Aturan bisnis dan validasi domain |
| `04-tech-spec` | Arsitektur teknis backend |
| `05-api-spec` | Kontrak endpoint/API |
| `06-data` | Database schema, migration, RLS, indexes |
| `08-security` | Security model, secrets, webhook verification |
| `10-testing` | Test strategy dan test cases |
| `11-sprint` | Roadmap implementasi sprint |

## MVP Summary

MVP yang direkomendasikan adalah **single-merchant Telegram commerce**, bukan multi-seller marketplace penuh.

Customer bisa:

1. Start bot di Telegram.
2. Browse/search produk.
3. Tanya AI tentang produk.
4. Tambah produk ke cart.
5. Checkout.
6. Dapat payment link sandbox.
7. Bayar.
8. Dapat notifikasi order paid.
9. Cek status order.

Admin bisa:

1. Login dashboard.
2. Kelola produk.
3. Lihat chat/customer.
4. Takeover percakapan.
5. Lihat order.
6. Update status fulfillment.
7. Melihat payment status.

## Files

| File | Purpose |
|---|---|
| `product-vision.md` | Visi, positioning, dan product principles |
| `requirements.md` | Functional/non-functional requirements |
| `mvp-scope.md` | Scope MVP, excluded features, release boundary |
| `feature-list.md` | Daftar fitur per area produk |
| `user-personas.md` | Persona utama: owner, admin, human agent, customer |
| `user-stories.md` | User stories dan acceptance criteria |
| `customer-journey.md` | Journey customer dari Telegram sampai paid order |
| `admin-experience.md` | Pengalaman admin mengelola chat, produk, order |
| `brand-personality.md` | Kepribadian brand/product experience |
| `logo-direction.md` | Arah visual logo dan penggunaannya |
| `logo-system.md` | Sistem logo, lockup, size, placement, misuse |
| `success-metrics.md` | KPI dan analytics product |
| `release-plan.md` | Tahapan release product MVP |
| `out-of-scope.md` | Hal yang sengaja tidak masuk MVP |
| `risks-and-assumptions.md` | Risiko product dan asumsi MVP |

## Important Product Rule

AI tidak boleh menjadi sumber kebenaran order/payment.

```txt
AI = assistant/recommender/conversation layer
Backend = source of truth untuk cart, order, payment, inventory, dan status
```


---


# File: product-vision.md


# Product Vision

## One-Liner

**SelaluTeh Chatbot CRM / Telegram Marketplace MVP** adalah platform commerce berbasis chat yang memungkinkan customer membeli produk lewat Telegram, dibantu AI assistant, dengan admin dashboard untuk mengelola chat, produk, order, dan payment.

## Product Positioning

Produk ini berada di antara:

1. **Chatbot CRM** — mengelola percakapan customer dari Telegram, WhatsApp, Instagram.
2. **AI Customer Service** — membalas FAQ dan membantu rekomendasi produk.
3. **Conversational Commerce** — customer bisa browse, cart, checkout, dan bayar dari alur chat.
4. **Admin Operations Dashboard** — admin bisa takeover chat dan mengelola order.

## Core Product Promise

> Customer bisa belanja tanpa membuka website, cukup chat di Telegram. Admin tetap punya kontrol penuh lewat dashboard CRM.

## Target MVP

MVP berfokus pada **Telegram-first single merchant commerce**.

MVP bukan:

- multi-seller marketplace,
- web storefront penuh,
- POS system,
- inventory ERP,
- logistics aggregator,
- full automation refund system.

## Product Principles

### 1. Chat-first, not web-first

Telegram menjadi storefront utama. Web dashboard dipakai admin, bukan customer.

### 2. Deterministic commerce state

Cart, order, payment, dan stock harus dikelola backend secara deterministic. AI tidak boleh membuat status transaksi tanpa validasi backend.

### 3. Human takeover remains first-class

Karena produk berasal dari CRM chatbot, fitur human takeover tetap penting. AI harus berhenti saat chat diambil alih human agent.

### 4. Workspace-based multi-tenancy

Setiap data tenant harus terikat ke `workspace_id`. Ini menjaga sistem aman untuk multi-tenant di masa depan.

### 5. Start simple, scale later

MVP hanya single merchant. Multi-seller, commission, seller wallet, dan payout ditunda.

## Strategic Differentiation

| Area | Common Commerce App | SelaluTeh Telegram Marketplace MVP |
|---|---|---|
| Entry point | Website/app | Telegram chat |
| Assistance | Static catalog | AI shopping assistant |
| CS | Separate support tool | Built-in CRM inbox + takeover |
| Checkout | Web cart | Chat-guided cart + payment link |
| Admin | E-commerce dashboard | CRM + commerce dashboard |

## Product Narrative

Customer sering lebih nyaman bertanya dulu sebelum membeli. Di banyak bisnis lokal, transaksi terjadi di chat, bukan website. Produk ini mengubah chat menjadi sistem commerce yang terstruktur: customer tetap merasa sedang ngobrol, tapi backend tetap mencatat produk, cart, order, dan payment secara rapi.

## Long-Term Vision

Setelah MVP stabil, produk bisa berkembang menjadi:

- WhatsApp-first commerce,
- Instagram DM commerce,
- multi-platform unified inbox,
- AI sales assistant,
- seller dashboard,
- multi-seller marketplace,
- campaign automation,
- customer segmentation,
- analytics commerce dan support.


---


# File: requirements.md


# Product Requirements

## Scope

Dokumen ini mendefinisikan kebutuhan produk untuk **Telegram-first Marketplace MVP** di atas existing Chatbot CRM.

## Functional Requirements

### Authentication & Workspace

- Owner dapat register workspace.
- Owner dapat login.
- User harus verified sebelum login.
- User memiliki role: `owner`, `super`, atau `agent`.
- Semua data operasional harus workspace-scoped.

### Platform Integration

- Owner dapat menambahkan platform Telegram.
- Backend dapat menyimpan token Telegram bot.
- Owner dapat menjalankan setWebhook dari dashboard/API.
- Webhook Telegram dapat menerima message dan callback query.
- Webhook harus idempotent agar duplicate update tidak menggandakan message/order.

### Chat & CRM

- Customer Telegram harus dibuat sebagai contact.
- Chat dibuat atau ditemukan berdasarkan workspace, platform, dan contact.
- Semua message masuk disimpan.
- AI dapat membalas jika human takeover tidak aktif.
- Human agent dapat takeover chat.
- Setelah takeover aktif, AI tidak boleh membalas chat tersebut.
- Admin dapat resolve chat.

### AI Assistant

- AI dapat menjawab FAQ dan pertanyaan produk.
- AI dapat membantu rekomendasi produk.
- AI boleh mengusulkan action seperti search product atau add to cart.
- Backend harus memvalidasi semua action sebelum dieksekusi.
- AI tidak boleh mengubah payment/order status.
- AI harus escalate ke human jika confidence rendah atau user marah.

### Product Catalog

- Admin dapat membuat produk.
- Admin dapat update produk.
- Admin dapat menonaktifkan produk.
- Produk memiliki nama, deskripsi, harga, status, dan optional image.
- Produk dapat memiliki variant.
- Produk dapat memiliki category.
- Produk yang inactive tidak boleh muncul di Telegram storefront.

### Cart

- Customer dapat menambahkan produk ke cart dari Telegram.
- Customer dapat melihat cart.
- Customer dapat mengubah quantity.
- Customer dapat menghapus item.
- Cart bersifat per customer/chat/workspace.
- Cart harus memiliki status seperti `active`, `checked_out`, `abandoned`, `cancelled`.

### Checkout

- Customer harus confirm cart sebelum order dibuat.
- Backend membuat checkout session.
- Backend membuat order dengan `order_items`.
- Checkout harus memiliki expiration policy.
- Backend harus mencegah duplicate checkout dari cart yang sama.

### Orders

- Order harus punya status lifecycle.
- Order harus memiliki item terstruktur.
- Order legacy dari AI form tetap didukung selama transisi.
- Admin dapat melihat dan update status order.
- Customer dapat cek status order dari Telegram.

### Payments

- MVP menggunakan payment link dari payment gateway sandbox.
- Backend membuat payment record untuk order.
- Backend menerima webhook payment.
- Webhook payment harus diverifikasi.
- Payment event harus disimpan.
- Order berubah menjadi paid hanya setelah webhook valid.
- Customer menerima notifikasi setelah payment success.

### Files & Media

- File binary tetap disimpan di local server storage.
- Database hanya menyimpan metadata file.
- Product images, payment proof, chat attachments, dan agent files memiliki folder terpisah.
- Jangan menyimpan absolute server path di database.

### Admin Dashboard

- Admin dapat melihat inbox.
- Admin dapat melihat messages.
- Admin dapat takeover chat.
- Admin dapat CRUD product.
- Admin dapat melihat orders.
- Admin dapat melihat payments.
- Admin dapat melihat complaints.

## Non-Functional Requirements

### Security

- Semua admin API harus auth required.
- Semua query harus workspace-scoped.
- Public webhook endpoint harus memverifikasi provider jika memungkinkan.
- Payment webhook wajib signature verification.
- Service role key tidak boleh tersedia di frontend.
- Secrets tidak boleh hardcoded.

### Reliability

- Webhook handler harus idempotent.
- Duplicate Telegram update tidak boleh duplicate message/order.
- Payment webhook retry tidak boleh double-update state.
- Local uploads harus persistent dan backup-ready.

### Performance

- Inbox harus sort by `last_message_at desc`.
- Message query harus limit dan pagination-ready.
- Product browsing Telegram harus cepat.
- Index harus mendukung lookup webhook, inbox, products, carts, orders, payments.

### Maintainability

- Route tidak boleh langsung berisi semua business logic.
- Domain operation ditempatkan di service/repository layer.
- AI side effects dipisahkan ke action validation layer.
- New marketplace module tidak boleh merusak existing CRM behavior.

## MVP Acceptance Criteria

MVP dianggap sukses jika:

- Telegram bot bisa menampilkan katalog produk.
- Customer bisa add to cart dari Telegram.
- Customer bisa checkout dari Telegram.
- Backend membuat order dan order items.
- Backend membuat payment link sandbox.
- Payment webhook sandbox mengubah order menjadi paid.
- Customer mendapat notifikasi paid.
- Admin bisa melihat order dan chat di dashboard.
- Human takeover tetap bekerja.


---


# File: mvp-scope.md


# MVP Scope

## MVP Name

**Telegram-first Marketplace MVP**

## MVP Goal

Membuktikan bahwa existing Chatbot CRM dapat dipakai sebagai fondasi commerce berbasis Telegram, dari chat sampai order paid.

## MVP North Star

> Customer berhasil melakukan pembelian produk dari Telegram sampai payment success, sementara admin dapat memonitor chat dan order dari dashboard.

## Included in MVP

### Customer Telegram

- `/start` menu.
- Browse products.
- View product detail.
- Add to cart.
- View cart.
- Update quantity.
- Checkout confirmation.
- Receive payment link.
- Receive payment success notification.
- Check order status.
- Ask AI about products.
- Request human help.

### Admin Dashboard

- Login.
- View inbox.
- View chat messages.
- Human takeover.
- Product CRUD.
- View orders.
- Update order fulfillment status.
- View payment status.
- View customer contacts.

### Backend

- Workspace-scoped data.
- Product catalog.
- Cart.
- Checkout session.
- Orders and order items.
- Payment link creation.
- Payment webhook.
- Webhook idempotency.
- AI action guardrails.
- Local file metadata.

## Explicitly Excluded from MVP

- Multi-seller marketplace.
- Seller wallet.
- Commission engine.
- Seller payout.
- Logistics provider integration.
- Refund automation.
- Voucher/promo engine.
- Loyalty points.
- Customer mobile app.
- Public web storefront.
- Advanced inventory reservation.
- Complex warehouse management.
- Multi-currency.
- Native in-chat payment inside Telegram.

## MVP Release Boundary

MVP complete when this flow works end-to-end:

```txt
Telegram /start
↓
Browse product
↓
Add to cart
↓
Checkout
↓
Payment link sandbox
↓
Payment webhook success
↓
Order status paid
↓
Telegram notification
↓
Admin can view order
```

## Post-MVP Priorities

1. WhatsApp commerce flow.
2. Better AI product recommendation.
3. Product search with typo tolerance.
4. Promo/voucher.
5. Delivery fee calculation.
6. Refund workflow.
7. Multi-seller foundation.
8. Seller dashboard.
9. Analytics commerce dashboard.


---


# File: feature-list.md


# Feature List

## Feature Status Legend

| Status | Meaning |
|---|---|
| Existing | Already exists in current CRM app |
| Improve | Exists but needs hardening/refactor |
| New MVP | Must be built for MVP |
| Later | Not in MVP |

## CRM & Messaging

| Feature | Status | Notes |
|---|---|---|
| Telegram webhook | Existing | Main MVP channel |
| WhatsApp webhook | Existing | Keep, not primary MVP commerce channel |
| Instagram webhook | Existing | Keep as CRM feature |
| Contact creation | Existing | Must remain workspace-scoped |
| Chat creation | Existing | Add marketplace state support |
| Message storage | Existing | Add idempotency |
| Human takeover | Existing | Critical feature |
| Resolve chat | Existing | Keep |
| Reply-to support | Existing | Keep |
| File/media message | Existing | Local storage metadata should be normalized |

## AI Assistant

| Feature | Status | Notes |
|---|---|---|
| AI reply | Existing | OpenAI/Gemini |
| Knowledge/Q&A | Existing | Improve gradually |
| Voice transcription | Existing | Keep optional |
| AI escalation | Existing/Improve | Should use validated actions |
| AI order marker | Improve | Keep legacy, but do not use for marketplace source of truth |
| AI product recommendation | New MVP | Should call/search product data |
| AI action logging | New MVP | Store proposed/executed action |

## Product Catalog

| Feature | Status | Notes |
|---|---|---|
| Product model | New MVP | Standalone product table/model |
| Product category | New MVP | Optional but useful |
| Product image | New MVP | Local file metadata |
| Product variants | New MVP | Basic variant support |
| Product status active/inactive | New MVP | Needed for Telegram browsing |
| Product inventory | Later/MVP minimal | MVP can use simple stock quantity or unlimited flag |

## Cart & Checkout

| Feature | Status | Notes |
|---|---|---|
| Cart | New MVP | Active cart per contact/chat |
| Cart item | New MVP | Product/variant/quantity |
| View cart | New MVP | Telegram menu |
| Update quantity | New MVP | Button or command |
| Checkout session | New MVP | Convert cart to order |
| Checkout expiration | New MVP | Prevent stale checkout |
| Duplicate checkout prevention | New MVP | Important idempotency |

## Orders

| Feature | Status | Notes |
|---|---|---|
| Legacy order capture | Existing | Based on AI form marker |
| Marketplace order | New MVP | Source = telegram/marketplace |
| Order items | New MVP | Normalized |
| Order status lifecycle | Improve | Need paid/fulfillment lifecycle |
| Admin order list | Existing/Improve | Needs item/payment visibility |
| Customer order status | New MVP | Telegram command/button |

## Payments

| Feature | Status | Notes |
|---|---|---|
| Manual payment instruction | Existing | Keep as fallback |
| Payment gateway sandbox | New MVP | Midtrans/Xendit sandbox |
| Payment link creation | New MVP | Sent to Telegram |
| Payment webhook | New MVP | Required for paid order |
| Payment event log | New MVP | Audit/retry/debug |
| Signature verification | New MVP | Mandatory |

## Admin Dashboard

| Feature | Status | Notes |
|---|---|---|
| Inbox | Existing | Keep |
| Contacts | Existing | Keep |
| Agents | Existing | Keep |
| Platforms | Existing | Keep |
| Orders | Existing/Improve | Add marketplace details |
| Product management | New MVP | Required |
| Payment dashboard | New MVP | Helpful for debugging |
| Analytics | Existing/Improve | Add commerce metrics later |

## Security & Operations

| Feature | Status | Notes |
|---|---|---|
| Auth | Existing | Improve route coverage |
| Workspace scoping | Improve | Mandatory everywhere |
| RLS design | New MVP/Migration | For Supabase |
| Webhook idempotency | New MVP | Required |
| File metadata | Improve | Normalize files table |
| Observability logs | Improve | Payment/webhook debug |


---


# File: user-personas.md


# User Personas

## Persona 1 — Business Owner

### Profile

- Pemilik bisnis/brand.
- Ingin jualan lewat chat tanpa membuat aplikasi mobile.
- Butuh melihat order dan chat customer secara cepat.

### Goals

- Meningkatkan conversion dari chat ke order.
- Mengurangi beban CS manual.
- Tetap bisa takeover percakapan penting.
- Punya dashboard untuk produk dan order.

### Pain Points

- Customer banyak tanya hal berulang.
- Order dari chat sering tercecer.
- Bukti bayar manual sulit diverifikasi.
- Data customer tersebar di banyak platform.

### Needs

- Unified inbox.
- AI assistant.
- Product catalog.
- Payment link.
- Order dashboard.

### Success Definition

Owner melihat lebih banyak chat berubah menjadi paid order dengan effort admin lebih sedikit.

---

## Persona 2 — Admin / Operations Staff

### Profile

- Mengelola produk, chat, dan order harian.
- Bukan developer.
- Butuh UI yang jelas dan minim risiko salah klik.

### Goals

- Menjawab chat customer.
- Takeover dari AI jika perlu.
- Melihat order masuk.
- Update status fulfillment.
- Mengelola produk aktif/tidak aktif.

### Pain Points

- Chat masuk banyak.
- Sulit tahu mana order sudah bayar.
- Produk/harga berubah tapi bot masih jawab data lama.
- Harus cek payment manual.

### Needs

- Inbox dengan status.
- Order list dengan payment status.
- Product CRUD simple.
- Notification saat payment success.

### Success Definition

Admin bisa menyelesaikan order tanpa keluar dari dashboard.

---

## Persona 3 — Human Agent / CS

### Profile

- CS yang menangani chat customer ketika AI tidak cukup.
- Role terbatas dibanding owner.

### Goals

- Melihat chat yang ditugaskan.
- Membalas customer.
- Memahami history chat dan order.
- Menyelesaikan masalah customer.

### Pain Points

- AI kadang salah paham.
- Customer komplain butuh respons manusia.
- CS butuh konteks order/payment.

### Needs

- Chat takeover.
- Chat history.
- Order context panel.
- Complaint note.

### Success Definition

CS bisa membantu customer tanpa akses berlebihan ke data workspace.

---

## Persona 4 — Telegram Customer

### Profile

- Customer yang membuka Telegram untuk bertanya/membeli.
- Tidak ingin install aplikasi baru.
- Bisa jadi sudah familiar dengan chat commerce.

### Goals

- Menemukan produk.
- Bertanya dulu sebelum membeli.
- Checkout mudah.
- Bayar lewat link aman.
- Mendapat update status order.

### Pain Points

- Website terlalu ribet.
- Chat manual lambat.
- Tidak tahu produk/harga terbaru.
- Takut pembayaran tidak tercatat.

### Needs

- Menu Telegram yang jelas.
- AI yang ramah dan membantu.
- Cart summary sebelum bayar.
- Payment link.
- Payment confirmation otomatis.

### Success Definition

Customer berhasil membeli tanpa perlu pindah ke website utama.

---

## Persona 5 — Developer / Maintainer

### Profile

- Engineer yang melanjutkan project lama.
- Perlu menjaga existing CRM tetap jalan sambil menambah commerce.

### Goals

- Menambah marketplace module tanpa merusak webhook/chat existing.
- Migrasi MongoDB ke Supabase/Postgres dengan aman.
- Menjaga security, data consistency, dan observability.

### Pain Points

- Existing code punya route yang belum aman.
- AI side effects bercampur dengan business logic.
- Order lama tidak normalized.
- Webhook duplicate bisa menyebabkan data double.

### Needs

- Clear schema.
- Repository layer.
- Migration docs.
- API contracts.
- Test strategy.

### Success Definition

Developer bisa implement fitur baru secara bertahap tanpa rebuild total.


---


# File: user-stories.md


# User Stories

## Telegram Customer Stories

### Start Bot

As a Telegram customer, I want to start the bot, so that I can see available options.

Acceptance criteria:

- `/start` returns welcome message.
- Welcome message includes options like Browse Products, View Cart, Talk to Admin.
- Contact and chat are created or reused.

### Browse Products

As a customer, I want to browse products from Telegram, so that I can choose what to buy.

Acceptance criteria:

- Bot shows only active products.
- Product list includes name and price.
- Customer can select a product for detail.
- Pagination exists if products exceed safe message limit.

### View Product Detail

As a customer, I want to see product detail, so that I understand what I am buying.

Acceptance criteria:

- Bot shows name, description, price, and image if available.
- Bot shows available variants if any.
- Bot provides Add to Cart button.

### Add to Cart

As a customer, I want to add a product to cart, so that I can checkout later.

Acceptance criteria:

- Backend validates product is active.
- Backend validates variant availability if selected.
- Cart is created if none exists.
- Cart item quantity is updated if same item exists.
- Bot confirms item was added.

### View Cart

As a customer, I want to view my cart, so that I can confirm my order before checkout.

Acceptance criteria:

- Bot shows all cart items.
- Bot shows subtotal/total.
- Bot shows Checkout and Edit options.
- Empty cart shows helpful message.

### Checkout

As a customer, I want to checkout my cart, so that I can pay for my order.

Acceptance criteria:

- Backend validates cart is not empty.
- Backend creates checkout session.
- Backend creates pending order and order items after confirmation.
- Bot shows final order summary.
- Bot asks explicit confirmation before creating payment.

### Pay Order

As a customer, I want to receive a payment link, so that I can pay securely.

Acceptance criteria:

- Backend creates payment transaction with provider sandbox.
- Payment link is sent via Telegram.
- Payment status is pending until webhook success.
- Payment link is associated with one order.

### Payment Confirmation

As a customer, I want to receive confirmation after payment, so that I know my order is paid.

Acceptance criteria:

- Payment webhook is verified.
- Payment record is updated.
- Order status becomes paid/confirmed.
- Bot sends payment success notification.

### Talk to Admin

As a customer, I want to ask for human help, so that I can solve issues AI cannot handle.

Acceptance criteria:

- Bot marks chat as escalated or requests takeover.
- Admin sees chat in inbox.
- AI stops if human takeover is active.

---

## Admin Stories

### Manage Products

As an admin, I want to create and update products, so that Telegram catalog stays accurate.

Acceptance criteria:

- Admin can create product.
- Admin can edit price, description, status.
- Admin can upload product image.
- Inactive products do not appear in Telegram catalog.

### View Orders

As an admin, I want to view orders, so that I can process paid orders.

Acceptance criteria:

- Order list is workspace-scoped.
- Order list shows customer, total, status, payment status.
- Admin can open order detail.
- Order detail shows order items.

### Update Fulfillment Status

As an admin, I want to update order status, so that customer support can track progress.

Acceptance criteria:

- Admin can update allowed statuses only.
- Status transition follows business rules.
- Update is logged.
- Optional Telegram notification is sent.

### Human Takeover

As a human agent, I want to takeover a chat, so that AI stops responding.

Acceptance criteria:

- Takeover sets `takeover_by`.
- New customer messages do not trigger AI reply.
- Human reply is sent to Telegram and stored.

---

## Owner Stories

### Configure Telegram Platform

As an owner, I want to connect Telegram bot, so that customers can chat with the bot.

Acceptance criteria:

- Owner can save token.
- Owner can set webhook.
- Platform belongs to workspace.
- Token is not exposed to frontend unnecessarily.

### Monitor Product Performance

As an owner, I want to see basic metrics, so that I know whether Telegram commerce works.

Acceptance criteria:

- Dashboard can show number of chats, carts, checkouts, paid orders.
- Metrics are workspace-scoped.
- Failed payment/webhook count can be inspected.


---


# File: customer-journey.md


# Customer Journey

## Journey Overview

Customer journey MVP dimulai dan berakhir di Telegram, dengan backend sebagai commerce engine.

```txt
Awareness
↓
Start Bot
↓
Browse/Search Product
↓
Ask AI
↓
Add to Cart
↓
Checkout Confirmation
↓
Payment Link
↓
Payment Success
↓
Order Fulfillment
↓
Post-Purchase Support
```

## Stage 1 — Start Bot

Customer membuka bot dan mengirim `/start`.

Backend actions:

- find platform,
- upsert contact,
- upsert chat,
- save message,
- send welcome menu.

Customer sees:

- welcome message,
- browse products button,
- view cart button,
- talk to admin option.

## Stage 2 — Product Discovery

Customer memilih browse products atau bertanya ke AI.

Backend actions:

- query active products by workspace,
- return paginated list,
- optionally let AI explain product.

Customer sees:

- product names,
- prices,
- category/variant info,
- detail button.

## Stage 3 — Product Decision

Customer membuka product detail.

Backend actions:

- validate product active,
- fetch images/variants,
- render product detail message.

Customer sees:

- product description,
- price,
- variant options,
- add to cart button.

## Stage 4 — Cart

Customer menambahkan produk ke cart.

Backend actions:

- create/reuse active cart,
- add/update cart item,
- calculate subtotal,
- return cart summary.

Customer sees:

- item added confirmation,
- view cart button,
- checkout button.

## Stage 5 — Checkout

Customer melakukan checkout.

Backend actions:

- validate cart,
- lock/confirm cart snapshot,
- create checkout session,
- ask explicit confirmation,
- create pending order after confirmation.

Customer sees:

- final item list,
- total amount,
- payment method instruction,
- confirm checkout button.

## Stage 6 — Payment

Customer menerima payment link.

Backend actions:

- create payment record,
- request payment link from sandbox provider,
- save provider transaction id,
- send link to Telegram.

Customer sees:

- payment link,
- payment expiry note,
- order id/reference.

## Stage 7 — Payment Success

Payment provider mengirim webhook.

Backend actions:

- verify signature,
- save payment event,
- update payment status,
- update order status,
- send Telegram notification.

Customer sees:

- payment success confirmation,
- next step/order processing info.

## Stage 8 — Fulfillment

Admin memproses order.

Backend actions:

- admin updates fulfillment status,
- optional notification to customer.

Customer sees:

- status update if enabled.

## Failure Points

| Stage | Possible Failure | Expected Response |
|---|---|---|
| Start bot | Platform token invalid | log error and return safe fallback if possible |
| Product browse | No active products | show empty catalog message |
| Add to cart | Product inactive | reject and show unavailable message |
| Checkout | Cart empty | ask customer to add product first |
| Payment | Provider error | show retry/manual fallback |
| Webhook | Duplicate event | ignore duplicate safely |
| Fulfillment | Admin delay | customer can ask status |


---


# File: admin-experience.md


# Admin Experience

## Purpose

Admin dashboard adalah control center untuk CRM dan marketplace operations.

## Core Admin Areas

```txt
Dashboard
Inbox
Contacts
Products
Orders
Payments
Agents
Platforms
Complaints
Settings
```

## Inbox Experience

Admin dapat:

- melihat daftar chat terbaru,
- filter unread/escalated/resolved,
- membuka chat detail,
- melihat contact info,
- melihat order context,
- takeover chat,
- mengirim human reply,
- resolve chat.

Important behavior:

- Jika `takeover_by` aktif, AI tidak boleh membalas.
- Human reply harus dikirim ke provider dan disimpan sebagai message.

## Product Management

Admin dapat:

- create product,
- edit product,
- upload product image,
- manage variants,
- set product active/inactive,
- assign category,
- set price.

MVP UI should avoid complexity:

- no bulk import first,
- no advanced inventory first,
- simple product form first.

## Order Management

Admin dapat:

- melihat order list,
- membuka order detail,
- melihat customer/chat linked to order,
- melihat order items,
- melihat payment status,
- update fulfillment status.

Order detail should show:

```txt
Order id
Customer
Telegram handle/contact
Chat link
Items
Subtotal/total
Payment status
Fulfillment status
Created at
Updated at
```

## Payment Monitoring

Admin dapat:

- melihat payment pending/success/failed/expired,
- melihat provider transaction id,
- melihat payment webhook event history,
- melihat error webhook jika ada.

Admin tidak boleh manually mark paid kecuali role/permission khusus dan harus audit logged.

## Complaint Handling

Admin dapat:

- melihat complaint,
- membuka linked chat,
- update status complaint,
- add note if needed.

## Platform Setup

Owner/admin dapat:

- add Telegram platform,
- save bot token,
- set webhook,
- test webhook status,
- connect future platforms like WhatsApp/Instagram.

## Agent Setup

Admin dapat:

- manage AI prompt,
- manage knowledge,
- configure welcome message,
- set AI behavior,
- configure escalation behavior.

## Admin UX Principles

1. **Context first** — chat, customer, order, payment should be connected.
2. **Safe actions** — destructive actions need confirmation.
3. **Clear state** — payment/order status should be obvious.
4. **Workspace-safe** — admin only sees their workspace.
5. **AI transparency** — AI actions should be visible/logged.


---


# File: brand-personality.md


# Brand Personality

## Brand Role

Produk ini berperan sebagai **friendly commerce assistant** untuk bisnis yang ingin menjual lewat chat.

Brand tidak boleh terasa seperti enterprise CRM yang kaku. Brand harus terasa:

- helpful,
- fast,
- modern,
- trustworthy,
- human-friendly,
- operationally reliable.

## Personality Keywords

| Trait | Meaning in Product |
|---|---|
| Friendly | Bahasa UI mudah dipahami, tidak terlalu teknis |
| Reliable | Status order/payment jelas dan konsisten |
| Smart | AI membantu, tapi tidak sok tahu |
| Safe | Payment dan data customer tidak sembarangan |
| Efficient | Admin bisa menyelesaikan pekerjaan cepat |
| Local-business friendly | Cocok untuk bisnis yang jualannya banyak lewat chat |

## Voice & Tone

### Dashboard/admin tone

- Clear.
- Direct.
- Calm.
- Operational.

Example:

```txt
Payment berhasil. Order siap diproses.
```

Avoid:

```txt
Yay!!! Pembayaran sukses banget nih!!!
```

### Customer bot tone

- Friendly.
- Helpful.
- Conversational.
- Not too robotic.

Example:

```txt
Siap kak, ini ringkasan pesananmu sebelum checkout.
```

Avoid:

```txt
Transaction object has been generated.
```

## AI Assistant Personality

AI should be:

- helpful but bounded,
- polite,
- concise,
- willing to ask clarification,
- honest when it needs human help.

AI must not:

- invent prices,
- claim payment success without backend status,
- promise stock without checking product data,
- override business rules,
- talk too much.

## Product Experience Feeling

The product should feel like:

```txt
A smart admin assistant that helps businesses sell through chat without losing control.
```

Not like:

```txt
A generic chatbot wrapper.
```

## Brand UX Principles

1. **Every status should be visible.**
2. **Every AI action should be explainable.**
3. **Every payment/order update should be trustworthy.**
4. **Every admin action should be reversible when possible.**
5. **Every customer chat should remain human-readable.**


---


# File: logo-direction.md


# Logo Direction

## Purpose

Dokumen ini memberi arahan visual logo untuk product experience. Ini bukan final logo design, tapi direction agar logo system konsisten dengan positioning produk.

## Product Identity Direction

Produk adalah:

```txt
Chat-first CRM + AI assistant + commerce backend
```

Maka logo sebaiknya menggabungkan rasa:

- chat/conversation,
- intelligence/automation,
- trust/commerce,
- operational clarity.

## Visual Concepts

### Concept A — Chat Bubble + Spark

Menggabungkan bubble chat dengan spark kecil sebagai simbol AI assistance.

Cocok karena:

- langsung menunjukkan chat,
- mudah dipahami customer/admin,
- AI terasa sebagai bantuan, bukan dominan.

### Concept B — Cart + Chat

Menggabungkan cart minimal dengan bubble chat.

Cocok untuk marketplace MVP, tetapi bisa terlalu commerce-specific jika produk ingin tetap CRM multi-platform.

### Concept C — Signal/Node + Bubble

Menggambarkan platform integration dan routing chat.

Cocok untuk produk CRM yang menghubungkan Telegram/WhatsApp/Instagram.

## Recommended Direction

Rekomendasi utama:

```txt
Chat Bubble + Spark + subtle commerce hint
```

Alasannya:

- tetap relevan untuk CRM,
- tetap cocok untuk AI,
- tidak mengunci brand hanya ke marketplace,
- fleksibel untuk future WhatsApp/Instagram commerce.

## Logo Should Feel

- clean,
- modern,
- friendly,
- scalable,
- not childish,
- not corporate-heavy.

## Logo Should Avoid

- terlalu banyak detail,
- icon robot generik,
- icon keranjang yang terlalu dominan,
- typography terlalu futuristik,
- warna terlalu neon jika brand bisnis lokal ingin trusted.

## Usage Context

Logo akan dipakai di:

- landing page,
- dashboard sidebar,
- login page,
- favicon,
- Telegram bot profile image,
- email/notification,
- docs.

## Practical Requirements

Logo harus punya:

- icon-only version,
- horizontal lockup,
- light mode version,
- dark mode version,
- monochrome version,
- favicon/app icon crop.


---


# File: logo-system.md


# Logo System

## Logo Variants

| Variant | Usage |
|---|---|
| Primary horizontal | Landing page, auth page, docs cover |
| Icon-only | Sidebar collapsed, favicon, Telegram profile |
| Stacked | Rare use, square placements |
| Monochrome | Documents, watermark, limited-color contexts |
| Inverted | Dark background |

## Clear Space

Logo should have clear space around it equal to at least the height of the icon mark.

```txt
[ clear space ] [ logo ] [ clear space ]
```

Do not place logo too close to edges, badges, or dense UI controls.

## Minimum Size

Recommended minimum:

| Context | Minimum |
|---|---|
| Favicon | 32x32 px |
| Sidebar icon | 24x24 px |
| Header horizontal | 120 px width |
| Document cover | 180 px width |

## Color Usage

Logo should support:

- primary color version,
- black/white monochrome,
- inverted white version,
- low-contrast disabled version.

## Background Rules

Allowed:

- white/light neutral background,
- dark dashboard background,
- subtle gradient background,
- flat brand background with inverted logo.

Avoid:

- busy photo background without overlay,
- low contrast background,
- placing logo over unreadable patterns.

## Misuse Rules

Do not:

- stretch logo,
- rotate logo,
- add shadow randomly,
- change icon and text ratio,
- use unapproved colors,
- place on low-contrast background,
- crop the logo,
- add extra elements to the lockup.

## Telegram Bot Profile

For Telegram bot profile image:

- use icon-only version,
- high contrast,
- no small text,
- centered mark,
- safe within circular crop.

## Dashboard Sidebar

For dashboard sidebar:

- use icon + short wordmark if expanded,
- icon-only if collapsed,
- ensure readable in dark mode.

## Documentation Usage

In docs, use logo sparingly:

- README cover,
- architecture diagrams,
- handoff docs,
- final export packages.

Do not repeat logo on every internal doc if it adds clutter.


---


# File: success-metrics.md


# Success Metrics

## MVP Success Definition

MVP sukses jika customer bisa menyelesaikan transaksi dari Telegram sampai payment success, dan admin bisa mengelola order dari dashboard.

## North Star Metric

```txt
Paid Telegram Orders per Workspace
```

Kenapa:

- mencerminkan chat berhasil menjadi transaksi,
- relevan dengan marketplace MVP,
- mudah dipahami owner/admin.

## Funnel Metrics

| Funnel Step | Metric |
|---|---|
| Bot started | Telegram `/start` count |
| Product discovered | Product list/detail views |
| Cart created | Active carts created |
| Cart intent | Cart items added |
| Checkout intent | Checkout sessions created |
| Payment intent | Payment links generated |
| Payment success | Paid orders |
| Fulfillment | Completed orders |

## Conversion Metrics

```txt
Product detail view → Add to cart
Add to cart → Checkout
Checkout → Payment link opened/created
Payment link → Paid order
Paid order → Completed order
```

## CRM Metrics

| Metric | Purpose |
|---|---|
| New chats | Demand/traffic |
| Unread chats | Admin workload |
| Escalated chats | AI limitation signal |
| Human takeover count | CS workload |
| Resolved chats | Operations throughput |
| Average response time | Service quality |

## AI Metrics

| Metric | Purpose |
|---|---|
| AI replies sent | AI usage volume |
| AI action proposals | Commerce assistance usage |
| AI action failures | Guardrail/debug signal |
| Escalation rate | AI confidence/coverage |
| Human takeover after AI | AI handoff quality |

## Payment Metrics

| Metric | Purpose |
|---|---|
| Payment link generated | Payment intent |
| Payment pending | In-progress orders |
| Payment success | Revenue proxy |
| Payment expired | Checkout friction |
| Payment failed | Provider/user issue |
| Webhook duplicate ignored | Idempotency health |

## Admin Product Metrics

| Metric | Purpose |
|---|---|
| Active products | Catalog readiness |
| Products with images | Catalog quality |
| Products out of stock | Fulfillment risk |
| Top viewed products | Demand signal |
| Top sold products | Revenue signal |

## MVP Target Example

For first validation:

```txt
- 1 connected Telegram bot
- 10 active products
- 20 successful test checkouts
- 10 sandbox paid orders
- 0 duplicate payment/order from webhook retry
- 0 cross-workspace data leak in tests
```

## Analytics Implementation Notes

Metrics should be derived from:

- `messages`,
- `chats`,
- `products`,
- `carts`,
- `checkouts`,
- `orders`,
- `order_items`,
- `payments`,
- `payment_events`,
- `webhook_events`,
- `ai_actions`.


---


# File: release-plan.md


# Release Plan

## Release Strategy

Release dilakukan bertahap untuk menjaga existing CRM tetap stabil.

```txt
R0 Stabilization
R1 Product Catalog
R2 Telegram Cart
R3 Checkout + Orders
R4 Payment Sandbox
R5 Admin Marketplace UI
R6 MVP Hardening
```

## R0 — Stabilization

Goal:

- existing app aman untuk dikembangkan.

Deliverables:

- secure orders/complaints routes,
- remove/protect diagnostic routes,
- add webhook idempotency plan,
- mount missing settings route if needed,
- ensure workspace scoping.

Exit criteria:

- no unauthenticated access to orders/complaints,
- existing Telegram chat still works,
- existing dashboard still works.

## R1 — Product Catalog

Goal:

- admin can manage products.

Deliverables:

- product/category/variant schema,
- product API,
- product CRUD dashboard,
- product image local storage metadata.

Exit criteria:

- admin can create active product,
- Telegram backend can query active products.

## R2 — Telegram Cart

Goal:

- customer can add products to cart from Telegram.

Deliverables:

- cart/cart_item schema,
- Telegram inline keyboard helpers,
- browse product flow,
- add to cart flow,
- view cart flow.

Exit criteria:

- customer can add product to cart,
- cart state persists.

## R3 — Checkout + Orders

Goal:

- cart becomes structured order.

Deliverables:

- checkout session,
- order source/type support,
- order_items,
- order summary in Telegram,
- admin order detail.

Exit criteria:

- customer can confirm checkout,
- backend creates order and order_items.

## R4 — Payment Sandbox

Goal:

- order can be paid via sandbox payment link.

Deliverables:

- payment provider client,
- payments table/model,
- payment_events,
- payment webhook,
- signature verification,
- Telegram payment success notification.

Exit criteria:

- sandbox payment success updates order paid.

## R5 — Admin Marketplace UI

Goal:

- admin can operate MVP.

Deliverables:

- product page,
- order detail page,
- payment status UI,
- chat/order context panel.

Exit criteria:

- admin can process paid order from dashboard.

## R6 — MVP Hardening

Goal:

- reliable MVP demo/launch.

Deliverables:

- test fixtures,
- webhook retry tests,
- payment duplicate tests,
- access control tests,
- staging dry run,
- logs/observability.

Exit criteria:

- end-to-end Telegram purchase flow works reliably.


---


# File: out-of-scope.md


# Out of Scope

Dokumen ini menjelaskan fitur yang sengaja tidak masuk MVP agar implementasi tetap fokus.

## Not in MVP

### Multi-Seller Marketplace

Tidak termasuk:

- seller onboarding,
- seller profile/store page,
- seller dashboard,
- seller-specific catalog,
- seller wallet,
- commission,
- payout.

Reason:

- terlalu banyak complexity sebelum chat → cart → payment terbukti jalan.

### Logistics Integration

Tidak termasuk:

- RajaOngkir/Shipper/3PL integration,
- auto shipping label,
- courier tracking,
- shipping fee by API.

MVP boleh memakai manual fulfillment status.

### Refund Automation

Tidak termasuk:

- automated refund to payment gateway,
- refund request portal,
- partial refund.

MVP cukup manual admin process.

### Promo/Voucher

Tidak termasuk:

- coupon code,
- discount rules,
- campaign engine,
- bundle pricing.

Reason:

- promo akan mengubah order/payment calculations dan menambah edge cases.

### Public Web Storefront

Tidak termasuk:

- public product website,
- SEO storefront,
- customer web account.

MVP fokus ke Telegram.

### Advanced AI Agent

Tidak termasuk:

- autonomous sales agent tanpa guardrail,
- AI directly creating paid order,
- AI modifying stock/payment,
- custom model fine-tuning.

AI hanya assistant yang action-nya divalidasi backend.

### Advanced Inventory

Tidak termasuk:

- warehouse management,
- batch/lot tracking,
- stock reservation timeout kompleks,
- multi-warehouse.

MVP boleh menggunakan stock sederhana atau unlimited flag.

### Enterprise Features

Tidak termasuk:

- SSO,
- audit compliance export,
- complex role matrix,
- data warehouse,
- custom SLA.

## Revisit After MVP

Fitur yang bisa dievaluasi setelah MVP:

1. WhatsApp commerce.
2. Promo/voucher.
3. Delivery fee calculator.
4. Refund workflow.
5. Multi-seller foundation.
6. Seller payout.
7. Advanced analytics.
8. AI campaign generator.


---


# File: risks-and-assumptions.md


# Risks and Assumptions

## Product Assumptions

1. Customer target nyaman transaksi lewat Telegram.
2. Single merchant cukup untuk MVP.
3. Payment link sandbox cukup untuk validasi flow.
4. Existing CRM dashboard bisa menjadi base admin operations.
5. AI assistant meningkatkan conversion atau mengurangi beban CS.
6. Local storage cukup untuk phase awal.

## Technical Assumptions

1. Existing Telegram webhook bisa dipertahankan.
2. MongoDB → Supabase migration dilakukan bertahap.
3. Workspace scoping bisa diterapkan secara konsisten.
4. Payment provider mendukung sandbox webhook.
5. Local uploads bisa dipersist dan dibackup.
6. Backend dapat memakai service role Supabase secara aman.

## Product Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Customer tidak mau checkout lewat Telegram | MVP adoption rendah | Test with small product set and real users |
| AI menjawab harga/stok salah | Trust menurun | AI wajib query product data, not invent |
| Admin bingung dengan terlalu banyak fitur | Operations lambat | Keep MVP UI simple |
| Payment link membuat user keluar dari chat | Drop-off | Clear instruction and confirmation message |
| Catalog tidak rapi | Conversion turun | Product form should enforce required fields |

## Technical Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Duplicate webhook creates duplicate order | Data corruption | webhook_events + idempotency keys |
| Payment webhook spoofing | Fake paid order | signature verification mandatory |
| Workspace leak | Critical security issue | workspace filter + RLS + tests |
| Local uploads wiped during deploy | Data loss | persistent volume + backups |
| Migration corrupts ID references | Broken data | mongo_id_map + validation report |
| AI side effects too coupled | Hard to maintain | ai_actions + service validation layer |

## Migration Risks

- Mongo ObjectId cannot be reused as UUID.
- Existing workspace is implicit, target workspace is explicit.
- Agent nested arrays must be normalized carefully.
- Message attachments need file metadata mapping.
- Timestamps must be preserved for chat ordering.

## Business Risks

- Payment provider approval/production activation may take time.
- Telegram as first channel may not match all customer segments.
- Marketplace expectation may grow too fast beyond MVP.

## Risk Priority

Highest priority risks before MVP launch:

1. Payment webhook security.
2. Workspace data isolation.
3. Webhook idempotency.
4. Order/cart consistency.
5. Local file backup.
6. AI commerce guardrails.
