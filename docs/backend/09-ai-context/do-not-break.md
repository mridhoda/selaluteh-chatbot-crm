# Do Not Break

Dokumen ini berisi behavior yang tidak boleh rusak saat AI coding agent melakukan perubahan.

## Auth

Jangan rusak:

- register owner,
- OTP verification,
- login JWT,
- password reset,
- user role owner/super/agent.

## Telegram Webhook

Jangan rusak:

- incoming text message,
- photo/document/voice handling,
- `/start` behavior existing,
- contact upsert,
- chat upsert,
- message save,
- AI reply send,
- human takeover skip AI.

## Inbox / CRM

Jangan rusak:

- chat list sorting by latest message,
- unread counter,
- contact detail,
- message history order,
- human reply,
- takeover,
- resolve chat,
- escalation.

## AI Agent

Jangan rusak:

- agent prompt behavior,
- knowledge/Q&A matching,
- OpenAI/Gemini fallback,
- media-aware reply where supported,
- legacy order/complaint marker handling until replaced.

## Data Migration

Jangan rusak:

- Mongo ObjectId to UUID mapping,
- created/updated timestamp preservation,
- workspace ownership,
- local upload paths,
- message platform_message_id.

## Marketplace MVP

Saat menambahkan marketplace, jangan:

- mengubah status order tanpa valid payment event,
- membuat order tanpa cart/checkout confirmation,
- mengandalkan AI JSON sebagai satu-satunya source of truth,
- menghapus legacy order route sebelum admin UI siap.
