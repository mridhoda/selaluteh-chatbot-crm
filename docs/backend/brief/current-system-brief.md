# Current System Brief

## Current Backend

The backend currently behaves as a Chatbot CRM system.

## Existing Core Modules

- Auth.
- Users/workspace concept.
- Platforms.
- Agents.
- Chats.
- Messages.
- Contacts.
- Orders.
- Complaints.
- Analytics.
- Local files.
- Telegram webhook.
- Meta webhook.
- AI reply pipeline.
- Human takeover.

## Current Runtime Stack

- Express backend.
- React/Vite frontend.
- MongoDB/Mongoose.
- Custom JWT auth.
- OpenAI/Gemini AI integration.
- Local file uploads.

## Current Strengths

- Telegram webhook already exists.
- Message storage already exists.
- Contact/chat relation already exists.
- Dashboard/inbox already exists.
- AI agent config already exists.
- Human takeover already exists.
- Legacy order/complaint flow already exists.

## Current Weaknesses for Marketplace

- No standalone product catalog.
- No cart.
- No checkout.
- No normalized order items.
- No payment gateway.
- No payment webhook.
- No payment event log.
- No Telegram inline commerce flow.
- Legacy orders are AI form-driven.
- Orders/complaints route security must be hardened.
- Webhook idempotency must be added.

## Do Not Break

When implementing new marketplace features, do not break:

- Login.
- Dashboard.
- Inbox.
- Telegram webhook.
- AI reply.
- Human takeover.
- Existing chat history.
- Contacts.
- Existing order/complaint compatibility.
