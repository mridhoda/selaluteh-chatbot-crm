# RLS Policies

## Goal

Protect by:

```txt
workspace isolation
+
outlet access isolation
```

## Workspace Rule

User can access workspace data only if they have active workspace membership.

## Outlet Rule

For outlet-specific rows, user must:

- be workspace owner/admin, or
- have active user_outlet_access for row.outlet_id

## Service Role Caveat

If backend uses service role, app-layer authorization is still mandatory.

## Phase 3 Online/QR Store Tables

Migration `038_online_qr_store_schema_phase3.sql` enables RLS and service-role policies for:

- `storefronts`
- `storefront_outlets`
- `qr_locations`
- `qr_codes`
- `payment_providers`
- `payment_provider_settings`
- `payment_status_history`

Public customer APIs still run through backend service-role repositories. They must only expose customer-safe storefront, outlet, menu, QR, payment status, and public order fields.

Provider credential columns in `payment_provider_settings` are ciphertext/reference fields and are never returned by public or admin responses.

Migration `040_online_qr_store_phase32_detail_schema.sql` adds optional `security_events` with RLS enabled and a service-role-only policy. Customer/admin APIs must not expose raw security event metadata without an explicit authenticated admin endpoint and redaction review.
