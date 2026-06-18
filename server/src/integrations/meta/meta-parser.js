export function getMetaObject(payload = {}) {
  return payload.object || '';
}

export function normalizeMetaPayload(payload = {}) {
  const object = getMetaObject(payload);
  const normalized = [];

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const value = change.value || {};
      if (object === 'whatsapp_business_account' && change.field === 'messages') {
        for (const message of value.messages || []) {
          normalized.push({
            provider: 'meta:whatsapp',
            platformAccountId: entry.id,
            phoneNumberId: value.metadata?.phone_number_id || null,
            senderId: message.from,
            eventType: message.type || 'message',
            externalEventId: message.id || `${message.from}:${message.timestamp}`,
            text: message.text?.body || '',
            message,
            value,
            raw: payload,
          });
        }
      }

      if (object === 'instagram') {
        for (const messaging of entry.messaging || []) {
          normalized.push({
            provider: 'meta:instagram',
            platformAccountId: entry.id,
            senderId: messaging.sender?.id,
            eventType: messaging.message?.attachments?.length ? 'attachment' : 'message',
            externalEventId: messaging.message?.mid || `${messaging.sender?.id}:${messaging.timestamp}`,
            text: messaging.message?.text || '',
            message: messaging,
            value,
            raw: payload,
          });
        }
      }
    }
  }

  return normalized;
}
