---

# FILE: README.md

# 12 Ops

Folder ini berisi dokumentasi operasional untuk **SelaluTeh Chatbot CRM — Telegram Marketplace MVP**.

Folder ini menjawab pertanyaan:

- Bagaimana deploy backend?
- Bagaimana rollback?
- Bagaimana backup dan restore?
- Bagaimana menangani incident?
- Bagaimana monitor webhook, payment, AI, jobs, dan storage?
- Apa checklist sebelum/selama/setelah release?
- Apa yang harus dilakukan ketika Telegram/payment/webhook error?

## Folder Purpose

`12-ops` fokus pada **production operations**, bukan product requirement, API spec, database schema, atau sprint planning.

Gunakan folder ini untuk:

- Runbook harian.
- Deployment.
- Rollback.
- Incident response.
- Backup/restore.
- Observability.
- Maintenance window.
- Disaster recovery.
- Operational checklists.
- Troubleshooting.

## Project Context

Backend saat ini/target:

```txt
Existing Chatbot CRM
+ Telegram webhook
+ Meta/WhatsApp/Instagram webhook
+ AI agents
+ Inbox/chat history
+ Human takeover
+ Product/cart/checkout/payment MVP
+ Supabase/Postgres migration path
+ Local server storage for media
```

## Recommended Reading Order

1. `ops-overview.md`
2. `production-readiness.md`
3. `deployment-runbook.md`
4. `release-runbook.md`
5. `rollback-runbook.md`
6. `backup-restore-runbook.md`
7. `incident-response-runbook.md`
8. `monitoring-alerting.md`
9. `troubleshooting.md`

## Folder Boundary

Put here:

- operational procedures
- server maintenance
- backup/restore
- incident response
- rollback
- monitoring
- deployment
- production checklists

Do not put here:

- API contracts → `05-api-spec`
- schema/migration design → `06-data`
- security policy design → `08-security`
- sprint tasks → `11-sprint`
- business planning → `0000-business`


---

# FILE: ops-overview.md

# Ops Overview

## Operational Goal

Keep the backend reliable, recoverable, observable, and safe during MVP development and production operation.

## System Components to Operate

| Component | Responsibility |
|---|---|
| Backend API | Auth, dashboard APIs, commerce, webhooks |
| Frontend dashboard | Admin UI |
| Database | MongoDB current runtime or Supabase/Postgres target |
| Local uploads | Chat media, payment proof, product images, agent files |
| Telegram webhook | Customer bot interaction |
| Meta webhook | WhatsApp/Instagram inbound messages |
| Payment webhook | Payment status updates |
| AI providers | OpenAI/Gemini reply generation |
| Background jobs | Follow-ups, queued tasks, future workers |
| Logs/metrics | Debugging and alerting |

## Highest Operational Priorities

1. Do not lose data.
2. Do not lose local uploads.
3. Do not expose secrets.
4. Keep webhook processing idempotent.
5. Keep payment webhook secure.
6. Preserve existing CRM behavior.
7. Keep rollback path available.
8. Monitor errors before users report them.

## Critical Paths

### Telegram Commerce Path

```txt
Telegram webhook
→ contact/chat resolution
→ product/cart/checkout
→ order creation
→ payment link
→ payment webhook
→ order paid notification
```

### CRM Support Path

```txt
Incoming chat
→ message saved
→ AI reply or human takeover
→ admin inbox update
```

### Payment Path

```txt
Checkout
→ payment provider
→ webhook
→ payment event
→ payment status
→ order status
→ notification
```

## Operational Rule

If a system change touches payment, webhook, database migration, or local uploads, treat it as high risk and follow release + rollback checklists.


---

# FILE: production-readiness.md

# Production Readiness

## Required Before Production

### Security

- [ ] Orders routes require auth.
- [ ] Complaints routes require auth.
- [ ] Workspace isolation tested.
- [ ] Diagnostic routes removed/protected.
- [ ] Payment webhook signature verified.
- [ ] Webhook idempotency implemented.
- [ ] Secrets are not committed.
- [ ] Service role key is server-side only.

### Data

- [ ] Database backup process exists.
- [ ] Uploads backup process exists.
- [ ] Restore process tested.
- [ ] Local uploads are mounted as persistent volume.
- [ ] Migration scripts tested in staging.
- [ ] Data validation queries prepared.

### Webhooks

- [ ] Telegram webhook URL uses HTTPS.
- [ ] Meta webhook verification works.
- [ ] Payment webhook endpoint is reachable.
- [ ] Duplicate webhook handling tested.
- [ ] Webhook logs include event ids.

### Payment

- [ ] Sandbox payment flow tested.
- [ ] Payment event logging exists.
- [ ] Payment status transition rules implemented.
- [ ] Paid notification tested.
- [ ] Failed/expired payment handling documented.

### Observability

- [ ] Request logs available.
- [ ] Error logs available.
- [ ] Webhook logs searchable.
- [ ] Payment event logs searchable.
- [ ] AI provider errors visible.
- [ ] Alerting threshold defined.

### Deployment

- [ ] Env variables documented.
- [ ] Build command tested.
- [ ] Start command tested.
- [ ] Rollback plan documented.
- [ ] Smoke tests documented.
- [ ] Maintenance window process documented.

## Production Blockers

Do not go production if any of these are true:

- Payment webhook can be spoofed.
- Orders/complaints are public.
- Local uploads are not persistent.
- There is no database backup.
- Service role key is exposed to frontend.
- Telegram duplicate webhook can create duplicate paid orders.
- No rollback path exists.


---

# FILE: deployment-runbook.md

# Deployment Runbook

## Goal

Deploy backend/frontend safely without breaking CRM, Telegram bot, payment webhook, or local file storage.

## Pre-Deployment Checklist

- [ ] Current branch is correct.
- [ ] Latest code is pulled.
- [ ] Dependencies installed.
- [ ] Env variables verified.
- [ ] Database connection verified.
- [ ] Upload directory exists.
- [ ] Upload directory is persistent.
- [ ] Payment provider sandbox/production mode confirmed.
- [ ] Telegram webhook public URL confirmed.
- [ ] Backup completed if deployment touches data.
- [ ] Rollback version identified.

## Deployment Steps

### 1. Announce Deployment

If production:

```txt
Announce short maintenance or low-risk deploy window.
```

### 2. Backup Critical Data

Backup:

- database
- uploads directory
- env/config snapshot if needed

### 3. Deploy Backend

Typical steps:

```bash
git pull
npm --prefix server install
npm --prefix server run build # if build exists
pm2 restart backend # or docker compose restart server
```

Adjust commands to actual infrastructure.

### 4. Deploy Frontend

Typical steps:

```bash
npm --prefix web install
npm --prefix web run build
```

If Docker:

```bash
docker compose build web server
docker compose up -d
```

### 5. Verify Services

Check:

```txt
GET /health
login
dashboard
inbox
Telegram webhook
payment webhook health
```

### 6. Run Smoke Tests

Minimum:

- login owner
- open dashboard
- open inbox
- send Telegram test message
- human takeover test
- create test product/cart/order if marketplace enabled
- test payment sandbox webhook if payment changed

## Post-Deployment

- [ ] Monitor logs for 15–30 minutes.
- [ ] Check error rate.
- [ ] Check webhook processing.
- [ ] Check payment events.
- [ ] Check AI provider errors.
- [ ] Record deployment in deployment log.

## Deployment Log Template

```md
## YYYY-MM-DD HH:mm — Deployment

Version/commit:
Operator:
Changes:
Backup taken:
Smoke tests:
Issues:
Rollback needed: yes/no
```


---

# FILE: release-runbook.md

# Release Runbook

## Purpose

This runbook is for planned releases.

## Release Types

| Type | Description | Risk |
|---|---|---|
| Patch | Bug fix or docs update | Low |
| Minor | New non-critical feature | Medium |
| Major | Payment/database/webhook/schema change | High |
| Hotfix | Urgent production fix | Medium-High |

## Release Checklist

### Before Release

- [ ] Release scope is clear.
- [ ] Related docs updated.
- [ ] Tests run or documented as not run.
- [ ] Env changes documented.
- [ ] Migration needed? yes/no.
- [ ] Backup needed? yes/no.
- [ ] Rollback plan exists.
- [ ] Owner/admin notified if needed.

### During Release

- [ ] Deploy backend.
- [ ] Deploy frontend if needed.
- [ ] Run DB migration if needed.
- [ ] Restart jobs/workers if needed.
- [ ] Re-enable webhooks if paused.
- [ ] Run smoke tests.

### After Release

- [ ] Monitor logs.
- [ ] Confirm no payment/webhook errors.
- [ ] Confirm dashboard works.
- [ ] Confirm Telegram bot works.
- [ ] Update implementation status.
- [ ] Record release notes.

## High-Risk Release Rule

If release touches:

- payment webhook
- order status
- database migration
- file storage
- Telegram webhook
- auth/workspace access

Then require:

- backup
- staging test
- smoke test
- rollback plan


---

# FILE: rollback-runbook.md

# Rollback Runbook

## Goal

Restore previous working version when deployment causes critical issue.

## When to Rollback

Rollback if:

- Login broken.
- Dashboard inaccessible.
- Telegram webhook broken.
- Payment webhook broken.
- Orders cannot be created/updated.
- Data corruption detected.
- Cross-workspace leak detected.
- Severe error rate spike.
- Local files inaccessible after deploy.

## Rollback Types

### Code Rollback

Use when new code breaks behavior but data is still valid.

Steps:

1. Stop backend or put maintenance mode.
2. Deploy previous commit/image.
3. Restart backend.
4. Run smoke tests.
5. Monitor logs.

### Database Rollback

Use only when migration caused damage.

Warning:

```txt
Database rollback is dangerous if new writes happened after migration.
```

Steps:

1. Stop webhooks.
2. Stop backend writes.
3. Restore database backup.
4. Restore compatible code version.
5. Re-enable webhooks.
6. Validate data.

### Webhook Rollback

Use when webhook URL or handler breaks.

Steps:

1. Point webhook to previous backend URL.
2. Or temporarily disable webhook.
3. Deploy fix.
4. Re-enable webhook.
5. Process any recoverable missed events if provider supports.

## Rollback Checklist

- [ ] Incident documented.
- [ ] Impact assessed.
- [ ] Webhooks paused if needed.
- [ ] Previous version identified.
- [ ] Backup available if data rollback needed.
- [ ] Smoke tests passed after rollback.
- [ ] Users/admin notified if needed.

## Post-Rollback

- Identify root cause.
- Add test/checklist to prevent recurrence.
- Update risk log.
- Do not redeploy same change without fix.


---

# FILE: backup-restore-runbook.md

# Backup and Restore Runbook

## Backup Scope

Backup must include:

```txt
database
local uploads
env/config snapshot
migration/import reports
```

## Database Backup

Current possible runtime:

- MongoDB/Mongoose.
- Supabase/Postgres target.

### MongoDB Backup

Example:

```bash
mongodump --uri="$MONGODB_URI" --out="./backups/mongo-$(date +%Y%m%d-%H%M)"
```

### Postgres Backup

Example:

```bash
pg_dump "$DATABASE_URL" > "./backups/postgres-$(date +%Y%m%d-%H%M).sql"
```

For Supabase, use Supabase dashboard/CLI backup strategy.

## Local Uploads Backup

Current/target uploads:

```txt
server/uploads
```

Recommended:

```bash
tar -czf uploads-$(date +%Y%m%d-%H%M).tar.gz server/uploads
```

## Backup Frequency

Minimum recommendation:

| Data | Frequency |
|---|---|
| Production database | Daily |
| Production uploads | Daily |
| Before migration | Immediately before |
| Before high-risk deploy | Immediately before |
| Env/config snapshot | Before env change |

## Restore Test

A backup is not reliable until restore is tested.

Test restore in staging:

- restore database
- restore uploads
- start backend
- load dashboard
- open chat messages
- open files/media
- test Telegram webhook in staging

## Restore Procedure

1. Stop backend writes.
2. Stop webhooks if production.
3. Restore database.
4. Restore uploads.
5. Verify env points to restored system.
6. Start backend.
7. Run smoke tests.
8. Re-enable webhooks.

## Data Consistency Rule

Database backup and uploads backup should come from the same time window.

Otherwise messages/files may point to missing files.


---

# FILE: incident-response-runbook.md

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


---

# FILE: monitoring-alerting.md

# Monitoring and Alerting

## What to Monitor

### Backend Health

- uptime
- request error rate
- response latency
- memory usage
- CPU usage
- process restarts

### Webhooks

- Telegram webhook received count
- Telegram webhook error count
- Meta webhook received/error
- Payment webhook received/error
- Duplicate webhook count
- Webhook processing duration

### Payment

- payment created count
- payment paid count
- payment failed/expired count
- invalid signature count
- duplicate event count
- order/payment mismatch count

### AI

- AI request count
- AI error count
- AI fallback count
- AI latency
- token/cost estimate
- escalation count

### Database

- connection errors
- slow queries
- migration errors
- storage usage
- table growth

### Local Storage

- disk usage
- upload failures
- missing files
- backup success/failure

## Suggested Alerts

| Alert | Severity |
|---|---|
| Backend down | SEV-1 |
| Payment webhook signature failures spike | SEV-1/2 |
| Payment webhook error rate high | SEV-1/2 |
| Telegram webhook failing | SEV-2 |
| Database connection failure | SEV-1 |
| Disk usage > 85% | SEV-2 |
| AI provider failing | SEV-3 |
| Backup failed | SEV-2 |
| Cross-workspace access error | SEV-1 |

## Logging Requirements

Every webhook log should include:

- provider
- event id
- workspace id if known
- platform id if known
- processing status
- error message if failed

Payment logs should include:

- payment id
- provider reference
- order id
- event id
- signature valid
- status transition


---

# FILE: health-checks.md

# Health Checks

## Health Endpoint

Recommended endpoint:

```txt
GET /health
```

Response example:

```json
{
  "status": "ok",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "version": "commit-or-build-id"
}
```

## Deep Health Endpoint

Recommended internal endpoint:

```txt
GET /health/deep
```

Checks:

- database connection
- upload directory writable
- AI provider config presence
- Telegram platform config presence
- payment provider config presence
- queue/worker status if available

Do not expose sensitive details publicly.

## Manual Health Checklist

- [ ] Backend process running.
- [ ] Frontend loads.
- [ ] Database reachable.
- [ ] Upload directory writable.
- [ ] Telegram webhook reachable.
- [ ] Payment webhook reachable.
- [ ] AI provider reachable.
- [ ] Logs are being written.

## Webhook Health

Telegram:

```txt
Send test message to bot and verify backend receives update.
```

Payment:

```txt
Send sandbox webhook or provider test event.
```

## Health Status Meaning

| Status | Meaning |
|---|---|
| ok | Service operational |
| degraded | Partial issue but core works |
| fail | Critical dependency broken |


---

# FILE: environment-ops.md

# Environment Operations

## Environment Types

Recommended environments:

```txt
local
staging
production
```

## Env File Rules

- Never commit real `.env`.
- Keep `.env.example`.
- Keep production secrets in platform secret manager.
- Rotate exposed keys immediately.
- Service role key must stay server-side only.

## Critical Env Variables

Common variables:

```txt
MONGODB_URI
DATABASE_URL
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
JWT_SECRET
PUBLIC_BASE_URL
CORS_ORIGIN
LOCAL_UPLOAD_ROOT
PUBLIC_FILES_BASE_URL
TELEGRAM_BOT_TOKEN
OPENAI_API_KEY
GOOGLE_API_KEY
PAYMENT_PROVIDER
PAYMENT_SERVER_KEY
PAYMENT_WEBHOOK_SECRET
```

Actual names may differ by implementation.

## Env Change Checklist

Before changing env:

- [ ] Understand affected service.
- [ ] Backup old value securely.
- [ ] Apply change in staging first if possible.
- [ ] Restart affected service.
- [ ] Run smoke test.
- [ ] Monitor logs.

## Production Env Red Flags

- `NODE_ENV` not production.
- Missing `JWT_SECRET`.
- Public frontend has service role key.
- Payment sandbox key used in production unintentionally.
- Production payment key used in local accidentally.
- `PUBLIC_BASE_URL` points to old webhook backend.


---

# FILE: database-ops.md

# Database Operations

## Supported Runtime States

The project may operate in one of these states:

1. MongoDB/Mongoose current runtime.
2. Supabase/Postgres target runtime.
3. Temporary migration transition.

## Database Operational Rules

- Always backup before migration.
- Never run destructive migration without backup.
- Preserve message timestamps.
- Preserve workspace ownership.
- Validate record counts after import.
- Do not reuse Mongo ObjectId as UUID.
- Use ID mapping during migration.

## Common Checks

### Mongo

- connection status
- collection counts
- indexes
- orphan messages
- orphan chats
- missing workspace ids

### Postgres/Supabase

- migration status
- table counts
- FK violations
- RLS enabled
- index existence
- slow queries
- storage usage

## Post-Migration Validation

Run checks for:

```sql
select count(*) from messages where chat_id is null;
select count(*) from chats where workspace_id is null;
select count(*) from orders where workspace_id is null;
select count(*) from complaints where workspace_id is null;
```

Expected:

```txt
0 for required references
```

## Emergency DB Procedure

If suspicious data corruption happens:

1. Stop writes.
2. Pause webhooks.
3. Snapshot current DB.
4. Identify affected records.
5. Restore or patch carefully.
6. Run validation.
7. Re-enable writes.


---

# FILE: storage-ops.md

# Storage Operations

## Storage Strategy

Structured data:

```txt
Database
```

Large files:

```txt
Local server filesystem
```

File metadata:

```txt
files table
```

## Important Directories

Recommended local storage:

```txt
server/uploads/chat
server/uploads/agent-files
server/uploads/payment-proofs
server/uploads/product-images
server/uploads/category-images
server/uploads/public-assets
server/uploads/temp
```

## Operational Rules

- Upload directory must be persistent.
- Docker deployment must mount uploads as volume.
- Backups must include uploads.
- Do not deploy in a way that wipes uploads.
- Do not store absolute paths in DB.
- Store relative path and public path.

## Disk Monitoring

Alert if:

- disk usage > 85%
- upload failures spike
- backup fails
- missing file rate increases

## Restore

To restore files:

1. Stop backend writes.
2. Restore uploads backup.
3. Restore database backup from same time window.
4. Verify file paths.
5. Open sample chat attachment.
6. Open sample payment proof/product image.

## Future Protected Media

Public `/files` is simple but less secure.

Future endpoint:

```txt
GET /media/:fileId
```

Should:

- authenticate user
- check workspace
- stream file


---

# FILE: webhook-ops.md

# Webhook Operations

## Webhook Types

- Telegram inbound webhook.
- Meta/WhatsApp/Instagram webhook.
- Payment provider webhook.

## Operational Rules

- Webhooks must be idempotent.
- Webhook handlers should respond quickly.
- Long work should be queued if needed.
- Raw payload should be logged/stored where useful.
- Duplicate events should not create duplicate messages/orders/payments.

## Telegram Webhook Ops

Check webhook:

- verify public HTTPS URL
- send `/start`
- check logs
- confirm message saved
- confirm bot replies

Common problems:

| Problem | Possible Cause |
|---|---|
| Bot no reply | webhook URL wrong, token wrong, backend down |
| Duplicate reply | no idempotency |
| AI replies during takeover | takeover check broken |
| File download fails | Telegram file API/token/storage issue |

## Payment Webhook Ops

Must verify:

- signature valid
- provider event id stored
- duplicate ignored
- payment status mapped correctly
- order updated correctly
- notification sent once

Common problems:

| Problem | Possible Cause |
|---|---|
| Order not marked paid | webhook failed, signature invalid, payment id mismatch |
| Duplicate paid notification | missing idempotency |
| Fake paid order | signature not verified |
| Raw event missing | event not logged |

## Pause Webhooks

During cutover/incident:

- point provider webhook to maintenance endpoint
- disable webhook if provider supports
- stop backend route accepting writes
- record time window

## Re-enable Webhooks

After fix:

- restore URL
- send test event
- monitor logs


---

# FILE: payment-ops.md

# Payment Operations

## Payment Providers

MVP may use:

- Midtrans sandbox.
- Xendit sandbox.
- Manual sandbox adapter.

## Payment Operational Rules

- Backend creates payment link.
- User pays on provider page.
- Provider webhook is authoritative.
- AI/user text cannot mark payment paid.
- Webhook must be signature-verified.
- Duplicate webhook must be idempotent.

## Payment Statuses

Recommended:

```txt
pending
requires_action
paid
failed
expired
cancelled
refunded
```

## Payment Incident Examples

### Fake Paid Order

Severity:

```txt
SEV-1
```

Immediate action:

1. Disable payment webhook.
2. Check signature verification.
3. Check payment event logs.
4. Revert affected order status.
5. Notify admin.

### Payment Webhook Down

Severity:

```txt
SEV-2
```

Action:

1. Check backend health.
2. Check provider dashboard.
3. Replay webhook if provider supports.
4. Manually verify payment if needed.
5. Patch payment/order status only with verified evidence.

### Duplicate Payment Notification

Severity:

```txt
SEV-2/3
```

Action:

1. Check idempotency key.
2. Check payment event uniqueness.
3. Prevent duplicate notification.
4. Add regression test.

## Daily Payment Ops Checks

- [ ] No failed webhooks.
- [ ] No invalid signature spike.
- [ ] No payment/order mismatch.
- [ ] Paid orders visible in admin.
- [ ] Duplicate event count normal.


---

# FILE: telegram-ops.md

# Telegram Operations

## Telegram Bot Operational Checklist

- [ ] Bot token configured.
- [ ] Webhook URL configured.
- [ ] Public backend URL reachable via HTTPS.
- [ ] `/start` works.
- [ ] Bot can send messages.
- [ ] Bot can send inline keyboards.
- [ ] Bot can receive callback queries.
- [ ] Bot can download files if needed.

## Common Telegram Issues

### Bot Does Not Reply

Possible causes:

- webhook not set
- wrong token
- backend down
- route error
- platform lookup failed
- AI provider error without fallback

### Callback Button Does Nothing

Possible causes:

- callback query not handled
- invalid callback payload
- product/cart id missing
- expired cart/session
- duplicate webhook skipped incorrectly

### Messages Duplicated

Possible causes:

- Telegram retried webhook
- missing idempotency
- platform_message_id not unique
- handler creates message before duplicate check

### AI Replies During Human Takeover

Possible causes:

- takeover_by check missing/broken
- chat lookup mismatch
- new chat created instead of existing chat

## Telegram Smoke Test

1. Send `/start`.
2. Tap product list.
3. Open product detail.
4. Add to cart.
5. View cart.
6. Checkout.
7. Confirm payment link message.
8. Trigger human takeover from admin.
9. Send user message and confirm AI does not reply.

## Telegram Webhook Change Procedure

1. Confirm new `PUBLIC_BASE_URL`.
2. Call setWebhook integration.
3. Verify provider response.
4. Send test message.
5. Check logs.


---

# FILE: ai-ops.md

# AI Operations

## AI Providers

Current/target AI providers may include:

- OpenAI.
- Gemini.

## Operational Rules

- AI should have fallback behavior.
- AI errors should not break webhook processing.
- AI should not control payment/order final state.
- Human takeover must stop AI replies.
- AI prompt changes should be versioned or logged.

## Monitor

- AI latency.
- AI error count.
- fallback count.
- escalation count.
- token/cost estimate.
- hallucination incidents.
- invalid action proposals.

## Common Issues

### AI Provider Fails

Action:

1. Check API key.
2. Check provider status.
3. Use fallback provider if available.
4. Return safe fallback message.
5. Log error.

### AI Gives Wrong Product Info

Action:

1. Check product data source.
2. Add guardrail: do not invent product/price.
3. Use backend product lookup.
4. Escalate if uncertain.

### AI Tries to Mark Payment Paid

Action:

1. Block action.
2. Log ai_action as rejected.
3. Reply with safe payment status message based on backend state.
4. Add prompt guardrail/test.

## AI Safe Fallback Message

Example:

```txt
Maaf kak, aku sedang kesulitan memproses jawaban otomatis. Aku hubungkan ke admin ya 🙏
```


---

# FILE: job-ops.md

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


---

# FILE: migration-ops.md

# Migration Operations

## Scope

This document covers operational steps for MongoDB/Mongoose to Supabase/Postgres migration.

## Migration Rule

Do not perform production cutover without:

- Mongo backup.
- Uploads backup.
- Import dry run.
- Validation report.
- Rollback plan.
- Maintenance window.

## Pre-Migration

- [ ] Freeze or pause writes if doing final cutover.
- [ ] Stop webhooks or point to maintenance endpoint.
- [ ] Stop background jobs.
- [ ] Backup Mongo.
- [ ] Backup uploads.
- [ ] Confirm Supabase migrations applied.
- [ ] Confirm service role key server-side only.
- [ ] Run import dry run.

## Migration

1. Build ID map.
2. Insert workspaces.
3. Insert users.
4. Insert settings/platforms/agents.
5. Insert contacts/chats.
6. Insert file metadata.
7. Insert messages.
8. Insert orders/complaints.
9. Insert marketplace tables if needed.
10. Run validation queries.

## Post-Migration

- [ ] Start backend on Supabase env.
- [ ] Run smoke tests.
- [ ] Re-enable webhooks.
- [ ] Monitor logs.
- [ ] Keep Mongo backup until confidence period ends.

## Rollback

Rollback only if:

- writes were frozen
- old Mongo remains valid
- uploads backup remains valid
- new Supabase-only writes can be discarded or reconciled


---

# FILE: maintenance-window.md

# Maintenance Window

## When Maintenance Is Needed

Use maintenance window for:

- database cutover
- high-risk schema migration
- payment webhook refactor
- local storage migration
- production secret rotation
- major deployment

## Maintenance Plan Template

```md
# Maintenance Plan

Date:
Start time:
Expected duration:
Owner:
Affected services:

## Scope

## Pre-checks

## Steps

## Validation

## Rollback

## Communication
```

## Maintenance Steps

1. Announce maintenance.
2. Disable or pause webhooks.
3. Stop jobs/workers.
4. Backup database/uploads.
5. Apply changes.
6. Run validation.
7. Start services.
8. Re-enable webhooks.
9. Run smoke tests.
10. Monitor.

## Communication Message Example

```txt
Kami sedang melakukan maintenance singkat untuk meningkatkan stabilitas sistem. Pesan/order mungkin tertunda sementara. Terima kasih 🙏
```


---

# FILE: disaster-recovery.md

# Disaster Recovery

## Disaster Scenarios

| Scenario | Impact |
|---|---|
| Database lost/corrupted | Critical data loss |
| Uploads lost | Media/payment proof/product images broken |
| Backend server down | App/webhooks unavailable |
| Payment webhook broken | Paid order not updated |
| Secrets leaked | Security compromise |
| Wrong deployment wipes uploads | Media loss |
| Cross-workspace leak | Privacy incident |

## Recovery Priorities

1. Stop ongoing damage.
2. Preserve evidence/logs.
3. Restore service.
4. Restore data.
5. Notify stakeholders if needed.
6. Add prevention.

## RPO/RTO Targets

Early MVP suggestion:

| Target | Meaning | Suggested |
|---|---|---|
| RPO | Max acceptable data loss | < 24 hours |
| RTO | Max acceptable downtime | < 4 hours |

Improve later as production grows.

## Disaster Recovery Checklist

- [ ] Identify incident.
- [ ] Pause webhooks if needed.
- [ ] Stop writes if data risk.
- [ ] Restore database backup.
- [ ] Restore uploads backup.
- [ ] Deploy last known good code.
- [ ] Verify app smoke tests.
- [ ] Verify payment/order state.
- [ ] Re-enable webhooks.
- [ ] Write postmortem.


---

# FILE: security-ops.md

# Security Operations

## Security Operational Tasks

- Rotate secrets.
- Review access logs.
- Audit admin users.
- Verify service role is server-only.
- Check suspicious webhook traffic.
- Review payment signature failures.
- Check dependency vulnerabilities.
- Validate backups are protected.

## Secret Rotation Procedure

1. Generate new secret/key.
2. Update environment secret manager.
3. Restart affected service.
4. Verify functionality.
5. Revoke old key.
6. Monitor logs.

## If Secret Is Leaked

1. Revoke leaked secret immediately.
2. Rotate related keys.
3. Search logs/repo for exposure.
4. Check unauthorized access.
5. Update incident report.

## Security Review Cadence

Recommended:

- weekly during MVP build
- before payment launch
- before production cutover
- after every security incident

## High-Risk Secrets

- payment provider server key
- payment webhook secret
- Supabase service role key
- JWT secret
- Telegram bot token
- OpenAI/Gemini keys
- database URL


---

# FILE: troubleshooting.md

# Troubleshooting

## Backend Won't Start

Check:

- env variables
- database connection
- port conflict
- dependency install
- syntax/runtime error
- build step

## Dashboard Cannot Login

Check:

- backend auth route
- JWT secret
- database user exists
- verified flag
- CORS origin
- frontend API base URL

## Telegram Bot Not Replying

Check:

- Telegram webhook set
- public URL reachable
- bot token correct
- platform lookup works
- backend logs
- AI provider fallback
- human takeover state

## Payment Link Not Generated

Check:

- payment provider env
- order exists
- checkout valid
- amount valid
- provider API response
- payment row creation

## Payment Webhook Not Updating Order

Check:

- webhook endpoint reachable
- signature valid
- provider reference id
- payment row exists
- duplicate event handling
- status mapping
- order update transaction

## Files Not Loading

Check:

- `LOCAL_UPLOAD_ROOT`
- file exists on disk
- public path matches
- static `/files` route
- permissions
- Docker volume mount

## Cross-Workspace Data Appears

Treat as SEV-1.

Action:

1. Disable affected route if needed.
2. Check workspace filters.
3. Check auth middleware.
4. Check RLS/service role logic.
5. Review logs.
6. Patch immediately.


---

# FILE: ops-checklists.md

# Ops Checklists

## Daily Checklist

- [ ] Backend running.
- [ ] No critical errors.
- [ ] Telegram webhook healthy.
- [ ] Payment webhook healthy.
- [ ] Disk usage normal.
- [ ] Backup succeeded.
- [ ] No invalid payment signature spike.

## Weekly Checklist

- [ ] Review logs.
- [ ] Review failed webhooks.
- [ ] Review failed payments.
- [ ] Review AI provider errors.
- [ ] Review storage growth.
- [ ] Review admin users.
- [ ] Test backup restore in staging if possible.

## Pre-Deploy Checklist

- [ ] Scope understood.
- [ ] Backup taken if needed.
- [ ] Env changes reviewed.
- [ ] Rollback plan ready.
- [ ] Smoke tests ready.
- [ ] Maintenance planned if high risk.

## Post-Deploy Checklist

- [ ] Login works.
- [ ] Dashboard works.
- [ ] Inbox works.
- [ ] Telegram works.
- [ ] Payment works if touched.
- [ ] Logs clean.
- [ ] Deployment logged.

## Incident Checklist

- [ ] Severity assigned.
- [ ] Impact assessed.
- [ ] Containment done.
- [ ] Fix applied.
- [ ] Smoke test run.
- [ ] Postmortem written.


---

# FILE: ops-log.md

# Ops Log

Use this file to record operational events.

## Format

```md
## YYYY-MM-DD HH:mm — Event Title

Type:
Operator:
Environment:
Severity:

### Summary

### Actions Taken

### Result

### Follow-up
```

## Event Types

- deployment
- rollback
- incident
- maintenance
- backup
- restore
- secret rotation
- migration
- webhook change
- payment provider change

## Initial Entry

```md
## Initial Ops Setup

Project is being prepared for Telegram-first marketplace MVP operations. Critical operations areas are deployment, rollback, backup/restore, webhook monitoring, payment webhook security, and local upload persistence.
```


---

# FILE: postmortem-template.md

# Postmortem Template

```md
# Postmortem: <incident title>

Date:
Severity:
Status:
Owner:

## Summary

What happened?

## Impact

Who/what was affected?

## Timeline

| Time | Event |
|---|---|
|  |  |

## Root Cause

What caused the issue?

## Resolution

What fixed it?

## What Went Well

- ...

## What Went Wrong

- ...

## Action Items

| Action | Owner | Due | Status |
|---|---|---|---|

## Prevention

What will prevent recurrence?
```
