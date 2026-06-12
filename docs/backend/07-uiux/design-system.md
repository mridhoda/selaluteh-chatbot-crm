# Design System

## Purpose

Define reusable UI rules for admin dashboard.

## Foundations

- Typography.
- Colors.
- Spacing.
- Border radius.
- Shadows.
- Icons.
- Status badges.
- Buttons.
- Inputs.
- Tables.
- Cards.
- Modals.
- Drawers.
- Alerts.

## Backend-Driven Design System

The design system must support backend operations:

- long data tables
- status filtering
- destructive actions
- form validation
- webhook logs
- JSON payload views
- chat messages
- file previews
- payment/order timelines

## Component Categories

### Navigation

- sidebar
- breadcrumbs
- tabs
- page header

### Feedback

- toast
- alert
- error panel
- inline field error
- loading skeleton
- empty state

### Data

- table
- badge
- timeline
- detail drawer
- summary card

### Actions

- button
- dropdown menu
- confirm dialog
- bulk action bar

### Forms

- input
- select
- switch
- upload
- rich text/prompt editor

## Consistency Rule

The same backend status must look the same everywhere.

Example:

```txt
payment.status = paid
```

Should use the same badge style in:

- orders table
- payment table
- order detail
- dashboard metric
