# Meta Platform Security

## Applies To

```txt
WhatsApp Cloud API
Instagram Messaging
Facebook/custom Meta webhooks if added
```

## Verification

Meta webhook setup uses a verify token. Production POST requests should also verify signature using app secret where available.

## Token Storage

Meta access tokens, app secrets, phone number ids, and account ids are sensitive.

Rules:

- store raw tokens backend-only;
- do not expose to frontend;
- show configured/not configured status;
- rotate when leaked;
- restrict platform management to owner/super.

## Message Processing

- Deduplicate provider message ids.
- Validate account/page/phone id maps to correct platform/workspace.
- Store raw payload only if needed and with retention limit.
- Download media through backend and store metadata in `files`.

## Human Takeover

When human takeover is active:

```txt
AI must not auto-reply
human message sender must be authenticated
platform send result should update platform_message_id
```
