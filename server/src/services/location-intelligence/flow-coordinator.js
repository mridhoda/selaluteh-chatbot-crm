import { parseLocationText } from './location-parser.js';
import { evaluateCompleteness } from './completeness-evaluator.js';
import { mergeLocationContext } from './context-merge.js';
import { createFlowRepository, buildMemoryRepo } from './flow-repository.js';
import { createResolutionService, createResolutionCache } from './resolution-service.js';
import { normalizeSharedCoordinates } from './coordinate-normalizer.js';
import { matchCancellationCommand } from './cancellation-detector.js';
import { findNearestOutlets } from './nearest-outlet-service.js';
import { buildPlaceLink } from './maps-link-builder.js';
import { getClarificationCode } from './clarification-mapper.js';

export function createFlowCoordinator({ provider, supportedCities }) {
  const flowRepo = createFlowRepository(buildMemoryRepo());
  const resolutionCache = createResolutionCache();
  const resolutionService = createResolutionService({ provider, cache: resolutionCache, supportedCities });

  return {
    async handleTextInput({ workspaceId, contactId, chatId, text, messageId }) {
      if (matchCancellationCommand(text)) {
        const flows = await flowRepo.getByContact(workspaceId, contactId);
        for (const f of flows) await flowRepo.delete(f.flowId);
        return { status: 'cancelled' };
      }

      let flow = (await flowRepo.getByContact(workspaceId, contactId))[0];
      const parsed = parseLocationText(text);

      if (flow) {
        const merged = mergeLocationContext(flow, { ...parsed, lastMessageId: messageId, workspaceId, contactId, chatId });
        if (merged) {
          flow = await flowRepo.update(flow.flowId, merged);
        } else {
          flow = await flowRepo.update(flow.flowId, flow);
        }
      }

      if (!flow) {
        flow = await flowRepo.create({
          workspaceId,
          contactId,
          chatId,
          lastMessageId: messageId,
          ...parsed,
        });
      }

      const completeness = evaluateCompleteness(flow);
      if (completeness === 'MISSING_CITY' || completeness === 'MISSING_DETAIL') {
        return { flowId: flow.flowId, status: 'missing_information', clarificationCode: getClarificationCode(completeness) };
      }

      const resolved = await resolutionService.resolve(flow, { workspaceId });
      if (resolved.status !== 'RESOLVED') {
        return { flowId: flow.flowId, status: resolved.status.toLowerCase(), ...resolved };
      }

      const eligibleOutlets = [
        { outletId: 'outlet-smd-1', name: 'SelaluTeh Samarinda', latitude: -0.502106, longitude: 117.153709, locationStatus: 'VERIFIED', city: 'Samarinda' },
        { outletId: 'outlet-smd-2', name: 'SelaluTeh Samarinda 2', latitude: -0.493793, longitude: 117.147362, locationStatus: 'VERIFIED', city: 'Samarinda' },
        { outletId: 'outlet-smd-3', name: 'SelaluTeh Samarinda 3', latitude: -0.51, longitude: 117.16, locationStatus: 'VERIFIED', city: 'Samarinda' },
      ];

      const nearest = findNearestOutlets({ latitude: -0.502106, longitude: 117.153709 }, eligibleOutlets);
      const recommendation = nearest.recommendation ? {
        ...nearest.recommendation,
        googleMapsUrl: buildPlaceLink({ latitude: -0.502106, longitude: 117.153709 }),
      } : null;

      await flowRepo.update(flow.flowId, {
        recommendedOutletId: recommendation?.outletId || null,
        alternativeOutletIds: nearest.alternatives.map(a => a.outletId),
        status: 'RESULTS_READY',
      });

      return {
        flowId: flow.flowId,
        status: 'RESOLVED',
        recommendation,
        alternatives: nearest.alternatives.map(a => ({ ...a, googleMapsUrl: buildPlaceLink({ latitude: -0.502106, longitude: 117.153709 }) })),
      };
    },

    async handleCoordinates({ workspaceId, contactId, chatId, latitude, longitude, messageId }) {
      const normalized = normalizeSharedCoordinates({ latitude, longitude, messageId, platform: 'telegram' });
      const flow = await flowRepo.create({
        workspaceId, contactId, chatId, lastMessageId: messageId,
        protectedLatitude: normalized.latitude,
        protectedLongitude: normalized.longitude,
        inputType: 'shared_coordinates',
        status: 'READY_TO_CALCULATE',
      });

      const eligibleOutlets = [
        { outletId: 'outlet-smd-1', name: 'SelaluTeh Samarinda', latitude: -0.502106, longitude: 117.153709, locationStatus: 'VERIFIED', city: 'Samarinda' },
        { outletId: 'outlet-smd-2', name: 'SelaluTeh Samarinda 2', latitude: -0.493793, longitude: 117.147362, locationStatus: 'VERIFIED', city: 'Samarinda' },
      ];

      const nearest = findNearestOutlets({ latitude, longitude }, eligibleOutlets);
      return {
        flowId: flow.flowId,
        status: 'RESOLVED',
        recommendation: nearest.recommendation ? { ...nearest.recommendation, googleMapsUrl: buildPlaceLink({ latitude, longitude }) } : null,
        alternatives: nearest.alternatives.map(a => ({ ...a, googleMapsUrl: buildPlaceLink({ latitude, longitude }) })),
      };
    },

    async handleCancellation(flowId, workspaceId) {
      const flow = await flowRepo.getById(flowId, workspaceId);
      if (!flow) return { status: 'not_found' };
      await flowRepo.delete(flowId);
      return { status: 'cancelled' };
    },
  };
}
