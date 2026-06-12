# Disaster Recovery

## Disaster Scenarios

| Scenario | Impact |
|---|---|
| Database lost/corrupted | Critical data loss |
| Uploads lost | Media/payment proof/product images broken |
| Backend server down | App/webhooks unavailable |
| Payment webhook broken | Paid order not updated |
| Secrets leaked | Security compromise |
| Wrong deployment wipes uploads | Media loss |
| Cross-workspace leak | Privacy incident |

## Recovery Priorities

1. Stop ongoing damage.
2. Preserve evidence/logs.
3. Restore service.
4. Restore data.
5. Notify stakeholders if needed.
6. Add prevention.

## RPO/RTO Targets

Early MVP suggestion:

| Target | Meaning | Suggested |
|---|---|---|
| RPO | Max acceptable data loss | < 24 hours |
| RTO | Max acceptable downtime | < 4 hours |

Improve later as production grows.

## Disaster Recovery Checklist

- [ ] Identify incident.
- [ ] Pause webhooks if needed.
- [ ] Stop writes if data risk.
- [ ] Restore database backup.
- [ ] Restore uploads backup.
- [ ] Deploy last known good code.
- [ ] Verify app smoke tests.
- [ ] Verify payment/order state.
- [ ] Re-enable webhooks.
- [ ] Write postmortem.
