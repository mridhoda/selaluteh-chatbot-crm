# Complaint Rules

## Purpose

Defines complaint creation, status, assignment, and resolution rules.

## Complaint Source

Complaint can come from:

```txt
AI marker / AI action
admin manual creation
customer message classification
```

## Required Fields

Complaint must include:

```txt
workspace_id
chat_id nullable
contact_id nullable
agent_id nullable
platform_type nullable
text or form_data
status
```

## Complaint Status

Recommended statuses:

```txt
open
in_review
resolved
dismissed
```

Old status mapping:

```txt
open -> open
resolved -> resolved
dismissed -> dismissed
```

## Creation Rules

Complaint can be created when:

- user explicitly complains
- AI detects complaint and backend validates
- admin creates from chat
- order/payment issue requires follow-up

AI should not create duplicate complaint for same issue repeatedly.

## Workspace Scope

Complaints must be workspace-scoped and auth-required for admin list/update/delete.

Public access to complaints API is forbidden.

## Resolution Rules

Resolving a complaint should require:

- status change to `resolved`
- resolution note if implemented
- resolver user id if implemented

Dismissed complaint should have reason.

## Relationship to Chat

Complaint may set:

```txt
chat.is_escalated = true
```

or trigger human takeover request.

Resolving complaint does not automatically resolve chat unless configured.

## Relationship to Order

If complaint is about an order, future schema may include:

```txt
complaints.order_id
```

MVP can keep order reference in `form_data`, but normalized `order_id` is recommended once order module stabilizes.

## Sensitive Complaint Rule

For payment, refund, abusive content, safety, or legal issue:

- escalate to human
- do not let AI finalize resolution alone
- preserve audit trail
