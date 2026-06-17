import fetch from 'node-fetch';

async function simulateWebhook() {
    const payload = {
        update_id: 123456789,
        message: {
            message_id: 9999,
            from: {
                id: 6481157921, // Use the ID from the user's log or a dummy one
                is_bot: false,
                first_name: "Test",
                last_name: "User",
                username: "testuser"
            },
            chat: {
                id: 6481157921, // Same as from.id for private chat
                first_name: "Test",
                last_name: "User",
                type: "private"
            },
            date: Math.floor(Date.now() / 1000),
            text: "halo test resolved"
        }
    };

    // We need to find the actual platformAccountId (Telegram Chat ID) for the resolved chat
    // From the user's log: GET /chats/6921210301e8f84a1a580c81/messages
    // I need to look up the contact associated with chat 6921210301e8f84a1a580c81 to get the real Telegram ID.
    // But for now, I'll just use a dummy ID. If the logic is generic, it should work for any ID.
    // WAIT, the user said "saat saya chat di akun yang sudah pernah resolved".
    // So I should try to use the SAME Telegram ID if possible to reproduce the "resolved" state match.

    // Let's assume the server is running on port 5000
    try {
        const response = await fetch('http://localhost:5000/webhook/telegram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log('Webhook sent. Status:', response.status);
    } catch (error) {
        console.error('Error sending webhook:', error);
    }
}

simulateWebhook();
