# Target State

## MVP Target

```txt
Workspace: SelaluTeh
  ├── Outlet Samarinda
  ├── Outlet Tenggarong
  └── Outlet Bontang
```

Owner/admin can view all outlets. Outlet manager/human agent can access assigned outlets.

## Future Target

```txt
Platform
  ├── Workspace A / Franchise Owner A
  │     ├── Outlet A1
  │     └── Outlet A2
  └── Workspace B / Franchise Owner B
        ├── Outlet B1
        └── Outlet B2
```

## Technical Target

Every authenticated request resolves:

```txt
user
workspace membership
allowed outlet ids
requested outlet id/filter
```

APIs must validate access before returning or mutating data.
