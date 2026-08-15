const mongoose = require('mongoose');

const StaySchema = new mongoose.Schema({
    name: { type: String, required: true },
    type: { type: String, enum: ['Hotel', 'PG'], default: 'PG' },
    city: { type: String, required: true },
    address: { type: String, required: true },
    price_per_month: { type: String, required: true },
    phone: { type: String, required: true },
    description: { type: String, default: 'Safe and secure women-only stay' },
    safety_rating: { type: Number, default: 5.0 },
    safety_measures: { type: [String], default: ['CCTV Monitoring', '24/7 Gate Guard', 'Verified Visitors'] },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Stay', StaySchema);
