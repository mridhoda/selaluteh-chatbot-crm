# Outlet Context

## Core Concept

MVP has one workspace and many outlets.

Future production has many workspaces, each with many outlets.

## AI Rules

AI must not:

- create cart before outlet selection
- checkout before outlet selection
- recommend unavailable outlet products
- switch outlet without confirmation
- mark payment paid
- change order outlet without authorized flow

## Required Runtime Context

```txt
workspace_id
chat_id
contact_id
active_outlet_id
cart state
allowed product list
```
