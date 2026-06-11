import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';

const openaiKey = process.env.OPENAI_API_KEY || '';
const googleKey = process.env.GOOGLE_API_KEY || '';

let openaiClient = null;
let geminiClient = null;

if (openaiKey) {
  openaiClient = new OpenAI({ apiKey: openaiKey });
}
if (googleKey) {
  geminiClient = new GoogleGenerativeAI(googleKey);
}

export { openaiClient, geminiClient };
