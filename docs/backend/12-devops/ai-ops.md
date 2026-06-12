# AI Operations

## AI Providers

Current/target AI providers may include:

- OpenAI.
- Gemini.

## Operational Rules

- AI should have fallback behavior.
- AI errors should not break webhook processing.
- AI should not control payment/order final state.
- Human takeover must stop AI replies.
- AI prompt changes should be versioned or logged.

## Monitor

- AI latency.
- AI error count.
- fallback count.
- escalation count.
- token/cost estimate.
- hallucination incidents.
- invalid action proposals.

## Common Issues

### AI Provider Fails

Action:

1. Check API key.
2. Check provider status.
3. Use fallback provider if available.
4. Return safe fallback message.
5. Log error.

### AI Gives Wrong Product Info

Action:

1. Check product data source.
2. Add guardrail: do not invent product/price.
3. Use backend product lookup.
4. Escalate if uncertain.

### AI Tries to Mark Payment Paid

Action:

1. Block action.
2. Log ai_action as rejected.
3. Reply with safe payment status message based on backend state.
4. Add prompt guardrail/test.

## AI Safe Fallback Message

Example:

```txt
Maaf kak, aku sedang kesulitan memproses jawaban otomatis. Aku hubungkan ke admin ya 🙏
```
