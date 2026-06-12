# API Versioning

## Recommended Strategy

New APIs should use:

```txt
/api/v1
```

Existing legacy routes can remain temporarily:

```txt
/auth
/users
/platforms
/agents
/chats
/orders
/complaints
/webhook
```

## Migration Pattern

```txt
legacy route
-> adapter/controller
-> v1 service layer
-> repository layer
```

## Breaking Changes

Breaking changes require a new version:

```txt
/api/v2
```

Examples:

- Response shape changes.
- Field renames.
- Auth behavior changes.
- Status enum changes.
- Endpoint removal.

## Non-Breaking Changes

Can stay in v1:

- Add optional field.
- Add new endpoint.
- Add new query param with default behavior.
- Add new status only if clients handle unknown statuses safely.

## Deprecation Policy

When deprecating legacy route:

1. Add warning log.
2. Document replacement route.
3. Keep for one release cycle.
4. Remove after frontend/backend migration.
