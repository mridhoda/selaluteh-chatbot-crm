---
schema_version: 1
document_type: implementation-plan
spec_id: thermal-print-specs
title: SelaluTeh Thermal Print Tasks
status: active
workflow_state: in_progress
version: 1.0.0
updated_at: 2026-06-25
development_method: test-driven-development
---

# Implementation Plan: SelaluTeh Thermal Print

## Method

```text
RED → GREEN → REFACTOR → VERIFY
```

# 0. Preflight and Hardware Audit
- [x] Confirm `thermal-print-specs`.
- [x] Confirm Linux, Windows, Android.
- [x] Confirm Browser Print and Cleanter alpha paths.
- [ ] Record exact Inforce model, width, encoding, ESC/POS, cutter/logo/QR.
- [ ] Record Android pairing/Cleanter result.
- [ ] Document desktop physical-print limitations.

# 1. Shared Types and Permissions
- [x] Platforms, transports, documents, purposes.
- [x] Job states and evidence.
- [x] Stable errors and capabilities.
- [ ] Printing permissions.
- [x] Serialization tests.

# 2. Supabase Schema and RLS
- [ ] Profiles, templates, stations, bindings, jobs, attempts.
- [ ] Constraints, indexes, version fields.
- [ ] Workspace/outlet RLS.
- [ ] Append-only attempts.
- [ ] Cross-tenant/outlet tests.

# 3. Printer Profiles
- [ ] CRUD/archive.
- [ ] Width, line count, encoding, capability validation.
- [ ] Versioning, audit, events.

# 4. Receipt Templates
- [ ] Structured schema.
- [ ] Workspace default and outlet override.
- [ ] 58/80 mm.
- [ ] Draft/publish/archive.
- [ ] Immutable versions.
- [ ] Sanitization and snapshot tests.

# 5. Print Stations and Bindings
- [ ] Device identifier.
- [ ] Register/approve station.
- [ ] Platform/transport/outlet.
- [ ] Default station.
- [ ] Local printer binding by purpose.
- [ ] Permission/version/audit tests.

# 6. Canonical Snapshot Builder
- [ ] Order snapshot contract.
- [ ] Payments read contract.
- [ ] Outlet snapshot contract.
- [x] PII masking.
- [x] TEST/LIVE.
- [x] Reprint metadata and hash.
- [x] Deterministic fixtures.

# 7. Eligibility
- [x] Invoice, customer receipt, kitchen, refund, test-page rules.
- [x] Verified PAID rule.
- [ ] Outlet permission.
- [x] Stable reason codes.
- [x] Security tests.

# 8. HTML Renderer
- [x] 58/80 mm.
- [x] Items/modifiers/totals.
- [x] Separate order/payment status.
- [x] Queue, test, reprint, footer.
- [x] Print CSS and visual regression.

# 9. ESC/POS Renderer
- [x] Init/alignment/bold/columns/wrap/feed.
- [ ] Optional cut/logo/QR.
- [x] Encoding.
- [x] Binary fixtures.
- [x] Payload sizing/chunk readiness.

# 10. Mock Transport
- [ ] Success.
- [ ] Offline/timeout/unsupported/payload failures.
- [ ] Export HTML/text/binary.
- [ ] Never claim physical print.

# 11. Browser Print
- [ ] Linux and Windows.
- [ ] Dedicated route.
- [x] User gesture and window.print.
- [x] DISPATCHED only.
- [x] User confirmation and Save PDF fallback.
- [x] Cancel/unavailable cases.

# 12. Android Cleanter
- [x] Detect support.
- [x] Safe bytes/base64/deep link.
- [x] No token.
- [x] Payload limits.
- [x] User gesture.
- [x] DISPATCHED only.
- [ ] Install/setup guidance.
- [ ] Retry and physical Inforce test.

# 13. QZ / Local Agent
- [ ] Adapter and bridge availability.
- [ ] Discovery and raw send.
- [ ] Trust/signing model.
- [ ] Safe acknowledgment.
- [ ] Browser Print fallback.
- [ ] Defer until validated if outside alpha.

# 14. Web Bluetooth Experimental
- [ ] Feature flag.
- [ ] Secure context.
- [ ] Known GATT configuration.
- [ ] Writable characteristic, chunking, timeout, reconnect.
- [ ] Explicit permission and fallback.

# 15. Print Job and Attempt Services
- [ ] Create job with idempotency/hash.
- [ ] Snapshot/template/profile/station resolution.
- [ ] Lifecycle, expiry, cancel, retry.
- [ ] Append attempts.
- [ ] Payload hash/size/result/evidence.
- [ ] Audit/events.
- [ ] Double-click suppression.

# 16. Completion Evidence
- [ ] NONE, USER_CONFIRMED, TRANSPORT_ACK, DEVICE_STATUS, ADMIN_OVERRIDE.
- [x] Browser/Cleanter no auto-complete.
- [x] Honest UI wording.
- [ ] Override reason and audit.

# 17. Reprint and Copies
- [ ] Explicit reprint.
- [ ] Original snapshot link.
- [ ] Marker/time/reason.
- [ ] Copy limits.
- [ ] Refund/correction boundary.
- [ ] Permission/idempotency tests.

# 18. Test Print
- [ ] TEST_PAGE data.
- [ ] Platform/transport/profile/width/encoding.
- [ ] Character/alignment/bold samples.
- [ ] Optional logo/QR.
- [ ] Separate history.

# 19. Orders Sidebar and Preview
- [x] Printing card.
- [x] Eligibility, station, transport, profile, evidence, error.
- [ ] Preview/Print/Reprint/Test/History/Settings.
- [x] Capability/permission states.
- [x] Responsive desktop/tablet.
- [x] Offline preview.

# 20. Print History
- [ ] Filters and pagination.
- [ ] Job/attempt detail.
- [ ] Evidence and safe errors.
- [ ] Test/live distinction.
- [ ] Scope-correct counts and query plans.

# 21. Setup UI
- [ ] Linux Browser Print and optional bridge.
- [ ] Windows Browser Print/system printer and optional bridge.
- [ ] Android Cleanter install/pair/select/start/bind/test.
- [ ] Width/encoding verification.
- [ ] Troubleshooting.

# 22. Auto-Print Foundation
- [ ] Disabled by default.
- [ ] Per-outlet trigger policy.
- [ ] Atomic claim/lease.
- [ ] One winner, expiry, duplicate suppression.
- [ ] Keep production auto-print deferred for alpha.

# 23. Station Health
- [ ] Heartbeat.
- [ ] ONLINE/DEGRADED/OFFLINE.
- [ ] Bridge, binding, recent failure.
- [ ] No fabricated paper state.
- [ ] Metrics/alerts.

# 24. API Contracts
- [ ] Profiles/templates/stations/bindings.
- [ ] Jobs/attempts/render/dispatch/complete/fail/cancel/retry/reprint.
- [ ] Test jobs.
- [ ] Strict schemas, stable errors, permissions, idempotency/versioning.

# 25. Events, Audit, Metrics
- [ ] Job/attempt/station/profile/template/reprint/test events.
- [ ] Outbox.
- [ ] Actor/reason/correlation.
- [ ] Metrics and alerts.
- [ ] PII/secret redaction.

# 26. Security and RLS Matrix
- [ ] Workspace owner/admin, outlet manager/staff, printing admin, service identity.
- [x] Fake PAID request.
- [ ] Other-outlet print.
- [ ] Client-supplied price.
- [x] Arbitrary template code.
- [x] Token in local print payload.
- [ ] Untrusted bridge.
- [ ] Unauthorized reprint/override.
- [ ] Unscoped list/count.

# 27. Property and Concurrency
- [ ] Deterministic render.
- [x] Verified PAID only.
- [ ] One key one job.
- [ ] Explicit reprint separate job.
- [x] Dispatch != physical completion.
- [ ] Cross-outlet denial.
- [ ] Double click, claims, retry/cancel, complete/fail, lease, station reassignment.

# 28. Resilience
- [ ] Orders/Payments/template unavailable.
- [ ] Station offline.
- [x] Browser dialog cancelled.
- [x] Cleanter unavailable.
- [ ] Bridge unavailable.
- [ ] Render/payload/DB/outbox failures.
- [ ] Retry recovery.
- [ ] Order remains unaffected.

# 29. Visual and Binary Regression
- [ ] 58/80 mm.
- [ ] Long names, many modifiers, large totals.
- [ ] Test and reprint markers.
- [ ] Invoice and refund.
- [x] ESC/POS init/alignment/bold/feed/cut/encoding fixtures.

# 30. Manual Linux Test
- [ ] Preview.
- [ ] Browser Print.
- [ ] Save PDF.
- [ ] Cancel.
- [ ] Mock success/failure.
- [ ] Optional bridge.
- [ ] No-printer fallback.
- [ ] Record result.

# 31. Manual Windows Test
- [ ] Preview.
- [ ] Browser Print.
- [ ] Installed printer.
- [ ] Save PDF/cancel.
- [ ] Optional bridge.
- [ ] Record result.

# 32. Manual Android + Inforce
- [ ] Physical Android device and Chrome.
- [ ] Install Cleanter.
- [ ] Pair/select Inforce.
- [ ] Register station and bind 58 mm profile.
- [ ] Test page and customer receipt.
- [ ] Long-text, disconnect/reconnect, missing Cleanter, retry/reprint.
- [ ] Record model and result.

# 33. Performance
- [ ] Snapshot/render benchmarks.
- [ ] Payload limits.
- [ ] Large history/many stations.
- [ ] Heartbeat and claim load.
- [ ] Query plans and bounded responses.

# 34. Rollout
- [ ] Migrations/RLS.
- [ ] Default templates/profiles.
- [x] Sidebar and preview.
- [x] Enable Mock, Browser Print, Cleanter.
- [ ] Physical Inforce validation.
- [ ] QZ/local agent and auto-print disabled until validated.
- [ ] Rollback and honest implementation status.

# 35. Alpha E2E
- [ ] Completed paid order.
- [x] Preview and create job.
- [ ] Linux Browser Print.
- [ ] Windows Browser Print.
- [ ] Android Cleanter physical print.
- [ ] Evidence/history/reprint.
- [ ] Test marker, unpaid denial, other-outlet denial.
- [ ] Double-click suppression and printer-failure isolation.

# 36. Fastest Safe Alpha Slice

```text
0–12
15–21
24–32
34–35
```

Deferred:

```text
QZ / Local Agent
Web Bluetooth
production auto-print
kitchen ticket
refund receipt
advanced logo/QR
offline queue
advanced printer status
```

# 37. Final Validation

```text
npm run specs:check
npm run test:thermal-print:unit
npm run test:thermal-print:component
npm run test:thermal-print:integration
npm run test:thermal-print:security
npm run test:thermal-print:property
npm run test:thermal-print:concurrency
npm run test:thermal-print:resilience
npm run test:thermal-print:visual
npm run test:thermal-print:binary
npm run test:thermal-print:e2e
npm run test:thermal-print:all
```

# Traceability

| Requirements | Tasks |
|---|---|
| TP-R1–R10 | 0–7 |
| TP-R11–R20 | 3–6, 8–10 |
| TP-R21–R30 | 8–16 |
| TP-R31–R40 | 15–23 |
| TP-R41–R50 | 19–37 |

# Definition of Done

```text
all P0 complete
approved deferrals documented
Linux/Windows Browser Print validated
Android Cleanter + Inforce validated
Mock validated
verified payment and snapshot authority proven
honest evidence and reprint/idempotency proven
workspace/outlet isolation proven
printer failure does not affect order
release gates and specs check pass
```
