# Color Palette

## Purpose

This document defines color usage from a backend UI perspective.

For backend admin, color must communicate state clearly.

## Functional Color Roles

| Role | Purpose |
|---|---|
| Primary | Main action and brand identity |
| Success | Paid, completed, connected |
| Warning | Pending, needs attention, manual review |
| Danger | Failed, cancelled, destructive |
| Info | Neutral system information |
| Muted | Secondary text/background |
| Border | Separation and structure |

## Status Color Mapping

### Payment

| Status | Color Role |
|---|---|
| pending | warning |
| requires_action | warning |
| paid | success |
| failed | danger |
| expired | muted/danger |
| cancelled | muted |
| refunded | info |

### Order

| Status | Color Role |
|---|---|
| new | info |
| pending_payment | warning |
| paid | success |
| processing | info |
| completed | success |
| cancelled | danger |

### Product

| Status | Color Role |
|---|---|
| draft | muted |
| active | success |
| archived | muted |
| out_of_stock | warning |

## Rule

Do not rely on color only.

Always show label text inside badges.
