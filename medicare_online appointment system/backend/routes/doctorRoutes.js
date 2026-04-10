const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

router.get('/', authenticateToken, authorizeRole(['patient', 'admin', 'doctor']), doctorController.listDoctors);
router.get('/profile', authenticateToken, authorizeRole(['doctor']), doctorController.getDoctorProfile);
router.get('/appointments', authenticateToken, authorizeRole(['doctor']), doctorController.getAssignedAppointments);
router.put('/availability', authenticateToken, authorizeRole(['doctor']), doctorController.updateAvailability);
router.put('/appointments/:id/status', authenticateToken, authorizeRole(['doctor']), doctorController.acceptRejectAppointment);

module.exports = router;
