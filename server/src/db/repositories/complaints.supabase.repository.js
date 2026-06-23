/**
 * complaints.supabase.repository.js — Supabase-backed
 *
 * Replaces Mongoose Complaint model.
 * DB table: complaints
 */

import { getSupabaseServiceClient } from '../supabase.js';
import { mapRow, mapRows } from '../supabase-mapper.js';
import { extractData, extractSingle } from '../supabase-errors.js';
import { requireWorkspaceId } from '../supabase-query.js';

const TABLE = 'complaints';

export const complaintsSupabaseRepository = {
  /**
   * List complaints for a workspace, with optional outlet and status filters.
   */
  async list({ workspaceId, outletId, status, outletIds }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    let q = client
      .from(TABLE)
      .select('*, contacts(id, name, phone, email), agents(id, name)')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    if (status) q = q.eq('status', status);
    if (outletId) q = q.eq('outlet_id', outletId);
    else if (outletIds && outletIds.length > 0) q = q.in('outlet_id', outletIds);
    const result = await q;
    return mapRows(extractData(result, 'complaints.list') ?? []);
  },

  /**
   * Find a complaint by workspace + complaint ID.
   */
  async findById({ workspaceId, complaintId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .select('*, contacts(id, name, phone, email)')
      .eq('workspace_id', workspaceId)
      .eq('id', complaintId)
      .maybeSingle();
    const row = extractSingle(result, 'complaints.findById');
    return row ? mapRow(row) : null;
  },

  /**
   * Create a complaint.
   */
  async create(data) {
    requireWorkspaceId(data.workspaceId);
    const client = getSupabaseServiceClient();
    const insert = {
      workspace_id: data.workspaceId,
      outlet_id: data.outletId || null,
      contact_id: data.contactId || null,
      chat_id: data.chatId || null,
      platform_id: data.platformId || null,
      agent_id: data.agentId || null,
      order_id: data.orderId || null,
      subject: data.subject || data.text || '',
      description: data.description || data.text || null,
      status: data.status || 'open',
      priority: data.priority || 'medium',
      form_data: data.formData || {},
      metadata: data.metadata || {},
    };
    const result = await client.from(TABLE).insert(insert).select().single();
    return mapRow(extractSingle(result, 'complaints.create'));
  },

  /**
   * Update complaint status and/or fields.
   */
  async update({ workspaceId, complaintId, updates }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const allowed = ['status', 'priority', 'resolutionNotes', 'assignedToUserId', 'formData', 'metadata'];
    const set = {};
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        const dbKey = {
          resolutionNotes: 'resolution_notes',
          assignedToUserId: 'assigned_to_user_id',
          formData: 'form_data',
        }[key] ?? key;
        set[dbKey] = updates[key];
      }
    }
    const { data: before } = await client.from(TABLE).select('status, priority').eq('id', complaintId).maybeSingle();
    const result = await client
      .from(TABLE)
      .update(set)
      .eq('workspace_id', workspaceId)
      .eq('id', complaintId)
      .select()
      .maybeSingle();
    const row = extractSingle(result, 'complaints.update');
    if (row && before && (before.status !== row.status || before.priority !== row.priority)) {
      await this.addEvent({
        complaintId,
        actor: updates.actor || 'system',
        eventType: before.status !== row.status ? 'status_change' : 'priority_change',
        oldStatus: before.status,
        newStatus: row.status !== before.status ? row.status : row.priority !== before.priority ? row.priority : undefined,
        note: updates.updateNote || null,
      });
    }
    return row ? mapRow(row) : null;
  },

  async addEvent({ complaintId, actor, eventType, oldStatus, newStatus, note, metadata }) {
    const client = getSupabaseServiceClient();
    await client.from('complaint_events').insert({
      complaint_id: complaintId, actor, event_type: eventType,
      old_status: oldStatus, new_status: newStatus, note: note || null,
      metadata: metadata || {},
    });
  },

  async getEvents(complaintId) {
    const client = getSupabaseServiceClient();
    const result = await client.from('complaint_events').select('*').eq('complaint_id', complaintId).order('created_at', { ascending: true });
    return extractData(result, 'complaints.getEvents') ?? [];
  },

  /**
   * Delete a complaint.
   */
  async deleteById({ workspaceId, complaintId }) {
    requireWorkspaceId(workspaceId);
    const client = getSupabaseServiceClient();
    const result = await client
      .from(TABLE)
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('id', complaintId);
    return !result.error;
  },
};
