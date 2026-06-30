-- Store per-workspace notification channel preferences for each membership.

alter table if exists user_workspace_memberships
  add column if not exists notification_channels jsonb;

update user_workspace_memberships
set notification_channels = '["telegram","whatsapp"]'::jsonb
where notification_channels is null;

alter table if exists user_workspace_memberships
  alter column notification_channels set default '["telegram","whatsapp"]'::jsonb;

do $$
begin
  alter table user_workspace_memberships
    add constraint user_workspace_memberships_notification_channels_array
    check (notification_channels is null or jsonb_typeof(notification_channels) = 'array');
exception when duplicate_object then null;
end $$;
