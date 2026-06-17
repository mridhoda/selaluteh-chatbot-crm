import Fuse from 'fuse.js';
import { promises as fs } from 'fs';
import path from 'path';
import { openaiClient, geminiClient } from './aiClient.js';

import Chat from '../models/Chat.js';
import Contact from '../models/Contact.js';
import Knowledge from '../models/Knowledge.js';
import Platform from '../models/Platform.js';
import { tgSend, waSend } from './sender.js';
import { createOrderFromAI } from './order.service.js';
import { createComplaintFromAI } from './complaint.service.js';
import { executeAIAction } from './ai-actions.service.js';

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

export async function generateAIReply({ system, prompt, message, knowledge, agent, chat, history = [] }) {
  const currentMessageText = message.text || (message.attachment ? '[Attachment]' : '');

  // Fallback echo
  if (!openaiClient && !geminiClient) {
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
  const contactId = chat?.contactId;
  const contact = contactId ? await Contact.findOne({ _id: contactId }) : null;
  const contactName = contact?.name ? ` The user's name is ${contact.name}.` : '';

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

  try {
    let reply = '';
    // Prioritize OpenAI if available
    if (openaiClient) {
      // TODO: Add multimodal support for OpenAI
      try {
        const resp = await openaiClient.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: (system || 'You are a helpful assistant.') + contactName },
            { role: 'user', content: `${prompt || ''}\n\nKnowledge:\n${knowledgeContent}\n\nUser: ${currentMessageText}` },
          ],
          temperature: 0.6,
        });
        reply = resp.choices?.[0]?.message?.content || '...';
        console.log('OpenAI reply:', reply);
      } catch (e) {
        console.error('OpenAI error:', e.message);
      }
    }

    // Fallback to Gemini if OpenAI fails or is not available
    if (geminiClient && !reply) {
      try {
        const model = geminiClient.getGenerativeModel({ model: 'gemini-2.5-flash' });

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

        let systemInstruction = (system || 'You are a helpful assistant.') + contactName + escalationInstruction;

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

        // Process history asynchronously to avoid blocking
        for (const msg of history) {
          const role = msg.from === 'user' ? 'user' : 'model';
          const parts = [];

          if (msg.text) {
            parts.push({ text: msg.text });
          }

          if (msg.attachment?.url) {
            const storedName = msg.attachment.url.split('/files/')[1];
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

        const promptText = `${prompt || ''}\n\nKnowledge:\n${knowledgeContent}\n\n[CURRENT TIME RIGHT NOW: ${currentTime} WITA - This is the ACTUAL real-time clock for THIS message. Do NOT use time from previous messages.]\n\nUser: ${currentMessageText}`;
        const promptParts = [{ text: promptText }];

        if (message.attachment?.url) {
          const storedName = message.attachment.url.split('/files/')[1];
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

              const Message = (await import('../models/Message.js')).default;

              // Find payment proof image from recent messages
              let paymentProofUrl = null;
              try {
                const recentMessages = await Message.find({ chatId: chat._id })
                  .sort({ createdAt: -1 })
                  .limit(20);

                // Find last user message with image attachment
                const paymentProofMessage = recentMessages.find(m =>
                  m.from === 'user' && m.attachment && m.attachment.url
                );

                if (paymentProofMessage) {
                  paymentProofUrl = paymentProofMessage.attachment.url;
                }
              } catch (err) {
                console.error('[AI] Failed to find payment proof:', err);
              }

              const aiActionResult = await executeAIAction({
                workspaceId: chat.workspaceId || agent.workspaceId,
                chatId: chat._id,
                chatMessageId: message._id || null,
                agentId: agent._id,
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
                chatId: chat._id,
                chatMessageId: message._id || null,
                agentId: agent._id,
                actionType: 'create_legacy_complaint',
                input: { complaintData },
                executor: () => createComplaintFromAI({ chat, agent, complaintData }),
              });
              if (!aiActionResult.valid) {
                throw new Error(`AI complaint action rejected: ${aiActionResult.validationErrors.join(', ')}`);
              }

              // Notification Logic
              if (agent.complaintNotification && agent.complaintNotification.enabled && agent.complaintNotification.platformId && agent.complaintNotification.destination) {
                try {
                  const notificationPlatform = await Platform.findById(agent.complaintNotification.platformId);
                  if (notificationPlatform) {
                    const notifText = `⚠️ *New Complaint Received*\n\n*Agent:* ${agent.name}\n*Platform:* ${chat.platformType}\n*Issue:* ${complaintData.text || '-'}\n*Contact:* ${complaintData.contactName || chat.contactId?.name || '-'}\n*Phone/ID:* ${complaintData.contactPhone || chat.contactId?.phone || '-'}\n\n*Details:* \n${JSON.stringify(complaintData.formData || {}, null, 2)}`;

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
          console.log('[AI] Escalation triggered for chat:', chat._id);
          await Chat.updateOne({ _id: chat._id }, { $set: { isEscalated: true } });
          return 'Baik, mohon tunggu sebentar, saya akan menyambungkan Anda dengan staf kami.';
        }

      } catch (e) {
        console.error('Gemini AI error:', e.message);
      }
    }

    if (contactId && !contact?.name) {
      const namePrompt = `Does the user reveal their name in this message? If so, what is it? If not, say "NO_NAME".\n\nUser: ${currentMessageText}`;
      const model = geminiClient.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const resp = await model.generateContent(namePrompt);
      const name = resp.response.text();
      if (name && name.trim().toUpperCase() !== 'NO_NAME') {
        await Contact.updateOne({ _id: contactId }, { $set: { name: name.trim() } });
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
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0,
              });
              answer = resp.choices?.[0]?.message?.content || 'no';
            } else if (geminiClient) {
              const model = geminiClient.getGenerativeModel({ model: 'gemini-2.5-flash' });
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
                    url: `${serverUrl}/files/${file.storedName}`,
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
            url: `${serverUrl}/files/${simpleMatch.storedName}`,
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

    const model = geminiClient.getGenerativeModel({ model: 'gemini-2.5-flash' });
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
