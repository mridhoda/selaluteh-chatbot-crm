# Background Job Operations

## Current/Future Jobs

Potential jobs:

- follow-up scheduler
- webhook processing worker
- AI reply worker
- payment notification worker
- cart expiration worker
- checkout expiration worker
- file cleanup worker
- backup job

## Operational Rules

- Jobs should be idempotent.
- Jobs should log start/end/error.
- Jobs should not process cross-workspace data incorrectly.
- Failed jobs should be retryable where safe.
- Payment jobs require extra caution.

## Job Monitoring

Track:

- job success count
- job failure count
- retry count
- processing duration
- stuck jobs
- queue depth if queue exists

## Job Failure Procedure

1. Identify job type.
2. Check logs.
3. Check affected records.
4. Retry only if idempotent.
5. For payment job, verify provider state before retry.
6. Record incident if customer/order affected.

## Scheduler Deployment Rule

During cutover:

- stop scheduler before final export
- run migration
- start scheduler after backend verified
