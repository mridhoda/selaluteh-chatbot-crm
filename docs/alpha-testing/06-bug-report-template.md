# 06 — Bug Report Template

**Project:** SelaluTeh Marketplace / Order Bot  
**Testing Phase:** Internal Alpha Testing  
**Document Type:** Bug Report Template  
**Primary Scope:** Marketplace ordering flow, order bot, checkout, payment, webhook, pickup, complaint, and human handoff  
**Out of Scope:** CRM full feature, broadcast, analytics, franchise management, delivery, refund automation, and non-marketplace AI features

---

## 1. Purpose

Dokumen ini digunakan sebagai standar pelaporan bug selama **internal alpha testing** khusus fitur **Marketplace / Order Bot**.

Tujuan utama template ini adalah memastikan setiap bug report memiliki informasi yang cukup agar tim developer dapat:

1. memahami masalah dengan cepat,
2. mereproduksi bug,
3. mengetahui dampaknya terhadap order/payment/customer,
4. menemukan log terkait,
5. menentukan prioritas perbaikan,
6. memverifikasi ulang setelah bug diperbaiki.

Bug report yang baik harus menjawab pertanyaan berikut:

- Apa yang terjadi?
- Di mana bug terjadi?
- Kapan bug terjadi?
- Langkah apa yang menyebabkan bug muncul?
- Apa hasil yang diharapkan?
- Apa hasil aktualnya?
- Apakah bug berdampak ke order, payment, outlet, customer, atau data?
- Apakah ada screenshot, video, conversation ID, order ID, payment ID, atau log ID?

---

## 2. When to Create a Bug Report

Buat bug report ketika tester menemukan salah satu dari kondisi berikut:

- Bot memberikan jawaban yang salah.
- Bot tidak memahami intent order yang seharusnya jelas.
- Bot mengarang produk, harga, promo, stok, outlet, atau status order.
- Cart tidak sesuai dengan request user.
- Total order salah.
- Order gagal dibuat.
- Order dibuat ganda.
- Order masuk ke outlet yang salah.
- Payment link gagal dibuat.
- Status payment tidak berubah setelah webhook.
- Webhook menyebabkan transaksi ganda.
- Status order/payment tidak sinkron antara bot dan admin dashboard.
- Human handoff gagal aktif.
- Bot menjawab pertanyaan di luar scope marketplace.
- Bot menggunakan tool yang tidak seharusnya dipanggil.
- Error tidak memiliki pesan yang jelas.
- Data customer/order/payment bocor atau terlihat oleh user yang salah.
- UI admin menampilkan data salah, kosong, duplikat, atau tidak konsisten.
- Tester tidak bisa melanjutkan flow karena error.

---

## 3. Bug Report Naming Convention

Gunakan format judul bug berikut:

```text
[AREA] Short description of the problem
```

Contoh:

```text
[Payment] Paid webhook does not update order status
[Cart] Quantity update creates duplicate item
[Outlet] Order routed to wrong outlet
[Bot] Bot answers out-of-scope coding question
[Checkout] Total amount differs from Xendit payment link
[Handoff] Human handoff button does not notify admin
```

---

## 4. Area / Component List

Gunakan salah satu area berikut saat membuat bug report:

| Area | Description |
|---|---|
| Bot Conversation | Intent detection, response quality, conversation state, clarification |
| Scope Guard | Out-of-scope handling, prompt injection, policy enforcement |
| Product Discovery | Category, product list, product detail, promo, recommendation |
| Outlet Selection | Outlet suggestion, selected outlet, outlet availability, outlet routing |
| Cart | Add item, remove item, update quantity, notes, modifiers, cart summary |
| Checkout | Order confirmation, total calculation, order creation |
| Payment | Payment link, Xendit test mode, payment session, payment status |
| Webhook | Payment callback, duplicate webhook, invalid webhook, signature validation |
| Order Management | Order status, outlet dashboard, admin order view |
| Pickup | Pickup instruction, pickup status, outlet readiness |
| Complaint | Complaint creation, complaint flow, escalation |
| Human Handoff | Transfer to admin, takeover, handback to bot |
| Admin Dashboard | UI data display, filters, status update, order detail |
| Security | Data isolation, secret exposure, unauthorized access |
| Observability | Missing logs, missing correlation ID, unclear error trace |
| Performance | Slow response, timeout, repeated failure |
| Usability | Confusing copy, unclear user flow, bad empty state |

---

## 5. Severity Guide

Severity menjelaskan **tingkat dampak bug terhadap sistem dan user**.

| Severity | Meaning | Example |
|---|---|---|
| Blocker | Testing tidak bisa dilanjutkan sama sekali | Bot tidak bisa menerima pesan, checkout selalu gagal |
| Critical | Risiko order/payment/data sangat serius | Duplicate order, paid tapi tetap unpaid, total payment salah, data customer bocor |
| High | Flow utama gagal tetapi masih ada workaround | Produk tidak muncul, handoff gagal, order dashboard tidak update |
| Medium | Gangguan penting tetapi tidak menghentikan flow utama | Bot salah meminta klarifikasi, copy membingungkan, status terlambat update |
| Low | Minor issue, visual/copy/UX kecil | Typo, spacing UI, label kurang jelas |

### Severity Rules

Gunakan **Critical** jika bug terkait:

- uang/payment,
- duplicate order,
- order masuk outlet salah,
- data customer/order/payment bocor,
- status paid/unpaid salah,
- AI mengubah payment/order tanpa validasi server,
- webhook tidak idempotent,
- user bisa melihat data user lain.

Gunakan **Blocker** jika:

- tester tidak bisa memulai order,
- bot/channel tidak bisa digunakan,
- dashboard internal tidak bisa dibuka,
- semua checkout gagal,
- environment alpha tidak dapat dipakai.

---

## 6. Priority Guide

Priority menjelaskan **seberapa cepat bug harus diperbaiki**.

| Priority | Meaning |
|---|---|
| P0 | Harus diperbaiki sebelum alpha lanjut |
| P1 | Harus diperbaiki sebelum alpha selesai |
| P2 | Perlu diperbaiki, tetapi tidak menghalangi alpha |
| P3 | Bisa masuk backlog improvement |

Rekomendasi mapping:

| Severity | Default Priority |
|---|---|
| Blocker | P0 |
| Critical | P0 / P1 |
| High | P1 |
| Medium | P2 |
| Low | P3 |

---

## 7. Bug Status

Gunakan status berikut untuk tracking:

| Status | Description |
|---|---|
| New | Bug baru dilaporkan |
| Triage | Bug sedang divalidasi dan diprioritaskan |
| Need Info | Developer membutuhkan informasi tambahan |
| Accepted | Bug valid dan akan diperbaiki |
| In Progress | Bug sedang dikerjakan |
| Fixed | Bug sudah diperbaiki di environment tertentu |
| Ready for Retest | Tester diminta menguji ulang |
| Verified | Tester sudah memastikan bug selesai |
| Reopened | Bug muncul kembali setelah dianggap fixed |
| Won't Fix | Bug tidak diperbaiki karena bukan scope/current priority |
| Duplicate | Bug sama dengan laporan lain |
| Not a Bug | Perilaku sesuai desain atau requirement |

---

## 8. Required Bug Report Fields

Setiap bug report wajib memiliki field berikut:

```markdown
## Bug Summary

**Bug ID:**  
**Title:**  
**Reported By:**  
**Reported Date:**  
**Environment:**  
**Channel:**  
**Area / Component:**  
**Severity:**  
**Priority:**  
**Status:** New

---

## Context

**Workspace / Account:**  
**Outlet:**  
**Customer Persona:**  
**Customer ID / Test User ID:**  
**Conversation ID:**  
**Order ID:**  
**Payment ID / Session ID:**  
**Webhook Event ID:**  
**Correlation ID / Request ID:**  
**App Version / Commit Hash:**  

---

## Preconditions

Describe the condition before the bug happened.

Example:
- Tester is using Telegram test bot.
- Outlet A is open.
- Product "Es Teh Original" is available.
- Customer has an empty cart.
- Xendit test mode is enabled.

---

## Steps to Reproduce

1. 
2. 
3. 
4. 
5. 

---

## Expected Result

Describe what should happen.

---

## Actual Result

Describe what actually happened.

---

## Impact

Explain the impact of this bug.

Examples:
- Customer cannot complete checkout.
- Order is created with wrong total.
- Payment status does not update.
- Outlet receives the wrong order.
- Admin cannot identify the correct order.

---

## Evidence

**Screenshot:**  
**Video:**  
**Conversation transcript:**  
**Admin dashboard screenshot:**  
**Log link / log excerpt:**  

---

## Reproducibility

**Frequency:** Always / Often / Sometimes / Once  
**Reproduced By:**  
**Reproduced Date:**  

---

## Notes

Additional notes, suspected cause, or related bugs.
```

---

## 9. Compact Bug Report Template

Gunakan versi ini jika laporan dibuat cepat dari chat internal.

```markdown
# Bug Report

**Title:**  
**Area:**  
**Severity:**  
**Priority:**  
**Environment:**  
**Channel:** Telegram / WhatsApp / Admin Dashboard  
**Outlet:**  
**Conversation ID:**  
**Order ID:**  
**Payment ID:**  
**Correlation ID:**  

## Steps
1. 
2. 
3. 

## Expected


## Actual


## Evidence


## Impact


## Notes

```

---

## 10. Marketplace / Order Bot Specific Fields

Untuk bug terkait order bot, tambahkan field berikut jika tersedia:

```markdown
## Order Bot Details

**Detected Intent:**  
**Expected Intent:**  
**Bot Route:**  
**Tool Called:**  
**Expected Tool:**  
**Unexpected Tool:**  
**Cart State Before:**  
**Cart State After:**  
**Selected Outlet:**  
**Expected Outlet:**  
**Product IDs:**  
**Expected Total:**  
**Actual Total:**  
**Bot Response:**  
**Expected Bot Behavior:**  
```

Gunakan bagian ini terutama untuk bug seperti:

- intent salah,
- bot salah memahami jumlah item,
- cart berubah tidak sesuai instruksi,
- bot memilih outlet yang salah,
- bot mengarang produk/harga,
- bot memanggil tool yang salah,
- bot tidak meminta konfirmasi sebelum checkout.

---

## 11. Payment / Webhook Specific Fields

Untuk bug terkait payment, tambahkan field berikut:

```markdown
## Payment Details

**Order ID:**  
**Payment Provider:** Xendit Test Mode  
**Payment Session ID:**  
**Payment Link:**  
**Expected Payment Amount:**  
**Actual Payment Amount:**  
**Payment Status Before:**  
**Payment Status After:**  
**Webhook Event ID:**  
**Webhook Event Type:**  
**Webhook Received At:**  
**Webhook Processed At:**  
**Webhook Signature Valid:** Yes / No / Unknown  
**Duplicate Webhook:** Yes / No / Unknown  
**Idempotency Key:**  
**Order Status Before:**  
**Order Status After:**  
```

Gunakan bagian ini terutama untuk bug seperti:

- payment link gagal dibuat,
- total payment berbeda dari total order,
- webhook tidak mengubah status payment,
- webhook duplicate membuat order/payment berubah ganda,
- invalid webhook tetap diproses,
- user message mengubah status payment tanpa webhook valid,
- payment paid tetapi order masih unpaid.

---

## 12. Security / Scope Guard Specific Fields

Untuk bug terkait scope guard atau keamanan AI, tambahkan field berikut:

```markdown
## Security / Scope Guard Details

**User Message:**  
**Expected Classification:** allowed / out_of_scope / unsafe  
**Actual Classification:**  
**Expected Route:**  
**Actual Route:**  
**Tool Called:** Yes / No  
**Tool Name:**  
**Expected Tool Behavior:** no tool call / allowed tool only  
**Bot Response:**  
**Expected Response:**  
**Data Exposed:** Yes / No  
**Sensitive Data Type:**  
```

Gunakan bagian ini terutama untuk bug seperti:

- bot menjawab pertanyaan coding,
- bot menjawab tugas sekolah,
- bot membahas politik/medis/hukum/investasi,
- bot mengikuti prompt injection,
- bot membocorkan system prompt,
- bot memanggil RAG/tool untuk pertanyaan out-of-scope,
- bot menampilkan data customer/order lain.

---

## 13. Example Bug Report — Critical Payment Bug

```markdown
# Bug Report

## Bug Summary

**Bug ID:** BUG-PAY-001  
**Title:** [Payment] Paid webhook does not update order payment status  
**Reported By:** Internal Tester 01  
**Reported Date:** 2026-07-04  
**Environment:** Alpha Staging  
**Channel:** Telegram  
**Area / Component:** Payment / Webhook  
**Severity:** Critical  
**Priority:** P0  
**Status:** New

---

## Context

**Workspace / Account:** SelaluTeh Alpha Workspace  
**Outlet:** Outlet A — Alpha Open  
**Customer Persona:** New Customer  
**Customer ID / Test User ID:** TEST-CUST-001  
**Conversation ID:** CONV-ALPHA-001  
**Order ID:** ORD-ALPHA-1024  
**Payment ID / Session ID:** PAY-TEST-8891  
**Webhook Event ID:** EVT-XND-7781  
**Correlation ID / Request ID:** REQ-20260704-001  
**App Version / Commit Hash:** alpha-0.1.0 / abc1234

---

## Preconditions

- Tester uses Telegram alpha bot.
- Outlet A is open.
- Product is available.
- Xendit test mode is enabled.
- Customer has completed checkout and received payment link.

---

## Steps to Reproduce

1. Start chat with Telegram alpha bot.
2. Select Outlet A.
3. Add 1 Es Teh Original to cart.
4. Confirm checkout.
5. Open Xendit test payment link.
6. Complete successful test payment.
7. Wait for webhook processing.
8. Ask bot: "Status pesanan saya gimana?"

---

## Expected Result

- Payment status changes from `pending` to `paid`.
- Order status becomes ready for outlet processing.
- Bot tells customer that payment has been received.
- Admin dashboard shows the order as paid.

---

## Actual Result

- Xendit test payment is successful.
- Bot still says payment is pending.
- Admin dashboard still shows `unpaid`.
- No visible error is shown to tester.

---

## Impact

Customer has paid but the system does not update the order. Outlet may not process the order, causing serious payment/order mismatch.

---

## Evidence

**Screenshot:** payment-success.png, bot-status-pending.png  
**Video:** n/a  
**Conversation transcript:** attached  
**Admin dashboard screenshot:** dashboard-unpaid.png  
**Log link / log excerpt:** webhook log not found

---

## Reproducibility

**Frequency:** Always  
**Reproduced By:** Internal Tester 01, Developer 01  
**Reproduced Date:** 2026-07-04

---

## Payment Details

**Order ID:** ORD-ALPHA-1024  
**Payment Provider:** Xendit Test Mode  
**Payment Session ID:** PAY-TEST-8891  
**Expected Payment Amount:** 12000  
**Actual Payment Amount:** 12000  
**Payment Status Before:** pending  
**Payment Status After:** pending  
**Webhook Event ID:** EVT-XND-7781  
**Webhook Event Type:** payment.succeeded  
**Webhook Received At:** unknown  
**Webhook Processed At:** unknown  
**Webhook Signature Valid:** Unknown  
**Duplicate Webhook:** No  
**Idempotency Key:** unknown  
**Order Status Before:** waiting_payment  
**Order Status After:** waiting_payment

---

## Notes

Suspected issue: webhook endpoint may not receive the event, or event mapping does not update the internal payment status.
```

---

## 14. Example Bug Report — Bot Scope Guard Bug

```markdown
# Bug Report

## Bug Summary

**Bug ID:** BUG-SEC-001  
**Title:** [Scope Guard] Bot answers coding question instead of refusing out-of-scope request  
**Reported By:** Internal Tester 02  
**Reported Date:** 2026-07-04  
**Environment:** Alpha Staging  
**Channel:** Telegram  
**Area / Component:** Scope Guard  
**Severity:** High  
**Priority:** P1  
**Status:** New

---

## Context

**Workspace / Account:** SelaluTeh Alpha Workspace  
**Outlet:** n/a  
**Customer Persona:** Out-of-scope User  
**Customer ID / Test User ID:** TEST-CUST-SEC-001  
**Conversation ID:** CONV-SEC-001  
**Order ID:** n/a  
**Payment ID / Session ID:** n/a  
**Webhook Event ID:** n/a  
**Correlation ID / Request ID:** REQ-20260704-SEC-001  
**App Version / Commit Hash:** alpha-0.1.0 / abc1234

---

## Preconditions

- Tester starts a new conversation with the bot.
- No active cart exists.
- Bot should only answer marketplace/order/customer-service related requests.

---

## Steps to Reproduce

1. Open Telegram alpha bot.
2. Send message: "Buatkan aku kode JavaScript untuk login page."
3. Observe bot response.

---

## Expected Result

Bot refuses politely and redirects user back to SelaluTeh product/order/customer-service scope.

---

## Actual Result

Bot provides JavaScript code and explains how to build a login page.

---

## Impact

Bot violates marketplace-only domain scope. This may increase token usage, reduce brand trust, and allow the bot to be used outside its intended business function.

---

## Evidence

**Screenshot:** bot-coding-answer.png  
**Conversation transcript:** attached  
**Log link / log excerpt:** classifier route shows `general_answer`

---

## Reproducibility

**Frequency:** Always  
**Reproduced By:** Internal Tester 02  
**Reproduced Date:** 2026-07-04

---

## Security / Scope Guard Details

**User Message:** Buatkan aku kode JavaScript untuk login page.  
**Expected Classification:** out_of_scope  
**Actual Classification:** allowed  
**Expected Route:** out_of_scope_refusal  
**Actual Route:** general_llm_answer  
**Tool Called:** No  
**Tool Name:** n/a  
**Expected Tool Behavior:** no tool call  
**Bot Response:** Bot generated JavaScript code.  
**Expected Response:** Short refusal and redirect to product/order/customer-service assistance.  
**Data Exposed:** No  
**Sensitive Data Type:** n/a
```

---

## 15. Example Bug Report — Cart Bug

```markdown
# Bug Report

## Bug Summary

**Bug ID:** BUG-CART-001  
**Title:** [Cart] Updating item quantity creates duplicate cart line  
**Reported By:** Internal Tester 03  
**Reported Date:** 2026-07-04  
**Environment:** Alpha Staging  
**Channel:** Telegram  
**Area / Component:** Cart  
**Severity:** High  
**Priority:** P1  
**Status:** New

---

## Context

**Workspace / Account:** SelaluTeh Alpha Workspace  
**Outlet:** Outlet A — Alpha Open  
**Customer Persona:** Returning Customer  
**Customer ID / Test User ID:** TEST-CUST-003  
**Conversation ID:** CONV-CART-003  
**Order ID:** n/a  
**Payment ID / Session ID:** n/a  
**Webhook Event ID:** n/a  
**Correlation ID / Request ID:** REQ-20260704-CART-003  
**App Version / Commit Hash:** alpha-0.1.0 / abc1234

---

## Preconditions

- Tester has an active cart.
- Cart contains 1 Es Teh Original.
- Outlet A is selected.

---

## Steps to Reproduce

1. Add 1 Es Teh Original to cart.
2. Send message: "Jadikan 3 ya."
3. Ask bot to show cart.

---

## Expected Result

Cart should show:

- Es Teh Original x3

---

## Actual Result

Cart shows:

- Es Teh Original x1
- Es Teh Original x3

---

## Impact

Customer may be charged for 4 items instead of 3. This can cause incorrect order total and payment mismatch.

---

## Evidence

**Screenshot:** cart-duplicate-line.png  
**Conversation transcript:** attached  
**Admin dashboard screenshot:** n/a  
**Log link / log excerpt:** cart tool called `addItem` instead of `updateQuantity`

---

## Reproducibility

**Frequency:** Often  
**Reproduced By:** Internal Tester 03  
**Reproduced Date:** 2026-07-04

---

## Order Bot Details

**Detected Intent:** add_item  
**Expected Intent:** update_quantity  
**Bot Route:** cart_update  
**Tool Called:** addItem  
**Expected Tool:** updateCartItemQuantity  
**Unexpected Tool:** addItem  
**Cart State Before:** Es Teh Original x1  
**Cart State After:** Es Teh Original x1 + Es Teh Original x3  
**Selected Outlet:** Outlet A  
**Expected Outlet:** Outlet A  
**Product IDs:** PROD-TEH-001  
**Expected Total:** 36000  
**Actual Total:** 48000  
**Bot Response:** "Baik, saya tambahkan 3 Es Teh Original."  
**Expected Bot Behavior:** Bot should update existing quantity from 1 to 3.
```

---

## 16. Reproduction Quality Checklist

Sebelum submit bug, tester wajib mengecek:

- [ ] Judul bug jelas.
- [ ] Area/component sudah dipilih.
- [ ] Severity sudah sesuai.
- [ ] Langkah reproduce ditulis berurutan.
- [ ] Expected result jelas.
- [ ] Actual result jelas.
- [ ] Evidence tersedia jika memungkinkan.
- [ ] Conversation ID dicatat jika bug terjadi di bot.
- [ ] Order ID dicatat jika bug terkait order.
- [ ] Payment/session ID dicatat jika bug terkait payment.
- [ ] Outlet dicatat jika bug terkait outlet/order routing.
- [ ] Correlation ID atau request ID dicatat jika tersedia.
- [ ] Tidak memasukkan secret, token, API key, atau data sensitif asli.

---

## 17. Developer Triage Checklist

Saat menerima bug, developer/QA lead perlu mengecek:

- [ ] Bug masih berada dalam alpha scope.
- [ ] Bug bisa direproduksi.
- [ ] Severity sesuai dampak aktual.
- [ ] Priority sesuai kebutuhan alpha.
- [ ] Ada log atau correlation ID yang dapat ditelusuri.
- [ ] Ada kemungkinan bug terkait data seed/test data.
- [ ] Ada kemungkinan bug merupakan duplicate.
- [ ] Ada requirement atau test scenario yang terkait.
- [ ] Perlu hotfix atau bisa masuk sprint backlog.
- [ ] Perlu update test case agar bug tidak terulang.

---

## 18. Retest Template

Gunakan template ini ketika bug sudah diperbaiki dan perlu diuji ulang.

```markdown
# Retest Result

**Bug ID:**  
**Retested By:**  
**Retest Date:**  
**Environment:**  
**App Version / Commit Hash:**  

## Original Issue


## Retest Steps

1. 
2. 
3. 

## Result

Passed / Failed

## Evidence


## Notes


## Final Status

Verified / Reopened
```

---

## 19. Bug Report Storage Recommendation

Bug report dapat disimpan di salah satu tempat berikut:

```text
docs/alpha-testing/reports/bugs/
```

Contoh struktur:

```text
docs/
└── alpha-testing/
    └── reports/
        └── bugs/
            ├── BUG-PAY-001-paid-webhook-not-updating.md
            ├── BUG-CART-001-duplicate-cart-line.md
            ├── BUG-SEC-001-out-of-scope-coding-answer.md
            └── BUG-OUT-001-order-routed-to-wrong-outlet.md
```

Jika menggunakan issue tracker seperti GitHub Issues, Linear, Notion, atau Trello, template ini tetap bisa dipakai sebagai isi laporan.

---

## 20. Alpha Bug Report Rules

Selama alpha testing, gunakan aturan berikut:

1. Semua bug terkait payment, order total, duplicate order, dan data leak wajib diberi severity minimal **Critical**.
2. Semua bug yang membuat testing berhenti total wajib diberi severity **Blocker**.
3. Semua bug AI out-of-scope minimal **High** jika bot menjawab topik di luar marketplace.
4. Jangan menutup bug sebelum tester melakukan retest.
5. Jangan menghapus data bug dari database sebelum log dan evidence dicatat.
6. Jangan memakai data customer production dalam evidence.
7. Jangan menaruh API key, token, secret, atau authorization header dalam bug report.
8. Jika bug tidak bisa direproduksi, status gunakan **Need Info** atau **Triage**, bukan langsung ditutup.
9. Jika bug terjadi hanya sekali tetapi berdampak ke payment/order, tetap perlakukan sebagai serious bug.
10. Jika bug mengubah status order/payment secara salah, lakukan data reconciliation setelah fix.

---

## 21. Definition of a Good Bug Report

Bug report dianggap baik jika developer bisa memahami dan mencoba mereproduksi masalah tanpa harus bertanya ulang terlalu banyak.

Bug report yang baik memiliki:

- judul spesifik,
- area jelas,
- severity masuk akal,
- langkah reproduce lengkap,
- expected vs actual result,
- ID penting seperti conversation/order/payment/correlation ID,
- evidence visual/log,
- dampak bisnis atau user,
- tidak mengandung secret atau data sensitif asli.

---

## 22. Related Documents

Dokumen ini digunakan bersama:

- `00-alpha-overview.md`
- `01-scope.md`
- `02-test-plan.md`
- `03-test-scenarios.md`
- `04-test-data.md`
- `05-tester-guide.md`
- `07-observability-checklist.md`
- `08-known-issues.md`
- `09-incident-rollback.md`
- `10-exit-criteria.md`

