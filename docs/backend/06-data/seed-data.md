# Seed Data

## MVP Seed

Workspace:

```txt
SelaluTeh HQ
```

Outlets:

```txt
SelaluTeh Samarinda
SelaluTeh Tenggarong
SelaluTeh Bontang
```

Users:

```txt
Owner
Admin
Outlet Manager Samarinda
Outlet Manager Tenggarong
Human Agent Bontang
```

Product examples:

```txt
Salty Caramel
Milk Tea
Americano
Tumbler
```

Availability example:

```txt
Salty Caramel → all outlets
Milk Tea → Samarinda/Tenggarong
Americano → Samarinda only
Tumbler → all outlets
```

## SELKOP Alpha Seed Reality

Updated: 2026-07-07

Supabase MCP verified and/or seeded the alpha target `marketplace-chatbot-Project` with redacted identifiers:

- Storefront slug `selkop`, display name `SELKOP Online Store`, status active, ordering enabled.
- Storefront outlet mappings for `SELKOP Samarinda` (`SLKP-SMD-01`) and `SELKOP Tenggarong` (`SLKP-TGR-01`), active, visible, pickup order-enabled.
- The two requested SELKOP outlets are active, `operational_status=OPEN`, `accepts_orders=true`, and `pickup_enabled=true`.
- Active product outlet availability is seeded for the active product at both requested outlets.
- Four QR locations are present for the requested outlets: pickup counter and table 01 per outlet.
- Six outlet/location/table QR rows are present with random hashed token storage; full public codes and raw tokens are not printed in docs.
- One true Universal QR row is present with `scope='universal'`, `qr_type='universal'`, null outlet/location targets, `outlet_locked=false`, random public code, and hashed token storage.
- BayarGG provider catalog exists and supports QRIS, but no real SELKOP BayarGG settings row, active settings row, or encrypted credential reference exists. This is an approved alpha deferral; do not seed fake credentials.

Command-based test validation is blocked in the current session. This seed section records Supabase MCP state and should not be read as a fresh local test pass.
