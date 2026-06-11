import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';

/**
 * Download a file from a URL to a local destination
 * @param {String} url - The URL to download from
 * @param {String} destDir - The directory to save the file to (default: uploads/temp)
 * @returns {Promise<{filePath: String, filename: String, originalName: String}>}
 */
export async function downloadFile(url, destDir = 'uploads/temp') {
    // Ensure destination directory exists
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    // Extract filename from URL or generate unique one
    let filename = path.basename(new URL(url).pathname);
    if (!filename || filename.length > 100) {
        filename = `file-${uuidv4().slice(0, 8)}`;
    }

    // Add unique prefix to avoid collisions
    const uniqueFilename = `${Date.now()}-${filename}`;
    const filePath = path.join(destDir, uniqueFilename);

    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        const client = url.startsWith('https') ? https : http;

        client.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download file: Status Code ${response.statusCode}`));
                return;
            }

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
