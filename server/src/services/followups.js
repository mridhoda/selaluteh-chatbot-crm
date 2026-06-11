import cron from 'node-cron';
import Agent from '../models/Agent.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { tgSend, waSend } from '../services/sender.js';
import { generateAIReply } from './ai.js';

export function start() {
  // Schedule a cron job to run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const chats = await Chat.find({
        'state.followUp': { $exists: true },
      }).populate('agentId').populate('platformId').populate('contactId');

      if (chats.length > 0) {
        console.log(`[followups] Found ${chats.length} chats with pending follow-ups.`);
      }

      for (const chat of chats) {
        const followUp = chat.state.followUp;
        const delayInMs = (parseInt(followUp.delay, 10) || 1) * 60 * 1000;

        if (new Date(followUp.triggeredAt).getTime() + delayInMs > Date.now()) {
          continue; // Follow-up not due yet
        }

        const agent = chat.agentId;

        const messages = await Message.find({ chatId: chat._id }).sort({ createdAt: 1 }).limit(10);
        const history = messages.map(m => `${m.from}: ${m.text}`).join('\n');

        const new_prompt = `Your task is to follow an instruction based on a chat history.\nInstruction: \"${followUp.prompt}\"\nYou must follow the instruction. If the instruction's condition is met by the history, you must generate the message to send.\nIf the condition is not met, reply with the exact string \"NO_REPLY\".\n\nInstruction: \"${followUp.prompt}\"\n\nChat History:\n${history}`;

        const reply = await generateAIReply({
          system: '', // System prompt is now part of the main prompt
          prompt: new_prompt,
          message: '', // No new message from the user
          knowledge: [], // No knowledge needed for this
          agent,
          chat,
        });

        console.log(`[followups] AI reply for chat ${chat._id}:`, reply);

        if (reply && reply.trim() !== 'NO_REPLY') {
          console.log(`[followups] Sending follow-up to chat ${chat._id}.`);
          // Send the follow-up message
          if (chat.platformType === 'telegram') {
            await tgSend(chat.platformId.token, chat.contactId.platformAccountId, reply);
          } else if (chat.platformType === 'whatsapp') {
            await waSend(chat.platformId.token, chat.platformId.phoneNumberId, chat.contactId.platformAccountId, reply);
          }

          // Create a new message in the chat
          await Message.create({
            chatId: chat._id,
            workspaceId: chat.workspaceId,
            from: 'ai',
            text: reply,
          });
        } else {
          console.log(`[followups] AI decided not to reply to chat ${chat._id}.`);
        }

        // Clear the follow-up state
        await Chat.updateOne({ _id: chat._id }, { $unset: { 'state.followUp': '' } });
      }
    } catch (error) {
      console.error('Error in follow-up cron job:', error);
    }
  });
}