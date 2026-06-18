import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env.js';

const openaiKey = env.openaiApiKey;
const googleKey = env.googleApiKey;

let openaiClient = null;
let geminiClient = null;

if (openaiKey) {
  const defaultHeaders = {};
  if (env.openaiReferer) defaultHeaders['HTTP-Referer'] = env.openaiReferer;
  if (env.openaiAppName) defaultHeaders['X-Title'] = env.openaiAppName;
  openaiClient = new OpenAI({
    apiKey: openaiKey,
    baseURL: env.openaiBaseUrl || undefined,
    defaultHeaders,
  });
}
if (googleKey) {
  geminiClient = new GoogleGenerativeAI(googleKey);
}

export { openaiClient, geminiClient };
