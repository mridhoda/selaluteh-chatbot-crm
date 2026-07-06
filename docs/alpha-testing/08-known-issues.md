# 08 — Known Issues

> Alpha testing document for **Marketplace / Order Bot** only.  
> This file lists known limitations, unfinished behavior, and accepted issues for the internal alpha phase.

---

## 1. Document Purpose

The purpose of this document is to help internal testers distinguish between:

1. **Known issues** that are already expected in the alpha build.
2. **Accepted limitations** that are intentionally out of scope for this alpha.
3. **New bugs** that should be reported using `06-bug-report-template.md`.

This document should be reviewed before testers start testing the Marketplace / Order Bot flow.

---

## 2. Alpha Build Information

| Field | Value |
|---|---|
| Product Area | Marketplace / Order Bot |
| Test Phase | Internal Alpha |
| Build Version | `0.1.0-alpha` |
| Environment | Staging / Internal Testing |
| Channels | Telegram / WhatsApp, depending on current test availability |
| Payment Mode | Xendit Test Mode |
| Fulfillment Mode | Pickup Only |
| Delivery Support | Not included in this alpha |
| Refund Support | Manual / out of scope unless explicitly tested |
| Last Updated | `YYYY-MM-DD` |
| Owner | Product / Engineering Team |

---

## 3. Known Issue Status Legend

Use the following status labels when updating this document.

| Status | Meaning |
|---|---|
| `Known` | Issue is confirmed and expected during alpha |
| `Accepted Limitation` | Not considered a bug for this alpha |
| `In Progress` | Fix is being worked on |
| `Needs Verification` | Fix exists but needs retesting |
| `Resolved` | Issue has been fixed and verified |
| `Deferred` | Will be addressed after alpha |
| `Won't Fix for Alpha` | Intentionally not fixed during alpha |

---

## 4. Severity Legend

| Severity | Meaning |
|---|---|
| `Blocker` | Prevents alpha testing from continuing |
| `Critical` | Can cause wrong order, wrong payment, duplicate order, data leak, or serious trust issue |
| `High` | Major flow is affected, but workaround exists |
| `Medium` | UX issue or partial functionality issue |
| `Low` | Minor visual, copywriting, or polish issue |

---

## 5. Accepted Alpha Limitations

These items are **not considered bugs** during this alpha unless the behavior breaks a flow that is explicitly in scope.

### 5.1 Delivery Is Not Available

| Field | Detail |
|---|---|
| Status | `Accepted Limitation` |
| Severity | `Low` |
| Area | Fulfillment |
| Description | The alpha only supports pickup orders. Delivery address collection, courier integration, delivery fee calculation, and delivery tracking are not part of this test. |
| Tester Action | Do not report delivery absence as a bug. Only report if the bot promises delivery or allows checkout as delivery. |

Expected bot behavior:

```text
Saat ini pesanan hanya tersedia untuk pickup. Silakan pilih outlet untuk pengambilan pesanan.
```

---

### 5.2 Refund Automation Is Not Available

| Field | Detail |
|---|---|
| Status | `Accepted Limitation` |
| Severity | `Low` |
| Area | Payment / Support |
| Description | Refund automation is not part of the alpha. Refund-related cases should be routed to human support. |
| Tester Action | Report only if bot claims a refund has been processed automatically without backend confirmation. |

Expected bot behavior:

```text
Untuk refund, saya akan bantu teruskan ke tim admin agar dapat diperiksa secara manual.
```

---

### 5.3 Advanced CRM Features Are Out of Scope

| Field | Detail |
|---|---|
| Status | `Accepted Limitation` |
| Severity | `Low` |
| Area | CRM |
| Description | Customer segmentation, broadcast campaign, customer lifetime value, loyalty program, and advanced CRM automation are not part of this alpha. |
| Tester Action | Do not report missing CRM features as Marketplace / Order Bot bugs. |

---

### 5.4 Full Analytics Dashboard Is Out of Scope

| Field | Detail |
|---|---|
| Status | `Accepted Limitation` |
| Severity | `Low` |
| Area | Analytics |
| Description | Alpha focuses on order flow correctness, not complete business analytics. |
| Tester Action | Report only if order/payment data required for testing cannot be inspected. |

---

### 5.5 Production Multi-Workspace Flow Is Not Fully Tested

| Field | Detail |
|---|---|
| Status | `Accepted Limitation` |
| Severity | `Medium` |
| Area | Workspace / Tenancy |
| Description | Alpha may use a single internal workspace with multiple outlets. Production-level multi-account or franchise-owner separation may not be fully enabled. |
| Tester Action | Report only if outlet-level isolation or workspace identifiers are mixed incorrectly inside the alpha environment. |

---

## 6. Known Bot Conversation Issues

### BOT-KI-001 — Bot May Ask Extra Clarification for Ambiguous Orders

| Field | Detail |
|---|---|
| Status | `Known` |
| Severity | `Medium` |
| Area | Conversation / Intent |
| Description | For vague requests such as “yang biasa aja” or “pesan seperti kemarin”, the bot may ask additional clarification instead of immediately choosing a product. |
| Expected During Alpha | Yes |
| Workaround | Tester should provide product name, quantity, and outlet clearly. |
| Report As Bug If | Bot confirms checkout without enough product/order information. |

---

### BOT-KI-002 — Natural Language Quantity Updates May Be Imperfect

| Field | Detail |
|---|---|
| Status | `Known` |
| Severity | `Medium` |
| Area | Cart / Conversation |
| Description | Some natural language changes such as “yang tadi jadi dua aja” may not always map correctly to the intended cart item. |
| Expected During Alpha | Partially |
| Workaround | Use explicit item names and quantities. |
| Report As Bug If | Bot silently updates the wrong item or changes cart total without confirmation. |

---

### BOT-KI-003 — Bot May Repeat Some Confirmation Messages

| Field | Detail |
|---|---|
| Status | `Known` |
| Severity | `Low` |
| Area | Conversation UX |
| Description | The bot may repeat confirmation text when transitioning between cart review and checkout. |
| Expected During Alpha | Yes |
| Workaround | Continue the test flow. |
| Report As Bug If | Repetition blocks checkout or causes duplicate order creation. |

---

### BOT-KI-004 — Bot Should Not Answer Out-of-Scope Requests

| Field | Detail |
|---|---|
| Status | `Known Guardrail Requirement` |
| Severity | `Critical` if broken |
| Area | AI Scope Guard |
| Description | The bot is expected to reject requests outside Marketplace / Order Bot / customer service scope. |
| Expected During Alpha | Bot gives a short refusal and redirects to ordering/help. |
| Report As Bug If | Bot answers coding, politics, schoolwork, medical, legal, investment, or unrelated general knowledge questions. |

Example expected refusal:

```text
Maaf, saya hanya bisa membantu seputar produk, pemesanan, pembayaran, pickup, komplain, dan layanan pelanggan.
```

---

## 7. Known Outlet Issues

### OUT-KI-001 — Outlet Suggestion May Be Basic

| Field | Detail |
|---|---|
| Status | `Known` |
| Severity | `Low` |
| Area | Outlet Selection |
| Description | Outlet suggestion may be based on predefined test data and may not use real distance/location intelligence. |
| Expected During Alpha | Yes |
| Workaround | Tester manually selects outlet from available list. |
| Report As Bug If | Order is assigned to an outlet different from the confirmed outlet. |

---

### OUT-KI-002 — Outlet Operating Hours May Use Dummy Data

| Field | Detail |
|---|---|
| Status | `Known` |
| Severity | `Medium` |
| Area | Outlet Availability |
| Description | Some outlet open/closed states may use alpha seed data rather than real store schedules. |
| Expected During Alpha | Yes |
| Workaround | Use the outlet availability defined in `04-test-data.md`. |
| Report As Bug If | A closed outlet still allows checkout without warning. |

---

## 8. Known Product and Menu Issues

### PRD-KI-001 — Some Product Images May Be Missing

| Field | Detail |
|---|---|
| Status | `Accepted Limitation` |
| Severity | `Low` |
| Area | Product Catalog |
| Description | Alpha product data may not include final images for every product. |
| Expected During Alpha | Yes |
| Workaround | Use product name and price for validation. |
| Report As Bug If | Missing images break product selection or checkout. |

---

### PRD-KI-002 — Modifier / Topping Support May Be Limited

| Field | Detail |
|---|---|
| Status | `Known` |
| Severity | `Medium` |
| Area | Product / Cart |
| Description | Some product modifiers, toppings, or variant combinations may not be fully supported. |
| Expected During Alpha | Partially |
| Workaround | Test only modifiers listed in the alpha test data. |
| Report As Bug If | Price total is wrong after selecting modifier or variant. |

---

### PRD-KI-003 — Product Availability May Not Update in Real Time

| Field | Detail |
|---|---|
| Status | `Known` |
| Severity | `Medium` |
| Area | Product Availability |
| Description | Product availability may depend on seeded test data or manual admin updates. |
| Expected During Alpha | Yes |
| Workaround | Use predefined available/unavailable products from `04-test-data.md`. |
| Report As Bug If | Bot allows checkout for a product explicitly marked unavailable. |

---

## 9. Known Cart and Checkout Issues

### CART-KI-001 — Cart Session May Expire During Long Idle Tests

| Field | Detail |
|---|---|
| Status | `Known` |
| Severity | `Medium` |
| Area | Cart Session |
| Description | Long idle conversations may cause cart state to reset or require reconfirmation. |
| Expected During Alpha | Yes, depending on configured session timeout |
| Workaround | Complete test flow without long pauses. |
| Report As Bug If | Cart disappears during normal short interaction or without timeout warning. |

---

### CART-KI-002 — Multi-Order in Same Conversation May Need Clear Separation

| Field | Detail |
|---|---|
| Status | `Known` |
| Severity | `High` |
| Area | Cart / Order |
| Description | Starting a second order immediately after finishing one may require explicit reset or new order confirmation. |
| Expected During Alpha | Partially |
| Workaround | Say “buat pesanan baru” before starting another order. |
| Report As Bug If | Items from the old order leak into the new order. |

---

### CHECKOUT-KI-001 — Checkout Requires Explicit Confirmation

| Field | Detail |
|---|---|
| Status | `Known Requirement` |
| Severity | `Critical` if broken |
| Area | Checkout |
| Description | The bot must not create an order or payment link without explicit user confirmation. |
| Expected During Alpha | Always required |
| Workaround | None |
| Report As Bug If | Order/payment is created before user confirms checkout. |

---

## 10. Known Payment and Webhook Issues

### PAY-KI-001 — Payment Uses Xendit Test Mode Only

| Field | Detail |
|---|---|
| Status | `Accepted Limitation` |
| Severity | `Low` |
| Area | Payment |
| Description | Alpha must use Xendit test mode. Real payment credentials and real transactions are not allowed. |
| Expected During Alpha | Yes |
| Workaround | Use Xendit test payment flow only. |
| Report As Bug If | Bot or dashboard directs tester to production payment. |

---

### PAY-KI-002 — Payment Method Selection May Be Gateway-Driven

| Field | Detail |
|---|---|
| Status | `Accepted Limitation` |
| Severity | `Low` |
| Area | Payment UX |
| Description | User may select payment method from the gateway-hosted payment link rather than inside the bot. |
| Expected During Alpha | Yes |
| Workaround | Continue payment from Xendit test payment page. |
| Report As Bug If | Selected payment method is not reflected in payment session metadata after completion, if metadata is expected for the tested build. |

---

### WH-KI-001 — Webhook Delivery May Be Delayed

| Field | Detail |
|---|---|
| Status | `Known` |
| Severity | `Medium` |
| Area | Payment Webhook |
| Description | Payment status may not update instantly if webhook delivery or processing is delayed. |
| Expected During Alpha | Sometimes |
| Workaround | Wait for webhook processing or trigger manual reconciliation if available. |
| Report As Bug If | Paid payment remains unpaid after expected webhook processing window and logs show no recovery. |

---

### WH-KI-002 — Duplicate Webhook Must Be Idempotent

| Field | Detail |
|---|---|
| Status | `Known Critical Requirement` |
| Severity | `Critical` if broken |
| Area | Webhook / Idempotency |
| Description | Repeated webhook events must not create duplicate payment records, duplicate order updates, or duplicate notifications. |
| Expected During Alpha | Always idempotent |
| Workaround | None |
| Report As Bug If | Duplicate webhook changes state more than once or creates duplicate records. |

---

## 11. Known Admin / Outlet Dashboard Issues

### ADM-KI-001 — Admin UI May Not Be Final

| Field | Detail |
|---|---|
| Status | `Accepted Limitation` |
| Severity | `Low` |
| Area | Admin Dashboard |
| Description | Visual polish, spacing, empty states, and responsive details may still be incomplete. |
| Expected During Alpha | Yes |
| Workaround | Focus testing on data correctness and operational usability. |
| Report As Bug If | Admin cannot see or process marketplace orders. |

---

### ADM-KI-002 — Manual Status Update May Be Limited

| Field | Detail |
|---|---|
| Status | `Known` |
| Severity | `Medium` |
| Area | Order Management |
| Description | Some manual status transitions may be limited or not final during alpha. |
| Expected During Alpha | Partially |
| Workaround | Use the supported status transitions defined by the test plan. |
| Report As Bug If | Required pickup/order status cannot be updated at all. |

---

## 12. Known Human Handoff Issues

### HO-KI-001 — Handoff Routing May Be Basic

| Field | Detail |
|---|---|
| Status | `Known` |
| Severity | `Medium` |
| Area | Human Handoff |
| Description | Handoff may route to a general internal admin instead of outlet-specific agent depending on build readiness. |
| Expected During Alpha | Partially |
| Workaround | Tester verifies that handoff event is created and visible to admin. |
| Report As Bug If | Customer is told handoff happened but no admin can see or continue the conversation. |

---

### HO-KI-002 — Bot Should Stop Taking Actions After Handoff

| Field | Detail |
|---|---|
| Status | `Known Critical Requirement` |
| Severity | `Critical` if broken |
| Area | Human Handoff |
| Description | Once human takeover is active, bot should not keep modifying cart/order/payment unless explicitly resumed. |
| Expected During Alpha | Bot pauses or restricts automation |
| Workaround | None |
| Report As Bug If | Bot continues checkout/payment/order changes after handoff. |

---

## 13. Known Complaint Issues

### CMP-KI-001 — Complaint Resolution Is Manual

| Field | Detail |
|---|---|
| Status | `Accepted Limitation` |
| Severity | `Low` |
| Area | Complaint |
| Description | Alpha supports complaint intake and handoff, not full complaint case management. |
| Expected During Alpha | Yes |
| Workaround | Admin handles follow-up manually. |
| Report As Bug If | Complaint is not recorded or cannot be seen by admin. |

---

## 14. Known Security and Privacy Issues

### SEC-KI-001 — Test Data Only

| Field | Detail |
|---|---|
| Status | `Accepted Limitation` |
| Severity | `Critical` if violated |
| Area | Privacy |
| Description | Alpha must use dummy data or approved internal test data only. |
| Expected During Alpha | No real customer/payment data |
| Workaround | Use test accounts and test personas. |
| Report As Bug If | Production data appears in alpha. |

---

### SEC-KI-002 — Prompt Injection Must Be Rejected

| Field | Detail |
|---|---|
| Status | `Known Critical Requirement` |
| Severity | `Critical` if broken |
| Area | AI Security |
| Description | Bot must not reveal system prompt, hidden instructions, tool schemas, secrets, or internal policies. |
| Expected During Alpha | Reject and redirect |
| Workaround | None |
| Report As Bug If | Bot reveals internal prompt, credentials, tool calls, or hidden instructions. |

---

### SEC-KI-003 — Payment Status Cannot Be Changed by Chat Claim

| Field | Detail |
|---|---|
| Status | `Known Critical Requirement` |
| Severity | `Critical` if broken |
| Area | Payment Security |
| Description | A message such as “saya sudah bayar” must not directly mark payment as paid. Payment status must be updated only through trusted backend/payment verification. |
| Expected During Alpha | Bot checks status or waits for webhook |
| Workaround | None |
| Report As Bug If | Chat claim changes payment status to paid. |

---

## 15. Known Observability Issues

### OBS-KI-001 — Some Logs May Be Incomplete

| Field | Detail |
|---|---|
| Status | `Known` |
| Severity | `Medium` |
| Area | Observability |
| Description | Some alpha logs may not yet include all desired fields from `07-observability-checklist.md`. |
| Expected During Alpha | Partially |
| Workaround | Tester should include screenshots, timestamp, channel, outlet, order ID, and payment ID in bug reports. |
| Report As Bug If | Critical order/payment bugs cannot be traced due to missing IDs or missing logs. |

---

### OBS-KI-002 — Dashboard Metrics May Lag

| Field | Detail |
|---|---|
| Status | `Accepted Limitation` |
| Severity | `Low` |
| Area | Monitoring |
| Description | Metrics dashboard may not be real-time during alpha. |
| Expected During Alpha | Yes |
| Workaround | Use direct order/payment records and logs for validation. |
| Report As Bug If | Operational status is misleading for active orders/payments. |

---

## 16. Issues That Must Always Be Reported

Even if something looks similar to a known issue, testers must always report the following:

1. Duplicate order creation.
2. Duplicate payment processing.
3. Payment total different from order total.
4. Order assigned to the wrong outlet.
5. Product price different between cart, order, and payment.
6. Paid order still shown as unpaid after webhook processing.
7. User can checkout unavailable product.
8. Bot creates order/payment without explicit confirmation.
9. Bot answers out-of-scope requests.
10. Bot reveals internal prompt, secrets, or hidden instructions.
11. Customer can see another customer’s data.
12. Admin can see data outside allowed workspace/outlet.
13. Bot continues automated actions after human handoff.
14. Production payment or production customer data appears in alpha.
15. Logs do not allow tracing of a critical order/payment issue.

---

## 17. Known Issues Register

Use this table to track actual known issues during alpha.

| ID | Title | Area | Severity | Status | Workaround | Owner | Target Fix |
|---|---|---|---|---|---|---|---|
| KI-001 | Delivery not available | Fulfillment | Low | Accepted Limitation | Use pickup only | Product | Post-alpha |
| KI-002 | Refund automation unavailable | Payment | Low | Accepted Limitation | Manual handoff | Product | Post-alpha |
| KI-003 | Outlet suggestion is basic | Outlet | Low | Known | Select outlet manually | Engineering | TBD |
| KI-004 | Product images incomplete | Product | Low | Accepted Limitation | Validate text data | Product | TBD |
| KI-005 | Some modifier combinations limited | Product / Cart | Medium | Known | Use predefined modifier data | Engineering | TBD |
| KI-006 | Webhook update may be delayed | Payment | Medium | Known | Wait/check logs | Engineering | TBD |
| KI-007 | Logs may miss some optional fields | Observability | Medium | Known | Include screenshots and IDs | Engineering | TBD |

---

## 18. How to Add a New Known Issue

When a bug is confirmed but not fixed immediately, add it to this document using the template below.

```markdown
### KI-XXX — Issue Title

| Field | Detail |
|---|---|
| Status | `Known` |
| Severity | `Medium` |
| Area | Example: Cart / Payment / Outlet |
| First Found | `YYYY-MM-DD` |
| Description | Clear explanation of the known issue. |
| Expected During Alpha | Yes / No |
| Workaround | What tester should do. |
| Report As Bug If | When this issue becomes worse or breaks a critical flow. |
| Owner | Product / Engineering / QA |
| Target Fix | Alpha / Beta / Post-alpha / TBD |
```

---

## 19. Tester Instructions

Before reporting a bug:

1. Check whether the behavior is listed in this document.
2. Check `01-scope.md` or `alpha-scope-marketplace-order-bot.md`.
3. Check the expected behavior in `03-test-scenarios.md`.
4. If the issue is already known and behaves as documented, do not create a duplicate bug.
5. If the issue affects order integrity, payment integrity, privacy, security, or outlet routing, report it even if it resembles a known issue.

---

## 20. Engineering Triage Notes

During alpha triage, prioritize issues in this order:

1. Payment correctness.
2. Order correctness.
3. Webhook idempotency.
4. Data isolation.
5. AI scope guard and prompt-injection protection.
6. Outlet routing.
7. Cart consistency.
8. Human handoff.
9. Admin operational visibility.
10. UX and copywriting polish.

---

## 21. Review Checklist

Before starting an alpha test cycle:

- [ ] Known issues are updated with the latest build status.
- [ ] Accepted limitations are clear to testers.
- [ ] Critical known requirements are marked.
- [ ] Workarounds are documented.
- [ ] Issues that must always be reported are visible.
- [ ] Tester guide links to this file.
- [ ] Bug template references this file.
- [ ] Product and engineering owners reviewed this file.

---

## 22. Related Documents

- `00-alpha-overview.md`
- `alpha-scope-marketplace-order-bot.md`
- `02-test-plan.md`
- `03-test-scenarios.md`
- `04-test-data.md`
- `05-tester-guide.md`
- `06-bug-report-template.md`
- `07-observability-checklist.md`

---

## 23. Document Maintenance Rule

This file should be updated:

1. Before each alpha test session.
2. After triage confirms a recurring issue.
3. After a fix is deployed.
4. Before retesting begins.
5. Before alpha final report is created.

A known issue is only considered resolved when:

- Fix is deployed to alpha environment.
- Relevant test case passes.
- No regression is found in related order/payment flow.
- Status is changed to `Resolved`.
