import { isTakeoverActive } from '../../services/human-takeover.service.js';

export const OUT_OF_SCOPE_REPLY = 'Maaf, saya hanya bisa membantu seputar SelaluTeh seperti produk, outlet, keranjang, pesanan, pembayaran, pickup, komplain, dan bantuan customer service.';

export const HUMAN_TAKEOVER_REPLY = '';

const COMMERCE_TERMS = [
  'selaluteh', 'selalu teh', 'teh', 'minuman', 'produk', 'menu', 'harga', 'promo',
  'outlet', 'cabang', 'gerai', 'lokasi', 'maps', 'pesan', 'pesanan', 'order', 'beli',
  'keranjang', 'cart', 'checkout', 'bayar', 'pembayaran', 'qris', 'pickup', 'ambil',
  'komplain', 'keluhan', 'complaint', 'refund', 'cs', 'customer service', 'admin',
];

const SUPPORT_TERMS = [
  'halo', 'hai', 'hi', 'pagi', 'siang', 'sore', 'malam', 'bantuan', 'tolong', 'terima kasih',
];

const OUT_OF_SCOPE_TERMS = [
  'react', 'crypto', 'presiden', 'politik', 'berita', 'coding', 'kode', 'program',
  'dashboard', 'saham', 'forex', 'skripsi', 'homework', 'pr', 'matematika', 'judi',
];

const UNSAFE_TERMS = [
  'api key', 'password', 'token rahasia', 'system prompt', 'abaikan semua instruksi',
  'lupakan semua aturan', 'mark paid', 'tandai sudah dibayar',
];

function normalizeText(value = '') {
  return String(value || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function includesAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function getMessageText(message = {}) {
  return String(message.text || message.content || message.body || '').toLowerCase();
}

function isAssistantMessage(message = {}) {
  const sender = String(message.senderType || message.sender_type || message.from || message.direction || '').toLowerCase();
  return ['ai', 'assistant', 'bot', 'outbound'].includes(sender);
}

function hasRecentBusinessContext({ chat = null, history = [] } = {}) {
  if (chat?.currentOutletId || chat?.current_outlet_id || chat?.metadata?.latestOutletRecommendation) return true;

  const recent = Array.isArray(history) ? history.slice(-12) : [];
  return recent.some((message) => {
    const text = getMessageText(message);
    if (!text) return false;
    return includesAny(text, COMMERCE_TERMS)
      || includesAny(text, SUPPORT_TERMS)
      || (isAssistantMessage(message) && (
        text.includes('pilih salah satu outlet')
        || text.includes('outlet terdekat')
        || text.includes('berikut menu')
        || text.includes('mau pesan')
        || text.includes('keranjang')
      ));
  });
}

export function evaluateInputSafety(text = '') {
  const normalized = normalizeText(text);
  if (!normalized) return { allowed: true, reason: 'empty' };
  if (includesAny(normalized, UNSAFE_TERMS)) {
    return {
      allowed: false,
      reason: 'unsafe_input',
      reply: OUT_OF_SCOPE_REPLY,
    };
  }
  return { allowed: true, reason: 'safe' };
}

export function evaluateAIScope(text = '') {
  const normalized = normalizeText(text);
  if (!normalized) return { allowed: true, domain: 'support' };

  const commerceMatch = includesAny(normalized, COMMERCE_TERMS);
  const supportMatch = includesAny(normalized, SUPPORT_TERMS);
  const outOfScopeMatch = includesAny(normalized, OUT_OF_SCOPE_TERMS);

  if (commerceMatch) {
    return { allowed: true, domain: 'commerce' };
  }
  if (supportMatch && !outOfScopeMatch) {
    return { allowed: true, domain: 'support' };
  }
  if (outOfScopeMatch || normalized.length > 0) {
    return {
      allowed: false,
      reason: 'out_of_scope',
      reply: OUT_OF_SCOPE_REPLY,
    };
  }

  return { allowed: true, domain: 'support' };
}

export function shouldShortCircuitAI({ text = '', chat = null, history = [], humanTakeoverActive = false } = {}) {
  if (humanTakeoverActive || isTakeoverActive(chat)) {
    return {
      shortCircuit: true,
      reason: 'human_takeover_active',
      reply: HUMAN_TAKEOVER_REPLY,
      callTools: false,
      callRetrieval: false,
      mutateState: false,
    };
  }

  const safety = evaluateInputSafety(text);
  if (!safety.allowed) {
    return {
      shortCircuit: true,
      reason: safety.reason,
      reply: safety.reply,
      callTools: false,
      callRetrieval: false,
      mutateState: false,
    };
  }

  const scope = evaluateAIScope(text);
  if (!scope.allowed) {
    if (!includesAny(normalizeText(text), OUT_OF_SCOPE_TERMS) && hasRecentBusinessContext({ chat, history })) {
      return {
        shortCircuit: false,
        reason: 'allowed_by_recent_business_context',
        domain: 'contextual_followup',
        callTools: true,
        callRetrieval: true,
        mutateState: true,
      };
    }
    return {
      shortCircuit: true,
      reason: scope.reason,
      reply: scope.reply,
      callTools: false,
      callRetrieval: false,
      mutateState: false,
    };
  }

  return {
    shortCircuit: false,
    reason: 'allowed',
    domain: scope.domain,
    callTools: true,
    callRetrieval: true,
    mutateState: true,
  };
}
