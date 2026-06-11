import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import Platform from '../../models/Platform.js';
import Agent from '../../models/Agent.js';
import Chat from '../../models/Chat.js';
import Message from '../../models/Message.js';
import Contact from '../../models/Contact.js';
import { generateAIReply, findAndSendFile, transcribeAudio } from '../../services/ai.js';
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
import { downloadFile } from '../../utils/downloader.js';

const router = express.Router();

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

  try {
    const update = req.body || {};
    console.log('[telegram] update:', JSON.stringify(update));

    const msgObj =
      update.message ||
      update.edited_message ||
      (update.callback_query && update.callback_query.message);

    if (!msgObj) {
      console.warn('[telegram] update without message, skipping');
      return;
    }

    let text =
      update.message?.text ||
      update.edited_message?.text ||
      update.callback_query?.data ||
      msgObj.caption ||
      '';

    const chatId = msgObj?.chat?.id;
    if (!chatId) return;

    const tokenParam = req.params.token;
    let platform;

    if (tokenParam) {
      platform = await Platform.findOne({
        type: 'telegram',
        token: tokenParam,
      });
      if (!platform) {
        console.warn(`[telegram] no platform found for token: ${tokenParam}`);
        return;
      }
    } else {
      platform = await Platform.findOne({
        type: 'telegram',
        token: { $exists: true, $ne: '' },
      }).sort({ createdAt: -1 });
    }

    if (!platform) {
      console.warn('[telegram] no platform/token found');
      return;
    }

    let incomingAttachment = null;
    if (Array.isArray(msgObj.photo) && msgObj.photo.length > 0) {
      const largestPhoto = msgObj.photo[msgObj.photo.length - 1];
      try {
        const saved = await saveTelegramFileLocally({
          token: platform.token,
          fileId: largestPhoto.file_id,
          preferredName: `photo_${largestPhoto.file_unique_id || Date.now()}.jpg`,
        });
        incomingAttachment = {
          url: `/files/${saved.storedName}`,
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
          url: `/files/${saved.storedName}`,
          filename: saved.originalName,
          storedName: saved.storedName,
        };
        if (!text) {
          text = '[Dokumen dikirim]';
        }
      } catch (e) {
        console.error('[telegram] Failed to store incoming document:', e);
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
          url: `/files/${saved.storedName}`,
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

    let agent = await Agent.findOne({ platformId: platform._id });
    if (!agent) {
      agent = await Agent.findOne({ workspaceId: platform.workspaceId }).sort({
        createdAt: 1,
      });
    }
    const system = agent?.behavior || 'You are a helpful assistant.';
    const prompt = agent?.prompt || '';
    const welcome = agent?.welcomeMessage || 'Halo! Ada yang bisa saya bantu?';

    let contact = await Contact.findOne({
      userId: platform.userId,
      platformAccountId: String(chatId),
    });
    if (!contact) {
      const from = msgObj?.chat || {};
      const name =
        [from.first_name, from.last_name].filter(Boolean).join(' ') ||
        from.username ||
        `User ${chatId}`;
      contact = await Contact.create({
        userId: platform.userId,
        workspaceId: platform.workspaceId,
        name,
        platformType: 'telegram',
        platformAccountId: String(chatId),
        handle: from.username ? `@${from.username}` : '',
        lastSeen: new Date(),
      });
    }

    let chat = await Chat.findOne({
      userId: platform.userId,
      platformId: platform._id,
      contactId: contact._id,
    });
    const isNewChat = !chat;
    if (!chat) {
      chat = await Chat.create({
        userId: platform.userId,
        workspaceId: platform.workspaceId,
        platformId: platform._id,
        platformType: 'telegram',
        contactId: contact._id,
        agentId: agent?._id || null,
        lastMessageAt: new Date(),
      });
    } else if (!chat.agentId && agent) {
      chat.agentId = agent._id;
      await chat.save();
    }

    let userMessage = null;
    if (text || incomingAttachment) {
      // Check if this is a reply to another message
      let replyTo = null;
      const replyToMessage = msgObj.reply_to_message;
      if (replyToMessage && replyToMessage.message_id) {
        // Find the original message by platformMessageId
        const originalMsg = await Message.findOne({
          platformMessageId: String(replyToMessage.message_id),
          chatId: chat._id
        });
        if (originalMsg) {
          replyTo = originalMsg._id;
        }
      }

      userMessage = await Message.create({
        chatId: chat._id,
        workspaceId: platform.workspaceId,
        from: 'user',
        text: text || '',
        attachment: incomingAttachment,
        platformMessageId: String(msgObj.message_id), // Store Telegram message_id
        replyTo: replyTo, // Link to replied message
        createdAt: new Date(),
      });
      await Chat.updateOne(
        { _id: chat._id },
        {
          $set: {
            lastMessageAt: new Date(),
            status: 'open',
            isEscalated: false
          },
          $inc: { unread: 1 }
        },
      );
    }

    if (chat.takeoverBy) {
      console.log(
        `[telegram] chat ${chat._id} is handled by human (takeoverBy: ${chat.takeoverBy}), skipping AI reply.`,
      );
      return;
    } else {
      console.log(`[telegram] chat ${chat._id} is NOT handled by human (takeoverBy: ${chat.takeoverBy}), proceeding to AI reply.`);
    }

    // Send welcome message for new chats, but not for /start command
    // (we'll handle /start separately below)
    const isStartCommand = text.trim() === '/start';
    if (isNewChat && !isStartCommand) {
      const processedWelcome = welcome.replace('{{name}}', contact.name);
      try {
        await tgSend(platform.token, chatId, processedWelcome);
      } catch (e) {
        console.error('[telegram] Failed to send welcome message:', e);
      }
      await Message.create({
        chatId: chat._id,
        workspaceId: platform.workspaceId,
        from: 'ai',
        text: processedWelcome,
        createdAt: new Date(),
      });

      if (agent && agent.stickerUrl) {
        try {
          const stickerUrl = `${process.env.PUBLIC_BASE_URL}${agent.stickerUrl}`;
          await tgSendSticker(platform.token, chatId, stickerUrl);
        } catch (e) {
          console.error('[telegram] Sticker error:', e);
        }
      }
    }


    // Handle /start command specially
    if (isStartCommand) {
      const processedWelcome = welcome.replace('{{name}}', contact.name);
      try {
        await tgSend(platform.token, chatId, processedWelcome);
        await Message.create({
          chatId: chat._id,
          workspaceId: platform.workspaceId,
          from: 'ai',
          text: processedWelcome,
          createdAt: new Date(),
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
      return; // Don't process /start as a regular message
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
        await Message.create({
          chatId: chat._id,
          workspaceId: platform.workspaceId,
          from: 'ai',
          text: replyText,
          attachment: fileResponse.attachment || null,
          createdAt: new Date(),
        });
        return;
      }

      let reply;
      try {
        const history = await Message.find({ chatId: chat._id })
          .sort({ createdAt: -1 })
          .limit(10);
        history.reverse();
        reply = await generateAIReply({
          system,
          prompt,
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

      let replyText = typeof reply === 'string' ? reply : reply.text;
      const attachment =
        typeof reply === 'object' && reply.attachment ? reply.attachment : null;

      const mention = findDatabaseFileMention(replyText, agent);
      if (mention && mention.file?.storedName) {
        const { file, token, altText } = mention;
        const cleanedText = (replyText || '')
          .replace(token, altText || '')
          .trim();
        const caption = cleanedText || altText || '';
        const localFilePath = path.resolve('uploads', file.storedName);
        let documentSent = false;
        try {
          await tgSendDocument(
            platform.token,
            chatId,
            localFilePath,
            caption || undefined,
          );
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

        const savedText =
          cleanedText || altText || replyText || 'Lampiran terkirim.';
        await Message.create({
          chatId: chat._id,
          workspaceId: platform.workspaceId,
          from: 'ai',
          text: savedText,
          attachment: documentSent
            ? {
              url: `/files/${file.storedName}`,
              filename: file.originalName || file.storedName,
            }
            : null,
          createdAt: new Date(),
        });

        if (documentSent) return;
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
          await Message.create({
            chatId: chat._id,
            workspaceId: platform.workspaceId,
            from: 'ai',
            text: caption || 'File sent',
            attachment: {
              url: url,
              filename: originalName,
            },
            createdAt: new Date(),
          });

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
        await Message.create({
          chatId: chat._id,
          workspaceId: platform.workspaceId,
          from: 'ai',
          text: replyText || '[Attachment]',
          attachment,
          createdAt: new Date(),
        });
      }
    }
  } catch (err) {
    console.error('Webhook /telegram error:', err);
  }
});

export default router;
