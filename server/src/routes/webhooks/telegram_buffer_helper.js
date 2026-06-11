import express from 'express';
import path from 'path';
import { promises as fs } from 'fs';
import Platform from '../../models/Platform.js';
import Agent from '../../models/Agent.js';
import Chat from '../../models/Chat.js';
import Message from '../../models/Message.js';
import Contact from '../../models/Contact.js';
import { generateAIReply, findAndSendFile } from '../../services/ai.js';
import { openaiClient, geminiClient } from '../../services/aiClient.js';
import {
    tgSend,
    tgSendDocument,
    tgSendSticker,
} from '../../services/sender.js';
import { findDatabaseFileMention } from '../../utils/fileMentions.js';
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

    // Generate AI reply
    let reply;
    try {
        const history = await Message.find({ chatId: chat._id })
            .sort({ createdAt: -1 })
            .limit(10);
        history.reverse();

        const system = agent?.behavior || 'You are a helpful assistant.';
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

        await Message.create({
            chatId: chat._id,
            workspaceId: platform.workspaceId,
            from: 'ai',
            text: caption,
            attachment: {
                url: `/files/${file.storedName}`,
                filename: file.originalName || file.storedName,
                storedName: file.storedName,
            },
            createdAt: new Date(),
        });
    } else if (attachment && attachment.storedName) {
        const localFilePath = path.resolve('uploads', attachment.storedName);
        try {
            await tgSendDocument(platform.token, chat.platformChatId, localFilePath, replyText);
        } catch (e) {
            console.error('[telegram] Failed to send attachment:', e);
        }

        await Message.create({
            chatId: chat._id,
            workspaceId: platform.workspaceId,
            from: 'ai',
            text: replyText,
            attachment,
            createdAt: new Date(),
        });
    } else {
        try {
            await tgSend(platform.token, chat.platformChatId, replyText);
        } catch (e) {
            console.error('[telegram] Failed to send text:', e);
        }

        await Message.create({
            chatId: chat._id,
            workspaceId: platform.workspaceId,
            from: 'ai',
            text: replyText,
            createdAt: new Date(),
        });
    }
}
