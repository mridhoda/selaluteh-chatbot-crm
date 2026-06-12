# Domain Rules

## Purpose

Dokumen ini mendefinisikan aturan domain utama untuk backend Chatbot CRM yang berkembang menjadi Telegram-first Marketplace MVP.

## Domain Boundary

Sistem memiliki beberapa domain utama:

```txt
Identity
Workspace/Tenant
Platform Integration
AI Agent
CRM Chat
Marketplace Commerce
Payment
File Storage
Operations/Analytics
```

## Core Principles

### 1. Workspace is the tenant boundary

Semua data operasional wajib terikat ke `workspace_id`.

Contoh tenant-owned data:

```txt
users
platforms
agents
contacts
chats
messages
products
carts
orders
payments
complaints
files
webhook_events
ai_actions
```

Tidak boleh ada query operasional tanpa workspace scope, kecuali query public webhook yang melakukan platform lookup terlebih dahulu.

### 2. Backend is the source of truth

Backend adalah sumber kebenaran untuk:

- product price
- product availability
- cart content
- checkout summary
- order status
- payment status
- user role
- workspace ownership

AI tidak boleh menjadi source of truth untuk data-data di atas.

### 3. AI is an assistant, not an authority

AI boleh:

- menjelaskan produk
- memberi rekomendasi
- menanyakan detail order
- membantu user memilih produk
- menyarankan action backend

AI tidak boleh:

- mengubah harga
- menandai payment sebagai paid
- membuat order tanpa explicit confirmation
- melewati validation
- membuka data workspace lain
- membuat klaim refund/promo yang tidak ada di database/policy

### 4. Telegram is the first MVP channel

Telegram menjadi channel commerce utama untuk MVP.

Channel WhatsApp/Instagram tetap dipertahankan sebagai CRM channel existing, tetapi commerce deterministic MVP diprioritaskan di Telegram.

### 5. Single merchant first

MVP bukan multi-seller marketplace.

Untuk MVP:

```txt
1 workspace = 1 merchant/business
products belong to workspace
orders belong to workspace
payments belong to workspace
```

Multi-seller, wallet seller, payout seller, dan commission split ditunda.

## System Actors

| Actor | Description |
|---|---|
| Customer | External user from Telegram/WA/IG |
| Owner | Workspace owner |
| Super | Workspace admin/operator with broad access |
| Agent | Human customer service role |
| AI Agent | Automated assistant configured by workspace |
| Payment Provider | Midtrans/Xendit/manual payment source |
| Platform Provider | Telegram/Meta provider webhook source |

## Canonical User Journey for MVP

```txt
Telegram user starts bot
-> browses products
-> selects product/variant
-> adds to cart
-> reviews cart
-> confirms checkout
-> receives payment link
-> pays in sandbox/production provider
-> payment webhook updates backend
-> user receives payment status notification
-> admin fulfills order
```

## Business Rule Format

Each major rule should be described with:

```txt
Rule
Reason
Allowed behavior
Rejected behavior
System enforcement point
```

Example:

```txt
Rule: Payment status can only become paid from verified provider webhook or admin override with permission.
Reason: Prevent payment spoofing.
Enforced by: payment webhook service and admin payment service.
```
