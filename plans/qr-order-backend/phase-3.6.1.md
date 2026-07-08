Phase 3.6.1 — Service Contracts
Objective

Mendefinisikan kontrak (contract) setiap Backend Service agar seluruh komunikasi antar-service bersifat konsisten, terdokumentasi, type-safe, dan mudah diuji.

Dokumen ini menjadi acuan implementasi seluruh Application Service.

Deliverable
03.6.1-service-contracts.md
Table of Contents
1.
Service Contract Principles

2.
Contract Design Standards

3.
Common DTOs

4.
Common Result Objects

5.
Common Error Objects

6.
Storefront Service Contract

7.
QR Service Contract

8.
QR Session Service Contract

9.
Cart Service Contract

10.
Cart Validation Service Contract

11.
Checkout Service Contract

12.
Payment Provider Service Contract

13.
Payment Adapter Contract

14.
Order Service Contract

15.
Fulfillment Service Contract

16.
Notification Service Contract

17.
Audit Service Contract

18.
Analytics Service Contract

19.
Security Service Contract

20.
Cross-Service Communication Rules

21.
Versioning Strategy

22.
Error Handling Contract

23.
Transaction Contract

24.
Future Compatibility

25.
Implementation Checklist
1. Service Contract Principles

Menjelaskan filosofi.

Misalnya

Service hanya expose Business Operation.

Controller tidak tahu Repository.

Repository tidak tahu Service lain.

Service tidak saling membaca database secara langsung.

Semua komunikasi melalui contract.
2. Contract Design Standards

Semua service memiliki pola yang sama.

Contoh

Input DTO

↓

Validation

↓

Business Logic

↓

Result DTO

Tidak boleh

Controller

↓

Entity

↓

Response

Entity database tidak boleh keluar dari service.

3. Common DTOs

Semua DTO standar.

Contoh

WorkspaceContext

OutletContext

CustomerContext

UserContext

PaginationRequest

PaginationResponse

Money

Address

GeoLocation

Agar tidak membuat DTO yang sama berkali-kali.

4. Common Result Objects

Standar response internal.

Contoh

Success

Failure

ValidationError

NotFound

Forbidden

Conflict

UnexpectedError

Bukan HTTP response.

Ini hanya komunikasi antar service.

5. Common Error Objects

Standarisasi Business Error.

Misalnya

InvalidQR

ExpiredQR

ClosedOutlet

UnavailableProduct

PaymentFailed

DuplicateCheckout

UnauthorizedWorkspace

InvalidProvider

Tidak menggunakan string bebas.

6. Storefront Service Contract

Contoh operasi:

ResolveStorefront()

GetCategories()

GetProducts()

GetProductDetail()

ResolveOutlet()

GetAvailableProducts()

Untuk setiap operasi dokumentasikan:

Purpose
Input DTO
Output DTO
Possible Errors
Side Effects
7. QR Service Contract

Operasi:

ResolveQRCode()

ValidateQRCode()

CreateQRCode()

DisableQRCode()

RevokeQRCode()

GetQRCodeAnalytics()
8. QR Session Service Contract

Operasi:

CreateSession()

ResumeSession()

RefreshSession()

ExpireSession()

CloseSession()
9. Cart Service Contract

Operasi:

CreateCart()

AddItem()

UpdateItem()

RemoveItem()

ClearCart()

GetCart()
10. Cart Validation Service Contract

Operasi:

ValidateProducts()

ValidateStock()

ValidateModifiers()

ValidateAvailability()

CalculatePrice()

Service ini hanya melakukan validasi dan kalkulasi.

11. Checkout Service Contract

Operasi:

StartCheckout()

ValidateCheckout()

CreateCheckout()

CancelCheckout()

ExpireCheckout()

Output harus jelas.

Misalnya

CheckoutCreated

↓

PaymentIntent

↓

OrderDraft
12. Payment Provider Service Contract

Karena provider dapat berganti.

Operasi:

CreatePayment()

VerifyWebhook()

QueryPayment()

CancelPayment()

RefundPayment()

Tidak menyebut BayarGG secara langsung.

13. Payment Adapter Contract

Ini interface yang harus diimplementasikan setiap provider.

Misalnya

interface PaymentAdapter

↓

CreatePayment

↓

VerifyWebhook

↓

GetStatus

↓

Cancel

↓

Refund

BayarGG, Midtrans, Xendit semuanya mengikuti kontrak ini.

14. Order Service Contract

Operasi:

CreateOrder()

AcceptOrder()

RejectOrder()

PrepareOrder()

ReadyOrder()

CompleteOrder()

CancelOrder()
15. Fulfillment Service Contract

Operasi:

StartPickup()

CompletePickup()

AssignDelivery()

ServeDineIn()

Walaupun delivery belum MVP, kontraknya sudah disiapkan.

16. Notification Service Contract

Operasi:

NotifyPayment()

NotifyOrderReady()

NotifyOrderCompleted()

NotifyAdmin()

Service ini hanya mengirim notifikasi.

17. Audit Service Contract

Operasi:

RecordAudit()

QueryAudit()

ExportAudit()
18. Analytics Service Contract

Operasi:

TrackQRScan()

TrackCheckout()

TrackPayment()

TrackOrder()

TrackConversion()

Analytics tidak boleh mengubah business state.

19. Security Service Contract

Operasi:

AuthorizeWorkspace()

AuthorizeRole()

VerifyWebhookSignature()

ValidatePermission()

ValidateRateLimit()
20. Cross-Service Communication Rules

Aturan komunikasi.

Contoh

✅

CheckoutService

↓

PaymentProviderService

↓

OrderService

❌

Controller

↓

PaymentRepository

atau

OrderService

↓

ProductRepository

↓

PaymentRepository

Semua lewat service.

21. Versioning Strategy

Misalnya

Service Contract v1

↓

Service Contract v2

Backward compatible.

Tidak mengubah kontrak lama secara langsung.

22. Error Handling Contract

Semua service mengembalikan error yang konsisten.

Misalnya

Business Error

Validation Error

Infrastructure Error

Security Error

Provider Error

Tidak melempar exception acak.

23. Transaction Contract

Mendefinisikan service mana yang:

membuka transaksi
bergabung dengan transaksi
tidak boleh membuka transaksi

Misalnya

CheckoutService

BEGIN TRANSACTION

Sedangkan

NotificationService

NO TRANSACTION
24. Future Compatibility

Kontrak harus tetap kompatibel jika nanti:

Microservices

Event Bus

GraphQL

gRPC

Mobile Apps

AI Agent

Public API
25. Implementation Checklist
☐ Semua service memiliki contract

☐ DTO terdokumentasi

☐ Error terdokumentasi

☐ Result Object konsisten

☐ Transaction Owner jelas

☐ Side Effect terdokumentasi

☐ Versioning Strategy tersedia

☐ Unit Test berdasarkan contract

☐ Integration Test berdasarkan contract

☐ AI Coding Agent dapat mengimplementasikan service tanpa membaca service lain
Yang Aku Rekomendasikan Ditambahkan 🌟

Agar dokumen ini benar-benar siap untuk implementasi skala besar (300–500 outlet dan mudah di-maintain), aku menyarankan tiga bab tambahan:

26. Authorization Matrix

Untuk setiap operasi service, dokumentasikan:

Service	Operation	Required Role
ProductService	CreateProduct	Admin
OrderService	AcceptOrder	Outlet Staff
PaymentProviderService	VerifyWebhook	System Only

Ini mencegah celah otorisasi saat implementasi.

27. Idempotency Matrix

Tidak semua operasi perlu idempotent.

Contoh:

Operation	Idempotent
CreateCheckout	✅
VerifyWebhook	✅
AcceptOrder	✅
GetProducts	✅
TrackQRScan	❌

Matriks ini akan membantu developer memahami perilaku setiap operasi.

28. Service Ownership Matrix

Menentukan siapa pemilik setiap operasi bisnis.

Business Capability	Owner Service
QR Validation	QrService
Cart Calculation	CartValidationService
Payment Creation	PaymentProviderService
Order Lifecycle	OrderService
Notifications	NotificationService

Matriks ini akan menjaga Single Responsibility Principle tetap konsisten seiring pertumbuhan proyek dan mempermudah AI coding agent menentukan lokasi implementasi fitur baru.