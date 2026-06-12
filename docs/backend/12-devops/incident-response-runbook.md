# Incident Response Runbook

## Incident Definition

An incident is any event that affects:

- customer chat flow
- admin dashboard
- order/payment correctness
- data privacy
- webhook processing
- file/media availability
- AI response reliability

## Severity Levels

| Severity | Meaning | Examples |
|---|---|---|
| SEV-1 | Critical production outage/security/payment issue | data leak, fake paid order, backend down |
| SEV-2 | Major feature broken | Telegram down, payment webhook failing |
| SEV-3 | Partial degradation | AI provider failing, delayed messages |
| SEV-4 | Minor issue | UI glitch, non-critical logs |

## Incident Steps

### 1. Detect

Sources:

- logs
- alerts
- admin report
- customer report
- payment provider dashboard
- Telegram webhook errors

### 2. Triage

Identify:

- affected feature
- start time
- impacted users/workspaces
- data/payment impact
- whether to pause webhooks

### 3. Contain

Possible actions:

- disable webhook temporarily
- disable payment checkout
- switch AI fallback provider
- enable maintenance message
- rollback deployment
- block risky endpoint

### 4. Fix

Apply smallest safe fix.

### 5. Verify

Run targeted smoke tests.

### 6. Communicate

Notify stakeholders if needed.

### 7. Postmortem

Record:

- timeline
- root cause
- impact
- fix
- prevention

## Incident Template

```md
# Incident Report

Date:
Severity:
Status:
Detected by:
Start time:
End time:

## Summary

## Impact

## Timeline

## Root Cause

## Resolution

## Follow-up Actions
```
