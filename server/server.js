const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const { connectDB } = require('./db');

// Import MongoDB Models
const User = require('./models/User');
const RideRequest = require('./models/RideRequest');
const GuideBooking = require('./models/GuideBooking');
const GuideService = require('./models/GuideService');
const Review = require('./models/Review');
const EmergencyContact = require('./models/EmergencyContact');
const TravelGroup = require('./models/TravelGroup');
const AnonymousReport = require('./models/AnonymousReport');
const DarkSpot = require('./models/DarkSpot');
const Stay = require('./models/Stay');
const StayBooking = require('./models/StayBooking');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'safemate_secret_key_2024';

// ─── MIDDLEWARE: Verify JWT Token ─────────────────────────────────────────────
function authMiddleware(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// ═══════════════════════════════════════════════════════
//  AUTH ROUTES
// ═══════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════
//  AUTH ROUTES
// ═══════════════════════════════════════════════════════

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'nayakananya32@gmail.com',
        pass: process.env.EMAIL_PASS || 'ekhcafwcajfbrhky'
    }
});

async function sendOTPEmail(email, name, otp) {
    const mailOptions = {
        from: `"SafeMate Guard" <${process.env.EMAIL_USER || 'nayakananya32@gmail.com'}>`,
        to: email,
        subject: '🔒 SafeMate Verification OTP Code',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #fbcfe8; border-radius: 16px; padding: 24px; background: #ffffff;">
                <h2 style="color: #be185d; text-align: center; margin-bottom: 20px;">SafeMate Verification</h2>
                <p>Hello <strong>${name}</strong>,</p>
                <p>Thank you for choosing SafeMate. To complete your female-safe registration, please enter the following 6-digit One-Time Password (OTP):</p>
                <div style="font-size: 28px; font-weight: 700; color: #be185d; text-align: center; background: #fff5f7; border: 1px dashed #fbcfe8; padding: 16px; margin: 24px 0; border-radius: 12px; letter-spacing: 4px;">
                    ${otp}
                </div>
                <p style="font-size: 12px; color: #71717a;">This verification code is valid for 10 minutes. Please do not share it with anyone.</p>
                <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
                <p style="font-size: 11px; text-align: center; color: #a1a1aa;">SafeMate Security Guardian System</p>
            </div>
        `
    };
    await transporter.sendMail(mailOptions);
}

// POST /api/signup
app.post('/api/signup', async (req, res) => {
    try {
        const {
            name, email, phone, password, role,
            traveler_id, traveler_id_type,
            driving_license, aadhar, age, emergency_contact
        } = req.body;

        if (!name || !email || !phone || !password || !role) {
            return res.status(400).json({ error: 'Please fill in all fields' });
        }

        // Check if email already exists
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const newUser = new User({
            name, email, phone, password: hashedPassword, role,
            traveler_id: traveler_id || null,
            traveler_id_type: traveler_id_type || null,
            driving_license: driving_license || null,
            aadhar: aadhar || null,
            age: age || null,
            emergency_contact: emergency_contact || null,
            isVerified: false,
            otpCode: otp,
            otpExpires: Date.now() + 10 * 60 * 1000 // 10 minutes
        });

        await newUser.save();

        try {
            await sendOTPEmail(email, name, otp);
        } catch (mailErr) {
            console.error("Nodemailer failed to send OTP, fallback printing code to server console:", otp, mailErr);
        }

        res.json({ message: 'OTP sent to email. Please verify.', email: email });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/verify-otp
app.post('/api/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: 'Please enter email and verification code' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'User account not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ error: 'Account is already verified. Please login.' });
        }

        if (user.otpCode !== otp || !user.otpExpires || user.otpExpires < new Date()) {
            return res.status(400).json({ error: 'Invalid or expired OTP code' });
        }

        // Set as verified
        user.isVerified = true;
        user.otpCode = null;
        user.otpExpires = null;
        await user.save();

        const token = jwt.sign({ email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during OTP verification' });
    }
});

// POST /api/resend-otp
app.post('/api/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'User account not found' });
        }

        // Generate new 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otpCode = otp;
        user.otpExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        try {
            await sendOTPEmail(user.email, user.name, otp);
        } catch (mailErr) {
            console.error("Nodemailer failed to send fresh OTP, fallback printing to console:", otp, mailErr);
        }

        res.json({ message: 'Fresh verification OTP sent to your email.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during OTP resend' });
    }
});

// POST /api/login
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Please enter email and password' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid email or password' });
        }

        if (!user.isVerified) {
            // Generate and send new OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            user.otpCode = otp;
            user.otpExpires = Date.now() + 10 * 60 * 1000;
            await user.save();
            try {
                await sendOTPEmail(user.email, user.name, otp);
            } catch (err) {
                console.error("Resend OTP error:", err);
            }
            return res.status(403).json({ error: 'UNVERIFIED', message: 'Verification OTP sent to your email. Please verify first.', email: user.email });
        }

        const token = jwt.sign({ email: user.email, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { name: user.name, email: user.email, role: user.role } });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// ═══════════════════════════════════════════════════════
//  USER ROUTES
// ═══════════════════════════════════════════════════════

// GET /api/me — get current user profile
app.get('/api/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email }).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/vehicle — save driver vehicle details
app.put('/api/vehicle', authMiddleware, async (req, res) => {
    try {
        const { vehicle_type, vehicle_brand, vehicle_number, city, price_per_ride } = req.body;

        await User.updateOne(
            { email: req.user.email },
            {
                $set: {
                    vehicle_type,
                    vehicle_brand,
                    vehicle_number,
                    city,
                    price_per_ride
                }
            }
        );

        res.json({ message: 'Vehicle details saved successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ═══════════════════════════════════════════════════════
//  DRIVERS & RIDES ROUTES
// ═══════════════════════════════════════════════════════

// GET /api/drivers — get all available drivers
app.get('/api/drivers', async (req, res) => {
    try {
        const drivers = await User.find({
            role: "driver",
            vehicle_number: { $ne: null }
        }).select('name email phone vehicle_type vehicle_brand vehicle_number city price_per_ride rating');
        res.json(drivers);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/rides — request a ride
app.post('/api/rides', authMiddleware, async (req, res) => {
    try {
        const { driver_name, vehicle_type, vehicle, vehicle_number, city, pickup, drop_location, price } = req.body;

        const newRide = new RideRequest({
            traveler_name: req.user.name,
            traveler_email: req.user.email,
            traveler_phone: req.body.phone || '',
            driver_name,
            vehicle_type,
            vehicle,
            vehicle_number,
            city,
            pickup,
            drop_location,
            price
        });

        await newRide.save();
        res.json({ message: 'Ride request sent successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/rides/pending — get pending ride requests (for driver)
app.get('/api/rides/pending', authMiddleware, async (req, res) => {
    try {
        const requests = await RideRequest.find({ status: 'pending' }).sort({ created_at: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/rides/my — get my completed/accepted rides (for driver)
app.get('/api/rides/my', authMiddleware, async (req, res) => {
    try {
        const requests = await RideRequest.find({
            status: { $in: ['accepted', 'completed'] }
        }).sort({ created_at: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/rides/:id/accept
app.put('/api/rides/:id/accept', authMiddleware, async (req, res) => {
    try {
        const ride = await RideRequest.findByIdAndUpdate(
            req.params.id,
            { $set: { status: 'accepted' } },
            { new: true }
        );
        res.json({ message: 'Ride accepted', ride });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/rides/:id/decline
app.put('/api/rides/:id/decline', authMiddleware, async (req, res) => {
    try {
        await RideRequest.findByIdAndUpdate(req.params.id, { $set: { status: 'declined' } });
        res.json({ message: 'Ride declined' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/rides/:id/complete
app.put('/api/rides/:id/complete', authMiddleware, async (req, res) => {
    try {
        await RideRequest.findByIdAndUpdate(req.params.id, { $set: { status: 'completed' } });
        res.json({ message: 'Ride completed' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/driver/stats — get driver earnings and stats
app.get('/api/driver/stats', authMiddleware, async (req, res) => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        const startOfToday = new Date(todayStr);

        const allRides = await RideRequest.find({
            status: { $in: ['accepted', 'completed'] }
        });

        const todayRides = allRides.filter(r => new Date(r.created_at) >= startOfToday);

        const driver = await User.findOne({ email: req.user.email }).select('rating');
        const rating = driver ? driver.rating : 4.5;

        const totalEarnings = allRides.reduce((sum, r) => sum + (r.price || 0), 0);
        const todayEarnings = todayRides.reduce((sum, r) => sum + (r.price || 0), 0);

        res.json({
            total_rides: allRides.length,
            today_rides: todayRides.length,
            total_earnings: totalEarnings,
            today_earnings: todayEarnings,
            rating: rating
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ═══════════════════════════════════════════════════════
//  GUIDES ROUTES
// ═══════════════════════════════════════════════════════

// GET /api/guides — get all available guides
app.get('/api/guides', async (req, res) => {
    try {
        const guides = await User.find({ role: "guide" }).select('name email phone city rating age');
        const services = await GuideService.find({});

        const joinedGuides = guides.map(guide => {
            const guideObj = guide.toObject();
            guideObj.services = services.filter(s => s.guide_email === guide.email);
            return guideObj;
        });

        res.json(joinedGuides);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/guide-services — add a guide service
app.post('/api/guide-services', authMiddleware, async (req, res) => {
    try {
        const { service_name, city, service_type, description, price } = req.body;

        const newService = new GuideService({
            guide_email: req.user.email,
            service_name,
            city,
            service_type,
            description,
            price
        });

        await newService.save();
        res.json({ message: 'Service added successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/guide-services/my — get current guide's services
app.get('/api/guide-services/my', authMiddleware, async (req, res) => {
    try {
        const services = await GuideService.find({ guide_email: req.user.email });
        res.json(services);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/bookings — book a guide
app.post('/api/bookings', authMiddleware, async (req, res) => {
    try {
        const { guide_name, tour_type, booking_date, days, price } = req.body;

        const newBooking = new GuideBooking({
            traveler_name: req.user.name,
            traveler_email: req.user.email,
            traveler_phone: req.body.phone || '',
            guide_name,
            tour_type,
            booking_date,
            days,
            price
        });

        await newBooking.save();
        res.json({ message: 'Booking confirmed successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/bookings/pending — get pending booking requests (for guide)
app.get('/api/bookings/pending', authMiddleware, async (req, res) => {
    try {
        const bookings = await GuideBooking.find({ status: 'pending' }).sort({ created_at: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/bookings/my — get accepted bookings (for guide)
app.get('/api/bookings/my', authMiddleware, async (req, res) => {
    try {
        const bookings = await GuideBooking.find({ status: 'accepted' }).sort({ created_at: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/bookings/:id/accept
app.put('/api/bookings/:id/accept', authMiddleware, async (req, res) => {
    try {
        const booking = await GuideBooking.findByIdAndUpdate(
            req.params.id,
            { $set: { status: 'accepted' } },
            { new: true }
        );
        res.json({ message: 'Booking accepted', booking });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/bookings/:id/decline
app.put('/api/bookings/:id/decline', authMiddleware, async (req, res) => {
    try {
        await GuideBooking.findByIdAndUpdate(req.params.id, { $set: { status: 'declined' } });
        res.json({ message: 'Booking declined' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ═══════════════════════════════════════════════════════
//  HOTELS & PG (STAYS) ROUTES
// ═══════════════════════════════════════════════════════

// GET /api/stays — get all stays
app.get('/api/stays', async (req, res) => {
    try {
        const stays = await Stay.find({}).sort({ created_at: -1 });
        res.json(stays);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/stays — register a new stay (direct owner registration)
app.post('/api/stays', async (req, res) => {
    try {
        const { name, type, city, address, price_per_month, phone, description, safety_measures } = req.body;
        const newStay = new Stay({
            name,
            type,
            city,
            address,
            price_per_month,
            phone,
            description,
            safety_measures: safety_measures ? safety_measures.split(',').map(s => s.trim()) : undefined
        });
        await newStay.save();
        res.json({ message: 'Stay registered successfully', stay: newStay });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/stays/book — book a stay
app.post('/api/stays/book', authMiddleware, async (req, res) => {
    try {
        const { stay_name, stay_type, price, phone } = req.body;
        const newBooking = new StayBooking({
            traveler_name: req.user.name,
            traveler_email: req.user.email,
            traveler_phone: phone || req.user.phone || '',
            stay_name,
            stay_type,
            price,
            booking_date: new Date()
        });
        await newBooking.save();
        res.json({ message: 'Stay booked successfully!', booking: newBooking });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/stays/bookings/my — get current traveler's stay bookings
app.get('/api/stays/bookings/my', authMiddleware, async (req, res) => {
    try {
        const bookings = await StayBooking.find({ traveler_email: req.user.email }).sort({ created_at: -1 });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ═══════════════════════════════════════════════════════
//  REVIEWS ROUTES
// ═══════════════════════════════════════════════════════

// GET /api/reviews
app.get('/api/reviews', async (req, res) => {
    try {
        const reviews = await Review.find({}).sort({ created_at: -1 });
        res.json(reviews);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/reviews
app.post('/api/reviews', authMiddleware, async (req, res) => {
    try {
        const { text, service, rating } = req.body;

        if (!text || !rating) {
            return res.status(400).json({ error: 'Please fill in all fields' });
        }

        const newReview = new Review({
            reviewer_name: req.user.name,
            text,
            service,
            rating
        });

        await newReview.save();
        res.json({ message: 'Review submitted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ═══════════════════════════════════════════════════════
//  EMERGENCY CONTACTS ROUTES
// ═══════════════════════════════════════════════════════

// GET /api/emergency-contacts
app.get('/api/emergency-contacts', authMiddleware, async (req, res) => {
    try {
        const contacts = await EmergencyContact.find({ user_email: req.user.email });
        res.json(contacts);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/emergency-contacts
app.post('/api/emergency-contacts', authMiddleware, async (req, res) => {
    try {
        const { contact_name, phone, relationship } = req.body;

        if (!contact_name || !phone) {
            return res.status(400).json({ error: 'Please fill in all fields' });
        }

        const newContact = new EmergencyContact({
            user_email: req.user.email,
            contact_name,
            phone,
            relationship
        });

        await newContact.save();
        res.json({ message: 'Emergency contact saved' });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ═══════════════════════════════════════════════════════
//  NEW HACKATHON ROUTES (Travel Groups, Reports, Dark Spots)
// ═══════════════════════════════════════════════════════

// GET /api/travel-groups - get travel partners
app.get('/api/travel-groups', async (req, res) => {
    try {
        const groups = await TravelGroup.find({}).sort({ created_at: -1 });
        res.json(groups);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/travel-groups - create a new group
app.post('/api/travel-groups', authMiddleware, async (req, res) => {
    try {
        const { title, category, starting_from, date } = req.body;

        if (!title || !category || !starting_from || !date) {
            return res.status(400).json({ error: 'Please fill in all fields' });
        }

        const newGroup = new TravelGroup({
            title,
            category,
            starting_from,
            date: new Date(date)
        });

        await newGroup.save();
        res.json({ message: 'Travel group created successfully', group: newGroup });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// PUT /api/travel-groups/:id/join - join an existing group
app.put('/api/travel-groups/:id/join', authMiddleware, async (req, res) => {
    try {
        const group = await TravelGroup.findByIdAndUpdate(
            req.params.id,
            { $inc: { members_count: 1 } },
            { new: true }
        );
        res.json({ message: 'Joined group successfully', group });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/anonymous-reports - get recent reports
app.get('/api/anonymous-reports', async (req, res) => {
    try {
        const reports = await AnonymousReport.find({}).sort({ created_at: -1 });
        res.json(reports);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/anonymous-reports - submit a report anonymously
app.post('/api/anonymous-reports', async (req, res) => {
    try {
        const { category, location, description } = req.body;

        if (!category || !location || !description) {
            return res.status(400).json({ error: 'Please fill in all fields' });
        }

        const newReport = new AnonymousReport({
            category,
            location,
            description
        });

        await newReport.save();
        res.json({ message: 'Report submitted anonymously successfully', report: newReport });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// GET /api/dark-spots - list risk spots
app.get('/api/dark-spots', async (req, res) => {
    try {
        const spots = await DarkSpot.find({}).sort({ created_at: -1 });
        res.json(spots);
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/dark-spots - report a dark spot
app.post('/api/dark-spots', authMiddleware, async (req, res) => {
    try {
        const { title, city, risk_level, description, latitude, longitude } = req.body;

        if (!title || !city || !risk_level) {
            return res.status(400).json({ error: 'Please fill in all fields' });
        }

        const newSpot = new DarkSpot({
            title,
            city,
            risk_level,
            description,
            latitude: latitude || 0,
            longitude: longitude || 0
        });

        await newSpot.save();
        res.json({ message: 'Dark spot reported successfully', spot: newSpot });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ═══════════════════════════════════════════════════════
//  START SERVER
// ═══════════════════════════════════════════════════════

const PORT = process.env.PORT || 3001;

async function startServer() {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Safemate MongoDB server running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err.message);
        process.exit(1);
    }
}

startServer();
