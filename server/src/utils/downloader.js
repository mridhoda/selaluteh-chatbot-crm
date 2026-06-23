import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from './errors.js';

const ALLOWED_PROTOCOLS = new Set(['https:']);
const BLOCKED_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0']);
const MAX_DOWNLOAD_BYTES = 10 * 1024 * 1024;

function assertDownloadUrlSafe(url) {
    const parsed = new URL(url);
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
        throw new AppError('UNSAFE_URL', 'Only HTTPS downloads are allowed', 400);
    }
    if (BLOCKED_HOSTS.has(parsed.hostname)) {
        throw new AppError('UNSAFE_URL', 'Local or loopback downloads are not allowed', 400);
    }
    return parsed;
}

/**
 * Download a file from a URL to a local destination
 * @param {String} url - The URL to download from
 * @param {String} destDir - The directory to save the file to (default: uploads/temp)
 * @returns {Promise<{filePath: String, filename: String, originalName: String}>}
 */
export async function downloadFile(url, destDir = 'uploads/temp') {
    const parsedUrl = assertDownloadUrlSafe(url);
    // Ensure destination directory exists
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    // Extract filename from URL or generate unique one
    let filename = path.basename(parsedUrl.pathname);
    if (!filename || filename.length > 100) {
        filename = `file-${uuidv4().slice(0, 8)}`;
    }

    // Add unique prefix to avoid collisions
    const uniqueFilename = `${Date.now()}-${filename}`;
    const filePath = path.join(destDir, uniqueFilename);

    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        const client = parsedUrl.protocol === 'https:' ? https : http;

        client.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download file: Status Code ${response.statusCode}`));
                return;
            }

            const contentLength = Number(response.headers['content-length'] || 0);
            if (contentLength > MAX_DOWNLOAD_BYTES) {
                file.close(() => fs.unlink(filePath, () => {}));
                reject(new AppError('FILE_TOO_LARGE', 'Downloaded file exceeds limit', 400));
                return;
            }

            let received = 0;
            response.on('data', (chunk) => {
                received += chunk.length;
                if (received > MAX_DOWNLOAD_BYTES) {
                    response.destroy(new AppError('FILE_TOO_LARGE', 'Downloaded file exceeds limit', 400));
                }
            });
            response.pipe(file);

            file.on('finish', () => {
                file.close(() => {
                    resolve({
                        filePath,
                        filename: uniqueFilename,
                        originalName: filename
                    });
                });
            });

            file.on('error', (err) => {
                fs.unlink(filePath, () => { }); // Delete failed file
                reject(err);
            });
        }).on('error', (err) => {
            fs.unlink(filePath, () => { }); // Delete failed file
            reject(err);
        });
    });
}
