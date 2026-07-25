ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'duitku';

INSERT INTO payment_providers (code, name, is_enabled, supports_qris, supports_virtual_account, supports_ewallet, supports_card, metadata)
VALUES ('duitku', 'Duitku POP', true, true, true, true, true, '{}'::jsonb)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  is_enabled = EXCLUDED.is_enabled,
  supports_qris = EXCLUDED.supports_qris,
  supports_virtual_account = EXCLUDED.supports_virtual_account,
  supports_ewallet = EXCLUDED.supports_ewallet,
  supports_card = EXCLUDED.supports_card;
