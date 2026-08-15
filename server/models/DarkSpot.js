const mongoose = require('mongoose');

const DarkSpotSchema = new mongoose.Schema({
    title: { type: String, required: true },
    city: { type: String, required: true },
    risk_level: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
    description: { type: String, default: '' },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('DarkSpot', DarkSpotSchema);
