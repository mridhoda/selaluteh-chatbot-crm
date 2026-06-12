# Unit Economics

## Unit of Analysis

Recommended unit:

```txt
workspace / merchant
```

Each merchant has:

- Monthly subscription revenue.
- AI usage cost.
- Hosting/database cost share.
- Storage/bandwidth cost.
- Support/onboarding cost.
- Payment processing overhead.

## Basic Formula

```txt
Gross margin per workspace =
monthly revenue per workspace
- variable cost per workspace
```

Variable costs include:

- AI token usage.
- Messaging/API cost.
- Storage/bandwidth.
- Payment related operational cost.
- Support time.

## Key Metrics

| Metric | Meaning |
|---|---|
| ARPU | Average revenue per workspace |
| COGS | Cost of goods sold per workspace |
| Gross margin | ARPU - COGS |
| CAC | Customer acquisition cost |
| LTV | Lifetime value |
| Churn rate | Monthly customer loss |
| Payback period | Time to recover CAC |

## MVP Unit Economics Assumptions

Early MVP assumptions:

- Low number of workspaces.
- Low to medium AI usage.
- Telegram cost likely lower than WhatsApp.
- Support/onboarding cost may be high.
- Payment provider fees are paid by merchant or embedded in price.

## Risk Areas

### AI Cost

If AI is used for every message, cost can grow.

Mitigation:

- Use deterministic buttons for commerce.
- Use AI for Q&A, not all flow steps.
- Add quota per plan.
- Cache FAQ/product answers if needed.

### Support Cost

Early merchants may need manual setup.

Mitigation:

- Create onboarding checklist.
- Create import templates.
- Limit early customers to a manageable vertical.

### Storage Cost

Media files can grow.

Mitigation:

- Local storage.
- File size limit.
- Retention policy.
- Backup policy.

## Healthy MVP Target

MVP is healthy if:

```txt
subscription revenue per merchant > AI + hosting + support variable cost
```

Even if early support is high, it should decrease with better onboarding.
