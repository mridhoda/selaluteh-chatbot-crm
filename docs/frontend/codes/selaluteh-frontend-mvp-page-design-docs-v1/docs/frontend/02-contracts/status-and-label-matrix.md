# Status and Label Matrix

## Product lifecycle

| Status | Meaning | Semantic style |
|---|---|---|
| draft | Not visible to customer | neutral |
| active | Eligible for channel display | success/info |
| archived | Hidden, retained for history | neutral |

## Product outlet availability

| Status | Meaning |
|---|---|
| available | Can be ordered in outlet |
| unavailable | Manually disabled for outlet |
| out_of_stock | Temporarily unavailable |
| partial | Available in some outlets |

## Payment

| Status | Meaning |
|---|---|
| pending | Awaiting customer/provider result |
| paid | Verified payment success |
| expired | Link/payment window expired |
| failed | Provider/process failed |
| cancelled | Cancelled safely |
| refunded | Provider verified refund, P1/read-only until supported |

## Chat

| Status | Meaning |
|---|---|
| open | Active conversation |
| resolved | Closed operationally |
| escalated | Needs human attention |

Handling state is separate:

```txt
ai_handling
human_takeover
unassigned
```

## Platform connection

```txt
connected
disabled
pending_setup
needs_attention
disconnected
```

Webhook health is separate:

```txt
healthy
no_recent_events
verification_failed
delivery_errors
not_configured
```

## Rule

Never reuse one generic `status` badge mapping for different domains without a domain key. `pending` payment and `pending setup` platform are not the same state.
