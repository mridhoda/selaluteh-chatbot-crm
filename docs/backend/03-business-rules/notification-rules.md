# Notification Rules

## Purpose

Defines rules for messages sent automatically to customers/admins.

## Notification Channels

MVP notification channels:

```txt
Telegram customer message
CRM dashboard/inbox state
optional admin internal notification
```

## Customer Notifications

Allowed customer notifications:

- welcome/start message
- cart summary
- checkout summary
- payment link
- payment success
- payment failed/expired
- order status update
- human takeover info if useful

## Payment Success Rule

Send payment success notification only after:

```txt
payment webhook verified
payment row updated
order row updated
transaction committed
```

## Duplicate Notification Rule

A provider webhook may repeat. Payment success notification must be sent once per payment success transition.

Store notification status or use payment/order event log.

## Order Status Notification

Order status update notification should be sent when status changes meaningfully:

```txt
paid
processing
ready
completed
cancelled
expired
requires_review
```

Avoid spamming user for internal status changes.

## Human Notification

Admin/human may be notified when:

- AI escalates
- user asks for admin
- payment requires review
- order requires review
- complaint opens
- webhook fails repeatedly

## Message Wording

Customer notification should be:

- short
- clear
- friendly
- based on confirmed DB state

## Sensitive Data Rule

Do not send sensitive provider payload, internal error, or secret in customer notification.

## Platform Rule

Platform provider rules must be respected.

For Telegram MVP, direct bot messages are allowed inside bot interaction, but still avoid unsolicited spam.
