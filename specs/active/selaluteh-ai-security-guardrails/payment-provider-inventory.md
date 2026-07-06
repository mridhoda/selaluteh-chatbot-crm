# AISG-T005 Payment Provider Authority Inventory

Date: 2026-07-03
Spec: `selaluteh-ai-security-guardrails`
Task: `AISG-T005 [P1]`

## Scope

Inventory differences between payment provider documentation and runtime, and make workspace configuration the authority for provider selection. This task does not complete all payment guardrails; amount snapshots, fallback policy, and paid-authority proof remain in later P0/P1 tasks.

## Current Documentation Position

| Document | Current authority statement | Notes |
|---|---|---|
| `docs/backend/09-ai-context/payment-context.md` | Approved provider documented as Xendit Test Mode Payment Session; AI cannot mark paid. | Older text predates workspace-config provider selection for Doku/Bayar.gg. |
| `docs/backend/03-business-rules/payment-rules.md` | Payment source of truth is provider webhook or authorized admin override; Xendit Test Mode rules documented. | Needs later expansion for workspace-config provider matrix. |
| `docs/backend/08-security/payment-security.md` | Only verified provider webhook or authorized admin action can change payment state. | Still valid. |
| `server/src/services/settings.service.js` | Runtime payment settings include `provider`, `environment`, Xendit/Doku/Bayar.gg secrets. | This is the desired provider-selection authority. |

## Runtime Provider Selection Before AISG-T005

| Runtime path | Previous behavior | Risk |
|---|---|---|
| `createPayment()` | Used explicit provider or global `env.paymentProvider`. | Workspace configuration could be bypassed by global env default. |
| `createPaymentSessionForOrder()` | Used explicit provider, workspace runtime provider, then global `env.paymentProvider`. | Workspace configuration was not sole fallback authority. |
| `GET /payments/gateway/config` | Reported `env.paymentProvider` when workspace runtime provider was manual. | UI/API could show provider differing from workspace settings. |
| Direct Xendit route `/orders/:orderId/xendit/session` | Still Xendit-specific and env-backed. | Legacy/specific route remains outside generic provider-selection flow; track for later payment hardening. |
| Button-commerce payment fallback | Telegram/WhatsApp can catch provider-link failure and create manual payment explicitly. | Maps to AISG-T055; not resolved in Phase 0. |

## Runtime Provider Selection After AISG-T005

| Runtime path | Current behavior | Status |
|---|---|---|
| `createPayment()` | Loads `getPaymentRuntimeConfig({ workspaceId })`; default active provider comes from workspace runtime config unless explicit provider is passed. | Updated. |
| `createPaymentSessionForOrder()` | Loads `getPaymentRuntimeConfig({ workspaceId })`; active provider is explicit provider or workspace runtime provider. | Updated. |
| `GET /payments/gateway/config` | Returns `runtime.provider`, `runtime.environment`, and `runtime.configured` directly. | Updated. |
| Settings source | `workspaces.settings.metadata.app_settings.provider` and provider-specific encrypted credentials. | Authority. |

## Remaining Gaps

| Gap | Risk | Follow-up |
|---|---|---|
| Direct Xendit route remains provider-specific and env-backed. | Medium: generic workspace provider route is safer, but legacy explicit route should be reviewed. | AISG-T052/AISG-T080. |
| Xendit adapter uses env secret config. | Medium: provider selection is workspace-based in generic flow, but Xendit credentials are not fully workspace-config adapter inputs yet. | AISG-T052/AISG-T053. |
| Telegram/WhatsApp button payment link failure falls back to manual. | High for AISG-R66. | AISG-T055. |
| Provider amount/currency/expiry snapshots incomplete. | Medium. | AISG-T053. |
| PAID reachability proof not complete. | High. | AISG-T054/AISG-T076. |

## Validation

Added `server/test/security/ai/payment-provider-authority.test.js` to prevent generic payment paths from falling back to `env.paymentProvider` for provider selection.

## Conclusion

Workspace payment settings are now the authority for generic payment provider selection. Remaining provider-specific and fallback behavior is documented for later AISG payment tasks.
