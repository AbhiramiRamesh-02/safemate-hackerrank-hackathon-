const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const TravelGroup = require('../models/TravelGroup');

router.get('/', async (req, res) => {
    try {
        const groups = await TravelGroup.find({}).sort({ created_at: -1 });
        res.json(groups);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { title, category, starting_from, date } = req.body;

        if (!title || !category || !starting_from || !date) {
            return res.status(400).json({ error: 'Please fill in all fields' });
        }

        const newGroup = new TravelGroup({
            title,
            category,
            starting_from,
            date: new Date(date)
        });

        await newGroup.save();
        res.json({ message: 'Travel group created successfully', group: newGroup });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/:id/join', authMiddleware, async (req, res) => {
    try {
        const group = await TravelGroup.findByIdAndUpdate(
            req.params.id,
            { $inc: { members_count: 1 } },
            { new: true }
        );
        res.json({ message: 'Joined group successfully', group });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
