const mongoose = require('mongoose');

const EmergencyContactSchema = new mongoose.Schema({
    user_email: { type: String, required: true },
    contact_name: { type: String, required: true },
    phone: { type: String, required: true },
    relationship: { type: String, default: '' },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('EmergencyContact', EmergencyContactSchema);
