# Analytics API

## Purpose

Support admin dashboard metrics for CRM and marketplace.

## GET `/api/v1/analytics/traffic`

Message traffic over time.

Auth required.

### Query

| Param | Notes |
|---|---|
| `from` | datetime |
| `to` | datetime |
| `group_by` | hour/day/week |
| `platform_type` | optional |

### Response

```json
{
  "success": true,
  "data": [
    {
      "bucket": "2026-06-12",
      "messages_total": 120,
      "messages_user": 70,
      "messages_ai": 40,
      "messages_human": 10
    }
  ]
}
```

## GET `/api/v1/analytics/platforms`

Message/order summary by platform.

## GET `/api/v1/analytics/agents`

AI agent performance summary.

## GET `/api/v1/analytics/peak-hours`

Peak chat activity by hour.

## GET `/api/v1/analytics/commerce`

Marketplace MVP analytics.

### Query

```txt
from
to
platform_type
```

### Response

```json
{
  "success": true,
  "data": {
    "orders_total": 40,
    "orders_paid": 25,
    "gross_revenue": 1250000,
    "average_order_value": 50000,
    "cart_created": 80,
    "checkout_started": 50,
    "payment_pending": 15,
    "payment_failed": 3
  }
}
```

## Workspace Rule

All analytics must filter by `workspace_id`.

## Performance Rule

Analytics endpoints should use indexed fields and avoid scanning all messages/orders without date filter.
