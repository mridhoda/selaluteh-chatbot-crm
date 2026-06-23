import Fuse from 'fuse.js';
import { promises as fs } from 'fs';
import path from 'path';
import { openaiClient, geminiClient } from './aiClient.js';
import { env } from '../config/env.js';

import {
  chatsSupabaseRepository,
  contactsSupabaseRepository,
  platformsSupabaseRepository,
  messagesSupabaseRepository,
  productsSupabaseRepository,
} from '../db/repositories/index.js';
import { tgSend, waSend } from './sender.js';
import { createOrderFromAI } from './order.service.js';
import { createComplaintFromAI } from './complaint.service.js';
import { executeAIAction } from './ai-actions.service.js';
import { redactSecretsInText } from '../utils/redaction.js';
import { extractStoredNameFromUrl } from '../utils/file-urls.js';

export function sanitizePromptText(value = '') {
  return redactSecretsInText(String(value || ''));
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

function buildProductMenuContext(products = []) {
  if (!products.length) {
    return `

Official Active Products from Products Page:
- No active products are currently registered in the products page.

Product/menu answer rules:
- If the user asks for menu, products, prices, stock, or availability, answer only from this Official Active Products list.
- Do not invent menu items, prices, variants, stock, promos, or availability.
- If a requested item is not listed here, say it is not available in the current products page and offer listed alternatives.`;
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

Product/menu answer rules:
- If the user asks for menu, products, prices, stock, or availability, answer only from this Official Active Products list.
- Do not invent menu items, prices, variants, stock, promos, or availability.
- Do not mention products that are inactive or absent from the products page.
- If a requested item is not listed here, say it is not available in the current products page and offer listed alternatives.`;
}

async function loadProductMenuContext({ workspaceId }) {
  if (!workspaceId) return '';

  try {
    const products = await productsSupabaseRepository.findProducts({ workspaceId, isActive: true });
    return buildProductMenuContext(products);
  } catch (error) {
    console.error('[AI] Failed to load products context:', error.message);
    return `

Product/menu answer rules:
- Product data from the products page could not be loaded right now.
- Do not answer menu, price, stock, or availability from memory.
- Ask the user to wait while an admin checks the current products page.`;
  }
}

export async function generateAIReply({ system, prompt, message, knowledge, agent, chat, history = [] }) {
  const currentMessageText = sanitizePromptText(message.text || (message.attachment ? '[Attachment]' : ''));

  // --- Per-agent AI settings override ---
  // If the agent has its own aiSettings configured, those take priority over global env
  let effectiveOpenaiClient = openaiClient;
  let effectiveOpenaiModel = env.openaiModel;
  let effectiveTemperature = 0.6;
  let effectiveMaxTokens = undefined;

  if (agent?.aiSettings && agent.aiSettings.provider === 'openai') {
    const s = agent.aiSettings;
    if (s.apiKey) {
      const OpenAI = (await import('openai')).default;
      effectiveOpenaiClient = new OpenAI({
        apiKey: s.apiKey,
        baseURL: s.baseUrl || undefined,
        defaultHeaders: s.referer ? { 'HTTP-Referer': s.referer } : {},
      });
    }
    if (s.model) effectiveOpenaiModel = s.model;
    if (typeof s.temperature === 'number') effectiveTemperature = s.temperature;
    if (s.maxTokens) effectiveMaxTokens = Number(s.maxTokens);
  }

  // Fallback echo
  if (!effectiveOpenaiClient && !geminiClient) {
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
  const productMenuContext = await loadProductMenuContext({ workspaceId: chat?.workspaceId });

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
    // Prioritize OpenAI (or per-agent override) if available
    if (effectiveOpenaiClient) {
      const commerceInstructions = '\n\nORDER FLOW (only activate when customer explicitly wants to place an order):\n' +
        'STEP 1: Only when customer says they want to order/buy something, call get_outlets to get the list, then present the outlet NAMES as a simple numbered text list. NEVER send location pins or links.\n' +
        'STEP 2: After customer picks an outlet by name/number, call select_outlet with the correct outletId from the get_outlets result.\n' +
        'STEP 3: Ask what items the customer wants. Use search_products to find them.\n' +
        'STEP 4: Call add_cart_item for each item (use productId from search result, NEVER invent IDs).\n' +
        'STEP 5: After ALL items added, summarize the order and say: "Pesananmu sudah saya siapkan! Silakan klik tombol Checkout yang akan muncul."\n' +
        'CRITICAL RULES:\n' +
        '- Do NOT call get_outlets or show outlets unless the customer explicitly wants to ORDER something.\n' +
        '- Do NOT send location links, maps, or coordinates. Only show outlet names as plain text.\n' +
        '- Always call select_outlet BEFORE add_cart_item.\n' +
        '- Never fabricate product IDs or prices. Only use IDs from search_products results.\n' +
        '- If customer just asks about menu/prices, answer from the products list without starting the order flow.';


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
          const contactId = typeof chat?.contactId === 'object' ? chat.contactId?.id : chat?.contactId;

          const { cartsRepository, productsRepository, outletsSupabaseRepository } =
            await import('../db/repositories/index.js');

          if (toolName === 'get_outlets') {
            const outlets = await outletsSupabaseRepository.list({ workspaceId });
            return JSON.stringify((outlets || []).map(o => ({ id: o.id, name: o.name, city: o.city })));
          }

          if (toolName === 'search_products') {
            const results = await productsRepository.list({ workspaceId, search: toolArgs.query || '', limit: 10 });
            const items = Array.isArray(results) ? results : (results?.data || results?.items || []);
            return JSON.stringify(items.slice(0, 10).map(p => ({
              productId: p.id || p._id,
              name: p.name,
              price: p.basePrice ?? p.price ?? 0,
            })));
          }

          if (toolName === 'select_outlet') {
            const outlet = await outletsSupabaseRepository.findById({ workspaceId, outletId: toolArgs.outletId });
            if (!outlet) return JSON.stringify({ error: 'Outlet not found' });
            // Create/update cart linked to this outlet
            await cartsRepository.upsertByContact({ workspaceId, contactId, outletId: toolArgs.outletId, chatId: chat?.id || null });
            // Persist outlet selection to chat record so sidebar polling picks it up
            if (chat?.id) {
              await chatsSupabaseRepository.setCurrentOutlet(chat.id, toolArgs.outletId);
            }
            console.log(`[ai-tool] select_outlet: cart+chat updated for contact=${contactId} outlet=${toolArgs.outletId} (${outlet.name})`);
            return JSON.stringify({ success: true, outletId: toolArgs.outletId, name: outlet.name });
          }

          if (toolName === 'add_cart_item') {
            const cart = await cartsRepository.findActiveByContact({ workspaceId, contactId });
            if (!cart) return JSON.stringify({ error: 'No active cart. Call select_outlet first.' });
            const product = await productsRepository.findById({ workspaceId, productId: toolArgs.productId });
            await cartsRepository.addItem({
              workspaceId,
              cartId: cart.id,
              item: {
                productId: toolArgs.productId,
                quantity: toolArgs.quantity || 1,
                name: product?.name || '',
                productNameSnapshot: product?.name || '',
                unitPrice: product?.basePrice ?? product?.price ?? 0,
                effectivePrice: product?.basePrice ?? product?.price ?? 0,
              },
            });
            cartItemAdded = true; // ← mark that items were added this turn
            console.log(`[ai-tool] add_cart_item: added ${toolArgs.quantity}x ${product?.name} to cart ${cart.id}`);
            return JSON.stringify({ success: true, productId: toolArgs.productId, name: product?.name, quantity: toolArgs.quantity });
          }

          return JSON.stringify({ error: 'Unknown tool' });
        } catch (err) {
          console.error(`[ai-tool] ${toolName} error:`, err.message);
          return JSON.stringify({ error: err.message });
        }
      };

      try {
        const openaiMessages = [
          { role: 'system', content: sanitizePromptText((system || 'You are a helpful assistant.') + contactName + fileInstruction + productMenuContext + commerceInstructions) },
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
      if (reply) return { text: reply, cartItemAdded };
    } // end if (effectiveOpenaiClient)

    // Fallback to Gemini if OpenAI fails or is not available
    if (geminiClient && !reply) {
      try {
        const model = geminiClient.getGenerativeModel({ model: env.geminiModel });

        // --- Sales Form Logic ---
        if (agent.salesForms && agent.salesForms.length > 0) {
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
                  ${agent.payment?.enabled ? `
                  6. **Payment & Confirmation**: 
                     - Once you have the order details (Item, Qty, fields, Name, Outlet), **SUMMARIZE** the order briefly.
                     ${f.products && f.products.length > 0 ? `- **CALCULATE TOTAL**: Use the OFFICIAL PRICE LIST to calculate the total price. Show the calculation (e.g., "2 x Rp 15.000 = Rp 30.000").` : ''}
                     - Then, requests payment by saying: "Mohon lakukan pembayaran ke:\n\n${agent.payment.bankInfo || ''}\n\n${agent.payment.qrisUrl ? `[QRIS Image Available]` : ''}\n\nSilahkan kirim bukti pembayaran (screenshot/foto) jika sudah."
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
                  7. **Completion**: ${agent.payment?.enabled ? 'ONLY after payment proof is received/confirmed,' : 'When ALL required info (Fields + Name + Outlet) is gathered,'} reply with "FILE_ORDER_JSON:" followed by valid JSON with "formName", "formData" (captured fields including Outlet), "contactName", "contactPhone".
                  8. **Final Response**: AFTER the JSON, strictly reply with: "Pesanan Anda sedang kami proses. Mohon tunggu konfirmasi selanjutnya." (Do NOT say "Accepted" or "Received" yet).
              `;
            }).join('\n');

          if (salesInstructions) {
            system = (system || '') + `\n\n### Sales Instructions\nYou are a smart sales assistant. Help user buy efficiently.\n${salesInstructions}`;
          }
        }

        const complaintInstruction = (agent.complaintFields && agent.complaintFields.length > 0)
          ? `\n        4. If the user is making a COMPLAINT, you must collect the following information: ${agent.complaintFields.join(', ')}. Ask for them one by one if not provided. When ALL information is gathered, reply with "FILE_COMPLAINT_JSON:" followed by JSON with "text" (summary) and "formData" (object with captured fields: {${agent.complaintFields.map(f => `"${f}": "..."`).join(', ')}}). After the JSON, add a polite confirmation message to the user on a new line.`
          : `\n        4. If the user is making a COMPLAINT and has provided necessary details (issue, name, contact info), you MUST reply with "FILE_COMPLAINT_JSON:" followed by a valid JSON object with fields: "text" (the complaint issue), "contactName" (user's name), "contactPhone" (user's phone/email). Example: FILE_COMPLAINT_JSON: {"text": "Drink was bad", "contactName": "John", "contactPhone": "08123"} After the JSON, add a polite confirmation message to the user on a new line.`;

        const escalationInstruction = `
        IMPORTANT: You are a smart assistant.
        1. If the user EXPLICITLY asks to speak with a human agent, customer service, admin, or a real person (e.g., "bisa bicara dengan orang?", "mana adminnya?", "hubungkan ke CS"), you MUST reply with exactly: "ESCALATE_TO_HUMAN".
        2. If the user just says "halo", "hi", "selamat pagi", or asks general questions, DO NOT escalate. Answer them politely.
        3. If the user asks a specific question about the business/product that is NOT in your knowledge base, you MAY escalate by replying "ESCALATE_TO_HUMAN", but try to be helpful first if possible.${complaintInstruction}
        5. Do not add any other text if you decide to escalate.
        `;

        let systemInstruction = sanitizePromptText((system || 'You are a helpful assistant.') + contactName + fileInstruction + productMenuContext + escalationInstruction);

        // --- Tools Injection ---
        if (agent.tools && agent.tools.includes('time')) {
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
                workspaceId: chat.workspaceId || agent.workspaceId,
                chatId: chat.id,
                chatMessageId: message.id || null,
                agentId: agent.id,
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
                workspaceId: chat.workspaceId || agent.workspaceId,
                chatId: chat.id,
                chatMessageId: message.id || null,
                agentId: agent.id,
                actionType: 'create_legacy_complaint',
                input: { complaintData },
                executor: () => createComplaintFromAI({ chat, agent, complaintData }),
              });
              if (!aiActionResult.valid) {
                throw new Error(`AI complaint action rejected: ${aiActionResult.validationErrors.join(', ')}`);
              }

              // Notification Logic
              if (agent.complaintNotification?.enabled && agent.complaintNotification?.platformId && agent.complaintNotification?.destination) {
                try {
                  const notifPlatformId = agent.complaintNotification.platformId;
                  const notificationPlatform = await platformsSupabaseRepository.findByIdWithCredentials({
                    workspaceId: chat.workspaceId || agent.workspaceId,
                    platformId: notifPlatformId,
                  });
                  if (notificationPlatform) {
                    const notifText = `⚠️ *New Complaint Received*\n\n*Agent:* ${agent.name}\n*Platform:* ${chat.platformType || ''}\n*Issue:* ${complaintData.text || '-'}\n*Contact:* ${complaintData.contactName || contact?.name || '-'}\n*Phone/ID:* ${complaintData.contactPhone || contact?.phone || '-'}\n\n*Details:* \n${JSON.stringify(complaintData.formData || {}, null, 2)}`;

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

              // Remove the JSON command from the reply shown to user, keep the rest
              // We construct the exact string we want to remove: "FILE_COMPLAINT_JSON:" + any whitespace + jsonString
              // However, since we split by FILE_COMPLAINT_JSON:, we can just remove everything involving it.
              // The safest way is to remove "FILE_COMPLAINT_JSON:" and the jsonString.

              // Let's rely on the fact that we know exactly what `jsonString` is.
              // But there might be characters between FILE_COMPLAINT_JSON: and the start of jsonString (like space or newline)

              const fullCommandRegex = new RegExp(`FILE_COMPLAINT_JSON:\\s*${jsonString.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
              reply = reply.replace(fullCommandRegex, '').trim();

              // Fallback if regex fails (e.g. slight mismatch in whitespace), just remove the known parts manually
              if (reply.includes('FILE_COMPLAINT_JSON:')) {
                reply = reply.replace('FILE_COMPLAINT_JSON:', '').replace(jsonString, '').trim();
              }

              // Ensure we have a reply text. If AI returned only JSON, add a default confirmation.
              if (!reply) {
                reply = "Terima kasih, laporan keluhan Anda telah kami catat dan akan segera kami tindak lanjuti.";
              }

            }
          } catch (err) {
            console.error('[AI] Failed to parse complaint JSON:', err);
            // Parsing failed, try to hide the command anyway using robust regex for "balanced braces" is hard in regex.
            // Best effort: hide the line containing FILE_COMPLAINT_JSON
            reply = reply.replace(/FILE_COMPLAINT_JSON:.*(\n|$)/, '').trim();
          }
        }

        // Check for escalation
        if (reply.includes('ESCALATE_TO_HUMAN')) {
          const chatId = chat.id;
          console.log('[AI] Escalation triggered for chat:', chatId);
          await chatsSupabaseRepository.update({ chatId, updates: { is_escalated: true } });
          return 'Baik, mohon tunggu sebentar, saya akan menyambungkan Anda dengan staf kami.';
        }

      } catch (e) {
        console.error('Gemini AI error:', e.message);
      }
    }

    if (contactId && !contact?.name) {
      const namePrompt = `Does the user reveal their name in this message? If so, what is it? If not, say "NO_NAME".\n\nUser: ${currentMessageText}`;
      const model = geminiClient.getGenerativeModel({ model: env.geminiModel });
      const resp = await model.generateContent(namePrompt);
      const name = resp.response.text();
      if (name && name.trim().toUpperCase() !== 'NO_NAME') {
        await contactsSupabaseRepository.update({
          workspaceId: chat.workspaceId,
          contactId,
          updates: { name: name.trim() },
        });
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
    if (agent.database && agent.database.length > 0) {
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
              const file = agent.database.find(f => f.id.includes(fileId));
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
      const simpleMatch = agent.database.find(file => {
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
