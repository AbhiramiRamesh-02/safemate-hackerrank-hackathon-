const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, required: true },
    role: { type: String, enum: ['traveler', 'driver', 'guide'], required: true },
    traveler_id: { type: String, default: null },
    traveler_id_type: { type: String, default: null },
    driving_license: { type: String, default: null },
    aadhar: { type: String, default: null },
    age: { type: Number, default: null },
    emergency_contact: { type: String, default: null },
    vehicle_type: { type: String, default: null },
    vehicle_brand: { type: String, default: null },
    vehicle_number: { type: String, default: null },
    city: { type: String, default: null },
    price_per_ride: { type: Number, default: null },
    rating: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },
    otpCode: { type: String, default: null },
    otpExpires: { type: Date, default: null },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
