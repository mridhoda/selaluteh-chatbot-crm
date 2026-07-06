alter table if exists agents
  add column if not exists channel_connection_id uuid references channel_connections(id);

create index if not exists idx_agents_workspace_channel_connection
  on agents(workspace_id, channel_connection_id)
  where channel_connection_id is not null;

update agents a
set channel_connection_id = cc.id
from channel_connections cc
where a.channel_connection_id is null
  and a.workspace_id = cc.workspace_id
  and a.platform_id = cc.legacy_platform_id;
