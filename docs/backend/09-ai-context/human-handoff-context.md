# Human Handoff Context

Dokumen ini menjelaskan context human takeover/handoff.

## Existing Behavior

Existing app punya `chats.takeover_by`. Jika field ini ada, AI harus berhenti membalas customer otomatis.

## Rules

When human takeover active:

- still save incoming user messages,
- do not call AI reply pipeline,
- do not send AI/autobot response,
- notify or surface unread count for human/admin,
- allow human send via CRM inbox.

## AI Escalation

AI may propose `handoff_to_human` when:

- user asks for human/admin,
- payment problem,
- refund/cancel paid order,
- serious complaint,
- low confidence,
- repeated misunderstanding.

## Marketplace Impact

If user is in checkout/payment flow and takeover happens:

- cart/order state remains unchanged,
- human can continue manually,
- AI must not resume unless takeover released.

## Release Takeover

If app supports release takeover later, it must be explicit admin action and should be auditable.
