# Current Sprint

## Sprint Name

Sprint 2.0 — AI Agent Architecture Implementation

## Goal

Complete all 28 phases of the `selaluteh-ai-agent-architecture` spec — from context bug fix through durable memory, RAG, tool gateway, orchestrator, admin API, and security hardening.

## Why This Sprint

Sprint 1.5 (Multi-Outlet Foundation) completed the backend structure. The AI Agent Architecture was designed to run on top of it — with conversation context, persistent memory, rolling summary, RAG knowledge, configurable agents, tool gateway, and safe commerce/payment assistance.

## Tasks (from specs/active/selaluteh-ai-agent-architecture/tasks.md)

### Completed
- [x] Phase 0: Spec lifecycle, baseline, test harness, factories/fakes
- [x] Phase 1: Context bug fix (greeting flags, bounded history, context builder)
- [x] Phase 2: AI schema (011 migration) + 8 repositories
- [x] Phase 3: Normalized inbound (Telegram/WhatsApp adapters, eligibility, run lock)
- [x] Phase 4: Session service + orchestrator + cleanup worker
- [x] Phase 5: Context builder (token budget, source loaders, ordering)
- [x] Phase 6: Rolling summary service
- [x] Phase 7: Durable memory (policy, extraction, service, tools, retention)
- [x] Phase 8-10: Knowledge/RAG (service, chunker, ingestion, hybrid retrieval)
- [x] Phase 11-14: Agent/model router + semantic router + orchestrator + turn state machine
- [x] Phase 15: Tool Gateway (commerce x13, confirmation, idempotency, redaction)
- [x] Phase 16-18: Commerce flows (outlet, cart, order, payment, complaint)
- [x] Phase 19-24: Follow-up, trace, feedback, safety policy, job envelope
- [x] Phase 25-28: Performance, LangChain boundary, specialist router, admin API routes

### Infrastructure Applied
- Migration `011_ai_memory_knowledge_trace.sql` (9 tables, pgvector, RLS)
- Supabase vector search function `match_knowledge_chunks()`
- 5 knowledge sources seeded + embedded with Ollama `nomic-embed-text`
- Telegram `@selkoporder_bot` live with context builder

## Acceptance Criteria

- [x] Context builder reads database history — computeGreetingFlags() tahu apakah ini first message atau nth
- [x] Introduction hanya sekali — greeting flags mencegah AI introduce ulang
- [x] Agent settings dari database dipakai — tidak hardcode di code
- [x] Tool Gateway validation berfungsi — tool mutasi butuh confirmation
- [x] Human takeover silence — AI stop reply saat `takenOverByUserId != null`
- [x] RAG retrieval dari knowledge chunks yang sudah dipublish
- [x] Memory service menyimpan/mengoreksi/melupakan preferensi
- [x] Semua test: 426 pass, 0 fail
