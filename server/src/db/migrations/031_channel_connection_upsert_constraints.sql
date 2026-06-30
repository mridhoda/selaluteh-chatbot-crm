-- Ensure PostgREST upsert(onConflict) can target connection-scoped identities.
-- Partial unique indexes are not accepted as ON CONFLICT arbiters by Supabase upsert.

create unique index if not exists uq_contacts_connection_external_id
  on contacts(channel_connection_id, external_id);

create unique index if not exists uq_chats_connection_provider_conversation
  on chats(channel_connection_id, provider_conversation_id);
