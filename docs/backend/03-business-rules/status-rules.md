# Status Rules

## Purpose

Defines canonical lifecycle statuses and valid transitions across backend resources.

## Chat Status

```txt
open
resolved
```

Rules:

```txt
open -> resolved
resolved -> open if reopened by admin or incoming message policy
```

`takeover_by` and `is_escalated` are separate state flags.

## Message Sender

```txt
user
ai
human
system
```

Recommended addition: `system` for payment/order notifications.

## Product Status

```txt
draft
active
archived
out_of_stock
```

Only `active` products can be purchased.

## Cart Status

```txt
active
checked_out
abandoned
expired
cancelled
```

Only `active` carts can be modified.

## Checkout Status

```txt
draft
awaiting_confirmation
confirmed
expired
cancelled
converted_to_order
```

Payment cannot start before checkout confirmation.

## Order Status

```txt
new
awaiting_payment
paid
processing
ready
completed
cancelled
expired
requires_review
```

Primary path:

```txt
new -> awaiting_payment -> paid -> processing -> ready -> completed
```

## Payment Status

```txt
pending
requires_action
paid
settlement
failed
expired
cancelled
refunded
partially_refunded
requires_review
```

Provider event controls most transitions.

## Complaint Status

```txt
open
in_review
resolved
dismissed
```

## Webhook Event Status

```txt
received
processing
processed
failed
rejected
duplicate
```

## AI Action Status

```txt
proposed
approved
executed
rejected
failed
cancelled
```

## Transition Enforcement

Status transitions should be enforced in service layer, not only UI.

Rejected transition should return:

```txt
409 Conflict
```

or domain-specific error.
