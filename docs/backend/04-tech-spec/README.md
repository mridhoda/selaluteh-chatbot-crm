<!--
Tech Spec Pack: Telegram-first Marketplace Backend
Project: KALIS.AI / eskala-bot evolution
Target: Chatbot CRM + Telegram Marketplace MVP
Generated: 2026-06-11
Scope: docs/04-tech-spec only
-->

# Backend Tech Spec — Telegram-first Marketplace MVP

Dokumen ini adalah entry point untuk folder `docs/04-tech-spec`.

Folder ini hanya berisi dokumen yang memang masuk kategori **technical specification backend**: arsitektur, stack, struktur folder, coding rules, background jobs, storage, deployment, observability, AI pipeline, repository/data access boundary, dan runbook operasional backend.

Dokumen yang lebih cocok untuk folder lain **tidak dimasukkan** ke paket ini:

- API contracts → `05-api-spec/`
- Telegram commerce/payment flow → `02-flows/`
- Security detail → `08-security/`
- Testing strategy → `10-testing/`
- Sprint/roadmap → `11-sprint/`
- Combined AI context → `chatgpt-context/` atau `09-ai-context/`

## Project Context

Project existing adalah Chatbot CRM multi-platform yang akan dikembangkan menjadi **Telegram-first Marketplace MVP**.

Fondasi existing:

- Express backend.
- React/Vite dashboard.
- MongoDB/Mongoose runtime saat ini.
- Target migrasi ke Supabase/Postgres.
- Telegram webhook.
- WhatsApp/Instagram webhook.
- AI agent dengan OpenAI/Gemini.
- Inbox CRM.
- Human takeover.
- Contacts, chats, messages, orders, complaints.
- Local file storage di `server/uploads`.

Target backend terbaru:

```txt
Existing Chatbot CRM
+ Supabase/Postgres data layer
+ Telegram commerce flow
+ Product catalog
+ Cart
+ Checkout
+ Order items
+ Payment gateway sandbox
+ Payment webhook
+ AI shopping assistant guardrails
```

## Recommended Reading Order

1. `tech-stack.md`
2. `architecture.md`
3. `folder-structure.md`
4. `recommended-scalable-structure.md`
5. `03.6.1-service-contracts.md`
6. `03.6.2-repository-architecture.md`
7. `03.6.3-external-provider-architecture.md`
8. `03.6.4-background-workers-scheduler.md`
9. `database-access.md`
10. `ai-pipeline.md`
11. `background-jobs.md`
12. `storage-strategy.md`
13. `environment-config.md`
14. `observability.md`
15. `deployment.md`
16. `runbook.md`
17. `coding-rules.md`
18. `decision-log.md`
19. `rendering-export.md`

## File Map

| File | Purpose |
|---|---|
| `architecture.md` | Arsitektur backend end-to-end |
| `tech-stack.md` | Stack teknologi backend |
| `folder-structure.md` | Struktur folder backend yang direkomendasikan |
| `recommended-scalable-structure.md` | Struktur scalable setelah MVP |
| `03.6.1-service-contracts.md` | Kontrak Application Service QR Store, DTO, result/error object, authorization, idempotency, transaction, dan ownership matrix |
| `03.6.2-repository-architecture.md` | Arsitektur repository QR Store, aggregate boundaries, workspace scoping, transaction awareness, locking, idempotency, dan runtime implementation status |
| `03.6.3-external-provider-architecture.md` | Arsitektur external provider, payment adapter registry, provider resolver, capability matrix, webhook verification, reconciliation, dan provider switching |
| `03.6.4-background-workers-scheduler.md` | Arsitektur background workers, scheduler, queue, retry, dead letter, locking, observability, dan worker ownership matrix |
| `database-access.md` | Repository layer dan data access boundary |
| `ai-pipeline.md` | Desain AI assistant, tool/action flow, guardrails, dan prompt boundary |
| `background-jobs.md` | Queue, workers, webhook processing, retry, scheduler |
| `storage-strategy.md` | Local storage + metadata Postgres |
| `environment-config.md` | Environment variable, secret, config per environment |
| `observability.md` | Logging, metrics, tracing, alerting |
| `deployment.md` | Strategi deploy backend/API/worker/webhook |
| `runbook.md` | Operasional/debugging backend harian |
| `coding-rules.md` | Aturan coding backend agar aman dan maintainable |
| `decision-log.md` | Catatan keputusan teknis penting |
| `rendering-export.md` | Strategi rendering/export file/report jika dibutuhkan |

## Big Principles

1. **Do not rebuild from zero.** Existing CRM/chatbot foundation tetap dipakai.
2. **Backend is source of truth.** AI tidak boleh menjadi sumber final untuk order/payment.
3. **Every tenant-owned row has `workspace_id`.** Ini wajib untuk multi-tenant safety.
4. **Payment status only comes from provider webhook.** User screenshot/payment proof tidak boleh otomatis dianggap paid.
5. **Telegram commerce should be deterministic.** AI boleh membantu, tetapi checkout harus jelas dan tervalidasi backend.
6. **Files stay local for MVP.** Postgres hanya menyimpan metadata/path.
7. **Webhooks must be idempotent.** Telegram/Meta/payment webhook tidak boleh membuat duplicate state.

## Notes for Other Docs Folders

Saat nanti membuat docs lanjutan, gunakan mapping berikut:

```txt
02-flows      -> telegram-commerce-flow.md, payment-flow.md, checkout-flow.md
05-api-spec   -> product-api.md, cart-api.md, order-api.md, payment-api.md, webhook-api.md
06-data       -> database schema, migration, RLS, indexes, query contracts
08-security   -> webhook signature, payment verification, secret management, RLS safety
10-testing    -> unit/integration/e2e testing strategy
11-sprint     -> roadmap, sprint plans, implementation checklist
```
