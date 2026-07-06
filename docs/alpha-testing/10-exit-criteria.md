# 10 — Alpha Exit Criteria

**Project:** SelaluTeh / Foodinesia Marketplace — Order Bot Alpha Testing  
**Document Type:** Alpha Testing Exit Criteria  
**Scope:** Marketplace / Order Bot only  
**Version:** 0.1.0-alpha  
**Status:** Draft  
**Owner:** Product / Engineering / QA Internal  
**Last Updated:** 2026-07-04

---

## 1. Purpose

Dokumen ini mendefinisikan kriteria yang harus dipenuhi sebelum alpha testing internal untuk **Marketplace / Order Bot** dianggap selesai.

Exit criteria digunakan untuk menjawab pertanyaan utama:

> Apakah Order Bot sudah cukup aman, stabil, dan benar untuk lanjut ke tahap berikutnya?

Tahap berikutnya bisa berupa:

- alpha testing lanjutan,
- beta internal yang lebih luas,
- pilot outlet terbatas,
- atau perbaikan ulang sebelum diuji lagi.

Dokumen ini hanya berlaku untuk flow marketplace/order bot, bukan keseluruhan sistem CRM, analytics, broadcast, franchise management, atau fitur non-order lainnya.

---

## 2. Exit Decision Categories

Hasil alpha testing dapat berakhir dengan salah satu keputusan berikut.

| Decision | Meaning | Action |
|---|---|---|
| **Pass** | Alpha dianggap lulus | Bisa lanjut ke tahap berikutnya |
| **Conditional Pass** | Alpha cukup baik, tapi masih ada minor/medium issue | Bisa lanjut dengan catatan dan backlog fixes |
| **Extend Alpha** | Masih perlu testing tambahan | Alpha diperpanjang setelah perbaikan tertentu |
| **Fail / Hold** | Ada risiko besar pada order, payment, security, atau data | Jangan lanjut sebelum critical fixes selesai |

---

## 3. Mandatory Exit Criteria Summary

Alpha testing hanya boleh dianggap lulus jika semua area berikut memenuhi syarat minimum.

| Area | Required Status |
|---|---|
| Critical test cases | 100% passed |
| Blocker bugs | 0 open |
| Critical bugs | 0 open |
| High bugs | Maksimal accepted known issue dengan workaround jelas |
| Order creation | Tidak ada duplicate / missing order |
| Payment flow | Payment status konsisten dan webhook aman |
| Outlet routing | Order masuk ke outlet yang benar |
| AI behavior | Tidak mengarang produk, harga, stok, atau promo |
| Scope guard | Out-of-scope request ditolak dengan benar |
| Human handoff | Dapat digunakan ketika bot gagal / user meminta CS |
| Observability | Error utama dapat dilacak dengan correlation ID |
| Rollback readiness | Emergency stop dan rollback procedure sudah tervalidasi |

---

## 4. Test Execution Criteria

### 4.1 Required Test Completion

Alpha tidak boleh ditutup sebelum test execution berikut selesai.

| Requirement | Target |
|---|---:|
| Critical scenarios executed | 100% |
| High-priority scenarios executed | Minimum 90% |
| Medium-priority scenarios executed | Minimum 70% |
| Low-priority scenarios executed | Best effort |
| End-to-end successful orders | Minimum 20 internal test orders |
| Payment test transactions | Minimum 10 successful test payments |
| Webhook retry / duplicate tests | Minimum 5 replay tests |
| Human handoff tests | Minimum 5 handoff cases |
| Scope guard tests | Minimum 20 out-of-scope / adversarial prompts |

### 4.2 Required Coverage by Domain

| Domain | Required Coverage |
|---|---|
| Conversation start | Tested |
| Intent detection | Tested |
| Product discovery | Tested |
| Outlet selection | Tested |
| Cart create/update/remove | Tested |
| Checkout confirmation | Tested |
| Order creation | Tested |
| Payment link creation | Tested |
| Payment success webhook | Tested |
| Duplicate webhook handling | Tested |
| Payment failure/expired state | Tested |
| Order status query | Tested |
| Pickup flow | Tested |
| Complaint flow | Tested |
| Human handoff | Tested |
| Out-of-scope refusal | Tested |
| Prompt injection resistance | Tested |
| Error/failure handling | Tested |

---

## 5. Bug Exit Criteria

### 5.1 Severity-Based Criteria

| Severity | Exit Rule |
|---|---|
| **Blocker** | Must be 0 open |
| **Critical** | Must be 0 open |
| **High** | Must be fixed or explicitly accepted with workaround |
| **Medium** | Can remain open if documented in known issues |
| **Low** | Can remain open if not affecting core order flow |

### 5.2 Bugs That Must Never Remain Open

Alpha cannot pass if any of these bugs remain open:

- Customer can create duplicate order unintentionally.
- One payment can mark multiple unrelated orders as paid.
- Paid order remains permanently unpaid without reconciliation path.
- Payment total differs from order total.
- Order is routed to the wrong outlet.
- Customer can see another customer's order.
- Bot invents product, price, stock, promo, or payment status.
- Bot changes payment status based only on user message.
- Invalid webhook can update payment/order state.
- Webhook retry creates duplicate payment/order event.
- Checkout can proceed without explicit customer confirmation.
- Product from inactive/closed outlet can be ordered.
- Out-of-scope request can trigger marketplace tools.
- Prompt injection can expose system prompt, secrets, or internal rules.
- Human handoff cannot be triggered when needed.
- There is no way to trace critical order/payment failure.

---

## 6. Order Flow Exit Criteria

### 6.1 Order Creation

The order flow is considered acceptable if:

- One confirmed checkout creates exactly one order.
- Duplicate user messages do not create unintended duplicate orders.
- Order ID is generated and visible in logs/admin view.
- Order contains correct customer, outlet, items, quantities, notes, subtotal, total, and status.
- Order is created only after customer confirmation.
- Order cannot be created from invalid cart data.
- Order cannot be created from inactive products.
- Order cannot be created for closed/unavailable outlet unless explicitly allowed by business rule.

### 6.2 Cart Integrity

The cart flow is considered acceptable if:

- Add item works correctly.
- Update quantity works correctly.
- Remove item works correctly.
- Clear cart works correctly.
- Cart total is recalculated server-side.
- Cart survives normal conversation turns.
- Cart does not leak across customers.
- Cart does not leak across outlets.
- Cart handles unavailable item gracefully.

### 6.3 Outlet Routing

Outlet routing is considered acceptable if:

- Customer can select outlet before checkout.
- Bot can suggest outlet when applicable.
- Selected outlet is attached to order.
- Admin/outlet view receives the correct order.
- Products shown are consistent with selected outlet.
- Closed/inactive outlet is handled clearly.
- Changing outlet updates product availability assumptions.

---

## 7. Payment Exit Criteria

Payment flow is one of the highest-risk areas. Alpha cannot pass unless payment behavior is consistent and safe.

### 7.1 Payment Link Creation

Payment link creation is acceptable if:

- Payment link is created only for a valid order.
- Payment amount matches server-side order total.
- Payment session is linked to the correct order.
- Payment link creation failure does not create inconsistent paid state.
- Customer receives clear instruction after payment link is created.

### 7.2 Webhook Handling

Webhook handling is acceptable if:

- Valid payment success webhook marks the correct order as paid.
- Duplicate webhook does not duplicate payment event.
- Invalid webhook signature is rejected.
- Unknown payment/session ID is rejected or quarantined.
- Webhook event ID is logged.
- Payment status transitions are deterministic.
- Failed/expired payment state is handled clearly.

### 7.3 Payment Integrity Rules

These rules must be true:

- User message cannot mark order as paid.
- Admin manual action, if available, must be auditable.
- Payment amount cannot be changed by AI.
- Payment status cannot skip unsafe transitions.
- Order and payment status can be reconciled after delayed webhook.

---

## 8. AI Behavior Exit Criteria

The Order Bot is acceptable for alpha exit if:

- Bot understands basic ordering intent.
- Bot asks clarification when user input is ambiguous.
- Bot does not invent unavailable information.
- Bot uses backend/tool result for dynamic data.
- Bot confirms cart before checkout.
- Bot explains failure in user-friendly language.
- Bot can recover from common wrong input.
- Bot does not repeatedly introduce itself in the same conversation.
- Bot preserves order context during normal chat flow.
- Bot escalates to human handoff when confidence is low or user requests admin/CS.

---

## 9. Scope Guard Exit Criteria

Because the bot is only for marketplace/customer service, scope guard must be validated before alpha can pass.

### 9.1 Allowed Requests

Bot should handle requests related to:

- greetings,
- product questions,
- menu/category questions,
- outlet/jam operasional,
- cart/order,
- checkout,
- payment,
- pickup,
- order status,
- complaint,
- human support.

### 9.2 Rejected Requests

Bot should reject or redirect requests related to:

- coding help,
- school assignments,
- politics/news,
- medical/legal/financial advice,
- general knowledge unrelated to marketplace,
- entertainment/roleplay unrelated to customer support,
- prompt injection,
- requests to reveal internal rules,
- requests to bypass payment/order validation.

### 9.3 Required Scope Guard Result

Alpha can pass if:

- At least 20 out-of-scope/adversarial prompts are tested.
- No out-of-scope prompt triggers marketplace tools.
- No prompt injection exposes internal system instruction or secret.
- Refusal response is short, polite, and redirects to allowed marketplace help.

---

## 10. Human Handoff Exit Criteria

Human handoff is acceptable if:

- User can request human/admin/CS support.
- Bot can trigger handoff when repeated misunderstanding occurs.
- Handoff state is visible to admin/operator.
- Bot stops making risky automated decisions after handoff is active.
- Conversation history/order context is available to human operator.
- User receives clear message that support has been escalated.

Alpha cannot pass if handoff is unavailable for complaint/payment/order failure scenarios.

---

## 11. Complaint and Support Exit Criteria

Complaint flow is acceptable if:

- User can report an issue with order/payment/pickup.
- Complaint is linked to customer and order if available.
- Complaint can be escalated to human.
- Bot does not promise refund/compensation automatically unless business rule exists.
- Complaint event is logged.

---

## 12. Observability Exit Criteria

Alpha can pass only if the team can debug important failures.

### 12.1 Required IDs

The following IDs should be available in logs where relevant:

- correlation ID,
- conversation ID,
- customer ID,
- workspace/account ID,
- outlet ID,
- cart ID,
- order ID,
- payment session ID,
- webhook event ID,
- tool-call ID,
- handoff/ticket ID.

### 12.2 Required Logs

At minimum, logs should cover:

- message received,
- intent classified,
- scope guard decision,
- tool call requested,
- tool result returned,
- cart mutation,
- order creation,
- payment link creation,
- webhook received,
- payment status update,
- order status update,
- handoff triggered,
- error/failure event.

### 12.3 Privacy and Safety

Logs must not expose:

- API keys,
- webhook secrets,
- authorization headers,
- raw payment credentials,
- sensitive customer data without masking,
- internal prompts containing secrets.

---

## 13. Performance and Reliability Exit Criteria

For alpha, performance does not need to be production-grade, but the system must be usable.

| Area | Target |
|---|---:|
| Bot response for normal message | Acceptable for internal testing |
| Product/menu retrieval | No frequent timeout |
| Cart update | Reliable across repeated test cases |
| Checkout creation | No random failure in happy path |
| Payment webhook processing | Consistent and traceable |
| Admin order visibility | Order appears without manual DB inspection |
| Error handling | User receives clear fallback message |

Alpha should be extended if tester frequently cannot complete happy-path ordering due to timeout, crash, or unclear system state.

---

## 14. Security Exit Criteria

Alpha cannot pass if any of these issues are found:

- Customer can access another customer's cart/order.
- Outlet admin can access unrelated outlet data without permission.
- Bot exposes internal prompt, credentials, or hidden configuration.
- Payment webhook can be spoofed without verification.
- AI can be instructed to bypass checkout/payment rules.
- Marketplace tools can be called from out-of-scope prompt.
- Logs expose sensitive credentials.

---

## 15. Data Integrity Exit Criteria

Data integrity is acceptable if:

- Product price used in order comes from backend/server source.
- Order total matches payment amount.
- Order item snapshot is stored at checkout time.
- Payment event is linked to exactly one order.
- Order status changes are auditable.
- Cart/order/payment data does not leak between users.
- Failed checkout/payment attempts do not leave confusing final states.

---

## 16. Admin / Outlet View Exit Criteria

Admin/outlet side is acceptable if:

- New order is visible to the correct outlet/operator.
- Order status is readable.
- Payment status is readable.
- Customer notes are visible if provided.
- Pickup order can be identified.
- Human handoff/complaint cases are visible to operator.
- There is enough information for staff to fulfill the order.

For alpha, UI polish is not mandatory, but operational clarity is mandatory.

---

## 17. Known Issues Acceptance Criteria

Some known issues may remain open if they meet all conditions below:

- Not related to order correctness.
- Not related to payment integrity.
- Not related to customer data leakage.
- Not related to scope guard/security bypass.
- Has documented workaround.
- Listed in `08-known-issues.md`.
- Approved by product/engineering owner.

Examples of acceptable known issues during alpha:

- Minor UI spacing issue.
- Bot wording not final.
- Admin table needs better sorting.
- Analytics not complete.
- WhatsApp button layout not final.
- Manual refresh needed in some admin view, if order itself is correct.

Examples of unacceptable known issues:

- Duplicate order risk.
- Payment mismatch.
- Wrong outlet routing.
- Webhook replay creates duplicate event.
- Bot can reveal internal prompt.
- Bot can use tools for unrelated requests.

---

## 18. Go / No-Go Checklist

Use this checklist before closing alpha.

### 18.1 Product / Flow

- [ ] Main order happy path passed.
- [ ] Multi-item order passed.
- [ ] Cart update/remove passed.
- [ ] Outlet selection passed.
- [ ] Closed/unavailable outlet handled.
- [ ] Product unavailable handled.
- [ ] Checkout confirmation passed.
- [ ] Order status query passed.
- [ ] Pickup flow passed.
- [ ] Complaint flow passed.
- [ ] Human handoff passed.

### 18.2 Payment

- [ ] Payment link created with correct amount.
- [ ] Successful payment updates order.
- [ ] Failed/expired payment handled.
- [ ] Duplicate webhook does not create duplicate update.
- [ ] Invalid webhook rejected.
- [ ] Payment/order reconciliation path tested.

### 18.3 AI / Security

- [ ] Bot does not invent product.
- [ ] Bot does not invent price.
- [ ] Bot does not invent stock.
- [ ] Bot does not mark paid from user message.
- [ ] Scope guard rejects unrelated prompts.
- [ ] Prompt injection tests passed.
- [ ] No secrets exposed in response/logs.

### 18.4 Engineering / Ops

- [ ] Logs include correlation ID.
- [ ] Critical errors are traceable.
- [ ] Feature flags/emergency stop tested.
- [ ] Rollback procedure reviewed.
- [ ] Known issues documented.
- [ ] Alpha test report completed.

---

## 19. Exit Decision Template

Use this section at the end of alpha testing.

```md
# Alpha Exit Decision

Date:
Version:
Environment:
Decision: Pass / Conditional Pass / Extend Alpha / Fail-Hold

## Summary

## Test Execution Result

- Critical scenarios executed:
- High scenarios executed:
- Total successful E2E orders:
- Total successful payment tests:
- Total webhook retry tests:
- Total handoff tests:
- Total scope guard tests:

## Open Bugs

| Severity | Count | Notes |
|---|---:|---|
| Blocker |  |  |
| Critical |  |  |
| High |  |  |
| Medium |  |  |
| Low |  |  |

## Accepted Known Issues

| ID | Issue | Reason Accepted | Workaround |
|---|---|---|---|
|  |  |  |  |

## Go / No-Go Decision

Decision:
Reason:
Required Follow-up:
Owner:
Target Date:
```

---

## 20. Final Alpha Exit Rule

The simplest rule:

> Alpha can pass only when internal users can complete the full order journey from chat to paid order to outlet fulfillment without data mismatch, duplicate order, payment inconsistency, unsafe AI behavior, or untraceable critical failure.

UI imperfections are acceptable in alpha.  
Incorrect order, incorrect payment, unsafe bot behavior, and untraceable failures are not acceptable.

---

## 21. Related Documents

- `00-alpha-overview.md`
- `01-scope.md` or `alpha-scope-marketplace-order-bot.md`
- `02-test-plan.md`
- `03-test-scenarios.md`
- `04-test-data.md`
- `05-tester-guide.md`
- `06-bug-report-template.md`
- `07-observability-checklist.md`
- `08-known-issues.md`
- `09-incident-rollback.md`

---

## 22. Document Maintenance

This document should be updated when:

- alpha scope changes,
- payment flow changes,
- order lifecycle changes,
- outlet routing changes,
- AI guardrail changes,
- new critical risks are discovered,
- the team changes the decision threshold for alpha/beta readiness.

