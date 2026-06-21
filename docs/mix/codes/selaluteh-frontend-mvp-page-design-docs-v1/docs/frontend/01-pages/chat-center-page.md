# Chat Center Page Design Specification

## 1. Purpose

Chat Center mempertahankan kekuatan CRM lama: inbox multi-channel, AI assistant, human takeover, contact context, dan direct reply. Untuk marketplace MVP, Chat Center juga harus menampilkan outlet, active cart/order, dan payment context.

## 2. Route and module

```txt
Route: /app/chats or existing /app route compatibility
Page: web/src/modules/chats/pages/ChatCenterPage.jsx
API: web/src/modules/chats/api/chatsApi.js
Components: web/src/modules/chats/components/*
```

Preserve existing route behavior until migration is complete.

## 3. Desktop layout

Use a three-pane operational layout:

```txt
Chat list | Conversation | Context panel
```

Recommended width behavior:

- chat list: 300–360px;
- conversation: flexible main area;
- context panel: 320–380px;
- context panel can collapse.

## 4. Chat list pane

### Header

```txt
Chat
Search
Filter button
```

### Filters

```txt
Outlet
Channel
Assignment
Status
Unread only
Escalated
Date range
Tags
```

Filter values:

- All allowed outlets;
- Telegram, WhatsApp, Instagram;
- Assigned to me, Unassigned, AI handling, Human takeover;
- Open, Resolved;
- Unread;
- Escalated.

### Chat row

Show:

- contact avatar/initial;
- contact name/handle;
- platform icon;
- outlet name or `Outlet not selected`;
- last message preview;
- timestamp;
- unread badge;
- assignment/takeover indicator;
- optional order/payment status badge when relevant.

Sort default:

```txt
last_message_at descending
```

## 5. Conversation pane

### Header

Show:

```txt
Contact name
Channel
Outlet context
AI / Human handling status
Assigned agent
```

Actions:

- Take Over / Return to AI, based on permission;
- Resolve / Reopen;
- More actions;
- optional call/open channel action if supported.

### Message timeline

Support existing behavior:

- user messages;
- AI messages;
- human messages;
- system events;
- attachments;
- reply-to preview;
- date separators;
- delivery/sending/error state where provider supports it.

System events examples:

```txt
AI started handling
Rido took over this conversation
Outlet selected: Selkop Samarinda
Order #ORD-1028 created
Payment link sent
Payment received
Conversation resolved
```

### Composer

Features:

- multiline text;
- send;
- attachment if existing backend supports;
- reply-to;
- optional canned response/P1;
- disable with clear reason if channel disconnected;
- disable when user lacks access.

Do not let AI and human send simultaneously without visible handling state.

## 6. Context panel

Use tabs or sections, not an overloaded single scroll.

Recommended sections:

### Contact

```txt
Name
Phone/handle
Channel identity
Tags
Notes
First/last contact
```

### Commerce

```txt
Selected outlet
Active cart
Latest order
Payment status
```

Actions:

- View cart — only if backend supports session/cart inspect;
- Open order;
- Copy/resend payment link when valid;
- Change outlet only before cart/order lock and with explicit confirmation.

### AI and assignment

```txt
Assigned AI agent
Human takeover user
Escalation reason
Conversation status
```

### History

- recent orders;
- complaints;
- optional previous conversations.

## 7. Outlet context rules

- A chat may begin without outlet selection.
- Once customer selects outlet, show it prominently.
- A cart belongs to one outlet.
- If active cart/order exists, changing outlet must not happen silently.
- Opening a chat does not globally change admin outlet selector unless explicitly chosen.
- Admin may view chat outlet context even when page global filter is `All Outlets`.

## 8. Human takeover states

### AI handling

- `Take Over` action available to authorized human.
- AI status visible.

### Human takeover

- display assigned human;
- AI must stop sending;
- composer enabled for assigned/authorized human;
- other agents may be read-only depending on policy.

### Escalated

- prominent but non-alarming indicator;
- reason if available;
- quick take-over action.

### Resolved

- composer disabled or requires Reopen;
- preserve full message history.

## 9. Existing API contracts to preserve

```http
GET  /chats
GET  /chats/:chatId/messages
POST /chats/:chatId/send
POST /chats/:chatId/takeover
POST /chats/:chatId/resolve
DELETE /chats/:chatId
```

List query should support:

```txt
unreadOnly
agentId
assignment
date range
tags
search
status
outletId
channel
```

Messages must be ordered ascending and workspace validated.

## 10. Polling and refresh

Current app uses polling. Preserve behavior during MVP refactor.

Rules:

- prevent overlapping requests;
- retain selected chat;
- do not jump scroll while user reads history;
- append new messages safely;
- show reconnect/error state;
- future WebSocket/SSE upgrade is optional, not part of this design task.

## 11. Empty/loading/error states

### No conversations

```txt
No conversations yet
New customer conversations will appear here after a connected channel receives a message.
[Open Connected Platforms]
```

### No selection

```txt
Select a conversation to start
```

### Channel disconnected

Show banner with `Open Connected Platforms` action.

### Send failure

- failed bubble state;
- retry where safe;
- do not duplicate message on retry.

## 12. Permissions

- Owner/Super: all workspace chats and allowed outlets.
- Human agent: assigned/allowed chats according to existing role contract.
- Outlet-restricted user: only chats belonging to assigned outlets, plus unassigned chats only when policy allows assignment.
- Delete chat should be privileged and confirmed.

## 13. Required components

```txt
ChatCenterPage.jsx
ChatList.jsx
ChatListItem.jsx
ChatFilters.jsx
ChatPanel.jsx
ChatHeader.jsx
MessageTimeline.jsx
MessageBubble.jsx
SystemEventMessage.jsx
MessageComposer.jsx
TakeoverButton.jsx
ChatContextPanel.jsx
ChatCommerceContext.jsx
ContactPanel.jsx
QuickActions.jsx
```

## 14. Acceptance criteria

- Existing chat, messages, reply-to, takeover, resolve, and send still work.
- Outlet and channel context are visible.
- Active order/payment can be opened from context panel.
- AI stops on takeover.
- Unread count and sorting remain correct.
- Polling does not create duplicate messages.
- Unauthorized outlet chats are not shown.
- Mobile switches cleanly between list, conversation, and context.
