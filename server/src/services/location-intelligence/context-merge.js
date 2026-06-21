export function mergeLocationContext(existing, incoming, isExplicitCorrection = false, now = new Date()) {
  if (!existing || !incoming) return null;

  if (existing.expiresAt && new Date(existing.expiresAt).getTime() < now.getTime()) {
    return null;
  }

  if (incoming.workspaceId && existing.workspaceId !== incoming.workspaceId) {
    return null;
  }

  if (incoming.contactId && existing.contactId !== incoming.contactId) {
    return null;
  }

  if (incoming.chatId && existing.chatId !== incoming.chatId) {
    return null;
  }

  if (incoming.lastMessageId && incoming.lastMessageId === existing.lastMessageId) {
    return null;
  }

  const merged = { ...existing };

  if (isExplicitCorrection) {
    if (incoming.city) merged.city = incoming.city;
    if (incoming.street) merged.street = incoming.street;
    if (incoming.area) merged.area = incoming.area;
    if (incoming.landmark) merged.landmark = incoming.landmark;
    merged.candidateIds = [];
    merged.normalizedQuery = null;
  } else {
    if (incoming.street && !existing.street) merged.street = incoming.street;
    if (incoming.area && !existing.area) merged.area = incoming.area;
    if (incoming.city && !existing.city) merged.city = incoming.city;
    if (incoming.landmark && !existing.landmark) merged.landmark = incoming.landmark;
    if (incoming.postalCode && !existing.postalCode) merged.postalCode = incoming.postalCode;
  }

  merged.updatedAt = now.toISOString();
  if (incoming.lastMessageId) {
    merged.lastMessageId = incoming.lastMessageId;
  }

  return merged;
}
