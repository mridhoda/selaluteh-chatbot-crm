<!--
Tech Spec Pack: Telegram-first Marketplace Backend
Project: KALIS.AI / eskala-bot evolution
Target: Chatbot CRM + Telegram Marketplace MVP
Generated: 2026-06-11
-->

# AI Pipeline

## Current AI Role

The existing app uses AI to reply to customer messages and can create orders/complaints using special markers. For the marketplace MVP, AI should be upgraded into a controlled **shopping assistant**, not an autonomous order writer.

## Target AI Architecture

```txt
Incoming message
  -> message classifier
  -> commerce intent detector
  -> product context retrieval
  -> LLM response/action proposal
  -> backend validation
  -> deterministic action execution
  -> platform-specific response rendering
```

## AI Responsibilities

AI may:

- answer product questions
- recommend products
- explain differences between variants
- ask clarifying questions
- summarize cart/order status in friendly language
- escalate to human

AI must not:

- mark payment as paid
- override product prices
- create checkout without confirmation
- promise stock without backend validation
- change order status directly
- access another workspace's data
- invent policy/refund rules

## Prompt Boundary

System prompt must include:

```txt
You are a commerce assistant for this workspace.
Only answer based on provided product catalog, FAQ, policy, and chat context.
For order/payment/cart actions, propose an action. The backend will validate and execute it.
Never claim payment is successful unless backend says payment_status=paid.
```

## AI Action Proposal Format

Store proposals in `ai_actions`.

Example:

```json
{
  "type": "product_recommendation",
  "confidence": 0.86,
  "payload": {
    "productIds": ["uuid-1", "uuid-2"],
    "reason": "User asked for sweet coffee"
  }
}
```

Example add-to-cart proposal:

```json
{
  "type": "cart_add_suggestion",
  "confidence": 0.8,
  "payload": {
    "productId": "uuid",
    "variantId": null,
    "quantity": 2,
    "requiresConfirmation": true
  }
}
```

Backend response:

```txt
AI suggests adding product.
Bot asks user with inline button:
[Add Salty Caramel x2]
```

## Product Context Retrieval

For MVP, use direct database search before vector RAG:

1. Search by product name/slug.
2. Search by category/tags.
3. Use active products only.
4. Include price, availability, description, and variants.

Later, add embeddings for product FAQ/knowledge.

## AI Message Pipeline

```txt
load chat
load recent messages
load agent config
load relevant product context
load commerce state: cart/order if any
build prompt
call LLM
parse response/action proposals
validate action proposals
render reply
save ai message
```

## Escalation Rules

AI should escalate if:

- payment dispute
- angry customer
- unclear refund issue
- provider webhook mismatch
- repeated failed checkout
- user asks for human
- AI confidence low

Set:

```txt
chats.is_escalated = true
```

But do not set `takeover_by`; that belongs to human assignment.

## Memory Rules

Use recent chat history only for conversational context. Do not rely on AI memory for financial or order state. Always fetch current state from database.

## Safety Around Legacy Markers

Legacy markers:

```txt
FILE_ORDER_JSON
FILE_COMPLAINT_JSON
ESCALATE_TO_HUMAN
```

For MVP:

- Keep them for backward compatibility.
- Route their side effects through services.
- Attach `workspace_id` validation.
- Prefer new `ai_actions` for commerce.

## Logging

Log:

- provider
- model
- latency
- token usage if available
- action proposal type
- action execution status
- error category

Do not log:

- raw API keys
- payment secrets
- full sensitive customer data
