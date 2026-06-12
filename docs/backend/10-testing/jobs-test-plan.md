# Jobs Test Plan

## Goal

Memastikan background jobs aman dan tidak membuat duplicate side effects.

## Jobs to Test

| Job | Expected Behavior |
|---|---|
| AI reply job | Generates reply once and stores message |
| Follow-up job | Sends follow-up only when eligible |
| Payment status sync | Reconciles pending payment safely |
| Notification job | Sends Telegram/admin notification once |
| File cleanup job | Deletes temp files only |

## Test Cases

### Retry Safety

- Job fails before provider send.
- Job retries and sends once.
- Job fails after provider send but before DB update.
- Idempotency key prevents duplicate send if retried.

### Locking

- Two workers pick same job.
- Only one performs side effect.

### Follow-Up Rules

- No follow-up if chat resolved.
- No follow-up if takeover active unless rule allows.
- No follow-up across wrong workspace.

## Acceptance

- Jobs are idempotent.
- Job errors are logged.
- Failed jobs are inspectable.
- No payment/order state corruption.
