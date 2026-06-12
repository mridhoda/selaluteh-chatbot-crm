# RLS Policies

## Goal

Protect by:

```txt
workspace isolation
+
outlet access isolation
```

## Workspace Rule

User can access workspace data only if they have active workspace membership.

## Outlet Rule

For outlet-specific rows, user must:

- be workspace owner/admin, or
- have active user_outlet_access for row.outlet_id

## Service Role Caveat

If backend uses service role, app-layer authorization is still mandatory.
