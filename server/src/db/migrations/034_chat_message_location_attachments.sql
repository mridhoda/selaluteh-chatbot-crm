-- Support native location message previews in chat history.
-- Location payloads are stored in chat_messages.raw_payload->'attachment'.

ALTER TYPE chat_message_type ADD VALUE IF NOT EXISTS 'location';

ALTER TABLE chat_messages
  ALTER COLUMN raw_payload SET DEFAULT '{}'::jsonb;

UPDATE chat_messages
SET raw_payload = '{}'::jsonb
WHERE raw_payload IS NULL;

ALTER TABLE chat_messages
  ALTER COLUMN raw_payload SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_messages_attachment_type
  ON chat_messages ((raw_payload->'attachment'->>'type'))
  WHERE raw_payload ? 'attachment';
