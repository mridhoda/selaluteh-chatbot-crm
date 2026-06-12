# API Overview

## Updated API Context

APIs must support:

```txt
MVP: one workspace + many outlets
Future: many workspaces + many outlets each
```

## Common Query Params

```txt
outlet_id
status
search
date_from
date_to
page
limit
sort
```

## New API Groups

- Outlets API
- Outlet Access API
- Product Outlet Availability API

## Access Rule

Backend derives workspace from authenticated context and validates outlet access server-side.

Unauthorized outlet access returns 403 or 404.
