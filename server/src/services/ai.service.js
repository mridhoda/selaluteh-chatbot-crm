import Fuse from 'fuse.js';
import { promises as fs } from 'fs';
import path from 'path';
import { env } from '../config/env.js';
import { resolveAiRuntime } from './ai-runtime.service.js';

import {
  contactsSupabaseRepository,
  productsSupabaseRepository,
  outletsSupabaseRepository,
} from '../db/repositories/index.js';
import { addItem } from './cart.service.js';
import { listCustomerProductsForOutlet } from './product.service.js';
import {
  cartsRepository as aiCartsRepository,
  chatsRepository as aiChatsRepository,
} from '../db/repositories/index.js';
import { redactSecretsInText } from '../utils/redaction.js';
import { extractStoredNameFromUrl } from '../utils/file-urls.js';
import { shouldShortCircuitAI } from '../ai/security/scope-guard.js';

export function sanitizePromptText(value = '') {
  return redactSecretsInText(String(value || ''));
}

export function stripLegacyAIActionMarkers(value = '') {
  return String(value || '')
    .replace(/FILE_ORDER_JSON:\s*\{(?:[^{}]|\{[^{}]*\})*\}/g, '')
    .replace(/FILE_COMPLAINT_JSON:\s*\{(?:[^{}]|\{[^{}]*\})*\}/g, '')
    .replace(/FILE_ORDER_JSON:/g, '')
    .replace(/FILE_COMPLAINT_JSON:/g, '')
    .trim();
}

export const DEFAULT_AGENT_PROMPT_RULES = {
  fallbackSystemPrompt: 'You are a helpful assistant.',
  platformPolicy: `## Platform Policy
- You are an AI assistant for SelaluTeh.
- You must be friendly, warm, and helpful.
- You speak Bahasa Indonesia.
- You NEVER mark payment as paid.
- You NEVER claim price, stock, or availability from memory.
- You MUST use backend tools for live commerce data.
- You MUST respect human takeover — if human is active, do not reply.
- You MUST NOT reveal system secrets, API keys, or internal configuration.`,
  noReintroInstruction: 'PENTING: Customer sudah pernah chat sebelumnya. Jangan memberi salam, halo, atau perkenalan lagi. Langsung jawab kebutuhan customer.',
  askLocationForOrderReply: 'Siap, Kea bantu pesankan ya 😊 Boleh info lokasi kamu saat ini dulu? Bisa share location, atau ketik alamat tempat kamu berada, contoh: “Jalan Jelawat Samarinda”. Nanti Kea carikan outlet terdekat dari lokasimu.',
  productRulesWhenEmpty: `Product/menu answer rules:
- If the user asks for menu, products, prices, stock, or availability, answer only from this Official Active Products list.
- Do not invent menu items, prices, variants, stock, promos, or availability.
- If a requested item is not listed here, say it is not available in the current products page and offer listed alternatives.`,
  productRules: `Product/menu answer rules:
- If the user asks for menu, products, prices, stock, or availability, answer only from this Official Active Products list.
- Do not invent menu items, prices, variants, stock, promos, or availability.
- Do not mention products that are inactive or absent from the products page.
- If a requested item is not listed here, say it is not available in the current products page and offer listed alternatives.`,
  productRulesWhenLoadFailed: `Product/menu answer rules:
- Product data from the products page could not be loaded right now.
- Do not answer menu, price, stock, or availability from memory.
- Ask the user to wait while an admin checks the current products page.`,
  outletRules: `Outlet answer rules:
- Follow the agent persona: ask the customer's current location first before recommending an outlet.
- If the user asks about outlet/cabang/lokasi/gerai/store but has not mentioned an area/city/current location, do not list all outlets. Ask them to share their current location or mention their area/city.
- After the customer provides a location, recommend the nearest outlet and include its Google Maps/share-location link when available.
- If the customer provides an address that is incomplete, contradictory, impossible, outside Indonesia, or mixes local Indonesian terms with a foreign city/country (for example “kelurahan New York”), do not guess. Ask the customer to verify and resend a valid address with street/landmark + kelurahan/kecamatan + city, or share live location/Google Maps.
- Offer: “Atau kamu mau aku listkan seluruh outlet yang ada di sekitarmu? Sebutin daerah atau kota tempat kamu tinggal ya.”
- If listing outlets by a mentioned city/area, answer only from this Official Outlets list.
- Do not invent outlet names, cities, locations, maps, or branches.
- If an outlet is not listed here, say it is not currently registered in the outlets page.`,
  outletRulesLoadFailed: `Outlet answer rules:
- Outlet data from the outlets page could not be loaded right now.
- Do not answer outlet availability from memory.
- Ask the user to wait while an admin checks the current outlets page.`,
  commerceInstructions: `OFFICIAL OUTLET RULES:
- If the customer asks about outlet/cabang/lokasi/gerai/store list or availability without mentioning an area/city/current location, ask their current location first. Do NOT call get_outlets just to dump all outlets.
- If the customer mentions a city/area and asks to list outlets there, you may answer only from official outlet context/tool result for that city/area.
- Never invent outlet names, branches, cities, maps, or locations.

ORDER FLOW (only activate when customer explicitly wants to place an order):
STEP 1: Ask the customer current location first. Do NOT call get_outlets and do NOT present all outlet names as the first response.
STEP 2: After customer sends location/share location/address, the location-intelligence flow will recommend the nearest outlet and include Google Maps/share-location link.
STEP 3: Customer can confirm the outlet EITHER by clicking the outlet button OR by typing the outlet name in chat. BOTH methods are equally valid.
  - If customer types the outlet name (e.g. "outlet danau murung", "ya", "pilih yang pertama"), you MUST call select_outlet with the outletId from get_outlets result. Do NOT tell them to click a button.
  - After select_outlet returns ok, immediately proceed to STEP 4.
STEP 4: Ask what items the customer wants (or if they already said the item, search and add immediately). Use search_products to find them.
STEP 5: Call add_cart_item for each item, and you MUST specify the quantity the user asked for (use productId from search result, NEVER invent IDs).
STEP 6: After ALL items added, summarize the order and say: "Pesananmu sudah saya siapkan! Silakan klik tombol Checkout yang akan muncul."
CRITICAL RULES:
- When customer starts an order, ask location first; never show the full outlet list first.
- If customer sends an invalid/contradictory address, do NOT call outlet/product tools and do NOT continue ordering. Ask them to verify the address format, e.g. "Boleh verifikasi alamatnya? Format yang benar: nama jalan/landmark + kelurahan/kecamatan + kota, atau share live location/Google Maps."
- If a selected outlet already exists in the chat context/current outlet, do NOT ask for location again. Continue with product search and add_cart_item immediately.
- Do NOT call get_outlets or show all outlets unless customer specifically asks to list outlets around a mentioned area/city.
- NEVER tell the customer to "click the outlet button" as the only way to confirm. Chat confirmation is always accepted.
- Always call select_outlet BEFORE add_cart_item.
- Never fabricate product IDs or prices. Only use IDs from search_products results.
- If customer just asks about menu/prices, answer from the products list without starting the order flow.`,
};

export function getAgentPromptRules(agent = {}) {
  return {
    ...DEFAULT_AGENT_PROMPT_RULES,
    ...(agent?.aiSettings?.promptRules || {}),
  };
}

// Helper to get MIME type from filename
function getMimeType(filename = '') {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  if (lower.endsWith('.heif')) return 'image/heif';
  // Audio types
  if (lower.endsWith('.mp3')) return 'audio/mp3';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.ogg')) return 'audio/ogg';
  if (lower.endsWith('.m4a')) return 'audio/m4a';
  // Default for safety, though Gemini supports various types
  return 'image/jpeg';
}

function formatRupiah(value) {
  const number = Number(value || 0);
  return `Rp ${number.toLocaleString('id-ID')}`;
}

function buildProductMenuContext(products = [], promptRules = DEFAULT_AGENT_PROMPT_RULES) {
  if (!products.length) {
    return `

Official Active Products from Products Page:
- No active products are currently registered in the products page.

${promptRules.productRulesWhenEmpty}`;
  }

  const lines = products.slice(0, 80).map((product) => {
    const description = product.shortDescription || product.description || '';
    const stock = product.stockTracking
      ? ` | stock: ${product.stockQuantity ?? 'unknown'}`
      : '';
    const tags = Array.isArray(product.tags) && product.tags.length > 0
      ? ` | tags: ${product.tags.join(', ')}`
      : '';
    return `- ${product.name}: ${formatRupiah(product.basePrice ?? product.price)}${description ? ` | ${description}` : ''}${stock}${tags}`;
  });

  return `

Official Active Products from Products Page:
${lines.join('\n')}
${products.length > 80 ? `- ...${products.length - 80} more active products are registered but not shown in this prompt.` : ''}

${promptRules.productRules}`;
}

async function loadProductMenuContext({ workspaceId, promptRules = DEFAULT_AGENT_PROMPT_RULES }) {
  if (!workspaceId) return '';

  try {
    const products = await productsSupabaseRepository.findProducts({ workspaceId, isActive: true });
    return buildProductMenuContext(products, promptRules);
  } catch (error) {
    console.error('[AI] Failed to load products context:', error.message);
    return `

${promptRules.productRulesWhenLoadFailed || `Product/menu answer rules:
- Product data from the products page could not be loaded right now.
- Do not answer menu, price, stock, or availability from memory.
- Ask the user to wait while an admin checks the current products page.`}`;
  }
}

function isOutletListQuestion(text = '') {
  const lower = String(text || '').toLowerCase();
  const asksOutlet = /\b(outlet(?:nya)?|cabang(?:nya)?|lokasi(?:nya)?|gerai(?:nya)?|store(?:nya)?)\b/.test(lower);
  const asksList = /(mana|apa aja|apa saja|daftar|list|tersedia|ada|dimana|di mana)/.test(lower);
  return asksOutlet && asksList;
}

/**
 * Detect if the user's message is about a COMPLAINT / problem with a PAST order.
 * This must be checked BEFORE any order-start intent to avoid misrouting.
 */
export function isComplaintContext(text = '') {
  const lower = String(text || '').toLowerCase();
  if (!lower.trim()) return false;

  // Explicit complaint keywords
  if (/\b(keluhan|komplain|kecewa|marah|kesal|protes|lapor|laporan|klaim|refund|ganti|retur|retur|complain)\b/.test(lower)) return true;

  // Past-purchase + problem signals ("yang aku beli ... beda", "produk yang saya terima salah")
  if (/\b(sudah|udah|tadi|kemarin|tadi|baru saja|barusan|sudah saya|udah aku)\b/.test(lower) &&
      /\b(beli|pesan|pesen|terima|dapat|order)\b/.test(lower)) return true;

  // "ini masalah dengan pesanan", "ada masalah", "ada kendala"
  if (/\b(masalah|kendala|problem|issue|kesalahan|error|salah)\b.{0,30}\b(pesanan|order|beli|produk|barang|minuman)\b/.test(lower)) return true;
  if (/\b(pesanan|order|barang|produk|minuman)\b.{0,30}\b(masalah|kendala|salah|beda|beda|berbeda|tidak sesuai|gak sesuai|nggak sesuai|keliru|rusak|kurang)\b/.test(lower)) return true;

  // "yang sebelumnya", "pesanan lama", "order lama"
  if (/\b(sebelumnya|sebelum ini|kemarin|yang lalu|lama|terdahulu)\b/.test(lower) &&
      /\b(pesanan|order|beli|pesan|produk)\b/.test(lower)) return true;

  // "produk yang aku beli beda" — past-action + mismatch
  if (/\b(yang\s+(aku|saya|sy|gue|gw)\s+(beli|pesan|terima|dapat))\b.{0,30}\b(beda|salah|berbeda|tidak sesuai|gak sesuai|nggak sesuai|keliru|berbeda|lain)\b/.test(lower)) return true;

  // "sama yg aku pesan beda", "beda produknya"
  if (/\b(beda|berbeda|tidak sesuai|gak sesuai|nggak sesuai)\b.{0,20}\b(produk|barang|pesanan|order|minuman)\b/.test(lower)) return true;
  if (/\b(produk|barang|pesanan|order|minuman)\b.{0,20}\b(beda|berbeda|salah|tidak sesuai|gak sesuai)\b/.test(lower)) return true;

  return false;
}

export function isOrderStartIntent(text = '') {
  const lower = String(text || '').toLowerCase();
  if (!lower.trim()) return false;
  // Complaint context takes priority over order intent
  if (isComplaintContext(lower)) return false;
  if (/\b(status|cek|lihat|lacak|batalkan|cancel|komplain|keluhan)\b.*\b(pesanan|order)\b/.test(lower)) return false;
  return /\b(mau|ingin|pengen|pingin|boleh|bisa|aku|saya|sy|aq|kak|ka)?\s*(pesan|pesen|order|beli|checkout)\b/.test(lower)
    || /\b(pesan|pesen|order|beli)\s+(?:dong|minuman|teh|menu|produk|\d+)/.test(lower);
}

export function shouldAskLocationForOrder(text = '', chat = {}) {
  const selectedOutletId = chat?.currentOutletId || chat?.current_outlet_id || null;
  return isOrderStartIntent(text) && !selectedOutletId;
}

export function buildAskCurrentLocationForOrderReply() {
  return DEFAULT_AGENT_PROMPT_RULES.askLocationForOrderReply;
}

function buildAskCurrentLocationForOrderReplyForAgent(agent) {
  return getAgentPromptRules(agent).askLocationForOrderReply;
}

export function extractOutletCityFilter(text = '') {
  const lower = String(text || '').toLowerCase();
  const match = lower.match(/\bdi\s+([a-zA-ZÀ-ÿ\s-]+?)(?:\s+(?:ada|apa|aja|saja|outlet|cabang|lokasi|gerai|store|yang|tersedia)\b|[?!.]|$)/i);
  const city = match?.[1]?.trim();
  if (!city || city.length < 2) return null;
  return city.replace(/\s+/g, ' ');
}

function normalizeCity(value = '') {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function formatOutletList(outlets = [], { cityFilter = null } = {}) {
  const normalizedCityFilter = normalizeCity(cityFilter);
  if (!normalizedCityFilter) {
    return 'Boleh info lokasi kamu saat ini dulu? Bisa share location, atau ketik alamat tempat kamu berada, contoh: “Jalan Jelawat Samarinda”. Nanti Kea carikan outlet terdekat dari lokasimu.';
  }

  const available = outlets.filter((outlet) => outlet.status !== 'archived');
  const filtered = normalizedCityFilter
    ? available.filter((outlet) => normalizeCity(outlet.city).includes(normalizedCityFilter))
    : available;

  if (!filtered.length) {
    if (normalizedCityFilter) {
      return `Saat ini belum ada outlet Selalu Teh yang terdaftar di kota ${cityFilter}.`;
    }
    return 'Saat ini belum ada outlet Selalu Teh yang terdaftar di sistem.';
  }

  const lines = filtered.map((outlet, index) => {
    const location = outlet.city ? ` (${outlet.city})` : '';
    const maps = outlet.metadata?.googleMapsLink || outlet.metadata?.googleMapsUrl || outlet.googleMapsUrl || '';
    return `${index + 1}. ${outlet.name}${location}${maps ? ` — ${maps}` : ''}`;
  });

  const scope = normalizedCityFilter ? ` di ${cityFilter}` : ' yang terdaftar saat ini';
  return `Outlet Selalu Teh${scope}:\n${lines.join('\n')}\n\nSilakan pilih outlet yang kamu mau.`;
}

async function answerOfficialOutletList({ workspaceId, userText = '' }) {
  if (!workspaceId) return null;
  try {
    const outlets = await outletsSupabaseRepository.list({ workspaceId, page: 1, limit: 100 });
    return formatOutletList(outlets || [], { cityFilter: extractOutletCityFilter(userText) });
  } catch (error) {
    console.error('[AI] Failed to load outlets context:', error.message);
    return 'Maaf, daftar outlet sedang tidak bisa dimuat dari sistem. Saya akan hubungkan ke admin agar bisa dicek.';
  }
}

async function loadOfficialOutletContext({ workspaceId, promptRules = DEFAULT_AGENT_PROMPT_RULES }) {
  if (!workspaceId) return '';
  try {
    const outlets = await outletsSupabaseRepository.list({ workspaceId, page: 1, limit: 100 });
    const available = (outlets || []).filter((outlet) => outlet.status !== 'archived');
    const lines = available.map((outlet) => {
      const maps = outlet.metadata?.googleMapsLink || outlet.metadata?.googleMapsUrl || outlet.googleMapsUrl || '';
      const address = outlet.address ? ` — ${outlet.address}` : '';
      const mapsText = maps ? ` — Google Maps: ${maps}` : '';
      return `- ${outlet.name}${outlet.city ? ` (${outlet.city})` : ''}${address}${mapsText}`;
    }).join('\n');
    return `\n\nOfficial Outlets from Outlets Page:\n${lines || '- No outlets are currently registered.'}\n\n${promptRules.outletRules}`;
  } catch (error) {
    console.error('[AI] Failed to load official outlet context:', error.message);
    return `\n\n${promptRules.outletRulesLoadFailed}`;
  }
}

export async function generateAIReply({ system, prompt, message, knowledge, agent, chat, history = [] }) {
  const currentMessageText = sanitizePromptText(message.text || (message.attachment ? '[Attachment]' : ''));
  const promptRules = getAgentPromptRules(agent);
  const selectedOutletId = chat?.currentOutletId || chat?.current_outlet_id || null;

  const guardDecision = shouldShortCircuitAI({ text: currentMessageText, chat, history });
  if (guardDecision.shortCircuit) {
    return guardDecision.reply;
  }

  // ── Detect active complaint session from history ─────────────────────────
  // Scan recent messages for complaint signals to inject explicit session context
  function detectComplaintSessionFromHistory(msgs = []) {
    if (!msgs || msgs.length === 0) return null;
    const recentMsgs = msgs.slice(-20); // look at up to 20 most recent

    // Check user messages for complaint signals
    const userComplaintMsgs = recentMsgs.filter((m) => {
      const isUser = m.senderType === 'customer' || m.direction === 'inbound';
      const text = m.content || m.text || '';
      return isUser && isComplaintContext(text);
    });
    if (userComplaintMsgs.length === 0) return null;

    // Also look for bot messages that acknowledged a complaint
    const botAcknowledgedComplaint = recentMsgs.some((m) => {
      const isBot = m.senderType === 'assistant' || m.senderType === 'ai' || m.direction === 'outbound';
      const text = (m.content || m.text || '').toLowerCase();
      return isBot && (
        text.includes('catat') || text.includes('teruskan') || text.includes('keluhan') ||
        text.includes('komplain') || text.includes('complaint') || text.includes('tim outlet') ||
        text.includes('nomor pesanan') || text.includes('outlet tempat')
      );
    });

    // Build a hint about what details have already been collected
    const collectedDetails = [];
    for (const m of recentMsgs) {
      const isUser = m.senderType === 'customer' || m.direction === 'inbound';
      const text = m.content || m.text || '';
      if (!isUser || !text) continue;
      const orderNumMatch = text.match(/\b(SLTH|INV|ORD|ORDER)[\-_]?[0-9A-Z]{4,}/i);
      if (orderNumMatch) collectedDetails.push(`Nomor pesanan: ${orderNumMatch[0]}`);
      const outletMatch = text.match(/\bdi\s+([\w\s]+?)(?:\s*[,.]|$)/i);
      if (outletMatch && outletMatch[1]?.length > 3) collectedDetails.push(`Outlet: ${outletMatch[1].trim()}`);
    }

    const detailSummary = collectedDetails.length > 0
      ? `\nDetail yang sudah dikumpulkan: ${collectedDetails.join('; ')}`
      : '';

    if (botAcknowledgedComplaint) {
      return `\n\n[SYSTEM NOTE — COMPLAINT SESSION ACTIVE]
Percakapan ini SEDANG DALAM MODE COMPLAINT. Bot sudah mengakui adanya keluhan sebelumnya.${detailSummary}
JANGAN jawab dengan salam baru atau "ada yang bisa dibantu". Lanjutkan proses pengumpulan detail complaint atau konfirmasi jika sudah lengkap.`;
    }
    return `\n\n[SYSTEM NOTE — COMPLAINT DETECTED IN HISTORY]
User sudah menyampaikan keluhan sebelumnya dalam percakapan ini.${detailSummary}
Perlakukan percakapan ini sebagai COMPLAINT SESSION — bukan percakapan baru.`;
  }

  const complaintSessionHint = detectComplaintSessionFromHistory(history);

  // Complaint context must be checked FIRST — never redirect a complaining user into an order flow
  if (!isComplaintContext(currentMessageText) && !complaintSessionHint && shouldAskLocationForOrder(currentMessageText, { currentOutletId: selectedOutletId })) {
    return buildAskCurrentLocationForOrderReplyForAgent(agent);
  }

  if (isOutletListQuestion(currentMessageText)) {
    const outletReply = await answerOfficialOutletList({ workspaceId: chat?.workspaceId || agent?.workspaceId, userText: currentMessageText });
    if (outletReply) return outletReply;
  }

  const aiRuntime = await resolveAiRuntime({ workspaceId: chat?.workspaceId || agent?.workspaceId, agent, message });
  let effectiveOpenaiClient = aiRuntime.provider === 'openai' || aiRuntime.provider === 'openai_compatible' ? aiRuntime.client : null;
  let effectiveOpenaiModel = aiRuntime.model || env.openaiModel;
  let effectiveTemperature = aiRuntime.temperature ?? 0.6;
  let effectiveMaxTokens = aiRuntime.maxTokens;
  let effectiveGeminiClient = aiRuntime.provider === 'gemini' ? aiRuntime.client : null;
  let effectiveGeminiModel = aiRuntime.model || env.geminiModel;

  // Fallback echo
  if (aiRuntime.disabled || (!effectiveOpenaiClient && !effectiveGeminiClient)) {
    return `Echo: ${currentMessageText}`;
  }

  // --- 1. Q&A Check ---
  if (knowledge && knowledge.length > 0) {
    const qnaKnowledge = knowledge.filter(k => k.kind === 'qna');
    if (qnaKnowledge.length > 0) {
      const fuse = new Fuse(qnaKnowledge, {
        keys: ['question'],
        includeScore: true,
        threshold: 0.4,
      });
      const results = fuse.search(currentMessageText);
      if (results.length > 0 && results[0].score < 0.4) {
        console.log('Q&A match found:', results[0].item.question);
        return results[0].item.answer;
      }
    }
  }

  // --- 2. Normal Reply Generation ---
  // contactId may be a UUID string or a nested object from Supabase joins
  const contactId = typeof chat?.contactId === 'object' ? chat.contactId?.id : chat?.contactId;
  const contact = contactId ? await contactsSupabaseRepository.findById({ workspaceId: chat.workspaceId, contactId }) : null;
  const contactName = contact?.name ? ` The user's name is ${contact.name}.` : '';
  const productMenuContext = await loadProductMenuContext({ workspaceId: chat?.workspaceId, promptRules });
  const officialOutletContext = await loadOfficialOutletContext({ workspaceId: chat?.workspaceId, promptRules });

  let knowledgeContent = '';
  if (knowledge && knowledge.length > 0) {
        knowledgeContent = knowledge.map(k => {
      if (k.kind === 'url') {
        return `URL: ${k.value}`;
      } else if (k.kind === 'text') {
        return `Text: ${k.value}`;
      } else if (k.kind === 'file') {
        return '';
      } else if (k.kind === 'qna') {
        return `Q: ${k.question}\nA: ${k.answer}`;
      }
    }).join('\n');
  }
  knowledgeContent = sanitizePromptText(knowledgeContent);

  const databaseFiles = Array.isArray(agent?.database) ? agent.database : [];
  const fileCatalog = databaseFiles.length > 0
    ? databaseFiles
      .filter((file) => file?.storedName)
      .map((file) => `- ${file.originalName || file.storedName}: use ![${file.originalName || file.storedName}](${file.storedName})`)
      .join('\n')
    : '';
  const fileInstruction = fileCatalog
    ? `\n\nAvailable media/files you may send as attachments when relevant:\n${fileCatalog}\nIf the user asks for one of these files/images, include exactly one markdown file trigger in your answer using the shown format. Do not invent file names.`
    : '';

  try {
    let reply = '';
    const autoCreateComplaintIfAcknowledged = async () => {};

    // Prioritize OpenAI (or per-agent override) if available
    if (effectiveOpenaiClient) {
      const commerceInstructions = promptRules.commerceInstructions
        ? `\n\n${promptRules.commerceInstructions}`
        : '';

      // ── Inject current commerce state so AI knows outlet is already selected ──
      let outletName = chat?.outletName || chat?.outlets?.name || null;
      if (!outletName && selectedOutletId) {
        try {
          const outlet = await outletsSupabaseRepository.findById({ workspaceId: chat?.workspaceId, outletId: selectedOutletId });
          outletName = outlet?.name || null;
        } catch (_) { /* non-fatal */ }
      }
      const commerceStateNote = selectedOutletId
        ? `\n\n[COMMERCE STATE — SYSTEM INJECTED]
Outlet sudah dipilih oleh customer: "${outletName || selectedOutletId}" (ID: ${selectedOutletId}).
JANGAN tanya lokasi atau outlet lagi. Langsung proses pesanan customer.
Langkah selanjutnya: cari produk dengan search_products, lalu tambahkan ke keranjang dengan add_cart_item.`
        : '';


      // ── Commerce tool definitions for OpenAI function calling ──────────────
      const commerceTools = [
        {
          type: 'function',
          function: {
            name: 'get_outlets',
            description: 'List all available pickup outlets',
            parameters: { type: 'object', properties: {}, required: [] },
          },
        },
        {
          type: 'function',
          function: {
            name: 'search_products',
            description: 'Search products by name or keyword. Returns productId, name, price.',
            parameters: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Product name or keyword' },
              },
              required: ['query'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'select_outlet',
            description: 'Select the outlet for the current order. Must be called before add_cart_item.',
            parameters: {
              type: 'object',
              properties: {
                outletId: { type: 'string', description: 'The outlet ID from get_outlets result' },
              },
              required: ['outletId'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'add_cart_item',
            description: 'Add a product to the cart. Requires select_outlet to have been called first.',
            parameters: {
              type: 'object',
              properties: {
                productId: { type: 'string', description: 'Product ID from search_products result' },
                quantity: { type: 'number', description: 'Number of items' },
              },
              required: ['productId', 'quantity'],
            },
          },
        },
      ];

      // ── Execute a commerce tool call against the real DB ───────────────────
      let cartItemAdded = false;
      const executeToolCall = async (toolName, toolArgs) => {
        try {
          console.log(`[ai-tool] ${toolName}`, toolArgs);
          const workspaceId = chat?.workspaceId;

          if (toolName === 'get_outlets') {
            const outlets = await outletsSupabaseRepository.list({ workspaceId });
            return JSON.stringify((outlets || []).map(o => ({
              id: o.id,
              name: o.name,
              city: o.city,
              address: o.address || '',
              googleMapsUrl: o.metadata?.googleMapsLink || o.metadata?.googleMapsUrl || o.googleMapsUrl || '',
            })));
          }

          if (toolName === 'search_products') {
            const outletIdForSearch = selectedOutletId || chat?.currentOutletId || chat?.current_outlet_id || null;
            const query = String(toolArgs.query || '').trim().toLowerCase();
            const results = outletIdForSearch
              ? await listCustomerProductsForOutlet({ workspaceId, outletId: outletIdForSearch, page: 0, limit: 1000 })
              : await productsSupabaseRepository.search({ workspaceId, query: toolArgs.query || '', limit: 10 });
            const rawItems = Array.isArray(results) ? results : (results?.products || results?.data || results?.items || []);
            const items = outletIdForSearch && query
              ? rawItems.filter((p) => String(p.name || '').toLowerCase().includes(query))
              : rawItems;
            return JSON.stringify(items.slice(0, 10).map(p => ({
              productId: p.id || p._id,
              name: p.name,
              price: p.basePrice ?? p.price ?? 0,
              stock: p.stockQuantity ?? p.outletAvailability?.stockQuantity ?? null,
            })));
          }

          if (toolName === 'select_outlet') {
            // User confirmed outlet via CHAT (not button click).
            // Validate the outlet and persist currentOutletId to DB — same as button flow.
            const outletIdToSelect = toolArgs.outletId || selectedOutletId || chat?.currentOutletId || null;
            if (!outletIdToSelect) {
              return JSON.stringify({
                error: 'NO_OUTLET_ID',
                message: 'Outlet ID tidak ditemukan. Sebutkan nama outlet yang kamu inginkan.',
              });
            }
            try {
              // Validate outlet is real and active
              const outlet = await outletsSupabaseRepository.findById({ workspaceId, outletId: outletIdToSelect });
              if (!outlet) {
                return JSON.stringify({ error: 'OUTLET_NOT_FOUND', message: 'Outlet tidak ditemukan dalam sistem.' });
              }
              const contactId = typeof chat?.contactId === 'object' ? chat.contactId?.id : chat?.contactId;
              // Expire carts from other outlets
              await aiCartsRepository.expireActiveByContactExceptOutlet({
                workspaceId,
                contactId,
                outletId: outlet.id,
              });
              // Persist to DB — same as button-click flow
              await aiChatsRepository.setCurrentOutlet({ workspaceId, chatId: chat.id, outletId: outlet.id });
              // Update in-memory so add_cart_item in this same agentic loop sees it
              chat.currentOutletId = outlet.id;
              console.log(`[ai-tool] select_outlet: outlet ${outlet.name} (${outlet.id}) saved to chat ${chat.id}`);
              return JSON.stringify({ ok: true, outletId: outlet.id, outletName: outlet.name, message: `Outlet ${outlet.name} berhasil dipilih. Silakan lanjutkan pesanan.` });
            } catch (selErr) {
              console.error('[ai-tool] select_outlet error:', selErr.message);
              return JSON.stringify({ error: selErr.message });
            }
          }

          if (toolName === 'add_cart_item') {
            const outletIdForCart = selectedOutletId || chat?.currentOutletId || chat?.current_outlet_id || null;
            if (!outletIdForCart) {
              return JSON.stringify({ error: 'NO_OUTLET_SELECTED', message: 'Outlet belum dipilih. Gunakan tombol pilih outlet terlebih dahulu.' });
            }
            const contactId = typeof chat?.contactId === 'object' ? chat.contactId?.id : chat?.contactId;
            try {
              await addItem({
                workspaceId,
                outletId: outletIdForCart,
                contactId,
                chatId: chat?.id,
                platformType: 'telegram',
                productId: String(toolArgs.productId),
                quantity: Number(toolArgs.quantity) || 1,
              });
              cartItemAdded = true;
              return JSON.stringify({ ok: true, message: `Item berhasil ditambahkan ke keranjang (qty: ${toolArgs.quantity}).` });
            } catch (cartErr) {
              // If cart is from a different outlet, auto-clear it and retry once
              if (cartErr.code === 'CART_OUTLET_MISMATCH' || (cartErr.message || '').includes('different outlet')) {
                console.log('[ai-tool] add_cart_item: clearing mismatched cart and retrying...');
                try {
                  await aiCartsRepository.expireActiveByContactExceptOutlet({
                    workspaceId,
                    contactId,
                    outletId: outletIdForCart,
                  });
                  await addItem({
                    workspaceId,
                    outletId: outletIdForCart,
                    contactId,
                    chatId: chat?.id,
                    platformType: 'telegram',
                    productId: String(toolArgs.productId),
                    quantity: Number(toolArgs.quantity) || 1,
                  });
                  cartItemAdded = true;
                  return JSON.stringify({ ok: true, message: `Item berhasil ditambahkan ke keranjang (qty: ${toolArgs.quantity}).` });
                } catch (retryErr) {
                  console.error('[ai-tool] add_cart_item retry error:', retryErr.message);
                  return JSON.stringify({ error: retryErr.message });
                }
              }
              console.error('[ai-tool] add_cart_item error:', cartErr.message);
              return JSON.stringify({ error: cartErr.message });
            }
          }

          return JSON.stringify({ error: 'Unknown tool' });
        } catch (err) {
          console.error(`[ai-tool] ${toolName} error:`, err.message);
          return JSON.stringify({ error: err.message });
        }
      };

      try {
        const openaiComplaintInstruction = `

## COMPLAINT HANDLING (HIGHEST PRIORITY — READ CAREFULLY)
If the user reports a problem, wrong item, missing order, or anything negative about a past purchase, treat it as a COMPLAINT — NOT as a test message, not as a new order.

DO NOT treat order numbers like "SLTH-2026XXXXXX" or formatted codes as fake or test data. They are REAL customer order references.

A complaint session is in progress if the user mentioned a problem with a past purchase earlier in this conversation and is now providing outlet name, order number, or follow-up details.

When the user has provided: (1) the issue/problem description, AND (2) their outlet or order number, you MUST:
1. Output FILE_COMPLAINT_JSON: followed by a valid JSON: { "text": "<issue summary>", "contactName": "<if known>", "contactPhone": "<if known>" }
2. On the NEXT LINE (after the JSON), write a sincere confirmation in Indonesian that says the complaint has been recorded and will be forwarded to the responsible team. Always include a phrase like "akan kami teruskan ke penanggung jawab kami". Also apologize sincerely.

NEVER respond to complaint details (outlet name, order number, location info) with a generic "ada yang bisa dibantu" — the user is completing a complaint, not starting a new conversation.`;

        const openaiMessages = [
          { role: 'system', content: sanitizePromptText((system || promptRules.fallbackSystemPrompt) + contactName + fileInstruction + productMenuContext + officialOutletContext + commerceInstructions + commerceStateNote + openaiComplaintInstruction + (complaintSessionHint || '')) },
        ];

        for (const msg of history) {
          const isUser = msg.senderType === 'customer' || msg.direction === 'inbound';
          openaiMessages.push({
            role: isUser ? 'user' : 'assistant',
            content: sanitizePromptText(msg.content || msg.text || ''),
          });
        }

        openaiMessages.push({
          role: 'user',
          content: sanitizePromptText(`${prompt || ''}\n\nKnowledge:\n${knowledgeContent}${fileInstruction}\n\nUser: ${currentMessageText}`),
        });

        // ── Agentic tool loop: run until AI produces text or max iterations ──
        const MAX_TOOL_ITERATIONS = 6;
        let iterations = 0;
        while (iterations < MAX_TOOL_ITERATIONS) {
          iterations++;
          const createParams = {
            model: effectiveOpenaiModel,
            messages: openaiMessages,
            temperature: effectiveTemperature,
            tools: commerceTools,
            tool_choice: 'auto',
          };
          if (effectiveMaxTokens) createParams.max_tokens = effectiveMaxTokens;

          const resp = await effectiveOpenaiClient.chat.completions.create(createParams);
          const choice = resp.choices?.[0];
          const assistantMsg = choice?.message;

          // Add assistant message to history
          openaiMessages.push(assistantMsg);

          // If no tool calls → final reply
          if (!assistantMsg?.tool_calls || assistantMsg.tool_calls.length === 0) {
            reply = assistantMsg?.content || '...';
            console.log('OpenAI reply:', reply);
            break;
          }

          // Execute each tool call and add results
          for (const tc of assistantMsg.tool_calls) {
            const toolArgs = JSON.parse(tc.function.arguments || '{}');
            const toolResult = await executeToolCall(tc.function.name, toolArgs);
            openaiMessages.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: toolResult,
            });
          }
        }

        if (!reply) reply = 'Maaf, ada gangguan sementara. Silakan coba lagi.';
      } catch (e) {
        console.error('OpenAI error:', e.message);
      }
      // Return cartItemAdded flag alongside reply
      if (reply) {
        return { text: stripLegacyAIActionMarkers(reply), cartItemAdded };
      }
    } // end if (effectiveOpenaiClient)

    // Fallback to Gemini if selected by workspace/agent routing or if OpenAI failed and resolver chose Gemini.
    if (effectiveGeminiClient && !reply) {
      try {
        const model = effectiveGeminiClient.getGenerativeModel({ model: effectiveGeminiModel });

        // --- Sales Form Logic ---
        if (agent?.salesForms && agent.salesForms.length > 0) {
          const outletList = agent.outlets && agent.outlets.length > 0 ? agent.outlets.join(', ') : '';
          const salesInstructions = agent.salesForms
            .filter(f => f.isActive)
            .map(f => {
              return `
              - **Sales Form "${f.name}"**:
                - Trigger when user says keywords like: ${f.triggerKeywords.join(', ')}.
                - **Goal**: Collect the following details:
                  ${f.products && f.products.length > 0 ? `1. **Item Name** (Must match one of the available products)\n                  2. **Quantity**` : ''}
                  ${f.fields.map(field => `- ${field}`).join('\n                  ')}
                
                - **MANDATORY**: You MUST also collect the user's **Name** ("Nama") and **Outlet** (if outlets are available).
                ${outletList ? `- **Available Outlets**: ${outletList}. Ask the user which outlet they prefer.` : ''}

                ${f.products && f.products.length > 0 ? `
                - **OFFICIAL PRICE LIST (Use these prices to calculate total)**:
                  ${f.products.map(p => `- ${p.name}: Rp ${p.price.toLocaleString('id-ID')}${p.description ? ` (${p.description})` : ''}`).join('\n                  ')}
                ` : ''}

                - **Instructions**:
                  1. **Be Concise**: If the user's intent is clear, skip small talk. Go straight to the transaction.
                  2. **Smart Collection**: If the user provides multiple details at once (e.g., "I want 2 red iphones"), capture ALL item names and quantities immediately.
                  3. **Use Bullet Points**: When listing options (like available outlets, menu items, or variants), **ALWAYS** use a bulleted list (one item per line) for clarity.
                  4. **Context**: Do not ask for fields that are clearly not applicable or have been answered.
                  5. **Promos**: Only mention promos if they are *highly relevant* to what the user is buying right now. Do not spam generic promos.
                  ${agent?.payment?.enabled ? `
                  6. **Payment & Confirmation**: 
                     - Once you have the order details (Item, Qty, fields, Name, Outlet), **SUMMARIZE** the order briefly.
                     ${f.products && f.products.length > 0 ? `- **CALCULATE TOTAL**: Use the OFFICIAL PRICE LIST to calculate the total price. Show the calculation (e.g., "2 x Rp 15.000 = Rp 30.000").` : ''}
                     - Then, requests payment by saying: "Mohon lakukan pembayaran ke:\n\n${agent.payment?.bankInfo || ''}\n\n${agent.payment?.qrisUrl ? `[QRIS Image Available]` : ''}\n\nSilahkan kirim bukti pembayaran (screenshot/foto) jika sudah."
                     - **WAIT** for the user to confirm payment.
                     - **STRICT VERIFICATION REQUIRED**:
                       - If the user sends an **IMAGE**: You **MUST** analyze the image content visually.
                         1. **Check Validity**: Is this a valid bank transfer receipt or QRIS success screen?
                         2. **Check Amount**: Does the amount in the image match the Order Total?
                         3. **Check Destination**: If visible, does the destination account match: "${agent.payment.bankInfo}"?
                         - **IF VALID**: Proceed to finalize.
                         - **IF INVALID/FAKE**: Reply "Maaf, bukti pembayaran tidak valid. Nominal atau nomor tujuan tidak sesuai. Mohon kirim bukti yang benar." and DO NOT finalize.
                       - If the user just sends TEXT (e.g. "sudah"): You MUST ask for the photo proof ("Mohon lampirkan screenshot/foto bukti transfer"). Do NOT finalize without image proof.
                  ` : ''}
                  7. **Completion**: When ALL required info (Fields + Name + Outlet) is gathered, summarize the request and ask the customer to use the official cart/checkout buttons. Do NOT output hidden JSON commands.
                  8. **Final Response**: Reply with: "Pesananmu sudah saya rangkum. Silakan gunakan tombol keranjang/checkout resmi agar harga, outlet, dan pembayaran tervalidasi sistem.".
              `;
            }).join('\n');

          if (salesInstructions) {
            system = (system || '') + `\n\n### Sales Instructions\nYou are a smart sales assistant. Help user buy efficiently.\n${salesInstructions}`;
          }
        }

        const complaintInstruction = (agent?.complaintFields && agent.complaintFields.length > 0)
          ? `\n
## COMPLAINT HANDLING (HIGHEST PRIORITY — READ CAREFULLY)
If the user reports a problem, wrong item, missing order, or anything negative about a past purchase, treat it as a COMPLAINT — NOT as a test, not as a new order.

DO NOT treat order numbers like "SLTH-2026XXXXXX" or similar codes as fake or test data. They are real customer order numbers.

Collect the following details one by one if not yet provided:
${agent.complaintFields.join('\n')}

Once ALL required details are gathered, you MUST:
1. Output FILE_COMPLAINT_JSON: followed by a valid JSON: { "text": "<issue summary>", "formData": {${agent.complaintFields.map(f => `"${f}": "..."`).join(', ')}} }
2. On the NEXT LINE (after the JSON), write a confirmation message in Indonesian that EXPLICITLY says the complaint has been recorded and will be forwarded to the responsible team. Example: "Terima kasih, keluhan kamu sudah kami catat dan akan segera kami teruskan ke tim yang bertanggung jawab. Kami mohon maaf atas ketidaknyamanannya dan akan berusaha menyelesaikan ini secepatnya 🙏"

NEVER respond to complaint follow-up messages with a generic greeting or "ada yang bisa dibantu" — the user is in the middle of a complaint flow.
`
          : `\n
## COMPLAINT HANDLING (HIGHEST PRIORITY — READ CAREFULLY)
If the user reports a problem, wrong item, missing order, or anything negative about a past purchase, treat it as a COMPLAINT — NOT as a test, not as a new order.

DO NOT treat order numbers like "SLTH-2026XXXXXX" or formatted codes as fake or test data. They are REAL customer order references.

A complaint session is in progress if:
- The user mentioned a problem with a past purchase earlier in the conversation
- The user is now providing outlet name, order number, or follow-up complaint details

When the user has provided: (1) the issue/problem description, AND (2) their outlet or order number, you MUST:
1. Output FILE_COMPLAINT_JSON: followed by a valid JSON: { "text": "<issue summary>", "contactName": "<if known>", "contactPhone": "<if known>" }
2. On the NEXT LINE (after the JSON), write a confirmation message in Indonesian that says the complaint has been recorded and WILL BE FORWARDED to the responsible team. ALWAYS include this phrase: "akan kami teruskan ke penanggung jawab kami" or similar. Also apologize sincerely.

NEVER respond to complaint details (outlet name, order number, "sudah pulang" etc.) with a generic greeting or "ada yang bisa Tea bantu" — the user is completing a complaint, not starting a new conversation.
`;

        const escalationInstruction = `
        IMPORTANT: You are a smart assistant.
        1. If the user EXPLICITLY asks to speak with a human agent, customer service, admin, or a real person (e.g., "bisa bicara dengan orang?", "mana adminnya?", "hubungkan ke CS"), you MUST reply with exactly: "ESCALATE_TO_HUMAN".
        2. If the user just says "halo", "hi", "selamat pagi", or asks general questions, DO NOT escalate. Answer them politely.
        3. If the user asks a specific question about the business/product that is NOT in your knowledge base, you MAY escalate by replying "ESCALATE_TO_HUMAN", but try to be helpful first if possible.${complaintInstruction}
        5. Do not add any other text if you decide to escalate.
        `;

        let systemInstruction = sanitizePromptText((system || promptRules.fallbackSystemPrompt) + contactName + fileInstruction + productMenuContext + officialOutletContext + escalationInstruction + (complaintSessionHint || ''));

        // --- Tools Injection ---
        if (agent?.tools && agent.tools.includes('time')) {
          const now = new Date();
          // WITA = UTC+8 untuk Kalimantan Timur
          const witaTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
          const formattedTime = witaTime.toLocaleString('id-ID', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          systemInstruction += `\\n\\n[System Tool: Time]\\nCurrent Time (WITA): ${formattedTime}\\nTimezone: WITA = UTC+8 (Kalimantan Timur)\\nYou have access to the current time. Always use WITA timezone.`;
        }

        const geminiHistory = [
          { role: 'user', parts: [{ text: systemInstruction }] },
          { role: 'model', parts: [{ text: 'Baik, saya mengerti.' }] },
        ];

        for (const msg of history) {
          const role = (msg.senderType === 'customer' || msg.direction === 'inbound') ? 'user' : 'model';
          const parts = [];

          if (msg.text) {
            parts.push({ text: sanitizePromptText(msg.text) });
          }

          if (msg.attachment?.url) {
            const storedName = extractStoredNameFromUrl(msg.attachment.url);
            if (storedName) {
              // Only add inlineData (images) for USER messages. Model cannot have inlineData.
              if (role === 'user') {
                try {
                  const filePath = path.resolve('uploads', storedName);
                  await fs.access(filePath); // Check if file exists
                  const mimeType = getMimeType(msg.attachment.filename);
                  const data = await fs.readFile(filePath, 'base64');
                  parts.push({ inlineData: { mimeType, data } });
                } catch (e) {
                  console.warn('[AI] History attachment not found or unreadable: ', storedName);
                  parts.push({ text: '[Attachment unreadable]' });
                }
              } else {
                // For model, just mention it sent a file
                parts.push({ text: `[System: Assistant previously sent ${msg.attachment.filename || 'a file'}]` });
              }
            }
          }

          if (parts.length > 0) {
            geminiHistory.push({ role, parts });
          }
        }

        const chatSession = model.startChat({
          history: geminiHistory,
          generationConfig: {
            temperature: 0.5,
          }
        });

        // Inject real-time timestamp for EVERY message
        const now = new Date();
        const currentTime = now.toLocaleString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });

        const promptText = sanitizePromptText(`${prompt || ''}\n\nKnowledge:\n${knowledgeContent}\n\n[CURRENT TIME RIGHT NOW: ${currentTime} WITA - This is the ACTUAL real-time clock for THIS message. Do NOT use time from previous messages.]\n\nUser: ${currentMessageText}`);
        const promptParts = [{ text: promptText }];

        if (message.attachment?.url) {
          const storedName = extractStoredNameFromUrl(message.attachment.url);
          if (storedName) {
            try {
              const filePath = path.resolve('uploads', storedName);
              await fs.access(filePath);
              const mimeType = getMimeType(message.attachment.filename);
              const data = await fs.readFile(filePath, 'base64');
              promptParts.push({ inlineData: { mimeType, data } });
              console.log(`[AI] Attached image ${filePath} to prompt.`);
            } catch (e) {
              console.error(`[AI] Failed to read attachment for prompt: ${storedName}`, e);
              promptParts[0].text += '\n[System note: Failed to load attachment.]';
            }
          }
        }

        const result = await chatSession.sendMessage(promptParts);
        reply = result.response.text();
        console.log('Gemini AI reply:', reply);
        reply = stripLegacyAIActionMarkers(reply);

        // Check for order filing
        if (reply.includes('FILE_ORDER_JSON:')) {
          try {
            const jsonPart = reply.split('FILE_ORDER_JSON:')[1].trim();
            let jsonString = '';
            const startIndex = jsonPart.indexOf('{');
            if (startIndex !== -1) {
              let braceCount = 0;
              for (let i = startIndex; i < jsonPart.length; i++) {
                if (jsonPart[i] === '{') braceCount++;
                else if (jsonPart[i] === '}') braceCount--;
                if (braceCount === 0) {
                  jsonString = jsonPart.substring(startIndex, i + 1);
                  break;
                }
              }
            }

            if (jsonString) {
              const orderData = JSON.parse(jsonString);
              console.log('[AI] Filing Order:', orderData);

              // Find payment proof image from recent messages
              let paymentProofUrl = null;
              try {
                const chatId = chat.id;
                const recentMessages = await messagesSupabaseRepository.listByChatId(chatId, { limit: 20 });
                const sorted = [...recentMessages].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                // Find last contact/user message with attachment
                const paymentProofMessage = sorted.find((m) =>
                  m.senderType === 'contact' && m.rawPayload?.attachment?.url
                );
                if (paymentProofMessage) {
                  paymentProofUrl = paymentProofMessage.rawPayload.attachment.url;
                }
              } catch (err) {
                console.error('[AI] Failed to find payment proof:', err);
              }

              const aiActionResult = await executeAIAction({
                workspaceId: chat?.workspaceId || agent?.workspaceId,
                chatId: chat?.id,
                chatMessageId: message?.id || null,
                agentId: agent?.id || null,
                actionType: 'create_legacy_order',
                input: { orderData, paymentProofUrl },
                executor: () => createOrderFromAI({ chat, agent, orderData, paymentProofUrl }),
              });
              if (!aiActionResult.valid) {
                throw new Error(`AI order action rejected: ${aiActionResult.validationErrors.join(', ')}`);
              }

              const fullCommandRegex = new RegExp(`FILE_ORDER_JSON:\\s*${jsonString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
              reply = reply.replace(fullCommandRegex, '').trim();
              if (reply.includes('FILE_ORDER_JSON:')) {
                reply = reply.replace('FILE_ORDER_JSON:', '').replace(jsonString, '').trim();
              }
              if (!reply) reply = "Terima kasih, pesanan Anda telah kami terima.";
            }
          } catch (err) {
            console.error('[AI] Failed to parse order JSON:', err);
            reply = reply.replace(/FILE_ORDER_JSON:.*(\n|$)/, '').trim();
          }
        }

        // Check for complaint filing
        if (reply.includes('FILE_COMPLAINT_JSON:')) {
          try {
            const jsonPart = reply.split('FILE_COMPLAINT_JSON:')[1].trim();
            // Extract JSON until the end of the line or structure (in case there is text after)
            // Simple approach: try to parse the first line that looks like JSON or just parse the chunk
            // We'll rely on our prompt asking for JSON followed by newline text.
            // Let's split by newline to separate JSON from user message
            const lines = jsonPart.split('\n');
            const jsonStr = lines[0]; // Assuming JSON is on one line or we can regex extract it

            // Robust extraction if JSON spans lines or is embedded
            let jsonString = '';
            const startIndex = jsonPart.indexOf('{');
            if (startIndex !== -1) {
              let braceCount = 0;
              for (let i = startIndex; i < jsonPart.length; i++) {
                if (jsonPart[i] === '{') braceCount++;
                else if (jsonPart[i] === '}') braceCount--;

                if (braceCount === 0) {
                  jsonString = jsonPart.substring(startIndex, i + 1);
                  break;
                }
              }
            }

            if (jsonString) {
              const complaintData = JSON.parse(jsonString);
              console.log('[AI] Filing Complaint:', complaintData);

              const aiActionResult = await executeAIAction({
                workspaceId: chat?.workspaceId || agent?.workspaceId,
                chatId: chat?.id,
                chatMessageId: message?.id || null,
                agentId: agent?.id || null,
                actionType: 'create_legacy_complaint',
                input: { complaintData },
                executor: () => createComplaintFromAI({ chat, agent, complaintData }),
              });
              if (!aiActionResult.valid) {
                throw new Error(`AI complaint action rejected: ${aiActionResult.validationErrors.join(', ')}`);
              }
              complaintFiled = true;

              // Notification Logic
              if (agent?.complaintNotification?.enabled && agent.complaintNotification?.platformId && agent.complaintNotification?.destination) {
                try {
                  const notifPlatformId = agent.complaintNotification.platformId;
                  const notificationPlatform = await platformsSupabaseRepository.findByIdWithCredentials({
                    workspaceId: chat?.workspaceId || agent?.workspaceId,
                    platformId: notifPlatformId,
                  });
                  if (notificationPlatform) {
                    const notifText = `⚠️ *New Complaint Received*\n\n*Agent:* ${agent?.name || 'System'}\n*Platform:* ${chat?.platformType || ''}\n*Issue:* ${complaintData.text || '-'}\n*Contact:* ${complaintData.contactName || contact?.name || '-'}\n*Phone/ID:* ${complaintData.contactPhone || contact?.phone || '-'}\n\n*Details:* \n${JSON.stringify(complaintData.formData || {}, null, 2)}`;

                    console.log(`[AI] Sending complaint notification to ${notificationPlatform.type} (${agent.complaintNotification.destination})`);

                    if (notificationPlatform.type === 'telegram') {
                      await tgSend(notificationPlatform.token, agent.complaintNotification.destination, notifText);
                    } else if (notificationPlatform.type === 'whatsapp') {
                      await waSend(notificationPlatform.token, notificationPlatform.phoneNumberId, agent.complaintNotification.destination, notifText);
                    }
                  }
                } catch (notifWarn) {
                  console.error('[AI] Failed to send complaint notification:', notifWarn);
                }
              }

              // ── Strip the FILE_COMPLAINT_JSON command from the reply shown to user ──
              // Multi-step: exact match first, then nested-brace regex, then nuclear
              reply = reply
                .replace(new RegExp(`FILE_COMPLAINT_JSON:\\s*${jsonString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), '')
                .replace(/FILE_COMPLAINT_JSON:\s*\{(?:[^{}]|\{[^{}]*\})*\}/g, '')
                .replace(/FILE_COMPLAINT_JSON:/g, '')
                .trim();

              if (!reply) {
                reply = 'Terima kasih, laporan keluhan Anda telah kami catat dan akan segera kami tindak lanjuti.';
              }

            }
          } catch (err) {
            console.error('[AI] Failed to parse complaint JSON:', err);
            reply = reply
              .replace(/FILE_COMPLAINT_JSON:\s*\{(?:[^{}]|\{[^{}]*\})*\}/g, '')
              .replace(/FILE_COMPLAINT_JSON:/g, '')
              .trim();
          }
        }

        try {
          await autoCreateComplaintIfAcknowledged();
        } catch (err) {
          console.error('[AI] Failed to auto-create acknowledged complaint:', err);
        }

        // Check for escalation
        if (reply.includes('ESCALATE_TO_HUMAN')) {
          const chatId = chat.id;
          console.log('[AI] Escalation triggered for chat:', chatId);
          return 'Baik, mohon tunggu sebentar, saya akan menyambungkan Anda dengan staf kami.';
        }

      } catch (e) {
        console.error('Gemini AI error:', e.message);
      }
    }

    return reply;
  } catch (e) {
    console.error('AI error:', e.message);
  }

  return `Echo: ${currentMessageText}`;
}

export async function findAndSendFile({ agent, message, openaiClient, geminiClient }) {
  const messageText = typeof message === 'string' ? message : message.text || '';
  if (!messageText) return null;

  try {
    if (agent?.database && agent.database.length > 0) {
      if (agent.prompt) {
        const instructions = agent.prompt.split(/jika/i).slice(1);

        for (const instruction of instructions) {
          const match = instruction.match(/(.*?) maka kirim (.*)/i);
          if (match) {
            const condition = match[1].trim();
            const fileId = match[2].trim();

            const prompt = `You are a helpful assistant. The user's message is: "${messageText}". The condition for sending a file is: "${condition}". Does the user's message match the condition? Please answer with "yes" or "no".`;

            let answer = 'no';
            if (openaiClient) {
              const resp = await openaiClient.chat.completions.create({
                model: env.openaiModel,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0,
              });
              answer = resp.choices?.[0]?.message?.content || 'no';
            } else if (geminiClient) {
              const model = geminiClient.getGenerativeModel({ model: env.geminiModel });
              const result = await model.generateContent(prompt);
              answer = result.response.text();
            }

            if (answer.toLowerCase().includes('yes')) {
              const file = agent?.database.find(f => f.id.includes(fileId));
              if (file) {
                console.log('File found for user message based on prompt:', file.originalName);
      const serverUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:5000';
      return {
        text: `Tentu, ini file ${file.originalName} yang Anda minta.`,
        attachment: {
          url: `${serverUrl}${buildManagedFileUrl(file.storedName)}`,
          filename: file.originalName,
          storedName: file.storedName,
        }
                };
              }
            }
          }
        }
      }

      const lowerMsg = messageText.toLowerCase();
      const simpleMatch = agent?.database.find(file => {
        const name = (file.originalName || '').toLowerCase();
        const base = name.replace(/\.[^.]+$/, '');
        return (
          (name && lowerMsg.includes(name)) ||
          (base && lowerMsg.includes(base)) ||
          (file.id && lowerMsg.includes(file.id.toLowerCase()))
        );
      });

      if (simpleMatch) {
        console.log('Simple keyword match found for:', simpleMatch.originalName);
        const serverUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:5000';
        return {
          text: `Tentu, ini file ${simpleMatch.originalName} yang Anda minta.`,
          attachment: {
            url: `${serverUrl}${buildManagedFileUrl(simpleMatch.storedName)}`,
            filename: simpleMatch.originalName,
            storedName: simpleMatch.storedName,
          },
        };
      }
    }
  } catch (e) {
    console.error('File request from prompt check failed:', e.message);
  }

  return null;
}
export async function transcribeAudio(filePath) {
  if (!geminiClient) {
    throw new Error('Gemini client not available for transcription');
  }

  try {
    const filename = path.basename(filePath);
    const mimeType = getMimeType(filename);
    const data = await fs.readFile(filePath, 'base64');

    const model = geminiClient.getGenerativeModel({ model: env.geminiModel });
    const result = await model.generateContent([
      { text: 'Please transcribe this audio file. Only return the transcribed text, nothing else.' },
      { inlineData: { mimeType, data } }
    ]);

    const transcription = result.response.text();
    console.log('[AI] Audio transcription successful:', transcription.substring(0, 100));
    return transcription;
  } catch (e) {
    console.error('[AI] Audio transcription failed:', e.message);
    throw e;
  }
}
