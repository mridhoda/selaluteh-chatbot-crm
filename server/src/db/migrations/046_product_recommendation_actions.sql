alter table product_recommendations
  add column if not exists action_type text not null default 'add'
  check (action_type in ('add', 'replace_source'));
