const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Create appointment
router.post('/', async (req, res) => {
    const { patient_name, patient_email, patient_phone, doctor_id, appointment_date, appointment_time, symptoms } = req.body;
    
    // Validation
    if (!patient_name || !patient_email || !patient_phone || !doctor_id || !appointment_date || !appointment_time) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    try {
        // Check if doctor exists
        const [doctor] = await db.query('SELECT * FROM doctors WHERE id = ? AND status = TRUE', [doctor_id]);
        if (doctor.length === 0) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }
        
        // Check if slot is already booked
        const [existing] = await db.query(
            'SELECT * FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status != "cancelled"',
            [doctor_id, appointment_date, appointment_time]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'This time slot is already booked' });
        }
        
        // Create appointment
        const [result] = await db.query(
            'INSERT INTO appointments (patient_name, patient_email, patient_phone, doctor_id, appointment_date, appointment_time, symptoms) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [patient_name, patient_email, patient_phone, doctor_id, appointment_date, appointment_time, symptoms || null]
        );
        
        // Create notification
        const message = `Appointment booked with Dr. ${doctor[0].name} on ${appointment_date} at ${appointment_time}`;
        await db.query(
            'INSERT INTO notifications (user_email, message, type) VALUES (?, ?, ?)',
            [patient_email, message, 'appointment']
        );
        
        res.json({ 
            success: true, 
            message: 'Appointment booked successfully!',
            appointment_id: result.insertId 
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error booking appointment' });
    }
});

// Get appointments by email
router.get('/user/:email', async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT a.*, d.name as doctor_name, d.specialization 
             FROM appointments a 
             JOIN doctors d ON a.doctor_id = d.id 
             WHERE a.patient_email = ? 
             ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
            [req.params.email]
        );
        res.json({ success: true, appointments: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching appointments' });
    }
});

// Cancel appointment
router.put('/cancel/:id', async (req, res) => {
    try {
        const [appointment] = await db.query('SELECT * FROM appointments WHERE id = ?', [req.params.id]);
        
        if (appointment.length === 0) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }
        
        await db.query('UPDATE appointments SET status = ? WHERE id = ?', ['cancelled', req.params.id]);
        
        // Create cancellation notification
        const message = `Your appointment scheduled for ${appointment[0].appointment_date} at ${appointment[0].appointment_time} has been cancelled`;
        await db.query(
            'INSERT INTO notifications (user_email, message, type) VALUES (?, ?, ?)',
            [appointment[0].patient_email, message, 'cancellation']
        );
        
        res.json({ success: true, message: 'Appointment cancelled successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error cancelling appointment' });
    }
});

module.exports = router;