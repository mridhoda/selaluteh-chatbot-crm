# 01 Product Docs — SelaluTeh Chatbot CRM / Telegram Marketplace MVP

Folder ini berisi dokumen produk untuk backend **SelaluTeh Chatbot CRM** yang diarahkan menjadi **Telegram-first Marketplace MVP**.

Dokumen di folder ini menjawab pertanyaan produk:

- produk ini dibuat untuk siapa?
- masalah apa yang diselesaikan?
- fitur apa saja yang masuk MVP?
- fitur apa yang ditunda?
- seperti apa persona user/admin/customer?
- bagaimana user story dan acceptance criteria?
- bagaimana arah brand, logo, dan personality produk?

## Product Direction

Produk ini bukan marketplace web biasa. Produk ini adalah **chat-first commerce platform**:

```txt
Customer membeli lewat Telegram
↓
AI assistant membantu memilih produk
↓
Backend mengelola product, cart, checkout, order, dan payment
↓
Admin/human agent bisa takeover chat dari dashboard CRM
```

## Relationship With Other Docs

| Folder | Fungsi |
|---|---|
| `01-product` | Product scope, persona, feature, requirements, user stories |
| `02-flows` | Alur proses: auth, checkout, Telegram commerce, payment, webhook |
| `03-business-rules` | Aturan bisnis dan validasi domain |
| `04-tech-spec` | Arsitektur teknis backend |
| `05-api-spec` | Kontrak endpoint/API |
| `06-data` | Database schema, migration, RLS, indexes |
| `08-security` | Security model, secrets, webhook verification |
| `10-testing` | Test strategy dan test cases |
| `11-sprint` | Roadmap implementasi sprint |

## MVP Summary

MVP yang direkomendasikan adalah **single-merchant Telegram commerce**, bukan multi-seller marketplace penuh.

Customer bisa:

1. Start bot di Telegram.
2. Browse/search produk.
3. Tanya AI tentang produk.
4. Tambah produk ke cart.
5. Checkout.
6. Dapat payment link sandbox.
7. Bayar.
8. Dapat notifikasi order paid.
9. Cek status order.

Admin bisa:

1. Login dashboard.
2. Kelola produk.
3. Lihat chat/customer.
4. Takeover percakapan.
5. Lihat order.
6. Update status fulfillment.
7. Melihat payment status.

## Files

| File | Purpose |
|---|---|
| `product-vision.md` | Visi, positioning, dan product principles |
| `requirements.md` | Functional/non-functional requirements |
| `mvp-scope.md` | Scope MVP, excluded features, release boundary |
| `feature-list.md` | Daftar fitur per area produk |
| `user-personas.md` | Persona utama: owner, admin, human agent, customer |
| `user-stories.md` | User stories dan acceptance criteria |
| `customer-journey.md` | Journey customer dari Telegram sampai paid order |
| `admin-experience.md` | Pengalaman admin mengelola chat, produk, order |
| `brand-personality.md` | Kepribadian brand/product experience |
| `logo-direction.md` | Arah visual logo dan penggunaannya |
| `logo-system.md` | Sistem logo, lockup, size, placement, misuse |
| `success-metrics.md` | KPI dan analytics product |
| `release-plan.md` | Tahapan release product MVP |
| `out-of-scope.md` | Hal yang sengaja tidak masuk MVP |
| `risks-and-assumptions.md` | Risiko product dan asumsi MVP |

## Important Product Rule

AI tidak boleh menjadi sumber kebenaran order/payment.

```txt
AI = assistant/recommender/conversation layer
Backend = source of truth untuk cart, order, payment, inventory, dan status
```
