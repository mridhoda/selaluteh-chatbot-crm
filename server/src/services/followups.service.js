/**
 * followups.service.js — Supabase-backed
 *
 * Background cron job for AI follow-up messages.
 * Migrated from Mongoose Agent/Chat/Message models to Supabase repositories.
 *
 * NOTE: Follow-up state is stored in chats.state JSONB column.
 * Postgres queries for JSONB path: state->>'followUp' is not null.
 */

import cron from 'node-cron';
import { getSupabaseServiceClient } from '../db/supabase.js';
import {
  agentsSupabaseRepository,
  messagesSupabaseRepository,
} from '../db/repositories/index.js';
import { tgSend, waSend } from '../services/sender.js';
import { generateAIReply } from './ai.service.js';
import { decrypt } from '../utils/encryption.js';

export function start() {
  cron.schedule('* * * * *', async () => {
    try {
      const client = getSupabaseServiceClient();

      // Find chats with a pending followUp state in the state JSONB column
      const { data: chats, error } = await client
        .from('chats')
        .select('*, platforms(id, type, token_encrypted, phone_number_id), contacts(id, external_id)')
        .not('state', 'is', null)
        .filter('state->followUp', 'not.is', null);

      if (error) {
        console.error('[followups] Error fetching chats:', error);
        return;
      }

      if (chats?.length > 0) {
        console.log(`[followups] Found ${chats.length} chats with pending follow-ups.`);
      }

      for (const chat of chats ?? []) {
        const followUp = chat.state?.followUp;
        if (!followUp) continue;

        const delayInMs = (parseInt(followUp.delay, 10) || 1) * 60 * 1000;
        if (new Date(followUp.triggeredAt).getTime() + delayInMs > Date.now()) {
          continue; // Follow-up not due yet
        }

        // Fetch the agent for this chat
        const agent = chat.agent_id ? await agentsSupabaseRepository.findByIdRaw(chat.agent_id) : null;

        // Get recent message history
        const messages = await messagesSupabaseRepository.listByChatId(chat.id, { limit: 10 });
        const history = messages.map((m) => `${m.senderType}: ${m.content || ''}`).join('\n');

        const new_prompt = `Your task is to follow an instruction based on a chat history.\nInstruction: "${followUp.prompt}"\nYou must follow the instruction. If the instruction's condition is met by the history, you must generate the message to send.\nIf the condition is not met, reply with the exact string "NO_REPLY".\n\nInstruction: "${followUp.prompt}"\n\nChat History:\n${history}`;

        const reply = await generateAIReply({
          system: '',
          prompt: new_prompt,
          message: '',
          knowledge: [],
          agent,
          chat: { ...chat, id: chat.id, workspaceId: chat.workspace_id },
        });

        console.log(`[followups] AI reply for chat ${chat.id}:`, reply);

        if (reply && reply.trim() !== 'NO_REPLY') {
          console.log(`[followups] Sending follow-up to chat ${chat.id}.`);

          const platform = chat.platforms;
          const contact = chat.contacts;

          let decryptedToken = '';
          if (platform?.token_encrypted) {
            try {
              decryptedToken = decrypt(platform.token_encrypted);
            } catch (e) {
              console.error('[followups] Decryption failed for platform token:', e);
            }
          }

          if (platform?.type === 'telegram' && decryptedToken && contact?.external_id) {
            await tgSend(decryptedToken, contact.external_id, reply);
          } else if (platform?.type === 'whatsapp' && decryptedToken && platform.phone_number_id && contact?.external_id) {
            await waSend(decryptedToken, platform.phone_number_id, contact.external_id, reply);
          }

          // Save follow-up reply as a message
          await messagesSupabaseRepository.create({
            workspaceId: chat.workspace_id,
            chatId: chat.id,
            platformId: chat.platform_id,
            contactId: chat.contact_id,
            senderType: 'ai',
            direction: 'outbound',
            messageType: 'text',
            content: reply,
          });
        } else {
          console.log(`[followups] AI decided not to reply to chat ${chat.id}.`);
        }

        // Clear the followUp state from the chat
        const currentState = chat.state || {};
        delete currentState.followUp;
        await client.from('chats').update({ state: currentState }).eq('id', chat.id);
      }
    } catch (error) {
      console.error('Error in follow-up cron job:', error);
    }
  });
}
