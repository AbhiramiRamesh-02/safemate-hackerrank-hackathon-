const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) {
            throw new Error('MONGODB_URI is not defined in the environment (.env file)');
        }
        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected successfully: ${conn.connection.host}`);
    } catch (err) {
        console.error('\n==================================================================');
        console.error('❌ MONGODB CONNECTION ERROR:');
        console.error(err.message);
        console.error('\n👉 CRITICAL STEPS TO RESOLVE:');
        console.error('1. Your current internet IP address might have changed.');
        console.error('2. Log in to your MongoDB Atlas dashboard (https://cloud.mongodb.com).');
        console.error('3. Go to "Network Access" in the left panel.');
        console.error('4. Click "Add IP Address" and select "Allow Access From Anywhere" (0.0.0.0/0).');
        console.error('5. Save changes and restart this server.');
        console.error('==================================================================\n');
        process.exit(1);
    }
};

module.exports = { connectDB };
