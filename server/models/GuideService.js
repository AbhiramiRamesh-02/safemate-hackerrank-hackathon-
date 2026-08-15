const mongoose = require('mongoose');

const GuideServiceSchema = new mongoose.Schema({
    guide_email: { type: String, required: true },
    service_name: { type: String, required: true },
    city: { type: String, required: true },
    service_type: { type: String, required: true },
    description: { type: String, default: '' },
    price: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GuideService', GuideServiceSchema);
