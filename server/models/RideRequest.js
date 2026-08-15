const mongoose = require('mongoose');

const RideRequestSchema = new mongoose.Schema({
    traveler_name: { type: String, required: true },
    traveler_email: { type: String, required: true },
    traveler_phone: { type: String, default: '' },
    driver_name: { type: String, required: true },
    vehicle_type: { type: String, default: 'Car' },
    vehicle: { type: String, default: '' },
    vehicle_number: { type: String, default: '' },
    city: { type: String, default: '' },
    pickup: { type: String, required: true },
    drop_location: { type: String, required: true },
    price: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'accepted', 'declined', 'completed'], default: 'pending' },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RideRequest', RideRequestSchema);
