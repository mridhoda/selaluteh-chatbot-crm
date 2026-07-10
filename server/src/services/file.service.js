import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getSupabaseServiceClient } from '../db/supabase.js';
import { AppError } from '../utils/errors.js';

const ALLOWED_MIMES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/x-icon', 'image/vnd.microsoft.icon',
  'application/pdf',
  'text/csv', 'text/plain',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
]);

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const EXECUTABLE_EXTENSIONS = new Set(['.exe', '.bat', '.cmd', '.com', '.sh', '.ps1', '.scr', '.js', '.mjs', '.cjs', '.jar', '.apk']);
const SERVER_SIDE_EXTENSIONS = new Set(['.php', '.phtml', '.phar', '.asp', '.aspx', '.jsp', '.jspx', '.cgi']);

export function validateFile(mimeType, size, originalName = '') {
  const filename = String(originalName || '');
  const extensions = filename.toLowerCase().split('.').slice(1).map((ext) => `.${ext}`);
  if (extensions.length > 1) {
    if (extensions.some((ext) => SERVER_SIDE_EXTENSIONS.has(ext))) {
      throw new AppError('INVALID_EXTENSION', 'Executable or server-side file types are not allowed', 400);
    }
    if (extensions.some((ext) => EXECUTABLE_EXTENSIONS.has(ext))) {
      throw new AppError('DOUBLE_EXTENSION', 'Suspicious double extension is not allowed', 400);
    }
  }
  if (!ALLOWED_MIMES.has(mimeType)) {
    throw new AppError('INVALID_MIME', `File type ${mimeType} is not allowed`, 400);
  }
  if (size > MAX_SIZE) {
    throw new AppError('FILE_TOO_LARGE', 'File exceeds maximum size of 10 MB', 400, { maxSize: MAX_SIZE, actual: size });
  }
}

export function sanitizeFilename(originalName) {
  const ext = path.extname(originalName || 'file').toLowerCase();
  const safeExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico', '.pdf', '.csv', '.txt', '.xlsx', '.xls'];
  if (!safeExts.includes(ext)) {
    throw new AppError('INVALID_EXTENSION', `File extension ${ext} is not allowed`, 400);
  }
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 200);
  return safeName || `file${ext}`;
}

export function assertFileOwnership({ workspaceId, fileRecord }) {
  if (!fileRecord) {
    throw new AppError('NOT_FOUND', 'File not found', 404);
  }
  if (fileRecord.workspace_id && fileRecord.workspace_id !== workspaceId) {
    throw new AppError('FORBIDDEN', 'Forbidden file access', 403);
  }
}

export async function getFileByStoredName({ storedName }) {
  const client = getSupabaseServiceClient();
  const { data, error } = await client.from('files').select('*').eq('stored_name', storedName).maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError('NOT_FOUND', 'File not found', 404);
  return data;
}

export async function isManagedStoredName(storedName) {
  try {
    await getFileByStoredName({ storedName });
    return true;
  } catch (err) {
    if (err.code === 'NOT_FOUND') return false;
    throw err;
  }
}

export async function uploadFile({ workspaceId, file, userId, source = 'admin_upload', metadata = {} }) {
  validateFile(file.mimetype, file.size, file.originalname);
  const originalName = sanitizeFilename(file.originalname);
  const storedName = `${crypto.randomUUID()}${path.extname(originalName)}`;
  const relativePath = `uploads/${workspaceId}/${storedName}`;
  const absolutePath = path.resolve(relativePath);

  await fs.mkdir(path.dirname(absolutePath), { recursive: true });
  await fs.copyFile(file.path, absolutePath);
  if (file.path !== absolutePath) await fs.unlink(file.path).catch(() => {});

  const client = getSupabaseServiceClient();
  const { data, error } = await client.from('files').insert({
    workspace_id: workspaceId,
    storage_provider: 'local',
    disk: 'local',
    relative_path: relativePath,
    original_name: originalName,
    stored_name: storedName,
    mime_type: file.mimetype,
    size_bytes: file.size,
    source,
    created_by: userId || null,
    metadata,
  }).select().single();

  if (error) throw new AppError('FILE_STORE_ERROR', 'Failed to store file metadata', 500, { detail: error.message }, error);
  return data;
}

export async function getFile({ workspaceId, fileId }) {
  const client = getSupabaseServiceClient();
  const { data, error } = await client.from('files').select('*').eq('workspace_id', workspaceId).eq('id', fileId).maybeSingle();
  if (error) throw error;
  if (!data) throw new AppError('NOT_FOUND', 'File not found', 404);
  return data;
}

export async function resolvePublicManagedFile({ storedName }) {
  const client = getSupabaseServiceClient();
  const { data, error } = await client.from('files').select('*').eq('stored_name', storedName).maybeSingle();
  if (error) throw error;
  if (!data || data.metadata?.public !== true) return null;
  return { file: data, absolutePath: path.resolve(data.relative_path) };
}

export async function resolveFileDownload({ workspaceId, fileId = null, storedName = null }) {
  const file = fileId
    ? await getFile({ workspaceId, fileId })
    : await getFileByStoredName({ storedName });
  assertFileOwnership({ workspaceId, fileRecord: file });
  const absolutePath = path.resolve(file.relative_path);
  return { file, absolutePath };
}

export async function deleteFile({ workspaceId, fileId }) {
  const file = await getFile({ workspaceId, fileId });
  const absolutePath = path.resolve(file.relative_path);
  await fs.unlink(absolutePath).catch(() => {});

  const client = getSupabaseServiceClient();
  await client.from('files').delete().eq('id', fileId);
  return { deleted: true };
}
