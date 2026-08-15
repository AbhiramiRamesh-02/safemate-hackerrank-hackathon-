const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Stay = require('../models/Stay');
const StayBooking = require('../models/StayBooking');

// GET /api/stays — get verified stays
router.get('/', async (req, res) => {
    try {
        const stays = await Stay.find({}).sort({ created_at: -1 });
        res.json(stays);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/stays — register stay (owner option)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, type, city, address, price_per_month, phone, description, safety_measures } = req.body;
        const newStay = new Stay({
            name,
            type,
            city,
            address,
            price_per_month,
            phone,
            description,
            safety_measures: safety_measures ? safety_measures.split(',').map(s => s.trim()) : undefined
        });
        await newStay.save();
        res.json({ message: 'Stay registered successfully', stay: newStay });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/stays/book — book a stay
router.post('/book', authMiddleware, async (req, res) => {
    try {
        const { stay_name, stay_type, price, phone } = req.body;
        const newBooking = new StayBooking({
            traveler_name: req.user.name,
            traveler_email: req.user.email,
            traveler_phone: phone || req.user.phone || '',
            stay_name,
            stay_type,
            price,
            booking_date: new Date()
        });
        await newBooking.save();
        res.json({ message: 'Stay booked successfully!', booking: newBooking });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/stays/bookings/my — get current traveler's stay bookings
router.get('/bookings/my', authMiddleware, async (req, res) => {
    try {
        const bookings = await StayBooking.find({ traveler_email: req.user.email }).sort({ created_at: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
