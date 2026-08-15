const mongoose = require('mongoose');

const TravelGroupSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    members_count: { type: Number, default: 1 },
    starting_from: { type: String, required: true },
    date: { type: Date, required: true },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('TravelGroup', TravelGroupSchema);
