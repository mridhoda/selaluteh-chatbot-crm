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

## Telegram Webhook Reliability (new)

Jangan rusak:

- `fetchWithIPv4()` di `sender.js` — paksa DNS resolve ke IPv4 + kirim via `https.request()`,
- `webhook-manager.worker.js` — auto-check webhook tiap 5 menit, auto-renew saat URL berubah atau ada error,
- `NODE_OPTIONS="--dns-result-order=ipv4first"` di dev script,
- webhook auto-set saat server start (bootstrap di `index.js`),
- retry 2x dengan delay 1 detik di `tgSend()`.

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

## AI Agent Architecture (new)

Jangan rusak:

- greeting continuity (`isFirstAssistantMessageInChat` flag) — welcome hanya 1x,
- computeGreetingFlags() — AI harus membaca database history agar tahu ini pesan ke berapa,
- `senderType: 'ai'` dan `senderType: 'assistant'` keduanya dihitung sebagai AI message,
- loadRecentMessages() — history dimuat dari database sebelum AI reply,
- context builder — policy, greeting, summary, memory disusun otomatis,
- tool gateway — AI hanya bisa akses commerce via tools yang terdaftar,
- confirmation tokens — tool mutasi butuh konfirmasi,
- idempotency — tool idempotent tidak duplikat effect,
- human takeover silence — AI tidak reply saat `takenOverByUserId != null`,
- memory service — workspace/contact scope, aktivasi, koreksi, forget,
- RAG isolation — tidak cross-workspace,
- AI run trace — setiap turn terekam,
- `ai_enabled = false` — AI tidak boleh reply.

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
