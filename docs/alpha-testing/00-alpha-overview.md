# 00 Alpha Overview — Marketplace / Order Bot

**Project:** SelaluTeh / Foodinesia Marketplace Order Bot  
**Document Type:** Alpha Testing Overview  
**Version:** 0.1.0-alpha  
**Status:** Draft  
**Owner:** Internal Product & Engineering Team  
**Testing Type:** Internal Alpha Testing  
**Focus Area:** Marketplace / Order Bot only  
**Last Updated:** 2026-07-04

---

## 1. Purpose

Dokumen ini adalah overview utama untuk pelaksanaan **alpha testing internal** pada fitur **Marketplace / Order Bot**.

Tujuan dokumen ini adalah memberi gambaran besar tentang:

1. Apa yang sedang diuji.
2. Kenapa alpha testing dilakukan.
3. Siapa yang terlibat.
4. Dokumen apa saja yang perlu dibaca.
5. Bagaimana alur testing dijalankan.
6. Kriteria awal untuk menentukan apakah alpha berhasil atau belum.

Alpha testing ini difokuskan pada kemampuan customer melakukan pemesanan melalui chat sampai order tercatat dan payment test mode berhasil diproses.

---

## 2. Background

Marketplace / Order Bot adalah bagian dari sistem SelaluTeh / Foodinesia yang memungkinkan customer melakukan pemesanan melalui channel chat seperti Telegram atau WhatsApp.

Pada tahap ini, sistem belum diuji sebagai production-ready product. Alpha testing dilakukan untuk menemukan masalah utama pada flow order sebelum sistem diperluas ke beta testing, internal wider testing, atau production launch.

Alpha testing ini hanya berfokus pada alur marketplace dan order bot, bukan seluruh fitur dashboard, CRM, analytics, franchise management, atau sistem multi-workspace production secara lengkap.

---

## 3. Alpha Testing Goals

Alpha testing ini bertujuan untuk memastikan bahwa:

1. Customer dapat memulai pemesanan melalui chat.
2. Bot dapat memahami intent dasar terkait order, produk, outlet, cart, checkout, payment, pickup, complaint, dan handoff.
3. Customer dapat memilih outlet untuk setiap order.
4. Customer dapat memilih produk dan mengelola cart.
5. Customer dapat mengonfirmasi checkout sebelum order dibuat.
6. Sistem dapat membuat order dengan data yang benar.
7. Sistem dapat membuat payment link menggunakan payment gateway test mode.
8. Sistem dapat menerima dan memproses webhook payment secara aman.
9. Status order dan payment tetap konsisten.
10. Order masuk ke outlet yang benar.
11. Bot tidak keluar dari domain marketplace/customer service.
12. Human handoff dapat digunakan saat dibutuhkan.
13. Error penting dapat ditelusuri melalui log dan correlation ID.

---

## 4. Alpha Testing Non-Goals

Alpha testing ini **tidak bertujuan** untuk:

1. Membuktikan sistem siap production.
2. Menguji semua fitur CRM.
3. Menguji analytics atau reporting lengkap.
4. Menguji inventory management penuh.
5. Menguji delivery atau pengiriman.
6. Menguji refund otomatis.
7. Menguji live payment.
8. Menguji traffic besar atau load testing berat.
9. Menguji franchise owner management secara penuh.
10. Menguji semua fitur dashboard admin.
11. Menggunakan data customer production secara bebas.
12. Menggunakan payment gateway live mode.

---

## 5. Product Area Under Test

Area produk yang diuji dalam alpha ini adalah:

| Area | Description | Priority |
|---|---|---|
| Conversation Entry | Customer memulai percakapan dan bot mengenali kebutuhan order | Critical |
| Product Discovery | Customer melihat, mencari, dan bertanya tentang produk | Critical |
| Outlet Selection | Customer memilih outlet untuk setiap order | Critical |
| Cart Management | Customer menambah, mengubah, menghapus, dan melihat cart | Critical |
| Checkout Confirmation | Customer mengonfirmasi order sebelum dibuat | Critical |
| Order Creation | Sistem membuat order valid dan tidak duplicate | Critical |
| Payment Link | Sistem membuat payment link test mode | Critical |
| Payment Webhook | Sistem menerima webhook dan update status payment/order | Critical |
| Order Status | Customer menanyakan status order | High |
| Pickup Flow | Customer menerima instruksi pickup | High |
| Complaint Basic Flow | Customer membuat complaint sederhana terkait order | High |
| Human Handoff | Bot mengalihkan percakapan ke admin/human agent | High |
| AI Scope Guard | Bot menolak permintaan di luar domain marketplace/support | Critical |
| Observability | Error, order, payment, dan conversation dapat dilacak | Critical |

---

## 6. Supported Channels

Channel yang dapat digunakan untuk alpha testing:

### Primary Channel

- Telegram Bot

### Optional Channel

- WhatsApp Bot, jika integrasi sudah siap dan stabil untuk alpha.

Jika WhatsApp belum stabil, alpha testing dapat dimulai dari Telegram terlebih dahulu agar validasi core order flow tidak tertunda.

---

## 7. Environment

Alpha testing harus dijalankan di environment non-production.

Recommended environment:

| Environment | Usage |
|---|---|
| `development` | Developer verification dan local debugging |
| `staging` | Internal alpha testing utama |
| `alpha` | Dedicated internal alpha environment jika tersedia |

Tidak boleh menggunakan:

- Production payment key.
- Live payment mode.
- Real customer data tanpa izin.
- Production customer chat channel tanpa kontrol.
- Secret/API key yang disimpan di prompt AI atau test document.

---

## 8. Test Participants

Peserta alpha testing dapat terdiri dari:

| Role | Responsibility |
|---|---|
| Product Owner | Menentukan scope, prioritas, dan acceptance criteria |
| Engineering | Memperbaiki bug, membaca log, dan menjaga environment |
| QA/Internal Tester | Menjalankan test case dan melaporkan bug |
| Admin Outlet/Internal Ops | Memvalidasi order masuk ke outlet yang benar |
| AI/Prompt Engineer | Mengevaluasi intent, response, scope guard, dan handoff behavior |
| Payment/Backend Owner | Memvalidasi payment link, webhook, idempotency, dan status consistency |

---

## 9. Testing Approach

Alpha testing dilakukan dengan kombinasi pendekatan berikut:

### 9.1 Scripted Testing

Tester menjalankan test case yang sudah ditentukan.

Contoh:

- Order satu produk sampai payment success.
- Order beberapa produk dengan perubahan quantity.
- Pilih outlet yang tutup.
- Coba bayar order menggunakan test payment.
- Replay webhook payment.
- Tanya topik di luar marketplace.

### 9.2 Exploratory Testing

Tester mencoba percakapan yang lebih natural untuk menemukan bug yang tidak tertangkap oleh test case formal.

Contoh:

- Mengetik dengan bahasa tidak rapi.
- Mengubah pikiran di tengah percakapan.
- Bertanya produk secara ambigu.
- Mengirim pesan berulang.
- Meminta admin saat order belum selesai.

### 9.3 Regression Testing

Setiap bug critical/high yang sudah diperbaiki harus diuji ulang untuk memastikan masalah tidak muncul lagi.

### 9.4 Conversation Evaluation

Percakapan bot diuji dengan dataset pesan untuk memastikan:

- Intent classification benar.
- Tool yang dipanggil sesuai.
- Bot tidak mengarang data.
- Bot meminta klarifikasi saat perlu.
- Bot menolak out-of-scope request.
- Bot tidak membocorkan prompt atau internal instruction.

---

## 10. Critical Success Criteria

Alpha testing dianggap berhasil secara awal jika:

1. Customer dapat melakukan order end-to-end dari chat sampai payment test success.
2. Order yang dibuat memiliki outlet, customer, item, quantity, total, dan status yang benar.
3. Payment link memiliki amount yang sama dengan total order.
4. Webhook payment berhasil mengubah status order/payment.
5. Duplicate webhook tidak menyebabkan double processing.
6. Duplicate message atau retry tidak membuat duplicate order.
7. Bot tidak mengarang produk, harga, stok, atau promo.
8. Bot menolak out-of-scope request dengan response yang aman.
9. Human handoff dapat digunakan pada kasus yang membutuhkan admin.
10. Error penting memiliki log dan correlation ID yang bisa ditelusuri.

---

## 11. Key Risks

Risiko utama yang harus diperhatikan selama alpha testing:

| Risk | Impact | Priority |
|---|---|---|
| Duplicate order | Customer/admin bingung, data order tidak valid | Critical |
| Duplicate payment processing | Status payment/order salah | Critical |
| Payment amount mismatch | Kerugian finansial dan trust issue | Critical |
| Order masuk outlet salah | Operasional outlet terganggu | Critical |
| Bot mengarang harga/stok | Customer mendapat informasi salah | Critical |
| Webhook tidak aman | Status payment dapat dimanipulasi | Critical |
| Bot keluar scope | Bot menjadi general assistant, bukan CS/order bot | High |
| Tidak ada log/correlation ID | Bug sulit dilacak | High |
| Handoff tidak jelas | Complaint/customer issue tidak tertangani | High |
| Data leakage | Customer bisa melihat data customer lain | Critical |

---

## 12. Required Documents

Dokumen utama untuk alpha testing:

| File | Purpose | Status |
|---|---|---|
| `00-alpha-overview.md` | Overview utama alpha testing | Draft |
| `01-scope.md` | Batasan fitur yang diuji dan tidak diuji | Draft |
| `02-test-plan.md` | Rencana pelaksanaan alpha testing | To Do |
| `03-test-scenarios.md` | Daftar scenario dan test case | To Do |
| `04-test-data.md` | Data dummy/internal untuk pengujian | To Do |
| `05-tester-guide.md` | Panduan untuk internal tester | To Do |
| `06-bug-report-template.md` | Template laporan bug | To Do |
| `07-observability-checklist.md` | Checklist log, trace, dan monitoring | To Do |
| `08-known-issues.md` | Daftar issue dan limitation yang sudah diketahui | To Do |
| `09-incident-rollback.md` | Prosedur jika alpha menemukan masalah serius | To Do |
| `10-exit-criteria.md` | Syarat alpha dinyatakan selesai | To Do |

---

## 13. Recommended Folder Structure

```text
/docs
  /alpha-testing
    00-alpha-overview.md
    01-scope.md
    02-test-plan.md
    03-test-scenarios.md
    04-test-data.md
    05-tester-guide.md
    06-bug-report-template.md
    07-observability-checklist.md
    08-known-issues.md
    09-incident-rollback.md
    10-exit-criteria.md
    /conversation-evaluation
      happy-path.yaml
      ambiguous-input.yaml
      out-of-scope.yaml
      prompt-injection.yaml
      complaint-handoff.yaml
    /reports
      alpha-test-results.md
      alpha-final-report.md
```

---

## 14. Suggested Alpha Timeline

Contoh timeline sederhana:

| Day | Activity |
|---|---|
| Day 0 | Finalisasi scope, test data, tester guide, dan environment |
| Day 1 | Smoke test dan happy path order |
| Day 2 | Cart, outlet selection, dan product availability testing |
| Day 3 | Payment link, webhook, duplicate event, dan idempotency testing |
| Day 4 | AI scope guard, prompt injection basic test, complaint, dan handoff testing |
| Day 5 | Bug fixing dan regression testing |
| Day 6 | Final internal verification |
| Day 7 | Alpha result summary dan decision: continue, extend alpha, atau block |

Timeline ini fleksibel. Jika ditemukan bug critical pada order/payment, alpha harus diperpanjang sampai bug tersebut selesai dan lolos regression testing.

---

## 15. Bug Handling Workflow

Workflow bug selama alpha:

1. Tester menjalankan scenario.
2. Tester menemukan issue.
3. Tester mencatat bug menggunakan template.
4. Bug diberi severity: `Blocker`, `Critical`, `High`, `Medium`, atau `Low`.
5. Engineering memeriksa log dan correlation ID.
6. Bug diperbaiki.
7. Tester menjalankan regression test.
8. Bug ditandai resolved hanya jika hasil aktual sudah sesuai expected result.

---

## 16. Severity Definition

| Severity | Definition | Example |
|---|---|---|
| Blocker | Testing tidak bisa dilanjutkan | Bot tidak bisa digunakan sama sekali |
| Critical | Risiko order, payment, atau data security | Payment sukses tetapi order unpaid |
| High | Core flow terganggu tetapi ada workaround | Bot gagal mengubah quantity cart |
| Medium | UX, wording, atau flow minor bermasalah | Response bot kurang jelas |
| Low | Cosmetic atau minor improvement | Typo pada pesan bot |

---

## 17. Alpha Decision Options

Setelah alpha selesai, tim dapat mengambil salah satu keputusan berikut:

| Decision | Meaning |
|---|---|
| Continue to Beta | Alpha berhasil, sistem siap diuji lebih luas |
| Extend Alpha | Masih ada bug high/medium yang perlu divalidasi ulang |
| Block Release | Ada blocker/critical bug yang harus diselesaikan sebelum lanjut |
| Reduce Scope | Sebagian fitur ditunda agar core order flow bisa lanjut |

---

## 18. Minimum Exit Criteria

Alpha tidak boleh dianggap selesai sebelum kondisi berikut terpenuhi:

1. 100% critical test case lulus.
2. Tidak ada open blocker bug.
3. Tidak ada open critical bug.
4. Minimal 10–20 order end-to-end berhasil dilakukan di environment alpha.
5. Payment test mode berhasil dari link generation sampai webhook update.
6. Duplicate order dan duplicate webhook sudah diuji.
7. Bot berhasil menolak out-of-scope request.
8. Human handoff berhasil diuji.
9. Semua known issues terdokumentasi.
10. Alpha result summary sudah dibuat.

---

## 19. Summary

Alpha testing ini adalah tahap validasi internal untuk memastikan **Marketplace / Order Bot** dapat menjalankan flow order dengan benar sebelum digunakan lebih luas.

Fokus utama alpha bukan membuat sistem terlihat sempurna, melainkan memastikan fondasi marketplace aman dan stabil:

- Order benar.
- Payment benar.
- Outlet routing benar.
- Cart konsisten.
- Webhook aman.
- Bot tidak keluar scope.
- Human handoff tersedia.
- Error dapat dilacak.

Jika area ini sudah stabil, project dapat melanjutkan ke beta/internal wider testing dengan risiko yang jauh lebih rendah.
