# Current State

## Existing System

The current backend is an AI chatbot CRM.

It has:

- Express API.
- React/Vite dashboard.
- MongoDB/Mongoose models.
- JWT custom auth with OTP.
- Telegram webhook.
- Meta webhook for WhatsApp/Instagram.
- AI provider integration.
- AI agents.
- Contacts.
- Chats.
- Messages.
- Human takeover.
- Orders legacy.
- Complaints legacy.
- Local file upload.
- Dashboard/analytics.

## Existing Strengths

- Telegram integration already exists.
- CRM inbox already exists.
- Chat/message persistence already exists.
- Human takeover already exists.
- AI reply pipeline already exists.
- Contact model already exists.
- Platform connection model already exists.
- Dashboard exists.

## Existing Gaps

For marketplace MVP:

- No standalone product catalog.
- No cart.
- No checkout state.
- No normalized order items.
- No payment gateway sandbox.
- No payment webhook.
- No payment event log.
- No Telegram inline commerce flow.
- No product CRUD designed specifically for marketplace.
- No webhook idempotency.
- Orders/complaints security needs hardening.
- AI side effects need service-layer validation.

## Existing Risks

- Public or weakly protected legacy operation routes.
- Duplicate webhook processing.
- AI-driven order creation without deterministic cart/checkout.
- Local media persistence depends on deployment strategy.
- Migration from Mongo to Supabase needs careful ID mapping.
