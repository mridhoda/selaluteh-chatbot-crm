-- Store owner-managed per-member module permission overrides for the RBAC UI.
-- Role remains the baseline; access_policy.permissions can be used by policy
-- evaluators to apply account-specific module permissions.

alter table if exists user_workspace_memberships
  add column if not exists access_policy jsonb not null default '{}'::jsonb;

create index if not exists idx_user_workspace_memberships_access_policy_gin
  on user_workspace_memberships using gin (access_policy);
