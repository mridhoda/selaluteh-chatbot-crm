/**
 * analytics.js — Supabase-backed (task 24.10)
 *
 * Analytics routes. Migrated from Mongoose aggregation pipelines to
 * Supabase/Postgres queries. The complex $lookup/$group pipelines are
 * replaced with Postgres-native GROUP BY queries via Supabase RPC
 * or simplified count queries.
 *
 * NOTE: Peak analytics require workspace-scoped message counts.
 * The old pipeline was user-scoped, which was
 * incorrect for multi-workspace. Now scoped to workspaceId.
 */

import express from 'express';
import { authRequired, attachUser } from '../middleware/auth.js';
import { getSupabaseServiceClient } from '../db/supabase.js';

const router = express.Router();

// /analytics/traffic?groupBy=day|week
router.get('/traffic', authRequired, attachUser, async (req, res) => {
  try {
    const workspaceId = req.me.workspaceId;
    const groupBy = (req.query.groupBy || 'day').toLowerCase();

    const client = getSupabaseServiceClient();
    // Get messages for this workspace, ordered by date
    const { data: messages, error } = await client
      .from('chat_messages')
      .select('created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Group in-memory by day or week
    const counts = {};
    for (const msg of messages ?? []) {
      const d = new Date(msg.created_at);
      let key;
      if (groupBy === 'week') {
        const year = d.getFullYear();
        const weekNum = Math.ceil(((d - new Date(year, 0, 1)) / 86400000 + new Date(year, 0, 1).getDay() + 1) / 7);
        key = `${year}-W${String(weekNum).padStart(2, '0')}`;
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
      counts[key] = (counts[key] ?? 0) + 1;
    }

    const rows = Object.entries(counts).map(([_id, count]) => ({ _id, count }));
    res.json(rows);
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Analytics pipeline failed', detail: err.message });
  }
});

router.get('/platforms', authRequired, attachUser, async (req, res) => {
  try {
    const workspaceId = req.me.workspaceId;
    const client = getSupabaseServiceClient();

    // Get chats with platform labels
    const { data: chats, error } = await client
      .from('chats')
      .select('platform_id, platforms(type, label)')
      .eq('workspace_id', workspaceId);

    if (error) throw error;

    const counts = {};
    for (const chat of chats ?? []) {
      const label = chat.platforms?.label || chat.platforms?.type || 'Direct';
      counts[label] = (counts[label] ?? 0) + 1;
    }

    const rows = Object.entries(counts)
      .map(([_id, count]) => ({ _id, count }))
      .sort((a, b) => b.count - a.count);

    res.json(rows);
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Analytics pipeline failed', detail: err.message });
  }
});

router.get('/agents', authRequired, attachUser, async (req, res) => {
  try {
    const workspaceId = req.me.workspaceId;
    const client = getSupabaseServiceClient();

    const { data: chats, error } = await client
      .from('chats')
      .select('agent_id, agents(name)')
      .eq('workspace_id', workspaceId)
      .not('agent_id', 'is', null);

    if (error) throw error;

    const counts = {};
    for (const chat of chats ?? []) {
      const name = chat.agents?.name || 'Unknown';
      counts[name] = (counts[name] ?? 0) + 1;
    }

    const rows = Object.entries(counts)
      .map(([_id, count]) => ({ _id, count }))
      .sort((a, b) => b.count - a.count);

    res.json(rows);
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Analytics pipeline failed', detail: err.message });
  }
});

router.get('/peak-hours', authRequired, attachUser, async (req, res) => {
  try {
    const workspaceId = req.me.workspaceId;
    const client = getSupabaseServiceClient();

    const { data: messages, error } = await client
      .from('chat_messages')
      .select('created_at')
      .eq('workspace_id', workspaceId)
      .eq('sender_type', 'contact'); // Only inbound/contact messages

    if (error) throw error;

    const hourlyData = Array(24).fill(0);
    for (const msg of messages ?? []) {
      const hour = new Date(msg.created_at).getHours();
      hourlyData[hour]++;
    }

    const labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
    const maxCount = Math.max(...hourlyData);
    const peakHour = hourlyData.indexOf(maxCount);

    res.json({
      labels,
      data: hourlyData,
      peakHour: `${String(peakHour).padStart(2, '0')}:00`,
      peakCount: maxCount,
    });
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Analytics pipeline failed', detail: err.message });
  }
});

export default router;
