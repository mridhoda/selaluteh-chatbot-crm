# RLS Security

## Goal

RLS protects tenant data when frontend or anon key access is introduced.

Even if backend uses Supabase service role, RLS design should exist as defense-in-depth.

## Core Policy

```sql
row.workspace_id = public.current_workspace_id()
```

## Required Helper Functions

```sql
current_app_user_id()
current_workspace_id()
current_app_role()
```

## Tables Requiring RLS

```txt
workspaces
users
settings
platforms
agents
contacts
chats
messages
orders
order_items
complaints
products
product_categories
product_variants
carts
cart_items
checkouts
payments
payment_events
files
ai_actions
```

## Role-Aware Policies

For chats:

```txt
owner/super: workspace chats
agent: assigned/taken-over chats only, unless product rule says all inbox visible
```

For settings/platforms/payment config:

```txt
owner/super only
```

## Service Role Warning

`SUPABASE_SERVICE_ROLE_KEY` bypasses RLS.

Therefore:

- never expose service role key to frontend;
- backend must still validate workspace ownership;
- logs must not print Supabase client config.

## RLS Test Cases

- Auth user from workspace A cannot select workspace B chats.
- Agent role cannot select unassigned chats if restriction enabled.
- Insert with wrong `workspace_id` fails.
- Update that changes `workspace_id` fails.
- Payment rows cannot be selected across workspace.
