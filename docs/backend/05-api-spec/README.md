# 05 API Spec — Backend API Documentation

Folder ini berisi kontrak API backend untuk project **SelaluTeh Chatbot CRM / KALIS.AI** yang akan berkembang menjadi **Telegram-first Marketplace MVP**.

API spec ini menyesuaikan arah terbaru sistem:

```txt
Existing Chatbot CRM
+ Telegram webhook
+ AI agents
+ Human takeover
+ Supabase/Postgres target schema
+ Local file storage
+ Product catalog
+ Cart
+ Checkout
+ Payment gateway sandbox
+ Payment webhook
```

## Scope Folder

Folder ini hanya menjelaskan **kontrak endpoint/API**:

- request method
- route path
- authentication
- request body
- response body
- error behavior
- state changes
- idempotency behavior

Detail yang **tidak** ditaruh di folder ini:

| Topic | Folder yang benar |
|---|---|
| Database schema, RLS, indexes | `06-data/` |
| User/business process flow | `02-flows/` |
| Business rules/status rules | `03-business-rules/` |
| Security deep dive | `08-security/` |
| Test plan | `10-testing/` |
| Sprint/roadmap | `11-sprint/` |

## API Groups

| File | Purpose |
|---|---|
| `overview.md` | API conventions, auth, pagination, idempotency |
| `error-format.md` | Standard error response format |
| `auth-api.md` | Register, verify OTP, login, reset password |
| `users-api.md` | Workspace users and human agents |
| `platforms-api.md` | Telegram/WhatsApp/Instagram platform connections |
| `agents-api.md` | AI agent configuration and testing |
| `chats-api.md` | Inbox, messages, human send, takeover |
| `contacts-api.md` | Customer contact management |
| `products-api.md` | Marketplace product catalog |
| `carts-api.md` | Cart and cart item operations |
| `checkout-api.md` | Checkout and pending order creation |
| `orders-api.md` | Order management and order status |
| `payments-api.md` | Payment link, payment status, provider webhook integration |
| `webhooks-api.md` | Telegram/Meta/payment webhook contracts |
| `telegram-commerce-api.md` | Telegram button/callback API contract |
| `ai-actions-api.md` | AI-proposed action validation/execution |
| `complaints-api.md` | Complaint management |
| `files-api.md` | Local file metadata and media upload/access |
| `analytics-api.md` | Dashboard analytics endpoints |
| `jobs-api.md` | Internal jobs/worker control contracts |
| `settings-api.md` | Workspace settings and AI provider preference |
| `integrations-api.md` | Provider integration actions such as Telegram setWebhook and payment provider test |
| `api-versioning.md` | API versioning strategy |
| `rate-limits.md` | Rate limiting and abuse protection |

## Base URL

Development:

```txt
http://localhost:5000
```

Production:

```txt
https://api.your-domain.example
```

Recommended versioned prefix for new APIs:

```txt
/api/v1
```

Legacy routes may continue without `/api/v1` during migration, but new marketplace endpoints should use `/api/v1`.
