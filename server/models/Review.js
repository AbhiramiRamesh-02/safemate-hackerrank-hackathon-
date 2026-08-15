const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    reviewer_name: { type: String, required: true },
    text: { type: String, required: true },
    service: { type: String, default: '' },
    rating: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Review', ReviewSchema);
