-- 008_local_file_storage.sql
-- Local media storage config for the hybrid Supabase/Postgres + local filesystem design.
--
-- This migration intentionally does not create Supabase Storage buckets.
-- Media binaries stay on the application server filesystem.

create table if not exists storage_disks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid null references workspaces(id) on delete cascade,
  name text not null default 'uploads',
  storage_provider text not null default 'local',
  root_path text not null,
  public_base_url text not null,
  is_public boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint storage_disks_workspace_name_unique unique (workspace_id, name)
);

create trigger set_storage_disks_updated_at
before update on storage_disks
for each row execute function set_updated_at();

-- Optional default row for development. Replace paths in real environments.
-- insert into storage_disks (workspace_id, name, root_path, public_base_url)
-- values (null, 'uploads', 'server/uploads', 'http://localhost:5000/files')
-- on conflict do nothing;

-- Required server-side directories:
--   server/uploads/chat
--   server/uploads/agent-files
--   server/uploads/payment-proofs
--   server/uploads/product-images
--   server/uploads/category-images
--   server/uploads/public-assets
--   server/uploads/temp
--
-- Suggested env:
--   LOCAL_UPLOAD_ROOT=/absolute/path/to/server/uploads
--   PUBLIC_FILES_BASE_URL=https://your-domain.example/files
--
-- Important backup rule:
--   Database backup and uploads backup must be taken from the same time window.
