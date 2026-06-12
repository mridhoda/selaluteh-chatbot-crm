# Database Schema

## Architecture Mode

```txt
MVP: one workspace, many outlets
Future: many workspaces/accounts/franchise owners, each with many outlets
```

## Core Tables

### workspaces

Represents business account/franchise owner.

### outlets

Represents physical branch under workspace.

Suggested fields:

```txt
id
workspace_id
name
code
address
phone
status
timezone
opening_hours
metadata
created_at
updated_at
```

### user_workspace_memberships

Represents user role inside a workspace.

Suggested fields:

```txt
id
workspace_id
user_id
role
status
created_at
updated_at
```

### user_outlet_access

Represents user access to a specific outlet.

Suggested fields:

```txt
id
workspace_id
outlet_id
user_id
role
status
created_at
updated_at
```

### product_outlet_availability

Represents product availability per outlet.

Suggested fields:

```txt
id
workspace_id
product_id
outlet_id
is_available
price_override
stock_quantity
status
created_at
updated_at
```

## Add outlet_id To

```txt
carts
checkouts
orders
payments
complaints
```

Optional:

```txt
chats.current_outlet_id
contacts.last_outlet_id
```

## Rule

All tenant-owned data must include workspace_id.

Outlet-operational data must include outlet_id.
