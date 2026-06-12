const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all doctors
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM doctors WHERE status = TRUE ORDER BY name');
        res.json({ success: true, doctors: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching doctors' });
    }
});

// Get doctor by ID
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM doctors WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }
        res.json({ success: true, doctor: rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching doctor' });
    }
});

module.exports = router;