const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Submit feedback
router.post('/', async (req, res) => {
    const { 
        patient_name, 
        patient_email, 
        doctor_id, 
        rating, 
        comment, 
        treatment_experience, 
        behaviour_rating, 
        recommend 
    } = req.body;
    
    if (!patient_name || !patient_email || !doctor_id || !rating) {
        return res.status(400).json({ success: false, message: 'Please fill required fields' });
    }
    
    try {
        const [result] = await db.query(
            'INSERT INTO feedback (patient_name, patient_email, doctor_id, rating, comment, treatment_experience, behaviour_rating, recommend) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [patient_name, patient_email, doctor_id, rating, comment || null, treatment_experience || null, behaviour_rating || null, recommend !== undefined ? recommend : true]
        );
        
        // Create notification for feedback
        const [doctor] = await db.query('SELECT name FROM doctors WHERE id = ?', [doctor_id]);
        const message = `Thank you for your feedback about Dr. ${doctor[0].name}. We appreciate your review!`;
        await db.query(
            'INSERT INTO notifications (user_email, message, type) VALUES (?, ?, ?)',
            [patient_email, message, 'appointment']
        );
        
        res.json({ success: true, message: 'Thank you for your feedback!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error submitting feedback' });
    }
});

// Get feedback for a doctor
router.get('/doctor/:doctorId', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM feedback WHERE doctor_id = ? ORDER BY created_at DESC',
            [req.params.doctorId]
        );
        res.json({ success: true, feedback: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching feedback' });
    }
});

// Get average rating for a doctor
router.get('/rating/:doctorId', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews, AVG(behaviour_rating) as avg_behaviour FROM feedback WHERE doctor_id = ?',
            [req.params.doctorId]
        );
        res.json({ success: true, rating: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching rating' });
    }
});

// Get all feedback (for admin)
router.get('/all', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT f.*, d.name as doctor_name FROM feedback f JOIN doctors d ON f.doctor_id = d.id ORDER BY f.created_at DESC LIMIT 50'
        );
        res.json({ success: true, feedback: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching feedback' });
    }
});

module.exports = router;