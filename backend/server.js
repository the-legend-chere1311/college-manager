require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const taskRoutes = require('./routes/taskRoutes');
const examRoutes = require('./routes/examRoutes');
const aiRoutes = require('./routes/aiRoutes');
const spotifyRoutes = require('./routes/spotifyRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
const corsOptions = {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://127.0.0.1:5500'],
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));


// Database Connection
const mongoUri = process.env.MONGO_URI;

mongoose.connect(mongoUri, {
    maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE) || 10,
    minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE) || 5,
})
    .then(() => {
        console.log(`Connected to MongoDB at ${mongoUri}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    })
    .catch((err) => {
        console.error('Database connection error:', err);
        process.exit(1);
    });

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'School Manager API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// API Routes
const apiPrefix = process.env.API_PREFIX || '';
app.use(`${apiPrefix}/tasks`, taskRoutes);
app.use(`${apiPrefix}/exams`, examRoutes);
app.use(`${apiPrefix}/ai`, aiRoutes);
app.use(`${apiPrefix}/spotify`, spotifyRoutes);

// 404 Handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.originalUrl}`,
        availableRoutes: ['/health', '/tasks', '/exams', '/ai', '/spotify']
    });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
    });
});

// Start Server 
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📋 Tasks API: http://localhost:${PORT}/tasks`);
    console.log(`📝 Exams API: http://localhost:${PORT}/exams`);
    console.log(`🤖 AI Chat API: http://localhost:${PORT}/ai`);
    console.log(`🎵 Spotify API: http://localhost:${PORT}/spotify`);
    if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Development mode - Detailed error messages enabled');
    }
});


