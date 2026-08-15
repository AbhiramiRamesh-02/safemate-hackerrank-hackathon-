const express = require('express');
const cors = require('cors');
const { connectDB } = require('./db');
require('dotenv').config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes Mounts
app.use('/api', require('./routes/auth'));
app.use('/api/stays', require('./routes/stays'));
app.use('/api', require('./routes/rides'));
app.use('/api', require('./routes/guides'));
app.use('/api', require('./routes/safety'));
app.use('/api/reviews', require('./routes/reviews'));

// Root check endpoint
app.get('/', (req, res) => {
    res.send('Safemate API server running...');
});

// Start Server
const PORT = process.env.PORT || 3001;

async function startServer() {
    try {
        await connectDB();
        if (!process.env.VERCEL) {
            app.listen(PORT, () => {
                console.log(`Safemate MongoDB server running on http://localhost:${PORT}`);
            });
        }
    } catch (err) {
        console.error('Failed to start server:', err.message);
        process.exit(1);
    }
}

startServer();

module.exports = app;
