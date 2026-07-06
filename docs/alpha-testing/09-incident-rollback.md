# 09 — Incident & Rollback Procedure

**Project:** SelaluTeh Marketplace / Order Bot  
**Testing Phase:** Internal Alpha Testing  
**Document Type:** Incident Response & Rollback Procedure  
**Scope:** Marketplace, Order Bot, Checkout, Payment, Webhook, Outlet Order Routing, Human Handoff  
**Version:** 0.1.0-alpha  
**Status:** Draft  
**Owner:** Engineering / Product  
**Last Updated:** 2026-07-04

---

## 1. Purpose

Dokumen ini menjelaskan prosedur yang harus dilakukan ketika terjadi incident selama **internal alpha testing** khusus fitur **Marketplace / Order Bot**.

Tujuan utama dokumen ini adalah memastikan tim dapat:

1. Menghentikan dampak incident secepat mungkin.
2. Mencegah order/payment menjadi semakin tidak konsisten.
3. Mengamankan data testing dan log yang dibutuhkan untuk debugging.
4. Melakukan rollback atau disable fitur dengan aman.
5. Melakukan rekonsiliasi order, payment, webhook, dan conversation state.
6. Menentukan apakah alpha testing boleh dilanjutkan atau harus dihentikan sementara.

---

## 2. Scope

### 2.1 In Scope

Dokumen ini berlaku untuk incident yang terjadi pada area berikut:

- Customer chat order flow.
- Marketplace product discovery.
- Outlet selection.
- Cart creation and update.
- Checkout confirmation.
- Order creation.
- Payment link creation.
- Xendit test mode payment flow.
- Payment webhook handling.
- Order/payment status synchronization.
- Pickup order flow.
- Complaint and human handoff.
- AI scope guard.
- AI tool calling.
- Admin dashboard order visibility.
- Internal alpha tester workflow.

### 2.2 Out of Scope

Dokumen ini tidak mencakup incident untuk:

- Full CRM.
- Broadcast campaign.
- Franchise management.
- Production customer incident.
- Delivery logistics.
- Real payment settlement.
- Refund production handling.
- Accounting reconciliation.
- Data warehouse / analytics pipeline.
- Non-marketplace AI features.

---

## 3. Incident Definition

Incident adalah kondisi ketika sistem alpha mengalami gangguan yang dapat menyebabkan:

- Tester tidak bisa melanjutkan order flow.
- Order dibuat dengan data salah.
- Payment status tidak sinkron.
- Webhook gagal diproses.
- Duplicate order/payment terjadi.
- Order masuk ke outlet yang salah.
- Bot menjalankan action yang tidak seharusnya.
- Bot menjawab di luar scope marketplace/customer service.
- Data internal terlihat oleh tester lain.
- Sistem tidak dapat ditelusuri karena log/correlation ID tidak tersedia.

---

## 4. Incident Severity

| Severity | Name | Description | Example |
|---|---|---|---|
| SEV-0 | Emergency | Risiko serius terhadap order/payment/data sehingga testing harus langsung dihentikan | Duplicate payment processing, order customer lain terlihat |
| SEV-1 | Critical | Flow utama rusak atau data penting tidak konsisten | Paid webhook masuk tetapi order tetap unpaid |
| SEV-2 | High | Fitur utama gagal tetapi ada workaround | Checkout gagal untuk outlet tertentu |
| SEV-3 | Medium | Bug mengganggu UX tetapi tidak merusak data utama | Bot meminta klarifikasi terlalu sering |
| SEV-4 | Low | Minor issue, copywriting, visual, atau improvement | Label status kurang jelas |

---

## 5. Immediate Stop Conditions

Alpha testing harus **langsung dihentikan sementara** jika salah satu kondisi berikut terjadi:

- Satu checkout dapat membuat lebih dari satu order.
- Satu payment dapat mengubah lebih dari satu order.
- Order masuk ke outlet yang salah.
- Total payment berbeda dari total order.
- Status payment dapat berubah hanya karena pesan user seperti “sudah bayar”.
- Webhook palsu/tidak valid diterima sebagai valid.
- Tester dapat melihat order tester lain tanpa izin.
- Bot menjalankan tool marketplace untuk pertanyaan out-of-scope.
- Bot membocorkan system prompt, token, secret, atau internal instruction.
- Sistem tidak menghasilkan log/correlation ID untuk critical flow.
- Payment webhook tidak idempotent.
- Admin dashboard menampilkan order/payment yang tidak sesuai database.

---

## 6. Emergency Feature Flags

Selama alpha, sistem harus memiliki feature flag atau environment variable untuk mematikan fitur kritis dengan cepat.

Recommended flags:

```env
ORDER_BOT_ENABLED=true
MARKETPLACE_ENABLED=true
CHECKOUT_ENABLED=true
PAYMENT_CREATION_ENABLED=true
PAYMENT_WEBHOOK_PROCESSING_ENABLED=true
AI_TOOL_CALLING_ENABLED=true
HUMAN_HANDOFF_ENABLED=true
```

Emergency shutdown example:

```env
ORDER_BOT_ENABLED=false
CHECKOUT_ENABLED=false
PAYMENT_CREATION_ENABLED=false
AI_TOOL_CALLING_ENABLED=false
```

Webhook freeze example:

```env
PAYMENT_WEBHOOK_PROCESSING_ENABLED=false
```

Marketplace read-only mode example:

```env
MARKETPLACE_ENABLED=true
CHECKOUT_ENABLED=false
PAYMENT_CREATION_ENABLED=false
```

---

## 7. Incident Response Roles

| Role | Responsibility |
|---|---|
| Incident Lead | Mengambil keputusan stop/resume testing |
| Backend Engineer | Mengecek API, order, payment, webhook, database |
| AI Engineer | Mengecek intent routing, scope guard, tool call, memory/context |
| Frontend Engineer | Mengecek admin dashboard dan UI state |
| QA / Tester Lead | Mengumpulkan bug reports dan reproduction steps |
| Product Owner | Menentukan impact terhadap alpha scope |
| Outlet/Admin Tester | Memvalidasi apakah order terlihat benar di sisi operasional |

Untuk alpha internal, satu orang boleh memegang beberapa role.

---

## 8. Incident Response Workflow

### Phase 1 — Detect

Incident dapat ditemukan dari:

- Bug report tester.
- Failed test case.
- Error logs.
- Monitoring dashboard.
- Webhook failure.
- Admin dashboard mismatch.
- Bot behavior yang tidak sesuai expected result.

Minimum data yang harus dicatat:

```text
Incident ID:
Detected by:
Detected at:
Channel:
Environment:
Conversation ID:
Customer/Test User ID:
Outlet ID:
Order ID:
Payment ID:
Webhook Event ID:
Correlation ID:
Severity:
Summary:
```

---

### Phase 2 — Triage

Tentukan severity berdasarkan impact:

1. Apakah order/payment/data terdampak?
2. Apakah bug dapat direproduksi?
3. Apakah bug memengaruhi semua tester atau hanya satu flow?
4. Apakah ada risiko duplicate order/payment?
5. Apakah ada risiko data leakage?
6. Apakah testing masih aman dilanjutkan?

Triage result:

```text
Severity:
Impacted area:
Testing status: Continue / Pause / Stop
Feature flag action needed: Yes / No
Rollback needed: Yes / No
Data reconciliation needed: Yes / No
```

---

### Phase 3 — Contain

Containment bertujuan menghentikan dampak incident tanpa langsung menghapus data.

Possible containment actions:

| Incident Type | Immediate Action |
|---|---|
| Duplicate order | Disable checkout |
| Duplicate payment processing | Disable webhook processing |
| Wrong outlet routing | Disable order creation |
| Bot hallucinating price/product | Disable AI tool calling or force deterministic product lookup |
| Scope guard failure | Disable AI response for out-of-scope path |
| Dashboard mismatch | Freeze admin action, continue backend investigation |
| Data leakage | Stop all testing and revoke access if needed |
| Payment link issue | Disable payment creation |

Do not delete data during containment unless explicitly approved.

---

### Phase 4 — Preserve Evidence

Sebelum rollback atau data correction, simpan evidence berikut:

- Screenshot conversation.
- Screenshot admin dashboard.
- Order record before change.
- Payment record before change.
- Webhook payload metadata.
- Server logs.
- AI trace.
- Tool-call trace.
- Database row/document snapshot.
- Deployment version.
- Environment variables relevant to feature flags.

Recommended evidence folder:

```text
docs/alpha-testing/reports/incidents/
└── INC-YYYYMMDD-001/
    ├── summary.md
    ├── screenshots/
    ├── logs/
    ├── order-snapshot.json
    ├── payment-snapshot.json
    ├── webhook-events.json
    └── conversation-trace.json
```

---

### Phase 5 — Fix or Rollback Decision

Use this decision guide:

| Condition | Decision |
|---|---|
| Bug is small and isolated | Hotfix allowed |
| Bug affects order/payment integrity | Rollback or disable feature first |
| Bug affects security/privacy | Stop testing immediately |
| Bug caused by recent deploy | Rollback to previous stable alpha build |
| Bug caused by data seed | Fix seed data and rerun smoke test |
| Bug caused by webhook retry/idempotency | Disable webhook processing until fixed |
| Bot behavior inconsistent | Disable affected AI route/tool and use deterministic fallback |

---

## 9. Rollback Procedure

### 9.1 Pre-Rollback Checklist

Before rollback:

- [ ] Incident severity assigned.
- [ ] Testing paused if SEV-0/SEV-1.
- [ ] Current deployment version recorded.
- [ ] Previous stable deployment version identified.
- [ ] Database migration impact checked.
- [ ] Order/payment data snapshot saved.
- [ ] Webhook replay risk checked.
- [ ] Feature flags prepared.
- [ ] Smoke test checklist prepared.

---

### 9.2 Application Rollback

Steps:

1. Pause alpha testing.
2. Disable checkout/payment creation if needed.
3. Record current version.
4. Deploy previous stable alpha build.
5. Confirm app starts successfully.
6. Confirm admin dashboard loads.
7. Confirm bot responds to basic greeting.
8. Confirm order creation behavior.
9. Confirm payment creation behavior only if safe.
10. Run smoke test.
11. Decide whether testing can resume.

Rollback record template:

```text
Rollback ID:
Incident ID:
From version:
To version:
Rollback started at:
Rollback completed at:
Rollback performed by:
Reason:
Verification result:
Testing resumed: Yes / No
```

---

### 9.3 Database Rollback

Database rollback must be handled carefully.

General rule:

> Prefer forward-fix or data correction over destructive rollback during alpha, unless migration clearly broke the schema.

Before database rollback:

- [ ] Export affected records.
- [ ] Check if migration is reversible.
- [ ] Check if payment/order records were created after migration.
- [ ] Check if webhook events depend on new schema.
- [ ] Confirm no critical evidence will be lost.

Data that should not be deleted immediately:

- Order records.
- Payment records.
- Webhook events.
- Conversation logs.
- Tool-call traces.
- Incident-related customer/tester messages.

---

### 9.4 Feature Rollback

For risky features, prefer disabling the specific feature instead of rolling back the whole app.

Examples:

```env
CHECKOUT_ENABLED=false
```

```env
PAYMENT_CREATION_ENABLED=false
```

```env
AI_TOOL_CALLING_ENABLED=false
```

```env
PAYMENT_WEBHOOK_PROCESSING_ENABLED=false
```

Feature rollback is recommended when:

- Only one module is broken.
- Current deploy contains unrelated fixes that should stay.
- Database schema is not affected.
- The issue can be contained by disabling one flow.

---

## 10. Payment & Webhook Incident Procedure

Payment-related incidents are critical even in test mode because they validate production behavior.

### 10.1 Payment Incident Examples

- Payment link not created.
- Payment link created for wrong amount.
- Payment link created for wrong order.
- Webhook not received.
- Webhook received but not processed.
- Webhook processed multiple times.
- Payment status becomes paid without verified webhook.
- Order stays unpaid after successful test payment.
- Payment expired but order remains payable.

---

### 10.2 Payment Containment

If payment issue occurs:

1. Disable new payment link creation.
2. Keep webhook logs enabled if safe.
3. Do not delete payment records.
4. Identify affected order IDs.
5. Identify affected payment session IDs.
6. Identify webhook event IDs.
7. Check idempotency keys.
8. Check signature verification logs.
9. Check order/payment state transition history.

Emergency flags:

```env
PAYMENT_CREATION_ENABLED=false
PAYMENT_WEBHOOK_PROCESSING_ENABLED=false
```

---

### 10.3 Webhook Replay Procedure

Webhook replay may be needed if valid payment events were missed.

Before replay:

- [ ] Confirm webhook event is valid.
- [ ] Confirm event belongs to test mode.
- [ ] Confirm event has not been processed successfully.
- [ ] Confirm idempotency guard is active.
- [ ] Confirm target order is still in expected state.
- [ ] Confirm replay will not duplicate order/payment state.

Webhook replay log:

```text
Webhook Event ID:
Original received at:
Replay requested by:
Replay reason:
Related Order ID:
Related Payment ID:
Before state:
After state:
Replay result:
```

---

### 10.4 Payment Reconciliation Checklist

For every affected payment incident:

- [ ] Order exists.
- [ ] Payment record exists.
- [ ] Payment amount matches order total.
- [ ] Payment currency is correct.
- [ ] Payment belongs to correct workspace.
- [ ] Payment belongs to correct outlet/order.
- [ ] Webhook event is stored.
- [ ] Webhook event ID is unique.
- [ ] Payment status transition is valid.
- [ ] Order status transition is valid.
- [ ] Duplicate webhook does not change final state incorrectly.
- [ ] Admin dashboard displays correct status.
- [ ] Bot displays correct status to tester.

---

## 11. Order Incident Procedure

### 11.1 Order Incident Examples

- Order is not created after checkout confirmation.
- Order created before user confirmation.
- Duplicate order created from repeated message/click.
- Wrong product added to order.
- Wrong quantity added to order.
- Wrong outlet assigned.
- Product unavailable but still checked out.
- Cart total differs from order total.
- Order status does not update.
- Admin cannot see new order.

---

### 11.2 Order Containment

If order integrity issue occurs:

1. Disable checkout.
2. Stop new order creation.
3. Keep product browsing active only if safe.
4. Preserve affected conversation trace.
5. Identify affected cart/session/order IDs.
6. Check idempotency keys.
7. Check server-side price recalculation.
8. Check outlet routing rules.

Emergency flags:

```env
CHECKOUT_ENABLED=false
ORDER_CREATION_ENABLED=false
```

---

### 11.3 Order Reconciliation Checklist

- [ ] Conversation ID mapped to correct customer/tester.
- [ ] Cart belongs to correct customer/tester.
- [ ] Outlet selected before checkout.
- [ ] Product belongs to selected outlet.
- [ ] Quantity is correct.
- [ ] Modifier/topping is correct.
- [ ] Price is calculated by backend.
- [ ] Discount/promo is valid if used.
- [ ] Final total matches payment amount.
- [ ] Order status is valid.
- [ ] Admin dashboard status matches database.
- [ ] Bot response matches order status.

---

## 12. AI Bot Incident Procedure

### 12.1 AI Bot Incident Examples

- Bot hallucinates unavailable product.
- Bot hallucinates price or promo.
- Bot changes payment status from user claim.
- Bot calls checkout tool without confirmation.
- Bot calls marketplace tools for out-of-scope messages.
- Bot reveals system prompt or internal instruction.
- Bot ignores human handoff request.
- Bot loses cart context.
- Bot introduces itself repeatedly.

---

### 12.2 AI Bot Containment

If AI behavior is unsafe:

1. Disable affected AI route.
2. Disable tool calling if needed.
3. Force deterministic fallback response.
4. Keep human handoff available.
5. Save conversation trace and tool-call trace.
6. Add message to conversation evaluation dataset.
7. Add regression test before re-enabling route.

Emergency flags:

```env
AI_TOOL_CALLING_ENABLED=false
AI_GENERATIVE_RESPONSE_ENABLED=false
HUMAN_HANDOFF_ENABLED=true
```

Safe fallback response:

```text
Maaf, saat ini bot order sedang dalam mode pemeriksaan internal. Saya akan teruskan ke admin agar pesanan kamu bisa dibantu secara manual.
```

---

## 13. Human Handoff Incident Procedure

### 13.1 Handoff Incident Examples

- User asks for admin but bot keeps replying.
- Bot triggers handoff too early.
- Admin does not receive handoff notification.
- Conversation remains locked after handoff ends.
- Bot and admin reply at the same time.
- Handoff status not visible in dashboard.

### 13.2 Handoff Containment

- [ ] Disable bot auto-reply for affected conversation.
- [ ] Assign conversation manually to admin.
- [ ] Record conversation ID and handoff event ID.
- [ ] Check handoff state transition.
- [ ] Confirm only one responder is active.
- [ ] Resume bot only after handoff state is clear.

---

## 14. Communication Procedure

### 14.1 Internal Tester Notification

When alpha is paused:

```text
Alpha testing Marketplace / Order Bot sedang dihentikan sementara karena ada issue yang sedang dicek oleh tim. Jangan lanjutkan order/payment test sampai ada update berikutnya.
```

When alpha resumes:

```text
Alpha testing Marketplace / Order Bot sudah bisa dilanjutkan. Silakan lanjutkan skenario dari daftar test case, dan laporkan jika menemukan issue baru.
```

---

### 14.2 Incident Update Format

```text
Incident ID:
Current status:
Severity:
Affected area:
Action taken:
Tester action needed:
Next validation:
```

---

## 15. Resume Testing Criteria

Testing boleh dilanjutkan jika:

- [ ] Root cause sementara sudah diketahui atau impact sudah contained.
- [ ] Feature flag sudah diset dengan aman.
- [ ] Tidak ada risiko duplicate order/payment.
- [ ] Tidak ada risiko data leakage.
- [ ] Smoke test utama lulus.
- [ ] Affected testers sudah diberi update.
- [ ] Incident log sudah dibuat.
- [ ] Bug ticket sudah tercatat.

For SEV-0 / SEV-1, testing hanya boleh dilanjutkan setelah approval dari Incident Lead.

---

## 16. Smoke Test After Rollback or Fix

Minimum smoke test:

| ID | Test | Expected Result |
|---|---|---|
| SMK-001 | Bot responds to greeting | Bot replies normally |
| SMK-002 | Product list request | Bot shows valid products only |
| SMK-003 | Outlet selection | Outlet is selected correctly |
| SMK-004 | Add item to cart | Cart updates correctly |
| SMK-005 | Checkout confirmation | Order created once |
| SMK-006 | Payment link creation | Payment link created with correct amount |
| SMK-007 | Payment webhook success | Payment/order status becomes paid |
| SMK-008 | Duplicate webhook replay | No duplicate processing |
| SMK-009 | Admin dashboard check | Order visible with correct status |
| SMK-010 | Out-of-scope request | Bot refuses safely |
| SMK-011 | Human handoff | Handoff triggers correctly |

Smoke test result:

```text
Smoke test date:
Tested by:
Deployment version:
Result: Pass / Fail
Failed cases:
Decision: Resume / Keep paused
```

---

## 17. Post-Incident Review

Every SEV-0, SEV-1, and SEV-2 incident should have a short post-incident review.

Template:

```text
Incident ID:
Severity:
Date:
Detected by:
Affected area:
Summary:
Timeline:
Root cause:
Impact:
What went well:
What went wrong:
What was missing:
Fix applied:
Regression test added:
Documentation update needed:
Owner:
Due date:
```

---

## 18. Root Cause Categories

Use these categories for reporting:

| Category | Examples |
|---|---|
| AI Routing | Wrong intent, wrong route, out-of-scope failure |
| Tool Calling | Wrong tool, missing validation, unsafe action |
| Backend Logic | Wrong order/payment state transition |
| Webhook | Missing verification, duplicate processing, retry failure |
| Data Seed | Invalid test product/outlet/customer data |
| Frontend/Admin | Dashboard mismatch, stale UI state |
| Infrastructure | Deployment, environment variable, network, queue |
| Security | Data leakage, prompt injection, secret exposure |
| Observability | Missing logs, missing correlation ID, unclear trace |
| Human Process | Tester skipped step, unclear guide, missing scenario |

---

## 19. Required Follow-Up Actions

After incident is resolved:

- [ ] Bug ticket updated.
- [ ] Root cause documented.
- [ ] Test scenario updated.
- [ ] Regression test added.
- [ ] Known issues updated if limitation remains.
- [ ] Observability gap fixed if logs were insufficient.
- [ ] Tester guide updated if confusion caused the issue.
- [ ] Feature flag default reviewed.
- [ ] Alpha report updated.

---

## 20. Incident Register

| Incident ID | Date | Severity | Area | Summary | Status | Owner | Resolution |
|---|---|---|---|---|---|---|---|
| INC-YYYYMMDD-001 | YYYY-MM-DD | SEV-1 | Payment/Webhook | Example incident | Open | Backend | TBD |

Status values:

- Open
- Investigating
- Contained
- Fixed
- Retesting
- Closed
- Won't Fix for Alpha

---

## 21. Go / No-Go After Incident

### Go

Alpha can continue when:

- No SEV-0 or SEV-1 open.
- All critical smoke tests pass.
- Payment/order consistency is verified.
- Feature flags are in safe state.
- Testers have received updated instruction.

### No-Go

Alpha must remain paused when:

- Duplicate order/payment risk still exists.
- Payment status can be changed without valid webhook.
- Data leakage risk exists.
- Scope guard still fails for dangerous requests.
- Logs are insufficient to investigate repeated failures.
- Admin dashboard cannot be trusted for order/payment status.

---

## 22. Final Notes

During alpha testing, the safest incident response principle is:

> Stop the risky flow first, preserve the evidence, then debug.

For Marketplace / Order Bot, bugs in UI can be tolerated temporarily, but bugs related to **order correctness, payment integrity, outlet routing, webhook idempotency, scope guard, and data isolation** must be treated as critical.

