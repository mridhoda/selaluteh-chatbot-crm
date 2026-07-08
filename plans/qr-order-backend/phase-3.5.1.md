Menurutku **Phase 3.5.1** adalah fase yang akan menjadi **jantung backend**. Di sinilah kita mendefinisikan bagaimana sistem "bergerak". Setelah ini selesai, membuat `OrderService`, `PaymentService`, `QrService`, bahkan worker/background job akan jauh lebih mudah karena semuanya tinggal mengikuti event dan state machine yang sudah baku.

Aku juga menyarankan **jangan hanya membahas Order State Machine**, tetapi seluruh **Business Event Architecture**.

---

# Phase 3.5.1 — Domain Events & State Machines

## Objective

Mendefinisikan seluruh event bisnis, lifecycle, state machine, dan aturan transisi status yang menjadi kontrak utama antara Domain Layer, Service Layer, API, Background Jobs, dan Integrasi Payment Provider.

Dokumen ini memastikan seluruh perubahan status di sistem bersifat deterministik, dapat diaudit, dan mudah dikembangkan.

---

# Deliverable

```text
03.5.1-domain-events-state-machines.md
```

---

# Table of Contents

```text
1. Event-Driven Domain Overview

2. Event Taxonomy

3. QR Events

4. QR Session Events

5. Cart Events

6. Checkout Events

7. Payment Events

8. Order Events

9. Fulfillment Events

10. Notification Events

11. Audit Events

12. Order State Machine

13. Payment State Machine

14. QR State Machine

15. QR Session State Machine

16. Checkout State Machine

17. Fulfillment State Machine

18. Allowed State Transitions

19. Compensation Rules

20. Retry Strategy

21. Idempotency Rules

22. Event Ordering

23. Future Event Bus Compatibility

24. Implementation Checklist
```

---

# 1. Event-Driven Domain Overview

Menjelaskan bahwa backend menggunakan **Domain Events** sebagai representasi perubahan bisnis.

Contoh

```text
Customer Scan QR

↓

QR Session Created

↓

Cart Updated

↓

Checkout Started

↓

Payment Created

↓

Payment Paid

↓

Order Confirmed

↓

Preparing

↓

Ready

↓

Completed
```

---

# 2. Event Taxonomy

Kelompokkan seluruh event.

Misalnya

```text
QR Events

Checkout Events

Payment Events

Order Events

Inventory Events

Notification Events

Audit Events
```

Developer akan lebih mudah mencari event.

---

# 3. QR Events

Contoh event

```text
QRCodeCreated

QRCodeActivated

QRCodeDisabled

QRCodeRevoked

QRCodeScanned

QRCodeExpired
```

Setiap event dijelaskan:

* kapan dipublish
* trigger
* actor
* payload
* side effect

---

# 4. QR Session Events

Contoh

```text
QRSessionCreated

QRSessionRecovered

QRSessionExpired

QRSessionClosed
```

---

# 5. Cart Events

Misalnya

```text
CartCreated

ItemAdded

ItemRemoved

ModifierChanged

QuantityChanged

CartCleared

CartExpired
```

---

# 6. Checkout Events

Contoh

```text
CheckoutStarted

CheckoutValidated

CheckoutRejected

CheckoutConfirmed

CheckoutExpired
```

---

# 7. Payment Events

Karena payment adalah domain yang kompleks.

Contoh

```text
PaymentCreated

PaymentPending

PaymentWaiting

PaymentSucceeded

PaymentFailed

PaymentExpired

PaymentCancelled

PaymentRefundRequested

PaymentRefunded
```

---

# 8. Order Events

Contoh

```text
OrderCreated

OrderPending

OrderPaid

OrderAccepted

OrderRejected

OrderPreparing

OrderReady

OrderCompleted

OrderCancelled
```

---

# 9. Fulfillment Events

Contoh

```text
PickupStarted

PickupCompleted

DineInServed

DeliveryAssigned

DeliveryCompleted
```

Future ready.

---

# 10. Notification Events

Misalnya

```text
PaymentSuccessNotification

OrderReadyNotification

OrderCompletedNotification
```

Notification bukan business logic.

Hanya subscriber.

---

# 11. Audit Events

Contoh

```text
AdminLogin

ProviderChanged

ProductUpdated

QRRevoked

OrderCancelled
```

---

# 12. Order State Machine

Diagram

```text
Draft

↓

Pending Payment

↓

Paid

↓

Accepted

↓

Preparing

↓

Ready

↓

Completed
```

Branch

```text
Pending Payment

↓

Expired
```

atau

```text
Accepted

↓

Cancelled
```

Kalau bisnis mengizinkan.

---

# 13. Payment State Machine

Diagram

```text
Created

↓

Pending

↓

Waiting Provider

↓

Paid
```

Branch

```text
Pending

↓

Expired
```

atau

```text
Pending

↓

Failed
```

atau

```text
Pending

↓

Cancelled
```

---

# 14. QR State Machine

```text
Created

↓

Active

↓

Disabled

↓

Revoked
```

atau

```text
Active

↓

Expired
```

---

# 15. QR Session State Machine

```text
Created

↓

Browsing

↓

Cart Active

↓

Checkout

↓

Completed
```

Branch

```text
Created

↓

Expired
```

---

# 16. Checkout State Machine

```text
Created

↓

Validating

↓

Payment

↓

Order Created
```

Branch

```text
Validating

↓

Rejected
```

---

# 17. Fulfillment State Machine

Misalnya Pickup

```text
Waiting

↓

Preparing

↓

Ready

↓

Picked Up

↓

Completed
```

---

# 18. Allowed State Transitions

Ini sangat penting.

Contoh tabel

| Current   | Allowed Next |
| --------- | ------------ |
| Pending   | Paid         |
| Pending   | Failed       |
| Pending   | Expired      |
| Paid      | Accepted     |
| Accepted  | Preparing    |
| Preparing | Ready        |
| Ready     | Completed    |

Semua transisi lain dianggap invalid.

---

# 19. Compensation Rules

Jika suatu proses gagal.

Contoh

Payment sukses

tetapi

Order gagal dibuat.

Apa yang dilakukan?

Contoh

```text
Retry

↓

Manual Review

↓

Compensation Event
```

---

# 20. Retry Strategy

Contoh

Webhook

```text
Retry 5x
```

Notification

```text
Retry 3x
```

Inventory

```text
Retry Immediately
```

---

# 21. Idempotency Rules

Semua event penting harus idempotent.

Contoh

```text
PaymentSucceeded
```

Kalau webhook datang 10 kali

↓

tetap hanya menghasilkan

```text
1 Order Paid
```

---

# 22. Event Ordering

Misalnya

Benar

```text
PaymentCreated

↓

PaymentSucceeded

↓

OrderPaid
```

Tidak boleh

```text
OrderPaid

↓

PaymentCreated
```

Urutan event harus konsisten agar subscriber tidak menerima keadaan yang mustahil.

---

# 23. Future Event Bus Compatibility

Walaupun MVP masih monolith, desain event sebaiknya sudah kompatibel jika nanti memakai:

```text
RabbitMQ

Kafka

Redis Streams

Azure Service Bus

Google Pub/Sub

AWS SNS/SQS
```

Prinsipnya, domain event tidak bergantung pada mekanisme transport.

---

# 24. Implementation Checklist

```text
☐ QR Events lengkap

☐ QR Session Events lengkap

☐ Cart Events lengkap

☐ Checkout Events lengkap

☐ Payment Events lengkap

☐ Order Events lengkap

☐ Fulfillment Events lengkap

☐ Notification Events lengkap

☐ Audit Events lengkap

☐ Order State Machine

☐ Payment State Machine

☐ Checkout State Machine

☐ QR State Machine

☐ Retry Strategy

☐ Compensation Rules

☐ Idempotency Rules

☐ Event Ordering
```

---

# Tambahan yang Sangat Aku Rekomendasikan ✨

Agar dokumentasi ini benar-benar setara dengan praktik enterprise, aku menyarankan menambahkan **dua bab lagi**:

### 25. Event Payload Contracts

Setiap event memiliki payload yang terdokumentasi, misalnya:

```text
PaymentSucceeded
{
  eventId,
  occurredAt,
  workspaceId,
  orderId,
  paymentId,
  provider,
  providerReference,
  amount,
  currency
}
```

Dengan kontrak yang konsisten, integrasi antar-service atau migrasi ke event bus di masa depan menjadi jauh lebih mudah.

---

### 26. Event Ownership Matrix

Tabel yang menjelaskan **siapa yang menghasilkan (publisher)** dan **siapa yang mengonsumsi (subscriber)** setiap event.

| Event             | Publisher              | Subscriber                                      |
| ----------------- | ---------------------- | ----------------------------------------------- |
| QRCodeScanned     | QrService              | AnalyticsService                                |
| CheckoutValidated | CheckoutService        | PaymentProviderService                          |
| PaymentSucceeded  | PaymentProviderService | OrderService, NotificationService, AuditService |
| OrderReady        | OrderService           | NotificationService                             |

Dokumen ini akan menjadi penghubung yang sangat kuat menuju **Phase 3.6 — Backend Service Architecture**, karena setiap service sudah memiliki batas tanggung jawab yang jelas berdasarkan event yang dipublikasikan dan dikonsumsi.
