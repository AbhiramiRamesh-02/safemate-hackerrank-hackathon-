const mongoose = require('mongoose');

const StayBookingSchema = new mongoose.Schema({
    traveler_name: { type: String, required: true },
    traveler_email: { type: String, required: true },
    traveler_phone: { type: String, default: '' },
    stay_name: { type: String, required: true },
    stay_type: { type: String, default: 'PG' },
    price: { type: String, required: true },
    booking_date: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StayBooking', StayBookingSchema);
