const mongoose = require('mongoose');

const AnonymousReportSchema = new mongoose.Schema({
    category: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AnonymousReport', AnonymousReportSchema);
