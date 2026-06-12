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
