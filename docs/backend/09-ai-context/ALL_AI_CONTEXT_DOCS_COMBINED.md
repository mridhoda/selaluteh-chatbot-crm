# ALL AI CONTEXT DOCS COMBINED

This file combines all `09-ai-context` docs for AI onboarding/review. Use individual files for implementation tasks.


---

# File: README.md


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


---

# File: prompt-context.md


# Prompt Context

Dokumen ini adalah context utama untuk AI coding agent yang bekerja di codebase backend.

## Identity

Project ini adalah backend untuk **SelaluTeh Chatbot CRM / Telegram-first Marketplace MVP**.

Backend existing menggunakan:

```txt
Express.js
MongoDB/Mongoose
Telegram webhook
Meta webhook for WhatsApp/Instagram
OpenAI/Gemini AI reply
local file uploads
React/Vite admin dashboard frontend
```

Target baru:

```txt
Supabase/Postgres data layer
repository abstraction
Telegram commerce MVP
product catalog
cart
checkout
order_items
payment gateway sandbox
payment webhook
workspace-based multi-tenancy
local media storage retained
```

## Primary Goal

Jangan rebuild project dari nol. Lanjutkan sistem existing dengan cara:

1. Hardening security existing routes.
2. Menambahkan repository layer.
3. Menjaga behavior CRM/chatbot existing.
4. Menambahkan marketplace modules secara bertahap.
5. Memastikan AI tidak menjadi sumber kebenaran untuk order/payment.

## Critical Existing Behaviors

AI agent sudah bisa:

- menerima message dari Telegram webhook,
- menyimpan contact/chat/message,
- membaca chat history,
- menghormati human takeover,
- mengirim balasan ke Telegram,
- membuat order/complaint legacy via marker AI,
- escalate ke human.

Behavior ini harus tetap berjalan selama refactor.

## New Marketplace Behaviors

Sistem baru harus mendukung:

```txt
/start menu
browse products
product detail
add to cart
view cart
checkout confirmation
create pending order
create payment link
receive payment webhook
mark order paid
notify Telegram user
admin manage product/order/payment
```

## AI Agent Working Rule

AI coding agent harus:

- membaca docs terkait sebelum implementasi,
- tidak menghapus fitur existing tanpa alasan,
- tidak mengubah API response shape tanpa update docs,
- tidak menaruh secret di kode,
- tidak memindahkan file binary ke Postgres,
- tidak menjalankan migration production tanpa instruksi eksplisit,
- selalu menambahkan test atau minimal manual test checklist untuk flow kritis.


---

# File: current-task.md


# Current Task

Dokumen ini mendefinisikan prioritas kerja saat ini untuk AI coding agent.

## Current Objective

Mengubah backend existing dari **Chatbot CRM** menjadi fondasi aman untuk **Telegram-first Marketplace MVP**, tanpa merusak fitur existing.

## Recommended Current Sprint

### Sprint 0 — Stabilization & Marketplace Foundation

Goal:

```txt
Backend existing tetap berjalan, security risk utama dibereskan, dan data model/service boundary siap untuk product/cart/order/payment.
```

### Priority Tasks

1. Secure `orders` routes dengan auth dan workspace scope.
2. Secure `complaints` routes dengan auth dan workspace scope.
3. Remove/protect public diagnostic user routes.
4. Mount atau putuskan status `settings` route.
5. Tambahkan webhook idempotency plan/model.
6. Tambahkan repository layer skeleton.
7. Tambahkan product catalog module.
8. Tambahkan cart module.
9. Tambahkan Telegram inline keyboard helper.
10. Tambahkan payment provider abstraction untuk sandbox.

## Do First

Sebelum menambahkan fitur besar, pastikan:

- app masih bisa login,
- dashboard bisa load,
- Telegram webhook masih bisa menerima pesan,
- human takeover masih menghentikan AI,
- message history masih tersimpan.

## Do Not Do Yet

Jangan dulu implement:

- multi-seller,
- wallet seller,
- payout seller,
- voucher kompleks,
- shipping aggregator,
- refund automation,
- production payment live mode.

## Acceptance Criteria

Task dianggap selesai jika:

- existing CRM behavior tidak rusak,
- endpoint baru workspace-scoped,
- Telegram user bisa minimal melihat product list,
- cart bisa dibuat secara deterministic,
- order tidak dibuat langsung dari AI tanpa validasi backend,
- docs/API/schema yang berubah ikut diperbarui.


---

# File: backend-boundaries.md


# Backend Boundaries

Dokumen ini menjelaskan batas tanggung jawab backend agar AI coding agent tidak mencampur domain yang berbeda.

## Backend Owns

Backend bertanggung jawab untuk:

- auth dan session JWT,
- workspace ownership validation,
- platform integration credentials,
- webhook ingestion,
- chat/contact/message persistence,
- AI orchestration,
- product/catalog/cart/order/payment state,
- payment webhook validation,
- notification sending,
- file metadata dan local file serving,
- admin dashboard API.

## Backend Does Not Own

Backend tidak boleh:

- menyimpan file binary besar di Postgres,
- menyimpan service role key di frontend,
- membiarkan AI menentukan status payment,
- membiarkan Telegram user mengakses data workspace lain,
- menjalankan production migration otomatis dari request API biasa,
- menjadi UI layout decision source.

## Layer Boundaries

Recommended boundary:

```txt
routes/controllers
  -> services/use-cases
    -> repositories
      -> database client
```

Webhook route sebaiknya tipis:

```txt
receive payload
validate provider/event
store idempotency event
call platform service
return fast
```

AI service sebaiknya tidak langsung menulis order/payment. Ia harus mengembalikan intent/action proposal yang dieksekusi oleh service layer.

## External Provider Boundary

Gunakan adapter untuk:

```txt
Telegram provider
Meta provider
OpenAI provider
Gemini provider
Payment provider
Storage provider
```

Tujuannya agar provider bisa diganti tanpa rewrite domain logic.

## Database Boundary

Selama transisi Mongo -> Supabase:

- routes tidak boleh langsung mengikat diri ke Mongoose model baru,
- buat repository abstraction,
- pertahankan query contract existing,
- lakukan migration route-by-route.


---

# File: do-not-break.md


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


---

# File: ai-pipeline-rules.md


# AI Pipeline Rules

Dokumen ini menjelaskan aturan pipeline AI backend.

## Current AI Pipeline

Current behavior:

```txt
incoming message
-> save user message
-> check human takeover
-> build prompt/context
-> call AI provider
-> parse markers
-> send reply
-> save AI message
```

## Target AI Pipeline

Target commerce-ready pipeline:

```txt
incoming message
-> normalize platform event
-> save message
-> load chat/session/cart context
-> detect if takeover exists
-> if takeover: stop AI
-> call AI assistant for intent/reply
-> validate action proposal
-> execute allowed backend action
-> send reply/keyboard
-> save result
```

## Provider Rules

- OpenAI/Gemini provider calls must be isolated in AI client/service.
- Provider errors should not crash webhook route.
- Fallback reply is allowed, but must be clearly safe and not invent order/payment state.

## Context Rules

AI prompt may include:

- current workspace/agent info,
- recent chat messages,
- relevant product summaries,
- current cart summary,
- FAQ/knowledge snippets,
- known policies.

AI prompt must not include:

- service role key,
- payment gateway secret,
- full customer database,
- unrelated workspace data,
- hidden admin-only notes unless required.

## Marketplace Rules

AI can propose:

```txt
search_products
show_product_detail
add_to_cart_request
checkout_request
check_order_status
handoff_to_human
```

AI cannot directly:

```txt
mark_payment_paid
change_product_price
override_stock
cancel_paid_order
refund_payment
read another user's order
```

## Marker Transition

Legacy markers like `FILE_ORDER_JSON` may remain temporarily for existing sales form behavior. New marketplace flow should prefer structured action proposals validated by backend service.


---

# File: agent-response-format.md


# Agent Response Format

Dokumen ini mendefinisikan format response AI/customer-facing dan action-facing.

## Customer-Facing Reply Style

AI reply ke customer harus:

- jelas,
- singkat,
- ramah,
- tidak terlalu teknis,
- tidak menjanjikan hal yang tidak ada di database,
- meminta konfirmasi sebelum checkout/order.

Contoh:

```txt
Siap kak 😊 Ini isi keranjang kakak:
- Salty Caramel x2
Total: Rp50.000

Mau lanjut checkout sekarang?
```

## Action-Facing Output

Jika AI menghasilkan action proposal, format internal harus deterministic.

Recommended structure:

```json
{
  "reply": "Aku temukan beberapa produk yang cocok kak.",
  "actions": [
    {
      "type": "search_products",
      "input": {
        "query": "salty caramel"
      }
    }
  ],
  "handoff": false,
  "confidence": 0.82
}
```

## Rules

- `reply` boleh dikirim ke user setelah backend validasi.
- `actions` harus divalidasi backend.
- Jika confidence rendah, AI harus minta klarifikasi atau handoff.
- Jangan kirim raw JSON internal ke customer.

## Telegram Button Reply

Untuk flow commerce, backend boleh menambahkan inline keyboard:

```json
{
  "text": "Pilih produk:",
  "buttons": [
    { "label": "Salty Caramel", "callback_data": "product:view:<id>" }
  ]
}
```

AI tidak boleh membuat callback id acak. Callback data harus dibuat backend.


---

# File: ai-action-contract.md


# AI Action Contract

Dokumen ini mendefinisikan kontrak AI action agar side effect backend aman.

## Principle

AI hanya boleh **mengusulkan action**. Backend yang memvalidasi dan mengeksekusi.

```txt
AI proposal != final state change
```

## Allowed Actions for MVP

| Action | Backend Validation |
|---|---|
| `search_products` | workspace scope, active products only |
| `show_product_detail` | product belongs to workspace and active |
| `add_to_cart` | product/variant active, qty valid, stock rule valid |
| `remove_from_cart` | cart belongs to contact/session |
| `view_cart` | cart belongs to contact/session |
| `start_checkout` | cart not empty, contact valid |
| `check_order_status` | order belongs to contact/workspace |
| `handoff_to_human` | chat belongs to workspace |

## Forbidden Actions

AI must not execute or propose final state for:

- payment success,
- refund,
- stock override,
- price override,
- workspace switch,
- admin permission change,
- reading private data from another contact.

## Action Record

Every executed action should be logged to `ai_actions` or equivalent audit table:

```txt
workspace_id
chat_id
message_id
agent_id
action_type
input_json
result_json
status
created_at
```

## Confirmation Required

These actions require explicit user confirmation:

- checkout,
- create order,
- cancel order,
- handoff if it reveals wait time or admin availability.

## Error Handling

If validation fails:

- do not execute action,
- reply with safe clarification,
- log failed action,
- never expose stack trace to user.


---

# File: commerce-agent-guardrails.md


# Commerce Agent Guardrails

Dokumen ini adalah guardrails AI untuk marketplace.

## AI Role

AI adalah:

```txt
shopping assistant + customer service assistant
```

AI bukan:

```txt
payment processor
inventory authority
admin user
accounting system
```

## Product Truth

AI hanya boleh menyebut produk, harga, varian, stok, promo, dan aturan yang berasal dari database atau context yang diberikan backend.

Jika tidak tahu:

```txt
Aku cekkan dulu ya kak.
```

Bukan:

```txt
Sepertinya tersedia.
```

## Price Rule

AI tidak boleh:

- membuat harga baru,
- memberi diskon tanpa promo aktif,
- mengubah total order,
- membulatkan nominal yang berbeda dari backend.

## Order Rule

AI tidak boleh membuat order final tanpa:

1. cart valid,
2. summary ditampilkan,
3. user confirm checkout,
4. backend create order.

## Payment Rule

AI tidak boleh bilang pembayaran berhasil kecuali backend payment status sudah `paid/settlement/success` dari webhook valid.

## Complaint Rule

Untuk complaint:

- kumpulkan detail secukupnya,
- buat complaint record via backend,
- jika user marah/urgent, escalate ke human.

## Human Handoff Rule

Handoff jika:

- AI confidence rendah,
- user meminta admin,
- payment bermasalah,
- refund/cancel paid order,
- data tidak cocok,
- user mengirim komplain serius.


---

# File: telegram-bot-context.md


# Telegram Bot Context

Dokumen ini memberi context khusus untuk AI coding agent yang mengubah Telegram integration.

## Existing Telegram Architecture

Telegram saat ini memakai webhook:

```txt
POST /webhook/telegram/:token?
```

Flow existing:

```txt
Telegram update
-> find platform
-> find agent
-> upsert contact
-> upsert chat
-> save message
-> skip AI if takeover_by exists
-> generate AI reply
-> send Telegram reply
-> save AI message
```

## New Telegram Commerce Flow

Target flow:

```txt
/start
-> show main menu
-> browse products
-> view product detail
-> add to cart
-> view cart
-> checkout
-> send payment link
-> notify payment status
```

## Callback Data Convention

Use deterministic callback data:

```txt
menu:products
product:list:<page>
product:view:<product_id>
cart:add:<variant_id>
cart:view
cart:remove:<cart_item_id>
checkout:start
checkout:confirm:<checkout_id>
order:view:<order_id>
human:handoff
```

Rules:

- callback data must not contain secret.
- validate all ids server-side.
- callback id does not prove ownership.
- always scope by workspace + contact/chat.

## Telegram Message UX

Keep messages short. Use buttons for actions. Send long product descriptions as summary, not database dump.

## Idempotency

For every update:

- store provider event id/update id where possible,
- do not process same message twice,
- do not create duplicate cart/order from repeated callback.

## Human Takeover

If `chats.takeover_by` exists:

- save incoming user message,
- do not auto AI reply,
- optionally notify assigned human/admin.


---

# File: payment-context.md


# Payment Context

Dokumen ini memberi context payment gateway untuk AI coding agent.

## Current Payment State

Existing app hanya punya manual payment instruction/QRIS proof style. Belum ada gateway sandbox.

## Target MVP Payment

Gunakan payment provider abstraction:

```txt
PaymentProvider
  createPaymentLink(order)
  verifyWebhook(payload, headers)
  normalizeStatus(event)
```

Provider awal boleh:

- Midtrans sandbox, atau
- Xendit sandbox, atau
- mock provider untuk local development.

## Payment Flow

```txt
checkout confirmed
-> create pending order
-> create payment row pending
-> call provider create payment link
-> store provider transaction id
-> send payment link to Telegram user
-> receive provider webhook
-> verify signature
-> insert payment_event
-> update payment status
-> update order payment_status/order status
-> notify Telegram user
```

## Status Truth

Payment status hanya valid dari:

- verified payment provider webhook,
- manual admin override with audit log,
- sandbox simulation endpoint restricted to dev/test.

AI cannot mark payment as paid.

## Required Data

Payment row should include:

```txt
workspace_id
order_id
provider
provider_transaction_id
amount
currency
status
payment_link_url
expires_at
paid_at
metadata
```

Payment event should include raw/normalized payload for audit.

## Security

- verify webhook signature,
- idempotency on provider event id,
- never expose provider secret to frontend,
- never trust amount from client,
- compare webhook amount with order total.


---

# File: database-context.md


# Database Context for AI

Dokumen ini memberi ringkasan data-layer context untuk AI coding agent.

## Current Runtime

Current backend runtime masih MongoDB/Mongoose.

## Target Data Layer

Target adalah Supabase/Postgres dengan:

- explicit `workspaces`,
- `workspace_id` di semua tenant-owned tables,
- normalized agent child tables,
- CRM tables: contacts/chats/messages,
- marketplace tables: products/cart/checkout/order_items/payments,
- local file metadata table `files`,
- RLS policies prepared.

## Migration Strategy

Recommended:

```txt
schema design
-> repository layer
-> route-by-route migration
-> historical import
-> cutover
-> remove Mongo dependency
```

## AI Coding Rule

If task touches data access:

- do not call DB directly from scattered logic,
- prefer repository/service,
- preserve query contracts,
- preserve timestamps during migration,
- do not infer workspace from user alone when row has workspace_id.

## Important Query Contracts

- contact upsert: `workspace_id + platform_type + platform_account_id`
- chat upsert: `workspace_id + platform_id + contact_id`
- inbox sort: `last_message_at desc`
- messages sort: `created_at asc`
- orders/complaints: auth + workspace scope
- webhook idempotency: no duplicate provider message/event id


---

# File: storage-context.md


# Storage Context

Dokumen ini menjelaskan context storage untuk AI coding agent.

## Storage Decision

```txt
Structured data -> Supabase/Postgres
Large binary/media -> local server filesystem
File metadata -> Postgres table files
```

Do not move media files into Postgres.

## Local Upload Root

Current app uses:

```txt
server/uploads
```

Recommended env:

```txt
LOCAL_UPLOAD_ROOT=/absolute/path/to/server/uploads
PUBLIC_FILES_BASE_URL=https://your-domain.example/files
```

## Recommended Folder Layout

```txt
uploads/chat
uploads/agent-files
uploads/payment-proofs
uploads/product-images
uploads/category-images
uploads/public-assets
uploads/temp
```

## Files Metadata

Every persisted file should have metadata:

```txt
workspace_id
storage_provider = local
disk = uploads
relative_path
public_path
original_name
stored_name
mime_type
size_bytes
source
created_by
created_at
```

## AI Coding Rules

- Do not store absolute server path in DB.
- Do not assume `/files/<name>` means ownership is safe.
- Validate workspace before returning protected file metadata.
- Add size/type checks for uploads.
- Use `temp` only for temporary downloads.
- Make uploads persistent in Docker/deployment.

## Product Images

Product images for marketplace should use `files` rows with `source = product_image` or compatible enum/source value.


---

# File: human-handoff-context.md


# Human Handoff Context

Dokumen ini menjelaskan context human takeover/handoff.

## Existing Behavior

Existing app punya `chats.takeover_by`. Jika field ini ada, AI harus berhenti membalas customer otomatis.

## Rules

When human takeover active:

- still save incoming user messages,
- do not call AI reply pipeline,
- do not send AI/autobot response,
- notify or surface unread count for human/admin,
- allow human send via CRM inbox.

## AI Escalation

AI may propose `handoff_to_human` when:

- user asks for human/admin,
- payment problem,
- refund/cancel paid order,
- serious complaint,
- low confidence,
- repeated misunderstanding.

## Marketplace Impact

If user is in checkout/payment flow and takeover happens:

- cart/order state remains unchanged,
- human can continue manually,
- AI must not resume unless takeover released.

## Release Takeover

If app supports release takeover later, it must be explicit admin action and should be auditable.


---

# File: notification-context.md


# Notification Context

Dokumen ini memberi context notification backend.

## Notification Channels

Current external channels:

- Telegram,
- WhatsApp/Instagram via Meta,
- Email for OTP/reset.

MVP focus:

```txt
Telegram commerce notification
```

## Notification Events

Important events:

- order created,
- payment link created,
- payment paid,
- payment failed/expired,
- order processed,
- order completed,
- complaint created,
- human takeover.

## Rules

- Notification should not decide business state.
- State changes first, notification second.
- Failed notification should be logged/retried if important.
- Do not expose internal IDs unless user-facing order code exists.

## Telegram Notification Examples

```txt
Pembayaran berhasil ✅
Pesanan #ST-2026-0001 sedang diproses.
```

```txt
Link pembayaran sudah dibuat:
<payment_url>
Batas pembayaran: 30 menit.
```


---

# File: tool-calling-contract.md


# Tool Calling Contract

Dokumen ini menjelaskan kontrak internal jika AI memakai tool/function calling.

## Principle

Tool calling harus menjadi layer aman antara AI dan backend.

```txt
AI selects tool + arguments
Backend validates arguments
Backend executes service
Backend returns safe result
```

## Recommended Tools

```txt
search_products(query)
get_product_detail(product_id)
get_cart()
add_cart_item(variant_id, quantity)
remove_cart_item(cart_item_id)
start_checkout()
confirm_checkout(checkout_id)
get_order_status(order_id/order_code)
request_human_handoff(reason)
```

## Argument Rules

- Never trust IDs from AI without workspace/contact validation.
- Quantity must be integer and within bounds.
- Product/variant must be active.
- Checkout must be confirmed by user.
- Payment tools must not expose secret/provider credentials.

## Result Rules

Tool results returned to AI should be minimal and safe:

```json
{
  "ok": true,
  "cart_summary": {
    "items": 2,
    "total": 50000
  }
}
```

Do not return full database rows if not needed.


---

# File: security-rules-for-ai.md


# Security Rules for AI

Dokumen ini berisi aturan keamanan yang wajib diikuti AI coding agent.

## Never Expose Secrets

Jangan tampilkan atau commit:

- Telegram bot token,
- Meta access token,
- OpenAI/Gemini key,
- Supabase service role key,
- payment provider secret,
- JWT secret,
- database URL dengan password.

## Workspace Isolation

Every tenant-owned operation must validate:

```txt
row.workspace_id == current_user.workspace_id
```

Webhook writes must derive workspace from verified platform lookup.

## Public Webhooks

Webhook routes are public by necessity, but must validate:

- platform token/account,
- provider signature where available,
- event idempotency,
- payload shape.

## AI Prompt Security

AI must not receive:

- secret env,
- service role key,
- full database dump,
- other workspace/customer data,
- raw webhook headers containing secrets unless sanitized.

## Payment Security

- Never trust frontend amount.
- Always verify webhook signature.
- Compare provider amount with order amount.
- Store raw event for audit, but avoid logging secrets.
- AI cannot mark payment as paid.

## File Security

- Validate MIME and extension.
- Limit file size.
- Store under controlled upload root.
- Avoid path traversal.
- Consider protected media endpoint for private files.

## Admin Safety

AI agent must not create admin bypass, debug public routes, or hardcoded super user unless explicitly requested for local dev and documented.


---

# File: testing-expectations.md


# Testing Expectations

Dokumen ini menjelaskan minimum testing expectation untuk AI coding agent.

## Required Testing Mindset

Sebelum menyelesaikan task, AI agent harus menyebutkan:

- apa yang diubah,
- cara menjalankan test/manual check,
- risiko yang tersisa,
- file penting yang disentuh.

## Critical Manual Smoke Tests

After backend changes:

- login owner works,
- dashboard loads,
- platforms page loads,
- chats list loads,
- chat messages ordered correctly,
- human reply sends,
- takeover skips AI,
- Telegram test webhook still works.

## Marketplace Smoke Tests

If product/cart/order changed:

- owner can create product,
- Telegram user can view product list,
- user can add item to cart,
- cart total is correct,
- checkout creates pending order,
- order_items match cart items,
- AI cannot create paid order.

## Payment Smoke Tests

If payment changed:

- payment link can be created in sandbox/mock,
- webhook signature validation exists,
- duplicate webhook does not double update,
- order becomes paid only after valid event,
- Telegram notification is sent or queued.

## Migration Smoke Tests

If data migration changed:

- run dry run first,
- validate count parity,
- validate workspace ids,
- validate timestamps,
- validate local file metadata,
- check orphan records.

## Automated Test Preference

Prefer tests for:

- pure service logic,
- repository query contract,
- webhook idempotency,
- payment status mapping,
- cart/order total calculation.


---

# File: coding-guidelines.md


# Coding Guidelines for AI Agents

Dokumen ini memberi panduan gaya implementasi untuk AI coding agent.

## General Rules

- Make small, focused changes.
- Prefer service/repository boundary over huge route handlers.
- Avoid large refactors unless task explicitly asks for it.
- Keep existing API response shape unless docs are updated.
- Always validate workspace ownership.
- Keep file paths portable.

## Naming

Current Mongo code uses camelCase. Target Postgres uses snake_case. Repository layer should normalize field mapping.

Use clear domain names:

```txt
ProductService
CartService
CheckoutService
OrderService
PaymentService
TelegramCommerceService
AiActionService
```

## Error Handling

Return safe errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Quantity must be at least 1."
  }
}
```

Do not expose stack trace to client.

## Side Effects

Side effects should be explicit:

- send Telegram message,
- create order,
- update payment,
- write file,
- call AI provider.

Avoid hiding side effects inside helper functions with vague names.

## Environment

Read env from config module where possible. Do not scatter `process.env` everywhere.

## Logging

Log:

- request id/event id,
- provider event id,
- workspace id,
- chat/order/payment id.

Do not log secrets or full payment payload with sensitive fields.


---

# File: context-packing.md


# Context Packing

Dokumen ini menjelaskan cara mengemas context untuk AI coding agent ketika task besar.

## Preferred Context Order

Untuk task backend besar, berikan AI context dengan urutan:

1. `09-ai-context/prompt-context.md`
2. `09-ai-context/current-task.md`
3. `09-ai-context/do-not-break.md`
4. Relevant folder docs:
   - `04-tech-spec` untuk arsitektur,
   - `05-api-spec` untuk endpoint,
   - `06-data` untuk schema,
   - `08-security` untuk security,
   - `02-flows` untuk flow.
5. Specific source files yang akan diubah.

## Avoid Context Overload

Jangan lempar semua docs kalau task kecil. Pilih context sesuai task:

| Task | Required Context |
|---|---|
| Telegram callback | telegram-bot-context, webhook API, Telegram flow |
| Payment webhook | payment-context, payment API, payment security |
| Product CRUD | product rules, product API, schema |
| AI action | ai-action-contract, guardrails, AI pipeline |
| Migration | data docs, mapping, checklist |

## Combined Docs

Combined docs boleh dipakai untuk:

- AI onboarding,
- project audit,
- big refactor planning.

Tapi untuk implementation task, lebih baik beri file spesifik agar AI tidak bingung.

## Expected AI Response

Saat AI diberi task, minta output:

```txt
Understanding
Plan
Files to change
Implementation
Tests/manual checks
Risks
```


---

# File: agent-evaluation.md


# Agent Evaluation

Dokumen ini membantu mengevaluasi apakah output AI coding agent layak dipakai.

## Good Output Signs

AI output bagus jika:

- memahami app existing sebagai CRM chatbot, bukan greenfield,
- menjaga Telegram webhook existing,
- menjaga human takeover,
- memakai workspace scope,
- tidak menaruh secret,
- tidak menjadikan AI sebagai source of truth payment/order,
- menambahkan validasi dan error handling,
- memperbarui docs terkait.

## Bad Output Signs

Hati-hati jika AI:

- menghapus fitur existing tanpa alasan,
- mengganti Mongo ke Supabase sekaligus tanpa repo layer/cutover plan,
- membuat payment paid dari input user,
- membuat order langsung dari prompt AI tanpa confirmation,
- mengekspos service role ke frontend,
- membuat route admin tanpa auth,
- menyimpan file binary di database,
- mengabaikan workspace_id.

## Review Checklist

- [ ] Apakah perubahan sesuai task?
- [ ] Apakah route protected?
- [ ] Apakah workspace scoped?
- [ ] Apakah idempotency dipikirkan?
- [ ] Apakah payment/signature aman?
- [ ] Apakah AI action tervalidasi?
- [ ] Apakah existing behavior masih aman?
- [ ] Apakah tests/manual checks tersedia?

## Merge Readiness

Jangan merge jika:

- test/smoke check belum jelas,
- perubahan terlalu besar tanpa alasan,
- ada secret di diff,
- ada breaking change API tanpa update docs,
- ada route publik yang bisa mengubah data tenant.
