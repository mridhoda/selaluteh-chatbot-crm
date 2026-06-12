<!--
Tech Spec Pack: Telegram-first Marketplace Backend
Project: KALIS.AI / eskala-bot evolution
Target: Chatbot CRM + Telegram Marketplace MVP
Generated: 2026-06-11
-->

# Folder Structure

## Current Reality

The project currently has separate `server/` and `web/` folders. Keep this for MVP.

## Recommended Backend Structure

```txt
server/
  src/
    index.js

    config/
      env.js
      cors.js
      logger.js

    middleware/
      auth.js
      error-handler.js
      request-id.js
      rate-limit.js
      validate.js

    db/
      supabase.js
      mongo.js
      repositories/
        index.js
        users.repository.js
        workspaces.repository.js
        platforms.repository.js
        agents.repository.js
        contacts.repository.js
        chats.repository.js
        messages.repository.js
        products.repository.js
        carts.repository.js
        orders.repository.js
        payments.repository.js
        files.repository.js
        webhook-events.repository.js
        ai-actions.repository.js

    services/
      auth.service.js
      telegram.service.js
      meta.service.js
      ai.service.js
      ai-actions.service.js
      product.service.js
      cart.service.js
      checkout.service.js
      order.service.js
      payment.service.js
      notification.service.js
      storage.service.js
      followups.service.js
      webhook-idempotency.service.js

    routes/
      auth.js
      users.js
      platforms.js
      agents.js
      chats.js
      contacts.js
      products.js
      carts.js
      checkout.js
      orders.js
      payments.js
      complaints.js
      analytics.js
      settings.js
      integrations.js
      webhooks/
        index.js
        telegram.js
        meta.js
        payments.js

    validators/
      auth.schema.js
      products.schema.js
      carts.schema.js
      checkout.schema.js
      orders.schema.js
      payments.schema.js

    integrations/
      telegram/
        telegram-client.js
        telegram-keyboards.js
        telegram-parser.js
      meta/
        meta-client.js
        meta-parser.js
      payments/
        midtrans-client.js
        xendit-client.js
        payment-provider.types.js
      ai/
        openai-client.js
        gemini-client.js
        prompts/
          commerce-assistant.prompt.js
          support-agent.prompt.js

    workers/
      index.js
      ai-reply.worker.js
      notification.worker.js
      payment-reconcile.worker.js
      followup.worker.js

    utils/
      money.js
      dates.js
      ids.js
      message-splitter.js
      safe-json.js
      errors.js

  scripts/
    seed.js
    migrate-mongo-to-supabase/
      index.js
      dry-run.js
      validate.js
```

## Folder Responsibilities

| Folder | Responsibility |
|---|---|
| `config` | Environment and runtime config only |
| `middleware` | Express middleware |
| `db/repositories` | All database access |
| `services` | Business logic and orchestration |
| `routes` | Thin HTTP layer |
| `validators` | Request validation schemas |
| `integrations` | External provider clients/parsers |
| `workers` | Async processing jobs |
| `utils` | Pure helper functions |
| `scripts` | Maintenance, seed, migration |

## Route Should Stay Thin

Routes should only:

1. authenticate request
2. validate input
3. call service
4. return response

Avoid:

- direct SQL in routes
- direct Mongoose/Supabase in routes
- payment logic in routes
- AI prompt construction in routes

## Repository Layer Rule

Service code should call repositories, not database clients directly.

Example:

```js
const product = await productRepository.findById({ workspaceId, productId })
```

Not:

```js
const product = await supabase.from('products').select('*').eq('id', productId)
```

## Migration-Friendly Strategy

During migration, repositories can temporarily support both implementations:

```txt
repositories/products.repository.js
  -> Supabase implementation only for new marketplace tables

repositories/chats.repository.js
  -> Mongoose implementation first
  -> Supabase implementation after migration
```

This prevents a risky all-at-once rewrite.
