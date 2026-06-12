# 00 Overview

Folder ini berisi dokumen overview untuk backend **SelaluTeh Chatbot CRM — Telegram Marketplace MVP**.

Dokumen di folder ini adalah pintu masuk sebelum membaca folder lain seperti:

```txt
01-product
02-flows
03-business-rules
04-tech-spec
05-api-spec
06-data
08-security
09-ai-context
10-testing
11-sprint
```

## Purpose

Folder ini menjawab pertanyaan dasar:

- Project ini apa?
- Arah MVP-nya ke mana?
- Problem apa yang ingin diselesaikan?
- Scope MVP apa saja?
- Apa yang tidak termasuk MVP?
- Siapa stakeholder-nya?
- Apa KPI/success metrics-nya?
- Apa asumsi dan constraint utama?
- Kondisi sistem sekarang seperti apa?
- Target sistem ke depan seperti apa?

## Project Direction

Backend saat ini adalah **Chatbot CRM multi-platform** dengan:

- Telegram webhook.
- WhatsApp/Instagram webhook.
- AI agents.
- Inbox/chat history.
- Human takeover.
- Contacts.
- Orders/complaints legacy.
- MongoDB/Mongoose runtime.

Target baru:

```txt
Telegram-first single-merchant marketplace MVP
+ product catalog
+ cart
+ checkout
+ payment gateway sandbox
+ payment webhook
+ admin operations
+ AI shopping assistant
+ future Supabase/Postgres migration
```

## Recommended Reading Order

1. `project-summary.md`
2. `product-vision.md`
3. `scope.md`
4. `mvp-principles.md`
5. `goals-kpi.md`
6. `stakeholders.md`
7. `assumptions-constraints.md`
8. `current-state.md`
9. `target-state.md`
10. `risks-overview.md`
11. `decision-summary.md`
12. `glossary.md`

## Folder Boundary

This folder should stay high-level.

Do not put detailed API contracts, database schema, security implementation, or sprint tasks here. Put those in their own folders.
