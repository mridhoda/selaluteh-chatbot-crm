# Outlets API

## List Outlets

```http
GET /api/outlets
```

Query:

```txt
status
search
page
limit
```

## Create Outlet

```http
POST /api/outlets
```

Body:

```json
{
  "name": "SelaluTeh Tenggarong",
  "code": "TGR",
  "address": "Jl. Example",
  "phone": "+62...",
  "status": "active",
  "opening_hours": {}
}
```

Permission:

```txt
workspace owner/admin
```

## Update Outlet

```http
PUT /api/outlets/:outlet_id
```

## Change Status

```http
PATCH /api/outlets/:outlet_id/status
```

## Rules

- outlet must belong to current workspace
- inactive outlet should not receive new customer orders
- archived outlet hidden from customer-facing list
