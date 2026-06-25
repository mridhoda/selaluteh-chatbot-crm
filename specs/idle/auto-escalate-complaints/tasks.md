---
schema_version: 1
document_type: implementation-plan
spec_id: auto-escalate-complaints
title: SelaluTeh Auto Escalate Complaints Tasks
status: active
workflow_state: in_progress
version: 1.0.0
updated_at: 2026-06-25
development_method: test-driven-development
---

# Implementation Plan: SelaluTeh Auto Escalate Complaints

## Method

```text
RED
→ GREEN
→ REFACTOR
→ VERIFY
```

# Global Completion Rules

- [ ] Failing tests are written and observed first.
- [ ] Complaint remains canonical and is never duplicated.
- [ ] Workspace/outlet isolation is verified.
- [ ] One active escalation invariant is verified.
- [ ] Internal supervisor responses are not customer-visible automatically.
- [ ] Documentation and implementation status are updated.
- [ ] `npm run specs:check` passes.

# 0. Preflight and Domain Audit

- [ ] Confirm spec ID and `AEC-R` prefix.
- [ ] Audit existing complaint/ticket models.
- [ ] Confirm complaint statuses.
- [ ] Confirm outlet membership and supervisor role model.
- [ ] Confirm order-to-outlet linkage.
- [ ] Confirm notification and audit contracts.
- [ ] Find duplicate ticket creation paths.
- [ ] Define MVP supervisor fallback chain.
- [ ] Create deterministic test fixtures.

# 1. Shared Types and Permissions

- [ ] Policy modes.
- [ ] Trigger types.
- [ ] Recipient strategies.
- [ ] Fallback steps.
- [ ] Escalation statuses.
- [ ] Response types.
- [ ] SLA states.
- [ ] Schedule policies.
- [ ] Permissions.
- [ ] Stable errors.

# 2. Supabase Schema and RLS

- [ ] Policies table.
- [ ] Outlet overrides table.
- [ ] Escalations table.
- [ ] Responses table.
- [ ] Assignments table.
- [ ] Scheduled jobs table.
- [ ] Indexes.
- [ ] Active-escalation partial unique constraint.
- [ ] Workspace RLS.
- [ ] Outlet RLS.
- [ ] Service policies.
- [ ] Cross-workspace/outlet tests.

# 3. Workspace Policy Service

- [ ] Read default policy.
- [ ] Create/update policy.
- [ ] Enable/disable.
- [ ] Trigger validation.
- [ ] Recipient validation.
- [ ] Fallback validation.
- [ ] Context inclusion validation.
- [ ] Supervisor SLA validation.
- [ ] Schedule validation.
- [ ] Version conflict.
- [ ] Audit/events.

# 4. Outlet Override Service

- [ ] USE_WORKSPACE_DEFAULT.
- [ ] CUSTOM.
- [ ] DISABLED.
- [ ] Custom trigger overrides.
- [ ] Custom SLA.
- [ ] Primary supervisor override.
- [ ] Effective-policy preview.
- [ ] Configuration health.
- [ ] Versioning.
- [ ] Permission/audit.

# 5. Effective Policy Resolver

- [ ] Load workspace policy.
- [ ] Load outlet override.
- [ ] Resolve inherited/custom fields.
- [ ] Return source metadata.
- [ ] Validate effective policy.
- [ ] Cache safely.
- [ ] Invalidate on change.
- [ ] Unit/property tests.

# 6. Complaint Outlet Resolver

- [ ] Related order outlet.
- [ ] Explicit complaint outlet.
- [ ] Conversation selected outlet.
- [ ] Workspace validation.
- [ ] No text inference.
- [ ] Resolution source metadata.
- [ ] Failure attention event.
- [ ] Integration tests.

# 7. Trigger Matcher

- [ ] Immediate priority.
- [ ] Category.
- [ ] Unassigned timeout.
- [ ] SLA threshold.
- [ ] Repeated customer message.
- [ ] ANY/ALL logic.
- [ ] Manual trigger.
- [ ] Match explanation.
- [ ] Deterministic tests.

# 8. Recipient Resolver

- [ ] Primary supervisor.
- [ ] Active membership check.
- [ ] Permission check.
- [ ] Other supervisor fallback.
- [ ] Outlet manager fallback.
- [ ] Workspace support fallback.
- [ ] Attention alert fallback.
- [ ] Deterministic selection.
- [ ] No unrelated outlet routing.
- [ ] Concurrency-safe round-robin foundation.

# 9. Escalation Creation Service

- [ ] Create escalation snapshot.
- [ ] Policy/trigger/routing snapshot.
- [ ] Idempotency key.
- [ ] One active escalation invariant.
- [ ] Collaborator assignment.
- [ ] Complaint status post-action.
- [ ] SLA deadlines.
- [ ] Notification event.
- [ ] Timeline/audit.
- [ ] Auto/manual race tests.

# 10. Manual Escalation

- [ ] Complaint action.
- [ ] Reason required.
- [ ] Outlet resolution.
- [ ] Recipient preview.
- [ ] Included-context selection.
- [ ] Permission.
- [ ] Duplicate prevention.
- [ ] Timeline/audit.
- [ ] UI modal contract.

# 11. Immediate Event Evaluation

- [ ] Complaint created.
- [ ] Priority changed.
- [ ] Category changed.
- [ ] Outlet resolved.
- [ ] Assignment changed.
- [ ] SLA changed.
- [ ] Customer message received.
- [ ] Event idempotency.
- [ ] Outbox consumer.
- [ ] Failure observability.

# 12. Delayed Scheduler

- [ ] Unassigned timeout jobs.
- [ ] SLA threshold jobs.
- [ ] Outside-hours queue.
- [ ] Expected complaint version.
- [ ] Policy version.
- [ ] Stale-job handling.
- [ ] Retry/backoff.
- [ ] Idempotency.
- [ ] Scheduler metrics.
- [ ] Crash/restart tests.

# 13. Business Hours

- [ ] ANY_TIME.
- [ ] OUTLET_HOURS.
- [ ] SUPERVISOR_SCHEDULE.
- [ ] Outlet timezone.
- [ ] High/critical bypass.
- [ ] Queue-until-open.
- [ ] Workspace fallback outside hours.
- [ ] Timezone/DST tests.
- [ ] Configuration UI.

# 14. Supervisor SLA

- [ ] Acknowledgement deadline.
- [ ] First response deadline.
- [ ] Resolution proposal deadline.
- [ ] ON_TRACK.
- [ ] WARNING.
- [ ] BREACHED.
- [ ] PAUSED.
- [ ] COMPLETED.
- [ ] Warning/breach jobs.
- [ ] Attention events.
- [ ] Separate customer SLA display.

# 15. Supervisor Notification

- [ ] In-app notification.
- [ ] Dashboard attention.
- [ ] Safe payload.
- [ ] Notification template.
- [ ] Delivery idempotency.
- [ ] Retry.
- [ ] Delivery history.
- [ ] Optional email/push contract.
- [ ] No sensitive data leakage.

# 16. Supervisor Queue

- [ ] Pending acknowledgement.
- [ ] Acknowledged.
- [ ] Awaiting response.
- [ ] Breached.
- [ ] Filters.
- [ ] Stable sort/pagination.
- [ ] Scope-correct counts.
- [ ] Outlet isolation.
- [ ] Quick actions.
- [ ] No N+1.

# 17. Acknowledgement

- [ ] Eligible recipient validation.
- [ ] Atomic single-owner acknowledgement.
- [ ] Timestamp/actor.
- [ ] Stop acknowledgement SLA.
- [ ] Duplicate acknowledgement.
- [ ] Version conflict.
- [ ] Timeline/audit/event.
- [ ] Two-supervisor race tests.

# 18. Internal Response

- [ ] MESSAGE.
- [ ] REQUEST_INFORMATION.
- [ ] PROPOSED_RESOLUTION.
- [ ] APPROVAL.
- [ ] REJECTION.
- [ ] SYSTEM_EVENT.
- [ ] Append-only history.
- [ ] Internal visibility.
- [ ] No automatic customer send.
- [ ] Timeline/audit/events.

# 19. Proposed Resolution

- [ ] Remake product.
- [ ] Pickup replacement.
- [ ] Request evidence.
- [ ] Investigate stock.
- [ ] Propose refund.
- [ ] Propose voucher.
- [ ] No direct payment/inventory mutation.
- [ ] CS review.
- [ ] Accept/reject proposal history.

# 20. Completion and Cancellation

- [ ] Complete escalation.
- [ ] Completion reason.
- [ ] Cancel escalation.
- [ ] Cancellation reason.
- [ ] Stop SLA jobs.
- [ ] Preserve history.
- [ ] Complaint remains separate.
- [ ] Re-escalation eligibility.
- [ ] Timeline/audit/events.

# 21. Reassignment and Re-escalation

- [ ] Reassign in same outlet.
- [ ] Recipient eligibility.
- [ ] End prior assignment.
- [ ] Notify new recipient.
- [ ] Prevent duplicate notification.
- [ ] Parent escalation linkage.
- [ ] Reason required.
- [ ] Cross-outlet exceptional guard.
- [ ] Concurrency tests.

# 22. Settings UI

- [ ] Auto Escalation toggle.
- [ ] Trigger cards.
- [ ] ANY/ALL selector.
- [ ] Recipient strategy.
- [ ] Fallback order.
- [ ] Included context.
- [ ] After-escalation behavior.
- [ ] Supervisor SLA.
- [ ] Notification channels.
- [ ] Business hours.
- [ ] Validation.
- [ ] Version conflict.
- [ ] Effective policy summary.

# 23. Outlet Override UI

- [ ] Outlet list.
- [ ] Mode.
- [ ] Enabled state.
- [ ] Primary supervisor.
- [ ] Trigger summary.
- [ ] Configuration health.
- [ ] Missing supervisor filter.
- [ ] Override drawer/page.
- [ ] Bulk enable confirmation.
- [ ] Permission states.

# 24. Complaint Detail Integration

- [ ] Escalation banner.
- [ ] Trigger source.
- [ ] Supervisor/outlet.
- [ ] Escalation status.
- [ ] Supervisor SLA.
- [ ] Latest response.
- [ ] Escalate/View action.
- [ ] Reassign/cancel/complete.
- [ ] Separate statuses.
- [ ] Responsive layout.

# 25. Timeline and History

- [ ] Created.
- [ ] Routing.
- [ ] Fallback.
- [ ] Notification.
- [ ] Acknowledgement.
- [ ] Response.
- [ ] Reassignment.
- [ ] SLA warning/breach.
- [ ] Completion/cancellation.
- [ ] Current/history read model.
- [ ] Pagination.
- [ ] Sensitive data minimization.

# 26. Customer Notification Option

- [ ] NONE default.
- [ ] Investigating message option.
- [ ] Channel contract.
- [ ] Approved template.
- [ ] Idempotency.
- [ ] No internal personnel details.
- [ ] Delivery failure isolation.
- [ ] Audit.

# 27. API Contracts

- [ ] Settings APIs.
- [ ] Override APIs.
- [ ] Manual escalation.
- [ ] Escalation list/detail.
- [ ] Acknowledge.
- [ ] Respond.
- [ ] Reassign.
- [ ] Complete/cancel.
- [ ] Re-escalate.
- [ ] Evaluation preview/history.
- [ ] Strict schemas.
- [ ] Stable errors.
- [ ] Permission documentation.

# 28. Events, Audit, Metrics, and Alerts

- [ ] Evaluation events.
- [ ] Creation/routing events.
- [ ] Acknowledge/response events.
- [ ] Complete/cancel events.
- [ ] SLA events.
- [ ] Policy events.
- [ ] Outbox.
- [ ] Audit actor/reason.
- [ ] Metrics.
- [ ] Routing-failure alert.
- [ ] Missing-supervisor alert.
- [ ] Scheduler-backlog alert.
- [ ] Notification-failure alert.

# 29. Authorization and RLS Matrix

- [ ] Workspace owner/admin.
- [ ] Support manager.
- [ ] CS agent.
- [ ] Outlet manager.
- [ ] Outlet supervisor.
- [ ] Notification service.
- [ ] Scheduler service.
- [ ] Other-outlet denial.
- [ ] Cross-workspace denial.
- [ ] Unscoped list/count denial.
- [ ] Settings permission.
- [ ] Response visibility.

# 30. Security Test Matrix

- [ ] Hard-coded/spoofed supervisor.
- [ ] Other-outlet routing.
- [ ] Cross-workspace complaint.
- [ ] Internal note leakage.
- [ ] Full phone in external notification.
- [ ] Unauthorized policy change.
- [ ] Unauthorized response.
- [ ] Duplicate active escalation.
- [ ] Customer message prompt injection.
- [ ] Raw payment payload leakage.
- [ ] Forged membership context.

# 31. Property and Concurrency Tests

Properties:

- [ ] One active escalation per complaint/outlet/level.
- [ ] Related order outlet wins over weaker sources.
- [ ] Other outlet never receives details.
- [ ] Same event/idempotency key has one effect.
- [ ] Internal response never auto-sends to customer.
- [ ] Historical escalation snapshot is not rewritten.

Concurrency:

- [ ] Auto vs manual escalation.
- [ ] Two acknowledgements.
- [ ] Respond vs cancel.
- [ ] Reassign vs acknowledge.
- [ ] Policy update vs scheduled job.
- [ ] Two scheduler workers.
- [ ] Re-escalate vs completion.

# 32. Resilience Tests

- [ ] Order lookup failure.
- [ ] Outlet lookup failure.
- [ ] Membership service failure.
- [ ] Notification failure.
- [ ] Audit/outbox failure.
- [ ] Scheduler retry.
- [ ] Database transaction failure.
- [ ] Stale event.
- [ ] Invalid policy.
- [ ] No eligible supervisor.
- [ ] Worker crash/restart.

# 33. Performance and Scale

- [ ] Many workspaces/outlets.
- [ ] Large supervisor queue.
- [ ] High complaint event volume.
- [ ] Scheduler throughput.
- [ ] Policy cache.
- [ ] Queue list benchmarks.
- [ ] Index/query plan.
- [ ] Bounded snapshots.
- [ ] No N+1.
- [ ] Metrics cardinality review.

# 34. Migration and Rollout

- [ ] Audit complaint/ticket duplication.
- [ ] Audit outlet supervisor assignments.
- [ ] Add schema and RLS.
- [ ] Add workspace policy disabled by default.
- [ ] Add outlet overrides.
- [ ] Add supervisor queue.
- [ ] Add complaint detail integration.
- [ ] Configure one test outlet.
- [ ] Internal alpha.
- [ ] Validate fallback.
- [ ] Expand outlet rollout.
- [ ] Document rollback.
- [ ] Update implementation status honestly.

# 35. Alpha End-to-End Validation

```text
HIGH complaint created
→ related order outlet resolved
→ workspace policy matched
→ primary supervisor selected
→ escalation created once
→ supervisor notified
→ supervisor acknowledges
→ supervisor proposes resolution
→ CS sends official reply
→ escalation completed
→ complaint resolved separately
```

- [ ] High priority immediate.
- [ ] Medium unassigned timeout.
- [ ] No related order fallback outlet source.
- [ ] Missing supervisor fallback.
- [ ] Other outlet denial.
- [ ] Auto/manual race.
- [ ] Duplicate event.
- [ ] Notification retry.
- [ ] SLA warning/breach.
- [ ] Internal response not customer-visible.
- [ ] Reassignment.
- [ ] Cancellation/re-escalation.

# 36. Fastest Safe Alpha Slice

Implement first:

```text
0 audit
1 types/permissions
2 schema/RLS
3 workspace policy
4 outlet override
5 effective policy
6 outlet resolver
7 priority/unassigned triggers
8 primary supervisor/fallback
9 escalation creation
10 manual escalation
11 immediate events
12 scheduler
14 supervisor SLA
15 notification
16 queue
17 acknowledge
18 internal response
20 complete/cancel
22 settings UI
23 outlet override UI
24 complaint detail
25 timeline/history
27 APIs
28 events/audit/metrics
29 authorization
30 security
31 property/concurrency
32 resilience
34 rollout
35 E2E
```

May defer:

```text
category combinations
repeated customer message trigger
round robin
all-supervisor notification
advanced business schedules
email/push/WhatsApp operations
multi-level escalation
advanced analytics
```

# 37. Final Validation

Commands:

```text
npm run specs:check
npm run test:auto-escalate:unit
npm run test:auto-escalate:component
npm run test:auto-escalate:integration
npm run test:auto-escalate:security
npm run test:auto-escalate:property
npm run test:auto-escalate:concurrency
npm run test:auto-escalate:resilience
npm run test:auto-escalate:scheduler
npm run test:auto-escalate:notifications
npm run test:auto-escalate:performance
npm run test:auto-escalate:e2e
npm run test:auto-escalate:all
```

# Requirement Traceability

| Requirements | Task Sections |
|---|---|
| AEC-R1–R6 | 0–5 |
| AEC-R7–R16 | 6–13 |
| AEC-R17–R26 | 8–16 |
| AEC-R27–R39 | 17–26 |
| AEC-R40–R49 | 11–27 |
| AEC-R50–R60 | 28–37 |

# Definition of Done

```text
all P0 tasks complete
approved P1 deferrals documented
complaint duplication prevented
correct outlet and supervisor routing proven
fallback proven
one active escalation proven
CS remains primary handler by default
internal response remains internal
customer and supervisor SLA separated
workspace/outlet isolation proven
all release-gate tests pass
implementation status reflects repository reality
specs check passes
```
