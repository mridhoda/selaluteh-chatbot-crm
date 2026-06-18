---
schema_version: 2
document_type: active-task-pointer
status: active
updated_at: 2026-06-18

active_spec:
  id: general-backend
  title: SelaluTeh Chatbot CRM & Telegram Marketplace Backend
  status: active
  workflow_state: in_progress
  path: specs/active/general-backend/spec.yaml
  requirements: specs/active/general-backend/requirements.md
  design: specs/active/general-backend/design.md
  tasks: specs/active/general-backend/tasks.md

active_task:
  id: "24"
  title: Supabase/Postgres cutover and legacy Mongo removal
  priority: high
  phase: supabase-cutover
  source: specs/active/general-backend/tasks.md
  source_section: "24. Supabase/Postgres Cutover and Legacy Mongo Removal"
  requirements:
    - R25
    - R35

execution:
  mode: single-task
  continue_automatically: false
  requires_preflight_report: true
  requires_tests: true
  requires_documentation_update: true
  requires_final_specs_check: true

lifecycle:
  sync_required_before_task: false
  sync_required_after_task: false
  sync_required_when_spec_metadata_changes: true
  sync_required_when_status_changes: true
  check_command: npm run specs:check
  dry_run_command: npm run specs:sync:dry
  sync_command: npm run specs:sync
---

# Current Task

Supabase/Postgres cutover — full Supabase end-state with staged domain-by-domain replacement of legacy Mongo/Mongoose repository implementations.

## Objective

Supabase/Postgres is now the approved runtime target and final end-state. Sections 1-15 remain closed for MVP Telegram chatbot testing, but repository/runtime work must now prioritize replacing legacy Mongo/Mongoose access without Mongo data backfill or dual-write.

## Task Details

Referensi: `specs/active/general-backend/tasks.md` section `24`.

Requirements: R30 (Security), R35 (Repository Layer), R37 (Testing), R38 (Production Hardening).

## Completed Scope

Sections 1-15 — fully complete and ready for MVP Telegram chatbot testing.

Latest verification:

```txt
npm --prefix server test
143 tests, 26 suites, 143 pass, 0 fail
npm run specs:check passed
```

Current next task: 24.1-24.6 — lock cutover decisions, finish Supabase foundation, freeze contracts, prepare fresh Supabase seed data, and establish Supabase testing baseline before domain cutover.
