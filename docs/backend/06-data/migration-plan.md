# Migration Plan

## Phase 1 — Foundation

- Add outlets table.
- Add user_workspace_memberships if missing.
- Add user_outlet_access.
- Add product_outlet_availability.

## Phase 2 — Backfill MVP Workspace

- Create default SelaluTeh workspace.
- Assign existing users to workspace.
- Create initial outlets.
- Map legacy data to workspace.

## Phase 3 — Add Outlet IDs

Add outlet_id to:

- carts
- checkouts
- orders
- payments
- complaints
- chats current outlet optional

## Phase 4 — Update Services/API/UI

- outlet access validation
- outlet filters
- outlet selection flow
- product availability per outlet

## Phase 5 — Tests

- workspace isolation
- outlet isolation
- cart outlet binding
- payment webhook outlet mapping
