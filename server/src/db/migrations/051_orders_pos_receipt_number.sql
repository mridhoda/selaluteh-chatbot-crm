-- Stores TATA-POS's own generated order_number (e.g. "SK-TGR-20260824-000001")
-- once an order.paid outbox event is delivered -- distinct from this repo's own
-- orderNumber, which stays the customer-facing lookup id. Nullable/additive:
-- old orders and any order never synced to TATA-POS simply keep it null.
alter table public.orders add column if not exists pos_receipt_number text;
