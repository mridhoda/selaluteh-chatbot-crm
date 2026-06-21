import crypto from 'node:crypto';
import { createSafeLogEntry } from './privacy-redactor.js';

export const TRACE_FIELDS = [
  'traceId', 'correlationId', 'workspaceId', 'chatId', 'messageId',
  'flowId', 'operation', 'inputType', 'city', 'provider', 'providerVersion',
  'cacheHit', 'status', 'candidateCount', 'eligibleOutletCount',
  'calculationMethod', 'withinServiceRadius', 'selectedOutletId',
  'latencyMs', 'providerCallCount', 'errorCode', 'createdAt',
];

export function createTraceEntry(fields) {
  const safe = createSafeLogEntry(fields);
  return {
    traceId: 'trace-' + crypto.randomUUID().slice(0, 8),
    correlationId: safe.correlationId || null,
    workspaceId: safe.workspaceId,
    chatId: safe.chatId,
    messageId: safe.messageId,
    flowId: safe.flowId,
    operation: safe.operation,
    inputType: safe.inputType,
    city: safe.city,
    provider: safe.provider,
    providerVersion: safe.providerVersion,
    cacheHit: safe.cacheHit || false,
    status: safe.status,
    candidateCount: safe.candidateCount,
    eligibleOutletCount: safe.eligibleOutletCount,
    calculationMethod: safe.calculationMethod,
    withinServiceRadius: safe.withinServiceRadius,
    selectedOutletId: safe.selectedOutletId,
    latencyMs: safe.latencyMs,
    providerCallCount: safe.providerCallCount,
    errorCode: safe.errorCode,
    createdAt: new Date().toISOString(),
  };
}
