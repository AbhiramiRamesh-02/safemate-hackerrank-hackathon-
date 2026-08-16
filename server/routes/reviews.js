const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Review = require('../models/Review');

router.get('/', async (req, res) => {
    try {
        const reviews = await Review.find({}).sort({ created_at: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/', authMiddleware, async (req, res) => {
    try {
        const { text, service, rating } = req.body;
        if (!text || !rating) {
            return res.status(400).json({ error: 'Please fill in all fields' });
        }

        const newReview = new Review({
            reviewer_name: req.user.name,
            text,
            service,
            rating
        });
        await newReview.save();
        res.json({ message: 'Review submitted successfully', review: newReview });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
