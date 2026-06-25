/**
 * agents.js — Supabase-backed
 *
 * Agent management routes.
 * Migrated from Mongoose Agent/Knowledge models to agentsSupabaseRepository.
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { authorizePermission } from '../middleware/authorization.js';
import { aiRateLimit, uploadRateLimit } from '../middleware/rate-limit.js';
import { generateAIReply, findAndSendFile, getAgentPromptRules } from '../services/ai.service.js';
import { openaiClient, geminiClient } from '../services/aiClient.js';
import { findDatabaseFileMention } from '../utils/fileMentions.js';
import { agentsSupabaseRepository } from '../db/repositories/index.js';
import { validateAgentConfig } from '../ai/agents/agent-schema.js';
import { buildManagedFileUrl, buildPublicFileUrl } from '../utils/file-urls.js';

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) { cb(null, 'uploads/'); },
  filename: function (req, file, cb) {
    const sanitized = file.originalname
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9._-]/g, '');
    cb(null, sanitized);
  },
});

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024, files: 1 } });

// GET /agents (list)
router.get('/', authRequired, attachUser, attachWorkspaceContext, authorizePermission('ai', 'configure'), async (req, res) => {
  try {
    const rows = await agentsSupabaseRepository.list({ workspaceId: req.me.workspaceId });
    res.json(rows);
  } catch (err) {
    console.error('GET /agents error:', err);
    res.status(500).json({ error: 'Failed to list agents' });
  }
});

// Static sub-routes must come before /:id
router.post('/upload', authRequired, attachUser, attachWorkspaceContext, authorizePermission('files', 'write'), uploadRateLimit, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded.');
  res.json({ filePath: buildPublicFileUrl(req.file.filename), originalName: req.file.originalname });
});

router.post('/knowledge/add-file', authRequired, attachUser, attachWorkspaceContext, authorizePermission('files', 'write'), async (req, res) => {
  try {
    const { originalName, storedName, mimetype } = req.body;
    if (!originalName || !storedName || !mimetype) {
      return res.status(400).json({ error: 'Missing required file information.' });
    }
    // Knowledge files are stored in the agent's JSONB `database` column, not a separate collection.
    // This endpoint just confirms the upload and returns a usable record.
    res.status(201).json({ originalName, storedName, mimetype, createdAt: new Date().toISOString() });
  } catch (err) {
    console.error('POST /agents/knowledge/add-file error:', err);
    res.status(500).json({ error: 'Failed to add knowledge file.' });
  }
});

router.get('/knowledge/list', authRequired, attachUser, attachWorkspaceContext, authorizePermission('files', 'read'), async (req, res) => {
  try {
    // Knowledge files are embedded in each agent's `database` JSONB column.
    // Return the combined database files across all workspace agents.
    const agents = await agentsSupabaseRepository.list({ workspaceId: req.me.workspaceId });
    const files = agents.flatMap((agent) =>
      (agent.database || []).map((f) => ({ ...f, agentId: agent.id, agentName: agent.name }))
    );
    res.json(files);
  } catch (err) {
    console.error('GET /agents/knowledge/list error:', err);
    res.status(500).json({ error: 'Failed to list knowledge files.' });
  }
});

// GET /agents/:id (detail)
router.get('/:id', authRequired, attachUser, attachWorkspaceContext, authorizePermission('ai', 'configure'), async (req, res) => {
  try {
    const { id } = req.params;
    const row = await agentsSupabaseRepository.findById({ workspaceId: req.me.workspaceId, agentId: id });
    if (!row) return res.status(404).json({ error: 'Agent not found' });
    res.json(row);
  } catch (err) {
    console.error('GET /agents/:id error:', err);
    res.status(500).json({ error: 'Failed to get agent' });
  }
});

// POST /agents (create)
router.post('/', authRequired, attachUser, attachWorkspaceContext, authorizePermission('ai', 'configure'), async (req, res) => {
  try {
    const { name, platformId, prompt, behavior, welcomeMessage, knowledge } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing name' });
    const validation = validateAgentConfig({ name, platformId, prompt, behavior, welcomeMessage, knowledge });
    if (!validation.valid) return res.status(400).json({ error: validation.errors.join('; ') });
    const row = await agentsSupabaseRepository.create({
      workspaceId: req.me.workspaceId,
      name,
      platformId: platformId || null,
      prompt: prompt || '',
      behavior: behavior || '',
      welcomeMessage: welcomeMessage || 'Halo! Ada yang bisa saya bantu?',
      knowledge: Array.isArray(knowledge) ? knowledge : [],
    });
    res.json(row);
  } catch (err) {
    console.error('POST /agents error:', err);
    res.status(500).json({ error: 'Failed to create agent' });
  }
});

// PUT /agents/:id (update)
router.put('/:id', authRequired, attachUser, attachWorkspaceContext, authorizePermission('ai', 'configure'), async (req, res) => {
  try {
    const { id } = req.params;
    const update = { ...req.body };
    const validation = validateAgentConfig({ ...update, name: update.name || 'existing-agent' });
    if (!validation.valid) return res.status(400).json({ error: validation.errors.join('; ') });

    // Handle PDF knowledge files — store in agent's database JSONB array
    if (update.knowledge && Array.isArray(update.knowledge)) {
      const pdfFiles = update.knowledge.filter((k) => k.kind === 'pdf' && k.value);
      if (pdfFiles.length > 0) {
        // Fetch current agent to merge database files
        const current = await agentsSupabaseRepository.findById({ workspaceId: req.me.workspaceId, agentId: id });
        const existingDb = current?.database || [];
        const existingNames = new Set(existingDb.map((f) => f.storedName));
        for (const kf of pdfFiles) {
          const storedName = path.basename(kf.value);
          if (!existingNames.has(storedName)) {
            existingDb.push({
              id: `kalis_${Date.now()}_${storedName}`,
              originalName: kf.originalName || storedName,
              storedName,
            });
          }
        }
        update.database = existingDb;
      }
      // Filter out PDF entries from knowledge — they live in database JSONB
      update.knowledge = update.knowledge.filter((k) => k.kind !== 'pdf');
    }

    const row = await agentsSupabaseRepository.update({ workspaceId: req.me.workspaceId, agentId: id, updates: update });
    if (!row) return res.status(404).json({ error: 'Agent not found' });
    res.json(row);
  } catch (err) {
    console.error('PUT /agents/:id error:', err);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

// POST /agents/:id/database (upload file)
router.post('/:id/database', authRequired, attachUser, attachWorkspaceContext, authorizePermission('files', 'write'), uploadRateLimit, upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const agent = await agentsSupabaseRepository.findById({ workspaceId: req.me.workspaceId, agentId: id });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const fileId = `kalis_${Date.now()}_${req.file.originalname}`;
    const newFile = {
      id: fileId,
      originalName: req.file.originalname,
      storedName: req.file.filename,
    };

    const database = [...(agent.database || []), newFile];
    await agentsSupabaseRepository.update({ workspaceId: req.me.workspaceId, agentId: id, updates: { database } });

    res.json(newFile);
  } catch (err) {
    console.error('POST /agents/:id/database error:', err);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// DELETE /agents/:id/database/:fileId (delete file)
router.delete('/:id/database/:fileId', authRequired, attachUser, attachWorkspaceContext, authorizePermission('files', 'delete'), async (req, res) => {
  try {
    const { id, fileId } = req.params;
    const agent = await agentsSupabaseRepository.findById({ workspaceId: req.me.workspaceId, agentId: id });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const database = agent.database || [];
    const fileIndex = database.findIndex((f) => f.id === fileId);
    if (fileIndex === -1) return res.status(404).json({ error: 'File not found' });

    const [deletedFile] = database.splice(fileIndex, 1);
    await agentsSupabaseRepository.update({ workspaceId: req.me.workspaceId, agentId: id, updates: { database } });

    const filePath = path.join('uploads', deletedFile.storedName);
    fs.unlink(filePath, (err) => { if (err) console.error(`Failed to delete file: ${filePath}`, err); });

    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /agents/:id/database/:fileId error:', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// DELETE /agents/:id
router.delete('/:id', authRequired, attachUser, attachWorkspaceContext, authorizePermission('ai', 'configure'), async (req, res) => {
  try {
    const { id } = req.params;
    await agentsSupabaseRepository.deleteById({ workspaceId: req.me.workspaceId, agentId: id });
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /agents/:id error:', err);
    res.status(500).json({ error: 'Failed to delete agent' });
  }
});

// POST /agents/:id/test (Test UI)
router.post('/:id/test', authRequired, attachUser, attachWorkspaceContext, authorizePermission('ai', 'test'), aiRateLimit, async (req, res) => {
  try {
    const { id } = req.params;
    const { message, attachment, history: rawHistory } = req.body || {};
    if (!message && !attachment) return res.status(400).json({ error: 'Message or attachment required' });

    const history = Array.isArray(rawHistory) && rawHistory.length > 0
      ? rawHistory
        .filter((h) => h && typeof h.text === 'string')
        .map((h) => ({ from: h.from === 'ai' ? 'ai' : 'user', text: h.text, createdAt: h.createdAt ? new Date(h.createdAt) : new Date() }))
      : [];

    const agent = await agentsSupabaseRepository.findById({ workspaceId: req.me.workspaceId, agentId: id });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const fileResponse = await findAndSendFile({ agent, message, openaiClient, geminiClient });
    if (fileResponse) return res.json({ reply: fileResponse });

    const messageObj = { text: message || '', attachment: attachment || null };
    const promptRules = getAgentPromptRules(agent);
    const system = agent.behavior || promptRules.fallbackSystemPrompt;

    const reply = await generateAIReply({
      system,
      prompt: agent.prompt,
      message: messageObj,
      knowledge: agent.knowledge,
      agent,
      chat: { workspaceId: req.me.workspaceId, contactId: null },
      history,
    });

    let replyText = typeof reply === 'string' ? reply : reply.text;
    let replyAttachment = typeof reply === 'object' && reply.attachment ? reply.attachment : null;

    if (!replyAttachment) {
      const mention = findDatabaseFileMention(replyText, agent);
      if (mention && mention.file?.storedName) {
        const cleanedText = (replyText || '').replace(mention.token, mention.altText || '').trim();
        replyAttachment = {
          url: buildManagedFileUrl(mention.file.storedName),
          filename: mention.file.originalName || mention.file.storedName,
          storedName: mention.file.storedName,
        };
        replyText = cleanedText || mention.altText || replyText;
      }
    }

    if (!replyAttachment) {
      const { findUrlFileMention } = await import('../utils/fileMentions.js');
      const { downloadFile } = await import('../utils/downloader.js');
      const { promises: fsPromises } = await import('fs');
      const urlMention = findUrlFileMention(replyText);
      if (urlMention) {
        const { url, token, altText } = urlMention;
        const cleanedText = (replyText || '').replace(token, altText || '').trim();
        try {
          const { filePath, filename, originalName } = await downloadFile(url);
          const storedName = filename;
          const uploadsPath = path.resolve('uploads', storedName);
          await fsPromises.rename(filePath, uploadsPath);
          replyAttachment = { url: buildPublicFileUrl(storedName), filename: originalName, storedName };
          replyText = cleanedText || altText || 'File sent';
        } catch (e) {
          console.error('[test] Failed to download/upload external file:', e);
        }
      }
    }

    res.json({ reply: replyAttachment ? { text: replyText, attachment: replyAttachment } : replyText });
  } catch (err) {
    console.error('POST /agents/:id/test error:', err);
    res.status(500).json({ error: 'Test failed' });
  }
});

export default router;
