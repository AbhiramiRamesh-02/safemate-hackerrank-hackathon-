const mongoose = require('mongoose');

const GuideBookingSchema = new mongoose.Schema({
    traveler_name: { type: String, required: true },
    traveler_email: { type: String, required: true },
    traveler_phone: { type: String, default: '' },
    guide_name: { type: String, required: true },
    tour_type: { type: String, required: true },
    booking_date: { type: Date, required: true },
    days: { type: Number, required: true },
    price: { type: String, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GuideBooking', GuideBookingSchema);
