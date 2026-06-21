import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mergeLocationContext } from '../../../src/services/location-intelligence/context-merge.js';
import { buildPendingLocationContext, FixedClock } from '../../helpers/location/index.js';

describe('ContextMerge — Task 2.4', () => {
  const clock = new FixedClock('2026-06-20T00:00:00Z');

  it('preserves previous street when city arrives', () => {
    clock.setTime('2026-06-20T00:00:00Z');
    const existing = buildPendingLocationContext({ street: 'Jalan Biawan', city: null, status: 'MISSING_CITY' });
    const merged = mergeLocationContext(existing, { city: 'Samarinda' }, false, clock.now());
    assert.equal(merged.street, 'Jalan Biawan');
    assert.equal(merged.city, 'Samarinda');
  });

  it('preserves city when area arrives', () => {
    clock.setTime('2026-06-20T00:00:00Z');
    const existing = buildPendingLocationContext({ city: 'Samarinda', street: null, status: 'MISSING_DETAIL' });
    const merged = mergeLocationContext(existing, { area: 'Air Putih' }, false, clock.now());
    assert.equal(merged.city, 'Samarinda');
    assert.equal(merged.area, 'Air Putih');
  });

  it('replaces field on explicit correction', () => {
    clock.setTime('2026-06-20T00:00:00Z');
    const existing = buildPendingLocationContext({ city: 'Samarinda' });
    const merged = mergeLocationContext(existing, { city: 'Tenggarong' }, true, clock.now());
    assert.equal(merged.city, 'Tenggarong');
  });

  it('clears incompatible candidates after correction', () => {
    clock.setTime('2026-06-20T00:00:00Z');
    const existing = buildPendingLocationContext({ city: 'Samarinda', candidateIds: ['cand-1', 'cand-2'] });
    const merged = mergeLocationContext(existing, { city: 'Tenggarong' }, true, clock.now());
    assert.equal(merged.candidateIds.length, 0);
  });

  it('does not merge expired context', () => {
    clock.setTime('2026-06-20T00:00:00Z');
    const existing = buildPendingLocationContext({ street: 'Jalan Biawan', expiresAt: '2026-06-19T23:00:00Z' });
    const merged = mergeLocationContext(existing, { city: 'Samarinda' }, false, clock.now());
    assert.equal(merged, null);
  });

  it('does not merge cross-workspace context', () => {
    clock.setTime('2026-06-20T00:00:00Z');
    const existing = buildPendingLocationContext({ workspaceId: 'ws-1' });
    const merged = mergeLocationContext(existing, { city: 'Samarinda', workspaceId: 'ws-2' }, false, clock.now());
    assert.equal(merged, null);
  });

  it('does not merge another contact', () => {
    clock.setTime('2026-06-20T00:00:00Z');
    const existing = buildPendingLocationContext({ contactId: 'contact-1' });
    const merged = mergeLocationContext(existing, { city: 'Samarinda', contactId: 'contact-2' }, false, clock.now());
    assert.equal(merged, null);
  });

  it('does not merge another chat', () => {
    clock.setTime('2026-06-20T00:00:00Z');
    const existing = buildPendingLocationContext({ chatId: 'chat-1' });
    const merged = mergeLocationContext(existing, { city: 'Samarinda', chatId: 'chat-2' }, false, clock.now());
    assert.equal(merged, null);
  });

  it('handles duplicate reply idempotently', () => {
    clock.setTime('2026-06-20T00:00:00Z');
    const existing = buildPendingLocationContext({ street: 'Jalan Biawan', city: 'Samarinda', lastMessageId: 'msg-1' });
    const merged = mergeLocationContext(existing, { city: 'Samarinda', lastMessageId: 'msg-1' }, false, clock.now());
    assert.equal(merged, null);
  });
});
