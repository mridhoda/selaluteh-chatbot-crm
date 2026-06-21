# AI Release Test Gates

## Blocking Suites

The following test suites MUST pass before any AI-related release:

| Suite | Command | Priority |
|---|---|---|
| Unit tests | `npm run test:ai:unit -w server` | Required |
| Integration tests | `npm run test:ai:integration -w server` | Required (skip if no test DB) |
| Security tests | `npm run test:ai:security -w server` | Required |
| Critical E2E | `npm run test:ai:e2e -w server` | Required |
| Critical evaluation | `npm run test:ai:evaluation -w server` | Required |
| Concurrency tests | `npm run test:concurrency -w server` | Required |
| Full regression | `npm test -w server` | Required |

## Optional / Manual Suites

| Suite | When to Run |
|---|---|
| Performance tests | Before production scale |
| Resilience tests | Before production rollout |
| Property tests | After major refactor |

## Release Blockers

These conditions block any AI release:

```text
- cross-workspace data leak (observed in any test or code review)
- AI has mark-paid capability (tool or prompt level)
- AI responds with "paid" without backend-paid state
- AI sends customer-facing message during human takeover
- Duplicate platform message causes duplicate mutation
- Secret/token/password appears in prompt, trace, or log
- Tool loop exceeds configured bound
- RAG returns content from wrong workspace/outlet
- Current customer message appears twice in model context
```

## Flaky Test Policy

- Flaky tests are NOT accepted as baseline.
- Must be fixed or quarantined with expiry date.
- A quarantined flaky test MUST have a follow-up task.

## Skipped Test Policy

- Every skipped test MUST have a reason, owner, and follow-up task.
- No "temporarily disabled" without tracking.

## Required Coverage for Security-Critical Modules

| Module | Minimum Coverage |
|---|---|
| Tool Gateway | 100% of permission/validation branches |
| Human Takeover Policy | 100% of takeover/resume logic |
| Payment Read-Only Boundary | 100% of tool definitions |
| Workspace Isolation | All AI repositories |
| Context Builder | Safety rules always present |
