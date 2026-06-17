import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Agent from '../models/Agent.js';
import Knowledge from '../models/Knowledge.js';
import { authRequired, attachUser } from '../middleware/auth.js'
import { generateAIReply, findAndSendFile } from '../services/ai.service.js'
import { openaiClient, geminiClient } from '../services/aiClient.js';
import { findDatabaseFileMention } from '../utils/fileMentions.js';

const router = express.Router()

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    // Sanitize the original name to make it a valid filename
    const sanitizedOriginalName = file.originalname
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/[^a-zA-Z0-9._-]/g, ''); // Remove invalid characters
    cb(null, sanitizedOriginalName);
  }
})

const upload = multer({ storage: storage });

// GET /agents (list)
router.get('/', authRequired, attachUser, async (req, res) => {
  try {
    const rows = await Agent.find({ workspaceId: req.me.workspaceId }).sort({ createdAt: -1 })
    res.json(rows)
  } catch (err) {
    console.error('GET /agents error:', err)
    res.status(500).json({ error: 'Failed to list agents' })
  }
})

// GET /agents/:id (detail)
router.get('/:id', authRequired, attachUser, async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid agent id' })
    const row = await Agent.findOne({ _id: id, workspaceId: req.me.workspaceId })
    if (!row) return res.status(404).json({ error: 'Agent not found' })
    res.json(row)
  } catch (err) {
    console.error('GET /agents/:id error:', err)
    res.status(500).json({ error: 'Failed to get agent' })
  }
})

// POST /agents (create)
router.post('/', authRequired, attachUser, async (req, res) => {
  try {
    const { name, platformId, prompt, behavior, welcomeMessage, knowledge } = req.body
    if (!name) return res.status(400).json({ error: 'Missing name' })
    const row = await Agent.create({
      workspaceId: req.me.workspaceId,
      name,
      platformId: platformId || null,
      prompt: prompt || '',
      behavior: behavior || '',
      welcomeMessage: welcomeMessage || 'Halo! Ada yang bisa saya bantu?',
      knowledge: Array.isArray(knowledge) ? knowledge : []
    })
    res.json(row)
  } catch (err) {
    console.error('POST /agents error:', err)
    res.status(500).json({ error: 'Failed to create agent' })
  }
})

// PUT /agents/:id (update)
router.put('/:id', authRequired, attachUser, async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid agent id' });
    const update = req.body || {};

    // Intercept and process file knowledge
    if (update.knowledge && Array.isArray(update.knowledge)) {
      const knowledgeFiles = update.knowledge.filter(k => k.kind === 'pdf' && k.value);
      for (const kf of knowledgeFiles) {
        const storedName = path.basename(kf.value); // e.g., "12345.pdf" from "/uploads/12345.pdf"
        const originalName = kf.originalName || storedName; // Use originalName from body, fallback to storedName
        const mimetype = storedName.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream';

        // Avoid creating duplicates
        const existing = await Knowledge.findOne({ workspaceId: req.me.workspaceId, storedName });
        if (!existing) {
          await Knowledge.create({
            workspaceId: req.me.workspaceId,
            originalName: originalName, // THE FIX IS HERE
            storedName: storedName,
            mimetype: mimetype,
          });
        }
      }
      // Filter out the processed pdfs to prevent them from being saved on the agent model itself
      update.knowledge = update.knowledge.filter(k => k.kind !== 'pdf');
    }

    const row = await Agent.findOneAndUpdate(
      { _id: id, workspaceId: req.me.workspaceId },
      { $set: update },
      { new: true }
    );
    if (!row) return res.status(404).json({ error: 'Agent not found' });
    res.json(row);
  } catch (err) {
    console.error('PUT /agents/:id error:', err);
    res.status(500).json({ error: 'Failed to update agent' });
  }
});

// POST /agents/:id/database (upload file)
router.post('/:id/database', authRequired, attachUser, upload.single('file'), async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid agent id' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const agent = await Agent.findOne({ _id: id, workspaceId: req.me.workspaceId });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const fileId = `kalis_${Date.now()}_${req.file.originalname}`;
    const newFile = {
      id: fileId,
      originalName: req.file.originalname,
      storedName: req.file.filename,
    };

    agent.database.push(newFile);
    await agent.save();

    res.json(newFile);
  } catch (err) {
    console.error('POST /agents/:id/database error:', err);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// DELETE /agents/:id/database/:fileId (delete file)
router.delete('/:id/database/:fileId', authRequired, attachUser, async (req, res) => {
  try {
    const { id, fileId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid agent id' });

    const agent = await Agent.findOne({ _id: id, workspaceId: req.me.workspaceId });
    if (!agent) return res.status(404).json({ error: 'Agent not found' });

    const fileIndex = agent.database.findIndex(f => f.id === fileId);
    if (fileIndex === -1) return res.status(404).json({ error: 'File not found' });

    const [deletedFile] = agent.database.splice(fileIndex, 1);
    await agent.save();

    // Delete the file from the uploads directory
    const filePath = path.join('uploads', deletedFile.storedName);
    fs.unlink(filePath, (err) => {
      if (err) console.error(`Failed to delete file: ${filePath}`, err);
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /agents/:id/database/:fileId error:', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// DELETE /agents/:id
router.delete('/:id', authRequired, attachUser, async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid agent id' })
    await Agent.deleteOne({ _id: id, workspaceId: req.me.workspaceId })
    res.json({ ok: true })
  } catch (err) {
    console.error('DELETE /agents/:id error:', err)
    res.status(500).json({ error: 'Failed to delete agent' })
  }
})

router.post('/upload', authRequired, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  res.json({ filePath: `/files/${req.file.filename}`, originalName: req.file.originalname });
});

router.post('/knowledge/add-file', authRequired, attachUser, async (req, res) => {
  try {
    const { originalName, storedName, mimetype } = req.body;
    if (!originalName || !storedName || !mimetype) {
      return res.status(400).json({ error: 'Missing required file information.' });
    }

    const knowledgeEntry = await Knowledge.create({
      workspaceId: req.me.workspaceId,
      originalName,
      storedName,
      mimetype,
    });

    res.status(201).json(knowledgeEntry);
  } catch (err) {
    console.error('POST /agents/knowledge/add-file error:', err);
    res.status(500).json({ error: 'Failed to add knowledge file.' });
  }
});

router.get('/knowledge/list', authRequired, attachUser, async (req, res) => {
  try {
    const knowledgeEntries = await Knowledge.find({ workspaceId: req.me.workspaceId }).sort({ createdAt: -1 });
    res.json(knowledgeEntries);
  } catch (err) {
    console.error('GET /agents/knowledge/list error:', err);
    res.status(500).json({ error: 'Failed to list knowledge files.' });
  }
});

// POST /agents/:id/test (Test UI)
router.post('/:id/test', authRequired, attachUser, async (req, res) => {
  try {
    const { id } = req.params
    const { message, attachment, history: rawHistory } = req.body || {}
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid agent id' })
    if (!message && !attachment) return res.status(400).json({ error: 'Message or attachment required' })
    const history =
      Array.isArray(rawHistory) && rawHistory.length > 0
        ? rawHistory
          .filter((h) => h && typeof h.text === 'string')
          .map((h) => ({
            from: h.from === 'ai' ? 'ai' : 'user',
            text: h.text,
            createdAt: h.createdAt ? new Date(h.createdAt) : new Date(),
          }))
        : []

    const agent = await Agent.findOne({ _id: id, workspaceId: req.me.workspaceId })
    if (!agent) return res.status(404).json({ error: 'Agent not found' })

    const fileResponse = await findAndSendFile({
      agent,
      message,
      openaiClient,
      geminiClient,
    });

    if (fileResponse) {
      return res.json({ reply: fileResponse });
    }

    // Prepare message object with attachment if provided
    const messageObj = {
      text: message || '',
      attachment: attachment || null
    }

    const system = agent.behavior || 'You are a helpful assistant.'
    const reply = await generateAIReply({
      system,
      prompt: agent.prompt,
      message: messageObj,
      knowledge: agent.knowledge,
      agent: agent,
      chat: { workspaceId: req.me.workspaceId, contactId: null }, // Mock chat object
      history,
    })

    let replyText = typeof reply === 'string' ? reply : reply.text
    let replyAttachment = typeof reply === 'object' && reply.attachment ? reply.attachment : null

    if (!replyAttachment) {
      const mention = findDatabaseFileMention(replyText, agent)
      if (mention && mention.file?.storedName) {
        const cleanedText = (replyText || '').replace(mention.token, mention.altText || '').trim()
        replyAttachment = {
          url: `/files/${mention.file.storedName}`,
          filename: mention.file.originalName || mention.file.storedName,
          storedName: mention.file.storedName,
        }
        replyText = cleanedText || mention.altText || replyText
      }
    }

    // Check for external URL file mention (like in main program)
    if (!replyAttachment) {
      const { findUrlFileMention } = await import('../utils/fileMentions.js');
      const { downloadFile } = await import('../utils/downloader.js');
      const { promises: fsPromises } = await import('fs');

      const urlMention = findUrlFileMention(replyText);
      if (urlMention) {
        const { url, token, altText } = urlMention;
        console.log(`[test] Found external file URL: ${url}`);

        const cleanedText = (replyText || '').replace(token, altText || '').trim();

        try {
          // Download file
          const { filePath, filename, originalName } = await downloadFile(url);
          console.log(`[test] Downloaded file to: ${filePath}`);

          // Move to uploads directory
          const storedName = filename;
          const uploadsPath = path.resolve('uploads', storedName);
          await fsPromises.rename(filePath, uploadsPath);

          replyAttachment = {
            url: `/files/${storedName}`,
            filename: originalName,
            storedName: storedName,
          };
          replyText = cleanedText || altText || 'File sent';

          console.log(`[test] File uploaded successfully: ${storedName}`);
        } catch (e) {
          console.error('[test] Failed to download/upload external file:', e);
          // Fallback: keep the URL in text
        }
      }
    }

    res.json({ reply: replyAttachment ? { text: replyText, attachment: replyAttachment } : replyText })

  } catch (err) {
    console.error('POST /agents/:id/test error:', err)
    res.status(500).json({ error: 'Test failed' })
  }
})


export default router
