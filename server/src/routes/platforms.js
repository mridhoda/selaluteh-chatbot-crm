import express from 'express'
import mongoose from 'mongoose'
import { authRequired, attachUser } from '../middleware/auth.js'
import Platform from '../models/Platform.js' // asumsi model sudah ada

const router = express.Router()

// LIST semua platform milik user
router.get('/', authRequired, attachUser, async (req, res) => {
  try {
    const platforms = await Platform.find({ workspaceId: req.me.workspaceId }).sort({ createdAt: -1 });
    res.json(platforms)
  } catch (err) {
    console.error('GET /platforms error:', err)
    res.status(500).json({ error: 'Failed to list platforms' })
  }
})

// DETAIL satu platform
router.get('/:id', authRequired, attachUser, async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid platform id' })
    const row = await Platform.findOne({ _id: id, userId: req.me._id })
    if (!row) return res.status(404).json({ error: 'Platform not found' })
    res.json(row)
  } catch (err) {
    console.error('GET /platforms/:id error:', err)
    res.status(500).json({ error: 'Failed to get platform' })
  }
})

// CREATE platform
router.post('/', authRequired, attachUser, async (req, res) => {
  try {
    const { type, label, token, accountId, webhookSecret, appId, appSecret } = req.body
    if (!type || !label) return res.status(400).json({ error: 'Missing type or label' })
    console.log('req.me object:', req.me); // for debugging
    if (!req.me.workspaceId) return res.status(400).json({ error: 'User does not have a workspace' })

  const platform = await Platform.create({
    userId: req.me._id,
    workspaceId: req.me.workspaceId,
    type,
    label,
    token,
    accountId,
    webhookSecret,
    appId,
    appSecret,
  });
    res.json(platform)
  } catch (err) {
    console.error('POST /platforms error:', err)
    res.status(500).json({ error: 'Failed to create platform' })
  }
})

// UPDATE platform
router.put('/:id', authRequired, attachUser, async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid platform id' })
    const update = req.body || {}
    if (update.type) update.type = String(update.type).toLowerCase()
    const row = await Platform.findOneAndUpdate(
      { _id: id, workspaceId: req.me.workspaceId },
      { $set: update },
      { new: true }
    )
    if (!row) return res.status(404).json({ error: 'Platform not found' })
    res.json(row)
  } catch (err) {
    console.error('PUT /platforms/:id error:', err)
    res.status(500).json({ error: 'Failed to update platform' })
  }
})

// DELETE platform
router.delete('/:id', authRequired, attachUser, async (req, res) => {
  try {
    const { id } = req.params
    if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid platform id' })
  const result = await Platform.deleteOne({ _id: id, workspaceId: req.me.workspaceId });
    if (result.deletedCount === 0) return res.status(404).json({ error: 'Platform not found' });
    res.json({ ok: true })
  } catch (err) {
    console.error('DELETE /platforms/:id error:', err)
    res.status(500).json({ error: 'Failed to delete platform' })
  }
})

export default router
