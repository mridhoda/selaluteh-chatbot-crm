import express from 'express';
import Complaint from '../models/Complaint.js';

const router = express.Router();

// GET all complaints
router.get('/', async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
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
        const complaint = await Complaint.create(req.body);
        res.json(complaint);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE complaint
router.delete('/:id', async (req, res) => {
    try {
        await Complaint.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT update status
router.put('/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const complaint = await Complaint.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        res.json(complaint);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
