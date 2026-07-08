# 03 Business Rules — Backend

Folder ini berisi aturan bisnis untuk backend **KALIS.AI / eskala-bot** yang sedang diarahkan menjadi **Telegram-first Marketplace MVP** di atas fondasi Chatbot CRM existing.

Business rules berbeda dari technical specification:

- Business rules menjawab: **apa yang boleh, tidak boleh, wajib terjadi, dan bagaimana status berubah**.
- Tech spec menjawab: **bagaimana sistem diimplementasikan secara teknis**.
- API spec menjawab: **endpoint, request, response, dan error contract**.
- Data docs menjawab: **schema, relasi, index, RLS, dan migration**.

## Core Context

Sistem existing memiliki:

- Workspace multi-tenant.
- User roles: `owner`, `super`, `agent`.
- Connected platforms: Telegram, WhatsApp, Instagram, Facebook/custom-ready.
- AI agents.
- Chat inbox.
- Human takeover.
- Contacts.
- Messages.
- Orders and complaints from AI/admin flow.
- Local file upload and file metadata.

Arah MVP terbaru:

```txt
Telegram-first single-merchant marketplace
+ product catalog
+ cart
+ checkout
+ order_items
+ payment sandbox
+ payment webhook
+ AI shopping assistant
+ human takeover
```

## Documents

| File | Purpose |
|---|---|
| `domain-rules.md` | Prinsip domain utama dan boundary bisnis |
| `03.5-qr-domain-architecture.md` | Blueprint business domain QR Store, QR scope, session, storefront/outlet resolution, checkout flow, invariants, dan checklist implementasi |
| `03.5.1-domain-events-state-machines.md` | Kontrak domain events, state machines, allowed transitions, retry, idempotency, payload contracts, dan event ownership matrix |
| `workspace-tenant-rules.md` | Aturan workspace, tenant isolation, ownership |
| `permissions.md` | Role, permission, dan akses fitur |
| `product-catalog-rules.md` | Product, category, variant, visibility, stock rules |
| `cart-checkout-rules.md` | Cart, cart item, checkout, dan session rules |
| `order-rules.md` | Order source, item, status, cancellation, fulfillment |
| `payment-rules.md` | Payment provider, payment status, webhook, sandbox |
| `telegram-commerce-rules.md` | Business behavior untuk Telegram marketplace flow |
| `ai-agent-rules.md` | Batasan AI sebagai assistant, bukan source of truth |
| `human-takeover-rules.md` | Rules saat manusia mengambil alih chat |
| `complaint-rules.md` | Complaint creation, status, and ownership rules |
| `webhook-rules.md` | Idempotency, verification, and event rules |
| `status-rules.md` | Canonical status transition rules |
| `storage-rules.md` | Aturan file/media lokal dan metadata DB |
| `export-rules.md` | Export data, report, privacy, and filtering rules |
| `generation-rules.md` | Rules for generated responses, files, and AI outputs |
| `quota-rules.md` | Limits, plans, usage, and throttling rules |
| `validations.md` | General validation rules across backend |
| `notification-rules.md` | Notification rules to Telegram/user/admin |
| `audit-log-rules.md` | What must be auditable and why |

## Rule Priority

Jika ada konflik antar dokumen, gunakan prioritas berikut:

1. Security and data isolation rules.
2. Payment and order consistency rules.
3. Workspace/tenant rules.
4. Platform provider requirements.
5. Admin/operator convenience.
6. AI convenience.

AI must never override payment, order, security, or workspace isolation rules.
