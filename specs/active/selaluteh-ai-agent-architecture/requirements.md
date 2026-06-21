---
schema_version: 1
document_type: requirements
spec_id: selaluteh-ai-agent-architecture
title: SelaluTeh AI Agent Architecture Requirements
status: draft
version: 1.0.0
updated_at: 2026-06-19
---

# Requirements Document: SelaluTeh AI Agent Architecture

## Introduction

Dokumen ini mendefinisikan kebutuhan fungsional dan non-fungsional khusus untuk **arsitektur AI Agent SelaluTeh / KALIS.AI**.

Dokumen ini tidak menggantikan requirements backend marketplace, product, cart, order, payment, inventory, workspace, outlet, atau platform integration.

Domain-domain tersebut tetap memiliki requirements dan design authority masing-masing.

Dokumen ini hanya mengatur:

- bagaimana AI menerima dan memahami percakapan;
- bagaimana AI mempertahankan context;
- bagaimana AI menggunakan recent memory, rolling summary, dan durable customer memory;
- bagaimana AI menggunakan knowledge base melalui RAG;
- bagaimana AI agent dipilih, dikonfigurasi, dan diberi versi;
- bagaimana model provider dipilih dan di-fallback;
- bagaimana AI melakukan structured tool calling;
- bagaimana Tool Gateway mengamankan seluruh action;
- bagaimana AI berinteraksi dengan cart, order, payment, complaint, dan notification;
- bagaimana AI berhenti saat human takeover;
- bagaimana AI dievaluasi, diaudit, dan ditingkatkan;
- bagaimana arsitektur disiapkan untuk specialist agents di masa depan.

Prinsip utama:

```text
LLM memahami bahasa dan memilih tindakan.

AI Orchestrator mengontrol proses reasoning dan tool loop.

Tool Gateway memvalidasi setiap action.

Backend domain services menjalankan business rules.

Supabase menyimpan persistent AI state.

Verified Xendit backend processing menentukan payment paid.

Human agent selalu memiliki authority yang lebih tinggi daripada AI.
```

AI tidak menjadi source of truth untuk:

```text
product price
stock
product availability
cart state
order state
payment state
permission
workspace access
outlet access
fulfillment state
refund
```

---

# Product Decisions

## MVP Channels

MVP customer-facing mencakup:

```text
Telegram
WhatsApp
```

Admin menggunakan dashboard chat yang sudah ada.

AI core harus channel-agnostic agar channel tambahan dapat menggunakan architecture yang sama.

## MVP Agent Capability

AI dapat:

```text
menjawab pertanyaan customer
menggunakan knowledge base
merekomendasikan produk
meminta customer memilih outlet
membaca live catalog melalui tools
mengelola cart melalui tools
menampilkan cart summary
meminta final order confirmation
membuat order melalui backend tool
membuat Xendit payment link
membaca payment status
menjelaskan order status
membuat complaint ticket
melakukan human handoff
mengirim transactional notification
menjalankan follow-up yang diizinkan
```

AI tidak dapat:

```text
mengubah payment menjadi paid
mengubah harga
mengubah stock
membypass outlet selection
membypass order confirmation
memaksa order completed
melakukan refund
mempublish knowledge
mengubah permission
mengakses data workspace lain
```

## Order Decision

AI tidak langsung membuat order hanya karena customer menyebut produk.

Flow wajib:

```text
customer order intent
→ outlet suggestion/selection
→ cart draft
→ cart summary
→ explicit customer confirmation
→ backend order creation
```

## Payment Decision

MVP hanya menggunakan:

```text
Xendit payment gateway
```

Tidak tersedia:

```text
cash on delivery
manual transfer
manual mark-paid
AI mark-paid
```

AI tidak perlu menanyakan metode pembayaran setelah order confirmed.

AI boleh meminta backend membuat Xendit payment link.

AI hanya dapat membaca payment status setelah backend memproses provider event.

## Fulfillment Decision

MVP hanya menggunakan:

```text
PICKUP
```

Delivery belum aktif.

Alamat:

```text
tidak diminta pada pickup flow
tidak disimpan sebagai customer memory
boleh dipersiapkan sebagai nullable future field
```

## Outlet Decision

Customer memilih outlet setiap memulai order.

AI boleh memberi suggestion outlet terakhir, tetapi tetap meminta confirmation.

## Cart Decision

Satu customer memiliki maksimum satu active cart dalam satu workspace.

Cart terikat ke satu outlet.

Pindah outlet dengan cart berisi item wajib meminta confirmation dan menjalankan deterministic cart handling.

## Memory Decision

Boleh diingat:

```text
display name
preferred language
last/favorite outlet
favorite products
taste preference
communication preference
customer tags
order-derived preference
```

Tidak boleh diingat:

```text
address
OTP
password
card data
payment credential
provider secret
API key
sensitive data yang tidak diperlukan
```

Customer dapat melihat, mengoreksi, dan melupakan memory.

## Retention Decision

Default:

```text
raw messages: 90 hari
recent AI context: 20–30 pesan
rolling summary: aktif
AI prompt/result trace: 30 hari
tool trace: 90 hari
durable preference: sampai dihapus, expired, atau superseded
```

## Language and Persona

MVP menggunakan Bahasa Indonesia.

Tone:

```text
ramah
hangat
semi-formal
Gen-Z
ringkas
tidak kaku
tidak berlebihan
```

Nama agent berasal dari konfigurasi setiap AI Agent.

AI memperkenalkan diri hanya pada assistant response pertama dalam chat baru.

## Human Takeover

Saat human takeover aktif:

```text
AI tidak boleh mengirim customer-facing response.
```

Resume melalui:

```text
admin Resume AI
atau
5 menit tidak ada pesan customer baru
```

Pinned takeover tidak auto-resume.

## Model Decision

Primary provider:

```text
local OpenAI-compatible endpoint
```

Provider dan model harus dapat diganti melalui adapter/router.

## Multi-Agent Direction

MVP:

```text
lightweight router
→ one selected configurable agent
→ deterministic backend tools
```

Future specialist agents diperbolehkan, tetapi seluruh mutation tetap melalui Tool Gateway yang sama.

---

# Architectural Baseline

| Area | Decision |
|---|---|
| AI runtime | Node.js module dalam backend existing |
| Primary model | Local OpenAI-compatible model |
| Provider architecture | Provider adapter + model router |
| Orchestration | Custom bounded orchestrator |
| Tool execution | Native structured tool/function calling |
| Persistent AI state | Supabase/PostgreSQL |
| Vector search | Supabase pgvector |
| Retrieval | Hybrid vector + full-text search |
| LangChain | Optional adapter untuk RAG/helper |
| LangGraph | Deferred sampai workflow kompleks membutuhkannya |
| Redis | Optional cache, lock, rate limit, atau queue |
| n8n | Non-critical automation only |
| Channel architecture | Telegram + WhatsApp adapters |
| Memory | Recent context + summary + durable preference + structured commerce state |
| Payment authority | Backend verified Xendit processing |
| Human authority | Human takeover supersedes AI |
| Trace | Redacted, access-controlled, version-linked |
| Retention | Configurable dengan default yang telah disetujui |

---

# Dependency Boundary

AI architecture bergantung pada backend domain contracts untuk:

```text
contacts
chats
messages
workspace
outlets
products
product availability
cart
checkout
orders
payments
complaints
notifications
human takeover
```

Dokumen ini tidak mendefinisikan ulang internal schema dan lifecycle lengkap domain tersebut.

AI hanya berinteraksi dengan domain melalui:

```text
service interface
repository-safe query
Tool Gateway
normalized result
```

Jika backend domain belum tersedia, AI feature terkait harus dianggap:

```text
blocked
deferred
atau
mock-only
```

AI tidak boleh membuat shadow implementation yang berbeda dari domain authority.

---

# Glossary

- **AI_Agent**: Konfigurasi persona, model, tools, knowledge, memory policy, dan routing behavior.
- **Agent_Version**: Snapshot immutable dari konfigurasi agent yang digunakan untuk satu AI run.
- **Agent_Router**: Komponen yang memilih agent untuk satu turn.
- **Semantic_Router**: Komponen yang mengklasifikasikan intent dan kebutuhan RAG/tools.
- **Model_Router**: Komponen yang memilih provider/model berdasarkan task.
- **AI_Orchestrator**: Komponen yang membangun context, memanggil model, memvalidasi output, dan mengontrol tool loop.
- **Context_Builder**: Komponen yang menggabungkan safety policy, agent prompt, memory, RAG, commerce state, dan current message.
- **Tool_Gateway**: Boundary yang memvalidasi dan mengeksekusi tool call.
- **Tool_Registry**: Daftar tool yang secara resmi tersedia.
- **Recent_Memory**: Pesan terbaru yang dimasukkan ke context.
- **Rolling_Summary**: Ringkasan terstruktur dari percakapan sebelumnya.
- **Durable_Memory**: Preferensi customer yang disimpan lintas session.
- **Commerce_State**: Cart, order, payment, outlet, dan fulfillment state dari backend.
- **Conversation_Session**: Window context AI dalam permanent chat.
- **Permanent_Chat**: Record CRM percakapan yang tidak hilang saat session context direset.
- **RAG**: Retrieval-Augmented Generation.
- **Knowledge_Source**: Dokumen atau record yang menjadi sumber RAG.
- **Knowledge_Chunk**: Potongan source yang di-embed dan di-retrieve.
- **Retrieval_Scope**: Workspace, outlet, agent, visibility, dan validity filter.
- **Function_Calling**: Structured model output untuk meminta tool.
- **Human_Takeover**: State ketika AI berhenti mengirim balasan customer-facing.
- **AI_Run**: Satu eksekusi AI untuk satu customer turn.
- **Tool_Call**: Satu permintaan action dari model ke Tool Gateway.
- **Prompt_Version**: Versi immutable prompt/policy yang dipakai pada AI run.
- **Fallback_Model**: Model alternatif ketika primary provider tidak sehat.
- **Circuit_Breaker**: Mekanisme menghentikan sementara provider yang gagal.
- **Redaction**: Penghapusan secret atau sensitive data dari log/trace.
- **Evaluation_Set**: Kumpulan scenario untuk mengukur kualitas agent.
- **Follow_Up**: Pesan proaktif yang dijadwalkan oleh policy.
- **Dedupe_Key**: Key yang mencegah side effect atau notification ganda.

---

# Requirement Summary

| ID | Requirement | Priority |
|---|---|---|
| AIA-R1 | Channel-Normalized AI Inbound Pipeline | P0 |
| AIA-R2 | Stable Contact and Chat Identity | P0 |
| AIA-R3 | Message Persistence and Idempotency | P0 |
| AIA-R4 | Conversation Sessions | P0 |
| AIA-R5 | Greeting and Context Continuity | P0 |
| AIA-R6 | Recent Conversation Memory | P0 |
| AIA-R7 | Rolling Conversation Summary | P0 |
| AIA-R8 | Durable Customer Memory | P0 |
| AIA-R9 | Memory Privacy, Correction, and Forgetting | P0 |
| AIA-R10 | AI Context Builder and Token Budget | P0 |
| AIA-R11 | Knowledge Source Management | P0 |
| AIA-R12 | Knowledge Ingestion and Chunking | P0 |
| AIA-R13 | RAG Retrieval and Isolation | P0 |
| AIA-R14 | Live Commerce Data Authority | P0 |
| AIA-R15 | AI Agent Configuration and Versioning | P0 |
| AIA-R16 | Agent Assignment and Routing | P0 |
| AIA-R17 | Model Provider Adapter and Model Router | P0 |
| AIA-R18 | AI Orchestrator and Structured Output | P0 |
| AIA-R19 | Tool Registry and Tool Gateway | P0 |
| AIA-R20 | Confirmation and Mutation Policy | P0 |
| AIA-R21 | Commerce Conversation Guardrails | P0 |
| AIA-R22 | Payment Read-Only AI Boundary | P0 |
| AIA-R23 | Complaint and Human Escalation | P0 |
| AIA-R24 | Human Takeover and Safe Resume | P0 |
| AIA-R25 | Proactive Messaging and Follow-Up | P1 |
| AIA-R26 | AI Trace and Observability | P0 |
| AIA-R27 | Feedback and Evaluation | P1 |
| AIA-R28 | AI Security and Prompt-Injection Defense | P0 |
| AIA-R29 | Retention, Background Jobs, and Reliability | P0 |
| AIA-R30 | Performance, Limits, and Cost Controls | P1 |
| AIA-R31 | LangChain, LangGraph, Redis, and n8n Boundaries | P0 |
| AIA-R32 | Future Multi-Agent Readiness | P1 |
| AIA-R33 | AI Testing and Quality Assurance | P0 |
| AIA-R34 | AI Administration and Safe Configuration APIs | P1 |

---

# Requirements

## AIA-R1: Channel-Normalized AI Inbound Pipeline

**Priority:** P0

**User Story:** Sebagai platform, saya ingin pesan Telegram dan WhatsApp dinormalisasi sebelum diproses AI, sehingga AI core tidak bergantung pada format provider tertentu.

### Acceptance Criteria

1. THE AI_System SHALL menerima inbound event dari Telegram dan WhatsApp melalui channel adapter.
2. THE Channel_Adapter SHALL memverifikasi provider webhook sebelum event diteruskan ke AI pipeline.
3. THE Channel_Adapter SHALL menghasilkan normalized inbound event dengan minimum:
   - `workspace_id`
   - `platform_id`
   - `provider`
   - `external_message_id`
   - `external_conversation_id`
   - `external_user_id`
   - `message_type`
   - `text`
   - safe media metadata
   - provider timestamp.
4. THE AI_System SHALL TIDAK memproses raw provider payload secara langsung di orchestrator.
5. THE AI_System SHALL menyimpan inbound message sebelum AI generation dimulai.
6. THE AI_System SHALL mendukung text, supported media, reply context, dan safe system event.
7. THE AI_System SHALL menolak event dari provider yang gagal verification.
8. THE AI_System SHALL mencatat verification failure secara aman tanpa mengekspos secret.
9. THE AI_System SHALL memisahkan channel acknowledgement dari AI processing.
10. Heavy AI processing MAY berjalan asynchronous selama provider response contract tetap dipenuhi.
11. THE AI_System SHALL menghindari provider-specific branching di core memory, RAG, dan Tool Gateway.
12. THE AI_System SHALL mendukung penambahan future channel melalui adapter interface.
13. THE AI_System SHALL TIDAK memberi channel adapter hak mutation langsung ke cart/order/payment.
14. THE AI_System SHALL mencatat request/event correlation ID.
15. WHEN channel disconnected atau disabled, THE AI_System SHALL tidak menjalankan AI reply dan SHALL mencatat safe failure state.

---

## AIA-R2: Stable Contact and Chat Identity

**Priority:** P0

**User Story:** Sebagai customer, saya ingin percakapan saya tetap dikenali, sehingga AI tidak memperlakukan setiap pesan sebagai percakapan baru.

### Acceptance Criteria

1. THE AI_System SHALL menggunakan Contact sebagai customer profile lintas channel.
2. THE AI_System SHALL menggunakan Chat sebagai permanent conversation per channel.
3. THE Chat identity SHALL ditentukan oleh:
   ```text
   workspace_id
   + platform_id
   + external_conversation_id
   ```
4. THE AI_System SHALL menemukan chat existing sebelum membuat chat baru.
5. THE AI_System SHALL TIDAK menggunakan external message ID sebagai conversation identity.
6. THE AI_System SHALL mendukung contact identity mapping untuk Telegram dan WhatsApp.
7. THE AI_System SHALL TIDAK merge dua contact otomatis hanya berdasarkan nama.
8. Verified phone match MAY digunakan untuk cross-channel linking sesuai policy.
9. Manual contact merge SHALL membutuhkan authorized admin action.
10. Cross-channel profile SHALL dapat berbagi durable preferences.
11. Telegram dan WhatsApp chat history SHALL tetap terpisah.
12. THE AI_System SHALL memastikan seluruh identity query memiliki `workspace_id`.
13. THE AI_System SHALL mencegah cross-workspace contact linking.
14. THE AI_System SHALL mencatat identity merge atau correction pada audit trail.
15. IF identity resolution tidak pasti, THE AI_System SHALL membuat separate contact atau meminta human review.

---

## AIA-R3: Message Persistence and Idempotency

**Priority:** P0

**User Story:** Sebagai platform, saya ingin duplicate provider event tidak memicu duplicate AI response atau action.

### Acceptance Criteria

1. THE AI_System SHALL menyimpan setiap inbound dan outbound message.
2. THE AI_System SHALL menerapkan unique constraint atau equivalent idempotency pada:
   ```text
   workspace_id
   + platform_id
   + external_message_id
   ```
3. Duplicate inbound message SHALL tidak membuat message kedua.
4. Duplicate inbound message SHALL tidak memulai AI run kedua.
5. Duplicate inbound message SHALL tidak mengulang tool mutation.
6. Duplicate inbound message SHALL tidak mengirim duplicate response.
7. THE AI_System SHALL menyimpan outbound delivery state.
8. THE AI_System SHALL menyimpan role:
   - `user`
   - `assistant`
   - `human_agent`
   - `tool`
   - safe system event.
9. THE AI_System SHALL menjaga chronological ordering.
10. THE Context_Builder SHALL membaca message dalam urutan ascending.
11. THE AI_System SHALL TIDAK memasukkan current customer message dua kali ke model context.
12. THE AI_System SHALL memiliki automated test untuk duplicate current message.
13. THE AI_System SHALL menghindari provider echo dianggap sebagai customer inbound baru.
14. THE AI_System SHALL mendukung retry outbound dengan dedupe key.
15. THE AI_System SHALL menyimpan safe failure state ketika send gagal.
16. THE AI_System SHALL TIDAK menyimpan binary media besar sebagai message text.
17. THE AI_System SHALL menyimpan hanya safe media reference/metadata.
18. Message persistence failure SHALL menghentikan customer-facing success response.
19. THE AI_System SHALL menghubungkan AI run ke inbound message dan assistant message.
20. THE AI_System SHALL menyediakan correlation antara message, AI run, dan tool calls.

---

## AIA-R4: Conversation Sessions

**Priority:** P0

**User Story:** Sebagai platform, saya ingin permanent chat memiliki bounded AI sessions, sehingga konteks dapat direset tanpa kehilangan riwayat CRM.

### Acceptance Criteria

1. THE AI_System SHALL menyediakan Conversation_Session.
2. THE Conversation_Session SHALL memiliki minimum:
   - `id`
   - `workspace_id`
   - `chat_id`
   - `agent_id`
   - `status`
   - `started_at`
   - `last_customer_message_at`
   - `last_assistant_message_at`
   - `closed_at`
   - `close_reason`.
3. THE AI_System SHALL menggunakan active session selama inactivity belum melewati threshold.
4. Default session inactivity threshold SHALL 24 jam.
5. Threshold SHALL configurable per workspace atau agent.
6. New session SHALL tidak membuat chat baru.
7. Session status SHALL mendukung:
   - `active`
   - `closed_idle`
   - `closed_handoff`
   - `closed_manual`.
8. Human takeover MAY menutup atau menandai session sesuai policy.
9. Session close SHALL dapat memicu final rolling summary.
10. THE AI_System SHALL mencatat agent version pada session atau AI run.
11. THE AI_System SHALL mencegah lebih dari satu active session yang tidak valid untuk chat yang sama.
12. Session lookup SHALL selalu workspace-scoped.
13. Session reset SHALL tidak menghapus durable customer memory.
14. Session reset SHALL tidak mengubah cart/order/payment state.
15. Session state SHALL dapat digunakan oleh greeting policy.
16. THE AI_System SHALL mendukung manual session close untuk debugging/admin yang berwenang.

---

## AIA-R5: Greeting and Context Continuity

**Priority:** P0

**User Story:** Sebagai customer, saya ingin AI melanjutkan percakapan secara alami tanpa memperkenalkan diri setiap kali.

### Acceptance Criteria

1. THE AI_System SHALL menghitung:
   - `is_first_assistant_message_in_chat`
   - `is_first_assistant_message_in_session`
   - previous assistant message count.
2. Full introduction SHALL hanya diizinkan pada assistant response pertama dalam chat baru.
3. Existing active session SHALL melarang full introduction berulang.
4. New session after long inactivity MAY menggunakan short welcome-back.
5. New session SHALL tidak otomatis mengulang full agent identity.
6. Greeting rule SHALL ditegakkan oleh backend context flag.
7. Greeting rule SHALL juga tercantum pada prompt policy.
8. THE AI_System SHALL tidak bergantung hanya pada model instruction untuk greeting behavior.
9. THE AI_System SHALL memiliki regression test:
   - first message introduces appropriately;
   - second message does not reintroduce;
   - third message continues context;
   - new session uses configured welcome-back.
10. THE AI_System SHALL mempertahankan customer name hanya jika berasal dari verified profile atau active memory.
11. THE AI_System SHALL tidak mengarang nama customer.
12. THE AI_System SHALL menghindari greeting panjang pada setiap transactional notification.
13. THE AI_System SHALL menyimpan greeting policy sebagai configurable agent behavior dalam batas platform policy.
14. Agent-specific persona MAY mengubah wording, tetapi tidak mengubah continuity rule.
15. THE AI_System SHALL mencatat failed continuity evaluation pada quality metrics.

---

## AIA-R6: Recent Conversation Memory

**Priority:** P0

**User Story:** Sebagai customer, saya ingin AI memahami beberapa pesan terakhir agar tidak meminta informasi yang sudah saya berikan.

### Acceptance Criteria

1. THE AI_System SHALL memuat recent messages dari persistent storage.
2. Default recent message limit SHALL 20–30 eligible messages.
3. Limit SHALL configurable.
4. Recent messages SHALL diurutkan chronological ascending.
5. Recent context SHALL mencakup customer dan assistant messages.
6. Relevant human agent messages MAY disertakan.
7. Safe tool summaries MAY disertakan.
8. Raw provider webhook SHALL tidak disertakan.
9. Secret, token, dan internal stack trace SHALL tidak disertakan.
10. THE AI_System SHALL memperhitungkan token budget.
11. THE AI_System SHALL memprioritaskan current session messages.
12. Relevant previous-session summary SHALL digunakan ketika recent context tidak cukup.
13. THE AI_System SHALL tidak menggunakan process memory sebagai satu-satunya recent memory.
14. Context load failure SHALL menghasilkan safe degraded behavior atau handoff.
15. THE AI_System SHALL menghindari duplicate message insertion.
16. THE AI_System SHALL mendukung message-type filtering.
17. THE AI_System SHALL menyimpan count pesan yang dimuat dalam trace.
18. THE AI_System SHALL menyediakan metrics untuk empty-history anomaly.
19. THE AI_System SHALL mendeteksi kasus chat ID berubah pada customer yang sama.
20. THE AI_System SHALL memiliki integration test continuity minimal tiga turn.

---

## AIA-R7: Rolling Conversation Summary

**Priority:** P0

**User Story:** Sebagai platform, saya ingin percakapan panjang diringkas secara terstruktur agar biaya context tetap terkendali.

### Acceptance Criteria

1. THE AI_System SHALL menyediakan Rolling_Summary per chat/session.
2. Summary SHALL dapat dibuat ketika:
   - jumlah pesan baru mencapai threshold;
   - context token threshold tercapai;
   - session ditutup;
   - human takeover dimulai.
3. Default summary threshold SHOULD 12 pesan baru.
4. Summary SHALL menggunakan structured schema.
5. Summary SHALL mencakup:
   - customer goal
   - confirmed facts
   - pending questions
   - selected outlet reference
   - cart intent summary
   - support issue
   - commitments made
   - do-not-repeat notes
   - last conversation state.
6. Summary SHALL tidak mengklaim harga, stock, order, atau payment tanpa backend evidence.
7. Summary SHALL mencatat covered message range.
8. Summary SHALL mencatat model/provider/prompt version.
9. Summary SHALL workspace-scoped.
10. Summary SHALL memiliki expiry/retention.
11. Summary generation SHALL idempotent untuk message range yang sama.
12. Duplicate worker execution SHALL tidak membuat conflicting active summary.
13. Summary failure SHALL tidak menghapus previous valid summary.
14. Summary content SHALL divalidasi sebelum disimpan.
15. THE AI_System SHALL menghindari PII yang tidak diperlukan.
16. THE AI_System SHALL memungkinkan human takeover summary dibuat untuk agent.
17. THE AI_System SHALL memiliki test bahwa summary tidak menggantikan authoritative commerce state.
18. THE AI_System SHALL memasukkan only latest valid summary ke context.
19. Superseded summary SHALL tidak dipakai sebagai active context.
20. THE AI_System SHALL menyediakan admin-safe summary preview.

---

## AIA-R8: Durable Customer Memory

**Priority:** P0

**User Story:** Sebagai customer, saya ingin AI mengingat preferensi yang berguna tanpa menyimpan data yang tidak perlu.

### Acceptance Criteria

1. THE AI_System SHALL menyediakan durable customer memory.
2. Memory SHALL disimpan di Supabase/PostgreSQL.
3. Memory SHALL memiliki minimum:
   - `id`
   - `workspace_id`
   - `contact_id`
   - `memory_key`
   - `memory_value`
   - `category`
   - `source_type`
   - `source_reference_id`
   - `confidence`
   - `status`
   - validity fields
   - timestamps.
4. Allowed categories SHALL mencakup:
   - identity
   - language
   - outlet preference
   - product preference
   - communication preference
   - customer tag.
5. Address SHALL tidak disimpan sebagai durable memory pada MVP.
6. Password, OTP, token, payment credential, dan secret SHALL tidak disimpan.
7. Model MAY mengusulkan memory candidate.
8. Model SHALL tidak langsung menulis arbitrary memory.
9. Memory candidate SHALL melewati schema validation.
10. Memory candidate SHALL melewati policy evaluation.
11. Explicit customer statement MAY disimpan sesuai policy.
12. Ambiguous preference SHOULD membutuhkan confirmation.
13. Memory SHALL mencatat source.
14. Memory SHALL mencatat confidence.
15. Memory SHALL mendukung status:
   - candidate
   - confirmed
   - active
   - superseded
   - expired
   - deleted.
16. Conflicting memory SHALL diselesaikan melalui policy atau customer confirmation.
17. Low-confidence memory SHALL tidak dianggap fact.
18. Memory SHALL workspace/contact-scoped.
19. Cross-channel linked contact MAY menggunakan memory yang sama.
20. THE AI_System SHALL tidak memunculkan old memory secara tidak relevan.
21. THE AI_System SHALL menyediakan memory relevance filtering.
22. THE AI_System SHALL memiliki maximum memories injected per turn.
23. THE AI_System SHALL menyimpan memory version/change history atau audit.
24. THE AI_System SHALL memungkinkan admin melihat memory source.
25. Durable memory SHALL tidak menjadi substitute untuk order/payment history.

---

## AIA-R9: Memory Privacy, Correction, and Forgetting

**Priority:** P0

**User Story:** Sebagai customer, saya ingin dapat mengetahui dan menghapus informasi yang diingat AI.

### Acceptance Criteria

1. THE AI_System SHALL menyediakan operation:
   - list memories
   - correct memory
   - forget memory
   - clear preference category.
2. Customer-initiated forget SHALL diverifikasi terhadap contact/chat context.
3. Admin memory operation SHALL membutuhkan authorization.
4. Successfully forgotten memory SHALL langsung dikeluarkan dari future context.
5. Deleted memory SHALL ditandai deleted atau dihapus sesuai retention/privacy policy.
6. Forget action SHALL dicatat pada audit.
7. THE AI_System SHALL memberikan customer-safe confirmation.
8. THE AI_System SHALL tidak meminta customer mengulang secret untuk memory deletion.
9. Corrected memory SHALL supersede old value.
10. Superseded memory SHALL tidak digunakan sebagai active context.
11. THE AI_System SHALL mencegah memory dari workspace lain terlihat.
12. THE AI_System SHALL mendukung request “jangan ingat ini”.
13. THE AI_System SHALL tidak menyimpan address walaupun customer menyebutkannya dalam percakapan.
14. Raw message retention MAY tetap mengikuti message policy meskipun memory dihapus, tetapi durable memory SHALL segera berhenti digunakan.
15. Privacy behavior SHALL didokumentasikan.
16. THE AI_System SHALL memiliki test bahwa forgotten memory tidak muncul pada next turn.
17. THE AI_System SHALL memiliki test correction replaces active value.
18. THE AI_System SHALL redact sensitive memory values dari normal logs.
19. THE AI_System SHALL memberikan human escalation jika deletion request tidak dapat diselesaikan.
20. THE AI_System SHALL mendukung future configurable privacy policy per workspace tanpa melemahkan platform minimum.

---

## AIA-R10: AI Context Builder and Token Budget

**Priority:** P0

**User Story:** Sebagai platform, saya ingin context disusun secara konsisten agar model menerima informasi yang benar dan cukup.

### Acceptance Criteria

1. THE Context_Builder SHALL menyusun context dalam urutan:
   ```text
   immutable platform policy
   → workspace policy
   → agent instruction
   → session/greeting flags
   → customer profile
   → confirmed memory
   → rolling summary
   → recent messages
   → RAG context
   → structured commerce state
   → tool definitions
   → current message
   ```
2. Platform policy SHALL tidak dapat diubah workspace prompt.
3. Agent instruction SHALL tidak dapat menghapus platform safety.
4. Context Builder SHALL menggunakan configurable token budget.
5. Context Builder SHALL menyisakan output token reserve.
6. Context Builder SHALL memprioritaskan:
   - safety rules
   - current message
   - human takeover state
   - current commerce state
   - recent relevant messages.
7. Context Builder MAY mengurangi:
   - old recent messages
   - low-score RAG chunks
   - low-confidence memories
   - verbose tool output.
8. Context Builder SHALL tidak menghapus payment authority rule.
9. Context Builder SHALL tidak menghapus workspace scope.
10. Context Builder SHALL tidak menghapus explicit confirmation state.
11. Context Builder SHALL mencatat source counts pada trace.
12. Context Builder SHALL tidak mengirim full unrelated customer history.
13. Context Builder SHALL menerapkan PII minimization.
14. Context Builder SHALL menghindari duplicate current message.
15. Context Builder SHALL mendukung context preview untuk authorized debugging.
16. Debug preview SHALL redacted.
17. Context Builder SHALL mencatat truncation reason.
18. Context Builder SHALL bekerja tanpa LangChain.
19. Context Builder SHALL mendukung provider-specific formatting melalui adapter.
20. Context Builder SHALL memiliki deterministic tests.

---

## AIA-R11: Knowledge Source Management

**Priority:** P0

**User Story:** Sebagai admin, saya ingin mengelola knowledge yang digunakan agent agar jawaban AI dapat dikendalikan.

### Acceptance Criteria

1. THE AI_System SHALL menyediakan Knowledge_Source.
2. Knowledge source SHALL dapat berasal dari:
   - FAQ
   - SOP
   - product description
   - promotion rule
   - refund policy
   - payment instruction
   - complaint procedure
   - opening hours
   - brand tone
   - uploaded file
   - structured knowledge record.
3. Knowledge source SHALL memiliki workspace ownership.
4. Knowledge source MAY memiliki outlet scope.
5. Knowledge source MAY memiliki agent scope.
6. Knowledge source MAY memiliki channel scope.
7. Knowledge source SHALL memiliki lifecycle:
   - draft
   - processing
   - ready_for_review
   - published
   - rejected
   - archived
   - failed.
8. AI MAY membuat draft suggestion.
9. AI SHALL tidak publish knowledge.
10. Publish SHALL membutuhkan authorized human role.
11. Knowledge SHALL mendukung versioning.
12. Published version SHALL immutable atau versioned.
13. Knowledge SHALL mendukung validity period.
14. Expired knowledge SHALL tidak diretrieve.
15. Archived knowledge SHALL tidak diretrieve.
16. Knowledge SHALL memiliki visibility policy.
17. Knowledge SHALL mendukung safe source deletion/archive.
18. Knowledge source SHALL mencatat creator/publisher.
19. Knowledge source SHALL mencatat content hash.
20. Duplicate content MAY dideteksi melalui hash.
21. Knowledge settings SHALL dapat dihubungkan ke agent.
22. Agent SHALL hanya mengakses source yang diizinkan.
23. Outlet-scoped source SHALL tidak digunakan tanpa matching outlet context.
24. Knowledge operation SHALL audit sensitive changes.
25. Knowledge list SHALL mendukung filter dan search.

---

## AIA-R12: Knowledge Ingestion and Chunking

**Priority:** P0

**User Story:** Sebagai admin, saya ingin uploaded knowledge diproses menjadi chunks yang dapat dicari dengan aman.

### Acceptance Criteria

1. THE AI_System SHALL menyediakan ingestion pipeline.
2. Pipeline SHALL:
   - load source
   - extract normalized text
   - preserve structure
   - chunk
   - embed
   - store metadata/vector
   - mark review status.
3. Ingestion SHALL berjalan melalui worker boundary.
4. Ingestion SHALL memiliki idempotency key.
5. Duplicate ingestion SHALL tidak membuat duplicate active chunks.
6. Chunk SHALL menyimpan:
   - source ID
   - source version
   - chunk index
   - section heading
   - content
   - token count
   - workspace ID
   - optional outlet ID
   - optional agent ID
   - content hash
   - embedding model.
7. Recommended chunk size SHALL 300–700 tokens.
8. Recommended overlap SHALL 50–100 tokens.
9. Chunker SHALL preserve heading context.
10. Chunker SHOULD preserve list/table boundaries.
11. Failed extraction SHALL menghasilkan failed status.
12. Partial ingestion SHALL tidak dipublish sebagai complete.
13. Re-ingestion SHALL version chunks.
14. Old published version SHALL tetap tersedia sampai new version approved.
15. Embedding provider SHALL configurable.
16. Embedding failure SHALL retry according to policy.
17. Ingestion log SHALL tidak menyimpan file secret.
18. Unsupported file SHALL menghasilkan safe error.
19. File size/type limits SHALL diterapkan oleh storage/domain contract.
20. Ingestion SHALL mencatat parser/chunker version.
21. Ingestion SHALL dapat dibatalkan sebelum publish.
22. Ingestion SHALL memiliki observable progress.
23. Ingestion result SHALL dapat dipreview.
24. THE AI_System SHALL mendukung cleanup superseded chunks.
25. Cleanup SHALL tidak menghapus version yang masih referenced secara tidak aman.

---

## AIA-R13: RAG Retrieval and Isolation

**Priority:** P0

**User Story:** Sebagai customer, saya ingin AI menjawab berdasarkan knowledge yang relevan tanpa mengambil data bisnis lain.

### Acceptance Criteria

1. THE AI_System SHALL menggunakan Supabase pgvector sebagai default vector store.
2. THE AI_System SHOULD menggunakan hybrid retrieval:
   - vector similarity
   - PostgreSQL full-text search.
3. Retrieval SHALL selalu filter `workspace_id`.
4. Retrieval SHALL filter published status.
5. Retrieval SHALL filter agent permission.
6. Retrieval SHALL filter outlet scope ketika knowledge outlet-specific.
7. Retrieval SHALL filter validity window.
8. Retrieval SHALL filter visibility.
9. Cross-workspace chunk SHALL tidak pernah direturn.
10. Cross-outlet restricted chunk SHALL tidak direturn.
11. Retrieval SHALL menggunakan relevance threshold.
12. Low-score chunk SHALL tidak masuk context.
13. Retrieval MAY menggunakan reranker.
14. Retrieval SHALL membatasi jumlah chunks.
15. Retrieval SHALL menyimpan source metadata untuk trace.
16. Customer response tidak wajib menampilkan citation teknis.
17. Admin trace SHALL dapat melihat title, section, version, score, dan chunk ID.
18. Jika tidak ada source relevan, AI SHALL tidak mengarang.
19. Jika source conflict, AI SHALL memilih latest valid authoritative version atau escalate.
20. Retrieval query MAY melalui query rewrite.
21. Query rewrite SHALL tidak menghapus workspace/outlet scope.
22. Tool result SHALL tidak dimasukkan sebagai knowledge source tanpa normalization.
23. Retrieval SHALL memiliki timeout.
24. Retrieval failure SHALL menghasilkan safe fallback.
25. RAG SHALL dapat dinonaktifkan per agent.
26. Agent tanpa knowledge permission SHALL tidak menerima chunks.
27. THE AI_System SHALL memiliki security test cross-workspace retrieval.
28. THE AI_System SHALL memiliki test expired knowledge excluded.
29. THE AI_System SHALL memiliki test agent-scoped knowledge.
30. THE AI_System SHALL mencatat `rag_no_result_count`.

---

## AIA-R14: Live Commerce Data Authority

**Priority:** P0

**User Story:** Sebagai customer, saya ingin harga, stok, order, dan payment yang dijelaskan AI selalu berasal dari backend terbaru.

### Acceptance Criteria

1. THE AI_System SHALL menggunakan tools untuk live commerce data.
2. RAG SHALL tidak menjadi source of truth untuk:
   - price
   - stock
   - availability
   - active promotion
   - outlet status
   - cart
   - order
   - payment.
3. AI SHALL tidak menjawab current price dari memory atau stale chat.
4. AI SHALL tidak menjawab availability tanpa tool/backend evidence.
5. AI SHALL tidak menyatakan payment paid tanpa backend `paid`.
6. AI SHALL tidak menyatakan order ready tanpa backend state.
7. Tool result SHALL mencantumkan freshness atau server timestamp bila relevan.
8. AI MAY menggunakan RAG untuk product description.
9. AI SHALL membedakan descriptive knowledge dan transactional state.
10. When tool unavailable, AI SHALL tidak mengarang live data.
11. AI SHALL menawarkan retry atau human handoff.
12. Context Builder SHALL memasukkan structured commerce state.
13. Structured commerce state SHALL berasal dari server service.
14. AI SHALL tidak menulis structured commerce state langsung.
15. AI SHALL tidak menyimpan commerce state sebagai durable preference.
16. Cached live data SHALL memiliki TTL dan invalidation policy.
17. Cache loss SHALL tidak mengubah correctness.
18. THE AI_System SHALL memiliki evaluation scenario stale price.
19. THE AI_System SHALL memiliki evaluation scenario sold-out product.
20. THE AI_System SHALL mencatat tool source pada trace.

---

## AIA-R15: AI Agent Configuration and Versioning

**Priority:** P0

**User Story:** Sebagai owner, saya ingin membuat beberapa AI Agent dengan persona dan kemampuan berbeda.

### Acceptance Criteria

1. THE AI_System SHALL menyediakan Agent entity/config.
2. Agent SHALL memiliki minimum:
   - `id`
   - `workspace_id`
   - `name`
   - `display_name`
   - `description`
   - `status`
   - provider/model config
   - system instruction
   - tone config
   - language config
   - knowledge config
   - memory policy
   - tool policy
   - routing config
   - follow-up policy
   - limits
   - version metadata.
3. Agent name SHALL configurable per agent.
4. Agent SHALL menggunakan Bahasa Indonesia pada MVP.
5. Agent tone SHALL mengikuti platform minimum.
6. Agent custom instruction SHALL tidak dapat menghapus safety rules.
7. Agent custom instruction SHALL tidak dapat menambah unauthorized tool.
8. Agent SHALL memiliki draft/published/archived lifecycle.
9. Published version SHALL immutable.
10. Update published agent SHALL membuat version baru.
11. AI run SHALL mencatat exact agent version.
12. Agent SHALL dapat di-test sebelum publish.
13. Agent publish SHALL membutuhkan permission.
14. Agent rollback SHALL didukung.
15. Agent delete SHALL prefer archive jika sudah digunakan.
16. Agent SHALL dapat memiliki knowledge scope.
17. Agent SHALL dapat memiliki tool allowlist.
18. Agent SHALL dapat memiliki model assignment.
19. Agent SHALL dapat memiliki fallback policy.
20. Agent SHALL dapat memiliki max tokens/tool calls/iterations/timeout.
21. Agent SHALL dapat memiliki greeting behavior dalam batas platform policy.
22. Agent SHALL dapat memiliki proactive follow-up policy.
23. Sensitive provider credentials SHALL tidak disimpan plaintext di agent config.
24. Agent config changes SHALL diaudit.
25. Agent preview SHALL tidak menggunakan production side-effect tools tanpa safe mode.
26. Agent test mode SHALL menggunakan mocked/read-only tools by default.
27. Agent status inactive SHALL tidak dipilih oleh router.
28. Workspace isolation SHALL berlaku pada seluruh agent APIs.
29. Agent config SHALL mendukung future specialist role.
30. Agent export/import MAY disediakan tanpa secret.

---

## AIA-R16: Agent Assignment and Routing

**Priority:** P0

**User Story:** Sebagai owner, saya ingin chat diarahkan ke agent yang tepat berdasarkan konfigurasi.

### Acceptance Criteria

1. THE AI_System SHALL memiliki Agent_Router.
2. Agent resolution priority SHALL:
   ```text
   explicit chat assignment
   → outlet/channel routing
   → platform default
   → workspace default
   ```
3. Router SHALL tidak memilih archived/inactive agent.
4. Router SHALL memastikan agent milik workspace yang sama.
5. Router SHALL memastikan agent diizinkan untuk platform tersebut.
6. Router SHALL memastikan agent tool policy compatible dengan task.
7. Router SHALL dapat menggunakan deterministic rules.
8. Semantic classification MAY digunakan ketika rules tidak cukup.
9. Low-confidence routing SHALL fallback ke workspace default agent.
10. Router SHALL tidak melakukan domain mutation.
11. Router SHALL tidak mengubah chat assignment tanpa policy.
12. Agent assignment change SHALL audit.
13. Agent assignment SHALL dapat dilakukan admin.
14. Router SHALL dapat melihat human takeover state.
15. Human takeover SHALL menghentikan customer-facing agent execution.
16. Router SHALL mencatat selected agent dan reason pada AI run.
17. Router SHALL memiliki timeout.
18. Router failure SHALL fallback safely.
19. Router SHALL mendukung future specialist routing.
20. Router SHALL tidak mengirim seluruh customer data ke classifier jika tidak diperlukan.
21. Router SHALL memiliki test assignment priority.
22. Router SHALL memiliki test cross-workspace denial.
23. Router SHALL memiliki test inactive agent exclusion.
24. Router SHALL mendukung one-agent MVP tanpa unnecessary complexity.
25. Router SHALL tidak memerlukan LangGraph untuk basic routing.

---

## AIA-R17: Model Provider Adapter and Model Router

**Priority:** P0

**User Story:** Sebagai platform, saya ingin menggunakan local model saat ini tetapi tetap dapat menambah provider lain.

### Acceptance Criteria

1. THE AI_System SHALL menyediakan provider adapter interface.
2. Provider adapter SHALL mendukung:
   - chat
   - structured output
   - optional embeddings
   - health.
3. Primary provider SHALL dapat menggunakan local OpenAI-compatible endpoint.
4. Provider base URL SHALL configurable.
5. Model names SHALL configurable.
6. Credentials SHALL backend-only.
7. Model Router SHALL dapat memilih model untuk:
   - chat
   - classification
   - summary
   - memory extraction
   - embedding
   - complex planning.
8. Seluruh roles MAY menggunakan model yang sama pada MVP.
9. Fallback provider SHALL optional.
10. Fallback SHALL hanya digunakan jika workspace policy mengizinkan.
11. Sensitive data SHALL tidak dikirim ke external fallback tanpa policy.
12. Model Router SHALL mencatat provider/model pada AI run.
13. Model Router SHALL mencatat fallback usage.
14. Model Router SHALL memiliki timeout.
15. Provider failures SHALL diklasifikasikan retriable/permanent.
16. Circuit breaker SHALL didukung.
17. Circuit breaker states SHOULD:
   - healthy
   - degraded
   - open
   - half_open.
18. Model Router SHALL tidak mengulang mutation tool saat retry model.
19. Structured output SHALL divalidasi.
20. Malformed output SHALL dapat diretry secara terbatas.
21. Model Router SHALL tidak memasukkan secrets dalam request.
22. Model Router SHALL mendukung mocked provider untuk test.
23. Health endpoint SHALL tidak mengekspos credential.
24. Provider adapter SHALL memetakan error ke internal code.
25. Local provider unavailable SHALL menghasilkan safe handoff/degraded response.

---

## AIA-R18: AI Orchestrator and Structured Output

**Priority:** P0

**User Story:** Sebagai platform, saya ingin satu orchestrator yang mengontrol AI turn secara aman dan dapat diuji.

### Acceptance Criteria

1. THE AI_System SHALL menyediakan AI_Orchestrator.
2. Orchestrator SHALL:
   - select agent
   - build context
   - invoke retrieval
   - call model
   - validate structured output
   - execute tool loop
   - produce final response
   - persist trace.
3. Orchestrator SHALL tidak menjalankan domain query langsung jika Tool Gateway/service contract tersedia.
4. Orchestrator SHALL tidak mengubah payment state.
5. Orchestrator SHALL tidak mengubah permission.
6. Orchestrator SHALL menggunakan bounded loop.
7. Default max tool calls SHALL 8.
8. Default max iterations SHALL 10.
9. Default turn timeout SHOULD 15 detik.
10. Limits SHALL configurable per agent.
11. Model output SHALL menggunakan structured schema.
12. Structured output SHALL mendukung:
   - message
   - tool_call
   - handoff
   - no_reply.
13. Tool call SHALL memiliki validated arguments.
14. Orchestrator SHALL mencegah repeated identical mutation tool.
15. Orchestrator SHALL menyimpan partial failure trace.
16. Orchestrator SHALL menghentikan loop saat human takeover berubah aktif.
17. Orchestrator SHALL re-check critical state sebelum mutation.
18. Orchestrator SHALL tidak mengirim customer success sebelum domain commit.
19. Orchestrator SHALL persist assistant message before/with send policy.
20. Orchestrator SHALL handle channel send failure.
21. Orchestrator SHALL support safe retry for model-only failure.
22. Orchestrator SHALL not retry non-idempotent tool blindly.
23. Orchestrator SHALL record final reason code.
24. Orchestrator SHALL stop and handoff when loop limit reached.
25. Orchestrator SHALL expose redacted debug trace.
26. Orchestrator SHALL work without LangChain.
27. Orchestrator SHALL have deterministic unit tests.
28. Orchestrator SHALL not auto-select next customer task beyond current turn.
29. Orchestrator SHALL maintain one active run lock per chat when needed.
30. Parallel customer messages SHALL be serialized or handled with conflict policy.

---

## AIA-R19: Tool Registry and Tool Gateway

**Priority:** P0

**User Story:** Sebagai platform, saya ingin seluruh AI action melewati satu security boundary.

### Acceptance Criteria

1. THE AI_System SHALL menyediakan Tool_Registry.
2. THE AI_System SHALL menyediakan Tool_Gateway.
3. Tool definition SHALL memiliki:
   - name
   - description
   - input schema
   - required permission
   - confirmation policy
   - mutation flag
   - idempotency behavior
   - timeout
   - result redaction.
4. Tool Gateway SHALL reject unknown tool.
5. Tool Gateway SHALL validate JSON schema.
6. Tool Gateway SHALL enforce agent allowlist.
7. Tool Gateway SHALL derive workspace context server-side.
8. Tool Gateway SHALL validate contact/chat context.
9. Tool Gateway SHALL validate outlet context when required.
10. Tool Gateway SHALL validate customer confirmation when required.
11. Tool Gateway SHALL call backend domain service.
12. Tool Gateway SHALL not call database from model-generated code.
13. Tool Gateway SHALL normalize result.
14. Tool Gateway SHALL redact sensitive result.
15. Tool Gateway SHALL assign idempotency key for mutation.
16. Tool Gateway SHALL record tool call trace.
17. Tool Gateway SHALL record latency/result code.
18. Tool Gateway SHALL enforce timeout.
19. Tool Gateway SHALL distinguish retriable and permanent errors.
20. Tool Gateway SHALL not expose stack trace to model/customer.
21. Tool Gateway SHALL support read-only test mode.
22. Tool Gateway SHALL support future specialist agents.
23. Tool Gateway SHALL not trust workspace/outlet IDs from model.
24. Tool Gateway SHALL re-fetch authoritative state before critical mutation.
25. Tool Gateway SHALL prevent cross-workspace resource access.
26. Tool Gateway SHALL prevent cross-outlet access.
27. Tool Gateway SHALL reject tool when human takeover policy blocks AI mutation.
28. Tool Gateway SHALL provide safe tool error codes.
29. Tool Gateway SHALL have authorization tests.
30. Tool Gateway SHALL have idempotency tests.

---

## AIA-R20: Confirmation and Mutation Policy

**Priority:** P0

**User Story:** Sebagai customer, saya ingin AI meminta confirmation sebelum tindakan penting.

### Acceptance Criteria

1. THE AI_System SHALL mendefinisikan confirmation policy per tool.
2. Search/read tools SHALL tidak membutuhkan confirmation.
3. Outlet selection SHALL membutuhkan customer confirmation.
4. Add item dari explicit customer request MAY langsung dijalankan.
5. Ambiguous quantity/update SHALL meminta clarification.
6. Remove item ambiguous SHALL meminta confirmation.
7. Clear cart SHALL membutuhkan confirmation.
8. Switch outlet dengan non-empty cart SHALL membutuhkan explicit confirmation.
9. Create order SHALL membutuhkan final explicit confirmation.
10. Create payment link MAY dilakukan setelah order confirmed.
11. Resend payment link SHALL membutuhkan explicit request atau safe retry policy.
12. Cancel unpaid order SHALL membutuhkan explicit confirmation.
13. Complaint ticket SHALL mengkonfirmasi captured summary.
14. Handoff SHALL segera dilakukan ketika customer meminta manusia.
15. Save durable preference SHALL berdasarkan explicit statement/confirmation.
16. Forget memory SHALL berdasarkan explicit request.
17. Mark paid SHALL tidak pernah tersedia.
18. Confirmation state SHALL dicatat.
19. Confirmation SHALL memiliki expiry.
20. Confirmation SHALL terikat ke action snapshot.
21. Changed cart after confirmation SHALL membatalkan previous order confirmation.
22. AI SHALL menampilkan summary yang jelas sebelum confirmation.
23. Confirmation text SHALL tidak menyesatkan.
24. THE AI_System SHALL memiliki test ambiguous confirmation.
25. THE AI_System SHALL memiliki test stale confirmation.
26. Confirmation MAY menggunakan button atau natural language.
27. Backend SHALL validate confirmation independent dari model claim.
28. AI SHALL tidak mengasumsikan silence sebagai confirmation.
29. AI SHALL tidak menganggap “oke” valid jika context ambiguity tinggi.
30. Confirmation failure SHALL menghasilkan safe re-prompt.

---

## AIA-R21: Commerce Conversation Guardrails

**Priority:** P0

**User Story:** Sebagai customer, saya ingin AI membantu order tanpa melewati aturan commerce.

### Acceptance Criteria

1. AI SHALL meminta outlet ketika order intent dimulai dan outlet belum confirmed.
2. AI MAY suggest last outlet.
3. AI SHALL tidak menganggap suggestion sebagai selected outlet.
4. AI SHALL menggunakan product tools untuk live catalog.
5. AI SHALL tidak menawarkan unavailable product.
6. AI SHALL menjaga one active cart policy.
7. AI SHALL tidak mencampur item outlet berbeda.
8. AI SHALL meminta confirmation sebelum switch outlet dengan cart.
9. AI SHALL menampilkan server-calculated cart summary.
10. AI SHALL meminta explicit final order confirmation.
11. AI SHALL tidak membuat order dari RAG response.
12. AI SHALL tidak menentukan price.
13. AI SHALL tidak menentukan stock.
14. AI SHALL tidak meminta delivery address pada pickup MVP.
15. AI SHALL tidak menawarkan delivery jika feature disabled.
16. AI SHALL tidak menawarkan COD.
17. AI SHALL tidak menawarkan manual transfer.
18. AI SHALL membuat payment link setelah order creation success.
19. AI SHALL membaca order status melalui tool.
20. AI SHALL membaca payment status melalui tool.
21. AI SHALL tidak menjanjikan pickup ready tanpa backend state.
22. AI SHALL tidak membuat duplicate order pada retry.
23. AI SHALL menggunakan idempotency-aware tools.
24. AI SHALL menjelaskan product/price change secara customer-friendly.
25. AI SHALL menawarkan human handoff bila commerce service unavailable berulang.
26. AI SHALL respect cart expiry.
27. AI SHALL respect checkout/order conflict.
28. AI SHALL record order confirmation evidence.
29. AI SHALL not keep stale cart state solely in memory.
30. AI commerce behavior SHALL have end-to-end evaluation tests.

---

## AIA-R22: Payment Read-Only AI Boundary

**Priority:** P0

**User Story:** Sebagai platform owner, saya ingin AI tidak pernah memiliki kewenangan mengubah payment menjadi paid.

### Acceptance Criteria

1. AI tool registry SHALL tidak memiliki:
   - mark_payment_paid
   - set_payment_status
   - force_payment_paid.
2. AI MAY memiliki:
   - create_payment_link
   - resend_payment_link
   - get_payment_status.
3. Create payment link SHALL hanya setelah valid order.
4. Payment amount SHALL berasal dari backend.
5. AI SHALL tidak menerima client-provided amount sebagai authority.
6. AI SHALL tidak menyatakan paid berdasarkan:
   - screenshot
   - customer claim
   - redirect URL
   - chat message
   - model inference.
7. AI SHALL menyatakan paid hanya setelah backend tool mengembalikan paid.
8. Backend paid state SHALL berasal dari verified Xendit processing atau valid reconciliation.
9. AI SHALL tidak memanggil Xendit secret API langsung.
10. Xendit calls SHALL melalui payment domain service/provider adapter.
11. AI SHALL not access Xendit secret.
12. AI SHALL tidak dapat mengubah payment provider event.
13. Duplicate payment notification SHALL dicegah backend.
14. AI SHALL tidak mengirim paid notification sebelum commit.
15. AI SHALL menjelaskan pending state dengan aman.
16. AI SHALL tidak menjanjikan payment success ketika provider unavailable.
17. Payment dispute SHALL trigger human escalation.
18. AI SHALL tidak menawarkan manual payment.
19. AI SHALL tidak melakukan refund.
20. AI SHALL memiliki evaluation scenario fake payment proof.
21. AI SHALL memiliki security test absence of mark-paid tool.
22. Tool result SHALL redact payment URL token dari logs/traces.
23. Customer-facing payment link MAY dikirim melalui channel safely.
24. Payment link resend SHALL reuse active valid link when appropriate.
25. Payment expiry SHALL dijelaskan sesuai backend state.
26. AI SHALL not downgrade paid state based on stale conversation.
27. AI SHALL not cache paid state longer than approved freshness.
28. AI SHALL record payment tool call source in trace.
29. AI response SHALL separate payment state dan fulfillment state.
30. Human agent SHALL tidak mendapatkan hidden AI mark-paid capability dari agent settings.

---

## AIA-R23: Complaint and Human Escalation

**Priority:** P0

**User Story:** Sebagai customer, saya ingin dapat meminta manusia atau membuat ticket melalui AI.

### Acceptance Criteria

1. AI SHALL mendeteksi complaint intent.
2. AI SHALL membedakan:
   - general question
   - minor issue
   - complaint ticket
   - direct human request
   - payment dispute
   - security concern.
3. Customer request for human SHALL trigger handoff immediately.
4. AI SHALL tidak memaksa ticket jika customer meminta human.
5. AI MAY membuat ticket jika customer setuju.
6. AI SHALL mengumpulkan detail minimum.
7. AI SHALL membuat structured complaint summary.
8. AI SHALL meminta customer mengkonfirmasi summary.
9. AI SHALL membuat ticket melalui backend tool.
10. AI SHALL mengembalikan ticket reference.
11. AI SHALL tidak menjanjikan refund.
12. AI SHALL tidak menjanjikan resolution time kecuali backend policy menyediakan.
13. Payment dispute SHALL handoff.
14. Security concern SHALL handoff.
15. Repeated misunderstanding SHALL offer handoff.
16. High emotional escalation SHALL offer/trigger handoff.
17. Ticket SHALL terhubung ke chat/contact.
18. Order/outlet MAY dihubungkan jika relevant.
19. AI SHALL tidak mengubah complaint status langsung kecuali tool policy mengizinkan specific safe action.
20. AI SHALL tidak melihat complaint workspace lain.
21. AI SHALL support attachment reference safely.
22. AI SHALL record escalation reason.
23. Complaint tool call SHALL be idempotent.
24. Duplicate confirmation SHALL not create duplicate ticket.
25. AI SHALL provide safe fallback if ticket service unavailable.
26. Human takeover SHALL supersede complaint AI response.
27. AI SHALL not continue autonomous complaint resolution after handoff.
28. AI MAY generate internal summary for human agent.
29. Complaint summary SHALL avoid unsupported conclusions.
30. Complaint scenarios SHALL be included in evaluation set.

---

## AIA-R24: Human Takeover and Safe Resume

**Priority:** P0

**User Story:** Sebagai human agent, saya ingin mengambil alih percakapan tanpa AI mengirim balasan bersamaan.

### Acceptance Criteria

1. THE AI_System SHALL membaca human takeover state sebelum setiap AI turn.
2. Active takeover SHALL suppress customer-facing AI response.
3. Incoming message SHALL tetap disimpan saat takeover.
4. AI MAY menghasilkan internal suggestion jika policy mengizinkan.
5. Internal suggestion SHALL tidak dikirim ke customer.
6. Admin SHALL dapat Resume AI.
7. Auto-resume MAY terjadi setelah 5 menit tanpa customer message baru.
8. Setiap customer message baru SHALL reset auto-resume timer.
9. Pinned takeover SHALL tidak auto-resume.
10. Auto-resume worker SHALL re-read latest state.
11. Auto-resume SHALL memastikan tidak ada newer customer message.
12. Auto-resume SHALL memastikan takeover tidak pinned.
13. Auto-resume SHALL menggunakan compare-and-set/transaction safety.
14. Delayed AI response SHALL dibatalkan jika takeover aktif sebelum send.
15. Tool mutation in-flight SHALL follow safe cancellation/commit policy.
16. Takeover start SHALL audit.
17. Takeover release SHALL audit.
18. Auto-resume SHALL audit.
19. Takeover conflict SHALL menghasilkan safe error.
20. Human agent identity SHALL disimpan.
21. Takeover reason MAY disimpan.
22. AI session MAY ditutup saat takeover.
23. Resume MAY membuat new AI session sesuai policy.
24. THE AI_System SHALL memiliki race-condition tests.
25. THE AI_System SHALL memiliki test delayed model response.
26. THE AI_System SHALL memiliki test pinned takeover.
27. THE AI_System SHALL memiliki test timer reset.
28. Human takeover SHALL not grant extra outlet/workspace access.
29. AI SHALL not override takeover through custom prompt.
30. Takeover state SHALL be included in context safety flags.

---

## AIA-R25: Proactive Messaging and Follow-Up

**Priority:** P1

**User Story:** Sebagai business owner, saya ingin AI mengirim follow-up yang relevan tanpa menjadi spam.

### Acceptance Criteria

1. THE AI_System MAY mendukung:
   - payment reminder
   - payment expiry notice
   - order accepted
   - preparing
   - ready for pickup
   - completed
   - feedback request
   - abandoned cart reminder
   - complaint update.
2. Transactional notification SHALL mengikuti backend event.
3. Marketing/follow-up SHALL membutuhkan workspace enablement.
4. Marketing/follow-up SHALL menghormati consent.
5. Follow-up SHALL menghormati quiet hours.
6. Follow-up SHALL memiliki frequency cap.
7. Contact SHALL dapat opt out.
8. Every scheduled message SHALL memiliki dedupe key.
9. Duplicate worker execution SHALL tidak mengirim duplicate message.
10. Follow-up SHALL terhubung ke event/reference.
11. AI SHALL tidak mengarang status untuk notification.
12. Notification SHALL dikirim setelah state commit.
13. Payment reminder SHALL tidak dikirim setelah paid.
14. Ready-for-pickup SHALL hanya dari backend order state.
15. Abandoned cart reminder SHALL tidak dikirim jika cart converted/cancelled/expired policy melarang.
16. Feedback request SHALL dikirim maksimum sesuai policy.
17. Follow-up template SHALL divalidasi.
18. Follow-up MAY menggunakan agent tone.
19. Follow-up SHALL tidak mengandung sensitive data.
20. Follow-up failure SHALL retry with capped policy.
21. Permanent failure SHALL stop retry.
22. Delivery state SHALL persisted.
23. Human takeover MAY suppress certain proactive messages.
24. Follow-up SHALL workspace-scoped.
25. Channel policy SHALL dihormati.
26. WhatsApp template requirement SHALL dipatuhi jika berlaku.
27. AI SHALL tidak memilih marketing campaign sendiri.
28. Admin SHALL dapat melihat scheduled follow-ups.
29. Admin SHALL dapat cancel pending follow-up.
30. Follow-up metrics SHALL tersedia.

---

## AIA-R26: AI Trace and Observability

**Priority:** P0

**User Story:** Sebagai developer dan admin, saya ingin memahami mengapa AI memberikan jawaban atau memanggil tool tertentu.

### Acceptance Criteria

1. THE AI_System SHALL menyimpan AI_Run.
2. AI_Run SHALL mencatat:
   - workspace
   - chat
   - session
   - contact
   - agent
   - agent version
   - provider
   - model
   - status
   - latency
   - retrieval usage
   - tool call count
   - fallback usage
   - error code
   - timestamps.
3. THE AI_System SHALL menyimpan AI_Tool_Call trace.
4. Tool trace SHALL mencatat:
   - tool name
   - redacted arguments
   - confirmation state
   - result code
   - redacted result
   - latency
   - idempotency key.
5. AI trace SHALL tidak menyimpan secrets.
6. AI trace SHALL redacted sebelum persistence.
7. AI trace access SHALL permission-controlled.
8. Outlet manager SHALL hanya melihat permitted scope.
9. Customer SHALL tidak melihat internal trace.
10. Trace SHALL menautkan inbound dan outbound message.
11. Trace SHALL menautkan retrieval sources.
12. Trace SHALL mencatat context truncation.
13. Trace SHALL mencatat router decision.
14. Trace SHALL mencatat loop limit.
15. Trace SHALL mencatat provider error.
16. Trace SHALL mencatat fallback.
17. Trace SHALL memiliki retention.
18. Trace cleanup SHALL melalui job.
19. Trace SHALL support request correlation.
20. Metrics SHALL mencakup:
   - turn count
   - latency
   - provider error
   - tool failure
   - handoff
   - RAG no result
   - memory write/forget
   - duplicate message.
21. Observability SHALL tidak mengubah customer response.
22. Trace write failure SHALL tidak mengekspos secret.
23. Critical trace failure MAY mark run degraded.
24. Production logging SHALL structured.
25. Normal logs SHALL tidak menyimpan full prompt by default.
26. Authorized debug mode MAY store redacted prompt snapshot.
27. AI_Run SHALL mencatat final response status.
28. Tool trace SHALL support audit investigation.
29. Metrics SHALL be workspace-safe.
30. Trace APIs SHALL support pagination/filtering.

---

## AIA-R27: Feedback and Evaluation

**Priority:** P1

**User Story:** Sebagai admin, saya ingin menilai kualitas agent agar dapat mengetahui agent mana yang bagus atau bermasalah.

### Acceptance Criteria

1. THE AI_System SHALL menyediakan AI_Feedback.
2. Feedback MAY berasal dari:
   - admin
   - human agent
   - customer signal
   - automated evaluator.
3. Feedback SHALL terhubung ke AI run/message.
4. Feedback SHALL mencatat agent version dan model indirectly via run.
5. Rating SHALL mendukung positive/negative.
6. Reason codes SHALL mendukung:
   - incorrect answer
   - wrong tool
   - missed context
   - bad tone
   - unsafe answer
   - unnecessary handoff
   - missed handoff
   - repeated introduction
   - hallucinated live data.
7. Feedback MAY menyimpan corrected response.
8. Feedback SHALL permission-controlled.
9. Feedback SHALL workspace-scoped.
10. Feedback SHALL tidak expose customer data unnecessarily.
11. THE AI_System SHALL menyediakan evaluation dataset.
12. Evaluation dataset SHALL mencakup:
   - greeting continuity
   - outlet selection
   - product lookup
   - unavailable product
   - cart update
   - switch outlet
   - order confirmation
   - payment pending
   - payment paid
   - complaint
   - takeover
   - memory correction
   - memory forgetting
   - RAG no-answer
   - prompt injection
   - workspace isolation.
13. Agent version SHOULD lulus evaluation sebelum publish.
14. Evaluation SHALL mencatat model/provider.
15. Evaluation SHALL deterministic sejauh memungkinkan.
16. External model nondeterminism SHALL diakomodasi dengan thresholds.
17. Evaluation result SHALL dapat dibandingkan antar version.
18. Admin SHALL dapat melihat quality summary.
19. Quality summary SHALL tidak menggabungkan workspace tanpa permission.
20. THE AI_System SHALL mendukung regression gate untuk critical scenarios.
21. Payment safety failure SHALL block publish.
22. Cross-workspace leakage SHALL block publish.
23. Repeated introduction failure SHOULD block publish.
24. Tool authorization failure SHALL block publish.
25. Evaluation output SHALL stored with version.
26. Feedback SHALL dapat membuat follow-up improvement task.
27. AI SHALL tidak mengubah dirinya otomatis berdasarkan feedback.
28. Prompt/model change SHALL tetap melalui approval/versioning.
29. THE AI_System SHALL support future A/B testing with safeguards.
30. A/B test SHALL never weaken security policy.

---

## AIA-R28: AI Security and Prompt-Injection Defense

**Priority:** P0

**User Story:** Sebagai platform owner, saya ingin customer dan knowledge content tidak dapat membypass safety atau mencuri data.

### Acceptance Criteria

1. THE AI_System SHALL memperlakukan sebagai untrusted:
   - customer message
   - uploaded file text
   - RAG chunks
   - external content
   - tool-returned free text.
2. Untrusted content SHALL tidak dapat mengubah platform policy.
3. Untrusted content SHALL tidak dapat menambah tools.
4. Untrusted content SHALL tidak dapat mengubah workspace scope.
5. Untrusted content SHALL tidak dapat meminta secrets.
6. Untrusted content SHALL tidak dapat mark payment paid.
7. Tool authorization SHALL enforced outside model.
8. Workspace scope SHALL derived server-side.
9. Outlet scope SHALL validated server-side.
10. Agent custom instruction SHALL lower priority than platform policy.
11. Retrieved knowledge SHALL dibungkus sebagai data, bukan instruction.
12. Tool result free text SHALL dibungkus sebagai data.
13. THE AI_System SHALL redact secrets from prompt.
14. THE AI_System SHALL redact secrets from logs.
15. THE AI_System SHALL redact secrets from traces.
16. THE AI_System SHALL not expose system prompt verbatim to customer.
17. THE AI_System SHALL have prompt-injection tests.
18. THE AI_System SHALL have tool-escalation tests.
19. THE AI_System SHALL have cross-workspace exfiltration tests.
20. THE AI_System SHALL rate-limit AI endpoints.
21. THE AI_System SHALL limit message size.
22. THE AI_System SHALL limit attachment processing.
23. THE AI_System SHALL validate structured output.
24. THE AI_System SHALL reject unsupported tool arguments.
25. THE AI_System SHALL avoid executing generated code.
26. THE AI_System SHALL avoid dynamic eval.
27. THE AI_System SHALL use least-privilege provider credentials.
28. THE AI_System SHALL support incident logging for repeated malicious attempts.
29. THE AI_System SHALL not reveal hidden chain-of-thought.
30. THE AI_System SHALL provide safe refusal/handoff.
31. External fallback SHALL not receive restricted data without policy.
32. Trace access SHALL require authorization.
33. Agent config update SHALL require elevated permission.
34. Knowledge publish SHALL require permission.
35. Security policy SHALL not be configurable off by tenant.

---

## AIA-R29: Retention, Background Jobs, and Reliability

**Priority:** P0

**User Story:** Sebagai operator, saya ingin memory, summaries, ingestion, dan follow-up dikelola secara reliable.

### Acceptance Criteria

1. THE AI_System SHALL menyediakan worker boundary.
2. Worker jobs MAY mencakup:
   - summarization
   - knowledge ingestion
   - embedding
   - memory retention
   - takeover auto-resume
   - follow-up
   - trace cleanup.
3. Every job SHALL memiliki:
   - type
   - payload/reference
   - attempt count
   - status
   - scheduled time
   - last error
   - dedupe key.
4. Jobs SHALL idempotent atau memiliki dedupe.
5. Retry SHALL capped dengan exponential backoff dan jitter.
6. Permanent error SHALL tidak terus diretry.
7. In-process worker MAY digunakan untuk MVP.
8. System SHALL tidak mengklaim in-process job durable setelah restart.
9. Durable queue SHALL diperlukan sebelum critical multi-instance production.
10. Redis MAY digunakan untuk queue/lock.
11. Supabase SHALL tetap source of truth untuk job-related business state.
12. Raw messages SHALL memiliki 90-day retention default.
13. Summaries SHALL memiliki 90-day after activity retention default.
14. AI prompt/result traces SHALL memiliki 30-day default.
15. Tool traces SHALL memiliki 90-day default.
16. Retention SHALL configurable sesuai policy.
17. Retention cleanup SHALL workspace-safe.
18. Retention cleanup SHALL not delete commerce records.
19. Retention cleanup SHALL not delete active investigation records.
20. Cleanup SHALL audit/metric.
21. Failed cleanup SHALL observable.
22. Summary job duplicate SHALL not create conflicting summaries.
23. Takeover auto-resume SHALL race-safe.
24. Follow-up job SHALL deduplicated.
25. Knowledge ingestion SHALL resumable/retriable.
26. Graceful shutdown SHALL handle in-flight jobs safely.
27. Worker health SHALL observable.
28. Job queue latency SHALL measurable.
29. THE AI_System SHALL prevent stuck AI run.
30. Timeout SHALL mark run failed/degraded safely.

---

## AIA-R30: Performance, Limits, and Cost Controls

**Priority:** P1

**User Story:** Sebagai owner, saya ingin AI responsif dan tidak menjalankan loop tanpa batas.

### Acceptance Criteria

1. Normal text response target SHOULD p95 < 4 detik ketika local model sehat.
2. Tool-assisted response target SHOULD p95 < 12 detik.
3. Recent message limit SHALL configurable.
4. RAG chunk limit SHALL configurable.
5. Max tool calls SHALL configurable.
6. Max iterations SHALL configurable.
7. Max turn timeout SHALL configurable.
8. Max output tokens SHALL configurable.
9. Max input context SHALL provider-aware.
10. THE AI_System SHALL reserve output tokens.
11. THE AI_System SHALL truncate safely.
12. THE AI_System SHALL log truncation reason.
13. THE AI_System SHALL prevent repeated identical tool loop.
14. THE AI_System SHALL detect provider timeout.
15. THE AI_System SHALL use circuit breaker.
16. THE AI_System SHALL support per-workspace usage metrics.
17. THE AI_System SHALL support per-agent usage metrics.
18. Token estimate SHALL recorded where available.
19. Local model cost MAY be represented as resource usage.
20. External fallback usage SHALL be explicitly measurable.
21. Workspace MAY set budget/limit in future.
22. Exceeding limit SHALL produce safe response/handoff.
23. THE AI_System SHALL not sacrifice payment security for latency.
24. THE AI_System SHALL not skip confirmation due to timeout.
25. THE AI_System SHALL support typing indicator.
26. Telegram/WhatsApp SHALL not require token streaming.
27. Web admin MAY use SSE streaming.
28. Streaming SHALL not affect state correctness.
29. Large knowledge retrieval SHALL be bounded.
30. Performance regression SHALL be detected in evaluation/load tests.

---

## AIA-R31: LangChain, LangGraph, Redis, and n8n Boundaries

**Priority:** P0

**User Story:** Sebagai developer, saya ingin framework tambahan digunakan hanya saat benar-benar memberi nilai.

### Acceptance Criteria

1. Core AI correctness SHALL tidak bergantung pada LangChain.
2. LangChain MAY digunakan untuk:
   - document loaders
   - text splitters
   - retrieval composition
   - prompt helpers
   - structured output helper
   - evaluation.
3. LangChain memory SHALL tidak menjadi authoritative memory.
4. LangChain scratchpad SHALL tidak menjadi cart/order/payment source.
5. LangChain integration SHALL berada di adapter boundary.
6. LangChain SHALL dapat diganti tanpa mengubah domain services.
7. LangGraph SHALL deferred untuk MVP.
8. LangGraph MAY diperkenalkan ketika:
   - multiple specialist agents aktif;
   - workflow membutuhkan pause/resume;
   - approval node dibutuhkan;
   - checkpointing dibutuhkan;
   - orchestration state kompleks.
9. Introduction LangGraph SHALL membutuhkan approved design update.
10. Redis MAY digunakan untuk:
    - cache
    - distributed lock
    - rate limit
    - queue
    - circuit breaker
    - short-lived typing state.
11. Redis SHALL tidak menjadi sole source untuk:
    - messages
    - memory
    - cart
    - order
    - payment
    - knowledge
    - agent config.
12. Redis loss SHALL tidak merusak correctness.
13. n8n MAY digunakan untuk:
    - internal reporting
    - non-critical automation
    - admin notification
    - prototype.
14. n8n SHALL tidak menjadi authority untuk:
    - payment
    - cart
    - order
    - permission
    - webhook verification
    - core conversation state.
15. External framework SHALL tidak menerima service-role secret.
16. External framework SHALL mengikuti workspace isolation.
17. Framework upgrade SHALL tidak memaksa big-bang rewrite.
18. Framework usage SHALL terdokumentasi.
19. Framework failure SHALL memiliki fallback.
20. THE AI_System SHALL tetap modular monolith untuk MVP kecuali approved otherwise.

---

## AIA-R32: Future Multi-Agent Readiness

**Priority:** P1

**User Story:** Sebagai owner, saya ingin dapat membuat beberapa specialist agent di masa depan tanpa mengubah security model.

### Acceptance Criteria

1. THE AI_System SHALL mendukung lebih dari satu agent config.
2. Specialist agents MAY memiliki role:
   - commerce
   - product recommendation
   - support
   - complaint
   - order status
   - internal copilot.
3. Specialist agents SHALL menggunakan Tool Gateway yang sama.
4. Specialist agents SHALL tidak mendapat database credential.
5. Specialist agents SHALL memiliki tool allowlist masing-masing.
6. Specialist agents SHALL memiliki knowledge scope masing-masing.
7. Specialist agents SHALL memiliki model assignment masing-masing.
8. Router SHALL dapat memilih specialist.
9. Specialist handoff SHALL tercatat.
10. Multi-agent loop SHALL bounded.
11. Agent-to-agent message SHALL treated as internal structured data.
12. Specialist SHALL tidak dapat override platform policy.
13. Specialist SHALL tidak dapat mark payment paid.
14. Specialist SHALL tidak dapat bypass human takeover.
15. Specialist SHALL tidak dapat access cross-workspace data.
16. Specialist output SHALL divalidasi.
17. Specialist version SHALL recorded.
18. Specialist evaluation SHALL terpisah.
19. MVP SHALL tidak memerlukan autonomous swarm.
20. MVP SHALL tidak memerlukan decentralized agent memory.
21. Shared customer memory SHALL tetap melalui Memory Service.
22. Shared commerce state SHALL tetap melalui backend.
23. Future LangGraph introduction SHALL tetap optional.
24. Specialist failure SHALL fallback ke primary agent/human.
25. Multi-agent feature SHALL require explicit spec expansion before activation.

---

## AIA-R33: AI Testing and Quality Assurance

**Priority:** P0

**User Story:** Sebagai development team, saya ingin automated tests melindungi memory, RAG, tools, payment safety, dan human takeover.

### Acceptance Criteria

1. THE AI_System SHALL memiliki unit tests.
2. THE AI_System SHALL memiliki integration tests.
3. THE AI_System SHALL memiliki security tests.
4. THE AI_System SHALL memiliki evaluation tests.
5. Unit tests SHALL mencakup:
   - chat resolution
   - session boundary
   - greeting flags
   - context builder
   - summary validation
   - memory policy
   - RAG filter
   - router
   - tool allowlist
   - confirmation policy
   - loop limits
   - takeover timer.
6. Integration tests SHALL mencakup:
   - Telegram inbound to response
   - WhatsApp inbound to response
   - multi-turn continuity
   - rolling summary
   - cross-channel contact profile
   - RAG retrieval
   - product tool
   - cart tool
   - order confirmation
   - payment status read
   - complaint ticket
   - takeover/resume.
7. Security tests SHALL mencakup:
   - prompt injection
   - cross-workspace memory
   - cross-workspace RAG
   - unauthorized tool
   - secret redaction
   - no AI mark-paid
   - agent config authorization.
8. Evaluation SHALL mencakup:
   - no repeated introduction
   - Bahasa Indonesia tone
   - outlet selection
   - no address for pickup
   - no COD/manual transfer
   - no fake paid response
   - complaint behavior
   - RAG no-answer.
9. External provider SHALL mocked untuk deterministic tests.
10. Local model integration MAY memiliki separate optional test.
11. Test SHALL tidak menggunakan production data.
12. Test SHALL tidak menggunakan production secret.
13. Test SHALL menggunakan isolated Supabase test environment.
14. Critical security tests SHALL block release.
15. Payment boundary failure SHALL block release.
16. Cross-workspace leakage SHALL block release.
17. Human takeover failure SHALL block release.
18. Message duplication SHALL block release.
19. Tool idempotency SHALL tested.
20. Worker dedupe SHALL tested.
21. Agent versioning SHALL tested.
22. Retention cleanup SHALL tested.
23. Performance/load tests SHOULD cover concurrent messages.
24. Test result SHALL recorded honestly.
25. Definition of Done SHALL require docs update.
26. Regression dataset SHALL versioned.
27. Evaluation result SHALL tied to agent version.
28. Test fixtures SHALL redacted.
29. AI output assertions MAY use structured constraints.
30. Nondeterministic text SHALL not be asserted with brittle exact string only.

---

## AIA-R34: AI Administration and Safe Configuration APIs

**Priority:** P1

**User Story:** Sebagai admin, saya ingin mengelola agent, knowledge, memory, dan quality dengan aman.

### Acceptance Criteria

1. THE AI_System SHALL menyediakan admin APIs untuk Agent.
2. Agent APIs SHOULD mencakup:
   - list
   - create
   - detail
   - update draft
   - test
   - publish
   - archive
   - versions
   - tool policy
   - knowledge assignment.
3. THE AI_System SHALL menyediakan knowledge APIs.
4. Knowledge APIs SHOULD mencakup:
   - list
   - create/upload
   - detail
   - update
   - ingest
   - preview
   - publish
   - archive
   - chunks
   - retrieval test.
5. THE AI_System SHALL menyediakan memory administration APIs.
6. Memory APIs SHALL support authorized list/correct/delete.
7. THE AI_System SHALL menyediakan AI run/trace APIs.
8. Trace APIs SHALL redacted.
9. THE AI_System SHALL menyediakan feedback APIs.
10. THE AI_System SHALL menyediakan agent health/test endpoint.
11. Agent test SHALL tidak menggunakan production mutation tools by default.
12. Secret fields SHALL write-only.
13. API SHALL return `configured: true`, bukan secret.
14. APIs SHALL workspace-scoped.
15. APIs SHALL enforce role permission.
16. Outlet manager access SHALL terbatas.
17. Publish SHALL membutuhkan elevated permission.
18. Archive SHALL tidak menghapus historical run references.
19. API error SHALL mengikuti backend error contract.
20. API SHALL menggunakan pagination/filtering.
21. Sensitive operation SHALL audit.
22. Admin UI MAY menampilkan retrieval source dan tool trace.
23. Admin UI SHALL tidak menampilkan hidden secret.
24. Admin UI SHOULD menampilkan quality metrics.
25. Admin UI SHOULD menampilkan agent version.
26. Admin UI SHOULD menampilkan memory source.
27. Admin UI SHALL mendukung human takeover control melalui domain contract.
28. Admin UI SHALL tidak dapat mark payment paid melalui AI settings.
29. Configuration APIs SHALL support optimistic concurrency/version conflict.
30. Breaking config schema change SHALL memiliki migration plan.

---

# Cross-Cutting Correctness Properties

## Property 1: Stable Conversation Identity

*For any* inbound event dengan workspace, platform, dan external conversation yang sama, THE AI_System SHALL menggunakan chat yang sama.

## Property 2: Message Idempotency

*For any* duplicate platform message ID, maksimal satu internal message dan satu AI turn SHALL dibuat.

## Property 3: No Repeated Introduction

*For any* second or later assistant response dalam active session, full introduction SHALL tidak diulang.

## Property 4: Context Continuity

*For any* multi-turn conversation, recent messages atau valid summary SHALL tersedia pada turn berikutnya.

## Property 5: Current Message Once

*For any* AI turn, current customer message SHALL muncul tepat satu kali dalam model context.

## Property 6: Bounded Context

*For any* AI turn, context SHALL mematuhi configured limit tanpa menghapus mandatory safety dan commerce state.

## Property 7: Memory Isolation

*For any* memory query, hanya memory current workspace/contact SHALL dikembalikan.

## Property 8: Forgetting

*For any* successfully forgotten memory, memory tersebut SHALL tidak muncul pada future context.

## Property 9: Address Non-Persistence

*For any* MVP conversation, address SHALL tidak ditulis sebagai durable customer memory.

## Property 10: RAG Workspace Isolation

*For any* retrieval, chunk workspace lain SHALL tidak dikembalikan.

## Property 11: RAG Outlet Isolation

*For any* outlet-scoped retrieval, restricted chunk outlet lain SHALL tidak dikembalikan.

## Property 12: RAG Agent Scope

*For any* agent retrieval, source yang tidak diizinkan agent SHALL tidak dikembalikan.

## Property 13: Live Commerce Authority

*For any* price, stock, availability, cart, order, atau payment answer, authoritative value SHALL berasal dari tool/backend.

## Property 14: Tool Authorization

*For any* tool call, agent allowlist dan backend authorization SHALL lulus sebelum execution.

## Property 15: Tool Input Validation

*For any* tool call, invalid schema SHALL ditolak tanpa domain mutation.

## Property 16: Customer Confirmation

*For any* order creation, explicit valid customer confirmation SHALL tersedia.

## Property 17: Outlet Confirmation

*For any* new order flow, selected outlet SHALL confirmed oleh customer.

## Property 18: Single Active Cart

*For any* workspace/contact, maksimal satu active cart SHALL berlaku melalui backend contract.

## Property 19: Payment Read-Only AI

*For any* agent/tool configuration, tidak ada capability AI untuk mengubah payment menjadi paid.

## Property 20: Paid Message Safety

*For any* AI payment-success response, backend payment state SHALL sudah paid melalui verified processing.

## Property 21: Human Takeover Silence

*For any* chat dengan active takeover, customer-facing AI response SHALL tidak dikirim.

## Property 22: Safe Auto-Resume

*For any* auto-resume, tidak boleh ada customer message lebih baru atau pinned takeover.

## Property 23: Loop Bound

*For any* AI run, tool calls dan iterations SHALL tidak melebihi configured maximum.

## Property 24: Secret Confidentiality

*For any* prompt, response, trace, atau normal log, backend/provider secrets SHALL tidak ada.

## Property 25: Agent Version Traceability

*For any* AI run, exact agent version SHALL tercatat.

## Property 26: Notification Dedupe

*For any* follow-up dedupe key, maksimal satu outbound notification SHALL dikirim.

## Property 27: Complaint Confirmation

*For any* complaint ticket created by AI, customer-confirmed summary SHALL tercatat.

## Property 28: Framework Replaceability

*For any* removal of LangChain/Redis/n8n, core correctness SHALL tetap dapat dipertahankan melalui approved adapters.

## Property 29: Cross-Channel Profile

*For any* linked contact identities, durable preferences MAY dibagi, tetapi message history SHALL tetap per chat.

## Property 30: No Success Before Commit

*For any* AI action success response, required backend mutation SHALL committed terlebih dahulu.

---

# Error Codes

```text
AI_AGENT_NOT_FOUND
AI_AGENT_INACTIVE
AI_AGENT_VERSION_NOT_FOUND
AI_AGENT_ROUTING_FAILED
AI_PROVIDER_NOT_CONFIGURED
AI_PROVIDER_UNAVAILABLE
AI_PROVIDER_TIMEOUT
AI_PROVIDER_OUTPUT_INVALID
AI_FALLBACK_NOT_ALLOWED
AI_CONTEXT_BUILD_FAILED
AI_CONTEXT_LIMIT_EXCEEDED
AI_MESSAGE_DUPLICATE
AI_SESSION_NOT_FOUND
AI_SESSION_CONFLICT
AI_SUMMARY_FAILED
AI_MEMORY_NOT_FOUND
AI_MEMORY_WRITE_REJECTED
AI_MEMORY_FORGET_FAILED
AI_MEMORY_POLICY_DENIED
AI_KNOWLEDGE_NOT_FOUND
AI_KNOWLEDGE_NOT_PUBLISHED
AI_KNOWLEDGE_INGESTION_FAILED
AI_RAG_NO_RELEVANT_RESULT
AI_RAG_SCOPE_DENIED
AI_TOOL_NOT_FOUND
AI_TOOL_NOT_ALLOWED
AI_TOOL_INPUT_INVALID
AI_TOOL_CONFIRMATION_REQUIRED
AI_TOOL_CONFIRMATION_EXPIRED
AI_TOOL_EXECUTION_FAILED
AI_TOOL_TIMEOUT
AI_TOOL_IDEMPOTENCY_CONFLICT
AI_LOOP_LIMIT_REACHED
AI_HUMAN_TAKEOVER_ACTIVE
AI_HANDOFF_FAILED
AI_TRACE_ACCESS_DENIED
AI_FEEDBACK_INVALID
AI_PROMPT_INJECTION_BLOCKED
AI_SECURITY_POLICY_VIOLATION
AI_RATE_LIMITED
AI_FOLLOWUP_NOT_ALLOWED
AI_FOLLOWUP_DUPLICATE
AI_CONFIGURATION_CONFLICT
AI_EVALUATION_FAILED
AI_INTERNAL_ERROR
```

---

# MVP Scope Boundary

## Included in MVP

```text
Telegram AI responses
WhatsApp AI responses
stable contact/chat resolution
message deduplication
conversation sessions
greeting continuity
recent messages
rolling summary
durable customer preferences
memory forgetting/correction
configurable AI agents
local model adapter
model router
lightweight agent router
custom AI orchestrator
structured tool calling
Tool Gateway
knowledge source management
RAG with pgvector
workspace/outlet/agent retrieval filters
product/cart/order/payment read tools
approved commerce mutation tools
Xendit payment-link request through backend
payment status read-only AI
complaint ticket
human takeover
5-minute safe auto-resume
AI traces
feedback
evaluation scenarios
transactional follow-up
```

## Optional / Phase After Core MVP

```text
external model fallback
advanced reranker
marketing follow-up
A/B testing
durable distributed queue
Redis cache/lock/queue
specialist agents
LangGraph workflow
web dashboard streaming
advanced quality analytics
automated agent recommendation
```

## Explicitly Out of Scope

```text
AI mark-paid
AI refund
manual payment
COD
delivery address memory
autonomous knowledge publishing
autonomous price changes
autonomous stock changes
unbounded autonomous loop
multi-agent swarm
n8n as payment/order authority
Redis-only memory
LangChain-only memory
microservices rewrite
AI-generated executable code
cross-workspace shared memory
```

---

# Requirement Traceability by Delivery Phase

## Phase 0 — Context Bug Fix

```text
AIA-R1 Inbound pipeline
AIA-R2 Chat identity
AIA-R3 Message idempotency
AIA-R5 Greeting continuity
AIA-R6 Recent memory
AIA-R33 Tests
```

## Phase 1 — Persistent Conversation Memory

```text
AIA-R4 Conversation sessions
AIA-R6 Recent memory
AIA-R7 Rolling summary
AIA-R9 Privacy/forgetting
AIA-R29 Retention/jobs
```

## Phase 2 — AI Orchestration Foundation

```text
AIA-R10 Context builder
AIA-R15 Agent configuration
AIA-R16 Agent routing
AIA-R17 Model router
AIA-R18 Orchestrator
AIA-R26 Trace
AIA-R30 Limits
```

## Phase 3 — Durable Customer Memory

```text
AIA-R8 Durable memory
AIA-R9 Correction/forgetting
AIA-R28 Security
```

## Phase 4 — RAG

```text
AIA-R11 Knowledge source
AIA-R12 Ingestion
AIA-R13 Retrieval
AIA-R14 Live data authority
AIA-R31 Framework boundary
```

## Phase 5 — Tool Gateway

```text
AIA-R19 Tool Gateway
AIA-R20 Confirmation
AIA-R28 Security
```

## Phase 6 — Commerce AI

```text
AIA-R14 Live authority
AIA-R20 Confirmation
AIA-R21 Commerce guardrails
AIA-R22 Payment boundary
AIA-R23 Complaint
```

## Phase 7 — Human Control

```text
AIA-R23 Escalation
AIA-R24 Human takeover
```

## Phase 8 — Follow-Up

```text
AIA-R25 Proactive messaging
AIA-R29 Jobs
```

## Phase 9 — Multi-Agent Preparation

```text
AIA-R15 Agent versioning
AIA-R16 Routing
AIA-R32 Multi-agent readiness
```

## Phase 10 — Hardening

```text
AIA-R26 Observability
AIA-R27 Evaluation
AIA-R28 Security
AIA-R29 Reliability
AIA-R30 Performance
AIA-R33 Testing
AIA-R34 Admin APIs
```

---

# Definition of Done for an AI Requirement

Satu requirement AI dianggap selesai hanya jika:

1. acceptance criteria yang applicable sudah diimplementasikan;
2. requirement yang belum applicable ditandai deferred secara eksplisit;
3. workspace scope diterapkan;
4. agent/tool permission diterapkan;
5. persistent state menggunakan approved Supabase boundary;
6. request/input schema divalidasi;
7. secrets tidak masuk prompt/log/trace;
8. relevant tool action melewati Tool Gateway;
9. human takeover diperiksa;
10. idempotency diterapkan bila ada side effect;
11. unit tests tersedia;
12. integration tests tersedia;
13. security tests tersedia;
14. evaluation scenario tersedia;
15. trace/metrics diperbarui;
16. error codes stabil;
17. relevant API contract diperbarui;
18. AI Agent settings contract diperbarui bila applicable;
19. retention impact terdokumentasi;
20. relevant design/tasks/progress docs diperbarui;
21. final specs validation lulus.

---

# Final Requirement Statement

SelaluTeh AI Agent Architecture SHALL membangun sistem AI yang memiliki context, memory, knowledge retrieval, tools, dan quality control tanpa menjadikan model sebagai transaction authority.

AI SHALL:

```text
memahami percakapan
mengingat secara terkendali
mengambil knowledge secara terisolasi
memilih tool yang diizinkan
meminta confirmation
membantu commerce
membuat complaint
melakukan handoff
mengirim follow-up yang aman
```

Backend SHALL tetap authoritative untuk:

```text
workspace access
outlet access
price
stock
availability
cart
order
payment
fulfillment
complaint state
notification state
```

Payment SHALL hanya dianggap paid setelah verified backend processing.

Human takeover SHALL selalu menghentikan customer-facing AI.

Persistent memory SHALL berada di Supabase.

LangChain, LangGraph, Redis, dan n8n SHALL bersifat optional supporting tools dan tidak boleh menjadi source of truth atau security boundary.
