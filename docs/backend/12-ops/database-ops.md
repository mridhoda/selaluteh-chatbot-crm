# Database Ops

## Useful Queries

List outlets:

```sql
select * from outlets where workspace_id = '<workspace_id>';
```

Check user outlet access:

```sql
select * from user_outlet_access
where user_id = '<user_id>'
and workspace_id = '<workspace_id>';
```

Debug order outlet:

```sql
select id, order_number, workspace_id, outlet_id, status, payment_status
from orders
where order_number = '<order_number>';
```

## Rule

Do not manually move order outlet in production without audit/approval.
