# Workspace Tenant Security

## Tenant Boundary

Workspace is the tenant/account boundary.

MVP has one workspace, but code must support many workspaces later.

## Rule

User can access workspace data only if they have active workspace membership.

## Dangerous Pattern

```txt
GET /orders?workspace_id=other_workspace
```

Backend must not trust client-supplied workspace_id.

## Required Checks

- user authenticated
- user active
- user has active workspace membership
- role permits action
- row belongs to workspace
