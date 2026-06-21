# Payment UI Requirements

## Purpose

Define UI elements required to operate payment features safely.

## Payment Status Display

Every order detail should show:

- payment status badge
- provider
- amount
- payment link
- provider reference id
- created at
- paid at
- expires at
- latest webhook event

For Xendit Test Mode, staff-facing UI should clearly show:

```txt
Xendit
Test Mode
Connected / Not configured
```

Customer-facing payment links must not expose API keys, webhook tokens, or internal provider metadata.

## Required Buttons

| Button | Purpose | Risk |
|---|---|---|
| Create & Send Payment Link | create or reuse Xendit hosted checkout link | Medium |
| Copy Payment Link | share link | Low |
| Refresh Status | fetch latest state | Low |
| View Events | inspect webhook timeline | Low |
| Cancel Payment | cancel if supported | High |
| Manual Mark Paid | admin override | Critical |

## Manual Mark Paid Rule

This action should be hidden or restricted by default.

If enabled, require:

- owner/super role
- confirmation dialog
- reason text
- proof/reference
- optional re-auth
- audit log

## Payment Event Timeline

Show:

- event type
- provider event id
- signature valid
- status mapped
- processed/failed
- timestamp
- error details if any

## Orders Sidebar MVP

Payment choices:

```txt
Link Payment — Xendit Test
Manual Transfer
Cash on Delivery
```

Primary action for Xendit:

```txt
Create & Send Payment Link
```

Status badges must stay separate:

```txt
Payment: Pending / Paid / Expired
Order: New / Accepted / Preparing / Ready / Completed
```

If an active Xendit session already exists, the UI should show actions equivalent to:

```txt
Open Payment Link
Resend Link
Refresh Status
Expires at / expires in
```

Clicking create again must not create a duplicate session when the backend returns an active reusable attempt.

## Error States

Common payment errors:

- provider unavailable
- invalid signature
- payment already paid
- payment expired
- order not found
- duplicate event ignored
- amount mismatch

UI must show clear message and recommended action.
