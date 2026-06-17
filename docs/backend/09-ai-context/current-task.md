---
schema_version: 2
document_type: active-task-pointer
status: active
updated_at: 2026-06-17

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
  id: "17.1"
  title: Define message delivery service
  priority: medium
  phase: notifications
  source: specs/active/general-backend/tasks.md
  source_section: "17. Notifications and Delivery Orchestration"
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

Notifications — Define message delivery service.

## Objective

Active task pointer remains `17.1`. Sections 1-15 have been closed for MVP Telegram chatbot testing and documentation has been updated according to `docs/backend/READING-ORDER.md`.

## Task Details

Referensi: `specs/active/general-backend/tasks.md` task `17.1`.

Requirements: R25 (Notifications), R35 (Repository Layer).

## Completed Scope

Sections 1-15 — fully complete and ready for MVP Telegram chatbot testing.

Latest verification:

```txt
npm --prefix server test
142 tests, 25 suites, 142 pass, 0 fail
npm run specs:check passed
```

Current next task: 17.1 — Define message delivery service.
