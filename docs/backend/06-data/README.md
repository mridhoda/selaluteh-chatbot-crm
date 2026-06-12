# 06 Data — Updated Database Docs

Dokumen ini adalah versi terbaru dari paket **data/database docs** untuk project Chatbot CRM yang diarahkan menjadi **Telegram-first Marketplace MVP**.

## Konteks Sistem Terbaru

Project saat ini adalah Chatbot CRM multi-platform dengan Telegram/WhatsApp/Instagram webhook, AI agent, inbox, contact management, human takeover, order sederhana, complaint, analytics, dan local upload. Runtime lama masih memakai MongoDB/Mongoose. Target baru memakai Supabase PostgreSQL untuk structured data, sementara file/media besar tetap di local server storage.

Versi docs ini memperluas desain lama agar mendukung commerce deterministic:

```txt
Product Catalog -> Cart -> Checkout -> Order -> Payment -> Payment Webhook -> Paid Notification
```

AI tetap dipakai sebagai **shopping assistant**, tetapi backend menjadi sumber kebenaran untuk product, price, cart, order, inventory, dan payment.

## Dokumen Utama

| File | Isi |
|---|---|
| `database-schema.md` | Schema Supabase/Postgres terbaru untuk CRM + marketplace MVP |
| `entities.md` | Mapping Mongoose lama ke Postgres dan entity baru marketplace |
| `relationships.md` | Relasi antar table dan delete behavior |
| `erd.md` | ERD Mermaid terbaru |
| `data-flow.md` | Flow auth, webhook, chat, AI, Telegram commerce, payment |
| `query-contracts.md` | Kontrak query yang harus dijaga setelah migrasi |
| `indexes.md` | Index untuk auth, inbox, webhook, product, cart, order, payment |
| `rls-policies.md` | RLS policy design Supabase |
| `storage-model.md` | Local storage + file metadata model |
| `seed-data.md` | Seed data untuk dev dan demo marketplace MVP |
| `migration-plan.md` | Strategi migrasi MongoDB/Mongoose ke Supabase/Postgres |
| `import-script-spec.md` | Spesifikasi script import Mongo -> Supabase |
| `marketplace-module.md` | Rancangan modul marketplace MVP |
| `payment-gateway.md` | Rancangan payment gateway sandbox |
| `telegram-commerce-flow.md` | UX/data flow Telegram commerce |
| `ai-commerce-guardrails.md` | Guardrail AI agar aman untuk commerce |
| `repository-layer-contract.md` | Kontrak repository layer untuk migrasi bertahap |
| `implementation-checklist.md` | Checklist implementasi end-to-end |

## Prinsip Besar

### 1. Workspace-first multi-tenancy

Semua data tenant-owned wajib punya `workspace_id`. Ini termasuk `messages`, `payments`, `payment_events`, `products`, `carts`, dan `order_items`.

### 2. CRM behavior tidak boleh rusak

Migrasi database tidak boleh merusak login, Telegram webhook, inbox, chat history, AI reply, human takeover, order legacy, dan complaint legacy.

### 3. Marketplace MVP deterministic

Order marketplace tidak boleh bergantung pada JSON bebas dari AI. AI hanya boleh menyarankan action. Backend wajib validasi product, harga, quantity, cart, order, dan payment.

### 4. Media tetap local storage

Structured data masuk Postgres. Binary besar seperti attachment, product image, audio, PDF, dan payment proof tetap di `server/uploads`; Postgres menyimpan metadata di `files`.

### 5. Payment dimulai dari sandbox

MVP disarankan mulai dari Midtrans/Xendit sandbox payment link, dengan webhook yang mengupdate `payments` dan `orders`.

## MVP Target

Telegram user bisa `/start`, lihat produk, pilih produk, tambah ke cart, checkout, menerima payment link sandbox, bayar, menerima notifikasi paid, dan cek status order.

Admin bisa login dashboard, CRUD produk, lihat chat, takeover, lihat order, lihat payment status, dan update fulfillment status.

## Out of Scope MVP

Tunda dulu multi-seller, seller wallet, commission, payout, dispute, refund automation, loyalty, shipping aggregator, dan full public storefront.
