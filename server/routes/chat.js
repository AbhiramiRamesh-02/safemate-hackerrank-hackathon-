const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Message = require('../models/Message');

router.get('/:bookingId', authMiddleware, async (req, res) => {
    try {
        const messages = await Message.find({ bookingId: req.params.bookingId }).sort({ created_at: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { bookingId, text } = req.body;
        if (!bookingId || !text) {
            return res.status(400).json({ error: 'Booking ID and message text are required' });
        }

        const newMessage = new Message({
            bookingId,
            senderName: req.user.name,
            senderEmail: req.user.email,
            text
        });

        await newMessage.save();
        res.json(newMessage);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
