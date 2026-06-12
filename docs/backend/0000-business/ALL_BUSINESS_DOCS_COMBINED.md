---

# FILE: README.md

# 0000 Business

Folder ini berisi dokumen bisnis untuk **SelaluTeh Chatbot CRM — Telegram Marketplace MVP**.

Dokumen ini menjawab sisi bisnis dari project:

- Kenapa produk ini perlu dibuat?
- Siapa target customer?
- Masalah apa yang diselesaikan?
- Model bisnisnya apa?
- Pricing-nya bagaimana?
- Bagaimana validasi MVP?
- Risiko bisnisnya apa?
- Kompetitor seperti apa?
- Bagaimana go-to-market?
- KPI bisnis apa yang harus dilacak?

## Product Direction

Project saat ini berangkat dari **Chatbot CRM** yang sudah punya:

- Telegram chatbot/webhook.
- AI agent.
- Inbox/chat dashboard.
- Human takeover.
- Contact management.
- Legacy orders/complaints.

Arah bisnis terbaru:

```txt
Chat-first commerce platform for small businesses
starting with Telegram-first single-merchant marketplace MVP.
```

## Folder Boundary

Isi folder ini adalah **business strategy**.

Jangan taruh:

- API endpoint detail → `05-api-spec`
- database schema → `06-data`
- technical architecture → `04-tech-spec`
- sprint/task execution → `11-sprint`
- security implementation → `08-security`

## Recommended Reading Order

1. `brd.md`
2. `business-model.md`
3. `value-proposition.md`
4. `customer-segments.md`
5. `market-positioning.md`
6. `competitor-analysis.md`
7. `pricing-strategy.md`
8. `revenue-model.md`
9. `unit-economics.md`
10. `go-to-market.md`
11. `mvp-validation-plan.md`
12. `business-metrics.md`
13. `business-risks.md`
14. `roadmap-business.md`


---

# FILE: brd.md

# Business Requirements Document

## 1. Business Context

Many small businesses already use chat apps as their main sales and support channel. Customers often ask product questions through chat, but the actual purchase process still requires manual admin work:

- Admin answers product availability.
- Admin sends product price manually.
- Admin asks quantity manually.
- Admin sends payment instruction manually.
- Admin checks payment manually.
- Admin updates order manually.

This creates slow response time, missed orders, inconsistent data, and difficulty tracking conversion.

## 2. Business Problem

The business problem:

```txt
Chat has become the storefront, but most small businesses still manage chat commerce manually.
```

Current pain points:

- Conversations are not connected to structured orders.
- AI/chatbot can answer questions but does not complete transactions.
- Payment confirmation is manual or disconnected.
- Admin does not have a single operational view for chat, order, and payment.
- Business cannot measure product interest, checkout conversion, and abandoned carts.

## 3. Proposed Solution

Build a Telegram-first commerce MVP on top of the existing chatbot CRM.

The system should allow customers to:

```txt
open Telegram bot
→ browse products
→ add to cart
→ checkout
→ receive payment link
→ pay
→ receive confirmation
```

Admin should be able to:

```txt
manage products
→ view chats
→ handle human takeover
→ monitor orders
→ verify payment status
→ resolve complaints
```

## 4. MVP Objective

The MVP objective is to prove that a chat-first product flow can become a real transaction flow.

The MVP should prove:

- Telegram can be used as a storefront interface.
- Product/cart/checkout flow can be deterministic.
- Payment gateway sandbox can update order state automatically.
- Existing CRM inbox remains useful for support.
- AI can assist without controlling critical payment/order state.

## 5. In Scope

- Telegram-first single-merchant commerce.
- Product catalog.
- Cart and cart item.
- Checkout confirmation.
- Payment link via sandbox provider.
- Payment webhook.
- Admin product/order management.
- AI shopping assistant.
- Human takeover.
- Workspace-scoped CRM operations.

## 6. Out of Scope

- Multi-seller marketplace.
- Seller wallet.
- Seller payout.
- Commission engine.
- Logistics integration.
- Refund automation.
- Voucher/promo engine.
- Native mobile app.
- Public customer web storefront.
- Native WhatsApp payment.

## 7. Business Requirements

| ID | Requirement | Priority |
|---|---|---|
| BR-001 | Customer can browse products from Telegram | P0 |
| BR-002 | Customer can add product to cart | P0 |
| BR-003 | Customer can checkout from Telegram | P0 |
| BR-004 | Customer can receive payment link | P0 |
| BR-005 | Payment webhook updates order status | P0 |
| BR-006 | Admin can manage products | P0 |
| BR-007 | Admin can view orders and payment status | P0 |
| BR-008 | Admin can take over chat from AI | P0 |
| BR-009 | AI can answer product questions | P1 |
| BR-010 | Admin can see basic conversion metrics | P1 |

## 8. Success Criteria

MVP is successful if:

```txt
At least one complete demo order can be created and paid through Telegram using sandbox payment.
```

Required demo outcome:

- Product listed in Telegram.
- Cart created.
- Checkout confirmed.
- Payment link generated.
- Payment webhook processed.
- Order marked paid.
- Admin sees the paid order.


---

# FILE: business-model.md

# Business Model

## Business Model Type

Recommended business model:

```txt
B2B SaaS for chat-first commerce and AI CRM.
```

The product helps small businesses sell and support customers through messaging platforms.

## Target Customer

Initial target:

```txt
Single-merchant small businesses that already sell through chat.
```

Examples:

- Coffee shops.
- Food and beverage brands.
- Local product sellers.
- Home businesses.
- Small retail stores.
- Instagram/Telegram-based sellers.
- Local service businesses with order intake.

## Core Offering

The product offers:

```txt
AI CRM + Conversational Commerce Backend
```

Core capabilities:

- Unified inbox.
- AI agent.
- Human takeover.
- Product catalog.
- Telegram commerce.
- Checkout.
- Payment link.
- Order/payment tracking.

## Monetization Options

### Option 1 — Subscription SaaS

Charge monthly per business/workspace.

Example tiers:

- Free.
- Starter.
- Pro.
- Business.

### Option 2 — Usage-Based Add-on

Charge based on:

- AI messages.
- Connected platforms.
- Team members.
- Orders processed.
- Storage/media usage.

### Option 3 — Transaction Add-on

Small percentage or fixed fee per successful order.

This should be used carefully because payment gateways already charge fees.

### Option 4 — Setup Service

Charge one-time setup fee for business onboarding.

Useful for early customers who need help connecting Telegram/WhatsApp and configuring product catalog.

## Recommended MVP Business Model

For early MVP:

```txt
Subscription first + optional setup service.
```

Avoid transaction fee initially unless unit economics require it.

## Suggested Early Tiers

| Tier | Target | Core Limits |
|---|---|---|
| Free | Testing/demo | 1 platform, limited messages, limited products |
| Starter | Small business | Telegram commerce, basic AI, basic orders |
| Pro | Growing business | More messages, WhatsApp/Instagram, analytics |
| Business | Larger team | Multiple agents, higher quota, priority support |

## Business Model Risks

- Small businesses may not want another SaaS subscription.
- They may prefer free WhatsApp/manual workflow.
- AI cost can reduce margin.
- Support/onboarding can become labor-intensive.
- Payment provider integration may require business verification.

## Business Model Validation

Validate willingness to pay by testing:

- Would business pay monthly for automated chat checkout?
- Would business pay setup fee?
- Which feature triggers payment intent: AI, order tracking, payment automation, or inbox?
- What price feels acceptable for small merchants?


---

# FILE: value-proposition.md

# Value Proposition

## Core Value Proposition

```txt
Turn customer chats into structured orders and payments without losing the human touch.
```

## For Business Owners

### Pain

- Too many repetitive chat questions.
- Manual order taking.
- Manual payment follow-up.
- Hard to know which chats became sales.
- Customers ask outside working hours.
- Admin misses messages.

### Value

- AI answers common questions.
- Telegram bot can show products.
- Customer can add to cart.
- Backend creates structured order.
- Payment link is sent automatically.
- Admin sees chats, orders, and payment status in one dashboard.

### Promise

```txt
Sell from chat faster, track orders better, and reduce manual admin work.
```

## For Customers

### Pain

- Waiting for admin reply.
- Asking price/availability repeatedly.
- Confusing payment instructions.
- No clear order confirmation.

### Value

- Browse products from Telegram.
- Add to cart with buttons.
- Receive order summary.
- Pay through link.
- Get confirmation automatically.

### Promise

```txt
A faster and clearer chat shopping experience.
```

## For Human Agents

### Pain

- AI sometimes cannot solve complex issue.
- Customer context scattered.
- Hard to know current order/payment status.

### Value

- Human takeover.
- Chat history.
- Contact profile.
- Order/payment context.

### Promise

```txt
Support customers with full context, not blind replies.
```

## Differentiation

Compared to basic chatbot tools:

- Not only answering questions.
- It creates product/cart/order/payment flows.

Compared to basic ecommerce websites:

- Chat is the interface.
- CRM support is built in.

Compared to manual chat sales:

- Structured data and payment tracking.

## Messaging Pillars

1. Chat becomes checkout.
2. AI handles repetitive questions.
3. Admin keeps full control.
4. Payment status is automated.
5. Customers get clearer buying flow.


---

# FILE: customer-segments.md

# Customer Segments

## Primary Segment: Chat-Based Small Merchants

Businesses that already sell through WhatsApp, Instagram DM, or Telegram.

### Characteristics

- Small team.
- High dependency on chat.
- Manual order taking.
- Product catalog is simple to medium.
- Payment is usually bank transfer/QRIS/payment link.
- Admin handles both sales and support.

### Examples

- Coffee shops.
- Local food brands.
- Home bakery.
- Skincare reseller.
- Local merchandise.
- Beverage brands.
- Small grocery/order-based sellers.

### Key Pain

```txt
They already get orders from chat, but the process is manual and hard to track.
```

### Buying Trigger

- Too many repetitive messages.
- Missed orders.
- Need faster response.
- Need order/payment tracking.
- Want AI but still need admin control.

## Secondary Segment: Service Businesses

Businesses that collect booking/order details through chat.

Examples:

- Laundry.
- Cleaning service.
- Repair service.
- Small clinics or salons.
- Course/training providers.

Needs:

- Form-like order collection.
- Customer support.
- Payment link.
- Appointment/status flow.

## Future Segment: Multi-Branch Businesses

Businesses with multiple outlets or teams.

Examples:

- Coffee chain.
- Franchise.
- Regional stores.
- Multi-agent support team.

Needs:

- Multiple agents.
- Multi-platform inbox.
- Outlet routing.
- Analytics.
- Role/permission management.

## Not Ideal Early Segment

Avoid early focus on:

- Large enterprises.
- Complex marketplaces.
- Businesses with custom ERP requirements.
- Businesses needing advanced inventory/warehouse.
- Businesses needing native app.
- High-regulation industries.

## Early Adopter Profile

Best early adopter:

```txt
Owner-operated business that currently sells manually through chat and is willing to test Telegram bot commerce.
```

Signals:

- Has product list.
- Has daily customer chats.
- Uses QRIS/payment transfer.
- Wants automation.
- Can tolerate MVP limitations.


---

# FILE: market-positioning.md

# Market Positioning

## Positioning Statement

For small businesses that sell through chat, SelaluTeh Chatbot CRM provides an AI-powered conversational commerce backend that connects customer chat, product catalog, checkout, payment, and human support in one operational dashboard.

## Category

Recommended category:

```txt
Conversational Commerce CRM
```

Alternative labels:

- AI Chat Commerce Platform.
- Chatbot CRM for Small Business.
- Telegram/WhatsApp Commerce Assistant.
- AI Sales Inbox.

## Positioning Against Alternatives

### Against Manual Chat Sales

Manual chat sales is flexible but inefficient.

Positioning:

```txt
Keep chat personal, but automate repetitive sales steps.
```

### Against Ecommerce Website Builders

Website builders require customers to leave the chat context.

Positioning:

```txt
Let customers buy where they already chat.
```

### Against Basic Chatbot Tools

Basic chatbots answer questions but often cannot complete transaction flow.

Positioning:

```txt
Not just a chatbot — chat, cart, checkout, and payment.
```

### Against Full CRM Tools

Traditional CRM can be too heavy for small businesses.

Positioning:

```txt
A lightweight CRM built around real chat operations.
```

## Brand Position

The product should feel:

- Practical.
- Fast to set up.
- Helpful.
- Friendly.
- Reliable.
- Business-oriented but not enterprise-heavy.

## Core Message

```txt
Turn Telegram chats into paid orders.
```

Secondary messages:

- AI answers, admin controls.
- Product catalog inside chat.
- Payment link automation.
- One inbox for chat and orders.
- Built for small business selling through chat.

## Market Entry Position

Start narrow:

```txt
Telegram-first commerce for small merchants.
```

Then expand:

```txt
Multi-platform AI commerce CRM.
```


---

# FILE: competitor-analysis.md

# Competitor Analysis

## Competitor Categories

This product sits between several categories:

1. Chatbot builders.
2. CRM inbox tools.
3. Ecommerce platforms.
4. Payment link tools.
5. WhatsApp/Telegram automation tools.
6. AI customer service tools.

## Category Comparison

| Category | Strength | Weakness | Opportunity |
|---|---|---|---|
| Chatbot Builder | Easy automation | Often not commerce-native | Add real cart/checkout/payment |
| CRM Inbox | Good support workflow | Not transaction-first | Connect chat to order/payment |
| Ecommerce Platform | Strong catalog/order | Not chat-first | Use chat as storefront |
| Payment Link Tool | Easy payment | No chat/order context | Embed payment in chat flow |
| AI CS Tool | Good response automation | Can hallucinate or lack transaction state | AI assists, backend validates |

## Direct/Indirect Competitor Examples

Potential references:

- Cekat.ai-style chat CRM.
- WhatsApp business automation tools.
- Shopify/WooCommerce for ecommerce.
- Midtrans/Xendit payment link flow.
- Telegram bot storefront scripts.
- AI support/chatbot products.

## Differentiation

SelaluTeh Chatbot CRM should differentiate by combining:

```txt
AI Agent
+ CRM Inbox
+ Human Takeover
+ Telegram Commerce Flow
+ Product/Cart/Checkout
+ Payment Webhook
```

## Competitive Moat Opportunities

### 1. Workflow Integration

The moat is not only AI. It is business workflow:

```txt
chat → order → payment → support
```

### 2. Local Business Fit

Focus on local payment and chat habits.

### 3. Fast Setup

Small business should be able to launch quickly.

### 4. AI with Guardrails

AI should be useful but safe. Backend owns transaction state.

### 5. CRM + Commerce Context

Human agents see chat history and order/payment state together.

## Competitive Risk

- Large CRM/chatbot platforms can add checkout.
- Ecommerce platforms can add chat automation.
- Payment providers can add ordering tools.
- Telegram bot builders can offer simpler templates.

## Defensive Strategy

- Start with one vertical or local use case.
- Build excellent onboarding.
- Keep UX simple.
- Integrate payment and chat deeply.
- Track conversion analytics early.


---

# FILE: pricing-strategy.md

# Pricing Strategy

## Pricing Goal

Pricing should be simple enough for small businesses but flexible enough to support AI/payment/message costs.

## Recommended Pricing Model

```txt
Subscription tiers + usage limits + optional setup fee
```

## Suggested Tiers

### Free / Demo

Purpose:

- Let users test chatbot CRM and Telegram commerce basics.

Limits:

- 1 workspace.
- 1 platform.
- Limited products.
- Limited AI replies.
- Limited orders.

### Starter

Target:

- Small merchants testing chat commerce.

Includes:

- Telegram bot commerce.
- Product catalog.
- Cart/checkout.
- Basic AI assistant.
- Basic dashboard.
- Payment link integration.

### Pro

Target:

- Growing businesses.

Includes:

- Higher AI/message quota.
- More products.
- More users/agents.
- WhatsApp/Instagram integration.
- Analytics.
- Export.

### Business

Target:

- Multi-team or higher-volume merchants.

Includes:

- Priority support.
- Higher limits.
- Advanced analytics.
- Multiple connected channels.
- Custom onboarding.

## Pricing Dimensions

Possible pricing levers:

- Number of connected platforms.
- Number of AI messages.
- Number of orders.
- Number of team members.
- Number of products.
- Storage/media usage.
- Advanced analytics.
- Payment automation.
- Support level.

## Recommended Early Pricing Experiment

Do not over-optimize price before validation.

Test:

| Plan | Price Hypothesis |
|---|---|
| Starter | low monthly price for small merchants |
| Pro | higher monthly price with WhatsApp/Instagram and analytics |
| Setup Service | one-time onboarding fee |

## Pricing Risks

- AI costs may exceed subscription revenue.
- Small merchants may be price-sensitive.
- Free plan can attract non-paying users.
- Transaction fee can discourage adoption.
- Support burden may be high for low-tier users.

## Pricing Guardrails

- Track cost per workspace.
- Track AI cost per merchant.
- Track support time per merchant.
- Add quota before costs grow.
- Avoid unlimited AI in cheap tier.


---

# FILE: revenue-model.md

# Revenue Model

## Revenue Streams

### 1. Monthly Subscription

Primary revenue stream.

Benefits:

- Predictable revenue.
- Simple to understand.
- Fits SaaS model.

### 2. Setup / Onboarding Fee

Useful for early customers.

Covers:

- Telegram bot setup.
- Product import.
- Payment provider setup.
- AI agent configuration.
- Admin training.

### 3. Usage-Based Fees

Potential future revenue.

Based on:

- AI messages.
- Orders processed.
- Extra storage.
- Additional connected platforms.
- Additional users/agents.

### 4. Transaction Fee

Optional future model.

Could be:

- Fixed fee per paid order.
- Percentage fee per transaction.

Use carefully because payment gateway already charges fees.

### 5. Custom Business Plan

For bigger merchants needing:

- More support.
- Multiple channels.
- Custom integration.
- SLA.

## Recommended MVP Revenue Model

For MVP:

```txt
Starter subscription + setup fee.
```

Avoid complicated transaction pricing until payment volume and cost are known.

## Revenue Formula

Basic monthly revenue:

```txt
MRR = active paying workspaces × average revenue per workspace
```

If setup fee exists:

```txt
Monthly revenue = MRR + setup fees collected in month
```

If usage fees exist:

```txt
Revenue = subscription + usage add-ons + setup fees
```

## Cost Drivers

- AI provider cost.
- Message platform costs.
- Server hosting.
- Database hosting.
- Storage and bandwidth.
- Payment provider fees.
- Support/onboarding time.
- Maintenance/development cost.

## Revenue Validation

Validate:

- Will merchants pay monthly?
- What feature triggers payment?
- Is setup fee acceptable?
- Does AI increase willingness to pay?
- Does payment automation increase willingness to pay?


---

# FILE: unit-economics.md

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


---

# FILE: business-metrics.md

# Business Metrics

## Metric Categories

Track metrics across:

1. Acquisition.
2. Activation.
3. Engagement.
4. Conversion.
5. Revenue.
6. Retention.
7. Support/operations.

## Acquisition Metrics

- Website visitors.
- Demo requests.
- Signup count.
- Workspace created.
- Telegram bot connected.
- Product catalog created.

## Activation Metrics

Activation means the merchant reaches useful setup.

Activation milestones:

- Workspace created.
- Telegram platform connected.
- AI agent configured.
- At least one product active.
- First Telegram test message received.
- First cart created.
- First checkout created.

## Customer Commerce Metrics

| Metric | Meaning |
|---|---|
| Product views | Customer interest |
| Add to cart | Purchase intent |
| Checkout started | Strong purchase intent |
| Payment link generated | Checkout completion |
| Payment completed | Revenue/order success |
| Abandoned cart | Drop-off |
| Repeat customers | Retention |

## Admin Operation Metrics

- Orders per day.
- Paid orders.
- Cancelled orders.
- Complaints created.
- Human takeover count.
- Average first response time.
- AI response count.
- AI escalation count.

## SaaS Business Metrics

- Active workspaces.
- Paying workspaces.
- MRR.
- ARPU.
- Churn.
- Upgrade rate.
- Trial-to-paid conversion.
- Support tickets per workspace.

## MVP Dashboard Metrics

Minimum MVP metrics:

- Total chats.
- Total products.
- Total carts.
- Total checkouts.
- Total orders.
- Total paid orders.
- Payment conversion rate.
- Human takeover count.
- AI escalation count.

## Conversion Funnel

```txt
Telegram start
→ product list viewed
→ product detail viewed
→ add to cart
→ checkout confirmed
→ payment link opened
→ payment success
```


---

# FILE: go-to-market.md

# Go-To-Market Strategy

## Initial GTM Strategy

Start with a narrow segment:

```txt
small merchants already selling through chat
```

Prioritize businesses where product catalog is simple and order flow is repetitive.

## Ideal First Customers

- Coffee shops.
- Beverage brands.
- Home bakery.
- Local food sellers.
- Small retail sellers.
- Telegram/Instagram sellers.

## Acquisition Channels

### Direct Outreach

- Message local business owners.
- Offer demo of Telegram order flow.
- Show admin dashboard.
- Offer setup help.

### Content

- Short videos showing:
  - Telegram product list.
  - Add to cart.
  - Payment link.
  - Admin order dashboard.
- Educational content:
  - "How to sell through Telegram bot."
  - "Why chat commerce reduces admin work."

### Partnerships

- Local payment gateway communities.
- Local business communities.
- Coffee/food communities.
- Small business consultants.

### Product-Led Demo

Build a demo Telegram bot:

```txt
Try buying sample product through bot.
```

This can demonstrate the value faster than a slide deck.

## GTM Message

Core message:

```txt
Turn your Telegram chats into paid orders.
```

Secondary messages:

- AI answers common customer questions.
- Customers can checkout without waiting for admin.
- Admin still controls everything.
- Payment status updates automatically.

## Sales Motion

Recommended early sales motion:

```txt
Founder-led sales + assisted onboarding
```

Steps:

1. Identify target merchant.
2. Show Telegram commerce demo.
3. Ask about current chat order workflow.
4. Offer setup.
5. Configure products and bot.
6. Run first test order.
7. Ask for feedback.
8. Convert to paid plan.

## Validation Goal

Before scaling GTM, validate:

- Merchants understand the value.
- Merchants can set up products.
- Customers can complete Telegram purchase.
- Payment link flow is trusted.
- Admin dashboard is useful.


---

# FILE: mvp-validation-plan.md

# MVP Validation Plan

## Objective

Validate whether small businesses want and can use Telegram-first commerce powered by CRM and AI.

## Validation Questions

### Problem Validation

- Do merchants currently receive orders through chat?
- Is manual order taking painful?
- Do they miss chats/orders?
- Do they need payment tracking?
- Do they want AI assistance?

### Solution Validation

- Is Telegram bot commerce understandable?
- Is product browsing through chat useful?
- Is cart/checkout via button acceptable?
- Is payment link acceptable?
- Does admin dashboard solve operational pain?

### Business Validation

- Will merchants pay monthly?
- Which price is acceptable?
- Is setup fee acceptable?
- Which feature drives buying decision?
- How many orders/messages justify payment?

## Validation Experiments

### Experiment 1 — Demo Bot Test

Build a demo bot with sample products.

Success:

- User completes sample order without instruction.
- Merchant understands flow in under 5 minutes.

### Experiment 2 — Merchant Interview

Interview 5–10 small merchants.

Questions:

- How do you receive orders today?
- What is the most repetitive chat task?
- How do you track payment?
- What tool do you currently use?
- Would you pay for this?

### Experiment 3 — Concierge MVP

Manually help 1–3 merchants set up bot/product catalog.

Success:

- They use it for real customer conversations.
- They request improvements.
- They are willing to continue using it.

### Experiment 4 — Pricing Test

Offer 2–3 pricing options.

Success:

- At least some merchants show willingness to pay.
- Objection patterns are documented.

## MVP Success Threshold

Minimum validation success:

- 3 merchants agree the problem is real.
- 1 merchant completes setup.
- 1 real or simulated order flow completed end-to-end.
- Payment link flow is accepted.
- Admin dashboard is considered useful.

## Validation Artifacts

Create:

- Interview notes.
- Merchant feedback.
- Demo recording.
- Conversion funnel data.
- List of requested features.
- Pricing objections.


---

# FILE: mvp-validation-scorecard.md

# MVP Validation Scorecard

Use this scorecard after each pilot/demo.

## Merchant Fit

| Question | Score 1-5 | Notes |
|---|---:|---|
| Merchant receives orders through chat today |  |  |
| Manual order taking is painful |  |  |
| Merchant has clear product list |  |  |
| Merchant understands Telegram bot flow |  |  |
| Merchant sees value in admin dashboard |  |  |

## Product Fit

| Question | Score 1-5 | Notes |
|---|---:|---|
| Customer can browse products easily |  |  |
| Add to cart is clear |  |  |
| Checkout summary is clear |  |  |
| Payment link feels trustworthy |  |  |
| Paid notification is useful |  |  |

## Business Fit

| Question | Score 1-5 | Notes |
|---|---:|---|
| Merchant willing to pay monthly |  |  |
| Merchant willing to pay setup fee |  |  |
| Merchant wants WhatsApp next |  |  |
| Merchant asks for advanced features |  |  |
| Merchant would recommend to others |  |  |

## Scoring Guide

| Average Score | Interpretation |
|---:|---|
| 1–2 | Weak fit |
| 3 | Possible fit but needs changes |
| 4 | Strong MVP signal |
| 5 | Very strong signal |

## Decision

After pilot:

```txt
Continue / Adjust / Pause / Pivot channel
```


---

# FILE: sales-discovery-questions.md

# Sales Discovery Questions

Use this when interviewing or selling to merchants.

## Current Workflow

1. How do customers usually order from you?
2. Which chat platform do you use most?
3. How many customer chats do you receive per day?
4. How do you send product information today?
5. How do you track orders?
6. How do you confirm payment?
7. What happens when admin is offline?

## Pain Discovery

1. What is the most repetitive question from customers?
2. Do you ever miss orders?
3. Do customers abandon purchase because reply is slow?
4. Do you have trouble tracking who has paid?
5. Do you need help with customer support?

## Product Fit

1. Would customers be comfortable ordering through Telegram bot?
2. Would product buttons help your customers?
3. Would payment link automation save time?
4. Would you still want human takeover?
5. What would make this unusable for you?

## Pricing Discovery

1. Would you pay monthly for this?
2. What price feels acceptable?
3. Would a setup fee be acceptable?
4. Which feature is most worth paying for?
5. What result would justify the cost?

## Closing Questions

1. Can we set up a pilot with your products?
2. Can we test with real or internal customers?
3. What must be ready before you use it?
4. Who else should review this?


---

# FILE: partnerships.md

# Partnerships

## Potential Partnership Types

### Payment Gateway Partners

Goal:

- Simplify payment link setup.
- Support sandbox and production onboarding.
- Provide merchant education.

Examples:

- Midtrans.
- Xendit.
- Local QRIS/payment facilitators.

### Local Business Communities

Goal:

- Access early adopters.
- Run demos.
- Collect feedback.

Examples:

- Coffee shop communities.
- Food/beverage communities.
- MSME/UMKM communities.
- Local seller groups.

### Agency/Consultant Partners

Goal:

- Help small businesses set up chatbot commerce.

Examples:

- Digital marketing agencies.
- Social media agencies.
- Local web developers.
- Business consultants.

### Platform/Integration Partners

Goal:

- Expand channels beyond Telegram.

Examples:

- WhatsApp Business API providers.
- Instagram automation providers.
- CRM and analytics tools.

## Partnership Value Proposition

For partners:

- New revenue/service offering.
- Faster merchant onboarding.
- Useful tool for small businesses.

For product:

- Customer acquisition.
- Trust.
- Setup support.
- Local market insight.

## Early Partnership Strategy

Start with informal partnerships:

- One payment provider sandbox.
- One local community.
- One service/agency partner.

Do not overcommit before MVP validation.

## Partnership Metrics

- Leads generated.
- Merchants onboarded.
- Activation rate.
- Paid conversion.
- Support workload.
- Partner referral quality.


---

# FILE: legal-business-notes.md

# Legal and Business Notes

> This document is not legal advice. It is a checklist of business/legal topics to review.

## Payment and Transaction Notes

If the system processes payment links or payment status, clarify:

- Payment provider terms.
- Merchant responsibility.
- Refund policy.
- Payment webhook data retention.
- Transaction records.
- Customer notification wording.

## Data Privacy Notes

The system stores:

- Customer platform ID.
- Customer name/handle.
- Chat messages.
- Order data.
- Payment status.
- Media attachments.

Business must define:

- Privacy policy.
- Data retention.
- Customer data deletion process.
- Access control.
- Backup policy.

## AI Disclosure

If AI replies to customers, consider whether the business should disclose:

```txt
Some replies may be generated by AI.
```

At minimum, admin should be able to take over conversations.

## Customer Terms

Terms should cover:

- Product availability.
- Price confirmation.
- Payment method.
- Order cancellation.
- Refund process.
- Delivery/pickup responsibility.
- Support channel.

## Platform Compliance

Telegram/Meta platform policies may apply.

Consider:

- Bot usage policies.
- Messaging consent.
- Spam/abuse prevention.
- User block/unsubscribe behavior.
- Webhook security.

## Business Registration

For production payment gateway use, merchant may need:

- Business identity.
- Bank account.
- Tax details depending provider/country.
- Payment provider KYC/KYB.

## Risk Notes

Avoid claiming:

- Payment is successful before provider confirms.
- Refund is guaranteed without admin/provider process.
- Product is available if backend marks inactive/out of stock.


---

# FILE: business-risks.md

# Business Risks

## Risk Categories

- Market risk.
- Adoption risk.
- Pricing risk.
- Operational risk.
- Competitive risk.
- Legal/compliance risk.
- Technical-business risk.

## Risk Register

| ID | Risk | Severity | Probability | Mitigation |
|---|---|---|---|---|
| B-001 | Merchants do not want Telegram-first commerce | High | Medium | Validate with interviews/demo |
| B-002 | Merchants prefer WhatsApp over Telegram | High | High | Start Telegram MVP but plan WhatsApp flow |
| B-003 | Merchants unwilling to pay monthly | High | Medium | Test setup fee and tiered pricing |
| B-004 | Setup/onboarding too manual | Medium | High | Create onboarding templates/import tools |
| B-005 | AI costs reduce margin | Medium | Medium | Add quotas, deterministic flow |
| B-006 | Competitors add similar checkout features | Medium | Medium | Focus on workflow depth and local fit |
| B-007 | Payment provider setup blocks merchant | Medium | Medium | Support manual/sandbox mode first |
| B-008 | Customer distrusts payment link | Medium | Medium | Use clear branding and provider link |
| B-009 | Scope creep delays MVP | High | High | Keep multi-seller out of MVP |
| B-010 | Support workload too high | Medium | Medium | Improve docs and self-serve setup |

## Major Business Risk

The biggest business risk:

```txt
The product solves a real workflow problem, but the first channel choice may not match merchant habits.
```

If merchants heavily prefer WhatsApp, Telegram MVP should still be used for fast technical validation, but roadmap should include WhatsApp commerce soon after.

## Risk Mitigation Strategy

1. Validate with real merchants early.
2. Do not overbuild multi-seller.
3. Keep setup simple.
4. Track conversion funnel.
5. Keep AI costs controlled.
6. Build admin workflow around real merchant feedback.


---

# FILE: roadmap-business.md

# Business Roadmap

## Phase 0 — Validation

Goal:

```txt
Confirm the problem and MVP value.
```

Activities:

- Merchant interviews.
- Demo bot.
- Concierge onboarding.
- Pricing feedback.
- Early risk discovery.

## Phase 1 — Telegram Commerce MVP

Goal:

```txt
Prove end-to-end transaction through Telegram.
```

Includes:

- Product catalog.
- Cart.
- Checkout.
- Payment link.
- Payment webhook.
- Admin order management.
- AI shopping assistant.

## Phase 2 — Paid Pilot

Goal:

```txt
Convert 1–3 merchants into paying or committed pilot users.
```

Includes:

- Setup service.
- Basic support.
- Product import.
- Merchant feedback loop.
- Basic analytics.

## Phase 3 — Multi-Channel Expansion

Goal:

```txt
Expand from Telegram-first to WhatsApp/Instagram commerce.
```

Includes:

- WhatsApp catalog/checkout adaptation.
- Instagram DM support improvement.
- Platform-specific consent/compliance.

## Phase 4 — Operational Depth

Goal:

```txt
Improve admin operations.
```

Includes:

- Better order fulfillment.
- Customer segmentation.
- Analytics.
- Follow-up automation.
- Complaint workflow.

## Phase 5 — Marketplace Expansion

Goal:

```txt
Explore multi-seller only after single-merchant model works.
```

Includes:

- Seller model.
- Seller dashboard.
- Commission.
- Payout.
- Review/rating.
- Disputes.

## Business Roadmap Rule

Do not move to Phase 5 until:

- Single merchant flow works.
- Payment is stable.
- Admin operations are clear.
- Merchant willingness to pay is validated.


---

# FILE: financial-assumptions.md

# Financial Assumptions

This document captures early financial assumptions for MVP planning.

## Revenue Assumptions

- Revenue starts from subscription or setup fee.
- Early pilot may be discounted or free.
- Paid conversion depends on clear operational value.
- AI automation and payment tracking are likely premium triggers.

## Cost Assumptions

Main costs:

- Hosting.
- Database.
- Local storage/backup.
- AI API usage.
- Development time.
- Support/onboarding time.
- Payment provider operational overhead.

## Early Cost Control

- Use deterministic button flows to reduce AI usage.
- Limit AI replies per plan.
- Keep media local.
- Avoid heavy analytics infrastructure early.
- Avoid building multi-seller too early.

## Pricing Hypothesis

Starter plan should be affordable for small businesses.

Pro plan should include:

- More usage.
- More connected platforms.
- More users.
- Analytics.
- Priority support.

## Break-Even Thinking

For each workspace:

```txt
monthly plan price > AI cost + hosting allocation + support cost allocation
```

If setup support is high, charge setup fee.

## Questions to Validate

- How many AI messages per merchant per month?
- How many orders per merchant per month?
- How much support time per merchant?
- What is acceptable subscription price?
- How many merchants are needed to cover fixed costs?


---

# FILE: business-decision-log.md

# Business Decision Log

Use this file to record business decisions.

## Format

```md
## YYYY-MM-DD — Decision Title

### Decision
...

### Context
...

### Options Considered
1. ...
2. ...

### Reason
...

### Impact
...

### Revisit When
...
```

## Initial Decisions

### Decision — Telegram First

Decision:

```txt
Build MVP on Telegram first.
```

Reason:

- Existing backend already supports Telegram webhook.
- Telegram inline buttons are good for deterministic commerce flow.
- Faster MVP testing than WhatsApp payment/commerce complexity.

Impact:

- WhatsApp commerce is deferred.
- MVP validation must account for Telegram adoption risk.

### Decision — Single Merchant First

Decision:

```txt
MVP is single-merchant, not multi-seller.
```

Reason:

- Multi-seller introduces payout, commission, seller dashboard, and dispute complexity.

Impact:

- Faster MVP.
- Marketplace expansion moved to later roadmap.

### Decision — AI as Assistant

Decision:

```txt
AI assists but backend owns transaction state.
```

Reason:

- Payment/order state must be deterministic and secure.

Impact:

- Need AI action guardrails.
- Cart/checkout/payment must be backend-driven.
