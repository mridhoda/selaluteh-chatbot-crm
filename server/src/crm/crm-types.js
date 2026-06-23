export const HandlingMode = {
  AI: 'AI',
  HUMAN: 'HUMAN',
  HYBRID: 'HYBRID',
};

export const ConversationStatus = {
  ACTIVE: 'ACTIVE',
  WAITING: 'WAITING',
  RESOLVED: 'RESOLVED',
  ARCHIVED: 'ARCHIVED',
};

export const CRM_ERRORS = {
  CONTACT_NOT_FOUND: { code: 'CONTACT_NOT_FOUND', status: 404 },
  CONVERSATION_NOT_FOUND: { code: 'CONVERSATION_NOT_FOUND', status: 404 },
  CONTACT_MERGE_CONFLICT: { code: 'CONTACT_MERGE_CONFLICT', status: 409 },
};
