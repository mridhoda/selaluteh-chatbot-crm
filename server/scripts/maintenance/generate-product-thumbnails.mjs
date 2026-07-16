import 'dotenv/config';
import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { getSupabaseServiceClient } from '../../src/db/supabase.js';

const apply = process.argv.includes('--apply');
const workspaceId = String(process.env.WORKSPACE_ID || '').trim();
const publicBaseUrl = new URL(requireEnv('PUBLIC_BASE_URL'));
// Must match uploadFile() and the public-file server path exactly.
const uploadRoot = path.resolve('uploads');
const ffmpegCommand = process.env.FFMPEG_PATH || 'ffmpeg';
const maxSourceBytes = 20 * 1024 * 1024;

if (!workspaceId) throw new Error('WORKSPACE_ID is required');
if (publicBaseUrl.protocol !== 'https:') throw new Error('PUBLIC_BASE_URL must use HTTPS');

if (apply && process.platform === 'win32' && !process.env.FFMPEG_PATH) {
  console.warn('FFMPEG_PATH is not set; the script will use ffmpeg from PATH.');
}

function requireEnv(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function isOwnPublicImage(value) {
  try {
    const url = new URL(value, publicBaseUrl);
    return url.origin === publicBaseUrl.origin && url.pathname.startsWith('/public-files/');
  } catch {
    return false;
  }
}

function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(ffmpegCommand, args, { stdio: 'ignore' });
    child.once('error', () => reject(new Error(`FFmpeg not found at ${ffmpegCommand}. Set FFMPEG_PATH to the full path of ffmpeg.exe.`)));
    child.once('exit', (code) => code === 0 ? resolve() : reject(new Error(`ffmpeg exited with code ${code}`)));
  });
}

async function download(url, outputPath) {
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`source returned HTTP ${response.status}`);
  const size = Number(response.headers.get('content-length'));
  if (size && size > maxSourceBytes) throw new Error(`source exceeds ${maxSourceBytes} bytes`);
  const body = Buffer.from(await response.arrayBuffer());
  if (body.length > maxSourceBytes) throw new Error(`source exceeds ${maxSourceBytes} bytes`);
  await fs.writeFile(outputPath, body);
}

const client = getSupabaseServiceClient();
const { data: products, error } = await client
  .from('products')
  .select('id, name, thumbnail_url')
  .eq('workspace_id', workspaceId)
  .not('thumbnail_url', 'is', null);
if (error) throw error;

const candidates = products.filter((product) => isOwnPublicImage(product.thumbnail_url));
let migrated = 0;
let failed = 0;
console.log(`${apply ? 'APPLY' : 'DRY-RUN'}: ${candidates.length} public product images in workspace ${workspaceId}`);

for (const product of candidates) {
  const oldUrl = new URL(product.thumbnail_url, publicBaseUrl).href;
  const storedName = `${crypto.randomUUID()}.webp`;
  const relativePath = path.join('uploads', workspaceId, storedName);
  const destinationPath = path.join(uploadRoot, workspaceId, storedName);
  const newUrl = `/public-files/${storedName}`;
  console.log(`${apply ? 'MIGRATE' : 'WOULD MIGRATE'} ${product.name} (${product.id}): ${oldUrl} -> ${newUrl}`);
  if (!apply) continue;

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'product-thumbnail-'));
  const sourcePath = path.join(tempDir, 'source');
  const outputPath = path.join(tempDir, storedName);
  try {
    await download(oldUrl, sourcePath);
    await runFfmpeg(['-y', '-i', sourcePath, '-vf', 'scale=512:512:force_original_aspect_ratio=decrease,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white', '-c:v', 'libwebp', '-quality', '82', '-compression_level', '6', outputPath]);
    const stat = await fs.stat(outputPath);
    await fs.mkdir(path.dirname(destinationPath), { recursive: true });
    await fs.copyFile(outputPath, destinationPath);
    const { data: file, error: fileError } = await client.from('files').insert({
      workspace_id: workspaceId,
      storage_provider: 'local',
      disk: 'local',
      relative_path: relativePath,
      original_name: `${product.name}.webp`,
      stored_name: storedName,
      mime_type: 'image/webp',
      size_bytes: stat.size,
      source: 'product_image',
      metadata: { public: true, purpose: 'product_image_thumbnail', migrated_from: product.thumbnail_url },
    }).select('id').single();
    if (fileError) throw fileError;
    const { data: updated, error: updateError } = await client.from('products')
      .update({ thumbnail_url: newUrl, thumbnail_file_id: file.id })
      .eq('workspace_id', workspaceId)
      .eq('id', product.id)
      .eq('thumbnail_url', product.thumbnail_url)
      .select('id');
    if (updateError || !updated?.length) {
      await client.from('files').delete().eq('id', file.id);
      await fs.unlink(destinationPath).catch(() => {});
      throw updateError || new Error('product image changed during migration');
    }
    console.log(`DONE ${product.name}: ${stat.size} bytes`);
    migrated += 1;
  } catch (migrationError) {
    console.error(`FAILED ${product.name}: ${migrationError.message}`);
    failed += 1;
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

if (apply) {
  console.log(`Migration summary: ${migrated} completed, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}
