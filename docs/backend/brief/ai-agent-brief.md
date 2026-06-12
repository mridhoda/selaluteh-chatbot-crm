# AI Agent Brief

## Current AI Role

The current system uses AI agents to reply to customer chat, using provider integration such as OpenAI/Gemini.

Existing AI can:

- reply to messages
- use configured prompt/behavior
- use knowledge entries
- create legacy orders/complaints via markers
- escalate to human

## Target AI Role

AI should become a safe shopping assistant.

AI can:

- answer product questions
- recommend products
- explain checkout steps
- summarize cart/order
- ask clarifying questions
- escalate to human

AI cannot:

- mark payment as paid
- override product price
- create final order without backend validation
- bypass checkout confirmation
- ignore product status/availability
- access another workspace's data

## Backend-Validated Actions

AI may propose actions like:

```txt
search_product
show_product_detail
suggest_add_to_cart
start_checkout
check_order_status
handoff_to_human
```

Backend must validate and execute.

## AI Action Logging

Recommended table:

```txt
ai_actions
```

Purpose:

- Track proposed AI action.
- Track execution status.
- Debug AI behavior.
- Prevent hidden side effects.

## Prompt Guardrail

System prompt should tell AI:

```txt
You are a shopping assistant.
You may guide the customer.
Do not claim payment is successful unless backend/payment provider says so.
Do not invent product price or availability.
Use backend product data when available.
Escalate if uncertain.
```
