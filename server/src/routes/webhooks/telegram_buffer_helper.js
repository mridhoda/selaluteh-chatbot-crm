import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import { messagesSupabaseRepository } from '../../db/repositories/index.js';
import { generateAIReply, findAndSendFile, getAgentPromptRules } from '../../services/ai.service.js';
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
import { bufferMessage, getAndClearBuffer, clearBuffer } from '../../services/messageBuffer.js';
const router = express.Router();

// Process buffered messages for a chat
async function processBufferedAIReply(chatId) {
    const buffer = getAndClearBuffer(chatId);
    if (!buffer) return;

    const { messages, agent, chat, platform } = buffer;

    // Combine all buffered messages
    const combinedText = messages.join('\n');
    console.log(`[telegram] Processing ${messages.length} buffered messages for chat ${chatId}`);

    // Create combined user message object
    const userMessage = { text: combinedText };

    // Check for file response first
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
                    chat.platformChatId,
                    localFilePath,
                    replyText,
                );
            } catch (e) {
                console.error('[telegram] Failed to send document from fileResponse:', e);
            }
        } else {
            try {
                await tgSend(platform.token, chat.platformChatId, replyText);
            } catch (e) {
                console.error('[telegram] Failed to send text from fileResponse:', e);
            }
        }
        await messagesSupabaseRepository.create({
            workspaceId: platform.workspaceId,
            chatId: chat.id,
            platformId: platform.id,
            contactId: chat.contactId,
            senderType: 'ai',
            direction: 'outbound',
            messageType: 'text',
            content: replyText,
            rawPayload: fileResponse.attachment ? { attachment: fileResponse.attachment } : undefined,
        });
        return;
    }

    // Generate AI reply
    let reply;
    try {
        const history = await messagesSupabaseRepository.listByChatId(chat.id, { limit: 10 });

        const promptRules = getAgentPromptRules(agent);
        const system = agent?.behavior || promptRules.fallbackSystemPrompt;
        const prompt = agent?.prompt || '';

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
        reply = { text: `Echo: ${combinedText}` };
    }

    let replyText = typeof reply === 'string' ? reply : reply.text;
    const attachment = typeof reply === 'object' && reply.attachment ? reply.attachment : null;

    // Check for database file mention
    const mention = findDatabaseFileMention(replyText, agent);
    const urlMention = findUrlFileMention(replyText);

    if (mention && mention.file?.storedName) {
        const { file, token, altText } = mention;
        const cleanedText = (replyText || '').replace(token, altText || '').trim();
        const caption = cleanedText || altText || '';
        const localFilePath = path.resolve('uploads', file.storedName);

        try {
            await tgSendDocument(platform.token, chat.platformChatId, localFilePath, caption);
        } catch (e) {
            console.error('[telegram] Failed to send database file:', e);
        }

        await messagesSupabaseRepository.create({
            workspaceId: platform.workspaceId,
            chatId: chat.id,
            platformId: platform.id,
            contactId: chat.contactId,
            senderType: 'ai',
            direction: 'outbound',
            messageType: 'text',
            content: caption,
            rawPayload: { attachment: {
                url: `/files/${file.storedName}`,
                filename: file.originalName || file.storedName,
                storedName: file.storedName,
            }},
        });
    } else if (urlMention) {
        const { url, token, altText } = urlMention;
        const cleanedText = (replyText || '').replace(token, altText || '').trim();
        const caption = cleanedText || altText || '';

        try {
            const { filePath, filename } = await downloadFile(url);
            const ext = path.extname(filename).toLowerCase();
            const isImage = ['.jpg', '.jpeg', '.png', '.webp'].includes(ext);
            const isVideo = ['.mp4', '.mov', '.avi'].includes(ext);

            if (caption && caption.length > 0) {
                await tgSendSplit(platform.token, chat.platformChatId, caption);
            }

            if (isImage) {
                await tgSendPhoto(platform.token, chat.platformChatId, filePath);
            } else if (isVideo) {
                await tgSendVideo(platform.token, chat.platformChatId, filePath);
            } else {
                await tgSendDocument(platform.token, chat.platformChatId, filePath);
            }

            fs.unlink(filePath).catch(err => console.error('[telegram] Failed to delete temp file:', err));

            await messagesSupabaseRepository.create({
                workspaceId: platform.workspaceId,
                chatId: chat.id,
                platformId: platform.id,
                contactId: chat.contactId,
                senderType: 'ai',
                direction: 'outbound',
                messageType: isImage ? 'image' : isVideo ? 'video' : 'document',
                content: caption,
                rawPayload: { attachment: { url: `/files/${filename}`, filename, storedName: filename } },
            });
        } catch (e) {
            console.error('[telegram] Failed to send external file:', e);
            if (replyText) {
                try {
                    await tgSendSplit(platform.token, chat.platformChatId, replyText);
                } catch (innerError) {
                    console.error('[telegram] Fallback text send failed:', innerError);
                }
            }
        }
    } else if (attachment && attachment.storedName) {
        const localFilePath = path.resolve('uploads', attachment.storedName);
        try {
            await tgSendDocument(platform.token, chat.platformChatId, localFilePath, replyText);
        } catch (e) {
            console.error('[telegram] Failed to send attachment:', e);
        }

        await messagesSupabaseRepository.create({
            workspaceId: platform.workspaceId,
            chatId: chat.id,
            platformId: platform.id,
            contactId: chat.contactId,
            senderType: 'ai',
            direction: 'outbound',
            messageType: 'text',
            content: replyText,
            rawPayload: { attachment },
        });
    } else {
        try {
            await tgSend(platform.token, chat.platformChatId, replyText);
        } catch (e) {
            console.error('[telegram] Failed to send text:', e);
        }

        await messagesSupabaseRepository.create({
            workspaceId: platform.workspaceId,
            chatId: chat.id,
            platformId: platform.id,
            contactId: chat.contactId,
            senderType: 'ai',
            direction: 'outbound',
            messageType: 'text',
            content: replyText,
        });
    }
}
