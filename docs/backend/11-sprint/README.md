# 11 Sprint Documentation

Folder ini berisi dokumen perencanaan sprint untuk backend **SelaluTeh Chatbot CRM — Telegram Marketplace MVP**.

Dokumen ini bukan API spec, bukan database schema, dan bukan business rules. Fokus folder ini adalah:

- Menentukan urutan implementasi.
- Menjaga scope MVP tetap realistis.
- Menyediakan backlog yang bisa dieksekusi.
- Menentukan Definition of Done.
- Mencatat progress, risiko, milestone, dan status implementasi.
- Memberi format kerja yang konsisten untuk AI coding agent.

## Product Direction

Backend saat ini berasal dari Chatbot CRM dengan:

- Telegram webhook.
- WhatsApp/Instagram webhook.
- AI agents.
- Inbox/chat history.
- Human takeover.
- Contacts.
- Orders/complaints legacy.
- MongoDB/Mongoose existing runtime.

Target MVP baru:

```txt
Telegram-first single-merchant marketplace
+ product catalog
+ cart
+ checkout
+ payment gateway sandbox
+ payment webhook
+ admin product/order management
+ AI shopping assistant
+ Supabase/Postgres migration path
```

## Recommended Reading Order

1. `milestones.md`
2. `sprint-plan.md`
3. `backlog.md`
4. `task-breakdown.md`
5. `definition-of-done.md`
6. `estimation-guide.md`
7. `risk-log.md`
8. `implementation-status.md`
9. `progress-log.md`
10. `release-checklist.md`

## Sprint Philosophy

Prioritas utama:

```txt
Stabilize existing CRM
→ secure data access
→ add repository boundary
→ migrate database safely
→ add commerce primitives
→ implement Telegram commerce flow
→ add payment sandbox
→ harden MVP
```

Jangan langsung membangun marketplace besar. MVP harus membuktikan flow:

```txt
Telegram chat
→ browse product
→ add to cart
→ checkout
→ payment link
→ payment webhook
→ order paid notification
```
