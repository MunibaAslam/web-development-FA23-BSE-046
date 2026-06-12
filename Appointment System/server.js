const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const doctorRoutes = require('./routes/doctors');
const appointmentRoutes = require('./routes/appointments');
const notificationRoutes = require('./routes/notifications');
// Pehle se hui routes ke saath ye bhi add karein
const feedbackRoutes = require('./routes/feedback');
app.use('/api/feedback', feedbackRoutes);
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes.router);

app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Database: ${process.env.DB_NAME} on ${process.env.DB_HOST}`);
});