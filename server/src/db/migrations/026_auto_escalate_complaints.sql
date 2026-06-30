-- ============================================================
-- 026_auto_escalate_complaints.sql
-- Spec: auto-escalate-complaints
-- Task: 2 — Supabase Schema and RLS
-- ============================================================

-- ─── 1. complaint_escalation_policies ─────────────────────────────────────────
-- Workspace-level default policy for auto escalation.
-- One record per workspace (unique constraint).
create table if not exists complaint_escalation_policies (
  id                  uuid primary key default gen_random_uuid(),
  workspace_id        uuid not null,
  enabled             boolean not null default false,
  match_mode          text not null default 'ANY'  check (match_mode in ('ANY', 'ALL')),
  trigger_rules       jsonb not null default '{}',
  recipient_strategy  text not null default 'PRIMARY_ONLY'
                        check (recipient_strategy in ('PRIMARY_ONLY','FIRST_AVAILABLE','ROUND_ROBIN','SUPERVISOR_QUEUE','ALL_SUPERVISORS')),
  fallback_steps      jsonb not null default '[]',
  include_context     jsonb not null default '{}',
  after_escalation    jsonb not null default '{}',
  supervisor_sla      jsonb not null default '{}',
  schedule_policy     jsonb not null default '{}',
  version             integer not null default 1,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (workspace_id)
);

create index if not exists idx_escalation_policies_workspace
  on complaint_escalation_policies (workspace_id);

-- ─── 2. outlet_complaint_escalation_overrides ────────────────────────────────
-- Per-outlet override: USE_WORKSPACE_DEFAULT | CUSTOM | DISABLED
create table if not exists outlet_complaint_escalation_overrides (
  id                                uuid primary key default gen_random_uuid(),
  workspace_id                      uuid not null,
  outlet_id                         uuid not null,
  configuration_mode                text not null default 'USE_WORKSPACE_DEFAULT'
                                      check (configuration_mode in ('USE_WORKSPACE_DEFAULT','CUSTOM','DISABLED')),
  enabled_override                  boolean,            -- null = inherit
  policy_override                   jsonb,              -- null = inherit
  primary_supervisor_membership_id  uuid,               -- null = resolve dynamically
  version                           integer not null default 1,
  created_at                        timestamptz not null default now(),
  updated_at                        timestamptz not null default now(),
  unique (workspace_id, outlet_id)
);

create index if not exists idx_escalation_overrides_workspace
  on outlet_complaint_escalation_overrides (workspace_id);
create index if not exists idx_escalation_overrides_outlet
  on outlet_complaint_escalation_overrides (workspace_id, outlet_id);

-- ─── 3. complaint_escalations ─────────────────────────────────────────────────
create table if not exists complaint_escalations (
  id                          uuid primary key default gen_random_uuid(),
  workspace_id                uuid not null,
  complaint_id                uuid not null,
  outlet_id                   uuid not null,
  parent_escalation_id        uuid references complaint_escalations(id),

  trigger_type                text not null
                                check (trigger_type in (
                                  'AUTO_PRIORITY','AUTO_CATEGORY','AUTO_UNASSIGNED',
                                  'AUTO_SLA','AUTO_REPEATED_MESSAGE','MANUAL','RE_ESCALATION'
                                )),
  status                      text not null default 'PENDING'
                                check (status in (
                                  'PENDING','ACKNOWLEDGED','RESPONDED',
                                  'COMPLETED','CANCELLED','FAILED_ROUTING','EXPIRED'
                                )),
  escalation_level            integer not null default 1,

  recipient_membership_id     uuid,
  escalated_by_membership_id  uuid,

  policy_id                   uuid references complaint_escalation_policies(id),
  policy_version              integer,
  idempotency_key             text not null,

  complaint_snapshot          jsonb not null default '{}',
  trigger_snapshot            jsonb not null default '{}',
  routing_snapshot            jsonb not null default '{}',

  acknowledgement_due_at      timestamptz,
  response_due_at             timestamptz,
  resolution_due_at           timestamptz,

  acknowledged_at             timestamptz,
  responded_at                timestamptz,
  completed_at                timestamptz,
  cancelled_at                timestamptz,

  version                     integer not null default 1,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  unique (workspace_id, idempotency_key)
);

-- Partial unique constraint: at most ONE active escalation per (complaint, outlet, level)
-- "Active" = not COMPLETED, CANCELLED, FAILED_ROUTING, or EXPIRED
create unique index if not exists uq_one_active_escalation_per_complaint_outlet_level
  on complaint_escalations (complaint_id, outlet_id, escalation_level)
  where status not in ('COMPLETED','CANCELLED','FAILED_ROUTING','EXPIRED');

create index if not exists idx_escalations_workspace
  on complaint_escalations (workspace_id);
create index if not exists idx_escalations_complaint
  on complaint_escalations (workspace_id, complaint_id);
create index if not exists idx_escalations_outlet
  on complaint_escalations (workspace_id, outlet_id);
create index if not exists idx_escalations_recipient
  on complaint_escalations (workspace_id, recipient_membership_id)
  where recipient_membership_id is not null;
create index if not exists idx_escalations_status
  on complaint_escalations (workspace_id, status);
create index if not exists idx_escalations_created
  on complaint_escalations (workspace_id, created_at desc);

-- ─── 4. complaint_escalation_responses ───────────────────────────────────────
create table if not exists complaint_escalation_responses (
  id                      uuid primary key default gen_random_uuid(),
  workspace_id            uuid not null,
  outlet_id               uuid not null,
  complaint_id            uuid not null,
  escalation_id           uuid not null references complaint_escalations(id),
  sender_membership_id    uuid,
  response_type           text not null
                            check (response_type in (
                              'MESSAGE','REQUEST_INFORMATION','PROPOSED_RESOLUTION',
                              'APPROVAL','REJECTION','SYSTEM_EVENT'
                            )),
  message_text            text,
  structured_payload      jsonb,
  corrects_response_id    uuid references complaint_escalation_responses(id),
  created_at              timestamptz not null default now()
);

create index if not exists idx_escalation_responses_escalation
  on complaint_escalation_responses (escalation_id);
create index if not exists idx_escalation_responses_workspace
  on complaint_escalation_responses (workspace_id, escalation_id);

-- ─── 5. complaint_escalation_assignments ─────────────────────────────────────
create table if not exists complaint_escalation_assignments (
  id              uuid primary key default gen_random_uuid(),
  workspace_id    uuid not null,
  complaint_id    uuid not null,
  escalation_id   uuid not null references complaint_escalations(id),
  membership_id   uuid not null,
  assignment_type text not null default 'OUTLET_SUPERVISOR_COLLABORATOR',
  assigned_at     timestamptz not null default now(),
  ended_at        timestamptz
);

create index if not exists idx_escalation_assignments_escalation
  on complaint_escalation_assignments (escalation_id);
create index if not exists idx_escalation_assignments_membership
  on complaint_escalation_assignments (workspace_id, membership_id)
  where ended_at is null;

-- ─── 6. complaint_escalation_scheduled_jobs ──────────────────────────────────
create table if not exists complaint_escalation_scheduled_jobs (
  id                          uuid primary key default gen_random_uuid(),
  workspace_id                uuid not null,
  complaint_id                uuid not null,
  policy_id                   uuid not null,
  policy_version              integer not null,
  trigger_type                text not null
                                check (trigger_type in (
                                  'AUTO_UNASSIGNED','AUTO_SLA','QUEUED_OUTSIDE_HOURS',
                                  'SUPERVISOR_SLA_WARNING','SUPERVISOR_SLA_BREACH'
                                )),
  due_at                      timestamptz not null,
  status                      text not null default 'PENDING'
                                check (status in ('PENDING','RUNNING','COMPLETED','SKIPPED','FAILED')),
  expected_complaint_version  integer,
  idempotency_key             text not null,
  attempt_count               integer not null default 0,
  last_error_code             text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now(),

  unique (workspace_id, idempotency_key)
);

create index if not exists idx_escalation_jobs_due
  on complaint_escalation_scheduled_jobs (due_at)
  where status = 'PENDING';
create index if not exists idx_escalation_jobs_workspace
  on complaint_escalation_scheduled_jobs (workspace_id, status);
create index if not exists idx_escalation_jobs_complaint
  on complaint_escalation_scheduled_jobs (workspace_id, complaint_id);

-- ─── 7. Row-Level Security ────────────────────────────────────────────────────
alter table complaint_escalation_policies enable row level security;
alter table outlet_complaint_escalation_overrides enable row level security;
alter table complaint_escalations enable row level security;
alter table complaint_escalation_responses enable row level security;
alter table complaint_escalation_assignments enable row level security;
alter table complaint_escalation_scheduled_jobs enable row level security;

-- Service role bypasses RLS (backend always uses service role client).
-- These policies act as defense-in-depth for direct DB access.
-- Workspace isolation: all reads/writes scoped to auth.jwt() workspace_id claim.

create policy "workspace_isolation_policies"
  on complaint_escalation_policies
  using (workspace_id = ((current_setting('request.jwt.claims', true))::jsonb->>'workspace_id')::uuid);

create policy "workspace_isolation_overrides"
  on outlet_complaint_escalation_overrides
  using (workspace_id = ((current_setting('request.jwt.claims', true))::jsonb->>'workspace_id')::uuid);

create policy "workspace_isolation_escalations"
  on complaint_escalations
  using (workspace_id = ((current_setting('request.jwt.claims', true))::jsonb->>'workspace_id')::uuid);

create policy "workspace_isolation_responses"
  on complaint_escalation_responses
  using (workspace_id = ((current_setting('request.jwt.claims', true))::jsonb->>'workspace_id')::uuid);

create policy "workspace_isolation_assignments"
  on complaint_escalation_assignments
  using (workspace_id = ((current_setting('request.jwt.claims', true))::jsonb->>'workspace_id')::uuid);

create policy "workspace_isolation_scheduled_jobs"
  on complaint_escalation_scheduled_jobs
  using (workspace_id = ((current_setting('request.jwt.claims', true))::jsonb->>'workspace_id')::uuid);
