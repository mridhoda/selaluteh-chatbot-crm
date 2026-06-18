# SelaluTeh Repository Agent Instructions

## Canonical Workflow

Before making any code or documentation change, read and follow:

`docs/backend/READING-ORDER.md`

Treat it as the canonical operating procedure for this repository.

Also read:

* `specs/specs.config.yaml`
* `docs/backend/09-ai-context/current-task.md`

Follow the `active_spec` and `active_task` pointers exactly.

Do not select another spec or task yourself.

---

## Session Start

At the start of every implementation session, run:

```bash
npm run specs:check
```

If the specs lifecycle tooling is not installed, verify that these files exist:

```text
specs/specs.config.yaml
scripts/specs/sync-spec-folders.mjs
install-specs-system.sh
```

Only during initial setup, run:

```bash
chmod +x install-specs-system.sh
./install-specs-system.sh
```

Do not run the installer again for every task.

---

## Required Reading Before Coding

Read:

1. `docs/backend/READING-ORDER.md`
2. `specs/specs.config.yaml`
3. `docs/backend/09-ai-context/current-task.md`
4. The active `spec.yaml`
5. The active spec's `requirements.md`
6. The active spec's `design.md`
7. The exact active task in `tasks.md`
8. All domain, security, testing, and operations documents required by the Reading Order
9. Existing source code and tests related to the task

Before coding, report:

* documents read;
* active spec and task;
* existing files inspected;
* behavior to preserve;
* files expected to change;
* workspace and outlet access impact;
* payment, webhook, and idempotency impact;
* database or migration impact;
* tests to add and run;
* documentation to update;
* compatibility or rollback plan.

---

## Implementation Rules

Implement only the task declared in `current-task.md`.

Preserve existing CRM and chatbot behavior.

Use the backend flow:

```text
Route
→ Middleware
→ Service
→ Repository
→ Model or Database
```

Use external providers through:

```text
Service
→ Integration Adapter
→ External Provider
```

Never:

* trust `workspace_id` from the client;
* bypass outlet-access validation;
* call external providers directly from routes;
* mark a payment paid without a verified provider event;
* skip webhook idempotency;
* expose secrets or raw provider signatures;
* claim PostgreSQL is active before the approved cutover;
* rewrite the existing backend from scratch;
* continue automatically to another task.

---

## Documentation After Implementation

Before closing a task, update all affected documentation.

Always evaluate and update:

* the active spec's `tasks.md`;
* `docs/backend/11-sprint/implementation-status.md`;
* `docs/backend/11-sprint/progress-log.md`;
* `docs/backend/09-ai-context/current-task.md`.

Update when affected:

* `requirements.md`;
* `design.md`;
* `spec.yaml`;
* `current-sprint.md`;
* `backlog.md`;
* `decision-log.md`;
* flow documents;
* business-rule documents;
* API documents;
* data documents;
* UI-backend contracts;
* security documents;
* testing documents;
* operations documents.

Do not mark a task completed until its acceptance criteria, required tests, and documentation updates are complete.

---

## Specs Lifecycle Commands

### No spec metadata or lifecycle change

When only source code, tests, tasks, progress, or current-task content changed, run:

```bash
npm run specs:check
```

### Spec metadata affecting the index changed

When any of these change:

* `status`;
* `workflow_state`;
* `priority`;
* spec title;
* spec ID;
* canonical lifecycle path;

run:

```bash
npm run specs:sync:dry
npm run specs:sync
npm run specs:check
```

### Spec folder status changed

When moving between:

```text
backlog
active
completed
```

update `current-task.md` first, then run:

```bash
npm run specs:sync:dry
npm run specs:sync
npm run specs:check
```

Never move spec folders manually.

Never edit `specs/SPECS-INDEX.md` manually.

---

## Completing a Task

When the active task is complete:

1. Run all relevant tests.
2. **Write new tests for every code change.** Consult `docs/backend/10-testing/` test plans to determine what unit, integration, or security tests are required. Do not close a task until tests exist that cover the new code and all tests pass.
2. Update `tasks.md`.
3. Update `implementation-status.md`.
4. Update `progress-log.md`.
5. Update affected domain documentation.
6. Update `current-task.md`.
7. Run the required specs lifecycle commands.
8. Review `git status` and `git diff`.
9. Report the result.
10. Stop.

Do not choose or implement another task automatically.

---

## Completing a Spec

A spec may be completed only when:

* all required tasks are complete;
* Definition of Done passes;
* critical tests pass;
* security and regression gates pass;
* documentation is current;
* implementation status is accurate;
* progress log is updated;
* release and rollback requirements are ready.

Before changing the spec to completed:

1. Point `current-task.md` to another approved active task, or set it to `idle`.
2. Update final documentation.
3. Set:

```yaml
status: completed
workflow_state: done
```

4. Run:

```bash
npm run specs:sync:dry
npm run specs:sync
npm run specs:check
```

5. Confirm the spec is now located at:

```text
specs/completed/<spec-id>/
```

6. Review the Git diff.
7. Stop.

---

## Final Report

At task closure, report:

* spec ID;
* task ID;
* implementation summary;
* files changed;
* behavior preserved;
* tests run and results;
* security impact;
* data or migration impact;
* documentation updated;
* remaining risks;
* blockers or follow-ups;
* next current-task state;
* spec status and workflow state;
* final `npm run specs:check` result.
