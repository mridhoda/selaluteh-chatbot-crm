import crypto from 'node:crypto';
import { FixedClock } from './clock.js';

let idCounter = 0;
export function nextId(prefix = 'test') {
  idCounter += 1;
  return `${prefix}-${idCounter}-${crypto.randomUUID().slice(0, 8)}`;
}

export function buildWorkspace(overrides = {}) {
  return {
    id: nextId('ws'),
    name: 'Test Workspace',
    slug: 'test-workspace',
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildOutlet(overrides = {}) {
  return {
    id: nextId('outlet'),
    workspaceId: overrides.workspaceId || nextId('ws'),
    name: 'Test Outlet',
    code: 'TST-01',
    status: 'active',
    address: 'Jalan Test No. 1',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildContact(overrides = {}) {
  return {
    id: nextId('contact'),
    workspaceId: overrides.workspaceId || nextId('ws'),
    name: 'Test Customer',
    handle: '@test_customer',
    platformId: overrides.platformId || nextId('platform'),
    externalUserId: String(Math.floor(Math.random() * 10000000)),
    language: 'id',
    tags: [],
    preferences: {},
    lastOutletId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildChat(overrides = {}) {
  return {
    id: nextId('chat'),
    workspaceId: overrides.workspaceId || nextId('ws'),
    platformId: overrides.platformId || nextId('platform'),
    contactId: overrides.contactId || nextId('contact'),
    agentId: overrides.agentId || null,
    externalConversationId: String(Math.floor(Math.random() * 10000000)),
    status: 'active',
    takenOverByUserId: null,
    takeoverBy: null,
    lastMessageAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildMessage(overrides = {}) {
  return {
    id: nextId('msg'),
    workspaceId: overrides.workspaceId || nextId('ws'),
    chatId: overrides.chatId || nextId('chat'),
    platformId: overrides.platformId || nextId('platform'),
    contactId: overrides.contactId || nextId('contact'),
    senderType: 'customer',
    direction: 'inbound',
    messageType: 'text',
    content: 'Test message content',
    externalMessageId: String(Math.floor(Math.random() * 10000000)),
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildConversationSession(overrides = {}) {
  return {
    id: nextId('session'),
    workspaceId: overrides.workspaceId || nextId('ws'),
    chatId: overrides.chatId || nextId('chat'),
    agentId: overrides.agentId || nextId('agent'),
    status: 'active',
    startedAt: new Date().toISOString(),
    lastCustomerMessageAt: new Date().toISOString(),
    lastAssistantMessageAt: null,
    closedAt: null,
    closeReason: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildAgent(overrides = {}) {
  return {
    id: nextId('agent'),
    workspaceId: overrides.workspaceId || nextId('ws'),
    platformId: overrides.platformId || nextId('platform'),
    name: 'Test Agent',
    displayName: 'Test Agent',
    description: 'A test AI agent',
    status: 'active',
    behavior: 'You are a helpful assistant for SelaluTeh.',
    prompt: 'Bantu customer dengan ramah.',
    welcomeMessage: 'Halo! Ada yang bisa saya bantu?',
    knowledge: [],
    tools: [],
    salesForms: null,
    complaintFields: null,
    complaintNotification: null,
    payment: null,
    followUps: null,
    database: null,
    stickerUrl: null,
    metadata: {},
    aiSettings: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildAgentVersion(overrides = {}) {
  return {
    id: nextId('agent-version'),
    agentId: overrides.agentId || nextId('agent'),
    version: 1,
    config: {},
    publishedAt: new Date().toISOString(),
    createdBy: nextId('user'),
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildMemory(overrides = {}) {
  return {
    id: nextId('memory'),
    workspaceId: overrides.workspaceId || nextId('ws'),
    contactId: overrides.contactId || nextId('contact'),
    memoryKey: 'preferred_taste',
    memoryValue: { value: 'kurang manis' },
    category: 'product_preference',
    sourceType: 'model_extraction',
    sourceReferenceId: overrides.sourceReferenceId || nextId('run'),
    confidence: 'high',
    status: 'active',
    validFrom: new Date().toISOString(),
    validUntil: null,
    lastConfirmedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deletedAt: null,
    ...overrides,
  };
}

export function buildKnowledgeSource(overrides = {}) {
  return {
    id: nextId('ksrc'),
    workspaceId: overrides.workspaceId || nextId('ws'),
    title: 'Test Knowledge',
    sourceType: 'FAQ',
    content: 'Ini adalah knowledge test.',
    scope: 'workspace',
    status: 'published',
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildKnowledgeChunk(overrides = {}) {
  return {
    id: nextId('kchunk'),
    sourceId: overrides.sourceId || nextId('ksrc'),
    sourceVersion: 1,
    chunkIndex: 0,
    sectionHeading: 'Test Section',
    content: 'Ini adalah chunk test.',
    tokenCount: 50,
    workspaceId: overrides.workspaceId || nextId('ws'),
    outletId: null,
    agentId: null,
    embedding: null,
    contentHash: crypto.createHash('sha256').update('test').digest('hex'),
    embeddingModel: 'test-embed',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildAiRun(overrides = {}) {
  return {
    id: nextId('airun'),
    workspaceId: overrides.workspaceId || nextId('ws'),
    chatId: overrides.chatId || nextId('chat'),
    sessionId: overrides.sessionId || nextId('session'),
    agentId: overrides.agentId || nextId('agent'),
    agentVersion: 1,
    modelProvider: 'test-provider',
    modelName: 'test-model',
    status: 'completed',
    inboundMessageId: overrides.inboundMessageId || nextId('msg'),
    assistantMessageId: null,
    contextMetadata: {},
    latencyMs: 150,
    inputTokens: 100,
    outputTokens: 50,
    startReason: 'customer_message',
    endReason: 'response_sent',
    errorCode: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildToolCall(overrides = {}) {
  return {
    id: nextId('toolcall'),
    runId: overrides.runId || nextId('airun'),
    toolName: 'test_tool',
    input: { testParam: 'test' },
    result: { testResult: 'ok' },
    status: 'completed',
    latencyMs: 50,
    errorCode: null,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function buildHumanTakeoverState(overrides = {}) {
  return {
    mode: 'ai_active',
    takenOverByUserId: null,
    takenOverAt: null,
    pinned: false,
    ...overrides,
  };
}
