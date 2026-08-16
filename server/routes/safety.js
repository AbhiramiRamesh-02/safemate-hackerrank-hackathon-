const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const DarkSpot = require('../models/DarkSpot');
const AnonymousReport = require('../models/AnonymousReport');
const EmergencyContact = require('../models/EmergencyContact');

router.get('/dark-spots', async (req, res) => {
    try {
        const spots = await DarkSpot.find({}).sort({ created_at: -1 });
        res.json(spots);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/dark-spots', authMiddleware, async (req, res) => {
    try {
        const { title, city, risk_level, description, latitude, longitude } = req.body;
        if (!title || !city || !risk_level) {
            return res.status(400).json({ error: 'Title, City and Risk Level are required' });
        }

        const newSpot = new DarkSpot({
            title,
            city,
            risk_level,
            description: description || '',
            latitude: latitude || 0,
            longitude: longitude || 0
        });

        await newSpot.save();
        res.json({ message: 'Dark spot reported successfully', spot: newSpot });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/anonymous-reports', async (req, res) => {
    try {
        const reports = await AnonymousReport.find({}).sort({ created_at: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/anonymous-reports', async (req, res) => {
    try {
        const { category, location, description } = req.body;

        if (!category || !location || !description) {
            return res.status(400).json({ error: 'Category, Location and Description are required' });
        }

        const newReport = new AnonymousReport({
            category,
            location,
            description
        });

        await newReport.save();
        res.json({ message: 'Report submitted anonymously successfully', report: newReport });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/emergency-contacts', authMiddleware, async (req, res) => {
    try {
        const contacts = await EmergencyContact.find({ user_email: req.user.email }).sort({ created_at: -1 });
        res.json(contacts);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/emergency-contacts', authMiddleware, async (req, res) => {
    try {
        const { contact_name, phone, relationship } = req.body;
        if (!contact_name || !phone) {
            return res.status(400).json({ error: 'Contact name and phone number are required' });
        }

        const newContact = new EmergencyContact({
            user_email: req.user.email,
            contact_name,
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
