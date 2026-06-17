import express from 'express';
import Complaint from '../models/Complaint.js';
import Chat from '../models/Chat.js';
import { authRequired, attachUser } from '../middleware/auth.js';
import { attachWorkspaceContext } from '../middleware/workspaceContext.js';
import { buildOutletScopedQuery } from '../services/access-control.service.js';

const router = express.Router();

router.use(authRequired, attachUser, attachWorkspaceContext);

// GET all complaints
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        const filter = await buildComplaintTenantQuery(req.me, req.query.outlet_id || req.query.outletId);
        if (status) filter.status = status;

        const complaints = await Complaint.find(filter)
            .populate('contactId', 'name phone email')
            .populate('agentId', 'name')
            .sort({ createdAt: -1 });

        res.json(complaints);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST create complaint
router.post('/', async (req, res) => {
    try {
        // Expected body: { chatId, text, platformType, contactId, agentId }
        // If coming from a chat context, these should be provided.
        const complaint = await Complaint.create({
            ...req.body,
            workspaceId: req.me.workspaceId,
            outletId: req.body.outletId || req.body.outlet_id || null,
        });
        res.json(complaint);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE complaint
router.delete('/:id', async (req, res) => {
    try {
        const query = await buildComplaintTenantQuery(req.me);
        query._id = req.params.id;
        const result = await Complaint.deleteOne(query);
        if (result.deletedCount === 0) return res.status(404).json({ error: 'Complaint not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update status
router.put('/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const query = await buildComplaintTenantQuery(req.me);
        query._id = req.params.id;
        const complaint = await Complaint.findOneAndUpdate(
            query,
            { status },
            { new: true }
        );
        if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
        res.json(complaint);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;

async function buildComplaintTenantQuery(user, outletId) {
    const baseQuery = await buildOutletScopedQuery(user, outletId);
    if (outletId) return baseQuery;

    const workspaceChats = await Chat.find({ workspaceId: user.workspaceId }).select('_id');
    return {
        $or: [
            baseQuery,
            {
                workspaceId: { $exists: false },
                chatId: { $in: workspaceChats.map((chat) => chat._id) },
            },
        ],
    };
}
