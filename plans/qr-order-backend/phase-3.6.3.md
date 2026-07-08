Siap, Rido. Kita lanjut ke **Phase 3.6.3** ✅
Dengan asumsi roadmap kita tetap:

```text
Phase 3.6.1
Service Contracts

↓

Phase 3.6.2
Repository Architecture

↓

Phase 3.6.3
External Provider Architecture
```

---

# Phase 3.6.3 — External Provider Architecture

## Objective

Mendesain arsitektur integrasi external provider agar sistem SELKOP tidak bergantung pada satu vendor tertentu.

Untuk saat ini provider aktif adalah:

```text
BayarGG
```

Tetapi arsitektur harus tetap siap untuk:

```text
Midtrans
Xendit
Manual Transfer
Future Payment Provider
```

Prinsip utamanya:

> Backend SELKOP tidak boleh hardcode ke BayarGG.
> BayarGG hanya salah satu adapter dari interface payment provider.

---

# Deliverable

```text
03.6.3-external-provider-architecture.md
```

---

# 1. External Provider Scope

Phase ini membahas integrasi external provider, terutama:

```text
Payment Provider
Webhook Provider
Payment Status Verification
Refund Provider
Future Notification Provider
Future Delivery Provider
```

Untuk alpha, fokus utama:

```text
Payment Provider Architecture
BayarGG Adapter
Webhook Verification
Payment Reconciliation
Provider Config
```

---

# 2. Provider-Agnostic Principle

Sistem tidak boleh menyimpan field seperti:

```text
bayargg_invoice_id
xendit_invoice_id
midtrans_token
```

Gunakan field netral:

```text
provider_payment_id
provider_reference
provider_checkout_url
provider_raw_status
provider_metadata_json
```

Dengan prinsip ini, sistem bisa mengganti provider tanpa mengubah struktur utama order/payment.

---

# 3. Provider Architecture Overview

Diagram konsep:

```text
CheckoutService
      │
      ▼
PaymentProviderService
      │
      ▼
PaymentProviderResolver
      │
      ▼
PaymentAdapter Interface
      │
      ├── BayarGGAdapter
      ├── MidtransAdapter
      ├── XenditAdapter
      └── ManualTransferAdapter
```

---

# 4. PaymentProviderService

Service ini adalah orchestrator utama.

Tanggung jawab:

```text
Resolve active provider
Create payment
Verify provider response
Normalize provider status
Handle webhook
Trigger payment state transition
Record payment events
```

Service ini **tidak tahu detail API BayarGG**.

Dia hanya berbicara ke adapter melalui interface.

---

# 5. PaymentProviderResolver

Bertugas memilih provider aktif berdasarkan:

```text
workspace_id
mode
provider setting
payment method
capability
```

Contoh rule:

```text
workspace = SELKOP
mode = sandbox
active provider = BayarGG
method = QRIS
```

Maka resolver memilih:

```text
BayarGGAdapter
```

---

# 6. Payment Adapter Interface

Semua provider wajib mengikuti kontrak yang sama.

Contoh interface konseptual:

```ts
interface PaymentAdapter {
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;

  verifyWebhook(input: VerifyWebhookInput): Promise<WebhookVerificationResult>;

  parseWebhook(input: ParseWebhookInput): Promise<NormalizedPaymentEvent>;

  getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusResult>;

  cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentResult>;

  refundPayment(input: RefundPaymentInput): Promise<RefundPaymentResult>;
}
```

Untuk alpha, minimal:

```text
createPayment
verifyWebhook
parseWebhook
getPaymentStatus
```

---

# 7. BayarGG Adapter

BayarGG Adapter adalah implementasi konkret.

Tanggung jawab:

```text
Build BayarGG payment request
Call BayarGG API
Parse BayarGG response
Verify BayarGG webhook signature
Map BayarGG status to internal status
Handle BayarGG error format
```

BayarGG Adapter tidak boleh:

```text
Update order status langsung
Mark payment paid langsung tanpa PaymentProviderService
Mengakses OrderRepository langsung
Mengubah fulfillment status
```

---

# 8. Provider Capability Matrix

Setiap provider punya kemampuan berbeda.

Contoh:

| Provider        | QRIS | VA | E-Wallet | Card |   Refund | Webhook |
| --------------- | ---: | -: | -------: | ---: | -------: | ------: |
| BayarGG         |    ✅ |  ✅ |        ✅ |    ❌ | Optional |       ✅ |
| Midtrans        |    ✅ |  ✅ |        ✅ |    ✅ |        ✅ |       ✅ |
| Xendit          |    ✅ |  ✅ |        ✅ |    ✅ |        ✅ |       ✅ |
| Manual Transfer |    ❌ |  ✅ |        ❌ |    ❌ |   Manual |       ❌ |

Backend harus mengecek capability sebelum membuat payment.

---

# 9. Provider Configuration

Provider config disimpan di:

```text
payment_providers
payment_provider_settings
```

Contoh setting aktif:

```json
{
  "provider": "bayargg",
  "mode": "sandbox",
  "is_active": true,
  "payment_expiry_minutes": 15,
  "enabled_methods": ["qris", "ewallet", "virtual_account"]
}
```

Rule penting:

```text
Hanya satu active provider per workspace per mode.
```

---

# 10. Secret Management

Secret tidak boleh disimpan plain text di database.

Gunakan:

```text
secret_key_ref
webhook_secret_ref
api_key_ref
```

Contoh:

```text
secret://selkop/bayargg/sandbox/secret_key
secret://selkop/bayargg/sandbox/webhook_secret
```

Backend mengambil secret dari:

```text
Environment Variables
Secret Manager
Vault
Runtime Config
```

---

# 11. Create Payment Flow

Flow checkout ke provider:

```text
CheckoutService
      │
      ▼
Create order + payment record
      │
      ▼
Commit DB transaction
      │
      ▼
PaymentProviderService.createPayment()
      │
      ▼
Resolve active provider
      │
      ▼
BayarGGAdapter.createPayment()
      │
      ▼
Update payment with provider_reference + payment_url
```

Important rule:

```text
External API call tidak dilakukan di tengah database transaction.
```

---

# 12. Webhook Flow

Webhook tidak boleh dipercaya sebelum diverifikasi.

```text
BayarGG Webhook
      │
      ▼
Webhook Controller
      │
      ▼
SecurityService.verifySignature()
      │
      ▼
PaymentProviderService.handleWebhook()
      │
      ▼
BayarGGAdapter.parseWebhook()
      │
      ▼
Normalize status
      │
      ▼
Update payment
      │
      ▼
Publish PaymentSucceeded / PaymentFailed / PaymentExpired
```

---

# 13. Status Normalization

Provider status harus dipetakan ke internal status.

Contoh:

```text
BayarGG: PAID
        ↓
Internal: paid

BayarGG: PENDING
        ↓
Internal: pending

BayarGG: EXPIRED
        ↓
Internal: expired

BayarGG: FAILED
        ↓
Internal: failed
```

Semua provider wajib masuk ke enum internal:

```text
unpaid
pending
processing
paid
failed
expired
refunded
cancelled
manual_review
```

---

# 14. Webhook Idempotency

Webhook bisa datang berkali-kali.

Maka wajib idempotent.

Rule:

```text
Same provider_event_id
+
same provider_reference
=
process once
```

Jika webhook duplicate:

```text
Return success response
Do not update payment again
Do not duplicate event
Do not duplicate audit log
```

---

# 15. Payment Reconciliation

Selain webhook, sistem perlu bisa melakukan pengecekan status manual/periodic.

Flow:

```text
Pending payment
      │
      ▼
Scheduler
      │
      ▼
PaymentProviderService.queryPayment()
      │
      ▼
Adapter.getPaymentStatus()
      │
      ▼
Update internal status if changed
```

Use case:

```text
Webhook telat
Webhook gagal
Provider timeout
Customer sudah bayar tapi status belum update
```

---

# 16. Error Handling

External provider error harus dinormalisasi.

Kategori error:

```text
ProviderUnavailable
ProviderTimeout
ProviderInvalidResponse
ProviderUnauthorized
ProviderRateLimited
ProviderPaymentRejected
ProviderSignatureInvalid
ProviderAmountMismatch
ProviderReferenceNotFound
```

Frontend tidak melihat raw error provider.

Frontend hanya menerima error yang aman:

```text
PAYMENT_PROVIDER_UNAVAILABLE
PAYMENT_CREATION_FAILED
PAYMENT_STATUS_UNKNOWN
PAYMENT_EXPIRED
```

---

# 17. Manual Review Rules

Payment masuk `manual_review` jika:

```text
Amount mismatch
Currency mismatch
Unknown provider reference
Invalid status transition
Duplicate suspicious webhook
Signature valid but payload inconsistent
Provider says paid but order amount different
```

Manual review harus membuat:

```text
security_event
audit_log
payment_status_history
```

---

# 18. Refund Architecture

Untuk alpha, refund bisa belum aktif.

Tapi interface tetap disiapkan:

```text
refundPayment()
```

Internal status:

```text
paid
  ↓
refunded
```

Refund tidak boleh langsung menghapus order.

Refund harus menghasilkan:

```text
PaymentRefundRequested
PaymentRefunded
AuditLog
```

---

# 19. Provider Switching

Admin bisa mengganti active provider melalui Settings.

Rule:

```text
Provider switch requires permission settings.payment.manage
Provider switch creates audit log
Existing payments tetap memakai provider lama
New payments memakai provider baru
```

Order/payment lama tidak boleh dimigrasikan otomatis.

---

# 20. Observability

Semua provider call harus bisa dilacak.

Minimal log:

```text
provider_code
workspace_id
payment_id
order_id
request_id
provider_reference
duration_ms
status
error_code
```

Jangan log:

```text
secret key
webhook secret
full raw customer sensitive data
```

---

# 21. Testing Strategy

Wajib ada test untuk:

```text
BayarGG create payment success
BayarGG create payment failed
Webhook signature valid
Webhook signature invalid
Duplicate webhook
Amount mismatch
Provider timeout
Payment expired
Payment paid
Payment reconciliation
Provider switching
```

Gunakan:

```text
FakePaymentAdapter
BayarGGSandboxAdapter
Webhook fixture payload
```

---

# 22. Future Provider Extension

Untuk menambah provider baru:

```text
1. Tambah record payment_providers
2. Buat adapter baru
3. Implement PaymentAdapter interface
4. Tambah status mapper
5. Tambah webhook route
6. Tambah provider capability
7. Tambah integration test
```

Tidak boleh mengubah:

```text
CheckoutService
OrderService
Payment entity core
Frontend checkout flow
```

---

# 23. Implementation Checklist

```text
☐ PaymentAdapter interface dibuat

☐ BayarGGAdapter dibuat

☐ PaymentProviderResolver dibuat

☐ PaymentProviderService dibuat

☐ Provider capability matrix tersedia

☐ Provider settings aktif per workspace/mode

☐ Secret tidak plain text di database

☐ Create payment provider-agnostic

☐ Webhook signature verification

☐ Webhook idempotency

☐ Status normalization

☐ Payment reconciliation

☐ Manual review handling

☐ Provider switching audit log

☐ Error normalization

☐ Integration tests
```

---

# Output Akhir Phase 3.6.3

Dokumen ini akan menjadi blueprint untuk integrasi provider eksternal SELKOP.

```text
Phase 3.6.1
Service Contracts
      │
      ▼
Phase 3.6.2
Repository Architecture
      │
      ▼
=============================
Phase 3.6.3
EXTERNAL PROVIDER ARCHITECTURE
=============================
      │
      ▼
Phase 3.6.4
Background Workers & Scheduler
```

Dengan ini, integrasi BayarGG tetap bisa dibuat cepat untuk alpha, tapi struktur backend tidak terkunci ke BayarGG. Nanti kalau SELKOP mau pindah ke Midtrans, Xendit, atau provider lain, perubahan cukup dilakukan di adapter dan settings, bukan membongkar checkout/order/payment core.
