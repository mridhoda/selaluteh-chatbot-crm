<!--
Tech Spec Pack: Telegram-first Marketplace Backend
Project: KALIS.AI / eskala-bot evolution
Target: Chatbot CRM + Telegram Marketplace MVP
Generated: 2026-06-11
-->

# Backend Runbook

## Common Local Commands

```bash
npm --prefix server install
npm --prefix web install
npm run dev
```

Backend:

```bash
npm --prefix server run dev
```

Worker if separated:

```bash
npm --prefix server run worker
```

## Local Webhook Testing

1. Start backend.
2. Start tunnel.
3. Set `PUBLIC_BASE_URL` to tunnel URL.
4. Call Telegram setWebhook endpoint.
5. Send `/start` to bot.

## Debug Telegram Webhook

Check:

- platform exists and enabled
- token matches
- public URL reachable
- webhook_events row inserted
- contact/chat/message rows created
- `takeover_by` not blocking AI unexpectedly
- Telegram send API response

## Debug Payment Webhook

Check:

- provider webhook URL configured
- signature env correct
- raw event inserted into `payment_events`
- payment provider transaction id matches
- amount matches order total
- status transition allowed
- notification sent

## Debug AI Reply

Check:

- API keys available
- agent assigned to platform
- chat takeover not active
- recent messages loaded
- product context loaded if commerce query
- LLM latency/error logs
- fallback provider status

## Debug Local Files

Check:

- `LOCAL_UPLOAD_ROOT` exists
- process can write to directory
- `/files/...` serves expected file
- `files.relative_path` maps to existing file
- Docker volume mounted

## Emergency Actions

### Disable AI temporarily

Set workspace/agent AI disabled or env:

```env
AI_DISABLED=true
```

### Disable checkout temporarily

Set feature flag:

```env
MARKETPLACE_CHECKOUT_ENABLED=false
```

### Disable payment webhook processing temporarily

Do not drop events. Store raw events and mark processing disabled.

```env
PAYMENT_WEBHOOK_PROCESSING_ENABLED=false
```

## Production Incident Checklist

- [ ] Identify affected workspace.
- [ ] Check logs by request_id/event_id.
- [ ] Check webhook_events/payment_events.
- [ ] Check duplicate records.
- [ ] Check provider status manually if payment issue.
- [ ] Communicate with admin/user if needed.
- [ ] Add test to prevent recurrence.
