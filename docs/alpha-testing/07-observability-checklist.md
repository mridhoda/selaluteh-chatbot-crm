# 07 — Observability Checklist

**Project:** SelaluTeh / Foodinesia Marketplace Order Bot  
**Testing Phase:** Internal Alpha Testing  
**Feature Scope:** Marketplace / Order Bot only  
**Document Type:** Observability & Debugging Checklist  
**Status:** Draft  
**Last Updated:** 2026-07-04

---

## 1. Purpose

Dokumen ini menjelaskan checklist observability yang perlu disiapkan sebelum dan selama alpha testing internal untuk fitur **Marketplace / Order Bot**.

Observability dibutuhkan agar tim bisa menjawab pertanyaan penting seperti:

- Kenapa bot menjawab seperti itu?
- Intent apa yang terdeteksi dari pesan customer?
- Tool apa yang dipanggil AI?
- Order dibuat dari percakapan yang mana?
- Kenapa payment belum berubah menjadi paid?
- Apakah webhook diterima lebih dari sekali?
- Apakah terjadi duplicate order atau duplicate payment processing?
- Apakah order masuk ke outlet yang benar?
- Apakah human handoff berhasil aktif?
- Apakah error bisa ditelusuri dari chat sampai backend?

Alpha testing tidak cukup hanya melihat UI berhasil atau gagal. Setiap flow penting harus memiliki jejak log yang bisa ditelusuri.

---

## 2. Observability Goals

Tujuan utama observability pada alpha testing ini adalah:

1. Memudahkan debugging flow order dari chat sampai payment.
2. Memastikan setiap error memiliki context yang cukup.
3. Mendeteksi duplicate order, duplicate webhook, dan status mismatch.
4. Memastikan AI tidak mengarang data produk, harga, outlet, promo, atau stok.
5. Memastikan scope guard bekerja untuk permintaan di luar domain marketplace.
6. Memastikan human handoff dapat dilacak dari trigger sampai agent mengambil alih.
7. Memberikan data yang cukup untuk bug report dan retest.
8. Menjadi dasar monitoring sebelum masuk beta atau production.

---

## 3. Required Correlation IDs

Setiap request, percakapan, order, dan payment harus bisa dihubungkan melalui identifier yang konsisten.

| Field | Required | Description |
|---|---:|---|
| `correlation_id` | Yes | ID utama untuk melacak satu flow lintas service/log |
| `request_id` | Yes | ID per HTTP request/API call |
| `conversation_id` | Yes | ID percakapan customer dengan bot |
| `message_id` | Yes | ID pesan individual dari customer atau bot |
| `customer_id` | Yes | ID customer internal, bukan nomor/username mentah |
| `workspace_id` | Yes | ID workspace/account bisnis |
| `outlet_id` | Conditional | Wajib setelah customer memilih outlet |
| `cart_id` | Conditional | Wajib saat cart dibuat/diubah |
| `order_id` | Conditional | Wajib setelah order dibuat |
| `payment_id` | Conditional | Wajib setelah payment record dibuat |
| `payment_session_id` | Conditional | Wajib untuk payment link/session gateway |
| `webhook_event_id` | Conditional | Wajib saat menerima webhook payment |
| `handoff_session_id` | Conditional | Wajib saat human handoff aktif |
| `tool_call_id` | Conditional | Wajib setiap AI memanggil tool |

### Checklist

- [ ] Setiap inbound message memiliki `correlation_id`.
- [ ] Setiap response bot membawa `correlation_id` yang sama.
- [ ] Setiap order dapat ditelusuri ke `conversation_id`.
- [ ] Setiap payment dapat ditelusuri ke `order_id`.
- [ ] Setiap webhook dapat ditelusuri ke `payment_session_id` dan `order_id`.
- [ ] Setiap bug report dapat mencantumkan minimal `conversation_id`, `order_id`, atau `correlation_id`.

---

## 4. Logging Principles

Gunakan structured logging agar log mudah dicari dan difilter.

### Recommended Format

```json
{
  "timestamp": "2026-07-04T10:15:30.000+08:00",
  "level": "info",
  "service": "order-bot-api",
  "event": "order.created",
  "correlation_id": "corr_alpha_001",
  "workspace_id": "ws_alpha_foodinesia",
  "outlet_id": "outlet_samarinda_01",
  "conversation_id": "conv_alpha_001",
  "customer_id": "cust_alpha_001",
  "order_id": "ord_alpha_001",
  "message": "Order created successfully"
}
```

### Rules

- [ ] Gunakan JSON structured logs.
- [ ] Jangan hanya menyimpan plain text error.
- [ ] Gunakan event name yang konsisten.
- [ ] Hindari log terlalu verbose untuk data sensitif.
- [ ] Masking data pribadi dan credential.
- [ ] Jangan log API key, token, secret, signature raw, atau authorization header.
- [ ] Error log harus menyertakan context bisnis yang cukup.
- [ ] Log harus bisa dicari berdasarkan `correlation_id`.

---

## 5. Event Naming Standard

Gunakan pola nama event yang stabil.

| Domain | Event Examples |
|---|---|
| Conversation | `conversation.started`, `message.received`, `message.sent` |
| AI Router | `ai.intent.detected`, `ai.route.selected`, `ai.scope.rejected` |
| Tool Call | `ai.tool.requested`, `ai.tool.succeeded`, `ai.tool.failed` |
| Outlet | `outlet.suggested`, `outlet.selected`, `outlet.unavailable` |
| Product | `product.listed`, `product.checked`, `product.unavailable` |
| Cart | `cart.created`, `cart.item.added`, `cart.item.updated`, `cart.item.removed`, `cart.cleared` |
| Checkout | `checkout.started`, `checkout.confirmed`, `checkout.failed` |
| Order | `order.created`, `order.updated`, `order.cancelled`, `order.failed` |
| Payment | `payment.session.created`, `payment.status.updated`, `payment.failed` |
| Webhook | `webhook.received`, `webhook.verified`, `webhook.rejected`, `webhook.duplicate`, `webhook.processed` |
| Pickup | `pickup.instruction.sent`, `pickup.completed` |
| Complaint | `complaint.created`, `complaint.updated` |
| Handoff | `handoff.triggered`, `handoff.assigned`, `handoff.resolved` |
| Security | `security.prompt_injection.detected`, `security.out_of_scope.detected`, `security.unauthorized_tool_blocked` |
| System | `system.error`, `system.timeout`, `system.retry`, `system.circuit_opened` |

### Checklist

- [ ] Event name sudah disepakati developer dan tester.
- [ ] Event name tidak berubah-ubah antar service.
- [ ] Event name bisa dipakai sebagai filter di log viewer.
- [ ] Critical event memiliki severity/log level yang tepat.

---

## 6. Conversation Observability

Setiap percakapan customer harus bisa dilacak dari pesan masuk sampai response bot.

### Required Logs

| Event | Required Fields |
|---|---|
| `message.received` | `conversation_id`, `message_id`, `customer_id`, `channel`, `text_length`, `timestamp` |
| `ai.intent.detected` | `intent`, `confidence`, `conversation_id`, `message_id` |
| `ai.route.selected` | `route`, `reason`, `allowed_tools` |
| `message.sent` | `response_type`, `conversation_id`, `message_id`, `latency_ms` |

### Checklist

- [ ] Inbound customer message tercatat.
- [ ] Outbound bot response tercatat.
- [ ] Intent classification tercatat.
- [ ] Route yang dipilih tercatat.
- [ ] Confidence score tercatat jika tersedia.
- [ ] Latency response bot tercatat.
- [ ] Channel asal tercatat: Telegram, WhatsApp, atau internal test.
- [ ] Bot response dapat dikaitkan ke customer message sebelumnya.

---

## 7. AI Scope Guard Observability

Karena order bot hanya boleh melayani domain marketplace/customer service, semua penolakan out-of-scope harus terlihat di log.

### Allowed Scope

- Produk.
- Harga.
- Outlet.
- Jam operasional.
- Promo resmi.
- Cart.
- Checkout.
- Payment.
- Pickup.
- Status order.
- Complaint.
- Human handoff.

### Out-of-Scope Examples

- Coding.
- Tugas sekolah/kuliah.
- Berita/politik.
- Medis/hukum/investasi.
- Roleplay non-CS.
- Permintaan menampilkan prompt internal.
- Permintaan mengabaikan instruksi sistem.

### Required Logs

| Event | Required Fields |
|---|---|
| `security.out_of_scope.detected` | `message_id`, `conversation_id`, `detected_topic`, `action=reject` |
| `security.prompt_injection.detected` | `message_id`, `pattern`, `action=reject` |
| `ai.scope.rejected` | `route=out_of_scope`, `tools_called=false` |

### Checklist

- [ ] Out-of-scope request tercatat.
- [ ] Prompt injection attempt tercatat.
- [ ] Tidak ada RAG/tool call setelah request ditolak.
- [ ] Log menunjukkan `tools_called=false` untuk out-of-scope.
- [ ] Refusal response tidak membocorkan policy internal.
- [ ] Tester dapat membedakan refusal valid dan bug.

---

## 8. Tool Call Observability

Setiap AI tool call harus tercatat agar tim bisa memastikan AI mengambil data dari sumber resmi, bukan mengarang.

### Required Tool Logs

| Event | Required Fields |
|---|---|
| `ai.tool.requested` | `tool_call_id`, `tool_name`, `input_schema_version`, `conversation_id` |
| `ai.tool.succeeded` | `tool_call_id`, `tool_name`, `result_status`, `latency_ms` |
| `ai.tool.failed` | `tool_call_id`, `tool_name`, `error_code`, `latency_ms` |
| `security.unauthorized_tool_blocked` | `tool_name`, `route`, `reason` |

### Tool Checklist

- [ ] Tool call memiliki `tool_call_id`.
- [ ] Tool name tercatat.
- [ ] Tool input disanitasi sebelum masuk log.
- [ ] Tool result tidak menyimpan data sensitif berlebihan.
- [ ] Tool latency tercatat.
- [ ] Tool error tercatat dengan error code.
- [ ] Unauthorized tool call diblokir dan tercatat.
- [ ] Tool allowlist aktif berdasarkan route/intent.

### Important Rule

AI tidak boleh membuat keputusan final untuk harga, order total, payment status, atau ketersediaan produk tanpa validasi backend.

Checklist:

- [ ] Harga diambil dari backend/product service.
- [ ] Stok/ketersediaan diambil dari backend/product service.
- [ ] Total order dihitung backend.
- [ ] Status payment hanya diubah oleh webhook terverifikasi atau reconciliation resmi.

---

## 9. Outlet Observability

Karena marketplace mendukung multi-outlet, outlet routing harus bisa ditelusuri.

### Required Logs

| Event | Required Fields |
|---|---|
| `outlet.suggested` | `candidate_outlet_ids`, `reason`, `customer_context` |
| `outlet.selected` | `outlet_id`, `selection_source`, `conversation_id` |
| `outlet.unavailable` | `outlet_id`, `reason`, `alternative_outlet_ids` |

### Checklist

- [ ] Outlet suggestion tercatat.
- [ ] Outlet yang dipilih customer tercatat.
- [ ] Order selalu menyimpan `outlet_id`.
- [ ] Produk yang ditampilkan sesuai outlet yang dipilih.
- [ ] Produk unavailable per outlet tercatat.
- [ ] Jika outlet tutup, bot tidak melanjutkan checkout normal.
- [ ] Order tidak pernah masuk ke outlet yang salah.

---

## 10. Product & Pricing Observability

Produk, harga, dan ketersediaan adalah area kritis karena berdampak langsung pada transaksi.

### Required Logs

| Event | Required Fields |
|---|---|
| `product.listed` | `outlet_id`, `category_id`, `product_count` |
| `product.checked` | `product_id`, `outlet_id`, `available`, `price` |
| `product.unavailable` | `product_id`, `outlet_id`, `reason` |
| `pricing.calculated` | `cart_id`, `subtotal`, `discount`, `total`, `pricing_version` |

### Checklist

- [ ] Product list request tercatat.
- [ ] Product availability check tercatat.
- [ ] Product price tercatat sebagai value backend.
- [ ] Perubahan harga saat checkout ditangani dan tercatat.
- [ ] Produk nonaktif tidak bisa masuk cart.
- [ ] Produk dari outlet berbeda tidak bisa tercampur dalam satu order.
- [ ] Promo/discount hanya diterapkan jika valid di backend.

---

## 11. Cart Observability

Cart adalah state penting dalam conversation. Bug pada cart bisa menyebabkan order salah.

### Required Logs

| Event | Required Fields |
|---|---|
| `cart.created` | `cart_id`, `conversation_id`, `customer_id`, `outlet_id` |
| `cart.item.added` | `cart_id`, `product_id`, `quantity`, `price_snapshot` |
| `cart.item.updated` | `cart_id`, `product_id`, `old_quantity`, `new_quantity` |
| `cart.item.removed` | `cart_id`, `product_id` |
| `cart.cleared` | `cart_id`, `reason` |
| `cart.expired` | `cart_id`, `expired_at` |

### Checklist

- [ ] Cart dibuat setelah outlet valid.
- [ ] Cart memiliki `outlet_id`.
- [ ] Setiap item add/update/remove tercatat.
- [ ] Price snapshot tercatat.
- [ ] Cart total dihitung ulang oleh backend.
- [ ] Cart tidak tertukar antar customer.
- [ ] Cart tidak tertukar antar conversation.
- [ ] Cart expired behavior tercatat.
- [ ] Cart masih konsisten setelah user mengirim pesan ambigu.

---

## 12. Checkout Observability

Checkout harus memiliki jejak validasi lengkap sebelum order dibuat.

### Required Logs

| Event | Required Fields |
|---|---|
| `checkout.started` | `cart_id`, `customer_id`, `outlet_id` |
| `checkout.validation.started` | `cart_id`, `validation_rules` |
| `checkout.validation.failed` | `cart_id`, `reason`, `failed_rule` |
| `checkout.confirmed` | `cart_id`, `confirmed_by`, `confirmed_at` |
| `checkout.failed` | `cart_id`, `error_code`, `reason` |

### Checklist

- [ ] Checkout hanya bisa dimulai dari cart valid.
- [ ] Checkout membutuhkan konfirmasi customer.
- [ ] Backend melakukan validasi ulang produk, harga, outlet, dan total.
- [ ] Checkout validation failure tercatat jelas.
- [ ] Bot tidak membuat order tanpa konfirmasi.
- [ ] Double confirmation tidak membuat double order.
- [ ] Timeout saat checkout tercatat.

---

## 13. Order Observability

Order adalah entitas inti yang wajib memiliki audit trail.

### Required Logs

| Event | Required Fields |
|---|---|
| `order.created` | `order_id`, `cart_id`, `customer_id`, `outlet_id`, `total` |
| `order.updated` | `order_id`, `old_status`, `new_status`, `updated_by` |
| `order.cancelled` | `order_id`, `reason`, `cancelled_by` |
| `order.failed` | `cart_id`, `error_code`, `reason` |

### Required Order Audit Fields

| Field | Description |
|---|---|
| `created_from` | Example: `telegram_bot`, `whatsapp_bot`, `admin_dashboard` |
| `conversation_id` | Source conversation |
| `cart_id` | Source cart |
| `outlet_id` | Fulfillment outlet |
| `payment_status` | `unpaid`, `paid`, `expired`, `failed`, `cancelled` |
| `fulfillment_status` | `pending`, `accepted`, `preparing`, `ready`, `completed`, `cancelled` |
| `total_snapshot` | Final amount charged |
| `items_snapshot` | Product, quantity, price at order time |

### Checklist

- [ ] Order memiliki audit trail.
- [ ] Order bisa ditelusuri ke conversation.
- [ ] Order bisa ditelusuri ke payment.
- [ ] Order menyimpan item snapshot.
- [ ] Order menyimpan price snapshot.
- [ ] Order tidak berubah total setelah payment link dibuat, kecuali lewat flow resmi.
- [ ] Duplicate order prevention aktif.
- [ ] Order status transition tervalidasi.
- [ ] Order salah outlet terdeteksi sebagai critical bug.

---

## 14. Payment Observability

Payment adalah area paling kritis. Semua perubahan status harus bisa diaudit.

### Required Logs

| Event | Required Fields |
|---|---|
| `payment.session.created` | `payment_session_id`, `order_id`, `amount`, `gateway`, `expires_at` |
| `payment.status.updated` | `payment_id`, `order_id`, `old_status`, `new_status`, `source` |
| `payment.failed` | `payment_id`, `order_id`, `error_code`, `reason` |
| `payment.expired` | `payment_id`, `order_id`, `expired_at` |

### Checklist

- [ ] Payment session hanya dibuat untuk order valid.
- [ ] Amount payment sama dengan total order.
- [ ] Payment link memiliki expiry.
- [ ] Payment status tidak bisa diubah dari pesan customer biasa.
- [ ] Payment status hanya berubah melalui webhook terverifikasi atau reconciliation resmi.
- [ ] Payment gateway event ID disimpan.
- [ ] Payment status update idempotent.
- [ ] Payment error tercatat dengan detail cukup.

---

## 15. Webhook Observability

Webhook harus aman terhadap retry, duplicate event, signature invalid, dan out-of-order event.

### Required Logs

| Event | Required Fields |
|---|---|
| `webhook.received` | `webhook_event_id`, `gateway`, `event_type`, `received_at` |
| `webhook.verified` | `webhook_event_id`, `gateway`, `signature_valid=true` |
| `webhook.rejected` | `reason`, `signature_valid=false`, `source_ip` if available |
| `webhook.duplicate` | `webhook_event_id`, `first_processed_at` |
| `webhook.processed` | `webhook_event_id`, `order_id`, `payment_id`, `result` |
| `webhook.processing_failed` | `webhook_event_id`, `error_code`, `retryable` |

### Checklist

- [ ] Setiap webhook masuk tercatat.
- [ ] Signature verification tercatat.
- [ ] Webhook invalid ditolak.
- [ ] Duplicate webhook tidak memproses payment dua kali.
- [ ] Duplicate webhook tercatat sebagai duplicate, bukan error fatal.
- [ ] Webhook event ID disimpan untuk idempotency.
- [ ] Out-of-order event ditangani.
- [ ] Webhook retry aman.
- [ ] Payment dan order status tetap konsisten.
- [ ] Webhook failure memiliki retry strategy.

---

## 16. Idempotency Checklist

Idempotency wajib untuk mencegah order/payment ganda.

### Critical Idempotency Points

| Flow | Idempotency Key Recommendation |
|---|---|
| Checkout confirmation | `conversation_id + cart_id + checkout_attempt_id` |
| Order creation | `cart_id + customer_id + outlet_id` |
| Payment session creation | `order_id + payment_attempt_number` |
| Webhook processing | `gateway + webhook_event_id` |
| Handoff creation | `conversation_id + active_handoff_status` |

### Checklist

- [ ] Checkout request berulang tidak membuat order ganda.
- [ ] Tombol/link yang diklik dua kali tidak membuat order ganda.
- [ ] Payment session tidak dibuat berkali-kali tanpa aturan resmi.
- [ ] Webhook retry tidak mengubah status berulang secara berbahaya.
- [ ] Webhook duplicate memiliki log khusus.
- [ ] Setiap idempotent operation menyimpan idempotency key.
- [ ] Idempotency conflict tercatat.

---

## 17. Human Handoff Observability

Human handoff penting saat bot tidak bisa menyelesaikan masalah customer.

### Required Logs

| Event | Required Fields |
|---|---|
| `handoff.triggered` | `conversation_id`, `reason`, `trigger_source` |
| `handoff.assigned` | `handoff_session_id`, `assigned_agent_id`, `assigned_at` |
| `handoff.message.sent` | `handoff_session_id`, `message_id`, `sender_type` |
| `handoff.resolved` | `handoff_session_id`, `resolution`, `resolved_by` |

### Checklist

- [ ] Handoff trigger tercatat.
- [ ] Alasan handoff tercatat.
- [ ] Handoff tidak membuat conversation context hilang.
- [ ] Bot berhenti mengambil alih saat human handoff aktif.
- [ ] Agent dapat melihat ringkasan conversation/order.
- [ ] Handoff resolved tercatat.
- [ ] Setelah handoff selesai, mode bot/human jelas.

---

## 18. Complaint Observability

Complaint harus dapat ditelusuri ke order/customer/conversation.

### Required Logs

| Event | Required Fields |
|---|---|
| `complaint.created` | `complaint_id`, `order_id`, `customer_id`, `category` |
| `complaint.updated` | `complaint_id`, `old_status`, `new_status`, `updated_by` |
| `complaint.handoff_requested` | `complaint_id`, `handoff_session_id` |

### Checklist

- [ ] Complaint memiliki `complaint_id`.
- [ ] Complaint bisa dikaitkan ke order jika tersedia.
- [ ] Complaint tanpa order tetap bisa dicatat jika valid.
- [ ] Complaint category tercatat.
- [ ] Complaint dapat memicu handoff.
- [ ] Complaint status transition tercatat.

---

## 19. Error Handling Observability

Error harus punya informasi cukup untuk debugging tanpa membuka data sensitif.

### Required Error Fields

| Field | Description |
|---|---|
| `error_code` | Stable code, contoh: `PAYMENT_WEBHOOK_SIGNATURE_INVALID` |
| `error_message` | Human-readable safe message |
| `error_type` | validation, network, timeout, auth, system, business_rule |
| `retryable` | true/false |
| `correlation_id` | Link ke flow utama |
| `service` | Service yang menghasilkan error |
| `operation` | Operasi yang gagal |
| `context` | Context bisnis yang sudah disanitasi |

### Checklist

- [ ] Error memiliki stable error code.
- [ ] Error memiliki correlation ID.
- [ ] Error tidak menyimpan secret.
- [ ] Error membedakan retryable dan non-retryable.
- [ ] Error yang terlihat ke customer memakai pesan aman.
- [ ] Internal error tidak ditampilkan mentah ke customer.
- [ ] Timeout tercatat.
- [ ] Retry attempt tercatat.
- [ ] Circuit breaker event tercatat jika digunakan.

---

## 20. Metrics Checklist

Selain log, alpha perlu metrik sederhana.

### Core Metrics

| Metric | Description |
|---|---|
| `messages_received_total` | Jumlah pesan masuk |
| `bot_responses_total` | Jumlah response bot |
| `intent_detection_success_rate` | Persentase intent terdeteksi dengan benar |
| `tool_call_success_rate` | Persentase tool call sukses |
| `checkout_started_total` | Jumlah checkout dimulai |
| `orders_created_total` | Jumlah order dibuat |
| `payment_sessions_created_total` | Jumlah payment link dibuat |
| `payments_paid_total` | Jumlah payment sukses |
| `webhooks_received_total` | Jumlah webhook diterima |
| `webhook_duplicates_total` | Jumlah duplicate webhook |
| `handoffs_triggered_total` | Jumlah human handoff |
| `scope_rejections_total` | Jumlah out-of-scope ditolak |
| `critical_errors_total` | Jumlah error critical |

### Latency Metrics

| Metric | Description |
|---|---|
| `bot_response_latency_ms` | Waktu dari pesan masuk ke response bot |
| `tool_call_latency_ms` | Waktu eksekusi tool |
| `checkout_latency_ms` | Waktu proses checkout |
| `payment_session_creation_latency_ms` | Waktu membuat payment session |
| `webhook_processing_latency_ms` | Waktu memproses webhook |

### Checklist

- [ ] Jumlah order dibuat dapat dipantau.
- [ ] Jumlah payment sukses dapat dipantau.
- [ ] Jumlah webhook duplicate dapat dipantau.
- [ ] Error rate dapat dipantau.
- [ ] Bot response latency dapat dipantau.
- [ ] Tool call failure rate dapat dipantau.
- [ ] Handoff rate dapat dipantau.
- [ ] Scope rejection rate dapat dipantau.

---

## 21. Dashboard Checklist

Untuk alpha, dashboard sederhana sudah cukup. Tidak harus production-grade.

### Minimum Dashboard Cards

- [ ] Total messages received.
- [ ] Total conversations started.
- [ ] Total carts created.
- [ ] Total checkout started.
- [ ] Total orders created.
- [ ] Total payment sessions created.
- [ ] Total paid payments.
- [ ] Total failed payments.
- [ ] Total webhook received.
- [ ] Total duplicate webhook.
- [ ] Total handoff triggered.
- [ ] Total scope rejection.
- [ ] Total critical errors.

### Useful Filters

- [ ] Time range.
- [ ] Channel.
- [ ] Outlet.
- [ ] Order status.
- [ ] Payment status.
- [ ] Error code.
- [ ] Correlation ID.

---

## 22. Alerting Checklist

Untuk alpha internal, alert bisa sederhana melalui log dashboard, Discord, Telegram, Slack, atau email internal.

### Recommended Alpha Alerts

| Alert | Severity |
|---|---|
| Payment webhook verification failed repeatedly | Critical |
| Payment paid but order remains unpaid | Critical |
| Order created without payment record | Critical |
| Duplicate order detected | Critical |
| Order total and payment amount mismatch | Critical |
| Order assigned to invalid outlet | Critical |
| Bot calls unauthorized tool | High |
| Scope guard bypass detected | High |
| Tool call failure rate high | High |
| Bot response latency too high | Medium |
| Handoff failed | High |

### Checklist

- [ ] Critical payment mismatch memicu alert.
- [ ] Duplicate order memicu alert.
- [ ] Webhook repeated failure memicu alert.
- [ ] Unauthorized tool call memicu alert.
- [ ] Scope guard bypass memicu alert.
- [ ] Handoff failure memicu alert.

---

## 23. Data Privacy & Redaction Checklist

Observability tidak boleh menjadi sumber kebocoran data.

### Do Not Log

- API key.
- Access token.
- Refresh token.
- Authorization header.
- Payment secret.
- Webhook secret.
- Raw signature secret.
- Full phone number jika tidak perlu.
- Full address customer.
- Data pembayaran sensitif.
- Prompt internal yang memuat policy/security detail.

### Recommended Masking

| Data | Example Masking |
|---|---|
| Phone number | `+62******1234` |
| Email | `r***@example.com` |
| Customer name | Initial or customer ID |
| Token | `tok_****last4` |
| Signature | Store validation result only |

### Checklist

- [ ] Secret tidak pernah masuk log.
- [ ] Token tidak pernah masuk log.
- [ ] Data customer dimasking.
- [ ] Webhook signature raw tidak disimpan.
- [ ] Log bisa dibagikan untuk debugging tanpa membocorkan data sensitif.
- [ ] Attachment/screenshot tester tidak memuat data real customer.

---

## 24. Retention Checklist

Untuk alpha, log tidak perlu disimpan terlalu lama.

| Data Type | Suggested Retention |
|---|---:|
| Application logs | 14–30 days |
| Error logs | 30–60 days |
| Payment/webhook audit logs | 90 days |
| Conversation test logs | 30–90 days |
| Tester screenshots | Until alpha report finalized |

Checklist:

- [ ] Retention log sudah disepakati.
- [ ] Test data dapat dihapus/reset setelah alpha.
- [ ] Data customer real tidak digunakan kecuali disetujui.
- [ ] Log lama dapat dibersihkan dengan aman.

---

## 25. Alpha Debugging Workflow

Gunakan alur ini saat bug ditemukan.

```text
1. Tester menemukan bug.
2. Tester mencatat channel, outlet, skenario, dan waktu kejadian.
3. Tester mengambil screenshot/video jika perlu.
4. Tester mengambil conversation ID/order ID/payment ID jika tersedia.
5. Developer mencari log berdasarkan correlation ID.
6. Developer cek conversation logs.
7. Developer cek AI route dan tool-call logs.
8. Developer cek cart/order/payment/webhook logs.
9. Developer menentukan root cause.
10. Bug diperbaiki.
11. Test case diulang.
12. Bug ditutup jika expected result sudah sesuai.
```

Checklist:

- [ ] Tester tahu cara menemukan ID penting.
- [ ] Developer tahu cara mencari log berdasarkan ID.
- [ ] Bug report selalu menyertakan waktu kejadian.
- [ ] Root cause ditulis saat bug ditutup.
- [ ] Retest result dicatat.

---

## 26. Smoke Test Observability Checklist

Setelah deploy alpha build baru, jalankan smoke test dan pastikan log muncul.

| Smoke Test | Expected Observability |
|---|---|
| Kirim pesan sapaan | `message.received`, `ai.intent.detected`, `message.sent` |
| Lihat produk | `product.listed`, `ai.tool.succeeded` |
| Pilih outlet | `outlet.selected` |
| Tambah item ke cart | `cart.item.added`, `pricing.calculated` |
| Checkout | `checkout.started`, `checkout.confirmed` |
| Order dibuat | `order.created` |
| Payment link dibuat | `payment.session.created` |
| Webhook test diterima | `webhook.received`, `webhook.verified`, `webhook.processed` |
| Payment paid | `payment.status.updated`, `order.updated` |
| Minta handoff | `handoff.triggered` |
| Out-of-scope message | `security.out_of_scope.detected`, `ai.scope.rejected` |

---

## 27. Go / No-Go Observability Criteria

Alpha testing sebaiknya tidak dimulai jika observability minimum belum siap.

### Go Criteria

- [ ] Log conversation tersedia.
- [ ] Log AI intent/route tersedia.
- [ ] Log tool call tersedia.
- [ ] Log cart/order/payment tersedia.
- [ ] Log webhook tersedia.
- [ ] Correlation ID tersedia di flow utama.
- [ ] Error log memiliki error code.
- [ ] Critical payment/order mismatch bisa dideteksi.
- [ ] Tester tahu cara melaporkan ID penting.

### No-Go Criteria

- [ ] Tidak ada cara menelusuri order dari conversation.
- [ ] Tidak ada log webhook.
- [ ] Tidak ada idempotency log untuk webhook.
- [ ] Payment status bisa berubah tanpa audit source.
- [ ] Error hanya muncul sebagai generic 500 tanpa context.
- [ ] Log menyimpan secret atau token.
- [ ] Duplicate order tidak bisa dideteksi.

---

## 28. Alpha Observability Sign-Off

Gunakan checklist ini sebelum testing dimulai.

| Area | Ready? | Notes |
|---|---|---|
| Correlation ID | [ ] Yes / [ ] No |  |
| Conversation Logs | [ ] Yes / [ ] No |  |
| AI Intent/Route Logs | [ ] Yes / [ ] No |  |
| Scope Guard Logs | [ ] Yes / [ ] No |  |
| Tool Call Logs | [ ] Yes / [ ] No |  |
| Outlet Logs | [ ] Yes / [ ] No |  |
| Product/Pricing Logs | [ ] Yes / [ ] No |  |
| Cart Logs | [ ] Yes / [ ] No |  |
| Checkout Logs | [ ] Yes / [ ] No |  |
| Order Logs | [ ] Yes / [ ] No |  |
| Payment Logs | [ ] Yes / [ ] No |  |
| Webhook Logs | [ ] Yes / [ ] No |  |
| Handoff Logs | [ ] Yes / [ ] No |  |
| Complaint Logs | [ ] Yes / [ ] No |  |
| Error Codes | [ ] Yes / [ ] No |  |
| Dashboard | [ ] Yes / [ ] No |  |
| Alerts | [ ] Yes / [ ] No |  |
| Data Masking | [ ] Yes / [ ] No |  |

Prepared by:  
Reviewed by:  
Approved for Alpha: [ ] Yes / [ ] No  
Date:

---

## 29. Related Documents

- `00-alpha-overview.md`
- `01-scope.md`
- `02-test-plan.md`
- `03-test-scenarios.md`
- `04-test-data.md`
- `05-tester-guide.md`
- `06-bug-report-template.md`
- `08-known-issues.md`
- `09-incident-rollback.md`
- `10-exit-criteria.md`

---

## 30. Notes

Observability untuk alpha tidak harus sempurna, tetapi harus cukup untuk melacak flow kritis berikut:

```text
Customer Message
→ Intent / Scope Guard
→ Tool Call
→ Outlet Selection
→ Cart
→ Checkout
→ Order
→ Payment Session
→ Webhook
→ Payment Status
→ Order Status
→ Pickup / Handoff / Complaint
```

Jika flow di atas tidak bisa ditelusuri, bug alpha akan sulit diperbaiki dan risiko transaksi salah akan meningkat.
