const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'safemate_secret_key_2024';

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
router.post('/signup', async (req, res) => {
    try {
        const {
            name, email, phone, password, role,
            traveler_id, traveler_id_type,
            driving_license, aadhar, age, emergency_contact
        } = req.body;

        if (!name || !email || !phone || !password || !role) {
            return res.status(400).json({ error: 'Please fill in all fields' });
        }

        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(400).json({ error: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
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
            otpExpires: Date.now() + 10 * 60 * 1000
        });

        await newUser.save();

        try {
            await sendOTPEmail(email, name, otp);
        } catch (mailErr) {
            console.error("Nodemailer failed to send OTP, fallback printing to console:", otp, mailErr);
        }

        res.json({ message: 'OTP sent to email. Please verify.', email: email });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/verify-otp
router.post('/verify-otp', async (req, res) => {
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
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'User account not found' });
        }

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
router.post('/login', async (req, res) => {
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

module.exports = router;
