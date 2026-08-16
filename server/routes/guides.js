const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const GuideService = require('../models/GuideService');
const GuideBooking = require('../models/GuideBooking');

router.get('/guides', async (req, res) => {
    try {
        const guides = await User.find({ role: 'guide' }).select('name email phone city age rating');
        const services = await GuideService.find({});

        const joinedGuides = guides.map(guide => {
            const guideObj = guide.toObject();
            guideObj.services = services.filter(s => s.guide_email === guide.email);
            return guideObj;
        });

        res.json(joinedGuides);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/guide-services/my', authMiddleware, async (req, res) => {
    try {
        const services = await GuideService.find({ guide_email: req.user.email }).sort({ created_at: -1 });
        res.json(services);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/guide-services', authMiddleware, async (req, res) => {
    try {
        const { service_name, city, service_type, description, price } = req.body;

        const newService = new GuideService({
            guide_email: req.user.email,
            service_name,
            city,
            service_type,
            description,
            price
        });

        await newService.save();
        res.json({ message: 'Guide service registered successfully', service: newService });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/bookings', authMiddleware, async (req, res) => {
    try {
        const { guide_name, tour_type, booking_date, days, price } = req.body;

        const newBooking = new GuideBooking({
            traveler_name: req.user.name,
            traveler_email: req.user.email,
            traveler_phone: req.body.phone || '',
            guide_name,
            tour_type,
            booking_date,
            days,
            price
        });

        await newBooking.save();
        res.json({ message: 'Booking confirmed successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/bookings/pending', authMiddleware, async (req, res) => {
    try {
        let filter = { status: 'pending' };
        if (req.user.role === 'traveler') {
            filter.traveler_email = req.user.email;
        } else if (req.user.role === 'guide') {
            filter.guide_name = req.user.name;
        }
        const bookings = await GuideBooking.find(filter).sort({ created_at: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/bookings/my', authMiddleware, async (req, res) => {
    try {
        let filter = { status: 'accepted' };
        if (req.user.role === 'traveler') {
            filter.traveler_email = req.user.email;
        } else if (req.user.role === 'guide') {
            filter.guide_name = req.user.name;
        }
        const bookings = await GuideBooking.find(filter).sort({ created_at: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/bookings/:id/accept', authMiddleware, async (req, res) => {
    try {
        const booking = await GuideBooking.findByIdAndUpdate(
            req.params.id,
            { $set: { status: 'accepted' } },
            { new: true }
        );
        res.json({ message: 'Booking accepted', booking });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.put('/bookings/:id/decline', authMiddleware, async (req, res) => {
    try {
        await GuideBooking.findByIdAndUpdate(req.params.id, { $set: { status: 'declined' } });
        res.json({ message: 'Booking declined' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
