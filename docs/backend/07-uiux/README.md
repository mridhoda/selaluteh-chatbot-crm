# 07 UI/UX

Folder ini berisi dokumentasi UI/UX untuk backend **SelaluTeh Chatbot CRM — Telegram Marketplace MVP**.

Catatan penting: karena ini berada di docs backend, fokusnya bukan hanya warna, font, atau tampilan visual. Fokus utamanya adalah:

```txt
UI elements required to operate backend features.
```

Artinya dokumen ini menjelaskan:

- halaman apa yang dibutuhkan admin dashboard
- tombol/action apa saja yang harus ada
- form field apa yang dibutuhkan backend
- data table column apa yang perlu ditampilkan
- state apa yang harus didukung backend/API
- error/loading/empty state apa yang harus ditangani
- komponen apa yang berhubungan dengan product, cart, checkout, payment, webhook, AI, dan chat

## Product Context

Backend ini adalah:

```txt
Existing Chatbot CRM
+ Telegram-first Marketplace MVP
+ Product catalog
+ Cart/checkout/payment
+ AI shopping assistant
+ Human takeover
+ Supabase/Postgres migration path
```

## Recommended Reading Order

1. `backend-ui-contract.md`
2. `pages-list.md`
3. `admin-actions-matrix.md`
4. `components-list.md`
5. `forms-and-fields.md`
6. `data-table-actions.md`
7. `ui-states.md`
8. `telegram-bot-ux.md`
9. `payment-ui-requirements.md`

## Folder Boundary

Put here:

- admin dashboard UI requirements
- page list
- button/action list
- form fields
- table columns/actions
- UX states
- UI component variants
- backend-driven UI needs
- Telegram bot interaction UX

Do not put here:

- API contract detail → `05-api-spec`
- database schema → `06-data`
- security policy → `08-security`
- sprint planning → `11-sprint`
- pure brand marketing → `01-product` or design assets folder
