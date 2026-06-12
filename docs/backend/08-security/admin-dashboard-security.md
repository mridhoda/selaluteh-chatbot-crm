# Admin Dashboard Security

## Dashboard Risks

- unauthorized access to all chats/orders;
- token/secret exposure in UI;
- unsafe file preview;
- XSS from customer messages;
- agent role seeing owner-only settings.

## UI Data Rules

Frontend must not receive:

```txt
password_hash
full platform token
full payment secret
service role key
raw AI provider key
private file absolute path
```

## XSS Protection

Customer messages are untrusted.

Frontend must:

- render text safely;
- sanitize rich text/HTML if ever supported;
- avoid `dangerouslySetInnerHTML`;
- validate file preview types;
- prevent scriptable SVG/HTML previews unless sanitized.

## Role-Based UI

Hide and enforce backend protection for:

| Area | Role |
|---|---|
| User management | owner/super |
| Platform token settings | owner/super |
| Payment provider settings | owner only/super if allowed |
| Product CRUD | owner/super |
| Chat inbox | owner/super/agent based assignment |
| Orders | owner/super/agent limited |

UI hiding is not security. Backend must enforce permissions.

## Session Handling

- store tokens carefully;
- avoid logging token;
- logout should clear client token;
- consider token expiration/refresh later;
- force logout after JWT secret rotation.
