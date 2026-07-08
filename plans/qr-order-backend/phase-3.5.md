Menurutku untuk standar dokumentasi yang sudah kita bangun di project **Selkop Online / QR Store**, **Phase 3.5** sebaiknya menjadi **dokumen Business Domain**, bukan dokumen database atau API.

Artinya setelah developer membaca Phase 3.5, dia harus benar-benar memahami **bagaimana QR Store bekerja**, bahkan tanpa melihat implementasi kode.

---

# Phase 3.5 — QR Domain Architecture

## Objective

Mendefinisikan seluruh business domain QR Store sebagai fondasi implementasi backend sehingga seluruh flow Online Store berbasis QR memiliki perilaku yang konsisten, aman, scalable, dan mudah dikembangkan.

Phase ini mendefinisikan:

* bagaimana QR bekerja,
* bagaimana customer masuk ke storefront,
* bagaimana outlet ditentukan,
* bagaimana checkout dilakukan,
* serta bagaimana QR berinteraksi dengan Order, Payment, dan Fulfillment.

> **Output Document**
>
> `03.5-qr-domain-architecture.md`

---

# Table of Contents

---

# 1. Introduction

## 1.1 Purpose

Tujuan QR Domain.

Mengapa QR digunakan.

Problem yang diselesaikan.

---

## 1.2 Scope

Menjelaskan bahwa phase ini hanya membahas domain QR.

Tidak membahas:

* database
* API implementation
* service layer
* frontend implementation

karena semuanya dibahas di phase berikutnya.

---

## 1.3 Goals

Contoh

```text
✔ Universal QR

✔ Outlet QR

✔ Location QR

✔ Multi Outlet

✔ Multi Payment Provider

✔ Secure Checkout

✔ Future Ready
```

---

# 2. QR Domain Overview

Menjelaskan posisi QR di seluruh sistem.

Diagram

```text
Customer

↓

Scan QR

↓

QR Session

↓

Storefront

↓

Cart

↓

Checkout

↓

Payment

↓

Order

↓

Fulfillment
```

---

# 3. QR Business Objectives

Mengapa QR dibuat.

Misalnya

* mempermudah ordering
* online ordering
* pickup
* dine in
* campaign marketing
* event
* booth
* social media
* packaging

---

# 4. QR Scope

Bagian ini menjadi hasil final diskusi kita.

## 4.1 Universal QR

Karakteristik

Flow

Business Rule

Use Case

Validation

---

## 4.2 Outlet QR

Karakteristik

Flow

Business Rule

Use Case

Validation

---

## 4.3 Location QR

Karakteristik

Flow

Business Rule

Use Case

Validation

---

## 4.4 Scope Comparison

Tabel

| Feature         | Universal | Outlet   | Location |
| --------------- | --------- | -------- | -------- |
| Choose Outlet   | ✅         | ❌        | ❌        |
| Locked Outlet   | ❌         | ✅        | ✅        |
| Locked Location | ❌         | ❌        | ✅        |
| Pickup          | ✅         | ✅        | ✅        |
| Dine In         | ❌         | Optional | ✅        |

---

# 5. QR Lifecycle

Lifecycle QR.

```text
Created

↓

Activated

↓

Scanned

↓

Session Created

↓

Checkout

↓

Completed

↓

Archived
```

Tambahkan

* Revoked
* Expired
* Disabled

---

# 6. QR Session

Menjelaskan konsep QR Session.

Isi:

* tujuan session
* TTL
* expiration
* regeneration
* recovery
* cleanup

Diagram

```text
QR

↓

QR Session

↓

Cart

↓

Checkout

↓

Order
```

---

# 7. Storefront Resolution

Bagaimana backend menentukan storefront.

Flow

```text
QR

↓

Workspace

↓

Brand

↓

Storefront

↓

Menu
```

---

# 8. Outlet Resolution

Flow Universal

Flow Outlet

Flow Location

Semua business rule.

---

# 9. Product Resolution

Bagaimana backend memilih produk.

Contoh

```text
Workspace

↓

Storefront

↓

Outlet

↓

Category

↓

Product

↓

Modifier
```

---

# 10. Cart Resolution

Bagaimana Cart bekerja.

* create
* update
* delete
* validate
* expire

---

# 11. Checkout Resolution

Flow lengkap.

```text
Cart

↓

Validation

↓

Price Calculation

↓

Tax

↓

Fee

↓

Payment

↓

Order
```

---

# 12. Fulfillment Resolution

Semua tipe fulfillment.

Misalnya

Pickup

Takeaway

Dine In

Future:

Delivery

---

# 13. Payment Resolution

Menjelaskan hubungan QR dengan payment.

Contoh

```text
Checkout

↓

Payment Provider

↓

Webhook

↓

Order
```

Belum membahas implementasi provider.

---

# 14. Validation Rules

Semua validation.

Misalnya

QR

Session

Storefront

Outlet

Product

Modifier

Stock

Price

Payment

---

# 15. Security Rules

Business security.

Contoh

Backend tidak mempercayai

* price
* subtotal
* total
* outlet
* payment status
* modifier

Semuanya dihitung ulang.

---

# 16. Failure Scenarios

Semua kemungkinan gagal.

Misalnya

QR expired

QR revoked

Session expired

Outlet closed

Product unavailable

Payment timeout

Payment cancelled

Payment failed

Provider unavailable

Network retry

---

# 17. Analytics Context

Data yang perlu direkam.

Contoh

QR Type

QR Source

Outlet

Scan

Checkout

Conversion

Payment

Completion

---

# 18. Future Extension

Roadmap.

Misalnya

Campaign QR

Referral QR

Promo QR

Dynamic QR

Membership QR

NFC

Table Ordering

Offline Ordering

Multi Brand

White Label

---

# 19. Sequence Diagrams

Minimal:

---

### Scan QR

```text
Customer

↓

Backend

↓

QR Session

↓

Storefront
```

---

### Checkout

```text
Customer

↓

Backend

↓

Payment

↓

Webhook

↓

Order
```

---

### Payment Callback

```text
Provider

↓

Webhook

↓

Verification

↓

Payment

↓

Order
```

---

# 20. Business Rules Summary

Semua rule dirangkum.

Contoh

```text
Universal QR
Customer memilih outlet

Outlet QR
Outlet dikunci

Location QR
Outlet + meja dikunci

Checkout selalu re-calculate

Backend source of truth

Webhook source of payment truth
```

---

# 21. Implementation Checklist

Checklist implementasi.

```text
☐ Universal QR

☐ Outlet QR

☐ Location QR

☐ QR Session

☐ Session Expiry

☐ Cart Validation

☐ Checkout Validation

☐ Payment Flow

☐ Order Flow

☐ Audit Log

☐ Analytics

☐ Security Rules

☐ Unit Test

☐ Integration Test
```

---

# Hasil Akhir Phase 3.5

Dokumen ini menjadi **blueprint business domain** yang menghubungkan seluruh fase sebelumnya dan sesudahnya.

```text
Phase 3.1
Database Schema
        │
        ▼
Phase 3.2
Relationships
        │
        ▼
Phase 3.3
Constraints
        │
        ▼
Phase 3.4
Security
        │
        ▼
=============================
Phase 3.5
QR DOMAIN ARCHITECTURE
=============================
        │
        ▼
Phase 3.5.1
Domain Events & State Machines
        │
        ▼
Phase 3.6
Backend Service Architecture
        │
        ▼
Phase 3.7
REST API Architecture
        │
        ▼
Implementation
```

## Catatan Arsitektur

Ada satu tambahan yang menurutku akan membuat dokumen ini jauh lebih kuat untuk jangka panjang: tambahkan satu subbab di dalam **Phase 3.5** yaitu **"Domain Invariants"** (misalnya sebagai bab 20, lalu Business Rules Summary menjadi bab 21).

Bagian ini berisi aturan yang **tidak boleh pernah dilanggar**, contohnya:

* Order selalu dimiliki tepat satu workspace.
* Payment hanya boleh berubah menjadi `PAID` melalui webhook atau verifikasi provider.
* QR Session hanya boleh menghasilkan satu checkout yang berhasil.
* Universal QR harus memiliki outlet yang dipilih sebelum checkout.
* Outlet QR tidak boleh berpindah outlet selama session aktif.
* Semua harga final dihitung ulang oleh backend.

Invariants ini akan menjadi kontrak bisnis yang nantinya harus dipatuhi oleh service layer, API, database, maupun frontend, sehingga keseluruhan arsitektur tetap konsisten seiring bertambahnya fitur.
