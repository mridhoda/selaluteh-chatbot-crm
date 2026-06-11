import express from 'express';
import Order from '../models/Order.js';
import Message from '../models/Message.js';
import Chat from '../models/Chat.js';
import Platform from '../models/Platform.js';
import Contact from '../models/Contact.js';
import { tgSend, waSend, igSend } from '../services/sender.js';

const router = express.Router();

// Get all orders (with filters)
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        const query = {};
        if (status) query.status = status;

        const orders = await Order.find(query)
            .populate('contactId', 'name phone')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Cancel order with reason
router.put('/:id/cancel', async (req, res) => {
    try {
        const { reason } = req.body;

        if (!reason || !reason.trim()) {
            return res.status(400).json({ error: 'Alasan pembatalan harus diisi' });
        }

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            {
                status: 'cancelled',
                notes: reason
            },
            { new: true }
        ).populate('chatId').populate('contactId');

        if (!order) {
            return res.status(404).json({ error: 'Order tidak ditemukan' });
        }

        // Send cancellation message to client
        try {
            const chat = await Chat.findById(order.chatId._id).populate('platformId').populate('contactId');
            if (chat && chat.platformId && chat.contactId) {
                const platform = chat.platformId;
                const contact = chat.contactId;

                const messageText = `Maaf, pesanan Anda dibatalkan.\nAlasan: ${reason}\n\nSilakan hubungi kami jika ada pertanyaan.`;
                let sentMessageId = null;

                // Send Message based on platform
                if (platform.type === 'telegram') {
                    const result = await tgSend(platform.token, contact.platformAccountId, messageText);
                    sentMessageId = result.result?.message_id?.toString();
                } else if (platform.type === 'whatsapp') {
                    const result = await waSend(platform.token, platform.phoneNumberId, contact.platformAccountId, messageText);
                    sentMessageId = result.messages?.[0]?.id;
                } else if (platform.type === 'instagram') {
                    const result = await igSend(platform.token, contact.platformAccountId, messageText);
                    sentMessageId = result.message_id;
                }

                // Save to Message History
                if (sentMessageId || platform.type) {
                    await Message.create({
                        chatId: chat._id,
                        workspaceId: chat.workspaceId,
                        from: 'human', // Cancellation is a human action
                        text: messageText,
                        platformMessageId: sentMessageId
                    });
                }
            }
        } catch (msgErr) {
            console.error('Failed to send cancellation message:', msgErr);
            // Don't fail the request, just log error
        }

        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update order status
router.put('/:id', async (req, res) => {
    try {
        const { status, notes } = req.body;
        const update = {};
        if (status) update.status = status;
        if (notes !== undefined) update.notes = notes;

        const order = await Order.findByIdAndUpdate(
            req.params.id,
            update,
            { new: true }
        ).populate('chatId');

        // Logic to send confirmation message
        if (status === 'processed' && order) {
            try {
                const chat = await Chat.findById(order.chatId._id).populate('platformId').populate('contactId');
                if (chat && chat.platformId && chat.contactId) {
                    const platform = chat.platformId;
                    const contact = chat.contactId;

                    // Find outlet name in formData (case-insensitive)
                    let outletName = 'Kami';
                    if (order.formData) {
                        const outletKey = Object.keys(order.formData).find(k => k.toLowerCase().includes('outlet'));
                        if (outletKey) outletName = order.formData[outletKey];
                    }

                    const messageText = `Baik pesanan anda sudah di terima di ${outletName}`;
                    let sentMessageId = null;

                    // Send Message based on platform
                    if (platform.type === 'telegram') {
                        const result = await tgSend(platform.token, contact.platformAccountId, messageText);
                        sentMessageId = result.result?.message_id?.toString();
                    } else if (platform.type === 'whatsapp') {
                        const result = await waSend(platform.token, platform.phoneNumberId, contact.platformAccountId, messageText);
                        // WA might return message ID differently
                        sentMessageId = result.messages?.[0]?.id;
                    } else if (platform.type === 'instagram') {
                        const result = await igSend(platform.token, contact.platformAccountId, messageText);
                        sentMessageId = result.message_id;
                    }

                    // Save to Message History
                    if (sentMessageId || platform.type) { // Create message even if ID parsing fails, for UI consistency
                        await Message.create({
                            chatId: chat._id,
                            workspaceId: chat.workspaceId,
                            from: 'ai', // or 'system' / 'human' -> 'ai' fits best for automated reply
                            text: messageText,
                            platformMessageId: sentMessageId
                        });
                    }
                }
            } catch (msgErr) {
                console.error('Failed to send confirmation message:', msgErr);
                // Don't fail the request, just log error
            }
        }

        res.json(order);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete order
router.delete('/:id', async (req, res) => {
    try {
        await Order.findByIdAndDelete(req.params.id);
        res.json({ message: 'Order deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
