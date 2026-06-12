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
