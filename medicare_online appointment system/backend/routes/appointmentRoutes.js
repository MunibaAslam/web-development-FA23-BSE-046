const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

router.post('/', authenticateToken, authorizeRole(['patient']), appointmentController.createAppointment);
router.get('/:userId', authenticateToken, appointmentController.listUserAppointments);
router.put('/:id', authenticateToken, appointmentController.updateAppointment);
router.delete('/:id', authenticateToken, appointmentController.deleteAppointment);

module.exports = router;
