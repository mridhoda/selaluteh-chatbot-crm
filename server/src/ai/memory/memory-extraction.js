import { validateMemoryCandidate } from './memory-service.js';

export function extractMemoryFromMessage({ message, existingMemories = [] }) {
  const candidates = [];
  const content = (message?.content || '').toLowerCase();

  if (content.includes('kurang manis') || content.includes('tambah manis')) {
    candidates.push({
      key: 'sweetness_preference',
      value: { preference: content.includes('kurang manis') ? 'less_sweet' : 'more_sweet' },
      category: 'product_preference',
      sourceType: 'conversation_extraction',
      confidence: content.includes('kurang') || content.includes('tambah') ? 'high' : 'medium',
      reason: 'Customer mentioned sweetness preference',
    });
  }

  if (content.includes('saya ') && (content.includes('suka ') || content.includes('suka'))) {
    const match = content.match(/suka\s+(\w+\s*\w*)/);
    if (match && !content.includes('suka banget')) {
      candidates.push({
        key: 'favorite_product_mention',
        value: { product: match[1] },
        category: 'product_preference',
        sourceType: 'conversation_extraction',
        confidence: 'medium',
        reason: 'Customer stated preference',
      });
    }
  }

  if (content.includes('bahasa inggris') || content.includes('english')) {
    candidates.push({
      key: 'language_preference',
      value: { language: 'en' },
      category: 'language',
      sourceType: 'conversation_extraction',
      confidence: 'high',
      reason: 'Customer requested language change',
    });
  }

  return candidates.filter((c) => validateMemoryCandidate(c).valid);
}

export async function extractMemoryCandidates({ recentMessages }) {
  const allCandidates = [];
  for (const msg of recentMessages) {
    if (msg.senderType === 'customer' || msg.senderType === 'user') {
      const candidates = extractMemoryFromMessage({ message: msg });
      allCandidates.push(...candidates);
    }
  }
  const seen = new Set();
  return allCandidates.filter((c) => {
    const key = c.key;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
