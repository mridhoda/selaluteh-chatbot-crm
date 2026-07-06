import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';
import { getAiRuntimeConfig } from './settings.service.js';

const OPENAI_COMPATIBLE_PROVIDERS = new Set(['openai', 'openai_compatible', 'local_openai_compatible']);
const WORKSPACE_DEFAULT_PROVIDERS = new Set(['', 'global', 'workspace_default', 'default', null, undefined]);

function hasAttachment(message = {}) {
  const type = String(message?.attachment?.type || '').toLowerCase();
  const filename = String(message?.attachment?.filename || message?.attachment?.url || '').toLowerCase();
  return type === 'image' || /\.(png|jpe?g|webp|heic|heif)$/i.test(filename);
}

function normalizeProvider(provider) {
  if (WORKSPACE_DEFAULT_PROVIDERS.has(provider)) return 'workspace_default';
  if (provider === 'local_openai_compatible') return 'openai_compatible';
  return provider || 'workspace_default';
}

function resolveProviderOrder({ agentProvider, workspacePrimary, workspaceSecondary, requiresVision }) {
  const explicitAgentProvider = normalizeProvider(agentProvider);
  const primary = normalizeProvider(workspacePrimary);
  const secondary = normalizeProvider(workspaceSecondary);

  const order = [];
  if (explicitAgentProvider !== 'workspace_default') order.push(explicitAgentProvider);
  else order.push(primary);
  if (secondary && secondary !== 'workspace_default') order.push(secondary);

  const normalized = order.filter(Boolean).filter((value, index, arr) => arr.indexOf(value) === index);
  if (requiresVision && normalized.includes('gemini')) {
    return ['gemini', ...normalized.filter((provider) => provider !== 'gemini')];
  }
  return normalized;
}

function createOpenAIClient({ apiKey, baseURL, referer } = {}) {
  if (!apiKey) return null;
  const defaultHeaders = {};
  if (referer) defaultHeaders['HTTP-Referer'] = referer;
  else if (env.openaiReferer) defaultHeaders['HTTP-Referer'] = env.openaiReferer;
  if (env.openaiAppName) defaultHeaders['X-Title'] = env.openaiAppName;
  return new OpenAI({ apiKey, baseURL: baseURL || undefined, defaultHeaders });
}

function createGeminiClient({ apiKey } = {}) {
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

export async function resolveAiRuntime({ workspaceId, agent, message } = {}) {
  const workspaceConfig = workspaceId ? await getAiRuntimeConfig({ workspaceId }) : {};
  const agentSettings = agent?.aiSettings || {};
  const requiresVision = hasAttachment(message);
  const providerOrder = resolveProviderOrder({
    agentProvider: agentSettings.provider,
    workspacePrimary: workspaceConfig.primaryProvider,
    workspaceSecondary: workspaceConfig.secondaryProvider,
    requiresVision,
  });

  const candidates = providerOrder.length > 0 ? providerOrder : ['openai'];
  for (const provider of candidates) {
    if (provider === 'none') return { provider: 'none', disabled: true, requiresVision };

    if (provider === 'gemini') {
      const client = createGeminiClient({ apiKey: env.googleApiKey });
      if (client) {
        return {
          provider: 'gemini',
          client,
          model: agentSettings.provider === 'gemini' && agentSettings.model ? agentSettings.model : workspaceConfig.defaultModel || env.geminiModel,
          temperature: typeof agentSettings.temperature === 'number' ? agentSettings.temperature : 0.5,
          requiresVision,
        };
      }
      continue;
    }

    if (OPENAI_COMPATIBLE_PROVIDERS.has(provider)) {
      const explicitAgentOpenAI = OPENAI_COMPATIBLE_PROVIDERS.has(agentSettings.provider);
      const apiKey = explicitAgentOpenAI && agentSettings.apiKey
        ? agentSettings.apiKey
        : workspaceConfig.customProviderKey || env.openaiApiKey;
      const baseURL = explicitAgentOpenAI && agentSettings.baseUrl
        ? agentSettings.baseUrl
        : workspaceConfig.customProviderUrl || env.openaiBaseUrl;
      const client = createOpenAIClient({ apiKey, baseURL, referer: agentSettings.referer });
      if (client && !requiresVision) {
        return {
          provider: provider === 'openai_compatible' ? 'openai' : provider,
          client,
          model: explicitAgentOpenAI && agentSettings.model ? agentSettings.model : workspaceConfig.defaultModel || env.openaiModel,
          temperature: typeof agentSettings.temperature === 'number' ? agentSettings.temperature : 0.6,
          maxTokens: agentSettings.maxTokens ? Number(agentSettings.maxTokens) : undefined,
          requiresVision,
        };
      }
    }
  }

  return { provider: 'none', disabled: true, requiresVision };
}
