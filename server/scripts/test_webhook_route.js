async function testWebhook() {
    const baseUrl = 'http://localhost:5000/webhook/telegram';

    const payload = {
        update_id: 123456789,
        message: {
            message_id: 1,
            from: { id: 123, is_bot: false, first_name: 'Test' },
            chat: { id: 123, type: 'private' },
            date: Date.now() / 1000,
            text: '/start'
        }
    };

    console.log('Testing standard URL:', baseUrl);
    try {
        const res1 = await fetch(baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log('Standard URL Response:', res1.status, res1.statusText);
    } catch (e) {
        console.error('Standard URL failed:', e.message);
    }

    const tokenUrl = baseUrl + '/123456:ABC-DEF';
    console.log('\nTesting Token URL:', tokenUrl);
    try {
        const res2 = await fetch(tokenUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        console.log('Token URL Response:', res2.status, res2.statusText);
    } catch (e) {
        console.error('Token URL failed:', e.message);
    }
}

testWebhook();
