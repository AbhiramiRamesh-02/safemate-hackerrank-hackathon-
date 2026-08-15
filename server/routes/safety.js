const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const DarkSpot = require('../models/DarkSpot');
const AnonymousReport = require('../models/AnonymousReport');
const EmergencyContact = require('../models/EmergencyContact');

// GET /api/darkspots — get dark spots
router.get('/darkspots', async (req, res) => {
    try {
        const spots = await DarkSpot.find({}).sort({ created_at: -1 });
        res.json(spots);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/darkspots/report — report a new dark spot
router.post('/darkspots/report', authMiddleware, async (req, res) => {
    try {
        const { latitude, longitude, description, city } = req.body;
        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Coordinates are required' });
        }

        const newSpot = new DarkSpot({
            reporter_name: req.user.name,
            reporter_email: req.user.email,
            latitude,
            longitude,
            description: description || '',
            city: city || ''
        });

        await newSpot.save();
        res.json({ message: 'Dark spot reported successfully', spot: newSpot });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/reports/anonymous — get all anonymous community alerts
router.get('/reports/anonymous', async (req, res) => {
    try {
        const reports = await AnonymousReport.find({}).sort({ created_at: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/reports/anonymous — report anonymous community alert
router.post('/reports/anonymous', authMiddleware, async (req, res) => {
    try {
        const { description, city } = req.body;
        if (!description) {
            return res.status(400).json({ error: 'Description is required' });
        }

        const newReport = new AnonymousReport({
            description,
            city: city || ''
        });

        await newReport.save();
        res.json({ message: 'Anonymous community report recorded successfully', report: newReport });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/emergency/contacts — get saved emergency contacts
router.get('/emergency/contacts', authMiddleware, async (req, res) => {
    try {
        const contacts = await EmergencyContact.find({ traveler_email: req.user.email }).sort({ created_at: -1 });
        res.json(contacts);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/emergency/contacts/save — save an emergency contact
router.post('/emergency/contacts/save', authMiddleware, async (req, res) => {
    try {
        const { name, phone, relationship } = req.body;
        if (!name || !phone) {
            return res.status(400).json({ error: 'Name and Phone are required' });
        }

        const newContact = new EmergencyContact({
            traveler_email: req.user.email,
            name,
            phone,
            relationship: relationship || 'Other'
        });

        await newContact.save();
        res.json({ message: 'Emergency contact saved successfully', contact: newContact });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
