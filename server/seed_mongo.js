const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const GuideService = require('./models/GuideService');
const TravelGroup = require('./models/TravelGroup');
const DarkSpot = require('./models/DarkSpot');
const AnonymousReport = require('./models/AnonymousReport');
const Stay = require('./models/Stay');
const StayBooking = require('./models/StayBooking');

async function seedDatabase() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            console.error('Error: MONGODB_URI is not defined in your .env file.');
            process.exit(1);
        }

        console.log('Connecting to MongoDB Atlas...');
        await mongoose.connect(uri);
        console.log('Connected successfully. Cleaning database collections...');

        await User.deleteMany({});
        await GuideService.deleteMany({});
        await TravelGroup.deleteMany({});
        await DarkSpot.deleteMany({});
        await AnonymousReport.deleteMany({});
        await Stay.deleteMany({});
        await StayBooking.deleteMany({});

        const hashedPassword = await bcrypt.hash('password123', 10);
        
        console.log('Seeding Mock Traveler...');
        const traveler = new User({
            name: 'Aarushi Sharma',
            email: 'traveler@test.com',
            phone: '9876543299',
            password: hashedPassword,
            role: 'traveler',
            traveler_id: 'TR-999222',
            emergency_contact: '9876543210',
            isVerified: true
        });
        await traveler.save();

        const traveler2 = new User({
            name: 'Abhirami Ramesh',
            email: 'abhirami@gmail.com',
            phone: '9876543290',
            password: hashedPassword,
            role: 'traveler',
            traveler_id: 'TR-888111',
            emergency_contact: '9876543210',
            isVerified: true
        });
        await traveler2.save();

        const traveler3 = new User({
            name: 'Anvitha',
            email: 'anvitha@gmail.com',
            phone: '9876543288',
            password: hashedPassword,
            role: 'traveler',
            traveler_id: 'TR-777333',
            emergency_contact: '9876543210',
            isVerified: true
        });
        await traveler3.save();
        
        const drivers = [
            {
                name: 'Priya Singh',
                email: 'priya@driver.com',
                phone: '9876543210',
                password: hashedPassword,
                role: 'driver',
                vehicle_type: 'Sedan',
                vehicle_brand: 'Toyota Innova',
                vehicle_number: 'KA 01 AB 1234',
                city: 'Bangalore',
                price_per_ride: 450,
                rating: 4.8,
                isVerified: true
            },
            {
                name: 'Sneha Reddy',
                email: 'sneha@driver.com',
                phone: '9876543211',
                password: hashedPassword,
                role: 'driver',
                vehicle_type: 'SUV',
                vehicle_brand: 'Mahindra XUV500',
                vehicle_number: 'TN 02 CD 5678',
                city: 'Chennai',
                price_per_ride: 600,
                rating: 4.9,
                isVerified: true
            },
            {
                name: 'Anita Menon',
                email: 'anita@driver.com',
                phone: '9876543212',
                password: hashedPassword,
                role: 'driver',
                vehicle_type: 'Sedan',
                vehicle_brand: 'Honda City',
                vehicle_number: 'RJ 03 EF 9012',
                city: 'Jaipur',
                price_per_ride: 500,
                rating: 4.7,
                isVerified: true
            }
        ];
        await User.insertMany(drivers);

        console.log('Seeding Mock Guides & Guide Services...');
        const guide1 = new User({
            name: 'Anjali Sharma',
            email: 'anjali@guide.com',
            phone: '9876543220',
            password: hashedPassword,
            role: 'guide',
            city: 'Jaipur',
            age: 35,
            rating: 4.9,
            isVerified: true
        });
        await guide1.save();

        const service1 = new GuideService({
            guide_email: 'anjali@guide.com',
            service_name: 'Jaipur Heritage Tours',
            city: 'Jaipur',
            service_type: 'Heritage Tour',
            description: 'Full day sightseeing including Hawa Mahal, City Palace, Amber Fort.',
            price: '₹2,500'
        });
        await service1.save();

        const guide2 = new User({
            name: 'Meera Nair',
            email: 'meera@guide.com',
            phone: '9876543221',
            password: hashedPassword,
            role: 'guide',
            city: 'Coorg',
            age: 28,
            rating: 4.8,
            isVerified: true
        });
        await guide2.save();

        const service2 = new GuideService({
            guide_email: 'meera@guide.com',
            service_name: 'Coorg Nature Guide',
            city: 'Coorg',
            service_type: 'Nature Trek',
            description: '2-day trekking tour through coffee plantations and waterfalls.',
            price: '₹4,000'
        });
        await service2.save();

        console.log('Seeding Mock Travel Groups (Cab Pooling)...');
        const groups = [
            {
                title: 'Coorg Nature Trek Cab Pool',
                category: 'Cab Pooling',
                members_count: 2,
                starting_from: 'Bangalore Majestic',
                date: new Date('2026-09-15')
            },
            {
                title: 'Goa Weekend Getaway',
                category: 'Group Vacation',
                members_count: 4,
                starting_from: 'Mumbai Central',
                date: new Date('2026-10-01')
            },
            {
                title: 'Jaipur Forts Shared Trip',
                category: 'Weekend Trek',
                members_count: 3,
                starting_from: 'Delhi IGI Airport',
                date: new Date('2026-09-20')
            }
        ];
        await TravelGroup.insertMany(groups);

        console.log('Seeding Mock Dark Spots (Unsafe areas)...');
        const darkSpots = [
            {
                title: 'Unlit lane behind Central Mall',
                city: 'Bangalore',
                risk_level: 'High',
                description: 'Streetlights are broken and there is no security guard presence. Stalking cases reported.'
            },
            {
                title: 'Isolated alley near Jaipur Fort exit',
                city: 'Jaipur',
                risk_level: 'Medium',
                description: 'Low foot traffic after 6 PM. Recommended to hire a verified driver.'
            }
        ];
        await DarkSpot.insertMany(darkSpots);

        console.log('Seeding Mock Anonymous Reports...');
        const reports = [
            {
                category: 'Stalking & Following',
                location: 'Majestic Metro Station, Bangalore',
                description: 'A suspicious individual was following women solo travelers on the skywalk around 9 PM.'
            },
            {
                category: 'Unsafe Restroom',
                location: 'Jaipur Highway Toll Restroom',
                description: 'The women restroom did not have a latch on the inside door.'
            }
        ];
        await AnonymousReport.insertMany(reports);

        console.log('Seeding Mock Stays (Verified Hotels & PGs)...');
        const stays = [
            {
                name: 'Royal Palace Female PG',
                type: 'PG',
                city: 'Bangalore',
                address: '12th Main Rd, Indiranagar, Bangalore',
                price_per_month: '₹8,500 / Month',
                phone: '9876543290',
                description: 'Highly rated, premium women-only PG with shared kitchen, high-speed WiFi, and biometric entry.',
                safety_rating: 4.9,
                safety_measures: ['CCTV Monitoring', 'Biometric Gate Access', '24/7 On-duty Female Warden', 'Verified Guest Logbook']
            },
            {
                name: 'Pink Haven Tourist Hotel',
                type: 'Hotel',
                city: 'Jaipur',
                address: 'MI Road, Near Panch Batti, Jaipur',
                price_per_month: '₹2,200 / Night',
                phone: '9876543291',
                description: 'Safe tourist accommodation with verified female-friendly rooms, single locks, and pick-up services.',
                safety_rating: 4.8,
                safety_measures: ['24/7 Security Desk', 'Double Door Locks', 'Female Reception Staff Only', 'Safe Cab Pick-up']
            },
            {
                name: 'Secure Nest Women Stay',
                type: 'PG',
                city: 'Chennai',
                address: 'GN Chetty Road, T. Nagar, Chennai',
                price_per_month: '₹7,500 / Month',
                phone: '9876543292',
                description: 'Budget-friendly safe room rentals for working women and students near transit networks.',
                safety_rating: 4.7,
                safety_measures: ['CCTV Surveillance', 'Biometric Entry', 'Emergency Call Button']
            }
        ];
        await Stay.insertMany(stays);

        console.log('Database seeded successfully!');
        mongoose.connection.close();
    } catch (err) {
        console.error('Seed Error:', err.message);
        process.exit(1);
    }
}

seedDatabase();
