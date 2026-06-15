# Selalu Teh Marketplace — Frontend MVP Page Design Docs

Dokumen ini adalah spesifikasi desain dan implementasi frontend untuk lima halaman prioritas MVP:

1. Products
2. Payments
3. Chat Center
4. Settings
5. Connected Platforms

Dokumen dibuat untuk aplikasi gabungan **CRM + Telegram-first Marketplace + multi-outlet**, dengan kesiapan arsitektur untuk future multi-workspace/franchise owner.

## Target frontend

```txt
web/src/modules/products
web/src/modules/payments
web/src/modules/chats
web/src/modules/settings
web/src/modules/platforms
```

## Prinsip utama

- Jangan membuat ulang aplikasi dari nol.
- Gunakan struktur frontend feature-based yang sudah ada.
- Pertahankan visual language dan komponen yang sudah dipakai oleh Orders page.
- Backend tetap menjadi source of truth untuk catalog, cart, checkout, order, payment, chat, dan platform status.
- Telegram adalah channel commerce MVP pertama.
- WhatsApp dan Instagram dapat tetap terlihat sebagai channel lain, tetapi jangan menganggap semuanya sudah memiliki commerce flow yang setara.
- Semua query operasional harus workspace-scoped dan outlet-aware.
- Jangan mempercayai `workspace_id` atau `outlet_id` dari UI tanpa validasi backend.

## Dokumen yang harus dibaca AI agent

Urutan minimum:

```txt
docs/backend/index.md
docs/backend/READING-ORDER.md
docs/backend/00-overview/scope.md
docs/backend/00-overview/target-state.md
docs/backend/03-business-rules/workspace-tenant-rules.md
docs/backend/03-business-rules/outlet-rules.md
docs/backend/03-business-rules/outlet-access-rules.md
docs/backend/03-business-rules/product-catalog-rules.md
docs/backend/03-business-rules/payment-rules.md
docs/backend/03-business-rules/human-takeover-rules.md
docs/backend/05-api-spec/products-api.md
docs/backend/05-api-spec/payments-api.md
docs/backend/05-api-spec/chats-api.md
docs/backend/05-api-spec/platforms-api.md
docs/backend/05-api-spec/settings-api.md
docs/backend/06-data/database-schema.md
docs/backend/06-data/query-contracts.md
docs/backend/07-uiux/design-system.md
docs/backend/07-uiux/outlet-selector-pattern.md
docs/backend/07-uiux/ui-states.md
docs/backend/08-security/workspace-tenant-security.md
docs/backend/08-security/outlet-access-security.md
docs/backend/08-security/payment-security.md
docs/backend/08-security/webhook-security.md
docs/backend/09-ai-context/do-not-break.md
```

## Paket ini

```txt
00-foundation/       Shared design and page behavior
01-pages/            Detailed page specifications
02-contracts/        UI data, API, state, permission contracts
03-implementation/   Frontend module and delivery plan
04-testing/          Acceptance and QA requirements
ai-handoff/          Prompt ready for coding agent
```
