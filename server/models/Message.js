const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    bookingId: { type: String, required: true }, // Can be ride ID or guide booking ID
    senderName: { type: String, required: true },
    senderEmail: { type: String, required: true },
    text: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
