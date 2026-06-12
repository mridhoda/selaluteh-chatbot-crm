# AI Context Docs — Backend

Folder `09-ai-context` berisi dokumen yang ditujukan untuk **AI coding agent** agar bisa bekerja di backend tanpa merusak konteks produk, arsitektur, security, data migration, dan flow marketplace.

Dokumen di folder ini bukan pengganti `04-tech-spec`, `05-api-spec`, `06-data`, atau `08-security`. Folder ini adalah **operating context** yang harus dibaca AI sebelum melakukan perubahan kode.

## Project Context

Aplikasi saat ini adalah **Chatbot CRM multi-platform** dengan React/Vite frontend, Express backend, MongoDB/Mongoose runtime existing, Telegram/WhatsApp/Instagram webhook, OpenAI/Gemini AI reply, dashboard inbox, contact management, human takeover, orders, complaints, file upload lokal, dan rencana migrasi ke Supabase/Postgres.

Target baru adalah:

```txt
Existing Chatbot CRM
+ Telegram-first Marketplace MVP
+ Supabase/Postgres data layer
+ local media storage
+ product catalog
+ cart / checkout
+ order_items
+ payment gateway sandbox
+ AI shopping assistant
```

## How AI Agents Should Use This Folder

1. Baca `prompt-context.md` terlebih dahulu.
2. Baca `backend-boundaries.md` dan `do-not-break.md` sebelum mengubah kode.
3. Baca `current-task.md` untuk memahami prioritas implementasi saat ini.
4. Baca `ai-pipeline-rules.md`, `ai-action-contract.md`, dan `commerce-agent-guardrails.md` sebelum mengubah AI/chatbot logic.
5. Baca `security-rules-for-ai.md` sebelum menyentuh webhook, payment, auth, RLS, atau file access.
6. Baca `testing-expectations.md` sebelum menyelesaikan task.

## Document Map

| File | Purpose |
|---|---|
| `prompt-context.md` | Context utama untuk AI coding agent |
| `current-task.md` | Prioritas kerja saat ini |
| `backend-boundaries.md` | Batasan arsitektur backend |
| `do-not-break.md` | Behavior yang tidak boleh rusak |
| `ai-pipeline-rules.md` | Aturan pipeline AI reply |
| `agent-response-format.md` | Format response AI/customer-facing |
| `ai-action-contract.md` | Kontrak AI action agar side effect tervalidasi |
| `commerce-agent-guardrails.md` | Guardrails AI untuk marketplace |
| `telegram-bot-context.md` | Context Telegram webhook dan commerce flow |
| `payment-context.md` | Context payment sandbox + webhook |
| `storage-context.md` | Context local storage + file metadata |
| `security-rules-for-ai.md` | Rules keamanan untuk AI agent |
| `testing-expectations.md` | Testing expectation sebelum task dianggap selesai |
| `coding-guidelines.md` | Gaya implementasi kode |
| `context-packing.md` | Cara memberi context ke AI ketika task besar |
| `agent-evaluation.md` | Checklist evaluasi output AI |
