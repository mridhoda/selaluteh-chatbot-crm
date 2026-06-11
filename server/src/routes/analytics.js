import express from 'express'
import Message from '../models/Message.js'
import Chat from '../models/Chat.js'
import { authRequired, attachUser } from '../middleware/auth.js'

const router = express.Router()

// /analytics/traffic?groupBy=day|week
router.get('/traffic', authRequired, attachUser, async (req, res) => {
  try {
    const groupBy = (req.query.groupBy || 'day').toLowerCase()

    const base = [
      { $lookup: { from: 'chats', localField: 'chatId', foreignField: '_id', as: 'chat' } },
      { $unwind: '$chat' },
      { $match: { 'chat.userId': req.me._id } },
    ]

    let pipeline
    if (groupBy === 'week') {
      pipeline = base.concat([
        { $group: { _id: { y: { $isoWeekYear: '$createdAt' }, w: { $isoWeek: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.y': 1, '_id.w': 1 } }
      ])
    } else {
      pipeline = base.concat([
        { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' }, d: { $dayOfMonth: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } }
      ])
    }

    const rows = await Message.aggregate(pipeline)
    res.json(rows)
  } catch (err) {
    console.error('Analytics error:', err)
    res.status(500).json({ error: 'Analytics pipeline failed', detail: err.message })
  }
})

router.get('/platforms', authRequired, attachUser, async (req, res) => {
  try {
    const pipeline = [
      { $lookup: { from: 'chats', localField: 'chatId', foreignField: '_id', as: 'chat' } },
      { $unwind: '$chat' },
      { $match: { 'chat.userId': req.me._id } },
      { $lookup: { from: 'platforms', localField: 'chat.platformId', foreignField: '_id', as: 'platform' } },
      {
        $addFields: {
          platformName: {
            $cond: {
              if: { $gt: [{ $size: '$platform' }, 0] },
              then: { $arrayElemAt: ['$platform.name', 0] },
              else: 'Direct'
            }
          }
        }
      },
      { $group: { _id: '$platformName', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]

    const rows = await Message.aggregate(pipeline)
    res.json(rows)
  } catch (err) {
    console.error('Analytics error:', err)
    res.status(500).json({ error: 'Analytics pipeline failed', detail: err.message })
  }
})

router.get('/agents', authRequired, attachUser, async (req, res) => {
  try {
    const pipeline = [
      { $lookup: { from: 'chats', localField: 'chatId', foreignField: '_id', as: 'chat' } },
      { $unwind: '$chat' },
      { $match: { 'chat.userId': req.me._id } },
      { $lookup: { from: 'agents', localField: 'chat.agentId', foreignField: '_id', as: 'agent' } },
      { $unwind: '$agent' },
      { $group: { _id: '$agent.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]

    const rows = await Message.aggregate(pipeline)
    res.json(rows)
  } catch (err) {
    console.error('Analytics error:', err)
    res.status(500).json({ error: 'Analytics pipeline failed', detail: err.message })
  }
})

router.get('/peak-hours', authRequired, attachUser, async (req, res) => {
  try {
    const pipeline = [
      { $lookup: { from: 'chats', localField: 'chatId', foreignField: '_id', as: 'chat' } },
      { $unwind: '$chat' },
      { $match: { 'chat.userId': req.me._id, from: 'user' } }, // Only user messages
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const rows = await Message.aggregate(pipeline);

    // Create array for all 24 hours
    const hourlyData = Array(24).fill(0);
    rows.forEach(row => {
      hourlyData[row._id] = row.count;
    });

    // Generate labels (00:00, 01:00, ..., 23:00)
    const labels = Array.from({ length: 24 }, (_, i) =>
      `${String(i).padStart(2, '0')}:00`
    );

    // Find peak hour
    const maxCount = Math.max(...hourlyData);
    const peakHour = hourlyData.indexOf(maxCount);

    res.json({
      labels,
      data: hourlyData,
      peakHour: `${String(peakHour).padStart(2, '0')}:00`,
      peakCount: maxCount
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Analytics pipeline failed', detail: err.message });
  }
});

export default router
