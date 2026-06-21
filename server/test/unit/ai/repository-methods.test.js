import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  conversationSessionsRepository,
  conversationSummariesRepository,
  contactMemoriesRepository,
  knowledgeSourcesRepository,
  knowledgeChunksRepository,
  aiRunsRepository,
  aiToolCallsRepository,
  aiFeedbackRepository,
} from '../../../src/db/repositories/index.js';

describe('AI Repositories — contract tests', () => {
  it('conversationSessionsRepository exposes required methods', () => {
    const methods = ['findActiveByChat', 'create', 'touchCustomerActivity', 'touchAssistantActivity', 'close', 'closeIdleSessions', 'findById'];
    for (const m of methods) {
      assert.equal(typeof conversationSessionsRepository[m], 'function', `missing method: ${m}`);
    }
  });

  it('conversationSummariesRepository exposes required methods', () => {
    const methods = ['findLatestValid', 'createForRange', 'markSuperseded', 'listBySession', 'deleteExpired'];
    for (const m of methods) {
      assert.equal(typeof conversationSummariesRepository[m], 'function', `missing method: ${m}`);
    }
  });

  it('contactMemoriesRepository exposes required methods', () => {
    const methods = ['listActive', 'findByKey', 'createCandidate', 'activate', 'supersede', 'correct', 'forget', 'deleteExpired'];
    for (const m of methods) {
      assert.equal(typeof contactMemoriesRepository[m], 'function', `missing method: ${m}`);
    }
  });

  it('knowledgeSourcesRepository exposes required methods', () => {
    const methods = ['createDraft', 'findById', 'list', 'updateDraft', 'publishVersion', 'archive'];
    for (const m of methods) {
      assert.equal(typeof knowledgeSourcesRepository[m], 'function', `missing method: ${m}`);
    }
  });

  it('knowledgeChunksRepository exposes required methods', () => {
    const methods = ['insertChunks', 'listChunks', 'deleteSupersededChunks', 'vectorSearch', 'fullTextSearch'];
    for (const m of methods) {
      assert.equal(typeof knowledgeChunksRepository[m], 'function', `missing method: ${m}`);
    }
  });

  it('aiRunsRepository exposes required methods', () => {
    const methods = ['createRun', 'markRunning', 'completeRun', 'failRun', 'findById', 'list', 'deleteExpired'];
    for (const m of methods) {
      assert.equal(typeof aiRunsRepository[m], 'function', `missing method: ${m}`);
    }
  });

  it('aiToolCallsRepository exposes required methods', () => {
    const methods = ['createToolCall', 'completeToolCall', 'failToolCall', 'listByRun', 'list', 'deleteExpired'];
    for (const m of methods) {
      assert.equal(typeof aiToolCallsRepository[m], 'function', `missing method: ${m}`);
    }
  });

  it('aiFeedbackRepository exposes required methods', () => {
    const methods = ['create', 'listByRun', 'listByAgentVersion'];
    for (const m of methods) {
      assert.equal(typeof aiFeedbackRepository[m], 'function', `missing method: ${m}`);
    }
  });
});
