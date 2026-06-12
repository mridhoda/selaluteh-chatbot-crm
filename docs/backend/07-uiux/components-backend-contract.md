# Components Backend Contract

## Purpose

This document maps UI components to backend fields and API behavior.

## Status Badge Contract

Component:

```txt
StatusBadge
```

Required props:

- type: order/payment/product/chat/webhook
- status: string
- label override optional

Backend requirement:

- status enums must be stable
- API should return normalized status

## Data Table Contract

Component:

```txt
DataTable
```

Backend requirement:

- pagination
- search
- filters
- sorting
- total count if possible

Minimum query params:

```txt
page
limit
search
status
sort
date_from
date_to
```

## Detail Drawer Contract

Used for:

- order detail
- payment detail
- contact detail
- product quick view
- webhook event detail

Backend requirement:

- detail endpoint returns all needed related summary data
- avoid extra client-side N+1 fetch where possible

## Confirm Dialog Contract

Used for dangerous actions.

Backend requirement:

- action endpoints should be idempotent where possible
- return updated entity after success
- return clear error if action is invalid

## File Upload Contract

Used for:

- product images
- agent knowledge
- chat attachments
- payment proof

Backend requirement:

- file size/type validation
- file metadata returned
- public_path or file_id returned
- workspace scoped storage metadata
