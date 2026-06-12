# Stakeholders

## Primary Stakeholders

### Business Owner / Admin

Responsible for:

- Managing products.
- Monitoring orders.
- Handling customer chats.
- Taking over AI conversations.
- Checking payment status.
- Resolving complaints.

Needs:

- Simple dashboard.
- Clear order/payment state.
- Easy product management.
- Reliable notifications.
- Safe manual override.

### Customer

Uses Telegram to:

- Start conversation.
- Browse products.
- Ask questions.
- Add to cart.
- Checkout.
- Pay through link.
- Receive order updates.
- Ask for help.

Needs:

- Fast response.
- Clear product choices.
- Simple cart.
- Trusted payment link.
- Clear confirmation.

### Human Agent / Support

Uses CRM inbox to:

- Take over chat.
- Reply manually.
- Resolve escalated issues.
- View customer context.

Needs:

- Chat history.
- Order context.
- Payment context.
- Clear AI/human mode.

### Developer / AI Coding Agent

Works on:

- Backend APIs.
- Database migration.
- Telegram bot flow.
- Payment integration.
- Tests.
- Documentation.

Needs:

- Clear docs.
- Do-not-break rules.
- Stable folder structure.
- Acceptance criteria.

## Secondary Stakeholders

### Payment Provider

Provides:

- Payment link.
- Payment status.
- Webhook event.
- Signature verification.

### Platform Providers

Telegram, WhatsApp/Meta, Instagram.

Provide:

- Messaging webhooks.
- Message sending APIs.
- Platform IDs and tokens.

### Infrastructure Operator

Responsible for:

- Deployment.
- Env/secrets.
- Logs.
- Backup.
- Local upload persistence.
- Webhook public URL.

## Stakeholder Priority

For MVP:

1. Customer can complete Telegram purchase.
2. Admin can operate product/order/payment.
3. Existing CRM users do not lose core behavior.
4. Developer can safely extend backend.
