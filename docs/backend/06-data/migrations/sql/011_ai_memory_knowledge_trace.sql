-- 011_ai_memory_knowledge_trace.sql
-- AI-specific tables: sessions, summaries, memories, knowledge, traces, feedback.
-- These tables are owned by the AI Agent Architecture spec.
-- They reference existing domain tables (workspaces, contacts, chats, agents)
-- but do NOT redefine product/cart/order/payment domains.

-- pgvector extension for RAG embeddings
create extension if not exists "vector";

-- AI conversation session enums
do $$ begin
  create type conversation_session_status as enum ('active', 'closed_idle', 'closed_handoff', 'closed_manual');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type ai_run_status as enum ('created', 'running', 'completed', 'failed', 'cancelled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type ai_tool_call_status as enum ('proposed', 'executing', 'completed', 'failed');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type memory_status as enum ('candidate', 'confirmed', 'active', 'superseded', 'expired', 'deleted');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type knowledge_source_type as enum (
    'faq', 'sop', 'product_description', 'promotion_rule', 'refund_policy',
    'payment_instruction', 'complaint_procedure', 'opening_hours',
    'brand_tone', 'uploaded_file', 'structured_record'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type knowledge_source_lifecycle as enum (
    'draft', 'processing', 'ready_for_review', 'published', 'rejected', 'archived', 'failed'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type knowledge_scope as enum ('workspace', 'outlet', 'agent', 'channel');
exception when duplicate_object then null;
end $$;

-- 1. Conversation Sessions
-- Bounded AI context window within a permanent chat.
create table if not exists conversation_sessions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  chat_id uuid not null references chats(id) on delete cascade,
  agent_id uuid null references agents(id) on delete set null,
  status conversation_session_status not null default 'active',
  started_at timestamptz not null default now(),
  last_customer_message_at timestamptz null,
  last_assistant_message_at timestamptz null,
  closed_at timestamptz null,
  close_reason text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_conversation_sessions_chat_active
  on conversation_sessions (chat_id, status)
  where status = 'active';

create index idx_conversation_sessions_workspace
  on conversation_sessions (workspace_id, created_at desc);

-- 2. Conversation Summaries
-- Rolling structured summary for long conversations.
create table if not exists conversation_summaries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  chat_id uuid not null references chats(id) on delete cascade,
  session_id uuid null references conversation_sessions(id) on delete cascade,
  status text not null default 'active',
  summary jsonb not null default '{}'::jsonb,
  message_range_start timestamptz null,
  message_range_end timestamptz null,
  message_count integer not null default 0,
  model_provider text null,
  model_name text null,
  prompt_version text null,
  token_count integer null,
  error text null,
  created_at timestamptz not null default now(),
  superseded_at timestamptz null,
  expires_at timestamptz null
);

create index idx_conversation_summaries_chat_latest
  on conversation_summaries (chat_id, created_at desc)
  where status = 'active';

create index idx_conversation_summaries_workspace
  on conversation_summaries (workspace_id);

-- 3. Contact Memories (Durable Customer Memory)
-- Persistent preferences across sessions and channels.
create table if not exists contact_memories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  memory_key text not null,
  memory_value jsonb not null default '{}'::jsonb,
  category text not null,
  source_type text not null default 'model_extraction',
  source_reference_id text null,
  confidence text not null default 'medium',
  status memory_status not null default 'candidate',
  valid_from timestamptz not null default now(),
  valid_until timestamptz null,
  last_confirmed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null,
  constraint contact_memories_unique_active_key unique (workspace_id, contact_id, memory_key)
);

create index idx_contact_memories_active
  on contact_memories (workspace_id, contact_id, status)
  where status in ('active', 'confirmed');

-- 4. Knowledge Sources
-- Manageable knowledge documents for RAG.
create table if not exists knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid null references outlets(id) on delete cascade,
  title text not null,
  description text null,
  source_type knowledge_source_type not null,
  scope knowledge_scope not null default 'workspace',
  content text null,
  content_hash text null,
  status knowledge_source_lifecycle not null default 'draft',
  version integer not null default 1,
  visibility text not null default 'all',
  valid_from timestamptz null,
  valid_until timestamptz null,
  created_by uuid null references users(id) on delete set null,
  published_by uuid null references users(id) on delete set null,
  published_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_knowledge_sources_workspace_published
  on knowledge_sources (workspace_id, status)
  where status = 'published';

-- 5. Knowledge Chunks
-- Embedding-optimized chunks for vector search.
create table if not exists knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references knowledge_sources(id) on delete cascade,
  source_version integer not null default 1,
  chunk_index integer not null,
  section_heading text null,
  content text not null,
  token_count integer not null default 0,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  outlet_id uuid null references outlets(id) on delete cascade,
  agent_id uuid null references agents(id) on delete set null,
  embedding vector(768),
  content_hash text not null,
  embedding_model text null,
  created_at timestamptz not null default now(),
  constraint knowledge_chunks_source_unique unique (source_id, source_version, chunk_index)
);

create index idx_knowledge_chunks_workspace
  on knowledge_chunks (workspace_id);

create index idx_knowledge_chunks_outlet
  on knowledge_chunks (outlet_id)
  where outlet_id is not null;

create index idx_knowledge_chunks_agent
  on knowledge_chunks (agent_id)
  where agent_id is not null;

-- ivfflat index for vector similarity search (use with caution on small datasets)
-- create index idx_knowledge_chunks_embedding
--   on knowledge_chunks
--   using ivfflat (embedding vector_cosine_ops)
--   with (lists = 100)
--   where embedding is not null;

-- 6. Knowledge Source -> Agent assignments
create table if not exists knowledge_source_agents (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references knowledge_sources(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint knowledge_source_agents_unique unique (source_id, agent_id)
);

-- 7. AI Runs
-- One execution trace of the AI orchestrator for a customer turn.
create table if not exists ai_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  chat_id uuid not null references chats(id) on delete cascade,
  session_id uuid null references conversation_sessions(id) on delete set null,
  agent_id uuid null references agents(id) on delete set null,
  agent_version integer null,
  model_provider text null,
  model_name text null,
  status ai_run_status not null default 'created',
  inbound_message_id uuid null references chat_messages(id) on delete set null,
  assistant_message_id uuid null references chat_messages(id) on delete set null,
  context_metadata jsonb not null default '{}'::jsonb,
  start_reason text null,
  end_reason text null,
  error_code text null,
  latency_ms integer null,
  input_tokens integer null,
  output_tokens integer null,
  created_at timestamptz not null default now(),
  started_at timestamptz null,
  completed_at timestamptz null
);

create index idx_ai_runs_chat
  on ai_runs (chat_id, created_at desc);

create index idx_ai_runs_workspace
  on ai_runs (workspace_id, created_at desc);

-- 8. AI Tool Calls
-- Individual tool invocations within an AI run.
create table if not exists ai_tool_calls (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references ai_runs(id) on delete cascade,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  tool_name text not null,
  input jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  status ai_tool_call_status not null default 'proposed',
  latency_ms integer null,
  error_code text null,
  created_at timestamptz not null default now()
);

create index idx_ai_tool_calls_run
  on ai_tool_calls (run_id);

create index idx_ai_tool_calls_workspace
  on ai_tool_calls (workspace_id, created_at desc);

-- 9. AI Feedback
-- Human ratings on AI responses for evaluation.
create table if not exists ai_feedback (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  run_id uuid not null references ai_runs(id) on delete cascade,
  rating smallint null,
  reason_code text null,
  comment text null,
  reviewed_by uuid null references users(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint ai_feedback_rating_range check (rating is null or (rating >= 1 and rating <= 5))
);

create index idx_ai_feedback_run
  on ai_feedback (run_id);

create index idx_ai_feedback_workspace
  on ai_feedback (workspace_id, created_at desc);
