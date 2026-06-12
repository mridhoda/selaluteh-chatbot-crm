# Rate Limit & Abuse Prevention

## Goals

Prevent:

- login brute force;
- OTP spam;
- webhook floods;
- AI cost abuse;
- payment endpoint probing;
- file upload abuse;
- spammy Telegram customer messages.

## Recommended Rate Limits

| Area | Suggested Limit |
|---|---:|
| Login | 5 attempts / 15 min / email+IP |
| Register | 5 attempts / hour / IP |
| OTP verify | 5 attempts / 15 min / email |
| Forgot password | 3 requests / hour / email+IP |
| Admin API | 300 requests / min / user |
| Chat send | 60 messages / min / user |
| File upload | 20 uploads / hour / user |
| Telegram webhook | provider-dependent, add idempotency and queue |
| AI generation | quota by workspace/plan |
| Payment create | 20 attempts / hour / customer/cart |

## Abuse Signals

- Many failed login attempts.
- Repeated OTP requests.
- Large file upload bursts.
- Same Telegram user sends hundreds of messages quickly.
- Same cart creates many payment links.
- Webhook duplicate rate spikes.
- AI token usage spikes abnormally.

## AI Cost Controls

- Limit message history included in prompt.
- Skip AI when `takeover_by` exists.
- Use cheaper model for simple FAQ.
- Add workspace monthly quota.
- Add per-chat cooldown for repeated unknown messages.
- Cache product/FAQ answers where safe.

## Telegram Abuse Handling

For abusive external users:

```txt
mark contact as blocked
skip AI reply
optionally send final warning
prevent cart/payment creation
```

## Implementation Notes

Recommended components:

```txt
express-rate-limit for basic API
Redis for distributed rate limit
job queue for webhook processing
webhook_events for idempotency
workspace usage counters for quota
```
