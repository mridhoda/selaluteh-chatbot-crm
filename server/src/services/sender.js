import { promises as fs } from 'fs';
import path from 'path';
import https from 'https';
import dns from 'dns';
import { splitMessage } from '../utils/messageSplitter.js';

function fetchWithIPv4(url, body, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const postData = JSON.stringify(body);

    dns.resolve4(urlObj.hostname, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        return reject(new Error('DNS resolution failed for ' + urlObj.hostname));
      }

      const options = {
        hostname: addresses[0],
        path: urlObj.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
          'Host': urlObj.hostname,
        },
        timeout: timeoutMs,
        rejectUnauthorized: true,
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); }
          catch { reject(new Error('Invalid JSON response: ' + data.slice(0, 200))); }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(Object.assign(new Error('Timeout'), { code: 'ETIMEDOUT' })); });
      req.write(postData);
      req.end();
    });
  });
}

export async function tgSendSplit(token, chatId, text, replyToMessageId = null) {
  const bubbles = splitMessage(text);
  const results = [];

  for (const bubble of bubbles) {
    // Add small delay between messages to ensure order
    if (results.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    const result = await tgSend(token, chatId, bubble, replyToMessageId);
    results.push(result);
  }

  return results.length > 0 ? results[results.length - 1] : null;
}

export async function tgSend(token, chatId, text, replyToMessageId = null, options = {}) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`
  const body = { chat_id: chatId, text }

  // Add reply_to_message_id if provided
  if (replyToMessageId) {
    body.reply_to_message_id = parseInt(replyToMessageId);
  }

  if (options.replyMarkup || options.reply_markup) {
    body.reply_markup = options.replyMarkup || options.reply_markup;
  }

  let lastError;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const j = await fetchWithIPv4(url, body, 10000);
      if (!j.ok) throw new Error(`Telegram sendMessage failed: ${JSON.stringify(j)}`)
      return j
    } catch (e) {
      lastError = e;
      if (attempt === 0) await new Promise(r => setTimeout(r, 1000));
    }
  }
  throw lastError || new Error('Telegram send failed after retry');
}
export async function waSend(token, fromPhoneNumberId, to, text) {
  const url = `https://graph.facebook.com/v19.0/${fromPhoneNumberId}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    to,
    text: { body: text },
  };
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (j.error) throw new Error(`WhatsApp sendMessage failed: ${JSON.stringify(j.error)}`);
  return j;
}

export async function waSendDocument(token, fromPhoneNumberId, to, documentUrl, filename) {
  const url = `https://graph.facebook.com/v19.0/${fromPhoneNumberId}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'document',
    document: {
      link: documentUrl,
      filename: filename,
    },
  };
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (j.error) throw new Error(`WhatsApp sendDocument failed: ${JSON.stringify(j.error)}`);
  return j;
}

export async function waSendImage(token, fromPhoneNumberId, to, imageUrl, caption = '') {
  const url = `https://graph.facebook.com/v19.0/${fromPhoneNumberId}/messages`;
  const image = { link: imageUrl };
  if (caption) image.caption = caption;
  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'image',
    image,
  };
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (j.error) throw new Error(`WhatsApp sendImage failed: ${JSON.stringify(j.error)}`);
  return j;
}

export async function waSendSticker(token, fromPhoneNumberId, to, stickerUrl) {
  const url = `https://graph.facebook.com/v19.0/${fromPhoneNumberId}/messages`;
  const body = {
    messaging_product: 'whatsapp',
    to,
    type: 'sticker',
    sticker: { link: stickerUrl },
  };
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (j.error) throw new Error(`WhatsApp sendSticker failed: ${JSON.stringify(j.error)}`);
  return j;
}

export async function igSend(token, recipientId, text) {
  console.log('[meta] igSend token:', token);
  const url = `https://graph.facebook.com/v19.0/me/messages`;
  const body = {
    recipient: { id: recipientId },
    message: { text },
    messaging_type: 'RESPONSE'
  };
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (j.error) throw new Error(`Instagram sendMessage failed: ${JSON.stringify(j.error)}`);
  return j;
}

export async function igSendDocument(token, recipientId, documentUrl, caption) {
  const url = `https://graph.facebook.com/v19.0/me/messages`;

  const docBody = {
    recipient: { id: recipientId },
    message: {
      attachment: {
        type: 'file',
        payload: {
          url: documentUrl,
        },
      },
    },
    messaging_type: 'RESPONSE'
  };

  const rDoc = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(docBody),
  });

  const jDoc = await rDoc.json();
  if (jDoc.error) throw new Error(`Instagram sendDocument failed: ${JSON.stringify(jDoc.error)}`);

  if (caption) {
    await igSend(token, recipientId, caption);
  }

  return jDoc;
}

export async function igGetUserProfile(userId, token) {
  const url = `https://graph.facebook.com/v19.0/${userId}?fields=name,profile_pic&access_token=${token}`;
  const r = await fetch(url);
  const j = await r.json();
  if (j.error) throw new Error(`Instagram getUserProfile failed: ${JSON.stringify(j.error)}`);
  return j;
}

export async function tgSendSticker(token, chatId, stickerUrl) {
  const url = `https://api.telegram.org/bot${token}/sendSticker`;
  const body = { chat_id: chatId, sticker: stickerUrl };
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = await r.json();
  if (!j.ok) throw new Error(`Telegram sendSticker failed: ${JSON.stringify(j)}`);
  return j;
}

function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.png': return 'image/png';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.gif': return 'image/gif';
    case '.webp': return 'image/webp';
    case '.mp4': return 'video/mp4';
    case '.mov': return 'video/quicktime';
    case '.avi': return 'video/x-msvideo';
    case '.pdf': return 'application/pdf';
    case '.doc': return 'application/msword';
    case '.docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case '.xls': return 'application/vnd.ms-excel';
    case '.xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case '.txt': return 'text/plain';
    case '.zip': return 'application/zip';
    default: return 'application/octet-stream';
  }
}

export async function tgSendDocument(token, chatId, localFilePath, caption, replyToMessageId = null) {
  const url = `https://api.telegram.org/bot${token}/sendDocument`;

  const fileContent = await fs.readFile(localFilePath);
  const filename = path.basename(localFilePath);
  const mimeType = getMimeType(filename);
  const fileBlob = new Blob([fileContent], { type: mimeType });

  const formData = new FormData();
  formData.append('chat_id', String(chatId));
  if (caption) {
    formData.append('caption', caption);
  }
  if (replyToMessageId) {
    formData.append('reply_to_message_id', String(parseInt(replyToMessageId)));
  }
  formData.append('document', fileBlob, filename);

  const r = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  const j = await r.json();
  if (!j.ok) throw new Error(`Telegram sendDocument failed: ${JSON.stringify(j)}`);
  return j;
}

export async function tgSendPhoto(token, chatId, localFilePath, caption, replyToMessageId = null) {
  const url = `https://api.telegram.org/bot${token}/sendPhoto`;

  const fileContent = await fs.readFile(localFilePath);
  const filename = path.basename(localFilePath);
  const mimeType = getMimeType(filename);
  const fileBlob = new Blob([fileContent], { type: mimeType });

  const formData = new FormData();
  formData.append('chat_id', String(chatId));
  if (caption) {
    formData.append('caption', caption);
  }
  if (replyToMessageId) {
    formData.append('reply_to_message_id', String(parseInt(replyToMessageId)));
  }
  formData.append('photo', fileBlob, filename);

  const r = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  const j = await r.json();
  if (!j.ok) {
    console.error('Telegram sendPhoto failed:', JSON.stringify(j));
    throw new Error(`Telegram sendPhoto failed: ${JSON.stringify(j)}`);
  }
  return j;
}

export async function tgSendVideo(token, chatId, localFilePath, caption, replyToMessageId = null) {
  const url = `https://api.telegram.org/bot${token}/sendVideo`;

  const fileContent = await fs.readFile(localFilePath);
  const filename = path.basename(localFilePath);
  const mimeType = getMimeType(filename);
  const fileBlob = new Blob([fileContent], { type: mimeType });

  const formData = new FormData();
  formData.append('chat_id', String(chatId));
  if (caption) {
    formData.append('caption', caption);
  }
  if (replyToMessageId) {
    formData.append('reply_to_message_id', String(parseInt(replyToMessageId)));
  }
  formData.append('video', fileBlob, filename);

  const r = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  const j = await r.json();
  if (!j.ok) {
    console.error('Telegram sendVideo failed:', JSON.stringify(j));
    throw new Error(`Telegram sendVideo failed: ${JSON.stringify(j)}`);
  }
  return j;
}
