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

## Required Buttons

| Button | Purpose | Risk |
|---|---|---|
| Generate Payment Link | create payment | Medium |
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
