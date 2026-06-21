import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createPendingLocationContext, isValidPendingContext, PENDING_TTL_MINUTES } from '../../../src/services/location-intelligence/pending-location-context.js';
import { nextId } from '../../helpers/location/index.js';

describe('PendingLocationContext — Task 2.1', () => {
  describe('Required identity fields', () => {
    it('has all required identity fields', () => {
      const ctx = createPendingLocationContext({
        workspaceId: nextId('ws'),
        contactId: nextId('contact'),
        chatId: nextId('chat'),
        lastMessageId: nextId('msg'),
      });
      assert(ctx.flowId);
      assert(ctx.workspaceId);
      assert(ctx.contactId);
      assert(ctx.chatId);
      assert(ctx.lastMessageId);
    });

    it('rejects missing workspaceId', () => {
      const ctx = createPendingLocationContext({
        contactId: nextId('contact'),
        chatId: nextId('chat'),
        lastMessageId: nextId('msg'),
      });
      assert.equal(isValidPendingContext(ctx), false);
    });

    it('rejects missing contactId', () => {
      const ctx = createPendingLocationContext({
        workspaceId: nextId('ws'),
        chatId: nextId('chat'),
        lastMessageId: nextId('msg'),
      });
      assert.equal(isValidPendingContext(ctx), false);
    });
  });

  describe('Workspace required', () => {
    it('workspaceId is required in identity', () => {
      const ctx = createPendingLocationContext({ workspaceId: null });
      assert.equal(isValidPendingContext(ctx), false);
    });
  });

  describe('Exact coordinates protected', () => {
    it('coordinates are stored as protected fields', () => {
      const ctx = createPendingLocationContext({
        protectedLatitude: -0.502106,
        protectedLongitude: 117.153709,
      });
      assert.equal(ctx.protectedLatitude, -0.502106);
      assert.equal(ctx.protectedLongitude, 117.153709);
    });
  });

  describe('TTL required', () => {
    it('has expiresAt field', () => {
      const ctx = createPendingLocationContext({});
      assert(ctx.expiresAt);
    });

    it('default TTL is 30 minutes', () => {
      const ctx = createPendingLocationContext({});
      const created = new Date(ctx.createdAt).getTime();
      const expires = new Date(ctx.expiresAt).getTime();
      const diffMinutes = (expires - created) / 60000;
      assert.equal(diffMinutes, PENDING_TTL_MINUTES);
    });

    it('status defaults to EMPTY', () => {
      const ctx = createPendingLocationContext({});
      assert.equal(ctx.status, 'EMPTY');
    });
  });

  describe('Negative/invalid expiry rejected', () => {
    it('negative TTL throws error', () => {
      assert.throws(() => {
        createPendingLocationContext({}, -10);
      }, /TTL/);
    });
  });
});
