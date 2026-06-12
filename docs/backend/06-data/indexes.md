# Indexes

Recommended indexes:

```sql
create index idx_outlets_workspace_id on outlets(workspace_id);
create index idx_user_workspace_memberships_user on user_workspace_memberships(user_id);
create index idx_user_workspace_memberships_workspace on user_workspace_memberships(workspace_id);
create index idx_user_outlet_access_user_workspace on user_outlet_access(user_id, workspace_id);
create index idx_user_outlet_access_outlet on user_outlet_access(outlet_id);
create index idx_product_outlet_availability_workspace_outlet on product_outlet_availability(workspace_id, outlet_id);
create index idx_product_outlet_availability_product on product_outlet_availability(product_id);
create index idx_orders_workspace_outlet_created on orders(workspace_id, outlet_id, created_at desc);
create index idx_payments_workspace_outlet_created on payments(workspace_id, outlet_id, created_at desc);
```
