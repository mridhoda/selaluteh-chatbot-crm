import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import {
  platformsSupabaseRepository,
  agentsSupabaseRepository,
  contactsSupabaseRepository,
  chatsSupabaseRepository,
  messagesSupabaseRepository,
  checkoutsRepository,
  cartsRepository,
} from '../../db/repositories/index.js';
import { generateAIReply, findAndSendFile, transcribeAudio, getAgentPromptRules } from '../../services/ai.service.js';
import { openaiClient, geminiClient } from '../../services/aiClient.js';
import {
  tgSend,
  tgSendSplit,
  tgSendDocument,
  tgSendPhoto,
  tgSendVideo,
  tgSendSticker,
} from '../../services/sender.js';
import { findDatabaseFileMention, findUrlFileMention } from '../../utils/fileMentions.js';
import { buildContext } from '../../ai/context/context-builder.js';
import { loadRecentMessages } from '../../ai/context/recent-messages.js';
import { downloadFile } from '../../utils/downloader.js';
import { recordInboundMessage, recordOutboundMessage } from '../../services/chat-message.service.js';
import {
  buildNearestOutletReplyFromCoordinates,
  buildNearestOutletReplyFromText,
} from '../../services/location-intelligence/nearest-outlet-reply.service.js';
import {
  beginWebhookEvent,
  getTelegramEventId,
  markWebhookFailed,
  markWebhookProcessed,
} from '../../services/webhook-idempotency.service.js';
import {
  buildOutletSelectionMessage,
  handleTelegramCommerceAction,
  parseTelegramAction,
} from '../../services/telegram-commerce.service.js';
import { normalizeTelegramUpdate } from '../../integrations/telegram/telegram-parser.js';
import { assertWebhookPayloadSafe, verifyTelegramSecret } from '../../security/webhook-security.js';
import { env } from '../../config/env.js';
import { buildManagedFileUrl, buildPublicFileUrl } from '../../utils/file-urls.js';

const router = express.Router();

function isImageFile(filename = '') {
  return /\.(png|jpe?g|gif|webp)$/i.test(filename);
}

function isStickerFile(filename = '') {
  return /\.(webp|tgs|webm)$/i.test(filename);
}

function getPublicFileUrl(storedName) {
  const base = process.env.PUBLIC_FILES_BASE_URL || `${process.env.PUBLIC_BASE_URL || 'http://localhost:5000'}/public-files`;
  return `${base.replace(/\/$/, '')}/${storedName}`;
}

function resolveMessageType(filename = '', format = null) {
  if (format === 'image' || isImageFile(filename)) return 'image';
  return 'file';
}

async function sendTelegramTextOrDatabaseAttachment({ token, chatId, text, agent, sendTextOptions = {} }) {
  const mention = findDatabaseFileMention(text, agent);
  if (mention?.file?.storedName) {
    const { file, token: mentionToken, altText, format } = mention;
    const cleanedText = (text || '').replace(mentionToken, altText || '').trim();
    const caption = cleanedText || altText || '';
    const localFilePath = path.resolve('uploads', file.storedName);
    const filename = file.originalName || file.storedName;

    if (format === 'sticker' && isStickerFile(filename)) {
      await tgSendSticker(token, chatId, getPublicFileUrl(file.storedName));
      if (caption) await tgSend(token, chatId, caption, null, sendTextOptions);
    } else if (format === 'image' || isImageFile(filename)) {
      await tgSendPhoto(token, chatId, localFilePath, caption || undefined);
    } else {
      await tgSendDocument(token, chatId, localFilePath, caption || undefined);
    }

    return {
      text: caption || 'Lampiran terkirim.',
      messageType: resolveMessageType(filename, format),
        attachment: {
          url: buildManagedFileUrl(file.storedName),
          filename,
        type: resolveMessageType(filename, format) === 'image' ? 'image' : 'document',
        format: format || null,
      },
    };
  }

  await tgSend(token, chatId, text, null, sendTextOptions);
  return { text, messageType: 'text', attachment: null };
}

async function fetchTelegramFilePath(token, fileId) {
  const resp = await fetch(
    `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`,
  );
  const data = await resp.json();
  if (!data.ok) {
    throw new Error(`Telegram getFile failed: ${JSON.stringify(data)}`);
  }
  return data.result?.file_path;
}

async function saveTelegramFileLocally({
  token,
  fileId,
  preferredName = '',
}) {
  const filePath = await fetchTelegramFilePath(token, fileId);
  if (!filePath) throw new Error('Telegram file_path missing');
  const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
  const downloadResp = await fetch(fileUrl);
  if (!downloadResp.ok) {
    throw new Error(`Download failed: ${downloadResp.status} ${downloadResp.statusText}`);
  }
  const buffer = Buffer.from(await downloadResp.arrayBuffer());
  const originalBase =
    preferredName ||
    path.basename(filePath) ||
    `telegram_file_${Date.now()}`;
  const safeOriginal = originalBase.replace(/[\\/:*?"<>|]+/g, '_');
  await fs.mkdir('uploads', { recursive: true });
  const storedName = `${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}_${safeOriginal}`;
  const storedPath = path.resolve('uploads', storedName);
  await fs.writeFile(storedPath, buffer);
  return { storedName, originalName: safeOriginal };
}

router.post('/:token?', async (req, res) => {
  res.sendStatus(200);
  let webhookEvent = null;

  try {
    const update = req.body || {};
    assertWebhookPayloadSafe(update);
    const secretHeader = req.get('x-telegram-bot-api-secret-token');

    const normalized = normalizeTelegramUpdate(update);
    const msgObj = normalized?.message;

    if (!msgObj) {
      console.warn('[telegram] update without message, skipping');
      return;
    }

    let text = normalized.text;

    const chatId = msgObj?.chat?.id;
    if (!chatId) return;

    const tokenParam = req.params.token;
    let platform;

    if (tokenParam) {
      platform = await platformsSupabaseRepository.findByToken({ type: 'telegram', token: tokenParam });
      if (!platform) {
        console.warn(`[telegram] no platform found for token: ${tokenParam}`);
        return;
      }
    } else {
      platform = await platformsSupabaseRepository.findLatestByType({ type: 'telegram' });
    }

    if (!verifyTelegramSecret(secretHeader, env.telegramWebhookSecret)) {
      console.warn('[telegram] invalid webhook secret');
      return;
    }

    if (!platform) {
      console.warn('[telegram] no platform/token found');
      return;
    }

    const webhookResult = await beginWebhookEvent({
      provider: 'telegram',
      eventType: normalized.eventType,
      externalEventId: getTelegramEventId(update),
      workspaceId: platform.workspaceId,
      platformId: platform.id,
      payload: update,
          signatureValid: tokenParam ? tokenParam === platform.token : null,
    });
    webhookEvent = webhookResult.event;
    if (webhookResult.duplicate) {
      console.log('[telegram] duplicate webhook ignored:', getTelegramEventId(update));
      return;
    }

    let incomingAttachment = null;
    const sharedLocation = normalized.location || normalized.venue?.location || null;
    if (Array.isArray(msgObj.photo) && msgObj.photo.length > 0) {
      const largestPhoto = msgObj.photo[msgObj.photo.length - 1];
      try {
        const saved = await saveTelegramFileLocally({
          token: platform.token,
          fileId: largestPhoto.file_id,
          preferredName: `photo_${largestPhoto.file_unique_id || Date.now()}.jpg`,
        });
        incomingAttachment = {
          url: buildPublicFileUrl(saved.storedName),
          filename: saved.originalName,
          storedName: saved.storedName,
        };
        if (!text) {
          text = '[Foto dikirim]';
        }
      } catch (e) {
        console.error('[telegram] Failed to store incoming photo:', e);
      }
    } else if (msgObj.document) {
      try {
        const saved = await saveTelegramFileLocally({
          token: platform.token,
          fileId: msgObj.document.file_id,
          preferredName: msgObj.document.file_name || '',
        });
        incomingAttachment = {
          url: buildPublicFileUrl(saved.storedName),
          filename: saved.originalName,
          storedName: saved.storedName,
        };
        if (!text) {
          text = '[Dokumen dikirim]';
        }
      } catch (e) {
        console.error('[telegram] Failed to store incoming document:', e);
      }
    } else if (sharedLocation) {
      if (!text) {
        text = '[Lokasi dibagikan]';
      }
    } else if (msgObj.voice || msgObj.audio) {
      const audioObj = msgObj.voice || msgObj.audio;
      try {
        const ext = msgObj.voice ? '.ogg' : '.mp3'; // Default extensions
        const saved = await saveTelegramFileLocally({
          token: platform.token,
          fileId: audioObj.file_id,
          preferredName: `voice_${audioObj.file_unique_id || Date.now()}${ext}`,
        });
        incomingAttachment = {
          url: buildPublicFileUrl(saved.storedName),
          filename: saved.originalName,
          storedName: saved.storedName,
        };

        // Transcribe the audio file
        if (!text) {
          try {
            const storedPath = path.resolve('uploads', saved.storedName);
            const transcription = await transcribeAudio(storedPath);
            text = transcription;
            console.log('[telegram] Voice note transcribed successfully');
          } catch (transcribeError) {
            console.error('[telegram] Failed to transcribe audio:', transcribeError);
            text = '[Voice Note]'; // Fallback if transcription fails
          }
        }
      } catch (e) {
        console.error('[telegram] Failed to store incoming voice/audio:', e);
      }
    }

    // Find agent for this platform (by platformId, fallback to any agent in workspace)
    const workspaceAgents = await agentsSupabaseRepository.list({ workspaceId: platform.workspaceId });
    let agent = workspaceAgents.find((a) => a.platformId === platform.id);
    if (!agent) agent = workspaceAgents[0] || null;
    const promptRules = getAgentPromptRules(agent);
    const systemRaw = agent?.behavior || promptRules.fallbackSystemPrompt;
    const prompt = agent?.prompt || '';
    const welcome = agent?.welcomeMessage || 'Halo! Ada yang bisa saya bantu?';

    // Upsert contact by platform identity
    const from = msgObj?.chat || {};
    const contactName = [from.first_name, from.last_name].filter(Boolean).join(' ') || from.username || `User ${chatId}`;
    const contact = await contactsSupabaseRepository.upsertByProviderIdentity(
      platform.workspaceId,
      platform.id,
      String(chatId),
      { name: contactName, handle: from.username ? `@${from.username}` : null },
    );

    // Upsert chat by platform + contact
    const chat = await chatsSupabaseRepository.upsertByPlatformContact({
      workspaceId: platform.workspaceId,
      platformId: platform.id,
      contactId: contact.id,
      data: {
        agent_id: agent?.id || null,
        last_message_at: new Date().toISOString(),
      },
    });
    const commerceAction = parseTelegramAction(update.callback_query?.data || '');

    let userMessage = null;
    if (text || incomingAttachment) {
      // Check if this is a reply to another message
      let replyTo = null;
      const replyToMessage = msgObj.reply_to_message;
      if (replyToMessage?.message_id) {
        // Find the original message by platformMessageId
        const originalMsg = await messagesSupabaseRepository.findByPlatformId(
          platform.workspaceId,
          String(replyToMessage.message_id),
        );
        if (originalMsg) replyTo = originalMsg.id;
      }

      userMessage = await recordInboundMessage({
        chat,
        workspaceId: platform.workspaceId,
        text: text || '',
        attachment: incomingAttachment,
        platformMessageId: String(msgObj.message_id),
        replyTo,
      });
    }

    if (commerceAction) {
      const commerceResponse = await handleTelegramCommerceAction({
        action: commerceAction,
        workspaceId: platform.workspaceId,
        chat,
        contact,
        agent,
        chatMessageId: userMessage?.id || null,
      });

      if (commerceResponse) {
        await tgSend(platform.token, chatId, commerceResponse.text, null, { replyMarkup: commerceResponse.keyboard });
        await recordOutboundMessage({
          chatId: chat.id,
          workspaceId: platform.workspaceId,
          from: 'ai',
          text: commerceResponse.text,
        });
        await markWebhookProcessed(webhookEvent);
        return;
      }
    }

    if (sharedLocation && userMessage) {
      try {
        const nearestReply = await buildNearestOutletReplyFromCoordinates({
          workspaceId: platform.workspaceId,
          latitude: sharedLocation.latitude,
          longitude: sharedLocation.longitude,
        });

        if (nearestReply) {
          await tgSendSplit(platform.token, chatId, nearestReply);
          await recordOutboundMessage({
            chatId: chat.id,
            workspaceId: platform.workspaceId,
            from: 'ai',
            text: nearestReply,
          });
          await markWebhookProcessed(webhookEvent);
          return;
        }
      } catch (e) {
        console.error('[telegram] Failed to resolve nearest outlet from shared location:', e);
      }
    }

    if (!sharedLocation && userMessage && text) {
      try {
        const nearestReply = await buildNearestOutletReplyFromText({
          workspaceId: platform.workspaceId,
          text,
        });

        if (nearestReply) {
          await tgSendSplit(platform.token, chatId, nearestReply);
          await recordOutboundMessage({
            chatId: chat.id,
            workspaceId: platform.workspaceId,
            from: 'ai',
            text: nearestReply,
          });
          await markWebhookProcessed(webhookEvent);
          return;
        }
      } catch (e) {
        console.error('[telegram] Failed to resolve nearest outlet from text location:', e);
      }
    }

    // Human takeover check
    if (chat.takenOverByUserId || chat.takeoverBy) {
      const takeoverUser = chat.takenOverByUserId || chat.takeoverBy;
      console.log(`[telegram] chat ${chat.id} is handled by human (takeoverBy: ${takeoverUser}), skipping AI reply.`);
      await markWebhookProcessed(webhookEvent);
      return;
    } else {
      console.log(`[telegram] chat ${chat.id} is NOT handled by human, proceeding to AI reply.`);
    }

    const isStartCommand = text?.trim() === '/start';

    // ── Commerce intent: AI handles naturally with tools behind ─────────
    // When user messages indicate ordering intent, AI will use search_products,
    // add_cart_item, select_outlet, and create_order tools.
    // No buttons — pure natural conversation. AI asks for confirmation,
    // user types "iya", AI executes checkout → Xendit link sent.

    // Compute greeting flags (before AI processing)
    const chatHistoryForGreeting = await loadRecentMessages({ chatId: chat.id, limit: 5 });
    const { greetingFlags: computedGreetingFlags } = await buildContext({
      chat,
      agent: agent ? { ...agent, displayName: agent.name } : null,
      recentMessages: chatHistoryForGreeting,
    });

    if (computedGreetingFlags.isFirstAssistantMessageInChat && !isStartCommand) {
      const processedWelcome = welcome.replace('{{name}}', contact.name);
      let sentWelcome = { text: processedWelcome, attachment: null };
      try {
        sentWelcome = await sendTelegramTextOrDatabaseAttachment({
          token: platform.token,
          chatId,
          text: processedWelcome,
          agent,
          sendTextOptions: { replyMarkup: null },
        });
      } catch (e) {
        console.error('[telegram] Failed to send welcome message:', e);
      }
      await messagesSupabaseRepository.create({
        workspaceId: platform.workspaceId,
        chatId: chat.id,
        platformId: platform.id,
        contactId: contact.id,
        senderType: 'ai',
        direction: 'outbound',
        messageType: sentWelcome.messageType || 'text',
        content: sentWelcome.text,
        rawPayload: sentWelcome.attachment ? { attachment: sentWelcome.attachment } : {},
      });
      if (agent && agent.stickerUrl) {
        try {
          const stickerUrl = `${process.env.PUBLIC_BASE_URL}${agent.stickerUrl}`;
          await tgSendSticker(platform.token, chatId, stickerUrl);
        } catch (e) {
          console.error('[telegram] Sticker error:', e);
        }
      }
      await markWebhookProcessed(webhookEvent);
      return;
    }

    // Handle /start command specially
    if (isStartCommand) {
      const processedWelcome = welcome.replace('{{name}}', contact.name);
      let sentWelcome = { text: processedWelcome, attachment: null };
      try {
        sentWelcome = await sendTelegramTextOrDatabaseAttachment({
          token: platform.token,
          chatId,
          text: processedWelcome,
          agent,
        });
        await messagesSupabaseRepository.create({
          workspaceId: platform.workspaceId,
          chatId: chat.id,
          platformId: platform.id,
          contactId: contact.id,
          senderType: 'ai',
          direction: 'outbound',
          messageType: sentWelcome.messageType || 'text',
          content: sentWelcome.text,
          rawPayload: sentWelcome.attachment ? { attachment: sentWelcome.attachment } : {},
        });

        if (agent && agent.stickerUrl) {
          try {
            const stickerUrl = `${process.env.PUBLIC_BASE_URL}${agent.stickerUrl}`;
            await tgSendSticker(platform.token, chatId, stickerUrl);
          } catch (e) {
            console.error('[telegram] Sticker error:', e);
          }
        }
      } catch (e) {
        console.error('[telegram] Failed to send welcome message for /start:', e);
      }
      await markWebhookProcessed(webhookEvent);
      return;
    }

    if (userMessage) {
      const fileResponse = await findAndSendFile({
        agent,
        message: userMessage,
        openaiClient,
        geminiClient,
      });

      if (fileResponse) {
        const { text: replyText, attachment } = fileResponse;
        if (attachment && attachment.storedName) {
          const localFilePath = path.resolve('uploads', attachment.storedName);
          try {
            await tgSendDocument(
              platform.token,
              chatId,
              localFilePath,
              replyText,
            );
          } catch (e) {
            console.error(
              '[telegram] Failed to send document from fileResponse:',
              e,
            );
          }
        } else {
          try {
            await tgSendSplit(platform.token, chatId, replyText);
          } catch (e) {
            console.error(
              '[telegram] Failed to send text from fileResponse:',
              e,
            );
          }
        }
        await recordOutboundMessage({
          chatId: chat.id,
          workspaceId: platform.workspaceId,
          from: 'ai',
          text: replyText,
          attachment: fileResponse.attachment || null,
        });
        await markWebhookProcessed(webhookEvent);
        return;
      }

      let reply;
      try {
        const history = await loadRecentMessages({ chatId: chat.id });
        let system = systemRaw;
        let aiPrompt = prompt;

        if (!computedGreetingFlags.isFirstAssistantMessageInChat) {
          system = `${systemRaw}\n\n${promptRules.noReintroInstruction}`;
        }

        reply = await generateAIReply({
          system,
          prompt: aiPrompt,
          message: userMessage,
          knowledge: agent?.knowledge,
          agent,
          chat,
          history,
        });
      } catch (e) {
        console.error('[telegram] AI error:', e);
        reply = { text: `Echo: ${userMessage.text}` };
      }

      let replyText = typeof reply === 'string' ? reply : reply?.text;
      const cartItemAdded = typeof reply === 'object' ? (reply?.cartItemAdded || false) : false;
      const attachment =
        typeof reply === 'object' && reply.attachment ? reply.attachment : null;

      const mention = findDatabaseFileMention(replyText, agent);
      if (mention && mention.file?.storedName) {
        let sentReply = { text: replyText, attachment: null, messageType: 'text' };
        let documentSent = false;
        try {
          sentReply = await sendTelegramTextOrDatabaseAttachment({
            token: platform.token,
            chatId,
            text: replyText,
            agent,
          });
          documentSent = true;
        } catch (e) {
          console.error(
            '[telegram] Failed to send document from markdown mention:',
            e,
          );
          if (replyText) {
            try {
              await tgSendSplit(platform.token, chatId, replyText);
            } catch (innerError) {
              console.error(
                '[telegram] Fallback text send failed after markdown mention:',
                innerError,
              );
            }
          }
        }

        await recordOutboundMessage({
          chatId: chat.id,
          workspaceId: platform.workspaceId,
          from: 'ai',
          text: sentReply.text,
          attachment: documentSent ? sentReply.attachment : null,
          messageType: documentSent ? sentReply.messageType : 'text',
        });

        if (documentSent) {
          await markWebhookProcessed(webhookEvent);
          return;
        }
      }

      // Check for external file URL mention
      const urlMention = findUrlFileMention(replyText);
      if (urlMention) {
        const { url, token, altText } = urlMention;
        console.log(`[telegram] Found external file URL: ${url}`);

        const cleanedText = (replyText || '').replace(token, altText || '').trim();
        const caption = cleanedText || altText || '';

        try {
          // Download file
          const { filePath, filename, originalName } = await downloadFile(url);
          console.log(`[telegram] Downloaded file to: ${filePath}`);

          // Determine file type
          const ext = path.extname(filename).toLowerCase();
          const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
          const isVideo = ['.mp4', '.mov', '.avi'].includes(ext);

          // Send text first (if any)
          if (caption && caption.length > 0) {
            await tgSendSplit(platform.token, chatId, caption);
          }

          // Then send file separately
          if (isImage) {
            await tgSendPhoto(platform.token, chatId, filePath);
          } else if (isVideo) {
            await tgSendVideo(platform.token, chatId, filePath);
          } else {
            await tgSendDocument(platform.token, chatId, filePath);
          }

          // Delete temp file
          fs.unlink(filePath).catch(err => console.error('[telegram] Failed to delete temp file:', err));

          // Save message
          await recordOutboundMessage({
            chatId: chat.id,
            workspaceId: platform.workspaceId,
            from: 'ai',
            text: caption || 'File sent',
            attachment: { url, filename: originalName },
          });

          await markWebhookProcessed(webhookEvent);
          return; // Stop processing, file sent
        } catch (e) {
          console.error('[telegram] Failed to send external file:', e);
          // Fallback to sending text with link if download/send fails
        }
      }

      if (attachment && attachment.storedName) {
        const localFilePath = path.resolve('uploads', attachment.storedName);
        try {
          await tgSendDocument(platform.token, chatId, localFilePath, replyText);
        } catch (e) {
          console.error('[telegram] Failed to send document reply:', e);
        }
      } else if (replyText) {
        try {
          await tgSendSplit(platform.token, chatId, replyText);
        } catch (e) {
          console.error('[telegram] Failed to send text reply:', e);
        }
      }

      if (replyText || attachment) {
        await recordOutboundMessage({
          chatId: chat.id,
          workspaceId: platform.workspaceId,
          from: 'ai',
          text: replyText || '[Attachment]',
          attachment,
        });
      }

      // ── Show checkout button ONLY when add_cart_item was called this turn ──
      const contactId = typeof chat?.contactId === 'object' ? chat.contactId?.id : chat?.contactId;
      console.log(`[checkout-btn] replyText=${!!replyText} contactId=${contactId} cartItemAdded=${cartItemAdded}`);
      if (replyText && contactId && cartItemAdded) {
        try {
          const currentOutletId = chat.currentOutletId || contact.lastOutletId || null;
          const cart = currentOutletId
            ? await cartsRepository.findActiveByContact({ workspaceId: platform.workspaceId, contactId, outletId: currentOutletId })
            : null;
          console.log(`[checkout-btn] cart=${cart ? `id=${cart.id} status=${cart.status} items=${cart.items?.length}` : 'null'}`);
          if (cart && cart.items?.length > 0 && !['converted', 'cancelled'].includes(cart.status)) {
            const {
              COMMERCE_VERSION,
              buildCallbackKey,
            } = await import('../../services/telegram-commerce.service.js');
            const { createInlineKeyboard } = await import('../../integrations/telegram/telegram-keyboards.js');
            const checkout = await checkoutsRepository.create({
              workspaceId: platform.workspaceId, outletId: cart.outletId,
              contactId, chatId: chat.id, cartId: cart.id, items: cart.items,
              subtotalAmount: cart.total, totalAmount: cart.total,
              currency: 'IDR', idempotencyKey: `tg_checkout_${cart.id}_${Date.now()}`,
              status: 'pending',
              customerSnapshot: { contactName: contact?.name || '' },
              fulfillmentSnapshot: { method: 'pickup', outletName: cart.outletName || '' },
            });

            const ver = COMMERCE_VERSION;
            const checkoutPrompt = 'Silakan klik tombol di bawah untuk checkout dan dapatkan link pembayaran:';
            await tgSend(platform.token, chatId, checkoutPrompt, null, {
              replyMarkup: createInlineKeyboard([
                [{ text: '✅ Checkout & Dapatkan Link Bayar', callback_data: `${buildCallbackKey('checkout', 'confirm', String(checkout.id), ver)}` }],
                [{ text: '🛒 Lihat Keranjang', callback_data: `${buildCallbackKey('cart', 'view', null, ver)}` }],
              ]),
            });
            await recordOutboundMessage({ chatId: chat.id, workspaceId: platform.workspaceId, from: 'ai', text: checkoutPrompt });
          }
        } catch (checkoutBtnErr) {
          console.error('[telegram] Failed to show checkout button:', checkoutBtnErr);
        }
      }
    }
    await markWebhookProcessed(webhookEvent);
  } catch (err) {
    await markWebhookFailed(webhookEvent, err);
    console.error('Webhook /telegram error:', err);
  }
});

export default router;
