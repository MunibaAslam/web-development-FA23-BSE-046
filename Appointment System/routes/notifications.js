const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get notifications by email
router.get('/:email', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT * FROM notifications WHERE user_email = ? ORDER BY created_at DESC LIMIT 50',
            [req.params.email]
        );
        res.json({ success: true, notifications: rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching notifications' });
    }
});

// Mark notification as read
router.put('/read/:id', async (req, res) => {
    try {
        await db.query('UPDATE notifications SET is_read = TRUE WHERE id = ?', [req.params.id]);
        res.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error updating notification' });
    }
});

// Get unread count
router.get('/unread/:email', async (req, res) => {
    try {
        const [rows] = await db.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_email = ? AND is_read = FALSE',
            [req.params.email]
        );
        res.json({ success: true, unread_count: rows[0].count });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Error fetching unread count' });
    }
});

module.exports = router;