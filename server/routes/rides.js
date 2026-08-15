const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const RideRequest = require('../models/RideRequest');

// GET /api/drivers — get all available drivers
router.get('/drivers', async (req, res) => {
    try {
        const drivers = await User.find({
            role: "driver",
            vehicle_number: { $ne: null }
        }).select('name email phone vehicle_type vehicle_brand vehicle_number city price_per_ride rating');
        res.json(drivers);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/rides — request a ride
router.post('/rides', authMiddleware, async (req, res) => {
    try {
        const { driver_name, vehicle_type, vehicle, vehicle_number, city, pickup, drop_location, price } = req.body;

        const newRide = new RideRequest({
            traveler_name: req.user.name,
            traveler_email: req.user.email,
            traveler_phone: req.body.phone || '',
            driver_name,
            vehicle_type,
            vehicle,
            vehicle_number,
            city,
            pickup,
            drop_location,
            price
        });

        await newRide.save();
        res.json({ message: 'Ride request sent successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/rides/pending — get pending ride requests
router.get('/rides/pending', authMiddleware, async (req, res) => {
    try {
        let filter = { status: 'pending' };
        if (req.user.role === 'traveler') {
            filter.traveler_email = req.user.email;
        }
        const requests = await RideRequest.find(filter).sort({ created_at: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/rides/my — get completed/accepted rides
router.get('/rides/my', authMiddleware, async (req, res) => {
    try {
        let filter = { status: { $in: ['accepted', 'completed'] } };
        if (req.user.role === 'traveler') {
            filter.traveler_email = req.user.email;
        } else if (req.user.role === 'driver') {
            filter.driver_name = req.user.name;
        }
        const requests = await RideRequest.find(filter).sort({ created_at: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/rides/:id/accept
router.put('/rides/:id/accept', authMiddleware, async (req, res) => {
    try {
        const ride = await RideRequest.findByIdAndUpdate(
            req.params.id,
            { $set: { status: 'accepted' } },
            { new: true }
        );
        res.json({ message: 'Ride accepted', ride });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/rides/:id/decline
router.put('/rides/:id/decline', authMiddleware, async (req, res) => {
    try {
        await RideRequest.findByIdAndUpdate(req.params.id, { $set: { status: 'declined' } });
        res.json({ message: 'Ride declined' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/rides/:id/complete
router.put('/rides/:id/complete', authMiddleware, async (req, res) => {
    try {
        await RideRequest.findByIdAndUpdate(req.params.id, { $set: { status: 'completed' } });
        res.json({ message: 'Ride completed' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/driver/stats — get driver earnings and stats
router.get('/driver/stats', authMiddleware, async (req, res) => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const startOfToday = new Date(todayStr);

        const allRides = await RideRequest.find({
            status: { $in: ['accepted', 'completed'] }
        });
        
        const myRides = allRides.filter(r => r.driver_name === req.user.name);
        const myCompletedRides = myRides.filter(r => r.status === 'completed');
        const myTodayRides = myRides.filter(r => new Date(r.created_at) >= startOfToday);

        const totalEarnings = myCompletedRides.reduce((sum, r) => sum + r.price, 0);
        const todayEarnings = myTodayRides.filter(r => r.status === 'completed').reduce((sum, r) => sum + r.price, 0);

        res.json({
            totalRides: myRides.length,
            completedRides: myCompletedRides.length,
            todayRides: myTodayRides.length,
            totalEarnings,
            todayEarnings
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
