# Database Access

## Required Context

Repositories should receive:

```txt
workspaceId
allowedOutletIds
requestedOutletId optional
```

## Example

```txt
findOrders({
  workspaceId,
  allowedOutletIds,
  requestedOutletId,
  filters
})
```

## Never Trust

```txt
req.body.workspace_id
req.query.workspace_id
req.query.outlet_id without validation
```

## Required Helpers

- requireWorkspaceAccess(userId, workspaceId)
- requireOutletAccess(userId, workspaceId, outletId)
- getAllowedOutletIds(userId, workspaceId)
- assertOutletBelongsToWorkspace(outletId, workspaceId)
