-- Align outlet access and outlet supervisor columns with auto-escalation services.

alter table if exists user_outlet_access
  add column if not exists membership_id uuid;

update user_outlet_access uoa
set membership_id = uwm.id
from user_workspace_memberships uwm
where uoa.membership_id is null
  and uwm.workspace_id = uoa.workspace_id
  and uwm.user_id = uoa.user_id;

create or replace function set_user_outlet_access_membership_id()
returns trigger
language plpgsql
as $$
begin
  if new.membership_id is null then
    select uwm.id
      into new.membership_id
    from user_workspace_memberships uwm
    where uwm.workspace_id = new.workspace_id
      and uwm.user_id = new.user_id
    limit 1;
  end if;

  return new;
end;
$$;

drop trigger if exists set_user_outlet_access_membership_id on user_outlet_access;

create trigger set_user_outlet_access_membership_id
before insert or update of workspace_id, user_id, membership_id on user_outlet_access
for each row execute function set_user_outlet_access_membership_id();

alter table if exists user_outlet_access
  alter column membership_id set not null;

do $$
begin
  alter table user_outlet_access
    add constraint user_outlet_access_membership_id_fkey
    foreign key (membership_id) references user_workspace_memberships(id)
    on delete cascade;
exception when duplicate_object then null;
end $$;

create index if not exists idx_user_outlet_access_membership
  on user_outlet_access (workspace_id, membership_id);

alter table if exists outlets
  add column if not exists primary_supervisor_user_id uuid;

do $$
begin
  alter table outlets
    add constraint outlets_primary_supervisor_user_id_fkey
    foreign key (primary_supervisor_user_id) references users(id)
    on delete set null;
exception when duplicate_object then null;
end $$;

create index if not exists idx_outlets_primary_supervisor_user
  on outlets (workspace_id, primary_supervisor_user_id)
  where primary_supervisor_user_id is not null;
