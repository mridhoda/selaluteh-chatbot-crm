Siap Rido, kita lanjut 🔥

# Phase 3.6.4 — Background Workers & Scheduler

## Objective

Mendesain arsitektur **background jobs, scheduler, queue, retry, dan asynchronous processing** untuk backend SELKOP.

Phase ini memastikan proses yang tidak perlu berjalan langsung di HTTP request bisa diproses secara aman, idempotent, terpantau, dan scalable.

Contoh proses yang cocok masuk background worker:

```text
Expire QR Session
Expire Checkout Session
Expire Payment
Payment Reconciliation
Webhook Retry
Notification Retry
Analytics Aggregation
Cache Invalidation
Housekeeping Cleanup
Provider Health Check
```

---

# Deliverable

```text
03.6.4-background-workers-scheduler.md
```

---

# 1. Background Worker Principles

Prinsip utama:

```text
HTTP request harus cepat.

Proses berat dipindahkan ke worker.

Worker harus idempotent.

Worker tidak boleh melanggar state machine.

Worker tidak boleh bypass service layer.

Worker wajib audit untuk perubahan penting.

Worker wajib observable.
```

Worker tetap harus mengikuti:

```text
Domain Invariants
State Machine
Service Contracts
Security Rules
Transaction Boundaries
```

---

# 2. Scheduler vs Queue Worker

Kita bedakan dua konsep.

## Scheduler

Scheduler bertugas **memicu pekerjaan berdasarkan waktu**.

Contoh:

```text
Setiap 1 menit:
- cari checkout expired

Setiap 5 menit:
- reconcile pending payment

Setiap 1 jam:
- aggregate analytics

Setiap malam:
- cleanup old sessions
```

## Queue Worker

Queue worker bertugas **memproses job yang sudah masuk queue**.

Contoh:

```text
SendNotificationJob
ProcessWebhookJob
UpdateAnalyticsJob
ExpireCheckoutJob
```

---

# 3. Architecture Overview

Diagram konsep:

```text
Scheduler
    │
    ▼
Job Queue
    │
    ▼
Worker
    │
    ▼
Application Service
    │
    ▼
Repository
    │
    ▼
Database
```

Rule penting:

```text
Worker tidak langsung update database bebas.

Worker tetap memanggil Service.
```

Contoh benar:

```text
PaymentExpiryWorker
      │
      ▼
PaymentService.expirePayment()
```

Contoh salah:

```text
PaymentExpiryWorker
      │
      ▼
UPDATE payments SET status = 'expired'
```

---

# 4. Background Job Categories

## 4.1 Time-Based Jobs

Job yang berjalan berdasarkan waktu.

Contoh:

```text
ExpireCheckoutSessions
ExpireQRSessions
ExpirePendingPayments
CleanupIdempotencyKeys
CleanupOldWebhookEvents
```

---

## 4.2 Event-Based Jobs

Job yang muncul karena event bisnis.

Contoh:

```text
PaymentSucceeded
      ↓
SendPaymentSuccessNotification

OrderReady
      ↓
SendOrderReadyNotification

QRCodeScanned
      ↓
TrackQRAnalytics
```

---

## 4.3 Provider-Based Jobs

Job yang berhubungan dengan external provider.

Contoh:

```text
PaymentReconciliation
WebhookRetry
ProviderHealthCheck
RefundStatusCheck
```

---

## 4.4 Analytics Jobs

Job untuk laporan dan agregasi.

Contoh:

```text
QRConversionAggregation
DailySalesAggregation
OutletPerformanceAggregation
ProductSalesAggregation
```

---

# 5. Core Worker List

Untuk alpha, minimal worker yang perlu disiapkan:

```text
ExpireCheckoutSessionWorker
ExpireQRSessionWorker
ExpirePaymentWorker
PaymentReconciliationWorker
WebhookEventProcessorWorker
NotificationRetryWorker
AnalyticsAggregationWorker
CleanupWorker
```

---

# 6. Job Schedule Matrix

| Job                       |       Frequency | Priority | Purpose                                     |
| ------------------------- | --------------: | -------: | ------------------------------------------- |
| Expire Checkout Sessions  |  Every 1 minute |     High | Expire checkout yang melewati TTL           |
| Expire QR Sessions        | Every 5 minutes |   Medium | Expire QR session yang tidak aktif          |
| Expire Pending Payments   |  Every 1 minute |     High | Expire payment melewati `expires_at`        |
| Payment Reconciliation    | Every 5 minutes |     High | Sinkronisasi status payment dengan provider |
| Webhook Event Processor   |  Near real-time |     High | Proses webhook provider                     |
| Notification Retry        | Every 2 minutes |   Medium | Kirim ulang notifikasi gagal                |
| Analytics Aggregation     |  Hourly / Daily |      Low | Aggregate dashboard data                    |
| Cleanup Idempotency Keys  |          Hourly |      Low | Hapus key expired                           |
| Cleanup Checkout Sessions |           Daily |      Low | Housekeeping data lama                      |
| Provider Health Check     | Every 5 minutes |   Medium | Cek provider availability                   |

---

# 7. Checkout Expiry Worker

## Purpose

Menandai checkout session yang sudah lewat masa aktif.

Flow:

```text
Find checkout_sessions
where status in ('draft', 'validated')
and expires_at < now()

↓

CheckoutService.expireCheckout()

↓

Update checkout status

↓

Audit / event
```

Rule:

```text
Checkout yang sudah converted menjadi order tidak boleh di-expire.
```

---

# 8. QR Session Expiry Worker

## Purpose

Menutup QR session yang sudah melewati TTL.

Flow:

```text
Find qr_sessions
where status = active
and expires_at < now()

↓

QrSessionService.expireSession()

↓

Mark expired

↓

Track analytics
```

Rule:

```text
QR Session expired tidak boleh digunakan untuk checkout baru.
```

---

# 9. Payment Expiry Worker

## Purpose

Menandai payment pending yang sudah melewati `expires_at`.

Flow:

```text
Find payments
where status in ('pending', 'processing')
and expires_at < now()

↓

Optional provider status check

↓

PaymentService.expirePayment()

↓

Order public status becomes payment_expired
```

Rule penting:

```text
Worker tidak boleh mengubah payment menjadi paid.

Paid hanya dari webhook valid atau provider verification.
```

---

# 10. Payment Reconciliation Worker

## Purpose

Menangani kasus webhook telat, hilang, atau gagal.

Flow:

```text
Find payments
where status in ('pending', 'processing')
and created_at within reconciliation window

↓

PaymentProviderService.queryPayment()

↓

Adapter.getPaymentStatus()

↓

Normalize provider status

↓

Apply payment state transition
```

Use case:

```text
Customer sudah bayar tapi webhook tidak masuk.

Provider timeout saat callback.

Webhook duplicate gagal diproses.

Payment status stuck pending.
```

Rule:

```text
Jika provider bilang paid tapi amount/currency mismatch → manual_review.
```

---

# 11. Webhook Event Processor Worker

## Purpose

Memproses webhook secara aman dan idempotent.

Flow:

```text
Webhook received

↓

Verify signature

↓

Store raw event / payload hash

↓

Queue ProcessWebhookEventJob

↓

Worker parse payload

↓

Normalize status

↓

Apply payment transition

↓

Publish domain event
```

Rule:

```text
Webhook controller sebaiknya cepat.

Processing berat dilakukan oleh worker.
```

Duplicate webhook:

```text
provider_event_id sama
+
provider_reference sama

↓

ignored safely
```

---

# 12. Notification Retry Worker

## Purpose

Mengirim ulang notifikasi yang gagal.

Contoh notifikasi:

```text
Payment success
Order accepted
Order ready
Order completed
Payment failed
```

Flow:

```text
Find failed notification jobs

↓

Retry with backoff

↓

Mark sent / failed permanently
```

Rule:

```text
Notification failure tidak boleh menggagalkan order.
```

---

# 13. Analytics Aggregation Worker

## Purpose

Membuat data dashboard lebih cepat dibaca.

Aggregate:

```text
QR scans
QR conversion
Outlet sales
Payment success rate
Product sales
Peak hour
Checkout drop-off
```

Flow:

```text
Read immutable event/order/payment data

↓

Aggregate into analytics tables

↓

Store daily/hourly summary
```

Rule:

```text
Analytics worker tidak boleh mengubah order/payment business state.
```

---

# 14. Cleanup Worker

## Purpose

Membersihkan data temporary yang sudah lewat retention.

Target cleanup:

```text
Expired checkout sessions
Expired QR sessions
Expired idempotency keys
Old security events
Old webhook raw payload refs
Temporary cache entries
```

Rule:

```text
Tidak boleh hard delete orders, payments, audit_logs, payment_history, order_history.
```

---

# 15. Provider Health Check Worker

## Purpose

Memantau apakah provider aktif seperti BayarGG sedang sehat.

Flow:

```text
Every 5 minutes

↓

PaymentProviderService.checkHealth()

↓

Adapter.healthCheck()

↓

Record provider health status

↓

Alert if degraded
```

Status provider:

```text
healthy
degraded
down
unknown
```

Use case:

```text
BayarGG timeout

BayarGG API down

Webhook endpoint bermasalah

Create payment gagal berulang
```

---

# 16. Job Payload Contract

Setiap job harus punya payload standar.

Contoh:

```json
{
  "job_id": "uuid",
  "job_type": "payment.reconcile",
  "workspace_id": "uuid",
  "entity_id": "payment_id",
  "attempt": 1,
  "created_at": "timestamp",
  "scheduled_at": "timestamp",
  "metadata": {}
}
```

Rule:

```text
Payload jangan terlalu besar.

Simpan ID entity saja.

Worker ambil data terbaru dari database.
```

---

# 17. Job Idempotency

Semua job penting harus aman jika dijalankan lebih dari sekali.

Contoh:

```text
ExpirePaymentJob dijalankan 3 kali

↓

Payment tetap expired sekali

↓

History tidak duplicate

↓

Audit tidak duplicate
```

Gunakan kombinasi:

```text
job_id
idempotency_key
entity_id
current_status check
unique event key
```

---

# 18. Retry Strategy

Default retry:

| Job Type               |                    Retry | Backoff     |
| ---------------------- | -----------------------: | ----------- |
| Webhook Processing     |                       5x | Exponential |
| Payment Reconciliation |                       3x | Exponential |
| Notification           |                       5x | Exponential |
| Analytics              |                       3x | Linear      |
| Cleanup                |                     1–3x | Linear      |
| Provider Health Check  | No retry / next schedule | Scheduled   |

Contoh backoff:

```text
1st retry: 30 seconds
2nd retry: 2 minutes
3rd retry: 5 minutes
4th retry: 15 minutes
5th retry: 30 minutes
```

---

# 19. Dead Letter Queue

Job yang gagal terus masuk ke:

```text
dead_letter_jobs
```

Isi minimal:

```text
job_id
job_type
workspace_id
entity_type
entity_id
last_error_code
last_error_message
attempt_count
payload_json
failed_at
resolved_at
```

Admin/internal tool bisa melihat:

```text
Failed webhook processing
Failed notification
Failed reconciliation
Provider error
```

---

# 20. Locking & Concurrency

Worker bisa berjalan paralel, jadi harus ada locking.

Strategi:

```text
SELECT ... FOR UPDATE SKIP LOCKED

Advisory lock

Unique processing key

Job status lock

Distributed lock bila multi-instance
```

Rule:

```text
Satu payment tidak boleh direconcile oleh dua worker bersamaan.

Satu checkout tidak boleh di-expire dua worker bersamaan.

Satu webhook event tidak boleh diproses dua kali.
```

---

# 21. Transaction Boundaries

Worker harus jelas kapan memakai transaction.

Contoh Payment Reconciliation:

```text
Begin transaction

↓

Lock payment row

↓

Validate current status

↓

Apply transition

↓

Insert payment_status_history

↓

Insert audit_log

↓

Commit

↓

Publish notification event
```

Rule:

```text
External provider call dilakukan sebelum transaction atau di luar transaction.

Database transaction jangan menunggu external API.
```

---

# 22. Worker Observability

Setiap worker harus punya log dan metrics.

Minimal log:

```text
job_id
job_type
workspace_id
entity_id
attempt
duration_ms
status
error_code
```

Metrics:

```text
jobs_processed_total
jobs_failed_total
job_duration_ms
retry_count
dead_letter_count
queue_lag_seconds
worker_heartbeat
```

---

# 23. Worker Security

Worker hanya boleh berjalan dari trusted runtime.

Rule:

```text
Worker tidak memiliki public endpoint.

Worker memakai service account internal.

Worker tetap enforce workspace scope.

Worker tidak boleh expose secret di log.

Worker tidak boleh mencetak raw webhook secret.
```

---

# 24. Suggested Tables

Kalau queue belum memakai managed queue seperti Redis/BullMQ/SQS, bisa mulai dengan DB-backed jobs.

Minimal table:

```text
background_jobs
dead_letter_jobs
worker_heartbeats
provider_health_checks
notification_jobs
analytics_snapshots
```

Untuk alpha, boleh mulai sederhana:

```text
background_jobs
dead_letter_jobs
worker_heartbeats
```

---

# 25. Recommended Queue Technology

Untuk MVP/alpha:

```text
Postgres job queue
atau
BullMQ + Redis
```

Untuk scale lebih besar:

```text
RabbitMQ
Google Pub/Sub
AWS SQS
Kafka
Redis Streams
```

Rekomendasi praktis:

```text
Alpha:
Postgres-based scheduler + simple worker

Growth:
BullMQ + Redis

Scale:
Dedicated message broker
```

---

# 26. Worker Ownership Matrix

| Worker                      | Owner Service          |
| --------------------------- | ---------------------- |
| ExpireCheckoutSessionWorker | CheckoutService        |
| ExpireQRSessionWorker       | QrSessionService       |
| ExpirePaymentWorker         | PaymentService         |
| PaymentReconciliationWorker | PaymentProviderService |
| WebhookEventProcessorWorker | PaymentProviderService |
| NotificationRetryWorker     | NotificationService    |
| AnalyticsAggregationWorker  | AnalyticsService       |
| CleanupWorker               | HousekeepingService    |
| ProviderHealthCheckWorker   | PaymentProviderService |

---

# 27. Alpha Readiness Worker Checklist

Untuk alpha testing, minimal harus selesai:

```text
☐ Expire checkout session

☐ Expire QR session

☐ Expire pending payment

☐ Payment reconciliation

☐ Webhook processing idempotent

☐ Notification retry basic

☐ Dead letter handling basic

☐ Worker logs

☐ Worker retry strategy

☐ Worker locking

☐ Manual review on payment mismatch

☐ No worker bypass state machine
```

---

# 28. Implementation Checklist

```text
☐ Scheduler architecture defined

☐ Queue worker architecture defined

☐ Job payload contract defined

☐ Retry strategy defined

☐ Dead letter queue defined

☐ Worker ownership matrix defined

☐ Payment reconciliation worker defined

☐ Expiry workers defined

☐ Webhook processor worker defined

☐ Notification retry worker defined

☐ Analytics aggregation worker defined

☐ Cleanup worker defined

☐ Locking strategy defined

☐ Observability metrics defined

☐ Security rules defined
```

---

# Output Akhir Phase 3.6.4

Dokumen ini menjadi blueprint untuk seluruh proses asynchronous SELKOP.

```text
Phase 3.6.1
Service Contracts
      │
      ▼
Phase 3.6.2
Repository Architecture
      │
      ▼
Phase 3.6.3
External Provider Architecture
      │
      ▼
=============================
Phase 3.6.4
BACKGROUND WORKERS & SCHEDULER
=============================
      │
      ▼
Phase 3.7
REST API Architecture
```

Dengan Phase 3.6.4 ini, backend SELKOP tidak hanya bisa menerima order, tetapi juga bisa **menjaga sistem tetap sehat**: payment tidak stuck, checkout tidak menggantung, QR session tidak bocor, webhook aman, dan semua proses penting tetap bisa dipulihkan saat terjadi error. 🚀
