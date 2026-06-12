# QA Process

## QA Cadence

| When | QA Activity |
|---|---|
| Every PR | Unit tests, lint, targeted integration tests |
| Before staging deploy | Full integration + smoke E2E |
| Before production deploy | Regression checklist + security smoke |
| Before DB migration | Migration dry run + data validation |
| Before payment launch | Sandbox payment full flow |

## Bug Severity

| Severity | Definition | Examples |
|---|---|---|
| Critical | Data loss/security/payment corruption | Cross-workspace data leak, fake paid order accepted |
| High | Core flow broken | Telegram webhook fails, checkout cannot complete |
| Medium | Important but workaround exists | Admin UI order filter broken |
| Low | Cosmetic/minor | Typo in admin label |

## Release Decision

Release is blocked by:

- Any Critical bug.
- High bug in auth, webhook, checkout, payment, or workspace isolation.
- Failed payment webhook validation.
- Failed migration validation for required references.

## QA Artifacts

For each release, keep:

```txt
qa-report-YYYY-MM-DD.md
regression-results.md
known-issues.md
release-decision.md
```

## Manual QA Template

```md
# QA Report

## Build/Commit

## Environment

## Scope Tested

## Passed

## Failed

## Blockers

## Known Issues

## Release Decision
```
