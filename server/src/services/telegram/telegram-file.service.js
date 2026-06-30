import { promises as fs } from 'node:fs';
import path from 'node:path';
import { buildPublicFileUrl } from '../../utils/file-urls.js';

export function createTelegramFileService({ fetchImpl = fetch } = {}) {
  async function fetchTelegramFilePath(token, fileId) {
    const resp = await fetchImpl(`https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`);
    const data = await resp.json();
    if (!data.ok) throw new Error(`Telegram getFile failed: ${JSON.stringify(data)}`);
    return data.result?.file_path;
  }

  async function saveTelegramFileLocally({ token, fileId, preferredName = '' }) {
    const filePath = await fetchTelegramFilePath(token, fileId);
    if (!filePath) throw new Error('Telegram file_path missing');
    const fileUrl = `https://api.telegram.org/file/bot${token}/${filePath}`;
    const downloadResp = await fetchImpl(fileUrl);
    if (!downloadResp.ok) throw new Error(`Download failed: ${downloadResp.status} ${downloadResp.statusText}`);
    const buffer = Buffer.from(await downloadResp.arrayBuffer());
    const originalBase = preferredName || path.basename(filePath) || `telegram_file_${Date.now()}`;
    const safeOriginal = originalBase.replace(/[\\/:*?"<>|]+/g, '_');
    await fs.mkdir('uploads', { recursive: true });
    const storedName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}_${safeOriginal}`;
    await fs.writeFile(path.resolve('uploads', storedName), buffer);
    return { storedName, originalName: safeOriginal, url: buildPublicFileUrl(storedName) };
  }

  return { fetchTelegramFilePath, saveTelegramFileLocally };
}

export const telegramFileService = createTelegramFileService();
