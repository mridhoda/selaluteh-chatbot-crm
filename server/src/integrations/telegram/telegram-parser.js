export function extractTelegramMessage(update = {}) {
  return update.message || update.edited_message || update.callback_query?.message || null;
}

export function normalizeTelegramUpdate(update = {}) {
  const message = extractTelegramMessage(update);
  if (!message) return null;

  const callback = update.callback_query || null;
  const eventType = callback ? 'callback_query' : update.edited_message ? 'edited_message' : 'message';
  const text = update.message?.text
    || update.edited_message?.text
    || callback?.data
    || message.caption
    || '';

  return {
    eventType,
    updateId: update.update_id,
    callbackId: callback?.id || null,
    message,
    text,
    chatId: message?.chat?.id || null,
    sender: message?.from || callback?.from || message?.chat || {},
    callbackData: callback?.data || null,
    location: message?.location || null,
    venue: message?.venue || null,
    raw: update,
  };
}
