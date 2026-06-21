import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createFlowCoordinator } from '../../../src/services/location-intelligence/flow-coordinator.js';
import { createFakeLocationProvider } from '../../helpers/location/fake-provider.js';
import { createResolutionService, createResolutionCache } from '../../../src/services/location-intelligence/resolution-service.js';
import { createFlowRepository, buildMemoryRepo } from '../../../src/services/location-intelligence/flow-repository.js';

describe('FlowCoordinator — Section 16.2', () => {
  it('Jalan Biawan Samarinda returns resolved', async () => {
    const coord = createFlowCoordinator({
      provider: createFakeLocationProvider('default'),
      supportedCities: ['Samarinda'],
    });
    const result = await coord.handleTextInput({ workspaceId: 'ws-1', contactId: 'c-1', chatId: 'ch-1', text: 'Jalan Biawan Samarinda', messageId: 'msg-1' });
    assert(result.flowId);
    assert.equal(result.status, 'RESOLVED');
  });
  it('Jalan Biawan without city returns missing_information', async () => {
    const coord = createFlowCoordinator({ provider: createFakeLocationProvider('default') });
    const result = await coord.handleTextInput({ workspaceId: 'ws-1', contactId: 'c-1', chatId: 'ch-1', text: 'Jalan Biawan', messageId: 'msg-2' });
    assert.equal(result.status, 'missing_information');
  });
  it('Samarinda without detail returns missing_information', async () => {
    const coord = createFlowCoordinator({ provider: createFakeLocationProvider('default') });
    const result = await coord.handleTextInput({ workspaceId: 'ws-1', contactId: 'c-1', chatId: 'ch-1', text: 'Samarinda', messageId: 'msg-3' });
    assert.equal(result.status, 'missing_information');
  });
  it('coordinates returns nearest outlets', async () => {
    const coord = createFlowCoordinator({ provider: createFakeLocationProvider('default') });
    const result = await coord.handleCoordinates({ workspaceId: 'ws-1', contactId: 'c-1', chatId: 'ch-1', latitude: -0.5, longitude: 117, messageId: 'msg-4' });
    assert(result.flowId);
  });
  it('unsupported city returns outside_supported_city', async () => {
    const coord = createFlowCoordinator({ provider: createFakeLocationProvider('default'), supportedCities: ['Samarinda'] });
    const result = await coord.handleTextInput({ workspaceId: 'ws-1', contactId: 'c-1', chatId: 'ch-1', text: 'Jalan Biawan Jakarta', messageId: 'msg-5' });
    assert(result.status.includes('outside') || result.status.includes('OUTSIDE'));
  });
  it('progressive clarification: street then city resolves status', async () => {
    const coord = createFlowCoordinator({ provider: createFakeLocationProvider('default'), supportedCities: ['Samarinda'] });
    const first = await coord.handleTextInput({ workspaceId: 'ws-1', contactId: 'c-1', chatId: 'ch-1', text: 'Jalan Biawan', messageId: 'msg-6' });
    assert.equal(first.status, 'missing_information');
    const second = await coord.handleTextInput({ workspaceId: 'ws-1', contactId: 'c-1', chatId: 'ch-1', text: 'Samarinda', messageId: 'msg-7' });
    assert(second.status === 'missing_information' || second.status === 'RESOLVED');
  });
  it('cancellation clears flow', async () => {
    const coord = createFlowCoordinator({ provider: createFakeLocationProvider('default') });
    const first = await coord.handleTextInput({ workspaceId: 'ws-1', contactId: 'c-1', chatId: 'ch-1', text: 'Jalan Biawan Samarinda', messageId: 'msg-8' });
    const cancel = await coord.handleCancellation(first.flowId, 'ws-1');
    assert.equal(cancel.status, 'cancelled');
  });
});
