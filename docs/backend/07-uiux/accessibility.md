# Accessibility

## Purpose

Accessibility matters even for admin dashboards because operators may use the system for long sessions.

## Backend-Relevant Accessibility

The UI must make backend states clear without relying only on color.

Examples:

- Payment status should use text + color.
- Order status should use label + icon/color.
- Error states should include messages.
- Disabled buttons should explain why.

## Required Practices

- Buttons have clear labels.
- Icon-only buttons have accessible labels.
- Form fields have labels.
- Required fields are indicated.
- Error messages are tied to fields.
- Keyboard navigation works for forms/tables/dialogs.
- Focus state is visible.
- Confirmation dialogs are keyboard accessible.
- Loading state is announced visually.
- Status badges use text.

## Critical UI Areas

High accessibility priority:

- payment status
- order status
- destructive confirmations
- human takeover
- platform connection status
- error alerts
- file upload errors

## Color Contrast

Status badges and buttons must remain readable in light and dark mode.

## Error Language

Error messages should be actionable:

Bad:

```txt
Error
```

Good:

```txt
Payment webhook signature is invalid. Check provider webhook secret.
```

## Admin Safety

For dangerous actions, require:

- clear title
- impact explanation
- confirmation button text
- cancel button
- focus trap in modal
