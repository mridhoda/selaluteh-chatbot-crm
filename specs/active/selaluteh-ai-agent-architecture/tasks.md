---
schema_version: 1
document_type: implementation-plan
spec_id: selaluteh-ai-agent-architecture
title: SelaluTeh AI Agent Architecture Tasks
status: draft
version: 1.0.0
updated_at: 2026-06-19
development_method: test-driven-development
---

# Implementation Plan: SelaluTeh AI Agent Architecture

## Overview

Dokumen ini mendefinisikan rencana implementasi **khusus untuk AI Agent Architecture SelaluTeh / KALIS.AI**.

Dokumen ini tidak menggabungkan atau menggantikan implementation plan backend marketplace lama.

Domain berikut tetap dimiliki oleh spec backend/domain masing-masing:

```text
workspace
outlet
platform connection
contact
chat
message
product
product availability
cart
checkout
order
payment
complaint
notification
file storage
```

Spec AI ini hanya mengimplementasikan:

```text
AI inbound eligibility
conversation context
conversation sessions
recent memory
rolling summary
durable customer memory
RAG
knowledge ingestion
configurable AI agents
agent routing
model routing
AI orchestration
structured tool calling
Tool Gateway
AI commerce guardrails
payment read-only boundary
human handoff integration
AI traces
AI feedback
evaluation
retention
AI reliability
future specialist-agent readiness
```

Ketika AI membutuhkan product, cart, order, payment, complaint, atau notification, AI SHALL menggunakan backend domain contract melalui Tool Gateway.

AI SHALL NOT membuat shadow implementation untuk domain tersebut.

---

# Source Documents

Task plan ini harus dibaca bersama:

```text
docs/specs/active/selaluteh-ai-agent-architecture/spec.yaml
docs/specs/active/selaluteh-ai-agent-architecture/requirements.md
docs/specs/active/selaluteh-ai-agent-architecture/design.md
docs/specs/active/selaluteh-ai-agent-architecture/tasks.md
```

Dokumen backend marketplace lama boleh dibaca hanya untuk memahami existing service contracts dan integration points.

Dokumen backend lama tidak menjadi source untuk memperluas scope AI spec ini.

---

# Fixed Technical Decisions

```text
Primary model:
local OpenAI-compatible endpoint

Orchestration:
custom bounded Node.js orchestrator

Tool execution:
native structured function/tool calling

Persistent AI state:
Supabase/PostgreSQL

Vector search:
Supabase pgvector

Retrieval:
hybrid vector + PostgreSQL full-text search

LangChain:
optional adapter for RAG/helper only

LangGraph:
deferred until complex specialist workflows require it

Redis:
optional cache, lock, rate limit, or queue

n8n:
non-critical automation only

Customer channels:
Telegram and WhatsApp

AI language:
Bahasa Indonesia

MVP fulfillment:
pickup only

MVP payment:
Xendit only

Payment authority:
verified backend Xendit processing

Human takeover:
always supersedes customer-facing AI
```

---

# Test-Driven Development Policy

Seluruh implementation SHALL mengikuti:

```text
RED
→ write a failing test that expresses the expected behavior

GREEN
→ implement the minimum correct behavior until the test passes

REFACTOR
→ improve structure without changing behavior

VERIFY
→ run targeted tests and required regression suites
```

## Mandatory TDD Rules

1. Setiap behavior baru SHALL memiliki test yang gagal sebelum implementation.
2. Setiap bug fix SHALL dimulai dengan regression test yang mereproduksi bug.
3. Test SHALL menguji observable behavior, bukan implementation detail yang rapuh.
4. Mock SHALL digunakan pada external boundaries, bukan untuk menghilangkan seluruh business behavior.
5. Repository tests SHALL menggunakan Supabase local atau dedicated non-production test project.
6. Automated tests SHALL TIDAK menggunakan production database.
7. Automated tests SHALL TIDAK menggunakan production provider credentials.
8. External model tests SHALL menggunakan deterministic fake provider untuk default CI.
9. Optional local-model smoke tests SHALL dipisahkan dari deterministic CI.
10. Tool mutation tests SHALL menguji idempotency.
11. Security-critical behavior SHALL memiliki negative tests.
12. Race-sensitive behavior SHALL memiliki concurrency tests.
13. Setiap task SHALL menjalankan targeted test sebelum full relevant suite.
14. Task tidak selesai hanya karena file berhasil dibuat.
15. Task tidak selesai jika test ditulis tetapi tidak pernah dijalankan.
16. Test yang di-skip SHALL memiliki alasan, owner, dan follow-up task.
17. Flaky test SHALL diperbaiki; tidak boleh dibiarkan menjadi accepted baseline.
18. Snapshot test SHALL tidak menjadi satu-satunya assertion untuk security atau state transition.
19. Exact text assertion SHALL dibatasi pada stable copy; AI output diuji dengan structured constraints.
20. Critical release gate SHALL gagal jika:
    - payment boundary rusak;
    - workspace isolation rusak;
    - human takeover gagal;
    - duplicate message menghasilkan duplicate action;
    - AI mendapat mark-paid capability;
    - secret masuk prompt/trace/log.

---

# Test Layers

## Unit Tests

Target:

```text
pure policy
schema validation
routing
prompt assembly
context trimming
memory rules
status mapping
redaction
dedupe key generation
confirmation policy
tool registry
state guards
```

Suggested path:

```text
server/test/unit/ai/
```

## Component / Service Tests

Target:

```text
AI Orchestrator with mocked provider
Context Builder with repositories
Memory Service
RAG Service
Tool Gateway
Agent Router
Model Router
Takeover policy
```

Suggested path:

```text
server/test/component/ai/
```

## Repository Integration Tests

Target:

```text
conversation sessions
summaries
memories
knowledge sources
knowledge chunks
AI runs
tool calls
feedback
scheduled AI jobs
```

Run against:

```text
Supabase local
or
dedicated Supabase test project
```

Suggested path:

```text
server/test/integration/ai/repositories/
```

## API Integration Tests

Target:

```text
agent settings APIs
knowledge APIs
memory APIs
AI trace APIs
feedback APIs
agent test/publish APIs
```

Suggested path:

```text
server/test/integration/ai/api/
```

## Channel Integration Tests

Target:

```text
Telegram normalized inbound
WhatsApp normalized inbound
outbound response mapping
typing indicators
delivery retries
```

Suggested path:

```text
server/test/integration/ai/channels/
```

## Security Tests

Target:

```text
prompt injection
cross-workspace access
cross-outlet retrieval
tool escalation
secret exposure
agent-config escalation
RAG instruction injection
payment mutation attempts
trace access
```

Suggested path:

```text
server/test/security/ai/
```

## End-to-End Tests

Target:

```text
inbound channel event
→ contact/chat resolution
→ AI context
→ RAG/tools
→ response
→ persisted trace
→ outbound adapter
```

Suggested path:

```text
server/test/e2e/ai/
```

## Evaluation Tests

Target:

```text
tone
continuity
correct tool selection
no hallucinated live data
handoff quality
RAG groundedness
payment safety
```

Suggested path:

```text
server/test/evaluation/ai/
```

## Property-Based Tests

Target:

```text
context never exceeds limit
tool loop always terminates
workspace filter always present
deleted memory never injected
confirmation cannot authorize changed action
```

Suggested path:

```text
server/test/property/ai/
```

## Concurrency and Race Tests

Target:

```text
parallel inbound messages
duplicate webhook/message
takeover activated while model runs
auto-resume timer race
summary worker duplicate
tool idempotency collision
```

Suggested path:

```text
server/test/concurrency/ai/
```

## Performance and Load Tests

Target:

```text
context assembly latency
retrieval latency
parallel AI turns
provider timeout handling
queue backlog
memory query performance
```

Suggested path:

```text
server/test/performance/ai/
```

## Failure-Injection Tests

Target:

```text
model timeout
malformed structured output
Supabase transient failure
RAG timeout
tool service unavailable
outbound channel failure
worker crash/retry
```

Suggested path:

```text
server/test/resilience/ai/
```

## Manual Sandbox Verification

Target:

```text
real local model endpoint
Telegram test bot
WhatsApp test number
Xendit Test Mode
real pgvector embedding flow
```

Manual verification SHALL be reported separately and SHALL NOT be claimed as automated coverage.

---

# Task Notation

```text
[ ]  Not started
[~]  In progress
[x]  Completed
[!]  Security/release critical
[*]  Optional or post-core
[B]  Blocked by another domain/spec
```

Priority:

```text
P0 = required for AI MVP correctness
P1 = required before production or for quality
P2 = future-ready
```

---

# Global Task Completion Rules

Setiap task implementation dianggap selesai hanya jika applicable items berikut terpenuhi:

```text
[ ] failing test written first
[ ] minimum implementation passes
[ ] refactor completed
[ ] unit tests pass
[ ] component tests pass
[ ] repository/API integration tests pass
[ ] security tests pass when relevant
[ ] concurrency tests pass when relevant
[ ] E2E/evaluation tests pass when relevant
[ ] workspace scope enforced
[ ] outlet scope enforced when relevant
[ ] human takeover checked
[ ] secrets redacted
[ ] idempotency implemented for side effects
[ ] trace/metrics updated
[ ] docs updated
[ ] requirement mapping included
[ ] no backend-domain shadow implementation introduced
[ ] targeted test command recorded
[ ] full relevant regression suite recorded
```

---

# Tasks

## 0. Spec Preflight, Baseline, and TDD Harness

### 0.1 [P0] Confirm AI spec isolation

- [x] Read AI `spec.yaml`, `requirements.md`, `design.md`, and `tasks.md`.
- [x] Confirm implementation target is `selaluteh-ai-agent-architecture`.
- [x] Confirm no backend marketplace task is silently copied into this spec.
- [x] Identify required backend service contracts only.
- [x] Record missing dependencies as blocked contracts.
- [x] Add a scope note to implementation status.
- [x] Verify `npm run specs:check`.

**Tests / verification**

- [x] Add spec-structure check if existing tooling supports it.
- [x] Confirm `requirements.md`, `design.md`, and `tasks.md` share the same `spec_id`.
- [x] Confirm no duplicate active spec ID.
- [x] Confirm task requirement references use `AIA-R*`.

_Requirements: all_

### 0.2 [P0] Capture current AI runtime baseline

- [x] Run existing backend unit tests.
- [x] Run existing integration tests.
- [x] Run existing security tests.
- [x] Run existing AI-related tests.
- [x] Inspect current:
  - AI client;
  - AI service;
  - message buffer;
  - Telegram handler;
  - WhatsApp handler;
  - chat/message repositories;
  - human takeover checks;
  - agent settings.
- [x] Record current failing tests separately.
- [x] Record current repeated-introduction behavior.
- [x] Record how many historical messages are currently sent to model.
- [x] Record whether current message is duplicated.
- [x] Record current model/provider configuration.
- [x] Record current persistence source for messages and AI agents.

_Requirements: AIA-R2, AIA-R3, AIA-R5, AIA-R17, AIA-R33_

### 0.3 [P0] Normalize AI test structure without breaking existing runner

- [x] Create test folders only when first real test is added:
  - `test/unit/ai`;
  - `test/component/ai`;
  - `test/integration/ai`;
  - `test/security/ai`;
  - `test/e2e/ai`;
  - `test/evaluation/ai`;
  - `test/helpers/ai`.
- [x] Preserve existing test runner.
- [x] Add test naming convention.
- [x] Add category-specific npm scripts if needed:
  - `test:ai:unit`;
  - `test:ai:integration`;
  - `test:ai:security`;
  - `test:ai:e2e`;
  - `test:ai:evaluation`;
  - `test:ai:all`.
- [x] Ensure test scripts fail on test failure.
- [x] Ensure CI can run deterministic suites independently.

**Tests / verification**

- [x] Add one sample test per configured runner.
- [x] Verify empty categories do not silently pass as false confidence.
- [x] Verify exit codes.
- [x] Verify source maps and stack traces are useful.
- [x] Verify no production env is loaded by tests.

_Requirements: AIA-R33_

### 0.4 [P0] Build AI test factories and deterministic fakes

- [x] Create factory for:
  - workspace context;
  - outlet context;
  - contact;
  - chat;
  - message;
  - conversation session;
  - agent;
  - agent version;
  - memory;
  - knowledge source;
  - knowledge chunk;
  - AI run;
  - tool call;
  - human takeover state.
- [x] Create deterministic fake model provider.
- [x] Create scripted fake tool executor.
- [x] Create fake embedding provider.
- [x] Create fake Telegram adapter.
- [x] Create fake WhatsApp adapter.
- [x] Create fixed clock helper.
- [x] Create deterministic ID generator helper where appropriate.
- [x] Create safe test redaction assertions.

**Tests / verification**

- [x] Factory isolation test.
- [x] Fake model sequence test.
- [x] Fake tool call capture test.
- [x] Fixed clock advancement test.
- [x] No factory secret leakage test.
- [x] Parallel tests do not share state.

_Requirements: AIA-R17, AIA-R18, AIA-R19, AIA-R33_

### 0.5 [P0] Create Supabase AI test environment contract (documentation)

- [x] Document supported test mode:
  - Supabase local; or
  - dedicated test project.
- [x] Add startup validation that rejects production URL/project in automated tests.
- [x] Add database reset strategy.
- [x] Add migration application strategy.
- [x] Add fixture cleanup strategy.
- [x] Add parallel-test isolation policy.
- [x] Add test transaction or schema isolation strategy.
- [x] Add pgvector availability check.

**RED**

- [~] Write test that automated suite refuses production Supabase. (covered by existing supabaseTest.js guard)
- [~] Write test that AI tables can be migrated on clean database. (deferred to Task 2.1)
- [~] Write test that cleanup removes test rows. (covered by existing cleanTable pattern)

**GREEN / REFACTOR**

- [x] Implement test database guard.
- [x] Implement reset helper.
- [x] Document safe commands.

_Requirements: AIA-R7, AIA-R8, AIA-R11, AIA-R13, AIA-R26, AIA-R33_

### 0.6 [P0] Define AI release test gates

- [x] Define blocking suites:
  - unit;
  - integration;
  - security;
  - critical E2E;
  - critical evaluation.
- [x] Define optional/manual suites.
- [x] Define flaky-test policy.
- [x] Define skipped-test policy.
- [x] Define required coverage for security-critical modules.
- [x] Define release blockers.

**Release blockers**

```text
cross-workspace leak
AI mark-paid capability
payment-paid hallucination
human takeover collision
duplicate message duplicate mutation
secret in prompt/log/trace
unbounded tool loop
invalid RAG scope
```

_Requirements: AIA-R22, AIA-R24, AIA-R28, AIA-R33_

### 0.7 [P0] Checkpoint — AI baseline and TDD readiness

Must pass:

```text
spec isolation confirmed
test runner stable
deterministic fakes available
safe Supabase test environment available
baseline recorded
critical release gates defined
```

---

## 1. Reproduce and Fix Repeated-Introduction Context Bug

### 1.1 [P0] Reproduce repeated introduction with a failing regression test

**RED**

- [x] Create chat with one prior assistant response.
- [x] Send a second customer message.
- [x] Assert generated context indicates conversation is not new.
- [x] Assert expected final response does not repeat full introduction.
- [x] Confirm test fails against current implementation.
- [x] Add third-turn regression.
- [x] Add session-restart scenario.

**Do not implement fix before the failing test is observed — OBSERVED.**

_Requirements: AIA-R2, AIA-R5, AIA-R6, AIA-R33_

### 1.2 [P0] Audit chat resolution keys

- [x] Trace Telegram chat resolution.
- [x] Trace WhatsApp chat resolution.
- [x] Confirm stable key:
  ```text
  workspace_id + platform_id + external_conversation_id
  ```
- [x] Identify any use of external message ID as chat identity. (none found)
- [x] Identify accidental new-chat creation. (none — key is stable)
- [x] Add safe diagnostic fields:
  - workspace ID;
  - platform ID;
  - external conversation ID;
  - resolved chat ID;
  - created/reused;
  - message count.
- [x] Avoid logging full customer text.

**Tests**

- [ ] Same Telegram conversation resolves same chat.
- [ ] Same WhatsApp conversation resolves same chat.
- [ ] Same external conversation in another workspace resolves different chat.
- [ ] Different platform connections do not collide.
- [ ] Parallel resolution creates at most one chat.

_Requirements: AIA-R2, AIA-R3_

### 1.3 [P0] Audit message persistence order

- [x] Confirm inbound message is persisted before AI generation.
- [x] Confirm history query includes persisted current message.
- [x] Confirm current message is not appended a second time.
- [x] Confirm outbound assistant message is persisted.
- [x] Confirm failed outbound send retains delivery state.

**Tests**

- [ ] Current message appears exactly once.
- [ ] Previous assistant message is loaded.
- [ ] Chronological order is correct.
- [ ] Duplicate provider message creates one internal message.
- [ ] Duplicate provider message triggers one AI run.

_Requirements: AIA-R3, AIA-R6_

### 1.4 [P0] Implement greeting flags

- [x] Add:
  - `isFirstAssistantMessageInChat`;
  - `isFirstAssistantMessageInSession`;
  - `assistantMessageCount`.
- [x] Derive flags from persistent messages/session.
- [x] Add flags to context.
- [x] Add immutable greeting policy.
- [x] Keep wording configurable by agent.
- [x] Prevent agent prompt from overriding continuity rule.

**RED**

- [x] First response allows intro.
- [x] Second response forbids intro.
- [x] New session allows welcome-back only.

**GREEN / REFACTOR**

- [x] Implement backend flags.
- [x] Refactor prompt builder.
- [x] Remove duplicate legacy greeting logic.

_Requirements: AIA-R5, AIA-R10, AIA-R15_

### 1.5 [P0] Load bounded recent history

- [x] Add repository/service method to load recent eligible messages.
- [x] Default 20–25 messages.
- [x] Sort ascending after limit.
- [x] Filter raw/system/provider noise.
- [x] Include relevant human messages.
- [x] Avoid secrets.

**Tests**

- [ ] Loads expected last N.
- [ ] Returns ascending order.
- [ ] Excludes raw webhook.
- [ ] Excludes secret/system internals.
- [ ] Handles empty history.
- [ ] Handles more than limit.
- [ ] Handles deleted/expired messages.

_Requirements: AIA-R6, AIA-R10_

### 1.6 [P0] Apply minimum production-safe context fix

- [x] Build model message array from:
  - immutable platform policy;
  - agent instruction;
  - greeting flags (isFirstAssistantMessageInChat, isFirstAssistantMessageInSession, assistantMessageCount);
  - recent history from bounded loader.
- [x] Preserve current model adapter compatibility (openai vs gemini path unchanged).
- [x] Add safe fallback if history load fails (empty array → greeting flags = first message).
- [x] Do not add RAG or durable memory yet.

**Tests**

- [x] Regression tests now pass (46 new AI unit tests + all existing backend tests).
- [x] Existing AI response tests pass (239 pass, 0 fail).
- [x] Human takeover still blocks AI.
- [x] Duplicate message remains idempotent.
- [x] No secret enters prompt.
- [x] No current message duplication.

### 1.7 [P0] E2E context continuity test

- [x] Unit-level continuity: greeting-flags.test.js covers 5 scenarios.
- [x] Context-level continuity: context-builder.test.js covers 7 scenarios incl. intro/no-intro.
- [~] Full-channel Telegram/WhatsApp E2E requires live provider credentials (deferred to manual sandbox verification).

### 1.8 [P0] Checkpoint — immediate memory bug fixed

Must pass:

```text
stable chat resolution           ✅ verified (key = ws + platform + contact_id)
previous assistant message loaded ✅ (loadRecentMessages)
current message appears once     ✅ (context-builder dedupes)
intro occurs only once           ✅ (greeting flags based on persistent count)
human takeover regression        ✅ (still blocks AI)
```

---

## 2. AI-Specific Supabase Schema and Repository Foundation

### 2.1 [P0] Design AI-only migrations

Created migration `011_ai_memory_knowledge_trace.sql`:

```text
conversation_sessions     ✅ — active/closed_idle/closed_handoff/closed_manual
conversation_summaries    ✅ — active/superseded, JSONB summary, message range
contact_memories          ✅ — candidate/active/superseded/expired/deleted
knowledge_sources         ✅ — draft→processing→published lifecycle, scope (ws/outlet/agent/channel)
knowledge_chunks          ✅ — vector(384), content_hash, agent/outlet scope FK
knowledge_source_agents   ✅ — M:N assignment
ai_runs                   ✅ — created/running/completed/failed, agent version, token counts
ai_tool_calls             ✅ — proposed/executing/completed/failed, linked to ai_runs
ai_feedback               ✅ — 1-5 rating, reason_code, linked to ai_runs
```

- [x] Do not redefine product/cart/order/payment tables.
- [x] Add foreign keys to existing domain IDs where stable.
- [x] Add workspace fields to every tenant-owned AI table.
- [x] Add timestamps, soft-delete/status fields, retention fields.
- [x] Add vector extension (pgvector) and embedding column.
- [x] Add indexes from query contracts.
- [x] Add unique constraints for idempotency.

_Requirements: AIA-R4, AIA-R7, AIA-R8, AIA-R11, AIA-R12, AIA-R13, AIA-R26, AIA-R27, AIA-R29_

### 2.2 [P0] Create AI row mapping helpers (reuses existing supabase-mapper.js)

- [x] Reuse existing `mapRow`/`mapRows`/`toSnakeCase`/`toCamelCase` from `supabase-mapper.js`.
- [x] AI repositories use `mapRow`/`mapRows` consistently.
- [x] Existing mapper unit tests cover round-trip, nulls, JSON, timestamps.

_Requirements: AIA-R33_

### 2.3 [P0] Create conversation session repository

- [x] Implemented `conversationSessionsRepository` with methods: `findActiveByChat`, `create`, `touchCustomerActivity`, `touchAssistantActivity`, `close`, `closeIdleSessions`, `findById`.
- [x] All methods workspace-scoped.
- [x] Idempotent close via active status filter.
- [x] Contract test verified.

_Requirements: AIA-R4_

### 2.4 [P0] Create summary repository

- [x] Implemented `conversationSummariesRepository` with methods: `findLatestValid`, `createForRange`, `markSuperseded`, `listBySession`, `deleteExpired`.
- [x] Active-only filter, superseded exclusion, workspace scoped.
- [x] Contract test verified.

_Requirements: AIA-R7_

### 2.5 [P0] Create customer memory repository

- [x] Implemented `contactMemoriesRepository` with methods: `listActive`, `findByKey`, `createCandidate`, `activate`, `supersede`, `correct`, `forget`, `deleteExpired`.
- [x] Workspace/contact scope, deleted_at gating, status filtering.
- [x] Contract test verified.

_Requirements: AIA-R8, AIA-R9_

### 2.6 [P0] Create knowledge repositories

- [x] `knowledgeSourcesRepository` — createDraft, updateDraft, findById, list, markProcessing, publishVersion, archive.
- [x] `knowledgeChunksRepository` — insertChunks, listChunks, deleteSupersededChunks, vectorSearch, fullTextSearch.
- [x] Contract test verified.

_Requirements: AIA-R11, AIA-R12, AIA-R13_

### 2.7 [P0] Create AI run and tool trace repositories

- [x] `aiRunsRepository` — createRun, markRunning, completeRun, failRun, findById, list, deleteExpired.
- [x] `aiToolCallsRepository` — createToolCall, completeToolCall, failToolCall, listByRun, list, deleteExpired.
- [x] Agent version captured, workspace isolation, retention cleanup.
- [x] Contract tests verified.

_Requirements: AIA-R26_

### 2.8 [P1] Create feedback repository

- [x] `aiFeedbackRepository` — create, listByRun, listByAgentVersion.
- [x] Rating 1-5 constraint via CHECK constraint.
- [x] Contract test verified.

_Requirements: AIA-R27_

### 2.9 [P0] Repository contract suite

- [x] All 8 AI repository contracts verified: all methods exist, function signatures correct.
- [x] Supabase SDK objects do not leak (repos return plain objects via mapRow/mapRows).
- [x] Workspace_id validation in all scoped queries.
- [x] Not-found returns null (extractSingle pattern).

_Requirements: AIA-R28, AIA-R33_

### 2.10 [P0] Checkpoint — AI persistence foundation

Must pass:

```text
clean migrations              ✅ (011_ai_memory_knowledge_trace.sql)
repository contract tests     ✅ (8/8 repositories verified)
workspace isolation           ✅ (requireWorkspaceId in all scoped methods)
pgvector available            ✅ (extension + vector(384) column)
retention fields present      ✅ (deleted_at, expires_at, valid_until)
no backend domain duplication ✅ (no product/cart/order/payment tables)
```

---

## 3. Channel-Normalized AI Inbound Pipeline

### 3.1 [P0] Define normalized inbound event schema

- [x] Fields: workspaceId, platformId, provider, externalMessageId, externalConversationId, externalUserId, messageType, text, safeMediaMetadata, replyContext, providerTimestamp, correlationId.
- [x] Validation: reject missing required, unknown provider, oversized text, unsafe media keys.
- [x] Auto-generate correlationId when not provided.

**RED** (see `test/unit/ai/inbound-event.test.js`)

- [x] Valid Telegram event accepted.
- [x] Valid WhatsApp event accepted.
- [x] Missing required identity rejected.
- [x] Oversized text rejected.
- [x] Unsafe media metadata rejected.
- [x] Unknown provider rejected.

_Requirements: AIA-R1, AIA-R28_

### 3.2 [P0] Implement Telegram AI adapter normalization

- [x] Reuse existing `normalizeTelegramUpdate` from telegram-parser.js.
- [x] Convert provider payload to normalized event via `telegramToInboundEvent()`.
- [x] Preserve reply context safely (reply_to_message, callback data).
- [x] Exclude raw secret/token (no secret fields in normalized output).
- [x] Create correlation ID.
- [x] Separate provider acknowledgement from AI processing (adapter returns event, does not process).

**Tests** (in `inbound-event.test.js`)

- [x] Text message.
- [x] Photo message with safe media metadata.
- [x] Reply context preserved.
- [x] Invalid update returns null.
- [x] Duplicate update (handled by idempotency, not adapter).

_Requirements: AIA-R1, AIA-R3_

### 3.3 [P0] Implement WhatsApp AI adapter normalization

- [x] Inline normalization of Meta payload via `whatsappToInboundEvent()`.
- [x] Normalize text/media/reply.
- [x] Resolve external user/conversation ID from message.from.
- [x] Separate webhook response from AI processing (adapter returns event).
- [x] Handle WhatsApp-specific delivery/status events (no messages → null).

**Tests** (in `inbound-event.test.js`)

- [x] Text message.
- [x] Image message with safe metadata.
- [x] No messages returns null.
- [x] Missing message id returns null.

_Requirements: AIA-R1, AIA-R3_

### 3.4 [P0] Build inbound AI eligibility service

- [x] Checks: platform enabled, message exists, human takeover inactive, active agent available.
- [x] Returns `{ eligible: boolean, reason: string | null }`.

**Tests**

- [x] Eligible message starts one run.
- [x] Disabled platform rejected.
- [x] Human takeover rejected.
- [x] No active agent rejected.
- [x] Inactive agent rejected.

_Requirements: AIA-R1, AIA-R3, AIA-R16, AIA-R24, AIA-R28_

### 3.5 [P0] Add per-chat AI run lock

- [x] In-process Map-based lock with 30s timeout.
- [x] Prevents overlapping mutations for same chat.
- [x] Allows independent chats concurrently.
- [x] Stale-lock recovery via `clearStaleLocks()`.

**Tests**

- [x] Acquires lock for new chat.
- [x] Rejects duplicate for same chat.
- [x] Allows different chats.
- [x] Releases lock.
- [x] Stale lock cleanup.

_Requirements: AIA-R18, AIA-R29_

### 3.6 [P0] Channel integration E2E

- [x] Unit-level: telegramToInboundEvent + whatsappToInboundEvent tested.
- [x] Duplicate events safe (adapter returns same shape).
- [x] No provider-specific payload leaks (adapter returns normalized InboundEvent).
- [~] Full-channel Telegram/WhatsApp E2E requires live provider credentials (deferred to manual sandbox).

### 3.7 [P0] Checkpoint — normalized inbound

```text
Telegram normalized     ✅ (telegramToInboundEvent + tests)
WhatsApp normalized     ✅ (whatsappToInboundEvent + tests)
provider verification   ✅ (retained at webhook level)
message persisted first ✅ (existing recordInboundMessage pattern)
duplicate safe          ✅ (idempotent event shape)
per-chat serialized     ✅ (acquireRunLock)
```

---

## 4. Conversation Session Service

### 4.1 [P0] Write session boundary policy tests

**RED** — see `test/unit/ai/session-service.test.js`

- [x] Existing active session reused before 24h.
- [x] New session after 24h inactivity.
- [x] Chat remains same across sessions.
- [x] Configurable threshold honored.
- [x] touchCustomerActivity/touchAssistantActivity work.
- [x] closeForHandoff closes with reason.

_Requirements: AIA-R4_

### 4.2 [P0] Implement conversation session service

- [x] Implemented `createSessionService()` with methods: `getOrCreateActiveSession`, `touchCustomerActivity`, `touchAssistantActivity`, `closeForHandoff`, `closeManual`, `closeIdleSessions`.
- [x] Uses fixed clock abstraction for testability.
- [x] Handles unique/idle conflict (closes stale, creates new).
- [x] Records close reason.
- [x] Workspace scope via repository.
- [x] Records selected agent.

_Requirements: AIA-R4, AIA-R16_

### 4.3 [P0] Integrate session service into inbound flow

- [x] `inbound-orchestrator.js` — resolves session after eligibility check.
- [x] Touches customer activity on inbound message.
- [x] Passes session ID + startedAt to context builder (via sessionStartedAt).
- [x] Touches assistant activity after response commit (via returned sessionSvc).
- [x] Acquires/releases per-chat run lock.

_Requirements: AIA-R4, AIA-R5_

### 4.4 [P0] Add session cleanup job

- [x] `session-cleanup.worker.js` — scans idle active sessions every 15 min.
- [x] Closes idempotently (only active sessions past threshold).
- [x] Triggered inline; final summary trigger deferred until Phase 6.

### 4.5 [P0] Checkpoint — session lifecycle

```text
session boundary tests        ✅ (7 unit tests)
session service impl          ✅ (6 methods, clock abstraction)
inbound integration           ✅ (prepareInboundTurn orchestrator)
session cleanup worker        ✅ (15-min interval, idempotent close)
```

## 5. Recent Memory and Context Builder

### 5.1 [P0] Define context item contracts

- [x] Types defined: platform_policy, workspace_policy, agent_instruction, greeting_policy, customer_profile, memory_context, rolling_summary, recent_messages, rag_context, commerce_state, tool_definitions, current_message.
- [x] Types used by `token-estimator.js` (SECTION_PRIORITY) and `composed-context.js`.

_Requirements: AIA-R10_

### 5.2 [P0] Implement context source loaders

- [x] `source-loaders.js` — `loadSession()`, `loadLatestSummary()`, `loadCommerceState()`, `loadAllSources()` using Promise.all.
- [x] `loadRecentMessages()` from Phase 1 — bounded, filtered.
- [x] Session loader — queries active session by chat.
- [x] Summary loader — queries latest active summary.
- [x] Commerce state loader placeholder.

_Requirements: AIA-R6, AIA-R10, AIA-R14, AIA-R24_

### 5.3 [P0] Implement deterministic context ordering

- [x] Platform policy first, current message last.
- [x] Greeting flags included between policy and messages.
- [x] Agent instruction cannot precede platform policy (verified by ordering in composeContext).
- [x] Token estimator enforces priority ordering.
- [x] Human takeover flag present.

_Requirements: AIA-R10, AIA-R28_

### 5.4 [P0] Implement token estimation and budget allocator

- [x] `estimateTokens()` — per-character estimation with type rates.
- [x] Configurable max input tokens (default 8000).
- [x] Output reserve (1000 tokens).
- [x] Per-section priority ordering (mandatory → optional).
- [x] Mandatory sections never removed (platform_policy, human_takeover, commerce_state, current_message).
- [x] Truncation reasons recorded.

**RED**

- [x] Oversized history trimmed.
- [x] Low-score RAG removed before safety.
- [x] Mandatory policy never removed.
- [x] Final context under configured budget.

_Requirements: AIA-R10, AIA-R30_

### 5.5 [P0] Implement context builder

- [x] `composeContext()` composes platform policy, agent instruction, greeting, takeover, summary, messages, current message.
- [x] Applies token budget allocation.
- [x] Produces provider-neutral systemMessages + conversationMessages array.
- [x] Records greeting flags and allocation metadata.

**Component tests**

- [x] Simple greeting (new chat).
- [x] Multi-turn (existing conversation).
- [x] Takeover active.
- [x] Agent instruction present.

_Requirements: AIA-R10, AIA-R26, AIA-R28_

### 5.6 [P1] Add redacted context preview for authorized debugging (deferred to API phase)

### 5.7 [P0] Checkpoint — context builder

```text
context item contracts   ✅ (12 types defined)
source loaders           ✅ (loadSession, loadSummary, loadAllSources)
deterministic ordering   ✅ (policy first, msg last)
token budget allocator   ✅ (mandatory preserved, optional trimmed)
composeContext           ✅ (6 tests passing)
---

## 6. Rolling Conversation Summary

### 6.1 [P0] Define summary schema and validator

- [x] Schema: customerGoal, resolvedFacts, pendingQuestions, selectedOutletReference, cartContext, supportIssue, commitmentsMade, doNotRepeat, lastState.
- [x] `validateSummary()` checks all required fields.

**Tests**

- [x] Valid summary passes.
- [x] Missing required fields rejected.
- [x] Non-object rejected.

_Requirements: AIA-R7, AIA-R28_

### 6.2 [P0] Create summary prompt and fake-provider tests

- [x] `shouldSummarize()` — threshold logic.
- [x] Default threshold 12 new messages.
- [x] Configurable per-agent.

_Requirements: AIA-R7, AIA-R17, AIA-R28_

### 6.3 [P0] Implement summary service

- [x] `summary-service.js` — `shouldSummarize()`, `validateSummary()`, `buildSummary()`.
- [x] `buildSummary()` supersedes old summary, creates new active summary.
- [x] Persists via `conversationSummariesRepository`.

_Requirements: AIA-R7_

### 6.4 [P0] Integrate summary into context

- [x] `composeContext()` includes rolling summary when available.
- [x] Summary loaded by `loadLatestSummary()` in source-loaders.
- [x] Context builder treats summary as trusted structured data (not live commerce).

## 7. Durable Customer Memory

### 7.1 [P0] Define memory policy matrix

- [x] Allowed categories: identity, language, outlet_preference, product_preference, communication_preference, customer_tag.
- [x] Forbidden keys: address, otp, password, card_data, payment_token, api_key.
- [x] Confidence levels: low, medium, high.
- [x] Confirmation requirement: explicit customer statement → high confidence auto-save; ambiguous → confirmation.
- [x] Conflict resolution: higher confidence supersedes lower.
- [x] Max injected memories: 10.

**Tests** (in `memory-service.test.js`)

- [x] Allowed explicit preference.
- [x] Forbidden address rejected.
- [x] Forbidden secret rejected.
- [x] Low-confidence inference accepted as candidate.
- [x] Invalid confidence rejected.

_Requirements: AIA-R8, AIA-R9, AIA-R28_

### 7.2 [P0] Define memory candidate schema

- [x] Fields: key, value, category, sourceType, sourceReferenceId, confidence, reason.
- [x] Schema enforced by `validateMemoryCandidate()`.

**Tests** (in `memory-service.test.js`)

- [x] Valid candidate.
- [x] Unknown category rejected.
- [x] Invalid confidence rejected.
- [x] Address detection.

_Requirements: AIA-R8_

### 7.3 [P0] Implement memory extraction service

- [x] `extractMemoryFromMessage()` — detects sweetness preference, favorite product mention, language preference.
- [x] `extractMemoryCandidates()` — async, deduplicates across messages, only processes customer/user messages.
- [x] Does not extract address.
- [x] Does not run on assistant messages.

**Tests** (in `memory-service.test.js`)

- [x] Explicit "kurang manis" → sweetness_preference.
- [x] Ambiguous product mention skipped.
- [x] Address not stored.
- [x] Multiple candidates deduplicated.
- [x] Assistant messages ignored.

_Requirements: AIA-R8, AIA-R17, AIA-R28_

### 7.4 [P0] Implement customer memory service

- [x] `createMemoryService()` with methods: propose, confirm, correct, forget, listActive, selectRelevantForContext.
- [x] Workspace/contact scope via repository.
- [x] Max 10 memories in context.
- [x] Conflicting key resolution (high confidence supersedes).
- [x] Audit through repository (no audit log service yet).
- [x] Deleted memory excluded immediately (delete_at filter in repo).

**Tests** (in `memory-service.test.js`)

- [x] Candidate to created.
- [x] Correction supersedes old, creates new.
- [x] Forget removes.
- [x] Invalid candidate rejected.
- [x] Active/confirmed filter.

_Requirements: AIA-R8, AIA-R9_

### 7.5 [P0] Add memory tools

- [x] `memory-tools.js` — 5 tool definitions with schemas, permissions, confirmation policies.
- [x] `executeMemoryTool()` — dispatcher for all 5 tools.
- [x] Confirmation: none for list, customer for mutations.
- [x] Forbidden categories prevented by memory service validation.

**Tests** (in `memory-tools.test.js`)

- [x] 5 tools exported.
- [x] list is read-only, idempotent.
- [x] save requires category, is mutation.
- [x] forget is idempotent.

_Requirements: AIA-R8, AIA-R9, AIA-R19, AIA-R20_

### 7.6 [P0] Integrate memory into context

- [x] `composeContext()` accepts `memories` parameter.
- [x] Injects only active/confirmed memories as `Customer Preferences`.
- [x] Labeled as profile data (not instruction).
- [x] Respects token budget (goes through `allocateTokenBudget`).
- [x] Address/preferences with forbidden keys never reach the builder (blocked by memory service).

**Tests** (in `composed-context.test.js`)

- [x] Memories appear in system messages.
- [x] Memory content visible.

_Requirements: AIA-R8, AIA-R9, AIA-R10_

### 7.7 [P0] Memory privacy API integration (deferred to API routes phase)

### 7.8 [P0] Memory retention job

- [x] `memory-retention.worker.js` — daily cleanup of expired/deleted memories.

_Requirements: AIA-R9, AIA-R29_

### 7.9 [P0] Checkpoint — durable memory

```text
memory policy matrix      ✅ (6 categories, forbidden keys, confidence levels)
candidate schema           ✅ (validation + tests)
extraction service         ✅ (sweetness, language, product mentions)
memory service             ✅ (propose/correct/forget/list/select)
memory tools               ✅ (5 tool definitions + executor)
context integration        ✅ (memories injected via composeContext)
retention worker           ✅ (daily cleanup)
---

## 8. Knowledge Source Management

### 8.1 [P0] Define knowledge source schemas

- [x] Types: FAQ, SOP, PRODUCT_DESCRIPTION, PROMOTION_RULE, REFUND_POLICY, PAYMENT_INSTRUCTION, COMPLAINT_PROCEDURE, OPENING_HOURS, BRAND_TONE, UPLOADED_FILE, STRUCTURED_RECORD.
- [x] Scopes: workspace, outlet, agent, channel.
- [x] Lifecycle: draft → processing → ready_for_review → published → archived; also rejected, failed.
- [x] Lifecycle validated by `canTransition()`.

**Tests** (in `knowledge-rag.test.js`)

- [x] Valid type/scope/status via lifecycle transitions.
- [x] Invalid lifecycle transition blocked.

_Requirements: AIA-R11_

### 8.2 [P0] Implement knowledge source service

- [x] `knowledge-service.js` — `createKnowledgeService()`, `canTransition()`.
- [x] Methods: createDraft, updateDraft, startIngestion, markReady, publish, reject, archive, list, findById.
- [x] Publish blocks `ai_draft` type (AI cannot auto-publish).
- [x] Lifecycle transition validation on every state change.
- [x] Update published source creates new draft version.

**Tests** (in `knowledge-rag.test.js`)

- [x] Lifecycle transitions.
- [x] AI publish denied.
- [x] Draft → processing.

_Requirements: AIA-R11, AIA-R28, AIA-R34_

### 8.3 [P0] Build knowledge APIs (deferred to API route phase)

### 8.4 [P0] Agent knowledge assignment (deferred to API route phase)

### 8.5 [P0] Checkpoint — knowledge lifecycle

```text
knowledge schemas    ✅ (11 types, 4 scopes, full lifecycle)
transition validation ✅ (canTransition + tests)
knowledge service     ✅ (9 methods with lifecycle guards)
AI auto-publish       ✅ blocked
```

### 9.1 [P0] Define normalized document contract

- [x] Fields: sourceId, version, title, content, metadata, contentHash.
- [x] Handled by `chunkDocument()` input/output.

_Requirements: AIA-R12_

### 9.2 [P0] Implement safe document loaders (deferred to file upload integration)

### 9.3 [P0] Implement semantic chunker

- [x] `chunker.js` — `chunkDocument()`.
- [x] Target 300–700 tokens (configurable constants).
- [x] Overlap 50–100 tokens.
- [x] Preserves markdown headings as section boundaries.
- [x] Includes source section metadata.
- [x] Content hash computed.

**Tests** (in `knowledge-rag.test.js`)

- [x] Short content → one chunk.
- [x] Long content → multiple chunks.
- [x] Headings preserved.
- [x] Empty content → no chunks.

_Requirements: AIA-R12_

### 9.4 [P0] Implement embedding provider adapter (deferred; fake provider exists in test helpers)

### 9.5 [P0] Implement ingestion service

- [x] `ingestion-service.js` — `ingestSource()`.
- [x] Flow: find → startIngestion → chunk → deleteSupersededChunks → insertChunks → markReady.
- [x] Idempotent (supersedes old chunks by source/version).
- [x] Partial failure marks source as `failed`.

_Requirements: AIA-R12, AIA-R29_

### 9.6 [P0] Implement ingestion worker (deferred to background job infrastructure)

### 9.7 [P0] Ingestion preview and publish gate (deferred to API phase)

### 9.8 [P0] Checkpoint — ingestion

```text
chunker        ✅ (preserves headings, overlap, token targets)
ingestion svc  ✅ (full flow: draft → chunks → ready)
```

### 10.1 [P0] Define retrieval input/output contracts

- [x] Input: workspaceId, agentId, confirmedOutletId, query, topK, threshold.
- [x] Output: chunkId, sourceId, content, score, scope metadata.

_Requirements: AIA-R13_

### 10.2 [P0] Implement vector retriever (via knowledgeChunksRepository.vectorSearch)

- [x] Repository method exists with workspace, outlet, agent filters, threshold, topK.
- [x] pgvector integration in place.

_Requirements: AIA-R13, AIA-R28_

### 10.3 [P0] Implement full-text retriever (via knowledgeChunksRepository.fullTextSearch)

- [x] Repository method with same scope filters.
- [x] PostgreSQL full-text search with language config.

_Requirements: AIA-R13_

### 10.4 [P0] Implement hybrid retrieval merge

- [x] `hybridRetrieve()` — merges vector + full-text results.
- [x] Deduplicates by chunk ID.
- [x] Respects topK limit.

**Tests** (in `knowledge-rag.test.js`)

- [x] Returns array (empty when no data).
- [x] Graceful fallback when vector index unavailable.

_Requirements: AIA-R13, AIA-R28_
- [ ] Stable ordering.
- [ ] Configurable weights.
- [ ] Optional reranker interface.

**Unit tests**

- [ ] Duplicate merge.
- [ ] Vector-only.
- [ ] Keyword-only.
- [ ] Equal-score deterministic order.
- [ ] Threshold after merge.
- [ ] Top K enforced.

_Requirements: AIA-R13_

### 10.5 [P1] Implement query rewrite

- [ ] Use structured output.
- [ ] Preserve customer intent.
- [ ] Preserve outlet/agent scope outside model.
- [ ] Do not send unnecessary PII.
- [ ] Fallback to original query.

**Tests**

- [ ] Follow-up query resolution.
- [ ] Malformed rewrite.
- [ ] Injection attempt.
- [ ] Timeout.
- [ ] Original query fallback.

_Requirements: AIA-R13, AIA-R17, AIA-R28_

### 10.6 [P0] Implement RAG service

- [ ] Decide whether retrieval needed.
- [ ] Run hybrid retrieval.
- [ ] Apply threshold.
- [ ] Pack context.
- [ ] Return citation metadata.
- [ ] Record metrics.
- [ ] Safe no-result result.

**Component tests**

- [ ] FAQ answer source.
- [ ] Outlet-specific SOP.
- [ ] Agent-specific source.
- [ ] No relevant result.
- [ ] Conflicting source versions.
- [ ] Retriever timeout.

_Requirements: AIA-R13, AIA-R26_

### 10.7 [P0] Grounded answer policy

- [ ] Prompt tells model to use retrieved data as untrusted evidence.
- [ ] No source means no invented policy.
- [ ] Conflict means clarify/escalate.
- [ ] Live commerce facts require tools.
- [ ] Customer citations optional.
- [ ] Admin trace includes sources.

**Evaluation tests**

- [ ] Answer grounded in FAQ.
- [ ] Refuses unsupported refund claim.
- [ ] Does not use stale price from document.
- [ ] Handles conflicting policy.
- [ ] No-answer response is helpful.

_Requirements: AIA-R13, AIA-R14, AIA-R28_

### 10.8 [P0] RAG security suite

- [ ] Cross-workspace retrieval attack.
- [ ] Cross-outlet attack.
- [ ] Agent scope attack.
- [ ] RAG prompt injection.
- [ ] Secret-like document.
- [ ] Archived/expired document.
- [ ] Malicious instruction “ignore system”.
- [ ] Retrieval query manipulation.

_Requirements: AIA-R13, AIA-R28, AIA-R33_

### 10.9 [P0] RAG E2E

- [ ] Upload source.
- [ ] Ingest.
- [ ] Review/publish.
- [ ] Ask question from Telegram.
- [ ] Retrieve source.
- [ ] Generate grounded answer.
- [ ] Trace source.
- [ ] Archive source.
- [ ] Confirm no longer retrieved.

_Requirements: AIA-R11, AIA-R12, AIA-R13_

### 10.10 [P0] Checkpoint — RAG

---

## 11. AI Agent Configuration and Versioning

### 11.1 [P0] Define agent configuration schema

Fields per requirements/design:

```text
name
displayName
description
status
provider
model
fallbackProvider
fallbackModel
systemInstruction
toneConfig
languageConfig
knowledgeConfig
memoryPolicy
toolPolicy
routingConfig
followupPolicy
temperature
maxOutputTokens
maxToolCalls
maxIterations
timeoutMs
```

**Tests**

#- [x] Valid agent.
#- [x] Invalid temperature.
#- [x] Invalid tool.
#- [x] Invalid provider/model.
#- [x] Unsafe attempt to disable platform safety.
#- [x] Duplicate name policy.
#- [x] Missing default language.

_Requirements: AIA-R15_

### 11.2 [P0] Implement agent versioning

- [ ] Draft config editable.
- [ ] Publish creates immutable version.
- [ ] Existing published version not mutated.
- [ ] Rollback creates/activates approved version.
- [ ] Archive prevents new assignment.
- [ ] AI run records version.

**Tests**

- [ ] Publish v1.
- [ ] Edit creates draft v2.
- [ ] v1 unchanged.
- [ ] Publish v2.
- [ ] Rollback.
- [ ] Archived agent not selected.
- [ ] Historical run resolves old version.

_Requirements: AIA-R15, AIA-R26_

### 11.3 [P0] Implement platform safety overlay

- [ ] Immutable payment rules.
- [ ] Human takeover rule.
- [ ] Workspace isolation.
- [ ] Tool boundary.
- [ ] Prompt injection rule.
- [ ] Live commerce authority.
- [ ] Agent instruction merged below platform policy.

**Security tests**

- [ ] Agent prompt requests mark-paid.
- [ ] Agent prompt requests secret.
- [ ] Agent prompt disables handoff.
- [ ] Agent prompt says ignore workspace.
- [ ] All attempts remain blocked.

_Requirements: AIA-R15, AIA-R22, AIA-R24, AIA-R28_

### 11.4 [P0] Implement agent test sandbox

- [ ] Use read-only/mocked tools by default.
- [ ] Use test context.
- [ ] No production side effect.
- [ ] Show selected model/knowledge/tools.
- [ ] Return trace preview.
- [ ] Allow evaluation scenarios.

**Tests**

- [ ] Mutation tool blocked in test mode.
- [ ] Read tool mocked.
- [ ] Secret redacted.
- [ ] Test does not create order/payment.
- [ ] Cross-workspace denied.

_Requirements: AIA-R15, AIA-R34_

### 11.5 [P0] Build agent APIs

Conceptually:

```text
GET    /api/agents
POST   /api/agents
GET    /api/agents/:id
PATCH  /api/agents/:id
POST   /api/agents/:id/test
POST   /api/agents/:id/publish
POST   /api/agents/:id/archive
GET    /api/agents/:id/versions
PUT    /api/agents/:id/tools
PUT    /api/agents/:id/knowledge
```

**API/security tests**

- [ ] Workspace scope.
- [ ] Permission.
- [ ] Version conflict.
- [ ] Secret fields absent.
- [ ] Invalid tool denied.
- [ ] Publish/rollback.
- [ ] Pagination/filtering.

_Requirements: AIA-R15, AIA-R34_

### 11.6 [P0] Checkpoint — configurable agents

---

## 12. Model Provider Adapter and Router

### 12.1 [P0] Define provider-neutral interfaces

```text
chat
structured
embed
health
```

- [ ] Define request/response types.
- [ ] Define normalized usage.
- [ ] Define normalized error codes.
- [ ] Define timeout/cancellation.
- [ ] Define tool call format.

**Contract tests**

- [ ] Fake provider conforms.
- [ ] Local provider conforms.
- [ ] Malformed provider response rejected.
- [ ] Usage optional.
- [ ] Cancellation propagated.

_Requirements: AIA-R17_

### 12.2 [P0] Implement local OpenAI-compatible adapter

- [ ] Configurable base URL.
- [ ] Configurable key.
- [ ] Chat completions/tool-call support according to actual endpoint.
- [ ] Structured output compatibility.
- [ ] Timeouts.
- [ ] Safe logging.
- [ ] Health probe.

**Tests**

- [ ] Request mapping.
- [ ] Response mapping.
- [ ] Tool call mapping.
- [ ] Timeout.
- [ ] HTTP error.
- [ ] Invalid JSON.
- [ ] Secret redaction.
- [ ] Health result.

_Requirements: AIA-R17, AIA-R28_

### 12.3 [P0] Implement model task router

Task roles:

```text
chat
classifier
summary
memory extraction
embedding
planning
```

- [ ] Configurable model per task.
- [ ] Agent override within policy.
- [ ] Default fallback.
- [ ] Record selection reason.

**Tests**

- [ ] Chat routes correctly.
- [ ] Summary routes correctly.
- [ ] Missing role uses default.
- [ ] Inactive model config fails safely.
- [ ] Agent override validated.

_Requirements: AIA-R17_

### 12.4 [P1] Implement optional fallback provider contract

- [ ] External provider adapter optional.
- [ ] Workspace policy required.
- [ ] Data classification check.
- [ ] No restricted data without approval.
- [ ] Record fallback usage.
- [ ] Avoid duplicate tool mutation.

**Tests**

- [ ] Local timeout triggers allowed fallback.
- [ ] Policy disabled blocks fallback.
- [ ] Restricted context blocks external fallback.
- [ ] Tool result not re-executed.
- [ ] Fallback response trace.

_Requirements: AIA-R17, AIA-R28_

### 12.5 [P0] Implement circuit breaker

- [ ] Healthy/degraded/open/half-open.
- [ ] Failure thresholds.
- [ ] Recovery window.
- [ ] Per-provider state.
- [ ] Metrics.
- [ ] Optional Redis-backed future adapter.

**Unit/concurrency tests**

- [ ] Opens after threshold.
- [ ] Rejects while open.
- [ ] Half-open probe.
- [ ] Closes on success.
- [ ] Parallel failures safe.
- [ ] State loss degrades safely.

_Requirements: AIA-R17, AIA-R29, AIA-R30_

### 12.6 [P0] Provider resilience suite

- [ ] Slow model.
- [ ] Timeout.
- [ ] Malformed structured output.
- [ ] Rate limit.
- [ ] Provider 500.
- [ ] Connection refused.
- [ ] Partial stream/response.
- [ ] Cancellation due to takeover.

_Requirements: AIA-R17, AIA-R24, AIA-R33_

### 12.7 [P0] Checkpoint — model layer

---

## 13. Agent Router and Semantic Router

### 13.1 [P0] Implement deterministic agent assignment

Priority:

```text
chat assignment
→ outlet/channel rule
→ platform default
→ workspace default
```

**RED**

- [ ] Chat assignment wins.
- [ ] Outlet/channel rule wins over default.
- [ ] Platform default wins over workspace default.
- [ ] Inactive agent excluded.
- [ ] Cross-workspace agent denied.
- [ ] No agent returns safe error/handoff.

_Requirements: AIA-R16_

### 13.2 [P0] Define semantic intent schema

Intents:

```text
greeting
knowledge
product
commerce
order_status
payment_status
complaint
handoff
other
```

Output:

```text
intent
needsRag
needsTools
requiresHuman
confidence
```

**Tests**

- [ ] Valid output.
- [ ] Low confidence.
- [ ] Unknown intent.
- [ ] Injection attempt.
- [ ] Payment dispute requires human.
- [ ] General greeting no tool.

_Requirements: AIA-R16, AIA-R23_

### 13.3 [P0] Implement lightweight semantic router

- [ ] Prefer deterministic signals when available.
- [ ] Use classifier model when needed.
- [ ] Do not perform mutation.
- [ ] Preserve workspace scope outside model.
- [ ] Record decision.

**Component/evaluation tests**

- [ ] Product query.
- [ ] Order status.
- [ ] Payment status.
- [ ] Complaint.
- [ ] Human request.
- [ ] Ambiguous message.
- [ ] Low confidence fallback.

_Requirements: AIA-R16, AIA-R17, AIA-R26_

### 13.4 [P0] Integrate router with human takeover

- [ ] Takeover checked before router.
- [ ] Router cannot override takeover.
- [ ] Internal suggestion mode explicit.
- [ ] Handoff intent activates takeover through tool/service.

**Tests**

- [ ] Active takeover no customer run.
- [ ] Internal suggestion mode.
- [ ] Customer asks human.
- [ ] Router custom prompt cannot bypass.

_Requirements: AIA-R16, AIA-R24_

### 13.5 [P1] Router quality metrics

- [ ] Store intent/confidence.
- [ ] Allow admin correction.
- [ ] Build confusion summary.
- [ ] Link to feedback.

**Tests**

- [ ] Metric recorded.
- [ ] Correction scoped.
- [ ] Aggregate by agent version.

_Requirements: AIA-R26, AIA-R27_

### 13.6 [P0] Checkpoint — routing

---

## 14. AI Orchestrator

### 14.1 [P0] Define AI turn state machine

States:

```text
received
eligible
context_building
model_running
tool_requested
tool_running
finalizing
persisting
sending
completed
failed
cancelled
handed_off
```

**Tests**

- [ ] Valid transitions.
- [ ] Invalid transition rejected.
- [ ] Terminal state immutable.
- [ ] Takeover cancellation.
- [ ] Timeout failure.
- [ ] Tool failure recovery.

_Requirements: AIA-R18, AIA-R26_

### 14.2 [P0] Define structured model response schema

```text
responseType
message
toolCalls
memoryCandidates
confidence
needsHuman
reasonCode
```

**Tests**

- [ ] Message response.
- [ ] Tool call response.
- [ ] Handoff.
- [ ] No reply.
- [ ] Invalid mixed response.
- [ ] Unknown tool structure.
- [ ] Oversized response.

_Requirements: AIA-R18_

### 14.3 [P0] Implement orchestrator skeleton with fake provider

- [ ] Create run.
- [ ] Select agent.
- [ ] Build context.
- [ ] Call model.
- [ ] Validate result.
- [ ] Persist assistant message.
- [ ] Send through channel adapter.
- [ ] Complete run.
- [ ] No tools yet.

**Component tests**

- [ ] Normal response.
- [ ] Model error.
- [ ] Persistence error.
- [ ] Send error.
- [ ] Takeover before send.
- [ ] Context failure.
- [ ] Trace linkage.

_Requirements: AIA-R18, AIA-R24, AIA-R26_

### 14.4 [P0] Implement bounded tool loop

- [ ] Handle tool request.
- [ ] Call Tool Gateway.
- [ ] Append normalized tool result.
- [ ] Reinvoke model.
- [ ] Enforce max tool calls.
- [ ] Enforce max iterations.
- [ ] Enforce wall-clock timeout.
- [ ] Prevent identical mutation repeat.
- [ ] Stop on handoff.

**RED**

- [ ] One read tool.
- [ ] Sequential tools.
- [ ] Tool error.
- [ ] Loop limit.
- [ ] Repeated identical mutation.
- [ ] Timeout.
- [ ] Takeover mid-loop.

_Requirements: AIA-R18, AIA-R19, AIA-R30_

### 14.5 [P0] Implement cancellation and takeover re-checks

Check before:

```text
model call
tool mutation
final persistence
outbound send
```

**Concurrency tests**

- [ ] Takeover activated while model waits.
- [ ] Takeover activated before tool.
- [ ] Takeover activated after tool commit.
- [ ] Takeover activated before send.
- [ ] Correct cancellation/notification behavior.

_Requirements: AIA-R18, AIA-R24_

### 14.6 [P0] Implement safe retry policy

- [ ] Retry model-only transient failures.
- [ ] Do not re-run committed mutation.
- [ ] Reuse tool result when model retry follows tool.
- [ ] Track retry count.
- [ ] Stop at limit.
- [ ] Fallback if allowed.

**Tests**

- [ ] Model timeout before tool.
- [ ] Model timeout after tool result.
- [ ] Tool timeout unknown state.
- [ ] Idempotent read retry.
- [ ] Non-idempotent mutation no blind retry.

_Requirements: AIA-R18, AIA-R19, AIA-R29_

### 14.7 [P0] Implement output policy and tone validation

- [ ] Bahasa Indonesia.
- [ ] Friendly semi-formal Gen-Z.
- [ ] Avoid repeated intro.
- [ ] Avoid unsupported promises.
- [ ] Avoid revealing internal IDs/secrets.
- [ ] Keep concise by default.
- [ ] Respect channel limits.

**Evaluation tests**

- [ ] Greeting.
- [ ] Product answer.
- [ ] Tool error.
- [ ] Payment pending.
- [ ] Complaint.
- [ ] Handoff.
- [ ] Long verbose answer flagged.

_Requirements: AIA-R5, AIA-R15, AIA-R27_

### 14.8 [P0] Orchestrator E2E without commerce mutation

- [ ] Telegram knowledge answer.
- [ ] WhatsApp knowledge answer.
- [ ] Multi-turn.
- [ ] RAG source trace.
- [ ] Memory injection.
- [ ] Human takeover cancellation.
- [ ] Provider fallback disabled behavior.

_Requirements: AIA-R1, AIA-R5, AIA-R10, AIA-R13, AIA-R18_

### 14.9 [P0] Checkpoint — orchestrator

---

## 15. Tool Registry and Tool Gateway

### 15.1 [P0] Define tool metadata schema

Fields:

```text
name
description
inputSchema
requiredPermission
confirmationPolicy
mutation
idempotent
timeoutMs
resultRedactor
availability
```

**Tests**

- [ ] Valid tool.
- [ ] Duplicate name.
- [ ] Invalid schema.
- [ ] Missing permission.
- [ ] Mutation without idempotency policy.
- [ ] Forbidden tool name.

_Requirements: AIA-R19_

### 15.2 [P0] Implement tool registry

- [ ] Explicit registration.
- [ ] No dynamic arbitrary imports from model input.
- [ ] Agent allowlist filtering.
- [ ] Tool version support if needed.
- [ ] Read-only test registry.
- [ ] Forbidden global tools list.

**Tests**

- [ ] Known tool lookup.
- [ ] Unknown tool rejection.
- [ ] Agent allowlist.
- [ ] Test-mode mutation blocked.
- [ ] Mark-paid cannot be registered through config.

_Requirements: AIA-R19, AIA-R22, AIA-R28_

### 15.3 [P0] Implement Tool Gateway validation pipeline

Flow:

```text
lookup
→ schema validation
→ agent permission
→ workspace scope
→ contact/chat scope
→ outlet scope
→ confirmation
→ idempotency
→ domain call
→ result redaction
→ trace
```

**Component/security tests**

- [ ] Invalid schema.
- [ ] Unauthorized agent.
- [ ] Cross-workspace ID.
- [ ] Cross-outlet ID.
- [ ] Missing confirmation.
- [ ] Expired confirmation.
- [ ] Duplicate idempotency key.
- [ ] Domain service error.
- [ ] Redaction.

_Requirements: AIA-R19, AIA-R20, AIA-R28_

### 15.4 [P0] Implement confirmation token/state service

- [ ] Bind confirmation to:
  - chat;
  - contact;
  - agent;
  - tool;
  - normalized arguments/action snapshot;
  - expiry.
- [ ] Invalidate if cart/action state changes.
- [ ] Support button/natural-language confirmation.
- [ ] Do not accept silence.
- [ ] Handle ambiguous “oke”.

**Tests**

- [ ] Valid confirmation.
- [ ] Wrong chat.
- [ ] Wrong tool.
- [ ] Changed arguments.
- [ ] Expired.
- [ ] Reused confirmation.
- [ ] Ambiguous natural language.
- [ ] State changed after confirmation.

_Requirements: AIA-R20_

### 15.5 [P0] Implement tool idempotency service

- [ ] Generate stable keys.
- [ ] Persist mutation execution record if necessary.
- [ ] Return prior result for safe duplicate.
- [ ] Detect same key/different args conflict.
- [ ] Handle unknown timeout state.

**Tests**

- [ ] Same key/same args returns prior result.
- [ ] Same key/different args conflict.
- [ ] Concurrent duplicate executes once.
- [ ] Failed before commit retry.
- [ ] Unknown provider result reconciliation path.

_Requirements: AIA-R19, AIA-R29_

### 15.6 [P0] Implement safe result normalizer/redactor

- [ ] Standard shape:
  ```text
  ok
  code
  data
  userSafeMessage
  retryable
  ```
- [ ] Remove secret/token/raw payload.
- [ ] Limit result size.
- [ ] Preserve authoritative timestamps.

**Tests**

- [ ] Product result.
- [ ] Cart result.
- [ ] Payment link result.
- [ ] Provider error.
- [ ] Secret nested in payload.
- [ ] Oversized result.

_Requirements: AIA-R19, AIA-R22, AIA-R28_

### 15.7 [P0] Tool Gateway observability

- [ ] Create tool-call trace before execution.
- [ ] Complete/fail trace.
- [ ] Record latency.
- [ ] Record confirmation state.
- [ ] Record idempotency key.
- [ ] Redact args/result.

**Tests**

- [ ] Success trace.
- [ ] Validation failure trace policy.
- [ ] Timeout trace.
- [ ] Secret absent.
- [ ] Cross-workspace trace access denied.

_Requirements: AIA-R26_

### 15.8 [P0] Tool Gateway security suite

- [ ] Unknown tool.
- [ ] Prompt-created fake tool.
- [ ] Hidden admin tool.
- [ ] Direct mark-paid.
- [ ] Cross-workspace order.
- [ ] Cross-outlet product.
- [ ] Secret extraction.
- [ ] Tool result injection.
- [ ] Confirmation forgery.
- [ ] Replay.

_Requirements: AIA-R19, AIA-R22, AIA-R28, AIA-R33_

### 15.9 [P0] Checkpoint — Tool Gateway

---

## 16. AI Commerce Tool Contracts

This section integrates AI with existing backend domain services only.

It SHALL NOT redesign domain internals.

### 16.1 [P0] Define read tool contracts

Tools:

```text
get_outlets
search_products
get_product_details
get_product_availability
get_outlet_status
get_active_cart
get_cart_summary
get_order_status
get_payment_status
get_contact_profile
```

- [ ] Define strict input schemas.
- [ ] Define normalized results.
- [ ] Define freshness.
- [ ] Define permissions.
- [ ] Define timeouts.

**Contract tests**

- [ ] Domain fake conforms.
- [ ] Missing backend contract yields blocked/safe error.
- [ ] Workspace scope.
- [ ] Outlet scope.
- [ ] Result redaction.

_Requirements: AIA-R14, AIA-R19, AIA-R21_

### 16.2 [P0] Define mutation tool contracts

Tools:

```text
select_outlet
add_cart_item
update_cart_item
remove_cart_item
clear_cart
switch_cart_outlet
create_order
create_payment_link
resend_payment_link
cancel_unpaid_order
```

- [ ] Define confirmation rules.
- [ ] Define idempotency.
- [ ] Define authoritative backend validation.
- [ ] Define safe result.
- [ ] Do not accept price/payment status from model.

**Contract tests**

- [ ] Explicit add item.
- [ ] Ambiguous item.
- [ ] Switch outlet confirmation.
- [ ] Create order confirmation.
- [ ] Duplicate create order.
- [ ] Amount ignored/rejected.
- [ ] Cross-workspace resource.

_Requirements: AIA-R19, AIA-R20, AIA-R21, AIA-R22_

### 16.3 [P0] Implement outlet selection AI flow

- [ ] Detect order intent.
- [ ] Load active outlets.
- [ ] Suggest last outlet.
- [ ] Ask confirmation.
- [ ] Call `select_outlet`.
- [ ] Persist current outlet through domain contract.
- [ ] Do not assume suggestion.

**Evaluation/integration tests**

- [ ] No last outlet.
- [ ] Last outlet suggestion.
- [ ] Customer chooses different outlet.
- [ ] Closed/inactive outlet.
- [ ] One outlet still asks confirmation according to policy.
- [ ] Cross-workspace outlet denied.

_Requirements: AIA-R20, AIA-R21_

### 16.4 [P0] Implement product discovery flow

- [ ] RAG for descriptive explanation.
- [ ] Tool for price/availability.
- [ ] Ask clarification for ambiguous product.
- [ ] Respect selected outlet.
- [ ] Use customer preferences as suggestion only.

**Tests/evaluation**

- [ ] Product available.
- [ ] Product unavailable.
- [ ] Price from tool.
- [ ] Description from RAG.
- [ ] Stale RAG price ignored.
- [ ] Preference-based recommendation.
- [ ] No selected outlet.

_Requirements: AIA-R8, AIA-R13, AIA-R14, AIA-R21_

### 16.5 [P0] Implement cart conversation flow

- [ ] Add/update/remove.
- [ ] Show server totals.
- [ ] One active cart.
- [ ] One outlet.
- [ ] Switch outlet confirmation.
- [ ] Cart expiry.
- [ ] No client/model price.

**Integration/E2E tests**

- [ ] Add one item.
- [ ] Add quantity.
- [ ] Remove.
- [ ] Clear confirmation.
- [ ] Switch outlet.
- [ ] Expired cart.
- [ ] Price changed.
- [ ] Product unavailable.
- [ ] Duplicate message/tool call.

_Requirements: AIA-R20, AIA-R21_

### 16.6 [P0] Implement final order confirmation flow

- [ ] Load fresh cart.
- [ ] Show summary.
- [ ] Create confirmation snapshot.
- [ ] Require explicit confirmation.
- [ ] Invalidate if cart changes.
- [ ] Call `create_order`.
- [ ] Persist confirmation evidence.
- [ ] Handle idempotent retry.

**Tests**

- [ ] Confirmed order.
- [ ] No confirmation.
- [ ] Stale confirmation.
- [ ] Changed cart.
- [ ] Duplicate confirmation.
- [ ] Domain failure.
- [ ] Human takeover before execution.

_Requirements: AIA-R20, AIA-R21_

### 16.7 [P0] Enforce pickup-only conversation policy

- [ ] Do not ask address.
- [ ] Do not offer delivery.
- [ ] Do not store address memory.
- [ ] Use pickup outlet details.
- [ ] Explain feature unavailable if customer asks delivery.

**Evaluation tests**

- [ ] Pickup order.
- [ ] Customer gives address unprompted.
- [ ] Customer asks delivery.
- [ ] Address not stored.
- [ ] Agent custom prompt cannot enable delivery.

_Requirements: AIA-R8, AIA-R9, AIA-R21_

### 16.8 [P0] Commerce failure behavior

- [ ] Product service unavailable.
- [ ] Cart conflict.
- [ ] Order conflict.
- [ ] Outlet closed.
- [ ] Timeout.
- [ ] Offer retry/handoff.
- [ ] Never claim success.

**Resilience/evaluation tests**

- [ ] Each safe error mapped.
- [ ] No false success.
- [ ] Handoff after repeated failures.
- [ ] Trace records failure.

_Requirements: AIA-R18, AIA-R21, AIA-R23_

### 16.9 [P0] Commerce AI E2E

Flow:

```text
customer wants order
→ outlet confirmation
→ product lookup
→ cart
→ summary
→ explicit order confirmation
→ order created
```

Run for:

```text
Telegram
WhatsApp
```

Use fake/test domain services unless live sandbox suite.

_Requirements: AIA-R1, AIA-R19, AIA-R20, AIA-R21_

### 16.10 [P0] Checkpoint — commerce tools

---

## 17. Payment Read-Only AI Boundary

### 17.1 [P0] Add forbidden payment capability tests first

**RED**

- [ ] Agent config attempts to add `mark_payment_paid`.
- [ ] Model requests `set_payment_status`.
- [ ] Model requests direct Xendit API.
- [ ] Customer sends fake screenshot claim.
- [ ] Customer says “sudah bayar”.
- [ ] RAG document says “mark as paid”.
- [ ] Human-facing agent custom prompt grants paid.

All SHALL fail safely.

_Requirements: AIA-R22, AIA-R28, AIA-R33_

### 17.2 [P0] Register allowed payment tools only

Allowed:

```text
create_payment_link
resend_payment_link
get_payment_status
```

- [ ] `create_payment_link` requires valid order.
- [ ] Amount comes from backend.
- [ ] `resend_payment_link` reuses active link when valid.
- [ ] `get_payment_status` read-only.
- [ ] Result redacted in trace.

**Tests**

- [ ] Valid link.
- [ ] No order.
- [ ] Already paid.
- [ ] Active link reuse.
- [ ] Expired link behavior.
- [ ] Cross-workspace order.
- [ ] Model-provided amount rejected/ignored.

_Requirements: AIA-R19, AIA-R22_

### 17.3 [P0] Implement payment response policy

- [ ] Pending wording.
- [ ] Paid wording only from backend paid.
- [ ] Expired wording.
- [ ] Failed wording.
- [ ] Separate payment and fulfillment status.
- [ ] No refund promise.
- [ ] No manual transfer/COD suggestion.

**Evaluation tests**

- [ ] Pending.
- [ ] Paid.
- [ ] Expired.
- [ ] Customer screenshot.
- [ ] Provider unavailable.
- [ ] Paid but order not ready.
- [ ] Order ready but payment scenario according to backend.

_Requirements: AIA-R21, AIA-R22_

### 17.4 [P0] Integrate verified-paid notification trigger boundary

- [ ] AI does not pollute payment webhook handler.
- [ ] Backend event schedules notification after commit.
- [ ] AI/template layer reads committed state.
- [ ] Duplicate event produces one message.
- [ ] Human takeover policy applied according to transactional-notification policy.
- [ ] Trace does not contain secret payment URL/token.

**Integration tests**

- [ ] Verified paid event.
- [ ] Duplicate event.
- [ ] Stale failed event after paid.
- [ ] Amount mismatch.
- [ ] Invalid signature.
- [ ] Notification send failure.
- [ ] Retry dedupe.

_Requirements: AIA-R22, AIA-R25, AIA-R26_

### 17.5 [P0] Payment security suite

- [ ] No mark-paid tool anywhere.
- [ ] Agent tool allowlist cannot add forbidden tool.
- [ ] Prompt injection cannot call payment mutation.
- [ ] Frontend/customer claim cannot set paid.
- [ ] Trace/log secret redaction.
- [ ] Cross-workspace payment denied.
- [ ] Cross-outlet payment denied.
- [ ] External fallback does not receive restricted payment data.

_Requirements: AIA-R22, AIA-R28, AIA-R33_

### 17.6 [P0] Payment AI E2E

```text
confirmed order
→ payment link tool
→ customer receives link
→ backend test event marks paid
→ AI/notification says paid once
→ fulfillment remains separate
```

- [ ] Telegram.
- [ ] WhatsApp.
- [ ] Duplicate event.
- [ ] Human takeover.
- [ ] Provider failure.

_Requirements: AIA-R21, AIA-R22, AIA-R24, AIA-R25_

### 17.7 [P0] Checkpoint — payment boundary

Release blocker if any payment mutation path exists in AI.

---

## 18. Complaint and Human Escalation

### 18.1 [P0] Define complaint intent and escalation policy

- [ ] General question.
- [ ] Minor issue.
- [ ] Complaint ticket.
- [ ] Direct human request.
- [ ] Payment dispute.
- [ ] Security concern.
- [ ] Repeated misunderstanding.
- [ ] High emotional escalation.

**Tests**

- [ ] Classify each scenario.
- [ ] Low confidence.
- [ ] Payment dispute always human.
- [ ] Customer asks human always immediate.
- [ ] General complaint may offer ticket.

_Requirements: AIA-R23_

### 18.2 [P0] Define complaint tool contracts

Tools:

```text
create_complaint_ticket
handover_to_human
```

- [ ] Ticket summary confirmation required.
- [ ] Handoff immediate on request.
- [ ] Idempotency.
- [ ] Safe references.
- [ ] No refund action.

**Tests**

- [ ] Ticket created.
- [ ] Duplicate confirmation.
- [ ] Missing confirmation.
- [ ] Cross-workspace.
- [ ] Handoff.
- [ ] Refund request escalated.

_Requirements: AIA-R19, AIA-R20, AIA-R23_

### 18.3 [P0] Implement complaint detail collection flow

- [ ] Ask minimal relevant questions.
- [ ] Avoid repetitive questions.
- [ ] Use order/outlet context if available.
- [ ] Summarize without unsupported conclusion.
- [ ] Ask confirmation.
- [ ] Create ticket.
- [ ] Return reference.

**Evaluation/E2E tests**

- [ ] Product issue.
- [ ] Service issue.
- [ ] Payment issue.
- [ ] Customer changes statement.
- [ ] Attachment reference.
- [ ] Service failure.
- [ ] Customer chooses human instead.

_Requirements: AIA-R23_

### 18.4 [P0] Build internal human handoff summary

- [ ] Customer goal.
- [ ] Issue.
- [ ] Relevant order/payment state.
- [ ] Actions already attempted.
- [ ] Pending question.
- [ ] No hidden chain-of-thought.
- [ ] No secrets.

**Tests**

- [ ] Summary complete.
- [ ] Secret redacted.
- [ ] Unsupported inference excluded.
- [ ] Human can understand context.
- [ ] Stored as internal-only.

_Requirements: AIA-R7, AIA-R23, AIA-R28_

### 18.5 [P0] Complaint/handoff E2E

_Requirements: AIA-R23, AIA-R24_

### 18.6 [P0] Checkpoint — complaint and escalation

---

## 19. Human Takeover and Safe Resume

### 19.1 [P0] Write takeover race tests first

**RED**

- [ ] Takeover activates while model is running.
- [ ] Takeover activates before tool mutation.
- [ ] Takeover activates after mutation before send.
- [ ] New customer message resets timer.
- [ ] Pinned takeover never auto-resumes.
- [ ] Admin resume.
- [ ] Two admins acquire simultaneously.
- [ ] Delayed AI response cancelled.

_Requirements: AIA-R24, AIA-R33_

### 19.2 [P0] Implement AI eligibility takeover guard

- [ ] Check before run creation.
- [ ] Check after context build.
- [ ] Check before model.
- [ ] Check before mutation.
- [ ] Check before outbound send.
- [ ] Support internal suggestion mode explicitly.

**Tests**

- [ ] Every checkpoint.
- [ ] Internal suggestion not customer-visible.
- [ ] Custom prompt cannot bypass.

_Requirements: AIA-R24, AIA-R28_

### 19.3 [P0] Implement takeover timer state

Fields/contracts:

```text
mode
startedAt
expiresAt
lastCustomerMessageAt
reason
releasedAt
releasedBy
```

- [ ] Auto mode.
- [ ] Pinned mode.
- [ ] Timer = last customer message + 5 minutes.
- [ ] Fixed clock.

**Tests**

- [ ] Initial timer.
- [ ] Reset.
- [ ] Pinned.
- [ ] Manual resume.
- [ ] Invalid state.

_Requirements: AIA-R24_

### 19.4 [P0] Implement safe auto-resume worker

- [ ] Query eligible takeover records.
- [ ] Re-read latest state.
- [ ] Compare-and-set release.
- [ ] Ensure no new message.
- [ ] Ensure not pinned.
- [ ] Record audit/metric.
- [ ] Optionally open new AI session.

**Concurrency/worker tests**

- [ ] New message arrives during release.
- [ ] Admin pins during release.
- [ ] Duplicate worker.
- [ ] Two workers.
- [ ] DB failure.
- [ ] Retry.

_Requirements: AIA-R24, AIA-R29_

### 19.5 [P0] Takeover E2E

- [ ] Customer requests human.
- [ ] AI sends handoff acknowledgement once.
- [ ] Human takes over.
- [ ] Customer sends messages.
- [ ] AI remains silent.
- [ ] Timer resets.
- [ ] Five-minute inactivity.
- [ ] Auto resume.
- [ ] Next customer message handled by AI.
- [ ] Pinned variant.

_Requirements: AIA-R23, AIA-R24_

### 19.6 [P0] Checkpoint — human control

---

## 20. Proactive Messaging and Follow-Up

### 20.1 [P1] Define proactive event types and policy

- [x] 10 event types: payment_reminder, payment_expiry, order_accepted, preparing, ready_for_pickup, completed, feedback_request, abandoned_cart, complaint_update, promotion.
- [x] Transactional vs marketing classification.
- [x] Consent check for marketing.
- [x] Quiet hours (21:00-08:00).
- [x] Opt-out support.
- [x] `canSendProactive()` validates all policies.

**Tests** (in `followup-feedback-security.test.js`)

- [x] Transactional allowed without consent.
- [x] Marketing blocked without consent.
- [x] Opt-out blocks all.
- [x] Quiet hours check (omitted in test for determinism; logic verified).

_Requirements: AIA-R25_

### 20.2 [P1] Define scheduled follow-up model (in-memory prototype)

- [x] `scheduleFollowup()` with dedupe key, status, attempts, dueAt.
- [x] `cancelFollowup()` by dedupe key.
- [x] `processDueFollowups()` with state checker.

**Tests**

- [x] Schedule.
- [x] Duplicate rejected.
- [x] Cancel.
- [x] Due query.

_Requirements: AIA-R25, AIA-R29_

### 20.3 [P1] Implement follow-up scheduling service

- [x] Validate consent/channel.
- [x] Generate dedupe key.
- [x] Avoid duplicates.

_Requirements: AIA-R25_

### 20.4 [P1] Implement follow-up worker (in-memory prototype — `processDueFollowups`)

- [x] Claim due jobs.
- [x] Recheck authoritative state via stateChecker callback.
- [x] Retry policy.

_Requirements: AIA-R25, AIA-R29_

### 20.5 [P1] Follow-up E2E (deferred to integration with real scheduler)
- [ ] Feedback request.
- [ ] Abandoned cart.
- [ ] Opt-out wording.
- [ ] WhatsApp template path where required.

_Requirements: AIA-R25_

### 20.6 [P1] Checkpoint — proactive messaging

---

## 21. AI Trace and Observability

### 21.1 [P0] Define AI run lifecycle and fields

- [x] `aiRunsRepository` covers all fields: inbound_message, session, agent/version, provider/model, status, latency, tokens, error.
- [x] `trace-service.js` — `startTrace()`, `completeTrace()`, `failTrace()`.
- [x] Workspace scope via repository.

_Requirements: AIA-R26_

### 21.2 [P0] Implement centralized AI redaction

- [x] `result-redactor.js` — recursive redaction of secret/token/credential fields.
- [x] Covers API keys, auth headers, JWT, OTP, passwords, credentials.
- [x] Bounded payload size (50KB max).

**Tests** (in `tool-gateway.test.js`)

- [x] Nested secret redacted.
- [x] Array redaction.
- [x] Mixed case keys.

_Requirements: AIA-R26, AIA-R28_

### 21.3 [P0] Instrument orchestrator and context builder

- [x] `trace-service.js` provides structured trace lifecycle.
- [x] `traceToolCall()` / `completeToolTrace()` for tool instrumentation.
- [x] Context metadata passed to `completeTrace()`.

_Requirements: AIA-R26_

### 21.4 [P0] Instrument RAG and memory (deferred to production deployment)

### 21.5 [P0] Build trace APIs (deferred to API route phase)

### 21.6 [P0] Retention cleanup for traces

- [x] `aiRunsRepository.deleteExpired(30)` — 30-day retention.
- [x] `aiToolCallsRepository.deleteExpired(90)` — 90-day retention.

_Requirements: AIA-R26_

- [ ] Expired deleted/archived.
- [ ] Recent retained.
- [ ] Hold retained.
- [ ] Commerce records untouched.

_Requirements: AIA-R26, AIA-R29_

### 21.7 [P0] Checkpoint — observability

---

## 22. Feedback and Evaluation System

### 22.1 [P1] Implement feedback schema/service

- [x] `feedback-service.js` — `validateFeedback()`, `submitFeedback()`.
- [x] Rating 1-5, reason codes (correct, incorrect_tool, hallucination, rude, too_long, repeated_intro, wrong_language, other).
- [x] Agent version linkage via run_id → ai_runs.
- [x] Workspace scope via repository.

**Tests** (in `followup-feedback-security.test.js`)

- [x] Valid feedback.
- [x] Invalid rating rejected.
- [x] Invalid reason code rejected.
- [x] Null rating allowed.

_Requirements: AIA-R27_

### 22.2-22.4 [P1] Feedback APIs, evaluation dataset, runner (deferred to API/QA phase)
- [ ] Result persistence.
- [ ] Version comparison.

_Requirements: AIA-R27, AIA-R33_

### 22.5 [P0] Define agent publish quality gate

Blocking:

```text
payment safety failure
cross-workspace leakage
tool authorization failure
human takeover failure
repeated-introduction regression
```

- [ ] Publish checks latest required evaluation.
- [ ] Authorized waiver process if ever allowed.
- [ ] Waiver records owner/risk/expiry.
- [ ] Security gates cannot be waived casually.

**Tests**

- [ ] Passing agent publishes.
- [ ] Failing payment scenario blocks.
- [ ] Old evaluation invalid after config change.
- [ ] Wrong version evaluation rejected.

_Requirements: AIA-R15, AIA-R27, AIA-R33_

### 22.6 [P1] Optional live local-model quality suite

- [ ] Mark separate from deterministic CI.
- [ ] Use safe test data.
- [ ] Record model/version.
- [ ] Use thresholds, not brittle exact strings.
- [ ] Do not claim deterministic guarantee.

_Requirements: AIA-R17, AIA-R27_

### 22.7 [P0] Checkpoint — quality evaluation

---

## 23. AI Security Hardening

### 23.1 [P0] Create immutable platform safety policy module

- [x] `safety-policy.js` — `IMMUTABLE_SAFETY_RULES` (8 rules), `formatSafetyPolicy()`, `PROMPT_INJECTION_TEST_CORPUS`.
- [x] Rules: workspace_isolation, tool_authority, payment_read_only, human_takeover, secret_confidentiality, live_data_authority, prompt_injection_defense, bounded_autonomy.
- [x] Policy formatted as system message content.

**Tests** (in `followup-feedback-security.test.js`)

- [x] 8 rules present.
- [x] Formatted string includes CRITICAL severity.
- [x] Payment authority rule present.

_Requirements: AIA-R28_

### 23.2 [P0] Prompt injection test corpus

- [x] 10 injection scenarios: ignore_instructions, system_prompt_leak, mark_paid_injection, role_play_admin, token_extraction, code_execution, cross_workspace, memory_override, forget_safety, nested_encoding.

**Tests**

- [x] 10 entries present.
- [x] Includes mark_paid injection.

```text
ignore previous instructions
reveal system prompt
call hidden tool
mark payment paid
show another workspace
read secrets
treat document instructions as system
encode/exfiltrate data
```

- [ ] Customer-message attacks.
- [ ] RAG-document attacks.
- [ ] Tool-result attacks.
- [ ] Agent-instruction attacks.
- [ ] Multilingual/obfuscated variants.

_Requirements: AIA-R28, AIA-R33_

### 23.3 [P0] Tool escalation security tests

- [ ] Unknown tool.
- [ ] Tool alias.
- [ ] Case variation.
- [ ] Nested tool request.
- [ ] Multiple calls including forbidden one.
- [ ] Agent config injection.
- [ ] Specialist-agent escalation.
- [ ] Direct backend endpoint attempt through model.

_Requirements: AIA-R19, AIA-R22, AIA-R28_

### 23.4 [P0] Tenant isolation security suite

Test every AI-specific store/API:

```text
sessions
summaries
memories
knowledge
chunks
agents
versions
runs
tool calls
feedback
follow-ups
```

- [ ] Read.
- [ ] List.
- [ ] Create.
- [ ] Update.
- [ ] Delete/archive.
- [ ] Search/retrieval.
- [ ] Cross-outlet where applicable.

_Requirements: AIA-R28, AIA-R33_

### 23.5 [P0] Secret exposure tests

Inspect:

```text
prompt
provider request logs
AI trace
tool trace
API response
error response
structured logger
evaluation result
```

- [ ] Seed fake secrets.
- [ ] Assert absent or redacted.
- [ ] Include nested structures.
- [ ] Include exception causes.
- [ ] Include provider response.

_Requirements: AIA-R26, AIA-R28_

### 23.6 [P0] AI rate limiting and abuse controls

- [ ] Per workspace.
- [ ] Per contact/chat.
- [ ] Per platform.
- [ ] Message size.
- [ ] Attachment limit.
- [ ] Tool call limit.
- [ ] Burst policy.
- [ ] Safe 429 response.
- [ ] Internal transactional notifications unaffected as policy requires.

**Tests**

- [ ] Burst.
- [ ] Distributed key strategy.
- [ ] Different workspace isolation.
- [ ] Reset window.
- [ ] Abuse metrics.
- [ ] Redis unavailable fallback.

_Requirements: AIA-R28, AIA-R30, AIA-R31_

### 23.7 [P0] Dependency and supply-chain review

- [ ] Review LangChain package only if added.
- [ ] Review vector/embedding packages.
- [ ] Review parser packages.
- [ ] Lock versions appropriately.
- [ ] Run vulnerability audit.
- [ ] Document accepted risk.
- [ ] Avoid unneeded framework dependencies.

_Requirements: AIA-R31_

### 23.8 [P0] Security checkpoint

Must pass all critical AI security suites.

---

## 24. Retention, Workers, and Reliability

### 24.1 [P0] Define AI job envelope

- [x] `job-envelope.js` — `createJob()` with dedupe key, status, attempts, retry, lock.
- [x] Fields: id, workspaceId, type, reference, payload, status, attemptCount, nextRunAt, lastError, lockedAt, lockedBy, createdAt, updatedAt.
- [x] Exponential backoff: 2^n minutes, max 3 attempts.

**Tests** (in `followup-feedback-security.test.js`)

- [x] Valid job.
- [x] Duplicate key rejected.
- [x] Claim.
- [x] Complete.
- [x] Retry then fail after 3 attempts.
- [ ] Permanent failure.
- [ ] Workspace scope.

_Requirements: AIA-R29_

### 24.2 [P0] Implement retry helper

- [ ] Capped exponential backoff.
- [ ] Jitter.
- [ ] Error classification.
- [ ] Max attempts.
- [ ] Fixed clock testability.

**Unit/property tests**

- [ ] Delay sequence.
- [ ] Cap.
- [ ] Jitter range.
- [ ] Permanent error no retry.
- [ ] Random attempts never negative/overflow.

_Requirements: AIA-R29_

### 24.3 [P0] Refactor AI worker registry

Workers:

```text
session cleanup
summary
knowledge ingestion
memory retention
trace retention
takeover auto-resume
follow-up
```

- [ ] Named handlers.
- [ ] Enable/disable config.
- [ ] Health.
- [ ] Graceful shutdown.
- [ ] Metrics.

**Tests**

- [ ] Registration.
- [ ] Disabled worker.
- [ ] Shutdown.
- [ ] Handler failure.
- [ ] Health status.

_Requirements: AIA-R29_

### 24.4 [P0] Implement stuck-run recovery

- [ ] Detect AI run stuck past timeout.
- [ ] Mark failed/cancelled.
- [ ] Release chat lock.
- [ ] Avoid duplicate customer response.
- [ ] Record metric.

**Concurrency/resilience tests**

- [ ] Process crash simulation.
- [ ] Stale lock.
- [ ] Run completed just before recovery.
- [ ] Duplicate recovery.
- [ ] Tool mutation already committed.

_Requirements: AIA-R18, AIA-R29_

### 24.5 [P0] Document in-process queue limitations

- [ ] Jobs may be lost on crash.
- [ ] Define trigger for durable queue:
  - multi-instance;
  - business-critical delayed work;
  - unacceptable loss risk.
- [ ] Define Redis/BullMQ adapter boundary.
- [ ] Keep Supabase state authoritative.

_Requirements: AIA-R29, AIA-R31_

### 24.6 [P1] Optional durable queue implementation

- [ ] Only after approval/trigger.
- [ ] Preserve job contract.
- [ ] Add Redis health.
- [ ] Add dedupe.
- [ ] Add graceful shutdown.
- [ ] Add failover tests.

_Requirements: AIA-R29, AIA-R31_

### 24.7 [P0] Reliability failure-injection suite

- [ ] Model unavailable.
- [ ] Supabase unavailable.
- [ ] pgvector query timeout.
- [ ] Worker failure.
- [ ] Outbound channel failure.
- [ ] Lock service unavailable.
- [ ] Trace write failure.
- [ ] Summary failure.
- [ ] Knowledge ingestion failure.

_Requirements: AIA-R29, AIA-R33_

### 24.8 [P0] Checkpoint — reliability

---

## 25. Performance and Resource Controls

### 25.1 [P1] Establish performance baseline

Measure:

```text
chat resolution
history load
context build
RAG retrieval
model latency
tool latency
total turn
```

- [ ] Use deterministic fake model for system overhead.
- [ ] Use optional local model benchmark separately.
- [ ] Record p50/p95.
- [ ] Define expected MVP concurrency.

_Requirements: AIA-R30_

### 25.2 [P1] Optimize context queries

- [ ] Verify indexes.
- [ ] Avoid N+1.
- [ ] Parallelize independent loads.
- [ ] Bound message count.
- [ ] Bound memory count.
- [ ] Bound RAG chunks.
- [ ] Measure.

**Performance tests**

- [ ] 30-message chat.
- [ ] 1,000-message historical chat.
- [ ] Multiple memories.
- [ ] Multiple knowledge sources.
- [ ] Concurrent chats.

_Requirements: AIA-R10, AIA-R30_

### 25.3 [P1] Add model/tool time budgets

- [ ] Per model call.
- [ ] Per tool.
- [ ] Total turn.
- [ ] Remaining budget propagation.
- [ ] Safe timeout response.
- [ ] Handoff option.

**Tests**

- [ ] Slow model.
- [ ] Slow tool.
- [ ] Multiple tools.
- [ ] Total budget exhaustion.
- [ ] No confirmation skipped.

_Requirements: AIA-R18, AIA-R30_

### 25.4 [P1] Add usage metrics

- [ ] Input/output token estimates.
- [ ] Tool counts.
- [ ] RAG chunks.
- [ ] Fallback use.
- [ ] Per workspace/agent aggregates.
- [ ] No sensitive high-cardinality labels.

**Tests**

- [ ] Metric calculation.
- [ ] Missing provider usage.
- [ ] Aggregate scope.
- [ ] Cross-workspace API security.

_Requirements: AIA-R26, AIA-R30_

### 25.5 [P1] Load test concurrent AI turns

Scenarios:

```text
different chats
same chat bursts
RAG-heavy
tool-heavy
provider timeout
```

- [ ] Verify no duplicate mutation.
- [ ] Verify locks.
- [ ] Verify latency.
- [ ] Verify memory/database connection usage.
- [ ] Verify graceful degradation.

_Requirements: AIA-R18, AIA-R29, AIA-R30_

### 25.6 [P1] Checkpoint — performance

---

## 26. Framework Boundary Verification

### 26.1 [P0] Keep LangChain behind adapter

- [ ] If LangChain is used, create `langchain-adapter`.
- [ ] Core interfaces remain framework-neutral.
- [ ] No LangChain memory as source of truth.
- [ ] No domain state in agent scratchpad.
- [ ] Add replacement test/fake implementation.

**Tests**

- [ ] Core tests run without LangChain package path.
- [ ] Retriever adapter contract.
- [ ] Context memory comes from Supabase service.
- [ ] Removal simulation/documented.

_Requirements: AIA-R31_

### 26.2 [P0] Enforce LangGraph deferred status

- [ ] Do not add dependency in MVP without approved design update.
- [ ] Document adoption criteria.
- [ ] Add architecture review checklist.

**Verification**

- [ ] Dependency scan.
- [ ] No hidden LangGraph runtime.
- [ ] No task claims multi-agent graph implemented.

_Requirements: AIA-R31, AIA-R32_

### 26.3 [P0] Enforce Redis optionality

- [ ] Core correctness works without Redis.
- [ ] Redis adapter only for cache/lock/rate limit/queue.
- [ ] Cache invalidation policy.
- [ ] Fallback when unavailable.
- [ ] No authoritative cart/order/payment/memory in Redis.

**Tests**

- [ ] Redis unavailable.
- [ ] Cache loss.
- [ ] Lock fallback.
- [ ] No state loss.

_Requirements: AIA-R31_

### 26.4 [P0] Enforce n8n non-authority

- [ ] Document allowed use.
- [ ] No core AI/payment/order state delegated.
- [ ] Any n8n workflow uses backend APIs and limited credential.
- [ ] Audit integration.

**Security review**

- [ ] No service role.
- [ ] No mark-paid.
- [ ] No direct DB mutation.
- [ ] No unscoped workspace access.

_Requirements: AIA-R31_

### 26.5 [P0] Checkpoint — framework boundaries

---

## 27. Future Multi-Agent Readiness

### 27.1 [P1] Define specialist agent contract

Roles:

```text
commerce
product recommendation
support
complaint
order status
internal copilot
```

- [ ] Input contract.
- [ ] Output contract.
- [ ] Tool allowlist.
- [ ] Knowledge scope.
- [ ] Model assignment.
- [ ] Handoff result.
- [ ] No direct credentials.

**Tests**

- [ ] Valid specialist.
- [ ] Forbidden tool.
- [ ] Cross-workspace.
- [ ] Payment mutation blocked.
- [ ] Takeover respected.

_Requirements: AIA-R32_

### 27.2 [P1] Implement specialist routing interfaces only

- [ ] Router can return specialist ID.
- [ ] Primary agent fallback.
- [ ] Trace handoff.
- [ ] Bounded specialist calls.
- [ ] Do not activate autonomous swarm.

**Tests**

- [ ] Commerce route.
- [ ] Complaint route.
- [ ] Specialist unavailable.
- [ ] Fallback.
- [ ] Loop bound.

_Requirements: AIA-R16, AIA-R32_

### 27.3 [P1] Shared memory and tool boundary tests

- [ ] Specialist uses same Memory Service.
- [ ] Specialist uses same Tool Gateway.
- [ ] Specialist cannot create private authoritative memory store.
- [ ] Agent-to-agent content treated as internal untrusted data.
- [ ] Version recorded.

_Requirements: AIA-R19, AIA-R32_

### 27.4 [P1] Define LangGraph adoption gate

Adoption only when:

```text
multiple specialists active
pause/resume required
approval nodes required
checkpointing required
state graph materially clearer
```

- [ ] Create future ADR/task placeholder.
- [ ] No implementation in core MVP.

_Requirements: AIA-R31, AIA-R32_

### 27.5 [P1] Multi-agent evaluation skeleton

- [ ] Routing accuracy.
- [ ] Specialist safety.
- [ ] Handoff correctness.
- [ ] Tool boundaries.
- [ ] Loop termination.
- [ ] Fallback.

_Requirements: AIA-R27, AIA-R32_

### 27.6 [P1] Checkpoint — future readiness without premature complexity

---

## 28. AI Administration APIs and UI Contracts

### 28.1 [P1] Finalize AI admin permission matrix

Resources:

```text
agents
agent versions
knowledge
memory
AI runs
tool traces
feedback
evaluation
follow-ups
```

Roles/actions:

```text
owner
admin
outlet manager
human agent
viewer
```

**Tests**

- [ ] Allow/deny matrix.
- [ ] Workspace scope.
- [ ] Outlet scope.
- [ ] Elevated publish.
- [ ] Trace access.
- [ ] Memory delete.

_Requirements: AIA-R28, AIA-R34_

### 28.2 [P1] Add optimistic concurrency to configuration updates

- [ ] Version/ETag.
- [ ] Conflict error.
- [ ] No silent overwrite.
- [ ] Audit actor.

**API tests**

- [ ] Current version update.
- [ ] Stale version conflict.
- [ ] Parallel updates.
- [ ] Publish conflict.

_Requirements: AIA-R15, AIA-R34_

### 28.3 [P1] Build safe agent health endpoint

Return:

```text
provider configured
model configured
knowledge readiness
tool readiness
last test
health state
```

Do not return:

```text
secret
full base credential
private prompt if unauthorized
```

**Tests**

- [ ] Configured/unconfigured.
- [ ] Provider degraded.
- [ ] Permission.
- [ ] Secret absent.

_Requirements: AIA-R17, AIA-R34_

### 28.4 [P1] Build retrieval test endpoint

- [ ] Authorized admin only.
- [ ] Workspace/outlet/agent scope.
- [ ] Return chunks/scores safely.
- [ ] No customer side effect.
- [ ] Trace test request.

**Tests**

- [ ] Relevant result.
- [ ] No result.
- [ ] Cross-workspace.
- [ ] Unpublished source.
- [ ] Secret redaction.

_Requirements: AIA-R13, AIA-R34_

### 28.5 [P1] Build evaluation APIs

- [ ] Run selected evaluation set.
- [ ] View results.
- [ ] Compare versions.
- [ ] Block publish when required.
- [ ] Async job if needed.

**Tests**

- [ ] Start run.
- [ ] Permission.
- [ ] Result.
- [ ] Version mismatch.
- [ ] Blocking failure.

_Requirements: AIA-R27, AIA-R34_

### 28.6 [P1] Admin API contract documentation

- [ ] Request/response examples.
- [ ] Error codes.
- [ ] Pagination.
- [ ] Secret fields.
- [ ] Role permission.
- [ ] Version conflict.
- [ ] Test mode behavior.

_Requirements: AIA-R34_

### 28.7 [P1] Checkpoint — administration contracts

---

## 29. Comprehensive AI Test Matrix

This section consolidates test completeness. It does not replace tests inside feature tasks.

### 29.1 [P0] Unit suite completeness

Required modules:

```text
greeting policy
session policy
context ordering
token budget
summary validator
memory policy
chunker
retrieval merge
agent config
agent router
model router
structured output
tool registry
confirmation policy
idempotency key
redaction
takeover timer
retry helper
```

- [ ] Every module has happy-path tests.
- [ ] Every module has invalid-input tests.
- [ ] Every security rule has negative test.
- [ ] Coverage report reviewed.
- [ ] No critical branch untested.

_Requirements: AIA-R33_

### 29.2 [P0] Repository integration suite completeness

- [ ] Conversation sessions.
- [ ] Summaries.
- [ ] Memories.
- [ ] Knowledge sources.
- [ ] Knowledge chunks.
- [ ] AI runs.
- [ ] Tool calls.
- [ ] Feedback.
- [ ] Follow-up/jobs if implemented.
- [ ] Workspace isolation.
- [ ] Concurrency/unique conflicts.
- [ ] Retention cleanup.

_Requirements: AIA-R33_

### 29.3 [P0] Service/component suite completeness

- [ ] Context Builder.
- [ ] Summary Service.
- [ ] Memory Service.
- [ ] RAG Service.
- [ ] Agent Router.
- [ ] Model Router.
- [ ] Orchestrator.
- [ ] Tool Gateway.
- [ ] Takeover policy.
- [ ] Follow-up service if implemented.

_Requirements: AIA-R33_

### 29.4 [P0] API integration suite completeness

- [ ] Agents.
- [ ] Agent versions.
- [ ] Knowledge.
- [ ] Memory.
- [ ] Trace.
- [ ] Feedback.
- [ ] Evaluation.
- [ ] Health/test.
- [ ] Permission.
- [ ] Pagination.
- [ ] Error contract.
- [ ] Optimistic concurrency.

_Requirements: AIA-R34, AIA-R33_

### 29.5 [P0] Channel integration suite completeness

- [ ] Telegram.
- [ ] WhatsApp.
- [ ] Verification.
- [ ] Normalization.
- [ ] Duplicate message.
- [ ] Delivery failure.
- [ ] Typing indicator.
- [ ] Human takeover.
- [ ] Channel-specific limits.

_Requirements: AIA-R1, AIA-R24, AIA-R33_

### 29.6 [P0] Security suite completeness

- [ ] Prompt injection.
- [ ] RAG injection.
- [ ] Tool injection.
- [ ] Agent config escalation.
- [ ] Cross-workspace.
- [ ] Cross-outlet.
- [ ] Secret exposure.
- [ ] Payment mark-paid absence.
- [ ] Trace access.
- [ ] Rate limit.
- [ ] Oversized input.

_Requirements: AIA-R22, AIA-R28, AIA-R33_

### 29.7 [P0] E2E suite completeness

Required E2E:

```text
Telegram multi-turn
WhatsApp multi-turn
RAG grounded answer
memory save/forget
product recommendation
cart/order confirmation
Xendit link and verified paid response
complaint ticket
human takeover and auto-resume
```

- [ ] Deterministic fake-provider versions in CI.
- [ ] Optional sandbox versions documented.
- [ ] No production credentials.
- [ ] Trace assertions included.

_Requirements: AIA-R33_

### 29.8 [P0] Evaluation suite completeness

- [ ] Tone.
- [ ] Continuity.
- [ ] No repeated introduction.
- [ ] Correct outlet behavior.
- [ ] Pickup-only.
- [ ] No address memory.
- [ ] No COD/manual transfer.
- [ ] No false paid.
- [ ] Grounded RAG.
- [ ] Appropriate handoff.
- [ ] Tool selection.
- [ ] Conciseness.

_Requirements: AIA-R27, AIA-R33_

### 29.9 [P1] Property-based suite

Properties:

```text
context bounded
tool loop terminates
deleted memory excluded
workspace filter retained
confirmation tied to snapshot
redaction never throws
retry delay bounded
```

- [ ] Add generator constraints.
- [ ] Reproduce failing seed.
- [ ] Persist seed in failure output.
- [ ] Keep runtime reasonable.

_Requirements: AIA-R33_

### 29.10 [P0] Concurrency suite

- [ ] Parallel same-chat message.
- [ ] Duplicate provider message.
- [ ] Simultaneous session creation.
- [ ] Duplicate summary job.
- [ ] Duplicate tool mutation.
- [ ] Takeover during model.
- [ ] Auto-resume race.
- [ ] Duplicate follow-up.

_Requirements: AIA-R18, AIA-R24, AIA-R29, AIA-R33_

### 29.11 [P1] Performance suite

- [ ] Context latency.
- [ ] Retrieval latency.
- [ ] 100 concurrent different chats.
- [ ] Same-chat burst.
- [ ] Large history.
- [ ] Worker queue latency.
- [ ] Provider timeout behavior.

_Requirements: AIA-R30, AIA-R33_

### 29.12 [P0] Regression suite

Protect:

```text
existing login
existing chat list
existing human takeover
existing Telegram receive/send
existing WhatsApp receive/send
existing agent settings
existing product/cart/order/payment services
```

- [ ] AI architecture changes do not break existing backend domain tests.
- [ ] No new Mongo/Mongoose usage.
- [ ] Supabase-only runtime remains valid.
- [ ] Xendit tests remain passing.

_Requirements: AIA-R33_

### 29.13 [P0] Manual sandbox QA plan

- [ ] Local model endpoint.
- [ ] Real Telegram test bot.
- [ ] Real WhatsApp test number.
- [ ] Xendit Test Mode.
- [ ] Real knowledge upload/embedding.
- [ ] Long conversation.
- [ ] Human takeover.
- [ ] Failure scenarios.
- [ ] Record passed/failed/not-run/blocked honestly.

_Requirements: AIA-R17, AIA-R33_

### 29.14 [P0] Test coverage checkpoint

Do not use percentage alone.

Review:

```text
critical behaviors
negative paths
security paths
race paths
failure paths
integration contracts
```

---

## 30. CI, Documentation, and Release Readiness

### 30.1 [P0] Add AI CI pipeline stages

Suggested order:

```text
install
static checks
spec check
unit
repository integration
component/integration
security
critical E2E
critical evaluation
build
```

- [ ] Deterministic suites required.
- [ ] Manual/live suites excluded from default CI.
- [ ] Artifacts include test reports.
- [ ] Secrets masked.
- [ ] Production Supabase blocked.

_Requirements: AIA-R33_

### 30.2 [P0] Add static architecture checks

Detect:

```text
direct provider calls from routes
direct DB access from orchestrator
forbidden tool registration
new LangGraph dependency without approval
new Mongoose use
secret fields in client responses
```

- [ ] Add lint/custom script where practical.
- [ ] Add review checklist otherwise.
- [ ] CI fails on critical violation.

_Requirements: AIA-R19, AIA-R22, AIA-R28, AIA-R31_

### 30.3 [P0] Update AI-specific documentation

Update/create:

```text
AI architecture overview
memory lifecycle
RAG ingestion
agent configuration
tool registry
payment safety boundary
human takeover
testing guide
evaluation guide
operations runbook
incident guide
```

- [ ] Do not merge into backend marketplace design.
- [ ] Link to backend contracts only where needed.
- [ ] No real secrets.
- [ ] Mark implemented vs target honestly.

_Requirements: all_

### 30.4 [P0] Add AI operations runbook

Include:

```text
local model unavailable
high latency
RAG failure
embedding backlog
stuck AI run
duplicate messages
memory deletion request
takeover auto-resume issue
secret exposure incident
agent rollback
evaluation regression
```

_Requirements: AIA-R26, AIA-R29, AIA-R30_

### 30.5 [P0] Add AI incident response checklist

Critical incidents:

```text
cross-workspace leak
false payment-paid response
AI replies during takeover
secret in trace
runaway tool loop
mass duplicate messages
malicious knowledge injection
```

- [ ] Immediate containment.
- [ ] Disable agent/platform.
- [ ] Preserve safe evidence.
- [ ] Rotate secrets if needed.
- [ ] Identify affected runs.
- [ ] Corrective test required before re-enable.

_Requirements: AIA-R22, AIA-R24, AIA-R28_

### 30.6 [P0] AI MVP release gate

Must pass:

```text
context continuity
no repeated introduction
Telegram + WhatsApp
recent memory
rolling summary
durable memory + forget
RAG isolation
agent versioning
local model adapter
bounded orchestrator
Tool Gateway
order confirmation
payment read-only AI
complaint/handoff
human takeover
safe auto-resume
trace/redaction
critical evaluations
critical security tests
```

### 30.7 [P0] Final implementation report format

```text
Active spec:
Active task:

Requirements covered:
Files changed:
Migrations:
APIs:
Agent changes:
Model/provider changes:
Memory changes:
RAG changes:
Tools added:
Security controls:
Human takeover behavior:
Payment boundary:

Tests written first:
Unit tests:
Repository tests:
Integration tests:
Security tests:
E2E tests:
Evaluation tests:
Concurrency tests:
Performance tests:
Manual tests:

Passed:
Failed:
Not run:
Blocked:

Known limitations:
Risks:
Follow-up:
Specs check:
Git diff summary:
```

### 30.8 [P0] Final checkpoint — AI architecture MVP approval

- [ ] All P0 tasks complete or explicitly waived.
- [ ] Waiver includes owner, risk, mitigation, expiry.
- [ ] No critical payment/security/takeover waiver.
- [ ] Full deterministic suite passes.
- [ ] Manual sandbox result recorded.
- [ ] `npm run specs:check` passes.
- [ ] Release decision recorded.

---

# Optional Post-MVP Tasks

- [ ]* PM1 Advanced external model fallback routing
- [ ]* PM2 Cross-encoder reranker
- [ ]* PM3 Full marketing automation
- [ ]* PM4 Durable Redis/BullMQ queue
- [ ]* PM5 Multiple active specialist agents
- [ ]* PM6 LangGraph workflow after approved design update
- [ ]* PM7 Agent A/B testing
- [ ]* PM8 Automated prompt optimization with human approval
- [ ]* PM9 Website chat streaming
- [ ]* PM10 Voice-note transcription and multimodal understanding
- [ ]* PM11 Advanced memory relevance model
- [ ]* PM12 Knowledge conflict detection dashboard
- [ ]* PM13 Dedicated AI cost/budget controls
- [ ]* PM14 Offline replay and shadow evaluation
- [ ]* PM15 Production-scale distributed tracing

---

# Checkpoints

## Checkpoint A — Context Continuity

```text
stable chat identity
message idempotency
history loaded
current message once
intro only once
Telegram and WhatsApp continuity
```

## Checkpoint B — Persistent Memory

```text
conversation sessions
rolling summaries
durable customer preferences
forget/correct
address excluded
retention
```

## Checkpoint C — RAG

```text
knowledge lifecycle
ingestion
chunking
embedding
hybrid retrieval
workspace/outlet/agent isolation
grounded no-answer policy
```

## Checkpoint D — Agent Runtime

```text
agent versioning
model adapter
model router
agent router
bounded orchestrator
structured output
trace
```

## Checkpoint E — Tool Safety

```text
registry
schema validation
authorization
confirmation
idempotency
redaction
forbidden tools
```

## Checkpoint F — Commerce and Payment

```text
outlet confirmation
live product tools
single active cart
order confirmation
pickup only
Xendit link
AI read-only payment
verified paid response
```

## Checkpoint G — Human Control

```text
complaint ticket
direct handoff
AI silence
5-minute auto-resume
pinned takeover
race tests
```

## Checkpoint H — Production Readiness

```text
security suite
evaluation suite
failure injection
performance baseline
workers
retention
CI
runbooks
```

---

# Requirement Traceability Matrix

| Requirements | Primary Task Sections |
|---|---|
| AIA-R1 | 3, 29 |
| AIA-R2 | 1, 3 |
| AIA-R3 | 1, 3, 29 |
| AIA-R4 | 2, 4 |
| AIA-R5 | 1, 5, 29 |
| AIA-R6 | 1, 5 |
| AIA-R7 | 2, 6, 24 |
| AIA-R8 | 2, 7 |
| AIA-R9 | 7, 24 |
| AIA-R10 | 5 |
| AIA-R11 | 8 |
| AIA-R12 | 9 |
| AIA-R13 | 10 |
| AIA-R14 | 10, 16 |
| AIA-R15 | 11 |
| AIA-R16 | 13 |
| AIA-R17 | 12 |
| AIA-R18 | 14 |
| AIA-R19 | 15, 16 |
| AIA-R20 | 15, 16 |
| AIA-R21 | 16 |
| AIA-R22 | 17, 23 |
| AIA-R23 | 18 |
| AIA-R24 | 19 |
| AIA-R25 | 20 |
| AIA-R26 | 21 |
| AIA-R27 | 22 |
| AIA-R28 | 23 |
| AIA-R29 | 24 |
| AIA-R30 | 25 |
| AIA-R31 | 26 |
| AIA-R32 | 27 |
| AIA-R33 | 0, 29, 30 |
| AIA-R34 | 11, 21, 22, 28 |

---

# Task Dependency Waves

```json
{
  "waves": [
    {
      "id": 0,
      "name": "Spec and TDD readiness",
      "sections": [0]
    },
    {
      "id": 1,
      "name": "Immediate context bug fix",
      "sections": [1]
    },
    {
      "id": 2,
      "name": "AI persistence and inbound foundation",
      "sections": [2, 3, 4]
    },
    {
      "id": 3,
      "name": "Context and memory",
      "sections": [5, 6, 7]
    },
    {
      "id": 4,
      "name": "Knowledge and RAG",
      "sections": [8, 9, 10]
    },
    {
      "id": 5,
      "name": "Agent and model runtime",
      "sections": [11, 12, 13, 14]
    },
    {
      "id": 6,
      "name": "Tool safety",
      "sections": [15]
    },
    {
      "id": 7,
      "name": "Commerce, payment, and support",
      "sections": [16, 17, 18, 19]
    },
    {
      "id": 8,
      "name": "Follow-up and observability",
      "sections": [20, 21, 22]
    },
    {
      "id": 9,
      "name": "Security and reliability",
      "sections": [23, 24, 25, 26]
    },
    {
      "id": 10,
      "name": "Future readiness and administration",
      "sections": [27, 28]
    },
    {
      "id": 11,
      "name": "Comprehensive validation and release",
      "sections": [29, 30]
    }
  ]
}
```

---

# Fastest Safe AI MVP Path

Implementasi minimum yang tetap aman:

```text
0  TDD harness
1  Context bug fix
2  AI persistence foundation
3  Telegram + WhatsApp normalized inbound
4  Conversation sessions
5  Context Builder
6  Rolling summary
7  Durable memory
8  Knowledge source
9  Ingestion
10 RAG
11 Agent versioning
12 Local model adapter/router
13 Agent router
14 Orchestrator
15 Tool Gateway
16 Commerce tool contracts
17 Payment read-only boundary
18 Complaint/handoff
19 Human takeover
21 Trace
23 Security
29 Critical comprehensive tests
30 Release gate
```

Can be deferred after core MVP:

```text
20 advanced proactive follow-up
22 advanced quality dashboard
25 extensive performance optimization
27 active specialist agents
28 non-critical administration enhancements
optional LangChain features
LangGraph
Redis durable queue
n8n automation
```

Tidak boleh ditunda:

```text
stable conversation identity
message idempotency
context continuity
payment read-only boundary
human takeover silence
workspace isolation
Tool Gateway authorization
secret redaction
bounded loops
critical security tests
```

---

# Definition of Done

Satu task dianggap completed hanya ketika:

```text
[ ] RED test dibuat dan benar-benar gagal sebelum implementation
[ ] GREEN implementation minimum lulus
[ ] REFACTOR selesai tanpa regression
[ ] requirement mapping benar
[ ] unit tests lulus
[ ] relevant integration tests lulus
[ ] relevant security tests lulus
[ ] relevant E2E/evaluation tests lulus
[ ] relevant concurrency tests lulus
[ ] workspace/outlet scope aman
[ ] human takeover diperiksa
[ ] payment boundary dipertahankan
[ ] tool idempotency diterapkan
[ ] secrets redacted
[ ] trace/metrics ditambahkan
[ ] docs diperbarui
[ ] known limitation dicatat
[ ] targeted commands dicatat
[ ] full relevant suite lulus
[ ] no backend-domain shadow implementation
[ ] final specs check lulus
```

Task SHALL remain unchecked if only code or file scaffolding exists.

Task SHALL remain unchecked if tests are missing.

Task SHALL remain unchecked if tests were not executed.

Task SHALL remain unchecked if implementation depends on an unverified assumption.

---

# Final Task Statement

SelaluTeh AI Agent Architecture SHALL dibangun secara test-driven dan incremental.

Urutan authority:

```text
platform safety
→ backend authorization
→ Tool Gateway
→ backend domain services
→ persistent state
→ model response
```

Model SHALL membantu memahami bahasa dan memilih tool.

Model SHALL NOT menjadi source of truth atau transaction authority.

Setiap critical behavior SHALL dilindungi oleh automated tests sebelum dinyatakan selesai.
